/* HyroxForge — Training Engine v2
   Ajusté selon retour coach:
   - VMA = test 1km × 0.95 (correction surestimation)
   - Progression dégressive (1.5% → 2% → 1%)
   - Plafond +12% sans retest
   - Décharge 3+1 implémentée
   - Récup 90s constant (pas 75s)
   - Cap fractionné long 5×1000m
   - Séances combo Hyrox + fartlek
   - Race pace ergo
   - Gilet lesté: min 8 semaines explicite
*/

const Training = {

  VMA_CORRECTION: 0.95, // test 1km surestime VMA de 3-8%
  MAX_PROG_PERCENT: 0.12, // jamais +12% sans retest

  /* ========== ZONES RUN (VMA corrigée) ========== */
  getRunZones(testSpeedKmh) {
    const vma = testSpeedKmh * this.VMA_CORRECTION;
    return {
      vma: Math.round(vma * 10) / 10,
      testRaw: testSpeedKmh,
      z2:       { min: vma*0.65, max: vma*0.75, label: 'Zone 2 (endurance)' },
      tempo:    { min: vma*0.80, max: vma*0.85, label: 'Tempo (allure Hyrox)' },
      seuil:    { min: vma*0.85, max: vma*0.90, label: 'Seuil' },
      iv_long:  { min: vma*0.90, max: vma*0.95, label: 'Fractionné long' },
      iv_short: { min: vma*0.95, max: vma*1.05, label: 'Fractionné court' },
    };
  },

  /* ========== ZONES ERGO (ROW/SKI) + race pace ========== */
  getErgoZones(test1000mSec) {
    const p5 = test1000mSec / 2;
    return {
      testPace500: p5,
      test1000: test1000mSec,
      technique:  { pace500: p5 * 1.20, label: 'Technique (80%)' },
      endurance:  { pace500: p5 * 1.12, label: 'Endurance (88%)' },
      racePace:   { pace500: p5 * 1.06, label: 'Race pace (94%)' },
      power:      { pace500: p5 * 1.02, label: 'Puissance (98%)' },
    };
  },

  /* ========== PROGRESSION DÉGRESSIVE (coach) ========== 
     S1-8:  +1.5% / 3 sem
     S9-16: +2.0% / 3 sem  
     S17-24: +1.0% / 3 sem
     Plafond: +12% max sans retest
  */
  getProgFactor(weekNum) {
    let total = 0;
    for (let w = 0; w < weekNum; w++) {
      if (this.isDeloadWeek(w)) continue; // pas de prog en décharge
      const cycle = Math.floor(w / 3);
      if (w < 8) total += 0.015 / 3;       // +1.5% par cycle de 3 sem
      else if (w < 16) total += 0.02 / 3;   // +2%
      else total += 0.01 / 3;               // +1%
    }
    return 1 + Math.min(total, this.MAX_PROG_PERCENT);
  },

  getErgoProgFactor(weekNum) {
    // Ergo: plus conservateur (coach validé)
    let total = 0;
    for (let w = 0; w < weekNum; w++) {
      if (this.isDeloadWeek(w)) continue;
      total += 0.01 / 3; // -1% pace par cycle de 3 sem
    }
    return 1 - Math.min(total, 0.08);
  },

  /* ========== DÉCHARGE 3+1 ========== */
  isDeloadWeek(weekNum) {
    return (weekNum + 1) % 4 === 0; // sem 4, 8, 12, 16, 20, 24
  },

  getDeloadLabel(weekNum) {
    if (this.isDeloadWeek(weekNum)) return ' ⚡ SEMAINE DE DÉCHARGE (-30% volume)';
    const weeksToDeload = 3 - (weekNum % 4);
    return weeksToDeload === 0 ? '' : '';
  },

  /* ========== SÉANCES RUN ========== */
  generateRunSession(sessionType, zones, weekNum) {
    const z = zones;
    const pf = this.getProgFactor(weekNum);
    const deload = this.isDeloadWeek(weekNum);
    const volFactor = deload ? 0.7 : 1; // -30% en décharge

    switch(sessionType) {
      case 'z2': {
        const baseDur = 35 + Math.min(weekNum * 2, 25);
        const dur = Math.round(baseDur * volFactor);
        return {
          title: 'Run Zone 2 — Endurance' + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min à allure confortable',
          cooldown: '5 min marche + étirements',
          details: {
            vitesse_cible: this.fmtS(z.z2.min) + ' - ' + this.fmtS(z.z2.max) + ' km/h',
            pace_cible: this.fmtP(3600/z.z2.max) + ' - ' + this.fmtP(3600/z.z2.min) + ' /km',
            durée: dur + ' min',
            distance_estimée: ((z.z2.min+z.z2.max)/2 * dur/60).toFixed(1) + ' km',
          },
          tip: 'Tu dois pouvoir parler en phrases complètes. Si tu es essoufflé, RALENTIS.',
        };
      }

      case 'tempo': {
        const baseBlocks = 3;
        const blockDur = Math.round((6 + Math.min(Math.floor(weekNum/2), 4)) * volFactor);
        const sMin = z.tempo.min * pf, sMax = z.tempo.max * pf;
        return {
          title: 'Run Tempo — Allure Hyrox' + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing léger (' + this.fmtS(z.z2.min) + ' km/h) + 4 accélérations progressives',
          main: baseBlocks + ' × ' + blockDur + ' min à ' + this.fmtS(sMin) + '-' + this.fmtS(sMax) + ' km/h — Récup: 3 min trot',
          cooldown: '8 min footing léger + étirements',
          details: {
            séries: baseBlocks + ' × ' + blockDur + ' min',
            vitesse_cible: this.fmtS(sMin) + ' - ' + this.fmtS(sMax) + ' km/h',
            pace_cible: this.fmtP(3600/sMax) + ' - ' + this.fmtP(3600/sMin) + ' /km',
            récupération: '3 min trot léger',
          },
          tip: 'Allure « confortablement difficile ». Quelques mots possibles, pas une phrase.',
        };
      }

      case 'intervals_short': {
        const baseReps = 6 + Math.floor(weekNum / 2);
        const reps = Math.round(Math.min(baseReps, 12) * volFactor);
        const dist = 400;
        const tgtSpeed = (z.iv_short.min + z.iv_short.max) / 2 * pf;
        const timePerRep = Math.round(dist / (tgtSpeed * 1000 / 3600));
        return {
          title: 'Fractionné court — ' + reps + '×' + dist + 'm' + (deload ? ' (décharge)' : ''),
          location: weekNum < 4 ? 'gym' : 'outdoor',
          warmup: '10 min footing + 4 lignes droites accélérées',
          main: reps + ' × ' + dist + 'm à ' + this.fmtS(tgtSpeed) + ' km/h (' + this.fmtP(3600/tgtSpeed) + '/km) — Récup: 90s marche/trot',
          cooldown: '8 min footing très léger',
          details: {
            séries: reps + ' × ' + dist + 'm',
            temps_par_rep: timePerRep + 's',
            vitesse_cible: this.fmtS(tgtSpeed) + ' km/h',
            pace_cible: this.fmtP(3600/tgtSpeed) + ' /km',
            récupération: '90s marche/trot (CONSTANT — ne pas réduire)',
            distance_travail: ((reps*dist)/1000).toFixed(1) + ' km',
          },
          tip: 'Chaque rep doit être au même temps (±2s). Si le dernier est 5s+ plus lent, tu es parti trop vite.',
        };
      }

      case 'intervals_long': {
        const baseReps = 3 + Math.floor(weekNum / 3);
        const reps = Math.round(Math.min(baseReps, 5) * volFactor); // cap 5 (coach)
        const tgtSpeed = (z.iv_long.min + z.iv_long.max) / 2 * pf;
        const timePerRep = Math.round(1000 / (tgtSpeed * 1000 / 3600));
        return {
          title: 'Fractionné long — ' + reps + '×1000m' + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '12 min footing progressif + 3 accélérations',
          main: reps + ' × 1000m à ' + this.fmtS(tgtSpeed) + ' km/h (' + this.fmtP(3600/tgtSpeed) + '/km) — Récup: 2 min trot',
          cooldown: '10 min footing léger',
          details: {
            séries: reps + ' × 1000m',
            temps_par_1000m: this.fmtP(timePerRep),
            vitesse_cible: this.fmtS(tgtSpeed) + ' km/h',
            pace_cible: this.fmtP(3600/tgtSpeed) + ' /km',
            récupération: '2 min trot léger',
            distance_travail: reps + ' km',
          },
          tip: 'Régularité > vitesse. Vise le même split sur chaque 1000m.',
        };
      }

      case 'long_run': {
        const baseDur = 50 + Math.min(weekNum * 3, 30);
        const dur = Math.round(baseDur * volFactor);
        return {
          title: 'Sortie longue — ' + dur + ' min' + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: dur + ' min à ' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h. Derniers 10 min: accélérer à ' + this.fmtS(z.tempo.min) + ' km/h',
          cooldown: '5 min marche + étirements longs',
          details: {
            durée: dur + ' min',
            vitesse_croisière: this.fmtS(z.z2.min) + ' - ' + this.fmtS(z.z2.max) + ' km/h',
            finish: this.fmtS(z.tempo.min) + ' km/h (10 dernières min)',
            distance_estimée: ((z.z2.min+z.z2.max)/2 * dur/60).toFixed(1) + ' km',
          },
          tip: 'Hydrate-toi avant. C\'est LA séance qui construit ton moteur aérobie.',
        };
      }

      case 'fartlek': {
        const dur = Math.round((30 + Math.min(weekNum * 2, 15)) * volFactor);
        return {
          title: 'Fartlek — Variation d\'allure' + (deload ? ' (décharge)' : ''),
          location: 'outdoor',
          warmup: '10 min footing Z2',
          main: dur + ' min en alternant: 1 min rapide (' + this.fmtS(z.seuil.min*pf) + '-' + this.fmtS(z.seuil.max*pf) + ' km/h) / 2 min Z2 (' + this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h). Non structuré: écoute ton corps.',
          cooldown: '8 min footing léger',
          details: {
            durée_totale: dur + ' min',
            blocs_rapides: '~' + Math.round(dur/3) + ' × 1 min',
            vitesse_rapide: this.fmtS(z.seuil.min*pf) + '-' + this.fmtS(z.seuil.max*pf) + ' km/h',
            vitesse_récup: this.fmtS(z.z2.min) + '-' + this.fmtS(z.z2.max) + ' km/h',
          },
          tip: 'En Hyrox tu ne cours jamais à pace constant — tu sors d\'une station avec les jambes lourdes et tu relances. Le fartlek prépare exactement à ça.',
        };
      }

      case 'combo_hyrox': {
        const rounds = Math.round(Math.min(3 + Math.floor(weekNum/4), 6) * volFactor);
        return {
          title: 'Combo Hyrox — ' + rounds + ' rounds station+run' + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '8 min footing + 2 min row facile',
          main: rounds + ' rounds de: 1km run à ' + this.fmtS(z.tempo.min*pf) + '-' + this.fmtS(z.tempo.max*pf) + ' km/h + 500m row à ' + this.fmtP(this.getErgoZones(270).endurance.pace500) + '/500m — Récup: 90s entre rounds',
          cooldown: '5 min marche + étirements',
          details: {
            rounds: rounds,
            run: '1 km à ' + this.fmtS(z.tempo.min*pf) + '-' + this.fmtS(z.tempo.max*pf) + ' km/h',
            row: '500m à allure endurance',
            récupération: '90s entre rounds',
            durée_estimée: Math.round(rounds * 8) + ' min (hors échauff)',
          },
          tip: 'LA séance clé Hyrox. Le but: maintenir le même pace run sur chaque round malgré la fatigue du row.',
        };
      }

      default: return { title: 'Test Run 1km', location: 'outdoor', warmup: '10 min footing + 4 accélérations', main: 'Cours 1km le plus vite possible. Chronomètre précis.', cooldown: '8 min trot + étirements', details: { objectif: 'Donner 100% — ce test calibre TOUTES tes zones' }, tip: 'Pars à un rythme que tu peux tenir 5 min. N\'explose pas dans les 200 premiers mètres.' };
    }
  },

  /* ========== SÉANCES ERGO ========== */
  generateErgoSession(sessionType, zones, type, weekNum) {
    const z = zones;
    const name = type === 'row' ? 'Row' : 'SkiErg';
    const epf = this.getErgoProgFactor(weekNum);
    const deload = this.isDeloadWeek(weekNum);
    const vf = deload ? 0.7 : 1;

    switch(sessionType) {
      case 'technique': {
        const p = z.technique.pace500 * epf;
        const sets = Math.round(4 * vf);
        return {
          title: name + ' Technique — Cadence basse' + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '3 min à allure très facile',
          main: sets + ' × 500m à ' + this.fmtP(p) + '/500m — Cadence: ' + (type==='row'?'22-24':'28-30') + ' coups/min — Récup: 90s',
          cooldown: '2 min facile',
          details: {
            séries: sets + ' × 500m',
            pace_cible: this.fmtP(p) + ' /500m',
            cadence: type==='row' ? '22-24 coups/min' : '28-30 coups/min',
            récupération: '90s repos complet',
            distance_totale: (sets*500/1000).toFixed(1) + ' km',
          },
          tip: type==='row' ? 'JAMBES d\'abord (60% de la puissance), puis bascule du dos, bras en dernier.' : 'Tirage long et contrôlé. Engage les abdos à chaque coup.',
        };
      }

      case 'endurance': {
        const reps = Math.round(Math.min(3 + Math.floor(weekNum/3), 5) * vf);
        const p = z.endurance.pace500 * epf;
        return {
          title: name + ' Endurance — ' + reps + '×1000m' + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '3 min progressif',
          main: reps + ' × 1000m à ' + this.fmtP(p) + '/500m — Récup: 90s',
          cooldown: '2 min très facile',
          details: {
            séries: reps + ' × 1000m',
            pace_cible: this.fmtP(p) + ' /500m',
            temps_par_1000m: this.fmtP(p * 2),
            récupération: '90s',
            distance_totale: reps + ' km',
          },
          tip: 'Pace régulier. Si le dernier 1000m dérape de +5s, réduis l\'intensité la prochaine fois.',
        };
      }

      case 'racePace': {
        const reps = Math.round(Math.min(3 + Math.floor(weekNum/4), 4) * vf);
        const p = z.racePace.pace500 * epf;
        return {
          title: name + ' Race Pace — Simulation Hyrox' + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '3 min progressif',
          main: reps + ' × 1000m à ' + this.fmtP(p) + '/500m + 1km run à allure tempo entre chaque — Récup: 60s transition',
          cooldown: '5 min marche',
          details: {
            séries: reps + ' × [1000m ' + name.toLowerCase() + ' + 1km run]',
            pace_ergo: this.fmtP(p) + ' /500m (allure course)',
            pace_run: 'Allure tempo',
            récupération: '60s transition (comme en course)',
            durée_estimée: Math.round(reps * 10) + ' min',
          },
          tip: 'Simule l\'enchaînement Hyrox. Enchaine le run IMMÉDIATEMENT après l\'ergo. C\'est là que tu gagnes du temps en course.',
        };
      }

      case 'power': {
        const reps = Math.round(Math.min(6 + Math.floor(weekNum/2), 10) * vf);
        const p = z.power.pace500 * epf;
        return {
          title: name + ' Puissance — ' + reps + '×250m' + (deload ? ' (décharge)' : ''),
          location: 'gym',
          warmup: '3 min progressif + 2×10 coups rapides',
          main: reps + ' × 250m à ' + this.fmtP(p) + '/500m — Récup: 2 min',
          cooldown: '3 min très facile',
          details: {
            séries: reps + ' × 250m',
            pace_cible: this.fmtP(p) + ' /500m',
            récupération: '2 min repos complet',
            distance_totale: ((reps*250)/1000).toFixed(1) + ' km',
          },
          tip: 'Explosif mais contrôlé. Chaque rep au même pace ±1s.',
        };
      }

      default: return { title: 'Test ' + name + ' 1000m', location: 'gym', warmup: '3 min progressif', main: 'Fais 1000m le plus vite possible. Chrono précis.', cooldown: '3 min facile', details: { objectif: 'Ce test calibre TOUTES tes zones ' + name }, tip: 'Pace régulier — ne pars pas trop vite les 200 premiers mètres.' };
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
    const t = this.getTestResults();
    if (!t) return null;
    return {
      run: this.getRunZones(t.run.speedKmh),
      row: this.getErgoZones(t.row.time1000),
      ski: this.getErgoZones(t.ski.time1000),
    };
  },

  getCurrentWeek() {
    const t = this.getTestResults();
    if (!t) return 0;
    return Math.floor((new Date() - new Date(t.run.date)) / (7*24*60*60*1000));
  },

  /* Gilet lesté: min 8 semaines + marche/rando d'abord */
  canUseVest(weekNum, runScore, pain) {
    if (weekNum < 8) return { allowed: false, reason: 'Minimum 8 semaines de base avant gilet (semaine ' + weekNum + '/8)' };
    if (runScore < 60) return { allowed: false, reason: 'Score run < 60 (' + runScore + '). Continue sans gilet.' };
    if (pain > 2) return { allowed: false, reason: 'Douleur tendon ' + pain + '/10. Pas de gilet.' };
    const maxKg = weekNum < 12 ? 5 : Math.min(5 + Math.floor((weekNum-12)/2), 10);
    const mode = weekNum < 12 ? 'Z2 marche/rando uniquement' : 'Z2 run autorisé';
    return { allowed: true, maxKg: maxKg, mode: mode, reason: 'OK — max ' + maxKg + 'kg en ' + mode };
  },

  /* ========== UTILITAIRES ========== */
  fmtS(s) { return Math.round(s * 10) / 10; },
  fmtP(sec) { const m = Math.floor(sec/60), s = Math.round(sec%60); return m + ':' + String(s).padStart(2,'0'); },
  parseTime(minStr, secStr) { return (parseInt(minStr)||0) * 60 + (parseInt(secStr)||0); },
};
