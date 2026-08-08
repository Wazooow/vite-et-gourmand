const pool = require("../../config/mysql");

async function afficherHoraires(req, res) {
  const [horaires] = await pool.query(
    `SELECT * FROM horaire
     ORDER BY FIELD(jour, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')`
  );
  res.render("employe/horaires", { horaires });
}

async function modifierHoraires(req, res) {
  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  for (const jour of jours) {
    const ouverture = req.body[`ouverture_${jour}`];
    const fermeture = req.body[`fermeture_${jour}`];
    const ferme = req.body[`ferme_${jour}`] === "on";

    await pool.query("UPDATE horaire SET heure_ouverture = ?, heure_fermeture = ? WHERE jour = ?", [
      ferme ? null : ouverture || null,
      ferme ? null : fermeture || null,
      jour,
    ]);
  }

  req.session.flash = { type: "succes", message: "Horaires mis à jour." };
  res.redirect("/employe/horaires");
}

module.exports = { afficherHoraires, modifierHoraires };
