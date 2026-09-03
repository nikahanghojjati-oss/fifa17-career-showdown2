const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const api=require(path.join(root,"js/stage5fProductionAuthenticatedNegatives.js"));
const html=fs.readFileSync(path.join(root,"production-authorization-acceptance.html"),"utf8");

assert.equal(api.contractVersion,1);
assert.equal(api.feature,"stage5f-production-authenticated-negatives");
assert.equal(api.billingRequired,false);
assert.equal(api.blazeRequired,false);
assert.equal(api.cloudFunctionsRequired,false);
assert.equal(api.cloudRunRequired,false);
assert.equal(api.thirdAccountWriteScope,0);
assert.match(html,/id="stage5fRevokedDeviceProviderProbe"/);
assert.match(html,/id="stage5fThirdAccountProbe"/);
assert.match(html,/id="stage5fLoadCurrentRivalry"/);
assert.match(html,/js\/stage5fProductionAuthenticatedNegatives\.js/);
assert.doesNotMatch(html,/stage5fProductionAuthenticatedNegatives\.js\?v=/,"Stage 5F network-only acceptance asset must not be trapped behind a retained shell-cache revision.");
assert.match(html,/never enables billing/i);

const actor={schemaVersion:1,deviceId:`device_${"a".repeat(32)}`,installationId:`installation_${"a".repeat(32)}`,createdAtEpochMs:1};
const synthetic={schemaVersion:1,deviceId:`device_${"b".repeat(32)}`,installationId:`installation_${"b".repeat(32)}`,createdAtEpochMs:2};
const rivalryId=`pair_${"c".repeat(64)}`;
const sessionId=`session_${"d".repeat(64)}`;
const user={uid:"stage5f-host-account"};
const storage={length:0,key(){return null;},getItem(){return null;}};
const snapshot=value=>({exists:()=>true,data:()=>value});
const actorEnvelope={objectType:"device",objectId:actor.deviceId,lifecycleState:"live",revision:0,contentHash:`sha256:${"1".repeat(64)}`,data:{state:"active",deviceId:actor.deviceId}};
const sessionEnvelope={objectType:"session",objectId:sessionId,lifecycleState:"live",revision:0,contentHash:`sha256:${"2".repeat(64)}`,data:{state:"open",hostAccountId:user.uid,memberAccountIds:[user.uid],createdAt:{toMillis:()=>1},expiresAt:{toMillis:()=>999999},lastActivityAt:null,revokedAt:null,rivalryId}};
let rawDeniedMutationAttempts=0;
const sdk={
  Timestamp:{fromMillis:value=>({toMillis:()=>value})},
  doc(_firestore,...parts){return parts.join("/");},
  async runTransaction(_firestore,callback){
    return callback({
      async get(reference){return reference.includes("/sessions/")?snapshot(sessionEnvelope):snapshot(actorEnvelope);},
      set(reference){if(reference.includes("/sessions/")){rawDeniedMutationAttempts+=1;const error=new Error("Missing or insufficient permissions");error.code="permission-denied";throw error;}}
    });
  }
};
const pairing={
  async getOrCreateDeviceIdentity(){return actor;},
  generateDeviceIdentity(){return synthetic;},
  async registerDevice(){return {ok:true};},
  async revokeDevice(){return {ok:true};}
};
const protocol={
  generateSessionId(){return sessionId;},
  async openSession(){return {ok:true,state:"open",revision:0};},
  async readSession(){return {ok:true,state:"open",revision:0};},
  async revokeSession(options){return options.deviceId===synthetic.deviceId?{ok:false,code:"PRIVATE_SESSION_DEVICE_REVOKED"}:{ok:true,state:"revoked",revision:1};},
  async buildEnvelope(options){return {objectType:"session",objectId:options.sessionId,lifecycleState:"live",revision:options.revision,parentRevision:options.parentRevision,priorContentHash:options.priorContentHash,contentHash:`sha256:${"3".repeat(64)}`,updatedAt:options.updatedAt,updatedByAccountId:options.accountId,updatedByDeviceId:options.deviceId,data:options.data,tombstone:null};}
};

(async()=>{
  const revoked=await api.probeRevokedDeviceProviderDenial({user,firestore:{},firebaseSdk:sdk,pairingApi:pairing,protocolApi:protocol,actorIdentity:actor,rivalryId,localStorageImpl:storage,cryptoImpl:crypto.webcrypto,nowEpochMs:100});
  assert.equal(revoked.ok,true,JSON.stringify(revoked));
  assert.equal(revoked.code,"STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED");
  assert.equal(revoked.applicationAdapterDenied,true);
  assert.equal(revoked.providerMutationDenied,true);
  assert.equal(revoked.sessionUnchangedAfterDeniedMutation,true);
  assert.equal(revoked.cleanupTerminal,true);
  assert.equal(revoked.rjrEligibleEvidenceCandidate,true);
  assert.equal(rawDeniedMutationAttempts,1);

  let deniedReads=0;
  const deniedSdk={
    doc(_firestore,...parts){return parts.join("/");},
    async runTransaction(_firestore,callback){return callback({async get(){deniedReads+=1;const error=new Error("Missing or insufficient permissions");error.code="permission-denied";throw error;}});}
  };
  const third=await api.probeAnyAuthenticatedThirdAccountDenial({user:{uid:"arbitrary-google-third-account"},firestore:{},firebaseSdk:deniedSdk,rivalryId,hostVerifiedRivalryId:rivalryId,operatorConfirmedThirdAccount:true,localStorageImpl:storage,cryptoImpl:crypto.webcrypto});
  assert.equal(third.ok,true,JSON.stringify(third));
  assert.equal(third.code,"STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED");
  assert.equal(third.existingPrivateAccountRequired,false);
  assert.equal(third.accountBootstrapAttempted,false);
  assert.equal(third.firestoreWritesRequested,0);
  assert.equal(third.rjrEligibleEvidenceCandidate,true);
  assert.equal(deniedReads,2);

  const readableSdk={doc(_firestore,...parts){return parts.join("/");},async runTransaction(_firestore,callback){return callback({async get(){return snapshot({});}});}};
  const unsafe=await api.probeAnyAuthenticatedThirdAccountDenial({user:{uid:"unexpected-readable-account"},firestore:{},firebaseSdk:readableSdk,rivalryId,hostVerifiedRivalryId:rivalryId,operatorConfirmedThirdAccount:true,localStorageImpl:storage,cryptoImpl:crypto.webcrypto});
  assert.equal(unsafe.ok,false);
  assert.equal(unsafe.code,"STAGE5F_THIRD_ACCOUNT_DENIAL_NOT_PROVEN");
  assert.equal(unsafe.rjrEligibleEvidenceCandidate,false);

  console.log("PASS Stage 5F authenticated negatives: sacrificial revoked-device provider denial and arbitrary authenticated third-account zero-write denial remain fail-closed and zero-billing.");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
