import json
from pathlib import Path

files = {
"js/sharedFinalReconciliation.js": r'''(function(root,factory){
  const api=factory(typeof require==="function"?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedFinalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(historyModule){
  "use strict";
  const RUNTIME_REVISION="1.9.1-r17";
  const FINAL_PHASE="FINAL_SEASON_RECONCILED";
  const RIVALRY=/^pair_[0-9a-f]{64}$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const SAFE_LOCAL_PHASES=new Set(["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"]);
  const FINAL_KEYS=Object.freeze(["schemaVersion","runtimeRevision","phase","rivalryId","leagueId","totalSeasons","acceptedSeasons","completedSeason","acceptedRevisionKey","fixedClubs","managerTotals","winner","terminal","finalSeasonReconciled","nextSeason","extraSeasonAllowed","terminalCloseRequired","canonicalStorageMutation","providerWriteRequired","listPermissionRequired","billingRequired"]);
  function frFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function frPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function frClone(value){return JSON.parse(JSON.stringify(value));}
  function frFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(frFreeze);Object.freeze(value);}return value;}
  function frRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY.test(id))frFail("FINAL_RECONCILIATION_RIVALRY_INVALID");return id;}
  function frBase(phase,extra={}){return frFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,...extra});}
  function frBlocked(reason){return frBase("BLOCKED",{reason:String(reason||"authority-incomplete"),terminal:false,finalSeasonReconciled:false,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:false});}
  function frManagerTotal(record,role){if(!frPlain(record)||record.role!==role||!Number.isInteger(record.seasons)||record.seasons<1||!Number.isInteger(record.totalPoints)||record.totalPoints<0)frFail("FINAL_RECONCILIATION_MANAGER_RECORD_INVALID");return record.totalPoints;}
  function frVerifyHistory(history,rivalryId,totalSeasons){
    if(!history||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||String(history.rivalryId||"")!==rivalryId||!history.projection)frFail("FINAL_RECONCILIATION_HISTORY_INVALID");
    let projection;
    try{projection=historyModule.verifyProjection(history.projection);}catch(_error){frFail("FINAL_RECONCILIATION_HISTORY_INVALID");}
    if(projection.rivalryId!==rivalryId||projection.acceptedSeasons!==totalSeasons||projection.totalSeasons!==totalSeasons||projection.seasonHistory.length!==totalSeasons)frFail("FINAL_RECONCILIATION_HISTORY_INCOMPLETE");
    return projection;
  }
  function frReconcile({sharedActive=false,multiSeason=null,history=null,localReconciliation=null}={}){
    if(!sharedActive)return frBase("INACTIVE",{reason:"local-journey",terminal:false,finalSeasonReconciled:false,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:false});
    if(!multiSeason||multiSeason.ok!==true||multiSeason.authoritative!==true||multiSeason.phase!=="SHOWDOWN_COMPLETE"||!frPlain(multiSeason.state))return frBlocked("multi-season-not-terminal");
    const rivalryId=frRivalry(multiSeason.rivalryId),state=multiSeason.state,totalSeasons=Number(state.totalSeasons);
    if(state.rivalryId!==rivalryId||state.phase!=="SHOWDOWN_COMPLETE"||state.terminal!==true||![1,3,5,10].includes(totalSeasons)||state.acceptedSeasons!==totalSeasons||state.completedSeason!==totalSeasons||state.activeSeason!==null||typeof state.acceptedRevisionKey!=="string"||!state.acceptedRevisionKey)frFail("FINAL_RECONCILIATION_MULTI_SEASON_INVALID");
    if(!localReconciliation||!SAFE_LOCAL_PHASES.has(localReconciliation.phase))return frBlocked("local-reconciliation-not-ready");
    const projection=frVerifyHistory(history,rivalryId,totalSeasons);
    if(projection.acceptedRevisionKey!==state.acceptedRevisionKey||projection.leagueId!==state.leagueId||projection.managerRecords?.playerOne?.club!==state.fixedClubs?.playerOne||projection.managerRecords?.playerTwo?.club!==state.fixedClubs?.playerTwo)frFail("FINAL_RECONCILIATION_AUTHORITY_MISMATCH");
    const playerOne=frManagerTotal(projection.managerRecords.playerOne,"playerOne"),playerTwo=frManagerTotal(projection.managerRecords.playerTwo,"playerTwo");
    const winner=playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw";
    return frFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:FINAL_PHASE,rivalryId,leagueId:projection.leagueId,totalSeasons,acceptedSeasons:totalSeasons,completedSeason:totalSeasons,acceptedRevisionKey:projection.acceptedRevisionKey,fixedClubs:frClone(state.fixedClubs),managerTotals:{playerOne,playerTwo},winner,terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
  }
  function frVerifyFinal(value){
    if(!frPlain(value)||Object.keys(value).length!==FINAL_KEYS.length||FINAL_KEYS.some(key=>!Object.hasOwn(value,key)))frFail("FINAL_RECONCILIATION_PROJECTION_INVALID");
    frRivalry(value.rivalryId);
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!==FINAL_PHASE||![1,3,5,10].includes(value.totalSeasons)||value.acceptedSeasons!==value.totalSeasons||value.completedSeason!==value.totalSeasons||typeof value.acceptedRevisionKey!=="string"||!value.acceptedRevisionKey||!frPlain(value.fixedClubs)||typeof value.fixedClubs.playerOne!=="string"||!value.fixedClubs.playerOne||typeof value.fixedClubs.playerTwo!=="string"||!value.fixedClubs.playerTwo||value.fixedClubs.playerOne===value.fixedClubs.playerTwo||!frPlain(value.managerTotals)||!Number.isInteger(value.managerTotals.playerOne)||value.managerTotals.playerOne<0||!Number.isInteger(value.managerTotals.playerTwo)||value.managerTotals.playerTwo<0||!ROLES.includes(value.winner)&&value.winner!=="draw"||value.terminal!==true||value.finalSeasonReconciled!==true||value.nextSeason!==null||value.extraSeasonAllowed!==false||value.terminalCloseRequired!==true||value.canonicalStorageMutation!==false||value.providerWriteRequired!==false||value.listPermissionRequired!==false||value.billingRequired!==false)frFail("FINAL_RECONCILIATION_PROJECTION_INVALID");
    const expected=value.managerTotals.playerOne>value.managerTotals.playerTwo?"playerOne":value.managerTotals.playerTwo>value.managerTotals.playerOne?"playerTwo":"draw";
    if(value.winner!==expected)frFail("FINAL_RECONCILIATION_WINNER_MISMATCH");
    return frFreeze(frClone(value));
  }
  if(!historyModule||typeof historyModule.verifyProjection!=="function")frFail("FINAL_RECONCILIATION_HISTORY_PROTOCOL_UNAVAILABLE");
  return Object.freeze({contractVersion:1,feature:"ssjr-shared-final-reconciliation",runtimeRevision:RUNTIME_REVISION,phase:FINAL_PHASE,reconcile:frReconcile,verifyProjection:frVerifyFinal,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
''',
"js/productionSharedFinalReconciliation.js": r'''(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedFinalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  const PANEL_ID="sharedFinalReconciliationPanel";
  let installed=false,busy=false,protocol=null,multiApi=null,historyApi=null,localApi=null,view=null,refreshPromise=null;
  function pfrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pfrShared(){const s=pfrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function pfrField(id){return root.document&&root.document.getElementById(id);}
  function pfrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pfrText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pfrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pfrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pfrEnsureDependencies(){
    await pfrLoad("ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js",()=>root.CareerModeSharedFinalReconciliation);
    await pfrLoad("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
    await pfrLoad("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
    await pfrLoad("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js",()=>root.CareerModeProductionSharedLocalReconciliation);
    protocol=root.CareerModeSharedFinalReconciliation;multiApi=root.CareerModeProductionSharedMultiSeasonProgression;historyApi=root.CareerModeProductionSharedHistoryConvergence;localApi=root.CareerModeProductionSharedLocalReconciliation;
    if(!protocol||typeof protocol.reconcile!=="function"||!multiApi||typeof multiApi.refresh!=="function"||typeof multiApi.getState!=="function"||!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function"||!localApi||typeof localApi.refresh!=="function"||typeof localApi.getState!=="function")throw Object.assign(new Error("Final Reconciliation dependencies are unavailable."),{code:"FINAL_RECONCILIATION_DEPENDENCY_UNAVAILABLE"});
  }
  function pfrManagerName(role){return String(pfrShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pfrEnsureUi(){
    if(!root.document)return null;const review=pfrField("seasonReviewPanel");if(!review)return null;
    let panel=pfrField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedFinalReconciliationPanel hidden";review.appendChild(panel);}
    let heading=pfrField("sharedFinalReconciliationHeading");if(!heading){heading=root.document.createElement("h3");heading.id="sharedFinalReconciliationHeading";panel.appendChild(heading);}
    let summary=pfrField("sharedFinalReconciliationSummary");if(!summary){summary=root.document.createElement("p");summary.id="sharedFinalReconciliationSummary";panel.appendChild(summary);}
    let winner=pfrField("sharedFinalReconciliationWinner");if(!winner){winner=root.document.createElement("p");winner.id="sharedFinalReconciliationWinner";panel.appendChild(winner);}
    let close=pfrField("sharedFinalReconciliationClose");if(!close){close=root.document.createElement("p");close.id="sharedFinalReconciliationClose";panel.appendChild(close);}
    return {panel,heading,summary,winner,close};
  }
  function pfrRender(){
    const ui=pfrEnsureUi();if(!ui)return false;const active=Boolean(view&&view.phase==="FINAL_SEASON_RECONCILED"&&view.finalSeasonReconciled===true);
    pfrHidden(ui.panel,!active);if(!active)return false;
    pfrText(ui.heading,"SHOWDOWN FINAL RECONCILED");
    pfrText(ui.summary,`${view.acceptedSeasons} OF ${view.totalSeasons} SEASONS ACCEPTED · NO ADDITIONAL SEASON`);
    const winner=view.winner==="draw"?"DRAW":`${pfrManagerName(view.winner)} WINS`;
    pfrText(ui.winner,`${pfrManagerName("playerOne")} ${view.managerTotals.playerOne} · ${pfrManagerName("playerTwo")} ${view.managerTotals.playerTwo} · ${winner}`);
    pfrText(ui.close,"FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP");
    return true;
  }
  async function pfrRefreshNow(){
    if(!pfrShared()){view=null;pfrRender();return null;}
    await pfrEnsureDependencies();
    await multiApi.refresh();await historyApi.refresh();localApi.refresh();
    const next=protocol.reconcile({sharedActive:true,multiSeason:multiApi.getState(),history:historyApi.getState(),localReconciliation:localApi.getState()});
    view=next;pfrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-final-reconciliation-state-change",{detail:view}));}catch(_error){}
    return view;
  }
  function pfrRefresh(){if(refreshPromise)return refreshPromise;busy=true;const current=pfrRefreshNow().catch(error=>{view=null;pfrRender();pfrReport("Unable to reconcile final Shared Showdown",error);return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;});refreshPromise=current;return current;}
  function pfrWake(){if(busy||root.document?.visibilityState==="hidden")return;void pfrRefresh();}
  function pfrInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-multi-season-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-connected-account-state-change"]){root.addEventListener?.(event,pfrWake);}root.document?.addEventListener?.("visibilitychange",pfrWake);if(typeof root.setInterval==="function")root.setInterval(pfrWake,POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pfrWake,0);return true;}
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-final-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r17",pollIntervalMs:POLL_MS,install:pfrInstall,refresh:pfrRefresh,getState:()=>view,isActive:pfrShared,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
''',
"tests/contracts/shared-final-reconciliation-contracts.cjs": r'''const assert=require("node:assert/strict");
const historyModule=require("../../js/sharedHistoryConvergence.js");
const finalModule=require("../../js/sharedFinalReconciliation.js");
const rivalryId=`pair_${"a".repeat(64)}`;
const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:3,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"}};
const managerSlots=[{slotId:"playerOne",accountId:"acct-a",profileId:`profile_${"b".repeat(24)}`,saveId:`save_${"c".repeat(24)}`,entitlementState:"active"},{slotId:"playerTwo",accountId:"acct-b",profileId:`profile_${"d".repeat(24)}`,saveId:`save_${"e".repeat(24)}`,entitlementState:"active"}];
const baseResult={leaguePosition:4,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
function score(r){const championsLeague=r.championsLeague?5:0,leagueTitle=r.leaguePosition===1?3:0,domesticCup=r.domesticCup?1:0,performanceBonus=r.leaguePoints>=100||r.leagueGoals>=100?1:0,individualAwardsBonus=r.topScorer||r.topAssist?1:0;return {championsLeague,leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};}
function season(n,p1,p2){const a=score(p1),b=score(p2);const winner=a.total>b.total?"playerOne":b.total>a.total?"playerTwo":a.total===0&&b.total===0?(p1.leaguePosition<p2.leaguePosition?"playerOne":p2.leaguePosition<p1.leaguePosition?"playerTwo":p1.leaguePoints>p2.leaguePoints?"playerOne":p2.leaguePoints>p1.leaguePoints?"playerTwo":"draw"):"draw";const hash=`sha256:${String(n).repeat(64)}`;return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:n,scoring:{playerOne:a,playerTwo:b},winner}};}
const seasons=[season(1,{...baseResult,championsLeague:true},{...baseResult,leaguePosition:1}),season(2,{...baseResult,domesticCup:true},{...baseResult,topScorer:true}),season(3,{...baseResult,leaguePoints:101},{...baseResult,leaguePosition:1})];
const projection=historyModule.buildProjection({rivalryId,setup,managerSlots,seasons});
const history={ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection};
const multi={ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId,state:{phase:"SHOWDOWN_COMPLETE",rivalryId,terminal:true,totalSeasons:3,acceptedSeasons:3,completedSeason:3,activeSeason:null,acceptedRevisionKey:projection.acceptedRevisionKey,leagueId:setup.leagueId,fixedClubs:setup.clubs}};
const local={phase:"REMOTE_OBSERVED",binding:{saveId:managerSlots[0].saveId,profileId:managerSlots[0].profileId,managerRole:"playerOne"}};
const final=finalModule.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:local});
assert.equal(final.phase,"FINAL_SEASON_RECONCILED");assert.equal(final.winner,"playerOne");assert.deepEqual(final.managerTotals,{playerOne:7,playerTwo:6});assert.equal(final.acceptedSeasons,3);assert.equal(final.completedSeason,3);assert.equal(final.nextSeason,null);assert.equal(final.extraSeasonAllowed,false);assert.equal(final.terminalCloseRequired,true);assert.equal(final.canonicalStorageMutation,false);assert.equal(final.providerWriteRequired,false);assert.equal(final.listPermissionRequired,false);assert.equal(final.billingRequired,false);assert.deepEqual(finalModule.verifyProjection(final),final);
assert.equal(finalModule.reconcile({sharedActive:true,multiSeason:{...multi,phase:"SEASON_READY"},history,localReconciliation:local}).phase,"BLOCKED");
assert.equal(finalModule.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:{phase:"OFFLINE_FALLBACK"}}).phase,"BLOCKED");
assert.throws(()=>finalModule.reconcile({sharedActive:true,multiSeason:{...multi,state:{...multi.state,acceptedRevisionKey:`1:2:sha256:${"f".repeat(64)}`}},history,localReconciliation:local}),/FINAL_RECONCILIATION_AUTHORITY_MISMATCH/);
const tieSetup={...setup,totalSeasons:1};const tieProjection=historyModule.buildProjection({rivalryId,setup:tieSetup,managerSlots,seasons:[season(1,{...baseResult,leaguePosition:2},{...baseResult,leaguePosition:3})]});
const tie=finalModule.reconcile({sharedActive:true,multiSeason:{...multi,state:{...multi.state,totalSeasons:1,acceptedSeasons:1,completedSeason:1,acceptedRevisionKey:tieProjection.acceptedRevisionKey},phase:"SHOWDOWN_COMPLETE"},history:{ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection:tieProjection},localReconciliation:local});
assert.equal(tie.managerTotals.playerOne,0);assert.equal(tie.managerTotals.playerTwo,0);assert.equal(tie.winner,"draw","Final overall authority reuses accumulated Showdown points; it must not invent a new cross-season tiebreaker.");
process.stdout.write("PASS r17 Final Reconciliation deterministic complete-showdown projection, winner authority and no-extra-season boundary\n");
''',
"tests/contracts/shared-final-reconciliation-production-contracts.cjs": r'''const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const protocol=read("js/sharedFinalReconciliation.js"),production=read("js/productionSharedFinalReconciliation.js"),ssjr=read("js/ssjr.js"),shell=read("service-worker.js"),pkg=JSON.parse(read("package.json"));
assert.match(protocol,/FINAL_SEASON_RECONCILED/);assert.match(protocol,/usesAccumulatedCanonicalPoints:true/);assert.match(protocol,/createsAdditionalSeason:false/);assert.match(protocol,/terminalCloseSeparate:true/);assert.match(protocol,/canonicalStorageMutation:false/);assert.match(protocol,/providerWriteRequired:false/);assert.match(protocol,/listPermissionRequired:false/);
assert.match(production,/CareerModeProductionSharedMultiSeasonProgression/);assert.match(production,/CareerModeProductionSharedHistoryConvergence/);assert.match(production,/CareerModeProductionSharedLocalReconciliation/);assert.match(production,/NO ADDITIONAL SEASON/);assert.match(production,/TERMINAL CLOSE REMAINS A SEPARATE STEP/);assert.doesNotMatch(production,/localStorage\.setItem|sessionStorage\.setItem|runTransaction\(|setDoc\(|updateDoc\(|addDoc\(/);
for(const asset of ["js/sharedFinalReconciliation.js","js/productionSharedFinalReconciliation.js"])assert.ok(shell.includes(`\"${asset}\"`),`${asset} must be service-worker shell-owned before r17 publication`);
assert.match(ssjr,/ssjr-final-reconciliation-protocol/);assert.match(ssjr,/ssjr-production-final-reconciliation/);assert.ok(pkg.scripts["test:ssjr:final-reconciliation"]);assert.match(pkg.scripts["test:ssjr"],/shared-final-reconciliation-contracts/);assert.match(pkg.scripts["test:ssjr:browser"],/shared-final-reconciliation-audit/);
process.stdout.write("PASS r17 production Final Reconciliation is read-only, shell-owned, composed from prior authorities and keeps Terminal Close separate\n");
''',
"tests/browser/shared-final-reconciliation-audit.cjs": r'''const assert=require("node:assert/strict");
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
function makeContext(role){const writes=[];const listeners=new Map();const local={phase:"REMOTE_OBSERVED",binding:{saveId:slots[role==="playerOne"?0:1].saveId,profileId:slots[role==="playerOne"?0:1].profileId,managerRole:role}};const context={console,currentShowdown:{managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId}},navigator:{onLine:true},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){},addEventListener(type,fn){listeners.set(type,fn);},setInterval(){return 1;},setTimeout(){return 1;},localStorage:{setItem(...args){writes.push(args);}},sessionStorage:{setItem(...args){writes.push(args);}},CareerModeSharedHistoryConvergence:historyModule,CareerModeProductionSharedMultiSeasonProgression:{async refresh(){return multi;},getState(){return multi;}},CareerModeProductionSharedHistoryConvergence:{async refresh(){return history;},getState(){return history;}},CareerModeProductionSharedLocalReconciliation:{refresh(){return local;},getState(){return local;}}};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("js/sharedFinalReconciliation.js","utf8"),context,{filename:"sharedFinalReconciliation.js"});vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context,{filename:"productionSharedFinalReconciliation.js"});return {context,writes};}
(async()=>{const a=makeContext("playerOne"),b=makeContext("playerTwo");a.context.CareerModeProductionSharedFinalReconciliation.install();b.context.CareerModeProductionSharedFinalReconciliation.install();const left=await a.context.CareerModeProductionSharedFinalReconciliation.refresh(),right=await b.context.CareerModeProductionSharedFinalReconciliation.refresh();assert.deepEqual(JSON.parse(JSON.stringify(left)),JSON.parse(JSON.stringify(right)),"Both independent manager contexts must converge on one identical completed Showdown projection.");assert.equal(left.phase,"FINAL_SEASON_RECONCILED");assert.equal(left.winner,"playerOne");assert.equal(left.acceptedSeasons,1);assert.equal(left.nextSeason,null);assert.equal(left.extraSeasonAllowed,false);assert.equal(left.terminalCloseRequired,true);assert.deepEqual(a.writes,[]);assert.deepEqual(b.writes,[]);process.stdout.write("PASS r17 Final Reconciliation two-context audit: identical completed Showdown, correct winner, no extra season and zero direct storage writes\n");})().catch(error=>{console.error(error);process.exit(1);});
'''
}
for path, content in files.items():
    p=Path(path)
    if p.exists(): raise SystemExit(f"refusing to overwrite existing r17 file: {path}")
    p.write_text(content)

# Wire r17 after Local Reconciliation in the runtime bootstrap.
p=Path("js/ssjr.js"); s=p.read_text()
anchor='''    const localReconciliation=(async()=>{\n      await journeyConflicts;\n      await historyConvergence;\n      await prepare([\n        ["ssjr-local-reconciliation-protocol","js/sharedLocalReconciliation.js","CareerModeSharedLocalReconciliation"]\n      ]);\n      return install("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js","CareerModeProductionSharedLocalReconciliation");\n    })();\n'''
if anchor not in s: raise SystemExit("missing ssjr local reconciliation anchor")
addition=anchor+'''    const finalReconciliation=(async()=>{\n      await localReconciliation;\n      await multiSeason;\n      await historyConvergence;\n      await prepare([\n        ["ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"]\n      ]);\n      return install("ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js","CareerModeProductionSharedFinalReconciliation");\n    })();\n'''
s=s.replace(anchor,addition,1)
needle='''      localReconciliation,\n      (async()=>{await seasonResultsRoute;'''
if needle not in s: raise SystemExit("missing ssjr promise list anchor")
s=s.replace(needle,'''      localReconciliation,\n      finalReconciliation,\n      (async()=>{await seasonResultsRoute;''',1)
p.write_text(s)

# Own the new runtime files in the existing r16 shell before any publication bump.
p=Path("service-worker.js"); s=p.read_text()
anchor='''    "js/sharedLocalReconciliation.js",\n    "js/productionSharedLocalReconciliation.js",\n'''
if anchor not in s: raise SystemExit("missing service-worker r16 anchor")
s=s.replace(anchor,anchor+'''    "js/sharedFinalReconciliation.js",\n    "js/productionSharedFinalReconciliation.js",\n''',1)
p.write_text(s)

# Register closed POS20 product contracts.
p=Path("POS20_SUPPLEMENTAL_PRODUCT_TESTS.json"); registry=json.loads(p.read_text())
paths=[x["path"] for x in registry["tests"]]
for target in ["tests/contracts/shared-final-reconciliation-contracts.cjs","tests/contracts/shared-final-reconciliation-production-contracts.cjs"]:
    if target in paths: raise SystemExit(f"r17 contract already registered: {target}")
registry["tests"].append({"path":"tests/contracts/shared-final-reconciliation-contracts.cjs","patterns":["^js/sharedFinalReconciliation\\.js$","^js/sharedHistoryConvergence\\.js$","^js/sharedMultiSeasonProgression\\.js$","^tests/contracts/shared-final-reconciliation-contracts\\.cjs$","^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"]})
registry["tests"].append({"path":"tests/contracts/shared-final-reconciliation-production-contracts.cjs","patterns":["^js/sharedFinalReconciliation\\.js$","^js/productionSharedFinalReconciliation\\.js$","^js/productionSharedMultiSeasonProgression\\.js$","^js/productionSharedHistoryConvergence\\.js$","^js/productionSharedLocalReconciliation\\.js$","^js/ssjr\\.js$","^service-worker\\.js$","^tests/contracts/shared-final-reconciliation-contracts\\.cjs$","^tests/contracts/shared-final-reconciliation-production-contracts\\.cjs$","^tests/browser/shared-final-reconciliation-audit\\.cjs$","^package\\.json$","^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"]})
p.write_text(json.dumps(registry,indent=2)+"\n")

# Extend the closed POS20 operations census.
p=Path("tests/operations/pos20-control-plane.test.mjs"); s=p.read_text()
anchor="const localReconciliationProductionContract='tests/contracts/shared-local-reconciliation-production-contracts.cjs';\n"
if anchor not in s: raise SystemExit("missing POS20 r16 declaration anchor")
s=s.replace(anchor,anchor+"const finalReconciliationContract='tests/contracts/shared-final-reconciliation-contracts.cjs';\nconst finalReconciliationProductionContract='tests/contracts/shared-final-reconciliation-production-contracts.cjs';\n",1)
old='localReconciliationContract,localReconciliationProductionContract];'
if old not in s: raise SystemExit("missing POS20 r16 expected list tail")
s=s.replace(old,'localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract];',1)
p.write_text(s)

# Update aggregate and focused package scripts without changing product dependencies.
p=Path("package.json"); pkg=json.loads(p.read_text()); scripts=pkg["scripts"]
def append(script, command):
    if command not in scripts[script]: scripts[script] += " && " + command
append("test:browser","node tests/browser/shared-final-reconciliation-audit.cjs")
append("test:ssjr","node tests/contracts/shared-final-reconciliation-contracts.cjs")
append("test:ssjr","node tests/contracts/shared-final-reconciliation-production-contracts.cjs")
append("test:ssjr:browser","node tests/browser/shared-final-reconciliation-audit.cjs")
scripts["test:ssjr:final-reconciliation"]="node tests/contracts/shared-final-reconciliation-contracts.cjs && node tests/contracts/shared-final-reconciliation-production-contracts.cjs && node tests/browser/shared-final-reconciliation-audit.cjs"
p.write_text(json.dumps(pkg,indent=2)+"\n")
