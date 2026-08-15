const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const start = read("00_DEVELOPER_START_HERE.md");
const current = read("00_CURRENT_HANDOFF.md");
const active = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const next = read("NEXT_TASK.md");

assert.match(
  golden,
  /Mandatory immediate-next-task handoff rule/i,
  "Golden handoff policy must permanently require an explicit immediate-next-task section."
);
assert.match(
  golden,
  /IMMEDIATE NEXT TASK AFTER FULL STUDY/i,
  "Golden handoff policy must name the required post-study immediate-task section."
);
assert.match(
  golden,
  /bootstrap\/study[\s\S]+execution/i,
  "Golden handoff policy must distinguish repository study from the concrete execution task that follows it."
);
assert.match(
  golden,
  /specific enough[\s\S]+start work without asking the owner what to do next/i,
  "Golden handoff policy must require enough specificity for a fresh developer to begin independently."
);
assert.match(
  golden,
  /Do not substitute vague instructions/i,
  "Golden handoff policy must prohibit vague roadmap-only continuation language."
);
assert.match(
  golden,
  /recursive and permanent/i,
  "Immediate-next-task handoff behavior must remain recursive across future developer sessions."
);

for(const [name,text] of [
  ["00_DEVELOPER_START_HERE.md", start],
  ["00_CURRENT_HANDOFF.md", current],
  ["IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md", active],
  ["NEXT_TASK.md", next]
]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary after the Analytics promotion.`);
}

assert.match(
  active,
  /FIRST ENGINEERING TASK: preserve the sealed production boundary/i,
  "Closed Analytics handoff must advance its first engineering task from PR validation to preserving the proven production boundary."
);
assert.match(
  active,
  /PR #59 is no longer an implementation task[\s\S]+production-proven/i,
  "Closed Analytics handoff must distinguish completed production work from future implementation authorization."
);
assert.match(
  active,
  /Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i,
  "Closed Analytics handoff must retain the final Trophy Room failure classification rather than erasing the validation history."
);
assert.match(
  active,
  /a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1[\s\S]+All 13 normal pull-request workflow families passed/i,
  "Closed Analytics handoff must retain exact-head PR proof."
);
assert.match(
  active,
  /c5c7d50cc3a2d9003e057d1813744c877323c068[\s\S]+deployed-site-smoke job `94855938131`/i,
  "Closed Analytics handoff must retain exact runtime merge and deployed proof."
);
assert.match(
  current,
  /PR #57[\s\S]+PR #58[\s\S]+PR #59/i,
  "Current rolling handoff must preserve prior manager-identity authority history while folding in Analytics promotion."
);
assert.match(
  current,
  /Failure 7[\s\S]+offscreen Trophy cabinet rendered-text assertion/i,
  "Current rolling handoff must preserve the exact final Analytics failure class."
);
assert.match(
  current,
  /PR #61 exact validation, merge and production proof[\s\S]+67095a02188ebd246da0d0f2cd61158b8e9e504e[\s\S]+deployed-site-smoke job `95036682319`/i,
  "Current rolling handoff must retain exact PR #61 merge and deployed proof."
);
assert.match(
  next,
  /Local Profile display-label candidate is closed as production-proven/i,
  "NEXT_TASK must close the one later-authorized candidate after production proof."
);
assert.match(
  next,
  /PR #65 historical head `978fa967517207733cc84c7e6dd6e778b5770723`[\s\S]+reconcile it before any promotion/i,
  "NEXT_TASK must make PR #65 reconciliation the exact infrastructure gate after PR #64."
);
assert.match(
  next,
  /Bounded product acceptance boundary after PR #65[\s\S]+fresh-device multi-Save backup\/import portability/i,
  "NEXT_TASK must carry the owner-authorized user-facing portability candidate past the infrastructure gate."
);
assert.match(
  current,
  /PR #66 authority-seal closure[\s\S]+0a7dfbefc0920fc5eaa119c7fd6b22cc8df63b96[\s\S]+Active PR #65 reconciliation/i,
  "The rolling handoff must close PR #66 exactly, retain PR #64 proof and name the active PR #65 reconciliation."
);
assert.match(
  start,
  /identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i,
  "Developer bootstrap must include PR #59 in the completed dependency chain."
);
assert.match(
  start,
  /presentation-only Local Profile display-label editing — PR #61/i,
  "Developer bootstrap must include PR #61 in the completed dependency chain."
);
assert.match(start,/PR #65[\s\S]+multi-Save backup\/import portability/i,"Developer bootstrap must expose the ordered infrastructure-to-product sequence.");

console.log("Handoff immediate-next-task contracts passed: recursive policy and historical proof remain protected while fresh developers are directed through PR #65 into bounded multi-Save portability.");
