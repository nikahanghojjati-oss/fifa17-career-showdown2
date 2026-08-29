const assert=require('node:assert/strict');
const crypto=require('node:crypto').webcrypto;
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const abuse=require(path.join(root,'js/productionProviderAbuseAcceptance.js'));
const page=fs.readFileSync(path.join(root,'production-authorization-acceptance.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/productionProviderAbuseAcceptance.js'),'utf8');

function storage(entries={}){
  const keys=Object.keys(entries);
  return {get length(){return keys.length;},key(index){return keys[index]??null;},getItem(key){return Object.prototype.hasOwnProperty.call(entries,key)?entries[key]:null;}};
}

(async()=>{
  assert.equal(abuse.contractVersion,1);
  assert.equal(abuse.feature,'production-provider-abuse-acceptance');
  assert.equal(abuse.rjrCreditOnImplementation,false);
  assert.equal(abuse.providerWriteCreationAllowed,false);
  assert.equal(abuse.productionMutationPolicy,'authenticated-read-only-rivalry-enumeration-denial');
  assert.match(page,/Authenticated enumeration denial/);
  assert.match(page,/authorizationProviderAbuseProbe/);
  assert.match(page,/Requested provider writes: 0/i);
  assert.match(page,/productionProviderAbuseAcceptance\.js\?v=1\.8\.1-r5/);
  assert.doesNotMatch(source,/\blocalStorage\b/,'Provider abuse auxiliary JS must preserve the static release storage boundary.');
  assert.doesNotMatch(source,/\b(addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/,'Provider abuse acceptance must remain query-only.');
  assert.match(source,/currentUserImpl/,'Browser evidence must re-check the authenticated identity after the asynchronous provider query.');
  assert.match(source,/PROVIDER_ABUSE_AUTH_CHANGED_DURING_PROBE/,'Authentication changes during the provider query must fail closed.');
  assert.match(source,/function setAuthenticationControlsLocked\(locked,currentUser=null\)/,'Provider abuse browser runtime must own an explicit authentication-control lock.');
  assert.match(source,/setAuthenticationControlsLocked\(true\)[\s\S]+await probeAuthenticatedRivalryListDenial[\s\S]+finally\{[\s\S]+setAuthenticationControlsLocked\(false,/,'Sign-in/sign-out controls must remain locked across the complete asynchronous provider query and restore only in finally.');
  assert.match(source,/authenticationControlsLockedDuringQuery:true/,'Browser evidence must explicitly attest that the auth controls were locked for the query.');
  assert.match(source,/PROVIDER_ABUSE_AUTH_CONTROLS_NOT_LOCKED/,'Direct probe results without the browser auth-control lock must be ineligible for RJR evidence.');

  const collectionImpl=(_firestore,name)=>({kind:'collection',name});
  const limitImpl=value=>({kind:'limit',value});
  const queryImpl=(collectionRef,limitClause)=>({kind:'query',collectionRef,limitClause});
  const user={uid:'acct_existing_manager'};
  let queries=0;
  const denied=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>user,authenticationControlsLockedDuringQuery:true,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async query=>{
      queries+=1;
      assert.equal(query.collectionRef.name,'rivalries');
      assert.equal(query.limitClause.value,1);
      const error=new Error('Missing or insufficient permissions.');
      error.code='permission-denied';
      throw error;
    },
    localStorageImpl:storage({'careerModeShowdown.saveLibrary':'{}'}),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(denied.ok,true);
  assert.equal(denied.code,'PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED');
  assert.equal(denied.providerBoundary,'rivalries-collection-list');
  assert.equal(denied.authenticatedAccountRequired,true);
  assert.equal(denied.authenticatedAccountStable,true);
  assert.equal(denied.authenticationControlsLockedDuringQuery,true);
  assert.equal(denied.queryLimit,1);
  assert.equal(denied.rivalryListDenied,true);
  assert.equal(denied.firestoreWritesRequested,0);
  assert.equal(denied.localStorageUnchanged,true);
  assert.equal(denied.providerAbuseAcceptanceCandidate,true);
  assert.equal(denied.rjrEligibleEvidenceCandidate,true);
  assert.match(denied.accountFingerprint,/^sha256:[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(denied),new RegExp(user.uid));

  queries=0;
  const readable=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>user,authenticationControlsLockedDuringQuery:true,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async()=>{queries+=1;return {docs:[{id:'must-not-be-emitted'}]};},
    localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(readable.ok,false);
  assert.equal(readable.code,'PROVIDER_ABUSE_LIST_DENIAL_NOT_PROVEN');
  assert.equal(readable.authenticatedAccountStable,true);
  assert.equal(readable.authenticationControlsLockedDuringQuery,true);
  assert.equal(readable.rivalryListDenied,false);
  assert.equal(readable.providerAbuseAcceptanceCandidate,false);
  assert.equal(readable.rjrEligibleEvidenceCandidate,false);
  assert.doesNotMatch(JSON.stringify(readable),/must-not-be-emitted/);

  let currentUser=user;
  queries=0;
  const signedOutDuringProbe=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>currentUser,authenticationControlsLockedDuringQuery:true,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async()=>{
      queries+=1;
      currentUser=null;
      const error=new Error('Missing or insufficient permissions.');
      error.code='permission-denied';
      throw error;
    },
    localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(signedOutDuringProbe.ok,false);
  assert.equal(signedOutDuringProbe.code,'PROVIDER_ABUSE_AUTH_CHANGED_DURING_PROBE');
  assert.equal(signedOutDuringProbe.authenticatedAccountStable,false);
  assert.equal(signedOutDuringProbe.authenticationControlsLockedDuringQuery,true);
  assert.equal(signedOutDuringProbe.rivalryListDenied,true,'The provider may still deny after sign-out, but that denial is not authenticated evidence.');
  assert.equal(signedOutDuringProbe.firestoreWritesRequested,0);
  assert.equal(signedOutDuringProbe.providerAbuseAcceptanceCandidate,false);
  assert.equal(signedOutDuringProbe.rjrEligibleEvidenceCandidate,false);
  assert.doesNotMatch(JSON.stringify(signedOutDuringProbe),new RegExp(user.uid));

  queries=0;
  const controlsNotLocked=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>user,authenticationControlsLockedDuringQuery:false,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async()=>{
      queries+=1;
      const error=new Error('Missing or insufficient permissions.');
      error.code='permission-denied';
      throw error;
    },
    localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(controlsNotLocked.ok,false);
  assert.equal(controlsNotLocked.code,'PROVIDER_ABUSE_AUTH_CONTROLS_NOT_LOCKED');
  assert.equal(controlsNotLocked.authenticatedAccountStable,true);
  assert.equal(controlsNotLocked.authenticationControlsLockedDuringQuery,false);
  assert.equal(controlsNotLocked.rivalryListDenied,true);
  assert.equal(controlsNotLocked.providerAbuseAcceptanceCandidate,false);
  assert.equal(controlsNotLocked.rjrEligibleEvidenceCandidate,false);

  const missingAuth=await abuse.probeAuthenticatedRivalryListDenial({
    user:null,firestore:{},collectionImpl,queryImpl,limitImpl,getDocsImpl:async()=>{throw new Error('should not query');},localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(missingAuth.ok,false);
  assert.equal(missingAuth.code,'PROVIDER_ABUSE_AUTH_REQUIRED');

  process.stdout.write('PASS production provider abuse acceptance contracts\n');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
