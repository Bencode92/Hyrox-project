/* HyroxForge — Charts v3 */
const Charts = {
  instances: {},
  colors: { accent:'#00a8ff', accentDim:'rgba(0,168,255,.3)', teal:'#00d4aa', purple:'#8b5cf6', amber:'#f0a030', text:'#8892a8', grid:'rgba(0,168,255,.06)' },
  defaults: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#8892a8',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#8892a8',font:{size:10}},grid:{color:'rgba(0,168,255,.06)'}}} },
  drawScoreRing(score) {
    const canvas=document.getElementById('scoreRing');if(!canvas)return;
    const ctx=canvas.getContext('2d'),size=140,dpr=window.devicePixelRatio||1;
    canvas.width=size*dpr;canvas.height=size*dpr;canvas.style.width=size+'px';canvas.style.height=size+'px';ctx.scale(dpr,dpr);
    const cx=size/2,cy=size/2,r=58,lw=7;ctx.clearRect(0,0,size,size);
    ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.strokeStyle='rgba(0,168,255,.1)';ctx.lineWidth=lw;ctx.stroke();
    if(score>0){ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+2*Math.PI*Math.min(score,100)/100);ctx.strokeStyle='#00a8ff';ctx.lineWidth=lw;ctx.lineCap='round';ctx.stroke();}
  },
  renderProgressChart(){
    const h=Storage.getScoreHistory().slice(-28);if(h.length<2){this.destroyChart('progressChart');return;}
    const labels=h.map(x=>new Date(x.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}));
    this.destroyChart('progressChart');
    this.instances.progressChart=new Chart(document.getElementById('progressChart'),{type:'line',data:{labels,datasets:[{label:'Score',data:h.map(x=>x.global),borderColor:this.colors.accent,backgroundColor:this.colors.accentDim,fill:true,tension:.4,pointRadius:2,pointBackgroundColor:this.colors.accent},{label:'Run',data:h.map(x=>x.run||0),borderColor:this.colors.amber,borderDash:[4,4],tension:.4,pointRadius:0},{label:'Row',data:h.map(x=>x.row||0),borderColor:this.colors.teal,borderDash:[4,4],tension:.4,pointRadius:0}]},options:{...this.defaults,scales:{...this.defaults.scales,y:{...this.defaults.scales.y,min:0,max:100}}}});
  },
  renderHistoryChart(filter){
    filter=filter||'all';const all=Storage.getSessions().slice().reverse(),ss=filter==='all'?all:all.filter(s=>s.type===filter);
    if(ss.length<1){this.destroyChart('historyChart');return;}
    const labels=ss.map(s=>new Date(s.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})),spd=ss.map(s=>s.speedKmh||null),tc=ss.map(s=>s.type==='run'?this.colors.accent:s.type==='row'?this.colors.teal:this.colors.purple);
    this.destroyChart('historyChart');
    this.instances.historyChart=new Chart(document.getElementById('historyChart'),{type:'bar',data:{labels,datasets:[{label:'km/h',data:spd,backgroundColor:tc.map(c=>c+'80'),borderColor:tc,borderWidth:1,borderRadius:3}]},options:{...this.defaults,plugins:{...this.defaults.plugins,tooltip:{callbacks:{label(ctx){const s=ss[ctx.dataIndex],p=s.pace?Scoring.formatPace(s.pace):'\u2014',v=s.speedKmh?s.speedKmh.toFixed(1):'\u2014';return Scoring.getTypeName(s.type)+': '+v+' km/h ('+p+'/'+(s.type==='run'?'km':'500m')+')';}}}},scales:{...this.defaults.scales,y:{...this.defaults.scales.y,title:{display:true,text:'km/h',color:'#8892a8',font:{size:10}}}}}});
  },
  destroyChart(id){if(this.instances[id]){this.instances[id].destroy();this.instances[id]=null;}},
};
