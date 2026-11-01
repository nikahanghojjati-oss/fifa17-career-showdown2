"use strict";
// Fable job 2 F2-12: billed reads of the roulette's history fetch for a fresh browser in season 10 (nine earlier seasons kept
// nowhere on this phone), on the composed production Rules, BEFORE (one full Transfer Challenge provider read per season: the
// prerequisite transaction) and AFTER (provider.readRouletteSeason: plain gets of both role documents and the spin record).
// Billed = documents read + the Rules lookups each read request evaluates (tests/browser/support/billed-meter.cjs, the same
// derivation the app's reads counter uses). Both paths must return the same verdicts.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-roulette-reads \
//        "node tests/firebase/r87-roulette-history-reads-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
global.window=globalThis;
require("../../data/transferOptions.js");
const provider=require("../../js/sparkSharedTransferChallenge.js");
const billed=require("../browser/support/billed-meter.cjs");

const ROOT=path.resolve(__dirname,"../..");
const RULES=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
const A="acct_reads_daniel",B="acct_reads_nik";
const R=`pair_${crypto.randomBytes(32).toString("hex")}`,S=`session_${crypto.randomBytes(32).toString("hex")}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const leagues=global.FIFA17_TRANSFER_LEAGUES.map(x=>x.id),nations=global.FIFA17_TRANSFER_NATIONALITIES.map(x=>x.id);
const SEASONS=10;

(async()=>{
  const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT||"demo-cms-roulette-reads",firestore:{rules:RULES}});
  try{
    firestoreSdk.setLogLevel("silent");
    const now=Date.now(),ts=ms=>Timestamp.fromMillis(ms);
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore(),put=(parts,value)=>setDoc(doc(db,...parts),value);
      for(const [id,dev] of [[A,DA],[B,DB]]){await put(["accounts",id],{objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}});await put(["accounts",id,"devices",dev],{objectType:"device",objectId:dev,lifecycleState:"live",data:{deviceId:dev,state:"active"}});}
      await put(["rivalries",R],{objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[{slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"1".repeat(24)}`,entitlementState:"active"},{slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"2".repeat(24)}`,entitlementState:"active"}]}});
      await put(["rivalries",R,"sessions",S],{schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:ts(now-1000),updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt:ts(now-60000),expiresAt:ts(now+4*3600000),lastActivityAt:ts(now-1000),revokedAt:null},tombstone:null});
      await put(["rivalries",R,"sharedSetup","authoritative"],{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",leagueId:"bundesliga",clubs:{playerOne:"Liverpool",playerTwo:"Arsenal"},totalSeasons:SEASONS,confirmedRoles:["playerOne","playerTwo"]});
      await put(["rivalries",R,"careerStart","authoritative"],{schemaVersion:1,objectType:"sharedCareerStart",rivalryId:R,setupRevision:6,totalSeasons:SEASONS,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]});
      for(let season=1;season<SEASONS;season+=1){
        const t="season_"+season,ops=Array.from({length:7},(_,i)=>`transfer_op_${(season*10+i).toString(16).padStart(32,"0")}`);
        await put(["rivalries",R,"transferChallenges",t],{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:R,seasonNumber:season,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"COMPLETED",revision:7,startedAt:ts(now-900000),endedAt:ts(now-600000),endRequestedRoles:["playerOne","playerTwo"],guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerOne","playerTwo"],operationIds:ops,operationTypes:["start-window","request-end-window","request-end-window","lock-guesses","lock-guesses","lock-signings","lock-signings"],operationHashes:ops.map(()=>`sha256:${"a".repeat(64)}`),baseRevisions:[0,1,2,3,4,5,6],actorRoles:["playerOne","playerOne","playerTwo","playerOne","playerTwo","playerOne","playerTwo"],activeSessionId:S,updatedAt:ts(now-500000),updatedByDeviceId:DA});
        for(const [role,dev] of [["playerOne",DA],["playerTwo",DB]])
          await put(["rivalries",R,"transferChallenges",t,"roles",role],{schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:R,seasonNumber:season,managerRole:role,guesses:[{slot:1,type:"league",valueId:leagues[season%5]}],signings:[{slot:1,name:`${role} signing ${season}`,leagueId:leagues[season%5],nationalityId:nations[1],overall:70,position:"CM"},{slot:2,name:`${role} keeper ${season}`,leagueId:leagues[6],nationalityId:nations[2],overall:72,position:"GK"}],guessLockedAt:ts(now-590000),signingLockedAt:ts(now-580000),activeSessionId:S,updatedAt:ts(now-580000),updatedByDeviceId:dev,guessSalt:"a".repeat(64),signingSalt:"b".repeat(64)});
        await put(["rivalries",R,"transferChallenges",t,"roulette","spins"],{schemaVersion:1,objectType:"sharedTransferRouletteSpins",rivalryId:R,seasonNumber:season,spins:{playerOne:{fired:false,hitName:null,hitNumber:null,hitSlot:null,hitSignedSeason:null,version:"rr4.1.0d0adc9d"},playerTwo:true}});
      }
    });
    // A metered SDK for Daniel's fresh browser: every document read request, transaction or plain get, is logged by path.
    const model=billed.loadModel();
    const log=[];
    const priced=()=>{let docs=0,rules=0;for(const p of log){docs+=1;const template=model.templateOf(p);assert.ok(template,`priced path ${p}`);rules+=model.readDocs(template,true).length;}return {docs,rules,billed:docs+rules};};
    const db=env.authenticatedContext(A).firestore();
    const sdk={Timestamp,doc,serverTimestamp:firestoreSdk.serverTimestamp,
      getDoc:ref=>{log.push(ref.path);return getDoc(ref);},
      runTransaction:(database,fn)=>firestoreSdk.runTransaction(database,tx=>fn({get:ref=>{log.push(ref.path);return tx.get(ref);},set:(...args)=>tx.set(...args)}))};
    const base={user:{uid:A},firestore:db,firebaseSdk:sdk,rivalryId:R,sessionId:S,deviceId:DA,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()};

    log.length=0;const before=[];
    for(let k=1;k<SEASONS;k+=1){const result=await provider.read({...base,seasonNumber:k});assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.state.phase,"COMPLETED");before.push(result.verdicts);}
    const B4=priced();
    log.length=0;const after=[];
    const results=await Promise.all(Array.from({length:SEASONS-1},(_,i)=>provider.readRouletteSeason({...base,seasonNumber:i+1,managerRole:"playerOne"})));
    for(const result of results){assert.equal(result.ok,true,JSON.stringify(result));after.push(result.verdicts);assert.deepEqual(JSON.parse(JSON.stringify(result.hits)).playerTwo,null);assert.equal(result.hits.playerOne.fired,false);}
    const AF=priced();
    assert.deepEqual(JSON.parse(JSON.stringify(after)),JSON.parse(JSON.stringify(before)),"both paths give the same verdicts");
    // Verdicts already kept on this phone (it saw each season COMPLETED) but not the saved shots: the record only.
    log.length=0;
    for(let k=1;k<SEASONS;k+=1){const result=await provider.readRouletteSeason({...base,seasonNumber:k,managerRole:"playerOne",verdicts:false});assert.equal(result.ok,true);}
    const HITS=priced();
    console.log(`BEFORE fresh browser, season 10 history (9 seasons, provider.read each): ${B4.docs} documents + ${B4.rules} Rules lookups = ${B4.billed} billed (+ a forced ID-token refresh)`);
    console.log(`AFTER  fresh browser, season 10 history (9 seasons, readRouletteSeason, in parallel): ${AF.docs} documents + ${AF.rules} Rules lookups = ${AF.billed} billed (verdicts and saved shots)`);
    console.log(`AFTER  verdicts kept, saved shots missing: ${HITS.docs} documents + ${HITS.rules} Rules lookups = ${HITS.billed} billed`);
    assert.ok(AF.billed<B4.billed/2,"the history fetch costs less than half of before");
    console.log("PASS F2-12 roulette history reads on the composed production Rules");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
