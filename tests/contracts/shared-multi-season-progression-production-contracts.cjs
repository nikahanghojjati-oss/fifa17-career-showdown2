const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');

const production=read('js/productionSharedMultiSeasonProgression.js');
const bootstrap=read('js/ssjr.js');
const consumers=[
  'js/productionSharedTransferChallenge.js',
  'js/productionSharedSeasonResults.js',
  'js/productionSharedSeasonCommit.js',
  'js/productionSharedCanonicalScoring.js',
  'js/productionSharedHistoryConvergence.js'
];

assert.match(production,/runtimeRevision:"1\.9\.1-r13"/);
assert.match(production,/requiresHistoryConvergence:true/);
assert.match(production,/requiresVisibleHistoryWitnessBeforeAdvance:true/);
assert.match(production,/exactOnceLocalCursor:true/);
assert.match(production,/replaysAcceptedSeasonsFromOneOnFreshRuntime:true/);
assert.match(production,/sharedMultiSeasonContinueAction/);
assert.match(production,/CONTINUE TO SEASON/);
assert.match(production,/pmspHistoryWitnessed\(\)/);
assert.match(production,/sharedHistoryConvergencePanel/);
assert.match(production,/career-mode-shared-season-cursor-change/);
assert.match(production,/navigateTo\("dashboard"/);
assert.match(production,/resolveSeason:pmspResolveSeason/);
assert.match(production,/const local=pmspFallbackSeason\(fallback\?\?pmspShowdown\(\)\?\.currentRound\)/,'r13 must preserve the explicit/local season before its provider authority exists.');
assert.match(production,/authoritative=Boolean\(view&&view\.ok===true&&view\.authoritative===true/,'r13 cursor authority must require a verified provider view.');
assert.match(production,/return authoritative\?\(pmspEnsureCursor\(\)\|\|local\):local/,'r12 consumers must keep their local season until r13 is authoritative.');
assert.doesNotMatch(production,/\blocalStorage\b/);
assert.doesNotMatch(production,/saveCurrentShowdown|saveShowdown|careerModeShowdown\.saveLibrary/);
for(const lock of ['canonicalStorageMutation:false','providerWriteRequired:false','listPermissionRequired:false','billingRequired:false','blazeRequired:false','cloudRunRequired:false','cloudFunctionsRequired:false'])assert.ok(production.includes(lock),lock);

for(const file of consumers){
  const src=read(file);
  assert.match(src,/CareerModeProductionSharedMultiSeasonProgression/,`${file} must consult the r13 shared season resolver.`);
  assert.match(src,/resolveSeason/,`${file} must resolve the exact shared season through r13 when active.`);
  assert.match(src,/currentRound/,`${file} must retain the local-mode currentRound fallback.`);
}

assert.match(bootstrap,/ssjr-production-history-convergence/);
assert.match(bootstrap,/ssjr-multi-season-protocol/);
assert.match(bootstrap,/ssjr-multi-season-provider/);
assert.match(bootstrap,/ssjr-production-multi-season/);
assert.ok(bootstrap.indexOf('ssjr-production-history-convergence')<bootstrap.indexOf('ssjr-production-multi-season'),'r13 must install after r12 History Convergence.');

const core=require('../../js/sharedMultiSeasonProgression.js');
const provider=require('../../js/sparkSharedMultiSeasonProgression.js');
assert.equal(core.runtimeRevision,'1.9.1-r13');
assert.equal(provider.runtimeRevision,'1.9.1-r13');
assert.equal(provider.providerWriteRequired,false);
assert.equal(provider.listPermissionRequired,false);
assert.equal(provider.billingRequired,false);

console.log('PASS Shared Multi Season production contract: witnessed exact-once r13 cursor, additive pre-authority r12 fallback, five shared season consumers, ordered r12→r13 bootstrap and zero-write Spark boundary.');
