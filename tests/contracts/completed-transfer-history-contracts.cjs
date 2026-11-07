'use strict';
// JOB-10 completed-only transfer history: the Firestore Rules grant and its composed artifact, plus the completed
// Showdown reader's API. Plain node:assert, no Firebase, no emulator. (r90: the never-wired client reader
// js/sparkCompletedTransferHistoryReader.js was deleted as dead code; the Rules it was written against stay and are checked here.)
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const CompletedReader=require(path.join(root,'js/sparkCompletedShowdownReader.js'));

(async()=>{
  // K9. Rules text: phase-gated role grant, witness-keyed, no write inspection, no billing words
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  const grant=fragment.slice(fragment.indexOf('function cmsCompletedTransferRoleReadable'),fragment.indexOf('// CMS_PERSISTENT_PAIR_FUNCTIONS_END'));
  for(const needle of ['cmsCompletedSeasonReadable(rivalryId, transferId)',"challenge.objectType == 'sharedTransferChallenge'",'challenge.rivalryId == rivalryId','ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)',"challenge.phase == 'COMPLETED'","'playerOne' in challenge.guessLockedRoles","'playerTwo' in challenge.guessLockedRoles","'playerOne' in challenge.signingLockedRoles","'playerTwo' in challenge.signingLockedRoles"])assert.ok(grant.includes(needle),needle);
  assert.doesNotMatch(grant,/getAfter|request\.resource/,'read grant never inspects a write');
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  const inject=read('scripts/inject-persistent-pair-rules.mjs');
  for(const label of ['completed Showdown transfer challenge read','completed Showdown transfer role read','completed Showdown setup read','completed Showdown season commit read'])assert.ok(inject.includes(label),label);

  // K10. Composed artifact: both builds pass; the transfer grant sits on exactly two get lines, roles are phase-gated
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  assert.equal((generated.match(/allow get: if ssjrEntitled\((rivalryId)?\) \|\| cmsCompletedSeasonReadable\((rivalryId, )?transferId\);/g)||[]).length,1,'public challenge get');
  assert.match(generated,/allow get: if ssjrTransferPrivateReadable\((rivalryId, transferId, managerRole)?\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedTransferRoleReadable\((rivalryId, transferId)?\)\);/);
  const transferAt=generated.indexOf('match /transferChallenges/{transferId}'),rolesAt=generated.indexOf('match /roles/{managerRole}',transferAt),transferEnd=generated.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END');
  assert.ok(transferAt>0&&rolesAt>transferAt&&transferEnd>rolesAt);
  // Only the allow lines: the localize build step declares cmsCompletedTransferRoleReadable (whose body names the season
  // grant behind the COMPLETED condition) inside this block.
  const rolesAllows=generated.slice(rolesAt,transferEnd).split('\n').filter(line=>/\ballow\b/.test(line)).join('\n');
  assert.doesNotMatch(rolesAllows,/cmsCompleted(Showdown|Season)Readable/,'roles never get the blanket season grant (S2C-005R2 §4)');
  assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false,'no write, list or delete rule mentions a completed grant');
  for(const [match,granted] of [['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false],['match /state/authoritative',false],['match /transferChallenges/{transferId}',true]]){
    const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));assert.equal(/cmsCompleted/.test(getLine),granted,match);
  }

  // K11. JOB-08's reader keeps its API, adds JOB-1037's never-started status and never reads transfers
  assert.equal(typeof CompletedReader.readCompletedShowdown,'function');assert.deepEqual([...CompletedReader.statuses],['completed','abandoned','not-closed','unavailable','never-started','hidden']);assert.equal(CompletedReader.contractVersion,1);
  assert.doesNotMatch(read('js/sparkCompletedShowdownReader.js'),/transferChallenges/);
  console.log('PASS completed-only transfer history contracts: Rules text, composed artifact, JOB-08 completed reader API intact.');
})().catch(e=>{console.error(e);process.exit(1);});
