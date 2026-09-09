const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const vm=require('node:vm');

cp.execFileSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{stdio:'pipe'});
const base=fs.readFileSync('firestore.spark.rules','utf8');
const generated=fs.readFileSync('firestore.spark.generated.rules','utf8');
const fragment=fs.readFileSync('firestore.shared-setup-production.fragment.rules','utf8');
const careerFragment=fs.readFileSync('firestore.career-start-production.fragment.rules','utf8');
const transferFragment=fs.readFileSync('firestore.transfer-challenge-production.fragment.rules','utf8');
const transferOptionsSource=fs.readFileSync('data/transferOptions.js','utf8');
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
const runtimeRevision=(worker.match(/const RUNTIME_REVISION = "([^"]+)";/)||[])[1];
const previousRuntimeRevision=(worker.match(/const PREVIOUS_RUNTIME_REVISION = "([^"]+)";/)||[])[1];
assert.match(runtimeRevision||'',/^1\.9\.1-r[1-9]\d*$/,'SSJR production runtime must use a v1.9.1 whole-shell identity.');
assert.match(previousRuntimeRevision||'',/^1\.9\.1-r[1-9]\d*$/,'SSJR production runtime must retain one v1.9.1 previous whole-shell identity.');
const runtimeGeneration=Number(runtimeRevision.match(/-r(\d+)$/)[1]);
const previousGeneration=Number(previousRuntimeRevision.match(/-r(\d+)$/)[1]);
const releasePath=runtimeGeneration===1?'RELEASE_V1.9.1.md':`RELEASE_V1.9.1_R${runtimeGeneration}.md`;
assert.ok(fs.existsSync(releasePath),`${releasePath} must exist for the current whole-shell runtime.`);
const release=fs.readFileSync(releasePath,'utf8');

function between(source,start,end){const a=source.indexOf(start),b=source.indexOf(end);assert.ok(a>=0&&b>a,`Missing exact splice markers ${start} / ${end}`);return source.slice(a+start.length,b).trimEnd();}
function once(source,needle,replacement,label){const first=source.indexOf(needle);assert.ok(first>=0,`Missing ${label} sentinel`);assert.equal(source.indexOf(needle,first+needle.length),-1,`Duplicate ${label} sentinel`);return source.slice(0,first)+replacement+source.slice(first);}
function replaceOnce(source,needle,replacement,label){const first=source.indexOf(needle);assert.ok(first>=0,`Missing ${label} seam`);assert.equal(source.indexOf(needle,first+needle.length),-1,`Duplicate ${label} seam`);return source.slice(0,first)+replacement+source.slice(first+needle.length);}
function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function loadTransferCatalog(){
  const sandbox={window:{}};
  vm.runInNewContext(transferOptionsSource,sandbox,{filename:'data/transferOptions.js'});
  const leagues=sandbox.window.FIFA17_TRANSFER_LEAGUES,nationalities=sandbox.window.FIFA17_TRANSFER_NATIONALITIES;
  assert.equal(leagues.length,36,'canonical FIFA 17 Transfer Challenge league count changed unexpectedly');
  assert.equal(nationalities.length,164,'canonical FIFA 17 Transfer Challenge nationality count changed unexpectedly');
  const leagueIds=leagues.map(item=>item.id),nationalityIds=nationalities.map(item=>item.id);
  assert.equal(new Set(leagueIds).size,leagueIds.length,'canonical transfer league IDs must be unique');
  assert.equal(new Set(nationalityIds).size,nationalityIds.length,'canonical transfer nationality IDs must be unique');
  return {leagueIds,nationalityIds};
}
function rulesList(ids){return `[${ids.map(id=>`'${id}'`).join(',')}]`;}
function injectTransferCatalog(functions,catalog){
  const generic="    function ssjrTransferValidOptionId(value) { return value is string && value.size() >= 2 && value.size() <= 80 && value.matches('^[a-z0-9]+(-[a-z0-9]+)*$'); }";
  let output=replaceOnce(functions,generic,`${generic}\n    function ssjrTransferValidLeagueId(value) { return value in ${rulesList(catalog.leagueIds)}; }\n    function ssjrTransferValidNationalityId(value) { return value in ${rulesList(catalog.nationalityIds)}; }`,'Transfer Challenge catalog helper');
  output=replaceOnce(output,"        && (value.type == 'league' || value.type == 'nationality')\n        && ssjrTransferValidOptionId(value.valueId);","        && ((value.type == 'league' && ssjrTransferValidLeagueId(value.valueId))\n          || (value.type == 'nationality' && ssjrTransferValidNationalityId(value.valueId)));",'Transfer Challenge guess catalog validation');
  output=replaceOnce(output,'        && ssjrTransferValidOptionId(value.leagueId)\n        && ssjrTransferValidOptionId(value.nationalityId);','        && ssjrTransferValidLeagueId(value.leagueId)\n        && ssjrTransferValidNationalityId(value.nationalityId);','Transfer Challenge signing catalog validation');
  return output;
}
function ruleMembership(functionName){
  const pattern=new RegExp(`function ${functionName}\\(value\\) \\{ return value in \\[([^\\]]*)\\]; \\}`);
  const match=generated.match(pattern);assert.ok(match,`Generated Rules missing ${functionName} membership helper`);
  return [...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
}
const transferCatalog=loadTransferCatalog();
const functionMarker='// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN',functionEnd='// SSJR_SHARED_SETUP_FUNCTIONS_END',matchMarker='// SSJR_SHARED_SETUP_MATCH_BEGIN',matchEnd='// SSJR_SHARED_SETUP_MATCH_END';
const careerFunctionMarker='// SSJR_CAREER_START_FUNCTIONS_BEGIN',careerFunctionEnd='// SSJR_CAREER_START_FUNCTIONS_END',careerMatchMarker='// SSJR_CAREER_START_MATCH_BEGIN',careerMatchEnd='// SSJR_CAREER_START_MATCH_END';
const transferFunctionMarker='// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN',transferFunctionEnd='// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_END',transferMatchMarker='// SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN',transferMatchEnd='// SSJR_TRANSFER_CHALLENGE_MATCH_END';
const expectedTransferFunctions=injectTransferCatalog(between(transferFragment,transferFunctionMarker,transferFunctionEnd),transferCatalog);
let expectedGenerated=base;
expectedGenerated=once(expectedGenerated,'    function capabilityCanReadPendingRivalry(rivalryId) {',`    ${functionMarker}\n${between(fragment,functionMarker,functionEnd)}\n    ${functionEnd}\n\n    ${careerFunctionMarker}\n${between(careerFragment,careerFunctionMarker,careerFunctionEnd)}\n    ${careerFunctionEnd}\n\n    ${transferFunctionMarker}\n${expectedTransferFunctions}\n    ${transferFunctionEnd}\n\n`,'top-level function insertion');
expectedGenerated=once(expectedGenerated,'      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN',`      ${matchMarker}\n${between(fragment,matchMarker,matchEnd)}\n      ${matchEnd}\n\n      ${careerMatchMarker}\n${between(careerFragment,careerMatchMarker,careerMatchEnd)}\n      ${careerMatchEnd}\n\n      ${transferMatchMarker}\n${between(transferFragment,transferMatchMarker,transferMatchEnd)}\n      ${transferMatchEnd}\n\n`,'rivalry child-match insertion');
if(!expectedGenerated.endsWith('\n'))expectedGenerated+='\n';
assert.equal(generated,expectedGenerated,'Generated production Rules must be the exact reviewed Spark base plus only the bounded Shared Setup, Career Start and Transfer Challenge fragment splices with deterministic canonical Transfer catalog binding.');
assert.deepEqual(ruleMembership('ssjrTransferValidLeagueId'),transferCatalog.leagueIds,'Generated Rules league membership must exactly match the repository FIFA 17 Transfer catalog');
assert.deepEqual(ruleMembership('ssjrTransferValidNationalityId'),transferCatalog.nationalityIds,'Generated Rules nationality membership must exactly match the repository FIFA 17 Transfer catalog');
assert.equal(generated.includes("'invented-league'"),false,'Generated Rules must not admit invented transfer league IDs');
assert.equal(generated.includes("'invented-nationality'"),false,'Generated Rules must not admit invented transfer nationality IDs');

assert.equal(base.includes('match /sharedSetup/authoritative'),false,'Reviewed Spark base must remain unchanged; Shared Setup is additive at build time.');
assert.equal(base.includes('match /careerStart/authoritative'),false,'Reviewed Spark base must remain unchanged; Career Start is additive at build time.');
assert.equal(base.includes('match /transferChallenges/{transferId}'),false,'Reviewed Spark base must remain unchanged; Transfer Challenge is additive at build time.');
assert.equal((generated.match(/match \/sharedSetup\/authoritative/g)||[]).length,1,'Generated provider authority must contain exactly one Shared Setup match.');
assert.equal((generated.match(/match \/careerStart\/authoritative/g)||[]).length,1,'Generated provider authority must contain exactly one Career Start match.');
assert.equal((generated.match(/match \/transferChallenges\/\{transferId\}/g)||[]).length,1,'Generated provider authority must contain exactly one Transfer Challenge match.');
assert.equal((generated.match(/match \/roles\/\{managerRole\}/g)||[]).length,1,'Generated provider authority must contain exactly one Transfer Challenge role-private match.');
for(const required of [
  'function ssjrExactPairedRivalry(rivalryId)',
  'function ssjrWriteAuthorityValid(rivalryId, deviceId, sessionId)',
  "sessionData.state == 'active'",
  'sessionData.expiresAt > request.time',
  "device.data.data.state == 'active'",
  'allow get: if ssjrEntitled(rivalryId)',
  'allow create: if ssjrValidCreateLedger(rivalryId)',
  'allow update: if ssjrValidUpdateLedger(rivalryId)',
  'match /careerStart/authoritative',
  'allow create: if ssjrCareerValidCreate(rivalryId)',
  'allow update: if ssjrCareerValidUpdate(rivalryId)',
  'match /transferChallenges/{transferId}',
  'match /roles/{managerRole}',
  'allow create: if ssjrTransferValidCreate(rivalryId, transferId)',
  'allow update: if ssjrTransferValidUpdate(rivalryId, transferId)',
  'allow create: if ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole)',
  'allow update: if ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole)',
  'function ssjrTransferValidLeagueId(value)',
  'function ssjrTransferValidNationalityId(value)',
  "request.time >= before.startedAt + duration.value(15, 'm')",
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role))',
  "setup.phase == 'SHOWDOWN_CONFIRMED'",
  "after.phase == 'CAREER_START_READY'",
  'allow list, delete: if false',
  "after.totalSeasons == 1 || after.totalSeasons == 3 || after.totalSeasons == 5 || after.totalSeasons == 10"
]) assert.ok(generated.includes(required),`Generated production Rules missing ${required}`);
for(const forbidden of [/cloud\s*run/i,/cloud\s*functions/i,/blaze/i,/payment method/i,/purchased credits/i])assert.doesNotMatch(`${fragment}\n${careerFragment}\n${transferFragment}`,forbidden,'Shared Journey production Rules must remain zero-billing/Spark compatible.');
assert.match(generated,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/,'Generated authority must retain global deny-by-default fallback.');

assert.match(workflow,/FIREBASE_RULES_FILE: firestore\.spark\.generated\.rules/,'Zero-billing workflow must publish generated authority.');
assert.match(workflow,/firestore\.career-start-production\.fragment\.rules/,'Zero-billing workflow must rebuild when the reviewed Career Start fragment changes.');
assert.match(workflow,/firestore\.transfer-challenge-production\.fragment\.rules/,'Zero-billing workflow must rebuild when the reviewed Transfer Challenge fragment changes.');
assert.match(workflow,/node scripts\/build-production-firestore-rules\.mjs/,'Deployment must deterministically rebuild reviewed source.');
assert.match(workflow,/shared-showdown-setup-production-provider-emulator\.cjs/,'Deployment must reprove generated Shared Setup Rules with the adversarial provider matrix before authentication and publication.');
assert.match(workflow,/shared-transfer-challenge-contracts\.cjs/,'Deployment must reprove the Transfer Challenge provider/privacy boundary before publication.');
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
assert.match(bootstrap,/productionSharedCareerStart\.js/,'Ordinary SSJR bootstrap must install the post-confirmation Career Start product surface.');
assert.match(bootstrap,/\.then\(\(\)=>\{\s*const api=root\[key\]/,'Lazy SSJR bootstrap must re-read the named API after the boolean runtime-loader completion signal.');
assert.match(bootstrap,/if\(!api\|\|typeof api\.install!=="function"\)throw/,'Lazy SSJR bootstrap must fail closed if the loaded entry or guard is not installable.');
assert.match(bootstrap,/api\.install\(\)/,'Lazy SSJR bootstrap must install paired-first runtime surfaces after loading.');
assert.doesNotMatch(bootstrap,/localStorage/,'Lazy SSJR bootstrap must never touch canonical local saves.');
assert.ok(runtimeGeneration>=3,'Paired-first production runtime must publish under r3 or a newer fresh whole-shell revision.');
assert.equal(previousGeneration,runtimeGeneration-1,'Current SSJR whole-shell runtime must retain the immediately previous whole-shell revision as recovery target.');
for(const path of ['js/ssjr.js','js/productionSharedJourneyEntry.js','js/productionSharedJourneyGuard.js','js/productionSharedShowdownSetup.js','js/sharedShowdownSetup.js','js/sharedShowdownCatalog.js','js/sparkSharedShowdownSetup.js'])assert.ok(worker.includes(`"${path}"`),`Installed-app ${runtimeRevision} shell must cache ${path}.`);
assert.match(menu,new RegExp(`assets\\/marco-reus-2015-cc-by\\.webp\\?v=${escapeRegExp(runtimeRevision)}`),'Lazy menu visual must use the current whole-shell identity.');
assert.ok(release.includes(`Runtime asset revision: \`${runtimeRevision}\``),'Current release record must identify the exact whole-shell revision.');
assert.ok(release.includes(`Previous known-good runtime: \`${previousRuntimeRevision}\``),'Current release record must identify the exact previous whole-shell recovery target.');
assert.match(release,/SSJR-1\.1[\s\S]+`0\/100`/,'Current publication record must not claim SSJR credit from source or deployment.');

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
assert.match(setup,/context\.adapter\.mutate\(\{[\s\S]+type,operationId:randomOperationId\(\),baseRevision:current\.revision/,'All mutations must use provider transaction adapter CAS plus fresh idempotency operation.');
assert.doesNotMatch(setup,/options\.catalog|caller.*catalog/i,'Production runtime must not expose caller-controlled draw catalog.');
assert.match(adapter,/createProtocol\(\{catalog:catalogModule\.catalog,cryptoImpl\}\)/,'Production path must retain immutable repository-owned catalog authority.');
assert.doesNotMatch(adapter,/options\.catalog/);

process.stdout.write(`PASS SSJR production paired-first runtime: exact reviewed Rules splices for Shared Setup + Career Start + Transfer Challenge, exact pairing + ACTIVE before draw, durable pre-draw shared-mode marker, capture-phase actual click-path denial, ${runtimeRevision} whole-shell installed-app delivery with ${previousRuntimeRevision} recovery, lazy startup bootstrap, generated zero-billing Rules authority, exact repository-owned FIFA 17 Transfer catalog binding, candidate-equivalent production provider emulator coverage before PR merge and deploy publication, immutable provider catalog, fresh-session resume path, and canonical local-save non-mutation are permanently gated.\n`);