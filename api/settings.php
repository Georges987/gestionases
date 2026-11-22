<?php
require_once __DIR__ . '/db.php';

$user = requireAuth();
$action = $_GET['action'] ?? '';

if (!in_array($user['role'], ['administrateur'])) {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

$db = getGestionDB();

switch ($action) {
    case 'get':
        $stmt = $db->prepare("SELECT value FROM settings WHERE key = 'ong'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            sendResponse(['success' => true, 'data' => json_decode($row['value'], true)]);
        } else {
            sendResponse(['error' => 'Paramètres non trouvés'], 404);
        }
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Whitelist des champs acceptés pour la mise à jour des settings
        $allowedFields = ['nom', 'slogan', 'email', 'telephone', 'adresse', 'siteWeb', 'devise', 'primaryColor', 'logo'];
        $filtered = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $filtered[$field] = $input[$field];
            }
        }
        
        if (empty($filtered['nom']) || trim($filtered['nom']) === '' || strlen($filtered['nom']) > 100) {
            sendResponse(['success' => false, 'error' => 'Le nom de l\'ONG est obligatoire et doit faire moins de 100 caractères'], 400);
        }

        if (!empty($filtered['email']) && !filter_var($filtered['email'], FILTER_VALIDATE_EMAIL)) {
            sendResponse(['success' => false, 'error' => 'L\'adresse email est invalide'], 400);
        }
        
        if (!empty($filtered['primaryColor']) && !preg_match('/^#[A-Fa-f0-9]{6}$/', $filtered['primaryColor'])) {
            sendResponse(['success' => false, 'error' => 'Le code couleur doit être un hexadécimal de 6 caractères (ex: #0d9488)'], 400);
        }

        // S'assurer que primaryColor a une valeur par défaut si omis
        if (empty($filtered['primaryColor'])) {
            $filtered['primaryColor'] = '#0d9488';
        }

        // Validation du logo (data URL image, refus du SVG, taille max 2 Mo)
        if (isset($filtered['logo']) && $filtered['logo'] !== '') {
            $imageCheck = validateImageDataUrl($filtered['logo'], 2097152);
            if (!$imageCheck['ok']) {
                sendResponse(['success' => false, 'error' => $imageCheck['error']], 400);
            }
        }

        $value = json_encode($filtered);
        // UPSERT compatible PostgreSQL et SQLite
        if (DB_DRIVER === 'postgres') {
            $stmt = $db->prepare("INSERT INTO settings (key, value) VALUES ('ong', ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value");
        } else {
            $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ong', ?)");
        }
        $stmt->execute([$value]);
        
        logAction($user['sub'], 'update_settings', 'Mise à jour des paramètres de l\'ONG (champs filtrés)');
        
        sendResponse(['success' => true]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
