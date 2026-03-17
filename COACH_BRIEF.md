# HyroxForge — Brief Coach / Revue Technique

## Contexte

HyroxForge est une web app de coaching personnalisé pour la préparation Hyrox, avec IA intégrée (Claude API). L'app est accessible ici : **https://bencode92.github.io/Hyrox-project/**

Le code source complet est ici : **https://github.com/Bencode92/Hyrox-project**

---

## Ce que l'app fait

### 1. Tests initiaux → Calcul des zones

L'utilisateur entre ses performances actuelles :
- **Run** : vitesse max sur 1km (ex: 12 km/h) → assimilé à la VMA
- **Row** : temps sur 1000m (ex: 4:30)
- **SkiErg** : temps sur 1000m (ex: 4:30)

À partir de ces données, le moteur calcule automatiquement toutes les zones d'entraînement.

### 2. Zones d'entraînement Run (basées sur la VMA)

| Zone | % VMA | Exemple pour VMA 12 km/h | Pace |
|------|-------|--------------------------|------|
| Zone 2 (endurance) | 65-75% | 7.8 - 9.0 km/h | 6:40 - 7:41/km |
| Tempo | 80-85% | 9.6 - 10.2 km/h | 5:53 - 6:15/km |
| Seuil | 85-90% | 10.2 - 10.8 km/h | 5:33 - 5:53/km |
| Fractionné long | 90-95% | 10.8 - 11.4 km/h | 5:16 - 5:33/km |
| Fractionné court | 95-105% | 11.4 - 12.6 km/h | 4:46 - 5:16/km |

### 3. Zones Row / SkiErg (basées sur le test 1000m)

| Zone | % du pace test | Description |
|------|---------------|-------------|
| Technique | 120% du pace | Cadence basse, focus forme |
| Endurance | 112% du pace | Régulier, soutenable |
| Puissance | 102% du pace | Quasi max, reps courts |

### 4. Types de séances générées

**Run :**
- **Zone 2** : durée progressive (35-60 min), vitesse Z2, "pouvoir parler en phrases complètes"
- **Tempo** : 3 × 6-10 min à allure tempo, récup 3 min trot
- **Fractionné court** : 6-12 × 400m à 95-105% VMA, récup 75-90s
- **Fractionné long** : 3-6 × 1000m à 90-95% VMA, récup 2 min
- **Sortie longue** : 50-80 min Z2 avec finish en tempo

**Row / SkiErg :**
- **Technique** : 4 × 500m cadence basse (22-24 cps/min row, 28-30 ski), récup 90s
- **Endurance** : 3-5 × 1000m à 112% pace test, récup 90s
- **Puissance** : 6-10 × 250m quasi max, récup 2 min

### 5. Logique de progression

- **+2% de vitesse** toutes les 3 semaines
- **+1 rep** toutes les 2 semaines sur le fractionné
- **Périodisation 3+1** : 3 semaines de charge, 1 semaine de décharge (-30% volume)
- Durée des sorties longues : +3 min/semaine (plafond 80 min)

### 6. Règles de sécurité (tendon d'Achille)

- Si douleur > 3/10 → réduire volume 50%, pas de course
- Si douleur 1-3/10 → pas d'augmentation de charge
- Gilet lesté INTERDIT si : score run < 60/100, fractionné, séance > 45 min, douleur > 2/10
- Gilet lesté autorisé : Z2 uniquement, 3-5 kg pour commencer, +1 kg / 2 semaines, max 10 kg

### 7. Scoring /100

| Pilier | Poids | 100 pts | 70 pts | 50 pts |
|--------|-------|---------|--------|--------|
| Run | 50% | 3:32/km (17 km/h) | 5:00/km (12 km/h) | 6:00/km (10 km/h) |
| Row | 25% | 3:10/1000m | 3:50/1000m | 4:30/1000m |
| SkiErg | 25% | 3:20/1000m | 4:00/1000m | 4:30/1000m |

Bonus : +3 pts régularité (3+ séances/sem pendant 4 sem), +2 pts progression, -5 pts surcharge (RPE > 9 × 3 séances)

---

## Profil de l'athlète

- **Niveau actuel** : ~12 km/h au run, Row 1000m en ~5:22, SkiErg 1000m en ~4:19
- **Objectif** : Hyrox dans 6 mois, cible 15 km/h au 10km (ambitieux)
- **Blessure** : tendon d'Achille en guérison
- **Disponibilité** : 5-6 séances/semaine + 1 séance course pure
- **Équipement** : salle équipée Hyrox (rower, skierg, sled)
- **Gilet lesté** : à intégrer progressivement

## Résultats Hyrox précédent

| Épreuve | Temps | Classement |
|---------|-------|------------|
| Run 1 | 7:17 | top 94.5% |
| Run 2-8 (moy) | 5:17/km | top 35-40% |
| SkiErg 1000m | 4:19 | top 71.5% |
| Row 1000m | 5:22 | top 95.7% |
| Sled Pull 50m | 5:50 | top 95.0% |
| Sled Push 50m | 2:32 | top 88.3% |
| Burpee BJ 80m | 3:54 | top 75.1% |
| Farmers Carry 200m | 1:59 | top 86.5% |
| Sandbag Lunges 100m | 3:18 | top 30.3% ✅ |
| Wall Balls | 5:10 | top 77.6% |

**Points faibles majeurs** : Row (bottom 5%), Sled Pull (bottom 5%), Run 1 (partie trop vite ou cheville)
**Point fort** : Lunges (top 30%)

---

## Questions pour le coach

1. **Les zones calculées** (VMA = vitesse 1km) sont-elles cohérentes avec ta méthode ? Faut-il ajuster les pourcentages ?

2. **La progression (+2%/3 semaines)** est-elle trop agressive ou trop conservative pour ce profil ?

3. **Les séances Row/Ski** — les ratios de pace (120% pour technique, 112% pour endurance, 102% pour puissance) sont-ils bons ?

4. **Le gilet lesté** — la règle "pas avant score 60, uniquement Z2, max 10kg" est-elle correcte ?

5. **La périodisation 3+1** — est-ce adapté pour un objectif à 6 mois avec une blessure au tendon ?

6. **Les récupérations** entre séries sont-elles bien calibrées ? (90s pour fractionné court 400m, 2 min pour fractionné long 1000m, 3 min pour tempo)

7. **Manque-t-il des types de séances ?** (ex: côtes, fartlek, séance spécifique Hyrox avec enchaînement station+run)

8. **Le barème de scoring** — les repères 100/70/50 pts sont-ils réalistes pour le niveau visé ?

---

## Architecture technique (pour info)

```
Hyrox-project/
├── index.html          → App principale (SPA, 4 onglets)
├── css/style.css       → Thème dark bleu électrique
├── js/
│   ├── storage.js      → LocalStorage (séances, scores, settings)
│   ├── scoring.js      → Algorithme de score /100
│   ├── training.js     → Moteur de zones + génération de séances
│   ├── ai-coach.js     → Intégration Claude API (Cloudflare Worker)
│   ├── charts.js       → Graphiques Chart.js
│   └── app.js          → Contrôleur principal + formulaire
└── README.md
```

- **Frontend** : HTML/CSS/JS vanilla, Chart.js, Google Fonts
- **IA** : Claude Sonnet via Cloudflare Worker (proxy API)
- **Données** : LocalStorage (persiste dans le navigateur)
- **Hébergement** : GitHub Pages (gratuit)
