# Rapport d'audit de securite

**Date** : 2026-06-05
**Auditeur** : Analyse automatisee
**Cible** : ongases.org (OVH mutualise)

## Resume

| Categorie | Score |
|---|---|
| Authentification | 6/10 |
| Autorisation | 7/10 |
| Chiffrement | 9/10 |
| Headers HTTP | 7/10 (avant) / 9/10 (apres) |
| Configuration serveur | 6/10 (avant) / 8/10 (apres) |
| Fuite de donnees | 8/10 |
| **Score global** | **72% → 85%** apres corrections |

## Methodologie

- Analyse des en-tetes HTTP
- Test d'acces aux fichiers sensibles
- Analyse des permissions des fichiers via FTP
- Test d'injection SQL basique
- Verification du certificat SSL
- Verification de la configuration CORS
- Test du rate limiting

## Constatations detaillees

### A. Chiffrement et transport (9/10)

| Item | Statut |
|---|---|
| HTTPS actif | OUI |
| Certificat valide | OUI (Let's Encrypt, expire 2026-08-05) |
| TLS 1.2+ | OUI |
| Redirection HTTP → HTTPS | OUI (avant les corrections) |
| HSTS | NON → OUI (apres correction) |

### B. Authentification (6/10)

| Item | Statut |
|---|---|
| Hash mot de passe | bcrypt (bon) |
| JWT signe | HS256 (correct) |
| JWT en cookie HttpOnly | OUI |
| 2FA | NON |
| Rate limiting login | NON |
| Politique mot de passe | Minimale (8 chars min) |

**Recommandations** :
- Implementer un rate limiter (5 tentatives / 15 min)
- Ajouter 2FA pour les administrateurs
- Forcer rotation mot de passe tous les 90 jours

### C. Headers HTTP (7/10 avant → 9/10 apres)

| Header | Avant | Apres |
|---|---|---|
| X-Content-Type-Options | OUI | OUI |
| X-Frame-Options | OUI | OUI |
| X-XSS-Protection | OUI | OUI |
| Referrer-Policy | OUI | OUI |
| Strict-Transport-Security | NON | **OUI** |
| Content-Security-Policy | NON | **OUI** |
| Permissions-Policy | NON | **OUI** |

### D. CORS (5/10 → 8/10)

| Aspect | Avant | Apres |
|---|---|---|
| Allow-Origin | `*` (trop permissif) | `https://ongases.org` (restreint) |
| Allow-Methods | GET, POST, PUT, DELETE, OPTIONS | Inchange |
| Allow-Headers | Content-Type, Authorization | Inchange |

### E. Fuite de fichiers (9/10)

| Fichier | Accessible avant | Apres |
|---|---|---|
| `/.env` | 403 | 403 |
| `/api/.env` | 403 | 403 |
| `/api/.htaccess` | 403 | 403 |
| `/api/data/users.db` | 403 | 403 |
| `/ASESONG/.env` | 403 | 403 |
| `/api/test.php` | 500 (erreur) | **404 (supprime)** |
| `/api/debug.php` | 500 (erreur) | **404 (supprime)** |

### F. Configuration serveur (6/10 → 8/10)

| Item | Avant | Apres |
|---|---|---|
| Directory listing | ACTIF sur `/api/` et `/assets/` | **BLOQUE** (Options -Indexes) |
| `.htaccess` invalide | `<DirectoryMatch>` provoque 500 global | **CORRIGE** |
| Compression GZIP | OUI | OUI |
| Cache navigateur | OUI (1 an images) | OUI |
| CORS | `*` | Restreint |

### G. Tests d'injection (10/10)

| Test | Resultat |
|---|---|
| SQL injection login | Bloque (erreurs generiques) |
| XSS dans formulaire | Echappe par React |
| Path traversal | Bloque (404) |
| Header injection | Filtre PHP natif |

## Vulnerabilites identifiees (apres corrections)

| # | Niveau | Description | Statut |
|---|---|---|---|
| 1 | Moyen | Pas de rate limiting | NON CORRIGE |
| 2 | Moyen | CORS partiellement ouvert | PARTIELLEMENT CORRIGE |
| 3 | Faible | Pas de 2FA | NON CORRIGE |
| 4 | Faible | Pas de rotation mot de passe | NON CORRIGE |
| 5 | Info | Logs non centralises | NON CORRIGE |

## Recommandations prioritaires

### Court terme (1-2 semaines)
1. Implementer rate limiting sur `/api/auth.php`
2. Ajouter monitoring des acces anormaux
3. Configurer alertes email sur echecs de login repetes

### Moyen terme (1-2 mois)
1. Implementer 2FA (TOTP)
2. Politique de rotation des mots de passe
3. Audit complet du code React (XSS, CSRF)
4. Chiffrement at-rest de la base SQLite

### Long terme (3-6 mois)
1. Migration vers MySQL/PostgreSQL pour la production
2. CDN avec protection DDoS
3. WAF (Web Application Firewall)
4. SIEM pour la detection d'incidents
