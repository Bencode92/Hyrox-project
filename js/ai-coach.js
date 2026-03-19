/* HyroxForge — AI Coach v2 (Worker connecté) */
const AICoach = {
  PROXY: 'https://studyforge-proxy.benoit-comas.workers.dev',

  SYSTEM_PROMPT: `Tu es le coach sportif IA de HyroxForge. Focus: Run, Row, SkiErg pour Hyrox.

ATHLÈTE :
- Prépa Hyrox 6 mois, tendon d'Achille en guérison
- Objectif: 15+ km/h au 10km
- VMA corrigée = test 1km × 0.95
- Gilet lesté interdit avant sem 8 et score run < 60

RÈGLES :
- Progression dégressive: +1.5%/3sem (S1-8), +2%/3sem (S9-16), +1%/3sem (S17-24)
- Décharge 3+1: sem 4,8,12,16,20,24 = -30% volume
- Plafond +12% sans retest
- Récup fractionné court: 90s CONSTANT (jamais réduire)
- Cap fractionné long: 5×1000m max
- RPE moyen > 8.5 sur 3 séances → repos/Z2
- Douleur tendon > 3/10 → -50% volume, pas de course
- Gilet: sem 8-12 marche uniquement, sem 12+ Z2 run, max 10kg
- ADAPTATIF: RPE ≤5 → +4-6% next, RPE 6-7 → +2%, RPE 8 → consolider, RPE 9 → -3%, RPE 10 → -7%

FORMAT : Direct, chiffres exacts (vitesse, pace, reps, repos). Motivant mais honnête.

Quand tu génères une SÉANCE, réponds en JSON strict :
{"next_session":{"date":"YYYY-MM-DD","exercise":"run|row|ski","location":"outdoor|gym","type":"z2|tempo|intervals_short|intervals_long|long_run|fartlek|technique|power|endurance|racePace|test","warmup":"...","main":"...","cooldown":"...","details":{"sets":null,"distance_per_set":null,"total_distance":0,"target_pace":"M:SS","target_speed_kmh":0,"rest_seconds":null},"vest":{"use":false,"weight_kg":0,"reason":""},"coaching_tip":"..."},"analysis":"..."}`,

  getWorkerUrl() {
    const s = Storage.getSettings();
    return s.workerUrl || this.PROXY;
  },

  async callClaude(userMessage, expectJSON) {
    const url = this.getWorkerUrl();
    const context = Storage.exportForAI();
    const zones = Training.getZonesSummary();
    const week = Training.getCurrentWeek();
    const sys = this.SYSTEM_PROMPT + '\nSEMAINE: ' + (week+1) + (Training.isDeloadWeek(week) ? ' (DÉCHARGE)' : '') + '\nZONES: ' + (zones ? JSON.stringify({vma:zones.run.vma,z2:Training.fmtS(zones.run.z2.min)+'-'+Training.fmtS(zones.run.z2.max),tempo:Training.fmtS(zones.run.tempo.min)+'-'+Training.fmtS(zones.run.tempo.max),row_pace500:Training.fmtP(zones.row.testPace500),ski_pace500:Training.fmtP(zones.ski.testPace500)}) : 'non calibré') + '\nDONNÉES:\n' + JSON.stringify(context, null, 2);

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
      const result = await this.callClaude('Génère ma prochaine séance. Réponds en JSON.', true);
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
      next_session: 'Génère ma prochaine séance basée sur mon historique.',
      weekly_plan: 'Plan de la semaine jour par jour avec détails.',
      progress_report: 'Bilan progression: ce qui va, ce qui ne va pas, ajustements.',
      vest_advice: 'Suis-je prêt pour le gilet lesté ? Si oui comment, si non pourquoi.',
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
      const resp = await this.callClaude('Séance terminée: ' + JSON.stringify(session) + '. Analyse et conseils.');
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
};
