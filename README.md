# Vite & Gourmand

Application web de commande de menus traiteur pour l'entreprise "Vite & Gourmand" (Bordeaux).

## Stack technique

- Back-end : Node.js / Express
- Vues : EJS (rendu côté serveur)
- Base de données relationnelle : MySQL
- Base de données non relationnelle : MongoDB
- Front dynamique : JavaScript vanilla (fetch) pour les filtres et graphiques

## Démarrage en local

### Prérequis

- [Node.js LTS](https://nodejs.org/) (v22+)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) (v8+)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)

Sur Windows, ces trois outils peuvent s'installer via `winget` :

```bash
winget install OpenJS.NodeJS.LTS
winget install Oracle.MySQL
winget install MongoDB.Server
```

MongoDB s'installe et démarre automatiquement comme service Windows.

MySQL, lui, doit être initialisé manuellement après installation (une seule fois) :

```bash
mkdir "C:\chemin\vers\mysql-data"
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\chemin\vers\mysql-data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --datadir="C:\chemin\vers\mysql-data"
net start MySQL84
```

`--initialize-insecure` crée un compte `root` sans mot de passe, pratique en local. **Ne jamais faire ça en production** — voir la section sécurité de la documentation technique.

### Installation du projet

```bash
npm install
cp .env.example .env
# renseigner les variables dans .env (DB_USER=root, DB_PASSWORD= vide en local)
```

Créer la base de données :

```bash
mysql -u root -e "CREATE DATABASE vite_et_gourmand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root vite_et_gourmand < database/schema.sql
mysql -u root vite_et_gourmand < database/seed.sql
```

Lancer le serveur en mode développement :

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000

## Organisation Git

- `main` : version stable/livrable
- `develop` : intégration des fonctionnalités en cours
- `feature/xxx` : une branche par fonctionnalité, mergée dans `develop` après tests, puis `develop` → `main` une fois validée
