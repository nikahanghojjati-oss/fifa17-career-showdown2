"use strict";

// R93-07 (hunt T2-1, live in 2.5.0): LOCK MY SIGNINGS was refused with "maximum of 1000 expressions" when two or more of the
// three signings were picked from the Transfer War name list (overall + position + playerId on each row). The screen said the
// session had expired. This meter proves the worst legal lock on the COMPOSED production Rules and measures its headroom:
//   - 3 picked signings, each with every optional key and an 80-character name, the last catalog ids;
//   - 1 or 3 guesses (both managers);
//   - the first locker (SIGNING_ENTRY stays) and the second locker (COMPLETED).
// Headroom is measured with the same calibrated padding as the Sacked and Europa League emulators: a chain of `true` terms is
// put in front of the private role-document validator on a padded copy of the Rules that is never deployed, and the largest
// pad that still passes is found by bisection. The 1,000-expression budget is per request (the public ledger update and the
// private role document of the same transaction count together), so where the pad sits does not change the total.

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const provider=require("../../js/sparkSharedTransferChallenge.js");
const leagueIds=global.FIFA17_TRANSFER_LEAGUES.map(item=>item.id);
const nationalityIds=global.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);

const PROJECT_ID="demo-cms-transfer-lock-budget";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
// The worst legal lock must leave at least this many of the 1,000 expressions unused (clear headroom for later rows or checks).
const MIN_HEADROOM=150;
const A="acct_lock_budget_a",B="acct_lock_budget_b";
const R=`pair_${"d".repeat(64)}`,S=`session_${"d".repeat(64)}`;
const DA=`device_${"c".repeat(32)}`,DB=`device_${"d".repeat(32)}`;
const PA=`profile_${"3".repeat(24)}`,PB=`profile_${"4".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const HASH=`sha256:${"a".repeat(64)}`;
const opId=n=>`transfer_op_${Number(n).toString(16).padStart(32,"0")}`;
let projectCounter=0;
const nextProject=label=>`${PROJECT_ID}-${label.toLowerCase()}-${++projectCounter}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp};}
function seedDocs(now){
  const createdAt=Timestamp.fromMillis(now-60_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000),lastActivityAt=Timestamp.fromMillis(now-1000);
  return [
    [["accounts",A],{objectType:"account",objectId:A,lifecycleState:"live",data:{status:"active"}}],
    [["accounts",B],{objectType:"account",objectId:B,lifecycleState:"live",data:{status:"active"}}],
    [["accounts",A,"devices",DA],{objectType:"device",objectId:DA,lifecycleState:"live",data:{deviceId:DA,state:"active"}}],
    [["accounts",B,"devices",DB],{objectType:"device",objectId:DB,lifecycleState:"live",data:{deviceId:DB,state:"active"}}],
    [["rivalries",R],{objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
      {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
      {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}]}}],
    [["rivalries",R,"sessions",S],{schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null}],
    [["rivalries",R,"sharedSetup","authoritative"],{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",leagueId:"bundesliga",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},totalSeasons:1,confirmedRoles:["playerOne","playerTwo"]}],
    [["rivalries",R,"careerStart","authoritative"],{schemaVersion:1,objectType:"sharedCareerStart",rivalryId:R,setupRevision:6,totalSeasons:1,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]}],
    [["rivalries",R,"transferChallenges","season_1"],{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:R,seasonNumber:1,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"GUESS_ENTRY",revision:3,startedAt:Timestamp.fromMillis(now-5*60*1000),endedAt:Timestamp.fromMillis(now-60*1000),endRequestedRoles:["playerOne","playerTwo"],guessLockedRoles:[],signingLockedRoles:[],operationIds:[opId(1),opId(2),opId(3)],operationTypes:["start-window","request-end-window","request-end-window"],operationHashes:[HASH,HASH,HASH],baseRevisions:[0,1,2],actorRoles:["playerOne","playerOne","playerTwo"],activeSessionId:S,updatedAt:Timestamp.fromMillis(now-60*1000),updatedByDeviceId:DA}]
  ];
}
const GUESSES={
  1:[{slot:1,type:"nationality",valueId:nationalityIds[nationalityIds.length-1]}],
  3:[{slot:1,type:"league",valueId:leagueIds[leagueIds.length-1]},{slot:2,type:"nationality",valueId:nationalityIds[nationalityIds.length-1]},{slot:3,type:"nationality",valueId:nationalityIds[nationalityIds.length-2]}]
};
// Three names picked from the list: every optional key, the longest name (80 characters, non-ASCII) and the last catalog ids.
const PICKED=[1,2,3].map(slot=>({slot,name:`${"Ø".repeat(79)}${slot}`,leagueId:leagueIds[leagueIds.length-slot],nationalityId:nationalityIds[nationalityIds.length-slot],overall:99,position:["CAM","LWB","ST"][slot-1],playerId:999990+slot}));

function padFunctions(n,prefix){
  const functions=[];let leaves=[];
  for(let left=n,i=0;left>0;left-=10,i++){const k=Math.min(10,left);functions.push(`    function ${prefix}L${i}() { return ${Array.from({length:k},()=>"true").join(" && ")}; }`);leaves.push(`${prefix}L${i}()`);}
  for(let depth=0;leaves.length>1;depth++){const next=[];for(let j=0;j<leaves.length;j+=10){const name=`${prefix}N${depth}x${j}`;functions.push(`    function ${name}() { return ${leaves.slice(j,j+10).join(" && ")}; }`);next.push(`${name}()`);}leaves=next;}
  return {functions:functions.join("\n"),call:leaves[0]||"true"};
}
// The private validator is parameterless once the localize build step has moved it into its match block; the needle takes
// either form. The pad functions go at the documents level (beside the catch-all deny), where every match block sees them.
const PAD_ENTRY=(RULES.match(/^ *function ssjrTransferPrivateUpdateValid\([^)]*\) \{\n(?: *let [^\n]*\n)* *return /m)||[""])[0];
const PAD_HOME="    match /{document=**} {";
function paddedRules(n){
  assert.ok(PAD_ENTRY,"the Transfer War private update validator must be found");
  assert.equal(RULES.split(PAD_ENTRY).length,2,"the Transfer War private update validator must exist exactly once");
  assert.equal(RULES.split(PAD_HOME).length,2,"the documents-level catch-all must exist exactly once");
  if(n===0)return RULES;
  const pad=padFunctions(n,"lockBudgetPad");
  return RULES.replace(PAD_HOME,`${pad.functions}\n${PAD_HOME}`).replace(PAD_ENTRY,`${PAD_ENTRY}${pad.call} && `);
}
async function largestPassing(attempt,high){
  let low=0;
  if(!await attempt(0))return -1;
  while(low<high){const mid=Math.ceil((low+high)/2);if(await attempt(mid))low=mid;else high=mid-1;}
  return low;
}
async function calibrationPad(){
  return largestPassing(async n=>{
    const pad=padFunctions(n,"calibrationPad");
    const rules=`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n${pad.functions}\n    match /budget/{id} { allow get: if ${pad.call}; }\n  }\n}\n`;
    const env=await initializeTestEnvironment({projectId:nextProject("calibrate"),firestore:{rules}});
    try{try{await getDoc(doc(env.unauthenticatedContext().firestore(),"budget","probe"));return true;}catch(error){if(!LIMIT.test(String(error.message)))throw error;return false;}}
    finally{await env.cleanup();}
  },1000);
}

function options(env,role){
  const uid=role==="playerOne"?A:B;
  return {user:{uid},firestore:env.authenticatedContext(uid).firestore(),firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId:role==="playerOne"?DA:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()};
}
const paths={pub:["rivalries",R,"transferChallenges","season_1"],playerOne:["rivalries",R,"transferChallenges","season_1","roles","playerOne"],playerTwo:["rivalries",R,"transferChallenges","season_1","roles","playerTwo"]};
async function seed(env,now,snapshot){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const [path,data] of seedDocs(now))await setDoc(doc(db,...path),data);
    if(snapshot)for(const key of Object.keys(paths))if(snapshot[key])await setDoc(doc(db,...paths[key]),snapshot[key]);
  });
}
async function read(env){
  let out={};
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const key of Object.keys(paths)){const snap=await getDoc(doc(db,...paths[key]));out[key]=snap.exists()?snap.data():null;}});
  return out;
}
async function mustLock(label,promise){
  const result=await promise;
  assert.equal(result.ok,true,`${label} must be accepted on the unpadded composed Rules: ${JSON.stringify(result)}`);
  return result;
}

// One scenario: both managers lock `guesses` guesses; `first` then locks 3 picked signings; for the second-locker scenario the
// other manager locks his 3 picked signings after that. The state just before the measured lock is captured on the plain Rules,
// then the measured lock is bisected on padded copies seeded with exactly that state.
async function scenario(guesses,first,measured,high){
  const second=first==="playerOne"?"playerTwo":"playerOne";
  const now=Date.now();
  const env=await initializeTestEnvironment({projectId:nextProject(`setup-${guesses}-${first}-${measured}`),firestore:{rules:RULES}});
  let before;
  try{
    await seed(env,now,null);
    await mustLock(`${first} ${guesses} guesses`,provider.lockGuesses({...options(env,first),operationId:opId(4),baseRevision:3,guesses:GUESSES[guesses]}));
    await mustLock(`${second} ${guesses} guesses`,provider.lockGuesses({...options(env,second),operationId:opId(5),baseRevision:4,guesses:GUESSES[guesses]}));
    if(measured==="second"){const firstLock=await provider.lockSignings({...options(env,first),operationId:opId(6),baseRevision:5,signings:PICKED});if(firstLock.ok!==true)return {guesses,first,measured,locker:second,pad:-1,note:"first locker refused"};}
    before=await read(env);
  }finally{await env.cleanup();}
  const locker=measured==="first"?first:second,n=measured==="first"?6:7,base=measured==="first"?5:6;
  const pad=await largestPassing(async padSize=>{
    const probe=await initializeTestEnvironment({projectId:nextProject(`pad-${guesses}-${first}-${measured}`),firestore:{rules:paddedRules(padSize)}});
    try{
      await seed(probe,now,before);
      const result=await provider.lockSignings({...options(probe,locker),operationId:opId(n),baseRevision:base,signings:PICKED});
      if(result.ok===true){
        if(padSize===0){const after=await read(probe);assert.equal(after.pub.phase,measured==="first"?"SIGNING_ENTRY":"COMPLETED");assert.deepEqual(after[locker].signings,PICKED);}
        return true;
      }
      if(result.code!=="permission-denied")throw new Error(`lock probe pad ${padSize}: ${JSON.stringify(result)}`);
      return false;
    }finally{await probe.cleanup();}
  },high);
  return {guesses,first,measured,locker,pad};
}

(async()=>{
  // The padded probes hit the limit on purpose, on padded copies of the Rules that are never deployed.
  firestoreSdk.setLogLevel("silent");
  const calibration=await calibrationPad();
  assert.ok(calibration>100,`calibration pad must be large (got ${calibration})`);
  const used=pad=>Math.round(1000*(1-(pad+1)/(calibration+1)));
  const step=Math.ceil(1000/(calibration+1));
  const rows=[];
  const quick=process.env.LOCK_BUDGET_QUICK==="1";
  for(const guesses of quick?[3]:[1,3])for(const first of quick?["playerOne"]:["playerOne","playerTwo"])for(const measured of quick?["second"]:["first","second"]){
    const row=await scenario(guesses,first,measured,calibration);rows.push(row);
    process.stdout.write(`TRANSFER_LOCK_EXPRESSION_BUDGET guesses=${guesses} order=${first}-first locker=${row.locker}(${measured}) pad=${row.pad} used~${row.pad<0?">1000":used(row.pad)} headroom~${row.pad<0?"<0":1000-used(row.pad)} (of 1000, +/-${step})\n`);
  }
  const failing=rows.filter(row=>row.pad<0);
  assert.equal(failing.length,0,`every worst-case three-picked-signing lock must pass the composed Rules: refused ${JSON.stringify(failing)}`);
  const worst=Math.max(...rows.map(row=>used(row.pad)));
  assert.ok(1000-worst>=MIN_HEADROOM,`the worst legal lock must leave at least ${MIN_HEADROOM} expressions of headroom (used ~${worst}/1000)`);
  process.stdout.write(`PASS R93-07 Transfer War lock budget emulator: ${rows.length} worst-case LOCK MY SIGNINGS writes (3 picked signings with overall, position, playerId and 80-character names; 1 or 3 guesses; either manager first; first and second locker) pass the composed Rules. Worst ~${worst}/1000 expressions (calibration ${calibration}), headroom ~${1000-worst}.\n`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
