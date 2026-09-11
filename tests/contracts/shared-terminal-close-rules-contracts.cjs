"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");

const build=spawnSync(process.execPath,["scripts/build-production-firestore-rules.mjs"],{encoding:"utf8"});
if(build.stdout)process.stdout.write(build.stdout);
if(build.stderr)process.stderr.write(build.stderr);
assert.equal(build.status,0,"production Rules generator must accept the r18 Terminal Close splice");

const base=fs.readFileSync("firestore.spark.rules","utf8");
const fragment=fs.readFileSync("firestore.terminal-close-production.fragment.rules","utf8");
const generated=fs.readFileSync("firestore.spark.generated.rules","utf8");
const deploy=fs.readFileSync(".github/workflows/deploy-firestore-rules-zero-billing.yml","utf8");

assert.doesNotMatch(base,/ssjrTerminalValidRivalryUpdate|TERMINAL_CLOSE_READY/,"reviewed Spark base must remain free of r18 production authority");
assert.match(fragment,/SSJR_TERMINAL_CLOSE_FUNCTIONS_BEGIN/);
assert.match(fragment,/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/);
assert.match(fragment,/function ssjrTerminalValidProgressUpdate\(rivalryId\)/);
assert.match(fragment,/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/);
assert.match(fragment,/function ssjrTerminalParentCloseRequested\(rivalryId, sessionId\)/);
assert.match(fragment,/terminalProgress/);
assert.match(fragment,/acceptedThroughSeason/);
assert.match(fragment,/ssjrTerminalScore\(commit\.results\.playerOne\)/);
assert.match(fragment,/ssjrTerminalScore\(commit\.results\.playerTwo\)/);
assert.match(fragment,/setup\.phase == 'SHOWDOWN_CONFIRMED'/);
assert.match(fragment,/setup\.totalSeasons == progress\.totalSeasons/);
assert.match(fragment,/before\.data\.connectionState == 'active'/);
assert.match(fragment,/after\.data\.connectionState == 'closed'/);
assert.match(fragment,/priorProgress\.acceptedThroughSeason == priorProgress\.totalSeasons/);
assert.match(fragment,/intent\.managerTotals == priorProgress\.managerTotals/);
assert.doesNotMatch(fragment,/acceptedRevisionKey|fixedClubs/,"Terminal Close persisted witness must omit metadata that production Rules cannot independently verify");
assert.match(fragment,/getAfter\(\/databases\/\$\(database\)\/documents\/rivalries\/\$\(rivalryId\)\/sessions\/\$\(intent\.sessionId\)\)/);
assert.match(fragment,/before\.data\.state == 'active'/);
assert.match(fragment,/after\.data\.state == 'closed'/);
assert.match(fragment,/before\.data\.expiresAt > request\.time/);
assert.match(fragment,/parentBefore\.data\.connectionState == 'active'/);
assert.match(fragment,/parentAfter\.data\.connectionState == 'closed'/);
assert.match(fragment,/parentAfter\.data\.terminalClose\.sessionId == sessionId/);
assert.match(fragment,/parentAfter\.data\.terminalProgress\.closedSessionRevision == after\.revision/);
assert.match(fragment,/activeDevice\(after\.updatedByDeviceId\)/);
assert.match(fragment,/closedSessionRevision == after\.revision/);
assert.match(fragment,/intent\.extraSeasonAllowed == false/);
assert.match(fragment,/intent\.canonicalStorageMutation == false/);
assert.match(fragment,/intent\.listPermissionRequired == false/);
assert.match(fragment,/intent\.billingRequired == false/);
assert.doesNotMatch(fragment,/allow\s+list|cloud[\s_-]*run|cloud[\s_-]*functions|payment|purchased[\s_-]*credits/i);

assert.equal((generated.match(/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/g)||[]).length,1);
assert.equal((generated.match(/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/g)||[]).length,1);
assert.match(generated,/allow update: if ssjrTerminalValidRivalryUpdate\(rivalryId\)\s*\|\| \(!\('terminalProgress' in request\.resource\.data\.data\) && validRivalryRedeem\(rivalryId\)\);/);
assert.match(generated,/match \/sessions\/\{sessionId\}[\s\S]*allow update: if ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)\s*\|\| \(!ssjrTerminalParentCloseRequested\(rivalryId, sessionId\) && validSessionUpdate\(rivalryId, sessionId\)\);[\s\S]*allow list, delete: if false;/);
assert.match(generated,/function validSessionClose\(rivalryId, sessionId\)[\s\S]*before\.data\.state == "active"[\s\S]*after\.data\.state == "closed"/);
assert.match(generated,/match \/seasonCommits\/\{seasonId\}[\s\S]*allow list, delete: if false;/);
assert.match(generated,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);

assert.match(deploy,/firestore\.terminal-close-production\.fragment\.rules/);
assert.match(deploy,/shared-terminal-close-rules-contracts\.cjs/);
assert.match(deploy,/shared-terminal-close-production-provider-emulator\.cjs/);
assert.match(deploy,/function ssjrTerminalValidProgressUpdate\(rivalryId\)/,"deployment guard must pin the current staged terminalProgress validator");
assert.match(deploy,/priorProgress\.acceptedThroughSeason == priorProgress\.totalSeasons/,"deployment guard must pin final-season sealing before close");
assert.match(deploy,/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/,"deployment guard must pin current atomic session close authority");
assert.match(deploy,/!\('terminalProgress' in request\.resource\.data\.data\) && validRivalryRedeem\(rivalryId\)/,"deployment guard must pin the current rivalry routing seam");
assert.doesNotMatch(deploy,/ssjrTerminalAllSeasonsAccepted|ssjrTerminalSessionClosedAtomically/,"deployment guard must not regress to pre-budget-refactor Terminal Close helpers");
assert.ok(deploy.includes('grep -Fq "intent.billingRequired == false" firestore.terminal-close-production.fragment.rules'),"deployment guard must positively prove Terminal Close forbids billing");

const terminalRulesFile="firestore.terminal-close-production.fragment.rules";
// Bash treats a backslash-newline pair as one continued command. Normalize those
// continuations before discovery so a negative grep cannot escape validation by
// placing its target filename on the following physical line.
const deployCommands=deploy.replace(/\\\r?\n[ \t]*/g," ");
const terminalNegativeGreps=deployCommands
  .split(/\r?\n/)
  .map(line=>line.trim())
  .filter(line=>/^!\s*grep\b/.test(line) && line.includes(terminalRulesFile));
assert.ok(terminalNegativeGreps.length>0,"deployment guard must retain at least one Terminal Close paid-compute negative scan");
const terminalNegativePatterns=terminalNegativeGreps.map(line=>{
  const match=line.match(/^!\s*grep\s+-Eqi\s+(?:"([^"]+)"|'([^']+)')\s+firestore\.terminal-close-production\.fragment\.rules$/);
  assert.ok(match,`every Terminal Close negative grep must use the auditable -Eqi quoted-regex form after shell-continuation normalization; unable to parse: ${line}`);
  return match[1]??match[2];
});
function terminalNegativeScanMatches(text){
  return terminalNegativePatterns.some(pattern=>{
    const probe=spawnSync("grep",["-Eqi",pattern],{input:`${text}\n`,encoding:"utf8"});
    assert.ok(probe.status===0 || probe.status===1,`Terminal Close negative scan regex failed to execute: ${pattern}`);
    return probe.status===0;
  });
}
assert.equal(terminalNegativeScanMatches("intent.billingRequired == false;"),false,"no Terminal Close negative scan may reject the explicit zero-billing witness");
for(const dangerousFixture of [
  "cloud run",
  "cloud-functions",
  "blaze",
  "payment",
  "purchased credits",
  "billing enable",
  "billing_api",
  "billing-account",
  "billing project",
  "billing plan",
  "billingRequired == true"
]){
  assert.equal(terminalNegativeScanMatches(dangerousFixture),true,`Terminal Close deployment guard must reject paid-compute fixture: ${dangerousFixture}`);
}
assert.doesNotMatch(deploy,/billing enable|firebase use --add|functions:deploy|run deploy/i);

console.log("PASS r18 Terminal Close production Rules: acknowledged seasons are folded into a bounded monotonic rivalry terminalProgress seal one season at a time, canonical scores are accumulated under Rules authority, persisted terminal witness fields are limited to provider-verifiable facts, terminal-owned writes are routed away from legacy pairing/session validators, Terminal Close negative grep commands are normalized across Bash line continuations before fail-closed parsing and behaviorally proved to allow billingRequired == false while rejecting concrete paid-compute enablement fixtures, and final ACTIVE-to-CLOSED still requires the exact session to close atomically with no list/delete/billing expansion.");