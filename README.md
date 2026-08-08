# Vite & Gourmand

Application web de commande de menus traiteur pour l'entreprise "Vite & Gourmand" (Bordeaux).

## Stack technique

- Back-end : Node.js / Express
- Vues : EJS (rendu côté serveur)
- Base de données relationnelle : MySQL
- Base de données non relationnelle : MongoDB
- Front dynamique : JavaScript vanilla (fetch) pour les filtres et graphiques

## Démarrage en local

_À compléter au fur et à mesure du développement._

### Prérequis

- Node.js (v18+)
- MySQL
- MongoDB

### Installation

```bash
npm install
cp .env.example .env
# renseigner les variables dans .env
npm run dev
```

## Organisation Git

- `main` : version stable/livrable
- `develop` : intégration des fonctionnalités en cours
- `feature/xxx` : une branche par fonctionnalité, mergée dans `develop` après tests, puis `develop` → `main` une fois validée
