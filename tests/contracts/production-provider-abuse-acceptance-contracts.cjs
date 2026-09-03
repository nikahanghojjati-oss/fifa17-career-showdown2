const assert=require('node:assert/strict');
const crypto=require('node:crypto').webcrypto;
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const abuse=require(path.join(root,'js/productionProviderAbuseAcceptance.js'));
const authorization=require(path.join(root,'js/productionAuthorizationAcceptance.js'));
const page=fs.readFileSync(path.join(root,'production-authorization-acceptance.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/productionProviderAbuseAcceptance.js'),'utf8');
const authorizationSource=fs.readFileSync(path.join(root,'js/productionAuthorizationAcceptance.js'),'utf8');
const serviceWorkerSource=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

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
  assert.match(page,/<script src="js\/productionProviderAbuseAcceptance\.js"><\/script>/);
  assert.match(serviceWorkerSource,/NETWORK_ONLY_NAVIGATION_PATHS[\s\S]+production-authorization-acceptance\.html/,'The production acceptance document must be explicitly exempt from application-shell navigation fallback.');
  assert.match(serviceWorkerSource,/function networkOnlyRequest\(request\)\{ return new Request\(request,\{cache:"reload"\}\); \}/,'Network-only acceptance resources must bypass the ordinary HTTP cache.');
  assert.match(serviceWorkerSource,/request\.mode==="navigate"[\s\S]+relativeScopePath\(url\)[\s\S]+NETWORK_ONLY_NAVIGATION_PATHS\.has\(path\)[\s\S]+event\.respondWith\(fetch\(networkOnlyRequest\(request\)\)\); return;[\s\S]+chooseNavigationRuntime/,'A controlled returning browser must reload the production acceptance document from the network instead of receiving cached index.html or stale HTTP-cache content.');
  assert.match(serviceWorkerSource,/NETWORK_ONLY_ASSET_PATHS[\s\S]+js\/productionAuthorizationAcceptance\.js[\s\S]+js\/productionProviderAbuseAcceptance\.js/,'Both acceptance-only JavaScript modules must be explicitly network-only.');
  assert.match(serviceWorkerSource,/const path=relativeScopePath\(url\); if\(!path\)\{return;\} if\(NETWORK_ONLY_ASSET_PATHS\.has\(path\)\)\{ event\.respondWith\(fetch\(networkOnlyRequest\(request\)\)\); return; \}/,'A controlled returning browser must reload versioned acceptance-only modules from the network before shell-cache routing.');
  assert.doesNotMatch(serviceWorkerSource,/SHELL_PATHS[\s\S]{0,500}production-authorization-acceptance\.html/,'The provider-backed acceptance route must remain network-only rather than expanding the offline application shell.');
  assert.doesNotMatch(serviceWorkerSource,/SHELL_PATHS[\s\S]{0,500}productionAuthorizationAcceptance\.js/,'The authorization acceptance module must remain network-only rather than expanding the offline application shell.');
  assert.doesNotMatch(serviceWorkerSource,/SHELL_PATHS[\s\S]{0,500}productionProviderAbuseAcceptance\.js/,'The provider-abuse acceptance module must remain network-only rather than expanding the offline application shell.');
  assert.doesNotMatch(source,/\blocalStorage\b/,'Provider abuse auxiliary JS must preserve the static release storage boundary.');
  assert.doesNotMatch(source,/\b(addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/,'Provider abuse acceptance must remain query-only.');
  assert.match(source,/currentUserImpl/,'Browser evidence must re-check the authenticated identity after the asynchronous provider query.');
  assert.match(source,/PROVIDER_ABUSE_AUTH_CHANGED_DURING_PROBE/,'Authentication changes during the provider query must fail closed.');
  assert.match(source,/acquireAuthControlsLock/,'Provider abuse browser runtime must acquire the shared authorization-page auth-control lock.');
  assert.match(source,/isAuthControlsLockHeld/,'Provider abuse evidence must verify that the same shared lock remains held.');
  assert.match(source,/releaseAuthControlsLock/,'Provider abuse browser runtime must release the shared lock in its finally boundary.');
  assert.match(source,/authControlsLockHeldImpl:\(\)=>context\.acceptance\.isAuthControlsLockHeld\(authControlLockToken\)/,'Browser evidence must dynamically bind lock validity to the shared token instead of hardcoding true.');
  assert.match(source,/PROVIDER_ABUSE_AUTH_CONTROLS_NOT_LOCKED/,'Loss of the shared auth-control lock must make the result ineligible for RJR evidence.');

  assert.equal(typeof authorization.acquireAuthControlsLock,'function');
  assert.equal(typeof authorization.isAuthControlsLockHeld,'function');
  assert.equal(typeof authorization.releaseAuthControlsLock,'function');
  assert.match(authorizationSource,/onAuthStateChanged[\s\S]+authorizationAcceptanceApplyAuthControlState\(user\)/,'Auth-state callbacks must route control state through the shared lock-aware helper.');
  assert.match(authorizationSource,/authorizationAcceptanceRequireAuthControlsUnlocked\(\)[\s\S]+signInWithPopup/,'Sign-in must fail closed when an acceptance operation owns the shared auth-control lock.');
  assert.match(authorizationSource,/authorizationAcceptanceRequireAuthControlsUnlocked\(\)[\s\S]+signOut/,'Sign-out must fail closed when an acceptance operation owns the shared auth-control lock.');

  const firstLock=authorization.acquireAuthControlsLock();
  assert.equal(authorization.isAuthControlsLockHeld(firstLock),true);
  assert.throws(()=>authorization.acquireAuthControlsLock(),/already locked/i);
  assert.equal(authorization.releaseAuthControlsLock('wrong-token'),false);
  assert.equal(authorization.isAuthControlsLockHeld(firstLock),true,'An invalid release token must not release the active lock.');
  assert.equal(authorization.releaseAuthControlsLock(firstLock,null),true);
  assert.equal(authorization.isAuthControlsLockHeld(firstLock),false);
  const secondLock=authorization.acquireAuthControlsLock();
  assert.notEqual(secondLock,firstLock,'A released/reacquired lock must receive a new generation token.');
  assert.equal(authorization.releaseAuthControlsLock(secondLock,null),true);

  const collectionImpl=(_firestore,name)=>({kind:'collection',name});
  const limitImpl=value=>({kind:'limit',value});
  const queryImpl=(collectionRef,limitClause)=>({kind:'query',collectionRef,limitClause});
  const user={uid:'acct_existing_manager'};
  let queries=0;
  const denied=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>user,authControlsLockHeldImpl:()=>true,firestore:{},collectionImpl,queryImpl,limitImpl,
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
    user,currentUserImpl:()=>user,authControlsLockHeldImpl:()=>true,firestore:{},collectionImpl,queryImpl,limitImpl,
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
    user,currentUserImpl:()=>currentUser,authControlsLockHeldImpl:()=>true,firestore:{},collectionImpl,queryImpl,limitImpl,
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
    user,currentUserImpl:()=>user,authControlsLockHeldImpl:()=>false,firestore:{},collectionImpl,queryImpl,limitImpl,
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

  let sharedLockHeld=true;
  queries=0;
  const lockReleasedDuringProbe=await abuse.probeAuthenticatedRivalryListDenial({
    user,currentUserImpl:()=>user,authControlsLockHeldImpl:()=>sharedLockHeld,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async()=>{
      queries+=1;
      sharedLockHeld=false;
      const error=new Error('Missing or insufficient permissions.');
      error.code='permission-denied';
      throw error;
    },
    localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(lockReleasedDuringProbe.ok,false);
  assert.equal(lockReleasedDuringProbe.code,'PROVIDER_ABUSE_AUTH_CONTROLS_NOT_LOCKED');
  assert.equal(lockReleasedDuringProbe.authenticatedAccountStable,true);
  assert.equal(lockReleasedDuringProbe.authenticationControlsLockedDuringQuery,false);
  assert.equal(lockReleasedDuringProbe.rivalryListDenied,true);
  assert.equal(lockReleasedDuringProbe.providerAbuseAcceptanceCandidate,false);
  assert.equal(lockReleasedDuringProbe.rjrEligibleEvidenceCandidate,false);

  const missingAuth=await abuse.probeAuthenticatedRivalryListDenial({
    user:null,firestore:{},collectionImpl,queryImpl,limitImpl,getDocsImpl:async()=>{throw new Error('should not query');},localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(missingAuth.ok,false);
  assert.equal(missingAuth.code,'PROVIDER_ABUSE_AUTH_REQUIRED');

  process.stdout.write('PASS production provider abuse acceptance contracts\n');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
