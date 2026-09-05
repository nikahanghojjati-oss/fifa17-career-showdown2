const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

(async () => {
  const {assessSharedShowdown} = await import("../../scripts/assess-shared-showdown-readiness.mjs");
  const model = read("SHARED_SHOWDOWN_JOURNEY_MODEL.json");
  const ledger = read("SHARED_SHOWDOWN_JOURNEY_READINESS.json");
  const rjr = read("REMOTE_JOINING_READINESS.json");
  assert.equal(assessSharedShowdown(model, ledger, rjr).score, ledger.currentScore);
  const changed = clone(model); changed.domains[0].weight++;
  assert.throws(() => assessSharedShowdown(changed, ledger, rjr), /Frozen SSJR-1/);
  const newBaseline = clone(ledger); newBaseline.baseline.score = 100;
  assert.throws(() => assessSharedShowdown(model, newBaseline, rjr), /one-time/);
  assert.throws(() => assessSharedShowdown(model, ledger, {...rjr, currentScore:99}), /prerequisite/);
  const inflated = clone(ledger); inflated.currentScore++;
  assert.throws(() => assessSharedShowdown(model, inflated, rjr), /Stored SSJR score/);

  // Synthetic records validate bookkeeping, not real production acceptance.
  const synthetic = {...clone(ledger), currentScore:0, evidenceBundles:[], events:[]};
  const capabilities = model.domains.flatMap(domain => domain.capabilities);
  const remaining = new Set(capabilities.map(capability => capability.id));
  function credit(capability, suffix = ""){
    const evidenceId = `synthetic-${capability.id}${suffix}`;
    synthetic.evidenceBundles.push({id:evidenceId, sourceSha:"0".repeat(40), runtimeRevision:"1.9.1-r2", references:["synthetic fixture only"], capabilityIds:[capability.id], layers:[...capability.requiredEvidenceLayers], finding:"Synthetic capability fixture"});
    synthetic.events.push({id:`credit-${capability.id}${suffix}`, kind:"credit", capabilityId:capability.id, evidenceId, delta:capability.weight});
    synthetic.currentScore += capability.weight; remaining.delete(capability.id);
    synthetic.remainingCapabilityIds = [...remaining];
  }
  credit(capabilities[0]);
  assert.equal(assessSharedShowdown(model, synthetic, rjr).score, 5);
  const sourceOnly = clone(synthetic); sourceOnly.evidenceBundles[0].layers = ["deterministic-behavior"];
  assert.throws(() => assessSharedShowdown(model, sourceOnly, rjr), /missing a required proof layer/);
  const missingReferences = clone(synthetic); missingReferences.evidenceBundles[0].references = [];
  assert.throws(() => assessSharedShowdown(model, missingReferences, rjr), /reviewable references/);
  const duplicate = clone(synthetic); duplicate.events.push({...duplicate.events[0],id:"other-event"});
  assert.throws(() => assessSharedShowdown(model, duplicate, rjr), /Consumed evidence/);
  const doubleCredit = clone(synthetic);
  doubleCredit.evidenceBundles.push({...doubleCredit.evidenceBundles[0], id:"another-bundle"});
  doubleCredit.events.push({...doubleCredit.events[0], id:"another-event", evidenceId:"another-bundle"});
  assert.throws(() => assessSharedShowdown(model, doubleCredit, rjr), /already credited/);
  const premature = clone(synthetic);
  premature.events[0].capabilityId = "setup-clubs"; premature.evidenceBundles[0].capabilityIds = ["setup-clubs"];
  assert.throws(() => assessSharedShowdown(model, premature, rjr), /dependency/);
  for(const capability of capabilities.slice(1)) credit(capability);
  assert.equal(assessSharedShowdown(model, synthetic, rjr).score, 100);
  synthetic.evidenceBundles.push({id:"regression", sourceSha:"1".repeat(40), runtimeRevision:"1.9.1-r2", references:["synthetic regression"], capabilityIds:["entry-binding"], layers:["regression-reproduction"], finding:"Reproduced wrong-rivalry acceptance"});
  synthetic.events.push({id:"invalidate-entry", kind:"invalidate", capabilityId:"entry-binding", evidenceId:"regression", delta:-100});
  synthetic.currentScore = 0; synthetic.remainingCapabilityIds = capabilities.map(capability => capability.id);
  assert.equal(assessSharedShowdown(model, synthetic, rjr).score, 0, "A proven entry regression invalidates all dependent credit without denominator drift.");
  synthetic.events.push({id:"reuse-old-proof", kind:"credit", capabilityId:"entry-binding", evidenceId:"synthetic-entry-binding", delta:5});
  assert.throws(() => assessSharedShowdown(model, synthetic, rjr), /Consumed evidence/);
  for(const file of [ledger.baseline.evidenceRecord, "SHARED_SHOWDOWN_JOURNEY_MODEL.json"]) assert.ok(fs.existsSync(file));
  assert.equal(model.processMap.states[0], "PROFILE_A + PROFILE_B");
  assert.equal(model.processMap.states.at(-1), "NO_RESURRECTION");
  assert.deepEqual(model.permanentLocks.canonicalLocalStorage, ["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
  assert.equal(model.permanentLocks.billingEnabled, false);
  assert.equal(model.permanentLocks.firebasePlan, "Spark");
  console.log(`PASS frozen SSJR-1 model, one-time baseline, evidence-only credits, anti-double-counting and transitive regression invalidation; current ${ledger.currentScore}/100.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
