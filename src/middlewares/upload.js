const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads", "menus"),
  filename: (req, file, cb) => {
    const suffixe = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${suffixe}${path.extname(file.originalname)}`);
  },
});

const EXTENSIONS_AUTORISEES = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

function filtreFichier(req, file, cb) {
  if (EXTENSIONS_AUTORISEES.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Format d'image non autorisé (jpg, png, webp, svg uniquement)."));
  }
}

const upload = multer({
  storage,
  fileFilter: filtreFichier,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
