/* HyroxForge — AI Coach (Claude API via Cloudflare Worker) */
const AICoach = {
  SYSTEM_PROMPT: `Tu es le coach sportif IA de HyroxForge, une app de coaching personnalisé pour la préparation Hyrox.

CONTEXTE ATHLÈTE :
- Se prépare pour un Hyrox dans 6 mois
- Focus : course à pied (objectif principal), rowing, SkiErg
- Blessure : tendon d'Achille en guérison
- Objectif long terme : 10km à 15+ km/h
- Utilise parfois un gilet lesté

TES RÈGLES DE COACHING :
1. PROGRESSION :
- Séance réussie (cible atteinte, RPE ≤ 7) → +2-3% vitesse OU +1 rep
- Séance réussie mais dure (RPE 8-9) → même paramètres, consolider
- Séance ratée de < 5% → retenter identique
- Séance ratée de > 5% → -5% intensité
- RPE moyen 3 dernières séances > 8.5 → repos ou Z2 léger
- Périodisation 3+1 : 3 semaines charge, 1 semaine décharge (-30% vol)

2. TYPES DE SÉANCE RUN : Z2 continu, Tempo, Fractionné court (200-400m), Fractionné long (800-1000m), Sortie longue (60-80 min Z2), Avec gilet lesté (Z2 uniquement, score > 60)
3. TYPES ROW/SKI : Technique (cadence basse, posture), Puissance (courts, max effort), Endurance (pace régulier)
4. LIEU : Run → extérieur par défaut. Tapis si pluie, fractionné court, gilet lesté. Row/Ski → toujours salle
5. GILET LESTÉ : JAMAIS si score run < 60. JAMAIS sur fractionné ou > 45 min. JAMAIS si douleur tendon > 2/10. Introduction : 3-5 kg sur Z2 uniquement. Max : 10 kg
6. TENDON : Si douleur > 3/10 → réduire volume de 50%, pas de course. Si douleur 1-3/10 → surveiller, pas d'augmentation de charge. Toujours rappeler les eccentric heel drops.

FORMAT : Sois direct, concret, avec les chiffres exacts. Ton motivant mais honnête. Si la progression stagne, dis-le clairement.

Quand tu génères une PROCHAINE SÉANCE, réponds en JSON strict :
{"next_session":{"date":"YYYY-MM-DD","exercise":"run|row|ski","location":"outdoor|gym","type":"z2|tempo|intervals_short|intervals_long|long_run|technique|power|endurance|test","warmup":"description","main":"description détaillée","cooldown":"description","details":{"sets":null,"distance_per_set":null,"total_distance":0,"target_pace":"M:SS","target_speed_kmh":0,"rest_seconds":null},"vest":{"use":false,"weight_kg":0,"reason":""},"coaching_tip":"conseil clé"},"analysis":"texte libre"}`,

  async callClaude(userMessage, expectJSON = false) {
    const settings = Storage.getSettings();
    if (!settings.workerUrl) throw new Error("Configure l'URL du Cloudflare Worker dans les paramètres");
    const context = Storage.exportForAI();
    const systemWithContext = this.SYSTEM_PROMPT + "\n\nDONNÉES ACTUELLES DE L'ATHLÈTE :\n" + JSON.stringify(context, null, 2);
    const response = await fetch(settings.workerUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: systemWithContext, messages: [{ role: 'user', content: userMessage }] }),
    });
    if (!response.ok) { const errText = await response.text(); throw new Error("Erreur API: " + response.status + " — " + errText); }
    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('\n') || '';
    if (expectJSON) { try { return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()); } catch { return { analysis: text, next_session: null }; } }
    return text;
  },

  async generateNextSession() {
    const sessions = Storage.getSessions();
    if (sessions.length === 0) { App.toast("Enregistre d'abord une séance !", 'info'); return; }
    const btn = document.querySelector('.nsc-header .btn-sm');
    const body = document.getElementById('nextSessionBody');
    btn.disabled = true; btn.textContent = 'Génération...';
    body.innerHTML = '<div class="msg-loading">Le coach analyse ton historique...</div>';
    try {
      const result = await this.callClaude('Génère ma prochaine séance basée sur mon historique. Réponds uniquement en JSON.', true);
      if (result.next_session) this.renderNextSession(result.next_session, result.analysis);
      else body.innerHTML = '<div style="line-height:1.6">' + this.formatText(result.analysis || 'Impossible de générer la séance.') + '</div>';
    } catch (err) { body.innerHTML = '<div style="color:var(--accent-red)">' + err.message + '</div>'; }
    finally { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3m.64 6.36l-2.12-2.12M12 21v-3m-6.36.64l2.12-2.12M3 12h3m-.64-6.36l2.12 2.12"/></svg> Générer via IA'; }
  },

  renderNextSession(ns, analysis) {
    const body = document.getElementById('nextSessionBody');
    const emoji = Scoring.getTypeEmoji(ns.exercise), typeName = Scoring.getTypeName(ns.exercise);
    const stLabel = Scoring.getSessionTypeLabel(ns.type), locLabel = ns.location === 'outdoor' ? 'Extérieur' : 'Salle';
    body.innerHTML = '<div class="nsc-detail">' +
      '<span class="label">Exercice</span><span class="val">' + emoji + ' ' + typeName + ' — ' + stLabel + '</span>' +
      '<span class="label">Lieu</span><span class="val">' + locLabel + '</span>' +
      '<span class="label">Échauffement</span><span class="val">' + (ns.warmup || '—') + '</span>' +
      '<span class="label">Séance</span><span class="val">' + (ns.main || '—') + '</span>' +
      (ns.details?.target_pace ? '<span class="label">Allure cible</span><span class="val">' + ns.details.target_pace + '</span>' : '') +
      (ns.details?.sets ? '<span class="label">Séries</span><span class="val">' + ns.details.sets + ' × ' + ns.details.distance_per_set + 'm — repos ' + ns.details.rest_seconds + 's</span>' : '') +
      (ns.details?.total_distance ? '<span class="label">Distance totale</span><span class="val">' + (ns.details.total_distance / 1000).toFixed(1) + ' km</span>' : '') +
      '<span class="label">Retour au calme</span><span class="val">' + (ns.cooldown || '—') + '</span>' +
      '<span class="label">Gilet lesté</span><span class="val">' + (ns.vest?.use ? ns.vest.weight_kg + ' kg' : 'Non') + (ns.vest?.reason ? ' — ' + ns.vest.reason : '') + '</span></div>' +
      (ns.coaching_tip ? '<div class="nsc-tip">' + ns.coaching_tip + '</div>' : '') +
      (analysis ? '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.6">' + this.formatText(analysis) + '</div>' : '');
  },

  async ask(preset) {
    const prompts = { next_session: 'Génère ma prochaine séance basée sur mon historique et mon état actuel.', weekly_plan: 'Donne-moi le plan de la semaine complète avec les séances jour par jour.', progress_report: 'Fais un bilan de ma progression : ce qui va, ce qui ne va pas, et les ajustements nécessaires.', vest_advice: "Est-ce que je suis prêt à utiliser le gilet lesté ? Si oui, comment l'intégrer ? Si non, qu'est-ce que je dois atteindre avant ?" };
    const message = prompts[preset] || preset;
    this.addUserMessage(message); await this.processMessage(message);
  },

  async sendMessage() {
    const input = document.getElementById('coachInput');
    const message = input.value.trim(); if (!message) return;
    input.value = ''; this.addUserMessage(message); await this.processMessage(message);
  },

  async processMessage(message) {
    const container = document.getElementById('coachMessages');
    const loadingDiv = document.createElement('div'); loadingDiv.className = 'msg-ai';
    loadingDiv.innerHTML = '<div class="coach-avatar" style="width:32px;height:32px;font-size:16px">\ud83e\udd16</div><div class="msg-bubble msg-loading">Analyse en cours...</div>';
    container.appendChild(loadingDiv); loadingDiv.scrollIntoView({ behavior: 'smooth' });
    try { const response = await this.callClaude(message); loadingDiv.querySelector('.msg-bubble').innerHTML = this.formatText(response); loadingDiv.querySelector('.msg-bubble').classList.remove('msg-loading'); }
    catch (err) { loadingDiv.querySelector('.msg-bubble').innerHTML = '<span style="color:var(--accent-red)">' + err.message + '</span>'; loadingDiv.querySelector('.msg-bubble').classList.remove('msg-loading'); }
    loadingDiv.scrollIntoView({ behavior: 'smooth' });
  },

  addUserMessage(text) {
    const container = document.getElementById('coachMessages');
    const div = document.createElement('div'); div.className = 'msg-user';
    div.innerHTML = '<div class="msg-bubble">' + this.escapeHtml(text) + '</div>';
    container.appendChild(div);
  },

  async analyzeSession(session) {
    const analysisDiv = document.getElementById('aiAnalysis'), bodyDiv = document.getElementById('aiAnalysisBody');
    const settings = Storage.getSettings();
    if (!settings.workerUrl) { this.showLocalAnalysis(session, bodyDiv); analysisDiv.classList.remove('hidden'); return; }
    analysisDiv.classList.remove('hidden'); bodyDiv.innerHTML = '<div class="msg-loading">Analyse en cours...</div>';
    try { const response = await this.callClaude("Je viens de terminer cette séance : " + JSON.stringify(session) + ". Analyse-la et dis-moi comment c'était."); bodyDiv.innerHTML = this.formatText(response); }
    catch { this.showLocalAnalysis(session, bodyDiv); }
  },

  showLocalAnalysis(session, container) {
    const score = Scoring.scoreSession(session), delta = Scoring.computeDelta(session), rpeLabel = Scoring.getRPELabel(session.rpe);
    let html = '<strong>Score séance : ' + score + '/100</strong><br>';
    if (delta) { if (delta.improved) html += '<span style="color:var(--accent-teal)">Progression : ' + Math.abs(delta.seconds).toFixed(0) + 's plus rapide (' + delta.percent + '%)</span><br>'; else if (delta.seconds > 0) html += '<span style="color:var(--accent-red)">Attention : ' + delta.seconds.toFixed(0) + 's plus lent</span><br>'; else html += 'Même niveau que la dernière séance.<br>'; }
    if (session.rpe >= 9) html += '<br>\u26a0\ufe0f RPE élevé (' + session.rpe + '/10 — ' + rpeLabel + '). Prochaine séance : privilégie la récupération.';
    if (session.pain > 2) html += '<br>\u26a0\ufe0f Douleur tendon ' + session.pain + '/10. Réduis le volume et consulte si ça persiste.';
    html += "<br><br><em>Configure l'URL du Worker dans les paramètres pour activer l'analyse IA complète.</em>";
    container.innerHTML = html;
  },

  formatText(text) { return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); },
  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; },
};
