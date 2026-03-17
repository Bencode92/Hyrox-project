/* HyroxForge — Scoring Algorithm */
const Scoring = {
  TABLES: {
    run: [[212,100],[240,92],[257,85],[281,78],[300,70],[330,60],[360,50],[420,35],[480,20],[600,5]],
    row: [[190,100],[210,85],[230,70],[250,60],[270,50],[300,40],[330,30],[390,15]],
    ski: [[200,100],[220,85],[240,70],[260,60],[270,50],[300,40],[330,25],[390,10]],
  },
  WEIGHTS: { run: 50, row: 25, ski: 25 },
  interpolate(table, value) {
    if (value <= table[0][0]) return table[0][1];
    if (value >= table[table.length-1][0]) return table[table.length-1][1];
    for (let i = 0; i < table.length-1; i++) {
      const [t1,s1] = table[i], [t2,s2] = table[i+1];
      if (value >= t1 && value <= t2) return Math.round(s1 + (value-t1)/(t2-t1) * (s2-s1));
    }
    return 0;
  },
  scoreSession(session) {
    const table = this.TABLES[session.type];
    if (!table || !session.pace) return null;
    let rawScore = this.interpolate(table, session.pace);
    if (session.vest && session.vestKg > 0) rawScore = Math.min(100, rawScore + Math.min(session.vestKg*0.5, 5));
    return Math.round(rawScore);
  },
  getBestRecentByType(type) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-28);
    const sessions = Storage.getSessionsByType(type).filter(s => new Date(s.date) >= cutoff);
    if (!sessions.length) return null;
    let bestScore = 0, bestSession = null;
    sessions.forEach(s => { const score = this.scoreSession(s); if (score !== null && score > bestScore) { bestScore = score; bestSession = s; } });
    return bestSession ? { score: bestScore, session: bestSession } : null;
  },
  computePillarScores() {
    const result = {};
    ['run','row','ski'].forEach(type => {
      const best = this.getBestRecentByType(type), maxPts = this.WEIGHTS[type];
      result[type] = best ? { raw: best.score, weighted: Math.round(best.score*maxPts/100), max: maxPts, pace: best.session.pace, speedKmh: best.session.speedKmh } : { raw: 0, weighted: 0, max: maxPts, pace: null, speedKmh: null };
    });
    return result;
  },
  computeGlobal() {
    const pillars = this.computePillarScores();
    let base = pillars.run.weighted + pillars.row.weighted + pillars.ski.weighted, bonus = 0;
    const allSessions = Storage.getSessions();
    const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate()-28);
    if (allSessions.filter(s => new Date(s.date) >= fourWeeksAgo).length >= 12) bonus += 3;
    const scoreHistory = Storage.getScoreHistory();
    if (scoreHistory.length >= 4) {
      const recent = scoreHistory.slice(-2).reduce((a,b) => a+b.global,0)/2;
      const older = scoreHistory.slice(-6,-2).reduce((a,b) => a+b.global,0)/Math.min(4, scoreHistory.slice(-6,-2).length||1);
      if (recent > older) bonus += 2;
    }
    const last3 = allSessions.slice(0,3);
    if (last3.length === 3 && last3.every(s => s.rpe >= 9)) bonus -= 5;
    const global = Math.max(0, Math.min(100, base+bonus));
    return { global, pillars, bonus, breakdown: { run: pillars.run.weighted, row: pillars.row.weighted, ski: pillars.ski.weighted, bonus } };
  },
  getRPELabel(rpe) { return {1:'Très facile',2:'Facile',3:'Léger',4:'Modéré-',5:'Modéré',6:'Modéré+',7:'Difficile',8:'Très dur',9:'Max',10:'Épuisement'}[rpe]||''; },
  getPainLabel(pain) { if(pain===0)return'Aucune';if(pain<=2)return'Légère';if(pain<=4)return'Modérée';if(pain<=6)return'Importante';if(pain<=8)return'Sévère';return'Extrême'; },
  formatPace(seconds) { const m=Math.floor(seconds/60),s=Math.round(seconds%60); return `${m}:${String(s).padStart(2,'0')}`; },
  computeDelta(currentSession) {
    const allOfType = Storage.getSessionsByType(currentSession.type);
    const prev = allOfType.find(s => s.id !== currentSession.id && new Date(s.date) < new Date(currentSession.date));
    if (!prev||!prev.pace||!currentSession.pace) return null;
    const diff = currentSession.pace - prev.pace;
    return { seconds: diff, percent: ((diff/prev.pace)*100).toFixed(1), improved: diff<0 };
  },
  getSessionTypeLabel(st) { return {z2:'Zone 2',tempo:'Tempo',intervals_short:'Fractionné court',intervals_long:'Fractionné long',long_run:'Sortie longue',technique:'Technique',power:'Puissance',endurance:'Endurance',test:'Test'}[st]||st; },
  getTypeEmoji(type) { return {run:'🏃',row:'🚣',ski:'⛷️'}[type]||'🏋️'; },
  getTypeName(type) { return {run:'Running',row:'Rowing',ski:'SkiErg'}[type]||type; },
};
