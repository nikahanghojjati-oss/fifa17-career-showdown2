const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const protocol=read("js/sharedLocalReconciliation.js");
const production=read("js/productionSharedLocalReconciliation.js");
const connected=read("js/sparkConnectedRivalry.js");
const restore=read("js/restore.js");
const shell=read("service-worker.js");
const ssjr=read("js/ssjr.js");
assert.match(protocol,/automaticLocalApply:false/);assert.match(protocol,/candidateCOnly:true/);assert.match(protocol,/OFFLINE_FALLBACK/);
assert.match(production,/previewLocalReconciliation/);assert.match(production,/applyLocalReconciliation/);assert.match(production,/confirmed!==true/);assert.match(production,/LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED/);assert.match(production,/canonicalStorageMutation:false/);assert.match(production,/sharedLocalReconciliationPanel/);assert.match(production,/PREVIEW LOCAL RECONCILIATION/);assert.match(production,/seasonReviewPanel/);assert.match(production,/Candidate C Apply is intentionally not exposed/);assert.doesNotMatch(production,/BACK UP \+ APPLY EXACT REVISION/);assert.doesNotMatch(production,/localStorage\.setItem|sessionStorage\.setItem|runTransaction\(|setDoc\(|updateDoc\(/);
assert.match(connected,/previewLocalReconciliation:crHandleReconciliationPreview/);assert.match(connected,/applyLocalReconciliation:crHandleReconciliationApply/);assert.match(connected,/prepareCareerModeRemoteReconciliationIntent/);assert.match(connected,/applyCareerModeRemoteReconciliation/);
for(const token of ["createCareerModeBackupEnvelope","verifyCareerModeBackupEnvelopeChecksum","downloadCareerModeBackupEnvelope","applyCareerModeRawStorageTransaction","remote-stale","stale-state"])assert.match(restore,new RegExp(token));
for(const asset of ["js/sharedLocalReconciliation.js","js/productionSharedLocalReconciliation.js"])assert.ok(shell.includes(`\"${asset}\"`),`${asset} must be service-worker shell-owned`);
assert.match(ssjr,/ssjr-local-reconciliation-protocol/);assert.match(ssjr,/ssjr-production-local-reconciliation/);
process.stdout.write("PASS r45 production Local Reconciliation exposes one contextual read-only preview action while delegating to existing Candidate B/C authority with shell/reload safety and no new provider/storage writer\n");
(async()=>{
  // r52: a Preview tap observes the Connected Rivalry snapshot (and publishes it once, only after a terminal Showdown) through the existing authority.
  assert.match(connected,/refreshAttachedSharedState:crHandleRefresh/);assert.match(connected,/publishAttachedSharedState:crHandlePublish/);
  const hex=n=>"a".repeat(n),rivalryId=`pair_${hex(64)}`,binding={saveId:`save_${hex(24)}`,profileId:`profile_${hex(24)}`,managerRole:"playerOne"};
  const envelope={revision:0,contentHash:`sha256:${"b".repeat(64)}`,lifecycleState:"live"};
  const load=({remoteExists,terminal,refreshOk=true})=>{
    delete require.cache[require.resolve("../../js/productionSharedLocalReconciliation.js")];
    const calls=[];let cr={connected:true,attached:true,rivalryId,binding,status:"saved-link",observedExists:false,observedEnvelope:null,observedTombstone:false};let published=remoteExists;
    globalThis.currentShowdown={id:"s",saveId:binding.saveId,sharedJourney:{mode:"shared",rivalryId}};
    globalThis.CareerModeSharedLocalReconciliation=require("../../js/sharedLocalReconciliation.js");
    globalThis.CareerModeProductionSharedHistoryConvergence={getState:()=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId})};
    globalThis.CareerModeProductionSharedMultiSeasonProgression={getState:()=>({ok:true,authoritative:true,phase:terminal?"SHOWDOWN_COMPLETE":"SEASON_ACTIVE",state:{terminal}})};
    globalThis.CareerModeSparkConnectedRivalry={
      getState:()=>cr,initialize:async()=>{},applyLocalReconciliation:async()=>{},
      previewLocalReconciliation:async b=>{calls.push("preview");cr={...cr,reconciliationPreviewReady:true,previewRevision:0,previewContentHash:envelope.contentHash,previewSaveId:b.saveId};},
      refreshAttachedSharedState:async()=>{calls.push("refresh");cr=refreshOk?{...cr,status:"refreshed",observedExists:published,observedEnvelope:published?envelope:null}:{...cr,status:"refresh-error"};},
      publishAttachedSharedState:async()=>{calls.push("publish");published=true;cr={...cr,status:"published",observedExists:true,observedEnvelope:null};}
    };
    return {api:require("../../js/productionSharedLocalReconciliation.js"),calls};
  };
  let t=load({remoteExists:true,terminal:true});assert.equal(t.api.refresh().reason,"remote-not-observed");
  let r=await t.api.preview();assert.equal(r.ok,true);assert.equal(r.state.phase,"PREVIEW_READY");assert.deepEqual(t.calls,["refresh","preview"],"an existing snapshot is only read, never republished");
  t=load({remoteExists:false,terminal:true});r=await t.api.preview();assert.equal(r.ok,true);assert.deepEqual(t.calls,["refresh","publish","refresh","preview"],"a missing snapshot is published once after a terminal Showdown, then read back");
  t=load({remoteExists:false,terminal:false});r=await t.api.preview();assert.equal(r.ok,false);assert.equal(r.code,"LOCAL_RECONCILIATION_PREVIEW_BLOCKED");assert.deepEqual(t.calls,["refresh"],"no publish before the Showdown is terminal");
  t=load({remoteExists:false,terminal:true,refreshOk:false});r=await t.api.preview();assert.equal(r.ok,false);assert.deepEqual(t.calls,["refresh"],"a failed read never leads to a blind publish");
  for(const k of ["currentShowdown","CareerModeSharedLocalReconciliation","CareerModeProductionSharedHistoryConvergence","CareerModeProductionSharedMultiSeasonProgression","CareerModeSparkConnectedRivalry"])delete globalThis[k];
  process.stdout.write("PASS r52 Local Reconciliation Preview observes the remote snapshot: read-only when it exists, one terminal-only publish when it is missing, no publish after a failed read or before the Showdown ends\n");
})().catch(error=>{console.error(error);process.exit(1);});
