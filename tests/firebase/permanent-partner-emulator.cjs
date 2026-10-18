const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,serverTimestamp,setDoc}=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');

// r79 permanent pairing: accounts/{uid}/partner/current and the private JOIN note accounts/{nik}/partnerInbox/current.
const PROJECT_ID='demo-career-mode-showdown-permanent-partner';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const hash=seed=>`sha256:${String(seed).repeat(64).slice(0,64)}`;
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;

function envelope({objectType,objectId,updatedAt,accountId,deviceId:updatedByDeviceId=null,data}){
  return {schemaVersion:1,objectType,objectId,revision:0,parentRevision:null,lifecycleState:'live',contentHash:hash('0'),priorContentHash:null,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
const accountEnvelope=(uid,now)=>envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});
const deviceEnvelope=(uid,id,now)=>envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state:'active',registeredAt:now,lastSeenAt:now,revokedAt:null}});
const markerEnvelope=(uid,now)=>envelope({objectType:'careerStart',objectId:'current',updatedAt:now,accountId:uid,data:{hiddenRivalryIds:[],active:true,startedAt:now}});
const openSlot=slotId=>({slotId,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:'open',deletionConsent:false});
const managerSlot=(slotId,uid,char)=>({slotId,accountId:uid,profileId:`profile_${char.repeat(24)}`,saveId:`save_${char.repeat(24)}`,displayLabel:slotId==='playerOne'?'Daniel':'Nik',entitlementState:'active',deletionConsent:false});
function rivalryEnvelope(id,now,p1,p2,state,createdBy){
  const accounts=[p1.accountId,p2.accountId].filter(Boolean);
  return envelope({objectType:'rivalry',objectId:id,updatedAt:now,accountId:createdBy,deviceId:deviceId('f'),data:{connectionState:state,connectionStateBeforeDeletion:null,managerSlots:[p1,p2],authorizedAccountIds:accounts,createdByAccountId:createdBy,createdAt:now}});
}
function inviteEnvelope(id,now,expiresAt,createdBy,state='open'){
  return envelope({objectType:'invite',objectId:id,updatedAt:now,accountId:createdBy,deviceId:deviceId('d'),data:{purpose:'rivalry-pairing',slotId:'playerTwo',createdByAccountId:createdBy,createdAt:now,expiresAt,state,redeemedByAccountId:null,redeemedAt:null,revokedAt:null}});
}
const partner=(partnerAccountId,myRole,rivalryId,extra={})=>({schemaVersion:1,partnerAccountId,myRole,pairedViaRivalryId:rivalryId,pairedAt:serverTimestamp(),active:true,updatedAt:serverTimestamp(),...extra});
const note=(rivalryId,totalSeasons,fromAccountId,expiresAt,extra={})=>({schemaVersion:1,rivalryId,totalSeasons,fromAccountId,createdAt:serverTimestamp(),expiresAt,...extra});

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const nowMs=Date.now(),now=Timestamp.fromMillis(nowMs),inviteExpiry=Timestamp.fromMillis(nowMs+20*60000);
    const paired=`pair_1${'0'.repeat(63)}`,pending3=`pair_3${'1'.repeat(63)}`,pending5=`pair_5${'2'.repeat(63)}`,strangerPending=`pair_3${'3'.repeat(63)}`,expiredPending=`pair_3${'4'.repeat(63)}`,unmarkedPair=`pair_1${'5'.repeat(63)}`,stillPending=`pair_1${'6'.repeat(63)}`;
    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const [uid,key] of [['acct_d','d'],['acct_n','n'],['acct_x','x'],['acct_m','m']]){
        await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));
        await setDoc(doc(db,'accounts',uid,'devices',deviceId(key)),deviceEnvelope(uid,deviceId(key),now));
      }
      for(const uid of ['acct_d','acct_n','acct_x'])await setDoc(doc(db,'accounts',uid,'careerStart','current'),markerEnvelope(uid,now));
      await setDoc(doc(db,'rivalries',paired),rivalryEnvelope(paired,now,managerSlot('playerOne','acct_d','1'),managerSlot('playerTwo','acct_n','2'),'active','acct_d'));
      await setDoc(doc(db,'rivalries',unmarkedPair),rivalryEnvelope(unmarkedPair,now,managerSlot('playerOne','acct_d','3'),managerSlot('playerTwo','acct_m','4'),'active','acct_d'));
      await setDoc(doc(db,'rivalries',stillPending),rivalryEnvelope(stillPending,now,managerSlot('playerOne','acct_d','5'),openSlot('playerTwo'),'pending-pair','acct_d'));
      for(const [id,by,expiry] of [[pending3,'acct_d',inviteExpiry],[pending5,'acct_d',inviteExpiry],[strangerPending,'acct_x',inviteExpiry],[expiredPending,'acct_d',Timestamp.fromMillis(nowMs-1000)]]){
        await setDoc(doc(db,'rivalries',id),rivalryEnvelope(id,now,managerSlot('playerOne',by,'6'),openSlot('playerTwo'),'pending-pair',by));
        await setDoc(doc(db,'rivalries',id,'invites',id),inviteEnvelope(id,now,expiry,by));
      }
    });
    const dbD=testEnv.authenticatedContext('acct_d').firestore(),dbN=testEnv.authenticatedContext('acct_n').firestore(),dbX=testEnv.authenticatedContext('acct_x').firestore(),dbM=testEnv.authenticatedContext('acct_m').firestore(),dbAnon=testEnv.unauthenticatedContext().firestore();
    const partnerD=db=>doc(db,'accounts','acct_d','partner','current'),partnerN=db=>doc(db,'accounts','acct_n','partner','current'),inboxN=db=>doc(db,'accounts','acct_n','partnerInbox','current'),inboxD=db=>doc(db,'accounts','acct_d','partnerInbox','current');

    console.log('CHECKPOINT partner-record');
    await assertFails(setDoc(partnerD(dbD),partner('acct_n','playerTwo',paired)));
    await assertFails(setDoc(partnerD(dbD),partner('acct_x','playerOne',paired)));
    await assertFails(setDoc(partnerD(dbD),partner('acct_n','playerOne',stillPending)));
    await assertFails(setDoc(partnerD(dbD),partner('acct_n','playerOne',paired,{pairedAt:now})));
    await assertFails(setDoc(partnerD(dbD),partner('acct_n','playerOne',paired,{extra:true})));
    await assertFails(setDoc(partnerD(dbX),partner('acct_n','playerOne',paired)));
    await assertFails(setDoc(doc(dbM,'accounts','acct_m','partner','current'),partner('acct_d','playerTwo',unmarkedPair)));
    await assertFails(setDoc(doc(dbN,'accounts','acct_n','partner','other'),partner('acct_d','playerTwo',paired)));
    await assertSucceeds(setDoc(partnerD(dbD),partner('acct_n','playerOne',paired)));
    await assertSucceeds(setDoc(partnerN(dbN),partner('acct_d','playerTwo',paired)));
    assert.equal((await assertSucceeds(getDoc(partnerD(dbD)))).data().partnerAccountId,'acct_n');
    await assertSucceeds(getDoc(partnerD(dbN)));
    await assertFails(getDoc(partnerD(dbX)));
    await assertFails(getDoc(partnerD(dbAnon)));
    await assertFails(getDocs(collection(dbD,'accounts','acct_d','partner')));
    await assertFails(deleteDoc(partnerD(dbD)));

    console.log('CHECKPOINT join-note');
    await assertSucceeds(setDoc(inboxN(dbD),note(pending3,3,'acct_d',inviteExpiry)));
    assert.equal((await assertSucceeds(getDoc(inboxN(dbN)))).data().rivalryId,pending3);
    await assertFails(getDoc(inboxN(dbD)));
    await assertFails(getDoc(inboxN(dbX)));
    await assertFails(getDoc(inboxN(dbAnon)));
    await assertFails(getDocs(collection(dbN,'accounts','acct_n','partnerInbox')));
    await assertFails(deleteDoc(inboxN(dbN)));
    await assertFails(setDoc(inboxN(dbD),note(pending3,5,'acct_d',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbD),note(pending3,3,'acct_d',Timestamp.fromMillis(nowMs+30*60000))));
    await assertFails(setDoc(inboxN(dbD),note(pending3,3,'acct_n',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbD),note(pending3,3,'acct_d',inviteExpiry,{createdAt:now})));
    await assertFails(setDoc(inboxN(dbD),note(strangerPending,3,'acct_d',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbD),note(expiredPending,3,'acct_d',Timestamp.fromMillis(nowMs-1000))));
    await assertFails(setDoc(inboxN(dbD),note(paired,1,'acct_d',inviteExpiry)));
    await assertFails(setDoc(inboxD(dbN),note(pending3,3,'acct_n',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbX),note(strangerPending,3,'acct_x',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbN),note(pending3,3,'acct_n',inviteExpiry)));
    await assertFails(setDoc(inboxN(dbD),note(pending3,3,'acct_d',inviteExpiry)));
    await assertSucceeds(setDoc(inboxN(dbD),note(pending5,5,'acct_d',inviteExpiry)));
    assert.equal((await getDoc(inboxN(dbN))).data().totalSeasons,5,'each START replaces the one note');
    await assertFails(setDoc(inboxN(dbD),note(pending5,5,'acct_d',inviteExpiry)));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),'accounts','acct_n','partnerInbox','current'),{...note(pending5,5,'acct_d',inviteExpiry),createdAt:Timestamp.fromMillis(nowMs-120000)});
    });
    await assertSucceeds(setDoc(inboxN(dbD),note(pending5,5,'acct_d',inviteExpiry)));

    console.log('CHECKPOINT unpair-and-repair');
    const nikRecord=(await getDoc(partnerN(dbN))).data();
    await assertFails(setDoc(partnerN(dbN),{...nikRecord,partnerAccountId:'acct_x',updatedAt:serverTimestamp()}));
    await assertFails(setDoc(partnerN(dbN),{...nikRecord,active:false,pairedViaRivalryId:pending3,updatedAt:serverTimestamp()}));
    await assertSucceeds(setDoc(partnerN(dbN),{...nikRecord,active:false,updatedAt:serverTimestamp()}));
    await assertFails(setDoc(inboxN(dbD),note(pending3,3,'acct_d',inviteExpiry)));
    const unpaired=(await getDoc(partnerN(dbN))).data();
    await assertFails(setDoc(partnerN(dbN),{...unpaired,active:true,updatedAt:serverTimestamp()}));
    await assertSucceeds(setDoc(partnerN(dbN),partner('acct_d','playerTwo',paired)));
    await assertSucceeds(setDoc(inboxN(dbD),note(pending3,3,'acct_d',inviteExpiry)));

    process.stdout.write('PASS permanent partner Rules emulator: partner records only by their owner with a real-career marker, matching an active pairing in the right slots, readable by owner and partner only; UNPAIR changes only active and blocks the JOIN note; re-pair needs a fresh valid pairing; the JOIN note is written only by the mutually paired playerOne for his own open pending rivalry with the invite expiry and season count, read only by the inbox owner, replaced on each START (same rivalry only after 60 s), never listed or deleted.\n');
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});
