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

    return `Tu es un coach HYBRIDE expert spécialisé dans la préparation physique Hyrox.
Tu parles français. Tu es direct, précis et motivant. Tu adaptes TOUT en fonction du contexte.

PHILOSOPHIE : la musculation est un OUTIL au service de la course et des stations Hyrox, pas l'objectif. VO2max = prédicteur n°1. On passe de "musculation avec finishers" à "hybride avec force au service de la course et des stations".

## Contexte athlète
- Nom : ${profile.name || 'Athlète'}
- Poids corporel : ${profile.weight || '?'} kg
- Niveau : ${_levelLabel(profile.level)}
- Jours/semaine dispo : ${profile.daysPerWeek || 4}
- Semaine du programme : ${weekNum}
- Phase : ${_phaseLabel(weekNum)}

## BLESSURES & PRÉCAUTIONS
${profile.injuryNotes ? `⚠️ IMPORTANT : ${profile.injuryNotes}
→ Adapter chaque recommandation. Alternative sûre si risque.
→ Technique et contrôle > charge. Jamais de charges max sans validation progressive.
→ Si retour récent : PHASE 0 (2-3 sem mono-articulaire, PAS de supersets au début).` : 'Athlète revient de blessure. Rester prudent. Phase 0 si reprise récente.'}

## RÈGLES D'ADAPTATION (OBLIGATOIRES — validées par coach externe)

### Progression de charge (CORRIGÉE — micro-progressions)
- Haut du corps (OHP, row, bench) : **+1.25kg** quand toutes séries RPE ≤ 7
- Bas du corps bilatéral (squat) : **+2.5kg** quand toutes séries RPE ≤ 7
- Deadlift / sled push (début de cycle uniquement) : **+5kg** si RPE ≤ 7 + technique parfaite
- Unilatéraux (Bulgarian, step-up) : **+1.25kg**
- RPE 8 → maintenir
- RPE ≥ 9 → baisser 5-10%
- Douleur → remplacer l'exercice, JAMAIS forcer

### SAFETY RAILS (freins automatiques — CRITIQUE)
1. **Volume max +8%/semaine** — gel 1 semaine même si RPE bas
2. **3 séances consécutives RPE ≤ 7 même mouvement** → VÉRIFIER la technique d'abord, pas ajouter automatiquement. L'athlète sous-évalue peut-être son RPE.
3. **Sommeil < 6.5h pendant 3 nuits** → auto-deload intensité -15%
4. **RPE en hausse à charge stable** → signal de fatigue, PAS de montée
5. **Finishers MAX 2x/semaine** — jamais la veille d'une course qualité
6. **Deload sur SIGNAUX** (RPE ↑ à charge ↓, sommeil dégradé, fatigue chronique) — PAS mécanique toutes les 4 sem

### Adaptation RPE
${trends.rpeAnalysis}

### Adaptation douleur
${trends.painAnalysis}

### Périodisation (CORRIGÉE — modèle hybride, PAS powerlifting)
- Phase 0 (retour blessure) : 2-3 sem, mono-articulaire, 50-60% 1RM, PAS de supersets
- Semaines 1-4 : ADAPTATION — 60-70% 1RM, 3×10-12, technique
- Semaines 5-8 : CONSTRUCTION — 70-75% 1RM, 3-4×8-10
- Semaines 9-12 : FORCE — **75-80% 1RM MAX** (PAS 85-90% — ça sacrifie la fraîcheur running)
- Semaines 13+ : PRÉ-COMPÉTITION — 70-75% 1RM, plus d'unilatéral, stations sous fatigue
- ⚠️ PLUS JAMAIS de 85-90% 1RM — ce n'est PAS du powerlifting
- Deload : sur signaux (RPE, sommeil, fatigue), pas mécanique

### Temps de repos
- Force (≤6 reps) : 2-3 min
- Hypertrophie (8-12 reps) : 60-90s
- Endurance musculaire (15+) : 30-60s

### Spécificité Hyrox — CORRIGÉ par coach
1. SkiErg → Lat pulldown, med ball slams
2. Sled Push (152kg H Open) → **Back squat + trap bar DL LOURDS**, step-ups, calf raises
3. Sled Pull (103kg H Open) → C'est un pattern DEADLIFT + grip, PAS du tirage haltère ! **Deadlift lourd + hip hinge + farmers carry**
4. Burpee BJ → Box jumps, jumping lunges. Puissance unijambiste.
5. Rowing → C'est une compétence CARDIO-MUSCULAIRE. **Ergomètre >> tirage haltère**. Intervals 4×500m.
6. Farmers Carry (2×24kg) → **Farmers carry à poids compétition, progression distance**. Dead hang = complément seulement. Objectif : 200m sans pause à 2×24kg (ou 2×32kg).
7. Lunges (20kg) → Walking lunges avec charge > compétition
8. Wall Balls (6kg, 100 reps) → **Thrusters = exercice n°1**. Pratiquer en état de fatigue.

### Bilatéral vs Unilatéral
- Phase force : 60% bilatéral (squat lourd, DL) / 40% unilatéral
- Phase pré-compétition : 40% bilatéral / 60% unilatéral
- Les deux se COMPLÈTENT — le bilatéral lourd reste le driver de force max qui ruisselle sur le sled

### Structure séance
- BLOC A : Compound lourd bilatéral + antagoniste, 4×5-6, repos 2-3min
- BLOC B : Unilatéral + accessoire, 3×8-10, repos 60s
- BLOC C : Core + grip (farmers carry ou dead hang), 3×30-45s
- FINISHER : **MAX 2x/semaine, jours sans course lendemain**. Sinon → mobilité/étirements.
- Core à chaque séance

### Semaine hybride type (validée coach)
- Lundi : Force bas (squat + DL + split squat + core, PAS de finisher)
- Mardi : Run seuil 30-40min (module Cardio)
- Mercredi : Force haut + pull (OHP + row + pull-ups + farmers carry, finisher grip court)
- Jeudi : Compromised run — LA séance clé (800m + station × 4)
- Vendredi : Repos ou Z2 facile
- Samedi : Full body performance (sled + thrusters + wall balls, finisher burpees)
- Dimanche : Long run Z2 60-75min (module Cardio)

### Faiblesses identifiées (Hyrox précédent)
- Row : bottom 5% → C'est CARDIO, pas force ! Ergomètre 2x/sem.
- Sled Pull : bottom 5% → Deadlift lourd 1x/sem + grip (farmers carry)
- Sled Push : bottom 12% → Squat lourd + trap bar DL
- Wall Balls : bottom 23% → Thrusters + endurance quad sous fatigue
- Farmers Carry : bottom 14% → Farmers carry 2x/sem, progression distance
- Point fort : Lunges (top 30%) → Maintenir

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

## Feedback de l'athlète sur les séances précédentes
${_formatFeedback()}

## Format réponse
- Sois concis et actionnable
- **Gras** pour les points importants
- Pour les prescriptions : exercice, séries × reps, charge suggérée, repos
- Toujours justifier tes adaptations ("basé sur ton RPE de 9 au squat mardi, je réduis...")
- Si douleur mentionnée : proposer alternative + étirement/mobilité
- IMPORTANT : tiens compte du feedback de l'athlète (exercices aimés/pas aimés, trop dur, manques)
- Sois progressif dans les changements : pas de révolution, des ajustements doux`;
  }

  function _levelLabel(level) {
    return { beginner: 'Débutant (< 1 an de pratique)', intermediate: 'Intermédiaire (1-3 ans)', advanced: 'Avancé (3+ ans)' }[level] || level;
  }

  function _phaseLabel(weekNum) {
    if (weekNum <= 3) return 'PHASE 0 — Retour blessure (mono-articulaire, pas de supersets, 50-60% 1RM)';
    if (weekNum <= 8) return 'ADAPTATION (60-70% 1RM, technique, supersets progressifs)';
    if (weekNum <= 14) return 'CONSTRUCTION (70-75% 1RM, volume progressif)';
    if (weekNum <= 20) return 'FORCE (75-80% 1RM MAX — PAS de powerlifting)';
    return 'PRÉ-COMPÉTITION (70-75% 1RM, unilatéral dominant, stations sous fatigue)';
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

    // Sleep analysis (safety rail)
    const sleepData = sessions.filter(s => s.sleepHours).map(s => s.sleepHours);
    const recentSleep = sleepData.slice(-3);
    const lowSleepCount = recentSleep.filter(h => h < 6.5).length;
    if (lowSleepCount >= 3) {
      rpeAnalysis += '\n⚠️ SAFETY RAIL SOMMEIL : 3+ nuits < 6.5h récemment. AUTO-DELOAD intensité -15%. Ne PAS augmenter les charges.';
    } else if (lowSleepCount >= 1) {
      rpeAnalysis += '\n⚠️ Sommeil insuffisant détecté. Surveiller la fatigue.';
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
      return `[${s.date}] RPE:${s.globalRpe || '?'}${s.sleepHours ? ' | Sommeil:' + s.sleepHours + 'h' : ''}${s.painNotes ? ' | Douleur: ' + s.painNotes : ''}\n${exList}`;
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
      model: 'claude-opus-4-6',
      max_tokens: options.maxTokens || 2000,
      system: _buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

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

  // ── Generate Week Plan via AI ─────────────────────────────
  async function generateWeekPlan() {
    const profile = MuscuStorage.getProfile();
    const weekNum = MuscuStorage.getWeekNumber();
    const isDeload = weekNum > 1 && weekNum % 4 === 0;
    const feedback = MuscuStorage.getRecentFeedback(10);
    const prs = MuscuStorage.getPRs();

    const exerciseList = MuscuExercises.getAll().map(e => e.id).join(', ');

    const prompt = `Génère mon plan de semaine ${weekNum} (${profile.daysPerWeek} jours) de musculation Hyrox.
${isDeload ? '⚠️ C\'est une semaine DELOAD : -30% volume, -30% intensité, RPE cible 5-6.' : ''}

RÈGLES OBLIGATOIRES (validées par coach externe) :
- Structure en SUPERSETS (blocs A1/A2, B1/B2, C1/C2) — SAUF si phase 0 retour blessure (séquencer)
- Chaque séance = échauffement + 2-3 blocs supersets + core + grip
- FINISHER Hyrox : MAX 2 séances sur ${profile.daysPerWeek} dans la semaine. Les autres → mobilité/étirements.
- Placer les finishers les jours sans course le lendemain
- Intensité PLAFONNÉE : jamais au-dessus de 80% 1RM (ce n'est PAS du powerlifting)
- Diversifier : force, explosivité, endurance musculaire
- Core à chaque séance
- Ratio bilatéral/unilatéral selon la phase (60/40 en force, 40/60 en pré-compétition)
- Sled Pull = pattern DEADLIFT + grip, PAS du tirage haltère
- Row = compétence CARDIO (ergomètre), pas force dos
- Grip = farmers carry à poids compétition, pas dead hang
- Micro-progressions : +1.25kg haut du corps, +2.5kg bas du corps

${feedback.length > 0 ? `TIENS COMPTE DE MES RETOURS PRÉCÉDENTS (très important) :
${feedback.slice(-5).map(f => {
  let parts = [`Séance du ${f.date}`];
  if (f.liked && f.liked.length) parts.push(`Aimé : ${f.liked.join(', ')}`);
  if (f.disliked && f.disliked.length) parts.push(`Pas aimé : ${f.disliked.join(', ')}`);
  if (f.tooHard && f.tooHard.length) parts.push(`Trop dur : ${f.tooHard.join(', ')}`);
  if (f.tooEasy && f.tooEasy.length) parts.push(`Trop facile : ${f.tooEasy.join(', ')}`);
  if (f.missing) parts.push(`Manquait : ${f.missing}`);
  if (f.notes) parts.push(`Notes : ${f.notes}`);
  return '- ' + parts.join(' | ');
}).join('\n')}
→ Adapte en douceur : garde ce qui est aimé, remplace progressivement ce qui ne plaît pas, ajuste les charges sur ce qui est trop dur/facile.` : ''}

RÉPONDS UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "days": [
    {
      "label": "Nom du jour (ex: Bas du corps — Force + Sled)",
      "focus": "Description courte du focus",
      "warmup": "Description échauffement",
      "blocks": [
        {
          "name": "Bloc A — Force",
          "exercises": [
            {"exerciseId": "back_squat", "name": "Back Squat", "sets": 4, "reps": "6", "weight": "85kg", "rest": "90s", "notes": "Superset avec A2"},
            {"exerciseId": "barbell_row", "name": "Barbell Row", "sets": 4, "reps": "8", "weight": "60kg", "rest": "60s", "notes": "Tirer vers le nombril"}
          ]
        }
      ],
      "finisher": "60 Wall Balls for time",
      "cooldown": "Étirements quadriceps, épaules, hanches — 5 min"
    }
  ]
}

Exercices disponibles (utilise UNIQUEMENT ces IDs) : ${exerciseList}

Base les charges sur mes PRs actuels. Si pas de PR, suggère une charge conservative.`;

    const response = await ask(prompt, { maxTokens: 3000 });

    // Parse JSON from response
    try {
      let json = response;
      // Strip markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) json = jsonMatch[1];
      // Try to find JSON object
      const objMatch = json.match(/\{[\s\S]*\}/);
      if (objMatch) json = objMatch[0];

      const parsed = JSON.parse(json);
      if (parsed.days && Array.isArray(parsed.days)) {
        return _convertAIPlanToLocal(parsed, weekNum, isDeload);
      }
    } catch (e) {
      console.warn('AI plan JSON parse failed, falling back to local generation', e);
    }

    // Fallback to local generation
    return null;
  }

  function _convertAIPlanToLocal(aiPlan, weekNum, isDeload) {
    return {
      week: weekNum,
      isDeload,
      templateName: 'Coach IA',
      generatedAt: new Date().toISOString(),
      aiGenerated: true,
      days: aiPlan.days.map((day, i) => {
        const exercises = [];
        (day.blocks || []).forEach(block => {
          (block.exercises || []).forEach(ex => {
            const info = MuscuExercises.getById(ex.exerciseId);
            exercises.push({
              exerciseId: ex.exerciseId || 'custom',
              name: ex.name || (info ? info.name : 'Exercice'),
              category: info ? info.category : 'lower',
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              suggestedWeight: ex.weight ? parseFloat(ex.weight) || null : null,
              restSec: ex.rest ? parseInt(ex.rest) || 60 : 60,
              notes: ex.notes || '',
              blockName: block.name || '',
              isDeload,
            });
          });
        });
        return {
          dayIndex: i,
          label: day.label || `Jour ${i + 1}`,
          focus: day.focus || '',
          warmup: day.warmup || '',
          finisher: day.finisher || '',
          cooldown: day.cooldown || '',
          exercises,
          status: 'pending',
        };
      }),
    };
  }

  function _formatFeedback() {
    const feedbacks = MuscuStorage.getRecentFeedback(10);
    if (!feedbacks.length) return 'Aucun feedback encore — c\'est la première fois ou l\'athlète n\'a pas encore donné de retour.';
    return feedbacks.map(f => {
      let parts = [`[${f.date}]`];
      if (f.liked && f.liked.length) parts.push(`✅ Aimé : ${f.liked.join(', ')}`);
      if (f.disliked && f.disliked.length) parts.push(`❌ Pas aimé : ${f.disliked.join(', ')}`);
      if (f.tooHard && f.tooHard.length) parts.push(`🔴 Trop dur : ${f.tooHard.join(', ')}`);
      if (f.tooEasy && f.tooEasy.length) parts.push(`🟢 Trop facile : ${f.tooEasy.join(', ')}`);
      if (f.missing) parts.push(`📝 Manquait : ${f.missing}`);
      if (f.notes) parts.push(`💬 ${f.notes}`);
      if (f.mood) parts.push(`Humeur : ${f.mood}`);
      return parts.join(' | ');
    }).join('\n');
  }

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

  return { ask, getPresets, analyzeSession, generateWeekPlan };
})();
