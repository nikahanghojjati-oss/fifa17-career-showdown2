const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails}=require("@firebase/rules-unit-testing");
const CATALOG=require("../../js/sharedShowdownCatalog.js").catalog;

let localTouches=0;
global.localStorage={
  getItem(){localTouches++;throw new Error("provider adapter must not read canonical localStorage");},
  setItem(){localTouches++;throw new Error("provider adapter must not write canonical localStorage");},
  removeItem(){localTouches++;throw new Error("provider adapter must not mutate canonical localStorage");}
};
const provider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID="demo-career-mode-showdown-shared-setup-provider";
const RULES=fs.readFileSync("firestore.shared-setup-candidate.rules","utf8");
const A="acct_setup_a",B="acct_setup_b",C="acct_setup_c";
const R=`pair_${"a".repeat(64)}`;
const R2=`pair_${"b".repeat(64)}`;
const RBAD=`pair_${"c".repeat(64)}`;
const S1=`session_${"1".repeat(64)}`;
const S2=`session_${"2".repeat(64)}`;
const SWRONG=`session_${"3".repeat(64)}`;
const SEXP=`session_${"4".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id,status="active"){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status}};}
function device(id,state="active"){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state}};}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
];}
function rivalry(id=R,authorized=[A,B],managerSlots=slots()){return {objectType:"rivalry",objectId:id,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:authorized,managerSlots}};}
function session(id,rivalryId,state,host,members,expiresAt){
  const expiresAtMs=expiresAt.toMillis();
  const createdAt=Timestamp.fromMillis(expiresAtMs-(5*60*1000));
  const lastActivityAt=Timestamp.fromMillis(expiresAtMs-(60*1000));
  return {
    schemaVersion:1,
    objectType:"session",
    objectId:id,
    revision:1,
    parentRevision:0,
    lifecycleState:"live",
    contentHash:`sha256:${"0".repeat(64)}`,
    priorContentHash:`sha256:${"1".repeat(64)}`,
    updatedAt:lastActivityAt,
    updatedByAccountId:host,
    updatedByDeviceId:host===A?DA:DB,
    data:{rivalryId,state,hostAccountId:host,memberAccountIds:members,createdAt,expiresAt,lastActivityAt,revokedAt:null},
    tombstone:null
  };
}
function op(char){return `setup_op_${char.repeat(32)}`;}
function options(db,user,deviceId,sessionId,now,type,baseRevision,operationId,extra={}){
  return {user:{uid:user},firestore:db,firebaseSdk:sdk(),deviceId,rivalryId:R,sessionId,nowEpochMs:now,type,baseRevision,operationId,cryptoImpl:crypto.webcrypto,...extra};
}
async function seed(testEnv,now){
  await testEnv.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const future=Timestamp.fromMillis(now+10*60*1000);
    const past=Timestamp.fromMillis(now-1000);
    for(const id of [A,B,C])await setDoc(doc(db,"accounts",id),account(id));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
    await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"accounts",C,"devices",DC),device(DC));
    await setDoc(doc(db,"rivalries",R),rivalry());
    await setDoc(doc(db,"rivalries",R,"sessions",S1),session(S1,R,"active",A,[A,B],future));
    await setDoc(doc(db,"rivalries",R,"sessions",SWRONG),session(SWRONG,R2,"active",A,[A,B],future));
    await setDoc(doc(db,"rivalries",R,"sessions",SEXP),session(SEXP,R,"active",A,[A,B],past));
    await setDoc(doc(db,"rivalries",RBAD),rivalry(RBAD,[A,B,C],slots()));
    await setDoc(doc(db,"rivalries",RBAD,"sessions",S1),session(S1,RBAD,"active",A,[A,B],future));
  });
}
(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    const now=Date.now();
    await testEnv.clearFirestore();
    await seed(testEnv,now);
    const dbA=testEnv.authenticatedContext(A).firestore();
    const dbB=testEnv.authenticatedContext(B).firestore();
    const dbC=testEnv.authenticatedContext(C).firestore();
    const setupRefA=doc(dbA,"rivalries",R,"sharedSetup","authoritative");

    assert.equal(provider.productionEnabled,false);
    assert.equal(provider.billingRequired,false);
    assert.equal(provider.canonicalStorageMutation,false);
    assert.deepEqual(provider.canonicalStorageKeys,["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);

    const open=await provider.mutate(options(dbA,A,DA,S1,now,"open",0,op("1")));
    assert.equal(open.ok,true,JSON.stringify(open));
    assert.equal(open.status,"accepted");
    assert.equal(open.revision,1);
    assert.equal(open.state.phase,"SHARED_SETUP_OPEN");
    assert.equal(open.state.leagueId,null);
    assert.equal(open.state.clubs,null);

    const replay=await provider.mutate(options(dbA,A,DA,S1,now+1,"open",0,op("1")));
    assert.equal(replay.ok,true,JSON.stringify(replay));
    assert.equal(replay.status,"replayed");
    assert.equal(replay.revision,1);
    const conflict=await provider.mutate(options(dbA,A,DA,S1,now+2,"commit-league",1,op("1")));
    assert.equal(conflict.ok,false);
    assert.equal(conflict.code,"SETUP_IDEMPOTENCY_CONFLICT");

    const unrelated=await provider.read({user:{uid:C},firestore:dbC,firebaseSdk:sdk(),deviceId:DC,rivalryId:R,sessionId:S1,nowEpochMs:now+3,cryptoImpl:crypto.webcrypto});
    assert.equal(unrelated.ok,false,"An unrelated authenticated account must be denied.");
    const wrongSession=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:SWRONG,nowEpochMs:now+4,cryptoImpl:crypto.webcrypto});
    assert.equal(wrongSession.ok,false);
    assert.ok(["SETUP_ACTIVE_SESSION_REQUIRED","permission-denied"].includes(wrongSession.code),wrongSession.code);
    const expired=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:SEXP,nowEpochMs:now+4,cryptoImpl:crypto.webcrypto});
    assert.equal(expired.ok,false);
    assert.ok(["SETUP_ACTIVE_SESSION_REQUIRED","permission-denied"].includes(expired.code),expired.code);

    const openLedger=(await getDoc(setupRefA)).data();
    await assertFails(setDoc(setupRefA,{...openLedger,
      revision:2,phase:"LEAGUE_WHEEL_COMMITTED",
      operationIds:[...openLedger.operationIds,op("2")],operationTypes:[...openLedger.operationTypes,"commit-league"],
      baseRevisions:[...openLedger.baseRevisions,1],actorRoles:[...openLedger.actorRoles,"playerOne"],
      updatedAt:serverTimestamp(),leagueId:"laliga"
    }));

    const league=await provider.mutate(options(dbA,A,DA,S1,now+10,"commit-league",1,op("2")));
    assert.equal(league.ok,true,JSON.stringify(league));
    assert.equal(league.revision,2);
    const leagueId=league.state.leagueId;
    assert.ok(Object.hasOwn(CATALOG,leagueId));

    const leagueLedger=(await getDoc(setupRefA)).data();
    await assertFails(setDoc(setupRefA,{...leagueLedger,
      revision:3,phase:"CLUB_ASSIGNMENTS_COMMITTED",
      operationIds:[...leagueLedger.operationIds,op("3")],operationTypes:[...leagueLedger.operationTypes,"commit-clubs"],
      baseRevisions:[...leagueLedger.baseRevisions,2],actorRoles:[...leagueLedger.actorRoles,"playerOne"],
      updatedAt:serverTimestamp(),clubs:{playerOne:CATALOG[leagueId][0],playerTwo:CATALOG[leagueId][1]}
    }));

    const clubs=await provider.mutate(options(dbA,A,DA,S1,now+20,"commit-clubs",2,op("3")));
    assert.equal(clubs.ok,true,JSON.stringify(clubs));
    assert.equal(clubs.revision,3);
    assert.equal(clubs.state.clubs.playerOne===clubs.state.clubs.playerTwo,false);
    assert.ok(CATALOG[leagueId].includes(clubs.state.clubs.playerOne));
    assert.ok(CATALOG[leagueId].includes(clubs.state.clubs.playerTwo));

    const length=await provider.mutate(options(dbA,A,DA,S1,now+30,"commit-length",3,op("4"),{totalSeasons:3}));
    assert.equal(length.ok,true,JSON.stringify(length));
    assert.equal(length.revision,4);
    assert.equal(length.state.totalSeasons,3);

    const confirmA=await provider.mutate(options(dbA,A,DA,S1,now+40,"confirm",4,op("5")));
    assert.equal(confirmA.ok,true,JSON.stringify(confirmA));
    assert.equal(confirmA.revision,5);
    assert.deepEqual(confirmA.state.confirmedRoles,["playerOne"]);

    const confirmB=await provider.mutate(options(dbB,B,DB,S1,now+50,"confirm",5,op("6")));
    assert.equal(confirmB.ok,true,JSON.stringify(confirmB));
    assert.equal(confirmB.revision,6);
    assert.equal(confirmB.state.phase,"SHOWDOWN_CONFIRMED");
    assert.deepEqual(confirmB.state.confirmedRoles,["playerOne","playerTwo"]);

    const finalA=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:S1,nowEpochMs:now+60,cryptoImpl:crypto.webcrypto});
    const finalB=await provider.read({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),deviceId:DB,rivalryId:R,sessionId:S1,nowEpochMs:now+60,cryptoImpl:crypto.webcrypto});
    assert.equal(finalA.ok,true,JSON.stringify(finalA));
    assert.equal(finalB.ok,true,JSON.stringify(finalB));
    assert.deepEqual(finalA.state,finalB.state);
    assert.equal(finalA.state.leagueId,leagueId);
    assert.deepEqual(finalA.state.clubs,clubs.state.clubs);

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const current=(await getDoc(doc(db,"rivalries",R,"sessions",S1))).data();
      await setDoc(doc(db,"rivalries",R,"sessions",S1),{...current,data:{...current.data,state:"closed"}});
      await setDoc(doc(db,"rivalries",R,"sessions",S2),session(S2,R,"active",A,[A,B],Timestamp.fromMillis(now+20*60*1000)));
    });
    const closedOld=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:S1,nowEpochMs:now+70,cryptoImpl:crypto.webcrypto});
    assert.equal(closedOld.ok,false);
    const freshA=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:S2,nowEpochMs:now+70,cryptoImpl:crypto.webcrypto});
    const freshB=await provider.read({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),deviceId:DB,rivalryId:R,sessionId:S2,nowEpochMs:now+70,cryptoImpl:crypto.webcrypto});
    assert.equal(freshA.ok,true,JSON.stringify(freshA));
    assert.equal(freshB.ok,true,JSON.stringify(freshB));
    assert.deepEqual(freshA.state,finalA.state);
    assert.deepEqual(freshB.state,finalA.state);

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const accountB=(await getDoc(doc(db,"accounts",B))).data();
      await setDoc(doc(db,"accounts",B),{...accountB,data:{...accountB.data,status:"disabled"}});
    });
    const frozen=await provider.mutate(options(dbA,A,DA,S2,now+80,"confirm",6,op("7")));
    assert.equal(frozen.ok,false);
    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const accountB=(await getDoc(doc(db,"accounts",B))).data();
      await setDoc(doc(db,"accounts",B),{...accountB,data:{...accountB.data,status:"active"}});
      const deviceA=(await getDoc(doc(db,"accounts",A,"devices",DA))).data();
      await setDoc(doc(db,"accounts",A,"devices",DA),{...deviceA,data:{...deviceA.data,state:"revoked"}});
    });
    const revoked=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:R,sessionId:S2,nowEpochMs:now+90,cryptoImpl:crypto.webcrypto});
    assert.equal(revoked.ok,false);
    assert.equal(localTouches,0,"Provider adapter must not touch canonical localStorage.");
    process.stdout.write("Shared Showdown Setup Spark provider emulator proof passed: paired ACTIVE-session authority, exact-two-manager gating, CAS/idempotency, canonical deterministic non-redrawable league/clubs, direct modified-client denial, same-rivalry fresh-session continuity, identical confirmation, and zero canonical local-save mutation.\n");
  }finally{await testEnv.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});