"use strict";
// Job 31: a 10-season Showdown spread over hours and days outlives the 4-hour private session several times. These
// contracts lock the fixes that keep the reconnect smooth:
//   T1. HOST asks for 4h minus one minute, so a device clock a few seconds fast is not refused by the Rules' 4h cap.
//   T2. The host page picks up the other manager's JOIN by itself (bounded quiet read), instead of staying OPEN until
//       someone taps REFRESH / READ.
//   T3. When the session has ended, shared refresh failures wake the RECONNECT SESSION banner instead of stacking red
//       error toasts; with an exact ACTIVE session every failure is still reported.
//   T4. The banner says who does what (Daniel hosts and sends the code, Nik pastes it and joins), and the Remote Joining
//       panel closes itself once the fresh session is ACTIVE.
//   T5. CI plays the provider journey for 10 seasons with a real expiry and re-join in the middle.
//   T6. When both managers publish a Season Result at the same moment, the loser whose denial arrives before the
//       winner's write is readable re-reads (bounded) and gets the retryable STALE code, not a permission error.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY=`pair_${"3".repeat(64)}`,OLD_SESSION=`session_${"4".repeat(64)}`,NEW_SESSION=`session_${"5".repeat(64)}`,DEVICE=`device_${"6".repeat(32)}`,ACCOUNT="account_daniel";
const FOUR_HOURS=4*60*60*1000;
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

function remoteJoiningHarness({withDocument=false}={}){
  const calls={open:[],read:[]},timers=[];
  let readState="open";
  const protocol={
    generateSessionId:()=>NEW_SESSION,
    normalizeSessionId:value=>String(value||"").trim().toLowerCase(),
    openSession:async options=>{calls.open.push(options);return {ok:true,sessionId:options.sessionId,state:"open",revision:0,expiresAtEpochMs:options.nowEpochMs+options.ttlMs};},
    readSession:async options=>{calls.read.push(options);return {ok:true,sessionId:options.sessionId,state:readState,revision:readState==="open"?0:1,expiresAtEpochMs:Date.now()+FOUR_HOURS-120000};}
  };
  const document=withDocument?{visibilityState:"visible",getElementById:()=>null,querySelector:()=>null,createElement:()=>({}),head:{appendChild(){}},body:{appendChild(){}}}:undefined;
  const sandbox={console,URL,Date,TextEncoder,crypto:webcrypto,Promise,clearTimeout,navigator:{},location:{href:"https://example.test/",origin:"https://example.test",pathname:"/"},
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:ACCOUNT}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:ACCOUNT})},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE})},
    CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:protocol};
  if(document)sandbox.document=document;
  sandbox.globalThis=sandbox;sandbox.window=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/sparkRemoteJoining.js"),sandbox,{filename:"sparkRemoteJoining.js"});
  const api=sandbox.CareerModeSparkRemoteJoining;
  assert.ok(api&&typeof api.hostSession==="function","Remote Joining must load in the harness");
  return {api,calls,timers,document,setReadState:value=>{readState=value;},async tick(){const timer=timers.shift();assert.ok(timer,"a join-watch timer must be armed");await timer.fn();await settle();}};
}

async function t1HostLifetime(){
  const session=require("../../js/sparkPrivateSession.js");
  const h=remoteJoiningHarness();
  assert.equal(h.api.hostSessionTtlMs,FOUR_HOURS-60*1000,"T1 HOST asks for 4h minus one minute");
  assert.ok(h.api.hostSessionTtlMs<=session.maxSessionTtlMs&&h.api.hostSessionTtlMs>FOUR_HOURS-5*60*1000,"T1 the host lifetime stays a valid protocol TTL and still about 4 hours");
  const result=await h.api.hostSession();
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(h.calls.open.length,1);
  assert.equal(h.calls.open[0].ttlMs,h.api.hostSessionTtlMs,"T1 the host call passes the margin lifetime to openSession");
  assert.ok(h.calls.open[0].nowEpochMs+h.calls.open[0].ttlMs<=h.calls.open[0].nowEpochMs+FOUR_HOURS-60*1000,"T1 a clock up to one minute fast stays inside the Rules' request.time + 4h cap");
  assert.equal(h.timers.length,0,"T1 without a document no background read is ever scheduled");
  console.log("ok T1 HOST asks for 4h minus one minute, so a slightly fast clock is not refused by the Rules");
}

async function t2HostSeesJoin(){
  const h=remoteJoiningHarness({withDocument:true});
  await h.api.hostSession();
  assert.equal(h.api.getState().sessionState,"open");
  assert.equal(h.timers.length,1,"T2 hosting arms exactly one quiet join watch");
  assert.ok(h.timers[0].ms>=2000&&h.timers[0].ms<=10000,"T2 the watch reads every few seconds, not in a tight loop");
  await h.tick();
  assert.equal(h.calls.read.length,1,"T2 one quiet read per tick");
  assert.equal(h.api.getState().sessionState,"open","T2 still waiting while the other manager has not joined");
  assert.equal(h.timers.length,1,"T2 the watch re-arms while OPEN");
  h.document.visibilityState="hidden";await h.tick();
  assert.equal(h.calls.read.length,1,"T2 no read while the page is hidden");
  h.document.visibilityState="visible";h.setReadState("active");await h.tick();
  assert.equal(h.calls.read.length,2);
  assert.equal(h.api.getState().sessionState,"active","T2 the host picks up the join without REFRESH / READ");
  assert.equal(h.api.getState().role,"host");
  assert.match(h.api.getState().message,/joined/i);
  if(h.timers.length){await h.tick();}
  assert.equal(h.timers.length,0,"T2 the watch stops once the session is ACTIVE");
  assert.equal(h.calls.read.length,2,"T2 no read after the join was seen");
  // Bounded: a join that never comes stops the watch after ten minutes.
  const late=remoteJoiningHarness({withDocument:true});await late.api.hostSession();
  const realNow=Date.now;try{Date.now=()=>realNow()+11*60*1000;await late.tick();}finally{Date.now=realNow;}
  assert.equal(late.calls.read.length,0,"T2 no read after the ten-minute bound");
  assert.equal(late.timers.length,0,"T2 the watch ends after ten minutes");
  console.log("ok T2 the host page sees the other manager's JOIN by itself, quietly and bounded");
}

function terminalCloseHarness(remoteState){
  const reports=[],refreshes=[];
  const sandbox={console:{...console,warn(){}},Promise,Date,setTimeout,clearTimeout,setInterval(){return 0;},
    currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RIVALRY}},
    reportApplicationError:(context,error)=>reports.push({context,code:error&&error.code}),
    CareerModeSparkRemoteJoining:{getState:()=>remoteState},
    CareerModeProductionSharedJourneyReconnect:{refresh:()=>{refreshes.push(1);return Promise.resolve(null);}}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedTerminalClose.js"),sandbox,{filename:"productionSharedTerminalClose.js"});
  const api=sandbox.CareerModeProductionSharedTerminalClose;
  assert.ok(api&&typeof api.reportUnlessClosed==="function","Terminal Close must load in the harness");
  return {api,reports,refreshes};
}

async function t3QuietWhenSessionEnded(){
  const failure=Object.assign(new Error("Shared Multi Season progression could not be verified."),{code:"MULTI_SEASON_SETUP_NOT_CONFIRMED"});
  const cases=[
    ["expired by clock",{sessionState:"active",sessionId:OLD_SESSION,pendingAction:null,expiresAtEpochMs:Date.now()-1000}],
    ["dropped by a reload",{sessionState:null,sessionId:null,pendingAction:null,expiresAtEpochMs:null}],
    ["waiting on an unresolved reconnect",{sessionState:"unresolved",sessionId:NEW_SESSION,pendingAction:"join",expiresAtEpochMs:null}]
  ];
  for(const [label,remote] of cases){
    const h=terminalCloseHarness(remote);
    const reported=await h.api.reportUnlessClosed("Unable to refresh Shared Multi Season progression",failure);
    assert.equal(reported,false,`T3 ${label}: the failure is not reported`);
    assert.equal(h.reports.length,0,`T3 ${label}: no red error toast`);
    assert.equal(h.refreshes.length,1,`T3 ${label}: the RECONNECT SESSION banner is woken instead`);
  }
  const active=terminalCloseHarness({sessionState:"active",sessionId:NEW_SESSION,pendingAction:null,expiresAtEpochMs:Date.now()+FOUR_HOURS});
  assert.equal(await active.api.reportUnlessClosed("Unable to refresh Shared Multi Season progression",failure),true,"T3 with an exact ACTIVE session the failure is still reported");
  assert.equal(active.reports.length,1);assert.equal(active.reports[0].code,"MULTI_SEASON_SETUP_NOT_CONFIRMED");
  assert.equal(active.refreshes.length,0);
  console.log("ok T3 an ended session wakes the reconnect banner instead of stacking error toasts; real failures still report");
}

function reconnectHarness(role,authority={}){
  const listeners=new Set(),panel={opens:0,closes:0},reports=[];
  let remote={sessionId:OLD_SESSION,rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE,sessionState:"active",pendingAction:null,expiresAtEpochMs:Date.now()-1000};
  const status={id:"sharedJourneyReconnectStatus",text:"",dataset:{},hidden:true,
    classList:{toggle:(name,force)=>{if(name==="hidden")status.hidden=Boolean(force);}},
    replaceChildren(...nodes){status.text=nodes.map(node=>typeof node==="string"?node:node.textContent||"").join("");},
    append(...nodes){status.text+=nodes.map(node=>typeof node==="string"?node:node.textContent||"").join("");}};
  const document={visibilityState:"visible",getElementById:id=>id==="sharedJourneyReconnectStatus"?status:null,createTextNode:text=>String(text),
    createElement:()=>({textContent:"",dataset:{},addEventListener(){}}),addEventListener(){}};
  const sandbox={console,Promise,Date,document,navigator:{onLine:true},setTimeout,clearTimeout,setInterval(){return 0;},addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RIVALRY},managers:{playerOne:"Daniel",playerTwo:"Nik"}},
    reportApplicationError(_context,error){reports.push(error);},
    CareerModeSharedMultiSeasonProgression:require("../../js/sharedMultiSeasonProgression.js"),
    CareerModeSharedJourneyReconnect:require("../../js/sharedJourneyReconnect.js"),
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>null},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>null,getState:()=>null,lastError:()=>""},
    CareerModeSparkRemoteJoining:{getState:()=>remote,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},openPanel:async()=>{panel.opens+=1;return true;},closePanel:()=>{panel.closes+=1;return true;}},
    CareerModeSparkConnectedAccount:{getState:()=>authority.account?authority.account():({connected:true,accountId:ACCOUNT})},
    CareerModeSparkPrivatePairing:{getState:()=>authority.device?authority.device():({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{getState:()=>authority.rivalry?authority.rivalry():({attached:true,rivalryId:RIVALRY,binding:{managerRole:role}})}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedJourneyReconnect.js"),sandbox,{filename:"productionSharedJourneyReconnect.js"});
  const api=sandbox.CareerModeProductionSharedJourneyReconnect;
  assert.ok(api&&typeof api.openSessionRecovery==="function","Journey Reconnect must load in the harness");
  return {api,panel,status,listeners,reports,setRemote(next){remote={...remote,...next};for(const listener of [...listeners])listener(remote);}};
}

async function t4ClearReconnect(){
  const nik=reconnectHarness("playerTwo");
  await nik.api.refresh();
  assert.equal(nik.api.getState().phase,"FRESH_SESSION_REQUIRED");
  assert.equal(nik.status.hidden,false,"T4 the banner is visible");
  assert.match(nik.status.text,/NEW CONNECTION NEEDED/,"T4 the banner keeps its headline");
  assert.match(nik.status.text,/4 hours/,"T4 the banner says why (sessions last up to 4 hours)");
  assert.match(nik.status.text,/paste the new code from Daniel and tap JOIN PRIVATE SESSION/,"T4 Nik is told to paste Daniel's code and join");
  assert.doesNotMatch(nik.status.text,/exact ACTIVE|active authority/,"T4 no engineering jargon in the banner");
  assert.match(nik.status.text,/RECONNECT SESSION/);
  const daniel=reconnectHarness("playerOne");
  await daniel.api.refresh();
  assert.match(daniel.status.text,/HOST PRIVATE SESSION and send the new code to Nik/,"T4 Daniel is told to host and send the code");

  assert.equal(await nik.api.openSessionRecovery(),true);
  assert.equal(nik.panel.opens,1,"T4 RECONNECT SESSION opens Remote Joining once");
  nik.setRemote({sessionState:"unresolved",sessionId:NEW_SESSION,pendingAction:"join",expiresAtEpochMs:null});
  assert.equal(nik.panel.closes,0,"T4 the panel stays open while the join is unresolved");
  nik.setRemote({sessionState:"active",sessionId:NEW_SESSION,pendingAction:null,expiresAtEpochMs:Date.now()+FOUR_HOURS-60000});
  assert.equal(nik.panel.closes,1,"T4 the panel closes itself once the fresh session is ACTIVE");
  nik.setRemote({revision:2});
  assert.equal(nik.panel.closes,1,"T4 the auto-close fires once, then lets go");
  await settle();
  console.log("ok T4 the reconnect banner says who hosts and who joins, and Remote Joining closes itself once ACTIVE");
}

function t5TenSeasonCi(){
  const workflow=read(".github/workflows/validate-gameplay-fast.yml");
  const step=workflow.split("\n").find(line=>line.includes("node tests/firebase/two-manager-journey-emulator.cjs"))||"";
  assert.match(step,/CMS_SHOWDOWN_LENGTH=3 node tests\/firebase\/two-manager-journey-emulator\.cjs/,"T5 the 3-season journey still runs");
  assert.match(step,/CMS_SHOWDOWN_LENGTH=10 node tests\/firebase\/two-manager-journey-emulator\.cjs/,"T5 fast CI plays the full 10-season journey");
  const journey=read("tests/firebase/two-manager-journey-emulator.cjs");
  assert.match(journey,/const ROTATE_SEASON=TOTAL_SEASONS>=3\?Math\.floor\(TOTAL_SEASONS\/2\)\+1:null;/,"T5 the session rotates mid-game (season 6 of 10)");
  assert.match(journey,/StandardSessions\.expireSession\(/,"T5 the old session is expired through the real Rules");
  assert.match(journey,/assert\.equal\(stale\.ok,false,"no shared write may use the expired session"\)/,"T5 the expired session cannot write");
  assert.match(journey,/StandardSessions\.openSession\(sessionOptions\(dbA,A,DA,S4,Date\.now\(\)\+20000,RemoteJoining\.hostSessionTtlMs\)\)/,"T5 Daniel re-hosts with the production host lifetime from a fast clock");
  assert.match(journey,/StandardSessions\.joinSession\(/,"T5 Nik re-joins");
  assert.match(journey,/if\(season===ROTATE_SEASON\)\{await expireAndRejoin\(env,\{dbA,dbB,a,season\}\);sid=S4;\}/,"T5 the rotation happens inside an open transfer window, after one manager locked guesses");
  assert.match(journey,/Terminal\.prepare\(finalA,\{sessionId:sid\}\)/,"T5 Terminal Close uses the fresh session");
  console.log("ok T5 fast CI plays 10 seasons with a real session expiry and re-join in the middle");
}

async function t6SimultaneousPublishLoser(){
  const Provider=require(path.join(ROOT,"js/sparkSharedSeasonResults.js"));
  const op=n=>`season_result_op_${Number(n).toString(16).padStart(32,"0")}`;
  const snapshot=value=>({exists:()=>value!==null&&value!==undefined,data:()=>value});
  function sdkWith(reads){
    const counts={run:0,get:0};
    const sdk={doc:(_db,...parts)=>parts.join("/"),serverTimestamp:()=>({toMillis:()=>2_000_000}),
      runTransaction:async()=>{counts.run+=1;if(counts.run===1)return 18;if(counts.run===2)throw {code:"permission-denied"};throw new Error("unexpected transaction retry");},
      getDoc:async()=>{const next=reads[Math.min(counts.get,reads.length-1)];counts.get+=1;return snapshot(next);}};
    return {sdk,counts};
  }
  const options=sdk=>({user:{uid:"manager_one"},firestore:{},firebaseSdk:sdk,rivalryId:RIVALRY,sessionId:OLD_SESSION,deviceId:DEVICE,seasonNumber:2,operationId:op(21),baseRevision:0,result:{leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false},cryptoImpl:webcrypto,nowEpochMs:2_000_000});
  const late=sdkWith([null,{revision:1,operationIds:[op(22)]}]);
  let out=await Provider.publishResult(options(late.sdk));
  assert.deepEqual(out,{ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"},"T6 a loser whose rival write is readable a moment later gets the retryable STALE code");
  assert.deepEqual(late.counts,{run:2,get:2},"T6 the loser re-reads, and never retries the denied write");
  const denied=sdkWith([{revision:0,operationIds:[]}]);
  out=await Provider.publishResult(options(denied.sdk));
  assert.deepEqual(out,{ok:false,code:"permission-denied"},"T6 a denial with no rival write is still surfaced");
  assert.deepEqual(denied.counts,{run:2,get:3},"T6 the extra re-reads are bounded to three in total");
  console.log("ok T6 a simultaneous-publish loser gets the retryable STALE code even when the rival write lands a moment late");
}

// Codex P1 on #366: every refresher failure during an ended session wakes Journey Reconnect, often before Connected Rivalry
// (or the account/device) has attached after a reload. That unresolved authority is a quiet pending state, not a red error;
// a real identity conflict (wrong rivalry, invalid role) still reports.
async function t7PendingAuthorityQuiet(){
  let rivalry={attached:false,rivalryId:"",binding:null};
  const nik=reconnectHarness("playerTwo",{rivalry:()=>rivalry});
  for(let poll=0;poll<3;poll+=1)await nik.api.refresh();
  assert.deepEqual(nik.reports.map(error=>error.code),[],"T7 an unattached rivalry after reload never reports JOURNEY_RECONNECT_RIVALRY_REQUIRED");
  assert.equal(nik.api.getState(),null,"T7 nothing is claimed while the rivalry is unresolved");
  rivalry={attached:true,rivalryId:RIVALRY,binding:{managerRole:"playerTwo"}};
  await nik.api.refresh();
  assert.equal(nik.api.getState().phase,"FRESH_SESSION_REQUIRED","T7 once the rivalry attaches the RECONNECT SESSION banner takes over");
  assert.equal(nik.status.hidden,false);
  assert.equal(nik.reports.length,0);
  for(const [label,authority] of [["signed-out account",{account:()=>({connected:false,accountId:""})}],["unregistered device",{device:()=>({registered:false,deviceId:""})}]]){
    const h=reconnectHarness("playerOne",authority);await h.api.refresh();await h.api.refresh();
    assert.equal(h.reports.length,0,`T7 ${label} is a quiet pending state`);
  }
  for(const [label,state,code] of [["another rivalry",{attached:true,rivalryId:"rivalry_other",binding:{managerRole:"playerOne"}},"JOURNEY_RECONNECT_RIVALRY_MISMATCH"],["an invalid role",{attached:true,rivalryId:RIVALRY,binding:{managerRole:"referee"}},"JOURNEY_RECONNECT_ROLE_INVALID"]]){
    const h=reconnectHarness("playerOne",{rivalry:()=>state});await h.api.refresh();
    assert.deepEqual(h.reports.map(error=>error.code),[code],`T7 ${label} is still reported`);
  }
  console.log("ok T7 unresolved account/device/rivalry authority stays quiet until attached; identity conflicts still report");
}

(async()=>{
  await t1HostLifetime();
  await t2HostSeesJoin();
  await t3QuietWhenSessionEnded();
  await t4ClearReconnect();
  t5TenSeasonCi();
  await t6SimultaneousPublishLoser();
  await t7PendingAuthorityQuiet();
  console.log("PASS ten-season session contracts: 7 checks (host clock margin, host sees the join, quiet refreshers while reconnecting, clear reconnect banner and auto-close, 10-season CI journey with mid-game expiry, simultaneous-publish loser stays retryable, unresolved reconnect authority stays quiet).");
})().catch(error=>{console.error(error);process.exit(1);});
