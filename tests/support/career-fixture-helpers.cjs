"use strict";
const path=require("node:path");
const History=require(path.join(__dirname,"../../js/sharedHistoryConvergence.js"));
function score(r){const championsLeague=r.championsLeague?5:0,leagueTitle=r.leaguePosition===1?3:0,domesticCup=r.domesticCup?1:0,performanceBonus=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,individualAwardsBonus=(r.topScorer||r.topAssist)?1:0;return {championsLeague,leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};}
function winner(a,b){const x=score(a).total,y=score(b).total;if(x>y)return"playerOne";if(y>x)return"playerTwo";if(a.leaguePosition<b.leaguePosition)return"playerOne";if(b.leaguePosition<a.leaguePosition)return"playerTwo";if(a.leaguePoints>b.leaguePoints)return"playerOne";if(b.leaguePoints>a.leaguePoints)return"playerTwo";return"draw";}
function result(o={}){return {leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...o};}
// seasons: array of [danielResult, nikResult]; seed: one hex char making a distinct rivalry id
function projection({seed="1",leagueId="premier_league",totalSeasons=3,seasons}){
  const rivalryId="pair_"+seed.repeat(64);
  const hash=n=>"sha256:"+String(n).padStart(64,"0");
  return History.buildProjection({rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,leagueId,clubs:{playerOne:"club_a",playerTwo:"club_b"}},
    managerSlots:[{slotId:"playerOne",accountId:"acct_daniel",profileId:"profile_"+"a".repeat(24),saveId:"save_"+"a".repeat(24),entitlementState:"active"},{slotId:"playerTwo",accountId:"acct_nik",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"b".repeat(24),entitlementState:"active"}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
// final result for a projection: totals-only winner rule
function finalFor(p){const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw"};}
module.exports={score,winner,result,projection,finalFor};
if(require.main===module){const p=projection({seasons:[[result({leaguePosition:1,leaguePoints:101,championsLeague:true,topScorer:true,topAssist:true,domesticCup:true}),result()],[result(),result({leaguePosition:2})]]});History.verifyProjection(p);console.log(p.acceptedSeasons,p.managerRecords.playerOne.totalPoints,p.managerRecords.playerOne.perfectSeasons,p.seasonHistory[1].winner);}
