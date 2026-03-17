/* HyroxForge — Charts (Electric Blue) */
const Charts = {
  instances: {},
  colors: { accent: '#00a8ff', accentDim: 'rgba(0,168,255,0.3)', teal: '#00d4aa', tealDim: 'rgba(0,212,170,0.3)', purple: '#8b5cf6', purpleDim: 'rgba(139,92,246,0.3)', amber: '#f0a030', text: '#8892a8', grid: 'rgba(0,168,255,0.06)' },
  defaults: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8892a8', font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: '#8892a8', font: { size: 11 } }, grid: { color: 'rgba(0,168,255,0.06)' } } } },

  drawScoreRing(score) {
    const canvas = document.getElementById('scoreRing');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    const cx = size/2, cy = size/2, r = 65, lineWidth = 8;
    ctx.clearRect(0, 0, size, size);
    /* bg ring */
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,168,255,0.1)'; ctx.lineWidth = lineWidth; ctx.stroke();
    if (score > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * Math.min(score, 100) / 100);
      ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = '#00a8ff'; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.stroke();
    }
  },

  renderProgressChart() {
    const history = Storage.getScoreHistory().slice(-28);
    if (history.length < 2) { this.destroyChart('progressChart'); return; }
    const labels = history.map(h => new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    this.destroyChart('progressChart');
    this.instances.progressChart = new Chart(document.getElementById('progressChart'), {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Score global', data: history.map(h => h.global), borderColor: this.colors.accent, backgroundColor: this.colors.accentDim, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: this.colors.accent },
        { label: 'Run', data: history.map(h => h.run || 0), borderColor: this.colors.amber, borderDash: [4, 4], tension: 0.4, pointRadius: 0 },
        { label: 'Row', data: history.map(h => h.row || 0), borderColor: this.colors.teal, borderDash: [4, 4], tension: 0.4, pointRadius: 0 },
      ] },
      options: { ...this.defaults, scales: { ...this.defaults.scales, y: { ...this.defaults.scales.y, min: 0, max: 100 } } },
    });
  },

  renderHistoryChart(filter) {
    filter = filter || 'all';
    const allSessions = Storage.getSessions().slice().reverse();
    const sessions = filter === 'all' ? allSessions : allSessions.filter(s => s.type === filter);
    if (sessions.length < 1) { this.destroyChart('historyChart'); return; }
    const labels = sessions.map(s => new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    const speedData = sessions.map(s => s.speedKmh || null);
    const typeColors = sessions.map(s => s.type === 'run' ? this.colors.accent : s.type === 'row' ? this.colors.teal : this.colors.purple);
    this.destroyChart('historyChart');
    this.instances.historyChart = new Chart(document.getElementById('historyChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Vitesse (km/h)', data: speedData, backgroundColor: typeColors.map(c => c + '80'), borderColor: typeColors, borderWidth: 1, borderRadius: 4 }] },
      options: { ...this.defaults, plugins: { ...this.defaults.plugins, tooltip: { callbacks: { label(ctx) { const s = sessions[ctx.dataIndex]; const pace = s.pace ? Scoring.formatPace(s.pace) : '\u2014'; const speed = s.speedKmh ? s.speedKmh.toFixed(1) + ' km/h' : '\u2014'; return Scoring.getTypeName(s.type) + ': ' + speed + ' (' + pace + '/' + (s.type === 'run' ? 'km' : '500m') + ')'; } } } }, scales: { ...this.defaults.scales, y: { ...this.defaults.scales.y, title: { display: true, text: 'km/h', color: '#8892a8', font: { size: 11 } } } } },
    });
  },

  destroyChart(id) { if (this.instances[id]) { this.instances[id].destroy(); this.instances[id] = null; } },
};
