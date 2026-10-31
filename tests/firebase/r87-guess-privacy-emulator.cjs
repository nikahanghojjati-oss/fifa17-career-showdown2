"use strict";
// r87 W3-4: private guesses stay private (Firestore layer).
// Daniel (playerOne) and Nik (playerTwo) play one Shared Transfer Challenge through the production providers against the
// composed production Rules on the Firestore emulator. After every step of the challenge this test walks EVERY document in
// the database (admin view), asks the Rules for each one AS THE PARTNER, and scans whatever the partner is allowed to read for
// the other manager's private guesses and signings. It also tries the partner's list queries on every collection.
//   C0 window open            nothing private exists yet (baseline)
//   C1 Daniel locked guesses  Nik reads nothing of Daniel's guesses
//   C2 both locked guesses    (SIGNING_ENTRY) neither reads the other's guesses
//   C3 Daniel locked signings neither reads the other's guesses or signings
//   C4 COMPLETED              both read both (positive control: the scanner finds every marker, so the earlier passes mean something)
// Also: the provider's own projection (Transfer.read) never carries the partner's inputs before COMPLETED; the public ledger's
// lock hashes are salted (the true guesses hashed without the salt do not match; with the salt they do, so the replica is right).
// Threat model: normal play. The direct getDoc attempts are the strongest form of "what can the other phone ever receive".
// Emulator only (demo project). Run:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-guess-privacy "node tests/firebase/r87-guess-privacy-emulator.cjs"
// Needs firestore.spark.generated.rules (scripts/build-production-firestore-rules.mjs, then ...-with-persistent-pair.mjs).

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,collection,doc,getDoc,getDocs,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Sessions=require("../../js/sparkPrivateSession.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-r87-guess-privacy";
// CMS_PRIVACY_RULES_FILE: mutation check only (a Rules copy with the reveal gate removed must make this test fail).
const RULES=fs.readFileSync(process.env.CMS_PRIVACY_RULES_FILE||"firestore.spark.generated.rules","utf8");
const A="acct_privacy_daniel",B="acct_privacy_nik";
const R1=`pair_${"7".repeat(64)}`,S1=`session_${"7".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`,SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const SEASON=1,TID=`season_${SEASON}`;

// Each manager's private inputs. The guess ids are chosen so that nothing else in the game (league wheel, clubs, the other
// manager's own inputs) ever carries them, so any copy found in a readable document is a leak.
const PRIVATE={
  playerOne:{who:"Daniel",
    guesses:[{slot:1,type:"league",valueId:"australia-a-league"},{slot:2,type:"nationality",valueId:"iceland"},{slot:3,type:"nationality",valueId:"japan"}],
    signings:[{slot:1,name:"QXDANPRIV Alpha",leagueId:"spain-primera-division",nationalityId:"england",overall:74,position:"ST"},{slot:2,name:"QXDANPRIV Bravo",leagueId:"italy-serie-a",nationalityId:"france",overall:70,position:"CM"}]},
  playerTwo:{who:"Nik",
    guesses:[{slot:1,type:"league",valueId:"belgium-pro-league"},{slot:2,type:"nationality",valueId:"wales"},{slot:3,type:"nationality",valueId:"morocco"}],
    signings:[{slot:1,name:"ZVNIKPRIV Charlie",leagueId:"england-premier-league",nationalityId:"brazil",overall:77,position:"CB"},{slot:2,name:"ZVNIKPRIV Delta",leagueId:"germany-bundesliga",nationalityId:"germany",overall:72,position:"LW"}]}
};
const OTHER={playerOne:"playerTwo",playerTwo:"playerOne"};

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));return `sha256:${hex(new Uint8Array(await crypto.webcrypto.subtle.digest("SHA-256",bytes)))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now())}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:`sha256:${"0".repeat(64)}`,updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-90000);return envelope("rivalry",id,0,{connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now},{updatedAt:now});}
async function pairLink(uid,id,role,managerId,deviceId){const now=Timestamp.fromMillis(Date.now()-80000);return envelope("pairLink","current",0,{rivalryId:id,managerRole:role,managerId,linkedAt:now,lastConfirmedAt:now},{accountId:uid,deviceId,updatedAt:now});}
async function session(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R1,sessionId:S1,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}

// The provider's own lock-hash replica (js/sparkSharedTransferChallenge.js stspCanonical/stspHash).
function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
async function stspHash(value){const bytes=await crypto.webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${hex(new Uint8Array(bytes))}`;}

// What counts as the owner's private data inside some document the partner can read.
function markersFor(role){
  const p=PRIVATE[role];
  return {
    text:p.signings.map(s=>s.name).concat(p.signings.map(s=>s.name.split(" ")[0])),
    guessIds:p.guesses.map(g=>g.valueId)
  };
}
function plain(value){if(value&&typeof value.toMillis==="function")return {$ts:value.toMillis()};if(Array.isArray(value))return value.map(plain);if(value&&typeof value==="object"){const out={};for(const k of Object.keys(value))out[k]=plain(value[k]);return out;}return value;}
// Returns a list of findings (empty = clean).
function scan(data,role,path){
  const m=markersFor(role),json=JSON.stringify(plain(data)),found=[];
  for(const t of m.text)if(json.includes(t))found.push(`${path}: carries ${PRIVATE[role].who}'s signing text "${t}"`);
  for(const id of m.guessIds)if(json.includes(`"valueId":"${id}"`))found.push(`${path}: carries ${PRIVATE[role].who}'s guess row valueId "${id}"`);
  // Any role document of the owner, whatever it holds.
  if(new RegExp(`/roles/${role}$`).test(path)&&/transferChallenges\//.test(path))found.push(`${path}: the owner's private transfer role document itself`);
  return found;
}

// Every document path in the database (admin REST view of the emulator, rules bypassed).
const EMU=process.env.FIRESTORE_EMULATOR_HOST;
async function rest(pathSuffix,body){const url=`http://${EMU}/v1/projects/${PROJECT_ID}/databases/(default)/documents${pathSuffix}`;const r=await fetch(url,{method:body?"POST":"GET",headers:{Authorization:"Bearer owner","content-type":"application/json"},body:body?JSON.stringify(body):undefined});if(r.status!==200)throw new Error(`${url} -> ${r.status} ${await r.text()}`);return r.json();}
async function allDocumentPaths(){
  const out=[],collections=[];
  async function walk(parent){
    const ids=(await rest(`${parent}:listCollectionIds`,{pageSize:300})).collectionIds||[];
    for(const id of ids){
      const coll=`${parent}/${id}`.replace(/^\//,"");collections.push(coll);
      // showMissing lists parent documents that only exist as the path of a subcollection, so the walk reaches every leaf.
      let token="";do{const page=await rest(`/${coll}?pageSize=300&showMissing=true${token?`&pageToken=${token}`:""}`);for(const d of page.documents||[]){const rel=d.name.split("/documents/")[1];if(d.createTime)out.push(rel);await walk(`/${rel}`);}token=page.nextPageToken||"";}while(token);
    }
  }
  await walk("");
  return {docs:out,collections};
}

const report={checkpoints:[],positive:[],findings:[]};
async function partnerSweep(env,label,{expectRevealed=false}={}){
  const {docs,collections}=await allDocumentPaths();
  const dbs={playerOne:env.authenticatedContext(A).firestore(),playerTwo:env.authenticatedContext(B).firestore()};
  const entry={label,documents:docs.length,collections:collections.length,readable:{playerOne:0,playerTwo:0},listable:{playerOne:0,playerTwo:0},leaks:[]};
  for(const observer of ["playerOne","playerTwo"]){
    const owner=OTHER[observer],db=dbs[observer];
    for(const p of docs){
      let snap=null;try{snap=await getDoc(doc(db,...p.split("/")));}catch(_e){snap=null;}
      if(!snap||!snap.exists())continue;
      entry.readable[observer]+=1;
      const found=scan(snap.data(),owner,p);
      if(found.length)(expectRevealed?report.positive:entry.leaks).push(...found.map(f=>`${PRIVATE[observer].who} can read ${f}`));
    }
    for(const c of collections){
      let page=null;try{page=await getDocs(collection(db,...c.split("/")));}catch(_e){page=null;}
      if(!page)continue;
      entry.listable[observer]+=1;
      for(const d of page.docs){const found=scan(d.data(),owner,d.ref.path);if(found.length)(expectRevealed?report.positive:entry.leaks).push(...found.map(f=>`${PRIVATE[observer].who} can LIST ${f}`));}
    }
  }
  report.checkpoints.push(entry);
  console.log(`${label}: ${docs.length} documents, ${collections.length} collections; readable Daniel ${entry.readable.playerOne} / Nik ${entry.readable.playerTwo}; listable Daniel ${entry.listable.playerOne} / Nik ${entry.listable.playerTwo}; leaks ${entry.leaks.length}`);
  if(!expectRevealed)assert.deepEqual(entry.leaks,[],`${label}: the partner can read private inputs:\n  ${entry.leaks.join("\n  ")}`);
  return entry;
}
async function projectionClean(opts,observer,label,{completed=false}={}){
  const view=await Transfer.read(opts);
  assert.equal(view.ok,true,`${label}: ${JSON.stringify(view)}`);
  if(!completed){
    assert.equal(view.opponentInputs,null,`${label}: ${PRIVATE[observer].who}'s projection must not carry the partner's inputs`);
    assert.equal(view.verdicts,null,`${label}: no verdicts before COMPLETED`);
    const found=scan(view,OTHER[observer],`Transfer.read(${PRIVATE[observer].who})`);
    assert.deepEqual(found,[],`${label}: ${found.join("; ")}`);
  }
  return view;
}
async function directDenied(dbs,label,{completed=false}={}){
  for(const observer of ["playerOne","playerTwo"]){
    const owner=OTHER[observer],ref=doc(dbs[observer],"rivalries",R1,"transferChallenges",TID,"roles",owner);
    if(completed)await assertSucceeds(getDoc(ref));else await assertFails(getDoc(ref),`${label}: ${PRIVATE[observer].who} must not get ${PRIVATE[owner].who}'s role document`);
    await assertFails(getDocs(collection(dbs[observer],"rivalries",R1,"transferChallenges",TID,"roles")),`${label}: ${PRIVATE[observer].who} must never list role documents`);
  }
}

async function main(){
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES,host:EMU.split(":")[0],port:Number(EMU.split(":")[1])}});
  try{
    await env.clearFirestore();
    const now=Date.now();
    await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [uid,id,seed] of [[A,DA,"a"],[B,DB,"b"]]){await setDoc(doc(db,"accounts",uid),await account(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seed));}await setDoc(doc(db,"rivalries",R1),await rivalry(R1));await setDoc(doc(db,"rivalries",R1,"sessions",S1),await session(R1,S1,now));await setDoc(doc(db,"accounts",A,"pairLinks","current"),await pairLink(A,R1,"playerOne","daniel",DA));await setDoc(doc(db,"accounts",B,"pairLinks","current"),await pairLink(B,R1,"playerTwo","nik",DB));});
    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbs={playerOne:dbA,playerTwo:dbB};
    const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t),as={playerOne:a,playerTwo:b};
    const ok=(r,label)=>{assert.equal(r&&r.ok,true,`${label}: ${JSON.stringify(r)}`);return r;};

    for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:1}]])ok(await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}),`setup ${type}`);
    ok(await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}),"Daniel confirm");
    ok(await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}),"Nik confirm");
    ok(await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}),"Daniel career");
    ok(await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}),"Nik career");
    ok(await Transfer.markSpun({...a(90),seasonNumber:SEASON,managerRole:"playerOne"}),"Daniel spun");
    ok(await Transfer.markSpun({...b(95),seasonNumber:SEASON,managerRole:"playerTwo"}),"Nik spun");
    ok(await Transfer.startWindow({...a(100),seasonNumber:SEASON,operationId:op("transfer_op_",1),baseRevision:0}),"start window");
    await partnerSweep(env,"C0 window open");
    ok(await Transfer.requestEndWindow({...a(200),seasonNumber:SEASON,operationId:op("transfer_op_",2),baseRevision:1}),"Daniel end");
    ok(await Transfer.requestEndWindow({...b(210),seasonNumber:SEASON,operationId:op("transfer_op_",3),baseRevision:2}),"Nik end");

    const guessOps={playerOne:op("transfer_op_",4),playerTwo:op("transfer_op_",5)},guessBase={playerOne:3,playerTwo:4};
    ok(await Transfer.lockGuesses({...a(300),seasonNumber:SEASON,operationId:guessOps.playerOne,baseRevision:3,guesses:PRIVATE.playerOne.guesses}),"Daniel lock guesses");
    await directDenied(dbs,"C1");await projectionClean({...b(310),seasonNumber:SEASON},"playerTwo","C1 Nik projection");
    await partnerSweep(env,"C1 Daniel locked guesses");
    // A second Nik device/tab and a "reconnected" Nik are the same account and the same Rules: one more fresh client proves it.
    await projectionClean({...base(env.authenticatedContext(B).firestore(),B,DB,now+320),seasonNumber:SEASON},"playerTwo","C1 Nik fresh client (second tab / reconnect)");

    const nikGuess=ok(await Transfer.lockGuesses({...b(400),seasonNumber:SEASON,operationId:guessOps.playerTwo,baseRevision:4,guesses:PRIVATE.playerTwo.guesses}),"Nik lock guesses");
    assert.equal(nikGuess.state.phase,"SIGNING_ENTRY");
    await directDenied(dbs,"C2");
    await projectionClean({...a(410),seasonNumber:SEASON},"playerOne","C2 Daniel projection");await projectionClean({...b(410),seasonNumber:SEASON},"playerTwo","C2 Nik projection");
    await partnerSweep(env,"C2 both guesses locked (signings open)");

    const signOps={playerOne:op("transfer_op_",6),playerTwo:op("transfer_op_",7)};
    ok(await Transfer.lockSignings({...a(500),seasonNumber:SEASON,operationId:signOps.playerOne,baseRevision:5,signings:PRIVATE.playerOne.signings}),"Daniel lock signings");
    await directDenied(dbs,"C3");
    await projectionClean({...a(510),seasonNumber:SEASON},"playerOne","C3 Daniel projection");await projectionClean({...b(510),seasonNumber:SEASON},"playerTwo","C3 Nik projection");
    await partnerSweep(env,"C3 Daniel locked signings");
    // A replayed lock (lost answer, reload) answers from the public ledger only: still nothing of the partner.
    const replay=ok(await Transfer.lockSignings({...a(520),seasonNumber:SEASON,operationId:signOps.playerOne,baseRevision:5,signings:PRIVATE.playerOne.signings}),"Daniel replayed lock");
    assert.equal(replay.replayed,true);assert.deepEqual(scan(replay,"playerTwo","Daniel replay answer"),[]);

    const done=ok(await Transfer.lockSignings({...b(600),seasonNumber:SEASON,operationId:signOps.playerTwo,baseRevision:6,signings:PRIVATE.playerTwo.signings}),"Nik lock signings");
    assert.equal(done.state.phase,"COMPLETED");
    await directDenied(dbs,"C4",{completed:true});
    const viewA=await projectionClean({...a(610),seasonNumber:SEASON},"playerOne","C4",{completed:true}),viewB=await projectionClean({...b(610),seasonNumber:SEASON},"playerTwo","C4",{completed:true});
    assert.deepEqual(viewA.verdicts,viewB.verdicts,"C4: both read the same verdicts");
    assert.deepEqual(viewB.opponentInputs.guesses,PRIVATE.playerOne.guesses,"C4: Nik now sees Daniel's guesses");
    assert.deepEqual(viewA.opponentInputs.guesses,PRIVATE.playerTwo.guesses,"C4: Daniel now sees Nik's guesses");
    // Positive control: the same sweep now finds every marker through the documents the partner can read.
    report.positive=[];
    await partnerSweep(env,"C4 COMPLETED (positive control)",{expectRevealed:true});
    for(const [observer,owner] of [["playerOne","playerTwo"],["playerTwo","playerOne"]]){
      const m=markersFor(owner),blob=report.positive.filter(f=>f.startsWith(`${PRIVATE[observer].who} can read`)).join("\n");
      for(const t of m.text.slice(0,PRIVATE[owner].signings.length))assert.ok(blob.includes(`"${t}"`),`C4 positive control: the sweep must detect ${PRIVATE[owner].who}'s signing "${t}" for ${PRIVATE[observer].who}`);
      for(const id of m.guessIds)assert.ok(blob.includes(`"${id}"`),`C4 positive control: the sweep must detect ${PRIVATE[owner].who}'s guess "${id}" for ${PRIVATE[observer].who}`);
    }

    // Lock hashes in the public ledger (readable by both from the start) are salted: the true guesses alone do not reproduce them.
    const ledger=(await getDoc(doc(dbB,"rivalries",R1,"transferChallenges",TID))).data();
    for(const role of ["playerOne","playerTwo"]){
      const roleDoc=(await getDoc(doc(dbs[OTHER[role]],"rivalries",R1,"transferChallenges",TID,"roles",role))).data();
      const i=ledger.operationIds.indexOf(guessOps[role]);assert.ok(i>=0);
      const payload={actorRole:role,type:"lock-guesses",operationId:guessOps[role],baseRevision:guessBase[role],guesses:PRIVATE[role].guesses};
      assert.match(String(roleDoc.guessSalt),/^[0-9a-f]{64}$/,`${PRIVATE[role].who}'s guess lock carries a salt`);
      assert.equal(await stspHash({...payload,salt:roleDoc.guessSalt}),ledger.operationHashes[i],`replica check: ${PRIVATE[role].who}'s salted hash reproduces the ledger`);
      assert.notEqual(await stspHash(payload),ledger.operationHashes[i],`${PRIVATE[role].who}'s public lock hash must not be the unsalted hash of the guesses`);
    }
    console.log(`C4 positive control found ${report.positive.length} revealed items (expected after COMPLETED).`);
    console.log("PASS r87 guess privacy (Firestore): before COMPLETED neither manager can read or list anything carrying the other's guesses or signings; after COMPLETED both can.");
  }finally{await env.cleanup();}
}
main().catch(error=>{console.error(error&&error.stack||error);process.exitCode=1;});
