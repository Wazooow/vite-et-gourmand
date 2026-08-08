require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const connectMongo = require("./src/config/mongo");
const authRoutes = require("./src/routes/authRoutes");
const pageRoutes = require("./src/routes/pageRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const apiRoutes = require("./src/routes/apiRoutes");
const commandeRoutes = require("./src/routes/commandeRoutes");
const compteRoutes = require("./src/routes/compteRoutes");
const employeRoutes = require("./src/routes/employeRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const pool = require("./src/config/mysql");

const app = express();
const enProduction = process.env.NODE_ENV === "production";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

if (enProduction) {
  // Nécessaire derrière le reverse proxy HTTPS de la plateforme d'hébergement,
  // pour que req.protocol et les cookies "secure" fonctionnent correctement.
  app.set("trust proxy", 1);
}

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // MongoDB comme store de sessions : évite le MemoryStore par défaut
    // (non prévu pour la production, non partagé entre instances) en
    // réutilisant la base non relationnelle déjà provisionnée pour le projet.
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      secure: enProduction,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use(async (req, res, next) => {
  try {
    const [horaires] = await pool.query(
      "SELECT jour, heure_ouverture, heure_fermeture FROM horaire ORDER BY FIELD(jour, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')"
    );
    res.locals.horaires = horaires;
  } catch (err) {
    res.locals.horaires = [];
  }
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/", pageRoutes);
app.use("/auth", authRoutes);
app.use("/menus", menuRoutes);
app.use("/api", apiRoutes);
app.use("/commandes", commandeRoutes);
app.use("/mon-compte", compteRoutes);
app.use("/employe", employeRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("erreur", {
    title: "Erreur",
    message: "Une erreur est survenue. Réessaie dans un instant.",
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectMongo();
  } catch (err) {
    console.error("Erreur de connexion à MongoDB :", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

start();
