"use strict";
// Terminal Close stale-write race (composed production Rules, firestore.spark.generated.rules).
// Both managers save the same Terminal Close step at the same moment. The partner's write lands first, so this manager's
// write is built on a revision the rivalry (and session) already left. The Rules must refuse that stale write with an
// ordinary permission-denied, never with the Rules evaluation limit ("maximum of 1000 expressions"), and the client must
// still recover. Covered: every per-season progress step (initial, middle, final; transaction set and plain set), the final
// multi-document close (session + rivalry in one commit), each half of it on its own, the provider replay that follows,
// and a real two-provider race to the end.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/terminal-close-stale-write-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {initializeTestEnvironment,assertSucceeds}=require("@firebase/rules-unit-testing");
const {Timestamp,doc,getDoc,setDoc,writeBatch,runTransaction}=require("firebase/firestore");
const Terminal=require("../../js/sharedTerminalClose.js");
const Provider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");

const PROJECT_ID="demo-career-mode-showdown-terminal-close-stale-write";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const rivalryId=`pair_${"a".repeat(64)}`,raceRivalryId=`pair_${"f".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`,raceSessionId=`session_${"9".repeat(64)}`;
const uid1="terminal_host",uid2="terminal_peer";
const device1=`device_${"1".repeat(32)}`,device2=`device_${"2".repeat(32)}`;
const profile1=`profile_${"4".repeat(24)}`,profile2=`profile_${"5".repeat(24)}`;
const save1=`save_${"6".repeat(24)}`,save2=`save_${"7".repeat(24)}`;
const TOTAL=3;

function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
async function digest(value){const hash=await crypto.webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(value))));return `sha256:${Buffer.from(hash).toString("hex")}`;}
async function envelope(objectType,objectId,revision,data,{accountId=uid1,deviceId=device1,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now());return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now());return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-60_000);const data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:profile1,saveId:save1,displayLabel:"Manager One",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:uid2,profileId:profile2,saveId:save2,displayLabel:"Manager Two",entitlementState:"active",deletionConsent:false}],authorizedAccountIds:[uid1,uid2],createdByAccountId:uid1,createdAt:now};return envelope("rivalry",id,2,data,{updatedAt:now});}
function setup(id){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:id,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons:TOTAL,confirmedRoles:["playerOne","playerTwo"]};}
function result(overrides={}){return {leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...overrides};}
const SEASONS=[[result({championsLeague:true}),result({domesticCup:true})],[result({domesticCup:true}),result()],[result({leaguePosition:1}),result({championsLeague:true})]];
function score(value){return (value.championsLeague?5:0)+(value.leaguePosition===1?3:0)+(value.domesticCup?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer||value.topAssist)?1:0);}
const TOTALS={playerOne:SEASONS.reduce((sum,[one])=>sum+score(one),0),playerTwo:SEASONS.reduce((sum,[,two])=>sum+score(two),0)};
function commit(id,seasonNumber){const [playerOne,playerTwo]=SEASONS[seasonNumber-1];return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:id,seasonNumber,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne,playerTwo},acknowledgedRoles:["playerOne","playerTwo"]};}
async function session(id,sid){const createdAt=Timestamp.fromMillis(Date.now()-120_000),lastActivityAt=Timestamp.fromMillis(Date.now()-10_000);return Sessions.buildEnvelope({sessionId:sid,revision:5,parentRevision:4,priorContentHash:`sha256:${"2".repeat(64)}`,updatedAt:lastActivityAt,accountId:uid2,deviceId:device2,data:{createdAt,expiresAt:Timestamp.fromMillis(Date.now()+20*60_000),hostAccountId:uid1,lastActivityAt,memberAccountIds:[uid1,uid2],revokedAt:null,rivalryId:id,state:"active"},cryptoImpl:crypto.webcrypto});}
function projection(id){return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:id,leagueId:"premier-league",totalSeasons:TOTAL,acceptedSeasons:TOTAL,completedSeason:TOTAL,acceptedRevisionKey:Array.from({length:TOTAL},(_,i)=>`${i+1}:2:sha256:${String(i+1).repeat(64)}`).join("|"),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals:TOTALS,winner:TOTALS.playerOne>TOTALS.playerTwo?"playerOne":TOTALS.playerTwo>TOTALS.playerOne?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};}
function sdk(){return {Timestamp,doc,runTransaction};}
function options(db,uid,deviceId,intent,id,sid){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto};}

// What stcAdvanceProgress writes for the next season, built on `prior` (the revision this manager read).
async function nextProgress(prior,uid,deviceId,id){
  const progress=prior.data.terminalProgress,season=progress?progress.acceptedThroughSeason+1:1,[one,two]=SEASONS[season-1];
  const terminalProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:TOTAL,acceptedThroughSeason:season,managerTotals:{playerOne:(progress?progress.managerTotals.playerOne:0)+score(one),playerTwo:(progress?progress.managerTotals.playerTwo:0)+score(two)},closedSessionRevision:null};
  return envelope("rivalry",id,prior.revision+1,{...prior.data,terminalProgress},{accountId:uid,deviceId,priorHash:prior.contentHash});
}
// What stcFinalize writes in one commit (session + rivalry), built on the session and rivalry this manager read.
async function finalClose(rivalryPrior,sessionPrior,uid,deviceId,intent){
  const now=Timestamp.fromMillis(Date.now());
  const nextSession=await Sessions.buildEnvelope({sessionId,revision:sessionPrior.revision+1,parentRevision:sessionPrior.revision,priorContentHash:sessionPrior.contentHash,updatedAt:now,accountId:uid,deviceId,data:{...sessionPrior.data,state:"closed",lastActivityAt:now,revokedAt:null},cryptoImpl:crypto.webcrypto});
  const data={...rivalryPrior.data,connectionState:"closed",terminalProgress:{...rivalryPrior.data.terminalProgress,closedSessionRevision:nextSession.revision},terminalClose:JSON.parse(JSON.stringify(intent))};
  return {session:nextSession,rivalry:await envelope("rivalry",rivalryId,rivalryPrior.revision+1,data,{accountId:uid,deviceId,updatedAt:now,priorHash:rivalryPrior.contentHash})};
}
// A stale write must fail as an ordinary Rules denial. The raw message is never printed on success.
async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: the stale write must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: the stale write must be denied before the Rules evaluation limit, not by it`);
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const uid of [uid1,uid2])await setDoc(doc(db,"accounts",uid),await account(uid));
      await setDoc(doc(db,"accounts",uid1,"devices",device1),await device(uid1,device1,"1"));await setDoc(doc(db,"accounts",uid2,"devices",device2),await device(uid2,device2,"2"));
      for(const [id,sid] of [[rivalryId,sessionId],[raceRivalryId,raceSessionId]]){
        await setDoc(doc(db,"rivalries",id),await rivalry(id));await setDoc(doc(db,"rivalries",id,"sharedSetup","authoritative"),setup(id));await setDoc(doc(db,"rivalries",id,"sessions",sid),await session(id,sid));
        for(let season=1;season<=TOTAL;season++)await setDoc(doc(db,"rivalries",id,"seasonCommits",`season_${season}`),commit(id,season));
      }
    });
    const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
    const rivalryRef=db=>doc(db,"rivalries",rivalryId),sessionRef=db=>doc(db,"rivalries",rivalryId,"sessions",sessionId);
    const readRivalry=async()=>(await assertSucceeds(getDoc(rivalryRef(host)))).data();
    const readSession=async()=>(await assertSucceeds(getDoc(sessionRef(host)))).data();

    // 1. Per-season progress: both managers build the same step on the same revision; the host's lands first.
    for(let season=1;season<=TOTAL;season++){
      const base=await readRivalry();
      const hostWrite=await nextProgress(base,uid1,device1,rivalryId),peerWrite=await nextProgress(base,uid2,device2,rivalryId);
      await assertSucceeds(runTransaction(host,async transaction=>{transaction.set(rivalryRef(host),hostWrite);}));
      await assertPlainDenial(runTransaction(peer,async transaction=>{transaction.set(rivalryRef(peer),peerWrite);}),`season ${season} stale progress (transaction)`);
      await assertPlainDenial(setDoc(rivalryRef(peer),peerWrite),`season ${season} stale progress (plain set)`);
      const after=await readRivalry();
      assert.equal(after.revision,base.revision+1,`season ${season}: exactly one progress write lands`);
      assert.equal(after.updatedByAccountId,uid1,`season ${season}: the partner's write stands`);
      assert.equal(after.data.terminalProgress.acceptedThroughSeason,season);
    }
    assert.deepEqual((await readRivalry()).data.terminalProgress.managerTotals,TOTALS);

    // 2. Final close: both managers build session + rivalry on the same revisions; the host's provider close lands first.
    const intent=Terminal.prepare(projection(rivalryId),{sessionId});
    const rivalryBase=await readRivalry(),sessionBase=await readSession();
    const stale=await finalClose(rivalryBase,sessionBase,uid2,device2,intent);
    const accepted=await Provider.close(options(host,uid1,device1,intent,rivalryId,sessionId));
    assert.equal(accepted.ok,true,JSON.stringify(accepted));assert.equal(accepted.status,"accepted");
    const closedRivalry=await readRivalry();
    await assertPlainDenial((()=>{const batch=writeBatch(peer);batch.set(sessionRef(peer),stale.session);batch.set(rivalryRef(peer),stale.rivalry);return batch.commit();})(),"stale final close (session + rivalry batch)");
    await assertPlainDenial(runTransaction(peer,async transaction=>{transaction.set(sessionRef(peer),stale.session);transaction.set(rivalryRef(peer),stale.rivalry);}),"stale final close (session + rivalry transaction)");
    await assertPlainDenial(setDoc(sessionRef(peer),stale.session),"stale final close (session only)");
    await assertPlainDenial(setDoc(rivalryRef(peer),stale.rivalry),"stale final close (rivalry only)");
    const stillClosed=await readRivalry();
    assert.equal(stillClosed.revision,closedRivalry.revision,"the stale close changes nothing");assert.equal(stillClosed.contentHash,closedRivalry.contentHash);
    assert.equal(stillClosed.data.connectionState,"closed");assert.equal(stillClosed.data.terminalProgress.closedSessionRevision,accepted.sessionRevision);
    // The losing manager recovers through the provider: a replay of the same witness, same session revision.
    const replay=await Provider.close(options(peer,uid2,device2,intent,rivalryId,sessionId));
    assert.equal(replay.ok,true,JSON.stringify(replay));assert.equal(replay.replayed,true);assert.equal(replay.sessionRevision,accepted.sessionRevision);
    const read=await Provider.read({user:{uid:uid2},firestore:peer,firebaseSdk:sdk(),rivalryId,deviceId:device2,cryptoImpl:crypto.webcrypto});
    assert.equal(read.ok,true,JSON.stringify(read));assert.equal(read.terminal,true);assert.equal(Terminal.sameWitness(read.terminalWitness,intent),true);

    // 3. A real race: both providers close the same Showdown at once. Both finish, with one shared result.
    const raceIntent=Terminal.prepare(projection(raceRivalryId),{sessionId:raceSessionId});
    const [first,second]=await Promise.all([Provider.close(options(host,uid1,device1,raceIntent,raceRivalryId,raceSessionId)),Provider.close(options(peer,uid2,device2,raceIntent,raceRivalryId,raceSessionId))]);
    assert.equal(first.ok,true,JSON.stringify(first));assert.equal(second.ok,true,JSON.stringify(second));
    assert.equal(first.sessionRevision,second.sessionRevision,"both managers see the same closing session revision");
    const raced=(await assertSucceeds(getDoc(doc(peer,"rivalries",raceRivalryId)))).data();
    assert.equal(raced.data.connectionState,"closed");assert.equal(raced.data.terminalProgress.acceptedThroughSeason,TOTAL);assert.deepEqual(raced.data.terminalProgress.managerTotals,TOTALS);assert.equal(Terminal.sameWitness(raced.data.terminalClose,raceIntent),true);

    console.log(`PASS Terminal Close stale-write race on the composed Rules: ${TOTAL} stale per-season progress writes (transaction and plain set), the stale final session + rivalry close (batch, transaction, each half) are refused with an ordinary permission-denied before the Rules evaluation limit; the partner's writes stand, the losing manager's provider replays the same close, and a real two-provider race closes once with identical totals.`);
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
