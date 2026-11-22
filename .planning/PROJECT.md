# Gestion ONG — Complétion API + Stocks

## What This Is

Application web de gestion interne pour ONG couvrant membres, projets, dons, finances, événements et rapports. Stack : React 19 + TypeScript + Vite 7 + Tailwind 4, avec Dexie (IndexedDB) côté client et PHP + SQLite côté serveur. Actuellement, seule l'authentification est synchronisée via l'API serveur — toutes les données métiers sont locales au navigateur.

## Core Value

Centraliser toutes les données de gestion de l'ONG côté serveur pour un accès multi-utilisateur synchronisé et fiable, avec ajout de la gestion de stocks/matériel.

## Requirements

### Validated

- ✓ Authentification JWT avec rôles (admin/gestionnaire/lecteur) — existant via auth.php
- ✓ CRUD Membres (IndexedDB) — existant
- ✓ CRUD Projets (IndexedDB) — existant
- ✓ CRUD Dons (IndexedDB) — existant
- ✓ CRUD Finances/Transactions (IndexedDB) — existant
- ✓ CRUD Événements (IndexedDB) — existant
- ✓ Rapports PDF — existant via jsPDF
- ✓ Dashboard avec vue d'ensemble — existant
- ✓ Paramètres de l'ONG — existant

### Active

- [ ] API REST complète pour Membres (CRUD serveur)
- [ ] API REST complète pour Projets (CRUD serveur)
- [ ] API REST complète pour Dons (CRUD serveur)
- [ ] API REST complète pour Transactions (CRUD serveur)
- [ ] API REST complète pour Événements (CRUD serveur)
- [ ] API REST complète pour Paramètres ONG (CRUD serveur)
- [ ] Migration Dexie → API serveur avec sync
- [ ] Multi-utilisateur réel (données partagées)
- [ ] Module Stocks — CRUD complet (articles, catégories, entrées, sorties)
- [ ] Module Stocks — Dashboard avec alertes seuil bas
- [ ] Module Stocks — Rapports d'inventaire PDF
- [ ] Sécurité API — validation, rate limiting, CORS

### Out of Scope

- [Application mobile] — Complexité élevée, web-first
- [Paiements en ligne] — Pas de besoin identifié pour v1
- [Intégration email/SMS] — Peut être ajouté plus tard

## Context

Projet existant déployable sur OVH mutualisé (PHP 7.4+ avec PDO SQLite). Données actuelles dans IndexedDB (Dexie) — synchronisation serveur nécessaire pour usage multi-utilisateur. Base SQLite `users.db` existe déjà pour l'authentification. Les autres tables (membres, projets, dons, transactions, événements, stocks) seront ajoutées.

## Constraints

- **[Stack serveur]**: PHP + SQLite — imposé par hébergement OVH mutualisé
- **[Frontend]**: React 19 + Dexie — Dexie servira de cache local avec sync API
- **[Déploiement]**: FTP OVH — pas d'accès SSH, pas de Node.js serveur

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| API REST avec fichiers PHP séparés par entité | Cohérent avec l'architecture existante (auth.php) | — Pending |
| SQLite pour toutes les tables | Pas de MySQL sur OVH mutualisé, WAL mode pour concurrence | — Pending |
| Dexie comme cache local + API serveur | Performance offline + sync centrale | — Pending |
| Module Stocks comme nouvelle entité | Feature manquante identifiée par l'utilisateur | — Pending |

---
*Last updated: 2026-05-05 after codebase analysis*
