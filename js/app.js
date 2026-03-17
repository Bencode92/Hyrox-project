/* HyroxForge — Main App Controller */
const App = {
  currentTab: 'dashboard',
  init() {
    this.switchTab('dashboard'); this.refreshDashboard(); LogForm.init();
    document.getElementById('logDate').valueAsDate = new Date();
    const s = Storage.getSettings();
    document.getElementById('settingsWorkerUrl').value = s.workerUrl || '';
    document.getElementById('settingsGoalSpeed').value = s.goalSpeed;
    document.getElementById('settingsCompDate').value = s.compDate || '';
    document.getElementById('settingsWeight').value = s.weight || '';
  },
  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'dashboard') this.refreshDashboard();
    if (tab === 'history') this.refreshHistory();
  },
  refreshDashboard() {
    const score = Scoring.computeGlobal();
    Charts.drawScoreRing(score.global);
    document.getElementById('globalScore').textContent = score.global;
    const history = Storage.getScoreHistory();
    const trendEl = document.getElementById('scoreTrend');
    if (history.length >= 2) {
      const prev = history[history.length - 2].global, diff = score.global - prev;
      if (diff > 0) { trendEl.className = 'score-trend trend-up'; trendEl.textContent = '+' + diff + ' pts cette semaine'; }
      else if (diff < 0) { trendEl.className = 'score-trend trend-down'; trendEl.textContent = diff + ' pts cette semaine'; }
      else { trendEl.className = 'score-trend trend-stable'; trendEl.textContent = 'Stable'; }
    } else { trendEl.textContent = ''; }
    const p = score.pillars;
    document.getElementById('runScore').innerHTML = p.run.weighted + '<small>/' + p.run.max + '</small>';
    document.getElementById('rowScore').innerHTML = p.row.weighted + '<small>/' + p.row.max + '</small>';
    document.getElementById('skiScore').innerHTML = p.ski.weighted + '<small>/' + p.ski.max + '</small>';
    document.getElementById('runDetail').textContent = p.run.speedKmh ? p.run.speedKmh.toFixed(1) + ' km/h' : 'Pas de données';
    document.getElementById('rowDetail').textContent = p.row.pace ? Scoring.formatPace(p.row.pace) + '/1000m' : 'Pas de données';
    document.getElementById('skiDetail').textContent = p.ski.pace ? Scoring.formatPace(p.ski.pace) + '/1000m' : 'Pas de données';
    const weekSessions = Storage.getSessionsThisWeek();
    document.getElementById('weekSessions').textContent = weekSessions.length;
    document.getElementById('weekDistance').textContent = weekSessions.reduce((a, s) => a + (s.distance || 0), 0).toFixed(1);
    document.getElementById('weekTime').textContent = Math.round(weekSessions.reduce((a, s) => a + (s.duration || 0), 0));
    document.getElementById('weekRPE').textContent = weekSessions.length ? (weekSessions.reduce((a, s) => a + (s.rpe || 0), 0) / weekSessions.length).toFixed(1) : '--';
    Charts.renderProgressChart();
  },
  refreshHistory(filter) { filter = filter || 'all'; Charts.renderHistoryChart(filter); this.renderSessionList(filter); },
  renderSessionList(filter) {
    const container = document.getElementById('sessionList');
    const sessions = filter === 'all' ? Storage.getSessions() : Storage.getSessionsByType(filter);
    if (sessions.length === 0) { container.innerHTML = '<div class="empty-state">Aucune séance enregistrée</div>'; return; }
    container.innerHTML = sessions.slice(0, 50).map(s => {
      const score = Scoring.scoreSession(s), delta = Scoring.computeDelta(s);
      const date = new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const stLabel = Scoring.getSessionTypeLabel(s.sessionType);
      const paceStr = s.pace ? Scoring.formatPace(s.pace) : '\u2014';
      const unit = s.type === 'run' ? '/km' : '/500m';
      const speedStr = s.speedKmh ? s.speedKmh.toFixed(1) + ' km/h' : '';
      let deltaHtml = '';
      if (delta) { const cls = delta.improved ? 'delta-up' : 'delta-down'; const sign = delta.improved ? '' : '+'; deltaHtml = '<span class="session-delta ' + cls + '">' + sign + delta.seconds.toFixed(0) + 's</span>'; }
      return '<div class="session-item" data-id="' + s.id + '"><div class="session-type-badge badge-' + s.type + '">' + Scoring.getTypeEmoji(s.type) + '</div><div class="session-info"><div class="session-main"><span class="session-title">' + stLabel + '</span><span class="session-score">' + (score ?? '\u2014') + '</span></div><div class="session-meta">' + date + ' \u00b7 ' + (s.distance ? s.distance + 'km' : '') + ' \u00b7 ' + paceStr + unit + ' ' + (speedStr ? '\u00b7 ' + speedStr : '') + ' \u00b7 RPE ' + s.rpe + (s.vest ? ' \u00b7 \ud83e\uddf6' + s.vestKg + 'kg' : '') + ' ' + deltaHtml + '</div></div></div>';
    }).join('');
  },
  openSettings() { document.getElementById('settingsModal').classList.remove('hidden'); },
  closeSettings() { document.getElementById('settingsModal').classList.add('hidden'); },
  saveSettings() {
    const settings = { workerUrl: document.getElementById('settingsWorkerUrl').value.trim(), goalSpeed: parseFloat(document.getElementById('settingsGoalSpeed').value) || 15, compDate: document.getElementById('settingsCompDate').value, weight: parseFloat(document.getElementById('settingsWeight').value) || 75 };
    Storage.saveSettings(settings); this.closeSettings(); this.toast('Paramètres sauvegardés', 'success');
  },
  resetData() { if (confirm('Supprimer toutes les données ?')) { Storage.resetAll(); this.refreshDashboard(); this.toast('Données réinitialisées', 'info'); this.closeSettings(); } },
  toast(message, type) { type = type || 'info'; const container = document.getElementById('toastContainer'); const toast = document.createElement('div'); toast.className = 'toast toast-' + type; toast.textContent = message; container.appendChild(toast); setTimeout(() => toast.remove(), 3000); },
};

/* Log Form Controller */
const LogForm = {
  type: 'run', location: 'outdoor',
  init() { this.updateRPE(5); this.updatePain(0); this.updateFormForType(); },
  setType(type) { this.type = type; document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type)); this.updateFormForType(); },
  updateFormForType() {
    const distLabel = document.getElementById('distanceLabel');
    const locationToggle = document.getElementById('locationToggle');
    if (this.type === 'run') { distLabel.textContent = 'Distance (km)'; locationToggle.parentElement.classList.remove('hidden'); }
    else { distLabel.textContent = 'Distance (m)'; locationToggle.parentElement.classList.add('hidden'); this.location = 'gym'; }
    const select = document.getElementById('logSessionType');
    const options = { run: ['z2','tempo','intervals_short','intervals_long','long_run','test'], row: ['technique','power','endurance','test'], ski: ['technique','power','endurance','test'] };
    select.innerHTML = options[this.type].map(opt => '<option value="' + opt + '">' + Scoring.getSessionTypeLabel(opt) + '</option>').join('');
    select.onchange = () => this.updateSessionTypeUI(); this.updateSessionTypeUI();
  },
  updateSessionTypeUI() { const st = document.getElementById('logSessionType').value; document.getElementById('intervalsDetail').classList.toggle('hidden', st !== 'intervals_short' && st !== 'intervals_long'); },
  setLocation(loc) { this.location = loc; document.querySelectorAll('#locationToggle .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === loc)); },
  updateRPE(val) { document.getElementById('rpeValue').textContent = val; document.getElementById('rpeLabel').textContent = Scoring.getRPELabel(parseInt(val)); },
  updatePain(val) { document.getElementById('painValue').textContent = val; document.getElementById('painLabel').textContent = Scoring.getPainLabel(parseInt(val)); },
  toggleVest() { document.getElementById('vestWeight').classList.toggle('hidden', !document.getElementById('logVest').checked); },
  save() {
    const date = document.getElementById('logDate').value;
    const sessionType = document.getElementById('logSessionType').value;
    const distanceRaw = parseFloat(document.getElementById('logDistance').value);
    const min = parseInt(document.getElementById('logMin').value) || 0;
    const sec = parseInt(document.getElementById('logSec').value) || 0;
    const rpe = parseInt(document.getElementById('logRPE').value);
    const pain = parseInt(document.getElementById('logPain').value);
    const vest = document.getElementById('logVest').checked;
    const vestKg = vest ? parseFloat(document.getElementById('logVestKg').value) || 0 : 0;
    const notes = document.getElementById('logNotes').value.trim();
    const reps = parseInt(document.getElementById('logReps').value) || null;
    const repDistance = parseInt(document.getElementById('logRepDistance').value) || null;
    const restSec = parseInt(document.getElementById('logRest').value) || null;
    if (!date) { App.toast('Choisis une date', 'error'); return; }
    if (!distanceRaw || distanceRaw <= 0) { App.toast('Indique la distance', 'error'); return; }
    if (min === 0 && sec === 0) { App.toast('Indique la durée', 'error'); return; }
    const durationMin = min + sec / 60, durationSec = min * 60 + sec;
    let distance, pace, speedKmh;
    if (this.type === 'run') { distance = distanceRaw; pace = durationSec / distance; speedKmh = distance / (durationMin / 60); }
    else { distance = distanceRaw / 1000; pace = durationSec / (distanceRaw / 500); speedKmh = (distanceRaw / 1000) / (durationMin / 60); }
    const session = { date, type: this.type, sessionType, location: this.location, distance: Math.round(distance * 100) / 100, duration: Math.round(durationMin * 100) / 100, durationSec, pace: Math.round(pace * 10) / 10, speedKmh: Math.round(speedKmh * 100) / 100, rpe, pain, vest, vestKg, reps, repDistance, restSec, notes };
    const saved = Storage.saveSession(session);
    const globalScore = Scoring.computeGlobal();
    Storage.addScoreSnapshot({ global: globalScore.global, run: globalScore.breakdown.run, row: globalScore.breakdown.row, ski: globalScore.breakdown.ski });
    const score = Scoring.scoreSession(saved);
    App.toast('Séance enregistrée ! Score: ' + score + '/100', 'success');
    AICoach.analyzeSession(saved);
    document.getElementById('logDistance').value = ''; document.getElementById('logMin').value = ''; document.getElementById('logSec').value = '';
    document.getElementById('logNotes').value = ''; document.getElementById('logVest').checked = false;
    document.getElementById('vestWeight').classList.add('hidden');
    document.getElementById('logRPE').value = 5; this.updateRPE(5);
    document.getElementById('logPain').value = 0; this.updatePain(0);
    App.refreshDashboard();
  },
};

const History = { filter(type) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === type)); App.refreshHistory(type); } };
document.addEventListener('DOMContentLoaded', () => { App.init(); });
