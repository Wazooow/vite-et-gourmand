const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");

router.get("/", pageController.accueil);
router.get("/contact", pageController.afficherContact);
router.post("/contact", pageController.envoyerContact);
router.get("/mentions-legales", pageController.mentionsLegales);
router.get("/cgv", pageController.cgv);

module.exports = router;
