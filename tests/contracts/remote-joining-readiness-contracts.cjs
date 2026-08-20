const assert=require("node:assert/strict");
const fs=require("node:fs");

const ledger=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));

assert.equal(ledger.schemaVersion,1);
assert.equal(ledger.modelVersion,"RJR-1");
assert.equal(ledger.metric,"Remote Joining readiness");
assert.equal(ledger.denominator,100);
assert.ok(Array.isArray(ledger.domains)&&ledger.domains.length===5);

const expectedWeights=new Map([
  ["deterministic-sync-recovery",20],
  ["identity-auth-trust",20],
  ["production-cloud-security",20],
  ["devices-pairing-connected-rivalry-remote-join",30],
  ["real-device-hardening-release",10]
]);

assert.equal(new Set(ledger.domains.map(domain=>domain.id)).size,ledger.domains.length,"RJR domains must have unique stable IDs.");
for(const domain of ledger.domains){
  assert.equal(domain.weight,expectedWeights.get(domain.id),`Unexpected RJR-1 weight for ${domain.id}.`);
  assert.ok(Number.isFinite(domain.earned)&&domain.earned>=0&&domain.earned<=domain.weight,`${domain.id} earned score must stay within its fixed weight.`);
  assert.ok(Array.isArray(domain.evidence)&&domain.evidence.length>0,`${domain.id} must preserve evidence for credited readiness.`);
}
assert.equal(ledger.domains.reduce((sum,domain)=>sum+domain.weight,0),ledger.denominator,"RJR fixed domain weights must sum to the 100-point denominator.");
const calculatedScore=ledger.domains.reduce((sum,domain)=>sum+domain.earned,0);
assert.equal(ledger.currentScore,calculatedScore,"RJR currentScore must be calculated from the fixed capability ledger, never guessed independently.");

assert.ok(ledger.measurementPolicy&&typeof ledger.measurementPolicy==="object");
assert.match(ledger.measurementPolicy.meaning,/end-to-end readiness/i);
assert.match(ledger.measurementPolicy.increaseRule,/verified evidence[\s\S]+fixed capability domain/i);
assert.match(ledger.measurementPolicy.decreaseRule,/invalidated|regression/i);
assert.match(ledger.measurementPolicy.modelChangeRule,/new modelVersion[\s\S]+backcast/i);
assert.match(ledger.measurementPolicy.reportingRule,/every substantive owner-facing development checkpoint/i);
for(const forbiddenDenominator of ["pull-request count","roadmap stage count","handoff proximity","number of visible owner actions"]){
  assert.ok(ledger.measurementPolicy.notMeasuredBy.includes(forbiddenDenominator),`RJR must explicitly reject ${forbiddenDenominator} as a denominator.`);
}

assert.ok(Array.isArray(ledger.evidenceHistory)&&ledger.evidenceHistory.length>0,"RJR must preserve append-only score evidence history.");
let previous=null;
for(const entry of ledger.evidenceHistory){
  assert.ok(entry&&typeof entry==="object");
  assert.ok(!Number.isNaN(Date.parse(entry.recordedAt)),"Every RJR evidence event needs an ISO timestamp.");
  assert.ok(typeof entry.eventId==="string"&&entry.eventId.trim());
  assert.ok(Number.isFinite(entry.score)&&entry.score>=0&&entry.score<=ledger.denominator);
  assert.ok(Number.isFinite(entry.delta));
  assert.ok(typeof entry.reason==="string"&&entry.reason.trim());
  if(previous){
    assert.ok(Date.parse(entry.recordedAt)>=Date.parse(previous.recordedAt),"RJR evidence history must remain chronological.");
    assert.equal(entry.score-previous.score,entry.delta,"Every RJR score movement must explain its exact delta.");
    if(entry.delta>0){
      assert.ok(expectedWeights.has(entry.domainId),"Positive RJR movement must identify the fixed capability domain improved by evidence.");
    }
    if(entry.delta<0){
      assert.equal(entry.invalidation,true,"RJR may decrease only when credited evidence is explicitly invalidated by a proven regression or contradiction.");
    }
  }
  previous=entry;
}
assert.equal(ledger.evidenceHistory.at(-1).score,ledger.currentScore,"Latest RJR evidence event must equal the calculated current score.");

process.stdout.write(`PASS RJR fixed 100-point capability denominator, calculated score ${ledger.currentScore}, evidence-gated movement and denominator-drift protection\n`);
