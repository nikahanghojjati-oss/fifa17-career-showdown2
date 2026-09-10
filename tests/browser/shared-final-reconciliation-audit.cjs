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
function buildAuthority(rid,managerSlots=slots){
  const projection=historyModule.buildProjection({rivalryId:rid,setup,managerSlots,seasons:[{commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,scoring:{playerOne:a,playerTwo:b},winner:"playerOne"}}]});
  return {projection,multi:{ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId:rid,state:{phase:"SHOWDOWN_COMPLETE",rivalryId:rid,terminal:true,totalSeasons:1,acceptedSeasons:1,completedSeason:1,activeSeason:null,acceptedRevisionKey:projection.acceptedRevisionKey,leagueId:setup.leagueId,fixedClubs:setup.clubs}},history:{ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:rid,projection}};
}
const authority=buildAuthority(rivalryId);
function localFor(role,managerSlots=slots){const slot=managerSlots[role==="playerOne"?0:1];return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function showdownFor(role,rid=rivalryId,managerSlots=slots,names={playerOne:"Daniel",playerTwo:"Nik"}){const slot=managerSlots[role==="playerOne"?0:1];return {id:Date.now(),identity:{saveId:slot.saveId,managerProfileIds:{playerOne:managerSlots[0].profileId,playerTwo:managerSlots[1].profileId}},managers:names,sharedJourney:{mode:"shared",rivalryId:rid}};}
function makeContext(role){const writes=[];const listeners=new Map();const local=localFor(role);const context={console,currentShowdown:showdownFor(role),navigator:{onLine:true},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){},addEventListener(type,fn){listeners.set(type,fn);},setInterval(){return 1;},setTimeout(){return 1;},localStorage:{setItem(...args){writes.push(args);}},sessionStorage:{setItem(...args){writes.push(args);}},CareerModeSharedHistoryConvergence:historyModule,CareerModeProductionSharedMultiSeasonProgression:{async refresh(){return authority.multi;},getState(){return authority.multi;}},CareerModeProductionSharedHistoryConvergence:{async refresh(){return authority.history;},getState(){return authority.history;}},CareerModeProductionSharedLocalReconciliation:{refresh(){return local;},getState(){return local;}}};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("js/sharedFinalReconciliation.js","utf8"),context,{filename:"sharedFinalReconciliation.js"});vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context,{filename:"productionSharedFinalReconciliation.js"});return {context,writes,local,listeners};}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const leftContext=makeContext("playerOne"),rightContext=makeContext("playerTwo");
  leftContext.context.CareerModeProductionSharedFinalReconciliation.install();rightContext.context.CareerModeProductionSharedFinalReconciliation.install();
  assert.equal(typeof leftContext.listeners.get("career-mode-active-save-changed"),"function","Final Reconciliation must subscribe to the synchronous Save Library active-context event.");
  const left=await leftContext.context.CareerModeProductionSharedFinalReconciliation.refresh(),right=await rightContext.context.CareerModeProductionSharedFinalReconciliation.refresh();
  assert.deepEqual(JSON.parse(JSON.stringify(left)),JSON.parse(JSON.stringify(right)),"Both independent manager contexts must converge on one identical completed Showdown projection.");assert.equal(left.phase,"FINAL_SEASON_RECONCILED");assert.equal(left.winner,"playerOne");assert.equal(left.acceptedSeasons,1);assert.equal(left.nextSeason,null);assert.equal(left.extraSeasonAllowed,false);assert.equal(left.terminalCloseRequired,true);assert.deepEqual(leftContext.writes,[]);assert.deepEqual(rightContext.writes,[]);
  assert.match(String(leftContext.context.currentShowdown.id),/^\d+$/,"The test keeps the legacy Showdown id non-canonical so Final Reconciliation must read identity.saveId.");assert.equal(leftContext.context.currentShowdown.identity.saveId,slots[0].saveId);

  const race=makeContext("playerOne"),api=race.context.CareerModeProductionSharedFinalReconciliation,showdownA=race.context.currentShowdown;api.install();
  const initiallyPublished=await api.refresh();assert.equal(initiallyPublished.phase,"FINAL_SEASON_RECONCILED");assert.equal(api.getState().winner,"playerOne","A must be visibly published before the stale-view switch proof begins.");
  let releaseFirst=null,multiCalls=0;
  race.context.CareerModeProductionSharedMultiSeasonProgression={refresh(){multiCalls+=1;if(multiCalls===1)return new Promise(resolve=>{releaseFirst=()=>resolve(authority.multi);});return Promise.resolve(authority.multi);},getState(){return authority.multi;}};
  const staleA=api.refresh();await flush();assert.equal(typeof releaseFirst,"function","The old A refresh must be held in flight.");
  const rivalryB=`pair_${"f".repeat(64)}`;
  race.context.currentShowdown={id:987654321,identity:{saveId:slots[1].saveId},managers:{playerOne:"Other 1",playerTwo:"Other 2"},sharedJourney:{mode:"shared",rivalryId:rivalryB}};
  assert.equal(api.getState(),null,"A published view must become inaccessible immediately when the canonical save+rivalry context changes.");
  const freshB=api.refresh();assert.notStrictEqual(freshB,staleA,"A new canonical save+rivalry context must not be deduplicated behind the old manager refresh.");
  assert.equal(api.getState(),null,"Starting B refresh must synchronously clear the stale A view before any B dependency settles.");
  assert.equal(await freshB,null,"Old-A authority snapshots must not publish into B.");assert.equal(api.getState(),null,"B must remain empty when its dependencies are not exact for B.");
  releaseFirst();assert.equal(await staleA,null,"A refresh whose canonical save+rivalry changed while awaiting dependencies must be discarded.");assert.equal(api.getState(),null,"Late A completion must not resurrect the old view into B.");
  race.context.currentShowdown=showdownA;
  const recovered=await api.refresh();assert.equal(recovered.phase,"FINAL_SEASON_RECONCILED","Returning to exact A canonical identity must recover on a fresh refresh.");assert.equal(recovered.winner,"playerOne");
  race.local.phase="OFFLINE_FALLBACK";assert.equal(api.getState(),null,"Latest Local Reconciliation authority loss must immediately hide an already-published final result without waiting for network refresh.");
  race.local.phase="REMOTE_OBSERVED";const authorityRecovered=await api.refresh();assert.equal(authorityRecovered.phase,"FINAL_SEASON_RECONCILED");
  race.local.phase="BLOCKED";race.listeners.get("career-mode-shared-local-reconciliation-state-change")?.({type:"career-mode-shared-local-reconciliation-state-change",detail:race.local});race.local.phase="REMOTE_OBSERVED";assert.equal(api.getState(),null,"A blocked Local Reconciliation event must synchronously discard the stored final view before any asynchronous dependency refresh can stall.");
  const eventRecovered=await api.refresh();assert.equal(eventRecovered.phase,"FINAL_SEASON_RECONCILED","Fresh safe local authority may republish only after exact reconciliation runs again.");
  const originalIdentity={...race.context.currentShowdown.identity,managerProfileIds:{...race.context.currentShowdown.identity.managerProfileIds}};
  const reboundProfile=`profile_${"9".repeat(24)}`;
  race.context.currentShowdown.identity={...originalIdentity,managerProfileIds:{...originalIdentity.managerProfileIds,playerOne:reboundProfile}};
  assert.equal(api.getState(),null,"Changing only the active manager profile must immediately make the old published view inaccessible with unchanged save+rivalry IDs.");
  race.listeners.get("career-mode-active-save-changed")?.();await flush();
  assert.equal(api.getState(),null,"The synchronous active-save notification must keep a profile-rebound view invalidated.");
  assert.equal(await api.refresh(),null,"A Local Reconciliation binding for the previous profile must not reconcile after active profile rebinding.");
  race.context.currentShowdown.identity=originalIdentity;
  const reboundRecovered=await api.refresh();assert.equal(reboundRecovered.phase,"FINAL_SEASON_RECONCILED","Restoring the exact active manager profile must permit a fresh exact reconciliation.");assert.deepEqual(race.writes,[]);

  process.stdout.write("PASS r17 Final Reconciliation two-context audit: canonical Save Library identity, exact manager binding, synchronous local-authority invalidation, published-view invalidation, stale cross-rivalry refresh suppression, correct winner, no extra season and zero direct storage writes\n");
})().catch(error=>{console.error(error);process.exit(1);});
