# Document de reprise — nouvel ordinateur

> Écrit le 9 octobre 2026, après panne de l'ancien poste.
> **À donner à lire à Claude Code au premier lancement sur la nouvelle machine.**
> Couvre la session de travail du 14 au 23 septembre 2026 sur `Hyrox-project`.

---

## 0. Ce qui ne suit PAS la machine

La mémoire persistante de Claude est **locale** : `~/.claude/projects/-Users-benoit/memory/`
(un fichier `.md` par fait + un index `MEMORY.md`). Elle n'est **pas** dans Git et ne sera
**pas** sur le nouvel ordinateur.

- Si l'ancien disque est lisible → **copier tout le dossier `memory/`** vers le même chemin
  sur la nouvelle machine. C'est la solution propre (une soixantaine de fiches couvrant tous
  les projets : bordereaux, stock-analysis-platform, CFA, patrimoine, hippique…).
- Sinon → ce document reconstitue ce qui concerne le sport. Les autres projets devront être
  réexpliqués au fil de l'eau.

Les deux fiches mémoire concernées ici sont `project_hyrox_recovery.md` et
`project_natation_plan.md`. Leur contenu est repris ci-dessous.

---

## 1. Remise en route de la machine

```bash
# Outils
xcode-select --install                 # git
brew install gh                        # GitHub CLI (était dans ~/.local/bin sur l'ancien poste)
gh auth login

# Le repo
cd ~ && git clone https://github.com/Bencode92/Hyrox-project
cd Hyrox-project && git log --oneline -5   # doit afficher d25dde2 en tête
```

Aucune dépendance, aucun build : ce sont des fichiers statiques.
Site en ligne : **https://bencode92.github.io/Hyrox-project/muscu.html**
(GitHub Pages se redéploie automatiquement à chaque push sur `main`, ~1 min).

---

## 2. Le projet

Application web personnelle de suivi musculation + Hyrox + triathlon, 100 % statique,
sans framework, données en `localStorage` du navigateur.

| Fichier | Rôle |
|---|---|
| `muscu.html` | La page. Contient les modals (réglages ⚙️, détail du jour, objectifs 🎯). |
| `js/muscu-exercises.js` | Base d'exercices + **templates de programmes** + génération du plan hebdo. Le plus gros fichier, c'est là que vit le contenu sportif. |
| `js/muscu-app.js` | Rendu, tableau de bord, runner de séance, saisie. |
| `js/muscu-storage.js` | `localStorage`, PRs, **suggestion de charge** (`suggestNextLoad`). |
| `js/muscu-ai-coach.js` | Génération de plan par IA (optionnelle, via un Worker). |
| `PLAN_NATATION.md` | Le plan natation consolidé (référence). |

### Workflow obligatoire après toute édition JS

1. Bumper `TEMPLATES_VERSION` dans `js/muscu-exercises.js` si un template change
   → force la régénération des plans déjà enregistrés chez l'utilisateur.
2. **Bumper le `?v=N` sur les 5 références de `muscu.html`** (4 scripts + le CSS).
   ⚠️ **Piège vécu** : le 23/09, quatre commits JS d'affilée sont partis sans bump
   (les remplacements `sed`/python ne matchaient plus) → le navigateur a servi
   l'ancien JS. Corrigé par `d25dde2`. **Toujours vérifier avec `grep -n '?v=' muscu.html`
   après le bump.**
3. `git push origin main` → Pages se redéploie seul.
4. Vérifier : `curl -s https://bencode92.github.io/Hyrox-project/muscu.html | grep -o 'muscu-app.js?v=[0-9]*'`

**État actuel : `TEMPLATES_VERSION = 27`, cache-buster `?v=35`, HEAD = `d25dde2`.**

---

## 3. L'athlète — contexte indispensable

- **Douleur chronique pectoraux + haut du dos**, diagnostiquée **surcharge musculaire**
  (juillet 2026, confirmation clinique). Scénario favorable : le load management suffit.
- **Règle douleur J+1 ≤ 3/10** : c'est le garde-fou central de toute l'application.
  Si la douleur du lendemain dépasse 3/10, la charge baisse automatiquement de 5 %.
- Drapeaux rouges → retour clinicien : irradiation, engourdissement, douleur nocturne.
- Développé couché et front squat **légers** réintroduits le 27/07/2026 avec accord
  clinicien (RIR 3, jamais à l'échec). **Deadlift lourd reste exclu.**
- 5 séances de musculation par semaine. Court et fait du vélo en zone 2.
- Nage : tient **1 000 m** en continu (crawl + dos crawlé), **aucune technique**.

### Objectif — a changé en cours de session

- ❌ **Hyrox Paris décembre 2026 : ABANDONNÉ** (décidé le 14/09/2026).
- ✅ **Prochaine échéance ≈ juin 2027** — triathlon sprint ou Hyrox, *non tranché*,
  *date exacte inconnue*.
- Conséquence : **fenêtre muscle de septembre 2026 à ~février 2027**, puis bloc
  spécifique mars→mai (à construire en janvier, quand l'épreuve sera connue), taper en juin.

---

## 4. Travaux de la session — musculation

### 4.1 Trois bugs de progression corrigés (`7f79dfe`)

1. **La double progression n'existait pas.** Les reps cibles sont des fourchettes
   (`'8-12'`) et le code ne savait lire qu'un nombre → il ajoutait +2,5 kg à chaque
   séance dès que le RPE était ≤ 7. Maintenant `suggestNextLoad(id, reps, {deload})`
   parse les fourchettes :
   - toutes les séries au **haut** de fourchette → charge ↑ (+2,5 compound / +1,25 iso)
   - une série **sous** le bas → charge ↓
   - entre les deux → **même charge**, l'objectif est de gagner des reps
   - RPE ≥ 9,5 (échec) → même charge si la fourchette est atteinte, sinon ↓
   - douleur J+1 > 3/10 → −5 %, prioritaire sur tout le reste
2. **Le deload était écrasé** par la suggestion en séance. Désormais `{deload: true}`
   impose −40 % et court-circuite le reste.
3. **Le badge DELOAD** du tableau de bord utilisait `semaine % 4` alors que le plan
   déloade toutes les 6 semaines. `isDeloadWeek()` est maintenant la source unique
   (mod 6 pour les programmes maison, mod 4 pour les anciens templates à barre).

⚠️ **La double progression exige de saisir les reps réelles de chaque série.**
Sans ça, pas de progression correcte.

### 4.2 Programme par défaut basculé en « fenêtre muscle » (`4d7f9ec`)

`profile.goal` vaut maintenant **`'muscle'`** par défaut (migration one-shot depuis
`'hybrid'`, flag `profile.muscleWindow2026` ; un re-choix manuel est respecté).

| Jour | Contenu | Cardio |
|---|---|---|
| J1 | Pec + Triceps (bench léger, incliné haltères, pompes, câble bas) | rameur Z2 15-20 min |
| J2 | Dos + Biceps (tractions, seated row, lat pulldown, curls) | **vélo Z2 30-45 min = test dos** |
| J3 | Jambes + Épaules (front squat léger, leg press, hip thrust) | course Z2 20 min |
| J4 | **Piscine** | — |
| J5 | 2ᵉ dose Pec + Dos + délts | course Z2 20 min |

Pec ≈ 18-20 séries/semaine (point faible = priorité). Stations Hyrox retirées,
cardio en entretien. `goal='hybrid'` conserve l'ancienne semaine hybride Hyrox pour
le bloc spécifique du printemps.

### 4.3 Les phases sont calées sur la date de course

Nouveau réglage **`settings.raceDate`** (champ dans ⚙️, valeur par défaut `2027-06-15`).
`MuscuExercises.getPhaseForRace()` en déduit la phase affichée :
**> 16 sem** fenêtre muscle · **5-16** bloc spécifique · **2-4** pré-compétition · **≤ 1** taper.
Le tableau de bord affiche par exemple `Fenêtre muscle · J-36 sem`.

⚠️ **Limite connue** : les phases ne sont pour l'instant qu'un **libellé** ; elles ne
changent pas encore le contenu des séances de musculation (seule la piscine varie, cf. §5).
Le bloc spécifique Hyrox/tri reste à construire **en janvier**, quand l'épreuve sera choisie.
Le deload reste par ailleurs compté depuis la date de lancement du plan, pas depuis la course.

---

## 5. Travaux de la session — natation (le gros du travail)

### 5.1 Chronologie des décisions

1. Premier plan piscine en 4 phases, prescrit « à l'aveugle ».
2. **Retour de la 1ʳᵉ séance : échec.** Les 4×50 en respiration 3 temps bilatérale et
   les 6×100 n'ont pas pu être faits. Diagnostic : la bilatérale est un exercice de
   nageur confirmé, et 50/100 m sont trop longs pour tenir une consigne technique.
   Le cardio n'est pas le facteur limitant (il tient 1 000 m).
3. **Phase 1 scindée** en 1a Fondations (tout en 25 m) et 1b Technique.
4. « Je n'arrive pas à battre des jambes » → d'abord reframé en « les jambes ne servent
   qu'à 10 % »… **ce raisonnement était faux**, corrigé par l'expert (cf. ci-dessous).
5. **Brief envoyé à un expert nage**, réponses intégrées (`8d8996f`).
6. Un ami confirme le diagnostic général et **conteste l'utilité du tuba** → tuba
   abandonné (`0de0c4e`).

### 5.2 Verdict de l'expert (22/09/2026) — à connaître absolument

> « Le plan est globalement bon. Deux arbitrages à corriger — la dépriorisation des
> jambes, mal posée, et l'absence de chrono — et un risque qui passe sous le radar :
> le tuba face à l'antécédent haut du dos. »

| Sujet | Verdict |
|---|---|
| **Respiration 2 temps unilatérale** | **Gardée.** La bilatérale n'est pas un prérequis en eau libre. Ce qu'il faut, c'est l'*aptitude* des deux côtés → **alternance par longueur** (une à gauche, la suivante à droite), dès que les 6×25 passent. |
| **Jambes** ⚠️ *raisonnement faux* | L'enjeu n'est pas la propulsion mais la **TRAÎNÉE**. Un gabarit musclé coule des jambes, et des jambes qui coulent **doublent la résistance**. La combinaison masque ça en course, mais il s'entraîne 9 mois sans elle. → battement **léger à 2 temps**, **mobilité de cheville 3 min/jour à sec**, **pull buoy dosé** (≥ moitié des nages sans), **zéro série de jambes à la planche**. |
| **Métrique** ⚠️ *ajouté* | **Temps + coups de bras (SWOLF)**. Le comptage seul se triche en planant trop — défaut classique de l'autodidacte adulte. La pendule du bassin suffit. |
| **Tuba** ⚠️ *risque* | Bon levier en théorie, plafond 30-40 %. Mais : supprime la rotation (nage « à plat ») et surtout **nuque en extension → trapèzes**, exactement la zone douloureuse. |
| **Fréquence** | **2 × 30 min > 1 × 60 min** (pratique distribuée ; la technique d'un débutant se dégrade après 30 min). Transfert ressenti 4-6 semaines, mesurable 10-12. **~70 séances d'ici juin = nager 750 m détendu, pas vite** — et c'est le bon objectif. |
| **Critère de passage 1a → 1b** | Nécessaire mais pas suffisant. Ajouter : **coups de bras stables (écart ≤ 2 entre le 1ᵉʳ et le 6ᵉ 25 m) et effort ≤ 5/10.** « Sans arrêt » en se dégradant = faux positif. |
| **Angle mort** | Le facteur d'abandon en tri sprint est **la panique au départ** (froid, combinaison, contact), pas la technique → **3-4 sorties eau libre en combinaison avant juin + 1 simulation de départ en groupe**. |

### 5.3 Décision postérieure : le tuba est abandonné

Malgré l'avis favorable de l'expert, arbitrage pris le 23/09 après l'avis d'un ami,
pour trois raisons propres à ce cas :
1. Son facteur limitant **est** la respiration — le tuba supprime la compétence à acquérir.
2. Il charge nuque et trapèzes, sa zone douloureuse (risque signalé par l'expert lui-même).
3. Il tient déjà 1 000 m en continu : il n'a pas besoin du tuba pour faire du volume continu.

### 5.4 Les deux séances hebdomadaires

**Séance A — technique** = le J4 du programme, sur son propre jour. Version actuelle
(phase 1a Fondations, ~800 m, 30-35 min, effort 4/10) :

| Série | Contenu | Repos |
|---|---|---|
| 200 m | Échauffement libre, sans consigne | — |
| 6 × 5 s | Souffle au bord : visage dans l'eau, bulles en continu 5 s, inspirer 1 s, replonger | 20 s |
| 2 × 25 m | Battements **sur le côté** (palmes si besoin), depuis la hanche, chevilles relâchées. **Zéro série à la planche.** | 30 s |
| 2 × 25 m | Rattrapé, pull buoy OK | 30 s |
| 4 × 25 m | Un bras, bras libre tendu devant, alterné. **Entrée de main devant l'épaule, jamais croiser l'axe.** | 30 s |
| 6 × 25 m | Crawl, respiration tous les 2 mouvements, **sans aucun matériel** | 30 s |
| 3 × 50 m | Crawl facile, un focus. **≥ moitié sans pull buoy.** Noter **coups ET temps** sur 25 m | 45 s |
| 100 m | Dos crawlé souple | — |

**Séance B — nage longue et lente** (exercice `natation_continu`, ~700 m, 25-30 min) :
100 m souple → **300 m d'un seul bloc très lent** (pull buoy sur la 1ʳᵉ moitié seulement,
**+50 m par semaine**) → 4 × 50 sans aide (transfert) → 100 m dos.
*Si tu dois t'arrêter, c'est que tu vas trop vite, pas que tu manques de souffle.*

**Où caler la séance B** : sur un **jour de repos** de préférence, sinon **avant** J3 jambes.
**Jamais** les jours pec/épaules (J1, J5), jamais après J2 dos, et ne pas troquer le vélo Z2
de J2 (c'est le test dos pour la décision triathlon). Jamais A et B le même jour.

### 5.5 Les 5 phases piscine (automatiques via `resolveDay` + `settings.raceDate`)

| Phase | Déclencheur | Contenu | Volume |
|---|---|---|---|
| **1a Fondations** | > 34 sem | ci-dessus | ~800 m · 4/10 |
| **1b Technique** | 28-34 sem | même travail allongé à 50 et 100 m | ~1 500 m · 5/10 |
| **2 Aérobie** | 17-28 sem | 8×100 R20 ou 4×200 R30, vitesse 4×50 | ~1 700 m · 6/10 |
| **3 Spécifique** | 5-16 sem | 3×300 allure course, 200 m sighting, eau libre | ~1 900 m · 7/10 |
| **Taper** | ≤ 4 sem | 750 m chrono, 4×50 vite ; semaine de course 600 m facile | ~1 250 m |

Mécanique : un jour de template peut porter un tableau `variants` trié par
`minWeeksToRace` décroissant ; `resolveDay(day, ctx)` sert la première variante dont
`weeksToRace > minWeeksToRace`. Seul le J4 l'utilise aujourd'hui.

### 5.6 Règles dures épaule / dos en natation

- **Entrée de main devant l'épaule, main à plat** — ne jamais croiser l'axe du corps,
  pouce en premier (cause n° 1 de conflit sous-acromial).
- Douleur pendant le **retour aérien ou à l'entrée** → stop, bascule dos crawlé.
- Ne pas chercher le « coude haut » sous l'eau tant que la position n'est pas stable.
- **Jamais de natation le jour d'une séance pectoraux / épaules.**
- Pas de plaquettes. Pas de papillon. Règle J+1 ≤ 3/10 comme en musculation.

### 5.7 Matériel

| Quoi | Statut |
|---|---|
| **Pull kick Decathlon 900** | **Acheté.** Fait pull buoy + planche. À doser : ≥ moitié des 50 m sans. |
| **Chrono** | Pendule du bassin, rien à acheter. |
| **Palmes courtes** (~25-30 €) | **Optionnelles.** À n'acheter que si les battements sur le côté sont impossibles. La vraie solution est la mobilité de cheville à sec. |
| **Tuba frontal** | **Écarté** (cf. §5.3). |
| **Combinaison néoprène** | Phase 3 (printemps). Location possible. À tester en piscine avant l'eau libre. |
| ~~Plaquettes~~ | Jamais — chargent l'épaule. |

### 5.8 Bugs d'affichage corrigés le 23/09

- Le **deload s'appliquait à la piscine**, et `Math.max(2, sets-1)` transformait le
  1×100 m de récup en **2×100 m** (volume en hausse pendant un deload !).
  → deload désormais ignoré sur tout exercice `equipment === 'pool'`, et plus jamais
  de hausse de séries.
- Les **pastilles matériel se déclenchaient sur les mentions négatives** : « ZÉRO série
  à la planche » affichait 🏄 planche, « SANS pull buoy » affichait 🛟 pull buoy — soit
  l'inverse exact de la consigne. Détection restreinte aux prescriptions en MAJUSCULES.
- Bloc souffle affiché en « 5 m » au lieu de « 5 s ».
- Le tuba était prescrit **dans le bloc respiration** (avec un tuba on ne respire pas
  sur le côté : l'exercice s'annulait).

---

## 6. Les 18 commits de la session

```
d25dde2  Fix cache-buster bloque a v=30 depuis 4 commits JS
0de0c4e  Piscine : tuba abandonne (arbitrage athlete + avis d'un pair)
145b0b5  Piscine : tuba retiré du bloc respiration, déplacé sur la nage libre
b3e70aa  Piscine : 3 bugs vus en semaine de deload
383d908  Piscine : placement de la séance B corrigé
f4d8651  Doc : plan natation tri-sprint consolidé
8d8996f  Piscine : intégration de l'avis expert
3250040  Piscine : reframe jambes + palmes courtes
6990215  Piscine : séance B « continu » + explication A/B
cfccdaf  Piscine : phase 1 scindée en 1a / 1b
eb37b28  Piscine : matériel utile seulement + pastille par ligne
55d09d0  Piscine : matériel à prendre par phase
21abb99  Carte piscine : fiche de séance lisible
144bcc5  Carte piscine : sous-titre distance
09a0da9  Dashboard : carte 🏊 Plan piscine
46f1062  Plan piscine progressif + option post-muscu
4d7f9ec  Fenêtre muscle : nouveau défaut + phases calées sur la course
7f79dfe  Progression corrigée : double progression, deload, badge
```

---

## 7. Ce qui reste à faire

**Côté athlète**
1. Faire la séance A (phase 1a) et **noter coups de bras + temps** sur 25 m.
2. Mobilité de cheville en flexion plantaire, **3 min par jour, à sec**.
3. Caler la séance B sur un jour de repos.
4. Saisir **les reps réelles de chaque série** en musculation (sinon la double
   progression ne fonctionne pas) et **répondre à la question douleur J+1**.
5. Donner la **date exacte de l'épreuve** dès qu'elle est connue → champ ⚙️,
   toutes les phases se recalent dessus.
6. Dire **comment se sont passés le bench et le front squat** depuis fin juillet —
   cette information n'a jamais été recueillie.

**Côté code**
1. **Bloc spécifique + taper** : les phases ne changent pour l'instant que la piscine ;
   la musculation reste identique. À construire **en janvier**, quand l'épreuve sera choisie.
2. **Deload calé sur la course** plutôt que sur la date de lancement du plan.
3. Pas de palier de +1,25 kg possible sur les machines à plaques de 5 kg (arrondi manuel).
4. Le chemin de régénération « IA » du plan (`muscu-ai-coach.js`) n'a pas été audité :
   il pourrait renvoyer un plan sans le drapeau deload.

---

## 8. Préférences de travail à respecter

- **Vérifier avant de pousser** : prouver l'équivalence sur des données réelles avant
  tout push front, et ne pas revenir en arrière sur une causalité supposée.
- **Pas d'optimisation à la marge** quand les garde-fous sont au vert : statu quo >
  complexité.
- Dire franchement quand un raisonnement est faux, y compris le sien — c'est ce qui a
  fait progresser le plan natation deux fois (jambes, tuba).
- Les documents destinés à un expert doivent demander une **contradiction**, pas une
  validation polie.

---

**Brief natation envoyé à l'expert (avec ses réponses intégrées)** :
https://claude.ai/artifact/DjFwBzas2HDXRj23gVwvt2
