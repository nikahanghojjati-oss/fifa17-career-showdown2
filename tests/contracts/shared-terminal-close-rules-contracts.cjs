"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {spawnSync}=require("node:child_process");

const build=spawnSync(process.execPath,["scripts/build-production-firestore-rules.mjs"],{encoding:"utf8"});
if(build.stdout)process.stdout.write(build.stdout);
if(build.stderr)process.stderr.write(build.stderr);
assert.equal(build.status,0,"production Rules generator must accept the r18 Terminal Close splice");

const base=fs.readFileSync("firestore.spark.rules","utf8");
const fragment=fs.readFileSync("firestore.terminal-close-production.fragment.rules","utf8");
const generated=fs.readFileSync("firestore.spark.generated.rules","utf8");
const deploy=fs.readFileSync(".github/workflows/deploy-firestore-rules-zero-billing.yml","utf8");
const zeroBillingValidatorPath="scripts/assert-firestore-zero-billing-boundary.mjs";

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
assert.match(generated,/intent\.billingRequired == false/);

assert.match(deploy,/firestore\.terminal-close-production\.fragment\.rules/);
assert.match(deploy,/shared-terminal-close-rules-contracts\.cjs/);
assert.match(deploy,/shared-terminal-close-production-provider-emulator\.cjs/);
assert.match(deploy,/function ssjrTerminalValidProgressUpdate\(rivalryId\)/,"deployment guard must pin the current staged terminalProgress validator");
assert.match(deploy,/priorProgress\.acceptedThroughSeason == priorProgress\.totalSeasons/,"deployment guard must pin final-season sealing before close");
assert.match(deploy,/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/,"deployment guard must pin current atomic session close authority");
assert.match(deploy,/!\('terminalProgress' in request\.resource\.data\.data\) && validRivalryRedeem\(rivalryId\)/,"deployment guard must pin the current rivalry routing seam");
assert.doesNotMatch(deploy,/ssjrTerminalAllSeasonsAccepted|ssjrTerminalSessionClosedAtomically/,"deployment guard must not regress to pre-budget-refactor Terminal Close helpers");
assert.ok(deploy.includes(`- ${zeroBillingValidatorPath}`),"the zero-billing validator itself must be a production Rules deployment trigger path");
assert.ok(deploy.includes(`node ${zeroBillingValidatorPath}`),"production Rules publication must execute the shared deterministic zero-billing validator");
assert.doesNotMatch(deploy,/!\s*grep\s+-Eqi/,"zero-billing policy must not be duplicated in shell negative-grep commands");
assert.doesNotMatch(deploy,/billing enable|firebase use --add|functions:deploy|run deploy/i);

(async()=>{
  const validatorUrl=pathToFileURL(path.resolve(zeroBillingValidatorPath)).href+`?contract=${Date.now()}`;
  const validator=await import(validatorUrl);

  assert.doesNotThrow(
    ()=>validator.assertRepositoryZeroBillingBoundary({root:process.cwd()}),
    "the exact repository fragments must satisfy the same zero-billing validator used by production deployment"
  );

  const terminalSafe="allow update: if intent.billingRequired == false;";
  assert.doesNotThrow(
    ()=>validator.assertTerminalCloseZeroBillingSource(terminalSafe,"safe terminal fixture"),
    "the explicit billingRequired == false witness must remain deployable"
  );
  assert.throws(
    ()=>validator.assertTerminalCloseZeroBillingSource("allow update: if true;","missing witness fixture"),
    /missing explicit intent\.billingRequired == false proof/,
    "Terminal Close must fail closed if the explicit zero-billing witness disappears"
  );

  for(const dangerousFixture of [
    "cloud run",
    "cloud-functions",
    "cloud billing",
    "blaze",
    "payment",
    "purchased credits",
    "billing enable",
    "billing_api",
    "billing-account",
    "billing project",
    "billing plan",
    "billing link",
    "billingRequired == true"
  ]){
    assert.throws(
      ()=>validator.assertTerminalCloseZeroBillingSource(`${terminalSafe}\n// ${dangerousFixture}`,`dangerous terminal fixture ${dangerousFixture}`),
      /permanent zero-billing boundary violated/,
      `Terminal Close validator must reject paid-compute fixture: ${dangerousFixture}`
    );
  }

  for(const strictDanger of ["billing","cloud run","cloud_functions","blaze","payment","purchased credits"]){
    assert.throws(
      ()=>validator.assertStrictZeroBillingSource(`// ${strictDanger}`,`strict fixture ${strictDanger}`),
      /permanent zero-billing boundary violated/,
      `strict predecessor fragment policy must reject: ${strictDanger}`
    );
  }

  console.log("PASS r18 Terminal Close production Rules: acknowledged seasons are folded into bounded monotonic terminalProgress, canonical scores remain Rules-authoritative, final close remains atomic, and production publication plus regression tests now share one deterministic zero-billing validator instead of reparsing shell grep syntax.");
})().catch(error=>{
  console.error(error?.stack||String(error));
  process.exitCode=1;
});
