/* HyroxForge — Training Engine
   Calcule les zones et génère les séances précises à partir des tests */

const Training = {

  /* ========== ZONES DE VITESSE (RUN) ========== 
     Basé sur le test 1km ≈ VMA approx
     Zone 2 = 65-75% VMA
     Tempo  = 80-85% VMA  
     Seuil  = 85-90% VMA
     Interval long = 90-95% VMA
     Interval court = 95-105% VMA
  */
  getRunZones(testSpeedKmh) {
    const vma = testSpeedKmh; // 1km test ~ VMA
    return {
      vma: vma,
      z2:     { min: vma * 0.65, max: vma * 0.75, pace_min: 3600/(vma*0.75), pace_max: 3600/(vma*0.65), label: 'Zone 2 (endurance)' },
      tempo:  { min: vma * 0.80, max: vma * 0.85, pace_min: 3600/(vma*0.85), pace_max: 3600/(vma*0.80), label: 'Tempo' },
      seuil:  { min: vma * 0.85, max: vma * 0.90, pace_min: 3600/(vma*0.90), pace_max: 3600/(vma*0.85), label: 'Seuil' },
      iv_long:  { min: vma * 0.90, max: vma * 0.95, pace_min: 3600/(vma*0.95), pace_max: 3600/(vma*0.90), label: 'Fractionné long' },
      iv_short: { min: vma * 0.95, max: vma * 1.05, pace_min: 3600/(vma*1.05), pace_max: 3600/(vma*0.95), label: 'Fractionné court' },
    };
  },

  /* ========== ZONES ROW/SKI ==========
     Basé sur le test 1000m
     pace = temps en sec pour 500m
  */
  getErgoZones(test1000mSec, type) {
    const pace500 = test1000mSec / 2; // pace par 500m
    return {
      testPace500: pace500,
      test1000: test1000mSec,
      technique:  { pace500: pace500 * 1.20, label: 'Technique (80% effort)' },
      endurance:  { pace500: pace500 * 1.12, label: 'Endurance (88% effort)' },
      power:      { pace500: pace500 * 1.02, label: 'Puissance (98% effort)' },
      test:       { pace500: pace500, label: 'Allure test (max)' },
    };
  },

  /* ========== GÉNÉRATEUR DE SÉANCES RUN ========== */
  generateRunSession(sessionType, zones, weekNum) {
    const z = zones;
    // Progression: +2% toutes les 3 semaines
    const progFactor = 1 + Math.floor((weekNum || 0) / 3) * 0.02;

    switch(sessionType) {
      case 'z2': return {
        title: 'Run Zone 2 — Endurance',
        location: 'outdoor',
        warmup: '5 min marche rapide',
        main: `${35 + Math.min(weekNum*2, 25)} min à allure confortable`,
        cooldown: '5 min marche + étirements',
        details: {
          speed_range: this.fmtSpeed(z.z2.min) + ' - ' + this.fmtSpeed(z.z2.max) + ' km/h',
          pace_range: this.fmtPace(z.z2.pace_min) + ' - ' + this.fmtPace(z.z2.pace_max) + '/km',
          duration: (35 + Math.min(weekNum*2, 25)) + ' min',
          total_km: ((z.z2.min + z.z2.max)/2 * (35 + Math.min(weekNum*2, 25))/60).toFixed(1) + ' km',
        },
        tip: 'Tu dois pouvoir parler en phrases complètes. Si tu es essouflé, ralentis.',
      };

      case 'tempo': return {
        title: 'Run Tempo — Allure Hyrox',
        location: 'outdoor',
        warmup: '10 min footing léger (' + this.fmtSpeed(z.z2.min) + ' km/h) + 4 accélérations progressives',
        main: `3 \u00d7 ${6 + Math.min(Math.floor(weekNum/2), 4)} min \u00e0 ${this.fmtSpeed(z.tempo.min*progFactor)}-${this.fmtSpeed(z.tempo.max*progFactor)} km/h \u2014 R\u00e9cup: 3 min trot`,
        cooldown: '8 min footing léger + étirements',
        details: {
          sets: 3,
          duration_per_set: (6 + Math.min(Math.floor(weekNum/2), 4)) + ' min',
          target_speed: this.fmtSpeed(z.tempo.min*progFactor) + ' - ' + this.fmtSpeed(z.tempo.max*progFactor) + ' km/h',
          target_pace: this.fmtPace(z.tempo.pace_min/progFactor) + ' - ' + this.fmtPace(z.tempo.pace_max/progFactor) + '/km',
          rest: '3 min trot léger',
        },
        tip: 'Allure « confortablement difficile ». Tu peux dire quelques mots mais pas une phrase.',
      };

      case 'intervals_short': {
        const reps = Math.min(6 + Math.floor(weekNum/2), 12);
        const dist = 400;
        const targetSpeed = (z.iv_short.min + z.iv_short.max) / 2 * progFactor;
        const pacePerRep = dist / (targetSpeed * 1000/3600);
        return {
          title: `Fractionn\u00e9 court \u2014 ${reps}\u00d7${dist}m`,
          location: weekNum < 4 ? 'gym' : 'outdoor',
          warmup: '10 min footing + 4 lignes droites acc\u00e9l\u00e9r\u00e9es',
          main: `${reps} \u00d7 ${dist}m \u00e0 ${this.fmtSpeed(targetSpeed)} km/h (${this.fmtPace(3600/targetSpeed)}/km) \u2014 R\u00e9cup: ${reps <= 8 ? 90 : 75}s marche/trot`,
          cooldown: '8 min footing tr\u00e8s l\u00e9ger',
          details: {
            sets: reps,
            distance_per_set: dist + 'm',
            time_per_rep: Math.round(pacePerRep) + 's',
            target_speed: this.fmtSpeed(targetSpeed) + ' km/h',
            target_pace: this.fmtPace(3600/targetSpeed) + '/km',
            rest: (reps <= 8 ? 90 : 75) + 's marche/trot',
            total_distance: ((reps * dist)/1000).toFixed(1) + ' km (hors échauff)',
          },
          tip: `Chaque rep doit \u00eatre au m\u00eame temps (\u00b12s). Si le dernier est 5s+ plus lent, tu es parti trop vite.`,
        };
      }

      case 'intervals_long': {
        const reps = Math.min(3 + Math.floor(weekNum/3), 6);
        const dist = 1000;
        const targetSpeed = (z.iv_long.min + z.iv_long.max) / 2 * progFactor;
        const pacePerRep = dist / (targetSpeed * 1000/3600);
        return {
          title: `Fractionn\u00e9 long \u2014 ${reps}\u00d71000m`,
          location: 'outdoor',
          warmup: '12 min footing progressif + 3 acc\u00e9l\u00e9rations',
          main: `${reps} \u00d7 1000m \u00e0 ${this.fmtSpeed(targetSpeed)} km/h (${this.fmtPace(3600/targetSpeed)}/km) \u2014 R\u00e9cup: 2min trot`,
          cooldown: '10 min footing l\u00e9ger',
          details: {
            sets: reps,
            distance_per_set: '1000m',
            time_per_rep: this.fmtPace(pacePerRep),
            target_speed: this.fmtSpeed(targetSpeed) + ' km/h',
            target_pace: this.fmtPace(3600/targetSpeed) + '/km',
            rest: '2 min trot l\u00e9ger',
            total_distance: (reps).toFixed(0) + ' km (hors échauff)',
          },
          tip: 'R\u00e9gularit\u00e9 > vitesse. Vise le m\u00eame split sur chaque 1000m.',
        };
      }

      case 'long_run': {
        const duration = 50 + Math.min(weekNum * 3, 30);
        return {
          title: 'Sortie longue — ' + duration + ' min',
          location: 'outdoor',
          warmup: '5 min marche rapide',
          main: `${duration} min \u00e0 ${this.fmtSpeed(z.z2.min)}-${this.fmtSpeed(z.z2.max)} km/h. Derniers 10 min: acc\u00e9l\u00e9rer \u00e0 ${this.fmtSpeed(z.tempo.min)} km/h`,
          cooldown: '5 min marche + étirements longs',
          details: {
            duration: duration + ' min',
            target_speed: this.fmtSpeed(z.z2.min) + ' - ' + this.fmtSpeed(z.z2.max) + ' km/h',
            finish_speed: this.fmtSpeed(z.tempo.min) + ' km/h (derniers 10 min)',
            total_km: ((z.z2.min + z.z2.max)/2 * duration/60).toFixed(1) + ' km estim\u00e9',
          },
          tip: 'Hydrate-toi avant. C\'est LA s\u00e9ance qui construit ton moteur a\u00e9robie.',
        };
      }

      default: return { title: 'Test Run 1km', main: 'Cours 1km le plus vite possible', details: {} };
    }
  },

  /* ========== GÉNÉRATEUR DE SÉANCES ERGO (ROW/SKI) ========== */
  generateErgoSession(sessionType, zones, type, weekNum) {
    const z = zones;
    const name = type === 'row' ? 'Row' : 'SkiErg';
    const progFactor = 1 - Math.floor((weekNum || 0) / 3) * 0.01; // pace diminue = plus rapide

    switch(sessionType) {
      case 'technique': {
        const pace = z.technique.pace500 * progFactor;
        return {
          title: name + ' Technique — Cadence basse',
          location: 'gym',
          warmup: '3 min à allure très facile',
          main: `4 \u00d7 500m \u00e0 ${this.fmtPace(pace)}/500m \u2014 Cadence: ${type==='row'?'22-24':'28-30'} coups/min \u2014 R\u00e9cup: 90s`,
          cooldown: '2 min facile',
          details: {
            sets: 4, distance_per_set: '500m',
            target_pace: this.fmtPace(pace) + '/500m',
            cadence: type==='row' ? '22-24 coups/min' : '28-30 coups/min',
            rest: '90s repos complet',
            total: '2000m',
          },
          tip: type==='row' ? 'Pousse avec les JAMBES d\'abord (60% de la puissance), puis bascule du dos, bras en dernier.' : 'Tirage long et contr\u00f4l\u00e9. Engage les abdos \u00e0 chaque coup.',
        };
      }

      case 'endurance': {
        const reps = Math.min(3 + Math.floor(weekNum/3), 5);
        const pace = z.endurance.pace500 * progFactor;
        return {
          title: `${name} Endurance \u2014 ${reps}\u00d71000m`,
          location: 'gym',
          warmup: '3 min progressif',
          main: `${reps} \u00d7 1000m \u00e0 ${this.fmtPace(pace)}/500m \u2014 R\u00e9cup: 90s`,
          cooldown: '2 min tr\u00e8s facile',
          details: {
            sets: reps, distance_per_set: '1000m',
            target_pace: this.fmtPace(pace) + '/500m',
            time_per_1000: this.fmtPace(pace * 2) + ' par 1000m',
            rest: '90s',
            total: (reps) + ' km',
          },
          tip: 'Pace r\u00e9gulier. Si le dernier 1000m d\u00e9rape de +5s, r\u00e9duis l\'intensit\u00e9 la prochaine fois.',
        };
      }

      case 'power': {
        const reps = Math.min(6 + Math.floor(weekNum/2), 10);
        const pace = z.power.pace500 * progFactor;
        return {
          title: `${name} Puissance \u2014 ${reps}\u00d7250m`,
          location: 'gym',
          warmup: '3 min progressif + 2\u00d710 coups rapides',
          main: `${reps} \u00d7 250m \u00e0 ${this.fmtPace(pace)}/500m (quasi max) \u2014 R\u00e9cup: 2min`,
          cooldown: '3 min tr\u00e8s facile',
          details: {
            sets: reps, distance_per_set: '250m',
            target_pace: this.fmtPace(pace) + '/500m',
            rest: '2 min repos complet',
            total: ((reps*250)/1000).toFixed(1) + ' km',
          },
          tip: 'Explosif mais contr\u00f4l\u00e9. Chaque rep doit \u00eatre au m\u00eame pace \u00b11s.',
        };
      }

      default: return { title: 'Test ' + name + ' 1000m', main: 'Fais 1000m le plus vite possible', details: {} };
    }
  },

  /* ========== SAUVEGARDE DES TESTS ========== */
  saveTestResults(runSpeedKmh, rowTimeSec, skiTimeSec) {
    const data = {
      run: { speedKmh: runSpeedKmh, date: new Date().toISOString() },
      row: { time1000: rowTimeSec, date: new Date().toISOString() },
      ski: { time1000: skiTimeSec, date: new Date().toISOString() },
    };
    localStorage.setItem('hf_tests', JSON.stringify(data));
    return data;
  },

  getTestResults() {
    try { return JSON.parse(localStorage.getItem('hf_tests')); } catch { return null; }
  },

  hasTests() { return this.getTestResults() !== null; },

  /* ========== UTILITAIRES ========== */
  fmtSpeed(s) { return Math.round(s * 10) / 10; },
  fmtPace(sec) { 
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  },

  /* Convertir min:sec string en secondes */
  parseTime(minStr, secStr) {
    return (parseInt(minStr) || 0) * 60 + (parseInt(secStr) || 0);
  },

  /* Semaine actuelle depuis le premier test */
  getCurrentWeek() {
    const tests = this.getTestResults();
    if (!tests) return 0;
    const firstDate = new Date(tests.run.date);
    const now = new Date();
    return Math.floor((now - firstDate) / (7 * 24 * 60 * 60 * 1000));
  },

  /* R\u00e9sum\u00e9 des zones pour l'affichage */
  getZonesSummary() {
    const tests = this.getTestResults();
    if (!tests) return null;
    return {
      run: this.getRunZones(tests.run.speedKmh),
      row: this.getErgoZones(tests.row.time1000, 'row'),
      ski: this.getErgoZones(tests.ski.time1000, 'ski'),
    };
  },
};
