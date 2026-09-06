const assert=require("node:assert/strict");
const fs=require("node:fs");
const firestore=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestore;
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");

const PROJECT_ID="demo-career-mode-showdown-shared-setup-session";
const RULES=fs.readFileSync("firestore.shared-setup-candidate.rules","utf8");
const A="acct_setup_session_a";
const B="acct_setup_session_b";
const C="acct_setup_session_c";
const R=`pair_${"d".repeat(64)}`;
const ACTIVE=`session_${"a".repeat(64)}`;
const CLOSED=`session_${"b".repeat(64)}`;
const EXPIRED=`session_${"c".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`;
const DB=`device_${"b".repeat(32)}`;
const DC=`device_${"c".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`;
const PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`;
const SB=`save_${"2".repeat(24)}`;
const OP1=`setup_op_${"1".repeat(32)}`;
const OP2=`setup_op_${"2".repeat(32)}`;

function account(id,status="active"){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status}};}
function device(id,state="active"){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{
  connectionState:"active",
  authorizedAccountIds:[A,B],
  managerSlots:[
    {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
    {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
  ]
}};}
function session(id,state,expiresAt){return {objectType:"session",objectId:id,lifecycleState:"live",data:{
  rivalryId:R,state,hostAccountId:A,memberAccountIds:[A,B],expiresAt
}};}
function openLedger(sessionId){return {
  schemaVersion:1,
  objectType:"sharedSetupLedger",
  rivalryId:R,
  revision:1,
  phase:"SHARED_SETUP_OPEN",
  coordinatorRole:"playerOne",
  operationIds:[OP1],
  operationTypes:["open"],
  baseRevisions:[0],
  actorRoles:["playerOne"],
  totalSeasons:null,
  confirmedRoles:[],
  activeSessionId:sessionId,
  updatedAt:serverTimestamp(),
  updatedByDeviceId:DA
};}
function leagueLedger(before,sessionId=ACTIVE){return {
  ...before,
  revision:2,
  phase:"LEAGUE_WHEEL_COMMITTED",
  operationIds:[...before.operationIds,OP2],
  operationTypes:[...before.operationTypes,"commit-league"],
  baseRevisions:[...before.baseRevisions,1],
  actorRoles:[...before.actorRoles,"playerOne"],
  activeSessionId:sessionId,
  updatedAt:serverTimestamp(),
  updatedByDeviceId:DA
};}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    const now=Date.now();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const future=Timestamp.fromMillis(now+10*60*1000);
      const past=Timestamp.fromMillis(now-1000);
      for(const id of [A,B,C])await setDoc(doc(db,"accounts",id),account(id));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
      await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"accounts",C,"devices",DC),device(DC));
      await setDoc(doc(db,"rivalries",R),rivalry());
      await setDoc(doc(db,"rivalries",R,"sessions",ACTIVE),session(ACTIVE,"active",future));
      await setDoc(doc(db,"rivalries",R,"sessions",CLOSED),session(CLOSED,"closed",future));
      await setDoc(doc(db,"rivalries",R,"sessions",EXPIRED),session(EXPIRED,"active",past));
    });

    const dbA=env.authenticatedContext(A).firestore();
    const dbB=env.authenticatedContext(B).firestore();
    const dbC=env.authenticatedContext(C).firestore();
    const refA=doc(dbA,"rivalries",R,"sharedSetup","authoritative");

    await assertFails(setDoc(refA,openLedger(CLOSED)));
    await assertFails(setDoc(refA,openLedger(EXPIRED)));
    await assertFails(setDoc(doc(dbC,"rivalries",R,"sharedSetup","authoritative"),openLedger(ACTIVE)));

    await assertSucceeds(setDoc(refA,openLedger(ACTIVE)));
    const stored=(await assertSucceeds(getDoc(refA))).data();
    assert.equal(stored.activeSessionId,ACTIVE,"Provider authority must persist the exact ACTIVE Firestore session document ID.");

    await assertFails(setDoc(refA,leagueLedger(stored,CLOSED)));
    await assertFails(setDoc(refA,leagueLedger(stored,EXPIRED)));

    const peerRef=doc(dbB,"rivalries",R,"sharedSetup","authoritative");
    const peerAttempt={...leagueLedger(stored,ACTIVE),actorRoles:["playerOne","playerTwo"],updatedByDeviceId:DB};
    await assertFails(setDoc(peerRef,peerAttempt));

    await assertSucceeds(setDoc(refA,leagueLedger(stored,ACTIVE)));
    const advanced=(await assertSucceeds(getDoc(refA))).data();
    assert.equal(advanced.activeSessionId,ACTIVE);
    assert.equal(advanced.revision,2);

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",B),account(B,"disabled"));
    });
    const frozen={...advanced,revision:3,phase:"CLUB_ASSIGNMENTS_COMMITTED",
      operationIds:[...advanced.operationIds,`setup_op_${"3".repeat(32)}`],
      operationTypes:[...advanced.operationTypes,"commit-clubs"],
      baseRevisions:[...advanced.baseRevisions,2],
      actorRoles:[...advanced.actorRoles,"playerOne"],
      updatedAt:serverTimestamp()};
    await assertFails(setDoc(refA,frozen));

    console.log("Shared Showdown Setup exact-session Rules proof passed: no setup before ACTIVE session, exact session ID persisted, closed/expired session substitution denied, unrelated/peer coordinator bypass denied, inactive paired manager freezes progression.");
  }finally{
    await env.cleanup();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
