<?php
require_once __DIR__ . '/db.php';

$user = requireAuth();
$action = $_GET['action'] ?? '';

if (!in_array($user['role'], ['administrateur'])) {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

$db = getGestionDB();

switch ($action) {
    case 'list':
        $result = paginate($db, "SELECT * FROM membres ORDER BY nom, prenom");
        sendResponse(['success' => true] + $result);
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM membres WHERE id = ?");
        $stmt->execute([$id]);
        $membre = $stmt->fetch();
        if ($membre) {
            sendResponse(['success' => true, 'data' => $membre]);
        } else {
            sendResponse(['error' => 'Membre non trouvé'], 404);
        }
        break;

    case 'search':
        $q = $_GET['q'] ?? '';
        $stmt = $db->prepare("SELECT * FROM membres WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ? ORDER BY nom");
        $searchTerm = "%{$q}%";
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
        sendResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['nom', 'prenom', 'role'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                sendResponse(['error' => "Champ requis: {$field}"], 400);
            }
        }
        // Validation de la photo (data URL image, refus du SVG, taille max 2 Mo)
        if (!empty($input['photo'])) {
            $imageCheck = validateImageDataUrl($input['photo'], 2097152);
            if (!$imageCheck['ok']) {
                sendResponse(['success' => false, 'error' => $imageCheck['error']], 400);
            }
        }
        $id = $input['id'] ?? bin2hex(random_bytes(8));
        $stmt = $db->prepare("
            INSERT INTO membres (id, nom, prenom, email, telephone, role, statut, date_adhesion, adresse, photo, anniversaire)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $input['nom'],
            $input['prenom'],
            $input['email'] ?? null,
            $input['telephone'] ?? null,
            $input['role'],
            $input['statut'] ?? 'actif',
            $input['dateAdhesion'] ?? date('Y-m-d'),
            $input['adresse'] ?? null,
            $input['photo'] ?? null,
            $input['anniversaire'] ?? null
        ]);
        sendResponse(['success' => true, 'id' => $id], 201);
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        // Validation de la photo (data URL image, refus du SVG, taille max 2 Mo)
        if (!empty($input['photo'])) {
            $imageCheck = validateImageDataUrl($input['photo'], 2097152);
            if (!$imageCheck['ok']) {
                sendResponse(['success' => false, 'error' => $imageCheck['error']], 400);
            }
        }
        $stmt = $db->prepare("
            UPDATE membres SET nom=?, prenom=?, email=?, telephone=?, role=?, statut=?, date_adhesion=?, adresse=?, photo=?, anniversaire=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ");
        $stmt->execute([
            $input['nom'],
            $input['prenom'],
            $input['email'] ?? null,
            $input['telephone'] ?? null,
            $input['role'],
            $input['statut'] ?? 'actif',
            $input['dateAdhesion'] ?? null,
            $input['adresse'] ?? null,
            $input['photo'] ?? null,
            $input['anniversaire'] ?? null,
            $input['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("DELETE FROM membres WHERE id = ?");
        $stmt->execute([$input['id']]);
        sendResponse(['success' => true]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
