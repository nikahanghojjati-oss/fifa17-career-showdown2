'use strict';
// JOB-07 career index proofs against the COMPOSED production Rules (firestore.spark.generated.rules built by BOTH scripts).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,runTransaction,setDoc}=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const firestoreSdk=require('firebase/firestore');
const path=require('node:path');
const Pair=require(path.join(__dirname,'../../js/persistentNikDanielPair.js'));
const Pairing=require(path.join(__dirname,'../../js/sparkPrivatePairing.js'));

const PROJECT_ID='demo-cms-career-index';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const CAP=500;
const hash=seed=>`sha256:${String(seed).repeat(64).slice(0,64)}`;
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;
const rid=n=>`pair_${n.toString(16).padStart(64,'0')}`;
let hashSeq=0;const nextHash=()=>`sha256:${(++hashSeq).toString(16).padStart(64,'0')}`;

function envelope({objectType,objectId,revision=0,parentRevision=null,contentHash=nextHash(),priorContentHash=null,updatedAt,accountId,deviceId:updatedByDeviceId=null,data}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:'live',contentHash,priorContentHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
const accountEnvelope=(uid,now)=>envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});
const deviceEnvelope=(uid,id,now)=>envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state:'active',registeredAt:now,lastSeenAt:now,revokedAt:null}});
const openSlot=slotId=>({slotId,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:'open',deletionConsent:false});
const managerSlot=(slotId,uid,ch)=>({slotId,accountId:uid,profileId:`profile_${ch.repeat(24)}`,saveId:`save_${ch.repeat(24)}`,displayLabel:slotId==='playerOne'?'Daniel':'Nik',entitlementState:'active',deletionConsent:false});
const MANAGER={playerOne:'daniel',playerTwo:'nik'};

// Plan the index writes exactly as the provider must: append, or seal a full head into page_N first.
function planIndex(head,uid,device,id,at,{mutate}={}){
  const writes=[];
  if(!head){
    writes.push(['current',envelope({objectType:'careerIndex',objectId:'current',updatedAt:at,accountId:uid,deviceId:device,data:{rivalryIds:[id],sealedPageCount:0}})]);
  }else{
    const ids=head.data.rivalryIds;let data;
    if(ids.length<CAP)data={rivalryIds:[...ids,id],sealedPageCount:head.data.sealedPageCount};
    else{
      const n=head.data.sealedPageCount+1;
      writes.push([`page_${n}`,envelope({objectType:'careerIndexPage',objectId:`page_${n}`,updatedAt:at,accountId:uid,deviceId:device,data:{pageNumber:n,rivalryIds:[...ids]}})]);
      data={rivalryIds:[id],sealedPageCount:n};
    }
    writes.push(['current',envelope({objectType:'careerIndex',objectId:'current',revision:head.revision+1,parentRevision:head.revision,priorContentHash:head.contentHash,updatedAt:at,accountId:uid,deviceId:device,data})]);
  }
  if(mutate)mutate(writes);
  return writes;
}

async function create(db,{uid,device,target,role='playerOne',ch='a',nowMs,index=true,mutate,expiresInMs=600000}){
  const pairRef=doc(db,'accounts',uid,'pairLinks','current'),headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{
    const pairSnap=await tx.get(pairRef),headSnap=index?await tx.get(headRef):{exists:()=>false};           // ALL reads first
    const at=Timestamp.fromMillis(nowMs),invited=role==='playerOne'?'playerTwo':'playerOne';
    const slots=role==='playerOne'?[managerSlot('playerOne',uid,ch),openSlot('playerTwo')]:[openSlot('playerOne'),managerSlot('playerTwo',uid,ch)];
    const rivalry=envelope({objectType:'rivalry',objectId:target,updatedAt:at,accountId:uid,deviceId:device,data:{connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[uid],createdByAccountId:uid,createdAt:at}});
    const invite=envelope({objectType:'invite',objectId:target,updatedAt:at,accountId:uid,deviceId:device,data:{purpose:'rivalry-pairing',slotId:invited,createdByAccountId:uid,createdAt:at,expiresAt:Timestamp.fromMillis(nowMs+expiresInMs),state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null}});
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
    if(pairSnap.exists()){const p=pairSnap.data();revision=p.revision+1;parentRevision=p.revision;priorContentHash=p.contentHash;linkedAt=p.data.linkedAt;}
    const pair=envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,priorContentHash,updatedAt:at,accountId:uid,deviceId:device,data:{rivalryId:target,managerRole:role,managerId:MANAGER[role],linkedAt,lastConfirmedAt:at}});
    const writes=index?planIndex(headSnap.exists()?headSnap.data():null,uid,device,target,at,{mutate}):[];
    tx.set(pairRef,pair);tx.set(doc(db,'rivalries',target),rivalry);tx.set(doc(db,'rivalries',target,'invites',target),invite);
    for(const [id,value] of writes)tx.set(doc(db,'accounts',uid,'careerIndex',id),value);
    return target;
  });
}

async function redeem(db,{uid,device,target,ch='b',nowMs,index=true,mutate,forgeRole}){
  const rivalryRef=doc(db,'rivalries',target),inviteRef=doc(db,'rivalries',target,'invites',target),pairRef=doc(db,'accounts',uid,'pairLinks','current'),headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{
    const rs=await tx.get(rivalryRef),is=await tx.get(inviteRef),ps=await tx.get(pairRef),hs=index?await tx.get(headRef):{exists:()=>false};
    const r=rs.data(),inv=is.data(),at=Timestamp.fromMillis(nowMs),role=inv.data.slotId,linkRole=forgeRole||role;
    const slots=r.data.managerSlots.map(s=>s.slotId===role?managerSlot(role,uid,ch):{...s});
    tx.set(rivalryRef,envelope({objectType:'rivalry',objectId:target,revision:r.revision+1,parentRevision:r.revision,priorContentHash:r.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:{...r.data,connectionState:'active',managerSlots:slots,authorizedAccountIds:[inv.data.createdByAccountId,uid]}}));
    tx.set(inviteRef,envelope({objectType:'invite',objectId:target,revision:inv.revision+1,parentRevision:inv.revision,priorContentHash:inv.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:{...inv.data,state:'redeemed',redeemedByAccountId:uid,redeemedAt:at,revokedAt:null}}));
    let revision=0,parentRevision=null,priorContentHash=null,linkedAt=at;
    if(ps.exists()){const p=ps.data();revision=p.revision+1;parentRevision=p.revision;priorContentHash=p.contentHash;linkedAt=p.data.linkedAt;}
    tx.set(pairRef,envelope({objectType:'pairLink',objectId:'current',revision,parentRevision,priorContentHash,updatedAt:at,accountId:uid,deviceId:device,data:{rivalryId:target,managerRole:linkRole,managerId:MANAGER[linkRole],linkedAt,lastConfirmedAt:at}}));
    if(index)for(const [id,value] of planIndex(hs.exists()?hs.data():null,uid,device,target,at,{mutate}))tx.set(doc(db,'accounts',uid,'careerIndex',id),value);
    return target;
  });
}

// A head-only write (no creation/redemption in the same commit).
async function headOnly(db,uid,device,fn,nowMs){
  const headRef=doc(db,'accounts',uid,'careerIndex','current');
  return runTransaction(db,async tx=>{const h=(await tx.get(headRef)).data();const data=fn(h.data);tx.set(headRef,envelope({objectType:'careerIndex',objectId:'current',revision:h.revision+1,parentRevision:h.revision,priorContentHash:h.contentHash,updatedAt:Timestamp.fromMillis(nowMs),accountId:uid,deviceId:device,data}));});
}

async function closeRivalry(env,target){
  await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'rivalries',target);const r=(await getDoc(ref)).data();await setDoc(ref,{...r,revision:r.revision+1,parentRevision:r.revision,priorContentHash:r.contentHash,contentHash:nextHash(),data:{...r.data,connectionState:'closed'}});});
}
// Expire relative to the REAL clock: request.time is server time, not the test's future tick.
async function expireInvite(env,target){
  await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'rivalries',target,'invites',target);const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{...v.data,expiresAt:Timestamp.fromMillis(Date.now()-60000)}});});
}
const ids=async(env,uid)=>{let out=null;await env.withSecurityRulesDisabled(async c=>{const s=await getDoc(doc(c.firestore(),'accounts',uid,'careerIndex','current'));out=s.exists()?s.data():null;});return out;};
const rivalryExists=async(env,id)=>{let out=false;await env.withSecurityRulesDisabled(async c=>{out=(await getDoc(doc(c.firestore(),'rivalries',id))).exists();});return out;};
let step=0;
async function check(id,label,promise){await promise;step+=1;console.log(`ok ${step} ${id} ${label}`);}
const note=(id,label)=>{step+=1;console.log(`ok ${step} ${id} ${label}`);};

(async()=>{
  // I0: the COMPOSED production Rules (both build scripts), never a single fragment.
  assert.match(RULES,/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/,'I0 composed Rules must contain the career index match');
  assert.match(RULES,/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/,'I0 composed Rules must contain the persistent pair fragment');
  assert.match(RULES,/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/,'I0 composed Rules must contain the Shared Journey fragments');
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const t0=Date.now(),now=Timestamp.fromMillis(t0);
    const D='acct_daniel',N='acct_nik',S='acct_stranger',O='acct_other';
    const dev={[D]:deviceId('d'),[N]:deviceId('e'),[S]:deviceId('5'),[O]:deviceId('6')},dev2={[D]:deviceId('7'),[N]:deviceId('8')};
    const OLD_ACTIVE=rid(0xdead1),OLD_CLOSED=rid(0xdead2),STALE=rid(0xdead3),FOREIGN=rid(0xdead4);
    await env.withSecurityRulesDisabled(async c=>{
      const db=c.firestore();
      for(const uid of [D,N,S,O]){await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(db,'accounts',uid,'devices',dev[uid]),deviceEnvelope(uid,dev[uid],now));if(dev2[uid])await setDoc(doc(db,'accounts',uid,'devices',dev2[uid]),deviceEnvelope(uid,dev2[uid],now));}
      // Pre-deployment development rivalries: they exist, Daniel and Nik are members, nobody ever indexed them.
      const mk=(id,state,a,b)=>envelope({objectType:'rivalry',objectId:id,updatedAt:now,accountId:a.accountId,deviceId:dev[D],data:{connectionState:state,connectionStateBeforeDeletion:null,managerSlots:[a,b],authorizedAccountIds:[a.accountId,b.accountId].filter(Boolean),createdByAccountId:a.accountId,createdAt:now}});
      await setDoc(doc(db,'rivalries',OLD_ACTIVE),mk(OLD_ACTIVE,'active',managerSlot('playerOne',D,'1'),managerSlot('playerTwo',N,'2')));
      await setDoc(doc(db,'rivalries',OLD_CLOSED),mk(OLD_CLOSED,'closed',managerSlot('playerOne',D,'3'),managerSlot('playerTwo',N,'4')));
      await setDoc(doc(db,'rivalries',FOREIGN),mk(FOREIGN,'active',managerSlot('playerOne',S,'5'),managerSlot('playerTwo',O,'6')));
      await setDoc(doc(db,'rivalries',STALE),mk(STALE,'pending-pair',managerSlot('playerOne',D,'7'),openSlot('playerTwo')));
      await setDoc(doc(db,'rivalries',STALE,'invites',STALE),envelope({objectType:'invite',objectId:STALE,updatedAt:now,accountId:D,deviceId:dev[D],data:{purpose:'rivalry-pairing',slotId:'playerTwo',createdByAccountId:D,createdAt:now,expiresAt:Timestamp.fromMillis(t0+600000),state:'open',redeemedByAccountId:null,redeemedAt:null,revokedAt:null}}));
      await setDoc(doc(db,'accounts',N,'pairLinks','current'),envelope({objectType:'pairLink',objectId:'current',updatedAt:now,accountId:N,deviceId:dev[N],data:{rivalryId:OLD_ACTIVE,managerRole:'playerTwo',managerId:'nik',linkedAt:now,lastConfirmedAt:now}}));
    });
    const db={[D]:env.authenticatedContext(D).firestore(),[N]:env.authenticatedContext(N).firestore(),[S]:env.authenticatedContext(S).firestore()};
    const anon=env.unauthenticatedContext().firestore();
    let t=t0+1000;const tick=()=>(t+=1000);
    const X1=rid(1),X2=rid(2),X3=rid(3),X4=rid(4),X5=rid(5);
    const headRef=(dbx,uid,id='current')=>doc(dbx,'accounts',uid,'careerIndex',id);

    // B: creation by Daniel (first pair-link creation, then replacement)
    await check('B1','creation without an index write is denied (first pair link)',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),index:false})));
    assert.equal(await rivalryExists(env,X1),false,'B1 rolled back');
    await check('B2','index create naming a different rivalry is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=[X2];}})));
    await check('B3','index create with two ids (backfill attempt) is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=[OLD_CLOSED,X1];}})));
    await check('B4','index create with sealedPageCount 1 is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].data.sealedPageCount=1;}})));
    await check('B5','index create from an unregistered device is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].updatedByDeviceId=deviceId('9');}})));
    await check('B6','index create signed by another account is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick(),mutate:w=>{w[0][1].updatedByAccountId=N;}})));
    await check('B7','first creation: pair link create + rivalry + invite + index create commit together',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X1,nowMs:tick()})));
    let h=await ids(env,D);assert.deepEqual(h.data,{rivalryIds:[X1],sealedPageCount:0});assert.equal(h.revision,0);

    // A: access
    await check('A1','Daniel gets his own careerIndex/current',assertSucceeds(getDoc(headRef(db[D],D))));
    await check('A2','Nik cannot get Daniel careerIndex/current',assertFails(getDoc(headRef(db[N],D))));
    await check('A3','stranger cannot get Daniel careerIndex/current',assertFails(getDoc(headRef(db[S],D))));
    await check('A4','unauthenticated get is denied',assertFails(getDoc(headRef(anon,D))));
    await check('A5','owner list of careerIndex is denied',assertFails(getDocs(collection(db[D],'accounts',D,'careerIndex'))));
    await check('A6','owner delete of careerIndex/current is denied',assertFails(deleteDoc(headRef(db[D],D))));
    await check('A7','owner get of a non-index id is denied',assertFails(getDoc(headRef(db[D],D,'backup'))));

    await expireInvite(env,X1);
    await check('B8','replacement creation without an index append is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick(),index:false})));
    await check('B9','replacement creation: pair link update + index append commit together',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick()})));
    h=await ids(env,D);assert.deepEqual(h.data.rivalryIds,[X1,X2]);assert.equal(h.revision,1);

    // C: Nik (pre-deployment link, then redemption)
    const reconfirm=(dbx,uid,withIndex)=>runTransaction(dbx,async tx=>{const ref=doc(dbx,'accounts',uid,'pairLinks','current'),href=headRef(dbx,uid);const p=(await tx.get(ref)).data();await tx.get(href);const at=Timestamp.fromMillis(tick());tx.set(ref,{...p,revision:p.revision+1,parentRevision:p.revision,priorContentHash:p.contentHash,contentHash:nextHash(),updatedAt:at,updatedByDeviceId:dev[uid],data:{...p.data,lastConfirmedAt:at}});if(withIndex)tx.set(href,envelope({objectType:'careerIndex',objectId:'current',updatedAt:at,accountId:uid,deviceId:dev[uid],data:{rivalryIds:[p.data.rivalryId],sealedPageCount:0}}));});
    await check('C1','reconfirming a pre-deployment link together with an index create is denied (no import)',assertFails(reconfirm(db[N],N,true)));
    await check('C2','reconfirming a pre-deployment link alone still works (Continue is not import)',assertSucceeds(reconfirm(db[N],N,false)));
    assert.equal(await ids(env,N),null,'C2 a pre-deployment link never creates an index');
    await closeRivalry(env,OLD_ACTIVE);
    await check('C3','redemption without an index write is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),index:false})));
    await check('C4','stale pre-deployment invite (creator never indexed it) cannot be redeemed',assertFails(redeem(db[N],{uid:N,device:dev[N],target:STALE,nowMs:tick()})));
    await check('C5','redemption whose pair link claims the other role is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),forgeRole:'playerOne'})));
    await check('C6','redemption whose index write is signed by another account is denied',assertFails(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick(),mutate:w=>{w[0][1].updatedByAccountId=D;}})));
    await check('C7','redemption: pair link replace + rivalry + invite + index create commit together',assertSucceeds(redeem(db[N],{uid:N,device:dev[N],target:X2,nowMs:tick()})));
    assert.deepEqual((await ids(env,N)).data.rivalryIds,[X2]);

    // D: append-only integrity (head-only writes, no creation/redemption in the commit)
    const D_=(id,label,fn)=>check(id,label,assertFails(headOnly(db[D],D,dev[D],fn,tick())));
    await D_('D1','reorder is denied',d=>({...d,rivalryIds:[X2,X1]}));
    await D_('D2','reorder plus a new id is denied',d=>({...d,rivalryIds:[X2,X1,X3]}));
    await D_('D3','duplicate append is denied',d=>({...d,rivalryIds:[X1,X2,X2]}));
    await D_('D4','two new ids in one write are denied',d=>({...d,rivalryIds:[X1,X2,X3,X4]}));
    await D_('D5','replacing an existing entry is denied',d=>({...d,rivalryIds:[X1,X3]}));
    await D_('D6','truncation is denied',d=>({...d,rivalryIds:[X1]}));
    await D_('D7','standalone append of a closed development rivalry is denied',d=>({...d,rivalryIds:[X1,X2,OLD_CLOSED]}));
    await D_('D8','standalone append of an active development rivalry is denied',d=>({...d,rivalryIds:[X1,X2,OLD_ACTIVE]}));
    await D_('D9','append of a rivalry the account is not in is denied',d=>({...d,rivalryIds:[X1,X2,FOREIGN]}));
    await D_('D10','no-op rewrite is denied',d=>({...d}));
    await D_('D11','sealedPageCount tamper is denied',d=>({...d,sealedPageCount:1}));
    await check('D12','Nik cannot write Daniel index',assertFails(setDoc(headRef(db[N],D),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:N,deviceId:dev[N],data:{rivalryIds:[X2],sealedPageCount:0}}))));
    await check('D13','stranger cannot create an index naming a rivalry they are not in',assertFails(setDoc(headRef(db[S],S),envelope({objectType:'careerIndex',objectId:'current',updatedAt:now,accountId:S,deviceId:dev[S],data:{rivalryIds:[X2],sealedPageCount:0}}))));
    await check('D14','head write with a skipped revision is denied',assertFails(runTransaction(db[D],async tx=>{const ref=headRef(db[D],D);const v=(await tx.get(ref)).data();tx.set(ref,{...v,revision:v.revision+2,parentRevision:v.revision,priorContentHash:v.contentHash,contentHash:nextHash(),data:{...v.data,rivalryIds:[...v.data.rivalryIds,X3]}});})));

    // E: idempotency
    const before=await ids(env,D);
    await check('E1','pair-link reconfirm of the same rivalry without an index write succeeds',assertSucceeds(runTransaction(db[D],async tx=>{const ref=doc(db[D],'accounts',D,'pairLinks','current');const p=(await tx.get(ref)).data();const at=Timestamp.fromMillis(tick());tx.set(ref,{...p,revision:p.revision+1,parentRevision:p.revision,priorContentHash:p.contentHash,contentHash:nextHash(),updatedAt:at,data:{...p.data,lastConfirmedAt:at}});})));
    assert.deepEqual(await ids(env,D),before,'E1 reconfirm leaves the index byte-identical');
    await check('E2','replaying a committed creation (same rivalry id) is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X2,nowMs:tick()})));
    assert.deepEqual((await ids(env,D)).data.rivalryIds,[X1,X2],'E2 index unchanged');

    // F: two-device races
    await closeRivalry(env,X2);
    const race=await Promise.allSettled([create(db[D],{uid:D,device:dev[D],target:X3,nowMs:tick()}),create(env.authenticatedContext(D).firestore(),{uid:D,device:dev2[D],target:X4,nowMs:tick()})]);
    h=await ids(env,D);assert.equal(race.filter(r=>r.status==='fulfilled').length,1,'F1 exactly one creation commits');assert.equal(h.data.rivalryIds.length,3,'F1 exactly one new entry');
    const winner=h.data.rivalryIds[2];assert.ok([X3,X4].includes(winner));note('F1','two-device creation race: one commit, one new entry');
    const race2=await Promise.allSettled([redeem(env.authenticatedContext(N).firestore(),{uid:N,device:dev[N],target:winner,nowMs:tick()}),redeem(env.authenticatedContext(N).firestore(),{uid:N,device:dev2[N],target:winner,nowMs:tick()})]);
    assert.equal(race2.filter(r=>r.status==='fulfilled').length,1,'F2 exactly one redemption commits');
    assert.deepEqual((await ids(env,N)).data.rivalryIds,[X2,winner],'F2 one entry per redeemed rivalry');note('F2','two-device redemption race: one commit, one entry');

    // H: agreement on the shared, paired set (Daniel's never-paired X1 excluded; no cross-account read by clients)
    const dIds=(await ids(env,D)).data.rivalryIds,nIds=(await ids(env,N)).data.rivalryIds,paired=[];
    await env.withSecurityRulesDisabled(async c=>{for(const id of dIds){const r=(await getDoc(doc(c.firestore(),'rivalries',id))).data();if(r.data.authorizedAccountIds.length===2)paired.push(id);}});
    assert.deepEqual(paired,nIds,'H1');note('H1',"Daniel's paired ids equal Nik's ids, same order");

    // G: capacity and paging
    await closeRivalry(env,winner);
    const full=Array.from({length:CAP},(_,i)=>rid(0x100000+i));
    await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'accounts',D,'careerIndex','current');const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{rivalryIds:full,sealedPageCount:0}});});
    await check('G1','creation at capacity without any index write is denied (never start unindexed)',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),index:false})));
    await check('G2','a 501st entry without sealing a page is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w.splice(0,1);w[0][1].data={rivalryIds:[...full,X5],sealedPageCount:0};}})));
    await check('G3','sealing a page that drops an id is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w[0][1].data.rivalryIds=full.slice(1);}})));
    await check('G4','sealing into the wrong page number is denied',assertFails(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick(),mutate:w=>{w[0][0]='page_2';w[0][1].objectId='page_2';w[0][1].data.pageNumber=2;w[1][1].data.sealedPageCount=2;}})));
    await check('G5','creation at capacity seals page_1 and starts a new head in the same commit',assertSucceeds(create(db[D],{uid:D,device:dev[D],target:X5,nowMs:tick()})));
    h=await ids(env,D);assert.deepEqual(h.data,{rivalryIds:[X5],sealedPageCount:1});
    await check('G6','owner gets page_1',assertSucceeds(getDoc(headRef(db[D],D,'page_1'))));
    await check('G7','other manager cannot get page_1',assertFails(getDoc(headRef(db[N],D,'page_1'))));
    await check('G8','page update is denied',assertFails(setDoc(headRef(db[D],D,'page_1'),envelope({objectType:'careerIndexPage',objectId:'page_1',revision:1,parentRevision:0,priorContentHash:hash('0'),updatedAt:now,accountId:D,deviceId:dev[D],data:{pageNumber:1,rivalryIds:full.slice(1)}}))));
    await check('G9','page delete is denied',assertFails(deleteDoc(headRef(db[D],D,'page_1'))));
    await check('G10','standalone page create is denied',assertFails(setDoc(headRef(db[D],D,'page_2'),envelope({objectType:'careerIndexPage',objectId:'page_2',updatedAt:now,accountId:D,deviceId:dev[D],data:{pageNumber:2,rivalryIds:[X5]}}))));

    // P: provider level (real js/persistentNikDanielPair.js witnesses inside real js/sparkPrivatePairing.js transactions)
    const PD='acct_prov_daniel',PN='acct_prov_nik';const pdev={[PD]:deviceId('a'),[PN]:deviceId('b')};
    await env.withSecurityRulesDisabled(async c=>{for(const uid of [PD,PN]){await setDoc(doc(c.firestore(),'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(c.firestore(),'accounts',uid,'devices',pdev[uid]),deviceEnvelope(uid,pdev[uid],now));}});
    const pdb={[PD]:env.authenticatedContext(PD).firestore(),[PN]:env.authenticatedContext(PN).firestore()};
    const ctx=uid=>({services:{firestoreSdk,firestore:pdb[uid]},accountId:uid,deviceId:pdev[uid]});
    const identity=uid=>({schemaVersion:1,installationId:`installation_${pdev[uid].slice(7)}`,deviceId:pdev[uid],createdAtEpochMs:t0-180000});
    const binding=(role,ch)=>({saveId:`save_${ch.repeat(24)}`,profileId:`profile_${ch.repeat(24)}`,managerRole:role,displayLabel:role==='playerOne'?'Daniel':'Nik'});
    const readIdx=(asUid,ofUid)=>Pair.readCareerIndex({firestore:pdb[asUid],firebaseSdk:firestoreSdk,accountId:ofUid});
    const pair=async capability=>{
      const created=await Pairing.createPairing({user:{uid:PD},firestore:pdb[PD],firebaseSdk:firestoreSdk,identity:identity(PD),binding:binding('playerOne','a'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableCreationWitness(ctx(PD),'playerOne',Pair.managerByRole.playerOne)});
      assert.equal(created.ok,true,JSON.stringify(created));assert.equal(created.durableWitness.careerIndexAppended,true);
      const redeemed=await Pairing.redeemPairing({user:{uid:PN},firestore:pdb[PN],firebaseSdk:firestoreSdk,identity:identity(PN),binding:binding('playerTwo','b'),capability,nowEpochMs:tick(),cryptoImpl:require('node:crypto').webcrypto,durableWitness:Pair.createDurableRedemptionWitness(ctx(PN),'playerTwo',Pair.managerByRole.playerTwo,capability)});
      assert.equal(redeemed.ok,true,JSON.stringify(redeemed));
    };
    let r=await readIdx(PD,PD);assert.deepEqual([r.status,r.rivalryIds],['ready',[]]);note('P1','readCareerIndex on a new career is ready and empty');
    const P1=rid(0x9001),P2=rid(0x9002);
    await pair(P1);note('P2','provider creation and redemption each commit pair link + rivalry + invite + index in one transaction');
    for(const uid of [PD,PN]){r=await readIdx(uid,uid);assert.deepEqual([r.status,r.rivalryIds],['ready',[P1]]);}note('P3','both managers read the same ordered ids');
    r=await readIdx(PN,PD);assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);note('P4',"reading another account's index is unavailable, never empty");
    await closeRivalry(env,P1);await pair(P2);
    for(const uid of [PD,PN]){r=await readIdx(uid,uid);assert.deepEqual(r.rivalryIds,[P1,P2]);}note('P5','second Showdown: both indexes are [P1, P2]; the pair link moved on, history stayed');
    await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'accounts',PN,'careerIndex','current');const v=(await getDoc(ref)).data();await setDoc(ref,{...v,data:{...v.data,sealedPageCount:1}});});
    r=await readIdx(PN,PN);assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);note('P6','a missing sealed page makes the index unavailable, never shorter');
    console.log(`PASS career index composed-Rules emulator: ${step} numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).`);
  }finally{
    try{await env.clearFirestore();}catch(_e){}
    await env.cleanup();
  }
})().catch(e=>{process.stderr.write(`${e&&e.stack?e.stack:e}\n`);process.exit(1);});
