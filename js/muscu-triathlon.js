/* ════════════════════════════════════════════════════════════
   PLAN TRIATHLON SPRINT (objectif 'triathlon') — nov 2026 → juin 2027
   750 m nage · 20 km vélo · 5 km course
   Profil : cardio tennis, AUCUNE base de course, AUCUNE base vélo, dos chronique,
   tient 1 000 m en nage mais sans technique. Hiver : tapis, vélo de salle, piscine.
   - 2 piscines (lun, jeu) · 2 vélos (mer, dim) · 2 tapis (mar, sam) · 3 muscu · vendredi libre
   - Enchaînement vélo → course le dimanche à partir de la semaine 10 (15 min max, 20 après la sem 20).
   - Semaine allégée toutes les 4 sem (la muscu se décharge en même temps).
   - Tennis HORS PLAN : 1 fois par semaine, mercredi et samedi en alternance ; il REMPLACE
     une séance, le vendredi reste un repos.
   - Nage jamais le jour ni le lendemain d'une séance du haut du corps.
   Le plan fait 29 semaines ; il s'étire ou se compresse (23 min) selon la date.
   ════════════════════════════════════════════════════════════ */
const MuscuTriathlon = (() => {
  const DEFAULT_START = '2026-11-23';
  const DEFAULT_RACE  = '2027-06-15';
  const LOG_KEY = 'mf_triathlon_log';
  const DAY = 86400000;

  // ── Dates (calées à midi local : insensible au changement d'heure) ──
  function _parse(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d, 12); }
  function _iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function _add(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function _monday(d) { return _add(d, -((d.getDay() + 6) % 7)); }
  function _weeksBetween(a, b) { return Math.round((b - a) / (7 * DAY)); }
  const MOIS = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  function _fr(d) { return `${d.getDate()} ${MOIS[d.getMonth()]}`; }

  // ── Semaines ────────────────────────────────────────────────
  const wr = (n, run, walk) => ({ min: n * (run + walk), txt: `${n} × (${run}' course / ${walk}' marche)` });
  const ez = min => ({ min, txt: `${min}' footing facile, en continu` });
  const q  = (min, txt) => ({ min, txt, hard: true });
  const vz = min => ({ min, txt: `${min}' facile, buste relevé, 85-95 tours/min` });
  const vq = (min, txt) => ({ min, txt, hard: true });

  // r1 = mardi tapis · r2 = samedi tapis · b1 = mercredi vélo · l = dimanche vélo long
  // br = minutes de course enchaînées juste après le vélo du dimanche
  // sw = bloc de nage continue du jeudi (mètres)
  const wr55 = { min: 26, txt: "4 × (5'30 course / 1' marche)" };
  const WEEKS = [
    { id: 1,  r1: wr(8, 2, 1), r2: wr(8, 2, 1), b1: vz(35), l: 45, br: 0, sw: 300 },
    { id: 2,  r1: wr(6, 3, 1), r2: wr(6, 3, 1), b1: vz(35), l: 50, br: 0, sw: 350 },
    { id: 3,  r1: wr(5, 4, 1), r2: wr(5, 4, 1), b1: vz(40), l: 60, br: 0, sw: 400 },
    { id: 4,  r1: wr(5, 3, 1), r2: wr(5, 3, 1), b1: vz(30), l: 45, br: 0, sw: 300, cut: true },
    { id: 5,  r1: wr55, r2: wr55, b1: vz(40), l: 60, br: 0, sw: 450 },
    { id: 6,  r1: wr(3, 8, 1), r2: wr(3, 8, 1), b1: vz(40), l: 65, br: 0, sw: 500 },
    { id: 7,  r1: wr(3, 9, 1), r2: wr(3, 9, 1), b1: vq(45, "12' facile, 4 × 4' soutenu (récup 3'), retour au calme"), l: 70, br: 0, sw: 550 },
    { id: 8,  r1: wr(2, 10, 1), r2: wr(2, 10, 1), b1: vz(30), l: 50, br: 0, sw: 400, cut: true },
    { id: 9,  r1: wr(2, 15, 1), r2: ez(30), b1: vq(45, "12' facile, 4 × 4' soutenu (récup 3'), retour au calme"), l: 75, br: 0, sw: 600 },
    { id: 10, r1: ez(33), r2: ez(30), b1: vq(45, "10' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 80, br: 5, sw: 650 },
    { id: 11, r1: ez(36), r2: ez(33), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 8, sw: 700 },
    { id: 12, r1: ez(25), r2: ez(25), b1: vz(35), l: 55, br: 0, sw: 500, cut: true },
    { id: 13, r1: q(39, "13' facile, 3 × 6' soutenu (récup 2' trot), retour au calme"), r2: ez(35), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 10, sw: 750 },
    { id: 14, r1: q(42, "15' facile, 5 × 3' soutenu (récup 2' trot), retour au calme"), r2: ez(38), b1: vq(55, "12' facile, 5 × 5' soutenu (récup 3'), retour au calme"), l: 90, br: 12, sw: 800 },
    { id: 15, r1: q(45, "12' facile, 3 × 8' soutenu (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(55, "12' facile, 3 × 8' soutenu (récup 4'), retour au calme"), l: 60, road1: true, br: 15, sw: 850 },
    { id: 16, r1: ez(30), r2: ez(25), b1: vz(35), l: 60, br: 0, sw: 500, cut: true },
    { id: 17, r1: q(46, "12' facile, 6 × 3' soutenu (récup 2' trot), retour au calme"), r2: ez(42), b1: vq(58, "12' facile, 3 × 10' soutenu (récup 4'), retour au calme"), l: 75, br: 15, sw: 900 },
    { id: 18, r1: q(48, "14' facile, 3 × 8' soutenu (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' soutenu (récup 4'), retour au calme"), l: 90, br: 15, sw: 950 },
    { id: 19, r1: q(48, "12' facile, 5 × 4' soutenu (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(60, "12' facile, 2 × 15' soutenu (récup 5'), retour au calme"), l: 90, br: 15, sw: 1000 },
    { id: 20, r1: ez(25), r2: q(50, "TEST 5 KM : 15' d'échauffement, 5 km chrono régulier, 8' de retour au calme. Pas de départ rapide."), b1: vz(35), l: 60, br: 0, sw: 600, cut: true },
    { id: 21, r1: q(45, "15' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' allure course (récup 4'), retour au calme"), l: 80, br: 20, sw: 800, wet: true },
    { id: 22, r1: q(46, "14' facile, 5 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' allure course (récup 4'), retour au calme"), l: 90, br: 20, sw: 800 },
    { id: 23, r1: q(44, "15' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(60, "12' facile, 2 × 15' allure course (récup 5'), retour au calme"), l: 75, br: 20, sw: 800, swimBike: true, tag: "juste après la nage : 75' dont 2 × 12' à allure course, transitions rapides" },
    { id: 24, r1: ez(30), r2: ez(25), b1: vz(35), l: 60, br: 0, sw: 600, cut: true },
    { id: 25, r1: q(46, "14' facile, 5 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(60, "12' facile, 2 × 15' allure course (récup 5'), retour au calme"), l: 90, br: 20, sw: 800 },
    { id: 26, r1: q(42, "14' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(35), b1: vz(45), l: 50, br: 20, sw: 800, tag: "RÉPÉTITION GÉNÉRALE : 750 m en combinaison, 20 km de vélo, 3 km de course, avec le matériel de la course" },
    { id: 27, r1: q(44, "14' facile, 5 × 3' allure 5 km (récup 2' trot), retour au calme"), r2: ez(35), b1: vq(50, "12' facile, 2 × 10' allure course (récup 5'), retour au calme"), l: 75, br: 15, sw: 750 },
    { id: 28, r1: q(34, "14' facile, 4 × 2' allure 5 km (récup 2' trot), retour au calme"), r2: ez(25), b1: vq(38, "12' facile, 3 × 4' allure course (récup 3'), retour au calme"), l: 50, br: 10, sw: 600, cut: true },
    { id: 29, r1: q(25, "12' facile, 4 × 1' allure 5 km (récup 1' trot), retour au calme"), r2: ez(0), b1: vq(30, "15' facile, 3 × 1' allure course (récup 2'), retour au calme"), l: 0, br: 0, sw: 400, cut: true, race: true },
  ];
  // Insérées après la semaine 12 quand la course est à plus de 29 semaines
  const EXTRA = [
    { id: 12, ext: true, r1: ez(36), r2: ez(33), b1: vq(45, "10' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 80, br: 8, sw: 650 },
    { id: 12, ext: true, r1: ez(36), r2: ez(33), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 8, sw: 700 },
    { id: 12, ext: true, r1: ez(36), r2: ez(33), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 8, sw: 700 },
    { id: 12, ext: true, r1: ez(25), r2: ez(25), b1: vz(35), l: 55, br: 0, sw: 500, cut: true },
  ];
  // Retirées dans cet ordre quand la course est plus proche ou après une semaine ratée :
  // d'abord le développement, jamais l'affûtage (ni la répétition générale, sem 26)
  const DROP = [18, 19, 14, 22, 27, 10];
  const MIN_WEEKS = WEEKS.length - DROP.length;

  // Semaine civile de la course quand elle tombe du lundi au jeudi (repos puis course)
  const RACE_WEEK = { id: 30, r1: ez(0), r2: ez(0), b1: vz(0), l: 0, br: 0, sw: 0, cut: true, race: true, only: true };

  // raceDow : 0 = lundi … 6 = dimanche
  function buildPlan(n, raceDow) {
    if (raceDow > 3 || n < 2) return buildSequence(n);
    const r = buildSequence(n - 1);
    const weeks = r.weeks.slice();
    weeks[weeks.length - 1] = Object.assign({}, weeks[weeks.length - 1], { race: false, pre: true, r2: ez(15), l: 30 });
    return { weeks: [...weeks, RACE_WEEK], tooShort: r.tooShort };
  }

  function buildSequence(n) {
    const len = WEEKS.length;
    if (n >= len) {
      const x = n - len;
      const extra = Array.from({ length: x }, (_, i) => EXTRA[i % EXTRA.length]);
      // le bloc inséré finit par une semaine allégée (jamais 5-6 semaines montantes d'affilée)
      if (x % EXTRA.length >= 2) extra[x - 1] = EXTRA[EXTRA.length - 1];
      return { weeks: [...WEEKS.slice(0, 12), ...extra, ...WEEKS.slice(12)], tooShort: false };
    }
    const drop = DROP.slice(0, Math.min(len - n, DROP.length));
    const kept = WEEKS.filter(w => !drop.includes(w.id));
    if (n >= MIN_WEEKS) return { weeks: kept, tooShort: false };
    // Trop court : on ne saute PAS dans la progression, on coupe le haut et on garde
    // l'affûtage. Le message le dit clairement.
    const taper = kept.slice(-2);
    const m = Math.max(1, n);
    return { weeks: m <= 2 ? taper.slice(-m) : [...kept.slice(0, m - 2), ...taper], tooShort: true };
  }

  const PHASES = [
    { key: 'reprise', label: 'Reprise',  max: 6,  why: "Tapis en marche-course, vélo de salle facile, technique en piscine. Ton cœur est prêt (tennis), pas tes tibias ni tes tendons d'Achille.", key2: "Course : parle en phrases complètes, sinon ralentis le tapis. Vélo : buste relevé, note ton dos le lendemain." },
    { key: 'base',    label: 'Base',     max: 12, why: "Course continue à partir de la semaine 9, vélo avec quelques blocs soutenus, premiers enchaînements. Tout reste à l'intérieur.", key2: "La salle, buste relevé, ne teste ni la nuque ni le haut du dos. Réserve un vélo de route à louer pour mars." },
    { key: 'dev',     label: 'Développement', max: 20, why: "Course soutenue le mardi, vélo long dehors, enchaînement le dimanche. Test du dos : 3 sorties de 60 à 90 min sur un vélo de route loué. Test 5 km en fin de phase.", key2: "Sur l'enchaînement, pars lentement : les jambes lourdes passent en 5 minutes." },
    { key: 'spec',    label: 'Spécifique', max: 27, why: "Allure course, transitions et eau libre. La muscu des jambes passe en entretien.", key2: "La panique au départ est la première cause d'abandon : 3 à 4 nages en eau libre encadrées, en combinaison, et un départ en groupe simulé." },
    { key: 'taper',   label: 'Affûtage', max: 99, why: "On ne construit plus rien, on arrive frais. Pas de tennis.", key2: "Rien de neuf le jour J : combinaison, chaussures, lunettes et ravitaillement déjà testés." },
  ];
  function _phaseOf(w) { return PHASES.find(p => w.id <= p.max); }

  // ── État courant ────────────────────────────────────────────
  function _settings() { return (typeof MuscuStorage !== 'undefined' && MuscuStorage.getSettings) ? MuscuStorage.getSettings() : {}; }

  function getState(now, settings) {
    const s = settings || _settings();
    const today = now || new Date();
    const start = _monday(_parse(s.triathlonStart || DEFAULT_START));
    const race = _parse(s.raceDate || DEFAULT_RACE);
    const n = _weeksBetween(start, _monday(race)) + 1;
    const raceDow = (race.getDay() + 6) % 7;
    const { weeks, tooShort } = buildPlan(n, raceDow);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const raw = _weeksBetween(start, _monday(t));
    const index = Math.max(0, Math.min(weeks.length - 1, raw));
    const daysToRace = Math.round((race - t) / DAY);
    return {
      start, race, raceDow, today: t, weeks, tooShort, total: weeks.length, index,
      before: raw < 0, after: daysToRace < 0, daysToRace,
      weeksToRace: Math.ceil(daysToRace / 7),
      week: weeks[index], phase: _phaseOf(weeks[index]),
      monday: _add(start, index * 7), key: _iso(_add(start, index * 7)),
    };
  }

  const COACH = { 2: 1, 6: 2, 10: 3 };

  // Jour de tennis possible (hors plan) : alternance, jamais le samedi des sem 20/23/26
  function tennisDay(ctx) {
    const w = ctx.week;
    if (w.id === 23 || w.id >= 28) return null;
    if (w.id === 20 || w.id === 26) return 'mercredi';
    return (ctx.index + 1) % 2 ? 'samedi' : 'mercredi';
  }

  // Contexte d'une semaine donnée (navigation ‹ ›)
  function getWeek(state, i) {
    const w = state.weeks[i];
    return { week: w, index: i, raceDow: state.raceDow, race: state.race, phase: _phaseOf(w), monday: _add(state.start, i * 7), key: _iso(_add(state.start, i * 7)) };
  }

  // Séances de l'app prévues cette semaine (les autres sont passées d'office)
  function plannedIdx() { return new Set(getDays(getWeek(getState(), getState().index)).flatMap(d => d.items).map(it => it.planIdx).filter(x => x != null)); }

  // Piscine : on change de phase SUR CRITÈRE (settings.swimLevel, 0 = fondations),
  // jamais plus vite que le calendrier ; l'affûtage (index 4) est imposé par la date.
  const SWIM_CRITERIA = [
    "6 × 25 m sans arrêt, coups de bras stables (2 d'écart au plus entre le 1ᵉʳ et le 6ᵉ), effort à 5/10 au plus",
    "6 × 100 m avec 2 coups de bras d'écart au plus par 25 m entre le premier et le dernier, effort à 5/10 au plus",
    "8 × 100 m réguliers, 3 secondes d'écart au plus",
  ];
  function getSwimIndex() {
    const weeks = getState().weeksToRace;
    const cal = MuscuExercises.getSwimVariants().findIndex(v => weeks > v.minWeeksToRace);
    if (cal === 4) return 4;
    return Math.min(_settings().swimLevel || 0, cal);
  }
  function swimStatus() {
    const weeks = getState().weeksToRace, idx = getSwimIndex(), lvl = _settings().swimLevel || 0;
    return { index: idx, criterion: idx < 3 && lvl === idx ? SWIM_CRITERIA[idx] : '', waiting: idx < lvl && idx < 4, canBack: lvl > 0 && idx < 4 };
  }
  function setSwimLevel(delta) {
    const s = _settings();
    const st = swimStatus();
    if (delta > 0 && !confirm('Critère tenu sur une séance complète ? ' + st.criterion + '.')) return;
    s.swimLevel = Math.max(0, Math.min(3, (s.swimLevel || 0) + delta));
    MuscuStorage.saveSettings(s);
    MuscuApp.regenKeepStatus();
  }

  function isCutWeek() { return !!getState().week.cut; }

  // ── Les 7 jours d'une semaine ───────────────────────────────
  function getDays(ctx) {
    const { week: w, phase: p } = ctx;
    const k = p.key;
    const run = (id, title, r) => ({ id, type: 'course', icon: '🏃', title, min: r.min, txt: r.txt, hard: r.hard, where: id === 'run_2' && w.id >= 11 ? 'dehors si possible' : indoor ? 'tapis' : 'tapis ou dehors' });
    const indoor = k === 'reprise' || k === 'base';
    const strength = (id, planIdx, title, txt) => ({ id, type: 'muscu', icon: '💪', title, planIdx, txt });
    const off = (id, txt) => ({ id, type: 'repos', icon: '🛌', title: 'Repos complet', txt });
    const bikeOut = w.id >= 15;
    const openWater = k === 'spec' && w.id >= 24;

    const days = [
      { d: 'Lun', items: [{ id: 'pool', type: 'piscine', icon: '🏊', title: 'Piscine A, technique', planIdx: 0, min: w.race || w.pre ? 25 : 40, txt: w.race || w.pre ? '600 m facile dont 4 × 25 m vite' : COACH[w.id] && !w.ext ? `Avec un coach (${COACH[w.id]} sur 3) : regard extérieur sur le geste` : 'Séance détaillée plus bas (carte piscine)' },
        ...(w.id === 4 ? [{ id: 'rdv', type: 'repos', icon: '🩺', title: 'Clinicien cette semaine', txt: 'Avec tes expositions : 8 séries de pec, 15 de tirage, environ 1 600 m nagés, heures de tennis, ressenti couché et front squat' }] : [])] },
      { d: 'Mar', items: [
        run('run_1', w.r1.hard ? 'Course qualité' : 'Course facile', w.r1),
        strength('haut_a', 1, 'Muscu haut A', 'Après la course'),
      ] },
      { d: 'Mer', items: [
        { id: 'velo_1', type: 'velo', icon: '🚴', title: w.b1.hard ? 'Vélo qualité' : 'Vélo facile', min: w.b1.min, txt: w.b1.txt, hard: w.b1.hard, where: indoor ? 'salle' : 'salle ou dehors' },
        strength('jambes', 2, w.race ? 'Mobilité' : w.pre ? 'Jambes, activation légère' : 'Muscu jambes', w.race ? 'Gainage seulement, zéro charge' : 'Après le vélo, ou 6 h plus tard'),
      ] },
      { d: 'Jeu', items: [{ id: 'pool_b', type: 'piscine', icon: '🏊', title: openWater ? 'Eau libre (encadrée) ou piscine B' : w.wet ? 'Piscine B + essai de combinaison' : 'Piscine B, continu', min: w.race || w.pre ? 20 : 30,
        txt: w.race || w.pre ? '400 m facile' : `100 m souple, ${w.sw} m d'un bloc très lent, 4 × 50 m, 100 m dos` + (w.id >= 21 && !openWater ? '. Ajoute 4 × 25 m regard devant' : '') + (openWater ? '. Regard devant tous les 8 cycles. En eau libre : combinaison, bouée, jamais seul' : '') }] },
      { d: 'Ven', items: [off('off_ven', w.race ? 'Retrait du dossard, vélo vérifié'
        : w.cut ? 'Semaine allégée : vrai jour sans sport' : "Le repos de la semaine, même avec un tennis")] },
      { d: 'Sam', items: w.race
        ? [off('off_sam', 'Sac prêt, coucher tôt')]
        : [run('run_2', w.r2.hard ? 'Test 5 km' : 'Course facile', w.r2), ...(w.swimBike ? [] : [strength('haut_b', 3, 'Muscu haut B', 'Rowing, bras et gainage, aucun exercice de pec (30 min)')])] },
      { d: 'Dim', items: w.race
        ? [{ id: 'race', type: 'triathlon', icon: '🏁', title: 'TRIATHLON SPRINT', min: 0, txt: '750 m de nage, 20 km de vélo, 5 km de course' }]
        : [
          ...(w.swimBike ? [{ id: 'pool_c', type: 'piscine', icon: '🏊', title: 'Nage puis vélo', min: 20, txt: '500 m continus, sortie rapide, puis vélo dans les 10 min' }] : []),
          { id: 'velo_l', type: 'velo', icon: '🚴', title: 'Vélo long', min: w.l, txt: w.tag || (w.road1 ? `Première sortie sur route, ${w.l}' : terrain plat, freinage et virages avant tout` : '') || `${w.l}' facile, buste relevé, lève-toi de la selle toutes les 10'`, where: bikeOut ? 'dehors si possible' : 'salle', hard: !!w.tag },
          ...(w.br ? [{ id: 'brick', type: 'course', icon: '🏃', title: 'Enchaînement', min: w.br, txt: `${w.br}' de course tout de suite après le vélo`, where: bikeOut ? 'tapis ou dehors' : 'tapis' }] : []),
        ] },
    ];
    if (w.pre) {   // course en début de semaine suivante : activation courte, jamais de charge
      days[5].items = [{ id: 'run_2', type: 'course', icon: '🏃', title: 'Course facile', min: 15, txt: "15' très facile", where: 'dehors si possible' }];
      days[6].items = [{ id: 'velo_l', type: 'velo', icon: '🚴', title: 'Vélo activation', min: 30, txt: "30' facile dont 3 × 1' allure course, avec le vélo de la course" }];
    }
    if (w.race) {
      const r = ctx.raceDow;
      days.forEach((x, i) => {
        if (i === r) x.items = [{ id: 'race', type: 'triathlon', icon: '🏁', title: 'TRIATHLON SPRINT', min: 0, txt: '750 m de nage, 20 km de vélo, 5 km de course' }];
        else if (i > r) x.items = [off('off_' + i, 'Récupération')];
        else if (i === r - 1) x.items = [off('off_' + i, 'Dossard, vélo vérifié, sac prêt, coucher tôt')];
        else if (w.only) x.items = i === 0 ? [{ id: 'pool', type: 'piscine', icon: '🏊', title: 'Piscine facile', planIdx: 0, min: 20, txt: '400 m facile' }] : [off('off_' + i, 'Marche et mobilité')];
      });
    }
    return days.map((x, i) => Object.assign(x, { date: _add(ctx.monday, i), cardioMin: x.items.reduce((s, it) => s + (['course', 'velo'].includes(it.type) ? it.min || 0 : 0), 0) }));
  }

  function runMinutes(w) { return w.r1.min + w.r2.min + w.br; }
  function bikeMinutes(w) { return w.b1.min + w.l; }
  function cardioMinutes(w) { return runMinutes(w) + bikeMinutes(w); }

  // ── Muscu + piscine (séances ouvrables dans l'app) ──────────
  const PREHAB = { name: 'Échauffement : prehab',
    exercises: [
      { id: 'face_pull', sets: 3, reps: '15', rest: 45, notes: 'Rotation externe · une seule fois par jour' },
    ] };

  const TEMPLATE = {
    name: '🏊🚴🏃 Triathlon sprint : 2 piscines, 2 vélos, 2 courses, 3 muscu',
    days: [
      {
        // Plan natation tri-sprint existant (5 phases calées sur la date), tel quel
        label: 'Lundi : Piscine A', focus: 'Plan piscine progressif.', warmup: '', blocks: [], finisher: '',
        cooldown: "100 m très lent + mobilité dans l'eau. Si l'épaule tire en crawl : dos crawlé. JAMAIS de papillon.",
        get variants() {
          const all = MuscuExercises.getSwimVariants();
          const v = all[getSwimIndex()];
          return [Object.assign({}, v, { minWeeksToRace: -Infinity, label: v.label.replace('J4 — Piscine', 'Lundi : Piscine A') })];
        },
      },
      {
        label: 'Mardi : Haut A (pec + dos)',
        focus: 'Séance principale du haut. Double progression 8-12 reps, RIR 1-2. Bench LÉGER, jamais à l\'échec.',
        warmup: 'Déjà fait par la course + mobilité épaules/thoracique + 1 série légère de face pull', finisher: '', cooldown: 'Étirements pec/dos : 3 min',
        blocks: [
          { name: 'Couché (séries classiques)', exercises: [
            { id: 'bench_press', sets: 3, reps: '8-10', rest: 120, notes: 'SEUL, jamais en bi-set · LÉGER, contrôlé, RIR 3, jamais à l\'échec · douleur J+1 ≤ 3/10 sinon machine (swap 🔄)' } ] },
          { name: 'Tractions (séries classiques)', exercises: [
            { id: 'pull_ups', sets: 3, reps: '5-10', rest: 120, notes: 'SEULES · élastique si besoin · arrêt 1 à 2 reps AVANT l\'échec' } ] },
          { name: 'Incliné puis tirage (en alternance, repos complet)', exercises: [
            { id: 'incline_db_press', sets: 3, reps: '8-12', rest: 75, notes: 'A1 · haut du pec · RIR 1-2 · 75 s avant le tirage' },
            { id: 'seated_row', sets: 3, reps: '10-12', rest: 75, notes: 'A2 · RIR 1-2 · 75 s avant l\'incliné' } ] },
          { name: 'Pec iso (séries classiques)', exercises: [
            { id: 'cable_crossover_low', sets: 2, reps: '12-15', rest: 60, notes: 'Contraction 1 s' } ] },
          { name: 'Bi-set : arrière d\'épaule + délts', exercises: [
            { id: 'face_pull', sets: 3, reps: '15', rest: 15, notes: 'B1 · rotation externe · enchaîne' },
            { id: 'lateral_raise', sets: 3, reps: '12-15', rest: 60, notes: 'B2 · RIR 1-2' } ] },
        ],
      },
      {
        label: 'Mercredi : Jambes',
        focus: '', warmup: 'Déjà fait par le vélo', blocks: [], finisher: '',
        cooldown: 'Mollets, hanches, ischios : 5 min',
        variants: [
          { minWeeksToRace: 10,
            focus: 'La seule séance jambes de la semaine, à 4 jours du vélo long. Mollets et tibias = ton assurance anti-blessure, ne les saute pas.',
            blocks: [
              { name: 'Front squat (séries classiques)', exercises: [
                { id: 'front_squat', sets: 3, reps: '8-10', rest: 120, notes: 'SEUL · LÉGER, RIR 2-3 · douleur dos J+1 ≤ 3/10 sinon leg press (swap 🔄)' } ] },
              { name: 'Presse (séries classiques)', exercises: [
                { id: 'leg_press', sets: 3, reps: '8-12', rest: 120, notes: 'SEULE · double progression, RIR 2' } ] },
              { name: 'Bi-set : hanche + ischios', exercises: [
                { id: 'hip_thrust', sets: 3, reps: '10-12', rest: 15, notes: 'A1 · zéro stress dos · enchaîne' },
                { id: 'leg_curl', sets: 3, reps: '12-15', rest: 75, notes: 'A2 · RIR 2' } ] },
              { name: 'Bi-set : mollets + tibias', exercises: [
                { id: 'calf_raise', sets: 4, reps: '12-15', rest: 15, notes: 'B1 · lent (3 s à la descente) · Achille et mollet = la pièce qui casse chez le nouveau coureur' },
                { id: 'tibialis_raise', sets: 3, reps: '15-20', rest: 60, notes: 'B2 · avant du tibia, anti-périostite (4ᵉ tour : mollets seuls)' } ] } ] },
          { minWeeksToRace: 3,
            focus: 'Entretien : on garde la force sans fatiguer les jambes. RIR 3 partout, 30 min.',
            blocks: [
              { name: 'Jambes entretien', exercises: [
                { id: 'leg_press', sets: 2, reps: '8-10', rest: 90, notes: 'RIR 3, charge tenue, pas de record' },
                { id: 'hip_thrust', sets: 2, reps: '10', rest: 75, notes: 'RIR 3' },
                { id: 'calf_raise', sets: 3, reps: '12-15', rest: 60, notes: 'Lent' },
                { id: 'tibialis_raise', sets: 2, reps: '20', rest: 45, notes: '' } ] } ] },
          { minWeeksToRace: 1,
            focus: 'Affûtage : une activation, aucune courbature permise.',
            blocks: [
              { name: 'Activation', exercises: [
                { id: 'leg_press', sets: 2, reps: '8', rest: 90, notes: 'Charge moyenne, très loin de l\'échec' },
                { id: 'calf_raise', sets: 2, reps: '12', rest: 60, notes: 'Léger' } ] } ] },
          { minWeeksToRace: -Infinity,
            focus: 'Semaine de course : mobilité et gainage, zéro charge.',
            blocks: [
              { name: 'Mobilité + gainage', exercises: [
                { id: 'dead_bug', sets: 2, reps: '10', rest: 30, notes: 'Lent' },
                { id: 'bird_dog', sets: 2, reps: '10', rest: 30, notes: 'Lent' } ] } ] },
        ],
      },
      {
        label: 'Samedi : Haut B (dos, bras, sans pec)',
        focus: 'Rowing, bras et gainage. Pas de tirage vertical (le crawl et le service chargent déjà le grand dorsal). AUCUN développé ni poulie vis-à-vis : les 8 séries de pec de la semaine sont le mardi, pour limiter les expositions (nage, service, muscu).',
        warmup: 'Mobilité épaules', finisher: '', cooldown: 'Étirements : 3 min',
        blocks: [ PREHAB,
          { name: 'Rowing (séries classiques)', exercises: [
            { id: 'db_row', sets: 3, reps: '10-12', rest: 75, notes: 'Poitrine appuyée, zéro charge dos · RIR 2-3' } ] },
          { name: 'Bi-set : bras', exercises: [
            { id: 'bicep_curl', sets: 2, reps: '10-12', rest: 15, notes: 'A1 · RIR 2 · enchaîne' },
            { id: 'tricep_pushdown', sets: 2, reps: '12-15', rest: 60, notes: 'A2 · RIR 2' } ] },
          { name: 'Bi-set : gainage', exercises: [
            { id: 'dead_bug', sets: 3, reps: '10', rest: 15, notes: 'B1 · lent · enchaîne' },
            { id: 'pallof_press', sets: 3, reps: '10', rest: 45, notes: 'B2 · par côté, tenir 2 s' } ] },
        ],
      },
    ],
  };

  // ── Journal (coché = séance enregistrée, donc douleur J+1 demandée) ──
  function _log() { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || {}; } catch { return {}; } }
  function _saveLog(l) { localStorage.setItem(LOG_KEY, JSON.stringify(l)); }

  function toggle(weekKey, itemId) {
    const st = getState();
    const i = st.weeks.findIndex((_, j) => getWeek(st, j).key === weekKey);
    if (i < 0) return;
    const ctx = getWeek(st, i);
    let item = null, day = null;
    getDays(ctx).forEach(d => d.items.forEach(it => { if (it.id === itemId) { item = it; day = d; } }));
    if (!item) return;
    const log = _log();
    const wk = log[weekKey] || (log[weekKey] = {});
    const done = !wk[itemId];
    if (!done) {
      MuscuStorage.deleteSession(wk[itemId]);
      delete wk[itemId];
    } else if (item.type === 'repos') {
      wk[itemId] = 'repos';
    } else {
      const saved = MuscuStorage.saveSession({
        date: _iso(day.date > st.today ? st.today : day.date),
        type: item.type, theme: item.title, durationMin: item.min || null,
        exercises: [], notes: item.txt,
      });
      wk[itemId] = saved.id;
    }
    _saveLog(log);
    if (item.type === 'piscine' && weekKey === st.key) {
      const plan = MuscuStorage.getWeekPlan();
      if (plan && plan.triathlonKey === weekKey && plan.days[item.planIdx]) {
        plan.days[item.planIdx].status = done ? 'done' : 'pending';
        MuscuStorage.saveWeekPlan(plan);
      }
    }
    MuscuApp.renderDashboard();
  }

  // « Refaire cette semaine » : décale le départ de 7 jours, le plan se recale
  function shift() {
    const st = getState();
    if (st.before) return;
    const next = buildPlan(st.total - 1, st.raceDow);
    const msg = next.tooShort
      ? 'Décaler d\'une semaine ? Attention : il resterait moins de ' + MIN_WEEKS + ' semaines de plan, la phase spécifique sera tronquée. Mieux vaut alors reculer la date de course (⚙️).'
      : 'Décaler le plan d\'une semaine (maladie, douleur, semaine ratée) ? Tu reprends où tu en étais, et la suite se recale sur la date de course.';
    const s = _settings();
    const moved = getState(null, Object.assign({}, s, { triathlonStart: _iso(_add(st.start, 7)) }));
    if (moved.week.id === st.week.id && !moved.week.ext && !st.week.ext) {
      alert('Trop tard pour refaire une semaine sans toucher à la fin du plan : elle est perdue, continue avec la semaine affichée.');
      return;
    }
    if (!confirm(msg)) return;
    s.triathlonStart = _iso(_add(st.start, 7));
    MuscuStorage.saveSettings(s);
    _view = null;
    MuscuApp.renderDashboard();
  }

  function set5k() {
    const s = _settings();
    const v = prompt('Temps sur 5 km, en min:s (test du samedi de la semaine 20). Vide = effacer.', s.tri5k ? `${Math.floor(s.tri5k / 60)}:${String(s.tri5k % 60).padStart(2, '0')}` : '');
    if (v === null) return;
    const m = v.trim().match(/^(\d{1,2})[:' ](\d{1,2})$/);
    const sec = m ? Number(m[1]) * 60 + Number(m[2]) : 0;
    if (v.trim() === '') delete s.tri5k;
    else if (sec >= 900 && sec <= 2700) s.tri5k = sec;
    else { alert('Format attendu : 27:30 (entre 15 et 45 minutes).'); return; }
    MuscuStorage.saveSettings(s);
    MuscuApp.renderDashboard();
  }

  // ── Rendu ───────────────────────────────────────────────────
  let _view = null;   // index de semaine affiché (null = semaine en cours)
  function nav(delta) { const st = getState(); const cur = _view == null ? st.index : _view; const n = Math.max(0, Math.min(st.total - 1, cur + delta)); _view = n === st.index ? null : n; render(); }
  function navHome() { _view = null; render(); }

  function _pace(kmh) { const s = Math.round(3600 / kmh); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`; }
  function _zones(v5) {   // v5 = vitesse du test 5 km (km/h)
    const z = (lab, lo, hi) => `<div class="tri-zone"><b>${lab}</b><span>${(v5 * lo).toFixed(1)} à ${(v5 * hi).toFixed(1)} km/h</span><small>${_pace(v5 * hi)} à ${_pace(v5 * lo)}</small></div>`;
    return z('Facile', 0.70, 0.80) + z('Soutenu', 0.89, 0.95) + z('Allure 5 km', 0.98, 1.02);
  }

  function render() {
    const el = document.getElementById('dash-triathlon-content');
    const card = document.getElementById('dash-triathlon-card');
    if (!el || !card) return;
    const active = (MuscuStorage.getProfile().goal === 'triathlon');
    card.style.display = active ? '' : 'none';
    if (!active) return;

    const st = getState();
    const vi = _view == null ? st.index : Math.min(_view, st.total - 1);
    const ctx = getWeek(st, vi);
    const cur = vi === st.index;
    const days = getDays(ctx);
    const log = _log()[ctx.key] || {};
    const plan = MuscuStorage.getWeekPlan();
    const planOk = plan && plan.triathlonKey === ctx.key;
    const todayIso = _iso(st.today);
    const t5 = _settings().tri5k;

    const isDone = it => it.type === 'muscu'
      ? !!(planOk && plan.days[it.planIdx] && plan.days[it.planIdx].status === 'done')
      : !!log[it.id];
    const real = days.flatMap(d => d.items).filter(it => it.type !== 'repos');
    const nDone = real.filter(isDone).length;

    const steps = PHASES.map(p => {
      const c = PHASES.indexOf(p), a = PHASES.indexOf(ctx.phase);
      const first = st.weeks.findIndex(w => _phaseOf(w) === p);
      return `<div class="tri-step ${c === a ? 'active' : c < a ? 'done' : ''}">${p.label}<small>${first >= 0 ? 'dès le ' + _fr(_add(st.start, first * 7)) : 'non atteint'}</small></div>`;
    }).join('');

    const rows = days.map(d => {
      const isToday = _iso(d.date) === todayIso;
      const items = d.items.map(it => {
        const done = isDone(it);
        const btn = it.type === 'muscu'
          ? (planOk ? `<button class="tri-btn ${done ? 'on' : ''}" aria-label="Ouvrir ${it.title}" onclick="MuscuApp.showDayDetail(${it.planIdx})">${done ? '✓' : 'Ouvrir'}</button>` : '')
          : (it.type === 'repos' ? '' : `<button class="tri-btn ${done ? 'on' : ''}" aria-label="${done ? 'Annuler' : 'Marquer fait'} : ${it.title}" ${ctx.monday > st.today ? 'disabled' : ''} onclick="MuscuTriathlon.toggle('${ctx.key}','${it.id}')">${done ? '✓' : 'Fait'}</button>`);
        return `<div class="tri-item ${done ? 'done' : ''}">
          <span class="tri-ico">${it.icon}</span>
          <div class="tri-what"><b>${it.title}</b>${it.min ? `<em>${it.min} min</em>` : ''}${it.hard ? '<i class="tri-hard">soutenu</i>' : ''}${it.where ? `<i class="tri-where">${it.where}</i>` : ''}<small>${it.txt || ''}</small></div>${btn}</div>`;
      }).join('');
      return `<div class="tri-day ${isToday ? 'today' : ''}"><div class="tri-dow">${d.d}<small>${d.date.getDate()}</small></div><div class="tri-items">${items}</div></div>`;
    }).join('');

    const maxMin = Math.max(...st.weeks.map(cardioMinutes));
    const bars = st.weeks.map((w, i) => {
      const tot = cardioMinutes(w);
      const lab = `Semaine ${i + 1} : ${w.race ? 'triathlon' : runMinutes(w) + ' min de course, ' + bikeMinutes(w) + ' min de vélo'}`;
      return `<button class="tri-bar ${w.cut ? 'cut' : ''} ${i === vi ? 'sel' : ''} ${w.race ? 'race' : ''}" title="${lab}" aria-label="${lab}" onclick="MuscuTriathlon.goto(${i})"><span style="height:${w.race ? 100 : Math.round(tot / maxMin * 100)}%"></span></button>`;
    }).join('');

    el.innerHTML = `
      <div class="tri-head">
        <div>
          <div class="tri-title">🏊🚴🏃 Plan triathlon sprint</div>
          <div class="tri-sub">Semaine ${vi + 1} sur ${st.total} · ${ctx.phase.label}${ctx.week.cut && !ctx.week.race ? (ctx.phase.key === 'taper' ? '' : ' · semaine allégée') : ''}</div>
          <div class="text-muted text-sm">${_fr(ctx.monday)} au ${_fr(_add(ctx.monday, 6))} · course ${runMinutes(ctx.week)} min, vélo ${bikeMinutes(ctx.week)} min${ctx.week.race ? ' + la course' : ', nage 2 séances'}</div>
        </div>
        <span class="tri-count">${st.after ? 'course passée' : 'J-' + st.daysToRace}</span>
      </div>
      ${st.tooShort ? `<div class="tri-warn">La course du ${_fr(st.race)} est à moins de ${MIN_WEEKS} semaines du départ du plan. La phase spécifique est tronquée : recule la date dans ⚙️ si tu peux.</div>` : ''}
      <div class="tri-steps">${steps}</div>
      <div class="tri-why">${ctx.phase.why}</div>
      <div class="tri-nav">
        <button class="btn btn-sm btn-ghost" aria-label="Semaine précédente" ${vi === 0 ? 'disabled' : ''} onclick="MuscuTriathlon.nav(-1)">‹</button>
        <span>${cur ? `Cette semaine · ${nDone}/${real.length} faites` : `<a href="#" onclick="MuscuTriathlon.navHome();return false">Revenir à cette semaine</a>`}</span>
        <button class="btn btn-sm btn-ghost" aria-label="Semaine suivante" ${vi === st.total - 1 ? 'disabled' : ''} onclick="MuscuTriathlon.nav(1)">›</button>
      </div>
      <div class="tri-days">${rows}</div>
      <div class="text-muted text-sm" style="margin:6px 0">🎾 ${tennisDay(ctx) ? `Tennis possible cette semaine : <b>${tennisDay(ctx)}</b>. ${tennisDay(ctx) === 'samedi' ? 'Il remplace la course.' : 'Il remplace le vélo.'}` : 'Pas de tennis cette semaine.'}</div>
      <div class="tri-key">🎯 ${ctx.phase.key2}</div>
      <div class="tri-bars">${bars}</div>
      <div class="text-muted text-sm tri-legend">Minutes de course et de vélo par semaine. Pâle = semaine allégée. Touche une barre pour voir la semaine.</div>
      <div class="tri-pace">
        <div class="tri-pace-head"><b>Vitesses</b><button class="btn btn-sm btn-ghost" onclick="MuscuTriathlon.set5k()">${t5 ? '5 km en ' + Math.floor(t5 / 60) + ':' + String(t5 % 60).padStart(2, '0') : 'Saisir mon 5 km'}</button></div>
        ${t5 ? `<div class="tri-zones">${_zones(18000 / t5)}</div>` : `<div class="text-muted text-sm">Jusqu'au test 5 km de la semaine 20, cours à l'effort : <b>facile</b> = phrases complètes (3-4/10), <b>soutenu</b> = quelques mots (6-7/10). Tapis à 1 % de pente, marche entre 5 et 5,5 km/h.</div>`}
      </div>
      <details class="tri-rules"><summary>Règles et substitutions</summary>
        <ul>
          <li><b>Douleur au tibia, au tendon d'Achille ou au genou au-dessus de 3/10</b> (pendant, ou le lendemain) : remplace la course par le même nombre de minutes de vélo ou de nage.</li>
          <li><b>Douleur précise sur l'os, qui fait boiter ou réveille la nuit</b> : plus de course, rendez-vous médical (fracture de fatigue à écarter).</li>
          <li><b>Test du dos</b> (mars) : 3 sorties de 60 à 90 min sur un vélo de route loué, douleur à 3/10 au plus pendant et le lendemain, sans irradiation. Sinon, guidon plat : un sprint se finit très bien avec.</li>
          <li><b>Séance ratée</b> : elle est perdue, on ne la rattrape pas. Priorité si tu manques de temps : course du mardi, vélo du dimanche, piscine A, piscine B, vélo du mercredi, course du samedi, muscu.</li>
          <li><b>Semaine ratée</b> : utilise le bouton ci-dessous. Le plan retire une semaine de développement, jamais l'affûtage. Après la semaine 19, une semaine ratée est perdue, on continue.</li>
          <li><b>Tennis</b> (hors plan, une fois par semaine) : il remplace une séance. Mercredi, le vélo saute. Samedi, la course saute, et le haut B aussi si l'épaule tire. Vendredi reste un repos. Pas de tennis les deux dernières semaines.</li>
          <li><b>Nuit courte ou jambes lourdes deux jours de suite</b> : la course du samedi devient un repos.</li>
          <li><b>Pec, dos, épaules</b> : on juge la douleur du lendemain. Jusqu'à 3/10, rien ne change. 4 ou 5 : charge −20 %. À partir de 6 : −30 % et exercice remplacé. Le service au tennis compte comme une charge d'épaule.</li>
          <li><b>Nage</b> : jamais le jour ni le lendemain d'une séance du haut. Lundi et jeudi sont placés pour ça. 3 séances avec un coach : semaines 2, 6 et 10.</li>
          <li><b>Eau libre</b> : site surveillé ou club, jamais seul, combinaison et bouée.</li>
        </ul>
      </details>
      ${cur && !st.before && !st.after && st.index > 0 ? `<button class="btn btn-sm btn-ghost tri-shift" onclick="MuscuTriathlon.shift()">↺ Semaine ratée : décaler le plan d'une semaine</button>` : ''}
    `;
  }
  function goto(i) { const st = getState(); _view = i === st.index ? null : i; render(); }

  return { DEFAULT_START, DEFAULT_RACE, TEMPLATE, getState, getWeek, getDays, buildSequence, runMinutes, bikeMinutes, cardioMinutes, isCutWeek, plannedIdx, getSwimIndex, swimStatus, setSwimLevel, set5k, tennisDay, toggle, shift, nav, navHome, goto, render, _phaseOf };
})();
if (typeof module !== 'undefined') module.exports = MuscuTriathlon;
