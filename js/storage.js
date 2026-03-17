/* ========================================
   HyroxForge — Storage Layer
   ======================================== */

const Storage = {
  KEYS: { SESSIONS: 'hf_sessions', SETTINGS: 'hf_settings', SCORES: 'hf_scores' },

  getSessions() { try { return JSON.parse(localStorage.getItem(this.KEYS.SESSIONS)) || []; } catch { return []; } },

  saveSession(session) {
    const sessions = this.getSessions();
    session.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    session.createdAt = new Date().toISOString();
    sessions.unshift(session);
    localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions));
    return session;
  },

  deleteSession(id) { const sessions = this.getSessions().filter(s => s.id !== id); localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions)); },
  getSessionsByType(type) { return this.getSessions().filter(s => s.type === type); },
  getLastSession(type) { return this.getSessions().find(s => s.type === type); },

  getSessionsThisWeek() {
    const now = new Date(); const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    return this.getSessions().filter(s => new Date(s.date) >= monday);
  },

  getRecentSessions(n = 20) { return this.getSessions().slice(0, n); },

  getSettings() {
    const defaults = { workerUrl: '', goalSpeed: 15, compDate: '', weight: 75 };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) }; } catch { return defaults; }
  },

  saveSettings(settings) { localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings)); },

  getScoreHistory() { try { return JSON.parse(localStorage.getItem(this.KEYS.SCORES)) || []; } catch { return []; } },

  addScoreSnapshot(score) {
    const history = this.getScoreHistory();
    history.push({ date: new Date().toISOString().slice(0, 10), ...score });
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 180);
    const filtered = history.filter(s => new Date(s.date) >= cutoff);
    localStorage.setItem(this.KEYS.SCORES, JSON.stringify(filtered));
  },

  resetAll() { Object.values(this.KEYS).forEach(k => localStorage.removeItem(k)); },

  exportForAI() {
    const sessions = this.getRecentSessions(20);
    const settings = this.getSettings();
    const scores = this.getScoreHistory().slice(-10);
    const currentScore = Scoring.computeGlobal();
    return {
      profile: { goalSpeed: settings.goalSpeed, compDate: settings.compDate, weight: settings.weight, injury: 'tendon achille — en guérison' },
      currentScore, scoreHistory: scores,
      recentSessions: sessions.map(s => ({ date: s.date, type: s.type, sessionType: s.sessionType, location: s.location, distance: s.distance, duration: s.duration, pace: s.pace, speedKmh: s.speedKmh, rpe: s.rpe, vest: s.vest, vestKg: s.vestKg, pain: s.pain, reps: s.reps, repDistance: s.repDistance, restSec: s.restSec, notes: s.notes })),
      weekSummary: { sessionsThisWeek: this.getSessionsThisWeek().length, dayOfWeek: new Date().toLocaleDateString('fr-FR', { weekday: 'long' }) },
    };
  },
};
