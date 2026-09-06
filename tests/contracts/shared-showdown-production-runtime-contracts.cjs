const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');

cp.execFileSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{stdio:'pipe'});
const base=fs.readFileSync('firestore.spark.rules','utf8');
const generated=fs.readFileSync('firestore.spark.generated.rules','utf8');
const fragment=fs.readFileSync('firestore.shared-setup-production.fragment.rules','utf8');
const workflow=fs.readFileSync('.github/workflows/deploy-firestore-rules-zero-billing.yml','utf8');
const publisher=fs.readFileSync('scripts/publish-firestore-rules-zero-billing.mjs','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const entry=fs.readFileSync('js/productionSharedJourneyEntry.js','utf8');
const guard=fs.readFileSync('js/productionSharedJourneyGuard.js','utf8');
const setup=fs.readFileSync('js/productionSharedShowdownSetup.js','utf8');
const adapter=fs.readFileSync('js/sparkSharedShowdownSetup.js','utf8');

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
assert.ok(generated.includes(base.slice(0,4000)),'Generated authority must retain the audited Spark base prefix.');
assert.ok(generated.endsWith(base.slice(-700)),'Generated authority must retain the audited Spark base deny-by-default suffix.');

assert.match(workflow,/FIREBASE_RULES_FILE: firestore\.spark\.generated\.rules/,'Zero-billing workflow must publish generated authority.');
assert.match(workflow,/node scripts\/build-production-firestore-rules\.mjs/,'Deployment must deterministically rebuild reviewed source.');
assert.match(workflow,/node scripts\/publish-firestore-rules-zero-billing\.mjs/,'Deployment must use the reviewed Rules-only publisher.');
assert.match(publisher,/urn:ietf:params:oauth:grant-type:jwt-bearer/,'Publisher must use canonical OAuth JWT bearer grant.');
assert.match(publisher,/firebaserules\.googleapis\.com\/v1/,'Publisher must remain Firebase Rules API-only.');
assert.match(publisher,/Creating a ruleset compiles\/validates/,'Provider compilation must precede release mutation.');
assert.match(publisher,/Provider source did not exactly match generated production authority/,'Provider publication must end with exact source readback.');
assert.doesNotMatch(`${workflow}\n${publisher}`,/enable-billing|billingAccounts|cloudfunctions\.googleapis|run\.googleapis/i,'Publication must never activate billing, Functions or Cloud Run.');

assert.match(app,/productionSharedJourneyEntry\.js/,'Production startup must install paired-first Shared Journey entry.');
assert.match(app,/productionSharedJourneyGuard\.js/,'Production startup must install the direct draw bypass guard.');
assert.match(entry,/START SHARED SHOWDOWN/);
assert.match(entry,/setPending\(true\)[\s\S]+createShowdown\(\)/,'Shared journey lock must exist before the pre-draw Save shell routes to local league UI.');
assert.match(entry,/spinLeague/);
assert.match(entry,/openClubPack/);
assert.match(entry,/remote\.sessionState==="active"/,'Shared Setup entry must require exact ACTIVE private session.');
assert.match(entry,/remote\.rivalryId===rivalry\.rivalryId/);
assert.match(entry,/remote\.accountId===account\.accountId/);
assert.match(entry,/remote\.deviceId===pairing\.deviceId/);
assert.doesNotMatch(entry,/localStorage/,'Shared journey entry marker must never use canonical localStorage.');
for(const functionName of ['handleLeagueWheelAction','spinLeagueWheel','confirmLeagueSelectionAndContinue','prepareClubAssignment','assignClubs','continueToShowdownHome'])assert.ok(guard.includes(`"${functionName}"`),`Shared mode must guard direct ${functionName} calls.`);
assert.match(guard,/if\(pending\(\)\)return deny\(name\)/,'Direct local draw calls must fail closed while shared mode is pending.');
assert.doesNotMatch(guard,/localStorage/,'Bypass guard must never touch canonical localStorage.');

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

process.stdout.write('PASS SSJR production paired-first runtime: exact pairing + ACTIVE before draw, direct local-draw bypass denial, generated zero-billing Rules authority, immutable provider catalog, fresh-session resume path, and canonical local-save non-mutation are permanently gated.\n');
