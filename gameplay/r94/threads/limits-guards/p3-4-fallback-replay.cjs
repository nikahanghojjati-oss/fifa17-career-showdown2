"use strict";
// R94-06 P3-4 replay (evidence tool, not part of the game or the Gate). Question from the R94-05 study: can the Chamber Men
// or Prime Pack listener-fallback poll (a transaction read every 2.5 s, no hidden-tab check) run in production?
//
// The fallback starts only when the step's snapshot API comes back null. In production io.sdk is the budget-wrapped
// account SDK (js/productionFirebaseRuntime.js:237 keeps Timestamp, serverTimestamp, doc, runTransaction: no onSnapshot), so
// the step does `await import(firebaseFirestoreModule)`. js/productionFirebaseRuntime.js already imported that exact URL to
// build the account services (loadAccountFirebaseSdk, default importImpl url=>import(url)); without it there is no sign-in
// and no Showdown screen at all. This replay runs the REAL watch functions (source text cut from js/chamberMenStep.js and
// js/iconGuessStep.js) in Chromium with a stand-in Firestore module at the real gstatic URL, and checks:
//   A. production order (module imported first, then the network is cut): the step gets the listener from the module map,
//      makes no network request, and does no fallback read while the tab is hidden;
//   B. control (module never imported, network cut): the fallback poll does start and keeps reading while hidden. This is
//      the only way to reach it, and in that state the page could not have signed in.
// Run: node gameplay/r94/threads/limits-guards/p3-4-fallback-replay.cjs (Playwright Chromium, no emulator, no network).

const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const {chromium}=require("playwright");

const ROOT=path.resolve(__dirname,"../../../..");
const RUNTIME=fs.readFileSync(path.join(ROOT,"js/productionFirebaseRuntime.js"),"utf8");
const VERSION=RUNTIME.match(/const FIREBASE_SDK_VERSION="([\d.]+)";/)[1];
const MODULE_URL=`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`;
assert.ok(RUNTIME.includes("const FIREBASE_FIRESTORE_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;"));
assert.ok(RUNTIME.includes("importImpl(FIREBASE_FIRESTORE_MODULE)"),"the runtime imports the Firestore module to build the account services");
assert.ok(RUNTIME.includes("firebaseFirestoreModule:FIREBASE_FIRESTORE_MODULE,"),"the steps import the same URL");
assert.match(RUNTIME,/firestoreSdk:Object\.freeze\(\{Timestamp:sdk\.Timestamp,serverTimestamp:sdk\.serverTimestamp,doc:sdk\.doc,runTransaction:sdk\.runTransaction\}\)/,"production io.sdk has no onSnapshot");

function cut(file,name){
  const src=fs.readFileSync(path.join(ROOT,file),"utf8");
  const start=src.search(new RegExp(`\\n  (async )?function ${name}\\(`));
  assert.ok(start>=0,`${file}: ${name} not found`);
  let i=src.indexOf("{",start),depth=0;
  for(;i<src.length;i++){if(src[i]==="{")depth++;else if(src[i]==="}"&&--depth===0)break;}
  return src.slice(start+1,i+1);
}
const STEPS=[
  {name:"Chamber Men",file:"js/chamberMenStep.js",prefix:"cms",collection:"chamberMenRounds"},
  {name:"Prime Pack",file:"js/iconGuessStep.js",prefix:"igs",collection:"primePackRounds"}
].map(step=>({...step,source:["SnapshotApi","Watch","Ref","SeasonId","Wait"].map(part=>cut(step.file,`${step.prefix}${part}`)).join("\n"),
  pollMs:Number(fs.readFileSync(path.join(ROOT,step.file),"utf8").match(/POLL_MS=(\d+)/)[1])}));

const STAND_IN=`globalThis.__standInEvaluations=(globalThis.__standInEvaluations||0)+1;
export function doc(...parts){return {path:parts.slice(1).join("/")};}
export function onSnapshot(ref,options,next){globalThis.__listeners=(globalThis.__listeners||0)+1;setTimeout(()=>next({metadata:{},exists:()=>false,data:()=>null}),10);return ()=>{globalThis.__listeners-=1;};}`;

async function scenario(browser,step,{importFirst}){
  const page=await browser.newPage();
  let fetches=0,networkCut=false;
  await page.route(MODULE_URL,route=>{fetches+=1;if(networkCut)return route.abort("internetdisconnected");return route.fulfill({status:200,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"},body:STAND_IN});});
  await page.route("https://showdown.test/",route=>route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>replay</title>"}));
  await page.goto("https://showdown.test/");
  if(importFirst)await page.evaluate(url=>import(url).then(()=>true),MODULE_URL); // what loadAccountFirebaseSdk does
  networkCut=true;
  const result=await page.evaluate(async({source,prefix,collection,url,pollMs})=>{
    const root=window;root.CareerModeProductionFirebaseRuntime={firebaseFirestoreModule:url};
    let reads=0;
    const io={firestore:{},rivalryId:"pair_replay",sdk:{doc:(...parts)=>({path:parts.slice(1).join("/")}),runTransaction:async(db,fn)=>{reads+=1;return fn({get:async()=>({exists:()=>false,data:()=>null})});}}};
    const make=new Function("root","COLLECTION","POLL_MS",`${source}\nreturn ${prefix}Watch;`);
    const watch=make(root,collection,pollMs);
    // The tab goes hidden before the screen starts listening and stays hidden.
    Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"hidden"});
    document.dispatchEvent(new Event("visibilitychange"));
    let deliveries=0,errors=0;
    const stop=await watch(io,{season:1},()=>{deliveries+=1;},()=>{errors+=1;});
    await new Promise(resolve=>setTimeout(resolve,pollMs*3+600));
    stop();
    return {reads,deliveries,errors,listeners:globalThis.__listeners||0,evaluations:globalThis.__standInEvaluations||0,hidden:document.visibilityState};
  },{source:step.source,prefix:step.prefix,collection:step.collection,url:MODULE_URL,pollMs:step.pollMs});
  await page.close();
  return {...result,fetchesAfterCut:fetches-(importFirst?1:0)};
}

(async()=>{
  const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
  const lines=[];
  try{
    for(const step of STEPS){
      const a=await scenario(browser,step,{importFirst:true});
      lines.push(`A ${step.name}: production order (module imported, then network cut, tab hidden ${Math.round((step.pollMs*3+600)/100)/10} s): fallback reads=${a.reads}, listener deliveries=${a.deliveries}, network requests after the cut=${a.fetchesAfterCut}, module evaluations=${a.evaluations}`);
      assert.equal(a.reads,0,`${step.name}: no fallback read once the module is loaded`);
      assert.ok(a.deliveries>=1,`${step.name}: the listener came from the already-loaded module`);
      assert.equal(a.fetchesAfterCut,0,`${step.name}: the second import needs no network`);
      assert.equal(a.evaluations,1,`${step.name}: one module instance`);
      const b=await scenario(browser,step,{importFirst:false});
      lines.push(`B ${step.name}: control (module never loaded, network cut, tab hidden): fallback reads=${b.reads}, errors=${b.errors}, network requests=${b.fetchesAfterCut}`);
      assert.ok(b.reads>=3,`${step.name}: the control reaches the fallback poll and it keeps reading while hidden`);
    }
  }finally{await browser.close();}
  lines.push("RESULT the fallback poll cannot run in production: it needs the Firestore module to be missing, and the runtime cannot sign in without that same module. No game change.");
  process.stdout.write(lines.join("\n")+"\n");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
