const express = require("express");
const router = express.Router();
const compteController = require("../controllers/compteController");
const { requireRole } = require("../middlewares/auth");

router.use(requireRole("utilisateur"));

router.get("/", compteController.afficherMonCompte);
router.get("/informations", compteController.afficherInformations);
router.post("/informations", compteController.modifierInformations);

module.exports = router;
