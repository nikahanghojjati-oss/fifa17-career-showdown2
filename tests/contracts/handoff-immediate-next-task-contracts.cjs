const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const active = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");

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

const immediateIndex = active.indexOf("IMMEDIATE NEXT TASK AFTER FULL STUDY");
const authorizationIndex = active.indexOf("## Owner authorization");
assert.ok(immediateIndex >= 0, "Active Analytics handoff must expose the mandatory immediate-next-task section.");
assert.ok(
  authorizationIndex < 0 || immediateIndex < authorizationIndex,
  "The immediate task must be prominent near the top of the active handoff rather than buried after historical context."
);
assert.match(
  active,
  /FIRST ENGINEERING TASK: validate PR #59 exact head/i,
  "Active Analytics handoff must advance its first engineering task to exact-head PR validation after the completed source review."
);
assert.match(
  active,
  /source\/test review has already been completed[\s\S]+no demonstrated runtime defect/i,
  "Active Analytics handoff must make clear that the completed source review should not be repeated as the current task."
);
assert.match(
  active,
  /One exact PR #59 head with all normal pull-request workflow families green/i,
  "Active Analytics handoff must define the exact-head validation success condition."
);
assert.match(
  active,
  /promotion gate/i,
  "Active Analytics handoff must state the promotion gate rather than leaving merge behavior implicit."
);
assert.match(
  active,
  /production and deployed Pages proof/i,
  "Active Analytics handoff must state the required production proof step."
);
assert.match(
  active,
  /smallest production authority seal, then stop/i,
  "Active Analytics handoff must state the post-production authority seal and stop boundary."
);
assert.match(
  active,
  /Do not begin backup-envelope portability redesign[\s\S]+Cloud Readiness runtime implementation/i,
  "Active Analytics handoff must keep unrelated future roadmap work explicitly out of scope."
);
assert.match(
  active,
  /PR #59 remains draft[\s\S]+Validation is not yet claimed green/i,
  "Active Analytics handoff must distinguish an open draft PR from validated or production-proven state."
);

console.log("Handoff immediate-next-task contracts passed: permanent policy remains recursive, and the active Analytics handoff now points a fresh developer from bootstrap directly to PR #59 exact-head validation, promotion, production proof and the stop boundary.");
