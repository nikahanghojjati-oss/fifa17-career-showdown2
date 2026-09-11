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
assert.match(fragment,/before\.data\.connectionState == 'active'/);
assert.match(fragment,/after\.data\.connectionState == 'closed'/);
assert.match(fragment,/ssjrTerminalAllSeasonsAccepted\(rivalryId, intent\.totalSeasons\)/);
assert.match(fragment,/getAfter\(\/databases\/\$\(database\)\/documents\/rivalries\/\$\(rivalryId\)\/sessions\/\$\(intent\.sessionId\)\)/);
assert.match(fragment,/before\.data\.state == 'active'/);
assert.match(fragment,/after\.data\.state == 'closed'/);
assert.match(fragment,/before\.data\.expiresAt > request\.time/);
assert.match(fragment,/intent\.extraSeasonAllowed == false/);
assert.match(fragment,/intent\.canonicalStorageMutation == false/);
assert.match(fragment,/intent\.listPermissionRequired == false/);
assert.match(fragment,/intent\.billingRequired == false/);
assert.doesNotMatch(fragment,/allow\s+list|cloud[\s_-]*run|cloud[\s_-]*functions|blaze|payment|purchased[\s_-]*credits/i);

assert.equal((generated.match(/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/g)||[]).length,1);
assert.equal((generated.match(/\|\| ssjrTerminalValidRivalryUpdate\(rivalryId\);/g)||[]).length,1);
assert.match(generated,/allow update: if validRivalryRedeem\(rivalryId\)\s*\|\| ssjrTerminalValidRivalryUpdate\(rivalryId\);/);
assert.match(generated,/match \/sessions\/\{sessionId\}[\s\S]*allow list, delete: if false;/);
assert.match(generated,/match \/seasonCommits\/\{seasonId\}[\s\S]*allow list, delete: if false;/);
assert.match(generated,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.match(deploy,/firestore\.terminal-close-production\.fragment\.rules/);
assert.match(deploy,/shared-terminal-close-rules-contracts\.cjs/);
assert.match(deploy,/shared-terminal-close-production-provider-emulator\.cjs/);
assert.doesNotMatch(deploy,/billing enable|firebase use --add|functions:deploy|run deploy/i);

console.log("PASS r18 Terminal Close production Rules: active rivalry + exact ACTIVE session close atomically only after every configured season commit is ACKNOWLEDGED, terminal witness is bounded, no list/delete expansion exists, and the reviewed Spark base remains isolated.");
