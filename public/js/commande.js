const FRAIS_LIVRAISON_BASE = 5;
const FRAIS_LIVRAISON_PAR_KM = 0.59;
const PERSONNES_SUPPLEMENTAIRES_POUR_REDUCTION = 5;
const TAUX_REDUCTION = 0.1;

function calculerPrix({ prixParPersonne, nombrePersonneMinimum, nombrePersonne, villeLivraison, distanceKm }) {
  let prixMenu = nombrePersonne * prixParPersonne;
  const reductionApplicable = nombrePersonne >= nombrePersonneMinimum + PERSONNES_SUPPLEMENTAIRES_POUR_REDUCTION;
  if (reductionApplicable) {
    prixMenu = prixMenu * (1 - TAUX_REDUCTION);
  }

  const livraisonGratuite = (villeLivraison || "").trim().toLowerCase() === "bordeaux";
  const prixLivraison = livraisonGratuite ? 0 : FRAIS_LIVRAISON_BASE + FRAIS_LIVRAISON_PAR_KM * distanceKm;

  return { prixMenu, prixLivraison, reductionApplicable };
}

function formaterEuros(montant) {
  return `${montant.toFixed(2)} €`;
}

function actualiserRecap() {
  const nombrePersonne = Number(document.getElementById("nombre_personne").value) || 0;
  const villeLivraison = document.getElementById("ville_livraison").value;
  const distanceKm = Number(document.getElementById("distance_km").value) || 0;

  const { prixMenu, prixLivraison, reductionApplicable } = calculerPrix({
    prixParPersonne: window.DONNEES_MENU.prixParPersonne,
    nombrePersonneMinimum: window.DONNEES_MENU.nombrePersonneMinimum,
    nombrePersonne,
    villeLivraison,
    distanceKm,
  });

  document.getElementById("recap-prix-menu").textContent = formaterEuros(prixMenu);
  document.getElementById("recap-prix-livraison").textContent = formaterEuros(prixLivraison);
  document.getElementById("recap-total").textContent = formaterEuros(prixMenu + prixLivraison);
  document.getElementById("recap-reduction").textContent = reductionApplicable
    ? "Réduction de 10% appliquée (5 personnes de plus que le minimum requis)."
    : "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-commande");
  if (!form) return;
  form.addEventListener("input", actualiserRecap);
  actualiserRecap();
});
