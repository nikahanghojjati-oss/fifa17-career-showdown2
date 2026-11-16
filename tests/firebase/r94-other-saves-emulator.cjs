"use strict";
// R94-06 job 4: the client saves no other suite makes on the COMPOSED production Rules, made here through the real client
// code so the Rules budget sweep (tests/firebase/rules-budget-sweep-emulator.cjs) measures them like every other save:
//   O1 device registration (js/sparkPrivatePairing.js registerDevice) and O2 device revoke (revokeRegisteredDevice);
//   O3 the session offer rivalries/*/sessionOffers/current, written exactly as js/sparkRemoteJoining.js srjCommitOffer does
//      (its state machine keeps that write private; the contract pins the shape against the client source);
//   O4 the connected shared state publish (js/sparkConnectedRivalry.js publishSharedState: state/authoritative plus its
//      idempotency receipt), and O5 its replay.
// The pair itself is made by the real START and JOIN (js/sparkPrivatePairing.js with js/persistentNikDanielPair.js witnesses),
// so every save runs on a live paired rivalry as in the game.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,runTransaction,serverTimestamp,setDoc}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const Pair=require(path.join(__dirname,"../../js/persistentNikDanielPair.js"));
const Pairing=require(path.join(__dirname,"../../js/sparkPrivatePairing.js"));
const Connected=require(path.join(__dirname,"../../js/sparkConnectedRivalry.js"));
const StandardSessions=require(path.join(__dirname,"../../js/sparkStandardAuthPrivateSession.js"));
const RemoteJoining=require(path.join(__dirname,"../../js/sparkRemoteJoining.js"));

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const PROJECT_ID="demo-cms-r94-other-saves";
let step=0;
const check=async(id,label,promise)=>{const value=await promise;step+=1;console.log(`ok ${step} ${id} ${label}`);return value;};
let seq=0;const nextHash=()=>`sha256:${(++seq).toString(16).padStart(64,"0")}`;
const envelope=({objectType,objectId,updatedAt,accountId,deviceId=null,data})=>({schemaVersion:1,objectType,objectId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:nextHash(),priorContentHash:null,updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,tombstone:null,data});
const deviceIdOf=seed=>`device_${String(seed).repeat(32).slice(0,32)}`;
const identity=(seed,t0)=>({schemaVersion:1,installationId:`installation_${String(seed).repeat(32).slice(0,32)}`,deviceId:deviceIdOf(seed),createdAtEpochMs:t0-180000});
const binding=(role,ch)=>({saveId:`save_${ch.repeat(24)}`,profileId:`profile_${ch.repeat(24)}`,managerRole:role,displayLabel:role==="playerOne"?"Daniel":"Nik"});
function saveRuntime(own,profiles){
  const snapshot={schemaVersion:1,activeSaveId:own.saveId,
    profiles:[{schemaVersion:1,profileId:profiles.playerOne,displayName:"Daniel"},{schemaVersion:1,profileId:profiles.playerTwo,displayName:"Nik"}],
    saves:[{saveId:own.saveId,showdown:{id:"local-r94",status:"r94",currentRound:2,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},
      identity:{schemaVersion:1,saveId:own.saveId,managerProfileIds:profiles},
      rounds:[{roundNumber:1,seasonId:`season_${"3".repeat(24)}`,winner:"playerOne"},{roundNumber:2,seasonId:`season_${"4".repeat(24)}`,winner:null}]}}]};
  return {isReady:()=>true,getLibrarySnapshot:()=>structuredClone(snapshot)};
}

(async()=>{
  assert.match(RULES,/match \/sessionOffers\/\{offerId\}/,"composed Rules carry the session offer");
  assert.match(RULES,/match \/state\/authoritative \{/,"composed Rules carry the connected shared state");
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const t0=Date.now(),now=Timestamp.fromMillis(t0);let t=t0+1000;const tick=()=>(t+=1000);
    const D="acct_r94_daniel",N="acct_r94_nik",ident={[D]:identity("a",t0),[N]:identity("b",t0)},bind={[D]:binding("playerOne","a"),[N]:binding("playerTwo","b")};
    await env.withSecurityRulesDisabled(async c=>{for(const uid of [D,N]){
      await setDoc(doc(c.firestore(),"accounts",uid),envelope({objectType:"account",objectId:uid,updatedAt:now,accountId:uid,data:{status:"active",createdAt:now,deletionRequestedAt:null}}));
    }});
    const db={[D]:env.authenticatedContext(D).firestore(),[N]:env.authenticatedContext(N).firestore()};
    const base=uid=>({user:{uid},firestore:db[uid],firebaseSdk:firestoreSdk,cryptoImpl:crypto.webcrypto});

    // O1 device registration, both managers, through the real client.
    for(const uid of [D,N]){const r=await Pairing.registerDevice({...base(uid),identity:ident[uid],nowEpochMs:tick()});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.action,"created");}
    step+=1;console.log(`ok ${step} O1 device registration (both managers)`);

    // The pair: the real START and JOIN with their durable witnesses.
    const rivalryId=`pair_${"9".repeat(64)}`;
    const ctx=uid=>({services:{firestoreSdk,firestore:db[uid]},accountId:uid,deviceId:ident[uid].deviceId});
    const created=await Pairing.createPairing({...base(D),identity:ident[D],binding:bind[D],capability:rivalryId,nowEpochMs:tick(),durableWitness:Pair.createDurableCreationWitness(ctx(D),"playerOne",Pair.managerByRole.playerOne)});
    assert.equal(created.ok,true,JSON.stringify(created));
    const joined=await Pairing.redeemPairing({...base(N),identity:ident[N],binding:bind[N],capability:rivalryId,nowEpochMs:tick(),durableWitness:Pair.createDurableRedemptionWitness(ctx(N),"playerTwo",Pair.managerByRole.playerTwo,rivalryId)});
    assert.equal(joined.ok,true,JSON.stringify(joined));

    // O2 a second phone of Daniel's registers, then the first revokes it.
    const spare=identity("c",t0);
    const extra=await Pairing.registerDevice({...base(D),identity:spare,nowEpochMs:tick()});assert.equal(extra.ok,true,JSON.stringify(extra));
    const revoked=await check("O2","device revoke of a second phone",Pairing.revokeRegisteredDevice({...base(D),identity:ident[D],targetDeviceId:spare.deviceId,nowEpochMs:tick()}));
    assert.equal(revoked.ok,true,JSON.stringify(revoked));
    await env.withSecurityRulesDisabled(async c=>{assert.equal((await getDoc(doc(c.firestore(),"accounts",D,"devices",spare.deviceId))).data().data.state,"revoked");});

    // O3 Daniel hosts a session and points the pair's offer at it (the shape of srjCommitOffer).
    const sessionId=`session_${"5".repeat(64)}`;
    const hosted=await StandardSessions.openSession({...base(D),deviceId:ident[D].deviceId,rivalryId,sessionId,nowEpochMs:Date.now(),ttlMs:RemoteJoining.hostSessionTtlMs});
    assert.equal(hosted.ok,true,JSON.stringify(hosted));
    const session=(await assertSucceeds(getDoc(doc(db[D],"rivalries",rivalryId,"sessions",sessionId)))).data().data;
    const offerRef=doc(db[D],"rivalries",rivalryId,"sessionOffers","current");
    const value={schemaVersion:1,sessionId,hostAccountId:D,expiresAt:session.expiresAt,updatedAt:serverTimestamp()};
    await check("O3","session offer: create, then a rewrite as the client's retry does",(async()=>{
      await runTransaction(db[D],async tx=>{await tx.get(offerRef);tx.set(offerRef,value);});
      await runTransaction(db[D],async tx=>{await tx.get(offerRef);tx.set(offerRef,value);});
    })());
    await assertFails(setDoc(doc(db[N],"rivalries",rivalryId,"sessionOffers","current"),{...value,hostAccountId:N}));
    assert.equal((await assertSucceeds(getDoc(doc(db[N],"rivalries",rivalryId,"sessionOffers","current")))).data().sessionId,sessionId,"O3 Nik reads the offer");

    // O4 / O5 the connected shared state: publish (state + idempotency receipt), then the same publish again (replay).
    const profiles={playerOne:bind[D].profileId,playerTwo:bind[N].profileId};
    const publish=()=>Connected.publishSharedState({...base(D),deviceId:ident[D].deviceId,binding:bind[D],rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:"r94-other-saves-publish",saveRuntime:saveRuntime(bind[D],profiles),nowEpochMs:tick()});
    const first=await check("O4","connected shared state publish (state/authoritative + idempotency receipt)",publish());
    assert.equal(first.ok,true,JSON.stringify(first));assert.equal(first.status,"accepted");
    const again=await check("O5","the same publish again is a replay, nothing new written",publish());
    assert.equal(again.ok,true,JSON.stringify(again));assert.equal(again.status,"replayed");

    assert.equal(step,5);
    console.log(`PASS R94-06 other saves emulator: ${step} checks (device register and revoke, session offer, connected shared state publish and replay) on the composed production Rules.`);
  }finally{
    try{await env.clearFirestore();}catch(_e){}
    await env.cleanup();
  }
})().catch(e=>{process.stderr.write(`${e&&e.stack?e.stack:e}\n`);process.exit(1);});
