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
mysql -u root --default-character-set=utf8mb4 -e "CREATE DATABASE vite_et_gourmand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root --default-character-set=utf8mb4 vite_et_gourmand < database/schema.sql
mysql -u root --default-character-set=utf8mb4 vite_et_gourmand < database/seed.sql
```

⚠️ Le flag `--default-character-set=utf8mb4` est important sur Windows : sans lui, le client `mysql` peut mal interpréter les accents des fichiers `.sql` et corrompre les données importées (ex. "Noël" devient "No├½l").

Lancer le serveur en mode développement :

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000

## Déploiement

L'application est prévue pour être déployée sur **[Railway](https://railway.app/)**, qui permet d'héberger au même endroit le service Node.js, une base MySQL et une base MongoDB (via son marketplace de plugins), le tout relié au dépôt GitHub pour un déploiement automatique à chaque push sur `main`.

### Étapes

1. **Créer un compte Railway** (connexion possible avec le compte GitHub déjà utilisé pour ce dépôt).
2. **Nouveau projet** → *Deploy from GitHub repo* → sélectionner `Wazooow/vite-et-gourmand`, branche `main`.
3. **Ajouter un plugin MySQL** au projet (bouton *New* → *Database* → *MySQL*). Railway fournit automatiquement les variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
4. **Ajouter un plugin MongoDB** au projet (*New* → *Database* → *MongoDB*). Railway fournit `MONGO_URL`.
5. **Configurer les variables d'environnement** du service Node (onglet *Variables*) :
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` → recopier les valeurs `MYSQLHOST`/`MYSQLPORT`/`MYSQLUSER`/`MYSQLPASSWORD`/`MYSQLDATABASE` fournies par le plugin MySQL (ou les référencer directement avec la syntaxe `${{MySQL.MYSQLHOST}}` etc.)
   - `MONGO_URI` → valeur de `MONGO_URL` fournie par le plugin MongoDB
   - `SESSION_SECRET` → une chaîne aléatoire longue et secrète (différente de celle utilisée en local)
   - `NODE_ENV` → `production`
   - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` → les identifiants d'un vrai fournisseur SMTP (voir ci-dessous)
   - `CONTACT_EMAIL` → l'adresse qui doit recevoir les messages du formulaire de contact
   - `PORT` → laissé vide, Railway l'injecte automatiquement
6. **Initialiser le schéma** sur la base MySQL de production : récupérer les identifiants de connexion externes du plugin MySQL (onglet *Connect*) et exécuter une fois, depuis un poste local :
   ```bash
   mysql -h <host> -P <port> -u <user> -p<password> --default-character-set=utf8mb4 <database> < database/schema.sql
   mysql -h <host> -P <port> -u <user> -p<password> --default-character-set=utf8mb4 <database> < database/seed.sql
   ```
7. Railway détecte automatiquement un projet Node.js (via `package.json`) et exécute `npm install` puis `npm start`. Le déploiement se relance à chaque push sur `main`.

### Fournisseur SMTP en production

Le compte de test Ethereal utilisé en développement n'envoie pas de vrais emails. En production, un vrai fournisseur est nécessaire — par exemple [Brevo](https://www.brevo.com/) (ex-Sendinblue) ou [Mailtrap](https://mailtrap.io/) en mode transactionnel, tous deux avec une offre gratuite suffisante pour ce projet. Renseigner les identifiants SMTP fournis dans les variables `MAIL_*`.

## Organisation Git

- `main` : version stable/livrable
- `develop` : intégration des fonctionnalités en cours
- `feature/xxx` : une branche par fonctionnalité, mergée dans `develop` après tests, puis `develop` → `main` une fois validée
