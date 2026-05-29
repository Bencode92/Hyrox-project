/* ============================================================
   MUSCU-STORAGE  —  Persistence layer for HyroxForge Musculation
   ============================================================ */

const MuscuStorage = (() => {
  // ── keys ──────────────────────────────────────────────────
  const KEYS = {
    profile:    'mf_profile',     // user profile + injury info
    sessions:   'mf_sessions',    // logged workouts
    objectives: 'mf_objectives',  // per-exercise goals
    weekplan:   'mf_weekplan',    // current week plan
    prs:        'mf_prs',         // personal records history
    settings:   'mf_settings',    // app settings (worker url, etc.)
    planStart:  'mf_plan_start',  // plan start date
    feedback:   'mf_feedback',    // session feedback & preferences
  };

  function _get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // ── Profile ───────────────────────────────────────────────
  function getProfile() {
    return _get(KEYS.profile, {
      name: '',
      weight: 75,
      daysPerWeek: 4,
      level: 'intermediate', // beginner, intermediate, advanced
      injuryNotes: '',
      createdAt: null,
    });
  }

  function saveProfile(p) {
    if (!p.createdAt) p.createdAt = new Date().toISOString();
    _set(KEYS.profile, p);
  }

  // ── Sessions ──────────────────────────────────────────────
  function getSessions() { return _get(KEYS.sessions, []); }

  function saveSession(session) {
    if (!session.id) session.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (!session.createdAt) session.createdAt = new Date().toISOString();
    const all = getSessions();
    all.push(session);
    _set(KEYS.sessions, all);
    _updatePRs(session);
    return session;
  }

  function deleteSession(id) {
    const all = getSessions().filter(s => s.id !== id);
    _set(KEYS.sessions, all);
  }

  function getSessionsByExercise(exerciseId) {
    return getSessions().filter(s =>
      s.exercises && s.exercises.some(e => e.exerciseId === exerciseId)
    );
  }

  function getRecentSessions(n = 20) {
    return getSessions().slice(-n);
  }

  // ── PRs ───────────────────────────────────────────────────
  function getPRs() { return _get(KEYS.prs, {}); }

  function _updatePRs(session) {
    const prs = getPRs();
    if (!session.exercises) return;
    session.exercises.forEach(ex => {
      if (!ex.sets || !ex.sets.length) return;
      ex.sets.forEach(set => {
        if (!set.weight || !set.reps) return;
        const e1rm = Math.round(set.weight * (1 + set.reps / 30));
        const key = ex.exerciseId;
        if (!prs[key]) prs[key] = { best1RM: 0, bestWeight: 0, history: [] };
        if (e1rm > prs[key].best1RM) {
          prs[key].best1RM = e1rm;
          prs[key].bestWeight = set.weight;
          prs[key].bestReps = set.reps;
          prs[key].bestDate = session.date;
        }
        prs[key].history.push({
          date: session.date,
          weight: set.weight,
          reps: set.reps,
          e1rm,
        });
        // cap history
        if (prs[key].history.length > 100) prs[key].history = prs[key].history.slice(-100);
      });
    });
    _set(KEYS.prs, prs);
  }

  // ── Objectives ────────────────────────────────────────────
  function getObjectives() { return _get(KEYS.objectives, {}); }

  function setObjective(exerciseId, obj) {
    // obj = { targetWeight, targetReps, deadline }
    const all = getObjectives();
    all[exerciseId] = { ...obj, updatedAt: new Date().toISOString() };
    _set(KEYS.objectives, all);
  }

  function removeObjective(exerciseId) {
    const all = getObjectives();
    delete all[exerciseId];
    _set(KEYS.objectives, all);
  }

  // ── Week Plan ─────────────────────────────────────────────
  function getWeekPlan() { return _get(KEYS.weekplan, null); }

  function saveWeekPlan(plan) { _set(KEYS.weekplan, plan); }

  function clearWeekPlan() { localStorage.removeItem(KEYS.weekplan); }

  // ── Settings ──────────────────────────────────────────────
  function getSettings() {
    return _get(KEYS.settings, {
      workerUrl: 'https://studyforge-proxy.benoit-comas.workers.dev',
    });
  }

  function saveSettings(s) { _set(KEYS.settings, s); }

  // ── Plan Start ────────────────────────────────────────────
  function getPlanStart() { return _get(KEYS.planStart, null); }
  function setPlanStart(date) { _set(KEYS.planStart, date); }

  // ── Week Number ───────────────────────────────────────────
  function getWeekNumber() {
    const start = getPlanStart();
    if (!start) return 1;
    const diff = Date.now() - new Date(start).getTime();
    return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
  }

  // ── Feedback (session preferences & notes for AI) ──────────
  function getFeedback() { return _get(KEYS.feedback, []); }

  function saveFeedback(fb) {
    // fb = { sessionId, date, liked:[], disliked:[], tooHard:[], tooEasy:[], missing:'', notes:'', mood:'' }
    const all = getFeedback();
    fb.createdAt = new Date().toISOString();
    all.push(fb);
    // Keep last 50 feedbacks
    if (all.length > 50) all.splice(0, all.length - 50);
    _set(KEYS.feedback, all);
  }

  function getRecentFeedback(n = 15) {
    return getFeedback().slice(-n);
  }

  // ── Utilities ─────────────────────────────────────────────
  function estimate1RM(weight, reps) {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  // ── Next-load suggestion (RPE-based progression) ──────────
  // Compound lifts get +2.5kg, isolation/accessory get +1.25kg.
  const COMPOUND_IDS = new Set([
    'back_squat','front_squat','deadlift','rdl','sumo_deadlift',
    'bench_press','ohp','barbell_row','hip_thrust','thruster',
    'power_clean','clean_press','push_press','romanian_deadlift',
    // Expert review additions
    'incline_bench','decline_bench','decline_db_press',
    'dips','weighted_dips','pull_ups','weighted_chin_up',
  ]);

  function _isCompound(id) { return COMPOUND_IDS.has(id); }

  /**
   * Suggest next load for an exercise based on last logged session.
   * Returns { weight, delta, reason, trend, lastWeight, lastRpe } or null if no history.
   * Logic:
   *   - Pain in last session             → -2.5kg, trend 'pain'
   *   - RPE moy ≤ 7 & reps ≥ targetReps  → +2.5 (compound) / +1.25 (iso)
   *   - RPE moy 7-8.5                    → maintien
   *   - RPE moy ≥ 9 or reps shortfall    → -2.5 (compound) / -1.25 (iso)
   */
  function suggestNextLoad(exerciseId, targetReps) {
    const sessions = getSessionsByExercise(exerciseId);
    if (!sessions.length) return null;
    const last = sessions[sessions.length - 1];
    const exData = (last.exercises || []).find(e => e.exerciseId === exerciseId);
    if (!exData || !exData.sets || !exData.sets.length) return null;

    const workingSets = exData.sets.filter(s => s.weight > 0 && s.reps > 0);
    if (!workingSets.length) return null;

    const weights = workingSets.map(s => s.weight);
    const lastWeight = Math.max(...weights);
    const reps = workingSets.map(s => s.reps);
    const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length;

    const rpeSets = workingSets.filter(s => s.rpe);
    const lastRpe = rpeSets.length
      ? rpeSets.reduce((s, r) => s + r.rpe, 0) / rpeSets.length
      : (exData.rpe || last.globalRpe || null);

    const hasPain = !!(last.painNotes && last.painNotes.trim());
    const step = _isCompound(exerciseId) ? 2.5 : 1.25;
    const targetNum = typeof targetReps === 'number' ? targetReps : null;
    const repsHit = targetNum ? avgReps >= targetNum - 0.5 : true;

    let delta = 0;
    let trend = 'flat';
    let reason = 'Maintien (RPE optimal)';

    if (hasPain) {
      delta = -step;
      trend = 'pain';
      reason = 'Douleur signalée — charge allégée';
    } else if (lastRpe && lastRpe >= 9) {
      delta = -step;
      trend = 'down';
      reason = `RPE ${lastRpe.toFixed(1)} trop élevé — déload`;
    } else if (!repsHit) {
      delta = -step;
      trend = 'down';
      reason = `Reps cible non atteintes (${avgReps.toFixed(0)}/${targetNum})`;
    } else if (lastRpe && lastRpe <= 7) {
      delta = step;
      trend = 'up';
      reason = `RPE ${lastRpe.toFixed(1)} confortable — progression`;
    } else if (!lastRpe) {
      // No RPE recorded → conservative micro-progression if reps hit
      delta = repsHit ? step : 0;
      trend = repsHit ? 'up' : 'flat';
      reason = repsHit ? 'Progression conservatrice (pas de RPE)' : 'Maintien';
    }

    const weight = Math.max(0, Math.round((lastWeight + delta) / 2.5) * 2.5);
    return {
      weight,
      delta: weight - lastWeight,
      reason,
      trend,
      lastWeight,
      lastRpe: lastRpe ? Math.round(lastRpe * 10) / 10 : null,
      lastDate: last.date,
    };
  }

  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  // ── GitHub Sync (reuse existing pattern) ──────────────────
  function exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      sessions: getSessions(),
      prs: getPRs(),
      objectives: getObjectives(),
      settings: getSettings(),
      planStart: getPlanStart(),
    };
  }

  function importData(data) {
    if (data.profile) _set(KEYS.profile, data.profile);
    if (data.sessions) _set(KEYS.sessions, data.sessions);
    if (data.prs) _set(KEYS.prs, data.prs);
    if (data.objectives) _set(KEYS.objectives, data.objectives);
    if (data.settings) _set(KEYS.settings, data.settings);
    if (data.planStart) _set(KEYS.planStart, data.planStart);
  }

  // ── Public API ────────────────────────────────────────────
  return {
    getProfile, saveProfile,
    getSessions, saveSession, deleteSession, getSessionsByExercise, getRecentSessions,
    getPRs, estimate1RM, suggestNextLoad,
    getObjectives, setObjective, removeObjective,
    getWeekPlan, saveWeekPlan, clearWeekPlan,
    getSettings, saveSettings,
    getPlanStart, setPlanStart, getWeekNumber,
    getFeedback, saveFeedback, getRecentFeedback,
    resetAll, exportData, importData,
  };
})();
