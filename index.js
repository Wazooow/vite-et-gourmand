require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");

const connectMongo = require("./src/config/mongo");
const authRoutes = require("./src/routes/authRoutes");
const pageRoutes = require("./src/routes/pageRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const apiRoutes = require("./src/routes/apiRoutes");
const commandeRoutes = require("./src/routes/commandeRoutes");
const compteRoutes = require("./src/routes/compteRoutes");
const employeRoutes = require("./src/routes/employeRoutes");
const { requireRole } = require("./src/middlewares/auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use("/", pageRoutes);
app.use("/auth", authRoutes);
app.use("/menus", menuRoutes);
app.use("/api", apiRoutes);
app.use("/commandes", commandeRoutes);
app.use("/mon-compte", compteRoutes);
app.use("/employe", employeRoutes);

// Espace admin — à venir (tâche #10)
app.get("/admin", requireRole("administrateur"), (req, res) => {
  res.render("erreur", { title: "Espace administrateur", message: "Espace administrateur à venir." });
});

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
