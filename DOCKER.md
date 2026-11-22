# Gestion ONG — Docker (PostgreSQL externe)

Architecture : **Node/Vite (build) → PHP 8.2 + Apache (runtime)**, port **3030**.
Base de données dans un **PostgreSQL externe** (hébergé) — configurée intégralement via `.env`.

## 1. Prérequis

- Docker + Docker Compose
- Une base PostgreSQL accessible (créée par votre hébergeur, avec un utilisateur dédié)
- Le schéma est créé automatiquement au premier appel API (aucun `.sql` à importer manuellement)

## 2. Démarrage rapide

```powershell
# 1. Créer le .env
copy .env.docker.example .env

# 2. Éditer .env : DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
notepad .env

# 3. Build + démarrage
docker compose up -d --build

# 4. Ouvrir
Start-Process "http://localhost:3030/admin/"
```

Connexion : identifiants définis dans `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
Le compte admin n'est créé qu'à la première connexion si la base est vide.

## 3. Variables .env

| Variable | Rôle | Obligatoire |
|---|---|---|
| `DB_DRIVER` | `postgres` (défaut) ou `sqlite` | non (défaut `postgres`) |
| `DB_HOST` | Hôte Postgres externe | ✅ |
| `DB_PORT` | Port Postgres (défaut 5432) | non |
| `DB_NAME` | Nom de la base | ✅ |
| `DB_USER` | Utilisateur Postgres | ✅ |
| `DB_PASSWORD` | Mot de passe | ✅ (souvent obligatoire) |
| `DB_SSLMODE` | `require` / `prefer` / `disable` | recommandé `require` |
| `JWT_SECRET` | Clé de signature JWT | ✅ |
| `JWT_EXPIRY` | Durée des tokens (secondes) | non (défaut 86400) |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | Compte admin initial (créé si absent) | ✅ `ADMIN_PASSWORD` |
| `ALLOWED_ORIGIN` | Domaine CORS | non (défaut `http://localhost:3030`) |
| `VITE_API_BASE` | URL API vue par le navigateur | non (défaut `/admin/api`) |

## 4. Migrer les données depuis SQLite (users.db, gestion.db)

L'outil est fourni : `tools/migrate_sqlite_to_postgres.php`.

```powershell
# A. Vérifier que les bases existent (dans api/data/)
dir api\data\users.db
dir api\data\gestion.db

# B. Lancer la migration (dry-run d'abord)
php tools\migrate_sqlite_to_postgres.php `
  --users=api\data\users.db --gestion=api\data\gestion.db `
  --host=VOTRE_HOTE --port=5432 --dbname=gestion_ong `
  --user=gestion --password=MOT_DE_PASSE --sslmode=require `
  --dry-run

# C. Appliquer pour de vrai (sans --dry-run)
php tools\migrate_sqlite_to_postgres.php `
  --users=api\data\users.db --gestion=api\data\gestion.db `
  --host=VOTRE_HOTE --port=5432 --dbname=gestion_ong `
  --user=gestion --password=MOT_DE_PASSE --sslmode=require
```

- Idempotent : peut être relancé sans  créer de doublon (`ON CONFLICT DO NOTHING`).
- Les séquences `IDENTITY` sont resynchronisées sur le max(id) observé.
- Vérifications post-migration :
  - `SELECT count(*) FROM utilisateurs;`
  - `SELECT count(*) FROM membres, projets, dons, transactions;`
  - Se connecter dans l'app (identifiants migrés conservés)

## 5. Sauvegarde (pg_dump)

Bouton **Paramètres → Sauvegarde** : si `pg_dump` est disponible côté serveur (inclus dans l'image Docker), il produit un fichier `.dump` (custom format, restaurable via `pg_restore`).

```powershell
# Restauration :
pg_restore -h VOTRE_HOTE -p 5432 -U gestion -d gestion_ong --clean backup_ong_YYYY-MM-DD_HH-MM-SS.dump
```

## 6. Build & exécution Docker

```powershell
docker compose up -d --build    # build + démarrage
docker compose logs -f app      # logs
docker compose ps               # état
docker compose restart app      # redémarrer
docker compose down             # arrêter (n'efface PAS Postgres chez l'hébergeur)
```

Port : **3030** (`http://localhost:3030` redirige vers `/admin/`).
Les données vivent sur votre serveur Postgres — le conteneur ne stocke rien de persistant (sauf `./data` pour exports temporaires / backup).

## 7. Vérification sanity après démarrage

```powershell
curl -I http://localhost:3030/admin/
curl http://localhost:3030/admin/api/auth.php?action=verify   # JSON (401 sans token = normal)
```

## 8. Résolution de problèmes

| Symptôme | Cause probable | Correction |
|---|---|---|
| `DB_HOST manquant dans .env` | env_file non lu | `docker compose config` pour tester l'interpolation |
| `Erreur Postgres: could not connect` | Hôte inaccessible depuis le conteneur | Vérifier firewall/VLAN hébergeur, `DB_SSLMODE=require`, `DB_PORT` |
| `password authentication failed` | mauvais user/password | Vérifier `DB_USER` / `DB_PASSWORD` ; tester avec `psql` depuis votre poste |
| `relation "utilisateurs" does not exist` | Schéma non créé | Premier appel API doit retourner 200 ; sinon relancer `docker compose restart app` et réessayer |
| Page blanche | `dist/` obsolète | `docker compose up -d --build` |
| `403` sur `/admin/api/…` | `.htaccess` ou CSP bloquant | Vérifier `docker/root.htaccess` (SPA rewrite `/admin/`) |

## 9. Sécurité

- `.env` ignoré par git — ne jamais commiter
- `DB_PASSWORD` et `JWT_SECRET` doivent être régénérés si divulgués
- `ALLOWED_ORIGIN` en production : mettre le domaine réel (HTTPS en reverse proxy)
- Le conteneur fait confiance à l'hôte pour la résolution DNS Postgres uniquement

## 10. Passer sur HTTPS (production)

Ajouter un reverse proxy devant (Traefik / nginx / Certbot) :
- TLS sur 443, redirection 80 → 443
- Ensuite : `ALLOWED_ORIGIN=https://votre-domaine` et HSTS dans `docker/root.htaccess`
