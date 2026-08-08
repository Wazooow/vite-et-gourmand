const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

router.get("/", menuController.listerMenusPage);
router.get("/:id", menuController.afficherMenu);

module.exports = router;
