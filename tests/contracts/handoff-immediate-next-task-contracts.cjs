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

// Phase B authority: multi-Save + Phase A closed; first slice of Save Library Experience 2.0 authorized.
assert.match(
  next,
  /Authorized product candidate[\s\S]+Save Library \/ Local Profile Experience 2\.0/i,
  "NEXT_TASK must authorize the Phase B Save Library / Local Profile Experience 2.0 candidate."
);
assert.match(
  next,
  /bounded first slice/i,
  "NEXT_TASK must keep the Phase B authorization bounded to a first slice."
);
assert.match(
  next,
  /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i,
  "NEXT_TASK must name formatVersion 2 multi-Save portability (PR #67) as the closed production milestone."
);
assert.match(
  next,
  /8fc671fc644e69b4fd405d7ebc28f961b2f3ae27/i,
  "NEXT_TASK must record the live main feature-merge SHA for PR #67."
);
assert.match(
  next,
  /Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i,
  "NEXT_TASK must close Local Profile display-label, Identity-Safe Analytics, and multi-Save portability as production-proven."
);
assert.match(
  next,
  /After that slice is production-proven, stop and wait for a further explicit owner instruction/i,
  "NEXT_TASK stop condition must require further owner instruction after the Phase B first slice is proven."
);
assert.match(
  next,
  /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i,
  "NEXT_TASK must retain the permanent ELIMINATED public community / global leaderboard lock."
);
assert.match(
  next,
  /private remote joining[\s\S]+BLOCKED/i,
  "NEXT_TASK must retain private remote joining as important future but currently BLOCKED."
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

console.log("Handoff immediate-next-task contracts passed: recursive policy and historical proof remain protected; multi-Save (PR #67) and Phase A closed; Phase B first slice (Save Library Experience 2.0) authorized under owner instruction.");
