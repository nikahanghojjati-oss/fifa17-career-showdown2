const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const pairing=require("../../js/sparkPrivatePairing.js");

class FakeTimestamp{
  constructor(ms){this.ms=ms;}
  toMillis(){return this.ms;}
  static fromMillis(ms){return new FakeTimestamp(ms);}
}

function snapshot(value){
  return {exists:()=>value!==undefined,data:()=>value};
}

function createHarness(){
  const docs=new Map();
  const firestore={name:"memory"};
  const sdk={
    Timestamp:FakeTimestamp,
    doc(_firestore,...parts){return {path:parts.join("/")};},
    async runTransaction(_firestore,callback){
      const staged=new Map();
      const tx={
        async get(ref){return snapshot(staged.has(ref.path)?staged.get(ref.path):docs.get(ref.path));},
        set(ref,value){staged.set(ref.path,value);}
      };
      const result=await callback(tx);
      for(const [path,value] of staged)docs.set(path,value);
      return result;
    }
  };
  return {docs,firestore,sdk};
}

function identity(seed){
  return {
    schemaVersion:1,
    installationId:`installation_${seed.repeat(32).slice(0,32)}`,
    deviceId:`device_${seed.repeat(32).slice(0,32)}`,
    createdAtEpochMs:1_700_000_000_000
  };
}

function binding(role,seed,label){
  return {
    saveId:`save_${seed.repeat(24).slice(0,24)}`,
    profileId:`profile_${seed.repeat(24).slice(0,24)}`,
    managerRole:role,
    displayLabel:label
  };
}

(async()=>{
  assert.equal(pairing.feature,"registered-devices-private-pairing");
  assert.equal(pairing.identityStorage,"indexeddb-private-device-only");
  assert.equal(pairing.pairingCapabilityBits,256);
  assert.equal(pairing.pairingTtlMs,15*60*1000);
  assert.equal(pairing.maxPairingTtlMs,30*60*1000);
  assert.equal(pairing.publicDiscovery,false);
  assert.equal(pairing.gameplaySync,false);
  assert.equal(pairing.remoteJoiningSessions,false);
  assert.equal(pairing.billingRequired,false);
  assert.deepEqual(pairing.canonicalLocalStorageKeys,[
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);

  const stableBinding=binding("playerTwo","9","Gop");
  assert.equal(pairing.bindingKey(stableBinding),`${stableBinding.managerRole}:${stableBinding.profileId}:${stableBinding.saveId}`);
  assert.equal(pairing.bindingKey({...stableBinding,displayLabel:"Renamed"}),pairing.bindingKey(stableBinding));
  const safeJoinMessage=pairing.pairingJoinErrorMessage(Object.assign(new Error("Missing or insufficient permissions."),{code:"permission-denied"}));
  assert.match(safeJoinMessage,/expired, already used, or unavailable to this account/i);
  assert.match(safeJoinMessage,/create a new code on the other device/i);
  assert.doesNotMatch(safeJoinMessage,/missing or insufficient permissions/i);
  assert.equal(pairing.pairingJoinErrorMessage(Object.assign(new Error("Choose Player Two."),{code:"PAIRING_SLOT_MISMATCH"})),"Choose Player Two.");

  const source=fs.readFileSync("js/sparkPrivatePairing.js","utf8");
  assert.doesNotMatch(source,/localStorage\s*\./);
  assert.doesNotMatch(source,/state\/authoritative/);
  assert.doesNotMatch(source,/sessions\//);
  assert.match(source,/getOrCreateDeviceIdentity/);
  assert.match(source,/indexedDB/);
  assert.match(source,/selectedBindingKey:bindingKey\(binding\)/);
  assert.doesNotMatch(source,/bindings\[Number\(select\.value\)\|\|0\]/);

  const generatedA=pairing.generateDeviceIdentity(crypto.webcrypto,1_700_000_000_000);
  const generatedB=pairing.generateDeviceIdentity(crypto.webcrypto,1_700_000_000_000);
  assert(pairing.validDeviceIdentity(generatedA));
  assert(pairing.validDeviceIdentity(generatedB));
  assert.notEqual(generatedA.deviceId,generatedB.deviceId);
  assert.notEqual(generatedA.installationId,generatedB.installationId);

  const h=createHarness();
  const aIdentity=identity("a");
  const bIdentity=identity("b");
  const aUser={uid:"acct_stage3_a"};
  const bUser={uid:"acct_stage3_b"};
  const aBinding=binding("playerOne","1","Hawk");
  const bBinding=binding("playerTwo","2","Rival");
  const now=1_700_100_000_000;

  const aRegistration=await pairing.registerDevice({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(aRegistration.ok,true);
  assert.equal(aRegistration.action,"created");
  const repeatedRegistration=await pairing.registerDevice({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(repeatedRegistration.ok,true);
  assert.equal(repeatedRegistration.action,"existing");

  const bRegistration=await pairing.registerDevice({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(bRegistration.ok,true);

  const capability=`pair_${"c".repeat(64)}`;
  const created=await pairing.createPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:aBinding,capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(created.ok,true);
  assert.equal(created.rivalryId,capability);
  assert.equal(created.inviteId,capability);
  assert.equal(created.slotId,"playerTwo");
  assert.equal(created.expiresAtEpochMs,now+15*60*1000);

  const rootPath=`rivalries/${capability}`;
  const invitePath=`rivalries/${capability}/invites/${capability}`;
  const root=h.docs.get(rootPath);
  const invite=h.docs.get(invitePath);
  assert.equal(root.data.connectionState,"pending-pair");
  assert.equal(root.data.managerSlots.length,2);
  assert.deepEqual(root.data.authorizedAccountIds,["acct_stage3_a"]);
  assert.deepEqual(root.data.managerSlots[0],{
    slotId:"playerOne",accountId:"acct_stage3_a",profileId:aBinding.profileId,saveId:aBinding.saveId,displayLabel:"Hawk",entitlementState:"active",deletionConsent:false
  });
  assert.deepEqual(root.data.managerSlots[1],{
    slotId:"playerTwo",accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:"open",deletionConsent:false
  });
  assert.equal(invite.data.purpose,"rivalry-pairing");
  assert.equal(invite.data.state,"open");
  assert.equal(invite.data.redeemedByAccountId,null);
  assert.equal(invite.data.revokedAt,null);
  assert.equal(h.docs.has(`rivalries/${capability}/state/authoritative`),false);
  assert.equal([...h.docs.keys()].some(path=>path.includes("/sessions/")),false);

  const creatorRedeem=await pairing.redeemPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:bBinding,capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(creatorRedeem.ok,false);
  assert.equal(creatorRedeem.code,"PAIRING_CREATOR_CANNOT_REDEEM");

  const wrongSlot=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:binding("playerOne","2","Rival"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(wrongSlot.ok,false);
  assert.equal(wrongSlot.code,"PAIRING_SLOT_MISMATCH");

  const expiredCapability=`pair_${"d".repeat(64)}`;
  const expCreated=await pairing.createPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:aBinding,capability:expiredCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(expCreated.ok,true);
  const expired=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:bBinding,capability:expiredCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+pairing.pairingTtlMs+1});
  assert.equal(expired.ok,false);
  assert.equal(expired.code,"PAIRING_CAPABILITY_EXPIRED");

  const scopeCapability=`pair_${"e".repeat(64)}`;
  const scopeCreated=await pairing.createPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:aBinding,capability:scopeCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(scopeCreated.ok,true);
  h.docs.get(`rivalries/${scopeCapability}/invites/${scopeCapability}`).data.purpose="private-session";
  const wrongScope=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:bBinding,capability:scopeCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(wrongScope.ok,false);
  assert.equal(wrongScope.code,"PAIRING_SCOPE_DENIED");

  const joined=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:bBinding,capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(joined.ok,true);
  const joinedRoot=h.docs.get(rootPath);
  const joinedInvite=h.docs.get(invitePath);
  assert.equal(joinedRoot.data.connectionState,"active");
  assert.equal(joinedRoot.data.managerSlots.length,2);
  assert.deepEqual(joinedRoot.data.authorizedAccountIds,["acct_stage3_a","acct_stage3_b"]);
  assert.equal(joinedRoot.data.managerSlots[1].accountId,"acct_stage3_b");
  assert.equal(joinedRoot.data.managerSlots[1].profileId,bBinding.profileId);
  assert.equal(joinedRoot.data.managerSlots[1].saveId,bBinding.saveId);
  assert.equal(joinedInvite.data.state,"redeemed");
  assert.equal(joinedInvite.data.redeemedByAccountId,"acct_stage3_b");

  const replay=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:bBinding,capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+2000});
  assert.equal(replay.ok,false);
  assert.equal(replay.code,"PAIRING_CAPABILITY_ALREADY_USED");

  const thirdUser={uid:"acct_stage3_c"};
  const cIdentity=identity("f");
  await pairing.registerDevice({user:thirdUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:cIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  const thirdAttempt=await pairing.redeemPairing({user:thirdUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:cIdentity,binding:binding("playerTwo","3","Third"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000});
  assert.equal(thirdAttempt.ok,false);
  assert.equal(thirdAttempt.code,"PAIRING_CAPABILITY_ALREADY_USED");
  assert.equal(h.docs.get(rootPath).data.managerSlots.length,2);

  const revoked=await pairing.revokeDevice({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,targetDeviceId:bIdentity.deviceId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+4000});
  assert.equal(revoked.ok,true);
  const revokedStored=h.docs.get(`accounts/acct_stage3_b/devices/${bIdentity.deviceId}`);
  assert.equal(revokedStored.data.state,"revoked");
  const reregister=await pairing.registerDevice({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now+5000});
  assert.equal(reregister.ok,false);
  assert.equal(reregister.code,"PRIVATE_DEVICE_REVOKED");

  const revokeCapability=`pair_${"f".repeat(64)}`;
  const openToRevoke=await pairing.createPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:aBinding,capability:revokeCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
  assert.equal(openToRevoke.ok,true);
  const deniedRevoke=await pairing.revokePairing({user:thirdUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:cIdentity,capability:revokeCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(deniedRevoke.ok,false);
  assert.equal(deniedRevoke.code,"PAIRING_REVOKE_DENIED");
  const creatorRevoke=await pairing.revokePairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,capability:revokeCapability,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
  assert.equal(creatorRevoke.ok,true);
  assert.equal(h.docs.get(`rivalries/${revokeCapability}/invites/${revokeCapability}`).data.state,"revoked");

  console.log("PASS Stage 3 registered devices / private pairing deterministic client contracts");
})().catch(error=>{console.error(error);process.exit(1);});
