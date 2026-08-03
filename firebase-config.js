/* =============================================================================
 * firebase-config.js — Projet « new-business-palladium-africa »
 * -----------------------------------------------------------------------------
 * Valeurs recopiées depuis la console Firebase (Paramètres du projet → Vos
 * applications → Configuration). Elles ne sont pas des secrets : elles
 * identifient le projet et n'accordent aucun droit. La protection des données
 * vient des Security Rules (firestore.rules et storage.rules).
 *
 * Le dépôt étant public, pensez à restreindre cette clé par référent HTTP :
 * Google Cloud → APIs & Services → Identifiants → votre clé → Restrictions
 * relatives aux applications → Sites Web → polecommercial203-alt.github.io/*
 * Sans cela, la clé reste sans droits sur vos données, mais un tiers peut
 * consommer votre quota depuis son propre site.
 * ========================================================================== */

export const firebaseConfig = {
  apiKey:            'AIzaSyAi8-AyLUyPbLw2xzXSqe0CNcea0aQA3mE',
  authDomain:        'new-business-palladium-africa.firebaseapp.com',
  projectId:         'new-business-palladium-africa',
  storageBucket:     'new-business-palladium-africa.firebasestorage.app',
  messagingSenderId: '675090862084',
  appId:             '1:675090862084:web:094a8422668c6665e6a551',
};

/* Identifiant de l'organisation : toutes les données vivent sous
 * /orgs/palladium. À segmenter le jour où plusieurs entités coexistent. */
export const ORG_ID = 'palladium';
