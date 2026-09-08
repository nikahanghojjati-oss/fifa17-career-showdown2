const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const {pathToFileURL}=require("node:url");
(async()=>{
  const session=await import(pathToFileURL("scripts/pos5-session-control.mjs"));
  const relay=await import(pathToFileURL("scripts/build-developer-relay.mjs"));
  const beacon=await import(pathToFileURL("scripts/build-recovery-beacon.mjs"));

  const clean=session.emptySignals();
  let r=session.assessRelay(clean);
  assert.equal(r.status,"CONTINUE");
  assert.equal(r.crashLossBudget,"1_AWU");

  r=session.assessRelay({...clean,uncheckpointedAtomicUnits:2});
  assert.equal(r.status,"RELAY_NOW");
  assert.match(r.reason,/CLB-1/);

  r=session.assessRelay({...clean,ownerReportedUsageWarning:true,atomicOperation:true});
  assert.equal(r.status,"RELAY_AFTER_ATOMIC");

  const high=session.computeDebugBudget({...clean,failureClass:"PROCESS_DRIFT"});
  const low=session.computeDebugBudget({...clean,failureClass:"PRODUCT_DEFECT",unresolvedFailureFamilies:4,unresolvedStates:4,contextDamageEvents:2,hardStateReconstruction:true,activeMutationLanes:2});
  assert.ok(high>low);
  assert.ok(high<=20&&low>=3);

  const drf=relay.buildDeveloperRelay({repository:"owner/repo",branch:"feature/x",pr:216,head:"abc",lane:"POS5",atomicWorkUnit:"AWU",lastSafeCheckpoint:"commit",validationSummary:"targeted green",unresolvedFailureClasses:["TEST_DEFECT"],nextAction:"reverify live head",relayReason:"usage warning"});
  assert.ok(Buffer.byteLength(drf,"utf8")<=relay.maxBytes);
  assert.match(drf,/Live verification first/);
  assert.doesNotMatch(drf,/START_NEXT_SESSION|SUCCESSOR_HANDOFF/);

  const beaconInput={repository:"owner/repo",branch:"feature/x",pr:216,head:"abc",lane:"POS5",atomicWorkUnit:"AWU",blockerClass:"TEST_DEFECT",lastSafeCheckpoint:"commit",nextAction:"reverify",validationSummary:"green",updatedAt:"2026-09-08T01:54:00Z"};
  const b=beacon.buildRecoveryBeacon(beaconInput);
  assert.match(b,/POS5_RB2/);
  assert.ok(Buffer.byteLength(b,"utf8")<=beacon.maxBytes);
  const twice=beacon.upsertRecoveryBeacon(beacon.upsertRecoveryBeacon("body",b),b);
  assert.equal((twice.match(/POS5_RB2/g)||[]).length,2,"one RB-2 block should contain exactly opening and closing markers after idempotent upsert");
  assert.throws(()=>beacon.buildRecoveryBeacon({...beaconInput,lane:"x".repeat(beacon.maxBytes)}),/RB-2 exceeds/);

  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"pos5-rb2-"));
  try{
    const inputPath=path.join(dir,"input.json"),bodyPath=path.join(dir,"body.md"),outPath=path.join(dir,"out.md");
    fs.writeFileSync(inputPath,JSON.stringify(beaconInput));
    fs.writeFileSync(bodyPath,"PR body\n");
    const cli=spawnSync(process.execPath,["scripts/build-recovery-beacon.mjs",inputPath,"--body",bodyPath,"--out",outPath],{encoding:"utf8"});
    assert.equal(cli.status,0,cli.stderr);
    const rendered=fs.readFileSync(outPath,"utf8");
    assert.match(rendered,/PR body/);
    assert.equal((rendered.match(/POS5_RB2/g)||[]).length,2,"CLI must emit one idempotent RB-2 block in an upsert-ready PR body payload.");
    assert.equal(fs.readFileSync(bodyPath,"utf8"),"PR body\n","CLI must not mutate the source PR-body snapshot.");
  }finally{fs.rmSync(dir,{recursive:true,force:true});}

  console.log("PASS POS5 session operations: one-AWU crash-loss budget, adaptive debugging, bounded non-mutating RB-2 CLI and bounded DRF-1 relay file.");
})().catch(e=>{console.error(e);process.exitCode=1;});
