# CRM Palladium Africa

Application de pilotage commercial — Media Contact, Palladium Tech, Movendi,
Academy, R-Estate.

Application web à page unique, sans build : le HTML est autonome, les données
vivent dans Firebase (Firestore + Authentication + Storage).

---

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | L'application entière — interface, logique, styles, polices |
| `pa-firebase.js` | Liaison Firebase : connexion, synchronisation, fichiers |
| `firebase-config.js` | Identifiants du projet Firebase |
| `firestore.rules` | Droits d'accès aux données — l'autorité réelle |
| `storage.rules` | Droits sur les pièces jointes |
| `firebase.json` | Configuration de déploiement |

---

## Développement local

Un double-clic sur `index.html` ne fonctionne pas : les navigateurs refusent les
modules JavaScript servis en `file://`. Il faut un serveur.

```bash
python3 -m http.server 8080
# puis http://localhost:8080
```

Ou, si Node est installé :

```bash
npx serve
```

---

## Mise en ligne

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

L'application est publiée sur `https://new-business-palladium-africa.web.app`.

Pour publier aussi les règles de sécurité après modification :

```bash
firebase deploy --only firestore:rules,storage
```

**Après le premier déploiement**, ajoutez le domaine dans la console Firebase :
Authentication → Paramètres → Domaines autorisés. Sans cela, la connexion est
refusée depuis l'adresse publique alors qu'elle fonctionne en local.

---

## Comptes

Il n'y a pas d'auto-inscription. Un compte n'existe que si deux choses coexistent :

1. un utilisateur dans Firebase Authentication ;
2. un document `orgs/palladium/users/{uid}` portant son rôle.

Le second est écrit automatiquement quand un administrateur crée un compte depuis
l'écran Administration. Le tout premier compte, lui, a été créé à la main dans la
console — il ne pouvait pas en être autrement.

À la première connexion, l'utilisateur doit remplacer le mot de passe provisoire
par le sien. L'administrateur ne connaît donc jamais le mot de passe définitif de
ses collaborateurs : c'est ce qui rend l'historique des validations opposable.

Rôles : `admin`, `dg`, `dc`, `cdc`, `rep`, `com`, `apporteur`.

---

## Modèle de données

L'état de l'application est découpé en sept documents sous
`orgs/palladium/state/` : `config`, `equipe`, `affaires`, `activite`, `marches`,
`documents`, `analytique`.

Ce découpage a deux raisons : un document Firestore est plafonné à 1 Mo, et une
écriture ne touche que la tranche modifiée — deux personnes travaillant sur des
modules différents ne s'écrasent pas.

**Limite connue** : à l'intérieur d'une même tranche, la dernière écriture gagne.
Deux commerciaux modifiant deux affaires différentes dans la même seconde, la
seconde sauvegarde emporte la première. Acceptable pour la phase actuelle ; la
parade est un document Firestore par affaire, à engager avant une montée en
charge sérieuse.

---

## Sécurité

Le cloisonnement présent dans `index.html` (`scopeIdentity`, `scopeDeals`) est
une défense en profondeur **côté client** : il empêche un accès par une route ou
un filtre, pas l'ouverture de la console du navigateur.

L'autorité réelle est dans `firestore.rules`, évalué sur les serveurs de Google.
Toute modification des droits se fait là, pas dans le HTML.

À faire avant un usage élargi :

- restreindre la clé API par référent HTTP (Google Cloud → Identifiants) ;
- activer App Check, pour que seules vos pages puissent appeler la base ;
- passer à un document par affaire, pour une confidentialité vérifiée à la ligne.

La clé API présente dans `firebase-config.js` n'est pas un secret : elle
identifie le projet et n'accorde aucun droit. Ce qui protège les données, ce sont
les règles.

---

## Interface mobile

L'application est utilisable sur téléphone : tableaux transformés en fiches
empilées sous 640 px, navigation en tiroir, modales en feuille inférieure,
champs à 16 px pour éviter le zoom automatique d'iOS.
