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
        if (!empty($_GET['categorie'])) {
            $where .= ' AND categorie = ?';
            $params[] = $_GET['categorie'];
        }
        $sql = "SELECT * FROM projets WHERE {$where} ORDER BY date_debut DESC";
        $result = paginate($db, $sql, $params);
        sendResponse(['success' => true] + $result);
        break;

    case 'get':
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM projets WHERE id = ?");
        $stmt->execute([$id]);
        $projet = $stmt->fetch();
        if ($projet) {
            sendResponse(['success' => true, 'data' => $projet]);
        } else {
            sendResponse(['error' => 'Projet non trouvé'], 404);
        }
        break;

    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['titre'])) {
            sendResponse(['error' => 'Champ requis: titre'], 400);
        }
        $id = $input['id'] ?? bin2hex(random_bytes(8));
        $stmt = $db->prepare("
            INSERT INTO projets (id, titre, description, responsable, statut, date_debut, date_fin, budget, depenses, categorie, beneficiaires, localisation, progression)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $input['titre'],
            $input['description'] ?? '',
            $input['responsable'] ?? '',
            $input['statut'] ?? 'en_cours',
            $input['dateDebut'] ?? null,
            $input['dateFin'] ?? null,
            $input['budget'] ?? 0,
            $input['depenses'] ?? 0,
            $input['categorie'] ?? '',
            $input['beneficiaires'] ?? 0,
            $input['localisation'] ?? '',
            $input['progression'] ?? 0
        ]);
        sendResponse(['success' => true, 'id' => $id], 201);
        break;

    case 'update':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("
            UPDATE projets SET titre=?, description=?, responsable=?, statut=?, date_debut=?, date_fin=?, budget=?, depenses=?, categorie=?, beneficiaires=?, localisation=?, progression=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ");
        $stmt->execute([
            $input['titre'],
            $input['description'] ?? '',
            $input['responsable'] ?? '',
            $input['statut'] ?? 'en_cours',
            $input['dateDebut'] ?? null,
            $input['dateFin'] ?? null,
            $input['budget'] ?? 0,
            $input['depenses'] ?? 0,
            $input['categorie'] ?? '',
            $input['beneficiaires'] ?? 0,
            $input['localisation'] ?? '',
            $input['progression'] ?? 0,
            $input['id']
        ]);
        sendResponse(['success' => true]);
        break;

    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) {
            sendResponse(['error' => 'ID requis'], 400);
        }
        $stmt = $db->prepare("DELETE FROM projets WHERE id = ?");
        $stmt->execute([$input['id']]);
        sendResponse(['success' => true]);
        break;

    default:
        sendResponse(['error' => 'Action invalide'], 400);
}
