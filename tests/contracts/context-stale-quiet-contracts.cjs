"use strict";
// Quiet *_CONTEXT_STALE in background refreshers. A code ending in _CONTEXT_STALE (SEASON_RESULTS_, SEASON_COMMIT_, TRANSFER_)
// means the season moved on while a nested read was running; the next tick reads again for the new season. The Shared
// Canonical Scoring tick used to report it as an app error ("Unable to refresh Shared Canonical Scoring: SEASON_COMMIT_CONTEXT_STALE")
// and drop its view. Seen in local two-manager journey runs under load; a player would have seen that notice.
//   QS1  a reconciled Canonical Scoring view is read and kept for its season.
//   QS2  a nested SEASON_COMMIT_CONTEXT_STALE / SEASON_RESULTS_CONTEXT_STALE / TRANSFER_CONTEXT_STALE is not reported and keeps the view.
//   QS3  any other refresh failure is still reported and still clears the view (unchanged behaviour).
//   QS4  the sibling refreshers that can receive a nested stale code (Season Commit check, Shared History) stay quiet on it too,
//        while their real-failure reports are unchanged.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"7".repeat(64),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32);
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
const stale=code=>Object.assign(new Error(code),{code});

function scoringHarness(){
  const reports=[],listeners={};let refreshError=null,reads=0;
  const seasonEntry={classList:{contains:()=>false,toggle(){}}};
  const sandbox={console,crypto:webcrypto,Promise,Date,JSON,setTimeout:()=>0,setInterval:()=>0};
  sandbox.globalThis=sandbox;
  sandbox.document={visibilityState:"visible",getElementById:id=>id==="seasonEntry"?seasonEntry:null};
  sandbox.addEventListener=(type,fn)=>{listeners[type]=fn;};
  sandbox.reportApplicationError=(context,error)=>reports.push(`${context}: ${error&&error.code}`);
  sandbox.currentShowdown={id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId:RIVALRY}};
  const setupState={ready:true,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league"}};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>setupState,getState:()=>setupState};
  sandbox.CareerModeProductionSharedSeasonCommit={refresh:async()=>{if(refreshError)throw refreshError;return null;},getState:()=>({committed:true,phase:"ACKNOWLEDGED",revision:3,seasonNumber:1,rivalryId:RIVALRY})};
  sandbox.CareerModeSharedShowdownCatalog={catalog:{premier_league:Array.from({length:20},(_,i)=>`Club ${i}`)}};
  sandbox.CareerModeSparkSharedSeasonCommit={};sandbox.CareerModeSharedCanonicalScoring={};
  sandbox.CareerModeSparkSharedCanonicalScoring={read:async()=>{reads+=1;return {ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,seasonNumber:1,scoring:{playerOne:{total:9},playerTwo:{total:3}}};}};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"nik"}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedCanonicalScoring.js"),sandbox,{filename:"productionSharedCanonicalScoring.js"});
  const api=sandbox.CareerModeProductionSharedCanonicalScoring;
  api.install();
  assert.equal(typeof listeners["career-mode-shared-season-cursor-change"],"function","install() must listen for season cursor changes");
  async function tick(){listeners["career-mode-shared-season-cursor-change"]();await settle();}
  return {api,reports,tick,setError:error=>{refreshError=error;},reads:()=>reads};
}

async function main(){
  const h=scoringHarness();
  await h.tick();
  assert.equal(h.api.getState()?.phase,"SCORING_RECONCILED","QS1 the reconciled season score is read");
  assert.equal(h.reads(),1,"QS1 one provider read");
  for(const code of ["SEASON_COMMIT_CONTEXT_STALE","SEASON_RESULTS_CONTEXT_STALE","TRANSFER_CONTEXT_STALE"]){
    h.setError(stale(code));await h.tick();
    assert.deepEqual(h.reports,[],`QS2 ${code} is not reported as an app error`);
    assert.equal(h.api.getState()?.phase,"SCORING_RECONCILED",`QS2 ${code} keeps the reconciled view`);
  }
  h.setError(stale("permission-denied"));await h.tick();
  assert.deepEqual(h.reports,["Unable to refresh Shared Canonical Scoring: permission-denied"],"QS3 a real failure is still reported");
  assert.equal(h.api.getState(),null,"QS3 a real failure still clears the view");

  const commit=read("js/productionSharedSeasonCommit.js");
  assert.match(commit,/if\(psscContextMatches\(request\)&&psscResultsPublished\(request\)&&!\/_CONTEXT_STALE\$\/\.test\(String\(error\?\.code\|\|""\)\)\)\{[^}]*psscReport\("Unable to check Shared Season Commit",error\)/,"QS4 the Season Commit check stays quiet on a nested *_CONTEXT_STALE and still reports other failures");
  const history=read("js/productionSharedHistoryConvergence.js");
  assert.match(history,/error=>\{if\(\/_CONTEXT_STALE\$\/\.test\(String\(error\?\.code\|\|""\)\)\)return view&&contextKey===request\.key\?view:null;if\(phcContextMatches\(request\)\)\{[\s\S]{0,300}phcReport\("Unable to converge Shared History",error\)/,"QS4 Shared History stays quiet on a nested *_CONTEXT_STALE and still reports repeated failures");
  console.log("PASS context-stale quiet contracts: 4 numbered checks (QS1-QS4) - a refresh that outlives its season is not reported and keeps the last view; real failures are still reported.");
}

main().catch(error=>{console.error(error);process.exitCode=1;});
