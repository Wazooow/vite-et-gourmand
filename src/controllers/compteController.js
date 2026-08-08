const pool = require("../config/mysql");

async function afficherMonCompte(req, res) {
  const [commandes] = await pool.query(
    `SELECT c.commande_id, c.numero_commande, c.date_prestation, c.statut,
            c.prix_menu, c.prix_livraison, m.titre AS menu_titre
     FROM commande c JOIN menu m ON m.menu_id = c.menu_id
     WHERE c.utilisateur_id = ?
     ORDER BY c.date_commande DESC`,
    [req.session.user.id]
  );
  res.render("compte/tableau-de-bord", { commandes });
}

async function afficherInformations(req, res) {
  const [rows] = await pool.query(
    "SELECT nom, prenom, email, telephone, ville, pays, adresse_postale FROM utilisateur WHERE utilisateur_id = ?",
    [req.session.user.id]
  );
  res.render("compte/informations", { valeurs: rows[0], erreurs: [] });
}

async function modifierInformations(req, res) {
  const { nom, prenom, telephone, ville, pays, adresse_postale } = req.body;
  const erreurs = [];
  if (!nom || !prenom) erreurs.push("Le nom et le prénom sont obligatoires.");
  if (!telephone) erreurs.push("Le téléphone est obligatoire.");

  if (erreurs.length > 0) {
    return res.render("compte/informations", { valeurs: req.body, erreurs });
  }

  await pool.query(
    "UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ?, ville = ?, pays = ?, adresse_postale = ? WHERE utilisateur_id = ?",
    [nom, prenom, telephone, ville || null, pays || null, adresse_postale || null, req.session.user.id]
  );

  req.session.user.nom = nom;
  req.session.user.prenom = prenom;
  req.session.flash = { type: "succes", message: "Informations mises à jour." };
  res.redirect("/mon-compte/informations");
}

module.exports = { afficherMonCompte, afficherInformations, modifierInformations };
