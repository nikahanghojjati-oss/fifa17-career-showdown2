"use strict";
// Job 23 (bug hunt item 3, Nik's decision 2026-10-04) added a CHECK RESULTS warning on the Shared Season Commit panel.
// r80 (Nik, 2026-10-19): the two managers play DIFFERENT FIFA saves on different consoles, so in the same season both can
// finish 1st (same league position), both win the Champions League and both win the domestic cup. That is normal and must
// never show a warning. Only one save winning two exclusive trophies (Champions League and Europa League) is impossible;
// that same-manager line is not added yet, so every combination below returns [].
//   A. seasonResultClash(results) is pure, still returns an array, and returns [] for every cross-manager combination.
//   B. The commit panel status never shows CHECK RESULTS for these combinations, for the coordinator or the waiting manager.
//   C. The commit button is never disabled and a tap still reaches provider.commitSeason.
//   D. Scoring, Rules and providers are untouched: the clash code only reads the revealed results and never disables.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"7".repeat(64),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32);
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,10));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
const result=(patch={})=>({leaguePosition:1,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...patch});

function harness(playerOne,playerTwo,{role="playerOne"}={}){
  const nodes=new Map(),handlers={},calls={commit:0,acknowledge:0};
  let committed=false;
  function node(id){
    if(!nodes.has(id)){
      const classes=new Set(["hidden"]);
      const n={id,textContent:"",disabled:false,attributes:{},className:"",type:"",parentNode:null,
        classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,force)=>{const want=force===undefined?!classes.has(c):Boolean(force);if(want)classes.add(c);else classes.delete(c);return want;}},
        setAttribute(k,v){n.attributes[k]=String(v);},removeAttribute(k){delete n.attributes[k];},addEventListener(){},closest:()=>n,
        insertBefore(child){nodes.set(child.id,child);},prepend(child){nodes.set(child.id,child);},querySelector:()=>null};
      nodes.set(id,n);
    }
    return nodes.get(id);
  }
  const actions=node("actions");actions.parentNode=node("panelParent");
  const panel=node("seasonReviewPanel");panel.querySelector=selector=>selector===".seasonReviewActions"?actions:null;
  node("seasonEntry").classList.remove("hidden");
  const document={visibilityState:"visible",getElementById:id=>nodes.get(id)||(id==="seasonReviewPanel"||id==="seasonEntry"||id==="seasonReviewError"?node(id):null),
    createElement:()=>{const n=node(`created_${nodes.size}`);n.classList.remove("hidden");n.classList.add("hidden");return n;},addEventListener(type,fn){handlers[type]=fn;}};
  // psscEnsureUi creates elements by id after createElement, so register them under their id on assignment.
  const created=new Proxy(document,{get(target,key){if(key==="createElement")return tag=>{const n=target.createElement(tag);let id="";Object.defineProperty(n,"id",{get:()=>id,set:value=>{id=value;nodes.set(value,n);},configurable:true});return n;};return target[key];}});
  const allResults={playerOne,playerTwo};
  const provider={
    read:async()=>({ok:true,revision:committed?3:2,managerRole:role,coordinatorRole:"playerOne",committed,phase:committed?"COMMITTED":"RESULTS_READY",ownAcknowledged:false}),
    commitSeason:async()=>{calls.commit+=1;committed=true;return {ok:true};},
    acknowledgeSeason:async()=>{calls.acknowledge+=1;return {ok:true};}
  };
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,document:created,Uint8Array};
  sandbox.globalThis=sandbox;sandbox.setInterval=()=>0;
  sandbox.currentShowdown={id:"save_1",managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:RIVALRY},currentRound:1};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>null,getState:()=>({ready:true,managerRole:role,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne"}})};
  sandbox.CareerModeProductionSharedSeasonResults={refresh:async()=>null,getState:()=>({state:{phase:"RESULTS_READY",revision:2},seasonNumber:1,rivalryId:RIVALRY,allResults})};
  for(const key of ["CareerModeSharedShowdownCatalog","CareerModeSharedShowdownSetup","CareerModeSharedSeasonResults","CareerModeSharedSeasonCommit"])sandbox[key]={};
  sandbox.CareerModeSparkSharedSeasonCommit=provider;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_1"}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_meta,run)=>run()};
  sandbox.reportApplicationError=(context,error)=>{throw error;};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedSeasonCommit.js"),sandbox);
  const api=sandbox.CareerModeProductionSharedSeasonCommit;
  assert.ok(api&&typeof api.install==="function","Season Commit must load in the harness");
  return {api,calls,node:id=>nodes.get(id),status:()=>nodes.get("sharedSeasonCommitStatus").textContent,action:()=>nodes.get("sharedSeasonCommitAction"),
    async tap(){await handlers.click({target:nodes.get("sharedSeasonCommitAction"),preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});await settle();}};
}

function pureContracts(){
  const raw=harness(result(),result({leaguePosition:2})).api.seasonResultClash;
  assert.equal(typeof raw,"function","seasonResultClash must be exported");
  const clash=value=>{const lines=raw(value);assert.ok(Array.isArray(lines),"seasonResultClash must return an array");return [...lines];};
  assert.deepEqual(clash({playerOne:result({leaguePosition:1}),playerTwo:result({leaguePosition:1})}),[],"both managers 1st in their own saves is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:4}),playerTwo:result({leaguePosition:4})}),[],"any shared league position is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:4,championsLeague:true}),playerTwo:result({leaguePosition:7,championsLeague:true})}),[],"both winning the Champions League is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:3,domesticCup:true}),playerTwo:result({leaguePosition:5,domesticCup:true})}),[],"both winning the domestic cup is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:2,championsLeague:true,domesticCup:true}),playerTwo:result({leaguePosition:2,championsLeague:true,domesticCup:true})}),[],
    "same position, both Champions League and both domestic cup together is still not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:1,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true}),playerTwo:result({leaguePosition:1,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true})}),[],
    "both managers winning everything in their own saves is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:2,domesticCup:true}),playerTwo:result({leaguePosition:4,domesticCup:true})}),[],"the browser journey's season 3 (positions 2 and 4, both cup) is not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:1,championsLeague:true}),playerTwo:result({leaguePosition:3,domesticCup:true})}),[],"different positions and different cups do not clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:1,topScorer:true,topAssist:true}),playerTwo:result({leaguePosition:2,topScorer:true,topAssist:true})}),[],"top scorer and top assist on both sides are not a clash");
  assert.deepEqual(clash({playerOne:result({leaguePosition:1,championsLeague:false,domesticCup:false}),playerTwo:result({leaguePosition:2,championsLeague:false,domesticCup:false})}),[],"both unticked is not a clash");
  for(const bad of [null,undefined,{},{playerOne:result()},{playerOne:result(),playerTwo:null},"x"])assert.deepEqual(clash(bad),[],"missing results never throw and never clash");
  const input={playerOne:result({championsLeague:true}),playerTwo:result({championsLeague:true})};const copy=JSON.parse(JSON.stringify(input));clash(input);assert.deepEqual(input,copy,"the function must not mutate its input");
}

async function renderContracts(){
  const coordinatorStatus="BOTH RESULTS ARE IN · LOCK THE SEASON";
  // B1. Both 1st: the coordinator sees the plain status, no CHECK RESULTS.
  let h=harness(result({leaguePosition:1}),result({leaguePosition:1}),{role:"playerOne"});h.api.install();await h.api.refresh();await settle();
  assert.equal(h.status(),coordinatorStatus,"both managers 1st shows the unchanged status text");
  assert.ok(!/CHECK RESULTS/.test(h.status()),"both managers 1st never shows CHECK RESULTS");
  assert.equal(h.action().textContent,"LOCK & CONFIRM SEASON");
  // C. The commit action stays enabled and a tap still commits.
  assert.equal(h.action().disabled,false,"both managers 1st must never disable LOCK & CONFIRM SEASON");assert.notEqual(h.action().attributes["aria-disabled"],"true");
  await h.tap();assert.equal(h.calls.commit,1,"a tap on a season where both managers finished 1st reaches commitSeason");
  assert.match(h.status(),/SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT/,"after commit the normal acknowledge state shows");
  assert.equal(h.action().textContent,"CONFIRM SEASON");assert.equal(h.action().disabled,false,"acknowledge stays enabled");
  assert.ok(!/CHECK RESULTS/.test(h.status()),"no CHECK RESULTS after commit either");
  assert.equal(h.calls.acknowledge,1,"the coordinator's one tap also records his acknowledgement (R7)");
  await h.tap();assert.equal(h.calls.acknowledge,2,"the ACKNOWLEDGE fallback still works");
  // B2. Each formerly flagged combination on its own, and all together: no warning, enabled, commits.
  for(const [label,one,two] of [
    ["both Champions League",result({leaguePosition:4,championsLeague:true}),result({leaguePosition:7,championsLeague:true})],
    ["both domestic cup",result({leaguePosition:3,domesticCup:true}),result({leaguePosition:5,domesticCup:true})],
    ["same position, both Champions League and both domestic cup",result({leaguePosition:2,championsLeague:true,domesticCup:true}),result({leaguePosition:2,championsLeague:true,domesticCup:true})]
  ]){
    h=harness(one,two);h.api.install();await h.api.refresh();await settle();
    assert.equal(h.status(),coordinatorStatus,`${label}: the status text is unchanged`);
    assert.ok(!/CHECK RESULTS/.test(h.status()),`${label}: no CHECK RESULTS`);
    assert.equal(h.action().disabled,false,`${label}: COMMIT stays enabled`);
    await h.tap();assert.equal(h.calls.commit,1,`${label}: a tap reaches commitSeason`);
  }
  // B3. The waiting manager never sees it either; the button is the existing waiting state (disabled by role only).
  h=harness(result({domesticCup:true,championsLeague:true,leaguePosition:1}),result({domesticCup:true,championsLeague:true,leaguePosition:1}),{role:"playerTwo"});h.api.install();await h.api.refresh();await settle();
  assert.equal(h.status(),"BOTH RESULTS ARE IN · WAITING FOR Daniel TO LOCK THE SEASON","the waiting manager sees the unchanged waiting text");
  assert.ok(!/CHECK RESULTS/.test(h.status()),"the waiting manager never sees CHECK RESULTS for both managers winning");
  assert.equal(h.action().textContent,"WAITING FOR DANIEL");
  // B4. Different results: nothing extra, and top scorer on both sides is not a clash.
  h=harness(result({leaguePosition:1,topScorer:true,championsLeague:true}),result({leaguePosition:3,topScorer:true,domesticCup:true}));h.api.install();await h.api.refresh();await settle();
  assert.equal(h.status(),coordinatorStatus,"different results leave the status text unchanged");
  assert.equal(h.action().disabled,false);await h.tap();assert.equal(h.calls.commit,1);
}

function sourceContracts(){
  const commit=read("js/productionSharedSeasonCommit.js");
  assert.ok(commit.includes("seasonResultClash:psscSeasonResultClash"),"the pure clash function must be exported");
  const fn=commit.slice(commit.indexOf("function psscSeasonResultClash"),commit.indexOf("function psscManagerName"));
  assert.ok(fn.length>0&&!/psscDisable|disabled|psscFail|throw /.test(fn),"the clash code must never disable a control or throw");
  assert.ok(!/topScorer|topAssist/.test(fn),"top scorer and top assist are not clashes");
  assert.ok(!/leaguePosition|domesticCup|Both managers/.test(fn),"r80: the same league position or both managers winning a trophy is never a clash");
  const render=commit.slice(commit.indexOf("function psscRender"),commit.indexOf("function psscBind"));
  assert.ok(!/psscDisable\([^)]*psscSeasonResultClash|psscDisable\([^)]*psscClashWarning/.test(render),"no disable decision may depend on a clash");
}

const watchdog=setTimeout(()=>{console.error("season-result-clash: a promise never settled");process.exit(1);},60000);
(async()=>{
  pureContracts();await renderContracts();sourceContracts();
  clearTimeout(watchdog);
  console.log("PASS Season result clash contracts: same league position, both Champions League and both Domestic Cup are normal (different saves) and never show CHECK RESULTS; seasonResultClash still returns an array; commit and acknowledge stay enabled and commit reaches commitSeason.");
})().catch(error=>{console.error(error);process.exit(1);});
