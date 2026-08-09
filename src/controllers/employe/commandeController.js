const pool = require("../../config/mysql");
const { sendMail } = require("../../utils/mailer");
const { calculerPrix } = require("../commandeController");

// Transition normale (avancement du traitement, aucun contact client requis)
const TRANSITIONS = {
  en_attente: ["accepte"],
  accepte: ["en_preparation"],
  en_preparation: ["en_cours_de_livraison"],
  en_cours_de_livraison: ["livre"],
  en_attente_retour_materiel: ["terminee"],
};

function prochainsStatutsPossibles(commande) {
  if (commande.statut === "livre") {
    return commande.pret_materiel ? ["en_attente_retour_materiel"] : ["terminee"];
  }
  return TRANSITIONS[commande.statut] || [];
}

function ajouterJoursOuvres(date, nombreJours) {
  const resultat = new Date(date);
  let joursAjoutes = 0;
  while (joursAjoutes < nombreJours) {
    resultat.setDate(resultat.getDate() + 1);
    const jourSemaine = resultat.getDay(); // 0 = dimanche, 6 = samedi
    if (jourSemaine !== 0 && jourSemaine !== 6) joursAjoutes++;
  }
  return resultat;
}

async function listerCommandes(req, res) {
  const conditions = [];
  const params = [];

  if (req.query.statut) {
    conditions.push("c.statut = ?");
    params.push(req.query.statut);
  }
  if (req.query.client) {
    conditions.push("(u.email LIKE ? OR u.nom LIKE ? OR u.prenom LIKE ?)");
    const recherche = `%${req.query.client}%`;
    params.push(recherche, recherche, recherche);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [commandes] = await pool.query(
    `SELECT c.commande_id, c.numero_commande, c.statut, c.date_prestation, c.nombre_personne,
            m.titre AS menu_titre, u.nom, u.prenom, u.email
     FROM commande c
     JOIN menu m ON m.menu_id = c.menu_id
     JOIN utilisateur u ON u.utilisateur_id = c.utilisateur_id
     ${where}
     ORDER BY c.date_commande DESC`,
    params
  );

  res.render("employe/commandes/liste", { commandes, filtres: req.query });
}

async function getCommandeComplete(commandeId) {
  const [rows] = await pool.query(
    `SELECT c.*, m.titre AS menu_titre, m.nombre_personne_minimum, m.prix_par_personne,
            u.nom, u.prenom, u.email, u.telephone
     FROM commande c
     JOIN menu m ON m.menu_id = c.menu_id
     JOIN utilisateur u ON u.utilisateur_id = c.utilisateur_id
     WHERE c.commande_id = ?`,
    [commandeId]
  );
  return rows[0];
}

async function afficherCommande(req, res) {
  const commandeId = Number(req.params.id);
  const commande = await getCommandeComplete(commandeId);
  if (!commande) {
    return res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
  }

  const [historique] = await pool.query(
    "SELECT statut, date_changement FROM commande_statut_historique WHERE commande_id = ? ORDER BY date_changement",
    [commandeId]
  );

  res.render("employe/commandes/detail", {
    commande,
    historique,
    prochainsStatuts: prochainsStatutsPossibles(commande),
  });
}

async function changerStatut(req, res) {
  const commandeId = Number(req.params.id);
  const commande = await getCommandeComplete(commandeId);
  if (!commande) {
    return res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
  }

  const nouveauStatut = req.body.nouveau_statut;
  if (!prochainsStatutsPossibles(commande).includes(nouveauStatut)) {
    req.session.flash = { type: "erreur", message: "Ce changement de statut n'est pas autorisé depuis l'état actuel." };
    return res.redirect(`/employe/commandes/${commandeId}`);
  }

  const champsSupplementaires = {};
  if (nouveauStatut === "en_attente_retour_materiel") {
    champsSupplementaires.date_limite_restitution = ajouterJoursOuvres(new Date(), 10);
  }
  if (nouveauStatut === "terminee" && commande.statut === "en_attente_retour_materiel") {
    champsSupplementaires.restitution_materiel = true;
  }

  const champsSql = Object.keys(champsSupplementaires);
  const setClause = ["statut = ?", ...champsSql.map((c) => `${c} = ?`)].join(", ");
  await pool.query(`UPDATE commande SET ${setClause} WHERE commande_id = ?`, [
    nouveauStatut,
    ...champsSql.map((c) => champsSupplementaires[c]),
    commandeId,
  ]);

  await pool.query("INSERT INTO commande_statut_historique (commande_id, statut) VALUES (?, ?)", [commandeId, nouveauStatut]);

  if (nouveauStatut === "en_attente_retour_materiel") {
    await sendMail({
      to: commande.email,
      subject: `Retour du matériel — commande ${commande.numero_commande}`,
      html: `<p>Bonjour ${commande.prenom},</p>
             <p>Ta commande a bien été livrée. Le matériel prêté doit être restitué sous 10 jours ouvrés.</p>
             <p>Passé ce délai, des frais de 600€ seront facturés conformément à nos conditions générales de vente.</p>`,
    });
  }

  if (nouveauStatut === "terminee") {
    await sendMail({
      to: commande.email,
      subject: `Ta commande ${commande.numero_commande} est terminée`,
      html: `<p>Bonjour ${commande.prenom},</p>
             <p>Ta commande est maintenant terminée. Tu peux te connecter à ton compte pour laisser un avis sur ta prestation.</p>`,
    });
  }

  req.session.flash = { type: "succes", message: `Commande passée au statut "${nouveauStatut}".` };
  res.redirect(`/employe/commandes/${commandeId}`);
}

async function annulerCommande(req, res) {
  const commandeId = Number(req.params.id);
  const commande = await getCommandeComplete(commandeId);
  if (!commande) {
    return res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
  }

  if (["terminee", "annulee"].includes(commande.statut)) {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être annulée." };
    return res.redirect(`/employe/commandes/${commandeId}`);
  }

  const { mode_contact, motif } = req.body;
  if (!mode_contact || !motif) {
    req.session.flash = { type: "erreur", message: "Le mode de contact et le motif sont obligatoires pour annuler une commande." };
    return res.redirect(`/employe/commandes/${commandeId}`);
  }

  const motifComplet = `Annulée par l'employé — contact : ${mode_contact}. Motif : ${motif}`;

  const connexion = await pool.getConnection();
  try {
    await connexion.beginTransaction();
    await connexion.query("UPDATE commande SET statut = 'annulee', motif_derniere_modif = ? WHERE commande_id = ?", [motifComplet, commandeId]);
    await connexion.query("UPDATE menu SET quantite_restante = quantite_restante + 1 WHERE menu_id = ?", [commande.menu_id]);
    await connexion.query("INSERT INTO commande_statut_historique (commande_id, statut) VALUES (?, 'annulee')", [commandeId]);
    await connexion.commit();
  } catch (err) {
    await connexion.rollback();
    throw err;
  } finally {
    connexion.release();
  }

  await sendMail({
    to: commande.email,
    subject: `Annulation de ta commande ${commande.numero_commande}`,
    html: `<p>Bonjour ${commande.prenom},</p><p>Ta commande a été annulée suite à notre échange par ${mode_contact}.</p><p>Motif : ${motif}</p>`,
  });

  req.session.flash = { type: "succes", message: "Commande annulée." };
  res.redirect(`/employe/commandes/${commandeId}`);
}

async function modifierCommandeForm(req, res) {
  const commandeId = Number(req.params.id);
  const commande = await getCommandeComplete(commandeId);
  if (!commande) {
    return res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
  }

  if (["terminee", "annulee"].includes(commande.statut)) {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être modifiée." };
    return res.redirect(`/employe/commandes/${commandeId}`);
  }

  res.render("employe/commandes/modifier", { commande, erreurs: [] });
}

async function modifierCommande(req, res) {
  const commandeId = Number(req.params.id);
  const commande = await getCommandeComplete(commandeId);
  if (!commande) {
    return res.status(404).render("erreur", { title: "Commande introuvable", message: "Cette commande n'existe pas." });
  }

  if (["terminee", "annulee"].includes(commande.statut)) {
    req.session.flash = { type: "erreur", message: "Cette commande ne peut plus être modifiée." };
    return res.redirect(`/employe/commandes/${commandeId}`);
  }

  const { mode_contact, motif, adresse_livraison, ville_livraison, code_postal_livraison, date_prestation, heure_livraison } = req.body;
  const nombrePersonne = Number(req.body.nombre_personne);
  const distanceKm = Number(req.body.distance_km) || 0;

  const erreurs = [];
  if (!mode_contact || !motif) {
    erreurs.push("Le mode de contact et le motif sont obligatoires pour modifier une commande (le client doit avoir été contacté au préalable).");
  }
  if (!adresse_livraison || !ville_livraison || !code_postal_livraison) erreurs.push("L'adresse de livraison complète est obligatoire.");
  if (!date_prestation) erreurs.push("La date de la prestation est obligatoire.");
  if (!nombrePersonne || nombrePersonne < commande.nombre_personne_minimum) {
    erreurs.push(`Ce menu nécessite au moins ${commande.nombre_personne_minimum} personnes.`);
  }

  if (erreurs.length > 0) {
    return res.render("employe/commandes/modifier", { commande: { ...commande, ...req.body }, erreurs });
  }

  const { prixMenu, prixLivraison, reductionApplicable } = calculerPrix({
    prixParPersonne: commande.prix_par_personne,
    nombrePersonneMinimum: commande.nombre_personne_minimum,
    nombrePersonne,
    villeLivraison: ville_livraison,
    distanceKm,
  });

  const motifComplet = `Modifiée par l'employé — contact : ${mode_contact}. Motif : ${motif}`;

  await pool.query(
    `UPDATE commande SET
       adresse_livraison = ?, ville_livraison = ?, code_postal_livraison = ?, distance_km = ?,
       date_prestation = ?, heure_livraison = ?, nombre_personne = ?,
       prix_menu = ?, prix_livraison = ?, reduction_appliquee = ?, motif_derniere_modif = ?
     WHERE commande_id = ?`,
    [
      adresse_livraison, ville_livraison, code_postal_livraison, distanceKm,
      date_prestation, heure_livraison, nombrePersonne,
      prixMenu, prixLivraison, reductionApplicable, motifComplet,
      commandeId,
    ]
  );

  await sendMail({
    to: commande.email,
    subject: `Mise à jour de ta commande ${commande.numero_commande}`,
    html: `<p>Bonjour ${commande.prenom},</p><p>Ta commande a été modifiée suite à notre échange par ${mode_contact}.</p><p>Motif : ${motif}</p>`,
  });

  req.session.flash = { type: "succes", message: "Commande modifiée." };
  res.redirect(`/employe/commandes/${commandeId}`);
}

module.exports = { listerCommandes, afficherCommande, changerStatut, annulerCommande, modifierCommandeForm, modifierCommande };
