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
  assert.match(source,/function onOffline\(\)\{if\(!enabled\|\|!lastSeasonHistoryRecorded\(\)\)return;/,"network recovery evidence must be gated until the last season's history convergence (r51)");
  assert.match(source,/function onOnline\(\)\{if\(!enabled\|\|!lastSeasonHistoryRecorded\(\)\|\|!safe\.offlineObserved\)return;/);
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
  assert.match(entry,/ready\?"START A SHOWDOWN"/,'Physical journey must expose canonical Start a Showdown only after player identity is ready.');
  assert.match(entry,/"SIGN IN TO START"/,'Physical journey must explicitly route unsigned users through sign-in first.');
  assert.match(entry,/identity&&typeof identity\.openGate==="function"/,'Unsigned Start must open the player identity gate without creating a Showdown shell.');
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
    schema:validator.EVIDENCE_SCHEMA,generatedAt:"2026-09-13T06:30:00.000Z",appVersion:"1.9.1",runtimeRevision:"1.9.1-r66",acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,
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
  // r51: one longer run proves every season of a 3-season plan on both devices.
  const seasonStages=["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged"];
  const planEvidence=(base,total)=>{const e=structuredClone(base),list=[];for(const item of e.milestones){if(seasonStages.includes(item.stage))continue;if(item.stage==="setup-confirmed")item.totalSeasons=total;if(item.stage==="final-season-reconciled")item.seasonNumber=total;list.push(item);if(item.stage==="career-start-ready"){for(let season=1;season<=total;season+=1)for(const stage of seasonStages)list.push({stage,phase:base.milestones.find(entry=>entry.stage===stage).phase,online:true,seasonNumber:season});if(total>1)list.push({stage:"showdown-complete",phase:"SHOWDOWN_COMPLETE",online:true,seasonNumber:total,totalSeasons:total});}}e.milestones=list;return resequence(e);};
  const threeOne=planEvidence(one,3),threeTwo=planEvidence(two,3),threeAccepted=validator.validatePhysicalJourneyPair(threeOne,threeTwo);
  assert.equal(threeAccepted.valid,true,`a complete 3-season run must validate: ${JSON.stringify(threeAccepted.issues)}`);assert.equal(threeAccepted.summary.totalSeasons,3);
  assert.equal(accepted.summary.totalSeasons,1,"the one-season run remains valid");
  const codes=(first,second)=>validator.validatePhysicalJourneyPair(first,second).issues.map(item=>item.code);
  const multiSeason=structuredClone(two);multiSeason.milestones.find(item=>item.stage==="setup-confirmed").totalSeasons=3;
  assert.ok(codes(planEvidence(one,3),multiSeason).includes("SEASON_STAGE_MISSING"),"a 3-season plan with only season 1 recorded must be rejected");
  const noComplete=structuredClone(threeTwo);noComplete.milestones=noComplete.milestones.filter(item=>item.stage!=="showdown-complete");resequence(noComplete);
  assert.ok(codes(threeOne,noComplete).includes("SHOWDOWN_COMPLETE_MISSING"));
  const earlyFinal=structuredClone(threeTwo);earlyFinal.milestones.find(item=>item.stage==="final-season-reconciled").seasonNumber=2;
  assert.ok(codes(threeOne,earlyFinal).includes("FINAL_SEASON_MISMATCH"));
  const swapped=structuredClone(threeTwo);const s2=swapped.milestones.findIndex(item=>item.stage==="transfer-completed"&&item.seasonNumber===2),s3=swapped.milestones.findIndex(item=>item.stage==="transfer-completed"&&item.seasonNumber===3);swapped.milestones[s2].seasonNumber=3;swapped.milestones[s3].seasonNumber=2;
  assert.ok(codes(threeOne,swapped).includes("SEASON_ORDER_INVALID"));
  const extraSeason=structuredClone(threeTwo);extraSeason.milestones.push({...extraSeason.milestones.find(item=>item.stage==="results-ready"),seasonNumber:4});resequence(extraSeason);
  assert.ok(codes(threeOne,extraSeason).includes("SEASON_OUT_OF_PLAN"));
  assert.ok(codes(one,threeTwo).includes("SEASON_PLAN_MISMATCH"),"both devices must record the same plan");
  const midGame=structuredClone(threeTwo),recoveryStages=["network-offline","network-online","reconnect-recovered","reload-resumed"],moved=midGame.milestones.filter(item=>recoveryStages.includes(item.stage));midGame.milestones=midGame.milestones.filter(item=>!recoveryStages.includes(item.stage));midGame.milestones.splice(midGame.milestones.findIndex(item=>item.stage==="history-converged"&&item.seasonNumber===1)+1,0,...moved);resequence(midGame);
  assert.ok(codes(threeOne,midGame).includes("RECOVERY_ORDER_INVALID"),"recovery proof must follow the last season's History, not season 1's");
  const lateComplete=structuredClone(threeTwo),completeItem=lateComplete.milestones.find(item=>item.stage==="showdown-complete");lateComplete.milestones=lateComplete.milestones.filter(item=>item!==completeItem);lateComplete.milestones.splice(lateComplete.milestones.findIndex(item=>item.stage==="reconnect-recovered")+1,0,completeItem);resequence(lateComplete);
  assert.ok(codes(threeOne,lateComplete).includes("RECOVERY_ORDER_INVALID"),"recovery proof must start after the completed plan is recorded");
  assert.ok(codes(planEvidence(one,2),planEvidence(two,2)).includes("SEASON_PLAN_INVALID"),"only supported 1/3/5/10 plans are valid");
  const fakeOffline=structuredClone(two);fakeOffline.milestones.find(item=>item.stage==="network-offline").online=true;
  assert.ok(validator.validatePhysicalJourneyPair(one,fakeOffline).issues.some(item=>item.code==="OFFLINE_FLAG_INVALID"));

  console.log("PASS r51 Physical Journey recorder is query-gated, privacy-safe, non-writing, authority-sticky and scopes canonical storage integrity to Local Reconciliation preview");
  console.log("PASS current peer entry uses Daniel's one-season host Showdown and Nik's code-based join, which provisions Nik's recovery copy before the separate ACTIVE session");
  console.log("PASS current pair oracle accepts both safe PREVIEW_READY/after-hash callback orders while requiring opposite manager/remote roles, distinct devices/networks, every season of one confirmed plan in order, ordered recovery, scoped unchanged storage proof, no Candidate C Apply and terminal reload");
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY ACCEPTANCE CONTRACTS FAILED");console.error(error.stack||error);process.exit(1);});
