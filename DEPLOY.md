# Deploiement — Gestion ONG (OVH mutualise, SQLite)

Cible reelle : **https://ongases.org/admin/** (SPA React sous `/admin/`, API PHP sous `/admin/api/`).
Bases SQLite : `users.db` (auth) et `gestion.db` (metier), creees automatiquement dans `api/data/`.

## 1. Prerequis

- Compte OVH mutualise avec FTP active
- PHP 7.4+ avec extension PDO SQLite (active par defaut chez OVH)
- Node.js + npm localement (pour le build)

## 2. Configuration initiale

```powershell
cd deploy
copy .env.example .env
# editer .env : FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_PATH=/www, VITE_API_BASE=/admin/api
```

## 3. Procedure de deploiement

### A. Simulation (recommandee avant tout 1er essai)

```powershell
cd deploy
.\deploy.ps1 -WhatIf
```
- Liste **exactement** les fichiers qui seraient transferises (aucun upload).
- Verifie que `dist/` est a jour et que `.env` est correctement charge.

### B. Deploiement complet

```powershell
cd deploy
.\deploy.ps1
```
Etapes executees :
1. `npm run build` (VITE_API_BASE=/admin/api)
2. Upload vers `FTP_REMOTE_PATH` (ex. /www) :
   - `.htaccess` -> racine
   - `dist/index.html` -> `admin/index.html`
   - `dist/assets/*` -> `admin/assets/*`
   - `api/*.php` + `api/.htaccess` -> `admin/api/`
   - `api/data/.htaccess` -> `admin/api/data/.htaccess`
3. Creation des dossiers `admin/`, `admin/assets/`, `admin/api/`, `admin/api/data/`

**Les bases SQLite (`*.db`) ne sont JAMAIS uploadees** — elles existent deja sur le serveur et sont preservees.

### C. Etapes separees

```powershell
.\deploy.ps1 -BuildOnly    # build sans upload
.\deploy.ps1 -UploadOnly   # upload sans rebuild
.\deploy.ps1 -Force        # sans confirmation interactive
```

## 4. Verifications apres deploiement

1. `Ctrl+F5` sur **https://ongases.org/admin/**
2. La page de login s'affiche ; les assets chargent (onglet Network : `/admin/assets/index-*.js` en 200)
3. Connexion : `admin@gestion-ong.org` / `ONG@ses13` (ou le mot de passe defini dans `api/config.php`)
4. **Changer le mot de passe immediatement**
5. `https://ongases.org/admin/api/data/gestion.db` -> doit renvoyer 403 ou 404 (jamais 200)
6. Tester une sauvegarde (Parametres > Sauvegarder) et le Dashboard

## 5. Structure sur le serveur

```
/www/
├── .htaccess                  <- securite (HSTS, CSP, blocage .db, SPA rewrite /admin/)
└── admin/
    ├── index.html             <- SPA React (pointe vers /admin/assets/*)
    ├── assets/                <- chunks Vite (index-*.js, *.css)
    └── api/
        ├── config.php         <- JWT + users.db
        ├── db.php             <- gestion.db + tables + pagination
        ├── auth.php, membres.php, projets.php, dons.php, transactions.php,
        ├── evenements.php, settings.php, stocks.php, fournisseurs.php,
        ├── commandes.php, logs.php, backup.php, reset_data.php
        ├── .htaccess          <- CORS restreint + blocage *.db / .env
        └── data/
            ├── .htaccess      <- Deny all (bases SQLite)
            ├── users.db       <- cree a la premiere connexion (auth)
            └── gestion.db     <- cree a la premiere requete metier
```

## 6. Securite — deploiement uniquement

- Ne jamais uploader `api/debug.php` / `api/test.php` (supprimes du depot)
- Ne jamais uploader de fichier `.db`
- Le `.htaccess` racine contient **pas** de `<DirectoryMatch>` (HTTP 500 chez OVH) — ne pas l'ajouter
- `deploy/.env` contient les identifiants FTP : ne JAMAIS le committer (deja dans .gitignore)

## 7. Sauvegarde des bases

1. Telecharger via FTP : `admin/api/data/users.db` et `admin/api/data/gestion.db`
2. Stocker hors du depot (ex. dossier backup local, retention 7 jours)
3. Option Parametres > Sauvegarder (admin) genere un ZIP des deux bases

## 8. Rollback

1. En cas de probleme, retablir la version precedente de `index.html`/`assets` via FTP
2. Si la base est corrompue : uploader la sauvegarde la plus recente vers `admin/api/data/`
3. Les utilisateurs se reconnectent (tokens JWT valides 24h)
