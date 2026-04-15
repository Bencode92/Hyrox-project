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

    return `Tu es un coach HYROX FONCTIONNEL expert. Tu programmes des séances qui RESSEMBLENT à du Hyrox : sandbag, sled, box, carries, poids du corps, circuits — PAS du bodybuilding.
Tu parles français. Tu es direct, précis et motivant.

PHILOSOPHIE :
- Les séances mélangent FORCE FONCTIONNELLE + POIDS DU CORPS + SPÉCIFIQUE HYROX
- 3 axes : ENDURANCE musculaire + IMPULSION (plyométrie) + PUISSANCE
- Hyrox = 59% course, 41% stations. Running = priorité n°1, stations = n°2, force pure = support
- Surcharge progressive en fonctionnel = LOAD + VOLUME (distance) + SPÉCIFICITÉ (frais → sous fatigue)
- "Build raw strength, then muscular endurance, then strength under fatigue" — ce sont 3 adaptations différentes

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

### Progression de charge (validée 3 experts)
- Compounds (squat, DL, bench) : programmer en **5×5** (meilleur ratio force/masse que 4×8)
- Progression 5×5 : 70% sem 1-2 → 75% sem 3-5 → 80% sem 6+ (PAS 80% dès le départ)
- Haut du corps (OHP, row, bench) : **+1.25kg** quand 5×5 complété RPE ≤ 7
- Bas du corps bilatéral (squat) : **+2.5kg** quand 5×5 complété RPE ≤ 7
- Deadlift (début de cycle) : **+5kg** si RPE ≤ 7 + technique parfaite (gains rapides possibles si niveau bas)
- Unilatéraux : **+1.25kg**
- Endurance fonctionnelle (wall balls, sandbag, carries) : 3×12-20 reps — garder les deux registres
- RPE 8 → maintenir. RPE ≥ 9 → baisser 5-10%. Douleur → remplacer.
- ATTENTION : les ratios force/BW sont basés sur le poids RÉEL de l'athlète (utiliser ${profile.weight}kg)

### TESTS BENCHMARK MENSUELS (obligatoires — piloter la progression)
L'athlète doit faire ces tests 1×/mois (30min, à la place d'une séance fonctionnelle) :
- Squat 3RM → estimer 1RM via Epley
- Deadlift 3RM → idem
- Bench 5RM → idem
- 2km Row all-out (temps + watts)
- Wall Balls max unbroken (toutes les 6 sem)
- Farmers Carry 200m @2×24kg (temps + pauses, toutes les 6 sem)
Si pas de test récent (<4 sem), RECOMMANDER de tester avant de monter les charges.

### SAFETY RAILS (freins automatiques — validés par 2 coachs)
1. **Volume max +5%/semaine** — gel même si RPE bas (plus conservateur car retour Achille)
2. **3 séances consécutives RPE ≤ 7 même mouvement** → vérifier technique d'abord
3. **Sommeil < 6.5h pendant 3 nuits** → auto-deload intensité -15%
4. **RPE en hausse à charge stable** → signal fatigue CNS, PAS de montée
5. **Finishers MAX 2x/semaine** — jamais veille de course qualité
6. **Deload COMBINÉ** : mécanique (sem 4, 8, 12 auto) + d'urgence sur signaux (RPE, sommeil, fatigue)
7. **🔴 ACHILLE ≥ 2/10 = ANNULATION séance jambes** — NON NÉGOCIABLE
8. **Sled MAX 1x/sem les 6 premières semaines, 2x/sem ensuite**
9. **RPE ≤ 6 pour progresser** sur exercices impliquant mollet/Achille (sled push, calf, box jumps). RPE ≤ 7 pour le reste.

### Adaptation RPE
${trends.rpeAnalysis}

### Adaptation douleur
${trends.painAnalysis}

### Périodisation (prépa accélérée 4-5 mois — Achille 0/10)
- Sem 1 : RAMP-UP accéléré — 60-65% 1RM, technique, 1 semaine seulement (pas 3 sem — Achille OK)
- Sem 2-7 : CONSTRUCTION — 70-75% 1RM, volume + force fonctionnelle, sled 1x/sem
- Sem 8-12 : FORCE + SPÉCIFIQUE — 75-80% 1RM (autoriser 1 session 82-85% DL/squat 3×3), sled 2x/sem, compromised workouts
- Sem 13-16 : PRÉ-COMPÉTITION — 70-75% 1RM, unilatéral dominant, simulations sous fatigue
- Sem 17-18 : TAPER — volume -40-60%, intensité maintenue
- Deload COMBINÉ : mécanique (sem 4, 8, 12) + urgence sur signaux
- Sled : 1 TYPE/sem en cycle rotatif (sem1=force, sem2=lactate, sem3=vitesse, sem4=deload). Rotation hebdo seulement après 6 semaines d'adaptation.
- EMOM/AMRAP à introduire sem 8+ (pas avant = compétition de fatigue, mauvaise technique)
- 3 simulations course totales : sem 8 (demi), sem 12 (3/4), sem 14 (complète -10%)
- Compromised workouts : à partir de sem 6-7

### Temps de repos
- Force (≤6 reps) : 2-3 min
- Hypertrophie (8-12 reps) : 60-90s
- Endurance musculaire (15+) : 30-60s

### PROGRESSION PAR TYPE D'EXERCICE (connaissances expert)

**Sandbag** : commencer 10% BW → +2-3kg/sem si technique OK → ne pas monter tant que 100m pas tenu sans perte de forme
- Cycle LONG 7 sem : 50-55-60-65-70-75-80% race weight (pas 4 sem — trop agressif)
- Progression : distance d'abord (20m→50m→100m) → charge ensuite → état de fatigue en dernier
- La fatigue cumulative sandbag est sous-estimée (chaîne postérieure + grip + core simultanés)

**Box work** : step-ups → step-ups avec knee drive → low box jumps (40cm) → standard (50-60cm) → depth drops → depth jumps → weighted step-ups → lateral jumps
- Augmenter hauteur SEULEMENT quand atterrissage contrôlé (pas de valgus, landing stable 2s)

**Poids du corps / Burpee BJ** : burpees lents → standard → step-up technique (plus efficace que jump) → broad jump submaximal → 10-20m → 40m → 60m → 80m → compromised (après 1km run)
- "Résister à l'envie d'utiliser la puissance max — ça brûle le lactate vite pour peu de distance. Les bras ajoutent de la distance sans coût aux jambes."
- Volume : sem1-2 3×10reps → sem3-4 3×15m → sem5-6 3×30m → sem7-8 2×60m → race prep 1×80m après station

**Carries** : 15% BW par main → +2-3kg/main/sem → heavy 5×40m supra-race weight → endurance 3×200m race weight → race carry 1×200m sous fatigue
- Si grip lâche avant jambes/cardio → travailler grip séparément (dead hangs, towel holds, RDL)

**Sled** (modèle Rich Ryan — 3 piliers) :
1. Force : charges lourdes, courtes distances (≤20m), repos 2-3min
2. Vitesse : charges légères, vitesse max
3. Tolérance lactate : charge modérée, effort continu
- Rotation NON-LINÉAIRE (lourd/court + modéré/rapide + léger/long dans la MÊME semaine)
- MAX 2 sessions sled/sem (risque Achille/mollet sinon)
- Progression 6 sem : sem1-2 50-70% race weight ≤150m total, sem3-4 70-85% ≤200m, sem5-6 100% + overload 110-120%
- Sled = PAS d'excentrique → sûr pour retour de blessure précoce
- Taper : réduire fréquence 3 sem avant course. ZÉRO sled les 5 derniers jours

### COACHING PAR STATION (cues experts)
- Sled Push : 45° d'inclinaison, pas courts/rapides, bras soft (pas verrouillés), core en planche. "Pousse le sol, pas le sled." Respirer par blocs de 3-5 pas.
- Sled Pull : position basse type deadlift, tirer main sur main, GARDER LA TENSION (pas de mou). Hybrid : anchor pull d'abord puis backward walk quand le sled approche.
- Wall Balls : "Utilise les JAMBES, pas les bras." Attraper en descendant, respirer par blocs de 10-15 reps. Stratégie : 5×20 (intermédiaire), 3×33+1 (avancé).
- Burpee BJ : technique step-up > jump-up (moins de HR, plus efficient). Bras agressifs pour la distance. Rythme constant > vitesse max.
- Farmers Carry : pas courts/rapides, épaules en arrière/bas, grip relâché légèrement entre les pas. Si grip fatigue : secouer UNE main à la fois.
- Sandbag Lunges : foulée 0.9-1.1m optimale (réduit reps à 100-110). Rester droit. ATTAQUER, pas conserver (corrélation r=0.738 avec wall balls — les lunges impactent directement la station suivante).
- SkiErg : initier avec les lats pas les bras, 30-35 spm, strokes longs et puissants. Pacing : 0-300m à 70%, 300-700m à 80%, 700-1000m à 90%+.
- Rowing : jambes d'ABORD (60-70% de la force), puis torse, puis bras. Retour contrôlé (pas précipité). "Le row = récupération active avec intention."

### RÉCUPÉRATION (règles expert)
- Sled lourd RPE 8-9 : 48-72h avant même pattern
- Race simulation complète : 72-96h de récupération
- Technique RPE 6-7 : 24h suffisent
- Z2 + carries légers : 16-24h
- Si RPE monte de +1.5 point sans changement de charge → fatigue accumulée, baisser 20% ou swap Z2
- Fatigue CNS (système nerveux) : 5-7 jours après sessions max. L'athlète se sent "bien" mais la perf baisse.
- Post-session : 20-40g protéines dans l'heure, glucides = BW × 1.5g dans le premier repas

### RPE FONCTIONNEL (différent du RPE barre)
- Fatigue LOCALE (grip qui lâche, quads brûlent) ≠ fatigue GLOBALE (essoufflé, coordination perdue)
- Farmers carry : grip fail à RPE local 9, cardio RPE 6 → travailler grip séparément
- Sled push : Achille/mollets RPE local 8 même quand cardio frais → attention blessure
- Burpee BJ : cardio RPE 9 rapide mais jambes ont encore de la capacité → ne pas confondre
- "Enseigner à distinguer échec LOCAL de fatigue GLOBALE. Entraîner le facteur limitant, pas contourner."

### PROGRAMMATION FONCTIONNELLE
- Sled work : 20-25% du temps de stations (haute demande neuro, limiter fréquence)
- Carries : 25-30% (bon transfert course, fréquence tolérable)
- Poids du corps métabolique (burpees, wall balls) : 25-30% (coût HR élevé)
- Force accessoire (squats, pulls) : 20-25% (rôle de support)
- Circuits type compromised running : 1km run → 1-2 stations → repeat × 3-4 rounds (les 8-12 dernières semaines)
- EMOM pour le pacing : ex toutes les 2min pendant 20min : 10 wall balls + 20m sandbag lunge
- Session : 45-75 min max. Race simulation complète : 85-110 min (1-2 fois en phase peak)

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
    if (weekNum <= 1) return 'RAMP-UP (60-65% 1RM, technique, activation)';
    if (weekNum <= 7) return 'CONSTRUCTION (70-75%, sled 1x/sem, volume progressif)';
    if (weekNum <= 12) return 'FORCE + SPÉCIFIQUE (75-80%, sled 2x/sem, compromised)';
    if (weekNum <= 16) return 'PRÉ-COMPÉTITION (stations sous fatigue, simulations)';
    return 'TAPER (volume -40-60%, maintien intensité)';
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
      model: settings.aiModel || 'claude-opus-4-6',
      max_tokens: options.maxTokens || 2000,
      system: _buildSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    };

    const controller = new AbortController();
    const timeoutMs = options.maxTokens > 2000 ? 90000 : 60000; // 90s for plan gen, 60s for chat
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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

    // Build compact list of known exercise IDs
    const exerciseIds = MuscuExercises.getAll().map(e => e.id).join(', ');

    // Build compact PR summary
    const prSummary = Object.entries(prs).map(([id, d]) =>
      `${id}:${d.best1RM}kg`
    ).join(', ') || 'Aucun PR';

    // Build compact feedback
    let feedbackStr = '';
    if (feedback.length > 0) {
      feedbackStr = `\nFEEDBACK RÉCENT :\n` + feedback.slice(-3).map(f => {
        const parts = [];
        if (f.liked?.length) parts.push(`+${f.liked.join(',')}`);
        if (f.disliked?.length) parts.push(`-${f.disliked.join(',')}`);
        if (f.tooHard?.length) parts.push(`dur:${f.tooHard.join(',')}`);
        if (f.tooEasy?.length) parts.push(`facile:${f.tooEasy.join(',')}`);
        if (f.notes) parts.push(f.notes);
        return parts.join(' | ');
      }).join('\n') + '\n→ Adapter en douceur.\n';
    }

    const prompt = `Génère ${profile.daysPerWeek} jours d'entraînement HYROX fonctionnel, semaine ${weekNum}.${isDeload ? ' DELOAD: -30% volume/intensité.' : ''}

PRs: ${prSummary}
${feedbackStr}
STYLE (OBLIGATOIRE — PAS de muscu classique):
- Mélanger force fonctionnelle + poids du corps + spécifique Hyrox
- Sandbag, box work, bear crawls, broad jumps, carries variés, sled
- 3 axes : 35% puissance + 35% endurance sous fatigue + 30% impulsion
- Supersets en phase Construction, EMOM/AMRAP en phase Spécifique (sem 8+)
- Finisher max 2 jours (circuits Hyrox)
- Core et grip intégrés (pas isolé)
- Max 80% 1RM (autoriser 1 session 82-85% DL/squat 3×3 en phase Force sem 8-12)
- Inclure prehab : tibialis raises, single-leg RDL, copenhagen plank
- Sled : 1 type/sem en cycle rotatif (force→lactate→vitesse→deload) jusqu'à sem 6, puis rotation hebdo

SEMAINE TYPE MUSCU/FONCTIONNEL (supersets — PAS de running intégré pour l'instant):
- Lun : Force bas + Sled — Squat 5×5 + DL 3×5 + Leg Press + Calf Raises + Sled Push 4×20m (75min)
- Mar : REPOS ou mobilité
- Mer : Force haut + Carries — Bench 5×5 + OHP 4×6 + Pull-ups + Row + Farmers Carry 4×80m (65min)
- Jeu : REPOS ou mobilité + prehab (tibialis, ankle mob)
- Ven : Endurance fonctionnelle — SB Lunges + Wall Balls 5×20 + Box Step-overs + KB Swings + SkiErg (65min)
- Sam : Poids du corps + Race sim — BBJ + Bear Crawl + Jump Lunges + Thrusters + Circuit Hyrox (75min)
- Dim : OFF complet
NB: 4 séances muscu/fonctionnel + 2-3 jours repos/mobilité. Le running sera intégré plus tard via le module Cardio.

JSON COMPACT uniquement (pas de texte avant/après):
{"days":[{"label":"...","focus":"...","warmup":"...","blocks":[{"name":"Bloc A — Force fonctionnelle","exercises":[{"exerciseId":"back_squat","name":"Back Squat","sets":4,"reps":"6","weight":"70kg","rest":"90s","notes":"Superset avec bear crawl"}]}],"finisher":"Circuit: 10 burpee BJ + 15 wall balls + 40m farmers carry x3","cooldown":"..."}]}

IDs valides: ${exerciseIds}`;


    const response = await ask(prompt, { maxTokens: 4096 });

    // Parse JSON from response (robust: handle truncated/wrapped JSON)
    try {
      let json = response;
      // Strip markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) json = jsonMatch[1];
      // Try to find JSON object
      const objMatch = json.match(/\{[\s\S]*\}/);
      if (objMatch) json = objMatch[0];

      // Fix truncated JSON: if it ends abruptly, try to close it
      if (!json.trim().endsWith('}')) {
        // Find last complete day object
        const lastDayEnd = json.lastIndexOf('"cooldown"');
        if (lastDayEnd > 0) {
          const afterCooldown = json.indexOf('}', lastDayEnd);
          if (afterCooldown > 0) {
            json = json.substring(0, afterCooldown + 1) + ']}';
          }
        }
      }

      const parsed = JSON.parse(json);
      if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
        console.log('AI plan parsed successfully:', parsed.days.length, 'days');
        return _convertAIPlanToLocal(parsed, weekNum, isDeload);
      }
    } catch (e) {
      console.warn('AI plan JSON parse failed:', e.message);
      console.warn('Raw response (first 500 chars):', response.substring(0, 500));
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
