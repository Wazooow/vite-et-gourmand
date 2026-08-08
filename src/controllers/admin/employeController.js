const bcrypt = require("bcryptjs");
const pool = require("../../config/mysql");
const { sendMail } = require("../../utils/mailer");

async function listerEmployes(req, res) {
  const [employes] = await pool.query(
    `SELECT u.utilisateur_id, u.nom, u.prenom, u.email, u.actif
     FROM utilisateur u JOIN role r ON r.role_id = u.role_id
     WHERE r.libelle = 'employe'
     ORDER BY u.nom`
  );
  res.render("admin/employes/liste", { employes });
}

function formulaireNouvelEmploye(req, res) {
  res.render("admin/employes/formulaire", { erreurs: [], valeurs: {} });
}

async function creerEmploye(req, res) {
  const { nom, prenom, email, telephone, password } = req.body;
  const erreurs = [];

  if (!nom || !prenom) erreurs.push("Le nom et le prénom sont obligatoires.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("L'email n'est pas valide.");

  const politiqueMdp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
  if (!politiqueMdp.test(password || "")) {
    erreurs.push("Le mot de passe doit faire au moins 10 caractères et contenir une majuscule, une minuscule, un chiffre et un caractère spécial.");
  }

  if (erreurs.length > 0) {
    return res.render("admin/employes/formulaire", { erreurs, valeurs: req.body });
  }

  const [existants] = await pool.query("SELECT utilisateur_id FROM utilisateur WHERE email = ?", [email]);
  if (existants.length > 0) {
    return res.render("admin/employes/formulaire", { erreurs: ["Un compte existe déjà avec cet email."], valeurs: req.body });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [roleRows] = await pool.query("SELECT role_id FROM role WHERE libelle = 'employe'");

  await pool.query(
    "INSERT INTO utilisateur (email, password, nom, prenom, telephone, role_id) VALUES (?, ?, ?, ?, ?, ?)",
    [email, passwordHash, nom, prenom, telephone || null, roleRows[0].role_id]
  );

  // Le mot de passe n'est jamais transmis par email : l'employé doit le
  // récupérer directement auprès de l'administrateur (exigence du sujet).
  await sendMail({
    to: email,
    subject: "Un compte Vite & Gourmand a été créé pour toi",
    html: `<p>Bonjour ${prenom},</p><p>Un compte employé vient d'être créé pour toi sur l'espace Vite &amp; Gourmand.</p><p>Rapproche-toi de l'administrateur pour obtenir ton mot de passe.</p>`,
  });

  req.session.flash = { type: "succes", message: "Compte employé créé." };
  res.redirect("/admin/employes");
}

async function desactiverEmploye(req, res) {
  await pool.query("UPDATE utilisateur SET actif = FALSE WHERE utilisateur_id = ? AND role_id = (SELECT role_id FROM role WHERE libelle = 'employe')", [req.params.id]);
  req.session.flash = { type: "succes", message: "Compte désactivé." };
  res.redirect("/admin/employes");
}

async function activerEmploye(req, res) {
  await pool.query("UPDATE utilisateur SET actif = TRUE WHERE utilisateur_id = ? AND role_id = (SELECT role_id FROM role WHERE libelle = 'employe')", [req.params.id]);
  req.session.flash = { type: "succes", message: "Compte réactivé." };
  res.redirect("/admin/employes");
}

module.exports = { listerEmployes, formulaireNouvelEmploye, creerEmploye, desactiverEmploye, activerEmploye };
