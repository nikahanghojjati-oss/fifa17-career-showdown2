const assert=require("node:assert/strict");
const fs=require("node:fs");

const proof=fs.readFileSync("V1.9.1_R2_PRODUCTION_PROOF.md","utf8");
const release=fs.readFileSync("RELEASE_V1.9.1_R2.md","utf8");
const handoff=fs.readFileSync("CAREER_MODE_SHOWDOWN_V1.9.1_R2_MAINTENANCE_HANDOFF.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");

assert.match(proof,/Status:\s*PASS\s*\/\s*DEPLOYED\s*\/\s*PRODUCTION-PROVEN/i);
assert.match(proof,/42f91df5ec1d5a576f0907836fa03f5994d7646b/i);
assert.match(proof,/11bb681527a9b78884baf0c384350c90493dc9bd/i);
assert.match(proof,/all 15 permanent pull-request workflow families/i);
assert.match(proof,/15 permanent workflow runs[\s\S]+all completed successfully/i);
assert.match(proof,/91\/100/i);
assert.match(proof,/Billing must never be activated/i);
assert.match(proof,/Firebase remains Spark/i);
assert.match(release,/Status:\s*DEPLOYED\s*\/\s*PRODUCTION-PROVEN/i);
assert.match(handoff,/Status:\s*DEPLOYED\s*\/\s*PRODUCTION-PROVEN/i);
assert.match(next,/every current permanent workflow family green on the same exact reviewed PR head/i);
assert.match(next,/final stable Remote Joining release acceptance/i);
assert.match(next,/Billing must never be activated[\s\S]{0,120}Firebase remains Spark/i);

process.stdout.write("PASS r2 production proof publication: canonical PR194/r2 production identity, exact-head/main evidence, RJR91 and permanent zero-billing locks are sealed.\n");
