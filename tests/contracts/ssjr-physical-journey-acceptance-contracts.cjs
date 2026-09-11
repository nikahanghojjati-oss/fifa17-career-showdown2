const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

(async()=>{
  const recorder=require("../../js/ssjrPhysicalJourneyAcceptance.js");
  assert.equal(recorder.contractVersion,1);
  assert.equal(recorder.feature,"mdp-physical-journey-acceptance-recorder");
  assert.equal(recorder.acceptanceOnly,true);
  assert.equal(recorder.productionObserver,true);
  assert.equal(recorder.runtimeRevision,"1.9.1-r19");
  assert.equal(recorder.sanitizedSessionStorageOnly,true);
  assert.equal(recorder.rawAuthorityPersistence,false);
  assert.equal(recorder.providerWriteRequired,false);
  assert.equal(recorder.recorderNetworkRequests,false);
  assert.equal(recorder.canonicalStorageMutation,false);
  assert.equal(recorder.candidateCAutomaticApply,false);
  assert.equal(recorder.billingRequired,false);
  assert.equal(recorder.cloudRunRequired,false);
  assert.equal(recorder.cloudFunctionsRequired,false);

  const source=fs.readFileSync(path.join(__dirname,"../../js/ssjrPhysicalJourneyAcceptance.js"),"utf8");
  assert.match(source,/ssjr-acceptance/);
  assert.match(source,/ssjr-physical/);
  assert.match(source,/careerModeShowdown\.ssjrPhysicalJourney\.safe\.v1/);
  assert.match(source,/candidateCApplied===false/);
  assert.match(source,/terminal-reload-verified/);
  assert.match(source,/STALE_RETRY_AND_REPLAY_DENIAL/);
  assert.doesNotMatch(source,/\bfetch\s*\(/,"recorder must not make its own network requests");
  assert.doesNotMatch(source,/XMLHttpRequest/,"recorder must not add an alternate network path");
  assert.doesNotMatch(source,/localStorage\s*\.\s*setItem/,"recorder must not mutate canonical local storage");
  assert.doesNotMatch(source,/applyLocalReconciliation/,"recorder must never invoke destructive Candidate C Apply");

  const validator=await import("../../scripts/validate-ssjr-physical-journey-evidence.mjs");
  const fp=char=>`sha256:${char.repeat(64)}`;
  const stages=[
    ["remote-active","ACTIVE"],["setup-confirmed","SHOWDOWN_CONFIRMED"],["career-start-ready","CAREER_START_READY"],["transfer-completed","COMPLETED"],["results-ready","RESULTS_READY"],["season-acknowledged","ACKNOWLEDGED"],["scoring-reconciled","SCORING_RECONCILED"],["history-converged","HISTORY_CONVERGED"],["network-offline","OFFLINE"],["network-online","ONLINE"],["reconnect-recovered","ACTIVE_RECOVERED"],["conflict-guard-proven","STALE_RETRY_AND_REPLAY_DENIAL"],["local-reconciliation-safe","PREVIEW_READY"],["final-season-reconciled","FINAL_SEASON_RECONCILED"],["terminal-closed","CLOSED"],["terminal-reload-verified","CLOSED_AFTER_RELOAD"]
  ];
  const evidence=({managerRole,remoteRole,account,device,rivalry="c",session="d",deviceLabel,networkLabel,userAgent,platform})=>({
    schema:validator.EVIDENCE_SCHEMA,generatedAt:"2026-09-11T06:30:00.000Z",appVersion:"1.9.1",runtimeRevision:"1.9.1-r19",acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,
    device:{userAgent,platform,maxTouchPoints:managerRole==="playerOne"?0:5,screenWidth:managerRole==="playerOne"?1366:430,screenHeight:managerRole==="playerOne"?768:932},deviceLabel,networkLabel,managerRole,remoteRole,accountFingerprint:fp(account),deviceFingerprint:fp(device),rivalryFingerprint:fp(rivalry),sessionFingerprints:[fp(session)],canonicalStorageBeforeHash:fp("e"),canonicalStorageAfterHash:fp("e"),canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:true,onlineRecovered:true,reloadResumed:true,terminalReloadVerified:true,conflictGuardProven:true,startupCount:3,
    milestones:stages.map(([stage,phase],index)=>({sequence:index+1,at:new Date(Date.UTC(2026,8,11,6,30,index)).toISOString(),stage,phase,online:stage!=="network-offline"})),completed:true
  });
  const one=evidence({managerRole:"playerOne",remoteRole:"host",account:"1",device:"2",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",userAgent:"ChromeOS Chrome",platform:"Linux x86_64"});
  const two=evidence({managerRole:"playerTwo",remoteRole:"peer",account:"3",device:"4",deviceLabel:"iPhone peer",networkLabel:"Cellular",userAgent:"iPhone Safari",platform:"iPhone"});
  const accepted=validator.validatePhysicalJourneyPair(one,two);
  assert.equal(accepted.valid,true,JSON.stringify(accepted.issues));
  assert.equal(accepted.summary.sameRivalry,true);
  assert.equal(accepted.summary.sharedSessionFingerprints,1);
  assert.equal(accepted.summary.distinctDevices,true);

  const sameNetwork=structuredClone(two);sameNetwork.networkLabel="Home Wi-Fi";
  assert.equal(validator.validatePhysicalJourneyPair(one,sameNetwork).valid,false);
  assert.ok(validator.validatePhysicalJourneyPair(one,sameNetwork).issues.some(item=>item.code==="NETWORK_LABELS_NOT_DISTINCT"));

  const rawLeak=structuredClone(two);rawLeak.note=`pair_${"a".repeat(64)}`;
  assert.equal(validator.validatePhysicalJourneyPair(one,rawLeak).valid,false);
  assert.ok(validator.validatePhysicalJourneyPair(one,rawLeak).issues.some(item=>item.code==="RAW_PRIVATE_VALUE"));

  const applied=structuredClone(two);applied.candidateCApplied=true;applied.canonicalStorageAfterHash=fp("f");
  assert.ok(validator.validatePhysicalJourneyPair(one,applied).issues.some(item=>item.code==="CANDIDATE_C_APPLY_FORBIDDEN"));

  const badOrder=structuredClone(two);const finalIndex=badOrder.milestones.findIndex(item=>item.stage==="final-season-reconciled"),historyIndex=badOrder.milestones.findIndex(item=>item.stage==="history-converged");[badOrder.milestones[finalIndex].sequence,badOrder.milestones[historyIndex].sequence]=[badOrder.milestones[historyIndex].sequence,badOrder.milestones[finalIndex].sequence];
  assert.equal(validator.validatePhysicalJourneyPair(one,badOrder).valid,false);

  console.log("PASS MDP Physical Journey acceptance recorder is query-gated, privacy-safe, non-writing and Candidate-C non-destructive");
  console.log("PASS MDP Physical Journey pair oracle requires opposite managers, distinct devices/networks, same rivalry/session correlation and ordered full-journey recovery through terminal reload");
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY ACCEPTANCE CONTRACTS FAILED");console.error(error.stack||error);process.exit(1);});
