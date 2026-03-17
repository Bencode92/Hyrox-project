/* HyroxForge — Charts (Chart.js) */
const Charts = {
  instances: {},
  colors: { coral: '#e85d3a', coralDim: 'rgba(232,93,58,0.3)', teal: '#2dd4a8', tealDim: 'rgba(45,212,168,0.3)', blue: '#4d8ef7', blueDim: 'rgba(77,142,247,0.3)', amber: '#f0a030', text: '#8a8a96', grid: 'rgba(255,255,255,0.05)' },
  defaults: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a8a96', font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: '#8a8a96', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } },

  drawScoreRing(score) {
    const canvas = document.getElementById('scoreRing');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr; canvas.height = 180 * dpr; ctx.scale(dpr, dpr);
    const cx = 90, cy = 90, r = 75, lineWidth = 10;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * Math.min(score, 100) / 100);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = lineWidth; ctx.stroke();
    if (score > 0) {
      const grad = ctx.createLinearGradient(0, 0, 180, 180);
      grad.addColorStop(0, this.colors.coral); grad.addColorStop(1, this.colors.amber);
      ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = grad; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.stroke();
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
        { label: 'Score global', data: history.map(h => h.global), borderColor: this.colors.coral, backgroundColor: this.colors.coralDim, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: this.colors.coral },
        { label: 'Run', data: history.map(h => h.run || 0), borderColor: this.colors.amber, borderDash: [4, 4], tension: 0.4, pointRadius: 0 },
        { label: 'Row', data: history.map(h => h.row || 0), borderColor: this.colors.blue, borderDash: [4, 4], tension: 0.4, pointRadius: 0 },
      ] },
      options: { ...this.defaults, scales: { ...this.defaults.scales, y: { ...this.defaults.scales.y, min: 0, max: 100 } } },
    });
  },

  renderHistoryChart(filter = 'all') {
    const allSessions = Storage.getSessions().slice().reverse();
    const sessions = filter === 'all' ? allSessions : allSessions.filter(s => s.type === filter);
    if (sessions.length < 1) { this.destroyChart('historyChart'); return; }
    const labels = sessions.map(s => new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    const speedData = sessions.map(s => s.speedKmh || null);
    const typeColors = sessions.map(s => s.type === 'run' ? this.colors.coral : s.type === 'row' ? this.colors.blue : this.colors.teal);
    this.destroyChart('historyChart');
    this.instances.historyChart = new Chart(document.getElementById('historyChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Vitesse (km/h)', data: speedData, backgroundColor: typeColors.map(c => c + '80'), borderColor: typeColors, borderWidth: 1, borderRadius: 4 }] },
      options: { ...this.defaults, plugins: { ...this.defaults.plugins, tooltip: { callbacks: { label(ctx) { const s = sessions[ctx.dataIndex]; const pace = s.pace ? Scoring.formatPace(s.pace) : '\u2014'; const speed = s.speedKmh ? s.speedKmh.toFixed(1) + ' km/h' : '\u2014'; return `${Scoring.getTypeName(s.type)}: ${speed} (${pace}/${s.type === 'run' ? 'km' : '500m'})`; } } } }, scales: { ...this.defaults.scales, y: { ...this.defaults.scales.y, title: { display: true, text: 'km/h', color: '#8a8a96', font: { size: 11 } } } } },
    });
  },

  destroyChart(id) { if (this.instances[id]) { this.instances[id].destroy(); this.instances[id] = null; } },
};
