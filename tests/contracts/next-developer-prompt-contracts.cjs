const assert=require("node:assert/strict");
const fs=require("node:fs");

const golden=fs.readFileSync("00_HANDOFF_GOLDEN_RULE.md","utf8");

assert.match(golden,/Mandatory repository-first next-developer copy-paste prompt/i);
assert.match(golden,/live repository/i);
assert.match(golden,/START_NEXT_SESSION_/i);
assert.match(golden,/independently verify/i);
assert.match(golden,/fresh WEC/i);
assert.match(golden,/handoff as orientation/i);
assert.match(golden,/current source[\s\S]{0,120}live GitHub/i);
assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(golden,/must not substitute[\s\S]{0,180}SLE/i);
assert.match(golden,/recursive and permanent/i);

process.stdout.write("PASS next-developer prompt: every future handoff must give the owner a compact repository-first, independently verified successor prompt.\n");
