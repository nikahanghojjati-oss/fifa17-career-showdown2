const assert=require("node:assert/strict");
const fs=require("node:fs");

const ledger=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));
const agents=fs.readFileSync("AGENTS.md","utf8");
const provenance=fs.readFileSync("authority-history/REMOTE_JOINING_READINESS_MODEL_RJR1_2026-08-20.md","utf8");
const audit=fs.readFileSync("RJR_SCORE_PROVENANCE_AUDIT_81_77_78_2026-08-24.md","utf8");

assert.match(agents,/Remote Joining readiness:\s*~Y%/i,"The permanent eight-line owner report must retain the Remote Joining readiness label.");
assert.equal(ledger.metric,"Remote Joining readiness");
assert.equal(ledger.denominator,100);
assert.match(provenance,/machine-readable ledger:\s*`REMOTE_JOINING_READINESS\.json`/i);
assert.match(provenance,/does not freeze the current numeric score/i);
assert.match(provenance,/not PR completion[\s\S]+Handoff proximity/i,"RJR provenance must exclude both PR completion and Handoff proximity from the readiness denominator.");
assert.equal(ledger.currentScore,ledger.domains.reduce((sum,domain)=>sum+domain.earned,0));

assert.match(audit,/exact recoverable historical Remote Joining readiness report is `82\/100`, not `81\/100`/i,"The closed audit must preserve the recovered value without rewriting the owner's recollection.");
assert.match(audit,/2026-08-20T03:25:03Z[\s\S]+Remote Joining readiness: 82\/100/i,"The first exact recovered 82 status report must remain timestamped.");
assert.match(audit,/2026-08-20T03:25:23Z[\s\S]+high-weight[\s\S]+no denominator construction/i,"The repeated unsupported 82 explanation must remain timestamped and classified.");
assert.match(audit,/11\.5\s*\/\s*20\s*=\s*57\.5%[\s\S]+58%/i,"The contemporaneous end-to-end recalculation must remain reproducible.");
assert.match(audit,/non-comparable[\s\S]+ruler correction[\s\S]+not a legal RJR-1 score decrease/i,"The audit must distinguish a model correction from capability loss.");
assert.match(audit,/no exact `81\/100`, `~81%` or `81%`/i,"The exhaustive no-exact-81 result must remain explicit.");

function backcastDomainScores(domains,evidenceHistory){
  const scores=new Map(domains.map(domain=>[domain.id,domain.earned]));
  for(const event of [...evidenceHistory].reverse()){
    if(event.delta===0) continue;
    assert.ok(scores.has(event.domainId),`Cannot backcast unknown RJR domain ${event.domainId}.`);
    scores.set(event.domainId,scores.get(event.domainId)-event.delta);
  }
  return scores;
}
const baseline=backcastDomainScores(ledger.domains,ledger.evidenceHistory);
assert.deepEqual([...baseline.entries()],[
  ["deterministic-sync-recovery",20],
  ["identity-auth-trust",17],
  ["production-cloud-security",14],
  ["devices-pairing-connected-rivalry-remote-join",4],
  ["real-device-hardening-release",3]
],"Reversing append-only evidence deltas must reproduce the fixed 58-point RJR-1 baseline vector.");
assert.equal([...baseline.values()].reduce((sum,value)=>sum+value,0),58);
const negativeMovementBackcast=backcastDomainScores(
  [{id:"synthetic-domain",earned:9}],
  [{delta:0},{delta:2,domainId:"synthetic-domain"},{delta:-1,domainId:"synthetic-domain"}]
);
assert.equal(negativeMovementBackcast.get("synthetic-domain"),8,"Backcasting must reverse negative invalidation deltas as well as positive evidence deltas.");
assert.throws(
  ()=>backcastDomainScores([{id:"synthetic-domain",earned:9}],[{delta:-1}]),
  /unknown RJR domain undefined/,
  "Every nonzero RJR movement must identify the fixed domain it changes."
);
assert.match(audit,/Baseline backcast\s*\|\s*20\s*\|\s*17\s*\|\s*14\s*\|\s*4\s*\|\s*3\s*\|\s*58/i,"The published audit must expose the reconstructed five-domain baseline.");
assert.match(audit,/Official RJR-1 remains `78\/100`[\s\S]+`20 \+ 18 \+ 18 \+ 17 \+ 5`/i,"The audit must preserve the current fixed-model numerical authority.");

process.stdout.write(`PASS owner reporting, recovered pre-RJR 82 to RJR-1 58 backcast and evidence-based current ${ledger.currentScore}/100 authority\n`);
