const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const golden = read('00_OWNER_DOWNLOADABLE_SNS_GOLDEN_RULE.md');
const start = read('00_DEVELOPER_START_HERE.md');
const prompt = read('NEXT_CHAT_HANDOFF_PROMPT.md');
const currentSns = read('owner-sns/OWNER_SNS_V1.4.57_PR215_ANTI_SPIRAL_SAFE_TRANSFER.md');

assert.match(golden, /Once a Work Environment transition decision has been made[\s\S]+must always generate an owner-facing SNS copy/i);
assert.match(golden, /directly downloadable copy/i);
assert.match(golden, /transition is not owner-complete/i);
assert.match(golden, /HANDOFF_AT_CHECKPOINT/);
assert.match(golden, /HANDOFF_NOW/);
assert.match(golden, /FINISH_SAFE_BOUNDARY/);
assert.match(golden, /GENERATE_FULL_SNS_NOW/);
assert.match(golden, /never combine|combining CI across heads/i);
assert.match(golden, /recursive/i);
assert.match(golden, /owner-sns|OWNER_SNS_/i);

assert.match(start, /00_OWNER_DOWNLOADABLE_SNS_GOLDEN_RULE\.md/);
assert.match(start, /Current owner SNS copy:/i);
assert.match(start, /transition is not owner-complete/i);
assert.match(start, /owner-sns\/OWNER_SNS_V1\.4\.57_PR215_ANTI_SPIRAL_SAFE_TRANSFER\.md/);

assert.match(currentSns, /START_NEXT_SESSION_V1\.4\.57_PR215_ANTI_SPIRAL_SAFE_TRANSFER_NEXT\.md/);
assert.match(currentSns, /we-2026-09-07-pr215-r6-publication-a59/);
assert.match(currentSns, /fc129cf8ee5066ac7dc82cc94a5cbecc25a8686c/);
assert.match(currentSns, /Billing permanently OFF|Billing must remain permanently OFF/i);
assert.match(currentSns, /Firebase Spark/i);
assert.match(currentSns, /RJR-1:\s*`100\/100`/i);
assert.match(currentSns, /SSJR-1\.1:\s*`0\/100`/i);
assert.match(currentSns, /MDP-1:\s*`39\.00\/100`/i);

assert.match(prompt, /START_NEXT_SESSION_V1\.4\.57_PR215_ANTI_SPIRAL_SAFE_TRANSFER_NEXT\.md/);
assert.match(prompt, /we-2026-09-07-pr215-r6-publication-a59/);

process.stdout.write('PASS owner-downloadable SNS golden rule: transition decisions require a fresh durable owner SNS artifact plus direct downloadable delivery when supported, recursively preserved through bootstrap.\n');
