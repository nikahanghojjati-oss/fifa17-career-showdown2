const assert=require("node:assert/strict");
const fs=require("node:fs");

const ledger=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));
const agents=fs.readFileSync("AGENTS.md","utf8");
const provenance=fs.readFileSync("authority-history/REMOTE_JOINING_READINESS_MODEL_RJR1_2026-08-20.md","utf8");

assert.match(agents,/Remote Joining readiness:\s*~Y%/i,"The permanent seven-line owner report must retain the Remote Joining readiness label.");
assert.equal(ledger.metric,"Remote Joining readiness");
assert.equal(ledger.denominator,100);
assert.match(provenance,/machine-readable ledger:\s*`REMOTE_JOINING_READINESS\.json`/i);
assert.match(provenance,/does not freeze the current numeric score/i);
assert.match(provenance,/not PR completion[\s\S]+not[\s\S]+Handoff proximity/i);
assert.equal(ledger.currentScore,ledger.domains.reduce((sum,domain)=>sum+domain.earned,0));

process.stdout.write(`PASS owner reporting label remains stable while REMOTE_JOINING_READINESS.json owns evidence-based RJR-${ledger.modelVersion.replace(/^RJR-/,"")} calculation\n`);
