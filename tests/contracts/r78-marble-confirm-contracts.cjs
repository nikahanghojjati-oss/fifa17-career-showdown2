#!/usr/bin/env node
"use strict";
// r78 (HO-029, Team G): every native window.confirm() is replaced by ONE shared black-and-gold marble confirm box
// (js/showdownConfirm.js, styled by Team V's .r78-modal in css/r78-marble-surfaces.css).
// Source: no native confirm() is left anywhere in the app; each of the 12 live audited call sites (C1-C11, C11 twice; C12 retired in r79) keeps its
// exact wording and awaits the box; the r78 sheets and the box stay out of the startup bundle.
// Browser: the real Settings > History & Backup > RESET ALL SHOWDOWN DATA button (C3) opens the box over the unchanged
// screen (no dimming or blur, opaque marble panel); focus is trapped, Esc = Cancel, Enter = OK, Cancel never resets,
// focus returns to the button, OK runs the reset, and window.confirm is never called.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),net=require("node:net");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;
let framedChecks=Promise.reject(new Error("R3b did not run"));framedChecks.catch(()=>{});
const check=(name,fn)=>{fn();passed+=1;console.log(`ok ${passed} ${name}`);};

function walk(dir,out=[]){
  for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory())walk(rel,out);else if(/\.(?:js|mjs|html)$/.test(entry.name))out.push(rel);
  }
  return out;
}
// strip block comments and whole-line or trailing // comments (not inside "https://")
const code=source=>source.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[\s;{}(),])\/\/[^\n]*/g,"$1");

const SITES=[
  ["C1","js/legacy.js","legacyAskConfirm(warning, \"danger\")",['from Legacy and remove its active completed copy? This cannot be undone.`','from Legacy? This cannot be undone.`']],
  ["C2","js/legacy.js","legacyAskConfirm(warning, \"danger\")",["Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone.","Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone."]],
  ["C3","js/legacy.js","legacyAskConfirm(\"Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.\", \"danger\")",[]],
  ["C4","js/showdownUI.js","dashboardAskConfirm(message, \"danger\")",['Its completed Legacy record will remain available.`','and all of its unfinished progress? This cannot be undone.`']],
  ["C5","js/saveLibraryUI.js","saveLibraryUIAskConfirm(`Delete only “${name}” from this device? Other local Saves, Local Profiles, Legacy history and app settings remain. This cannot be undone.`,\"danger\")",[]],
  ["C6","js/saveLibraryUI.js","saveLibraryUIAskConfirm(action,\"primary\")",["as unresolved? This removes only its explicit Local Profile link. The historical display name stays unchanged.`","This changes stable manager identity only. Saved and historical display names stay unchanged.`"]],
  ["C7","js/restoreUI.js","restoreAskConfirm(\"Apply this exact restore plan? The selected file and browser data will be verified again before any write. Export Backup above now if you want an extra current-state recovery copy.\",\"primary\")",[]],
  ["C8","js/productionSharedTransferChallenge.js","pstcAskConfirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You can't change them after locking.`,\"primary\")",[]],
  // r80: DELETE CURRENT SHOWDOWN became END SHOWDOWN (same red button, same marble box, Ended early wording).
  ["C9","js/settings.js","settingsAskConfirm(\n        `End the \"${name}\" Showdown? Ends this Showdown for both players. History keeps it as Ended early. This cannot be undone.`,\n        \"danger\"",[]],
  // C10 (Settings START REAL CAREER) is retired in r79 PR4 (Nik 2026-10-17): the row is gone; the one-time checkmark on the
  // seasons screen needs no box. C13 is r79 PR4's UNPAIR in Settings (js/showdownModes.js).
  ["C13","js/showdownModes.js","smAskConfirm(`Unpair from ${v.partnerLabel}? Your Showdowns stay saved. To play again you pair again with a new code.`,\"danger\")",[]],
  ["C11a","js/persistentNikDanielPair.js","pairAskConfirm(\"Delete this old connection and start fresh? This closes the stale online connection and clears only its unfinished Showdown so Nik can join the new code Daniel creates.\",\"danger\")",[]],
  ["C11b","js/persistentNikDanielPair.js","pairAskConfirm(\"Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.\",\"danger\")",[]]
  // C12 (START A SHOWDOWN "Start a new Showdown? This will close the current ...") is retired in r79: START never offers to close
  // a live Showdown (owner rule); closing stays in Settings (C9). R2 checks the entry module has no confirm box left.
];

check("R1 no native confirm() is left in the app (js/, visual-assets/, index.html)",()=>{
  const files=[...walk("js"),...walk("visual-assets"),"index.html"];
  const hits=[];
  for(const file of files){
    const source=code(read(file));
    for(const pattern of [/\b(?:window|root|globalThis|self|top|parent)\s*\.\s*confirm\b/g,/(^|[^.\w$])confirm\s*\?\.\s*\(/g,/(^|[^.\w$])confirm\s*\(/g]){
      for(const match of source.matchAll(pattern))hits.push(`${file}: ${match[0].trim()}`);
    }
  }
  assert.deepEqual(hits,[],"native confirm() calls remain");
});

check("R2 the 13 audited confirm sites await the shared box with their exact wording, and only OK counts as consent",()=>{
  assert.equal(SITES.length,12,"13 audited r78 sites minus C12 and C10, retired in r79, plus C13 (r79 PR4 UNPAIR)");
  for(const [id,file,call,extra] of SITES){
    const source=read(file);
    assert.ok(source.includes(call),`${id} ${file}: ${call.slice(0,60)}`);
    for(const text of extra)assert.ok(source.includes(text),`${id} ${file}: wording ${text.slice(0,50)}`);
  }
  assert.equal((read("js/legacy.js").match(/await legacyAskConfirm\([^)]*\) !== true/g)||[]).length,3,"C1-C3 only an explicit OK deletes or resets");
  assert.match(read("js/showdownUI.js"),/if\(await dashboardAskConfirm\(message, "danger"\) !== true\)\{ return; \}/);
  assert.equal((read("js/settings.js").match(/if\(confirmed !== true\)\{ return false; \}/g)||[]).length,1,"C9 (C10 retired in r79 PR4)");
  assert.match(read("js/showdownModes.js"),/const ok=await smAskConfirm\([^\n]*\);\n\s*if\(ok!==true\)return false;/,"C13 only an explicit OK unpairs");
  assert.match(read("js/restoreUI.js"),/if\(await restoreAskConfirm\([^)]*\)!==true\)return;/);
  assert.match(read("js/saveLibraryUI.js"),/const confirmed=await saveLibraryUIAskConfirm\([\s\S]*?\);\n\s*if\(confirmed!==true\|\|saveLibraryUIBusy\)return;/);
  assert.match(read("js/saveLibraryUI.js"),/if\(await saveLibraryUIAskConfirm\(action,"primary"\)!==true\|\|saveLibraryUIBusy\)return;/);
  assert.equal((read("js/persistentNikDanielPair.js").match(/const confirmed=await pairAskConfirm\([^;]*;\n[^\n]*\n\s*if\(confirmed!==true\)return false;/g)||[]).length,2,"C11 x2 BH-11: only an explicit yes");
  assert.doesNotMatch(read("js/productionSharedJourneyEntry.js"),/entryAskConfirm|askShowdownConfirm|Start a new Showdown\? This will close/,"C12 retired (r79): START never asks to close a live Showdown");
  // C8 keeps its one exception: no confirm box at all (no loader) still locks as before; a Cancel never locks.
  const pstc=read("js/productionSharedTransferChallenge.js");
  assert.match(pstc,/async function pstcConfirmPartialLock\(filled,noun\)\{\n\s*if\(filled>=PSTC_MAX_ROWS\)return true;\n\s*return \(await pstcAskConfirm\([^;]*\)\)!==false;/);
  assert.match(pstc,/if\(!await pstcConfirmPartialLock\(guesses\.length,"guesses"\)\)return false;/);
  assert.match(pstc,/if\(!await pstcConfirmPartialLock\(signings\.length,"signings"\)\)return false;/);
  // each helper prefers the loaded box, loads it on first use, and never treats a load failure as consent
  for(const [file,name] of [["js/legacy.js","legacyAskConfirm"],["js/showdownUI.js","dashboardAskConfirm"],["js/settings.js","settingsAskConfirm"],["js/showdownModes.js","smAskConfirm"],["js/restoreUI.js","restoreAskConfirm"],["js/saveLibraryUI.js","saveLibraryUIAskConfirm"],["js/productionSharedTransferChallenge.js","pstcAskConfirm"],["js/persistentNikDanielPair.js","pairAskConfirm"]]){
    const source=read(file);
    assert.match(source,new RegExp(`function ${name}\\(message,tone\\)\\{return typeof (?:window|root)\\.askShowdownConfirm==="function"\\?[^\\n]*loadRuntimeScript\\("showdown-confirm","js/showdownConfirm\\.js"[^\\n]*,\\(\\)=>false\\):Promise\\.resolve\\(undefined\\);\\}`),`${file} ${name}`);
  }
});

check("R3 the box is one shared module: alertdialog, OK / Cancel, Esc = Cancel, Enter = OK, focus trap and return, no scrim",()=>{
  const api=require(path.join(ROOT,"js/showdownConfirm.js"));
  assert.equal(api.feature,"r78-marble-confirm");
  assert.deepEqual({...api.LABELS},{confirm:"OK",cancel:"Cancel"});
  assert.deepEqual(api.splitMessage("Delete \"A?\" now? This cannot be undone."),{title:"Delete \"A?\" now?",body:"This cannot be undone."});
  assert.deepEqual(api.splitMessage("Reset only sanitized Physical Journey evidence for this browser?"),{title:"Reset only sanitized Physical Journey evidence for this browser?",body:""});
  const src=read("js/showdownConfirm.js");
  for(const needle of ['setAttribute("role","alertdialog")','setAttribute("aria-modal","true")','event.key==="Escape"','event.key==="Enter"','event.key==="Tab"','scFinish(doc.activeElement!==cancel)','trigger.focus({preventScroll:true})','"r78-modal"','r78-panel r78-panel--float r78-modal__panel','background:"transparent"'])assert.ok(src.includes(needle),needle);
  assert.ok(!/backdrop|blur|opacity|animation|transition/i.test(code(src)),"no scrim, blur or motion in the box");
  const css=read("css/r78-marble-surfaces.css");
  const modal=(css.match(/\n\.r78-modal \{[^}]*\}/)||[""])[0];
  assert.match(modal,/background: transparent;/);assert.match(modal,/backdrop-filter: none;/);
  // r78 gallery fix: Cancel is built first and stays first on phones too (stacked Cancel above OK, as desktop reads Cancel, OK).
  assert.ok(src.includes("actions.append(cancel,confirm);"),"Cancel comes before OK in the markup");
  const phone=(css.match(/@media \(max-width: 480px\) \{[^@]*?\.r78-modal__actions \{[^}]*\}/)||[""])[0];
  assert.match(phone,/\.r78-modal__actions \{ flex-direction: column; \}/,"phones stack Cancel on top, OK below");
  assert.ok(!/\.r78-modal__actions[^{]*\{[^}]*(?:column-reverse|row-reverse)/.test(css),"no reversed button order");
});

check("R3b a framed app never shows the box: inside any frame (or when window.top cannot be read) every ask is Cancel",()=>{
  const vm=require("node:vm");
  const src=read("js/showdownConfirm.js");
  assert.match(src,/function scIsFramed\(\)\{\n\s*try\{return root\.top!==root\.self;\}catch\(error\)\{return true;\}\n\s*\}/);
  assert.match(src,/const run=\(\)=>\{\n\s*if\(scIsFramed\(\)\)return Promise\.resolve\(false\);/,"checked before any DOM work, on every ask");
  const load=defineTop=>{
    const touched=[];
    const doc=new Proxy({},{get:(target,key)=>{touched.push(String(key));throw new Error(`document.${String(key)} touched while framed`);}});
    const sandbox={document:doc,Promise,setTimeout,clearTimeout};
    sandbox.self=sandbox;
    defineTop(sandbox);
    vm.runInNewContext(src,sandbox,{filename:"showdownConfirm.js"});
    return {sandbox,touched};
  };
  const cases=[
    ["cross-origin parent",box=>{box.top={};}],
    ["unreadable window.top",box=>{Object.defineProperty(box,"top",{get(){throw new Error("SecurityError");}});}],
  ];
  const pending=[];
  for(const [label,defineTop] of cases){
    const {sandbox,touched}=load(defineTop);
    assert.equal(sandbox.CareerModeShowdownConfirm.isFramed(),true,label);
    assert.equal(sandbox.CareerModeShowdownConfirm.framedAnswer,false,label);
    pending.push(sandbox.askShowdownConfirm("Reset all Showdown data on this device?",{tone:"danger"}).then(answer=>{
      assert.equal(answer,false,`${label}: framed ask is Cancel`);
      assert.deepEqual(touched,[],`${label}: no box is built`);
    }));
  }
  const top=load(box=>{box.top=box;});
  assert.equal(top.sandbox.CareerModeShowdownConfirm.isFramed(),false,"the top-level app still shows the box");
  framedChecks=Promise.all(pending);
});

check("R4 the r78 sheets load with the kit and the box on first use, never in the startup bundle; the error plate exists",()=>{
  const html=read("index.html");
  for(const file of ["r78-type.css","r78-marble-surfaces.css","showdownConfirm.js"])assert.ok(!html.includes(file),`${file} is not a startup file`);
  const v10=read("js/v10Screens.js");
  assert.match(v10,/const R78_STYLES=Object\.freeze\(\["css\/r78-type\.css","css\/r78-marble-surfaces\.css"\]\);/);
  assert.match(v10,/const ALWAYS_ON=Object\.freeze\(\[BASE\+KIT\.styles\[0\],BASE\+NAV\.style,NAV\.shellStyle,\.\.\.R78_STYLES\]\);/);
  assert.match(v10,/const css=\[\.\.\.KIT\.styles\.map\(file=>vsStyle\(BASE\+file\)\),\.\.\.R78_STYLES\.map\(vsStyle\)\];/,"loaded with the kit, before Home's first reveal");
  assert.match(read("css/r78-type.css"),/#loadingScreen \{ --f17-ui: "Segoe UI", "Helvetica Neue", Arial, sans-serif; \}/,"the loading screen keeps its font");
  const sw=read("service-worker.js");
  for(const file of ["css/r78-type.css","css/r78-marble-surfaces.css","css/r78-marble-tile.webp","js/showdownConfirm.js"])assert.ok(sw.includes(`"${file}"`),`precache ${file}`);
  const css=read("css/r78-marble-surfaces.css");
  assert.ok(!css.includes("ENV_SYS_PHONE_V1"),"the removed phone plate is not referenced");
  for(const match of css.matchAll(/url\("\.\.\/(visual-assets\/[^"]+)"\)/g))assert.ok(fs.existsSync(path.join(ROOT,match[1])),match[1]);
  assert.ok(fs.existsSync(path.join(ROOT,"css/r78-marble-tile.webp")));
});

// service-worker.js in a VM with fake caches and a fake network (the worker's own fetch, message and activate handlers).
function swWorld(){
  const vm=require("node:vm");
  const SCOPE="https://cms.test/app/",store=new Map(),listeners={},net=new Map();let online=true;
  const keyOf=k=>typeof k==="string"?k:k.url;
  const caches={keys:async()=>[...store.keys()],delete:async name=>store.delete(name),
    open:async name=>{if(!store.has(name))store.set(name,new Map());const m=store.get(name);return{match:async k=>{const r=m.get(keyOf(k));return r?r.clone():undefined;},put:async(k,r)=>{m.set(keyOf(k),r);}};}};
  const fetch=async request=>{if(!online)throw new TypeError("offline");const body=net.get(new URL(keyOf(request)).pathname);return body===undefined?new Response("",{status:404}):new Response(body,{status:200});};
  const self={registration:{scope:SCOPE},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(type,fn)=>{listeners[type]=fn;}};
  vm.runInContext(read("service-worker.js"),vm.createContext({self,caches,fetch,URL,Request,Response,console,setTimeout,clearTimeout}),{filename:"service-worker.js"});
  const diag=self.__CMS_SERVICE_WORKER_DIAGNOSTICS__;
  const fill=(revision,paths,body=p=>p)=>{const m=new Map();for(const p of paths){const u=new URL(p,SCOPE);u.searchParams.set("v",revision);m.set(u.href,new Response(body(p),{status:200}));}store.set("career-mode-showdown-shell-"+revision,m);return m;};
  const get=async url=>{let reply;listeners.fetch({request:new Request(SCOPE+url),respondWith:p=>{reply=p;},waitUntil:()=>{}});if(!reply)return "not answered";const r=await reply;return r.status===200?await r.text():`status ${r.status}`;};
  const dispatch=async(type,event)=>{const waits=[];listeners[type]({waitUntil:p=>waits.push(p),...event});await Promise.all(waits);};
  const message=async type=>{let reply;await dispatch("message",{data:{type},ports:[{postMessage:m=>{reply=m;}}]});return reply;};
  return {SCOPE,store,net,diag,fill,get,dispatch,message,setOnline:v=>{online=v;}};
}

// The marble sheet asks for its tile by a relative url(), so the request carries no ?v=. The worker must still answer it from
// the precached shell (offline too), from the shell the page runs after a rollback, and from the network only on a miss.
let tileChecks=Promise.reject(new Error("R4b did not run"));tileChecks.catch(()=>{});
check("R4b the marble tile is served from the precached shell without a ?v= query (offline too)",()=>{
  const w=swWorld(),diag=w.diag,TILE="css/r78-marble-tile.webp";
  tileChecks=(async()=>{
    w.fill(diag.revision,diag.shellPaths,p=>p===TILE?"current-tile":p);w.fill(diag.previousRevision,diag.shellPaths,p=>p===TILE?"previous-tile":p);
    w.net.set("/app/"+TILE,"network-tile");w.setOnline(false);
    assert.equal(await w.get(TILE),"current-tile","offline: the tile comes from the current precached shell");
    assert.equal(await w.get("css/r78-marble-tile.webp?v="+diag.revision),"current-tile","a versioned request still works");
    assert.equal(await w.get("css/r78-type.css"),"not answered","other unversioned shell files are left to the network as before");
    const reply=await w.message("CMS_ROLLBACK_TO_PREVIOUS");
    assert.equal(reply&&reply.ok,true,"rollback accepted");
    assert.equal(await w.get(TILE),"previous-tile","after a rollback: the tile of the shell the page runs");
    w.store.delete("career-mode-showdown-shell-"+diag.previousRevision);w.store.delete("career-mode-showdown-shell-"+diag.revision);w.setOnline(true);
    assert.equal(await w.get(TILE),"network-tile","no precached copy: the network");
  })();
  tileChecks.catch(()=>{});
});

// The r79 shell on an installed phone was filled by the r79 worker with r79's own 221 paths. Activating r80 must keep it (and its
// image cache) as the recovery target instead of deleting it. r80 adds and removes no shell path, so both lists are the same 221.
// r86: the retained shell is now r85's, filled by the r85 worker with its own 222 paths (the r79 cases below run on it).
const R79_SHELL_PATHS_SHA256="1e8c63be868fa7c51a07b31958ab5aca4290061af5a1ffabd2ca94893d8d861c";// sorted JSON of r85's SHELL_PATHS (main a8a5b372)
let previousShellChecks=Promise.reject(new Error("R4c did not run"));previousShellChecks.catch(()=>{});
check("R4c an r79-only shell cache survives r80 activation and stays the rollback target",()=>{
  const crypto=require("node:crypto");
  const probe=swWorld(),diag=probe.diag;
  assert.equal(diag.previousRevision,"1.9.9-r85");
  assert.equal(diag.previousShellPaths.length,222,"r85 shipped 222 shell paths");
  assert.equal(crypto.createHash("sha256").update(JSON.stringify([...diag.previousShellPaths].sort())).digest("hex"),R79_SHELL_PATHS_SHA256,"the previous list is exactly r85's");
  assert.ok(diag.previousShellPaths.every(p=>diag.shellPaths.includes(p)),"r86 removed no shell path");
  previousShellChecks=(async()=>{
    const IMG="career-mode-showdown-v10-images-",PREV="career-mode-showdown-shell-"+diag.previousRevision;
    // 1. a real r79 install: r79's own list only, plus its image cache and an older leftover
    let w=swWorld();
    w.fill(diag.revision,diag.shellPaths);w.fill(diag.previousRevision,diag.previousShellPaths,p=>"r79:"+p);w.fill("1.9.2-r78",diag.previousShellPaths);
    w.store.set(IMG+diag.previousRevision,new Map([[w.SCOPE+"visual-assets/v10_1/home/assets/ENV_HOME_PHONE_V1.webp",new Response("r79-art",{status:200})]]));
    const status=await w.message("CMS_GET_CACHE_STATUS");
    assert.equal(status.previous.ok,true,"the r79 cache verifies against r79's own list");
    assert.equal(status.recovery.ok,true);assert.equal(status.recovery.revision,diag.previousRevision);
    await w.dispatch("activate",{});
    const names=[...w.store.keys()];
    assert.ok(names.includes(PREV),"activation keeps the r79 shell");
    assert.ok(names.includes(IMG+diag.previousRevision),"activation keeps the r79 image cache");
    assert.ok(!names.includes("career-mode-showdown-shell-1.9.2-r78"),"older shells are still cleared");
    const reply=await w.message("CMS_ROLLBACK_TO_PREVIOUS");
    assert.equal(reply&&reply.ok,true,"rollback to r79 accepted");assert.equal(reply.revision,diag.previousRevision);
    w.setOnline(false);
    let nav;w.dispatch("fetch",{request:Object.defineProperty(new Request(w.SCOPE),"mode",{value:"navigate"}),respondWith:p=>{nav=p;}});
    assert.equal(await (await nav).text(),"r79:index.html","offline after rollback: the r79 page");
    assert.equal(await w.get("js/app.js?v="+diag.previousRevision),"r79:js/app.js","and r79's own files");
    // 2. an r79 cache missing one of r79's own files is not a recovery target
    w=swWorld();
    w.fill(diag.revision,diag.shellPaths);const broken=w.fill(diag.previousRevision,diag.previousShellPaths);
    const gone=new URL("js/app.js",w.SCOPE);gone.searchParams.set("v",diag.previousRevision);broken.delete(gone.href);
    assert.equal((await w.message("CMS_GET_CACHE_STATUS")).previous.ok,false,"an incomplete r79 shell fails its own check");
    await w.dispatch("activate",{});
    assert.ok(![...w.store.keys()].includes(PREV),"and is cleared on activation");
    // 3. the current shell is still judged against the full r80 list (r80 added no path, so drop one of its own files)
    w=swWorld();const partial=w.fill(diag.revision,diag.shellPaths);
    const missing=new URL("js/app.js",w.SCOPE);missing.searchParams.set("v",diag.revision);partial.delete(missing.href);
    assert.equal((await w.message("CMS_ACTIVATE_UPDATE")).ok,false,"an r80 cache missing one of its own files is refused");
  })();
  previousShellChecks.catch(()=>{});
});

// ---- browser ----
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,"127.0.0.1",()=>{socket.end();resolve(true);});socket.on("error",()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error("static server did not start");}

const RESET_TITLE="Reset ALL Career Mode Showdown data?";
const RESET_BODY="This deletes the active showdown and every Legacy record. This cannot be undone.";
const RESET_DONE="All active and Legacy Showdown data was reset successfully.";

async function openTools(page,base){
  await page.addInitScript(()=>{window.__nativeConfirmCalls=0;window.confirm=()=>{window.__nativeConfirmCalls+=1;return true;};});
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
  await page.locator("#settingsButton").evaluate(button=>button.click());
  await page.locator(".settingsDataButton").waitFor({timeout:15000});
  await page.locator(".settingsDataButton").click();
  const reset=page.locator("button",{hasText:"RESET ALL SHOWDOWN DATA"});
  await reset.waitFor({timeout:15000});
  return reset;
}
const boxState=page=>page.evaluate(()=>{
  const layer=document.getElementById("showdownConfirm");
  if(!layer)return null;
  const panel=layer.querySelector(".r78-modal__panel"),ls=getComputedStyle(layer),ps=getComputedStyle(panel),r=panel.getBoundingClientRect();
  const active=document.activeElement;
  return {role:layer.getAttribute("role"),modal:layer.getAttribute("aria-modal"),title:layer.querySelector(".r78-modal__title").textContent,body:layer.querySelector(".r78-modal__body")?.textContent||"",
    buttons:[...layer.querySelectorAll("button")].map(b=>b.textContent),layerBg:ls.backgroundColor,layerFilter:ls.backdropFilter||"none",panelBg:ps.backgroundColor,panelImage:ps.backgroundImage,
    inViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth+0.5&&r.bottom<=innerHeight+0.5,focusInside:layer.contains(active),focus:active?.hasAttribute("data-r78-cancel")?"cancel":active?.hasAttribute("data-r78-confirm")?"ok":active===panel?"panel":"outside",
    pointerOnPanel:document.elementFromPoint(r.left+r.width/2,r.top+8)?.closest?.(".r78-modal__panel")===panel};
});
const focusedResetButton=page=>page.evaluate(()=>document.activeElement?.textContent==="RESET ALL SHOWDOWN DATA");
const resetToast=page=>page.evaluate(done=>document.getElementById("appRuntimeNotice")?.textContent?.includes(done)===true,RESET_DONE);

async function auditViewport(browser,base,options){
  const context=await browser.newContext(options);
  const page=await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  try{
    const reset=await openTools(page,base);
    // 1. keyboard open; box over the unchanged screen; Tab cycles inside; Esc = Cancel; focus returns
    await reset.focus();
    await page.keyboard.press("Enter");
    await page.locator("#showdownConfirm").waitFor({timeout:8000});
    const state=await boxState(page);
    assert.equal(state.role,"alertdialog");assert.equal(state.modal,"true");
    assert.equal(state.title,RESET_TITLE);assert.equal(state.body,RESET_BODY,"exact wording");
    assert.deepEqual(state.buttons,["Cancel","OK"]);
    assert.equal(state.layerBg,"rgba(0, 0, 0, 0)","no dimming behind the box");assert.equal(state.layerFilter,"none","no blur behind the box");
    assert.equal(state.panelBg,"rgb(17, 15, 12)","opaque marble panel");assert.match(state.panelImage,/r78-marble-tile\.webp/);
    assert.ok(state.inViewport,"the box fits the screen");assert.ok(state.pointerOnPanel,"nothing covers the box");
    assert.equal(state.focus,"panel","focus moves into the box");
    const order=[];
    for(const key of ["Tab","Tab","Tab","Shift+Tab","Shift+Tab"]){await page.keyboard.press(key);order.push((await boxState(page)).focus);}
    assert.deepEqual(order,["cancel","ok","cancel","ok","cancel"],"focus is trapped in the box");
    await page.keyboard.press("Escape");
    assert.equal(await boxState(page),null,"Esc closes the box");
    assert.equal(await focusedResetButton(page),true,"focus returns to the trigger");
    assert.equal(await resetToast(page),false,"Esc never resets");
    // 2. Enter on a focused Cancel is Cancel; the Cancel button is Cancel
    await page.keyboard.press("Enter");
    await page.locator("#showdownConfirm").waitFor({timeout:8000});
    await page.keyboard.press("Tab");assert.equal((await boxState(page)).focus,"cancel");
    await page.keyboard.press("Enter");
    assert.equal(await boxState(page),null);assert.equal(await resetToast(page),false,"Enter on Cancel never resets");
    await reset.click();
    await page.locator("#showdownConfirm [data-r78-cancel]").click();
    assert.equal(await boxState(page),null);assert.equal(await resetToast(page),false,"Cancel never resets");
    // 3. Enter = OK runs the call site's own branch (the reset) and focus goes back
    await reset.focus();
    await page.keyboard.press("Enter");
    await page.locator("#showdownConfirm").waitFor({timeout:8000});
    await page.keyboard.press("Enter");
    await page.waitForFunction(done=>document.getElementById("appRuntimeNotice")?.textContent?.includes(done),RESET_DONE,{timeout:8000});
    assert.equal(await boxState(page),null);
    assert.equal(await page.evaluate(()=>window.__nativeConfirmCalls),0,"window.confirm is never called");
    assert.deepEqual(errors,[]);
    console.log(`  browser ${options.viewport.width}x${options.viewport.height}: Esc/Cancel/Enter-on-Cancel keep data, Enter = OK resets, focus trapped and returned, no scrim`);
  }finally{await context.close();}
}

(async()=>{
  await framedChecks;
  await tileChecks;
  await previousShellChecks;
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=="--single-process")});
    const base=`http://127.0.0.1:${port}/`;
    await auditViewport(browser,base,{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    await auditViewport(browser,base,{viewport:{width:1280,height:800}});
    passed+=1;console.log(`ok ${passed} R5 the real RESET ALL SHOWDOWN DATA confirm works by keyboard and pointer at 390x844 and 1280x800`);
    console.log(`PASS r78 marble confirm contracts: ${passed} checks (no native confirm() left; 12 call sites keep their words; one keyboard-accessible marble box).`);
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exit(1);});
