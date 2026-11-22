<?php
/**
 * API Audit Logs - SQLite
 * Endpoint : list
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();

if ($user['role'] !== 'administrateur') {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $db = getGestionDB();
        $result = paginate($db, "SELECT * FROM audit_logs ORDER BY timestamp DESC");
        sendResponse(['success' => true] + $result);
        break;
        
    default:
        sendResponse(['success' => false, 'error' => 'Action invalide'], 400);
}
