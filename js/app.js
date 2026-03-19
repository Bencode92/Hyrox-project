/* HyroxForge — App v5 — Expert validated + GitHub sync */
const App = {
  currentTab: 'dashboard',
  init() {
    this.switchTab('dashboard'); this.refreshDashboard(); LogForm.init();
    document.getElementById('logDate').valueAsDate = new Date();
    const s = Storage.getSettings();
    if (!s.workerUrl) { s.workerUrl = AICoach.PROXY; Storage.saveSettings(s); }
    document.getElementById('settingsWorkerUrl').value = s.workerUrl;
    document.getElementById('settingsGoalSpeed').value = s.goalSpeed;
    document.getElementById('settingsCompDate').value = s.compDate || '';
    document.getElementById('settingsWeight').value = s.weight || '';
    if (!Training.hasTests()) document.getElementById('onboarding').classList.remove('hidden');
    this.renderZones(); this.renderWeekPlan();
  },

  saveOnboarding() {
    const testType = document.querySelector('input[name="testType"]:checked');
    const type = testType ? testType.value : '1km';
    let runSpeed;
    if (type === 'demicooper') {
      const dist = parseFloat(document.getElementById('obCooperDist').value) || 1200;
      runSpeed = Training.demiCooperToVMA(dist);
    } else {
      runSpeed = parseFloat(document.getElementById('obRunSpeed').value) || 12;
    }
    const rw = Training.parseTime(document.getElementById('obRowMin').value, document.getElementById('obRowSec').value) || 270;
    const sk = Training.parseTime(document.getElementById('obSkiMin').value, document.getElementById('obSkiSec').value) || 270;
    const data = Training.saveTestResults(runSpeed, rw, sk, type);
    document.getElementById('onboarding').classList.add('hidden');
    const label = type === 'demicooper' ? 'demi-Cooper' : 'test 1km \u00d7 0.95';
    this.toast('VMA: ' + data.run.vma + ' km/h (' + label + ')', 'success');
    this.renderZones(); this.renderWeekPlan(); this.refreshDashboard();
  },

  renderZones() {
    const z = Training.getZonesSummary();
    if (!z) { document.getElementById('zonesCard').style.display = 'none'; return; }
    document.getElementById('zonesCard').style.display = 'block';
    const r = z.run, w = Training.getCurrentWeek();
    const maxSess = Training.getMaxSessionsPerWeek(w);
    const rowPhase = Training.getRowPhaseLabel(w);
    const dl = Training.isDeloadWeek(w)
      ? '<div style="padding:5px 8px;background:rgba(240,160,48,.12);border-radius:6px;color:#f0a030;font-weight:600;font-size:11px">\u26a1 D\u00c9CHARGE sem '+(w+1)+'</div>'
      : '<div style="padding:5px 8px;background:var(--bg-input);border-radius:6px;color:var(--text-muted);font-size:11px">Sem '+(w+1)+' \u2014 '+maxSess+' s\u00e9ances max</div>';
    document.getElementById('zonesContent').innerHTML='<div style="display:grid;gap:4px;font-size:11px">'+dl+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--accent-dim);border-radius:6px"><span style="color:var(--accent)">\ud83c\udfc3 VMA</span><span style="font-weight:600">'+r.vma+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Z2</span><span>'+Training.fmtS(r.z2.min)+'-'+Training.fmtS(r.z2.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Tempo</span><span>'+Training.fmtS(r.tempo.min)+'-'+Training.fmtS(r.tempo.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>Frac court</span><span>'+Training.fmtS(r.iv_short.min)+'-'+Training.fmtS(r.iv_short.max)+' km/h</span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>\ud83d\udea3 Row</span><span>'+Training.fmtP(z.row.testPace500)+'/500m \u2014 <em>'+rowPhase+'</em></span></div>'+
      '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--bg-input);border-radius:6px"><span>\u26f7\ufe0f Ski</span><span>'+Training.fmtP(z.ski.testPace500)+'/500m</span></div>'+
    '</div>';
  },

  renderWeekPlan() {
    const zones = Training.getZonesSummary();
    if (!zones) { document.getElementById('planCard').style.display='none'; return; }
    document.getElementById('planCard').style.display='block';
    const week = Training.getCurrentWeek();
    let plan = Planner.getSavedPlan();
    if (!plan) { plan = Planner.generate(zones, week); Planner.savePlan(plan); }
    const today = new Date().getDay(), todayIdx = today===0?6:today-1;
    document.getElementById('planDays').innerHTML = plan.map((d,i) => {
      const isToday=i===todayIdx, emoji=d.slot==='rest'?'\ud83d\udca4':d.exerciseType==='run'?'\ud83c\udfc3':d.exerciseType==='row'?'\ud83d\udea3':'\u26f7\ufe0f';
      const title=d.session?d.session.title:d.label, meta=d.session&&d.session.details?Object.values(d.session.details).slice(0,2).join(' \u00b7 '):(d.slot==='rest'?'R\u00e9cup':'');
      const cls=(isToday?' today':'')+(d.done?' done':'')+(d.slot==='rest'?' rest':'');
      const oc=d.session?' onclick="App.openPlanSession('+i+')"':'';
      return '<div class="plan-day'+cls+'"'+oc+'><div class="plan-day-name'+(isToday?' today-name':'')+'">'+d.day.slice(0,3)+'</div><div class="plan-day-badge">'+emoji+'</div><div class="plan-day-info"><div class="plan-day-title">'+title+'</div><div class="plan-day-meta">'+meta+'</div></div>'+(d.done?'<div class="plan-day-check">\u2713</div>':'')+'</div>';
    }).join('');
  },

  regeneratePlan() {
    const z=Training.getZonesSummary(); if(!z)return;
    Planner.savePlan(Planner.generate(z,Training.getCurrentWeek())); this.renderWeekPlan(); this.toast('Plan r\u00e9g\u00e9n\u00e9r\u00e9','info');
  },
  openPlanSession(idx) {
    const plan=Planner.getSavedPlan(); if(!plan||!plan[idx]||!plan[idx].session)return;
    const d=plan[idx]; this.switchTab('log'); LogForm.setType(d.exerciseType);
    setTimeout(()=>{document.getElementById('logSessionType').value=d.sessionType;LogForm.updateSessionTypeUI();LogForm.showSuggestion();},100);
  },

  switchTab(tab) {
    this.currentTab=tab;
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='dashboard'){this.refreshDashboard();this.renderWeekPlan();}
    if(tab==='history')this.refreshHistory();
    if(tab==='log')LogForm.showSuggestion();
  },

  refreshDashboard() {
    const sc=Scoring.computeGlobal(); Charts.drawScoreRing(sc.global);
    document.getElementById('globalScore').textContent=sc.global;
    const h=Storage.getScoreHistory(),te=document.getElementById('scoreTrend');
    if(h.length>=2){const d=sc.global-h[h.length-2].global;te.className='score-trend '+(d>0?'trend-up':d<0?'trend-down':'trend-stable');te.textContent=(d>0?'+':'')+d+' pts';}else te.textContent='';
    const p=sc.pillars;
    document.getElementById('runScore').innerHTML=p.run.weighted+'<small>/'+p.run.max+'</small>';
    document.getElementById('rowScore').innerHTML=p.row.weighted+'<small>/'+p.row.max+'</small>';
    document.getElementById('skiScore').innerHTML=p.ski.weighted+'<small>/'+p.ski.max+'</small>';
    document.getElementById('runDetail').textContent=p.run.speedKmh?p.run.speedKmh.toFixed(1)+' km/h':'--';
    document.getElementById('rowDetail').textContent=p.row.pace?Scoring.formatPace(p.row.pace)+'/1000m':'--';
    document.getElementById('skiDetail').textContent=p.ski.pace?Scoring.formatPace(p.ski.pace)+'/1000m':'--';
    const ws=Storage.getSessionsThisWeek();
    document.getElementById('weekSessions').textContent=ws.length;
    document.getElementById('weekDistance').textContent=ws.reduce((a,s)=>a+(s.distance||0),0).toFixed(1);
    document.getElementById('weekTime').textContent=Math.round(ws.reduce((a,s)=>a+(s.duration||0),0));
    document.getElementById('weekRPE').textContent=ws.length?(ws.reduce((a,s)=>a+(s.rpe||0),0)/ws.length).toFixed(1):'--';
    Charts.renderProgressChart(); this.renderZones();
  },

  refreshHistory(f){f=f||'all';Charts.renderHistoryChart(f);this.renderSessionList(f);},
  renderSessionList(f) {
    const c=document.getElementById('sessionList'),ss=f==='all'?Storage.getSessions():Storage.getSessionsByType(f);
    if(!ss.length){c.innerHTML='<div class="empty-state">Aucune s\u00e9ance</div>';return;}
    c.innerHTML=ss.slice(0,50).map(s=>{const sc=Scoring.scoreSession(s),dt=Scoring.computeDelta(s),d=new Date(s.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),st=Scoring.getSessionTypeLabel(s.sessionType),pc=s.pace?Scoring.formatPace(s.pace):'\u2014',u=s.type==='run'?'/km':'/500m';let dh='';if(dt)dh='<span class="session-delta '+(dt.improved?'delta-up':'delta-down')+'">'+(dt.improved?'':'+')+dt.seconds.toFixed(0)+'s</span>';return '<div class="session-item"><div class="session-type-badge badge-'+s.type+'">'+Scoring.getTypeEmoji(s.type)+'</div><div class="session-info"><div class="session-main"><span class="session-title">'+st+'</span><span class="session-score">'+(sc!=null?sc:'\u2014')+'</span></div><div class="session-meta">'+d+' \u00b7 '+(s.distance?s.distance+'km ':'')+pc+u+' \u00b7 RPE '+s.rpe+' '+dh+'</div></div></div>';}).join('');
  },

  openSettings(){
    document.getElementById('settingsModal').classList.remove('hidden');
    const el=document.getElementById('aiStatus');
    if(el){const url=Storage.getSettings().workerUrl||AICoach.PROXY;el.innerHTML=url.includes('workers.dev')?'<span style="color:var(--accent-2)">\u2713 Connect\u00e9</span>':'<span style="color:var(--accent-red)">\u2717 Non connect\u00e9</span>';}
    if(typeof updateGHStatus==='function')updateGHStatus();
  },
  closeSettings(){document.getElementById('settingsModal').classList.add('hidden');},
  saveSettings(){Storage.saveSettings({workerUrl:document.getElementById('settingsWorkerUrl').value.trim(),goalSpeed:parseFloat(document.getElementById('settingsGoalSpeed').value)||15,compDate:document.getElementById('settingsCompDate').value,weight:parseFloat(document.getElementById('settingsWeight').value)||75});this.closeSettings();this.toast('Sauvegard\u00e9','success');},
  resetData(){if(confirm('Supprimer toutes les donn\u00e9es ?')){Storage.resetAll();location.reload();}},
  toast(m,t){const c=document.getElementById('toastContainer'),e=document.createElement('div');e.className='toast toast-'+(t||'info');e.textContent=m;c.appendChild(e);setTimeout(()=>e.remove(),3000);},
};

/* ===== LOG FORM ===== */
const LogForm = {
  type:'run',location:'outdoor',
  init(){this.updateRPE(5);this.updatePain(0);this.updateFormForType();},
  setType(t){this.type=t;document.querySelectorAll('.type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===t));this.updateFormForType();this.showSuggestion();},
  updateFormForType(){
    const dl=document.getElementById('distanceLabel'),lt=document.getElementById('locationToggle');
    if(this.type==='run'){dl.textContent='Distance (km)';lt.parentElement.classList.remove('hidden');}else{dl.textContent='Distance (m)';lt.parentElement.classList.add('hidden');this.location='gym';}
    const sel=document.getElementById('logSessionType');
    const opts={run:['z2','tempo','intervals_short','intervals_long','long_run','fartlek','fartlek_hyrox','brick','test'],row:['technique','endurance','racePace','power','test'],ski:['technique','endurance','racePace','power','test']};
    const lbl={z2:'Zone 2',tempo:'Tempo',intervals_short:'Frac court',intervals_long:'Frac long',long_run:'Sortie longue',fartlek:'Fartlek',fartlek_hyrox:'Fartlek Hyrox \ud83d\udd25',brick:'Brick Ergo+Run \ud83e\uddf1',technique:'Technique',power:'Puissance',endurance:'Endurance',racePace:'Race Pace \ud83c\udfc1',test:'Test'};
    sel.innerHTML=opts[this.type].map(o=>'<option value="'+o+'">'+(lbl[o]||o)+'</option>').join('');
    this.updateSessionTypeUI();
  },
  updateSessionTypeUI(){const st=document.getElementById('logSessionType').value;document.getElementById('intervalsDetail').classList.toggle('hidden',st!=='intervals_short'&&st!=='intervals_long');},
  setLocation(l){this.location=l;document.querySelectorAll('#locationToggle .toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===l));},
  updateRPE(v){document.getElementById('rpeValue').textContent=v;document.getElementById('rpeLabel').textContent=Scoring.getRPELabel(parseInt(v));},
  updatePain(v){document.getElementById('painValue').textContent=v;document.getElementById('painLabel').textContent=Scoring.getPainLabel(parseInt(v));},
  toggleVest(){document.getElementById('vestWeight').classList.toggle('hidden',!document.getElementById('logVest').checked);},
  showSuggestion(){
    const box=document.getElementById('sessionSuggestion');
    if(!Training.hasTests()){box.style.display='none';return;}
    const z=Training.getZonesSummary(),st=document.getElementById('logSessionType').value,w=Training.getCurrentWeek();
    let ss;if(this.type==='run')ss=Training.generateRunSession(st,z.run,w);else ss=Training.generateErgoSession(st,z[this.type],this.type,w);
    if(!ss||!ss.main){box.style.display='none';return;}
    box.style.display='block';
    let dh='';if(ss.details){dh='<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:11px;margin-top:6px">';for(const[k,v]of Object.entries(ss.details))dh+='<span style="color:var(--text-muted)">'+k.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())+'</span><span style="font-weight:500">'+v+'</span>';dh+='</div>';}
    box.innerHTML='<div style="background:var(--bg-card);border:1px solid var(--accent-dim);border-left:3px solid var(--accent);border-radius:var(--radius-md);padding:10px;margin-bottom:14px"><div style="font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--accent);margin-bottom:4px">\u26a1 '+ss.title+'</div><div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px"><b>\u00c9chauff:</b> '+(ss.warmup||'')+'</div><div style="font-size:12px;color:var(--text-primary);line-height:1.4;font-weight:500">'+ss.main+'</div>'+dh+'<div style="font-size:11px;color:var(--text-secondary);margin-top:3px"><b>Retour:</b> '+(ss.cooldown||'')+'</div>'+(ss.tip?'<div style="margin-top:6px;padding:6px 8px;background:var(--accent-dim);border-radius:5px;font-size:11px;color:var(--accent)">\ud83d\udca1 '+ss.tip+'</div>':'')+'</div>';
  },
  save(){
    const date=document.getElementById('logDate').value,st=document.getElementById('logSessionType').value,dr=parseFloat(document.getElementById('logDistance').value),mn=parseInt(document.getElementById('logMin').value)||0,sc=parseInt(document.getElementById('logSec').value)||0,rpe=parseInt(document.getElementById('logRPE').value),pain=parseInt(document.getElementById('logPain').value),vest=document.getElementById('logVest').checked,vkg=vest?parseFloat(document.getElementById('logVestKg').value)||0:0,notes=document.getElementById('logNotes').value.trim(),reps=parseInt(document.getElementById('logReps').value)||null,rd=parseInt(document.getElementById('logRepDistance').value)||null,rs=parseInt(document.getElementById('logRest').value)||null;
    if(!date){App.toast('Date','error');return;}if(!dr||dr<=0){App.toast('Distance','error');return;}if(mn===0&&sc===0){App.toast('Dur\u00e9e','error');return;}
    const dm=mn+sc/60,ds=mn*60+sc;let dist,pace,spd;
    if(this.type==='run'){dist=dr;pace=ds/dist;spd=dist/(dm/60);}else{dist=dr/1000;pace=ds/(dr/500);spd=(dr/1000)/(dm/60);}
    const session={date,type:this.type,sessionType:st,location:this.location,distance:Math.round(dist*100)/100,duration:Math.round(dm*100)/100,durationSec:ds,pace:Math.round(pace*10)/10,speedKmh:Math.round(spd*100)/100,rpe,pain,vest,vestKg:vkg,reps,repDistance:rd,restSec:rs,notes};
    const saved=Storage.saveSession(session);const gs=Scoring.computeGlobal();
    Storage.addScoreSnapshot({global:gs.global,run:gs.breakdown.run,row:gs.breakdown.row,ski:gs.breakdown.ski});
    App.toast('Score: '+Scoring.scoreSession(saved)+'/100','success');
    AICoach.analyzeSession(saved);
    ['logDistance','logMin','logSec','logNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('logVest').checked=false;document.getElementById('vestWeight').classList.add('hidden');
    document.getElementById('logRPE').value=5;this.updateRPE(5);document.getElementById('logPain').value=0;this.updatePain(0);
    App.refreshDashboard();App.renderWeekPlan();
  },
};

const History={filter(t){document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===t));App.refreshHistory(t);}};
document.addEventListener('DOMContentLoaded',()=>App.init());
