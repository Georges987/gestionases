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
        $where = '1=1';
        $params = [];
        if (!empty($_GET['statut'])) {
            $where .= ' AND statut = ?';
            $params[] = $_GET['statut'];
        }
        if (!empty($_GET['type'])) {
            $where .= ' AND type = ?';
            $params[] = $_GET['type'];
        }
        $sql = "SELECT * FROM evenements WHERE {$where} ORDER BY date DESC";
        $result = paginate($db, $sql, $params);
        sendResponse(['success' => true] + $result);
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM evenements WHERE id = ?");
        $stmt->execute([$id]);
        $evenement = $stmt->fetch();
        if ($evenement) {
            sendResponse(['success' => true, 'data' => $evenement]);
        } else {
            sendResponse(['error' => 'Événement non trouvé'], 404);
        }
        break;

    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['titre'])) {
            sendResponse(['error' => 'Champ requis: titre'], 400);
        }
        $id = $input['id'] ?? bin2hex(random_bytes(8));
        $stmt = $db->prepare("
            INSERT INTO evenements (id, titre, description, date, heure, lieu, type, statut, participants, responsable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $input['titre'],
            $input['description'] ?? '',
            $input['date'],
            $input['heure'] ?? '',
            $input['lieu'] ?? '',
            $input['type'] ?? 'autre',
            $input['statut'] ?? 'planifie',
            $input['participants'] ?? 0,
            $input['responsable'] ?? ''
        ]);
        sendResponse(['success' => true, 'id' => $id], 201);
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("
            UPDATE evenements SET titre=?, description=?, date=?, heure=?, lieu=?, type=?, statut=?, participants=?, responsable=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ");
        $stmt->execute([
            $input['titre'],
            $input['description'] ?? '',
            $input['date'],
            $input['heure'] ?? '',
            $input['lieu'] ?? '',
            $input['type'] ?? 'autre',
            $input['statut'] ?? 'planifie',
            $input['participants'] ?? 0,
            $input['responsable'] ?? '',
            $input['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("DELETE FROM evenements WHERE id = ?");
        $stmt->execute([$input['id']]);
        sendResponse(['success' => true]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
