# HyroxForge Musculation — Document Expert V3

**Date** : 28 mai 2026
**Athlète** : Benoit, ~75 kg, profil intermédiaire, prépa Hyrox
**App** : https://bencode92.github.io/Hyrox-project/muscu.html
**Code** : https://github.com/Bencode92/Hyrox-project
**Objet** : Validation des nouvelles fonctionnalités de **coaching live** ajoutées au module musculation

---

## 0. Pourquoi ce document

Le module musculation a été enrichi avec **3 features de coaching** que je veux faire valider par un expert avant de continuer à itérer dessus :

1. **Chrono repos auto + bouton « Valider série »** — gestion du tempo de séance
2. **Suggestion de charge intelligente (RPE-based)** — auto-progression
3. **Programme abdos quotidien dédié (7 jours rotatifs, gainage focus)** — séance courte ajoutée

Les questions précises sont listées en fin de chaque section + bloc final (§5).

---

## 1. Chrono repos auto entre séries

### Comment ça marche
- Sur chaque ligne de série, un bouton **✓** apparaît à côté du sélecteur RPE.
- Quand l'athlète l'active :
  1. La série est figée (les champs deviennent grisés, non éditables).
  2. Un **bandeau flottant** apparaît en bas avec un countdown `mm:ss` + barre de progression.
  3. Une nouvelle série vide est auto-ajoutée pour la suivante (pré-remplie avec poids/reps de la précédente).
- À la fin du countdown : **double beep** (880 Hz puis 1320 Hz) + **vibration** (300 ms + 100 ms pause + 300 ms).
- Boutons disponibles : `+15s`, `−15s`, `Skip`.

### Durée par défaut (si pas définie dans le plan)
| Catégorie | Repos |
|---|---|
| Compound (back squat, deadlift, bench, OHP, row, hip thrust, thruster) | 90 s |
| Push/Pull isolation | 90 s |
| Core / abdos | 45 s |
| Explosif (box jump, KB swing, farmers carry) | 60 s |

Le plan généré peut spécifier `restSec` par exo (priorité sur le défaut).

### Questions expert
1. **Les durées par défaut sont-elles cohérentes** ? J'hésite à mettre 120 s pour compound lourd (≥80 % 1RM) et 90 s pour modéré. Vaut-il mieux scinder ?
2. **Le repos doit-il dépendre du RPE** de la série qu'on vient de finir ? (RPE 9 → +30 s auto ?)
3. Faut-il un **chrono d'effort** (EMOM/Tabata) en plus, ou le repos seul suffit ?

---

## 2. Suggestion de charge intelligente (RPE-based)

### Algorithme (muscu-storage.js)

Pour chaque exercice quand on ouvre la séance :

```
1. Récupérer la DERNIÈRE session contenant cet exercice
2. Calculer :
   - lastWeight  = max(weight) sur les sets working
   - avgReps     = moyenne des reps
   - lastRpe     = moyenne RPE des sets ayant un RPE rempli
                   (fallback : session.globalRpe)
   - hasPain     = session.painNotes non vide
3. step = 2.5 kg si compound, 1.25 kg sinon

4. Décision :
   - hasPain                       → -step, raison "douleur"
   - lastRpe ≥ 9                   → -step, raison "RPE trop élevé"
   - reps cible non atteintes      → -step, raison "reps shortfall"
   - lastRpe ≤ 7 + reps OK         → +step, raison "RPE confortable"
   - lastRpe 7-8.5                 → maintien
   - pas de RPE + reps OK          → +step prudent (micro-progression)

5. Arrondir au 2.5 kg le plus proche
6. Afficher : ↑/→/↓ + poids suggéré + delta + raison
```

### Exos classés "compound" (palier 2.5 kg)
`back_squat`, `front_squat`, `deadlift`, `rdl`, `sumo_deadlift`, `bench_press`, `ohp`, `barbell_row`, `hip_thrust`, `thruster`, `power_clean`, `clean_press`, `push_press`.

Tous les autres = isolation (palier 1.25 kg).

### Affichage dans l'app
Un bandeau coloré apparaît au-dessus de chaque exo en séance :
- **Vert ↑** : progression
- **Gris →** : maintien
- **Orange ↓** : déload
- **Rouge ⚠️** : pain — charge abaissée

Exemple : `↑ 85 kg suggérés (+2.5 kg) — RPE 7.0 confortable — progression`

### L'IA peut overrider
La génération hebdomadaire de plan par Claude Opus reste prioritaire — si l'IA propose 82.5 kg pour un exo, c'est ça qui s'affiche dans le plan du jour. La suggestion ci-dessus s'applique uniquement quand on charge la séance dans l'écran de log (et quand l'utilisateur ajoute un exo manuellement à la séance).

### Questions expert
1. **Les paliers (+2.5 kg compound / +1.25 kg isolation) sont-ils corrects** pour un intermédiaire ? Ou faut-il du double progression (reps d'abord puis poids) ?
2. **La règle "reps cible non atteintes → déload"** est-elle trop agressive ? Beaucoup de prog acceptent un shortfall de 1-2 reps comme normal.
3. **Le déload sur douleur (-1 palier seulement)** — suffisant ou faudrait-il -5 % minimum ?
4. **Compound = liste hardcodée**. Quel exo manque ? (chin-ups, dips lestées, KB clean, etc.)
5. Faut-il distinguer **progression rapide (débutant) vs lente (avancé)** ? Actuellement c'est le même palier pour tout le monde.

---

## 3. Finisher Poignet + Avant-bras (auto, fin de séance)

### Pourquoi
Le grip est le maillon faible Hyrox sur les carries (200 m farmers à race weight) et le sled pull. Un travail dédié 3× / semaine devrait suffire, mais comme il est court et faible-impact je l'ajoute en finisher de **chaque** séance muscu.

### Contenu (~5 min)
| Exo | Sets × Reps | Repos |
|---|---|---|
| Farmers Carry | 2 × 30 m | 30 s |
| Wrist Curl | 2 × 15 | 30 s |
| Dead Hang | 2 × 30 s | 45 s |

Toggle ON/OFF dans les Settings (défaut ON). Régénère le plan automatiquement quand on change le toggle.

### Questions expert
1. **Tous les jours, c'est trop ?** Risque tendinite ou utile vu le volume modéré ?
2. **Dead hang 2×30s** est-il assez ? Certains coachs préconisent du dead hang pondéré (BW + 10-20 kg) 3×45 s.
3. Faut-il **alterner les variantes** par jour : farmers / suitcase carry / pinch grip / towel pull, plutôt que toujours farmers ?
4. **Position** dans la séance : juste avant cooldown OK, ou plutôt avant le travail principal (pour ne pas dégrader la perf grip sur deadlift) ?

---

## 4. Programme abdos quotidien dédié — 7 jours rotatifs

### Format général
- **Une session différente chaque jour** (rotation hebdomadaire automatique selon le jour de la semaine).
- **Durée cible** : ~10 min.
- **Structure** : 4 tours de 4 exos (ou AMRAP 10 min) — 10 s repos entre exos, 45 s entre tours.
- **Progression par phase** (multiplicateurs reps × secondes) :

| Phase | Semaines | × reps | × secondes |
|---|---|---|---|
| Adaptation | 1-2 | 1.0 | 1.0 |
| Construction | 3-5 | 1.2 | 1.15 |
| Force | 6-8 | 1.4 | 1.3 |
| Maintenance avancée | 9+ | 1.5 | 1.4 |

### Le contenu des 7 jours (valeurs Adaptation = sem 1-2)

#### Lundi — **Lower abs + 🛞 Roulette**
4 tours :
1. Ab Wheel Rollout — 10 reps
2. Hanging Leg Raise — 12 reps
3. Flutter Kicks — 40 s
4. Plank — 60 s

#### Mardi — **Gainage anti-rotation**
4 tours :
1. Pallof Press — 12 reps/côté
2. Side Plank — 40 s/côté
3. Copenhagen Plank — 25 s/côté (scale : Side Plank 30 s)
4. Bicycle Crunch — 24 reps

#### Mercredi — **Hollow + abdo gym**
4 tours :
1. Hollow Hold — 40 s
2. V-Ups — 15 reps
3. Dead Bug — 12 reps/côté
4. Ab Wheel — 8 reps

#### Jeudi — **Anti-extension lourd**
4 tours :
1. Ab Wheel — 12 reps
2. Hollow Hold — 45 s
3. Plank lesté — 75 s
4. Hanging Leg Raise — 10 reps

#### Vendredi — **Dynamic AMRAP 10 min**
Enchaîner sans repos, compter les tours :
1. Mountain Climber — 40 reps
2. V-Ups — 12 reps
3. Flutter Kicks — 30 s
4. Bicycle Crunch — 24 reps
5. Plank — 30 s

#### Samedi — **Mix complet + roulette**
4 tours :
1. Ab Wheel — 10 reps
2. Pallof Press — 12 reps/côté
3. Toes to Bar — 10 reps (scale : Hanging Leg Raise 12 reps)
4. Side Plank — 35 s/côté

#### Dimanche — **Gainage récup contrôlée**
3 tours longs :
1. Plank — 75 s
2. Hollow Hold — 40 s
3. Side Plank — 35 s/côté
4. Dead Bug — 12 reps/côté (très lent)

### Exos ajoutés à la banque (en plus des existants)
V-Ups, Hollow Body Hold, Dragon Flag, Bicycle Crunch, Flutter Kicks, Mountain Climbers, Cable Woodchopper, Toes to Bar.

### UI de la session
- **Card dashboard** « 🔥 Abdos du jour » avec preview des exos + **streak 7 jours** (dots verts pour jours faits).
- **Modal full-screen** au lancement : intro → timer big countdown (mm:ss) ou compteur reps tap-through → repos auto → tour suivant → done.
- Beep + vibration aux transitions.

### Questions expert
1. **10 min × 7 jours = 70 min/sem dédiés abdos**, en plus du gainage présent dans le programme muscu principal. Est-ce trop / pas assez / juste pour un Hyrox finisher ?
2. **Le jour 7 (récup) suffit-il** comme rest ou faut-il un vrai jour OFF total (0 abdos) hebdomadaire ?
3. **L'AMRAP 10 min du vendredi** se chevauche avec le travail metcon Hyrox traditionnel. Risque de doublonner ? Mieux vaudrait un jour différent ou un format autre ?
4. **Copenhagen plank 25 s/côté** mardi — agressif pour un intermédiaire qui n'en a jamais fait. Faut-il scale par défaut côté side plank classique pour les 2 premières semaines ?
5. **Le ratio statique/dynamique** (4 jours plutôt statique : lun-mar-mer-jeu-dim ; 2 jours dynamiques : ven-sam) est-il équilibré ?
6. **Toes to Bar samedi** : scale fourni (hanging leg raise), mais le mouvement non-strict reste accessible aux non-gymnastes ? Ou retirer purement ?
7. **Progression × 1.5 reps en phase Force (sem 6-8)** : ab wheel passe de 12 → 18 reps, plank lesté 75 s → 98 s. Crédible ou faut-il plafonner certains exos ?
8. **Pas de variantes lestées proposées** (V-Ups avec poids, dead bug avec KB, etc.) — vaudrait le coup d'introduire en phase Force ?

---

## 5. Questions transverses

### A — Cohérence globale
Avec le finisher quotidien (5 min poignet) + la séance abdos quotidienne (10 min) ajoutés à la séance muscu principale (45-60 min) **plus** les sessions cardio, on arrive à du **75 min de travail par jour les jours muscu**. Trop ?

### B — Gestion fatigue
La règle RPE-based protège bien sur la muscu principale. Mais **rien ne contrôle la fatigue cumulée du finisher + abdos** par rapport au lendemain. Faut-il un signal "skip abdos auto si RPE séance ≥ 9" ?

### C — Tracking
Les sessions abdos sont sauvegardées (`type: 'abs'`) avec : rounds complets (ou rounds AMRAP), durée, thème, phase. **Pas de tracking par exo individuel** (juste le complet/incomplet). Suffisant ou faut-il enregistrer "ai-je tenu les 45 s de hollow ?" pour ajuster la progression ?

### D — Cas spécifiques
- **Retour de blessure** (Achille, dos) — le programme abdos doit-il se désactiver automatiquement ? Aujourd'hui c'est manuel via Settings.
- **Compétition < 2 semaines** : faut-il un taper auto sur les abdos (passer en mode "récup contrôlée" tous les jours) ?

---

## 6. Ce que j'attends de l'expert

Idéalement :

1. **Validation OK / NOK** pour chacune des 3 features
2. **Top 3 ajustements prioritaires** à apporter — chiffres concrets si possible (ex : "passer plank lesté de 75 → 60 s en phase Adaptation")
3. **Red flags** s'il y en a (blessure probable, surentraînement, contre-productif Hyrox)
4. **Idées d'enrichissements** qui auraient un fort ratio impact/effort

Format de réponse libre, même quelques notes vocales transcrites suffisent. Je peux retravailler le code à partir de ça.

---

**Branche feature mergée sur `main`** :
- `9f11382` — Add rest timer, smart load suggestion, auto finisher
- `c22de51` — Add daily abs program (7-day rotation with phase progression)
- `97c737d` — Intensify abs program — 10 min, 4 rounds, more gainage
- `ef72c67` — Merge into main

Code dispo dans `js/muscu-app.js`, `js/muscu-exercises.js`, `js/muscu-storage.js`. Diff complet : `git log -p ef72c67^..ef72c67` ou sur GitHub.
