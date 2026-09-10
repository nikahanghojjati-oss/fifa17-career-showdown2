const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const historyModule=require("../../js/sharedHistoryConvergence.js");
const rivalryId=`pair_${"a".repeat(64)}`;
const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:1,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"}};
const slots=[{slotId:"playerOne",accountId:"acct-a",profileId:`profile_${"b".repeat(24)}`,saveId:`save_${"c".repeat(24)}`,entitlementState:"active"},{slotId:"playerTwo",accountId:"acct-b",profileId:`profile_${"d".repeat(24)}`,saveId:`save_${"e".repeat(24)}`,entitlementState:"active"}];
const p1={leaguePosition:1,leaguePoints:101,leagueGoals:102,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true},p2={leaguePosition:2,leaguePoints:90,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const score=r=>({championsLeague:r.championsLeague?5:0,leagueTitle:r.leaguePosition===1?3:0,domesticCup:r.domesticCup?1:0,performanceBonus:r.leaguePoints>=100||r.leagueGoals>=100?1:0,individualAwardsBonus:r.topScorer||r.topAssist?1:0,total:(r.championsLeague?5:0)+(r.leaguePosition===1?3:0)+(r.domesticCup?1:0)+(r.leaguePoints>=100||r.leagueGoals>=100?1:0)+(r.topScorer||r.topAssist?1:0)});
const hash=`sha256:${"1".repeat(64)}`,a=score(p1),b=score(p2);
const projection=historyModule.buildProjection({rivalryId,setup,managerSlots:slots,seasons:[{commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,scoring:{playerOne:a,playerTwo:b},winner:"playerOne"}}]});
const multi={ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId,state:{phase:"SHOWDOWN_COMPLETE",rivalryId,terminal:true,totalSeasons:1,acceptedSeasons:1,completedSeason:1,activeSeason:null,acceptedRevisionKey:projection.acceptedRevisionKey,leagueId:setup.leagueId,fixedClubs:setup.clubs}};
const history={ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection};
function localFor(role){const slot=slots[role==="playerOne"?0:1];return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function makeContext(role){const writes=[];const listeners=new Map();const slot=slots[role==="playerOne"?0:1],local=localFor(role);const context={console,currentShowdown:{id:slot.saveId,managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId}},navigator:{onLine:true},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){},addEventListener(type,fn){listeners.set(type,fn);},setInterval(){return 1;},setTimeout(){return 1;},localStorage:{setItem(...args){writes.push(args);}},sessionStorage:{setItem(...args){writes.push(args);}},CareerModeSharedHistoryConvergence:historyModule,CareerModeProductionSharedMultiSeasonProgression:{async refresh(){return multi;},getState(){return multi;}},CareerModeProductionSharedHistoryConvergence:{async refresh(){return history;},getState(){return history;}},CareerModeProductionSharedLocalReconciliation:{refresh(){return local;},getState(){return local;}}};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("js/sharedFinalReconciliation.js","utf8"),context,{filename:"sharedFinalReconciliation.js"});vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context,{filename:"productionSharedFinalReconciliation.js"});return {context,writes,slot,local};}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const leftContext=makeContext("playerOne"),rightContext=makeContext("playerTwo");
  leftContext.context.CareerModeProductionSharedFinalReconciliation.install();rightContext.context.CareerModeProductionSharedFinalReconciliation.install();
  const left=await leftContext.context.CareerModeProductionSharedFinalReconciliation.refresh(),right=await rightContext.context.CareerModeProductionSharedFinalReconciliation.refresh();
  assert.deepEqual(JSON.parse(JSON.stringify(left)),JSON.parse(JSON.stringify(right)),"Both independent manager contexts must converge on one identical completed Showdown projection.");assert.equal(left.phase,"FINAL_SEASON_RECONCILED");assert.equal(left.winner,"playerOne");assert.equal(left.acceptedSeasons,1);assert.equal(left.nextSeason,null);assert.equal(left.extraSeasonAllowed,false);assert.equal(left.terminalCloseRequired,true);assert.deepEqual(leftContext.writes,[]);assert.deepEqual(rightContext.writes,[]);

  const race=makeContext("playerOne"),api=race.context.CareerModeProductionSharedFinalReconciliation,showdownA=race.context.currentShowdown;
  let releaseFirst=null,multiCalls=0;
  race.context.CareerModeProductionSharedMultiSeasonProgression={refresh(){multiCalls+=1;if(multiCalls===1)return new Promise(resolve=>{releaseFirst=()=>resolve(multi);});return Promise.resolve(multi);},getState(){return multi;}};
  const staleA=api.refresh();await flush();assert.equal(typeof releaseFirst,"function","The first manager refresh must be held in flight for the race proof.");
  const rivalryB=`pair_${"f".repeat(64)}`;
  race.context.currentShowdown={id:slots[1].saveId,managers:{playerOne:"Other 1",playerTwo:"Other 2"},sharedJourney:{mode:"shared",rivalryId:rivalryB}};
  const freshB=api.refresh();assert.notStrictEqual(freshB,staleA,"A new save+rivalry context must not be deduplicated behind the old manager refresh.");
  assert.equal(await freshB,null,"Snapshots from the old rivalry/save must not publish into the new active Showdown.");
  releaseFirst();assert.equal(await staleA,null,"A refresh whose active save+rivalry changed while awaiting dependencies must be discarded.");assert.equal(api.getState(),null,"Discarded stale refreshes must not leave an exposed Final Reconciliation view.");
  race.context.currentShowdown=showdownA;
  const recovered=await api.refresh();assert.equal(recovered.phase,"FINAL_SEASON_RECONCILED","Returning to the exact original save+rivalry must recover on a fresh refresh.");assert.equal(recovered.winner,"playerOne");
  assert.deepEqual(race.writes,[]);

  process.stdout.write("PASS r17 Final Reconciliation two-context audit: exact manager binding, stale cross-rivalry refresh suppression, correct winner, no extra season and zero direct storage writes\n");
})().catch(error=>{console.error(error);process.exit(1);});
