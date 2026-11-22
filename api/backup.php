<?php
/**
 * API de Sauvegarde de la Base de Données
 * - PostgreSQL : dump SQL via pg_dump (si disponible côté serveur)
 * - SQLite : archive ZIP des fichiers .db
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();

if ($user['role'] !== 'administrateur') {
    sendResponse(['success' => false, 'error' => 'Accès refusé : réservé aux administrateurs'], 403);
}

try {
    if (DB_DRIVER === 'postgres') {
        // ─── PostgreSQL : pg_dump custom-format (contient structure + données) ───
        $host = getenv('DB_HOST') ?: getenv('PG_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: getenv('PG_PORT') ?: '5432';
        $name = getenv('DB_NAME') ?: getenv('PG_NAME') ?: '';
        $pgUser = getenv('DB_USER') ?: getenv('PG_USER') ?: '';
        $password = getenv('DB_PASSWORD') ?: getenv('PG_PASSWORD') ?: '';

        if ($name === '' || $pgUser === '') {
            throw new Exception("Configuration Postgres incomplète (DB_NAME / DB_USER manquants)");
        }

        $dumpFile = sys_get_temp_dir() . '/backup_ong_' . date('Y-m-d_H-i-s') . '.dump';

        // Échapper les valeurs sensibles et appeler pg_dump
        $cmd = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %d -U %s -d %s -Fc -f %s 2>&1',
            escapeshellarg($password),
            escapeshellarg($host),
            (int)$port,
            escapeshellarg($pgUser),
            escapeshellarg($name),
            escapeshellarg($dumpFile)
        );

        // exec() peut être désactivé sur certains hébergements mutualisés
        if (!function_exists('exec')) {
            throw new Exception("La fonction exec() est désactivée sur ce serveur : impossible de lancer pg_dump");
        }

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0) {
            // pg_dump n'est peut-être pas installé côté client
            $detail = implode("\n", $output);
            if (stripos($detail, 'pg_dump') !== false) {
                throw new Exception("pg_dump n'est pas installé sur le serveur. Sur Docker : l'image inclut postgresql-client. Sinon : installez-le ou exportez via psql en ligne de commande.");
            }
            throw new Exception("pg_dump a échoué (code {$returnCode}) : " . $detail);
        }

        if (file_exists($dumpFile)) {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($dumpFile) . '"');
            header('Content-Length: ' . filesize($dumpFile));
            readfile($dumpFile);
            unlink($dumpFile);
            exit;
        }

        throw new Exception("Le fichier de sauvegarde n'a pas pu être généré");
    }

    // ─── SQLite : archive ZIP des fichiers .db ───
    $dataDir = __DIR__ . '/data';
    $zipFileName = 'backup_ong_' . date('Y-m-d_H-i-s') . '.zip';
    $zipFilePath = sys_get_temp_dir() . '/' . $zipFileName;

    $zip = new ZipArchive();
    if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        throw new Exception("Impossible de créer l'archive ZIP");
    }

    // Ajouter tous les fichiers .db du dossier data
    $files = glob($dataDir . '/*.db');
    foreach ($files as $file) {
        $zip->addFile($file, basename($file));
    }
    
    $zip->close();

    // Envoyer le fichier en téléchargement
    if (file_exists($zipFilePath)) {
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
        header('Content-Length: ' . filesize($zipFilePath));
        readfile($zipFilePath);
        unlink($zipFilePath);
        exit;
    } else {
        throw new Exception("Le fichier de sauvegarde n'a pas pu être généré");
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => 'Erreur lors de la sauvegarde : ' . $e->getMessage()], 500);
}
