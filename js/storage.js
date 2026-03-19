/* HyroxForge — Storage v2 — LocalStorage + GitHub Sync
   Pattern identique à SlovakForge:
   - LocalStorage pour la rapidité (offline-first)
   - GitHub repo pour la persistence (sync cross-device)
   - Token GitHub entré par l'utilisateur (sessionStorage)
*/

const GH = {
  token: '',
  owner: 'Bencode92',
  repo: 'Hyrox-project',
  dataPath: 'data/training.json',
  RAW_BASE: 'https://raw.githubusercontent.com/Bencode92/Hyrox-project/main/',
};

/* ========== GITHUB AUTH ========== */
function hasGHToken() { return !!GH.token; }

function loadGHToken() {
  const s = sessionStorage.getItem('hf_gh_token');
  if (s) { GH.token = s; return true; }
  return false;
}

function saveGHToken(t) {
  GH.token = t;
  sessionStorage.setItem('hf_gh_token', t);
}

function requireGHToken(action) {
  if (hasGHToken()) { action(); return; }
  if (loadGHToken()) { updateGHStatus(); action(); return; }
  window._pendingAction = action;
  document.getElementById('gh-token-modal').classList.remove('hidden');
  document.getElementById('modal-gh-token').focus();
}

function confirmGHToken() {
  const t = document.getElementById('modal-gh-token').value.trim();
  if (!t) return;
  saveGHToken(t);
  document.getElementById('gh-token-modal').classList.add('hidden');
  document.getElementById('modal-gh-token').value = '';
  updateGHStatus();
  if (window._pendingAction) {
    const a = window._pendingAction;
    window._pendingAction = null;
    a();
  }
}

function cancelGHToken() {
  document.getElementById('gh-token-modal').classList.add('hidden');
  window._pendingAction = null;
}

function updateGHStatus() {
  const el = document.getElementById('ghStatus');
  if (!el) return;
  if (hasGHToken()) {
    el.innerHTML = '<span style="color:var(--accent-2)">✓ GitHub sync</span>';
  } else {
    el.innerHTML = '<span style="color:var(--text-muted)">📖 Local only</span>';
  }
}

/* ========== GITHUB API ========== */
async function ghGetRaw(path) {
  const r = await fetch(GH.RAW_BASE + path + '?t=' + Date.now());
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

async function ghGetSha(path) {
  try {
    const r = await fetch('https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + path, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!r.ok) return null;
    return (await r.json()).sha;
  } catch { return null; }
}

async function ghPut(path, content, msg, sha) {
  if (!GH.token) throw new Error('Token requis');
  const jsonStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  const body = { message: msg, content: btoa(binary) };
  if (sha) body.sha = sha;
  const r = await fetch('https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + GH.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || r.statusText);
  }
  return r.json();
}

/* ========== SYNC ENGINE ========== */
let _saveRunning = false, _savePending = false;

async function syncToGitHub() {
  if (!hasGHToken()) return;
  if (_saveRunning) { _savePending = true; return; }
  _saveRunning = true;
  try {
    const sha = await ghGetSha(GH.dataPath);
    const data = {
      version: 2,
      lastUpdated: new Date().toISOString(),
      tests: Storage.getTests(),
      sessions: Storage.getSessions(),
      scores: Storage.getScoreHistory(),
      settings: Storage.getSettings(),
    };
    await ghPut(GH.dataPath, data, '💾 Sync training data — ' + new Date().toLocaleDateString('fr-FR'), sha);
    console.log('[HyroxForge] Synced to GitHub');
  } catch (e) {
    console.error('[HyroxForge] GitHub sync error:', e);
  }
  _saveRunning = false;
  if (_savePending) { _savePending = false; await syncToGitHub(); }
}

async function pullFromGitHub() {
  try {
    const data = await ghGetRaw(GH.dataPath);
    if (!data || data.version < 1) return false;

    // Merge: GitHub data wins if more recent
    const localSessions = Storage.getSessions();
    const remoteSessions = data.sessions || [];

    if (remoteSessions.length > localSessions.length) {
      localStorage.setItem('hf_sessions', JSON.stringify(remoteSessions));
      console.log('[HyroxForge] Pulled ' + remoteSessions.length + ' sessions from GitHub');
    }

    if (data.tests) localStorage.setItem('hf_tests', JSON.stringify(data.tests));
    if (data.scores && data.scores.length > (Storage.getScoreHistory() || []).length) {
      localStorage.setItem('hf_scores', JSON.stringify(data.scores));
    }
    if (data.settings) {
      const local = Storage.getSettings();
      // Keep local worker URL if set
      const merged = { ...data.settings, workerUrl: local.workerUrl || data.settings.workerUrl };
      localStorage.setItem('hf_settings', JSON.stringify(merged));
    }

    return true;
  } catch (e) {
    console.log('[HyroxForge] No remote data yet or fetch failed:', e.message);
    return false;
  }
}

/* ========== STORAGE (localStorage — offline first) ========== */
const Storage = {
  /* Sessions */
  getSessions() {
    try { return JSON.parse(localStorage.getItem('hf_sessions')) || []; }
    catch { return []; }
  },

  getSessionsByType(type) {
    return this.getSessions().filter(s => s.type === type);
  },

  getSessionsThisWeek() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return this.getSessions().filter(s => new Date(s.date) >= monday);
  },

  saveSession(session) {
    const sessions = this.getSessions();
    session.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    session.createdAt = new Date().toISOString();
    sessions.unshift(session);
    localStorage.setItem('hf_sessions', JSON.stringify(sessions));
    // Auto-sync to GitHub
    syncToGitHub();
    return session;
  },

  /* Tests */
  getTests() {
    try { return JSON.parse(localStorage.getItem('hf_tests')); }
    catch { return null; }
  },

  /* Score History */
  getScoreHistory() {
    try { return JSON.parse(localStorage.getItem('hf_scores')) || []; }
    catch { return []; }
  },

  addScoreSnapshot(snapshot) {
    const history = this.getScoreHistory();
    snapshot.date = new Date().toISOString();
    history.push(snapshot);
    // Keep last 100 snapshots
    if (history.length > 100) history.splice(0, history.length - 100);
    localStorage.setItem('hf_scores', JSON.stringify(history));
    // Auto-sync
    syncToGitHub();
  },

  /* Settings */
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem('hf_settings')) || {
        workerUrl: '',
        goalSpeed: 15,
        compDate: '',
        weight: 75,
      };
    } catch {
      return { workerUrl: '', goalSpeed: 15, compDate: '', weight: 75 };
    }
  },

  saveSettings(settings) {
    localStorage.setItem('hf_settings', JSON.stringify(settings));
    syncToGitHub();
  },

  /* Export for AI Coach */
  exportForAI() {
    const sessions = this.getSessions().slice(0, 20);
    const scores = this.getScoreHistory().slice(-10);
    const tests = this.getTests();
    const settings = this.getSettings();
    return {
      sessions: sessions.map(s => ({
        date: s.date, type: s.type, sessionType: s.sessionType,
        distance: s.distance, duration: s.duration, pace: s.pace,
        speedKmh: s.speedKmh, rpe: s.rpe, pain: s.pain,
        vest: s.vest, vestKg: s.vestKg,
      })),
      recentScores: scores,
      tests: tests ? {
        run: { vma: tests.run?.vma, speedKmh: tests.run?.speedKmh, testType: tests.run?.testType },
        row: { time1000: tests.row?.time1000 },
        ski: { time1000: tests.ski?.time1000 },
      } : null,
      goalSpeed: settings.goalSpeed,
      compDate: settings.compDate,
      weight: settings.weight,
    };
  },

  /* Reset */
  resetAll() {
    localStorage.removeItem('hf_sessions');
    localStorage.removeItem('hf_scores');
    localStorage.removeItem('hf_settings');
    localStorage.removeItem('hf_tests');
    localStorage.removeItem('hf_weekplan');
  },
};

/* Init: try to pull from GitHub on load */
document.addEventListener('DOMContentLoaded', () => {
  loadGHToken();
  updateGHStatus();
  if (hasGHToken()) {
    pullFromGitHub().then(pulled => {
      if (pulled) {
        console.log('[HyroxForge] Data loaded from GitHub');
        // Refresh UI if app is ready
        if (typeof App !== 'undefined' && App.refreshDashboard) {
          App.refreshDashboard();
          App.renderZones();
        }
      }
    });
  }
});
