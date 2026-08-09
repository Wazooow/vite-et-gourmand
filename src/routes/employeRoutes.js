const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { requireRole } = require("../middlewares/auth");

const menuController = require("../controllers/employe/menuController");
const platController = require("../controllers/employe/platController");
const horaireController = require("../controllers/employe/horaireController");
const commandeController = require("../controllers/employe/commandeController");
const avisController = require("../controllers/employe/avisController");

// Accessible aux employés ET aux administrateurs (l'admin peut tout faire
// que l'employé peut faire, en plus de son propre espace).
router.use(requireRole("employe", "administrateur"));

router.get("/", (req, res) => res.render("employe/tableau-de-bord"));

router.get("/menus", menuController.listerMenus);
router.get("/menus/nouveau", menuController.formulaireNouveauMenu);
router.post("/menus", menuController.creerMenu);
router.get("/menus/:id/modifier", menuController.formulaireModifierMenu);
router.post("/menus/:id/modifier", menuController.modifierMenu);
router.post("/menus/:id/supprimer", menuController.supprimerMenu);
router.post("/menus/:id/images", upload.array("images", 5), menuController.ajouterImages);
router.post("/menus/:id/images/:imageId/supprimer", menuController.supprimerImage);

router.get("/plats", platController.listerPlats);
router.get("/plats/nouveau", platController.formulaireNouveauPlat);
router.post("/plats", platController.creerPlat);
router.get("/plats/:id/modifier", platController.formulaireModifierPlat);
router.post("/plats/:id/modifier", platController.modifierPlat);
router.post("/plats/:id/supprimer", platController.supprimerPlat);

router.get("/horaires", horaireController.afficherHoraires);
router.post("/horaires", horaireController.modifierHoraires);

router.get("/commandes", commandeController.listerCommandes);
router.get("/commandes/:id", commandeController.afficherCommande);
router.get("/commandes/:id/modifier", commandeController.modifierCommandeForm);
router.post("/commandes/:id/modifier", commandeController.modifierCommande);
router.post("/commandes/:id/statut", commandeController.changerStatut);
router.post("/commandes/:id/annuler", commandeController.annulerCommande);

router.get("/avis", avisController.listerAvis);
router.post("/avis/:id/valider", avisController.validerAvis);
router.post("/avis/:id/refuser", avisController.refuserAvis);

module.exports = router;
