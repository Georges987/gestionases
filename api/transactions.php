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
        if (!empty($_GET['type'])) {
            $where .= ' AND type = ?';
            $params[] = $_GET['type'];
        }
        if (!empty($_GET['projet_id'])) {
            $where .= ' AND projet_id = ?';
            $params[] = $_GET['projet_id'];
        }
        if (!empty($_GET['date_debut'])) {
            $where .= ' AND date >= ?';
            $params[] = $_GET['date_debut'];
        }
        if (!empty($_GET['date_fin'])) {
            $where .= ' AND date <= ?';
            $params[] = $_GET['date_fin'];
        }
        $sql = "SELECT * FROM transactions WHERE {$where} ORDER BY date DESC";
        $result = paginate($db, $sql, $params);
        sendResponse(['success' => true] + $result);
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$id]);
        $transaction = $stmt->fetch();
        if ($transaction) {
            sendResponse(['success' => true, 'data' => $transaction]);
        } else {
            sendResponse(['error' => 'Transaction non trouvée'], 404);
        }
        break;

    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['libelle', 'montant', 'type', 'date'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                sendResponse(['error' => "Champ requis: {$field}"], 400);
            }
        }
        if (!in_array($input['type'], ['recette', 'depense'])) {
            sendResponse(['error' => 'Type invalide (recette/depense)'], 400);
        }
        $id = $input['id'] ?? bin2hex(random_bytes(8));
        $stmt = $db->prepare("
            INSERT INTO transactions (id, libelle, montant, type, categorie, date, projet_id, validee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $input['libelle'],
            $input['montant'],
            $input['type'],
            $input['categorie'] ?? '',
            $input['date'],
            $input['projetId'] ?? null,
            $input['validee'] ? 1 : 0
        ]);
        sendResponse(['success' => true, 'id' => $id], 201);
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("
            UPDATE transactions SET libelle=?, montant=?, type=?, categorie=?, date=?, projet_id=?, validee=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ");
        $stmt->execute([
            $input['libelle'],
            $input['montant'],
            $input['type'],
            $input['categorie'] ?? '',
            $input['date'],
            $input['projetId'] ?? null,
            $input['validee'] ? 1 : 0,
            $input['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("DELETE FROM transactions WHERE id = ?");
        $stmt->execute([$input['id']]);
        sendResponse(['success' => true]);
        break;

    case 'stats':
        $stmt = $db->query("
            SELECT
                SUM(CASE WHEN type='recette' THEN montant ELSE 0 END) as total_recettes,
                SUM(CASE WHEN type='depense' THEN montant ELSE 0 END) as total_depenses,
                COUNT(*) as total_transactions
            FROM transactions
        ");
        sendResponse(['success' => true, 'data' => $stmt->fetch()]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
