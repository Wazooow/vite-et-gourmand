const fs = require("fs");
const path = require("path");
const pool = require("../../config/mysql");

async function getReferentiels() {
  const [themes] = await pool.query("SELECT theme_id, libelle FROM theme ORDER BY libelle");
  const [regimes] = await pool.query("SELECT regime_id, libelle FROM regime ORDER BY libelle");
  const [plats] = await pool.query("SELECT plat_id, titre_plat, type_plat FROM plat ORDER BY type_plat, titre_plat");
  return { themes, regimes, plats };
}

async function listerMenus(req, res) {
  const [menus] = await pool.query(
    `SELECT m.menu_id, m.titre, m.prix_par_personne, m.quantite_restante, m.actif, t.libelle AS theme
     FROM menu m JOIN theme t ON t.theme_id = m.theme_id
     ORDER BY m.actif DESC, m.titre`
  );
  res.render("employe/menus/liste", { menus });
}

async function formulaireNouveauMenu(req, res) {
  const referentiels = await getReferentiels();
  res.render("employe/menus/formulaire", { menu: null, platsSelectionnes: [], erreurs: [], ...referentiels });
}

async function creerMenu(req, res) {
  const referentiels = await getReferentiels();
  const { titre, description, conditions, nombre_personne_minimum, prix_par_personne, quantite_restante, theme_id, regime_id } = req.body;
  const platsChoisis = [].concat(req.body.plats || []);

  const erreurs = [];
  if (!titre) erreurs.push("Le titre est obligatoire.");
  if (!nombre_personne_minimum || Number(nombre_personne_minimum) < 1) erreurs.push("Le nombre de personnes minimum doit être positif.");
  if (!prix_par_personne || Number(prix_par_personne) <= 0) erreurs.push("Le prix par personne doit être positif.");
  if (platsChoisis.length === 0) erreurs.push("Sélectionne au moins un plat.");

  if (erreurs.length > 0) {
    return res.render("employe/menus/formulaire", { menu: req.body, platsSelectionnes: platsChoisis.map(Number), erreurs, ...referentiels });
  }

  const [resultat] = await pool.query(
    `INSERT INTO menu (titre, description, conditions, nombre_personne_minimum, prix_par_personne, quantite_restante, theme_id, regime_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [titre, description || null, conditions || null, Number(nombre_personne_minimum), Number(prix_par_personne), Number(quantite_restante) || 0, Number(theme_id), Number(regime_id)]
  );

  for (const platId of platsChoisis) {
    await pool.query("INSERT INTO menu_plat (menu_id, plat_id) VALUES (?, ?)", [resultat.insertId, Number(platId)]);
  }

  req.session.flash = { type: "succes", message: "Menu créé." };
  res.redirect(`/employe/menus/${resultat.insertId}/modifier`);
}

async function formulaireModifierMenu(req, res) {
  const menuId = Number(req.params.id);
  const [menuRows] = await pool.query("SELECT * FROM menu WHERE menu_id = ?", [menuId]);
  const menu = menuRows[0];
  if (!menu) {
    return res.status(404).render("erreur", { title: "Menu introuvable", message: "Ce menu n'existe pas." });
  }

  const [platsSelectionnes] = await pool.query("SELECT plat_id FROM menu_plat WHERE menu_id = ?", [menuId]);
  const [images] = await pool.query("SELECT image_id, chemin FROM menu_image WHERE menu_id = ? ORDER BY ordre", [menuId]);
  const referentiels = await getReferentiels();

  res.render("employe/menus/formulaire", {
    menu,
    images,
    platsSelectionnes: platsSelectionnes.map((p) => p.plat_id),
    erreurs: [],
    ...referentiels,
  });
}

async function modifierMenu(req, res) {
  const menuId = Number(req.params.id);
  const referentiels = await getReferentiels();
  const { titre, description, conditions, nombre_personne_minimum, prix_par_personne, quantite_restante, theme_id, regime_id } = req.body;
  const platsChoisis = [].concat(req.body.plats || []);

  const erreurs = [];
  if (!titre) erreurs.push("Le titre est obligatoire.");
  if (!nombre_personne_minimum || Number(nombre_personne_minimum) < 1) erreurs.push("Le nombre de personnes minimum doit être positif.");
  if (!prix_par_personne || Number(prix_par_personne) <= 0) erreurs.push("Le prix par personne doit être positif.");
  if (platsChoisis.length === 0) erreurs.push("Sélectionne au moins un plat.");

  if (erreurs.length > 0) {
    const [images] = await pool.query("SELECT image_id, chemin FROM menu_image WHERE menu_id = ? ORDER BY ordre", [menuId]);
    return res.render("employe/menus/formulaire", {
      menu: { ...req.body, menu_id: menuId },
      images,
      platsSelectionnes: platsChoisis.map(Number),
      erreurs,
      ...referentiels,
    });
  }

  await pool.query(
    `UPDATE menu SET titre=?, description=?, conditions=?, nombre_personne_minimum=?, prix_par_personne=?, quantite_restante=?, theme_id=?, regime_id=?
     WHERE menu_id = ?`,
    [titre, description || null, conditions || null, Number(nombre_personne_minimum), Number(prix_par_personne), Number(quantite_restante) || 0, Number(theme_id), Number(regime_id), menuId]
  );

  await pool.query("DELETE FROM menu_plat WHERE menu_id = ?", [menuId]);
  for (const platId of platsChoisis) {
    await pool.query("INSERT INTO menu_plat (menu_id, plat_id) VALUES (?, ?)", [menuId, Number(platId)]);
  }

  req.session.flash = { type: "succes", message: "Menu mis à jour." };
  res.redirect(`/employe/menus/${menuId}/modifier`);
}

async function supprimerMenu(req, res) {
  const menuId = Number(req.params.id);
  // suppression logique : un menu peut être référencé par des commandes passées,
  // on le désactive plutôt que de le supprimer physiquement (intégrité de l'historique)
  await pool.query("UPDATE menu SET actif = FALSE WHERE menu_id = ?", [menuId]);
  req.session.flash = { type: "succes", message: "Menu désactivé (il n'apparaît plus côté client)." };
  res.redirect("/employe/menus");
}

async function ajouterImages(req, res) {
  const menuId = Number(req.params.id);
  const fichiers = req.files || [];

  for (const fichier of fichiers) {
    await pool.query("INSERT INTO menu_image (menu_id, chemin, ordre) VALUES (?, ?, 0)", [menuId, `/uploads/menus/${fichier.filename}`]);
  }

  req.session.flash = { type: "succes", message: `${fichiers.length} image(s) ajoutée(s).` };
  res.redirect(`/employe/menus/${menuId}/modifier`);
}

async function supprimerImage(req, res) {
  const { id: menuId, imageId } = req.params;
  const [rows] = await pool.query("SELECT chemin FROM menu_image WHERE image_id = ? AND menu_id = ?", [imageId, menuId]);
  if (rows[0]) {
    const cheminDisque = path.join(__dirname, "..", "..", "..", "public", rows[0].chemin);
    fs.unlink(cheminDisque, () => {});
    await pool.query("DELETE FROM menu_image WHERE image_id = ?", [imageId]);
  }
  res.redirect(`/employe/menus/${menuId}/modifier`);
}

module.exports = {
  listerMenus,
  formulaireNouveauMenu,
  creerMenu,
  formulaireModifierMenu,
  modifierMenu,
  supprimerMenu,
  ajouterImages,
  supprimerImage,
};
