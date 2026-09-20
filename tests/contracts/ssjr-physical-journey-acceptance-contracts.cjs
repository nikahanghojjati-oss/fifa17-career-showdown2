const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

(async()=>{
  const recorder=require("../../js/ssjrPhysicalJourneyAcceptance.js");
  assert.equal(recorder.contractVersion,2);
  assert.equal(recorder.feature,"mdp-physical-journey-acceptance-recorder");
  assert.equal(recorder.acceptanceOnly,true);
  assert.equal(recorder.productionObserver,true);
  assert.equal(recorder.runtimeRevision,"1.9.1-r20");
  assert.equal(recorder.sanitizedSessionStorageOnly,true);
  assert.equal(recorder.rawAuthorityPersistence,false);
  assert.equal(recorder.providerWriteRequired,false);
  assert.equal(recorder.recorderNetworkRequests,false);
  assert.equal(recorder.canonicalStorageMutation,false);
  assert.equal(recorder.canonicalStorageProofScope,"local-reconciliation-preview");
  assert.equal(recorder.candidateCAutomaticApply,false);
  assert.equal(recorder.billingRequired,false);
  assert.equal(recorder.blazeRequired,false);
  assert.equal(recorder.cloudRunRequired,false);
  assert.equal(recorder.cloudFunctionsRequired,false);

  const source=fs.readFileSync(path.join(__dirname,"../../js/ssjrPhysicalJourneyAcceptance.js"),"utf8");
  const local=fs.readFileSync(path.join(__dirname,"../../js/productionSharedLocalReconciliation.js"),"utf8");
  const entry=fs.readFileSync(path.join(__dirname,"../../js/productionSharedJourneyEntry.js"),"utf8");
  assert.match(source,/captureLocalReconciliationBaseline/);
  assert.match(source,/verifyLocalReconciliationPreview/);
  assert.match(source,/canonicalStorageProofScope:"local-reconciliation-preview"/);
  assert.doesNotMatch(source,/ensureCanonicalBaseline/,"recorder implementation must not freeze Save Library at app startup");
  assert.match(local,/acceptance\.captureLocalReconciliationBaseline\(\)/,"preview must arm the scoped storage proof");
  assert.match(local,/acceptance\.verifyLocalReconciliationPreview\(\)/,"preview must close the scoped storage proof");
  assert.match(source,/if\(local\.phase==="APPLIED"\)safe\.candidateCApplied=true/,"Candidate C detection must remain sticky");
  assert.match(source,/item\.stage==="local-reconciliation-safe"&&item\.phase==="PREVIEW_READY"/,"completion must require actual PREVIEW_READY");
  assert.match(source,/safe\.startupCount>safe\.reconnectRecoveredStartupCount/,"pre-terminal reload must follow reconnect recovery");
  assert.match(source,/!hasStage\("history-converged"\)/,"network recovery evidence must be gated until history convergence");
  assert.doesNotMatch(source,/\bfetch\s*\(/,"recorder must not make its own network requests");
  assert.doesNotMatch(source,/XMLHttpRequest/);
  assert.doesNotMatch(source,/localStorage\s*\.\s*setItem/);
  assert.doesNotMatch(source,/applyLocalReconciliation/,"recorder must never invoke Candidate C Apply");
  assert.match(entry,/peerActiveReturnToSharedEntry:true/);
  assert.match(entry,/bothDevicesPrepareSharedShell:true/);
  assert.match(entry,/singleProductEntry:true/);
  assert.match(entry,/continueCareerUsesPairedAuthority:true/);
  assert.doesNotMatch(entry,/continueCareerIsLocalOnly:true/,'Continue Career must not be described as a local-only alternative.');
  assert.match(entry,/remote\.subscribe\(onState\)/,"shared entry must observe the one successful peer join");
  assert.match(entry,/next\.sessionState!=="active"/,"peer return must wait for ACTIVE remote authority");
  assert.match(entry,/start\.textContent="START A SHOWDOWN"/,'Physical journey must enter through the canonical Start a Showdown surface.');
  assert.match(entry,/Daniel and Nik must both be connected before the career begins\./);
  assert.doesNotMatch(entry,/START SHARED SHOWDOWN|BOTH manager devices before pairing/i,'Physical acceptance must not force retired engineering copy back into the player surface.');

  const validator=await import("../../scripts/validate-ssjr-physical-journey-evidence.mjs");
  const fp=char=>`sha256:${char.repeat(64)}`;
  const stages=[
    ["remote-active","ACTIVE",{}],
    ["conflict-guard-proven","STALE_RETRY_AND_REPLAY_DENIAL",{providerWrite:false}],
    ["setup-confirmed","SHOWDOWN_CONFIRMED",{revision:6,totalSeasons:1}],
    ["career-start-ready","CAREER_START_READY",{}],
    ["transfer-completed","COMPLETED",{seasonNumber:1}],
    ["results-ready","RESULTS_READY",{seasonNumber:1}],
    ["season-acknowledged","ACKNOWLEDGED",{seasonNumber:1}],
    ["scoring-reconciled","SCORING_RECONCILED",{seasonNumber:1}],
    ["history-converged","HISTORY_CONVERGED",{seasonNumber:1}],
    ["network-offline","OFFLINE",{}],
    ["network-online","ONLINE",{}],
    ["reconnect-recovered","ACTIVE_RECOVERED",{seasonNumber:1,startupCount:1}],
    ["reload-resumed","SAME_SANITIZED_AUTHORITY",{startupCount:2}],
    ["local-reconciliation-storage-baseline","CAPTURED",{providerWrite:false}],
    ["local-reconciliation-storage-verified","UNCHANGED",{providerWrite:false}],
    ["local-reconciliation-safe","PREVIEW_READY",{providerWrite:false}],
    ["final-season-reconciled","FINAL_SEASON_RECONCILED",{seasonNumber:1}],
    ["terminal-closed","CLOSED",{startupCount:2}],
    ["terminal-reload-verified","CLOSED_AFTER_RELOAD",{startupCount:3}]
  ];
  const makeMilestones=()=>stages.map(([stage,phase,extra],index)=>({sequence:index+1,at:new Date(Date.UTC(2026,8,13,6,30,index)).toISOString(),stage,phase,online:stage!=="network-offline",...extra}));
  const resequence=e=>{e.milestones.forEach((item,index)=>{item.sequence=index+1;item.at=new Date(Date.UTC(2026,8,13,6,30,index)).toISOString();});return e;};
  const previewBeforeStorageVerify=e=>{
    const previewIndex=e.milestones.findIndex(item=>item.stage==="local-reconciliation-safe"&&item.phase==="PREVIEW_READY");
    const verifiedIndex=e.milestones.findIndex(item=>item.stage==="local-reconciliation-storage-verified");
    assert.ok(previewIndex>=0&&verifiedIndex>=0,"fixture requires preview and storage verification milestones");
    const [preview]=e.milestones.splice(previewIndex,1);
    const currentVerifiedIndex=e.milestones.findIndex(item=>item.stage==="local-reconciliation-storage-verified");
    e.milestones.splice(currentVerifiedIndex,0,preview);
    return resequence(e);
  };
  const evidence=({managerRole,remoteRole,account,device,rivalry="c",session="d",deviceLabel,networkLabel,userAgent,platform})=>({
    schema:validator.EVIDENCE_SCHEMA,generatedAt:"2026-09-13T06:30:00.000Z",appVersion:"1.9.1",runtimeRevision:"1.9.1-r43",acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,
    device:{userAgent,platform,maxTouchPoints:managerRole==="playerOne"?0:5,screenWidth:managerRole==="playerOne"?1366:430,screenHeight:managerRole==="playerOne"?768:932},deviceLabel,networkLabel,managerRole,remoteRole,accountFingerprint:fp(account),deviceFingerprint:fp(device),rivalryFingerprint:fp(rivalry),sessionFingerprints:[fp(session)],authorityViolation:false,canonicalStorageProofScope:"local-reconciliation-preview",canonicalStorageBeforeHash:fp("e"),canonicalStorageAfterHash:fp("e"),canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:true,onlineRecovered:true,reloadResumed:true,terminalReloadVerified:true,conflictGuardProven:true,startupCount:3,
    milestones:makeMilestones(),completed:true
  });
  const one=evidence({managerRole:"playerOne",remoteRole:"host",account:"1",device:"2",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",userAgent:"ChromeOS Chrome",platform:"Linux x86_64"});
  const two=evidence({managerRole:"playerTwo",remoteRole:"peer",account:"3",device:"4",deviceLabel:"iPhone peer",networkLabel:"Cellular",userAgent:"iPhone Safari",platform:"iPhone"});
  const accepted=validator.validatePhysicalJourneyPair(one,two);
  assert.equal(accepted.valid,true,JSON.stringify(accepted.issues));
  assert.equal(accepted.summary.sameRivalry,true);
  assert.equal(accepted.summary.sharedSessionFingerprints,1);
  assert.equal(accepted.summary.distinctDevices,true);

  const previewFirstOne=previewBeforeStorageVerify(structuredClone(one));
  const previewFirstTwo=previewBeforeStorageVerify(structuredClone(two));
  const previewFirstAccepted=validator.validatePhysicalJourneyPair(previewFirstOne,previewFirstTwo);
  assert.equal(previewFirstAccepted.valid,true,`PREVIEW_READY may be synchronously observed before the after-hash callback: ${JSON.stringify(previewFirstAccepted.issues)}`);

  const wrongScope=structuredClone(two);wrongScope.canonicalStorageProofScope="whole-journey";
  assert.ok(validator.validatePhysicalJourneyPair(one,wrongScope).issues.some(item=>item.code==="CANONICAL_STORAGE_PROOF_SCOPE_INVALID"));
  const changedDuringPreview=structuredClone(two);changedDuringPreview.canonicalStorageAfterHash=fp("f");changedDuringPreview.canonicalStorageViolation=true;
  assert.ok(validator.validatePhysicalJourneyPair(one,changedDuringPreview).issues.some(item=>item.code==="CANONICAL_STORAGE_CHANGED"));
  const missingStorageProof=structuredClone(two);missingStorageProof.milestones=missingStorageProof.milestones.filter(item=>!item.stage.startsWith("local-reconciliation-storage-"));resequence(missingStorageProof);
  assert.ok(validator.validatePhysicalJourneyPair(one,missingStorageProof).issues.some(item=>item.code==="LOCAL_RECONCILIATION_STORAGE_PROOF_INVALID"||item.code==="RECOVERY_ORDER_INVALID"));
  const changedProof=structuredClone(two);changedProof.milestones.find(item=>item.stage==="local-reconciliation-storage-verified").phase="CHANGED";
  assert.ok(validator.validatePhysicalJourneyPair(one,changedProof).issues.some(item=>item.code==="LOCAL_RECONCILIATION_STORAGE_PROOF_INVALID"));
  const sameNetwork=structuredClone(two);sameNetwork.networkLabel="Home Wi-Fi";
  assert.ok(validator.validatePhysicalJourneyPair(one,sameNetwork).issues.some(item=>item.code==="NETWORK_LABELS_NOT_DISTINCT"));
  const authorityDrift=structuredClone(two);authorityDrift.authorityViolation=true;
  assert.ok(validator.validatePhysicalJourneyPair(one,authorityDrift).issues.some(item=>item.code==="AUTHORITY_CHANGED"));
  const hiddenApplied=structuredClone(two);const localIndex=hiddenApplied.milestones.findIndex(item=>item.stage==="local-reconciliation-safe");hiddenApplied.milestones.splice(localIndex+1,0,{...hiddenApplied.milestones[localIndex],phase:"APPLIED"});resequence(hiddenApplied);
  assert.ok(validator.validatePhysicalJourneyPair(one,hiddenApplied).issues.some(item=>item.code==="LOCAL_RECONCILIATION_UNSAFE"));
  const remoteObservedOnly=structuredClone(two);remoteObservedOnly.milestones.find(item=>item.stage==="local-reconciliation-safe").phase="REMOTE_OBSERVED";
  assert.ok(validator.validatePhysicalJourneyPair(one,remoteObservedOnly).issues.some(item=>item.code==="LOCAL_RECONCILIATION_PREVIEW_REQUIRED"));
  const multiSeason=structuredClone(two);multiSeason.milestones.find(item=>item.stage==="setup-confirmed").totalSeasons=3;
  assert.ok(validator.validatePhysicalJourneyPair(one,multiSeason).issues.some(item=>item.code==="ONE_SEASON_PLAN_REQUIRED"));
  const fakeOffline=structuredClone(two);fakeOffline.milestones.find(item=>item.stage==="network-offline").online=true;
  assert.ok(validator.validatePhysicalJourneyPair(one,fakeOffline).issues.some(item=>item.code==="OFFLINE_FLAG_INVALID"));

  console.log("PASS r43 Physical Journey recorder is query-gated, privacy-safe, non-writing, authority-sticky and scopes canonical storage integrity to Local Reconciliation preview");
  console.log("PASS r20 peer-entry contract requires both devices to prepare canonical Showdown shells and ACTIVE peer join to return to the single paired Career entry");
  console.log("PASS r20 pair oracle accepts both safe PREVIEW_READY/after-hash callback orders while requiring opposite manager/remote roles, distinct devices/networks, one season, ordered recovery, scoped unchanged storage proof, no Candidate C Apply and terminal reload");
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY ACCEPTANCE CONTRACTS FAILED");console.error(error.stack||error);process.exit(1);});