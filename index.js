require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");

const connectMongo = require("./src/config/mongo");

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
  next();
});

app.get("/", (req, res) => {
  res.render("home");
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
