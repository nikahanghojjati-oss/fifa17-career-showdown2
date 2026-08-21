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

assert.match(status.environmentId,/^we-\d{4}-\d{2}-\d{2}-.+/,"Current WEC must use a valid environment identity.");
assert.match(status.repository.startingMainSha,/^[0-9a-f]{40}$/i,"Current WEC must record a full starting live-main SHA.");
assert.ok(["active","transition-prepared","closed"].includes(status.lifecycle),"WEC lifecycle must remain explicit.");
assert.equal(status.signals.usageRemainingPercent,null,"Unknown model/account usage must remain unknown unless an approved source reports it.");
assert.equal(status.signals.usageSource,"unavailable");
assert.ok(typeof status.continuity.currentTask==="string"&&status.continuity.currentTask.trim().length>=40,"Current WEC must name a concrete bounded task rather than inherit one implicitly.");
assert.ok(typeof status.continuity.lastSafeCheckpoint==="string"&&status.continuity.lastSafeCheckpoint.trim().length>=40,"Current WEC must preserve a concrete safe checkpoint.");
assert.ok(typeof status.continuity.nextSafeAction==="string"&&status.continuity.nextSafeAction.trim().length>=40,"Current WEC must preserve a concrete resumable next action.");
assert.ok(Array.isArray(status.continuity.unfinishedWork)&&status.continuity.unfinishedWork.length>0,"Current WEC must preserve unfinished work.");
assert.ok(Array.isArray(status.continuity.knownHazards)&&status.continuity.knownHazards.length>0,"Current WEC must preserve hazards.");
assert.ok(Array.isArray(status.continuity.evidenceNotes)&&status.continuity.evidenceNotes.length>0,"Current WEC must preserve evidence notes.");

// NEXT_TASK may intentionally lag during a fresh successor or transition package. In that case the WEC must
// make the divergence explicit and preserve live-first recovery rather than hardcoding one historical product lane.
const environmentMatch=nextTask.match(/Current environment: `([^`]+)`/);
const mainMatch=nextTask.match(/Starting independently verified live main: `([0-9a-f]{40})`/i);
assert.ok(environmentMatch,"NEXT_TASK must retain the most recently published implementation-authority environment for provenance.");
assert.ok(mainMatch,"NEXT_TASK must retain the most recently published implementation-authority starting main for provenance.");
const diverged=status.environmentId!==environmentMatch[1]||status.repository.startingMainSha!==mainMatch[1];
if(diverged){
  assert.ok(["active","transition-prepared"].includes(status.lifecycle),"A WEC may diverge from the last published NEXT_TASK identity only while actively reconciling work or at a legitimate transition checkpoint.");
  assert.match(status.continuity.nextSafeAction,/live|main|exact|head|workflow|pull request|pull-request|successor|handoff|implement|publish|deploy/i,"A divergent WEC must record a source-verifiable resumable action.");
  const record=[...(status.continuity.evidenceNotes||[]),...(status.continuity.knownHazards||[]),status.continuity.nextSafeAction].join("\n");
  assert.match(record,/predecessor|successor|do not inherit|historical|closing-environment-only/i,"A divergent WEC must explicitly prevent predecessor transition authority from being silently inherited.");
  if(status.lifecycle==="transition-prepared"){
    assert.equal(status.signals.handoffCompleteness,100,"A divergent WEC may become transition-prepared only with a complete handoff package.");
    assert.equal(status.signals.unrecordedDecisions,0,"A final transition seal may not leave material decisions only in chat.");
    assert.equal(status.signals.atomicOperation,false,"A final transition seal may not abandon an atomic operation.");
  }
}else{
  assert.equal(status.environmentId,environmentMatch[1]);
  assert.equal(status.repository.startingMainSha,mainMatch[1]);
}

assert.doesNotMatch(status.continuity.currentTask,/Do not merge PR #97 in this predecessor environment/i);
assert.match(history,/Successor activation — `we-2026-08-19-post-pr96-stage2-selection`/);
assert.match(history,/temporary push-triggered branch workflow/i);
assert.match(history,/temporary PR-triggered append workflow/i);
assert.match(history,/stale blob SHA[\s\S]+rejected by GitHub with no state change/i);

process.stdout.write("PASS Work Environment interruption resilience: repository checkpointing, route circuit breaking, optimistic-lock writes, bounded CI polling, append-only history protection, milestone-neutral successor divergence, complete transition sealing and interruption resume discipline are protected.\n");
