# Configuration de Securite - Gestion ONG

Ce sous-dossier contient toutes les configurations de securite de la plateforme.

## Corrections appliquees (Date: 2026-06-05)

### 1. Headers de securite (HSTS, CSP)

Ajoutes dans `/www/.htaccess` :

| Header | Valeur | Protection |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS pendant 1 an |
| `Content-Security-Policy` | `default-src 'self'; ...` | Empeche les injections XSS |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Empeche l'acces aux APIs sensibles |

### 2. CORS restrictif

Modifie dans `/www/api/.htaccess` :

| Avant | Apres |
|---|---|
| `Access-Control-Allow-Origin: *` | `Access-Control-Allow-Origin: https://ongases.org` |

### 3. Directory listing desactive

Ajoute dans `/www/.htaccess` : `Options -Indexes`

- Bloque l'affichage du contenu de `/api/` et `/assets/`

### 4. Blocage des fichiers sensibles

Deja en place dans `/www/.htaccess` et `/www/api/.htaccess` :
- `.env` (config)
- `.db`, `.sqlite*` (base de donnees)
- Fichiers caches (`.htaccess`, `.gitignore`)

### 5. Protection du dossier data

`/www/api/data/.htaccess` bloque l'acces direct aux fichiers SQLite :
```
Order deny,allow
Deny from all
```

## Fichiers du sous-dossier

| Fichier | Role |
|---|---|
| `.htaccess` | Configuration de securite complete (applique au sous-dossier) |
| `README.md` | Ce fichier de documentation |
| `security-report.md` | Rapport d'audit detaille |
| `fixes-applied.md` | Liste des correctifs |

## Vulnerabilites restantes (non corrigees)

| Niveau | Description | Mitigation recommandee |
|---|---|---|
| Moyen | Pas de rate limiting sur `/api/auth.php` | Ajouter un compteur en base |
| Faible | Pas de 2FA | Implementer TOTP |
| Info | Logs non centralises | Activer un service de monitoring |

## Comment verifier

```bash
# Headers de securite
curl -I https://ongases.org/

# CORS
curl -H "Origin: https://evil.com" -I https://ongases.org/api/auth.php

# Directory listing
curl -I https://ongases.org/api/
curl -I https://ongases.org/assets/
```

Toutes ces requetes doivent retourner les headers de securite et ne pas lister les fichiers.
