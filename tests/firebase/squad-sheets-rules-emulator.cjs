"use strict";
// r91 Squad Management (Nik 2026-11-11) in the composed production Rules (firestore.spark.generated.rules). One create-only
// document per manager per screen, rivalries/{rid}/squadSheets/season_N_<stage>_<role>, written only by that manager
// through js/squadSheetStep.js (the real store code runs here against the emulator).
//   1. Only the manager whose role the document names creates it, with the exact shape, server time and a matching id.
//   2. Nobody updates, deletes or lists a squad sheet; outsiders cannot read one.
//   3. LOCK is idempotent: a second create of the same screen (another device, a lost answer) reads the stored one back.
//   4. Before the Roulette the rival's locked "pre" sheet reaches the other phone (listener or read), and both phones
//      rebuild the same Roulette boards from the two documents (js/squadSheet.js replay, js/rosterRoulette.js sheets).
//   6. Sol S-SQ-01: a fair 10-season Showdown that loans the same twelve men out every season (back at each season's end)
//      locks every screen of both managers through the store; the departures list stays far under the Rules' 100.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-squad-sheets \
//     "node tests/firebase/squad-sheets-rules-emulator.cjs"
const assert=require("node:assert/strict");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,updateDoc,deleteDoc,getDocs,collection,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
const storage=new Map();
globalThis.readStorageValue=key=>storage.has(key)?storage.get(key):null;
globalThis.writeStorageValue=(key,value)=>{storage.set(key,value);return true;};
const Step=require("../../js/squadSheetStep.js");
const S=require("../../js/squadSheet.js");
const R=require("../../js/rosterRoulette.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const A="acct_squad_rules_a",B="acct_squad_rules_b",C="acct_squad_rules_outsider";
const RID=`pair_${"9".repeat(64)}`;
const SID=`session_${"e".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const CLUBS={playerOne:"Arsenal",playerTwo:"Chelsea"};

async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(rid=RID){return {objectType:"rivalry",objectId:rid,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
]}};}
const plainSdk=()=>({Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp,onSnapshot:firestoreSdk.onSnapshot});
const io=(db,rid=RID)=>({firestore:db,sdk:plainSdk(),rivalryId:rid,sessionId:SID,deviceId:DA});
const ctx=(role,season,stage,rid=RID,seasons=3)=>({rivalryId:rid,managerRole:role,season,stage,clubs:CLUBS,special:null,seasons});
function sheetDoc(role,season,stage,sheet,rid=RID){
  return {...S.toDoc(sheet),schemaVersion:1,objectType:"sharedSquadSheet",rivalryId:rid,seasonNumber:season,stage,role};
}

(async()=>{
  const checks=[];
  const env=await initializeTestEnvironment({projectId:"demo-cms-squad-sheets-rules",firestore:{rules:RULES}});
  try{
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",RID),rivalryDoc());
    });
    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbC=env.authenticatedContext(C).firestore();
    const ref=(db,id)=>doc(db,"rivalries",RID,"squadSheets",id);
    const daniel=S.launch(CLUBS.playerOne),nik=S.launch(CLUBS.playerTwo);
    const good=(role,season=1,stage="pre")=>({...sheetDoc(role,season,stage,role==="playerOne"?daniel:nik),lockedAt:serverTimestamp()});

    // 1. Creation.
    await assertPlainDenial(setDoc(ref(dbB,"season_1_pre_playerOne"),good("playerOne")),"Nik locks Daniel's squad");
    await assertPlainDenial(setDoc(ref(dbC,"season_1_pre_playerOne"),good("playerOne")),"an outsider locks a squad");
    await assertPlainDenial(setDoc(ref(dbA,"season_2_pre_playerOne"),good("playerOne")),"a document whose season does not match its id");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_post_playerOne"),good("playerOne")),"a document whose screen does not match its id");
    await assertPlainDenial(setDoc(ref(dbA,"season_11_pre_playerOne"),good("playerOne",11)),"season 11");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_mid_playerOne"),{...good("playerOne"),stage:"mid"}),"a screen that is not pre or post");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),lockedAt:Timestamp.fromMillis(Date.now()-60_000)}),"a phone-clock lockedAt");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),extra:true}),"an extra field");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),names:good("playerOne").names.slice(0,15)}),"15 names instead of the 18 (XI and 7 subs)");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),outNames:["X"]}),"departure lists of different lengths");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),rivalryId:`pair_${"8".repeat(64)}`}),"another Showdown's id");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),{...good("playerOne"),schemaVersion:2}),"an unknown schema");
    checks.push("only the manager the document names locks it: exact shape, 18 names, matching lists, server time, an id that matches its season, screen and role");

    // 3. LOCK through the store; idempotent.
    const first=await Step.store.create(io(dbA),ctx("playerOne",1,"pre"),sheetDoc("playerOne",1,"pre",daniel));
    assert.equal(first.ok,true,JSON.stringify(first));assert.equal(first.existing,false);
    storage.clear();
    const again=await Step.store.create(io(dbA),ctx("playerOne",1,"pre"),sheetDoc("playerOne",1,"pre",S.apply(daniel,[{t:"auto"}]).sheet));
    assert.equal(again.ok,true);assert.equal(again.existing,true,"the second LOCK reads the stored one back");
    assert.deepEqual(again.data.names,first.data.names,"the first lock stands");
    checks.push("LOCK is one create through the store; a second LOCK of the same screen reads the stored squad back and changes nothing");

    // 2. No update, delete or list; reads only for the two managers.
    await assertPlainDenial(updateDoc(ref(dbA,"season_1_pre_playerOne"),{formation:"4-4-2"}),"Daniel changes his locked squad");
    await assertPlainDenial(setDoc(ref(dbA,"season_1_pre_playerOne"),good("playerOne")),"Daniel overwrites his locked squad");
    await assertPlainDenial(deleteDoc(ref(dbA,"season_1_pre_playerOne")),"Daniel deletes his locked squad");
    await assertPlainDenial(getDocs(collection(dbA,"rivalries",RID,"squadSheets")),"a manager lists the squad sheets");
    await assertPlainDenial(getDoc(ref(dbC,"season_1_pre_playerOne")),"an outsider reads a squad");
    assert.ok((await getDoc(ref(dbB,"season_1_pre_playerOne"))).exists(),"Nik reads Daniel's locked squad (the Roulette board)");
    checks.push("nobody updates, overwrites, deletes or lists a squad sheet; the two managers read them, an outsider cannot");

    // 4. The rival's locked pre sheet reaches the other phone, and both phones build the same boards.
    storage.clear();
    const arrived=new Promise((resolve,reject)=>{Step.store.watch(io(dbA),ctx("playerOne",1,"pre"),resolve,reject).catch(reject);});
    const nikLock=await Step.store.create(io(dbB),ctx("playerTwo",1,"pre"),sheetDoc("playerTwo",1,"pre",S.apply(nik,[{t:"formation",name:"4-4-2"}]).sheet));
    assert.equal(nikLock.ok,true,JSON.stringify(nikLock));
    const seen=await Promise.race([arrived,new Promise((_,reject)=>setTimeout(()=>reject(new Error("the rival's squad never arrived")),15000))]);
    assert.equal(seen.formation,"4-4-2");
    const history={ok:true,results:[null]};
    const boards=role=>{const d=role==="playerOne"?first.data:nikLock.data;const out=S.replay({club:CLUBS[role],special:null,season:1,stage:"pre",events:[null],docs:{"1_pre":d}});return {formation:out.sheet.formation,board:S.board(out.sheet)};};
    const sheets={playerOne:boards("playerOne"),playerTwo:boards("playerTwo")};
    const plan=R.forSeason(RID,CLUBS,1,{sheets});
    assert.ok(plan);assert.equal(plan.formations.playerTwo,"4-4-2");
    assert.deepEqual(plan.boards.playerTwo.map(r=>r.name),S.board(S.replay({club:CLUBS.playerTwo,season:1,stage:"pre",events:[null],docs:{"1_pre":seen}}).sheet).map(r=>r.name));
    void history;
    checks.push("the rival's locked squad reaches the waiting phone, and both phones put the same two squads on the Roulette board");

    // 5. The read path: a fresh phone reads its own locked screen (kept afterwards) and a screen with no document.
    storage.clear();
    const read=await Step.store.get(io(dbA),ctx("playerOne",1,"pre"),"playerOne",1,"pre",false);
    assert.equal(read.ok,true);assert.deepEqual(read.data.names,first.data.names);
    const none=await Step.store.get(io(dbA),ctx("playerOne",1,"post"),"playerOne",1,"post",false);
    assert.equal(none.ok,true);assert.equal(none.data,null);
    checks.push("a fresh phone reads its own locked screen once (then keeps it) and finds no document for a screen not yet locked");

    // 6. Sol S-SQ-01 (2.6.0 audit): the same twelve club players loaned out in seasons 2-9 (each back at the season's end),
    // five of them again in season 10. Before the fix every loan added a departure (101 in season 10: LOCK refused, "check
    // the connection"). Now an ended loan is folded into the man's next record: every screen of both managers locks through
    // the store, a phone that kept nothing reads it back, and the departures list holds twelve men. The Rules are unchanged:
    // 100 departures still save and 101 are still refused, and the screen never sends a document past that (S-SQ-01 words).
    const RID2=`pair_${"7".repeat(64)}`;
    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",RID2),rivalryDoc(RID2));});
    const people=sheet=>[...sheet.xi,...sheet.bench,...sheet.reserves].filter(Boolean);
    for(const [role,db] of [["playerOne",dbA],["playerTwo",dbB]]){
      const events=[null];let sheet=S.launch(CLUBS[role]),borrowers=[],most=0;
      for(let season=1;season<=10;season+=1){
        if(season>1)sheet=S.advance(sheet);
        if(season===2)borrowers=people(sheet).filter(p=>p.signedSeason===null).sort((a,b)=>a.rating-b.rating||a.id.localeCompare(b.id)).slice(0,12).map(p=>p.id);
        if(season>=2)for(const id of borrowers.slice(0,season===10?5:12)){const r=S.leave(sheet,id,"loaned");assert.ok(r.ok,r.reason);sheet=r.sheet;}
        for(const stage of ["pre","post"]){
          if(stage==="post"){if(season===10)break;events[season]={shot:null,released:[],kept:[]};sheet=S.advance(sheet,events[season]);}
          const data=sheetDoc(role,season,stage,sheet,RID2);most=Math.max(most,data.outNames.length);
          assert.ok(Step.parse(data,season,stage,role),`${role} S${season} ${stage}: the screen would send it`);
          const locked=await Step.store.create(io(db,RID2),ctx(role,season,stage,RID2,10),data);
          assert.equal(locked.ok,true,`${role} S${season} ${stage}: LOCK saves (${JSON.stringify(locked)})`);assert.equal(locked.existing,false);
          storage.clear();
          const back=await Step.store.get(io(db,RID2),ctx(role,season,stage,RID2,10),role,season,stage,false);
          assert.equal(back.ok,true);assert.deepEqual(back.data.outNames,data.outNames);
          const rebuilt=S.replay({club:CLUBS[role],special:null,season,stage,events,docs:{[`${season}_${stage}`]:back.data}});
          assert.ok(rebuilt.sheet,rebuilt.error);assert.deepEqual(S.board(rebuilt.sheet),S.board(sheet),`${role} S${season} ${stage}: the same Roulette board`);
        }
      }
      assert.equal(most,12,`${role}: twelve men loaned again and again are twelve departures, never one per loan`);
    }
    const RID3=`pair_${"6".repeat(64)}`;
    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",RID3),rivalryDoc(RID3));});
    const sized=n=>({...good("playerOne",1,"pre"),rivalryId:RID3,outNames:new Array(n).fill("X"),outNumbers:new Array(n).fill(-1),outSigned:new Array(n).fill(0),outReasons:new Array(n).fill("sold"),outSeasons:new Array(n).fill(1)});
    await setDoc(doc(dbA,"rivalries",RID3,"squadSheets","season_1_pre_playerOne"),sized(100)).catch(error=>{throw new Error(`100 departures: ${error.code}`);});
    await assertPlainDenial(setDoc(doc(dbA,"rivalries",RID3,"squadSheets","season_1_post_playerOne"),{...sized(101),stage:"post"}),"101 departures (the Rules' limit stands)");
    checks.push("Sol S-SQ-01: twelve men loaned out every season for ten seasons lock every screen of both managers (twelve departures, not 101); the Rules' 100 stands");
  }finally{await env.cleanup();}
  for(const [i,c] of checks.entries())console.log(`ok ${i+1} ${c}`);
  console.log(`PASS squad sheets Rules emulator (${checks.length} checks)`);
  process.exit(0);
})().catch(error=>{console.error(error);process.exit(1);});
