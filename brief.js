/* =============================================================================
 * brief.js — Point de situation vocal à la connexion
 * -----------------------------------------------------------------------------
 * À la connexion, l'application salue la personne et lui dit ce qui l'attend :
 * rendez-vous du jour, comptes rendus en retard, relances, écart d'objectif.
 *
 * POURQUOI PAS D'INTELLIGENCE ARTIFICIELLE ICI
 * Le texte est construit à partir des données réelles du CRM, par des règles
 * explicites. Un modèle de langage produirait des tournures plus variées, mais
 * il peut aussi inventer un chiffre — et un point de situation faux est pire
 * qu'un point de situation plat. Ce que la voix annonce est toujours vérifiable
 * à l'écran, à la virgule près.
 *
 * LA VOIX EST CELLE DU NAVIGATEUR (API Web Speech). Aucun service externe,
 * aucun coût, aucune donnée qui sort du poste. La qualité dépend des voix
 * installées : correcte sous Windows et Android, très bonne sous macOS et iOS.
 *
 * CONTRAINTE DES NAVIGATEURS : ils refusent de parler sans un geste préalable
 * de l'utilisateur. La connexion en fournit un — le clic sur « Se connecter ».
 * En cas de refus malgré tout, le texte reste affiché : rien ne se perd.
 * ========================================================================== */

(function () {
  'use strict';

  const PREF = 'pa_brief_voix';          // 'off' pour couper la voix
  const VU = 'pa_brief_vu';              // date du dernier point de situation

  /* Deux niveaux : le réglage de l'organisation prime, le choix du poste
   * ne peut que couper davantage — jamais rallumer ce que l'admin a éteint. */
  const voixCoupee = () => window.__paBriefVoix === false
    || localStorage.getItem(PREF) === 'off';

  /* ── Formulation ─────────────────────────────────────────────────────────
   * Le ton suit l'heure : on ne dit pas « bonjour » à 19 h. Détail mineur, mais
   * une salutation à contretemps signale immédiatement l'automate. */
  function salutation() {
    const h = new Date().getHours();
    if (h < 5) return 'Bonsoir';
    if (h < 18) return 'Bonjour';
    return 'Bonsoir';
  }

  const pluriel = (n, sing, plur) => `${n} ${n > 1 ? (plur || sing + 's') : sing}`;

  /* ── Construction du point de situation ──────────────────────────────────
   * Chaque phrase n'est ajoutée que si elle porte une information. Une liste
   * de « rien à signaler » ferait perdre le peu d'attention disponible. */
  function composer(d) {
    const p = [];
    p.push(`${salutation()} ${d.prenom}.`);

    if (d.rdvJour > 0) {
      p.push(`Vous avez ${pluriel(d.rdvJour, 'rendez-vous', 'rendez-vous')} aujourd'hui.`);
    }

    if (d.crEnRetard > 0) {
      p.push(`${pluriel(d.crEnRetard, 'rendez-vous', 'rendez-vous')} ${d.crEnRetard > 1 ? 'attendent' : 'attend'} `
        + `un compte rendu. Sans lui, ${d.crEnRetard > 1 ? 'ils ne comptent pas' : 'il ne compte pas'} pour la prime.`);
    }

    if (d.aPlanifier > 0) {
      p.push(`${pluriel(d.aPlanifier, 'rendez-vous', 'rendez-vous')} ${d.aPlanifier > 1 ? 'restent' : 'reste'} à planifier.`);
    }

    if (d.bloquees > 0) {
      p.push(`${pluriel(d.bloquees, 'affaire')} ${d.bloquees > 1 ? 'sont bloquées' : 'est bloquée'}`
        + `${d.motifBloc ? `, principalement pour ${d.motifBloc.toLowerCase()}` : ''}.`);
    }

    if (d.cible > 0) {
      const pct = Math.round((d.realise / d.cible) * 100);
      p.push(`Votre objectif du mois est de ${d.cible} millions. Vous en êtes à ${pct} pour cent.`);
      if (d.ecart < 0) {
        p.push(`Il vous manque ${Math.abs(Math.round(d.ecart))} millions pour tenir le rythme.`);
      } else if (pct >= 100) {
        p.push('Objectif atteint. Beau travail.');
      }
    }

    if (p.length === 1) p.push('Rien d\u2019urgent ce matin. Bonne journée.');
    return p.join(' ');
  }

  /* ── Collecte des données ────────────────────────────────────────────────
   * On ne parle que de ce qui appartient à la personne connectée : les mêmes
   * filtres de portée que les écrans, pour éviter qu'une voix annonce à un
   * commercial des chiffres qu'il n'a pas le droit de voir. */
  async function reunir(api, moi) {
    const [rdvsData, opps] = await Promise.all([api.getRdvs(), api.listOpportunities()]);
    const today = new Date().toISOString().slice(0, 10);
    const miens = (rdvsData.rdvs || []).filter(r => !moi.name || r.owner === moi.name);
    const deals = (opps.deals || []).filter(d => !moi.id || d.com === moi.id);

    const bloquees = deals.filter(d => d.blocage);
    const motifs = {};
    bloquees.forEach(d => { motifs[d.blocage] = (motifs[d.blocage] || 0) + 1; });
    const motifBloc = Object.keys(motifs).sort((a, b) => motifs[b] - motifs[a])[0] || '';

    let cible = 0, realise = 0, ecart = 0;
    try {
      const [indiv, pil] = await Promise.all([api.getIndividualTargets(), api.getTeamPilotage()]);
      cible = ((indiv.rows || []).find(r => r.id === moi.id) || {}).cible || 0;
      realise = ((pil.rows || []).find(r => r.id === moi.id) || {}).mois || 0;
      const n = new Date();
      const av = n.getDate() / new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
      ecart = realise - cible * av;
    } catch (_) { /* profils sans objectif individuel : on n'en parle pas */ }

    return {
      prenom: (moi.name || '').split(' ')[0] || '',
      rdvJour: miens.filter(r => r.status === 'planifié' && r.date === today).length,
      crEnRetard: miens.filter(r => r.status === 'planifié' && r.date && r.date < today).length,
      aPlanifier: miens.filter(r => r.status === 'à planifier').length,
      bloquees: bloquees.length,
      motifBloc,
      cible, realise, ecart,
    };
  }

  /* ── Voix ────────────────────────────────────────────────────────────────
   * Les voix se chargent de façon asynchrone dans Chrome : au premier appel la
   * liste est souvent vide, d'où l'attente de l'événement voiceschanged. */
  function voixFr() {
    const v = speechSynthesis.getVoices();
    return v.find(x => /^fr/i.test(x.lang) && /google|natural|enhanced/i.test(x.name))
        || v.find(x => /^fr/i.test(x.lang))
        || null;
  }

  function parler(texte) {
    if (!('speechSynthesis' in window) || voixCoupee()) return;
    const dire = () => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = 'fr-FR';
      u.rate = 1.02;
      u.pitch = 1;
      const v = voixFr();
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    };
    if (speechSynthesis.getVoices().length) dire();
    else speechSynthesis.addEventListener('voiceschanged', dire, { once: true });
  }

  /* ── Affichage ───────────────────────────────────────────────────────────
   * Le texte est toujours écrit, la voix ne fait que le doubler. Un point de
   * situation qu'on ne peut que réécouter serait inutilisable en open space. */
  function afficher(texte) {
    document.getElementById('pa-brief')?.remove();
    const b = document.createElement('div');
    b.id = 'pa-brief';
    b.innerHTML = `
      <div class="pa-brief-txt">${texte}</div>
      <div class="pa-brief-act">
        <button id="pa-brief-say" title="Réécouter">🔊</button>
        <button id="pa-brief-mute" title="${voixCoupee() ? 'Activer la voix' : 'Couper la voix'}">${voixCoupee() ? '🔇' : '🔈'}</button>
        <button id="pa-brief-x" title="Fermer">✕</button>
      </div>`;
    document.body.appendChild(b);

    b.querySelector('#pa-brief-say').onclick = () => parler(texte);
    b.querySelector('#pa-brief-x').onclick = () => { speechSynthesis.cancel(); b.remove(); };
    b.querySelector('#pa-brief-mute').onclick = e => {
      const off = !voixCoupee();
      localStorage.setItem(PREF, off ? 'off' : 'on');
      if (off) speechSynthesis.cancel();
      e.target.textContent = off ? '🔇' : '🔈';
      e.target.title = off ? 'Activer la voix' : 'Couper la voix';
    };
    setTimeout(() => { if (document.getElementById('pa-brief')) b.classList.add('discret'); }, 22000);
  }

  /* ── Déclenchement ───────────────────────────────────────────────────────
   * Une fois par jour et par personne : répété à chaque navigation, le point de
   * situation deviendrait une nuisance et serait coupé par tout le monde. */
  window.paBrief = async function (api, moi, force) {
    try {
      /* Réglage de l'organisation d'abord : s'il est coupé, rien ne s'affiche,
       * quel que soit le choix local de la personne. */
      let reglage = { texte: true, voix: true };
      try { reglage = await api.getBriefSettings(); } catch (_) {}
      /* Les deux canaux sont indépendants : voix seule pour qui est en
       * déplacement, écrit seul pour qui travaille en open space. Tout couper
       * désactive simplement la fonction. */
      if (!reglage.texte && !reglage.voix) return;
      window.__paBriefVoix = reglage.voix !== false;

      const cle = VU + ':' + (moi.name || moi.email || '?');
      const jour = new Date().toISOString().slice(0, 10);
      if (!force && localStorage.getItem(cle) === jour) return;
      localStorage.setItem(cle, jour);

      const texte = composer(await reunir(api, moi));
      if (reglage.texte !== false) afficher(texte);
      parler(texte);
    } catch (err) {
      console.warn('[Brief] point de situation indisponible', err);
    }
  };
})();
