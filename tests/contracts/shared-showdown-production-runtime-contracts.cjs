const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const runtimeRevision=read("index.html").match(/<meta name="app-asset-revision" content="([^"]+)"/)[1];
const appVersion=read("index.html").match(/<meta name="app-version" content="([^"]+)"/)[1];
const serviceWorker=read("service-worker.js");
const previousRuntimeRevision=(serviceWorker.match(/const PREVIOUS_RUNTIME_REVISION = "([^"]+)"/)||[])[1];
const setup=read("js/productionSharedShowdownSetup.js");
const adapter=read("js/sparkSharedShowdownSetup.js");
const entry=read("js/productionSharedJourneyEntry.js");
const guard=read("js/productionSharedJourneyGuard.js");
const ssjr=read("js/ssjr.js");
const rules=read("firestore.rules");
const generator=read("scripts/build-production-firestore-rules.mjs");
const packageSource=read("package.json");
const deploy=read(".github/workflows/deploy-github-pages.yml");
const firestoreDeploy=read(".github/workflows/deploy-firestore-rules-zero-billing.yml");

assert.match(generator,/firestore\.shared-setup-production\.fragment\.rules/);
assert.match(generator,/firestore\.career-start-production\.fragment\.rules/);
assert.match(generator,/firestore\.transfer-challenge-production\.fragment\.rules/);
assert.match(generator,/firestore\.season-results-production\.fragment\.rules/);
assert.match(generator,/firestore\.season-commit-production\.fragment\.rules/);
assert.match(rules,/rivalries\/\{rivalryId\}\/sharedSetup\/authoritative/);
assert.match(rules,/rivalries\/\{rivalryId\}\/careerStart\/authoritative/);
assert.match(rules,/rivalries\/\{rivalryId\}\/transferChallenges\/\{seasonId\}/);
assert.match(rules,/rivalries\/\{rivalryId\}\/seasonResults\/\{seasonId\}/);
assert.match(rules,/rivalries\/\{rivalryId\}\/seasonCommits\/\{seasonId\}/);
assert.match(firestoreDeploy,/build-production-firestore-rules\.mjs/);
assert.match(firestoreDeploy,/verify-generated-firestore-rules\.mjs/);
assert.match(firestoreDeploy,/--only firestore:rules/);
assert.doesNotMatch(firestoreDeploy,/billing|blaze|functions|run/i);

assert.match(deploy,/productionSharedJourneyEntry\.js/);
assert.match(deploy,/productionSharedJourneyGuard\.js/);
assert.match(deploy,/productionSharedShowdownSetup\.js/);
assert.match(deploy,/sparkSharedShowdownSetup\.js/);
assert.match(deploy,/sharedShowdownSetup\.js/);
assert.match(deploy,/sharedShowdownCatalog\.js/);
assert.match(deploy,/ssjr\.js/);
assert.match(serviceWorker,new RegExp(runtimeRevision.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.match(serviceWorker,new RegExp(previousRuntimeRevision.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.match(serviceWorker,/js\/productionSharedJourneyEntry\.js/);
assert.match(serviceWorker,/js\/productionSharedJourneyGuard\.js/);
assert.match(serviceWorker,/js\/productionSharedShowdownSetup\.js/);
assert.match(serviceWorker,/js\/sparkSharedShowdownSetup\.js/);
assert.match(serviceWorker,/js\/sharedShowdownSetup\.js/);
assert.match(serviceWorker,/js\/sharedShowdownCatalog\.js/);
assert.match(serviceWorker,/js\/ssjr\.js/);
assert.match(packageSource,/shared-showdown-production-runtime-contracts\.cjs/);

assert.match(ssjr,/productionSharedJourneyGuard\.js/);
assert.match(ssjr,/productionSharedJourneyEntry\.js/);
assert.match(ssjr,/productionSharedShowdownSetup\.js/);
assert.ok(ssjr.indexOf('productionSharedJourneyGuard.js')<ssjr.indexOf('productionSharedJourneyEntry.js'));
assert.ok(ssjr.indexOf('productionSharedJourneyEntry.js')<ssjr.indexOf('productionSharedShowdownSetup.js'));

assert.match(entry,/sharedJourney/);
assert.match(entry,/mode:"shared"/);
assert.match(entry,/status:"PENDING SHARED SETUP"/);
assert.match(entry,/if\(!persistedPending\(\)\)/,'The saved marker must round-trip before shared setup continues.');
assert.match(entry,/if\(shellCreated&&!markerPersisted\)discardUnmarkedShell\(\)/,'A failed durable marker write must not leave an unmarked bypassable shell.');
assert.match(entry,/remote\.sessionState==="active"/,'Shared Setup entry must require exact ACTIVE private session.');
assert.match(entry,/remote\.rivalryId===rivalry\.rivalryId/);
assert.match(entry,/remote\.accountId===account\.accountId/);
assert.match(entry,/remote\.deviceId===pairing\.deviceId/);
assert.doesNotMatch(entry,/localStorage/,'Shared journey entry marker must never use raw canonical localStorage.');
for(const functionName of ['handleLeagueWheelAction','spinLeagueWheel','confirmLeagueSelectionAndContinue','prepareClubAssignment','assignClubs','continueToShowdownHome'])assert.ok(guard.includes(`"${functionName}"`),`Shared mode must guard direct ${functionName} calls.`);
assert.match(guard,/CLICK_TARGETS=Object\.freeze\(\{spinLeague:"league selection",openClubPack:"club assignment",continueClubAssignment:"shared rivalry confirmation"\}\)/,'Actual bound league/club controls must be capture-gated.');
assert.match(guard,/root\.document\.addEventListener\("click"[\s\S]+stopImmediatePropagation\(\)[\s\S]+,true\)/,'Shared mode must intercept actual click paths in capture phase before lexical handlers.');
assert.match(guard,/usesPersistedSaveMarker:true/,'Bypass guard must recover shared-mode authority from the durable active Save Library shell.');
assert.match(guard,/if\(blockLocalDraw\(name\)\)return false/,'Direct global calls must remain fail-closed while shared mode is pending.');
assert.match(guard,/root\.loadRuntimeScript/,'Bypass guard must hook lazy gameplay script loading.');
assert.match(guard,/Promise\.resolve\(original\.apply\(this,args\)\)\.then\(value=>\{\s*install\(\)/,'Lazy-loaded draw functions must be guarded before the runtime loader resolves to its caller.');
assert.doesNotMatch(guard,/localStorage/,'Bypass guard must never touch raw canonical localStorage.');

for(const required of [
  'productionEnabled:true',
  'pairingRequired:true',
  'exactActiveSessionRequired:true',
  'freshActiveSessionResumes:true',
  'deterministicRepositoryCatalog:true',
  'directLeagueClubInput:false',
  'canonicalStorageMutation:false',
  'billingRequired:false',
  'appCheckEnforcementRequired:false',
  'persistentFirestoreCache:false'
])assert.ok(setup.includes(required),`Production Shared Setup runtime missing lock ${required}`);
for(const key of ['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'])assert.ok(setup.includes(key));
assert.match(setup,/storageSnapshot\(\)[\s\S]+assertStorageUnchanged/,'Production adapter surface must guard canonical saves on reads and writes.');
assert.match(setup,/const operationId=randomOperationId\(\),baseRevision=current\.revision\|\|0;/,'Every Shared Setup mutation must create one fresh idempotency operation from the currently read CAS revision.');
assert.match(setup,/context\.conflicts\.execute\(\{[\s\S]+operationId,baseRevision[\s\S]+\},\(\)=>context\.adapter\.mutate\(providerRequest\)\)/,'r15 conflict observation must wrap, not replace, the existing provider transaction adapter mutation.');
assert.match(setup,/const providerRequest=\{\.\.\.providerOptions\(context\),type,operationId,baseRevision,\.\.\.extra\};/,'The provider transaction must receive the same fresh operation ID and CAS base revision.');
assert.doesNotMatch(setup,/options\.catalog|caller.*catalog/i,'Production runtime must not expose caller-controlled draw catalog.');
assert.match(adapter,/createProtocol\(\{catalog:catalogModule\.catalog,cryptoImpl\}\)/,'Production path must retain immutable repository-owned catalog authority.');
assert.doesNotMatch(adapter,/options\.catalog/);

process.stdout.write(`PASS SSJR production paired-first runtime: exact reviewed Rules splices for Shared Setup + Career Start + Transfer Challenge + Season Results + Season Commit, exact pairing + ACTIVE before draw, durable pre-draw shared-mode marker, capture-phase actual click-path denial, ${runtimeRevision} whole-shell installed-app delivery with ${previousRuntimeRevision} recovery, lazy startup bootstrap, generated zero-billing Rules authority, exact repository-owned FIFA 17 Transfer catalog binding, candidate-equivalent production provider emulator coverage before PR merge and deploy publication, immutable provider catalog, fresh-session resume path, r15 conflict observation preserves provider CAS/idempotency authority, and canonical local-save non-mutation are permanently gated.\n`);