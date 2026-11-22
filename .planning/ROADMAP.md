# Roadmap: Gestion ONG

## Phase 1: API Serveur & Synchronisation

**Goal:** Migrer toutes les données du local (IndexedDB) vers le serveur (SQLite) avec une API REST complète et sécurisée.

**Requirements:** API-MEM-01..06, API-PRJ-01..05, API-DON-01..05, API-TRX-01..05, API-EVT-01..05, API-SET-01..02, API-SEC-01..05, API-DB-01, API-SYNC-01..02

**Success Criteria:**
1. Toutes les entités (membres, projets, dons, transactions, événements, paramètres) ont une API CRUD fonctionnelle
2. Le frontend appelle l'API au lieu de Dexie directement
3. L'authentification JWT protège toutes les routes
4. Deux utilisateurs voient les mêmes données en temps réel
5. Les données persistent après nettoyage du navigateur

---

## Phase 2: Module Stocks

**Goal:** Ajouter un module complet de gestion de stocks avec suivi des articles, mouvements, alertes et rapports.

**Requirements:** STK-ART-01..03, STK-MVT-01..04, STK-API-01, STK-UI-01..03

**Success Criteria:**
1. CRUD articles avec catégories et seuils d'alerte fonctionnel
2. Entrées/sorties de stock tracées avec historique
3. Page Stocks intégrée dans l'application avec dashboard
4. Alertes visuelles pour articles sous le seuil
5. Export PDF de l'inventaire fonctionnel

---

**Phases:** 2 | **Requirements:** 41 | **All mapped ✓**
