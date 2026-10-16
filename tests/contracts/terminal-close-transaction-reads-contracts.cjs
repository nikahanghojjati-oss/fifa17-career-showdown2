#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/sparkTerminalClose.js"),"utf8");
const pairingSource=fs.readFileSync(path.join(ROOT,"js/sparkPrivatePairing.js"),"utf8");
const budgetSource=pairingSource.slice(pairingSource.indexOf("// Firestore budget layer (r75)."));
const rivalryId=`pair_${"a".repeat(64)}`,accountId="manager_one",deviceId=`device_${"1".repeat(32)}`;
const rivalryPath=`rivalries/${rivalryId}`;
const timestamp=millis=>({toMillis:()=>millis});
function plain(value){return JSON.parse(JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{$timestamp:item.toMillis()}:item));}
function canonical(value){if(value===null||typeof value!=="object")return value;if(Array.isArray(value))return value.map(canonical);return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));}
async function envelope(data,revision=2){
  const hash=await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(plain({objectType:"rivalry",objectId:rivalryId,revision,data})))));
  return {schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision,parentRevision:revision-1,lifecycleState:"live",contentHash:`sha256:${Buffer.from(hash).toString("hex")}`,priorContentHash:`sha256:${"0".repeat(64)}`,updatedAt:timestamp(1000000),updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};
}
async function world(totalSeasons,{budget=false,race=false,retry=false}={}){
  const initialData={connectionState:"active",authorizedAccountIds:[accountId,"manager_two"],managerSlots:[{accountId,entitlementState:"active"},{accountId:"manager_two",entitlementState:"active"}],untouched:{marker:"keep all existing data"}};
  const store=new Map([[rivalryPath,await envelope(initialData)]]),transactions=[];
  const refs={account:{path:`accounts/${accountId}`},device:{path:`accounts/${accountId}/devices/${deviceId}`},rivalry:{path:rivalryPath},setup:{path:`${rivalryPath}/sharedSetup/authoritative`},commit:season=>({path:`${rivalryPath}/seasonCommits/season_${season}`})};
  const light=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:"live",contentHash:`sha256:${"1".repeat(64)}`,data,tombstone:null});
  store.set(refs.account.path,light("account",accountId,{status:"active"}));
  store.set(refs.device.path,light("device",deviceId,{deviceId,state:"active"}));
  store.set(refs.setup.path,{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",totalSeasons});
  for(let season=1;season<=totalSeasons;season++)store.set(refs.commit(season).path,{schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne:{leaguePosition:1,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:true,topScorer:false,topAssist:false},playerTwo:{leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}}});
  let raced=false,retried=false;
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:timestamp},runTransaction:async(_db,callback)=>{
    const run=async()=>{
      const entry={reads:[],writes:[]};transactions.push(entry);
      const outcome=await callback({get:async ref=>{entry.reads.push(ref.path);return {exists:()=>store.has(ref.path),data:()=>store.get(ref.path)};},set:(ref,value)=>entry.writes.push([ref.path,value])});
      if(entry.writes.length&&race&&!raced){
        raced=true;
        // A concurrent manager accepted season 1 after our preflight. The SDK retries the callback on the newer rivalry.
        const next=await envelope({...initialData,terminalProgress:{schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons,acceptedThroughSeason:1,managerTotals:{playerOne:8,playerTwo:1},closedSessionRevision:null}},3);
        store.set(rivalryPath,next);entry.aborted=true;return run();
      }
      if(entry.writes.length&&retry&&!retried){retried=true;entry.aborted=true;return run();}
      for(const [key,value] of entry.writes)store.set(key,value);
      return outcome;
    };
    return run();
  }};
  const sandbox={console,TextEncoder,crypto:webcrypto,CareerModeSharedTerminalClose:require("../../js/sharedTerminalClose.js"),CareerModeSparkPrivateSession:require("../../js/sparkPrivateSession.js")};
  vm.createContext(sandbox);
  // Expose just the private progress operation to isolate it from the separate final-close transaction.
  vm.runInContext(source.replace("close:stcClose,read:stcRead","close:stcClose,read:stcRead,advanceProgress:stcAdvanceProgress"),sandbox,{filename:"js/sparkTerminalClose.js"});
  let firebaseSdk=sdk;
  const firestore={};
  if(budget){vm.runInContext(`Date.now=()=>1800000000000;${budgetSource}`,sandbox,{filename:"sparkPrivatePairing.js#budget"});firebaseSdk=sandbox.CareerModeFirestoreBudget.services({ok:true,firestore,firestoreSdk:sdk,auth:{currentUser:{uid:accountId}}}).firestoreSdk;}
  const operation={firestore,firebaseSdk,accountId,deviceId,rivalryId,intent:{totalSeasons},nowEpochMs:2000000,cryptoImpl:webcrypto};
  return {advance:()=>sandbox.CareerModeSparkTerminalClose.advanceProgress(operation,refs),store,transactions,initialData};
}
(async()=>{
  for(const totalSeasons of [1,3,5,10]){
    const h=await world(totalSeasons);
    for(let season=1;season<=totalSeasons;season++){
      const before=h.store.get(rivalryPath),outcome=await h.advance();
      assert.equal(outcome.done,season===totalSeasons);
      const expected=await envelope({...h.initialData,terminalProgress:{schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons,acceptedThroughSeason:season,managerTotals:{playerOne:8*season,playerTwo:season},closedSessionRevision:null}},before.revision+1);
      expected.priorContentHash=before.contentHash;expected.updatedAt=timestamp(2000000);
      assert.deepEqual(plain(h.store.get(rivalryPath)),plain(expected),"every written field, revision, timestamp and content hash matches the base values");
    }
    const writing=h.transactions.filter(entry=>entry.writes.length);
    assert.equal(writing.length,totalSeasons);
    for(const entry of writing)assert.deepEqual(entry.reads,[rivalryPath],"terminal-progress writing transaction must read ONLY the rivalry (no read-only verify entries)");
    console.log(`PASS ${totalSeasons}-season progress: rivalry-only transaction reads; base-equivalent envelopes and scores`);
  }
  for(const mode of ["race","retry"]){
    const h=await world(3,{[mode]:true});await h.advance();
    const value=h.store.get(rivalryPath);
    assert.equal(value.data.terminalProgress.acceptedThroughSeason,mode==="race"?2:1);
    assert.deepEqual(plain(value.data.terminalProgress.managerTotals),mode==="race"?{playerOne:16,playerTwo:2}:{playerOne:8,playerTwo:1});
    for(const entry of h.transactions.filter(entry=>entry.writes.length))assert.deepEqual(entry.reads,[rivalryPath]);
    console.log(`PASS ${mode}: rivalry compare-and-set retries preserve exact-once season scores`);
  }
  const h=await world(3,{budget:true});for(let season=1;season<=3;season++)await h.advance();
  const reads=h.transactions.reduce((sum,entry)=>sum+entry.reads.length,0);
  assert.ok(reads<=22,`r75 cache must keep progress reads below base's 22; got ${reads}`);
  for(const entry of h.transactions.filter(entry=>entry.writes.length))assert.deepEqual(entry.reads,[rivalryPath]);
  console.log(`PASS r75 budget: ${reads} progress reads for 3 seasons (base 22); zero read-only commit verifies`);
})().catch(error=>{console.error(error);process.exitCode=1;});
