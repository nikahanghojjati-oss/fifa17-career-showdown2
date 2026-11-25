'use strict';
// r100 Phoenix B5: a played Showdown's shared documents, written in the shape the shared modules write them (js/sparkShared*.js),
// in the order a phone would see them, with a sentinel in EVERY private field: strings carry "ZQ", numbers are 97xx. The Flight
// Recorder's privacy proof (tests/contracts/r100-flight-recorder-contracts.cjs, tests/browser/r100-flight-recorder-gallery.cjs)
// checks that no sentinel ever reaches the recorder's journal, its saved copy or the page it draws.
const RID='pair_'+'3'.repeat(64);
const T0=Date.UTC(2026,10,26,19,0,0);
const ts=ms=>({toMillis:()=>ms});
// In a browser page (page.evaluate) a Timestamp travels as {seconds, nanoseconds}.
const plainStamp=ms=>({seconds:Math.floor(ms/1000),nanoseconds:(ms%1000)*1e6});
// Sentinels: every private string carries "ZQ", every private number is 97xx. Neither appears in any public field.
const SECRET=/ZQ|\b97\d\d\b/;
function showdown(seasons=3,{rivalryId=RID,start=T0,stamp=ts}={}){
  const RID_=rivalryId;
  const docs={};let clock=start;const tick=()=>(clock+=37_000);
  const steps=[];
  const put=(path,data)=>{docs[path]=data;steps.push({path,data:JSON.parse(JSON.stringify(data,(k,v)=>v&&typeof v.toMillis==='function'?{__ts:v.toMillis()}:v),(k,v)=>v&&v.__ts!==undefined?stamp(v.__ts):v)});};
  const role=r=>r;
  const rivalry=(state,at)=>({schemaVersion:1,objectType:'rivalry',objectId:RID_,revision:state==='closed'?3:2,updatedAt:stamp(at),data:{connectionState:state,managerRoles:{playerOne:'acct-ZQd',playerTwo:'acct-ZQn'},
    terminalProgress:state==='closed'?{managerTotals:{playerOne:9711,playerTwo:9712},acceptedThroughSeason:seasons}:undefined,terminalClose:state==='closed'?{totals:{playerOne:9713}}:undefined}});
  put(`rivalries/${RID_}`,rivalry('active',tick()));
  // set-up: open, league, clubs, length, confirm, confirm
  const setupTypes=['open','commit-league','commit-clubs','commit-length','confirm','confirm'],setupActors=['playerOne','playerOne','playerOne','playerOne','playerOne','playerTwo'];
  for(let r=1;r<=6;r+=1)put(`rivalries/${RID_}/sharedSetup/authoritative`,{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId:RID_,revision:r,phase:'SETUP',coordinatorRole:'playerOne',
    operationIds:setupTypes.slice(0,r).map((_,i)=>`op_ZQsetup${i}`),operationTypes:setupTypes.slice(0,r),baseRevisions:setupTypes.slice(0,r).map((_,i)=>i),actorRoles:setupActors.slice(0,r),
    totalSeasons:seasons,confirmedRoles:setupActors.slice(4,r),leagueId:'ZQ_league',clubs:{playerOne:'ZQ_club_d',playerTwo:'ZQ_club_n'},activeSessionId:'session_ZQ',updatedAt:stamp(tick()),updatedByDeviceId:'device_ZQ'});
  for(let r=1;r<=2;r+=1)put(`rivalries/${RID_}/careerStart/authoritative`,{schemaVersion:1,objectType:'sharedCareerStart',rivalryId:RID_,revision:r,phase:'ACK',setupRevision:6,setupOperationIds:['op_ZQ'],totalSeasons:seasons,
    acknowledgedRoles:['playerOne','playerTwo'].slice(0,r),operationIds:['op_ZQcs0','op_ZQcs1'].slice(0,r),baseRevisions:[0,1].slice(0,r),actorRoles:['playerOne','playerTwo'].slice(0,r),startedAt:{playerOne:9721,playerTwo:9722},activeSessionId:'session_ZQ',updatedAt:stamp(tick())});
  for(let s=1;s<=seasons;s+=1){
    // roulette: pre-window document with both spins (private to the roulette until it lands)
    put(`rivalries/${RID_}/transferChallenges/season_${s}`,{schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId:RID_,seasonNumber:s,phase:'NOT_STARTED',spins:{playerOne:{target:'ZQ_spin_d',hole:9731},playerTwo:{target:'ZQ_spin_n',hole:9732}},updatedAt:stamp(tick())});
    const ops=[['start-window','playerOne'],['lock-guesses','playerTwo'],['lock-guesses','playerOne'],['lock-signings','playerOne'],['lock-signings','playerTwo']];
    const started=tick();
    for(let r=1;r<=ops.length;r+=1){
      const who=ops[r-1][1];
      // the acting manager's private role document lands with the step, before the reveal
      if(ops[r-1][0]!=='start-window')put(`rivalries/${RID_}/transferChallenges/season_${s}/roles/${who}`,{schemaVersion:1,objectType:'sharedTransferChallengeRole',managerRole:role(who),guesses:[{name:'ZQ_guess_'+who,value:9741}],signings:[{name:'ZQ_sign_'+who,fee:9742}],guessSalt:'ZQsalt',signingSalt:'ZQsalt2',guessLockedAt:stamp(tick()),signingLockedAt:null,updatedAt:stamp(clock)});
      put(`rivalries/${RID_}/transferChallenges/season_${s}`,{schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId:RID_,seasonNumber:s,runtimeRevision:'r',coordinatorRole:'playerOne',phase:r===ops.length?'COMPLETED':'WINDOW_OPEN',revision:r,startedAt:stamp(started),endedAt:r===ops.length?stamp(clock):null,
        endRequestedRoles:[],guessLockedRoles:ops.slice(0,r).filter(o=>o[0]==='lock-guesses').map(o=>o[1]),signingLockedRoles:ops.slice(0,r).filter(o=>o[0]==='lock-signings').map(o=>o[1]),
        operationIds:ops.slice(0,r).map((_,i)=>`op_ZQtw${s}${i}`),operationTypes:ops.slice(0,r).map(o=>o[0]),operationHashes:ops.slice(0,r).map(()=>'sha256:ZQ'),baseRevisions:ops.slice(0,r).map((_,i)=>i),actorRoles:ops.slice(0,r).map(o=>o[1]),
        verdict:{playerOne:'ZQ_verdict',points:9743},activeSessionId:'session_ZQ',updatedAt:stamp(r===1?started:tick()),updatedByDeviceId:'device_ZQ'});
    }
    for(const [r,who] of [[1,'playerTwo'],[2,'playerOne']]){
      put(`rivalries/${RID_}/seasonResults/season_${s}/roles/${who}`,{schemaVersion:1,objectType:'sharedSeasonResultRole',managerRole:who,result:{leaguePosition:9751,leaguePoints:9752,leagueGoals:9753,topScorer:'ZQ_scorer'},publishedAt:stamp(tick())});
      put(`rivalries/${RID_}/seasonResults/season_${s}`,{schemaVersion:1,objectType:'sharedSeasonResults',rivalryId:RID_,seasonNumber:s,phase:r===2?'RESULTS_READY':'COLLECTING',revision:r,teamCount:20,publishedRoles:['playerTwo','playerOne'].slice(0,r),
        operationIds:['op_ZQr0','op_ZQr1'].slice(0,r),operationHashes:['sha256:ZQ','sha256:ZQ'].slice(0,r),baseRevisions:[0,1].slice(0,r),actorRoles:['playerTwo','playerOne'].slice(0,r),updatedAt:stamp(clock)});
    }
    for(const [r,who] of [[1,'playerOne'],[2,'playerTwo'],[3,'playerOne']])put(`rivalries/${RID_}/seasonCommits/season_${s}`,{schemaVersion:1,objectType:'sharedSeasonCommit',rivalryId:RID_,seasonNumber:s,phase:r===3?'ACKNOWLEDGED':'COMMITTED',revision:r,resultsRevision:2,
      results:{playerOne:{leaguePoints:9761,total:9762},playerTwo:{leaguePoints:9763,total:9764}},acknowledgedRoles:['playerTwo','playerOne'].slice(0,r-1),operationIds:['op_ZQc0','op_ZQc1','op_ZQc2'].slice(0,r),
      operationHashes:['sha256:ZQ','sha256:ZQ','sha256:ZQ'].slice(0,r),baseRevisions:[0,1,2].slice(0,r),actorRoles:['playerOne','playerTwo','playerOne'].slice(0,r),updatedAt:stamp(tick())});
    put(`rivalries/${RID_}/meters/playerOne`,{schemaVersion:1,game:9771,career:9772,costs:{x:9773}});
    put(`rivalries/${RID_}/sessions/session_ZQ`,{schemaVersion:1,data:{state:'active',managerRole:'playerOne'}});
  }
  put(`rivalries/${RID_}`,rivalry('closed',tick()));
  return {docs,steps};
}
module.exports={RID,T0,ts,plainStamp,SECRET,showdown};
