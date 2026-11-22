# Migration du Dashboard vers le design ngo-management-platform-design

**Date** : 2026-06-06
**Statut** : Brouillon - En attente d'approbation
**Portée** : Page Dashboard + couleur teal propagée à toute l'app via `data.ong.primaryColor`

## Contexte

L'application `ongases.org/admin/` dispose d'un Dashboard fonctionnel construit avec recharts et la palette verte (`#16a34a`). Un dossier de référence `ngo-management-platform-design/` propose une approche plus moderne et professionnelle avec une palette teal/slate, des composants UI réutilisables, et des charts SVG custom.

**Objectif** : 
1. Migrer la page `Dashboard.tsx` vers le nouveau design
2. Propager la couleur teal à toute l'app en changeant la valeur par défaut de `data.ong.primaryColor` (de `#16a34a` vert à `#0d9488` teal)

## Décisions validées avec l'utilisateur

- **Portée** : Dashboard + couleur teal propagée via `primaryColor` (Sidebar, Layout, boutons dynamiques). Les classes Tailwind `green-XXX` hardcodées dans les pages restent vertes (refactor séparé si nécessaire).
- **Palette** : teal du design (`#0d9488`)
- **Affectation des fonds** : catégories réelles de transactions (6-7 segments)
- **Activity feed** : généré depuis la table `audit_logs` (endpoint `logs.php`)
- **Mécanisme** : changer la valeur par défaut de `primaryColor` plutôt que hardcoder teal partout (préserve la personnalisation via Paramètres)

## Architecture cible

```
src/
├── components/
│   ├── dashboard/                    ← nouveau dossier isolé
│   │   ├── UI.tsx                    (Card, SectionTitle, Badge, Progress, statusTone, fcfa, num)
│   │   ├── Charts.tsx                (AreaChart, Donut, Bars en SVG)
│   │   ├── KPICard.tsx               (encapsule le pattern KPI avec delta)
│   │   ├── ActivityFeed.tsx          (transforme audit_logs → feed)
│   │   ├── GeographicReach.tsx       (agrège projets par localisation)
│   │   └── FundAllocation.tsx        (agrège transactions par catégorie)
│   └── Dashboard.tsx                 (réécrit — compose les nouveaux composants)
```

**Note** : pas de `Icons.tsx` porté — on utilise `lucide-react` (déjà installé) qui fournit toutes les icônes nécessaires (Heart, MapPin, TrendingUp, TrendingDown, FolderKanban, Bell, etc.).

**Rationale** : isoler dans `components/dashboard/` permet de :
- Garder la Sidebar/Layout/Membres/Projets/... intacts
- Pouvoir rollback en remplaçant simplement le composant racine
- Éviter les conflits de nommage avec l'existant (`Card`, `Badge`)

## Mapping data design → API

| Élément du design | Source API | Calcul / transformation |
|-------------------|------------|--------------------------|
| KPI "Dons collectés (an)" | `dons` WHERE `statut='recu'` | `sum(montant)` + delta % vs N-1 |
| KPI "Bénéficiaires aidés" | `projets` | `sum(beneficiaires)` |
| KPI "Projets actifs" | `projets` WHERE `statut='en_cours'` | `count()` |
| KPI "Bénévoles engagés" | `membres` WHERE `statut='actif'` | `count()` |
| Chart dons mensuels | `dons` WHERE `statut='recu'` | `group by strftime('%Y-%m', date), sum(montant)` |
| Donut affectation | `transactions` WHERE `type='depense'` | `group by categorie, sum(montant) / total * 100` |
| Projets prioritaires | `projets` ORDER BY `progression` DESC LIMIT 4 | direct |
| Activity feed | `audit_logs` ORDER BY `timestamp` DESC LIMIT 5 | jointure `utilisateurs` pour `who` |
| Présence géographique | `projets` | `group by localisation, count, sum(beneficiaires)` |

## Palette & typographie

**Couleurs** :
- Primaire : `#0d9488` (teal-600)
- Accent : `#f59e0b` (amber-500), `#6366f1` (indigo-500), `#ec4899` (pink-500), `#10b981` (emerald-500)
- Fond : `bg-slate-50` (page) / `bg-white` (cards)
- Bordures : `border-slate-200/70`
- Texte : `text-slate-800` (principal), `text-slate-400` (sub), `text-slate-500` (secondaire)

**Typographie** : Tailwind default, identique à l'existant.

**Mode sombre** : Ajout progressif de variantes `dark:` sur les nouveaux composants. Pas de mode sombre complet pour le nouveau dashboard dans cette V1 (les charts SVG gardent leurs couleurs fixes).

## Préservation des features actuelles

| Feature | Action |
|---------|--------|
| Export PDF | ✅ Conservé en haut à droite (bouton "Exporter en PDF") |
| Lazy loading | ✅ Dashboard reste un chunk séparé via `React.lazy` |
| Données temps réel | ✅ Source = `useApp()` (déjà chargé par AppContext) |
| Pas d'erreur si API KO | ✅ Si `data.projets.length === 0`, afficher un empty state |

## Composants à porter depuis le design

### 1. `src/components/dashboard/UI.tsx`
- `Card` (wrapper avec rounded-2xl, border, bg-white, shadow-sm)
- `SectionTitle` (titre + sous-titre + action optionnelle)
- `Badge` (avec tons : teal, amber, indigo, rose, slate, green)
- `Progress` (barre de progression, couleur paramétrable)
- `statusTone(status)` (mappe status français → ton de Badge)
- `eur(n)` (formate en euros) — *sera adapté en `fcfa(n)`*
- `num(n)` (formate en nombre fr-FR)

**Adaptation** : remplacer `eur` par `fcfa` qui formate en FCFA, garder `num` identique.

### 2. `src/components/dashboard/Charts.tsx`
- `AreaChart` (SVG area chart, props: data, color)
- `Donut` (SVG donut, props: data avec label/value/color)
- `Bars` (barres horizontales avec gradient, props: data avec name/value)

**Port direct** : ces composants sont sans dépendance et fonctionnent tels quels.

### 3. `src/components/dashboard/Icons.tsx`
Ensemble d'icônes SVG inline (Project, Heart, Hand, Bell, Mail, Pin, Trend, TrendDown, Globe) utilisées par le design.

**Alternative** : comme `lucide-react` est déjà installé et dispose de toutes ces icônes (`FolderKanban`, `Heart`, `Hand`, `Bell`, `Mail`, `MapPin`, `TrendingUp`, `TrendingDown`, `Globe`), on garde `lucide-react` et on n'importe PAS `Icons.tsx`. Le code sera plus léger.

**Décision finale** : pas de port de `Icons.tsx` — utiliser `lucide-react` directement.

## Plan d'implémentation

1. **Créer `src/components/dashboard/UI.tsx`** (port adapté, ~80 lignes)
2. **Créer `src/components/dashboard/Charts.tsx`** (port direct, ~100 lignes)
3. **Créer `src/components/dashboard/KPICard.tsx`** (nouveau, ~30 lignes)
4. **Créer `src/components/dashboard/ActivityFeed.tsx`** (nouveau, ~50 lignes)
5. **Créer `src/components/dashboard/GeographicReach.tsx`** (nouveau, ~40 lignes)
6. **Créer `src/components/dashboard/FundAllocation.tsx`** (nouveau, ~50 lignes)
7. **Réécrire `src/components/Dashboard.tsx`** (compose les 6 composants ci-dessus, ~150 lignes)
8. **Changer la couleur par défaut dans `src/context/AppContext.tsx`** : `primaryColor: '#16a34a'` → `'#0d9488'`
9. **Changer la couleur par défaut dans `src/db/database.ts`** : idem (fallback Dexie)
10. **Mettre à jour la base de données** : UPDATE settings SET value=... pour le row `ong` existant
11. **Build & smoke test local** (`npm run build`)
12. **Déploiement** : upload des nouveaux chunks vers `/www/admin/assets/`
13. **Vérification en production** : `https://ongases.org/admin/` → vider cache navigateur

## API endpoint requis

Le composant `ActivityFeed` doit charger `audit_logs` via l'API. Endpoint à vérifier/ajouter :
- `GET /api/logs.php?action=list` — doit retourner `[{id, user_id, user_name, action, details, timestamp}]`

**Vérification requise** : lire `api/logs.php` pour confirmer que `action=list` existe et retourne le format attendu. Si manquant, l'ajouter (peut nécessiter un nouveau déploiement API).

## Garde-fous & tests

- **TypeScript** : le projet utilise TS strict, s'assurer que tous les types sont corrects
- **Build** : `npm run build` doit passer sans warning
- **Runtime** : ouvrir `https://ongases.org/admin/`, vider cache (Ctrl+F5), vérifier :
  - 4 KPI cards affichent des nombres réels (pas "—" ou "0")
  - Le chart dons mensuels s'affiche
  - Le donut affectation a des segments
  - La liste de projets affiche 4 entrées
  - L'activity feed a 5 entrées (ou un empty state)
  - Le bouton "Exporter en PDF" fonctionne
  - **La Sidebar a un gradient teal** (au lieu de vert)
  - **Le bouton "Se déconnecter" est teal** (primary color appliquée)
- **Mode sombre** : vérifier que les nouveaux composants ne cassent pas le dark mode du reste de l'app
- **Base de données** : vérifier que la migration SQL a bien mis à jour `settings.value` pour le row `ong`

## Hors-scope (explicite)

- ❌ Refactor de Sidebar, TopBar, Layout (le code reste identique, juste la couleur par défaut change)
- ❌ Migration des pages Membres, Projets, Dons, etc. (leurs classes Tailwind `green-XXX` hardcodées restent)
- ❌ Remplacement de `recharts` (l'app garde recharts pour les autres pages)
- ❌ Mode sombre complet pour les nouveaux composants
- ❌ Refactor du système de routing
- ❌ Internationalisation
- ❌ Conversion des classes `green-XXX` hardcodées en `teal-XXX` (refactor séparé)

**Note** : les classes Tailwind `green-XXX` hardcodées dans les pages (ex: `bg-green-600` dans Membres, `text-green-700` dans Projets) ne sont PAS affectées par ce changement. Seules les zones qui lisent dynamiquement `data.ong.primaryColor` (Sidebar gradient, boutons primaires configurables) basculent en teal. Pour uniformiser, un refactor ultérieur serait nécessaire.

## Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `logs.php` n'expose pas `audit_logs` | Faible | Activity feed vide | Vérifier en amont, fallback empty state |
| `recharts` reste installé (dead code après retrait des autres pages) | N/A | N/A | Aucune action — autres pages l'utilisent |
| Conflit de noms `Card`/`Badge` avec l'existant | Élevée | Build error | Isoler dans namespace `dashboard/` |
| Le chart SVG ne s'affiche pas correctement en dark mode | Moyenne | UX dégradée | Forcer couleurs fixes, OK en V1 |
| Le `perPage=10000` dans `loadFromAPI` charge trop | Faible | Ralentissement | Inchangé (déjà géré par API) |

## Critères de succès

- [ ] Build local passe sans erreur
- [ ] Dashboard affiche les 4 KPI avec données réelles
- [ ] Chart dons mensuels + Donut affectation + Liste projets + Activity feed + Geographic reach tous visibles
- [ ] Export PDF fonctionne
- [ ] **Sidebar gradient en teal** (au lieu de vert)
- [ ] **Base de données mise à jour** : `primaryColor` du row `ong` = `#0d9488`
- [ ] Aucune régression sur les autres pages
- [ ] Bundle size de Dashboard n'augmente pas de plus de 50 KB
