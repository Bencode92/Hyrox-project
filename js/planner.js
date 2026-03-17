/* HyroxForge — Weekly Planner
   Génère un plan semaine automatique basé sur les zones et la progression */

const Planner = {

  WEEK_TEMPLATE: [
    { day: 'Lundi',    slot: 'run',  types: ['z2','tempo'],            label: 'Run — Reprise' },
    { day: 'Mardi',    slot: 'ergo', types: ['technique','endurance'], label: 'Row + Ski — Salle' },
    { day: 'Mercredi', slot: 'run',  types: ['intervals_short','intervals_long','fartlek'], label: 'Run — Qualité' },
    { day: 'Jeudi',    slot: 'ergo', types: ['power','racePace'],      label: 'Row ou Ski — Intensité' },
    { day: 'Vendredi', slot: 'rest', types: [],                        label: 'Repos / Mobilité' },
    { day: 'Samedi',   slot: 'run',  types: ['long_run'],              label: 'Run — Sortie longue' },
    { day: 'Dimanche', slot: 'rest', types: [],                        label: 'Repos actif' },
  ],

  generate(zones, weekNum) {
    if (!zones) return null;
    const deload = Training.isDeloadWeek(weekNum);
    const sessions = Storage.getSessionsThisWeek();
    const doneTypes = sessions.map(s => s.sessionType);

    return this.WEEK_TEMPLATE.map((tmpl, i) => {
      if (tmpl.slot === 'rest') {
        return { ...tmpl, session: null, done: false, deload };
      }

      let type, exerciseType;
      if (tmpl.slot === 'run') {
        exerciseType = 'run';
        if (deload) type = tmpl.types.includes('z2') ? 'z2' : tmpl.types[0];
        else type = this.pickRunType(tmpl.types, weekNum, doneTypes);
      } else {
        exerciseType = this.pickErgoType(weekNum, i);
        if (deload) type = 'technique';
        else type = this.pickErgoSessionType(tmpl.types, weekNum, doneTypes);
      }

      let session;
      if (exerciseType === 'run') {
        session = Training.generateRunSession(type, zones.run, weekNum);
      } else {
        session = Training.generateErgoSession(type, zones[exerciseType], exerciseType, weekNum);
      }

      const isDone = doneTypes.includes(type);

      return {
        ...tmpl,
        exerciseType,
        sessionType: type,
        session,
        done: isDone,
        deload,
      };
    });
  },

  pickRunType(available, weekNum, doneTypes) {
    // Alternance intelligente
    if (available.includes('intervals_short') && available.includes('intervals_long')) {
      // Alterner court/long chaque semaine
      const pick = weekNum % 2 === 0 ? 'intervals_short' : 'intervals_long';
      // Fartlek toutes les 3 semaines
      if (weekNum % 3 === 2 && available.includes('fartlek')) return 'fartlek';
      return pick;
    }
    if (available.includes('z2') && available.includes('tempo')) {
      return weekNum % 2 === 0 ? 'z2' : 'tempo';
    }
    return available[0];
  },

  pickErgoType(weekNum, dayIndex) {
    // Mardi = row, Jeudi = ski (alterner chaque semaine)
    if (dayIndex === 1) return weekNum % 2 === 0 ? 'row' : 'ski';
    if (dayIndex === 3) return weekNum % 2 === 0 ? 'ski' : 'row';
    return 'row';
  },

  pickErgoSessionType(available, weekNum, doneTypes) {
    if (available.includes('racePace') && weekNum >= 4 && weekNum % 2 === 0) return 'racePace';
    if (available.includes('power')) return weekNum % 2 === 0 ? 'power' : (available.includes('endurance') ? 'endurance' : available[0]);
    return available[0];
  },

  /* Sauvegarde du plan généré */
  savePlan(plan) {
    localStorage.setItem('hf_weekplan', JSON.stringify({ week: Training.getCurrentWeek(), plan, generated: new Date().toISOString() }));
  },

  getSavedPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem('hf_weekplan'));
      if (saved && saved.week === Training.getCurrentWeek()) return saved.plan;
      return null;
    } catch { return null; }
  },
};
