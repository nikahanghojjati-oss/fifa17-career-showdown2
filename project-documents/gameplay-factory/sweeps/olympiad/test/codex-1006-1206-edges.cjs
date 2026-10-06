"use strict";
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const root=process.cwd(), requireRepo=createRequire(path.join(root,'tests/contracts/full-gameplay-lifecycle-contracts.cjs'));
const scoring={};vm.createContext(scoring);vm.runInContext(fs.readFileSync(path.join(root,'js/scoring.js'),'utf8'),scoring);
const result=(overrides={})=>({leaguePosition:4,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...overrides});
async function main(){
 const canonical=await require(path.join(root,'js/sharedCanonicalScoring.js')).createProtocol({teamCount:20});
 let combinations=0;
 for(const leaguePosition of [1,2,20])for(const leaguePoints of [0,99,100,114])for(const leagueGoals of [0,99,100,300])for(let flags=0;flags<16;flags++){
  const r=result({leaguePosition,leaguePoints,leagueGoals,championsLeague:!!(flags&1),domesticCup:!!(flags&2),topScorer:!!(flags&4),topAssist:!!(flags&8)});
  const expected=(r.championsLeague?5:0)+(leaguePosition===1?3:0)+(r.domesticCup?1:0)+((leaguePoints>=100||leagueGoals>=100)?1:0)+((r.topScorer||r.topAssist)?1:0);
  assert.equal(scoring.calculatePlayerSeasonScore(r).total,expected);
  assert.equal(canonical.scoreAuthoritativeResults({playerOne:r,playerTwo:r}).scoring.playerOne.total,expected);
  combinations++;
 }
 console.log(`PASS ${combinations} season-score combinations; maximum 11; shared bonuses never double-count`);
 for(const [a,b,w] of [[result({leaguePosition:2}),result({leaguePosition:3}),'playerOne'],[result({leaguePoints:81}),result(),'playerOne'],[result({leagueGoals:100}),result({leagueGoals:110}),'draw'],[result({leaguePoints:0,leagueGoals:0}),result({leaguePoints:0,leagueGoals:0}),'draw']]){
  const projected=canonical.scoreAuthoritativeResults({playerOne:a,playerTwo:b});
  assert.equal(projected.winner,w);
 }
 console.log('PASS tied season score uses league position, then league points; goals do not break the final tie; 0-0 remains valid');
 const original=fs.readFileSync(path.join(root,'tests/contracts/full-gameplay-lifecycle-contracts.cjs'),'utf8');
 const prelude=original.slice(0,original.lastIndexOf('(async()=>{'));
 const chain=new Function('require',prelude+';return {runOnePlan,setResults:fn=>seasonResults=fn}')(requireRepo);
 const varied=[];for(const n of [1,3,5,10])varied.push(await chain.runOnePlan(n));
 assert.equal(varied[3].completedSeasons,10);assert.equal(varied[3].terminalPhase,'TERMINAL_CLOSED');
 console.log('PASS continuous 1/3/5/10-season chains: transfers, results, scoring, history, final result and close; fixed clubs retained; no extra season');
 chain.setResults(()=>({playerOne:{leaguePosition:2,leaguePoints:0,leagueGoals:0,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false},playerTwo:{leaguePosition:3,leaguePoints:0,leagueGoals:0,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}}));
 for(const n of [3,10]){const x=await chain.runOnePlan(n);assert.equal(x.finalWinner,'draw');assert.equal(x.managerTotals.playerOne,0);assert.equal(x.managerTotals.playerTwo,0);console.log(`PASS ${n} seasons at 0-0: season tiebreak wins never add points; final result DRAW`);}
 chain.setResults(()=>({playerOne:{leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false},playerTwo:{leaguePosition:3,leaguePoints:70,leagueGoals:60,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}}));
 const tie=await chain.runOnePlan(3);assert.equal(tie.finalWinner,'draw');assert.equal(tie.managerTotals.playerOne,3);assert.equal(tie.managerTotals.playerTwo,3);console.log('PASS 3-3 final total: DRAW even when Daniel wins every seasonal tiebreak');
}
main().catch(e=>{console.error(e);process.exitCode=1});
