const express = require("express");
const router = express.Router();
const commandeController = require("../controllers/commandeController");
const { requireRole } = require("../middlewares/auth");

router.use(requireRole("utilisateur"));

router.get("/nouvelle", commandeController.nouvelleCommandeForm);
router.post("/", commandeController.creerCommande);
router.get("/:id", commandeController.afficherCommande);
router.get("/:id/modifier", commandeController.modifierCommandeForm);
router.post("/:id/modifier", commandeController.modifierCommande);
router.post("/:id/annuler", commandeController.annulerCommande);
router.post("/:id/avis", commandeController.laisserAvis);

module.exports = router;
