"use strict";
// POS1M world: the two managers, their devices, the permanent pair (rivalry) and one live session, seeded on the
// stand-in server exactly as the provider emulator tests seed them (tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs).
// playerOne = Daniel (coordinator, account A), playerTwo = Nik (account B).
const path=require("node:path");
const {Server,sdk,Timestamp}=require("./standin.cjs");

const ROOT=path.resolve(__dirname,"../..");
global.window=globalThis;
require(path.join(ROOT,"data/transferOptions.js"));

const A="acct_pos1m_daniel",B="acct_pos1m_nik";
const RIVALRY=`pair_${"1".repeat(64)}`;
const SESSION=`session_${"b".repeat(64)}`;
const DEVICE={playerOne:`device_${"a".repeat(32)}`,playerTwo:`device_${"b".repeat(32)}`};
// A second device per manager, for the phone-swap fault (the same manager signs in on another phone).
const SWAP_DEVICE={playerOne:`device_${"c".repeat(32)}`,playerTwo:`device_${"d".repeat(32)}`};
const ACCOUNT={playerOne:A,playerTwo:B};
const PROFILE={playerOne:`profile_${"1".repeat(24)}`,playerTwo:`profile_${"2".repeat(24)}`};
const SAVE={playerOne:`save_${"3".repeat(24)}`,playerTwo:`save_${"4".repeat(24)}`};
const ROLES=Object.freeze(["playerOne","playerTwo"]);
const other=role=>role==="playerOne"?"playerTwo":"playerOne";

function slots(){return ROLES.map(role=>({slotId:role,accountId:ACCOUNT[role],profileId:PROFILE[role],saveId:SAVE[role],entitlementState:"active"}));}
function accountDoc(uid){return {objectType:"account",objectId:uid,lifecycleState:"live",data:{status:"active"}};}
function deviceDoc(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(){return {objectType:"rivalry",objectId:RIVALRY,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:slots()}};}
function sessionDoc(nowMs,id=SESSION,expiresAtMs=nowMs+4*60*60*1000){
  const createdAt=Timestamp.fromMillis(nowMs-60_000),lastActivityAt=Timestamp.fromMillis(nowMs-1_000),expiresAt=Timestamp.fromMillis(expiresAtMs);
  return {schemaVersion:1,objectType:"session",objectId:id,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DEVICE.playerOne,data:{rivalryId:RIVALRY,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}

// The live session outlasts any story (a real 4-hour session that expires and is re-joined is a separate fault move).
function seed(server,nowMs,{sessionHours=72}={}){
  for(const role of ROLES){
    server.adminSet(`accounts/${ACCOUNT[role]}`,accountDoc(ACCOUNT[role]));
    server.adminSet(`accounts/${ACCOUNT[role]}/devices/${DEVICE[role]}`,deviceDoc(DEVICE[role]));
    server.adminSet(`accounts/${ACCOUNT[role]}/devices/${SWAP_DEVICE[role]}`,deviceDoc(SWAP_DEVICE[role]));
  }
  server.adminSet(`rivalries/${RIVALRY}`,rivalryDoc());
  server.adminSet(`rivalries/${RIVALRY}/sessions/${SESSION}`,sessionDoc(nowMs,SESSION,nowMs+sessionHours*60*60*1000));
}

function makeWorld(sim,{faults={},skewMs={playerOne:0,playerTwo:0},checkpoint=null}={}){
  const server=new Server(sim,faults);
  if(checkpoint){server.docs=new Map(checkpoint.docs);server.version=checkpoint.version;server.autoSeq=checkpoint.autoSeq;}
  else seed(server,sim.now);
  return {server,sdk,sim,skewMs};
}
// The options object every spark provider takes. client is the phone's Firestore instance (one tab).
function providerOptions(world,phone,extra={}){
  return {user:{uid:ACCOUNT[phone.role]},firestore:phone.client,firebaseSdk:world.sdk,rivalryId:RIVALRY,sessionId:SESSION,deviceId:phone.deviceId,nowEpochMs:phone.client.now(),cryptoImpl:world.sim.crypto,...extra};
}

module.exports={ROOT,A,B,RIVALRY,SESSION,DEVICE,SWAP_DEVICE,ACCOUNT,PROFILE,SAVE,ROLES,other,makeWorld,providerOptions,sessionDoc,seed};
