"use strict";
// Hunt 1017 H1-H3 (JOB-1025): Terminal Close recovery holds its exact witness across refreshes, a retry never closes an
// old Showdown after the active context changes, and the closed Final Winner frame keeps its verified trophy history.
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const crypto=require("node:crypto").webcrypto;
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const protocol=require(path.join(root,"js/sharedTerminalClose.js"));
const resultsModule=require(path.join(root,"js/sharedSeasonResults.js"));
const commitModule=require(path.join(root,"js/sharedSeasonCommit.js"));
const scoringModule=require(path.join(root,"js/sharedCanonicalScoring.js"));
const historyModule=require(path.join(root,"js/sharedHistoryConvergence.js"));
const multiModule=require(path.join(root,"js/sharedMultiSeasonProgression.js"));
const localModule=require(path.join(root,"js/sharedLocalReconciliation.js"));
const finalModule=require(path.join(root,"js/sharedFinalReconciliation.js"));

const PAIR="pair_"+"a".repeat(64),SESSION="session_"+"b".repeat(64),DEVICE="device_"+"c".repeat(32),SAVE="save_"+"d".repeat(24);
const P1="profile_"+"e".repeat(24),P2="profile_"+"f".repeat(24);
const FINAL={schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:PAIR,leagueId:"premier_league",totalSeasons:10,acceptedSeasons:10,completedSeason:10,acceptedRevisionKey:"accepted",fixedClubs:{playerOne:"A",playerTwo:"B"},managerTotals:{playerOne:10,playerTwo:5},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};
const showdown=(saveId,rivalryId)=>({id:"local",identity:{saveId,managerProfileIds:{playerOne:P1,playerTwo:P2}},sharedJourney:{mode:"shared",rivalryId}});

function harness(){
  const env={readImpl:async()=>({ok:true,terminal:false}),closeImpl:async()=>({ok:false,code:"unavailable"}),closeCalls:[],forgets:0};
  const context=vm.createContext({console,TextEncoder,setTimeout,clearTimeout,
    currentShowdown:showdown(SAVE,PAIR),
    CareerModeSharedTerminalClose:protocol,
    CareerModeSparkTerminalClose:{read:o=>env.readImpl(o),close:async o=>{env.closeCalls.push(o);return env.closeImpl(o);}},
    CareerModeProductionSharedFinalReconciliation:{getState:()=>FINAL,refresh:async()=>FINAL},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"nik"}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"nik"})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{getState:()=>({attached:true,rivalryId:PAIR,accountId:"nik",deviceId:DEVICE})},
    CareerModeSparkRemoteJoining:{getState:()=>({sessionState:"active",sessionId:SESSION,rivalryId:PAIR,accountId:"nik",deviceId:DEVICE,pendingAction:null,expiresAtEpochMs:Date.now()+60000}),forgetSession:()=>{env.forgets+=1;}}
  });
  vm.runInContext(read("js/productionSharedTerminalClose.js"),context,{filename:"productionSharedTerminalClose.js"});
  return {context,env,api:context.CareerModeProductionSharedTerminalClose};
}
async function pending(){const h=harness();await h.api.refresh();assert.equal(h.api.getState().phase,"READY");await h.api.close();assert.equal(h.api.getState().phase,"RECOVERY_PENDING");return h;}
const closedRead=intent=>({ok:true,terminal:true,rivalryRevision:7,terminalWitness:JSON.parse(JSON.stringify(intent))});
const hold=()=>{let release,started;const entered=new Promise(r=>{started=r;});return {entered,impl:()=>{started();return new Promise(r=>{release=r;});},release:v=>release(v)};};

async function recoveryHeldAcrossRefresh(){
  const {api,env}=await pending();const held=JSON.parse(JSON.stringify(api.getState().intent));
  for(let i=0;i<3;i+=1){await api.refresh();assert.equal(api.getState().phase,"RECOVERY_PENDING","an open read keeps RECOVERY_PENDING");assert.deepEqual(JSON.parse(JSON.stringify(api.getState().intent)),held,"the exact witness is kept");}
  env.readImpl=async()=>({ok:false,code:"unavailable"});await api.refresh();assert.equal(api.getState().phase,"RECOVERY_PENDING","a failed read keeps RECOVERY_PENDING");
  const other=protocol.prepare(FINAL,{sessionId:"session_"+"9".repeat(64)});
  env.readImpl=async()=>closedRead(other);await api.refresh();assert.equal(api.getState().phase,"RECOVERY_PENDING","a closed read of another witness does not resolve the held close");
  env.readImpl=async()=>closedRead(held);await api.refresh();assert.equal(api.getState().phase,"CLOSED","a verified closed read of the same witness resolves it");assert.equal(env.forgets,1);
  assert.equal(env.closeCalls.length,1,"refresh never re-sends the close");
  // The advertised same-witness retry still works after polls.
  const second=await pending();await second.api.refresh();second.env.closeImpl=async o=>({ok:true,rivalryId:PAIR,sessionId:o.intent.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:8,sessionRevision:3});
  const retried=await second.api.retry();assert.equal(retried.ok,true);assert.equal(second.api.getState().phase,"CLOSED");
  assert.equal(protocol.sameWitness(second.env.closeCalls[1].intent,second.env.closeCalls[0].intent),true,"retry sends the same witness");
}
async function retryStopsOnContextChange(){
  // Context changes while the retry's read is in flight: no close for the old Save.
  {const {api,context,env}=await pending();const gate=hold();env.readImpl=gate.impl;const retry=api.retry();await gate.entered;
    context.currentShowdown=showdown("save_"+"1".repeat(24),"pair_"+"2".repeat(64));gate.release({ok:true,terminal:false});
    const result=await retry;assert.equal(result.code,"TERMINAL_CLOSE_CONTEXT_CHANGED");assert.equal(env.closeCalls.length,1,"old provider.close not invoked");}
  // A closed read that lands after the switch does not forget the new context's session.
  {const {api,context,env}=await pending();const held=api.getState().intent;const gate=hold();env.readImpl=gate.impl;const retry=api.retry();await gate.entered;
    context.currentShowdown=showdown("save_"+"1".repeat(24),"pair_"+"2".repeat(64));gate.release(closedRead(held));
    assert.equal((await retry).code,"TERMINAL_CLOSE_CONTEXT_CHANGED");assert.equal(env.forgets,0,"no session cleanup for a stale context");}
  // Context changes while the retry's close is in flight: no session cleanup.
  {const {api,context,env}=await pending();const gate=hold();env.closeImpl=gate.impl;const retry=api.retry();await gate.entered;
    context.currentShowdown=showdown("save_"+"1".repeat(24),"pair_"+"2".repeat(64));gate.release({ok:true,rivalryId:PAIR,sessionId:SESSION,rivalryState:"closed",sessionState:"closed",rivalryRevision:8,sessionRevision:3});
    assert.equal((await retry).code,"TERMINAL_CLOSE_CONTEXT_CHANGED");assert.equal(env.forgets,0,"forgetSession not called after the context changed");}
  // Same key but the held state was cleared (Save Library authority invalidated) during the read: also stops.
  {const {api,context,env}=await pending();const gate=hold();env.readImpl=gate.impl;const retry=api.retry();await gate.entered;
    // The clearing path: a refresh with no Shared Showdown drops the held state, then the same Save returns.
    const saved=context.currentShowdown;context.currentShowdown=null;await api.refresh();context.currentShowdown=saved;
    gate.release({ok:true,terminal:false});
    assert.equal((await retry).code,"TERMINAL_CLOSE_CONTEXT_CHANGED");assert.equal(env.closeCalls.length,1,"a cleared state never sends the old close");}
}

const fact={leaguePosition:2,leaguePoints:90,leagueGoals:80,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
const operation=(prefix,n)=>prefix+n.toString(16).padStart(32,"0");
async function completedShowdown(totalSeasons,firstResult=fact){
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,confirmedRoles:["playerOne","playerTwo"],leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}};
  const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
  const results=await resultsModule.createProtocol({teamCount:20,cryptoImpl:crypto}),commit=await commitModule.createProtocol({teamCount:20,cryptoImpl:crypto}),scoring=await scoringModule.createProtocol({teamCount:20,cryptoImpl:crypto});
  const seasons=[];
  for(let n=1;n<=totalSeasons;n+=1){
    const options={setup,careerStart,transferChallenge:{phase:"COMPLETED",revision:6,seasonNumber:n},seasonNumber:n};
    const mine=n%2?firstResult:{...fact,leaguePosition:1,championsLeague:true};
    const first=await results.apply({...options,actorRole:"playerOne",command:{type:"publish-result",operationId:operation("season_result_op_",n*2),baseRevision:0,result:mine}});
    const second=await results.apply({...options,state:first.state,actorRole:"playerTwo",command:{type:"publish-result",operationId:operation("season_result_op_",n*2+1),baseRevision:1,result:fact}});
    const c={setup,seasonResults:second.state,seasonNumber:n};
    const committed=await commit.apply({...c,actorRole:"playerOne",command:{type:"commit-season",operationId:operation("season_commit_op_",n*3),baseRevision:0}});
    const a1=await commit.apply({...c,state:committed.state,actorRole:"playerOne",command:{type:"acknowledge-season",operationId:operation("season_commit_op_",n*3+1),baseRevision:1}});
    const a2=await commit.apply({...c,state:a1.state,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:operation("season_commit_op_",n*3+2),baseRevision:2}});
    const reconciled=await scoring.reconcile({seasonCommit:a2.state});
    seasons.push({commit:{ok:true,committed:true,...commit.projectForRole(a2.state,"playerOne")},scoring:{ok:true,authoritative:true,...scoring.projectForRole(reconciled,"playerOne"),resultsRevision:2,resultsContentHash:second.state.contentHash}});
  }
  const slots=[{slotId:"playerOne",accountId:"daniel",profileId:P1,saveId:SAVE,entitlementState:"active"},{slotId:"playerTwo",accountId:"nik",profileId:P2,saveId:SAVE,entitlementState:"active"}];
  const projection=historyModule.buildProjection({rivalryId:PAIR,setup,managerSlots:slots,seasons});
  const history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:PAIR,projection};
  const multi={ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId:PAIR,state:multiModule.createProtocol().derive({rivalryId:PAIR,setup,history:projection})};
  const local=localModule.project({sharedActive:true,history,connected:{connected:true,attached:true,rivalryId:PAIR,binding:{saveId:SAVE,profileId:P1,managerRole:"playerOne"},observedEnvelope:{revision:0,contentHash:"sha256:"+"e".repeat(64),lifecycleState:"live"}}});
  const final=finalModule.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:local});
  const terminal={phase:"CLOSED",terminal:true,rivalryId:PAIR,terminalWitness:protocol.prepare(final,{sessionId:SESSION})};
  return {final,history,terminal,projection};
}
async function closedFrameKeepsTrophies(){
  const api=require(path.join(root,"js/seasonFinalV10.js"));
  for(const totalSeasons of [1,3,10]){
    const f=await completedShowdown(totalSeasons);
    const before=api.finalFrame(f.final,null,f.history);assert.equal(before.status,"ready",`${totalSeasons}: live reconciliation frame is ready`);
    const after=api.finalFrame(null,f.terminal,f.history);
    assert.equal(after.status,"ready",`${totalSeasons}: closed frame joins the verified complete history`);assert.equal(after.state,"completed");assert.deepEqual(after.trophies,before.trophies);assert.equal(after.winner,before.winner);
    assert.equal(Object.hasOwn(f.terminal.terminalWitness,"acceptedRevisionKey"),false,"the frozen witness schema is unchanged");
    // Integrity: tampered, incomplete, other-rivalry or mismatched-total history stays partial with no trophies.
    const tampered=JSON.parse(JSON.stringify(f.projection));tampered.managerRecords.playerOne.championsLeagues+=1;tampered.managerRecords.playerOne.totalTrophies+=1;
    const shortened=JSON.parse(JSON.stringify(f.projection));shortened.acceptedSeasons-=1;shortened.seasonHistory.pop();
    for(const [label,history] of [["tampered",{...f.history,projection:tampered}],["incomplete",{...f.history,projection:shortened}],["other rivalry",{...f.history,rivalryId:"pair_"+"2".repeat(64)}],["not authoritative",{...f.history,authoritative:false}]]){
      const frame=api.finalFrame(null,f.terminal,history);assert.equal(frame.status,"partial",`${totalSeasons} ${label}: partial`);assert.equal(frame.trophies,undefined,`${totalSeasons} ${label}: no trophies`);
    }
    const otherTotals={...f.terminal,terminalWitness:{...f.terminal.terminalWitness,managerTotals:{playerOne:f.terminal.terminalWitness.managerTotals.playerOne+1,playerTwo:f.terminal.terminalWitness.managerTotals.playerTwo}}};
    assert.equal(api.finalFrame(null,otherTotals,f.history).trophies,undefined,"totals must match the witness");
    // The live path still requires the reconciliation's own acceptedRevisionKey.
    assert.equal(api.finalFrame({...f.final,acceptedRevisionKey:"other"},null,f.history).status,"partial");
  }
  const source=read("js/seasonFinalV10.js");
  assert.match(source,/r===reconciliation\?p\.acceptedRevisionKey===r\.acceptedRevisionKey:closedHistoryBound\(p,r\)/,"the live join keeps its acceptedRevisionKey check");
  assert.match(read("js/sharedTerminalClose.js"),/const INTENT_KEYS=Object\.freeze\(\["schemaVersion","runtimeRevision","phase","rivalryId","sessionId","totalSeasons","completedSeason","managerTotals","winner",/,"terminal witness schema unchanged");
}

// JOB-1042: exercise the registered production frame source, including its async reader and redraw.
async function closedReaderFrameSource(f,readImpl,{history=null,lazy=false}={}){
  const defs={},timers=[],snapshots={history,terminal:f.terminal};let reads=0,wakes=0,loads=0;
  const user={uid:"daniel"},firestore={},firebaseSdk={doc(){},getDoc(){}};
  const reader={async readCompletedShowdown(options){reads++;assert.equal(options.rivalryId,PAIR);assert.equal(options.user,user);assert.equal(options.firestore,firestore);assert.equal(options.firebaseSdk.getDoc,firebaseSdk.getDoc);return readImpl();}};
  const env={console,setTimeout:fn=>timers.push(fn),addEventListener(){},document:{addEventListener(){}},getActiveScreenName:()=>"seasonEntry",
    CareerModeProductionSharedTerminalClose:{getState:()=>snapshots.terminal},CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshots.history},
    CareerModeSharedHistoryConvergence:historyModule,CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:user.uid})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:user},firestore,firestoreSdk:firebaseSdk})},
    CareerModeV10Screens:{install(){return this;},register(id,def){defs[id]=def;},setNavRoute(){},invalidate(){wakes++;},show:async()=>true},
    loadRuntimeScript:async(key,file,ready)=>{loads++;assert.equal(key,"career-completed-reader");assert.equal(file,"js/sparkCompletedShowdownReader.js");env.CareerModeSparkCompletedShowdownReader=reader;assert.equal(ready(),true);}
  };
  if(!lazy)env.CareerModeSparkCompletedShowdownReader=reader;
  vm.runInNewContext(read("js/seasonFinalV10.js"),env);await env.CareerModeSeasonFinalV10.install();
  const flush=()=>{while(timers.length)timers.shift()();};
  flush();
  return {snapshots,frame:()=>defs.seasonEntry.frame().final,flush,counts:()=>({reads,wakes,loads})};
}
async function closedReaderRecoversFinalSeason(){
  const f=await completedShowdown(1),completed=projection=>({status:"completed",rivalryId:PAIR,projection});
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const source=await closedReaderFrameSource(f,()=>pending,{lazy:true,history:{phase:"HISTORY_LOADING"}});
  assert.equal(source.frame().status,"partial","the winner stays visible while the completed read is pending");
  for(let i=0;i<5;i++)source.frame();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(source.counts().reads,1,"overlapping renders share one read");
  const wakesBefore=source.counts().wakes;release(completed(f.projection));await new Promise(resolve=>setImmediate(resolve));source.flush();
  const recovered=source.frame();assert.equal(recovered.status,"ready");assert.equal(recovered.state,"completed");
  assert.equal(JSON.stringify(recovered.lastSeason),JSON.stringify(apiFrame(f).lastSeason));
  assert.equal(JSON.stringify(recovered.trophies),JSON.stringify(apiFrame(f).trophies));
  assert.ok(source.counts().wakes>wakesBefore,"completed read wakes the screen");
  for(let i=0;i<5;i++)source.frame();assert.equal(source.counts().reads,1);assert.equal(source.counts().loads,1);
  // These projections are independently valid; binding them to this witness must still fail.
  const otherRivalry={...f.projection,rivalryId:"pair_"+"2".repeat(64)};
  assert.equal(historyModule.verifyProjection(otherRivalry),otherRivalry);
  const otherTotals=(await completedShowdown(1,{...fact,leaguePosition:1,championsLeague:true})).projection;
  assert.equal(historyModule.verifyProjection(otherTotals),otherTotals);
  assert.notEqual(otherTotals.managerRecords.playerOne.totalPoints,f.projection.managerRecords.playerOne.totalPoints);
  const tampered=JSON.parse(JSON.stringify(f.projection));tampered.managerRecords.playerOne.totalTrophies+=1;
  for(const [label,readImpl] of [
    ["other rivalry",()=>completed(otherRivalry)],["other totals",()=>completed(otherTotals)],["tampered",()=>completed(tampered)],
    ["other reader rivalry",()=>({...completed(f.projection),rivalryId:otherRivalry.rivalryId})],
    ["unavailable",()=>({status:"unavailable"})],["not closed",()=>({status:"not-closed",rivalryId:PAIR,projection:f.projection})],
    ["rejected",()=>Promise.reject(new Error("offline"))]
  ]){
    const invalid=await closedReaderFrameSource(f,readImpl);await new Promise(resolve=>setImmediate(resolve));invalid.flush();
    const frame=invalid.frame();assert.equal(frame.status,"partial",label);assert.equal(frame.state,"completed",label);
    assert.equal(frame.lastSeason,undefined,label);assert.equal(frame.trophies,undefined,label);
    invalid.frame();invalid.flush();assert.equal(invalid.counts().reads,1,`${label}: no repeated read`);
  }
  const live=await closedReaderFrameSource(f,()=>{throw Error("live history must avoid the read");},{history:f.history});
  assert.equal(live.frame().status,"ready");await new Promise(resolve=>setImmediate(resolve));assert.equal(live.counts().reads,0);
  live.snapshots.history={phase:"HISTORY_LOADING"};assert.equal(live.frame().status,"ready","a partial live view does not hide retained history");
  await new Promise(resolve=>setImmediate(resolve));assert.equal(live.counts().reads,0);
  source.snapshots.terminal={...f.terminal,rivalryId:otherRivalry.rivalryId,terminalWitness:{...f.terminal.terminalWitness,rivalryId:otherRivalry.rivalryId}};
  assert.equal(source.frame().status,"partial","the cached history never crosses rivalries");
  console.log("PASS JOB-1042 closed Final Winner reader contracts: ready final season/trophies, one cached read and redraw, verified rivalry/totals binding, partial failures and retained-history priority.");
}
function apiFrame(f){return require(path.join(root,"js/seasonFinalV10.js")).finalFrame(null,f.terminal,f.history);}

(async()=>{
  await recoveryHeldAcrossRefresh();
  await retryStopsOnContextChange();
  await closedFrameKeepsTrophies();
  await closedReaderRecoversFinalSeason();
  console.log("PASS hunt 1017 terminal close recovery contracts: refresh keeps the held witness until a matching closed read, retry stops before close/cleanup when the context changes, closed Final Winner keeps verified trophies (1/3/10 seasons) and rejects tampered history.");
})().catch(error=>{console.error(error);process.exit(1);});
