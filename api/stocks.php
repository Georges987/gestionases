<?php
/**
 * API Gestion des Stocks - SQLite
 * Endpoints : list, get, create, update, delete pour articles, categories, mouvements
 * Utilise la base de données gestion.db via db.php
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Authentification requise pour toutes les actions sauf list (si on veut le rendre public)
// Ici on l'impose partout pour la sécurité
$user = requireAuth();

$entity = $_GET['entity'] ?? '';
$action = $_GET['action'] ?? '';

$db = getGestionDB();


switch ($entity) {
    case 'articles':
        handleArticle($db, $action);
        break;
    case 'categories':
        handleCategorie($db, $action);
        break;
    case 'mouvements':
        handleMouvement($db, $action);
        break;
    default:
        sendResponse(['success' => false, 'error' => 'Entité invalide'], 400);
}

function handleArticle($db, $action) {
    switch ($action) {
        case 'list':
            $lowStock = $_GET['low_stock'] ?? '';
            $categorieId = $_GET['categorie_id'] ?? '';
            
            $sql = "SELECT a.*, c.nom as categorie_nom 
                    FROM stock_articles a 
                    LEFT JOIN stock_categories c ON a.categorie_id = c.id 
                    WHERE 1=1";
            $params = [];
            
            if ($lowStock === 'true') {
                $sql .= " AND a.quantite <= a.seuil_alerte";
            }
            if ($categorieId) {
                $sql .= " AND a.categorie_id = ?";
                $params[] = $categorieId;
            }
            
            $sql .= " ORDER BY a.nom ASC";
            $result = paginate($db, $sql, $params);
            sendResponse(['success' => true] + $result);
            break;
            
        case 'get':
            $id = $_GET['id'] ?? '';
            $stmt = $db->prepare("SELECT a.*, c.nom as categorie_nom FROM stock_articles a LEFT JOIN stock_categories c ON a.categorie_id = c.id WHERE a.id = ?");
            $stmt->execute([$id]);
            $article = $stmt->fetch();
            
            if ($article) {
                $mvtStmt = $db->prepare("SELECT m.*, a.nom as article_nom FROM stock_mouvements m JOIN stock_articles a ON m.article_id = a.id WHERE m.article_id = ? ORDER BY m.date DESC");
                $mvtStmt->execute([$id]);
                $article['mouvements'] = $mvtStmt->fetchAll();
                
                sendResponse(['success' => true, 'data' => $article]);
            }
            sendResponse(['success' => false, 'error' => 'Article non trouvé'], 404);
            break;
            
        case 'create':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['nom'])) {
                sendResponse(['success' => false, 'error' => 'Nom requis'], 400);
            }
            
            $id = $input['id'] ?? bin2hex(random_bytes(8));
            $stmt = $db->prepare("INSERT INTO stock_articles (id, nom, description, categorie_id, quantite, seuil_alerte, unite) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $input['nom'],
                $input['description'] ?? '',
                $input['categorie_id'] ?: null,
                $input['quantite'] ?? 0,
                $input['seuil_alerte'] ?? 5,
                $input['unite'] ?? 'unité'
            ]);
            
            logAction($user['sub'], 'create_article', "Création de l'article {$input['nom']} (ID: $id)");
            
            sendResponse(['success' => true, 'message' => 'Article créé', 'id' => $id], 201);
            break;
            
        case 'update':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['id']) || empty($input['nom'])) {
                sendResponse(['success' => false, 'error' => 'ID et nom requis'], 400);
            }
            
            $stmt = $db->prepare("UPDATE stock_articles SET nom = ?, description = ?, categorie_id = ?, quantite = ?, seuil_alerte = ?, unite = ? WHERE id = ?");
            $stmt->execute([
                $input['nom'],
                $input['description'] ?? '',
                $input['categorie_id'] ?: null,
                $input['quantite'] ?? 0,
                $input['seuil_alerte'] ?? 5,
                $input['unite'] ?? 'unité',
                $input['id']
            ]);
            
            sendResponse(['success' => true, 'message' => 'Article modifié']);
            break;
            
        case 'delete':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? '';
            
            $db->prepare("DELETE FROM stock_mouvements WHERE article_id = ?")->execute([$id]);
            $stmt = $db->prepare("DELETE FROM stock_articles WHERE id = ?");
            $stmt->execute([$id]);
            
            logAction($user['sub'], 'delete_article', "Suppression de l'article ID: $id");
            
            sendResponse(['success' => true, 'message' => 'Article supprimé']);
            break;
            
        default:
            sendResponse(['success' => false, 'error' => 'Action invalide'], 400);
    }
}

function handleCategorie($db, $action) {
    switch ($action) {
        case 'list':
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 100)));
            $stmt = $db->query("
                SELECT c.*, COUNT(a.id) as article_count 
                FROM stock_categories c 
                LEFT JOIN stock_articles a ON c.id = a.categorie_id 
                GROUP BY c.id 
                ORDER BY c.nom
                LIMIT $perPage OFFSET " . (($page - 1) * $perPage)
            );
            $categories = $stmt->fetchAll();
            $total = $db->query("SELECT COUNT(*) FROM stock_categories")->fetchColumn();
            
            sendResponse(['success' => true, 'data' => $categories, 'total' => (int)$total, 'page' => $page, 'perPage' => $perPage]);
            break;
            
        case 'create':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['nom'])) {
                sendResponse(['success' => false, 'error' => 'Nom requis'], 400);
            }
            
            $id = $input['id'] ?? bin2hex(random_bytes(8));
            try {
                $stmt = $db->prepare("INSERT INTO stock_categories (id, nom, description) VALUES (?, ?, ?)");
                $stmt->execute([$id, $input['nom'], $input['description'] ?? '']);
                sendResponse(['success' => true, 'message' => 'Catégorie créée', 'id' => $id], 201);
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                    sendResponse(['success' => false, 'error' => 'Cette catégorie existe déjà'], 400);
                }
                throw $e;
            }
            break;
            
        case 'update':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['id']) || empty($input['nom'])) {
                sendResponse(['success' => false, 'error' => 'ID et nom requis'], 400);
            }
            
            $stmt = $db->prepare("UPDATE stock_categories SET nom = ?, description = ? WHERE id = ?");
            $stmt->execute([$input['nom'], $input['description'] ?? '', $input['id']]);
            
            sendResponse(['success' => true, 'message' => 'Catégorie modifiée']);
            break;
            
        case 'delete':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? '';
            
            $check = $db->prepare("SELECT COUNT(*) as cnt FROM stock_articles WHERE categorie_id = ?");
            $check->execute([$id]);
            if ($check->fetch()['cnt'] > 0) {
                sendResponse(['success' => false, 'error' => 'Des articles utilisent cette catégorie'], 400);
            }
            
            $stmt = $db->prepare("DELETE FROM stock_categories WHERE id = ?");
            $stmt->execute([$id]);
            
            sendResponse(['success' => true, 'message' => 'Catégorie supprimée']);
            break;
            
        default:
            sendResponse(['success' => false, 'error' => 'Action invalide'], 400);
    }
}

function handleMouvement($db, $action) {
    switch ($action) {
        case 'list':
            $articleId = $_GET['article_id'] ?? '';
            
            $sql = "SELECT m.*, a.nom as article_nom FROM stock_mouvements m JOIN stock_articles a ON m.article_id = a.id WHERE 1=1";
            $params = [];
            
            if ($articleId) {
                $sql .= " AND m.article_id = ?";
                $params[] = $articleId;
            }
            
            $sql .= " ORDER by m.date DESC";
            $result = paginate($db, $sql, $params);
            sendResponse(['success' => true] + $result);
            break;
            
        case 'create':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['article_id']) || empty($input['type']) || empty($input['quantite'])) {
                sendResponse(['success' => false, 'error' => 'Champs requis manquants'], 400);
            }
            
            if (!in_array($input['type'], ['entree', 'sortie'])) {
                sendResponse(['success' => false, 'error' => 'Type de mouvement invalide'], 400);
            }
            
            $db->beginTransaction();
            
            try {
                $stmt = $db->prepare("SELECT quantite FROM stock_articles WHERE id = ?");
                $stmt->execute([$input['article_id']]);
                $article = $stmt->fetch();
                
                if (!$article) {
                    throw new Exception('Article non trouvé');
                }
                
                $newQty = $article['quantite'];
                if ($input['type'] === 'entree') {
                    $newQty += $input['quantite'];
                } else {
                    $newQty -= $input['quantite'];
                    if ($newQty < 0) {
                        throw new Exception('Stock insuffisant');
                    }
                }
                
                $id = $input['id'] ?? bin2hex(random_bytes(8));
                $stmt = $db->prepare("INSERT INTO stock_mouvements (id, article_id, type, quantite, motif, date) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $input['article_id'],
                    $input['type'],
                    $input['quantite'],
                    $input['motif'] ?? '',
                    $input['date'] ?? date('Y-m-d')
                ]);
                
                $stmt = $db->prepare("UPDATE stock_articles SET quantite = ? WHERE id = ?");
                $stmt->execute([$newQty, $input['article_id']]);
                
            $db->commit();
            logAction($user['sub'], 'stock_mouvement', "Mouvement {$input['type']} pour l'article {$input['article_id']} : {$input['quantite']} {$input['unite']}");
            sendResponse(['success' => true, 'message' => 'Mouvement enregistré']);
            
        } catch (Exception $e) {
                $db->rollBack();
                sendResponse(['success' => false, 'error' => $e->getMessage()], 400);
            }
            break;
            
        case 'delete':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? '';
            
            $stmt = $db->prepare("SELECT * FROM stock_mouvements WHERE id = ?");
            $stmt->execute([$id]);
            $mvt = $stmt->fetch();
            
            if ($mvt) {
                $db->beginTransaction();
                try {
                    $stmt = $db->prepare("SELECT quantite FROM stock_articles WHERE id = ?");
                    $stmt->execute([$mvt['article_id']]);
                    $article = $stmt->fetch();
                    
                    $newQty = $article['quantite'];
                    if ($mvt['type'] === 'entree') {
                        $newQty -= $mvt['quantite'];
                    } else {
                        $newQty += $mvt['quantite'];
                    }
                    
                    $stmt = $db->prepare("UPDATE stock_articles SET quantite = ? WHERE id = ?");
                    $stmt->execute([$newQty, $mvt['article_id']]);
                    
                    $stmt = $db->prepare("DELETE FROM stock_mouvements WHERE id = ?");
                    $stmt->execute([$id]);
                    
                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    sendResponse(['success' => false, 'error' => $e->getMessage()], 400);
                }
            }
            
            sendResponse(['success' => true, 'message' => 'Mouvement supprimé']);
            break;
            
        default:
            sendResponse(['success' => false, 'error' => 'Action invalide'], 400);
    }
}
