# Charte graphique — Vite & Gourmand

## Palette de couleurs

| Usage | Couleur | Code hex |
|---|---|---|
| Couleur principale (nav, boutons, liens) | Violet | `#6b3fa0` |
| Fond clair (sections, encarts) | Lavande très clair | `#f7f5fa` |
| Texte principal | Gris très foncé | `#222222` |
| Texte secondaire / indications | Gris moyen | `#666666` |
| Bordures / séparateurs | Gris clair | `#eeeeee` |
| Pied de page | Anthracite | `#222222` |
| Succès (messages de confirmation) | Vert | fond `#e3f7e8`, texte `#1e6b34` |
| Erreur (messages de validation) | Rouge | fond `#fbe4e4`, texte `#a12f2f` |
| Badge thème/régime | Violet clair | fond `#f0e9f7`, texte `#6b3fa0` |

Le violet a été choisi comme couleur de marque : il se démarque des codes couleurs habituels de la restauration (rouge/orange/vert), reste sobre et se prête bien à un usage sur fond blanc comme sur fond sombre (pied de page).

## Typographie

Empilement de polices système (`system-ui, sans-serif`) plutôt qu'une police web chargée depuis un CDN externe : rendu natif et rapide sur chaque plateforme (Segoe UI sous Windows, San Francisco sous macOS/iOS, Roboto sous Android), sans dépendance réseau ni temps de chargement supplémentaire — cohérent avec le choix général du projet de limiter les dépendances externes.

- Titres : graisse `bold`, tailles 24–40px selon le niveau
- Corps de texte : graisse normale, 13–16px
- Texte d'indication (`hint`) : 0.85rem, gris `#666`

## Wireframes (structure, avant mise en couleur)

Basse fidélité, pour valider l'agencement des blocs avant l'habillage visuel :

- [`wireframe-accueil.svg`](charte-graphique/wireframe-accueil.svg)
- [`wireframe-menus.svg`](charte-graphique/wireframe-menus.svg)
- [`wireframe-commande.svg`](charte-graphique/wireframe-commande.svg)

## Maquettes

Haute fidélité, reprenant la palette et la typographie définitives. Trois écrans clés, chacun décliné en version bureau et mobile :

**Bureau (1280px)**
- [`maquette-accueil-desktop.svg`](charte-graphique/maquette-accueil-desktop.svg)
- [`maquette-menus-desktop.svg`](charte-graphique/maquette-menus-desktop.svg)
- [`maquette-commande-desktop.svg`](charte-graphique/maquette-commande-desktop.svg)

**Mobile (375px)**
- [`maquette-accueil-mobile.svg`](charte-graphique/maquette-accueil-mobile.svg)
- [`maquette-menus-mobile.svg`](charte-graphique/maquette-menus-mobile.svg)
- [`maquette-commande-mobile.svg`](charte-graphique/maquette-commande-mobile.svg)

> Note honnête : ces maquettes ont été redessinées à partir de l'interface réellement implémentée (captures d'écran non disponibles dans cet environnement de travail), pas l'inverse. Le menu mobile y est représenté avec une icône « hamburger » comme cible d'évolution ; l'implémentation actuelle utilise un menu qui passe à la ligne (`flex-wrap`) plutôt qu'un vrai menu repliable — amélioration listée dans les pistes futures.

## Composants réutilisables

- **Bouton principal** : fond `#6b3fa0`, texte blanc, coins arrondis 4px
- **Bouton danger** (annulation, suppression) : fond `#a12f2f`, texte blanc
- **Carte** (menu, avis) : fond blanc, bordure `#eeeeee`, coins arrondis 6–8px
- **Badge** (thème, régime) : fond `#f0e9f7`, texte `#6b3fa0`, forme pilule
- **Message de statut** : bandeau coloré (vert succès / rouge erreur) en haut de formulaire
