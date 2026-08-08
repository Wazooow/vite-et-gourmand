const express = require("express");
const router = express.Router();
const { requireRole } = require("../middlewares/auth");
const employeController = require("../controllers/admin/employeController");
const statistiqueController = require("../controllers/admin/statistiqueController");

router.use(requireRole("administrateur"));

router.get("/", (req, res) => res.render("admin/tableau-de-bord"));

router.get("/employes", employeController.listerEmployes);
router.get("/employes/nouveau", employeController.formulaireNouvelEmploye);
router.post("/employes", employeController.creerEmploye);
router.post("/employes/:id/desactiver", employeController.desactiverEmploye);
router.post("/employes/:id/activer", employeController.activerEmploye);

router.get("/statistiques", statistiqueController.afficherStatistiques);

module.exports = router;
