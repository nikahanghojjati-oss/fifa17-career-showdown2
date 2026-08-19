const assert=require("node:assert/strict");
const fs=require("node:fs");

const agents=fs.readFileSync("AGENTS.md","utf8");
const status=JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json","utf8"));
const history=fs.readFileSync("WORK_ENVIRONMENT_HISTORY.md","utf8");
const nextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const suite=fs.readFileSync("tests/support/run-contract-suite.cjs","utf8");

assert.match(agents,/Interruption and tooling-resilience guardrails/i);
assert.match(agents,/Before a long multi-tool or multi-file sequence[\s\S]+WORK_ENVIRONMENT_STATUS\.json[\s\S]+exact branch\/HEAD safe checkpoint/i);
assert.match(agents,/Material decisions must not live only in chat/i);
assert.match(agents,/Do not create temporary self-modifying GitHub Actions workflows/i);
assert.match(agents,/route circuit breaker[\s\S]+second materially similar failure[\s\S]+stop retrying that route/i);
assert.match(agents,/Fetch the exact branch blob SHA immediately before update\/delete/i);
assert.match(agents,/stale-SHA\/409[\s\S]+refetch the file[\s\S]+retry once/i);
assert.match(agents,/Do not issue identical CI\/status polling calls consecutively on an unchanged exact head/i);
assert.match(agents,/append-only authority[\s\S]+WORK_ENVIRONMENT_HISTORY\.md[\s\S]+per-file PR patch[\s\S]+no deletion\/rewrite of prior history/i);
assert.match(agents,/final transition-prepared WEC seal must be the last branch mutation/i);
assert.match(agents,/Any later branch mutation invalidates that seal[\s\S]+fresh exact-head validation gate/i);
assert.match(agents,/After an unexpected interruption[\s\S]+re-fetching current PR metadata[\s\S]+exact branch HEAD[\s\S]+changed filenames[\s\S]+workflow state/i);
assert.match(agents,/Never assume the last attempted tool call completed/i);
assert.match(suite,/tests\/contracts\/work-environment-interruption-resilience-contracts\.cjs/);

assert.match(status.environmentId,/^we-\d{4}-\d{2}-\d{2}-.+/,"Current WEC must use a fresh environment identity.");
assert.match(status.repository.startingMainSha,/^[0-9a-f]{40}$/i,"Current WEC must record a full starting live-main SHA.");
const environmentMatch=nextTask.match(/Current environment: `([^`]+)`/);
const mainMatch=nextTask.match(/Starting independently verified live main: `([0-9a-f]{40})`/i);
assert.ok(environmentMatch,"NEXT_TASK must expose the current WEC environment ID.");
assert.ok(mainMatch,"NEXT_TASK must expose the current starting live-main SHA.");
assert.equal(status.environmentId,environmentMatch[1],"Interruption resilience must follow the current successor identity rather than freeze a predecessor environment.");
assert.equal(status.repository.startingMainSha,mainMatch[1],"Interruption resilience must follow current authority rather than freeze a predecessor starting main.");
assert.doesNotMatch(status.continuity.currentTask,/Do not merge PR #97 in this predecessor environment/i);
assert.match(history,/Successor activation — `we-2026-08-19-post-pr96-stage2-selection`/);
assert.match(history,/temporary push-triggered branch workflow/i);
assert.match(history,/temporary PR-triggered append workflow/i);
assert.match(history,/stale blob SHA[\s\S]+rejected by GitHub with no state change/i);

process.stdout.write("PASS Work Environment interruption resilience: repository checkpointing, route circuit breaking, optimistic-lock writes, bounded CI polling, append-only patch verification, permanent-suite enforcement, fresh-successor identity and interruption resume discipline are protected.\n");
