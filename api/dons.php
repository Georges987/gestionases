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
        if (!empty($_GET['projet_id'])) {
            $where .= ' AND projet_id = ?';
            $params[] = $_GET['projet_id'];
        }
        if (!empty($_GET['statut'])) {
            $where .= ' AND statut = ?';
            $params[] = $_GET['statut'];
        }
        $sql = "SELECT * FROM dons WHERE {$where} ORDER BY date DESC";
        $result = paginate($db, $sql, $params);
        sendResponse(['success' => true] + $result);
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM dons WHERE id = ?");
        $stmt->execute([$id]);
        $don = $stmt->fetch();
        if ($don) {
            sendResponse(['success' => true, 'data' => $don]);
        } else {
            sendResponse(['error' => 'Don non trouvé'], 404);
        }
        break;

    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['donateur', 'montant', 'date'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                sendResponse(['error' => "Champ requis: {$field}"], 400);
            }
        }
        $id = $input['id'] ?? bin2hex(random_bytes(8));
        $stmt = $db->prepare("
            INSERT INTO dons (id, donateur, email, montant, devise, date, type, projet_id, statut, recu, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $input['donateur'],
            $input['email'] ?? '',
            $input['montant'],
            $input['devise'] ?? 'FCFA',
            $input['date'],
            $input['type'] ?? 'financier',
            $input['projetId'] ?? null,
            $input['statut'] ?? 'recu',
            $input['recu'] ? 1 : 0,
            $input['notes'] ?? ''
        ]);
        sendResponse(['success' => true, 'id' => $id], 201);
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("
            UPDATE dons SET donateur=?, email=?, montant=?, devise=?, date=?, type=?, projet_id=?, statut=?, recu=?, notes=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ");
        $stmt->execute([
            $input['donateur'],
            $input['email'] ?? '',
            $input['montant'],
            $input['devise'] ?? 'FCFA',
            $input['date'],
            $input['type'] ?? 'financier',
            $input['projetId'] ?? null,
            $input['statut'] ?? 'recu',
            $input['recu'] ? 1 : 0,
            $input['notes'] ?? '',
            $input['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("DELETE FROM dons WHERE id = ?");
        $stmt->execute([$input['id']]);
        sendResponse(['success' => true]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
