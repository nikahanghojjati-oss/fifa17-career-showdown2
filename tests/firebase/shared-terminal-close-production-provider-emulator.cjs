"use strict";
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {Timestamp,doc,getDoc,setDoc,updateDoc,runTransaction}=require("firebase/firestore");
const Terminal=require("../../js/sharedTerminalClose.js");
const Provider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const StandardSessions=require("../../js/sparkStandardAuthPrivateSession.js");

const PROJECT_ID="demo-career-mode-showdown-terminal-close-production-deploy";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const rivalryId=`pair_${"a".repeat(64)}`,rivalryId10=`pair_${"d".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`,freshSessionId=`session_${"c".repeat(64)}`,sessionId10=`session_${"e".repeat(64)}`;
const uid1="terminal_host",uid2="terminal_peer",uid3="terminal_third";
const device1=`device_${"1".repeat(32)}`,device2=`device_${"2".repeat(32)}`,device3=`device_${"3".repeat(32)}`;
const profile1=`profile_${"4".repeat(24)}`,profile2=`profile_${"5".repeat(24)}`;
const save1=`save_${"6".repeat(24)}`,save2=`save_${"7".repeat(24)}`;

function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=uid1,deviceId=device1,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now());return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now());return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-60_000);const data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:profile1,saveId:save1,displayLabel:"Manager One",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:uid2,profileId:profile2,saveId:save2,displayLabel:"Manager Two",entitlementState:"active",deletionConsent:false}],authorizedAccountIds:[uid1,uid2],createdByAccountId:uid1,createdAt:now};return envelope("rivalry",id,2,data,{updatedAt:now});}
function setup(id,totalSeasons){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:id,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons,confirmedRoles:["playerOne","playerTwo"]};}
function result(overrides={}){return {leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...overrides};}
function commit(id,seasonNumber,playerOne,playerTwo){return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:id,seasonNumber,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne,playerTwo},acknowledgedRoles:["playerOne","playerTwo"]};}
async function session(id,sid){const createdAt=Timestamp.fromMillis(Date.now()-120_000),lastActivityAt=Timestamp.fromMillis(Date.now()-10_000);return Sessions.buildEnvelope({sessionId:sid,revision:5,parentRevision:4,priorContentHash:`sha256:${"2".repeat(64)}`,updatedAt:lastActivityAt,accountId:uid2,deviceId:device2,data:{createdAt,expiresAt:Timestamp.fromMillis(Date.now()+20*60_000),hostAccountId:uid1,lastActivityAt,memberAccountIds:[uid1,uid2],revokedAt:null,rivalryId:id,state:"active"},cryptoImpl:crypto.webcrypto});}
function sdk(){return {Timestamp,doc,runTransaction};}
function projection(id,sid,totalSeasons,managerTotals){return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:id,leagueId:"premier-league",totalSeasons,acceptedSeasons:totalSeasons,completedSeason:totalSeasons,acceptedRevisionKey:Array.from({length:totalSeasons},(_,i)=>`${i+1}:2:sha256:${String(i+1).repeat(64).slice(0,64)}`).join("|"),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals,winner:managerTotals.playerOne>managerTotals.playerTwo?"playerOne":managerTotals.playerTwo>managerTotals.playerOne?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};}
function options(db,user,deviceId,intent,id=rivalryId,sid=sessionId){return {user:{uid:user},firestore:db,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto};}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",uid1),await account(uid1));await setDoc(doc(db,"accounts",uid2),await account(uid2));await setDoc(doc(db,"accounts",uid3),await account(uid3));
      await setDoc(doc(db,"accounts",uid1,"devices",device1),await device(uid1,device1,"1"));await setDoc(doc(db,"accounts",uid2,"devices",device2),await device(uid2,device2,"2"));await setDoc(doc(db,"accounts",uid3,"devices",device3),await device(uid3,device3,"3"));
      await setDoc(doc(db,"rivalries",rivalryId),await rivalry(rivalryId));await setDoc(doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),setup(rivalryId,3));await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session(rivalryId,sessionId));
      await setDoc(doc(db,"rivalries",rivalryId,"seasonCommits","season_1"),commit(rivalryId,1,result({leaguePosition:1,leaguePoints:100,domesticCup:true,championsLeague:true,topScorer:true}),result({leaguePoints:100,championsLeague:true,topScorer:true})));
      await setDoc(doc(db,"rivalries",rivalryId,"seasonCommits","season_2"),commit(rivalryId,2,result({domesticCup:true,championsLeague:true}),result({domesticCup:true,championsLeague:true})));
    });

    const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore(),third=env.authenticatedContext(uid3).firestore();
    const intent=Terminal.prepare(projection(rivalryId,sessionId,3,{playerOne:22,playerTwo:19}),{sessionId});
    assert.equal(Object.hasOwn(intent,"acceptedRevisionKey"),false);assert.equal(Object.hasOwn(intent,"fixedClubs"),false);

    const early=await Provider.close(options(host,uid1,device1,intent));
    assert.equal(early.ok,false,"Terminal Close must fail while one configured season commit is missing");assert.equal(early.code,"TERMINAL_CLOSE_SEASON_COMMIT_INVALID",JSON.stringify(early));
    const partial=(await assertSucceeds(getDoc(doc(host,"rivalries",rivalryId)))).data();assert.equal(partial.data.connectionState,"active");assert.equal(partial.data.terminalProgress.acceptedThroughSeason,2);assert.deepEqual(partial.data.terminalProgress.managerTotals,{playerOne:17,playerTwo:13});
    assert.equal((await assertSucceeds(getDoc(doc(host,"rivalries",rivalryId,"sessions",sessionId)))).data().data.state,"active");

    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",rivalryId,"seasonCommits","season_3"),commit(rivalryId,3,result({championsLeague:true}),result({domesticCup:true,championsLeague:true})));});

    const forgedCount=JSON.parse(JSON.stringify(intent));forgedCount.totalSeasons=1;forgedCount.completedSeason=1;forgedCount.managerTotals={playerOne:8,playerTwo:7};forgedCount.winner="playerOne";
    const forgedCountResult=await Provider.close(options(host,uid1,device1,forgedCount));assert.equal(forgedCountResult.ok,false,"Terminal Close intent cannot contradict the authoritative configured season count");assert.equal(forgedCountResult.code,"TERMINAL_CLOSE_PROGRESS_INVALID",JSON.stringify(forgedCountResult));
    const deniedThird=await Provider.close(options(third,uid3,device3,intent));assert.equal(deniedThird.ok,false,"A third account cannot close the rivalry");

    const forgedTotals=JSON.parse(JSON.stringify(intent));forgedTotals.managerTotals={playerOne:23,playerTwo:19};forgedTotals.winner="playerOne";
    const forgedTotalsResult=await Provider.close(options(host,uid1,device1,forgedTotals));assert.equal(forgedTotalsResult.ok,false,"Rules-backed terminal progress must reject forged accumulated scoring");assert.equal(forgedTotalsResult.code,"TERMINAL_CLOSE_FINAL_AUTHORITY_MISMATCH",JSON.stringify(forgedTotalsResult));
    const sealed=(await assertSucceeds(getDoc(doc(host,"rivalries",rivalryId)))).data();assert.equal(sealed.data.connectionState,"active");assert.equal(sealed.data.terminalProgress.acceptedThroughSeason,3);assert.deepEqual(sealed.data.terminalProgress.managerTotals,{playerOne:22,playerTwo:19});

    async function assertForgedTerminalMetadataDenied(extraWitnessFields,label){
      const rivalryRef=doc(host,"rivalries",rivalryId),sessionRef=doc(host,"rivalries",rivalryId,"sessions",sessionId);
      const currentRivalry=(await assertSucceeds(getDoc(rivalryRef))).data(),currentSession=(await assertSucceeds(getDoc(sessionRef))).data();
      const now=Timestamp.fromMillis(Date.now());
      const nextSessionData={...currentSession.data,state:"closed",lastActivityAt:now,revokedAt:null};
      const nextSession=await Sessions.buildEnvelope({sessionId,revision:currentSession.revision+1,parentRevision:currentSession.revision,priorContentHash:currentSession.contentHash,updatedAt:now,accountId:uid1,deviceId:device1,data:nextSessionData,cryptoImpl:crypto.webcrypto});
      const nextProgress={...currentRivalry.data.terminalProgress,closedSessionRevision:nextSession.revision};
      const terminalClose={...JSON.parse(JSON.stringify(intent)),...extraWitnessFields};
      const nextRivalryData={...currentRivalry.data,connectionState:"closed",terminalProgress:nextProgress,terminalClose};
      const nextRivalry=await envelope("rivalry",rivalryId,currentRivalry.revision+1,nextRivalryData,{accountId:uid1,deviceId:device1,updatedAt:now,priorHash:currentRivalry.contentHash});
      await assertFails(runTransaction(host,async transaction=>{transaction.set(sessionRef,nextSession);transaction.set(rivalryRef,nextRivalry);}),label);
      assert.equal((await assertSucceeds(getDoc(rivalryRef))).data().data.connectionState,"active",`${label}: rivalry must remain ACTIVE`);
      assert.equal((await assertSucceeds(getDoc(sessionRef))).data().data.state,"active",`${label}: session must remain ACTIVE`);
    }
    await assertForgedTerminalMetadataDenied({acceptedRevisionKey:"forged-terminal-revision-key"},"direct Firestore close cannot inject an unverifiable acceptedRevisionKey");
    await assertForgedTerminalMetadataDenied({fixedClubs:{playerOne:"Forged A",playerTwo:"Forged B"}},"direct Firestore close cannot inject unverifiable fixedClubs");

    const accepted=await Provider.close(options(host,uid1,device1,intent));assert.equal(accepted.ok,true,JSON.stringify(accepted));assert.equal(accepted.status,"accepted");assert.equal(accepted.rivalryState,"closed");assert.equal(accepted.sessionState,"closed");
    const closedRivalry=(await assertSucceeds(getDoc(doc(peer,"rivalries",rivalryId)))).data();assert.equal(closedRivalry.data.connectionState,"closed");assert.equal(closedRivalry.data.terminalProgress.acceptedThroughSeason,3);assert.deepEqual(closedRivalry.data.terminalProgress.managerTotals,{playerOne:22,playerTwo:19});assert.equal(closedRivalry.data.terminalProgress.closedSessionRevision,accepted.sessionRevision);assert.equal(Object.hasOwn(closedRivalry.data.terminalClose,"acceptedRevisionKey"),false);assert.equal(Object.hasOwn(closedRivalry.data.terminalClose,"fixedClubs"),false);assert.equal(Terminal.sameWitness(closedRivalry.data.terminalClose,intent),true);
    await assertFails(getDoc(doc(peer,"rivalries",rivalryId,"sessions",sessionId)),"normal session reads must not regain authority after terminal rivalry closure");

    const replay=await Provider.close(options(peer,uid2,device2,intent));assert.equal(replay.ok,true,JSON.stringify(replay));assert.equal(replay.replayed,true);
    const newSession=await StandardSessions.openSession({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId,sessionId:freshSessionId,deviceId:device1,nowEpochMs:Date.now(),ttlMs:60_000,cryptoImpl:crypto.webcrypto});assert.equal(newSession.ok,false,"A CLOSED rivalry cannot host a replacement private session");assert.ok(["permission-denied","PRIVATE_SESSION_RIVALRY_INACTIVE"].includes(newSession.code),JSON.stringify(newSession));
    await assertFails(updateDoc(doc(host,"rivalries",rivalryId,"seasonCommits","season_3"),{phase:"COMMITTED"}),"delayed season writes must remain denied after CLOSED");
    const terminalRead=await Provider.read({user:{uid:uid2},firestore:peer,firebaseSdk:sdk(),rivalryId,deviceId:device2,cryptoImpl:crypto.webcrypto});assert.equal(terminalRead.ok,true,JSON.stringify(terminalRead));assert.equal(terminalRead.terminal,true);assert.equal(terminalRead.sessionRevision,accepted.sessionRevision);assert.equal(Terminal.sameWitness(terminalRead.terminalWitness,intent),true);

    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();await setDoc(doc(db,"rivalries",rivalryId10),await rivalry(rivalryId10));await setDoc(doc(db,"rivalries",rivalryId10,"sharedSetup","authoritative"),setup(rivalryId10,10));await setDoc(doc(db,"rivalries",rivalryId10,"sessions",sessionId10),await session(rivalryId10,sessionId10));
      for(let seasonNumber=1;seasonNumber<=10;seasonNumber++)await setDoc(doc(db,"rivalries",rivalryId10,"seasonCommits",`season_${seasonNumber}`),commit(rivalryId10,seasonNumber,result({domesticCup:true}),result()));
    });
    const intent10=Terminal.prepare(projection(rivalryId10,sessionId10,10,{playerOne:10,playerTwo:0}),{sessionId:sessionId10});const accepted10=await Provider.close(options(host,uid1,device1,intent10,rivalryId10,sessionId10));assert.equal(accepted10.ok,true,JSON.stringify(accepted10));const closed10=(await assertSucceeds(getDoc(doc(peer,"rivalries",rivalryId10)))).data();assert.equal(closed10.data.connectionState,"closed");assert.equal(closed10.data.terminalProgress.acceptedThroughSeason,10);assert.deepEqual(closed10.data.terminalProgress.managerTotals,{playerOne:10,playerTwo:0});

    console.log("PASS r18 Terminal Close generated Rules emulator: monotonic per-season proof stays under Firestore budgets through a full 10-season close, canonical score totals are Rules-backed, direct clients cannot inject unverifiable terminal provenance metadata, early/forged/third-account close is denied, final close atomically closes rivalry+session, terminal reads survive while delayed writes and fresh-session resurrection remain denied.");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});