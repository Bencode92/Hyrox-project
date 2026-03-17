/* HyroxForge \u2014 App Controller v2 */
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
    if (!Training.hasTests()) document.getElementById('onboarding').classList.remove('hidden');
    this.renderZones();
  },

  saveOnboarding() {
    const runSpeed = parseFloat(document.getElementById('obRunSpeed').value) || 12;
    const rowSec = Training.parseTime(document.getElementById('obRowMin').value, document.getElementById('obRowSec').value) || 270;
    const skiSec = Training.parseTime(document.getElementById('obSkiMin').value, document.getElementById('obSkiSec').value) || 270;
    Training.saveTestResults(runSpeed, rowSec, skiSec);
    document.getElementById('onboarding').classList.add('hidden');
    this.toast('Zones calcul\u00e9es ! VMA: ' + runSpeed + ' km/h', 'success');
    this.renderZones();
    this.refreshDashboard();
  },

  renderZones() {
    const zones = Training.getZonesSummary();
    if (!zones) { document.getElementById('zonesCard').style.display = 'none'; return; }
    document.getElementById('zonesCard').style.display = 'block';
    const r = zones.run;
    document.getElementById('zonesContent').innerHTML = '<div style="display:grid;gap:6px;font-size:12px">' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--accent-dim);border-radius:6px"><span style="color:var(--accent)">\ud83c\udfc3 VMA</span><span style="font-weight:600">' + r.vma + ' km/h</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg-input);border-radius:6px"><span>Z2 endurance</span><span>' + Training.fmtSpeed(r.z2.min) + '-' + Training.fmtSpeed(r.z2.max) + ' km/h (' + Training.fmtPace(r.z2.pace_min) + '-' + Training.fmtPace(r.z2.pace_max) + '/km)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg-input);border-radius:6px"><span>Tempo</span><span>' + Training.fmtSpeed(r.tempo.min) + '-' + Training.fmtSpeed(r.tempo.max) + ' km/h</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg-input);border-radius:6px"><span>Fractionn\u00e9 court</span><span>' + Training.fmtSpeed(r.iv_short.min) + '-' + Training.fmtSpeed(r.iv_short.max) + ' km/h</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg-input);border-radius:6px"><span>\ud83d\udea3 Row test</span><span>' + Training.fmtPace(zones.row.testPace500) + '/500m</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg-input);border-radius:6px"><span>\u26f7\ufe0f Ski test</span><span>' + Training.fmtPace(zones.ski.testPace500) + '/500m</span></div>' +
    '</div>';
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'dashboard') this.refreshDashboard();
    if (tab === 'history') this.refreshHistory();
    if (tab === 'log') LogForm.showSuggestion();
  },

  refreshDashboard() {
    const score = Scoring.computeGlobal();
    Charts.drawScoreRing(score.global);
    document.getElementById('globalScore').textContent = score.global;
    const history = Storage.getScoreHistory();
    const trendEl = document.getElementById('scoreTrend');
    if (history.length >= 2) {
      const prev = history[history.length - 2].global, diff = score.global - prev;
      if (diff > 0) { trendEl.className = 'score-trend trend-up'; trendEl.textContent = '+' + diff + ' pts'; }
      else if (diff < 0) { trendEl.className = 'score-trend trend-down'; trendEl.textContent = diff + ' pts'; }
      else { trendEl.className = 'score-trend trend-stable'; trendEl.textContent = 'Stable'; }
    } else trendEl.textContent = '';
    const p = score.pillars;
    document.getElementById('runScore').innerHTML = p.run.weighted + '<small>/' + p.run.max + '</small>';
    document.getElementById('rowScore').innerHTML = p.row.weighted + '<small>/' + p.row.max + '</small>';
    document.getElementById('skiScore').innerHTML = p.ski.weighted + '<small>/' + p.ski.max + '</small>';
    document.getElementById('runDetail').textContent = p.run.speedKmh ? p.run.speedKmh.toFixed(1) + ' km/h' : 'Pas de donn\u00e9es';
    document.getElementById('rowDetail').textContent = p.row.pace ? Scoring.formatPace(p.row.pace) + '/1000m' : 'Pas de donn\u00e9es';
    document.getElementById('skiDetail').textContent = p.ski.pace ? Scoring.formatPace(p.ski.pace) + '/1000m' : 'Pas de donn\u00e9es';
    const ws = Storage.getSessionsThisWeek();
    document.getElementById('weekSessions').textContent = ws.length;
    document.getElementById('weekDistance').textContent = ws.reduce((a,s) => a+(s.distance||0), 0).toFixed(1);
    document.getElementById('weekTime').textContent = Math.round(ws.reduce((a,s) => a+(s.duration||0), 0));
    document.getElementById('weekRPE').textContent = ws.length ? (ws.reduce((a,s) => a+(s.rpe||0), 0)/ws.length).toFixed(1) : '--';
    Charts.renderProgressChart();
  },

  refreshHistory(filter) { filter = filter || 'all'; Charts.renderHistoryChart(filter); this.renderSessionList(filter); },
  renderSessionList(filter) {
    const container = document.getElementById('sessionList');
    const sessions = filter === 'all' ? Storage.getSessions() : Storage.getSessionsByType(filter);
    if (!sessions.length) { container.innerHTML = '<div class="empty-state">Aucune s\u00e9ance</div>'; return; }
    container.innerHTML = sessions.slice(0,50).map(s => {
      const score = Scoring.scoreSession(s), delta = Scoring.computeDelta(s);
      const date = new Date(s.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
      const stLabel = Scoring.getSessionTypeLabel(s.sessionType);
      const paceStr = s.pace ? Scoring.formatPace(s.pace) : '\u2014';
      const unit = s.type==='run' ? '/km' : '/500m';
      let deltaHtml = '';
      if (delta) { deltaHtml = '<span class="session-delta '+(delta.improved?'delta-up':'delta-down')+'">'+(delta.improved?'':'+') + delta.seconds.toFixed(0) + 's</span>'; }
      return '<div class="session-item"><div class="session-type-badge badge-'+s.type+'">'+Scoring.getTypeEmoji(s.type)+'</div><div class="session-info"><div class="session-main"><span class="session-title">'+stLabel+'</span><span class="session-score">'+(score!=null?score:'\u2014')+'</span></div><div class="session-meta">'+date+' \u00b7 '+(s.distance?s.distance+'km ':'')+paceStr+unit+' \u00b7 RPE '+s.rpe+(s.vest?' \u00b7 \ud83e\uddf6'+s.vestKg+'kg':'')+' '+deltaHtml+'</div></div></div>';
    }).join('');
  },

  openSettings() { document.getElementById('settingsModal').classList.remove('hidden'); },
  closeSettings() { document.getElementById('settingsModal').classList.add('hidden'); },
  saveSettings() {
    Storage.saveSettings({ workerUrl: document.getElementById('settingsWorkerUrl').value.trim(), goalSpeed: parseFloat(document.getElementById('settingsGoalSpeed').value)||15, compDate: document.getElementById('settingsCompDate').value, weight: parseFloat(document.getElementById('settingsWeight').value)||75 });
    this.closeSettings(); this.toast('Sauvegard\u00e9', 'success');
  },
  resetData() { if (confirm('Supprimer toutes les donn\u00e9es ?')) { Storage.resetAll(); localStorage.removeItem('hf_tests'); location.reload(); } },
  toast(msg, type) { const c = document.getElementById('toastContainer'); const t = document.createElement('div'); t.className = 'toast toast-'+(type||'info'); t.textContent = msg; c.appendChild(t); setTimeout(()=>t.remove(), 3000); },
};

/* Log Form */
const LogForm = {
  type: 'run', location: 'outdoor',
  init() { this.updateRPE(5); this.updatePain(0); this.updateFormForType(); },
  setType(type) { this.type = type; document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type===type)); this.updateFormForType(); this.showSuggestion(); },
  updateFormForType() {
    const dl = document.getElementById('distanceLabel'), lt = document.getElementById('locationToggle');
    if (this.type==='run') { dl.textContent='Distance (km)'; lt.parentElement.classList.remove('hidden'); }
    else { dl.textContent='Distance (m)'; lt.parentElement.classList.add('hidden'); this.location='gym'; }
    const sel = document.getElementById('logSessionType');
    const opts = { run: ['z2','tempo','intervals_short','intervals_long','long_run','test'], row: ['technique','power','endurance','test'], ski: ['technique','power','endurance','test'] };
    sel.innerHTML = opts[this.type].map(o => '<option value="'+o+'">'+Scoring.getSessionTypeLabel(o)+'</option>').join('');
    sel.onchange = () => { this.updateSessionTypeUI(); this.showSuggestion(); };
    this.updateSessionTypeUI();
  },
  updateSessionTypeUI() { const st = document.getElementById('logSessionType').value; document.getElementById('intervalsDetail').classList.toggle('hidden', st!=='intervals_short' && st!=='intervals_long'); },
  setLocation(loc) { this.location = loc; document.querySelectorAll('#locationToggle .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val===loc)); },
  updateRPE(v) { document.getElementById('rpeValue').textContent = v; document.getElementById('rpeLabel').textContent = Scoring.getRPELabel(parseInt(v)); },
  updatePain(v) { document.getElementById('painValue').textContent = v; document.getElementById('painLabel').textContent = Scoring.getPainLabel(parseInt(v)); },
  toggleVest() { document.getElementById('vestWeight').classList.toggle('hidden', !document.getElementById('logVest').checked); },

  /* ===== SUGGESTION DE S\u00c9ANCE ===== */
  showSuggestion() {
    const box = document.getElementById('sessionSuggestion');
    if (!Training.hasTests()) { box.style.display = 'none'; return; }
    const zones = Training.getZonesSummary();
    const st = document.getElementById('logSessionType').value;
    const week = Training.getCurrentWeek();
    let session;
    if (this.type === 'run') session = Training.generateRunSession(st, zones.run, week);
    else session = Training.generateErgoSession(st, zones[this.type], this.type, week);
    if (!session || !session.main) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    let detailsHtml = '';
    if (session.details) {
      detailsHtml = '<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;margin-top:8px">';
      for (const [k,v] of Object.entries(session.details)) {
        const label = k.replace(/_/g,' ').replace(/^./, c => c.toUpperCase());
        detailsHtml += '<span style="color:var(--text-muted)">'+label+'</span><span style="font-weight:500">'+v+'</span>';
      }
      detailsHtml += '</div>';
    }
    box.innerHTML = '<div style="background:var(--bg-card);border:1px solid var(--accent-dim);border-left:3px solid var(--accent);border-radius:var(--radius-md);padding:12px;margin-bottom:16px">' +
      '<div style="font-family:var(--font-display);font-weight:600;font-size:14px;color:var(--accent);margin-bottom:6px">\u26a1 ' + session.title + '</div>' +
      '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><b>\u00c9chauffement:</b> ' + (session.warmup||'') + '</div>' +
      '<div style="font-size:13px;color:var(--text-primary);line-height:1.5;font-weight:500">' + session.main + '</div>' +
      detailsHtml +
      '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px"><b>Retour au calme:</b> ' + (session.cooldown||'') + '</div>' +
      (session.tip ? '<div style="margin-top:8px;padding:8px 10px;background:var(--accent-dim);border-radius:6px;font-size:12px;color:var(--accent)">\ud83d\udca1 ' + session.tip + '</div>' : '') +
    '</div>';
  },

  save() {
    const date = document.getElementById('logDate').value;
    const sessionType = document.getElementById('logSessionType').value;
    const distanceRaw = parseFloat(document.getElementById('logDistance').value);
    const min = parseInt(document.getElementById('logMin').value)||0;
    const sec = parseInt(document.getElementById('logSec').value)||0;
    const rpe = parseInt(document.getElementById('logRPE').value);
    const pain = parseInt(document.getElementById('logPain').value);
    const vest = document.getElementById('logVest').checked;
    const vestKg = vest ? parseFloat(document.getElementById('logVestKg').value)||0 : 0;
    const notes = document.getElementById('logNotes').value.trim();
    const reps = parseInt(document.getElementById('logReps').value)||null;
    const repDistance = parseInt(document.getElementById('logRepDistance').value)||null;
    const restSec = parseInt(document.getElementById('logRest').value)||null;
    if (!date) { App.toast('Choisis une date','error'); return; }
    if (!distanceRaw||distanceRaw<=0) { App.toast('Indique la distance','error'); return; }
    if (min===0 && sec===0) { App.toast('Indique la dur\u00e9e','error'); return; }
    const durationMin = min+sec/60, durationSec = min*60+sec;
    let distance, pace, speedKmh;
    if (this.type==='run') { distance=distanceRaw; pace=durationSec/distance; speedKmh=distance/(durationMin/60); }
    else { distance=distanceRaw/1000; pace=durationSec/(distanceRaw/500); speedKmh=(distanceRaw/1000)/(durationMin/60); }
    const session = { date, type:this.type, sessionType, location:this.location, distance:Math.round(distance*100)/100, duration:Math.round(durationMin*100)/100, durationSec, pace:Math.round(pace*10)/10, speedKmh:Math.round(speedKmh*100)/100, rpe, pain, vest, vestKg, reps, repDistance, restSec, notes };
    const saved = Storage.saveSession(session);
    const gs = Scoring.computeGlobal();
    Storage.addScoreSnapshot({ global:gs.global, run:gs.breakdown.run, row:gs.breakdown.row, ski:gs.breakdown.ski });
    App.toast('S\u00e9ance enregistr\u00e9e ! Score: '+Scoring.scoreSession(saved)+'/100','success');
    AICoach.analyzeSession(saved);
    ['logDistance','logMin','logSec','logNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('logVest').checked = false;
    document.getElementById('vestWeight').classList.add('hidden');
    document.getElementById('logRPE').value = 5; this.updateRPE(5);
    document.getElementById('logPain').value = 0; this.updatePain(0);
    App.refreshDashboard();
  },
};

const History = { filter(type) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter===type)); App.refreshHistory(type); } };
document.addEventListener('DOMContentLoaded', () => App.init());
