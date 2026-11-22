<?php
/**
 * API de Gestion des Fournisseurs
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();

if (!in_array($user['role'], ['administrateur'])) {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

$db = getGestionDB();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        try {
            $result = paginate($db, "SELECT * FROM fournisseurs ORDER BY nom ASC");
            sendResponse(['success' => true] + $result);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'create':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || empty($data['nom'])) {
                throw new Exception("Le nom du fournisseur est obligatoire");
            }

            $id = uniqid('fourn_');
            $stmt = $db->prepare("INSERT INTO fournisseurs (id, nom, contact_nom, email, telephone, adresse, categorie, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bindValue(1, $id);
            $stmt->bindValue(2, $data['nom']);
            $stmt->bindValue(3, $data['contact_nom'] ?? '');
            $stmt->bindValue(4, $data['email'] ?? '');
            $stmt->bindValue(5, $data['telephone'] ?? '');
            $stmt->bindValue(6, $data['adresse'] ?? '');
            $stmt->bindValue(7, $data['categorie'] ?? 'Général');
            $stmt->bindValue(8, $data['notes'] ?? '');
            $stmt->execute();

            logAction("CREATE_FOURNISSEUR", "Création du fournisseur {$data['nom']} ({$id})");
            sendResponse(['success' => true, 'data' => ['id' => $id]]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'update':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || empty($data['id'])) {
                throw new Exception("L'ID du fournisseur est obligatoire");
            }

            $stmt = $db->prepare("UPDATE fournisseurs SET nom = ?, contact_nom = ?, email = ?, telephone = ?, adresse = ?, categorie = ?, notes = ? WHERE id = ?");
            $stmt->bindValue(1, $data['nom']);
            $stmt->bindValue(2, $data['contact_nom'] ?? '');
            $stmt->bindValue(3, $data['email'] ?? '');
            $stmt->bindValue(4, $data['telephone'] ?? '');
            $stmt->bindValue(5, $data['adresse'] ?? '');
            $stmt->bindValue(6, $data['categorie'] ?? 'Général');
            $stmt->bindValue(7, $data['notes'] ?? '');
            $stmt->bindValue(8, $data['id']);
            $stmt->execute();

            logAction("UPDATE_FOURNISSEUR", "Mise à jour du fournisseur ID {$data['id']}");
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'delete':
        try {
            $id = $_GET['id'] ?? '';
            if (!$id) throw new Exception("L'ID est obligatoire");

            $stmt = $db->prepare("DELETE FROM fournisseurs WHERE id = ?");
            $stmt->bindValue(1, $id);
            $stmt->execute();

            logAction("DELETE_FOURNISSEUR", "Suppression du fournisseur ID {$id}");
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Action non reconnue'], 400);
}
