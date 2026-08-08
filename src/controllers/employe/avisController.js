const pool = require("../../config/mysql");

async function listerAvis(req, res) {
  const [avis] = await pool.query(
    `SELECT a.avis_id, a.note, a.description, a.statut, a.created_at, u.nom, u.prenom, c.numero_commande
     FROM avis a
     JOIN utilisateur u ON u.utilisateur_id = a.utilisateur_id
     JOIN commande c ON c.commande_id = a.commande_id
     ORDER BY (a.statut = 'en_attente') DESC, a.created_at DESC`
  );
  res.render("employe/avis", { avis });
}

async function validerAvis(req, res) {
  await pool.query("UPDATE avis SET statut = 'valide' WHERE avis_id = ?", [req.params.id]);
  req.session.flash = { type: "succes", message: "Avis validé, visible sur la page d'accueil." };
  res.redirect("/employe/avis");
}

async function refuserAvis(req, res) {
  await pool.query("UPDATE avis SET statut = 'refuse' WHERE avis_id = ?", [req.params.id]);
  req.session.flash = { type: "succes", message: "Avis refusé." };
  res.redirect("/employe/avis");
}

module.exports = { listerAvis, validerAvis, refuserAvis };
