
let APP;
let CRENEAUX;
let DELTAS;
let DATA_JOUR;
let DATA_GLOBALE;

async function init() {
    const response = await fetch("data.json");

    if (!response.ok) {
        throw new Error("Impossible de charger data.json");
    }

    APP = await response.json();

    CRENEAUX = APP.creneaux_labels;
    DELTAS = APP.deltas;
    DATA_JOUR = APP.data_jour;
    DATA_GLOBALE = APP.data_globale;

    renderChart1();
    renderTab2();
}

const JOURS_FR = {
  Monday:'lundi', Tuesday:'mardi', Wednesday:'mercredi', Thursday:'jeudi',
  Friday:'vendredi', Saturday:'samedi', Sunday:'dimanche'
};
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

function fmtNum(n){
  return Math.round(n).toLocaleString('fr-FR');
}
function fmtDelta(d){
  return (d>=0?'+':'') + d.toFixed(1).replace('.',',');
}
function fmtDateLong(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y,m-1,d));
  const dayName = JOURS_FR[dt.toLocaleDateString('en-US',{weekday:'long', timeZone:'UTC'})];
  return `${dayName} ${d} ${MOIS_FR[m-1]} ${y}`;
}

/* ---- thermal color scale (signature element) ---- */
function mixChannel(a,b,t){ return Math.round(a + (b-a)*t); }
function tempColor(delta){
  const stops = [ [62,143,208], [240,166,59], [229,72,77] ]; // cool -> mid -> hot
  const mid = 1.5;
  let t, c1, c2;
  if(delta<=mid){ t = delta/mid; c1=stops[0]; c2=stops[1]; }
  else { t = (delta-mid)/mid; c1=stops[1]; c2=stops[2]; }
  const r=mixChannel(c1[0],c2[0],t), g=mixChannel(c1[1],c2[1],t), b=mixChannel(c1[2],c2[2],t);
  return `rgb(${r},${g},${b})`;
}
function applyThumbColor(slider, delta){
  slider.style.setProperty('--thumb-color', tempColor(delta));
}

/* ---- closest available delta key (data has 0..10 step .5) ---- */
function deltaKey(delta){ return delta.toFixed(1); }

/* ==================== TAB SWITCHING ==================== */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ==================== TAB 1 LOGIC ==================== */
const datePicker = document.getElementById('date-picker');
const delta1Slider = document.getElementById('delta1-slider');
const delta1Value = document.getElementById('delta1-value');
const dayBadge = document.getElementById('day-badge');
const chart1Title = document.getElementById('chart1-title');
const dayTotalsEl = document.getElementById('day-totals');

let chart1;
function renderChart1(){
  const dateStr = datePicker.value;
  const delta = parseFloat(delta1Slider.value);
  const day = DATA_JOUR[dateStr];
  if(!day) return;

  delta1Value.textContent = fmtDelta(delta) + ' °C';
  delta1Value.style.color = tempColor(delta);
  applyThumbColor(delta1Slider, delta);
  dayBadge.textContent = fmtDateLong(dateStr).replace(/^./,c=>c.toUpperCase());
  chart1Title.textContent = `Interventions par créneau — ${fmtDateLong(dateStr)}`;

  const histVals = day.hist_ref;
  const predVals = day.pred_par_delta[deltaKey(delta)];
  const color = tempColor(delta);

  if(chart1){
    chart1.data.datasets[0].data = histVals;
    chart1.data.datasets[1].data = predVals;
    chart1.data.datasets[1].backgroundColor = color;
    chart1.update();
  } else {
    chart1 = new Chart(document.getElementById('chart1'), {
      type:'bar',
      data:{
        labels: CRENEAUX,
        datasets:[
          { label:'Moyenne historique', data: histVals, backgroundColor:'#3A4C5E', borderRadius:4, maxBarThickness:52 },
          { label:'Prédiction selon la température choisie ', data: predVals, backgroundColor: color, borderRadius:4, maxBarThickness:52 }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ labels:{ color:'#EAF1F6', font:{family:'Inter', size:12} } },
          tooltip:{ callbacks:{ label: ctx=> `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} interv.` } }
        },
        scales:{
          x:{ ticks:{ color:'#8DA3B8', font:{family:'Inter', size:11.5} }, grid:{ display:false } },
          y:{ ticks:{ color:'#8DA3B8', font:{family:'IBM Plex Mono', size:11} }, grid:{ color:'#20303F' }, beginAtZero:true }
        }
      }
    });
  }

  const histTotal = histVals.reduce((a,b)=>a+b,0);
  const predTotal = predVals.reduce((a,b)=>a+b,0);
  const pct = histTotal>0 ? ((predTotal-histTotal)/histTotal*100) : 0;
  dayTotalsEl.innerHTML = `
    <div class="mini-stat">
      <div class="mini-stat-label">Total historique journalier</div>
      <div class="mini-stat-value">${fmtNum(histTotal)} <span style="font-size:12px;color:var(--text-muted)">interventions</span></div>
    </div>
    <div class="mini-stat">
      <div class="mini-stat-label">Total prédit journalier (${fmtDelta(delta)} °C)</div>
      <div class="mini-stat-value" style="color:${color}">${fmtNum(predTotal)} <span style="font-size:12px;color:var(--text-muted)">interventions</span></div>
    </div>
    <div class="mini-stat">
      <div class="mini-stat-label">Écart entre le nombre d'interventions prédit de la journée sélectionnée et la moyenne historique de cette journée</div>
      <div class="mini-stat-value" style="color:${color}">${pct>=0?'+':''}${pct.toFixed(1)}%</div>
    </div>
  `;
}
datePicker.addEventListener('input', renderChart1);
delta1Slider.addEventListener('input', renderChart1);

/* ==================== TAB 2 LOGIC ==================== */
const delta2Slider = document.getElementById('delta2-slider');
const delta2Value = document.getElementById('delta2-value');
const kpiGrid = document.getElementById('kpi-grid');
let chart2a;

function pctDelta(val, ref){ return ref>0 ? ((val-ref)/ref*100) : 0; }

function kpiCardHTML(label, val, ref, unitSuffix, color){
  const pct = pctDelta(val, ref);
  const arrow = pct>0.05 ? '▲' : (pct<-0.05 ? '▼' : '—');
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="color:${color}">${fmtNum(val)}<span class="kpi-unit">${unitSuffix}</span></div>
      <div class="kpi-delta" style="color:${pct>0.05?color:'var(--text-muted)'}">
        <span class="arrow">${arrow}</span>${pct>=0?'+':''}${pct.toFixed(1)}% vs référence (0°C)
      </div>
    </div>
  `;
}

function renderTab2(){
  const delta = parseFloat(delta2Slider.value);
  delta2Value.textContent = fmtDelta(delta) + ' °C';
  delta2Value.style.color = tempColor(delta);
  applyThumbColor(delta2Slider, delta);

  const ref = DATA_GLOBALE['historique'];
  const cur = DATA_GLOBALE[deltaKey(delta)];
  const color = tempColor(delta);

  kpiGrid.innerHTML = [
    kpiCardHTML('Total annuel', cur.annee, ref.annee, ' interv.', color),
    kpiCardHTML('Moyenne mensuelle', cur.mois_moyen, ref.mois_moyen, ' interv.', color),
    kpiCardHTML('Moyenne hebdomadaire', cur.semaine_moyenne, ref.semaine_moyenne, ' interv.', color),
    kpiCardHTML('Créneau jour (6h–18h) / an', cur.creneau_jour, ref.creneau_jour, ' interv.', color),
    kpiCardHTML('Créneau nuit (18h–6h) / an', cur.creneau_nuit, ref.creneau_nuit, ' interv.', color),
  ].join('');

 const refMonthly = MOIS_COURT.map((_,i)=> 
  DATA_GLOBALE.historique.par_mois[String(i+1)]
);

const curMonthly = MOIS_COURT.map((_,i)=> 
  cur.par_mois[String(i+1)]
);



  if(chart2a){
    chart2a.data.datasets[1].data = curMonthly;
    chart2a.data.datasets[1].backgroundColor = color;
    chart2a.update();
  } else {
    chart2a = new Chart(document.getElementById('chart2a'), {
      type:'bar',
      data:{ labels: MOIS_COURT, datasets:[
        { label:'Référence ', data: refMonthly, backgroundColor:'#3A4C5E', borderRadius:3, maxBarThickness:26 },
        { label:'Prédiction selon la température choisie ', data: curMonthly, backgroundColor: color, borderRadius:3, maxBarThickness:26 }
      ]},
      options:{
        responsive:true, maintainAspectRatio:false,
      plugins:{legend:{ labels:{ color:'#EAF1F6', font:{family:'Inter', size:11.5} } },tooltip:{callbacks:{label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} interv.`
          }
        }
      },
        scales:{
          x:{ ticks:{ color:'#8DA3B8', font:{family:'Inter', size:10.5} }, grid:{ display:false } },
          y:{ ticks:{ color:'#8DA3B8', font:{family:'IBM Plex Mono', size:10.5} }, grid:{ color:'#20303F' }, beginAtZero:true }
        }
      }
    });
  }
}
delta2Slider.addEventListener('input', renderTab2);

/* ==================== INIT ==================== */
init().catch(err => {
    console.error(err);

    document.body.innerHTML = `
        <div style="
            color:white;
            background:#0B121A;
            padding:2rem;
            font-family:Inter,sans-serif;
        ">
            Impossible de charger les données (<code>data.json</code>).
        </div>
    `;
});

