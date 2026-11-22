# Statut Sécurité — Gestion ONG (État courant 2026-11-17)

## Architecture (Postgres)

Base de données migrée vers **PostgreSQL externe** (hébergé), configurée via `.env`.
- Driver par défaut : `DB_DRIVER=postgres` ; `sqlite` reste disponible en local.
- Schéma auto-créé au premier appel API.
- Migration des données : `tools/migrate_sqlite_to_postgres.php` (idempotent).
- Sauvegarde via `pg_dump` (bouton Paramètres → Sauvegarde).
- Docker : port **3030:80**, SPA `/admin/`, API PHP `/admin/api/`.

Points sécurité spécifiques à Postgres : `.env` git-ignoré ; `DB_PASSWORD` + `JWT_SECRET` à garder secrets ; `DB_SSLMODE=require` recommandé ; HTTPS via reverse proxy obligatoire en prod.

## Vue d'ensemble

Application full-stack ONG (React 19 + TypeScript/Vite + PHP 8.2 / PostgreSQL) déployée dans Docker, avec option SQLite en dev. Analyse Red Team réalisée le 2026-11-16 ; corrections appliquées ; migration Postgres le 2026-11-17.


## Corrections critiques (round 1) ✅

| Fichier | Description |
|---------|-------------|
| `api/reset_data.php` | `requireAuth()` + vérification rôle admin ajouté — wipe total bloqué |
| `api/config.php` | `ALLOWED_ORIGIN` passé de `*` à `https://ongases.org` |
| `api/debug.php`, `api/test.php` | Supprimés (phpinfo / debug info) |
| `api/*.php` (membres, projets, dons, transactions, evenements, settings, fournisseurs, commandes, stocks) | Contrôle `$user['role'] === 'administrateur'` sur toutes les écritures |
| `api/settings.php` | Whitelist de champs + contrôle rôle admin |
| `.gitignore` | Ajout `.env`, `*.db`, archives |

## Nouvelles mesures (round 2) ✅

| # | Mesure | Détail |
|---|--------|--------|
| 1 | **Validation taille/type/contenu des images** | Nouvelle fonction `validateImageDataUrl()` dans `api/db.php` (partagée) : refuse SVG, force PNG/JPEG/WebP, vérifie la signature magique, max 2 Mo. Utilisée pour le **logo ONG** (`settings.php`) et la **photo membre** (`membres.php` create/update). |
| 2 | **Sanitisation / blocage SVG** | Le SVG est explicitement rejeté côté serveur (`stripos($dataUrl, 'data:image/svg')`) — supprime le vecteur XSS via data URL. |
| 3 | **Whitelist `primaryColor` renforcée** | Regex durcie à `^#[A-Fa-f0-9]{6}$` (6 hexadécimaux exactement). |
| 4 | **Rate limiting sur le login** | Nouvelle table `login_attempts` (`email`, `attempts`, `locked_until` en epoch). 5 échecs → verrouillage 15 min, réinitialisé à la connexion réussie. Implémenté dans `config.php` (création table) + `auth.php` (`handleLogin` + `registerLoginFailure()`). |
| 5 | **Headers de sécurité versionnés** | `.htaccess` racine : `Options -Indexes`, HSTS preload, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, CSP complète (`script-src 'self'`). |
| 6 | **Fichiers .htaccess API ajoutés au dépôt** | `api/.htaccess` (CORS restreint ongases.org, blocage *.db/config/.env, préflight OPTIONS) ; `api/data/.htaccess` (Deny all). Les protections ne reposent plus uniquement sur le serveur distant. |
| 7 | **Correction bug SQL** | `INSERT OR REPLACE INTO settings (key, value) VALUES ('ong', ?)');` → parenthèse en trop corrigée. |
| 8 | **Bug dead-code `getAuthHeader()`** | Restauration du Bearer Authorization (légitime pour clients API/curl) mais **sans aucun token en query string** ; cookie HttpOnly en priorité. |
| 9 | **Fallback couleur teal unifié** | `#16a34a` → `#0d9488` dans `initialData.ts`, `Layout.tsx`, `Parametres.tsx`, `Stocks.tsx` (fallbacks JS uniquement ; les classes Tailwind hardcodées restent, hors scope du plan). |

## Build

- `npm run build` → ✅ `built in 10.45s`, aucune erreur TypeScript.

## Vérifications restantes / limitations

- ⚠️ PHP n'est **pas installé localement** → la syntaxe PHP 7.4 n'a pas pu être exécutée/linted localement. À valider au prochain déploiement (ou avec `php -l` côté serveur).
- ⚠️ La conformité SVG côté client : un SVG ne peut plus être stocké côté serveur, mais un admin légitime ne devrait plus utiliser de SVG — le frontend accepte `image/png,jpeg,webp` uniquement.
- ⚠️ Rate limiting en base SQLite : efficace pour un compte admin ciblé ; pas de protection distribuée (IP) en base — surveiller la table `login_attempts`.

## Points restants (roadmap sécurité)

| Priorité | Item | Statut |
|----------|------|--------|
| Medium | 2FA TOTP pour administrateurs | À planifier |
| Medium | Backup automatisé quotidien | À planifier |
| Low | Rotation mot de passe tous les 90 jours | À planifier |
| Low | Monitoring / Sentry | À planifier |
| Low | Vérifier `.htaccess` réellement interprété chez OVH (RewriteEngine + mod_headers) | À tester en prod |
| Low | Forcer changement mot de passe admin par défaut au 1er login | À planifier |

## Bottom line

Round 2 appliqué : **validation d'images stricte (taille + type réel + signature magique)**, **SVG banni** (XSS), **rate limiting login** (brute-force), **headers de sécurité versionnés** (HSTS/CSP/nosniff/…) et **protections .htaccess API dans le dépôt**. Le build passe. Les points restants (2FA, backup, rotation) sont en faible priorité et planifiés en roadmap.