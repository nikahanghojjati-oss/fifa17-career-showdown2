const assert=require('node:assert/strict');
const crypto=require('node:crypto').webcrypto;
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const acceptance=require(path.join(root,'js/productionAuthorizationAcceptance.js'));
const page=fs.readFileSync(path.join(root,'production-authorization-acceptance.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/productionAuthorizationAcceptance.js'),'utf8');
const deployWorkflow=fs.readFileSync(path.join(root,'.github/workflows/deploy-github-pages.yml'),'utf8');
const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const runtimeRevision=(worker.match(/const RUNTIME_REVISION = "([^"]+)";/)||[])[1];

function storage(entries={}){
  const keys=Object.keys(entries);
  return {get length(){return keys.length;},key(index){return keys[index]??null;},getItem(key){return Object.prototype.hasOwnProperty.call(entries,key)?entries[key]:null;}};
}
const docImpl=(_firestore,...parts)=>({path:parts.join('/')});
const user={uid:'acct_legitimate_third'};
const rivalryId=`pair_${'a'.repeat(64)}`;

(async()=>{
  assert.ok(runtimeRevision,'Current production runtime revision must be discoverable from the service worker.');
  assert.equal(acceptance.rjrCreditOnImplementation,false);
  assert.equal(acceptance.accountBootstrapAllowed,false);
  assert.equal(acceptance.providerWriteCreationAllowed,false);
  assert.equal(acceptance.productionMutationPolicy,'read-only-third-account-plus-revoked-device-prerequisite-confirmation');
  assert.deepEqual(acceptance.canonicalLocalStorageKeys,[
    'careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'
  ]);
  assert.ok(page.includes(`app-asset-revision" content="${runtimeRevision}"`),'Acceptance page must expose the current production runtime revision.');
  assert.match(page,/<script src="js\/sparkPrivatePairing\.js"><\/script>/);
  assert.match(page,/<script src="js\/productionFirebaseRuntime\.js"><\/script>/);
  assert.match(page,/<script src="js\/productionAuthorizationAcceptance\.js"><\/script>/);
  assert.doesNotMatch(page,/sparkConnectedAccount\.js/);
  assert.match(page,/never bootstraps a Firestore private account/i);
  assert.match(page,/Requested provider writes: 0/i);
  assert.match(page,/not provider mutation-denial proof/i);
  assert.match(deployWorkflow,/cp production-authorization-acceptance\.html \.pages-artifact\//,'Pages build must additively stage the bounded production authorization acceptance page.');
  assert.doesNotMatch(source,/\blocalStorage\b/,'Auxiliary JS must preserve the static release storage boundary.');
  assert.equal(acceptance.isPermissionDenied({code:'permission-denied'}),true);
  assert.equal(acceptance.isPermissionDenied(new Error('Missing or insufficient permissions.')),true);
  assert.throws(()=>acceptance.normalizeRivalryId('pair_bad'),/exact active private rivalry ID/i);

  const confirmationRequired=await acceptance.probeThirdAccountReadDenial({user,firestore:{},docImpl,getDocImpl:async()=>{throw new Error('should not read');},rivalryId});
  assert.equal(confirmationRequired.ok,false);
  assert.equal(confirmationRequired.code,'ACCEPTANCE_THIRD_ACCOUNT_CONFIRMATION_REQUIRED');

  const readPaths=[];
  const third=await acceptance.probeThirdAccountReadDenial({
    user,firestore:{},docImpl,
    getDocImpl:async reference=>{readPaths.push(reference.path);const error=new Error('Missing or insufficient permissions.');error.code='permission-denied';throw error;},
    rivalryId,operatorConfirmedThirdAccount:true,operatorConfirmedActivePairedRivalry:true,localStorageImpl:storage({'careerModeShowdown.saveLibrary':'{}'}),cryptoImpl:crypto
  });
  assert.equal(third.ok,true);
  assert.equal(third.code,'ACCEPTANCE_THIRD_ACCOUNT_DENIED');
  assert.equal(third.rivalryReadDenied,true);
  assert.equal(third.authoritativeStateReadDenied,true);
  assert.equal(third.firestoreWritesRequested,0);
  assert.equal(third.localStorageUnchanged,true);
  assert.equal(third.providerAuthorizationDenied,true);
  assert.equal(third.rjrEligibleEvidenceCandidate,true);
  assert.deepEqual(readPaths,[rivalryId.replace(/^/,'rivalries/'),`rivalries/${rivalryId}/state/authoritative`]);
  assert.match(third.accountFingerprint,/^sha256:[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(third),new RegExp(user.uid));

  let reads=0;
  const notDenied=await acceptance.probeThirdAccountReadDenial({
    user,firestore:{},docImpl,
    getDocImpl:async()=>{reads+=1;return {exists:()=>true,data:()=>({secret:'not exposed'})};},
    rivalryId,operatorConfirmedThirdAccount:true,operatorConfirmedActivePairedRivalry:true,localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(reads,2);
  assert.equal(notDenied.ok,false);
  assert.equal(notDenied.code,'ACCEPTANCE_THIRD_ACCOUNT_DENIAL_NOT_PROVEN');
  assert.equal(notDenied.providerAuthorizationDenied,false);
  assert.equal(notDenied.rjrEligibleEvidenceCandidate,false);
  assert.doesNotMatch(JSON.stringify(notDenied),/not exposed/);

  const partiallyDenied=await acceptance.probeThirdAccountReadDenial({
    user,firestore:{},docImpl,
    getDocImpl:async reference=>{
      if(reference.path.endsWith('/state/authoritative')){const error=new Error('Missing or insufficient permissions.');error.code='permission-denied';throw error;}
      return {exists:()=>true,data:()=>({})};
    },
    rivalryId,operatorConfirmedThirdAccount:true,operatorConfirmedActivePairedRivalry:true,localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(partiallyDenied.ok,false);
  assert.equal(partiallyDenied.rivalryReadDenied,false);
  assert.equal(partiallyDenied.authoritativeStateReadDenied,true);
  assert.equal(partiallyDenied.providerAuthorizationDenied,false);
  assert.equal(partiallyDenied.rjrEligibleEvidenceCandidate,false);

  const identity={deviceId:`device_${'b'.repeat(32)}`,installationId:`installation_${'c'.repeat(32)}`};
  let registerCalls=0;
  const pairingApi={
    async getOrCreateDeviceIdentity(){return identity;},
    async registerDevice(){registerCalls+=1;return {ok:false,code:'PRIVATE_DEVICE_REVOKED',message:'revoked'};}
  };
  const revoked=await acceptance.probeRevokedDeviceDenial({
    user,firestore:{},firebaseSdk:{doc:docImpl,runTransaction(){throw new Error('stub should not be used directly by acceptance');}},docImpl,
    getDocImpl:async()=>({exists:()=>true,data:()=>({data:{deviceId:identity.deviceId,state:'revoked'}})}),
    pairingApi,identity,operatorConfirmedLegitimateRevocation:true,localStorageImpl:storage({'careerModeShowdown.preferences':'{}'}),cryptoImpl:crypto
  });
  assert.equal(revoked.ok,true);
  assert.equal(revoked.code,'ACCEPTANCE_REVOKED_DEVICE_PREREQUISITE_CONFIRMED');
  assert.equal(revoked.providerAuthorizationDenied,false);
  assert.equal(revoked.rjrEligibleEvidence,false);
  assert.equal(revoked.providerDeviceState,'revoked');
  assert.equal(revoked.registrationGuardCode,'PRIVATE_DEVICE_REVOKED');
  assert.equal(revoked.firestoreWriteCommitRequested,false);
  assert.equal(registerCalls,1);

  registerCalls=0;
  const active=await acceptance.probeRevokedDeviceDenial({
    user,firestore:{},firebaseSdk:{},docImpl,
    getDocImpl:async()=>({exists:()=>true,data:()=>({data:{deviceId:identity.deviceId,state:'active'}})}),
    pairingApi,identity,operatorConfirmedLegitimateRevocation:true,localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(active.ok,false);
  assert.equal(active.code,'ACCEPTANCE_DEVICE_NOT_REVOKED');
  assert.equal(active.registrationGuardInvoked,false);
  assert.equal(registerCalls,0);

  const existing=await acceptance.existingActiveAccount({
    services:{firestore:{},firestoreSdk:{doc:docImpl}},
    getDocImpl:async()=>({exists:()=>true,data:()=>({objectType:'account',objectId:user.uid,lifecycleState:'live',data:{status:'active'}})})
  },user);
  assert.equal(existing.active,true);
  const missing=await acceptance.existingActiveAccount({
    services:{firestore:{},firestoreSdk:{doc:docImpl}},
    getDocImpl:async()=>({exists:()=>false,data:()=>undefined})
  },user);
  assert.equal(missing.active,false);

  const record=acceptance.evidenceRecord(third,{runtimeRevision,origin:'https://example.test'});
  assert.equal(record.result,'PASS');
  assert.equal(record.rjrCreditOnImplementation,undefined);
  assert.equal(record.runtimeRevision,runtimeRevision);
  process.stdout.write('PASS production authorization negative acceptance contracts\n');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
