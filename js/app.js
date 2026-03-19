/* HyroxForge — App v8 — Date de début personnalisable + plan auto-update */
const App = {
  currentTab: 'dashboard',
  planLaunched: false,

  init() {
    this.switchTab('dashboard'); this.refreshDashboard(); LogForm.init();
    document.getElementById('logDate').valueAsDate = new Date();
    const s = Storage.getSettings();
    if (!s.workerUrl) { s.workerUrl = AICoach.PROXY; Storage.saveSettings(s); }
    document.getElementById('settingsWorkerUrl').value = s.workerUrl;
    document.getElementById('settingsGoalSpeed').value = s.goalSpeed;
    document.getElementById('settingsCompDate').value = s.compDate || '';
    document.getElementById('settingsWeight').value = s.weight || '';
    this.planLaunched = !!localStorage.getItem('hf_plan_launched');
    if (!Training.hasTests()) {
      document.getElementById('onboarding').classList.remove('hidden');
    } else if (!this.planLaunched) {
      this.showLaunchScreen();
    } else {
      this.populateTestFields();
    }
    this.renderZones(); this.renderWeekPlan();
  },

  populateTestFields() {
    const t = Training.getTestResults();
    if (!t) return;
    document.getElementById('obRunSpeed').value = t.run.speedKmh || 12;
    if (t.run.testType === 'demicooper' && document.getElementById('obCooperDist')) {
      document.getElementById('obCooperDist').value = Math.round((t.run.vma || 12) * 100);
    }
    const rowMin = Math.floor((t.row.time1000 || 270) / 60);
    const rowSec = Math.round((t.row.time1000 || 270) % 60);
    document.getElementById('obRowMin').value = rowMin;
    document.getElementById('obRowSec').value = rowSec;
    const skiMin = Math.floor((t.ski.time1000 || 270) / 60);
    const skiSec = Math.round((t.ski.time1000 || 270) % 60);
    document.getElementById('obSkiMin').value = skiMin;
    document.getElementById('obSkiSec').value = skiSec;
  },

  saveOnboarding() {
    const testType = document.querySelector('input[name="testType"]:checked');
    const type = testType ? testType.value : '1km';
    let runSpeed;
    if (type === 'demicooper') {
      const dist = parseFloat(document.getElementById('obCooperDist').value) || 1200;
      runSpeed = Training.demiCooperToVMA(dist);
    } else {
      runSpeed = parseFloat(document.getElementById('obRunSpeed').value) || 12;
    }
    const rw = Training.parseTime(document.getElementById('obRowMin').value, document.getElementById('obRowSec').value) || 270;
    const sk = Training.parseTime(document.getElementById('obSkiMin').value, document.getElementById('obSkiSec').value) || 270;
    const data = Training.saveTestResults(runSpeed, rw, sk, type);
    document.getElementById('onboarding').classList.add('hidden');
    const label = type === 'demicooper' ? 'demi-Cooper' : 'test 1km \u00d7 0.95';
    this.toast('VMA: ' + data.run.vma + ' km/h (' + label + ')', 'success');
    if (!this.planLaunched) {
      this.showLaunchScreen();
    } else {
      localStorage.removeItem('hf_weekplan');
      this.renderZones(); this.renderWeekPlan(); this.refreshDashboard();
      this.toast('Zones recalcul\u00e9es + plan mis \u00e0 jour', 'success');
    }
  },

  /* ===== \u00c9CRAN DE LANCEMENT ===== */
  showLaunchScreen() {
    const zones = Training.getZonesSummary();
    if (!zones) return;
    const r = zones.run;
    const rowP = Training.fmtP(zones.row.testPace500);
    const skiP = Training.fmtP(zones.ski.testPace500);
    const today = new Date().toISOString().split('T')[0];

    const el = document.getElementById('launchScreen');
    el.classList.remove('hidden');
    el.innerHTML = '<div class="onboarding-card" style="max-width:420px">' +
      '<h2 style="margin-bottom:12px">\ud83c\udfc1 Ton plan est <span>pr\u00eat</span></h2>' +
      '<p style="color:var(--text-secondary);font-size:12px;margin-bottom:16px">V\u00e9rifie tes valeurs et choisis ta date de d\u00e9but.</p>' +

      '<div style="display:grid;gap:6px;margin-bottom:16px;font-size:12px">' +
        '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--accent-dim);border-radius:8px"><span style="color:var(--accent)">\ud83c\udfc3 VMA</span><span style="font-weight:700">' + r.vma + ' km/h</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-input);border-radius:8px"><span>Z2</span><span>' + Training.fmtS(r.z2.min) + '-' + Training.fmtS(r.z2.max) + ' km/h</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-input);border-radius:8px"><span>Tempo</span><span>' + Training.fmtS(r.tempo.min) + '-' + Training.fmtS(r.tempo.max) + ' km/h</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-input);border-radius:8px"><span>\ud83d\udea3 Row</span><span>' + rowP + '/500m</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-input);border-radius:8px"><span>\u26f7\ufe0f Ski</span><span>' + skiP + '/500m</span></div>' +
      '</div>' +

      '<div style="margin-bottom:16px">' +
        '<label style="font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:5px">\ud83d\udcc5 Date de d\u00e9but du plan</label>' +
        '<input type="date" id="launchDate" class="form-input" value="' + today + '" style="font-size:14px">' +
      '</div>' +

      '<div style="padding:10px 12px;background:var(--bg-input);border-radius:8px;margin-bottom:16px;font-size:11px;color:var(--text-secondary)">' +
        '<div>\u2022 Sem 1-8 : 4 s\u00e9ances/sem max (tendon)</div>' +
        '<div>\u2022 Row : technique pure les 4 premi\u00e8res semaines</div>' +
        '<div>\u2022 D\u00e9charge automatique sem 4, 8, 12, 16, 20, 24</div>' +
        '<div>\u2022 Adaptation en temps r\u00e9el selon tes RPE</div>' +
      '</div>' +

      '<button class="btn-primary" onclick="App.launchPlan()" style="font-size:16px;padding:16px">\ud83d\ude80 Lancer le plan</button>' +
      '<button onclick="App.openEditTests()" style="width:100%;margin-top:8px;padding:10px;background:none;border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text-secondary);font-size:13px;cursor:pointer">\u270e Modifier mes valeurs</button>' +
    '</div>';
  },

  /* ===== LANCER LE PLAN ===== */
  launchPlan() {
    const dateInput = document.getElementById('launchDate');
    const startDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const startISO = new Date(startDate + 'T00:00:00').toISOString();

    this.planLaunched = true;
    localStorage.setItem('hf_plan_launched', startISO);

    // Set la date de d\u00e9but des tests = date choisie
    const t = Training.getTestResults();
    if (t) {
      t.run.date = startISO;
      t.row.date = startISO;
      t.ski.date = startISO;
      localStorage.setItem('hf_tests', JSON.stringify(t));
    }
    localStorage.removeItem('hf_weekplan');
    document.getElementById('launchScreen').classList.add('hidden');
    this.renderZones(); this.renderWeekPlan(); this.refreshDashboard();

    const dateStr = new Date(startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    this.toast('\ud83d\ude80 Plan lanc\u00e9 ! D\u00e9but: ' + dateStr, 'success');
  },

  openEditTests() {
    document.getElementById('launchScreen').classList.add('hidden');
    this.populateTestFields();
    document.getElementById('onboarding').classList.remove('hidden');
  },

  renderZones() {
    const z = Training.getZonesSummary();
    if (!z) { document.getElementById('zonesCard').style.display = 'none'; return; }
    if (!this.planLaunched) { document.getElementById('zonesCard').style.display = 'none'; return; }
    document.getElementById('zonesCard').style.display = 'block';
    const r = z.run, w = Training.getCurrentWeek();
    const maxSess = Training.getMaxSessionsPerWeek(w);
    const rowPhase = Training.getRowPhaseLabel(w);

    // Date de lancement
    const launchDate = localStorage.getItem('hf_plan_launched');
    const launchStr = launchDate ? new Date(launchDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    const dl = Training.isDeloadWeek(w)
      ? '<div style="padding:5px 8px;background:rgba(240,160,48,.12);border-radius:6px;color:#f0a030;font-weight:600;font-size:11px">\u26a1 D\u00c9CHARGE sem '+(w+1)+'</div>'
      : '<div style="padding:5px 8px;background:var(--bg-input);border-radius:6px;color:var(--text-muted);font-size:11px">Sem '+(w+1)+' \u2014 '+maxSess+' s\u00e9ances max' + (launchStr ? ' \u2014 d\u00e9but ' + launchStr : '') + '</div>';

    const tests = Training.getTestResults();
    const testInfo = tests ? '<div style="padding:5px 8px;background:var(--bg-input);border-radius:6px;font-size:10px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center"><span>\ud83c\udfc3 '+tests.run.speedKmh+' km/h \u00b7 \ud83d\udea3 '+Training.fmtP(z.row.testPace500)+'/500m \u00b7 \u26f7\ufe0f '+Training.fmtP(z.ski.testPace500)+'/500m</span><button onclick="App.openEditTests()" style="background:none;border:1px solid var(--accent-dim);color:var(--accent);font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer">\u270e</button></div>' : '';

    document.getElementById('zonesContent').innerHTML='<div style="display:grid;gap:4px;font-size:11px">'+dl+testInfo+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--accent-dim);border-radius:6px"><span style="color:var(--accent)">\ud83c\udfc3 VMA</span><span style="font-weight:600">'+r.vma+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Z2</span><span>'+Training.fmtS(r.z2.min)+'-'+Training.fmtS(r.z2.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Tempo</span><span>'+Training.fmtS(r.tempo.min)+'-'+Training.fmtS(r.tempo.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Frac court</span><span>'+Training.fmtS(r.iv_short.min)+'-'+Training.fmtS(r.iv_short.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>\ud83d\udea3 Row</span><span>'+Training.fmtP(z.row.testPace500)+'/500m \u2014 <em>'+rowPhase+'</em></span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>\u26f7\ufe0f Ski</span><span>'+Training.fmtP(z.ski.testPace500)+'/500m</span></div>'+
    '</div>';
  },

  renderWeekPlan() {
    const zones = Training.getZonesSummary();
    if (!zones || !this.planLaunched) { document.getElementById('planCard').style.display='none'; return; }
    document.getElementById('planCard').style.display='block';

    const pos = Planner.getPlanPosition();
    const weekNum = pos.week;
    let plan = Planner.getSavedPlan();
    if (!plan) { plan = Planner.generate(zones, weekNum); Planner.savePlan(plan); }

    // Re-check done status against actual sessions
    const doneSessions = Planner.getSessionsThisPlanWeek();
    plan.forEach((d, i) => {
      if (d.session) {
        d.done = Planner.isSessionDone(d.exerciseType, d.sessionType, doneSessions, i);
        d.skipped = Planner.isSkipped(weekNum, i);
      }
    });

    const deload = Training.isDeloadWeek(weekNum);
    const maxSess = Training.getMaxSessionsPerWeek(weekNum);
    const doneCount = plan.filter(d => d.done).length;
    const totalSess = plan.filter(d => d.slot !== 'rest').length;
    const progressPct = totalSess > 0 ? Math.round(doneCount / totalSess * 100) : 0;

    // Week badge
    const deloadBadge = deload ? ' <span class="plan-deload-badge">\u26a1 D\u00c9CHARGE</span>' : '';
    document.querySelector('#planCard .plan-title span').innerHTML =
      'Semaine ' + (weekNum + 1) + deloadBadge +
      '<span class="plan-progress-text">' + doneCount + '/' + totalSess + '</span>';

    // Progress bar
    let progressBar = document.getElementById('planProgress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'planProgress';
      progressBar.className = 'plan-progress-bar';
      document.querySelector('#planCard .plan-title').after(progressBar);
    }
    progressBar.innerHTML = '<div class="plan-progress-fill" style="width:' + progressPct + '%"></div>';

    document.getElementById('planDays').innerHTML = plan.map((d, i) => {
      const isToday = i === pos.dayInWeek;
      const isPast = i < pos.dayInWeek;
      const isFuture = i > pos.dayInWeek;

      const emoji = d.slot === 'rest' ? '\ud83d\udca4' : d.exerciseType === 'run' ? '\ud83c\udfc3' : d.exerciseType === 'row' ? '\ud83d\udea3' : '\u26f7\ufe0f';
      const title = d.session ? d.session.title : d.label;
      const meta = d.session && d.session.details ? Object.values(d.session.details).slice(0, 2).join(' \u00b7 ') : (d.slot === 'rest' ? 'R\u00e9cup' : '');

      // Status icon and class
      let statusIcon = '', statusClass = '';
      if (d.slot === 'rest') {
        statusClass = ' rest';
      } else if (d.done) {
        statusIcon = '<div class="plan-status plan-status-done">\u2713</div>';
        statusClass = ' done';
      } else if (d.skipped) {
        statusIcon = '<div class="plan-status plan-status-skip">\u2717</div>';
        statusClass = ' skipped';
      } else if (isToday) {
        statusIcon = '<div class="plan-status plan-status-today">\ud83d\udccd</div>';
        statusClass = ' today';
      } else if (isFuture) {
        statusIcon = '<div class="plan-status plan-status-pending">\u23f3</div>';
        statusClass = ' pending';
      } else if (isPast) {
        statusIcon = '<div class="plan-status plan-status-missed">!</div>';
        statusClass = ' missed';
      }

      // AI modified badge
      const aiTag = d.aiModified ? '<span class="plan-ai-tag">\ud83e\udd16</span>' : '';

      // Skip button (only for non-rest, non-done, non-skipped, today or past)
      let skipBtn = '';
      if (d.slot !== 'rest' && !d.done && !d.skipped && (isToday || isPast)) {
        skipBtn = '<button class="plan-skip-btn" onclick="event.stopPropagation();App.skipSession(' + i + ')" title="Pas pu">\u2717</button>';
      }
      // Undo skip button
      if (d.skipped) {
        skipBtn = '<button class="plan-skip-btn plan-undo-skip" onclick="event.stopPropagation();App.undoSkip(' + i + ')" title="Annuler skip">\u21a9</button>';
      }

      const clickable = d.session ? ' onclick="App.openPlanSession(' + i + ')"' : '';

      return '<div class="plan-day' + statusClass + '"' + clickable + '>' +
        '<div class="plan-day-left">' +
          '<div class="plan-day-name' + (isToday ? ' today-name' : '') + '">' + d.day.slice(0, 3) + '<span class="plan-day-date">' + (d.dateLabel || '') + '</span></div>' +
          '<div class="plan-day-badge">' + emoji + '</div>' +
        '</div>' +
        '<div class="plan-day-info">' +
          '<div class="plan-day-title">' + title + aiTag + '</div>' +
          '<div class="plan-day-meta">' + meta + '</div>' +
        '</div>' +
        statusIcon + skipBtn +
      '</div>';
    }).join('');
  },

  skipSession(slotIndex) {
    const pos = Planner.getPlanPosition();
    Planner.addSkip(pos.week, slotIndex);
    this.renderWeekPlan();
    this.toast('S\u00e9ance marqu\u00e9e skip', 'info');
    AICoach.adaptPlanAfterSkip(slotIndex);
  },

  undoSkip(slotIndex) {
    const pos = Planner.getPlanPosition();
    Planner.removeSkip(pos.week, slotIndex);
    this.renderWeekPlan();
    this.toast('Skip annul\u00e9', 'info');
  },

  openPlanSession(idx) {
    const plan = Planner.getSavedPlan();
    if (!plan || !plan[idx] || !plan[idx].session) return;
    const d = plan[idx];
    this.showSessionDetail(d, idx);
  },

  showSessionDetail(planDay, idx) {
    const s = planDay.session;
    if (!s) return;

    const emoji = planDay.exerciseType === 'run' ? '\ud83c\udfc3' : planDay.exerciseType === 'row' ? '\ud83d\udea3' : '\u26f7\ufe0f';
    const typeName = Scoring.getTypeName(planDay.exerciseType);
    const sessionLabel = Scoring.getSessionTypeLabel(planDay.sessionType);

    let detailsHtml = '';
    if (s.details) {
      detailsHtml = '<div class="sd-details">';
      for (const [k, v] of Object.entries(s.details)) {
        detailsHtml += '<div class="sd-detail-row"><span class="sd-detail-key">' +
          k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) +
          '</span><span class="sd-detail-val">' + v + '</span></div>';
      }
      detailsHtml += '</div>';
    }

    const modal = document.getElementById('sessionDetailModal') || this.createSessionDetailModal();
    modal.querySelector('.sd-body').innerHTML =
      '<div class="sd-header-info">' +
        '<div class="sd-emoji">' + emoji + '</div>' +
        '<div><div class="sd-type">' + typeName + ' \u2014 ' + sessionLabel + '</div>' +
          '<div class="sd-day">' + planDay.day + ' ' + (planDay.dateLabel || '') + '</div></div>' +
      '</div>' +
      (s.warmup ? '<div class="sd-section"><div class="sd-section-label">\ud83d\udd25 \u00c9chauffement</div><div class="sd-section-text">' + s.warmup + '</div></div>' : '') +
      '<div class="sd-section"><div class="sd-section-label">\ud83c\udfaf S\u00e9ance principale</div><div class="sd-section-text sd-main">' + s.main + '</div></div>' +
      detailsHtml +
      (s.cooldown ? '<div class="sd-section"><div class="sd-section-label">\ud83e\uddca Retour au calme</div><div class="sd-section-text">' + s.cooldown + '</div></div>' : '') +
      (s.tip ? '<div class="sd-tip">\ud83d\udca1 ' + s.tip + '</div>' : '') +
      '<div class="sd-actions">' +
        '<button class="btn-primary" onclick="App.logFromPlan(' + idx + ')">\ud83d\udcdd Enregistrer cette s\u00e9ance</button>' +
        (planDay.done ? '' : '<button class="btn-sm sd-skip-btn" onclick="App.skipSession(' + idx + ');App.closeSessionDetail()">\u2717 Pas pu</button>') +
      '</div>';
    modal.classList.remove('hidden');
  },

  createSessionDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'sessionDetailModal';
    modal.className = 'modal hidden';
    modal.innerHTML = '<div class="modal-backdrop" onclick="App.closeSessionDetail()"></div>' +
      '<div class="modal-content sd-modal"><div class="modal-header"><h3>D\u00e9tail s\u00e9ance</h3><button class="btn-icon" onclick="App.closeSessionDetail()">&times;</button></div>' +
      '<div class="modal-body sd-body"></div></div>';
    document.body.appendChild(modal);
    return modal;
  },

  closeSessionDetail() {
    const m = document.getElementById('sessionDetailModal');
    if (m) m.classList.add('hidden');
  },

  logFromPlan(idx) {
    const plan = Planner.getSavedPlan();
    if (!plan || !plan[idx]) return;
    const d = plan[idx];
    this.closeSessionDetail();
    this.switchTab('log');
    LogForm.setType(d.exerciseType);
    setTimeout(() => {
      document.getElementById('logSessionType').value = d.sessionType;
      LogForm.updateSessionTypeUI();
      LogForm.showSuggestion();
    }, 100);
  },

  regeneratePlan() {
    const z = Training.getZonesSummary(); if (!z) return;
    localStorage.removeItem('hf_weekplan');
    const pos = Planner.getPlanPosition();
    Planner.savePlan(Planner.generate(z, pos.week));
    this.renderWeekPlan();
    this.toast('Plan r\u00e9g\u00e9n\u00e9r\u00e9', 'info');
  },

  switchTab(tab) {
    this.currentTab=tab;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='dashboard'){this.refreshDashboard();this.renderWeekPlan();}
    if(tab==='history')this.refreshHistory();
    if(tab==='log')LogForm.showSuggestion();
  },

  refreshDashboard() {
    const sc=Scoring.computeGlobal(); Charts.drawScoreRing(sc.global);
    document.getElementById('globalScore').textContent=sc.global;
    const h=Storage.getScoreHistory(),te=document.getElementById('scoreTrend');
    if(h.length>=2){const d=sc.global-h[h.length-2].global;te.className='score-trend '+(d>0?'trend-up':d<0?'trend-down':'trend-stable');te.textContent=(d>0?'+':'')+d+' pts';}else te.textContent='';
    const p=sc.pillars;
    document.getElementById('runScore').innerHTML=p.run.weighted+'<small>/'+p.run.max+'</small>';
    document.getElementById('rowScore').innerHTML=p.row.weighted+'<small>/'+p.row.max+'</small>';
    document.getElementById('skiScore').innerHTML=p.ski.weighted+'<small>/'+p.ski.max+'</small>';
    document.getElementById('runDetail').textContent=p.run.speedKmh?p.run.speedKmh.toFixed(1)+' km/h':'--';
    document.getElementById('rowDetail').textContent=p.row.pace?Scoring.formatPace(p.row.pace)+'/1000m':'--';
    document.getElementById('skiDetail').textContent=p.ski.pace?Scoring.formatPace(p.ski.pace)+'/1000m':'--';
    const ws=Storage.getSessionsThisWeek();
    document.getElementById('weekSessions').textContent=ws.length;
    document.getElementById('weekDistance').textContent=ws.reduce((a,s)=>a+(s.distance||0),0).toFixed(1);
    document.getElementById('weekTime').textContent=Math.round(ws.reduce((a,s)=>a+(s.duration||0),0));
    document.getElementById('weekRPE').textContent=ws.length?(ws.reduce((a,s)=>a+(s.rpe||0),0)/ws.length).toFixed(1):'--';
    Charts.renderProgressChart(); this.renderZones();
  },

  refreshHistory(f){f=f||'all';Charts.renderHistoryChart(f);this.renderSessionList(f);},
  renderSessionList(f) {
    const c=document.getElementById('sessionList'),ss=f==='all'?Storage.getSessions():Storage.getSessionsByType(f);
    if(!ss.length){c.innerHTML='<div class="empty-state">Aucune s\u00e9ance</div>';return;}
    c.innerHTML=ss.slice(0,50).map(s=>{const sc=Scoring.scoreSession(s),dt=Scoring.computeDelta(s),d=new Date(s.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),st=Scoring.getSessionTypeLabel(s.sessionType),pc=s.pace?Scoring.formatPace(s.pace):'\u2014',u=s.type==='run'?'/km':'/500m';let dh='';if(dt)dh='<span class="session-delta '+(dt.improved?'delta-up':'delta-down')+'">'+(dt.improved?'':'+')+dt.seconds.toFixed(0)+'s</span>';return '<div class="session-item"><div class="session-type-badge badge-'+s.type+'">'+Scoring.getTypeEmoji(s.type)+'</div><div class="session-info"><div class="session-main"><span class="session-title">'+st+'</span><span class="session-score">'+(sc!=null?sc:'\u2014')+'</span></div><div class="session-meta">'+d+' \u00b7 '+(s.distance?s.distance+'km ':'')+pc+u+' \u00b7 RPE '+s.rpe+' '+dh+'</div></div></div>';}).join('');
  },

  openSettings(){
    document.getElementById('settingsModal').classList.remove('hidden');
    const el=document.getElementById('aiStatus');
    if(el){const url=Storage.getSettings().workerUrl||AICoach.PROXY;el.innerHTML=url.includes('workers.dev')?'<span style="color:var(--accent-2)">\u2713 Connect\u00e9</span>':'<span style="color:var(--accent-red)">\u2717 Non connect\u00e9</span>';}
    if(typeof updateGHStatus==='function')updateGHStatus();
  },
  closeSettings(){document.getElementById('settingsModal').classList.add('hidden');},
  saveSettings(){Storage.saveSettings({workerUrl:document.getElementById('settingsWorkerUrl').value.trim(),goalSpeed:parseFloat(document.getElementById('settingsGoalSpeed').value)||15,compDate:document.getElementById('settingsCompDate').value,weight:parseFloat(document.getElementById('settingsWeight').value)||75});this.closeSettings();this.toast('Sauvegard\u00e9','success');},
  resetData(){if(confirm('Supprimer toutes les donn\u00e9es ?')){Storage.resetAll();localStorage.removeItem('hf_plan_launched');location.reload();}},
  toast(m,t){const c=document.getElementById('toastContainer'),e=document.createElement('div');e.className='toast toast-'+(t||'info');e.textContent=m;c.appendChild(e);setTimeout(()=>e.remove(),3000);},
};

/* ===== LOG FORM ===== */
const LogForm = {
  type:'run',location:'outdoor',
  init(){this.updateRPE(5);this.updatePain(0);this.updateFormForType();},
  setType(t){this.type=t;document.querySelectorAll('.type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===t));this.updateFormForType();this.showSuggestion();},
  updateFormForType(){
    const dl=document.getElementById('distanceLabel'),lt=document.getElementById('locationToggle');
    if(this.type==='run'){dl.textContent='Distance (km)';lt.parentElement.classList.remove('hidden');}else{dl.textContent='Distance (m)';lt.parentElement.classList.add('hidden');this.location='gym';}
    const sel=document.getElementById('logSessionType');
    const opts={run:['z2','tempo','intervals_short','intervals_long','long_run','fartlek','fartlek_hyrox','brick','test'],row:['technique','endurance','racePace','power','test'],ski:['technique','endurance','racePace','power','test']};
    const lbl={z2:'Zone 2',tempo:'Tempo',intervals_short:'Frac court',intervals_long:'Frac long',long_run:'Sortie longue',fartlek:'Fartlek',fartlek_hyrox:'Fartlek Hyrox \ud83d\udd25',brick:'Brick Ergo+Run \ud83e\uddf1',technique:'Technique',power:'Puissance',endurance:'Endurance',racePace:'Race Pace \ud83c\udfc1',test:'Test'};
    sel.innerHTML=opts[this.type].map(o=>'<option value="'+o+'">'+(lbl[o]||o)+'</option>').join('');
    this.updateSessionTypeUI();
  },
  updateSessionTypeUI(){const st=document.getElementById('logSessionType').value;document.getElementById('intervalsDetail').classList.toggle('hidden',st!=='intervals_short'&&st!=='intervals_long');},
  setLocation(l){this.location=l;document.querySelectorAll('#locationToggle .toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===l));},
  updateRPE(v){document.getElementById('rpeValue').textContent=v;document.getElementById('rpeLabel').textContent=Scoring.getRPELabel(parseInt(v));},
  updatePain(v){document.getElementById('painValue').textContent=v;document.getElementById('painLabel').textContent=Scoring.getPainLabel(parseInt(v));},
  toggleVest(){document.getElementById('vestWeight').classList.toggle('hidden',!document.getElementById('logVest').checked);},
  showSuggestion(){
    const box=document.getElementById('sessionSuggestion');
    if(!Training.hasTests()){box.style.display='none';return;}
    const z=Training.getZonesSummary(),st=document.getElementById('logSessionType').value,w=Training.getCurrentWeek();
    let ss;if(this.type==='run')ss=Training.generateRunSession(st,z.run,w);else ss=Training.generateErgoSession(st,z[this.type],this.type,w);
    if(!ss||!ss.main){box.style.display='none';return;}
    box.style.display='block';
    let dh='';if(ss.details){dh='<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:11px;margin-top:6px">';for(const[k,v]of Object.entries(ss.details))dh+='<span style="color:var(--text-muted)">'+k.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())+'</span><span style="font-weight:500">'+v+'</span>';dh+='</div>';}
    box.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--accent-dim);border-left:3px solid var(--accent);border-radius:var(--radius-md);padding:10px;margin-bottom:14px"><div style="font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--accent);margin-bottom:4px">\u26a1 '+ss.title+'</div><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px"><b>\u00c9chauff:</b> '+(ss.warmup||'')+'</div><div style="font-size:12px;color:var(--text-primary);line-height:1.4;font-weight:500">'+ss.main+'</div>'+dh+'<div style="font-size:11px;color:var(--text-secondary);margin-top:3px"><b>Retour:</b> '+(ss.cooldown||'')+'</div>'+(ss.tip?'<div style="margin-top:6px;padding:6px 8px;background:var(--accent-dim);border-radius:5px;font-size:11px;color:var(--accent)">\ud83d\udca1 '+ss.tip+'</div>':'')+'</div>';
  },
  save(){
    const date=document.getElementById('logDate').value,st=document.getElementById('logSessionType').value,dr=parseFloat(document.getElementById('logDistance').value),mn=parseInt(document.getElementById('logMin').value)||0,sc=parseInt(document.getElementById('logSec').value)||0,rpe=parseInt(document.getElementById('logRPE').value),pain=parseInt(document.getElementById('logPain').value),vest=document.getElementById('logVest').checked,vkg=vest?parseFloat(document.getElementById('logVestKg').value)||0:0,notes=document.getElementById('logNotes').value.trim(),reps=parseInt(document.getElementById('logReps').value)||null,rd=parseInt(document.getElementById('logRepDistance').value)||null,rs=parseInt(document.getElementById('logRest').value)||null;
    if(!date){App.toast('Date','error');return;}if(!dr||dr<=0){App.toast('Distance','error');return;}if(mn===0&&sc===0){App.toast('Dur\u00e9e','error');return;}
    const dm=mn+sc/60,ds=mn*60+sc;let dist,pace,spd;
    if(this.type==='run'){dist=dr;pace=ds/dist;spd=dist/(dm/60);}else{dist=dr/1000;pace=ds/(dr/500);spd=(dr/1000)/(dm/60);}
    const session={date,type:this.type,sessionType:st,location:this.location,distance:Math.round(dist*100)/100,duration:Math.round(dm*100)/100,durationSec:ds,pace:Math.round(pace*10)/10,speedKmh:Math.round(spd*100)/100,rpe,pain,vest,vestKg:vkg,reps,repDistance:rd,restSec:rs,notes};
    const saved=Storage.saveSession(session);const gs=Scoring.computeGlobal();
    Storage.addScoreSnapshot({global:gs.global,run:gs.breakdown.run,row:gs.breakdown.row,ski:gs.breakdown.ski});
    App.toast('Score: '+Scoring.scoreSession(saved)+'/100','success');
    AICoach.analyzeSession(saved);
    // Trigger AI plan adaptation if RPE extreme
    if (saved.rpe >= 8 || saved.pain >= 3) {
      AICoach.adaptPlanAfterSession(saved);
    }
    ['logDistance','logMin','logSec','logNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('logVest').checked=false;document.getElementById('vestWeight').classList.add('hidden');
    document.getElementById('logRPE').value=5;this.updateRPE(5);document.getElementById('logPain').value=0;this.updatePain(0);
    // Auto-update plan: regenerate to update checks
    localStorage.removeItem('hf_weekplan');
    App.refreshDashboard();App.renderWeekPlan();
  },
};

const History={filter(t){document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===t));App.refreshHistory(t);}};
document.addEventListener('DOMContentLoaded',()=>App.init());
