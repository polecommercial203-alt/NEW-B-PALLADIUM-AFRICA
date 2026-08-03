/* =============================================================================
 * firebase-config.js — Projet « new-business-palladium-africa »
 * -----------------------------------------------------------------------------
 * ⚠️  VÉRIFIEZ apiKey ET appId AVANT DE LANCER.
 *     Ces deux valeurs ont été relevées sur une capture d'écran : un caractère
 *     mal lu et la connexion échoue avec un message trompeur
 *     (« auth/api-key-not-valid »). Recopiez-les depuis la console Firebase,
 *     via le bouton « copier » à droite du bloc de code.
 *
 *     Les autres champs (domaines, identifiants de projet) sont sans ambiguïté.
 *
 * Ces valeurs ne sont pas des secrets : elles identifient le projet, elles
 * n'accordent aucun droit. La protection vient des Security Rules.
 * ========================================================================== */

export const firebaseConfig = {
  apiKey:            'AIzaSyAiB-AyLUyPbLw2xzXSqe0CNcoaBaQA3mE',   // ← à vérifier
  authDomain:        'new-business-palladium-africa.firebaseapp.com',
  projectId:         'new-business-palladium-africa',
  storageBucket:     'new-business-palladium-africa.firebasestorage.app',
  messagingSenderId: '675099862084',
  appId:             '1:675099862084:web:094a8422668c6665e6a561',  // ← à vérifier
};

/* Identifiant de l'organisation : toutes les données vivent sous
 * /orgs/palladium. À segmenter le jour où plusieurs entités coexistent. */
export const ORG_ID = 'palladium';
