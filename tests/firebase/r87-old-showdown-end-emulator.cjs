"use strict";
// r87 (2.0.0) scoring change (Nik 2026-11-01 18:32 UTC): "you would be able to safely delete the game that's midway in our
// account ... we just press the delete showdown". A Showdown saved mid-game BEFORE 2.0.0 (no Prime Pack, no roulette, 11-point
// seasons) must still end cleanly on the 2.0.0 code for BOTH managers, and a new 2.0.0 Showdown must start after it.
//
// tests/fixtures/saved-showdowns-in-progress/r79-3season-inprogress.json is the real database content of a 3-season Showdown played
// on an earlier release (1.9.3-r79), stopped after season 1 was committed, still live. For each manager in turn (Daniel, then
// a fresh copy where Nik ends it), with the COMPOSED production Rules of this build:
//   E1  END SHOWDOWN (Settings) = PersistentPair.abandonCurrentShowdown with the seasons-played count: closes the rivalry with
//       the ended-early mark, one write;
//   E2  the other manager: his END answers "already-closed" (success, nothing written); both read it as abandoned (History:
//       Ended early); no more season writes are accepted;
//   E3  Daniel's next START + Nik's JOIN (the real provider pairing, sparkPrivatePairing create/redeem with the durable pair
//       witnesses) on a new rivalry: both pair links move to it, it is ACTIVE, and the old one stays closed and readable.
// Demo project only. Run: npm run -s test:r87-old-showdown-end
//   (npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-old-end "node tests/firebase/r87-old-showdown-end-emulator.cjs")

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const ROOT=path.resolve(__dirname,"../..");
const FIXTURE=path.join(ROOT,"tests/fixtures/saved-showdowns-in-progress/r79-3season-inprogress.json");
const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-r87-old-end";
const PAIR_MODULE=require.resolve("../../js/persistentNikDanielPair.js");
const Pairing=require("../../js/sparkPrivatePairing.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");

let checks=0;
function ok(id,label){checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}

function decodeValue(value){
  const kind=Object.keys(value)[0];
  switch(kind){
    case "nullValue":return null;
    case "booleanValue":return value.booleanValue;
    case "stringValue":return value.stringValue;
    case "integerValue":{const n=Number(value.integerValue);assert.ok(Number.isSafeInteger(n));return n;}
    case "doubleValue":return value.doubleValue;
    case "timestampValue":{const m=/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?Z$/.exec(value.timestampValue);assert.ok(m,value.timestampValue);return new Timestamp(Date.parse(`${m[1]}Z`)/1000,Number((m[2]||"").padEnd(9,"0")));}
    case "arrayValue":return (value.arrayValue.values||[]).map(decodeValue);
    case "mapValue":return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decodeValue(v)]));
    default:throw new Error(`fixture value type ${kind} is not supported`);
  }
}
const decodeDocument=fields=>decodeValue({mapValue:{fields}});
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp,getDoc};}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function buildComposedRules(){
  for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
    const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,encoding:"utf8"});
    assert.equal(built.status,0,`${script} failed: ${built.stderr}`);
  }
  return fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
}
// A fresh copy of the pair module (it keeps one page's state), wired to one manager's signed-in emulator account, as the
// browser runtime wires it on that manager's phone.
function pairFor({uid,deviceId,managerId,db}){
  delete require.cache[PAIR_MODULE];
  globalThis.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:db,firestoreSdk:sdk()})};
  globalThis.CareerModeSparkConnectedAccount={initialize:async()=>{},getState:()=>({connected:true,accountId:uid})};
  globalThis.CareerModeSparkPrivatePairing={initialize:async()=>{},getState:()=>({registered:true,deviceId})};
  globalThis.CareerModeOnlinePlayerIdentity={getState:()=>({managerId})};
  return require(PAIR_MODULE);
}

async function runFor(rules,fixture,ender){
  const R=fixture.rivalryId,byPath=new Map(fixture.documents.map(item=>[item.path,item]));
  const rivalry=decodeDocument(byPath.get(`rivalries/${R}`).fields);
  const slot=role=>rivalry.data.managerSlots.find(item=>item.slotId===role);
  const deviceOf=uid=>fixture.documents.find(item=>item.path.startsWith(`accounts/${uid}/devices/`));
  const managers={};
  for(const [role,managerId,label] of [["playerOne","daniel","Daniel"],["playerTwo","nik","Nik"]]){
    const s=slot(role),device=decodeDocument(deviceOf(s.accountId).fields).data;
    managers[managerId]={role,managerId,label,uid:s.accountId,deviceId:device.deviceId,installationId:device.installationId,registeredAtMs:device.registeredAt.toMillis(),saveId:s.saveId,profileId:s.profileId};
  }
  const [first,second]=ender==="daniel"?[managers.daniel,managers.nik]:[managers.nik,managers.daniel];
  const env=await initializeTestEnvironment({projectId:`${PROJECT_ID}-${ender}`,firestore:{rules}});
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const item of fixture.documents)await setDoc(doc(db,...item.path.split("/")),decodeDocument(item.fields));});
    for(const m of Object.values(managers))m.db=env.authenticatedContext(m.uid).firestore();
    const tag=`${first.label} ends`;

    // E1: END SHOWDOWN on the 2.0.0 code (Settings passes the accepted-season count: 1).
    const pairFirst=pairFor(first);
    const ended=await pairFirst.abandonCurrentShowdown({expectedRivalryId:R,expectedSaveId:first.saveId,seasonsPlayed:1,cryptoImpl:crypto.webcrypto});
    assert.equal(ended.ok,true,JSON.stringify(ended));assert.equal(ended.status,"closed",`${tag}: ${JSON.stringify(ended)}`);assert.equal(ended.managerRole,first.role);
    const root=(await assertSucceeds(getDoc(doc(first.db,"rivalries",R)))).data();
    assert.equal(root.data.connectionState,"closed",`${tag}: the old rivalry is closed`);
    assert.deepEqual(root.data.endedEarly,{seasonsPlayed:1},`${tag}: the ended-early mark says 1 season`);
    assert.equal(root.revision,rivalry.revision+1,`${tag}: one write`);
    assert.equal(Object.hasOwn(root.data,"terminalClose"),false,`${tag}: no Terminal Close witness (ended, not finished)`);
    ok(`${ender}.E1`,`${tag} the pre-2.0.0 mid-season Showdown on 2.0.0: closed with Ended early (1 season), one write`);

    // E2: the other phone. Its END (or a retry) answers already-closed; both managers read it as abandoned; no more writes.
    const pairSecond=pairFor(second);
    const again=await pairSecond.abandonCurrentShowdown({expectedRivalryId:R,expectedSaveId:second.saveId,seasonsPlayed:1,cryptoImpl:crypto.webcrypto});
    assert.equal(again.ok,true,JSON.stringify(again));assert.equal(again.status,"already-closed",`${second.label}: ${JSON.stringify(again)}`);
    assert.equal((await assertSucceeds(getDoc(doc(second.db,"rivalries",R)))).data().revision,root.revision,`${second.label}'s END wrote nothing`);
    for(const m of [first,second]){
      const read=await Reader.readCompletedShowdown({firestore:m.db,firebaseSdk:sdk(),user:{uid:m.uid},rivalryId:R,cryptoImpl:crypto.webcrypto});
      assert.equal(read.status,"abandoned",`${m.label} reads it as ended early: ${JSON.stringify(read).slice(0,300)}`);
    }
    const sessionPath=fixture.documents.find(item=>item.path.startsWith(`rivalries/${R}/sessions/`)).path,S=sessionPath.split("/").pop();
    const denied=await Results.publishResult({user:{uid:second.uid},firestore:second.db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId:second.deviceId,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto,seasonNumber:2,operationId:op("season_result_op_",901),baseRevision:0,result:{leaguePosition:1,leaguePoints:90,leagueGoals:90,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}});
    assert.equal(denied.ok,false,`${second.label}: no season 2 result after the end`);
    ok(`${ender}.E2`,`${second.label}'s END answers already-closed (no write); both managers read it as Ended early; season writes refused`);

    // E3: Daniel's next START and Nik's JOIN (real provider pairing + durable pair witnesses) on a new rivalry.
    const R2=`pair_${crypto.randomBytes(32).toString("hex")}`,nowMs=Date.now();
    const D=managers.daniel,N=managers.nik;
    const identity=m=>({schemaVersion:1,installationId:m.installationId,deviceId:m.deviceId,createdAtEpochMs:m.registeredAtMs});
    const binding=m=>({saveId:`save_${crypto.randomBytes(12).toString("hex")}`,profileId:m.profileId,managerRole:m.role,displayLabel:m.label});
    const pairD=pairFor(D);
    const created=await Pairing.createPairing({user:{uid:D.uid},firestore:D.db,firebaseSdk:sdk(),identity:identity(D),binding:binding(D),capability:R2,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:pairD.createDurableCreationWitness({services:{firestoreSdk:sdk(),firestore:D.db},accountId:D.uid,deviceId:D.deviceId},"playerOne",pairD.managerByRole.playerOne)});
    assert.equal(created.ok,true,`Daniel's next START: ${JSON.stringify(created)}`);
    const pairN=pairFor(N);
    const redeemed=await Pairing.redeemPairing({user:{uid:N.uid},firestore:N.db,firebaseSdk:sdk(),identity:identity(N),binding:binding(N),capability:R2,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:pairN.createDurableRedemptionWitness({services:{firestoreSdk:sdk(),firestore:N.db},accountId:N.uid,deviceId:N.deviceId},"playerTwo",pairN.managerByRole.playerTwo,R2)});
    assert.equal(redeemed.ok,true,`Nik's JOIN: ${JSON.stringify(redeemed)}`);
    for(const m of [D,N]){
      const link=(await assertSucceeds(getDoc(doc(m.db,"accounts",m.uid,"pairLinks","current")))).data();
      assert.equal(link.data.rivalryId,R2,`${m.label}'s pair link moves to the new Showdown`);
      const fresh=(await assertSucceeds(getDoc(doc(m.db,"rivalries",R2)))).data();
      assert.equal(fresh.data.connectionState,"active",`${m.label} sees the new Showdown ACTIVE`);
      const old=(await assertSucceeds(getDoc(doc(m.db,"rivalries",R)))).data();
      assert.equal(old.data.connectionState,"closed",`${m.label}: the old Showdown stays closed`);
      assert.equal(old.revision,root.revision,`${m.label}: the old Showdown was not rewritten`);
    }
    await assertFails(getDoc(doc(env.authenticatedContext("acct_stranger").firestore(),"rivalries",R2)),"a stranger cannot read the new Showdown");
    ok(`${ender}.E3`,"Daniel's next START + Nik's JOIN: a new ACTIVE Showdown, both pair links on it, the old one closed and untouched");
  }finally{
    await env.cleanup();
  }
}

async function main(){
  const rules=buildComposedRules();
  const fixture=JSON.parse(fs.readFileSync(FIXTURE,"utf8"));
  assert.equal(fixture.release,"1.9.3-r79");
  const rivalry=decodeDocument(fixture.documents.find(item=>item.path===`rivalries/${fixture.rivalryId}`).fields);
  assert.equal(rivalry.data.connectionState,"active","the saved Showdown is still live");
  assert.ok(fixture.documents.some(item=>item.path.endsWith("/seasonCommits/season_1"))&&!fixture.documents.some(item=>/season_2/.test(item.path)),"season 1 committed, season 2 not started (mid-Showdown)");
  assert.ok(!JSON.stringify(fixture).includes("primePack"),"saved before Prime Pack");
  ok("F","fixture: a pre-2.0.0 3-season Showdown saved mid-game (season 1 of 3), still live, no Prime Pack");
  await runFor(rules,fixture,"daniel");
  await runFor(rules,fixture,"nik");
  assert.equal(checks,7);
  process.stdout.write(`r87 old Showdown END + new START: ${checks} checks passed\n`);
}

main().catch(error=>{console.error(error);process.exit(1);});
