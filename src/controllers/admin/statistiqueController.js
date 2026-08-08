const pool = require("../../config/mysql");
const CommandeEvent = require("../../models/CommandeEvent");

async function afficherStatistiques(req, res) {
  const [menus] = await pool.query("SELECT menu_id, titre FROM menu ORDER BY titre");

  const filtreDate = {};
  if (req.query.debut) filtreDate.$gte = new Date(req.query.debut);
  if (req.query.fin) filtreDate.$lte = new Date(req.query.fin);

  const match = {};
  if (Object.keys(filtreDate).length > 0) match.dateCommande = filtreDate;
  if (req.query.menu) match.menuId = Number(req.query.menu);

  // Agrégation MongoDB : nombre de commandes et chiffre d'affaires par menu.
  // C'est la base non relationnelle qui sert de source pour ces statistiques,
  // comme demandé dans le sujet (espace administrateur).
  const resultats = await CommandeEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$menuId",
        menuTitre: { $first: "$menuTitre" },
        nombreCommandes: { $sum: 1 },
        chiffreAffaires: { $sum: { $add: ["$montantMenu", "$montantLivraison"] } },
      },
    },
    { $sort: { nombreCommandes: -1 } },
  ]);

  const maxCommandes = Math.max(1, ...resultats.map((r) => r.nombreCommandes));
  const caTotal = resultats.reduce((total, r) => total + r.chiffreAffaires, 0);

  res.render("admin/statistiques", { resultats, maxCommandes, caTotal, menus, filtres: req.query });
}

module.exports = { afficherStatistiques };
