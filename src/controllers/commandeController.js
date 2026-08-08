const pool = require("../config/mysql");
const CommandeEvent = require("../models/CommandeEvent");
const { sendMail } = require("../utils/mailer");

const FRAIS_LIVRAISON_BASE = 5;
const FRAIS_LIVRAISON_PAR_KM = 0.59;
const PERSONNES_SUPPLEMENTAIRES_POUR_REDUCTION = 5;
const TAUX_REDUCTION = 0.1;

function calculerPrix({ prixParPersonne, nombrePersonneMinimum, nombrePersonne, villeLivraison, distanceKm }) {
  let prixMenu = nombrePersonne * prixParPersonne;
  const reductionApplicable = nombrePersonne >= nombrePersonneMinimum + PERSONNES_SUPPLEMENTAIRES_POUR_REDUCTION;
  if (reductionApplicable) {
    prixMenu = prixMenu * (1 - TAUX_REDUCTION);
  }

  const livraisonGratuite = (villeLivraison || "").trim().toLowerCase() === "bordeaux";
  const prixLivraison = livraisonGratuite ? 0 : FRAIS_LIVRAISON_BASE + FRAIS_LIVRAISON_PAR_KM * distanceKm;

  return {
    prixMenu: Math.round(prixMenu * 100) / 100,
    prixLivraison: Math.round(prixLivraison * 100) / 100,
    reductionApplicable,
  };
}

async function getMenuOuErreur(menuId, res) {
  const [rows] = await pool.query("SELECT * FROM menu WHERE menu_id = ? AND actif = TRUE", [menuId]);
  const menu = rows[0];
  if (!menu) {
    res.status(404).render("erreur", { title: "Menu introuvable", message: "Ce menu n'existe pas ou n'est plus disponible." });
    return null;
  }
  return menu;
}

async function nouvelleCommandeForm(req, res) {
  const menuId = Number(req.query.menu);
  if (!menuId) {
    req.session.flash = { type: "erreur", message: "Choisis d'abord un menu avant de passer commande." };
    return res.redirect("/menus");
  }

  const menu = await getMenuOuErreur(menuId, res);
  if (!menu) return;

  if (menu.quantite_restante <= 0) {
    req.session.flash = { type: "erreur", message: "Ce menu n'est plus disponible actuellement." };
    return res.redirect(`/menus/${menuId}`);
  }

  const [rows] = await pool.query(
    "SELECT adresse_postale, ville, pays FROM utilisateur WHERE utilisateur_id = ?",
    [req.session.user.id]
  );
  const profil = rows[0];

  res.render("commandes/nouvelle", { menu, profil, erreurs: [], valeurs: {} });
}

async function creerCommande(req, res) {
  const menuId = Number(req.body.menu_id);
  const menu = await getMenuOuErreur(menuId, res);
  if (!menu) return;

  const nombrePersonne = Number(req.body.nombre_personne);
  const distanceKm = Number(req.body.distance_km) || 0;
  const { adresse_livraison, ville_livraison, code_postal_livraison, date_prestation, heure_livraison } = req.body;

  const erreurs = [];
  if (!adresse_livraison || !ville_livraison || !code_postal_livraison) {
    erreurs.push("L'adresse de livraison complète est obligatoire.");
  }
  if (!date_prestation || new Date(date_prestation) <= new Date()) {
    erreurs.push("La date de la prestation doit être dans le futur.");
  }
  if (!heure_livraison) {
    erreurs.push("L'heure de livraison est obligatoire.");
  }
  if (!nombrePersonne || nombrePersonne < menu.nombre_personne_minimum) {
    erreurs.push(`Ce menu nécessite au moins ${menu.nombre_personne_minimum} personnes.`);
  }
  if (menu.quantite_restante <= 0) {
    erreurs.push("Ce menu n'est plus disponible.");
  }

  if (erreurs.length > 0) {
    const [rows] = await pool.query(
      "SELECT adresse_postale, ville, pays FROM utilisateur WHERE utilisateur_id = ?",
      [req.session.user.id]
    );
    return res.render("commandes/nouvelle", { menu, profil: rows[0], erreurs, valeurs: req.body });
  }

  const { prixMenu, prixLivraison, reductionApplicable } = calculerPrix({
    prixParPersonne: menu.prix_par_personne,
    nombrePersonneMinimum: menu.nombre_personne_minimum,
    nombrePersonne,
    villeLivraison: ville_livraison,
    distanceKm,
  });

  const connexion = await pool.getConnection();
  let commandeId;
  try {
    await connexion.beginTransaction();

    const [resultatStock] = await connexion.query(
      "UPDATE menu SET quantite_restante = quantite_restante - 1 WHERE menu_id = ? AND quantite_restante > 0",
      [menuId]
    );
    if (resultatStock.affectedRows === 0) {
      await connexion.rollback();
      req.session.flash = { type: "erreur", message: "Ce menu vient d'être épuisé, désolé." };
      return res.redirect(`/menus/${menuId}`);
    }

    const [resultatCommande] = await connexion.query(
      `INSERT INTO commande (
        numero_commande, utilisateur_id, menu_id, date_prestation, heure_livraison,
        adresse_livraison, ville_livraison, code_postal_livraison, distance_km,
        nombre_personne, prix_menu, prix_livraison, reduction_appliquee, statut
      ) VALUES ('EN_COURS', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')`,
      [
        req.session.user.id, menuId, date_prestation, heure_livraison,
        adresse_livraison, ville_livraison, code_postal_livraison, distanceKm,
        nombrePersonne, prixMenu, prixLivraison, reductionApplicable,
      ]
    );
    commandeId = resultatCommande.insertId;

    const numeroCommande = `CMD-${new Date().getFullYear()}-${String(commandeId).padStart(6, "0")}`;
    await connexion.query("UPDATE commande SET numero_commande = ? WHERE commande_id = ?", [numeroCommande, commandeId]);

    await connexion.query(
      "INSERT INTO commande_statut_historique (commande_id, statut) VALUES (?, 'en_attente')",
      [commandeId]
    );

    await connexion.commit();
  } catch (err) {
    await connexion.rollback();
    throw err;
  } finally {
    connexion.release();
  }

  const [commandeRows] = await pool.query("SELECT numero_commande FROM commande WHERE commande_id = ?", [commandeId]);
  const numeroCommande = commandeRows[0].numero_commande;

  await CommandeEvent.create({
    commandeId,
    numeroCommande,
    menuId,
    menuTitre: menu.titre,
    montantMenu: prixMenu,
    montantLivraison: prixLivraison,
    nombrePersonnes: nombrePersonne,
    dateCommande: new Date(),
    datePrestation: new Date(date_prestation),
    statut: "en_attente",
  });

  await sendMail({
    to: req.session.user.email,
    subject: `Confirmation de ta commande ${numeroCommande}`,
    html: `<p>Bonjour ${req.session.user.prenom},</p>
           <p>Ta commande <strong>${numeroCommande}</strong> pour le menu « ${menu.titre} » a bien été enregistrée.</p>
           <p>Total : ${(prixMenu + prixLivraison).toFixed(2)} € (menu : ${prixMenu.toFixed(2)} €, livraison : ${prixLivraison.toFixed(2)} €)</p>
           <p>Tu peux suivre son état depuis ton espace client.</p>`,
  });

  req.session.flash = { type: "succes", message: `Commande ${numeroCommande} enregistrée avec succès.` };
  res.redirect(`/commandes/${commandeId}`);
}

async function getCommandeDuProprietaire(req, res) {
  const commandeId = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT c.*, m.titre AS menu_titre, m.prix_par_personne
     FROM commande c JOIN menu m ON m.menu_id = c.menu_id
     WHERE c.commande_id = ?`,
    [commandeId]
  );
  const commande = rows[0];

  if (!commande || commande.utilisateur_id !== req.session.user.id) {
    res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
    return null;
  }
  return commande;
}

async function afficherCommande(req, res) {
  const commande = await getCommandeDuProprietaire(req, res);
  if (!commande) return;

  const [historique] = await pool.query(
    "SELECT statut, date_changement FROM commande_statut_historique WHERE commande_id = ? ORDER BY date_changement",
    [commande.commande_id]
  );
  const [avisRows] = await pool.query("SELECT avis_id FROM avis WHERE commande_id = ?", [commande.commande_id]);

  res.render("commandes/detail", { commande, historique, dejaNote: avisRows.length > 0 });
}

async function modifierCommandeForm(req, res) {
  const commande = await getCommandeDuProprietaire(req, res);
  if (!commande) return;

  if (commande.statut !== "en_attente") {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être modifiée." };
    return res.redirect(`/commandes/${commande.commande_id}`);
  }

  res.render("commandes/modifier", { commande, erreurs: [] });
}

async function modifierCommande(req, res) {
  const commande = await getCommandeDuProprietaire(req, res);
  if (!commande) return;

  if (commande.statut !== "en_attente") {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être modifiée." };
    return res.redirect(`/commandes/${commande.commande_id}`);
  }

  const nombrePersonne = Number(req.body.nombre_personne);
  const distanceKm = Number(req.body.distance_km) || 0;
  const { adresse_livraison, ville_livraison, code_postal_livraison, date_prestation, heure_livraison } = req.body;

  const erreurs = [];
  if (!adresse_livraison || !ville_livraison || !code_postal_livraison) erreurs.push("L'adresse de livraison complète est obligatoire.");
  if (!date_prestation || new Date(date_prestation) <= new Date()) erreurs.push("La date de la prestation doit être dans le futur.");

  const [menuRows] = await pool.query("SELECT * FROM menu WHERE menu_id = ?", [commande.menu_id]);
  const menu = menuRows[0];
  if (!nombrePersonne || nombrePersonne < menu.nombre_personne_minimum) {
    erreurs.push(`Ce menu nécessite au moins ${menu.nombre_personne_minimum} personnes.`);
  }

  if (erreurs.length > 0) {
    return res.render("commandes/modifier", { commande: { ...commande, ...req.body }, erreurs });
  }

  const { prixMenu, prixLivraison, reductionApplicable } = calculerPrix({
    prixParPersonne: menu.prix_par_personne,
    nombrePersonneMinimum: menu.nombre_personne_minimum,
    nombrePersonne,
    villeLivraison: ville_livraison,
    distanceKm,
  });

  await pool.query(
    `UPDATE commande SET
       adresse_livraison = ?, ville_livraison = ?, code_postal_livraison = ?, distance_km = ?,
       date_prestation = ?, heure_livraison = ?, nombre_personne = ?,
       prix_menu = ?, prix_livraison = ?, reduction_appliquee = ?
     WHERE commande_id = ?`,
    [
      adresse_livraison, ville_livraison, code_postal_livraison, distanceKm,
      date_prestation, heure_livraison, nombrePersonne,
      prixMenu, prixLivraison, reductionApplicable,
      commande.commande_id,
    ]
  );

  req.session.flash = { type: "succes", message: "Commande mise à jour." };
  res.redirect(`/commandes/${commande.commande_id}`);
}

async function annulerCommande(req, res) {
  const commande = await getCommandeDuProprietaire(req, res);
  if (!commande) return;

  if (commande.statut !== "en_attente") {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être annulée." };
    return res.redirect(`/commandes/${commande.commande_id}`);
  }

  const connexion = await pool.getConnection();
  try {
    await connexion.beginTransaction();
    await connexion.query("UPDATE commande SET statut = 'annulee' WHERE commande_id = ?", [commande.commande_id]);
    await connexion.query("UPDATE menu SET quantite_restante = quantite_restante + 1 WHERE menu_id = ?", [commande.menu_id]);
    await connexion.query("INSERT INTO commande_statut_historique (commande_id, statut) VALUES (?, 'annulee')", [commande.commande_id]);
    await connexion.commit();
  } catch (err) {
    await connexion.rollback();
    throw err;
  } finally {
    connexion.release();
  }

  req.session.flash = { type: "succes", message: "Commande annulée." };
  res.redirect(`/commandes/${commande.commande_id}`);
}

async function laisserAvis(req, res) {
  const commande = await getCommandeDuProprietaire(req, res);
  if (!commande) return;

  if (commande.statut !== "terminee") {
    req.session.flash = { type: "erreur", message: "Tu ne peux laisser un avis que pour une commande terminée." };
    return res.redirect(`/commandes/${commande.commande_id}`);
  }

  const note = Number(req.body.note);
  const { description } = req.body;

  if (!note || note < 1 || note > 5) {
    req.session.flash = { type: "erreur", message: "La note doit être comprise entre 1 et 5." };
    return res.redirect(`/commandes/${commande.commande_id}`);
  }

  try {
    await pool.query(
      "INSERT INTO avis (utilisateur_id, commande_id, note, description, statut) VALUES (?, ?, ?, ?, 'en_attente')",
      [req.session.user.id, commande.commande_id, note, description || null]
    );
    req.session.flash = { type: "succes", message: "Merci pour ton avis, il sera visible après validation." };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      req.session.flash = { type: "erreur", message: "Tu as déjà laissé un avis pour cette commande." };
    } else {
      throw err;
    }
  }

  res.redirect(`/commandes/${commande.commande_id}`);
}

module.exports = {
  calculerPrix,
  nouvelleCommandeForm,
  creerCommande,
  afficherCommande,
  modifierCommandeForm,
  modifierCommande,
  annulerCommande,
  laisserAvis,
};
