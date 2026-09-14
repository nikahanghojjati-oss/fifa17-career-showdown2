const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,runTransaction,setDoc}=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');

const PROJECT_ID='demo-career-mode-showdown-persistent-pair';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const hash=seed=>`sha256:${String(seed).repeat(64).slice(0,64)}`;
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;

function envelope({objectType,objectId,revision=0,parentRevision=null,contentHash=hash('0'),priorContentHash=null,updatedAt,accountId,deviceId:updatedByDeviceId=null,data}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:'live',contentHash,priorContentHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
function accountEnvelope(uid,now){return envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});}
function deviceEnvelope(uid,id,now){return envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state:'active',registeredAt:now,lastSeenAt:now,revokedAt:null}});}
function openSlot(slotId){return {slotId,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:'open',deletionConsent:false};}
function validId(prefix,char,count){return `${prefix}${char.repeat(count)}`;}
function managerSlot(slotId,uid,char){return {slotId,accountId:uid,profileId:validId('profile_',char,24),saveId:validId('save_',char,24),displayLabel:slotId==='playerOne'?'Daniel':'Nik',entitlementState:'active',deletionConsent:false};}
function rivalryEnvelope(rivalryId,now,p1,p2,state='active'){
  const accounts=[p1&&p1.accountId,p2&&p2.accountId].filter(Boolean);
  return envelope({objectType:'rivalry',objectId:rivalryId,updatedAt:now,accountId:accounts[0]||'seed',deviceId:deviceId('f'),data:{connectionState:state,connectionStateBeforeDeletion:null,managerSlots:[p1,p2],authorizedAccountIds:accounts,createdByAccountId:accounts[0]||'seed',createdAt:now}});
}
function inviteEnvelope(rivalryId,now,expiresAt,state='open'){
  return envelope({objectType:'invite',objectId:rivalryId,updatedAt:now,accountId:'acct_d',deviceId:deviceId('d'),data:{purpose:'rivalry-pairing',slotId:'playerTwo',createdByAccountId:'acct_d',createdAt:now,expiresAt,state,redeemedByAccountId:null,redeemedAt:null,revokedAt:null}});
}
function pairEnvelope(uid,id,role,managerId,device,linkedAt,lastConfirmedAt,{revision=0,parentRevision=null,contentHash=hash('a'),priorContentHash=null}={}){
  return envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,contentHash,priorContentHash,updatedAt:lastConfirmedAt,accountId:uid,deviceId:device,data:{rivalryId:id,managerRole:role,managerId,linkedAt,lastConfirmedAt}});
}

async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,nowMs,writePairLink=true}){
  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current');
  return runTransaction(db,async transaction=>{
    const rivalrySnapshot=await transaction.get(rivalryRef),inviteSnapshot=await transaction.get(inviteRef),pairSnapshot=await transaction.get(pairRef);
    const rivalry=rivalrySnapshot.data(),invite=inviteSnapshot.data(),at=Timestamp.fromMillis(nowMs+5000);
    const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?managerSlot(slot.slotId,uid,char):{...slot});
    const rivalryData={...rivalry.data,connectionState:'active',managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,uid]};
    const inviteData={...invite.data,state:'redeemed',redeemedByAccountId:uid,redeemedAt:at,revokedAt:null};
    const rivalryNext=envelope({objectType:'rivalry',objectId:target,revision:rivalry.revision+1,parentRevision:rivalry.revision,contentHash:hash(char),priorContentHash:rivalry.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:rivalryData});
    const inviteNext=envelope({objectType:'invite',objectId:target,revision:invite.revision+1,parentRevision:invite.revision,contentHash:hash(char),priorContentHash:invite.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:inviteData});
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at,role='playerTwo';
    if(pairSnapshot.exists()){const prior=pairSnapshot.data();revision=prior.revision+1;parentRevision=prior.revision;priorContentHash=prior.contentHash;linkedAt=prior.data.linkedAt;role=prior.data.managerRole;}
    const pairNext=pairEnvelope(uid,target,role,managerId,device,linkedAt,at,{revision,parentRevision,contentHash:hash(char),priorContentHash});
    if(writePairLink)transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;
  });
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const nowMs=Date.now(),now=Timestamp.fromMillis(nowMs),later=Timestamp.fromMillis(nowMs+1000);
    const ids={a:deviceId('a'),b:deviceId('b'),c:deviceId('c'),d:deviceId('d'),e:deviceId('e')};
    const rivalryOne=`pair_${'1'.repeat(64)}`,rivalryTwo=`pair_${'2'.repeat(64)}`,pendingOld=`pair_${'3'.repeat(64)}`,pendingNew=`pair_${'4'.repeat(64)}`,atomicRecovery=`pair_${'5'.repeat(64)}`,staleRedeem=`pair_${'6'.repeat(64)}`;

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const [uid,key] of [['acct_a','a'],['acct_b','b'],['acct_c','c'],['acct_d','d'],['acct_e','e']]){
        await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));
        await setDoc(doc(db,'accounts',uid,'devices',ids[key]),deviceEnvelope(uid,ids[key],now));
      }
      await setDoc(doc(db,'rivalries',rivalryOne),rivalryEnvelope(rivalryOne,now,managerSlot('playerOne','acct_a','1'),managerSlot('playerTwo','acct_b','2')));
      await setDoc(doc(db,'rivalries',rivalryTwo),rivalryEnvelope(rivalryTwo,now,managerSlot('playerOne','acct_a','3'),managerSlot('playerTwo','acct_b','4')));
      await setDoc(doc(db,'rivalries',pendingOld),rivalryEnvelope(pendingOld,now,managerSlot('playerOne','acct_d','5'),openSlot('playerTwo'),'pending-pair'));
      await setDoc(doc(db,'rivalries',pendingOld,'invites',pendingOld),inviteEnvelope(pendingOld,now,Timestamp.fromMillis(nowMs+600000)));
      await setDoc(doc(db,'rivalries',pendingNew),rivalryEnvelope(pendingNew,now,managerSlot('playerOne','acct_d','6'),managerSlot('playerTwo','acct_c','7')));
      await setDoc(doc(db,'rivalries',atomicRecovery),rivalryEnvelope(atomicRecovery,now,managerSlot('playerOne','acct_d','8'),openSlot('playerTwo'),'pending-pair'));
      await setDoc(doc(db,'rivalries',atomicRecovery,'invites',atomicRecovery),inviteEnvelope(atomicRecovery,now,Timestamp.fromMillis(nowMs+600000)));
      await setDoc(doc(db,'rivalries',staleRedeem),rivalryEnvelope(staleRedeem,now,managerSlot('playerOne','acct_d','9'),openSlot('playerTwo'),'pending-pair'));
      await setDoc(doc(db,'rivalries',staleRedeem,'invites',staleRedeem),inviteEnvelope(staleRedeem,now,Timestamp.fromMillis(nowMs+600000)));
    });

    const dbA=testEnv.authenticatedContext('acct_a').firestore();
    const dbB=testEnv.authenticatedContext('acct_b').firestore();
    const dbC=testEnv.authenticatedContext('acct_c').firestore();
    const dbD=testEnv.authenticatedContext('acct_d').firestore();
    const dbE=testEnv.authenticatedContext('acct_e').firestore();
    const dbAnon=testEnv.unauthenticatedContext().firestore();
    const pairRefA=doc(dbA,'accounts','acct_a','pairLinks','current');
    const pairRefB=doc(dbB,'accounts','acct_b','pairLinks','current');

    await assertSucceeds(setDoc(pairRefA,pairEnvelope('acct_a',rivalryOne,'playerOne','daniel',ids.a,now,now)));
    await assertSucceeds(setDoc(pairRefB,pairEnvelope('acct_b',rivalryOne,'playerTwo','nik',ids.b,now,now)));
    assert.equal((await assertSucceeds(getDoc(pairRefA))).data().data.managerId,'daniel');
    assert.equal((await assertSucceeds(getDoc(pairRefB))).data().data.managerId,'nik');

    await assertFails(getDoc(doc(dbB,'accounts','acct_a','pairLinks','current')));
    await assertFails(getDoc(doc(dbAnon,'accounts','acct_a','pairLinks','current')));
    await assertFails(getDocs(collection(dbA,'accounts','acct_a','pairLinks')));
    await assertFails(deleteDoc(pairRefA));

    await assertFails(setDoc(doc(dbC,'accounts','acct_c','pairLinks','current'),pairEnvelope('acct_c',rivalryOne,'playerOne','daniel',ids.c,now,now)));
    await assertFails(setDoc(doc(dbC,'accounts','acct_c','pairLinks','current'),pairEnvelope('acct_c',pendingNew,'playerTwo','daniel',ids.c,now,now)));
    await assertFails(setDoc(doc(dbC,'accounts','acct_c','pairLinks','current'),pairEnvelope('acct_c',pendingNew,'playerOne','nik',ids.c,now,now)));
    await assertFails(setDoc(doc(dbC,'accounts','acct_c','pairLinks','current'),pairEnvelope('acct_c',pendingNew,'playerTwo','nik',deviceId('z'),now,now)));
    await assertSucceeds(setDoc(doc(dbC,'accounts','acct_c','pairLinks','current'),pairEnvelope('acct_c',pendingNew,'playerTwo','nik',ids.c,now,now)));

    const beforeA=(await getDoc(pairRefA)).data();
    await assertSucceeds(setDoc(pairRefA,pairEnvelope('acct_a',rivalryOne,'playerOne','daniel',ids.a,now,later,{revision:1,parentRevision:0,contentHash:hash('b'),priorContentHash:beforeA.contentHash})));
    const revisionOne=(await getDoc(pairRefA)).data();
    await assertFails(setDoc(pairRefA,pairEnvelope('acct_a',rivalryOne,'playerTwo','nik',ids.a,now,Timestamp.fromMillis(nowMs+2000),{revision:2,parentRevision:1,contentHash:hash('c'),priorContentHash:revisionOne.contentHash})));
    await assertFails(setDoc(pairRefA,pairEnvelope('acct_a',rivalryOne,'playerOne','nik',ids.a,now,Timestamp.fromMillis(nowMs+2000),{revision:2,parentRevision:1,contentHash:hash('f'),priorContentHash:revisionOne.contentHash})));
    const replacementAfterTerminal=pairEnvelope('acct_a',rivalryTwo,'playerOne','daniel',ids.a,now,Timestamp.fromMillis(nowMs+2000),{revision:2,parentRevision:1,contentHash:hash('d'),priorContentHash:revisionOne.contentHash});
    await assertFails(setDoc(pairRefA,replacementAfterTerminal));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),'rivalries',rivalryOne),rivalryEnvelope(rivalryOne,now,managerSlot('playerOne','acct_a','1'),managerSlot('playerTwo','acct_b','2'),'closed'));
    });
    await assertSucceeds(setDoc(pairRefA,replacementAfterTerminal));
    assert.equal((await getDoc(pairRefA)).data().data.rivalryId,rivalryTwo,'closed prior Showdown must allow one canonical fresh pair replacement');

    const pairRefD=doc(dbD,'accounts','acct_d','pairLinks','current');
    await assertFails(setDoc(pairRefD,pairEnvelope('acct_d',pendingOld,'playerOne','nik',ids.d,now,now)));
    await assertSucceeds(setDoc(pairRefD,pairEnvelope('acct_d',pendingOld,'playerOne','daniel',ids.d,now,now)));
    const beforeD=(await getDoc(pairRefD)).data();
    const replacement=pairEnvelope('acct_d',pendingNew,'playerOne','daniel',ids.d,now,later,{revision:1,parentRevision:0,contentHash:hash('e'),priorContentHash:beforeD.contentHash});
    await assertFails(setDoc(pairRefD,replacement));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),'rivalries',pendingOld,'invites',pendingOld),inviteEnvelope(pendingOld,now,Timestamp.fromMillis(nowMs-1000)));
    });
    await assertSucceeds(setDoc(pairRefD,replacement));


  await assertFails(atomicRedeemWithPairLink(dbE,{uid:'acct_e',device:ids.e,target:atomicRecovery,managerId:'nik',char:'e',nowMs,writePairLink:false}));
  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery))).data().data.connectionState,'pending-pair','provider Rules must reject redemption that omits the durable pair witness');
  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery,'invites',atomicRecovery))).data().data.state,'open','witness-less redemption must leave the one-use invite unconsumed');
  await assertSucceeds(atomicRedeemWithPairLink(dbE,{uid:'acct_e',device:ids.e,target:atomicRecovery,managerId:'nik',char:'e',nowMs}));
  const durablePair=(await getDoc(doc(dbE,'accounts','acct_e','pairLinks','current'))).data();
  assert.equal(durablePair.data.rivalryId,atomicRecovery,'successful redemption must durably commit the account current-pair witness in the same transaction');
  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery))).data().data.connectionState,'active');
  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery,'invites',atomicRecovery))).data().data.state,'redeemed');

  await assertFails(atomicRedeemWithPairLink(dbC,{uid:'acct_c',device:ids.c,target:staleRedeem,managerId:'nik',char:'c',nowMs}));
  assert.equal((await getDoc(doc(dbC,'rivalries',staleRedeem))).data().data.connectionState,'pending-pair','stale-tab double-active rejection must roll back rivalry activation');
  assert.equal((await getDoc(doc(dbC,'rivalries',staleRedeem,'invites',staleRedeem))).data().data.state,'open','stale-tab double-active rejection must leave the one-use invite unconsumed');

    process.stdout.write('PASS persistent pair Rules emulator: Daniel=Player One and Nik=Player Two are canonical, mismatched roles are rejected, private account get, no list/delete, registered-device writes, active-career replacement denial, terminal closed-career fresh replacement, rivalry membership and expired-pending replacement safety, mandatory atomic post-redeem recovery witness, witness-less redemption denial, and stale-tab double-active rollback are enforced.\n');
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});
