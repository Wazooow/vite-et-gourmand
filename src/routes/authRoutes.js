const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/inscription", authController.afficherInscription);
router.post("/inscription", authController.inscrire);

router.get("/connexion", authController.afficherConnexion);
router.post("/connexion", authController.connecter);

router.get("/deconnexion", authController.deconnecter);

router.get("/mot-de-passe-oublie", authController.afficherMotDePasseOublie);
router.post("/mot-de-passe-oublie", authController.envoyerLienReinitialisation);

router.get("/reinitialiser-mot-de-passe/:token", authController.afficherReinitialisation);
router.post("/reinitialiser-mot-de-passe/:token", authController.reinitialiserMotDePasse);

module.exports = router;
