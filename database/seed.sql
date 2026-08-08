-- Vite & Gourmand — données de démonstration
-- À exécuter après schema.sql

-- ---------------------------------------------------------------------------
-- Rôles
-- ---------------------------------------------------------------------------
INSERT INTO role (libelle) VALUES
  ('utilisateur'),
  ('employe'),
  ('administrateur');

-- ---------------------------------------------------------------------------
-- Comptes de test
-- Mots de passe en clair (pour toi uniquement, ne jamais committer ça en vrai) :
--   admin@vite-et-gourmand.fr    -> Admin1234!
--   employe@vite-et-gourmand.fr  -> Employe1234!
--   client@test.fr               -> Client1234!
-- ---------------------------------------------------------------------------
INSERT INTO utilisateur (email, password, nom, prenom, telephone, ville, pays, adresse_postale, role_id, actif) VALUES
  ('admin@vite-et-gourmand.fr', '$2b$10$u8UL3Qkpeg2M2dpFqutw/eHDOKHcLsducKHzFyTb/3LfKrHveFTKm', 'Dupont', 'Julie', '0600000001', 'Bordeaux', 'France', '1 rue de la Prestation', (SELECT role_id FROM role WHERE libelle = 'administrateur'), TRUE),
  ('employe@vite-et-gourmand.fr', '$2b$10$B0s1Zwpo0jn05L9UKmZeGe1zgP4FLa45vNL4N8oeoI7Tq5JfBs6UW', 'Martin', 'José', '0600000002', 'Bordeaux', 'France', '2 rue de la Cuisine', (SELECT role_id FROM role WHERE libelle = 'employe'), TRUE),
  ('client@test.fr', '$2b$10$25wpakJYQDTp.Rtf3a59yOF/gUXxVS1pol/sErIh8HmhchpytS21S', 'Durand', 'Camille', '0600000003', 'Mérignac', 'France', '3 rue du Client', (SELECT role_id FROM role WHERE libelle = 'utilisateur'), TRUE);

-- ---------------------------------------------------------------------------
-- Thèmes / régimes / allergènes
-- ---------------------------------------------------------------------------
INSERT INTO theme (libelle) VALUES ('Noel'), ('Paques'), ('Classique'), ('Evenement');

INSERT INTO regime (libelle) VALUES ('Classique'), ('Vegetarien'), ('Vegan');

INSERT INTO allergene (libelle) VALUES
  ('Gluten'), ('Lactose'), ('Arachide'), ('Fruits à coque'),
  ('Oeuf'), ('Poisson'), ('Crustacés'), ('Soja');

-- ---------------------------------------------------------------------------
-- Horaires
-- ---------------------------------------------------------------------------
INSERT INTO horaire (jour, heure_ouverture, heure_fermeture) VALUES
  ('lundi', '09:00:00', '18:00:00'),
  ('mardi', '09:00:00', '18:00:00'),
  ('mercredi', '09:00:00', '18:00:00'),
  ('jeudi', '09:00:00', '18:00:00'),
  ('vendredi', '09:00:00', '19:00:00'),
  ('samedi', '10:00:00', '19:00:00'),
  ('dimanche', '10:00:00', '15:00:00');

-- ---------------------------------------------------------------------------
-- Plats
-- ---------------------------------------------------------------------------
INSERT INTO plat (titre_plat, type_plat) VALUES
  ('Velouté de châtaignes', 'entree'),
  ('Foie gras maison', 'entree'),
  ('Salade de saison', 'entree'),
  ('Filet mignon en croûte', 'plat'),
  ('Risotto aux champignons', 'plat'),
  ('Dinde farcie', 'plat'),
  ('Bûche de Noël', 'dessert'),
  ('Tarte au citron', 'dessert'),
  ('Fondant au chocolat', 'dessert');

-- allergènes de quelques plats
INSERT INTO plat_allergene (plat_id, allergene_id)
  SELECT p.plat_id, a.allergene_id FROM plat p, allergene a
  WHERE p.titre_plat = 'Foie gras maison' AND a.libelle = 'Gluten';
INSERT INTO plat_allergene (plat_id, allergene_id)
  SELECT p.plat_id, a.allergene_id FROM plat p, allergene a
  WHERE p.titre_plat = 'Filet mignon en croûte' AND a.libelle = 'Gluten';
INSERT INTO plat_allergene (plat_id, allergene_id)
  SELECT p.plat_id, a.allergene_id FROM plat p, allergene a
  WHERE p.titre_plat = 'Fondant au chocolat' AND a.libelle = 'Oeuf';
INSERT INTO plat_allergene (plat_id, allergene_id)
  SELECT p.plat_id, a.allergene_id FROM plat p, allergene a
  WHERE p.titre_plat = 'Fondant au chocolat' AND a.libelle = 'Lactose';

-- ---------------------------------------------------------------------------
-- Menus
-- ---------------------------------------------------------------------------
INSERT INTO menu (titre, nombre_personne_minimum, prix_par_personne, description, conditions, quantite_restante, theme_id, regime_id) VALUES
  ('Menu de Noël Traditionnel', 6, 45.00, 'Un menu chaleureux et généreux pour les fêtes de fin d\'année.', 'À commander au moins 2 semaines à l\'avance. Conservation 48h au réfrigérateur.', 5, (SELECT theme_id FROM theme WHERE libelle = 'Noel'), (SELECT regime_id FROM regime WHERE libelle = 'Classique')),
  ('Menu Pâques Champêtre', 4, 38.00, 'Un menu frais et printanier pour Pâques.', 'À commander au moins 1 semaine à l\'avance.', 8, (SELECT theme_id FROM theme WHERE libelle = 'Paques'), (SELECT regime_id FROM regime WHERE libelle = 'Classique')),
  ('Menu Végétarien du Chef', 4, 32.00, 'Une sélection végétarienne raffinée pour tout événement.', 'À commander au moins 1 semaine à l\'avance.', 10, (SELECT theme_id FROM theme WHERE libelle = 'Evenement'), (SELECT regime_id FROM regime WHERE libelle = 'Vegetarien'));

INSERT INTO menu_plat (menu_id, plat_id)
  SELECT m.menu_id, p.plat_id FROM menu m, plat p
  WHERE m.titre = 'Menu de Noël Traditionnel' AND p.titre_plat IN ('Velouté de châtaignes', 'Dinde farcie', 'Bûche de Noël');

INSERT INTO menu_plat (menu_id, plat_id)
  SELECT m.menu_id, p.plat_id FROM menu m, plat p
  WHERE m.titre = 'Menu Pâques Champêtre' AND p.titre_plat IN ('Salade de saison', 'Filet mignon en croûte', 'Tarte au citron');

INSERT INTO menu_plat (menu_id, plat_id)
  SELECT m.menu_id, p.plat_id FROM menu m, plat p
  WHERE m.titre = 'Menu Végétarien du Chef' AND p.titre_plat IN ('Salade de saison', 'Risotto aux champignons', 'Fondant au chocolat');
