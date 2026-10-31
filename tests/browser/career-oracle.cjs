"use strict";
// r87 W3-3: the career-screen number oracle.
// After real emulator Showdowns, every number on History, Standings, Rivalry Statistics, Trophy Room, Career Statistics and
// History & Backup (plus the Settings HISTORY row) is compared with what the stored Firestore documents say, for Daniel and for
// Nik, on a desktop and on a phone, each in a FRESH browser (empty storage, so every figure is read from Firebase).
//
// How the career is built (all on the local emulators, demo project; production Firebase is never contacted):
//   1. CE2PG plays real Showdowns in two browsers (tests/browser/ce2pg-journey.cjs, run unchanged as a child inside this run's
//      emulators). Default CE2PG_PLAN=main: a 1-season, a 3-season, a 1-season and a 3-season Showdown ended early after
//      season 1. ORACLE_PLAY=0 skips this (only when the emulators already hold a CE2PG career, e.g. ORACLE_REUSE=1).
//   2. The seeder adds more finished Showdowns to the same two accounts through the game's own Spark providers with the
//      composed production Rules on (tests/browser/support/career-oracle-seed.cjs): ORACLE_SEED=standard (default) adds a
//      3-season Showdown with Europa League wins, a drawn 1-season Showdown (equal totals, different league finishes), a
//      10-season Golden Showdown (Nik closes on 110) and a 3-season Showdown ended early after 2 seasons. ORACLE_SCALE=N adds N
//      more 1-season Showdowns (History through hundreds of Showdowns; the career index pages at 50). ORACLE_SEED=none adds none.
//   3. The oracle reads both accounts' careers straight from the stored documents (career index, career start marker, rivalry
//      roots, setup, acknowledged season commits) and computes every figure with the house rules
//      (tests/browser/support/career-oracle-expect.cjs). It never uses the game's scoring or career code.
//   4. Daniel and Nik each open a fresh desktop (1366x768) and phone (390x844) browser, sign in, and every screen is read and
//      checked. Screen open times are reported (History through many Showdowns must stay fast).
// Run: node tests/browser/career-oracle.cjs        (about 25 min with CE2PG main; ORACLE_SCALE adds ~4 s per Showdown)
//      ORACLE_CE2PG_PLAN=single ORACLE_CE2PG_SEASONS=1 node tests/browser/career-oracle.cjs   (quicker base career)
// Needs firebase@12.17.0 in node_modules (12.17.1 breaks emulator auth). Output: test-results/career-oracle.json and screenshots
// in test-results/career-oracle/. Exit 1 when any check fails.
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const PORT_BASE=Number(process.env.ORACLE_PORT_BASE||9580);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const PROJECT="demo-cms-browser-journey";// the emulator switch is pinned to this demo project id
const OUT_DIR=path.join(ROOT,"test-results");
const TAG=process.env.ORACLE_TAG||"career-oracle";
const REPORT_PATH=path.join(OUT_DIR,`${TAG}.json`);
const SHOT_DIR=path.join(OUT_DIR,TAG);

if(!process.env.FIRESTORE_EMULATOR_HOST){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  if(!fs.existsSync(path.join(ROOT,"firestore.spark.generated.rules"))){
    for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
      const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,stdio:"inherit"});
      if(built.status!==0)process.exit(built.status||1);
    }
  }
  const configPath=path.join(OUT_DIR,`${TAG}.emulators.json`);
  fs.writeFileSync(configPath,JSON.stringify({emulators:{auth:{host:"127.0.0.1",port:PORTS.auth},firestore:{host:"127.0.0.1",port:PORTS.firestore,websocketPort:PORTS.websocket},hub:{host:"127.0.0.1",port:PORTS.hub},logging:{host:"127.0.0.1",port:PORTS.logging},ui:{enabled:false},singleProjectMode:true}}));
  const child=spawn("npx",["--yes","firebase-tools@15.28.1","emulators:exec","--config",configPath,"--only","auth,firestore","--project",PROJECT,`node ${path.relative(ROOT,__filename)}`],{cwd:ROOT,stdio:"inherit",env:{...process.env,CMS_CHROMIUM_MULTI_CONTEXT:"1"}});
  child.on("exit",code=>process.exit(code===null?1:code));
  return;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Inside the emulators.
// ---------------------------------------------------------------------------------------------------------------------------
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const Seed=require("./support/career-oracle-seed.cjs");
const Expect=require("./support/career-oracle-expect.cjs");
const Screens=require("./support/career-oracle-screens.cjs");

const fsPort=Number(String(process.env.FIRESTORE_EMULATOR_HOST).split(":")[1]);
const authPort=Number(String(process.env.FIREBASE_AUTH_EMULATOR_HOST||`127.0.0.1:${PORTS.auth}`).split(":")[1]);
const APP_PORT=Number(process.env.ORACLE_APP_PORT||4681);
const BASE=(process.env.CMS_BASE_URL||`http://127.0.0.1:${APP_PORT}/`).replace(/\/?$/,"/");
const VIEWPORTS={desktop:{width:1366,height:768},phone:{width:390,height:844}};
const SLOW_OPEN_MS=Number(process.env.ORACLE_SLOW_OPEN_MS||8000);

const report={tag:TAG,startedAt:new Date().toISOString(),ports:{auth:authPort,firestore:fsPort},verdict:"RUNNING",ce2pg:null,seeded:[],career:null,checks:[],openTimes:{},notes:[]};
const writeReport=()=>{fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(REPORT_PATH,JSON.stringify(report,null,1));};
function check(id,label,ok,detail,{who="all",screen=""}={}){
  const pass=Boolean(ok);report.checks.push({id,who,screen,label,pass,detail:pass?undefined:detail});
  console.log(`${pass?"ok  ":"FAIL"} ${id} [${who}] ${label}${pass?"":` -- ${typeof detail==="string"?detail:JSON.stringify(detail)}`.slice(0,1500)}`);
}
const eq=(id,label,got,want,opts)=>check(id,label,JSON.stringify(got)===JSON.stringify(want),{expected:want,shown:got},opts);
const S=String,two=(d,n)=>[S(d),S(n)];
const cell=n=>n>0?String(n):"—";
const leaderName=(d,n)=>d>n?"Daniel":n>d?"Nik":"Level · Daniel + Nik";
const near=(shown,want)=>Number.isFinite(Number(shown))&&Math.abs(Number(shown)-want)<=0.051;
const holderName=h=>h==="shared"?"SHARED":h.toUpperCase();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

// ---- 1. CE2PG base career ----
function runCe2pg(){
  return new Promise(resolve=>{
    const env={...process.env,CE2PG_PORT_BASE:String(PORT_BASE),CE2PG_APP_PORT:String(APP_PORT+1),CE2PG_PLAN:process.env.ORACLE_CE2PG_PLAN||"main",CE2PG_SEASONS:process.env.ORACLE_CE2PG_SEASONS||"",CMS_CHROMIUM_MULTI_CONTEXT:"1"};
    if(!env.CE2PG_SEASONS)delete env.CE2PG_SEASONS;
    const started=Date.now();
    const child=spawn(process.execPath,[path.join(ROOT,"tests/browser/ce2pg-journey.cjs")],{cwd:ROOT,env,stdio:["ignore","pipe","pipe"]});
    let tail="";const keep=chunk=>{tail=(tail+chunk).slice(-4000);};
    child.stdout.on("data",keep);child.stderr.on("data",keep);
    child.on("exit",code=>resolve({code,ms:Date.now()-started,plan:env.CE2PG_PLAN,tail:tail.split("\n").filter(l=>/^(PASS|FAIL)/.test(l)).slice(-3)}));
  });
}

// ---- 2. seeded Showdowns ----
function seedSpecs(){
  const {R,PERFECT}=Seed;const specs=[];
  if((process.env.ORACLE_SEED||"standard")==="standard"){
    // Europa League: Daniel wins it twice, Nik once; Nik's Champions League season never pairs with a Europa League.
    specs.push({name:"europa",seasons:[{playerOne:R(2,80,70,"E"),playerTwo:R(1,85,72,"c")},{playerOne:R(1,92,101,"Es"),playerTwo:R(3,70,60,"C")},{playerOne:R(4,60,55,""),playerTwo:R(2,75,64,"Ea")}]});
    // Drawn Showdown: equal points (3 - 3), Daniel 1st in the league vs Nik 2nd: league position must not decide it.
    specs.push({name:"draw",seasons:[{playerOne:R(1,80,70,""),playerTwo:R(2,79,70,"E")}]});
    // Golden Showdown: Nik scores 11 in every one of 10 seasons (110).
    specs.push({name:"golden",seasons:Array.from({length:10},(_,i)=>({playerOne:R(2+(i%3),70+i,60+i,i%2?"c":""),playerTwo:PERFECT}))});
    // Ended early after 2 of 3 seasons: one History status card, counted nowhere.
    specs.push({name:"ended",totalSeasons:3,endAfter:2,seasons:[{playerOne:PERFECT,playerTwo:R(5,50,40,"")},{playerOne:PERFECT,playerTwo:R(6,45,38,"")},{playerOne:PERFECT,playerTwo:PERFECT}]});
  }
  const scale=Number(process.env.ORACLE_SCALE||0);
  for(let i=0;i<scale;i+=1){
    const a=(i*7)%12,b=(i*5+3)%12;// varied, deterministic
    specs.push({name:`scale-${i+1}`,seasons:[{playerOne:R(1+(a%4),60+a*3,50+a*4,a>8?"C":a>5?"E":a>3?"c":""),playerTwo:R(1+(b%4),60+b*3,50+b*4,b>8?"C":b>5?"Es":b>3?"ca":"")}]});
  }
  return specs;
}

// ---- 4. the checks for one browser ----
function checkBrowser(who,raw,E){
  const f=Screens.extract(raw),x=E.x,id=k=>`${who}.${k}`,o=screen=>({who,screen});
  report.openTimes[who]=f.openMs;
  // Career Statistics
  if(E.completedCount===0)check(id("stats.empty"),"Career Statistics says there is no completed record yet",f.noRecord,"",o("Career Statistics"));
  else{
    eq(id("stats.summary"),"Career Statistics tiles: completed Showdowns, seasons, career points, trophies (D / N)",f.summary,[S(E.completedCount),S(x.daniel.seasons),S(x.nik.seasons),S(x.daniel.total),S(x.nik.total),S(x.daniel.trophies),S(x.nik.trophies)],o("Career Statistics"));
    for(const u of ["daniel","nik"])eq(id(`stats.table.${u}`),`Career Statistics table ${u}: Showdowns, season W-D-L, points, trophies`,f[`table_${u}`],[S(E.completedCount),S(x[u].W),S(x[u].D),S(x[u].L),S(x[u].total),S(x[u].trophies)],o("Career Statistics (table)"));
    eq(id("stats.compare"),"Career Statistics comparison: league titles, cups, Champions League, Europa League, season wins (D / N)",[f.compareTitles,f.compareCups,f.compareCl,f.compareEl,f.compareWins],[two(x.daniel.league,x.nik.league),two(x.daniel.cup,x.nik.cup),two(x.daniel.cl,x.nik.cl),two(x.daniel.el,x.nik.el),two(x.daniel.W,x.nik.W)],o("Career Statistics (comparison)"));
    check(id("stats.averages"),"Career Statistics comparison: average league points and goals",f.compareAvgPoints&&near(f.compareAvgPoints[0],x.daniel.avgPoints)&&near(f.compareAvgPoints[1],x.nik.avgPoints)&&f.compareAvgGoals&&near(f.compareAvgGoals[0],x.daniel.avgGoals)&&near(f.compareAvgGoals[1],x.nik.avgGoals),{expected:[x.daniel.avgPoints.toFixed(1),x.nik.avgPoints.toFixed(1),x.daniel.avgGoals.toFixed(1),x.nik.avgGoals.toFixed(1)],shown:[f.compareAvgPoints,f.compareAvgGoals]},o("Career Statistics (comparison)"));
    eq(id("stats.leaders"),"Career Statistics leaders: most season wins, trophies, career points, best season score (equal = Level)",[f.leadWins,f.leadTrophies,f.leadPoints,f.leadBest],
      [[leaderName(x.daniel.W,x.nik.W),S(Math.max(x.daniel.W,x.nik.W))],[leaderName(x.daniel.trophies,x.nik.trophies),S(Math.max(x.daniel.trophies,x.nik.trophies))],[leaderName(x.daniel.total,x.nik.total),S(Math.max(x.daniel.total,x.nik.total))],[leaderName(x.daniel.bestScore,x.nik.bestScore),S(Math.max(x.daniel.bestScore,x.nik.bestScore))]],o("Career Statistics (leaders)"));
    const anyGolden=x.daniel.golden+x.nik.golden>0;
    check(id("stats.golden"),anyGolden?"Career Statistics marks the Golden Showdown":"Career Statistics shows no Golden Showdown",f.csGolden===anyGolden,{expected:anyGolden,shown:f.csGolden},o("Career Statistics"));
  }
  // Standings (Career), opened first (before any other career page) and again after them
  const want={points:two(x.daniel.total,x.nik.total),W:two(x.daniel.W,x.nik.W),D:two(x.daniel.D,x.nik.D),L:two(x.daniel.L,x.nik.L),cl:two(x.daniel.cl,x.nik.cl),el:two(x.daniel.el,x.nik.el),league:two(x.daniel.league,x.nik.league),cup:two(x.daniel.cup,x.nik.cup),trophies:two(x.daniel.trophies,x.nik.trophies)};
  for(const [key,which] of [["standingsFirst","opened first"],["standings","opened after the other pages"]]){
    const s=f[key],text=key==="standings"?f.standingsText:f.standingsFirstText;
    check(id(`${key}.available`),`Standings (Career, ${which}) loads`,Boolean(text)&&!/unavailable|could not/i.test(text.replace(/^.*?CAREER STANDINGS/,"")),text.slice(0,300),o("Standings (Career)"));
    // The Europa Leagues row exists only once someone has won one; when it is not shown, it must be because both are 0.
    const got={...s};if(got.el===null&&x.daniel.el===0&&x.nik.el===0)got.el=two(0,0);
    eq(id(`${key}.career`),`Standings (Career, ${which}): career points, season W/D/L, Champions League, Europa League, titles, cups, trophies (D / N)`,got,want,o("Standings (Career)"));
  }
  check(id("standings.thisShowdown"),"Standings (This Showdown) says there is no active Showdown",/No active showdown|No Showdown in progress/i.test(f.thisShowdownText),f.thisShowdownText.slice(0,300),o("Standings (This Showdown)"));
  // Trophy Room
  const cabWant=[[cell(E.champions.daniel),cell(E.champions.nik)],[cell(x.daniel.league),cell(x.nik.league)],[cell(x.daniel.cup),cell(x.nik.cup)],[cell(x.daniel.cl),cell(x.nik.cl)],[cell(x.daniel.el),cell(x.nik.el)]];
  eq(id("trophy.cabinet"),"Trophy Room cabinet: Showdown Champion, league titles, cups, Champions League, Europa League (D / N)",[f.cabChampion,f.cabLeague,f.cabCup,f.cabCl,f.cabEl],cabWant,o("Trophy Room (cabinet)"));
  if(x.daniel.golden+x.nik.golden>0)eq(id("trophy.golden"),"Trophy Room Golden Showdown case (D / N)",f.cabGolden,[cell(x.daniel.golden),cell(x.nik.golden)],o("Trophy Room (cabinet)"));
  if(E.completedCount>0){
    // No tiebreak anywhere: equal career points share rank 1.
    for(const u of ["daniel","nik"]){const other=u==="daniel"?"nik":"daniel";eq(id(`trophy.rank.${u}`),`Trophy Room ranking: ${u} rank, career points, season wins`,f[u==="daniel"?"rankDaniel":"rankNik"],[x[u].total>=x[other].total?"1":"2",S(x[u].total),S(x[u].W)],o("Trophy Room (ranking)"));}
    const r=E.records,rw=v=>v?[S(v.value),holderName(v.holder)]:null;
    eq(id("trophy.records"),"Trophy Room records: highest season score, league points, league goals, most perfect seasons, biggest Showdown win (value, holder)",[f.recSeason,f.recPoints,f.recGoals,f.recPerfect,f.recBiggest],[rw(r.season),rw(r.points),rw(r.goals),rw(r.perfect),rw(r.biggestWin)],o("Trophy Room (records)"));
  }
  // History: one card per completed or ended-early Showdown, numbered in career order, opening on the newest
  const listed=f.historyCards.filter(c=>c.status==="completed"||c.status==="abandoned");
  eq(id("history.count"),`History lists ${E.history.length} Showdown card(s) (completed + ended early; never-joined, test and live ones are not listed)`,listed.length,E.history.length,o("History"));
  const byNumber=new Map(listed.map(c=>[Number(c.number),c]));
  const bad=[];
  for(const r of E.history){
    const c=byNumber.get(r.number);
    if(!c){bad.push({number:r.number,problem:"missing"});continue;}
    if(r.state==="ended"){
      const ok=c.status==="abandoned"&&new RegExp(`Ended early · [^·]+ · ${r.seasonsPlayed} seasons?`).test(c.text);
      if(!ok)bad.push({number:r.number,want:`Ended early · <date> · ${r.seasonsPlayed} season(s)`,shown:c.text.slice(0,200)});
      continue;
    }
    const parts=[`${r.totals.daniel} – ${r.totals.nik}`,`${r.seasons.length} / ${r.totalSeasons}`,r.winner==="draw"?"DRAW":`${Expect.NAMES[r.winner].toUpperCase()} WINS`];
    const missing=parts.filter(p=>!new RegExp(escape(p),"i").test(c.text));
    if(c.status!=="completed"||missing.length)bad.push({number:r.number,status:c.status,missing,shown:c.text.slice(0,240)});
  }
  check(id("history.cards"),"every History card shows the stored final score, seasons played / length and the winner (DRAW when equal), or the Ended early line",bad.length===0,bad.slice(0,8),o("History"));
  const newest=E.history.at(-1);
  if(newest){
    const shown=listed.filter(c=>c.visible).map(c=>Number(c.number));
    check(id("history.opensNewest"),`History opens on the newest Showdown (#${newest.number}) (Nik 2026-10-31)`,shown.includes(newest.number),{newest:newest.number,onShow:shown.slice(0,12)},o("History"));
  }
  if(!f.seasonHistoryFor&&E.history.some(h=>h.state==="completed"))check(id("history.seasons"),"History VIEW SEASON HISTORY opens for the selected completed Showdown",false,{seasonHistoryFor:f.seasonHistoryFor,text:f.seasonHistory.slice(0,300)},o("History (season history)"));
  if(f.seasonHistoryFor){
    const r=E.history.find(h=>h.number===Number(f.seasonHistoryFor)&&h.state==="completed");
    if(!r&&E.history.some(h=>h.state==="completed"))check(id("history.seasons"),"History VIEW SEASON HISTORY opens a completed Showdown",false,{seasonHistoryFor:f.seasonHistoryFor},o("History (season history)"));
    if(r){
      const sc=Expect.scoreSeason;
      const want=r.seasons.map((p,i)=>`Season ${i+1} Daniel: ${sc(p.daniel).total} #${p.daniel.leaguePosition} · ${p.daniel.leaguePoints} league pts · ${p.daniel.leagueGoals} goals – Nik: ${sc(p.nik).total} #${p.nik.leaguePosition} · ${p.nik.leaguePoints} league pts · ${p.nik.leagueGoals} goals`);
      const missing=want.filter(w=>!f.seasonHistory.includes(w));
      check(id("history.seasons"),`History VIEW SEASON HISTORY (Showdown #${r.number}) lists every season's score, league finish, points and goals as stored`,missing.length===0,{missing:missing.slice(0,4),shown:f.seasonHistory.slice(0,800)},o("History (season history)"));
    }
  }
  // Rivalry Statistics with no live Showdown: the newest completed one
  const rs=E.newestCompleted;
  if(rs){
    const t=Expect.tally(rs.seasons),g=f.rivalry;
    eq(id("rivalry"),"Rivalry Statistics shows the newest completed Showdown: seasons, Showdown points, season wins, trophies, Champions League, titles, cups (D / N)",
      {completed:g.completed,points:g.points,W:g.W,trophies:g.trophies,cl:g.cl,league:g.league,cup:g.cup},
      {completed:two(rs.seasons.length,rs.totalSeasons),points:two(t.daniel.total,t.nik.total),W:two(t.daniel.W,t.nik.W),trophies:two(t.daniel.trophies,t.nik.trophies),cl:two(t.daniel.cl,t.nik.cl),league:two(t.daniel.league,t.nik.league),cup:two(t.daniel.cup,t.nik.cup)},o("Rivalry Statistics"));
  }
  // Settings and History & Backup
  const st=f.settings;
  check(id("settings.history"),`Settings: HISTORY counts ${E.completedCount} completed Showdown(s)`,st&&st.rows.HISTORY===`${E.completedCount} completed showdown${E.completedCount===1?"":"s"}`,st?.rows,o("Settings"));
  eq(id("backup.figures"),"History & Backup: Showdowns completed and each manager's career points",f.backupFigures,{completed:S(E.completedCount),daniel:S(x.daniel.total),nik:S(x.nik.total)},o("History & Backup"));
  // Speed
  const slow=Object.entries(f.openMs).filter(([,ms])=>ms!==null&&ms>SLOW_OPEN_MS);
  check(id("speed"),`every career screen settles within ${SLOW_OPEN_MS/1000} s of its tap (fresh browser, ${E.history.length} History cards)`,slow.length===0,f.openMs,o("All career screens"));
  if(f.historyNav&&f.historyNav.steps>0){
    const per=f.historyNav.ms/f.historyNav.steps;
    check(id("history.navigation"),`History: each ‹ / › step through ${E.history.length} Showdowns answers within 1 s (walked oldest to newest)`,per<=1000,f.historyNav,o("History"));
  }
  return f;
}

async function main(){
  fs.rmSync(SHOT_DIR,{recursive:true,force:true});fs.mkdirSync(SHOT_DIR,{recursive:true});
  const rules=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
  let server=null,browser=null,env=null;
  try{
    if(process.env.ORACLE_PLAY!=="0"){
      console.log(`CE2PG ${process.env.ORACLE_CE2PG_PLAN||"main"}: playing the base career in two browsers...`);
      report.ce2pg=await runCe2pg();
      console.log(`CE2PG exit ${report.ce2pg.code} after ${Math.round(report.ce2pg.ms/1000)} s ${report.ce2pg.tail.join(" | ")}`);
      // CE2PG's own checks are its own report; the oracle only needs the career it built.
    }
    env=await Seed.connect({projectId:PROJECT,firestorePort:fsPort,rules});
    const who=await Seed.readCareerAccounts(env);
    check("base.accounts","the emulators hold the CE2PG Daniel and Nik accounts and their pair",Boolean(who.daniel.uid&&who.nik.uid),who);
    for(const spec of seedSpecs()){
      const t0=Date.now();
      try{const out=await Seed.playShowdown(env,who,spec);report.seeded.push({name:spec.name,rivalryId:out.rivalryId,leagueId:out.leagueId,teamCount:out.teamCount,played:out.played,totalSeasons:out.totalSeasons,ms:Date.now()-t0});}
      catch(error){check(`seed.${spec.name}`,`seed Showdown ${spec.name} through the providers`,false,String(error.message).slice(0,800));}
    }
    if(report.seeded.length)console.log(`seeded ${report.seeded.length} Showdown(s): ${report.seeded.map(s=>`${s.name} (${s.leagueId}, ${s.played}/${s.totalSeasons})`).join(", ").slice(0,600)}`);
    // The truth, from the stored documents of both accounts.
    const careers={daniel:await Expect.readCareer(env,who.daniel.uid),nik:await Expect.readCareer(env,who.nik.uid)};
    eq("data.sameIndex","Daniel's and Nik's career indexes list the same Showdowns in the same order",careers.nik.ids,careers.daniel.ids);
    const E=Expect.expectCareer(careers.daniel);
    check("data.witness","every completed Showdown's Terminal Close totals equal its stored seasons",E.witnessProblems.length===0,E.witnessProblems);
    report.career={showdowns:careers.daniel.rows.map(r=>({rivalryId:r.rivalryId.slice(0,14),state:r.state,hidden:r.hidden,seasons:r.seasons.length,totalSeasons:r.totalSeasons,totals:r.totals||null,winner:r.winner||null})),expected:{x:E.x,records:E.records,champions:E.champions,completed:E.completedCount,historyCards:E.history.length}};
    console.log(`expected: ${E.completedCount} completed, ${E.history.length} History cards; Daniel ${E.x.daniel.total} pts ${E.x.daniel.W}-${E.x.daniel.D}-${E.x.daniel.L}, Nik ${E.x.nik.total} pts ${E.x.nik.W}-${E.x.nik.D}-${E.x.nik.L}`);
    writeReport();
    // The browsers.
    if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});await new Promise(r=>setTimeout(r,800));}
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
    const facts={};
    const only=(process.env.ORACLE_BROWSERS||"daniel-desktop,daniel-phone,nik-desktop,nik-phone").split(",");
    for(const label of only){
      const [account,size]=label.split("-");
      let m=null;
      try{
        m=await Screens.openFresh(browser,{base:BASE,ports:{auth:authPort,firestore:fsPort},account,viewport:VIEWPORTS[size],label});
        await Screens.signInFresh(m,Expect.NAMES[account]);
        const shot=async name=>{try{await m.page.screenshot({path:path.join(SHOT_DIR,`${label}-${name}.png`)});}catch(_e){}};
        const raw=await Screens.captureAll(m,shot);
        fs.writeFileSync(path.join(SHOT_DIR,`${label}-raw.json`),JSON.stringify(raw,null,1));
        facts[label]=checkBrowser(label,raw,E);
        check(`${label}.clean`,"no page errors, no production Firebase host",m.log.pageErrors.length===0&&m.log.forbidden.length===0,{pageErrors:m.log.pageErrors.slice(0,4),forbidden:m.log.forbidden.slice(0,4)},{who:label});
      }catch(error){check(`${label}.run`,"the career screens could be opened and read",false,String(error.message).split("\n")[0],{who:label});}
      finally{if(m)await m.context.close().catch(()=>{});}
    }
    // The same figures everywhere.
    const labels=Object.keys(facts);
    const strip=f=>{const c={...f};for(const k of ["settings","openMs","historyNav","historyCards","seasonHistory","seasonHistoryFor","rivalryText","standingsText","standingsFirstText","thisShowdownText","backup"])delete c[k];c.cards=f.historyCards.map(h=>`${h.number}:${h.status}:${h.text}`);return c;};
    for(const other of labels.slice(1)){
      const a=strip(facts[labels[0]]),b=strip(facts[other]);
      const diffs=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>`${k}: ${JSON.stringify(a[k]).slice(0,200)} vs ${JSON.stringify(b[k]).slice(0,200)}`);
      check(`identical.${labels[0]}-${other}`,`every career figure reads the same on ${labels[0]} and ${other}`,diffs.length===0,diffs.join("; ").slice(0,1500));
    }
  }catch(error){
    check("fatal","the oracle ran to the end",false,String(error&&error.stack||error).slice(0,1500));
  }finally{
    if(browser)await browser.close().catch(()=>{});if(server)server.kill();if(env)await env.cleanup().catch(()=>{});
    const failed=report.checks.filter(c=>!c.pass);
    report.verdict=failed.length?"FAIL":"PASS";report.summary={checks:report.checks.length,failed:failed.length};report.finishedAt=new Date().toISOString();
    writeReport();
    console.log(`${report.verdict} ${TAG}: ${report.checks.length-failed.length}/${report.checks.length} checks -> ${path.relative(ROOT,REPORT_PATH)}`);
    process.exitCode=failed.length?1:0;
  }
}
main();
