# Requirements: Gestion ONG

**Defined:** 2026-05-05
**Core Value:** Centraliser toutes les données de gestion de l'ONG côté serveur pour un accès multi-utilisateur synchronisé et fiable, avec ajout de la gestion de stocks/matériel.

## Phase 1 Requirements — API Serveur Complète

### API Membres
- [ ] **API-MEM-01**: POST /api/membres.php?action=create — Créer un membre
- [ ] **API-MEM-02**: GET /api/membres.php?action=list — Lister tous les membres (avec filtres)
- [ ] **API-MEM-03**: GET /api/membres.php?action=get&id=X — Récupérer un membre
- [ ] **API-MEM-04**: POST /api/membres.php?action=update — Modifier un membre
- [ ] **API-MEM-05**: POST /api/membres.php?action=delete — Supprimer un membre
- [ ] **API-MEM-06**: GET /api/membres.php?action=search&q= — Recherche par nom/email

### API Projets
- [ ] **API-PRJ-01**: POST /api/projets.php?action=create — Créer un projet
- [ ] **API-PRJ-02**: GET /api/projets.php?action=list — Lister tous les projets (avec filtres statut)
- [ ] **API-PRJ-03**: GET /api/projets.php?action=get&id=X — Récupérer un projet
- [ ] **API-PRJ-04**: POST /api/projets.php?action=update — Modifier un projet
- [ ] **API-PRJ-05**: POST /api/projets.php?action=delete — Supprimer un projet

### API Dons
- [ ] **API-DON-01**: POST /api/dons.php?action=create — Créer un don
- [ ] **API-DON-02**: GET /api/dons.php?action=list — Lister tous les dons
- [ ] **API-DON-03**: GET /api/dons.php?action=get&id=X — Récupérer un don
- [ ] **API-DON-04**: POST /api/dons.php?action=update — Modifier un don
- [ ] **API-DON-05**: POST /api/dons.php?action=delete — Supprimer un don

### API Transactions
- [ ] **API-TRX-01**: POST /api/transactions.php?action=create — Créer une transaction
- [ ] **API-TRX-02**: GET /api/transactions.php?action=list — Lister toutes les transactions
- [ ] **API-TRX-03**: GET /api/transactions.php?action=get&id=X — Récupérer une transaction
- [ ] **API-TRX-04**: POST /api/transactions.php?action=update — Modifier une transaction
- [ ] **API-TRX-05**: POST /api/transactions.php?action=delete — Supprimer une transaction

### API Événements
- [ ] **API-EVT-01**: POST /api/evenements.php?action=create — Créer un événement
- [ ] **API-EVT-02**: GET /api/evenements.php?action=list — Lister tous les événements
- [ ] **API-EVT-03**: GET /api/evenements.php?action=get&id=X — Récupérer un événement
- [ ] **API-EVT-04**: POST /api/evenements.php?action=update — Modifier un événement
- [ ] **API-EVT-05**: POST /api/evenements.php?action=delete — Supprimer un événement

### API Paramètres
- [ ] **API-SET-01**: GET /api/settings.php?action=get — Récupérer les paramètres ONG
- [ ] **API-SET-02**: POST /api/settings.php?action=update — Modifier les paramètres ONG

### Sécurité & Infrastructure
- [ ] **API-SEC-01**: Vérification token JWT sur toutes les routes
- [ ] **API-SEC-02**: Validation des données entrantes (types, champs requis)
- [ ] **API-SEC-03**: CORS configuré pour le frontend
- [ ] **API-SEC-04**: Rate limiting basique
- [ ] **API-SEC-05**: Protection SQL injection (prepared statements)
- [ ] **API-DB-01**: Base SQLite unique `gestion.db` avec toutes les tables

### Sync Frontend
- [ ] **API-SYNC-01**: Dexie synchronisé avec l'API au lieu de données locales
- [ ] **API-SYNC-02**: Composants frontend appellent l'API au lieu de Dexie direct

## Phase 2 Requirements — Module Stocks

### Module Stocks — Articles
- [ ] **STK-ART-01**: CRUD articles (nom, description, catégorie, quantité, seuil alerte, unité)
- [ ] **STK-ART-02**: Catégories d'articles (fournitures, matériel, médicaments, etc.)
- [ ] **STK-ART-03**: Recherche et filtrage d'articles

### Module Stocks — Mouvements
- [ ] **STK-MVT-01**: Entrées de stock (réception, achat, don)
- [ ] **STK-MVT-02**: Sorties de stock (utilisation, distribution, perte)
- [ ] **STK-MVT-03**: Historique des mouvements par article
- [ ] **STK-MVT-04**: Attribution d'articles à un projet

### Module Stocks — API & UI
- [ ] **STK-API-01**: API REST stocks complète (articles + mouvements)
- [ ] **STK-UI-01**: Page Stocks dans l'application React
- [ ] **STK-UI-02**: Dashboard stock avec alertes seuil bas
- [ ] **STK-UI-03**: Export inventaire PDF

## Out of Scope

| Feature | Reason |
|---|---|
| Application mobile | Complexité élevée, web-first |
| Paiements en ligne | Pas de besoin identifié |
| Intégration email/SMS | Peut être ajouté plus tard |
| Multi-devises avancé | FCFA suffit pour v1 |

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| API-MEM-01 à 06 | Phase 1 | Pending |
| API-PRJ-01 à 05 | Phase 1 | Pending |
| API-DON-01 à 05 | Phase 1 | Pending |
| API-TRX-01 à 05 | Phase 1 | Pending |
| API-EVT-01 à 05 | Phase 1 | Pending |
| API-SET-01 à 02 | Phase 1 | Pending |
| API-SEC-01 à 05 | Phase 1 | Pending |
| API-DB-01 | Phase 1 | Pending |
| API-SYNC-01 à 02 | Phase 1 | Pending |
| STK-ART-01 à 03 | Phase 2 | Pending |
| STK-MVT-01 à 04 | Phase 2 | Pending |
| STK-API-01 | Phase 2 | Pending |
| STK-UI-01 à 03 | Phase 2 | Pending |

**Coverage:**
- Phase 1: 31 requirements
- Phase 2: 10 requirements
- Total: 41 requirements — all mapped ✓

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initial definition*
