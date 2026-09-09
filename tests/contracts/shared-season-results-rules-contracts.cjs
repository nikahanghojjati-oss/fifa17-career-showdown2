const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'../..');
const fragmentPath=path.join(root,'firestore.season-results-production.fragment.rules');
const builderPath=path.join(root,'scripts/build-production-firestore-rules.mjs');
const generatedPath=path.join(root,'firestore.spark.generated.rules');

assert.equal(fs.existsSync(fragmentPath),true,'Shared Season Results Rules fragment must exist');
const fragment=fs.readFileSync(fragmentPath,'utf8');
const forbidden=/cloud[\s_-]*run|cloud[\s_-]*functions|billing|blaze|payment|purchased[\s_-]*credits/i;
assert.doesNotMatch(fragment,forbidden,'Shared Season Results Rules must stay inside the permanent Spark/zero-billing boundary');

for(const required of [
  '// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN',
  '// SSJR_SEASON_RESULTS_FUNCTIONS_END',
  '// SSJR_SEASON_RESULTS_MATCH_BEGIN',
  '// SSJR_SEASON_RESULTS_MATCH_END',
  "match /seasonResults/{seasonId}",
  "match /roles/{managerRole}",
  "allow get: if ssjrEntitled(rivalryId)",
  "allow list, delete: if false",
  "allow list, update, delete: if false",
  "allow create: if ssjrResultsValidCreate(rivalryId, seasonId)",
  "allow update: if ssjrResultsValidUpdate(rivalryId, seasonId)",
  "allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)",
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY'",
  "career.setupOperationIds == setup.operationIds",
  "transfer.phase == 'COMPLETED'",
  "transfer.revision == 6 || transfer.revision == 7",
  "root.runtimeRevision == '1.9.1-r9'",
  "value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist'])",
  "value.leaguePosition >= 1",
  "value.leaguePosition <= 20",
  "value.leaguePoints >= 0",
  "value.leaguePoints <= 114",
  "value.leagueGoals >= 0",
  "value.leagueGoals <= 300",
  "value.domesticCup is bool",
  "value.championsLeague is bool",
  "value.topScorer is bool",
  "value.topAssist is bool",
  "ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)",
  "own.operationId == publicAfter.operationIds[i]",
  "own.activeSessionId == publicAfter.activeSessionId",
  "own.updatedByDeviceId == publicAfter.updatedByDeviceId"
])assert.ok(fragment.includes(required),`Season Results Rules missing required boundary: ${required}`);

assert.doesNotMatch(fragment,/allow\s+list\s*:\s*if\s+true/,'Season Results must never expose collection listing');
assert.doesNotMatch(fragment,/allow\s+delete\s*:\s*if\s+true/,'Season Results authority is immutable and may not be deleted by clients');
assert.doesNotMatch(fragment,/authoritativeScoring|winner|scoreTotal|playerOneScore|playerTwoScore/,'r9 publication Rules must not introduce authoritative shared scoring');

const build=spawnSync(process.execPath,[builderPath],{cwd:root,encoding:'utf8'});
assert.equal(build.status,0,`production Rules builder failed: ${build.stderr||build.stdout}`);
assert.equal(fs.existsSync(generatedPath),true,'production Rules builder must emit firestore.spark.generated.rules');
const generated=fs.readFileSync(generatedPath,'utf8');
for(const required of [
  '// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN',
  '// SSJR_SEASON_RESULTS_MATCH_BEGIN',
  'match /seasonResults/{seasonId}',
  'allow create: if ssjrResultsValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrResultsValidUpdate(rivalryId, seasonId)',
  'allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)',
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY'",
  "career.setupOperationIds == setup.operationIds",
  "transfer.phase == 'COMPLETED'",
  "root.runtimeRevision == '1.9.1-r9'"
])assert.ok(generated.includes(required),`generated production Rules missing r9 boundary: ${required}`);

assert.equal((generated.match(/match \/seasonResults\/\{seasonId\}/g)||[]).length,1,'generated Rules must contain exactly one Season Results public match');
assert.equal((generated.match(/match \/roles\/\{managerRole\}/g)||[]).length,2,'generated Rules must contain exactly the Transfer Challenge and Season Results role-private matches');

console.log('PASS Shared Season Results production Rules: deterministic generator includes exactly one r9 public authority and one r9 role-private authority, active-session/device writes are required, result fields and universal FIFA 17 league bounds are exact, first publisher privacy lasts until RESULTS_READY, client update/delete/list are denied, r8 timeout and early-end completion paths are accepted, authoritative shared scoring stays absent, and the fragment remains Spark-only with zero billing.');
