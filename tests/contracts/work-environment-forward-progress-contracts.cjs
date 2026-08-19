const assert=require("node:assert/strict");
const fs=require("node:fs");

const agents=fs.readFileSync("AGENTS.md","utf8");
const antiLoop=fs.readFileSync("00_FORWARD_PROGRESS_ANTI_LOOP.md","utf8");

assert.match(agents,/Mandatory forward-progress \/ anti-loop rule/i);
assert.match(agents,/00_FORWARD_PROGRESS_ANTI_LOOP\.md/);
assert.match(agents,/may activate that task in `NEXT_TASK\.md` atomically with the same bounded engineering candidate/i);
assert.match(agents,/Do not create a preliminary authority-only PR/i);
assert.match(agents,/do not let that deferred append block the next owner-authorized engineering milestone/i);
assert.match(agents,/do not manufacture a history-only milestone solely to perform that append/i);
assert.match(agents,/Do not create history-of-history repair loops/i);
assert.match(agents,/another environment already merged equivalent or superseding work[\s\S]+close\/abandon duplicate work/i);
assert.match(agents,/Do not create a reconciliation PR solely because the base SHA changed/i);
assert.match(agents,/After an interruption[\s\S]+resume from the last coherent engineering checkpoint/i);
assert.match(agents,/Do not restart the entire repository study/i);

assert.match(antiLoop,/Successor authority activation is not a separate milestone/i);
assert.match(antiLoop,/History append cannot become a progress deadlock/i);
assert.match(antiLoop,/Concurrent equivalent-work collapse rule/i);
assert.match(antiLoop,/No history-of-history loops/i);
assert.match(antiLoop,/Interruption recovery must resume implementation/i);
assert.match(antiLoop,/Remote Joining priority test/i);
assert.match(antiLoop,/One bounded engineering milestone should normally produce one engineering PR/i);
assert.match(antiLoop,/A separate preliminary authority\/history PR is the exception, not the default/i);
assert.match(antiLoop,/never permits skipping a real security, recovery, dependency, testing, WEC or publication requirement/i);

process.stdout.write("PASS forward-progress anti-loop policy: successor activation, deferred history, concurrent duplicate collapse and interruption resume cannot become self-perpetuating continuity milestones.\n");