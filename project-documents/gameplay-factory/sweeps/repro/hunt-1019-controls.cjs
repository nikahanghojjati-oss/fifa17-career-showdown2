// Additional hunt controls: real pure modules, no provider or browser writes.
const assert=require('node:assert/strict'),path=require('node:path');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..');
const Results=require(path.join(ROOT,'js/sharedSeasonResults.js'));
const Transfer=require(path.join(ROOT,'js/sharedTransferChallenge.js'));
const Analytics=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const Screens=require(path.join(ROOT,'js/careerScreensV10.js'));
const {result,projection,finalFor}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));
const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons:10,coordinatorRole:'playerOne',confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'a',playerTwo:'b'}};
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
(async()=>{
  const p=await Results.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const apply=(r,overrides={})=>p.apply({setup,careerStart,transferChallenge:{phase:'COMPLETED',seasonNumber:1,revision:7},seasonNumber:1,actorRole:'playerOne',command:{type:'publish-result',operationId:'season_result_op_'+'a'.repeat(32),baseRevision:0,result:r},...overrides});
  for(const field of ['leaguePosition','leaguePoints','leagueGoals'])for(const value of [-1,0.5,1e30,'text'])await assert.rejects(apply(result({[field]:value})));
  await assert.rejects(apply(result({leaguePosition:''})));
  await assert.rejects(apply(result({topScorer:'true'})));
  const one=(await apply(result({leaguePosition:20,leaguePoints:114,leagueGoals:300}))).state;
  assert.equal(p.projectForRole(one,'playerTwo').opponentResult,null);
  assert.equal(p.projectForRole(one,'playerTwo').allResults,null);
  await assert.rejects(apply(result(),{state:one}));
  await assert.rejects(apply(result(),{seasonNumber:11}));
  console.log('CONTROLS: season bounds, negatives, decimals, huge/text values, booleans, privacy, stale revision and season 11 rejected as expected');
  const t=await Transfer.createProtocol({leagueIds:['league'],nationalityIds:['nation'],cryptoImpl:webcrypto});
  let state=null,seq=0;
  const send=async(type,role='playerOne',extra={},now=0)=>{
    const out=await t.apply({state,setup,careerStart,seasonNumber:1,actorRole:role,nowEpochMs:now,command:{type,operationId:'transfer_op_'+(++seq).toString(16).padStart(32,'0'),baseRevision:state?.revision??0,...extra}});state=out.state;return out;
  };
  await send('start-window');
  await assert.rejects(send('advance-expired-window','playerOne',{},899999));
  await send('advance-expired-window','playerOne',{},900000);
  await assert.rejects(send('lock-guesses','playerOne',{guesses:[{slot:1,type:'league',valueId:'unknown'}]},900000));
  await assert.rejects(send('lock-guesses','playerOne',{guesses:Array.from({length:4},(_,i)=>({slot:i+1,type:'league',valueId:'league'}))},900000));
  await send('lock-guesses','playerOne',{guesses:[{slot:1,type:'league',valueId:'league'}]},900000);
  assert.equal(t.projectForRole(state,'playerTwo').inputs.playerOne.guesses,null);
  await send('lock-guesses','playerTwo',{guesses:[]},900000);
  await assert.rejects(send('lock-signings','playerTwo',{signings:[{slot:1,name:'',leagueId:'league',nationalityId:'nation'}]},900000));
  await send('lock-signings','playerOne',{signings:[]},900000);
  await send('lock-signings','playerTwo',{signings:[{slot:1,name:'Player',leagueId:'league',nationalityId:'nation'}]},900000);
  assert.equal(state.phase,'COMPLETED');assert.equal(t.projectForRole(state,'playerOne').verdicts.playerTwo[0].release,true);
  console.log('CONTROLS: Transfer 15-minute boundary, catalog/slot/name validation, hidden guesses, empty locks and matched release verified');
  for(const n of [1,3,5,10]){
    const proj=projection({totalSeasons:n,seasons:Array.from({length:n},()=>[result({domesticCup:true}),result()])});
    const model=Analytics.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:proj.rivalryId,classification:'completed',projection:proj,final:finalFor(proj)}]});
    const stats=Screens.toV10Frame(model,'careerStatistics'),room=Screens.toV10Frame(model,'trophyRoom');
    assert.equal(stats.status,'ready');assert.equal(room.status,'ready');
    assert.equal(model.managers.daniel.seasons,n);assert.equal(stats.managers.daniel.careerPoints,n);
    assert.equal(room.managers.daniel.careerPoints,n);assert.equal(room.managers.daniel.domesticCups,n);
  }
  console.log('CONTROLS: accepted 1/3/5/10-season career points and cups agree across Stats and Trophy Room');
})().catch(e=>{console.error(e);process.exitCode=1;});
