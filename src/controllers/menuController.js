const pool = require("../config/mysql");

async function getThemesEtRegimes() {
  const [themes] = await pool.query("SELECT theme_id, libelle FROM theme ORDER BY libelle");
  const [regimes] = await pool.query("SELECT regime_id, libelle FROM regime ORDER BY libelle");
  return { themes, regimes };
}

function construireFiltres(query) {
  const conditions = ["m.actif = TRUE"];
  const params = [];

  if (query.prixMin) {
    conditions.push("m.prix_par_personne >= ?");
    params.push(Number(query.prixMin));
  }
  if (query.prixMax) {
    conditions.push("m.prix_par_personne <= ?");
    params.push(Number(query.prixMax));
  }
  if (query.theme) {
    conditions.push("m.theme_id = ?");
    params.push(Number(query.theme));
  }
  if (query.regime) {
    conditions.push("m.regime_id = ?");
    params.push(Number(query.regime));
  }
  if (query.personnes) {
    conditions.push("m.nombre_personne_minimum <= ?");
    params.push(Number(query.personnes));
  }

  return { where: conditions.join(" AND "), params };
}

async function rechercherMenus(query) {
  const { where, params } = construireFiltres(query);

  const [menus] = await pool.query(
    `SELECT m.menu_id, m.titre, m.description, m.nombre_personne_minimum, m.prix_par_personne,
            m.quantite_restante, t.libelle AS theme, r.libelle AS regime,
            (SELECT chemin FROM menu_image WHERE menu_id = m.menu_id ORDER BY ordre LIMIT 1) AS image
     FROM menu m
     JOIN theme t ON t.theme_id = m.theme_id
     JOIN regime r ON r.regime_id = m.regime_id
     WHERE ${where}
     ORDER BY m.titre`,
    params
  );

  return menus;
}

async function listerMenusPage(req, res) {
  const [menus, { themes, regimes }] = await Promise.all([rechercherMenus(req.query), getThemesEtRegimes()]);
  res.render("menus/liste", { menus, themes, regimes, filtres: req.query });
}

async function listerMenusApi(req, res) {
  const menus = await rechercherMenus(req.query);
  res.json(menus);
}

async function afficherMenu(req, res) {
  const menuId = Number(req.params.id);

  const [menuRows] = await pool.query(
    `SELECT m.*, t.libelle AS theme, r.libelle AS regime
     FROM menu m
     JOIN theme t ON t.theme_id = m.theme_id
     JOIN regime r ON r.regime_id = m.regime_id
     WHERE m.menu_id = ? AND m.actif = TRUE`,
    [menuId]
  );
  const menu = menuRows[0];

  if (!menu) {
    return res.status(404).render("erreur", { title: "Menu introuvable", message: "Ce menu n'existe pas ou n'est plus disponible." });
  }

  const [images] = await pool.query("SELECT chemin FROM menu_image WHERE menu_id = ? ORDER BY ordre", [menuId]);

  const [plats] = await pool.query(
    `SELECT p.plat_id, p.titre_plat, p.type_plat,
            GROUP_CONCAT(a.libelle SEPARATOR ', ') AS allergenes
     FROM plat p
     JOIN menu_plat mp ON mp.plat_id = p.plat_id
     LEFT JOIN plat_allergene pa ON pa.plat_id = p.plat_id
     LEFT JOIN allergene a ON a.allergene_id = pa.allergene_id
     WHERE mp.menu_id = ?
     GROUP BY p.plat_id
     ORDER BY FIELD(p.type_plat, 'entree', 'plat', 'dessert')`,
    [menuId]
  );

  res.render("menus/detail", { menu, images, plats });
}

module.exports = { listerMenusPage, listerMenusApi, afficherMenu };
