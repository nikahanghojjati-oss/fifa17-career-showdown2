const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const agents = read("AGENTS.md");
const provenance = read("authority-history/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19.md");

const currentRequiredLabels = [
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

assertOrderedLabels("AGENTS.md", agents, currentRequiredLabels, "eight-line");
assertOrderedLabels("owner reporting provenance", provenance, historicalRequiredLabels, "historical seven-line");

assert.match(agents, /Every substantive owner-facing development response must include this exact eight-line status shape/i);
assert.match(agents, /Estimated focused sessions to genuine RJR100/i);
assert.match(agents, /roadmap-based planning estimate[\s\S]+not a score-derived countdown[\s\S]+not[\s\S]+RJR evidence/i);
assert.match(agents, /Recalculate it when verified dependencies[\s\S]+materially change the critical path/i);
assert.match(agents, /At genuine RJR100 the value becomes `~0`/i);
assert.match(agents, /Do not rename or replace `Remote Joining readiness` while Private Remote Joining is still incomplete/i);
assert.match(agents, /fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(agents, /all required exact-head and runtime\/deployment gates are green/i);
assert.match(agents, /known release blockers are resolved/i);
assert.match(agents, /owner acceptance is recorded when an owner-facing acceptance surface applies/i);
assert.match(agents, /<Next Major Feature> readiness:\s*~Y%/i);
assert.match(agents, /next owner-authorized major feature selected by current source\/implementation authority/i);
assert.match(agents, /Sidequest check[\s\S]+`NONE`[\s\S]+`NECESSARY because/i);
assert.match(agents, /Every successor handoff and fresh Work environment inherits this eight-line format recursively/i);
assert.match(agents, /authority-history\/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19\.md/i);
assert.match(agents, /explicit 2026-08-29 instruction adds the roadmap-based RJR100 session-estimate line/i);

assert.match(provenance, /Historical provenance does not itself authorize implementation/i);
assert.match(provenance, /Remote Joining readiness` remains the second line until Private Remote Joining is fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(provenance, /After that completion boundary[\s\S]+<Next Major Feature> readiness:\s*~Y%/i);
assert.match(provenance, /Never guess the next feature from old roadmap order/i);
assert.match(provenance, /Every successor handoff and fresh Work environment must preserve this reporting behavior recursively/i);

process.stdout.write("PASS owner eight-line progress reporting, roadmap-based RJR100 session forecasting, Remote Joining readiness lifecycle and historical provenance policy\n");
