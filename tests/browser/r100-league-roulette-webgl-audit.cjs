"use strict";
// r100 Phoenix B1, Gate lane L10 (lead 2026-11-26): the real 3D League Roulette, with WebGL ON.
//
// Every other Gate browser lane runs the pinned Chromium with --disable-webgl (@sparticuz/chromium's default args), so the
// League Roulette there is always the 2D fallback and nothing ever tested the 3D board. Here, and only here, WebGL is on
// (SwiftShader through ANGLE, as CE2PG's RRR context-loss helper does): the page must have a working WebGL2, and while it
// has one the 2D wheel must never paint.
//
// Two runs, each a fresh pair playing a 1-season Showdown up to the Ball Game on the Firestore emulator (composed Rules):
//   run 1: Wooden,   Daniel 1920x866 (Chromebook windowed), Nik 390x844 (phone)
//   run 2: Graphite, Daniel 390x844,                       Nik 1920x866
// Beats, in order:
//   waiting    Daniel's START opens WAITING over the league screen before Nik has connected; Daniel reloads there
//              (resume-waiting); Nik signs in and waits for Daniel (wait-for-daniel) before his JOIN.
//   late-join  once both boards are up, Nik's tab closes; Daniel drops ball 1 alone; Nik opens a fresh tab and comes in
//              (still signed in on the device).
//   reload     Daniel reloads after ball 2, Nik reloads after ball 3.
//   ctxloss    WEBGL_lose_context on Daniel's board, restored 1 s later: the board must draw again (its on-screen picture
//              after the restore matches the one before the loss; a dead screen fails).
//   ctxlost    WEBGL_lose_context on Daniel's board, never restored: within 15 s a fresh board with a live WebGL2 context,
//              the same stage and no failure, matching the board's picture before the loss.
//   ball 4     Nik's last ball: both reach the Ball Game.
// A sampler in every page (an init script, so it survives reloads) checks every animation frame while a run is live:
//   - 2d-wheel:      #leagueWheel paints without lr3d-on (the 2D wheel) while WebGL2 works;
//   - old-plate:     any computed background-image or img source names ENV_BOX_*_V3;
//   - no-background: #background has no image while the league screen shows;
//   - loading-back:  the loading screen comes back after this page showed the 3D board;
//   - blank:         the loading screen is gone and no screen shows (a dead frame).
//   - empty-board:   the league screen shows no 3D board for more than 50 ms after the loading screen left.
//   - page-error:    any uncaught page error (exception or unhandled rejection) not named in KNOWN_PAGE_ERRORS.
// Sampling stops on each page once the Ball Game shows.
// Any of these, a WebGL2 that does not work, or a board that does not rebuild after the context loss fails the run. Each
// failure names the run, the beat, the phone, the size and the clubhouse.
// Run: node tests/browser/r100-league-roulette-webgl-audit.cjs (starts its own emulators; report test-results/r100-league-roulette-webgl.json)
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const OUT_DIR=path.join(ROOT,"test-results");
const REPORT_PATH=path.join(OUT_DIR,"r100-league-roulette-webgl.json");
const SHOT_DIR=path.join(OUT_DIR,"r100-league-roulette-webgl");
const PROJECT="demo-cms-browser-journey";
const PORT_BASE=Number(process.env.LRW_PORT_BASE||19810);
const PORTS={auth:PORT_BASE,firestore:PORT_BASE+1,hub:PORT_BASE+2,logging:PORT_BASE+3,websocket:PORT_BASE+4};
const APP_PORT=Number(process.env.LRW_APP_PORT||14911);

const DESKTOP={width:1920,height:866},PHONE={width:390,height:844};
const RUNS=Object.freeze([
  {name:"wooden",clubhouse:"",label:"Wooden",sizes:{daniel:DESKTOP,nik:PHONE}},
  {name:"graphite",clubhouse:"matte",label:"Graphite",sizes:{daniel:PHONE,nik:DESKTOP}}
]);
// WebGL on for this audit only: the pinned runtime's own args without the switches that turn GL off, plus SwiftShader.
const WEBGL_ARGS=Object.freeze(["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]);
function webglArgs(args){return args.filter(a=>a!=="--single-process"&&!/^--(disable-webgl|disable-gpu|use-gl|use-angle|enable-unsafe-swiftshader|ignore-gpu-blocklist)(=|$)/.test(a)).concat(WEBGL_ARGS);}
module.exports={RUNS,WEBGL_ARGS,webglArgs};
if(require.main!==module)return;

// Outside the emulators: build the composed Rules (always: the contract census rewrites the generated file with a stand-in
// that refuses the pair), start auth + Firestore, run this file inside them.
if(!process.env.FIRESTORE_EMULATOR_HOST){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
    const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,stdio:"inherit"});
    if(built.status!==0)process.exit(built.status||1);
  }
  const configPath=path.join(OUT_DIR,"r100-league-roulette-webgl.emulators.json");
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
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const BASE=(process.env.CMS_BASE_URL||`http://127.0.0.1:${APP_PORT}/`).replace(/\/?$/,"/");
const FIRESTORE=`http://127.0.0.1:${PORTS.firestore}`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;
const report={tool:"r100-league-roulette-webgl",startedAt:new Date().toISOString(),verdict:"RUNNING",runs:[],failures:[],notes:[]};
let runNow=null,beatNow="boot";
function writeReport(){report.finishedAt=new Date().toISOString();fs.mkdirSync(OUT_DIR,{recursive:true});fs.writeFileSync(REPORT_PATH,JSON.stringify(report,null,2));}
async function shot(m,name,page=m.page){try{fs.mkdirSync(SHOT_DIR,{recursive:true});const file=path.join(SHOT_DIR,`${runNow?.name||"x"}-${name}-${m.user}.png`.replace(/[^\w.\-]+/g,"_"));await page.screenshot({path:file,timeout:15000});return path.relative(ROOT,file);}catch(e){return `(no screenshot: ${String(e.message).split("\n")[0]})`;}}
const where=m=>`${runNow?.label||"?"} ${m.user} ${m.size.width}x${m.size.height}`;
const step=text=>console.log(`  [${runNow?.name||"-"}/${beatNow}] ${text}`);
async function fail(m,id,detail,page){
  const entry={run:runNow?.name||null,clubhouse:runNow?.label||null,beat:beatNow,phone:m?m.user:"both",size:m?`${m.size.width}x${m.size.height}`:null,id,detail:String(detail).slice(0,1200),screenshot:m?await shot(m,`${beatNow}-${id}`,page||m.page):null};
  report.failures.push(entry);console.log(`FAIL [${entry.run}/${entry.beat}] ${entry.phone} ${entry.size||""} ${id}: ${entry.detail.slice(0,400)}`);
}

async function loadComposedRules(){
  const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(docUrl("rivalries/probe"));
  if(put.status!==200||after.status!==403)throw new Error(`composed production Rules did not activate (PUT ${put.status}, open read ${after.status})`);
}
async function clearEmulators(){
  await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,{method:"DELETE"});
  await fetch(`http://127.0.0.1:${PORTS.auth}/emulator/v1/projects/${PROJECT}/accounts`,{method:"DELETE"});
}

// ---------------------------------------------------------------------------------------------------------------------------
// The sampler (runs in every page from its first script; survives reloads because it is an init script). It reports each
// violation once per page load per kind, as a console line "[lrw] {json}". window.__lrw.active turns it on and off; the
// state lives in sessionStorage so a reload keeps it.
// ---------------------------------------------------------------------------------------------------------------------------
const SAMPLER=()=>{
  if(window.top!==window)return;
  const KEY="lrw.active";
  const L=window.__lrw={seen:new Set(),board:false,frames:0,webgl2:null,get active(){try{return sessionStorage.getItem(KEY)==="1";}catch(_e){return false;}},set active(v){try{sessionStorage.setItem(KEY,v?"1":"0");}catch(_e){}}};
  const emit=(kind,detail)=>{if(L.seen.has(kind))return;L.seen.add(kind);console.log(`[lrw] ${JSON.stringify({kind,detail,t:Math.round(performance.now())})}`);};
  try{const c=document.createElement("canvas"),gl=c.getContext("webgl2");L.webgl2=Boolean(gl);if(gl)gl.getExtension("WEBGL_lose_context")?.loseContext();}catch(_e){L.webgl2=false;}
  const shown=el=>{if(!el||el.classList.contains("hidden"))return false;const cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden"||Number(cs.opacity)===0)return false;return el.getClientRects().length>0;};
  const OLD=/ENV_BOX_[A-Z0-9_]*_V3\b/;
  let lastScan=0;
  const tick=()=>{
    requestAnimationFrame(tick);
    if(!L.active||L.done||!document.body)return;
    // The audit ends at the Ball Game: once it shows, this page load stops sampling.
    if(shown(document.getElementById("clubWheelScreen"))){L.done=true;return;}
    L.frames+=1;
    const loading=shown(document.getElementById("loadingScreen"));
    const screen=document.getElementById("leagueWheelScreen"),wheel=document.getElementById("leagueWheel");
    const league=shown(screen);
    const three=Boolean(wheel&&wheel.classList.contains("lr3d-on")&&wheel.querySelector("canvas"));
    if(!loading&&league&&three)L.board=true;
    if(loading&&L.board)emit("loading-back","the loading screen came back after this page showed the 3D board");
    if(!loading&&![...document.querySelectorAll(".screen")].some(shown))emit("blank",`the loading screen is gone and no screen shows (shown: ${[...document.body.children].filter(shown).map(el=>el.id||el.tagName.toLowerCase()).slice(0,8).join(",")||"nothing"})`);
    // The league screen shows neither the 3D board nor anything else in its place for more than 50 ms (an empty screen).
    // After a forced context loss the room may show without a board until the board is drawn again: the audit sets
    // forcedLoss, and this rule is paused until a live board (lr3d-on, every canvas with a WebGL2 context not lost) is back.
    if(L.forcedLoss&&three&&[...wheel.querySelectorAll("canvas")].every(c=>{const gl=c.getContext("webgl2");return Boolean(gl&&!gl.isContextLost());}))L.forcedLoss=false;
    if(L.forcedLoss){L.emptySince=0;}
    else if(!loading&&league&&L.webgl2&&!three){if(!L.emptySince)L.emptySince=performance.now();else if(performance.now()-L.emptySince>50)emit("empty-board",`the league screen shows no 3D board for ${Math.round(performance.now()-L.emptySince)} ms after the loading screen left (lr3d-on ${Boolean(wheel&&wheel.classList.contains("lr3d-on"))}, canvases ${wheel?wheel.querySelectorAll("canvas").length:0}, wheel shown ${shown(wheel)})`);}else L.emptySince=0;
    if(!loading&&league){
      if(L.webgl2&&shown(wheel)&&!wheel.classList.contains("lr3d-on"))emit("2d-wheel",`#leagueWheel paints without lr3d-on (class "${wheel.className}")`);
      const bg=getComputedStyle(document.getElementById("background")||document.body).backgroundImage;
      if(!bg||bg==="none")emit("no-background","#background has no image on the league screen");
    }
    if(!loading&&performance.now()-lastScan>250){
      lastScan=performance.now();
      for(const el of document.querySelectorAll("body,body *")){
        const bg=getComputedStyle(el).backgroundImage;
        if(bg&&bg!=="none"&&OLD.test(bg)&&shown(el)){emit("old-plate",`${el.id?"#"+el.id:el.tagName.toLowerCase()} paints ${bg.match(OLD)[0]}`);break;}
        if(el.tagName==="IMG"&&OLD.test(el.currentSrc||el.src||"")&&shown(el)){emit("old-plate",`img ${el.currentSrc||el.src}`);break;}
      }
    }
  };
  requestAnimationFrame(tick);
};

// ---------------------------------------------------------------------------------------------------------------------------
// Phones
// ---------------------------------------------------------------------------------------------------------------------------
// Uncaught page errors (exceptions and unhandled rejections) fail the run. Only errors named here, each with the reason it is
// harmless, are let through (and listed in the report). None are known today.
const KNOWN_PAGE_ERRORS=Object.freeze([]);
async function openContext(browser,m){
  const context=await browser.newContext({viewport:m.size,deviceScaleFactor:1});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});});
  await context.addInitScript({path:SWITCH});
  if(runNow.clubhouse)await context.addInitScript(theme=>{try{localStorage.setItem("cmsClubhouseTheme",theme);}catch(_e){}},runNow.clubhouse);
  await context.addInitScript(SAMPLER);
  m.context=context;
}
async function newPage(m){
  const page=await m.context.newPage();
  page.on("console",msg=>{const t=msg.text();if(t.startsWith("[lrw] ")){let v=null;try{v=JSON.parse(t.slice(6));}catch(_e){}if(v){m.events.push({...v,beat:beatNow,page:m.pages});step(`${m.user} sampler: ${v.kind} ${String(v.detail).slice(0,160)}`);}}});
  page.on("pageerror",e=>{const msg=String(e&&e.message||e).slice(0,300);const known=KNOWN_PAGE_ERRORS.find(k=>k.match.test(msg));
    m.errors.push({beat:beatNow,msg,known:known?known.name:null});if(!known)step(`${m.user} page error: ${msg.slice(0,160)}`);});
  page.on("dialog",d=>{void d.accept().catch(()=>{});});
  await installMarbleConfirmAnswers(page,{answer:true});
  m.pages+=1;m.page=page;return page;
}
const visible=(page,sel)=>page.locator(sel).first().isVisible().catch(()=>false);
async function waitLoaded(page,timeout=60000){await page.locator("#loadingScreen").waitFor({state:"hidden",timeout}).catch(()=>{});}
async function setActive(page,on){await page.evaluate(v=>{if(window.__lrw)window.__lrw.active=v;},on).catch(()=>{});}
async function open(m){await newPage(m);await m.page.goto(urlFor(m.user),{waitUntil:"domcontentloaded"});await setActive(m.page,true);await waitLoaded(m.page);}
async function signIn(m){
  const label=m.user==="daniel"?"Daniel":"Nik";
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE",exact:true}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
}
const pairPanel=page=>page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
const drops=page=>page.evaluate(()=>window.CareerModeProductionSharedShowdownSetup?.getState?.()?.setupDrops??null).catch(()=>null);
const dropReady=page=>page.evaluate(()=>{const b=document.getElementById("spinLeague");return Boolean(b&&!b.disabled&&b.getClientRects().length&&!/WAITING/i.test(b.textContent||""));}).catch(()=>false);
const boardStage=page=>page.evaluate(()=>{const s=window.CareerModeLeagueRouletteStep;const w=document.getElementById("leagueWheel");return {stage:s&&typeof s.stage==="function"?s.stage():0,failed:s&&typeof s.failed==="function"?s.failed():null,on:Boolean(w&&w.classList.contains("lr3d-on")),canvas:Boolean(w&&w.querySelector("canvas"))};}).catch(()=>({}));
async function waitFor(fn,{timeout=60000,every=250,label=""}={}){const until=Date.now()+timeout;for(;;){if(await fn().catch(()=>false))return true;if(Date.now()>until)throw new Error(`timed out waiting for ${label}`);await sleep(every);}}
// A small picture of the 3D board as composited on screen (64x64 RGBA), decoded in the page; null if there is no board.
const CTX_SAME=40;
async function boardShot(page,name){
  try{
    const box=await page.locator("#leagueWheel canvas").first().boundingBox();const vp=page.viewportSize();
    if(!box||!vp)return null;
    const x=Math.max(0,box.x),y=Math.max(0,box.y),w=Math.min(vp.width,box.x+box.width)-x,h=Math.min(vp.height,box.y+box.height)-y;
    if(w<8||h<8)return null;
    const png=await page.screenshot({clip:{x,y,width:w,height:h},timeout:15000});
    if(name){fs.mkdirSync(SHOT_DIR,{recursive:true});fs.writeFileSync(path.join(SHOT_DIR,`${runNow?.name||"x"}-${name}.png`),png);}
    return await page.evaluate(async b64=>{const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      const bmp=await createImageBitmap(new Blob([u],{type:"image/png"}),{resizeWidth:64,resizeHeight:64});const c=new OffscreenCanvas(64,64);const g=c.getContext("2d");g.drawImage(bmp,0,0);return Array.from(g.getImageData(0,0,64,64).data);},png.toString("base64"));
  }catch(_e){return null;}
}
function shotDiff(a,b){if(!a||!b||a.length!==b.length)return null;let sum=0,n=0;for(let i=0;i<a.length;i++){if(i%4===3)continue;sum+=Math.abs(a[i]-b[i]);n++;}return Math.round(sum/n*10)/10;}
// One ball from this phone: the button, then the ledger.
async function dropBall(m,n){
  await waitFor(()=>dropReady(m.page),{timeout:90000,label:`${m.user}'s ball ${n} button`});
  await m.page.locator("#spinLeague").click({timeout:10000});
  await waitFor(async()=>(await drops(m.page)||0)>=n,{timeout:45000,label:`ball ${n} on ${m.user}'s ledger`});
}
// The board is up on this page: the 3D host drew (lr3d-on with its canvas) and the league screen shows.
const boardUp=async page=>{const b=await boardStage(page);return b.on&&b.canvas&&await visible(page,"#leagueWheelScreen")&&!(await visible(page,"#loadingScreen"));};

async function runOne(browser,run){
  runNow=run;beatNow="boot";
  await clearEmulators();
  const daniel={user:"daniel",size:run.sizes.daniel,events:[],errors:[],pages:0},nik={user:"nik",size:run.sizes.nik,events:[],errors:[],pages:0};
  const both=[daniel,nik];
  const started=Date.now();
  try{
    for(const m of both)await openContext(browser,m);
    for(const m of both)await open(m);
    // WebGL2 must work in the page (the point of this lane): fail, never fall back.
    for(const m of both){
      const gl=await m.page.evaluate(()=>({sampler:window.__lrw?.webgl2??null,scene:(()=>{try{const c=document.createElement("canvas");return Boolean(c.getContext("webgl2"));}catch(_e){return false;}})()}));
      if(!gl.sampler||!gl.scene){await fail(m,"no-webgl2",`WebGL2 does not work in this page (${JSON.stringify(gl)}): the lane cannot test the 3D board`);throw new Error("no WebGL2");}
    }
    // --- waiting: Daniel's START opens WAITING over the league screen before Nik has connected.
    step("WebGL2 works on both pages");
    beatNow="waiting";
    await signIn(daniel);
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption("1");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel.page).locator("code").waitFor({timeout:30000});
    await sleep(4000);
    // resume-waiting: Daniel reloads while his code is out.
    await daniel.page.reload({waitUntil:"domcontentloaded"});await waitLoaded(daniel.page);
    await pairPanel(daniel.page).locator("code").waitFor({timeout:45000}).catch(async()=>{await fail(daniel,"waiting-lost",`no code after Daniel's reload while waiting: ${await screens(daniel.page)}`);});
    await sleep(4000);
    step("Daniel reloaded while waiting");
    const code=(await pairPanel(daniel.page).locator("code").innerText()).trim();
    // wait-for-daniel: Nik signs in and opens the game while Daniel waits; then JOIN with the code.
    await signIn(nik);
    await nik.page.locator("#newShowdown").click({timeout:30000}).catch(()=>{});
    await waitFor(()=>nik.page.evaluate(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false);}),{timeout:30000,label:"Nik's pair state"});
    await sleep(3000);
    await pairPanel(nik.page).locator("#persistentNikDanielPairCode").fill(code,{timeout:30000});
    await pairPanel(nik.page).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click({timeout:30000});
    const rivalryId=code.replace(/^CMS17R?-/,"");
    for(const m of both)await m.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active"&&s.rivalryId===id);},rivalryId,{timeout:60000});
    step("pair active on both phones");
    // Both boards come up once the pair connects (Daniel's waiting screen hands over to the 3D board).
    for(const m of both)await waitFor(()=>boardUp(m.page),{timeout:120000,label:`${m.user}'s 3D board after the pair connected`}).catch(async e=>{await fail(m,"no-board",`${e.message}: ${JSON.stringify(await boardStage(m.page))} ${await screens(m.page)}`);throw e;});
    step("both 3D boards up");
    // --- late-join: Nik's tab closes; Daniel drops ball 1 alone; Nik opens a fresh tab and comes in.
    beatNow="late-join";
    await nik.page.close().catch(()=>{});
    await sleep(2000);
    await waitFor(()=>boardUp(daniel.page),{timeout:60000,label:"Daniel's 3D board with Nik's tab closed"}).catch(async e=>{await fail(daniel,"no-board",`${e.message}: ${JSON.stringify(await boardStage(daniel.page))} ${await screens(daniel.page)}`);throw e;});
    await dropBall(daniel,1);step("Daniel dropped ball 1 alone");
    await sleep(1500);
    await open(nik);
    // The sign-in is remembered on the device: the fresh tab comes back signed in, and only a player who is asked signs in.
    if(await nik.page.getByRole("button",{name:"SIGN IN WITH GOOGLE",exact:true}).isVisible().catch(()=>false))await signIn(nik);
    await waitFor(async()=>{if(await visible(nik.page,"#leagueWheelScreen"))return true;const tile=nik.page.locator("#newShowdown");if(await tile.isVisible().catch(()=>false)){await tile.click({timeout:5000}).catch(()=>{});await sleep(3000);}return false;},{timeout:120000,every:1000,label:"Nik back on the league screen"});
    await waitFor(()=>boardUp(nik.page),{timeout:120000,label:"Nik's 3D board after the late join"}).catch(async e=>{await fail(nik,"no-board",`${e.message}: ${JSON.stringify(await boardStage(nik.page))} ${await screens(nik.page)}`);throw e;});
    step("Nik back in on a fresh tab");
    // --- reload: Nik drops ball 2, Daniel reloads; Daniel drops ball 3, Nik reloads.
    beatNow="reload";
    await dropBall(nik,2);
    await daniel.page.reload({waitUntil:"domcontentloaded"});await waitLoaded(daniel.page);
    await waitFor(()=>boardUp(daniel.page),{timeout:120000,label:"Daniel's 3D board after his reload"}).catch(async e=>{await fail(daniel,"no-board",`${e.message}: ${JSON.stringify(await boardStage(daniel.page))} ${await screens(daniel.page)}`);throw e;});
    await dropBall(daniel,3);
    await nik.page.reload({waitUntil:"domcontentloaded"});await waitLoaded(nik.page);
    await waitFor(()=>boardUp(nik.page),{timeout:120000,label:"Nik's 3D board after his reload"}).catch(async e=>{await fail(nik,"no-board",`${e.message}: ${JSON.stringify(await boardStage(nik.page))} ${await screens(nik.page)}`);throw e;});
    // --- ctxloss: Daniel's board loses its WebGL context and gets it back; it must draw again.
    step("both reloads done");
    beatNow="ctxloss";
    // The board is compared on screen: a picture of it before the loss, while lost (proves the loss hit), and after restore.
    // A board that never draws again after the restore (a dead screen) fails, even if its canvas is still in place.
    // The board is idle first (ball 3 has rested and Nik's ball 4 is ready), so the pictures compare like with like.
    await waitFor(()=>dropReady(nik.page),{timeout:90000,label:"the board idle before the context loss"});
    const still=await boardShot(daniel.page,"ctx-still");await sleep(4000);
    const before=await boardShot(daniel.page,"ctx-before");
    // The page gives the context back 500 ms after the loss event, on its own timer (inside the step's 2.5 s wait), so this
    // beat normally tests a restore in place. A busy page can deliver the restore late; the step then builds the board again,
    // which must draw too (noted). The empty-board rule is paused from the loss until a live board is back, as for a rebuild.
    const lost=await daniel.page.evaluate(()=>{const c=document.querySelector("#leagueWheel canvas");if(!c)return "no canvas";const gl=c.getContext("webgl2")||c.getContext("webgl");const ext=gl&&gl.getExtension("WEBGL_lose_context");if(!ext)return "no WEBGL_lose_context";
      const t0=performance.now();window.__lrwCtx={lostMs:null,restoredMs:null};c.addEventListener("webglcontextlost",()=>{window.__lrwCtx.lostMs=Math.round(performance.now()-t0);setTimeout(()=>{try{ext.restoreContext();}catch(_e){}},500);},{once:true});c.addEventListener("webglcontextrestored",()=>{window.__lrwCtx.restoredMs=Math.round(performance.now()-t0);},{once:true});
      if(window.__lrw)window.__lrw.forcedLoss=true;ext.loseContext();return "lost";});
    if(lost!=="lost")await fail(daniel,"ctxloss",`could not lose the board's context: ${lost}`);
    else{
      // The lost picture is taken once the page has the loss event (the restore follows 500 ms later).
      await waitFor(()=>daniel.page.evaluate(()=>window.__lrwCtx?.lostMs!=null),{timeout:10000,every:50,label:"the context loss event"}).catch(()=>{});
      const during=await boardShot(daniel.page,"ctx-lost");
      await waitFor(()=>daniel.page.evaluate(()=>window.__lrwCtx?.restoredMs!=null),{timeout:15000,label:"the restored context"})
        .catch(async e=>{await fail(daniel,"ctxloss.restore",`${e.message}: ${JSON.stringify(await daniel.page.evaluate(()=>window.__lrwCtx).catch(()=>null))}`);});
      const ctx=await daniel.page.evaluate(()=>window.__lrwCtx).catch(()=>null);
      report.notes.push(`${run.name}: context loss on Daniel's board: lost event at ${ctx?.lostMs} ms, restored at ${ctx?.restoredMs} ms${ctx&&ctx.restoredMs-ctx.lostMs>2500?" (after the step's 2.5 s wait: the board was built again)":""}`);
      await waitFor(async()=>{const b=await boardStage(daniel.page);return b.on&&b.canvas&&b.stage>0&&await visible(daniel.page,"#leagueWheelScreen");},{timeout:30000,label:"Daniel's board after the context came back"})
        .catch(async e=>{await fail(daniel,"ctxloss.rebuild",`${e.message}: ${JSON.stringify(await boardStage(daniel.page))} ${await screens(daniel.page)}`);});
      await sleep(4000);
      const after=await boardShot(daniel.page,"ctx-restored");
      const hit=shotDiff(before,during),back=shotDiff(before,after),idle=shotDiff(still,before);
      report.notes.push(`${run.name}: context loss on Daniel's board (mean 0-255 per channel): idle board 4 s apart ${idle}, before vs lost ${hit}, before vs restored ${back}`);
      if(hit===null||back===null)await fail(daniel,"ctxloss.shot",`could not picture the board (before/lost ${hit}, before/restored ${back})`);
      else if(back>CTX_SAME)await fail(daniel,"ctxloss.dead",`the board did not draw again after its WebGL context came back: before vs restored differs by ${back} (limit ${CTX_SAME}); before vs lost ${hit}`);
      else if(hit<=CTX_SAME)report.notes.push(`${run.name}: the lost context left the board's picture unchanged (${hit}); the rebuild check could not tell lost from drawn`);
    }
    await daniel.page.evaluate(()=>{if(window.__lrw)window.__lrw.forcedLoss=false;}).catch(()=>{});
    step("context loss and restore done");
    // --- ctxlost: Daniel's board loses its WebGL context for good (never restored). The step waits for a restore, then
    // builds a fresh renderer and canvas on the same stage: within 15 s a board with a live WebGL2 context, the same stage,
    // no failure, and a picture that matches the board before the loss. The room may show without a board meanwhile, so the
    // sampler's empty-board rule is paused from the loss until a live board is back; every other rule stays on.
    beatNow="ctxlost";
    {
      await waitFor(()=>dropReady(nik.page),{timeout:90000,label:"the board idle before the lasting context loss"});
      const before=await boardShot(daniel.page,"lost-before");const stageBefore=(await boardStage(daniel.page)).stage;
      const lost=await daniel.page.evaluate(()=>{const c=document.querySelector("#leagueWheel canvas");if(!c)return "no canvas";const gl=c.getContext("webgl2")||c.getContext("webgl");const ext=gl&&gl.getExtension("WEBGL_lose_context");if(!ext)return "no WEBGL_lose_context";if(window.__lrw)window.__lrw.forcedLoss=true;ext.loseContext();return "lost";});
      if(lost!=="lost")await fail(daniel,"ctxlost",`could not lose the board's context: ${lost}`);
      else{
        const live=()=>daniel.page.evaluate(()=>{const s=window.CareerModeLeagueRouletteStep;const w=document.getElementById("leagueWheel");const cs=w?[...w.querySelectorAll("canvas")]:[];
          const ok=cs.length>0&&cs.every(c=>{const gl=c.getContext("webgl2");return Boolean(gl&&!gl.isContextLost());});
          return {ok,canvases:cs.length,on:Boolean(w&&w.classList.contains("lr3d-on")),stage:s&&typeof s.stage==="function"?s.stage():null,failed:s&&typeof s.failed==="function"?s.failed():null};}).catch(()=>({ok:false}));
        let last={};
        await waitFor(async()=>{last=await live();return last.ok&&last.on&&!last.failed;},{timeout:15000,every:250,label:"a fresh 3D board after the context was lost for good"})
          .then(async()=>{
            await sleep(1500);last=await live();
            const after=await boardShot(daniel.page,"lost-rebuilt");const d=shotDiff(before,after);
            report.notes.push(`${run.name}: context lost for good on Daniel's board: rebuilt (${JSON.stringify(last)}), before vs rebuilt ${d}`);
            if(last.stage!==stageBefore)await fail(daniel,"ctxlost.stage",`the rebuilt board shows stage ${last.stage}, not ${stageBefore}`);
            if(d===null||d>CTX_SAME)await fail(daniel,"ctxlost.dead",`the rebuilt board does not match the board before the loss: differs by ${d} (limit ${CTX_SAME})`);
          })
          .catch(async e=>{await fail(daniel,"ctxlost.never",`the board never came back after its WebGL context was lost for good: ${e.message}: ${JSON.stringify(last)} ${await screens(daniel.page)}`);});
        await daniel.page.evaluate(()=>{if(window.__lrw)window.__lrw.forcedLoss=false;}).catch(()=>{});
      }
    }
    step("context lost for good done");
    beatNow="ball4";
    await dropBall(nik,4);
    for(const m of both)await waitFor(()=>visible(m.page,"#clubWheelScreen"),{timeout:120000,label:`${m.user} on the Ball Game`}).catch(async e=>{await fail(m,"no-ball-game",`${e.message}: ${await screens(m.page)}`);});
  }catch(error){
    if(!report.failures.some(f=>f.run===run.name))await fail(null,"error",error.stack||error.message);
    else report.notes.push(`${run.name}: stopped at ${beatNow}: ${String(error.message).split("\n")[0]}`);
  }finally{
    for(const m of both){
      // One failure per beat and kind on each phone; the page loads it showed on are counted in the detail.
      const groups=new Map();for(const e of m.events){const k=`${e.beat}|${e.kind}`;if(!groups.has(k))groups.set(k,{...e,loads:0});groups.get(k).loads++;}
      for(const e of groups.values()){runNow=run;beatNow=e.beat;await fail(m,e.kind,`${e.detail}${e.loads>1?` (on ${e.loads} page loads)`:""}`,m.page);}
      m.events.length=0;
      // Uncaught page errors: one failure per beat and message on each phone, unless named in KNOWN_PAGE_ERRORS.
      const errs=new Map();for(const e of m.errors.filter(x=>!x.known)){const k=`${e.beat}|${e.msg}`;if(!errs.has(k))errs.set(k,{...e,n:0});errs.get(k).n++;}
      for(const e of errs.values()){runNow=run;beatNow=e.beat;await fail(m,"page-error",`uncaught page error${e.n>1?` (x${e.n})`:""}: ${e.msg}`,null);}
      await m.context?.close().catch(()=>{});
    }
    report.runs.push({name:run.name,clubhouse:run.label,sizes:run.sizes,ms:Date.now()-started,pageErrors:{daniel:daniel.errors.slice(0,10),nik:nik.errors.slice(0,10)},knownPageErrors:[...daniel.errors,...nik.errors].filter(e=>e.known).length});
  }
}
async function screens(page){return page.evaluate(()=>{const vis=el=>el&&!el.classList.contains("hidden")&&getComputedStyle(el).display!=="none"&&el.getClientRects().length>0;return `screens=${[...document.querySelectorAll(".screen")].filter(vis).map(s=>s.id).join(",")} loading=${vis(document.getElementById("loadingScreen"))} buttons=${[...document.querySelectorAll("button")].filter(b=>vis(b)&&!b.disabled).map(b=>b.textContent.replace(/\s+/g," ").trim()).filter(Boolean).slice(0,10).join(" / ")}`;}).catch(e=>`(page unavailable: ${String(e.message).split("\n")[0]})`);}

async function main(){
  fs.rmSync(SHOT_DIR,{recursive:true,force:true});
  await loadComposedRules();
  let server=null;
  if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});await sleep(800);}
  const runtime=await resolveChromiumRuntime();
  const args=webglArgs(runtime.args);
  report.chromium={executablePath:runtime.executablePath,args};
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args});
  try{
    for(const run of RUNS.filter(r=>!process.env.LRW_ONLY||process.env.LRW_ONLY.split(",").includes(r.name)))await runOne(browser,run);
  }finally{
    await browser.close().catch(()=>{});
    if(server)server.kill();
  }
  report.verdict=report.failures.length?"FAIL":"PASS";
  writeReport();
  const ms=report.runs.map(r=>`${r.name} ${Math.round(r.ms/1000)} s`).join(", ");
  if(report.failures.length){console.log(`FAIL r100 League Roulette WebGL: ${report.failures.length} failure(s) (${ms}) -> ${path.relative(ROOT,REPORT_PATH)}`);process.exitCode=1;}
  else console.log(`PASS r100 League Roulette WebGL: ${report.runs.length} runs (Wooden and Graphite, 1920x866 and 390x844), the 3D board on every beat, no 2D wheel, no V3 plate, no loading return, the board drawn again after a restored and a lasting context loss (${ms}) -> ${path.relative(ROOT,REPORT_PATH)}`);
}
main().catch(error=>{console.error(error);report.verdict="FAIL";report.fatal=String(error.stack||error);try{writeReport();}catch(_e){}process.exit(1);});
