#!/usr/bin/env node
"use strict";
// r76 (CE2PG zz.rulesLimit): both managers run the automatic Terminal Close at once. The partner's identical progress write
// can land between this write's read and its commit; the emulator then answers PERMISSION_DENIED (stale base) instead of an
// SDK-retried abort. That loser must continue from the partner's progress, not fail the close ("could not be saved").
// A denial while the rivalry did not move is a real refusal and must still be returned unchanged.
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
  return {schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision,parentRevision:revision-1,lifecycleState:"live",contentHash:`sha256:${Buffer.from(hash).toString("hex")}`,priorContentHash:`sha256:${"0".repeat(64)}`,updatedAt:timestamp(1000000),updatedByAccountId:"manager_two",updatedByDeviceId:`device_${"2".repeat(32)}`,data,tombstone:null};
}
function denied(){return Object.assign(new Error("Unable to evaluate the expression as the maximum of 1000 expressions to evaluate has been reached."),{code:"permission-denied"});}
async function world(totalSeasons,{partnerLands,budget=false}){
  const initialData={connectionState:"active",authorizedAccountIds:[accountId,"manager_two"],managerSlots:[{accountId,entitlementState:"active"},{accountId:"manager_two",entitlementState:"active"}]};
  const store=new Map([[rivalryPath,await envelope(initialData)]]),transactions=[];
  const refs={account:{path:`accounts/${accountId}`},device:{path:`accounts/${accountId}/devices/${deviceId}`},rivalry:{path:rivalryPath},setup:{path:`${rivalryPath}/sharedSetup/authoritative`},commit:season=>({path:`${rivalryPath}/seasonCommits/season_${season}`})};
  const light=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:"live",contentHash:`sha256:${"1".repeat(64)}`,data,tombstone:null});
  store.set(refs.account.path,light("account",accountId,{status:"active"}));
  store.set(refs.device.path,light("device",deviceId,{deviceId,state:"active"}));
  store.set(refs.setup.path,{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",totalSeasons});
  for(let season=1;season<=totalSeasons;season++)store.set(refs.commit(season).path,{schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne:{leaguePosition:1,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:true,topScorer:false,topAssist:false},playerTwo:{leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}}});
  let refusals=0;
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:timestamp},runTransaction:async(_db,callback)=>{
    const entry={reads:[],writes:[]};transactions.push(entry);
    const outcome=await callback({get:async ref=>{entry.reads.push(ref.path);return {exists:()=>store.has(ref.path),data:()=>store.get(ref.path)};},set:(ref,value)=>entry.writes.push([ref.path,value])});
    if(entry.writes.length&&refusals===0){
      refusals+=1;entry.denied=true;
      // The partner's season-1 progress commits 1 ms earlier; Rules now see a stale base and refuse this commit.
      if(partnerLands)store.set(rivalryPath,await envelope({...initialData,terminalProgress:{schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons,acceptedThroughSeason:1,managerTotals:{playerOne:8,playerTwo:1},closedSessionRevision:null}},3));
      throw denied();
    }
    for(const [key,value] of entry.writes)store.set(key,value);
    return outcome;
  }};
  const sandbox={console,TextEncoder,crypto:webcrypto,CareerModeSharedTerminalClose:require("../../js/sharedTerminalClose.js"),CareerModeSparkPrivateSession:require("../../js/sparkPrivateSession.js")};
  vm.createContext(sandbox);
  vm.runInContext(source.replace("close:stcClose,read:stcRead","close:stcClose,read:stcRead,advanceProgress:stcAdvanceProgress"),sandbox,{filename:"js/sparkTerminalClose.js"});
  let firebaseSdk=sdk;const firestore={};
  if(budget){vm.runInContext(`Date.now=()=>1800000000000;${budgetSource}`,sandbox,{filename:"sparkPrivatePairing.js#budget"});firebaseSdk=sandbox.CareerModeFirestoreBudget.services({ok:true,firestore,firestoreSdk:sdk,auth:{currentUser:{uid:accountId}}}).firestoreSdk;}
  const operation={firestore,firebaseSdk,accountId,deviceId,rivalryId,intent:{totalSeasons},nowEpochMs:2000000,cryptoImpl:webcrypto};
  return {advance:()=>sandbox.CareerModeSparkTerminalClose.advanceProgress(operation,refs),store,transactions};
}
(async()=>{
  for(const budget of [false,true]){
    const label=budget?"r75 budget layer":"plain SDK";
    // Lost race: continue from the partner's season 1 and write season 2 exactly once.
    const race=await world(3,{partnerLands:true,budget});
    const outcome=await race.advance();
    assert.equal(outcome.closed,false);assert.equal(outcome.done,false);
    const value=race.store.get(rivalryPath);
    assert.equal(value.revision,4,`${label}: the loser writes on top of the partner's revision`);
    assert.equal(value.data.terminalProgress.acceptedThroughSeason,2,`${label}: the loser continues from the partner's season 1`);
    assert.deepEqual(plain(value.data.terminalProgress.managerTotals),{playerOne:16,playerTwo:2},`${label}: season 1 is counted once`);
    assert.equal(race.transactions.filter(entry=>entry.denied).length,1,`${label}: one refused commit, no repeated refusals`);
    assert.equal(race.transactions.filter(entry=>entry.writes.length&&!entry.denied).length,1,`${label}: exactly one accepted progress write`);
    // Real refusal: the rivalry did not move, so the denial is returned unchanged and nothing is retried.
    const real=await world(3,{partnerLands:false,budget});
    await assert.rejects(real.advance(),error=>error.code==="permission-denied",`${label}: a denial without a newer rivalry stays a denial`);
    assert.equal(real.transactions.filter(entry=>entry.writes.length).length,1,`${label}: no second write after a real refusal`);
    assert.equal(real.store.get(rivalryPath).revision,2);
    console.log(`PASS ${label}: a progress write refused because the partner's identical write landed first continues from the partner's progress; a real refusal is unchanged`);
  }
  // r79 (L3A stale-write race): both finalize at once and the partner's atomic close lands between this attempt's rivalry
  // and session reads; the refused session read must end as a replay of the partner's close, not a failed close.
  async function finalizeWorld({finalizeError,preflight}){
    const calls={finalize:0,preflight:0};
    const hooks={finalize:async()=>{calls.finalize+=1;throw finalizeError;},preflight:async()=>{calls.preflight+=1;return preflight();}};
    const sandbox={console,TextEncoder,crypto:webcrypto,__hooks:hooks,CareerModeSharedTerminalClose:require("../../js/sharedTerminalClose.js"),CareerModeSparkPrivateSession:require("../../js/sparkPrivateSession.js")};
    vm.createContext(sandbox);
    const hooked=[
      ["async function stcClose(options={}){try{const operation=stcNormalizeOptions(options),references=stcRefs(operation);","async function stcClose(options={}){try{const operation=options,references={};"],
      ["async function stcAdvanceProgress(operation,references){","async function stcAdvanceProgress(operation,references){if(globalThis.__hooks)return {closed:false,done:true};"],
      ["async function stcFinalize(operation,references){return","async function stcFinalize(operation,references){if(globalThis.__hooks)return globalThis.__hooks.finalize();return"],
      ["function stcPrepareProgress(operation,references){return","function stcPrepareProgress(operation,references){if(globalThis.__hooks)return globalThis.__hooks.preflight();return"]
    ].reduce((text,[from,to])=>{assert.equal(text.split(from).length,2,`hook anchor present once: ${from.slice(0,40)}`);return text.replace(from,to);},source);
    vm.runInContext(hooked,sandbox,{filename:"js/sparkTerminalClose.js"});
    const result=await sandbox.CareerModeSparkTerminalClose.close({rivalryId,sessionId:`session_${"c".repeat(64)}`,intent:{totalSeasons:3}});
    return {result:plain(result),calls};
  }
  const won=await finalizeWorld({finalizeError:denied(),preflight:()=>({closed:true,done:true,rivalry:{revision:9},sessionRevision:7})});
  assert.equal(won.result.ok,true,JSON.stringify(won.result));assert.equal(won.result.status,"replayed");assert.equal(won.result.replayed,true);
  assert.equal(won.result.sessionRevision,7,"the replay carries the partner's closing session revision");assert.equal(won.result.rivalryRevision,9);
  assert.deepEqual(won.calls,{finalize:1,preflight:1},"one fresh preflight, no second finalize");
  const stillOpen=await finalizeWorld({finalizeError:denied(),preflight:()=>({closed:false,done:false,priorRivalry:{revision:2}})});
  assert.equal(stillOpen.result.ok,false);assert.equal(stillOpen.result.code,"permission-denied","a denial while the rivalry is still open stays a denial");
  const otherClose=await finalizeWorld({finalizeError:denied(),preflight:()=>{throw Object.assign(new Error("conflict"),{code:"TERMINAL_CLOSE_REPLAY_CONFLICT"});}});
  assert.equal(otherClose.result.ok,false);assert.equal(otherClose.result.code,"permission-denied","a rivalry closed with another witness keeps the original denial");
  const otherError=await finalizeWorld({finalizeError:Object.assign(new Error("offline"),{code:"unavailable"}),preflight:()=>{throw new Error("must not run");}});
  assert.equal(otherError.result.code,"unavailable");assert.deepEqual(otherError.calls,{finalize:1,preflight:0},"only a permission denial triggers the fresh preflight");
  console.log("PASS finalize race: a final close refused because the partner's identical close landed first ends as a replay of it; an open rivalry, another witness or a non-denial error stays a failure");
})().catch(error=>{console.error(error);process.exitCode=1;});
