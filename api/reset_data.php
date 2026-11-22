<?php
require_once __DIR__ . '/db.php';

$user = requireAuth();
if ($user['role'] !== 'administrateur') {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

try {
    $db = getGestionDB();
    
    // Supprimer toutes les données des tables (garder la structure)
    $tables = [
        'audit_logs',
        'commande_articles',
        'commandes_fournisseurs',
        'stock_mouvements',
        'stock_articles',
        'stock_categories',
        'fournisseurs',
        'evenements',
        'transactions',
        'dons',
        'projets',
        'membres'
    ];
    
    $deleted = 0;
    foreach ($tables as $table) {
        try {
            $db->exec("DELETE FROM $table");
            $deleted++;
            echo "  [OK] $table vidée\n";
        } catch (Exception $e) {
            echo "  [SKIP] $table: " . $e->getMessage() . "\n";
        }
    }
    
    // Réinitialiser les paramètres ONG par défaut (DELETE + INSERT : portable SQLite/PostgreSQL)
    $defaultSettings = json_encode([
        'nom' => 'Votre nom d\'ONG',
        'slogan' => 'Votre slogan',
        'email' => 'contact@votre-ong.org',
        'telephone' => '+XXX XX XX XX XX',
        'adresse' => 'Votre adresse',
        'siteWeb' => 'www.votre-ong.org',
        'devise' => 'FCFA',
        'primaryColor' => '#0d9488'
    ]);
    
    $db->prepare("DELETE FROM settings WHERE key = 'ong'")->execute();
    $db->prepare("INSERT INTO settings (key, value) VALUES ('ong', ?)")->execute([$defaultSettings]);
    echo "  [OK] Paramètres ONG réinitialisés\n";
    
    echo "\n$deleted tables vidées avec succès!\n";
    echo "Le compte admin est toujours disponible:\n";
    echo "  Email: admin@gestion-ong.org\n";
    echo "  Mot de passe: ONG@ses13\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
