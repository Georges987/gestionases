<?php
/**
 * API de Gestion des Commandes Fournisseurs
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
            $paginated = paginate($db, "
                SELECT c.*, f.nom as fournisseur_nom 
                FROM commandes_fournisseurs c 
                JOIN fournisseurs f ON c.fournisseur_id = f.id 
                ORDER BY c.date_commande DESC
            ");
            
            foreach ($paginated['data'] as &$row) {
                $orderId = $row['id'];
                $items = $db->query("SELECT * FROM commande_articles WHERE commande_id = '$orderId'")->fetchAll();
                $row['articles'] = $items;
            }
            sendResponse(['success' => true] + $paginated);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'create':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || empty($data['fournisseur_id'])) {
                throw new Exception("Le fournisseur est obligatoire");
            }

            $db->beginTransaction();

            $orderId = uniqid('cmd_');
            $stmt = $db->prepare("INSERT INTO commandes_fournisseurs (id, fournisseur_id, date_commande, statut, montant_total, devise, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $orderId, 
                $data['fournisseur_id'], 
                $data['date_commande'], 
                $data['statut'] ?? 'en_attente', 
                $data['montant_total'] ?? 0, 
                $data['devise'] ?? 'FCFA', 
                $data['notes'] ?? ''
            ]);

            if (!empty($data['articles'])) {
                $stmtArt = $db->prepare("INSERT INTO commande_articles (id, commande_id, article_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?, ?)");
                foreach ($data['articles'] as $art) {
                    $stmtArt->execute([uniqid('art_'), $orderId, $art['article_id'], $art['quantite'], $art['prix_unitaire']]);
                }
            }

            $db->commit();
            logAction($user['id'], "CREATE_COMMANDE", "Création de la commande {$orderId}");
            sendResponse(['success' => true, 'data' => ['id' => $orderId]]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'update_statut':
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $data['id'] ?? '';
            $newStatut = $data['statut'] ?? '';

            if (!$id || !$newStatut) throw new Exception("ID et statut obligatoires");

            $db->beginTransaction();

            // Update status
            $stmt = $db->prepare("UPDATE commandes_fournisseurs SET statut = ? WHERE id = ?");
            $stmt->execute([$newStatut, $id]);

            // If status becomes 'recue', update stock articles
            if ($newStatut === 'recue') {
                $items = $db->prepare("SELECT * FROM commande_articles WHERE commande_id = ?");
                $items->execute([$id]);
                foreach ($items->fetchAll() as $item) {
                    $stmtStock = $db->prepare("UPDATE stock_articles SET quantite = quantite + ? WHERE id = ?");
                    $stmtStock->execute([$item['quantite'], $item['article_id']]);
                    
                    // Create a movement log for stock
                    $stmtMvt = $db->prepare("INSERT INTO stock_mouvements (id, article_id, type, quantite, motif, date) VALUES (?, ?, 'entree', ?, ?, ?)");
                    $stmtMvt->execute([uniqid('mvt_'), $item['article_id'], $item['quantite'], "Réception commande {$id}", date('Y-m-d')]);
                }
            }

            $db->commit();
            logAction($user['id'], "UPDATE_COMMANDE_STATUT", "Statut de la commande {$id} passé à {$newStatut}");
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    case 'delete':
        try {
            $id = $_GET['id'] ?? '';
            if (!$id) throw new Exception("L'ID est obligatoire");

            $db->beginTransaction();
            $db->prepare("DELETE FROM commande_articles WHERE commande_id = ?")->execute([$id]);
            $stmt = $db->prepare("DELETE FROM commandes_fournisseurs WHERE id = ?");
            $stmt->execute([$id]);
            $db->commit();

            logAction($user['id'], "DELETE_COMMANDE", "Suppression de la commande {$id}");
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            sendResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['success' => false, 'error' => 'Action non reconnue'], 400);
}
