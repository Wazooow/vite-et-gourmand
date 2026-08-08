const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/mysql");
const { sendMail } = require("../utils/mailer");

const DUREE_TOKEN_RESET_MS = 60 * 60 * 1000; // 1 heure

function afficherInscription(req, res) {
  res.render("auth/inscription", { erreurs: [], valeurs: {} });
}

async function inscrire(req, res) {
  const { nom, prenom, email, telephone, ville, pays, adresse_postale, password, password_confirmation } = req.body;
  const erreurs = [];

  if (!nom || !prenom) erreurs.push("Le nom et le prénom sont obligatoires.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("L'email n'est pas valide.");
  if (!telephone) erreurs.push("Le numéro de téléphone est obligatoire.");

  const politiqueMdp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
  if (!politiqueMdp.test(password || "")) {
    erreurs.push(
      "Le mot de passe doit faire au moins 10 caractères et contenir une majuscule, une minuscule, un chiffre et un caractère spécial."
    );
  }
  if (password !== password_confirmation) {
    erreurs.push("Les deux mots de passe ne correspondent pas.");
  }

  if (erreurs.length > 0) {
    return res.render("auth/inscription", { erreurs, valeurs: req.body });
  }

  const [existants] = await pool.query("SELECT utilisateur_id FROM utilisateur WHERE email = ?", [email]);
  if (existants.length > 0) {
    return res.render("auth/inscription", {
      erreurs: ["Un compte existe déjà avec cet email."],
      valeurs: req.body,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [roleRows] = await pool.query("SELECT role_id FROM role WHERE libelle = 'utilisateur'");
  const roleId = roleRows[0].role_id;

  await pool.query(
    `INSERT INTO utilisateur (email, password, nom, prenom, telephone, ville, pays, adresse_postale, role_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, passwordHash, nom, prenom, telephone, ville || null, pays || null, adresse_postale || null, roleId]
  );

  await sendMail({
    to: email,
    subject: "Bienvenue chez Vite & Gourmand",
    html: `<p>Bonjour ${prenom},</p><p>Ton compte Vite &amp; Gourmand a bien été créé. Tu peux dès maintenant te connecter et découvrir nos menus.</p>`,
  });

  req.session.flash = { type: "succes", message: "Compte créé avec succès, tu peux te connecter." };
  res.redirect("/auth/connexion");
}

function afficherConnexion(req, res) {
  res.render("auth/connexion", { erreur: null, valeurs: {} });
}

async function connecter(req, res) {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `SELECT u.utilisateur_id, u.email, u.password, u.nom, u.prenom, u.actif, r.libelle AS role
     FROM utilisateur u JOIN role r ON r.role_id = u.role_id
     WHERE u.email = ?`,
    [email]
  );

  const compte = rows[0];
  const motDePasseValide = compte ? await bcrypt.compare(password, compte.password) : false;

  if (!compte || !motDePasseValide) {
    return res.render("auth/connexion", { erreur: "Email ou mot de passe incorrect.", valeurs: { email } });
  }
  if (!compte.actif) {
    return res.render("auth/connexion", {
      erreur: "Ce compte a été désactivé. Contacte l'entreprise pour plus d'informations.",
      valeurs: { email },
    });
  }

  req.session.user = {
    id: compte.utilisateur_id,
    email: compte.email,
    nom: compte.nom,
    prenom: compte.prenom,
    role: compte.role,
  };

  if (compte.role === "administrateur") return res.redirect("/admin");
  if (compte.role === "employe") return res.redirect("/employe");
  res.redirect("/mon-compte");
}

function deconnecter(req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

function afficherMotDePasseOublie(req, res) {
  res.render("auth/mot-de-passe-oublie", { message: null });
}

async function envoyerLienReinitialisation(req, res) {
  const { email } = req.body;
  const [rows] = await pool.query("SELECT utilisateur_id, prenom FROM utilisateur WHERE email = ?", [email]);
  const compte = rows[0];

  // On affiche toujours le même message, que l'email existe ou non,
  // pour ne pas révéler quels emails ont un compte.
  if (compte) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + DUREE_TOKEN_RESET_MS);
    await pool.query("UPDATE utilisateur SET reset_token = ?, reset_token_expiration = ? WHERE utilisateur_id = ?", [
      token,
      expiration,
      compte.utilisateur_id,
    ]);

    const lien = `${req.protocol}://${req.get("host")}/auth/reinitialiser-mot-de-passe/${token}`;
    await sendMail({
      to: email,
      subject: "Réinitialisation de ton mot de passe",
      html: `<p>Bonjour ${compte.prenom},</p><p>Clique sur ce lien pour choisir un nouveau mot de passe (valable 1h) :</p><p><a href="${lien}">${lien}</a></p>`,
    });
  }

  res.render("auth/mot-de-passe-oublie", {
    message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
  });
}

async function afficherReinitialisation(req, res) {
  const { token } = req.params;
  const [rows] = await pool.query(
    "SELECT utilisateur_id FROM utilisateur WHERE reset_token = ? AND reset_token_expiration > NOW()",
    [token]
  );

  if (rows.length === 0) {
    return res.render("erreur", {
      title: "Lien invalide",
      message: "Ce lien de réinitialisation est invalide ou a expiré. Refais une demande.",
    });
  }

  res.render("auth/reinitialiser-mot-de-passe", { token, erreurs: [] });
}

async function reinitialiserMotDePasse(req, res) {
  const { token } = req.params;
  const { password, password_confirmation } = req.body;

  const [rows] = await pool.query(
    "SELECT utilisateur_id FROM utilisateur WHERE reset_token = ? AND reset_token_expiration > NOW()",
    [token]
  );
  const compte = rows[0];

  if (!compte) {
    return res.render("erreur", {
      title: "Lien invalide",
      message: "Ce lien de réinitialisation est invalide ou a expiré. Refais une demande.",
    });
  }

  const erreurs = [];
  const politiqueMdp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
  if (!politiqueMdp.test(password || "")) {
    erreurs.push(
      "Le mot de passe doit faire au moins 10 caractères et contenir une majuscule, une minuscule, un chiffre et un caractère spécial."
    );
  }
  if (password !== password_confirmation) {
    erreurs.push("Les deux mots de passe ne correspondent pas.");
  }

  if (erreurs.length > 0) {
    return res.render("auth/reinitialiser-mot-de-passe", { token, erreurs });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    "UPDATE utilisateur SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE utilisateur_id = ?",
    [passwordHash, compte.utilisateur_id]
  );

  req.session.flash = { type: "succes", message: "Mot de passe mis à jour, tu peux te connecter." };
  res.redirect("/auth/connexion");
}

module.exports = {
  afficherInscription,
  inscrire,
  afficherConnexion,
  connecter,
  deconnecter,
  afficherMotDePasseOublie,
  envoyerLienReinitialisation,
  afficherReinitialisation,
  reinitialiserMotDePasse,
};
