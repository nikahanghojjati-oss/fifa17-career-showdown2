"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,deleteDoc}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const provider=require("../../js/sparkSharedTransferChallenge.js");
const leagueIds=global.FIFA17_TRANSFER_LEAGUES.map(item=>item.id);
const nationalityIds=global.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);

const PROJECT_ID="demo-career-mode-showdown-transfer-fresh-session";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_transfer_a",B="acct_transfer_b";
const R=`pair_${"a".repeat(64)}`;
const OLD=`session_${"1".repeat(64)}`,FRESH=`session_${"2".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
const OP1=`transfer_op_${"1".repeat(32)}`,OP2=`transfer_op_${"2".repeat(32)}`,OP3=`transfer_op_${"3".repeat(32)}`,OP4=`transfer_op_${"4".repeat(32)}`;
const HASH=`sha256:${"a".repeat(64)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
]}};}
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000),lastActivityAt=Timestamp.fromMillis(now-1000);
  return {schemaVersion:1,objectType:"session",objectId:FRESH,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function setup(){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",leagueId:"bundesliga",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},totalSeasons:1,confirmedRoles:["playerOne","playerTwo"]};}
function career(){return {schemaVersion:1,objectType:"sharedCareerStart",rivalryId:R,setupRevision:6,totalSeasons:1,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]};}
function transferLedger(activeSessionId,startedAt,now){return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:R,seasonNumber:1,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"WINDOW_OPEN",revision:1,startedAt,endedAt:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[OP1],operationTypes:["start-window"],operationHashes:[HASH],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId,updatedAt:Timestamp.fromMillis(now-16*60*1000),updatedByDeviceId:DA};}

// ---------------------------------------------------------------------------------------------------------------------
// JOB-1051 (salted lock commitments) and JOB-1052 (Rules accept exactly the catalog ids and signing names the reader accepts),
// proved on the generated production Rules with the real provider. Tampering is done by wrapping the SDK transaction so the
// provider's own atomic public + private write is rewritten just before it reaches the Rules.
// ---------------------------------------------------------------------------------------------------------------------
const R2=`pair_${"b".repeat(64)}`,S2=`session_${"c".repeat(64)}`;
const SALT_RE=/^[0-9a-f]{64}$/;
const opId=n=>`transfer_op_${Number(n).toString(16).padStart(32,"0")}`;
const budgetPhrase="maximum of 1000 expressions";
let proofChecks=0;
async function proof(id,label,fn){await fn();proofChecks+=1;process.stdout.write(`ok ${proofChecks} ${id} ${label}\n`);}
function sortedCanonical(value){if(Array.isArray(value))return `[${value.map(sortedCanonical).join(",")}]`;if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${sortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
const commitment=(actorRole,type,operationId,baseRevision,payload,salt)=>`sha256:${crypto.createHash("sha256").update(sortedCanonical({actorRole,type,operationId,baseRevision,...payload,...(salt?{salt}:{})})).digest("hex")}`;

function baseDocs(rid,sid,now){
  const rv=rivalry();rv.objectId=rid;
  const ss=session(now);ss.objectId=sid;ss.data.rivalryId=rid;
  const su=setup();su.rivalryId=rid;const cs=career();cs.rivalryId=rid;
  return {rv,ss,su,cs};
}
function guessEntryLedger(rid,sid,now){
  const startedAt=Timestamp.fromMillis(now-5*60*1000),endedAt=Timestamp.fromMillis(now-60*1000);
  return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:rid,seasonNumber:1,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"GUESS_ENTRY",revision:3,startedAt,endedAt,endRequestedRoles:["playerOne","playerTwo"],guessLockedRoles:[],signingLockedRoles:[],operationIds:[opId(1),opId(2),opId(3)],operationTypes:["start-window","request-end-window","request-end-window"],operationHashes:[HASH,HASH,HASH],baseRevisions:[0,1,2],actorRoles:["playerOne","playerOne","playerTwo"],activeSessionId:sid,updatedAt:Timestamp.fromMillis(now-60*1000),updatedByDeviceId:DA};
}

async function proveSaltsAndCatalogIds(env){
  firestoreSdk.setLogLevel("silent");
  const now=Date.now();
  const seenErrors=[];
  const refs=db=>({pub:doc(db,"rivalries",R2,"transferChallenges","season_1"),one:doc(db,"rivalries",R2,"transferChallenges","season_1","roles","playerOne"),two:doc(db,"rivalries",R2,"transferChallenges","season_1","roles","playerTwo")});
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),d=baseDocs(R2,S2,now);
    await setDoc(doc(db,"rivalries",R2),d.rv);await setDoc(doc(db,"rivalries",R2,"sessions",S2),d.ss);
    await setDoc(doc(db,"rivalries",R2,"sharedSetup","authoritative"),d.su);await setDoc(doc(db,"rivalries",R2,"careerStart","authoritative"),d.cs);
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const admin=async fn=>{let value;await env.withSecurityRulesDisabled(async context=>{value=await fn(context.firestore());});return value;};
  const reset=async()=>admin(async db=>{const r=refs(db);await setDoc(r.pub,guessEntryLedger(R2,S2,now));await deleteDoc(r.one);await deleteDoc(r.two);});
  const snapshot=async()=>admin(async db=>{const r=refs(db);const out={};for(const key of ["pub","one","two"]){const snap=await getDoc(r[key]);out[key]=snap.exists()?snap.data():null;}return out;});
  const restore=async snap=>admin(async db=>{const r=refs(db);for(const key of ["pub","one","two"]){if(snap[key])await setDoc(r[key],snap[key]);else await deleteDoc(r[key]);}});
  const options=(role,extra={})=>({user:{uid:role==="playerOne"?A:B},firestore:role==="playerOne"?dbA:dbB,firebaseSdk:sdk(),rivalryId:R2,sessionId:S2,deviceId:role==="playerOne"?DA:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now(),...extra});
  // The provider's own transaction, with the private role document rewritten just before it reaches the Rules.
  const tampered=mutate=>({...sdk(),runTransaction:async(database,callback)=>{
    try{return await firestoreSdk.runTransaction(database,transaction=>callback({
      get:ref=>transaction.get(ref),
      set:(ref,data)=>{if(mutate&&ref.path.includes("/roles/")){const copy={...data};mutate(copy);return transaction.set(ref,copy);}return transaction.set(ref,data);}
    }));}catch(error){seenErrors.push(error);throw error;}
  }});
  // A denied atomic commit (public ledger + role document) always carries the emulator's multi-document trace, which mentions the expression
  // ceiling even for a plain `false`; the same text appears on gameplay/bug-list-1. Single-document probes below do assert it never appears.
  // Here every denial is paired with an accepted control of the same size, so a denial can only come from the single changed field.
  const notBudget=()=>{seenErrors.length=0;};
  const lockGuesses=(role,n,base,guesses,mutate)=>provider.lockGuesses({...options(role,{firebaseSdk:tampered(mutate)}),operationId:opId(n),baseRevision:base,guesses});
  const lockSignings=(role,n,base,signings,mutate)=>provider.lockSignings({...options(role,{firebaseSdk:tampered(mutate)}),operationId:opId(n),baseRevision:base,signings});
  const denied=async(label,promise)=>{const result=await promise;assert.equal(result.ok,false,`${label} must be denied: ${JSON.stringify(result)}`);assert.equal(result.code,"permission-denied",`${label}: ${JSON.stringify(result)}`);notBudget();};
  const accepted=async(label,promise)=>{const result=await promise;assert.equal(result.ok,true,`${label} must be accepted: ${JSON.stringify(result)}`);notBudget();return result;};

  const G1=[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"brazil"}];
  const G2=[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}];
  const S1=[{slot:1,name:"Player A",leagueId:"england-premier-league",nationalityId:"spain"},{slot:2,name:"Player B",leagueId:"italy-serie-a",nationalityId:"brazil"}];
  const S2s=[{slot:1,name:"Player C",leagueId:"germany-bundesliga",nationalityId:"france"}];

  // ---- JOB-1051 salts at the guess lock -------------------------------------------------------------------------------
  await proof("J1","real guess lock: salted role document, hash commits to payload + stored salt, signingSalt still null",async()=>{
    await reset();await accepted("guess lock",lockGuesses("playerOne",4,3,G1));
    const snap=await snapshot();
    assert.equal(Object.keys(snap.one).length,14,"12 r66 keys plus guessSalt and signingSalt");
    assert.match(snap.one.guessSalt,SALT_RE);assert.equal(snap.one.signingSalt,null);
    assert.equal(snap.pub.operationHashes[3],commitment("playerOne","lock-guesses",opId(4),3,{guesses:G1},snap.one.guessSalt));
    assert.notEqual(snap.pub.operationHashes[3],commitment("playerOne","lock-guesses",opId(4),3,{guesses:G1},null),"the unsalted payload hash is not what the public ledger holds");
    assert.equal(JSON.stringify(snap.pub).includes(snap.one.guessSalt),false,"the salt never reaches the public ledger");
  });
  const strip=d=>{delete d.guessSalt;delete d.signingSalt;};
  await proof("J2","accepted shapes at the guess lock: r66 (no salt keys) and explicit nulls",async()=>{
    await reset();await accepted("r66 shape",lockGuesses("playerOne",4,3,G1,strip));
    await reset();await accepted("null salts",lockGuesses("playerOne",4,3,G1,d=>{d.guessSalt=null;d.signingSalt=null;}));
  });
  const goodSalt="0123456789abcdef".repeat(4);
  await proof("J3","rejected guess salts: uppercase, 63/65 characters, non-hex, empty, wrong type",async()=>{
    for(const [label,value] of [["uppercase",goodSalt.toUpperCase()],["63 characters",goodSalt.slice(1)],["65 characters",`${goodSalt}a`],["non-hex",`g${goodSalt.slice(1)}`],["empty string",""],["trailing newline",`${goodSalt.slice(1)}\n`],["number",7],["boolean",true],["list",[goodSalt]],["map",{salt:goodSalt}]]){
      await reset();const snap=await snapshot();
      await denied(`guessSalt ${label}`,lockGuesses("playerOne",4,3,G1,d=>{d.guessSalt=value;}));
      assert.deepEqual(await snapshot(),snap,`guessSalt ${label}: nothing written`);
    }
    await reset();await accepted("control: a hand-made valid hex salt is accepted",lockGuesses("playerOne",4,3,G1,d=>{d.guessSalt=goodSalt;}));
  });
  await proof("J4","rejected shapes: only one salt key, a signing salt at the guess lock, an extra key",async()=>{
    for(const [label,mutate] of [["only guessSalt",d=>{delete d.signingSalt;}],["only signingSalt",d=>{delete d.guessSalt;}],["signingSalt set at the guess lock",d=>{d.signingSalt=goodSalt;}],["extra salt-like key",d=>{d.guessSalt2=goodSalt;}],["extra key",d=>{d.note="x";}]]){
      await reset();const snap=await snapshot();
      await denied(label,lockGuesses("playerOne",4,3,G1,mutate));assert.deepEqual(await snapshot(),snap,`${label}: nothing written`);
    }
  });

  // ---- JOB-1051 salts at the signings lock, immutability, privacy ------------------------------------------------------
  await reset();
  await accepted("A guess lock",lockGuesses("playerOne",4,3,G1));await accepted("B guess lock",lockGuesses("playerTwo",5,4,G2));
  const afterGuesses=await snapshot();
  await proof("J5","the rival cannot read the salt (or the role document) before COMPLETED; the owner can",async()=>{
    assert.equal(afterGuesses.pub.phase,"SIGNING_ENTRY");
    await assertFails(getDoc(refs(dbB).one));await assertFails(getDoc(refs(dbA).two));
    const own=await assertSucceeds(getDoc(refs(dbA).one));assert.match(own.data().guessSalt,SALT_RE);
    const ownB=await assertSucceeds(getDoc(refs(dbB).two));assert.match(ownB.data().guessSalt,SALT_RE);assert.notEqual(own.data().guessSalt,ownB.data().guessSalt);
    // The provider read path gives the rival no opponent inputs, so no salt either.
    const view=await provider.read(options("playerTwo"));assert.equal(view.ok,true);assert.equal(view.opponentInputs,null);assert.equal(JSON.stringify(view).includes(own.data().guessSalt),false);
  });
  await proof("J6","signings lock: new signing salt accepted, guess salt immutable (changed, removed, nulled, both keys dropped)",async()=>{
    await restore(afterGuesses);
    for(const [label,mutate] of [
      ["guessSalt replaced by another valid salt",d=>{d.guessSalt=goodSalt;}],
      ["guessSalt nulled",d=>{d.guessSalt=null;}],
      ["both salt keys dropped (an r66 client on a salted document)",strip],
      ["only guessSalt kept",d=>{delete d.signingSalt;}],
      ["only signingSalt kept",d=>{delete d.guessSalt;}]
    ]){await restore(afterGuesses);await denied(label,lockSignings("playerOne",6,5,S1,mutate));assert.deepEqual(await snapshot(),afterGuesses,`${label}: nothing written`);}
    for(const [label,value] of [["uppercase",goodSalt.toUpperCase()],["short",goodSalt.slice(2)],["long",`${goodSalt}00`],["non-hex",`${goodSalt.slice(1)}x`],["empty",""],["number",1]]){
      await restore(afterGuesses);await denied(`signingSalt ${label}`,lockSignings("playerOne",6,5,S1,d=>{d.signingSalt=value;}));
    }
    await restore(afterGuesses);
    const real=await accepted("real signings lock",lockSignings("playerOne",6,5,S1));assert.equal(real.revision,6);
    const snap=await snapshot();
    assert.equal(snap.one.guessSalt,afterGuesses.one.guessSalt,"guess salt unchanged");assert.match(snap.one.signingSalt,SALT_RE);assert.notEqual(snap.one.signingSalt,snap.one.guessSalt);
    assert.equal(snap.pub.operationHashes[5],commitment("playerOne","lock-signings",opId(6),5,{signings:S1},snap.one.signingSalt));
    await restore(afterGuesses);await accepted("explicit null signingSalt",lockSignings("playerOne",6,5,S1,d=>{d.signingSalt=null;}));
  });
  await proof("J7","once locked, a salt can never be changed: direct rewrites and deletes of a locked role document are denied",async()=>{
    await restore(afterGuesses);await accepted("signings lock",lockSignings("playerOne",6,5,S1));
    const locked=await snapshot();
    for(const change of [{signingSalt:goodSalt},{guessSalt:goodSalt},{signingSalt:null},{guessSalt:null}])await assertFails(setDoc(refs(dbA).one,{...locked.one,...change}));
    await assertFails(deleteDoc(refs(dbA).one));
    assert.deepEqual(await snapshot(),locked,"nothing changed");
  });
  await proof("J8","r66 role document (no salt keys) followed by a new signings lock: guessSalt null, signingSalt salted; setting guessSalt then is denied; an r66 client still locks",async()=>{
    const r66={...afterGuesses,one:{...afterGuesses.one}};strip(r66.one);
    await restore(r66);await accepted("new client over an r66 guess lock",lockSignings("playerOne",6,5,S1));
    let snap=await snapshot();assert.equal(snap.one.guessSalt,null);assert.match(snap.one.signingSalt,SALT_RE);
    assert.equal(snap.pub.operationHashes[5],commitment("playerOne","lock-signings",opId(6),5,{signings:S1},snap.one.signingSalt));
    await restore(r66);await denied("a guess salt cannot appear at the signings lock",lockSignings("playerOne",6,5,S1,d=>{d.guessSalt=goodSalt;}));
    await restore(r66);await accepted("an r66 client lock (no salt keys at all)",lockSignings("playerOne",6,5,S1,strip));
    snap=await snapshot();assert.equal(Object.keys(snap.one).length,12);
  });
  await proof("J9","COMPLETED: the rival now reads both salts and can verify the commitments; both managers read through the provider",async()=>{
    await restore(afterGuesses);await accepted("A signings",lockSignings("playerOne",6,5,S1));const done=await accepted("B signings",lockSignings("playerTwo",7,6,S2s));assert.equal(done.state.phase,"COMPLETED");
    const rivalView=await assertSucceeds(getDoc(refs(dbB).one));const a=rivalView.data();
    const pub=(await getDoc(refs(dbB).pub)).data();
    assert.equal(pub.operationHashes[3],commitment("playerOne","lock-guesses",opId(4),3,{guesses:a.guesses},a.guessSalt));
    assert.equal(pub.operationHashes[5],commitment("playerOne","lock-signings",opId(6),5,{signings:a.signings},a.signingSalt));
    const ownerView=await assertSucceeds(getDoc(refs(dbA).two));const b=ownerView.data();
    assert.equal(pub.operationHashes[4],commitment("playerTwo","lock-guesses",opId(5),4,{guesses:b.guesses},b.guessSalt));
    assert.equal(pub.operationHashes[6],commitment("playerTwo","lock-signings",opId(7),6,{signings:b.signings},b.signingSalt));
    for(const role of ["playerOne","playerTwo"]){const view=await provider.read(options(role));assert.equal(view.ok,true,JSON.stringify(view));assert.equal(view.state.phase,"COMPLETED");}
    // Replays after COMPLETED use the stored salt and still succeed; a conflicting payload still fails.
    const replay=await provider.lockGuesses({...options("playerOne"),operationId:opId(4),baseRevision:3,guesses:G1});assert.equal(replay.ok,true);assert.equal(replay.replayed,true);
    const conflict=await provider.lockGuesses({...options("playerOne"),operationId:opId(4),baseRevision:3,guesses:G2});assert.equal(conflict.ok,false);assert.equal(conflict.code,"TRANSFER_IDEMPOTENCY_CONFLICT");
  });

  // ---- JOB-1052 catalog ids and signing names through the real write path ---------------------------------------------
  await proof("K1","guess ids: catalog ids accepted in their own kind (first and last of each catalog; all 200 in K5); unknown slugs and cross-kind ids denied",async()=>{
    await reset();await accepted("league + nationality",lockGuesses("playerOne",4,3,[{slot:1,type:"league",valueId:leagueIds[0]},{slot:2,type:"nationality",valueId:nationalityIds[0]},{slot:3,type:"nationality",valueId:nationalityIds[nationalityIds.length-1]}]));
    await reset();await accepted("last league",lockGuesses("playerOne",4,3,[{slot:1,type:"league",valueId:leagueIds[leagueIds.length-1]}]));
    const bad=[["slug-shaped but not in the catalog",{slot:1,type:"league",valueId:"atlantis-league"}],["slug-shaped but not in the catalog (nationality)",{slot:1,type:"nationality",valueId:"atlantis"}],["a nationality id in a league guess",{slot:1,type:"league",valueId:"brazil"}],["a league id in a nationality guess",{slot:1,type:"nationality",valueId:"italy-serie-a"}],["catalog id plus a suffix",{slot:1,type:"league",valueId:`${leagueIds[0]}-2`}],["catalog id prefix",{slot:1,type:"nationality",valueId:"braz"}],["uppercase catalog id",{slot:1,type:"nationality",valueId:"BRAZIL"}],["catalog id with a trailing newline",{slot:1,type:"nationality",valueId:"brazil\n"}],["one character",{slot:1,type:"nationality",valueId:"b"}]];
    for(const [label,row] of bad){await reset();const snap=await snapshot();await denied(label,lockGuesses("playerOne",4,3,[{slot:1,type:"league",valueId:leagueIds[0]}],d=>{d.guesses=[row];}));assert.deepEqual(await snapshot(),snap,`${label}: nothing written`);}
  });
  const guessOne=[{slot:1,type:"league",valueId:"england-premier-league"}];
  await reset();await accepted("A guess lock",lockGuesses("playerOne",4,3,G1));await accepted("B guess lock",lockGuesses("playerTwo",5,4,G2));
  const forSignings=await snapshot();
  const withName=name=>[{slot:1,name:"Player A",leagueId:"england-premier-league",nationalityId:"spain"}].map(x=>({...x,name}));
  await proof("K2","signing league and nationality ids: catalog ids accepted, unknown or cross-kind ids denied",async()=>{
    await restore(forSignings);await accepted("catalog ids",lockSignings("playerOne",6,5,[{slot:1,name:"X Y",leagueId:leagueIds[leagueIds.length-1],nationalityId:nationalityIds[nationalityIds.length-1]}]));
    for(const [label,patch] of [["unknown league slug",{leagueId:"atlantis-league"}],["unknown nationality slug",{nationalityId:"atlantis"}],["a nationality in the league slot",{leagueId:"brazil"}],["a league in the nationality slot",{nationalityId:"italy-serie-a"}],["uppercase league",{leagueId:"ENGLAND-PREMIER-LEAGUE"}],["league with trailing newline",{leagueId:"england-premier-league\n"}]]){
      await restore(forSignings);await denied(label,lockSignings("playerOne",6,5,withName("Player A"),d=>{d.signings=d.signings.map(x=>({...x,...patch}));}));
    }
  });
  await proof("K3","signing names: exactly the reader's rule (1..80 characters, unchanged by String.trim()); white space at either end is denied, inside is fine",async()=>{
    const ws=[];for(let cp=0;cp<=0xffff;cp+=1){const ch=String.fromCharCode(cp);if(ch.trim()==="")ws.push(ch);}
    assert.ok(ws.length>=25,`JavaScript white space set found: ${ws.length}`);
    const names=[["plain","Player A",true],["one character","x",true],["accented","José Ødegaard",true],["inner space","a b",true],["inner newline","a\nb",true],["inner tab","a\tb",true],["80 characters","a".repeat(80),true],["81 characters","a".repeat(81),false],["empty","",false],["zero-width space edge","x​",true],["NEL is not trimmed by JavaScript","\u0085x",true],["mongolian vowel separator is not trimmed","᠎x",true],["word joiner edge","⁠x",true]];
    for(const char of ws){names.push([`leading U+${char.charCodeAt(0).toString(16).padStart(4,"0")}`,`${char}x`,false]);names.push([`trailing U+${char.charCodeAt(0).toString(16).padStart(4,"0")}`,`x${char}`,false]);names.push([`inner U+${char.charCodeAt(0).toString(16).padStart(4,"0")}`,`x${char}y`,true]);}
    for(const [label,name,ok] of names){
      const expected=name.length>=1&&name.length<=80&&name===name.trim();assert.equal(ok,expected,`oracle for ${label}`);
      await restore(forSignings);
      const attempt=lockSignings("playerOne",6,5,withName("Player A"),d=>{d.signings=d.signings.map(x=>({...x,name}));});
      if(ok)await accepted(`name ${label}`,attempt);else await denied(`name ${label}`,attempt);
    }
  });
  await proof("K4","max-size transaction: 3 guesses with 3 signings of 80-character names lock, and read back, inside the evaluation budget",async()=>{
    const three=[{slot:1,type:"league",valueId:leagueIds[3]},{slot:2,type:"nationality",valueId:nationalityIds[7]},{slot:3,type:"nationality",valueId:nationalityIds[9]}];
    const big=[1,2,3].map(slot=>({slot,name:`${"N".repeat(79)}${slot}`,leagueId:leagueIds[slot],nationalityId:nationalityIds[slot+20]}));
    await reset();await accepted("A 3 guesses",lockGuesses("playerOne",4,3,three));await accepted("B 3 guesses",lockGuesses("playerTwo",5,4,three));
    await accepted("A 3 signings",lockSignings("playerOne",6,5,big));const done=await accepted("B 3 signings",lockSignings("playerTwo",7,6,big));assert.equal(done.state.phase,"COMPLETED");
    const view=await provider.read(options("playerOne"));assert.equal(view.ok,true);assert.equal(view.ownInputs.signings.length,3);assert.equal(view.opponentInputs.signings[2].name.length,80);
  });

  // ---- JOB-1052 exhaustive: every catalog id and many near misses against the real Rules functions --------------------------
  await proof("K5","probe over the generated Rules functions: catalog membership, signing names and salts agree with the reader on every candidate",async()=>{
    const marker="    match /{document=**} {";
    assert.equal(RULES.split(marker).length,2,"one catch-all seam");
    const probe=`    match /leagueProbe/{id} { allow create: if ssjrTransferCatalogLeagueId(request.resource.data.v); }
    match /nationProbe/{id} { allow create: if ssjrTransferCatalogNationalityId(request.resource.data.v); }
    match /optionProbe/{id} { allow create: if ssjrTransferValidOptionId(request.resource.data.v); }
    match /nameProbe/{id} { allow create: if ssjrTransferValidSigningName(request.resource.data.v); }
    match /saltProbe/{id} { allow create: if ssjrTransferValidSalt(request.resource.data.get('v', null)); }
    match /guessProbe/{id} { allow create: if ssjrTransferGuessesValid(request.resource.data.v); }
    match /signingProbe/{id} { allow create: if ssjrTransferSigningsValid(request.resource.data.v); }
`;
    const probeEnv=await initializeTestEnvironment({projectId:`${PROJECT_ID}-probe-${process.pid}-${Date.now()}`,firestore:{rules:RULES.replace(marker,`${probe}${marker}`)}});
    try{
      const pdb=probeEnv.unauthenticatedContext().firestore();
      let writes=0;
      const attempt=async(collection,value)=>{
        try{await setDoc(doc(pdb,collection,`p${writes++}`),{v:value});return true;}
        catch(error){assert.equal(String(error&&error.message).includes(budgetPhrase),false,"probe denial is not a budget denial");if(error&&error.code==="permission-denied")return false;throw error;}
      };
      const check=async(collection,candidates,oracle,label)=>{
        for(let i=0;i<candidates.length;i+=30){
          const slice=candidates.slice(i,i+30);
          const results=await Promise.all(slice.map(value=>attempt(collection,value)));
          results.forEach((got,k)=>assert.equal(got,oracle(slice[k]),`${label}: ${JSON.stringify(slice[k])} -> Rules ${got}, reader ${oracle(slice[k])}`));
        }
      };
      const leagueSet=new Set(leagueIds),nationSet=new Set(nationalityIds);
      const variants=id=>[id,`${id}x`,`${id}-`,`-${id}`,id.toUpperCase(),` ${id}`,`${id} `,`${id}\n`,`\n${id}`,id.slice(0,-1),id.slice(1),id.replace(/-/g,""),id.replace(/-/g,"--"),`${id}-${id}`];
      const allIds=[...leagueIds,...nationalityIds];
      const candidates=[...new Set(allIds.flatMap(variants)),"","a","ab","-","--","a--b","a-","-a","x".repeat(81),"x".repeat(200),"atlantis","atlantis-league","1","12","brazil\u0000","brаzil"];
      await check("leagueProbe",candidates,v=>leagueSet.has(v),"league catalog");
      await check("nationProbe",candidates,v=>nationSet.has(v),"nationality catalog");
      // The kind-agnostic option check accepts exactly the union of both catalogs (and so every catalog id), nothing slug-shaped beyond it.
      await check("optionProbe",candidates,v=>leagueSet.has(v)||nationSet.has(v),"option id union");
      // Signing names against the reader's own test.
      const wsAll=[];for(let cp=0;cp<=0xffff;cp+=1){const ch=String.fromCharCode(cp);if(ch.trim()==="")wsAll.push(ch);}
      const nameCandidates=["Player A","a","","é","a b","a\nb","a".repeat(80),"a".repeat(81),"😀".repeat(40),"😀".repeat(41),"x​","\u0085x","᠎x","⁠x"," ","　","  "];
      for(const ch of wsAll){nameCandidates.push(`${ch}a`,`a${ch}`,`a${ch}b`,ch);}
      await check("nameProbe",nameCandidates,v=>v.length>=1&&v.length<=80&&v===v.trim(),"signing name");
      // Salts: null, or exactly 64 lowercase hex characters.
      const hex64="9f".repeat(32);
      const saltCandidates=[null,hex64,"0".repeat(64),"f".repeat(64),"A".repeat(64),hex64.toUpperCase(),hex64.slice(1),`${hex64}0`,`${hex64}\n`,`\n${hex64}`,"","g".repeat(64),`${hex64.slice(0,63)}-`,7,true,[hex64],{v:hex64}];
      await check("saltProbe",saltCandidates,v=>v===null||(typeof v==="string"&&SALT_RE.test(v)),"salt");
      // Whole guess/signing lists: catalog ids in the right kind, three rows at most, distinct slots.
      const row=(type,valueId,slot=1)=>({slot,type,valueId});
      const guessLists=[[],[row("league",leagueIds[0])],[row("nationality",nationalityIds[5])],[row("league",nationalityIds[5])],[row("nationality",leagueIds[0])],[row("league","atlantis-league")],[row("league",leagueIds[0],1),row("nationality",nationalityIds[1],2),row("league",leagueIds[2],3)],[row("league",leagueIds[0],1),row("league",leagueIds[1],1)],[row("league",leagueIds[0],1),row("nationality","atlantis",2)]];
      const guessOk=list=>list.length<=3&&new Set(list.map(r=>r.slot)).size===list.length&&list.every(r=>(r.type==="league"?leagueSet:nationSet).has(r.valueId));
      await check("guessProbe",guessLists,guessOk,"guess list");
      const sg=(name,leagueId,nationalityId,slot=1)=>({slot,name,leagueId,nationalityId});
      const signingLists=[[],[sg("A B",leagueIds[0],nationalityIds[0])],[sg("A B","atlantis-league",nationalityIds[0])],[sg("A B",leagueIds[0],"atlantis")],[sg("A B",nationalityIds[0],leagueIds[0])],[sg(" A B",leagueIds[0],nationalityIds[0])],[sg("A B ",leagueIds[0],nationalityIds[0])],[sg("A".repeat(81),leagueIds[0],nationalityIds[0])],[sg("A",leagueIds[0],nationalityIds[0],1),sg("B",leagueIds[1],nationalityIds[1],2),sg("C",leagueIds[2],nationalityIds[2],3)],[sg("A",leagueIds[0],nationalityIds[0],1),sg("B",leagueIds[1],"atlantis",2)]];
      const signingOk=list=>list.length<=3&&new Set(list.map(r=>r.slot)).size===list.length&&list.every(r=>r.name.length>=1&&r.name.length<=80&&r.name===r.name.trim()&&leagueSet.has(r.leagueId)&&nationSet.has(r.nationalityId));
      await check("signingProbe",signingLists,signingOk,"signing list");
      assert.ok(writes>=2000,`probe wrote ${writes} candidates`);
    }finally{await probeEnv.cleanup();}
  });
  process.stdout.write(`PASS JOB-1051 and JOB-1052 Rules emulator proofs: ${proofChecks} numbered checks (salt shapes, immutability, rival cannot read the salt before COMPLETED, r66 compatibility, catalog ids, signing names, max-size transaction, exhaustive probe).\n`);
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    const now=Date.now(),startedSeconds=Math.floor((now-16*60*1000)/1000),startedNanos=123456000;
    const startedAt=new Timestamp(startedSeconds,startedNanos);
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));
      await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
      await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",R),rivalry());
      await setDoc(doc(db,"rivalries",R,"sessions",FRESH),session(now));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),setup());
      await setDoc(doc(db,"rivalries",R,"careerStart","authoritative"),career());
      await setDoc(doc(db,"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });

    const dbB=env.authenticatedContext(B).firestore();
    const providerOptions={user:{uid:B},firestore:dbB,firebaseSdk:sdk(),rivalryId:R,sessionId:FRESH,deviceId:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:now};

    const preflight=await provider.read(providerOptions);
    assert.equal(preflight.ok,true,`Fresh ACTIVE session must read the existing Transfer Challenge before any mutation: ${JSON.stringify(preflight)}`);
    assert.equal(preflight.state.phase,"WINDOW_OPEN");

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(FRESH,startedAt,now));
    });
    const sameSessionProbe=await provider.requestEndWindow({...providerOptions,operationId:OP2,baseRevision:1});
    assert.equal(sameSessionProbe.ok,true,`Transfer update under its already-current ACTIVE session must be accepted: ${JSON.stringify(sameSessionProbe)}`);

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });
    const migrationProbe=await provider.requestEndWindow({...providerOptions,operationId:OP3,baseRevision:1});
    assert.equal(migrationProbe.ok,true,`Fresh ACTIVE session must be allowed to take over Transfer authority on a non-timeout write: ${JSON.stringify(migrationProbe)}`);
    assert.equal(migrationProbe.state.phase,"WINDOW_OPEN");

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });

    const result=await provider.advanceExpiredWindow({...providerOptions,operationId:OP4,baseRevision:1});
    assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.phase,"GUESS_ENTRY");
    assert.equal(result.revision,2);

    const stored=(await getDoc(doc(dbB,"rivalries",R,"transferChallenges","season_1"))).data();
    assert.equal(stored.activeSessionId,FRESH,"Fresh exact session must take over transfer authority without resetting the challenge.");
    assert.equal(stored.startedAt.seconds,startedAt.seconds,"startedAt seconds must remain byte-equivalent across a fresh-session update.");
    assert.equal(stored.startedAt.nanoseconds,startedAt.nanoseconds,"startedAt nanoseconds must remain exact across a fresh-session update.");
    const endedAtMs=stored.endedAt.toMillis();
    assert.ok(endedAtMs>=startedAt.toMillis()+15*60*1000,"timeout transition must never occur before the authoritative 15-minute deadline.");
    assert.ok(endedAtMs<=Date.now()+5000,"timeout endedAt must be the Firestore request/server time, not an invented future value.");

    await proveSaltsAndCatalogIds(env);

    process.stdout.write("PASS Shared Transfer fresh-session expiry emulator: fresh-session read + authority migration both succeed, then an old-session WINDOW_OPEN at 00:00 advances under the fresh ACTIVE session, preserves exact startedAt, writes timeout completion at server request time, and reaches GUESS_ENTRY without redraw or reset.\\n");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
