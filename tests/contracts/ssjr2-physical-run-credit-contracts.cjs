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

  // SSJR-1.1 and SSJR-2.0 stay frozen; SSJR-2.1 keeps every capability, weight and dependency.
  const fileHash=file=>`sha256:${crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex")}`;
  assert.equal(v2.modelVersion,"SSJR-2.1");assert.equal(v2.supersedesModelVersion,"SSJR-2.0");
  assert.equal(v2.supersededModelSha256,fileHash(v2.supersededModelFile),"the SSJR-2.0 model copy must remain byte-identical");
  const v20=JSON.parse(read(v2.supersededModelFile));assert.equal(v20.modelVersion,"SSJR-2.0");assert.equal(v20.supersededModelSha256,fileHash("SHARED_SHOWDOWN_JOURNEY_MODEL.json"),"SSJR-1.1 model file must remain byte-identical");
  assert.deepEqual(v2.capabilityLineage,{modelVersion:"SSJR-1.1",file:"SHARED_SHOWDOWN_JOURNEY_MODEL.json",sha256:v20.supersededModelSha256});
  const stripMulti=model=>JSON.stringify(model.domains.map(d=>({...d,capabilities:d.capabilities.map(c=>c.id==="multi-season"?{...c,productionEvidence:null}:c)})));
  assert.equal(stripMulti(v2),stripMulti(v20),"SSJR-2.1 changes only how multi-season is proven");
  assert.deepEqual([v2.evidenceLayers,v2.creditPolicy,v2.permanentLocks],[v20.evidenceLayers,v20.creditPolicy,v20.permanentLocks]);
  const flat=model=>model.domains.flatMap(domain=>domain.capabilities.map(item=>({domain:domain.id,id:item.id,weight:item.weight,dependsOn:item.dependsOn})));
  assert.deepEqual(flat(v2),flat(v1),"SSJR-2.0 must not change capabilities, weights or dependencies");
  assert.deepEqual(v2.domains.map(d=>[d.id,d.weight]),v1.domains.map(d=>[d.id,d.weight]));
  assert.equal(flat(v2).reduce((sum,item)=>sum+item.weight,0),100);
  for(const item of credit.capabilities(v2)){
    assert.ok(Array.isArray(item.automatedEvidence)&&item.automatedEvidence.length>0,`${item.id} needs automated evidence suites`);
    for(const file of item.automatedEvidence)assert.ok(fs.existsSync(path.join(root,file)),`${item.id} automated suite missing: ${file}`);
    assert.ok(plain(item.productionEvidence),`${item.id} needs a production evidence rule`);
  }
  const multi=credit.capabilities(v2).find(item=>item.id==="multi-season").productionEvidence;assert.notEqual(multi.capturable,false,"r51 recorder captures every season");assert.deepEqual(multi.requiredMilestonesOnBothDevices,["showdown-complete"]);assert.equal(multi.requiresConfirmedSeasons.minimum,2);
  assert.match(v2.provenanceTrust,/No independent identity channel exists/,"residual owner-provenance trust must be stated explicitly");
  assert.ok(fs.existsSync(path.join(root,v2.ownerAuthority)),"owner authority record must exist");
  assert.equal(JSON.parse(read("SHARED_SHOWDOWN_JOURNEY_READINESS.json")).modelVersion,"SSJR-1.1","SSJR-1.1 ledger remains untouched");

  // Ledger integrity: score equals credited weights and credit is dependency-closed.
  const weights=new Map(credit.capabilities(v2).map(item=>[item.id,item]));
  assert.equal(ledger.modelVersion,"SSJR-2.1");
  assert.equal(ledger.currentScore,(ledger.creditedCapabilityIds||[]).reduce((sum,id)=>sum+weights.get(id).weight,0),"ledger score must equal credited weights");
  for(const id of ledger.creditedCapabilityIds||[])for(const dep of weights.get(id).dependsOn)assert.ok(ledger.creditedCapabilityIds.includes(dep),`${id} credited without ${dep}`);
  for(const event of ledger.events||[]){assert.ok(/^[0-9a-f]{40}$/.test(event.productionMainSha)&&Number.isInteger(event.automatedEvidence?.rulesDeploymentRunId)&&event.exportHashes.length===2&&/^sha256:/.test(event.attestationHash),"every credit event needs a live-verified production main, a physical pair and a bound attestation");}

  // Synthetic physical pair (same fixture shape as the r47 validator contracts).
  const fp=char=>`sha256:${char.repeat(64)}`;
  const stages=[["remote-active","ACTIVE",{}],["conflict-guard-proven","STALE_RETRY_AND_REPLAY_DENIAL",{providerWrite:false}],["setup-confirmed","SHOWDOWN_CONFIRMED",{revision:6,totalSeasons:1}],["career-start-ready","CAREER_START_READY",{}],["transfer-completed","COMPLETED",{seasonNumber:1}],["results-ready","RESULTS_READY",{seasonNumber:1}],["season-acknowledged","ACKNOWLEDGED",{seasonNumber:1}],["scoring-reconciled","SCORING_RECONCILED",{seasonNumber:1}],["history-converged","HISTORY_CONVERGED",{seasonNumber:1}],["network-offline","OFFLINE",{}],["network-online","ONLINE",{}],["reconnect-recovered","ACTIVE_RECOVERED",{seasonNumber:1,startupCount:1}],["reload-resumed","SAME_SANITIZED_AUTHORITY",{startupCount:2}],["local-reconciliation-storage-baseline","CAPTURED",{providerWrite:false}],["local-reconciliation-storage-verified","UNCHANGED",{providerWrite:false}],["local-reconciliation-safe","PREVIEW_READY",{providerWrite:false}],["final-season-reconciled","FINAL_SEASON_RECONCILED",{seasonNumber:1}],["terminal-closed","CLOSED",{startupCount:2}],["terminal-reload-verified","CLOSED_AFTER_RELOAD",{startupCount:3}]];
  const evidence=({managerRole,remoteRole,account,device,deviceLabel,networkLabel,userAgent,platform})=>({schema:validator.EVIDENCE_SCHEMA,generatedAt:"2026-09-28T20:00:00.000Z",appVersion:"1.9.1",runtimeRevision:runtime,acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,device:{userAgent,platform,maxTouchPoints:managerRole==="playerOne"?0:5,screenWidth:managerRole==="playerOne"?1366:430,screenHeight:managerRole==="playerOne"?768:932},deviceLabel,networkLabel,managerRole,remoteRole,accountFingerprint:fp(account),deviceFingerprint:fp(device),rivalryFingerprint:fp("c"),sessionFingerprints:[fp("d")],authorityViolation:false,canonicalStorageProofScope:"local-reconciliation-preview",canonicalStorageBeforeHash:fp("e"),canonicalStorageAfterHash:fp("e"),canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:true,onlineRecovered:true,reloadResumed:true,terminalReloadVerified:true,conflictGuardProven:true,startupCount:3,milestones:stages.map(([stage,phase,extra],index)=>({sequence:index+1,at:new Date(Date.UTC(2026,8,28,20,0,index)).toISOString(),stage,phase,online:stage!=="network-offline",...extra})),completed:true});
  const daniel=evidence({managerRole:"playerOne",remoteRole:"host",account:"1",device:"2",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",userAgent:"ChromeOS Chrome",platform:"Linux x86_64"});
  const nik=evidence({managerRole:"playerTwo",remoteRole:"peer",account:"3",device:"4",deviceLabel:"iPhone peer",networkLabel:"Cellular",userAgent:"iPhone Safari",platform:"iPhone"});
  const danielText=JSON.stringify(daniel,null,2),nikText=JSON.stringify(nik,null,2);
  const attestation=credit.draftAttestation({first:daniel,second:nik,firstText:danielText,secondText:nikText,runtimeRevision:runtime,runDate:"2026-09-28"});
  assert.deepEqual(attestation.exportHashes,credit.exportHashesFor(danielText,nikText));
  const template=JSON.parse(read("acceptance/SSJR2_OWNER_ATTESTATION_TEMPLATE.json"));
  assert.deepEqual(Object.keys(template),Object.keys(attestation),"template must carry exactly the validated fields");assert.equal(template.statement,credit.ATTESTATION_STATEMENT);assert.equal(template.schema,credit.ATTESTATION_SCHEMA);
  const empty={...ledger,currentScore:0,creditedCapabilityIds:[],events:[]};
  const assess=(overrides={})=>credit.evaluateRun({first:daniel,second:nik,firstText:danielText,secondText:nikText,attestation,model:v2,ledger:empty,runtimeRevision:runtime,repoRoot:root,...overrides});
  assert.throws(()=>credit.evaluateRun({first:daniel,second:nik,attestation,model:v2,ledger:empty,runtimeRevision:runtime,repoRoot:root}),/SSJR2_EXPORT_TEXT_REQUIRED/,"the exact export bytes are required");

  const ok=assess();
  assert.equal(ok.valid,true,JSON.stringify(ok.issues));
  const expected=["entry-binding","entry-before-draw","setup-league","setup-clubs","setup-length","setup-confirmation","career-start","transfer-challenge","results-publication","season-commit","canonical-scoring","history-convergence","journey-reconnect","journey-conflicts","local-reconciliation"];
  assert.deepEqual(ok.newlyCreditable.map(item=>item.id).sort(),[...expected].sort(),"a valid one-season run credits exactly the capabilities it proves");
  assert.equal(ok.scoreAfter,82,"a valid one-season run is worth exactly 82/100 under the unchanged SSJR weights");
  const blocked=new Map(ok.blocked.map(item=>[item.id,item.reasons.join("; ")]));
  assert.match(blocked.get("multi-season"),/at least 2 confirmed seasons/,"a one-season run cannot prove multi-season");
  for(const id of ["final-reconciliation","terminal-close","physical-journey","stable-journey-release"])assert.match(blocked.get(id),/depends on uncredited/,`${id} must stay blocked by its unchanged dependency`);
  assert.equal(ok.creditRecorded,false,"assessment alone never records credit");

  // r51: one validated 3-season run proves every capability; stable release still needs Nik's explicit acceptance.
  const seasonStages=["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged"];
  const planRun=(base,total)=>{const e=structuredClone(base),list=[];for(const item of e.milestones){if(seasonStages.includes(item.stage))continue;if(item.stage==="setup-confirmed")item.totalSeasons=total;if(item.stage==="final-season-reconciled")item.seasonNumber=total;list.push(item);if(item.stage==="career-start-ready"){for(let season=1;season<=total;season+=1)for(const stage of seasonStages)list.push({stage,phase:base.milestones.find(entry=>entry.stage===stage).phase,online:true,seasonNumber:season});list.push({stage:"showdown-complete",phase:"SHOWDOWN_COMPLETE",online:true,seasonNumber:total,totalSeasons:total});}}e.milestones=list.map((item,index)=>({...item,sequence:index+1,at:new Date(Date.UTC(2026,8,29,20,0,index)).toISOString()}));return e;};
  const daniel3=planRun(daniel,3),nik3=planRun(nik,3),daniel3Text=JSON.stringify(daniel3,null,2),nik3Text=JSON.stringify(nik3,null,2);
  const attestation3=credit.draftAttestation({first:daniel3,second:nik3,firstText:daniel3Text,secondText:nik3Text,runtimeRevision:runtime,runDate:"2026-09-29"});
  const full=assess({first:daniel3,second:nik3,firstText:daniel3Text,secondText:nik3Text,attestation:{...attestation3,stableReleaseAccepted:true}});
  assert.equal(full.valid,true,JSON.stringify(full.issues));assert.equal(full.scoreAfter,100,`a validated 3-season run with stable acceptance proves every capability: ${JSON.stringify(full.blocked)}`);assert.equal(full.blocked.length,0);
  const notStable=assess({first:daniel3,second:nik3,firstText:daniel3Text,secondText:nik3Text,attestation:attestation3});
  assert.equal(notStable.scoreAfter,98,"without Nik's stable-release acceptance only that 2-point capability stays blocked");assert.deepEqual(notStable.blocked.map(item=>item.id),["stable-journey-release"]);
  const oneDeviceComplete={...nik3,milestones:nik3.milestones.filter(item=>item.stage!=="showdown-complete")};const oneDeviceText=JSON.stringify(oneDeviceComplete);
  const partial=assess({first:daniel3,second:oneDeviceComplete,firstText:daniel3Text,secondText:oneDeviceText,attestation:credit.draftAttestation({first:daniel3,second:oneDeviceComplete,firstText:daniel3Text,secondText:oneDeviceText,runtimeRevision:runtime,runDate:"2026-09-29"})});
  assert.equal(partial.valid,false,"a 3-season export without the completed plan is not a valid pair");assert.equal(partial.scoreAfter,0);

  // Nothing is creditable without a valid pair and exact owner attestation.
  for(const [label,overrides,code] of [
    ["missing attestation",{attestation:null},"ATTESTATION_REQUIRED"],
    ["wrong owner",{attestation:{...attestation,owner:"Daniel"}},"ATTESTATION_OWNER_INVALID"],
    ["edited statement",{attestation:{...attestation,statement:"we played"}},"ATTESTATION_STATEMENT_INVALID"],
    ["wrong devices",{attestation:{...attestation,deviceLabels:["Chromebook host","Laptop"]}},"ATTESTATION_DEVICES_MISMATCH"],
    ["stale runtime",{attestation:{...attestation,runtimeRevision:"1.9.1-r6"}},"ATTESTATION_RUNTIME_MISMATCH"],
    ["extra field",{attestation:{...attestation,note:"x"}},"ATTESTATION_FIELDS_INVALID"],
    ["attestation replayed onto edited exports",{secondText:nikText+" "},"ATTESTATION_EXPORT_HASH_MISMATCH"],
    ["attestation without export hashes",{attestation:{...attestation,exportHashes:[]}},"ATTESTATION_EXPORT_HASH_MISMATCH"],
    ["same account twice",{second:{...nik,accountFingerprint:daniel.accountFingerprint}},"ACCOUNT_NOT_DISTINCT"],
    ["two tabs on one device",{second:{...nik,device:daniel.device}},"PHYSICAL_DEVICE_FACTS_NOT_DISTINCT"]
  ]){const result=assess(overrides);assert.equal(result.valid,false,label);assert.ok(result.issues.some(item=>item.code===code),`${label} must fail with ${code}: ${JSON.stringify(result.issues.map(i=>i.code))}`);assert.equal(result.newlyCreditable.length,0,`${label} must credit nothing`);assert.equal(result.scoreAfter,0);}

  // Recording requires a live verification of production main; flags or bare SHAs are not trusted.
  const sha="a".repeat(40),apiBase=`https://api.github.com/repos/${credit.REPOSITORY}`;
  const goodRuns=[...credit.REQUIRED_MAIN_CHECKS,"POS20 proof FULL"].map(name=>({name,status:"completed",conclusion:"success"}));
  const workflowText=read(".github/workflows/"+credit.RULES_WORKFLOW),oldSha="c".repeat(40);
  const fakeGitHub=({main=sha,runs=goodRuns,rules=[{id:77,head_sha:sha,conclusion:"success"}],swRuntime=runtime,compare={status:"ahead",files:[]}}={})=>({fetchJson:url=>{if(url===`${apiBase}/commits/main`)return {sha:main};if(url.startsWith(`${apiBase}/commits/${sha}/check-runs`))return {check_runs:runs};if(url.includes(`/actions/workflows/${credit.RULES_WORKFLOW}/runs`))return {workflow_runs:rules};if(url===`${apiBase}/compare/${oldSha}...${sha}`)return compare;throw new Error(`unexpected ${url}`);},fetchText:url=>{if(url===`${apiBase}/contents/.github/workflows/${credit.RULES_WORKFLOW}?ref=${sha}`)return workflowText;assert.equal(url,`${apiBase}/contents/service-worker.js?ref=${sha}`);return `const RUNTIME_REVISION = "${swRuntime}";`;}});
  const inputs=credit.rulesWorkflowInputs(workflowText);
  for(const file of ["firestore.spark.rules","scripts/build-production-firestore-rules.mjs","tests/contracts/shared-season-commit-rules-contracts.cjs","tests/contracts/persistent-nik-daniel-pair-contracts.cjs"])assert.ok(inputs.has(file),`Rules workflow input parsing must include ${file}`);
  const olderRules=[{id:79,head_sha:oldSha,conclusion:"success"}];
  assert.equal(credit.verifyAutomatedEvidence({mainSha:sha,runtimeRevision:runtime,...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:[{filename:"SSJR2_PHYSICAL_RUN_GUIDE.md"},{filename:"css/app.css"}]}})}).rulesDeploymentRunId,79,"an older Rules run stays valid when no Rules-suite input changed");
  const verification=credit.verifyAutomatedEvidence({mainSha:sha,runtimeRevision:runtime,...fakeGitHub()});
  assert.equal(verification.rulesDeploymentRunId,77);
  for(const [label,options,pattern] of [
    ["malformed sha",{mainSha:"abc"},/SSJR2_MAIN_SHA_REQUIRED/],
    ["sha is not live main",{...fakeGitHub({main:"b".repeat(40)})},/main is b{40}/],
    ["failed check on main",{...fakeGitHub({runs:[...goodRuns,{name:"POS20 proof FULL",status:"completed",conclusion:"failure"}]})},/POS20 proof FULL is completed\/failure/],
    ["missing required check",{...fakeGitHub({runs:goodRuns.filter(run=>run.name!=="deployed-site-smoke")})},/required check deployed-site-smoke/],
    ["failed Rules deployment",{...fakeGitHub({rules:[{id:78,head_sha:sha,conclusion:"failure"}]})},/Firestore Rules deployment did not succeed/],
    ["runtime drift",{...fakeGitHub({swRuntime:"1.9.1-r99"})},/runtime 1\.9\.1-r99 differs/],
    ["stale Rules run with changed provider emulator",{...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:[{filename:"tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs"}]}})},/Rules suite inputs changed/],
    ["stale Rules run with changed game module",{...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:[{filename:"js/sparkSharedSeasonCommit.js"}]}})},/Rules suite inputs changed/],
    ["stale Rules run with changed rules fragment",{...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:[{filename:"firestore.season-commit-production.fragment.rules"}]}})},/Rules suite inputs changed/],
    ["stale Rules run with changed rules contract",{...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:[{filename:"tests/contracts/shared-season-commit-rules-contracts.cjs"}]}})},/Rules suite inputs changed/],
    ["Rules run not an ancestor of main",{...fakeGitHub({rules:olderRules,compare:{status:"diverged",files:[]}})},/not an ancestor of main/],
    ["unprovable large diff",{...fakeGitHub({rules:olderRules,compare:{status:"ahead",files:Array.from({length:300},(_,i)=>({filename:`docs/${i}.md`}))}})},/too many files changed/]
  ])assert.throws(()=>credit.verifyAutomatedEvidence({mainSha:sha,runtimeRevision:runtime,...options}),pattern,label);
  const attestationText=JSON.stringify(attestation);
  assert.throws(()=>credit.recordRun({assessment:ok,attestationText,verification:null,ledger:empty}),/SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED/,"recording without live verification must fail");
  assert.throws(()=>credit.recordRun({assessment:ok,attestationText,verification:{...verification,runtimeRevision:"1.9.1-r6"},ledger:empty}),/SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED/);
  assert.throws(()=>credit.recordRun({assessment:assess({attestation:null}),attestationText:"null",verification,ledger:empty}),/SSJR2_RUN_INVALID/);
  const recorded=credit.recordRun({assessment:ok,attestationText,verification,ledger:empty,recordedAt:"2026-09-28T21:00:00.000Z"});
  assert.equal(recorded.currentScore,82);assert.deepEqual([...recorded.creditedCapabilityIds].sort(),[...expected].sort());assert.equal(recorded.events.length,1);
  assert.deepEqual(recorded.events[0].exportHashes,credit.exportHashesFor(danielText,nikText),"the credited pair is exactly the attested pair");
  assert.doesNotMatch(JSON.stringify(recorded),/pair_[a-f0-9]{64}|session_[a-f0-9]{64}|device_[a-f0-9]{32}/,"ledger must never contain raw private authority");
  assert.throws(()=>credit.recordRun({assessment:ok,attestationText,verification,ledger:recorded}),/SSJR2_RUN_ALREADY_RECORDED/);
  const again=credit.evaluateRun({first:daniel,second:nik,firstText:danielText,secondText:nikText,attestation,model:v2,ledger:recorded,runtimeRevision:runtime,repoRoot:root});
  assert.equal(again.newlyCreditable.length,0,"already-credited capabilities are never credited twice");assert.equal(again.scoreAfter,82);

  console.log(`PASS SSJR-2.1 physical-run credit contracts: SSJR-1.1 and SSJR-2.0 stay frozen, capabilities/weights/dependencies are unchanged, a validated two-device ${runtime} one-season run credits exactly 82/100 with multi-season and its dependents blocked, one validated 3-season run credits 100/100 (98 without Nik's stable-release acceptance), and invalid pairs, edited or replayed attestations, duplicates and unverified production mains credit nothing.`);
})().catch(error=>{console.error(error);process.exit(1);});
function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
