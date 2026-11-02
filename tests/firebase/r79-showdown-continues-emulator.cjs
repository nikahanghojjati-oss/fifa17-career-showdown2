"use strict";
// r80 Europa League PR 2: an r79 Showdown saved mid-game is continued on the CURRENT code (R80_EUROPA_PLAN section 5, "Old-format proof").
//
// tests/fixtures/saved-showdowns-in-progress/r79-3season-inprogress.json is the real database content of a 3-season Showdown played in
// the browser on live main (1.9.3-r79) on the emulator, stopped right after season 1 was committed and acknowledged by both managers
// (see the README in tests/fixtures/saved-showdowns). This test loads it into a fresh emulator with the COMPOSED production Rules, then
// plays on with the current providers, exactly as the two managers would after updating to r80:
//   * the r79 private session has run out (4 hours), so Nik records the expiry, Daniel hosts a fresh session and Nik joins it (the same
//     real Rules-checked path as Job 31 in two-manager-journey-emulator.cjs; only the clock is moved, by re-sealing the old session);
//   * season 2: the Transfer Challenge, then Daniel publishes a Europa League win (+3; the sparse key europaLeague:true), commit and both
//     acknowledgements; season 3: no Europa League; then the Final Reconciliation and Terminal Close;
//   * the session-free completed reader and the career loader re-verify all three seasons: the r79 season 1 (7-key results, untouched)
//     and the r80 seasons, with totals = the r79 season 1 score + the recomputed seasons 2 and 3.
// Season 1's stored documents must be byte-identical before and after (an old season is never rewritten).
//
// Needs the r80 Europa League Rules (PR 1: results/commit shape accept europaLeague:true, terminal score +3). Demo project only.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r79-continues "node tests/firebase/r79-showdown-continues-emulator.cjs"
//      (or: npm run -s test:r79-showdown-continues)

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

const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const StandardSessions=require("../../js/sparkStandardAuthPrivateSession.js");
const RemoteJoining=require("../../js/sparkRemoteJoining.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const Loader=require("../../js/sparkClosedShowdownCareerLoader.js");

const ROOT=path.resolve(__dirname,"../..");
const FIXTURE=path.join(ROOT,"tests/fixtures/saved-showdowns-in-progress/r79-3season-inprogress.json");
const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-r79-continues";
const SEVEN=["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"];

// ---------------------------------------------------------------------------------------------------------------------------
// Expected values, written by hand (never read from the fixture). Ligue 1 (20 teams), Rennes (Daniel) v Marseille (Nik).
// r79 season 1 (typed in the r79 browser game): Daniel league title, 113 points, 41 goals, top assist = 3 + 1 + 1 = 5;
//   Nik 2nd, 29 points, 72 goals, Champions League, top scorer = 5 + 1 = 6. Nik leads 6-5.
// r80 season 2: Daniel 3rd, 80 points, 70 goals, Europa League = 3. Nik 2nd, 79 points, 66 goals, nothing = 0.
// r80 season 3: Daniel 2nd, 70 points, 60 goals, domestic cup = 1. Nik league title, 90 points, 101 goals, Champions League
//   = 3 + 1 + 5 = 9.
// Totals: Daniel 5 + 3 + 1 = 9, Nik 6 + 0 + 9 = 15. Nik wins by 6.
// ---------------------------------------------------------------------------------------------------------------------------
const R79_SEASON_1={daniel:{leaguePosition:1,leaguePoints:113,leagueGoals:41,domesticCup:false,championsLeague:false,topScorer:false,topAssist:true},nik:{leaguePosition:2,leaguePoints:29,leagueGoals:72,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false}};
const R80_SEASONS={
  2:{playerOne:{leaguePosition:3,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,europaLeague:true},playerTwo:{leaguePosition:2,leaguePoints:79,leagueGoals:66,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}},
  3:{playerOne:{leaguePosition:2,leaguePoints:70,leagueGoals:60,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false},playerTwo:{leaguePosition:1,leaguePoints:90,leagueGoals:101,domesticCup:false,championsLeague:true,topScorer:false,topAssist:false}}
};
const SCORES={1:{playerOne:5,playerTwo:6},2:{playerOne:3,playerTwo:0},3:{playerOne:1,playerTwo:9}};
const WINNERS={1:"playerTwo",2:"playerOne",3:"playerTwo"};
const TOTALS={playerOne:9,playerTwo:15};

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
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis(),$nanos:value.nanoseconds};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}

function buildComposedRules(){
  for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
    const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,encoding:"utf8"});
    assert.equal(built.status,0,`${script} failed: ${built.stderr}`);
  }
  return fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp,getDoc};}

async function main(){
  const rules=buildComposedRules();
  const fixture=JSON.parse(fs.readFileSync(FIXTURE,"utf8"));
  assert.equal(fixture.fixtureVersion,1);assert.equal(fixture.name,"r79-3season-inprogress");assert.equal(fixture.release,"1.9.3-r79");
  assert.ok(!/(idtoken|refreshtoken|accesstoken|bearer|apikey|api_key|secret)/i.test(JSON.stringify(fixture)),"a fixture must not contain auth tokens");
  const R=fixture.rivalryId,byPath=new Map(fixture.documents.map(item=>[item.path,item]));
  const rivalry=decodeDocument(byPath.get(`rivalries/${R}`).fields);
  assert.equal(rivalry.data.connectionState,"active","the saved Showdown is still live");
  const slot=role=>rivalry.data.managerSlots.find(item=>item.slotId===role);
  const A=slot("playerOne").accountId,B=slot("playerTwo").accountId;
  const deviceOf=uid=>{const found=fixture.documents.filter(item=>item.path.startsWith(`accounts/${uid}/devices/`));assert.equal(found.length,1,`one device for ${uid}`);return found[0].path.split("/").pop();};
  const DA=deviceOf(A),DB=deviceOf(B);
  const oldSessionPath=fixture.documents.find(item=>item.path.startsWith(`rivalries/${R}/sessions/`)).path,S1=oldSessionPath.split("/").pop();
  assert.ok(byPath.has(`rivalries/${R}/seasonCommits/season_1`)&&!byPath.has(`rivalries/${R}/seasonCommits/season_2`)&&!byPath.has(`rivalries/${R}/transferChallenges/season_2`),"season 1 committed, season 2 not started");
  for(const role of ["playerOne","playerTwo"]){const stored=decodeDocument(byPath.get(`rivalries/${R}/seasonResults/season_1/roles/${role}`).fields).result;assert.deepEqual(Object.keys(stored),SEVEN,`r79 ${role} result is the 7-key shape`);assert.deepEqual(stored,R79_SEASON_1[role==="playerOne"?"daniel":"nik"],`r79 ${role} season 1 inputs`);}
  ok("F","fixture: r79 3-season Showdown, season 1 committed (7-key results), still live");

  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules}});
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const item of fixture.documents)await setDoc(doc(db,...item.path.split("/")),decodeDocument(item.fields));});
    ok("S",`${fixture.documents.length} r79 documents loaded (composed Rules active)`);
    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
    const season1Paths=fixture.documents.map(item=>item.path).filter(p=>/\/(seasonResults|seasonCommits|transferChallenges)\/season_1(\/|$)/.test(p));
    const before={};for(const p of season1Paths)before[p]=canonical((await assertSucceeds(getDoc(doc(dbA,...p.split("/"))))).data());

    // The r79 session has expired (moved on the clock by re-sealing it, as Job 31 does); a fresh one is hosted and joined for real.
    const realNow=Date.now(),oldSession=decodeDocument(byPath.get(oldSessionPath).fields);
    await env.withSecurityRulesDisabled(async context=>{const lastActivityAt=Timestamp.fromMillis(realNow-60000);await setDoc(doc(context.firestore(),"rivalries",R,"sessions",S1),await Sessions.buildEnvelope({sessionId:S1,revision:oldSession.revision,parentRevision:oldSession.parentRevision,priorContentHash:oldSession.priorContentHash,updatedAt:lastActivityAt,accountId:oldSession.updatedByAccountId,deviceId:oldSession.updatedByDeviceId,data:{...oldSession.data,createdAt:Timestamp.fromMillis(realNow-4*60*60*1000-120000),expiresAt:Timestamp.fromMillis(realNow-1000),lastActivityAt},cryptoImpl:crypto.webcrypto}));});
    const sessionOptions=(db,uid,deviceId,sessionId,nowEpochMs,ttlMs)=>({user:{uid},firestore:db,firebaseSdk:sdk(),deviceId,rivalryId:R,sessionId,nowEpochMs,cryptoImpl:crypto.webcrypto,...(ttlMs===undefined?{}:{ttlMs})});
    const expired=await StandardSessions.expireSession(sessionOptions(dbB,B,DB,S1,Date.now()));assert.equal(expired.ok,true,JSON.stringify(expired));
    const S2=`session_${crypto.randomBytes(32).toString("hex")}`;
    const hosted=await StandardSessions.openSession(sessionOptions(dbA,A,DA,S2,Date.now(),RemoteJoining.hostSessionTtlMs));assert.equal(hosted.ok,true,JSON.stringify(hosted));
    const joined=await StandardSessions.joinSession(sessionOptions(dbB,B,DB,S2,Date.now()));assert.equal(joined.ok,true,JSON.stringify(joined));assert.equal(joined.state,"active");
    ok("R","the r79 session expired; Daniel hosts a fresh r80 session and Nik joins it");

    const base=(db,uid,deviceId)=>(t=0)=>({user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S2,deviceId,nowEpochMs:Date.now()+t,cryptoImpl:crypto.webcrypto});
    const a=base(dbA,A,DA),b=base(dbB,B,DB);
    const multi0=await Multi.read(a());assert.equal(multi0.ok,true,JSON.stringify(multi0));assert.equal(multi0.state.acceptedSeasons,1);assert.equal(multi0.state.activeSeason,2);
    ok("M","r80 reads the r79 progression: 1 accepted season, season 2 active, no redraw");

    let lastHistory=null,lastMulti=null;
    for(const season of [2,3]){
      const n=season*10;
      let t=await startAfterSpins({...a(),seasonNumber:season,operationId:op("transfer_op_",n+1),baseRevision:0},{...b(),seasonNumber:season});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.requestEndWindow({...a(),seasonNumber:season,operationId:op("transfer_op_",n+2),baseRevision:1});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.requestEndWindow({...b(),seasonNumber:season,operationId:op("transfer_op_",n+3),baseRevision:2});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.lockGuesses({...a(),seasonNumber:season,operationId:op("transfer_op_",n+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.lockGuesses({...b(),seasonNumber:season,operationId:op("transfer_op_",n+5),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.lockSignings({...a(),seasonNumber:season,operationId:op("transfer_op_",n+6),baseRevision:5,signings:[{slot:1,name:`Daniel S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]});assert.equal(t.ok,true,JSON.stringify(t));
      t=await Transfer.lockSignings({...b(),seasonNumber:season,operationId:op("transfer_op_",n+7),baseRevision:6,signings:[{slot:1,name:`Nik S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]});assert.equal(t.ok,true,JSON.stringify(t));assert.equal(t.state.phase,"COMPLETED");
      let r=await Results.publishResult({...a(),seasonNumber:season,operationId:op("season_result_op_",n+1),baseRevision:0,result:R80_SEASONS[season].playerOne});assert.equal(r.ok,true,JSON.stringify(r));
      r=await Results.publishResult({...b(),seasonNumber:season,operationId:op("season_result_op_",n+2),baseRevision:1,result:R80_SEASONS[season].playerTwo});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.state.phase,"RESULTS_READY");
      const storedOwn=(await assertSucceeds(getDoc(doc(dbA,"rivalries",R,"seasonResults",`season_${season}`,"roles","playerOne")))).data().result;
      assert.deepEqual(Object.keys(storedOwn),season===2?[...SEVEN,"europaLeague"]:SEVEN,`S${season}: the stored result carries europaLeague only for the Europa League winner`);
      let c=await Commit.commitSeason({...a(),seasonNumber:season,operationId:op("season_commit_op_",n+1),baseRevision:0});assert.equal(c.ok,true,JSON.stringify(c));
      c=await Commit.acknowledgeSeason({...b(),seasonNumber:season,operationId:op("season_commit_op_",n+2),baseRevision:1});assert.equal(c.ok,true,JSON.stringify(c));
      c=await Commit.acknowledgeSeason({...a(),seasonNumber:season,operationId:op("season_commit_op_",n+3),baseRevision:2});assert.equal(c.ok,true,JSON.stringify(c));assert.equal(c.phase,"ACKNOWLEDGED");
      const sA=await Scoring.read({...a(),seasonNumber:season,teamCount:20}),sB=await Scoring.read({...b(),seasonNumber:season,teamCount:20});
      assert.equal(sA.ok,true,JSON.stringify(sA));assert.deepEqual(sA.scoring,sB.scoring);
      assert.equal(sA.scoring.playerOne.total,SCORES[season].playerOne,`S${season} Daniel`);assert.equal(sA.scoring.playerTwo.total,SCORES[season].playerTwo,`S${season} Nik`);assert.equal(sA.winner,WINNERS[season]);
      assert.equal(sA.scoring.playerOne.europaLeague,season===2?3:undefined,`S${season}: europaLeague:3 only in the Europa League winner's breakdown`);assert.equal(Object.hasOwn(sA.scoring.playerTwo,"europaLeague"),false);
      lastHistory=await History.read({...a(),throughSeason:season});const historyB=await History.read({...b(),throughSeason:season});assert.equal(lastHistory.ok,true,JSON.stringify(lastHistory));assert.deepEqual(lastHistory.projection,historyB.projection);
      lastMulti=await Multi.read(a());assert.equal(lastMulti.ok,true,JSON.stringify(lastMulti));
      ok(`P${season}`,`season ${season} played on r80: ${season===2?"Daniel's Europa League win scores +3":"no Europa League"}; scores ${SCORES[season].playerOne}-${SCORES[season].playerTwo}`);
    }
    const p=lastHistory.projection;
    assert.equal(p.acceptedSeasons,3);assert.deepEqual([1,2,3].map(n=>p.seasonHistory[n-1].playerOne.scoring.total),[5,3,1]);assert.deepEqual([1,2,3].map(n=>p.seasonHistory[n-1].playerTwo.scoring.total),[6,0,9]);
    assert.equal(p.managerRecords.playerOne.totalPoints,TOTALS.playerOne);assert.equal(p.managerRecords.playerTwo.totalPoints,TOTALS.playerTwo);
    const role=r=>({phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot(r).saveId,profileId:slot(r).profileId,managerRole:r}});
    const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:role("playerOne")}),finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:role("playerTwo")});
    assert.deepEqual(finalA,finalB);assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");assert.deepEqual(finalA.managerTotals,TOTALS);
    const intent=Terminal.prepare(finalA,{sessionId:S2});
    const closed=await TerminalProvider.close({...a(),nowEpochMs:Date.now(),intent});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");
    ok("C",`Final Reconciliation and Terminal Close accept the mixed r79/r80 history: ${TOTALS.playerOne}-${TOTALS.playerTwo}`);

    for(const p2 of season1Paths)assert.deepEqual(canonical((await assertSucceeds(getDoc(doc(dbA,...p2.split("/"))))).data()),before[p2],`${p2} is never rewritten`);
    ok("U",`all ${season1Paths.length} r79 season 1 documents are byte-identical after the continuation`);

    for(const [who,db,uid] of [["daniel",dbA,A],["nik",dbB,B]]){
      const read=await Reader.readCompletedShowdown({firestore:db,firebaseSdk:firestoreSdk,user:{uid},rivalryId:R,cryptoImpl:crypto.webcrypto});
      assert.equal(read.status,"completed",`${who}: ${read.status} (${read.code})`);
      assert.deepEqual(read.final.totals,TOTALS);assert.equal(read.final.winner,"playerTwo");assert.equal(read.final.seasonsPlayed,3);
      const h=read.projection.seasonHistory;
      assert.deepEqual(Object.keys(h[0].playerOne).filter(k=>k!=="scoring"),SEVEN,"r79 season 1 stays 7 keys");
      assert.equal(h[1].playerOne.europaLeague,true);assert.equal(h[1].playerOne.scoring.europaLeague,3);assert.equal(Object.hasOwn(h[2].playerOne,"europaLeague"),false);
      assert.equal(read.projection.managerRecords.playerOne.europaLeagues,1);assert.equal(read.projection.managerRecords.playerTwo.europaLeagues,0);
      assert.equal(read.projection.managerRecords.playerOne.totalTrophies,1+1+1,"Daniel: league title (S1) + Europa League (S2) + cup (S3)");
      assert.equal(read.projection.managerRecords.playerTwo.totalTrophies,2+1,"Nik: Champions League (S1, S3) + league title (S3)");
      Loader.clearClosedShowdownCache();
      const loaded=await Loader.loadClosedShowdownCareer({firestore:db,firebaseSdk:firestoreSdk,user:{uid},cryptoImpl:crypto.webcrypto});
      assert.equal(loaded.status,"ready",`${who}: career ${loaded.status}`);const entry=loaded.entries.find(item=>item.rivalryId===R);assert.equal(entry&&entry.classification,"completed");
      const m=loaded.model.managers;
      assert.equal(m.daniel.europaLeagues,1);assert.equal(m.nik.europaLeagues,0);assert.equal(m.daniel.championsLeagues,0);assert.equal(m.nik.championsLeagues,2);
      assert.equal(m.daniel.totalTrophies,3);assert.equal(m.nik.totalTrophies,3);assert.equal(m.daniel.careerPoints,TOTALS.playerOne);assert.equal(m.nik.careerPoints,TOTALS.playerTwo);
      assert.equal(loaded.model.trophyRoom.cabinet.daniel.europaLeagues,1);
      ok(`V.${who}`,`${who}: the completed reader and career loader re-verify all 3 seasons (totals ${TOTALS.playerOne}-${TOTALS.playerTwo}, Daniel 1 Europa League)`);
    }
    const stranger=env.authenticatedContext("acct_stranger_not_in_fixture").firestore();
    await assertFails(getDoc(doc(stranger,"rivalries",R,"seasonResults","season_2","roles","playerOne")));
    ok("X","a signed-in stranger cannot read the Europa League season");
  }finally{await env.cleanup();}
  process.stdout.write(`PASS r79 Showdown continues on r80: ${checks} numbered checks (r79 season 1 + r80 seasons 2-3 with a Europa League win, closed and re-verified).\n`);
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
