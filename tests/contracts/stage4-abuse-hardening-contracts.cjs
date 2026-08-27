const assert=require("node:assert/strict");
const fs=require("node:fs");

const rules=fs.readFileSync("firestore.spark.rules","utf8");
const emulator=fs.readFileSync("tests/firebase/stage4-abuse-hardening-emulator.cjs","utf8");
const workflow=fs.readFileSync(".github/workflows/validate-stage3-private-pairing.yml","utf8");

assert.match(rules,/managerBindings\.size\(\) == 2/i,"Shared-state authority must remain exactly two-manager scoped.");
assert.match(rules,/seasonIds\.size\(\) <= 10/i,"Shared-state authority must retain the declared ten-season resource bound.");
assert.match(rules,/payload\.rounds is list[\s\S]+payload\.rounds\.size\(\) == stateData\.seasonIds\.size\(\)[\s\S]+payload\.rounds\.size\(\) <= 10/i,"Provider Rules must bind the real payload rounds to the declared seasonIds count and exact ten-season ceiling.");
assert.match(rules,/allow list, delete:\s*if false/i,"Private rivalry/shared-state collections must remain non-enumerable and non-deletable from the browser client.");
assert.match(rules,/expiresAt <= request\.time \+ duration\.value\(30, 'm'\)/i,"Pairing capability lifetime must remain provider-time bounded.");

assert.match(emulator,/assertFails\(getDocs\(collection\(dbA,"rivalries"\)\)\)/,"Abuse proof must exercise authenticated rivalry enumeration denial.");
assert.match(emulator,/trackedSaveRuntime\(aBinding,"oversized-create",11\)/,"Abuse proof must exercise an oversized authorized create.");
assert.match(emulator,/trackedSaveRuntime\(aBinding,"max-ten",10\)/,"Abuse proof must preserve the exact legitimate ten-season boundary.");
assert.match(emulator,/forgedRawKey="stage4-abuse-forged-hidden-eleventh-round"[\s\S]+seasonIds:\[\.\.\.acceptedState\.data\.seasonIds\][\s\S]+roundNumber:11[\s\S]+writeBatch\(dbA\)[\s\S]+assertFails\(forgedBatch\.commit\(\)\)/i,"Abuse proof must independently forge a state/receipt batch with ten declared seasonIds but an eleventh hidden payload round and require provider denial.");
assert.match(emulator,/trackedSaveRuntime\(bBinding,"oversized-update",11\)/,"Abuse proof must exercise an oversized authorized update from the peer manager.");
assert.match(emulator,/allocate no idempotency receipt|no additional idempotency receipt/i,"Abuse proof must protect receipt allocation from rejected oversized writes.");
assert.match(emulator,/must not mutate canonical local saves|does not mutate canonical local saves/i,"Abuse proof must protect local-first recovery authority.");
assert.match(workflow,/stage4-abuse-hardening-emulator\.cjs/i,"The permanent Stage 3/4 workflow must execute structural abuse hardening proof.");

process.stdout.write("PASS Stage 4 structural abuse-hardening contract: provider Rules retain non-enumerability, exact two-manager bounds, declared/payload ten-season coherence, pairing TTL limits, and permanent forged-write emulator proof wiring\n");
