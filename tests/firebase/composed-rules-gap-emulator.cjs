"use strict";
// JOB-12 (G-12): the composed-Rules checks no existing suite makes against the COMPOSED production Rules
// (firestore.spark.generated.rules built by BOTH scripts). One `ok <n> <id> <label>` line per check.
//   L  list/query denial sweep over every collection the Rules name
//   X  delete denial sweep over every document type the Rules name
//   V  private scope: own-account documents, rival and stranger denials
//   P  pairing plus exact ACTIVE before league/club authority (a modified client that lies about the root)
// Run by tests/firebase/composed-production-rules-regression.cjs, or alone inside emulators:exec.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,deleteDoc,getDocs,collection,collectionGroup,query,where,limit,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.localStorage={getItem(){throw new Error("no localStorage");},setItem(){throw new Error("no localStorage");},removeItem(){throw new Error("no localStorage");}};
const setupProvider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID=process.env.CMS_GAP_PROJECT_ID||"demo-cms-composed-rules-gap";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
assert.ok(RULES.includes("match /accounts/{accountId}/pairLinks/{pairId}")&&RULES.includes("match /accounts/{accountId}/careerIndex/{indexId}"),"composed Rules must carry the persistent pair and career index authority (rebuild BOTH scripts)");

const D="acct_daniel",N="acct_nik",X="acct_stranger",I="acct_inactive";
const DD=`device_${"d".repeat(32)}`,DN=`device_${"e".repeat(32)}`,DX=`device_${"f".repeat(32)}`;
const PD=`profile_${"1".repeat(24)}`,PN=`profile_${"2".repeat(24)}`,SD=`save_${"1".repeat(24)}`,SN=`save_${"2".repeat(24)}`;
const rid=c=>`pair_${c.repeat(64)}`;
const S=`session_${"5".repeat(64)}`;
const R=rid("a");                       // sweep rivalry (active, Daniel + Nik)
const RA=rid("b"),RP=rid("c"),RC=rid("d"),RU=rid("e"),RT=rid("f"),RX=rid("1"),RI=rid("2"),RS=rid("3"),RE=rid("4");
const T="season_1";

function account(id,status="active"){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status}};}
function device(id,state="active"){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state}};}
function slot(role,accountId,entitlementState="active"){return {slotId:role,accountId,profileId:role==="playerOne"?PD:PN,saveId:role==="playerOne"?SD:SN,entitlementState};}
function rivalry(id,{connectionState="active",lifecycleState="live",authorized=[D,N],slots=[slot("playerOne",D),slot("playerTwo",N)]}={}){
  return {objectType:"rivalry",objectId:id,lifecycleState,data:{connectionState,authorizedAccountIds:authorized,managerSlots:slots}};
}
function session(id,rivalryId,{state="active",members=[D,N],host=D,expiresAtMs}){
  const expiresAt=Timestamp.fromMillis(expiresAtMs);
  return {schemaVersion:1,objectType:"session",objectId:id,revision:1,parentRevision:0,lifecycleState:"live",
    contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,
    updatedAt:Timestamp.fromMillis(expiresAtMs-60000),updatedByAccountId:host,updatedByDeviceId:host===D?DD:DN,
    data:{rivalryId,state,hostAccountId:host,memberAccountIds:members,createdAt:Timestamp.fromMillis(expiresAtMs-300000),expiresAt,lastActivityAt:Timestamp.fromMillis(expiresAtMs-60000),revokedAt:null},tombstone:null};
}
const plain=label=>({objectType:"g12",label});

let n=0;
const failures=[];
async function check(id,label,promise){
  n+=1;
  try{await promise;process.stdout.write(`ok ${n} ${id} ${label}\n`);}
  catch(error){failures.push(id);process.stdout.write(`not ok ${n} ${id} ${label}: ${String(error&&error.message||error).split("\n")[0]}\n`);}
}

// A modified client: the real setup provider, but every transaction read of the root, the actor's account and
// the session is rewritten to look like a healthy paired ACTIVE Showdown. Only Rules can still say no.
function lyingSdk(){
  const patch=(path,value)=>{
    if(!value)return value;
    if(/^rivalries\/[^/]+$/.test(path))return {...value,lifecycleState:"live",data:{...value.data,connectionState:"active",authorizedAccountIds:[D,N],managerSlots:[slot("playerOne",D),slot("playerTwo",N)]}};
    if(/^rivalries\/[^/]+\/sessions\/[^/]+$/.test(path))return {...value,data:{...value.data,state:"active",memberAccountIds:[D,N]}};
    return value;
  };
  return {
    Timestamp,doc,serverTimestamp,
    runTransaction:(db,fn)=>firestoreSdk.runTransaction(db,tx=>fn({
      get:async ref=>{const snap=await tx.get(ref);if(!snap.exists())return snap;const data=patch(ref.path,snap.data());return {id:snap.id,ref:snap.ref,exists:()=>true,data:()=>data};},
      set:(...a)=>tx.set(...a),update:(...a)=>tx.update(...a),delete:(...a)=>tx.delete(...a)
    }))
  };
}
let opSeed=0;
async function openSetup(db,rivalryId,now){
  opSeed+=1;
  return setupProvider.mutate({user:{uid:D},firestore:db,firebaseSdk:lyingSdk(),deviceId:DD,rivalryId,sessionId:S,nowEpochMs:now,type:"open",baseRevision:0,
    operationId:`setup_op_${String(opSeed).repeat(32).slice(0,32)}`,cryptoImpl:crypto.webcrypto});
}
async function expectOpen(db,rivalryId,now,allowed){
  const result=await openSetup(db,rivalryId,now);
  if(allowed){assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.state.phase,"SHARED_SETUP_OPEN");}
  else{assert.equal(result.ok,false,"Rules must deny the forged open");assert.equal(result.code,"permission-denied",JSON.stringify(result));}
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const now=Date.now();
    const future=now+10*60*1000;
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const id of [D,N,X])await setDoc(doc(db,"accounts",id),account(id));
      await setDoc(doc(db,"accounts",I),account(I,"deletion-requested"));
      await setDoc(doc(db,"accounts",D,"devices",DD),device(DD));
      await setDoc(doc(db,"accounts",N,"devices",DN),device(DN));
      await setDoc(doc(db,"accounts",X,"devices",DX),device(DX));
      await setDoc(doc(db,"accounts",D,"profileLinks",PD),plain("profileLink"));
      await setDoc(doc(db,"accounts",D,"securityEvents","event_1"),plain("securityEvent"));
      await setDoc(doc(db,"accounts",D,"pairLinks","current"),plain("pairLink"));
      await setDoc(doc(db,"accounts",D,"pairLinks","previous"),plain("pairLink-not-current"));
      await setDoc(doc(db,"accounts",D,"careerIndex","current"),plain("careerIndex"));
      await setDoc(doc(db,"accounts",N,"pairLinks","current"),plain("pairLink"));
      await setDoc(doc(db,"accounts",N,"careerIndex","current"),plain("careerIndex"));
      await setDoc(doc(db,"rivalries",R),rivalry(R));
      await setDoc(doc(db,"rivalries",R,"sessions",S),session(S,R,{expiresAtMs:future}));
      await setDoc(doc(db,"rivalries",R,"invites",R),plain("invite"));
      await setDoc(doc(db,"rivalries",R,"state","authoritative"),plain("state"));
      await setDoc(doc(db,"rivalries",R,"state","authoritative","idempotency","k_1"),plain("idempotency"));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),plain("setup"));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","leagueProjection"),plain("leagueProjection"));
      await setDoc(doc(db,"rivalries",R,"careerStart","authoritative"),plain("careerStart"));
      await setDoc(doc(db,"rivalries",R,"transferChallenges",T),plain("transfer"));
      await setDoc(doc(db,"rivalries",R,"transferChallenges",T,"roles","playerOne"),plain("transferRole"));
      await setDoc(doc(db,"rivalries",R,"seasonResults",T),plain("results"));
      await setDoc(doc(db,"rivalries",R,"seasonResults",T,"roles","playerOne"),plain("resultsRole"));
      await setDoc(doc(db,"rivalries",R,"seasonCommits",T),plain("commit"));
      // P rivalries: each differs from the RA control in exactly one fact.
      const p=[[RA,{}],[RP,{connectionState:"pending-pair"}],[RC,{connectionState:"closed"}],[RU,{connectionState:"ACTIVE"}],[RT,{lifecycleState:"tombstoned"}],
        [RX,{authorized:[D,N,X]}],[RI,{authorized:[D,I],slots:[slot("playerOne",D),slot("playerTwo",I)]}],[RS,{}],[RE,{slots:[slot("playerOne",D),slot("playerTwo",N,"pending")]}]];
      for(const [id,shape] of p){
        await setDoc(doc(db,"rivalries",id),rivalry(id,shape));
        const members=id===RI?[D,I]:[D,N];
        await setDoc(doc(db,"rivalries",id,"sessions",S),session(S,id,{expiresAtMs:future,members,state:id===RS?"revoked":"active"}));
      }
    });
    const dbD=env.authenticatedContext(D).firestore();
    const dbN=env.authenticatedContext(N).firestore();
    const dbX=env.authenticatedContext(X).firestore();
    const dbU=env.unauthenticatedContext().firestore();
    const r=(...p)=>doc(dbD,"rivalries",R,...p);

    // L: list and query denial for Daniel (owner of his account, member of the active rivalry R).
    const lists=[
      ["L1","accounts",collection(dbD,"accounts")],
      ["L2","own devices",collection(dbD,"accounts",D,"devices")],
      ["L3","own profileLinks",collection(dbD,"accounts",D,"profileLinks")],
      ["L4","own securityEvents",collection(dbD,"accounts",D,"securityEvents")],
      ["L5","own pairLinks",collection(dbD,"accounts",D,"pairLinks")],
      ["L6","own careerIndex",collection(dbD,"accounts",D,"careerIndex")],
      ["L7","rivalries",collection(dbD,"rivalries")],
      ["L8","rivalries where authorizedAccountIds contains Daniel",query(collection(dbD,"rivalries"),where("data.authorizedAccountIds","array-contains",D),limit(5))],
      ["L9","R sessions",collection(dbD,"rivalries",R,"sessions")],
      ["L10","R invites",collection(dbD,"rivalries",R,"invites")],
      ["L11","R state",collection(dbD,"rivalries",R,"state")],
      ["L12","R idempotency",collection(dbD,"rivalries",R,"state","authoritative","idempotency")],
      ["L13","R sharedSetup",collection(dbD,"rivalries",R,"sharedSetup")],
      ["L14","R careerStart",collection(dbD,"rivalries",R,"careerStart")],
      ["L15","R transferChallenges",collection(dbD,"rivalries",R,"transferChallenges")],
      ["L16","R transfer roles",collection(dbD,"rivalries",R,"transferChallenges",T,"roles")],
      ["L17","R seasonResults",collection(dbD,"rivalries",R,"seasonResults")],
      ["L18","R result roles",collection(dbD,"rivalries",R,"seasonResults",T,"roles")],
      ["L19","R seasonCommits",collection(dbD,"rivalries",R,"seasonCommits")],
      ["L20","collection group roles",collectionGroup(dbD,"roles")],
      ["L21","collection group pairLinks",collectionGroup(dbD,"pairLinks")],
      ["L22","collection group careerIndex",collectionGroup(dbD,"careerIndex")]
    ];
    for(const [id,label,ref] of lists)await check(id,`Daniel cannot list ${label}`,assertFails(getDocs(ref)));

    // X: delete denial for the owner/member on every document type, then prove nothing was removed.
    const deletes=[
      ["X1","his account",doc(dbD,"accounts",D)],["X2","his device",doc(dbD,"accounts",D,"devices",DD)],
      ["X3","his profileLink",doc(dbD,"accounts",D,"profileLinks",PD)],["X4","his securityEvent",doc(dbD,"accounts",D,"securityEvents","event_1")],
      ["X5","his pairLinks/current",doc(dbD,"accounts",D,"pairLinks","current")],["X6","his careerIndex/current",doc(dbD,"accounts",D,"careerIndex","current")],
      ["X7","the rivalry root",r()],["X8","the session",r("sessions",S)],["X9","the invite",r("invites",R)],
      ["X10","state/authoritative",r("state","authoritative")],["X11","an idempotency receipt",r("state","authoritative","idempotency","k_1")],
      ["X12","sharedSetup/authoritative",r("sharedSetup","authoritative")],["X13","sharedSetup/leagueProjection",r("sharedSetup","leagueProjection")],
      ["X14","careerStart/authoritative",r("careerStart","authoritative")],["X15","the transfer challenge",r("transferChallenges",T)],
      ["X16","his transfer role",r("transferChallenges",T,"roles","playerOne")],["X17","season results",r("seasonResults",T)],
      ["X18","his result role",r("seasonResults",T,"roles","playerOne")],["X19","the season commit",r("seasonCommits",T)]
    ];
    for(const [id,label,ref] of deletes)await check(id,`Daniel cannot delete ${label}`,assertFails(deleteDoc(ref)));
    await check("X20","every swept document still exists (read with Rules disabled)",env.withSecurityRulesDisabled(async context=>{
      for(const [,,ref] of deletes){const snap=await getDoc(doc(context.firestore(),ref.path));assert.ok(snap.exists(),`${ref.path} was deleted`);}
    }));

    // V: private scope.
    await check("V1","Daniel gets his own account (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D))));
    await check("V2","Daniel gets his own pairLinks/current (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"pairLinks","current"))));
    await check("V3","Daniel gets his own careerIndex/current (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"careerIndex","current"))));
    await check("V4","Daniel gets his own device (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"devices",DD))));
    await check("V5","Nik cannot get Daniel's account",assertFails(getDoc(doc(dbN,"accounts",D))));
    await check("V6","Nik cannot get Daniel's pairLinks/current",assertFails(getDoc(doc(dbN,"accounts",D,"pairLinks","current"))));
    await check("V7","Nik cannot get Daniel's careerIndex/current",assertFails(getDoc(doc(dbN,"accounts",D,"careerIndex","current"))));
    await check("V8","Nik cannot get Daniel's device",assertFails(getDoc(doc(dbN,"accounts",D,"devices",DD))));
    await check("V9","Daniel cannot get his own pairLinks/previous (only current is readable)",assertFails(getDoc(doc(dbD,"accounts",D,"pairLinks","previous"))));
    await check("V10","stranger cannot get the rivalry root",assertFails(getDoc(doc(dbX,"rivalries",R))));
    await check("V11","stranger cannot get the session",assertFails(getDoc(doc(dbX,"rivalries",R,"sessions",S))));
    await check("V12","stranger cannot get sharedSetup/authoritative",assertFails(getDoc(doc(dbX,"rivalries",R,"sharedSetup","authoritative"))));
    await check("V13","stranger cannot get a transfer role",assertFails(getDoc(doc(dbX,"rivalries",R,"transferChallenges",T,"roles","playerOne"))));
    await check("V14","unauthenticated cannot get the rivalry root",assertFails(getDoc(doc(dbU,"rivalries",R))));
    await check("V15","Daniel cannot overwrite Nik's careerIndex/current",assertFails(setDoc(doc(dbD,"accounts",N,"careerIndex","current"),plain("forged"))));
    await check("V16","Daniel cannot write a pair link for the stranger",assertFails(setDoc(doc(dbD,"accounts",X,"pairLinks","current"),plain("forged"))));
    await check("V17","stranger cannot get Nik's pairLinks/current",assertFails(getDoc(doc(dbX,"accounts",N,"pairLinks","current"))));

    // P: pairing plus exact ACTIVE before league/club authority. Same modified client every time; only the real root differs.
    await check("P1","control: paired ACTIVE root, active session: the forged-client open is accepted",expectOpen(dbD,RA,now,true));
    await check("P2","root still pending-pair: open denied",expectOpen(dbD,RP,now,false));
    await check("P3","root closed without a witness (abandoned): open denied",expectOpen(dbD,RC,now,false));
    await check("P4","root connectionState 'ACTIVE' (not exact): open denied",expectOpen(dbD,RU,now,false));
    await check("P5","root lifecycleState tombstoned: open denied",expectOpen(dbD,RT,now,false));
    await check("P6","three authorized accounts: open denied",expectOpen(dbD,RX,now,false));
    await check("P7","rival account not active: open denied",expectOpen(dbD,RI,now,false));
    await check("P8","session revoked: open denied",expectOpen(dbD,RS,now,false));
    await check("P9","rival slot entitlement not active: open denied",expectOpen(dbD,RE,now,false));
    await check("P10","no setup ledger exists on any denied root (Rules disabled read)",env.withSecurityRulesDisabled(async context=>{
      for(const id of [RP,RC,RU,RT,RX,RI,RS,RE])assert.equal((await getDoc(doc(context.firestore(),"rivalries",id,"sharedSetup","authoritative"))).exists(),false,id);
      assert.equal((await getDoc(doc(context.firestore(),"rivalries",RA,"sharedSetup","authoritative"))).exists(),true,"control ledger");
    }));
  }finally{await env.cleanup();}
  if(failures.length){process.stdout.write(`FAIL composed Rules gap emulator: ${failures.length} of ${n} checks failed: ${failures.join(", ")}\n`);process.exit(1);}
  process.stdout.write(`PASS composed Rules gap emulator: ${n} numbered checks (L list sweep, X delete sweep, V private scope, P pairing plus exact ACTIVE before league/club authority).\n`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
