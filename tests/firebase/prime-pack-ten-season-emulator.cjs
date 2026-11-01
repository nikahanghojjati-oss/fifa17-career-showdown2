"use strict";
// r87 Prime Pack, two whole 10-season Showdowns in the Firestore emulator under the composed production Rules
// (firestore.spark.generated.rules). Built on tests/firebase/prime-pack-three-season-emulator.cjs: the real step code
// (js/iconGuessStep.js) writes every round, the real providers publish the private Season Results, commit each season
// (commit + 2 acknowledgements), read Scoring / History / Multi after every season, reconcile the final and run the real
// Terminal Close (js/sparkTerminalClose.js); then the session-free completed reader, the Adapter and the career Analytics
// build the career rows that js/careerScreenSeam.js judges for Golden Showdown.
//   Showdown A (both phones play Prime Pack, 10 seasons): Prime Pack wins of 4, 3, 2, 1 (stages 1 to 4) and nobody, spread over
//     both managers. Totals are checked against the score() helper after every season; at the end the Golden Showdown
//     threshold is 150 (not 110) and nobody is Golden.
//   Showdown B (a new Showdown of the same pair): Nik plays the maximum season (CL, league, cup, 100 points, awards = 11) plus
//     Prime Pack 4 in every season, 15 x 10 = 150 = Golden.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/prime-pack-ten-season-emulator.cjs"
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
const HistoryProtocol=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const Adapter=require("../../js/sharedClosedShowdownAdapter.js");
const Analytics=require("../../js/sharedCareerAnalytics.js");
const Active=require("../../js/sharedActiveShowdownAdapter.js");
const Seam=require("../../js/careerScreenSeam.js");
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const Icons=require("../../data/icons.js");
const Names=require("../../js/iconNames.js");
const {score}=require("../support/career-fixture-helpers.cjs");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-prime-pack-ten-season";
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}

// ---------------------------------------------------------------------------------------------------------------
// Fixture: the same envelope documents the completed-Showdown emulator test seeds (so the real Terminal Close and the
// session-free reader run on them). playerOne = Daniel (account A, coordinator), playerTwo = Nik (account B).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_pack10_daniel",B="acct_pack10_nik";
const RID_A=`pair_a${"1".repeat(63)}`,RID_B=`pair_a${"2".repeat(63)}`;
const SID_A=`session_${"a".repeat(64)}`,SID_B=`session_${"b".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`,SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const TOTAL_SEASONS=10;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${Buffer.from(hash).toString("hex")}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function accountDoc(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function deviceDoc(uid,id,seedChar){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seedChar.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalryDoc(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function sessionDoc(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}

// Base results (no Prime Pack key) and their hand-checked scores; every league value is valid for an 18 or a 20 team league.
const R=(o)=>({leaguePosition:9,leaguePoints:40,leagueGoals:40,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...o});
const PROFILES=[
  {score:0,r:R({})},                                                                                                                    // 0: nothing
  {score:1,r:R({leaguePosition:5,topAssist:true})},                                                                                     // 1: award
  {score:4,r:R({leaguePosition:1,leaguePoints:90,leagueGoals:70,domesticCup:true})},                                                    // 2: title + cup
  {score:6,r:R({leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,topScorer:true})},                                    // 3: title + cup + 100 pts + award
  {score:5,r:R({leaguePosition:2,leaguePoints:80,leagueGoals:70,championsLeague:true})},                                                // 4: CL only
  {score:9,r:R({leaguePosition:1,leaguePoints:100,leagueGoals:95,domesticCup:true,topScorer:true,europaLeague:true})},                  // 5: EL + title + cup + 100 pts + award
  {score:11,r:R({leaguePosition:1,leaguePoints:102,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true})},// 6: the old maximum
  {score:5,r:R({leaguePosition:3,leaguePoints:60,leagueGoals:55,domesticCup:true,topAssist:true,europaLeague:true})}                    // 7: EL + cup + award
];
// plan[season-1] = {winner: role or null, stage: 1..4 or null}; the stage's points are 4, 3, 2, 1.
const NOBODY={winner:null,stage:null};
const D=stage=>({winner:"playerOne",stage}),N=stage=>({winner:"playerTwo",stage});
const SHOWDOWNS={
  A:{label:"Showdown A",rid:RID_A,sid:SID_A,
    plan:[N(1),D(2),N(3),D(4),NOBODY,D(1),N(2),D(3),N(4),NOBODY],
    profiles:{playerOne:[3,0,5,2,1,7,4,6,0,3],playerTwo:[6,1,2,7,3,0,5,4,2,1]}},
  B:{label:"Showdown B",rid:RID_B,sid:SID_B,
    plan:Array.from({length:TOTAL_SEASONS},()=>N(1)),
    profiles:{playerOne:[3,0,3,0,3,0,3,0,3,0],playerTwo:Array.from({length:TOTAL_SEASONS},()=>6)}}
};
for(const spec of Object.values(SHOWDOWNS)){
  spec.expected=spec.plan.map((entry,i)=>{
    const out={};
    for(const role of ["playerOne","playerTwo"]){
      const profile=PROFILES[spec.profiles[role][i]],points=entry.winner===role?[4,3,2,1][entry.stage-1]:0;
      const result={...profile.r,...(points?{primePack:points}:{})};
      out[role]={result,points,total:profile.score+points};
    }
    return out;
  });
}

async function seedBase(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const [uid,id,seedChar] of [[A,DA,"a"],[B,DB,"b"]]){await setDoc(doc(db,"accounts",uid),await accountDoc(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await deviceDoc(uid,id,seedChar));}
    for(const spec of Object.values(SHOWDOWNS)){await setDoc(doc(db,"rivalries",spec.rid),await rivalryDoc(spec.rid));await setDoc(doc(db,"rivalries",spec.rid,"sessions",spec.sid),await sessionDoc(spec.rid,spec.sid,now));}
  });
}

(async()=>{
  const checks=[];
  const ok=label=>checks.push(label);
  const startedAt=Date.now();
  const env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:RULES}});
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const dbOf={playerOne:dbA,playerTwo:dbB},deviceOf={playerOne:DA,playerTwo:DB},acctOf={playerOne:A,playerTwo:B};
  const readRaw=async ref=>{let data;await env.withSecurityRulesDisabled(async context=>{const snap=await getDoc(ref(context.firestore()));data=snap.exists()?snap.data():null;});return data;};
  const index=Names.defaultIndex();
  let opSeq=1000;
  const finals={};
  try{
    const now=Date.now();
    await seedBase(env,now);

    async function playShowdown(spec,{dual,refusals}){
      const {rid,sid,plan,expected,label}=spec;
      const base=(db,uid,deviceId,t)=>({user:{uid},firestore:db,firebaseSdk:plainSdk(),rivalryId:rid,sessionId:sid,deviceId,nowEpochMs:now+t,cryptoImpl:crypto.webcrypto});
      const a=t=>base(dbA,A,DA,t),b=t=>base(dbB,B,DB,t);
      const io=(role)=>({firestore:dbOf[role],sdk:plainSdk(),rivalryId:rid,sessionId:sid,deviceId:deviceOf[role],now:()=>Date.now()});
      const ctx=(role,season)=>({rivalryId:rid,managerRole:role,season,confirmedAtMs:Date.now()});
      const roundRef=(db,season)=>doc(db,"rivalries",rid,"primePackRounds",`season_${season}`);
      const must=(what,value)=>{if(!value||!value.ok)throw new Error(`${label} ${what} failed: ${JSON.stringify(value)}`);return value;};
      const tag=`${label}`;

      // ---- Setup (10 seasons), confirmed after the Prime Pack boundary, Career Start. ----
      for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:TOTAL_SEASONS}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
      must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
      const confirmed=must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
      assert.equal(confirmed.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(confirmed.state.totalSeasons,TOTAL_SEASONS);
      const ledger=await readRaw(d=>doc(d,"rivalries",rid,"sharedSetup","authoritative"));
      const confirmedAt=ledger.updatedAt.toMillis();
      assert.ok(Guess.eligible(rid,confirmedAt),`${label}: confirmed after the Prime Pack boundary`);
      assert.ok(confirmedAt>=Seam.PRIME_PACK_FROM_MS);
      must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
      must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
      ok(`${tag}: a 10-season Showdown is confirmed after the Prime Pack boundary and plays Prime Pack`);

      // ---- The ten rounds. The Rules do not order a round against the Transfer Challenge, so all ten run at once (each waits for
      // its own stage, measured from the server-stamped later arrival) instead of one after the other. ----
      const stageWaitMs={1:3_300,2:16_000,3:26_500,4:34_000};// inside stage 1 (3 to 12.5 s), 2 (12.5 to 22 s), 3 (22 to 31.5 s), 4 (31.5 to 41 s)
      const playRound=async season=>{
        const entry=plan[season-1];
        const draw=Guess.draw(rid,season,Icons.players.length,Icons.listVersion);
        const answer=Icons.players[draw.index],decoy=Icons.players[(draw.index+1)%Icons.players.length];
        const right=Names.check(index,answer.name,answer.id),wrong=Names.check(index,decoy.name,answer.id);
        assert.equal(right.correct,true);assert.equal(wrong.status,"match");assert.equal(wrong.correct,false);
        assert.equal(await Step.arrive(io("playerOne"),ctx("playerOne",season)),"created");
        assert.equal(await Step.arrive(io("playerTwo"),ctx("playerTwo",season)),"arrived");
        const arrived=(await getDoc(roundRef(dbA,season))).data();
        const later=Math.max(arrived.arrived.playerOne.toMillis(),arrived.arrived.playerTwo.toMillis());
        await wait(Math.max(0,later+stageWaitMs[entry.stage||1]-Date.now()));
        if(entry.winner===null){
          for(const role of ["playerOne","playerTwo","playerOne","playerTwo"]){const step=await Step.applyGuess(io(role),ctx(role,season),wrong.correct);assert.equal(step.ok,true,`${label} S${season} ${role} wrong guess: ${JSON.stringify(step)}`);}
        }else{
          const loser=entry.winner==="playerOne"?"playerTwo":"playerOne";
          const w=await Step.applyGuess(io(loser),ctx(loser,season),wrong.correct);assert.equal(w.ok,true,`${label} S${season} ${loser} wrong guess: ${JSON.stringify(w)}`);
          const r=await Step.applyGuess(io(entry.winner),ctx(entry.winner,season),right.correct);assert.equal(r.ok,true,`${label} S${season} ${entry.winner} right guess: ${JSON.stringify(r)}`);
        }
      };
      await Promise.all(plan.map((_,i)=>playRound(i+1)));
      for(let season=1;season<=TOTAL_SEASONS;season+=1){
        const entry=plan[season-1],stored=await readRaw(d=>roundRef(d,season));
        const draw=Guess.draw(rid,season,Icons.players.length,Icons.listVersion),answer=Icons.players[draw.index],decoy=Icons.players[(draw.index+1)%Icons.players.length];
        assert.equal(stored.namedBy,entry.winner);
        const record=Step.record(stored,season);
        if(entry.winner){
          assert.equal(record.winner.role,entry.winner);assert.equal(record.winner.beat,entry.stage-1,`${label} S${season}: the winning write lands in stage ${entry.stage}`);
          assert.equal(Guess.points(record)[entry.winner],[4,3,2,1][entry.stage-1]);
          assert.deepEqual(stored.chipsUsed,{playerOne:1,playerTwo:1});
        }else{
          assert.deepEqual(stored.chipsUsed,{playerOne:2,playerTwo:2});assert.equal(Guess.outcome(record,Date.now(),Guess.windowMs).state,"draw");
        }
        assert.deepEqual(Object.keys(stored).sort(),["activeSessionId","arrived","chipsUsed","namedBy","objectType","revision","rivalryId","schemaVersion","seasonNumber","updatedAt","updatedByDeviceId"]);
        const text=JSON.stringify(stored);
        for(const secret of [answer.id,answer.name,decoy.id,decoy.name])assert.ok(!text.toLowerCase().includes(secret.toLowerCase()),`${label} S${season}: the round record stores "${secret}"`);
      }
      ok(`${tag}: all 10 rounds are played by the real step (wins in stage 1, 2, 3 and 4 for both managers, and nobody); each stage is the one the plan names`);
      ok(`${tag}: no stored round holds the Icon's name or id (exact key set, no secret in the JSON)`);

      // ---- The ten seasons. ----
      const publish=(role,season,result,baseRevision)=>Results.publishResult({...base(dbOf[role],acctOf[role],deviceOf[role],season*10_000+800+(opSeq%50)),seasonNumber:season,operationId:op("season_result_op_",opSeq++),baseRevision,result});
      const mustPublish=async(what,promise)=>{const value=await promise;assert.equal(value.ok,true,`${label} ${what}: ${JSON.stringify(value)}`);};
      const refuse=async(what,promise)=>{const value=await promise;assert.equal(value.ok,false,`${label} ${what}: must be refused, got ${JSON.stringify(value)}`);assert.equal(value.code,"permission-denied",`${label} ${what}: expected a Rules denial, got ${JSON.stringify(value)}`);};
      const cumulative={playerOne:0,playerTwo:0};
      let lastHistory=null,lastMulti=null,refused=0;
      for(let season=1;season<=TOTAL_SEASONS;season+=1){
        const offset=season*10_000,entry=plan[season-1],want=expected[season-1];
        for(const role of ["playerOne","playerTwo"])assert.ok(want[role].total>=0&&want[role].total<=15,`${label} S${season} ${role}: planned total ${want[role].total} is outside 0..15`);

        // Transfer Challenge.
        const n=season*10;
        must(`S${season} transfer start`,await startAfterSpins({...a(offset+100),seasonNumber:season,operationId:op("transfer_op_",n+1),baseRevision:0},{...b(offset+100),seasonNumber:season}));
        must(`S${season} end A`,await Transfer.requestEndWindow({...a(offset+200),seasonNumber:season,operationId:op("transfer_op_",n+2),baseRevision:1}));
        must(`S${season} end B`,await Transfer.requestEndWindow({...b(offset+300),seasonNumber:season,operationId:op("transfer_op_",n+3),baseRevision:2}));
        must(`S${season} guess A`,await Transfer.lockGuesses({...a(offset+400),seasonNumber:season,operationId:op("transfer_op_",n+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
        must(`S${season} guess B`,await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",n+5),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
        must(`S${season} signing A`,await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",n+6),baseRevision:5,signings:[{slot:1,name:`Daniel Pack S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]}));
        must(`S${season} signing B`,await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",n+7),baseRevision:6,signings:[{slot:1,name:`Nik Pack S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]}));

        // Private Season Results: the winner (when there is one) carries primePack N; every other claim is refused.
        const loser=entry.winner==="playerOne"?"playerTwo":"playerOne";
        const plain=role=>{const {primePack:_pack,...rest}=want[role].result;return rest;};
        if(refusals){
          if(entry.winner){
            await refuse(`S${season} ${loser} (not the winner) claims primePack ${want[entry.winner].points}`,publish(loser,season,{...plain(loser),primePack:want[entry.winner].points},0));
            await refuse(`S${season} ${entry.winner} claims a wrong value`,publish(entry.winner,season,{...plain(entry.winner),primePack:want[entry.winner].points%4+1},0));
            refused+=2;
          }else{
            await refuse(`S${season} Daniel claims primePack 4 though nobody named the Icon`,publish("playerOne",season,{...plain("playerOne"),primePack:4},0));
            await refuse(`S${season} Nik claims primePack 1 though nobody named the Icon`,publish("playerTwo",season,{...plain("playerTwo"),primePack:1},0));
            refused+=2;
          }
        }
        const order=season%2===1?["playerOne","playerTwo"]:["playerTwo","playerOne"];
        for(const [i,role] of order.entries()){
          await mustPublish(`S${season} ${role}'s result`,publish(role,season,want[role].result,i));
          if(refusals&&i===0&&role===entry.winner){await refuse(`S${season} ${loser} also scores after the winner`,publish(loser,season,{...plain(loser),primePack:want[entry.winner].points},1));refused+=1;}
        }
        for(const role of ["playerOne","playerTwo"]){
          const stored=(await readRaw(d=>doc(d,"rivalries",rid,"seasonResults",`season_${season}`,"roles",role))).result;
          assert.deepEqual(stored,want[role].result,`${label} S${season} ${role}: the stored private result`);
          assert.equal("primePack" in stored,role===entry.winner,`${label} S${season} ${role}: primePack only for the winner`);
        }

        // Season commit: commit + both acknowledgements.
        let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",n+1),baseRevision:0});must(`S${season} commit`,commit);
        commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",n+2),baseRevision:1});must(`S${season} Nik acknowledges`,commit);
        commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",n+3),baseRevision:2});must(`S${season} Daniel acknowledges`,commit);
        assert.equal(commit.phase,"ACKNOWLEDGED");
        const committed=await readRaw(d=>doc(d,"rivalries",rid,"seasonCommits",`season_${season}`));
        assert.deepEqual(committed.results,{playerOne:want.playerOne.result,playerTwo:want.playerTwo.result},`${label} S${season}: the committed results carry the Prime Pack points`);

        // Scoring, History and Multi after the commit.
        const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20});must(`S${season} scoring A`,scoreA);
        if(dual){const scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});must(`S${season} scoring B`,scoreB);assert.deepEqual(scoreA.scoring,scoreB.scoring,`${label} S${season}: canonical scoring converges`);}
        for(const role of ["playerOne","playerTwo"]){
          const total=scoreA.scoring[role].total;
          assert.equal(total,want[role].total,`${label} S${season} ${role}: Scoring total (hand-checked table)`);
          assert.equal(total,score(want[role].result).total,`${label} S${season} ${role}: Scoring total equals the score() helper`);
          assert.ok(total>=0&&total<=15,`${label} S${season} ${role}: season total ${total} is outside 0..15`);
          assert.equal(scoreA.scoring[role].primePack,want[role].points||undefined,`${label} S${season} ${role}: primePack breakdown`);
        }
        const expectedWinner=want.playerOne.total>want.playerTwo.total?"playerOne":want.playerTwo.total>want.playerOne.total?"playerTwo":"draw";
        assert.equal(scoreA.winner,expectedWinner,`${label} S${season}: season winner`);
        cumulative.playerOne+=want.playerOne.total;cumulative.playerTwo+=want.playerTwo.total;
        const history=await History.read({...a(offset+1400),throughSeason:season});must(`S${season} history A`,history);
        if(dual){const historyB=await History.read({...b(offset+1400),throughSeason:season});must(`S${season} history B`,historyB);assert.deepEqual(history.projection,historyB.projection,`${label} S${season}: shared history converges`);}
        HistoryProtocol.verifyProjection(history.projection);
        assert.equal(history.projection.acceptedSeasons,season);assert.equal(history.projection.seasonHistory.length,season);
        for(let s=1;s<=season;s+=1){
          const row=history.projection.seasonHistory[s-1];
          for(const role of ["playerOne","playerTwo"])assert.equal(row[role].scoring.total,expected[s-1][role].total,`${label} after S${season}: history season ${s} ${role}`);
        }
        assert.equal(history.projection.managerRecords.playerOne.totalPoints,cumulative.playerOne,`${label} after S${season}: Daniel cumulative`);
        assert.equal(history.projection.managerRecords.playerTwo.totalPoints,cumulative.playerTwo,`${label} after S${season}: Nik cumulative`);
        assert.equal(cumulative.playerOne,expected.slice(0,season).reduce((sum,s)=>sum+score(s.playerOne.result).total,0),`${label} after S${season}: Daniel cumulative equals the score() helper`);
        assert.equal(cumulative.playerTwo,expected.slice(0,season).reduce((sum,s)=>sum+score(s.playerTwo.result).total,0),`${label} after S${season}: Nik cumulative equals the score() helper`);
        const multi=await Multi.read(a(offset+1500));must(`S${season} multi A`,multi);
        if(dual){const multiB=await Multi.read(b(offset+1500));must(`S${season} multi B`,multiB);assert.deepEqual(multi.state,multiB.state,`${label} S${season}: progression converges`);}
        assert.equal(multi.state.acceptedSeasons,season);assert.equal(multi.state.acceptedRevisionKey,history.projection.acceptedRevisionKey,`${label} S${season}: Multi and History accept the same season revisions`);
        if(season<TOTAL_SEASONS){assert.equal(multi.state.activeSeason,season+1);assert.equal(multi.state.terminal,false);}
        else{assert.equal(multi.state.activeSeason,null);assert.equal(multi.state.terminal,true);assert.equal(multi.state.phase,"SHOWDOWN_COMPLETE");}
        lastHistory=history;lastMulti=multi;
      }
      ok(`${tag}: every season's private results, commit (+2 acknowledgements), Scoring and History match the hand-checked table and the score() helper (all season totals 0..15; History cumulative totals checked after each of the 10 seasons)`);
      if(refusals)ok(`${tag}: ${refused} Prime Pack claims were refused by the Rules across the 10 seasons (the loser, a wrong value, a second scorer, a claim when nobody named the Icon)`);
      ok(`${tag}: Multi and History agree after every season (accepted seasons, revision key, terminal state at season 10)${dual?"; both managers' reads converge":""}`);

      const totals={playerOne:cumulative.playerOne,playerTwo:cumulative.playerTwo};
      assert.equal(lastHistory.projection.managerRecords.playerOne.totalPoints,totals.playerOne);

      // ---- Final reconciliation and the real Terminal Close. ----
      const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
      const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
      assert.deepEqual(finalA,finalB,"both managers derive the same final");
      assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");assert.deepEqual(finalA.managerTotals,totals);
      assert.equal(finalA.winner,totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw");
      // Terminal Close progress is written by the provider with Rules-checked cumulative totals: a forged total (one more or one
      // fewer than the committed seasons score) is refused, at the manager that scored a Prime Pack point and at the one that did not.
      const rivalryRef=doc(dbA,"rivalries",rid);
      const prior=(await getDoc(rivalryRef)).data(),first=expected[0];
      const progress=totalsNow=>envelope("rivalry",prior.objectId,prior.revision+1,{...prior.data,terminalProgress:{schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:TOTAL_SEASONS,acceptedThroughSeason:1,managerTotals:totalsNow,closedSessionRevision:null}},{accountId:A,deviceId:DA,priorHash:prior.contentHash});
      const season1={playerOne:first.playerOne.total,playerTwo:first.playerTwo.total};
      let forged=0;
      for(const [role,delta] of [["playerOne",1],["playerTwo",1],["playerTwo",-1],["playerOne",-1]]){
        if(season1[role]+delta<0)continue;
        await assertPlainDenial(setDoc(rivalryRef,await progress({...season1,[role]:season1[role]+delta})),`${label} Terminal Close progress with ${role} ${delta>0?"+":""}${delta}`);forged+=1;
      }
      await setDoc(rivalryRef,await progress(season1));// the exact season 1 totals are accepted (progress is then finished by the provider)
      ok(`${tag}: Terminal Close progress with season 1 totals ${forged>2?"one too high or one too low":"forged"} for either manager is refused (${forged} forgeries); the exact totals are accepted`);
      const intent=Terminal.prepare(finalA,{sessionId:sid});
      const wrongIntent=JSON.parse(JSON.stringify(intent));wrongIntent.managerTotals={playerOne:totals.playerOne,playerTwo:totals.playerTwo+1};wrongIntent.winner=wrongIntent.managerTotals.playerOne>wrongIntent.managerTotals.playerTwo?"playerOne":wrongIntent.managerTotals.playerTwo>wrongIntent.managerTotals.playerOne?"playerTwo":"draw";
      const refusedClose=await TerminalProvider.close({...a(0),nowEpochMs:Date.now(),intent:wrongIntent});
      assert.equal(refusedClose.ok,false,`${label}: a Terminal Close intent with forged totals is refused`);
      const closed=await TerminalProvider.close({...a(0),nowEpochMs:Date.now(),intent});
      assert.equal(closed.ok,true,`${label} Terminal Close: ${JSON.stringify(closed)}`);assert.equal(closed.rivalryState,"closed");
      const closedDoc=(await getDoc(doc(dbB,"rivalries",rid))).data();
      assert.equal(closedDoc.data.connectionState,"closed");assert.deepEqual(closedDoc.data.terminalProgress.managerTotals,totals);assert.deepEqual(closedDoc.data.terminalClose.managerTotals,totals);
      ok(`${tag}: Final reconciliation (Daniel ${totals.playerOne}, Nik ${totals.playerTwo}) and the real Terminal Close agree: forged intent refused, the 10-season close is accepted and stores the same totals as History`);
      finals[spec.label]={totals,rid,confirmedAt,expected};
    }

    await playShowdown(SHOWDOWNS.A,{dual:true,refusals:true});
    await playShowdown(SHOWDOWNS.B,{dual:false,refusals:false});

    // ---- Career: session-free reader -> adapter -> analytics -> Golden Showdown in the seam. ----
    const readerSdk={doc,getDoc};
    const reads={};
    for(const spec of Object.values(SHOWDOWNS)){
      reads[spec.rid]=await Reader.readCompletedShowdown({firestore:dbA,firebaseSdk:readerSdk,user:{uid:A},rivalryId:spec.rid,cryptoImpl:crypto.webcrypto});
      assert.equal(reads[spec.rid].status,"completed",JSON.stringify(reads[spec.rid]));
      const nik=await Reader.readCompletedShowdown({firestore:dbB,firebaseSdk:readerSdk,user:{uid:B},rivalryId:spec.rid,cryptoImpl:crypto.webcrypto});
      assert.deepEqual(nik.projection,reads[spec.rid].projection);
      assert.deepEqual(reads[spec.rid].final.totals,finals[spec.label].totals);assert.equal(reads[spec.rid].final.seasonsPlayed,TOTAL_SEASONS);
    }
    ok("the session-free reader returns both finished Showdowns for each manager with the Terminal Close totals");
    const model=Analytics.buildCareerModel(Adapter.buildClosedCareerInput({index:{status:"ready",rivalryIds:[RID_A,RID_B]},reads,current:Active.careerInput({pair:{initialized:true,status:"unpaired"}})}));
    assert.equal(model.status,"ready");
    const rowOf=rid=>model.history.showdowns.find(row=>row.rivalryId===rid);
    const rowA=rowOf(RID_A),rowB=rowOf(RID_B);
    for(const [row,label] of [[rowA,"A"],[rowB,"B"]]){
      const f=finals[`Showdown ${label}`];
      assert.equal(row.status,"completed");assert.equal(row.totalSeasons,10);assert.equal(row.seasonsPlayed,10);
      assert.deepEqual(row.totals,{daniel:f.totals.playerOne,nik:f.totals.playerTwo},`Showdown ${label} career row totals equal the Terminal Close totals`);
      assert.equal(row.setupConfirmedAt,f.confirmedAt);
      const seasonScores=row.seasons.flatMap(s=>[s.score.daniel,s.score.nik]);
      assert.equal(seasonScores.length,20);assert.ok(seasonScores.every(v=>Number.isInteger(v)&&v>=0&&v<=15));
    }
    const careerSum=(label,role)=>finals[`Showdown ${label}`].totals[role];
    assert.equal(model.managers.daniel.careerPoints,careerSum("A","playerOne")+careerSum("B","playerOne"),"Daniel's career points are the sum of both Showdowns");
    assert.equal(model.managers.nik.careerPoints,careerSum("A","playerTwo")+careerSum("B","playerTwo"),"Nik's career points are the sum of both Showdowns");
    assert.equal(model.managers.nik.seasons,20);assert.equal(model.managers.daniel.seasons,20);
    assert.equal(model.managers.nik.bestSeasonScore,15);
    ok("career analytics: both rows' totals equal the Terminal Close totals, every season score is 0..15, career points and seasons add up across the two Showdowns, and Nik's best season is 15");

    // Showdown A: threshold 150, nobody Golden.
    assert.equal(Seam.seasonMaxFor(rowA),15);assert.equal(Seam.goldenShowdownPoints(rowA),150);
    assert.deepEqual(Seam.goldenShowdownManagers(rowA),[]);
    assert.ok(finals["Showdown A"].totals.playerOne<150&&finals["Showdown A"].totals.playerTwo<150);
    assert.equal(Seam.goldenShowdownPoints({...rowA,setupConfirmedAt:Date.parse("2026-10-01T00:00:00Z")}),110,"a Showdown confirmed before Prime Pack keeps 110");
    ok(`Showdown A (Daniel ${finals["Showdown A"].totals.playerOne}, Nik ${finals["Showdown A"].totals.playerTwo}): goldenShowdownPoints is 150 (110 only for a Showdown confirmed before Prime Pack) and nobody is Golden`);
    // Showdown B: Nik at 150.
    assert.equal(finals["Showdown B"].totals.playerTwo,150);
    assert.equal(Seam.goldenShowdownPoints(rowB),150);assert.deepEqual(Seam.goldenShowdownManagers(rowB),["nik"]);
    assert.deepEqual(Seam.goldenShowdownCounts(model.history.showdowns),{daniel:0,nik:1});
    assert.deepEqual(Seam.goldenShowdownManagers({...rowB,totals:{...rowB.totals,nik:149}}),[],"149 is not Golden");
    ok("Showdown B: Nik totals 150 (15 x 10) and is Golden Showdown at 150; one point less is not Golden; Daniel is not Golden; the career counts are Daniel 0, Nik 1");
  }finally{await env.cleanup();}
  for(const check of checks)process.stdout.write(`ok ${check}\n`);
  process.stdout.write(`run time ${Math.round((Date.now()-startedAt)/1000)} s\n`);
  process.stdout.write(`PASS r87 Prime Pack ten-season emulator: ${checks.length} checks.\n`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
