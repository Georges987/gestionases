# Plan de sécurité itérative — Gestion ONG

## Priorité 1 (Cette semaine)

| # | Mesure | Fichier / Composant | Détail |
|---|--------|---------------------|--------|
| 1 | **Valider taille + type MIME des uploads** (photos, logos) | `api/membres.php`, `api/settings.php` | Ajouter vérification `$_FILES['photo']['size']` ≤ 5Mo et ` mime_content_type()` === 'image/*'. Renoyer 400 si invalide. |
| 2 | **Sanitiser SVG des logos uploadés** | `api/settings.php` | Conserver uniquement les balises SVG sécurisées (interdire `<script>`, `onload`, `onerror`). Option : servir les logos via un petit proxy PHP qui nettoie le SVG avant stockage. |
| 3 | **Whitelist stricte dans settings.php** | `api/settings.php` | Vérifier que `primaryColor` commence bien par `#` et fait exactement 7 ou  caractères hexadécimaux (regex actuelle accepte 3 ou 6 ; ajouter validation stricte). |

## Priorité 2 (Dans 2 semaines)

| # | Mesure | Fichier / Composant | Détail |
|---|--------|---------------------|--------|
| 4 | **Rate limiting sur login** | `api/auth.php` | Implémenter un compteur en base `utilisateurs.connexions_échouées` + `tamperepoch`. 5 échecs → verrouillage 15 min. Réinitialiser à chaque connexion réussie. |
| 5 | **Headers de sécurité additionnels dans .htaccess** | `/www/.htaccess`, `/www/api/.htaccess` | Ajouter `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` (déjà en partie présent, vérifier couverture complète). |
| 6 | **Content-Security-Policy renforcée** | `config.php` via `sendResponse()` ou `.htaccess` | Policy plus restrictive que `default-src 'self'` : restreindre `img-src`, `font-src`, `connect-src`, `style-src` selon les besoins. |

## Priorité 3 (Dans 1 mois)

| # | Mesure | Fichier / Composant | Détail |
|---|--------|---------------------|--------|
| 7 | **2FA TOTP pour administrateurs** | `api/auth.php` + module complementary | Intégrer Google Authenticator / TOTP (library `simonharris7/totp`) : deuxième champ dans login, vérification code à 6 chiffres en plus du mot de passe. |
| 8 | **Backup automatisé quotidienne** | Script cron / FTP | Script PHP qui copie `users.db` + `gestion.db` vers un dossier `/backup/` (hors webroot), compression gzip, retention 7 jours. Déclencher par tâche planifiée OVH ou cron local. |
| 9 | **Logs d'audit centralisés** | `api/db.php`, `logAction()` | S'assurer que `logAction()` est appelé sur TOUTES les modifications (déjà présent mais vérifier couverture). Envisager un fichier de log externe ou table dédiée `audit_logs` avec user_id, action, anciennes_valeur, nouvelles_valeur, timestamp. |

## Priorité 4 (Long terme)

| # | Mesure | Fichier / Composant | Détail |
|---|--------|---------------------|--------|
| 10 | **Migration vers MySQL/PostgreSQL** | `api/config.php`, `api/db.php` | À moyen/long terme, quitter SQLite pour une base cliente-serveur avec gestion des droits plus fine, migrations, etc. |
| 11 | **WAF ou sécurité côté réseau** | Infras OVH | Considérer un WAF (ModSecurity) ou les options de sécurité OVH (firewall applicatif, IP restrictive). |
| 12 | **Headers de sécurité HSTS preload** | Déjà en place via `.htaccess` (`max-age=31536000; includeSubDomains; preload`) — vérifier qu'il n'y a pas de sous-domaine non HTTPS. |

---

## Checklist validation avant déploiement

- [x] `reset_data.php` nécessite auth admin
- [x] CORS restreint à l'origine réelle
- [x] Fichiers de debug supprimés
- [x] Contrôle rôle admin sur toutes les écritures
- [ ] Validation taille/type uploads photos/logos
- [ ] Sanitisation SVG
- [ ] Rate limiting login
- [ ] 2FA administrateur (roadmap)
- [ ] Backup quotidien (roadmap)
- [ ] Build passe (✓ vérifié)

---

**Prochaine étape** : Implémenter la mesure #1 (validation uploads) et #2 (sanitisation SVG) cette semaine, tester le build, puis passer au rate limiting (mesure #4).