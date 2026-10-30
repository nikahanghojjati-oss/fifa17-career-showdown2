"use strict";
const rosterRoulette=require("./support/roster-roulette.cjs");
// CE2PG: "Cloud Emulator 2-player Journey" (r80 flow).
// Daniel and Nik play the real Career Mode Showdown in two Chromium contexts against the Firebase Auth + Firestore emulators
// with the composed production Rules (the same production adapter path as tests/browser/r79-two-player-journey-audit.cjs).
// Every step is a player's tap or typing (the few page-script steps are listed in the report's seededSteps). Every figure on
// the career pages is recomputed here from the typed season inputs with the game's scoring rules and compared with the screen.
//
// Plans (CE2PG_PLAN):
//   main (default)  one real career on the same two accounts:
//     T  the first real 1-season Showdown, played to the end and counted in every career page.
//     A  3 seasons, played to the end (Daniel's Home START, Nik's Home JOIN).
//     B  1 season, played to the end (Daniel's Home START, Nik's Home JOIN, no code).
//     C  3 seasons; season 1 is committed, then Daniel taps END SHOWDOWN in Settings: History shows one "Ended early · 1 season"
//        row and every other page shows exactly T + A + B.
//     After every season and every Showdown, on BOTH players: Shared History (in the game), Standings (This Showdown and Career,
//     opened first, before any other career page), Career Statistics (table, comparison, leaders, summary tiles), Trophy Room
//     (cabinet, ranking, all-time records), Legacy (cards and season history), Rivalry Statistics and Settings (mode, partner,
//     current Showdown, END SHOWDOWN only while a game is live). At the end: both browsers wipe local storage and reload, and a
//     brand-new browser signs in as Daniel and as Nik: every page must read the same (the figures come from Firebase).
//   single          one Showdown of CE2PG_SEASONS (1, 3, 5 or 10) seasons played to the end, then the same end checks.
//                   CE2PG_SCENARIO=draw steers it to a drawn Showdown (equal totals).
// Options: CE2PG_RUN=1|2|3 (score inputs, who wins, publish order, screen sizes), CE2PG_PORT_BASE (default 9510; auth +0,
//   Firestore +1, hub +2, logging +3, websocket +4), CE2PG_APP_PORT (default 4611; or CMS_BASE_URL for a server you started),
//   CE2PG_PAGES_EVERY (career pages after every Nth season; default 1, 3 for 10 seasons; the first, last and every Showdown end are
//   always checked), CE2PG_RELOAD_EVERY (both players reload before the page check of every Nth season; default 2),
//   CE2PG_DEBUG=1 (print raw screen text).
// Run: npm run test:ce2pg   (or CE2PG_PLAN=single CE2PG_SEASONS=10 npm run test:ce2pg)
//   It starts its own emulators (firebase emulators:exec) and static server and builds the composed Rules if they are missing.
// Output: test-results/<tag>.json (every check, problem, raw screen text and the meter) and screenshots in test-results/<tag>/.
// Test database only (demo project on the local emulators). Never touches production Firebase. Not a Gate lane (main about 20 min,
// 10 seasons about 19 min on a 4-core runner; over the ~15 min Gate budget).
// Billed-reads budget (release gate, owner decisions 2026-10-26): the game must fit the Firebase Spark free limit (50,000 billed
// reads/day) at the pace people really play, so the budget PER SEASON scales with how long a season takes:
//     seasonMinutes  = transfer minutes + results minutes + the short waits (commit, acknowledge, CONTINUE) + the in-game play/setup
//                      time this harness actually spends in the season (page-to-page automation, and for season 1 START/pairing/setup)
//     seasonsPerDay  = min(25, floor(24*60 / seasonMinutes))        (24 h of continuous play is the worst case)
//     budget/season  = floor(45,000 / seasonsPerDay)                (45,000 = 50,000 less a 10% margin)
//     gate           = measured billed reads of the season <= budget/season, for every pace below
//     real capacity  = min(seasonsPerDay, floor(50,000 / billed per season)) seasons a day the measured cost really allows
// Billed = document reads + the Security Rules get()/exists() lookups the production Rules evaluate per request
// (tests/browser/support/billed-meter.cjs). Every run prints the METER table with billed numbers. CE2PG_BUDGET=1 (npm run test:budget)
// also waits at the partner-wait points and enforces check zz.billed. Waiting is configured in ONE place, WAIT_PROFILES below
// (Nik's real times): slow = longest he plays, fast = quickest, mid = in between.
//   CE2PG_TRANSFER_MIN / CE2PG_RESULTS_MIN (default 40 / 90, slow)   CE2PG_MID_TRANSFER_MIN / CE2PG_MID_RESULTS_MIN (30 / 60)
//   CE2PG_FAST_TRANSFER_MIN / CE2PG_FAST_RESULTS_MIN (25 / 30)       CE2PG_SHORT_MIN (1) each short wait (commit, ack, CONTINUE)
// The results minutes are priced at the dearer of the two states a manager can be in on that screen (nobody has published yet, or this
// manager has published and waits for the other).
// Waits are sampled, then extrapolated linearly at the steady per-minute rate measured in the sample (CE2PG_BUDGET_SAMPLE_MIN for the
// long points, CE2PG_BUDGET_SHORT_SAMPLE_MIN for the short ones); CE2PG_BUDGET_REALTIME=fast|mid|slow waits that pace's full minutes instead
// (fast is about 1 hour per season) and so validates the extrapolation. The output says which of the two was used.
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const PLAN_NAME=process.env.CE2PG_PLAN||"main";
const SEASONS=Number(process.env.CE2PG_SEASONS||(PLAN_NAME==="main"?3:1));
const RUN=Number(process.env.CE2PG_RUN||1);
const SCENARIO=process.env.CE2PG_SCENARIO||"";// "draw": the single Showdown ends level (equal totals)
if(!["main","single"].includes(PLAN_NAME)||![1,3,5,10].includes(SEASONS)||![1,2,3].includes(RUN)||!["","draw"].includes(SCENARIO)){
  console.error(`CE2PG_PLAN main|single, CE2PG_SEASONS 1|3|5|10, CE2PG_RUN 1-3, CE2PG_SCENARIO ""|draw (got ${PLAN_NAME}, ${SEASONS}, ${RUN}, ${SCENARIO})`);process.exit(2);
}
const PORT_BASE=Number(process.env.CE2PG_PORT_BASE||9510);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const PROJECT="demo-cms-browser-journey";// the emulator switch is pinned to this demo project id
const OUT_DIR=path.join(ROOT,"test-results");
const TAG=(PLAN_NAME==="main"?`ce2pg-main-${RUN}`:`ce2pg-single-${SEASONS}-${RUN}${SCENARIO?`-${SCENARIO}`:""}`)+(process.env.CE2PG_BUDGET==="1"?"-budget":"");
const REPORT_PATH=path.join(OUT_DIR,`${TAG}.json`);
const SHOT_DIR=path.join(OUT_DIR,TAG);

// ---------------------------------------------------------------------------------------------------------------------------
// Bootstrap: when not already inside `firebase emulators:exec`, build the composed Rules if needed, start the emulators on this
// run's own ports and run this same file inside them.
// ---------------------------------------------------------------------------------------------------------------------------
if(!process.env.FIRESTORE_EMULATOR_HOST){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  if(!fs.existsSync(path.join(ROOT,"firestore.spark.generated.rules"))){
    for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
      const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,stdio:"inherit"});
      if(built.status!==0)process.exit(built.status||1);
    }
  }
  const configPath=path.join(OUT_DIR,`${TAG}.emulators.json`);
  fs.writeFileSync(configPath,JSON.stringify({emulators:{
    auth:{host:"127.0.0.1",port:PORTS.auth},
    firestore:{host:"127.0.0.1",port:PORTS.firestore,websocketPort:PORTS.websocket},
    hub:{host:"127.0.0.1",port:PORTS.hub},
    logging:{host:"127.0.0.1",port:PORTS.logging},
    ui:{enabled:false},singleProjectMode:true
  }}));
  const child=spawn("npx",["--yes","firebase-tools@15.28.1","emulators:exec","--config",configPath,"--only","auth,firestore","--project",PROJECT,`node ${path.relative(ROOT,__filename)}`],{cwd:ROOT,stdio:"inherit",env:{...process.env,CMS_CHROMIUM_MULTI_CONTEXT:"1"}});
  child.on("exit",code=>process.exit(code===null?1:code));
  return;
}

// ---------------------------------------------------------------------------------------------------------------------------
// From here on we run inside the emulators.
// ---------------------------------------------------------------------------------------------------------------------------
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {installFirestoreMeter,createMeter}=require("./support/firestore-meter.cjs");
const billedMeter=require("./support/billed-meter.cjs");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");

const APP_PORT=Number(process.env.CE2PG_APP_PORT||4611);
const BASE=(process.env.CMS_BASE_URL||`http://127.0.0.1:${APP_PORT}/`).replace(/\/?$/,"/");
const FIRESTORE=`http://127.0.0.1:${PORTS.firestore}`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const DEBUG=process.env.CE2PG_DEBUG==="1";
const PAGES_EVERY=Number(process.env.CE2PG_PAGES_EVERY||(SEASONS>=10&&PLAN_NAME==="single"?3:1));
const RELOAD_EVERY=Number(process.env.CE2PG_RELOAD_EVERY||2);
const BUDGET=Object.freeze({readsPerSeason:800,writesPerSeason:600});
// Billed-reads gate: Spark free limit 50,000 reads/day / 25 seasons a day = 2,000 per season, less ~10% margin.
const BILLED_BUDGET=Object.freeze({dailyFreeReads:50000,marginPercent:10,maxSeasonsPerDay:25,minutesPerDay:24*60});
// The formula in the header comment, in one place.
function paceBudget(seasonMinutes,billed){
  const seasonsPerDay=Math.max(1,Math.min(BILLED_BUDGET.maxSeasonsPerDay,Math.floor(BILLED_BUDGET.minutesPerDay/seasonMinutes)));
  const budget=Math.floor(BILLED_BUDGET.dailyFreeReads*(100-BILLED_BUDGET.marginPercent)/100/seasonsPerDay);
  const allowed=Math.min(seasonsPerDay,Math.floor(BILLED_BUDGET.dailyFreeReads/Math.max(1,billed)));
  return {seasonsPerDay,budget,pass:billed<=budget,realSeasonsPerDay:allowed};
}
const BUDGET_MODE=process.env.CE2PG_BUDGET==="1";
// The budget run needs the play, not the career-page, reload, storage-wipe and fresh-browser checks (about 10 of the 21 minutes of a
// 3-season run); CE2PG_BUDGET_FULL=1 keeps them.
const SLIM=BUDGET_MODE&&process.env.CE2PG_BUDGET_FULL!=="1";
const num=(name,fallback)=>{const v=Number(process.env[name]);return Number.isFinite(v)&&process.env[name]!==""&&process.env[name]!==undefined?v:fallback;};
// The only place real-play waiting times live (slow, mid and fast pace; the gate checks all three).
const WAIT_PROFILES=Object.freeze({
  slow:Object.freeze({label:"slow",transfer:num("CE2PG_TRANSFER_MIN",40),results:num("CE2PG_RESULTS_MIN",90),short:num("CE2PG_SHORT_MIN",1)}),
  mid:Object.freeze({label:"mid",transfer:num("CE2PG_MID_TRANSFER_MIN",30),results:num("CE2PG_MID_RESULTS_MIN",60),short:num("CE2PG_SHORT_MIN",1)}),
  fast:Object.freeze({label:"fast",transfer:num("CE2PG_FAST_TRANSFER_MIN",25),results:num("CE2PG_FAST_RESULTS_MIN",30),short:num("CE2PG_SHORT_MIN",1)})
});
// Wait points: which profile bucket pays for each, and its share of that bucket (transfer minutes are split over the screen's phases).
const WAIT_POINTS=Object.freeze({
  "transfer-window":{cat:"transfer",share:0.6,why:"window open (at most 14 of the transfer minutes, see pointMinutes), both on the transfer screen"},
  "transfer-guesses":{cat:"transfer",share:0.2,why:"one manager locked guesses, the other still typing (half of what is left after the window)"},
  "transfer-signings":{cat:"transfer",share:0.2,why:"one manager locked signings, the other still typing (the other half)"},
  "results-entry":{cat:"results",share:1,why:"both on the results entry screen while the season is played offline"},
  "results-published":{cat:"results",share:0,why:"first manager published, the other still on the results screen (priced into results-entry at the dearer rate)"},
  "commit":{cat:"short",share:1,why:"both published, waiting for the coordinator's commit"},
  "ack":{cat:"short",share:1,why:"committed, waiting for the other acknowledgement"},
  "continue":{cat:"short",share:1,why:"CONTINUE TO SEASON N screen"}
});
// The shared transfer window itself is a 15-minute timer in the game, so the window wait is capped below it (14 min) and the rest of the
// transfer minutes are the guess and signing phases (half each). Without a cap, 24 min of "window" would expire the window.
const TRANSFER_WINDOW_CAP_MIN=14;
function pointMinutes(point,prof){
  const def=WAIT_POINTS[point];
  if(def.cat==="transfer"){const win=Math.min(TRANSFER_WINDOW_CAP_MIN,0.6*prof.transfer);return point==="transfer-window"?win:(prof.transfer-win)/2;}
  return prof[def.cat]*def.share;
}
const SAMPLE_LONG_MIN=num("CE2PG_BUDGET_SAMPLE_MIN",2);
const SAMPLE_SHORT_MIN=num("CE2PG_BUDGET_SHORT_SAMPLE_MIN",1);
// CE2PG_BUDGET_REALTIME=fast|mid|slow (or 1 = fast) waits the full minutes of that profile for real (fast = about 1 hour per season).
const REALTIME_PROFILE=process.env.CE2PG_BUDGET_REALTIME?({1:"fast","1":"fast"}[process.env.CE2PG_BUDGET_REALTIME]||process.env.CE2PG_BUDGET_REALTIME):null;
if(REALTIME_PROFILE&&!WAIT_PROFILES[REALTIME_PROFILE]){console.error(`CE2PG_BUDGET_REALTIME must be slow, mid, fast or 1 (got ${REALTIME_PROFILE})`);process.exit(2);}
const REALTIME_WAITS=Boolean(REALTIME_PROFILE);
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const VIEWPORTS={1:{daniel:{width:393,height:660},nik:{width:390,height:844}},2:{daniel:{width:390,height:844},nik:{width:412,height:915}},3:{daniel:{width:1280,height:800},nik:{width:393,height:660}}}[RUN];
const NAMES={daniel:"Daniel",nik:"Nik"};
const ROLE={daniel:"playerOne",nik:"playerTwo"};
const meter=createMeter();
let billedModel=null;const budgetWaits=[];

// ---------------------------------------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------------------------------------
const report={
  tool:"CE2PG",plan:PLAN_NAME,seasons:SEASONS,run:RUN,scenario:SCENARIO||null,startedAt:new Date().toISOString(),finishedAt:null,
  baseUrl:BASE,viewports:VIEWPORTS,showdowns:[],verdict:"RUNNING",fatal:null,checks:[],problems:[],timings:{phases:[],totalMs:0},
  checkpoints:[],meter:[],console:{daniel:[],nik:[]},network:{daniel:[],nik:[]},raw:{},observations:[],
  realUiSteps:[
    "SIGN IN WITH GOOGLE and the player choice (the emulator switch answers the Google popup with an Auth-emulator account)",
    "Home START automatically writes the career marker; Nik pastes the first real code once; later Showdowns: Daniel's Home START, Nik's Home JOIN tile",
    "league wheel SPIN, club pack OPEN, CONFIRM SHOWDOWN, I STARTED AT <club> (both)",
    "Shared Transfer Challenge every season: START, early end (both), guesses, LOCK MY GUESSES, signings, LOCK MY SIGNINGS, CONTINUE TO SEASON RESULTS",
    "season results typed and published (Daniel first, Nik first, or at the same time), COMMIT & ACKNOWLEDGE (Daniel), ACKNOWLEDGE (Nik), CONTINUE TO SEASON n",
    "after every season: SHOWDOWN HOME, Standings (bottom bar: THIS SHOWDOWN, CAREER), Career Statistics (TABLE, COMPARE, LEADERS), Trophy Room (MORE on a phone), Legacy (VIEW SEASON HISTORY), Rivalry Statistics, Settings; then CONTINUE SHOWDOWN back into the game",
    "Showdown Champion screen, HONOURS tab, BACK TO SHOWDOWN HOME; Settings > END SHOWDOWN (Showdown C)",
    "end: both reload after their local storage is wiped; a brand-new browser signs in as Daniel and as Nik and reads every page"],
  seededSteps:[
    "Local storage is wiped with a page script (localStorage.clear()) before the end reload; sign-in lives in sessionStorage and is left alone",
    "Auth: the Google popup is answered by the Firebase Auth emulator (tests/browser/support/emulator-runtime-switch.js)",
    "The Transfer Challenge's 15-minute window is ended early by both managers; guesses and signings are fixed typed values",
    "Season result numbers are typed from a seeded plan (they stand in for what the managers read off their FIFA 17 careers)",
    "The database is read directly (admin) only to confirm closures and pairing; every expected figure is recomputed from the typed inputs"]
};
const t0=Date.now();
let seasonNow=0,showdownNow="-";
function writeReport(){
  report.finishedAt=new Date().toISOString();report.timings.totalMs=Date.now()-t0;
  report.summary={checks:report.checks.length,passed:report.checks.filter(c=>c.pass).length,failed:report.checks.filter(c=>!c.pass).length,problems:report.problems.length};
  fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(REPORT_PATH,JSON.stringify(report,null,2));
}
const rel=p=>path.relative(ROOT,p);
async function shot(m,name){
  try{fs.mkdirSync(SHOT_DIR,{recursive:true});const file=path.join(SHOT_DIR,`${name}-${m.user}.png`.replace(/[^\w.\-]+/g,"_"));await m.page.screenshot({path:file,timeout:15000});return rel(file);}
  catch(error){return `(screenshot failed: ${String(error.message).split("\n")[0]})`;}
}
function dumpScreen(m,name,text){try{fs.mkdirSync(SHOT_DIR,{recursive:true});fs.writeFileSync(path.join(SHOT_DIR,`dump-${name}-${m.user}.txt`.replace(/[^\w.\-]+/g,"_")),text);}catch(_e){}}
const problemIds=new Set();
async function addProblem(m,id,screen,description,{severity="game-bug",name=null}={}){
  const key=`${id}|${m?m.user:"-"}`;if(problemIds.has(key))return;problemIds.add(key);
  const screenshot=m?await shot(m,name||`problem-${id}`):null;
  report.problems.push({id,severity,showdown:showdownNow,season:seasonNow,context:m?m.user:"both",screen,description:String(description).slice(0,1500),screenshot});
  console.log(`PROBLEM ${id} [${m?m.user:"both"}] ${showdownNow}/s${seasonNow} (${screen}): ${String(description).slice(0,400)}`);
}
// A recorded check. A failing check becomes a problem with a screenshot. It never throws.
async function check(m,id,label,ok,detail,{screen=""}={}){
  const pass=Boolean(ok),text=detail===undefined?"":typeof detail==="string"?detail:JSON.stringify(detail);
  report.checks.push({id,label,context:m?m.user:"both",showdown:showdownNow,season:seasonNow,pass,detail:pass?undefined:text.slice(0,1500)});
  console.log(`${pass?"ok  ":"FAIL"} ${id} [${m?m.user:"both"}] ${label}${pass?"":` -> ${text}`.slice(0,600)}`);
  if(!pass)await addProblem(m,id,screen||id,`${label}. ${text}`);
  return pass;
}
const eq=(m,id,label,actual,expected,opts)=>check(m,id,label,JSON.stringify(actual)===JSON.stringify(expected),`expected ${JSON.stringify(expected)} but the screen shows ${JSON.stringify(actual)}`,opts);
async function phase(name,fn){const started=Date.now();try{return await fn();}finally{report.timings.phases.push({phase:name,showdown:showdownNow,season:seasonNow,ms:Date.now()-started,t0:started,t1:Date.now()});}}
const debug=(label,text)=>{if(DEBUG)console.log(`--- ${label}: ${String(text).replace(/\s+/g," ").slice(0,2000)}`);};
const norm=s=>String(s||"").replace(/\s+/g," ").trim();

// ---------------------------------------------------------------------------------------------------------------------------
// Scoring model (the game's rules, recomputed from the inputs: Champions League 5, league title 3, domestic cup 1, performance
// bonus 1 for 100+ league points or 100+ league goals, individual awards bonus 1 for top scorer or top assist; equal
// season points is a draw, no tiebreak).
// ---------------------------------------------------------------------------------------------------------------------------
function scoreSeason(r){
  const cl=r.championsLeague?5:0,title=r.leaguePosition===1?3:0,cup=r.domesticCup?1:0,perf=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,indiv=(r.topScorer||r.topAssist)?1:0;
  return {championsLeague:cl,leagueTitle:title,domesticCup:cup,performanceBonus:perf,individualAwardsBonus:indiv,total:cl+title+cup+perf+indiv};
}
function seasonWinner(d,n){
  const sd=scoreSeason(d).total,sn=scoreSeason(n).total;
  // r83 (Nik 2026-10-23): no tiebreak. Equal Showdown points is a draw.
  if(sd!==sn)return {side:sd>sn?"daniel":"nik",byTiebreak:false};
  return {side:"draw",byTiebreak:false};
}
function tally(seasons){
  const t={};
  for(const user of ["daniel","nik"])t[user]={total:0,W:0,D:0,L:0,league:0,cup:0,cl:0,trophies:0,seasons:0,points:0,goals:0,bestScore:null,perfect:0,highPoints:null,highGoals:null};
  for(const season of seasons){
    const w=seasonWinner(season.daniel,season.nik);
    for(const user of ["daniel","nik"]){
      const r=season[user],x=t[user],s=scoreSeason(r).total;
      x.seasons+=1;x.total+=s;if(w.side===user)x.W+=1;else if(w.side==="draw")x.D+=1;else x.L+=1;
      if(r.leaguePosition===1)x.league+=1;if(r.domesticCup)x.cup+=1;if(r.championsLeague)x.cl+=1;
      x.points+=r.leaguePoints;x.goals+=r.leagueGoals;if(s===11)x.perfect+=1;
      x.bestScore=x.bestScore===null?s:Math.max(x.bestScore,s);x.highPoints=x.highPoints===null?r.leaguePoints:Math.max(x.highPoints,r.leaguePoints);x.highGoals=x.highGoals===null?r.leagueGoals:Math.max(x.highGoals,r.leagueGoals);
      x.trophies=x.league+x.cup+x.cl;
    }
  }
  return t;
}
const overallWinner=t=>t.daniel.total>t.nik.total?"daniel":t.nik.total>t.daniel.total?"nik":"draw";

// The career every career page should show, from the career's Showdowns in order: completed ones count in full, the live one
// counts its committed seasons only where the page shows the live Showdown (Standings This Showdown, Rivalry Statistics), an
// ended-early one never counts (History lists it as one status row). The test run never appears.
function careerExpect(career){
  const completed=career.filter(s=>s.state==="completed");
  const t=tally(completed.flatMap(s=>s.seasons));
  const x={};
  for(const u of ["daniel","nik"]){
    x[u]={...t[u],completed:completed.length,sdWins:0,sdDraws:0,sdLosses:0,avgPoints:t[u].seasons?t[u].points/t[u].seasons:0,avgGoals:t[u].seasons?t[u].goals/t[u].seasons:0};
  }
  const margins=[];
  for(const s of completed){
    const st=tally(s.seasons),win=overallWinner(st);
    for(const u of ["daniel","nik"]){if(win==="draw")x[u].sdDraws+=1;else if(win===u)x[u].sdWins+=1;else x[u].sdLosses+=1;}
    if(win!=="draw")margins.push({manager:win,value:Math.abs(st.daniel.total-st.nik.total)});
  }
  const seasonsAll=completed.flatMap(s=>s.seasons);
  const record=(vals)=>{if(!vals.length)return null;const max=Math.max(...vals.map(v=>v.value));const who=new Set(vals.filter(v=>v.value===max).map(v=>v.manager));return {value:max,holder:who.size===1?[...who][0]:"shared"};};
  const per=(fn)=>seasonsAll.flatMap(s=>["daniel","nik"].map(u=>({manager:u,value:fn(s[u])})));
  const records={
    season:record(per(r=>scoreSeason(r).total)),points:record(per(r=>r.leaguePoints)),goals:record(per(r=>r.leagueGoals)),
    biggestWin:record(margins),perfect:seasonsAll.length?record(["daniel","nik"].map(u=>({manager:u,value:x[u].perfect}))):null
  };
  // History numbers every indexed Showdown in career order (the hidden test run is dropped before), so a live Showdown takes a
  // number too; Legacy lists completed and ended-early rows only.
  let n=0;for(const s of career){n+=1;s.number=n;}
  return {x,records,rows:career.filter(s=>s.state==="completed"||s.state==="ended"),completedCount:completed.length};
}

// Seeded generation of the score inputs.
function rngFor(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function buildPlan(seasons,teamCount,target,seed){
  let last=null;
  for(let attempt=0;attempt<60;attempt+=1){try{return buildPlanOnce(seasons,teamCount,target,seed,attempt);}catch(error){last=error;}}
  throw last;
}
function buildPlanOnce(N,teamCount,target,seed,attempt){
  const rng=rngFor(seed*1000+RUN*17+teamCount+attempt*7919);
  const maxPoints=(teamCount-1)*6,pick=n=>Math.floor(rng()*n);
  const candidate=()=>{
    const result=()=>{
      const position=rng()<0.3?1:2+pick(Math.min(teamCount,12)-1);
      const big=rng()<0.18&&maxPoints>=100;
      const points=big?100+pick(maxPoints-99):Math.min(maxPoints,20+pick(Math.max(1,Math.min(80,maxPoints-20))));
      const goals=rng()<0.18?100+pick(40):20+pick(75);
      return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:rng()<0.4,championsLeague:rng()<0.25,topScorer:rng()<0.35,topAssist:rng()<0.3};
    };
    return {daniel:result(),nik:result()};
  };
  const intents=[];
  for(let k=1;k<=N;k+=1){
    let intent="any";
    if(N>=3&&RUN===3&&k===Math.ceil(N/2))intent="tie";
    if(N>=10&&RUN===1&&k===7)intent="tie";
    if(N>=3&&k===1&&target!=="draw")intent=target==="daniel"?"nik":"daniel";// the eventual winner trails after season 1
    if(target==="draw"&&N===1)intent="tie";
    intents.push(intent);
  }
  const plan=[];
  for(let k=1;k<=N;k+=1){
    let chosen=null;
    for(let tries=0;tries<4000&&!chosen;tries+=1){
      const c=candidate(),w=seasonWinner(c.daniel,c.nik),i=intents[k-1];
      if(c.daniel.leaguePosition===c.nik.leaguePosition)continue;// two clubs never share a league position
      if(i==="tie"&&scoreSeason(c.daniel).total!==scoreSeason(c.nik).total)continue;
      if(i==="daniel"&&w.side!=="daniel")continue;if(i==="nik"&&w.side!=="nik")continue;
      if(i==="any"&&w.side==="draw")continue;
      if(Math.max(scoreSeason(c.daniel).total,scoreSeason(c.nik).total)<3)continue;
      if(k===N&&target){
        const t=tally([...plan,c]);
        if(overallWinner(t)!==target)continue;
        if(target!=="draw"&&Math.abs(t.daniel.total-t.nik.total)<1)continue;
      }
      chosen=c;
    }
    if(!chosen)throw new Error(`CE2PG could not build a ${N}-season plan (target ${target}, season ${k}, intent ${intents[k-1]})`);
    plan.push(chosen);
  }
  return plan;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Emulator helpers (admin reads only confirm what was persisted)
// ---------------------------------------------------------------------------------------------------------------------------
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
async function adminUntil(p,test,label,timeout=30000){const end=Date.now()+timeout;for(;;){const doc=await admin(p);if(doc&&test(doc))return doc;if(Date.now()>end)throw new Error(`${label}: ${JSON.stringify(doc).slice(0,400)}`);await new Promise(resolve=>setTimeout(resolve,500));}}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(docUrl("rivalries/probe"));
  if(put.status!==200||after.status!==403)throw new Error(`composed production Rules did not activate (PUT ${put.status}, open read ${after.status})`);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Browser contexts
// ---------------------------------------------------------------------------------------------------------------------------
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;
const NOISE_ABORT=/ERR_ABORTED|NS_BINDING_ABORTED/;
function classifyNetwork(e){
  if(/fonts\.(googleapis|gstatic)\.com/.test(e.url))return "environment";
  if(e.kind==="requestfailed"&&/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/.test(e.url))return "benign-listen-channel-closed";
  if(e.kind==="http"&&/127\.0\.0\.1:\d+\/v1\/projects\/.+documents:commit/.test(e.url)&&(e.status===409||e.status===400&&/ABORTED|FAILED_PRECONDITION|aborted|failed-precondition|precondition/i.test(e.body||"")))return "benign-write-contention";
  if(e.kind==="http"&&e.status===403&&/documents:commit/.test(e.url)&&/PERMISSION_DENIED/.test(e.body||""))return "rules-denied-commit";
  if(e.kind==="http"&&e.status===403&&/documents(:batchGet|\/)/.test(e.url)&&/PERMISSION_DENIED/.test(e.body||""))return "rules-denied-read";
  return "unexpected";
}
function wirePage(m){
  const {page}=m;
  page.on("pageerror",error=>{m.log.pageErrors.push(error.message);report.console[m.account].push({showdown:showdownNow,season:seasonNow,type:"pageerror",text:error.message.slice(0,400)});});
  page.on("console",message=>{
    const type=message.type();
    if(type==="error"||type==="warning"){
      const text=message.text().slice(0,400);
      report.console[m.account].push({who:m.user,showdown:showdownNow,season:seasonNow,type,text});
      if(type==="error"&&!/Failed to load resource/.test(text))m.log.consoleErrors.push(text);
    }
  });
  page.on("requestfailed",request=>{
    const failure=request.failure()?.errorText||"failed";
    const entry={who:m.user,showdown:showdownNow,season:seasonNow,kind:"requestfailed",method:request.method(),url:request.url().slice(0,200),error:failure};
    entry.class=classifyNetwork(entry);report.network[m.account].push(entry);if(!NOISE_ABORT.test(failure)&&entry.class==="unexpected")m.log.failedRequests.push(entry);
  });
  page.on("response",async response=>{
    if(response.status()>=400){
      const entry={who:m.user,showdown:showdownNow,season:seasonNow,kind:"http",status:response.status(),method:response.request().method(),url:response.url().slice(0,200)};
      try{entry.body=(await response.text()).replace(/\s+/g," ").slice(0,entry.status===403?900:300);}catch(_e){}
      entry.class=classifyNetwork(entry);report.network[m.account].push(entry);if(entry.class==="unexpected")m.log.httpErrors.push(entry);
    }
  });
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))m.log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))m.log.productionRuntime+=1;});
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
}
async function openManager(browser,account,label=account){
  const viewport=VIEWPORTS[account];
  const context=await browser.newContext({viewport});
  const log={pageErrors:[],consoleErrors:[],failedRequests:[],httpErrors:[],forbidden:[],productionRuntime:0,taps:[]};
  await context.exposeBinding("__cmsTap",(_source,tap)=>{log.taps.push(tap);});
  await context.addInitScript(()=>{window.addEventListener("click",event=>{if(!event.isTrusted)return;const b=event.target&&event.target.closest&&event.target.closest("button,.menuTile");if(b&&typeof window.__cmsTap==="function")void window.__cmsTap({id:b.id||"",text:(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60)});},true);});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  // Registered after the SDK route, so it answers firebase-firestore.js first (Playwright runs the newest matching route first).
  await installFirestoreMeter(context,{sdkDir:SDK_DIR,user:label,sink:meter.events,firestoreOrigin:FIRESTORE});
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  const m={user:label,account,context,page,log,viewport};
  wirePage(m);
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(account),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return m;
}
async function reload(m){
  await m.page.reload({waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
}
async function describe(m){
  return m.page.evaluate(()=>{
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay']")].filter(o=>{const st=getComputedStyle(o);return !o.classList.contains("hidden")&&st.display!=="none"&&st.visibility!=="hidden";}).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,200)}`);
    const pair=window.CareerModePersistentNikDanielPair?.getState?.();
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | pair=${pair?`${pair.status}/${pair.connectionState}/${String(pair.rivalryId).slice(0,14)}`:"-"} | session=${window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState||"-"} | overlays=${overlays.join(" ## ")}`;
  }).catch(e=>e.message);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Small UI helpers (as tests/browser/r79-two-player-journey-audit.cjs)
// ---------------------------------------------------------------------------------------------------------------------------
const textOf=async(m,sel)=>norm(await m.page.locator(sel).first().evaluate(el=>el.textContent).catch(()=>""));
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const sessionOf=m=>m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null);
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
const homeTile=m=>m.page.evaluate(()=>{const t=document.getElementById("newShowdown");return t?[".menuTileCode",".menuTileLabel",".menuTileMeta"].map(s=>(t.querySelector(s)?.textContent||"").trim()):null;});
async function signIn(m,label,{fresh=false}={}){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  const choose=m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")});
  if(!fresh){await choose.click({timeout:30000});}
  else{
    // Same Google account in a fresh browser: the chooser can show for a moment and close by itself once the account's player
    // loads, so it is tapped only while it is still there (as in the r79 journey's moveToFreshBrowser).
    const by=Date.now()+30000;
    while(await m.page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent||"")!==label.toUpperCase()){
      if(Date.now()>by)throw new Error(`${m.user}: the fresh browser never named the player ${label}: ${await describe(m)}`);
      if(await choose.isVisible().catch(()=>false))await choose.click({timeout:3000}).catch(()=>{});
      await m.page.waitForTimeout(500);
    }
  }
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
  // A seasons/connect screen opened by the first tap is left with its own back button, so the run starts on Showdown Home.
  await backToShowdownHome(m);
}
async function openSettings(m){
  if(await m.page.locator("#settingsButton").isVisible().catch(()=>false))await m.page.locator("#settingsButton").click({timeout:30000});
  else await m.page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
  await m.page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
}
async function closeSettings(m){
  if(!await m.page.locator("#settingsOverlay").isVisible().catch(()=>false))return;
  await m.page.locator(".settingsFooter .menuButton").click();
  await m.page.locator("#settingsOverlay").waitFor({state:"hidden",timeout:15000});
}
async function backToShowdownHome(m){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return true;
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  return false;
}
async function bothActive(managers,rivalryId){
  for(const m of managers)await m.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active"&&(!id||s.rivalryId===id));},rivalryId||null,{timeout:45000});
  for(const m of managers)await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
}
const waitTransferPhase=(m,phase)=>m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout:45000});
const waitTransferState=(m,key,role)=>m.page.waitForFunction(([k,v])=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.[k]?.includes(v)===true,[key,role],{timeout:45000});
async function fillCombo(m,id,value){await m.page.locator(`#${id}`).fill(value);await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});}
async function privateTokenAbsent(m,token,id,label){
  const leak=await m.page.evaluate(value=>({text:(document.body.innerText||"").includes(value),inputs:[...document.querySelectorAll("input")].filter(n=>String(n.value||"").includes(value)).map(n=>n.id)}),token);
  await check(m,id,label,!leak.text&&leak.inputs.length===0,`private text "${token}" leaked: ${JSON.stringify(leak)}`,{screen:"Shared Transfer Challenge"});
}

// ---------------------------------------------------------------------------------------------------------------------------
// Starting a Showdown (r79/r80 flow: one start flow, only Daniel starts; first real pairing by a one-time code; later JOIN)
// ---------------------------------------------------------------------------------------------------------------------------
async function danielStartsShowdown(m,length,{firstRealStart=false}={}){
  await backToShowdownHome(m);
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  await check(m,`start.${showdownNow}.realPath`,"START has no checkmark or test label",await m.page.locator("#cmsRealCareerRow,#cmsRealCareerCheck,#cmsTestRunNote").count()===0,"mode UI shown",{screen:"Seasons"});
  await m.page.locator("#roundAmount").selectOption(String(length));
  await m.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(m).locator("code").waitFor({timeout:30000});
  const marker=await m.page.evaluate(async()=>{await window.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(window.CareerModeCareerStartMarker));return window.CareerModeCareerStartMarker.readCurrentMarker();});
  await check(m,`start.${showdownNow}.marker`,"START automatically writes the real career marker before the code",marker.status==="ready"&&marker.active===true,marker,{screen:"Seasons"});
  return (await pairPanel(m).locator("code").innerText()).trim();
}
async function nikJoins(daniel,nik,code,{typed,length}){
  const rivalryId=code.replace(/^CMS17R?-/,"");
  if(typed){
    await backToShowdownHome(nik);
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
  }else{
    await backToShowdownHome(nik);
    const meta=`Daniel started ${length} season${length===1?"":"s"}. Tap to join.`;
    try{await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,meta,{timeout:45000});}
    catch(_e){await check(nik,`start.${showdownNow}.joinTile`,"Nik's Home shows JOIN DANIEL'S SHOWDOWN by itself",false,JSON.stringify(await homeTile(nik)),{screen:"Showdown Home"});throw new Error("Nik's JOIN tile never showed");}
    await eq(nik,`start.${showdownNow}.joinTile`,"Nik's Home shows JOIN DANIEL'S SHOWDOWN by itself",await homeTile(nik),["JOIN","JOIN DANIEL'S SHOWDOWN",meta],{screen:"Showdown Home"});
    await nik.page.locator("#newShowdown").click({timeout:30000});
  }
  await bothActive([daniel,nik],rivalryId);
  return rivalryId;
}
// The shared setup through the real UI: league, clubs, both confirm, both start their careers.
async function playSetup(daniel,nik){
  for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
  await check(nik,`setup.${showdownNow}.leagueWait`,"Nik waits for Daniel on the league wheel",await nik.page.locator("#spinLeague").isDisabled(),"Nik can spin",{screen:"League wheel"});
  await daniel.page.locator("#spinLeague").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
  const league=norm(await daniel.page.locator("#selectedLeague").textContent());
  await nik.page.waitForFunction(l=>document.getElementById("selectedLeague")?.textContent===l,league,{timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
  await daniel.page.locator("#openClubPack").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
  const read=m=>m.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
  const clubs=await read(daniel);
  await nik.page.waitForFunction(c=>document.getElementById("clubNameOne")?.textContent?.trim()===c[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===c[1],clubs,{timeout:30000});
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  await nik.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:`I STARTED AT ${clubs[0].toUpperCase()}`,exact:true}).click({timeout:30000});
  await nik.page.getByRole("button",{name:`I STARTED AT ${clubs[1].toUpperCase()}`,exact:true}).click({timeout:30000});
  for(const m of [daniel,nik]){
    await rosterRoulette.waitForTransfer(m.page,45000);
    await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});
  }
  const teamCount=await daniel.page.evaluate(()=>window.CareerModeProductionSharedSeasonResults?.getState?.()?.state?.teamCount??null).catch(()=>null)
    ||await daniel.page.evaluate(l=>{const cat=window.CareerModeSharedShowdownCatalog?.catalog;if(!cat)return null;const key=Object.keys(cat).find(k=>k.replace(/_/g," ").toLowerCase()===String(l).toLowerCase());return key?cat[key].length:null;},league).catch(()=>null)||20;
  return {league,clubs,teamCount};
}

// ---------------------------------------------------------------------------------------------------------------------------
// One season (as two-manager-browser-journey.cjs / the r79 journey)
// ---------------------------------------------------------------------------------------------------------------------------
async function playTransfers(daniel,nik,tag){
  const tokenD=`QW${tag}X Daniel Signing`,tokenN=`ZP${tag}V Nik Signing`;
  await daniel.page.waitForFunction(()=>document.getElementById("startTransferTimer")&&!document.getElementById("startTransferTimer").classList.contains("hidden"),null,{timeout:45000});
  await check(nik,`${showdownNow}.S${seasonNow}.transfer.coordinator`,"only Daniel can start the shared transfer window",!(await nik.page.locator("#startTransferTimer").isVisible()),"Nik sees START",{screen:"Shared Transfer Challenge"});
  await daniel.page.locator("#startTransferTimer").click({timeout:30000});
  await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
  await budgetWait("transfer-window");
  await daniel.page.locator("#endTransferTimer").click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.locator("#endTransferTimer").click({timeout:30000});
  await waitTransferPhase(nik,"guess_entry");await waitTransferPhase(daniel,"guess_entry");
  await daniel.page.locator("#p2Guess1Type").selectOption("league");await fillCombo(daniel,"p2Guess1Value","Premier League");
  await nik.page.locator("#p1Guess1Type").selectOption("nationality");await fillCombo(nik,"p1Guess1Value","Brazil");
  await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await budgetWait("transfer-guesses");
  await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"signing_entry");await waitTransferPhase(daniel,"signing_entry");
  await daniel.page.locator("#p1Signing1Name").fill(tokenD);await daniel.page.locator("#p1Signing1Overall").fill("71");await daniel.page.locator("#p1Signing1Position").selectOption("ST");await fillCombo(daniel,"p1Signing1League","Premier League");await fillCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await privateTokenAbsent(nik,tokenD.split(" ")[0],`${showdownNow}.S${seasonNow}.transfer.privacy`,"Daniel's locked signing stays hidden from Nik before completion");
  await waitTransferState(nik,"signingLockedRoles","playerOne");await waitTransferPhase(nik,"signing_entry");
  await budgetWait("transfer-signings");
  await nik.page.locator("#p2Signing1Name").fill(tokenN);await nik.page.locator("#p2Signing1Overall").fill("71");await nik.page.locator("#p2Signing1Position").selectOption("ST");await fillCombo(nik,"p2Signing1League","Serie A TIM");await fillCombo(nik,"p2Signing1Nationality","Brazil");
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
}
async function fillSeasonResult(m,prefix,result){
  await m.page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await m.page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await m.page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]])await m.page.locator(`#${prefix}${suffix}`).setChecked(Boolean(result[key]));
}
async function prepareReview(m){
  await m.page.locator("#completeSeason").click({timeout:30000});
  await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:30000});
}
async function publish(m){
  await prepareReview(m);
  await m.page.locator("#confirmSeasonCompletion").click({timeout:30000});
  await m.page.waitForFunction(()=>/YOUR RESULT IS PUBLISHED|BOTH MANAGERS PUBLISHED/.test(document.getElementById("seasonReviewHeading")?.textContent||""),null,{timeout:30000});
}
async function playSeasonResults(daniel,nik,k,planSeason){
  for(const m of [daniel,nik]){
    await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
    await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
  }
  await budgetWait("results-entry");
  const mode=k%3===0?"simultaneous":k%2===1?"daniel-first":"nik-first";
  const fill={daniel:()=>fillSeasonResult(daniel,"p1",planSeason.daniel),nik:()=>fillSeasonResult(nik,"p2",planSeason.nik)};
  if(mode==="simultaneous"){
    await fill.daniel();await fill.nik();await prepareReview(daniel);await prepareReview(nik);
    await Promise.all([daniel.page.locator("#confirmSeasonCompletion").click({timeout:30000}),nik.page.locator("#confirmSeasonCompletion").click({timeout:30000})]);
  }else{
    const [first,second]=mode==="daniel-first"?[daniel,nik]:[nik,daniel];
    const prefix=first.account==="daniel"?"p1":"p2",res=planSeason[first.account];
    await fill[first.account]();await publish(first);
    const leaked=await second.page.evaluate(([p,r])=>{const card=document.getElementById(p==="p1"?"seasonReviewOne":"seasonReviewTwo");return {review:Boolean(card&&!card.classList.contains("hidden")&&getComputedStyle(card).display!=="none"&&card.getClientRects().length>0),points:document.getElementById(`${p}LeaguePoints`)?.value===String(r.leaguePoints)&&r.leaguePoints!==0};},[prefix,res]);
    await check(second,`${showdownNow}.S${k}.results.privacy`,`${NAMES[first.account]}'s published numbers stay hidden from ${NAMES[second.account]} until ${NAMES[second.account]} publishes`,!leaked.review&&!leaked.points,leaked,{screen:"Shared Season Results"});
    await budgetWait("results-published");
    await fill[second.account]();await publish(second);
  }
  for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
  return mode;
}
async function commitSeason(daniel,nik,k,planSeason,final){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="LOCK & CONFIRM SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>["WAITING FOR DANIEL","CONFIRM SEASON"].includes(document.getElementById("sharedSeasonCommitAction")?.textContent),null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR DANIEL")await check(nik,`${showdownNow}.S${k}.commit.coordinator`,"Nik cannot commit the season",await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),"button enabled",{screen:"Shared Season Commit"});
  await budgetWait("commit");
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(CONFIRMED ✓ · WAITING FOR RIVAL|SEASON CONFIRMED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="CONFIRM SEASON",null,{timeout:45000});
  await budgetWait("ack");
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  const exp={d:scoreSeason(planSeason.daniel),n:scoreSeason(planSeason.nik),w:seasonWinner(planSeason.daniel,planSeason.nik)};
  const winnerText=exp.w.side==="draw"?"Season result: Draw":`Season winner: ${NAMES[exp.w.side]}`;
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON CONFIRMED ✓"||window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED"||document.getElementById("finalWinnerScreen")&&getComputedStyle(document.getElementById("finalWinnerScreen")).visibility!=="hidden"&&document.getElementById("finalWinnerScreen").getClientRects().length>0,null,{timeout:45000});
    if(!final){
      await m.page.waitForFunction(n=>{const s=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return s?.phase==="SCORING_RECONCILED"&&s.seasonNumber===n;},k,{timeout:60000});
      await m.page.locator("#sharedCanonicalScoringPanel").waitFor({state:"visible",timeout:15000});
      const state=await m.page.evaluate(()=>{const v=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return v?{authoritative:v.authoritative,p1:v.scoring?.playerOne,p2:v.scoring?.playerTwo,winner:v.winner}:null;});
      const pick=s=>s&&{championsLeague:s.championsLeague,leagueTitle:s.leagueTitle,domesticCup:s.domesticCup,performanceBonus:s.performanceBonus,individualAwardsBonus:s.individualAwardsBonus,total:s.total};
      await eq(m,`${showdownNow}.S${k}.scoring.state`,"canonical scoring equals the recomputed breakdown",{authoritative:state?.authoritative,d:pick(state?.p1),n:pick(state?.p2),winner:state?.winner},{authoritative:true,d:exp.d,n:exp.n,winner:exp.w.side==="draw"?"draw":ROLE[exp.w.side]},{screen:"Season scoring"});
      await eq(m,`${showdownNow}.S${k}.scoring.totals`,"season totals on screen",await textOf(m,"#sharedCanonicalScoringTotals"),`Daniel: ${exp.d.total} · Nik: ${exp.n.total}`,{screen:"Season scoring"});
      await eq(m,`${showdownNow}.S${k}.scoring.winner`,"season winner on screen",await textOf(m,"#sharedCanonicalScoringWinner"),winnerText,{screen:"Season scoring"});
    }
  }
  return exp;
}
// Shared History panel (after every non-final season) against this Showdown's running tally.
async function checkSharedHistory(m,k,total,seasons){
  const t=tally(seasons.slice(0,k));
  try{await m.page.locator("#sharedHistoryConvergencePanel").waitFor({state:"visible",timeout:45000});}
  catch(_e){await check(m,`${showdownNow}.S${k}.history.visible`,"Shared History panel appears",false,"panel never became visible",{screen:"Shared History"});return;}
  await m.page.waitForFunction(n=>new RegExp(`^${n} of `).test((document.getElementById("sharedHistoryConvergenceSummary")?.textContent||"").trim()),k,{timeout:30000}).catch(()=>{});
  const heading=await textOf(m,"#sharedHistoryConvergenceHeading"),summary=await textOf(m,"#sharedHistoryConvergenceSummary"),records=await textOf(m,"#sharedHistoryConvergenceRecords"),trophies=await textOf(m,"#sharedHistoryConvergenceTrophies");
  debug(`${showdownNow} S${k} history ${m.user}`,`${heading} | ${summary} | ${records} | ${trophies}`);
  const lead=t.daniel.total===t.nik.total?"Level":t.daniel.total>t.nik.total?`Daniel leads by ${t.daniel.total-t.nik.total}`:`Nik leads by ${t.nik.total-t.daniel.total}`;
  await eq(m,`${showdownNow}.S${k}.history.heading`,"Shared History heading",heading,"SHOWDOWN SO FAR",{screen:"Shared History"});
  const wantSummary=new RegExp(`^${k} of ${total} seasons? played · [A-Z0-9 ]+ · Daniel ${t.daniel.total} - ${t.nik.total} Nik · ${lead}$`);
  await check(m,`${showdownNow}.S${k}.history.summary`,"Shared History overall totals and lead",wantSummary.test(summary),`expected "${k} of ${total} seasons played ... Daniel ${t.daniel.total} - ${t.nik.total} Nik · ${lead}" but saw "${summary}"`,{screen:"Shared History"});
  const wantRec=u=>new RegExp(`${NAMES[u]} \\([^)]+\\): ${t[u].W} won, ${t[u].D} drawn, ${t[u].L} lost · ${t[u].total} pts`);
  await check(m,`${showdownNow}.S${k}.history.records`,"Shared History W/D/L and points per manager",wantRec("daniel").test(records)&&wantRec("nik").test(records),`expected Daniel ${t.daniel.W}W ${t.daniel.D}D ${t.daniel.L}L ${t.daniel.total} pts, Nik ${t.nik.W}W ${t.nik.D}D ${t.nik.L}L ${t.nik.total} pts; saw "${records}"`,{screen:"Shared History"});
  const wantTro=u=>`${NAMES[u]} ${t[u].trophies} trophies (${t[u].league} league, ${t[u].cup} cup, ${t[u].cl} Champions League)`;
  await check(m,`${showdownNow}.S${k}.history.trophies`,"Shared History trophy attribution",trophies.includes(wantTro("daniel"))&&trophies.includes(wantTro("nik")),`expected "${wantTro("daniel")}" and "${wantTro("nik")}"; saw "${trophies}"`,{screen:"Shared History"});
}
async function continueToSeason(daniel,nik,next,total){
  for(const m of [daniel,nik])await m.page.waitForFunction(n=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${n}`,next,{timeout:45000});
  await budgetWait("continue");
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(n=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${n}`,next,{timeout:45000});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:30000});
    await m.page.waitForFunction(v=>document.getElementById("seasonIndicator")?.textContent===v,`Season ${next} / ${total}`,{timeout:30000});
    await rosterRoulette.waitForTransfer(m.page,30000);
  }
}
// Back into the live Showdown from Showdown Home: CONTINUE SHOWDOWN, then (on the season dashboard) its primary action, until the
// season's Shared Transfer Challenge shows.
async function returnToGame(m,season,total){
  await backToShowdownHome(m);
  await m.page.waitForFunction(()=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim()==="CONTINUE SHOWDOWN",null,{timeout:30000}).catch(()=>{});
  await eq(m,`${showdownNow}.S${season-1}.home.tile`,"Showdown Home's tile reads CONTINUE SHOWDOWN while the Showdown is live",await homeTile(m),["LIVE","CONTINUE SHOWDOWN","Your Showdown is live. Tap to continue."],{screen:"Showdown Home"});
  await m.page.locator("#newShowdown").click({timeout:30000});
  const deadline=Date.now()+60000;
  while(!(await m.page.locator("#transferChallenge").isVisible().catch(()=>false))){
    if(Date.now()>deadline){await check(m,`${showdownNow}.S${season-1}.return`,"CONTINUE SHOWDOWN returns to the live season",false,await describe(m),{screen:"Showdown Home"});throw new Error(`${m.user} did not return to the game`);}
    // GET READY (both connected) opens first: START CAREER continues into the season.
    const getReady=m.page.locator("#productionSharedJourneyEntryOverlay");
    if(await getReady.isVisible().catch(()=>false)){
      const go=getReady.getByRole("button",{name:/^(START CAREER|CONTINUE CAREER)$/});
      if(await go.first().isVisible().catch(()=>false)&&await go.first().isEnabled().catch(()=>false))await go.first().click({timeout:5000}).catch(()=>{});
    }else if(await m.page.locator("#dashboard").isVisible().catch(()=>false)){
      const label=await textOf(m,"#seasonPrimaryAction");
      if(/TRANSFER|SEASON/i.test(label)&&await m.page.locator("#seasonPrimaryAction").isEnabled().catch(()=>false))await m.page.locator("#seasonPrimaryAction").click({timeout:5000}).catch(()=>{});
    }
    await m.page.waitForTimeout(700);
  }
  await m.page.waitForFunction(v=>document.getElementById("seasonIndicator")?.textContent===v,`Season ${season} / ${total}`,{timeout:20000}).catch(()=>{});
  await eq(m,`${showdownNow}.S${season-1}.return.indicator`,`back in the game on Season ${season} / ${total}`,await textOf(m,"#seasonIndicator"),`Season ${season} / ${total}`,{screen:"Shared Transfer Challenge"});
}
async function reloadBoth(daniel,nik,sessionCode){
  for(const m of [daniel,nik])await reload(m);
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000}).catch(()=>{});
    await check(m,`${showdownNow}.S${seasonNow}.reload.session`,"after a reload the manager is back in the same private session",(await sessionOf(m))===sessionCode,`session ${await sessionOf(m)} != ${sessionCode}`,{screen:"Remote Joining"});
    await m.page.locator("#dashboard, #transferChallenge, #seasonEntry, #mainMenu").filter({visible:true}).first().waitFor({state:"visible",timeout:45000}).catch(()=>{});
    await m.page.waitForTimeout(1500);
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Career pages: read every page as a player would, then compare every figure with the recomputed career.
// ---------------------------------------------------------------------------------------------------------------------------
// r86: the Special Player chip sits right after a manager's name, so the figure readers leave it out (the r86-sp-chip
// contracts check the chips). The rule is added and removed inside one evaluate, so nothing is painted without it.
const hostText=(m,hostId)=>m.page.evaluate(id=>{const h=document.getElementById(id);if(!h||h.classList.contains("hidden"))return "";const hide=document.createElement("style");hide.textContent="[data-sp-chip]{display:none!important}";document.head.appendChild(hide);try{return (h.innerText||"").replace(/\s+/g," ").trim();}finally{hide.remove();}},hostId);
// Figures on these screens count up when they open, and the online career loads after the frame: wait until the text has
// stopped changing and is not a loading state.
const LOADING_TEXT=/Loading (career history|your showdown history|standings|rivalry statistics)|LOADING CAREER HISTORY|Loading career history/i;
async function stableHostText(m,hostId,quietMs=1800,maxMs=25000){
  let text=await hostText(m,hostId),since=Date.now();const end=Date.now()+maxMs;
  while(Date.now()<end&&(Date.now()-since<quietMs||!text||LOADING_TEXT.test(text))){await m.page.waitForTimeout(300);const next=await hostText(m,hostId);if(next!==text){text=next;since=Date.now();}}
  return text;
}
async function clickTab(m,hostId,name){
  const re=new RegExp(`^\\s*${name.replace(/-/g,"[-‐-―]?")}\\s*$`,"i");
  let b=m.page.locator(`#${hostId} button:visible, #${hostId} [role=tab]:visible, #${hostId} label:visible`).filter({hasText:re}).first();
  if(!(await b.count()))b=m.page.locator(`#${hostId}`).getByText(re).first();
  if(!(await b.count()))return false;
  await b.click({timeout:5000}).catch(()=>{});
  await m.page.waitForTimeout(1200);
  return true;
}
const TABS={careerStatistics:["TABLE","COMPARE","LEADERS"],standings:["THIS SHOWDOWN","CAREER"],legacy:[],trophyRoom:[],statistics:["TOTALS","HEAD TO HEAD","SEASONS","TROPHIES"]};
async function openStandings(m){
  await backToShowdownHome(m);
  await m.page.locator("button.sd-nav-tab[data-nav-key=standings]:visible").first().click({timeout:8000});
  await m.page.locator("#standings").waitFor({state:"visible",timeout:15000});
}
async function openPage(m,hostId){
  if(hostId==="standings")return openStandings(m);
  await backToShowdownHome(m);
  if(hostId==="careerStatistics")await m.page.locator("#careerStatisticsButton").click({timeout:20000});
  else if(hostId==="legacy")await m.page.locator("#legacyButton").click({timeout:20000});
  else if(hostId==="trophyRoom"){await m.page.locator("#careerStatisticsButton").click({timeout:20000});await m.page.locator("#trophyRoomButton").click({timeout:20000});}
  else if(hostId==="statistics"){
    // Rivalry Statistics: Career Statistics' CURRENT RIVALRY STATISTICS button when it shows, else the dashboard's.
    await m.page.locator("#careerStatisticsButton").click({timeout:20000});
    await m.page.waitForTimeout(1500);
    const rv=m.page.locator("#careerStatisticsRivalryButton");
    if(await rv.isVisible().catch(()=>false)){await rv.click({timeout:8000});m.rivalryVia="Career Statistics > CURRENT RIVALRY STATISTICS";}
    else{
      m.rivalryVia="window.openRivalryStatistics() (no visible button)";
      if(!report.seededSteps.some(s=>s.startsWith("Rivalry Statistics")))report.seededSteps.push("Rivalry Statistics: opened by the app function openRivalryStatistics() when Career Statistics shows no CURRENT RIVALRY STATISTICS button");
      await m.page.evaluate(()=>{try{window.openRivalryStatistics();}catch(e){}});
    }
  }
  await m.page.locator(`#${hostId}`).waitFor({state:"visible",timeout:15000}).catch(()=>{});
}
async function capturePage(m,hostId,label){
  const out={};
  await openPage(m,hostId);
  out.default=await stableHostText(m,hostId);
  for(const tab of TABS[hostId]||[]){if(await clickTab(m,hostId,tab))out[tab]=await stableHostText(m,hostId,1200,12000);}
  if(hostId==="trophyRoom"){
    out.dom=await m.page.evaluate(()=>{const h=document.getElementById("trophyRoom");if(!h)return "";const copy=h.cloneNode(true);copy.querySelectorAll("[data-sp-chip]").forEach(chip=>chip.remove());return (copy.textContent||"").replace(/\s+/g," ").trim();});
    out.cards=await m.page.evaluate(()=>[...document.querySelectorAll("#trophyRoom .trophyCard")].map(card=>({trophy:card.dataset.trophy||"",sides:Object.fromEntries([...card.querySelectorAll("[data-side]")].map(side=>[side.dataset.side,(side.querySelector("strong")?.dataset.countValue)||(side.querySelector("strong")?.textContent||"").trim()]))})));
    const more=m.page.locator("#trophyRoom label.trophyPhoneMoreButton");
    if(await more.isVisible().catch(()=>false)){await more.click({timeout:5000}).catch(()=>{});await m.page.waitForTimeout(1200);out.MORE=await hostText(m,"trophyRoom");await shot(m,`${label}-trophyRoom-more`);await more.click({timeout:5000}).catch(()=>{});}
  }
  if(hostId==="legacy"){
    out.cards=await m.page.evaluate(()=>[...document.querySelectorAll("#legacy .legacyCard")].map(c=>({status:c.dataset.status||"",number:c.dataset.showdown||"",text:(c.textContent||"").replace(/\s+/g," ").trim()})));
    const hist=m.page.locator("#legacy button").filter({hasText:/VIEW SEASON HISTORY/i}).first();
    if(await hist.count()&&await hist.isVisible().catch(()=>false)){await hist.click({timeout:10000}).catch(()=>{});await m.page.waitForTimeout(2500);out.seasonHistory=norm(await m.page.evaluate(()=>[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.innerText).join(" | ")));await shot(m,`${label}-legacy-season-history`);}
  }
  if(hostId==="statistics")out.via=m.rivalryVia;
  await shot(m,`${label}-${hostId}`);
  return out;
}
async function captureSettings(m,label){
  await backToShowdownHome(m);
  await openSettings(m);
  await m.page.waitForTimeout(800);
  // HISTORY counts the shared career, read once per Settings open: wait for the read to land.
  await m.page.waitForFunction(()=>![...document.querySelectorAll("#settingsOverlay .settingsInfoRow strong")].some(v=>/Loading/.test(v.textContent||"")),null,{timeout:15000}).catch(()=>{});
  const s=await m.page.evaluate(()=>{
    const rows={};for(const r of document.querySelectorAll("#settingsOverlay .settingsInfoRow")){const k=(r.querySelector("span")?.textContent||"").trim();const v=(r.querySelector("strong")?.textContent||"").trim();if(k)rows[k]=v;}
    const buttons=[...document.querySelectorAll("#settingsOverlay button")].filter(b=>b.offsetParent!==null).map(b=>(b.textContent||"").replace(/\s+/g," ").trim());
    return {rows,buttons};
  });
  await shot(m,`${label}-settings`);
  await closeSettings(m);
  return s;
}
// Every career page, Standings first (before any other career page could load the career for it), then Standings again.
async function captureCareer(m,label){
  const raw={};
  raw.standingsFirst=await capturePage(m,"standings",`${label}-first`);
  for(const host of ["careerStatistics","trophyRoom","legacy","statistics","standings"])raw[host]=await capturePage(m,host,label);
  raw.settings=await captureSettings(m,label);
  await backToShowdownHome(m);
  dumpScreen(m,`career-${label}`,JSON.stringify(raw,null,1));
  return raw;
}

// Reads every figure off the captured screen texts. Phone and desktop lay the same screens out differently, so all of a
// screen's tabs are joined and read together.
const corpus=(raw,host)=>Object.entries(raw?.[host]||{}).filter(([k,v])=>typeof v==="string"&&k!=="via").map(([,v])=>v).join(" ");
function extract(raw){
  const cs=corpus(raw,"careerStatistics"),stCareer=raw?.standings?.CAREER||"",stFirst=raw?.standingsFirst?.CAREER||"",tr=`${corpus(raw,"trophyRoom")} ${raw?.trophyRoom?.dom||""}`;
  const pair=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1],r[2]]:null;};
  const lead=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1].trim(),r[2]]:null;};
  const o={};
  o.summary=(/COMPLETED SHOWDOWNS\s+(\d+).*?SEASONS PLAYED D (\d+) \/ N (\d+) CAREER POINTS D (\d+) \/ N (\d+) TROPHIES WON D (\d+) \/ N (\d+)/i.exec(cs)||[]).slice(1);
  o.noRecord=/No completed record yet/i.test(cs);
  for(const u of ["daniel","nik"]){const row=new RegExp(`${NAMES[u]}\\s+(\\d+)\\s+(\\d+)-(\\d+)-(\\d+)\\s+(\\d+)\\s+(\\d+)`).exec(cs.slice(Math.max(0,cs.indexOf("CAREER TABLE"))));o[`table_${u}`]=row?row.slice(1):null;}
  o.compareTitles=pair(cs,/(\d+)\s+LEAGUE TITLES\s+(\d+)/);o.compareCups=pair(cs,/(\d+)\s+DOMESTIC CUPS\s+(\d+)/);o.compareCl=pair(cs,/(\d+)\s+CHAMPIONS LEAGUE WINS\s+(\d+)/);o.compareWins=pair(cs,/(\d+)\s+SEASON WINS\s+(\d+)/);
  o.compareAvgPoints=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE POINTS\s+([\d.]+)/);o.compareAvgGoals=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE GOALS\s+([\d.]+)/);
  o.leadWins=lead(cs,/MOST SEASON WINS\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+wins?/);o.leadTrophies=lead(cs,/MOST TROPHIES\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+troph/);
  o.leadPoints=lead(cs,/MOST CAREER POINTS\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);o.leadBest=lead(cs,/BEST SEASON SCORE\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);
  const standings=text=>{const s={};s.points=pair(text,/CAREER POINTS\s+(\d+)\s*:\s*(\d+)/);for(const [word,key] of [["Season Wins","W"],["Season Draws","D"],["Season Losses","L"],["Champions Leagues","cl"],["League Titles","league"],["Domestic Cups","cup"],["Total Trophies","trophies"]])s[key]=pair(text,new RegExp(`(\\d+)\\s+${word}\\s+(\\d+)`));s.leader=(/\b(DANIEL|NIK) LEADS\b/i.exec(text)||[])[1]?.toUpperCase()||null;s.unavailable=/unavailable|could not/i.test(text);return s;};
  o.standings=standings(stCareer);o.standingsFirst=standings(stFirst);
  o.standingsCareerText=stCareer;o.standingsFirstCareerText=stFirst;
  const live=raw?.standings?.["THIS SHOWDOWN"]||"";o.thisShowdownText=live;
  o.thisShowdown={season:pair(live,/SEASON (\d+) OF (\d+)/),points:pair(live,/SHOWDOWN POINTS\s+(\d+)\s*:\s*(\d+)/)};
  for(const [word,key] of [["SEASON WINS","W"],["SEASON DRAWS","D"],["SEASON LOSSES","L"],["CHAMPIONS LEAGUES","cl"],["LEAGUE TITLES","league"],["DOMESTIC CUPS","cup"],["TOTAL TROPHIES","trophies"]])o.thisShowdown[key]=pair(live,new RegExp(`(\\d+)\\s+${word}\\s+(\\d+)`));
  const rv=corpus(raw,"statistics");
  o.rivalryFigures={completed:pair(rv,/(\d+) \/ (\d+) SEASONS COMPLETED/),points:pair(rv,/(\d+)\s+\S\s+SHOWDOWN POINTS\s+(\d+)/),W:pair(rv,/(\d+)\s+\S\s+Season Wins\s+(\d+)/),trophies:pair(rv,/(\d+)\s+\S\s+Total Trophies\s+(\d+)/),cl:pair(rv,/(\d+)\s+\S\s+Champions Leagues\s+(\d+)/),league:pair(rv,/(\d+)\s+\S\s+League Titles\s+(\d+)/),cup:pair(rv,/(\d+)\s+\S\s+Domestic Cups\s+(\d+)/),unavailable:/Rivalry statistics (are )?unavailable|history is unavailable/i.test(rv)};
  o.rankDaniel=(/#(\d)\s*DANIEL\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);o.rankNik=(/#(\d)\s*NIK\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);
  const rec=re=>{const r=new RegExp(re.source,"i").exec(tr);return r?[r[1],r[2].toUpperCase()]:null;};
  o.recSeason=rec(/HIGHEST SEASON SCORE\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPoints=rec(/HIGHEST LEAGUE POINTS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recGoals=rec(/HIGHEST LEAGUE GOALS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPerfect=rec(/MOST PERFECT SEASONS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recBiggest=rec(/BIGGEST SHOWDOWN WIN\s+(\d+)\s+(DANIEL|NIK|SHARED)/);
  const cards=Object.fromEntries((raw?.trophyRoom?.cards||[]).map(c=>[c.trophy,[c.sides.daniel??null,c.sides.nik??null]]));
  o.cabChampion=cards.showdown||null;o.cabLeague=cards.leagueTitles||null;o.cabCup=cards.domesticCups||null;o.cabCl=cards.championsLeague||null;
  o.legacyCards=(raw?.legacy?.cards||[]).map(c=>({status:c.status,text:c.text}));
  o.legacyEmpty=/No completed showdowns yet/i.test(raw?.legacy?.default||"");
  o.seasonHistory=raw?.legacy?.seasonHistory||"";
  o.rivalry=raw?.statistics?.default||"";
  o.settings=raw?.settings||null;
  return o;
}
const holderName=h=>h==="shared"?"SHARED":NAMES[h].toUpperCase();
const leaderName=(d,n)=>d>n?"Daniel":n>d?"Nik":"Daniel + Nik";
const near=(shown,want)=>Number.isFinite(Number(shown))&&Math.abs(Number(shown)-want)<=0.051;
const cell=n=>n>0?String(n):"—";
// live: the Showdown being played right now (its committed seasons), or null. lastCompleted: the newest completed Showdown.
async function checkCareerPages(m,raw,label,career,{live=null,settingsLive=false}={}){
  const E=careerExpect(career),x=E.x,f=extract(raw),S=String,two=(d,n)=>[S(d),S(n)];
  const id=k=>`${label}.${k}`;
  const scr=(name)=>({screen:name});
  // Career Statistics
  if(E.completedCount===0){
    await check(m,id("stats.empty"),"Career Statistics says there is no completed record yet",f.noRecord||/COMPLETED SHOWDOWNS\s*0(?!\d)/i.test(corpus(raw,"careerStatistics")),corpus(raw,"careerStatistics").slice(0,400),scr("Career Statistics"));
  }else{
    await eq(m,id("stats.summary"),"Career Statistics tiles: completed Showdowns, seasons, career points, trophies (D / N)",f.summary,[S(E.completedCount),S(x.daniel.seasons),S(x.nik.seasons),S(x.daniel.total),S(x.nik.total),S(x.daniel.trophies),S(x.nik.trophies)],scr("Career Statistics (summary)"));
    for(const u of ["daniel","nik"])await eq(m,id(`stats.table.${u}`),`Career Statistics table row ${NAMES[u]}: Showdowns, season W-D-L, points, trophies`,f[`table_${u}`],[S(E.completedCount),S(x[u].W),S(x[u].D),S(x[u].L),S(x[u].total),S(x[u].trophies)],scr("Career Statistics (table)"));
    await eq(m,id("stats.compare"),"Career Statistics comparison: league titles, cups, Champions League, season wins (D / N)",[f.compareTitles,f.compareCups,f.compareCl,f.compareWins],[two(x.daniel.league,x.nik.league),two(x.daniel.cup,x.nik.cup),two(x.daniel.cl,x.nik.cl),two(x.daniel.W,x.nik.W)],scr("Career Statistics (comparison)"));
    await check(m,id("stats.averages"),"Career Statistics comparison: average league points and goals",f.compareAvgPoints&&near(f.compareAvgPoints[0],x.daniel.avgPoints)&&near(f.compareAvgPoints[1],x.nik.avgPoints)&&f.compareAvgGoals&&near(f.compareAvgGoals[0],x.daniel.avgGoals)&&near(f.compareAvgGoals[1],x.nik.avgGoals),`expected ${x.daniel.avgPoints.toFixed(1)}/${x.nik.avgPoints.toFixed(1)} pts, ${x.daniel.avgGoals.toFixed(1)}/${x.nik.avgGoals.toFixed(1)} goals; shown ${JSON.stringify([f.compareAvgPoints,f.compareAvgGoals])}`,scr("Career Statistics (comparison)"));
    await eq(m,id("stats.leaders"),"Career Statistics leaders: most season wins, trophies, career points, best season score",[f.leadWins,f.leadTrophies,f.leadPoints,f.leadBest],
      [[leaderName(x.daniel.W,x.nik.W),S(Math.max(x.daniel.W,x.nik.W))],[leaderName(x.daniel.trophies,x.nik.trophies),S(Math.max(x.daniel.trophies,x.nik.trophies))],[leaderName(x.daniel.total,x.nik.total),S(Math.max(x.daniel.total,x.nik.total))],[leaderName(x.daniel.bestScore,x.nik.bestScore),S(Math.max(x.daniel.bestScore,x.nik.bestScore))]],scr("Career Statistics (leaders)"));
  }
  // Standings (Career): opened first and opened again after the other pages
  const wantStandings={points:two(x.daniel.total,x.nik.total),W:two(x.daniel.W,x.nik.W),D:two(x.daniel.D,x.nik.D),L:two(x.daniel.L,x.nik.L),cl:two(x.daniel.cl,x.nik.cl),league:two(x.daniel.league,x.nik.league),cup:two(x.daniel.cup,x.nik.cup),trophies:two(x.daniel.trophies,x.nik.trophies)};
  // By design (js/sharedActiveShowdownAdapter.js career(): COUNTED includes "active") the shared career model also counts a
  // live Showdown's played seasons, but only while that Showdown's shared history projection is in memory (just after a
  // commit); from the multi-season progression fallback it stays out. Mid-Showdown, Standings (Career) may therefore show
  // the completed career or the completed career plus the live seasons so far; either is accepted and the second is noted.
  const liveEntry=career.find(s=>s.state==="live"&&s.seasons.length);
  const xl=liveEntry?tally([...career.filter(s=>s.state==="completed").flatMap(s=>s.seasons),...liveEntry.seasons]):null;
  const wantWithLive=xl?{points:two(xl.daniel.total,xl.nik.total),W:two(xl.daniel.W,xl.nik.W),D:two(xl.daniel.D,xl.nik.D),L:two(xl.daniel.L,xl.nik.L),cl:two(xl.daniel.cl,xl.nik.cl),league:two(xl.daniel.league,xl.nik.league),cup:two(xl.daniel.cup,xl.nik.cup),trophies:two(xl.daniel.trophies,xl.nik.trophies)}:null;
  for(const [key,which] of [["standingsFirst","opened first"],["standings","opened after the other pages"]]){
    const s=f[key];
    const text=key==="standings"?f.standingsCareerText:f.standingsFirstCareerText;
    await check(m,id(`${key}.available`),`Standings (Career, ${which}) loads (not "unavailable")`,Boolean(text)&&!/unavailable|could not/i.test(text.replace(/^.*?CAREER STANDINGS/,"")),text.slice(0,300),scr("Standings (Career)"));
    const got={points:s.points,W:s.W,D:s.D,L:s.L,cl:s.cl,league:s.league,cup:s.cup,trophies:s.trophies};
    const withLive=Boolean(wantWithLive)&&JSON.stringify(got)===JSON.stringify(wantWithLive);
    if(withLive){const note=`${label} ${m.user}: Standings (Career, ${which}) counted the live Showdown's ${liveEntry.seasons.length} played season(s) (shared history in memory)`;report.notes=(report.notes||[]).concat(note);console.log(`NOTE ${note}`);}
    if(E.completedCount===0){await check(m,id(`${key}.career`),`Standings (Career, ${which}) shows no completed-career figures before the first completed Showdown (or only the live seasons so far)`,withLive||(!s.points||s.points.join()==="0,0")&&/after your first finished Showdown|0\s*:\s*0/i.test(text),text.slice(0,300),scr("Standings (Career)"));continue;}
    await check(m,id(`${key}.career`),`Standings (Career, ${which}): career points, season W/D/L, Champions Leagues, league titles, cups, trophies (D / N)`,withLive||JSON.stringify(got)===JSON.stringify(wantStandings),`expected ${JSON.stringify(wantStandings)}${wantWithLive?` (or with the live seasons ${JSON.stringify(wantWithLive)})`:""} but the screen shows ${JSON.stringify(got)}`,scr("Standings (Career)"));
  }
  // Trophy Room
  const winners=career.filter(s=>s.state==="completed").map(s=>overallWinner(tally(s.seasons)));
  const champs={daniel:winners.filter(w=>w==="daniel").length,nik:winners.filter(w=>w==="nik").length};
  await eq(m,id("trophy.cabinet"),"Trophy Room cabinet: Showdown Champion, league titles, cups, Champions League (D / N)",[f.cabChampion,f.cabLeague,f.cabCup,f.cabCl],[[cell(champs.daniel),cell(champs.nik)],[cell(x.daniel.league),cell(x.nik.league)],[cell(x.daniel.cup),cell(x.nik.cup)],[cell(x.daniel.cl),cell(x.nik.cl)]],scr("Trophy Room (cabinet)"));
  if(E.completedCount>0){
    const ahead=u=>{const o=u==="daniel"?"nik":"daniel";return x[u].total!==x[o].total?x[u].total>x[o].total:x[u].W!==x[o].W?x[u].W>x[o].W:null;};
    for(const u of ["daniel","nik"]){
      const got=f[u==="daniel"?"rankDaniel":"rankNik"],a=ahead(u),want=[a===null?"1":a?"1":"2",S(x[u].total),S(x[u].W)];
      await eq(m,id(`trophy.rank.${u}`),`Trophy Room ranking: ${NAMES[u]} rank, career points, season wins`,got,want,scr("Trophy Room (ranking)"));
    }
    const r=E.records,recWant=v=>v?[S(v.value),holderName(v.holder)]:null;
    await eq(m,id("trophy.records"),"Trophy Room all-time records: highest season score, league points, league goals, most perfect seasons, biggest Showdown win (value, holder)",[f.recSeason,f.recPoints,f.recGoals,f.recPerfect,f.recBiggest],[recWant(r.season),recWant(r.points),recWant(r.goals),recWant(r.perfect),recWant(r.biggestWin)],scr("Trophy Room (records)"));
  }
  // Legacy (History): completed cards and ended-early rows, in career order, nothing else
  const wantCards=E.rows.map(s=>{
    if(s.state==="ended")return {status:"abandoned",re:`^Showdown #${s.number}\\s*Ended early · ${s.endedDate} · ${s.seasons.length} season${s.seasons.length===1?"":"s"}$`};
    const t=tally(s.seasons),w=overallWinner(t);
    return {status:"completed",number:s.number,must:[`Showdown #${s.number}`,`${t.daniel.total} – ${t.nik.total}`,`${s.seasons.length} / ${s.totalSeasons}`,w==="draw"?"DRAW":`${NAMES[w]} WINS`,s.clubs[0],s.clubs[1]]};
  });
  const cardsOk=f.legacyCards.length===wantCards.length&&wantCards.every((w,i)=>{const c=f.legacyCards[i];if(!c||c.status!==w.status)return false;return w.re?new RegExp(w.re).test(c.text):w.must.every(p=>new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i").test(c.text));});
  await check(m,id("legacy.cards"),`Legacy lists exactly ${wantCards.length} row(s): ${wantCards.map(w=>w.status==="abandoned"?"ended early":`#${w.number} ${w.must[1]} ${w.must[3]}`).join(", ")||"none"}`,wantCards.length===0?(f.legacyCards.filter(c=>c.status==="completed"||c.status==="abandoned").length===0):cardsOk,`expected ${JSON.stringify(wantCards)}; shown ${JSON.stringify(f.legacyCards)}`,scr("Legacy"));
  const firstCompleted=E.rows.find(s=>s.state==="completed");
  if(firstCompleted&&f.seasonHistory){
    const want=firstCompleted.seasons.map((p,i)=>`Season ${i+1} Daniel: ${scoreSeason(p.daniel).total} #${p.daniel.leaguePosition} · ${p.daniel.leaguePoints} league pts · ${p.daniel.leagueGoals} goals – Nik: ${scoreSeason(p.nik).total} #${p.nik.leaguePosition} · ${p.nik.leaguePoints} league pts · ${p.nik.leagueGoals} goals`);
    const missing=want.filter(w=>!f.seasonHistory.includes(w));
    await check(m,id("legacy.seasonHistory"),`Legacy VIEW SEASON HISTORY (Showdown #${firstCompleted.number}) lists every season with its score, league finish, points and goals`,missing.length===0,`missing ${JSON.stringify(missing)} in: ${f.seasonHistory.slice(0,1500)}`,scr("Legacy (season history)"));
  }else if(firstCompleted)await check(m,id("legacy.seasonHistory"),"Legacy VIEW SEASON HISTORY opens",false,"no VIEW SEASON HISTORY button or no text",scr("Legacy (season history)"));
  // Standings (This Showdown) while a Showdown is live: its committed seasons only.
  if(live){
    const t=tally(live.seasons),g=f.thisShowdown;
    await eq(m,id("standings.thisShowdown"),"Standings (This Showdown): season counter, Showdown points, season W/D/L, Champions Leagues, league titles, cups, trophies (D / N)",
      {season:g.season,points:g.points,W:g.W,D:g.D,L:g.L,cl:g.cl,league:g.league,cup:g.cup,trophies:g.trophies},
      {season:two(live.seasons.length+1,live.totalSeasons),points:two(t.daniel.total,t.nik.total),W:two(t.daniel.W,t.nik.W),D:two(t.daniel.D,t.nik.D),L:two(t.daniel.L,t.nik.L),cl:two(t.daniel.cl,t.nik.cl),league:two(t.daniel.league,t.nik.league),cup:two(t.daniel.cup,t.nik.cup),trophies:two(t.daniel.trophies,t.nik.trophies)},scr("Standings (This Showdown)"));
  }
  // With no live Showdown, THIS SHOWDOWN is empty on every browser (the one that played the last Showdown too).
  else await check(m,id("standings.thisShowdown"),"Standings (This Showdown) says there is no active Showdown",/No active showdown|No Showdown in progress/i.test(f.thisShowdownText||""),(f.thisShowdownText||"").slice(0,300),scr("Standings (This Showdown)"));
  // Rivalry Statistics: the live Showdown while one is played, else the newest completed one (never an ended-early one).
  const rivalrySource=live||[...career].reverse().find(s=>s.state==="completed")||null;
  if(rivalrySource&&rivalrySource.seasons.length){
    const t=tally(rivalrySource.seasons),g=f.rivalryFigures;
    await eq(m,id("rivalry"),`Rivalry Statistics shows ${live?"the live":"the newest completed"} Showdown ${rivalrySource.name}: seasons completed, Showdown points, season wins, trophies, Champions Leagues, league titles, cups (D / N)`,
      {completed:g.completed,points:g.points,W:g.W,trophies:g.trophies,cl:g.cl,league:g.league,cup:g.cup},
      {completed:two(rivalrySource.seasons.length,rivalrySource.totalSeasons),points:two(t.daniel.total,t.nik.total),W:two(t.daniel.W,t.nik.W),trophies:two(t.daniel.trophies,t.nik.trophies),cl:two(t.daniel.cl,t.nik.cl),league:two(t.daniel.league,t.nik.league),cup:two(t.daniel.cup,t.nik.cup)},scr("Rivalry Statistics"));
  }
  // Settings
  const st=f.settings,ended=st&&st.buttons.includes("END SHOWDOWN");
  await check(m,id("settings.end"),settingsLive?"Settings offers END SHOWDOWN while the Showdown is live":"Settings shows no END SHOWDOWN when no Showdown is live",settingsLive?ended:!ended,JSON.stringify(st),scr("Settings"));
  await check(m,id("settings.mode"),"Settings: CAREER saved online and PARTNER Paired with the other manager",st&&/^Saved online/.test(st.rows.CAREER||"")&&st.rows.PARTNER===`Paired with ${m.account==="daniel"?"Nik":"Daniel"}`&&!st.buttons.includes("START TEST RUN"),JSON.stringify(st),scr("Settings"));
  await check(m,id("settings.current"),settingsLive?"Settings: CURRENT SHOWDOWN names the live Showdown":"Settings: CURRENT SHOWDOWN is None",st&&(settingsLive?st.rows["CURRENT SHOWDOWN"]&&st.rows["CURRENT SHOWDOWN"]!=="None":st.rows["CURRENT SHOWDOWN"]==="None"),JSON.stringify(st?.rows),scr("Settings"));
  await check(m,id("settings.history"),`Settings: HISTORY counts ${E.completedCount} completed Showdown${E.completedCount===1?"":"s"}`,st&&st.rows.HISTORY===`${E.completedCount} completed showdown${E.completedCount===1?"":"s"}`,JSON.stringify(st?.rows),scr("Settings"));
  return f;
}
// The same figures on every browser (both managers, after the storage wipe, in a brand-new browser).
async function checkIdentical(raws,label,{liveCareer=false}={}){
  // While a Showdown is live, Standings (Career) may or may not count its played seasons depending on what was in memory
  // when it loaded (see checkCareerPages); each browser's figures are checked against the oracle there instead.
  const names=Object.keys(raws),facts=Object.fromEntries(names.map(n=>{const f=extract(raws[n]);delete f.settings;delete f.rivalry;delete f.seasonHistory;if(liveCareer){delete f.standingsFirst;delete f.standings;delete f.standingsCareerText;delete f.standingsFirstCareerText;}return [n,f];}));
  for(const other of names.slice(1)){
    const a=facts[names[0]],b=facts[other];
    const diffs=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])&&!(/^(rank|rec)/.test(k)&&(!a[k]?.length||!b[k]?.length))).map(k=>`${k}: ${JSON.stringify(a[k]).slice(0,300)} vs ${JSON.stringify(b[k]).slice(0,300)}`);
    await check(null,`${label}.identical.${names[0]}-${other}`,`every career figure reads the same on ${names[0]} and ${other}`,diffs.length===0,diffs.join("; "),{screen:"Career pages (all browsers)"});
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// The Showdown Champion screen of a finished Showdown
// ---------------------------------------------------------------------------------------------------------------------------
async function settledText(m,ids,ms=6000){
  const deadline=Date.now()+ms;let last=null,stable=0;
  while(Date.now()<deadline){
    const v=await m.page.evaluate(list=>list.map(id=>{const el=document.getElementById(id);return el?(el.dataset?.countValue||(el.textContent||"")).replace(/\s+/g," ").trim():"";}),ids);
    const key=JSON.stringify(v);if(key===last){stable+=1;if(stable>=3)return v;}else{stable=0;last=key;}
    await m.page.waitForTimeout(300);
  }
  return JSON.parse(last||"[]");
}
async function checkFinalWinnerScreen(m,seasons){
  const N=seasons.length,t=tally(seasons),win=overallWinner(t),last=seasons[N-1],lw=seasonWinner(last.daniel,last.nik),winName=win==="draw"?null:NAMES[win];
  await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
  const ids=["outcomeHeadline","danielTotal","nikTotal","panelLastSeasonLabel","panelLastSeasonDaniel","panelLastSeasonNik","panelLastSeasonResult","panelSeasons","panelMargin"];
  const v=await settledText(m,ids),got=Object.fromEntries(ids.map((id,i)=>[id,v[i]]));
  const id=k=>`${showdownNow}.final.${k}`;
  await check(m,id("winner"),`Showdown Champion screen names ${winName||"a draw"}`,win==="draw"?/DRAW/i.test(got.outcomeHeadline):new RegExp(`^${winName}\\s+WINS$`,"i").test(got.outcomeHeadline),`headline "${got.outcomeHeadline}"`,{screen:"Showdown Champion"});
  await eq(m,id("totals"),"Showdown Champion totals Daniel / Nik",[got.danielTotal,got.nikTotal],[String(t.daniel.total),String(t.nik.total)],{screen:"Showdown Champion"});
  await eq(m,id("lastSeason"),"Showdown Champion final-season cell",[got.panelLastSeasonLabel,got.panelLastSeasonDaniel,got.panelLastSeasonNik],[`FINAL SEASON ${N}`,String(scoreSeason(last.daniel).total),String(scoreSeason(last.nik).total)],{screen:"Showdown Champion"});
  await check(m,id("lastSeasonWinner"),"Showdown Champion names who took the final season",lw.side==="draw"?/DRAW|LEVEL|TIE/i.test(got.panelLastSeasonResult):new RegExp(lw.side,"i").test(got.panelLastSeasonResult),`final season ${lw.side}; cell "${got.panelLastSeasonResult}"`,{screen:"Showdown Champion"});
  await eq(m,id("seasonsMargin"),"Showdown Champion seasons played and margin",[got.panelSeasons,got.panelMargin],[String(N),String(Math.abs(t.daniel.total-t.nik.total))],{screen:"Showdown Champion"});
  const tab=m.page.locator("label[for='finalWinnerTabHonours']");
  if(await tab.isVisible().catch(()=>false))await tab.click({timeout:5000}).catch(()=>{});
  const hid=["panelDanielContinental","panelNikContinental","panelDanielLeague","panelNikLeague","panelDanielCup","panelNikCup","panelDanielTrophies","panelNikTrophies"];
  const hv=await settledText(m,hid);
  await eq(m,id("honours"),"Showdown Champion honours (Champions League, league titles, cups, trophies) Daniel then Nik",hv,[t.daniel.cl,t.nik.cl,t.daniel.league,t.nik.league,t.daniel.cup,t.nik.cup,t.daniel.trophies,t.nik.trophies].map(String),{screen:"Showdown Champion (honours)"});
  const summaryTab=m.page.locator("label[for='finalWinnerTabSummary']");
  if(await summaryTab.isVisible().catch(()=>false))await summaryTab.click({timeout:5000}).catch(()=>{});
  await shot(m,`${showdownNow}-final-winner`);
}

// ---------------------------------------------------------------------------------------------------------------------------
// One Showdown
// ---------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------
// Billed-reads budget: partner-wait points and per-season pricing
// ---------------------------------------------------------------------------------------------------------------------------
async function budgetWait(point){
  if(!BUDGET_MODE)return;
  const def=WAIT_POINTS[point];if(!def)throw new Error(`unknown wait point ${point}`);
  const target=pointMinutes(point,WAIT_PROFILES[REALTIME_PROFILE||"slow"]);
  const sample=def.share===0?SAMPLE_LONG_MIN:REALTIME_WAITS?target:Math.min(target,def.cat==="short"?SAMPLE_SHORT_MIN:SAMPLE_LONG_MIN);
  const {daniel}=ctxRef;
  // The game's own read brake (CareerModeFirestoreBudget, r84 #994) engages after 150+ reads in 5 minutes without a tap, so a long wait can
  // cost less per minute than its first minutes: record whether it tripped during the wait.
  const stat=async m=>m.page.evaluate(()=>{try{const b=window.CareerModeFirestoreBudget?.stats?.();return b?{trips:b.brakeTrips||0,since:b.brakeSince||0,serverReads:b.serverReads||0}:null;}catch(_e){return null;}}).catch(()=>null);
  const before={daniel:await stat(ctxRef.daniel),nik:await stat(ctxRef.nik)};
  const from=Date.now();
  await daniel.page.waitForTimeout(Math.round(sample*60000));
  const to=Date.now();
  const after={daniel:await stat(ctxRef.daniel),nik:await stat(ctxRef.nik)};
  const brake=Object.fromEntries(["daniel","nik"].map(u=>[u,{trips:(after[u]?.trips||0)-(before[u]?.trips||0),onAtEnd:Boolean(after[u]?.since)}]));
  meter.mark(`wait:${point}:${showdownNow}.S${seasonNow}:start@${from}`);meter.mark(`wait:${point}:${showdownNow}.S${seasonNow}:end@${to}`);
  budgetWaits.push({brake,showdown:showdownNow,season:seasonNow,point,cat:def.cat,share:def.share,targetMin:target,sampleMin:(to-from)/60000,from,to});
  await unlockProbe(point);
}
// CE2PG_UNLOCKS=N (budget mode): after a wait point's sample, each phone in turn locks and unlocks N times (the page goes hidden for
// 15 s, then visible; CE2PG_UNLOCK_EVENT=online also fires the browser's online event, like a wifi/mobile-data switch) and the billed
// reads of the 45 s after each unlock are priced against an idle 45 s just before, per document. Red team #18 (2026-10-29).
const UNLOCKS=Number(process.env.CE2PG_UNLOCKS||0),UNLOCK_POINTS=(process.env.CE2PG_UNLOCK_POINTS||"results-published,transfer-window").split(",");
const unlockRuns=[];
async function setHidden(m,hidden,extra){
  await m.page.evaluate(([h,ev])=>{
    if(!window.__ce2pgVis){window.__ce2pgVis="visible";Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>window.__ce2pgVis});Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.__ce2pgVis==="hidden"});}
    window.__ce2pgVis=h?"hidden":"visible";document.dispatchEvent(new Event("visibilitychange"));
    if(!h&&ev==="online")window.dispatchEvent(new Event("online"));
  },[hidden,extra||""]);
}
async function unlockProbe(point){
  if(!BUDGET_MODE||!UNLOCKS||!UNLOCK_POINTS.includes(point))return;
  const evName=process.env.CE2PG_UNLOCK_EVENT||"";
  for(const user of ["daniel","nik"]){
    const m=ctxRef[user];
    const winPrice=(a,b)=>{const evs=meter.events.filter(e=>e.t>=a&&e.t<b&&(e.k==="read"||e.k==="write"||e.k==="listener"));const p=billedMeter.price(billedModel,evs);const mine=billedMeter.price(billedModel,sumBy(evs,user));return {billed:p.billed,mine:mine.billed,byPath:billedMeter.top(mine.byPath,12),byModule:billedMeter.top(mine.byModule,12)};};
    const i0=Date.now();await m.page.waitForTimeout(45000);const idle=winPrice(i0,Date.now());
    const cycles=[];
    for(let i=0;i<UNLOCKS;i+=1){
      await setHidden(m,true);await m.page.waitForTimeout(15000);
      const at=Date.now();await setHidden(m,false,evName);await m.page.waitForTimeout(45000);
      cycles.push(winPrice(at,Date.now()));
    }
    if(process.env.CE2PG_RELOAD_PROBE==="1"){
      const at=Date.now();await m.page.reload({waitUntil:"domcontentloaded"});await m.page.waitForTimeout(60000);
      const r=winPrice(at,Date.now());unlockRuns.push({point,user,season:seasonNow,event:"reload",reload:r});
      console.log(`RELOAD ${point} ${user}: 60s after reload billed both=${r.billed} mine=${r.mine}`);
      for(const x of r.byPath)console.log(`   ${x.key}  docs=${x.docs} rules=${x.rules}`);
      for(const x of r.byModule)console.log(`   MOD ${x.key}  docs=${x.docs} rules=${x.rules}`);
    }
    const row={point,user,season:seasonNow,event:evName||"visibility",idle,cycles,extraPerUnlockBoth:Math.round(cycles.reduce((a,c)=>a+c.billed,0)/cycles.length-idle.billed),extraPerUnlockMine:Math.round(cycles.reduce((a,c)=>a+c.mine,0)/cycles.length-idle.mine)};
    unlockRuns.push(row);report.unlocks=unlockRuns;
    console.log(`UNLOCK ${point} ${user}: idle45=${idle.billed} (mine ${idle.mine}) unlock45=${cycles.map(c=>`${c.billed}/${c.mine}`).join(",")} extra/unlock both=${row.extraPerUnlockBoth} mine=${row.extraPerUnlockMine}`);
    for(const r of cycles[0].byPath)console.log(`   ${r.key}  docs=${r.docs} rules=${r.rules}`);
    for(const r of cycles[0].byModule)console.log(`   MOD ${r.key}  docs=${r.docs} rules=${r.rules}`);
  }
}
let ctxRef=null;const publishedRates=[];const playWindows=[];
const sumBy=(evs,user)=>evs.filter(e=>!user||e.user===user);
function priceWindow(from,to){
  const evs=meter.events.filter(e=>e.t>=from&&e.t<to&&(e.k==="read"||e.k==="write"||e.k==="listener"));
  const all=billedMeter.price(billedModel,evs);
  const byUser={};for(const user of ["daniel","nik"]){const p=billedMeter.price(billedModel,sumBy(evs,user));byUser[user]={docReads:p.docReads,rulesReads:p.rulesReads+p.rulesOnWrites,billed:p.billed,writes:p.writes};}
  return {...all,byUser,ms:to-from};
}
// A season's billed reads: what was measured between the marks (the waits inside it only ran for their sample) plus, for each wait,
// the steady per-minute billed rate of that wait's sample (its last part, after a warm-up) times the minutes the profile still owes.
function seasonBilled(fromT,toT){
  const measured=priceWindow(fromT,toT);
  const waits=budgetWaits.filter(w=>w.from>=fromT&&w.to<=toT);
  const rows=waits.map(w=>{
    const warm=Math.min(30000,(w.to-w.from)/2);
    const tail=priceWindow(w.from+warm,w.to),tailMin=(tail.ms)/60000||1e-9;
    const whole=priceWindow(w.from,w.to);
    // Real-time runs only: what extrapolating just the first SAMPLE minutes of this wait would have predicted for the whole wait.
    const cap=w.cat==="short"?SAMPLE_SHORT_MIN:SAMPLE_LONG_MIN,early=priceWindow(w.from+warm,Math.min(w.to,w.from+cap*60000)),earlyMin=early.ms/60000||1e-9;
    const perMinute=[];for(let a=w.from;a<w.to-1000;a+=60000)perMinute.push(priceWindow(a,Math.min(w.to,a+60000)).billed);
    const per=u=>({docsPerMin:Math.round(tail.byUser[u].docReads/tailMin*10)/10,billedPerMin:Math.round((tail.byUser[u].billed-0)/tailMin*10)/10});
    return {brake:w.brake,perMinute,earlyRatePerMin:early.billed/earlyMin,point:w.point,season:w.season,sampleMin:w.sampleMin,targetMin:w.targetMin,wholeBilled:whole.billed,tailBilled:tail.billed,tailMin,ratePerMin:tail.billed/tailMin,docRatePerMin:tail.docReads/tailMin,writeRatePerMin:tail.writes/tailMin,wholeWrites:whole.writes,
      perDevice:{daniel:per("daniel"),nik:per("nik")},topModules:billedMeter.top(tail.byModule,5).map(x=>({...x,perMin:Math.round(x.billed/tailMin*10)/10})),topPaths:billedMeter.top(tail.byPath,5).map(x=>({...x,perMin:Math.round(x.billed/tailMin*10)/10}))};
  });
  // The published-and-waiting state of the results screen is measured in the non-simultaneous seasons; every results-entry wait is
  // priced at the dearer of its own rate and the dearest published-waiting rate measured so far in this run.
  for(const r of rows)if(r.point==="results-published")publishedRates.push(r.ratePerMin);
  const publishedRate=publishedRates.length?Math.max(...publishedRates):0;
  for(const r of rows)r.pricedRatePerMin=r.point==="results-entry"?Math.max(r.ratePerMin,publishedRate):r.ratePerMin;
  const profiles={};
  const sampledMs=waits.reduce((a,w)=>a+(w.to-w.from),0);
  const harnessMinutes=Math.max(0,(measured.ms-sampledMs)/60000);// in-game play/setup time the harness really spends in this season
  for(const [name,prof] of Object.entries(WAIT_PROFILES)){
    let extraBilled=0,extraWrites=0,transferMin=0,resultsMin=0,shortMin=0;
    for(const [i,w] of waits.entries()){
      const def=WAIT_POINTS[w.point],r=rows[i],want=pointMinutes(w.point,prof);
      extraBilled+=r.pricedRatePerMin*(want-w.sampleMin);extraWrites+=r.writeRatePerMin*(want-w.sampleMin);
      if(def.cat==="transfer")transferMin+=want;else if(def.cat==="results")resultsMin+=want;else shortMin+=want;
    }
    const billed=Math.round(measured.billed+extraBilled);
    const seasonMinutes=transferMin+resultsMin+shortMin+harnessMinutes;
    profiles[name]={label:prof.label,transferMin:Math.round(transferMin*10)/10,resultsMin:Math.round(resultsMin*10)/10,shortMin:Math.round(shortMin*10)/10,harnessMin:Math.round(harnessMinutes*10)/10,seasonMinutes:Math.round(seasonMinutes*10)/10,
      billed,writes:Math.round(measured.writes+extraWrites),...paceBudget(seasonMinutes,billed)};
  }
  // Real-time validation of the extrapolation: measured total vs the total predicted from each wait's first sample minutes only.
  const realWait=rows.reduce((a,r)=>a+r.wholeBilled,0),predictedWait=rows.reduce((a,r)=>a+r.earlyRatePerMin*r.sampleMin,0);
  const check=REALTIME_WAITS&&waits.length?{realBilled:measured.billed,predictedBilled:Math.round(measured.billed-realWait+predictedWait),realWaitBilled:realWait,predictedWaitBilled:Math.round(predictedWait)}:null;
  return {measured,rows,profiles,check,sampledMinutes:Math.round(waits.reduce((a,w)=>a+w.sampleMin,0)*10)/10};
}
// Reads attributed to a screen: wait windows (steady state: after a 30 s warm-up) and the active parts around them (setup, the typing and
// tapping on the transfer and results screens, commit, continue). Columns: document path pattern, caller file:line (the budget wrapper
// sparkPrivatePairing.js:914/944/993 is skipped and shown as "via"), doc reads per device, billed reads (documents + Rules lookups).
function screenOf(t){
  const w=budgetWaits.find(x=>t>=x.from&&t<x.to);
  if(w)return {screen:w.point,state:"waiting",w};
  const ph=report.timings.phases.find(x=>x.t0!==undefined&&t>=x.t0&&t<x.t1&&/-(start|join|setup|S\d+-(transfers|results|commit|continue))$/.test(x.phase));
  if(ph){const m=/-(start|join|setup|transfers|results|commit|continue)$/.exec(ph.phase);return {screen:/^(start|join|setup)$/.test(m[1])?"setup":m[1],state:"active"};}
  return {screen:"other",state:"active"};
}
function buildAttribution(){
  const play=meter.events.filter(e=>(e.k==="read"||e.k==="write"||e.k==="listener")&&e.user&&/^(daniel|nik)$/.test(e.user)&&playWindows.some(([a,b])=>e.t>=a&&e.t<b));
  const rows={};// key -> {screen,state,path,caller,docs{daniel,nik},billed,writes,minutes}
  const warm=30000;
  const inScope=play.filter(e=>{const sc=screenOf(e.t);if(sc.state==="waiting")return e.t>=sc.w.from+Math.min(warm,(sc.w.to-sc.w.from)/2);return true;});
  const grouped=billedMeter.attribute(billedModel,inScope,meter.events,e=>{const sc=screenOf(e.t);return JSON.stringify([sc.screen,sc.state,billedMeter.shortPath(e.path).replace(/^(read|write) /,""),e.k==="write"?"write":"read",billedMeter.callerOf(e.st)]);});
  for(const [key,v] of grouped){const [screen,state,path,kind,caller]=JSON.parse(key);rows[key]={screen,state,path,kind,caller,docsD:v.byUser.daniel?.docs||0,docsN:v.byUser.nik?.docs||0,docs:v.docs,rules:v.rules,writes:v.writes,billed:v.docs+v.rules};}
  // Minutes covered per screen (waiting windows count after the warm-up; active parts by their phases).
  const minutes={};
  for(const w of budgetWaits){const d=Math.max(0,(w.to-w.from)-Math.min(warm,(w.to-w.from)/2))/60000;minutes[`${w.point}|waiting`]=(minutes[`${w.point}|waiting`]||0)+d;}
  for(const ph of report.timings.phases){const m=/-(start|join|setup|S\d+-(transfers|results|commit|continue))$/.exec(ph.phase);if(!m||ph.t0===undefined)continue;const k=/^(start|join|setup)$/.test(m[1])?"setup":m[1].replace(/^S\d+-/,"");const waited=budgetWaits.filter(w=>w.from>=ph.t0&&w.to<=ph.t1).reduce((a,w)=>a+(w.to-w.from),0);minutes[`${k}|active`]=(minutes[`${k}|active`]||0)+(ph.t1-ph.t0-waited)/60000;}
  return {rows:Object.values(rows),minutes,seasons:playWindows.length};
}
function formatAttribution(att){
  const out=[];
  const fmt=(n)=>(Math.round(n*10)/10).toString();
  const groups={};
  for(const r of att.rows)(groups[`${r.screen}|${r.state}`]||(groups[`${r.screen}|${r.state}`]=[])).push(r);
  const order=Object.keys(groups).sort();
  out.push("READS BY SCREEN, DOCUMENT PATH AND SOURCE (both devices, all measured seasons). docs/min D|N = document reads per minute per device (Daniel|Nik); billed/min = documents + Rules lookups, both devices.");
  out.push("Waiting rows are steady state over the sampled wait windows; active rows are the typing/tapping parts around the waits and are totals over the run (per minute of active time).");
  for(const key of order){
    const [screen,state]=key.split("|"),min=att.minutes[key]||0;
    const rows=groups[key].sort((a,b)=>b.billed-a.billed);
    const tot=rows.reduce((a,r)=>({docs:a.docs+r.docs,billed:a.billed+r.billed,writes:a.writes+r.writes}),{docs:0,billed:0,writes:0});
    out.push("");
    if(state==="waiting"){
      out.push(`## ${screen} [waiting]: ${fmt(min)} min sampled (after warm-up), ${tot.docs} doc reads, ${tot.billed} billed -> ${fmt(tot.docs/(min||1))} doc reads/min, ${fmt(tot.billed/(min||1))} billed/min (both devices)`);
      out.push("| path | source | kind | docs/min Daniel | docs/min Nik | billed/min |");
      out.push("|---|---|---|---|---|---|");
      for(const r of rows.slice(0,12))out.push(`| ${r.path} | ${r.caller} | ${r.kind} | ${fmt(r.docsD/(min||1))} | ${fmt(r.docsN/(min||1))} | ${fmt(r.billed/(min||1))} |`);
    }else{
      const n=Math.max(1,att.seasons);
      out.push(`## ${screen} [active, per season]: ${fmt(tot.docs/n)} doc reads, ${fmt(tot.billed/n)} billed, ${fmt(tot.writes/n)} writes per season (${att.seasons} season(s); ${fmt(min/n)} min of harness time per season, which is machine speed, not human)`);
      out.push("| path | source | kind | docs/season Daniel | docs/season Nik | billed/season |");
      out.push("|---|---|---|---|---|---|");
      for(const r of rows.slice(0,12))out.push(`| ${r.path} | ${r.caller} | ${r.kind} | ${fmt(r.docsD/n)} | ${fmt(r.docsN/n)} | ${fmt(r.billed/n)} |`);
    }
  }
  return out.join("\n");
}
function printBilled(label,b){
  const m=b.measured;
  if(b.check)console.log(`  EXTRAPOLATION CHECK ${label}: real-time waits cost ${b.check.realWaitBilled} billed; extrapolating only the first ${SAMPLE_LONG_MIN}/${SAMPLE_SHORT_MIN} min of each wait predicts ${b.check.predictedWaitBilled} (season ${b.check.realBilled} real vs ${b.check.predictedBilled} predicted, ${Math.round((b.check.predictedBilled-b.check.realBilled)/b.check.realBilled*1000)/10}%)`);
  console.log(`BILLED ${label}: measured ${Math.round(m.ms/1000)} s: ${m.docReads} doc reads + ${m.rulesReads} rules lookups on reads (+${m.rulesOnWrites} on writes) = ${m.billed} billed, ${m.writes} writes [daniel ${m.byUser.daniel.docReads}+${m.byUser.daniel.rulesReads}=${m.byUser.daniel.billed}, nik ${m.byUser.nik.docReads}+${m.byUser.nik.rulesReads}=${m.byUser.nik.billed}]; self lookups counted ${m.selfLookups}`);
  if(b.rows.length){
    for(const pr of Object.values(b.profiles))console.log(`  BILLED ${label} @ ${pr.label}: season ${pr.seasonMinutes} min (transfer ${pr.transferMin} + results ${pr.resultsMin} + short waits ${pr.shortMin} + harness play ${pr.harnessMin}) -> ${pr.seasonsPerDay} seasons/day, budget ${pr.budget}; measured ${pr.billed} billed reads, ${pr.writes} writes: ${pr.pass?"PASS":"FAIL"}; the cost allows ${pr.realSeasonsPerDay} seasons/day`);
    console.log(`  waits (${b.sampledMinutes} min sampled${REALTIME_WAITS?`, REAL TIME at the ${REALTIME_PROFILE} pace`:", extrapolated linearly at the sample's steady per-minute rate"}): ${b.rows.map(r=>`${r.point} ${r.sampleMin.toFixed(1)}/${r.targetMin}min ${r.tailBilled}b@${r.ratePerMin.toFixed(1)}/min (billed per minute of the sample: ${r.perMinute.join(",")}; read brake trips D ${r.brake.daniel.trips} N ${r.brake.nik.trips}${r.brake.daniel.onAtEnd||r.brake.nik.onAtEnd?", ON at the end":""}) [D ${r.perDevice.daniel.billedPerMin}, N ${r.perDevice.nik.billedPerMin} billed/min; docs D ${r.perDevice.daniel.docsPerMin}, N ${r.perDevice.nik.docsPerMin}/min] ${r.topModules.slice(0,3).map(x=>`${x.key} ${x.perMin}/min`).join(", ")}`).join("\n    ")}`);
  }
}
function printMeter(label,w){
  const per=Object.entries(w.byUser).map(([u,v])=>`${u} ${v.reads}r/${v.writes}w`).join(", ");
  console.log(`METER ${label}: ${Math.round(w.ms/1000)} s, reads ${w.reads} (SDK ${w.sdkReads} + listener ${w.listenReads}), writes ${w.writes} [${per}]; network ${w.net.batchGetDocs} batchGet docs, ${w.net.commits} commits writing ${w.net.committedDocs} docs`);
}
function meterEntry(label,from,to,{play=null}={}){
  const w=meter.between(from,to),p=play?meter.between(...play):null;
  printMeter(label,w);if(p)printMeter(`${label} (play only, no page visits)`,p);
  const entry={label,showdown:showdownNow,season:seasonNow,reads:w.reads,writes:w.writes,sdkReads:w.sdkReads,listenReads:w.listenReads,ms:w.ms,byUser:w.byUser,top:w.top.slice(0,8),play:p?{reads:p.reads,writes:p.writes}:null};
  // Billed reads of the season's play (marks play[0]..play[1]: no page visits), waits extrapolated to the profiles.
  const t=name=>meter.marks.find(m=>m.label===name).t;
  playWindows.push([t(play?play[0]:from),t(play?play[1]:to)]);
  const b=seasonBilled(t(play?play[0]:from),t(play?play[1]:to));
  const topOf=billedMeter.price(billedModel,meter.events.filter(e=>e.t>=t(play?play[0]:from)&&e.t<t(play?play[1]:to)&&(e.k==="read"||e.k==="write"||e.k==="listener")));
  entry.billed={check:b.check,measured:{docReads:b.measured.docReads,rulesReads:b.measured.rulesReads,rulesOnWrites:b.measured.rulesOnWrites,billed:b.measured.billed,writes:b.measured.writes,selfLookups:b.measured.selfLookups,byUser:b.measured.byUser,ms:b.measured.ms},profiles:b.profiles,waits:b.rows,sampledMinutes:b.sampledMinutes,topModules:billedMeter.top(topOf.byModule,5),topPaths:billedMeter.top(topOf.byPath,5)};
  printBilled(label,b);
  report.meter.push(entry);return entry;
}
let markSeq=0;const mark=label=>{const name=`${label}#${++markSeq}`;meter.mark(name);return name;};
async function careerCheckpoint(ctx,label,{live=null,settingsLive=false}={}){
  const {daniel,nik,career}=ctx;
  const out={};
  await phase(`pages-${label}`,async()=>{
    for(const m of [daniel,nik]){
      const raw=await captureCareer(m,label);out[m.user]=raw;
      await checkCareerPages(m,raw,`${label}.${m.user}`,career,{live,settingsLive});
    }
    await checkIdentical({daniel:out.daniel,nik:out.nik},label,{liveCareer:career.some(s=>s.state==="live"&&s.seasons.length)});
  });
  report.raw[label]=out;report.checkpoints.push({label,showdown:showdownNow,season:seasonNow,career:career.map(s=>({name:s.name,state:s.state,seasons:s.seasons.length}))});
  return out;
}
async function playShowdown(ctx,spec){
  const {daniel,nik,career}=ctx;
  showdownNow=spec.name;seasonNow=0;
  const entry={name:spec.name,state:"live",seasons:[],totalSeasons:spec.length,clubs:null,league:null,rivalryId:null,test:false};
  const startMark=mark(`${spec.name}:start`);
  const code=await phase(`${spec.name}-start`,()=>danielStartsShowdown(daniel,spec.length,{firstRealStart:spec.firstRealStart}));
  if(spec.firstRealStart)await check(daniel,`${spec.name}.code`,"the first real START makes the one-time CMS17R- code",/^CMS17R-pair_[0-9a-f]{64}$/.test(code),code,{screen:"Connect Players"});
  else await check(daniel,`${spec.name}.code`,"already paired: no code for Nik to type",/^CMS17-pair_[0-9a-f]{64}$/.test(code),code,{screen:"Connect Players"});
  entry.rivalryId=await phase(`${spec.name}-join`,()=>nikJoins(daniel,nik,code,{typed:spec.firstRealStart,length:spec.length}));
  const sessionCode=await sessionOf(daniel);
  await check(null,`${spec.name}.session`,"Nik is in Daniel's private session",/^session_[0-9a-f]{64}$/.test(String(sessionCode))&&(await sessionOf(nik))===sessionCode,{daniel:sessionCode,nik:await sessionOf(nik)},{screen:"Remote Joining"});
  const setup=await phase(`${spec.name}-setup`,()=>playSetup(daniel,nik));
  entry.clubs=setup.clubs;entry.league=setup.league;
  const target=spec.target;
  const plan=buildPlan(spec.length,setup.teamCount,target,spec.seed);
  entry.plan=plan;
  career.push(entry);
  report.showdowns.push({name:spec.name,rivalryId:entry.rivalryId,league:setup.league,teamCount:setup.teamCount,clubs:setup.clubs,length:spec.length,stopAfter:spec.endAfter||null,target,plan:plan.map((s,i)=>({season:i+1,daniel:s.daniel,nik:s.nik,score:{daniel:scoreSeason(s.daniel).total,nik:scoreSeason(s.nik).total},winner:seasonWinner(s.daniel,s.nik)}))});
  console.log(`PLAN ${spec.name}: ${setup.league} (${setup.teamCount} teams), ${setup.clubs.join(" v ")}, ${spec.length} season(s), target ${target}${spec.endAfter?`, END after season ${spec.endAfter}`:""}`);
  let seasonStart=startMark;
  const playedTo=spec.endAfter||spec.length;
  for(let k=1;k<=playedTo;k+=1){
    seasonNow=k;const final=k===spec.length;
    await phase(`${spec.name}-S${k}-transfers`,()=>playTransfers(daniel,nik,`${spec.name}${k}`));
    const mode=await phase(`${spec.name}-S${k}-results`,()=>playSeasonResults(daniel,nik,k,plan[k-1]));
    await phase(`${spec.name}-S${k}-commit`,()=>commitSeason(daniel,nik,k,plan[k-1],final));
    entry.seasons.push(plan[k-1]);
    if(!final){
      for(const m of [daniel,nik])await checkSharedHistory(m,k,spec.length,plan);
      await phase(`${spec.name}-S${k}-continue`,()=>continueToSeason(daniel,nik,k+1,spec.length));
      const playEnd=mark(`${spec.name}:S${k}:play`);
      const pagesDue=!SLIM&&(k%PAGES_EVERY===0||k===1||k===playedTo);
      if(pagesDue){
        if(RELOAD_EVERY&&k%RELOAD_EVERY===0)await phase(`${spec.name}-S${k}-reload`,()=>reloadBoth(daniel,nik,sessionCode));
        await careerCheckpoint(ctx,`${spec.name}.S${k}`,{live:entry,settingsLive:true});
        if(k===playedTo&&spec.endAfter)break;// END SHOWDOWN follows from Home
        for(const m of [daniel,nik])await returnToGame(m,k+1,spec.length);
      }
      const end=mark(`${spec.name}:S${k}:end`);
      meterEntry(`${spec.name} season ${k}${k===1?" (incl. START, pairing, setup)":""}${pagesDue?" + both players' page checks":""}`,seasonStart,end,{play:[seasonStart,playEnd]});
      seasonStart=end;
      report.observations.push({showdown:spec.name,season:k,publishOrder:mode});
    }else{
      // Final season: the Showdown Champion screen and the automatic close.
      for(const m of [daniel,nik]){
        await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
        try{await m.page.waitForFunction(()=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED",null,{timeout:90000});}
        catch(_e){await check(m,`${spec.name}.closed`,"the Showdown closes by itself",false,await describe(m),{screen:"Terminal close"});}
      }
      const playEnd=mark(`${spec.name}:S${k}:play`);
      const rivalry=await admin(`rivalries/${entry.rivalryId}`),w=field(rivalry,"data","terminalClose"),t=tally(plan),win=overallWinner(t);
      await check(null,`${spec.name}.db.closed`,"database: the rivalry is closed with the right winner and totals",field(rivalry,"data","connectionState")?.stringValue==="closed"&&field(w,"winner")?.stringValue===(win==="draw"?"draw":ROLE[win])&&field(w,"managerTotals","playerOne")?.integerValue===String(t.daniel.total)&&field(w,"managerTotals","playerTwo")?.integerValue===String(t.nik.total),{state:field(rivalry,"data","connectionState"),terminal:w},{screen:"Database"});
      for(const m of [daniel,nik]){
        await checkFinalWinnerScreen(m,plan);
        await check(m,`${spec.name}.noCloseTap`,"the automatic close needs no CLOSE tap",!m.log.taps.some(t=>t.id==="sharedTerminalCloseAction"||t.id==="sharedTerminalCloseRetry"),"a CLOSE tap was needed",{screen:"Showdown Champion"});
      }
      entry.state="completed";billedModel?.markFinished(entry.rivalryId);
      for(const m of [daniel,nik]){
        let landed=false;try{await m.page.locator("#v10ExitSlot [data-smart-back]").first().click({timeout:8000});landed=await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false);}catch(_e){}
        await check(m,`${spec.name}.backHome`,"BACK TO SHOWDOWN HOME on the Showdown Champion screen opens Showdown Home",landed,await describe(m),{screen:"Showdown Champion"});
      }
      if(!SLIM)await careerCheckpoint(ctx,`${spec.name}.end`,{settingsLive:false});
      const end=mark(`${spec.name}:S${k}:end`);
      meterEntry(`${spec.name} season ${k} (final${k===1?", incl. START, pairing, setup":""}, + both players' page checks)`,seasonStart,end,{play:[seasonStart,playEnd]});
    }
  }
  if(spec.endAfter){
    // END SHOWDOWN (Daniel, Settings) with season endAfter committed and the next season's transfer window not yet started.
    await phase(`${spec.name}-end-showdown`,async()=>{
      await backToShowdownHome(daniel);
      await openSettings(daniel);
      const endButton=daniel.page.locator(".settingsDeleteCurrentShowdown");
      await eq(daniel,`${spec.name}.end.button`,"Settings' red button reads END SHOWDOWN",norm(await endButton.textContent().catch(()=>"")),"END SHOWDOWN",{screen:"Settings"});
      await endButton.click({timeout:10000});
      await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:45000});
      const closed=await adminUntil(`rivalries/${entry.rivalryId}`,doc=>field(doc,"data","connectionState")?.stringValue==="closed",`${spec.name} is closed`);
      await eq(null,`${spec.name}.end.mark`,`the closure carries endedEarly {seasonsPlayed: ${spec.endAfter}} and no finish witness`,[field(closed,"data","endedEarly","seasonsPlayed")?.integerValue,field(closed,"data","terminalClose")===undefined],[String(spec.endAfter),true],{screen:"Database"});
      await closeSettings(daniel);
      await daniel.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
      try{await nik.page.waitForFunction(id=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED"&&window.CareerModeProductionSharedTerminalClose.getState().rivalryId===id,entry.rivalryId,{timeout:60000});await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});}
      catch(_e){await check(nik,`${spec.name}.end.nikHome`,"Nik's phone goes Home by itself after END SHOWDOWN",false,await describe(nik),{screen:"Showdown Home"});}
      entry.state="ended";billedModel?.markFinished(entry.rivalryId);
      entry.endedDate=await daniel.page.evaluate(()=>new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(new Date()));
    });
    const end=mark(`${spec.name}:ended`);
    await careerCheckpoint(ctx,`${spec.name}.ended`,{settingsLive:false});
    const after=mark(`${spec.name}:ended:pages`);
    meterEntry(`${spec.name} END SHOWDOWN + both players' page checks`,seasonStart,after,{play:[seasonStart,end]});
  }
  return entry;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------------------
async function main(){
  fs.rmSync(SHOT_DIR,{recursive:true,force:true});fs.mkdirSync(SHOT_DIR,{recursive:true});
  await loadComposedRules();
  let server=null;
  if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});await new Promise(resolve=>setTimeout(resolve,800));}
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[],retired=[];
  let failure=null;
  try{
    const daniel=await openManager(browser,"daniel");managers.push(daniel);
    const nik=await openManager(browser,"nik");managers.push(nik);
    for(const m of [daniel,nik])await check(m,"boot.switch","emulator switch active (localhost + cmsEmulator=1 only)",await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),"switch inactive",{screen:"Boot"});
    await phase("sign-in",async()=>{await signIn(daniel,"Daniel");await signIn(nik,"Nik");});
    daniel.uid=await accountId(daniel);nik.uid=await accountId(nik);
    await check(null,"boot.accounts","Daniel and Nik signed in as two distinct accounts",Boolean(daniel.uid&&nik.uid&&daniel.uid!==nik.uid),{daniel:daniel.uid,nik:nik.uid},{screen:"Sign in"});
    const ctx={daniel,nik,career:[]};ctxRef=ctx;billedModel=billedMeter.loadModel();
    console.log(`BILLED model: Rules sha256 ${billedModel.rulesSha256.slice(0,16)}; waits ${BUDGET_MODE?`ON (${REALTIME_WAITS?`real time at the ${REALTIME_PROFILE} pace`:`sampled ${SAMPLE_LONG_MIN} min long / ${SAMPLE_SHORT_MIN} min short, extrapolated`}); paces ${JSON.stringify(WAIT_PROFILES)}`:"OFF (CE2PG_BUDGET=1 turns them on)"}`);
    const specs=PLAN_NAME==="main"?[
      {name:"T",length:1,firstRealStart:true,target:"nik",seed:91},
      {name:"A",length:3,target:RUN===2?"nik":"daniel",seed:11},
      {name:"B",length:1,target:RUN===2?"daniel":"nik",seed:23},
      {name:"C",length:3,endAfter:1,target:null,seed:37}
    ]:[{name:"S",length:SEASONS,firstRealStart:true,target:SCENARIO==="draw"?"draw":RUN===2?"nik":"daniel",seed:SEASONS}];
    for(const spec of specs){
      await playShowdown(ctx,spec);
    }
    showdownNow="end";seasonNow=0;
    // Every completed real Showdown remains in the career, including the first one.
    if(PLAN_NAME==="main"){
      const marker=await admin(`accounts/${daniel.uid}/careerStart/current`);
      const hidden=(field(marker,"data","hiddenRivalryIds")?.arrayValue?.values||[]).map(v=>v.stringValue);
      const T=report.showdowns.find(s=>s.name==="T")?.rivalryId;
      await check(null,"T.counted","the first real Showdown is counted in the career",Boolean(T&&!hidden.includes(T)&&ctx.career.some(s=>s.rivalryId===T&&s.state==="completed")),{T,hidden},{screen:"Database"});
    }
    if(!SLIM){
    // The end state again on both pages as they are (the last checkpoint), then after a storage wipe and in a brand-new browser.
    const raws={daniel:report.raw[report.checkpoints.at(-1).label].daniel,nik:report.raw[report.checkpoints.at(-1).label].nik};
    await phase("storage-wipe",async()=>{
      for(const m of [daniel,nik]){
        const keys=await m.page.evaluate(()=>{const k=Object.keys(localStorage);try{localStorage.clear();}catch(_e){}return k;});
        report.observations.push({where:"storage wipe",user:m.user,localStorageKeys:keys});
        await reload(m);
        await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000}).catch(()=>{});
        const raw=await captureCareer(m,"wiped");raws[`${m.user}-wiped`]=raw;
        await checkCareerPages(m,raw,`end.wiped.${m.user}`,ctx.career,{settingsLive:false});
      }
    });
    await phase("fresh-browser",async()=>{
      for(const account of ["daniel","nik"]){
        let fresh=null;
        try{
          fresh=await openManager(browser,account,`${account}-fresh`);retired.push(fresh);
          await check(fresh,"end.fresh.empty","the fresh browser starts with empty local storage",await fresh.page.evaluate(()=>{try{return localStorage.length;}catch(_){return -1;}})===0,"storage not empty",{screen:"Boot"});
          await signIn(fresh,NAMES[account],{fresh:true});
          const raw=await captureCareer(fresh,"fresh");raws[`${account}-fresh`]=raw;
          await checkCareerPages(fresh,raw,`end.fresh.${account}`,ctx.career,{settingsLive:false});
        }catch(error){await addProblem(fresh,`end.fresh.${account}`,"Fresh browser",`could not read the career pages in a fresh browser signed in as ${NAMES[account]}: ${String(error.message).split("\n")[0]}`,{severity:"harness-or-game"});}
        finally{if(fresh)await fresh.context.close().catch(()=>{});}
      }
    });
    await checkIdentical(raws,"end.all");
    report.raw.end=raws;
    }

  }catch(error){
    failure=error;
    report.fatal={message:String(error&&error.message||error).slice(0,1500),stack:String(error&&error.stack||"").split("\n").slice(0,8).join("\n")};
    for(const m of managers){report.fatal[`state_${m.user}`]=await describe(m);await addProblem(m,"fatal",`journey stopped (${showdownNow} season ${seasonNow})`,`${report.fatal.message} | ${report.fatal[`state_${m.user}`]}`,{severity:"harness-or-game",name:"fatal"});}
  }finally{
    seasonNow=0;showdownNow="zz";
    for(const m of [...managers,...retired]){
      await check(m,"zz.production","never contacted a production Firebase host or loaded the production runtime",m.log.forbidden.length===0&&m.log.productionRuntime===0,{forbidden:m.log.forbidden,productionRuntime:m.log.productionRuntime},{screen:"Network"});
      await check(m,"zz.pageerrors","no uncaught page errors or console errors",m.log.pageErrors.length===0&&m.log.consoleErrors.length===0,{pageErrors:m.log.pageErrors.slice(0,5),consoleErrors:m.log.consoleErrors.slice(0,5)},{screen:"Console"});
      await check(m,"zz.network","no failed network requests (HTTP 4xx/5xx other than benign write contention, or request failures other than aborted navigations)",m.log.failedRequests.length===0&&m.log.httpErrors.length===0,{failed:m.log.failedRequests.slice(0,5),http:m.log.httpErrors.slice(0,8)},{screen:"Network"});
    }
    const over=report.meter.filter(e=>(e.play?e.play.reads:e.reads)>BUDGET.readsPerSeason||(e.play?e.play.writes:e.writes)>BUDGET.writesPerSeason);
    await check(null,"zz.meter",`every season's play stays within ${BUDGET.readsPerSeason} reads / ${BUDGET.writesPerSeason} writes (both players)`,over.length===0,over.map(e=>`${e.label}: ${e.play?.reads??e.reads}r/${e.play?.writes??e.writes}w`).join("; "),{screen:"Meter"});
    if(BUDGET_MODE)meter.write(path.join(OUT_DIR,`${TAG}.events.json`));
    if(BUDGET_MODE){
      const seasons=report.meter.filter(e=>e.billed);
      // Gate: every season, at every pace, must be within its budget (formula in the header comment) and the writes budget.
      const lines=[],failures=[];
      for(const e of seasons)for(const pr of Object.values(e.billed.profiles)){
        const bad=!pr.pass||pr.writes>BUDGET.writesPerSeason;
        lines.push(`${e.label} @ ${pr.label}: ${pr.seasonMinutes} min (transfer ${pr.transferMin} + results ${pr.resultsMin} + short ${pr.shortMin} + harness ${pr.harnessMin}) -> ${pr.seasonsPerDay}/day, budget ${pr.budget}, billed ${pr.billed}, writes ${pr.writes}, capacity ${pr.realSeasonsPerDay}/day: ${bad?"FAIL":"PASS"}`);
        if(bad)failures.push({e,pr});
      }
      const worst=[...seasons].sort((a,b)=>Math.max(...Object.values(b.billed.profiles).map(x=>x.billed/x.budget))-Math.max(...Object.values(a.billed.profiles).map(x=>x.billed/x.budget)))[0];
      const topText=worst?`top modules of ${worst.label}: ${JSON.stringify(worst.billed.topModules)}; top paths: ${JSON.stringify(worst.billed.topPaths)}`:"";
      // Reads per minute per device and top modules, per screen (wait point), averaged over the seasons sampled.
      const byPoint={};
      for(const e of seasons)for(const r of e.billed.waits){const b=byPoint[r.point]||(byPoint[r.point]={n:0,billed:0,docs:0,d:0,nk:0,dd:0,nd:0,mods:{}});b.n+=1;b.billed+=r.ratePerMin;b.docs+=r.docRatePerMin;b.d+=r.perDevice.daniel.billedPerMin;b.nk+=r.perDevice.nik.billedPerMin;b.dd+=r.perDevice.daniel.docsPerMin;b.nd+=r.perDevice.nik.docsPerMin;for(const m of r.topModules)b.mods[m.key]=(b.mods[m.key]||0)+m.perMin;}
      const screens=Object.entries(byPoint).map(([point,b])=>({point,samples:b.n,billedPerMin:+(b.billed/b.n).toFixed(1),docsPerMin:+(b.docs/b.n).toFixed(1),daniel:{billedPerMin:+(b.d/b.n).toFixed(1),docsPerMin:+(b.dd/b.n).toFixed(1)},nik:{billedPerMin:+(b.nk/b.n).toFixed(1),docsPerMin:+(b.nd/b.n).toFixed(1)},topModules:Object.entries(b.mods).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([k,v])=>`${k} ${(v/b.n).toFixed(1)}/min`)}));
      const screenText=screens.map(x=>`${x.point}: ${x.billedPerMin} billed/min (${x.docsPerMin} doc reads/min) [Daniel ${x.daniel.billedPerMin} billed ${x.daniel.docsPerMin} docs, Nik ${x.nik.billedPerMin} billed ${x.nik.docsPerMin} docs]; ${x.topModules.join(", ")}`).join("\n  ");
      await check(null,"zz.billed",`every season stays within its billed-reads budget at the slow, mid and fast pace (budget = floor(45,000 / min(25, floor(1440 / seasonMinutes))); documents + Rules lookups, both managers, waits included) and ${BUDGET.writesPerSeason} writes`,seasons.length>0&&failures.length===0,`${failures.length?`OVER BUDGET in ${failures.length} season/pace cases. `:""}\n  ${lines.join("\n  ")}\n  ${topText}`,{screen:"Meter"});
      console.log(`BILLED gate: ${failures.length===0&&seasons.length?"PASS":"FAIL"}\n  ${lines.join("\n  ")}\n  ${topText}\nSCREEN RATES (steady state, both devices; 'billed' = documents + Rules lookups):\n  ${screenText}`);
      try{
        const att=buildAttribution(),text=formatAttribution(att);
        // Per pace: what each screen costs in one season = its steady billed/min x the pace's minutes on it.
        const perPace=[`## PER PACE (one season, from the steady rates above; transfer = the three transfer points, results = results-entry priced at the dearer of entry/published)`];
        const rate=pt=>{const rows=att.rows.filter(r=>r.screen===pt&&r.state==="waiting");const min=att.minutes[`${pt}|waiting`]||0;return min?rows.reduce((a,r)=>a+r.billed,0)/min:0;};
        const rEntry=Math.max(rate("results-entry"),rate("results-published"));
        for(const [name,prof] of Object.entries(WAIT_PROFILES)){
          const tr=["transfer-window","transfer-guesses","transfer-signings"].reduce((a,pt)=>a+rate(pt)*pointMinutes(pt,prof),0);
          const rs=rEntry*prof.results,sh=(rate("commit")+rate("ack")+rate("continue"))*prof.short;
          perPace.push(`${name}: transfer ${prof.transfer} min -> ${Math.round(tr)} billed; results ${prof.results} min -> ${Math.round(rs)} billed; commit+ack+continue ${prof.short} min each -> ${Math.round(sh)} billed`);
        }
        fs.writeFileSync(path.join(OUT_DIR,`${TAG}.attribution.txt`),`${text}\n\n${perPace.join("\n")}\n`);
        report.attribution={rows:att.rows,minutes:att.minutes,seasons:att.seasons};
        console.log(`${text}\n\n${perPace.join("\n")}`);
      }catch(error){console.log(`attribution failed: ${error&&error.stack||error}`);}
      report.billed={budget:BILLED_BUDGET,profiles:WAIT_PROFILES,realtime:REALTIME_PROFILE,sampleLongMin:SAMPLE_LONG_MIN,sampleShortMin:SAMPLE_SHORT_MIN,rulesSha256:billedModel?.rulesSha256||null,seasons:seasons.map(e=>({label:e.label,measured:e.billed.measured,profiles:e.billed.profiles,waits:e.billed.waits,topModules:e.billed.topModules,topPaths:e.billed.topPaths})),screens};
    }
    const failed=report.checks.some(c=>!c.pass)||Boolean(failure);
    report.verdict=failed?"FAIL":"PASS";
    writeReport();
    await browser.close().catch(()=>{});if(server)server.kill();
    console.log(`METER summary: ${report.meter.map(e=>`${e.label}: ${e.reads}r/${e.writes}w${e.play?` (play ${e.play.reads}r/${e.play.writes}w)`:""}`).join(" | ")}`);
    console.log(`${report.verdict} ${TAG}: ${report.summary.passed}/${report.summary.checks} checks, ${report.problems.length} problem(s), ${Math.round(report.timings.totalMs/1000)} s -> ${rel(REPORT_PATH)}; screenshots in ${rel(SHOT_DIR)}`);
  }
  process.exitCode=report.verdict==="PASS"?0:1;
}
main().catch(error=>{console.error(error);try{report.verdict="FAIL";report.fatal=report.fatal||{message:String(error&&error.message||error)};writeReport();}catch(_e){}process.exit(1);});
