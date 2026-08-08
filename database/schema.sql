-- Vite & Gourmand — création du schéma relationnel (MySQL)
-- À exécuter sur une base déjà créée : CREATE DATABASE vite_et_gourmand ...;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- role : type de compte (utilisateur / employe / administrateur)
-- ---------------------------------------------------------------------------
CREATE TABLE role (
  role_id   INT AUTO_INCREMENT PRIMARY KEY,
  libelle   VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- utilisateur : tout compte pouvant se connecter (client, employé, admin)
-- ---------------------------------------------------------------------------
CREATE TABLE utilisateur (
  utilisateur_id          INT AUTO_INCREMENT PRIMARY KEY,
  email                   VARCHAR(100) NOT NULL UNIQUE,
  password                VARCHAR(255) NOT NULL,
  nom                     VARCHAR(50) NOT NULL,
  prenom                  VARCHAR(50) NOT NULL,
  telephone               VARCHAR(20),
  ville                   VARCHAR(50),
  pays                    VARCHAR(50),
  adresse_postale         VARCHAR(150),
  role_id                 INT NOT NULL,
  actif                   BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token             VARCHAR(255),
  reset_token_expiration  DATETIME,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

-- ---------------------------------------------------------------------------
-- theme et regime : catégorisation des menus
-- ---------------------------------------------------------------------------
CREATE TABLE theme (
  theme_id  INT AUTO_INCREMENT PRIMARY KEY,
  libelle   VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE regime (
  regime_id INT AUTO_INCREMENT PRIMARY KEY,
  libelle   VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- menu
-- ---------------------------------------------------------------------------
CREATE TABLE menu (
  menu_id                   INT AUTO_INCREMENT PRIMARY KEY,
  titre                     VARCHAR(100) NOT NULL,
  nombre_personne_minimum   INT NOT NULL,
  prix_par_personne         DECIMAL(8,2) NOT NULL,
  description               TEXT,
  conditions                TEXT,
  quantite_restante         INT NOT NULL DEFAULT 0,
  theme_id                  INT NOT NULL,
  regime_id                 INT NOT NULL,
  actif                     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (theme_id) REFERENCES theme(theme_id),
  FOREIGN KEY (regime_id) REFERENCES regime(regime_id)
);

-- ---------------------------------------------------------------------------
-- plat
-- ---------------------------------------------------------------------------
CREATE TABLE plat (
  plat_id     INT AUTO_INCREMENT PRIMARY KEY,
  titre_plat  VARCHAR(100) NOT NULL,
  photo       VARCHAR(255),
  type_plat   ENUM('entree', 'plat', 'dessert') NOT NULL
);

-- ---------------------------------------------------------------------------
-- menu_plat : association N,N entre menu et plat
-- ---------------------------------------------------------------------------
CREATE TABLE menu_plat (
  menu_id  INT NOT NULL,
  plat_id  INT NOT NULL,
  PRIMARY KEY (menu_id, plat_id),
  FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE,
  FOREIGN KEY (plat_id) REFERENCES plat(plat_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- allergene
-- ---------------------------------------------------------------------------
CREATE TABLE allergene (
  allergene_id  INT AUTO_INCREMENT PRIMARY KEY,
  libelle       VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- plat_allergene : association N,N entre plat et allergene
-- ---------------------------------------------------------------------------
CREATE TABLE plat_allergene (
  plat_id       INT NOT NULL,
  allergene_id  INT NOT NULL,
  PRIMARY KEY (plat_id, allergene_id),
  FOREIGN KEY (plat_id) REFERENCES plat(plat_id) ON DELETE CASCADE,
  FOREIGN KEY (allergene_id) REFERENCES allergene(allergene_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- horaire
-- ---------------------------------------------------------------------------
CREATE TABLE horaire (
  horaire_id       INT AUTO_INCREMENT PRIMARY KEY,
  jour             ENUM('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL UNIQUE,
  heure_ouverture  TIME,
  heure_fermeture  TIME
);

-- ---------------------------------------------------------------------------
-- commande
-- ---------------------------------------------------------------------------
CREATE TABLE commande (
  commande_id               INT AUTO_INCREMENT PRIMARY KEY,
  numero_commande           VARCHAR(50) NOT NULL UNIQUE,
  utilisateur_id            INT NOT NULL,
  menu_id                   INT NOT NULL,
  date_commande             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_prestation           DATE NOT NULL,
  heure_livraison           TIME NOT NULL,
  adresse_livraison         VARCHAR(150) NOT NULL,
  ville_livraison           VARCHAR(50) NOT NULL,
  code_postal_livraison     VARCHAR(10) NOT NULL,
  distance_km               DECIMAL(6,2) NOT NULL DEFAULT 0,
  nombre_personne           INT NOT NULL,
  prix_menu                 DECIMAL(10,2) NOT NULL,
  prix_livraison            DECIMAL(8,2) NOT NULL DEFAULT 0,
  reduction_appliquee       BOOLEAN NOT NULL DEFAULT FALSE,
  statut                    ENUM(
                               'en_attente',
                               'accepte',
                               'en_preparation',
                               'en_cours_de_livraison',
                               'livre',
                               'en_attente_retour_materiel',
                               'terminee',
                               'annulee'
                             ) NOT NULL DEFAULT 'en_attente',
  pret_materiel              BOOLEAN NOT NULL DEFAULT FALSE,
  restitution_materiel       BOOLEAN NOT NULL DEFAULT FALSE,
  date_limite_restitution    DATE,
  motif_derniere_modif       TEXT,
  created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(utilisateur_id),
  FOREIGN KEY (menu_id) REFERENCES menu(menu_id)
);

-- ---------------------------------------------------------------------------
-- commande_statut_historique : horodatage de chaque changement de statut
-- ---------------------------------------------------------------------------
CREATE TABLE commande_statut_historique (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  commande_id       INT NOT NULL,
  statut            VARCHAR(50) NOT NULL,
  date_changement   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commande(commande_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- avis : donné par un utilisateur, à propos d'une commande terminée
-- ---------------------------------------------------------------------------
CREATE TABLE avis (
  avis_id         INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id  INT NOT NULL,
  commande_id     INT NOT NULL UNIQUE,
  note            TINYINT NOT NULL,
  description     TEXT,
  statut          ENUM('en_attente', 'valide', 'refuse') NOT NULL DEFAULT 'en_attente',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (note BETWEEN 1 AND 5),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(utilisateur_id),
  FOREIGN KEY (commande_id) REFERENCES commande(commande_id)
);

SET FOREIGN_KEY_CHECKS = 1;
