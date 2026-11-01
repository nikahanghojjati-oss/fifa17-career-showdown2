"use strict";
// FIJ: fault-injection journey (r87 2.0.0 hardening). Daniel and Nik play one real 2-season Showdown in two Chromium contexts against
// the Firebase Auth + Firestore emulators with the composed production Rules (the CE2PG / L6 set-up: tests/browser/ce2pg-journey.cjs,
// the emulator switch, the read meter, the roulette and Gazette helpers). At every shared write of season 1, at the season-2
// boundary and at the terminal close, one fault hits one phone:
//   network      the phone taps, its network drops at once (the write in flight), stays offline 5-30 s, then comes back online
//                (going offline BEFORE the tap only shows CONNECTION REQUIRED over the button: the tap never happens)
//   lock         tap, then the page goes hidden and is frozen (a locked phone) for 8-20 s, then shown again
//   evict        tap, page hidden, then reloaded when shown again (iOS evicting a backgrounded page)
//   reload       tap, then an immediate reload (the write may still be in flight)
//   tabkill      tap, then the tab is closed at once and the app is opened again in a new tab (sign-in lives in sessionStorage)
//   twotabs      a second tab of the app opens on that phone (a new tab, signed in again); the write is tapped in one of the two tabs;
//                both tabs must show the same state; the second tab then closes
//   quota        Firestore answers RESOURCE_EXHAUSTED to every read and write of that phone (Listen/Write streams refused) until the
//                app's own pause trips; then the limit lifts and it is the next day: the player opens the app again (reload), or
//                at season-results the page stayed open and the clock jumps 11 minutes so the 10-minute pause ends by itself
//   coldoffline  tap, the tab closes, the phone opens the app again while offline (cold start), then comes back online
//   none         no fault (the baseline for the read counts)
// Write points: setup-confirm (CONFIRM SHOWDOWN), career-start (I STARTED AT), spin-mark (the roulette's last tap, which writes the
// manager's mark), tw-guess (LOCK MY GUESSES), tw-lock (first LOCK MY SIGNINGS), tw-verdict (the second LOCK MY SIGNINGS, which
// completes the Transfer War), season-results (the completing publish), season-commit (LOCK & CONFIRM SEASON), season-ack
// (CONFIRM SEASON), continue-s2 (CONTINUE TO SEASON 2 + Gazette), spin-mark-s2, terminal-close (season 2's acknowledgement, after
// which both phones close the Showdown by themselves). The phone alternates per point (FIJ_PHONE=alt starts with Daniel,
// alt-nik with Nik; daniel or nik pins it). When the fault phone is not the one writing, the fault hits it while the other writes.
// After each fault the phone takes the path a player would (CONTINUE SHOWDOWN, TRY AGAIN, sign in, the visible step button; a
// stuck screen is one with none of those for 90 s) and the suite checks, per point:
//   converge  both phones reach the same next state, and the database holds the write exactly once
//   stuck     no screen without a path out
//   roulette  each phone plays each season's roulette exactly once (never skipped, never replayed after it finished)
//   reads     10 s after recovery, a 20 s window: the faulted phone's document reads stay under FIJ_READS_PER_MIN (default 150/min);
//             the matrix compares every point and every run with the fault-free run (at most 3x+60 per point, 2.5x+100 per run)
// End checks: the database's season results, commits and terminal close match the typed plan (no lost or doubled season), both
// phones show the same Showdown Champion totals.
// Run: node tests/browser/fault-injection-journey.cjs                      every fault, 2 at a time (FIJ_PARALLEL), each in its
//                                                                          own emulators; prints the fault x point matrix
//      FIJ_FAULTS=network,reload FIJ_PHONE=alt-nik node tests/browser/fault-injection-journey.cjs
//      FIJ_FAULT=network node tests/browser/fault-injection-journey.cjs    one fault
// Options: FIJ_AFTER_LAND=1 (reload/evict/tab kill wait until the acknowledgement is stored first), FIJ_ONLY=point,point (fault only there; the other points run fault-free), FIJ_PORT_BASE (default 19610; each parallel run adds 10), FIJ_APP_PORT (default 14711), FIJ_DEBUG=1.
// Output: test-results/fij-<fault>-<phone>.json and test-results/fij-matrix.json (+ screenshots of problems).
// Test database only (demo project on the local emulators). Never touches production Firebase.
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const OUT_DIR=path.join(ROOT,"test-results");
const ALL_FAULTS=["network","lock","evict","reload","tabkill","twotabs","quota","coldoffline"];
const DEFAULT_JOBS=["none",...ALL_FAULTS];// "none" is the read baseline the matrix compares every fault run with
const POINTS=["setup-confirm","career-start","spin-mark","tw-guess","tw-lock","tw-verdict","season-results","season-commit","season-ack","continue-s2","spin-mark-s2","terminal-close"];
const PROJECT="demo-cms-browser-journey";
const PHONE_MODE=process.env.FIJ_PHONE||"alt";
const FAULT=process.env.FIJ_FAULT||"";

// ---------------------------------------------------------------------------------------------------------------------------
// Orchestrator: several faults, each in its own process and emulators.
// ---------------------------------------------------------------------------------------------------------------------------
if(!process.env.FIRESTORE_EMULATOR_HOST&&!FAULT){
  const faults=(process.env.FIJ_FAULTS||DEFAULT_JOBS.join(",")).split(",").filter(Boolean);
  const phones=(process.env.FIJ_PHONES||PHONE_MODE).split(",");
  const jobs=[];for(const fault of faults)for(const phone of phones)jobs.push({fault,phone});
  const parallel=Math.max(1,Number(process.env.FIJ_PARALLEL||2));
  const base=Number(process.env.FIJ_PORT_BASE||19610),appBase=Number(process.env.FIJ_APP_PORT||14711);
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const free=[...Array(parallel).keys()];const results=[];let next=0,running=0;
  const runJob=(job,slot)=>new Promise(resolve=>{
    const log=fs.createWriteStream(path.join(OUT_DIR,`fij-${job.fault}-${job.phone}.log`));
    const child=spawn(process.execPath,[__filename],{cwd:ROOT,env:{...process.env,FIJ_FAULT:job.fault,FIJ_PHONE:job.phone,FIJ_PORT_BASE:String(base+slot*10),FIJ_APP_PORT:String(appBase+slot)},stdio:["ignore","pipe","pipe"]});
    child.stdout.on("data",d=>{log.write(d);for(const line of String(d).split("\n"))if(/^(FAIL|PROBLEM|POINT|RESULT)/.test(line))console.log(`[${job.fault}/${job.phone}] ${line}`);});
    child.stderr.on("data",d=>log.write(d));
    child.on("exit",code=>{log.end();resolve({...job,code});});
  });
  (async()=>{
    await new Promise(done=>{
      const pump=()=>{
        if(next>=jobs.length&&running===0)return done();
        while(running<parallel&&next<jobs.length&&free.length){const job=jobs[next++],slot=free.shift();running+=1;runJob(job,slot).then(r=>{results.push(r);free.push(slot);running-=1;pump();});}
      };pump();
    });
    const matrix={};
    for(const r of results){
      const file=path.join(OUT_DIR,`fij-${r.fault}-${r.phone}.json`);let rep=null;try{rep=JSON.parse(fs.readFileSync(file,"utf8"));}catch(_e){}
      matrix[`${r.fault}/${r.phone}`]={exit:r.code,verdict:rep?.verdict||"NO REPORT",points:rep?.points||[],end:rep?.endChecks||[],fatal:rep?.fatal||null,reads:rep?.readsTotal??null};
    }
    fs.writeFileSync(path.join(OUT_DIR,"fij-matrix.json"),JSON.stringify(matrix,null,2));
    const head=`| fault | ${POINTS.join(" | ")} | end |`;
    console.log(`\nFAULT x WRITE POINT (phone in brackets)\n${head}\n|${"---|".repeat(POINTS.length+2)}`);
    for(const [key,v] of Object.entries(matrix)){
      const cell=p=>{const x=v.points.find(q=>q.point===p);return x?`${x.pass?"PASS":"FAIL"} (${x.phone[0].toUpperCase()})`:"-";};
      console.log(`| ${key} | ${POINTS.map(cell).join(" | ")} | ${v.verdict==="PASS"?"PASS":v.end.filter(e=>!e.pass).length?"FAIL":v.verdict} |`);
    }
    // Reads: a fault run may not cost more than 2.5 x the fault-free run (the same phone order), point by point and in total.
    for(const [key,v] of Object.entries(matrix)){
      const base=matrix[`none/${key.split("/")[1]}`];if(!base||key.startsWith("none/"))continue;
      v.readsVsBaseline={total:v.reads,baseline:base.reads};
      if(base.reads&&v.reads>2.5*base.reads+100){v.verdict="FAIL";v.end.push({id:"reads.vsBaseline",pass:false,detail:`${v.reads} reads vs ${base.reads} without faults`});}
      for(const p of v.points){const b=base.points.find(q=>q.point===p.point);if(b&&p.readsPoint>3*b.readsPoint+60){p.pass=false;p.checks.push({id:"reads.vsBaseline",pass:false,detail:`${p.readsPoint} reads at this point vs ${b.readsPoint} without faults`});v.verdict="FAIL";}}
    }
    fs.writeFileSync(path.join(OUT_DIR,"fij-matrix.json"),JSON.stringify(matrix,null,2));
    const bad=Object.values(matrix).filter(v=>v.verdict!=="PASS");
    console.log(`\n${bad.length?"FAIL":"PASS"} fault-injection journey: ${Object.keys(matrix).length-bad.length}/${Object.keys(matrix).length} runs pass -> test-results/fij-matrix.json`);
    process.exit(bad.length?1:0);
  })();
  return;
}

const PORT_BASE=Number(process.env.FIJ_PORT_BASE||19610);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const TAG=process.env.FIJ_TAG||`fij-${FAULT}-${PHONE_MODE}`;
const REPORT_PATH=path.join(OUT_DIR,`${TAG}.json`);
const SHOT_DIR=path.join(OUT_DIR,TAG);
if(![...ALL_FAULTS,"none"].includes(FAULT)){console.error(`FIJ_FAULT must be one of ${ALL_FAULTS.join(", ")}, none (got ${FAULT})`);process.exit(2);}

// One fault: start this run's own emulators and run this file inside them.
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
const {installFirestoreMeter,createMeter}=require("./support/firestore-meter.cjs");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const rosterRoulette=require("./support/roster-roulette.cjs");
const gazette=require("./support/touchline-gazette.cjs");

const APP_PORT=Number(process.env.FIJ_APP_PORT||14711);
const BASE=(process.env.CMS_BASE_URL||`http://127.0.0.1:${APP_PORT}/`).replace(/\/?$/,"/");
const FIRESTORE=`http://127.0.0.1:${PORTS.firestore}`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const DEBUG=process.env.FIJ_DEBUG==="1";
const deadTaps=[];// dead buttons seen (tapped five times with nothing happening), reported with the run
const READS_PER_MIN=Number(process.env.FIJ_READS_PER_MIN||150);
const BASELINE_READS=Number(process.env.FIJ_BASELINE_READS||1200);
const STUCK_MS=Number(process.env.FIJ_STUCK_MS||90000);
const NAMES={daniel:"Daniel",nik:"Nik"},ROLE={daniel:"playerOne",nik:"playerTwo"};
const VIEWPORTS={daniel:{width:393,height:660},nik:{width:390,height:844}};
const NETWORK_S=[5,30,8,12,20,6,15,10,25,7,9,18,11];// seconds offline per point (5-30 s)
const LOCK_S=[8,20,12,15,9,18,10,14,11,16,8,13];
const meter=createMeter();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const norm=s=>String(s||"").replace(/\s+/g," ").trim();

const report={tool:"FIJ",fault:FAULT,phone:PHONE_MODE,startedAt:new Date().toISOString(),verdict:"RUNNING",points:[],endChecks:[],problems:[],roulette:{},readsTotal:0,fatal:null,notes:[]};
const t0=Date.now();
let seasonNow=0,pointNow="boot";
function writeReport(){report.finishedAt=new Date().toISOString();report.deadTaps=deadTaps;report.totalMs=Date.now()-t0;fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(REPORT_PATH,JSON.stringify(report,null,2));}
async function shot(m,name,page=m.page){try{fs.mkdirSync(SHOT_DIR,{recursive:true});const file=path.join(SHOT_DIR,`${name}-${m.user}.png`.replace(/[^\w.\-]+/g,"_"));await page.screenshot({path:file,timeout:10000});return path.relative(ROOT,file);}catch(e){return `(no screenshot: ${String(e.message).split("\n")[0]})`;}}
async function problem(m,id,text,page){const s=m?await shot(m,`${pointNow}-${id}`,page||m.page):null;report.problems.push({point:pointNow,season:seasonNow,phone:m?m.user:"both",id,text:String(text).slice(0,1500),screenshot:s});console.log(`PROBLEM ${pointNow} ${id} [${m?m.user:"both"}]: ${String(text).slice(0,500)}`);}
const log=(...a)=>{if(DEBUG)console.log(...a);};

// ---------------------------------------------------------------------------------------------------------------------------
// Scoring (the game's rules; as CE2PG)
// ---------------------------------------------------------------------------------------------------------------------------
function scoreSeason(r){const cl=r.championsLeague?5:0,title=r.leaguePosition===1?3:0,cup=r.domesticCup?1:0,perf=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,indiv=(r.topScorer||r.topAssist)?1:0;return cl+title+cup+perf+indiv;}
const PLAN=[
  {daniel:{leaguePosition:1,leaguePoints:88,leagueGoals:79,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false},nik:{leaguePosition:3,leaguePoints:71,leagueGoals:64,domesticCup:false,championsLeague:true,topScorer:false,topAssist:false}},
  {daniel:{leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:true},nik:{leaguePosition:1,leaguePoints:91,leagueGoals:102,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false}}
,
  {daniel:{leaguePosition:2,leaguePoints:70,leagueGoals:60,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false},nik:{leaguePosition:3,leaguePoints:65,leagueGoals:55,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}}
];// season 1: Daniel 5 (3+1+1) v Nik 5 (5): a draw; season 2: Daniel 1 v Nik 6 (3+1+1+1); season 3: Daniel 0 v Nik 1. Totals Daniel 6, Nik 12.

// ---------------------------------------------------------------------------------------------------------------------------
// Emulator admin reads (never the app's reads) and Rules
// ---------------------------------------------------------------------------------------------------------------------------
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
async function adminList(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});if(r.status!==200)return [];const j=await r.json();return j.documents||[];}
const F=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields?.[k]:v.fields?v.fields[k]:undefined),doc);
const plain=v=>{if(!v)return v;if("stringValue"in v)return v.stringValue;if("integerValue"in v)return Number(v.integerValue);if("booleanValue"in v)return v.booleanValue;if("nullValue"in v)return null;if("arrayValue"in v)return (v.arrayValue.values||[]).map(plain);if("mapValue"in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,plain(x)]));if("timestampValue"in v)return v.timestampValue;if("doubleValue"in v)return v.doubleValue;return v;};
const docData=doc=>doc?Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,plain(v)])):null;
async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(docUrl("rivalries/probe"));
  if(put.status!==200||after.status!==403)throw new Error(`composed production Rules did not activate (PUT ${put.status}, open read ${after.status})`);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Phones and tabs
// ---------------------------------------------------------------------------------------------------------------------------
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;
function wirePage(m,page){
  page.on("pageerror",error=>{m.log.pageErrors.push(`${pointNow}: ${error.message.slice(0,300)}`);});
  page.on("console",msg=>{if(msg.type()==="error"&&!/Failed to load resource|net::ERR_INTERNET_DISCONNECTED|ERR_NETWORK|Could not reach Cloud Firestore|WebChannelConnection|RESOURCE_EXHAUSTED|Quota|offline/i.test(msg.text()))m.log.consoleErrors.push(`${pointNow}: ${msg.text().slice(0,300)}`);});
  page.on("request",request=>{const h=new URL(request.url()).hostname;if(/(^|\.)(firestore|identitytoolkit|securetoken)\.googleapis\.com$/.test(h))m.log.forbidden.push(h);});
  page.on("dialog",d=>{void d.accept().catch(()=>{});});
}
async function newContext(browser,account){
  const context=await browser.newContext({viewport:VIEWPORTS[account]});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});});
  await installFirestoreMeter(context,{sdkDir:SDK_DIR,user:account,sink:meter.events,firestoreOrigin:FIRESTORE});
  await context.addInitScript({path:SWITCH});
  return context;
}
async function preparePage(m,page){wirePage(m,page);await installMarbleConfirmAnswers(page,{answer:true});}
async function waitLoaded(page,timeout=40000){await page.locator("#loadingScreen").waitFor({state:"hidden",timeout}).catch(()=>{});}
async function openManager(browser,account){
  const context=await newContext(browser,account);
  const m={user:account,account,context,page:null,extra:[],log:{pageErrors:[],consoleErrors:[],forbidden:[]},roulette:{}};
  m.page=await context.newPage();await preparePage(m,m.page);
  await m.page.goto(urlFor(account),{waitUntil:"domcontentloaded"});await waitLoaded(m.page);
  return m;
}
async function describe(m,page=m.page){
  return page.evaluate(()=>{
    const vis=el=>el&&!el.classList.contains("hidden")&&getComputedStyle(el).display!=="none"&&el.getClientRects().length>0;
    const screens=[...document.querySelectorAll(".screen")].filter(vis).map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay'],#rrStepPanel,#rrStage,#touchlineGazette,#showdownConfirm")].filter(vis).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,160)}`);
    const buttons=[...document.querySelectorAll("button")].filter(b=>vis(b)&&!b.disabled).map(b=>b.textContent.replace(/\s+/g," ").trim()).filter(Boolean).slice(0,14);
    let sd="";try{const c=typeof currentShowdown!=="undefined"?currentShowdown:null;if(c)sd=` | showdown=${JSON.stringify({id:String(c.id||"").slice(0,24),status:c.status,round:c.currentRound,total:c.totalRounds,rounds:Array.isArray(c.rounds)?c.rounds.length:null,completedAt:c.completedAt||null,shared:c.sharedJourney?.mode||null,rivalry:String(c.sharedJourney?.rivalryId||"").slice(0,14)})}`;}catch(_e){}
    let tc=sd;try{const t=window.CareerModeProductionSharedTerminalClose?.getState?.();if(t)tc+=` | terminalClose=${JSON.stringify({phase:t.phase,auto:t.automaticSaving,autoFailed:t.automaticCloseFailed,error:t.error||t.message||t.code||null}).slice(0,300)}`;}catch(_e){}
    try{const p=window.CareerModePersistentNikDanielPair?.getState?.();if(p)tc+=` | pair=${JSON.stringify({status:p.status,live:p.rivalryId?String(p.rivalryId).slice(5,13):null,conn:p.connectionState,closed:p.closedRivalryId?String(p.closedRivalryId).slice(5,13):null})}`;}catch(_){}
    return `screens=${screens} | season=${document.getElementById("seasonIndicator")?.textContent||""} | overlays=${overlays.join(" ## ")} | buttons=${buttons.join(" / ")}${tc}`;
  }).catch(e=>`(page unavailable: ${String(e.message).split("\n")[0]})`);
}
const visible=(page,sel)=>page.locator(sel).first().isVisible().catch(()=>false);
async function clickIf(page,locator){if(await locator.first().isVisible().catch(()=>false)&&await locator.first().isEnabled().catch(()=>false)){await locator.first().click({timeout:5000}).catch(()=>{});return true;}return false;}
const btn=(page,name)=>page.getByRole("button",{name,exact:typeof name==="string"});

// ---------------------------------------------------------------------------------------------------------------------------
// The player's path forward from wherever a fault left the phone. Returns what it tapped (or "" when nothing applied).
// ---------------------------------------------------------------------------------------------------------------------------
async function pathForward(m,page=m.page){
  if(await visible(page,"#loadingScreen"))return "loading";
  // A browser error page (cold start offline, reload while offline): the player pulls to refresh.
  const url=page.url();
  if(url.startsWith("chrome-error:")||await page.evaluate(()=>!document.getElementById("mainMenu")&&!document.getElementById("loadingScreen")).catch(()=>false)){
    await page.goto(urlFor(m.account),{waitUntil:"domcontentloaded",timeout:20000}).catch(()=>{});m.manualReloads=(m.manualReloads||0)+1;return "browser-reload";
  }
  if(await gazette.tapGazetteIfShown(page))return "gazette";
  for(const name of ["SIGN IN WITH GOOGLE",new RegExp(`^${NAMES[m.account]} · PLAYER`,"i"),"TRY AGAIN"]){if(await clickIf(page,page.locator("#onlinePlayerIdentityOverlay button,[id^='onlinePlayerIdentity'] button").filter({hasText:name})))return `identity:${name}`;}
  if(await visible(page,"#rrStage")||await visible(page,"#rrStepPanel")){return await rouletteStep(m,page)||"roulette-wait";}
  // The roulette is off this tab's screen: one seen again in this tab for a finished season after this is a replay (a panel a
  // second tab still shows from before the finish is not).
  for(const [season,r] of Object.entries(m.roulette))if(r.finished)(page.__fijGone||(page.__fijGone=new Set())).add(Number(season));
  const getReady=page.locator("#productionSharedJourneyEntryOverlay");
  if(await getReady.isVisible().catch(()=>false)){if(await clickIf(page,getReady.getByRole("button",{name:/^(START CAREER|CONTINUE CAREER|TRY AGAIN|RETRY)$/})))return "get-ready";return "";}
  if(await visible(page,"#mainMenu")){
    // A new tab (tab kill, cold start, second tab) is signed out: sign-in lives in sessionStorage.
    if(await clickIf(page,page.locator("button:visible").filter({hasText:/^\s*SIGN IN\s*$/})))return "home:sign-in";
    // The live Showdown: the START tile reads CONTINUE SHOWDOWN / JOIN (what a player taps); else the CAREER tile when it names
    // the live season.
    const start=page.locator("#newShowdown");
    const startLabel=norm(await start.locator(".menuTileLabel").textContent().catch(()=>""));
    if(/CONTINUE SHOWDOWN|JOIN DANIEL/.test(startLabel)){await start.click({timeout:5000}).catch(()=>{});return `home:${startLabel}`;}
    const tile=page.locator("#mainMenu button:visible,#mainMenu .menuTile:visible").filter({hasText:/Daniel vs Nik · Season \d+ of/}).first();
    if(await tile.count()){const label=norm(await tile.textContent().catch(()=>""));await tile.click({timeout:5000}).catch(()=>{});return `home:${label.slice(0,40)}`;}
    return "";
  }
  if(await visible(page,"#dashboard")){if(await clickIf(page,page.locator("#seasonPrimaryAction")))return "dashboard";}
  return "";
}
// Retry buttons a screen offers after a failed write or read (tapped only when neither the path forward nor the step applies).
async function retryTap(m,page=m.page){
  for(const name of [/^\s*TRY AGAIN\s*$/,/^\s*RETRY\s*$/,/^\s*RELOAD\s*$/])if(await clickIf(page,page.locator("button:visible").filter({hasText:name})))return `retry:${name}`;
  return "";
}
// The roulette on this phone, counted per season: a stage or panel seen after this season's roulette finished is a replay.
async function rouletteStep(m,page=m.page){
  const info=await page.evaluate(()=>{
    const head=document.querySelector("#rrStepPanel .remoteJoiningHeader")?.textContent||"";const mm=/SEASON (\d+)/.exec(head);
    let done=[];try{done=JSON.parse(localStorage.getItem("careerModeShowdown.rouletteDone.v1")||"[]");}catch(_e){}
    const s=window.CareerModeProductionSharedTransferChallenge?.getState?.();
    return {panelSeason:mm?Number(mm[1]):null,done,stateSeason:s?.seasonNumber||null,rivalryId:s?.rivalryId||null};
  }).catch(()=>({}));
  const season=info.panelSeason||seasonNow;
  const r=m.roulette[season]||(m.roulette[season]={steps:0,spins:0,finished:false,replays:0});
  if(r.finished&&page.__fijGone?.has(season)&&!r.replayCounted){r.replays+=1;r.replayCounted=true;await problem(m,"roulette.replay",`season ${season} roulette shows again after it finished: ${await describe(m,page)}`);}
  const step=await rosterRoulette.playRoulette(page);
  if(step&&step!=="wait"){r.steps+=1;if(step==="spin")r.spins+=1;}
  return step||"";
}
function markRouletteFinished(m,season,tapped=false){const r=m.roulette[season]||(m.roulette[season]={steps:0,spins:0,finished:false,replays:0});if(tapped)r.steps+=1;r.finished=true;r.replayCounted=false;}

// Drive one phone (page) until goal() is true, tapping the path forward and the step's own buttons (stepTaps). Stuck = nothing to
// tap and no goal for STUCK_MS.
async function drive(m,goal,{page=null,stepTaps=null,firstTaps=null,timeout=180000,label=""}={}){
  const p=()=>page||m.page;
  const until=Date.now()+timeout;let idleSince=Date.now(),lastDesc="",lastDid="",repeats=0;
  for(;;){
    if(await goal(p()).catch(()=>false))return true;
    let did=firstTaps?await firstTaps(p()).catch(()=>"")||"":"";
    if(!did)did=await pathForward(m,p()).catch(()=>"");
    if(!did&&stepTaps)did=await stepTaps(p()).catch(()=>"")||"";
    if(!did)did=await retryTap(m,p()).catch(()=>"");
    // A tap that changes nothing (a dead button) is not progress: after five in a row a player gives up on it and goes Home.
    if(did&&did===lastDid&&!["loading","roulette-wait"].includes(did)){repeats+=1;if(repeats>=5){const home=p().locator("button:visible").filter({hasText:/^\s*(BACK TO HOME|BACK TO SHOWDOWN HOME|HOME)\s*$/}).first();if(await clickIf(p(),home)){deadTaps.push(`${pointNow}: ${m.user} ${did} x${repeats}`);{const note=`${pointNow}: ${m.user} tapped ${did} ${repeats} times with nothing happening (dead button), then went Home`;if(!report.notes.includes(note))report.notes.push(note);}log(`  ${m.user} ${label}: ${did} did nothing ${repeats} times -> BACK TO HOME`);did="home-after-dead-tap";}repeats=0;}}else repeats=0;
    lastDid=did;
    if(did&&did!=="loading"&&did!=="roulette-wait"){idleSince=Date.now();log(`  ${m.user} ${label}: ${did}`);if(DEBUG){const d=await describe(m,p());if(d!==lastDesc){lastDesc=d;log(`    ${d.slice(0,600)}`);}}}
    const now=Date.now();
    if(now-idleSince>STUCK_MS||now>until){
      lastDesc=await describe(m,p());
      throw Object.assign(new Error(`${m.user} stuck on the way to ${label} (${now-idleSince>STUCK_MS?"no path out":"timeout"}): ${lastDesc}`),{stuck:true,page:p()});
    }
    await sleep(600);
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Faults
// ---------------------------------------------------------------------------------------------------------------------------
let pointIndex=0;
function faultPhone(ctx){
  if(PHONE_MODE==="daniel"||PHONE_MODE==="nik")return ctx[PHONE_MODE];
  const first=PHONE_MODE==="alt-nik"?"nik":"daniel",second=first==="daniel"?"nik":"daniel";
  return ctx[pointIndex%2===0?first:second];
}
async function setHidden(page,hidden){
  await page.evaluate(h=>{
    if(!window.__fijVis){window.__fijVis="visible";Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>window.__fijVis});Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.__fijVis==="hidden"});}
    window.__fijVis=h?"hidden":"visible";document.dispatchEvent(new Event("visibilitychange"));
    if(h)window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));else window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}));
  },hidden).catch(()=>{});
}
async function reopenTab(m,{offline=false}={}){
  try{await m.page.close({runBeforeUnload:false});}catch(_e){}
  if(offline)await m.context.setOffline(true);
  m.page=await m.context.newPage();await preparePage(m,m.page);
  await m.page.goto(urlFor(m.account),{waitUntil:"domcontentloaded",timeout:20000}).catch(()=>{});
}
let quotaHandler=null;
async function quotaOn(m){
  quotaHandler=route=>{
    const u=route.request().url();
    if(/\/Firestore\/(Listen|Write)\/channel/.test(u))return route.abort("failed");
    return route.fulfill({status:429,contentType:"application/json",body:JSON.stringify({error:{code:429,message:"Quota exceeded.",status:"RESOURCE_EXHAUSTED"}})});
  };
  await m.context.route(new RegExp(`^${FIRESTORE.replace(/[.:/]/g,"\\$&")}/`),quotaHandler);
}
async function quotaOff(m){if(quotaHandler)await m.context.unroute(new RegExp(`^${FIRESTORE.replace(/[.:/]/g,"\\$&")}/`),quotaHandler).catch(()=>{});quotaHandler=null;}
// The fault on phone X. tap(page) is the write tapped on X (null when the other phone writes, then `other` runs during the fault).
const ONLY=(process.env.FIJ_ONLY||"").split(",").filter(Boolean);
async function inject(ctx,X,tap,other,rec){
  const i=pointIndex;
  if(ONLY.length&&!ONLY.includes(rec.point)){rec.detail="(no fault here: FIJ_ONLY)";if(tap)await tap(X.page);if(other)await other();return;}
  // A tap the fault blocks (an overlay over the button, a dead page) is what the player sees too: it is recorded, and the
  // settle step taps again once the path forward is back.
  const runTap=async page=>{if(!tap)return;try{await tap(page);}catch(e){rec.tapBlocked=String(e.message).split("\n")[0].slice(0,160);}
    // FIJ_AFTER_LAND=1: the fault waits until the write is in the database (the page has not moved on yet).
    if(process.env.FIJ_AFTER_LAND==="1"&&rec.landed){const until=Date.now()+15000;while(Date.now()<until&&!(await rec.landed().catch(()=>false)))await sleep(100);rec.detail+=" (after the write landed)";}};
  const runOther=async()=>{if(other)await other();};
  switch(FAULT){
    case "none":await runTap(X.page);await runOther();break;
    case "network":{
      const s=NETWORK_S[i%NETWORK_S.length];rec.detail=`offline ${s}s`;
      // The tap first, then the network drops at once: the write is in flight (it may or may not reach the server).
      await runTap(X.page);await runOther();await X.context.setOffline(true);await sleep(s*1000);await X.context.setOffline(false);break;
    }
    case "lock":{
      const s=LOCK_S[i%LOCK_S.length];rec.detail=`locked ${s}s`;
      await runTap(X.page);await setHidden(X.page,true);
      let cdp=null;try{cdp=await X.context.newCDPSession(X.page);await cdp.send("Page.setWebLifecycleState",{state:"frozen"});}catch(e){rec.detail+=` (freeze unavailable: ${String(e.message).split("\n")[0]})`;}
      await runOther();await sleep(s*1000);
      try{if(cdp){await cdp.send("Page.setWebLifecycleState",{state:"active"});await cdp.detach();}}catch(_e){}
      await setHidden(X.page,false);break;
    }
    case "evict":rec.detail="hidden, then reloaded";await runTap(X.page);await setHidden(X.page,true);await runOther();await sleep(4000);await X.page.reload({waitUntil:"domcontentloaded"}).catch(()=>{});break;
    case "reload":rec.detail="reload right after the tap";await runTap(X.page);await X.page.reload({waitUntil:"domcontentloaded"}).catch(()=>{});await runOther();break;
    case "tabkill":rec.detail="tab closed, app reopened";await runTap(X.page);await runOther();await reopenTab(X);break;
    case "coldoffline":{
      const s=NETWORK_S[i%NETWORK_S.length];rec.detail=`tab closed, cold start offline ${s}s`;
      await runTap(X.page);await runOther();await reopenTab(X,{offline:true});await sleep(s*1000);await X.context.setOffline(false);break;
    }
    case "twotabs":{
      // The app opened again in a second tab on the same phone (same localStorage; a new tab signs in again). A window.open
      // tab never finished SIGN IN WITH GOOGLE in this harness (see the report), so the second tab is a plain new tab.
      const second=await X.context.newPage();await preparePage(X,second);
      await second.goto(urlFor(X.account),{waitUntil:"domcontentloaded",timeout:20000}).catch(()=>{});await waitLoaded(second);
      X.extra.push(second);
      const writeIn=i%2===0?second:X.page;rec.detail=`second tab open; the write tapped in the ${writeIn===second?"second":"first"} tab`;
      // The tab that writes gets back into the game first (a new tab opens on Showdown Home).
      if(tap)await drive(X,tap.ready||(async()=>true),{page:writeIn,timeout:120000,label:`${rec.point} (tab ready)`});
      await runTap(writeIn);await runOther();
      break;
    }
    case "quota":{
      rec.detail="RESOURCE_EXHAUSTED on reads and writes, then the next day (clock +11 min)";
      // The SDK retries a refused transaction a few times with back-off before it gives up with resource-exhausted, so the
      // limit stays on long enough for the app's own pause to trip (html[data-firestore-quota=paused]).
      await quotaOn(X);await runTap(X.page);await runOther();
      const quotaUntil=Date.now()+Number(process.env.FIJ_QUOTA_MS||30000);
      while(Date.now()<quotaUntil&&!rec.pausedShown){rec.pausedShown=await X.page.evaluate(()=>document.documentElement.dataset.firestoreQuota==="paused").catch(()=>false);if(!rec.pausedShown)await sleep(1000);}
      if(rec.pausedShown)await sleep(3000);
      await quotaOff(X);
      // The next day. Once per run (season-results) the page stays open overnight: the clock jumps 11 minutes, so the app's own
      // 10-minute pause ends by itself. Everywhere else the phone evicted the page overnight and the player opens the app again
      // (a reload; the pause lives in page memory). Only one jump per run: the emulator's clock cannot jump with it, and an
      // hour of skew would expire the Auth token on the phone only (a harness artefact, not the game).
      if(rec.point==="season-results"){
        rec.detail=rec.detail.replace("then the next day","then the next day with the page kept open");
        try{if(!X.clockInstalled){await X.context.clock.install();X.clockInstalled=true;}await X.context.clock.fastForward("11:00");}catch(e){rec.detail+=` (clock: ${String(e.message).split("\n")[0]})`;}
      }else{rec.detail=rec.detail.replace("then the next day (clock +11 min)","then the next day (the app opened again)");await X.page.reload({waitUntil:"domcontentloaded"}).catch(()=>{});}
      break;
    }
  }
}
async function closeExtraTabs(X){for(const p of X.extra.splice(0))await p.close({runBeforeUnload:false}).catch(()=>{});}

// ---------------------------------------------------------------------------------------------------------------------------
// Reads in a window after recovery
// ---------------------------------------------------------------------------------------------------------------------------
const readsOf=(events,user)=>events.filter(e=>e.k==="read"&&(!user||e.user===user)).reduce((a,e)=>a+(Number(e.n)||0),0);

// ---------------------------------------------------------------------------------------------------------------------------
// One write point: the fault around the write, the path forward on both phones, then the convergence checks.
// ---------------------------------------------------------------------------------------------------------------------------
async function writePoint(ctx,point,{writer,tap,ready,other=null,settle,checks,landed=null}){
  pointNow=point;
  const X=faultPhone(ctx),rec={point,phone:X.user,writer:writer?writer.user:"auto",fault:FAULT,pass:false,checks:[],detail:""};
  Object.defineProperty(rec,"landed",{value:landed,enumerable:false});
  console.log(`POINT ${point}: ${FAULT} on ${X.user}${writer?` (writer ${writer.user})`:""}`);
  const startIdx=meter.events.length,started=Date.now();
  const check=async(m,id,ok,detail,page)=>{rec.checks.push({id,phone:m?m.user:"both",pass:Boolean(ok),detail:ok?undefined:String(detail).slice(0,800)});if(!ok)await problem(m,id,detail,page);return Boolean(ok);};
  try{
    // The writer reaches the write's screen first (both phones are already there in the normal flow).
    if(writer&&ready)await drive(writer,ready,{timeout:120000,label:`${point} (ready)`});
    const tapFn=writer?Object.assign(page=>tap(page),{ready}):null;
    if(writer&&writer!==X){
      // The fault hits the phone that does not write, while the other one writes.
      await inject(ctx,X,null,async()=>{try{await tap(writer.page);}catch(e){rec.tapBlocked=String(e.message).split("\n")[0].slice(0,160);}},rec);
    }else if(writer){await inject(ctx,X,tapFn,other,rec);}
    else{await inject(ctx,X,null,other,rec);}
    if(FAULT==="twotabs"){for(const p of X.extra)await settle(X,p).catch(async e=>{await check(X,"twotabs.second",false,`second tab: ${e.message}`,p);});}
    // Both phones take their path forward and settle on the step's next state (re-tapping the write if it never landed).
    const recoveredAt=Date.now();
    await Promise.all([ctx.daniel,ctx.nik].map(m=>settle(m,m.page).catch(async e=>{await check(m,e.stuck?"stuck":"settle",false,e.message,e.page);})));
    rec.recoverMs=Date.now()-recoveredAt;
    if(FAULT==="twotabs"){
      // Both tabs converge: a tab that has not drawn the newest step yet gets up to 30 s, like a player glancing back at it.
      for(const p of X.extra){let a,b;const until=Date.now()+30000;do{a=await stepState(X,X.page);b=await stepState(X,p);if(sameShowdownState(a,b))break;await sleep(1000);}while(Date.now()<until);await check(X,"twotabs.same",sameShowdownState(a,b),`tab 1 ${JSON.stringify(a)} vs tab 2 ${JSON.stringify(b)}`,p);}
      await closeExtraTabs(X);
    }
    if(checks)await checks(check,X);
    // Reads: the 60 s after recovery on the faulted phone (both phones idle on the step's next screen).
    // Steady state: 10 s for the catch-up reads after recovery, then the window.
    await sleep(Number(process.env.FIJ_READ_SETTLE_MS||10000));
    const from=meter.events.length;await sleep(Number(process.env.FIJ_READ_WINDOW_MS||20000));
    const win=meter.events.slice(from),perMin=readsOf(win,X.account)/(Number(process.env.FIJ_READ_WINDOW_MS||20000)/60000);
    rec.readsAfter=Math.round(perMin);rec.readsPoint=readsOf(meter.events.slice(startIdx));
    await check(X,"reads",perMin<=READS_PER_MIN,`${Math.round(perMin)} document reads/min on ${X.user} after recovery (limit ${READS_PER_MIN})`);
  }catch(error){await check(X,error.stuck?"stuck":"fatal",false,error.message);}
  rec.ms=Date.now()-started;rec.pass=rec.checks.length>0&&rec.checks.every(c=>c.pass);
  report.points.push(rec);writeReport();
  console.log(`RESULT ${point}: ${rec.pass?"PASS":"FAIL"} (${FAULT} on ${X.user}${rec.detail?`, ${rec.detail}`:""}${rec.tapBlocked?", tap blocked":""}; recovered in ${Math.round((rec.recoverMs||0)/1000)} s, ${rec.readsPoint??"?"} reads, ${rec.readsAfter??"?"}/min after)`);
  pointIndex+=1;
  if(!rec.pass&&rec.checks.some(c=>!c.pass&&(c.id==="stuck"||c.id==="fatal"||c.id==="settle")))throw new Error(`journey cannot continue after ${point}`);
  return rec;
}
// Two tabs show the same Showdown state when they agree, or when one holds season N acknowledged (its CONTINUE screen) and the
// other already opened season N+1 (a tab opened after the acknowledgement resumes there).
function sameShowdownState(a,b){
  if(JSON.stringify(a)===JSON.stringify(b))return true;
  // After the terminal close both tabs agree the Showdown is over whether one sits on the Champion screen (Showdown Complete)
  // and the other on Home (No Active Showdown, its pair let go there).
  const over=s=>/^(Showdown Complete|No Active Showdown)$/.test(String(s?.season||"").trim());
  if(pointNow==="terminal-close"&&over(a)&&over(b))return true;
  const n=s=>Number((/Season (\d+)/.exec(s?.season||"")||[])[1]||0);
  const [lo,hi]=n(a)<=n(b)?[a,b]:[b,a];
  return n(hi)===n(lo)+1&&lo?.commit==="ACKNOWLEDGED"&&(hi?.transfer===null||hi?.transfer==="NOT_STARTED");
}
async function stepState(m,page){
  return page.evaluate(()=>{
    const t=window.CareerModeProductionSharedTransferChallenge?.getState?.(),c=window.CareerModeProductionSharedSeasonCommit?.getState?.();
    return {season:document.getElementById("seasonIndicator")?.textContent||"",transfer:t?.state?.phase||null,commit:c?.phase||null};
  }).catch(()=>null);
}

// ---------------------------------------------------------------------------------------------------------------------------
// The journey
// ---------------------------------------------------------------------------------------------------------------------------
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await btn(m.page,"SIGN IN WITH GOOGLE").click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
  await backHome(m);
}
async function backHome(m){
  const until=Date.now()+20000;
  while(Date.now()<until){
    if(await visible(m.page,"#mainMenu"))return true;
    if(await gazette.tapGazetteIfShown(m.page)){await sleep(500);continue;}
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){const b=m.page.locator("button:visible").filter({hasText:label}).first();if(await b.count()){await b.click({timeout:5000}).catch(()=>{});break;}}
    await sleep(500);
  }
  return false;
}
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
async function startAndJoin(daniel,nik,length){
  await backHome(daniel);
  await daniel.page.locator("#newShowdown").click({timeout:30000});
  await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  await daniel.page.locator("#roundAmount").selectOption(String(length));
  await daniel.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(daniel).locator("code").waitFor({timeout:30000});
  const code=(await pairPanel(daniel).locator("code").innerText()).trim();
  await backHome(nik);
  await nik.page.locator("#newShowdown").click();
  await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
  await sleep(500);
  await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code);
  await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
  const rivalryId=code.replace(/^CMS17R?-/,"");
  for(const m of [daniel,nik])await m.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active"&&s.rivalryId===id);},rivalryId,{timeout:45000});
  return rivalryId;
}
async function fillCombo(page,id,value){await page.locator(`#${id}`).fill(value);await page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});}
const tcState=page=>page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()||null).catch(()=>null);
const onTransfer=async page=>await visible(page,"#transferChallenge")&&!(await page.locator("#rrStage, #rrStepPanel").count());
const transferPhase=page=>page.evaluate(()=>document.getElementById("transferChallenge")?.dataset.transferPhase||"").catch(()=>"");
const seasonIs=(page,k,total)=>page.evaluate(v=>document.getElementById("seasonIndicator")?.textContent===v,`Season ${k} / ${total}`).catch(()=>false);

async function main(){
  fs.rmSync(SHOT_DIR,{recursive:true,force:true});
  await loadComposedRules();
  let server=null;
  if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});await sleep(800);}
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const ctx={};let rivalryId=null;const TOTAL=3;// the game offers 1, 3, 5 or 10 seasons
  try{
    ctx.daniel=await openManager(browser,"daniel");ctx.nik=await openManager(browser,"nik");
    const {daniel,nik}=ctx;const both=[daniel,nik];
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    rivalryId=await startAndJoin(daniel,nik,TOTAL);report.rivalryId=rivalryId;ctx.rivalryId=rivalryId;
    const R=p=>`rivalries/${rivalryId}/${p}`;
    // League wheel and club pack (Daniel), no fault.
    for(const m of both)await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    for(const m of both)await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:120000});
    await daniel.page.locator("#openClubPack").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
    const clubs=await daniel.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
    report.clubs=clubs;
    for(const m of both)await m.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).waitFor({state:"visible",timeout:45000});
    const careerOverlay=page=>visible(page,"#productionSharedCareerStartOverlay");
    const confirmTap=page=>clickIf(page,page.getByRole("button",{name:"CONFIRM SHOWDOWN"}));
    seasonNow=1;
    // --- setup-confirm: Daniel confirms (no fault), then the fault phone's confirm completes the setup (revision 6).
    {
      const X=faultPhone(ctx),first=X===daniel?nik:daniel;
      await confirmTap(first.page);await sleep(1500);
      await writePoint(ctx,"setup-confirm",{writer:X,ready:page=>page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).first().isVisible(),tap:page=>page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).first().click({timeout:10000}),
        settle:(m,page)=>drive(m,careerOverlay,{page,label:"Career Start",stepTaps:p=>confirmTap(p).then(x=>x?"confirm":"")}),
        checks:async(check)=>{const s=docData(await admin(R("sharedSetup/authoritative")));await check(null,"db.setup",s&&s.phase==="SHOWDOWN_CONFIRMED"&&s.revision===6,`sharedSetup ${JSON.stringify(s&&{phase:s.phase,revision:s.revision})}`);}});
    }
    // --- career-start: the other phone taps I STARTED AT first, then the fault phone (the completing write).
    const startBtn=(page,m)=>page.getByRole("button",{name:`I STARTED AT ${clubs[m===daniel?0:1].toUpperCase()}`,exact:true});
    const careerDone=async()=>{const c=docData(await admin(R("careerStart/authoritative")));return c;};
    {
      const X=faultPhone(ctx),first=X===daniel?nik:daniel;
      await drive(first,p=>startBtn(p,first).isVisible(),{label:"I STARTED AT"});await startBtn(first.page,first).click({timeout:10000});await sleep(1500);
      // After Career Start each phone plays this season's roulette; the settle stops at the roulette (spin-mark is the next point).
      const atRoulette=async page=>await visible(page,"#rrStage")||await visible(page,"#rrStepPanel")||await onTransfer(page);
      await writePoint(ctx,"career-start",{writer:X,ready:p=>startBtn(p,X).isVisible(),tap:p=>startBtn(p,X).click({timeout:10000}),
        settle:async(m,page)=>{
          // pathForward plays the roulette, so this settle only waits for Career Start to be gone from the screen.
          const until=Date.now()+STUCK_MS;
          for(;;){
            if(await atRoulette(page))return true;// the roulette panel opens over Career Start
            await pathForwardNoRoulette(m,page);
            if(await clickIf(page,startBtn(page,m)))log(`  ${m.user} re-tapped I STARTED AT`);
            if(Date.now()>until)throw Object.assign(new Error(`${m.user} stuck after Career Start: ${await describe(m,page)}`),{stuck:true});
            await sleep(600);
          }
        },
        checks:async(check)=>{const c=await careerDone();await check(null,"db.careerStart",c&&c.revision===2,`careerStart ${JSON.stringify(c&&{revision:c.revision,phase:c.phase})}`);}});
    }
    // --- spin-mark (season 1): the other phone plays its roulette first; the fault phone's last roulette tap writes its mark.
    const spinMarkPoint=async(point,season)=>{
      const X=faultPhone(ctx),first=X===daniel?nik:daniel;
      await playRouletteToEnd(first,season);
      await writePoint(ctx,point,{writer:X,ready:async page=>await rouletteFinalTapReady(page),tap:async page=>{await page.locator("#rrStepPanel .rrStepPrimary").click({timeout:10000});markRouletteFinished(X,season,true);},
        settle:(m,page)=>drive(m,async p=>await onTransfer(p)&&await spunBoth(p),{page,label:`season ${season} transfer window with both marks`}),
        checks:async(check)=>{
          const t=docData(await admin(R(`transferChallenges/season_${season}`)));
          await check(null,"db.spinMarks",Boolean(t),`transferChallenges/season_${season} ${JSON.stringify(t).slice(0,300)}`);
          for(const m of both){const r=m.roulette[season]||{};await check(m,"roulette.once",r.steps>0&&!r.replays,`season ${season} roulette on ${m.user}: ${JSON.stringify(r)}`);}
          const start=await daniel.page.evaluate(()=>{const b=document.getElementById("startTransferTimer");return b?{text:b.textContent,disabled:b.disabled,hidden:b.classList.contains("hidden")}:null;});
          await check(daniel,"start.enabled",start&&!start.disabled&&!start.hidden,`Daniel's START: ${JSON.stringify(start)}`);
        }});
    };
    await spinMarkPoint("spin-mark",1);
    await transfersWithFaults(ctx,R,1);
    await resultsWithFaults(ctx,R,1);
    await commitWithFaults(ctx,R,1,false);
    // --- continue-s2: both tap CONTINUE TO SEASON 2 (and the Gazette's CONTINUE); the fault phone's tap is faulted.
    {
      const X=faultPhone(ctx),first=X===daniel?nik:daniel;
      const contReady=p=>p.evaluate(()=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent==="CONTINUE TO SEASON 2").catch(()=>false);
      const atS2=async p=>await seasonIs(p,2,TOTAL)&&(await visible(p,"#rrStage")||await visible(p,"#rrStepPanel")||await onTransfer(p));
      await drive(first,async p=>await contReady(p)||await atS2(p),{label:"CONTINUE TO SEASON 2"});
      let paper="(resumed in season 2)";
      if(await contReady(first.page)){await first.page.locator("#sharedMultiSeasonContinueAction").click({timeout:10000});paper=await gazette.passGazette(first.page,"season").catch(()=>null);}
      seasonNow=2;
      await writePoint(ctx,"continue-s2",{writer:X,ready:async p=>await contReady(p)||await atS2(p),tap:async p=>{if(!(await contReady(p))){report.notes.push(`continue-s2: ${X.user} was already in season 2 (no CONTINUE to tap)`);return;}await p.locator("#sharedMultiSeasonContinueAction").click({timeout:10000});await gazette.passGazette(p,"season").catch(()=>null);},
        settle:(m,page)=>drive(m,atS2,{page,label:"season 2",stepTaps:async p=>{if(await contReady(p)){await p.locator("#sharedMultiSeasonContinueAction").click({timeout:5000});return "continue";}return "";}}).then(()=>true),
        checks:async(check)=>{
          for(const m of both){const seen=await gazette.gazetteSeen(m.page);await check(m,"gazette.notTwice",seen.filter(k=>/\|season\|1$/.test(k)).length<=1,`season-1 Gazette papers on ${m.user}: ${JSON.stringify(seen)}`);}
          await check(null,"first.paper",Boolean(paper),"the first phone saw no season-1 Gazette");
          const c=docData(await admin(R("seasonCommits/season_1")));await check(null,"db.commit1",c&&c.phase==="ACKNOWLEDGED"&&c.revision===3,`season_1 commit ${JSON.stringify(c&&{phase:c.phase,revision:c.revision})}`);
        }});
    }
    await spinMarkPoint("spin-mark-s2",2);
    // Seasons 2 and 3 play without faults until season 3's acknowledgement, which is the terminal-close point.
    await plainTransfers(ctx,2);await plainResults(ctx,R,2);await plainCommit(ctx,2);
    seasonNow=3;await plainContinue(ctx,3,TOTAL);
    await plainTransfers(ctx,3);await plainResults(ctx,R,3);
    await commitWithFaults(ctx,R,3,true);
    // --- end checks
    pointNow="end";
    const endCheck=(id,ok,detail)=>{report.endChecks.push({id,pass:Boolean(ok),detail:ok?undefined:String(detail).slice(0,1200)});console.log(`${ok?"ok  ":"FAIL"} end.${id}${ok?"":` -> ${String(detail).slice(0,400)}`}`);return ok;};
    const totals={daniel:PLAN.reduce((a,s)=>a+scoreSeason(s.daniel),0),nik:PLAN.reduce((a,s)=>a+scoreSeason(s.nik),0)};
    const rivalry=await admin(`rivalries/${rivalryId}`),term=plain(F(rivalry,"data","terminalClose"));
    endCheck("db.closed",plain(F(rivalry,"data","connectionState"))==="closed"&&term&&term.managerTotals?.playerOne===totals.daniel&&term.managerTotals?.playerTwo===totals.nik,`connectionState ${plain(F(rivalry,"data","connectionState"))}, terminalClose ${JSON.stringify(term)}, expected totals ${JSON.stringify(totals)}`);
    const results=await adminList(R("seasonResults")),commits=await adminList(R("seasonCommits"));
    endCheck("db.seasons",results.length===TOTAL&&commits.length===TOTAL,`seasonResults ${results.map(d=>d.name.split("/").pop())}, seasonCommits ${commits.map(d=>d.name.split("/").pop())}`);
    for(let k=1;k<=TOTAL;k+=1){
      const roles=await adminList(R(`seasonResults/season_${k}/roles`));
      endCheck(`db.season${k}.roles`,roles.length===2,`season_${k} roles ${roles.map(d=>d.name.split("/").pop())}`);
      const c=docData(await admin(R(`seasonCommits/season_${k}`)));endCheck(`db.season${k}.commit`,c&&c.phase==="ACKNOWLEDGED"&&c.revision===3,JSON.stringify(c&&{phase:c.phase,revision:c.revision}));
    }
    // F1 items 1 and 2: a page holding the Showdown CLOSED never sat on a Season 1 screen or a dashboard, and no button was dead.
    endCheck("closed.noSeasonOneScreens",!report.notes.some(n=>/held the Showdown CLOSED but was on/.test(n)),report.notes.filter(n=>/held the Showdown CLOSED/.test(n)).join(" | "));
    endCheck("noDeadButtons",!deadTaps.length,deadTaps.join(" | "));
    // F1 item 3: reloading a phone on the Champion screen after the close brings the Champion screen back (not Home).
    {const m=nik;await m.page.reload({waitUntil:"domcontentloaded"}).catch(()=>{});
      const shown=await m.page.waitForFunction(()=>{const f=document.getElementById("finalWinnerScreen");return Boolean(f&&getComputedStyle(f).visibility!=="hidden"&&f.getClientRects().length>0&&!f.classList.contains("hidden"));},null,{timeout:45000}).then(()=>true,()=>false);
      const why=shown?"":await m.page.evaluate(()=>{const p=window.CareerModePersistentNikDanielPair?.getState?.();return JSON.stringify({marker:localStorage.getItem("cms.championPending.v1"),live:sessionStorage.getItem("careerModeShowdown.liveGame.v1"),entry:Boolean(window.CareerModeProductionSharedJourneyEntry),letGo:window.careerModeTabResumeLetGo===true,pair:p&&{status:p.status,rid:p.rivalryId,closed:p.closedRivalryId,conn:p.connectionState},term:window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase||null,showdown:typeof currentShowdown!=="undefined"&&currentShowdown?{sj:currentShowdown.sharedJourney,save:currentShowdown.identity?.saveId}:null,lib:window.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.()?.activeSaveId||null,closedSave:p?.closedProviderSaveId||null,rivalry:(()=>{const r=window.CareerModeSparkConnectedRivalry?.getState?.();return r&&{attached:r.attached,rid:r.rivalryId,init:r.initialized,binding:r.binding};})()});}).catch(e=>String(e));
      endCheck("champion.reloadAfterClose",shown,`after a reload past the close ${m.user} is on ${await describe(m,m.page).catch(()=>"?")} ${why}`);}
    const screens=[];
    for(const m of both){
      const txt=await m.page.evaluate(()=>document.getElementById("finalWinnerScreen")?.innerText.replace(/\s+/g," ")||"").catch(()=>"");screens.push(txt);
      if(!txt&&await visible(m.page,"#mainMenu"))report.notes.push(`end: ${m.user} is on Showdown Home after the close (Final Winner not re-shown)`);
      else endCheck(`final.${m.user}`,txt.includes(String(totals.daniel))&&txt.includes(String(totals.nik))&&/NIK/i.test(txt),`Final Winner on ${m.user}: ${txt.slice(0,300)} (expected Nik ${totals.nik}, Daniel ${totals.daniel})`);
      for(const k of [1,2,3]){const r=m.roulette[k]||{};endCheck(`roulette.${m.user}.s${k}`,r.steps>0&&!r.replays,JSON.stringify(r));}
      endCheck(`errors.${m.user}`,m.log.pageErrors.length===0,JSON.stringify(m.log.pageErrors.slice(0,5)));
      endCheck(`production.${m.user}`,m.log.forbidden.length===0,JSON.stringify(m.log.forbidden.slice(0,3)));
      report.roulette[m.user]=m.roulette;report.consoleErrors=[...(report.consoleErrors||[]),...m.log.consoleErrors.slice(0,10)];
    }
    report.readsTotal=readsOf(meter.events);report.readsByPhone={daniel:readsOf(meter.events,"daniel"),nik:readsOf(meter.events,"nik")};
    endCheck("reads.total",FAULT==="none"||report.readsTotal<=BASELINE_READS*2.5,`${report.readsTotal} document reads in the run (fault-free run ~${BASELINE_READS}, limit x2.5)`);
  }catch(error){
    report.fatal={message:String(error&&error.message||error).slice(0,1500),point:pointNow,stack:String(error&&error.stack||"").split("\n").slice(0,6).join("\n")};
    for(const m of [ctx.daniel,ctx.nik].filter(Boolean))report.fatal[`state_${m.user}`]=await describe(m);
    console.log(`FAIL fatal at ${pointNow}: ${report.fatal.message}`);
    for(const m of [ctx.daniel,ctx.nik].filter(Boolean))await problem(m,"fatal",report.fatal[`state_${m.user}`]);
  }finally{
    report.readsTotal=report.readsTotal||readsOf(meter.events);
    const pass=!report.fatal&&report.points.length===POINTS.length&&report.points.every(p=>p.pass)&&report.endChecks.every(c=>c.pass);
    report.verdict=pass?"PASS":"FAIL";writeReport();
    await browser.close().catch(()=>{});if(server)server.kill();
    console.log(`${report.verdict} ${TAG}: ${report.points.filter(p=>p.pass).length}/${POINTS.length} points pass, ${report.endChecks.filter(c=>!c.pass).length} end check(s) failed, ${report.readsTotal} reads, ${Math.round((Date.now()-t0)/1000)} s -> ${path.relative(ROOT,REPORT_PATH)}`);
  }
  process.exitCode=report.verdict==="PASS"?0:1;

  // ----- step helpers that need ctx -----
  async function playRouletteToEnd(m,season){
    await drive(m,async p=>await rouletteFinalTapReady(p)||await onTransfer(p),{label:`season ${season} roulette`});
    if(await rouletteFinalTapReady(m.page)){await m.page.locator("#rrStepPanel .rrStepPrimary").click({timeout:10000});markRouletteFinished(m,season,true);}
    else markRouletteFinished(m,season);
  }
}
// The last roulette tap: the result panel's GO TO THE TRANSFER WINDOW (or I'VE RELEASED HIM when it is the last).
async function rouletteFinalTapReady(page){
  const b=page.locator("#rrStepPanel .rrStepPrimary");
  if(!(await b.isVisible().catch(()=>false)))return false;
  const t=norm(await b.textContent().catch(()=>""));
  return /TRANSFER WINDOW|RELEASED HIM/i.test(t);
}
async function spunBoth(page){const s=await tcState(page);return Boolean(s&&(s.state||Array.isArray(s.spunRoles)&&s.spunRoles.includes("playerOne")&&s.spunRoles.includes("playerTwo")));}
// pathForward without playing the roulette (the Career Start settle stops at the roulette).
async function pathForwardNoRoulette(m,page){if(await visible(page,"#rrStage")||await visible(page,"#rrStepPanel"))return "";return pathForward(m,page);}

async function transfersWithFaults(ctx,R,season){
  const {daniel,nik}=ctx;const both=[daniel,nik];
  // START and the early end (no fault).
  await drive(daniel,p=>p.evaluate(()=>{const b=document.getElementById("startTransferTimer");return Boolean(b&&!b.classList.contains("hidden")&&!b.disabled);}),{label:"START"});
  await daniel.page.locator("#startTransferTimer").click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="window",{label:"window"});
  await daniel.page.locator("#endTransferTimer").click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.locator("#endTransferTimer").click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="guess_entry",{label:"guesses"});
  const fillGuess=async(m,page)=>{if(m===daniel){await page.locator("#p2Guess1Type").selectOption("league");await fillCombo(page,"p2Guess1Value","Premier League");}else{await page.locator("#p1Guess1Type").selectOption("nationality");await fillCombo(page,"p1Guess1Value","Brazil");}};
  const lockBtn=(page,name)=>page.getByRole("button",{name,exact:true});
  const has=(s,key,role)=>Boolean(s?.state?.[key]?.includes(role));
  // tw-guess: the other phone locks first; the fault phone's lock moves the challenge to signings.
  {
    const X=faultPhone(ctx),first=X===daniel?nik:daniel;
    await fillGuess(first,first.page);await lockBtn(first.page,"LOCK MY GUESSES").click({timeout:30000});
    await first.page.waitForFunction(r=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes(r)===true,ROLE[first.account],{timeout:30000});
    const ready=async p=>await transferPhase(p)==="guess_entry"&&await lockBtn(p,"LOCK MY GUESSES").isVisible();
    await writePoint(ctx,"tw-guess",{writer:X,ready,tap:async p=>{await fillGuess(X,p);await lockBtn(p,"LOCK MY GUESSES").click({timeout:10000});},
      settle:(m,page)=>drive(m,async p=>await transferPhase(p)==="signing_entry",{page,label:"signings",stepTaps:async p=>{
        if(await transferPhase(p)==="guess_entry"&&!has(await tcState(p),"guessLockedRoles",ROLE[m.account])&&await lockBtn(p,"LOCK MY GUESSES").isVisible()){await fillGuess(m,p).catch(()=>{});await lockBtn(p,"LOCK MY GUESSES").click({timeout:5000});return "re-lock guesses";}return "";}}),
      checks:async(check)=>{for(const m of both){const s=await tcState(m.page);await check(m,"guesses.both",has(s,"guessLockedRoles","playerOne")&&has(s,"guessLockedRoles","playerTwo"),JSON.stringify(s?.state?.guessLockedRoles));}}});
  }
  const fillSigning=async(m,page)=>{
    if(m===daniel){await page.locator("#p1Signing1Name").fill(`QW${season}X Daniel Signing`);await page.locator("#p1Signing1Overall").fill("71");await page.locator("#p1Signing1Position").selectOption("ST");await fillCombo(page,"p1Signing1League","Premier League");await fillCombo(page,"p1Signing1Nationality","England");}
    else{await page.locator("#p2Signing1Name").fill(`ZP${season}V Nik Signing`);await page.locator("#p2Signing1Overall").fill("71");await page.locator("#p2Signing1Position").selectOption("ST");await fillCombo(page,"p2Signing1League","Serie A TIM");await fillCombo(page,"p2Signing1Nationality","Brazil");}
  };
  const signReady=async p=>await transferPhase(p)==="signing_entry"&&await lockBtn(p,"LOCK MY SIGNINGS").isVisible();
  const relockSign=m=>async p=>{if(await transferPhase(p)==="signing_entry"&&!has(await tcState(p),"signingLockedRoles",ROLE[m.account])&&await lockBtn(p,"LOCK MY SIGNINGS").isVisible()){const filled=await p.locator(m===daniel?"#p1Signing1Name":"#p2Signing1Name").inputValue().catch(()=>"");if(!filled)await fillSigning(m,p).catch(()=>{});await lockBtn(p,"LOCK MY SIGNINGS").click({timeout:5000});return "re-lock signings";}return "";};
  // tw-lock: the fault phone locks its signings first.
  const XL=faultPhone(ctx),second=XL===daniel?nik:daniel;
  await writePoint(ctx,"tw-lock",{writer:XL,ready:signReady,tap:async p=>{await fillSigning(XL,p);await lockBtn(p,"LOCK MY SIGNINGS").click({timeout:10000});},
    settle:(m,page)=>drive(m,async p=>has(await tcState(p),"signingLockedRoles",ROLE[XL.account])&&await transferPhase(p)==="signing_entry",{page,label:"first signings locked",stepTaps:m===XL?relockSign(m):null}),
    checks:async(check)=>{
      const own=docData(await admin(R(`transferChallenges/season_${season}/roles/${ROLE[XL.account]}`)));await check(null,"db.ownSignings",Boolean(own),"the locked signings are not in the database");
      const other=second.page;const leak=await other.evaluate(t=>(document.body.innerText||"").includes(t),XL===daniel?`QW${season}X`:`ZP${season}V`).catch(()=>false);
      await check(second,"privacy",!leak,"the locked signing shows on the other phone before the verdict");
    }});
  // tw-verdict: the other phone's lock completes the Transfer War (the verdict). Its phone is the next point's fault phone.
  {
    const writer=second;// the second locker writes the verdict; the fault phone alternates as usual
    await writePoint(ctx,"tw-verdict",{writer,ready:signReady,tap:async p=>{await fillSigning(writer,p);await lockBtn(p,"LOCK MY SIGNINGS").click({timeout:10000});},
      settle:(m,page)=>drive(m,async p=>await transferPhase(p)==="completed",{page,label:"verdict",stepTaps:relockSign(m)}),
      checks:async(check)=>{
        const t=docData(await admin(R(`transferChallenges/season_${season}`)));await check(null,"db.verdict",t&&/COMPLETED/.test(JSON.stringify(t.state||t)),`transfer ${JSON.stringify(t).slice(0,300)}`);
        const v=[];for(const m of both){const s=await tcState(m.page);v.push(JSON.stringify(s?.verdicts||null));}
        await check(null,"verdicts.same",v[0]===v[1]&&v[0]!=="null",`verdicts differ or are missing: ${v.join(" vs ").slice(0,600)}`);
      }});
  }
}
async function plainTransfers(ctx,season){
  const {daniel,nik}=ctx;const both=[daniel,nik];
  await drive(daniel,p=>p.evaluate(()=>{const b=document.getElementById("startTransferTimer");return Boolean(b&&!b.classList.contains("hidden")&&!b.disabled);}),{label:"START"});
  await daniel.page.locator("#startTransferTimer").click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="window",{label:"window"});
  await daniel.page.locator("#endTransferTimer").click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.locator("#endTransferTimer").click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="guess_entry",{label:"guesses"});
  await daniel.page.locator("#p2Guess1Type").selectOption("league");await fillCombo(daniel.page,"p2Guess1Value","Premier League");
  await nik.page.locator("#p1Guess1Type").selectOption("nationality");await fillCombo(nik.page,"p1Guess1Value","Brazil");
  await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="signing_entry",{label:"signings"});
  await daniel.page.locator("#p1Signing1Name").fill(`QW${season}X Daniel Signing`);await daniel.page.locator("#p1Signing1Overall").fill("71");await daniel.page.locator("#p1Signing1Position").selectOption("ST");await fillCombo(daniel.page,"p1Signing1League","Premier League");await fillCombo(daniel.page,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await nik.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:45000});
  await nik.page.locator("#p2Signing1Name").fill(`ZP${season}V Nik Signing`);await nik.page.locator("#p2Signing1Overall").fill("71");await nik.page.locator("#p2Signing1Position").selectOption("ST");await fillCombo(nik.page,"p2Signing1League","Serie A TIM");await fillCombo(nik.page,"p2Signing1Nationality","Brazil");
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  for(const m of both)await drive(m,async p=>await transferPhase(p)==="completed",{label:"verdict"});
}
async function plainCommit(ctx,season){
  const {daniel,nik}=ctx;
  await drive(daniel,async p=>await commitLabel(p)==="LOCK & CONFIRM SEASON",{label:"commit ready"});
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:10000});
  await drive(nik,async p=>await commitLabel(p)==="CONFIRM SEASON",{label:"ack ready"});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:10000});
  for(const m of [daniel,nik])await drive(m,async p=>await commitLabel(p)==="SEASON CONFIRMED ✓",{label:"season confirmed"});
}
async function plainContinue(ctx,next,total){
  for(const m of [ctx.daniel,ctx.nik]){
    await drive(m,p=>p.evaluate(n=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${n}`,next).catch(()=>false),{label:`CONTINUE TO SEASON ${next}`});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:10000});
    await gazette.passGazette(m.page,"season").catch(()=>null);
    await drive(m,async p=>await seasonIs(p,next,total)&&await onTransfer(p),{label:`season ${next} transfer`});
    markRouletteFinished(m,next);
  }
}
async function fillSeasonResult(page,prefix,result){
  await page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]])await page.locator(`#${prefix}${suffix}`).setChecked(Boolean(result[key]));
}
// The review heading of the results screen on show (the element keeps last season's words while another screen is up).
const reviewHeading=page=>page.evaluate(()=>{const e=document.getElementById("seasonEntry");if(!e||e.classList.contains("hidden")||!e.getClientRects().length)return "";const h=document.getElementById("seasonReviewHeading");if(!h||!h.getClientRects().length)return "";return h.textContent||"";}).catch(()=>"");
async function toResults(m,page){
  if(await visible(page,"#seasonEntry"))return true;
  const b=page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true});
  if(await clickIf(page,b))return "continue-to-results";
  return false;
}
// Publish this manager's result from wherever the results screen is (fill, REVIEW, CONFIRM). Returns what it did.
async function publishSteps(m,page,season,R){
  const prefix=m.account==="daniel"?"p1":"p2";
  const heading=await reviewHeading(page);
  if(/PUBLISHED/.test(heading))return "";
  const own=await admin(R(`seasonResults/season_${season}/roles/${ROLE[m.account]}`));if(own)return "";
  const goto=await toResults(m,page);if(goto&&goto!==true)return goto;if(!goto)return "";
  if(heading==="REVIEW YOUR SEASON RESULT"&&await clickIf(page,page.locator("#confirmSeasonCompletion")))return "confirm";
  if(await page.locator("#completeSeason").isVisible().catch(()=>false)){
    const typed=await page.locator(`#${prefix}LeaguePoints`).inputValue().catch(()=>"");
    if(typed!==String(PLAN[season-1][m.account].leaguePoints))await fillSeasonResult(page,prefix,PLAN[season-1][m.account]);
    await page.locator("#completeSeason").click({timeout:5000});
    await page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:10000}).catch(()=>{});
    if(await clickIf(page,page.locator("#confirmSeasonCompletion")))return "fill+confirm";
    return "fill";
  }
  return "";
}
async function resultsWithFaults(ctx,R,season){
  const {daniel,nik}=ctx;const both=[daniel,nik];
  const X=faultPhone(ctx),first=X===daniel?nik:daniel;
  // The other phone publishes first (no fault); the fault phone's publish completes the season's results.
  await drive(first,async p=>/PUBLISHED/.test(await reviewHeading(p))&&Boolean(await admin(R(`seasonResults/season_${season}/roles/${ROLE[first.account]}`))),{label:"first publish",stepTaps:p=>publishSteps(first,p,season,R)});
  for(const m of both)await drive(m,p=>visible(p,"#seasonEntry"),{label:"results screen",stepTaps:p=>toResults(m,p).then(x=>x===true?"":x||"")});
  await writePoint(ctx,"season-results",{writer:X,ready:p=>p.locator("#completeSeason").isVisible(),
    tap:async p=>{await fillSeasonResult(p,X.account==="daniel"?"p1":"p2",PLAN[season-1][X.account]);await p.locator("#completeSeason").click({timeout:10000});await p.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:10000});await p.locator("#confirmSeasonCompletion").click({timeout:10000});},
    settle:(m,page)=>drive(m,async p=>await reviewHeading(p)==="BOTH MANAGERS PUBLISHED",{page,label:"both published",stepTaps:p=>publishSteps(m,p,season,R)}),
    checks:async(check)=>{
      const roles=await adminList(R(`seasonResults/season_${season}/roles`));await check(null,"db.roles",roles.length===2,`roles ${roles.map(d=>d.name.split("/").pop())}`);
      for(const d of roles){const v=docData(d),who=d.name.endsWith("playerOne")?"daniel":"nik";const want=PLAN[season-1][who];await check(null,`db.${who}.result`,JSON.stringify(v).includes(`"leaguePoints":${want.leaguePoints}`),`stored ${JSON.stringify(v).slice(0,300)}`);}
    }});
}
async function plainResults(ctx,R,season){
  const {daniel,nik}=ctx;
  for(const m of [daniel,nik])await drive(m,async p=>/PUBLISHED/.test(await reviewHeading(p))&&Boolean(await admin(R(`seasonResults/season_${season}/roles/${ROLE[m.account]}`))),{label:"publish",stepTaps:p=>publishSteps(m,p,season,R)});
  for(const m of [daniel,nik])await drive(m,async p=>await reviewHeading(p)==="BOTH MANAGERS PUBLISHED",{label:"both published"});
}
const commitLabel=page=>page.evaluate(()=>document.getElementById("sharedSeasonCommitAction")?.textContent||"").catch(()=>"");
const finalShown=page=>page.evaluate(()=>{const f=document.getElementById("finalWinnerScreen");return Boolean(f&&getComputedStyle(f).visibility!=="hidden"&&f.getClientRects().length>0&&!f.classList.contains("hidden"));}).catch(()=>false);
const closedPhase=page=>page.evaluate(()=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase||"").catch(()=>"");
async function commitWithFaults(ctx,R,season,final){
  const {daniel,nik}=ctx;const both=[daniel,nik];
  const commitDoc=async()=>docData(await admin(R(`seasonCommits/season_${season}`)));
  const closedInDb=async()=>{const r=await admin(`rivalries/${ctx.rivalryId}`);return plain(F(r,"data","connectionState"))==="closed";};
  const commitTaps=m=>async p=>{
    // The automatic close did not run: the Showdown Champion screen offers CLOSE SHOWDOWN (counted as a manual close).
    // A player taps it, then waits a few seconds for the answer before tapping again.
    if(final&&Date.now()-(m.lastCloseTap||0)>8000&&await clickIf(p,p.getByRole("button",{name:"CLOSE SHOWDOWN",exact:true}))){m.lastCloseTap=Date.now();ctx.manualClose=(ctx.manualClose||0)+1;if(!report.notes.includes(`${pointNow}: ${m.user} needed the CLOSE SHOWDOWN tap`))report.notes.push(`${pointNow}: ${m.user} needed the CLOSE SHOWDOWN tap`);return "close-tap";}
    const label=await commitLabel(p);
    if(m===daniel&&label==="LOCK & CONFIRM SEASON"&&await clickIf(p,p.locator("#sharedSeasonCommitAction")))return "commit";
    if(m===nik&&label==="CONFIRM SEASON"&&await clickIf(p,p.locator("#sharedSeasonCommitAction")))return "ack";
    // Back on the results screen after a reload: the commit panel lives on the review card.
    return toResults(m,p).then(x=>x===true?"":x||"");
  };
  // This page already holds the Showdown CLOSED but shows neither the Champion screen nor Home (a reload or a second tab that
  // continued into it): the app says "Open the Final Winner or History from Home", so a player goes back Home. Noted, since
  // the screen it landed on (a Season 1 wheel / Career Start, or a dashboard with a dead TRANSFER CHALLENGE button) is wrong.
  const closedTaps=m=>async p=>{
    if(await closedPhase(p)!=="CLOSED"||await finalShown(p)||await visible(p,"#mainMenu")){p.__fijClosedSince=0;return "";}
    // The normal flow moves on to the Champion screen by itself; only a page left there for 10 s counts.
    if(!p.__fijClosedSince)p.__fijClosedSince=Date.now();
    if(Date.now()-p.__fijClosedSince<10000)return "";
    const screen=await p.evaluate(()=>[...document.querySelectorAll(".screen")].filter(s=>!s.classList.contains("hidden")&&s.getClientRects().length).map(s=>s.id).join(",")).catch(()=>"");
    // The way out a player takes: BACK TO HOME when offered, else close the top overlay (its ×), else BACK. A tap that an
    // overlay swallows is not a way out, so each tap must really land.
    const tap=async loc=>{if(!(await loc.isVisible().catch(()=>false)))return false;try{await loc.click({timeout:3000});return true;}catch(_){return false;}};
    const home=p.locator("button:visible").filter({hasText:/^\s*(BACK TO HOME|BACK TO SHOWDOWN HOME)\s*$/}).first();
    const closers=p.locator("[id$='Overlay']:visible button:visible").filter({hasText:/^\s*×\s*$/});
    const back=p.locator("button:visible").filter({hasText:/^\s*BACK\s*$/});
    let landed=await tap(home);
    for(let i=(await closers.count().catch(()=>0))-1;!landed&&i>=0;i--)landed=await tap(closers.nth(i));
    for(let i=0,n=await back.count().catch(()=>0);!landed&&i<n;i++)landed=await tap(back.nth(i));
    if(!landed)return "";
    const note=`${pointNow}: ${m.user} held the Showdown CLOSED but was on ${screen||"another screen"} (not the Champion screen); went back Home`;
    if(!report.notes.includes(note))report.notes.push(note);
    return "closed-back-home";
  };
  if(!final){
    await writePoint(ctx,"season-commit",{writer:daniel,ready:async p=>await commitLabel(p)==="LOCK & CONFIRM SEASON",tap:p=>p.locator("#sharedSeasonCommitAction").click({timeout:10000}),
      settle:(m,page)=>drive(m,async p=>m===daniel?/^(CONFIRMED ✓ · WAITING FOR RIVAL|SEASON CONFIRMED ✓)$/.test(await commitLabel(p)):["CONFIRM SEASON","SEASON CONFIRMED ✓"].includes(await commitLabel(p)),{page,label:"committed",stepTaps:m===daniel?commitTaps(m):p=>toResults(m,p).then(x=>x===true?"":x||"")}),
      checks:async(check)=>{const c=await commitDoc();await check(null,"db.commit",c&&["COMMITTED","ACKNOWLEDGED"].includes(c.phase),`commit ${JSON.stringify(c&&{phase:c.phase,revision:c.revision})}`);}});
  }else{
    await drive(daniel,async p=>await commitLabel(p)==="LOCK & CONFIRM SEASON",{label:"commit ready"});
    await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:10000});
  }
  const point=final?"terminal-close":"season-ack";
  const doneGoal=m=>async p=>{
    // Closed: the Showdown Champion screen, or (a phone that reloaded after the close) Showdown Home with no live Showdown.
    if(final)return (await finalShown(p)&&await closedPhase(p)==="CLOSED")||(await closedInDb()&&await visible(p,"#mainMenu")&&!(await p.locator("#mainMenu").filter({hasText:/CONTINUE SHOWDOWN|Daniel vs Nik · Season \d+ of/}).count()));
    // A phone that reloads after the acknowledgement resumes in the next season (its roulette or Transfer Challenge).
    if(await seasonIs(p,season+1,3)&&(await visible(p,"#rrStage")||await visible(p,"#rrStepPanel")||await onTransfer(p)))return true;
    return await commitLabel(p)==="SEASON CONFIRMED ✓"&&await p.evaluate(n=>{const s=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return s?.phase==="SCORING_RECONCILED"&&s.seasonNumber===n;},season).catch(()=>false);
  };
  await writePoint(ctx,point,{writer:nik,landed:async()=>(await commitDoc())?.phase==="ACKNOWLEDGED",ready:async p=>await commitLabel(p)==="CONFIRM SEASON",tap:p=>p.locator("#sharedSeasonCommitAction").click({timeout:10000}),
    settle:(m,page)=>drive(m,doneGoal(m),{page,label:final?"Showdown closed":"season confirmed",stepTaps:commitTaps(m),firstTaps:final?closedTaps(m):null,timeout:240000}),
    checks:async(check)=>{
      const c=await commitDoc();await check(null,"db.ack",c&&c.phase==="ACKNOWLEDGED"&&c.revision===3,`commit ${JSON.stringify(c&&{phase:c.phase,revision:c.revision})}`);
      if(final){
        // The automatic close is one attempt by design (js/productionSharedTerminalClose.js); when the quota pause makes that
        // save fail, CLOSE SHOWDOWN is the designed path out the next day, so under quota it is a note. Elsewhere it is a failure.
        if(FAULT==="quota"&&ctx.manualClose)report.notes.push(`${pointNow}: the automatic close failed in the quota pause; CLOSE SHOWDOWN (the designed fallback) closed it the next day`);
        else await check(null,"autoClose",!ctx.manualClose,"the Showdown did not close by itself: CLOSE SHOWDOWN had to be tapped");
        // F1 item 3: a phone that reloaded at the close comes back to the Showdown Champion screen, not Showdown Home.
        for(const m of both){const shown=await m.page.waitForFunction(()=>{const f=document.getElementById("finalWinnerScreen");return Boolean(f&&getComputedStyle(f).visibility!=="hidden"&&f.getClientRects().length>0&&!f.classList.contains("hidden"));},null,{timeout:30000}).then(()=>true,()=>false);await check(m,"champion.afterReload",shown,`${m.user} ended on ${await describe(m,m.page).catch(()=>"?")} after the close (no Showdown Champion screen)`);}
      }
      if(!final){
        for(const m of both)await m.page.waitForFunction(()=>Boolean((document.getElementById("sharedHistoryConvergenceSummary")?.textContent||"").trim())||/Season [2-9]/.test(document.getElementById("seasonIndicator")?.textContent||""),null,{timeout:45000}).catch(()=>{});
        const sums=[];for(const m of both){if(await seasonIs(m.page,season+1,3)){await check(m,"history.notSkipped",false,`${m.user} resumed straight into season ${season+1} (no Shared History, CONTINUE or Gazette for season ${season})`);continue;}sums.push(norm(await m.page.locator("#sharedHistoryConvergenceSummary").textContent().catch(()=>"")));}
        const want=`Daniel ${scoreSeason(PLAN[0].daniel)} - ${scoreSeason(PLAN[0].nik)} Nik`;
        await check(null,"history.same",sums.every(x=>x===sums[0]&&/^1 of 3 seasons? played/.test(x)&&x.includes(want)),`Shared History: ${JSON.stringify(sums)}`);
      }
    }});
}

main().catch(error=>{console.error(error);try{report.verdict="FAIL";report.fatal=report.fatal||{message:String(error&&error.message||error)};writeReport();}catch(_e){}process.exit(1);});
