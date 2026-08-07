/* =============================================================================
 * sw.js — Service worker du CRM Palladium
 * -----------------------------------------------------------------------------
 * Rôle : rendre l'application installable et consultable hors connexion.
 *
 * STRATÉGIE : réseau d'abord, cache en secours.
 * L'inverse (cache d'abord) serait plus rapide, mais servirait une version
 * périmée après chaque mise à jour — et il faudrait expliquer à chaque
 * utilisateur comment vider son cache. Ici, une version fraîche est servie dès
 * que le réseau répond ; le cache ne prend le relais qu'en cas de coupure.
 * Sur des connexions ouest-africaines irrégulières, c'est le bon compromis.
 *
 * CE QUI N'EST PAS MIS EN CACHE : les appels à Firestore et à Firebase Auth.
 * Firestore gère lui-même sa persistance hors ligne (persistentLocalCache dans
 * pa-firebase.js) et sait rejouer les écritures à la reconnexion. Un cache HTTP
 * par-dessus produirait des données incohérentes.
 * ========================================================================== */

const VERSION = 'palladium-v6';
const SHELL = [
  './',
  './index.html',
  './pa-firebase.js',
  './brief.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      /* Un fichier manquant ne doit pas empêcher l'installation : l'application
       * fonctionnera simplement sans cache pour celui-là. */
      .catch(err => console.warn('[SW] pré-chargement partiel', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Firebase, Google APIs : jamais interceptés. */
  if (/googleapis\.com|gstatic\.com|firebaseio\.com|firebaseapp\.com/.test(url.hostname)) return;

  /* Origines tierces : laissées au navigateur. */
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

/* Permet à la page de forcer l'activation d'une nouvelle version. */
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
