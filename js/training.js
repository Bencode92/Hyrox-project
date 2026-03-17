/* HyroxForge — Training Engine v3 — ADAPTATIF
   Le plan s'ajuste en temps réel selon tes résultats.
   Si trop facile → monte. Si dur → consolide. Si raté → redescend.
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

  /* ========== ADAPTATION DYNAMIQUE ==========
     Analyse les dernières séances du même type pour ajuster
     Retourne un multiplicateur: >1 = plus dur, <1 = plus facile, 1 = pareil
  */
  getAdaptFactor(exerciseType, sessionType) {
    const sessions = Storage.getSessionsByType(exerciseType)
      .filter(s => s.sessionType === sessionType || this.isSameCategory(s.sessionType, sessionType))
      .slice(0, 3); // 3 dernières du même type

    if (sessions.length === 0) return { factor: 1, reason: 'Première séance de ce type', level: 'normal' };

    const lastRPE = sessions[0].rpe;
    const avgRPE = sessions.reduce((a, s) => a + s.rpe, 0) / sessions.length;
    const last3AllEasy = sessions.length >= 2 && sessions.slice(0, 2).every(s => s.rpe <= 6);
    const last3AllHard = sessions.length >= 2 && sessions.slice(0, 2).every(s => s.rpe >= 8);

    // Cas 1: Trop facile (RPE ≤ 5 ou 2+ séances ≤ 6) → ON MONTE
    if (lastRPE <= 5 || last3AllEasy) {
      const boost = lastRPE <= 4 ? 1.06 : lastRPE <= 5 ? 1.04 : 1.03;
      return { factor: boost, reason: 'RPE ' + lastRPE + '/10 — trop facile, on augmente ' + Math.round((boost-1)*100) + '%', level: 'up' };
    }

    // Cas 2: Bien calé (RPE 6-7) → légère progression
    if (lastRPE >= 6 && lastRPE <= 7) {
      return { factor: 1.02, reason: 'RPE ' + lastRPE + '/10 — bon niveau, +2%', level: 'normal' };
    }

    // Cas 3: Dur mais passé (RPE 8) → on consolide
    if (lastRPE === 8) {
      return { factor: 1.0, reason: 'RPE 8/10 — séance dure, on consolide au même niveau', level: 'hold' };
    }

    // Cas 4: Très dur (RPE 9) → on baisse légèrement
    if (lastRPE === 9) {
      return { factor: 0.97, reason: 'RPE 9/10 — très dur, on réduit de 3%', level: 'down' };
    }

    // Cas 5: Épuisement (RPE 10) ou 3 séances dures → on baisse fort
    if (lastRPE >= 10 || last3AllHard) {
      return { factor: 0.93, reason: 'Surcharge détectée — on réduit de 7%', level: 'down' };
    }

    return { factor: 1, reason: 'Normal', level: 'normal' };
  },

  /* Reps adaptation */
  getAdaptReps(baseReps, exerciseType, sessionType) {
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    if (adapt.level === 'up' && adapt.factor >= 1.04) return { reps: baseReps + 1, reason: '+1 rep (trop facile)' };
    if (adapt.level === 'down') return { reps: Math.max(baseReps - 1, 2), reason: '-1 rep (récup)' };
    return { reps: baseReps, reason: '' };
  },

  isSameCategory(a, b) {
    const cats = { z2: 'easy', long_run: 'easy', tempo: 'tempo', fartlek: 'tempo', intervals_short: 'interval', intervals_long: 'interval', technique: 'easy', endurance: 'endurance', power: 'intense', racePace: 'intense' };
    return cats[a] === cats[b];
  },

  /* ========== PROGRESSION (base + coach rules) ========== */
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

  /* ========== COMBINED FACTOR = base prog × adaptation ========== */
  getCombinedRunFactor(weekNum, exerciseType, sessionType) {
    const base = this.getProgFactor(weekNum);
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    return { factor: base * adapt.factor, adapt };
  },

  getCombinedErgoFactor(weekNum, exerciseType, sessionType) {
    const base = this.getErgoProgFactor(weekNum);
    const adapt = this.getAdaptFactor(exerciseType, sessionType);
    return { factor: base / adapt.factor, adapt }; // ergo: lower pace = faster
  },

  /* ========== DÉCHARGE ========== */
  isDeloadWeek(weekNum) { return (weekNum + 1) % 4 === 0; },

  /* ========== SÉANCES RUN ========== */
  generateRunSession(sessionType, zones, weekNum) {
    const z = zones;
    const { factor: pf, adapt } = this.getCombinedRunFactor(weekNum, 'run', sessionType);
    const deload = this.isDeloadWeek(weekNum);
    const vf = deload ? 0.7 : 1;
    const adaptBadge = adapt.level === 'up' ? ' \u2b06\ufe0f' : adapt.level === 'down' ? ' \u2b07\ufe0f' : adapt.level === 'hold' ? ' \u2796' : '';
    const adaptNote = adapt.reason;

    switch(sessionType) {
      case 'z2': {
        const dur = Math.round((35 + Math.min(weekNum * 2, 25)) * vf);
        return {
          title: 'Run Zone 2' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min \u00e0 ' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h',
          cooldown: '5 min marche + étirements',
          details: { vitesse: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', pace: this.fmtP(3600/z.z2.max)+'-'+this.fmtP(3600/z.z2.min)+'/km', durée: dur+' min', distance: ((z.z2.min+z.z2.max)/2*dur/60).toFixed(1)+' km', adaptation: adaptNote },
          tip: 'Parler en phrases complètes. Si essoufflé, RALENTIS.',
        };
      }
      case 'tempo': {
        const blockDur = Math.round((6 + Math.min(Math.floor(weekNum/2), 4)) * vf);
        const sMin = z.tempo.min * pf, sMax = z.tempo.max * pf;
        return {
          title: 'Run Tempo' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2 + 4 accélérations',
          main: '3 \u00d7 ' + blockDur + ' min \u00e0 ' + this.fmtS(sMin) + '-' + this.fmtS(sMax) + ' km/h \u2014 Récup: 3 min trot',
          cooldown: '8 min footing + étirements',
          details: { séries: '3 \u00d7 '+blockDur+' min', vitesse: this.fmtS(sMin)+'-'+this.fmtS(sMax)+' km/h', pace: this.fmtP(3600/sMax)+'-'+this.fmtP(3600/sMin)+'/km', récup: '3 min trot', adaptation: adaptNote },
          tip: 'Confortablement difficile. Quelques mots possibles, pas une phrase.',
        };
      }
      case 'intervals_short': {
        const baseReps = Math.min(6 + Math.floor(weekNum / 2), 12);
        const { reps } = this.getAdaptReps(Math.round(baseReps * vf), 'run', sessionType);
        const tgt = (z.iv_short.min + z.iv_short.max) / 2 * pf;
        const tpr = Math.round(400 / (tgt * 1000 / 3600));
        return {
          title: 'Fractionné court ' + reps + '\u00d7400m' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: weekNum < 4 ? 'gym' : 'outdoor',
          warmup: '10 min footing + 4 lignes droites',
          main: reps + ' \u00d7 400m \u00e0 ' + this.fmtS(tgt) + ' km/h (' + this.fmtP(3600/tgt) + '/km) \u2014 Récup: 90s',
          cooldown: '8 min footing léger',
          details: { séries: reps+'\u00d7400m', temps_par_rep: tpr+'s', vitesse: this.fmtS(tgt)+' km/h', pace: this.fmtP(3600/tgt)+'/km', récup: '90s CONSTANT', distance_travail: (reps*0.4).toFixed(1)+' km', adaptation: adaptNote },
          tip: 'Chaque rep au même temps (\u00b12s). Dernier 5s+ plus lent = parti trop vite.',
        };
      }
      case 'intervals_long': {
        const baseReps = Math.min(3 + Math.floor(weekNum / 3), 5);
        const { reps } = this.getAdaptReps(Math.round(baseReps * vf), 'run', sessionType);
        const tgt = (z.iv_long.min + z.iv_long.max) / 2 * pf;
        return {
          title: 'Fractionné long ' + reps + '\u00d71000m' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '12 min footing progressif + 3 accélérations',
          main: reps + ' \u00d7 1000m \u00e0 ' + this.fmtS(tgt) + ' km/h (' + this.fmtP(3600/tgt) + '/km) \u2014 Récup: 2 min trot',
          cooldown: '10 min footing',
          details: { séries: reps+'\u00d71000m', vitesse: this.fmtS(tgt)+' km/h', pace: this.fmtP(3600/tgt)+'/km', récup: '2 min trot', distance_travail: reps+' km', adaptation: adaptNote },
          tip: 'Régularité > vitesse. Même split sur chaque 1000m.',
        };
      }
      case 'long_run': {
        const dur = Math.round((50 + Math.min(weekNum * 3, 30)) * vf);
        return {
          title: 'Sortie longue ' + dur + 'min' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min \u00e0 ' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h. Derniers 10 min: ' + this.fmtS(z.tempo.min*pf) + ' km/h',
          cooldown: '5 min marche + étirements longs',
          details: { durée: dur+' min', vitesse: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', finish: this.fmtS(z.tempo.min*pf)+' km/h (10 dern. min)', distance: ((z.z2.min+z.z2.max)/2*dur/60).toFixed(1)+' km', adaptation: adaptNote },
          tip: 'Hydrate-toi avant. C\'est LA séance qui construit ton moteur.',
        };
      }
      case 'fartlek': {
        const dur = Math.round((30 + Math.min(weekNum * 2, 15)) * vf);
        return {
          title: 'Fartlek' + adaptBadge + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2',
          main: dur + ' min: 1 min rapide (' + this.fmtS(z.seuil.min*pf) + '-' + this.fmtS(z.seuil.max*pf) + ' km/h) / 2 min Z2. Non structuré.',
          cooldown: '8 min footing',
          details: { durée: dur+' min', blocs: '~'+Math.round(dur/3)+'\u00d71 min rapide', vitesse_rapide: this.fmtS(z.seuil.min*pf)+'-'+this.fmtS(z.seuil.max*pf)+' km/h', vitesse_récup: this.fmtS(z.z2.min)+'-'+this.fmtS(z.z2.max)+' km/h', adaptation: adaptNote },
          tip: 'En Hyrox tu ne cours jamais \u00e0 pace constant. Le fartlek prépare aux relances.',
        };
      }
      default: return { title: 'Test Run 1km', location:'outdoor', warmup:'10 min footing + 4 acc', main:'1km le plus vite possible.', cooldown:'8 min trot', details:{ objectif:'Calibre toutes tes zones' }, tip:'Pars \u00e0 un rythme tenable 5 min.' };
    }
  },

  /* ========== SÉANCES ERGO ========== */
  generateErgoSession(sessionType, zones, type, weekNum) {
    const z = zones, name = type==='row'?'Row':'SkiErg';
    const { factor: epf, adapt } = this.getCombinedErgoFactor(weekNum, type, sessionType);
    const deload = this.isDeloadWeek(weekNum);
    const vf = deload ? 0.7 : 1;
    const badge = adapt.level==='up'?' \u2b06\ufe0f':adapt.level==='down'?' \u2b07\ufe0f':adapt.level==='hold'?' \u2796':'';

    switch(sessionType) {
      case 'technique': {
        const p = z.technique.pace500 * epf;
        const sets = Math.round(4 * vf);
        return {
          title: name+' Technique'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min facile',
          main: sets+' \u00d7 500m \u00e0 '+this.fmtP(p)+'/500m \u2014 Cadence: '+(type==='row'?'22-24':'28-30')+' \u2014 Récup: 90s',
          cooldown:'2 min facile',
          details: { séries:sets+'\u00d7500m', pace:this.fmtP(p)+'/500m', cadence:type==='row'?'22-24 cps/min':'28-30 cps/min', récup:'90s', total:(sets*0.5).toFixed(1)+' km', adaptation:adapt.reason },
          tip: type==='row'?'JAMBES d\'abord (60%), dos, bras en dernier.':'Tirage long, abdos engagés.',
        };
      }
      case 'endurance': {
        const baseReps = Math.min(3+Math.floor(weekNum/3),5);
        const { reps } = this.getAdaptReps(Math.round(baseReps*vf), type, sessionType);
        const p = z.endurance.pace500 * epf;
        return {
          title: name+' Endurance '+reps+'\u00d71000m'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif',
          main: reps+' \u00d7 1000m \u00e0 '+this.fmtP(p)+'/500m \u2014 Récup: 90s',
          cooldown:'2 min facile',
          details: { séries:reps+'\u00d71000m', pace:this.fmtP(p)+'/500m', temps_par_1000m:this.fmtP(p*2), récup:'90s', total:reps+' km', adaptation:adapt.reason },
          tip: 'Si le dernier 1000m dérape de +5s, réduis la prochaine fois.',
        };
      }
      case 'racePace': {
        const reps = Math.round(Math.min(3+Math.floor(weekNum/4),4)*vf);
        const p = z.racePace.pace500 * epf;
        return {
          title: name+' Race Pace \ud83c\udfc1'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif',
          main: reps+' \u00d7 1000m \u00e0 '+this.fmtP(p)+'/500m \u2014 Récup: 60s',
          cooldown:'3 min facile',
          details: { séries:reps+'\u00d71000m', pace_course:this.fmtP(p)+'/500m', récup:'60s (comme en course)', durée:Math.round(reps*5)+' min', adaptation:adapt.reason },
          tip: 'Simule l\'allure Hyrox. Chaque rep identique.',
        };
      }
      case 'power': {
        const baseReps = Math.min(6+Math.floor(weekNum/2),10);
        const { reps } = this.getAdaptReps(Math.round(baseReps*vf), type, sessionType);
        const p = z.power.pace500 * epf;
        return {
          title: name+' Puissance '+reps+'\u00d7250m'+badge+(deload?' (décharge)':''),
          location:'gym', warmup:'3 min progressif + 2\u00d710 coups rapides',
          main: reps+' \u00d7 250m \u00e0 '+this.fmtP(p)+'/500m \u2014 Récup: 2 min',
          cooldown:'3 min facile',
          details: { séries:reps+'\u00d7250m', pace:this.fmtP(p)+'/500m', récup:'2 min', total:(reps*0.25).toFixed(1)+' km', adaptation:adapt.reason },
          tip: 'Explosif mais contr\u00f4lé. Même pace \u00b11s chaque rep.',
        };
      }
      default: return { title:'Test '+name+' 1000m', location:'gym', warmup:'3 min progressif', main:'1000m le plus vite possible.', cooldown:'3 min facile', details:{objectif:'Calibre tes zones '+name}, tip:'Pace régulier, pas trop vite au début.' };
    }
  },

  /* ========== SAUVEGARDE ========== */
  saveTestResults(runSpeedKmh, rowTimeSec, skiTimeSec) {
    const data = {
      run: { speedKmh: runSpeedKmh, vma: Math.round(runSpeedKmh * this.VMA_CORRECTION * 10) / 10, date: new Date().toISOString() },
      row: { time1000: rowTimeSec, date: new Date().toISOString() },
      ski: { time1000: skiTimeSec, date: new Date().toISOString() },
    };
    localStorage.setItem('hf_tests', JSON.stringify(data));
    return data;
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
    if (weekNum < 8) return { allowed:false, reason:'Min 8 sem (sem '+weekNum+'/8)' };
    if (runScore < 60) return { allowed:false, reason:'Score run '+runScore+' < 60' };
    if (pain > 2) return { allowed:false, reason:'Douleur tendon '+pain+'/10' };
    const maxKg = weekNum<12?5:Math.min(5+Math.floor((weekNum-12)/2),10);
    return { allowed:true, maxKg, mode:weekNum<12?'Marche/rando uniquement':'Z2 run OK' };
  },

  fmtS(s) { return Math.round(s * 10) / 10; },
  fmtP(sec) { const m=Math.floor(sec/60),s=Math.round(sec%60); return m+':'+String(s).padStart(2,'0'); },
  parseTime(minStr, secStr) { return (parseInt(minStr)||0)*60 + (parseInt(secStr)||0); },
};
