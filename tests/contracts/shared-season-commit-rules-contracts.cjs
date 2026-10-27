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
  // Audit R84 F02 (r85): the root.* pins below used to match only the never-called ssjrCommitShape; they now pin the
  // live create/acknowledge validators (after.*), and both validators must call the shared actor write authority.
  "after.runtimeRevision == '1.9.1-r10'",
  "public.runtimeRevision == '1.9.1-r9'",
  "public.phase == 'RESULTS_READY'",
  'public.revision == 2',
  "role == setup.coordinatorRole",
  "after.results.keys().hasOnly(['playerOne','playerTwo'])",
  "public.teamCount in [18,20]",
  "ssjrCommitResultShape(after.results.playerOne, public.teamCount)",
  "ssjrCommitResultShape(after.results.playerTwo, public.teamCount)",
  "ssjrCommitResultShape(value, teamCount)",
  "value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague'])",
  "&& (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false));",
  "value.leaguePosition <= teamCount",
  "value.leaguePoints <= (teamCount - 1) * 6",
  'after.results.playerOne == p1.result',
  'after.results.playerTwo == p2.result',
  "after.revision < 3 && after.phase == 'COMMITTED'",
  "after.revision == 3 && after.phase == 'ACKNOWLEDGED'",
  'after.acknowledgedRoles.size() == 0',
  'after.acknowledgedRoles.size() == after.revision - 1',
  'after.acknowledgedRoles.toSet().size() == after.acknowledgedRoles.size()',
  "after.acknowledgedRoles.toSet().hasOnly(['playerOne','playerTwo'])",
  'after.actorRoles[0] == role',
  'after.actorRoles == before.actorRoles.concat([after.actorRoles[i]])',
  'after.revision == before.revision + 1',
  'ssjrCommitPrefixPreserved(before, after)',
  '!(role in before.acknowledgedRoles)',
  'after.results == before.results',
  'after.baseRevisions[i] == before.revision',
  'after.actorRoles[i] == role',
  'after.acknowledgedRoles[i - 1] == role',
  'ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)'
])assert.ok(fragment.includes(required),`Season Commit Rules missing required boundary: ${required}`);

for(const name of ['ssjrCommitValidCreate','ssjrCommitValidUpdate']){
  const start=fragment.indexOf(`function ${name}(`);
  assert.ok(start>=0,`Season Commit fragment must define ${name}`);
  const body=fragment.slice(start,fragment.indexOf('\n    }\n',start));
  assert.ok(body.includes('ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)'),`${name} must enforce the shared actor Session/device/account write authority (audit R84 F02).`);
}
assert.equal(/function ssjrCommitShape\(/.test(fragment),false,'Season Commit must not keep the never-called ssjrCommitShape helper (audit R84 F02).');
assert.doesNotMatch(fragment,/acknowledgedRoles\[0:n - 1\]/,'Season Commit first acknowledgement must not rely on a zero-length Firestore list slice.');
assert.match(fragment,/after\.acknowledgedRoles == before\.acknowledgedRoles\.concat\(\[after\.acknowledgedRoles\[i - 1\]\]\)/,'Season Commit acknowledgements must remain append-only without slicing.');
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
  "after.runtimeRevision == '1.9.1-r10'",
  "public.phase == 'RESULTS_READY'",
  "role == setup.coordinatorRole",
  'after.results.playerOne == p1.result',
  'after.results.playerTwo == p2.result',
  "after.revision == 3 && after.phase == 'ACKNOWLEDGED'",
  'ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)'
])assert.ok(generated.includes(required),`generated production Rules missing r10 Season Commit boundary: ${required}`);

assert.equal((generated.match(/match \/seasonCommits\/\{seasonId\}/g)||[]).length,1,'generated Rules must contain exactly one Season Commit match');
assert.equal((generated.match(/match \/seasonResults\/\{seasonId\}/g)||[]).length,1,'generated Rules must preserve exactly one Season Results match');
assert.equal((generated.match(/match \/roles\/\{managerRole\}/g)||[]).length,2,'Season Commit must not introduce a third role-private collection');

console.log('PASS Shared Season Commit production Rules: exact r9 RESULTS_READY snapshot prerequisite, coordinator-only immutable commit, active-session/device CAS updates, append-only distinct manager acknowledgements to terminal ACKNOWLEDGED, league-specific result bounds, result immutability, generated single authority, Spark-only zero billing, no shared scoring and no canonical Save mutation.');
