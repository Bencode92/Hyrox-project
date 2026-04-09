/* ============================================================
   MUSCU-APP  —  Main controller for HyroxForge Musculation
   ============================================================ */

const MuscuApp = (() => {
  let currentTab = 'dashboard';
  let currentEditSession = null;

  // ── Init ──────────────────────────────────────────────────
  function init() {
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
      weight: parseFloat(document.getElementById('ob-weight').value) || 75,
      daysPerWeek: parseInt(document.getElementById('ob-days').value) || 4,
      level: document.getElementById('ob-level').value || 'intermediate',
      injuryNotes: document.getElementById('ob-injury').value.trim(),
      createdAt: new Date().toISOString(),
    };
    MuscuStorage.saveProfile(profile);

    const maxFields = ['back_squat', 'bench_press', 'deadlift', 'ohp', 'barbell_row'];
    maxFields.forEach(id => {
      const val = parseFloat(document.getElementById('ob-max-' + id)?.value);
      if (val > 0) {
        const prs = MuscuStorage.getPRs();
        prs[id] = {
          best1RM: val,
          bestWeight: Math.round(val * 0.85),
          bestReps: 5,
          bestDate: new Date().toISOString().slice(0, 10),
          history: [{ date: new Date().toISOString().slice(0, 10), weight: Math.round(val * 0.85), reps: 5, e1rm: val }],
        };
        localStorage.setItem('mf_prs', JSON.stringify(prs));
      }
    });

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

    // Try AI generation first
    _toast('Génération IA du plan en cours...', 'info');
    try {
      const aiPlan = await MuscuAI.generateWeekPlan();
      if (aiPlan) {
        MuscuStorage.saveWeekPlan(aiPlan);
        _toast('Plan IA généré !', 'success');
        _renderAll();
        return;
      }
    } catch (e) { console.warn('AI plan generation failed, using local fallback', e); }

    // Fallback to local
    const plan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), 1);
    MuscuStorage.saveWeekPlan(plan);
    _renderAll();
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

    _renderWeekPlan(plan);
    _renderPRCards(prs, objectives);
    _renderObjectivesProgress(prs, objectives);
  }

  function _getPhaseLabel(weekNum) {
    if (weekNum <= 3) return 'Phase 0 — Retour blessure';
    if (weekNum <= 8) return 'Phase Adaptation';
    if (weekNum <= 14) return 'Phase Construction';
    if (weekNum <= 20) return 'Phase Force (max 80% 1RM)';
    return 'Phase Pré-compétition';
  }

  function _renderWeekPlan(plan) {
    const container = document.getElementById('dash-plan');
    if (!plan || !plan.days) { container.innerHTML = '<p class="text-muted">Aucun plan</p>'; return; }
    let html = '';
    if (plan.aiGenerated) {
      html += '<div class="ai-plan-badge">🤖 Plan créé par le Coach IA</div>';
    }
    html += plan.days.map((day, i) => {
      const statusClass = day.status === 'done' ? 'plan-done' : day.status === 'skipped' ? 'plan-skipped' : '';
      const statusIcon = day.status === 'done' ? '✓' : day.status === 'skipped' ? '✕' : (i + 1);
      const catInfo = MuscuExercises.getCategoryInfo(day.exercises[0]?.category || 'lower');
      const finisherBadge = day.finisher ? '<span class="finisher-mini">⚡ Finisher</span>' : '';
      return `
        <div class="plan-day-card ${statusClass}" onclick="MuscuApp.showDayDetail(${i})">
          <div class="plan-day-num" style="background:${catInfo.color}20;color:${catInfo.color}">${statusIcon}</div>
          <div class="plan-day-info">
            <strong>${day.label}</strong>
            <span class="text-muted text-sm">${day.exercises.length} exercices — ${day.focus} ${finisherBadge}</span>
          </div>
        </div>`;
    }).join('');
    container.innerHTML = html;
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
      modal.style.display = 'none';
      _prefillLog(day, dayIndex);
      switchTab('log');
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
      document.getElementById('day-detail-log-btn').textContent = 'Enregistrer cette séance';
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
    logExercises = day.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      category: ex.category,
      targetSets: ex.sets,
      targetReps: ex.reps,
      suggestedWeight: ex.suggestedWeight,
      sets: [],
    }));
    document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('log-session-label').textContent = day.label;
    _renderLogExercises();
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
    container.innerHTML = logExercises.map((ex, exIdx) => {
      const catInfo = MuscuExercises.getCategoryInfo(ex.category);
      const info = MuscuExercises.getById(ex.exerciseId);
      const setsHtml = ex.sets.map((set, setIdx) => `
        <div class="log-set-row">
          <span class="set-num">${setIdx + 1}</span>
          <input type="number" class="input-sm" placeholder="kg" value="${set.weight || ''}"
                 onchange="MuscuApp.updateSet(${exIdx},${setIdx},'weight',this.value)" step="2.5" min="0">
          <span class="text-muted">×</span>
          <input type="number" class="input-sm" placeholder="reps" value="${set.reps || ''}"
                 onchange="MuscuApp.updateSet(${exIdx},${setIdx},'reps',this.value)" min="1">
          <select class="input-sm rpe-select" onchange="MuscuApp.updateSet(${exIdx},${setIdx},'rpe',this.value)">
            <option value="">RPE</option>
            ${[5,6,7,8,9,10].map(r => `<option value="${r}" ${set.rpe == r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <button class="btn-icon btn-delete" onclick="MuscuApp.removeSet(${exIdx},${setIdx})">✕</button>
        </div>`).join('');

      return `
        <div class="log-exercise-card">
          <div class="log-ex-header">
            <span class="cat-dot" style="background:${catInfo.color}"></span>
            <strong>${ex.name}</strong>
            <span class="text-muted text-sm">${ex.targetSets || '?'}×${ex.targetReps || '?'} ${ex.suggestedWeight ? '@ ' + ex.suggestedWeight + 'kg' : ''}</span>
            ${info && info.videoUrl ? `<a href="${info.videoUrl}" target="_blank" class="video-link-sm" title="Tuto vidéo">▶</a>` : ''}
            <button class="btn-icon btn-delete" onclick="MuscuApp.removeExercise(${exIdx})">🗑</button>
          </div>
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
    });
    _renderLogExercises();
  }

  function removeSet(exIdx, setIdx) { logExercises[exIdx].sets.splice(setIdx, 1); _renderLogExercises(); }
  function updateSet(exIdx, setIdx, field, value) {
    logExercises[exIdx].sets[setIdx][field] = field === 'rpe' ? (value ? parseInt(value) : '') : parseFloat(value) || '';
  }
  function removeExercise(exIdx) { logExercises.splice(exIdx, 1); _renderLogExercises(); }

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
    logExercises.push({
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      targetSets: 3,
      targetReps: 10,
      suggestedWeight: pr ? Math.round(pr.bestWeight / 2.5) * 2.5 : null,
      sets: [{ weight: pr ? Math.round(pr.bestWeight / 2.5) * 2.5 : '', reps: '', rpe: '' }],
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
  }

  // ════════════════════════════════════════════════════════════
  //  HISTORY
  // ════════════════════════════════════════════════════════════
  let historyFilter = 'all';

  function renderHistory() {
    const sessions = MuscuStorage.getSessions().slice().reverse();
    const prs = MuscuStorage.getPRs();

    document.getElementById('history-filter').innerHTML = ['all', 'lower', 'upper_push', 'upper_pull', 'core', 'explosive'].map(f => {
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
    document.getElementById('set-weight').value = profile.weight || '';
    document.getElementById('set-days').value = profile.daysPerWeek || 4;
    document.getElementById('set-level').value = profile.level || 'intermediate';
    document.getElementById('set-injury').value = profile.injuryNotes || '';
    modal.style.display = 'flex';
  }

  function saveSettings() {
    const settings = MuscuStorage.getSettings();
    settings.workerUrl = document.getElementById('set-worker-url').value.trim();
    MuscuStorage.saveSettings(settings);
    const profile = MuscuStorage.getProfile();
    profile.weight = parseFloat(document.getElementById('set-weight').value) || profile.weight;
    profile.daysPerWeek = parseInt(document.getElementById('set-days').value) || profile.daysPerWeek;
    profile.level = document.getElementById('set-level').value || profile.level;
    profile.injuryNotes = document.getElementById('set-injury').value.trim();
    MuscuStorage.saveProfile(profile);
    document.getElementById('settings-modal').style.display = 'none';
    _toast('Paramètres sauvegardés', 'success');
  }

  function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

  async function _autoRegenPlan(weekNum) {
    try {
      const aiPlan = await MuscuAI.generateWeekPlan();
      if (aiPlan) { MuscuStorage.saveWeekPlan(aiPlan); renderDashboard(); return; }
    } catch (e) { /* fallback */ }
    const plan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), weekNum);
    MuscuStorage.saveWeekPlan(plan);
    renderDashboard();
  }

  async function regeneratePlan() {
    if (!confirm('Régénérer le plan via le Coach IA ?')) return;
    _toast('Le Coach IA crée ton plan...', 'info');

    try {
      const aiPlan = await MuscuAI.generateWeekPlan();
      if (aiPlan) {
        MuscuStorage.saveWeekPlan(aiPlan);
        _toast('Plan IA généré !', 'success');
        renderDashboard();
        return;
      }
    } catch (e) { console.warn('AI plan failed', e); }

    // Fallback
    const weekNum = MuscuStorage.getWeekNumber();
    const plan = MuscuExercises.generateWeekPlan(MuscuStorage.getProfile(), weekNum);
    MuscuStorage.saveWeekPlan(plan);
    renderDashboard();
    _toast('Plan local généré (IA indisponible)', 'info');
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
