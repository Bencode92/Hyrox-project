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
      weight: 80,
      height: 183,         // cm
      focusZone: '',       // ex: "Pecs (bas surtout)"
      goal: 'hybrid',      // 'hyrox' | 'hypertrophy' | 'hybrid' | 'recovery'
      excludedExercises: [], // IDs à ne JAMAIS programmer (douleur, blessure)
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

  // Migrate older profiles: add missing fields with sensible defaults.
  // Called once on init in muscu-app.js.
  function migrateProfile() {
    const raw = localStorage.getItem(KEYS.profile);
    if (!raw) return; // No profile yet — onboarding will create it
    try {
      const p = JSON.parse(raw);
      let changed = false;
      if (p.height == null)    { p.height = 183; changed = true; }
      if (p.focusZone == null) { p.focusZone = 'Pecs (bas surtout) — faiblesse marquée'; changed = true; }
      if (p.goal == null)      { p.goal = 'hybrid'; changed = true; }
      if (p.excludedExercises == null) { p.excludedExercises = ['dips', 'weighted_dips']; changed = true; }
      if (changed) _set(KEYS.profile, p);
    } catch {}
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

  // ── Pain J+1 tracking (règle des 24h, BJSM 2019) ──────────
  function saveNextDayPain(sessionId, painScore) {
    const all = getSessions();
    const idx = all.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;
    all[idx].painNextDay = Math.max(0, Math.min(10, Number(painScore)));
    all[idx].painNextDayLoggedAt = new Date().toISOString();
    _set(KEYS.sessions, all);
    return true;
  }

  /**
   * Returns the most recent session that was performed 8-48h ago
   * and doesn't yet have a painNextDay score. Null if none.
   */
  function getSessionAwaitingPain() {
    const sessions = getSessions();
    const now = Date.now();
    for (let i = sessions.length - 1; i >= 0; i--) {
      const s = sessions[i];
      if (s.painNextDay != null) continue;
      if (s.type === 'abs') continue; // Skip abs sessions (too light to bother)
      const t = new Date(s.createdAt || s.date).getTime();
      if (isNaN(t)) continue;
      const hoursAgo = (now - t) / 3600 / 1000;
      if (hoursAgo >= 8 && hoursAgo <= 48) return s;
      if (hoursAgo > 48) return null; // older sessions = too late to log
    }
    return null;
  }

  /**
   * Check if the last N sessions had painNextDay > 3 (persistent pain warning).
   * Returns { warning: bool, count: number, lastPain: number }.
   */
  function getPainWarning() {
    const sessions = getSessions().filter(s => s.type !== 'abs').slice(-5);
    const scored = sessions.filter(s => s.painNextDay != null);
    if (!scored.length) return { warning: false, count: 0, lastPain: null };
    const lastPain = scored[scored.length - 1].painNextDay;
    // Consecutive sessions with pain > 3 from most recent
    let count = 0;
    for (let i = scored.length - 1; i >= 0; i--) {
      if (scored[i].painNextDay > 3) count++;
      else break;
    }
    return { warning: count >= 2, count, lastPain };
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
   * Parse a rep target : 10 → {min:10,max:10} ; '8-12' → {min:8,max:12} ;
   * '15' → {min:15,max:15}. Anything with a unit ('30m', '15-20 min', 'max propres')
   * → null (pas de progression en charge sur ces exos).
   */
  function _parseRepTarget(target) {
    if (typeof target === 'number') return { min: target, max: target };
    if (typeof target !== 'string') return null;
    const m = target.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!m) return null;
    const min = Number(m[1]);
    const max = m[2] ? Number(m[2]) : min;
    return { min, max: Math.max(min, max) };
  }

  /**
   * Suggest next load for an exercise based on last logged session.
   * Returns { weight, delta, reason, trend, lastWeight, lastRpe } or null if no history.
   * DOUBLE PROGRESSION (doctrine juil. 2026, charge modérée 8-15 reps RIR 1-2) :
   *   - Douleur J+1 > 3/10                → -5 % (règle 24h), trend 'pain'
   *   - Douleur signalée en séance        → -step, trend 'pain'
   *   - RPE moy ≥ 9.5 (échec)            → -step (on vise RIR 1-2, pas l'échec)
   *   - Fourchette '8-12' : TOUTES les séries au haut (≥12) → +step
   *                          une série sous le bas (<8)   → -step
   *                          sinon                        → même charge, gagner des reps
   *   - Cible fixe (10) : moy ≥ cible → +step, sinon maintien
   *   - Pas de cible (temps/distance) : RPE seul (≤7 ↑, sinon →)
   *   - opts.deload = true → charge × 0.6 (semaine deload −40 %), prioritaire
   * step = +2.5 (compound) / +1.25 (iso).
   */
  function suggestNextLoad(exerciseId, targetReps, opts) {
    opts = opts || {};
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
    const minReps = Math.min(...reps);

    const rpeSets = workingSets.filter(s => s.rpe);
    const lastRpe = rpeSets.length
      ? rpeSets.reduce((s, r) => s + r.rpe, 0) / rpeSets.length
      : (exData.rpe || last.globalRpe || null);

    const hasPain = !!(last.painNotes && last.painNotes.trim());
    const painJ1 = typeof last.painNextDay === 'number' ? last.painNextDay : null;
    const step = _isCompound(exerciseId) ? 2.5 : 1.25;
    const range = _parseRepTarget(targetReps);
    const roundTo = v => Math.max(0, Math.round(v / step) * step);

    // Semaine deload : −40 % sur la dernière charge, prioritaire sur tout le reste
    if (opts.deload) {
      const weight = roundTo(lastWeight * 0.6);
      return {
        weight, delta: weight - lastWeight, trend: 'deload',
        reason: 'Semaine DELOAD — charge −40 %, séries −1, RIR 3-4 (on récupère, on ne teste pas)',
        lastWeight, lastRpe: lastRpe ? Math.round(lastRpe * 10) / 10 : null, lastDate: last.date,
      };
    }

    let delta = 0;
    let trend = 'flat';
    let reason = 'Maintien';

    // Règle 24h (BJSM 2019) : douleur J+1 pilote la charge
    if (painJ1 != null && painJ1 > 3) {
      delta = -Math.max(step, roundTo(lastWeight * 0.05));
      trend = 'pain';
      reason = `Douleur J+1 = ${painJ1}/10 — décharge auto (règle 24h)`;
    } else if (hasPain) {
      delta = -step;
      trend = 'pain';
      reason = 'Douleur signalée pendant séance — charge allégée';
    } else if (lastRpe && lastRpe >= 9.5) {
      // Échec : si le haut de fourchette est quand même atteint → même charge, on
      // s'arrête 1-2 reps avant ; sinon la charge est trop lourde → ↓
      const topHit = range && minReps >= range.max;
      delta = topHit ? 0 : -step;
      trend = topHit ? 'flat' : 'down';
      reason = topHit
        ? `RPE ${lastRpe.toFixed(1)} = échec — même charge, arrête-toi 1-2 reps avant (RIR 1-2)`
        : `RPE ${lastRpe.toFixed(1)} = échec sans atteindre la fourchette — charge allégée`;
    } else if (range && range.max > range.min) {
      // Double progression sur fourchette
      if (minReps >= range.max) {
        delta = step;
        trend = 'up';
        reason = `Haut de fourchette (${range.max}) atteint sur toutes les séries — charge ↑`;
      } else if (minReps < range.min) {
        delta = -step;
        trend = 'down';
        reason = `Sous la fourchette (${minReps} < ${range.min}) — charge ↓`;
      } else {
        delta = 0;
        trend = 'flat';
        reason = `Même charge — vise ${range.max} reps sur toutes les séries (dernier : ${reps.join('/')})`;
      }
    } else if (range) {
      // Cible fixe
      if (avgReps >= range.max - 0.5) {
        delta = step;
        trend = 'up';
        reason = `${range.max} reps atteintes — charge ↑`;
      } else {
        delta = 0;
        trend = 'flat';
        reason = `Reps cible non atteintes (${avgReps.toFixed(0)}/${range.max}) — même charge`;
      }
    } else if (lastRpe && lastRpe <= 7) {
      delta = step;
      trend = 'up';
      reason = `RPE ${lastRpe.toFixed(1)} confortable — progression`;
    } else if (!lastRpe) {
      reason = 'Maintien (pas de cible reps ni RPE)';
    } else {
      reason = 'Maintien (RPE optimal)';
    }

    const weight = roundTo(lastWeight + delta);
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
    getProfile, saveProfile, migrateProfile,
    getSessions, saveSession, deleteSession, getSessionsByExercise, getRecentSessions,
    saveNextDayPain, getSessionAwaitingPain, getPainWarning,
    getPRs, estimate1RM, suggestNextLoad,
    getObjectives, setObjective, removeObjective,
    getWeekPlan, saveWeekPlan, clearWeekPlan,
    getSettings, saveSettings,
    getPlanStart, setPlanStart, getWeekNumber,
    getFeedback, saveFeedback, getRecentFeedback,
    resetAll, exportData, importData,
  };
})();
