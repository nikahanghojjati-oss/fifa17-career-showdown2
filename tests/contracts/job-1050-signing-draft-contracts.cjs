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
  assert.ok(source.includes("cms.signingDraft.v1:" + "${request.rivalryId}:${request.seasonNumber}:${role}"));
});
check("D2", "the same context restores locally saved rows only during unlocked Signing Entry", () => {
  assert.ok(source.includes("function pstcRestoreSigningDraft(role,own)"));
  assert.ok(source.includes('actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own)'));
  assert.ok(source.includes("draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role"));
});
check("D3", "locking signings clears the manager's draft and locked shared rows cannot restore it", () => {
  assert.ok(source.includes('method==="lockSignings")pstcClearSigningDraft(view.managerRole)'));
  assert.ok(source.includes("state.signingLockedRoles?.includes(role)||shared.length"));
});
check("D4", "typing saves only this manager's signing fields on this device, through the storage.js helpers", () => {
  assert.ok(source.includes("function pstcSaveSigningDraft(role)"));
  assert.ok(source.includes("view.managerRole!==role"));
  assert.ok(source.includes("const prefix=pstcRolePrefix(role),rows=[]"));
  assert.ok(source.includes("root.writeStorageValue(key,JSON.stringify"));
  assert.ok(source.includes("root.readStorageValue(key)"));
  assert.ok(source.includes("root.removeStorageValue(key)"));
  assert.equal(source.includes("sessionStorage"), false);
  assert.equal(/\blocalStorage\b/.test(source), false, "drafts go through the js/storage.js helpers, never localStorage directly");
});
check("D5", "a rivalry, season, or role context change removes the previous local draft", () => {
  assert.ok(source.includes("signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey)"));
});
console.log(`PASS JOB-1050 signing draft contracts: ${checks} checks.`);
