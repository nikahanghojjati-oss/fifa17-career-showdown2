const assert=require("node:assert/strict");
const fs=require("node:fs");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json","utf8"));
const risk=JSON.parse(fs.readFileSync("POS6_RISK_MAP.json","utf8"));
const continuity=JSON.parse(fs.readFileSync("POS6_CONTINUITY_MODEL.json","utf8"));
const requiredFiles=[
  "PROJECT_OPERATING_SYSTEM_V6.md",
  "PROJECT_OPERATING_SYSTEM_V6.json",
  "scripts/pos6-continuity.mjs",
  "scripts/pos6-risk-router.mjs",
  ".github/workflows/validate-pos6-race.yml"
];
for(const file of requiredFiles)assert.ok(fs.existsSync(file),`Missing POS6 authority: ${file}`);
assert.equal(pkg.scripts["test:contracts"],"node tests/support/run-current-product-contracts.cjs");
assert.equal(pkg.scripts["work:transition"],"node scripts/pos6-continuity.mjs");
assert.equal(pkg.scripts["work:route"],"node scripts/pos6-risk-router.mjs");
const retiredCommands=[
  "work:assess","work:handoff","work:health","work:handoff-checklist","work:proximity",
  "work:transfer-readiness","work:next-prompt","work:continuity:validate","work:resume-capsule",
  "test:handoff-preflight","work:recovery-beacon"
];
for(const name of retiredCommands)assert.ok(!(name in pkg.scripts),`Retired command remains active: ${name}`);
assert.equal(manifest.operatingSystem,"POS-6");
assert.equal(manifest.automaticOwner,"tests/support/run-current-product-contracts.cjs");
assert.equal(new Set(manifest.tests).size,manifest.tests.length);
for(const test of [
  "tests/contracts/static-app-release-contracts.cjs",
  "tests/contracts/shared-showdown-production-runtime-contracts.cjs",
  "tests/contracts/shared-showdown-host-peer-ui-contracts.cjs",
  "tests/contracts/shared-showdown-polished-presentation-contracts.cjs",
  "tests/contracts/milestone-delivery-progress-contracts.cjs",
  "tests/contracts/shared-showdown-dual-full-screen-contracts.cjs",
  "tests/contracts/ssjr-production-shared-setup-evidence-recorder-contracts.cjs",
  "tests/contracts/ssjr-production-storage-observation-contracts.cjs",
  "tests/contracts/stage5g-remote-joining-reconnect-contracts.cjs"
])assert.ok(manifest.tests.includes(test),`POS6 deterministic owner missing current contract: ${test}`);
assert.equal(risk.model,"RACE-6");
assert.equal(risk.orchestrator,".github/workflows/validate-pos6-race.yml");
assert.ok(risk.accurateEscalation.includes("unknown-non-document-change"));
assert.ok(risk.accurateEscalation.includes("missing-changed-file-evidence"));
assert.equal(continuity.model,"CWS-6");
const orchestrator=fs.readFileSync(risk.orchestrator,"utf8");
assert.ok(orchestrator.includes("node scripts/pos6-risk-router.mjs"),"POS6 orchestrator must execute machine RACE-6 authority.");
assert.ok(orchestrator.includes("POS6 Accurate Summary"),"POS6 orchestrator must expose one stable final summary job.");
assert.ok(orchestrator.includes("needs.route.outputs.run_remote_emulator == 'true'"),"Remote emulator proof must be routed rather than unconditional.");
assert.ok(orchestrator.includes("needs.route.outputs.run_storage_browser == 'true'"),"Storage browser proof must be routed rather than unconditional.");
assert.ok(orchestrator.includes("needs.route.outputs.run_visual_browser == 'true'"),"Visual browser proof must be routed rather than unconditional.");
console.log(`PASS POS6 authority: lean command surface, one ${manifest.tests.length}-contract automatic product owner, routed RACE-6 CI, CWS-6 continuity.`);
