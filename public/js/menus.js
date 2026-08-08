function carteMenu(m) {
  const image = m.image ? `<img src="${m.image}" alt="${m.titre}">` : "";
  const stock = m.quantite_restante > 0 ? `${m.quantite_restante} disponibles` : "Épuisé";
  return `
    <article class="carte-menu">
      ${image}
      <h3>${m.titre}</h3>
      <p class="tags"><span>${m.theme}</span> · <span>${m.regime}</span></p>
      <p>${m.description}</p>
      <p>À partir de <strong>${m.nombre_personne_minimum} personnes</strong> — <strong>${Number(m.prix_par_personne).toFixed(2)} €/pers.</strong></p>
      <p class="stock">${stock}</p>
      <a href="/menus/${m.menu_id}" class="bouton">Voir le menu</a>
    </article>
  `;
}

async function actualiserMenus() {
  const form = document.getElementById("filtres-menus");
  const params = new URLSearchParams(new FormData(form));
  // on retire les champs vides pour garder une URL propre
  for (const [cle, valeur] of [...params.entries()]) {
    if (!valeur) params.delete(cle);
  }

  const reponse = await fetch(`/api/menus?${params.toString()}`);
  const menus = await reponse.json();

  const conteneur = document.getElementById("liste-menus");
  conteneur.innerHTML = menus.length
    ? menus.map(carteMenu).join("")
    : '<p class="aucun-resultat">Aucun menu ne correspond à ces critères.</p>';

  // on met à jour l'URL affichée sans recharger la page
  const nouvelleUrl = params.toString() ? `/menus?${params.toString()}` : "/menus";
  window.history.replaceState(null, "", nouvelleUrl);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("filtres-menus");
  if (!form) return;
  form.addEventListener("input", actualiserMenus);
  form.addEventListener("change", actualiserMenus);
});
