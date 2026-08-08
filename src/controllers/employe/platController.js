const pool = require("../../config/mysql");

async function getAllergenes() {
  const [allergenes] = await pool.query("SELECT allergene_id, libelle FROM allergene ORDER BY libelle");
  return allergenes;
}

async function listerPlats(req, res) {
  const [plats] = await pool.query("SELECT plat_id, titre_plat, type_plat FROM plat ORDER BY type_plat, titre_plat");
  res.render("employe/plats/liste", { plats });
}

async function formulaireNouveauPlat(req, res) {
  const allergenes = await getAllergenes();
  res.render("employe/plats/formulaire", { plat: null, allergenesSelectionnes: [], allergenes, erreurs: [] });
}

async function creerPlat(req, res) {
  const { titre_plat, type_plat } = req.body;
  const allergenesChoisis = [].concat(req.body.allergenes || []);
  const allergenes = await getAllergenes();

  const erreurs = [];
  if (!titre_plat) erreurs.push("Le titre du plat est obligatoire.");
  if (!["entree", "plat", "dessert"].includes(type_plat)) erreurs.push("Le type de plat est invalide.");

  if (erreurs.length > 0) {
    return res.render("employe/plats/formulaire", { plat: req.body, allergenesSelectionnes: allergenesChoisis.map(Number), allergenes, erreurs });
  }

  const [resultat] = await pool.query("INSERT INTO plat (titre_plat, type_plat) VALUES (?, ?)", [titre_plat, type_plat]);
  for (const allergeneId of allergenesChoisis) {
    await pool.query("INSERT INTO plat_allergene (plat_id, allergene_id) VALUES (?, ?)", [resultat.insertId, Number(allergeneId)]);
  }

  req.session.flash = { type: "succes", message: "Plat créé." };
  res.redirect("/employe/plats");
}

async function formulaireModifierPlat(req, res) {
  const platId = Number(req.params.id);
  const [platRows] = await pool.query("SELECT * FROM plat WHERE plat_id = ?", [platId]);
  const plat = platRows[0];
  if (!plat) {
    return res.status(404).render("erreur", { title: "Plat introuvable", message: "Ce plat n'existe pas." });
  }
  const [selection] = await pool.query("SELECT allergene_id FROM plat_allergene WHERE plat_id = ?", [platId]);
  const allergenes = await getAllergenes();

  res.render("employe/plats/formulaire", { plat, allergenesSelectionnes: selection.map((a) => a.allergene_id), allergenes, erreurs: [] });
}

async function modifierPlat(req, res) {
  const platId = Number(req.params.id);
  const { titre_plat, type_plat } = req.body;
  const allergenesChoisis = [].concat(req.body.allergenes || []);
  const allergenes = await getAllergenes();

  const erreurs = [];
  if (!titre_plat) erreurs.push("Le titre du plat est obligatoire.");
  if (!["entree", "plat", "dessert"].includes(type_plat)) erreurs.push("Le type de plat est invalide.");

  if (erreurs.length > 0) {
    return res.render("employe/plats/formulaire", {
      plat: { ...req.body, plat_id: platId },
      allergenesSelectionnes: allergenesChoisis.map(Number),
      allergenes,
      erreurs,
    });
  }

  await pool.query("UPDATE plat SET titre_plat = ?, type_plat = ? WHERE plat_id = ?", [titre_plat, type_plat, platId]);
  await pool.query("DELETE FROM plat_allergene WHERE plat_id = ?", [platId]);
  for (const allergeneId of allergenesChoisis) {
    await pool.query("INSERT INTO plat_allergene (plat_id, allergene_id) VALUES (?, ?)", [platId, Number(allergeneId)]);
  }

  req.session.flash = { type: "succes", message: "Plat mis à jour." };
  res.redirect("/employe/plats");
}

async function supprimerPlat(req, res) {
  const platId = Number(req.params.id);
  try {
    await pool.query("DELETE FROM plat WHERE plat_id = ?", [platId]);
    req.session.flash = { type: "succes", message: "Plat supprimé." };
  } catch (err) {
    req.session.flash = { type: "erreur", message: "Impossible de supprimer ce plat : il est utilisé dans un ou plusieurs menus." };
  }
  res.redirect("/employe/plats");
}

module.exports = { listerPlats, formulaireNouveauPlat, creerPlat, formulaireModifierPlat, modifierPlat, supprimerPlat };
