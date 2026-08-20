const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path);
const text=path=>read(path).toString("utf8");
const capsule=JSON.parse(text("SESSION_BOOTSTRAP.json"));

const handoffRoot=capsule.currentHandoff.canonical;
const handoffMirror=capsule.currentHandoff.projectMirror;
const starterRoot=capsule.starter.canonical;
const starterMirror=capsule.starter.projectMirror;

for(const path of [
  handoffRoot,
  handoffMirror,
  starterRoot,
  starterMirror,
  "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md",
  "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md"
]){
  assert.ok(fs.existsSync(path),`SLE package is missing ${path}`);
}

assert.deepEqual(read(handoffRoot),read(handoffMirror),"SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot),read(starterMirror),"SLE starter root and project mirror must remain byte-identical.");

assert.equal(capsule.schemaVersion,5);
assert.equal(capsule.currentPullRequest.number,114);
assert.equal(capsule.currentPullRequest.mergeAuthorized,true,"Later standing owner authorization must supersede the earlier PR #114 draft-only merge restriction.");
assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval,true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority,"00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance,"authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.equal(capsule.starter.version,"1.3.0");
assert.equal(starterRoot,"START_NEXT_SESSION_V1.3.0_PR114.md");
assert.equal(starterMirror,"project-documents/session-starts/START_NEXT_SESSION_V1.3.0_PR114.md");
assert.equal(handoffRoot,"SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md");
assert.equal(handoffMirror,"project-documents/handoffs/SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md");
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"),"Standing owner authorization must be a Tier-0 successor read.");
assert.match(capsule.wec100PackagingRule,/final transition-prepared WEC seal as the last PR-branch mutation/i);
assert.match(capsule.wec100PackagingRule,/validate that sealed exact head/i);
assert.match(capsule.wec100PackagingRule,/standing owner authorization to merge\/deploy/i);

const starter=text(starterRoot);
const handoff=text(handoffRoot);
const rootAuth=text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance=text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");

for(const [name,value] of [["starter",starter],["handoff",handoff],["root authorization",rootAuth],["authorization provenance",provenance]]){
  assert.match(value,/standing[\s\S]{0,220}merge[\s\S]{0,120}deploy/i,`${name} must preserve standing merge/deploy authorization.`);
  assert.match(value,/required (?:test|tests|repository test|repository tests|gate|gates)/i,`${name} must keep merge/deploy conditional on required validation.`);
}

assert.match(starter,/all 13 normal workflow families green/i);
assert.match(starter,/reviews clean/i);
assert.match(starter,/threads clean/i);
assert.match(starter,/mergeability clean/i);
assert.match(starter,/expected-head protection/i);
assert.match(handoff,/all 13 normal workflow families green/i);
assert.match(handoff,/final transition-prepared WEC seal is the last PR-branch mutation/i);
assert.match(rootAuth,/through completion of the full Career Mode Showdown project/i);
assert.match(provenance,/through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth,/later explicit owner instruction may revoke or narrow/i);
assert.match(provenance,/later explicit owner instructions override/i);

process.stdout.write("PASS SLE package: byte-identical handoff/starter mirrors, capsule pointers, immutable-seal rule and standing owner merge/deploy authorization are protected.\n");
