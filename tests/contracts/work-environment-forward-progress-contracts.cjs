const assert = require("node:assert/strict");
const fs = require("node:fs");

const agents = fs.readFileSync("AGENTS.md", "utf8");
const antiLoop = fs.readFileSync("00_FORWARD_PROGRESS_ANTI_LOOP.md", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.match(agents, /00_FORWARD_PROGRESS_ANTI_LOOP\.md/);
assert.match(antiLoop, /Forward Progress \/ Anti-Loop Policy/i);
assert.match(antiLoop, /Meaningful gate rule/i);
assert.match(antiLoop, /Retired milestone gate handling/i);
assert.match(antiLoop, /Adaptive anti-spiral behavior/i);
assert.match(antiLoop, /2 through 20 attempts/i);
assert.match(antiLoop, /nonfunctional wording-only mismatch/i);
assert.match(antiLoop, /No history-of-history loops/i);
assert.match(antiLoop, /Interruption recovery must resume implementation/i);
assert.match(antiLoop, /Product priority test/i);
assert.match(antiLoop, /separate preliminary authority\/history PR is the exception/i);
assert.match(antiLoop, /does not weaken exact-head CI/i);

assert.equal(pkg.scripts["test:legacy-provenance"], "node tests/support/run-legacy-provenance-audit.cjs");
assert.match(pkg.scripts["test:contracts:all"], /test:legacy-provenance/);
assert.doesNotMatch(pkg.scripts["test:contracts"], /run-legacy-provenance-audit/);

process.stdout.write("PASS forward-progress anti-loop policy: meaningful current gates stay blocking, legacy wording is preserved outside the product gate, and ADB-1 remains a bounded 2..20 context-sensitive circuit breaker.\n");
