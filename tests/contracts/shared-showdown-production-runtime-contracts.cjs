const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');

cp.execFileSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{stdio:'pipe'});
const base=fs.readFileSync('firestore.spark.rules','utf8');
const generated=fs.readFileSync('firestore.spark.generated.rules','utf8');
const fragment=fs.readFileSync('firestore.shared-setup-production.fragment.rules','utf8');
const workflow=fs.readFileSync('.github/workflows/deploy-firestore-rules-zero-billing.yml','utf8');
const stage3=fs.readFileSync('.github/workflows/validate-stage3-private-pairing.yml','utf8');
const publisher=fs.readFileSync('scripts/publish-firestore-rules-zero-billing.mjs','utf8');
const productionEmulator=fs.readFileSync('tests/firebase/shared-showdown-setup-production-provider-emulator.cjs','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const bootstrap=fs.readFileSync('js/ssjr.js','utf8');
const entry=fs.readFileSync('js/productionSharedJourneyEntry.js','utf8');
const guard=fs.readFileSync('js/productionSharedJourneyGuard.js','utf8');
const setup=fs.readFileSync('js/productionSharedShowdownSetup.js','utf8');
const adapter=fs.readFileSync('js/sparkSharedShowdownSetup.js','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');
const menu=fs.readFileSync('js/menuExperience.js','utf8');
const release=fs.readFileSync('RELEASE_V1.9.1_R3.md','utf8');

function between(source,start,end){const a=source.indexOf(start),b=source.indexOf(end);assert.ok(a>=0&&b>a,`Missing exact splice markers ${start} / ${end}`);return source.slice(a+start.length,b).trimEnd();}
function once(source,needle,replacement,label){const first=source.indexOf(needle);assert.ok(first>=0,`Missing ${label} sentinel`);assert.equal(source.indexOf(needle,first+needle.length),-1,`Duplicate ${label} sentinel`);return source.slice(0,first)+replacement+source.slice(first);}
const functionMarker='// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN',functionEnd='// SSJR_SHARED_SETUP_FUNCTIONS_END',matchMarker='// SSJR_SHARED_SETUP_MATCH_BEGIN',matchEnd='// SSJR_SHARED_SETUP_MATCH_END';
let expectedGenerated=base;
expectedGenerated=once(expectedGenerated,'    function capabilityCanReadPendingRivalry(rivalryId) {',`    ${functionMarker}\n${between(fragment,functionMarker,functionEnd)}\n    ${functionEnd}\n\n`,'top-level function insertion');
expectedGenerated=once(expectedGenerated,'      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN',`      ${matchMarker}\n${between(fragment,matchMarker,matchEnd)}\n      ${matchEnd}\n\n`,'rivalry child-match insertion');
if(!expectedGenerated.endsWith('\n'))expectedGenerated+='\n';
assert.equal(generated,expectedGenerated,'Generated production Rules must be the exact reviewed Spark base plus only the two bounded Shared Setup fragment splices.');

assert.equal(base.includes('match /sharedSetup/authoritative'),false,'Reviewed Spark base must remain unchanged; Shared Setup is additive at build time.');
assert.equal((generated.match(/match \/sharedSetup\/authoritative/g)||[]).length,1,'Generated provider authority must contain exactly one Shared Setup match.');
for(const required of [
  'function ssjrExactPairedRivalry(rivalryId)',
  'function ssjrWriteAuthorityValid(rivalryId, deviceId, sessionId)',
  "sessionData.state == 'active'",
  'sessionData.expiresAt > request.time',
  "device.data.data.state == 'active'",
  'allow get: if ssjrEntitled(rivalryId)',
  'allow create: if ssjrValidCreateLedger(rivalryId)',
  'allow update: if ssjrValidUpdateLedger(rivalryId)',
  'allow list, delete: if false',
  "after.totalSeasons == 1 || after.totalSeasons == 3 || after.totalSeasons == 5 || after.totalSeasons == 10"
]) assert.ok(generated.includes(required),`Generated production Rules missing ${required}`);
for(const forbidden of [/cloud\s*run/i,/cloud\s*functions/i,/blaze/i,/payment method/i,/purchased credits/i])assert.doesNotMatch(fragment,forbidden,'Shared Setup production Rules must remain zero-billing/Spark compatible.');
assert.match(generated,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/,'Generated authority must retain global deny-by-default fallback.');

assert.match(workflow,/FIREBASE_RULES_FILE: firestore\.spark\.generated\.rules/,'Zero-billing workflow must publish generated authority.');
assert.match(workflow,/node scripts\/build-production-firestore-rules\.mjs/,'Deployment must deterministically rebuild reviewed source.');
assert.match(workflow,/shared-showdown-setup-production-provider-emulator\.cjs/,'Deployment must reprove generated Shared Setup Rules with the adversarial provider matrix before authentication and publication.');
assert.match(workflow,/node scripts\/publish-firestore-rules-zero-billing\.mjs/,'Deployment must use the reviewed Rules-only publisher.');
assert.match(publisher,/urn:ietf:params:oauth:grant-type:jwt-bearer/,'Publisher must use canonical OAuth JWT bearer grant.');
assert.match(publisher,/firebaserules\.googleapis\.com\/v1/,'Publisher must remain Firebase Rules API-only.');
assert.match(publisher,/Creating a ruleset compiles\/validates/,'Provider compilation must precede release mutation.');
assert.match(publisher,/Provider source did not exactly match generated production authority/,'Provider publication must end with exact source readback.');
assert.doesNotMatch(`${workflow}\n${publisher}`,/enable-billing|billingAccounts|cloudfunctions\.googleapis|run\.googleapis/i,'Publication must never activate billing, Functions or Cloud Run.');

assert.match(stage3,/node scripts\/build-production-firestore-rules\.mjs/,'Permanent Stage 3 family must build the exact generated production Rules authority before emulator proof.');
assert.match(stage3,/shared-showdown-setup-production-provider-emulator\.cjs/,'Permanent Stage 3 family must execute the production generated-Rules provider emulator.');
assert.match(stage3,/firebase-tools@15\.28\.1 emulators:exec/,'Production provider emulator must remain on the pinned Firebase emulator toolchain.');
assert.match(productionEmulator,/shared-showdown-setup-provider-emulator\.cjs/,'Production Rules proof must reuse the already-reviewed two-manager provider harness.');
assert.match(productionEmulator,/const candidatePattern=/,'Production wrapper must declare the exact candidate Rules source seam as one transform pattern.');
assert.ok(productionEmulator.includes('firestore\\.shared-setup-candidate\\.rules'),'Production wrapper must identify the exact escaped candidate Rules source seam.');
assert.match(productionEmulator,/assert\.equal\(matches\.length,1/,'Production wrapper must require exactly one reviewed candidate Rules seam before substitution.');
assert.match(productionEmulator,/source\.replace\(candidatePattern,'fs\.readFileSync\("firestore\.spark\.generated\.rules","utf8"\)'\)/,'Production wrapper must substitute only the generated provider authority at that one seam.');

assert.match(app,/js\/ssjr\.js/,'Protected startup shell must lazy-load the SSJR bootstrap during the startup splash.');
assert.match(bootstrap,/productionFirebaseRuntime\.js/,'Lazy SSJR bootstrap must preserve the production Firebase runtime.');
assert.match(bootstrap,/productionSharedJourneyEntry\.js/,'Lazy SSJR bootstrap must install paired-first Shared Journey entry.');
assert.match(bootstrap,/productionSharedJourneyGuard\.js/,'Lazy SSJR bootstrap must install the direct draw bypass guard.');
assert.match(bootstrap,/\.then\(\(\)=>\{\s*const api=root\[key\]/,'Lazy SSJR bootstrap must re-read the named API after the boolean runtime-loader completion signal.');
assert.match(bootstrap,/if\(!api\|\|typeof api\.install!=="function"\)throw/,'Lazy SSJR bootstrap must fail closed if the loaded entry or guard is not installable.');
assert.match(bootstrap,/api\.install\(\)/,'Lazy SSJR bootstrap must install paired-first runtime surfaces after loading.');
assert.doesNotMatch(bootstrap,/localStorage/,'Lazy SSJR bootstrap must never touch canonical local saves.');
assert.match(worker,/const RUNTIME_REVISION = "1\.9\.1-r3";/,'Paired-first production runtime must publish under a fresh whole-shell revision.');
assert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\.9\.1-r2";/,'The last production-proven r2 shell must remain the whole-shell rollback target.');
for(const path of ['js/ssjr.js','js/productionSharedJourneyEntry.js','js/productionSharedJourneyGuard.js','js/productionSharedShowdownSetup.js','js/sharedShowdownSetup.js','js/sharedShowdownCatalog.js','js/sparkSharedShowdownSetup.js'])assert.ok(worker.includes(`"${path}"`),`Installed-app r3 shell must cache ${path}.`);
assert.match(menu,/assets\/marco-reus-2015-cc-by\.webp\?v=1\.9\.1-r3/,'Lazy menu visual must use the current r3 shell identity.');
assert.match(release,/Runtime asset revision: `1\.9\.1-r3`/);
assert.match(release,/Previous known-good runtime: `1\.9\.1-r2`/);
assert.match(release,/SSJR-1\.1[\s\S]+`0\/100`/,'r3 publication record must not claim SSJR credit from source or deployment.');

assert.match(entry,/START SHARED SHOWDOWN/);
assert.match(entry,/setPending\(true\)[\s\S]+createShowdown\(\)[\s\S]+persistPendingMarker\(\)/,'Shared journey must establish its transient lock, create the pre-draw shell, then persist the durable shared-mode marker before setup continues.');
assert.match(entry,/sharedJourney=\{contractVersion:1,mode:"shared",setupPending:true\}/,'The non-secret shared-mode marker must live with the saved shell.');
assert.match(entry,/runtime\.saveCurrentShowdown\(\)!==true/,'The shared-mode marker must be committed through Save Library authority.');
assert.match(entry,/if\(!persistedPending\(\)\)/,'The saved marker must round-trip before shared setup continues.');
assert.match(entry,/if\(shellCreated&&!markerPersisted\)discardUnmarkedShell\(\)/,'A failed durable marker write must not leave an unmarked bypassable shell.');
assert.match(entry,/remote\.sessionState==="active"/,'Shared Setup entry must require exact ACTIVE private session.');
assert.match(entry,/remote\.rivalryId===rivalry\.rivalryId/);
assert.match(entry,/remote\.accountId===account\.accountId/);
assert.match(entry,/remote\.deviceId===pairing\.deviceId/);
assert.doesNotMatch(entry,/localStorage/,'Shared journey entry marker must never use raw canonical localStorage.');
for(const functionName of ['handleLeagueWheelAction','spinLeagueWheel','confirmLeagueSelectionAndContinue','prepareClubAssignment','assignClubs','continueToShowdownHome'])assert.ok(guard.includes(`"${functionName}"`),`Shared mode must guard direct ${functionName} calls.`);
assert.match(guard,/CLICK_TARGETS=Object\.freeze\(\{spinLeague:"league selection",openClubPack:"club assignment",continueClubAssignment:"local rivalry confirmation"\}\)/,'Actual bound league/club controls must be capture-gated.');
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
assert.match(setup,/context\.adapter\.mutate\(\{[\s\S]+type,operationId:randomOperationId\(\),baseRevision:current\.revision/,'All mutations must use provider transaction adapter CAS plus fresh idempotency operation.');
assert.doesNotMatch(setup,/options\.catalog|caller.*catalog/i,'Production runtime must not expose caller-controlled draw catalog.');
assert.match(adapter,/createProtocol\(\{catalog:catalogModule\.catalog,cryptoImpl\}\)/,'Production path must retain immutable repository-owned catalog authority.');
assert.doesNotMatch(adapter,/options\.catalog/);

process.stdout.write('PASS SSJR production paired-first runtime: exact reviewed Rules splice, exact pairing + ACTIVE before draw, durable pre-draw shared-mode marker, capture-phase actual click-path denial, r3 whole-shell installed-app delivery with r2 recovery, lazy startup bootstrap, generated zero-billing Rules authority, candidate-equivalent production provider emulator coverage before PR merge and deploy publication, immutable provider catalog, fresh-session resume path, and canonical local-save non-mutation are permanently gated.\n');
