<?php
/**
 * API d'authentification - SQLite
 * Endpoints : login, verify, register, change-password, list-users, delete-user
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'login': handleLogin(); break;
    case 'verify': handleVerify(); break;
    case 'register': handleRegister(); break;
    case 'change-password': handleChangePassword(); break;
    case 'list-users': handleListUsers(); break;
    case 'delete-user': handleDeleteUser(); break;
    case 'toggle-user': handleToggleUser(); break;
    default: sendResponse(['success' => false, 'error' => 'Action invalide'], 400);
}

function validatePassword($password) {
    if (strlen($password) < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    if (!preg_match('/[0-9]/', $password)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (!preg_match('/[A-Z]/', $password)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!preg_match('/[^a-zA-Z0-9]/', $password)) return 'Le mot de passe doit contenir au moins un caractère spécial';
    return null;
}

// Enregistrer un échec de connexion et verrouiller après 5 tentatives (15 min)
function registerLoginFailure($pdo, $email) {
    $stmt = $pdo->prepare('SELECT attempts FROM login_attempts WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    $attempts = ($row ? (int)$row['attempts'] : 0) + 1;
    
    if ($attempts >= 5) {
        $lockedUntil = (string)(time() + 15 * 60); // epoch Unix — robuste aux fuseaux
        $ins = $pdo->prepare("INSERT INTO login_attempts (email, attempts, locked_until) VALUES (?, ?, ?)
                              ON CONFLICT(email) DO UPDATE SET attempts=excluded.attempts, locked_until=excluded.locked_until");
        $ins->execute([$email, $attempts, $lockedUntil]);
    } else {
        $ins = $pdo->prepare("INSERT INTO login_attempts (email, attempts, locked_until) VALUES (?, ?, NULL)
                              ON CONFLICT(email) DO UPDATE SET attempts=excluded.attempts, locked_until=NULL");
        $ins->execute([$email, $attempts]);
    }
}

function handleLogin() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        sendResponse(['success' => false, 'error' => 'Email et mot de passe requis'], 400);
    }
    
    $pdo = getDBConnection();
    
    // ── Rate limiting : vérifier si le compte est verrouillé ──
    $lockStmt = $pdo->prepare('SELECT attempts, locked_until FROM login_attempts WHERE email = ?');
    $lockStmt->execute([$email]);
    $lock = $lockStmt->fetch();
    if ($lock && !empty($lock['locked_until']) && (int)$lock['locked_until'] > time()) {
        $remaining = (int)ceil(((int)$lock['locked_until'] - time()) / 60);
        sendResponse(['success' => false, 'error' => "Compte temporairement verrouillé. Réessayez dans {$remaining} minute(s)."], 429);
    }
    
    $stmt = $pdo->prepare('SELECT id, nom, email, password_hash, role FROM utilisateurs WHERE email = ? AND actif = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        registerLoginFailure($pdo, $email);
        sendResponse(['success' => false, 'error' => 'Email ou mot de passe incorrect'], 401);
    }
    
    // Connexion réussie : réinitialiser le compteur d'échecs
    $resetStmt = $pdo->prepare('DELETE FROM login_attempts WHERE email = ?');
    $resetStmt->execute([$email]);
    
    $updateStmt = $pdo->prepare('UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = ?');
    $updateStmt->execute([$user['id']]);
    
    $token = generateJWT($user);
    
    // Sécurisation : Envoi du token via un cookie HttpOnly
    setcookie('auth_token', $token, [
        'expires' => time() + JWT_EXPIRY,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    
    sendResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'nom' => $user['nom'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]
    ]);
}

function handleRegister() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['success' => false, 'error' => 'Authentification requise'], 401);
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['success' => false, 'error' => 'Token invalide'], 401);
    }
    
    if ($payload['role'] !== 'administrateur') {
        sendResponse(['success' => false, 'error' => 'Accès refusé'], 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $nom = $input['nom'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'lecteur';
    
    if (empty($nom) || empty($email) || empty($password)) {
        sendResponse(['success' => false, 'error' => 'Tous les champs sont requis'], 400);
    }

    if ($err = validatePassword($password)) {
        sendResponse(['success' => false, 'error' => $err], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['success' => false, 'error' => 'Email invalide'], 400);
    }
    
    $pdo = getDBConnection();
    $checkStmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        sendResponse(['success' => false, 'error' => 'Cet email est déjà utilisé'], 409);
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    // RETURNING id fonctionne sur PostgreSQL et SQLite (≥ 3.35) — remplace lastInsertId() qui n'est pas portable
    $stmt = $pdo->prepare('INSERT INTO utilisateurs (nom, email, password_hash, role, actif) VALUES (?, ?, ?, ?, 1) RETURNING id');
    $stmt->execute([$nom, $email, $passwordHash, $role]);
    $newId = $stmt->fetchColumn();

    sendResponse([
        'success' => true,
        'message' => 'Utilisateur créé avec succès',
        'user_id' => (int)$newId
    ], 201);
}

function handleChangePassword() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['success' => false, 'error' => 'Authentification requise'], 401);
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['success' => false, 'error' => 'Token invalide'], 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword)) {
        sendResponse(['success' => false, 'error' => 'Tous les champs sont requis'], 400);
    }

    if ($err = validatePassword($newPassword)) {
        sendResponse(['success' => false, 'error' => $err], 400);
    }
    
    if (strlen($newPassword) < 6) {
        sendResponse(['success' => false, 'error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
    }
    
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('SELECT password_hash FROM utilisateurs WHERE id = ?');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        sendResponse(['success' => false, 'error' => 'Mot de passe actuel incorrect'], 401);
    }
    
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $pdo->prepare('UPDATE utilisateurs SET password_hash = ? WHERE id = ?');
    $updateStmt->execute([$newHash, $payload['sub']]);
    
    sendResponse(['success' => true, 'message' => 'Mot de passe modifié avec succès']);
}

function handleListUsers() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['success' => false, 'error' => 'Authentification requise'], 401);
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['success' => false, 'error' => 'Token invalide'], 401);
    }
    
    if ($payload['role'] !== 'administrateur') {
        sendResponse(['success' => false, 'error' => 'Accès refusé'], 403);
    }
    
    $pdo = getDBConnection();
    $stmt = $pdo->query('SELECT id, nom, email, role, actif, date_creation, derniere_connexion FROM utilisateurs ORDER BY date_creation DESC');
    $users = $stmt->fetchAll();
    
    foreach ($users as &$u) {
        $u['id'] = (int)$u['id'];
        $u['actif'] = (bool)$u['actif'];
    }
    
    sendResponse(['success' => true, 'users' => $users]);
}

function handleDeleteUser() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['success' => false, 'error' => 'Authentification requise'], 401);
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['success' => false, 'error' => 'Token invalide'], 401);
    }
    
    if ($payload['role'] !== 'administrateur') {
        sendResponse(['success' => false, 'error' => 'Accès refusé'], 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? '';
    
    if (empty($userId)) {
        sendResponse(['success' => false, 'error' => 'ID utilisateur requis'], 400);
    }
    
    if ($userId == $payload['sub']) {
        sendResponse(['success' => false, 'error' => 'Vous ne pouvez pas supprimer votre propre compte'], 400);
    }
    
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
    $stmt->execute([$userId]);
    
    sendResponse(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
}

function handleToggleUser() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['success' => false, 'error' => 'Authentification requise'], 401);
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['success' => false, 'error' => 'Token invalide'], 401);
    }
    
    if ($payload['role'] !== 'administrateur') {
        sendResponse(['success' => false, 'error' => 'Accès refusé'], 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? '';
    $actif = $input['actif'] ?? true;
    
    if (empty($userId)) {
        sendResponse(['success' => false, 'error' => 'ID utilisateur requis'], 400);
    }
    
    if ($userId == $payload['sub']) {
        sendResponse(['success' => false, 'error' => 'Vous ne pouvez pas désactiver votre propre compte'], 400);
    }
    
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('UPDATE utilisateurs SET actif = ? WHERE id = ?');
    $stmt->execute([$actif ? 1 : 0, $userId]);
    
    sendResponse(['success' => true, 'message' => $actif ? 'Utilisateur activé' : 'Utilisateur désactivé']);
}
