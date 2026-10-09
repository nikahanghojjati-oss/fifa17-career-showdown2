const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const catalog=require('../../js/sharedShowdownCatalog.js').catalog;
const source=fs.readFileSync(path.resolve(__dirname,'../../js/productionSharedSeasonResults.js'),'utf8');

// Evaluate only the production helper, without bootstrapping the browser or Firebase.
const helper=source.match(/^\s*function pssrTeamCount\(\)[^\n]*$/m)?.[0];
assert.ok(helper,'Season Results must define pssrTeamCount');
assert.match(source,/const teamCount=pssrTeamCount\(\),maxPoints=\(teamCount-1\)\*2\*3/,'the points cap must use pssrTeamCount');
function teamCount({state={},viewLeague,setupLeague,clubCatalog=catalog}={}){
  const view={state,setup:viewLeague?{leagueId:viewLeague}:null};
  return vm.runInNewContext(helper+';pssrTeamCount()',{
    view,catalogApi:{catalog:clubCatalog},
    pssrSetupState:()=>({setup:setupLeague?{leagueId:setupLeague}:null})
  });
}

assert.equal(catalog.bundesliga.length,18,'the Bundesliga has 18 clubs');
assert.equal(teamCount({state:{teamCount:18},viewLeague:'premier_league'}),18,'authoritative state wins over a conflicting catalog');
assert.equal(teamCount({state:{teamCount:20},viewLeague:'bundesliga'}),20,'a valid authoritative state wins even in Bundesliga');
assert.equal(teamCount({state:{teamCount:2},viewLeague:'bundesliga'}),2,'the minimum valid state size is 2');
assert.equal(teamCount({state:{teamCount:18},viewLeague:'unrecognized'}),18,'the state must work without a catalog entry');
for(const invalid of [null,0,1,21,18.5,'18']){
  assert.equal(teamCount({state:{teamCount:invalid},viewLeague:'bundesliga'}),18,'invalid state sizes must fall back to the confirmed league catalog');
}
assert.equal(teamCount({viewLeague:'bundesliga'}),18,'an absent state uses the view confirmed league');
assert.equal(teamCount({setupLeague:'bundesliga'}),18,'an absent view league uses confirmed Setup state');
assert.equal(teamCount({viewLeague:'premier_league'}),20,'20-team leagues keep their 114-point cap');
assert.equal(teamCount({viewLeague:'unrecognized'}),20,'an unknown league without state uses the last-resort default');
assert.equal(teamCount({clubCatalog:{}}),20,'missing state and catalog use the last-resort default');
assert.equal((teamCount({viewLeague:'bundesliga'})-1)*2*3,102,'Bundesliga maximum league points is 102');
console.log('PASS JOB-1055: authoritative state teamCount, confirmed catalog fallback, and last-resort default limit Season Results to the league size.');
