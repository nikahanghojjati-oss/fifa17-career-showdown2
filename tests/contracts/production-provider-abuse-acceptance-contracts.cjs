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

  const collectionImpl=(_firestore,name)=>({kind:'collection',name});
  const limitImpl=value=>({kind:'limit',value});
  const queryImpl=(collectionRef,limitClause)=>({kind:'query',collectionRef,limitClause});
  const user={uid:'acct_existing_manager'};
  let queries=0;
  const denied=await abuse.probeAuthenticatedRivalryListDenial({
    user,firestore:{},collectionImpl,queryImpl,limitImpl,
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
    user,firestore:{},collectionImpl,queryImpl,limitImpl,
    getDocsImpl:async()=>{queries+=1;return {docs:[{id:'must-not-be-emitted'}]};},
    localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(queries,1);
  assert.equal(readable.ok,false);
  assert.equal(readable.code,'PROVIDER_ABUSE_LIST_DENIAL_NOT_PROVEN');
  assert.equal(readable.rivalryListDenied,false);
  assert.equal(readable.providerAbuseAcceptanceCandidate,false);
  assert.equal(readable.rjrEligibleEvidenceCandidate,false);
  assert.doesNotMatch(JSON.stringify(readable),/must-not-be-emitted/);

  const missingAuth=await abuse.probeAuthenticatedRivalryListDenial({
    user:null,firestore:{},collectionImpl,queryImpl,limitImpl,getDocsImpl:async()=>{throw new Error('should not query');},localStorageImpl:storage(),cryptoImpl:crypto
  });
  assert.equal(missingAuth.ok,false);
  assert.equal(missingAuth.code,'PROVIDER_ABUSE_AUTH_REQUIRED');

  process.stdout.write('PASS production provider abuse acceptance contracts\n');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
