/*------------------------Code JAVASCRIPT mobilisé pour l'interactivité du dashboard------------------------------------------------------------*/
/*Stockage des données fournies par le JSON*/
let APP;
let CRENEAUX;
let DELTAS;
let DATA_JOUR;
let DATA_GLOBALE;

/*Chargement des données depuis le JSON et initialisation des variables globales*/
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
/*-----------------------------------------------------------------------------------------------------------------------------------------------------*/
/*Traduction en français des jours et mois écrits en anglais pour l'affichage utilisateur*/
const JOURS_FR = {
  Monday:'lundi', Tuesday:'mardi', Wednesday:'mercredi', Thursday:'jeudi',
  Friday:'vendredi', Saturday:'samedi', Sunday:'dimanche'
};
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

/*Formatage des valeurs numériques : ajout d'un espace après les milliers*/
function fmtNum(n){
  return Math.round(n).toLocaleString('fr-FR');
}
/*Formatage des scénarios de température : "2" devient "+ 2,0°C"*/
function fmtDelta(d){
  return (d>=0?'+':'') + d.toFixed(1).replace('.',',');
}

/*Formatage des données temporelles : AAAA-MM-JJ devient une date écrite en français*/
function fmtDateLong(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y,m-1,d));
  const dayName = JOURS_FR[dt.toLocaleDateString('en-US',{weekday:'long', timeZone:'UTC'})];
  return `${dayName} ${d} ${MOIS_FR[m-1]} ${y}`;
}
function mixChannel(a,b,t){ return Math.round(a + (b-a)*t); }

/*Personnalisation de Chart.js afin d'ajouter un espace sous la légende*/
const legendSpacing = {
  id: 'legendSpacing',
  beforeInit(chart) {
    const fitValue = chart.legend.fit;

    chart.legend.fit = function fit() {
      fitValue.bind(chart.legend)();
      this.height += 20; // espace supplémentaire sous la légende
    };
  }
};

Chart.register(legendSpacing);

/*-------------------Gestion des couleurs----------------------------------------------------------------------------------------------------------------------------------*/
/*Échelle de couleurs représentant l'intensité du scénario climatique, plus on augmente plus c'est rouge*/
function tempColor(delta){
  const stops = [ [62,143,208], [240,166,59], [229,72,77] ]; 
  const mid = 1.5;
  let t, c1, c2;
  if(delta<=mid){ t = delta/mid; c1=stops[0]; c2=stops[1]; }
  else { t = (delta-mid)/mid; c1=stops[1]; c2=stops[2]; }
  const r=mixChannel(c1[0],c2[0],t), g=mixChannel(c1[1],c2[1],t), b=mixChannel(c1[2],c2[2],t);
  return `rgb(${r},${g},${b})`;
}
/*Application de la couleur sur le curseur de température*/
function applyThumbColor(slider, delta){
  slider.style.setProperty('--thumb-color', tempColor(delta));
}

/*Conversion de la température en clé de recherche pour correspondre au format du JSON (assure une bonne lecture)*/
function deltaKey(delta){ return delta.toFixed(1); }

/*-------------------Gestion des onglets----------------------------------------------------------------------------------------------------------------------------------*/
/*Affiche les éléments de l'onglet sélectionné et masque les éléments de l'autre onglet*/
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/*-----------------------------------------------------------------------------------------------------------------------------------------------------*/
/*GRAPHIQUE JOURNALIER*/
const datePicker = document.getElementById('date-picker');
const delta1Slider = document.getElementById('delta1-slider');
const delta1Value = document.getElementById('delta1-value');
const dayBadge = document.getElementById('day-badge');
const chart1Title = document.getElementById('chart1-title');
const dayTotalsEl = document.getElementById('day-totals');

/*Mise à jour du graphique selon le choix de la date et de la température*/
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
  chart1Title.textContent = `Interventions par créneau : ${fmtDateLong(dateStr)}`;

  /*Récupération des valeurs historiques et prédites pour le jour sélectionné*/
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
          legend:{ labels:{ color:'#EAF1F6', font:{family:'Arial', size:12} } },
          tooltip:{ callbacks:{ label: ctx=> `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} interv.` } }
        },
        scales:{
          x:{ ticks:{ color:'#8DA3B8', font:{family:'Arial', size:11.5}, padding:10 }, grid:{ display:false } },
          y:{ ticks:{ color:'#8DA3B8', font:{family:'Arial', size:11} }, grid:{ color:'#20303F' }, beginAtZero:true }
        }
      }
    });
  }
  /*Calcul des indicateurs journaliers historiques et prédits (sommes des quatre créneaux) et la variation entre les deux*/
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
      <div class="mini-stat-label">Écart entre le nombre d'interventions prédites de la journée sélectionnée et la moyenne historique de cette journée</div>
      <div class="mini-stat-value" style="color:${color}">${pct>=0?'+':''}${pct.toFixed(1)}%</div>
    </div>
  `;
}
datePicker.addEventListener('input', renderChart1);
delta1Slider.addEventListener('input', renderChart1);

/*-----------------------------------------------------------------------------------------------------------------------------------------------------*/
/*CHIFFRES CLÉS*/
const delta2Slider = document.getElementById('delta2-slider');
const delta2Value = document.getElementById('delta2-value');
const kpiGrid = document.getElementById('kpi-grid');
let chart2a;

/*Calcul de l'écart relatif entre une valeur prédite et la valeur historique*/
function pctDelta(val, ref){ return ref>0 ? ((val-ref)/ref*100) : 0; }

function kpiCardHTML(label, val, ref, unitSuffix, color){
  const pct = pctDelta(val, ref);
  const arrow = pct>0.05 ? '▲' : (pct<-0.05 ? '▼' : '—');
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="color:${color}">${fmtNum(val)}<span class="kpi-unit">${unitSuffix}</span></div>
      <div class="kpi-delta" style="color:${pct>0.05?color:'var(--text-muted)'}">
        <span class="arrow">${arrow}</span>${pct>=0?'+':''}${pct.toFixed(1)}% vs volumétrie historique
      </div>
    </div>
  `;
}
/*Génération du contenu du second onglet (chiffres clés et graphique mensuel)*/
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
        { label:'Volumétrie historique ', data: refMonthly, backgroundColor:'#3A4C5E', borderRadius:3, maxBarThickness:26 },
        { label:'Prédiction selon la température choisie ', data: curMonthly, backgroundColor: color, borderRadius:3, maxBarThickness:26 }
      ]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{ labels:{ color:'#EAF1F6', font:{family:'Arial', size:11.5}, padding:20 } },tooltip:{callbacks:{label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} interv.`
          }
        }
      },
        scales:{
          x:{ ticks:{ color:'#8DA3B8', font:{family:'Arial', size:10.5} }, grid:{ display:false } },
          y:{ ticks:{ color:'#8DA3B8', font:{family:'Arial', size:10.5} }, grid:{ color:'#20303F' }, beginAtZero:true }
        }
      }
    });
  }
}
delta2Slider.addEventListener('input', renderTab2);

/*-------------------Initialisation----------------------------------------------------------------------------------------------------------------------------------*/
/*Lancement du dashboard, affichage d'un message d'erreur si défaut de chargement du JSON*/
init().catch(err => {
    console.error(err);

    document.body.innerHTML = `
        <div style="
            color:white;
            background:#0B121A;
            padding:2rem;
            font-family:Arial,sans-serif;
        ">
            Impossible de charger les données (<code>data.json</code>).
        </div>
    `;
});

