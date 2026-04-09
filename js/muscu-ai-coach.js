/* ============================================================
   MUSCU-AI-COACH  —  Claude AI integration for musculation
   Adapts programs based on logged performance, injury, RPE
   ============================================================ */

const MuscuAI = (() => {

  // ── System prompt with deep adaptation rules ──────────────
  function _buildSystemPrompt() {
    const profile = MuscuStorage.getProfile();
    const weekNum = MuscuStorage.getWeekNumber();
    const isDeload = weekNum > 1 && weekNum % 4 === 0;
    const prs = MuscuStorage.getPRs();
    const objectives = MuscuStorage.getObjectives();
    const recent = MuscuStorage.getRecentSessions(15);
    const plan = MuscuStorage.getWeekPlan();

    // Analyze trends
    const trends = _analyzeTrends(recent, prs);

    return `Tu es un coach de musculation expert spécialisé dans la préparation physique pour Hyrox.
Tu parles français. Tu es direct, précis et motivant. Tu adaptes TOUT en fonction du contexte athlète.

## Contexte athlète
- Nom : ${profile.name || 'Athlète'}
- Poids corporel : ${profile.weight || '?'} kg
- Niveau : ${_levelLabel(profile.level)}
- Jours/semaine disponibles : ${profile.daysPerWeek || 4}
- Semaine actuelle du programme : ${weekNum}${isDeload ? ' ⚠️ SEMAINE DELOAD — volume -30%, intensité -30%' : ''}
- Phase : ${_phaseLabel(weekNum)}

## BLESSURES & PRÉCAUTIONS
${profile.injuryNotes ? `⚠️ IMPORTANT : ${profile.injuryNotes}
→ Tu DOIS adapter chaque recommandation en tenant compte de cette information.
→ Si un exercice risque d'aggraver la blessure, propose une alternative sûre.
→ Privilégie la technique et le contrôle sur la charge.
→ Ne JAMAIS proposer de charges maximales sans validation progressive.` : 'Aucune blessure signalée, mais l\'athlète revient de blessure. Rester prudent.'}

## Règles d'adaptation (OBLIGATOIRES)

### Progression de charge
1. Quand TOUTES les séries d'un exercice sont complétées au RPE ≤ 7 → augmenter de +2.5kg (haut du corps) ou +5kg (bas du corps) la séance suivante
2. Quand RPE = 8 sur la majorité des séries → maintenir la même charge
3. Quand RPE ≥ 9 → BAISSER la charge de 5-10% la séance suivante
4. Quand l'athlète signale une douleur → adapter ou REMPLACER l'exercice, ne JAMAIS forcer
5. Maximum +10% d'augmentation de volume par semaine (règle des 10%)

### Adaptation RPE (basée sur les dernières séances)
${trends.rpeAnalysis}

### Adaptation douleur
${trends.painAnalysis}

### Périodisation
- Semaines 1-4 : ADAPTATION — charges légères (60-70% 1RM), focus technique, 3×10-12
- Semaines 5-8 : CONSTRUCTION — charges modérées (70-75% 1RM), 3-4×8-10
- Semaines 9-12 : FORCE — charges lourdes (75-85% 1RM), 4×5-8
- Semaines 13-16 : INTENSIFICATION — charges élevées (80-90% 1RM), 4-5×3-6
- Deload toutes les 4 semaines : -30% volume ET -30% intensité

### Temps de repos
- Force (≤6 reps) : 2-3 minutes
- Hypertrophie (8-12 reps) : 60-90 secondes
- Endurance musculaire (15+ reps) : 30-60 secondes
- Explosif : 60-90 secondes

### Spécificité Hyrox
- Les exercices doivent préparer aux 8 épreuves Hyrox : sled push/pull, wall balls, burpee broad jumps, farmers carry, sandbag lunges, rameur, skierg
- Inclure au moins 1-2 exercices spécifiques Hyrox par séance quand possible
- Les thrusters préparent aux wall balls
- Les KB swings préparent au sled push/pull
- Les farmers carry se travaillent en distance (30-60m) pas en reps
- Core à chaque séance (stabilité pour toutes les épreuves)

### Échauffement (toujours recommander)
- 5 min cardio léger
- Mobilité articulaire ciblée
- 2-3 séries progressives de l'exercice principal (50%, 70%, 85%)

## Records personnels actuels
${_formatPRs(prs)}

## Objectifs de l'athlète
${_formatObjectives(objectives, prs)}

## Tendances récentes
${trends.summary}

## 15 dernières séances
${_formatSessions(recent)}

## Plan semaine en cours
${plan ? _formatPlan(plan) : 'Pas de plan généré'}

## Format réponse
- Sois concis et actionnable
- **Gras** pour les points importants
- Pour les prescriptions : exercice, séries × reps, charge suggérée, repos
- Toujours justifier tes adaptations ("basé sur ton RPE de 9 au squat mardi, je réduis...")
- Si douleur mentionnée : proposer alternative + étirement/mobilité`;
  }

  function _levelLabel(level) {
    return { beginner: 'Débutant (< 1 an de pratique)', intermediate: 'Intermédiaire (1-3 ans)', advanced: 'Avancé (3+ ans)' }[level] || level;
  }

  function _phaseLabel(weekNum) {
    if (weekNum <= 4) return 'ADAPTATION (technique, charges légères)';
    if (weekNum <= 8) return 'CONSTRUCTION (volume progressif)';
    if (weekNum <= 12) return 'FORCE (charges modérées-lourdes)';
    if (weekNum <= 16) return 'INTENSIFICATION (charges lourdes, volume réduit)';
    return 'PEAK (maintien)';
  }

  function _analyzeTrends(sessions, prs) {
    if (sessions.length === 0) {
      return {
        rpeAnalysis: 'Aucune donnée RPE. Commencer conservateur.',
        painAnalysis: 'Aucune donnée douleur.',
        summary: 'Pas encore de données. Commencer par le programme de base en phase adaptation.',
      };
    }

    // RPE trend
    const rpes = sessions.filter(s => s.globalRpe).map(s => s.globalRpe);
    const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '?';
    const last3Rpe = rpes.slice(-3);
    const highRpeCount = last3Rpe.filter(r => r >= 9).length;

    let rpeAnalysis = `RPE moyen dernières séances : ${avgRpe}/10.\n`;
    if (highRpeCount >= 2) {
      rpeAnalysis += '⚠️ ALERTE : 2+ séances récentes à RPE ≥ 9. RÉDUIRE intensité de 10% et volume de 20% cette semaine.';
    } else if (parseFloat(avgRpe) >= 8.5) {
      rpeAnalysis += '⚠️ RPE élevé en tendance. Recommander de baisser les charges de 5% ou réduire 1 série par exercice.';
    } else if (parseFloat(avgRpe) <= 6) {
      rpeAnalysis += '✅ RPE bas — l\'athlète peut progresser. Proposer +2.5kg/5kg sur les exercices principaux.';
    } else {
      rpeAnalysis += '✅ RPE dans la zone cible (7-8). Maintenir la progression normale.';
    }

    // Pain analysis
    const painSessions = sessions.filter(s => s.painNotes && s.painNotes.trim());
    let painAnalysis = '';
    if (painSessions.length === 0) {
      painAnalysis = 'Aucune douleur signalée récemment. Progression normale.';
    } else {
      const recentPain = painSessions.slice(-3);
      painAnalysis = `⚠️ Douleurs signalées dans ${painSessions.length} séance(s) sur les ${sessions.length} dernières.\n`;
      painAnalysis += 'Détails récents :\n';
      recentPain.forEach(s => {
        painAnalysis += `- ${s.date} : "${s.painNotes}"\n`;
      });
      painAnalysis += '→ ADAPTER les exercices qui sollicitent les zones douloureuses. Proposer des alternatives.';
    }

    // Volume trend
    const volumes = sessions.slice(-5).map(s =>
      (s.exercises || []).reduce((sum, e) =>
        sum + (e.sets || []).reduce((ss, set) => ss + (set.weight || 0) * (typeof set.reps === 'number' ? set.reps : 0), 0), 0)
    );
    const avgVolume = volumes.length ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;

    // PR progress
    const prProgress = [];
    for (const [id, data] of Object.entries(prs)) {
      if (data.history && data.history.length >= 2) {
        const recent = data.history.slice(-1)[0].e1rm;
        const older = data.history.slice(-Math.min(5, data.history.length))[0].e1rm;
        const diff = recent - older;
        if (diff !== 0) {
          const ex = MuscuExercises.getById(id);
          prProgress.push(`${ex ? ex.name : id}: ${diff > 0 ? '+' : ''}${diff}kg (1RM estimé)`);
        }
      }
    }

    let summary = `Séances enregistrées : ${sessions.length}\n`;
    summary += `RPE moyen : ${avgRpe}/10\n`;
    summary += `Volume moyen par séance : ${avgVolume}kg\n`;
    if (prProgress.length) {
      summary += `Évolution récente des PRs :\n${prProgress.map(p => '- ' + p).join('\n')}\n`;
    }
    if (painSessions.length) {
      summary += `⚠️ ${painSessions.length} séance(s) avec douleurs signalées`;
    }

    return { rpeAnalysis, painAnalysis, summary };
  }

  function _formatPRs(prs) {
    const lines = [];
    for (const [id, data] of Object.entries(prs)) {
      const ex = MuscuExercises.getById(id);
      if (ex && data.best1RM) {
        lines.push(`- ${ex.name}: 1RM estimé ${data.best1RM}kg (${data.bestWeight}kg × ${data.bestReps} le ${data.bestDate})`);
      }
    }
    return lines.length ? lines.join('\n') : 'Aucun record enregistré (athlète débutant dans l\'app)';
  }

  function _formatObjectives(objectives, prs) {
    const lines = [];
    for (const [id, obj] of Object.entries(objectives)) {
      const ex = MuscuExercises.getById(id);
      const pr = prs[id];
      const current = pr ? pr.best1RM : 0;
      const pct = obj.targetWeight ? Math.round((current / obj.targetWeight) * 100) : 0;
      if (ex) {
        lines.push(`- ${ex.name}: objectif ${obj.targetWeight}kg × ${obj.targetReps}r | actuel ${current}kg (${pct}%)${obj.deadline ? ' | deadline ' + obj.deadline : ''}`);
      }
    }
    return lines.length ? lines.join('\n') : 'Aucun objectif défini — proposer d\'en créer si l\'athlète demande conseil';
  }

  function _formatSessions(sessions) {
    if (!sessions.length) return 'Aucune séance enregistrée';
    return sessions.map(s => {
      const exList = (s.exercises || []).map(e => {
        const sets = (e.sets || []).map(st => `${st.weight}kg×${st.reps}${st.rpe ? ' RPE:' + st.rpe : ''}`).join(', ');
        return `  ${e.exerciseId}: ${sets}`;
      }).join('\n');
      return `[${s.date}] RPE global:${s.globalRpe || '?'}${s.painNotes ? ' | Douleur: ' + s.painNotes : ''}\n${exList}`;
    }).join('\n\n');
  }

  function _formatPlan(plan) {
    return plan.days.map(d =>
      `${d.label} (${d.status}): ${d.exercises.map(e => `${e.name} ${e.sets}×${e.reps}${e.suggestedWeight ? ' @' + e.suggestedWeight + 'kg' : ''}`).join(', ')}`
    ).join('\n');
  }

  // ── API Call ──────────────────────────────────────────────
  async function ask(userMessage, options = {}) {
    const settings = MuscuStorage.getSettings();
    const url = settings.workerUrl;
    if (!url) throw new Error('URL du Worker non configurée. Va dans Paramètres pour la configurer.');

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: _buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API surchargée, réessaie dans 30s');
      throw new Error(`Erreur API: ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || data.text || '';
  }

  // ── Preset Prompts ────────────────────────────────────────
  const PRESETS = {
    next_session: {
      label: 'Prochaine séance',
      prompt: `Génère ma prochaine séance de musculation détaillée en tenant compte de :
- Mes dernières performances et RPE
- Ma phase actuelle de périodisation
- Mes éventuelles douleurs
- Mes objectifs

Pour chaque exercice indique :
1. Nom de l'exercice
2. Séries × reps
3. Charge suggérée (basée sur mes records)
4. Temps de repos
5. Points technique clés (2-3 bullet points)

Inclus l'échauffement et le retour au calme.`,
    },
    weekly_plan: {
      label: 'Plan semaine',
      prompt: `Donne-moi un plan complet de ma semaine d'entraînement musculation.
Pour chaque jour :
- Exercices principaux avec charges basées sur mes PRs
- Volume et intensité adaptés à mon RPE récent
- Si j'ai signalé des douleurs, adapte en conséquence
- Rappelle si c'est une semaine deload

Sois précis sur les charges (en kg) et le repos.`,
    },
    progress: {
      label: 'Bilan progrès',
      prompt: `Fais un bilan complet de mes progrès en musculation :
1. Analyse chaque exercice principal vs mes objectifs (% d'atteinte)
2. Tendance RPE : est-ce que je progresse sans me surentraîner ?
3. Points forts et points faibles identifiés
4. Recommandations concrètes pour les 4 prochaines semaines
5. Si j'ai eu des douleurs, comment adapter

Sois honnête et constructif. Chiffres à l'appui.`,
    },
    adapt: {
      label: 'Adapter programme',
      prompt: `Analyse mes dernières séances (RPE, douleurs, performances) et dis-moi si je dois adapter mon programme.

Spécifiquement :
- Faut-il baisser ou monter les charges sur certains exercices ?
- Faut-il changer des exercices (remplacements) ?
- Le volume actuel est-il adapté à ma récupération ?
- Si douleur : quel exercice remplacer par quoi ?

Donne des modifications CONCRÈTES avec les nouvelles charges/reps.`,
    },
    injury: {
      label: 'Conseil blessure',
      prompt: `Je reviens de blessure. En te basant sur mes notes de blessure dans mon profil et mes dernières séances :

1. Quels exercices dois-je ÉVITER ou ADAPTER ?
2. Pour chaque exercice à risque, propose une alternative sûre
3. Quel programme de reprise progressive recommandes-tu ?
4. Quels étirements et mobilité ajouter ?
5. Signaux d'alerte : quand dois-je m'arrêter ?

Sois prudent et priorise la santé.`,
    },
    exercise_tip: {
      label: 'Technique exercice',
      prompt: `Donne-moi des conseils techniques détaillés pour les exercices principaux de ma prochaine séance. Pour chaque exercice :
- Setup/position de départ
- Exécution phase par phase
- Erreurs courantes à éviter
- Respiration
- Comment savoir si je fais bien le mouvement

Adapte la complexité à mon niveau.`,
    },
  };

  function getPresets() { return PRESETS; }

  // ── Session Analysis ──────────────────────────────────────
  async function analyzeSession(session) {
    const prs = MuscuStorage.getPRs();
    const objectives = MuscuStorage.getObjectives();

    const exSummary = (session.exercises || []).map(e => {
      const info = MuscuExercises.getById(e.exerciseId);
      const pr = prs[e.exerciseId];
      const obj = objectives[e.exerciseId];
      const sets = (e.sets || []).map(s => `${s.weight}kg × ${s.reps} reps${s.rpe ? ' (RPE ' + s.rpe + ')' : ''}`).join(', ');
      const e1rm = (e.sets || []).reduce((best, s) => {
        const rm = MuscuStorage.estimate1RM(s.weight, s.reps);
        return rm > best ? rm : best;
      }, 0);
      return `${info ? info.name : e.exerciseId}: ${sets}
  → 1RM estimé aujourd'hui: ${e1rm}kg${pr ? ' (record: ' + pr.best1RM + 'kg)' : ''}${obj ? ' | objectif: ' + obj.targetWeight + 'kg' : ''}`;
    }).join('\n\n');

    const prompt = `J'ai terminé ma séance. Analyse en profondeur :

Date : ${session.date}
RPE global : ${session.globalRpe}/10
${session.painNotes ? '⚠️ DOULEURS : ' + session.painNotes : 'Aucune douleur'}

Exercices et performances :
${exSummary}

${session.notes ? 'Notes : ' + session.notes : ''}

Analyse :
1. **Performance** : Ai-je progressé par rapport à mes records ? Nouveaux PRs ?
2. **Charge de travail** : Le RPE est-il adapté à ma phase (${_phaseLabel(MuscuStorage.getWeekNumber())}) ?
3. **Douleurs** : ${session.painNotes ? 'ANALYSE la douleur signalée et recommande des adaptations' : 'Pas de douleur — on continue'}
4. **Prochaine séance** : Ajuster les charges ? Changer un exercice ? Volume ok ?
5. **Récupération** : Recommandations nutrition/sommeil/étirements

Sois CONCIS et ACTIONNABLE. Pas de blabla.`;

    return ask(prompt);
  }

  return { ask, getPresets, analyzeSession };
})();
