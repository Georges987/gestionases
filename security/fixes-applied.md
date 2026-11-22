# Correctifs appliques - 2026-06-05

## Resume

| # | Correctif | Fichier modifie | Impact |
|---|---|---|---|
| 1 | Ajout HSTS | `/www/.htaccess` | Eleve |
| 2 | Ajout CSP | `/www/.htaccess` | Eleve |
| 3 | Ajout Permissions-Policy | `/www/.htaccess` | Moyen |
| 4 | Desactivation directory listing | `/www/.htaccess` | Moyen |
| 5 | CORS restrictif | `/www/api/.htaccess` | Eleve |
| 6 | Suppression test.php | `/www/api/test.php` | Moyen |
| 7 | Suppression debug.php | `/www/api/debug.php` | Moyen |
| 8 | Suppression debug2.php | `/www/api/debug2.php` | Moyen |
| 9 | Creation dossier data/ | `/www/api/data/` | Critique |
| 10 | Protection data/ | `/www/api/data/.htaccess` | Eleve |
| 11 | Suppression fallback JWT | `/www/api/config.php` | Eleve |

## Avant / Apres

### Headers de securite

**Avant** :
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Apres** :
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### CORS

**Avant** :
```
Access-Control-Allow-Origin: *
```

**Apres** :
```
Access-Control-Allow-Origin: https://ongases.org
```

### Directory Listing

**Avant** : `https://ongases.org/api/` affichait la liste des fichiers PHP
**Apres** : Affiche une erreur 403

## Verification

Pour verifier que les corrections sont actives :

```bash
# Test HSTS
curl -I https://ongases.org/ | grep -i strict-transport
# Doit afficher: Strict-Transport-Security: max-age=31536000; ...

# Test CSP
curl -I https://ongases.org/ | grep -i content-security
# Doit afficher: Content-Security-Policy: default-src 'self'; ...

# Test directory listing
curl -I https://ongases.org/api/
# Doit afficher: 403 Forbidden

# Test CORS
curl -H "Origin: https://evil.com" -I https://ongases.org/api/auth.php | grep -i access-control
# Doit afficher: Access-Control-Allow-Origin: https://ongases.org
```

## Prochaines etapes recommandees

1. **Rate limiting** : Creer `/www/security/rate-limiter.php` et l'integrer dans auth.php
2. **2FA** : Implementer TOTP pour les admins
3. **Monitoring** : Ajouter Sentry ou equivalent
4. **Backup automatique** : Cron quotidien de la base SQLite
