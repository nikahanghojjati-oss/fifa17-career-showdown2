"use strict";
// r87 W3-4: private guesses stay private (browser layer, two real game pages).
// Daniel and Nik play the real game in two Chromium contexts against the Firebase Auth + Firestore emulators with the composed
// production Rules (the CE2PG setup: tests/browser/ce2pg-journey.cjs). One 1-season Showdown is started, set up and carried
// through the Transfer Challenge by taps and typing. At every private moment the PARTNER's phone is searched for the other
// manager's guesses and signings in:
//   dom       the whole document (outerHTML: hidden elements and attributes too) and every form field's live value
//   fields    the owner's guess and signing fields on the partner's page (empty, no chosen option behind them)
//   storage   localStorage, sessionStorage and every IndexedDB database
//   state     the transfer module's state (window.CareerModeProductionSharedTransferChallenge.getState())
//   received  every Firestore document the partner's app received (a test-only wrapper around the Firebase SDK reports each
//             getDoc / getDocs / onSnapshot / transaction.get result) and every Firestore REST answer the page loaded
//   logs      every console message of every level and every page error
// Moments: P1 Daniel typed guesses (not locked), P2 Daniel locked guesses, P3 both guesses locked (each side checked),
// P4 Daniel typed a signing (not locked), P5 Daniel locked signings. P2 and P5 are repeated after the partner goes offline and
// back (reconnect), in a second tab, and after a reload. P6 COMPLETED is the positive control: the same detectors must now
// FIND the revealed guesses and signings on both phones, so the earlier passes mean something.
// Threat model: normal play (the app as shipped). Emulator only; never contacts production Firebase.
// Run: node tests/browser/r87-guess-privacy-audit.cjs   (starts its own emulators and static server; needs firebase@12.17.0 in
//      node_modules and the composed Rules, which it builds when missing). Output: test-results/r87-guess-privacy.json.
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const PORT_BASE=Number(process.env.R87_PRIVACY_PORT_BASE||9560);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const PROJECT="demo-cms-browser-journey";// the emulator switch is pinned to this demo project id
const OUT_DIR=path.join(ROOT,"test-results");
const TAG="r87-guess-privacy";
const REPORT_PATH=path.join(OUT_DIR,`${TAG}.json`);

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

const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const rosterRoulette=require("./support/roster-roulette.cjs");

const APP_PORT=Number(process.env.R87_PRIVACY_APP_PORT||4661);
const BASE=(process.env.CMS_BASE_URL||`http://127.0.0.1:${APP_PORT}/`).replace(/\/?$/,"/");
const FIRESTORE=`http://127.0.0.1:${PORTS.firestore}`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const VIEWPORTS={daniel:{width:393,height:660},nik:{width:390,height:844}};
const NAMES={daniel:"Daniel",nik:"Nik"};
const norm=s=>String(s||"").replace(/\s+/g," ").trim();

// Each manager's private inputs. Daniel (playerOne) guesses Nik's signings in the p2Guess fields and signs in the p1Signing
// fields; Nik (playerTwo) guesses in p1Guess and signs in p2Signing (js/productionSharedTransferChallenge.js pstcGuessPrefix).
// Guess options are ones nothing else in this run uses (no wheel league, no club, no signing of either side).
const SECRETS={
  daniel:{role:"playerOne",guessPrefix:"p2",signPrefix:"p1",
    guesses:[{type:"league",label:"Hyundai A-League",id:"australia-a-league"},{type:"nationality",label:"Iceland",id:"iceland"}],
    signing:{name:"QXDANPRIV Alpha",overall:"74",position:"ST",league:"Premier League",nationality:"England"}},
  nik:{role:"playerTwo",guessPrefix:"p1",signPrefix:"p2",
    guesses:[{type:"league",label:"Jupiler Pro League",id:"belgium-pro-league"},{type:"nationality",label:"Wales",id:"wales"}],
    signing:{name:"ZVNIKPRIV Charlie",overall:"77",position:"CB",league:"Serie A TIM",nationality:"Brazil"}}
};
const OTHER={daniel:"nik",nik:"daniel"};

const report={tag:TAG,startedAt:new Date().toISOString(),checks:[],moments:[],baseline:{},summary:null,verdict:null};
function check(id,label,pass,detail){report.checks.push({id,label,pass:Boolean(pass),detail:pass?undefined:detail});console.log(`${pass?"PASS":"FAIL"} ${id}: ${label}${pass?"":` -> ${typeof detail==="string"?detail:JSON.stringify(detail).slice(0,900)}`}`);}
function writeReport(){const passed=report.checks.filter(c=>c.pass).length;report.summary={checks:report.checks.length,passed,failed:report.checks.length-passed};fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(REPORT_PATH,JSON.stringify(report,null,2));}

// ---------------------------------------------------------------------------------------------------------------------------
// Firestore data tap: a test-only wrapper served in place of the Firebase Firestore SDK module. It re-exports the real SDK and
// reports the data of every document the app receives to Node (__cmsPrivacyData). Same technique as support/firestore-meter.cjs.
// ---------------------------------------------------------------------------------------------------------------------------
const REAL_MODULE="__cms-privacy-real-firebase-firestore.js";
const TAP_SOURCE=`// Privacy data tap (tests/browser/r87-guess-privacy-audit.cjs). Test-only.
import * as R from "./${REAL_MODULE}";
export * from "./${REAL_MODULE}";
const send=(op,ref,payload)=>{try{if(typeof globalThis.__cmsPrivacyData!=="function")return;let p="?";try{p=ref&&ref.path?ref.path:(ref&&ref._query&&ref._query.path?"QUERY:"+ref._query.path.canonicalString():"?");}catch(_){}
  globalThis.__cmsPrivacyData({op,path:p,data:JSON.stringify(payload)});}catch(_){}};
const docData=s=>{try{return s&&typeof s.exists==="function"&&s.exists()?{path:s.ref&&s.ref.path,data:s.data()}:null;}catch(_){return null;}};
const qData=s=>{try{return s&&Array.isArray(s.docs)?s.docs.map(docData):docData(s);}catch(_){return null;}};
export async function getDoc(ref){const s=await R.getDoc(ref);send("getDoc",ref,docData(s));return s;}
export async function getDocFromServer(ref){const s=await R.getDocFromServer(ref);send("getDocFromServer",ref,docData(s));return s;}
export async function getDocFromCache(ref){const s=await R.getDocFromCache(ref);send("getDocFromCache",ref,docData(s));return s;}
export async function getDocs(q){const s=await R.getDocs(q);send("getDocs",q,qData(s));return s;}
export function onSnapshot(...args){
  const target=args[0],out=args.slice();
  const at=out.findIndex((a,i)=>i>0&&(typeof a==="function"||(a&&typeof a==="object"&&typeof a.next==="function")));
  if(at>0){const a=out[at];
    if(typeof a==="function")out[at]=s=>{send("onSnapshot",target,qData(s));return a(s);};
    else out[at]={...a,next:s=>{send("onSnapshot",target,qData(s));return a.next(s);}};
  }
  return R.onSnapshot(...out);
}
export function runTransaction(db,updateFn,options){
  return R.runTransaction(db,async transaction=>{
    const proxy={
      get:async ref=>{const s=await transaction.get(ref);send("tx.get",ref,docData(s));return s;},
      set:(ref,...a)=>{transaction.set(ref,...a);return proxy;},
      update:(ref,...a)=>{transaction.update(ref,...a);return proxy;},
      delete:ref=>{transaction.delete(ref);return proxy;}
    };
    return updateFn(proxy);
  },options);
}
`;

const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;
function wirePage(m,page){
  page.on("console",message=>{m.logs.push({t:Date.now(),type:message.type(),text:message.text()});});
  page.on("pageerror",error=>{m.logs.push({t:Date.now(),type:"pageerror",text:String(error&&error.stack||error)});m.pageErrors.push(String(error&&error.message||error));});
  page.on("request",request=>{try{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))m.forbidden.push(u.hostname);}catch(_e){}});
  page.on("response",async response=>{
    const url=response.url();if(!url.startsWith(FIRESTORE))return;
    // Firestore REST answers (batchGet / runQuery / commit and the Listen channel's chunks) as the page loaded them.
    try{const body=await response.text();if(body)m.received.push({t:Date.now(),op:"net",path:url.slice(0,160),data:body});}catch(_e){}
  });
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
}
async function openManager(browser,account){
  const context=await browser.newContext({viewport:VIEWPORTS[account]});
  const m={user:NAMES[account],account,context,page:null,logs:[],received:[],pageErrors:[],forbidden:[]};
  await context.exposeBinding("__cmsPrivacyData",(_source,event)=>{m.received.push({t:Date.now(),...event});});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  // Registered after the SDK route, so it answers firebase-firestore.js first (Playwright runs the newest matching route first).
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/,route=>route.fulfill({body:TAP_SOURCE,contentType:"text/javascript; charset=utf-8"}));
  await context.route(new RegExp(`^https:\\/\\/www\\.gstatic\\.com\\/firebasejs\\/[\\d.]+\\/${REAL_MODULE.replace(/[.-]/g,"\\$&")}$`),route=>route.fulfill({path:path.join(SDK_DIR,"firebase-firestore.js"),contentType:"text/javascript; charset=utf-8"}));
  await context.addInitScript({path:SWITCH});
  context.on("page",page=>wirePage(m,page));
  m.page=await context.newPage();
  await installMarbleConfirmAnswers(m.page,{answer:true});
  await m.page.goto(urlFor(account),{waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return m;
}
async function describe(m){
  return m.page.evaluate(()=>`screens=${[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",")} | transfer=${document.getElementById("transferChallenge")?.dataset.transferPhase||"-"} | pair=${window.CareerModePersistentNikDanielPair?.getState?.()?.status||"-"}`).catch(e=>e.message);
}

// ---------------------------------------------------------------------------------------------------------------------------
// The game flow (as tests/browser/ce2pg-journey.cjs: sign in, Daniel's START, Nik types the code, setup, career start, roulette)
// ---------------------------------------------------------------------------------------------------------------------------
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
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
async function signIn(m){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${m.user} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,m.user.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
  await backToShowdownHome(m);
}
async function startAndJoin(daniel,nik){
  await backToShowdownHome(daniel);
  await daniel.page.locator("#newShowdown").click({timeout:30000});
  await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  await daniel.page.locator("#roundAmount").selectOption("1");
  await daniel.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(daniel).locator("code").waitFor({timeout:30000});
  const code=(await pairPanel(daniel).locator("code").innerText()).trim();
  await backToShowdownHome(nik);
  await nik.page.locator("#newShowdown").click();
  await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
  await nik.page.waitForTimeout(500);
  await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
  await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code);
  await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getState?.()?.connectionState==="active",null,{timeout:45000});
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
  }
}
async function playSetup(daniel,nik){
  for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
  await daniel.page.locator("#spinLeague").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
  await daniel.page.locator("#openClubPack").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
  const clubs=await daniel.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
  await nik.page.waitForFunction(c=>document.getElementById("clubNameOne")?.textContent?.trim()===c[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===c[1],clubs,{timeout:30000});
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  await nik.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:`I STARTED AT ${clubs[0].toUpperCase()}`,exact:true}).click({timeout:30000});
  await nik.page.getByRole("button",{name:`I STARTED AT ${clubs[1].toUpperCase()}`,exact:true}).click({timeout:30000});
  for(const m of [daniel,nik]){await rosterRoulette.waitForTransfer(m.page,60000);await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});}
  return clubs;
}
const transferPhase=m=>m.page.evaluate(()=>document.getElementById("transferChallenge")?.dataset.transferPhase||null).catch(()=>null);
const waitTransferPhase=(m,phase,timeout=45000)=>m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout});
async function fillCombo(m,id,value){await m.page.locator(`#${id}`).fill(value);await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});}
// After a reload or in a new tab: the app should route back into the transfer challenge by itself; if it lands on the season
// dashboard, the manager taps its primary action (what a person would do).
async function backToTransfer(m,page,phase){
  const until=Date.now()+45000;
  while(Date.now()<until){
    if(await page.evaluate(p=>{const s=document.getElementById("transferChallenge");return Boolean(s&&s.dataset.transferPhase===p&&s.getClientRects().length>0&&!s.classList.contains("hidden"));},phase).catch(()=>false))return true;
    // A new tab starts on Showdown Home (the resume hint is per tab); once the pair loads, its tile reads CONTINUE SHOWDOWN.
    const tile=page.locator("#mainMenu:visible #newShowdown");
    if(await tile.count()&&/CONTINUE/i.test(await tile.locator(".menuTileLabel").textContent().catch(()=>""))){await tile.click({timeout:3000}).catch(()=>{});await page.waitForTimeout(1500);continue;}
    const primary=page.locator("#seasonPrimaryAction");
    if(await primary.isVisible().catch(()=>false)&&await primary.isEnabled().catch(()=>false))await primary.click({timeout:3000}).catch(()=>{});
    await page.waitForTimeout(700);
  }
  return false;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The privacy probe
// ---------------------------------------------------------------------------------------------------------------------------
// What on the observer's phone would give away the owner's secret: texts searched everywhere, ids searched where data lives.
function secretTerms(owner,{guesses=true,signing=true,domGuessLabels=[]}={}){
  const s=SECRETS[owner],text=[],ids=[];
  if(signing){text.push(s.signing.name,s.signing.name.split(" ")[0]);}
  if(guesses){for(const g of s.guesses){ids.push(g.id,`"valueId":"${g.id}"`);}}
  return {text,ids,domText:[...text,...domGuessLabels]};
}
function ownerFieldIds(owner,{guesses=true,signing=true}={}){
  const s=SECRETS[owner],ids=[];
  if(guesses)for(let i=1;i<=3;i+=1)ids.push(`${s.guessPrefix}Guess${i}Type`,`${s.guessPrefix}Guess${i}Value`);
  if(signing)for(let i=1;i<=3;i+=1)for(const f of ["Name","Overall","Position","League","Nationality"])ids.push(`${s.signPrefix}Signing${i}${f}`);
  return ids;
}
async function pageSnapshot(page,fieldIds){
  return page.evaluate(async ids=>{
    const values=[...document.querySelectorAll("input,select,textarea")].map(n=>`${n.id||"?"}=${n.value||""}|${n.dataset?.canonicalId||""}|${n.dataset?.canonicalLabel||""}`).join("\n");
    const storage=[];for(const st of [window.localStorage,window.sessionStorage]){try{for(let i=0;i<st.length;i+=1){const k=st.key(i);storage.push(`${k}=${st.getItem(k)}`);}}catch(_e){}}
    const idb=[];
    try{
      const dbs=typeof indexedDB.databases==="function"?await indexedDB.databases():[];
      for(const info of dbs){
        idb.push(`DB ${info.name}`);
        await new Promise(resolve=>{let req;try{req=indexedDB.open(info.name);}catch(_e){resolve();return;}
          req.onerror=()=>resolve();req.onblocked=()=>resolve();
          req.onsuccess=()=>{const db=req.result,names=[...db.objectStoreNames];if(!names.length){db.close();resolve();return;}
            let tx;try{tx=db.transaction(names,"readonly");}catch(_e){db.close();resolve();return;}
            let left=names.length;for(const n of names){const r=tx.objectStore(n).getAll();r.onsuccess=()=>{try{idb.push(`${n}: ${JSON.stringify(r.result)}`);}catch(_e){idb.push(`${n}: <unserializable>`);}if(--left===0){db.close();resolve();}};r.onerror=()=>{if(--left===0){db.close();resolve();}};}};});
      }
    }catch(_e){}
    let state="";try{state=JSON.stringify(window.CareerModeProductionSharedTransferChallenge?.getState?.()??null);}catch(_e){state="<unserializable>";}
    const fields=ids.map(id=>{const n=document.getElementById(id);return n?{id,value:String(n.value||""),canonicalId:n.dataset?.canonicalId||"",canonicalLabel:n.dataset?.canonicalLabel||""}:{id,missing:true};});
    return {html:document.documentElement.outerHTML,values,storage:storage.join("\n"),idb:idb.join("\n"),state,fields,phase:document.getElementById("transferChallenge")?.dataset.transferPhase||null};
  },fieldIds);
}
function hits(haystack,needles){return needles.filter(n=>n&&haystack.includes(n));}
async function probe(observer,owner,moment,{page=observer.page,guesses=true,signing=true,since=0,control=false}={}){
  const terms=secretTerms(owner,{guesses,signing,domGuessLabels:guesses?(report.baseline[observer.account]?.absentGuessLabels?.[owner]||[]):[]});
  const fieldIds=ownerFieldIds(owner,{guesses,signing});
  const snap=await pageSnapshot(page,fieldIds);
  const received=observer.received.filter(e=>e.t>=since).map(e=>`${e.op} ${e.path} ${e.data}`).join("\n");
  const logs=observer.logs.filter(e=>e.t>=since).map(e=>`${e.type}: ${e.text}`).join("\n");
  const found={
    dom:hits(snap.html,terms.domText),
    values:hits(snap.values,[...terms.text,...terms.ids.filter(x=>!x.startsWith('"'))]),
    fields:snap.fields.filter(f=>!f.missing&&(f.canonicalId||f.canonicalLabel||(f.value&&!/Type$/.test(f.id)))).map(f=>`${f.id}=${f.value}|${f.canonicalId}`),
    storage:hits(snap.storage,[...terms.text,...terms.ids]),
    idb:hits(snap.idb,[...terms.text,...terms.ids]),
    state:hits(snap.state,[...terms.text,...terms.ids]),
    received:hits(received,[...terms.text,...terms.ids]),
    logs:hits(logs,[...terms.text,...terms.ids])
  };
  // A guess TYPE select (league / nationality) alone is not secret, but a chosen value behind it is; the Type fields of the owner
  // must still be blank before the reveal, because "league" vs "nationality" is part of the guess.
  const typeSet=snap.fields.filter(f=>!f.missing&&/Type$/.test(f.id)&&f.value).map(f=>`${f.id}=${f.value}`);
  found.fields.push(...typeSet);
  const leaks=Object.entries(found).filter(([,v])=>v.length).map(([k,v])=>`${k}: ${v.join(", ")}`);
  const entry={moment,observer:observer.user,owner:NAMES[owner],phase:snap.phase,what:`${guesses?"guesses":""}${guesses&&signing?" + ":""}${signing?"signings":""}`,receivedDocs:observer.received.filter(e=>e.t>=since).length,logLines:observer.logs.filter(e=>e.t>=since).length,leaks};
  report.moments.push(entry);
  if(!control)check(`${moment}.${observer.account}`,`${moment}: ${observer.user}'s phone holds nothing of ${NAMES[owner]}'s private ${entry.what} (dom, fields, storage, IndexedDB, state, received Firestore data, logs)`,leaks.length===0,leaks.join(" || "));
  return {found,snap};
}
async function reconnect(m){
  await m.context.setOffline(true);
  await m.page.waitForTimeout(3000);
  await m.context.setOffline(false);
  await m.page.evaluate(()=>{try{window.dispatchEvent(new Event("online"));document.dispatchEvent(new Event("visibilitychange"));}catch(_e){}});
  await m.page.waitForTimeout(6000);
}
async function secondTab(m,phase){
  const page=await m.context.newPage();
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(m.account),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000}).catch(()=>{});
  // The emulator harness keeps the sign-in per page, so the new tab signs in as the same manager first (one more tap than a
  // phone, where the sign-in is remembered).
  if(await page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent==="SIGN IN").catch(()=>false)){
    await page.locator("#newShowdown").click({timeout:10000}).catch(()=>{});
    await page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000}).catch(()=>{});
    await page.getByRole("button",{name:new RegExp(`^${m.user} · PLAYER`,"i")}).click({timeout:30000}).catch(()=>{});
    await page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,m.user.toUpperCase(),{timeout:30000}).catch(()=>{});
  }
  const routed=await backToTransfer(m,page,phase);
  if(!routed&&process.env.R87_PRIVACY_DEBUG==="1")console.log("SECOND TAB",await page.evaluate(()=>({badge:document.getElementById("onlinePlayerIdentityBadge")?.textContent,tile:document.querySelector("#newShowdown")?.innerText,id:window.CareerModeOnlinePlayerIdentity?.getState?.(),acct:window.CareerModeSparkConnectedAccount?.getState?.(),pair:window.CareerModePersistentNikDanielPair?.getState?.()?.status})).catch(e=>e.message));
  return {page,routed};
}
async function reloadInto(m,phase){
  await m.page.reload({waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000}).catch(()=>{});
  return backToTransfer(m,m.page,phase);
}
// The full set of ways back at one moment: live, after a reconnect, in a second tab, after a reload.
async function probeEveryWay(observer,owner,moment,phase,opts){
  await probe(observer,owner,`${moment}.live`,opts);
  await reconnect(observer);
  await probe(observer,owner,`${moment}.reconnect`,opts);
  const tab=await secondTab(observer,phase);
  check(`${moment}.secondTab.routed.${observer.account}`,`${moment}: a second ${observer.user} tab opens the transfer challenge (${phase})`,tab.routed,await describe({page:tab.page}));
  await probe(observer,owner,`${moment}.secondTab`,{...opts,page:tab.page});
  await tab.page.close().catch(()=>{});
  const routed=await reloadInto(observer,phase);
  check(`${moment}.reload.routed.${observer.account}`,`${moment}: ${observer.user} comes back to the transfer challenge (${phase}) after a reload`,routed,await describe(observer));
  await probe(observer,owner,`${moment}.reload`,opts);
}

async function main(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  if(put.status!==200)throw new Error(`composed Rules did not load (${put.status})`);
  let server=null;
  if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});await new Promise(resolve=>setTimeout(resolve,800));}
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];let failure=null;
  try{
    const daniel=await openManager(browser,"daniel");managers.push(daniel);
    const nik=await openManager(browser,"nik");managers.push(nik);
    for(const m of [daniel,nik])check(`boot.switch.${m.account}`,`${m.user}: emulator switch active`,await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),"switch inactive");
    await signIn(daniel);await signIn(nik);
    await startAndJoin(daniel,nik);
    const clubs=await playSetup(daniel,nik);
    console.log(`Showdown set up: ${clubs.join(" v ")}`);
    const sdkTapped=daniel.received.length>0&&nik.received.length>0;
    check("boot.tap","the Firestore data tap sees what both apps receive",sdkTapped,{daniel:daniel.received.length,nik:nik.received.length});

    // Window: Daniel starts, both end it early.
    await daniel.page.waitForFunction(()=>document.getElementById("startTransferTimer")&&!document.getElementById("startTransferTimer").classList.contains("hidden"),null,{timeout:45000});
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
    await daniel.page.locator("#endTransferTimer").click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.locator("#endTransferTimer").click({timeout:30000});
    await waitTransferPhase(nik,"guess_entry");await waitTransferPhase(daniel,"guess_entry");

    // Baseline: which guess labels never appear in the observer's page on their own (those are then searched in the whole DOM).
    for(const m of [daniel,nik]){
      const html=await m.page.evaluate(()=>document.documentElement.outerHTML);
      const owner=OTHER[m.account];
      report.baseline[m.account]={absentGuessLabels:{[owner]:SECRETS[owner].guesses.map(g=>g.label).filter(l=>!html.includes(l))},presentGuessLabels:SECRETS[owner].guesses.map(g=>g.label).filter(l=>html.includes(l))};
    }
    console.log(`baseline: ${JSON.stringify(report.baseline)}`);

    // P1: Daniel types his guesses (saved as an on-device draft), not locked.
    const D=SECRETS.daniel,N=SECRETS.nik;
    for(let i=0;i<D.guesses.length;i+=1){await daniel.page.locator(`#${D.guessPrefix}Guess${i+1}Type`).selectOption(D.guesses[i].type);await fillCombo(daniel,`${D.guessPrefix}Guess${i+1}Value`,D.guesses[i].label);}
    await daniel.page.waitForTimeout(1500);
    const draftKey=await daniel.page.evaluate(()=>Object.keys(localStorage).filter(k=>/transferGuess$/.test(k)));
    check("P1.draft.daniel","P1: Daniel's half-typed guesses are kept as a draft on Daniel's own phone (control: the storage probe looks where drafts live)",draftKey.length===1,draftKey);
    await probe(nik,"daniel","P1-daniel-typed-guesses",{signing:false});

    // P2: Daniel locks his guesses.
    await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:45000});
    await probeEveryWay(nik,"daniel","P2-daniel-locked-guesses","guess_entry",{signing:false});

    // P3: Nik types and locks his guesses: SIGNING_ENTRY. Each side checked for the other's guesses.
    for(let i=0;i<N.guesses.length;i+=1){await nik.page.locator(`#${N.guessPrefix}Guess${i+1}Type`).selectOption(N.guesses[i].type);await fillCombo(nik,`${N.guessPrefix}Guess${i+1}Value`,N.guesses[i].label);}
    await probe(daniel,"nik","P3a-nik-typed-guesses",{signing:false});
    await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"signing_entry");await waitTransferPhase(daniel,"signing_entry");
    await probe(nik,"daniel","P3-both-guesses-locked",{signing:false});
    await probe(daniel,"nik","P3-both-guesses-locked",{signing:false});
    const routedD=await reloadInto(daniel,"signing_entry");
    check("P3.reload.routed.daniel","P3: Daniel comes back to signings after a reload",routedD,await describe(daniel));
    await probe(daniel,"nik","P3-both-guesses-locked.reload",{signing:false});

    // P4: Daniel types a signing (draft), not locked.
    const fillSigning=async(m,s)=>{await m.page.locator(`#${s.signPrefix}Signing1Name`).fill(s.signing.name);await m.page.locator(`#${s.signPrefix}Signing1Overall`).fill(s.signing.overall);await m.page.locator(`#${s.signPrefix}Signing1Position`).selectOption(s.signing.position);await fillCombo(m,`${s.signPrefix}Signing1League`,s.signing.league);await fillCombo(m,`${s.signPrefix}Signing1Nationality`,s.signing.nationality);};
    await fillSigning(daniel,D);await daniel.page.waitForTimeout(1500);
    await probe(nik,"daniel","P4-daniel-typed-signing");

    // P5: Daniel locks his signings; Nik still entering his.
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:45000});
    await probeEveryWay(nik,"daniel","P5-daniel-locked-signings","signing_entry",{});
    await probe(daniel,"nik","P5-daniel-locked-signings",{signing:false});

    // P6: Nik locks: COMPLETED. Positive control: the same detectors now find the revealed data on both phones.
    const revealAt=Date.now();
    await fillSigning(nik,N);
    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
    await nik.page.waitForTimeout(2500);
    for(const [observer,owner] of [[nik,"daniel"],[daniel,"nik"]]){
      // The same probe, as a control: here the detectors must FIND the revealed data.
      const {found}=await probe(observer,owner,`P6-completed-positive-control`,{control:true});
      const name=SECRETS[owner].signing.name;
      check(`P6.control.dom.${observer.account}`,`P6 control: ${observer.user}'s page now shows ${NAMES[owner]}'s signing "${name}" (the DOM detector works)`,found.dom.includes(name),found.dom);
      check(`P6.control.received.${observer.account}`,`P6 control: ${observer.user}'s app has now received ${NAMES[owner]}'s signing and guesses from Firestore (the received-data detector works)`,found.received.includes(name)&&SECRETS[owner].guesses.every(g=>found.received.includes(`"valueId":"${g.id}"`)),found.received);
      const firstSeen=observer.received.find(e=>`${e.data}`.includes(name));
      check(`P6.control.timing.${observer.account}`,`P6 control: ${observer.user} first received ${NAMES[owner]}'s private data only after COMPLETED`,Boolean(firstSeen&&firstSeen.t>=revealAt),firstSeen?{t:firstSeen.t,revealAt,op:firstSeen.op,path:firstSeen.path}:"never received");
    }
    // The whole run's logs before the reveal, once more as one block (every level).
    for(const [observer,owner] of [[nik,"daniel"],[daniel,"nik"]]){
      const t=secretTerms(owner),pre=observer.logs.filter(e=>e.t<revealAt).map(e=>e.text).join("\n");
      check(`logs.prereveal.${observer.account}`,`${observer.user}'s console never printed ${NAMES[owner]}'s guesses or signings before the reveal`,hits(pre,[...t.text,...t.ids]).length===0,hits(pre,[...t.text,...t.ids]));
    }
  }catch(error){
    failure=error;report.fatal={message:String(error&&error.message||error).slice(0,1500),stack:String(error&&error.stack||"").split("\n").slice(0,8).join("\n")};
    for(const m of managers)report.fatal[`state_${m.account}`]=await describe(m);
    check("fatal","the privacy run completed",false,report.fatal);
  }finally{
    for(const m of managers){
      check(`zz.production.${m.account}`,`${m.user}: never contacted a production Firebase host`,m.forbidden.length===0,m.forbidden);
      check(`zz.pageerrors.${m.account}`,`${m.user}: no uncaught page errors`,m.pageErrors.length===0,m.pageErrors.slice(0,5));
    }
    report.verdict=report.checks.every(c=>c.pass)&&!failure?"PASS":"FAIL";
    writeReport();
    await browser.close().catch(()=>{});if(server)server.kill();
    console.log(`${report.verdict} ${TAG}: ${report.summary.passed}/${report.summary.checks} checks -> ${path.relative(ROOT,REPORT_PATH)}`);
  }
  process.exitCode=report.verdict==="PASS"?0:1;
}
main().catch(error=>{console.error(error);process.exit(1);});
