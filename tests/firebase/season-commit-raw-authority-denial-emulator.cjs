"use strict";

// Audit R84 F03 (r85): raw-SDK denial matrix for the Season Commit write boundary on the composed generated Rules.
// Run inside ONE emulators:exec (firestore only):
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-season-commit-raw-authority \
//     "node tests/firebase/season-commit-raw-authority-denial-emulator.cjs"
//
// The provider suites (for example concurrent-acknowledge R3) prove that the app refuses a revoked device before it
// writes. That does not prove the server boundary: a member can bypass the provider and call setDoc directly. Here the
// real providers drive a valid revision-1 committed season, a wrapper captures the protocol-generated next
// acknowledgement (or the coordinator's create) WITHOUT committing it, one authority fact is changed, and the captured
// payload is sent straight to Firestore with the client SDK. Every invalid case must be permission-denied AND leave the
// stored commit byte-identical (same revision, same acknowledgements). Positive controls prove the captured payload is
// otherwise valid, so a denial is caused by the changed authority fact and nothing else.
//
// Fixture helpers are reused from the concurrent-acknowledge suite exactly as the R84 audit probe did: its source up to
// the first async runner is compiled together with this file's matrix, so the two suites share one fixture.

const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");

if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error("FIRESTORE_EMULATOR_HOST is required: run this suite inside firebase emulators:exec.");
if(!String(process.env.GCLOUD_PROJECT||"demo-cms-season-commit-raw-authority").startsWith("demo-"))throw new Error("A demo- project is required; production is forbidden.");
if(!process.env.GCLOUD_PROJECT)process.env.GCLOUD_PROJECT="demo-cms-season-commit-raw-authority";

const fixtureFile=path.join(__dirname,"shared-season-commit-concurrent-acknowledge-emulator.cjs");
const fixtureSource=fs.readFileSync(fixtureFile,"utf8");
const runnerAt=fixtureSource.indexOf("\n(async()=>{");
if(runnerAt<0)throw new Error("concurrent-acknowledge fixture runner marker not found");
const fixturePrefix=fixtureSource.slice(0,runnerAt);
for(const name of ["prepareCommitted","storedCommit","function account(","function device(","function session("]){
  if(!fixturePrefix.includes(name))throw new Error(`concurrent-acknowledge fixture no longer defines ${name}`);
}

const matrix=String.raw`
const STRANGER="acct_raw_authority_stranger";
const R_FOREIGN="pair_"+"8".repeat(64);
const S_FOREIGN="session_"+"6".repeat(64);
const UNREGISTERED_DEVICE="device_"+"f".repeat(32);
const MISSING_SESSION="session_"+"f".repeat(64);
const COMMIT_ID="season_1";

function canonical(value){
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(value instanceof Timestamp)return JSON.stringify({ts:[value.seconds,value.nanoseconds]});
  if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
  return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
}
function stopCapture(){return Object.assign(new Error("raw authority matrix capture only"),{code:"RAW_MATRIX_CAPTURE"});}
// Run the real provider but take its transaction.set payload instead of committing it.
function captureSdk(sink){
  return {...sdk(),runTransaction:(db,fn)=>firestoreSdk.runTransaction(db,async tx=>fn({
    get:ref=>tx.get(ref),
    set:(ref,data)=>{sink.ref=ref;sink.data=data;throw stopCapture();},
    update:()=>{throw stopCapture();}
  }))};
}
async function captureAcknowledgement(h){
  const sink={};
  await Commit.acknowledgeSeason({...h.b(1100),firebaseSdk:captureSdk(sink),operationId:op("season_commit_op_",88),baseRevision:1});
  assert.ok(sink.data,"capture a protocol-generated legitimate next acknowledgement without committing it");
  assert.equal(sink.data.revision,2);assert.deepEqual(sink.data.acknowledgedRoles,["playerTwo"]);
  return sink.data;
}
async function rulesOff(env,fn){await env.withSecurityRulesDisabled(async context=>fn(context.firestore()));}
async function patchSession(env,ref,patch){
  await rulesOff(env,async db=>{
    const target=doc(db,...ref),old=(await getDoc(target)).data();
    await setDoc(target,{...old,data:{...old.data,...patch}});
  });
}
async function denied(label,write){
  let code=null;
  try{await write();}catch(error){code=error&&error.code;}
  assert.equal(code,"permission-denied",label+": raw write must be permission-denied by the Rules, got "+(code||"ACCEPTED"));
}

const ACK_CASES=[
  {id:"D1",kind:"revoked-device",label:"acting device revoked",mutate:async env=>rulesOff(env,db=>setDoc(doc(db,"accounts",B,"devices",DB),device(DB,"revoked")))},
  {id:"D2",kind:"unregistered-device",label:"device ID never registered to the acting account",payload:p=>({...p,updatedByDeviceId:UNREGISTERED_DEVICE})},
  {id:"D3",kind:"partner-device",label:"device registered to the PARTNER account, not the actor",payload:p=>({...p,updatedByDeviceId:DA})},
  {id:"D4",kind:"deletion-pending-actor",label:"acting account deletion-pending",mutate:async env=>rulesOff(env,db=>setDoc(doc(db,"accounts",B),{...account(B),data:{status:"deletion-pending"}}))},
  {id:"D5",kind:"nonexistent-session",label:"Session ID that does not exist",payload:p=>({...p,activeSessionId:MISSING_SESSION})},
  {id:"D6",kind:"revoked-session",label:"Session state revoked",mutate:async env=>patchSession(env,["rivalries",R,"sessions",S],{state:"revoked"})},
  {id:"D7",kind:"closed-session",label:"Session state closed",mutate:async env=>patchSession(env,["rivalries",R,"sessions",S],{state:"closed"})},
  {id:"D8",kind:"foreign-rivalry-session",label:"ACTIVE Session that belongs to another rivalry",
    mutate:async env=>rulesOff(env,async db=>{
      const foreign=session(Date.now());foreign.objectId=S_FOREIGN;foreign.data={...foreign.data,rivalryId:R_FOREIGN};
      await setDoc(doc(db,"rivalries",R_FOREIGN,"sessions",S_FOREIGN),foreign);
    }),
    payload:p=>({...p,activeSessionId:S_FOREIGN})},
  {id:"D9",kind:"rebound-session",label:"Session document under this rivalry but bound to another rivalry",mutate:async env=>patchSession(env,["rivalries",R,"sessions",S],{rivalryId:R_FOREIGN})},
  {id:"D10",kind:"wrong-member-session",label:"ACTIVE Session whose members are not both managers",mutate:async env=>patchSession(env,["rivalries",R,"sessions",S],{memberAccountIds:[A,STRANGER]})},
  {id:"D11",kind:"stranger",label:"unrelated signed-in account (control)",actor:env=>env.authenticatedContext(STRANGER).firestore()}
];

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  let n=0;
  const ok=(id,text)=>{n+=1;process.stdout.write("ok "+n+" "+id+" "+text+"\n");};
  try{
    // P1: the captured acknowledgement is valid as is (positive control for every D case).
    {
      const h=await prepareCommitted(env);
      const payload=await captureAcknowledgement(h);
      await setDoc(doc(h.dbB,"rivalries",R,"seasonCommits",COMMIT_ID),payload);
      const stored=await storedCommit(env);
      assert.equal(stored.revision,2);assert.deepEqual(stored.acknowledgedRoles,["playerTwo"]);
      ok("P1","valid raw acknowledgement from the registered active device in the ACTIVE Session is accepted (revision 1 -> 2)");
    }
    // P2: ten-season continuity: an ACTIVE Session past its old expiresAt still accepts the acknowledgement.
    {
      const h=await prepareCommitted(env);
      const payload=await captureAcknowledgement(h);
      await patchSession(env,["rivalries",R,"sessions",S],{expiresAt:Timestamp.fromMillis(Date.now()-60_000)});
      await setDoc(doc(h.dbB,"rivalries",R,"seasonCommits",COMMIT_ID),payload);
      assert.equal((await storedCommit(env)).revision,2);
      ok("P2","ACTIVE Session past its expiresAt still accepts the acknowledgement (supported ten-season continuity)");
    }
    for(const c of ACK_CASES){
      const h=await prepareCommitted(env);
      let payload=await captureAcknowledgement(h);
      if(c.mutate)await c.mutate(env);
      if(c.payload)payload=c.payload(payload);
      const before=await storedCommit(env);
      assert.equal(before.revision,1);
      const actorDb=c.actor?c.actor(env):h.dbB;
      await denied(c.id+" "+c.kind,()=>setDoc(doc(actorDb,"rivalries",R,"seasonCommits",COMMIT_ID),payload));
      const after=await storedCommit(env);
      assert.equal(after.revision,1,c.kind+": stored revision must stay 1");
      assert.deepEqual(after.acknowledgedRoles,[],c.kind+": no acknowledgement may be recorded");
      assert.equal(canonical(after),canonical(before),c.kind+": stored commit bytes must be unchanged");
      ok(c.id,"raw acknowledgement with "+c.label+" is permission-denied and the stored commit is unchanged (revision 1, no ACK)");
    }
    // D4r: by decision (audit R84 F01 triage) reads stay membership-only; only writes check the acting account.
    {
      const h=await prepareCommitted(env);
      await rulesOff(env,db=>setDoc(doc(db,"accounts",B),{...account(B),data:{status:"deletion-pending"}}));
      const snapshot=await firestoreSdk.getDocFromServer(doc(h.dbB,"rivalries",R,"seasonCommits",COMMIT_ID));
      assert.equal(snapshot.data().revision,1);
      await assertFails(firestoreSdk.getDocFromServer(doc(env.authenticatedContext(STRANGER).firestore(),"rivalries",R,"seasonCommits",COMMIT_ID)));
      ok("R1","reads stay membership-only by decision: a deletion-pending member can still read the commit, a stranger cannot");
    }
    // C1/C2: the coordinator's raw create. The provider builds the create payload; the stored commit is removed first.
    {
      const captureCreate=async()=>{
        const h=await prepareCommitted(env);
        await rulesOff(env,db=>firestoreSdk.deleteDoc(doc(db,"rivalries",R,"seasonCommits",COMMIT_ID)));
        const sink={};
        await Commit.commitSeason({...h.a(1300),firebaseSdk:captureSdk(sink),operationId:op("season_commit_op_",77),baseRevision:0});
        assert.ok(sink.data,"capture the protocol-generated create");
        assert.equal(sink.data.revision,1);
        return {h,payload:sink.data};
      };
      const exists=async()=>{let value=true;await rulesOff(env,async db=>{value=(await getDoc(doc(db,"rivalries",R,"seasonCommits",COMMIT_ID))).exists();});return value;};
      for(const [id,label,change] of [
        ["C1","a Session ID that does not exist",p=>({...p,activeSessionId:MISSING_SESSION})],
        ["C2","an unregistered device ID",p=>({...p,updatedByDeviceId:UNREGISTERED_DEVICE})]
      ]){
        const {h,payload}=await captureCreate();
        await denied(id,()=>setDoc(doc(h.dbA,"rivalries",R,"seasonCommits",COMMIT_ID),change(payload)));
        assert.equal(await exists(),false,id+": no commit may be created");
        ok(id,"raw coordinator create with "+label+" is permission-denied and no commit is stored");
      }
      {
        const {h,payload}=await captureCreate();
        await rulesOff(env,db=>setDoc(doc(db,"accounts",A),{...account(A),data:{status:"deletion-pending"}}));
        await denied("C3",()=>setDoc(doc(h.dbA,"rivalries",R,"seasonCommits",COMMIT_ID),payload));
        assert.equal(await exists(),false,"C3: no commit may be created");
        ok("C3","raw coordinator create from a deletion-pending account is permission-denied and no commit is stored");
      }
      {
        const {h,payload}=await captureCreate();
        await setDoc(doc(h.dbA,"rivalries",R,"seasonCommits",COMMIT_ID),payload);
        assert.equal((await storedCommit(env)).revision,1);
        ok("C4","the same captured create, unchanged, is accepted (positive control)");
      }
    }
    process.stdout.write("PASS Season Commit raw-SDK authority matrix: "+n+" numbered checks on the composed generated Rules\n");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
`;

// Compiled as this file (same directory as the fixture, so its relative requires resolve identically).
const m=new Module(__filename,module);
m.filename=__filename;
m.paths=Module._nodeModulePaths(__dirname);
m._compile(fixturePrefix+"\n"+matrix,__filename);
