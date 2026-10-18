'use strict';
// Career start marker ("real career starts here") against the COMPOSED production Rules
// (firestore.spark.generated.rules built by BOTH scripts). Run inside one emulators:exec (firestore only):
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-start \
//     "node tests/firebase/career-start-marker-emulator.cjs"
// accounts/{uid}/careerStart/current: owner on an active device only; created once, active, naming exactly the
// account's career index head ids (or none when no index exists, never when sealed pages exist); afterwards only
// `active` may change, by CAS. No list, no delete. The M cases drive js/careerStartMarker.js itself.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Timestamp,collection,collectionGroup,deleteDoc,doc,getDoc,getDocs,serverTimestamp,setDoc}=require('firebase/firestore');
const firestoreSdk=require('firebase/firestore');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');

const PROJECT_ID='demo-cms-career-start';
const RULES=fs.readFileSync('firestore.spark.generated.rules','utf8');
const Marker=require(path.join(__dirname,'../../js/careerStartMarker.js'));
const deviceId=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;
const rid=n=>`pair_${n.toString(16).padStart(64,'0')}`;
let hashSeq=0;const nextHash=()=>`sha256:${(++hashSeq).toString(16).padStart(64,'0')}`;

function envelope({objectType,objectId,revision=0,parentRevision=null,contentHash=nextHash(),priorContentHash=null,updatedAt,accountId,deviceId:updatedByDeviceId=null,data,lifecycleState='live'}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState,contentHash,priorContentHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId,tombstone:null,data};
}
const accountEnvelope=(uid,now)=>envelope({objectType:'account',objectId:uid,updatedAt:now,accountId:uid,data:{status:'active',createdAt:now,deletionRequestedAt:null}});
const deviceEnvelope=(uid,id,now,state='active')=>envelope({objectType:'device',objectId:id,updatedAt:now,accountId:uid,deviceId:id,data:{deviceId:id,installationId:`installation_${id.slice(7)}`,displayLabel:null,state,registeredAt:now,lastSeenAt:now,revokedAt:state==='active'?null:now}});
const headEnvelope=(uid,ids,now,sealedPageCount=0)=>envelope({objectType:'careerIndex',objectId:'current',revision:ids.length,parentRevision:ids.length-1,priorContentHash:nextHash(),updatedAt:now,accountId:uid,data:{rivalryIds:ids,sealedPageCount}});
// data.startedAt is the server time of the press: serverTimestamp() on create (request.time), then carried unchanged.
const withStart=(data,startedAt)=>data&&!('startedAt' in data)?{...data,startedAt}:data;
const marker=(uid,device,ids,at,extra={})=>envelope({objectType:'careerStart',objectId:'current',updatedAt:at,accountId:uid,deviceId:device,data:{hiddenRivalryIds:ids,active:true,startedAt:serverTimestamp()},...extra,...(extra.data?{data:withStart(extra.data,serverTimestamp())}:{})});
const next=(before,uid,device,at,data,extra={})=>envelope({objectType:'careerStart',objectId:'current',revision:before.revision+1,parentRevision:before.revision,priorContentHash:before.contentHash,updatedAt:at,accountId:uid,deviceId:device,data:withStart(data,before.data.startedAt),...extra});

let step=0;
async function check(id,label,promise){await promise;step+=1;console.log(`ok ${step} ${id} ${label}`);}

(async()=>{
  assert.match(RULES,/match \/accounts\/\{accountId\}\/careerStart\/\{startId\}/,'composed Rules must contain the career start match (rebuild BOTH scripts)');
  assert.match(RULES,/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/,'composed Rules must contain the career index match');
  assert.match(RULES,/function ssjrTerminalValidRivalryUpdate\(rivalryId\)/,'composed Rules must contain the Shared Journey fragments');
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const t0=Date.now(),now=Timestamp.fromMillis(t0);
    const D='acct_daniel',N='acct_nik',E='acct_extra',P='acct_paged',R='acct_revoked',S='acct_stranger',F='acct_free',G='acct_module',H='acct_unfinished',K='acct_race',W='acct_expired_code',V='acct_open_code';
    const dev=Object.fromEntries([[D,'d'],[N,'e'],[E,'a'],[P,'b'],[R,'c'],[S,'5'],[F,'6'],[G,'7'],[H,'8'],[K,'9'],[W,'3'],[V,'4']].map(([uid,seed])=>[uid,deviceId(seed)]));
    const X1=rid(1),X2=rid(2),X3=rid(3),X9=rid(9),LIVE=rid(0x11fe),RACE=rid(0x4ace),OLD=rid(0x01dc),OPEN=rid(0x0bee);
    await env.withSecurityRulesDisabled(async c=>{
      const db=c.firestore();
      for(const uid of Object.keys(dev)){await setDoc(doc(db,'accounts',uid),accountEnvelope(uid,now));await setDoc(doc(db,'accounts',uid,'devices',dev[uid]),deviceEnvelope(uid,dev[uid],now,uid===R?'revoked':'active'));}
      await setDoc(doc(db,'accounts',D,'careerIndex','current'),headEnvelope(D,[X1,X2],now));
      await setDoc(doc(db,'accounts',E,'careerIndex','current'),headEnvelope(E,[X1,X2,X3],now));
      await setDoc(doc(db,'accounts',P,'careerIndex','current'),headEnvelope(P,[X9],now,1));
      await setDoc(doc(db,'accounts',P,'careerIndex','page_1'),envelope({objectType:'careerIndexPage',objectId:'page_1',updatedAt:now,accountId:P,data:{pageNumber:1,rivalryIds:[X1]}}));
      await setDoc(doc(db,'accounts',R,'careerIndex','current'),headEnvelope(R,[X1],now));
      await setDoc(doc(db,'accounts',F,'careerIndex','current'),headEnvelope(F,[X1],now));
      await setDoc(doc(db,'accounts',G,'careerIndex','current'),headEnvelope(G,[X1,X2,X3],now));
      await setDoc(doc(db,'accounts',H,'careerIndex','current'),headEnvelope(H,[X1,LIVE],now));
      await setDoc(doc(db,'accounts',K,'careerIndex','current'),headEnvelope(K,[X1],now));
      await setDoc(doc(db,'accounts',H,'pairLinks','current'),envelope({objectType:'pairLink',objectId:'current',updatedAt:now,accountId:H,deviceId:dev[H],data:{rivalryId:LIVE,managerRole:'playerOne',managerId:'daniel',linkedAt:now,lastConfirmedAt:now}}));
      // r79 PR4: a pending test rivalry whose code has expired (W) no longer blocks the first real START; one still open (V) does.
      for(const [uid,rivalry,expiresAt] of [[W,OLD,Timestamp.fromMillis(t0-60000)],[V,OPEN,Timestamp.fromMillis(t0+20*60000)]]){
        await setDoc(doc(db,'accounts',uid,'careerIndex','current'),headEnvelope(uid,[X1],now));
        await setDoc(doc(db,'accounts',uid,'pairLinks','current'),envelope({objectType:'pairLink',objectId:'current',updatedAt:now,accountId:uid,deviceId:dev[uid],data:{rivalryId:rivalry,managerRole:'playerOne',managerId:'daniel',linkedAt:now,lastConfirmedAt:now}}));
        await setDoc(doc(db,'rivalries',rivalry),envelope({objectType:'rivalry',objectId:rivalry,updatedAt:now,accountId:uid,deviceId:dev[uid],data:{connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:[],authorizedAccountIds:[uid],createdByAccountId:uid,createdAt:now}}));
        await setDoc(doc(db,'rivalries',rivalry,'invites',rivalry),envelope({objectType:'invite',objectId:rivalry,updatedAt:now,accountId:uid,deviceId:dev[uid],data:{state:'open',createdByAccountId:uid,createdAt:now,expiresAt}}));
      }
      await setDoc(doc(db,'rivalries',LIVE),envelope({objectType:'rivalry',objectId:LIVE,updatedAt:now,accountId:H,deviceId:dev[H],data:{connectionState:'active',connectionStateBeforeDeletion:null,managerSlots:[],authorizedAccountIds:[H,S],createdByAccountId:H,createdAt:now}}));
    });
    const db=Object.fromEntries(Object.keys(dev).map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
    const anon=env.unauthenticatedContext().firestore();
    const ref=(dbx,uid,id='current')=>doc(dbx,'accounts',uid,'careerStart',id);
    let t=t0;const at=()=>Timestamp.fromMillis(t+=1000);
    const raw=async uid=>{let out=null;await env.withSecurityRulesDisabled(async c=>{const s=await getDoc(ref(c.firestore(),uid));out=s.exists()?s.data():null;});return out;};

    // A: create, exact list.
    await check('A1','wrong list refused: a prefix of the career index',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2],at()))));
    await check('A2','wrong list refused: the career index reordered',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X3,X2],at()))));
    await check('A3','wrong list refused: a superset of the career index',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3,X9],at()))));
    await check('A4','wrong list refused: an empty list while a career index exists',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[],at()))));
    await check('A5','create refused unless active is true',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{data:{hiddenRivalryIds:[X1,X2,X3],active:false}}))));
    await check('A6','create refused with an extra data key',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{data:{hiddenRivalryIds:[X1,X2,X3],active:true,note:'x'}}))));
    await check('A7','create refused with a non-boolean active',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{data:{hiddenRivalryIds:[X1,X2,X3],active:'true'}}))));
    await check('A8','create refused with a wrong envelope (objectType, revision, document id)',Promise.all([
      assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{objectType:'careerIndex'}))),
      assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{revision:1,parentRevision:0}))),
      assertFails(setDoc(ref(db[E],E,'page_1'),marker(E,dev[E],[X1,X2,X3],at(),{objectId:'page_1'})))
    ]));
    await check('A9','create refused when updatedByAccountId is not the owner',assertFails(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at(),{accountId:D}))));
    await check('A17','create refused when startedAt is not the server time of the write (a client clock value)',assertFails(setDoc(ref(db[F],F),marker(F,dev[F],[X1],at(),{data:{hiddenRivalryIds:[X1],active:true,startedAt:Timestamp.fromMillis(Date.now()-60000)}}))));
    await check('A18','create refused without startedAt',assertFails(setDoc(ref(db[F],F),envelope({objectType:'careerStart',objectId:'current',updatedAt:at(),accountId:F,deviceId:dev[F],data:{hiddenRivalryIds:[X1],active:true}}))));
    await check('A10','owner create ok: exactly the career index ids, oldest first',assertSucceeds(setDoc(ref(db[D],D),marker(D,dev[D],[X1,X2],at()))));
    await check('A11','owner create ok with the full list on a three-Showdown index',assertSucceeds(setDoc(ref(db[E],E),marker(E,dev[E],[X1,X2,X3],at()))));
    await check('A12','no career index: a non-empty list is refused',assertFails(setDoc(ref(db[N],N),marker(N,dev[N],[X1],at()))));
    await check('A13','no career index: an empty list is ok',assertSucceeds(setDoc(ref(db[N],N),marker(N,dev[N],[],at()))));
    await check('A14','sealed career index pages: create refused (head ids and full ids)',Promise.all([
      assertFails(setDoc(ref(db[P],P),marker(P,dev[P],[X9],at()))),
      assertFails(setDoc(ref(db[P],P),marker(P,dev[P],[X1,X9],at())))
    ]));
    await check('A15','inactive device: create refused (revoked device, another account\'s device, no device)',Promise.all([
      assertFails(setDoc(ref(db[R],R),marker(R,dev[R],[X1],at()))),
      assertFails(setDoc(ref(db[F],F),marker(F,dev[D],[X1],at()))),
      assertFails(setDoc(ref(db[F],F),marker(F,null,[X1],at())))
    ]));
    await check('A16','a second create over an existing marker is refused (it is an update, not a CAS)',assertFails(setDoc(ref(db[D],D),marker(D,dev[D],[X1,X2],at()))));

    // B: other accounts.
    await check('B1','other account: get refused',assertFails(getDoc(ref(db[N],D))));
    await check('B2','other account: create refused, even with the owner\'s exact list and an active device',Promise.all([
      assertFails(setDoc(ref(db[S],F),marker(F,dev[S],[X1],at()))),
      assertFails(setDoc(ref(db[S],F),marker(S,dev[S],[X1],at())))
    ]));
    const dBefore=await raw(D);
    await check('B3','other account: update refused',assertFails(setDoc(ref(db[S],D),next(dBefore,S,dev[S],at(),{hiddenRivalryIds:[X1,X2],active:false}))));
    await check('B4','unauthenticated: get, create and update refused',Promise.all([
      assertFails(getDoc(ref(anon,D))),
      assertFails(setDoc(ref(anon,F),marker(F,dev[F],[X1],at()))),
      assertFails(setDoc(ref(anon,D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false})))
    ]));

    // C: owner reads and updates.
    await check('C1','owner get ok; get of another id under careerStart refused',Promise.all([assertSucceeds(getDoc(ref(db[D],D))),assertFails(getDoc(ref(db[D],D,'page_1')))]));
    await check('C2','owner get of a missing marker is allowed (reads as absent)',assertSucceeds(getDoc(ref(db[F],F))));
    await check('C3','hiddenRivalryIds change refused (fewer, more, reordered, alongside an active change)',Promise.all([
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1],active:true}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2,X3],active:true}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X2,X1],active:true}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1],active:false})))
    ]));
    await check('C4','update refused without a CAS step (same revision, skipped revision, wrong prior hash)',Promise.all([
      assertFails(setDoc(ref(db[D],D),{...next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false}),revision:dBefore.revision,parentRevision:dBefore.parentRevision})),
      assertFails(setDoc(ref(db[D],D),{...next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false}),revision:dBefore.revision+2})),
      assertFails(setDoc(ref(db[D],D),{...next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false}),priorContentHash:nextHash()}))
    ]));
    await check('C5','update refused with an extra or missing data key, or a non-boolean active',Promise.all([
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false,note:'x'}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{active:false}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:0})))
    ]));
    await check('C6','update refused from an inactive device or naming another account',Promise.all([
      assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[R],at(),{hiddenRivalryIds:[X1,X2],active:false}))),
      assertFails(setDoc(ref(db[D],D),next(dBefore,N,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false})))
    ]));
    await check('C11','startedAt never changes after the press (update with another startedAt refused)',assertFails(setDoc(ref(db[D],D),next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false,startedAt:Timestamp.fromMillis(dBefore.data.startedAt.toMillis()+1000)}))));
    const off=next(dBefore,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:false});
    await check('C7','active toggle ok: owner switches the marker off',assertSucceeds(setDoc(ref(db[D],D),off)));
    await check('C8','active toggle ok: owner switches it back on',assertSucceeds(setDoc(ref(db[D],D),next(off,D,dev[D],at(),{hiddenRivalryIds:[X1,X2],active:true}))));
    await check('C9','an unchanged re-write still needs CAS and keeps the list',assertSucceeds(setDoc(ref(db[N],N),next((await getDoc(ref(db[N],N))).data(),N,dev[N],at(),{hiddenRivalryIds:[],active:true}))));
    await check('C10','update refused when the marker would leave the live lifecycle',assertFails(setDoc(ref(db[N],N),next((await getDoc(ref(db[N],N))).data(),N,dev[N],at(),{hiddenRivalryIds:[],active:false},{lifecycleState:'tombstoned'}))));

    // D: never deleted, never listed.
    await check('D1','delete refused (owner, other account, unauthenticated)',Promise.all([assertFails(deleteDoc(ref(db[D],D))),assertFails(deleteDoc(ref(db[S],D))),assertFails(deleteDoc(ref(anon,D)))]));
    await check('D2','list refused (own collection, another account\'s collection, collection group)',Promise.all([
      assertFails(getDocs(collection(db[D],'accounts',D,'careerStart'))),
      assertFails(getDocs(collection(db[S],'accounts',D,'careerStart'))),
      assertFails(getDocs(collectionGroup(db[D],'careerStart')))
    ]));
    const still=await raw(D);
    assert.deepEqual({hiddenRivalryIds:still.data.hiddenRivalryIds,active:still.data.active},{hiddenRivalryIds:[X1,X2],active:true},'D3 the marker survives every refused write');
    assert.equal(still.data.startedAt.toMillis(),dBefore.data.startedAt.toMillis(),'D3 startedAt is the original press time');
    assert.equal(still.revision,2);
    await check('D3','after all refusals the marker is unchanged: same list, active, revision 2',Promise.resolve());

    // M: js/careerStartMarker.js against the same Rules (real SDK, real envelopes, real hashes).
    const services=uid=>({firestore:db[uid],firebaseSdk:firestoreSdk,accountId:uid,deviceId:dev[uid],cryptoImpl:require('node:crypto').webcrypto});
    Marker.clearCache();
    await check('M1','module: a missing marker reads as none',(async()=>{const v=await Marker.readMarker(services(G));assert.equal(v.status,'none');assert.deepEqual(Marker.hiddenRivalryIds(v),[]);})());
    let started,serverStarted;
    await check('M2','module: START REAL CAREER writes exactly the career index ids, active',(async()=>{started=await Marker.startRealCareer(services(G));assert.equal(started.status,'ready');assert.equal(started.active,true);assert.deepEqual([...started.hiddenRivalryIds],[X1,X2,X3]);assert.equal(started.revision,0);assert.equal(typeof started.startedAt,'number');
      const raw=(await getDoc(ref(db[G],G))).data();assert.ok(raw.data.startedAt instanceof Timestamp,'startedAt is a server timestamp');assert.ok(Math.abs(raw.data.startedAt.toMillis()-Date.now())<60000);})());
    await check('M3','module: the cached read returns the new marker; a fresh read agrees',(async()=>{assert.deepEqual([...Marker.hiddenRivalryIds(await Marker.readMarker(services(G)))],[X1,X2,X3]);Marker.clearCache();const v=await Marker.readMarker(services(G));assert.deepEqual([...v.hiddenRivalryIds],[X1,X2,X3]);assert.equal(v.active,true);serverStarted=v.startedAt;assert.equal(serverStarted,(await getDoc(ref(db[G],G))).data().data.startedAt.toMillis());})());
    // r79 PR4 (Nik): the SHOW TEST SHOWDOWNS AGAIN switch is gone from Settings; a marker an older build switched off still
    // hides the test games (this check used to expect none hidden).
    await check('M4','module: a marker switched off by the retired SHOW TEST SHOWDOWNS AGAIN still hides the test games',(async()=>{const before=Marker.epoch();const v=await Marker.setActive(false,services(G));assert.equal(v.active,false);assert.equal(v.revision,1);assert.deepEqual([...Marker.hiddenRivalryIds(v)],[X1,X2,X3]);assert.equal(Marker.epoch(),before+1,'a change clears the career caches');})());
    await check('M5','module: switching back on keeps the original list',(async()=>{const v=await Marker.setActive(true,services(G));assert.equal(v.active,true);assert.equal(v.revision,2);assert.deepEqual([...v.hiddenRivalryIds],[X1,X2,X3]);assert.equal(v.startedAt,serverStarted,'toggles keep the original career-start date');Marker.clearCache();assert.equal((await Marker.readMarker(services(G))).startedAt,serverStarted);})());
    await check('M6','module: pressing START again changes nothing (no write, same revision)',(async()=>{const v=await Marker.startRealCareer(services(G));assert.equal(v.revision,2);const raw=(await getDoc(ref(db[G],G))).data();assert.equal(raw.revision,2);assert.equal(raw.objectType,'careerStart');assert.deepEqual(Object.keys(raw.data).sort(),['active','hiddenRivalryIds','startedAt']);})());
    await check('M7','module: refused while the account\'s current Showdown is unfinished; nothing written',(async()=>{
      await assert.rejects(Marker.startRealCareer(services(H)),error=>error.code==='CAREER_START_SHOWDOWN_UNFINISHED');
      assert.equal((await getDoc(ref(db[H],H))).exists(),false);
    })());
    await check('M7b','module (r79 PR4): a pending test Showdown whose code has expired is finished, so the first real START writes the marker',(async()=>{
      const v=await Marker.startRealCareer(services(W));assert.equal(v.status,'ready');assert.deepEqual([...v.hiddenRivalryIds],[X1]);
      assert.equal((await getDoc(ref(db[W],W))).exists(),true);
    })());
    await check('M7c','module (r79 PR4): a pending Showdown whose code is still open is unfinished; nothing written',(async()=>{
      await assert.rejects(Marker.startRealCareer(services(V)),error=>error.code==='CAREER_START_SHOWDOWN_UNFINISHED');
      assert.equal((await getDoc(ref(db[V],V))).exists(),false);
    })());
    await check('M9','module: a Showdown started in another tab during the press makes the transaction retry and refuse; nothing written',(async()=>{
      let injected=false,pairReads=0;
      const racing={...firestoreSdk,runTransaction:(dbx,fn)=>firestoreSdk.runTransaction(dbx,tx=>fn({
        set:(...args)=>tx.set(...args),
        get:async target=>{
          const snapshot=await tx.get(target);
          if(target.path===`accounts/${K}/pairLinks/current`){
            pairReads+=1;
            if(!injected){
              injected=true;
              await env.withSecurityRulesDisabled(async c=>{
                const dbc=c.firestore(),at0=Timestamp.fromMillis(Date.now());
                await setDoc(doc(dbc,'rivalries',RACE),envelope({objectType:'rivalry',objectId:RACE,updatedAt:at0,accountId:K,deviceId:dev[K],data:{connectionState:'pending-pair',connectionStateBeforeDeletion:null,managerSlots:[],authorizedAccountIds:[K],createdByAccountId:K,createdAt:at0}}));
                await setDoc(doc(dbc,'accounts',K,'pairLinks','current'),envelope({objectType:'pairLink',objectId:'current',updatedAt:at0,accountId:K,deviceId:dev[K],data:{rivalryId:RACE,managerRole:'playerOne',managerId:'daniel',linkedAt:at0,lastConfirmedAt:at0}}));
              });
            }
          }
          return snapshot;
        }
      }))};
      await assert.rejects(Marker.startRealCareer({...services(K),firebaseSdk:racing}),error=>error.code==='CAREER_START_SHOWDOWN_UNFINISHED');
      assert.ok(injected&&pairReads>=2,'the pair link was read again on retry');
      assert.equal((await raw(K)),null,'nothing written');
    })());
    await check('M8','module: refused when the career index has sealed pages; nothing written',(async()=>{
      await assert.rejects(Marker.startRealCareer(services(P)),error=>error.code==='CAREER_START_INDEX_PAGED');
      assert.equal((await getDoc(ref(db[P],P))).exists(),false);
    })());
  }finally{
    await env.cleanup();
  }
  console.log(`PASS career start marker composed-Rules emulator: ${step} numbered checks (A create and exact list, B other accounts, C owner reads and CAS toggles, D no delete or list, M provider module).`);
})().catch(error=>{console.error(error);process.exit(1);});
