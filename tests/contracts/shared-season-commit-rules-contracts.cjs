const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'../..');
const fragmentPath=path.join(root,'firestore.season-commit-production.fragment.rules');
const builderPath=path.join(root,'scripts/build-production-firestore-rules.mjs');
const generatedPath=path.join(root,'firestore.spark.generated.rules');

assert.equal(fs.existsSync(fragmentPath),true,'Shared Season Commit Rules fragment must exist');
const fragment=fs.readFileSync(fragmentPath,'utf8');
const forbidden=/cloud[\s_-]*run|cloud[\s_-]*functions|billing|blaze|payment|purchased[\s_-]*credits/i;
assert.doesNotMatch(fragment,forbidden,'Shared Season Commit Rules must stay inside the permanent Spark/zero-billing boundary');

for(const required of [
  '// SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN',
  '// SSJR_SEASON_COMMIT_FUNCTIONS_END',
  '// SSJR_SEASON_COMMIT_MATCH_BEGIN',
  '// SSJR_SEASON_COMMIT_MATCH_END',
  'match /seasonCommits/{seasonId}',
  'allow get: if ssjrEntitled(rivalryId)',
  'allow list, delete: if false',
  'allow create: if ssjrCommitValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrCommitValidUpdate(rivalryId, seasonId)',
  "root.runtimeRevision == '1.9.1-r10'",
  "public.runtimeRevision == '1.9.1-r9'",
  "public.phase == 'RESULTS_READY'",
  'public.revision == 2',
  "role == setup.coordinatorRole",
  "root.results.keys().hasOnly(['playerOne','playerTwo'])",
  'root.results.playerOne == p1.result',
  'root.results.playerTwo == p2.result',
  "root.revision < 3 && root.phase == 'COMMITTED'",
  "root.revision == 3 && root.phase == 'ACKNOWLEDGED'",
  'root.acknowledgedRoles.size() == n - 1',
  'root.acknowledgedRoles[1] != root.acknowledgedRoles[0]',
  'after.revision == before.revision + 1',
  'ssjrCommitPrefixPreserved(before, after)',
  '!(role in before.acknowledgedRoles)',
  'after.results == before.results',
  'after.baseRevisions[i] == before.revision',
  'after.actorRoles[i] == role',
  'after.acknowledgedRoles[i - 1] == role',
  'ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)'
])assert.ok(fragment.includes(required),`Season Commit Rules missing required boundary: ${required}`);

assert.doesNotMatch(fragment,/allow\s+list\s*:\s*if\s+true/,'Season Commit must never expose collection listing');
assert.doesNotMatch(fragment,/allow\s+delete\s*:\s*if\s+true/,'Season Commit authority is immutable and may not be deleted by clients');
assert.doesNotMatch(fragment,/authoritativeScoring|calculatePlayerSeasonScore|determineSeasonWinner|scoreTotal|playerOneScore|playerTwoScore|saveCurrentShowdown|persistCompletedSeason/,'r10 Season Commit Rules must not introduce scoring or canonical Save authority');

const build=spawnSync(process.execPath,[builderPath],{cwd:root,encoding:'utf8'});
assert.equal(build.status,0,`production Rules builder failed: ${build.stderr||build.stdout}`);
assert.equal(fs.existsSync(generatedPath),true,'production Rules builder must emit firestore.spark.generated.rules');
const generated=fs.readFileSync(generatedPath,'utf8');
for(const required of [
  '// SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN',
  '// SSJR_SEASON_COMMIT_MATCH_BEGIN',
  'match /seasonCommits/{seasonId}',
  'allow create: if ssjrCommitValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrCommitValidUpdate(rivalryId, seasonId)',
  "root.runtimeRevision == '1.9.1-r10'",
  "public.phase == 'RESULTS_READY'",
  "role == setup.coordinatorRole",
  'root.results.playerOne == p1.result',
  'root.results.playerTwo == p2.result',
  "root.phase == 'ACKNOWLEDGED'"
])assert.ok(generated.includes(required),`generated production Rules missing r10 Season Commit boundary: ${required}`);

assert.equal((generated.match(/match \/seasonCommits\/\{seasonId\}/g)||[]).length,1,'generated Rules must contain exactly one Season Commit match');
assert.equal((generated.match(/match \/seasonResults\/\{seasonId\}/g)||[]).length,1,'generated Rules must preserve exactly one Season Results match');
assert.equal((generated.match(/match \/roles\/\{managerRole\}/g)||[]).length,2,'Season Commit must not introduce a third role-private collection');

console.log('PASS Shared Season Commit production Rules: exact r9 RESULTS_READY snapshot prerequisite, coordinator-only immutable commit, active-session/device CAS updates, append-only distinct manager acknowledgements to terminal ACKNOWLEDGED, result immutability, generated single authority, Spark-only zero billing, no shared scoring and no canonical Save mutation.');
