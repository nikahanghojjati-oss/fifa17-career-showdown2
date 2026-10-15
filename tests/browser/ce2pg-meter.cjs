"use strict";
// CE2PG: "Cloud Emulator to Journey Player".
// Daniel and Nik play the real Career Mode Showdown in two Chromium contexts against the Firebase Auth + Firestore emulators
// (composed production Rules, the same production adapter path as tests/browser/two-manager-browser-journey.cjs), from setup to the
// Showdown Champion screen. After every season and at the end it checks, on BOTH contexts, that the result and totals are right
// (expected values are recomputed here from the inputs with the game's scoring rules), that they survive a reload, and that the
// other screens (Shared History, Career Statistics, Trophy Room, Legacy, Showdown Champion) show them.
//
//   CE2PG_SEASONS=1|3|5|10   CE2PG_RUN=1|2|3   (the run varies the score inputs, who wins, the publish order and the screen sizes;
//     the league and clubs are the game's own random draws, so they differ from run to run, and the inputs adapt to the league size)
//   CMS_BASE_URL=http://127.0.0.1:4511/       the static server (serve with: CMS_TEST_PORT=4511 node tests/support/static-server.cjs)
//   CE2PG_PORT_BASE=9410                     first of five emulator ports, so several runs can go side by side (+0..+4)
//   CE2PG_SCENARIO=draw                      steer the score inputs to a DRAWN Showdown (equal totals; the last season is a tie-break by league position)
//   CE2PG_DEBUG=1                             also print the raw text of every screen that is checked
//
// History and statistics deep dive (after the Showdown closes, on both managers): every figure on Career Statistics (table, comparison, leaders,
// summary tiles), Standings (Career), Trophy Room (cabinet, ranking, all-time records), Legacy and Rivalry Statistics is recomputed from the inputs and
// compared; then each browser wipes its local storage and reloads, and a brand-new browser signs in as Daniel and as Nik, and all of them must show identical
// figures (so the numbers demonstrably come from the online records, not from this browser).
//
// Run (it starts the emulators itself with the same `firebase emulators:exec` mechanism the browser journey uses):
//   CE2PG_SEASONS=3 CE2PG_RUN=1 CMS_BASE_URL=http://127.0.0.1:4511/ node tests/browser/ce2pg-journey.cjs
// Output: test-results/ce2pg-<seasons>-<run>.json and screenshots under test-results/ce2pg-<seasons>-<run>/.
// Test database only (demo project on the local emulators). Never touches production Firebase.
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const SEASONS=Number(process.env.CE2PG_SEASONS||1);
const RUN=Number(process.env.CE2PG_RUN||1);
if(![1,3,5,10].includes(SEASONS)||![1,2,3].includes(RUN)){console.error(`CE2PG_SEASONS must be 1, 3, 5 or 10 and CE2PG_RUN 1-3 (got ${process.env.CE2PG_SEASONS}, ${process.env.CE2PG_RUN})`);process.exit(2);}
const PORT_BASE=Number(process.env.CE2PG_PORT_BASE||9410);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const PROJECT="demo-cms-browser-journey";// the emulator switch is pinned to this demo project id
const OUT_DIR=path.join(ROOT,"test-results");
const SCENARIO=process.env.CE2PG_SCENARIO||"";// "draw": the Showdown ends level (equal totals)
const TAG=process.env.METER_RUN||`ce2pg-meter-${SEASONS}-${RUN}${SCENARIO?`-${SCENARIO}`:""}`;
const REPORT_PATH=path.join(OUT_DIR,`${TAG}.json`);
const SHOT_DIR=path.join(OUT_DIR,TAG);

// ---------------------------------------------------------------------------------------------------------------------------
// Bootstrap: when not already inside `firebase emulators:exec`, start the emulators and run this same file inside them.
// ---------------------------------------------------------------------------------------------------------------------------
if(!process.env.FIRESTORE_EMULATOR_HOST){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  // Generate exact-code Rules in a scratch tree. Never modify repository Rules or scripts.
  const scratch=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"ce2pg-meter-rules-"));
  fs.mkdirSync(path.join(scratch,"scripts"));fs.mkdirSync(path.join(scratch,"data"));
  for(const name of fs.readdirSync(ROOT).filter(n=>/^firestore.*\.rules$/.test(n)))fs.copyFileSync(path.join(ROOT,name),path.join(scratch,name));
  for(const name of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs","inject-persistent-pair-rules.mjs"])fs.copyFileSync(path.join(ROOT,"scripts",name),path.join(scratch,"scripts",name));
  fs.copyFileSync(path.join(ROOT,"data/transferOptions.js"),path.join(scratch,"data/transferOptions.js"));
  const built=spawnSync(process.execPath,[path.join(scratch,"scripts/build-production-firestore-rules-with-persistent-pair.mjs")],{cwd:scratch,stdio:"inherit"});
  if(built.status!==0)process.exit(built.status||1);
  process.env.METER_RULES_PATH=path.join(scratch,"firestore.spark.generated.rules");
  const configPath=path.join(OUT_DIR,`${TAG}.emulators.json`);
  fs.writeFileSync(configPath,JSON.stringify({emulators:{
    auth:{host:"127.0.0.1",port:PORTS.auth},
    firestore:{host:"127.0.0.1",port:PORTS.firestore,websocketPort:PORTS.websocket},
    hub:{host:"127.0.0.1",port:PORTS.hub},
    logging:{host:"127.0.0.1",port:PORTS.logging},
    ui:{enabled:false},singleProjectMode:true
  }}));
  const child=spawn("npx",["--yes","firebase-tools@15.28.1","emulators:exec","--config",configPath,"--only","auth,firestore","--project",PROJECT,`node ${path.relative(ROOT,__filename)}`],{cwd:ROOT,stdio:"inherit",env:{...process.env,CI:"1",FIREBASE_CLI_DISABLE_USAGE:"1",CMS_CHROMIUM_MULTI_CONTEXT:"1"}});
  child.on("exit",code=>process.exit(code===null?1:code));
  return;
}

// ---------------------------------------------------------------------------------------------------------------------------
// From here on we run inside the emulators.
// ---------------------------------------------------------------------------------------------------------------------------
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const BASE=(process.env.CMS_BASE_URL||"http://127.0.0.1:4511/").replace(/\/?$/,"/");
const FIRESTORE=`http://127.0.0.1:${PORTS.firestore}`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const DEBUG=process.env.CE2PG_DEBUG==="1";
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const VIEWPORTS={1:{daniel:{width:393,height:660},nik:{width:360,height:640}},2:{daniel:{width:390,height:844},nik:{width:412,height:915}},3:{daniel:{width:1280,height:800},nik:{width:393,height:660}}}[RUN];
const NAMES={daniel:"Daniel",nik:"Nik"};
const ROLE={daniel:"playerOne",nik:"playerTwo"};

// JOB-1824: measurement additions; original CE2PG checks below are retained.
const METER_IDLE_MS=Number(process.env.METER_IDLE_MS||0);
if(!Number.isFinite(METER_IDLE_MS)||METER_IDLE_MS<0)throw new Error("METER_IDLE_MS must be nonnegative");
const METER_PATH=process.env.METER_OUT||path.join(ROOT,"reports/firestore-meter",`${TAG}.summary.json`);
const WRAPPER_SRC="// Served in place of https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js (measurement harness only).\n// Re-exports the real SDK (served at __real-firebase-firestore.js) and shadows the functions the app uses so every\n// document read/write is reported to Node through the exposed binding __cmsMeterEvent.\nimport * as R from \"https://www.gstatic.com/firebasejs/12.17.0/__real-firebase-firestore.js\";\nexport * from \"https://www.gstatic.com/firebasejs/12.17.0/__real-firebase-firestore.js\";\n\nError.stackTraceLimit = 60;\nconst emit = e => { try { if (typeof globalThis.__cmsMeterEvent === \"function\") globalThis.__cmsMeterEvent({ t: Date.now(), ...e }); } catch (_) {} };\nlet seq = 0;\nfunction stackChain() {\n  const lines = String(new Error().stack || \"\").split(\"\\n\").slice(1);\n  const mods = [];\n  for (const line of lines) {\n    if (/__real-firebase-firestore|firebase-firestore\\.js|firebase-app\\.js|firebase-auth\\.js|gstatic\\.com/.test(line)) continue;\n    const m = line.match(/\\/((?:js|visual-assets|home|season-results|final-winner|standings|data)\\/[^\\s:)?]*?\\.js)/) || line.match(/\\/([A-Za-z0-9_.\\-]+\\.js)(?:\\?|:)/);\n    if (m && !mods.includes(m[1])) mods.push(m[1]);\n    if (mods.length >= 4) break;\n  }\n  return mods;\n}\nconst pathOf = ref => { try { return ref && ref.path ? ref.path : (ref && ref._query ? \"QUERY:\" + (ref._query.path ? ref._query.path.canonicalString() : \"?\") : \"?\"); } catch (_) { return \"?\"; } };\n\nexport async function getDoc(ref) {\n  const chain = stackChain();\n  emit({ k: \"read\", op: \"getDoc\", path: pathOf(ref), n: 1, chain, tx: 0 });\n  return R.getDoc(ref);\n}\nexport async function getDocFromServer(ref) {\n  const chain = stackChain();\n  emit({ k: \"read\", op: \"getDocFromServer\", path: pathOf(ref), n: 1, chain, tx: 0 });\n  return R.getDocFromServer(ref);\n}\nexport async function getDocs(q) {\n  const chain = stackChain();\n  const snap = await R.getDocs(q);\n  emit({ k: \"read\", op: \"getDocs\", path: pathOf(q), n: Math.max(1, snap.size), chain, tx: 0 });\n  return snap;\n}\nexport function onSnapshot(...args) {\n  const chain = stackChain();\n  emit({ k: \"listener\", op: \"onSnapshot\", path: pathOf(args[0]), n: 0, chain, tx: 0 });\n  let initial=true;\n  const deliver=snap=>{\n    if(!snap.metadata?.fromCache){\n      const n=snap.docs?(initial?Math.max(1,snap.size):snap.docChanges().filter(c=>c.type!==\"removed\").length):1;\n      emit({k:\"delivery\",op:\"onSnapshot.delivery\",path:pathOf(args[0]),n,chain,tx:0});initial=false;\n    }\n  };\n  for(let i=1;i<args.length;i++){\n    if(typeof args[i]===\"function\"){const next=args[i];args[i]=snap=>{deliver(snap);return next(snap);};break;}\n    if(args[i]&&typeof args[i].next===\"function\"){const observer=args[i];args[i]={...observer,next:snap=>{deliver(snap);return observer.next(snap);}};break;}\n  }\n  return R.onSnapshot(...args);\n}\nexport async function setDoc(ref, ...rest) { const chain = stackChain(); const r = await R.setDoc(ref, ...rest); emit({ k: \"write\", op: \"setDoc\", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }\nexport async function updateDoc(ref, ...rest) { const chain = stackChain(); const r = await R.updateDoc(ref, ...rest); emit({ k: \"write\", op: \"updateDoc\", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }\nexport async function deleteDoc(ref) { const chain = stackChain(); const r = await R.deleteDoc(ref); emit({ k: \"write\", op: \"deleteDoc\", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }\nexport async function addDoc(ref, data) { const chain = stackChain(); const r = await R.addDoc(ref, data); emit({ k: \"write\", op: \"addDoc\", path: pathOf(ref), n: 1, chain, tx: 0 }); return r; }\nexport function writeBatch(db) {\n  const chain = stackChain();\n  const b = R.writeBatch(db); const paths = [];\n  const proxy = new Proxy(b, { get(t, p) {\n    if (p === \"set\" || p === \"update\" || p === \"delete\") return (ref, ...a) => { paths.push(pathOf(ref)); t[p](ref, ...a); return proxy; };\n    if (p === \"commit\") return async () => { const r = await t.commit(); for (const x of paths) emit({ k: \"write\", op: \"batch\", path: x, n: 1, chain, tx: 0 }); return r; };\n    const v = t[p]; return typeof v === \"function\" ? v.bind(t) : v;\n  } });\n  return proxy;\n}\n\nexport function runTransaction(db, updateFn, options) {\n  const chain = stackChain();\n  const tx = ++seq;\n  let attempts = 0, reads = 0, pending = [], readPaths = new Set();\n  const t0 = Date.now();\n  emit({ k: \"txstart\", tx, chain });\n  return R.runTransaction(db, async transaction => {\n    attempts += 1; pending = []; readPaths = new Set();\n    const opChain = () => { const c = stackChain(); return c.length ? c : chain; };\n    const proxy = {\n      get: ref => { readPaths.add(pathOf(ref)); reads += 1; emit({ k: \"read\", op: \"tx.get\", path: pathOf(ref), n: 1, chain: opChain(), caller: chain, tx, attempt: attempts }); return transaction.get(ref); },\n      set: (ref, ...a) => { pending.push({ op: \"tx.set\", path: pathOf(ref) }); transaction.set(ref, ...a); return proxy; },\n      update: (ref, ...a) => { pending.push({ op: \"tx.update\", path: pathOf(ref) }); transaction.update(ref, ...a); return proxy; },\n      delete: ref => { pending.push({ op: \"tx.delete\", path: pathOf(ref) }); transaction.delete(ref); return proxy; }\n    };\n    return updateFn(proxy);\n  }, options).then(res => {\n    const written=new Set(pending.map(w=>w.path));\n    for(const p of readPaths)if(!written.has(p))emit({k:\"write\",op:\"tx.verify\",path:p,n:1,chain,caller:chain,tx});\n    for (const w of pending) emit({ k: \"write\", op: w.op, path: w.path, n: 1, chain, caller: chain, tx });\n    emit({ k: \"txend\", tx, chain, ok: true, attempts, reads, writes: pending.length, ms: Date.now() - t0 });\n    return res;\n  }, err => {\n    emit({ k: \"txend\", tx, chain, ok: false, code: err && err.code, msg: String(err && err.message || (()=>{try{return JSON.stringify(err)}catch(_){return String(err)}})()).slice(0, 240), errName: err && err.constructor && err.constructor.name, errKeys: err && typeof err===\"object\" ? Object.keys(err).slice(0,8) : null, attempts, reads, writes: 0, ms: Date.now() - t0 });\n    throw err;\n  });\n}\n";
const meter={events:[],commits:[],unparsedCommits:[],windows:[],blockedHosts:[],coverage:null};
let idleWindow=null,gameplayEnd=null;
function ownerOf(e){const chain=e.caller?.length?e.caller:(e.chain||[]);return [...chain].reverse().find(m=>/^js\/production/.test(m))||chain[chain.length-1]||"unknown";}
function totals(events){
  return {reads:events.filter(e=>e.k==="read"||e.k==="delivery").reduce((n,e)=>n+(e.n||0),0),
    writes:events.filter(e=>e.k==="write").reduce((n,e)=>n+(e.n||0),0),
    verifyWrites:events.filter(e=>e.op==="tx.verify").reduce((n,e)=>n+(e.n||0),0),
    transactions:events.filter(e=>e.k==="txstart").length,
    failedTransactions:events.filter(e=>e.k==="txend"&&!e.ok&&!e.errKeys?.includes("snapshot")).length,
    readOnlyTransactions:events.filter(e=>e.k==="txend"&&!e.ok&&e.errKeys?.includes("snapshot")).length,
    listenerDeliveries:events.filter(e=>e.k==="delivery").length};
}
function aggregate(events,key){
  const groups=new Map();for(const e of events){const k=key(e);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);}
  return [...groups].map(([key,es])=>({key,...totals(es)}));
}
function saveMeter(){
  const gameEvents=meter.events.filter(e=>!e.window&&!/^(rivalry-final|history-)/.test(e.phase));
  const summary={schemaVersion:1,tool:"CE2PG meter",seasons:SEASONS,run:RUN,tag:TAG,idleMs:METER_IDLE_MS,
    rulesSha256:require("node:crypto").createHash("sha256").update(fs.readFileSync(process.env.METER_RULES_PATH||path.join(ROOT,"firestore.spark.generated.rules"))).digest("hex"),
    harnessSha256:require("node:crypto").createHash("sha256").update(fs.readFileSync(__filename)).digest("hex"),
    codeHead:spawnSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8"}).stdout.trim(),
    verdict:report.verdict,completedSeasons:report.seasonLog.length,fatal:report.fatal,checks:report.summary,
    totals:totals(meter.events),bySeason:aggregate(meter.events,e=>String(e.season)),
    bySource:aggregate(meter.events,e=>ownerOf(e)),
    bySeasonAndSource:aggregate(meter.events,e=>`${e.season}|${ownerOf(e)}`),
    byPhase:aggregate(meter.events,e=>e.phase),byManager:aggregate(meter.events,e=>e.manager),
    gameplayEnd,gameplayBoundaryMethod:"Phase buckets through final, excluding extended history/rivalry audits and timed idle windows; includes ordinary completed career screens.",gameplayTotals:totals(gameEvents),
    terminalGameplayTotals:totals(meter.events.filter(e=>(gameplayEnd===null||e.t<=gameplayEnd)&&!e.window)),
    verificationTotals:totals(meter.events.filter(e=>gameplayEnd!==null&&e.t>gameplayEnd)),
    gameplayBySeason:aggregate(gameEvents,e=>String(e.season)),
    gameplayBySource:aggregate(gameEvents,ownerOf),
    terminalClosed:report.checks.find(c=>c.id==="final.db.terminal")?.pass??null,
    byScreen:aggregate(meter.events,e=>e.screen||"unknown"),
    commits:meter.commits,unparsedCommits:meter.unparsedCommits,windows:meter.windows,blockedHosts:meter.blockedHosts,coverage:meter.coverage,
    note:"Client read attempts (including denied/retried requests); successful SDK writes plus successful transaction verify entries. Admin probes and Rules upload excluded. Fresh-browser history verification included in final-season cost."};
  fs.mkdirSync(path.dirname(METER_PATH),{recursive:true});fs.writeFileSync(METER_PATH,JSON.stringify(summary,null,2));
  const rawPath=path.join(OUT_DIR,`${TAG}.meter.raw.json`);fs.writeFileSync(rawPath,JSON.stringify(meter));
}
function rulesLookupCounts(data){
  const files=data.rules?.files||[],source=(files[0]?.content||"").split("\n"),calls=new Map();
  const walk=node=>{
    const p=node.sourcePosition||{},span=(p.endOffset??0)-(p.currentOffset??0);
    const text=(source[(p.line||0)-1]||"").slice((p.column||1)-1),match=span>=4?text.match(/^(getAfter|get|exists)\s*\(/):null;
    if(match){const key=`${p.line}:${p.column}`,old=calls.get(key);if(!old||p.endOffset<old.endOffset)calls.set(key,{kind:match[1],line:p.line,column:p.column,endOffset:p.endOffset,evaluations:(node.values||[]).reduce((n,v)=>n+(v.count||0),0)});}
    for(const child of node.children||[])walk(child);
  };
  for(const node of data.report||[])walk(node);
  const sites=[...calls.values()],result={lookupCountReliable:Array.isArray(data.report)&&files.length===1,billableReadCountKnown:false,
    note:"One AST call node per source line/column; get(...).data parent nodes excluded. Evaluation totals bound additional reads conservatively; request-local Rules lookup caching can reduce billing."};
  for(const [kind,key] of [["get","getEvaluations"],["exists","existsEvaluations"],["getAfter","getAfterEvaluations"]])result[key]=sites.filter(s=>s.kind===kind).reduce((n,s)=>n+s.evaluations,0);
  result.lookupEvaluations=result.getEvaluations+result.existsEvaluations+result.getAfterEvaluations;result.callSites=sites;return result;
}
async function readCoverage({saveRaw=false}={}){
  try{
    const r=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:ruleCoverage`);const body=await r.text();
    const meta={status:r.status,bytes:Buffer.byteLength(body)};
    if(saveRaw){const file=path.join(OUT_DIR,`${TAG}.rules-coverage.json`);fs.writeFileSync(file,body);meta.path=rel(file);}
    return r.ok?{...meta,...rulesLookupCounts(JSON.parse(body))}:{...meta,lookupCountReliable:false};
  }catch(e){return {error:e.message,lookupCountReliable:false};}
}
async function captureCoverage(){meter.coverage=await readCoverage({saveRaw:true});}
async function park(managers,label){
  const screen=m=>m.page.evaluate(()=>({active:window.getActiveScreenName?.()||null,visible:[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id),visibility:document.visibilityState}));
  const rulesBefore=await readCoverage();
  const w={season:seasonNow,label,start:Date.now(),end:null,screens:{}};
  for(const m of managers){
    w.screens[m.user]=await screen(m);
    const expected=label.endsWith("Nik hidden")&&m.user==="nik"?"hidden":"visible";
    const visible=w.screens[m.user].visibility===expected;
    await check(m,`meter.S${seasonNow}.${label}.${m.user}.visibility`,`${m.user} is ${expected} during ${label}`,visible,w.screens[m.user],{screen:label});
    if(!visible)throw new Error(`METER_VISIBILITY_INVALID: ${m.user} should be ${expected} on ${label}`);
  }
  meter.windows.push(w);idleWindow=label;
  console.log(`METER PARK ${label} season ${seasonNow}: ${METER_IDLE_MS} ms`);
  await new Promise(r=>setTimeout(r,METER_IDLE_MS));w.end=Date.now();idleWindow=null;
  for(const m of managers)w.screens[`${m.user}_end`]=await screen(m);
  const events=meter.events.filter(e=>e.window===label&&e.season===seasonNow&&e.t>=w.start&&e.t<=w.end);
  w.totals=totals(events);
  const rulesAfter=await readCoverage();w.rules={lookupCountReliable:rulesBefore.lookupCountReliable&&rulesAfter.lookupCountReliable,billableReadCountKnown:false};
  if(w.rules.lookupCountReliable){for(const k of ["getEvaluations","existsEvaluations","getAfterEvaluations","lookupEvaluations"])w.rules[k]=(rulesAfter[k]||0)-(rulesBefore[k]||0);w.rules.lookupEvaluationsPerMinute=w.rules.lookupEvaluations/((w.end-w.start)/60000);}
  w.byManager=aggregate(events,e=>e.manager);w.perMinute=Object.fromEntries(Object.entries(w.totals).map(([k,n])=>[k,n/((w.end-w.start)/60000)]));saveMeter();
}
async function idleAfterResults(managers){
  if(!METER_IDLE_MS)return;
  // Use the game's screen navigation; no app source or stored result changes.
  const original=await Promise.all(managers.map(m=>m.page.evaluate(()=>window.getActiveScreenName?.()||"seasonEntry")));
  for(const [label,id] of [["Showdown Home","mainMenu"],["Standings","standings"],["Season Results","seasonEntry"]]){
    for(const m of managers){
      if(id==="mainMenu"){
        if(!await backToShowdownHome(m))throw new Error(`${m.user}: meter could not navigate to Showdown Home`);
      }else if(id==="standings"){
        await m.page.locator("button.sd-nav-tab[data-nav-key=standings]:visible").first().click({timeout:15000});
      }else await m.page.evaluate(id=>window.showScreen(id),id);
      await m.page.locator(`#${id}`).waitFor({state:"visible",timeout:15000});
    }
    await park(managers,`${label} visible`);
  }
  const nik=managers.find(m=>m.user==="nik"),background=await nik.context.newPage();
  await background.goto("about:blank");await background.bringToFront();
  const hidden=await nik.page.waitForFunction(()=>document.visibilityState==="hidden",null,{timeout:5000}).then(()=>true).catch(()=>false);
  await check(nik,`meter.S${seasonNow}.hidden`,"Nik's game tab is hidden after a second context page is brought to front",hidden,await nik.page.evaluate(()=>document.visibilityState),{screen:"Season Results"});
  if(!hidden)throw new Error("METER_HIDDEN_TAB_NOT_HIDDEN: browser did not hide the game tab");
  await park(managers,"Season Results Nik hidden");await background.close();await nik.page.bringToFront();
  for(let i=0;i<managers.length;i++)await managers[i].page.evaluate(id=>window.showScreen(id),original[i]);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------------------------------------
const report={
  tool:"CE2PG",seasons:SEASONS,run:RUN,startedAt:new Date().toISOString(),finishedAt:null,
  baseUrl:BASE,viewports:VIEWPORTS,league:null,clubs:null,teamCount:null,plan:null,
  verdict:"RUNNING",fatal:null,checks:[],problems:[],timings:{phases:[],totalMs:0},
  seasonLog:[],console:{daniel:[],nik:[]},network:{daniel:[],nik:[]},realUiSteps:[
    "SIGN IN WITH GOOGLE button and player choice (the emulator switch answers the Google popup with an Auth-emulator account)",
    "CREATE CODE FOR NIK, typing the pair code on Nik's page, JOIN DANIEL'S SHOWDOWN, CONTINUE CAREER (session hosted/joined by the app itself)",
    "league wheel SPIN, club pack OPEN, CONFIRM SHARED SHOWDOWN, I STARTED AT <club> (both managers)",
    "Shared Transfer Challenge every season: START, early end (both), guess type + value, LOCK MY GUESSES, signing name/league/nationality, LOCK MY SIGNINGS, CONTINUE TO SHARED SEASON RESULTS",
    "season results: typing league position, points, goals and ticking cup / Champions League / top scorer / top assist, REVIEW SEASON, confirm and publish (sequential and simultaneous)",
    "COMMIT & ACKNOWLEDGE (Daniel), ACKNOWLEDGE (Nik), CONTINUE TO SEASON n",
    "page reload every season, BACK TO MAIN MENU, Career Statistics, Trophy Room, Legacy, STANDINGS, CONTINUE CAREER, START CAREER",
    "Showdown Champion screen, HONOURS tab, BACK TO SHOWDOWN HOME, reload, Career Statistics (TABLE / COMPARE / LEADERS), Trophy Room (and MORE on a phone), Legacy, STANDINGS (THIS SHOWDOWN / CAREER), VIEW SEASON HISTORY",
    "History cross-check: both browsers read every figure; then each reloads after its local storage is wiped; then a brand-new browser signs in as Daniel and as Nik (SIGN IN WITH GOOGLE, player choice) and reads the same screens"],
  seededSteps:[
    "Local storage is wiped with a page script (localStorage.clear()), not by a player action; sign-in lives in sessionStorage so it is left alone",
    "Auth: the Google sign-in popup is replaced by the Firebase Auth emulator (tests/browser/support/emulator-runtime-switch.js), as in the existing two-manager journey",
    "Transfer Challenge: the 15-minute window is ended early by both managers; guesses and signings are fixed typed values, not game-random",
    "Season result numbers are typed from a seeded plan (they stand in for what the managers read off their FIFA 17 career)",
    "Expected values are recomputed in this file from those inputs; the database is read directly (admin) only to confirm the terminal-close witness and account bootstrap"]
};
const t0=Date.now();
let seasonNow=0;
// Preserve reviewable partial evidence if the workspace/session is interrupted.
setInterval(()=>{try{writeReport();saveMeter();}catch(error){console.error(`METER_CHECKPOINT_FAILED ${error.message}`);}},15000).unref();
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
const problemIds=new Set();
async function addProblem(m,id,screen,description,{season=seasonNow,severity="game-bug",name=null}={}){
  const key=`${id}|${m?m.user:"-"}|${season}`;if(problemIds.has(key))return;problemIds.add(key);
  const screenshot=m?await shot(m,name||`problem-${id}-s${season}`):null;
  report.problems.push({id,severity,season,context:m?m.user:"both",screen,description:String(description).slice(0,1200),screenshot});
  console.log(`PROBLEM ${id} [${m?m.user:"both"}] season ${season} (${screen}): ${String(description).slice(0,300)}`);
}
// A recorded check. `ok` is a boolean; a failing check also becomes a problem with a screenshot. The check never throws.
async function check(m,id,label,ok,detail,{screen="",season=seasonNow,severity="game-bug"}={}){
  const pass=Boolean(ok);
  report.checks.push({id,label,context:m?m.user:"both",season,pass,detail:pass?undefined:String(detail===undefined?"":typeof detail==="string"?detail:JSON.stringify(detail)).slice(0,1500)});
  console.log(`${pass?"ok  ":"FAIL"} ${id} [${m?m.user:"both"}] s${season} ${label}${pass?"":` -> ${typeof detail==="string"?detail:JSON.stringify(detail)}`.slice(0,500)}`);
  if(!pass)await addProblem(m,id,screen||id,`${label}. ${typeof detail==="string"?detail:JSON.stringify(detail)}`,{season,severity});
  return pass;
}
async function eq(m,id,label,actual,expected,opts){
  return check(m,id,label,JSON.stringify(actual)===JSON.stringify(expected),`expected ${JSON.stringify(expected)} but the screen shows ${JSON.stringify(actual)}`,opts);
}
let currentPhase="boot";
async function phase(name,fn){
  const started=Date.now();currentPhase=name;
  try{return await fn();}
  finally{report.timings.phases.push({phase:name,season:seasonNow,ms:Date.now()-started});}
}
const debug=(label,text)=>{if(DEBUG)console.log(`--- ${label}: ${String(text).replace(/\s+/g," ").slice(0,1500)}`);};

// ---------------------------------------------------------------------------------------------------------------------------
// Scoring model (the game's rules, recomputed here from the inputs: Champions League 5, league title 3, domestic cup 1,
// performance bonus 1 for 100+ league points or 100+ league goals, individual awards bonus 1 for top scorer or top assist;
// season tie: better league position, then more league points, else draw).
// ---------------------------------------------------------------------------------------------------------------------------
function scoreSeason(r){
  const cl=r.championsLeague?5:0,title=r.leaguePosition===1?3:0,cup=r.domesticCup?1:0,perf=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,indiv=(r.topScorer||r.topAssist)?1:0;
  return {championsLeague:cl,leagueTitle:title,domesticCup:cup,performanceBonus:perf,individualAwardsBonus:indiv,total:cl+title+cup+perf+indiv};
}
function seasonWinner(d,n){
  const sd=scoreSeason(d).total,sn=scoreSeason(n).total;
  if(sd!==sn)return {side:sd>sn?"daniel":"nik",byTiebreak:false};
  if(d.leaguePosition!==n.leaguePosition)return {side:d.leaguePosition<n.leaguePosition?"daniel":"nik",byTiebreak:true};
  if(d.leaguePoints!==n.leaguePoints)return {side:d.leaguePoints>n.leaguePoints?"daniel":"nik",byTiebreak:true};
  return {side:"draw",byTiebreak:true};
}
function tally(plan,upTo){
  const t={};
  for(const user of ["daniel","nik"])t[user]={total:0,W:0,D:0,L:0,league:0,cup:0,cl:0,trophies:0,seasons:0,hundredPoints:0,hundredGoals:0,topScorer:0,topAssist:0};
  for(const season of plan.slice(0,upTo)){
    const w=seasonWinner(season.daniel,season.nik);
    for(const user of ["daniel","nik"]){
      const r=season[user],x=t[user],s=scoreSeason(r);
      x.seasons+=1;x.total+=s.total;if(w.side===user)x.W+=1;else if(w.side==="draw")x.D+=1;else x.L+=1;
      if(r.leaguePosition===1)x.league+=1;if(r.domesticCup)x.cup+=1;if(r.championsLeague)x.cl+=1;
      if(r.leaguePoints>=100)x.hundredPoints+=1;if(r.leagueGoals>=100)x.hundredGoals+=1;if(r.topScorer)x.topScorer+=1;if(r.topAssist)x.topAssist+=1;
      x.trophies=x.league+x.cup+x.cl;
    }
  }
  return t;
}
function overallWinner(t){return t.daniel.total>t.nik.total?"daniel":t.nik.total>t.daniel.total?"nik":"draw";}

// Seeded generation of the score inputs for this (seasons, run).
function rngFor(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function buildPlan(teamCount){
  // attempt 0 is the original draw; if the last season cannot reach the target winner, the whole plan is drawn again
  let last=null;
  for(let attempt=0;attempt<60;attempt+=1){try{return buildPlanOnce(teamCount,attempt);}catch(error){last=error;}}
  throw last;
}
function buildPlanOnce(teamCount,attempt){
  const rng=rngFor(SEASONS*1000+RUN*17+teamCount+attempt*7919);
  const maxPoints=(teamCount-1)*6,pick=n=>Math.floor(rng()*n);
  const candidate=()=>{
    const result=()=>{
      const position=rng()<0.3?1:2+pick(Math.min(teamCount,12)-1);
      const big=rng()<0.18&&maxPoints>=100;// a 100+ point season where the league is big enough
      const points=big?100+pick(maxPoints-99):Math.min(maxPoints,20+pick(Math.max(1,Math.min(80,maxPoints-20))));
      const goals=rng()<0.18?100+pick(40):20+pick(75);
      return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:rng()<0.4,championsLeague:rng()<0.25,topScorer:rng()<0.35,topAssist:rng()<0.3};
    };
    return {daniel:result(),nik:result()};
  };
  // intent per season: D / N decisive win, T tie decided by league position (winner side given), any
  const intents=[];
  const target=SCENARIO==="draw"?"draw":RUN===1?"daniel":RUN===2?"nik":(SEASONS===1||SEASONS===5?"daniel":"nik");
  for(let k=1;k<=SEASONS;k+=1){
    let intent="any";
    if(SEASONS>=3&&RUN===3&&k===Math.ceil(SEASONS/2))intent="tie";
    if(SEASONS>=5&&RUN===2&&k===2)intent="tie";
    if(SEASONS>=10&&RUN===1&&k===7)intent="tie";
    if(SEASONS>=3&&k===1&&RUN!==3&&!SCENARIO)intent=RUN===1?"nik":"daniel";
    if(SCENARIO==="draw"&&SEASONS===1)intent="tie";// the eventual winner trails after season 1 in runs 1 and 2
    intents.push(intent);
  }
  const plan=[];
  for(let k=1;k<=SEASONS;k+=1){
    let chosen=null;
    for(let tries=0;tries<4000&&!chosen;tries+=1){
      const c=candidate(),w=seasonWinner(c.daniel,c.nik),i=intents[k-1];
      if(c.daniel.leaguePosition===c.nik.leaguePosition)continue;// two clubs never share a league position
      if(i==="tie"&&!(scoreSeason(c.daniel).total===scoreSeason(c.nik).total))continue;
      if(i==="daniel"&&w.side!=="daniel")continue;if(i==="nik"&&w.side!=="nik")continue;
      if(i==="any"&&w.side==="draw")continue;
      if(Math.max(scoreSeason(c.daniel).total,scoreSeason(c.nik).total)<3)continue;// every season has something worth checking
      if(k===SEASONS){
        const t=tally([...plan,c],k);
        if(overallWinner(t)!==target)continue;
        if(target!=="draw"&&Math.abs(t.daniel.total-t.nik.total)<1)continue;
      }
      chosen=c;
    }
    if(!chosen)throw new Error(`CE2PG could not build a ${SEASONS}-season plan for run ${RUN} (target ${target}, season ${k}, intent ${intents[k-1]})`);
    plan.push(chosen);
  }
  return {plan,target,intents};
}

// ---------------------------------------------------------------------------------------------------------------------------
// Emulator / DB helpers (admin reads are used only to confirm what was persisted)
// ---------------------------------------------------------------------------------------------------------------------------
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
async function loadComposedRules(){
  const probe=docUrl("rivalries/probe");
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(process.env.METER_RULES_PATH||path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(probe);
  if(put.status!==200||after.status!==403)throw new Error(`composed production Rules did not activate (PUT ${put.status}, open read ${after.status})`);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Browser contexts
// ---------------------------------------------------------------------------------------------------------------------------
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;
const NOISE_ABORT=/ERR_ABORTED|NS_BINDING_ABORTED/;
// environment: this sandbox cannot reach external hosts over TLS (Google Fonts). benign: Firestore optimistic-concurrency retries (the
// game re-reads and retries when both managers write at once). Everything else is an unexpected failed request and is a problem.
function classifyNetwork(e){
  if(/fonts\.(googleapis|gstatic)\.com/.test(e.url))return "environment";
  if(e.kind==="requestfailed"&&/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/.test(e.url))return "benign-listen-channel-closed";
  if(e.kind==="http"&&/127\.0\.0\.1:\d+\/v1\/projects\/.+documents:commit/.test(e.url)&&(e.status===409||e.status===400&&/ABORTED|FAILED_PRECONDITION|aborted|failed-precondition|precondition/i.test(e.body||"")))return "benign-write-contention";
  if(e.kind==="http"&&e.status===403&&/documents:commit/.test(e.url)&&/PERMISSION_DENIED/.test(e.body||""))return "rules-denied-commit";
  return "unexpected";
}
function wirePage(m){
  const {page}=m;
  page.on("pageerror",error=>{m.log.pageErrors.push(error.message);report.console[m.user].push({season:seasonNow,type:"pageerror",text:error.message.slice(0,400)});});
  page.on("console",message=>{
    const type=message.type();
    if(type==="error"||type==="warning"){
      const text=message.text().slice(0,400);
      report.console[m.user].push({season:seasonNow,type,text});
      if(type==="error"&&!/Failed to load resource/.test(text))m.log.consoleErrors.push(text);
    }
  });
  page.on("requestfailed",request=>{
    const failure=request.failure()?.errorText||"failed";
    const entry={season:seasonNow,phase:currentPhase,at:Date.now()-t0,kind:"requestfailed",method:request.method(),url:request.url().slice(0,200),error:failure};
    entry.class=classifyNetwork(entry);
    report.network[m.user].push(entry);if(!NOISE_ABORT.test(failure)&&entry.class==="unexpected")m.log.failedRequests.push(entry);
  });
  page.on("response",async response=>{
    if(response.status()>=400){
      const entry={season:seasonNow,phase:currentPhase,at:Date.now()-t0,kind:"http",status:response.status(),method:response.request().method(),url:response.url().slice(0,200)};
      try{entry.body=(await response.text()).replace(/\s+/g," ").slice(0,entry.status===403?900:300);}catch(_e){}
      try{const post=JSON.parse(response.request().postData()||"null");if(post&&Array.isArray(post.writes))entry.documents=post.writes.map(w=>String((w.update&&w.update.name)||w.delete||w.verify||(w.transform&&w.transform.document)||"").replace(/^.*\/documents\//,"")).slice(0,6);}catch(_e){}
      entry.class=classifyNetwork(entry);
      report.network[m.user].push(entry);if(entry.class==="unexpected")m.log.httpErrors.push(entry);
    }
  });
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))m.log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))m.log.productionRuntime+=1;});
  page.on("response",async response=>{
    if(response.request().method()!=="POST"||!response.url().startsWith(FIRESTORE)||!response.url().includes("documents:commit"))return;
    try{const body=JSON.parse(response.request().postData()||"{}");if(Array.isArray(body.writes))meter.commits.push({manager:m.user,season:seasonNow,phase:currentPhase,status:response.status(),writes:body.writes.filter(w=>!w.verify).length,verifies:body.writes.filter(w=>w.verify).length});else meter.unparsedCommits.push({manager:m.user,status:response.status(),bodyType:typeof body,keys:typeof body==="object"&&body?Object.keys(body):[],bytes:(response.request().postData()||"").length});}catch(_){meter.unparsedCommits.push({manager:m.user,status:response.status(),bodyType:"not-JSON",bytes:(response.request().postData()||"").length});}
  });
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
}
// Playwright enables focus emulation on ordinary pages, so visibility stays "visible".
// For the idle run, use isolated native browsers through CDP with noDefaults:true.
// Native Chromium owns visibility. Each manager still has a separate browser context.
async function launchMeterBrowser(runtime){
  if(!METER_IDLE_MS)return chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  if(!process.env.DISPLAY)throw new Error("METER_IDLE_MS requires DISPLAY for actual tab visibility");
  const children=[];
  return {
    async newContext({viewport}){
      const profile=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"ce2pg-meter-browser-"));
      const args=runtime.args.filter(a=>!a.startsWith("--headless")&&a!=="--single-process"&&a!=="--no-startup-window");
      const proc=spawn(runtime.executablePath,[...args,"--enable-automation","--no-startup-window","--remote-debugging-port=0",`--user-data-dir=${profile}`],{stdio:["ignore","ignore","pipe"]});
      const holder={proc,browser:null,profile};children.push(holder);
      const endpoint=await new Promise((resolve,reject)=>{
        let stderr="";const timer=setTimeout(()=>reject(new Error(`Native Chromium startup timed out: ${stderr.slice(-600)}`)),15000);
        proc.stderr.on("data",buf=>{stderr+=buf.toString();const m=stderr.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
        proc.once("exit",code=>{clearTimeout(timer);reject(new Error(`Native Chromium exited ${code}: ${stderr.slice(-600)}`));});
      });
      holder.browser=await chromium.connectOverCDP(endpoint,{noDefaults:true});
      const context=holder.browser.contexts()[0];
      return context;
    },
    async close(){
      for(const h of children){if(h.browser)await h.browser.close().catch(()=>{});h.proc.kill();fs.rmSync(h.profile,{recursive:true,force:true});}
    }
  };
}

async function openManager(browser,user){return openManagerAs(browser,user,user);}
async function openManagerAs(browser,user,label){
  const viewport=VIEWPORTS[user];
  const context=await browser.newContext({viewport});
  const log={pageErrors:[],consoleErrors:[],failedRequests:[],httpErrors:[],forbidden:[],productionRuntime:0,taps:[]};
  await context.exposeBinding("__ce2pgTap",(_source,tap)=>{log.taps.push(tap);});
  await context.addInitScript(()=>{window.addEventListener("click",event=>{if(!event.isTrusted)return;const button=event.target&&event.target.closest&&event.target.closest("button");if(button&&typeof window.__ce2pgTap==="function")void window.__ce2pgTap({id:button.id||"",text:(button.textContent||"").replace(/\s+/g," ").trim()});},true);});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await context.exposeBinding("__cmsMeterEvent",(_source,ev)=>{meter.events.push({...ev,manager:user,context:label,season:seasonNow,phase:currentPhase,window:idleWindow});});
  await context.addInitScript(()=>{
    const binding=window.__cmsMeterEvent;
    window.__cmsMeterEvent=ev=>binding({...ev,screen:window.getActiveScreenName?.()||document.querySelector(".screen:not(.hidden)")?.id||null,visibility:document.visibilityState});
  });
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/,route=>route.fulfill({body:WRAPPER_SRC,contentType:"text/javascript; charset=utf-8"}));
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/__real-firebase-firestore\.js$/,route=>route.fulfill({path:path.join(SDK_DIR,"firebase-firestore.js"),contentType:"text/javascript; charset=utf-8"}));
  await context.route(url=>/(^|\.)(googleapis\.com|firebaseio\.com)$/.test(url.hostname),route=>{
    meter.blockedHosts.push({manager:label,season:seasonNow,phase:currentPhase,host:new URL(route.request().url()).hostname});return route.abort("blockedbyclient");
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  if(METER_IDLE_MS){
    await page.setViewportSize(viewport);
    const cdp=await context.newCDPSession(page),{windowId}=await cdp.send("Browser.getWindowForTarget");
    await cdp.send("Browser.setWindowBounds",{windowId,bounds:{left:user==="daniel"?0:960,top:0}});await cdp.detach();
  }
  const m={user:label,account:user,context,page,log,viewport};
  report.console[label]=report.console[label]||[];report.network[label]=report.network[label]||[];
  wirePage(m);
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return m;
}
async function reload(m){
  await m.page.reload({waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
}

// ---------------------------------------------------------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------------------------------------------------------
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
const textOf=async(m,sel)=>norm(await m.page.locator(sel).first().evaluate(el=>el.textContent).catch(()=>""));
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const entry=m=>m.page.locator("#productionSharedJourneyEntryOverlay");
const remote=m=>m.page.locator("#sparkRemoteJoiningOverlay, #remoteJoiningOverlay").filter({hasText:/REMOTE JOINING|CONNECTING|WAITING FOR/}).first();
const sessionOf=m=>m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null);
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
async function describe(m){
  return m.page.evaluate(()=>{
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay']")].filter(o=>{const st=getComputedStyle(o);return !o.classList.contains("hidden")&&st.display!=="none"&&st.visibility!=="hidden";}).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,300)}`);
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | overlays=${overlays.join(" ## ")}`;
  }).catch(e=>e.message);
}
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
}
async function waitTransferPhase(m,value){await m.page.waitForFunction(v=>document.getElementById("transferChallenge")?.dataset.transferPhase===v,value,{timeout:30000});}
async function waitTransferState(m,key,role){await m.page.waitForFunction(([k,v])=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.[k]?.includes(v)===true,[key,role],{timeout:30000});}
async function fillCombo(m,id,value){const input=m.page.locator(`#${id}`);await input.fill(value);await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});}
async function privateTokenAbsent(m,token,id,label){
  const leak=await m.page.evaluate(value=>({text:(document.body.innerText||"").includes(value),inputs:[...document.querySelectorAll("input")].filter(n=>String(n.value||"").includes(value)).map(n=>n.id)}),token);
  await check(m,id,label,!leak.text&&leak.inputs.length===0,`private text "${token}" leaked: ${JSON.stringify(leak)}`,{screen:"Shared Transfer Challenge"});
}
// Real navigation back to Showdown Home with the visible button.
async function backToShowdownHome(m){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return true;
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  return false;
}
// Is the element really visible and is its centre actually hit by it (not covered by something else)?
async function probe(m,selector,{ancestorOk=false}={}){
  return m.page.evaluate(([sel,ancestorOk])=>{
    const el=document.querySelector(sel);
    if(!el)return {exists:false};
    const cs=getComputedStyle(el);let hiddenBy=null;
    for(let n=el;n&&n!==document.documentElement;n=n.parentElement){const s=getComputedStyle(n);if(s.display==="none"){hiddenBy=`display:none on ${n.id||n.className||n.tagName}`;break;}if(s.visibility==="hidden"){hiddenBy=`visibility:hidden on ${n.id||n.className||n.tagName}`;break;}if(Number(s.opacity)===0){hiddenBy=`opacity:0 on ${n.id||n.className||n.tagName}`;break;}}
    el.scrollIntoView({block:"nearest",inline:"nearest"});
    const r=el.getBoundingClientRect();
    const vw=window.innerWidth,vh=window.innerHeight;
    const sized=r.width>1&&r.height>1;
    const inViewport=r.left>=-1&&r.top>=-1&&r.right<=vw+1&&r.bottom<=vh+1;
    const pts=[[0.5,0.5],[0.2,0.5],[0.8,0.5],[0.5,0.25],[0.5,0.75]];
    const hits=pts.map(([fx,fy])=>{
      const x=Math.min(vw-1,Math.max(0,r.left+r.width*fx)),y=Math.min(vh-1,Math.max(0,r.top+r.height*fy));
      const top=document.elementFromPoint(x,y);
      const ok=Boolean(top&&(el===top||el.contains(top)||(ancestorOk&&top.contains(el))||(top.contains(el)&&top!==document.body&&top!==document.documentElement&&top.closest("button")===el)));
      return {ok,by:top?`${top.tagName.toLowerCase()}${top.id?"#"+top.id:""}${top.className&&typeof top.className==="string"?"."+top.className.trim().split(/\s+/).slice(0,3).join("."):""}`:null};
    });
    return {exists:true,hiddenBy,display:cs.display,sized,inViewport,rect:{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)},viewport:{w:vw,h:vh},centreHit:hits[0].ok,hitCount:hits.filter(h=>h.ok).length,coveredBy:[...new Set(hits.filter(h=>!h.ok).map(h=>h.by))],disabled:Boolean(el.disabled),text:(el.textContent||"").replace(/\s+/g," ").trim().slice(0,80)};
  },[selector,ancestorOk]);
}
async function assertClickable(m,id,label,selector,screen){
  const p=await probe(m,selector);
  const ok=p.exists&&!p.hiddenBy&&p.sized&&p.inViewport&&p.centreHit&&p.hitCount>=4&&!p.disabled;
  await check(m,id,`${label} is visible and clickable (not covered)`,ok,p,{screen});
  return {ok,p};
}

// ---------------------------------------------------------------------------------------------------------------------------
// Journey steps
// ---------------------------------------------------------------------------------------------------------------------------
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
async function playTransfers(daniel,nik,season){
  const tokenD=`QW${season}X Daniel Signing`,tokenN=`ZP${season}V Nik Signing`;
  await daniel.page.waitForFunction(()=>document.getElementById("startTransferTimer")&&!document.getElementById("startTransferTimer").classList.contains("hidden"),null,{timeout:30000});
  await check(nik,`S${season}.transfer.coordinator`,"only Daniel can start the shared transfer window",!(await nik.page.locator("#startTransferTimer").isVisible()),"Nik sees START",{screen:"Shared Transfer Challenge"});
  await daniel.page.locator("#startTransferTimer").click({timeout:30000});
  await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
  await daniel.page.locator("#endTransferTimer").click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.locator("#endTransferTimer").click({timeout:30000});
  await waitTransferPhase(nik,"guess_entry");await waitTransferPhase(daniel,"guess_entry");
  await daniel.page.locator("#p2Guess1Type").selectOption("league");await fillCombo(daniel,"p2Guess1Value","Premier League");
  await nik.page.locator("#p1Guess1Type").selectOption("nationality");await fillCombo(nik,"p1Guess1Value","Brazil");
  await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"signing_entry");await waitTransferPhase(daniel,"signing_entry");
  await daniel.page.locator("#p1Signing1Name").fill(tokenD);await fillCombo(daniel,"p1Signing1League","Premier League");await fillCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await privateTokenAbsent(nik,tokenD.split(" ")[0],`S${season}.transfer.privacy.nik`,"Daniel's locked signing stays hidden from Nik before completion");
  await waitTransferState(nik,"signingLockedRoles","playerOne");await waitTransferPhase(nik,"signing_entry");
  await nik.page.locator("#p2Signing1Name").fill(tokenN);await fillCombo(nik,"p2Signing1League","TIM Serie A");await fillCombo(nik,"p2Signing1Nationality","Brazil");
  await privateTokenAbsent(daniel,tokenN.split(" ")[0],`S${season}.transfer.privacy.daniel`,"Nik's unfinished signing stays hidden from Daniel");
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).waitFor({state:"visible",timeout:30000});
  const verdicts=[];
  for(const m of [daniel,nik]){
    await eq(m,`S${season}.transfer.reveal.${m.user}`,"completed transfer reveals both signings",[await m.page.locator("#p1Signing1Name").inputValue(),await m.page.locator("#p2Signing1Name").inputValue()],[tokenD,tokenN],{screen:"Shared Transfer Challenge"});
    verdicts.push(norm(await m.page.locator("#transferChallengeResults").innerText()));
  }
  await check(null,`S${season}.transfer.verdicts`,"both managers see identical transfer verdicts",verdicts[0]===verdicts[1],verdicts,{screen:"Shared Transfer Challenge"});
}
const reviewText=async(m,sel)=>norm(await m.page.locator(sel).innerText());
async function playSeasonResults(daniel,nik,season,planSeason){
  for(const m of [daniel,nik]){
    await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).click({timeout:30000});
    await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
  }
  const mode=season%3===0?"simultaneous":season%2===1?"daniel-first":"nik-first";
  const fill={daniel:()=>fillSeasonResult(daniel,"p1",planSeason.daniel),nik:()=>fillSeasonResult(nik,"p2",planSeason.nik)};
  if(mode==="simultaneous"){
    await fill.daniel();await fill.nik();await prepareReview(daniel);await prepareReview(nik);
    await Promise.all([daniel.page.locator("#confirmSeasonCompletion").click({timeout:30000}),nik.page.locator("#confirmSeasonCompletion").click({timeout:30000})]);
  }else{
    const [first,second]=mode==="daniel-first"?[daniel,nik]:[nik,daniel];
    const firstResult=planSeason[first.user],other=second.user==="daniel"?"p1":"p2";
    await fill[first.user]();await publish(first);
    // privacy: the rival must not see the first manager's numbers before publishing
    const leaked=await second.page.evaluate(([prefix,res])=>({review:!document.getElementById(prefix==="p1"?"seasonReviewOne":"seasonReviewTwo")||getComputedStyle(document.getElementById(prefix==="p1"?"seasonReviewOne":"seasonReviewTwo")).display!=="none"&&!document.getElementById(prefix==="p1"?"seasonReviewOne":"seasonReviewTwo").classList.contains("hidden")&&document.getElementById(prefix==="p1"?"seasonReviewOne":"seasonReviewTwo").getClientRects().length>0,
      points:document.getElementById(`${prefix}LeaguePoints`)?.value===String(res.leaguePoints)&&res.leaguePoints!==0,goals:document.getElementById(`${prefix}LeagueGoals`)?.value===String(res.leagueGoals)&&res.leagueGoals!==0}),[first.user==="daniel"?"p1":"p2",firstResult]);
    await check(second,`S${season}.results.privacy`,`${NAMES[first.user]}'s published numbers are not shown to ${NAMES[second.user]} before ${NAMES[second.user]} publishes`,!leaked.review&&!leaked.points&&!leaked.goals,leaked,{screen:"Shared Season Results"});
    void other;
    await fill[second.user]();await publish(second);
  }
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
    await m.page.locator("#seasonReviewOne").waitFor({state:"visible",timeout:30000});await m.page.locator("#seasonReviewTwo").waitFor({state:"visible",timeout:30000});
  }
  // The raw facts both managers see once both published.
  const cards={};
  for(const m of [daniel,nik]){cards[m.user]={one:await reviewText(m,"#seasonReviewOne"),two:await reviewText(m,"#seasonReviewTwo"),error:await textOf(m,"#seasonReviewError")};debug(`S${season} review ${m.user}`,cards[m.user].one+" || "+cards[m.user].two);}
  await check(null,`S${season}.results.converge`,"both managers see identical result cards",cards.daniel.one===cards.nik.one&&cards.daniel.two===cards.nik.two,cards,{screen:"Shared Season Results"});
  for(const m of [daniel,nik]){
    const want=(r,label)=>[`League Position ${r.leaguePosition}`,`League Points ${r.leaguePoints}`,`League Goals ${r.leagueGoals}`].filter(v=>!(label===1?cards[m.user].one:cards[m.user].two).includes(v));
    await check(m,`S${season}.results.facts.${m.user}`,"result cards show exactly the entered league position, points and goals",want(planSeason.daniel,1).length===0&&want(planSeason.nik,2).length===0,{missingDaniel:want(planSeason.daniel,1),missingNik:want(planSeason.nik,2),cards:cards[m.user]},{screen:"Shared Season Results"});
    await check(m,`S${season}.results.noerror.${m.user}`,"no error banner after publishing",cards[m.user].error==="",cards[m.user].error,{screen:"Shared Season Results"});
  }
  return mode;
}

async function commitSeason(daniel,nik,season,planSeason,final){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="COMMIT & ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>["WAITING FOR COORDINATOR","ACKNOWLEDGE SHARED SEASON"].includes(document.getElementById("sharedSeasonCommitAction")?.textContent),null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR COORDINATOR")await check(nik,`S${season}.commit.coordinator`,"Nik cannot commit the season",await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),"button enabled",{screen:"Shared Season Commit"});
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(ACKNOWLEDGED ✓ · WAITING FOR RIVAL|SEASON COMMIT ACKNOWLEDGED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  const exp={d:scoreSeason(planSeason.daniel),n:scoreSeason(planSeason.nik),w:seasonWinner(planSeason.daniel,planSeason.nik)};
  const winnerText=exp.w.side==="draw"?"Season result: Draw":`Season winner: ${NAMES[exp.w.side]}`;
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON COMMIT ACKNOWLEDGED ✓"||window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED"||document.getElementById("finalWinnerScreen")&&getComputedStyle(document.getElementById("finalWinnerScreen")).visibility!=="hidden"&&document.getElementById("finalWinnerScreen").getClientRects().length>0,null,{timeout:45000});
    if(!final){
      await m.page.waitForFunction(()=>window.CareerModeProductionSharedCanonicalScoring?.getState?.()?.phase==="SCORING_RECONCILED",null,{timeout:60000});
      await m.page.locator("#sharedCanonicalScoringPanel").waitFor({state:"visible",timeout:15000});
      const state=await m.page.evaluate(()=>{const v=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return v?{authoritative:v.authoritative,p1:v.scoring?.playerOne,p2:v.scoring?.playerTwo,winner:v.winner}:null;});
      const sd=state?.p1,sn=state?.p2;
      await eq(m,`S${season}.scoring.state.${m.user}`,"canonical scoring state equals the recomputed breakdown",{authoritative:state?.authoritative,d:sd&&{championsLeague:sd.championsLeague,leagueTitle:sd.leagueTitle,domesticCup:sd.domesticCup,performanceBonus:sd.performanceBonus,individualAwardsBonus:sd.individualAwardsBonus,total:sd.total},n:sn&&{championsLeague:sn.championsLeague,leagueTitle:sn.leagueTitle,domesticCup:sn.domesticCup,performanceBonus:sn.performanceBonus,individualAwardsBonus:sn.individualAwardsBonus,total:sn.total},winner:state?.winner},
        {authoritative:true,d:exp.d,n:exp.n,winner:exp.w.side==="draw"?"draw":ROLE[exp.w.side]},{screen:"Season scoring"});
      await eq(m,`S${season}.scoring.totals.${m.user}`,"season totals on screen",await textOf(m,"#sharedCanonicalScoringTotals"),`Daniel: ${exp.d.total} · Nik: ${exp.n.total}`,{screen:"Season scoring"});
      await eq(m,`S${season}.scoring.winner.${m.user}`,"season winner on screen",await textOf(m,"#sharedCanonicalScoringWinner"),winnerText,{screen:"Season scoring"});
      debug(`S${season} scoring panel ${m.user}`,await m.page.locator("#sharedCanonicalScoringPanel").innerText());
    }
  }
  return exp;
}

// Shared History panel (after every non-final season) against the running tally.
async function checkSharedHistory(m,season,total,plan){
  const t=tally(plan,season);
  try{await m.page.locator("#sharedHistoryConvergencePanel").waitFor({state:"visible",timeout:45000});}
  catch(_e){await check(m,`S${season}.history.visible.${m.user}`,"Shared History panel appears",false,"panel never became visible",{screen:"Shared History"});return;}
  await m.page.waitForFunction(n=>new RegExp(`^${n} of `).test((document.getElementById("sharedHistoryConvergenceSummary")?.textContent||"").trim()),season,{timeout:30000}).catch(()=>{});
  const heading=await textOf(m,"#sharedHistoryConvergenceHeading"),summary=await textOf(m,"#sharedHistoryConvergenceSummary"),records=await textOf(m,"#sharedHistoryConvergenceRecords"),trophies=await textOf(m,"#sharedHistoryConvergenceTrophies");
  debug(`S${season} history ${m.user}`,`${heading} | ${summary} | ${records} | ${trophies}`);
  const lead=t.daniel.total===t.nik.total?"TIED":t.daniel.total>t.nik.total?`Daniel +${t.daniel.total-t.nik.total}`:`Nik +${t.nik.total-t.daniel.total}`;
  await eq(m,`S${season}.history.heading.${m.user}`,"Shared History heading",heading,"SHARED HISTORY CONVERGED",{screen:"Shared History"});
  const wantSummary=new RegExp(`^${season} of ${total} seasons? accepted · [A-Z0-9 ]+ · Overall: Daniel ${t.daniel.total} · Nik ${t.nik.total} · Lead: ${lead.replace("+","\\+")}$`);
  await check(m,`S${season}.history.summary.${m.user}`,"Shared History overall totals and lead",wantSummary.test(summary),`expected "${season} of ${total} seasons accepted ... Overall: Daniel ${t.daniel.total} · Nik ${t.nik.total} · Lead: ${lead}" but saw "${summary}"`,{screen:"Shared History"});
  const rec=u=>`${NAMES[u]} · `;
  const wantRec=u=>new RegExp(`${rec(u)}.+ · ${t[u].W}W ${t[u].D}D ${t[u].L}L · ${t[u].total} showdown pts`);
  await check(m,`S${season}.history.records.${m.user}`,"Shared History W/D/L and points per manager",wantRec("daniel").test(records)&&wantRec("nik").test(records),`expected Daniel ${t.daniel.W}W ${t.daniel.D}D ${t.daniel.L}L ${t.daniel.total} pts, Nik ${t.nik.W}W ${t.nik.D}D ${t.nik.L}L ${t.nik.total} pts; saw "${records}"`,{screen:"Shared History"});
  const wantTro=u=>`${NAMES[u]} ${t[u].trophies} trophies (${t[u].league} league, ${t[u].cup} cup, ${t[u].cl} Champions League)`;
  await check(m,`S${season}.history.trophies.${m.user}`,"Shared History trophy attribution",trophies.includes(wantTro("daniel"))&&trophies.includes(wantTro("nik")),`expected "${wantTro("daniel")}" and "${wantTro("nik")}"; saw "${trophies}"`,{screen:"Shared History"});
}

async function readDashboard(m){
  return m.page.evaluate(()=>{const t=id=>(document.getElementById(id)?.textContent||"").replace(/\s+/g," ").trim();return {round:t("dashboardRound"),indicator:t("seasonIndicator"),status:t("dashboardStatus"),scoreOne:t("dashboardScoreOne"),scoreTwo:t("dashboardScoreTwo"),series:t("dashboardSeriesStatus"),lastLabel:t("dashboardLastSeasonLabel"),last:t("dashboardLastSeasonResult"),posOne:t("dashboardPositionOne"),posTwo:t("dashboardPositionTwo"),league:t("dashboardLeague"),clubOne:t("dashboardClubOne"),clubTwo:t("dashboardClubTwo"),dashboardVisible:Boolean(document.getElementById("dashboard")&&document.getElementById("dashboard").getClientRects().length)};});
}
async function checkDashboard(m,doneSeasons,plan,total,when){
  const t=tally(plan,doneSeasons),last=plan[doneSeasons-1],w=seasonWinner(last.daniel,last.nik);
  const d=await readDashboard(m);debug(`S${doneSeasons} dashboard ${when} ${m.user}`,JSON.stringify(d));
  const lead=t.daniel.total===t.nik.total?"LEVEL":t.daniel.total>t.nik.total?`DANIEL +${t.daniel.total-t.nik.total}`:`NIK +${t.nik.total-t.daniel.total}`;
  const want={round:`Season ${doneSeasons+1} of ${total}`,indicator:`Season ${doneSeasons+1} / ${total}`,status:`SHARED · ${doneSeasons} OF ${total} SEASONS ACCEPTED`,scoreOne:String(t.daniel.total),scoreTwo:String(t.nik.total),series:lead,
    last:`Season ${doneSeasons} · Daniel ${scoreSeason(last.daniel).total} - Nik ${scoreSeason(last.nik).total} · ${w.side==="draw"?"DRAW":NAMES[w.side].toUpperCase()+" WON"}`,posOne:`Last league finish: ${last.daniel.leaguePosition}`,posTwo:`Last league finish: ${last.nik.leaguePosition}`};
  const got={round:d.round,indicator:d.indicator,status:d.status,scoreOne:d.scoreOne,scoreTwo:d.scoreTwo,series:d.series,last:d.last,posOne:d.posOne,posTwo:d.posTwo};
  await eq(m,`S${doneSeasons}.dashboard.${when}.${m.user}`,`dashboard after season ${doneSeasons} (${when}): season counter, totals, lead, last season, last league finish`,got,want,{screen:"Showdown Home (dashboard)",season:doneSeasons});
  return d;
}
async function continueToSeason(daniel,nik,next,total){
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(n=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${n}`,next,{timeout:45000});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:30000});
    await m.page.waitForFunction(v=>document.getElementById("seasonIndicator")?.textContent===v,`Season ${next} / ${total}`,{timeout:30000});
    await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:30000});
  }
}
// Reload both pages in the middle of the showdown: each manager must come back by itself to the dashboard of the same season with
// the same totals; then the primary action returns to that season's Shared Transfer Challenge.
async function reloadAndResume(daniel,nik,doneSeasons,plan,total,sessionCode){
  for(const m of [daniel,nik])await reload(m);
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
    await check(m,`S${doneSeasons}.reload.session.${m.user}`,"after a reload the manager is back in the same private session",(await sessionOf(m))===sessionCode,`session ${await sessionOf(m)} != ${sessionCode}`,{screen:"Remote Joining",season:doneSeasons});
    await check(m,`S${doneSeasons}.reload.noGetReady.${m.user}`,"no GET READY overlay after reload",!(await entry(m).isVisible().catch(()=>false)),"GET READY shown",{screen:"Get Ready",season:doneSeasons});
  }
  for(const m of [nik,daniel]){
    try{
      await m.page.locator("#dashboard").waitFor({state:"visible",timeout:45000});
      await m.page.waitForFunction(([n,t])=>document.getElementById("dashboardRound")?.textContent===`Season ${n} of ${t}`,[doneSeasons+1,total],{timeout:45000});
    }catch(error){
      await check(m,`S${doneSeasons}.reload.resume.${m.user}`,"after reload the manager resumes on the dashboard of the next season",false,`${await describe(m)} (${String(error.message).split("\n")[0]})`,{screen:"Showdown Home (dashboard)",season:doneSeasons});
      throw new Error(`reload resume failed for ${m.user}`);
    }
    await check(m,`S${doneSeasons}.reload.resume.${m.user}`,"after reload the manager resumes on the dashboard of the next season",true,"",{season:doneSeasons});
    await check(m,`S${doneSeasons}.reload.noCareerStart.${m.user}`,"resume does not replay Career Start",!(await m.page.locator("#productionSharedCareerStartOverlay").isVisible().catch(()=>false)),"Career Start shown again",{screen:"Career Start",season:doneSeasons});
    await checkDashboard(m,doneSeasons,plan,total,"after-reload");
  }
}
// Back into the season: the dashboard primary action opens the Shared Transfer Challenge of the current season.
async function enterNextSeason(daniel,nik,next){
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>/SHARED TRANSFER|SEASON RESULTS|SEASON \d+/i.test(document.getElementById("seasonPrimaryAction")?.textContent||""),null,{timeout:45000});
    const wantLabel=new RegExp(`SEASON ${next}\\b`);
    const t1=Date.now();
    await m.page.waitForFunction(n=>new RegExp(`SEASON ${n}\\b`).test(document.getElementById("seasonPrimaryAction")?.textContent||""),next,{timeout:20000}).catch(()=>{});
    const label=await textOf(m,"#seasonPrimaryAction");
    await check(m,`S${next-1}.enter.label.${m.user}`,`the dashboard action names season ${next}`,wantLabel.test(label),`label "${label}" after ${Date.now()-t1} ms`,{screen:"Showdown Home (dashboard)",season:next-1});
    await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
    await m.page.locator("#transferChallenge, #seasonEntry").filter({visible:true}).first().waitFor({state:"visible",timeout:30000});
    await m.page.waitForFunction(v=>document.getElementById("seasonIndicator")?.textContent===v,`Season ${next} / ${SEASONS}`,{timeout:20000}).catch(()=>{});
    await eq(m,`S${next-1}.enter.indicator.${m.user}`,`the season indicator reads Season ${next} / ${SEASONS} after entering the season`,await textOf(m,"#seasonIndicator"),`Season ${next} / ${SEASONS}`,{screen:"Shared Transfer Challenge",season:next-1});
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Career screens (Career Statistics, Trophy Room, Legacy)
// ---------------------------------------------------------------------------------------------------------------------------
async function readScreenText(m,hostId,ready,{settleMs=0}={}){
  const deadline=Date.now()+25000;let text="";
  const read=()=>m.page.evaluate(id=>{const h=document.getElementById(id);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);
  while(Date.now()<deadline){
    text=await read();
    if(text&&ready(text))break;
    await m.page.waitForTimeout(300);
  }
  // numbers on these screens count up; wait until the text stops changing
  if(settleMs&&text){
    let stableSince=Date.now();
    const until=Date.now()+8000;
    while(Date.now()<until&&Date.now()-stableSince<settleMs){await m.page.waitForTimeout(300);const next=await read();if(next!==text){text=next;stableSince=Date.now();}}
  }
  return text;
}
const BAD_SCREEN=/unavailable|could not be read|could not be loaded|failed to|loading your showdown history|loading career history/i;
// Career Statistics: completed showdowns, seasons played, career points, trophies and the career table, per manager.
async function openCareerStatistics(m,expectCompleted){
  await m.page.locator("#careerStatisticsButton").click({timeout:20000});
  const ready=expectCompleted===0?(t=>/NO COMPLETED RECORD YET/i.test(t)):(t=>!BAD_SCREEN.test(t)&&new RegExp(`(COMPLETED SHOWDOWNS\\s*${expectCompleted}(?!\\d)|(?<![\\d.])${expectCompleted}\\s*COMPLETED SHOWDOWNS)`,"i").test(t));
  return readScreenText(m,"careerStatistics",ready,{settleMs:expectCompleted===0?0:2000});
}
const trophyCards=m=>m.page.evaluate(()=>[...document.querySelectorAll("#trophyRoom .trophyCard")].map(card=>({trophy:card.dataset.trophy||"",text:(card.innerText||"").replace(/\s+/g," ").trim(),sides:Object.fromEntries([...card.querySelectorAll("[data-side]")].map(side=>[side.dataset.side,(side.querySelector("strong")?.dataset.countValue)||(side.querySelector("strong")?.textContent||"").trim()]))})));
const DASH="—";

// ---------------------------------------------------------------------------------------------------------------------------
// Mid-showdown excursion: leave to Showdown Home (real BACK TO MAIN MENU), look at the career screens, come back with CONTINUE CAREER
// ---------------------------------------------------------------------------------------------------------------------------

// Wait for the Rivalry Statistics screen to settle: not "Loading", and unchanged for 3 seconds.
async function settleRivalry(m,maxMs){
  const t0=Date.now();let text="",since=Date.now();
  while(Date.now()-t0<maxMs){
    const next=await hostText(m,"statistics");
    if(next!==text){text=next;since=Date.now();}
    if(text&&text.length>40&&!/Loading rivalry statistics/i.test(text)&&Date.now()-since>=3000)break;
    await m.page.waitForTimeout(700);
  }
  return {text,ms:Date.now()-t0,stuck:!text||/Loading rivalry statistics/i.test(text)};
}
// RIVALRY STATISTICS from the season dashboard: read the screen as a player would, then return to the dashboard.
async function captureRivalry(m,k){
  const out={text:"",ok:false,entry:null};
  try{
    const state=await m.page.evaluate(()=>{const b=document.getElementById("rivalryStatisticsButton");const r=b&&b.getBoundingClientRect();const cs=b&&getComputedStyle(b);return {exists:Boolean(b),visible:Boolean(b&&r.width>0&&r.height>0&&cs.visibility!=="hidden"&&cs.display!=="none"),display:cs&&cs.display,hasShowdown:typeof window.openRivalryStatistics==="function"};});
    out.entry=state;
    if(state.visible){
      await m.page.locator("#rivalryStatisticsButton").click({timeout:8000});out.via="RIVALRY STATISTICS button on the dashboard";
    }else{
      // no visible entry for the player: open it through the app's own function so the numbers can still be verified
      report.seededSteps.push(`Rivalry Statistics season ${k} (${m.user}): opened by the app function openRivalryStatistics() because the dashboard button is not visible`);
      await m.page.evaluate(()=>{try{window.openRivalryStatistics();}catch(e){}});out.via="window.openRivalryStatistics() (no visible button)";
    }
    const st=await settleRivalry(m,k===1?45000:15000);
    out.text=st.text;out.loadedAfterMs=st.ms;out.stuck=st.stuck;
    out.ok=Boolean(out.text)&&!out.stuck;
    await check(m,`S${k}.rivalry.loads.${m.user}`,"RIVALRY STATISTICS finishes loading (not stuck on 'Loading rivalry statistics')",!out.stuck,`still loading after ${out.loadedAfterMs} ms: "${out.text.slice(0,200)}"`,{screen:"Rivalry Statistics",season:k});
    await shot(m,`rivalry-statistics-s${k}`);
    dumpScreen(m,`rivalry-s${k}`,out.text);
    const back=m.page.locator("#statistics button:visible").filter({hasText:/BACK/i}).first();
    if(await back.count())await back.click({timeout:8000}).catch(()=>{});
    await m.page.locator("#dashboard").waitFor({state:"visible",timeout:15000}).catch(()=>{});
  }catch(error){out.error=String(error.message).split("\n")[0];}
  report.rivalryRaw=report.rivalryRaw||{};(report.rivalryRaw[m.user]=report.rivalryRaw[m.user]||{})[`s${k}`]=out;
  return out;
}
async function midRunExcursion(daniel,nik,k,plan,total){
  for(const m of [daniel,nik]){
    const home=await backToShowdownHome(m);
    await check(m,`S${k}.excursion.home.${m.user}`,"BACK TO MAIN MENU from the dashboard reaches Showdown Home",home,await describe(m),{screen:"Showdown Home",season:k});
    if(!home)throw new Error(`${m.user} could not reach Showdown Home`);
    const tile=norm(await m.page.evaluate(()=>document.getElementById("continueCareer")?.textContent||""));
    await check(m,`S${k}.excursion.tile.${m.user}`,`the CONTINUE CAREER tile on Showdown Home shows the current season (Season ${k+1} of ${total})`,tile.includes(`Season ${k+1} of ${total}`),`tile text "${tile.slice(0,160)}"`,{screen:"Showdown Home",season:k});
    // career screens only fill from COMPLETED showdowns, so mid-showdown they must say so (and show no partial totals)
    const cs=await openCareerStatistics(m,0);
    await check(m,`S${k}.excursion.stats.${m.user}`,"Career Statistics mid-showdown says there is no completed record yet",/NO COMPLETED RECORD YET/i.test(cs),cs.slice(0,400),{screen:"Career Statistics",season:k});
    if(k===1||k===total-1)await shot(m,`excursion-career-statistics-s${k}`);
    await m.page.locator("#trophyRoomButton").click({timeout:20000});
    await readScreenText(m,"trophyRoom",x=>/Showdown Champion/i.test(x));await m.page.waitForTimeout(1500);
    const cards=await trophyCards(m);
    await check(m,`S${k}.excursion.trophy.${m.user}`,"Trophy Room mid-showdown shows no trophies yet (all NOT WON YET)",cards.length>=4&&cards.every(c=>Object.values(c.sides).every(v=>v===DASH)),cards,{screen:"Trophy Room",season:k});
    await backToShowdownHome(m);
    await m.page.locator("#legacyButton").click({timeout:20000});
    const lg=await readScreenText(m,"legacy",x=>/No completed showdowns yet|Showdown #1/i.test(x));
    await check(m,`S${k}.excursion.legacy.${m.user}`,"Legacy mid-showdown shows no completed showdowns yet",/No completed showdowns yet/i.test(lg)&&!/Showdown #1\b/i.test(lg),lg.slice(0,400),{screen:"Legacy",season:k});
    await backToShowdownHome(m);
    // STANDINGS (bottom nav): record what the live "THIS SHOWDOWN" standings show (observation, see the report)
    await m.page.locator("button.sd-nav-tab[data-nav-key=standings]:visible").first().click({timeout:8000}).catch(()=>{});
    for(let i=0;i<14;i++){await m.page.waitForTimeout(1000);const tx=norm(await m.page.evaluate(()=>document.getElementById("standings")?.innerText||""));if(tx&&!/Loading standings/.test(tx))break;}
    const standings=norm(await m.page.evaluate(()=>document.getElementById("standings")?.innerText||""));
    report.observations=report.observations||[];report.observations.push({where:`Standings (THIS SHOWDOWN) after season ${k}`,user:m.user,text:standings.slice(0,600)});
    await check(m,`S${k}.excursion.standings.${m.user}`,"STANDINGS (This Showdown) is loaded and not stuck on Loading",!/Loading standings/.test(standings)&&standings.length>40,standings.slice(0,300),{screen:"Standings",season:k});
    if(k===1)await shot(m,"excursion-standings-s1");
    await backToShowdownHome(m);
    // come back: CONTINUE CAREER -> GET READY -> START CAREER -> dashboard
    await m.page.locator("#continueCareer").click({timeout:20000});
    await m.page.getByRole("button",{name:"START CAREER",exact:true}).click({timeout:20000});
    try{
      await m.page.locator("#dashboard").waitFor({state:"visible",timeout:45000});
      await m.page.waitForFunction(([n,t])=>document.getElementById("dashboardRound")?.textContent===`Season ${n} of ${t}`,[k+1,total],{timeout:45000});
    }catch(error){
      await check(m,`S${k}.excursion.return.${m.user}`,"CONTINUE CAREER > START CAREER returns to the dashboard of the next season",false,`${await describe(m)} | dashboardRound="${await textOf(m,"#dashboardRound")}"`,{screen:"Showdown Home (dashboard)",season:k});
      throw new Error(`${m.user} did not return to the dashboard after the excursion`);
    }
    await checkDashboard(m,k,plan,total,"after-excursion");
    if(k<=2||k===total-1)await captureRivalry(m,k);
    await check(m,`S${k}.rivalry.back.${m.user}`,"RIVALRY STATISTICS: back returns to the season dashboard",await m.page.locator("#dashboard").isVisible().catch(()=>false),await describe(m),{screen:"Rivalry Statistics",season:k});
  }
}

// After the finished Showdown: Career Statistics, Trophy Room and Legacy against the expected tally (both managers).
async function careerScreens(daniel,nik,plan,t,win,label,clubs){
  const N=SEASONS,winName=win==="draw"?null:NAMES[win];
  const expectTrophy=n=>n>0?String(n):DASH;
  for(const m of [daniel,nik]){
    await backToShowdownHome(m);
    const cs=await openCareerStatistics(m,1);
    dumpScreen(m,`career-statistics-${label}`,cs);
    debug(`career statistics ${label} ${m.user}`,cs);
    await shot(m,`career-statistics-${label}`);
    await check(m,`career.${label}.stats.loaded.${m.user}`,"Career Statistics loads the completed Showdown",!BAD_SCREEN.test(cs)&&/COMPLETED SHOWDOWNS/i.test(cs),cs.slice(0,400),{screen:"Career Statistics"});
    const g=re=>{const x=re.exec(cs);return x?x.slice(1):null;};
    await eq(m,`career.${label}.stats.completed.${m.user}`,"Career Statistics: completed showdowns",g(/COMPLETED SHOWDOWNS\s*(\d+)/i),["1"],{screen:"Career Statistics"});
    await eq(m,`career.${label}.stats.seasons.${m.user}`,"Career Statistics: seasons played (Daniel / Nik)",g(/SEASONS PLAYED\s*D\s*(\d+)\s*\/\s*N\s*(\d+)/i),[String(N),String(N)],{screen:"Career Statistics"});
    await eq(m,`career.${label}.stats.points.${m.user}`,"Career Statistics: career points (Daniel / Nik)",g(/CAREER POINTS\s*D\s*(\d+)\s*\/\s*N\s*(\d+)/i),[String(t.daniel.total),String(t.nik.total)],{screen:"Career Statistics"});
    await eq(m,`career.${label}.stats.trophies.${m.user}`,"Career Statistics: trophies won (Daniel / Nik)",g(/TROPHIES WON\s*D\s*(\d+)\s*\/\s*N\s*(\d+)/i),[String(t.daniel.trophies),String(t.nik.trophies)],{screen:"Career Statistics"});
    for(const u of ["daniel","nik"]){
      const row=new RegExp(`${NAMES[u]}\\s+(\\d+)\\s+(\\d+)-(\\d+)-(\\d+)\\s+(\\d+)\\s+(\\d+)`).exec(cs.slice(cs.indexOf("CAREER TABLE")>=0?cs.indexOf("CAREER TABLE"):0));
      await eq(m,`career.${label}.stats.table.${u}.${m.user}`,`Career Statistics table row for ${NAMES[u]}: showdowns, season W-D-L, points, trophies`,row?row.slice(1):null,["1",String(t[u].W),String(t[u].D),String(t[u].L),String(t[u].total),String(t[u].trophies)],{screen:"Career Statistics"});
    }
    await m.page.locator("#trophyRoomButton").click({timeout:20000});
    await readScreenText(m,"trophyRoom",x=>!BAD_SCREEN.test(x)&&/Showdown Champion/i.test(x));
    await m.page.waitForFunction(()=>{const c=document.querySelector('#trophyRoom .trophyCard[data-trophy="showdown"]');return Boolean(c);},null,{timeout:10000}).catch(()=>{});
    await m.page.waitForTimeout(3000);
    const cards=await trophyCards(m);
    dumpScreen(m,`trophy-room-${label}`,JSON.stringify(cards,null,1));
    debug(`trophy room ${label} ${m.user}`,JSON.stringify(cards));
    const by=Object.fromEntries(cards.map(c=>[c.trophy,c.sides]));
    await eq(m,`career.${label}.trophy.showdown.${m.user}`,`Trophy Room: Showdown Champion (${winName||"nobody, drawn"} only)`,[by.showdown?.daniel,by.showdown?.nik],[win==="daniel"?"1":DASH,win==="nik"?"1":DASH],{screen:"Trophy Room"});
    await eq(m,`career.${label}.trophy.league.${m.user}`,"Trophy Room: league titles (Daniel / Nik)",[by.leagueTitles?.daniel,by.leagueTitles?.nik],[expectTrophy(t.daniel.league),expectTrophy(t.nik.league)],{screen:"Trophy Room"});
    await eq(m,`career.${label}.trophy.cups.${m.user}`,"Trophy Room: domestic cups (Daniel / Nik)",[by.domesticCups?.daniel,by.domesticCups?.nik],[expectTrophy(t.daniel.cup),expectTrophy(t.nik.cup)],{screen:"Trophy Room"});
    await eq(m,`career.${label}.trophy.cl.${m.user}`,"Trophy Room: Champions League (Daniel / Nik)",[by.championsLeague?.daniel,by.championsLeague?.nik],[expectTrophy(t.daniel.cl),expectTrophy(t.nik.cl)],{screen:"Trophy Room"});
    await shot(m,`trophy-room-${label}`);
    await backToShowdownHome(m);
    await m.page.locator("#legacyButton").click({timeout:20000});
    const lg=await readScreenText(m,"legacy",x=>!BAD_SCREEN.test(x)&&/Showdown #1\b/i.test(x),{settleMs:1500});
    dumpScreen(m,`legacy-${label}`,lg);
    debug(`legacy ${label} ${m.user}`,lg);
    await shot(m,`legacy-${label}`);
    await check(m,`career.${label}.legacy.card.${m.user}`,"Legacy lists exactly one completed Showdown card (#1)",/Showdown #1\b/i.test(lg)&&!/Showdown #2\b/i.test(lg),lg.slice(0,500),{screen:"Legacy"});
    await check(m,`career.${label}.legacy.score.${m.user}`,"Legacy card shows both managers, their clubs and the final score",lg.includes(`Daniel ${clubs[0]} ${t.daniel.total} – ${t.nik.total}`)&&lg.includes(`Nik ${clubs[1]}`),`expected "Daniel ${clubs[0]} ${t.daniel.total} – ${t.nik.total}" and "Nik ${clubs[1]}" in: ${lg.slice(0,500)}`,{screen:"Legacy"});
    await check(m,`career.${label}.legacy.winner.${m.user}`,`Legacy card names ${winName||"a draw"} as the winner`,win==="draw"?/DRAW/i.test(lg):new RegExp(`${winName} WINS`,"i").test(lg)&&!new RegExp(`${NAMES[win==="daniel"?"nik":"daniel"]} WINS`,"i").test(lg),lg.slice(0,500),{screen:"Legacy"});
    await check(m,`career.${label}.legacy.seasons.${m.user}`,"Legacy card shows all seasons played",new RegExp(`${N}\\s*/\\s*${N}\\s*Seasons`,"i").test(lg),lg.slice(0,500),{screen:"Legacy"});
    const hist=m.page.locator("#legacy button").filter({hasText:/VIEW SEASON HISTORY/i}).first();
    let seasonHistory="";
    if(await hist.count()){await hist.click({timeout:10000}).catch(()=>{});await m.page.waitForTimeout(3500);seasonHistory=norm(await m.page.evaluate(()=>[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.innerText).join(" | ")));dumpScreen(m,`season-history-${label}`,seasonHistory);debug(`season history ${label} ${m.user}`,seasonHistory);await shot(m,`season-history-${label}`);}
    await check(m,`career.${label}.history.opened.${m.user}`,"Legacy VIEW SEASON HISTORY opens the season list",/SEASON HISTORY/i.test(seasonHistory)&&/Season 1\b/.test(seasonHistory),seasonHistory.slice(0,500),{screen:"Legacy (season history)"});
    for(let k=1;k<=N;k+=1){
      const sd=plan[k-1].daniel,sn=plan[k-1].nik;
      const want=`Season ${k} Daniel: ${scoreSeason(sd).total} #${sd.leaguePosition} · ${sd.leaguePoints} league pts · ${sd.leagueGoals} goals – Nik: ${scoreSeason(sn).total} #${sn.leaguePosition} · ${sn.leaguePoints} league pts · ${sn.leagueGoals} goals`;
      await check(m,`career.${label}.history.s${k}.${m.user}`,`Legacy season history lists season ${k} with the exact score, league finish, points and goals`,seasonHistory.includes(want),`expected "${want}" in: ${seasonHistory.slice(seasonHistory.indexOf("SHOWDOWN #1")>=0?seasonHistory.indexOf("SHOWDOWN #1"):0,2500)}`,{screen:"Legacy (season history)",season:k});
    }
    report.careerRaw=report.careerRaw||{};report.careerRaw[`${label}-${m.user}`]={careerStatistics:cs.slice(0,1500),trophyCards:cards,legacy:lg.slice(0,1500),seasonHistory:seasonHistory.slice(0,4000)};
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Setup (real UI): sign in, pair, private session, league + clubs, confirm, career start
// ---------------------------------------------------------------------------------------------------------------------------
async function setupShowdown(daniel,nik){
  await phase("sign-in",async()=>{
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    daniel.uid=await accountId(daniel);nik.uid=await accountId(nik);
    await check(null,"setup.signin","Daniel and Nik signed in through SIGN IN WITH GOOGLE as two distinct accounts",Boolean(daniel.uid&&nik.uid&&daniel.uid!==nik.uid),{daniel:daniel.uid,nik:nik.uid},{screen:"Sign in"});
    for(const m of [daniel,nik])await check(m,`setup.account.${m.user}`,"account bootstrapped in the database",Boolean(await admin(`accounts/${m.uid}`)),"no accounts/<uid> document",{screen:"Sign in"});
  });
  let pairCode,rivalryId;
  await phase("pairing",async()=>{
    await daniel.page.locator("#newShowdown").click();
    await daniel.page.locator("#connectPlayersScreen").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#connectPlayersSetup").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption(String(SEASONS));
    await daniel.page.locator("#startShowdown").click();
    await entry(daniel).getByRole("button",{name:"CONNECT PLAYERS"}).click({timeout:30000});
    await pairPanel(daniel).getByRole("button",{name:"CREATE CODE FOR NIK"}).click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    pairCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    await check(daniel,"setup.paircode","Daniel created a pair code on the Start screen",/^CMS17-pair_/.test(pairCode),pairCode,{screen:"Connect Players"});
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(pairCode);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    for(const m of [nik,daniel])await m.page.waitForFunction(()=>/CAREER READY/.test(document.getElementById("persistentNikDanielPairPanel")?.innerText||""),null,{timeout:30000});
    const linkD=await admin(`accounts/${daniel.uid}/pairLinks/current`),linkN=await admin(`accounts/${nik.uid}/pairLinks/current`);
    rivalryId=field(linkD,"data","rivalryId")?.stringValue;
    await check(null,"setup.paired","Nik joined with the code: Daniel is playerOne, Nik playerTwo, same rivalry",field(linkD,"data","managerRole")?.stringValue==="playerOne"&&field(linkN,"data","managerRole")?.stringValue==="playerTwo"&&rivalryId&&field(linkN,"data","rivalryId")?.stringValue===rivalryId,{linkD,linkN},{screen:"Connect Players"});
  });
  let sessionCode;
  await phase("private-session",async()=>{
    for(const m of [daniel,nik]){
      if(await m.page.locator("#connectPlayersScreen").isVisible())await m.page.locator("#connectPlayersScreen .connectPlayersBack").click();
      await m.page.locator("#continueCareer").click();
      await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active"||!document.getElementById("sparkRemoteJoiningOverlay")?.classList.contains("hidden"),null,{timeout:30000});
    }
    await daniel.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:20000});
    await remote(daniel).waitFor({state:"hidden",timeout:20000});
    sessionCode=await sessionOf(daniel);
    await check(null,"setup.session","Daniel hosts the private session and Nik joins it without typing a code",/^session_[0-9a-f]{64}$/.test(String(sessionCode))&&(await sessionOf(nik))===sessionCode,{daniel:sessionCode,nik:await sessionOf(nik)},{screen:"Remote Joining"});
    for(const m of [nik,daniel])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
  });
  let league,clubs;
  await phase("league-and-clubs",async()=>{
    await check(nik,"setup.league.wait","Nik waits for the host and cannot draw the league",/WAITING FOR HOST/i.test(await nik.page.locator("#spinLeague").textContent())&&await nik.page.locator("#spinLeague").isDisabled(),"Nik can draw",{screen:"League wheel"});
    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    league=norm(await daniel.page.locator("#selectedLeague").textContent());
    await nik.page.waitForFunction(l=>document.getElementById("selectedLeague")?.textContent===l,league,{timeout:30000});
    await check(null,"setup.league","both managers see the same drawn league",Boolean(league)&&norm(await nik.page.locator("#selectedLeague").textContent())===league,league,{screen:"League wheel"});
    for(const m of [daniel,nik]){
      await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
      await check(m,`setup.clubscreen.${m.user}`,"the club screen names the shared league",norm(await m.page.locator("#clubAssignmentLeague").textContent())===league,league,{screen:"Club packs"});
    }
    await check(nik,"setup.clubs.wait","Nik cannot draw the clubs",await nik.page.locator("#openClubPack").isDisabled(),"enabled",{screen:"Club packs"});
    await daniel.page.locator("#openClubPack").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
    const read=m=>m.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
    clubs=await read(daniel);
    await nik.page.waitForFunction(c=>document.getElementById("clubNameOne")?.textContent?.trim()===c[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===c[1],clubs,{timeout:30000});
    await eq(nik,"setup.clubs","both managers see the same two clubs",await read(nik),clubs,{screen:"Club packs"});
    for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
    await daniel.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
    await nik.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
    for(const m of [daniel,nik]){
      await m.page.waitForFunction(()=>document.getElementById("continueClubAssignment")?.textContent==="CONTINUE TO CAREER START",null,{timeout:30000});
      await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
    }
  });
  await phase("career-start",async()=>{
    const labels={daniel:`I STARTED AT ${clubs[0].toUpperCase()}`,nik:`I STARTED AT ${clubs[1].toUpperCase()}`};
    for(const m of [daniel,nik]){
      const text=await m.page.locator("#productionSharedCareerStartOverlay").innerText();
      await check(m,`setup.careerstart.${m.user}`,"Career Start names the manager and their assigned club",text.includes(NAMES[m.user])&&text.includes(clubs[m.user==="daniel"?0:1]),text.slice(0,300),{screen:"Career Start"});
      await m.page.getByRole("button",{name:labels[m.user],exact:true}).waitFor({state:"visible",timeout:30000});
    }
    await daniel.page.getByRole("button",{name:labels.daniel,exact:true}).click({timeout:30000});
    await daniel.page.getByRole("button",{name:"MY CAREER STARTED ✓",exact:true}).waitFor({state:"visible",timeout:30000});
    await nik.page.getByRole("button",{name:labels.nik,exact:true}).click({timeout:30000});
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModeProductionSharedCareerStart?.getState?.()?.state?.phase==="CAREER_START_READY",null,{timeout:30000});
    for(const m of [daniel,nik]){await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:30000});await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});}
  });
  return {pairCode,rivalryId,sessionCode,league,clubs};
}

// ---------------------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------------------
async function main(){
  fs.rmSync(SHOT_DIR,{recursive:true,force:true});fs.mkdirSync(SHOT_DIR,{recursive:true});
  await loadComposedRules();
  const runtime=await resolveChromiumRuntime();
  const browser=await launchMeterBrowser(runtime);
  const managers=[];
  let failure=null;
  try{
    const daniel=await openManager(browser,"daniel");managers.push(daniel);
    const nik=await openManager(browser,"nik");managers.push(nik);
    for(const m of [daniel,nik])await check(m,`setup.switch.${m.user}`,"emulator switch active (localhost + cmsEmulator=1 only)",await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),"switch inactive",{screen:"Boot"});
    seasonNow=0;
    const setup=await setupShowdown(daniel,nik);
    report.league=setup.league;report.clubs=setup.clubs;
    const teamCount=await daniel.page.evaluate(league=>{const cat=window.CareerModeSharedShowdownCatalog?.catalog;if(!cat)return null;const key=Object.keys(cat).find(k=>k.replace(/_/g," ").toLowerCase()===String(league).toLowerCase())||null;return key?cat[key].length:null;},setup.league).catch(()=>null);
    const stateTeams=await daniel.page.evaluate(()=>window.CareerModeProductionSharedSeasonResults?.getState?.()?.state?.teamCount??null).catch(()=>null);
    report.teamCount=stateTeams||teamCount||20;
    const {plan,target,intents}=buildPlan(report.teamCount);
    report.plan={target,intents,seasons:plan.map((s,i)=>({season:i+1,daniel:s.daniel,nik:s.nik,expected:{daniel:scoreSeason(s.daniel),nik:scoreSeason(s.nik),winner:seasonWinner(s.daniel,s.nik)}})),expectedFinal:(()=>{const t=tally(plan,SEASONS);return {daniel:t.daniel.total,nik:t.nik.total,winner:overallWinner(t)};})()};
    console.log(`PLAN ${TAG}: league ${setup.league} (${report.teamCount} teams), clubs ${setup.clubs.join(" v ")}, final ${JSON.stringify(report.plan.expectedFinal)}`);
    for(let k=1;k<=SEASONS;k+=1){
      seasonNow=k;const final=k===SEASONS;const planSeason=plan[k-1];
      const seasonStart=Date.now();
      await phase(`season-${k}-transfers`,()=>playTransfers(daniel,nik,k));
      const mode=await phase(`season-${k}-results`,()=>playSeasonResults(daniel,nik,k,planSeason));
      await phase(`season-${k}-idle`,()=>idleAfterResults([daniel,nik]));
      const exp=await phase(`season-${k}-commit`,()=>commitSeason(daniel,nik,k,planSeason,final));
      if(!final){
        await phase(`season-${k}-history`,async()=>{for(const m of [daniel,nik])await checkSharedHistory(m,k,SEASONS,plan);});
        await phase(`season-${k}-continue`,async()=>{
          await continueToSeason(daniel,nik,k+1,SEASONS);
          for(const m of [daniel,nik])await checkDashboard(m,k,plan,SEASONS,"after-continue");
        });
        await phase(`season-${k}-reload`,()=>reloadAndResume(daniel,nik,k,plan,SEASONS,setup.sessionCode));
        await phase(`season-${k}-excursion`,()=>midRunExcursion(daniel,nik,k,plan,SEASONS));
        await phase(`season-${k}-enter`,()=>enterNextSeason(daniel,nik,k+1));
      }
      report.seasonLog.push({season:k,publishOrder:mode,seasonScore:{daniel:exp.d.total,nik:exp.n.total},seasonWinner:exp.w,ms:Date.now()-seasonStart});
    }
    seasonNow=SEASONS;
    await phase("final",()=>finalChecks(daniel,nik,plan,setup,browser));
  }catch(error){
    failure=error;
    report.fatal={message:String(error&&error.message||error).slice(0,1500),stack:String(error&&error.stack||"").split("\n").slice(0,6).join("\n")};
    for(const m of managers){report.fatal[`state_${m.user}`]=await describe(m);await addProblem(m,"fatal",`journey stopped (season ${seasonNow})`,`${report.fatal.message} | ${report.fatal[`state_${m.user}`]}`,{season:seasonNow,severity:"harness-or-game",name:"fatal"});}
  }finally{
    for(const m of managers){
      const label={season:0};
      await check(m,`zz.production.${m.user}`,"never contacted a production Firebase host or loaded the production runtime",m.log.forbidden.length===0&&m.log.productionRuntime===0,{forbidden:m.log.forbidden,productionRuntime:m.log.productionRuntime},{screen:"Network",season:label.season});
      await check(m,`zz.pageerrors.${m.user}`,"no uncaught page errors or console errors",m.log.pageErrors.length===0&&m.log.consoleErrors.length===0,{pageErrors:m.log.pageErrors.slice(0,5),consoleErrors:m.log.consoleErrors.slice(0,5)},{screen:"Console",season:label.season,severity:"game-bug"});
      const denied=report.network[m.user].filter(e=>e.class==="rules-denied-commit");
      await check(m,`zz.rulesLimit.${m.user}`,"no Firestore Rules evaluation-limit failure (\"maximum of 1000 expressions\") on any write",!denied.some(e=>/maximum of 1000 expressions/.test(e.body||"")),denied.filter(e=>/maximum of 1000 expressions/.test(e.body||"")).map(e=>({season:e.season,phase:e.phase,documents:e.documents})).slice(0,4),{screen:"Firestore Rules",season:label.season});
      await check(m,`zz.network.${m.user}`,"no failed network requests (HTTP 4xx/5xx or request failures other than aborted navigations)",m.log.failedRequests.length===0&&m.log.httpErrors.length===0,{failed:m.log.failedRequests.slice(0,5),http:m.log.httpErrors.slice(0,8)},{screen:"Network",season:label.season,severity:"game-bug"});
      report.taps={...(report.taps||{}),[m.user]:m.log.taps.length};
    }
    report.networkSummary={};
    for(const u of ["daniel","nik"]){const by={};for(const e of report.network[u]){const key=`${e.class||"?"}${e.status?` ${e.status}`:""}`;by[key]=(by[key]||0)+1;}report.networkSummary[u]=by;}
    report.rulesDeniedCommits=["daniel","nik"].flatMap(u=>report.network[u].filter(e=>e.class==="rules-denied-commit").map(e=>({user:u,season:e.season,phase:e.phase,documents:e.documents,message:(e.body||"").slice(0,300)})));
    const failed=report.checks.some(c=>!c.pass)||Boolean(failure);
    report.verdict=failed?"FAIL":"PASS";
    await captureCoverage();
    writeReport();saveMeter();
    await browser.close().catch(()=>{});
    console.log(`${report.verdict} ${TAG}: ${report.summary.passed}/${report.summary.checks} checks, ${report.problems.length} problem(s), ${Math.round(report.timings.totalMs/1000)} s -> ${rel(REPORT_PATH)}`);
  }
  process.exitCode=report.verdict==="PASS"?0:1;
}


function dumpScreen(m,name,text){
  try{fs.mkdirSync(SHOT_DIR,{recursive:true});fs.writeFileSync(path.join(SHOT_DIR,`dump-${name}-${m.user}.txt`.replace(/[^\w.\-]+/g,"_")),text);}catch(_e){}
}
const rawText=(m,hostId)=>m.page.evaluate(id=>{const h=document.getElementById(id);return h?(h.innerText||""):"";},hostId);
async function settledText(m,ids,ms=6000){
  const deadline=Date.now()+ms;let last=null,stable=0;
  while(Date.now()<deadline){
    const v=await m.page.evaluate(list=>list.map(id=>{const el=document.getElementById(id);return el?(el.dataset?.countValue||(el.textContent||"")).replace(/\s+/g," ").trim():"";}),ids);
    const key=JSON.stringify(v);if(key===last){stable+=1;if(stable>=3)return v;}else{stable=0;last=key;}
    await m.page.waitForTimeout(300);
  }
  return JSON.parse(last||"[]");
}

// The Showdown Champion screen of the finished Showdown, checked against the expected tally.
async function checkFinalWinnerScreen(m,plan,t,win,phaseLabel){
  const N=SEASONS,last=plan[N-1],lw=seasonWinner(last.daniel,last.nik),winName=win==="draw"?null:NAMES[win];
  await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
  const ids=["outcomeHeadline","danielTotal","nikTotal","panelLastSeasonLabel","panelLastSeasonDaniel","panelLastSeasonNik","panelLastSeasonResult","panelSeasons","panelMargin"];
  const v=await settledText(m,ids);const got=Object.fromEntries(ids.map((id,i)=>[id,v[i]]));
  debug(`final ${phaseLabel} ${m.user}`,JSON.stringify(got));
  const sc=r=>String(scoreSeason(r).total);
  const lastSeasonTexts={daniel:/DANIEL/i,nik:/NIK/i};
  await check(m,`final.${phaseLabel}.winner.${m.user}`,`Showdown Champion screen names ${winName||"a draw"} as the winner`,win==="draw"?/DRAW/i.test(got.outcomeHeadline):new RegExp(`^${winName}\\s+WINS$`,"i").test(got.outcomeHeadline),`headline "${got.outcomeHeadline}"`,{screen:"Showdown Champion"});
  await eq(m,`final.${phaseLabel}.totals.${m.user}`,"Showdown Champion totals Daniel / Nik",[got.danielTotal,got.nikTotal],[String(t.daniel.total),String(t.nik.total)],{screen:"Showdown Champion"});
  await eq(m,`final.${phaseLabel}.lastSeason.${m.user}`,"Showdown Champion final-season cell (label and season score)",[got.panelLastSeasonLabel,got.panelLastSeasonDaniel,got.panelLastSeasonNik],[`FINAL SEASON ${N}`,sc(last.daniel),sc(last.nik)],{screen:"Showdown Champion"});
  await check(m,`final.${phaseLabel}.lastSeasonWinner.${m.user}`,"Showdown Champion names who took the final season",lw.side==="draw"?/DRAW|LEVEL|TIE/i.test(got.panelLastSeasonResult):lastSeasonTexts[lw.side].test(got.panelLastSeasonResult),`final season ${lw.side}${lw.byTiebreak?" (by league position)":""} but the cell says "${got.panelLastSeasonResult}"`,{screen:"Showdown Champion"});
  await eq(m,`final.${phaseLabel}.seasons.${m.user}`,"Showdown Champion seasons played and margin",[got.panelSeasons,got.panelMargin],[String(N),String(Math.abs(t.daniel.total-t.nik.total))],{screen:"Showdown Champion"});
  // honours are on the HONOURS tab on phones
  const tab=m.page.locator("label[for='finalWinnerTabHonours']");
  if(await tab.isVisible().catch(()=>false))await tab.click({timeout:5000}).catch(()=>{});
  const hid=["panelDanielContinental","panelNikContinental","panelDanielLeague","panelNikLeague","panelDanielCup","panelNikCup","panelDanielTrophies","panelNikTrophies"];
  const hv=await settledText(m,hid);const hg=Object.fromEntries(hid.map((id,i)=>[id,hv[i]]));
  await eq(m,`final.${phaseLabel}.honours.${m.user}`,"Showdown Champion honours (Champions League, league titles, cups, total trophies) for Daniel then Nik",
    [hg.panelDanielContinental,hg.panelNikContinental,hg.panelDanielLeague,hg.panelNikLeague,hg.panelDanielCup,hg.panelNikCup,hg.panelDanielTrophies,hg.panelNikTrophies],
    [t.daniel.cl,t.nik.cl,t.daniel.league,t.nik.league,t.daniel.cup,t.nik.cup,t.daniel.trophies,t.nik.trophies].map(String),{screen:"Showdown Champion (honours)"});
  const summaryTab=m.page.locator("label[for='finalWinnerTabSummary']");
  if(await summaryTab.isVisible().catch(()=>false))await summaryTab.click({timeout:5000}).catch(()=>{});
  // reconciliation + closed state text
  const readRec=async()=>({heading:await textOf(m,"#sharedFinalReconciliationHeading"),winner:await textOf(m,"#sharedFinalReconciliationWinner"),closed:await textOf(m,"#sharedTerminalCloseHeading"),status:await textOf(m,"#sharedTerminalCloseStatus")});
  let rec=await readRec();
  for(let i=0;i<20&&(!rec.heading||!rec.winner);i+=1){await m.page.waitForTimeout(500);rec=await readRec();}
  debug(`final reconciliation ${phaseLabel} ${m.user}`,JSON.stringify(rec));
  await eq(m,`final.${phaseLabel}.reconciliation.${m.user}`,"final reconciliation line",[rec.heading,rec.winner],["SHOWDOWN FINAL RESULT",win==="draw"?rec.winner:`Daniel ${t.daniel.total} · Nik ${t.nik.total} · ${winName} WINS`],{screen:"Final reconciliation"});
  await check(m,`final.${phaseLabel}.closed.${m.user}`,"the Showdown is shown as closed and read-only",rec.closed==="SHARED SHOWDOWN CLOSED"&&/CLOSED · NO NEW SESSION · NO NEW SEASON/.test(rec.status),rec,{screen:"Terminal close"});
}
async function checkFinalCells(m,phaseLabel){
  // The result numbers on the Showdown Champion screen must not be covered by another panel.
  for(const [id,label] of [["outcomeHeadline","winner headline"],["danielTotal","Daniel's total"],["nikTotal","Nik's total"],["finalWinnerLastSeason","final-season cell"],["panelSeasons","SEASONS PLAYED cell"],["panelMargin","MARGIN cell"]]){
    const p=await probe(m,`#${id}`,{ancestorOk:true});
    const ok=p.exists&&!p.hiddenBy&&p.sized&&p.hitCount>=4;
    await check(m,`final.live.cell.${id}.${m.user}`,`the ${label} on the Showdown Champion screen is visible and not covered`,ok,p,{screen:"Showdown Champion"});
  }
}
async function checkExitButtons(m,phaseLabel){
  // Both exits of the Showdown Champion screen must be visible and not covered by another element.
  const review=await assertClickable(m,`final.${phaseLabel}.reviewSeason.${m.user}`,"REVIEW SEASON button on the Showdown Champion screen","#v10ExitSlot #completeSeason","Showdown Champion");
  const back=await assertClickable(m,`final.${phaseLabel}.backHome.${m.user}`,"BACK TO SHOWDOWN HOME button on the Showdown Champion screen","#v10ExitSlot [data-smart-back]","Showdown Champion");
  const labels=await m.page.evaluate(()=>({review:(document.getElementById("completeSeason")?.textContent||"").replace(/\s+/g," ").trim(),back:(document.querySelector("#v10ExitSlot [data-smart-back]")?.textContent||"").replace(/\s+/g," ").trim()}));
  await eq(m,`final.${phaseLabel}.exitLabels.${m.user}`,"exit button labels",[labels.review,labels.back],["REVIEW SEASON","BACK TO SHOWDOWN HOME"],{screen:"Showdown Champion"});
  // a real hit test by Playwright (it waits for the element to receive pointer events)
  for(const [id,sel,label] of [["reviewSeason","#v10ExitSlot #completeSeason","REVIEW SEASON"],["backHome","#v10ExitSlot [data-smart-back]","BACK TO SHOWDOWN HOME"]]){
    let ok=true,why="";
    try{await m.page.locator(sel).first().click({trial:true,timeout:4000});}catch(error){ok=false;why=String(error.message).split("\n").slice(0,4).join(" ").slice(0,500);}
    await check(m,`final.${phaseLabel}.${id}.trial.${m.user}`,`Playwright reports ${label} can receive a click`,ok,why,{screen:"Showdown Champion"});
  }
  return {review,back};
}


// ---------------------------------------------------------------------------------------------------------------------------
// History screens deep dive: every tab of Career Statistics, Standings, Trophy Room and Legacy
// ---------------------------------------------------------------------------------------------------------------------------
// Figures on these screens count up when they open: wait until the text has stopped changing.
async function stableHostText(m,hostId,quietMs=1800,maxMs=12000){
  let text=await hostText(m,hostId),since=Date.now();const end=Date.now()+maxMs;
  while(Date.now()<end&&Date.now()-since<quietMs){await m.page.waitForTimeout(300);const next=await hostText(m,hostId);if(next!==text){text=next;since=Date.now();}}
  return text;
}
const hostText=(m,hostId)=>m.page.evaluate(id=>{const h=document.getElementById(id);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);
async function clickTab(m,hostId,name){
  const re=new RegExp(`^\\s*${name.replace(/-/g,"[-\u2010-\u2015]?")}\\s*$`,"i");
  let b=m.page.locator(`#${hostId} button, #${hostId} [role=tab], #${hostId} label`).filter({hasText:re}).first();
  if(!(await b.count()))b=m.page.locator(`#${hostId}`).getByText(re).first();
  if(!(await b.count()))return false;
  await b.click({timeout:5000}).catch(()=>{});
  await m.page.waitForTimeout(2500);
  return true;
}
const TABS={careerStatistics:["TABLE","COMPARE","LEADERS"],standings:["THIS SHOWDOWN","CAREER","HEAD-TO-HEAD"],legacy:[],trophyRoom:[]};
async function openHistoryScreen(m,hostId){
  await backToShowdownHome(m);
  if(hostId==="careerStatistics")await m.page.locator("#careerStatisticsButton").click({timeout:20000});
  else if(hostId==="legacy")await m.page.locator("#legacyButton").click({timeout:20000});
  else if(hostId==="trophyRoom"){await m.page.locator("#careerStatisticsButton").click({timeout:20000});await m.page.locator("#trophyRoomButton").click({timeout:20000});}
  else if(hostId==="standings")await m.page.locator("button.sd-nav-tab[data-nav-key=standings]:visible").first().click({timeout:8000});
  for(let i=0;i<30;i++){const t=await hostText(m,hostId);if(t&&!/Loading standings|^\s*$/.test(t))break;await m.page.waitForTimeout(500);}
  await m.page.waitForTimeout(3000);
}
async function captureHistory(m,label){
  const out={};
  for(const hostId of ["careerStatistics","standings","legacy","trophyRoom"]){
    out[hostId]={};
    await openHistoryScreen(m,hostId);
    out[hostId].default=await stableHostText(m,hostId);
    for(const tab of TABS[hostId]){
      if(await clickTab(m,hostId,tab))out[hostId][tab]=await stableHostText(m,hostId);
    }
    if(hostId==="trophyRoom"){
      // on a phone the ranks and all-time records are meant to live behind MORE: capture what it shows and what is only in the DOM
      out.trophyRoomDom=await m.page.evaluate(()=>(document.getElementById("trophyRoom")?.textContent||"").replace(/\s+/g," ").trim());
      out.trophyRoomSheet=await m.page.evaluate(()=>(document.querySelector("#trophyRoom .trophyPhoneSheet")?.textContent||"").replace(/\s+/g," ").trim());
      const more=m.page.locator("#trophyRoom label.trophyPhoneMoreButton");
      if(await more.isVisible().catch(()=>false)){
        await more.click({timeout:5000}).catch(()=>{});await m.page.waitForTimeout(1500);
        out[hostId].MORE=await hostText(m,hostId);
        await shot(m,`history-trophyRoom-more-${label}`);
        await more.click({timeout:5000}).catch(()=>{});
      }
    }
    await shot(m,`history-${hostId}-${label}`);
  }
  dumpScreen(m,`history-${label}`,JSON.stringify(out,null,1));
  return out;
}


// Expected figures for the finished Showdown, recomputed from the inputs.
function expectedHistory(plan){
  const t=tally(plan,plan.length),N=plan.length,x={};
  for(const u of ["daniel","nik"]){
    const rs=plan.map(season=>season[u]),scores=rs.map(r=>scoreSeason(r).total);
    x[u]={...t[u],avgPoints:rs.reduce((a,r)=>a+r.leaguePoints,0)/N,avgGoals:rs.reduce((a,r)=>a+r.leagueGoals,0)/N,bestScore:Math.max(...scores),perfect:scores.filter(v=>v===11).length,highPoints:Math.max(...rs.map(r=>r.leaguePoints)),highGoals:Math.max(...rs.map(r=>r.leagueGoals))};
  }
  return x;
}
const holder=(d,n)=>d>n?"Daniel":n>d?"Nik":"SHARED";
const leaderName=(d,n)=>d>n?"Daniel":n>d?"Nik":"Daniel + Nik";
const near=(shown,want)=>Number.isFinite(Number(shown))&&Math.abs(Number(shown)-want)<=0.51;
// Reads every figure off the captured screen texts. Phone and desktop lay the same screens out differently, so all of a
// screen's tabs are joined and read together; a value that is hidden on one layout shows up as null.
function corpus(raw,host){return Object.values(raw?.[host]||{}).join(" ");}
function extractHistory(raw,{visibleOnly=false}={}){
  const cs=corpus(raw,"careerStatistics"),st=raw?.standings?.CAREER||"",tr=corpus(raw,"trophyRoom")+(visibleOnly?"":` ${raw?.trophyRoomDom||""}`),lg=raw?.legacy?.default||"";
  const pair=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1],r[2]]:null;};
  const lead=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1].trim(),r[2]]:null;};
  const o={};
  o.compareTitles=pair(cs,/(\d+)\s+LEAGUE TITLES\s+(\d+)/);o.compareCups=pair(cs,/(\d+)\s+DOMESTIC CUPS\s+(\d+)/);o.compareCl=pair(cs,/(\d+)\s+CHAMPIONS LEAGUE WINS\s+(\d+)/);o.compareWins=pair(cs,/(\d+)\s+SEASON WINS\s+(\d+)/);
  o.compareAvgPoints=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE POINTS\s+([\d.]+)/);o.compareAvgGoals=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE GOALS\s+([\d.]+)/);
  o.leadWins=lead(cs,/MOST SEASON WINS\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+wins?/);o.leadTrophies=lead(cs,/MOST TROPHIES\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+trophies/);
  o.leadPoints=lead(cs,/MOST CAREER POINTS\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);o.leadBest=lead(cs,/BEST SEASON SCORE\s+(Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);
  o.summary=(/COMPLETED SHOWDOWNS\s+(\d+).*?SEASONS PLAYED D (\d+) \/ N (\d+) CAREER POINTS D (\d+) \/ N (\d+) TROPHIES WON D (\d+) \/ N (\d+)/i.exec(cs)||[]).slice(1)||null;
  o.table=(/CAREER TABLE.*?(?:#\s+Manager Showdowns Season W-D-L Points Trophies)\s+(.*?)(?:MANAGER COMPARISON|CAREER LEADERS|OPEN TROPHY ROOM)/i.exec(cs)||[])[1]||null;
  o.standingsPoints=pair(st,/CAREER POINTS\s+(\d+)\s*:\s*(\d+)/);
  for(const [word,key] of [["Season Wins","W"],["Season Draws","D"],["Season Losses","L"],["Champions Leagues","cl"],["League Titles","league"],["Domestic Cups","cup"],["Total Trophies","trophies"]])o[`standings_${key}`]=pair(st,new RegExp(`(\\d+)\\s+${word}\\s+(\\d+)`));
  o.standingsLeads=(/\b(DANIEL|NIK) LEADS\b(?: ON (SEASON WINS|CAREER POINTS|TROPHIES))?/i.exec(st)||[]).slice(1,3).filter(Boolean).map(v=>v.toUpperCase());
  o.rankDaniel=(/#(\d)\s*DANIEL\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);o.rankNik=(/#(\d)\s*NIK\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);
  o.recSeason=pair(tr,/HIGHEST SEASON SCORE\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPoints=pair(tr,/HIGHEST LEAGUE POINTS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recGoals=pair(tr,/HIGHEST LEAGUE GOALS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPerfect=pair(tr,/MOST PERFECT SEASONS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);
  for(const k of Object.keys(o))if(Array.isArray(o[k])&&o[k].length&&k.startsWith("rec"))o[k]=[o[k][0],o[k][1].toUpperCase()];
  o.cabChampion=pair(tr,/SHOWDOWN CHAMPION DANIEL (—|\d+) NIK (—|\d+)/);o.cabNotWon=/SHOWDOWN CHAMPION DANIEL — NIK — NOT WON YET/i.test(tr);
  o.cabLeague=pair(tr,/ LEAGUE TITLE DANIEL (—|\d+) NIK (—|\d+)/);o.cabCup=pair(tr,/ DOMESTIC CUP DANIEL (—|\d+) NIK (—|\d+)/);o.cabCl=pair(tr,/ CHAMPIONS LEAGUE DANIEL (—|\d+) NIK (—|\d+)/);
  o.legacyScore=(/(\d+)\s*–\s*(\d+)/.exec(lg)||[]).slice(1);o.legacyDraw=/\bDRAW\b/.test(lg);o.legacySeasons=(/(\d+)\s*\/\s*(\d+)\s*Seasons/i.exec(lg)||[]).slice(1);
  return o;
}
async function checkHistoryNumbers(m,raw,label,plan,win){
  const N=plan.length,x=expectedHistory(plan),f=extractHistory(raw),tt=tally(plan,N),visible=extractHistory(raw,{visibleOnly:true});
  const id=(k)=>`hist.${label}.${k}.${m.user}`;
  const S=String,cell=(n)=>n>0?S(n):"—",two=(d,n)=>[S(d),S(n)];
  const rows=[
    ["compareTitles","Career Statistics comparison: league titles (Daniel / Nik)",two(x.daniel.league,x.nik.league),"Career Statistics (comparison)"],
    ["compareCups","Career Statistics comparison: domestic cups",two(x.daniel.cup,x.nik.cup),"Career Statistics (comparison)"],
    ["compareCl","Career Statistics comparison: Champions League wins",two(x.daniel.cl,x.nik.cl),"Career Statistics (comparison)"],
    ["compareWins","Career Statistics comparison: season wins",two(x.daniel.W,x.nik.W),"Career Statistics (comparison)"],
    ["leadWins","Career Statistics leaders: most season wins",[leaderName(x.daniel.W,x.nik.W),S(Math.max(x.daniel.W,x.nik.W))],"Career Statistics (leaders)"],
    ["leadTrophies","Career Statistics leaders: most trophies",[leaderName(x.daniel.trophies,x.nik.trophies),S(Math.max(x.daniel.trophies,x.nik.trophies))],"Career Statistics (leaders)"],
    ["leadPoints","Career Statistics leaders: most career points",[leaderName(x.daniel.total,x.nik.total),S(Math.max(x.daniel.total,x.nik.total))],"Career Statistics (leaders)"],
    ["leadBest","Career Statistics leaders: best season score",[leaderName(x.daniel.bestScore,x.nik.bestScore),S(Math.max(x.daniel.bestScore,x.nik.bestScore))],"Career Statistics (leaders)"],
    ["summary","Career Statistics tiles: showdowns, seasons, career points, trophies (D / N)",["1",S(N),S(N),S(x.daniel.total),S(x.nik.total),S(x.daniel.trophies),S(x.nik.trophies)],"Career Statistics (summary)"],
    ["standingsPoints","Standings (Career): career points Daniel : Nik",two(x.daniel.total,x.nik.total),"Standings (Career)"],
    ["standings_W","Standings (Career): Season Wins (Daniel / Nik)",two(x.daniel.W,x.nik.W),"Standings (Career)"],
    ["standings_D","Standings (Career): Season Draws (Daniel / Nik)",two(x.daniel.D,x.nik.D),"Standings (Career)"],
    ["standings_L","Standings (Career): Season Losses (Daniel / Nik)",two(x.daniel.L,x.nik.L),"Standings (Career)"],
    ["standings_cl","Standings (Career): Champions Leagues (Daniel / Nik)",two(x.daniel.cl,x.nik.cl),"Standings (Career)"],
    ["standings_league","Standings (Career): League Titles (Daniel / Nik)",two(x.daniel.league,x.nik.league),"Standings (Career)"],
    ["standings_cup","Standings (Career): Domestic Cups (Daniel / Nik)",two(x.daniel.cup,x.nik.cup),"Standings (Career)"],
    ["standings_trophies","Standings (Career): Total Trophies (Daniel / Nik)",two(x.daniel.trophies,x.nik.trophies),"Standings (Career)"],
    ["recSeason","Trophy Room record: highest season score and holder",[S(Math.max(x.daniel.bestScore,x.nik.bestScore)),holder(x.daniel.bestScore,x.nik.bestScore).toUpperCase()],"Trophy Room (records)"],
    ["recPoints","Trophy Room record: highest league points and holder",[S(Math.max(x.daniel.highPoints,x.nik.highPoints)),holder(x.daniel.highPoints,x.nik.highPoints).toUpperCase()],"Trophy Room (records)"],
    ["recGoals","Trophy Room record: highest league goals and holder",[S(Math.max(x.daniel.highGoals,x.nik.highGoals)),holder(x.daniel.highGoals,x.nik.highGoals).toUpperCase()],"Trophy Room (records)"],
    ["recPerfect","Trophy Room record: most perfect (11-point) seasons and holder",[S(Math.max(x.daniel.perfect,x.nik.perfect)),holder(x.daniel.perfect,x.nik.perfect).toUpperCase()],"Trophy Room (records)"],
    ["cabChampion","Trophy Room cabinet: Showdown Champion (Daniel / Nik)",[cell(win==="daniel"?1:0),cell(win==="nik"?1:0)],"Trophy Room (cabinet)"],
    ["cabLeague","Trophy Room cabinet: League Title (Daniel / Nik)",[cell(x.daniel.league),cell(x.nik.league)],"Trophy Room (cabinet)"],
    ["cabCup","Trophy Room cabinet: Domestic Cup (Daniel / Nik)",[cell(x.daniel.cup),cell(x.nik.cup)],"Trophy Room (cabinet)"],
    ["cabCl","Trophy Room cabinet: Champions League (Daniel / Nik)",[cell(x.daniel.cl),cell(x.nik.cl)],"Trophy Room (cabinet)"],
    ["legacyScore",`Legacy card: Showdown result ${tt.daniel.total} – ${tt.nik.total}`,two(tt.daniel.total,tt.nik.total),"Legacy"],
    ["legacySeasons",`Legacy card: ${N} / ${N} Seasons`,two(N,N),"Legacy"],
    ["legacyDraw",win==="draw"?"Legacy card marks the Showdown as a DRAW":"Legacy card does not call a decided Showdown a DRAW",win==="draw",  "Legacy"],
  ];
  const hiddenKeys=["rankDaniel","rankNik","recSeason","recPoints","recGoals","recPerfect"].filter(k=>!visible[k]||!visible[k].length);
  for(const [key,text,want,screen] of rows){if(hiddenKeys.includes(key))continue;await eq(m,id(key),text,f[key],want,{screen});}
  const avg=(k,d,n,text)=>check(m,id(k),text,f[k]&&near(f[k][0],d)&&near(f[k][1],n),`expected ${d.toFixed(1)} / ${n.toFixed(1)}, shown ${JSON.stringify(f[k])}`,{screen:"Career Statistics (comparison)"});
  await avg("compareAvgPoints",x.daniel.avgPoints,x.nik.avgPoints,"Career Statistics comparison: average league points");
  await avg("compareAvgGoals",x.daniel.avgGoals,x.nik.avgGoals,"Career Statistics comparison: average league goals");
  // The ranking strip and the ALL-TIME RECORDS must be readable on screen (on a phone they sit behind MORE)
  const hidden=["rankDaniel","rankNik","recSeason","recPoints","recGoals","recPerfect"].filter(k=>!visible[k]||!visible[k].length);
  await check(m,id("trophy.visibleDetails"),"Trophy Room shows the career ranking and the ALL-TIME RECORDS to the player (phone: behind MORE)",hidden.length===0,`not visible on screen (viewport ${m.viewport.width}x${m.viewport.height}): ${hidden.join(", ")}; the MORE sheet contains only: "${raw.trophyRoomSheet||""}"`,{screen:"Trophy Room (ranks and records)"});
  // Trophy Room ranking (the better manager is #1: more career points, then more season wins)
  for(const u of ["daniel","nik"]){
    if(hiddenKeys.includes(u==="daniel"?"rankDaniel":"rankNik"))continue;
    const o=u==="daniel"?"nik":"daniel",ahead=x[u].total!==x[o].total?x[u].total>x[o].total:x[u].W!==x[o].W?x[u].W>x[o].W:null;
    const wantRank=ahead===null?null:ahead?"1":"2";
    const got=f[u==="daniel"?"rankDaniel":"rankNik"];
    await check(m,id(`rank.${u}`),`Trophy Room ranking: ${NAMES[u]} career points ${x[u].total} and season wins ${x[u].W}${wantRank?`, rank #${wantRank}`:""}`,got&&got.length===3&&got[1]===S(x[u].total)&&got[2]===S(x[u].W)&&(!wantRank||got[0]===wantRank),`expected rank ${wantRank||"?"} ${x[u].total} points ${x[u].W} wins, shown ${JSON.stringify(got)}`,{screen:"Trophy Room"});
  }
  const lead2=x.daniel.total!==x.nik.total?(x.daniel.total>x.nik.total?"DANIEL":"NIK"):x.daniel.W!==x.nik.W?(x.daniel.W>x.nik.W?"DANIEL":"NIK"):null;
  if(lead2)await check(m,id("standings.leader"),`Standings (Career) names ${lead2} as the career leader`,f.standingsLeads[0]===lead2,JSON.stringify(f.standingsLeads),{screen:"Standings (Career)"});
  if(win==="draw")await check(m,id("trophy.cabinet.notwon"),"Trophy Room: a DRAWN Showdown has no champion (NOT WON YET)",f.cabNotWon,"NOT WON YET text missing",{screen:"Trophy Room (cabinet)"});
}
// The same screens must read identically on every browser, including a fresh browser with empty local storage.
// Phone and desktop lay screens out differently, so different-viewport browsers are compared on the figures they show;
// the same manager in the same viewport (original, storage cleared, fresh browser) is compared on the exact text.
async function checkIdentical(raws,label,viewports){
  const names=Object.keys(raws),facts=Object.fromEntries(names.map(n=>[n,extractHistory(raws[n])]));
  const firstDiff=(a,b)=>{let i=0;while(i<a.length&&a[i]===b[i])i++;return `first difference at char ${i}: "${a.slice(Math.max(0,i-40),i+60)}" vs "${b.slice(Math.max(0,i-40),i+60)}"`;};
  for(const other of names.slice(1)){
    const a=facts[names[0]],b=facts[other];
    const empty=v=>v===null||(Array.isArray(v)&&v.length===0),diffs=Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])&&!(/^(rank|rec)/.test(k)&&(empty(a[k])||empty(b[k])))).map(k=>`${k}: ${JSON.stringify(a[k])} vs ${JSON.stringify(b[k])}`);
    await check(null,`ident.${label}.figures.${names[0]}-${other}`,`every figure on the history screens reads the same on ${names[0]} and ${other}`,diffs.length===0,diffs.join("; "),{screen:"History screens (both browsers)"});
  }
  for(const user of ["daniel","nik"]){
    const group=names.filter(n=>n===user||n.startsWith(`${user}-`));
    for(const other of group.slice(1)){
      for(const host of ["careerStatistics","standings","legacy","trophyRoom"]){
        const keys=new Set([...Object.keys(raws[group[0]][host]||{}),...Object.keys(raws[other][host]||{})]);
        const bad=[];for(const k of keys){const A=raws[group[0]][host]?.[k]||"",B=raws[other][host]?.[k]||"";if(A!==B)bad.push(`[${k}] ${firstDiff(A,B)}`);}
        await check(null,`ident.${label}.text.${host}.${group[0]}-${other}`,`${host} reads exactly the same on ${group[0]} and ${other}`,bad.length===0,bad.join(" | "),{screen:host});
      }
    }
  }
}
async function finalChecks(daniel,nik,plan,setup,browser){
  const N=SEASONS,t=tally(plan,N),win=overallWinner(t);
  let closeMode="auto";
  for(const m of [daniel,nik]){
    await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
    const first=await probe(m,"#v10ExitSlot #completeSeason");
    report.observations=report.observations||[];report.observations.push({where:"REVIEW SEASON button the moment the Showdown Champion screen first appears",user:m.user,probe:first,closedYet:await textOf(m,"#sharedTerminalCloseHeading")});
  }
  // Terminal close: normally automatic; if a CLOSE button is offered, Daniel taps it like a player would.
  const closeDeadline=Date.now()+90000;
  while(Date.now()<closeDeadline){
    const states=await Promise.all([daniel,nik].map(m=>m.page.evaluate(()=>({closed:(document.getElementById("sharedTerminalCloseHeading")?.textContent||"")==="SHARED SHOWDOWN CLOSED",btn:Boolean(document.getElementById("sharedTerminalCloseAction")&&document.getElementById("sharedTerminalCloseAction").getClientRects().length&&!document.getElementById("sharedTerminalCloseAction").disabled)}))));
    if(states.every(s=>s.closed))break;
    if(states[0].btn){closeMode="tap";await daniel.page.locator("#sharedTerminalCloseAction").click({timeout:10000}).catch(()=>{});}
    await daniel.page.waitForTimeout(1000);
  }
  report.terminalCloseMode=closeMode;
  for(const m of [daniel,nik])await check(m,`final.closed.wait.${m.user}`,"the Showdown reaches SHARED SHOWDOWN CLOSED",(await textOf(m,"#sharedTerminalCloseHeading"))==="SHARED SHOWDOWN CLOSED",await textOf(m,"#sharedTerminalCloseHeading"),{screen:"Terminal close"});
  const rivalry=await admin(`rivalries/${setup.rivalryId}`);
  const w=field(rivalry,"data","terminalClose");
  await check(null,"final.db.terminal","database: rivalry is closed with the right winner and totals",field(rivalry,"data","connectionState")?.stringValue==="closed"&&field(w,"winner")?.stringValue===(win==="draw"?"draw":ROLE[win])&&field(w,"managerTotals","playerOne")?.integerValue===String(t.daniel.total)&&field(w,"managerTotals","playerTwo")?.integerValue===String(t.nik.total),{state:field(rivalry,"data","connectionState"),terminal:w},{screen:"Database"});
  gameplayEnd=Date.now(); // terminal witness verified; subsequent checks audit completed records.
  for(const m of [daniel,nik]){
    await checkFinalWinnerScreen(m,plan,t,win,"live");
    await shot(m,"final-winner-live");
    await checkFinalCells(m,"live");
    await checkExitButtons(m,"live");
  }
  // BACK TO SHOWDOWN HOME is a real tap: it must take each manager to Showdown Home (the main menu).
  for(const m of [daniel,nik]){
    let landed=false,why="";
    try{await m.page.locator("#v10ExitSlot [data-smart-back]").first().click({timeout:8000});landed=await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false);}catch(error){why=String(error.message).split("\n")[0];}
    await check(m,`final.backHome.tap.${m.user}`,"tapping BACK TO SHOWDOWN HOME on the Showdown Champion screen opens Showdown Home",landed,why||await describe(m),{screen:"Showdown Champion"});
  }
  // Reload on the finished Showdown: where does each manager land and is the result still there?
  for(const m of [daniel,nik])await reload(m);
  for(const m of [daniel,nik]){
    const where=await describe(m);report.observations=report.observations||[];report.observations.push({where:"after reload on finished showdown",user:m.user,state:where});
    await check(m,`final.reload.home.${m.user}`,"after a reload on the finished Showdown the manager lands on Showdown Home",await m.page.locator("#mainMenu").isVisible().catch(()=>false),where,{screen:"Showdown Home"});
  }
  await careerScreens(daniel,nik,plan,t,win,"final",setup.clubs);
  report.historyRaw=report.historyRaw||{};
  await phase("rivalry-final",async()=>{
    for(const m of [daniel,nik]){
      await backToShowdownHome(m);
      const out={};
      try{
        report.seededSteps.push(`Rivalry Statistics after the close (${m.user}): opened by the app function openRivalryStatistics() (no button leads to it from Showdown Home)`);
        await m.page.evaluate(()=>{try{window.openRivalryStatistics();}catch(e){}});
        const st=await settleRivalry(m,20000);out.text=st.text;out.stuck=st.stuck;
        await shot(m,"rivalry-statistics-final");dumpScreen(m,"rivalry-final",out.text||"");
      }catch(error){out.error=String(error.message).split("\n")[0];}
      report.rivalryRaw=report.rivalryRaw||{};(report.rivalryRaw[m.user]=report.rivalryRaw[m.user]||{}).final=out;
      await check(m,`final.rivalry.loads.${m.user}`,"RIVALRY STATISTICS of the finished Showdown finishes loading",Boolean(out.text)&&!out.stuck,`"${(out.text||out.error||"").slice(0,200)}"`,{screen:"Rivalry Statistics"});
      await backToShowdownHome(m);
    }
  });
  for(const m of [daniel,nik]){report.historyRaw[m.user]=await captureHistory(m,"final");if(DEBUG)console.log("HISTORYRAW",m.user,JSON.stringify(report.historyRaw[m.user]).slice(0,6000));}
  // (a) every number against the seasons actually played, (c) both browsers identical
  await phase("history-numbers",async()=>{
    for(const m of [daniel,nik])await checkHistoryNumbers(m,report.historyRaw[m.user],"final",plan,win);
    await checkIdentical({daniel:report.historyRaw.daniel,nik:report.historyRaw.nik},"final");
  });
  // (b) the screens must not depend on this browser's local storage: wipe it, reload, read again
  await phase("history-cleared-storage",async()=>{
    for(const m of [daniel,nik]){
      try{
        // Google sign-in uses browserSessionPersistence (sessionStorage), so only localStorage is wiped: that is what "local storage" means for the game's own data.
        const before=await m.page.evaluate(()=>{const keys=Object.keys(localStorage).map(k=>`${k}:${(localStorage.getItem(k)||"").length}`);try{localStorage.clear();}catch(_e){}return keys;});
        await reload(m);
        const raw=await captureHistory(m,"cleared");report.historyRaw[`${m.user}-cleared`]=raw;report.clearedStorageKeys=report.clearedStorageKeys||{};report.clearedStorageKeys[m.user]=before;
        await checkHistoryNumbers({...m,user:`${m.user}-cleared`,page:m.page,context:m.context,log:m.log,viewport:m.viewport},raw,"cleared",plan,win);
      }catch(error){await addProblem(m,`hist.cleared.${m.user}`,"History after clearing local storage",`could not read the history screens after local storage was cleared and the page reloaded: ${String(error.message).split("\n")[0]}`,{severity:"harness-or-game"});}
    }
  });
  // (b) a brand-new browser (empty local storage) signs in as each manager and must read the same records online
  await phase("history-fresh-browser",async()=>{
    report.fresh=report.fresh||{};
    for(const user of ["daniel","nik"]){
      let fresh=null;
      try{
        fresh=await openManagerAs(browser,user,`${user}-fresh`);
        await signIn(fresh,NAMES[user]);
        const local=await fresh.page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}));report.fresh[user]={storageAtSignIn:local};
        const raw=await captureHistory(fresh,"fresh");report.historyRaw[`${user}-fresh`]=raw;
        await checkHistoryNumbers(fresh,raw,"fresh",plan,win);
      }catch(error){
        await addProblem(fresh,`hist.fresh.${user}`,"Sign in on another browser",`could not read the history screens on a fresh browser signed in as ${NAMES[user]}: ${String(error.message).split("\n")[0]}`,{severity:"harness-or-game"});
      }finally{if(fresh)await fresh.context.close().catch(()=>{});}
    }
    const raws={};for(const k of ["daniel","nik","daniel-cleared","nik-cleared","daniel-fresh","nik-fresh"])if(report.historyRaw[k])raws[k]=report.historyRaw[k];
    await checkIdentical(raws,"all");
  });
}

main().catch(error=>{console.error(error);try{report.verdict="FAIL";report.fatal=report.fatal||{message:String(error&&error.message||error)};writeReport();}catch(_e){}process.exit(1);});
