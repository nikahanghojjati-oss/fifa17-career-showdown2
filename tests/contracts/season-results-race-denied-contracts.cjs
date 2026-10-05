"use strict";
// Season Results race: when both managers publish a Season Result at the same moment, the Rules reject the loser's
// write against the already-updated public document (permission-denied). The provider must re-read the public
// document and, only if its revision moved past the caller's baseRevision, answer the retryable
// SEASON_RESULTS_STALE_BASE_REVISION. The production SDK bundle (js/productionFirebaseRuntime.js firestoreSdk) and the
// emulator journey expose only Timestamp/serverTimestamp/doc/runTransaction, so the re-read must work without getDoc.
//   R1. Production SDK shape, write denied, re-read shows a newer revision -> STALE (one read, no write retry).
//   R2. Production SDK shape, write denied, re-read shows the same revision -> stays permission-denied (bounded reads).
//   R3. Every denial spelling (permission-denied, firestore/permission-denied, permission_denied) is handled.
//   R4. An unreadable public document (stranger) stays permission-denied after exactly one read.
//   R5. The re-read touches only the public seasonResults document, never a role's private result.
//   R6. A non-denial failure is surfaced unchanged, without a re-read.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const Provider=require(path.join(ROOT,"js/sparkSharedSeasonResults.js"));
const RIVALRY=`pair_${"3".repeat(64)}`,SESSION=`session_${"4".repeat(64)}`,DEVICE=`device_${"6".repeat(32)}`;
const PUBLIC_PATH=`rivalries/${RIVALRY}/seasonResults/season_2`;
const op=n=>`season_result_op_${Number(n).toString(16).padStart(32,"0")}`;
const snapshot=value=>({exists:()=>value!==null&&value!==undefined,data:()=>value});

// Same keys as the production firestoreSdk bundle: no getDoc.
function productionShapedSdk({reads,denialCode="permission-denied",readThrows=false,writeError=null}){
  const counts={run:0,reads:0},paths=[];
  const sdk={
    Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    serverTimestamp:()=>({toMillis:()=>2_000_000}),
    doc:(_db,...parts)=>parts.join("/"),
    runTransaction:async(_db,callback)=>{
      counts.run+=1;
      if(counts.run===1)return 18; // league projection already present
      if(counts.run===2)throw writeError||{code:denialCode}; // the loser's publish write
      const transaction={get:async ref=>{paths.push(ref);counts.reads+=1;if(readThrows)throw {code:"permission-denied"};return snapshot(reads[Math.min(counts.reads-1,reads.length-1)]);},set:()=>{throw new Error("a re-read must never write");}};
      return callback(transaction);
    }
  };
  return {sdk,counts,paths};
}
const options=sdk=>({user:{uid:"manager_one"},firestore:{},firebaseSdk:sdk,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,seasonNumber:2,operationId:op(21),baseRevision:0,result:{leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false},cryptoImpl:webcrypto,nowEpochMs:2_000_000});

function r0ProductionShape(){
  const runtime=fs.readFileSync(path.join(ROOT,"js/productionFirebaseRuntime.js"),"utf8");
  const match=runtime.match(/firestoreSdk:Object\.freeze\(\{([^}]*)\}\)/);
  assert.ok(match,"R0 the production firestoreSdk bundle is found");
  const keys=match[1].split(",").map(part=>part.split(":")[0].trim()).sort();
  assert.deepEqual(keys,Object.keys(productionShapedSdk({reads:[]}).sdk).sort(),"R0 the fake SDK has exactly the production bundle's keys");
  console.log("ok R0 the fake SDK matches the production firestoreSdk bundle (no getDoc)");
}

async function r1NewerRevisionIsStale(){
  const fake=productionShapedSdk({reads:[{revision:1,operationIds:[op(22)]}]});
  const out=await Provider.publishResult(options(fake.sdk));
  assert.deepEqual(out,{ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"},"R1 the loser gets the retryable STALE code");
  assert.deepEqual(fake.counts,{run:3,reads:1},"R1 one fresh read, the denied write is not retried");
  console.log("ok R1 denied write + newer revision on re-read -> SEASON_RESULTS_STALE_BASE_REVISION");
}

async function r2SameRevisionStaysDenied(){
  const fake=productionShapedSdk({reads:[{revision:0,operationIds:[]}]});
  const out=await Provider.publishResult(options(fake.sdk));
  assert.deepEqual(out,{ok:false,code:"permission-denied"},"R2 a denial with no newer revision is still surfaced");
  assert.deepEqual(fake.counts,{run:5,reads:3},"R2 the re-reads are bounded to three");
  const missing=productionShapedSdk({reads:[null]});
  assert.deepEqual(await Provider.publishResult(options(missing.sdk)),{ok:false,code:"permission-denied"},"R2 a missing public document stays denied");
  console.log("ok R2 denied write + same revision on re-read -> stays permission-denied");
}

async function r3DenialSpellings(){
  for(const code of ["permission-denied","firestore/permission-denied","permission_denied"]){
    const fake=productionShapedSdk({reads:[{revision:1,operationIds:[op(22)]}],denialCode:code});
    assert.deepEqual(await Provider.publishResult(options(fake.sdk)),{ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"},`R3 ${code} maps to STALE after a newer read`);
  }
  console.log("ok R3 every permission-denied spelling is handled");
}

async function r4StrangerOneRead(){
  const fake=productionShapedSdk({reads:[],readThrows:true});
  assert.deepEqual(await Provider.publishResult(options(fake.sdk)),{ok:false,code:"permission-denied"},"R4 an unreadable document stays denied");
  assert.deepEqual(fake.counts,{run:3,reads:1},"R4 exactly one read when the document is unreadable");
  console.log("ok R4 an unreadable public document stays permission-denied after one read");
}

async function r5PublicOnly(){
  const fake=productionShapedSdk({reads:[{revision:0,operationIds:[]}]});
  await Provider.publishResult(options(fake.sdk));
  assert.ok(fake.paths.length>0);
  for(const ref of fake.paths)assert.equal(ref,PUBLIC_PATH,"R5 only the public seasonResults document is re-read");
  console.log("ok R5 the re-read never touches a role's private result");
}

async function r6OtherErrorsUnchanged(){
  const fake=productionShapedSdk({reads:[{revision:1,operationIds:[op(22)]}],writeError:{code:"unavailable"}});
  assert.deepEqual(await Provider.publishResult(options(fake.sdk)),{ok:false,code:"unavailable"},"R6 a non-denial error is surfaced unchanged");
  assert.deepEqual(fake.counts,{run:2,reads:0},"R6 no re-read for a non-denial error");
  console.log("ok R6 non-denial failures are not reinterpreted");
}

(async()=>{
  r0ProductionShape();
  await r1NewerRevisionIsStale();
  await r2SameRevisionStaysDenied();
  await r3DenialSpellings();
  await r4StrangerOneRead();
  await r5PublicOnly();
  await r6OtherErrorsUnchanged();
  console.log("PASS season results race-denied contracts: 7 checks (production SDK shape, newer revision -> STALE, same revision stays denied, denial spellings, stranger one read, public-only re-read, other errors unchanged).");
})().catch(error=>{console.error(error);process.exit(1);});
