/* ════════════════════════════════════════════════════════════
   PLAN TRIATHLON SPRINT (objectif 'triathlon') — nov 2026 → juin 2027
   750 m nage · 20 km vélo · 5 km course
   Profil : cardio tennis, AUCUNE base de course, AUCUNE base vélo, dos chronique,
   tient 1 000 m en nage mais sans technique. Hiver : tapis, vélo de salle, piscine.
   - 2 piscines (lun, jeu) · 2 vélos (mer, dim) · 2 tapis (mar, sam) · 3 muscu · 1-2 tennis
   - Enchaînement vélo → course le dimanche à partir de la semaine 9.
   - Semaine allégée toutes les 4 sem (la muscu se décharge en même temps).
   - Tennis = l'intensité de l'hiver → pas de course rapide avant la sem 13.
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
  const WEEKS = [
    { id: 1,  r1: wr(8, 2, 1),  r2: wr(8, 2, 1),  b1: vz(35), l: 45, br: 0, sw: 300 },
    { id: 2,  r1: wr(8, 3, 1),  r2: wr(6, 3, 1),  b1: vz(35), l: 50, br: 0, sw: 350 },
    { id: 3,  r1: wr(6, 5, 1),  r2: wr(5, 5, 1),  b1: vz(40), l: 60, br: 0, sw: 400 },
    { id: 4,  r1: wr(4, 5, 1),  r2: wr(4, 5, 1),  b1: vz(30), l: 45, br: 0, sw: 300, cut: true },
    { id: 5,  r1: wr(4, 8, 1),  r2: wr(3, 8, 1),  b1: vz(40), l: 60, br: 0, sw: 450 },
    { id: 6,  r1: wr(3, 10, 1), r2: wr(3, 10, 1), b1: vz(40), l: 65, br: 0, sw: 500 },
    { id: 7,  r1: ez(35), r2: ez(30), b1: vq(45, "12' facile, 4 × 4' soutenu (récup 3'), retour au calme"), l: 70, br: 0, sw: 550 },
    { id: 8,  r1: q(30, "TEST : 12' d'échauffement, 6' au maximum tenable sans sprinter, 12' de retour au calme. Distance en mètres ÷ 100 = ta VMA. À sauter si un tibia, un tendon ou un genou tire."), r2: ez(25), b1: vz(30), l: 50, br: 0, sw: 400, cut: true },
    { id: 9,  r1: ez(35), r2: ez(35), b1: vq(45, "12' facile, 4 × 4' soutenu (récup 3'), retour au calme"), l: 75, br: 5, sw: 600 },
    { id: 10, r1: ez(40), r2: ez(35), b1: vq(45, "10' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 80, br: 8, sw: 650 },
    { id: 11, r1: ez(40), r2: ez(40), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 10, sw: 700 },
    { id: 12, r1: ez(30), r2: ez(25), b1: vz(35), l: 55, br: 0, sw: 500, cut: true },
    { id: 13, r1: q(42, "15' facile, 3 × 6' soutenu (récup 2' trot), retour au calme"), r2: ez(35), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 10, sw: 750 },
    { id: 14, r1: q(44, "15' facile, 5 × 3' soutenu (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(55, "12' facile, 5 × 5' soutenu (récup 3'), retour au calme"), l: 90, br: 12, sw: 800 },
    { id: 15, r1: q(45, "12' facile, 3 × 8' soutenu (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(55, "12' facile, 3 × 8' soutenu (récup 4'), retour au calme"), l: 95, br: 15, sw: 850 },
    { id: 16, r1: ez(30), r2: ez(25), b1: vz(35), l: 60, br: 0, sw: 500, cut: true },
    { id: 17, r1: q(46, "12' facile, 6 × 3' soutenu (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' soutenu (récup 4'), retour au calme"), l: 100, br: 15, sw: 900 },
    { id: 18, r1: q(48, "14' facile, 3 × 8' soutenu (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' soutenu (récup 4'), retour au calme"), l: 105, br: 15, sw: 950 },
    { id: 19, r1: q(48, "12' facile, 5 × 4' soutenu (récup 2' trot), retour au calme"), r2: ez(50), b1: vq(60, "12' facile, 2 × 15' soutenu (récup 5'), retour au calme"), l: 110, br: 20, sw: 1000 },
    { id: 20, r1: q(50, "TEST 5 KM : 15' d'échauffement, 5 km chrono régulier, 8' de retour au calme. Pas de départ rapide."), r2: ez(20), b1: vz(35), l: 70, br: 0, sw: 600, cut: true },
    { id: 21, r1: q(45, "15' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' allure course (récup 4'), retour au calme"), l: 80, br: 20, sw: 800 },
    { id: 22, r1: q(46, "14' facile, 5 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(45), b1: vq(58, "12' facile, 3 × 10' allure course (récup 4'), retour au calme"), l: 90, br: 20, sw: 800 },
    { id: 23, r1: q(44, "15' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(60, "12' facile, 2 × 15' allure course (récup 5'), retour au calme"), l: 75, br: 20, sw: 800, tag: "dont 2 × 12' à allure course, transition rapide" },
    { id: 24, r1: ez(30), r2: ez(25), b1: vz(35), l: 60, br: 0, sw: 600, cut: true },
    { id: 25, r1: q(46, "14' facile, 5 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(40), b1: vq(60, "12' facile, 2 × 15' allure course (récup 5'), retour au calme"), l: 90, br: 22, sw: 800 },
    { id: 26, r1: q(42, "14' facile, 4 × 4' allure 5 km (récup 2' trot), retour au calme"), r2: ez(35), b1: vz(45), l: 50, br: 20, sw: 800, tag: "RÉPÉTITION GÉNÉRALE : 750 m en combinaison, 20 km de vélo, 3 km de course, avec le matériel de la course" },
    { id: 27, r1: q(44, "14' facile, 5 × 3' allure 5 km (récup 2' trot), retour au calme"), r2: ez(35), b1: vq(50, "12' facile, 2 × 10' allure course (récup 5'), retour au calme"), l: 75, br: 15, sw: 750 },
    { id: 28, r1: q(34, "14' facile, 4 × 2' allure 5 km (récup 2' trot), retour au calme"), r2: ez(25), b1: vq(38, "12' facile, 3 × 4' allure course (récup 3'), retour au calme"), l: 50, br: 10, sw: 600, cut: true },
    { id: 29, r1: q(25, "12' facile, 4 × 1' allure 5 km (récup 1' trot), retour au calme"), r2: ez(0), b1: vq(30, "15' facile, 3 × 1' allure course (récup 2'), retour au calme"), l: 0, br: 0, sw: 400, cut: true, race: true },
  ];
  // Insérées après la semaine 12 quand la course est à plus de 29 semaines
  const EXTRA = [
    { id: 12, ext: true, r1: ez(40), r2: ez(35), b1: vq(45, "10' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 80, br: 8, sw: 650 },
    { id: 12, ext: true, r1: ez(40), r2: ez(40), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 10, sw: 700 },
    { id: 12, ext: true, r1: ez(40), r2: ez(40), b1: vq(50, "12' facile, 4 × 5' soutenu (récup 3'), retour au calme"), l: 85, br: 10, sw: 700 },
    { id: 12, ext: true, r1: ez(30), r2: ez(25), b1: vz(35), l: 55, br: 0, sw: 500, cut: true },
  ];
  // Retirées dans cet ordre quand la course est plus proche
  const DROP = [27, 22, 18, 14, 10, 19];
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
    { key: 'base',    label: 'Base',     max: 12, why: "Course continue, vélo avec quelques blocs soutenus, premiers enchaînements vélo puis tapis. Tout reste à l'intérieur.", key2: "Le vélo décide de ton triathlon : si le dos reste à 3/10 ou moins le lendemain, fais l'étude posturale puis achète ou loue le vélo avant mars." },
    { key: 'dev',     label: 'Développement', max: 20, why: "Course soutenue le mardi, vélo long dehors dès que la météo le permet, enchaînement chaque dimanche. Test 5 km en fin de phase.", key2: "Sur l'enchaînement, pars lentement : les jambes lourdes passent en 5 minutes." },
    { key: 'spec',    label: 'Spécifique', max: 27, why: "Allure course, transitions et eau libre. La muscu des jambes passe en entretien. Un seul tennis par semaine.", key2: "La panique au départ est la première cause d'abandon : 3 à 4 nages en eau libre encadrées, en combinaison, et un départ en groupe simulé." },
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

  // Contexte d'une semaine donnée (navigation ‹ ›)
  function getWeek(state, i) {
    const w = state.weeks[i];
    return { week: w, index: i, raceDow: state.raceDow, race: state.race, phase: _phaseOf(w), monday: _add(state.start, i * 7), key: _iso(_add(state.start, i * 7)) };
  }

  // Séances de l'app prévues cette semaine (les autres sont passées d'office)
  function plannedIdx() { return new Set(getDays(getWeek(getState(), getState().index)).flatMap(d => d.items).map(it => it.planIdx).filter(x => x != null)); }

  function isCutWeek() { return !!getState().week.cut; }

  // ── Les 7 jours d'une semaine ───────────────────────────────
  function getDays(ctx) {
    const { week: w, phase: p } = ctx;
    const k = p.key;
    const run = (id, title, r) => ({ id, type: 'course', icon: '🏃', title, min: r.min, txt: r.txt, hard: r.hard, where: indoor ? 'tapis' : 'tapis ou dehors' });
    const indoor = k === 'reprise' || k === 'base';
    const strength = (id, planIdx, title, txt) => ({ id, type: 'muscu', icon: '💪', title, planIdx, txt });
    const off = (id, txt) => ({ id, type: 'repos', icon: '🛌', title: 'Repos complet', txt });
    const openWater = k === 'spec' && w.id >= 24;

    const days = [
      { d: 'Lun', items: [{ id: 'pool', type: 'piscine', icon: '🏊', title: 'Piscine A, technique', planIdx: 0, min: w.race || w.pre ? 25 : 40, txt: w.race || w.pre ? '600 m facile dont 4 × 25 m vite' : 'Séance détaillée plus bas (carte piscine)' }] },
      { d: 'Mar', items: [
        run('run_1', w.r1.hard ? 'Course qualité' : 'Course facile', w.r1),
        strength('haut_a', 1, 'Muscu haut A', indoor ? 'Après la course. 2ᵉ tennis possible à la place du tapis' : 'Après la course'),
      ] },
      { d: 'Mer', items: [
        { id: 'velo_1', type: 'velo', icon: '🚴', title: w.b1.hard ? 'Vélo qualité' : 'Vélo facile', min: w.b1.min, txt: w.b1.txt, hard: w.b1.hard, where: indoor ? 'salle' : 'salle ou dehors' },
        strength('jambes', 2, w.race ? 'Mobilité' : w.pre ? 'Jambes, activation légère' : 'Muscu jambes', w.race ? 'Gainage seulement, zéro charge' : 'Après le vélo, ou 6 h plus tard'),
      ] },
      { d: 'Jeu', items: [{ id: 'pool_b', type: 'piscine', icon: '🏊', title: openWater ? 'Eau libre (encadrée) ou piscine B' : 'Piscine B, continu', min: w.race || w.pre ? 20 : 30,
        txt: w.race || w.pre ? '400 m facile' : `100 m souple, ${w.sw} m d'un bloc très lent, 4 × 50 m, 100 m dos` + (openWater ? '. En eau libre : combinaison, bouée, jamais seul' : '') }] },
      { d: 'Ven', items: w.id >= 28 || w.cut
        ? [off('off_ven', w.race ? 'Retrait du dossard, vélo vérifié' : 'Semaine allégée : vrai jour sans sport')]
        : [{ id: 'tennis1', type: 'tennis', icon: '🎾', title: 'Tennis', min: 75, txt: "Ta séance d'intensité. Pas de match prévu : repos" }] },
      { d: 'Sam', items: w.race
        ? [off('off_sam', 'Sac prêt, coucher tôt')]
        : [run('run_2', 'Course facile', w.r2), strength('haut_b', 3, 'Muscu haut B', '2ᵉ dose pec + dos, courte (35-40 min)')] },
      { d: 'Dim', items: w.race
        ? [{ id: 'race', type: 'triathlon', icon: '🏁', title: 'TRIATHLON SPRINT', min: 0, txt: '750 m de nage, 20 km de vélo, 5 km de course' }]
        : [
          { id: 'velo_l', type: 'velo', icon: '🚴', title: 'Vélo long', min: w.l, txt: w.tag || `${w.l}' facile, buste relevé, lève-toi de la selle toutes les 10'`, where: indoor ? 'salle' : 'dehors si possible', hard: !!w.tag },
          ...(w.br ? [{ id: 'brick', type: 'course', icon: '🏃', title: 'Enchaînement', min: w.br, txt: `${w.br}' de course tout de suite après le vélo`, where: indoor ? 'tapis' : 'tapis ou dehors' }] : []),
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
    name: '🏊🚴🏃 Triathlon sprint : 2 piscines, 2 vélos, 2 courses, 3 muscu, tennis',
    days: [
      {
        // Plan natation tri-sprint existant (5 phases calées sur la date), tel quel
        label: 'Lundi : Piscine A', focus: 'Plan piscine progressif.', warmup: '', blocks: [], finisher: '',
        cooldown: "100 m très lent + mobilité dans l'eau. Si l'épaule tire en crawl : dos crawlé. JAMAIS de papillon.",
        get variants() {
          return MuscuExercises.getSwimVariants().map(v => Object.assign({}, v, { label: v.label.replace('J4 — Piscine', 'Lundi : Piscine A') }));
        },
      },
      {
        label: 'Mardi : Haut A (pec + dos)',
        focus: 'Séance principale du haut. Double progression 8-12 reps, RIR 1-2. Bench LÉGER, jamais à l\'échec.',
        warmup: 'Déjà fait par la course + mobilité épaules/thoracique', finisher: '', cooldown: 'Étirements pec/dos : 3 min',
        blocks: [ PREHAB,
          { name: 'Superset A : pec + tractions', exercises: [
            { id: 'bench_press', sets: 3, reps: '8-10', rest: 90, notes: 'A1 · LÉGER, contrôlé, RIR 3, jamais à l\'échec · douleur J+1 ≤ 3/10 sinon machine (swap 🔄)' },
            { id: 'pull_ups', sets: 3, reps: 'max', rest: 90, notes: 'A2 · élastique si besoin · excentrique contrôlé' } ] },
          { name: 'Superset B : pec haut + dos épais', exercises: [
            { id: 'incline_db_press', sets: 3, reps: '8-12', rest: 75, notes: 'B1 · haut du pec · RIR 1-2' },
            { id: 'seated_row', sets: 3, reps: '10-12', rest: 60, notes: 'B2 · RIR 1-2' } ] },
          { name: 'Superset C : pec iso + épaules', exercises: [
            { id: 'cable_crossover_low', sets: 2, reps: '12-15', rest: 45, notes: 'C1 · contraction 1 s' },
            { id: 'lateral_raise', sets: 3, reps: '12-15', rest: 45, notes: 'C2 · RIR 1-2' } ] },
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
              { name: 'Superset A : squat + mollets', exercises: [
                { id: 'front_squat', sets: 3, reps: '8-10', rest: 90, notes: 'A1 · LÉGER, RIR 2-3 · douleur dos J+1 ≤ 3/10 sinon leg press (swap 🔄)' },
                { id: 'calf_raise', sets: 4, reps: '12-15', rest: 60, notes: 'A2 · lent (3 s à la descente) · Achille et mollet = la pièce qui casse chez le nouveau coureur' } ] },
              { name: 'Superset B : presse + tibias', exercises: [
                { id: 'leg_press', sets: 3, reps: '8-12', rest: 90, notes: 'B1 · double progression, RIR 2' },
                { id: 'tibialis_raise', sets: 3, reps: '15-20', rest: 45, notes: 'B2 · avant du tibia, anti-périostite' } ] },
              { name: 'Superset C : hanche + ischios', exercises: [
                { id: 'hip_thrust', sets: 3, reps: '10-12', rest: 75, notes: 'C1 · zéro stress dos' },
                { id: 'leg_curl', sets: 3, reps: '12-15', rest: 45, notes: 'C2 · RIR 2' } ] } ] },
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
        label: 'Samedi : Haut B (2ᵉ dose, court)',
        focus: '2ᵉ stimulation pec + dos, 35-40 min. Garde environ 14 séries de pec par semaine au lieu de 18-20 : c\'est le prix du triathlon.',
        warmup: 'Mobilité épaules', finisher: '', cooldown: 'Étirements : 3 min',
        blocks: [ PREHAB,
          { name: 'Superset A : pec machine + dos', exercises: [
            { id: 'machine_chest_press', sets: 3, reps: '8-12', rest: 90, notes: 'A1 · excentrique 2-3 s · double progression' },
            { id: 'db_row', sets: 3, reps: '10-12', rest: 60, notes: 'A2 · poitrine appuyée, zéro charge dos' } ] },
          { name: 'Superset B : pec iso + dos largeur', exercises: [
            { id: 'cable_crossover_high', sets: 3, reps: '12-15', rest: 45, notes: 'B1 · contraction 1 s' },
            { id: 'lat_pulldown', sets: 3, reps: '10-12', rest: 60, notes: 'B2' } ] },
          { name: 'Superset C : bras', exercises: [
            { id: 'bicep_curl', sets: 2, reps: '10-12', rest: 45, notes: 'C1' },
            { id: 'tricep_pushdown', sets: 2, reps: '12-15', rest: 45, notes: 'C2' } ] },
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
    if (!confirm(msg)) return;
    const s = _settings();
    s.triathlonStart = _iso(_add(st.start, 7));
    MuscuStorage.saveSettings(s);
    _view = null;
    MuscuApp.renderDashboard();
  }

  function setVma() {
    const s = _settings();
    const v = prompt('VMA en km/h (test de la semaine 8 : mètres parcourus en 6 min ÷ 100). Vide = effacer.', s.triathlonVma || '');
    if (v === null) return;
    const num = parseFloat(String(v).replace(',', '.'));
    if (v.trim() === '') delete s.triathlonVma;
    else if (num >= 8 && num <= 24) s.triathlonVma = num;
    else { alert('Valeur attendue entre 8 et 24 km/h.'); return; }
    MuscuStorage.saveSettings(s);
    MuscuApp.renderDashboard();
  }

  // ── Rendu ───────────────────────────────────────────────────
  let _view = null;   // index de semaine affiché (null = semaine en cours)
  function nav(delta) { const st = getState(); const cur = _view == null ? st.index : _view; const n = Math.max(0, Math.min(st.total - 1, cur + delta)); _view = n === st.index ? null : n; render(); }
  function navHome() { _view = null; render(); }

  function _pace(kmh) { const s = Math.round(3600 / kmh); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`; }
  function _zones(vma) {
    const z = (lab, lo, hi) => `<div class="tri-zone"><b>${lab}</b><span>${(vma * lo).toFixed(1)} à ${(vma * hi).toFixed(1)} km/h</span><small>${_pace(vma * hi)} à ${_pace(vma * lo)}</small></div>`;
    return z('Facile', 0.62, 0.72) + z('Soutenu', 0.80, 0.86) + z('Allure 5 km', 0.86, 0.92);
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
    const vma = _settings().triathlonVma;

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
      <div class="tri-key">🎯 ${ctx.phase.key2}</div>
      <div class="tri-bars">${bars}</div>
      <div class="text-muted text-sm tri-legend">Minutes de course et de vélo par semaine. Pâle = semaine allégée. Touche une barre pour voir la semaine.</div>
      <div class="tri-pace">
        <div class="tri-pace-head"><b>Vitesses</b><button class="btn btn-sm btn-ghost" onclick="MuscuTriathlon.setVma()">${vma ? 'VMA ' + vma + ' km/h' : 'Saisir ma VMA'}</button></div>
        ${vma ? `<div class="tri-zones">${_zones(vma)}</div>` : `<div class="text-muted text-sm">Avant le test de la semaine 8, cours à l'effort : <b>facile</b> = phrases complètes (3-4/10), <b>soutenu</b> = quelques mots (6-7/10). Tapis à 1 % de pente, marche entre 5 et 5,5 km/h.</div>`}
      </div>
      <details class="tri-rules"><summary>Règles et substitutions</summary>
        <ul>
          <li><b>Douleur au tibia, au tendon d'Achille ou au genou au-dessus de 3/10</b> (pendant, ou le lendemain) : remplace la course par le même nombre de minutes de vélo ou de nage.</li>
          <li><b>Douleur précise sur l'os, qui fait boiter ou réveille la nuit</b> : plus de course, rendez-vous médical (fracture de fatigue à écarter).</li>
          <li><b>Dos après le vélo</b> au-dessus de 3/10 le lendemain : selle et guidon plus relevés, durée réduite d'un tiers. Si ça continue 3 semaines, avis médical avant tout achat de vélo.</li>
          <li><b>Séance ratée</b> : elle est perdue, on ne la rattrape pas. Priorité si tu manques de temps : piscine A, vélo du dimanche, course du mardi, piscine B, vélo du mercredi, course du samedi, muscu.</li>
          <li><b>Semaine ratée</b> : utilise le bouton ci-dessous plutôt que de sauter une marche.</li>
          <li><b>Jours de tennis différents</b> : déplace-les, jamais la veille du vélo long en phase Spécifique. 2 tennis par semaine au plus, 1 seul à partir de la phase Développement.</li>
          <li><b>Nuit courte ou jambes lourdes deux jours de suite</b> : la course du samedi devient un repos.</li>
          <li><b>Pec, dos, épaules</b> : douleur J+1 de 3/10 au maximum. Le service au tennis compte comme une charge d'épaule.</li>
          <li><b>Nage</b> : jamais le jour ni le lendemain d'une séance du haut. Lundi et jeudi sont placés pour ça.</li>
          <li><b>Eau libre</b> : site surveillé ou club, jamais seul, combinaison et bouée.</li>
        </ul>
      </details>
      ${cur && !st.before && !st.after && st.index > 0 ? `<button class="btn btn-sm btn-ghost tri-shift" onclick="MuscuTriathlon.shift()">↺ Semaine ratée : décaler le plan d'une semaine</button>` : ''}
    `;
  }
  function goto(i) { const st = getState(); _view = i === st.index ? null : i; render(); }

  return { DEFAULT_START, DEFAULT_RACE, TEMPLATE, getState, getWeek, getDays, buildSequence, runMinutes, bikeMinutes, cardioMinutes, isCutWeek, plannedIdx, toggle, shift, setVma, nav, navHome, goto, render, _phaseOf };
})();
if (typeof module !== 'undefined') module.exports = MuscuTriathlon;
