# HyroxForge Musculation — Document de revue coach

**Date** : 15 avril 2026
**Auteur** : Benoit (athlète) + IA de programmation
**Objet** : Validation méthodologique du module musculation/fonctionnel de l'app HyroxForge
**Lien app** : https://bencode92.github.io/Hyrox-project/muscu.html
**Lien code** : https://github.com/Bencode92/Hyrox-project

---

## 1. Contexte et objectif

### L'app
HyroxForge est une web app de coaching personnalisé pour Hyrox. Elle comporte deux modules :
- **Module Cardio** (course, rameur, SkiErg) — déjà en place et validé
- **Module Musculation/Fonctionnel** (ce document) — en cours de construction

Le module musculation intègre une **IA (Claude Opus)** qui génère et adapte les séances en temps réel en fonction des performances, du feedback, du RPE, du sommeil et des douleurs de l'athlète.

### Le profil athlète
- **Poids** : ~75 kg
- **Situation** : retour de blessure (tendon d'Achille)
- **Objectif** : préparer Hyrox à ~6 mois
- **Disponibilité** : 4-5 jours/semaine (muscu/fonctionnel + cardio)
- **Équipement** : salle avec sled, sandbags, boxes, KB, rameur, SkiErg

### Résultats Hyrox précédent

| Épreuve | Temps | Classement | Verdict |
|---------|-------|------------|---------|
| Run 1 | 7:17 | bottom 6% | Pacing à revoir |
| SkiErg 1000m | 4:19 | bottom 29% | Correct |
| Sled Push 50m | 2:32 | bottom 12% | **Faible** |
| Sled Pull 50m | 5:50 | bottom 5% | **Critique** |
| Burpee BJ 80m | 3:54 | bottom 25% | À améliorer |
| Rowing 1000m | 5:22 | bottom 5% | **Critique** |
| Farmers Carry 200m | 1:59 | bottom 14% | **Faible** |
| Sandbag Lunges 100m | 3:18 | **top 30%** | Point fort |
| Wall Balls | 5:10 | bottom 23% | À améliorer |

**Points faibles majeurs** : Row, Sled Pull, Sled Push, Farmers Carry
**Point fort** : Lunges

---

## 2. Philosophie de programmation adoptée

### 2.1 Modèle hybride (pas powerlifting)

Suite à un premier audit coach, nous avons corrigé l'approche :

| Avant (erreur) | Après (corrigé) |
|---|---|
| Programme type bodybuilding | **Fonctionnel Hyrox** : sandbag, sled, box, carries, poids du corps |
| Intensité 85-90% 1RM | **Cap à 75-80% 1RM** — préserver la fraîcheur running |
| Finisher à chaque séance | **Max 2 finishers/semaine** — jamais veille de course |
| Barbell row pour sled pull | **Sled pull = deadlift + grip** (pattern hip hinge) |
| Dead hang pour grip | **Farmers carry à poids compétition** (progression distance) |
| Progression +2.5/+5kg | **Micro-progressions** : +1.25kg haut du corps, +2.5kg bas du corps |

### 2.2 Les 3 axes d'entraînement

Chaque semaine doit couvrir :
1. **Endurance musculaire** — haute reps, circuits, travail sous fatigue
2. **Impulsion / Plyométrie** — box jumps, broad jumps, jump lunges, depth jumps
3. **Puissance** — sled lourd, deadlift, sandbag over shoulder, KB swings

### 2.3 Principe de surcharge progressive fonctionnelle

Contrairement à la barre (où on ajoute du poids), la surcharge progressive en fonctionnel a **3 vecteurs indépendants** :

```
1. CHARGE (poids du sled, kg du sandbag, KB)
2. VOLUME (distance, reps, séries, temps sous tension)
3. SPÉCIFICITÉ (frais → sous fatigue → simulation course complète)
```

Le principe : **construire la force brute → endurance musculaire → force sous fatigue cardio**. Ce sont 3 adaptations différentes qui nécessitent des programmations différentes.

---

## 3. Progressions par type d'exercice

### 3.1 Sandbag

**Point de départ** (retour de blessure) : ~10% du poids du corps (~7kg)

**Cycle de 4 semaines :**
| Semaine | Charge | Volume |
|---------|--------|--------|
| 1 | 50% race weight (10kg) | 3×20m |
| 2 | 60% race weight (12kg) | 3×30m |
| 3 | 70% race weight (14kg) | 3×40m |
| 4 | 80% race weight (16kg) | 2×50m |

**Ordre de progression :**
1. Distance à charge sous-race (20m → 50m → 100m)
2. Augmentation de charge (+2-3kg/semaine)
3. État de fatigue (après cardio, pas frais)
4. Simulation course (100m après 7 stations)

**Race weight** : Hommes Open 20kg, Pro 30kg

> **Question coach** : Ce cycle de 4 semaines est-il trop agressif pour un retour de blessure ? Faut-il étendre à 6-8 semaines avec des paliers plus fins ?

### 3.2 Box work

**Progression en échelle :**
1. Step-ups (pas de saut)
2. Step-up + knee drive (engagement hip flexor)
3. Low box jumps 40-50cm (sauter, redescendre en marchant)
4. Standard box jumps 50-60cm (atterrissage 2 pieds)
5. Depth drops (descendre, absorber)
6. Depth jumps (descendre, rebondir immédiatement)
7. Weighted box step-ups (DB ou sandbag)
8. Lateral box jumps

**Règle** : augmenter la hauteur uniquement quand atterrissage contrôlé (pas de valgus du genou, landing stable 2 secondes).

**Retour de blessure** : step-ups uniquement au départ. Box jumps seulement quand le test de hop unijambiste montre une puissance symétrique. Plyométrie réactive en dernier.

> **Question coach** : Pour un retour de blessure Achille, à quel stade de la rééducation reintroduire les box jumps ? Le hop test unilatéral est-il suffisant comme critère ?

### 3.3 Burpee Broad Jumps

**Progression :**
| Phase | Exercice | Volume |
|-------|----------|--------|
| 1 | Burpees lents (pas de saut) | 3×10 reps |
| 2 | Burpees standard (jump up) | 3×10 reps |
| 3 | Step-up technique (plus efficient que jump) | 3×15m |
| 4 | Burpee + broad jump submaximal | 3×15m |
| 5 | Burpee BJ distance croissante | 3×30m → 2×60m |
| 6 | Compromised BBJ (après 1km run) | 1×80m |

**Coaching cues intégrés dans l'IA :**
- Technique **step-up > jump-up** (moins de spike HR, plus efficient, préféré par les élites)
- "Résister à l'envie d'utiliser la puissance max — ça brûle le lactate pour peu de distance"
- "Les bras ajoutent de la distance sans coût aux jambes — les utiliser agressivement"
- Rythme constant > vitesse max

> **Question coach** : La technique step-up est-elle vraiment supérieure pour tous les niveaux ? Ou seulement à partir d'un certain volume/fatigue ?

### 3.4 Carries (Farmers, Sandbag, Overhead, Suitcase)

**Hiérarchie de progression :**
1. Distance à charge légère (technique, grip, posture) — 15% BW par main
2. Augmentation de charge (+2-3kg/main/sem)
3. Race weight pour distance complète (200m à 2×24kg)
4. Overload training (plus lourd que compétition — 2×28-32kg)

**Mix de programmation :**
- **Heavy carries** : 5×40m à race weight +4-8kg, courte distance
- **Endurance carries** : 3×200m à race weight
- **Race carries** : 1×200m sous fatigue (après stations)

**Si grip lâche avant jambes/cardio** : travailler grip séparément (dead hangs 3×30-45s, towel holds, suitcase carries)

> **Question coach** : Pour le farmers carry, vaut-il mieux progresser en distance à charge fixe ou en charge à distance fixe ? Les deux modèles sont cités par différents coachs.

### 3.5 Sled (modèle Rich Ryan — 3 piliers)

**3 types de sessions sled dans la même semaine (rotation non-linéaire) :**

| Pilier | Charge | Distance | Repos | But |
|--------|--------|----------|-------|-----|
| **Force** | Lourde (>race weight) | ≤20m par set | 2-3 min | Force brute |
| **Vitesse** | Légère | 10m sprints × 6 | 60s | Puissance neuromusculaire |
| **Lactate** | Modérée (race weight) | 50m continu | 90s | Tolérance métabolique |

**Progression sur 6 semaines :**
| Semaines | Charge | Volume total/session |
|----------|--------|---------------------|
| 1-2 | 50-70% race weight | ≤150m |
| 3-4 | 70-85% race weight | ≤200m |
| 5-6 | 100% race weight + overload 110-120% | ≤250m |

**Fréquence** : MAX 2 sessions sled/semaine (risque tendinopathie Achille sinon)

**Spécificité retour de blessure** : le sled n'a PAS de composante excentrique → il peut être réintroduit plus tôt que la plupart des exercices bas du corps dans un protocole de rééducation.

**Taper** : réduire fréquence 3 sem avant compétition. ZÉRO sled les 5 derniers jours.

> **Question coach** : Pour un tendon d'Achille en guérison, le sled push est-il vraiment sûr à réintroduire tôt (vu l'absence d'excentrique) ? Ou la charge isométrique sur le mollet reste-elle un risque ?

---

## 4. Périodisation adoptée

### 4.1 Modèle en phases

| Phase | Durée | Focus | Charge max | Séances type |
|-------|-------|-------|-----------|-------------|
| **0. Retour blessure** | 2-3 sem | Mono-articulaire, PAS de supersets | 50-60% 1RM | Technique, mobilité, activation |
| **1. Adaptation** | 4-6 sem | Technique compound + fonctionnel léger | 60-70% 1RM | Supersets progressifs + sandbag léger |
| **2. Construction** | 6-8 sem | Volume + endurance musculaire | 70-75% 1RM | Circuits + carries + sled modéré |
| **3. Force** | 4-6 sem | Force fonctionnelle | **75-80% max** | Sled lourd + DL + box work |
| **4. Pré-compétition** | 4-6 sem | Stations sous fatigue | 70-75% 1RM | Compromised workouts + simulations |
| **5. Taper** | 7-14 jours | Volume -40-60%, intensité maintenue | Technique | Répétitions courtes race-pace |

> **Question coach** : Le cap à 80% 1RM en phase force est-il trop conservateur ? Rich Ryan a effectivement réduit le powerlifting lourd, mais est-ce que 1-2 séances de force lourde (85%+) sur les compound principaux (squat, DL) ne seraient pas bénéfiques ponctuellement ?

### 4.2 Semaine-type hybride (validée premier audit)

| Jour | Focus | Finisher ? |
|------|-------|-----------|
| **Lundi** | Force fonctionnelle (squat + DL + split squat + sandbag) | NON |
| **Mardi** | Run seuil 30-40min (module Cardio) | — |
| **Mercredi** | Push-Pull + carries (OHP + pull-ups + farmers carry + box) | Finisher grip |
| **Jeudi** | **Compromised run** : 4×(800m run + station) | — |
| **Vendredi** | Repos ou Z2 facile | — |
| **Samedi** | Race simulation (sled + wall balls + sandbag lunges + burpees) | Finisher circuit |
| **Dimanche** | Long run Z2 60-75min (module Cardio) | — |

> **Question coach** : Cette répartition est-elle cohérente ? Le jeudi (compromised run) après le mercredi (push-pull + carries) laisse-t-il assez de récupération pour le haut du corps ?

### 4.3 Deload — sur signaux, pas mécanique

L'IA déclenche un deload automatique si :
- RPE en hausse à charge stable (signal fatigue CNS)
- Sommeil < 6.5h pendant 3 nuits consécutives
- Volume hebdo a augmenté de +8% (gel même si RPE bas)
- 3 séances consécutives RPE ≤ 7 sur le même mouvement → vérifier technique d'abord

**Deload** : -40-50% volume, maintenir quelques efforts Zone 4 courts, éliminer le travail fonctionnel à haut volume.

> **Question coach** : Le deload sur signaux est-il préférable au deload mécanique (toutes les 4 sem) pour ce profil ? Ou faut-il combiner les deux (deload mécanique + deload d'urgence sur signaux) ?

---

## 5. Récupération — Règles programmées dans l'IA

### 5.1 Temps de récupération par type de session

| Type de session | Récupération minimum |
|----------------|---------------------|
| Sled lourd RPE 8-9 | 48-72h avant même pattern |
| Simulation course complète | 72-96h |
| Technique stations RPE 6-7 | 24h |
| Z2 + carries légers | 16-24h |
| Compromised running blocks | 48h |

### 5.2 Fatigue CNS vs fatigue musculaire

Le travail fonctionnel intense (RPE 8+) draine le système nerveux central plus que le cardio pur. Les DOMS se résolvent en 2-3 jours, mais la fatigue CNS peut persister 5-7 jours après des sessions max. L'athlète se sent physiquement "bien" mais la performance baisse.

**Règle IA** : si RPE monte de +1.5 point sans changement de charge → fatigue accumulée → baisser 20% ou swapper pour Z2.

### 5.3 RPE fonctionnel (différent du RPE barre)

**Problème clé** : en fonctionnel, la fatigue locale (grip, quads) diverge de la fatigue globale (cardio).

| Situation | RPE local | RPE cardio | Action |
|-----------|----------|-----------|--------|
| Farmers carry — grip lâche | 9 | 6 | Travailler grip séparément |
| Sled push — mollets brûlent | 8 | 5 | Attention Achille, pas forcer |
| Burpee BJ — essoufflé | 4 | 9 | Les jambes ont encore du jus |
| SkiErg — bras morts | 9 | 4 | Force pulling insuffisante |

**L'IA fait cette distinction** et recommande de travailler le facteur limitant, pas de contourner.

> **Question coach** : Comment gérer le RPE quand local et global divergent ? Faut-il se baser sur le plus élevé des deux ? Ou sur le facteur limitant de la station visée ?

### 5.4 Nutrition post-session

L'app intègre ces recommandations :
- **Post-session** : 20-40g protéines dans les 30-60 min + glucides = poids du corps × 1.5g
- **Hydratation** : 3L+/jour avec électrolytes pendant l'entraînement
- **Protéines** : 1.6-2.4g/kg/jour

> **Question coach** : Ces cibles nutritionnelles sont-elles adaptées pour un athlète en retour de blessure ? Faut-il augmenter les protéines pendant la phase de reconstruction ?

---

## 6. Coaching par station — Cues intégrés dans l'IA

### 6.1 Sled Push (50m — 152kg Hommes Open)
- Inclinaison 45°, mains juste sous les épaules
- Coudes soft (pas verrouillés), avant-bras contre les poteaux
- Core en planche, pas d'hyperextension lombaire
- Pas courts, rapides, pieds rasant le sol
- **"Pousse le sol avec tes jambes — le sled suit"**
- Respirer : bracing 3-5 pas, expiration explosive, rebracing
- Rythme 3 phases : accélération (5-10m) → drive constant → reset si besoin
- Cible Open : 50m en 1:45-2:00

### 6.2 Sled Pull (50m — 103kg Hommes Open)
- Position basse type deadlift, poids dans les hanches
- Technique hybride : anchor pull (assis en arrière, main sur main) puis backward walk quand le sled approche
- **Garder la tension dans la corde — le mou = énergie gaspillée**
- "Assis-toi dans tes hanches comme un deadlift, poitrine fière"
- Conduire avec les jambes, pas seulement les bras

### 6.3 Wall Balls (100 reps — 6kg @ 3m cible Hommes Open)
- **"Utilise tes JAMBES et hanches, pas tes bras, pour générer la hauteur du lancer"**
- Squat profond (hanche sous genoux — standard jugé)
- Attraper la ball en descendant (utiliser le momentum)
- Respiration par blocs de 10-15 reps
- Stratégie : 5×20 (intermédiaire), 3×33+1 (avancé), unbroken (élite)
- "Pense rythme, pas reps — chaque lancer comme un métronome"
- Pénalité 15-30s par squat peu profond ou cible ratée (règle 25/26)

### 6.4 Burpee Broad Jumps (80m)
- **Step-up > jump-up** pour la majorité des athlètes (moins de HR spike, plus efficient)
- Poitrine au sol obligatoire
- Extension complète debout avant le saut
- Bras agressifs vers l'avant pour maximiser la distance
- Effort submaximal par saut (70-80% puissance)
- "Start controlled pour les 20-30 premiers mètres, puis rythme"
- ~45-60 reps pour 80m selon longueur de foulée

### 6.5 Farmers Carry (200m — 2×24kg Hommes Open)
- Pick-up en hip hinge (pas en squat)
- Épaules en arrière et en bas, poitrine ouverte
- Pas courts et rapides, heel-to-toe
- **Grip** : serrer fermement, relâcher légèrement entre les pas pour éviter le pump
- Si fatigue grip : secouer UNE main à la fois (maintenir le mouvement)
- Cible Open : 200m en 1:20-1:45

### 6.6 Sandbag Lunges (100m — 20kg Hommes Open)
- Sandbag sur les épaules (obligatoire)
- **Foulée optimale : 0.9-1.1m** (données : réduit à 100-110 reps total, préserve les quads pour wall balls)
- Genou arrière touche le sol à chaque rep (standard jugé)
- Rester droit, ne pas s'effondrer en avant
- **ATTAQUER, pas conserver** — corrélation r=0.738 entre vitesse lunges et perf wall balls
- Mouvement continu > stops/reprises (ré-accélérer le sandbag coûte cher)

### 6.7 SkiErg (1000m)
- Initier avec les lats, PAS les bras — "tire tes coudes vers tes hanches"
- 40% de la puissance vient du bas du corps et du core
- 30-35 spm (strokes puissants et longs > rapides et courts)
- Pacing : 0-300m à 70%, 300-700m à 80%, 700-1000m à 90%+

### 6.8 Rowing (1000m)
- Séquence : jambes d'ABORD (60-70% de la force) → torse → bras
- Retour contrôlé (pas précipité — spike HR inutile)
- **"Le row = récupération active avec intention"** — ne pas sprinter après 4 stations
- Start : 5% plus facile que cible, build dans les 600m du milieu, finir fort les 200m

> **Question coach** : Ces cues sont-ils alignés avec ta méthodologie ? Y a-t-il des corrections ou ajouts spécifiques que tu voudrais voir intégrés ?

---

## 7. Base d'exercices — 77 exercices

### Répartition

| Catégorie | Nb | Exemples |
|-----------|-----|---------|
| **Bas du corps** | 13 | Back squat, deadlift, RDL, Bulgarian split, hip thrust, leg press... |
| **Haut — Poussée** | 8 | Bench, OHP, dips, push-ups, tricep pushdown... |
| **Haut — Tirage** | 10 | Pull-ups, barbell row, lat pulldown, hammer curl, dead hang... |
| **Core** | 7 | Plank, hanging leg raise, ab wheel, pallof press, side plank... |
| **Explosif** | 12 | Box jump, KB swing, thruster, wall ball, med ball slam, farmers carry, sled push/pull, burpee... |
| **Fonctionnel / Race** | 27 | Sandbag squat/lunge/carry/over shoulder/clean, bear crawl, box step-over/jump-over, broad jump, burpee BJ, devil press, man maker, assault bike, wall sit, jump lunge, pistol squat, sled push/pull lourd, rope climb, overhead/suitcase carry... |

Chaque exercice a :
- Lien vidéo tutoriel YouTube
- Points clés technique (cues)
- Erreurs fréquentes à éviter
- Muscles primaires/secondaires
- Pertinence Hyrox (quelles épreuves il prépare)

> **Question coach** : Manque-t-il des exercices critiques dans cette base ? Quels exercices ajouterais-tu ou retirerais-tu ?

---

## 8. Système d'adaptation IA

### 8.1 Comment ça fonctionne

1. **L'athlète log sa séance** : exercices, poids, reps, RPE par série, sommeil, douleurs
2. **L'IA analyse** : compare aux PRs, aux objectifs, aux tendances RPE, au sommeil
3. **L'athlète donne son feedback** : exercices aimés/pas aimés, trop dur/facile, ce qui manquait, notes libres
4. **L'IA génère la prochaine séance** en tenant compte de TOUT : performances, feedback, phase de périodisation, récupération, blessure

### 8.2 Safety rails (freins automatiques)

| Règle | Déclencheur | Action |
|-------|------------|--------|
| Volume max | +8%/semaine | Gel même si RPE bas |
| RPE consécutif bas | 3 séances RPE ≤ 7 même mouvement | Vérifier technique d'abord, pas ajouter |
| Sommeil insuffisant | <6.5h × 3 nuits | Auto-deload -15% intensité |
| RPE en hausse | RPE monte à charge stable | Signal fatigue CNS, pas de montée |
| Finishers | >2/semaine | Bloquer, remplacer par mobilité |
| Sled fréquence | >2 sessions/sem | Bloquer (risque Achille) |

### 8.3 Progression de charge (micro-progressions)

| Zone | Progression | Condition |
|------|------------|-----------|
| Haut du corps (OHP, row, bench) | +1.25 kg | Toutes séries RPE ≤ 7 |
| Bas du corps bilatéral (squat) | +2.5 kg | Toutes séries RPE ≤ 7 |
| Deadlift / sled push (début de cycle) | +5 kg | RPE ≤ 7 + technique parfaite |
| Unilatéraux (Bulgarian, step-up) | +1.25 kg | RPE ≤ 7 |
| Sandbag | +2-3 kg/semaine | Technique tient sous fatigue |
| Carries | +2-3 kg/main/semaine | Distance complète tenue |

> **Question coach** : Ces incréments sont-ils adaptés ? Faut-il ralentir encore pour le retour de blessure ? La condition "RPE ≤ 7" est-elle le bon seuil ou faut-il être plus conservateur (RPE ≤ 6) ?

---

## 9. Retour de blessure — Protocole intégré

### Phase 0 (semaines 1-3)
- Mono-articulaire uniquement
- PAS de supersets
- 50-60% 1RM max
- Technique et activation
- Évaluer douleur et compensation sans biais de fatigue croisée

### Retour aux exercices spécifiques

| Exercice | Réintroduction | Condition |
|----------|---------------|-----------|
| **Sled push** | Phase 1 (tôt — pas d'excentrique) | Douleur 0/10 sous charge |
| **Box step-ups** | Phase 1 | Pas de douleur |
| **Carries** | Phase 1 | Charge légère, distance courte |
| **Box jumps** | Phase 2 | Hop test unilatéral symétrique |
| **Burpee BJ** | Phase 2 | Burpees standard OK d'abord |
| **Plyométrie réactive** | Phase 3 (dernier) | Toutes les autres phases OK |

**Protocole Achille spécifique** :
- Eccentric heel drops 3×15 quotidien
- Ankle mobility (wall ankle test quotidien)
- Calf raises progressifs
- Sled : commencer concentric-only (push), pas de sled pull initialement

### Modèle de retour en 4 phases

| Phase | Charge | Critères de passage |
|-------|--------|-------------------|
| 1. Protection | 0-40% pré-blessure | Douleur <2/10 |
| 2. Charge précoce | 50-60% | +5-10%/sem, max +15%/sem |
| 3. Renforcement | 70-80% | Force >60% du côté sain |
| 4. Retour à la perf | 80%+ | Mouvements spécifiques pleine charge |

> **Question coach** : Ce protocole de retour est-il aligné avec ta vision ? Des étapes manquantes ? Le sled push concentric-only est-il vraiment safe pour un Achille en guérison ?

---

## 10. Benchmarks et objectifs

### Seuils de force pour Hyrox (homme ~75kg)

| Exercice | Suffisant Hyrox | Diminishing returns | Note |
|----------|----------------|-------------------|------|
| Back Squat (1RM) | 1.25×BW (94kg) | 1.5×BW (112kg) | Au-delà, mieux courir |
| Deadlift (1RM) | 1.5×BW (112kg) | 2×BW (150kg) | Driver sled push/pull |
| OHP (1RM) | 0.6×BW (45kg) | 0.75×BW (56kg) | Suffisant pour wall balls |
| Farmers Carry | 200m à 2×24kg sans pause | 200m à 2×32kg | Plus pertinent que dead hang |
| Pull-ups | 8-10 reps | 15+ | Base suffisante |
| Wall Balls unbroken | 30 reps | 50+ | Endurance quad/épaule |
| Burpee BJ 80m | Compléter | <3:30 | Efficacité technique |
| Sandbag Lunges 100m | Compléter à 20kg | Compléter à 25-30kg | Entraîner > compétition |

> **Question coach** : Ces benchmarks "diminishing returns" sont-ils réalistes ? À quel moment la force pure n'apporte plus de gain par rapport au temps investi en running/stations ?

---

## 11. Questions récapitulatives pour validation

### Méthodologie
1. **Le modèle hybride** (fonctionnel Hyrox > bodybuilding, cap 80% 1RM) est-il le bon cadre ?
2. **La répartition 3 axes** (endurance + impulsion + puissance) est-elle équilibrée ou faut-il pondérer différemment ?
3. **Les supersets** push/pull/functional sont-ils adaptés ou faut-il plus de circuits type EMOM/AMRAP ?

### Progressions
4. **Le cycle sandbag 4 semaines** (50-60-70-80% race weight) est-il trop rapide ?
5. **La rotation non-linéaire sled** (force + vitesse + lactate dans la même semaine) est-elle adaptée pour ce niveau ?
6. **La progression box work** est-elle trop conservatrice ou trop agressive ?

### Récupération
7. **Le deload sur signaux** vs mécanique — quelle approche recommandes-tu ?
8. **48-72h entre sled lourd** — est-ce suffisant ou trop conservateur ?
9. **Les safety rails IA** (volume +8%/sem, RPE consécutif, sommeil) sont-ils calibrés correctement ?

### Blessure
10. **Phase 0 de 2-3 semaines** — suffisante avant les supersets ?
11. **Sled push concentric-only pour Achille** — safe à réintroduire tôt ?
12. **Critère hop test** pour réintroduire les box jumps — pertinent ?

### Stations
13. **Les cues par station** — corrections ou ajouts ?
14. **Step-up > jump-up pour burpees** — pour tous les niveaux ?
15. **Sandbag lunges : "attaquer pas conserver"** — valide en retour de blessure aussi ?

### Programmation
16. **Max 2 sled/semaine** — faut-il être encore plus conservateur (1/semaine) au début ?
17. **Compromised workouts** — à partir de quelle semaine les introduire ?
18. **Simulations race complète** — combien en faire et à quelle fréquence ?

### Global
19. **Manque-t-il des exercices** critiques dans la base de 77 ?
20. **Quel serait TON plan de semaine idéal** pour ce profil (retour blessure, 4-5 jours dispo, objectif Hyrox 6 mois) ?

---

## 12. Sources utilisées

### Coachs et programmes
- **Rich Ryan / Compromised Running / RMR Training** — Modèle seuil, 3 piliers sled, force hybride
- **Jake Dearden / FSF** — AMRAPs, protocole deload pré-course
- **Pedro Tirado / Paradox** — Modèle hybride bodybuilding + conditioning
- **HWPO / Mat Fraser** — Programme Hyrox 8 semaines
- **TrainRox** — Framework périodisation

### Sources scientifiques
- Frontiers in Physiology 2025 — Réponses physiologiques aiguës en Hyrox
- PMC Scoping Review — High intensity functional training in hybrid competitions
- PMC/Springer — Autoregulation of load and volume

### Sources pratiques
- rb100.fitness — Periodisation, technique sled push, wall balls, farmers carry
- Hello Hyrox — Strength training guide
- Rox Lyfe — Interference effect, injury patterns, tapering
- HyroxDataLab — Sandbag lunges strategy, running structure
- PureGym — Station-specific guides
- Various physio sources — Lu Strength, Apex Sports, MovementX, Movement Lab

---

*Ce document a été préparé avec l'aide de Claude Opus (IA Anthropic) en compilant et synthétisant les méthodologies des coachs experts cités ci-dessus. Il ne remplace pas l'avis d'un professionnel qualifié.*
