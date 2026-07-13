# HyroxForge — État actuel du programme + Plan d'action Phase 0

**Date** : 13 juillet 2026
**Athlète** : Benoit, 80 kg / 183 cm, intermédiaire
**Contexte** : blessure pec + dos → diagnostic kiné → besoin de refonte
**Objet** : décrire ce qui existe dans l'app aujourd'hui, pourquoi ça ne convient plus, et le plan concret pour migrer.

---

## 1. Ce qu'on a AUJOURD'HUI dans l'app

### 1.1 — Programme muscu actif (template 5j Hybride Hyrox + Muscle, v5)

**Objectif visé** : hybride Hyrox + prise de muscle avec focus rondeur pec.

| Jour | Split | Charge dominante | Pec sets |
|---|---|---|---|
| **Lun** | Push force + Focus Pec Bas | Bench 5×5 + Decline 4×8 + Decline DB 3×10 + Cable + OHP 4×6 | ~12 |
| **Mar** | Pull force + Grip | Deadlift 3×5 + Weighted Chin 4×6-8 + Row barre 4×8 + Row cable 3×12 + Farmers | 0 |
| **Mer** | Legs force + Hyrox léger | Squat 5×5 + RDL 4×8 + Hip Thrust 4×10 + Split Squat + Sled 3×25m + WB 2×15 | 0 |
| **Jeu** | Push+Pull Volume + Focus Haut Pec | Incline Bench 4×8 + Incline DB 4×10 + Decline DB 3×10 + Cable 3×15 + DB Row 4×10 + Pull-up AMRAP + DB OHP + Lat Raise + Curls | ~14 |
| **Ven** | Legs volume + Circuit Hyrox | Front Squat 4×8 + RDL 3×10 + Leg Curl + Leg Press + Walking Lunge + Circuit 2 tours (Sandbag+BBJ+Thruster+KB) | 0 |

**Volumes hebdo actuels** :
- Pec : ~26-28 sets (dont ~15 en charge lourde bench/decline)
- Dos : ~17 sets (DL + row barre + chin lestée)
- Jambes : ~24 sets (squat 5×5 + RDL + hip thrust lourd)
- Cardio structuré : **~0 min** (les 2-3 courses/sem prévues n'ont jamais été faites)

### 1.2 — Features de l'app en place

**Programmation** :
- Templates 4j et 5j hybrides (constantes `TEMPLATES` dans `js/muscu-exercises.js`)
- Programme abdos quotidien avec rotation 7 jours (4 séances actives + 3 rest)
- Finisher poignet/avant-bras auto en fin de chaque jour muscu (5 min)
- Génération auto de plan hebdo avec régénération quand `TEMPLATES_VERSION` change

**Coaching live pendant la séance** :
- Mode « ▶ Commencer la séance » guidé plein écran
- Chrono repos auto avec beep + vibration
- Bouton REPOS large par série (au lieu du petit ✓)
- Suggestion de charge intelligente (RPE-based, +2.5 kg si RPE ≤ 7)
- Bouton 🔄 swap exo avec alternatives ciblées
- Superset visualisation avec panneau partenaires et tap-to-jump
- Dashboard hero card : une seule séance à faire visible à la fois

**Profil et personnalisation** :
- `weight`, `height`, `daysPerWeek`, `level`, `injuryNotes`, `focusZone`, `goal`
- `excludedExercises` = ['dips', 'weighted_dips'] (blessure épaule)
- `goal` = 'hybrid' (Hyrox + muscle)

**IA coach (Claude Opus via Worker Cloudflare)** :
- Prompt système avec règles hybride, focus utilisateur, exos interdits
- Génération de plans + analyse post-séance + chat coach

**Tracking** :
- Sessions loggées avec sets/reps/RPE/douleurs/sommeil
- PRs auto-calculés (formule Epley e1RM)
- Historique + graph tendance
- Streak abdos 7 jours
- Feedback post-séance (mood, exos aimés/pas aimés)

### 1.3 — Ce qui marche bien à garder tel quel

- L'infrastructure de coaching live (chrono, valider série, mode guidé, swap)
- Le mode dashboard hero card (une séance à la fois)
- Le tracking + PRs + historique
- La suggestion de charge RPE-based (l'algo est bon, juste les paliers à revoir)
- Le prompt IA structuré (juste à ajouter le mode recovery)

### 1.4 — Ce qui pose problème AUJOURD'HUI

- **Charges lourdes 5×5 sur bench/DL/squat** → probable cause principale de la blessure
- **Volume pec 28 sets/sem** = haut de fourchette optimale, agressif pour un athlète pas 100 % préparé
- **Aucune cardio Z2 structurée** → base aérobie inexistante malgré objectif Hyrox
- **Prehab (face pull) présent mais dilué en fin de séance** → pas assez systématique
- **Pas de gestion de la charge tissulaire post-blessure** → aucun frein automatique
- **Le mode `goal='hybrid'`** ne peut pas gérer une phase de récup — il faut un nouveau mode

---

## 2. Le gap à combler

Le kiné a dit : **« tu mets trop de poids, focus plus sur cardio et poids du corps, surtout pec et dos »**.

**Ce que ça implique concrètement** :
1. **Zéro charge lourde** sur bench, DL, squat pendant 3-4 semaines
2. **Cardio structuré** obligatoire chaque séance (Z2 principalement)
3. **Bodyweight prioritaire** sur pec et dos (push-ups variants, inverted rows)
4. **Prehab systématique** en warmup (face pull + band pull-apart) chaque séance
5. **RPE cap dur** à 6-7 max (au lieu du 8-9 actuel)
6. **Reprise progressive** codifiée après Phase 0 (50 → 60 → 70 % 1RM sur 3-4 sem)

**L'app actuelle ne sait pas gérer ça** — elle ne connaît que le mode « progresser en charge ». Il faut ajouter un mode « récup » qui inverse la logique.

---

## 3. Plan d'action (10 changements ordonnés)

### PRIORITÉ 1 — À coder cette semaine (fondations Phase 0)

#### #1. Nouveau `goal` = 'recovery' dans le profil
- Étendre l'enum `profile.goal` : `hyrox | hypertrophy | hybrid | recovery`
- Ajouter `profile.injuryStartDate` (ISO date) pour tracker début de Phase 0
- Ajouter `profile.recoveryWeek` calculée = `(today - injuryStartDate) / 7`
- UI : nouvelle option « 🩹 Récupération après blessure » dans Settings

**Fichiers** : `muscu-storage.js`, `muscu-app.js`, `muscu.html`
**Effort** : ~30 min

#### #2. Nouveau template `TEMPLATES.recovery` (Phase 0, 4 jours)
Structure détaillée dans `PHASE_0_RECOVERY_BRIEF.md` §5. Résumé :
- J1 Push BW + Cardio Z2 (55 min)
- J2 Pull BW + Cardio Z2 (55 min)
- J3 Legs modéré + Sled léger (50 min)
- J4 Push volume BW + Compromised léger (55 min)
- J5 Full body + Cardio dédié (60 min)

Sélectionné automatiquement quand `profile.goal === 'recovery'`.

**Fichiers** : `muscu-exercises.js` (nouveau const `RECOVERY_TEMPLATE`)
**Effort** : ~1 h

#### #3. Ajouter les exos manquants à la banque
Nouveaux IDs à créer :
- `ring_push_up` (Ring Push-ups — instabilité, activation pec +30 %)
- `deficit_push_up` (Deficit Push-ups sur poignées — remplace dips)
- `archer_push_up` (Archer Push-ups — unilatéral)
- `inverted_row` (Inverted Rows — row le plus safe lombaires)
- `cable_crossover_low` (Cable Crossover BAS → HAUT — fibres pec bas sans compression)
- `pec_deck` (Pec Deck machine — finisher métabolique)
- `machine_chest_press` (Machine Chest Press — safe alternative bench)
- `machine_shoulder_press` (Machine Shoulder Press — safe alternative OHP)
- `band_pull_apart` (Band Pull-Aparts — prehab quotidien)
- `assisted_pull_up` (Pull-up assisté élastique)
- `superman_hold` (Superman Hold — dos lombaires BW)

Chaque exo : cues, mistakes, video URL, primary/secondary muscles, hyrox tags.

**Fichiers** : `muscu-exercises.js` (~11 nouveaux exos)
**Effort** : ~1 h 30

#### #4. Bloc prehab warmup obligatoire
Nouveau const `WARMUP_PREHAB_BLOCK` auto-injecté en début de chaque séance quand `goal === 'recovery'` :
- 10 min rameur/ski erg Z2
- Face Pull 3×15
- Band Pull-Apart 3×20
- (Cat-cow 30 s, thoracic mobility 2 min)

**Fichiers** : `muscu-exercises.js`
**Effort** : ~20 min

#### #5. Cap RPE dynamique selon phase
Modifier `suggestNextLoad()` dans `muscu-storage.js` :
- Si `goal === 'recovery'` : cap RPE à 6-7, si dépassé → suggérer -5 %
- Si `recoveryWeek <= 2` : cap RPE 6 dur
- Si `recoveryWeek 3-4` : cap RPE 7
- Suggestion de charge ne dépasse jamais 60 % du best1RM stocké

**Fichiers** : `muscu-storage.js`
**Effort** : ~30 min

### PRIORITÉ 2 — À coder semaine prochaine (raffinement)

#### #6. Bloc cardio Z2 dans chaque séance (structure explicite)
Nouveau block type `cardio_z2` avec durée + type (rameur/ski erg/course).
Rendu spécial dans le mode séance guidée (timer countdown au lieu de sets/reps).

**Fichiers** : `muscu-exercises.js`, `muscu-app.js` (rendering)
**Effort** : ~1 h

#### #7. Prehab tracking quotidien indépendant
Nouvelle carte dashboard « 🛡 Prehab du jour » (comme la card abdos) :
- Inverted Rows 3×10 + Band Pull-Apart 3×20 + Dead Hang 3×30 s
- Streak 7 jours
- Peut être fait même les jours off

**Fichiers** : `muscu-exercises.js` (nouveau `PREHAB_DAILY_BLOCK`), `muscu-app.js` (nouvelle card dashboard), `muscu-style.css`
**Effort** : ~2 h

#### #8. Transition auto vers template Reprise Progressive (semaines 5-8)
Nouveau template `PROGRESSIVE_RETURN_TEMPLATE` qui :
- Charge tous les compound à 50 % de best1RM
- +5-10 % par semaine si aucune douleur signalée sur les 3 dernières sessions
- Retour au hybride complet après semaine 8

Déclenché quand `recoveryWeek >= 5`.

**Fichiers** : `muscu-exercises.js`, `muscu-app.js`, `muscu-storage.js` (logique de transition)
**Effort** : ~2 h

### PRIORITÉ 3 — Nice-to-have (après validation Phase 0)

#### #9. Mise à jour prompt IA avec contexte recovery
Ajouter dans `muscu-ai-coach.js` :
- Section « 🩹 PHASE RÉCUPÉRATION » qui remplace « FOCUS UTILISATEUR »
- Instructions dures : jamais de charge > 60 % 1RM, priorité BW + machine + prehab, cardio Z2 obligatoire
- Nouveau preset chat : « Analyse mes 7 derniers jours de récup »

**Fichiers** : `muscu-ai-coach.js`
**Effort** : ~30 min

#### #10. Auto-warning si douleur signalée
Modifier `saveSession()` : si `painNotes` non vide 2 sessions consécutives → toast alertant + suggestion « Passer en mode recovery » avec redirect vers Settings.

**Fichiers** : `muscu-storage.js`, `muscu-app.js`
**Effort** : ~30 min

---

## 4. Roadmap timeline

| Semaine | Action | Objectif |
|---|---|---|
| **Sem 0** (cette sem) | Coder #1 à #5 (fondations Phase 0) | Programme utilisable immédiatement |
| **Sem 1-4** | Suivre le template Phase 0 · logger religieusement · noter douleurs jour par jour | Récupérer + rebâtir la base cardio |
| **Sem 2** | Coder #6 à #8 (raffinement) | UX propre + prehab tracké + prépa transition |
| **Sem 5** | Bascule auto template Reprise Progressive | Retour charges à 50 % 1RM |
| **Sem 5-8** | Reprise progressive +5-10 %/sem si asymptomatique | Reconstruction force |
| **Sem 9+** | Retour hybride Hyrox + muscle | Programme normal avec règles ajustées |

---

## 5. Volumes cibles Phase 0 (vs actuel)

| Métrique | Actuel (blessant) | Phase 0 (visé) | Delta |
|---|---|---|---|
| Séries pec / sem | 28 | 15 (BW + machine) | -46 % |
| Séries dos / sem | 17 | 11 (inverted row + BW) | -35 % |
| Séries jambes / sem | 24 | 14 (léger) | -42 % |
| Cardio Z2 / sem | 0 min | 180 min | +∞ |
| HIIT / sem | 0 | 15 min | +1 séance courte |
| Charges compound | 5×5 à 80 % | ZÉRO | 100 % réduction |
| Prehab quotidien | intermittent | systématique | qualitatif |

---

## 6. Ce qui ne change pas

- L'UI de coaching live (chrono, valider série, mode guidé)
- Le tracking sessions + PRs + graph
- Le programme abdos quotidien (déjà correctement calibré)
- Le finisher poignet/avant-bras (garder — pas cause de blessure)
- Le mode dashboard hero card (une séance à la fois)
- Les IDs d'exos existants + banque actuelle

---

## 7. Risques et watch-outs

- **Risque d'ennui** : Phase 0 = charges légères, athlète peut se démotiver. **Mitigation** : gamifier avec streak prehab, focus sur PRs cardio (temps rameur/ski erg), tracker tempo lent comme performance.
- **Risque de retour trop rapide** : envie de charger après 2 semaines de bien-être. **Mitigation** : bascule auto contrôlée par `recoveryWeek`, pas par ressenti seul.
- **Risque de mauvaise interprétation kiné** : « focus cardio + BW » peut vouloir dire différentes choses. **Mitigation** : renvoyer le brief `PHASE_0_RECOVERY_BRIEF.md` au kiné pour validation avant coder.
- **Risque de perte de force** : baisse de -25 % de 1RM possible sur 4 sem sans charge (littérature). **Mitigation** : accepter, retour rapide (2-3 sem) grâce à mémoire musculaire.

---

## 8. Décision à prendre maintenant

**Option A — Aller vite** : coder les 5 priorités 1 dès ce soir (~4 h de dev cumulé), déployer, athlète démarre Phase 0 dès demain.

**Option B — Valider d'abord** : envoyer `PHASE_0_RECOVERY_BRIEF.md` au kiné + à GPT pour validation externe (48 h), puis coder si vert.

**Option C — Programme papier d'abord** : suivre le programme Phase 0 sur papier pendant 2 sem, coder ensuite seulement ce qui marche → évite dette technique si on change de cap.

**Reco perso : B → A → C**
- Valider d'abord (B) : évite d'investir 4 h de dev si un pro modifie tout
- Ensuite coder (A) : dès validation, on avance sans hésitation
- Le papier (C) est un plan B si le kiné réoriente radicalement

---

## 9. Fichiers touchés récap

| Fichier | Changements estimés | Priorité |
|---|---|---|
| `js/muscu-exercises.js` | +200 lignes (nouveaux exos + template recovery + warmup + prehab) | P1 |
| `js/muscu-storage.js` | +50 lignes (goal recovery, injuryStartDate, cap RPE dynamique) | P1 |
| `js/muscu-app.js` | +150 lignes (UI settings goal, cardio bloc rendering, prehab card) | P1-P2 |
| `js/muscu-ai-coach.js` | +40 lignes (section PHASE RÉCUPÉRATION) | P3 |
| `muscu.html` | +30 lignes (input goal + prehab card holder) | P1 |
| `css/muscu-style.css` | +50 lignes (styles cardio bloc + prehab card) | P2 |
| **Total** | **~520 lignes ajoutées** | |

**Templates version** : bumper à v6 pour auto-régen.

---

## 10. Prochaine action attendue

Choisir Option A / B / C au §8. Je peux démarrer le code dès que tu valides.

Si Option B choisie : envoie `PHASE_0_RECOVERY_BRIEF.md` à ton kiné et/ou à GPT (voir raw URL dans ce dernier), reviens avec leur feedback, on ajuste ce plan si besoin.
