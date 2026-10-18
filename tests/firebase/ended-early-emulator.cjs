const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Timestamp,doc,getDoc,runTransaction,setDoc}=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');

// r80 END SHOWDOWN: the abandon write (cmsPersistentPairAbandonValid) may carry endedEarly:{seasonsPlayed}
// with seasonsPlayed an int 0..10 or null (count unknown). Nothing else about the abandon write loosens.
const PROJECT_ID='demo-career-mode-showdown-ended-early';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const hash=seed=>`sha256:${String(seed).repeat(64).slice(0,64)}`;
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;

function envelope({objectType,objectId,revision=0,parentRevision=null,contentHash=hash('0'),priorContentHash=null,updatedAt,accountId,deviceId:updatedByDeviceId=null,data}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:'live',contentHash,priorContentHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
const accountEnvelope=(uid,now)=>envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});
const deviceEnvelope=(uid,id,now)=>envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state:'active',registeredAt:now,lastSeenAt:now,revokedAt:null}});
const openSlot=slotId=>({slotId,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:'open',deletionConsent:false});
const managerSlot=(slotId,uid,char)=>({slotId,accountId:uid,profileId:`profile_${char.repeat(24)}`,saveId:`save_${char.repeat(24)}`,displayLabel:slotId==='playerOne'?'Daniel':'Nik',entitlementState:'active',deletionConsent:false});
function rivalryEnvelope(id,now,p1,p2,state){
  const accounts=[p1.accountId,p2.accountId].filter(Boolean);
  return envelope({objectType:'rivalry',objectId:id,updatedAt:now,accountId:accounts[0],deviceId:deviceId('f'),data:{connectionState:state,connectionStateBeforeDeletion:null,managerSlots:[p1,p2],authorizedAccountIds:accounts,createdByAccountId:accounts[0],createdAt:now}});
}
const pairEnvelope=(uid,id,role,managerId,device,now)=>envelope({objectType:'pairLink',objectId:'current',contentHash:hash('a'),updatedAt:now,accountId:uid,deviceId:device,data:{rivalryId:id,managerRole:role,managerId,linkedAt:now,lastConfirmedAt:now}});

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const nowMs=Date.now(),now=Timestamp.fromMillis(nowMs),at=Timestamp.fromMillis(nowMs+2500);
    const ids={d:deviceId('d'),n:deviceId('e'),x:deviceId('c')};
    let next=0;
    const freshId=()=>{next+=1;return `pair_${next.toString(16).padStart(64,'0')}`;};
    // A fresh live Showdown between Daniel and Nik, with Daniel's (and Nik's) current pair link on it.
    async function seedLive(state='active'){
      const id=freshId();
      await testEnv.withSecurityRulesDisabled(async context=>{
        const db=context.firestore();
        const p2=state==='pending-pair'?openSlot('playerTwo'):managerSlot('playerTwo','acct_n','2');
        await setDoc(doc(db,'rivalries',id),rivalryEnvelope(id,now,managerSlot('playerOne','acct_d','1'),p2,state));
        await setDoc(doc(db,'accounts','acct_d','pairLinks','current'),pairEnvelope('acct_d',id,'playerOne','daniel',ids.d,now));
        if(state!=='pending-pair')await setDoc(doc(db,'accounts','acct_n','pairLinks','current'),pairEnvelope('acct_n',id,'playerTwo','nik',ids.n,now));
      });
      return id;
    }
    // withSecurityRulesDisabled resolves to nothing, so the read result leaves through a local.
    async function read(id){
      let value;
      await testEnv.withSecurityRulesDisabled(async context=>{value=(await getDoc(doc(context.firestore(),'rivalries',id))).data();});
      return value;
    }
    // The abandon write the client makes (one transaction, like pair.abandonCurrentShowdown), with optional
    // extra data fields (the ended-early mark). The prior revision is read with Rules off so a stranger's
    // write reaches the rivalry update rule instead of failing on the read.
    async function abandon(db,{uid,device,id,state='closed',extra={},omit=[]}){
      const before=await read(id);
      const data={...before.data,connectionState:state,...extra};
      for(const key of omit)delete data[key];
      const after=envelope({objectType:'rivalry',objectId:id,revision:before.revision+1,parentRevision:before.revision,contentHash:hash('e'),priorContentHash:before.contentHash,updatedAt:at,accountId:uid,deviceId:device,data});
      return runTransaction(db,async transaction=>{transaction.set(doc(db,'rivalries',id),after);});
    }

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const [uid,key] of [['acct_d','d'],['acct_n','n'],['acct_x','x']]){
        await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));
        await setDoc(doc(db,'accounts',uid,'devices',ids[key]),deviceEnvelope(uid,ids[key],now));
      }
    });
    const dbD=testEnv.authenticatedContext('acct_d').firestore(),dbN=testEnv.authenticatedContext('acct_n').firestore(),dbX=testEnv.authenticatedContext('acct_x').firestore();
    const asDaniel=(id,options={})=>abandon(dbD,{uid:'acct_d',device:ids.d,id,...options});

    console.log('CHECKPOINT valid-mark-accepted');
    for(const seasonsPlayed of [0,1,10,null]){
      const id=await seedLive();
      await assertSucceeds(asDaniel(id,{extra:{endedEarly:{seasonsPlayed}}}));
      const closed=await read(id);
      assert.equal(closed.data.connectionState,'closed');
      assert.deepEqual(closed.data.endedEarly,{seasonsPlayed},`endedEarly ${seasonsPlayed} is stored as written`);
      assert.equal(closed.revision,1);
    }
    {
      const id=await seedLive();
      await assertSucceeds(abandon(dbN,{uid:'acct_n',device:ids.n,id,extra:{endedEarly:{seasonsPlayed:2}}}));
      assert.deepEqual((await read(id)).data.endedEarly,{seasonsPlayed:2},'Nik (playerTwo) may END too');
    }
    {
      const id=await seedLive('pending-pair');
      await assertSucceeds(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:0}}}));
      assert.deepEqual((await read(id)).data.endedEarly,{seasonsPlayed:0},'a pending-pair Showdown can be ended with 0 seasons');
    }

    console.log('CHECKPOINT old-abandon-path');
    {
      const id=await seedLive();
      await assertSucceeds(asDaniel(id));
      const closed=await read(id);
      assert.equal(closed.data.connectionState,'closed');
      assert.equal('endedEarly' in closed.data,false,'the old abandon write without the mark still closes');
    }

    console.log('CHECKPOINT bad-shapes-refused');
    const bad=[
      ['string count',{seasonsPlayed:'2'}],
      ['11 seasons',{seasonsPlayed:11}],
      ['-1 seasons',{seasonsPlayed:-1}],
      ['float count',{seasonsPlayed:1.5}],
      ['bool count',{seasonsPlayed:true}],
      ['extra key',{seasonsPlayed:1,endedAt:at}],
      ['missing key',{}],
      ['wrong key',{seasons:1}]
    ];
    for(const [label,mark] of bad){
      const id=await seedLive();
      await assertFails(asDaniel(id,{extra:{endedEarly:mark}}));
      assert.equal((await read(id)).data.connectionState,'active',`${label}: rivalry stays active`);
    }
    for(const [label,mark] of [['string',"1"],['number',1],['null',null],['list',[1]],['bool',true]]){
      const id=await seedLive();
      await assertFails(asDaniel(id,{extra:{endedEarly:mark}}));
      assert.equal((await read(id)).data.connectionState,'active',`non-map ${label}: rivalry stays active`);
    }

    console.log('CHECKPOINT protections-kept');
    {
      const id=await seedLive();
      // Stranger, unregistered device, other field changed alongside the mark, wrong final state.
      await assertFails(abandon(dbX,{uid:'acct_x',device:ids.x,id,extra:{endedEarly:{seasonsPlayed:1}}}));
      await assertFails(asDaniel(id,{device:deviceId('z'),extra:{endedEarly:{seasonsPlayed:1}}}));
      await assertFails(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:1},createdByAccountId:'acct_tampered'}}));
      await assertFails(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:1},otherMark:true}}));
      await assertFails(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:1},terminalClose:{sessionId:'x'}}}));
      assert.equal((await read(id)).data.connectionState,'active','refused writes leave the Showdown active');
    }

    console.log('CHECKPOINT mark-only-on-abandon');
    {
      // On a live Showdown without closing it.
      const id=await seedLive();
      await assertFails(asDaniel(id,{state:'active',extra:{endedEarly:{seasonsPlayed:1}}}));
      // On an already closed Showdown (with or without a mark): no second write, no rewrite of the mark.
      await assertSucceeds(asDaniel(id));
      await assertFails(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:1}}}));
      const marked=await seedLive();
      await assertSucceeds(asDaniel(marked,{extra:{endedEarly:{seasonsPlayed:3}}}));
      await assertFails(asDaniel(marked,{extra:{endedEarly:{seasonsPlayed:4}}}));
      await assertFails(asDaniel(marked,{omit:['endedEarly']}));
      assert.deepEqual((await read(marked)).data.endedEarly,{seasonsPlayed:3},'the mark is written once');
    }

    console.log('CHECKPOINT closed-marked-rivalry-reads');
    {
      const id=await seedLive();
      await assertSucceeds(asDaniel(id,{extra:{endedEarly:{seasonsPlayed:null}}}));
      assert.deepEqual((await assertSucceeds(getDoc(doc(dbD,'rivalries',id)))).data().data.endedEarly,{seasonsPlayed:null});
      assert.deepEqual((await assertSucceeds(getDoc(doc(dbN,'rivalries',id)))).data().data.endedEarly,{seasonsPlayed:null});
      await assertFails(getDoc(doc(dbX,'rivalries',id)));
      await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(),'rivalries',id)));
    }

    process.stdout.write('PASS ended-early Rules emulator: the abandon write may carry endedEarly {seasonsPlayed: 0..10 or null} (Daniel or Nik, active or pending-pair); the old abandon without the mark still closes; string, out-of-range, float, bool, extra/missing/wrong key and non-map marks are refused; stranger, unregistered device, other changed fields and terminalClose stay refused; the mark cannot be added without closing, nor added or rewritten on a closed Showdown; members still read the closed marked rivalry and strangers cannot.\n');
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});
