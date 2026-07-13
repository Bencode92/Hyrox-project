/* ============================================================
   MUSCU-APP  —  Main controller for HyroxForge Musculation
   ============================================================ */

const MuscuApp = (() => {
  let currentTab = 'dashboard';
  let currentEditSession = null;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    // Migrate older profiles to add missing fields (height, focusZone)
    if (MuscuStorage.migrateProfile) MuscuStorage.migrateProfile();

    const profile = MuscuStorage.getProfile();
    if (!profile.createdAt) {
      _showOnboarding();
    } else if (!MuscuStorage.getPlanStart()) {
      _showLaunch();
    } else {
      _hideSplash();
      _renderAll();
    }
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function _hideSplash() {
    const splash = document.getElementById('splash');
    if (splash) {
      setTimeout(() => { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 400); }, 800);
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const view = document.getElementById('view-' + tab);
    const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
    if (view) view.classList.add('active');
    if (btn) btn.classList.add('active');
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'log') renderLog();
    if (tab === 'history') renderHistory();
    if (tab === 'coach') renderCoach();
    if (tab === 'exercises') renderExerciseBank();
  }

  function _renderAll() { renderDashboard(); }

  // ════════════════════════════════════════════════════════════
  //  ONBOARDING
  // ════════════════════════════════════════════════════════════
  function _showOnboarding() {
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
    document.getElementById('onboarding-modal').style.display = 'flex';
  }

  function saveOnboarding() {
    const profile = {
      name: document.getElementById('ob-name').value.trim() || 'Athlète',
      weight: parseFloat(document.getElementById('ob-weight').value) || 80,
      height: parseInt(document.getElementById('ob-height').value) || 183,
      daysPerWeek: parseInt(document.getElementById('ob-days').value) || 4,
      level: document.getElementById('ob-level').value || 'intermediate',
      focusZone: document.getElementById('ob-focus').value.trim(),
      goal: 'hybrid',
      injuryNotes: document.getElementById('ob-injury').value.trim(),
      createdAt: new Date().toISOString(),
    };
    MuscuStorage.saveProfile(profile);

    // Save initial PRs (all at once to avoid overwrite)
    const maxFields = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row'];
    const prs = MuscuStorage.getPRs();
    const today = new Date().toISOString().slice(0, 10);
    maxFields.forEach(id => {
      const val = parseFloat(document.getElementById('ob-max-' + id)?.value);
      if (val > 0) {
        prs[id] = {
          best1RM: val,
          bestWeight: Math.round(val * 0.85),
          bestReps: 5,
          bestDate: today,
          history: [{ date: today, weight: Math.round(val * 0.85), reps: 5, e1rm: val }],
        };
      }
    });
    localStorage.setItem('mf_prs', JSON.stringify(prs));

    document.getElementById('onboarding-modal').style.display = 'none';
    _showLaunch();
  }

  // ════════════════════════════════════════════════════════════
  //  LAUNCH
  // ════════════════════════════════════════════════════════════
  function _showLaunch() {
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
    const profile = MuscuStorage.getProfile();
    const template = MuscuExercises.getTemplate(profile.daysPerWeek);
    const el = document.getElementById('launch-modal');
    document.getElementById('launch-template-name').textContent = template.name;
    document.getElementById('launch-days').textContent = profile.daysPerWeek + ' jours/semaine';
    document.getElementById('launch-level').textContent = profile.level;

    const daysHtml = template.days.map(d =>
      `<div class="launch-day-card"><strong>${d.label}</strong><span class="text-muted">${d.focus}</span></div>`
    ).join('');
    document.getElementById('launch-days-list').innerHTML = daysHtml;
    document.getElementById('launch-start-date').value = new Date().toISOString().slice(0, 10);
    el.style.display = 'flex';
  }

  async function launchPlan() {
    const startDate = document.getElementById('launch-start-date')?.value || new Date().toISOString().slice(0, 10);
    MuscuStorage.setPlanStart(startDate);
    document.getElementById('launch-modal').style.display = 'none';
    _hideSplash();

    // Generate local plan IMMEDIATELY (instant, always works)
    const localPlan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), 1);
    MuscuStorage.saveWeekPlan(localPlan);
    _renderAll();

    // Then try AI upgrade in background
    _toast('Plan local affiché — génération IA en cours...', 'info');
    _tryAIUpgrade();
  }

  async function _tryAIUpgrade() {
    _showRunnerLoading();
    try {
      const aiPlan = await MuscuAI.generateWeekPlan();
      _hideRunnerLoading();
      if (aiPlan && aiPlan.days && aiPlan.days.length > 0) {
        MuscuStorage.saveWeekPlan(aiPlan);
        _toast('Plan Opus généré !', 'success');
        if (currentTab === 'dashboard') renderDashboard();
      } else {
        _toast('Plan local conservé', 'info');
      }
    } catch (e) {
      _hideRunnerLoading();
      console.warn('AI plan generation failed:', e.message);
      _toast('IA indisponible — plan local conservé', 'info');
    }
  }

  function _showRunnerLoading() {
    if (document.getElementById('ai-loading')) return;
    const overlay = document.createElement('div');
    overlay.id = 'ai-loading';
    overlay.className = 'ai-loading-overlay';
    overlay.innerHTML = `
      <div class="runner-scene">
        <div class="runner-track"></div>
        <div class="runner">🏃</div>
        <div class="runner-stations">
          <span>🏋️</span>
          <span>🚣</span>
          <span>💪</span>
        </div>
      </div>
      <div class="ai-loading-text">Le Coach IA prépare ton plan<span class="ai-loading-dots"></span></div>
      <div class="ai-loading-sub">Opus analyse tes perfs, feedback et objectifs</div>
    `;
    document.body.appendChild(overlay);
  }

  function _hideRunnerLoading() {
    const el = document.getElementById('ai-loading');
    if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
  }

  // ════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ════════════════════════════════════════════════════════════
  function renderDashboard() {
    const weekNum = MuscuStorage.getWeekNumber();
    const plan = MuscuStorage.getWeekPlan();
    const prs = MuscuStorage.getPRs();
    const objectives = MuscuStorage.getObjectives();
    const sessions = MuscuStorage.getSessions();
    const isDeload = weekNum > 1 && weekNum % 4 === 0;

    if (plan && plan.week !== weekNum) {
      // New week — regenerate (try AI, fallback local)
      _autoRegenPlan(weekNum);
      return;
    }

    // Templates have evolved since this plan was generated → auto-regenerate
    const currentVersion = MuscuExercises.getTemplatesVersion ? MuscuExercises.getTemplatesVersion() : 0;
    if (plan && (plan.templatesVersion || 0) < currentVersion) {
      _toast('Programme mis à jour (focus pec bas intégré) — régénération...', 'info');
      _autoRegenPlan(weekNum);
      return;
    }

    document.getElementById('dash-week').textContent = `Semaine ${weekNum}`;
    document.getElementById('dash-phase').textContent = _getPhaseLabel(weekNum);
    document.getElementById('dash-deload').style.display = isDeload ? 'inline-block' : 'none';

    // Stats (28 days)
    const last28 = sessions.filter(s => (Date.now() - new Date(s.date).getTime()) < 28 * 86400000);
    document.getElementById('dash-sessions-count').textContent = last28.length;
    const totalVolume = last28.reduce((sum, s) =>
      sum + (s.exercises || []).reduce((es, e) =>
        es + (e.sets || []).reduce((ss, set) => ss + (set.weight || 0) * (typeof set.reps === 'number' ? set.reps : 0), 0), 0), 0);
    document.getElementById('dash-volume').textContent = totalVolume > 1000 ? Math.round(totalVolume / 1000) + 't' : totalVolume + 'kg';
    document.getElementById('dash-prs').textContent = Object.keys(prs).length;

    _renderPainPrompt();
    _renderWeekPlan(plan);
    _renderAbsCard(weekNum);
    _renderPRCards(prs, objectives);
    _renderObjectivesProgress(prs, objectives);
  }

  // ── Pain J+1 prompt (règle 24h, BJSM 2019) ────────────────
  function _renderPainPrompt() {
    const slot = document.getElementById('pain-prompt-slot');
    if (!slot) return;
    let html = '';

    // 1. Session awaiting pain score
    const awaiting = MuscuStorage.getSessionAwaitingPain
      ? MuscuStorage.getSessionAwaitingPain() : null;
    if (awaiting) {
      const dateStr = _formatDate(awaiting.date);
      html += `
        <div class="pain-prompt-card" onclick="MuscuApp.openPainPrompt('${awaiting.id}')">
          <div class="pain-prompt-icon">🌡️</div>
          <div class="pain-prompt-body">
            <div class="pain-prompt-title">Douleur ce matin ?</div>
            <div class="pain-prompt-sub">Note ton ressenti après ta séance du ${dateStr}</div>
          </div>
          <div class="pain-prompt-cta">Noter →</div>
        </div>`;
    }

    // 2. Persistent pain warning
    const warn = MuscuStorage.getPainWarning ? MuscuStorage.getPainWarning() : null;
    if (warn && warn.warning) {
      html += `
        <div class="pain-warning-card">
          <div class="pain-warning-icon">⚠️</div>
          <div class="pain-warning-body">
            <div class="pain-warning-title">Douleur récurrente détectée</div>
            <div class="pain-warning-sub">${warn.count} séances consécutives avec douleur J+1 &gt; 3/10.
            Charges auto-baissées. Consulter ton ostéo si ça persiste.</div>
          </div>
        </div>`;
    }

    slot.innerHTML = html;
  }

  let _painPromptSessionId = null;

  function openPainPrompt(sessionId) {
    _painPromptSessionId = sessionId;
    const modal = document.getElementById('pain-modal');
    const scaleEl = document.getElementById('pain-scale');
    const session = MuscuStorage.getSessions().find(s => s.id === sessionId);
    if (session) {
      const label = session.type === 'musculation' ? 'muscu' : (session.type || 'séance');
      document.getElementById('pain-session-label').textContent =
        `Séance : ${_formatDate(session.date)} · ${label}`;
    }

    // Render 0-10 buttons
    scaleEl.innerHTML = [0,1,2,3,4,5,6,7,8,9,10].map(n => {
      const cls = n <= 3 ? 'pain-btn-low' : (n <= 6 ? 'pain-btn-mid' : 'pain-btn-high');
      return `<button class="pain-btn ${cls}" onclick="MuscuApp.savePain(${n})">${n}</button>`;
    }).join('');

    modal.style.display = 'flex';
  }

  function closePainPrompt() {
    document.getElementById('pain-modal').style.display = 'none';
    _painPromptSessionId = null;
  }

  function savePain(score) {
    if (!_painPromptSessionId) return closePainPrompt();
    MuscuStorage.saveNextDayPain(_painPromptSessionId, score);
    closePainPrompt();
    const msg = score <= 3
      ? `Douleur ${score}/10 · OK, progression maintenue 👍`
      : score <= 6
        ? `Douleur ${score}/10 · Charge auto-baissée la prochaine séance`
        : `Douleur ${score}/10 · Charge fortement baissée · consulter si persiste`;
    _toast(msg, score <= 3 ? 'success' : score <= 6 ? 'info' : 'error');
    renderDashboard();
  }

  function _renderAbsCard(weekNum) {
    const container = document.getElementById('dash-abs-content');
    if (!container) return;
    const today = new Date().toISOString().slice(0, 10);
    const session = MuscuExercises.getAbsSession(today, weekNum);

    // Last 7 days streak (also marks rest days)
    const sessions = MuscuStorage.getSessions();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const done = sessions.some(s => s.type === 'abs' && s.date === ds);
      const dayAbs = MuscuExercises.getAbsSession(ds, weekNum);
      last7.push({
        date: ds, done,
        isRest: !!dayAbs.rest,
        day: ['L','M','M','J','V','S','D'][(d.getDay() + 6) % 7],
      });
    }
    const streakHtml = last7.map(d => `
      <div class="streak-dot ${d.done ? 'streak-done' : ''} ${d.isRest ? 'streak-rest' : ''} ${d.date === today ? 'streak-today' : ''}" title="${d.date}">
        <span>${d.day}</span>
      </div>`).join('');

    // ── REST DAY ──
    if (session.rest) {
      const icon = session.kind === 'off_total' ? '🛌' : '☕';
      const cardCls = session.kind === 'off_total' ? 'abs-card-off-total' : 'abs-card-recup';
      container.innerHTML = `
        <div class="abs-card-header">
          <div>
            <div class="abs-card-title ${cardCls}">${icon} ${session.theme} — ${session.dayLabel}</div>
            <div class="abs-card-theme">${session.focus}</div>
          </div>
          <div class="abs-card-phase">${session.phase}</div>
        </div>
        ${session.tip ? `<div class="abs-rest-tip text-muted text-sm">💡 ${session.tip}</div>` : ''}
        <div class="abs-streak">${streakHtml}</div>
      `;
      return;
    }

    // ── WORKING DAY ──
    const doneToday = sessions.some(s => s.type === 'abs' && s.date === today);
    const previewExos = session.exercises.map(ex => {
      const work = ex.work.sec ? `${ex.work.sec}s` : `${ex.work.reps}r${ex.work.perSide ? '/côté' : ''}`;
      return `<span class="abs-exo-pill">${ex.name} <em>${work}</em></span>`;
    }).join('');

    container.innerHTML = `
      <div class="abs-card-header">
        <div>
          <div class="abs-card-title">🔥 Abdos du jour — ${session.dayLabel}</div>
          <div class="abs-card-theme">${session.theme}</div>
        </div>
        <div class="abs-card-phase">${session.phase}</div>
      </div>
      <div class="abs-card-format text-muted text-sm">${session.format}</div>
      <div class="abs-card-exos">${previewExos}</div>
      <div class="abs-streak">${streakHtml}</div>
      ${doneToday
        ? `<button class="btn btn-secondary" onclick="MuscuApp.showAbsSession()">✓ Fait — Revoir / refaire</button>`
        : `<button class="btn btn-abs" onclick="MuscuApp.showAbsSession()">▶ Lancer la session (≈ 10 min)</button>`}
    `;
  }

  function _getPhaseLabel(weekNum) {
    if (weekNum <= 1) return 'Ramp-up';
    if (weekNum <= 7) return 'Construction';
    if (weekNum <= 12) return 'Force + Spécifique';
    if (weekNum <= 16) return 'Pré-compétition';
    return 'Taper';
  }

  function _renderWeekPlan(plan) {
    const container = document.getElementById('dash-plan');
    if (!plan || !plan.days) { container.innerHTML = '<p class="text-muted">Aucun plan</p>'; return; }

    // Find next pending day (skip done + skipped)
    const nextIdx = plan.days.findIndex(d => d.status !== 'done' && d.status !== 'skipped');
    const doneCount = plan.days.filter(d => d.status === 'done').length;
    const skippedCount = plan.days.filter(d => d.status === 'skipped').length;
    const totalDays = plan.days.length;

    if (nextIdx === -1) {
      container.innerHTML = `
        <div class="all-done-card">
          <div class="all-done-icon">🎉</div>
          <div class="all-done-title">Toutes les séances de la semaine sont faites</div>
          <div class="all-done-stats text-muted text-sm">${doneCount} validée${doneCount > 1 ? 's' : ''}${skippedCount ? ` · ${skippedCount} skip` : ''} sur ${totalDays}</div>
        </div>`;
      return;
    }

    const day = plan.days[nextIdx];
    const catInfo = MuscuExercises.getCategoryInfo(day.exercises[0]?.category || 'lower');
    const preview = day.exercises.slice(0, 5).map(e => {
      const star = e.isFinisher ? '🔥' : '•';
      return `<div class="hero-preview-row">${star} <strong>${e.name}</strong> <span class="text-muted">${e.sets}×${e.reps}</span></div>`;
    }).join('');
    const moreCount = Math.max(0, day.exercises.length - 5);
    const aiBadge = plan.aiGenerated ? '<span class="hero-ai-badge">🤖 IA</span>' : '';

    container.innerHTML = `
      <div class="next-session-hero" style="--cat-color:${catInfo.color}">
        <div class="hero-top">
          <div class="hero-day-num">${nextIdx + 1}</div>
          <div class="hero-info">
            <div class="hero-day-label">${day.label} ${aiBadge}</div>
            <div class="hero-day-focus text-muted">${day.focus}</div>
          </div>
          <div class="hero-exos-count">${day.exercises.length}<span>exos</span></div>
        </div>
        <div class="hero-preview">
          ${preview}
          ${moreCount ? `<div class="text-muted text-sm" style="padding-left:14px;margin-top:4px">+ ${moreCount} autres…</div>` : ''}
        </div>
        <button class="btn btn-hero-start" onclick="MuscuApp.startWorkout(${nextIdx})">▶ COMMENCER LA SÉANCE</button>
        <div class="hero-actions-row">
          <button class="btn btn-sm btn-ghost" onclick="MuscuApp.showDayDetail(${nextIdx})">Détail complet</button>
          <button class="btn btn-sm btn-ghost" onclick="MuscuApp.skipDay(${nextIdx})">Skip ce jour</button>
        </div>
      </div>
      <div class="hero-week-progress text-muted text-sm">
        <span class="hero-progress-dot ${doneCount > 0 ? 'on' : ''}"></span>
        Semaine : ${doneCount}/${totalDays} séances faites${skippedCount ? ` · ${skippedCount} skip` : ''}
      </div>
    `;
  }

  function skipDay(dayIdx) {
    if (!confirm('Marquer ce jour comme passé ? La séance suivante apparaîtra.')) return;
    const plan = MuscuStorage.getWeekPlan();
    if (!plan || !plan.days[dayIdx]) return;
    plan.days[dayIdx].status = 'skipped';
    MuscuStorage.saveWeekPlan(plan);
    renderDashboard();
    _toast('Jour skippé', 'info');
  }

  function _renderPRCards(prs, objectives) {
    const container = document.getElementById('dash-prs-list');
    const keyLifts = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row'];
    container.innerHTML = keyLifts.map(id => {
      const ex = MuscuExercises.getById(id);
      const pr = prs[id];
      const obj = objectives[id];
      const e1rm = pr ? pr.best1RM : 0;
      const pct = obj && obj.targetWeight ? Math.min(100, Math.round((e1rm / obj.targetWeight) * 100)) : 0;
      return `
        <div class="pr-card">
          <div class="pr-name">${ex ? ex.name : id}</div>
          <div class="pr-value">${e1rm ? e1rm + 'kg' : '—'}</div>
          <div class="pr-label">1RM estimé</div>
          ${obj ? `<div class="pr-bar"><div class="pr-bar-fill" style="width:${pct}%"></div></div>
                   <div class="pr-target text-muted text-sm">Objectif: ${obj.targetWeight}kg (${pct}%)</div>` : ''}
        </div>`;
    }).join('');
  }

  function _renderObjectivesProgress(prs, objectives) {
    const container = document.getElementById('dash-objectives');
    const entries = Object.entries(objectives);
    if (!entries.length) {
      container.innerHTML = '<p class="text-muted text-sm">Aucun objectif — clique sur 🎯 pour en créer</p>';
      return;
    }
    container.innerHTML = entries.map(([id, obj]) => {
      const ex = MuscuExercises.getById(id);
      const pr = prs[id];
      const current = pr ? pr.best1RM : 0;
      const pct = obj.targetWeight ? Math.min(100, Math.round((current / obj.targetWeight) * 100)) : 0;
      return `
        <div class="objective-row">
          <div class="objective-info"><strong>${ex ? ex.name : id}</strong><span>${current}kg → ${obj.targetWeight}kg × ${obj.targetReps}r</span></div>
          <div class="objective-bar"><div class="objective-bar-fill" style="width:${pct}%">${pct}%</div></div>
          ${obj.deadline ? `<span class="text-muted text-sm">Deadline: ${obj.deadline}</span>` : ''}
        </div>`;
    }).join('');
  }

  // ── Day Detail Modal ──────────────────────────────────────
  function showDayDetail(dayIndex) {
    const plan = MuscuStorage.getWeekPlan();
    if (!plan || !plan.days[dayIndex]) return;
    const day = plan.days[dayIndex];
    const modal = document.getElementById('day-detail-modal');
    document.getElementById('day-detail-title').textContent = day.label;
    document.getElementById('day-detail-focus').textContent = day.focus;

    // Show warmup if available
    let exHtml = '';
    if (day.warmup) {
      exHtml += `<div class="detail-warmup"><div class="cues-title">Échauffement</div><p>${day.warmup}</p></div>`;
    }

    // Group by block if available
    let currentBlock = '';
    day.exercises.forEach(ex => {
      if (ex.blockName && ex.blockName !== currentBlock) {
        currentBlock = ex.blockName;
        exHtml += `<div class="block-header">${currentBlock}</div>`;
      }
      const info = MuscuExercises.getById(ex.exerciseId);
      const catInfo = MuscuExercises.getCategoryInfo(ex.category);
      const relevance = info ? MuscuExercises.getHyroxRelevance(ex.exerciseId) : [];
      exHtml += `
        <div class="detail-exercise">
          <div class="detail-ex-header">
            <span class="cat-badge" style="background:${catInfo.color}20;color:${catInfo.color}">${catInfo.icon} ${catInfo.label}</span>
            <strong>${ex.name}</strong>
            ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="video-link" title="Voir le tutoriel">▶ Tuto</a>` : ''}
          </div>
          <div class="detail-ex-prescription">
            <span class="rx-pill">${ex.sets} × ${ex.reps}</span>
            ${ex.suggestedWeight ? `<span class="rx-pill rx-weight">${typeof ex.suggestedWeight === 'string' ? ex.suggestedWeight : ex.suggestedWeight + 'kg'}</span>` : ''}
            <span class="rx-pill rx-rest">Repos ${ex.restSec || 60}s</span>
          </div>
          ${ex.notes ? `<div class="exercise-note text-muted text-sm">${ex.notes}</div>` : ''}
          ${info && info.cues ? `<div class="technique-cues"><div class="cues-title">Points clés :</div><ul>${info.cues.slice(0, 3).map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
          ${ex.isDeload ? '<span class="deload-badge">DELOAD</span>' : ''}
          ${relevance.length ? `<div class="detail-hyrox text-muted text-sm">Hyrox: ${relevance.join(', ')}</div>` : ''}
        </div>`;
    });

    // Finisher
    if (day.finisher) {
      exHtml += `<div class="detail-finisher"><div class="cues-title">Finisher Hyrox</div><p><strong>${day.finisher}</strong></p></div>`;
    }
    // Cooldown
    if (day.cooldown) {
      exHtml += `<div class="detail-cooldown"><div class="cues-title">Retour au calme</div><p>${day.cooldown}</p></div>`;
    }
    document.getElementById('day-detail-exercises').innerHTML = exHtml;

    document.getElementById('day-detail-log-btn').onclick = () => {
      startWorkout(dayIndex);
    };
    document.getElementById('day-detail-skip-btn').onclick = () => {
      day.status = 'skipped';
      MuscuStorage.saveWeekPlan(plan);
      modal.style.display = 'none';
      renderDashboard();
    };
    if (day.status === 'done') {
      document.getElementById('day-detail-log-btn').textContent = 'Déjà enregistrée ✓';
      document.getElementById('day-detail-log-btn').disabled = true;
    } else {
      document.getElementById('day-detail-log-btn').textContent = '▶ Commencer la séance';
      document.getElementById('day-detail-log-btn').disabled = false;
    }
    modal.style.display = 'flex';
  }

  function closeDayDetail() {
    document.getElementById('day-detail-modal').style.display = 'none';
  }

  // ════════════════════════════════════════════════════════════
  //  EXERCISE BANK (Banque d'exercices)
  // ════════════════════════════════════════════════════════════
  let bankFilter = 'all';
  let bankSearch = '';

  function renderExerciseBank() {
    const container = document.getElementById('exercise-bank-content');
    if (!container) return;

    // Filters
    const categories = MuscuExercises.getCategories();
    let filterHtml = `<button class="filter-btn ${bankFilter === 'all' ? 'active' : ''}" onclick="MuscuApp.setBankFilter('all')">Tout</button>`;
    for (const [key, cat] of Object.entries(categories)) {
      filterHtml += `<button class="filter-btn ${bankFilter === key ? 'active' : ''}" onclick="MuscuApp.setBankFilter('${key}')">${cat.icon} ${cat.label}</button>`;
    }

    // Get exercises
    let exercises = bankSearch ? MuscuExercises.search(bankSearch) : MuscuExercises.getAll();
    if (bankFilter !== 'all') exercises = exercises.filter(e => e.category === bankFilter);

    const prs = MuscuStorage.getPRs();

    const exHtml = exercises.map(ex => {
      const catInfo = MuscuExercises.getCategoryInfo(ex.category);
      const pr = prs[ex.id];
      const relevance = MuscuExercises.getHyroxRelevance(ex.id);
      return `
        <div class="bank-exercise-card" onclick="MuscuApp.showExerciseDetail('${ex.id}')">
          <div class="bank-ex-header">
            <span class="cat-dot" style="background:${catInfo.color}"></span>
            <strong>${ex.name}</strong>
            ${pr ? `<span class="pr-mini">${pr.best1RM}kg</span>` : ''}
          </div>
          <div class="bank-ex-meta text-muted text-sm">
            ${ex.equipment} · ${ex.primary.join(', ')}
          </div>
          <div class="bank-ex-hyrox text-sm">
            ${relevance.slice(0, 2).map(r => `<span class="hyrox-tag">${r}</span>`).join('')}
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="input-group" style="margin-bottom:10px">
        <input type="text" id="bank-search" placeholder="Rechercher un exercice, muscle, équipement..."
               value="${bankSearch}" oninput="MuscuApp.bankSearchChange(this.value)">
      </div>
      <div id="bank-filters" style="margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap">${filterHtml}</div>
      <div class="bank-count text-muted text-sm" style="margin-bottom:10px">${exercises.length} exercices</div>
      <div class="bank-list">${exHtml}</div>`;
  }

  function setBankFilter(f) { bankFilter = f; renderExerciseBank(); }
  function bankSearchChange(v) { bankSearch = v; renderExerciseBank(); }

  // ── Exercise Detail Modal ─────────────────────────────────
  function showExerciseDetail(id) {
    const ex = MuscuExercises.getById(id);
    if (!ex) return;
    const modal = document.getElementById('exercise-detail-modal');
    const catInfo = MuscuExercises.getCategoryInfo(ex.category);
    const pr = MuscuStorage.getPRs()[id];
    const obj = MuscuStorage.getObjectives()[id];
    const relevance = MuscuExercises.getHyroxRelevance(id);

    document.getElementById('exdetail-content').innerHTML = `
      <div class="exdetail-header">
        <span class="cat-badge" style="background:${catInfo.color}20;color:${catInfo.color};font-size:13px">${catInfo.icon} ${catInfo.label}</span>
        <h3>${ex.name}</h3>
        <span class="text-muted">${ex.equipment}</span>
      </div>

      ${ex.videoUrl ? `
      <a href="${ex.videoUrl}" target="_blank" class="video-btn">
        ▶ Voir le tutoriel vidéo
      </a>` : ''}

      <div class="exdetail-section">
        <div class="exdetail-section-title">Muscles travaillés</div>
        <div class="muscle-tags">
          ${ex.primary.map(m => `<span class="muscle-tag primary">${m}</span>`).join('')}
          ${ex.secondary.map(m => `<span class="muscle-tag secondary">${m}</span>`).join('')}
        </div>
      </div>

      <div class="exdetail-section">
        <div class="exdetail-section-title">Pertinence Hyrox</div>
        <div class="hyrox-tags-detail">
          ${relevance.map(r => `<span class="hyrox-tag-detail">${r}</span>`).join('')}
        </div>
      </div>

      ${ex.cues ? `
      <div class="exdetail-section">
        <div class="exdetail-section-title">Points clés technique</div>
        <ul class="cues-list">
          ${ex.cues.map(c => `<li class="cue-item">✓ ${c}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${ex.mistakes ? `
      <div class="exdetail-section">
        <div class="exdetail-section-title">Erreurs fréquentes</div>
        <ul class="mistakes-list">
          ${ex.mistakes.map(m => `<li class="mistake-item">✕ ${m}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${pr ? `
      <div class="exdetail-section">
        <div class="exdetail-section-title">Tes records</div>
        <div class="pr-detail-card">
          <div><strong>1RM estimé:</strong> ${pr.best1RM}kg</div>
          <div><strong>Meilleure perf:</strong> ${pr.bestWeight}kg × ${pr.bestReps} reps</div>
          <div><strong>Date:</strong> ${pr.bestDate}</div>
        </div>
      </div>` : '<div class="exdetail-section"><p class="text-muted text-sm">Aucun record — enregistre une séance pour commencer le tracking</p></div>'}

      ${obj ? `
      <div class="exdetail-section">
        <div class="exdetail-section-title">Objectif</div>
        <div class="pr-detail-card">
          <strong>${obj.targetWeight}kg × ${obj.targetReps} reps</strong>
          ${obj.deadline ? `<span class="text-muted"> avant le ${obj.deadline}</span>` : ''}
        </div>
      </div>` : ''}
    `;

    modal.style.display = 'flex';
  }

  function closeExerciseDetail() {
    document.getElementById('exercise-detail-modal').style.display = 'none';
  }

  // ════════════════════════════════════════════════════════════
  //  LOG (Séance)
  // ════════════════════════════════════════════════════════════
  let logExercises = [];
  let logDayIndex = null;

  function renderLog() {
    if (logExercises.length === 0) _initEmptyLog();
    _renderLogExercises();
  }

  function _initEmptyLog() {
    logExercises = [];
    logDayIndex = null;
    document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('log-rpe').value = 7;
    document.getElementById('log-rpe-val').textContent = '7';
    document.getElementById('log-pain').value = '';
    document.getElementById('log-notes').value = '';
    document.getElementById('log-ai-analysis').innerHTML = '';
    document.getElementById('log-ai-analysis').style.display = 'none';
    document.getElementById('log-session-label').textContent = '';
  }

  function _prefillLog(day, dayIndex) {
    logDayIndex = dayIndex;
    logExercises = day.exercises.map(ex => {
      // Smart suggestion based on last session
      const suggestion = MuscuStorage.suggestNextLoad(ex.exerciseId, typeof ex.reps === 'number' ? ex.reps : null);
      const startWeight = suggestion ? suggestion.weight : ex.suggestedWeight;
      return {
        exerciseId: ex.exerciseId,
        name: ex.name,
        category: ex.category,
        targetSets: ex.sets,
        targetReps: ex.reps,
        suggestedWeight: ex.suggestedWeight,
        smartSuggestion: suggestion,
        restSec: ex.restSec || _defaultRestFor(ex.category),
        isFinisher: !!ex.isFinisher,
        blockName: ex.blockName || '',
        notes: ex.notes || '',
        sets: [{ weight: startWeight || '', reps: typeof ex.reps === 'number' ? ex.reps : '', rpe: '', validated: false }],
      };
    });
    document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('log-session-label').textContent = day.label;
    _renderLogExercises();
  }

  function _defaultRestFor(category) {
    if (category === 'core') return 45;
    if (category === 'lower' || category === 'upper_push' || category === 'upper_pull') return 90;
    if (category === 'explosive') return 60;
    return 60;
  }

  function _renderLogExercises() {
    const container = document.getElementById('log-exercises');
    if (logExercises.length === 0) {
      container.innerHTML = `
        <div class="empty-log">
          <p class="text-muted">Aucun exercice ajouté</p>
          <button class="btn btn-secondary" onclick="MuscuApp.showAddExercise()">+ Ajouter un exercice</button>
        </div>`;
      return;
    }
    let currentBlock = '';
    container.innerHTML = logExercises.map((ex, exIdx) => {
      const catInfo = MuscuExercises.getCategoryInfo(ex.category);
      const info = MuscuExercises.getById(ex.exerciseId);

      // Block header (e.g. "🔥 Finisher Poignet + Abdos")
      let blockHtml = '';
      if (ex.blockName && ex.blockName !== currentBlock) {
        currentBlock = ex.blockName;
        blockHtml = `<div class="log-block-header ${ex.isFinisher ? 'log-block-finisher' : ''}">${currentBlock}</div>`;
      }

      // Smart suggestion banner
      const s = ex.smartSuggestion;
      let suggestionHtml = '';
      if (s) {
        const arrow = s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : s.trend === 'pain' ? '⚠️' : '→';
        const deltaStr = s.delta > 0 ? `+${s.delta}kg` : s.delta < 0 ? `${s.delta}kg` : 'maintien';
        suggestionHtml = `
          <div class="smart-suggestion smart-${s.trend}">
            <span class="ss-arrow">${arrow}</span>
            <span class="ss-main"><strong>${s.weight}kg</strong> suggérés (${deltaStr})</span>
            <span class="ss-reason">${s.reason}</span>
          </div>`;
      }

      const setsHtml = ex.sets.map((set, setIdx) => {
        const validatedCls = set.validated ? 'set-validated' : '';
        return `
        <div class="log-set-row ${validatedCls}">
          <span class="set-num">${setIdx + 1}</span>
          <input type="number" class="input-sm" placeholder="kg" value="${set.weight || ''}"
                 onchange="MuscuApp.updateSet(${exIdx},${setIdx},'weight',this.value)" step="2.5" min="0" ${set.validated ? 'disabled' : ''}>
          <span class="text-muted">×</span>
          <input type="number" class="input-sm" placeholder="reps" value="${set.reps || ''}"
                 onchange="MuscuApp.updateSet(${exIdx},${setIdx},'reps',this.value)" min="1" ${set.validated ? 'disabled' : ''}>
          <select class="input-sm rpe-select" onchange="MuscuApp.updateSet(${exIdx},${setIdx},'rpe',this.value)" ${set.validated ? 'disabled' : ''}>
            <option value="">RPE</option>
            ${[5,6,7,8,9,10].map(r => `<option value="${r}" ${set.rpe == r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          ${set.validated
            ? `<button class="btn-icon btn-validated" onclick="MuscuApp.unvalidateSet(${exIdx},${setIdx})" title="Annuler la validation">✓</button>`
            : `<button class="btn-icon btn-validate" onclick="MuscuApp.validateSet(${exIdx},${setIdx})" title="Valider et démarrer le chrono">✓</button>`}
          <button class="btn-icon btn-delete" onclick="MuscuApp.removeSet(${exIdx},${setIdx})">✕</button>
        </div>`;
      }).join('');

      return `${blockHtml}
        <div class="log-exercise-card ${ex.isFinisher ? 'log-ex-finisher' : ''}">
          <div class="log-ex-header">
            <span class="cat-dot" style="background:${catInfo.color}"></span>
            <strong>${ex.name}</strong>
            <span class="text-muted text-sm">${ex.targetSets || '?'}×${ex.targetReps || '?'} ${ex.suggestedWeight ? '@ ' + ex.suggestedWeight + 'kg' : ''}</span>
            <span class="rest-pill" title="Repos entre séries">⏱ ${ex.restSec || 60}s</span>
            ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="video-link-sm" title="Tuto vidéo">▶</a>` : ''}
            <button class="btn-icon btn-delete" onclick="MuscuApp.removeExercise(${exIdx})">🗑</button>
          </div>
          ${suggestionHtml}
          ${ex.notes ? `<div class="exercise-note text-muted text-sm">${ex.notes}</div>` : ''}
          <div class="log-sets">${setsHtml}</div>
          <button class="btn btn-sm btn-ghost" onclick="MuscuApp.addSet(${exIdx})">+ Série</button>
        </div>`;
    }).join('');
  }

  function addSet(exIdx) {
    const ex = logExercises[exIdx];
    const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
    ex.sets.push({
      weight: lastSet ? lastSet.weight : (ex.suggestedWeight || ''),
      reps: lastSet ? lastSet.reps : (typeof ex.targetReps === 'number' ? ex.targetReps : ''),
      rpe: '',
      validated: false,
    });
    _renderLogExercises();
  }

  function removeSet(exIdx, setIdx) { logExercises[exIdx].sets.splice(setIdx, 1); _renderLogExercises(); }
  function updateSet(exIdx, setIdx, field, value) {
    logExercises[exIdx].sets[setIdx][field] = field === 'rpe' ? (value ? parseInt(value) : '') : parseFloat(value) || '';
  }
  function removeExercise(exIdx) { logExercises.splice(exIdx, 1); _renderLogExercises(); }

  // ── Validate set + start rest timer ───────────────────────
  function validateSet(exIdx, setIdx) {
    const ex = logExercises[exIdx];
    const set = ex.sets[setIdx];
    if (!set.weight || !set.reps) {
      _toast('Renseigne poids et reps avant de valider', 'error');
      return;
    }
    set.validated = true;
    _renderLogExercises();

    // Auto-add next set if it was the last one and we're below target
    const targetSets = ex.targetSets || 3;
    if (setIdx === ex.sets.length - 1 && ex.sets.length < targetSets + 2) {
      ex.sets.push({
        weight: set.weight,
        reps: set.reps,
        rpe: '',
        validated: false,
      });
      _renderLogExercises();
    }

    _startRestTimer(ex.restSec || _defaultRestFor(ex.category), ex.name);
  }

  function unvalidateSet(exIdx, setIdx) {
    logExercises[exIdx].sets[setIdx].validated = false;
    _renderLogExercises();
  }

  // ── Add Exercise Modal ────────────────────────────────────
  function showAddExercise() {
    const modal = document.getElementById('add-exercise-modal');
    _renderExerciseList('');
    document.getElementById('exercise-search').value = '';
    modal.style.display = 'flex';
  }

  function closeAddExercise() { document.getElementById('add-exercise-modal').style.display = 'none'; }

  function filterExercises() {
    _renderExerciseList(document.getElementById('exercise-search').value);
  }

  function _renderExerciseList(query) {
    const exercises = query ? MuscuExercises.search(query) : MuscuExercises.getAll();
    const grouped = {};
    exercises.forEach(ex => {
      if (!grouped[ex.category]) grouped[ex.category] = [];
      grouped[ex.category].push(ex);
    });
    const container = document.getElementById('exercise-list');
    container.innerHTML = Object.entries(grouped).map(([cat, exs]) => {
      const catInfo = MuscuExercises.getCategoryInfo(cat);
      return `
        <div class="exercise-group">
          <div class="exercise-group-header" style="color:${catInfo.color}">${catInfo.icon} ${catInfo.label}</div>
          ${exs.map(ex => `
            <div class="exercise-item" onclick="MuscuApp.pickExercise('${ex.id}')">
              <div>
                <strong>${ex.name}</strong>
                <div class="text-muted text-sm">${ex.primary.join(', ')} · ${ex.equipment}</div>
              </div>
              ${ex.videoUrl ? '<span class="video-link-sm" title="Tuto disponible">▶</span>' : ''}
            </div>`).join('')}
        </div>`;
    }).join('');
  }

  function pickExercise(id) {
    const ex = MuscuExercises.getById(id);
    if (!ex) return;
    const pr = MuscuStorage.getPRs()[id];
    const suggestion = MuscuStorage.suggestNextLoad(id, 10);
    const startWeight = suggestion ? suggestion.weight : (pr ? Math.round(pr.bestWeight / 2.5) * 2.5 : null);
    logExercises.push({
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      targetSets: 3,
      targetReps: 10,
      suggestedWeight: startWeight,
      smartSuggestion: suggestion,
      restSec: _defaultRestFor(ex.category),
      isFinisher: false,
      blockName: '',
      notes: '',
      sets: [{ weight: startWeight || '', reps: '', rpe: '', validated: false }],
    });
    closeAddExercise();
    _renderLogExercises();
  }

  // ── Save Session ──────────────────────────────────────────
  async function saveSession() {
    if (logExercises.length === 0 || logExercises.every(e => e.sets.length === 0)) {
      _toast('Ajoute au moins un exercice avec des séries', 'error');
      return;
    }

    const session = {
      date: document.getElementById('log-date').value,
      type: 'musculation',
      globalRpe: parseInt(document.getElementById('log-rpe').value) || 7,
      sleepHours: parseFloat(document.getElementById('log-sleep').value) || null,
      painNotes: document.getElementById('log-pain').value.trim(),
      notes: document.getElementById('log-notes').value.trim(),
      exercises: logExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter(s => s.weight || s.reps).map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          rpe: s.rpe || null,
        })),
        rpe: null,
      })),
    };

    session.exercises.forEach(ex => {
      const rpeSets = ex.sets.filter(s => s.rpe);
      if (rpeSets.length) ex.rpe = Math.round(rpeSets.reduce((s, r) => s + r.rpe, 0) / rpeSets.length);
    });

    MuscuStorage.saveSession(session);

    // Mark plan day done
    if (logDayIndex !== null) {
      const plan = MuscuStorage.getWeekPlan();
      if (plan && plan.days[logDayIndex]) {
        plan.days[logDayIndex].status = 'done';
        MuscuStorage.saveWeekPlan(plan);
      }
    }

    _toast('Séance enregistrée !', 'success');

    // Show feedback form
    _lastSavedSession = session;
    _showFeedbackForm(session);

    // AI analysis (async, after feedback form shown)
    const analysisEl = document.getElementById('log-ai-analysis');
    analysisEl.style.display = 'block';
    analysisEl.innerHTML = '<p class="loading-text">Analyse IA en cours...</p>';

    try {
      const analysis = await MuscuAI.analyzeSession(session);
      analysisEl.innerHTML = `<div class="ai-bubble">${_formatAI(analysis)}</div>`;
    } catch (err) {
      analysisEl.innerHTML = `<div class="ai-bubble ai-error">Analyse locale : séance enregistrée avec RPE ${session.globalRpe}/10.${session.painNotes ? ' Douleurs signalées : ' + session.painNotes + '.' : ''} ${session.globalRpe >= 9 ? '⚠️ RPE élevé — la prochaine séance sera adaptée en conséquence.' : ''}</div>`;
    }

    logExercises = [];
    logDayIndex = null;
    _stopRestTimer();
  }

  // ════════════════════════════════════════════════════════════
  //  HISTORY
  // ════════════════════════════════════════════════════════════
  let historyFilter = 'all';

  function renderHistory() {
    const sessions = MuscuStorage.getSessions().slice().reverse();
    const prs = MuscuStorage.getPRs();

    document.getElementById('history-filter').innerHTML = ['all', 'lower', 'upper_push', 'upper_pull', 'core', 'explosive', 'functional'].map(f => {
      const label = f === 'all' ? 'Tout' : MuscuExercises.getCategoryInfo(f).label;
      return `<button class="filter-btn ${historyFilter === f ? 'active' : ''}" onclick="MuscuApp.setHistoryFilter('${f}')">${label}</button>`;
    }).join('');

    const filtered = historyFilter === 'all' ? sessions : sessions.filter(s =>
      s.exercises && s.exercises.some(e => {
        const ex = MuscuExercises.getById(e.exerciseId);
        return ex && ex.category === historyFilter;
      })
    );

    const container = document.getElementById('history-list');
    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px">Aucune séance enregistrée</p>';
    } else {
      container.innerHTML = filtered.slice(0, 30).map(s => {
        const totalVolume = (s.exercises || []).reduce((sum, e) =>
          sum + (e.sets || []).reduce((ss, set) => ss + (set.weight || 0) * (typeof set.reps === 'number' ? set.reps : 0), 0), 0);
        const exNames = (s.exercises || []).map(e => {
          const ex = MuscuExercises.getById(e.exerciseId);
          return ex ? ex.name : e.exerciseId;
        }).join(', ');
        return `
          <div class="history-card" onclick="MuscuApp.showSessionDetail('${s.id}')">
            <div class="history-header">
              <span class="history-date">${_formatDate(s.date)}</span>
              <span class="rpe-badge rpe-${_rpeColor(s.globalRpe)}">RPE ${s.globalRpe || '?'}</span>
            </div>
            <div class="history-exercises text-sm">${exNames}</div>
            <div class="history-stats text-muted text-sm">
              ${(s.exercises || []).length} exercices · ${totalVolume}kg volume
              ${s.painNotes ? ' · ⚠️ ' + s.painNotes : ''}
            </div>
          </div>`;
      }).join('');
    }

    _renderPRChart(prs);
  }

  function setHistoryFilter(f) { historyFilter = f; renderHistory(); }

  function showSessionDetail(id) {
    const session = MuscuStorage.getSessions().find(s => s.id === id);
    if (!session) return;
    const modal = document.getElementById('session-detail-modal');
    document.getElementById('session-detail-content').innerHTML = `
      <h3>${_formatDate(session.date)}</h3>
      <div class="rpe-badge rpe-${_rpeColor(session.globalRpe)}" style="margin-bottom:12px">RPE ${session.globalRpe || '?'}</div>
      ${session.painNotes ? `<div class="pain-note">⚠️ ${session.painNotes}</div>` : ''}
      ${(session.exercises || []).map(ex => {
        const info = MuscuExercises.getById(ex.exerciseId);
        const catInfo = info ? MuscuExercises.getCategoryInfo(info.category) : {};
        return `
          <div class="detail-exercise">
            <div class="detail-ex-header">
              <span class="cat-badge" style="background:${catInfo.color || '#888'}20;color:${catInfo.color || '#888'}">${info ? info.name : ex.exerciseId}</span>
              ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="video-link-sm">▶</a>` : ''}
            </div>
            <table class="sets-table">
              <tr><th>Série</th><th>Poids</th><th>Reps</th><th>RPE</th><th>1RM est.</th></tr>
              ${(ex.sets || []).map((s, i) => {
                const e1rm = s.weight && s.reps ? MuscuStorage.estimate1RM(s.weight, s.reps) : 0;
                return `<tr><td>${i + 1}</td><td>${s.weight}kg</td><td>${s.reps}</td><td>${s.rpe || '—'}</td><td>${e1rm ? e1rm + 'kg' : '—'}</td></tr>`;
              }).join('')}
            </table>
          </div>`;
      }).join('')}
      ${session.notes ? `<div class="session-notes"><strong>Notes:</strong> ${session.notes}</div>` : ''}
      <button class="btn btn-secondary" onclick="MuscuApp.deleteSessionConfirm('${session.id}')" style="margin-top:12px">Supprimer</button>
    `;
    modal.style.display = 'flex';
  }

  function closeSessionDetail() { document.getElementById('session-detail-modal').style.display = 'none'; }

  function deleteSessionConfirm(id) {
    if (confirm('Supprimer cette séance ?')) {
      MuscuStorage.deleteSession(id);
      closeSessionDetail();
      renderHistory();
      _toast('Séance supprimée', 'info');
    }
  }

  function _renderPRChart(prs) {
    const canvas = document.getElementById('pr-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window._muscuPRChart) window._muscuPRChart.destroy();
    const keyLifts = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row'];
    const labels = keyLifts.map(id => { const ex = MuscuExercises.getById(id); return ex ? ex.name.split(' ')[0] : id; });
    const values = keyLifts.map(id => prs[id] ? prs[id].best1RM : 0);
    const objectives = MuscuStorage.getObjectives();
    const objValues = keyLifts.map(id => objectives[id] ? objectives[id].targetWeight : 0);

    window._muscuPRChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '1RM actuel (kg)', data: values, backgroundColor: ['#00d4aa', '#00a8ff', '#8b5cf6', '#f0a030', '#ff4060'], borderRadius: 6 },
          { label: 'Objectif (kg)', data: objValues, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#8892a8', font: { size: 10 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#1a2340' }, ticks: { color: '#8892a8' } },
          x: { grid: { display: false }, ticks: { color: '#8892a8', font: { size: 11 } } },
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  COACH IA
  // ════════════════════════════════════════════════════════════
  let chatMessages = [];

  function renderCoach() {
    if (chatMessages.length === 0) _renderCoachWelcome();
  }

  function _renderCoachWelcome() {
    const container = document.getElementById('coach-messages');
    const presets = MuscuAI.getPresets();
    const profile = MuscuStorage.getProfile();
    container.innerHTML = `
      <div class="ai-bubble">
        <strong>Coach Musculation Hyrox</strong><br>
        Salut ${profile.name || 'Athlète'} ! Je suis ton coach IA spécialisé en renforcement musculaire pour Hyrox.
        ${profile.injuryNotes ? `<br><br>⚠️ <em>Je prends en compte ta situation : ${profile.injuryNotes}</em>` : ''}
        <br><br>Je m'adapte à tes performances, ton RPE, et tes douleurs pour ajuster ton programme en temps réel.
      </div>
      <div class="coach-actions">
        ${Object.entries(presets).map(([key, p]) =>
          `<button class="btn btn-sm btn-action" onclick="MuscuApp.coachPreset('${key}')">${p.label}</button>`
        ).join('')}
      </div>`;
  }

  async function coachPreset(key) {
    const presets = MuscuAI.getPresets();
    const preset = presets[key];
    if (!preset) return;
    await sendCoachMessage(preset.prompt);
  }

  async function sendCoachMessage(msg) {
    if (!msg) {
      msg = document.getElementById('coach-input')?.value?.trim();
      if (!msg) return;
      document.getElementById('coach-input').value = '';
    }
    const container = document.getElementById('coach-messages');
    chatMessages.push({ role: 'user', text: msg });
    container.innerHTML += `<div class="chat-user">${_escapeHtml(msg)}</div>`;
    container.innerHTML += `<div class="ai-bubble loading-text" id="coach-loading">Réflexion en cours...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
      const response = await MuscuAI.ask(msg);
      chatMessages.push({ role: 'ai', text: response });
      document.getElementById('coach-loading')?.remove();
      container.innerHTML += `<div class="ai-bubble">${_formatAI(response)}</div>`;
    } catch (err) {
      document.getElementById('coach-loading')?.remove();
      container.innerHTML += `<div class="ai-bubble ai-error">Erreur : ${err.message}</div>`;
    }
    container.scrollTop = container.scrollHeight;
  }

  function coachSend() { sendCoachMessage(); }

  // ── Objectives Modal ──────────────────────────────────────
  function showObjectives() {
    const modal = document.getElementById('objectives-modal');
    const objectives = MuscuStorage.getObjectives();
    const prs = MuscuStorage.getPRs();

    const keyLifts = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row',
                      'pull_ups', 'hip_thrust', 'thruster', 'farmers_carry', 'kb_swing'];

    document.getElementById('objectives-list').innerHTML = keyLifts.map(id => {
      const ex = MuscuExercises.getById(id);
      const obj = objectives[id] || {};
      const pr = prs[id];
      return `
        <div class="objective-edit-row">
          <label>${ex ? ex.name : id}</label>
          <span class="text-muted text-sm">Actuel: ${pr ? pr.best1RM + 'kg' : '—'}</span>
          <div class="obj-inputs">
            <input type="number" placeholder="Poids cible" value="${obj.targetWeight || ''}" id="obj-w-${id}" step="2.5" min="0" class="input-sm">
            <span>×</span>
            <input type="number" placeholder="Reps" value="${obj.targetReps || ''}" id="obj-r-${id}" min="1" class="input-sm">
            <input type="date" value="${obj.deadline || ''}" id="obj-d-${id}" class="input-sm">
          </div>
        </div>`;
    }).join('');
    modal.style.display = 'flex';
  }

  function saveObjectives() {
    const keyLifts = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row',
                      'pull_ups', 'hip_thrust', 'thruster', 'farmers_carry', 'kb_swing'];
    keyLifts.forEach(id => {
      const w = parseFloat(document.getElementById('obj-w-' + id)?.value);
      const r = parseInt(document.getElementById('obj-r-' + id)?.value);
      const d = document.getElementById('obj-d-' + id)?.value;
      if (w > 0 && r > 0) MuscuStorage.setObjective(id, { targetWeight: w, targetReps: r, deadline: d || null });
    });
    document.getElementById('objectives-modal').style.display = 'none';
    _toast('Objectifs sauvegardés', 'success');
    if (currentTab === 'dashboard') renderDashboard();
  }

  function closeObjectives() { document.getElementById('objectives-modal').style.display = 'none'; }

  // ── Settings ──────────────────────────────────────────────
  function showSettings() {
    const modal = document.getElementById('settings-modal');
    const settings = MuscuStorage.getSettings();
    const profile = MuscuStorage.getProfile();
    document.getElementById('set-worker-url').value = settings.workerUrl || '';
    document.getElementById('set-ai-model').value = settings.aiModel || 'claude-sonnet-4-20250514';
    document.getElementById('set-finisher').checked = settings.finisherEnabled !== false;
    document.getElementById('set-weight').value = profile.weight || '';
    document.getElementById('set-height').value = profile.height || '';
    document.getElementById('set-days').value = profile.daysPerWeek || 4;
    document.getElementById('set-level').value = profile.level || 'intermediate';
    document.getElementById('set-focus').value = profile.focusZone || '';
    document.getElementById('set-goal').value = profile.goal || 'hybrid';
    document.getElementById('set-injury').value = profile.injuryNotes || '';
    modal.style.display = 'flex';
  }

  function saveSettings() {
    const settings = MuscuStorage.getSettings();
    const prevFinisher = settings.finisherEnabled !== false;
    settings.workerUrl = document.getElementById('set-worker-url').value.trim();
    settings.aiModel = document.getElementById('set-ai-model').value;
    settings.finisherEnabled = document.getElementById('set-finisher').checked;
    MuscuStorage.saveSettings(settings);

    // If finisher toggle changed, regenerate plan to reflect it
    if (prevFinisher !== settings.finisherEnabled) {
      const weekNum = MuscuStorage.getWeekNumber();
      const newPlan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), weekNum);
      MuscuStorage.saveWeekPlan(newPlan);
    }
    const profile = MuscuStorage.getProfile();
    profile.weight = parseFloat(document.getElementById('set-weight').value) || profile.weight;
    profile.height = parseInt(document.getElementById('set-height').value) || profile.height;
    profile.daysPerWeek = parseInt(document.getElementById('set-days').value) || profile.daysPerWeek;
    profile.level = document.getElementById('set-level').value || profile.level;
    profile.focusZone = document.getElementById('set-focus').value.trim();
    profile.goal = document.getElementById('set-goal').value || 'hybrid';
    profile.injuryNotes = document.getElementById('set-injury').value.trim();
    MuscuStorage.saveProfile(profile);
    document.getElementById('settings-modal').style.display = 'none';
    _toast('Paramètres sauvegardés', 'success');
  }

  function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

  function _autoRegenPlan(weekNum) {
    // Local first, AI in background
    const plan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), weekNum);
    MuscuStorage.saveWeekPlan(plan);
    renderDashboard();
    _tryAIUpgrade();
  }

  async function regeneratePlan() {
    if (!confirm('Régénérer le plan ?')) return;
    const weekNum = MuscuStorage.getWeekNumber();

    // Local plan immediately
    const localPlan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), weekNum);
    MuscuStorage.saveWeekPlan(localPlan);
    renderDashboard();
    _toast('Plan local affiché — demande au Coach IA (Opus)...', 'info');

    // AI upgrade in background
    _tryAIUpgrade();
  }

  function resetAllData() {
    if (!confirm('Supprimer TOUTES les données ?')) return;
    if (!confirm('Vraiment tout supprimer ?')) return;
    MuscuStorage.resetAll();
    location.reload();
  }

  // ── Utilities ─────────────────────────────────────────────
  function _formatDate(dateStr) {
    const d = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  }

  function _rpeColor(rpe) {
    if (!rpe) return 'neutral';
    if (rpe <= 6) return 'easy';
    if (rpe <= 8) return 'moderate';
    return 'hard';
  }

  function _formatAI(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _toast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function updateRpeDisplay() {
    const val = document.getElementById('log-rpe').value;
    document.getElementById('log-rpe-val').textContent = val;
  }

  // ════════════════════════════════════════════════════════════
  //  ABS SESSION (programme quotidien rotatif)
  // ════════════════════════════════════════════════════════════
  let _absState = null;

  function showAbsSession() {
    const weekNum = MuscuStorage.getWeekNumber();
    const today = new Date().toISOString().slice(0, 10);
    const session = MuscuExercises.getAbsSession(today, weekNum);
    if (session.rest) {
      _toast(session.kind === 'off_total' ? 'OFF total aujourd\'hui — récupère 🛌' : 'Repos abdo aujourd\'hui — la récup fait partie du programme ☕', 'info');
      return;
    }
    _absState = {
      session,
      round: 1,
      exoIdx: 0,
      phase: 'ready',         // 'ready' | 'work' | 'rest' | 'round_rest' | 'done'
      timerEndsAt: null,
      timerId: null,
      startedAt: null,
      amrapEndsAt: null,
      amrapRoundsCompleted: 0,
    };
    document.getElementById('abs-modal-title').textContent = `Abdos — ${session.dayLabel}`;
    document.getElementById('abs-session-modal').style.display = 'flex';
    _renderAbsSession();
  }

  function closeAbsSession() {
    if (_absState && _absState.phase !== 'ready' && _absState.phase !== 'done') {
      if (!confirm('Quitter la session en cours ? Les progrès ne seront pas sauvés.')) return;
    }
    _stopAbsTimer();
    _absState = null;
    document.getElementById('abs-session-modal').style.display = 'none';
  }

  function _stopAbsTimer() {
    if (_absState && _absState.timerId) {
      clearInterval(_absState.timerId);
      _absState.timerId = null;
    }
  }

  function _renderAbsSession() {
    if (!_absState) return;
    const body = document.getElementById('abs-session-body');
    const s = _absState.session;

    if (_absState.phase === 'ready') {
      body.innerHTML = `
        <div class="abs-intro">
          <div class="abs-intro-theme">${s.theme}</div>
          <div class="abs-intro-focus text-muted">${s.focus}</div>
          <div class="abs-intro-format">${s.format}</div>
          <div class="abs-intro-phase">Phase : <strong>${s.phase}</strong></div>
        </div>
        <div class="abs-intro-list">
          ${s.exercises.map((ex, i) => {
            const w = ex.work.sec ? `${ex.work.sec}s` : `${ex.work.reps}r${ex.work.perSide ? '/côté' : ''}`;
            return `<div class="abs-intro-row"><span class="abs-num">${i+1}</span><strong>${ex.name}</strong><span class="abs-work">${w}</span></div>`;
          }).join('')}
        </div>
        <button class="btn btn-abs btn-abs-start" onclick="MuscuApp.startAbsSession()">▶ Démarrer</button>
        <button class="btn btn-secondary" onclick="MuscuApp.closeAbsSession()" style="margin-top:8px">Annuler</button>
      `;
      return;
    }

    if (_absState.phase === 'done') {
      const durationMin = _absState.startedAt
        ? Math.round((Date.now() - _absState.startedAt) / 60000)
        : '?';
      const summary = s.rounds === 'AMRAP'
        ? `${_absState.amrapRoundsCompleted} tours complets en 8 min`
        : `${s.rounds} tours terminés`;
      body.innerHTML = `
        <div class="abs-done">
          <div class="abs-done-icon">🎉</div>
          <h3>Session terminée !</h3>
          <p class="text-muted">${summary} · ${durationMin} min</p>
          <p class="abs-done-encourage">Tu progresses jour après jour. Continue.</p>
          <button class="btn btn-abs" onclick="MuscuApp.finishAbsSession()">Sauvegarder</button>
        </div>
      `;
      return;
    }

    // Work or rest
    const ex = s.exercises[_absState.exoIdx];
    const totalExos = s.exercises.length;
    const totalRounds = s.rounds === 'AMRAP' ? '∞' : s.rounds;
    const remainingMs = _absState.timerEndsAt ? _absState.timerEndsAt - Date.now() : 0;
    const remSec = Math.max(0, Math.ceil(remainingMs / 1000));
    const mm = String(Math.floor(remSec / 60)).padStart(1, '0');
    const ss = String(remSec % 60).padStart(2, '0');

    // AMRAP overall countdown
    let amrapHtml = '';
    if (s.rounds === 'AMRAP' && _absState.amrapEndsAt) {
      const amrapRem = Math.max(0, Math.ceil((_absState.amrapEndsAt - Date.now()) / 1000));
      const amm = String(Math.floor(amrapRem / 60)).padStart(1, '0');
      const ass = String(amrapRem % 60).padStart(2, '0');
      amrapHtml = `<div class="abs-amrap-clock">AMRAP ${amm}:${ass} · ${_absState.amrapRoundsCompleted} tours</div>`;
    }

    if (_absState.phase === 'work') {
      const info = MuscuExercises.getById(ex.exerciseId);
      const w = ex.work;
      const workDisplay = w.sec
        ? `<div class="abs-timer-big">${mm}:${ss}</div>`
        : `<div class="abs-reps-big">${w.reps}${w.perSide ? '/côté' : ''} reps</div>`;
      const actionBtn = w.sec
        ? `<button class="btn btn-abs btn-abs-next" onclick="MuscuApp.absSkipToRest()">Skip</button>`
        : `<button class="btn btn-abs btn-abs-next" onclick="MuscuApp.absMarkDone()">✓ Fait — repos</button>`;

      body.innerHTML = `
        ${amrapHtml}
        <div class="abs-progress">
          <span>Tour ${_absState.round}/${totalRounds}</span>
          <span>Exo ${_absState.exoIdx + 1}/${totalExos}</span>
        </div>
        <div class="abs-current-exo">
          <div class="abs-exo-name">${ex.name}</div>
          ${ex.notes ? `<div class="abs-exo-notes text-muted">${ex.notes}</div>` : ''}
          ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="abs-video">▶ Tuto vidéo</a>` : ''}
        </div>
        ${workDisplay}
        ${actionBtn}
        <button class="btn btn-ghost btn-sm" onclick="MuscuApp.absSkipExo()" style="margin-top:6px">Passer cet exo</button>
      `;
      return;
    }

    if (_absState.phase === 'rest' || _absState.phase === 'round_rest') {
      const nextExo = _absState.phase === 'round_rest'
        ? s.exercises[0]
        : s.exercises[_absState.exoIdx];
      const nextLabel = _absState.phase === 'round_rest'
        ? `Tour ${_absState.round} — ${nextExo.name}`
        : `Prochain : ${nextExo.name}`;
      body.innerHTML = `
        ${amrapHtml}
        <div class="abs-progress">
          <span>Tour ${_absState.round}/${totalRounds}</span>
          <span>${_absState.phase === 'round_rest' ? 'Repos entre tours' : 'Repos'}</span>
        </div>
        <div class="abs-rest-label">REPOS</div>
        <div class="abs-timer-big abs-rest-timer">${mm}:${ss}</div>
        <div class="abs-next text-muted">${nextLabel}</div>
        <button class="btn btn-abs btn-abs-next" onclick="MuscuApp.absSkipRest()">Skip repos</button>
      `;
      return;
    }
  }

  function startAbsSession() {
    if (!_absState) return;
    _absState.startedAt = Date.now();
    if (_absState.session.rounds === 'AMRAP') {
      _absState.amrapEndsAt = Date.now() + (_absState.session.duration || 480) * 1000;
    }
    _absStartCurrentExo();
  }

  function _absStartCurrentExo() {
    const ex = _absState.session.exercises[_absState.exoIdx];
    _absState.phase = 'work';
    _stopAbsTimer();
    if (ex.work.sec) {
      const sec = ex.work.perSide ? ex.work.sec * 2 : ex.work.sec;
      _absState.timerEndsAt = Date.now() + sec * 1000;
      _absState.timerId = setInterval(_absTick, 250);
    } else {
      _absState.timerEndsAt = null;
    }
    _renderAbsSession();
  }

  function _absTick() {
    if (!_absState) return;
    // AMRAP global timeout
    if (_absState.session.rounds === 'AMRAP' && _absState.amrapEndsAt && Date.now() >= _absState.amrapEndsAt) {
      _stopAbsTimer();
      _absState.phase = 'done';
      _playBeep();
      _renderAbsSession();
      return;
    }
    if (_absState.timerEndsAt && Date.now() >= _absState.timerEndsAt) {
      if (_absState.phase === 'work') {
        _playBeep();
        if (navigator.vibrate) navigator.vibrate(150);
        _absStartRest();
      } else if (_absState.phase === 'rest' || _absState.phase === 'round_rest') {
        _playBeep();
        if (navigator.vibrate) navigator.vibrate(80);
        _absAdvanceFromRest();
      }
      return;
    }
    _renderAbsSession();
  }

  function _absStartRest() {
    const ex = _absState.session.exercises[_absState.exoIdx];
    const lastInRound = _absState.exoIdx === _absState.session.exercises.length - 1;
    const restSec = ex.rest || 15;
    _stopAbsTimer();
    if (restSec <= 0) {
      _absAdvanceFromRest();
      return;
    }
    _absState.phase = lastInRound ? 'round_rest' : 'rest';
    _absState.timerEndsAt = Date.now() + restSec * 1000;
    _absState.timerId = setInterval(_absTick, 250);
    _renderAbsSession();
  }

  function _absAdvanceFromRest() {
    _stopAbsTimer();
    const lastInRound = _absState.exoIdx === _absState.session.exercises.length - 1;
    if (lastInRound) {
      // Round complete
      if (_absState.session.rounds === 'AMRAP') {
        _absState.amrapRoundsCompleted++;
        _absState.exoIdx = 0;
        _absState.round++;
        _absStartCurrentExo();
      } else if (_absState.round >= _absState.session.rounds) {
        _absState.phase = 'done';
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
        _playBeep();
        _renderAbsSession();
      } else {
        _absState.round++;
        _absState.exoIdx = 0;
        _absStartCurrentExo();
      }
    } else {
      _absState.exoIdx++;
      _absStartCurrentExo();
    }
  }

  function absMarkDone() { _absStartRest(); }
  function absSkipToRest() { _absStartRest(); }
  function absSkipRest() { _absAdvanceFromRest(); }
  function absSkipExo() {
    _stopAbsTimer();
    const lastInRound = _absState.exoIdx === _absState.session.exercises.length - 1;
    if (lastInRound) { _absAdvanceFromRest(); }
    else { _absState.exoIdx++; _absStartCurrentExo(); }
  }

  function finishAbsSession() {
    if (!_absState) return;
    const s = _absState.session;
    const completed = s.rounds === 'AMRAP'
      ? `AMRAP ${_absState.amrapRoundsCompleted} tours`
      : `${s.rounds} tours`;
    MuscuStorage.saveSession({
      date: s.date,
      type: 'abs',
      theme: s.theme,
      phase: s.phase,
      rounds: s.rounds === 'AMRAP' ? _absState.amrapRoundsCompleted : s.rounds,
      format: s.format,
      durationMin: Math.round((Date.now() - _absState.startedAt) / 60000),
      exercises: s.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: [], // Abs sessions track at session level, not per-set
      })),
      notes: completed,
    });
    _toast('Session abdos sauvegardée — 🔥', 'success');
    document.getElementById('abs-session-modal').style.display = 'none';
    _absState = null;
    renderDashboard();
  }

  // ════════════════════════════════════════════════════════════
  //  REST TIMER (chrono inter-séries)
  // ════════════════════════════════════════════════════════════
  let _restState = null; // { endsAt, duration, exName, intervalId }

  function _startRestTimer(durationSec, exName) {
    _stopRestTimer();
    _restState = {
      endsAt: Date.now() + durationSec * 1000,
      duration: durationSec,
      exName: exName || '',
      intervalId: null,
    };
    _renderRestTimer();
    _restState.intervalId = setInterval(_tickRestTimer, 250);
  }

  function _tickRestTimer() {
    if (!_restState) return;
    const remainingMs = _restState.endsAt - Date.now();
    if (remainingMs <= 0) {
      _onRestComplete();
    } else {
      _renderRestTimer();
    }
  }

  function _renderRestTimer() {
    if (!_restState) return;
    let el = document.getElementById('rest-timer-bar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rest-timer-bar';
      el.className = 'rest-timer-bar';
      document.body.appendChild(el);
    }
    const remainingMs = Math.max(0, _restState.endsAt - Date.now());
    const remSec = Math.ceil(remainingMs / 1000);
    const mm = String(Math.floor(remSec / 60)).padStart(1, '0');
    const ss = String(remSec % 60).padStart(2, '0');
    const pct = Math.max(0, Math.min(100, (remainingMs / (_restState.duration * 1000)) * 100));

    el.innerHTML = `
      <div class="rest-progress" style="width:${pct}%"></div>
      <div class="rest-content">
        <div class="rest-label">
          <span class="rest-icon">⏱</span>
          <span class="rest-time">${mm}:${ss}</span>
          <span class="rest-ex text-muted text-sm">${_escapeHtml(_restState.exName)}</span>
        </div>
        <div class="rest-actions">
          <button class="btn-rest" onclick="MuscuApp.addRestTime(15)">+15s</button>
          <button class="btn-rest" onclick="MuscuApp.addRestTime(-15)">−15s</button>
          <button class="btn-rest btn-rest-skip" onclick="MuscuApp.skipRest()">Skip</button>
        </div>
      </div>`;
  }

  function _onRestComplete() {
    _playBeep();
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    _toast('Repos terminé — let\'s go !', 'success');
    _stopRestTimer();
  }

  function _stopRestTimer() {
    if (_restState && _restState.intervalId) clearInterval(_restState.intervalId);
    _restState = null;
    const el = document.getElementById('rest-timer-bar');
    if (el) el.remove();
  }

  function skipRest() { _stopRestTimer(); }
  function addRestTime(deltaSec) {
    if (!_restState) return;
    _restState.endsAt += deltaSec * 1000;
    if (_restState.endsAt <= Date.now()) { _onRestComplete(); return; }
    _restState.duration = Math.max(_restState.duration, Math.ceil((_restState.endsAt - Date.now()) / 1000));
    _renderRestTimer();
  }

  function _playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.65);
      // Second beep
      setTimeout(() => {
        try {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(ctx.destination);
          o2.frequency.value = 1320;
          g2.gain.setValueAtTime(0.001, ctx.currentTime);
          g2.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          o2.start(ctx.currentTime);
          o2.stop(ctx.currentTime + 0.45);
        } catch (e) {}
      }, 250);
    } catch (e) {}
  }

  // ════════════════════════════════════════════════════════════
  //  WORKOUT IN PROGRESS — Mode séance guidée
  // ════════════════════════════════════════════════════════════
  let _workout = null;  // { dayIdx, day, exoIdx, exoData, startedAt }

  function startWorkout(dayIndex) {
    const plan = MuscuStorage.getWeekPlan();
    if (!plan || !plan.days[dayIndex]) return;
    const day = plan.days[dayIndex];

    // Build per-exo state with smart suggestion & set list
    const exoData = day.exercises.map(ex => {
      const suggestion = MuscuStorage.suggestNextLoad(ex.exerciseId, typeof ex.reps === 'number' ? ex.reps : null);
      const startWeight = suggestion ? suggestion.weight : ex.suggestedWeight;
      const targetSets = typeof ex.sets === 'number' ? ex.sets : 3;
      return {
        exerciseId: ex.exerciseId,
        name: ex.name,
        category: ex.category,
        targetSets,
        targetReps: ex.reps,
        suggestedWeight: ex.suggestedWeight,
        smartSuggestion: suggestion,
        restSec: ex.restSec || _defaultRestFor(ex.category),
        isFinisher: !!ex.isFinisher,
        blockName: ex.blockName || '',
        notes: ex.notes || '',
        sets: [],
        startWeight,
      };
    });

    _workout = {
      dayIdx: dayIndex,
      day,
      exoIdx: 0,
      exoData,
      startedAt: Date.now(),
    };

    document.getElementById('day-detail-modal').style.display = 'none';
    document.getElementById('workout-title').textContent = day.label;
    document.getElementById('workout-modal').style.display = 'flex';
    _renderWorkout();
  }

  function _renderWorkout() {
    if (!_workout) return;
    const body = document.getElementById('workout-body');
    const total = _workout.exoData.length;
    const ex = _workout.exoData[_workout.exoIdx];
    const info = MuscuExercises.getById(ex.exerciseId);
    const catInfo = MuscuExercises.getCategoryInfo(ex.category);

    // Final summary screen?
    if (_workout.exoIdx >= total) {
      _renderWorkoutSummary();
      return;
    }

    // Smart suggestion banner
    const s = ex.smartSuggestion;
    let suggestionHtml = '';
    if (s) {
      const arrow = s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : s.trend === 'pain' ? '⚠️' : '→';
      const deltaStr = s.delta > 0 ? `+${s.delta}kg` : s.delta < 0 ? `${s.delta}kg` : 'maintien';
      suggestionHtml = `
        <div class="smart-suggestion smart-${s.trend}">
          <span class="ss-arrow">${arrow}</span>
          <span class="ss-main"><strong>${s.weight}kg</strong> suggérés (${deltaStr})</span>
          <span class="ss-reason">${s.reason}</span>
        </div>`;
    }

    // Detect superset (multiple exos in the same blockName)
    const blockExos = _workout.exoData
      .map((e, i) => ({ ex: e, idx: i }))
      .filter(p => p.ex.blockName === ex.blockName && ex.blockName);
    const isSuperset = blockExos.length > 1 && !ex.isFinisher;
    const myPos = isSuperset ? blockExos.findIndex(p => p.idx === _workout.exoIdx) : -1;
    const partners = isSuperset ? blockExos.filter(p => p.idx !== _workout.exoIdx) : [];

    let blockHtml = '';
    if (ex.blockName) {
      const cls = ex.isFinisher
        ? 'workout-block-finisher'
        : (isSuperset ? 'workout-block-superset' : '');
      const prefix = isSuperset ? '🔗 ' : '';
      const meta = isSuperset ? ` · ${myPos + 1}/${blockExos.length}` : '';
      blockHtml = `<div class="workout-block ${cls}">${prefix}${ex.blockName}${meta}</div>`;
    }

    let partnersHtml = '';
    if (isSuperset && partners.length) {
      const partnerCards = partners.map(p => {
        const pcat = MuscuExercises.getCategoryInfo(p.ex.category);
        const setsDone = p.ex.sets.filter(s => s.validated).length;
        const tot = p.ex.targetSets || 0;
        const status = setsDone >= tot && tot > 0 ? '✓' : `${setsDone}/${tot}`;
        return `
          <div class="ws-partner-card" onclick="MuscuApp.workoutJumpToExo(${p.idx})">
            <span class="ws-partner-dot" style="background:${pcat.color}"></span>
            <div class="ws-partner-info">
              <strong>${p.ex.name}</strong>
              <span class="text-muted text-sm">${p.ex.targetSets || '?'}×${p.ex.targetReps || '?'}${p.ex.suggestedWeight ? ' @ ' + p.ex.suggestedWeight + 'kg' : ''}</span>
            </div>
            <span class="ws-partner-status">${status}</span>
          </div>`;
      }).join('');
      partnersHtml = `
        <div class="workout-superset-partners">
          <div class="ws-partners-title">🔗 Superset — enchaîne avec :</div>
          ${partnerCards}
        </div>`;
    }

    // Sets: validated = compact summary, active = full form + big REPOS button
    const restSec = ex.restSec || _defaultRestFor(ex.category);
    const setsHtml = ex.sets.map((set, setIdx) => {
      if (set.validated) {
        return `
          <div class="workout-set-done">
            <span class="ws-done-num">${setIdx + 1}</span>
            <span class="ws-done-icon">✓</span>
            <span class="ws-done-data"><strong>${set.weight}kg</strong> × <strong>${set.reps}</strong>${set.rpe ? ` · RPE ${set.rpe}` : ''}</span>
            <button class="ws-done-edit" onclick="MuscuApp.workoutUnvalidate(${setIdx})" title="Modifier">✎</button>
          </div>`;
      }
      // Active set
      return `
        <div class="workout-set-active">
          <div class="ws-active-header">
            <span class="ws-active-num">Série ${setIdx + 1}</span>
            <button class="ws-active-remove" onclick="MuscuApp.workoutRemoveSet(${setIdx})" title="Supprimer">✕</button>
          </div>
          <div class="ws-active-inputs">
            <div class="ws-input-group">
              <label>Poids</label>
              <input type="number" placeholder="kg" value="${set.weight || ''}"
                     onchange="MuscuApp.workoutUpdateSet(${setIdx},'weight',this.value)" step="2.5" min="0" inputmode="decimal">
            </div>
            <div class="ws-input-group">
              <label>Reps</label>
              <input type="number" placeholder="reps" value="${set.reps || ''}"
                     onchange="MuscuApp.workoutUpdateSet(${setIdx},'reps',this.value)" min="1" inputmode="numeric">
            </div>
            <div class="ws-input-group">
              <label>RPE</label>
              <select onchange="MuscuApp.workoutUpdateSet(${setIdx},'rpe',this.value)">
                <option value="">—</option>
                ${[5,6,7,8,9,10].map(r => `<option value="${r}" ${set.rpe == r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <button class="btn btn-rest-big" onclick="MuscuApp.workoutValidateSet(${setIdx})">
            <span class="rest-big-icon">⏱</span>
            <span class="rest-big-label">REPOS · ${restSec}s</span>
          </button>
        </div>`;
    }).join('');

    const targetSets = ex.targetSets || 3;
    const setsDone = ex.sets.filter(s => s.validated).length;
    const allSetsDone = setsDone >= targetSets;

    body.innerHTML = `
      <div class="workout-progress">
        <div class="workout-progress-bar">
          <div class="workout-progress-fill" style="width:${((_workout.exoIdx) / total) * 100}%"></div>
        </div>
        <div class="workout-progress-text">
          Exo <strong>${_workout.exoIdx + 1}</strong> / ${total}
          · Séries <strong>${setsDone}</strong> / ${targetSets}
        </div>
      </div>

      ${blockHtml}

      <div class="workout-exo-card">
        <div class="workout-exo-header">
          <span class="cat-badge" style="background:${catInfo.color}20;color:${catInfo.color}">${catInfo.icon} ${catInfo.label}</span>
          <h2>${ex.name}</h2>
          <button class="btn-swap" onclick="MuscuApp.openSwap()" title="Remplacer par un autre exo">🔄</button>
          ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="video-link">▶ Tuto</a>` : ''}
        </div>
        <div class="workout-rx">
          <span class="rx-pill">${targetSets} × ${ex.targetReps}</span>
          ${ex.startWeight ? `<span class="rx-pill rx-weight">~${ex.startWeight}kg</span>` : ''}
          <span class="rx-pill rx-rest">⏱ Repos ${ex.restSec}s</span>
        </div>
        ${ex.notes ? `<div class="workout-notes text-muted text-sm">${ex.notes}</div>` : ''}
        ${suggestionHtml}
        ${info && info.cues ? `
          <div class="technique-cues">
            <div class="cues-title">Points clés :</div>
            <ul>${info.cues.slice(0, 3).map(c => `<li>${c}</li>`).join('')}</ul>
          </div>` : ''}
      </div>

      ${partnersHtml}

      <div class="workout-sets">
        ${setsHtml || '<p class="text-muted text-sm" style="text-align:center;padding:10px">Ajoute ta première série</p>'}
      </div>

      <div class="workout-actions">
        <button class="btn btn-sm btn-ghost" onclick="MuscuApp.workoutAddSet()">+ Série</button>
        ${allSetsDone
          ? `<button class="btn btn-abs" onclick="MuscuApp.workoutNextExo()">Suivant exo →</button>`
          : `<button class="btn btn-secondary" onclick="MuscuApp.workoutNextExo()">Passer à l'exo suivant</button>`}
      </div>
    `;

    // Auto-add a first empty set if none
    if (ex.sets.length === 0) {
      ex.sets.push({ weight: ex.startWeight || '', reps: typeof ex.targetReps === 'number' ? ex.targetReps : '', rpe: '', validated: false });
      _renderWorkout();
    }
  }

  function workoutUpdateSet(setIdx, field, value) {
    const ex = _workout.exoData[_workout.exoIdx];
    ex.sets[setIdx][field] = field === 'rpe' ? (value ? parseInt(value) : '') : (parseFloat(value) || '');
  }

  function workoutValidateSet(setIdx) {
    const ex = _workout.exoData[_workout.exoIdx];
    const set = ex.sets[setIdx];
    if (!set.weight || !set.reps) {
      _toast('Renseigne poids et reps avant de valider', 'error');
      return;
    }
    set.validated = true;
    // If it's the last set and we haven't reached target, queue a new empty set
    const targetSets = ex.targetSets || 3;
    if (setIdx === ex.sets.length - 1 && ex.sets.length < targetSets) {
      ex.sets.push({ weight: set.weight, reps: set.reps, rpe: '', validated: false });
    }
    _renderWorkout();
    _startRestTimer(ex.restSec || _defaultRestFor(ex.category), ex.name);
  }

  function workoutAddSet() {
    const ex = _workout.exoData[_workout.exoIdx];
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({
      weight: last ? last.weight : (ex.startWeight || ''),
      reps: last ? last.reps : (typeof ex.targetReps === 'number' ? ex.targetReps : ''),
      rpe: '',
      validated: false,
    });
    _renderWorkout();
  }

  function workoutUnvalidate(setIdx) {
    const ex = _workout.exoData[_workout.exoIdx];
    if (!ex.sets[setIdx]) return;
    ex.sets[setIdx].validated = false;
    _stopRestTimer();
    _renderWorkout();
  }

  function workoutRemoveSet(setIdx) {
    const ex = _workout.exoData[_workout.exoIdx];
    ex.sets.splice(setIdx, 1);
    if (ex.sets.length === 0) {
      ex.sets.push({ weight: ex.startWeight || '', reps: typeof ex.targetReps === 'number' ? ex.targetReps : '', rpe: '', validated: false });
    }
    _renderWorkout();
  }

  function workoutNextExo() {
    _stopRestTimer();
    _workout.exoIdx++;
    _renderWorkout();
  }

  function workoutJumpToExo(idx) {
    if (!_workout) return;
    if (idx < 0 || idx >= _workout.exoData.length) return;
    _stopRestTimer();
    _workout.exoIdx = idx;
    _renderWorkout();
  }

  function workoutSkipExo() {
    if (!_workout) return;
    if (!confirm('Passer cet exo et aller au suivant ?')) return;
    _stopRestTimer();
    _workout.exoIdx++;
    _renderWorkout();
  }

  function _renderWorkoutSummary() {
    const body = document.getElementById('workout-body');
    const durationMin = Math.round((Date.now() - _workout.startedAt) / 60000);
    const totalSets = _workout.exoData.reduce((s, e) => s + e.sets.filter(x => x.validated).length, 0);
    const totalVolume = _workout.exoData.reduce((s, e) =>
      s + e.sets.filter(x => x.validated).reduce((ss, x) => ss + (x.weight || 0) * (x.reps || 0), 0), 0);

    body.innerHTML = `
      <div class="workout-done">
        <div class="workout-done-icon">💪</div>
        <h2>Séance terminée !</h2>
        <div class="workout-stats">
          <div class="ws-stat"><div class="ws-val">${durationMin}min</div><div class="ws-label">Durée</div></div>
          <div class="ws-stat"><div class="ws-val">${totalSets}</div><div class="ws-label">Séries</div></div>
          <div class="ws-stat"><div class="ws-val">${totalVolume > 1000 ? Math.round(totalVolume/100)/10 + 't' : totalVolume + 'kg'}</div><div class="ws-label">Volume</div></div>
        </div>

        <div class="input-group" style="margin-top:14px">
          <label>RPE global de la séance</label>
          <div class="rpe-slider-group">
            <input type="range" id="workout-rpe" min="1" max="10" value="7" oninput="document.getElementById('workout-rpe-val').textContent=this.value">
            <span class="rpe-val" id="workout-rpe-val">7</span>
          </div>
        </div>
        <div class="input-group">
          <label>Sommeil dernière nuit (h)</label>
          <input type="number" id="workout-sleep" placeholder="Ex: 7.5" step="0.5" min="0" max="12">
        </div>
        <div class="input-group">
          <label>Douleurs / gênes</label>
          <input type="text" id="workout-pain" placeholder="Ex: gêne genou droit...">
        </div>
        <div class="input-group">
          <label>Notes</label>
          <textarea id="workout-notes" placeholder="Sensations, fatigue, observations..."></textarea>
        </div>

        <button class="btn btn-abs" onclick="MuscuApp.workoutFinish()" style="margin-top:10px">Sauvegarder la séance</button>
      </div>
    `;
  }

  function workoutFinish() {
    if (!_workout) return;
    const session = {
      date: new Date().toISOString().slice(0, 10),
      type: 'musculation',
      globalRpe: parseInt(document.getElementById('workout-rpe').value) || 7,
      sleepHours: parseFloat(document.getElementById('workout-sleep').value) || null,
      painNotes: document.getElementById('workout-pain').value.trim(),
      notes: document.getElementById('workout-notes').value.trim(),
      durationMin: Math.round((Date.now() - _workout.startedAt) / 60000),
      exercises: _workout.exoData.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter(s => s.validated).map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          rpe: s.rpe || null,
        })),
        rpe: null,
      })),
    };

    session.exercises.forEach(ex => {
      const rpeSets = ex.sets.filter(s => s.rpe);
      if (rpeSets.length) ex.rpe = Math.round(rpeSets.reduce((s, r) => s + r.rpe, 0) / rpeSets.length);
    });

    MuscuStorage.saveSession(session);

    // Mark plan day done
    const plan = MuscuStorage.getWeekPlan();
    if (plan && plan.days[_workout.dayIdx]) {
      plan.days[_workout.dayIdx].status = 'done';
      MuscuStorage.saveWeekPlan(plan);
    }

    _toast('Séance enregistrée — bien joué 💪', 'success');
    _stopRestTimer();
    document.getElementById('workout-modal').style.display = 'none';
    _lastSavedSession = session;
    _showFeedbackForm(session);
    _workout = null;
    renderDashboard();
  }

  function openSwap() {
    if (!_workout) return;
    const ex = _workout.exoData[_workout.exoIdx];
    const validatedSets = ex.sets.filter(s => s.validated).length;
    if (validatedSets > 0) {
      if (!confirm(`Tu as déjà validé ${validatedSets} série(s) sur cet exo. Remplacer va les conserver mais sur le nouvel exo. Continuer ?`)) return;
    }
    const alternatives = MuscuExercises.findAlternatives(ex.exerciseId, 6);
    if (!alternatives.length) {
      _toast('Pas d\'alternative trouvée dans la banque', 'info');
      return;
    }
    document.getElementById('swap-current-name').innerHTML = `Actuel : <strong>${ex.name}</strong>`;
    document.getElementById('swap-alternatives').innerHTML = alternatives.map(({ exo, reason }) => {
      const cat = MuscuExercises.getCategoryInfo(exo.category);
      return `
        <div class="swap-alt-card" onclick="MuscuApp.swapTo('${exo.id}')">
          <div class="swap-alt-header">
            <span class="cat-badge" style="background:${cat.color}20;color:${cat.color}">${cat.icon} ${cat.label}</span>
            <strong>${exo.name}</strong>
          </div>
          <div class="swap-alt-meta text-muted text-sm">
            ${exo.equipment} · ${(exo.primary || []).join(', ')}
          </div>
          <div class="swap-alt-reason text-sm">↳ ${reason}</div>
        </div>`;
    }).join('');
    document.getElementById('swap-exo-modal').style.display = 'flex';
  }

  function closeSwap() {
    document.getElementById('swap-exo-modal').style.display = 'none';
  }

  function swapTo(newId) {
    if (!_workout) return closeSwap();
    const newExo = MuscuExercises.getById(newId);
    if (!newExo) return closeSwap();
    const ex = _workout.exoData[_workout.exoIdx];
    const oldName = ex.name;
    // Re-compute smart suggestion for the new exo
    const suggestion = MuscuStorage.suggestNextLoad(newId, typeof ex.targetReps === 'number' ? ex.targetReps : null);
    ex.exerciseId = newExo.id;
    ex.name = newExo.name;
    ex.category = newExo.category;
    ex.smartSuggestion = suggestion;
    ex.swappedFrom = oldName;
    closeSwap();
    _renderWorkout();
    _toast(`${oldName} → ${newExo.name}`, 'success');
  }

  function workoutCancel() {
    if (!_workout) {
      document.getElementById('workout-modal').style.display = 'none';
      return;
    }
    const hasData = _workout.exoData.some(e => e.sets.some(s => s.validated));
    if (hasData && !confirm('Quitter la séance ? Tes progrès seront perdus.')) return;
    _stopRestTimer();
    _workout = null;
    document.getElementById('workout-modal').style.display = 'none';
  }

  // ════════════════════════════════════════════════════════════
  //  FEEDBACK (post-session)
  // ════════════════════════════════════════════════════════════
  let _lastSavedSession = null;

  function _showFeedbackForm(session) {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    const exerciseNames = (session.exercises || []).map(e => {
      const info = MuscuExercises.getById(e.exerciseId);
      return info ? info.name : e.exerciseId;
    });

    // Build exercise checkboxes for liked/disliked/tooHard/tooEasy
    const exCheckboxes = exerciseNames.map((name, i) => `
      <div class="fb-exercise-row">
        <span class="fb-ex-name">${name}</span>
        <div class="fb-ex-ratings">
          <label class="fb-chip" title="Aimé"><input type="checkbox" name="fb-liked" value="${name}"> 👍</label>
          <label class="fb-chip" title="Pas aimé"><input type="checkbox" name="fb-disliked" value="${name}"> 👎</label>
          <label class="fb-chip" title="Trop dur"><input type="checkbox" name="fb-hard" value="${name}"> 🔴</label>
          <label class="fb-chip" title="Trop facile"><input type="checkbox" name="fb-easy" value="${name}"> 🟢</label>
        </div>
      </div>`).join('');

    document.getElementById('fb-exercises').innerHTML = exCheckboxes;
    document.getElementById('fb-missing').value = '';
    document.getElementById('fb-notes').value = '';
    modal.style.display = 'flex';
  }

  function saveFeedback() {
    const liked = [...document.querySelectorAll('input[name="fb-liked"]:checked')].map(el => el.value);
    const disliked = [...document.querySelectorAll('input[name="fb-disliked"]:checked')].map(el => el.value);
    const tooHard = [...document.querySelectorAll('input[name="fb-hard"]:checked')].map(el => el.value);
    const tooEasy = [...document.querySelectorAll('input[name="fb-easy"]:checked')].map(el => el.value);
    const missing = document.getElementById('fb-missing').value.trim();
    const notes = document.getElementById('fb-notes').value.trim();
    const mood = document.querySelector('input[name="fb-mood"]:checked')?.value || '';

    const fb = {
      sessionId: _lastSavedSession ? _lastSavedSession.id : null,
      date: _lastSavedSession ? _lastSavedSession.date : new Date().toISOString().slice(0, 10),
      liked, disliked, tooHard, tooEasy, missing, notes, mood,
    };

    MuscuStorage.saveFeedback(fb);
    document.getElementById('feedback-modal').style.display = 'none';
    _toast('Feedback enregistré — l\'IA en tiendra compte', 'success');
  }

  function skipFeedback() {
    document.getElementById('feedback-modal').style.display = 'none';
  }

  return {
    init, switchTab,
    saveOnboarding, launchPlan,
    renderDashboard, renderLog, renderHistory, renderCoach, renderExerciseBank,
    showDayDetail, closeDayDetail,
    addSet, removeSet, updateSet, removeExercise,
    validateSet, unvalidateSet, skipRest, addRestTime,
    skipDay,
    openPainPrompt, closePainPrompt, savePain,
    showAbsSession, closeAbsSession, startAbsSession, absMarkDone,
    absSkipToRest, absSkipRest, absSkipExo, finishAbsSession,
    // Workout in progress (mode séance guidée)
    startWorkout, workoutUpdateSet, workoutValidateSet, workoutAddSet,
    workoutUnvalidate, workoutRemoveSet,
    workoutNextExo, workoutJumpToExo, workoutSkipExo, workoutFinish, workoutCancel,
    openSwap, closeSwap, swapTo,
    showAddExercise, closeAddExercise, filterExercises, pickExercise,
    saveSession, updateRpeDisplay,
    setHistoryFilter, showSessionDetail, closeSessionDetail, deleteSessionConfirm,
    coachPreset, coachSend, sendCoachMessage,
    showObjectives, saveObjectives, closeObjectives,
    showSettings, saveSettings, closeSettings,
    regeneratePlan, resetAllData,
    // Feedback
    saveFeedback, skipFeedback,
    // Exercise bank
    setBankFilter, bankSearchChange, showExerciseDetail, closeExerciseDetail,
  };
})();

document.addEventListener('DOMContentLoaded', MuscuApp.init);
