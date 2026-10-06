const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const cryptoImpl=require('node:crypto').webcrypto;
const resultsModule=require(path.join(root,'js/sharedSeasonResults.js'));
const commitModule=require(path.join(root,'js/sharedSeasonCommit.js'));
const scoringModule=require(path.join(root,'js/sharedCanonicalScoring.js'));
const historyModule=require(path.join(root,'js/sharedHistoryConvergence.js'));
const multiModule=require(path.join(root,'js/sharedMultiSeasonProgression.js'));
const localModule=require(path.join(root,'js/sharedLocalReconciliation.js'));
const finalModule=require(path.join(root,'js/sharedFinalReconciliation.js'));
const terminalModule=require(path.join(root,'js/sharedTerminalClose.js'));
const pair='pair_'+'a'.repeat(64),save='save_'+'b'.repeat(24);
const p1='profile_'+'c'.repeat(24),p2='profile_'+'d'.repeat(24);
const fact={leaguePosition:2,leaguePoints:90,leagueGoals:80,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
const operation=(prefix,n)=>prefix+n.toString(16).padStart(32,'0');
async function fixture(totalSeasons=10){
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,
    confirmedRoles:['playerOne','playerTwo'],leagueId:'premier_league',clubs:{playerOne:'A',playerTwo:'B'}};
  const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
  const results=await resultsModule.createProtocol({teamCount:20,cryptoImpl});
  const commit=await commitModule.createProtocol({teamCount:20,cryptoImpl});
  const scoring=await scoringModule.createProtocol({teamCount:20,cryptoImpl});
  const seasons=[],states=[];
  for(let seasonNumber=1;seasonNumber<=totalSeasons;seasonNumber++){
    const transferChallenge={phase:'COMPLETED',revision:6,seasonNumber};
    const options={setup,careerStart,transferChallenge,seasonNumber};
    const firstCommand={type:'publish-result',operationId:operation('season_result_op_',seasonNumber*2),baseRevision:0,result:fact};
    const first=await results.apply({...options,actorRole:'playerOne',command:firstCommand});
    const second=await results.apply({...options,state:first.state,actorRole:'playerTwo',command:{type:'publish-result',operationId:operation('season_result_op_',seasonNumber*2+1),baseRevision:1,result:fact}});
    const commitOptions={setup,seasonResults:second.state,seasonNumber};
    const committed=await commit.apply({...commitOptions,actorRole:'playerOne',command:{type:'commit-season',operationId:operation('season_commit_op_',seasonNumber*3),baseRevision:0}});
    const acknowledgedOne=await commit.apply({...commitOptions,state:committed.state,actorRole:'playerOne',command:{type:'acknowledge-season',operationId:operation('season_commit_op_',seasonNumber*3+1),baseRevision:1}});
    const acknowledgedTwo=await commit.apply({...commitOptions,state:acknowledgedOne.state,actorRole:'playerTwo',command:{type:'acknowledge-season',operationId:operation('season_commit_op_',seasonNumber*3+2),baseRevision:2}});
    const reconciled=await scoring.reconcile({seasonCommit:acknowledgedTwo.state});
    seasons.push({commit:{ok:true,committed:true,...commit.projectForRole(acknowledgedTwo.state,'playerOne')},scoring:{ok:true,authoritative:true,...scoring.projectForRole(reconciled,'playerOne'),resultsRevision:2,resultsContentHash:second.state.contentHash}});
    states.push({options,firstCommand,first,second,commitOptions,committed,acknowledgedOne,acknowledgedTwo});
  }
  const slots=[{slotId:'playerOne',accountId:'daniel',profileId:p1,saveId:save,entitlementState:'active'},
    {slotId:'playerTwo',accountId:'nik',profileId:p2,saveId:save,entitlementState:'active'}];
  const projection=historyModule.buildProjection({rivalryId:pair,setup,managerSlots:slots,seasons});
  historyModule.verifyProjection(projection);
  const history={authoritative:true,phase:'HISTORY_CONVERGED',rivalryId:pair,projection};
  const multi={ok:true,authoritative:true,phase:'SHOWDOWN_COMPLETE',rivalryId:pair,state:multiModule.createProtocol().derive({rivalryId:pair,setup,history:projection})};
  const local=localModule.project({sharedActive:true,history,connected:{connected:true,attached:true,rivalryId:pair,binding:{saveId:save,profileId:p1,managerRole:'playerOne'},observedEnvelope:{revision:0,contentHash:'sha256:'+'e'.repeat(64),lifecycleState:'live'}}});
  const final=finalModule.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:local});
  const terminal={phase:'CLOSED',terminal:true,rivalryId:pair,terminalWitness:terminalModule.prepare(final,{sessionId:'session_'+'f'.repeat(64)})};
  return {root,results,commit,history,multi,local,final,terminal,states};
}
module.exports={fixture};
