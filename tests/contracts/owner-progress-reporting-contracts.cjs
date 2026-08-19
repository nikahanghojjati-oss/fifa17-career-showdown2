const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const agents = read("AGENTS.md");
const provenance = read("authority-history/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19.md");

const requiredLabels = [
  /Handoff proximity:\s*X%/i,
  /Remote Joining readiness:\s*~Y%/i,
  /Current lane:/i,
  /Concrete dependency completed:/i,
  /Next unlock:/i,
  /Blocker:/i,
  /Sidequest check:/i
];

for (const [name, text] of [["AGENTS.md", agents], ["owner reporting provenance", provenance]]) {
  let lastIndex = -1;
  for (const pattern of requiredLabels) {
    const match = pattern.exec(text);
    assert.ok(match, `${name} must preserve required owner reporting label ${pattern}.`);
    assert.ok(match.index > lastIndex, `${name} must preserve the seven-line owner reporting order.`);
    lastIndex = match.index;
  }
}

assert.match(agents, /Every substantive owner-facing development response must include this exact seven-line status shape/i);
assert.match(agents, /Do not rename or replace `Remote Joining readiness` while Private Remote Joining is still incomplete/i);
assert.match(agents, /fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(agents, /all required exact-head and runtime\/deployment gates are green/i);
assert.match(agents, /known release blockers are resolved/i);
assert.match(agents, /owner acceptance is recorded when an owner-facing acceptance surface applies/i);
assert.match(agents, /<Next Major Feature> readiness:\s*~Y%/i);
assert.match(agents, /next owner-authorized major feature selected by current source\/implementation authority/i);
assert.match(agents, /Sidequest check[\s\S]+`NONE`[\s\S]+`NECESSARY because/i);
assert.match(agents, /Every successor handoff and fresh Work environment inherits this seven-line format recursively/i);
assert.match(agents, /authority-history\/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19\.md/i);

assert.match(provenance, /Historical provenance does not itself authorize implementation/i);
assert.match(provenance, /Remote Joining readiness` remains the second line until Private Remote Joining is fully finished, integrated, tested, hardened and bug-fixed/i);
assert.match(provenance, /After that completion boundary[\s\S]+<Next Major Feature> readiness:\s*~Y%/i);
assert.match(provenance, /Never guess the next feature from old roadmap order/i);
assert.match(provenance, /Every successor handoff and fresh Work environment must preserve this reporting behavior recursively/i);

process.stdout.write("PASS owner seven-line progress reporting, Remote Joining readiness lifecycle and next-major-feature handoff policy\n");
