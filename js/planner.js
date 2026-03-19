/* HyroxForge — Weekly Planner v2
   Plan semaine flexible: démarre au jour choisi, pas toujours lundi.
   Skip tracking, IA-aware, statuts visuels. */

const Planner = {

  /* Template relatif: jour 0 = jour de lancement, jour 6 = fin de semaine */
  BASE_SLOTS: [
    { slot: 'run',  types: ['z2','tempo'],            label: 'Run — Reprise' },
    { slot: 'ergo', types: ['technique','endurance'], label: 'Row + Ski — Salle' },
    { slot: 'run',  types: ['intervals_short','intervals_long','fartlek'], label: 'Run — Qualité' },
    { slot: 'ergo', types: ['power','racePace'],      label: 'Row ou Ski — Intensité' },
    { slot: 'rest', types: [],                        label: 'Repos / Mobilité' },
    { slot: 'run',  types: ['long_run'],              label: 'Run — Sortie longue' },
    { slot: 'rest', types: [],                        label: 'Repos actif' },
  ],

  DAY_NAMES: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],

  /* ========== DATE HELPERS ========== */
  getLaunchDate() {
    const iso = localStorage.getItem('hf_plan_launched');
    return iso ? new Date(iso) : null;
  },

  /* Quelle semaine du plan et quel jour dans la semaine (0-6) */
  getPlanPosition() {
    const launch = this.getLaunchDate();
    if (!launch) return { week: 0, dayInWeek: 0, daysSinceLaunch: 0 };
    const now = new Date(); now.setHours(0,0,0,0);
    const start = new Date(launch); start.setHours(0,0,0,0);
    const daysSinceLaunch = Math.floor((now - start) / (24*60*60*1000));
    const week = Math.floor(daysSinceLaunch / 7);
    const dayInWeek = daysSinceLaunch % 7;
    return { week: Math.max(0, week), dayInWeek: Math.max(0, dayInWeek), daysSinceLaunch };
  },

  /* Date réelle pour chaque jour du plan cette semaine */
  getPlanDates() {
    const launch = this.getLaunchDate();
    if (!launch) return [];
    const pos = this.getPlanPosition();
    const weekStart = new Date(launch);
    weekStart.setDate(weekStart.getDate() + pos.week * 7);
    weekStart.setHours(0,0,0,0);
    return Array.from({length:7}, (_,i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  },

  /* Nom du jour réel pour un slot du plan */
  getDayLabel(slotIndex) {
    const dates = this.getPlanDates();
    if (!dates[slotIndex]) return 'J'+(slotIndex+1);
    return this.DAY_NAMES[dates[slotIndex].getDay()];
  },

  getDateLabel(slotIndex) {
    const dates = this.getPlanDates();
    if (!dates[slotIndex]) return '';
    return dates[slotIndex].toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
  },

  /* ========== PLAN WEEK RANGE (for session matching) ========== */
  getPlanWeekRange() {
    const launch = this.getLaunchDate();
    if (!launch) return { start: new Date(), end: new Date() };
    const pos = this.getPlanPosition();
    const start = new Date(launch);
    start.setDate(start.getDate() + pos.week * 7);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  },

  getSessionsThisPlanWeek() {
    const { start, end } = this.getPlanWeekRange();
    return Storage.getSessions().filter(s => {
      const d = new Date(s.date);
      return d >= start && d < end;
    });
  },

  /* ========== SKIP MANAGEMENT ========== */
  getSkips() {
    try { return JSON.parse(localStorage.getItem('hf_skips')) || {}; } catch { return {}; }
  },

  /* key = "weekNum:slotIndex" */
  skipKey(weekNum, slotIndex) { return weekNum + ':' + slotIndex; },

  addSkip(weekNum, slotIndex, reason) {
    const skips = this.getSkips();
    skips[this.skipKey(weekNum, slotIndex)] = { date: new Date().toISOString(), reason: reason || 'skip' };
    localStorage.setItem('hf_skips', JSON.stringify(skips));
  },

  removeSkip(weekNum, slotIndex) {
    const skips = this.getSkips();
    delete skips[this.skipKey(weekNum, slotIndex)];
    localStorage.setItem('hf_skips', JSON.stringify(skips));
  },

  isSkipped(weekNum, slotIndex) {
    return !!this.getSkips()[this.skipKey(weekNum, slotIndex)];
  },

  getSkipsThisWeek() {
    const pos = this.getPlanPosition();
    const skips = this.getSkips();
    const result = [];
    for (let i = 0; i < 7; i++) {
      if (skips[this.skipKey(pos.week, i)]) result.push(i);
    }
    return result;
  },

  /* ========== GENERATE PLAN ========== */
  generate(zones, weekNum) {
    if (!zones) return null;
    const deload = Training.isDeloadWeek(weekNum);
    const doneSessions = this.getSessionsThisPlanWeek();
    const doneTypes = doneSessions.map(s => s.sessionType);

    return this.BASE_SLOTS.map((tmpl, i) => {
      const dayName = this.getDayLabel(i);
      const dateLabel = this.getDateLabel(i);

      if (tmpl.slot === 'rest') {
        return { ...tmpl, day: dayName, dateLabel, slotIndex: i, session: null, done: false, skipped: false, deload };
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

      const isDone = this.isSessionDone(exerciseType, type, doneSessions, i);
      const isSkipped = this.isSkipped(weekNum, i);

      return {
        ...tmpl, day: dayName, dateLabel, slotIndex: i,
        exerciseType, sessionType: type, session,
        done: isDone, skipped: isSkipped, deload,
      };
    });
  },

  /* Match: session faite le même jour du plan OU même type dans la semaine */
  isSessionDone(exerciseType, sessionType, doneSessions, slotIndex) {
    const dates = this.getPlanDates();
    const planDate = dates[slotIndex];
    if (!planDate) return false;
    const planDateStr = planDate.toISOString().split('T')[0];
    // Match par date exacte + type d'exercice
    return doneSessions.some(s =>
      s.date === planDateStr && s.type === exerciseType
    ) || doneSessions.some(s =>
      s.type === exerciseType && s.sessionType === sessionType
    );
  },

  pickRunType(available, weekNum, doneTypes) {
    if (available.includes('intervals_short') && available.includes('intervals_long')) {
      const pick = weekNum % 2 === 0 ? 'intervals_short' : 'intervals_long';
      if (weekNum % 3 === 2 && available.includes('fartlek')) return 'fartlek';
      return pick;
    }
    if (available.includes('z2') && available.includes('tempo')) {
      return weekNum % 2 === 0 ? 'z2' : 'tempo';
    }
    return available[0];
  },

  pickErgoType(weekNum, dayIndex) {
    if (dayIndex === 1) return weekNum % 2 === 0 ? 'row' : 'ski';
    if (dayIndex === 3) return weekNum % 2 === 0 ? 'ski' : 'row';
    return 'row';
  },

  pickErgoSessionType(available, weekNum, doneTypes) {
    if (available.includes('racePace') && weekNum >= 4 && weekNum % 2 === 0) return 'racePace';
    if (available.includes('power')) return weekNum % 2 === 0 ? 'power' : (available.includes('endurance') ? 'endurance' : available[0]);
    return available[0];
  },

  /* ========== SAVE / LOAD ========== */
  savePlan(plan) {
    const pos = this.getPlanPosition();
    localStorage.setItem('hf_weekplan', JSON.stringify({
      week: pos.week,
      plan,
      generated: new Date().toISOString(),
    }));
  },

  getSavedPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem('hf_weekplan'));
      const pos = this.getPlanPosition();
      if (saved && saved.week === pos.week) return saved.plan;
      return null;
    } catch { return null; }
  },

  /* ========== AI PLAN MODIFICATION ========== */
  applyAIModification(slotIndex, newSessionType, newExerciseType) {
    const plan = this.getSavedPlan();
    if (!plan || !plan[slotIndex]) return false;
    const zones = Training.getZonesSummary();
    if (!zones) return false;
    const pos = this.getPlanPosition();
    const weekNum = pos.week;

    let session;
    const exType = newExerciseType || plan[slotIndex].exerciseType;
    if (exType === 'run') {
      session = Training.generateRunSession(newSessionType, zones.run, weekNum);
    } else {
      session = Training.generateErgoSession(newSessionType, zones[exType], exType, weekNum);
    }

    plan[slotIndex].sessionType = newSessionType;
    plan[slotIndex].exerciseType = exType;
    plan[slotIndex].session = session;
    plan[slotIndex].aiModified = true;
    this.savePlan(plan);
    return true;
  },

  /* Summary for AI context */
  getPlanSummary() {
    const plan = this.getSavedPlan();
    if (!plan) return null;
    const pos = this.getPlanPosition();
    return {
      weekNum: pos.week + 1,
      dayInWeek: pos.dayInWeek,
      days: plan.map((d, i) => ({
        day: d.day,
        date: d.dateLabel,
        slot: d.slot,
        exercise: d.exerciseType || 'rest',
        type: d.sessionType || 'rest',
        done: d.done,
        skipped: d.skipped,
        past: i < pos.dayInWeek,
        today: i === pos.dayInWeek,
        future: i > pos.dayInWeek,
      })),
      skippedCount: this.getSkipsThisWeek().length,
    };
  },
};
