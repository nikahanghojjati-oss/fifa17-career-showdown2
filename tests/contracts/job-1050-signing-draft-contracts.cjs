"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.resolve(__dirname, "../../js/productionSharedTransferChallenge.js"), "utf8");
let checks = 0;
function check(id, label, fn) {
  fn();
  checks += 1;
  process.stdout.write(`ok ${checks} ${id} ${label}\n`);
}

check("D1", "draft keys are scoped to rivalry, season, and manager role", () => {
  assert.match(source, /cms\\.signingDraft\\.v1:\\$\\{request\\.rivalryId\\}:\\$\\{request\\.seasonNumber\\}:\\$\\{role\\}/);
});
check("D2", "the same context restores locally saved rows only during unlocked Signing Entry", () => {
  assert.match(source, /function pstcRestoreSigningDraft\\(role,own\\)/);
  assert.match(source, /actualPhase===\"SIGNING_ENTRY\"&&!isReplay&&!state\\?\\.signingLockedRoles\\?\\.includes\\(role\\)\\)pstcRestoreSigningDraft\\(role,own\\)/);
  assert.match(source, /draft\\.rivalryId!==request\\.rivalryId\\|\\|Number\\(draft\\.seasonNumber\\)!==request\\.seasonNumber\\|\\|draft\\.role!==role/);
});
check("D3", "locking signings clears the manager's draft and locked shared rows cannot restore it", () => {
  assert.match(source, /method===\"lockSignings\"\\)pstcClearSigningDraft\\(view\\.managerRole\\)/);
  assert.match(source, /state\\.signingLockedRoles\\?\\.includes\\(role\\)\\|\\|shared\\.length/);
});
check("D4", "typing saves only this manager's signing fields on this device", () => {
  assert.match(source, /function pstcSaveSigningDraft\\(role\\)/);
  assert.match(source, /view\\.managerRole!==role/);
  assert.match(source, /const prefix=pstcRolePrefix\\(role\\),rows=\\[\\]/);
  assert.match(source, /root\\.localStorage\\.setItem\\(key,JSON\\.stringify/);
  assert.equal(source.includes("sessionStorage"), false);
});
check("D5", "a rivalry, season, or role context change removes the previous local draft", () => {
  assert.match(source, /signingDraftKey&&draftKey&&signingDraftKey!==draftKey\\)pstcRemoveSigningDraft\\(signingDraftKey\\)/);
});
console.log(`PASS JOB-1050 signing draft contracts: ${checks} checks.`);
