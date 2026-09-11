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
const rivalryId=`pair_${"a".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`;
const freshSessionId=`session_${"c".repeat(64)}`;
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
async function rivalry(){const now=Timestamp.fromMillis(Date.now()-60_000);const data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:profile1,saveId:save1,displayLabel:"Manager One",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:uid2,profileId:profile2,saveId:save2,displayLabel:"Manager Two",entitlementState:"active",deletionConsent:false}],authorizedAccountIds:[uid1,uid2],createdByAccountId:uid1,createdAt:now};return envelope("rivalry",rivalryId,2,data,{updatedAt:now});}
function setup(){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};}
function commit(seasonNumber){return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,acknowledgedRoles:["playerOne","playerTwo"]};}
async function session(){const createdAt=Timestamp.fromMillis(Date.now()-120_000),lastActivityAt=Timestamp.fromMillis(Date.now()-10_000);return Sessions.buildEnvelope({sessionId,revision:5,parentRevision:4,priorContentHash:`sha256:${"2".repeat(64)}`,updatedAt:lastActivityAt,accountId:uid2,deviceId:device2,data:{createdAt,expiresAt:Timestamp.fromMillis(Date.now()+20*60_000),hostAccountId:uid1,lastActivityAt,memberAccountIds:[uid1,uid2],revokedAt:null,rivalryId,state:"active"},cryptoImpl:crypto.webcrypto});}
function sdk(){return {Timestamp,doc,runTransaction};}
function finalProjection(){return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:"premier-league",totalSeasons:3,acceptedSeasons:3,completedSeason:3,acceptedRevisionKey:"1:2:sha256:"+"1".repeat(64)+"|2:2:sha256:"+"2".repeat(64)+"|3:2:sha256:"+"3".repeat(64),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals:{playerOne:22,playerTwo:19},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};}
function options(db,user,deviceId,intent){return {user:{uid:user},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto};}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",uid1),await account(uid1));
      await setDoc(doc(db,"accounts",uid2),await account(uid2));
      await setDoc(doc(db,"accounts",uid3),await account(uid3));
      await setDoc(doc(db,"accounts",uid1,"devices",device1),await device(uid1,device1,"1"));
      await setDoc(doc(db,"accounts",uid2,"devices",device2),await device(uid2,device2,"2"));
      await setDoc(doc(db,"accounts",uid3,"devices",device3),await device(uid3,device3,"3"));
      await setDoc(doc(db,"rivalries",rivalryId),await rivalry());
      await setDoc(doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),setup());
      await setDoc(doc(db,"rivalries",rivalryId,"seasonCommits","season_1"),commit(1));
      await setDoc(doc(db,"rivalries",rivalryId,"seasonCommits","season_2"),commit(2));
      await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session());
    });

    const host=env.authenticatedContext(uid1).firestore();
    const peer=env.authenticatedContext(uid2).firestore();
    const third=env.authenticatedContext(uid3).firestore();
    const intent=Terminal.prepare(finalProjection(),{sessionId});

    const early=await Provider.close(options(host,uid1,device1,intent));
    assert.equal(early.ok,false,"Terminal Close must fail while one configured season commit is missing");
    assert.ok(["permission-denied","firestore/permission-denied"].includes(early.code),JSON.stringify(early));
    assert.equal((await assertSucceeds(getDoc(doc(host,"rivalries",rivalryId)))).data().data.connectionState,"active");
    assert.equal((await assertSucceeds(getDoc(doc(host,"rivalries",rivalryId,"sessions",sessionId)))).data().data.state,"active");

    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",rivalryId,"seasonCommits","season_3"),commit(3));});

    const forged=JSON.parse(JSON.stringify(intent));forged.totalSeasons=1;forged.completedSeason=1;forged.managerTotals={playerOne:8,playerTwo:7};
    const forgedResult=await Provider.close(options(host,uid1,device1,forged));
    assert.equal(forgedResult.ok,false,"Terminal Close intent cannot contradict the authoritative configured season count");
    assert.ok(["permission-denied","firestore/permission-denied"].includes(forgedResult.code),JSON.stringify(forgedResult));

    const deniedThird=await Provider.close(options(third,uid3,device3,intent));
    assert.equal(deniedThird.ok,false,"A third account cannot close the rivalry");

    const accepted=await Provider.close(options(host,uid1,device1,intent));
    assert.equal(accepted.ok,true,JSON.stringify(accepted));assert.equal(accepted.status,"accepted");assert.equal(accepted.rivalryState,"closed");assert.equal(accepted.sessionState,"closed");
    const closedRivalry=(await assertSucceeds(getDoc(doc(peer,"rivalries",rivalryId)))).data();
    assert.equal(closedRivalry.data.connectionState,"closed");assert.equal(Terminal.sameWitness(closedRivalry.data.terminalClose,intent),true);
    await assertFails(getDoc(doc(peer,"rivalries",rivalryId,"sessions",sessionId)),"normal session reads must not regain authority after terminal rivalry closure");

    const replay=await Provider.close(options(peer,uid2,device2,intent));
    assert.equal(replay.ok,true,JSON.stringify(replay));assert.equal(replay.replayed,true);

    const newSession=await StandardSessions.openSession({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId,sessionId:freshSessionId,deviceId:device1,nowEpochMs:Date.now(),ttlMs:60_000,cryptoImpl:crypto.webcrypto});
    assert.equal(newSession.ok,false,"A CLOSED rivalry cannot host a replacement private session");
    assert.ok(["permission-denied","PRIVATE_SESSION_RIVALRY_INACTIVE"].includes(newSession.code),JSON.stringify(newSession));

    await assertFails(updateDoc(doc(host,"rivalries",rivalryId,"seasonCommits","season_3"),{phase:"COMMITTED"}),"delayed season writes must remain denied after CLOSED");
    const terminalRead=await Provider.read({user:{uid:uid2},firestore:peer,firebaseSdk:sdk(),rivalryId,deviceId:device2,cryptoImpl:crypto.webcrypto});
    assert.equal(terminalRead.ok,true,JSON.stringify(terminalRead));assert.equal(terminalRead.terminal,true);assert.equal(Terminal.sameWitness(terminalRead.terminalWitness,intent),true);

    console.log("PASS r18 Terminal Close generated Rules emulator: early/forged/third-account close denied, exact final close atomically closes rivalry+session, both managers retain terminal read authority, delayed writes and fresh-session resurrection stay denied, zero-list Spark boundary preserved.");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
