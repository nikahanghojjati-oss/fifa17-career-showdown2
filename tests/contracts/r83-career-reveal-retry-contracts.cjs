"use strict";
// JOB-3 F1: a recovering connection must not cache an interrupted r79 reveal as an empty career.
// Run the real marker, career loader, completed reader, adapters and analytics in one page with exact-get fake IO.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const fixture=JSON.parse(read("tests/fixtures/saved-showdowns/r79-1season-win.json"));
const F=require("../support/active-showdown-fixtures.cjs");
const ts=ms=>({toMillis:()=>ms});
function decode(value){
  const kind=Object.keys(value)[0];
  switch(kind){
    case "nullValue":return null;
    case "booleanValue":return value.booleanValue;
    case "stringValue":return value.stringValue;
    case "integerValue":return Number(value.integerValue);
    case "doubleValue":return value.doubleValue;
    case "timestampValue":{
      const m=/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?Z$/.exec(value.timestampValue);
      assert.ok(m,"fixture timestamp");
      return ts(Date.parse(`${m[1]}Z`)+Number((m[2]||"").padEnd(9,"0"))/1e6);
    }
    case "arrayValue":return (value.arrayValue.values||[]).map(decode);
    case "mapValue":return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));
    default:throw new Error(`Unsupported fixture value ${kind}`);
  }
}
function page(managerId){
  const docs=Object.fromEntries(fixture.documents.map(d=>[d.path,decode({mapValue:{fields:d.fields}})]));
  const rivalryPath=`rivalries/${fixture.rivalryId}`,rivalry=docs[rivalryPath];
  const role=managerId==="daniel"?"playerOne":"playerTwo";
  const uid=rivalry.data.managerSlots.find(slot=>slot.slotId===role).accountId;
  const markerPath=`accounts/${uid}/careerStart/current`;
  // Model the r79 marker which hid the first real finished game; stored fixture documents stay unchanged.
  const startedAt=Date.UTC(2026,9,19,6);
  docs[markerPath]={schemaVersion:1,objectType:"careerStart",objectId:"current",revision:0,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),data:{active:true,startedAt:ts(startedAt),hiddenRivalryIds:[fixture.rivalryId]}};
  const log=[];let failRoot=true;
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{
    log.push(ref.path);
    if(ref.path===rivalryPath&&failRoot){failRoot=false;throw Object.assign(new Error("Connection recovering"),{code:"unavailable"});}
    const value=docs[ref.path];return {exists:()=>value!==undefined,data:()=>value};
  }};
  const c=vm.createContext({console,URLSearchParams,setTimeout,clearTimeout,TextEncoder,crypto:webcrypto,
    CustomEvent:class{constructor(type){this.type=type;}},dispatchEvent(){},addEventListener(){},
    CareerModeOnlinePlayerIdentity:{getState:()=>({...F.identity(managerId),accountId:uid})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:uid})},
    CareerModePersistentNikDanielPair:{getState:()=>F.pair(null,{managerId,status:"unpaired",rivalryId:null,connectionState:null}),readCareerIndex:async()=>({status:"ready",accountId:uid,rivalryIds:[fixture.rivalryId],sealedPageCount:0})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})}
  });
  for(const [name,file] of Object.entries({CareerModeCareerScreenSeam:"careerScreenSeam",CareerModeSharedHistoryConvergence:"sharedHistoryConvergence",CareerModeSharedFinalReconciliation:"sharedFinalReconciliation",CareerModeSharedTerminalClose:"sharedTerminalClose",CareerModeSharedCareerAnalytics:"sharedCareerAnalytics",CareerModeSharedActiveShowdownAdapter:"sharedActiveShowdownAdapter",CareerModeSharedClosedShowdownAdapter:"sharedClosedShowdownAdapter",CareerModeSparkCompletedShowdownReader:"sparkCompletedShowdownReader"}))c[name]=require(path.join(ROOT,"js",file+".js"));
  c.loadRuntimeScript=async(_key,file,ready)=>{if(!ready())vm.runInContext(read(file),c,{filename:file});assert.ok(ready(),file);return true;};
  vm.runInContext(read("js/rivalryLegacyV10.js"),c);
  return {api:c.CareerModeRivalryLegacyV10,log,markerPath,rivalryPath};
}
async function screenRecovery(managerId){
  const p=page(managerId);
  const first=await p.api.loadCareerModel();
  assert.deepEqual(p.log,[p.markerPath,p.rivalryPath],"uncertain scope never reaches the completed reader");
  // Check recovery independently too, so the old code demonstrates both the quiet empty model and poisoned cache.
  const second=await p.api.loadCareerModel();
  const results=[
    ()=>assert.ok(["unavailable","partial"].includes(first.status),`${managerId}: interrupted reveal must warn, got ${first.status}`),
    ()=>assert.equal(p.api.toV10Frame(first,"legacy").status,"unavailable",`${managerId}: Legacy uses its existing unavailable state`),
    ()=>assert.equal(second.status,"ready",`${managerId}: next open retries in the same page`),
    ()=>assert.equal(second.history.showdowns.filter(row=>row.status==="completed").length,1,`${managerId}: one completed Showdown`),
    ()=>assert.equal(second.managers.daniel.careerPoints,5,`${managerId}: Daniel 5`),
    ()=>assert.equal(second.managers.nik.careerPoints,1,`${managerId}: Nik 1`),
    ()=>assert.equal(p.api.toV10Frame(second,"legacy").showdowns.length,1,`${managerId}: Legacy shows the game`)
  ];
  const failures=[];for(const check of results)try{check();}catch(error){failures.push(error);}
  if(failures.length)throw new AggregateError(failures,`${managerId}: reveal recovery`);
  assert.equal(p.api.cachedCareerModel(),second,"all career screens share the recovered model");
  const reads=p.log.length;
  await p.api.loadCareerModel();
  assert.equal(p.log.length,reads,"successful reveal and completed game stay cached");
  assert.equal(p.log.filter(pth=>pth===p.markerPath).length,1,"successful marker read stays cached during recovery");
  assert.equal(p.log.filter(pth=>pth===p.rivalryPath).length,3,"one failed reveal, one retried reveal, one completed-reader root get");
}
async function interruptedAfterProgress(){
  const Marker=require(path.join(ROOT,"js/careerStartMarker.js"));
  Marker.clearCache();
  const older="pair_"+"2".repeat(64),newer="pair_"+"3".repeat(64);
  const marker={status:"ready",startedAt:Date.UTC(2026,9,19,6),contentHash:"fixture",hiddenRivalryIds:[older,newer]};
  const calls=[];let fail=true;
  const options={marker,accountId:"acct_daniel",firestore:{},firebaseSdk:{doc:(_db,...parts)=>parts.at(-1),getDoc:async id=>{
    calls.push(id);
    if(id===older&&fail)throw Object.assign(new Error("unavailable"),{code:"unavailable"});
    return {exists:()=>true,data:()=>({objectType:"rivalry",objectId:id,updatedAt:ts(marker.startedAt),data:{connectionState:"closed",terminalClose:{}}})};
  }}};
  const first=Marker.careerHiddenRivalryIds(options),concurrent=Marker.careerHiddenRivalryIds(options);
  assert.equal(first,concurrent,"concurrent opens share one bounded scan");
  await assert.rejects(first,error=>error.code==="unavailable","even after a verified root, an interrupted scope rejects");
  assert.deepEqual(calls,[newer,older],"the first failed get stops the scan");
  fail=false;
  assert.deepEqual(await Marker.careerHiddenRivalryIds(options),[],"retry checks both roots again");
  await Marker.careerHiddenRivalryIds(options);
  assert.deepEqual(calls,[newer,older,newer,older],"only the successful scan is cached");
  Marker.clearCache();
}
(async()=>{
  const outcomes=await Promise.allSettled([screenRecovery("daniel"),screenRecovery("nik"),interruptedAfterProgress()]);
  const failures=outcomes.filter(result=>result.status==="rejected").map(result=>result.reason);
  if(failures.length)throw new AggregateError(failures,"JOB-3 F1");
  console.log("PASS r83 career reveal retry: both managers warn on unavailable, then show 1 completed Showdown, Daniel 5, Nik 1 on the next open; successful scans remain cached.");
})().catch(error=>{console.dir(error,{depth:8});process.exitCode=1;});
