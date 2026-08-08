const pool = require("../config/mysql");
const { sendMail } = require("../utils/mailer");

async function accueil(req, res) {
  const [avis] = await pool.query(
    `SELECT a.note, a.description, u.prenom
     FROM avis a JOIN utilisateur u ON u.utilisateur_id = a.utilisateur_id
     WHERE a.statut = 'valide'
     ORDER BY a.created_at DESC
     LIMIT 6`
  );
  res.render("home", { avis });
}

function afficherContact(req, res) {
  res.render("contact", { erreurs: [], envoye: false, valeurs: {} });
}

async function envoyerContact(req, res) {
  const { titre, description, mail } = req.body;
  const erreurs = [];

  if (!titre) erreurs.push("Le titre est obligatoire.");
  if (!description) erreurs.push("La description est obligatoire.");
  if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) erreurs.push("L'email n'est pas valide.");

  if (erreurs.length > 0) {
    return res.render("contact", { erreurs, envoye: false, valeurs: req.body });
  }

  await sendMail({
    to: process.env.CONTACT_EMAIL || process.env.MAIL_FROM,
    subject: `[Contact] ${titre}`,
    html: `<p>Message envoyé par : ${mail}</p><p>${description}</p>`,
  });

  res.render("contact", { erreurs: [], envoye: true, valeurs: {} });
}

function mentionsLegales(req, res) {
  res.render("mentions-legales");
}

function cgv(req, res) {
  res.render("cgv");
}

function politiqueConfidentialite(req, res) {
  res.render("politique-confidentialite");
}

module.exports = { accueil, afficherContact, envoyerContact, mentionsLegales, cgv, politiqueConfidentialite };
