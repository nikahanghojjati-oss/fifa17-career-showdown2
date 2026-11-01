'use strict';
// r87 Prime Pack totals (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4 for
// Prime Pack), so its Golden Showdown is 150 over ten seasons and its race counts 15 a season left; a Showdown confirmed
// before Prime Pack keeps 11 a season and 110. Pins: one boundary everywhere (js/iconGuess.js fromMs), the seam's season
// maximum and Golden total (Trophy Room, Career Statistics, Legacy, Rivalry Statistics), the Gazette race strip and Golden
// draw, and the commentary engine's maximum, clinched and Golden lines.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const IG=require('../../js/iconGuess.js');
const G=require('../../js/touchlineGazette.js');
const CE=require('../../js/commentaryEngine.js');
const Career=require('../../js/sharedCareerAnalytics.js');
const CareerScreens=require('../../js/careerScreensV10.js');
const RivalryLegacy=require('../../js/rivalryLegacyV10.js');
const {projection,result,finalFor,score}=require('../support/career-fixture-helpers.cjs');
require('../../data/gazetteCopy.js');require('../../data/frontPages.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const plain=value=>JSON.parse(JSON.stringify(value));
function loadSeam(extra={}){
  const context={console,...extra};context.globalThis=context;vm.createContext(context);
  vm.runInContext(read('js/careerScreenSeam.js'),context,{filename:'js/careerScreenSeam.js'});
  return context.CareerModeCareerScreenSeam;
}
const Seam=loadSeam();
const AFTER=IG.fromMs+60_000,BEFORE=IG.fromMs-60_000;
const perfect=(pack)=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true,...(pack?{primePack:pack}:{})}); // 11 + pack
const plainSeason=()=>result({leaguePosition:4,leaguePoints:70});

// T1 one boundary: the seam and the Gazette start Prime Pack totals where the round itself starts.
assert.equal(Seam.PRIME_PACK_FROM_MS,IG.fromMs,'the seam boundary is js/iconGuess.js fromMs');
assert.match(read('js/touchlineGazette.js'),new RegExp(`PRIME_PACK_FROM_MS=Date\\.parse\\("${new Date(IG.fromMs).toISOString().replace('.000Z','Z').replace(/[.]/g,'\\.')}"\\)`),'the Gazette boundary is js/iconGuess.js fromMs');
assert.match(read('js/sharedCareerAnalytics.js'),new RegExp(`PRIME_PACK_FROM_MS=Date\\.parse\\("${new Date(IG.fromMs).toISOString().replace('.000Z','Z').replace(/[.]/g,'\\.')}"\\)`),'the Career Stats boundary is js/iconGuess.js fromMs');
assert.match(read('js/productionSharedTransferChallenge.js'),new RegExp(`PRIME_PACK_FROM_MS=Date\\.parse\\("${new Date(IG.fromMs).toISOString().replace('.000Z','Z').replace(/[.]/g,'\\.')}"\\)`),'the transfer hook boundary is js/iconGuess.js fromMs');
assert.match(read('js/productionSharedSeasonResults.js'),new RegExp(`PRIME_PACK_FROM_MS=Date\\.parse\\("${new Date(IG.fromMs).toISOString().replace('.000Z','Z').replace(/[.]/g,'\\.')}"\\)`),'the Season Results boundary (old Showdowns never load the step) is js/iconGuess.js fromMs');
{const src=read('js/productionSharedSeasonResults.js'),fn=src.slice(src.indexOf('async function pssrWithPrimePack('));assert.ok(fn.indexOf('confirmedAtMs<PRIME_PACK_FROM_MS')>0&&fn.indexOf('confirmedAtMs<PRIME_PACK_FROM_MS')<fn.indexOf('loadRuntimeScript'),'a Showdown from before Prime Pack publishes its Season Result without loading the Prime Pack step or reading a round');}
assert.deepEqual(plain(Seam.SEASON_MAX),{before:11,primePack:15});assert.equal(IG.maxPoints+11,15);
ok('T1','the seam, the Gazette and the transfer hook use the round\'s own start boundary, and 11 + 4 = 15 a season');

// T2 the season maximum and the Golden total per Showdown
const id='pair_'+'c'.repeat(64);
assert.equal(Seam.seasonMaxFor({rivalryId:id,setupConfirmedAt:AFTER}),15);
assert.equal(Seam.seasonMaxFor({rivalryId:id,setupConfirmedAt:BEFORE}),11,'a Showdown confirmed before Prime Pack keeps 11');
assert.equal(Seam.seasonMaxFor({rivalryId:id,setupConfirmedAt:null,seasons:[{score:{daniel:12,nik:3}}]}),15,'a season over 11 can only be Prime Pack');
assert.equal(Seam.seasonMaxFor({rivalryId:id,setupConfirmedAt:null,seasons:[{score:{daniel:11,nik:3}}]}),11,'no confirm time and no season over 11: 11');
const live=loadSeam({CareerModeProductionSharedShowdownSetup:{getState:()=>({ready:true,rivalryId:id,setupUpdatedAtMs:AFTER,setup:{phase:'SHOWDOWN_CONFIRMED'}})}});
assert.equal(live.seasonMaxFor({seasons:[]}),15,'the live Showdown\'s Setup decides when the row has no confirm time');
assert.equal(live.seasonMaxFor({rivalryId:'pair_'+'d'.repeat(64),seasons:[]}),11,'another Showdown\'s row never borrows the live Setup');
assert.equal(Seam.goldenShowdownPoints({rivalryId:id,setupConfirmedAt:AFTER}),150);assert.equal(Seam.goldenShowdownPoints({rivalryId:id,setupConfirmedAt:BEFORE}),110);
ok('T2','the season maximum is 15 for a Showdown that plays Prime Pack and 11 before it, so the Golden Showdown is 150 or 110');

// T3 the career screens: a Prime Pack Showdown on 150 earns it, on 110 it does not; an older Showdown on 110 still does.
function showdown(seed,seasons,confirmedAt){
  const p=projection({seed,totalSeasons:10,seasons});
  return {rivalryId:p.rivalryId,classification:'completed',projection:p,final:finalFor(p),setupConfirmedAt:confirmedAt};
}
const career=list=>Career.buildCareerModel({indexStatus:'ready',showdowns:list});
const golden150=showdown('a',Array.from({length:10},()=>[plainSeason(),perfect(4)]),AFTER);
assert.equal(golden150.projection.managerRecords.playerTwo.totalPoints,150);
const only110=showdown('b',Array.from({length:10},()=>[plainSeason(),perfect()]),AFTER);
const old110=showdown('e',Array.from({length:10},()=>[plainSeason(),perfect()]),BEFORE);
const model=career([golden150,only110,old110]);
const rows=model.history.showdowns;
assert.deepEqual(rows.map(row=>plain(Seam.goldenShowdownManagers(row))),[['nik'],[],['nik']]);
const room=plain(CareerScreens.toV10Frame(model,'trophyRoom')),stats=plain(CareerScreens.toV10Frame(model,'careerStatistics')),legacy=plain(RivalryLegacy.toV10Frame(model,'legacy'));
assert.deepEqual(room.goldenShowdowns,{daniel:0,nik:2},'Trophy Room counts the 150 and the older 110, not a Prime Pack 110');
assert.deepEqual(stats.goldenShowdowns,{daniel:0,nik:2},'Career Statistics agrees');
const nikRecord=Object.values(model).map(v=>v&&v.nik).find(v=>v&&Number.isInteger(v.perfectSeasons));
assert.equal(nikRecord.perfectSeasons,20,'a perfect season is 15 with Prime Pack (10) and 11 before it (10); an 11 with Prime Pack is not perfect');
assert.deepEqual(legacy.showdowns.map(s=>s.goldenShowdown),[['nik'],undefined,['nik']],'Legacy marks the same Showdowns');
assert.deepEqual(plain(RivalryLegacy.toV10Frame(career([only110]),'rivalryStatistics')).goldenShowdown,undefined,'Rivalry Statistics: 110 with Prime Pack is not Golden');
assert.deepEqual(plain(RivalryLegacy.toV10Frame(career([golden150]),'rivalryStatistics')).goldenShowdown,['nik']);
ok('T3','Trophy Room, Career Statistics, Legacy and Rivalry Statistics give the Golden Showdown at 150 with Prime Pack and keep 110 for older Showdowns; a perfect season is the Showdown\'s own maximum');

// T4 the Gazette race strip and the Golden draw
{
  const p=projection({seed:'1',totalSeasons:3,seasons:[[perfect(4),plainSeason()],[perfect(4),plainSeason()]]});
  const pack=G.seasonEdition({projection:p,seasonNumber:2,primePack:true}).paper.race.line;
  assert.equal(pack,'Daniel is 30 clear with only 15 points left to play for: the Showdown can no longer be caught.');
  const q=projection({seed:'2',totalSeasons:3,seasons:[[perfect(),plainSeason()],[result({leaguePosition:4,leaguePoints:70,primePack:1}),plainSeason()]]});
  assert.equal(q.managerRecords.playerOne.totalPoints,12);
  const open=G.seasonEdition({projection:q,seasonNumber:2,primePack:true}).paper.race.line;
  assert.equal(open,'Daniel leads by 12 points. 1 season to go, 15 points still to play for on each side.','a 12-point lead with Prime Pack is still catchable');
  const old=projection({seed:'3',totalSeasons:3,seasons:[[perfect(),plainSeason()],[result({leaguePosition:1}),plainSeason()]]});
  assert.match(G.seasonEdition({projection:old,seasonNumber:2,primePack:false}).paper.race.line,/14 clear with only 11 points left/,'an older Showdown still counts 11');
  assert.match(G.seasonEdition({projection:old,seasonNumber:2,primePack:true}).paper.race.line,/leads by 14 points\. 1 season to go, 15 points/,'the same scores with Prime Pack are still open');
  assert.match(G.seasonEdition({projection:q,seasonNumber:2}).paper.race.line,/15 points still to play/,'no confirm time: a season over 11 means Prime Pack');
  // the Golden draw: 150-150 with Prime Pack, and 110-110 with Prime Pack is just a draw
  const draw150=projection({seed:'4',totalSeasons:10,seasons:Array.from({length:10},()=>[perfect(4),perfect(4)])});
  const ge=G.finalEdition({projection:draw150,primePack:true});
  assert.match(ge.paper.race.line,/Level on 150 points each after 10 seasons: a drawn Showdown, and a Golden Showdown for both\./);
  assert.ok(ge.paper.briefs.every(b=>b.head==='Golden Showdown'&&/reaches 150 points/.test(b.text)));
  const draw110=projection({seed:'5',totalSeasons:10,seasons:Array.from({length:10},()=>[perfect(),perfect()])});
  assert.match(G.finalEdition({projection:draw110,primePack:true}).paper.race.line,/a drawn Showdown, honours even/,'110-110 with Prime Pack is not Golden');
  assert.match(G.finalEdition({projection:draw110,primePack:false}).paper.race.line,/a Golden Showdown for both/,'110-110 before Prime Pack still is');
  assert.match(G.paperText(G.seasonEdition({projection:p,seasonNumber:2,primePack:true})),/Perfect 15s: Daniel 2/,'the record book counts perfect 15s');
}
ok('T4','the Gazette race strip counts 15 a season left with Prime Pack ("can no longer be caught" only past 15 x seasons left), and its Golden draw is 150-150');

// T5 the commentary engine
{
  const managers={playerOne:{name:'Daniel',club:'Arsenal'},playerTwo:{name:'Nik',club:'Chelsea'}};
  const season=(a,b)=>({results:{playerOne:a,playerTwo:b},scoring:{playerOne:score(a),playerTwo:score(b)},teamCount:20});
  const results=[season(perfect(),plainSeason()),season(result({leaguePosition:4,leaguePoints:70,primePack:1}),plainSeason())];
  const has=(facts,moment,situation)=>CE.situationsFor(moment,facts).some(e=>e.situation===situation);
  const facts=pack=>({managers,seasons:3,season:2,results,...(pack===undefined?{}:{primePack:pack})});
  assert.ok(has(facts(false),'season-result','clock-clinched'),'11 a season: a 12-point lead with one season left is clinched');
  assert.ok(!has(facts(true),'season-result','clock-clinched'),'15 a season: it is not');
  assert.ok(!has(facts(undefined),'season-result','clock-clinched'),'a season over 11 means Prime Pack');
  const max=[season(perfect(4),plainSeason())];
  assert.ok(has({managers,seasons:3,season:1,results:max,primePack:true},'season-result','season-perfect'),'15 is the maximum with Prime Pack');
  assert.ok(!has({managers,seasons:3,season:1,results:[season(perfect(),plainSeason())],primePack:true},'season-result','season-perfect'),'11 is not the maximum with Prime Pack');
  const ten=pack=>Array.from({length:10},()=>season(perfect(pack),plainSeason()));
  assert.ok(has({managers,seasons:10,results:ten(4),primePack:true},'final','final-golden'),'150 is the Golden Showdown');
  assert.ok(!has({managers,seasons:10,results:ten(),primePack:true},'final','final-golden'),'110 with Prime Pack is not');
  assert.ok(has({managers,seasons:10,results:ten(),primePack:false},'final','final-golden'),'110 before Prime Pack still is');
}
ok('T5','commentary: "maximum", "clinched" and Golden lines use 15 a season with Prime Pack and 11 before it');

// T6 the Rule Book
const rb=read('js/ruleBook.js');
assert.match(rb,/<span>MAXIMUM PER MANAGER \/ SEASON<\/span><strong>15<\/strong>/);
assert.match(rb,/"Score 150 points in a 10-season Showdown \(15 in every season\) to win the gold trophy\."/);
ok('T6','the Rule Book says 15 a season and 150 for the Golden Showdown (110 for older Showdowns)');

console.log(`PASS r87 Prime Pack totals contracts (${checks} checks)`);

// Nik 2026-11-01 17:35 UTC: a perfect season is 15 and the Golden Showdown is 150; no real 10-season Showdown was ever
// played before Prime Pack, so no 110 record is kept and no screen labels a perfect season as 11 points.
for(const f of ["js/statistics.js","js/trophyRoom.js","js/ruleBook.js"]){
  const src=fs.readFileSync(require("node:path").join(__dirname,"..","..",f),"utf8");
  assert.doesNotMatch(src,/11-Point Seasons|11-point seasons|"11 points"|needs 110/,`${f} labels a perfect season as 15 points, never 11, and keeps no 110 line`);
}
