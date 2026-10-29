'use strict';
// r86 commentary v2 event detector (Nik 2026-10-28: "every line matches what happened"). js/commentaryEngine.js lists every
// situation of data/commentarySituations.json that is TRUE for a moment, with exactly that situation's slots, and picks one
// unused line deterministically. Pins: every situation fires with every slot filled, each WHEN at its band edges, slots never
// outside the spec, season points only from the canonical scoring, equal totals always a draw, the same line on both phones,
// and no line twice in one Showdown.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const E=require('../../js/commentaryEngine.js');
const Canonical=require('../../js/sharedCanonicalScoring.js');
const MP=require('../../js/marqueePlayer.js');
const List=require('../../data/marqueePlayers.js');
const SPEC=JSON.parse(read('data/commentarySituations.json'));
const Lines=require('../../data/commentaryLines.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// Classic browser scripts, loaded the way the page loads them.
const classic=(file,expose)=>{const box={};vm.runInNewContext(`${read(file)};this.out=${expose};`,box);return box.out;};
const clubsByLeague=classic('data/clubs.js','clubsByLeague');
const legacyScore=classic('js/scoring.js','calculatePlayerSeasonScore');
const aliasSource=/const CLUB_IDENTITY_ALIASES = Object\.freeze\((\{[\s\S]*?\})\);/.exec(read('js/visualIdentity.js'));

(async()=>{
  const protocols={};
  for(const teams of [18,20])protocols[teams]=await Canonical.createProtocol({teamCount:teams,cryptoImpl:globalThis.crypto});

  // ---- fixture helpers ----
  const MANAGERS={playerOne:{name:'Alex',club:'Arsenal',league:'premier_league'},playerTwo:{name:'Sam',club:'Juventus',league:'serie_a'}};
  // A result from a short description: pos, pts, goals, cup, cl, el, ts (top scorer), ta (top assist).
  const R=({pos=5,pts=60,goals=50,cup=false,cl=false,el=false,ts=false,ta=false}={})=>({leaguePosition:pos,leaguePoints:pts,leagueGoals:goals,domesticCup:cup,championsLeague:cl,topScorer:ts,topAssist:ta,...(el?{europaLeague:true}:{})});
  // A season total 0..11 as a typical result (only 0-2 come without a trophy).
  const PTS=[{},{ta:true},{ta:true,goals:100},{el:true},{el:true,ta:true},{cl:true},{cl:true,ta:true},{cl:true,ta:true,goals:100},{cl:true,pos:1},{cl:true,pos:1,cup:true},{cl:true,pos:1,cup:true,ta:true},{cl:true,pos:1,cup:true,ta:true,pts:100}];
  const desc=value=>typeof value==='number'?PTS[value]:value;
  const season=(a,b,teams=20)=>({...protocols[teams].scoreAuthoritativeResults({playerOne:R(desc(a)),playerTwo:R(desc(b))}),teamCount:teams});
  const F=({seasons=3,seq=[],s,managers=MANAGERS,history,specialPlayers,teams=20}={})=>({managers,seasons,season:s===undefined?seq.length:s,results:seq.map(([a,b,t])=>season(a,b,t||teams)),...(history?{history}:{}),...(specialPlayers?{specialPlayers}:{})});
  const run=(moment,facts)=>E.situationsFor(moment,facts);
  const codes=entries=>entries.map(e=>e.situation);
  const of=(entries,situation)=>entries.filter(e=>e.situation===situation);
  const one=(entries,situation,manager)=>{const list=of(entries,situation).filter(e=>manager===undefined||e.slots.manager===manager);assert.equal(list.length,1,`${situation}${manager?' for '+manager:''} fires once in [${codes(entries)}]`);return list[0].slots;};
  const none=(entries,situation,manager)=>assert.equal(of(entries,situation).filter(e=>manager===undefined||e.slots.manager===manager).length,0,`${situation}${manager?' for '+manager:''} must not fire in [${codes(entries)}]`);
  // Slots a situation lists but no true fact can ever fill (season 1 has no leader; different leagues share no league).
  const NEVER={'preview-first-season':['leader','trailer','gap'],'preview-golden':['leader','trailer','gap'],'preview-level':['leader','trailer','gap'],'clubs-different-leagues':['league']};
  const COMPLETE=new Set();
  const complete=(entry)=>{const want=E.situations[entry.situation].filter(k=>!(NEVER[entry.situation]||[]).includes(k));return want.every(k=>typeof entry.slots[k]==='string'&&entry.slots[k].length>0);};
  const ALL=[];
  const seen=(moment,entries)=>{for(const entry of entries){ALL.push({moment,entry});if(complete(entry))COMPLETE.add(entry.situation);}return entries;};
  const at=(moment,facts)=>seen(moment,run(moment,facts));

  // C1 the contract file and the engine agree
  assert.deepEqual(Object.keys(E.situations).sort(),Object.values(SPEC).flatMap(g=>Object.keys(g)).sort());
  for(const [code,group] of Object.entries(SPEC))for(const [situation,row] of Object.entries(group)){
    assert.deepEqual([...E.situations[situation]],row.slots,`${situation} slots`);assert.equal(E.codeOf[situation],code);
    assert.ok(Number.isInteger(row.count)&&row.count>0&&typeof row.when==='string'&&row.when.length>10,situation);
  }
  const ordered=E.moments.flatMap(m=>E.order[m]);
  assert.deepEqual(E.moments,['club-assignment','special-player','season-preview','season-result','final']);
  assert.equal(new Set(ordered).size,ordered.length);assert.deepEqual([...ordered].sort(),Object.keys(E.situations).sort());
  for(const [situation,slots] of Object.entries(E.conditionalSlots))for(const key of slots)assert.ok(E.situations[situation].includes(key),`${situation} conditional ${key}`);
  assert.deepEqual(E.clubAliases,JSON.parse(aliasSource[1].replace(/\s+/g,' ')),'the Special Player club names match js/visualIdentity.js');
  for(const club of Object.values(E.clubAliases))assert.ok(Object.values(clubsByLeague).flat().includes(club),club);
  assert.deepEqual(Object.keys(E.leagues).sort(),Object.keys(clubsByLeague).sort());
  const source=read('js/commentaryEngine.js');
  for(const word of ['Date.now','new Date','Math.random','fetch(','XMLHttpRequest','document.','window.','localStorage','sessionStorage','indexedDB','firebase','getDoc','setDoc','require('])assert.ok(!source.includes(word),`the engine uses no ${word}`);
  for(const [n,o] of [[1,'1st'],[2,'2nd'],[3,'3rd'],[4,'4th'],[10,'10th'],[11,'11th'],[12,'12th'],[13,'13th'],[18,'18th'],[20,'20th'],[21,'21st'],[22,'22nd'],[23,'23rd']])assert.equal(E.ordinal(n),o);
  ok('C1',`all ${ordered.length} situations of data/commentarySituations.json with the same slots, each in exactly one of the 5 moments; pure (no clock, randomness, storage or network)`);

  // C2 season points come only from the canonical scoring
  PTS.forEach((d,n)=>{const row=season(d,0);assert.equal(row.scoring.playerOne.total,n);assert.equal(legacyScore(R(d)).total,n,'js/scoring.js agrees');});
  assert.throws(()=>run('season-result',{managers:MANAGERS,seasons:1,season:1,results:[{results:{playerOne:R(),playerTwo:R()},teamCount:20}]}),/COMMENTARY_SCORING_MISSING/,'no breakdown, no guessing');
  const forged=season(5,4);assert.throws(()=>run('season-result',{managers:MANAGERS,seasons:1,season:1,results:[{...forged,winner:'playerTwo'}]}),/WINNER_MISMATCH/);
  const tied=season(4,4);assert.equal(tied.winner,'draw');assert.throws(()=>run('season-result',{managers:MANAGERS,seasons:1,season:1,results:[{...tied,winner:'playerOne'}]}),/WINNER_MISMATCH/,'equal totals can never carry a winner');
  // A saved round (js/scoring.js shape) works the same as the canonical projection.
  const round={playerOne:{...R(desc(6)),scoring:legacyScore(R(desc(6)))},playerTwo:{...R(desc(4)),scoring:legacyScore(R(desc(4)))},teamCount:20};
  assert.deepEqual(run('season-result',{managers:MANAGERS,seasons:1,season:1,results:[round]}),run('season-result',F({seasons:1,seq:[[6,4]]})));
  // A different points story is ignored: league position, points and goals never decide a season.
  const posOnly=at('season-result',F({seq:[[{pos:2,pts:90,goals:95},{pos:9,pts:40,goals:30}]]}));
  one(posOnly,'season-draw-nil');none(posOnly,'season-win-by-1');none(posOnly,'first-season-won');
  ok('C2','season totals are the breakdown totals of js/sharedCanonicalScoring.js (js/scoring.js agrees), never re-scored; a winner that contradicts equal totals is refused; position, points and goals never decide a season');

  // C3 N1 margins and N2 draws, at every band edge
  const margin=(a,b)=>at('season-result',F({seq:[[a,b]]}));
  let x=margin(5,4);let s=one(x,'season-win-by-1');assert.deepEqual(s,{loser:'Sam',loserClub:'Juventus',loserPoints:'4',margin:'1',season:'1',seasons:'3',winner:'Alex',winnerClub:'Arsenal',winnerPoints:'5'});none(x,'season-win-by-2-3');none(x,'season-shutout');
  x=margin(4,6);s=one(x,'season-win-by-2-3');assert.equal(s.winner,'Sam');assert.equal(s.margin,'2');none(x,'season-win-by-1');
  x=margin(5,2);one(x,'season-win-by-2-3');none(x,'season-win-by-4-6');
  x=margin(5,1);assert.equal(one(x,'season-win-by-4-6').margin,'4');none(x,'season-win-by-2-3');
  x=margin(6,0);one(x,'season-win-by-4-6');one(x,'season-shutout');none(x,'season-win-by-7-plus');
  x=margin(7,0);assert.equal(one(x,'season-win-by-7-plus').margin,'7');none(x,'season-win-by-4-6');assert.equal(one(x,'season-shutout').loserPoints,'0');
  x=margin(1,0);one(x,'season-win-by-1');one(x,'season-shutout');
  x=margin(11,1);one(x,'season-win-by-7-plus');none(x,'season-shutout');
  x=margin(0,0);assert.deepEqual(one(x,'season-draw-nil'),{clubA:'Arsenal',clubB:'Juventus',managerA:'Alex',managerB:'Sam',points:'0',season:'1',seasons:'3'});
  for(const p of [1,4]){x=margin(p,p);assert.equal(one(x,'season-draw-low').points,String(p));none(x,'season-draw-high');none(x,'season-draw-nil');}
  for(const p of [5,11]){x=margin(p,p);one(x,'season-draw-high');none(x,'season-draw-low');}
  for(const [a,b] of [[0,0],[3,3],[5,5],[11,11]]){x=margin(a,b);for(const sit of ['season-win-by-1','season-win-by-2-3','season-win-by-4-6','season-win-by-7-plus','season-shutout','first-season-won','won-season-no-trophy','trophy-but-lost-season','streak-two'])none(x,sit);assert.ok(x.every(e=>!('winner' in e.slots)&&!('loser' in e.slots)),'a drawn season names no winner');}
  x=margin(8,8);assert.deepEqual(one(x,'season-both-big'),{clubA:'Arsenal',clubB:'Juventus',managerA:'Alex',managerB:'Sam',pointsA:'8',pointsB:'8',season:'1'});
  one(margin(9,8),'season-both-big');none(margin(8,7),'season-both-big');none(margin(7,11),'season-both-big');
  x=margin(11,3);s=one(x,'season-perfect','Alex');assert.deepEqual(s,{club:'Arsenal',leagueGoals:'50',leaguePoints:'100',manager:'Alex',position:'1st',rival:'Sam',rivalClub:'Juventus',season:'1',seasonPoints:'11'});none(x,'season-perfect','Sam');
  none(margin(10,3),'season-perfect');
  ok('C3','season margins 1 | 2-3 | 4-6 | 7+ split exactly at 1/2, 3/4 and 6/7; a shutout needs a winner and a 0; draws are nil, 1-4 or 5+, and a draw never fills a winner; both-big needs 8 each; perfect needs 11');

  // C4 N3-N6 one manager's season (one entry per manager it is true for)
  const solo=(d,other={},teams=20)=>at('season-result',F({seq:[[d,other,teams]]}));
  const only=(entries,situation)=>{const slots=one(entries,situation,'Alex');for(const key of E.situations[situation])assert.ok(slots[key],`${situation} ${key}`);return slots;};
  x=solo({cl:true,pos:1,cup:true});only(x,'trophy-treble');for(const sit of ['trophy-cl-and-league','trophy-cl-only','trophy-domestic-double','trophy-league-only','trophy-cup-only'])none(x,sit,'Alex');
  x=solo({cl:true,pos:1});only(x,'trophy-cl-and-league');none(x,'trophy-treble');none(x,'trophy-league-only');
  x=solo({cl:true,pos:2,cup:true});only(x,'trophy-cl-only');none(x,'trophy-cup-only');none(x,'finish-runner-up','Alex');
  x=solo({el:true,pos:1});only(x,'trophy-el-and-league');none(x,'trophy-el-only');none(x,'trophy-league-only');
  x=solo({el:true,pos:1,cup:true});only(x,'trophy-el-and-league');none(x,'trophy-domestic-double');
  x=solo({el:true,pos:6});only(x,'trophy-el-only');none(x,'finish-mid-table','Alex');
  x=solo({pos:1,cup:true});only(x,'trophy-domestic-double');none(x,'trophy-league-only');none(x,'trophy-cup-only');
  x=solo({pos:1});assert.equal(only(x,'trophy-league-only').position,'1st');
  x=solo({cup:true,pos:7});only(x,'trophy-cup-only');none(x,'finish-mid-table','Alex');
  x=solo({pos:2});assert.equal(only(x,'finish-runner-up').position,'2nd');
  x=solo({pos:2,ts:true,pts:100});only(x,'finish-runner-up');
  for(const pos of [3,4]){x=solo({pos});assert.equal(only(x,'finish-top-four').position,E.ordinal(pos));none(x,'finish-runner-up','Alex');none(x,'finish-mid-table','Alex');}
  for(const pos of [5,10]){x=solo({pos});assert.equal(only(x,'finish-mid-table').position,E.ordinal(pos));none(x,'finish-top-four','Alex');none(x,'finish-lower-half','Alex');}
  for(const pos of [11,17]){x=solo({pos});assert.equal(only(x,'finish-lower-half').position,E.ordinal(pos));none(x,'finish-mid-table','Alex');none(x,'finish-bottom-three','Alex');}
  for(const pos of [18,20]){x=solo({pos});assert.equal(only(x,'finish-bottom-three').position,E.ordinal(pos));none(x,'finish-lower-half','Alex');}
  // Bundesliga has 18 clubs: 15th is lower half, 16th is the bottom three.
  x=solo({pos:15},{},18);only(x,'finish-lower-half');none(x,'finish-bottom-three','Alex');
  x=solo({pos:16},{},18);only(x,'finish-bottom-three');none(x,'finish-lower-half','Alex');
  x=solo({pos:18,cup:true});only(x,'finish-bottom-three');only(x,'trophy-cup-only');
  x=solo({ta:true},{});only(x,'won-season-no-trophy');none(x,'won-season-no-trophy','Sam');only(x,'award-top-assist');
  x=solo({goals:100,pts:70},{ta:true});none(x,'won-season-no-trophy');
  x=solo({cup:true},{cl:true});only(x,'trophy-but-lost-season');none(x,'trophy-but-lost-season','Sam');
  x=solo({cup:true},{cup:true});none(x,'trophy-but-lost-season');
  x=solo({pos:9},{ta:true});assert.equal(only(x,'zero-season').seasonPoints,'0');none(x,'zero-season','Sam');
  x=solo({pts:100,pos:2});only(x,'record-hundred-points');none(x,'record-hundred-goals','Alex');none(x,'record-centurion-double','Alex');
  x=solo({pts:99,goals:99});none(x,'record-hundred-points');none(x,'record-hundred-goals');
  x=solo({goals:100});assert.equal(only(x,'record-hundred-goals').leagueGoals,'100');none(x,'record-hundred-points');
  x=solo({pts:100,goals:104,pos:1});only(x,'record-centurion-double');only(x,'record-hundred-points');only(x,'record-hundred-goals');
  x=solo({ts:true});only(x,'award-top-scorer');none(x,'award-top-assist');none(x,'award-both');
  x=solo({ta:true});none(x,'award-top-scorer');
  x=solo({ts:true,ta:true});only(x,'award-both');none(x,'award-top-scorer');none(x,'award-top-assist');
  // both managers can carry the same per-manager fact: one entry each, playerOne first
  x=solo({pos:1},{pos:1});assert.deepEqual(of(x,'trophy-league-only').map(e=>e.slots.manager),['Alex','Sam']);assert.equal(of(x,'trophy-league-only')[1].slots.rival,'Alex');
  ok('C4','trophy, finish, record and award situations each fire for exactly the manager they are true for: 10th vs 11th, 17th vs 18th of 20, 15th vs 16th of 18, 99 vs 100, scorer vs assist vs both');

  // C5 N7 both managers
  x=solo({pos:1},{pos:1,cup:true});assert.deepEqual(one(x,'both-league-titles'),{clubA:'Arsenal',clubB:'Juventus',managerA:'Alex',managerB:'Sam',season:'1'});none(solo({pos:1},{pos:2}),'both-league-titles');
  one(solo({cl:true},{el:true}),'both-european');one(solo({el:true},{el:true}),'both-european');none(solo({cl:true},{cup:true}),'both-european');
  x=solo({ta:true,pos:2},{pts:100});one(x,'both-trophyless');none(solo({cup:true},{}),'both-trophyless');
  x=solo({cl:true,ta:true},{cl:true,ts:true});assert.equal(one(x,'both-same-haul').points,'6');one(x,'season-draw-high');
  one(solo({pos:1,pts:100},{pos:1,goals:100}),'both-same-haul');
  none(solo({cl:true},{el:true,pos:1,ta:true,goals:100}),'both-same-haul');// equal 5-5 totals, different hauls
  none(solo({},{}),'both-same-haul');// nothing won is a draw on nothing, not a shared haul
  ok('C5','both-titles, both-European, both-trophyless and same-haul read both seasons; a same haul is the same scored items (so a draw), never an equal total from different items');

  // C6 N8 the overall Showdown and N9 runs
  const after=(seq,N=5,sAt)=>at('season-result',F({seasons:N,seq,s:sAt}));
  x=after([[3,0],[0,5]]);assert.deepEqual(one(x,'overall-lead-taken'),{gap:'2',leader:'Sam',leaderTotal:'5',season:'2',seasons:'5',seasonsLeft:'3',trailer:'Alex',trailerTotal:'3'});none(x,'overall-gap-closed');
  x=after([[3,0],[0,3]]);assert.deepEqual(one(x,'overall-level'),{managerA:'Alex',managerB:'Sam',season:'2',seasons:'5',seasonsLeft:'3',total:'3'});none(x,'overall-lead-taken');none(x,'overall-gap-closed');
  x=after([[0,0],[3,0]]);none(x,'overall-lead-taken');none(x,'overall-lead-extended');// from level is not a change of hands
  x=after([[3,0],[2,0]]);assert.equal(one(x,'overall-lead-extended').gap,'5');
  x=after([[3,0],[0,0]]);none(x,'overall-lead-extended');none(x,'overall-gap-closed');
  x=after([[5,0],[0,2]]);assert.deepEqual(one(x,'overall-gap-closed'),{gap:'3',leader:'Alex',leaderTotal:'5',season:'2',seasons:'5',seasonsLeft:'3',trailer:'Sam',trailerTotal:'2'});
  x=after([[11,0],[1,0]]);assert.equal(one(x,'overall-runaway').gap,'12');none(after([[11,0],[0,0]]),'overall-runaway');
  none(after([[11,0],[11,0],[11,0]],3),'overall-runaway');// the Showdown is over
  x=after([[11,0],[11,0],[0,0]],3);none(x,'overall-runaway');
  none(after([[3,0]]),'overall-lead-taken');
  x=after([[1,0],[1,0]]);assert.equal(one(x,'streak-two').streak,'2');none(x,'streak-long');
  x=after([[1,0],[1,0],[1,0]]);assert.equal(one(x,'streak-long').streak,'3');none(x,'streak-two');
  x=after([[1,0],[1,0],[1,0],[2,0]]);assert.equal(one(x,'streak-long').streak,'4');
  x=after([[1,0],[0,0],[1,0]]);none(x,'streak-two');assert.deepEqual(one(x,'unbeaten-run'),{gap:'2',leader:'Alex',leaderTotal:'2',season:'3',seasons:'5',seasonsLeft:'2',trailer:'Sam',trailerTotal:'0'});
  none(after([[1,0],[0,0]]),'unbeaten-run');none(after([[3,0],[0,1],[3,0]]),'unbeaten-run');none(after([[0,0],[0,0],[0,0]]),'unbeaten-run');
  x=after([[1,0],[1,0],[0,5]]);assert.deepEqual(one(x,'streak-broken'),{gap:'3',leader:'Sam',leaderTotal:'5',season:'3',seasons:'5',seasonsLeft:'2',streak:'2',trailer:'Alex',trailerTotal:'2'});
  none(after([[1,0],[1,0],[0,0]]),'streak-broken');none(after([[0,1],[1,0]]),'streak-broken');
  x=after([[1,0],[1,0],[1,0],[0,1]]);assert.equal(one(x,'streak-broken').streak,'3');
  x=after([[2,1]]);assert.deepEqual(one(x,'first-season-won'),{loser:'Sam',loserClub:'Juventus',loserPoints:'1',margin:'1',season:'1',seasons:'5',winner:'Alex',winnerClub:'Arsenal',winnerPoints:'2'});
  none(after([[2,2]]),'first-season-won');none(after([[2,1],[3,0]]),'first-season-won');
  ok('C6','the overall lead taken (only from the other manager, never from level), extended, closed, level and runaway (12+, Showdown not over); streaks of 2 and 3+, a run of 2+ broken by the other manager, unbeaten after 3+, the first season won');

  // C7 N10 the clock, at the clinch edge
  x=after([[5,0],[0,0],[1,0],[0,0],[1,0]],10);one(x,'clock-halfway');none(after([[5,0],[0,0],[1,0],[0,0]],10),'clock-halfway');
  x=after([[5,0],[0,0],[1,0]],5);one(x,'clock-halfway');none(after([[5,0],[0,0]],5),'clock-halfway');none(after([[5,0],[0,0]],3),'clock-halfway');
  x=after([[5,0],[5,0]],3);assert.equal(one(x,'clock-penultimate').seasonsLeft,'1');assert.equal(one(x,'clock-final-open').gap,'10');none(x,'clock-clinched');none(x,'clock-dead-rubber');
  x=after([[6,0],[5,0]],3);one(x,'clock-penultimate');none(x,'clock-final-open');none(x,'clock-clinched');none(x,'clock-dead-rubber');// 11 behind: a draw is still possible, a win is not
  x=after([[6,0],[6,0]],3);assert.equal(one(x,'clock-clinched').gap,'12');one(x,'clock-dead-rubber');none(x,'clock-final-open');one(x,'overall-runaway');
  x=after([[2,2],[1,1]],3);s=one(x,'clock-final-open');assert.ok(!('leader' in s)&&!('gap' in s),'level: nobody is named as leader');
  x=after([[11,0],[11,0],[0,0]],5);none(x,'clock-clinched');// 22 is not more than 11 x 2
  x=after([[11,0],[11,0],[1,0]],5);assert.equal(one(x,'clock-clinched').seasonsLeft,'2');none(x,'clock-dead-rubber');
  x=after([[11,0],[11,0],[11,0]],3);none(x,'clock-clinched');none(x,'clock-penultimate');// no season remains
  ok('C7','halfway after 5 of 10 and 3 of 5; penultimate; final-open while the gap is 10 or less; clinched only when the gap is MORE than 11 per season left (22 of 2 left is not, 23 is); dead rubber is clinched with one season left');

  // C8 N11/N12 the Final Winner and N16 career
  const fin=(seq,N=3,history)=>at('final',F({seasons:N,seq,history}));
  x=fin([[1,0],[0,0],[0,0]]);assert.deepEqual(one(x,'final-won-by-1'),{loser:'Sam',loserClub:'Juventus',loserTotal:'0',margin:'1',seasons:'3',winner:'Alex',winnerClub:'Arsenal',winnerTotal:'1'});none(x,'final-won-by-2-5');
  x=fin([[2,0],[0,0],[0,0]]);one(x,'final-won-by-2-5');none(x,'final-won-by-1');
  x=fin([[5,0],[0,0],[0,0]]);one(x,'final-won-by-2-5');none(x,'final-won-by-6-15');
  x=fin([[6,0],[0,0],[0,0]]);one(x,'final-won-by-6-15');none(x,'final-won-by-2-5');
  x=fin([[11,0],[4,0],[0,0]]);assert.equal(one(x,'final-won-by-6-15').margin,'15');none(x,'final-won-by-16-plus');
  x=fin([[11,0],[5,0],[0,0]]);assert.equal(one(x,'final-won-by-16-plus').margin,'16');
  for(const seq of [[[3,0],[0,3],[0,0]],[[0,0],[0,0],[0,0]],[[11,11],[5,5],[1,1]]]){
    x=fin(seq);s=one(x,'final-drawn');assert.equal(s.total,String(seq.reduce((n,[a])=>n+a,0)));assert.deepEqual(Object.keys(s).sort(),['clubA','clubB','managerA','managerB','seasons','total']);
    for(const sit of ['final-won-by-1','final-won-by-2-5','final-won-by-6-15','final-won-by-16-plus','final-comeback','final-wire-to-wire','final-golden','final-sprint','final-last-season-swing','career-lead-extended','career-new-leader','career-revenge'])none(x,sit);
    assert.ok(x.every(e=>!('winner' in e.slots)&&!('loser' in e.slots)),'a drawn Showdown names no winner');
  }
  x=fin([[0,3],[5,0],[0,0]]);one(x,'final-comeback');none(x,'final-wire-to-wire');none(x,'final-last-season-swing');
  x=fin([[0,3],[0,0],[5,0]]);one(x,'final-comeback');one(x,'final-last-season-swing');
  x=fin([[0,0],[0,0],[5,0]]);none(x,'final-comeback');none(x,'final-last-season-swing');none(x,'final-wire-to-wire');// level before is neither behind nor a change of hands
  x=fin([[2,0],[0,1],[0,0]]);one(x,'final-wire-to-wire');none(x,'final-comeback');
  x=fin([[2,0],[0,2],[1,0]]);none(x,'final-wire-to-wire');none(x,'final-last-season-swing');// level after season 2
  x=fin([[3,0],...Array(9).fill([0,0])],10);assert.equal(one(x,'final-golden').seasons,'10');none(x,'final-sprint');
  x=fin([[3,0]],1);one(x,'final-sprint');one(x,'final-wire-to-wire');none(x,'final-golden');none(x,'final-last-season-swing');
  x=fin([[3,3]],1);none(x,'final-sprint');one(x,'final-drawn');
  // career, from earlier finished Showdowns plus this one
  x=fin([[3,0],[0,0],[0,0]]);assert.deepEqual(one(x,'career-first-showdown'),{careerLeader:'Alex',careerLosses:'0',careerTrailer:'Sam',careerWins:'1',draws:'0',loser:'Sam',showdowns:'1',winner:'Alex'});none(x,'career-level');
  x=fin([[3,3],[0,0],[0,0]]);none(x,'career-first-showdown');assert.deepEqual(one(x,'career-level'),{careerWins:'0',draws:'1',managerA:'Alex',managerB:'Sam',showdowns:'1'});
  x=fin([[3,0],[0,0],[0,0]],3,[{winner:'playerOne'},{winner:'draw'}]);assert.deepEqual(one(x,'career-lead-extended'),{careerLeader:'Alex',careerLosses:'0',careerTrailer:'Sam',careerWins:'2',draws:'1',loser:'Sam',showdowns:'3',winner:'Alex'});none(x,'career-new-leader');none(x,'career-first-showdown');none(x,'career-revenge');
  x=fin([[0,3],[0,0],[0,0]],3,[{winner:'playerTwo'},{winner:'playerOne'}]);assert.equal(one(x,'career-new-leader').careerLeader,'Sam');none(x,'career-lead-extended');one(x,'career-revenge');
  x=fin([[3,0],[0,0],[0,0]],3,[{winner:'playerTwo'}]);assert.deepEqual(one(x,'career-level'),{careerWins:'1',draws:'0',managerA:'Alex',managerB:'Sam',showdowns:'2'});s=one(x,'career-revenge');assert.equal(s.winner,'Alex');assert.ok(!('careerLeader' in s));none(x,'career-new-leader');
  x=fin([[3,0],[0,0],[0,0]],3,[{totals:{playerOne:9,playerTwo:9}}]);assert.equal(one(x,'career-new-leader').careerLeader,'Alex');none(x,'career-revenge');
  x=fin([[3,3],[0,0],[0,0]],3,[{winner:'playerOne'}]);for(const sit of ['career-new-leader','career-lead-extended','career-revenge','career-level'])none(x,sit);
  assert.throws(()=>fin([[3,0]],3),/NOT_FINISHED/);assert.throws(()=>fin([[3,0],[0,0],[0,0]],3,[{winner:'playerOne',totals:{playerOne:4,playerTwo:4}}]),/HISTORY_INVALID/,'an equal history total is a draw, whatever it claims');
  ok('C8','Final margins split at 1/2, 5/6 and 15/16; equal totals are a drawn Showdown with no winner anywhere; comeback, wire-to-wire, golden, sprint and last-season swing; career first, lead extended, new leader, level and revenge from the history plus this result');

  // C9 club assignment
  const clubs=(a,b)=>at('club-assignment',{managers:{playerOne:{name:'Alex',...a},playerTwo:{name:'Sam',...b}}});
  x=clubs({club:'Arsenal',league:'premier_league'},{club:'Chelsea',league:'premier_league'});assert.deepEqual(one(x,'clubs-same-league'),{clubA:'Arsenal',clubB:'Chelsea',league:'Premier League',managerA:'Alex',managerB:'Sam'});none(x,'clubs-different-leagues');
  assert.deepEqual(of(x,'club-premier-league').map(e=>e.slots),[{club:'Arsenal',manager:'Alex',rival:'Sam',rivalClub:'Chelsea'},{club:'Chelsea',manager:'Sam',rival:'Alex',rivalClub:'Arsenal'}]);
  x=clubs({club:'Barcelona',league:'laliga'},{club:'Lyon',league:'ligue_1'});assert.deepEqual(one(x,'clubs-different-leagues'),{clubA:'Barcelona',clubB:'Lyon',managerA:'Alex',managerB:'Sam'});one(x,'club-laliga');one(x,'club-ligue-1');none(x,'clubs-same-league');
  x=clubs({club:'Bayern Munich',league:'bundesliga'},{club:'Napoli',league:'serie_a'});one(x,'club-bundesliga');assert.equal(one(x,'club-serie-a').manager,'Sam');
  // the league can come from data/clubs.js clubsByLeague
  x=at('club-assignment',{managers:{playerOne:{name:'Alex',club:'Real Madrid'},playerTwo:{name:'Sam',club:'Sevilla'}},clubsByLeague});assert.equal(one(x,'clubs-same-league').league,'LaLiga');
  for(const [key,clubList] of Object.entries(clubsByLeague))for(const club of clubList){const e=run('club-assignment',{managers:{playerOne:{name:'Alex',club},playerTwo:{name:'Sam',club:clubList[0]===club?clubList[1]:clubList[0]}},clubsByLeague});assert.equal(of(e,E.leagues[key][0]).length,2,club);}
  ok('C9','same league names the shared league; different leagues names none; each manager gets their own league line, for all 98 catalog clubs');

  // C10 Special Players, at every tier edge
  const row=rank=>({rank,name:`Player ${rank}`,club:'FC Porto',position:'CM',nation:'Portugal'});
  const sp=(a,b,m)=>at('special-player',{managers:m||MANAGERS,specialPlayers:{playerOne:a,playerTwo:b}});
  const tiers=[[1,'special-top-3'],[3,'special-top-3'],[4,'special-top-10'],[10,'special-top-10'],[11,'special-top-20'],[20,'special-top-20'],[21,'special-top-50'],[50,'special-top-50'],[51,'special-rest'],[298,'special-rest']];
  const tierName={'special-top-3':'black-blue-gold','special-top-10':'blue-gold','special-top-20':'gold','special-top-50':'silver','special-rest':'bronze'};
  for(const [rank,tier] of tiers){x=sp(row(rank),{...row(150),position:'GK',nation:'Spain'});const mine=x.filter(e=>e.slots.manager==='Alex'&&e.situation.startsWith('special-top')||e.slots.manager==='Alex'&&e.situation==='special-rest');assert.deepEqual(mine.map(e=>e.situation),[tier],`rank ${rank}`);assert.equal(MP.tier(rank),tierName[tier],'the badge agrees');}
  const neymar=List.players.find(p=>p.name==='Neymar'),otavio=List.players.find(p=>p.name==='Otávio');
  x=sp(neymar,otavio,{playerOne:{name:'Alex',club:'Barcelona',league:'laliga'},playerTwo:{name:'Sam',club:'Juventus',league:'serie_a'}});
  assert.deepEqual(one(x,'special-own-club'),{club:'Barcelona',manager:'Alex',mpClub:'FC Barcelona',mpName:'Neymar',mpNation:'Brazil',mpPosition:'left winger',mpRank:'1',rival:'Sam'});
  assert.deepEqual(one(x,'special-rank-gap'),{managerA:'Alex',managerB:'Sam',mpClubA:'FC Barcelona',mpClubB:otavio.club,mpNameA:'Neymar',mpNameB:'Otávio',mpNation:'Brazil',mpPosition:'left winger',mpRankA:'1',mpRankB:String(otavio.rank)});
  one(x,'special-same-nation');one(x,'special-same-position');none(x,'special-both-elite');assert.equal(x[0].situation,'special-own-club');
  none(sp(neymar,otavio),'special-own-club');
  x=sp(row(1),{...row(100),nation:'Spain'});none(x,'special-rank-gap');none(x,'special-same-nation');s=one(x,'special-same-position');assert.equal(s.mpPosition,'central midfielder');assert.ok(!('mpNation' in s),'no shared nation, none named');
  x=sp(row(1),{...row(101),position:'ST'});one(x,'special-rank-gap');s=one(x,'special-same-nation');assert.ok(!('mpPosition' in s));none(x,'special-same-position');
  x=sp(row(20),row(19));assert.deepEqual(one(x,'special-both-elite'),{managerA:'Alex',managerB:'Sam',mpClubA:'FC Porto',mpClubB:'FC Porto',mpNameA:'Player 20',mpNameB:'Player 19',mpNation:'Portugal',mpPosition:'central midfielder',mpRankA:'20',mpRankB:'19'});
  none(sp(row(20),row(21)),'special-both-elite');
  assert.deepEqual(run('special-player',{managers:MANAGERS,specialPlayers:null}),[],'a Showdown with no Special Player has no Special Player commentary');
  const drawn=MP.forShowdown('pair_a'+'0123456789abcdef'.repeat(4).slice(1),MP.fromMs+1);x=sp(drawn.playerOne,drawn.playerTwo);assert.equal(x.filter(e=>/^special-(top|rest)/.test(e.situation)).length,2,'the real draw gives each manager one tier line');
  ok('C10','tiers split at 3/4, 10/11, 20/21 and 50/51 like the badge; own club through the Special Player club names; same nation and position name only what is shared; rank gap at 100; both elite at 20');

  // C11 previews
  const pre=(seq,N,sAt)=>at('season-preview',F({seasons:N,seq,s:sAt}));
  x=pre([],3,1);assert.deepEqual(one(x,'preview-first-season'),{clubA:'Arsenal',clubB:'Juventus',managerA:'Alex',managerB:'Sam',season:'1',seasons:'3',seasonsLeft:'3'});none(x,'preview-level');none(x,'preview-golden');none(x,'preview-final-season');
  x=pre([],10,1);one(x,'preview-golden');one(x,'preview-first-season');assert.equal(x[0].situation,'preview-golden');
  x=pre([[3,1]],3,2);assert.deepEqual(one(x,'preview-leader'),{clubA:'Arsenal',clubB:'Juventus',gap:'2',leader:'Alex',managerA:'Alex',managerB:'Sam',season:'2',seasons:'3',seasonsLeft:'2',trailer:'Sam'});none(x,'preview-level');
  x=pre([[3,3]],3,2);s=one(x,'preview-level');assert.ok(!('leader' in s)&&!('gap' in s));none(x,'preview-leader');
  x=pre([[3,1],[0,4]],3,3);s=one(x,'preview-final-season');assert.equal(s.leader,'Sam');assert.equal(s.seasonsLeft,'1');one(x,'preview-leader');
  x=pre([],1,1);one(x,'preview-final-season');one(x,'preview-first-season');
  ok('C11','previews: season 1, golden (season 1 of 10), the final season, a leader by the gap after the seasons played, level (never on season 1)');

  // C12 every situation fires with every slot filled, in at least one fixture above
  const missing=Object.keys(E.situations).filter(sit=>!COMPLETE.has(sit));
  assert.deepEqual(missing,[],'situations never seen with all their slots');
  for(const {entry} of ALL)for(const key of NEVER[entry.situation]||[])assert.ok(!(key in entry.slots),`${entry.situation} never fills ${key}`);
  ok('C12',`all ${COMPLETE.size} situations fire in a fixture with every listed slot filled (season-1 previews never name a leader, different leagues never name a league)`);

  // C13 a deterministic sweep: slots never outside the spec, order, determinism, and no winner from equal totals
  let seed=0x9e3779b9;const rnd=n=>{seed=(Math.imul(seed^(seed>>>15),2246822519)+0x6d2b79f5)>>>0;return seed%n;};
  const randomResult=teams=>{const cl=rnd(5)===0,el=!cl&&rnd(4)===0;return {pos:1+rnd(teams),pts:30+rnd(teams===18?73:80),goals:20+rnd(95),cup:rnd(5)===0,cl,el,ts:rnd(6)===0,ta:rnd(6)===0};};
  const lines={};for(const [situation,slots] of Object.entries(E.situations)){lines[situation]=[{id:`${situation}-001`,text:slots.map(k=>`{${k}}`).join(' ')},{id:`${situation}-002`,text:'A plain line with no slots at all here.'},...slots.map((k,i)=>({id:`${situation}-1${String(i).padStart(2,'0')}`,text:`Only {${k}} here.`}))];}
  const realLines={};for(const line of Lines.results)(realLines[line.situation]||(realLines[line.situation]=[])).push(line);let voicedSweep=0;
  const allIds=new Set(Object.values(lines).flat().map(l=>l.id));
  let sweeps=0,picks=0;
  for(let i=0;i<400;i+=1){
    const N=[1,3,5,10][rnd(4)],teams=rnd(3)===0?18:20,seq=[];
    for(let k=0;k<N;k+=1){
      const small=rnd(3)===0;// often equal totals
      const a=small?rnd(12):randomResult(teams),b=small?(rnd(2)?a:rnd(12)):randomResult(teams);seq.push([a,b]);
    }
    const history=Array.from({length:rnd(4)},()=>({winner:['playerOne','playerTwo','draw'][rnd(3)]}));
    const leagueKeys=Object.keys(clubsByLeague),la=leagueKeys[rnd(5)],lb=rnd(2)?la:leagueKeys[rnd(5)];
    const managers={playerOne:{name:'Alex',club:clubsByLeague[la][0],league:la},playerTwo:{name:'Sam',club:clubsByLeague[lb][1],league:lb}};
    const picksMp={playerOne:List.players[rnd(List.players.length)],playerTwo:List.players[rnd(List.players.length)]};
    const used=new Set(),showdownId=`pair_${i}`;
    const moments=[['club-assignment',F({seasons:N,managers,seq:[],s:1,teams})],['special-player',{managers,specialPlayers:picksMp}]];
    for(let k=1;k<=N;k+=1){moments.push(['season-preview',F({seasons:N,managers,seq:seq.slice(0,k-1),s:k,teams})]);moments.push(['season-result',F({seasons:N,managers,seq:seq.slice(0,k),s:k,teams})]);}
    moments.push(['final',F({seasons:N,managers,seq,history,teams})]);
    for(const [moment,facts] of moments){
      const entries=run(moment,facts);sweeps+=1;
      assert.deepEqual(run(moment,JSON.parse(JSON.stringify(facts))),entries,'same facts, same situations');
      let last=-1;
      for(const e of entries){
        const spec=E.situations[e.situation];assert.ok(E.order[moment].includes(e.situation),`${e.situation} belongs to ${moment}`);
        for(const [k,v] of Object.entries(e.slots)){assert.ok(spec.includes(k),`${e.situation}: slot ${k} outside its spec`);assert.ok(typeof v==='string'&&v.length>0,`${e.situation}.${k}`);}
        const rank=E.order[moment].indexOf(e.situation);assert.ok(rank>=last,'most specific first');last=rank;
        assert.ok(E.pick([e],realLines,`sweep|${i}`,[]),`${e.situation} with [${Object.keys(e.slots)}] has a shipped line it can fill`);voicedSweep+=1;
        const cond=E.conditionalSlots[e.situation]||[];for(const k of spec)if(!cond.includes(k))assert.ok(k in e.slots,`${e.situation} always fills ${k}`);
      }
      if(moment==='season-result'){
        const row=facts.results[facts.season-1],pa=row.scoring.playerOne.total,pb=row.scoring.playerTwo.total;
        assert.equal(legacyScore(row.results.playerOne).total,pa);
        const left=N-facts.season,ta=facts.results.reduce((n,r)=>n+r.scoring.playerOne.total,0),tb=facts.results.reduce((n,r)=>n+r.scoring.playerTwo.total,0),gap=Math.abs(ta-tb);
        if(pa===pb){assert.ok(entries.every(e=>!('winner' in e.slots)));assert.equal(entries.filter(e=>/^season-draw/.test(e.situation)).length,1);}
        else{const band=entries.filter(e=>/^season-win-by/.test(e.situation));assert.equal(band.length,1);const m=Math.abs(pa-pb);assert.equal(band[0].slots.margin,String(m));assert.equal(band[0].situation,m===1?'season-win-by-1':m<=3?'season-win-by-2-3':m<=6?'season-win-by-4-6':'season-win-by-7-plus');assert.equal(band[0].slots.winner,pa>pb?'Alex':'Sam');}
        if(ta===tb)assert.ok(entries.every(e=>!('leader' in e.slots)),'level overall: no leader');
        assert.equal(entries.some(e=>e.situation==='clock-clinched'),left>0&&gap>11*left);
        assert.equal(entries.some(e=>e.situation==='overall-runaway'),left>0&&gap>=12);
        for(const role of ['playerOne','playerTwo']){const r=row.results[role],name=facts.managers[role].name,mine=entries.filter(e=>e.slots.manager===name).map(e=>e.situation);assert.equal(mine.includes('finish-bottom-three'),r.leaguePosition>row.teamCount-3);if(mine.includes('finish-mid-table'))assert.ok(r.leaguePosition>=5&&r.leaguePosition<=10);}
      }
      if(moment==='final'){
        const ta=facts.results.reduce((n,r)=>n+r.scoring.playerOne.total,0),tb=facts.results.reduce((n,r)=>n+r.scoring.playerTwo.total,0);
        if(ta===tb){one(entries,'final-drawn');assert.ok(entries.every(e=>!('winner' in e.slots)&&!/^final-won/.test(e.situation)),'a drawn Showdown never has a winner');}
        else assert.equal(entries.filter(e=>/^final-won-by/.test(e.situation))[0].slots.winner,ta>tb?'Alex':'Sam');
      }
      // pick: same seed, same line; never a used id; only lines whose slots the entry fills
      const seedValue=E.seedFor(showdownId,moment,facts.season);
      const chosen=E.pick(entries,lines,seedValue,used);
      assert.deepEqual(E.pick(entries,lines,seedValue,new Set(used)),chosen,'the other phone picks the same line');
      if(entries.length)assert.ok(chosen,'a line is found');
      if(chosen){assert.ok(!used.has(chosen.id),'never a line already shown');assert.ok(allIds.has(chosen.id));assert.ok(!/[{}]/.test(chosen.text),'every placeholder filled');used.add(chosen.id);picks+=1;}
    }
  }
  ok('C13',`${sweeps} moments over 400 generated Showdowns (equal totals often): slots only from the spec, always-on slots always filled, most specific first, same facts give the same entries, band/clinch/runaway/bottom-three agree with the totals, equal totals never name a winner, each of ${voicedSweep} entries has a shipped line; ${picks} picks, none repeated within a Showdown`);

  // C14 pick: deterministic, falls back, skips used and unfillable lines
  const entries=run('season-result',F({seasons:3,seq:[[3,3]]}));
  assert.deepEqual(codes(entries).slice(0,1),['both-same-haul']);
  const table={'both-same-haul':[{id:'h-1',text:'{managerA} and {managerB} matched it on {points}.'},{id:'h-2',text:'Same haul for {managerA} and {managerB}.'}],'season-draw-low':[{id:'d-1',text:'Honours even at {points} in season {season}.'}],'overall-level':[{id:'l-1',text:'Level on {total}, uses {leader} so never fits.'},{id:'l-2',text:'All square on {total} after season {season}.'}]};
  const first=E.pick(entries,table,'pair_x|season-result|1',[]);assert.ok(['h-1','h-2'].includes(first.id));assert.equal(first.situation,'both-same-haul');
  for(let k=0;k<5;k+=1)assert.deepEqual(E.pick(entries,table,'pair_x|season-result|1',[]),first);
  const second=E.pick(entries,table,'pair_x|season-result|1',[first.id]);assert.notEqual(second.id,first.id);assert.equal(second.situation,'both-same-haul');
  const third=E.pick(entries,table,'pair_x|season-result|1',['h-1','h-2']);assert.deepEqual(third,{id:'l-2',situation:'overall-level',text:'All square on 3 after season 1.'},'falls to the next true situation; a line with a slot the entry cannot fill is skipped');
  const fourth=E.pick(entries,table,'pair_x|season-result|1',new Set(['h-1','h-2','l-2']));assert.deepEqual(fourth,{id:'d-1',situation:'season-draw-low',text:'Honours even at 3 in season 1.'});
  assert.equal(E.pick(entries,table,'pair_x|season-result|1',['h-1','h-2','d-1','l-2']),null);
  assert.equal(E.pick(entries,{'both-same-haul':[{id:'z',text:'Uses {winner}, which a draw never has.'}]},'s',[]),null,'a slot outside the spec is never filled');
  const rows=Object.entries(table).flatMap(([situation,list])=>list.map(l=>({...l,situation})));assert.deepEqual(E.pick(entries,rows,'pair_x|season-result|1',[]),first,'lines as {id, situation, text} rows work too');
  const spread=new Set(Array.from({length:40},(_,k)=>E.pick(entries,table,E.seedFor(`pair_${k}`,'season-result',1),[]).id));assert.deepEqual([...spread].sort(),['h-1','h-2'],'different Showdowns get different lines');
  assert.equal(E.seedFor('pair_x','final'),'pair_x|final|0');assert.throws(()=>run('kick-off',{}),/MOMENT_INVALID/);
  ok('C14','pick is the same for the same seed, varies across Showdowns, never repeats a used id, falls to the next true situation when one runs out, skips lines with slots its entry cannot fill, and returns null when nothing is left');

  // C15 spoken positions and "a"/"an" before a filled slot
  assert.deepEqual(E.positionWords,{LW:'left winger',RW:'right winger',LM:'left midfielder',RM:'right midfielder',CM:'central midfielder',CAM:'attacking midfielder',CDM:'defensive midfielder',ST:'striker',CF:'centre-forward',CB:'centre-back',LB:'left-back',RB:'right-back',GK:'goalkeeper'});
  for(const code of new Set(List.players.map(p=>p.position)))assert.ok(E.positionWords[code],`list position ${code} has spoken words`);
  for(const p of List.players.slice(0,60)){
    const e=run('special-player',{managers:MANAGERS,specialPlayers:{playerOne:p,playerTwo:List.players[List.players.length-1]}});
    for(const item of e)if('mpPosition' in item.slots){assert.ok(Object.values(E.positionWords).includes(item.slots.mpPosition),`${item.situation}: ${item.slots.mpPosition}`);assert.ok(!/^[A-Z]{2,3}$/.test(item.slots.mpPosition));}
  }
  assert.ok(!('mpPosition' in one(sp({...row(5),position:'XX'},{...row(150),position:'GK'}),'special-top-10')),'an unknown code is left out, never read aloud');
  for(const [value,vowel] of [['attacking midfielder',true],['left winger',false],['Arsenal',true],['Uruguay',false],['Ukraine',false],['United States',false],['Egypt',true],['Italy',true],['England',true],['Ivory Coast',true],['FC Porto',true],['PSV',false],['RB Leipzig',true],['SL Benfica',true],['UD Las Palmas',false],['1. FC Köln',false],['Özil',true],['honour',true],['8',true],['8th',true],['11',true],['11th',true],['18th',true],['1st',false],['3',false],['10',false],['110',false],['1100',true],['80',true],['Juventus',false]])assert.equal(E.vowelSound(value),vowel,value);
  const aEntry=[{situation:'special-top-10',slots:{manager:'Alex',club:'Arsenal',rival:'Sam',mpName:'X',mpClub:'Inter',mpPosition:'attacking midfielder',mpNation:'Italy',mpRank:'8'}}];
  const say=text=>E.pick(aEntry,{'special-top-10':[{id:'t',text}]},'s',[]).text;
  assert.equal(say('{manager} lands a {mpPosition} from a {mpNation} side ranked {mpRank}.'),'Alex lands an attacking midfielder from an Italy side ranked 8.');
  assert.equal(say('A {mpPosition} ranked a {mpRank} for {manager}, a proud day.'),'An attacking midfielder ranked an 8 for Alex, a proud day.');
  assert.equal(say('{manager} gets a {mpClub} star and a {mpPosition}.'),'Alex gets an Inter star and an attacking midfielder.');
  assert.equal(say('Sofa {mpPosition} and a big {mpPosition} for {manager}.'),'Sofa attacking midfielder and a big attacking midfielder for Alex.','only the article right before a slot changes');
  assert.equal(say('{manager} now has an elite talent: a {club} favourite.'),'Alex now has an elite talent: an Arsenal favourite.');
  aEntry[0].slots.mpPosition='left winger';assert.equal(say('{manager} lands a {mpPosition}.'),'Alex lands a left winger.');
  ok('C15','{mpPosition} is the spoken position (left winger, attacking midfielder, centre-back...) for every list position, never a code; "a" right before a filled slot becomes "an" for a vowel sound (an Italy side, an 8th, a Uruguay star), and nothing else in the line changes');

  // C16 the shipped lines: every line has a known situation, and no situation is ever silent
  assert.equal(Lines.results.length,Object.values(SPEC).flatMap(g=>Object.values(g)).reduce((n,row)=>n+row.count,0));
  for(const line of Lines.results){assert.ok(E.situations[line.situation],`${line.id}: unknown situation ${line.situation}`);for(const key of line.text.match(/\{\w+\}/g)||[])assert.ok(E.situations[line.situation].includes(key.slice(1,-1)),`${line.id}: ${key}`);}
  const voiced=new Set();let silent=[];
  for(const {moment,entry} of ALL){
    const said=E.pick([entry],Lines.results,E.seedFor('pair_lines',moment,1),[]);
    if(!said){silent.push(`${entry.situation} with [${Object.keys(entry.slots)}]`);continue;}
    assert.equal(said.situation,entry.situation);assert.ok(!/[{}]/.test(said.text),said.id);assert.ok(!/\b[Aa] [aeiou]/i.test(said.text.replace(/\b[Aa] (one|uni|use|uru|ukr|eu)/gi,'')),`${said.id}: "${said.text}"`);
    voiced.add(entry.situation);
  }
  assert.deepEqual([...new Set(silent)],[],'every fired entry, even without its optional slots, has a line it can fill');
  assert.deepEqual(Object.keys(E.situations).filter(sit=>!voiced.has(sit)),[],'every situation is voiced');
  ok('C16',`all ${Lines.results.length.toLocaleString('en-GB')} lines in data/commentaryLines.js resolve to a known situation with its own slots, and every one of the ${voiced.size} situations returns a real line in every fixture where it fires (${ALL.length} entries)`);

  console.log(`PASS r86 commentary engine contracts: ${checks} numbered checks (${Object.keys(E.situations).length} situations over ${E.moments.length} moments).`);
})().catch(error=>{console.error(error);process.exit(1);});
