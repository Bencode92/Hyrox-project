/* HyroxForge — Training Engine v4 — Expert validated
   Changes:
   - Demi-Cooper (6min) as test option
   - 4 sessions max S1-8, then 5-6
   - Row technique pure 4 weeks (no intensity)
   - Conditional rest (1:1 if VMA < 13)
   - Fartlek Hyrox variant (30s/90s)
   - Deload: -30% vol AND -10-15% intensity
   - Cap frac long 6×1000m (not 8)
   - Pacing strategy Run 1-8
   - Brick workout (ergo + run)
   - Realistic goal: 13.5 km/h at 6 months, 15 at 12 months
*/

const Training = {
  VMA_CORRECTION: 0.95,
  MAX_PROG_PERCENT: 0.12,

  /* ========== ZONES RUN ========== */
  getRunZones(testSpeedKmh) {
    const vma = testSpeedKmh * this.VMA_CORRECTION;
    return {
      vma: Math.round(vma * 10) / 10,
      testRaw: testSpeedKmh,
      z2:       { min: vma*0.65, max: vma*0.75 },
      tempo:    { min: vma*0.80, max: vma*0.85 },
      seuil:    { min: vma*0.85, max: vma*0.90 },
      iv_long:  { min: vma*0.90, max: vma*0.95 },
      iv_short: { min: vma*0.95, max: vma*1.05 },
    };
  },

  /* ========== ZONES ERGO ========== */
  getErgoZones(test1000mSec) {
    const p5 = test1000mSec / 2;
    return {
      testPace500: p5, test1000: test1000mSec,
      technique: { pace500: p5 * 1.20 },
      endurance: { pace500: p5 * 1.12 },
      racePace:  { pace500: p5 * 1.06 },
      power:     { pace500: p5 * 1.02 },
    };
  },

  /* ========== ADAPTATION DYNAMIQUE ========== */
  getAdaptFactor(exerciseType, sessionType) {
    const sessions = Storage.getSessionsByType(exerciseType)
      .filter(s => s.sessionType === sessionType || this.isSameCategory(s.sessionType, sessionType))
      .slice(0, 3);
    if (sessions.length === 0) return { factor: 1, reason: 'Première séance de ce type', level: 'normal' };
    const lastRPE = sessions[0].rpe;
    const last2Easy = sessions.length >= 2 && sessions.slice(0, 2).every(s => s.rpe <= 6);
    const last2Hard = sessions.length >= 2 && sessions.slice(0, 2).every(s => s.rpe >= 8);
    if (lastRPE <= 4) return { factor: 1.06, reason: 'RPE ' + lastRPE + ' — trop facile, +6%', level: 'up' };
    if (lastRPE <= 5 || last2Easy) return { factor: lastRPE <= 5 ? 1.04 : 1.03, reason: 'RPE ' + lastRPE + ' — facile, on monte', level: 'up' };
    if (lastRPE >= 6 && lastRPE <= 7) return { factor: 1.02, reason: 'RPE ' + lastRPE + ' — bon, +2%', level: 'normal' };
    if (lastRPE === 8) return { factor: 1.0, reason: 'RPE 8 — on consolide', level: 'hold' };
    if (lastRPE === 9) return { factor: 0.97, reason: 'RPE 9 — trop dur, -3%', level: 'down' };
    if (lastRPE >= 10 || last2Hard) return { factor: 0.93, reason: 'Surcharge — -7%', level: 'down' };
    return { factor: 1, reason: '', level: 'normal' };
  },

  getAdaptReps(baseReps, exerciseType, sessionType) {
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    if (adapt.level === 'up' && adapt.factor >= 1.04) return { reps: baseReps + 1, reason: '+1 rep' };
    if (adapt.level === 'down') return { reps: Math.max(baseReps - 1, 2), reason: '-1 rep' };
    return { reps: baseReps, reason: '' };
  },

  isSameCategory(a, b) {
    const cats = { z2:'easy', long_run:'easy', tempo:'tempo', fartlek:'tempo', fartlek_hyrox:'tempo', intervals_short:'interval', intervals_long:'interval', technique:'easy', endurance:'endurance', power:'intense', racePace:'intense', brick:'intense' };
    return cats[a] === cats[b];
  },

  /* ========== PROGRESSION ========== */
  getProgFactor(weekNum) {
    let total = 0;
    for (let w = 0; w < weekNum; w++) {
      if (this.isDeloadWeek(w)) continue;
      if (w < 8) total += 0.015 / 3;
      else if (w < 16) total += 0.02 / 3;
      else total += 0.01 / 3;
    }
    return 1 + Math.min(total, this.MAX_PROG_PERCENT);
  },

  getErgoProgFactor(weekNum) {
    let total = 0;
    for (let w = 0; w < weekNum; w++) {
      if (this.isDeloadWeek(w)) continue;
      total += 0.01 / 3;
    }
    return 1 - Math.min(total, 0.08);
  },

  getCombinedRunFactor(weekNum, exerciseType, sessionType) {
    const base = this.getProgFactor(weekNum);
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    return { factor: base * adapt.factor, adapt };
  },

  getCombinedErgoFactor(weekNum, exerciseType, sessionType) {
    const base = this.getErgoProgFactor(weekNum);
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    return { factor: base / adapt.factor, adapt };
  },

  /* ========== DÉCHARGE: -30% vol ET -10-15% intensité (expert Q6) ========== */
  isDeloadWeek(weekNum) { return (weekNum + 1) % 4 === 0; },
  getDeloadIntensityFactor() { return 0.88; }, // -12% intensité en décharge

  /* ========== MAX SESSIONS PAR SEMAINE (expert Q10) ========== */
  getMaxSessionsPerWeek(weekNum) {
    if (weekNum < 8) return 4;  // 2 run + 1 row + 1 ski
    if (weekNum < 16) return 5;
    return 6;
  },

  /* ========== ROW TECHNIQUE LOCKOUT (expert Q8) ========== */
  isRowTechniqueOnly(weekNum) { return weekNum < 4; },
  getRowPhaseLabel(weekNum) {
    if (weekNum < 4) return '100% technique (sem ' + (weekNum+1) + '/4)';
    if (weekNum < 8) return '70% technique, 30% endurance';
    return 'Toutes intensités débloquées';
  },

  /* ========== RÉCUP CONDITIONNELLE (expert Q3) ========== */
  getShortIntervalRest(vma) {
    // VMA < 13 → ratio 1:1 (récup = durée effort)
    // VMA >= 13 → 90s fixe
    if (vma < 13) {
      const effortTime = Math.round(400 / (vma * 1000 / 3600));
      return { seconds: effortTime, label: effortTime + 's (ratio 1:1 — VMA < 13)' };
    }
    return { seconds: 90, label: '90s' };
  },

  /* ========== STRATÉGIE PACING HYROX (expert Q13) ========== */
  getPacingStrategy(tempoSpeed) {
    const basePace = 3600 / tempoSpeed;
    return {
      run1: { pace: basePace + 8, label: this.fmtP(basePace + 8) + '/km — ÉCHAUFFEMENT (+8s)', note: 'Ne pars PAS vite. Chauffe-toi sur le Run 1.' },
      run2to7: { pace: basePace, label: this.fmtP(basePace) + '/km — ALLURE CIBLE', note: 'Régulier. Même split à chaque run.' },
      run8: { pace: basePace - 5, label: this.fmtP(basePace - 5) + '/km — FINISH (-5s)', note: 'Tout donner sur le dernier km.' },
    };
  },

  /* ========== SÉANCES RUN ========== */
  generateRunSession(sessionType, zones, weekNum) {
    const z = zones;
    const { factor: pf, adapt } = this.getCombinedRunFactor(weekNum, 'run', sessionType);
    const deload = this.isDeloadWeek(weekNum);
    const vf = deload ? 0.7 : 1;
    const dif = deload ? this.getDeloadIntensityFactor() : 1; // intensité réduite en décharge
    const badge = adapt.level==='up'?' ⬆️':adapt.level==='down'?' ⬇️':adapt.level==='hold'?' ➖':'';
    const note = adapt.reason;

    switch(sessionType) {
      case 'z2': {
        const dur = Math.round((35 + Math.min(weekNum * 2, 25)) * vf);
        return {
          title: 'Run Zone 2' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min à ' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h',
          cooldown: '5 min marche + étirements',
          details: { vitesse: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', pace: this.fmtP(3600/z.z2.max)+'-'+this.fmtP(3600/z.z2.min)+'/km', durée: dur+' min', distance: ((z.z2.min+z.z2.max)/2*dur/60).toFixed(1)+' km', adaptation: note },
          tip: 'Parler en phrases complètes. Essoufflé = trop vite.',
        };
      }
      case 'tempo': {
        const blockDur = Math.round((6 + Math.min(Math.floor(weekNum/2), 4)) * vf);
        const sMin = z.tempo.min * pf * dif, sMax = z.tempo.max * pf * dif;
        return {
          title: 'Run Tempo' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2 + 4 accélérations',
          main: '3 × ' + blockDur + ' min à ' + this.fmtS(sMin) + '-' + this.fmtS(sMax) + ' km/h — Récup: 3 min trot',
          cooldown: '8 min footing + étirements',
          details: { séries: '3 × '+blockDur+' min', vitesse: this.fmtS(sMin)+'-'+this.fmtS(sMax)+' km/h', pace: this.fmtP(3600/sMax)+'-'+this.fmtP(3600/sMin)+'/km', récup: '3 min trot', adaptation: note },
          tip: 'Confortablement difficile.',
        };
      }
      case 'intervals_short': {
        const baseReps = Math.min(6 + Math.floor(weekNum / 2), 12);
        const { reps } = this.getAdaptReps(Math.round(baseReps * vf), 'run', sessionType);
        const tgt = (z.iv_short.min + z.iv_short.max) / 2 * pf * dif;
        const tpr = Math.round(400 / (tgt * 1000 / 3600));
        const rest = this.getShortIntervalRest(z.vma);
        return {
          title: 'Fractionné court ' + reps + '×400m' + badge + (deload ? ' (décharge)' : ''),
          location: weekNum < 4 ? 'gym' : 'outdoor',
          warmup: '10 min footing + 4 lignes droites',
          main: reps + ' × 400m à ' + this.fmtS(tgt) + ' km/h (' + this.fmtP(3600/tgt) + '/km) — Récup: ' + rest.label,
          cooldown: '8 min footing léger',
          details: { séries: reps+'×400m', temps_par_rep: tpr+'s', vitesse: this.fmtS(tgt)+' km/h', pace: this.fmtP(3600/tgt)+'/km', récupération: rest.label, distance_travail: (reps*0.4).toFixed(1)+' km', adaptation: note },
          tip: 'Chaque rep au même temps (±2s).',
        };
      }
      case 'intervals_long': {
        const baseReps = Math.min(3 + Math.floor(weekNum / 3), 6); // cap 6 (expert compromis)
        const { reps } = this.getAdaptReps(Math.round(baseReps * vf), 'run', sessionType);
        const tgt = (z.iv_long.min + z.iv_long.max) / 2 * pf * dif;
        return {
          title: 'Fractionné long ' + reps + '×1000m' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '12 min footing progressif + 3 accélérations',
          main: reps + ' × 1000m à ' + this.fmtS(tgt) + ' km/h (' + this.fmtP(3600/tgt) + '/km) — Récup: 2 min trot',
          cooldown: '10 min footing',
          details: { séries: reps+'×1000m', vitesse: this.fmtS(tgt)+' km/h', pace: this.fmtP(3600/tgt)+'/km', récup: '2 min trot', distance_travail: reps+' km', adaptation: note },
          tip: 'Régularité > vitesse. Même split chaque 1000m.',
        };
      }
      case 'long_run': {
        const dur = Math.round((50 + Math.min(weekNum * 3, 30)) * vf);
        return {
          title: 'Sortie longue ' + dur + 'min' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min à ' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h. Derniers 10 min: ' + this.fmtS(z.tempo.min*pf*dif) + ' km/h',
          cooldown: '5 min marche + étirements',
          details: { durée: dur+' min', vitesse: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', finish: this.fmtS(z.tempo.min*pf*dif)+' km/h (10 dern. min)', distance: ((z.z2.min+z.z2.max)/2*dur/60).toFixed(1)+' km', adaptation: note },
          tip: 'LA séance qui construit ton moteur aérobie.',
        };
      }
      case 'fartlek': {
        const dur = Math.round((30 + Math.min(weekNum * 2, 15)) * vf);
        return {
          title: 'Fartlek classique' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2',
          main: dur + ' min: 1 min rapide (' + this.fmtS(z.seuil.min*pf*dif) + '-' + this.fmtS(z.seuil.max*pf*dif) + ' km/h) / 2 min Z2. Non structuré.',
          cooldown: '8 min footing',
          details: { durée: dur+' min', blocs: '~'+Math.round(dur/3)+'×1 min rapide', vitesse_rapide: this.fmtS(z.seuil.min*pf*dif)+'-'+this.fmtS(z.seuil.max*pf*dif)+' km/h', vitesse_récup: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', adaptation: note },
          tip: 'Écoute ton corps. Accélère quand tu le sens.',
        };
      }
      case 'fartlek_hyrox': {
        const dur = Math.round((25 + Math.min(weekNum * 2, 15)) * vf);
        const sprintSpeed = z.iv_short.min * pf * dif;
        return {
          title: 'Fartlek Hyrox 🔥' + badge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2',
          main: dur + ' min: 30s à ' + this.fmtS(sprintSpeed) + ' km/h (105% VMA) / 90s Z2. Simule redémarrage post-station.',
          cooldown: '8 min footing',
          details: { durée: dur+' min', blocs: '~'+Math.round(dur/2)+'×30s sprint', vitesse_sprint: this.fmtS(sprintSpeed)+' km/h', vitesse_récup: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', format: '30s sprint / 90s Z2', adaptation: note },
          tip: 'Simule les 200 premiers mètres post-station en Hyrox. Relance explosive puis stabilise.',
        };
      }
      case 'brick': {
        if (weekNum < 8) return { title: 'Brick — disponible sem 9+', main: 'Pas encore débloqué. Continue la base.', details: { raison: 'Trop intense avant sem 8' }, tip: 'Patience — on construit la base d\'abord.' };
        const rounds = Math.round(Math.min(3 + Math.floor((weekNum-8)/4), 5) * vf);
        const runSpeed = z.tempo.min * pf * dif;
        return {
          title: 'Brick Ergo+Run ' + rounds + ' rounds 🧱' + badge + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '8 min footing + 2 min row facile',
          main: rounds + ' rounds: 500m row allure endurance + 1km run à ' + this.fmtS(runSpeed) + ' km/h — Récup: 60s transition',
          cooldown: '5 min marche',
          details: { rounds: rounds, row: '500m allure endurance', run: '1km à '+this.fmtS(runSpeed)+' km/h', récup: '60s (comme en course)', durée_estimée: Math.round(rounds*7)+' min', adaptation: note },
          tip: 'Enchaîne le run IMMÉDIATEMENT après l\'ergo. C\'est là que tu gagnes du temps en Hyrox.',
        };
      }
      default: return { title: 'Test Run 1km', location:'outdoor', warmup:'10 min footing + 4 acc', main:'1km le plus vite possible.', cooldown:'8 min trot', details:{ objectif:'Calibre toutes tes zones' }, tip:'Pars à un rythme tenable 5 min.' };
    }
  },

  /* ========== SÉANCES ERGO (avec lockout technique) ========== */
  generateErgoSession(sessionType, zones, type, weekNum) {
    const z = zones, name = type==='row'?'Row':'SkiErg';
    const { factor: epf, adapt } = this.getCombinedErgoFactor(weekNum, type, sessionType);
    const deload = this.isDeloadWeek(weekNum);
    const vf = deload ? 0.7 : 1;
    const dif = deload ? this.getDeloadIntensityFactor() : 1;
    const badge = adapt.level==='up'?' ⬆️':adapt.level==='down'?' ⬇️':adapt.level==='hold'?' ➖':'';

    // Row technique lockout (expert Q8)
    if (type === 'row' && this.isRowTechniqueOnly(weekNum) && sessionType !== 'technique' && sessionType !== 'test') {
      return {
        title: name + ' — Technique obligatoire' + badge,
        location: 'gym', warmup: '3 min facile',
        main: '4 × 500m à ' + this.fmtP(z.technique.pace500 * epf) + '/500m — Cadence: 20-22 cps/min — Récup: 90s',
        cooldown: '2 min facile',
        details: { phase: this.getRowPhaseLabel(weekNum), séries: '4×500m', pace: this.fmtP(z.technique.pace500*epf)+'/500m', cadence: '20-22 cps/min (CATCH + DRIVE)', récup: '90s' },
        tip: '⚠️ Row intensité bloquée les 4 premières semaines. Focus: jambes d\'abord (60%), dos, bras en dernier. Gagner 30-45s au 1000m juste avec la technique.',
      };
    }

    switch(sessionType) {
      case 'technique': {
        const p = z.technique.pace500 * epf * (1/dif);
        const sets = Math.round(4 * vf);
        const cadence = weekNum < 4 ? '20-22' : (type==='row'?'22-24':'28-30');
        return {
          title: name+' Technique'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min facile',
          main: sets+' × 500m à '+this.fmtP(p)+'/500m — Cadence: '+cadence+' cps/min — Récup: 90s',
          cooldown:'2 min facile',
          details: { phase: this.getRowPhaseLabel(weekNum), séries:sets+'×500m', pace:this.fmtP(p)+'/500m', cadence:cadence+' cps/min', récup:'90s', total:(sets*0.5).toFixed(1)+' km', adaptation:adapt.reason },
          tip: type==='row'?'JAMBES d\'abord (60%), dos, bras en dernier. Catch propre.':'Tirage long, abdos engagés.',
        };
      }
      case 'endurance': {
        const baseReps = Math.min(3+Math.floor(weekNum/3),5);
        const { reps } = this.getAdaptReps(Math.round(baseReps*vf), type, sessionType);
        const p = z.endurance.pace500 * epf * (1/dif);
        return {
          title: name+' Endurance '+reps+'×1000m'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif',
          main: reps+' × 1000m à '+this.fmtP(p)+'/500m — Récup: 90s',
          cooldown:'2 min facile',
          details: { séries:reps+'×1000m', pace:this.fmtP(p)+'/500m', temps_par_1000m:this.fmtP(p*2), récup:'90s', total:reps+' km', adaptation:adapt.reason },
          tip: 'Dernier 1000m +5s = trop intense. Réduis la prochaine fois.',
        };
      }
      case 'racePace': {
        if (weekNum < 8) return { title: name+' Race Pace — dispo sem 9+', main:'Continue technique + endurance.', details:{ raison:'Trop intense avant sem 8 (expert)' }, tip:'Patience.' };
        const reps = Math.round(Math.min(3+Math.floor((weekNum-8)/4),4)*vf);
        const p = z.racePace.pace500 * epf * (1/dif);
        return {
          title: name+' Race Pace 🏁'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif',
          main: reps+' × 1000m à '+this.fmtP(p)+'/500m — Récup: 60s',
          cooldown:'3 min facile',
          details: { séries:reps+'×1000m', pace:this.fmtP(p)+'/500m', récup:'60s (comme en course)', durée:Math.round(reps*5)+' min', adaptation:adapt.reason },
          tip: 'Allure course. Chaque rep identique.',
        };
      }
      case 'power': {
        if (weekNum < 8) return this.generateErgoSession('technique', zones, type, weekNum);
        const baseReps = Math.min(6+Math.floor(weekNum/2),10);
        const { reps } = this.getAdaptReps(Math.round(baseReps*vf), type, sessionType);
        const p = z.power.pace500 * epf * (1/dif);
        return {
          title: name+' Puissance '+reps+'×250m'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif + 2×10 coups rapides',
          main: reps+' × 250m à '+this.fmtP(p)+'/500m — Récup: 2 min',
          cooldown:'3 min facile',
          details: { séries:reps+'×250m', pace:this.fmtP(p)+'/500m', récup:'2 min', total:(reps*0.25).toFixed(1)+' km', adaptation:adapt.reason },
          tip: 'Explosif mais contrôlé. Même pace ±1s.',
        };
      }
      default: return { title:'Test '+name+' 1000m', location:'gym', warmup:'3 min progressif', main:'1000m le plus vite possible.', cooldown:'3 min facile', details:{objectif:'Calibre tes zones '+name}, tip:'Pace régulier.' };
    }
  },

  /* ========== SAUVEGARDE ========== */
  saveTestResults(runSpeedKmh, rowTimeSec, skiTimeSec, testType) {
    const data = {
      run: { speedKmh: runSpeedKmh, vma: Math.round(runSpeedKmh * this.VMA_CORRECTION * 10) / 10, testType: testType || '1km', date: new Date().toISOString() },
      row: { time1000: rowTimeSec, date: new Date().toISOString() },
      ski: { time1000: skiTimeSec, date: new Date().toISOString() },
    };
    localStorage.setItem('hf_tests', JSON.stringify(data));
    return data;
  },

  /* Demi-Cooper: distance en mètres / 100 = VMA (expert Q1) */
  demiCooperToVMA(distanceMeters) {
    return Math.round(distanceMeters / 100 * 10) / 10;
  },

  getTestResults() { try { return JSON.parse(localStorage.getItem('hf_tests')); } catch { return null; } },
  hasTests() { return this.getTestResults() !== null; },
  getZonesSummary() {
    const t = this.getTestResults(); if (!t) return null;
    return { run: this.getRunZones(t.run.speedKmh), row: this.getErgoZones(t.row.time1000), ski: this.getErgoZones(t.ski.time1000) };
  },
  getCurrentWeek() {
    const t = this.getTestResults(); if (!t) return 0;
    return Math.floor((new Date() - new Date(t.run.date)) / (7*24*60*60*1000));
  },
  canUseVest(weekNum, runScore, pain) {
    if (weekNum < 8) return { allowed:false, reason:'Min 8 sem (sem '+(weekNum+1)+'/8)' };
    if (runScore < 60) return { allowed:false, reason:'Score run '+runScore+' < 60' };
    if (pain > 2) return { allowed:false, reason:'Douleur tendon '+pain+'/10' };
    const maxKg = weekNum<12?5:Math.min(5+Math.floor((weekNum-12)/2),10);
    return { allowed:true, maxKg, mode:weekNum<12?'Marche/rando uniquement':'Z2 run OK' };
  },

  fmtS(s) { return Math.round(s * 10) / 10; },
  fmtP(sec) { const m=Math.floor(sec/60),s=Math.round(sec%60); return m+':'+String(s).padStart(2,'0'); },
  parseTime(minStr, secStr) { return (parseInt(minStr)||0)*60 + (parseInt(secStr)||0); },
};
