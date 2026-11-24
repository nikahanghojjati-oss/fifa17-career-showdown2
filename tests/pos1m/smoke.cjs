"use strict";
// POS1M day-one smoke: the provider lifecycle (tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs, minus its
// Rules denials) played one call at a time on the stand-in, no faults. Proves the real providers run on it.
const assert=require("node:assert/strict");
const path=require("node:path");
const {Sim}=require("./sim.cjs");
const W=require("./world.cjs");
const P=n=>require(path.join(W.ROOT,"js",n));
const Setup=P("sparkSharedShowdownSetup.js"),Career=P("sparkSharedCareerStart.js"),Transfer=P("sparkSharedTransferChallenge.js"),Results=P("sparkSharedSeasonResults.js"),Commit=P("sparkSharedSeasonCommit.js"),Scoring=P("sparkSharedCanonicalScoring.js"),History=P("sparkSharedHistoryConvergence.js"),Multi=P("sparkSharedMultiSeasonProgression.js");

const op=(prefix,n)=>prefix+Number(n).toString(16).padStart(32,"0");
async function story(world,seasons){
  const phones={};
  for(const role of W.ROLES)phones[role]={role,deviceId:W.DEVICE[role],client:world.server.client({uid:W.ACCOUNT[role],label:role})};
  const a=extra=>W.providerOptions(world,phones.playerOne,extra),b=extra=>W.providerOptions(world,phones.playerTwo,extra);
  const must=(label,value)=>{assert.equal(value&&value.ok,true,`${label}: ${JSON.stringify(value)}`);return value;};
  let n=0;
  for(const [type,base,extra] of [["open",0,{}],["commit-league",1,{}],["commit-clubs",2,{}],["commit-length",3,{totalSeasons:seasons}]])must(`setup ${type}`,await Setup.mutate(a({type,baseRevision:base,operationId:op("setup_op_",++n),...extra})));
  must("confirm A",await Setup.mutate(a({type:"confirm",baseRevision:4,operationId:op("setup_op_",++n)})));
  must("confirm B",await Setup.mutate(b({type:"confirm",baseRevision:5,operationId:op("setup_op_",++n)})));
  must("career A",await Career.acknowledge(a({operationId:op("career_start_op_",1),baseRevision:0})));
  must("career B",await Career.acknowledge(b({operationId:op("career_start_op_",2),baseRevision:1})));
  const totals={playerOne:0,playerTwo:0};
  for(let season=1;season<=seasons;season+=1){
    const s=season*10;
    for(const [opts,role] of [[a,"playerOne"],[b,"playerTwo"]])must(`spun ${role}`,await Transfer.markSpun(opts({seasonNumber:season,managerRole:role})));
    must("start",await Transfer.startWindow(a({seasonNumber:season,operationId:op("transfer_op_",s+1),baseRevision:0})));
    must("end A",await Transfer.requestEndWindow(a({seasonNumber:season,operationId:op("transfer_op_",s+2),baseRevision:1})));
    must("end B",await Transfer.requestEndWindow(b({seasonNumber:season,operationId:op("transfer_op_",s+3),baseRevision:2})));
    must("guess A",await Transfer.lockGuesses(a({seasonNumber:season,operationId:op("transfer_op_",s+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]})));
    must("guess B",await Transfer.lockGuesses(b({seasonNumber:season,operationId:op("transfer_op_",s+5),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"germany"}]})));
    must("sign A",await Transfer.lockSignings(a({seasonNumber:season,operationId:op("transfer_op_",s+6),baseRevision:5,signings:[{slot:1,name:`Daniel S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]})));
    must("sign B",await Transfer.lockSignings(b({seasonNumber:season,operationId:op("transfer_op_",s+7),baseRevision:6,signings:[{slot:1,name:`Nik S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]})));
    const r1={leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:season%2===0,championsLeague:false,topScorer:true,topAssist:false};
    const r2={leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:season%2===1,topScorer:false,topAssist:true};
    must("publish A",await Results.publishResult(a({seasonNumber:season,operationId:op("season_result_op_",s+1),baseRevision:0,result:r1})));
    must("publish B",await Results.publishResult(b({seasonNumber:season,operationId:op("season_result_op_",s+2),baseRevision:1,result:r2})));
    must("commit",await Commit.commitSeason(a({seasonNumber:season,operationId:op("season_commit_op_",s+1),baseRevision:0})));
    must("ack B",await Commit.acknowledgeSeason(b({seasonNumber:season,operationId:op("season_commit_op_",s+2),baseRevision:1})));
    must("ack A",await Commit.acknowledgeSeason(a({seasonNumber:season,operationId:op("season_commit_op_",s+3),baseRevision:2})));
    const score=must("score",await Scoring.read(a({seasonNumber:season,teamCount:20})));
    totals.playerOne+=score.scoring.playerOne.total;totals.playerTwo+=score.scoring.playerTwo.total;
    const history=must("history",await History.read(a({throughSeason:season})));
    assert.equal(history.projection.acceptedSeasons,season);
    assert.equal(history.projection.managerRecords.playerOne.totalPoints,totals.playerOne);
    const multi=must("multi",await Multi.read(b()));
    assert.equal(multi.state.terminal,season===seasons);
  }
  return totals;
}

async function runOnce(seed,seasons){
  const sim=new Sim(seed);sim.install();
  const world=W.makeWorld(sim);
  let done=false,error=null,value=null;
  story(world,seasons).then(v=>{value=v;done=true;},e=>{error=e;done=true;});
  const status=await sim.run(()=>done);
  sim.uninstall();
  if(error)throw error;
  if(status!=="done")throw new Error(`story did not finish: ${status}`);
  return {value,meter:world.server.meter,virtualMs:sim.now-sim.epochMs,steps:sim.steps};
}

(async()=>{
  const seasons=Number(process.env.POS1M_SEASONS||3);
  const first=await runOnce(1,seasons);
  const again=await runOnce(1,seasons);
  assert.deepEqual(again.value,first.value,"same seed, same story");
  const runs=Number(process.env.POS1M_RUNS||10);
  const started=process.hrtime.bigint();
  for(let i=0;i<runs;i+=1)await runOnce(100+i,seasons);
  const ms=Number(process.hrtime.bigint()-started)/1e6/runs;
  console.log(JSON.stringify({seasons,totals:first.value,meter:first.meter,virtualMs:first.virtualMs,steps:first.steps,msPerStory:Number(ms.toFixed(2))}));
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
