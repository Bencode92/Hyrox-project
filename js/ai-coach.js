/* HyroxForge — AI Coach v2 (Cloudflare Worker connecté) */
const AICoach = {
  PROXY: 'https://studyforge-proxy.benoit-comas.workers.dev',

  SYSTEM_PROMPT: `Tu es le coach sportif IA de HyroxForge. Focus: Run, Row, SkiErg pour Hyrox.

ATHLÈTE :
- Prépa Hyrox 6 mois, tendon d'Achille en guérison
- Objectif: 15+ km/h au 10km
- VMA corrigée = test 1km \u00d7 0.95
- Gilet lesté interdit avant sem 8 et score run < 60

R\u00c8GLES :
- Progression d\u00e9gressive: +1.5%/3sem (S1-8), +2%/3sem (S9-16), +1%/3sem (S17-24)
- D\u00e9charge 3+1: sem 4,8,12,16,20,24 = -30% volume
- Plafond +12% sans retest
- R\u00e9cup fractionn\u00e9 court: 90s CONSTANT (jamais r\u00e9duire)
- Cap fractionn\u00e9 long: 5\u00d71000m max
- RPE moyen > 8.5 sur 3 s\u00e9ances \u2192 repos/Z2
- Douleur tendon > 3/10 \u2192 -50% volume, pas de course
- Gilet: sem 8-12 marche uniquement, sem 12+ Z2 run, max 10kg

FORMAT : Direct, chiffres exacts (vitesse, pace, reps, repos). Motivant mais honn\u00eate. Si stagnation, dis-le.

Quand tu g\u00e9n\u00e8res une S\u00c9ANCE, r\u00e9ponds en JSON strict :
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
    const sys = this.SYSTEM_PROMPT + '\n\nSEMAINE: ' + (week+1) + (Training.isDeloadWeek(week) ? ' (D\u00c9CHARGE)' : '') + '\nZONES: ' + (zones ? JSON.stringify({vma:zones.run.vma,z2:Training.fmtS(zones.run.z2.min)+'-'+Training.fmtS(zones.run.z2.max),tempo:Training.fmtS(zones.run.tempo.min)+'-'+Training.fmtS(zones.run.tempo.max),row_pace500:Training.fmtP(zones.row.testPace500),ski_pace500:Training.fmtP(zones.ski.testPace500)}) : 'non calibr\u00e9') + '\nDONN\u00c9ES:\n' + JSON.stringify(context, null, 2);

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: sys, messages: [{ role: 'user', content: userMessage }] }),
    });
    if (!r.ok) {
      if (r.status === 429) throw new Error('API surcharg\u00e9e, r\u00e9essaie dans 30s');
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
    if (Storage.getSessions().length === 0) { App.toast('Enregistre d\'abord une s\u00e9ance', 'info'); return; }
    const btn = document.querySelector('.nsc-header .btn-sm');
    const body = document.getElementById('nextSessionBody');
    btn.disabled = true; btn.textContent = 'G\u00e9n\u00e9ration...';
    body.innerHTML = '<div class="msg-loading">Le coach analyse...</div>';
    try {
      const result = await this.callClaude('G\u00e9n\u00e8re ma prochaine s\u00e9ance. R\u00e9ponds en JSON.', true);
      if (result.next_session) this.renderNextSession(result.next_session, result.analysis);
      else body.innerHTML = '<div style="line-height:1.5">' + this.fmt(result.analysis || 'Pas de r\u00e9ponse') + '</div>';
    } catch (err) { body.innerHTML = '<div style="color:var(--accent-red)">' + err.message + '</div>'; }
    finally { btn.disabled = false; btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3m.64 6.36l-2.12-2.12M12 21v-3m-6.36.64l2.12-2.12M3 12h3m-.64-6.36l2.12 2.12"/></svg> IA'; }
  },

  renderNextSession(ns, analysis) {
    const body = document.getElementById('nextSessionBody');
    const e = Scoring.getTypeEmoji(ns.exercise), n = Scoring.getTypeName(ns.exercise);
    const st = Scoring.getSessionTypeLabel(ns.type), loc = ns.location==='outdoor'?'Ext\u00e9rieur':'Salle';
    body.innerHTML = '<div class="nsc-detail">' +
      '<span class="label">Exercice</span><span class="val">' + e + ' ' + n + ' \u2014 ' + st + '</span>' +
      '<span class="label">Lieu</span><span class="val">' + loc + '</span>' +
      '<span class="label">\u00c9chauff</span><span class="val">' + (ns.warmup||'\u2014') + '</span>' +
      '<span class="label">S\u00e9ance</span><span class="val">' + (ns.main||'\u2014') + '</span>' +
      (ns.details?.target_pace ? '<span class="label">Pace</span><span class="val">' + ns.details.target_pace + '</span>' : '') +
      (ns.details?.sets ? '<span class="label">S\u00e9ries</span><span class="val">' + ns.details.sets + ' \u00d7 ' + ns.details.distance_per_set + 'm \u2014 repos ' + ns.details.rest_seconds + 's</span>' : '') +
      '<span class="label">Retour</span><span class="val">' + (ns.cooldown||'\u2014') + '</span>' +
      '<span class="label">Gilet</span><span class="val">' + (ns.vest?.use ? ns.vest.weight_kg+'kg' : 'Non') + (ns.vest?.reason ? ' \u2014 '+ns.vest.reason : '') + '</span></div>' +
      (ns.coaching_tip ? '<div class="nsc-tip">'+ns.coaching_tip+'</div>' : '') +
      (analysis ? '<div style="margin-top:8px;font-size:12px;color:var(--text-secondary);line-height:1.5">' + this.fmt(analysis) + '</div>' : '');
  },

  async ask(preset) {
    const prompts = {
      next_session: 'G\u00e9n\u00e8re ma prochaine s\u00e9ance bas\u00e9e sur mon historique.',
      weekly_plan: 'Plan de la semaine jour par jour avec d\u00e9tails.',
      progress_report: 'Bilan progression: ce qui va, ce qui ne va pas, ajustements.',
      vest_advice: 'Suis-je pr\u00eat pour le gilet lest\u00e9 ? Si oui comment, si non pourquoi.',
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
    ld.innerHTML = '<div class="coach-avatar" style="width:28px;height:28px;font-size:14px">\ud83e\udd16</div><div class="msg-bubble msg-loading">Analyse...</div>';
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
      const resp = await this.callClaude('S\u00e9ance termin\u00e9e: ' + JSON.stringify(session) + '. Analyse et conseils.');
      bd.innerHTML = this.fmt(resp);
    } catch {
      this.showLocal(session, bd);
    }
  },

  showLocal(session, container) {
    const sc = Scoring.scoreSession(session), dt = Scoring.computeDelta(session);
    let h = '<strong>Score: ' + sc + '/100</strong><br>';
    if (dt) { h += dt.improved ? '<span style="color:var(--accent-2)">+' + Math.abs(dt.seconds).toFixed(0) + 's plus rapide</span><br>' : (dt.seconds > 0 ? '<span style="color:var(--accent-red)">-' + dt.seconds.toFixed(0) + 's plus lent</span><br>' : 'Stable<br>'); }
    if (session.rpe >= 9) h += '<br>\u26a0\ufe0f RPE ' + session.rpe + '/10 \u2014 r\u00e9cup\u00e9ration recommand\u00e9e.';
    if (session.pain > 2) h += '<br>\u26a0\ufe0f Tendon ' + session.pain + '/10 \u2014 r\u00e9duire le volume.';
    container.innerHTML = h;
  },

  fmt(t) { return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); },
  esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; },
};
