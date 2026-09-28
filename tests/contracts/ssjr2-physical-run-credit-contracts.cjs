const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {pathToFileURL}=require("node:url");

const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

(async()=>{
  const credit=await import(pathToFileURL(path.join(root,"scripts/ssjr2-physical-run-credit.mjs")).href);
  const validator=await import(pathToFileURL(path.join(root,"scripts/validate-ssjr-physical-journey-evidence.mjs")).href);
  const v1=JSON.parse(read("SHARED_SHOWDOWN_JOURNEY_MODEL.json")),v2=credit.loadModel(root),ledger=credit.loadLedger(root);
  const runtime=credit.currentProductionRuntime(root);

  // SSJR-1.1 stays frozen and SSJR-2.0 keeps every capability, weight and dependency.
  assert.equal(v2.modelVersion,"SSJR-2.0");assert.equal(v2.supersedesModelVersion,"SSJR-1.1");
  assert.equal(v2.supersededModelSha256,`sha256:${crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"SHARED_SHOWDOWN_JOURNEY_MODEL.json"))).digest("hex")}`,"SSJR-1.1 model file must remain byte-identical");
  const flat=model=>model.domains.flatMap(domain=>domain.capabilities.map(item=>({domain:domain.id,id:item.id,weight:item.weight,dependsOn:item.dependsOn})));
  assert.deepEqual(flat(v2),flat(v1),"SSJR-2.0 must not change capabilities, weights or dependencies");
  assert.deepEqual(v2.domains.map(d=>[d.id,d.weight]),v1.domains.map(d=>[d.id,d.weight]));
  assert.equal(flat(v2).reduce((sum,item)=>sum+item.weight,0),100);
  for(const item of credit.capabilities(v2)){
    assert.ok(Array.isArray(item.automatedEvidence)&&item.automatedEvidence.length>0,`${item.id} needs automated evidence suites`);
    for(const file of item.automatedEvidence)assert.ok(fs.existsSync(path.join(root,file)),`${item.id} automated suite missing: ${file}`);
    assert.ok(plain(item.productionEvidence),`${item.id} needs a production evidence rule`);
  }
  assert.equal(credit.capabilities(v2).find(item=>item.id==="multi-season").productionEvidence.requiresConfirmedSeasons.minimum,2,"a one-season run must never prove multi-season progression");
  assert.ok(fs.existsSync(path.join(root,v2.ownerAuthority)),"owner authority record must exist");
  assert.equal(JSON.parse(read("SHARED_SHOWDOWN_JOURNEY_READINESS.json")).modelVersion,"SSJR-1.1","SSJR-1.1 ledger remains untouched");

  // Ledger integrity: score equals credited weights and credit is dependency-closed.
  const weights=new Map(credit.capabilities(v2).map(item=>[item.id,item]));
  assert.equal(ledger.modelVersion,"SSJR-2.0");
  assert.equal(ledger.currentScore,(ledger.creditedCapabilityIds||[]).reduce((sum,id)=>sum+weights.get(id).weight,0),"ledger score must equal credited weights");
  for(const id of ledger.creditedCapabilityIds||[])for(const dep of weights.get(id).dependsOn)assert.ok(ledger.creditedCapabilityIds.includes(dep),`${id} credited without ${dep}`);
  for(const event of ledger.events||[]){assert.ok(event.automatedEvidenceVerified===true&&/^[0-9a-f]{40}$/.test(event.productionMainSha)&&event.exportHashes.length===2,"every credit event needs a verified production main and a physical pair");}

  // Synthetic physical pair (same fixture shape as the r47 validator contracts).
  const fp=char=>`sha256:${char.repeat(64)}`;
  const stages=[["remote-active","ACTIVE",{}],["conflict-guard-proven","STALE_RETRY_AND_REPLAY_DENIAL",{providerWrite:false}],["setup-confirmed","SHOWDOWN_CONFIRMED",{revision:6,totalSeasons:1}],["career-start-ready","CAREER_START_READY",{}],["transfer-completed","COMPLETED",{seasonNumber:1}],["results-ready","RESULTS_READY",{seasonNumber:1}],["season-acknowledged","ACKNOWLEDGED",{seasonNumber:1}],["scoring-reconciled","SCORING_RECONCILED",{seasonNumber:1}],["history-converged","HISTORY_CONVERGED",{seasonNumber:1}],["network-offline","OFFLINE",{}],["network-online","ONLINE",{}],["reconnect-recovered","ACTIVE_RECOVERED",{seasonNumber:1,startupCount:1}],["reload-resumed","SAME_SANITIZED_AUTHORITY",{startupCount:2}],["local-reconciliation-storage-baseline","CAPTURED",{providerWrite:false}],["local-reconciliation-storage-verified","UNCHANGED",{providerWrite:false}],["local-reconciliation-safe","PREVIEW_READY",{providerWrite:false}],["final-season-reconciled","FINAL_SEASON_RECONCILED",{seasonNumber:1}],["terminal-closed","CLOSED",{startupCount:2}],["terminal-reload-verified","CLOSED_AFTER_RELOAD",{startupCount:3}]];
  const evidence=({managerRole,remoteRole,account,device,deviceLabel,networkLabel,userAgent,platform})=>({schema:validator.EVIDENCE_SCHEMA,generatedAt:"2026-09-28T20:00:00.000Z",appVersion:"1.9.1",runtimeRevision:runtime,acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,device:{userAgent,platform,maxTouchPoints:managerRole==="playerOne"?0:5,screenWidth:managerRole==="playerOne"?1366:430,screenHeight:managerRole==="playerOne"?768:932},deviceLabel,networkLabel,managerRole,remoteRole,accountFingerprint:fp(account),deviceFingerprint:fp(device),rivalryFingerprint:fp("c"),sessionFingerprints:[fp("d")],authorityViolation:false,canonicalStorageProofScope:"local-reconciliation-preview",canonicalStorageBeforeHash:fp("e"),canonicalStorageAfterHash:fp("e"),canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:true,onlineRecovered:true,reloadResumed:true,terminalReloadVerified:true,conflictGuardProven:true,startupCount:3,milestones:stages.map(([stage,phase,extra],index)=>({sequence:index+1,at:new Date(Date.UTC(2026,8,28,20,0,index)).toISOString(),stage,phase,online:stage!=="network-offline",...extra})),completed:true});
  const daniel=evidence({managerRole:"playerOne",remoteRole:"host",account:"1",device:"2",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",userAgent:"ChromeOS Chrome",platform:"Linux x86_64"});
  const nik=evidence({managerRole:"playerTwo",remoteRole:"peer",account:"3",device:"4",deviceLabel:"iPhone peer",networkLabel:"Cellular",userAgent:"iPhone Safari",platform:"iPhone"});
  const attestation={schema:credit.ATTESTATION_SCHEMA,owner:"Nik",runDate:"2026-09-28",runtimeRevision:runtime,managers:{playerOne:"Daniel",playerTwo:"Nik"},deviceLabels:["iPhone peer","Chromebook host"],statement:credit.ATTESTATION_STATEMENT,stableReleaseAccepted:false};
  const template=JSON.parse(read("acceptance/SSJR2_OWNER_ATTESTATION_TEMPLATE.json"));
  assert.deepEqual(Object.keys(template),Object.keys(attestation),"template must carry exactly the validated fields");assert.equal(template.statement,credit.ATTESTATION_STATEMENT);assert.equal(template.schema,credit.ATTESTATION_SCHEMA);
  const empty={...ledger,currentScore:0,creditedCapabilityIds:[],events:[]};
  const assess=(overrides={})=>credit.evaluateRun({first:daniel,second:nik,attestation,model:v2,ledger:empty,runtimeRevision:runtime,repoRoot:root,...overrides});

  const ok=assess();
  assert.equal(ok.valid,true,JSON.stringify(ok.issues));
  const expected=["entry-binding","entry-before-draw","setup-league","setup-clubs","setup-length","setup-confirmation","career-start","transfer-challenge","results-publication","season-commit","canonical-scoring","history-convergence","journey-reconnect","journey-conflicts","local-reconciliation"];
  assert.deepEqual(ok.newlyCreditable.map(item=>item.id).sort(),[...expected].sort(),"a valid one-season run credits exactly the capabilities it proves");
  assert.equal(ok.scoreAfter,82,"a valid one-season run is worth exactly 82/100 under the unchanged SSJR weights");
  const blocked=new Map(ok.blocked.map(item=>[item.id,item.reasons.join("; ")]));
  assert.match(blocked.get("multi-season"),/at least 2 seasons/);
  for(const id of ["final-reconciliation","terminal-close","physical-journey","stable-journey-release"])assert.match(blocked.get(id),/depends on uncredited/,`${id} must stay blocked by its unchanged dependency`);
  assert.equal(ok.creditRecorded,false,"assessment alone never records credit");

  // Nothing is creditable without a valid pair and exact owner attestation.
  for(const [label,overrides,code] of [
    ["missing attestation",{attestation:null},"ATTESTATION_REQUIRED"],
    ["wrong owner",{attestation:{...attestation,owner:"Daniel"}},"ATTESTATION_OWNER_INVALID"],
    ["edited statement",{attestation:{...attestation,statement:"we played"}},"ATTESTATION_STATEMENT_INVALID"],
    ["wrong devices",{attestation:{...attestation,deviceLabels:["Chromebook host","Laptop"]}},"ATTESTATION_DEVICES_MISMATCH"],
    ["stale runtime",{attestation:{...attestation,runtimeRevision:"1.9.1-r6"}},"ATTESTATION_RUNTIME_MISMATCH"],
    ["extra field",{attestation:{...attestation,note:"x"}},"ATTESTATION_FIELDS_INVALID"],
    ["same account twice",{second:{...nik,accountFingerprint:daniel.accountFingerprint}},"ACCOUNT_NOT_DISTINCT"],
    ["two tabs on one device",{second:{...nik,device:daniel.device}},"PHYSICAL_DEVICE_FACTS_NOT_DISTINCT"]
  ]){const result=assess(overrides);assert.equal(result.valid,false,label);assert.ok(result.issues.some(item=>item.code===code),`${label} must fail with ${code}: ${JSON.stringify(result.issues.map(i=>i.code))}`);assert.equal(result.newlyCreditable.length,0,`${label} must credit nothing`);assert.equal(result.scoreAfter,0);}

  // Recording needs the exact production main and verified automated suites, and refuses duplicates.
  const texts=[JSON.stringify(daniel),JSON.stringify(nik),JSON.stringify(attestation)];
  assert.throws(()=>credit.recordRun({assessment:ok,firstText:texts[0],secondText:texts[1],attestationText:texts[2],mainSha:"abc",automatedVerified:true,ledger:empty}),/SSJR2_MAIN_SHA_REQUIRED/);
  assert.throws(()=>credit.recordRun({assessment:ok,firstText:texts[0],secondText:texts[1],attestationText:texts[2],mainSha:"a".repeat(40),automatedVerified:false,ledger:empty}),/SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED/);
  assert.throws(()=>credit.recordRun({assessment:assess({attestation:null}),firstText:texts[0],secondText:texts[1],attestationText:"null",mainSha:"a".repeat(40),automatedVerified:true,ledger:empty}),/SSJR2_RUN_INVALID/);
  const recorded=credit.recordRun({assessment:ok,firstText:texts[0],secondText:texts[1],attestationText:texts[2],mainSha:"a".repeat(40),automatedVerified:true,ledger:empty,recordedAt:"2026-09-28T21:00:00.000Z"});
  assert.equal(recorded.currentScore,82);assert.deepEqual([...recorded.creditedCapabilityIds].sort(),[...expected].sort());assert.equal(recorded.events.length,1);
  assert.doesNotMatch(JSON.stringify(recorded),/pair_[a-f0-9]{64}|session_[a-f0-9]{64}|device_[a-f0-9]{32}/,"ledger must never contain raw private authority");
  assert.throws(()=>credit.recordRun({assessment:ok,firstText:texts[0],secondText:texts[1],attestationText:texts[2],mainSha:"a".repeat(40),automatedVerified:true,ledger:recorded}),/SSJR2_RUN_ALREADY_RECORDED/);
  const again=credit.evaluateRun({first:daniel,second:nik,attestation,model:v2,ledger:recorded,runtimeRevision:runtime,repoRoot:root});
  assert.equal(again.newlyCreditable.length,0,"already-credited capabilities are never credited twice");assert.equal(again.scoreAfter,82);

  console.log(`PASS SSJR-2.0 physical-run credit contracts: SSJR-1.1 stays frozen, capabilities/weights/dependencies are unchanged, a validated two-device ${runtime} run plus Nik's exact attestation credits exactly 82/100, multi-season and its dependents stay blocked for a one-season run, and invalid pairs, edited attestations, duplicates and unverified production mains credit nothing.`);
})().catch(error=>{console.error(error);process.exit(1);});
function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
