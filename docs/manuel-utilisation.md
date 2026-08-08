# Manuel d'utilisation — Vite & Gourmand

Application web permettant à l'entreprise « Vite & Gourmand » de présenter ses menus événementiels et de recevoir des commandes en ligne.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@vite-et-gourmand.fr | Admin1234! |
| Employé | employe@vite-et-gourmand.fr | Employe1234! |
| Client (utilisateur) | client@test.fr | Client1234! |

Ces comptes sont créés automatiquement par le script [`database/seed.sql`](../database/seed.sql).

---

## Parcours visiteur (non connecté)

1. **Page d'accueil** (`/`) : présentation de l'entreprise, de l'équipe, et avis clients validés.
2. **Nos menus** (`/menus`) : liste de tous les menus actifs, avec filtres (prix min/max, thème, régime, nombre de personnes) mis à jour instantanément sans rechargement de page.
3. **Détail d'un menu** (`/menus/:id`) : composition (entrée/plat/dessert), allergènes, conditions, prix, disponibilité. Un visiteur non connecté qui clique sur « Commander » est invité à se connecter ou créer un compte.
4. **Contact** (`/contact`) : formulaire libre envoyé par email à l'entreprise.
5. **Créer un compte** (`/auth/inscription`) : nom, prénom, email, téléphone, adresse, mot de passe (10 caractères min., majuscule, minuscule, chiffre, caractère spécial), et acceptation de la politique de confidentialité. Un email de bienvenue est envoyé.

## Parcours client (`client@test.fr`)

1. Se connecter via `/auth/connexion`.
2. Sur la fiche d'un menu, cliquer sur **Commander ce menu**.
3. Renseigner l'adresse de livraison, la date/heure souhaitées et le nombre de personnes. Le récapitulatif de prix (menu, réduction éventuelle, livraison) se met à jour en direct.
   - Une réduction de 10% s'applique automatiquement à partir de 5 personnes de plus que le minimum du menu.
   - La livraison est gratuite à Bordeaux, sinon facturée 5€ + 0,59€/km.
4. Valider : un email de confirmation est envoyé, et la commande apparaît dans **Mon compte**.
5. Depuis **Mon compte** → une commande : suivi horodaté des statuts, possibilité de **modifier** ou **annuler** tant que la commande n'a pas été acceptée par l'équipe.
6. Une fois la commande au statut « terminée », un formulaire permet de laisser une **note (1 à 5) et un commentaire** ; l'avis est visible sur l'accueil après validation par un employé.
7. **Mon compte → Mes informations** : modifier ses coordonnées, ou **supprimer son compte** (anonymisation conforme RGPD).

## Parcours employé (`employe@vite-et-gourmand.fr`)

Accessible depuis **Espace employé** dans le menu (visible une fois connecté).

- **Menus** : créer/modifier/désactiver un menu, associer des plats, gérer la galerie de photos.
- **Plats** : créer/modifier/supprimer un plat et ses allergènes.
- **Horaires** : modifier les horaires d'ouverture (affichés en pied de page du site).
- **Commandes** : filtrer par statut ou par client, faire avancer une commande dans son cycle de vie (acceptée → en préparation → en cours de livraison → livrée → [en attente de retour de matériel] → terminée), ou l'annuler (nécessite d'indiquer le mode de contact et le motif — le client doit avoir été prévenu au préalable).
- **Avis** : valider ou refuser les avis laissés par les clients.

## Parcours administrateur (`admin@vite-et-gourmand.fr`)

En plus de tout ce que peut faire un employé (l'admin a accès à l'espace employé) :

- **Comptes employés** : créer un compte (email + mot de passe choisi par l'admin — non transmis par email, à communiquer directement à l'employé), désactiver/réactiver un compte.
- **Statistiques** : nombre de commandes et chiffre d'affaires par menu, avec filtres par menu et par période, données issues de la base MongoDB.

---

## Notes

- En environnement de démonstration, les emails ne sont pas réellement envoyés : ils passent par un compte de test Ethereal, et un lien de prévisualisation est affiché dans les journaux du serveur.
- La politique de mot de passe (10 caractères, majuscule, minuscule, chiffre, caractère spécial) s'applique à l'inscription, à la création de compte employé et à la réinitialisation de mot de passe.
