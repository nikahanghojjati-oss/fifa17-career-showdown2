from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    s = p.read_text()
    n = s.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected one match, found {n}")
    p.write_text(s.replace(old, new, 1))


def splice(path, start, end, replacement, label):
    p = Path(path)
    s = p.read_text()
    a = s.find(start)
    b = s.find(end, a + len(start))
    if a < 0 or b < 0 or s.find(start, a + 1) >= 0:
        raise SystemExit(f"{label}: splice anchors invalid")
    p.write_text(s[:a] + replacement + s[b:])


replace_once(
    "service-worker.js",
    '    "js/onlinePlayerIdentity.js",\n',
    '    "js/onlinePlayerIdentity.js",\n    "js/persistentNikDanielPair.js",\n',
    "service-worker persistent pair shell path",
)

create_fn = '''  async function createPairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const binding=normalizeLocalBinding(options.binding);
      const durableWitness=options.durableWitness;
      if(durableWitness!==undefined&&durableWitness!==null&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","A valid durable pairing witness is required.");
      const ttlMs=options.ttlMs===undefined?PAIRING_TTL_MS:Number(options.ttlMs);
      if(!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>MAX_PAIRING_TTL_MS)throw errorWithCode("PAIRING_TTL_INVALID","Private pairing expiry must be within 30 minutes.");
      const capability=normalizeCapability(options.capability||randomId("pair_",PAIRING_CAPABILITY_BYTES,options.cryptoImpl||root.crypto));
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const createdAt=sdk.Timestamp.fromMillis(nowEpochMs);
      const expiresAt=sdk.Timestamp.fromMillis(nowEpochMs+ttlMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const {managerSlots,invitedRole}=buildManagerSlots(accountId,binding);
      const durableWitnessResult=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalryData={connectionState:"pending-pair",connectionStateBeforeDeletion:null,managerSlots,authorizedAccountIds:[accountId],createdByAccountId:accountId,createdAt};
        const inviteData={purpose:"rivalry-pairing",slotId:invitedRole,createdByAccountId:accountId,createdAt,expiresAt,state:"open",redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        let witness=null;
        if(durableWitness){
          witness=await durableWitness({transaction,binding,capability,accountId,deviceId:identity.deviceId,now:createdAt,nowEpochMs});
          if(!witness||witness.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The durable creator pairing witness could not be committed.");
        }
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
        return witness;
      });
      return {ok:true,rivalryId:capability,inviteId:capability,capability,slotId:invitedRole,expiresAtEpochMs:nowEpochMs+ttlMs,creatorBinding:binding,durableWitness:durableWitnessResult};
    }catch(error){return asResultError(error,"PAIRING_CREATE_FAILED");}
  }

'''
splice(
    "js/sparkPrivatePairing.js",
    "  async function createPairing(options={}){",
    "  function assertPairingDocuments",
    create_fn,
    "spark createPairing",
)

witness_block = '''function pairTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
function pairCreateDurablePairWitness(context,role,manager,expectedRivalryId,connectionState){const sdk=context.services.firestoreSdk,normalizedRole=pairNormalizeManagerRole(role),expected=expectedRivalryId?pairNormalizeRivalryId(expectedRivalryId):null;return async({transaction,binding,capability,now,nowEpochMs})=>{const normalizedRivalryId=pairNormalizeRivalryId(capability);if(expected&&normalizedRivalryId!==expected)throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","The Showdown connection changed during provider mutation.");if(!binding||binding.managerRole!==normalizedRole||!pairValidSaveId(binding.saveId)||!pairValidProfileId(binding.profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The local career identity is invalid.");const pairRef=pairLinkReference(context),pairSnapshot=await transaction.get(pairRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId);if(existing.managerRole!==normalizedRole||existing.managerId!==manager.id)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This account has invalid player data. Forget this device and start again.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId));if(!oldSnapshot.exists()||!pairIsEnvelopeValue(oldSnapshot.data(),"rivalry",existing.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");const oldState=oldSnapshot.data().data?.connectionState;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(oldState==="pending-pair"){const oldInviteRef=sdk.doc(context.services.firestore,"rivalries",existing.rivalryId,"invites",existing.rivalryId),oldInviteSnapshot=await transaction.get(oldInviteRef),oldInvite=oldInviteSnapshot.exists()?oldInviteSnapshot.data():null,expiresAt=pairTimestampMillis(oldInvite?.data?.expiresAt),stillOpen=pairIsEnvelopeValue(oldInvite,"invite",existing.rivalryId)&&oldInvite.data?.state==="open"&&Number.isFinite(expiresAt)&&expiresAt>nowEpochMs;if(stillOpen)throw pairErrorWithCode("PERSISTENT_PAIR_PENDING_CONFLICT","This account already has a connection code waiting for the other player.");}else if(oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}const data={rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,linkedAt,lastConfirmedAt:now},envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});transaction.set(pairRef,envelope);return{ok:true,rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,managerLabel:manager.label,connectionState,providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:envelope.revision};};}
function pairCreateDurableCreationWitness(context,role,manager){return pairCreateDurablePairWitness(context,role,manager,null,"pending-pair");}
function pairCreateDurableRedemptionWitness(context,role,manager,rivalryId){return pairCreateDurablePairWitness(context,role,manager,rivalryId,"active");}

'''
splice(
    "js/persistentNikDanielPair.js",
    "function pairTimestampMillis(value){",
    "  async function pairInitialize",
    witness_block,
    "persistent pair witness helpers",
)

start_fn = '''  async function pairStartPairing(options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;pairSetState({status:"starting",busy:true,message:"Preparing your Showdown…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role),binding=await pairEnsurePreparedBinding(context,role),durableWitness=pairCreateDurableCreationWitness(context,role,manager);const result=await context.pairing.createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto}),binding,cryptoImpl:root.crypto,durableWitness});if(!result?.ok)throw pairErrorWithCode(result?.code||"PERSISTENT_PAIR_CREATE_FAILED",result?.message||"The connection code could not be created.");const link=result.durableWitness;if(!link?.ok||link.rivalryId!==result.rivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_FAILED","The connection code could not be bound to durable account authority.");const other=role==="playerOne"?"Nik":"Daniel";return pairSetState({status:"waiting",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"pending-pair",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:result.capability,message:`Send this code to ${other}. It is needed only once.`});}catch(error){return pairSetState({status:error?.code?.includes("SHARED_SHELL")?"save-required":"error",busy:false,message:error?.message||"The Showdown could not be started."});}}
'''
splice(
    "js/persistentNikDanielPair.js",
    "  async function pairStartPairing(options={}){",
    "  async function pairJoinPairing",
    start_fn,
    "persistent pair start",
)

rules = Path("firestore.persistent-pair-production.fragment.rules")
rs = rules.read_text()
anchor = "    function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {\n"
creation = '''    function cmsPersistentPairCreationWitnessValid(rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && activeDevice(pair.data.updatedByDeviceId)
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && cmsPersistentPairRivalryMembership(request.auth.uid, rivalryId, pairData.managerRole);
    }

'''
if rs.count(anchor) != 1:
    raise SystemExit("creation witness rules anchor drifted")
rules.write_text(rs.replace(anchor, creation + anchor, 1))

inj = Path("scripts/inject-persistent-pair-rules.mjs")
s = inj.read_text()
old = """  generated=replaceOnce(generated,'        && validRivalryData(after.data)\\n        && before.data.connectionState == \"pending-pair\"','        && validRivalryData(after.data)\\n        && cmsPersistentPairRedemptionWitnessValid(rivalryId, inviteBefore.data.slotId)\\n        && before.data.connectionState == \"pending-pair\"','persistent pair redemption witness');"""
new = """  generated=replaceOnce(generated,'        && validRivalryData(data)\\n        && data.connectionState == \"pending-pair\"','        && validRivalryData(data)\\n        && cmsPersistentPairCreationWitnessValid(rivalryId)\\n        && data.connectionState == \"pending-pair\"','persistent pair creation witness');
  generated=replaceOnce(generated,'        && validRivalryData(after.data)\\n        && before.data.connectionState == \"pending-pair\"','        && validRivalryData(after.data)\\n        && cmsPersistentPairRedemptionWitnessValid(rivalryId, inviteBefore.data.slotId)\\n        && before.data.connectionState == \"pending-pair\"','persistent pair redemption witness');"""
if s.count(old) != 1:
    raise SystemExit("injector redemption seam drifted")
s = s.replace(old, new, 1)
needle = "    'function cmsPersistentPairRedemptionWitnessValid(rivalryId, role)',"
if s.count(needle) != 1:
    raise SystemExit("injector required marker drifted")
s = s.replace(
    needle,
    "    'function cmsPersistentPairCreationWitnessValid(rivalryId)',\n    'cmsPersistentPairCreationWitnessValid(rivalryId)',\n" + needle,
    1,
)
inj.write_text(s)

replace_once(
    ".github/workflows/deploy-firestore-rules-zero-billing.yml",
    '          grep -Fq "match /accounts/{accountId}/pairLinks/{pairId}" "${FIREBASE_RULES_FILE}"\n',
    '          grep -Fq "match /accounts/{accountId}/pairLinks/{pairId}" "${FIREBASE_RULES_FILE}"\n          grep -Fq "cmsPersistentPairCreationWitnessValid(rivalryId)" "${FIREBASE_RULES_FILE}"\n          grep -Fq "cmsPersistentPairRedemptionWitnessValid(rivalryId, inviteBefore.data.slotId)" "${FIREBASE_RULES_FILE}"\n',
    "deploy witness greps",
)

c = Path("tests/contracts/persistent-nik-daniel-pair-contracts.cjs")
s = c.read_text()
replace_pairs = [
    (
        "const optionalSource=read('js/optionalModules.js');",
        "const optionalSource=read('js/optionalModules.js');\nconst workerSource=read('service-worker.js');",
    ),
    (
        "assert.match(privatePairingSource,/durableWitness=options\\.durableWitness/,'Private pairing redemption must accept a bounded durable witness inside the same provider transaction.');",
        "assert.match(privatePairingSource,/const durableWitness=options\\.durableWitness/,'Private pairing creation and redemption must accept a bounded durable witness inside the provider transaction.');\nassert.match(privatePairingSource,/async function createPairing[\\s\\S]*await durableWitness\\(\\{transaction[\\s\\S]*transaction\\.set\\(rivalryReference/,'Creator durable authority must execute before rivalry/invite creation commits.');",
    ),
    (
        "assert.match(pairSource,/pairCreateDurableRedemptionWitness/,'Persistent pairing must create the account pair witness inside redemption authority.');",
        "assert.match(pairSource,/pairCreateDurableCreationWitness/,'Persistent pairing must create the creator account witness inside create authority.');\nassert.match(pairSource,/pairCreateDurableRedemptionWitness/,'Persistent pairing must create the joiner account witness inside redemption authority.');\nconst startFunction=pairSource.slice(pairSource.indexOf('async function pairStartPairing'),pairSource.indexOf('async function pairJoinPairing'));\nassert.match(startFunction,/durableWitness/);\nassert.doesNotMatch(startFunction,/pairPersistPairLinkWithRetry/,'Successful code creation must not depend on a later pair-link write.');",
    ),
    (
        "assert.doesNotMatch(appSource,/persistentNikDanielPair|persistent-nik-daniel-pair/,'Persistent pair must stay behind the lazy identity boundary and out of the initial app bundle.');",
        "assert.doesNotMatch(appSource,/persistentNikDanielPair|persistent-nik-daniel-pair/,'Persistent pair must stay behind the lazy identity boundary and out of the initial app bundle.');\nassert.match(workerSource,/\"js\\/persistentNikDanielPair\\.js\"/,'Installed application shell must cache the lazy persistent-pair runtime.');",
    ),
    (
        "assert.match(rulesFragment,/cmsPersistentPairRedemptionWitnessValid/,'Provider Rules must bind every rivalry redemption to the account current-pair witness.');",
        "assert.match(rulesFragment,/cmsPersistentPairCreationWitnessValid/,'Provider Rules must bind every rivalry creation to the creator account current-pair witness.');\nassert.match(rulesFragment,/cmsPersistentPairRedemptionWitnessValid/,'Provider Rules must bind every rivalry redemption to the joiner account current-pair witness.');",
    ),
    (
        "assert.match(injector,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Production Rules injection must make the pair witness mandatory for validRivalryRedeem.');",
        "assert.match(injector,/cmsPersistentPairCreationWitnessValid\\(rivalryId\\)/,'Production Rules injection must make the creator pair witness mandatory for initial rivalry creation.');\nassert.match(injector,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Production Rules injection must make the joiner pair witness mandatory for validRivalryRedeem.');",
    ),
    (
        "assert.match(generated,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Generated production Rules must reject redemption without the exact account current-pair witness.');",
        "assert.match(generated,/cmsPersistentPairCreationWitnessValid\\(rivalryId\\)/,'Generated production Rules must reject creation without the exact creator account current-pair witness.');\nassert.match(generated,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Generated production Rules must reject redemption without the exact joiner account current-pair witness.');",
    ),
]
for old_text, new_text in replace_pairs:
    if s.count(old_text) != 1:
        raise SystemExit(f"contract patch anchor drifted: {old_text[:70]}")
    s = s.replace(old_text, new_text, 1)
c.write_text(s)

# Provider emulator: creation without a witness must fail, creation with a witness must succeed,
# and a stale creator tab must not mint a second usable capability while another pair is active.
e = Path("tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs")
s = e.read_text()
create_helper = '''async function atomicCreateWithPairLink(db,{uid,device,target,role,managerId,char,nowMs,writePairLink=true}){
  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current');
  return runTransaction(db,async transaction=>{
    const pairSnapshot=await transaction.get(pairRef),at=Timestamp.fromMillis(nowMs+4000),expiresAt=Timestamp.fromMillis(nowMs+604000),invitedRole=role==='playerOne'?'playerTwo':'playerOne';
    const p1=role==='playerOne'?managerSlot('playerOne',uid,char):openSlot('playerOne'),p2=role==='playerTwo'?managerSlot('playerTwo',uid,char):openSlot('playerTwo');
    const rivalryData={connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:[p1,p2],authorizedAccountIds:[uid],createdByAccountId:uid,createdAt:at};
    const inviteData={purpose:'rivalry-pairing',slotId:invitedRole,createdByAccountId:uid,createdAt:at,expiresAt,state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
    const rivalryNext=envelope({objectType:'rivalry',objectId:target,contentHash:hash(char),updatedAt:at,accountId:uid,deviceId:device,data:rivalryData});
    const inviteNext=envelope({objectType:'invite',objectId:target,contentHash:hash(char),updatedAt:at,accountId:uid,deviceId:device,data:inviteData});
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
    if(pairSnapshot.exists()){const prior=pairSnapshot.data();revision=prior.revision+1;parentRevision=prior.revision;priorContentHash=prior.contentHash;linkedAt=prior.data.linkedAt;}
    const pairNext=pairEnvelope(uid,target,role,managerId,device,linkedAt,at,{revision,parentRevision,contentHash:hash(char),priorContentHash});
    if(writePairLink)transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
  });
}

'''
marker = "async function atomicRedeemWithPairLink"
if s.count(marker) != 1:
    raise SystemExit("emulator create helper anchor drifted")
s = s.replace(marker, create_helper + marker, 1)
old_ids = "const ids={a:deviceId('a'),b:deviceId('b'),c:deviceId('c'),d:deviceId('d'),e:deviceId('e')};"
new_ids = "const ids={a:deviceId('a'),b:deviceId('b'),c:deviceId('c'),d:deviceId('d'),e:deviceId('e'),f:deviceId('f')};"
if s.count(old_ids) != 1:
    raise SystemExit("emulator ids anchor drifted")
s = s.replace(old_ids, new_ids, 1)
old_targets = "const rivalryOne=`pair_${'1'.repeat(64)}`,rivalryTwo=`pair_${'2'.repeat(64)}`,pendingOld=`pair_${'3'.repeat(64)}`,pendingNew=`pair_${'4'.repeat(64)}`,atomicRecovery=`pair_${'5'.repeat(64)}`,staleRedeem=`pair_${'6'.repeat(64)}`;"
new_targets = old_targets[:-1] + ",atomicCreate=`pair_${'7'.repeat(64)}`,staleCreate=`pair_${'8'.repeat(64)}`;"
if s.count(old_targets) != 1:
    raise SystemExit("emulator targets anchor drifted")
s = s.replace(old_targets, new_targets, 1)
old_accounts = "for(const [uid,key] of [['acct_a','a'],['acct_b','b'],['acct_c','c'],['acct_d','d'],['acct_e','e']]){"
new_accounts = "for(const [uid,key] of [['acct_a','a'],['acct_b','b'],['acct_c','c'],['acct_d','d'],['acct_e','e'],['acct_f','f']]){"
if s.count(old_accounts) != 1:
    raise SystemExit("emulator account setup anchor drifted")
s = s.replace(old_accounts, new_accounts, 1)
old_context = "const dbE=testEnv.authenticatedContext('acct_e').firestore();\n    const dbAnon"
new_context = "const dbE=testEnv.authenticatedContext('acct_e').firestore();\n    const dbF=testEnv.authenticatedContext('acct_f').firestore();\n    const dbAnon"
if s.count(old_context) != 1:
    raise SystemExit("emulator context anchor drifted")
s = s.replace(old_context, new_context, 1)
creation_tests = '''
  await assertFails(atomicCreateWithPairLink(dbF,{uid:'acct_f',device:ids.f,target:atomicCreate,role:'playerTwo',managerId:'nik',char:'f',nowMs,writePairLink:false}));
  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate))).exists(),false,'provider Rules must reject creator pairing without the durable current-pair witness');
  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate,'invites',atomicCreate))).exists(),false,'witness-less creator failure must not mint a usable invite');
  await assertSucceeds(atomicCreateWithPairLink(dbF,{uid:'acct_f',device:ids.f,target:atomicCreate,role:'playerTwo',managerId:'nik',char:'f',nowMs}));
  assert.equal((await getDoc(doc(dbF,'accounts','acct_f','pairLinks','current'))).data().data.rivalryId,atomicCreate,'successful creator transaction must atomically bind current-pair authority');
  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate))).data().data.connectionState,'pending-pair');
  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate,'invites',atomicCreate))).data().data.state,'open');

  await assertFails(atomicCreateWithPairLink(dbA,{uid:'acct_a',device:ids.a,target:staleCreate,role:'playerOne',managerId:'daniel',char:'a',nowMs}));
  assert.equal((await getDoc(doc(dbA,'rivalries',staleCreate))).exists(),false,'stale creator tab must not create a second rivalry while current pair is active');
  assert.equal((await getDoc(doc(dbA,'rivalries',staleCreate,'invites',staleCreate))).exists(),false,'stale creator rejection must not leave a shareable one-use invite');

'''
anchor = "  await assertFails(atomicRedeemWithPairLink(dbE"
if s.count(anchor) != 1:
    raise SystemExit("emulator creation test anchor drifted")
s = s.replace(anchor, creation_tests + anchor, 1)
old_log = "mandatory atomic post-redeem recovery witness, witness-less redemption denial, and stale-tab double-active rollback are enforced."
new_log = "mandatory atomic creator and post-redeem recovery witnesses, witness-less create/redeem denial, stale-creator capability rollback, and stale-tab double-active rollback are enforced."
if s.count(old_log) != 1:
    raise SystemExit("emulator log anchor drifted")
s = s.replace(old_log, new_log, 1)
e.write_text(s)

print("PR260 guarded P1 patch applied")
