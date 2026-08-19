const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const start = read("00_DEVELOPER_START_HERE.md");
const current = read("00_CURRENT_HANDOFF.md");
const active = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const currentNext = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR99_PRE_CLOSEOUT_FULL.md");
const next = historicalNext;
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");

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
  ["NEXT_TASK.md", currentNext]
]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary after the Analytics promotion.`);
}

assert.match(currentNext,/CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE-JOINING UNBLOCK CLOSEOUT/i,"NEXT_TASK must expose the fresh post-PR #99 current authority first.");
assert.match(currentNext,/we-2026-08-19-post-pr99-remote-joining-unblock/,"NEXT_TASK must expose the fresh successor WEC identity.");
assert.match(currentNext,/0f61225b267e8334467a6d868d36c7ce58dd54a0/,"NEXT_TASK must expose the fresh successor starting live-main boundary.");
assert.match(currentNext,/PR #99[\s\S]+fc9dcc9cb7d298beb8fc07f4ed8caf2470394da3[\s\S]+0f61225b267e8334467a6d868d36c7ce58dd54a0/i,"NEXT_TASK must record PR #99 publication truth.");
assert.match(currentNext,/Stages 2A through 2I[\s\S]+DONE \/ MERGED \/ PROVEN/i,"NEXT_TASK must keep the completed Stage 2A-2I prerequisite chain protected.");
assert.match(currentNext,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i,"NEXT_TASK must keep Stage 3 blocked until remaining Stage 2 requirements are proven.");
assert.match(currentNext,/Private Remote Joining remains PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,"NEXT_TASK must keep Remote Joining prioritized and dependency gated.");
assert.match(currentNext,/authority-history\/NEXT_TASK_POST_PR99_PRE_CLOSEOUT_FULL\.md[\s\S]+aeb826fdde2ea9e6b0ce7c886d2dc1a419158601/i,"NEXT_TASK must point to the exact byte-for-byte pre-closeout authority archive.");

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

// Historical v1.4.0 seal and shipped-dependency evidence is protected in the exact pre-closeout NEXT_TASK archive.
assert.match(
  next,
  /Authorized product candidate:[\s\S]{0,40}none/i,
  "Archived NEXT_TASK must retain the clean stop with no authorized product candidate after the v1.4.0 seal."
);
assert.match(
  next,
  /Phase C first slice[\s\S]{0,160}(PR #73|production-proven|closed)/i,
  "Archived NEXT_TASK must name Phase C first slice (PR #73) as closed / production-proven."
);
assert.match(
  next,
  /Phase B first slice — Save Library \/ Local Profile Experience 2\.0 \(PR #70/i,
  "Archived NEXT_TASK must name Phase B first slice (PR #70) as closed / production-proven."
);
assert.match(
  next,
  /65b6c9db0a070b6e5e992a39dffeee23df0c6f08/i,
  "Archived NEXT_TASK must record the live main feature-merge SHA for PR #70 (Phase B first slice)."
);
assert.match(
  next,
  /dec1d3ba8182c3f62019974dd1704c7c9124def6/i,
  "Archived NEXT_TASK must record the Phase C first-slice (PR #73) production merge."
);
assert.match(
  next,
  /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i,
  "Archived NEXT_TASK must name formatVersion 2 multi-Save portability (PR #67) as a closed production milestone."
);
assert.match(
  next,
  /Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i,
  "Archived NEXT_TASK must retain Local Profile display-label, Identity-Safe Analytics, and multi-Save production provenance."
);
assert.match(
  next,
  /stop and wait for a further explicit owner instruction|hold clean stop until a later explicit owner instruction/i,
  "Archived NEXT_TASK must retain the historical stop condition provenance."
);
assert.match(
  currentNext,
  /v1\.4\.0/i,
  "Current NEXT_TASK must identify visible application version v1.4.0."
);
assert.match(
  currentNext,
  /1\.4\.0-r1/i,
  "Current NEXT_TASK must identify runtime 1.4.0-r1."
);
assert.match(
  currentNext,
  /global leaderboards and public rankings remain eliminated/i,
  "Current NEXT_TASK must retain the permanent eliminated public community / global ranking lock."
);
assert.match(
  currentNext,
  /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i,
  "Current NEXT_TASK must preserve Private Remote Joining as a prioritized long-term destination with strict prerequisite gates and no current runtime authorization."
);
assert.match(
  currentNext,
  /Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i,
  "Current NEXT_TASK must preserve the ordered Remote Joining prerequisite path."
);
assert.match(
  remotePriority,
  /Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i,
  "The dated owner amendment must explicitly supersede only the former Remote Joining BLOCKED classification."
);
assert.match(
  remotePriority,
  /PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,
  "The owner amendment must lock the new Remote Joining classification."
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

console.log("Handoff immediate-next-task contracts passed: fresh post-PR99 authority is current, exact pre-closeout history remains protected, shipped v1.4.0 provenance remains archived, and Remote Joining stays prioritized but dependency-gated.");
