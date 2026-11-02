"use strict";
// r87 Prime Pack, a whole 3-season Showdown in the Firestore emulator under the composed production Rules
// (firestore.spark.generated.rules). Both phones play Prime Pack every season; the real step code (js/iconGuessStep.js) writes
// the round, the real providers publish the private Season Results and commit the season (Commit + 2 acknowledgements).
//   Season 1: Nik (playerTwo) names the masked Icon in stage 1 (4 points); Daniel (playerOne) spent a wrong-guess chip.
//   Season 2: Daniel names it in stage 3 (2 points, a real wait of about 24 s after the later arrival); Nik spent a wrong chip.
//   Season 3: nobody names it; both spend wrong chips; nobody scores (no primePack key on either result).
// Proven: the Rules accept the real flow; refuse the loser claiming primePack; refuse the winner claiming a wrong point value;
// refuse both managers scoring in one season (result level and commit level); the committed season totals include the Prime
// Pack points and never exceed 15; the stored round never holds the Icon's name or id.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/prime-pack-three-season-emulator.cjs"
require("../support/release-time-started.cjs");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const Icons=require("../../data/icons.js");
const Names=require("../../js/iconNames.js");
const {score}=require("../support/career-fixture-helpers.cjs");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-prime-pack-three-season";
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const hex64=seed=>crypto.createHash("sha256").update(String(seed)).digest("hex");
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Every expected refusal must be an ordinary Rules denial, never the evaluation limit.
async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}

const A="acct_pack3_daniel",B="acct_pack3_nik";// playerOne = Daniel (A, coordinator), playerTwo = Nik (B): the app-wide convention
const RID=`pair_${"8".repeat(64)}`;
const SID=`session_${"c".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const TOTAL_SEASONS=3;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
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
function base(db,uid,deviceId,now){return {user:{uid},firestore:db,firebaseSdk:plainSdk(),rivalryId:RID,sessionId:SID,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
const io=(db,deviceId)=>({firestore:db,sdk:plainSdk(),rivalryId:RID,sessionId:SID,deviceId,now:()=>Date.now()});
const ctx=(role,season)=>({rivalryId:RID,managerRole:role,season,confirmedAtMs:Date.now()});

// The season results. Scores are written out by hand (checked against the shared score() helper below).
//   S1 Daniel 6, Nik 11 + Prime Pack 4 = 15 (the season maximum).  S2 Daniel 9 + Prime Pack 2 = 11, Nik 0.
//   S3 Daniel 6, Nik 1 (nobody named the Icon: no primePack key).
const DANIEL_S1={leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const NIK_S1_PLAIN={leaguePosition:1,leaguePoints:102,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const DANIEL_S2_PLAIN={leaguePosition:1,leaguePoints:100,leagueGoals:95,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false,europaLeague:true};
const NIK_S2={leaguePosition:3,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const DANIEL_S3=DANIEL_S1;
const NIK_S3={leaguePosition:2,leaguePoints:88,leagueGoals:85,domesticCup:false,championsLeague:false,topScorer:false,topAssist:true};
const EXPECTED={
  1:{winner:"playerTwo",stage:1,points:4,results:{playerOne:DANIEL_S1,playerTwo:{...NIK_S1_PLAIN,primePack:4}},totals:{playerOne:6,playerTwo:15}},
  2:{winner:"playerOne",stage:3,points:2,results:{playerOne:{...DANIEL_S2_PLAIN,primePack:2},playerTwo:NIK_S2},totals:{playerOne:11,playerTwo:0}},
  3:{winner:null,stage:null,points:0,results:{playerOne:DANIEL_S3,playerTwo:NIK_S3},totals:{playerOne:6,playerTwo:1}}
};

async function prepareShowdown(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",RID),rivalryDoc());await setDoc(doc(db,"rivalries",RID,"sessions",SID),sessionDoc(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);
  const must=(label,value)=>{if(!value||!value.ok)throw new Error(`${label} failed: ${JSON.stringify(value)}`);};
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:TOTAL_SEASONS}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
  must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
  must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
  must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
  must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
  return {dbA,dbB,a,b,must};
}

// One Transfer Challenge cycle for the season (2 guesses and 1 signing each, as the other single-fixture emulator tests do).
async function transferCycle(season,{a,b,must}){
  const offset=season*10_000,n=season*10;
  must(`S${season} transfer start`,await startAfterSpins({...a(offset+100),seasonNumber:season,operationId:op("transfer_op_",n+1),baseRevision:0},{...b(offset+100),seasonNumber:season}));
  must(`S${season} end A`,await Transfer.requestEndWindow({...a(offset+200),seasonNumber:season,operationId:op("transfer_op_",n+2),baseRevision:1}));
  must(`S${season} end B`,await Transfer.requestEndWindow({...b(offset+300),seasonNumber:season,operationId:op("transfer_op_",n+3),baseRevision:2}));
  must(`S${season} guess A`,await Transfer.lockGuesses({...a(offset+400),seasonNumber:season,operationId:op("transfer_op_",n+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
  must(`S${season} guess B`,await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",n+5),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
  must(`S${season} signing A`,await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",n+6),baseRevision:5,signings:[{slot:1,name:`Daniel Pack S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]}));
  must(`S${season} signing B`,await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",n+7),baseRevision:6,signings:[{slot:1,name:`Nik Pack S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]}));
}

(async()=>{
  const checks=[];
  const ok=label=>checks.push(label);
  const env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:RULES}});
  try{
    const now=Date.now(),kit=await prepareShowdown(env,now),{dbA,dbB,a,b}=kit;
    const dbOf={playerOne:dbA,playerTwo:dbB},deviceOf={playerOne:DA,playerTwo:DB},acctOf={playerOne:A,playerTwo:B};
    const roundRef=(db,season)=>doc(db,"rivalries",RID,"primePackRounds",`season_${season}`);
    const readRaw=async ref=>{let data;await env.withSecurityRulesDisabled(async context=>{const snap=await getDoc(ref(context.firestore()));data=snap.exists()?snap.data():null;});return data;};
    const round=season=>readRaw(db=>roundRef(db,season));
    const privateResult=async(season,role)=>(await readRaw(db=>doc(db,"rivalries",RID,"seasonResults",`season_${season}`,"roles",role))).result;
    const index=Names.defaultIndex();
    let opSeq=100;
    const publish=(role,season,result,baseRevision)=>Results.publishResult({...base(dbOf[role],acctOf[role],deviceOf[role],now+season*10_000+800+(opSeq%50)),seasonNumber:season,operationId:op("season_result_op_",opSeq++),baseRevision,result});
    const mustPublish=async(label,promise)=>{const value=await promise;assert.equal(value.ok,true,`${label}: ${JSON.stringify(value)}`);return value;};
    const refusePublish=async(label,promise)=>{const value=await promise;assert.equal(value.ok,false,`${label}: must be refused, got ${JSON.stringify(value)}`);assert.equal(value.code,"permission-denied",`${label}: expected a Rules denial, got ${JSON.stringify(value)}`);};

    const noPack=result=>{const {primePack:_pack,...rest}=result;return rest;};
    const history=[];
    for(let season=1;season<=TOTAL_SEASONS;season+=1){
      const want=EXPECTED[season],offset=season*10_000;
      const draw=Guess.draw(RID,season,Icons.players.length,Icons.listVersion);
      const answer=Icons.players[draw.index],decoy=Icons.players[(draw.index+1)%Icons.players.length];
      const rightGuess=()=>{const check=Names.check(index,answer.name,answer.id);assert.equal(check.correct,true,"the answer's own name matches the answer");return check.correct;};
      const wrongGuess=()=>{const check=Names.check(index,decoy.name,answer.id);assert.equal(check.status,"match");assert.equal(check.correct,false);return check.correct;};

      // ---- The round: both phones write their arrival, the loser spends a wrong chip, the winner names the Icon. ----
      assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne",season)),"created",`S${season} Daniel's arrival creates the round`);
      assert.equal(await Step.arrive(io(dbB,DB),ctx("playerTwo",season)),"arrived",`S${season} Nik's arrival completes it`);
      let current=await round(season);
      const later=Math.max(current.arrived.playerOne.toMillis(),current.arrived.playerTwo.toMillis());
      ok(`S${season}: both phones write their own arrival on primePackRounds/season_${season}`);
      if(want.winner===null){
        // Season 3: both managers spend both chips on wrong names; nobody names the Icon.
        await wait(Math.max(0,later+3_300-Date.now()));
        for(const role of ["playerOne","playerTwo","playerOne","playerTwo"]){
          const step=await Step.applyGuess(io(dbOf[role],deviceOf[role]),ctx(role,season),wrongGuess());
          assert.equal(step.ok,true,`S${season} ${role}'s wrong guess: ${JSON.stringify(step)}`);
        }
        current=await round(season);
        assert.equal(current.namedBy,null);assert.deepEqual(current.chipsUsed,{playerOne:2,playerTwo:2});
        assert.equal(Guess.outcome(Step.record(current,season),Date.now()).state,"draw","both managers out of chips with no winner is a draw");
        ok("S3: both managers spend their wrong-guess chips, nobody names the Icon, the round is a draw");
      }else{
        const winner=want.winner,loser=winner==="playerOne"?"playerTwo":"playerOne";
        // Season 1 lands in stage 1 (3.3 s after the later arrival); season 2 waits into stage 3 (55 s: stage 3 is 52 s to 73.5 s).
        await wait(Math.max(0,later+(want.stage===1?3_300:55_000)-Date.now()));
        const wrong=await Step.applyGuess(io(dbOf[loser],deviceOf[loser]),ctx(loser,season),wrongGuess());
        assert.equal(wrong.ok,true,`S${season} ${loser}'s wrong guess: ${JSON.stringify(wrong)}`);
        const right=await Step.applyGuess(io(dbOf[winner],deviceOf[winner]),ctx(winner,season),rightGuess());
        assert.equal(right.ok,true,`S${season} ${winner}'s right guess: ${JSON.stringify(right)}`);
        current=await round(season);
        assert.equal(current.namedBy,winner);assert.deepEqual(current.chipsUsed,{playerOne:1,playerTwo:1});
        const record=Step.record(current,season);
        assert.equal(record.winner.role,winner);assert.equal(record.winner.beat,want.stage-1,`S${season} the winning write lands in stage ${want.stage}`);
        assert.equal(Guess.points(record)[winner],want.points);assert.equal(Guess.points(record)[loser],0);
        assert.equal(await Step.pointsFor({firestore:dbOf[winner],sdk:plainSdk(),rivalryId:RID},ctx(winner,season)),want.points);
        assert.equal(await Step.pointsFor({firestore:dbOf[loser],sdk:plainSdk(),rivalryId:RID},ctx(loser,season)),0);
        ok(`S${season}: ${loser} spends a wrong-guess chip, ${winner} names the Icon in stage ${want.stage} and the step reads ${want.points} point${want.points===1?"":"s"}`);
      }

      // The stored round never holds the Icon: only the 11 round keys, and no name or id of the Icon anywhere in it.
      assert.deepEqual(Object.keys(current).sort(),["activeSessionId","arrived","chipsUsed","namedBy","revision","rivalryId","schemaVersion","objectType","seasonNumber","updatedAt","updatedByDeviceId"].sort());
      const leaves=[];(function walk(value,key){leaves.push(key);if(value&&typeof value==="object"&&typeof value.toMillis!=="function")for(const [k,v] of Object.entries(value))walk(v,k);else leaves.push(value);})(current,"");
      for(const secret of [answer.id,answer.name,answer.fullName,decoy.id,decoy.name,String(draw.index)])assert.ok(!leaves.includes(secret),`S${season}: the round record stores "${secret}"`);
      assert.ok(!JSON.stringify(current).toLowerCase().includes(answer.name.toLowerCase()),`S${season}: the round record contains the Icon's name`);
      assert.ok(!JSON.stringify(current).includes(answer.id),`S${season}: the round record contains the Icon's id`);
      ok(`S${season}: the stored round keys are only the round facts; the Icon's name and id are not in the record`);

      // ---- The Transfer Challenge, then the private Season Results. ----
      await transferCycle(season,kit);
      const plain={playerOne:want.results.playerOne,playerTwo:want.results.playerTwo};
      if(season===1){
        // Winner (Nik) first. Daniel's attempts to score as well, or with a wrong value, are refused while a plain result is not.
        for(const points of [1,2,3,4])await refusePublish(`S1 Daniel (not the winner) claims primePack ${points}`,publish("playerOne",1,{...DANIEL_S1,primePack:points},0));
        for(const points of [1,2,3])await refusePublish(`S1 Nik claims primePack ${points} for a stage 1 win`,publish("playerTwo",1,{...NIK_S1_PLAIN,primePack:points},0));
        assert.equal((await readRaw(db=>doc(db,"rivalries",RID,"seasonResults","season_1")))===null,true,"S1: the refusals wrote nothing");
        ok("S1: the loser claiming primePack (1 to 4) is refused; the winner claiming a wrong value (1, 2, 3) is refused; nothing was written");
        await mustPublish("S1 Nik's result with primePack 4 (the real flow)",publish("playerTwo",1,want.results.playerTwo,0));
        for(const points of [1,2,3,4])await refusePublish(`S1 Daniel also scores primePack ${points} after Nik`,publish("playerOne",1,{...DANIEL_S1,primePack:points},1));
        ok("S1: with Nik's primePack 4 stored, Daniel scoring Prime Pack in the same season is refused (both managers can never score)");
        await mustPublish("S1 Daniel's plain result (the control for the refusals above)",publish("playerOne",1,want.results.playerOne,1));
        assert.equal((await privateResult(1,"playerTwo")).primePack,4);assert.equal("primePack" in await privateResult(1,"playerOne"),false);
        ok("S1: the real flow is accepted: Nik's primePack 4 is stored as the integer 4, Daniel's plain result has no primePack key");
      }else if(season===2){
        // Loser (Nik) first, then Daniel (winner) with a wrong value for stage 3, then the right one (2).
        for(const points of [1,2,3,4])await refusePublish(`S2 Nik (not the winner) claims primePack ${points}`,publish("playerTwo",2,{...NIK_S2,primePack:points},0));
        await mustPublish("S2 Nik's plain result",publish("playerTwo",2,want.results.playerTwo,0));
        for(const points of [1,3,4])await refusePublish(`S2 Daniel claims primePack ${points} for a stage 3 win`,publish("playerOne",2,{...DANIEL_S2_PLAIN,primePack:points},1));
        ok("S2: the loser claiming primePack is refused; the winner claiming 1, 3 or 4 for a stage 3 win is refused");
        await mustPublish("S2 Daniel's result with primePack 2 (the real flow)",publish("playerOne",2,want.results.playerOne,1));
        assert.equal((await privateResult(2,"playerOne")).primePack,2);assert.equal("primePack" in await privateResult(2,"playerTwo"),false);
        ok("S2: Daniel's stage 3 win is accepted with primePack 2, Nik's plain result has no primePack key");
      }else{
        for(const role of ["playerOne","playerTwo"])for(const points of [1,2,3,4])await refusePublish(`S3 ${role} claims primePack ${points} though nobody named the Icon`,publish(role,3,{...plain[role],primePack:points},0));
        await mustPublish("S3 Daniel's plain result",publish("playerOne",3,want.results.playerOne,0));
        await mustPublish("S3 Nik's plain result",publish("playerTwo",3,want.results.playerTwo,1));
        for(const role of ["playerOne","playerTwo"])assert.equal("primePack" in await privateResult(3,role),false,`S3 ${role}: no primePack key`);
        ok("S3: nobody named the Icon, so any primePack claim (1 to 4) by either manager is refused; both plain results are accepted with no primePack key");
      }

      // ---- The season commit (the provider path the other emulator tests use). ----
      const privOne=await privateResult(season,"playerOne"),privTwo=await privateResult(season,"playerTwo");
      assert.deepEqual(privOne,want.results.playerOne);assert.deepEqual(privTwo,want.results.playerTwo);
      const commitRef=db=>doc(db,"rivalries",RID,"seasonCommits",`season_${season}`);
      const forged=(results,k)=>({schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:RID,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"COMMITTED",revision:1,resultsRevision:2,results,acknowledgedRoles:[],operationIds:[op("season_commit_op_",season*100+k)],operationHashes:[`sha256:${hex64(`pack3-${season}-${k}`)}`],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId:SID,updatedAt:serverTimestamp(),updatedByDeviceId:DA});
      let k=1;
      if(season===1){
        await assertPlainDenial(setDoc(commitRef(dbA),forged({playerOne:{...privOne,primePack:4},playerTwo:privTwo},k++)),"S1 a commit that gives Daniel Prime Pack points as well");
        await assertPlainDenial(setDoc(commitRef(dbA),forged({playerOne:privOne,playerTwo:{...privTwo,primePack:3}},k++)),"S1 a commit that changes Nik's Prime Pack value");
        await assertPlainDenial(setDoc(commitRef(dbA),forged({playerOne:privOne,playerTwo:noPack(privTwo)},k++)),"S1 a commit that drops Nik's Prime Pack points");
        ok("S1: a commit that adds, changes or drops Prime Pack points against the private results is refused");
      }
      let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",season*10+1),baseRevision:0});
      assert.equal(commit.ok,true,`S${season} commit: ${JSON.stringify(commit)}`);
      commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",season*10+2),baseRevision:1});
      assert.equal(commit.ok,true,`S${season} Nik acknowledges: ${JSON.stringify(commit)}`);
      commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",season*10+3),baseRevision:2});
      assert.equal(commit.ok,true,`S${season} Daniel acknowledges: ${JSON.stringify(commit)}`);
      assert.equal(commit.phase,"ACKNOWLEDGED");assert.equal(commit.revision,3);
      const stored=await readRaw(commitRef);
      assert.deepEqual(stored.results,want.results,`S${season}: the committed results carry the Prime Pack points exactly`);
      assert.equal("primePack" in stored.results.playerOne,want.winner==="playerOne");assert.equal("primePack" in stored.results.playerTwo,want.winner==="playerTwo");
      if(season===1){// the forged commits above had the real commit's shape, so they were refused for their Prime Pack difference alone
        assert.deepEqual(Object.keys(stored).filter(key=>!(key in forged({},0))),[],"the forged commit had every key the real commit has");
        assert.equal(stored.resultsRevision,2);assert.equal(stored.runtimeRevision,"1.9.1-r10");
      }
      ok(`S${season}: the season commits with both acknowledgements and the committed results ${want.winner?`carry primePack ${want.points} only for ${want.winner}`:"carry no primePack key"}`);

      // ---- Canonical scoring and shared history. ----
      const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20}),scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});
      assert.equal(scoreA.ok,true,JSON.stringify(scoreA));assert.equal(scoreB.ok,true,JSON.stringify(scoreB));
      assert.deepEqual(scoreA.scoring,scoreB.scoring,`S${season}: canonical scoring converges`);
      for(const role of ["playerOne","playerTwo"]){
        const total=scoreA.scoring[role].total;
        assert.equal(total,want.totals[role],`S${season} ${role} season total`);
        assert.equal(total,score(want.results[role]).total,`S${season} ${role}: the shared score() helper agrees`);
        assert.ok(total<=15,`S${season} ${role}: season total ${total} is over 15`);
        assert.equal(scoreA.scoring[role].primePack,role===want.winner?want.points:undefined,`S${season} ${role} primePack breakdown`);
      }
      assert.equal(Math.max(...Object.values(scoreA.scoring).map(s=>s.total)),Math.max(...Object.values(want.totals)));
      ok(`S${season}: canonical season totals Daniel ${want.totals.playerOne}, Nik ${want.totals.playerTwo} include the Prime Pack points and are at most 15`);
      const h=await History.read({...a(offset+1400),throughSeason:season}),hB=await History.read({...b(offset+1400),throughSeason:season});
      assert.equal(h.ok,true,JSON.stringify(h));assert.deepEqual(h.projection,hB.projection,`S${season}: shared history converges`);
      history.push(h);
      const cumulative={playerOne:0,playerTwo:0};
      for(let s=1;s<=season;s+=1){cumulative.playerOne+=EXPECTED[s].totals.playerOne;cumulative.playerTwo+=EXPECTED[s].totals.playerTwo;}
      assert.equal(h.projection.managerRecords.playerOne.totalPoints,cumulative.playerOne,`S${season} Daniel cumulative`);
      assert.equal(h.projection.managerRecords.playerTwo.totalPoints,cumulative.playerTwo,`S${season} Nik cumulative`);
      assert.equal(h.projection.seasonHistory.length,season);
      ok(`S${season}: shared history totals Daniel ${cumulative.playerOne}, Nik ${cumulative.playerTwo} include every Prime Pack point`);
      const multi=await Multi.read(a(offset+1500)),multiB=await Multi.read(b(offset+1500));
      assert.equal(multi.ok,true,JSON.stringify(multi));assert.deepEqual(multi.state,multiB.state);
      if(season<TOTAL_SEASONS){assert.equal(multi.state.activeSeason,season+1);assert.equal(multi.state.terminal,false);}
      else{assert.equal(multi.state.terminal,true);assert.equal(multi.state.phase,"SHOWDOWN_COMPLETE");}
    }
    const finalProjection=history[TOTAL_SEASONS-1].projection;
    assert.equal(finalProjection.managerRecords.playerOne.totalPoints,23);assert.equal(finalProjection.managerRecords.playerTwo.totalPoints,16);
    ok("the 3-season Showdown completes: final totals Daniel 23, Nik 16 (Prime Pack: Nik 4 in S1, Daniel 2 in S2, none in S3)");
  }finally{await env.cleanup();}
  for(const check of checks)process.stdout.write(`ok ${check}\n`);
  process.stdout.write(`PASS r87 Prime Pack three-season emulator: ${checks.length} checks.\n`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
