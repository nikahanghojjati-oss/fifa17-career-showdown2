"use strict";
// r87 Prime Pack (Nik 2026-10-31/11-01) in the composed production Rules (firestore.spark.generated.rules).
// One shared round record per season, rivalries/{rid}/primePackRounds/season_N, written only by the two managers through
// js/iconGuessStep.js (the real step code runs here against the emulator):
//   1. Arrivals: each manager writes only his own arrival, at server time, once; the other's facts never move.
//   2. Guesses: only after both arrived, from 2 s to 43 s after the later arrival (four stages of 9.5 s after a 3 s count-in),
//      one chip at a time, two at most; a manager can name only himself the winner; once there is a winner nothing changes.
//   3. The points (Nik 2026-11-01): a Season Result with primePack N (1 to 4) is accepted only from the manager the round names,
//      and only when N is the stage of the winning write's server time (4 before 12.5 s after the later arrival, 3 before 22 s,
//      2 before 31.5 s, then 1). The phone's clock plays no part.
//   4. No list, no delete, reads only for the two managers.
// The score (up to +4, season maximum 15) and the 10-season expression budget are in tests/firebase/europa-league-rules-emulator.cjs.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/prime-pack-rules-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-prime-pack-rules";
let projectSeq=0;
const nextProject=label=>`${PROJECT}-${label}-${projectSeq++}`;
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const hex64=seed=>crypto.createHash("sha256").update(String(seed)).digest("hex");

// Every expected refusal must be an ordinary Rules denial, never the evaluation limit.
async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
async function assertAccepted(promise,label){
  try{await promise;}
  catch(error){throw new assert.AssertionError({message:`${label}: must be accepted, got ${error.code}: ${String(error.message||"").trim().split("\n")[0]}`});}
}

// ---------------------------------------------------------------------------------------------------------------
// 1 + 2. Season Results and Season Commit (rivalry built by the real providers, as the Results diagnostic does).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_pack_rules_a",B="acct_pack_rules_b";
const RID=`pair_${"7".repeat(64)}`;
const SID=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
// The Results provider validates the 7-key result it is given (the EL key is the protocol PR). To test the Rules alone,
// this SDK swaps the result inside the private role document the provider writes, right at transaction.set.
function injectingSdk(result){
  return {Timestamp,doc,serverTimestamp,runTransaction:(db,callback)=>firestoreSdk.runTransaction(db,transaction=>callback(new Proxy(transaction,{
    get(target,property){
      if(property==="set")return (ref,data,...rest)=>{
        if(/\/seasonResults\/season_[0-9]+\/roles\/(playerOne|playerTwo)$/.test(ref.path))data={...data,result:JSON.parse(JSON.stringify(result))};
        return target.set(ref,data,...rest);
      };
      const value=target[property];
      return typeof value==="function"?value.bind(target):value;
    }
  })))};
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(){return {objectType:"rivalry",objectId:RID,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
]}};}
function sessionDoc(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:SID,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:RID,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function base(db,uid,deviceId,now,sdk=plainSdk()){return {user:{uid},firestore:db,firebaseSdk:sdk,rivalryId:RID,sessionId:SID,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
const SEVEN={leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};

async function prepareJourney(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",RID),rivalryDoc());await setDoc(doc(db,"rivalries",RID,"sessions",SID),sessionDoc(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);
  const must=(label,value)=>{if(!value||!value.ok)throw new Error(`${label} failed: ${JSON.stringify(value)}`);};
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:3}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
  must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
  must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
  must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
  must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
  must("transfer start",await startAfterSpins({...a(100),seasonNumber:1,operationId:op("transfer_op_",11),baseRevision:0},{...b(100),seasonNumber:1}));
  must("transfer end A",await Transfer.requestEndWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",12),baseRevision:1}));
  must("transfer end B",await Transfer.requestEndWindow({...b(300),seasonNumber:1,operationId:op("transfer_op_",13),baseRevision:2}));
  must("guess A",await Transfer.lockGuesses({...a(400),seasonNumber:1,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
  must("guess B",await Transfer.lockGuesses({...b(500),seasonNumber:1,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
  must("signing A",await Transfer.lockSignings({...a(600),seasonNumber:1,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel Pack",leagueId:"spain-primera-division",nationalityId:"england"}]}));
  must("signing B",await Transfer.lockSignings({...b(700),seasonNumber:1,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik Pack",leagueId:"england-premier-league",nationalityId:"brazil"}]}));
  return {dbA,dbB};
}

const {updateDoc,deleteDoc,getDocs,collection}=firestoreSdk;
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const io=(db,deviceId)=>({firestore:db,sdk:plainSdk(),rivalryId:RID,sessionId:SID,deviceId,now:()=>Date.now()});
const ctx=(role,season=1)=>({rivalryId:RID,managerRole:role,season,confirmedAtMs:Date.now()});
const stamp=deviceId=>({activeSessionId:SID,updatedByDeviceId:deviceId,updatedAt:serverTimestamp()});

(async()=>{
  const checks=[];
  const env=await initializeTestEnvironment({projectId:nextProject("round"),firestore:{rules:RULES}});
  try{
    const now=Date.now(),{dbA,dbB}=await prepareJourney(env,now);
    const roundRef=(db,season=1)=>doc(db,"rivalries",RID,"primePackRounds",`season_${season}`);
    const read=async(season=1)=>{let data;await env.withSecurityRulesDisabled(async context=>{data=(await getDoc(roundRef(context.firestore(),season))).data();});return data;};
    assert.equal(Step.applies(ctx("playerOne")),true,"a Showdown confirmed now plays Prime Pack");
    assert.equal(Step.applies({...ctx("playerOne"),confirmedAtMs:Date.parse("2026-10-01T00:00:00Z")}),false,"a Showdown confirmed before r87 does not");

    // 1. Arrivals.
    await assertPlainDenial(setDoc(roundRef(dbB),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DB)}),"Nik creates the round with Daniel's arrival");
    checks.push("a manager cannot create the round with the other manager's arrival");
    await assertPlainDenial(setDoc(roundRef(dbA),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:Timestamp.fromMillis(Date.now()-60_000),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DA)}),"an arrival time from the phone");
    checks.push("an arrival is the server's time, never the phone's");
    await assertPlainDenial(setDoc(roundRef(dbA),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:"playerOne",revision:1,...stamp(DA)}),"a round created with a winner");
    checks.push("a round cannot be created with a winner");
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne")),"created");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"arrived.playerOne":serverTimestamp(),revision:2,...stamp(DA)}),"Daniel arrives a second time");
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne")),"already","the step never moves an arrival");
    checks.push("Daniel's arrival (the step) is accepted once; a second arrival never moves the start");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"arrived.playerTwo":serverTimestamp(),revision:2,...stamp(DA)}),"Daniel writes Nik's arrival");
    checks.push("a manager cannot write the other manager's arrival");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":1,revision:2,...stamp(DA)}),"a guess before both arrived");
    checks.push("no guess before both managers are on the screen");
    assert.equal(await Step.arrive(io(dbB,DB),ctx("playerTwo")),"arrived");
    const arrivedDoc=await read();
    assert.ok(arrivedDoc.arrived.playerOne&&arrivedDoc.arrived.playerTwo&&arrivedDoc.revision===2);
    checks.push("Nik's arrival (the step) is accepted; both arrivals are server times");

    // 2. Guesses.
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":1,revision:3,...stamp(DA)}),"a guess within 2 s of the later arrival");
    checks.push("a guess is refused before the round can have started (later arrival + 2 s)");
    await wait(3200);// past the 3 s lead: the step itself refuses a guess before the first beat
    const wrong=await Step.applyGuess(io(dbA,DA),ctx("playerOne"),false);
    assert.equal(wrong.ok,true,`Daniel's wrong guess: ${JSON.stringify(wrong)}`);
    let current=await read();assert.deepEqual(current.chipsUsed,{playerOne:1,playerTwo:0});assert.equal(current.namedBy,null);
    checks.push("a wrong guess (the step) uses one chip and stores no name");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerOne":2,revision:4,...stamp(DB)}),"Nik spends Daniel's chip");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":1,namedBy:"playerOne",revision:4,...stamp(DB)}),"Nik names Daniel the winner");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":2,revision:4,...stamp(DB)}),"Nik spends two chips at once");
    await assertPlainDenial(updateDoc(roundRef(dbB),{namedBy:"playerTwo",revision:4,...stamp(DB)}),"Nik wins without a guess");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":1,revision:3,...stamp(DB)}),"a guess that skips the revision");
    checks.push("a manager cannot spend the other's chip, name the other the winner, spend two chips at once, win without a guess or skip the revision");
    const right=await Step.applyGuess(io(dbB,DB),ctx("playerTwo"),true);
    assert.equal(right.ok,true,`Nik's right guess: ${JSON.stringify(right)}`);
    current=await read();assert.equal(current.namedBy,"playerTwo");assert.deepEqual(current.chipsUsed,{playerOne:1,playerTwo:1});
    checks.push("the first right guess (the step) wins the round");
    const late=await Step.applyGuess(io(dbA,DA),ctx("playerOne"),true);
    assert.equal(late.ok,false);assert.equal(late.reason,"ROUND_OVER");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":2,namedBy:"playerOne",revision:5,...stamp(DA)}),"a right guess after the winner");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":2,revision:5,...stamp(DB)}),"the winner guesses again");
    checks.push("once there is a winner nothing changes: a later right guess loses, and the winner cannot write again");
    const record=Step.record(current,1);
    assert.equal(record.winner.role,"playerTwo");assert.equal(record.winner.beat,0,"named in stage 1");
    checks.push("the stored round reads back as the round logic's record (winner, stage)");

    // A round whose later arrival was 100 s ago: every guess is too late.
    await env.withSecurityRulesDisabled(async context=>{
      const old=Timestamp.fromMillis(Date.now()-100_000);
      await setDoc(roundRef(context.firestore(),2),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:2,arrived:{playerOne:old,playerTwo:old},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:2,activeSessionId:SID,updatedByDeviceId:DA,updatedAt:old});
    });
    await assertPlainDenial(updateDoc(roundRef(dbA,2),{"chipsUsed.playerOne":1,namedBy:"playerOne",revision:3,...stamp(DA)}),"a right guess 100 s after the later arrival");
    await env.withSecurityRulesDisabled(async context=>{
      const old=Timestamp.fromMillis(Date.now()-50_000);
      await setDoc(roundRef(context.firestore(),2),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:2,arrived:{playerOne:old,playerTwo:old},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:2,activeSessionId:SID,updatedByDeviceId:DA,updatedAt:old});
    });
    await assertPlainDenial(updateDoc(roundRef(dbA,2),{"chipsUsed.playerOne":1,revision:3,...stamp(DA)}),"a guess 50 s after the later arrival, after stage 4 closed");
    checks.push("a guess more than 43 s after the later arrival is refused (stage 4 closes at 41 s): no guessing during the full reveal");
    await assertPlainDenial(setDoc(roundRef(dbA,"x"),{seasonNumber:1}),"a round outside season_N");
    await assertPlainDenial(setDoc(roundRef(dbA,3),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:4,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DA)}),"a round whose season does not match its id");
    checks.push("the round's id and season must match");

    // 3. The points.
    const publish=async(db,uid,deviceId,result,n,baseRevision,t)=>Results.publishResult({...base(db,uid,deviceId,now+t),seasonNumber:1,operationId:op("season_result_op_",n),baseRevision,result});
    const daniel=await publish(dbA,A,DA,{...SEVEN,primePack:4},31,0,900);
    assert.equal(daniel.ok,false,`Daniel claims the Prime Pack points Nik won: ${JSON.stringify(daniel)}`);assert.equal(daniel.code,"permission-denied");
    checks.push("a Season Result with Prime Pack points from the manager who did not win is refused");
    // The stage comes from the winning write's server time. Move that time through the four stages (Rules off) and claim
    // every other value: each is refused. The real round (stage 1) is put back before the real publish.
    const real=await read();
    const later=Math.max(real.arrived.playerOne.toMillis(),real.arrived.playerTwo.toMillis());
    let n=40;
    for(const [offset,points] of [[3_000,4],[12_400,4],[12_600,3],[21_900,3],[22_100,2],[31_400,2],[31_600,1],[40_000,1]]){
      await env.withSecurityRulesDisabled(async context=>{await setDoc(roundRef(context.firestore()),{...real,updatedAt:Timestamp.fromMillis(later+offset)});});
      for(const wrongPoints of [1,2,3,4].filter(v=>v!==points)){
        const claim=await publish(dbB,B,DB,{...SEVEN,leaguePosition:2,primePack:wrongPoints},n+=1,0,1000+n);
        assert.equal(claim.ok,false,`Nik claims ${wrongPoints} for a win ${offset} ms after the later arrival: ${JSON.stringify(claim)}`);
      }
      const page=Step.record({...real,updatedAt:Timestamp.fromMillis(later+offset)},1);
      assert.equal(Guess.points(page).playerTwo,points,`the step gives ${points} for ${offset} ms, as the Rules do`);
    }
    await env.withSecurityRulesDisabled(async context=>{await setDoc(roundRef(context.firestore()),real);});
    checks.push("the Rules accept only the stage's points by the winning write's server time (4, 3, 2, 1 across 12.5 s, 22 s and 31.5 s) and the step agrees at every edge");
    assert.equal(await Step.pointsFor({firestore:dbA,sdk:plainSdk(),rivalryId:RID},ctx("playerOne")),0);
    assert.equal(await Step.pointsFor({firestore:dbB,sdk:plainSdk(),rivalryId:RID},ctx("playerTwo")),4);
    checks.push("the step reads the points back for each manager (Daniel 0, Nik 4 for a stage 1 win)");
    const danielPlain=await publish(dbA,A,DA,SEVEN,32,0,1000);
    assert.equal(danielPlain.ok,true,`Daniel's result without the key: ${JSON.stringify(danielPlain)}`);
    const nik=await publish(dbB,B,DB,{...SEVEN,leaguePosition:2,primePack:4},33,1,1100);
    assert.equal(nik.ok,true,`Nik's result with the Prime Pack points: ${JSON.stringify(nik)}`);
    let stored;await env.withSecurityRulesDisabled(async context=>{stored=(await getDoc(doc(context.firestore(),"rivalries",RID,"seasonResults","season_1","roles","playerTwo"))).data();});
    assert.equal(stored.result.primePack,4);
    checks.push("the winner's Season Result with primePack 4 is accepted and stored as the integer 4; the other's plain result is accepted");

    // 4. Reads, lists, deletes.
    await assertAccepted(getDoc(roundRef(dbA)),"Daniel reads the round");
    await assertPlainDenial(getDoc(roundRef(env.authenticatedContext("acct_stranger").firestore())),"a stranger reads the round");
    await assertPlainDenial(getDocs(collection(dbA,"rivalries",RID,"primePackRounds")),"listing the rounds");
    await assertPlainDenial(deleteDoc(roundRef(dbB)),"deleting the round");
    checks.push("only the two managers read the round; no list, no delete");
  }finally{await env.cleanup();}
  for(const check of checks)process.stdout.write(`ok ${check}\n`);
  process.stdout.write(`PASS r87 Prime Pack Rules emulator: ${checks.length} checks.\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});
