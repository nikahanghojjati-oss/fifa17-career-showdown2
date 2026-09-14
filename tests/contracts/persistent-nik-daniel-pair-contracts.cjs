const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pairSource=read('js/persistentNikDanielPair.js');
const identitySource=read('js/onlinePlayerIdentity.js');
const appSource=read('js/app.js');
const rulesFragment=read('firestore.persistent-pair-production.fragment.rules');
const sharedJourneyBuilder=read('scripts/build-production-firestore-rules.mjs');
const pairBuilder=read('scripts/build-production-firestore-rules-with-persistent-pair.mjs');
const injector=read('scripts/inject-persistent-pair-rules.mjs');
const deployWorkflow=read('.github/workflows/deploy-firestore-rules-zero-billing.yml');

assert.match(pairSource,/feature:"persistent-nik-daniel-pair"/);
assert.match(pairSource,/PAIR_DOC_ID="current"/);
assert.match(pairSource,/playerOne:Object\.freeze\(\{id:"nik",label:"Nik"\}\)/);
assert.match(pairSource,/playerTwo:Object\.freeze\(\{id:"daniel",label:"Daniel"\}\)/);
assert.match(pairSource,/"accounts",context\.accountId,"pairLinks",PAIR_DOC_ID/);
assert.match(pairSource,/context\.pairing\.createPairing\(/);
assert.match(pairSource,/context\.pairing\.redeemPairing\(/);
assert.match(pairSource,/connected\.attachRivalry\(/);
assert.match(pairSource,/pairMigrateExistingConnectedRivalry/);
assert.match(pairSource,/publicDiscovery:false/);
assert.match(pairSource,/billingRequired:false/);
assert.match(pairSource,/persistentAcrossRegisteredBrowsers:true/);
assert.match(pairSource,/state\.connectionState==="pending-pair"&&state\.capability/);
assert.match(pairSource,/pairCopyText\(state\.capability\)/);
assert.doesNotMatch(pairSource,/\.collection\(|query\(|getDocs\(|listDocuments/);

const pairApi=require(path.join(root,'js/persistentNikDanielPair.js'));
assert.equal(pairApi.managerByRole.playerOne.id,'nik');
assert.equal(pairApi.managerByRole.playerTwo.id,'daniel');
assert.equal(pairApi.roleByManager.nik,'playerOne');
assert.equal(pairApi.roleByManager.daniel,'playerTwo');
assert.equal(pairApi.normalizeRivalryId(`pair_${'a'.repeat(64)}`),`pair_${'a'.repeat(64)}`);
assert.throws(()=>pairApi.normalizeRivalryId('pair_bad'));

assert.match(identitySource,/const MANAGERS=Object\.freeze\(\{nik:Object\.freeze\(\{id:"nik",label:"Nik",role:"playerOne"\}\),daniel:Object\.freeze\(\{id:"daniel",label:"Daniel",role:"playerTwo"\}\)\}\)/);
assert.match(identitySource,/"WHO ARE YOU\?"/);
assert.match(identitySource,/"FORGET THIS DEVICE"/);
assert.match(identitySource,/pairing\.revokeDevice/);
assert.match(identitySource,/Career Mode Showdown is online-only/);
assert.match(identitySource,/function syncPersistentPairSidecar\(\)/);
assert.match(identitySource,/loadOnlineDependency\("persistent-pair","js\/persistentNikDanielPair\.js"/);
assert.match(identitySource,/pair\.initialize\(\{force:true\}\)/);
assert.match(identitySource,/pairState\.managerId!==state\.managerId/);
assert.match(identitySource,/writeOnlineRole\(accountId,selected\.id\)/);
assert.match(identitySource,/Pair recovered from your account\./);
assert.doesNotMatch(appSource,/persistentNikDanielPair|persistent-nik-daniel-pair/,'Persistent pair must stay behind the lazy online identity boundary and out of the initial app bundle.');

assert.match(rulesFragment,/cmsPersistentPairRivalryMembership/);
assert.match(rulesFragment,/activeDevice\(root\.updatedByDeviceId\)/);
assert.match(rulesFragment,/activeDevice\(after\.updatedByDeviceId\)/);
assert.match(rulesFragment,/request\.auth\.uid == accountId/);
assert.match(rulesFragment,/pairId == 'current'/);
assert.match(rulesFragment,/cmsPersistentPairManagerValid\(pairData\.managerRole, pairData\.managerId\)/);
assert.match(rulesFragment,/priorInvite\.data\.data\.expiresAt <= request\.time/);
assert.match(rulesFragment,/allow list, delete: if false/);
assert.doesNotMatch(rulesFragment,/allow list: if true/);

assert.ok(sharedJourneyBuilder.includes('SSJR_SHARED_SETUP_FUNCTIONS_BEGIN'),'Reviewed Shared Journey builder must retain Shared Setup generation.');
assert.ok(sharedJourneyBuilder.includes('ssjrTerminalValidAtomicSessionClose'),'Reviewed Shared Journey builder must retain Terminal Close generation.');
assert.doesNotMatch(sharedJourneyBuilder,/injectPersistentPairRules|persistent-pair-production/,'The reviewed Shared Journey builder must remain independent of the persistent-pair stage.');
assert.match(pairBuilder,/build-production-firestore-rules\.mjs/);
assert.match(pairBuilder,/injectPersistentPairRules/);
assert.ok(injector.includes('match /accounts/{accountId}/pairLinks/{pairId}'));
assert.match(deployWorkflow,/node scripts\/build-production-firestore-rules-with-persistent-pair\.mjs/);
assert.match(deployWorkflow,/tests\/firebase\/persistent-nik-daniel-pair-provider-emulator\.cjs/);

const baseBuild=spawnSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
assert.equal(baseBuild.status,0,`Shared Journey production rules build failed: ${baseBuild.stderr||baseBuild.stdout}`);
const sharedOnly=read('firestore.spark.generated.rules');
assert.equal(sharedOnly.includes('match /accounts/{accountId}/pairLinks/{pairId}'),false,'The existing exact Shared Journey output must remain unchanged before the bounded pair stage.');

const pairBuild=spawnSync(process.execPath,['scripts/build-production-firestore-rules-with-persistent-pair.mjs'],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
assert.equal(pairBuild.status,0,`persistent-pair production rules build failed: ${pairBuild.stderr||pairBuild.stdout}`);
const generated=read('firestore.spark.generated.rules');
assert.equal((generated.match(/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/g)||[]).length,1);
assert.equal((generated.match(/function cmsPersistentPairCreateValid\(accountId, pairId\)/g)||[]).length,1);
assert.equal((generated.match(/function cmsPersistentPairUpdateValid\(accountId, pairId\)/g)||[]).length,1);
assert.match(generated,/allow get: if signedIn\(\) && request\.auth\.uid == accountId && pairId == 'current'/);
assert.match(generated,/allow list, delete: if false/);
assert.match(generated,/match \/sharedSetup\/authoritative/);
assert.match(generated,/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/);

console.log('PASS persistent Nik/Daniel pair lifecycle, lazy identity seeding and bounded production authority contracts.');
