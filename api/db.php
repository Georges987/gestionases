<?php
// Shared database and API helpers for Gestion ONG
require_once __DIR__ . '/config.php';

// Chemin du fichier SQLite (gestion.db) — priorité à la variable d'environnement (Docker), sinon dossier local
// NB : utilisé uniquement si DB_DRIVER=sqlite. Pour Postgres, DB_HOST/DB_NAME/DB_USER sont utilisés (DB_PORT, DB_PASSWORD, DB_SSLMODE optionnels)
define('GESTION_DB_PATH', getenv('GESTION_DB_PATH') ?: __DIR__ . '/data/gestion.db');

// Ensure data directory exists (répertoire dérivé du chemin configuré via env, pas hardcodé) — uniquement pour SQLite
if (DB_DRIVER === 'sqlite') {
    $dataDir = dirname(GESTION_DB_PATH);
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
}

// ─── PostgreSQL (défaut) ───
function getPgGestionDB() {
    $host = getenv('DB_HOST') ?: getenv('PG_HOST') ?: '';
    $port = getenv('DB_PORT') ?: getenv('PG_PORT') ?: '5432';
    $name = getenv('DB_NAME') ?: getenv('PG_NAME') ?: '';
    $user = getenv('DB_USER') ?: getenv('PG_USER') ?: '';
    $password = getenv('DB_PASSWORD') ?: getenv('PG_PASSWORD') ?: '';
    $sslmode = getenv('DB_SSLMODE') ?: getenv('PG_SSLMODE') ?: '';

    if ($host === '' || $name === '' || $user === '') {
        sendResponse(['success' => false, 'error' => 'Configuration Postgres incomplète : DB_HOST, DB_NAME, DB_USER (DB_PORT, DB_PASSWORD, DB_SSLMODE optionnels)'], 500);
    }

    $dsn = "pgsql:host={$host};port={$port};dbname={$name}";
    if ($sslmode !== '') {
        $dsn .= ";sslmode={$sslmode}";
    }

    try {
        $db = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        initializeGestionTablesPg($db);
        return $db;
    } catch (PDOException $e) {
        sendResponse(['success' => false, 'error' => 'Erreur Postgres: ' . $e->getMessage()], 500);
    }
}

// ─── SQLite (fallback / dev local) ───
function getSqliteGestionDB() {
    try {
        $dbPath = GESTION_DB_PATH;
        $dataDir = dirname($dbPath);

        if (!is_writable($dataDir) || (file_exists($dbPath) && !is_writable($dbPath))) {
            sendResponse(['error' => 'Erreur de permissions : Le serveur ne peut pas écrire dans la base de données. Veuillez vérifier les droits du dossier data/.'], 500);
        }

        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('PRAGMA journal_mode=WAL');
        $db->exec('PRAGMA foreign_keys=ON');
        initializeGestionTablesSqlite($db);
        return $db;
    } catch (PDOException $e) {
        sendResponse(['error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

// Get business database connection (dispatcher)
function getGestionDB() {
    if (DB_DRIVER === 'postgres') {
        return getPgGestionDB();
    }
    return getSqliteGestionDB();
}

/**
 * Valide une data URL image (PNG/JPEG/WebP uniquement), refuse le SVG et les contenus trop volumineux.
 * Utilisé côté serveur pour les photos de membres et le logo de l'ONG.
 * @param string $dataUrl  la data URL complète (data:image/png;base64,...)
 * @param int    $maxBytes taille maximale décodée en octets (défaut : 2 Mo)
 * @return array ['ok' => bool, 'error' => string|null]
 */
function validateImageDataUrl($dataUrl, $maxBytes = 2097152) {
    if (!is_string($dataUrl) || $dataUrl === '') {
        return ['ok' => false, 'error' => 'Image vide ou invalide'];
    }
    // Longueur approximative base64 : 4/3 de la taille décodée — rejet rapide des gros payloads
    $encodedLen = strlen($dataUrl);
    if (($encodedLen * 3) / 4 > $maxBytes * 1.4) {
        return ['ok' => false, 'error' => 'L\'image dépasse la taille maximale autorisée (' . round($maxBytes / 1048576, 1) . ' Mo)'];
    }
    // Interdiction explicite du SVG (vecteur XSS via data:image/svg+xml)
    if (stripos($dataUrl, 'data:image/svg') === 0) {
        return ['ok' => false, 'error' => 'Le SVG n\'est pas autorisé'];
    }
    if (!preg_match('/^data:image\/(png|jpeg|jpg|webp);base64,([a-zA-Z0-9+\/=\r\n]+)$/', $dataUrl, $matches)) {
        return ['ok' => false, 'error' => 'L\'image doit être au format PNG, JPEG ou WebP'];
    }
    // Vérifier la signature réelle après décodage
    $decoded = base64_decode($matches[2], true);
    if ($decoded === false) {
        return ['ok' => false, 'error' => 'Le contenu base64 est invalide'];
    }
    if (strlen($decoded) > $maxBytes) {
        return ['ok' => false, 'error' => 'L\'image dépasse la taille maximale autorisée (' . round($maxBytes / 1048576, 1) . ' Mo)'];
    }
    $mime = $matches[1] === 'jpg' ? 'jpeg' : $matches[1];
    $signatures = [
        'png'  => "\x89\x50\x4E\x47",
        'jpeg' => "\xFF\xD8\xFF",
        'webp' => 'RIFF',
    ];
    $sig = $signatures[$mime];
    if (substr($decoded, 0, strlen($sig)) !== $sig) {
        return ['ok' => false, 'error' => 'Le fichier ne correspond pas à une image ' . strtoupper($mime) . ' valide'];
    }
    return ['ok' => true, 'error' => null];
}

// Authenticate and return user payload
function requireAuth() {
    $token = getAuthHeader();
    if (!$token) {
        sendResponse(['error' => 'Token manquant'], 401);
    }
    $payload = verifyJWT($token);
    if (!$payload) {
        sendResponse(['error' => 'Token invalide ou expiré'], 401);
    }
    return $payload;
}

function logAction($userId, $action, $details = null) {
    try {
        $db = getGestionDB();
        $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $action, $details]);
    } catch (PDOException $e) {
        // On ne bloque pas l'application si le log échoue
        error_log("Audit Log Error: " . $e->getMessage());
    }
}

// Initialize all business tables — SQLite variant (unchanged from before)
function initializeGestionTablesSqlite($db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS membres (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            email TEXT,
            telephone TEXT,
            role TEXT NOT NULL DEFAULT 'benevole',
            statut TEXT NOT NULL DEFAULT 'actif',
            date_adhesion TEXT,
            adresse TEXT,
            photo TEXT,
            anniversaire TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS projets (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            description TEXT,
            responsable TEXT,
            statut TEXT NOT NULL DEFAULT 'en_cours',
            date_debut TEXT,
            date_fin TEXT,
            budget REAL DEFAULT 0,
            depenses REAL DEFAULT 0,
            categorie TEXT,
            beneficiaires INTEGER DEFAULT 0,
            localisation TEXT,
            progression INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS dons (
            id TEXT PRIMARY KEY,
            donateur TEXT NOT NULL,
            email TEXT,
            montant REAL NOT NULL,
            devise TEXT DEFAULT 'FCFA',
            date TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'financier',
            projet_id TEXT,
            statut TEXT NOT NULL DEFAULT 'recu',
            recu INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            libelle TEXT NOT NULL,
            montant REAL NOT NULL,
            type TEXT NOT NULL,
            categorie TEXT,
            date TEXT NOT NULL,
            projet_id TEXT,
            validee INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS evenements (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            heure TEXT,
            lieu TEXT,
            type TEXT NOT NULL DEFAULT 'autre',
            statut TEXT NOT NULL DEFAULT 'planifie',
            participants INTEGER DEFAULT 0,
            responsable TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ");
    
    $count = $db->query("SELECT COUNT(*) FROM settings WHERE key='ong'")->fetchColumn();
    if ($count == 0) {
        $defaultSettings = json_encode([
            'nom' => 'Espoir & Solidarité',
            'slogan' => 'Ensemble, construisons un monde meilleur',
            'email' => 'contact@espoir-solidarite.org',
            'telephone' => '+225 07 00 00 00',
            'adresse' => "Abidjan, Côte d'Ivoire",
            'siteWeb' => 'www.espoir-solidarite.org',
            'devise' => 'FCFA'
        ]);
        $stmt = $db->prepare("INSERT INTO settings (key, value) VALUES ('ong', ?)");
        $stmt->execute([$defaultSettings]);
    }
    
    // Phase 2: Stock tables
    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_categories (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_articles (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            description TEXT,
            categorie_id TEXT,
            quantite INTEGER DEFAULT 0,
            seuil_alerte INTEGER DEFAULT 5,
            unite TEXT DEFAULT 'unité',
            projet_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categorie_id) REFERENCES stock_categories(id),
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_mouvements (
            id TEXT PRIMARY KEY,
            article_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('entree','sortie')),
            quantite INTEGER NOT NULL,
            motif TEXT,
            projet_id TEXT,
            utilisateur_id TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES stock_articles(id),
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS fournisseurs (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            contact_nom TEXT,
            email TEXT,
            telephone TEXT,
            adresse TEXT,
            categorie TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS commandes_fournisseurs (
            id TEXT PRIMARY KEY,
            fournisseur_id TEXT NOT NULL,
            date_commande TEXT NOT NULL,
            statut TEXT NOT NULL CHECK(statut IN ('en_attente', 'recue', 'annulee')),
            montant_total REAL DEFAULT 0,
            devise TEXT DEFAULT 'FCFA',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS commande_articles (
            id TEXT PRIMARY KEY,
            commande_id TEXT NOT NULL,
            article_id TEXT NOT NULL,
            quantite INTEGER NOT NULL,
            prix_unitaire REAL NOT NULL,
            FOREIGN KEY (commande_id) REFERENCES commandes_fournisseurs(id),
            FOREIGN KEY (article_id) REFERENCES stock_articles(id)
        )
    ");
}

// Initialize all business tables — PostgreSQL variant
function initializeGestionTablesPg($db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS membres (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            email TEXT,
            telephone TEXT,
            role TEXT NOT NULL DEFAULT 'benevole',
            statut TEXT NOT NULL DEFAULT 'actif',
            date_adhesion TEXT,
            adresse TEXT,
            photo TEXT,
            anniversaire TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS projets (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            description TEXT,
            responsable TEXT,
            statut TEXT NOT NULL DEFAULT 'en_cours',
            date_debut TEXT,
            date_fin TEXT,
            budget DOUBLE PRECISION DEFAULT 0,
            depenses DOUBLE PRECISION DEFAULT 0,
            categorie TEXT,
            beneficiaires INTEGER DEFAULT 0,
            localisation TEXT,
            progression INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS dons (
            id TEXT PRIMARY KEY,
            donateur TEXT NOT NULL,
            email TEXT,
            montant DOUBLE PRECISION NOT NULL,
            devise TEXT DEFAULT 'FCFA',
            date TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'financier',
            projet_id TEXT,
            statut TEXT NOT NULL DEFAULT 'recu',
            recu INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            libelle TEXT NOT NULL,
            montant DOUBLE PRECISION NOT NULL,
            type TEXT NOT NULL,
            categorie TEXT,
            date TEXT NOT NULL,
            projet_id TEXT,
            validee INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS evenements (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            heure TEXT,
            lieu TEXT,
            type TEXT NOT NULL DEFAULT 'autre',
            statut TEXT NOT NULL DEFAULT 'planifie',
            participants INTEGER DEFAULT 0,
            responsable TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ");

    $count = $db->query("SELECT COUNT(*) FROM settings WHERE key='ong'")->fetchColumn();
    if ($count == 0) {
        $defaultSettings = json_encode([
            'nom' => 'Espoir & Solidarité',
            'slogan' => 'Ensemble, construisons un monde meilleur',
            'email' => 'contact@espoir-solidarite.org',
            'telephone' => '+225 07 00 00 00',
            'adresse' => "Abidjan, Côte d'Ivoire",
            'siteWeb' => 'www.espoir-solidarite.org',
            'devise' => 'FCFA'
        ]);
        $stmt = $db->prepare("INSERT INTO settings (key, value) VALUES ('ong', ?) ON CONFLICT (key) DO NOTHING");
        $stmt->execute([$defaultSettings]);
    }

    // Phase 2: Stock tables
    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_categories (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_articles (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            description TEXT,
            categorie_id TEXT,
            quantite INTEGER DEFAULT 0,
            seuil_alerte INTEGER DEFAULT 5,
            unite TEXT DEFAULT 'unité',
            projet_id TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categorie_id) REFERENCES stock_categories(id),
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS stock_mouvements (
            id TEXT PRIMARY KEY,
            article_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('entree','sortie')),
            quantite INTEGER NOT NULL,
            motif TEXT,
            projet_id TEXT,
            utilisateur_id TEXT,
            date TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES stock_articles(id),
            FOREIGN KEY (projet_id) REFERENCES projets(id)
        )
    ");

    // "timestamp" est un mot-clé type en PostgreSQL : protégé par guillemets
    $db->exec('
        CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            details TEXT,
            "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ');

    $db->exec("
        CREATE TABLE IF NOT EXISTS fournisseurs (
            id TEXT PRIMARY KEY,
            nom TEXT NOT NULL,
            contact_nom TEXT,
            email TEXT,
            telephone TEXT,
            adresse TEXT,
            categorie TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS commandes_fournisseurs (
            id TEXT PRIMARY KEY,
            fournisseur_id TEXT NOT NULL,
            date_commande TEXT NOT NULL,
            statut TEXT NOT NULL CHECK(statut IN ('en_attente', 'recue', 'annulee')),
            montant_total DOUBLE PRECISION DEFAULT 0,
            devise TEXT DEFAULT 'FCFA',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id)
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS commande_articles (
            id TEXT PRIMARY KEY,
            commande_id TEXT NOT NULL,
            article_id TEXT NOT NULL,
            quantite INTEGER NOT NULL,
            prix_unitaire DOUBLE PRECISION NOT NULL,
            FOREIGN KEY (commande_id) REFERENCES commandes_fournisseurs(id),
            FOREIGN KEY (article_id) REFERENCES stock_articles(id)
        )
    ");
}




/**
 * Helper de pagination pour les listes API.
 * Lit page/perPage depuis $_GET, exécute COUNT puis requête paginée.
 * Retourne un tableau compatible avec sendResponse : { data, total, page, perPage }
 */
function paginate($db, $baseSql, $params = [], $countColumn = '*') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 100)));

    // Compter le total
    $countSql = preg_replace('/SELECT .* FROM/i', "SELECT COUNT($countColumn) FROM", $baseSql);
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Requête paginée
    $offset = ($page - 1) * $perPage;
    $sql = "$baseSql LIMIT $perPage OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll();

    return [
        'data' => $data,
        'total' => $total,
        'page' => $page,
        'perPage' => $perPage,
    ];
}
