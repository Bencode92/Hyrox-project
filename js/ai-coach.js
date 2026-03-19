/* HyroxForge — AI Coach v3 — Expert validated */
const AICoach = {
  PROXY: 'https://studyforge-proxy.benoit-comas.workers.dev',

  SYSTEM_PROMPT: `Tu es le coach sportif IA de HyroxForge. Focus: Run, Row, SkiErg pour Hyrox.

PROFIL ATHLÈTE :
- Prépa Hyrox 6 mois, tendon d'Achille en guérison
- Objectif réaliste: 13.5 km/h en 6 mois, 15 km/h en 12 mois
- VMA corrigée = test 1km × 0.95 (ou demi-Cooper: distance/100)
- Row = point faible majeur (bottom 5%), ROI le plus élevé

RÈGLES VALIDÉES COACH + EXPERT :
1. PROGRESSION dégressive: +1.5%/3sem (S1-8), +2%/3sem (S9-16), +1%/3sem (S17-24). Plafond +12%.
2. ADAPTATION RPE: ≤4 → +6%, 5 → +4%, 6-7 → +2%, 8 → hold, 9 → -3%, 10 → -7%.
3. DÉCHARGE 3+1: sem 4,8,12,16,20,24 = -30% volume ET -10-15% intensité.
4. RÉCUP fractionné court: 90s si VMA ≥ 13, sinon ratio 1:1 (récup = durée effort).
5. Cap fractionné long: 6×1000m max.
6. ROW: semaines 1-4 = 100% technique (cadence 20-22), sem 5-8 = 70% tech / 30% endurance, sem 9+ = toutes intensités.
7. SESSIONS MAX: 4/sem S1-8 (2 run + 1 row + 1 ski), 5/sem S9-16, 5-6/sem S17-24.
8. TENDON: douleur > 3/10 → -50% volume, pas de course. Toujours eccentric heel drops.
9. GILET: interdit avant sem 8. Sem 8-12: marche uniquement. Sem 12+: Z2 run. Max 10kg.
10. PACING HYROX: Run 1 = allure cible + 8s (échauffement). Run 2-7 = cible. Run 8 = cible - 5s (finish).
11. BRICK (sem 8+): ergo + run enchaîné = simulation Hyrox cardio.
12. FARTLEK HYROX (sem 8+): 30s sprint 105% VMA / 90s Z2 = simule relance post-station.
13. CÔTES (sem 8+): montantes uniquement, redescente en marchant. 4-6 × 200m.

FORMAT : Direct, chiffres exacts. Motivant mais honnête. Si 15 km/h en 6 mois est irréaliste, dis-le.

Quand tu génères une SÉANCE, réponds en JSON strict :
{"next_session":{"date":"YYYY-MM-DD","exercise":"run|row|ski","location":"outdoor|gym","type":"z2|tempo|intervals_short|intervals_long|long_run|fartlek|fartlek_hyrox|brick|technique|power|endurance|racePace|test","warmup":"...","main":"...","cooldown":"...","details":{"sets":null,"distance_per_set":null,"total_distance":0,"target_pace":"M:SS","target_speed_kmh":0,"rest_seconds":null},"vest":{"use":false,"weight_kg":0,"reason":""},"coaching_tip":"..."},"analysis":"..."}`,

  getWorkerUrl() {
    const s = Storage.getSettings();
    return s.workerUrl || this.PROXY;
  },

  async callClaude(userMessage, expectJSON) {
    const url = this.getWorkerUrl();
    const context = Storage.exportForAI();
    const zones = Training.getZonesSummary();
    const week = Training.getCurrentWeek();
    const maxSess = Training.getMaxSessionsPerWeek(week);
    const rowPhase = Training.getRowPhaseLabel(week);
    const pacing = zones ? Training.getPacingStrategy((zones.run.tempo.min + zones.run.tempo.max) / 2) : null;

    const sys = this.SYSTEM_PROMPT +
      '\nSEMAINE: ' + (week+1) + (Training.isDeloadWeek(week) ? ' (DÉCHARGE -30% vol, -12% intensité)' : '') +
      '\nSESSIONS MAX: ' + maxSess + '/semaine' +
      '\nROW PHASE: ' + rowPhase +
      (pacing ? '\nPACING: Run1=' + pacing.run1.label + ', Run2-7=' + pacing.run2to7.label + ', Run8=' + pacing.run8.label : '') +
      '\nZONES: ' + (zones ? JSON.stringify({
        vma: zones.run.vma,
        z2: Training.fmtS(zones.run.z2.min)+'-'+Training.fmtS(zones.run.z2.max),
        tempo: Training.fmtS(zones.run.tempo.min)+'-'+Training.fmtS(zones.run.tempo.max),
        frac_court: Training.fmtS(zones.run.iv_short.min)+'-'+Training.fmtS(zones.run.iv_short.max),
        row_pace500: Training.fmtP(zones.row.testPace500),
        ski_pace500: Training.fmtP(zones.ski.testPace500)
      }) : 'non calibré') +
      '\nDONNÉES:\n' + JSON.stringify(context, null, 2);

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: sys, messages: [{ role: 'user', content: userMessage }] }),
    });
    if (!r.ok) {
      if (r.status === 429) throw new Error('API surchargée, réessaie dans 30s');
      throw new Error('Erreur: ' + r.status);
    }
    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    if (expectJSON) {
      try { return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()); }
      catch { return { analysis: text, next_session: null }; }
    }
    return text;
  },

  async generateNextSession() {
    if (Storage.getSessions().length === 0) { App.toast('Enregistre d\'abord une séance', 'info'); return; }
    const btn = document.querySelector('.nsc-header .btn-sm');
    const body = document.getElementById('nextSessionBody');
    btn.disabled = true; btn.textContent = 'Génération...';
    body.innerHTML = '<div class="msg-loading">Le coach analyse...</div>';
    try {
      const result = await this.callClaude('Génère ma prochaine séance. Respecte le nombre max de séances/semaine, la phase row, et la décharge si applicable. Réponds en JSON.', true);
      if (result.next_session) this.renderNextSession(result.next_session, result.analysis);
      else body.innerHTML = '<div style="line-height:1.5">' + this.fmt(result.analysis || 'Pas de réponse') + '</div>';
    } catch (err) { body.innerHTML = '<div style="color:var(--accent-red)">' + err.message + '</div>'; }
    finally { btn.disabled = false; btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3m.64 6.36l-2.12-2.12M12 21v-3m-6.36.64l2.12-2.12M3 12h3m-.64-6.36l2.12 2.12"/></svg> IA'; }
  },

  renderNextSession(ns, analysis) {
    const body = document.getElementById('nextSessionBody');
    const e = Scoring.getTypeEmoji(ns.exercise), n = Scoring.getTypeName(ns.exercise);
    const st = Scoring.getSessionTypeLabel(ns.type), loc = ns.location==='outdoor'?'Extérieur':'Salle';
    body.innerHTML = '<div class="nsc-detail">' +
      '<span class="label">Exercice</span><span class="val">' + e + ' ' + n + ' — ' + st + '</span>' +
      '<span class="label">Lieu</span><span class="val">' + loc + '</span>' +
      '<span class="label">Échauff</span><span class="val">' + (ns.warmup||'—') + '</span>' +
      '<span class="label">Séance</span><span class="val">' + (ns.main||'—') + '</span>' +
      (ns.details?.target_pace ? '<span class="label">Pace</span><span class="val">' + ns.details.target_pace + '</span>' : '') +
      (ns.details?.sets ? '<span class="label">Séries</span><span class="val">' + ns.details.sets + ' × ' + ns.details.distance_per_set + 'm — repos ' + ns.details.rest_seconds + 's</span>' : '') +
      '<span class="label">Retour</span><span class="val">' + (ns.cooldown||'—') + '</span>' +
      '<span class="label">Gilet</span><span class="val">' + (ns.vest?.use ? ns.vest.weight_kg+'kg' : 'Non') + (ns.vest?.reason ? ' — '+ns.vest.reason : '') + '</span></div>' +
      (ns.coaching_tip ? '<div class="nsc-tip">'+ns.coaching_tip+'</div>' : '') +
      (analysis ? '<div style="margin-top:8px;font-size:12px;color:var(--text-secondary);line-height:1.5">' + this.fmt(analysis) + '</div>' : '');
  },

  async ask(preset) {
    const prompts = {
      next_session: 'Génère ma prochaine séance basée sur mon historique. Respecte la phase row et le max sessions/semaine.',
      weekly_plan: 'Plan de la semaine jour par jour. Max ' + Training.getMaxSessionsPerWeek(Training.getCurrentWeek()) + ' séances cardio. Phase row: ' + Training.getRowPhaseLabel(Training.getCurrentWeek()),
      progress_report: 'Bilan progression: ce qui va, ce qui ne va pas, ajustements. Suis-je sur la trajectoire pour 13.5 km/h en 6 mois?',
      vest_advice: 'Suis-je prêt pour le gilet lesté ? Rappel: interdit avant sem 8, marche uniquement sem 8-12.',
      pacing: 'Donne-moi ma stratégie de pacing pour les 8 runs Hyrox basée sur mes zones actuelles.',
    };
    const msg = prompts[preset] || preset;
    this.addUserMsg(msg); await this.process(msg);
  },

  async sendMessage() {
    const input = document.getElementById('coachInput');
    const msg = input.value.trim(); if (!msg) return;
    input.value = ''; this.addUserMsg(msg); await this.process(msg);
  },

  async process(msg) {
    const c = document.getElementById('coachMessages');
    const ld = document.createElement('div'); ld.className = 'msg-ai';
    ld.innerHTML = '<div class="coach-avatar" style="width:28px;height:28px;font-size:14px">🤖</div><div class="msg-bubble msg-loading">Analyse...</div>';
    c.appendChild(ld); ld.scrollIntoView({behavior:'smooth'});
    try {
      const resp = await this.callClaude(msg);
      ld.querySelector('.msg-bubble').innerHTML = this.fmt(resp);
      ld.querySelector('.msg-bubble').classList.remove('msg-loading');
    } catch (err) {
      ld.querySelector('.msg-bubble').innerHTML = '<span style="color:var(--accent-red)">' + err.message + '</span>';
      ld.querySelector('.msg-bubble').classList.remove('msg-loading');
    }
    ld.scrollIntoView({behavior:'smooth'});
  },

  addUserMsg(text) {
    const c = document.getElementById('coachMessages');
    const d = document.createElement('div'); d.className = 'msg-user';
    d.innerHTML = '<div class="msg-bubble">' + this.esc(text) + '</div>';
    c.appendChild(d);
  },

  async analyzeSession(session) {
    const ad = document.getElementById('aiAnalysis'), bd = document.getElementById('aiAnalysisBody');
    ad.classList.remove('hidden');
    bd.innerHTML = '<div class="msg-loading">Analyse...</div>';
    try {
      const resp = await this.callClaude('Séance terminée: ' + JSON.stringify(session) + '. Analyse, adaptation pour la prochaine, et alerte tendon si besoin.');
      bd.innerHTML = this.fmt(resp);
    } catch {
      this.showLocal(session, bd);
    }
  },

  showLocal(session, container) {
    const sc = Scoring.scoreSession(session), dt = Scoring.computeDelta(session);
    let h = '<strong>Score: ' + sc + '/100</strong><br>';
    if (dt) { h += dt.improved ? '<span style="color:var(--accent-2)">+' + Math.abs(dt.seconds).toFixed(0) + 's plus rapide</span><br>' : (dt.seconds > 0 ? '<span style="color:var(--accent-red)">-' + dt.seconds.toFixed(0) + 's plus lent</span><br>' : 'Stable<br>'); }
    if (session.rpe >= 9) h += '<br>⚠️ RPE ' + session.rpe + '/10 — récupération recommandée.';
    if (session.pain > 2) h += '<br>⚠️ Tendon ' + session.pain + '/10 — réduire le volume.';
    container.innerHTML = h;
  },

  fmt(t) { return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); },
  esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; },

  /* ========== AI PLAN ADAPTATION ========== */
  async adaptPlanAfterSkip(slotIndex) {
    const plan = Planner.getSavedPlan();
    if (!plan) return;
    const pos = Planner.getPlanPosition();
    const skippedDay = plan[slotIndex];
    if (!skippedDay || !skippedDay.session) return;

    // Find future slots that could absorb the skipped session
    const futureSlotsInfo = plan.slice(pos.dayInWeek + 1).filter(d => d.slot !== 'rest' && !d.done && !d.skipped);

    try {
      const result = await this.callClaude(
        'L\'athlète a SKIP la séance du jour ' + (slotIndex + 1) + ' (' + skippedDay.day + '): ' +
        Scoring.getSessionTypeLabel(skippedDay.sessionType) + ' (' + skippedDay.exerciseType + ').\n' +
        'Jours restants cette semaine: ' + futureSlotsInfo.map(d => d.day + ' = ' + Scoring.getSessionTypeLabel(d.sessionType)).join(', ') + '.\n' +
        'Faut-il reporter cette séance ou adapter la semaine ? ' +
        'Réponds en JSON: {"action":"report|adapt|ignore","reason":"...","modifications":[{"slotIndex":N,"newType":"sessionType","newExercise":"run|row|ski"}]}',
        true
      );

      if (result.modifications && result.modifications.length > 0) {
        result.modifications.forEach(mod => {
          if (mod.slotIndex !== undefined && mod.newType) {
            Planner.applyAIModification(mod.slotIndex, mod.newType, mod.newExercise);
          }
        });
        App.renderWeekPlan();
        App.toast('🤖 Plan adapté: ' + (result.reason || 'séance reportée'), 'success');
      } else if (result.reason) {
        App.toast('🤖 ' + result.reason, 'info');
      }
    } catch (err) {
      console.log('[AI] Skip adaptation fallback:', err.message);
      // Fallback local: just inform
      App.toast('Séance skipée — pense à compenser', 'info');
    }
  },

  async adaptPlanAfterSession(session) {
    const plan = Planner.getSavedPlan();
    if (!plan) return;
    const pos = Planner.getPlanPosition();

    // Only adapt future sessions
    const futureSlotsInfo = plan.slice(pos.dayInWeek + 1).filter(d => d.slot !== 'rest' && !d.done && !d.skipped);
    if (futureSlotsInfo.length === 0) return;

    const alert = session.rpe >= 9 ? 'RPE ' + session.rpe + ' (surcharge)' :
                  session.pain >= 3 ? 'Douleur tendon ' + session.pain + '/10' : '';

    try {
      const result = await this.callClaude(
        'Séance terminée: ' + JSON.stringify({
          type: session.type, sessionType: session.sessionType,
          rpe: session.rpe, pain: session.pain, pace: session.pace
        }) + '.\nALERTE: ' + alert +
        '\nSéances restantes cette semaine: ' + futureSlotsInfo.map(d =>
          'slot ' + d.slotIndex + ': ' + d.day + ' = ' + d.exerciseType + '/' + Scoring.getSessionTypeLabel(d.sessionType)
        ).join(', ') +
        '\nFaut-il modifier les séances restantes ? ' +
        'Réponds en JSON: {"adapt":true|false,"reason":"...","modifications":[{"slotIndex":N,"newType":"sessionType","newExercise":"run|row|ski"}]}',
        true
      );

      if (result.adapt && result.modifications && result.modifications.length > 0) {
        result.modifications.forEach(mod => {
          if (mod.slotIndex !== undefined && mod.newType) {
            Planner.applyAIModification(mod.slotIndex, mod.newType, mod.newExercise);
          }
        });
        App.renderWeekPlan();
        App.toast('🤖 Plan adapté: ' + (result.reason || 'ajustement post-séance'), 'success');
      }
    } catch (err) {
      console.log('[AI] Post-session adaptation fallback:', err.message);
      // Local fallback for extreme cases
      if (session.rpe >= 10 || session.pain >= 5) {
        const nextIntense = plan.findIndex((d, i) =>
          i > pos.dayInWeek && !d.done && !d.skipped &&
          (d.sessionType === 'power' || d.sessionType === 'racePace' || d.sessionType === 'intervals_short' || d.sessionType === 'intervals_long')
        );
        if (nextIntense >= 0) {
          const fallbackType = session.pain >= 5 ? 'technique' : 'z2';
          Planner.applyAIModification(nextIntense, fallbackType, plan[nextIntense].exerciseType);
          App.renderWeekPlan();
          App.toast('⚠️ Séance intense → remplacée par ' + fallbackType, 'info');
        }
      }
    }
  },
};
