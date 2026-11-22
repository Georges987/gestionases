# STATE.md

## Project: Gestion ONG

**Core value:** Centraliser toutes les données de gestion de l'ONG côté serveur pour un accès multi-utilisateur synchronisé et fiable, avec ajout de la gestion de stocks/matériel.

**Current focus:** Phase 1 & 2 — Complétées

## Phase Status

| Phase | Status | Progress |
|---|---|---|
| 1 — API Serveur & Sync | ✓ Complete | 100% |
| 2 — Module Stocks | ✓ Complete | 100% |

## Implementation Summary

### Phase 1 — API Serveur & Synchronisation ✅

**API endpoints créés:**
- `api/db.php` — Connection SQLite centralisée + initialisation tables
- `api/membres.php` — CRUD complet (create, list, get, search, update, delete)
- `api/projets.php` — CRUD complet avec filtres
- `api/dons.php` — CRUD complet avec filtres
- `api/transactions.php` — CRUD complet + stats
- `api/evenements.php` — CRUD complet avec filtres
- `api/settings.php` — Get/Update paramètres ONG

**Sécurité:**
- JWT verification sur toutes les routes
- Validation des champs requis
- Prepared statements (anti SQL injection)
- CORS configuré

**Frontend sync:**
- `src/api/client.ts` — Client API avec tous les endpoints
- `src/context/AppContext.tsx` — Utilise l'API avec fallback Dexie

### Phase 2 — Module Stocks ✅

**API:**
- `api/stocks.php` — CRUD articles + catégories + mouvements
- Transactions atomiques pour les mouvements (quantité mise à jour automatiquement)
- Historique des mouvements par article
- Stats de stock
- Alertes stock bas

**Frontend:**
- `src/components/Stocks.tsx` — Module complet avec 3 onglets
- `src/types.ts` — Types StockArticle, StockCategorie, StockMouvement
- Dashboard avec stats (total articles, catégories, stock faible, mouvements)
- Recherche et filtrage articles
- Formulaire ajout/modification article
- Formulaire mouvements (entrée/sortie)
- Gestion catégories
- Export PDF inventaire
- Modal détails avec historique mouvements

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05 after implementation)
See: .planning/REQUIREMENTS.md (defined 2026-05-05)
See: .planning/ROADMAP.md (created 2026-05-05)

---
*Last updated: 2026-05-05 after Phase 1 & 2 completion*
