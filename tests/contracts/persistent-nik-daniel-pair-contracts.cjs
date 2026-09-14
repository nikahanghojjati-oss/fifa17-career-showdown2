const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pairSource=read('js/persistentNikDanielPair.js');
const identityBridge=read('js/onlinePlayerIdentity.js');
const identityCore=read('js/onlinePlayerIdentityCore.js');
const rulesFragment=read('firestore.persistent-pair-production.fragment.rules');
const buildWrapper=read('scripts/build-production-firestore-rules.mjs');
const buildCore=read('scripts/build-production-firestore-rules-core.mjs');
const injector=read('scripts/inject-persistent-pair-rules.mjs');

assert.match(pairSource,/feature:"persistent-nik-daniel-pair"/);
assert.match(pairSource,/PAIR_DOC_ID="current"/);
assert.match(pairSource,/playerOne:Object\.freeze\(\{id:"nik",label:"Nik"\}\)/);
assert.match(pairSource,/playerTwo:Object\.freeze\(\{id:"daniel",label:"Daniel"\}\)/);
assert.match(pairSource,/"accounts",context\.accountId,"pairLinks",PAIR_DOC_ID/);
assert.match(pairSource,/context\.pairing\.createPairing\(/);
assert.match(pairSource,/context\.pairing\.redeemPairing\(/);
assert.match(pairSource,/connected\.attachRivalry\(/);
assert.match(pairSource,/migrateExistingConnectedRivalry/);
assert.match(pairSource,/publicDiscovery:false/);
assert.match(pairSource,/billingRequired:false/);
assert.match(pairSource,/persistentAcrossRegisteredBrowsers:true/);
assert.doesNotMatch(pairSource,/\.collection\(|query\(|getDocs\(|listDocuments/);

const pairApi=require(path.join(root,'js/persistentNikDanielPair.js'));
assert.equal(pairApi.managerByRole.playerOne.id,'nik');
assert.equal(pairApi.managerByRole.playerTwo.id,'daniel');
assert.equal(pairApi.roleByManager.nik,'playerOne');
assert.equal(pairApi.roleByManager.daniel,'playerTwo');
assert.equal(pairApi.normalizeRivalryId(`pair_${'a'.repeat(64)}`),`pair_${'a'.repeat(64)}`);
assert.throws(()=>pairApi.normalizeRivalryId('pair_bad'));

assert.match(identityBridge,/CORE_PATH="js\/onlinePlayerIdentityCore\.js"/);
assert.match(identityBridge,/PAIR_PATH="js\/persistentNikDanielPair\.js"/);
assert.match(identityBridge,/pairState\?\.managerId/);
assert.match(identityBridge,/coreApi\.chooseManager\(pairState\.managerId\)/);
assert.match(identityBridge,/persistentPairEnabled:true/);
assert.match(identityCore,/const MANAGERS=Object\.freeze\(\{nik:Object\.freeze\(\{id:"nik",label:"Nik",role:"playerOne"\}\),daniel:Object\.freeze\(\{id:"daniel",label:"Daniel",role:"playerTwo"\}\)\}\)/);
assert.match(identityCore,/FORGET THIS DEVICE/);
assert.match(identityCore,/Career Mode Showdown is online-only/);

assert.match(rulesFragment,/cmsPersistentPairRivalryMembership/);
assert.match(rulesFragment,/activeDevice\(root\.updatedByDeviceId\)/);
assert.match(rulesFragment,/activeDevice\(after\.updatedByDeviceId\)/);
assert.match(rulesFragment,/request\.auth\.uid == accountId/);
assert.match(rulesFragment,/pairId == 'current'/);
assert.match(rulesFragment,/cmsPersistentPairManagerValid\(pairData\.managerRole, pairData\.managerId\)/);
assert.match(rulesFragment,/priorInvite\.data\.data\.expiresAt <= request\.time/);
assert.match(rulesFragment,/allow list, delete: if false/);
assert.doesNotMatch(rulesFragment,/allow list: if true/);

assert.match(buildWrapper,/build-production-firestore-rules-core\.mjs/);
assert.match(buildWrapper,/injectPersistentPairRules/);
assert.ok(buildCore.includes('SSJR_SHARED_SETUP_FUNCTIONS_BEGIN'),'Preserved rules core must retain Shared Setup generation.');
assert.ok(buildCore.includes('ssjrTerminalValidAtomicSessionClose'),'Preserved rules core must retain Terminal Close generation.');
assert.match(injector,/match \\/accounts\\/\\\{accountId\\\}\\/pairLinks\\/\\\{pairId\\\}/);

const build=spawnSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
assert.equal(build.status,0,`production rules build failed: ${build.stderr||build.stdout}`);
const generated=read('firestore.spark.generated.rules');
assert.equal((generated.match(/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/g)||[]).length,1);
assert.equal((generated.match(/function cmsPersistentPairCreateValid\(accountId, pairId\)/g)||[]).length,1);
assert.equal((generated.match(/function cmsPersistentPairUpdateValid\(accountId, pairId\)/g)||[]).length,1);
assert.match(generated,/allow get: if signedIn\(\) && request\.auth\.uid == accountId && pairId == 'current'/);
assert.match(generated,/allow list, delete: if false/);
assert.match(generated,/match \/sharedSetup\/authoritative/);
assert.match(generated,/function ssjrTerminalValidAtomicSessionClose\(rivalryId, sessionId\)/);

console.log('PASS persistent Nik/Daniel pair lifecycle and production authority contracts.');
