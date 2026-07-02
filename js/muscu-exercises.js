/* ============================================================
   MUSCU-EXERCISES  —  Exercise DB + Program Generation
   Focused on Hyrox-relevant strength training
   ============================================================ */

const MuscuExercises = (() => {

  // ── Exercise Database with video tutorials & technique cues ─
  const DB = [
    // ─── LOWER BODY ─────────────────────────────────────────
    { id: 'back_squat', name: 'Back Squat', category: 'lower', subcategory: 'quad', equipment: 'barbell',
      hyrox: ['sled_push','wall_balls','lunges'], primary: ['quadriceps','fessiers'], secondary: ['ischio-jambiers','core'],
      videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
      cues: ['Pieds largeur d\'épaules, pointes légèrement vers l\'extérieur', 'Barre sur les trapèzes (pas le cou)', 'Descendre en cassant hanches ET genoux simultanément', 'Genoux dans l\'axe des pieds, ne pas rentrer', 'Descendre au moins à la parallèle (cuisse // sol)', 'Pousser le sol avec les talons en remontant', 'Garder la poitrine haute, regard droit devant'],
      mistakes: ['Genoux qui rentrent vers l\'intérieur', 'Dos qui arrondit (butt wink)', 'Talons qui décollent', 'Descente incomplète (half-squat)'] },

    { id: 'front_squat', name: 'Front Squat', category: 'lower', subcategory: 'quad', equipment: 'barbell',
      hyrox: ['wall_balls','sled_push'], primary: ['quadriceps','core'], secondary: ['fessiers'],
      videoUrl: 'https://www.youtube.com/watch?v=m4ytaCJZpl0',
      cues: ['Prise clean : coudes hauts, barre sur les deltoïdes antérieurs', 'Torse le plus vertical possible', 'Descente profonde, genoux en avant OK', 'Core très engagé pour ne pas s\'effondrer', 'Idéal pour transférer vers les wall balls Hyrox'],
      mistakes: ['Coudes qui tombent (barre roule)', 'Dos qui arrondit', 'Pas assez de mobilité chevilles'] },

    { id: 'goblet_squat', name: 'Goblet Squat', category: 'lower', subcategory: 'quad', equipment: 'kettlebell',
      hyrox: ['wall_balls'], primary: ['quadriceps','fessiers'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
      cues: ['Tenir le KB contre la poitrine, coudes vers le bas', 'Pieds un peu plus larges que les épaules', 'Descendre profond entre les jambes', 'Excellent exercice d\'apprentissage du squat', 'Garder le poids contre le torse pendant tout le mouvement'],
      mistakes: ['KB trop loin du corps', 'Dos arrondi', 'Genoux qui rentrent'] },

    { id: 'leg_press', name: 'Leg Press', category: 'lower', subcategory: 'quad', equipment: 'machine',
      hyrox: ['sled_push'], primary: ['quadriceps','fessiers'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
      cues: ['Pieds au milieu de la plateforme, largeur épaules', 'Dos bien plaqué contre le dossier', 'Descendre jusqu\'à 90° minimum aux genoux', 'Ne pas verrouiller les genoux en haut', 'Simule le mouvement de poussée du sled Hyrox'],
      mistakes: ['Bassin qui décolle du siège', 'Genoux verrouillés en extension', 'Pieds trop bas (stress rotulien)'] },

    { id: 'deadlift', name: 'Deadlift', category: 'lower', subcategory: 'hip', equipment: 'barbell',
      hyrox: ['sled_pull','farmers_carry'], primary: ['ischio-jambiers','fessiers','dos'], secondary: ['core','avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
      cues: ['Barre au-dessus du milieu du pied', 'Pieds largeur de hanches', 'Agripper la barre juste en dehors des genoux', 'Dos droit/neutre : imaginer un manche à balai le long de la colonne', 'Tirer en poussant le sol, pas en tirant avec le dos', 'Verrouiller hanches et genoux en haut', 'Mouvement inverse pour reposer (hinge d\'abord)'],
      mistakes: ['Dos arrondi (très dangereux en charge lourde)', 'Barre trop loin du corps', 'Tirer avec les bras', 'Hyperextension du dos en haut'] },

    { id: 'rdl', name: 'Romanian Deadlift (RDL)', category: 'lower', subcategory: 'hip', equipment: 'barbell',
      hyrox: ['sled_pull'], primary: ['ischio-jambiers','fessiers'], secondary: ['dos','core'],
      videoUrl: 'https://www.youtube.com/watch?v=7j-2w4-P14I',
      cues: ['Départ debout, barre dans les mains', 'Pousser les hanches EN ARRIÈRE (hip hinge)', 'Légère flexion des genoux (pas un squat)', 'Barre glisse le long des cuisses', 'Descendre jusqu\'à sentir l\'étirement des ischios', 'Serrer les fessiers pour remonter', 'Excellent pour la force de tirage Hyrox'],
      mistakes: ['Arrondir le dos', 'Trop plier les genoux', 'Barre qui s\'éloigne des jambes'] },

    { id: 'hip_thrust', name: 'Hip Thrust', category: 'lower', subcategory: 'hip', equipment: 'barbell',
      hyrox: ['sled_push','burpees'], primary: ['fessiers'], secondary: ['ischio-jambiers','core'],
      videoUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
      cues: ['Dos appuyé contre un banc à hauteur des omoplates', 'Pieds au sol, genoux à 90° en haut du mouvement', 'Barre sur le pli des hanches (utiliser un pad)', 'Pousser les hanches vers le plafond', 'Serrer fort les fessiers en haut (2s)', 'Menton rentré, ne pas cambrer le dos'],
      mistakes: ['Hyperextension du dos en haut', 'Pieds trop proches ou trop loin', 'Ne pas monter assez haut'] },

    { id: 'bulgarian_split', name: 'Bulgarian Split Squat', category: 'lower', subcategory: 'quad', equipment: 'dumbbells',
      hyrox: ['lunges','sled_push'], primary: ['quadriceps','fessiers'], secondary: ['core','stabilisateurs'],
      videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
      cues: ['Pied arrière sur un banc, lacets vers le bas', 'Pied avant suffisamment loin du banc', 'Descendre le genou arrière vers le sol', 'Torse droit, légère inclinaison avant OK', 'Pousser avec le talon du pied avant', 'Directement applicable aux lunges Hyrox'],
      mistakes: ['Pied avant trop près du banc', 'Genou avant qui dépasse trop les orteils', 'Torse qui penche trop'] },

    { id: 'walking_lunge', name: 'Walking Lunges', category: 'lower', subcategory: 'quad', equipment: 'dumbbells',
      hyrox: ['lunges'], primary: ['quadriceps','fessiers'], secondary: ['ischio-jambiers','core'],
      videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
      cues: ['Grand pas en avant, genou arrière frôle le sol', 'Torse droit, core engagé', 'Genou avant au-dessus de la cheville', 'Pousser avec le talon pour avancer', 'Directement transférable aux 200m lunges Hyrox', 'Pratiquer avec poids pour simuler le sandbag'],
      mistakes: ['Pas trop courts', 'Genou qui rentre', 'Torse qui penche', 'Manque d\'équilibre (renforcer le core)'] },

    { id: 'step_up', name: 'Step-ups', category: 'lower', subcategory: 'quad', equipment: 'dumbbells',
      hyrox: ['lunges','sled_push'], primary: ['quadriceps','fessiers'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=dQqApCGd5Cw',
      cues: ['Hauteur du banc : cuisse parallèle au sol quand pied posé', 'Monter en poussant avec le pied sur le banc (pas d\'élan)', 'Contrôler la descente', 'Alterner les jambes ou faire une série par jambe'],
      mistakes: ['Se pousser avec le pied au sol', 'Banc trop haut', 'Descente non contrôlée'] },

    { id: 'calf_raise', name: 'Calf Raises', category: 'lower', subcategory: 'calves', equipment: 'machine',
      hyrox: ['sled_push','course'], primary: ['mollets'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
      cues: ['Monter sur la pointe des pieds au maximum', 'Pause 2s en haut pour la contraction', 'Descente lente et contrôlée', 'Étirer en bas (talon sous le step)', 'Important pour la propulsion en course'],
      mistakes: ['Mouvement trop rapide', 'Amplitude incomplète', 'Genoux pliés'] },

    { id: 'leg_curl', name: 'Leg Curl', category: 'lower', subcategory: 'hip', equipment: 'machine',
      hyrox: ['course'], primary: ['ischio-jambiers'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
      cues: ['Pad sur les chevilles (pas les mollets)', 'Contracter les ischios pour plier', 'Pause en haut, descente lente (3s)', 'Ne pas soulever les hanches du banc'],
      mistakes: ['Mouvement explosif sans contrôle', 'Hanches qui se soulèvent', 'Amplitude incomplète'] },

    { id: 'leg_extension', name: 'Leg Extension', category: 'lower', subcategory: 'quad', equipment: 'machine',
      hyrox: ['sled_push'], primary: ['quadriceps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
      cues: ['Pad sur les chevilles', 'Extension complète (sans verrouiller)', 'Pause 1s en haut', 'Descente contrôlée (3s)', 'Dos bien plaqué contre le dossier'],
      mistakes: ['Mouvement balistique', 'Charge trop lourde', 'Utiliser l\'élan du corps'] },

    // ─── UPPER PUSH ─────────────────────────────────────────
    { id: 'bench_press', name: 'Bench Press', category: 'upper_push', subcategory: 'chest', equipment: 'barbell',
      hyrox: ['burpees','sled_push'], primary: ['pectoraux','triceps'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      cues: ['Omoplates serrées et tirées vers le bas', 'Légère cambrure naturelle du dos', 'Pieds au sol, stables', 'Barre descend au niveau des mamelons', 'Bras à ~75° du corps (pas 90°)', 'Pousser en arc léger vers le visage', 'Expirer en poussant'],
      mistakes: ['Omoplates non rétractées', 'Rebond sur la poitrine', 'Fesses qui décollent du banc', 'Bras trop écartés (stress épaule)'] },

    { id: 'incline_db_press', name: 'Incline DB Press', category: 'upper_push', subcategory: 'chest', equipment: 'dumbbells',
      hyrox: ['burpees'], primary: ['pectoraux','épaules'], secondary: ['triceps'],
      videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
      cues: ['Banc incliné à 30-45°', 'DB au niveau des épaules en bas', 'Pousser en rapprochant légèrement les DB en haut', 'Omoplates serrées comme au bench', 'Contrôler la descente (2-3s)'],
      mistakes: ['Inclinaison trop haute (devient un OHP)', 'DB qui claquent en haut', 'Coudes trop bas'] },

    { id: 'ohp', name: 'Overhead Press', category: 'upper_push', subcategory: 'shoulder', equipment: 'barbell',
      hyrox: ['wall_balls'], primary: ['épaules','triceps'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
      cues: ['Barre sur les clavicules/deltoïdes', 'Pieds largeur de hanches, fessiers et core serrés', 'Pousser la barre verticalement (légèrement en arrière de la tête)', 'Tête passe "à travers" une fois la barre au-dessus', 'Verrouiller les coudes en haut', 'Directement transférable aux wall balls Hyrox'],
      mistakes: ['Cambrure excessive du dos', 'Pousser la barre en avant', 'Ne pas engager le core'] },

    { id: 'db_ohp', name: 'DB Overhead Press', category: 'upper_push', subcategory: 'shoulder', equipment: 'dumbbells',
      hyrox: ['wall_balls'], primary: ['épaules','triceps'], secondary: ['core','stabilisateurs'],
      videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
      cues: ['DB à hauteur d\'oreilles, coudes à 90°', 'Pousser verticalement', 'Rotation naturelle en haut', 'Plus de travail de stabilisation que la barre'],
      mistakes: ['Cambrure du dos', 'Coudes trop en arrière', 'Charge asymétrique'] },

    { id: 'dips', name: 'Dips', category: 'upper_push', subcategory: 'chest', equipment: 'bodyweight',
      hyrox: ['burpees','sled_push'], primary: ['pectoraux','triceps'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
      cues: ['Mains sur les barres, bras tendus en haut', 'Légère inclinaison avant (pecs) ou droit (triceps)', 'Descendre jusqu\'à 90° aux coudes', 'Coudes proches du corps', 'Pousser fort pour remonter', 'Ajouter du poids quand >15 reps facile'],
      mistakes: ['Descendre trop bas (stress épaule)', 'Épaules qui montent vers les oreilles', 'Mouvement de balancier'] },

    { id: 'push_ups', name: 'Push-ups', category: 'upper_push', subcategory: 'chest', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['pectoraux','triceps'], secondary: ['épaules','core'],
      videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
      cues: ['Corps en planche : tête-épaules-hanches-chevilles alignés', 'Mains sous les épaules ou légèrement plus large', 'Descendre poitrine au sol', 'Coudes à 45° (pas perpendiculaires)', 'Mouvement de base des burpees Hyrox'],
      mistakes: ['Hanches qui s\'affaissent', 'Mouvement partiel', 'Coudes trop écartés'] },

    { id: 'lateral_raise', name: 'Lateral Raises', category: 'upper_push', subcategory: 'shoulder', equipment: 'dumbbells',
      hyrox: ['farmers_carry'], primary: ['épaules'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
      cues: ['Debout, légère inclinaison avant', 'Lever les bras sur les côtés jusqu\'à hauteur d\'épaules', 'Légère rotation : petit doigt légèrement plus haut', 'Contrôler la descente', 'Charges légères, volume élevé'],
      mistakes: ['Trop de charge (élan du corps)', 'Lever au-dessus des épaules', 'Shrugs involontaires'] },

    { id: 'tricep_pushdown', name: 'Tricep Pushdown', category: 'upper_push', subcategory: 'arms', equipment: 'cable',
      hyrox: ['burpees','sled_push'], primary: ['triceps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
      cues: ['Coudes collés au corps', 'Pousser vers le bas jusqu\'à extension complète', 'Contrôler la remontée', 'Ne bouger que les avant-bras'],
      mistakes: ['Coudes qui bougent', 'Pencher le torse en avant', 'Charge trop lourde'] },

    // ── Pecs bas / chest lower-focus (expert priority) ─────────
    { id: 'decline_bench', name: 'Decline Bench Press', category: 'upper_push', subcategory: 'chest', equipment: 'barbell',
      hyrox: ['burpees','sled_push'], primary: ['pectoraux (bas)','triceps'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=LfyQBUKR8SE',
      cues: ['Banc décliné 15-30°', 'Barre descend vers le bas de la poitrine', 'Omoplates serrées comme au bench plat', 'Coudes ~45° du corps', 'Cible PRIORITAIREMENT le bas du pec'],
      mistakes: ['Inclinaison trop forte (perte d\'amplitude)', 'Coudes qui s\'écartent à 90°', 'Pousser depuis les pieds'] },

    { id: 'decline_db_press', name: 'Decline DB Press', category: 'upper_push', subcategory: 'chest', equipment: 'dumbbells',
      hyrox: ['burpees'], primary: ['pectoraux (bas)','triceps'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=LlPDPyiOZqI',
      cues: ['Banc décliné 15-30°', 'DB descendent au niveau des pecs bas', 'Rapprocher légèrement les DB en haut (squeeze)', 'Excellent volume bas du pec sans barre'],
      mistakes: ['Coudes trop bas', 'DB qui claquent', 'Amplitude raccourcie'] },

    { id: 'weighted_dips', name: 'Dips Pondérées (Pecs)', category: 'upper_push', subcategory: 'chest', equipment: 'dip_belt',
      hyrox: ['burpees','sled_push'], primary: ['pectoraux (bas)','triceps'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=l41SoWZiowI',
      cues: ['Ceinture lestée 5-30 kg', 'PENCHER LE TORSE EN AVANT 20-30° → cible pec bas', 'Coudes ~45°, descendre jusqu\'à 90°', 'Pousser fort, squeeze des pecs en haut', 'Le compound roi du bas du pec avec contrôle de charge'],
      mistakes: ['Torse droit (devient triceps)', 'Descendre trop bas (stress épaule)', 'Charge avant maîtrise du BW'] },

    { id: 'cable_crossover_high', name: 'Cable Crossover Haut→Bas', category: 'upper_push', subcategory: 'chest', equipment: 'cable',
      hyrox: [], primary: ['pectoraux (bas)'], secondary: ['épaules antérieures'],
      videoUrl: 'https://www.youtube.com/watch?v=taI4XduLpTk',
      cues: ['Poulies en HAUT, prise neutre', 'Légère inclinaison du torse vers l\'avant', 'Tirer les poignées vers le bas et vers le centre (croiser au niveau des cuisses)', 'Squeeze 2s en bas', 'ISOLATION pure du bas du pec — finisher idéal'],
      mistakes: ['Poulies au milieu (perte du ciblage bas)', 'Bras pliés', 'Mouvement balistique'] },

    { id: 'incline_bench', name: 'Incline Bench Press', category: 'upper_push', subcategory: 'chest', equipment: 'barbell',
      hyrox: ['burpees','sled_push'], primary: ['pectoraux (haut)','épaules','triceps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=jPLdzuHckI8',
      cues: ['Banc incliné 30-45°', 'Barre descend en haut de la poitrine (clavicules)', 'Omoplates serrées comme au bench plat', 'Compound pour haut du pec — équilibre la balance avec le décliné'],
      mistakes: ['Inclinaison trop haute (devient OHP)', 'Pieds qui dérapent', 'Rebond sur la poitrine'] },

    // ─── UPPER PULL ─────────────────────────────────────────
    { id: 'barbell_row', name: 'Barbell Row', category: 'upper_pull', subcategory: 'back', equipment: 'barbell',
      hyrox: ['sled_pull','rowing'], primary: ['dos','biceps'], secondary: ['core','avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
      cues: ['Penché à ~45°, dos droit/neutre', 'Tirer la barre vers le nombril', 'Serrer les omoplates en haut (2s)', 'Contrôler la descente', 'Core engagé, pas de balancier', 'Mouvement clé pour le sled pull Hyrox'],
      mistakes: ['Dos arrondi', 'Tricher avec l\'élan', 'Tirer vers la poitrine au lieu du ventre'] },

    { id: 'pull_ups', name: 'Pull-ups', category: 'upper_pull', subcategory: 'back', equipment: 'bodyweight',
      hyrox: ['sled_pull','skierg'], primary: ['dos','biceps'], secondary: ['core','avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
      cues: ['Prise pronation (paumes vers l\'avant), largeur épaules+', 'Initier en tirant les omoplates vers le bas', 'Menton au-dessus de la barre', 'Descente contrôlée (pas se laisser tomber)', 'Si impossible : commencer par les négatifs (descente lente)', 'Ajouter du poids quand >12 reps'],
      mistakes: ['Kipping (élan des hanches)', 'Amplitude incomplète', 'Ne pas descendre bras tendus'] },

    { id: 'weighted_chin_up', name: 'Chin-Up Pondérée', category: 'upper_pull', subcategory: 'back', equipment: 'dip_belt',
      hyrox: ['sled_pull'], primary: ['dos','biceps'], secondary: ['avant-bras','core'],
      videoUrl: 'https://www.youtube.com/watch?v=brhRXlOhsAM',
      cues: ['Prise supination (paumes vers soi), largeur épaules', 'Ceinture lestée 5-25 kg', 'Menton au-dessus de la barre, contrôle complet', 'Plus de biceps que pull-up classique', 'Compound clé pour la force de tirage Hyrox lourde'],
      mistakes: ['Kipping', 'Amplitude incomplète', 'Charge avant maîtrise du BW à 10 reps'] },

    { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'upper_pull', subcategory: 'back', equipment: 'machine',
      hyrox: ['sled_pull','skierg'], primary: ['dos','biceps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
      cues: ['Prise large, légèrement incliné en arrière', 'Tirer vers le haut de la poitrine', 'Serrer les omoplates en bas du mouvement', 'Alternative/complément aux pull-ups', 'Simule le mouvement du SkiErg'],
      mistakes: ['Tirer derrière la nuque', 'Se pencher trop en arrière', 'Utiliser les biceps en premier'] },

    { id: 'seated_row', name: 'Seated Cable Row', category: 'upper_pull', subcategory: 'back', equipment: 'machine',
      hyrox: ['sled_pull','rowing'], primary: ['dos','biceps'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
      cues: ['Dos droit, poitrine sortie', 'Tirer vers le ventre', 'Serrer les omoplates (2s)', 'Ne pas balancer le torse', 'Simule le mouvement du rameur Hyrox'],
      mistakes: ['Trop de mouvement du torse', 'Arrondir le dos', 'Ne pas serrer les omoplates'] },

    { id: 'db_row', name: 'Dumbbell Row', category: 'upper_pull', subcategory: 'back', equipment: 'dumbbells',
      hyrox: ['sled_pull'], primary: ['dos','biceps'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
      cues: ['Un genou et une main sur le banc', 'Dos plat, parallèle au sol', 'Tirer le DB vers la hanche', 'Coude proche du corps', 'Rotation minimale du torse'],
      mistakes: ['Rotation du torse', 'Tirer vers l\'épaule', 'Dos arrondi'] },

    { id: 'face_pull', name: 'Face Pulls', category: 'upper_pull', subcategory: 'back', equipment: 'cable',
      hyrox: ['posture'], primary: ['deltoïdes post.','trapèzes'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
      cues: ['Câble à hauteur de visage', 'Tirer vers le visage en ouvrant les coudes', 'Rotation externe des épaules en fin de mouvement', 'Serrer les omoplates', 'Essentiel pour la santé des épaules (prévention)'],
      mistakes: ['Charge trop lourde', 'Pas de rotation externe', 'Tirer trop bas'] },

    { id: 'bicep_curl', name: 'Bicep Curl', category: 'upper_pull', subcategory: 'arms', equipment: 'dumbbells',
      hyrox: ['sled_pull','farmers_carry'], primary: ['biceps'], secondary: ['avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
      cues: ['Coudes fixes le long du corps', 'Monter en supination complète', 'Contrôler la descente (3s)', 'Ne pas balancer le corps'],
      mistakes: ['Élan du corps (cheat curl)', 'Coudes qui avancent', 'Descente trop rapide'] },

    { id: 'hammer_curl', name: 'Hammer Curl', category: 'upper_pull', subcategory: 'arms', equipment: 'dumbbells',
      hyrox: ['farmers_carry','sled_pull'], primary: ['biceps','brachioradial'], secondary: ['avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
      cues: ['Prise neutre (paumes face à face)', 'Coudes fixes', 'Travaille le brachioradial (grip Hyrox)', 'Excellent pour la force de préhension'],
      mistakes: ['Élan du corps', 'Coudes qui bougent'] },

    // ─── CORE ───────────────────────────────────────────────
    { id: 'plank', name: 'Plank', category: 'core', subcategory: 'stability', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['core'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      cues: ['Corps en ligne droite : tête-épaules-hanches-chevilles', 'Coudes sous les épaules', 'Serrer fessiers et abdos', 'Ne pas bloquer la respiration', 'Progresser : ajouter du poids sur le dos'],
      mistakes: ['Hanches trop hautes ou trop basses', 'Tête qui tombe', 'Oublier de respirer'] },

    { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', category: 'core', subcategory: 'abs', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['abdominaux'], secondary: ['fléchisseurs hanches'],
      videoUrl: 'https://www.youtube.com/watch?v=hdng3Nm1x_E',
      cues: ['Suspendu à une barre, bras tendus', 'Lever les jambes tendues jusqu\'à la parallèle (ou plus haut)', 'Rouler le bassin en haut du mouvement', 'Descente contrôlée, pas de balancier', 'Variante facile : genoux pliés'],
      mistakes: ['Balancier du corps', 'Ne lever que les genoux sans rouler le bassin', 'Mouvement rapide sans contrôle'] },

    { id: 'ab_wheel', name: 'Ab Wheel Rollout', category: 'core', subcategory: 'abs', equipment: 'ab_wheel',
      hyrox: ['all'], primary: ['abdominaux','core'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=uYBOBBv9GzY',
      cues: ['Genoux au sol pour commencer', 'Rouler en avant lentement en gardant le core SERRÉ', 'Ne PAS cambrer le dos', 'Revenir en contractant les abdos', 'Avancé : depuis debout'],
      mistakes: ['Dos qui cambre (dangereux)', 'Aller trop loin sans contrôle', 'Hanches qui tombent'] },

    { id: 'pallof_press', name: 'Pallof Press', category: 'core', subcategory: 'stability', equipment: 'cable',
      hyrox: ['all'], primary: ['core','obliques'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=AH_QZLm_0-s',
      cues: ['Cable à hauteur de poitrine, perpendiculaire au corps', 'Pousser les mains en avant (le câble tire sur le côté)', 'Résister à la rotation : c\'est le but', 'Tenir 2-3s bras tendus', 'Excellent pour la stabilité en course/portage'],
      mistakes: ['Tourner le torse', 'Ne pas assez résister', 'Charge trop légère'] },

    { id: 'russian_twist', name: 'Russian Twists', category: 'core', subcategory: 'rotation', equipment: 'bodyweight',
      hyrox: ['rowing','skierg'], primary: ['obliques'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
      cues: ['Assis, pieds décollés du sol (ou au sol pour faciliter)', 'Penché en arrière à ~45°', 'Tourner le torse de chaque côté avec un poids', 'Mouvement contrôlé, pas rapide'],
      mistakes: ['Ne bouger que les bras sans tourner le torse', 'Mouvement trop rapide', 'Pieds qui bougent'] },

    { id: 'dead_bug', name: 'Dead Bug', category: 'core', subcategory: 'stability', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['core'], secondary: ['stabilisateurs'],
      videoUrl: 'https://www.youtube.com/watch?v=jtsxFOMLAMo',
      cues: ['Sur le dos, bras vers le plafond, genoux à 90°', 'Abaisser un bras ET la jambe opposée simultanément', 'Le DOS RESTE PLAQUÉ au sol (pas de cambrure)', 'Mouvement lent et contrôlé', 'Excellent pour la rééducation et la stabilisation'],
      mistakes: ['Dos qui cambre', 'Mouvement trop rapide', 'Oublier de respirer'] },

    { id: 'side_plank', name: 'Side Plank', category: 'core', subcategory: 'stability', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['obliques','core'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=K2VljzCC16g',
      cues: ['Sur le coude, corps en ligne droite', 'Hanches hautes, ne pas s\'affaisser', 'Serrer les fessiers et les obliques', 'Tenir 30-45s par côté', 'Variante : lever la jambe du haut'],
      mistakes: ['Hanches qui tombent', 'Corps pas aligné', 'Respiration bloquée'] },

    { id: 'v_up', name: 'V-Ups', category: 'core', subcategory: 'abs', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['abdominaux'], secondary: ['fléchisseurs hanches'],
      videoUrl: 'https://www.youtube.com/watch?v=iP2fjvG0g3w',
      cues: ['Allongé sur le dos, bras tendus derrière la tête', 'Lever simultanément jambes et torse en forme de V', 'Toucher les pieds avec les mains', 'Contrôler la descente, pas se laisser tomber', 'Excellent transfert vers les sit-ups Hyrox'],
      mistakes: ['Mouvement balistique', 'Pieds qui plient', 'Tirer avec le cou'] },

    { id: 'hollow_hold', name: 'Hollow Body Hold', category: 'core', subcategory: 'stability', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['abdominaux','core'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=LlDNef_Ztsc',
      cues: ['Allongé, bas du dos PLAQUÉ au sol (pas d\'espace)', 'Lever jambes et épaules de quelques cm', 'Bras tendus derrière la tête (ou sur le torse pour faciliter)', 'Trembler = c\'est bon signe', 'Tenir 20-40s, fondation des abdos gym'],
      mistakes: ['Bas du dos qui décolle', 'Jambes trop hautes', 'Respiration bloquée'] },

    { id: 'dragon_flag', name: 'Dragon Flag', category: 'core', subcategory: 'abs', equipment: 'bench',
      hyrox: [], primary: ['abdominaux','core'], secondary: ['dos'],
      videoUrl: 'https://www.youtube.com/watch?v=pvz7k1ehu_Y',
      cues: ['Allongé sur banc, agripper derrière la tête', 'Lever tout le corps (épaules → pieds) en ligne droite', 'Descendre LENTEMENT en gardant la ligne', 'Ne pas plier les hanches', 'Avancé — progresser avec genoux pliés d\'abord'],
      mistakes: ['Plier les hanches', 'Descendre trop vite', 'Cambrer le dos'] },

    { id: 'bicycle_crunch', name: 'Bicycle Crunch', category: 'core', subcategory: 'rotation', equipment: 'bodyweight',
      hyrox: ['rowing'], primary: ['abdominaux','obliques'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=Iwyvozckjak',
      cues: ['Allongé, mains derrière la tête (ne pas tirer)', 'Coude vers genou opposé en alternance', 'Jambe opposée tendue parallèle au sol', 'Mouvement contrôlé, pas la vitesse', 'Bas du dos plaqué au sol'],
      mistakes: ['Tirer sur la nuque', 'Mouvement trop rapide', 'Jambes qui rebondissent'] },

    { id: 'flutter_kicks', name: 'Flutter Kicks', category: 'core', subcategory: 'abs', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['abdominaux','fléchisseurs hanches'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=eEbCJBb5KCw',
      cues: ['Allongé, mains sous les fessiers ou sur les côtés', 'Lever les pieds à ~20cm du sol', 'Alternance verticale rapide des jambes', 'Bas du dos plaqué', 'Tenir le temps prescrit (20-40s)'],
      mistakes: ['Bas du dos qui décolle', 'Jambes trop hautes (perte de tension)', 'Bloquer la respiration'] },

    { id: 'mountain_climber', name: 'Mountain Climbers', category: 'core', subcategory: 'dynamic', equipment: 'bodyweight',
      hyrox: ['burpees','all'], primary: ['core','abdominaux'], secondary: ['épaules','quadriceps'],
      videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
      cues: ['Position planche haute, mains sous épaules', 'Ramener les genoux vers la poitrine en alternance', 'Rythme rapide mais hanches stables', 'Hybride core + cardio', 'Excellent finisher'],
      mistakes: ['Hanches qui montent', 'Pieds qui touchent fort le sol', 'Épaules en avant des mains'] },

    { id: 'cable_woodchopper', name: 'Cable Woodchopper', category: 'core', subcategory: 'rotation', equipment: 'cable',
      hyrox: ['all'], primary: ['obliques','core'], secondary: ['épaules','dos'],
      videoUrl: 'https://www.youtube.com/watch?v=N6_8jpFjQUw',
      cues: ['Câble en haut, debout de côté', 'Tirer en diagonale du haut vers la hanche opposée', 'Rotation depuis le tronc, pas les bras', 'Pivoter sur le pied arrière', 'Hauteur basse = travailler dos haut → bas'],
      mistakes: ['Tirer avec les bras seulement', 'Pas de pivot des pieds', 'Charge trop lourde'] },

    { id: 'toes_to_bar', name: 'Toes to Bar', category: 'core', subcategory: 'abs', equipment: 'bodyweight',
      hyrox: ['all'], primary: ['abdominaux','dos','grip'], secondary: ['avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=6gOLF_tFLEU',
      cues: ['Suspendu à la barre, kip ou strict', 'Lever les jambes tendues jusqu\'à toucher la barre avec les pieds', 'Contracter dos haut + core simultanément', 'Mouvement complet, pas de demi-rep', 'Variante facile : knee-to-elbow'],
      mistakes: ['Trop de balancier', 'Genoux pliés (kipping non maîtrisé)', 'Grip qui lâche avant les abdos'] },

    // ─── EXPLOSIVE / HYROX-SPECIFIC ─────────────────────────
    { id: 'box_jump', name: 'Box Jumps', category: 'explosive', subcategory: 'plyo', equipment: 'box',
      hyrox: ['burpees','sled_push'], primary: ['quadriceps','fessiers'], secondary: ['mollets'],
      videoUrl: 'https://www.youtube.com/watch?v=NBY9-kTuHEk',
      cues: ['Box stable, commencer à 50-60cm', 'Demi-squat puis sauter en poussant avec les bras', 'Atterrir en douceur : genoux fléchis, pleine plante', 'Redescendre en marchant (pas en sautant au début)', 'Développe la puissance des jambes pour le sled'],
      mistakes: ['Atterrir pieds au bord', 'Genoux qui rentrent à l\'atterrissage', 'Box trop haute'] },

    { id: 'kb_swing', name: 'Kettlebell Swings', category: 'explosive', subcategory: 'hip', equipment: 'kettlebell',
      hyrox: ['sled_push','sled_pull'], primary: ['fessiers','ischio-jambiers'], secondary: ['core','épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
      cues: ['Pieds largeur épaules, KB entre les jambes', 'Hip hinge puissant : pousser les hanches EN AVANT', 'Bras droits, force vient des HANCHES pas des bras', 'KB monte à hauteur de poitrine/épaules', 'Serrer les fessiers fort en haut', 'Mouvement balistique n°1 pour Hyrox'],
      mistakes: ['Squatter au lieu de hinge', 'Tirer avec les bras/épaules', 'Dos arrondi', 'KB trop haute (au-dessus de la tête) pour le style hardstyle'] },

    { id: 'thruster', name: 'Thrusters', category: 'explosive', subcategory: 'full', equipment: 'barbell',
      hyrox: ['wall_balls'], primary: ['quadriceps','épaules'], secondary: ['fessiers','triceps','core'],
      videoUrl: 'https://www.youtube.com/watch?v=M3EbRjPsQbQ',
      cues: ['Front squat + press en un mouvement fluide', 'Descendre en squat profond', 'Utiliser l\'élan de la remontée pour pousser overhead', 'Core engagé tout le long', 'EXERCICE N°1 pour préparer les wall balls Hyrox', 'Excellent ratio travail/temps'],
      mistakes: ['Séparer le squat et le press', 'Pas assez profond en squat', 'Barre devant le visage en haut'] },

    { id: 'wall_ball', name: 'Wall Balls', category: 'explosive', subcategory: 'full', equipment: 'medball',
      hyrox: ['wall_balls'], primary: ['quadriceps','épaules'], secondary: ['fessiers','core'],
      videoUrl: 'https://www.youtube.com/watch?v=fpUD0mcFp_0',
      cues: ['Ball au niveau du menton', 'Squat profond puis lancer la ball contre le mur (3m cible)', 'Utiliser les jambes pour générer la force', 'Attraper la ball en descendant dans le prochain squat', 'EXERCICE IDENTIQUE À L\'ÉPREUVE HYROX', 'Ball 6kg (femmes) ou 9kg (hommes) en compétition'],
      mistakes: ['Ne pas squatter assez profond', 'Lancer avec les bras seulement', 'Ne pas viser la cible'] },

    { id: 'med_ball_slam', name: 'Medicine Ball Slams', category: 'explosive', subcategory: 'power', equipment: 'medball',
      hyrox: ['skierg','burpees'], primary: ['dos','core','épaules'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=j-mwMxsFCbk',
      cues: ['Lever la ball au-dessus de la tête', 'Slammer au sol avec tout le corps', 'Utiliser les abdos et les lats', 'Suivre la ball vers le bas (mini squat)', 'Simule le mouvement du SkiErg'],
      mistakes: ['Lancer avec les bras seulement', 'Ne pas utiliser le corps entier', 'Ball qui rebondit au visage'] },

    { id: 'farmers_carry', name: 'Farmers Carry', category: 'explosive', subcategory: 'carry', equipment: 'dumbbells',
      hyrox: ['farmers_carry'], primary: ['avant-bras','trapèzes','core'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=Fkzk_RqlYig',
      cues: ['DB/KB lourds dans chaque main', 'Épaules en arrière et en bas', 'Core SERRÉ, pas de balancement latéral', 'Pas courts et rapides', 'Regarder droit devant', 'ÉPREUVE IDENTIQUE HYROX : 200m avec 2x16/24kg', 'Travailler la grip en augmentant la distance'],
      mistakes: ['Épaules qui montent', 'Pencher d\'un côté', 'Pas trop longs', 'Grip qui lâche (travailler l\'endurance)'] },

    { id: 'sled_push_light', name: 'Sled Push (léger)', category: 'explosive', subcategory: 'push', equipment: 'sled',
      hyrox: ['sled_push'], primary: ['quadriceps','fessiers','mollets'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=aVB9slCpLME',
      cues: ['Mains hautes sur les poignées', 'Corps incliné à ~45°', 'Pas courts et puissants', 'Pousser avec les jambes, pas le dos', 'ÉPREUVE HYROX : 4x50m avec sled chargé', 'Commencer léger, augmenter progressivement'],
      mistakes: ['Dos arrondi', 'Pas trop longs', 'Regarder en bas (garder un angle de vision)'] },

    { id: 'sled_pull_light', name: 'Sled Pull (léger)', category: 'explosive', subcategory: 'pull', equipment: 'sled',
      hyrox: ['sled_pull'], primary: ['dos','biceps','ischio-jambiers'], secondary: ['core','avant-bras'],
      videoUrl: 'https://www.youtube.com/watch?v=ZajDo1V7FRo',
      cues: ['Face au sled, tirer la corde main sur main', 'Position basse, assis en arrière', 'Tirer avec le dos et les bras alternativement', 'Garder la tension dans la corde', 'ÉPREUVE HYROX : tirer le sled sur 12.5m'],
      mistakes: ['Se pencher trop en avant', 'Tirer seulement avec les bras', 'Ne pas ancrer les pieds'] },

    { id: 'burpee', name: 'Burpees', category: 'explosive', subcategory: 'full', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['tout le corps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
      cues: ['Descendre : mains au sol, sauter pieds en arrière', 'Poitrine au sol (push-up complet)', 'Push-up, sauter pieds vers les mains', 'Sauter en avant (broad jump en Hyrox)', 'ÉPREUVE HYROX : 80m de burpee broad jumps', 'Rythme régulier > vitesse max'],
      mistakes: ['Ne pas toucher la poitrine au sol', 'Sauter trop haut (gaspillage d\'énergie)', 'Rythme irrégulier'] },

    { id: 'clean_and_press', name: 'Clean and Press', category: 'explosive', subcategory: 'full', equipment: 'barbell',
      hyrox: ['wall_balls','sled_push'], primary: ['tout le corps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=_nCPbfdxNgM',
      cues: ['Combiner un clean (sol → épaules) + press', 'Traction explosive depuis le sol', 'Réception sur les épaules en position front squat', 'Pousser au-dessus de la tête', 'Mouvement complet qui développe la puissance globale'],
      mistakes: ['Tirer avec le dos', 'Réception brutale', 'Presser sans utiliser les jambes'] },

    { id: 'battle_ropes', name: 'Battle Ropes', category: 'explosive', subcategory: 'conditioning', equipment: 'ropes',
      hyrox: ['skierg','rowing'], primary: ['épaules','core','bras'], secondary: ['cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=CsZknC0Q3aA',
      cues: ['Position semi-squat, core engagé', 'Alterner les bras rapidement', 'Créer des vagues régulières', 'Variantes : slams (2 bras), latéraux, cercles', 'Excellent pour l\'endurance musculaire des épaules'],
      mistakes: ['Se tenir trop droit', 'Mouvement seulement des bras (impliquer le corps)', 'Rythme irrégulier'] },

    // ─── GRIP & ACCESSORY ───────────────────────────────────
    { id: 'wrist_curl', name: 'Wrist Curls', category: 'upper_pull', subcategory: 'arms', equipment: 'barbell',
      hyrox: ['farmers_carry','sled_pull'], primary: ['avant-bras'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=FW5vMpIHi4c',
      cues: ['Avant-bras posés sur les cuisses', 'Fléchir les poignets vers le haut', 'Mouvement lent et contrôlé', 'Important pour l\'endurance de grip (Farmers Carry Hyrox)'],
      mistakes: ['Charge trop lourde', 'Mouvement rapide'] },

    { id: 'single_leg_rdl', name: 'Single-Leg RDL', category: 'lower', subcategory: 'hip', equipment: 'dumbbells',
      hyrox: ['lunges','sled_pull','course'], primary: ['ischio-jambiers','fessiers','stabilisateurs'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=Ej3VhB_dZHI',
      cues: ['Debout sur une jambe, basculer le torse en avant', 'Jambe arrière monte naturellement pour contrebalancer', 'Hanche, genou et cheville alignés (pas de rotation)', 'Étirement ischio max en bas, squeeze fessier en haut', 'Essentiel pour asymétries post-blessure Achille'],
      mistakes: ['Hanche qui s\'ouvre', 'Genou qui plie trop', 'Dos arrondi'] },

    { id: 'tibialis_raise', name: 'Tibialis Raises', category: 'lower', subcategory: 'calves', equipment: 'bodyweight',
      hyrox: ['course','sled_push'], primary: ['tibial antérieur'], secondary: ['stabilisateurs cheville'],
      videoUrl: 'https://www.youtube.com/watch?v=gNS_QjGAs_k',
      cues: ['Dos contre un mur, pieds à 30cm du mur', 'Lever les orteils vers les tibias', 'Pause 2s en haut', 'ESSENTIEL prévention Achille / shin splints', '3×20 quotidien en prehab'],
      mistakes: ['Mouvement trop rapide', 'Amplitude incomplète'] },

    { id: 'copenhagen_plank', name: 'Copenhagen Plank', category: 'core', subcategory: 'stability', equipment: 'bodyweight',
      hyrox: ['course','lunges','all'], primary: ['adducteurs','obliques'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=V8bT6phG4gA',
      cues: ['Sur le coude, jambe du haut sur un banc', 'Lever les hanches, corps en ligne droite', 'Engager les adducteurs pour maintenir', 'Prévention blessure adducteurs (souvent négligé)', '3×20-30s par côté'],
      mistakes: ['Hanches qui tombent', 'Rotation du torse'] },

    { id: 'heavy_kb_row', name: 'Heavy KB Row', category: 'upper_pull', subcategory: 'back', equipment: 'kettlebell',
      hyrox: ['sled_pull','rowing'], primary: ['dos','biceps','grip'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
      cues: ['Un genou et une main sur banc, KB dans l\'autre main', 'Tirer le KB vers la hanche', 'Analog direct du sled pull (grip + tirage)', 'Charges lourdes OK (24-32kg KB)', 'Serrer les omoplates en haut'],
      mistakes: ['Rotation du torse', 'Tirer vers l\'épaule au lieu de la hanche'] },

    { id: 'dead_hang', name: 'Dead Hang', category: 'upper_pull', subcategory: 'grip', equipment: 'bodyweight',
      hyrox: ['farmers_carry','sled_pull'], primary: ['avant-bras','épaules'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=dR6EbYAnJac',
      cues: ['Suspendu à la barre, bras tendus', 'Épaules tirées vers le bas (pas relâchées)', 'Tenir le plus longtemps possible', 'Développe l\'endurance de grip pour les épreuves Hyrox', 'Objectif : 60s+ pour être prêt'],
      mistakes: ['Épaules relâchées (risque blessure)', 'Grip trop large'] },

    // ─── FUNCTIONAL / HYROX RACE SIMULATION ─────────────────
    { id: 'sandbag_squat', name: 'Sandbag Squat', category: 'functional', subcategory: 'sandbag', equipment: 'sandbag',
      hyrox: ['lunges','wall_balls','sled_push'], primary: ['quadriceps','fessiers','core'], secondary: ['épaules','dos'],
      videoUrl: 'https://www.youtube.com/watch?v=VfBrGLsEYQo',
      cues: ['Sandbag en position bear hug (contre la poitrine)', 'Squat profond, coudes hauts', 'Core ultra engagé pour ne pas se pencher', 'Simule la charge front-loaded des lunges Hyrox', 'Commencer léger, augmenter progressivement'],
      mistakes: ['Laisser le sandbag glisser', 'Dos qui arrondit', 'Pas assez profond'] },

    { id: 'sandbag_lunge', name: 'Sandbag Lunges', category: 'functional', subcategory: 'sandbag', equipment: 'sandbag',
      hyrox: ['lunges'], primary: ['quadriceps','fessiers','core'], secondary: ['épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=nMDAxBqR9kw',
      cues: ['Sandbag sur l\'épaule ou en bear hug', 'IDENTIQUE À L\'ÉPREUVE HYROX (100m)', 'Grand pas, genou arrière frôle le sol', 'Alterner les côtés de portage', 'Entraîner à poids > compétition (25-30kg si Open 20kg)'],
      mistakes: ['Pas trop courts', 'Torse penché', 'Ne pas alterner le côté de portage'] },

    { id: 'sandbag_carry', name: 'Sandbag Carry', category: 'functional', subcategory: 'sandbag', equipment: 'sandbag',
      hyrox: ['lunges','farmers_carry'], primary: ['core','épaules','trapèzes'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=dkOMUJLqiqs',
      cues: ['Bear hug : serrer le sandbag contre le torse', 'Pas courts et rapides', 'Core serré, ne pas se pencher en arrière', 'Varier les positions : épaule, bear hug, zercher'],
      mistakes: ['Laisser le sandbag glisser', 'Se pencher en arrière', 'Pas trop longs'] },

    { id: 'sandbag_over_shoulder', name: 'Sandbag Over Shoulder', category: 'functional', subcategory: 'sandbag', equipment: 'sandbag',
      hyrox: ['sled_pull','burpees'], primary: ['dos','fessiers','épaules'], secondary: ['core','ischio-jambiers'],
      videoUrl: 'https://www.youtube.com/watch?v=VH_GsBlQKek',
      cues: ['Sandbag au sol, position deadlift', 'Tirer vers le haut avec les hanches', 'Faire passer par-dessus l\'épaule', 'Alterner les côtés', 'Mouvement explosif de hip extension'],
      mistakes: ['Tirer avec le dos arrondi', 'Pas assez d\'extension de hanches', 'Toujours le même côté'] },

    { id: 'sandbag_clean', name: 'Sandbag Clean', category: 'functional', subcategory: 'sandbag', equipment: 'sandbag',
      hyrox: ['sled_pull','wall_balls'], primary: ['tout le corps'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=0cSPMJfn9fA',
      cues: ['Sol → épaules en un mouvement', 'Extension de hanches explosive', 'Attraper en position front squat', 'Enchaîner avec un squat ou un press pour du travail combo'],
      mistakes: ['Tirer avec les bras', 'Pas d\'extension de hanches'] },

    { id: 'bear_crawl', name: 'Bear Crawl', category: 'functional', subcategory: 'locomotion', equipment: 'bodyweight',
      hyrox: ['burpees','all'], primary: ['core','épaules','quadriceps'], secondary: ['triceps','fléchisseurs hanches'],
      videoUrl: 'https://www.youtube.com/watch?v=pxMRKqGfCik',
      cues: ['4 pattes : mains sous les épaules, genoux à 2cm du sol', 'Avancer main droite + pied gauche simultanément', 'Garder le dos PLAT, hanches basses', 'Pas courts et contrôlés', 'Variantes : latéral, arrière, avec poids'],
      mistakes: ['Hanches trop hautes (ours debout)', 'Balancement latéral', 'Pas trop grands'] },

    { id: 'bear_crawl_weighted', name: 'Bear Crawl Lesté', category: 'functional', subcategory: 'locomotion', equipment: 'vest',
      hyrox: ['burpees','sled_push'], primary: ['core','épaules','quadriceps'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=pxMRKqGfCik',
      cues: ['Même technique que bear crawl + gilet lesté ou sandbag sur le dos', 'Augmente drastiquement le travail de core et d\'épaules', 'Commencer avec 5-10kg', '20-30m par série'],
      mistakes: ['Charge trop lourde au début', 'Technique qui se dégrade'] },

    { id: 'box_step_over', name: 'Box Step-Overs', category: 'functional', subcategory: 'box', equipment: 'box',
      hyrox: ['lunges','sled_push','burpees'], primary: ['quadriceps','fessiers'], secondary: ['core','cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=o0T4LHKZ4p0',
      cues: ['Monter sur la box, passer de l\'autre côté, redescendre', 'Mouvement continu sans pause en haut', 'Hauteur 50-60cm', 'Excellent pour l\'endurance des jambes sous fatigue', 'Ajouter des DB pour plus d\'intensité'],
      mistakes: ['S\'arrêter en haut', 'Ne pas contrôler la descente', 'Box trop haute'] },

    { id: 'box_jump_over', name: 'Box Jump-Overs', category: 'functional', subcategory: 'box', equipment: 'box',
      hyrox: ['burpees','sled_push'], primary: ['quadriceps','fessiers','mollets'], secondary: ['core','cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=bVFwelBRbGE',
      cues: ['Sauter sur la box, passer de l\'autre côté', 'Atterrir en douceur de l\'autre côté', 'Rythme soutenu sans pause', 'Simule les broad jumps des burpees Hyrox', 'Travailler en séries de 10-20'],
      mistakes: ['Mauvaise réception', 'Rythme irrégulier'] },

    { id: 'broad_jump', name: 'Broad Jumps', category: 'functional', subcategory: 'plyo', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['quadriceps','fessiers','mollets'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=96zJo3nlmHI',
      cues: ['MOUVEMENT IDENTIQUE AUX BURPEE BROAD JUMPS HYROX', 'Demi-squat, balancer les bras, sauter le plus loin possible', 'Atterrir en douceur, genoux fléchis', 'Enchaîner immédiatement', 'Objectif : maximiser la distance par saut'],
      mistakes: ['Atterrir jambes tendues', 'Ne pas utiliser les bras', 'Sauter en hauteur au lieu de longueur'] },

    { id: 'burpee_broad_jump', name: 'Burpee Broad Jumps', category: 'functional', subcategory: 'full', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['tout le corps'], secondary: ['cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
      cues: ['ÉPREUVE IDENTIQUE HYROX : 80m', 'Burpee complet (poitrine au sol) + broad jump', 'Rythme régulier > vitesse max', 'Objectif : max distance par jump pour moins de jumps total', 'Pratiquer en état de fatigue (après course)'],
      mistakes: ['Sauter trop haut au lieu de loin', 'Rythme irrégulier', 'Ne pas toucher la poitrine au sol'] },

    { id: 'devil_press', name: 'Devil Press', category: 'functional', subcategory: 'full', equipment: 'dumbbells',
      hyrox: ['burpees','wall_balls','skierg'], primary: ['tout le corps'], secondary: ['cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=roMRnpNMZbQ',
      cues: ['Burpee avec DB + snatch DB overhead en remontant', 'Combo ultime : burpee + puissance + overhead', 'Excellent pour endurance totale sous fatigue', 'Charges légères-modérées (10-15kg par DB)', 'Rythme constant'],
      mistakes: ['Charge trop lourde', 'Mauvaise technique de snatch', 'Ne pas toucher la poitrine au sol'] },

    { id: 'man_maker', name: 'Man Makers', category: 'functional', subcategory: 'full', equipment: 'dumbbells',
      hyrox: ['burpees','wall_balls','sled_push'], primary: ['tout le corps'], secondary: ['cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=hkelFkFpRvE',
      cues: ['Burpee + row + clean + press — le combo ultime', 'Push-up → Row gauche → Row droite → Clean → Press', 'Charges légères (8-12kg par DB)', 'Travaille TOUT : push, pull, squat, overhead, core', 'Endurance musculaire totale'],
      mistakes: ['Charge trop lourde', 'Perdre la technique quand fatigué', 'Oublier le row'] },

    { id: 'assault_bike', name: 'Assault Bike', category: 'functional', subcategory: 'conditioning', equipment: 'bike',
      hyrox: ['all','course'], primary: ['quadriceps','cardio'], secondary: ['épaules','core'],
      videoUrl: 'https://www.youtube.com/watch?v=nMjE1MRf0nk',
      cues: ['Pousser bras ET jambes simultanément', 'Excellent pour le conditioning sans impact', 'Intervals : 30s max / 30s repos × 8-10', 'Simule l\'effort cardio intense entre les stations', 'Alternative au running pour retour de blessure'],
      mistakes: ['Seulement les jambes (utiliser les bras)', 'Rythme irrégulier'] },

    { id: 'wall_sit', name: 'Wall Sit', category: 'functional', subcategory: 'isometric', equipment: 'bodyweight',
      hyrox: ['sled_push','wall_balls'], primary: ['quadriceps','fessiers'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=y-wV4Lz6jBU',
      cues: ['Dos contre le mur, cuisses parallèles au sol', 'Genoux à 90°', 'Objectif : 60-90s', 'Simule la brûlure des quads du sled push', 'Variante : avec sandbag sur les cuisses'],
      mistakes: ['Cuisses pas assez basses', 'S\'appuyer sur les mains'] },

    { id: 'wall_walk', name: 'Wall Walks', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['burpees','all'], primary: ['épaules','core','triceps'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=Oy5BkNI0GBo',
      cues: ['Position push-up face au mur', 'Marcher les pieds sur le mur en montant les mains vers le mur', 'Arriver en handstand face au mur', 'Redescendre contrôlé', 'Force épaules + core intense'],
      mistakes: ['Aller trop vite', 'Core relâché (dos qui cambre)', 'Mains trop loin du mur'] },

    { id: 'mountain_climber', name: 'Mountain Climbers', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['burpees','all'], primary: ['core','fléchisseurs hanches','cardio'], secondary: ['épaules','quadriceps'],
      videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
      cues: ['Position planche, alterner genou vers poitrine rapidement', 'Garder les hanches basses', 'Rythme rapide pour le cardio, lent pour le core', 'Excellent échauffement ou finisher'],
      mistakes: ['Hanches trop hautes', 'Rythme irrégulier'] },

    { id: 'jump_lunge', name: 'Jump Lunges', category: 'functional', subcategory: 'plyo', equipment: 'bodyweight',
      hyrox: ['lunges','burpees'], primary: ['quadriceps','fessiers','mollets'], secondary: ['core','cardio'],
      videoUrl: 'https://www.youtube.com/watch?v=y7Iug7eAAsA',
      cues: ['Lunge classique puis sauter et alterner les jambes en l\'air', 'Atterrir en douceur dans la lunge opposée', 'Puissance + endurance des jambes', 'Directement applicable aux lunges et burpees Hyrox'],
      mistakes: ['Genou qui touche le sol trop fort', 'Mauvais équilibre', 'Pas assez de hauteur'] },

    { id: 'pistol_squat', name: 'Pistol Squat', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['lunges','sled_push'], primary: ['quadriceps','fessiers','stabilisateurs'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=vq5-vdgJc0I',
      cues: ['Squat complet sur une jambe, l\'autre tendue devant', 'Descendre contrôlé, remonter sans élan', 'Force et stabilité unilatérale ultime', 'Progresser : assisté (TRX) → libre → lesté'],
      mistakes: ['Genou qui rentre', 'Talon qui décolle', 'Perte d\'équilibre'] },

    { id: 'sled_push_heavy', name: 'Sled Push Lourd', category: 'functional', subcategory: 'sled', equipment: 'sled',
      hyrox: ['sled_push'], primary: ['quadriceps','fessiers','mollets'], secondary: ['core','épaules'],
      videoUrl: 'https://www.youtube.com/watch?v=aVB9slCpLME',
      cues: ['Charge > poids compétition (170-200kg)', 'Mains hautes, corps à 45°', 'Pas courts et explosifs', 'Travailler en distance : 4×15m ou 2×25m', 'LA séance spécifique sled push'],
      mistakes: ['Dos arrondi', 'Pas trop longs', 'Charge insuffisante (entraîner plus lourd que compétition)'] },

    { id: 'sled_pull_heavy', name: 'Sled Pull Lourd', category: 'functional', subcategory: 'sled', equipment: 'sled',
      hyrox: ['sled_pull'], primary: ['dos','biceps','ischio-jambiers','grip'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=ZajDo1V7FRo',
      cues: ['Face au sled, position assise basse', 'Tirer la corde main sur main', 'Ancrer les pieds, utiliser TOUT le corps', 'Charge > compétition', 'ÉPREUVE IDENTIQUE HYROX'],
      mistakes: ['Tirer seulement avec les bras', 'Position trop haute', 'Grip qui lâche'] },

    { id: 'rope_climb', name: 'Rope Climb', category: 'functional', subcategory: 'bodyweight', equipment: 'rope',
      hyrox: ['sled_pull','farmers_carry'], primary: ['dos','biceps','grip','core'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=Ymjsa_-gPR0',
      cues: ['Technique pieds : enrouler la corde autour du pied', 'Tirer avec les bras + pousser avec les pieds', 'Force de grip ultime', 'Alternative : rope pulls au sol si pas de corde verticale'],
      mistakes: ['Ne pas utiliser les pieds', 'Descendre trop vite (brûlure)', 'Grip insuffisant'] },

    { id: 'air_squat', name: 'Air Squats', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['wall_balls','sled_push'], primary: ['quadriceps','fessiers'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=C_VtOYc6j5c',
      cues: ['Squat poids du corps, descente profonde', 'Idéal en haute reps pour endurance (50-100)', 'Échauffement parfait avant wall balls', 'Tempo rapide pour le cardio'],
      mistakes: ['Pas assez profond', 'Genoux qui rentrent'] },

    { id: 'hand_release_pushup', name: 'Hand Release Push-ups', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['pectoraux','triceps','épaules'], secondary: ['core'],
      videoUrl: 'https://www.youtube.com/watch?v=yL1rnfPZ_RI',
      cues: ['Push-up complet, poitrine au sol', 'Lever les mains du sol en bas (hand release)', 'Reposer les mains, pousser pour remonter', 'IDENTIQUE au mouvement du burpee Hyrox', 'Travailler en volume : 3×20-30'],
      mistakes: ['Ne pas lever complètement les mains', 'Hanches qui restent au sol', 'Mouvement partiel'] },

    { id: 'sprawl', name: 'Sprawls', category: 'functional', subcategory: 'bodyweight', equipment: 'bodyweight',
      hyrox: ['burpees'], primary: ['tout le corps','cardio'], secondary: [],
      videoUrl: 'https://www.youtube.com/watch?v=PmKDNJBntDw',
      cues: ['Comme un burpee SANS le push-up ni le saut', 'Mains au sol → pieds en arrière → revenir debout', 'Plus rapide que le burpee complet', 'Excellent pour le conditioning et la vitesse de transition'],
      mistakes: ['Ajouter un push-up (c\'est pas un burpee)', 'Mouvement trop lent'] },

    { id: 'turkish_getup', name: 'Turkish Get-Up', category: 'functional', subcategory: 'full', equipment: 'kettlebell',
      hyrox: ['all'], primary: ['épaules','core','stabilisateurs'], secondary: ['tout le corps'],
      videoUrl: 'https://www.youtube.com/watch?v=0bWRPC49-KI',
      cues: ['KB bras tendu, passer de couché à debout', 'Mouvement lent et contrôlé', 'Stabilité d\'épaule + core + mobilité de hanche', 'Exercice de prévention blessure par excellence', '3-5 reps par côté'],
      mistakes: ['Aller trop vite', 'Perdre le KB des yeux', 'Sauter des étapes'] },

    { id: 'suitcase_carry', name: 'Suitcase Carry', category: 'functional', subcategory: 'carry', equipment: 'kettlebell',
      hyrox: ['farmers_carry','all'], primary: ['obliques','core','grip'], secondary: ['trapèzes'],
      videoUrl: 'https://www.youtube.com/watch?v=31ryaJCPmyQ',
      cues: ['Un seul KB/DB dans une main', 'Résister à l\'inclinaison latérale', 'Core anti-latéral : obliques à fond', 'Alterner les côtés', '30-40m par côté'],
      mistakes: ['Se pencher du côté du poids', 'Épaule qui monte'] },

    { id: 'overhead_carry', name: 'Overhead Carry', category: 'functional', subcategory: 'carry', equipment: 'kettlebell',
      hyrox: ['wall_balls','farmers_carry'], primary: ['épaules','core','stabilisateurs'], secondary: ['trapèzes'],
      videoUrl: 'https://www.youtube.com/watch?v=p5TABsQ4KIo',
      cues: ['KB/DB bras tendu au-dessus de la tête', 'Biceps à côté de l\'oreille', 'Core serré, côtes basses', 'Stabilité d\'épaule sous charge', '30-40s par bras'],
      mistakes: ['Coude plié', 'Côtes qui s\'ouvrent (dos cambré)', 'Mauvais alignement'] },
  ];

  // ── Category labels ───────────────────────────────────────
  const CATEGORIES = {
    lower:      { label: 'Bas du corps', icon: '🦵', color: '#00d4aa' },
    upper_push: { label: 'Haut - Poussée', icon: '💪', color: '#00a8ff' },
    upper_pull: { label: 'Haut - Tirage', icon: '🏋️', color: '#8b5cf6' },
    core:       { label: 'Core', icon: '🔥', color: '#f0a030' },
    explosive:  { label: 'Explosif / Hyrox', icon: '⚡', color: '#ff4060' },
    functional: { label: 'Fonctionnel / Race', icon: '🏁', color: '#e040fb' },
  };

  // ── Program Templates ─────────────────────────────────────

  const TEMPLATES = {
    3: {
      name: 'Hyrox Supersets 3x',
      days: [
        {
          label: 'Force Supersets + Sled',
          focus: 'Supersets force + conditioning sled',
          warmup: '5 min rameur léger + mobilité hanches/chevilles + 2 séries progressives squat (50%, 70%)',
          blocks: [
            { name: 'Superset A — Force bas',
              exercises: [
                { id: 'back_squat', sets: 5, reps: '5', rest: 90, notes: 'A1 — Enchaîner avec A2' },
                { id: 'kb_swing', sets: 5, reps: '12', rest: 60, notes: 'A2 — Explosivité hip hinge' },
              ]},
            { name: 'Superset B — Push/Pull',
              exercises: [
                { id: 'bench_press', sets: 4, reps: '6', rest: 60, notes: 'B1 — Enchaîner avec B2' },
                { id: 'pull_ups', sets: 4, reps: '8', rest: 60, notes: 'B2 — Tirage antagoniste' },
              ]},
            { name: 'Conditioning — Sled',
              exercises: [
                { id: 'sled_push_heavy', sets: 4, reps: '20m', rest: 120, notes: 'Force lourde, pas courts' },
              ]},
            { name: 'Core + Prehab',
              exercises: [
                { id: 'plank', sets: 3, reps: '45s', rest: 30, notes: '' },
                { id: 'tibialis_raise', sets: 3, reps: '20', rest: 30, notes: 'Prehab Achille' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements hanches, chevilles, épaules — 5 min',
        },
        {
          label: 'Endurance Hyrox — Sandbag + Carries',
          focus: 'Supersets endurance + conditioning carries',
          warmup: '5 min SkiErg + mobilité épaules + 10 air squats',
          blocks: [
            { name: 'Superset A — Sandbag + Wall Balls',
              exercises: [
                { id: 'sandbag_lunge', sets: 3, reps: '40m', rest: 60, notes: 'A1 — Foulée 0.9-1.1m' },
                { id: 'wall_ball', sets: 3, reps: '20', rest: 45, notes: 'A2 — Enchaîner direct' },
              ]},
            { name: 'Superset B — Carries variés',
              exercises: [
                { id: 'farmers_carry', sets: 4, reps: '60m', rest: 60, notes: 'B1 — Race weight ou +4kg' },
                { id: 'overhead_carry', sets: 4, reps: '30m', rest: 60, notes: 'B2 — Stabilité épaule' },
              ]},
            { name: 'Circuit C — Hyrox Conditioning',
              exercises: [
                { id: 'box_step_over', sets: 3, reps: '12', rest: 0, notes: 'C1 — Enchaîner tout' },
                { id: 'sandbag_over_shoulder', sets: 3, reps: '8', rest: 0, notes: 'C2 — Explosif hanche' },
                { id: 'hanging_leg_raise', sets: 3, reps: '10', rest: 60, notes: 'C3 — Core, repos après le circuit' },
              ]},
          ],
          finisher: '',
          cooldown: 'Foam rolling quads, ischios, épaules — 5 min',
        },
        {
          label: 'Poids du corps + Circuit Race',
          focus: 'Bodyweight + circuits Hyrox complets',
          warmup: '5 min jumping jacks + mobilité + 10 hand release push-ups',
          blocks: [
            { name: 'Circuit A — Poids du corps (3 tours)',
              exercises: [
                { id: 'burpee_broad_jump', sets: 3, reps: '20m', rest: 0, notes: 'A1 — Technique step-up' },
                { id: 'bear_crawl', sets: 3, reps: '20m', rest: 0, notes: 'A2 — Dos plat, hanches basses' },
                { id: 'jump_lunge', sets: 3, reps: '10/jambe', rest: 60, notes: 'A3 — Repos après le circuit' },
              ]},
            { name: 'Superset B — Impulsion + Force',
              exercises: [
                { id: 'box_jump', sets: 4, reps: '10', rest: 60, notes: 'B1 — Rebond explosif, landing contrôlé' },
                { id: 'thruster', sets: 4, reps: '10', rest: 60, notes: 'B2 — Squat + press fluide' },
              ]},
            { name: 'Circuit C — Race Simulation',
              exercises: [
                { id: 'wall_ball', sets: 2, reps: '25', rest: 0, notes: 'Enchaîner sans pause' },
                { id: 'farmers_carry', sets: 2, reps: '40m', rest: 0, notes: 'Direct après wall balls' },
                { id: 'broad_jump', sets: 2, reps: '10', rest: 90, notes: 'Repos après le circuit' },
              ]},
          ],
          finisher: 'AMRAP 6 min : 8 BBJ + 12 Wall Balls + 30m Farmers Carry',
          cooldown: 'Étirements complets 8 min',
        },
      ]
    },
    4: {
      name: 'Hyrox Supersets 4x',
      days: [
        {
          label: 'Force bas — Supersets + Sled',
          focus: 'Squat 5×5 + DL supersetés + conditioning sled',
          warmup: '5 min rameur + mobilité hanches/chevilles + séries progressives squat (50%, 70%)',
          blocks: [
            { name: 'Superset A — Squat + Explosif',
              exercises: [
                { id: 'back_squat', sets: 5, reps: '5', rest: 90, notes: 'A1 — 5×5 force, enchaîner avec A2' },
                { id: 'box_jump', sets: 4, reps: '10', rest: 60, notes: 'A2 — Rebond explosif, landing contrôlé' },
              ]},
            { name: 'Superset B — Hinge + Unilateral',
              exercises: [
                { id: 'deadlift', sets: 3, reps: '5', rest: 90, notes: 'B1 — Force hip hinge' },
                { id: 'bulgarian_split', sets: 3, reps: '8/jambe', rest: 60, notes: 'B2 — Transfert lunges' },
              ]},
            { name: 'Superset C — Machine + Prehab',
              exercises: [
                { id: 'leg_press', sets: 3, reps: '10', rest: 60, notes: 'C1 — Volume additionnel' },
                { id: 'calf_raise', sets: 3, reps: '15', rest: 30, notes: 'C2 — Propulsion + prehab' },
              ]},
            { name: 'Conditioning — Sled',
              exercises: [
                { id: 'sled_push_heavy', sets: 4, reps: '20m', rest: 120, notes: 'Force lourde, pas courts, 45° inclinaison' },
                { id: 'tibialis_raise', sets: 3, reps: '20', rest: 30, notes: 'Prehab Achille' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements quads, ischios, mollets, hanches — 5 min',
        },
        {
          label: 'Push-Pull — Supersets + Focus Pec Bas',
          focus: 'Bench 5×5 + OHP/Pull-ups + FOCUS BAS DU PEC (decline DB + dips lestées + cable haut→bas) + carries',
          warmup: '5 min SkiErg + mobilité épaules/thoracique + séries progressives bench (50%, 70%)',
          blocks: [
            { name: 'Superset A — Push/Pull horizontal',
              exercises: [
                { id: 'bench_press', sets: 5, reps: '5', rest: 60, notes: 'A1 — 5×5 force, enchaîner' },
                { id: 'barbell_row', sets: 5, reps: '6', rest: 60, notes: 'A2 — Tirage antagoniste' },
              ]},
            { name: 'Superset B — Push/Pull vertical',
              exercises: [
                { id: 'ohp', sets: 4, reps: '6', rest: 60, notes: 'B1 — Transfert wall balls' },
                { id: 'pull_ups', sets: 4, reps: '8', rest: 60, notes: 'B2 — Tirage vertical' },
              ]},
            { name: '💪 Focus Pec Bas — Decline barbell + Decline DB',
              exercises: [
                { id: 'decline_bench', sets: 4, reps: '8', rest: 90, notes: 'PEC BAS : banc décliné 15-30° · descendre bas de la poitrine · charge progressive' },
                { id: 'decline_db_press', sets: 4, reps: '10', rest: 75, notes: 'Volume bas du pec · squeeze en haut · 2s tempo' },
              ]},
            { name: 'Isolation — Cable Crossover Haut→Bas',
              exercises: [
                { id: 'cable_crossover_high', sets: 4, reps: '12-15', rest: 45, notes: 'ISOLATION pure bas du pec · poulies HAUTES · squeeze 2s en bas · volume élevé' },
              ]},
            { name: 'Accessoire — Core',
              exercises: [
                { id: 'copenhagen_plank', sets: 3, reps: '30s/côté', rest: 30, notes: 'Adducteurs + core' },
              ]},
            { name: 'Conditioning — Carries',
              exercises: [
                { id: 'farmers_carry', sets: 3, reps: '60m', rest: 90, notes: 'Race weight ou +4kg, pas courts/rapides' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements épaules, pecs (focus), dos, poignets — 5 min',
        },
        {
          label: 'Endurance Hyrox — Sandbag + Circuits',
          focus: 'Sandbag, wall balls, box, KB — haute reps en supersets',
          warmup: '5 min rameur léger + mobilité + 15 air squats',
          blocks: [
            { name: 'Superset A — Sandbag + Wall Balls',
              exercises: [
                { id: 'sandbag_lunge', sets: 3, reps: '40m', rest: 45, notes: 'A1 — Foulée longue, rester droit' },
                { id: 'wall_ball', sets: 3, reps: '25', rest: 45, notes: 'A2 — Jambes > bras, rythme constant' },
              ]},
            { name: 'Superset B — KB + Box',
              exercises: [
                { id: 'kb_swing', sets: 4, reps: '20', rest: 45, notes: 'B1 — Hip hinge explosif' },
                { id: 'box_step_over', sets: 4, reps: '12', rest: 45, notes: 'B2 — Mouvement continu' },
              ]},
            { name: 'Circuit C — Conditioning Hyrox (3 tours)',
              exercises: [
                { id: 'sandbag_over_shoulder', sets: 3, reps: '8', rest: 0, notes: 'C1 — Explosif, alterner côtés' },
                { id: 'sandbag_carry', sets: 3, reps: '30m', rest: 0, notes: 'C2 — Bear hug, pas rapides' },
                { id: 'hanging_leg_raise', sets: 3, reps: '12', rest: 60, notes: 'C3 — Core, repos après circuit' },
              ]},
          ],
          finisher: '',
          cooldown: 'Foam rolling + étirements 5 min',
        },
        {
          label: 'Poids du corps + Circuit Race',
          focus: 'BBJ, bear crawl, jump lunges + circuit simulation Hyrox',
          warmup: '5 min jumping jacks + mountain climbers + mobilité',
          blocks: [
            { name: 'Circuit A — Bodyweight (3 tours)',
              exercises: [
                { id: 'burpee_broad_jump', sets: 3, reps: '20m', rest: 0, notes: 'A1 — Step-up technique, bras agressifs' },
                { id: 'bear_crawl', sets: 3, reps: '20m', rest: 0, notes: 'A2 — Dos plat, genoux 2cm du sol' },
                { id: 'hand_release_pushup', sets: 3, reps: '15', rest: 60, notes: 'A3 — Repos après le circuit' },
              ]},
            { name: 'Superset B — Impulsion',
              exercises: [
                { id: 'jump_lunge', sets: 3, reps: '10/jambe', rest: 45, notes: 'B1 — Atterrir en douceur' },
                { id: 'box_jump_over', sets: 3, reps: '10', rest: 45, notes: 'B2 — Rythme soutenu' },
              ]},
            { name: 'Circuit C — Race Simulation (3 tours)',
              exercises: [
                { id: 'thruster', sets: 3, reps: '10', rest: 0, notes: 'C1 — Squat + press fluide' },
                { id: 'farmers_carry', sets: 3, reps: '40m', rest: 0, notes: 'C2 — Direct après thrusters' },
                { id: 'wall_ball', sets: 3, reps: '15', rest: 0, notes: 'C3 — Enchaîner' },
                { id: 'broad_jump', sets: 3, reps: '10', rest: 90, notes: 'C4 — Repos après le circuit' },
              ]},
          ],
          finisher: 'AMRAP 6 min : 8 Burpee BJ + 12 Wall Balls + 40m Farmers Carry',
          cooldown: 'Étirements complets + respiration — 8 min',
        },
      ]
    },
    5: {
      name: 'Hybrid Hyrox + Muscle 5x',
      days: [
        // ═══ JOUR 1 (LUN) — PUSH FORCE + FOCUS PEC BAS ═══
        {
          label: 'Push Force + Focus Pec Bas',
          focus: 'Bench 5×5 + OHP + FOCUS BAS DU PEC (dips lestées + decline + cable haut→bas) — force 1re moitié, hypertrophie 2e',
          warmup: '5 min SkiErg + mobilité épaules/thoracique + séries progressives bench (50%, 70%)',
          blocks: [
            { name: 'A — Bench Press (compound force)',
              exercises: [
                { id: 'bench_press', sets: 5, reps: '5', rest: 150, notes: 'A — 5×5 force · repos 2:30 · double progression : monter reps si RPE ≤ 7' },
              ]},
            { name: '💪 B — Focus Pec Bas (hypertrophie 8-12)',
              exercises: [
                { id: 'decline_bench', sets: 4, reps: '8', rest: 120, notes: 'B1 — Décliné barbell 15-30° · descendre bas de la poitrine · compound pec bas' },
                { id: 'decline_db_press', sets: 3, reps: '10', rest: 90, notes: 'B2 — Décliné DB volume · squeeze en haut' },
              ]},
            { name: 'C — OHP force',
              exercises: [
                { id: 'ohp', sets: 4, reps: '6', rest: 120, notes: 'C — 4×6 force delts · transfert wall balls' },
              ]},
            { name: 'D — Isolation Pec Bas + Delts',
              exercises: [
                { id: 'cable_crossover_high', sets: 3, reps: '12-15', rest: 60, notes: 'D1 — ISOLATION bas du pec · squeeze 2s' },
                { id: 'lateral_raise', sets: 3, reps: '15', rest: 45, notes: 'D2 — Delts médians · charge légère volume' },
              ]},
            { name: 'E — Prehab épaules',
              exercises: [
                { id: 'face_pull', sets: 3, reps: '15', rest: 45, notes: 'Santé épaule · rotation externe' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements pecs, épaules, thoracique — 5 min',
        },
        // ═══ JOUR 2 (MAR) — PULL FORCE + CARRIES ═══
        {
          label: 'Pull Force + Grip + Carries',
          focus: 'Deadlift 3×5 + Chin-Up lesté + Row 8-12 + biceps + farmers (grip Hyrox)',
          warmup: '5 min rameur + activation dos + séries progressives DL (50%, 70%)',
          blocks: [
            { name: 'A — Deadlift (compound force)',
              exercises: [
                { id: 'deadlift', sets: 3, reps: '5', rest: 180, notes: 'A — 3×5 force · repos 3 min · technique parfaite avant charge' },
              ]},
            { name: 'B — Vertical Pull (force + hypertrophie)',
              exercises: [
                { id: 'weighted_chin_up', sets: 4, reps: '6-8', rest: 120, notes: 'B1 — Ceinture lestée · compound clé pour la force de tirage' },
                { id: 'lat_pulldown', sets: 3, reps: '12', rest: 75, notes: 'B2 — Volume dos, prise large' },
              ]},
            { name: 'C — Horizontal Row (hypertrophie 8-12)',
              exercises: [
                { id: 'barbell_row', sets: 4, reps: '8', rest: 90, notes: 'C1 — Épaisseur dos · dos droit' },
                { id: 'seated_row', sets: 3, reps: '12', rest: 60, notes: 'C2 — Volume additionnel · squeeze omoplates' },
              ]},
            { name: 'D — Biceps (isolation 8-12)',
              exercises: [
                { id: 'bicep_curl', sets: 3, reps: '10', rest: 60, notes: 'D1 — Coudes fixes · contrôle descente' },
                { id: 'hammer_curl', sets: 3, reps: '12', rest: 60, notes: 'D2 — Brachioradial (grip)' },
              ]},
            { name: 'E — Grip Hyrox',
              exercises: [
                { id: 'farmers_carry', sets: 3, reps: '60m', rest: 90, notes: 'Race weight · pas courts et rapides' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements dos, biceps, avant-bras — 5 min',
        },
        // ═══ JOUR 3 (MER) — LEGS FORCE + HYROX STATIONS ═══
        {
          label: 'Legs Force + Hyrox Stations',
          focus: 'Squat 5×5 + RDL + Hip Thrust + Sled Push + Wall Balls — force jambes + spé Hyrox',
          warmup: '5 min rameur + mobilité hanches/chevilles + séries progressives squat (50%, 70%)',
          blocks: [
            { name: 'A — Back Squat (compound force)',
              exercises: [
                { id: 'back_squat', sets: 5, reps: '5', rest: 180, notes: 'A — 5×5 force · repos 3 min · technique > charge' },
              ]},
            { name: 'B — Hip Hinge (force + hypertrophie)',
              exercises: [
                { id: 'rdl', sets: 4, reps: '8', rest: 120, notes: 'B1 — Ischios hypertrophie · sentir étirement' },
                { id: 'hip_thrust', sets: 4, reps: '10', rest: 90, notes: 'B2 — Fessiers · pause 2s en haut' },
              ]},
            { name: 'C — Unilateral (hypertrophie)',
              exercises: [
                { id: 'bulgarian_split', sets: 3, reps: '10', rest: 60, notes: 'Par jambe · charge légère volume' },
              ]},
            { name: '🏁 D — Hyrox Stations (spé race)',
              exercises: [
                { id: 'sled_push_heavy', sets: 4, reps: '25m', rest: 120, notes: 'D1 — Race weight · 25m = demi course · pas courts' },
                { id: 'wall_ball', sets: 3, reps: '20', rest: 60, notes: 'D2 — Transfert direct front squat + OHP' },
              ]},
            { name: 'E — Mollets + Prehab',
              exercises: [
                { id: 'calf_raise', sets: 3, reps: '15', rest: 45, notes: 'Propulsion course + prehab' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements quads, ischios, hanches, mollets — 8 min',
        },
        // ═══ JOUR 4 (JEU) — PUSH+PULL VOLUME HYPERTROPHIE ═══
        {
          label: 'Push+Pull Volume Hypertrophie',
          focus: '2e passage push+pull en 8-12 reps : incline, dips (encore), rows volume, delts, bras',
          warmup: '5 min SkiErg + mobilité épaules + activation dos',
          blocks: [
            { name: 'A — Incline Bench (haut pec)',
              exercises: [
                { id: 'incline_bench', sets: 4, reps: '8', rest: 120, notes: 'A — Équilibre bas/haut pec (bas travaillé J1) · 8 reps' },
              ]},
            { name: '💪 B — Focus Pec Bas volume (2e passage)',
              exercises: [
                { id: 'decline_db_press', sets: 4, reps: '10', rest: 90, notes: 'B1 — 2e passage semaine · squeeze en haut · volume bas du pec' },
                { id: 'db_row', sets: 4, reps: '10', rest: 90, notes: 'B2 — Antagoniste dos épaisseur' },
              ]},
            { name: '💪 C — Cable Crossover volume (2e passage isolation)',
              exercises: [
                { id: 'cable_crossover_high', sets: 3, reps: '15', rest: 45, notes: 'C — Isolation bas du pec · 2e passage semaine · squeeze 3s' },
              ]},
            { name: 'C — Vertical Push + Pull volume',
              exercises: [
                { id: 'db_ohp', sets: 3, reps: '10', rest: 75, notes: 'C1 — Delts hypertrophie · stabilisation' },
                { id: 'pull_ups', sets: 3, reps: 'AMRAP', rest: 75, notes: 'C2 — Max reps sans lest · endurance dos' },
              ]},
            { name: 'D — Isolation bras (hypertrophie)',
              exercises: [
                { id: 'lateral_raise', sets: 4, reps: '15', rest: 45, notes: 'D1 — Delts médians · charge légère squeeze' },
                { id: 'tricep_pushdown', sets: 3, reps: '12', rest: 45, notes: 'D2 — Triceps volume' },
                { id: 'bicep_curl', sets: 3, reps: '12', rest: 45, notes: 'D3 — Biceps 2e passage semaine' },
              ]},
            { name: 'E — Prehab',
              exercises: [
                { id: 'face_pull', sets: 3, reps: '15', rest: 45, notes: 'Rotation externe · santé épaule' },
              ]},
          ],
          finisher: '',
          cooldown: 'Étirements bras, épaules, pecs — 5 min',
        },
        // ═══ JOUR 5 (VEN) — LEGS VOLUME + HYROX CONDITIONING ═══
        {
          label: 'Legs Volume + Hyrox Conditioning',
          focus: '2e passage jambes en volume + circuit Hyrox complet : sandbag, BBJ, thruster, KB',
          warmup: '5 min rameur + 10 air squats + 10 KB swings activation',
          blocks: [
            { name: 'A — Front Squat (quad hypertrophie)',
              exercises: [
                { id: 'front_squat', sets: 4, reps: '8', rest: 120, notes: 'A — 4×8 quad-focused · torse vertical (transfert wall balls)' },
              ]},
            { name: 'B — Hinge volume',
              exercises: [
                { id: 'rdl', sets: 3, reps: '10', rest: 90, notes: 'B1 — Ischios 2e passage semaine · 10 reps volume' },
                { id: 'leg_curl', sets: 3, reps: '12', rest: 60, notes: 'B2 — Isolation ischios · sentir contraction' },
              ]},
            { name: 'C — Quad volume + fessiers',
              exercises: [
                { id: 'leg_press', sets: 3, reps: '12', rest: 75, notes: 'C1 — Quad volume · amplitude complète' },
                { id: 'walking_lunge', sets: 3, reps: '20m', rest: 60, notes: 'C2 — Direct applicable lunges Hyrox' },
              ]},
            { name: '🏁 D — Circuit Hyrox (3 tours, enchaîner)',
              exercises: [
                { id: 'sandbag_lunge', sets: 3, reps: '40m', rest: 0, notes: 'D1 — Foulée longue' },
                { id: 'burpee_broad_jump', sets: 3, reps: '15m', rest: 0, notes: 'D2 — Rythme régulier' },
                { id: 'thruster', sets: 3, reps: '12', rest: 0, notes: 'D3 — Squat + press fluide' },
                { id: 'kb_swing', sets: 3, reps: '20', rest: 90, notes: 'D4 — Hip hinge explosif · repos 90s après tour' },
              ]},
          ],
          finisher: 'Tabata 4 min : 20s sprawls / 10s repos × 8 rounds',
          cooldown: 'Étirements complets + respiration — 10 min',
        },
      ]
    }
  };

  // ── Getters ───────────────────────────────────────────────
  function getAll() { return DB; }
  function getById(id) { return DB.find(e => e.id === id); }
  function getByCategory(cat) { return DB.filter(e => e.category === cat); }
  function getCategoryInfo(cat) { return CATEGORIES[cat] || { label: cat, icon: '●', color: '#888' }; }
  function getCategories() { return CATEGORIES; }

  function search(query) {
    const q = query.toLowerCase();
    return DB.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.includes(q) ||
      e.primary.some(m => m.toLowerCase().includes(q)) ||
      e.hyrox.some(h => h.includes(q)) ||
      (e.equipment && e.equipment.toLowerCase().includes(q))
    );
  }

  function getTemplate(daysPerWeek) {
    return TEMPLATES[daysPerWeek] || TEMPLATES[4];
  }

  // ── Finisher block (auto-injected end of each day) ───────────
  // Travail poignet/avant-bras uniquement (~5 min). Abdos = programme séparé quotidien.
  const FINISHER_BLOCK = {
    blockName: '🔥 Finisher Poignet + Avant-bras',
    exercises: [
      { id: 'farmers_carry', sets: 2, reps: '30m', rest: 30, notes: 'Grip max, race weight ou +4kg' },
      { id: 'wrist_curl',    sets: 2, reps: 15,    rest: 30, notes: 'Avant-bras, mouvement lent et contrôlé' },
      { id: 'dead_hang',     sets: 2, reps: '30s', rest: 45, notes: 'Grip statique — fin de séance' },
    ],
  };

  function getFinisherBlock() { return FINISHER_BLOCK; }

  // Bump when templates change so saved plans auto-regenerate on load.
  // v2 (2026-05-29) : add Focus Pec Bas blocks to push days (4j + 5j templates)
  // v3 (2026-07-02) : rewrite 5j template as Hybrid Hyrox + Muscle — each muscle
  //   hit 2×/week, force ranges (5×5) + hypertrophy ranges (8-12), Hyrox spé
  //   preserved on J3 (sled, wall balls) + J5 (sandbag, BBJ, thruster, KB).
  // v4 (2026-07-02) : remove all dips (weighted_dips) from templates —
  //   painful for athlete. Replaced by extra decline_bench + decline_db_press
  //   volume, plus an added cable_crossover_high block on J4.
  const TEMPLATES_VERSION = 4;
  function getTemplatesVersion() { return TEMPLATES_VERSION; }

  // ── 7-day rotating ABS program ───────────────────────────────
  // Format: circuit 3 rounds, ~8-10 min. Progresses by week phase.
  // Day index 0=Mon, 1=Tue, ... 6=Sun
  // Static-hold exercises capped at 60s even in Force phase
  // (expert: au-delà de 60s = endurance posturale, pas force)
  const STATIC_HOLD_IDS = new Set(['plank','hollow_hold','side_plank','copenhagen_plank']);
  const STATIC_CAP_SEC = 60;

  // 4 working days + 3 rest days (Tue/Thu récup, Sun full OFF)
  const ABS_PROGRAM = [
    {
      day: 0, theme: 'Lower abs + 🛞 Roulette',
      focus: 'Bas du ventre, transverse, anti-extension — intensif',
      format: '4 tours · 10s repos entre exos · 45s entre tours · ~10 min',
      rounds: 4,
      exercises: [
        { id: 'ab_wheel',           work: { reps: 10, scale: { reps: 6 } }, rest: 10, notes: '🛞 Genoux, amplitude max, dos NEUTRE' },
        { id: 'hanging_leg_raise',  work: { reps: 12, scale: { reps: 8 } }, rest: 10, notes: 'Rouler le bassin en haut, pas de balancier' },
        { id: 'flutter_kicks',      work: { sec: 40 }, rest: 10, notes: 'Bas du dos PLAQUÉ, jambes ~20cm sol' },
        { id: 'plank',              work: { sec: 60 }, rest: 45, notes: 'Gainage strict — fin de tour' },
      ],
    },
    {
      day: 1, rest: true, kind: 'récup',
      theme: 'Repos abdo — récup',
      focus: 'Pas de session abdo aujourd\'hui · récup active facultative (5 min dead bug + plank doux)',
      tip: 'Mobilité hanches/bassin si l\'envie y est. Sinon repos complet.',
    },
    {
      day: 2, theme: 'Obliques + Hollow',
      focus: 'Anti-rotation, copenhagen, hollow gym',
      format: '4 tours · 10s repos · 45s entre tours · ~10 min',
      rounds: 4,
      exercises: [
        { id: 'pallof_press',       work: { reps: 12, perSide: true }, rest: 10, notes: 'Résister à la rotation — tenir 2s bras tendus' },
        { id: 'side_plank',         work: { sec: 40, perSide: true }, rest: 10, notes: 'Par côté · hanches HAUTES, ligne droite' },
        { id: 'copenhagen_plank',   work: { sec: 25, perSide: true, scale: { id: 'side_plank', sec: 35, perSide: true } }, rest: 10, notes: 'Par côté · INTRODUIRE en sem 3+ — sinon scale side plank' },
        { id: 'hollow_hold',        work: { sec: 40, scale: { sec: 25 } }, rest: 45, notes: 'Bas du dos PLAQUÉ — fin de tour' },
      ],
    },
    {
      day: 3, rest: true, kind: 'récup',
      theme: 'Repos abdo — récup',
      focus: 'Pas de session abdo aujourd\'hui · facultatif : 5 min dead bug + bird dog en douceur',
      tip: 'La récup fait partie du programme. Profite.',
    },
    {
      day: 4, theme: 'Dynamic AMRAP 10 min',
      focus: 'Endurance core + cardio · conditionnement Hyrox',
      format: 'AMRAP 10 min — enchaîner sans repos, compter les tours',
      rounds: 'AMRAP',
      duration: 600,
      exercises: [
        { id: 'mountain_climber',   work: { reps: 40 }, rest: 0, notes: '20 par jambe · rapide mais hanches stables' },
        { id: 'v_up',               work: { reps: 12 }, rest: 0, notes: 'Toucher pieds' },
        { id: 'flutter_kicks',      work: { sec: 30 }, rest: 0, notes: 'Bas du dos plaqué' },
        { id: 'bicycle_crunch',     work: { reps: 24 }, rest: 0, notes: 'Coude → genou opposé' },
        { id: 'plank',              work: { sec: 30 }, rest: 0, notes: 'Reset core — fin du tour' },
      ],
    },
    {
      day: 5, theme: 'Anti-extension lourd + Roulette',
      focus: 'Roulette intense, plank lesté, hanging strict',
      format: '4 tours · 10s repos · 45s entre tours · ~10 min',
      rounds: 4,
      exercises: [
        { id: 'ab_wheel',           work: { reps: 12, scale: { reps: 8 } }, rest: 10, notes: '🛞 Pleine amplitude, contrôle parfait' },
        { id: 'hollow_hold',        work: { sec: 45 }, rest: 10, notes: 'Bas du dos plaqué — ne pas céder' },
        { id: 'plank',              work: { sec: 60 }, rest: 10, notes: 'Plank lesté (sac, plaque) si possible — CAP 60s' },
        { id: 'hanging_leg_raise',  work: { reps: 10 }, rest: 45, notes: 'STRICT · zéro balancier — fin de tour' },
      ],
    },
    {
      day: 6, rest: true, kind: 'off_total',
      theme: 'OFF TOTAL',
      focus: 'Jour de repos complet · zéro abdos · récupère.',
      tip: 'Sommeil, hydratation, repas costauds. C\'est ici qu\'on construit.',
    },
  ];

  /**
   * Get the abs session for a given date + week number.
   * Progresses reps/duration based on weekNum phase.
   */
  function getAbsSession(date, weekNum) {
    const d = date ? new Date(date) : new Date();
    // JS: Sun=0, Mon=1, ..., Sat=6. We want Mon=0 ... Sun=6.
    const dayIdx = (d.getDay() + 6) % 7;
    const base = ABS_PROGRAM[dayIdx];
    const phase = _getAbsPhase(weekNum || 1);

    // Rest day → return rest info
    if (base.rest) {
      return {
        dayIdx,
        dayLabel: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][dayIdx],
        rest: true,
        kind: base.kind,             // 'récup' | 'off_total'
        theme: base.theme,
        focus: base.focus,
        tip: base.tip || '',
        phase: phase.label,
        date: d.toISOString().slice(0, 10),
        exercises: [],
      };
    }

    const exercises = base.exercises.map(ex => {
      const info = getById(ex.id);
      const work = _progressAbsWork(ex.work, phase, ex.id);
      return {
        exerciseId: ex.id,
        name: info ? info.name : ex.id,
        category: info ? info.category : 'core',
        videoUrl: info ? info.videoUrl : null,
        work,
        rest: ex.rest,
        notes: ex.notes || '',
      };
    });

    return {
      dayIdx,
      dayLabel: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][dayIdx],
      theme: base.theme,
      focus: base.focus,
      format: base.format,
      rounds: base.rounds,
      duration: base.duration || null,
      phase: phase.label,
      exercises,
      date: d.toISOString().slice(0, 10),
    };
  }

  function _getAbsPhase(weekNum) {
    if (weekNum <= 2) return { label: 'Adaptation', repMul: 1.0, secMul: 1.0 };
    if (weekNum <= 5) return { label: 'Construction', repMul: 1.2, secMul: 1.15 };
    if (weekNum <= 8) return { label: 'Force', repMul: 1.4, secMul: 1.3 };
    return { label: 'Maintenance avancée', repMul: 1.5, secMul: 1.4 };
  }

  function _progressAbsWork(work, phase, exerciseId) {
    const result = { ...work };
    if (typeof work.reps === 'number') {
      result.reps = Math.round(work.reps * phase.repMul);
    }
    if (typeof work.sec === 'number') {
      let sec = Math.round(work.sec * phase.secMul / 5) * 5; // round to 5s
      // Expert cap: static holds cap at 60s (au-delà = endurance posturale, pas force)
      if (exerciseId && STATIC_HOLD_IDS.has(exerciseId)) {
        sec = Math.min(sec, STATIC_CAP_SEC);
      }
      result.sec = sec;
    }
    return result;
  }

  /**
   * Generate a week plan based on profile, week number, and past performance
   */
  function generateWeekPlan(profile, weekNum) {
    const template = getTemplate(profile.daysPerWeek || 4);
    const isDeload = weekNum > 1 && weekNum % 4 === 0;
    const prs = MuscuStorage.getPRs();

    // Finisher toggle (default ON)
    const settings = (typeof MuscuStorage !== 'undefined' && MuscuStorage.getSettings)
      ? MuscuStorage.getSettings() : {};
    const finisherEnabled = settings.finisherEnabled !== false;

    const plan = {
      week: weekNum,
      isDeload,
      templateName: template.name,
      templatesVersion: TEMPLATES_VERSION,
      generatedAt: new Date().toISOString(),
      days: template.days.map((day, dayIndex) => {
        const exercises = [];
        (day.blocks || []).forEach(block => {
          block.exercises.forEach(exDef => {
            const info = getById(exDef.id);
            const pr = prs[exDef.id];
            let suggestedWeight = null;
            if (pr && pr.history && pr.history.length > 0) {
              const avg = pr.history.slice(-3).reduce((s, e) => s + e.weight, 0) / Math.min(3, pr.history.length);
              suggestedWeight = Math.round(avg / 2.5) * 2.5;
            }
            if (isDeload && suggestedWeight) suggestedWeight = Math.round(suggestedWeight * 0.7 / 2.5) * 2.5;

            exercises.push({
              exerciseId: exDef.id,
              name: info ? info.name : exDef.id,
              category: info ? info.category : 'functional',
              sets: isDeload ? Math.max(2, exDef.sets - 1) : exDef.sets,
              reps: exDef.reps,
              suggestedWeight,
              restSec: exDef.rest || 60,
              notes: exDef.notes || '',
              blockName: block.name,
              isDeload,
            });
          });
        });

        // Inject finisher (poignet/avant-bras + abdos) at end of each day
        if (finisherEnabled) {
          FINISHER_BLOCK.exercises.forEach(exDef => {
            const info = getById(exDef.id);
            exercises.push({
              exerciseId: exDef.id,
              name: info ? info.name : exDef.id,
              category: info ? info.category : 'core',
              sets: isDeload ? Math.max(1, exDef.sets - 1) : exDef.sets,
              reps: exDef.reps,
              suggestedWeight: null,
              restSec: exDef.rest || 45,
              notes: exDef.notes || '',
              blockName: FINISHER_BLOCK.blockName,
              isFinisher: true,
              isDeload,
            });
          });
        }

        return {
          dayIndex,
          label: day.label,
          focus: day.focus,
          warmup: day.warmup || '',
          finisher: day.finisher || '',
          cooldown: day.cooldown || '',
          exercises,
          status: 'pending',
        };
      }),
    };
    return plan;
  }

  function _pickExercises(pool, count, preferred) {
    const result = [];
    for (const prefId of preferred) {
      if (result.length >= count) break;
      const ex = pool.find(e => e.id === prefId);
      if (ex) result.push(ex);
    }
    const remaining = pool.filter(e => !result.includes(e));
    while (result.length < count && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      result.push(remaining.splice(idx, 1)[0]);
    }
    return result;
  }

  function _prescribe(exercise, weekNum, isDeload, prs, objectives, recentSessions, dayFocus) {
    const pr = prs[exercise.id];
    const obj = objectives[exercise.id];

    let sets, reps, restSec;
    const isForce = dayFocus.toLowerCase().includes('force');
    const isVolume = dayFocus.toLowerCase().includes('volume') || dayFocus.toLowerCase().includes('endurance');
    const isExplosive = dayFocus.toLowerCase().includes('puissance') || dayFocus.toLowerCase().includes('explosif') || dayFocus.toLowerCase().includes('hyrox');

    if (exercise.category === 'core') {
      sets = 3;
      reps = (exercise.id === 'plank' || exercise.id === 'side_plank') ? '30-45s' : 12;
      restSec = 45;
    } else if (exercise.category === 'explosive') {
      sets = isExplosive ? 4 : 3;
      if (exercise.id === 'farmers_carry') reps = '30m';
      else if (exercise.id === 'burpee') reps = 10;
      else if (exercise.id === 'battle_ropes') reps = '30s';
      else if (exercise.id === 'dead_hang') reps = '30s';
      else reps = 8;
      restSec = 60;
    } else if (isForce) {
      sets = 4; reps = 6; restSec = 120;
    } else if (isVolume) {
      sets = 3; reps = 12; restSec = 60;
    } else {
      sets = 3; reps = 10; restSec = 90;
    }

    // Progressive overload: suggest weight based on history
    let suggestedWeight = null;
    if (pr && pr.history && pr.history.length > 0) {
      const lastEntries = pr.history.slice(-3);
      const avgWeight = lastEntries.reduce((s, e) => s + e.weight, 0) / lastEntries.length;

      // Check last session RPE for this exercise
      let lastRpe = null;
      for (const sess of recentSessions.slice().reverse()) {
        const exData = (sess.exercises || []).find(e => e.exerciseId === exercise.id);
        if (exData && exData.rpe) { lastRpe = exData.rpe; break; }
      }

      if (isForce) {
        // RPE-based progression
        if (lastRpe && lastRpe <= 6) {
          suggestedWeight = Math.round((avgWeight * 1.05) / 2.5) * 2.5; // +5%
        } else if (lastRpe && lastRpe <= 8) {
          suggestedWeight = Math.round((avgWeight * 1.025) / 2.5) * 2.5; // +2.5%
        } else if (lastRpe && lastRpe >= 9) {
          suggestedWeight = Math.round((avgWeight * 0.95) / 2.5) * 2.5; // -5%
        } else {
          suggestedWeight = Math.round(avgWeight / 2.5) * 2.5;
        }
      } else {
        suggestedWeight = Math.round(avgWeight / 2.5) * 2.5;
      }
    }

    // Don't exceed objective
    if (obj && obj.targetWeight && suggestedWeight) {
      suggestedWeight = Math.min(suggestedWeight, obj.targetWeight);
    }

    // Deload
    if (isDeload) {
      sets = Math.max(2, sets - 1);
      if (typeof reps === 'number') reps = Math.max(6, reps - 2);
      if (suggestedWeight) suggestedWeight = Math.round(suggestedWeight * 0.7 / 2.5) * 2.5;
    }

    const weekProgression = _getWeekProgression(weekNum);

    return { sets, reps, restSec, suggestedWeight, weekProgression, isDeload };
  }

  function _getWeekProgression(weekNum) {
    if (weekNum <= 4) return { phase: 'Adaptation', intensityPct: 70, note: 'Charges légères, focus technique' };
    if (weekNum <= 8) return { phase: 'Construction', intensityPct: 75, note: 'Augmentation progressive' };
    if (weekNum <= 12) return { phase: 'Force', intensityPct: 80, note: 'Charges modérées-lourdes' };
    if (weekNum <= 16) return { phase: 'Intensification', intensityPct: 85, note: 'Charges lourdes, volume réduit' };
    return { phase: 'Peak', intensityPct: 85, note: 'Maintien des acquis' };
  }

  // ── Hyrox relevance descriptions ─────────────────────────
  const HYROX_STATIONS = {
    sled_push:      'Sled Push (152m)',
    sled_pull:      'Sled Pull (152m)',
    burpees:        'Burpee Broad Jumps (80m)',
    rowing:         'Rameur (1000m)',
    farmers_carry:  'Farmers Carry (200m)',
    lunges:         'Sandbag Lunges (200m)',
    wall_balls:     'Wall Balls (75-100 reps)',
    skierg:         'SkiErg (1000m)',
    course:         'Course (8x1km)',
    all:            'Toutes les épreuves',
    posture:        'Posture & prévention',
    cardio:         'Cardio général',
  };

  function getHyroxRelevance(exerciseId) {
    const ex = getById(exerciseId);
    if (!ex) return [];
    return ex.hyrox.map(h => HYROX_STATIONS[h] || h);
  }

  /**
   * Find best alternative exercises for the given id.
   * Scoring : same category +10, same subcategory +5, primary-muscle overlap +3 each,
   * secondary-muscle overlap +1 each, hyrox tag overlap +2 each.
   * Returns top-N sorted by score (excludes self).
   */
  function findAlternatives(exerciseId, limit) {
    const target = getById(exerciseId);
    if (!target) return [];
    const N = limit || 6;
    const excluded = (typeof MuscuStorage !== 'undefined' && MuscuStorage.getProfile)
      ? (MuscuStorage.getProfile().excludedExercises || [])
      : [];
    const scored = DB
      .filter(e => e.id !== exerciseId && !excluded.includes(e.id))
      .map(e => {
        let score = 0;
        if (e.category === target.category) score += 10;
        if (e.subcategory && e.subcategory === target.subcategory) score += 5;
        // Primary overlap
        const primOverlap = (e.primary || []).filter(m => (target.primary || []).includes(m));
        score += primOverlap.length * 3;
        // Secondary overlap
        const secOverlap = (e.secondary || []).filter(m => (target.secondary || []).includes(m));
        score += secOverlap.length * 1;
        // Hyrox overlap
        const hyroxOverlap = (e.hyrox || []).filter(h => (target.hyrox || []).includes(h));
        score += hyroxOverlap.length * 2;
        // Different equipment = slight bonus (variety)
        if (e.equipment && target.equipment && e.equipment !== target.equipment) score += 0.5;
        // Build short reason text
        const reasons = [];
        if (primOverlap.length) reasons.push(`mêmes muscles : ${primOverlap.join(', ')}`);
        if (e.subcategory && e.subcategory === target.subcategory) reasons.push(`même type (${e.subcategory})`);
        else if (e.category === target.category) reasons.push(`même catégorie`);
        return { exo: e, score, reason: reasons.join(' · ') };
      })
      .filter(x => x.score >= 10) // must at least match category
      .sort((a, b) => b.score - a.score)
      .slice(0, N);
    return scored;
  }

  return {
    getAll, getById, getByCategory, getCategoryInfo, getCategories,
    search, getTemplate, generateWeekPlan, getHyroxRelevance, getFinisherBlock,
    getAbsSession, getTemplatesVersion, findAlternatives,
    HYROX_STATIONS, DB,
  };
})();
