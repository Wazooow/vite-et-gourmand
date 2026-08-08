# Documentation de gestion de projet — Vite & Gourmand

> ⚠️ À compléter : le lien vers le board Trello doit être ajouté ici une fois créé (`[Board Trello](https://trello.com/...)`, à créer sur [trello.com](https://trello.com)). Les colonnes suggérées : *À faire*, *En cours*, *À tester*, *Terminé*, calquées sur le workflow Git ci-dessous.

## Méthodologie

Le projet a été découpé en **lots fonctionnels indépendants**, chacun développé sur sa propre branche Git, testé, puis intégré à `develop` avant de passer au lot suivant. Ce découpage sert aussi de base au suivi de tâches (Trello) : chaque lot correspond à une carte/colonne.

## Découpage du projet (chronologie réelle, d'après l'historique Git)

| # | Lot | Contenu | Branche |
|---|---|---|---|
| 1 | Cadrage | Analyse du sujet, confirmation du MCD, choix de stack, mise en place de l'environnement (Node, MySQL, MongoDB), init du dépôt | *(commit direct)* |
| 2 | Modélisation | Script SQL (`schema.sql`), données de démonstration (`seed.sql`), modèle Mongo | *(commit direct)* |
| 3 | Authentification | Inscription, connexion, rôles, réinitialisation de mot de passe | `feature/authentification` |
| 4 | Pages publiques | Accueil, liste des menus avec filtres dynamiques, détail menu, contact | `feature/pages-publiques` |
| 5 | Tunnel de commande | Formulaire de commande, calcul de prix en direct, espace utilisateur (suivi, modification, annulation, avis) | `feature/commandes` |
| 6 | Espace employé | CRUD menus/plats/horaires, traitement des commandes, modération des avis | `feature/espace-employe` |
| 7 | Espace administrateur | Comptes employés, statistiques (MongoDB) | `feature/espace-admin` |
| 8 | Conformité | RGPD (consentement, politique de confidentialité, droit à l'effacement) et RGAA (lien d'évitement, focus visible) | `feature/rgpd-rgaa` |
| 9 | Déploiement | Préparation production (sessions persistantes, cookies sécurisés) et documentation Railway | `feature/deploiement` |
| 10 | Documentation | Documentation technique, manuel d'utilisation, charte graphique, gestion de projet | `feature/documentation` |

Chaque lot a suivi le même cycle : développement → tests fonctionnels manuels (formulaires, calculs de prix, transitions de statut, emails) → merge dans `develop` avec `--no-ff` (pour garder une trace explicite du merge dans l'historique) → suppression de la branche.

## Arbitrages et décisions notables

- **MCD fourni incomplet pour certains besoins du cahier des charges** (pas de champ `nom` sur `utilisateur`, pas d'adresse de livraison sur `commande`, pas de galerie d'image, pas d'historique de statut) → complété et justifié dans la [documentation technique](documentation-technique.md#31-modèle-conceptuel-de-données-relationnel--mysql).
- **Workflow des commandes employé** : le sujet indique qu'un employé ne peut « modifier/annuler » une commande sans avoir contacté le client. Interprétation retenue : l'avancement normal du statut (accepté → préparation → livraison → livré → terminé) ne nécessite pas de contact client (traitement interne), seule une **annulation** l'exige — avec saisie obligatoire du mode de contact et du motif.
- **Pénalité de 600€ pour matériel non restitué** : la date limite (10 jours ouvrés) est calculée et un email d'alerte est envoyé automatiquement, mais la facturation effective de la pénalité reste un acte de gestion manuel (hors périmètre applicatif, pas de moyen de paiement intégré au projet).
- **Bug d'encodage découvert en cours de développement** : les caractères accentués étaient corrompus en base à l'import des fichiers `.sql` sous Windows (client `mysql` interprétant mal l'UTF-8 sans le flag `--default-character-set=utf8mb4`). Diagnostiqué en comparant les octets stockés (`HEX()`) entre MySQL et l'application, puis corrigé.

## Livrables et lien avec ce découpage

- Dépôt GitHub public : https://github.com/Wazooow/vite-et-gourmand
- README avec démarche de démarrage local et de déploiement
- Scripts SQL de création et de peuplement de la base
- Documentation technique, manuel d'utilisation, charte graphique (ce dossier `docs/`)
