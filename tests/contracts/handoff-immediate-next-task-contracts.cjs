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
  /FIRST ENGINEERING TASK: review and test the existing Analytics candidate/i,
  "Active Analytics handoff must state the exact first engineering task after repository study."
);
assert.match(
  active,
  /SECOND TASK: open the draft PR and obtain exact-head validation/i,
  "Active Analytics handoff must state the ordered validation task after source review."
);
assert.match(
  active,
  /promotion gate and exact-head merge/i,
  "Active Analytics handoff must state the promotion gate rather than leaving merge behavior implicit."
);
assert.match(
  active,
  /production and deployed-Pages proof/i,
  "Active Analytics handoff must state the required production proof step."
);
assert.match(
  active,
  /smallest authority seal, then stop/i,
  "Active Analytics handoff must state the post-production authority seal and stop boundary."
);
assert.match(
  active,
  /do not begin backup portability[\s\S]+cloud\/accounts\/sync/i,
  "Active Analytics handoff must keep unrelated future roadmap work explicitly out of scope."
);

console.log("Handoff immediate-next-task contracts passed: permanent policy and the active Analytics handoff both separate study from explicit ordered execution, validation, promotion, production proof and stop boundaries.");
