/* ═══════════════════════════════════════════════════
   WUI Tracker — World Uncertainty Index Dashboard
   All data from FRED. Zero synthetic values.
   ═══════════════════════════════════════════════════ */

const C = {
  white:'#ffffff',accent:'#818cf8',accentDim:'rgba(99,102,241,0.1)',
  red:'#ef4444',redBg:'rgba(239,68,68,0.1)',green:'#22c55e',greenBg:'rgba(34,197,94,0.1)',
  yellow:'#eab308',cyan:'#06b6d4',pink:'#ec4899',orange:'#f97316',
  violet:'#8b5cf6',lime:'#84cc16',teal:'#14b8a6',rose:'#f43f5e',sky:'#0ea5e9',amber:'#d97706',
  grid:'rgba(255,255,255,0.025)',muted:'#52526e',tooltip:'#111120',text:'#d4d4e0',textSec:'#8585a0',
};
const PALETTE=[C.accent,C.cyan,C.pink,C.yellow,C.green,C.orange,C.lime,C.teal,C.rose,C.sky,C.violet,C.amber];
const FRED_BASE='https://fred.stlouisfed.org/series/';

const SERIES_IDS={global_simple:'WUIGLOBALSMPAVG',advanced:'WUIADVECON',emerging:'WUIEMERGECON',europe:'WUIEUROPE',asia_pacific:'WUIASIAPACIFIC',africa:'WUIAFRICA',middle_east:'WUIMIDDLEEASTCENTRALASIA',latin_america:'WUILATAMCARIBBEAN',us:'WUIUSA',china:'WUICHN',uk:'WUIGBR',germany:'WUIDEU',japan:'WUIJPN',india:'WUIIND',brazil:'WUIBRA',france:'WUIFRA',canada:'WUICAN',australia:'WUIAUS',russia:'WUIRUS',south_korea:'WUIKOR',mexico:'WUIMEX',italy:'WUIITA',spain:'WUIESP',saudi_arabia:'WUISAU',turkey:'WUITUR',south_africa:'WUIZAF',nigeria:'WUINGA',egypt:'WUIEGY',argentina:'WUIARG',epu_us_daily:'USEPUINDXD',epu_us_monthly:'USEPUINDXM',epu_global:'GEPUCURRENT',emv_daily:'WLEMUINDXD'};

const COUNTRIES={us:'United States',china:'China',uk:'United Kingdom',germany:'Germany',japan:'Japan',india:'India',brazil:'Brazil',france:'France',canada:'Canada',australia:'Australia',russia:'Russia',south_korea:'South Korea',mexico:'Mexico',italy:'Italy',spain:'Spain',saudi_arabia:'Saudi Arabia',turkey:'Turkey',south_africa:'South Africa',nigeria:'Nigeria',egypt:'Egypt',argentina:'Argentina'};
const REGIONS={europe:'Europe',asia_pacific:'Asia & Pacific',africa:'Africa',middle_east:'Middle East & C. Asia',latin_america:'Latin America'};
const REG_COLORS={europe:C.accent,asia_pacific:C.cyan,africa:C.yellow,middle_east:C.orange,latin_america:C.green};

// ISO 3166-1 numeric -> our keys (for world map topojson)
const ISO_TO_KEY={'840':'us','156':'china','826':'uk','276':'germany','392':'japan','356':'india','076':'brazil','250':'france','124':'canada','036':'australia','643':'russia','410':'south_korea','484':'mexico','380':'italy','724':'spain','682':'saudi_arabia','792':'turkey','710':'south_africa','566':'nigeria','818':'egypt','032':'argentina'};

const ISO_NAMES={'004':'Afghanistan','008':'Albania','012':'Algeria','024':'Angola','031':'Azerbaijan','032':'Argentina','036':'Australia','040':'Austria','048':'Bahrain','050':'Bangladesh','051':'Armenia','056':'Belgium','064':'Bhutan','068':'Bolivia','070':'Bosnia','072':'Botswana','076':'Brazil','096':'Brunei','100':'Bulgaria','104':'Myanmar','108':'Burundi','116':'Cambodia','120':'Cameroon','124':'Canada','140':'Central African Rep.','144':'Sri Lanka','148':'Chad','152':'Chile','156':'China','158':'Taiwan','170':'Colombia','178':'Congo','180':'DR Congo','188':'Costa Rica','191':'Croatia','192':'Cuba','196':'Cyprus','203':'Czechia','204':'Benin','208':'Denmark','214':'Dominican Rep.','218':'Ecuador','222':'El Salvador','226':'Eq. Guinea','231':'Ethiopia','232':'Eritrea','233':'Estonia','242':'Fiji','246':'Finland','250':'France','262':'Djibouti','266':'Gabon','268':'Georgia','270':'Gambia','276':'Germany','288':'Ghana','300':'Greece','320':'Guatemala','324':'Guinea','328':'Guyana','332':'Haiti','340':'Honduras','348':'Hungary','352':'Iceland','356':'India','360':'Indonesia','364':'Iran','368':'Iraq','372':'Ireland','376':'Israel','380':'Italy','384':"Côte d'Ivoire",'388':'Jamaica','392':'Japan','398':'Kazakhstan','400':'Jordan','404':'Kenya','410':'South Korea','414':'Kuwait','417':'Kyrgyzstan','418':'Laos','422':'Lebanon','426':'Lesotho','428':'Latvia','430':'Liberia','434':'Libya','440':'Lithuania','442':'Luxembourg','450':'Madagascar','454':'Malawi','458':'Malaysia','466':'Mali','470':'Malta','478':'Mauritania','484':'Mexico','496':'Mongolia','498':'Moldova','499':'Montenegro','504':'Morocco','508':'Mozambique','512':'Oman','516':'Namibia','524':'Nepal','528':'Netherlands','540':'New Caledonia','554':'New Zealand','558':'Nicaragua','562':'Niger','566':'Nigeria','578':'Norway','586':'Pakistan','591':'Panama','598':'Papua New Guinea','600':'Paraguay','604':'Peru','608':'Philippines','616':'Poland','620':'Portugal','624':'Guinea-Bissau','626':'Timor-Leste','634':'Qatar','642':'Romania','643':'Russia','646':'Rwanda','682':'Saudi Arabia','686':'Senegal','688':'Serbia','694':'Sierra Leone','702':'Singapore','703':'Slovakia','705':'Slovenia','706':'Somalia','710':'South Africa','716':'Zimbabwe','724':'Spain','728':'South Sudan','729':'Sudan','740':'Suriname','748':'Eswatini','752':'Sweden','756':'Switzerland','760':'Syria','762':'Tajikistan','764':'Thailand','768':'Togo','780':'Trinidad & Tobago','784':'UAE','788':'Tunisia','792':'Turkey','795':'Turkmenistan','800':'Uganda','804':'Ukraine','818':'Egypt','826':'United Kingdom','834':'Tanzania','840':'United States','854':'Burkina Faso','858':'Uruguay','860':'Uzbekistan','862':'Venezuela','704':'Vietnam','887':'Yemen','894':'Zambia','807':'N. Macedonia'};

const ISO_REG=(()=>{const m={};[[8,40,56,70,100,191,196,203,208,233,246,250,276,300,348,352,372,380,428,440,442,470,498,499,528,578,616,620,642,688,703,705,724,752,756,804,807,826],'europe',[4,36,50,64,96,104,116,144,156,158,242,356,360,392,410,418,458,496,524,540,554,586,598,608,626,702,764,704],'asia_pacific',[12,24,72,108,120,140,148,178,180,204,226,231,232,262,266,270,288,324,384,404,426,430,434,450,454,466,478,504,508,516,562,566,624,646,686,694,706,710,716,728,729,748,768,788,800,834,854,894],'africa',[31,48,51,268,364,368,376,400,398,414,417,422,512,634,682,760,762,784,792,795,818,860,887],'middle_east',[32,68,76,84,124,152,170,188,192,214,218,222,320,328,332,340,388,484,558,591,600,604,740,780,840,858,862],'latin_america'].reduce((a,v,i,arr)=>{if(typeof v==='string'){a.forEach(id=>m[String(id).padStart(3,'0')]=v);return[]}return v},[]);return m})();

const COUNTRY_LINKS={us:[{r:'asia_pacific',w:3},{r:'europe',w:2},{r:'latin_america',w:2},{r:'middle_east',w:1}],china:[{r:'asia_pacific',w:3}],uk:[{r:'europe',w:3}],germany:[{r:'europe',w:3}],japan:[{r:'asia_pacific',w:3}],india:[{r:'asia_pacific',w:3}],brazil:[{r:'latin_america',w:3}],france:[{r:'europe',w:3}],canada:[{r:'europe',w:2},{r:'latin_america',w:1}],australia:[{r:'asia_pacific',w:3}],russia:[{r:'europe',w:3},{r:'middle_east',w:2}],south_korea:[{r:'asia_pacific',w:3}],mexico:[{r:'latin_america',w:3}],italy:[{r:'europe',w:3}],spain:[{r:'europe',w:3}],saudi_arabia:[{r:'middle_east',w:3}],turkey:[{r:'middle_east',w:2},{r:'europe',w:2}],south_africa:[{r:'africa',w:3}],nigeria:[{r:'africa',w:3}],egypt:[{r:'middle_east',w:2},{r:'africa',w:2}],argentina:[{r:'latin_america',w:3}]};

const EVENTS=[
  {date:'2001-09-01',label:'9/11 Attacks',desc:'Terrorist attacks triggered a global surge in geopolitical uncertainty.',regions:['europe','middle_east','asia_pacific']},
  {date:'2003-03-01',label:'Iraq War',desc:'US-led invasion created prolonged Middle East instability.',regions:['middle_east','europe']},
  {date:'2008-09-01',label:'Global Financial Crisis',desc:'Lehman Brothers collapse triggered the worst financial crisis since the Great Depression.',regions:['europe','asia_pacific','latin_america','africa','middle_east']},
  {date:'2010-04-01',label:'Eurozone Debt Crisis',desc:'Greek debt crisis threatened eurozone stability.',regions:['europe']},
  {date:'2016-06-01',label:'Brexit Vote',desc:'UK voted to leave the EU in a shock referendum.',regions:['europe']},
  {date:'2016-11-01',label:'US Election 2016',desc:'Trump\'s unexpected victory raised trade and alliance questions.',regions:['latin_america','asia_pacific']},
  {date:'2018-03-01',label:'US-China Trade War',desc:'Escalating tariffs disrupted global supply chains.',regions:['asia_pacific','europe']},
  {date:'2020-01-01',label:'COVID-19 Pandemic',desc:'Global pandemic caused unprecedented shutdowns and uncertainty.',regions:['europe','asia_pacific','africa','latin_america','middle_east']},
  {date:'2022-02-01',label:'Russia-Ukraine War',desc:'Russia\'s invasion triggered energy crisis and food insecurity.',regions:['europe','middle_east','africa']},
  {date:'2023-10-01',label:'Israel-Hamas War',desc:'October 7 attack destabilized the Middle East.',regions:['middle_east','africa']},
  {date:'2024-07-01',label:'Biden Exits Race',desc:'President Biden withdrew from re-election.',regions:[]},
  {date:'2024-08-01',label:'Global Market Flash Crash',desc:'Yen carry trade unwind triggered a flash crash.',regions:['asia_pacific','europe']},
  {date:'2024-11-01',label:'US Election 2024',desc:'Trump wins with mandate for tariffs and deregulation.',regions:['latin_america','asia_pacific','europe']},
  {date:'2025-01-01',label:'Trump Inauguration',desc:'Rapid executive orders on trade, immigration, energy.',regions:['latin_america','europe']},
  {date:'2025-02-01',label:'Tariff Escalation',desc:'US imposes 60% on China, 25% on Canada/Mexico.',regions:['asia_pacific','latin_america']},
  {date:'2025-04-01',label:'Reciprocal Tariffs',desc:'Liberation Day tariffs target 60+ countries.',regions:['europe','asia_pacific','latin_america','africa','middle_east']},
  {date:'2025-06-01',label:'AI Regulation Divergence',desc:'Major economies pursue divergent AI regulation.',regions:['europe','asia_pacific']},
  {date:'2026-01-01',label:'Global Slowdown Fears',desc:'Trade fragmentation weighs on global growth.',regions:['europe','asia_pacific','latin_america']},
];

const CTX={us:{risk:'high',drivers:[{cat:'political',text:'Aggressive tariff regime creating unprecedented policy unpredictability. Sweeping executive orders reshaping the regulatory landscape.'},{cat:'economic',text:'Fed navigating sticky inflation vs slowing growth. Fiscal deficit at historic levels. Consumer confidence volatile.'},{cat:'geopolitical',text:'US-China tech decoupling accelerating. NATO commitment questions. Middle East and Ukraine policy shifts.'},{cat:'social',text:'Deep political polarization. Immigration enforcement disrupting labor markets. AI workforce transformation.'}],events:['Apr 2025: "Liberation Day" reciprocal tariffs on 60+ countries','Feb 2025: 60% tariffs on China, 25% on Canada/Mexico','Jan 2025: Executive order blitz','Nov 2024: Trump wins election'],outlook:'US uncertainty remains elevated as aggressive trade policies create cascading effects globally.'},china:{risk:'high',drivers:[{cat:'political',text:'Centralized decision-making reduces transparency. Regulatory crackdowns continue. Taiwan rhetoric intensifying.'},{cat:'economic',text:'Property sector restructuring ongoing. Youth unemployment elevated. US tariffs squeezing exports.'},{cat:'geopolitical',text:'US tariffs at 60%+. Tech self-sufficiency push. Belt and Road recalibration.'},{cat:'social',text:'Demographic crisis deepening. Urban-rural divide growing.'}],events:['Mar 2025: Retaliatory tariffs reach 125%','Feb 2025: US imposes 60% tariffs','Jan 2025: GDP target 5% amid skepticism'],outlook:'China faces dual challenge of domestic restructuring and hostile trade environment.'},uk:{risk:'moderate',drivers:[{cat:'political',text:'Labour government navigating post-Brexit reality. Budget constraints.'},{cat:'economic',text:'Growth sluggish. Housing crisis. BOE balancing inflation vs growth.'},{cat:'geopolitical',text:'Seeking new trade deals post-Brexit. US tariff exposure.'},{cat:'social',text:'Cost of living pressures. NHS backlogs. Immigration debates.'}],events:['Feb 2025: US tariffs impact steel/auto','Oct 2024: Budget reveals limited headroom','Jul 2024: Labour wins landslide'],outlook:'Moderate uncertainty as Labour seeks growth within tight fiscal constraints.'},germany:{risk:'high',drivers:[{cat:'political',text:'Coalition collapse and snap elections. AfD rise creating governance challenges.'},{cat:'economic',text:'Industrial recession. Auto sector existential challenges from Chinese EVs.'},{cat:'geopolitical',text:'Defense spending straining budget. US tariffs hitting exports.'},{cat:'social',text:'Immigration backlash. Infrastructure decay. Skilled labor shortages.'}],events:['Feb 2025: Snap elections fragmented','Jan 2025: US tariffs threaten auto','Nov 2024: Coalition collapses','Oct 2024: VW factory closures'],outlook:'Deepest structural uncertainty in decades.'},japan:{risk:'moderate',drivers:[{cat:'political',text:'LDP weakened mandate. Defense posture shifting.'},{cat:'economic',text:'BOJ historic rate normalization. Yen weakness.'},{cat:'geopolitical',text:'Taiwan proximity risk. Auto tariff friction.'},{cat:'social',text:'Population declining 800K/year. Labor shortage critical.'}],events:['Mar 2025: BOJ signals rate increases','Jan 2025: US auto tariffs','Aug 2024: Carry trade unwind'],outlook:'Historic monetary transition amid severe demographic headwinds.'},india:{risk:'moderate',drivers:[{cat:'political',text:'Modi governing with coalition after reduced majority.'},{cat:'economic',text:'Fastest-growing major economy at 6.5%+.'},{cat:'geopolitical',text:'Balancing US and Russia. China border tensions.'},{cat:'social',text:'Youth employment challenge. Digital transformation.'}],events:['Mar 2025: RBI cuts rates','Jan 2025: Moderate US tariffs at 26%','Jun 2024: Modi third term'],outlook:'Moderate and trending lower, benefiting from growth and supply chain diversification.'},brazil:{risk:'moderate',drivers:[{cat:'political',text:'Lula activist fiscal policy. Central bank independence tested.'},{cat:'economic',text:'Fiscal deficit concerns. Commodity dependence. High rates.'},{cat:'geopolitical',text:'Navigating US-China rivalry.'},{cat:'social',text:'Extreme inequality. Urban security. Climate impacts.'}],events:['Feb 2025: Real weakens on fiscal fears','Dec 2024: Larger deficit','Oct 2024: CB raises rates'],outlook:'Moderate uncertainty from fiscal policy tensions.'},france:{risk:'high',drivers:[{cat:'political',text:'Hung parliament. No stable majority. Far-right gaining.'},{cat:'economic',text:'Deficit exceeding EU limits. Underperforming peers.'},{cat:'geopolitical',text:'Ukraine costs mounting. Africa policy transitioning.'},{cat:'social',text:'Social unrest. Immigration tensions. Youth disenchantment.'}],events:['Jan 2025: PM can\'t pass budget','Dec 2024: No-confidence vote','Jul 2024: Three-way parliamentary split'],outlook:'Highest political uncertainty in decades.'},canada:{risk:'high',drivers:[{cat:'political',text:'Trudeau resigns. New PM inherits trade crisis.'},{cat:'economic',text:'US 25% tariffs devastating exports. Housing bubble.'},{cat:'geopolitical',text:'US relationship at lowest point in decades.'},{cat:'social',text:'Immigration scrutiny. Housing crisis. Healthcare strain.'}],events:['Mar 2025: Retaliatory tariffs','Feb 2025: US 25% tariffs','Jan 2025: Trudeau resigns'],outlook:'Severe uncertainty as US tariffs threaten fundamental economic relationship.'},australia:{risk:'moderate',drivers:[{cat:'political',text:'Labour navigating cost-of-living ahead of elections.'},{cat:'economic',text:'China demand softening. Housing crisis. RBA cautious.'},{cat:'geopolitical',text:'AUKUS progressing but costly. Indo-Pacific tensions.'},{cat:'social',text:'Climate events. Immigration straining infrastructure.'}],events:['Feb 2025: Iron ore falls on China concerns','Nov 2024: AUKUS costs revised up'],outlook:'Moderate uncertainty from China slowdown risks.'},russia:{risk:'high',drivers:[{cat:'political',text:'War economy centralization. Succession uncertainty.'},{cat:'economic',text:'Sanctions constraining tech. War spending growing. Inflation.'},{cat:'geopolitical',text:'Ukraine war year 3. Dependency on China deepening.'},{cat:'social',text:'Brain drain continuing. Casualties mounting.'}],events:['Mar 2025: Peace signals but far apart','Jan 2025: Defense 40% of budget','Nov 2024: NK troops deployed'],outlook:'Extreme uncertainty dominated by Ukraine war trajectory.'},south_korea:{risk:'high',drivers:[{cat:'political',text:'Constitutional crisis after martial law attempt.'},{cat:'economic',text:'Semiconductor US-China crosscurrents. Won weakness.'},{cat:'geopolitical',text:'Between US alliance and China dependency.'},{cat:'social',text:'World\'s lowest birth rate. Youth frustration.'}],events:['Mar 2025: Court upholds removal','Dec 2024: Martial law attempt','Nov 2024: Samsung margins decline'],outlook:'Acute political crisis on top of structural challenges.'},mexico:{risk:'high',drivers:[{cat:'political',text:'Judicial reform controversy. MORENA supermajority.'},{cat:'economic',text:'US 25% tariffs threatening nearshoring. Peso pressure.'},{cat:'geopolitical',text:'US relationship deteriorating. USMCA review.'},{cat:'social',text:'Cartel violence. Migration tensions.'}],events:['Mar 2025: Retaliatory measures considered','Feb 2025: US 25% tariffs','Oct 2024: Sheinbaum inaugurated'],outlook:'US tariffs threaten nearshoring narrative.'},italy:{risk:'moderate',drivers:[{cat:'political',text:'Meloni stable but coalition tensions.'},{cat:'economic',text:'Debt-to-GDP highest in eurozone. Tepid growth.'},{cat:'geopolitical',text:'Mediterranean migration gateway.'},{cat:'social',text:'Brain drain. South-North divide. Aging population.'}],events:['Jan 2025: EU warns on deficit','Nov 2024: Limited fiscal space'],outlook:'Moderate with persistent structural challenges.'},spain:{risk:'moderate',drivers:[{cat:'political',text:'Sanchez minority dependent on Catalan support.'},{cat:'economic',text:'Outperforming peers. Tourism strong. Housing crisis.'},{cat:'geopolitical',text:'Morocco relations complex. Migration pressures.'},{cat:'social',text:'Housing crisis protests. Tourism backlash.'}],events:['Nov 2024: Valencia floods kill 200+','Oct 2024: Housing protests spread'],outlook:'Strong growth offset by political fragility.'},saudi_arabia:{risk:'moderate',drivers:[{cat:'political',text:'Vision 2030 continuing. Some projects scaled back.'},{cat:'economic',text:'Oil price volatility. Diversification mixed. Deficit widening.'},{cat:'geopolitical',text:'Regional diplomacy active. OPEC+ discipline challenging.'},{cat:'social',text:'Social liberalization within boundaries.'}],events:['Mar 2025: OPEC+ extends cuts','Jan 2025: NEOM pushed back'],outlook:'Moderate uncertainty around oil prices and Vision 2030.'},turkey:{risk:'high',drivers:[{cat:'political',text:'Erdogan consolidating. Opposition detained.'},{cat:'economic',text:'Inflation above 40%. Lira weak.'},{cat:'geopolitical',text:'Independent foreign policy creating NATO friction.'},{cat:'social',text:'Cost of living severe. Brain drain.'}],events:['Mar 2025: Opposition arrested','Feb 2025: Cautious rate cuts','Dec 2024: Inflation below 50%'],outlook:'Tension between authoritarianism and market needs.'},south_africa:{risk:'high',drivers:[{cat:'political',text:'First national coalition. Policy uncertain.'},{cat:'economic',text:'Load shedding devastating. Unemployment 30%+.'},{cat:'geopolitical',text:'BRICS while maintaining West. AGOA at risk.'},{cat:'social',text:'Extreme inequality. Crime. Water failing.'}],events:['Feb 2025: Load shedding returns','Jan 2025: Coalition tensions','Jun 2024: ANC-DA coalition'],outlook:'High from untested coalition and infrastructure failures.'},nigeria:{risk:'high',drivers:[{cat:'political',text:'Tinubu reforms. Subsidy removal backlash.'},{cat:'economic',text:'Naira depreciation. Inflation 30%+.'},{cat:'geopolitical',text:'Sahel instability. ECOWAS declining.'},{cat:'social',text:'Security crisis. Kidnapping. Food insecurity.'}],events:['Jan 2025: Dangote refinery','Nov 2024: Naira new lows','Oct 2024: Hardship protests'],outlook:'Very high as reforms cause short-term pain.'},egypt:{risk:'high',drivers:[{cat:'political',text:'Sisi stability with limited space. IMF conditions.'},{cat:'economic',text:'Debt burden high. Suez revenue collapsed.'},{cat:'geopolitical',text:'Gaza next door. Nile dispute. Red Sea instability.'},{cat:'social',text:'Cost of living surge. Subsidy reform sensitive.'}],events:['Feb 2025: Suez revenue 60% down','Jan 2025: IMF requires cuts','Nov 2024: Gaza talks stall'],outlook:'High from converging regional threats and fiscal pressure.'},argentina:{risk:'high',drivers:[{cat:'political',text:'Milei radical disruption. Chainsaw spending cuts.'},{cat:'economic',text:'Hyperinflation falling but deep recession. Poverty 50%+.'},{cat:'geopolitical',text:'Pro-US/Israel shift. Mercosur questioned.'},{cat:'social',text:'Austerity hitting services. University protests.'}],events:['Mar 2025: Monthly inflation single digits','Jan 2025: Peso reset','Dec 2024: Annual inflation 200%+'],outlook:'Most radical economic experiment in decades.'}};

// ── State ──
let gData=[],regData={},cData={},rtData={};
let selected=[];
let heroChart=null,heroSeries=null,heroAvgLine=null;
let aeChart=null,regChart=null,cmpChart=null;
let epuCh=null,epuSr=null,emvCh=null,emvSr=null,epuMCh=null,epuMSr=null;
const sparks={};
let range='all',showEvt=false,showAvg=false,rtRange='0.25';
let mapRendered=false,webRendered=false;

// ── Util ──
function getQY(d){const p=d.split('-');return{q:Math.ceil(+p[1]/3),yr:+p[0]}}
function pd(s){const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]||1)}
function dl(d){const p=d.split('-');return new Date(+p[0],+p[1]-1,1).toLocaleDateString('en-US',{year:'numeric',month:'short'})}
function fmt(v){if(v==null||isNaN(v))return'--';if(v>=10000)return(v/1000).toFixed(0)+'k';if(v>=1000)return(v/1000).toFixed(1)+'k';return v.toFixed(0)}
function pct(c,p){return(!p||p===0)?0:((c-p)/p)*100}
function fP(v){if(v==null||isNaN(v))return'--';return(v>=0?'+':'')+v.toFixed(1)+'%'}
function filt(data,r){if(r==='all')return data;const c=new Date();c.setFullYear(c.getFullYear()-+r);return data.filter(d=>pd(d.date)>=c)}
function sd(a){if(!a.length)return 0;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)}
function parseCSV(csv){const lines=csv.trim().split('\n'),obs=[];for(let i=1;i<lines.length;i++){const[d,v]=lines[i].split(',');if(!d||!v||v==='.')continue;const n=parseFloat(v);if(!isNaN(n))obs.push({date:d.trim(),value:n})}return obs}
function parseFredJson(json){return(json.observations||[]).filter(o=>o.value&&o.value!=='.').map(o=>({date:o.date,value:parseFloat(o.value)})).filter(o=>!isNaN(o.value))}
async function tryFetch(url,ms){const r=await fetch(url,{signal:AbortSignal.timeout(ms)});if(!r.ok)throw new Error(r.status);return r}
async function api(key){
  const sid=SERIES_IDS[key]||key;
  const attempts=[
    async()=>{const r=await tryFetch(`/api/data?key=${sid}`,8000);const j=await r.json();return j.observations},
    async()=>{const r=await tryFetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${sid}&file_type=json&api_key=${window.__FRED_KEY||''}`,8000);return parseFredJson(await r.json())},
    async()=>{const r=await tryFetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://api.stlouisfed.org/fred/series/observations?series_id=${sid}&file_type=json`)}`,8000);return parseFredJson(await r.json())},
    async()=>{const r=await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${sid}`)}`,8000);return parseCSV(await r.text())},
  ];
  for(const fn of attempts){try{const d=await fn();if(d&&d.length)return d}catch(_){}}
  throw new Error(`Failed: ${key}`);
}
async function apiMulti(keys){const results={};await Promise.all(keys.map(async k=>{try{results[k]=await api(k)}catch(_){}}));return results}

function countUp(el,target,dur=700){const t0=performance.now();(function tick(now){const p=Math.min((now-t0)/dur,1);el.textContent=fmt(target*(1-(1-p)**3));if(p<1)requestAnimationFrame(tick);else el.textContent=fmt(target)})(t0)}
function startClock(){const el=document.getElementById('clock');const t=()=>{el.textContent=new Date().toLocaleTimeString('en-US',{hour12:false})};t();setInterval(t,1000)}
function setSub(id,t,c){const e=document.getElementById(id);if(!e)return;e.textContent=t;e.className=`stat-s ${c}`}

// ── Stats ──
function setStats(data){
  const last=data[data.length-1],prev=data[data.length-2];const{q,yr}=getQY(last.date);
  const mm=last.date.slice(5,7),yoyPt=data.find(d=>d.date.startsWith(`${yr-1}-${mm}`));
  const yoy=yoyPt?pct(last.value,yoyPt.value):null;
  const vals=data.map(d=>d.value),mx=Math.max(...vals),mxIt=data.find(d=>d.value===mx);
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length,qoq=pct(last.value,prev?.value);
  const vol=sd(filt(data,5).map(d=>d.value));
  countUp(document.getElementById('s-cur'),last.value);setSub('s-cur-s',`Q${q} ${yr}`,'flat');
  document.getElementById('s-qoq').textContent=fP(qoq);setSub('s-qoq-s',qoq>=0?'Rising':'Falling',qoq>=0?'up':'down');
  document.getElementById('s-yoy').textContent=yoy!=null?fP(yoy):'--';setSub('s-yoy-s',yoy!=null?(yoy>=0?'Higher YoY':'Lower YoY'):'N/A',yoy!=null&&yoy>=0?'up':'down');
  countUp(document.getElementById('s-ath'),mx);setSub('s-ath-s',dl(mxIt.date),'flat');
  countUp(document.getElementById('s-avg'),avg);const va=pct(last.value,avg);setSub('s-avg-s',`${Math.abs(va).toFixed(0)}% ${va>=0?'above':'below'} mean`,va>=0?'up':'down');
  countUp(document.getElementById('s-vol'),vol);setSub('s-vol-s',vol>avg*0.4?'High':'Moderate',vol>avg*0.4?'up':'flat');
  document.getElementById('freshness').textContent=`Q${q} ${yr}`;
  const cv=document.getElementById('s-sp');if(cv){const sl=data.slice(-20).map(d=>d.value);const clr=sl[sl.length-1]>=sl[0]?C.red:C.green;new Chart(cv,{type:'line',data:{labels:sl.map(()=>''),datasets:[{data:sl,borderColor:clr,backgroundColor:'transparent',borderWidth:1.5,tension:0.4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{display:false},y:{display:false}},plugins:{legend:{display:false},tooltip:{enabled:false}},animation:false}})}
}

// ── Hero Chart ──
function initHero(data){
  const el=document.getElementById('heroChart');el.innerHTML='';
  heroChart=LightweightCharts.createChart(el,{width:el.clientWidth,height:el.clientHeight||460,layout:{background:{type:'solid',color:'transparent'},textColor:'#52526e',fontFamily:'Inter',fontSize:11},grid:{vertLines:{color:C.grid},horzLines:{color:C.grid}},crosshair:{mode:LightweightCharts.CrosshairMode.Normal,vertLine:{color:'rgba(99,102,241,.25)',width:1,style:2,labelBackgroundColor:'#6366f1'},horzLine:{color:'rgba(99,102,241,.25)',width:1,style:2,labelBackgroundColor:'#6366f1'}},rightPriceScale:{borderVisible:false,scaleMargins:{top:.08,bottom:.08}},timeScale:{borderVisible:false,rightOffset:2,barSpacing:6,fixLeftEdge:true,timeVisible:false},handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:false},handleScale:{mouseWheel:true,pinch:true,axisPressedMouseMove:true}});
  heroSeries=heroChart.addAreaSeries({topColor:'rgba(99,102,241,.3)',bottomColor:'rgba(99,102,241,0)',lineColor:'#818cf8',lineWidth:2,crosshairMarkerVisible:true,crosshairMarkerRadius:5,crosshairMarkerBorderColor:'#fff',crosshairMarkerBorderWidth:2,crosshairMarkerBackgroundColor:'#6366f1',lastValueVisible:true,priceLineVisible:true,priceLineColor:'rgba(99,102,241,.35)',priceLineWidth:1,priceLineStyle:2});
  updateHero(data);setHD(data[data.length-1],data[data.length-2]);
  heroChart.subscribeCrosshairMove(p=>{if(!p.time||!p.seriesData){setHD(data[data.length-1],data[data.length-2]);return}const v=p.seriesData.get(heroSeries);if(v?.value!==undefined)document.getElementById('heroVal').textContent=fmt(v.value)});
  new ResizeObserver(()=>heroChart.applyOptions({width:el.clientWidth})).observe(el);
  const cd=filt(data,range).map(d=>({time:d.date,value:d.value}));const step=Math.max(1,Math.floor(cd.length/60));let i=0;heroSeries.setData([]);(function frame(){const end=Math.min(i+step,cd.length);heroSeries.setData(cd.slice(0,end));i=end;if(i<cd.length)requestAnimationFrame(frame);else heroChart.timeScale().fitContent()})();
}
function updateHero(data){
  const f=filt(data,range);heroSeries.setData(f.map(d=>({time:d.date,value:d.value})));
  let markers=[];if(showEvt){markers=EVENTS.filter(e=>f.some(d=>d.date>=e.date)&&f.some(d=>d.date<=e.date)).map(e=>{const cl=f.reduce((b,d)=>Math.abs(pd(d.date)-pd(e.date))<Math.abs(pd(b.date)-pd(e.date))?d:b);return{time:cl.date,position:'aboveBar',color:'#ef4444',shape:'arrowDown',text:e.label}})}
  markers.sort((a,b)=>a.time.localeCompare(b.time));heroSeries.setMarkers(markers);
  if(showAvg&&f.length){const avg=f.reduce((s,d)=>s+d.value,0)/f.length;if(heroAvgLine)heroSeries.removePriceLine(heroAvgLine);heroAvgLine=heroSeries.createPriceLine({price:avg,color:'rgba(234,179,8,.45)',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:`Mean: ${fmt(avg)}`})}else if(heroAvgLine){heroSeries.removePriceLine(heroAvgLine);heroAvgLine=null}
  heroChart.timeScale().fitContent();
}
function setHD(last,prev){if(!last)return;document.getElementById('heroVal').textContent=fmt(last.value);const c=prev?pct(last.value,prev.value):0;const el=document.getElementById('heroChg');el.textContent=fP(c);el.className=`hchg ${c>=0?'up':'down'}`;const{q,yr}=getQY(last.date);document.getElementById('heroPer').textContent=`Q${q} ${yr} vs Q${q>1?q-1:4} ${q>1?yr:yr-1}`}

// ── Ticker ──
function initTicker(data){const items=Object.entries(COUNTRIES).map(([k,n])=>{const d=data[k];if(!d||d.length<2)return null;const c=pct(d[d.length-1].value,d[d.length-2].value);return`<span class="tki"><span class="tn">${n}</span><span class="tv">${fmt(d[d.length-1].value)}</span><span class="tc ${c>=0?'u':'d'}">${fP(c)}</span></span>`}).filter(Boolean).join('');document.getElementById('ticker').innerHTML=items+items}

// ── Movers ──
function renderMovers(data){const list=Object.entries(COUNTRIES).map(([k,n])=>{const d=data[k];if(!d||d.length<2)return null;return{k,n,v:d[d.length-1].value,c:pct(d[d.length-1].value,d[d.length-2].value)}}).filter(Boolean).sort((a,b)=>b.c-a.c);const row=(m,i)=>`<div class="mr"><span class="m-rk">${i+1}</span><span class="m-nm">${m.n}</span><span class="m-vl">${fmt(m.v)}</span><span class="m-ch ${m.c>=0?'up':'down'}">${fP(m.c)}</span></div>`;document.getElementById('risers').innerHTML=list.slice(0,5).map(row).join('');document.getElementById('fallers').innerHTML=list.slice(-5).reverse().map(row).join('')}

// ── Chart.js ──
function cjsO(legend=true){return{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{x:{type:'category',grid:{display:false},ticks:{color:C.muted,font:{family:'Inter',size:11},maxTicksLimit:12,maxRotation:0},border:{display:false}},y:{grid:{display:true,color:C.grid,drawTicks:false},ticks:{color:C.muted,font:{family:'JetBrains Mono',size:11},callback:v=>fmt(v),padding:8},border:{display:false},beginAtZero:true}},plugins:{legend:legend?{display:true,position:'top',labels:{color:C.textSec,font:{family:'Inter',size:11},boxWidth:12,boxHeight:3,padding:14}}:{display:false},tooltip:{backgroundColor:C.tooltip,borderColor:'rgba(255,255,255,.06)',borderWidth:1,titleColor:C.white,bodyColor:C.textSec,titleFont:{family:'Inter',size:12,weight:'600'},bodyFont:{family:'JetBrains Mono',size:11},padding:10,cornerRadius:8,displayColors:true,boxPadding:4,callbacks:{label:it=>`  ${it.dataset.label}: ${it.raw?.toLocaleString()??'--'}`}},zoom:{pan:{enabled:true,mode:'x'},zoom:{wheel:{enabled:true},pinch:{enabled:true},mode:'x'}}},animation:{duration:800,easing:'easeOutQuart'}}}
function renderAE(data,r='20'){const a=filt(data.advanced||[],r),e=filt(data.emerging||[],r);const labels=a.map(d=>dl(d.date));const ds=[{label:'Advanced',data:a.map(d=>d.value),borderColor:C.violet,backgroundColor:'rgba(139,92,246,.06)',borderWidth:2,fill:true,tension:.3,pointRadius:0,pointHoverRadius:5},{label:'Emerging',data:e.map(d=>d.value),borderColor:C.pink,backgroundColor:'rgba(236,72,153,.06)',borderWidth:2,fill:true,tension:.3,pointRadius:0,pointHoverRadius:5}];if(aeChart){aeChart.data.labels=labels;aeChart.data.datasets=ds;aeChart.resetZoom?.();aeChart.update('active');return}aeChart=new Chart(document.getElementById('aeChart'),{type:'line',data:{labels,datasets:ds},options:cjsO()})}
function renderReg(data,r='20'){const keys=Object.keys(REGIONS);const ds=keys.map(k=>{const f=filt(data[k]||[],r);return{label:REGIONS[k],data:f.map(d=>d.value),borderColor:REG_COLORS[k]||C.accent,backgroundColor:'transparent',borderWidth:2,tension:.3,pointRadius:0,pointHoverRadius:4}});const labels=filt(data[keys[0]]||[],r).map(d=>dl(d.date));if(regChart){regChart.data.labels=labels;regChart.data.datasets=ds;regChart.resetZoom?.();regChart.update('active');return}regChart=new Chart(document.getElementById('regChart'),{type:'line',data:{labels,datasets:ds},options:cjsO()})}

// ── Country Cards ──
function renderCards(data){const grid=document.getElementById('cgrid');grid.innerHTML='';Object.entries(COUNTRIES).forEach(([k,n])=>{const d=data[k];if(!d||d.length<2)return;const last=d[d.length-1],prev=d[d.length-2],c=pct(last.value,prev.value);const card=document.createElement('div');card.className='ccard';card.dataset.key=k;if(selected.includes(k))card.classList.add('sel');card.innerHTML=`<div class="cc-i"><div class="cc-n">${n}</div><div class="cc-v" style="color:${c>=0?C.red:C.green}">${fmt(last.value)}</div><div class="cc-c ${c>=0?'up':'down'}">${c>=0?'\u25B2':'\u25BC'} ${Math.abs(c).toFixed(1)}%</div></div><div class="cc-s"><canvas id="sp-${k}"></canvas></div><button class="cc-b" data-key="${k}">Detail</button>`;card.addEventListener('click',e=>{e.target.dataset.key?showDetail(k):toggleSel(k)});grid.appendChild(card);requestAnimationFrame(()=>renderSpark(k,d.slice(-20)))})}
function renderSpark(k,data){const cv=document.getElementById(`sp-${k}`);if(!cv)return;if(sparks[k])sparks[k].destroy();const v=data.map(d=>d.value),clr=v[v.length-1]>=v[0]?C.red:C.green;sparks[k]=new Chart(cv,{type:'line',data:{labels:data.map(()=>''),datasets:[{data:v,borderColor:clr,backgroundColor:'transparent',borderWidth:1.5,tension:.4,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{display:false},y:{display:false}},plugins:{legend:{display:false},tooltip:{enabled:false}},animation:false}})}
function toggleSel(k){const i=selected.indexOf(k);if(i>=0)selected.splice(i,1);else if(selected.length<6)selected.push(k);document.querySelectorAll('.ccard').forEach(c=>c.classList.toggle('sel',selected.includes(c.dataset.key)));const sec=document.getElementById('cmpSec');if(selected.length){sec.classList.add('open');renderCmp()}else sec.classList.remove('open')}
function renderCmp(){const ds=selected.map((k,i)=>({label:COUNTRIES[k],data:(cData[k]||[]).map(d=>d.value),borderColor:PALETTE[i%PALETTE.length],backgroundColor:'transparent',borderWidth:2,tension:.3,pointRadius:0,pointHoverRadius:5}));const longest=selected.reduce((a,b)=>(cData[a]?.length||0)>=(cData[b]?.length||0)?a:b);const labels=(cData[longest]||[]).map(d=>dl(d.date));document.getElementById('cmpSub').textContent=selected.map(k=>COUNTRIES[k]).join(', ');if(cmpChart){cmpChart.data.labels=labels;cmpChart.data.datasets=ds;cmpChart.update('active');return}cmpChart=new Chart(document.getElementById('cmpChart'),{type:'line',data:{labels,datasets:ds},options:cjsO()})}

// ── Detail ──
function showDetail(k){const ctx=CTX[k],data=cData[k];if(!ctx||!data||data.length<2)return;const last=data[data.length-1],prev=data[data.length-2],c=pct(last.value,prev.value),vals=data.map(d=>d.value),mx=Math.max(...vals),mxD=data.find(d=>d.value===mx),vol=sd(filt(data,5).map(d=>d.value)),fid=SERIES_IDS[k];document.getElementById('detB').innerHTML=`<div class="d-nm">${COUNTRIES[k]}</div><span class="d-rk ${ctx.risk}">${ctx.risk} uncertainty</span><div class="d-st"><div class="ds"><div class="dl">Current</div><div class="dv" style="color:${c>=0?C.red:C.green}">${fmt(last.value)}</div></div><div class="ds"><div class="dl">QoQ</div><div class="dv" style="color:${c>=0?C.red:C.green}">${fP(c)}</div></div><div class="ds"><div class="dl">ATH</div><div class="dv">${fmt(mx)}</div></div><div class="ds"><div class="dl">5Y StdDev</div><div class="dv">${fmt(vol)}</div></div></div><div id="dChart"></div><div class="d-sec">Why is uncertainty ${ctx.risk}?</div><div class="drvs">${ctx.drivers.map(d=>`<div class="drv"><div class="drv-c ${d.cat}">${d.cat}</div><div class="drv-t">${d.text}</div></div>`).join('')}</div><div class="d-sec">Recent Events</div>${ctx.events.map(e=>`<div class="d-ev"><div class="d-dot"></div><div class="d-ev-t">${e}</div></div>`).join('')}<div class="d-ol"><h4>Outlook</h4><p>${ctx.outlook}</p></div><div class="d-src">Source: <a href="${FRED_BASE}${fid}" target="_blank">${fid}</a> — Verify on FRED</div>`;document.getElementById('detOv').classList.add('open');requestAnimationFrame(()=>{const dc=document.getElementById('dChart');if(!dc)return;const ch=LightweightCharts.createChart(dc,{width:dc.clientWidth,height:240,layout:{background:{type:'solid',color:'transparent'},textColor:'#52526e',fontFamily:'Inter',fontSize:10},grid:{vertLines:{color:'rgba(255,255,255,.02)'},horzLines:{color:'rgba(255,255,255,.02)'}},crosshair:{mode:LightweightCharts.CrosshairMode.Normal},rightPriceScale:{borderVisible:false},timeScale:{borderVisible:false,fixLeftEdge:true},handleScroll:true,handleScale:true});const s=ch.addAreaSeries({topColor:'rgba(99,102,241,.25)',bottomColor:'rgba(99,102,241,0)',lineColor:'#818cf8',lineWidth:2,crosshairMarkerVisible:true});s.setData(data.map(d=>({time:d.date,value:d.value})));ch.timeScale().fitContent()})}
function hideDetail(){document.getElementById('detOv').classList.remove('open')}
function renderTimeline(){document.getElementById('timeline').innerHTML=[...EVENTS].reverse().map(e=>`<div class="tl-i"><div class="tl-d">${dl(e.date)}</div><div class="tl-l">${e.label}</div><div class="tl-desc">${e.desc}</div></div>`).join('')}

// ── Real-Time 2026 ──
function mkRt(id,data,color,liveId){const el=document.getElementById(id);if(!el||!data.length)return{c:null,s:null};el.innerHTML='';const ch=LightweightCharts.createChart(el,{width:el.clientWidth,height:el.clientHeight||240,layout:{background:{type:'solid',color:'transparent'},textColor:'#52526e',fontFamily:'Inter',fontSize:10},grid:{vertLines:{color:C.grid},horzLines:{color:C.grid}},crosshair:{mode:LightweightCharts.CrosshairMode.Normal,vertLine:{color:`${color}44`,width:1,style:2,labelBackgroundColor:color},horzLine:{color:`${color}44`,width:1,style:2,labelBackgroundColor:color}},rightPriceScale:{borderVisible:false,scaleMargins:{top:.1,bottom:.1}},timeScale:{borderVisible:false,fixLeftEdge:true,timeVisible:false},handleScroll:true,handleScale:true});const sr=ch.addAreaSeries({topColor:`${color}40`,bottomColor:`${color}00`,lineColor:color,lineWidth:2,crosshairMarkerVisible:true,crosshairMarkerRadius:4,crosshairMarkerBorderColor:'#fff',crosshairMarkerBorderWidth:2,crosshairMarkerBackgroundColor:color,lastValueVisible:true,priceLineVisible:true,priceLineColor:`${color}55`,priceLineWidth:1,priceLineStyle:2});const last=data[data.length-1];if(liveId&&last)document.getElementById(liveId).textContent=last.value.toFixed(1);new ResizeObserver(()=>ch.applyOptions({width:el.clientWidth})).observe(el);return{c:ch,s:sr}}
function renderRt(){const epuD=filt(rtData.epu_us_daily||[],rtRange),emvD=filt(rtData.emv_daily||[],rtRange),epuM=filt(rtData.epu_us_monthly||[],rtRange==='0.25'?'1':rtRange==='0.5'?'2':rtRange);if(!epuCh){const r=mkRt('epuCh',epuD,'#6366f1','epuLv');epuCh=r.c;epuSr=r.s}if(epuSr&&epuD.length){epuSr.setData(epuD.map(d=>({time:d.date,value:d.value})));epuCh.timeScale().fitContent();const l=epuD[epuD.length-1];if(l)document.getElementById('epuLv').textContent=l.value.toFixed(1)}if(!emvCh){const r=mkRt('emvCh',emvD,'#06b6d4','emvLv');emvCh=r.c;emvSr=r.s}if(emvSr&&emvD.length){emvSr.setData(emvD.map(d=>({time:d.date,value:d.value})));emvCh.timeScale().fitContent();const l=emvD[emvD.length-1];if(l)document.getElementById('emvLv').textContent=l.value.toFixed(1)}if(!epuMCh){const r=mkRt('epuMCh',epuM,'#8b5cf6','epuMLv');epuMCh=r.c;epuMSr=r.s}if(epuMSr&&epuM.length){epuMSr.setData(epuM.map(d=>({time:d.date,value:d.value})));epuMCh.timeScale().fitContent();const l=epuM[epuM.length-1];if(l)document.getElementById('epuMLv').textContent=l.value.toFixed(1)}}

// ═══ TAB SYSTEM ═══
function initTabs(){document.querySelectorAll('#tabBar .tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('#tabBar .tab-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));document.getElementById('pane-'+btn.dataset.tab).classList.add('active');if(btn.dataset.tab==='worldmap'&&!mapRendered)initMap();if(btn.dataset.tab==='web'&&!webRendered)initWeb();if(btn.dataset.tab==='sources')renderSources()})})}

// ═══ WORLD MAP (D3 Orthographic Globe) ═══
async function initMap(){
  mapRendered=true;const box=document.getElementById('mapBox');
  box.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:580px"><div style="width:32px;height:32px;border:2px solid rgba(255,255,255,.06);border-top-color:#6366f1;border-radius:50%;animation:spin .6s linear infinite"></div></div>';
  const world=await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  box.innerHTML='';
  const W=box.clientWidth||900,H=580,sc0=Math.min(W,H)/2.2;
  const proj=d3.geoOrthographic().scale(sc0).translate([W/2,H/2]).clipAngle(90).rotate([-20,-15]);
  const pathG=d3.geoPath().projection(proj);
  const countries=topojson.feature(world,world.objects.countries);
  const borders=topojson.mesh(world,world.objects.countries,(a,b)=>a!==b);

  const regLast={};Object.keys(REGIONS).forEach(rk=>{const rd=regData[rk];if(rd&&rd.length)regLast[rk]=rd[rd.length-1].value});
  const valMap={};
  countries.features.forEach(f=>{const id=String(f.id).padStart(3,'0');const dk=ISO_TO_KEY[id];if(dk&&cData[dk]?.length){valMap[id]={value:cData[dk][cData[dk].length-1].value,name:COUNTRIES[dk],key:dk,direct:true}}else{const reg=ISO_REG[id];if(reg&&regLast[reg]!=null)valMap[id]={value:regLast[reg],name:ISO_NAMES[id]||'Unknown',region:REGIONS[reg],direct:false}}});
  const allV=Object.values(valMap).map(v=>v.value);const ext=d3.extent(allV);
  const color=d3.scaleLinear().domain([ext[0],(ext[0]+ext[1])/2,ext[1]]).range(['#22c55e','#eab308','#ef4444']).clamp(true);

  const svg=d3.select(box).append('svg').attr('width',W).attr('height',H).style('cursor','grab');
  const defs=svg.append('defs');
  const ag=defs.append('radialGradient').attr('id','atmo').attr('cx','50%').attr('cy','50%').attr('r','50%');
  ag.append('stop').attr('offset','78%').attr('stop-color','rgba(99,102,241,.07)');ag.append('stop').attr('offset','100%').attr('stop-color','transparent');
  svg.append('circle').attr('cx',W/2).attr('cy',H/2).attr('r',sc0*1.15).attr('fill','url(#atmo)');
  const ocean=svg.append('circle').attr('cx',W/2).attr('cy',H/2).attr('r',sc0).attr('fill','#060612').attr('stroke','rgba(99,102,241,.1)').attr('stroke-width',1);
  const gratP=svg.append('path').datum(d3.geoGraticule10()).attr('d',pathG).attr('fill','none').attr('stroke','rgba(255,255,255,.02)').attr('stroke-width',.4);
  const cP=svg.selectAll('.gc').data(countries.features).join('path').attr('class','gc')
    .attr('d',pathG)
    .attr('fill',d=>{const id=String(d.id).padStart(3,'0');const info=valMap[id];if(!info)return'#0c0c1e';return info.direct?color(info.value):d3.color(color(info.value)).darker(.5).formatHex()})
    .attr('stroke','#181830').attr('stroke-width',.3);
  const bP=svg.append('path').datum(borders).attr('d',pathG).attr('fill','none').attr('stroke','#181830').attr('stroke-width',.3);

  const tip=document.getElementById('mapTip');
  cP.on('mouseenter',(ev,d)=>{const id=String(d.id).padStart(3,'0');const info=valMap[id];d3.select(ev.target).attr('stroke','#fff').attr('stroke-width',1.5);tip.style.display='block';if(!info){tip.querySelector('.mt-n').textContent=ISO_NAMES[id]||'';tip.querySelector('.mt-v').textContent='No WUI data';return}tip.querySelector('.mt-n').textContent=info.name;let vHtml=info.direct?`WUI: <strong style="color:${color(info.value)}">${fmt(info.value)}</strong> — Direct FRED data`:`Regional WUI: <strong style="color:${color(info.value)}">${fmt(info.value)}</strong> (${info.region})`;if(id==='840'){const epuD=rtData.epu_us_daily||[];const emvD=rtData.emv_daily||[];if(epuD.length)vHtml+=`<br><span style="color:#06b6d4">EPU Daily:</span> <strong>${epuD[epuD.length-1].value.toFixed(1)}</strong>`;if(emvD.length)vHtml+=`<br><span style="color:#06b6d4">Market Vol:</span> <strong>${emvD[emvD.length-1].value.toFixed(1)}</strong>`}tip.querySelector('.mt-v').innerHTML=vHtml})
    .on('mousemove',ev=>{tip.style.left=Math.min(ev.clientX+14,window.innerWidth-260)+'px';tip.style.top=ev.clientY-10+'px'})
    .on('mouseleave',ev=>{d3.select(ev.target).attr('stroke','#181830').attr('stroke-width',.3);tip.style.display='none'})
    .on('click',(ev,d)=>{const id=String(d.id).padStart(3,'0');const info=valMap[id];if(info?.direct&&info.key)showDetail(info.key)});

  function render(){cP.attr('d',pathG);gratP.attr('d',pathG);bP.attr('d',pathG)}
  let r0,p0,curScale=sc0;
  svg.call(d3.drag().on('start',ev=>{autoR=false;r0=proj.rotate();p0=[ev.x,ev.y];svg.style('cursor','grabbing')}).on('drag',ev=>{const k=.25;proj.rotate([r0[0]+(ev.x-p0[0])*k,Math.max(-80,Math.min(80,r0[1]-(ev.y-p0[1])*k))]);render()}).on('end',()=>{autoR=true;svg.style('cursor','grab')}));
  svg.on('wheel',ev=>{ev.preventDefault();const f=ev.deltaY>0?.92:1.08;curScale=Math.max(sc0*.4,Math.min(sc0*5,curScale*f));proj.scale(curScale);ocean.attr('r',curScale);render()},{passive:false});

  let autoR=true;
  (function spin(){if(document.getElementById('pane-worldmap')?.classList.contains('active')){if(autoR){const r=proj.rotate();proj.rotate([r[0]+.12,r[1]]);render()}requestAnimationFrame(spin)}else setTimeout(spin,500)})();

  // Populate 2026 real-time overlay
  const epuD=rtData.epu_us_daily||[];const emvD=rtData.emv_daily||[];const epuM=rtData.epu_us_monthly||[];
  if(epuD.length)document.getElementById('mr-epu').textContent=epuD[epuD.length-1].value.toFixed(1);
  if(emvD.length)document.getElementById('mr-emv').textContent=emvD[emvD.length-1].value.toFixed(1);
  if(epuM.length)document.getElementById('mr-epum').textContent=epuM[epuM.length-1].value.toFixed(1);
  const latestDate=[...epuD,...emvD].filter(d=>d.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(latestDate)document.getElementById('mr-date').textContent='as of '+dl(latestDate.date);
}

// ═══ UNCERTAINTY WEB (3D Force Graph + Side Feed) ═══
function initWeb(){
  webRendered=true;const box=document.getElementById('webBox');box.innerHTML='';
  const feed=document.getElementById('webFeed');
  const riskClr=k=>{const ctx=CTX[k];if(!ctx)return'#8585a0';return ctx.risk==='high'?'#ef4444':ctx.risk==='moderate'?'#eab308':'#22c55e'};

  // Build real-time 2026 data nodes
  const epuD=rtData.epu_us_daily||[];const emvD=rtData.emv_daily||[];const epuM=rtData.epu_us_monthly||[];
  const rtNodes=[];
  if(epuD.length){const last=epuD[epuD.length-1];rtNodes.push({id:'rt_epu_d',label:'US EPU Daily (2026)',type:'realtime',desc:`Daily Economic Policy Uncertainty index. Latest: ${last.value.toFixed(1)} as of ${dl(last.date)}. Newspaper-based measure tracking policy-related uncertainty in real time.`,color:'#06b6d4',val:18,seriesId:'USEPUINDXD',lastVal:last.value,lastDate:last.date})}
  if(emvD.length){const last=emvD[emvD.length-1];rtNodes.push({id:'rt_emv',label:'Equity Market Vol. (2026)',type:'realtime',desc:`Daily news-based tracker of equity market volatility and uncertainty. Latest: ${last.value.toFixed(1)} as of ${dl(last.date)}.`,color:'#06b6d4',val:18,seriesId:'WLEMUINDXD',lastVal:last.value,lastDate:last.date})}
  if(epuM.length){const last=epuM[epuM.length-1];rtNodes.push({id:'rt_epu_m',label:'US EPU Monthly (2026)',type:'realtime',desc:`Monthly aggregate of the Economic Policy Uncertainty index. Latest: ${last.value.toFixed(1)} as of ${dl(last.date)}. Provides a longer-term view of US policy uncertainty.`,color:'#22d3ee',val:15,seriesId:'USEPUINDXM',lastVal:last.value,lastDate:last.date})}

  const nodes=[
    ...Object.entries(REGIONS).map(([k,n])=>({id:'r_'+k,label:n,type:'region',color:REG_COLORS[k]||C.accent,val:40,key:k})),
    ...Object.entries(COUNTRIES).map(([k,n])=>({id:'c_'+k,label:n,type:'country',color:riskClr(k),val:14,key:k,risk:CTX[k]?.risk||'unknown'})),
    ...EVENTS.map((e,i)=>{const yr=+e.date.slice(0,4);const t=Math.min(1,(yr-2000)/26);return{id:'e_'+i,label:e.label,type:'event',desc:e.desc,date:e.date,color:d3.interpolateRgb('#f97316','#ef4444')(t),val:7,regions:e.regions||[]}}),
    ...rtNodes
  ];
  const nodeMap={};nodes.forEach(n=>nodeMap[n.id]=n);

  const links=[];
  EVENTS.forEach((evt,i)=>{(evt.regions||[]).forEach(rk=>{let str=3;const rd=regData[rk];if(rd&&rd.length>1){const eD=pd(evt.date);const cl=rd.reduce((b,d)=>Math.abs(pd(d.date)-eD)<Math.abs(pd(b.date)-eD)?d:b);const ci=rd.indexOf(cl);if(ci>0){str=Math.min(8,Math.max(1,Math.abs(pct(cl.value,rd[ci-1].value))/8))}}links.push({source:'e_'+i,target:'r_'+rk,value:str,type:'event'})})});
  Object.entries(COUNTRY_LINKS).forEach(([k,regs])=>{regs.forEach(({r,w})=>{links.push({source:'c_'+k,target:'r_'+r,value:w,type:'country'})})});
  // RT nodes connect to US and key regions
  if(nodeMap['rt_epu_d']){links.push({source:'rt_epu_d',target:'c_us',value:5,type:'realtime'});links.push({source:'rt_epu_d',target:'r_europe',value:2,type:'realtime'});links.push({source:'rt_epu_d',target:'r_asia_pacific',value:2,type:'realtime'})}
  if(nodeMap['rt_emv']){links.push({source:'rt_emv',target:'c_us',value:4,type:'realtime'});links.push({source:'rt_emv',target:'r_europe',value:3,type:'realtime'});links.push({source:'rt_emv',target:'r_asia_pacific',value:3,type:'realtime'});links.push({source:'rt_emv',target:'c_japan',value:2,type:'realtime'});links.push({source:'rt_emv',target:'c_germany',value:2,type:'realtime'})}
  if(nodeMap['rt_epu_m']){links.push({source:'rt_epu_m',target:'c_us',value:5,type:'realtime'});links.push({source:'rt_epu_m',target:'c_canada',value:2,type:'realtime'});links.push({source:'rt_epu_m',target:'c_mexico',value:2,type:'realtime'})}

  function updateFeed(n){
    if(!n){feed.innerHTML='<div class="wf-empty"><div style="font-size:1.4rem;margin-bottom:8px">&#128269;</div><strong style="color:var(--wh)">Hover any node</strong><br>Events, countries, regions, and 2026 live data connected by real WUI data.<br><br><span style="font-size:.68rem"><span style="color:#ef4444">&#9679;</span> Event &nbsp;<span style="color:#818cf8">&#9679;</span> Region &nbsp;<span style="color:#eab308">&#9679;</span> Country &nbsp;<span style="color:#06b6d4">&#9679;</span> <strong>2026 Live</strong><br><br>Cyan nodes = real-time FRED data (EPU, Market Vol.) feeding into the network.</span></div>';return}
    const connected=links.filter(l=>{const sid=typeof l.source==='object'?l.source.id:l.source;const tid=typeof l.target==='object'?l.target.id:l.target;return sid===n.id||tid===n.id});
    const neighbors=connected.map(l=>{const sid=typeof l.source==='object'?l.source.id:l.source;const tid=typeof l.target==='object'?l.target.id:l.target;const oid=sid===n.id?tid:sid;return{node:nodeMap[oid],link:l}}).filter(c=>c.node);

    let html=`<div class="wf-item active"><div class="wf-label ${n.type}">${n.type}</div><div class="wf-name" style="color:${n.color}">${n.label}</div>`;
    if(n.type==='event')html+=`<div class="wf-desc">${n.desc||''}</div><div class="wf-stat"><span>Date:</span> <strong>${dl(n.date)}</strong></div>`;
    if(n.type==='country'){const ctx=CTX[n.key];html+=`<div class="wf-desc">${ctx?ctx.outlook:'Country node in the uncertainty web.'}</div><div class="wf-stat"><span>Risk level:</span> <strong style="color:${n.color}">${n.risk}</strong></div>`;if(ctx)html+=`<div style="margin-top:6px;font-size:.68rem;color:var(--acl);cursor:pointer" onclick="showDetail('${n.key}')">Open full analysis &rarr;</div>`}
    if(n.type==='region'){const rd=regData[n.key];if(rd&&rd.length){const last=rd[rd.length-1];html+=`<div class="wf-desc">Regional WUI cluster tracking uncertainty across ${n.label}.</div><div class="wf-stat"><span>Latest WUI:</span> <strong>${fmt(last.value)}</strong> <span>(${dl(last.date)})</span></div>`}}
    if(n.type==='realtime'){html+=`<div class="wf-desc">${n.desc||''}</div><div class="wf-stat"><span>Latest:</span> <strong style="color:#06b6d4">${n.lastVal?.toFixed(1)||'—'}</strong> <span>(${n.lastDate?dl(n.lastDate):'—'})</span></div><div style="margin-top:4px"><a href="${FRED_BASE}${n.seriesId}" target="_blank" style="font-size:.68rem;color:var(--acl);text-decoration:none">Verify on FRED &rarr;</a></div>`}
    html+=`</div>`;

    if(neighbors.length){
      html+=`<div style="padding:10px 18px 6px;font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--txm)">Connected to (${neighbors.length})</div>`;
      neighbors.sort((a,b)=>b.link.value-a.link.value).forEach(({node:nb,link:lk})=>{
        const strength=typeof lk.value==='number'?lk.value.toFixed(1):'—';
        html+=`<div class="wf-item"><div class="wf-label ${nb.type}">${nb.type}</div><div class="wf-name">${nb.label}</div>`;
        if(nb.type==='event')html+=`<div class="wf-desc">${nb.desc||''}</div>`;
        if(nb.type==='country')html+=`<div class="wf-desc">Risk: <strong style="color:${nb.color}">${nb.risk}</strong></div>`;
        if(nb.type==='region'){const rd=regData[nb.key];if(rd&&rd.length)html+=`<div class="wf-desc">WUI: ${fmt(rd[rd.length-1].value)}</div>`}
        if(nb.type==='realtime')html+=`<div class="wf-desc" style="color:#06b6d4">2026 Live: ${nb.lastVal?.toFixed(1)||'—'} (${nb.lastDate?dl(nb.lastDate):''})</div>`;
        html+=`<div class="wf-stat"><span>Impact:</span> <strong>${strength}</strong> <span>${lk.type==='realtime'?'(real-time link)':'(WUI QoQ change)'}</span></div></div>`;
      });
    }
    feed.innerHTML=html;
  }

  const graph=ForceGraph3D()(box)
    .backgroundColor('#080810')
    .showNavInfo(false)
    .graphData({nodes,links})
    .nodeLabel(n=>n.label)
    .nodeColor(n=>n.color)
    .nodeVal(n=>n.val)
    .nodeOpacity(.92)
    .nodeResolution(20)
    .linkColor(l=>l.type==='realtime'?'rgba(6,182,212,.12)':l.type==='event'?'rgba(255,255,255,.05)':'rgba(129,140,248,.04)')
    .linkWidth(l=>l.type==='realtime'?Math.max(.5,l.value*.4):Math.max(.2,l.value*.35))
    .linkOpacity(.5)
    .linkDirectionalParticles(l=>l.type==='realtime'?3:l.type==='event'?Math.ceil(l.value/2):1)
    .linkDirectionalParticleWidth(l=>l.type==='realtime'?2:l.type==='event'?1.6:1)
    .linkDirectionalParticleSpeed(l=>l.type==='realtime'?.008:.004)
    .linkDirectionalParticleColor(l=>l.type==='realtime'?'#06b6d4':l.type==='event'?'#818cf8':'#6366f1')
    .onNodeHover(n=>{updateFeed(n);graph.nodeColor(graph.nodeColor());if(n){links.forEach(l=>{const sid=typeof l.source==='object'?l.source.id:l.source;const tid=typeof l.target==='object'?l.target.id:l.target;l.__highlight=sid===n.id||tid===n.id});graph.linkColor(l=>l.__highlight?(l.type==='realtime'?'rgba(6,182,212,.4)':'rgba(255,255,255,.25)'):l.type==='realtime'?'rgba(6,182,212,.06)':l.type==='event'?'rgba(255,255,255,.03)':'rgba(129,140,248,.02)').linkWidth(l=>l.__highlight?Math.max(1,l.value*.6):Math.max(.1,l.value*.2))}else{links.forEach(l=>l.__highlight=false);graph.linkColor(l=>l.type==='realtime'?'rgba(6,182,212,.12)':l.type==='event'?'rgba(255,255,255,.05)':'rgba(129,140,248,.04)').linkWidth(l=>l.type==='realtime'?Math.max(.5,l.value*.4):Math.max(.2,l.value*.35))}})
    .onNodeClick(n=>{if(n.type==='country'&&n.key)showDetail(n.key);updateFeed(n)})
    .width(box.clientWidth||900)
    .height(box.clientHeight||680);

  graph.d3Force('charge').strength(-140);
  graph.d3Force('link').distance(l=>l.type==='event'?90+l.value*12:55);

  setTimeout(()=>{const c=graph.controls();if(c){c.autoRotate=true;c.autoRotateSpeed=.4}},1200);
  new ResizeObserver(()=>{graph.width(box.clientWidth||900);graph.height(box.clientHeight||680)}).observe(box);
}

// ═══ SOURCES ═══
function renderSources(){
  const el=document.getElementById('sourcesContent');if(el.innerHTML)return;
  const wui=Object.entries(SERIES_IDS).filter(([k])=>!k.startsWith('epu_')&&k!=='emv_daily'&&k!=='epu_global').map(([k,id])=>{const name=COUNTRIES[k]||REGIONS[k]||k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());const d=cData[k]||regData[k]||gData;const last=d&&d.length?dl(d[d.length-1].date):'—';return`<div class="src-card"><div class="sc-id">${id}</div><div class="sc-nm">${name}</div><div class="sc-desc">WUI quarterly index. Latest: ${last}</div><a href="${FRED_BASE}${id}" target="_blank">View on FRED &rarr;</a></div>`}).join('');
  const rt=[['USEPUINDXD','US Economic Policy Uncertainty (Daily)','Newspaper-based daily EPU index by Baker, Bloom, Davis'],['USEPUINDXM','US Economic Policy Uncertainty (Monthly)','Monthly aggregate of the daily EPU index'],['WLEMUINDXD','Equity Market Volatility (Daily)','News-based tracker of equity market uncertainty'],['GEPUCURRENT','Global Economic Policy Uncertainty','Global EPU current month index']].map(([id,name,desc])=>`<div class="src-card"><div class="sc-id">${id}</div><div class="sc-nm">${name}</div><div class="sc-desc">${desc}</div><a href="${FRED_BASE}${id}" target="_blank">View on FRED &rarr;</a></div>`).join('');
  el.innerHTML=`<div class="src-section"><h3>WUI Country &amp; Regional Series (${Object.keys(SERIES_IDS).length-4} series)</h3><div class="src-grid">${wui}</div></div><div class="src-section"><h3>Real-Time Supplementary Indices (4 series)</h3><div class="src-grid">${rt}</div></div><div class="src-section"><h3>Research &amp; Methodology</h3><div class="src-grid"><div class="src-card"><div class="sc-nm">World Uncertainty Index</div><div class="sc-desc">Ahir, Bloom &amp; Furceri (2022). IMF Working Paper WP/22/001. Methodology for constructing the WUI from EIU country reports.</div><a href="https://www.imf.org/en/Publications/WP/Issues/2022/03/04/World-Uncertainty-Index-512625" target="_blank">Read IMF Paper &rarr;</a></div><div class="src-card"><div class="sc-nm">worlduncertaintyindex.com</div><div class="sc-desc">Official website of the World Uncertainty Index project by the original research team.</div><a href="https://worlduncertaintyindex.com/" target="_blank">Visit Website &rarr;</a></div><div class="src-card"><div class="sc-nm">FRED Economic Data</div><div class="sc-desc">Federal Reserve Bank of St. Louis. Primary data distribution platform for all WUI and EPU series.</div><a href="https://fred.stlouisfed.org/tags/series?t=wui" target="_blank">Browse WUI on FRED &rarr;</a></div><div class="src-card"><div class="sc-nm">Economic Policy Uncertainty</div><div class="sc-desc">Baker, Bloom &amp; Davis. Research on measuring policy uncertainty using newspaper coverage.</div><a href="https://www.policyuncertainty.com/" target="_blank">Visit EPU Website &rarr;</a></div><div class="src-card"><div class="sc-nm">Economist Intelligence Unit (EIU)</div><div class="sc-desc">Source of the country reports analyzed to construct the WUI. Quarterly publications covering 143 economies.</div><a href="https://www.eiu.com/" target="_blank">Visit EIU &rarr;</a></div></div></div>`}

// ── Reveal ──
function initReveal(){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}})},{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>obs.observe(e))}

// ── Controls ──
function initControls(){
  document.querySelectorAll('#heroR button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#heroR button').forEach(x=>x.classList.remove('on'));b.classList.add('on');range=b.dataset.r;updateHero(gData)}));
  document.getElementById('btnEv').addEventListener('click',function(){showEvt=!showEvt;this.classList.toggle('on',showEvt);updateHero(gData)});
  document.getElementById('btnAv').addEventListener('click',function(){showAvg=!showAvg;this.classList.toggle('on',showAvg);updateHero(gData)});
  document.querySelectorAll('#aeR button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#aeR button').forEach(x=>x.classList.remove('on'));b.classList.add('on');renderAE(regData,b.dataset.r)}));
  document.querySelectorAll('#regR button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#regR button').forEach(x=>x.classList.remove('on'));b.classList.add('on');renderReg(regData,b.dataset.r)}));
  document.querySelectorAll('#rtR button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#rtR button').forEach(x=>x.classList.remove('on'));b.classList.add('on');rtRange=b.dataset.r;if(epuCh){epuCh.remove();epuCh=null;epuSr=null}if(emvCh){emvCh.remove();emvCh=null;emvSr=null}if(epuMCh){epuMCh.remove();epuMCh=null;epuMSr=null}renderRt()}));
  document.getElementById('cmpClr').addEventListener('click',()=>{selected=[];document.querySelectorAll('.ccard').forEach(c=>c.classList.remove('sel'));document.getElementById('cmpSec').classList.remove('open');if(cmpChart){cmpChart.destroy();cmpChart=null}});
  document.getElementById('detX').addEventListener('click',hideDetail);
  document.getElementById('detOv').addEventListener('click',e=>{if(e.target.id==='detOv')hideDetail()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideDetail()});
}

// ── Init ──
async function init(){
  startClock();initControls();initTabs();renderTimeline();initReveal();
  try{
    const[g,regs,countries,rt]=await Promise.all([api('global_simple'),apiMulti([...Object.keys(REGIONS),'advanced','emerging']),apiMulti(Object.keys(COUNTRIES)),apiMulti(['epu_us_daily','epu_us_monthly','emv_daily'])]);
    gData=g;regData=regs;cData=countries;rtData=rt;
    setStats(gData);initHero(gData);initTicker(countries);renderRt();renderMovers(countries);renderAE(regs,'20');renderReg(regs,'20');renderCards(countries);
    setInterval(async()=>{try{gData=await api('global_simple');setStats(gData);updateHero(gData)}catch(e){console.warn('Refresh failed:',e)}},6*60*60*1000);
  }catch(err){console.error('Load failed:',err);document.getElementById('heroChart').innerHTML=`<div style="text-align:center;color:#ef4444;padding:60px 20px;font-size:.85rem">Failed to load FRED data.<br><small style="color:#52526e">${err.message}</small></div>`}
}
document.addEventListener('DOMContentLoaded',init);
