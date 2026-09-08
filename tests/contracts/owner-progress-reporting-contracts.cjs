const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const agents = read("AGENTS.md");
const provenance = read("authority-history/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19.md");
const mdpAuthority = read("00_MILESTONE_DELIVERY_PROGRESS.md");
const mdpLedger = JSON.parse(read("MILESTONE_DELIVERY_PROGRESS.json"));
const eagleEye = read("00_OWNER_EAGLE_EYE_GOLDEN_RULE.md");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const currentStarter = read(bootstrap.starter.canonical);

const historicalCurrentRequiredLabels = [
  /Handoff proximity:\s*X%/i,
  /Remote Joining readiness:\s*~Y%/i,
  /Estimated focused sessions to genuine RJR100:\s*~N[–-]M/i,
  /Current lane:/i,
  /Concrete dependency completed:/i,
  /Next unlock:/i,
  /Blocker:/i,
  /Sidequest check:/i
];

const historicalRequiredLabels = [
  /Handoff proximity:\s*X%/i,
  /Remote Joining readiness:\s*~Y%/i,
  /Current lane:/i,
  /Concrete dependency completed:/i,
  /Next unlock:/i,
  /Blocker:/i,
  /Sidequest check:/i
];

function assertOrderedLabels(name, text, labels, shapeName) {
  let lastIndex = -1;
  for (const pattern of labels) {
    const match = pattern.exec(text);
    assert.ok(match, `${name} must preserve required owner reporting label ${pattern}.`);
    assert.ok(match.index > lastIndex, `${name} must preserve the ${shapeName} owner reporting order.`);
    lastIndex = match.index;
  }
}

assertOrderedLabels("AGENTS.md historical RJR policy", agents, historicalCurrentRequiredLabels, "historical RJR eight-line");
assertOrderedLabels("owner reporting provenance", provenance, historicalRequiredLabels, "historical seven-line");

assert.match(agents, /Mandatory eight-line owner progress report/i);
assert.match(agents, /Estimated focused sessions to genuine RJR100/i);
assert.match(agents, /roadmap-based planning estimate[\s\S]+not a score-derived countdown[\s\S]+RJR evidence/i);
assert.match(agents, /Do not rename or replace `Remote Joining readiness` while Private Remote Joining is still incomplete/i);
assert.match(agents, /fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(agents, /Sidequest check[\s\S]+`NONE`[\s\S]+`NECESSARY because/i);
assert.match(agents, /authority-history\/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19\.md/i);

assert.match(provenance, /Historical provenance does not itself authorize implementation/i);
assert.match(provenance, /Remote Joining readiness` remains the second line until Private Remote Joining is fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(provenance, /Every successor handoff and fresh Work environment must preserve this reporting behavior recursively/i);

const ssjrOverride = agents.slice(agents.indexOf("## Current owner reporting override"));
const currentRequiredLabels = [
  /Session handoff proximity:\s*X%/i,
  /Shared Showdown Journey readiness:\s*Y\/100/i,
  /Milestone Delivery Progress:\s*NN\.NN\/100/i,
  /Current lane:/i,
  /Concrete dependency completed:/i,
  /Next unlock:/i,
  /Blocker:/i,
  /Sidequest check:/i
];
assertOrderedLabels("AGENTS.md current SSJR+MDP override", ssjrOverride, currentRequiredLabels, "current SSJR+MDP eight-line");
assert.doesNotMatch(ssjrOverride, /Estimated focused sessions to genuine SSJR100:/i, "Current SSJR reporting must use MDP instead of the old session forecast.");
assert.match(ssjrOverride, /MILESTONE_DELIVERY_PROGRESS\.json/);
assert.match(ssjrOverride, /does not grant SSJR credit/i);
assert.match(ssjrOverride, /both UI and provider authority/);
assert.match(ssjrOverride, /before league or club selection/);
assert.equal(mdpLedger.formattedScore, "39.00/100");
assert.match(mdpAuthority, /replaces the visible `Estimated focused sessions to genuine SSJR100` forecast/i);

const compactFooter = /MDP task delta:\s*\+X\.XX\s*\(AA\.AA\s*→\s*BB\.BB\)[\s\S]+Session handoff proximity:\s*X%/i;
assert.match(eagleEye, /Mandatory compact checkpoint footer/i);
assert.match(eagleEye, compactFooter);
assert.match(eagleEye, /Every successor handoff, versioned starter, fresh Work environment and future reporting authority must preserve this two-line footer recursively/i);
assert.match(currentStarter, compactFooter);
assert.match(currentStarter, /Every future successor handoff and fresh Work environment must preserve it recursively/i);

process.stdout.write("PASS owner current eight-line SSJR+MDP reporting, permanent two-line MDP task delta/session handoff footer, historical RJR provenance, MDP/SSJR separation and recursive reporting authority\n");
