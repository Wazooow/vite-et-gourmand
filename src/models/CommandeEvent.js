const mongoose = require("mongoose");

// Journal des commandes, alimenté par l'application MySQL à chaque création
// de commande. Sert uniquement au reporting (espace administrateur) :
// nombre de commandes par menu, chiffre d'affaires par menu/période.
const commandeEventSchema = new mongoose.Schema({
  commandeId: { type: Number, required: true },
  numeroCommande: { type: String, required: true },
  menuId: { type: Number, required: true },
  menuTitre: { type: String, required: true },
  montantMenu: { type: Number, required: true },
  montantLivraison: { type: Number, required: true, default: 0 },
  nombrePersonnes: { type: Number, required: true },
  dateCommande: { type: Date, required: true },
  datePrestation: { type: Date, required: true },
  statut: { type: String, required: true },
});

module.exports = mongoose.model("CommandeEvent", commandeEventSchema);
