'use strict';
// r88 Prime Pack round logic (Nik 2026-10-31, project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md):
// the seeded draw, the reveal clock and the round record (arrivals, two chips each, first right guess wins, draw).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const IG=require('../../js/iconGuess.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const newId=()=>'pair_'+randomBytes(32).toString('hex');

// G1 the draw: no repeats, same on both phones, season counter digit ignored, every icon reachable, no IO
const N=150;
const counts=new Array(N).fill(0);
for(let i=0;i<4000;i+=1){
  const id=newId(),order=IG.order(id,N);
  assert.equal(order.length,N);assert.equal(new Set(order).size,N,'a permutation: no icon repeats in one Showdown');
  assert.deepEqual(IG.order(id,N),order,'same id, same order');
  for(const marker of ['0','1','7','f'])assert.deepEqual(IG.order('pair_'+marker+id.slice(6),N),order,'the season-count digit never changes the order');
  counts[order[0]]+=1;
  const seasons=Array.from({length:IG.maxSeasons},(_,s)=>IG.draw(id,s+1,N).index);
  assert.deepEqual(seasons,order.slice(0,IG.maxSeasons));
}
const mean=4000/N;assert.ok(Math.min(...counts)>mean*0.3&&Math.max(...counts)<mean*2.2,`every icon can come first, none favoured (${Math.min(...counts)}-${Math.max(...counts)})`);
const one=newId();
assert.notDeepEqual(IG.order(one,N,2),IG.order(one,N,1),'a new list version is a new order');
assert.equal(IG.order(one,IG.maxSeasons-1),null,'a list shorter than a Showdown is refused');
for(const bad of ['pair_short',null,undefined,'pair_'+'g'.repeat(64)])assert.equal(IG.order(bad,N),null);
for(const bad of [0,11,1.5,'1',null])assert.equal(IG.draw(one,bad,N),null,`season ${String(bad)}`);
const source=fs.readFileSync(path.join(ROOT,'js/iconGuess.js'),'utf8');
for(const word of ['getDoc','setDoc','runTransaction','updateDoc','onSnapshot','localStorage','indexedDB','Math.random','Date.now','performance.now','fetch('])assert.ok(!source.includes(word),`the round logic uses no ${word}`);
ok('G1','each Showdown gets a seeded order of the whole list (no repeats, both phones agree, the season digit and the clock play no part, nothing read or written)');

// G1b only Showdowns confirmed on r87 or later (Nik N1; r87 since 2026-11-01)
// Nik 2026-11-01: Prime Pack ships in r87, so its boundary is Roster Roulette's (the r87 release PR pins both together).
assert.equal(IG.fromMs,require('../../js/rosterRouletteStep.js').fromMs,'Prime Pack starts with the same Showdowns as Roster Roulette');
const R88=Date.parse('2026-11-05T00:00:00Z');
assert.equal(IG.eligible(one,R88,{fromMs:R88}),true);assert.equal(IG.eligible(one,{toMillis:()=>R88+1},{fromMs:R88}),true);assert.equal(IG.eligible(one,new Date(R88),{fromMs:R88}),true);
for(const old of [R88-1,null,undefined,'2026-11-06',NaN,{}])assert.equal(IG.eligible(one,old,{fromMs:R88}),false,`not for ${String(old)}`);
assert.equal(IG.eligible('pair_short',R88,{fromMs:R88}),false);
assert.equal(IG.eligible(one,IG.fromMs-1),false,'a Showdown confirmed before the r87 boundary never starts the game mid-way');
ok('G1b','only a Showdown confirmed on r87 or later (the Roster Roulette boundary) plays Prime Pack, so no Showdown mixes 11-point and 15-point seasons');

// G2 the stat order: all six, varied, per season
const firsts=new Map();
for(let i=0;i<3000;i+=1){
  const id=newId(),stats=IG.statOrder(id,1+(i%IG.maxSeasons));
  assert.deepEqual([...stats].sort(),[...IG.stats].sort());
  firsts.set(stats[0],(firsts.get(stats[0])||0)+1);
}
assert.equal(firsts.size,6,'any stat can flip first');for(const c of firsts.values())assert.ok(c>300&&c<700,`first stat spread ${c}`);
assert.notDeepEqual(Array.from({length:10},(_,s)=>IG.statOrder(one,s+1).join()),Array(10).fill(IG.statOrder(one,1).join()),'the order changes between seasons');
ok('G2','the six face stats flip in a seeded random order that changes each season, and any stat can go first');

// G3 the reveal clock: every timing comes from the one STAGES table (G Lead 2026-11-01 10:30 UTC)
const S=1_800_000_000_000,ST=IG.stages,SS=IG.stageStarts;
assert.deepEqual(ST.map(x=>[x.points,x.revealMs,x.guessMs,x.stats,x.position,x.flag,x.overall]),[
  [4,2500,25000,1,true,false,false],[3,1500,20000,2,true,false,false],[2,1500,20000,3,true,false,false],[1,1500,20000,4,true,false,false]],'Nik\'s final stage table');
assert.ok(Object.isFrozen(ST)&&ST.every(Object.isFrozen),'the table cannot be changed at run time');
assert.deepEqual([...SS],[0,27500,49000,70500]);assert.equal(IG.roundMs,92000);
assert.deepEqual(IG.beatAt(S,S-1),{phase:'waiting',beat:-1,msLeft:1,stageMsLeft:1});
assert.deepEqual(IG.beatAt(S,S),{phase:'reveal',beat:0,msLeft:2500,stageMsLeft:27500},'stage 1: the pack opens and the card rises (2.5 s)');
assert.deepEqual(IG.beatAt(S,S+2500),{phase:'window',beat:0,msLeft:25000,stageMsLeft:25000},'then 25 s to guess');
for(let b=0;b<IG.beats;b+=1){
  const end=SS[b]+ST[b].revealMs+ST[b].guessMs;
  assert.deepEqual(IG.beatAt(S,S+SS[b]),{phase:'reveal',beat:b,msLeft:ST[b].revealMs,stageMsLeft:ST[b].revealMs+ST[b].guessMs});
  assert.deepEqual(IG.beatAt(S,S+SS[b]+ST[b].revealMs),{phase:'window',beat:b,msLeft:ST[b].guessMs,stageMsLeft:ST[b].guessMs});
  assert.equal(IG.beatAt(S,S+end-1).beat,b);assert.equal(IG.beatAt(S,S+end-1).phase,'window');
}
assert.equal(IG.beats,4);assert.equal(IG.lastBeat,3);
assert.equal(IG.endsAt(S),S+IG.roundMs);assert.equal(IG.beatAt(S,S+IG.roundMs-1).beat,IG.lastBeat);assert.equal(IG.beatAt(S,S+IG.roundMs).phase,'over');
assert.equal(IG.beatAt(S,S+86_400_000).phase,'over','a phone that missed the whole game lands on the end');
assert.equal(IG.endsAt(S,5000),S+IG.roundMs,'an old caller\'s window argument changes nothing');
const order=['DRI','PAC','SHO','PAS','DEF','PHY'];
assert.deepEqual(IG.revealed(-1,order),{position:false,stats:[],flag:false,overall:false,name:false});
assert.deepEqual(IG.revealed(0,order),{position:true,stats:['DRI'],flag:false,overall:false,name:false},'stage 1: the position and one random stat');
assert.deepEqual(IG.revealed(1,order),{position:true,stats:['DRI','PAC'],flag:false,overall:false,name:false},'stage 2: one more stat');
assert.deepEqual(IG.revealed(2,order),{position:true,stats:['DRI','PAC','SHO'],flag:false,overall:false,name:false},'stage 3: one more stat');
assert.deepEqual(IG.revealed(3,order),{position:true,stats:['DRI','PAC','SHO','PAS'],flag:false,overall:false,name:false},'stage 4: four stats; flag, overall and name still hidden');
assert.deepEqual(IG.revealed(9,order),IG.revealed(3,order),'never the last two stats, flag, overall or name before the stage 5 reveal');
assert.deepEqual([0,1,2,3,4,-1].map(IG.stagePointsAt),[4,3,2,1,0,0],'stage points 4, 3, 2, 1 (Nik 2026-11-01)');
assert.deepEqual(IG.resultView(order),{position:true,stats:order,flag:true,overall:true,name:true},'stage 5 (no guessing) reveals the whole card: the last two stats, the name, the flag and the overall');
ok('G3','four guessing stages from one table (2.5 s + 25 s, then 1.5 s + 20 s three times): position and 1, 2, 3, then 4 stats; stage 5 reveals the rest; computed only from the server start time, so a reloaded phone rejoins on the current stage');

// G4 arrivals and the start
let r=IG.newRecord(3);
assert.deepEqual(JSON.parse(JSON.stringify(r)),{v:1,season:3,arrived:{playerOne:null,playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},winner:null});
assert.equal(IG.startMs(r),null);assert.equal(IG.outcome(r,S).state,'waiting');
r=IG.arrive(r,'playerTwo',S).record;assert.equal(IG.startMs(r),null,'one manager alone never starts the round');
assert.equal(IG.applyGuess(r,{role:'playerTwo',correct:true,atMs:S+5}).reason,'NOT_STARTED');
const again=IG.arrive(r,'playerTwo',S+9000);assert.equal(again.changed,false,'a reload never moves an arrival');assert.equal(again.record,r);
r=IG.arrive(r,'playerOne',S+4000).record;assert.equal(IG.startMs(r),S+4000+IG.leadMs,'the round starts a short count-in after the later arrival');
assert.equal(IG.applyGuess(r,{role:'playerOne',correct:true,atMs:S+4001}).reason,'NOT_STARTED','no guess before the position shows');
assert.equal(IG.arrive(r,'nobody',S).reason,'BAD_ARRIVAL');assert.equal(IG.arrive(r,'playerOne',-1).reason,'BAD_ARRIVAL');
ok('G4','the round starts only once both managers are on the screen, from their server arrival times; a reload never moves the start');

// G5 chips, hidden wrong guesses, first right guess wins
const T0=IG.startMs(r),at=b=>T0+IG.stageStarts[b]+IG.stages[b].revealMs+100;
let g=IG.applyGuess(r,{role:'playerTwo',correct:false,atMs:at(1)});assert.ok(g.ok);r=g.record;
assert.deepEqual(r.chipsUsed,{playerOne:0,playerTwo:1});assert.equal(r.winner,null);
assert.ok(!JSON.stringify(r).match(/guess|name|icon/i),'a wrong guess leaves only a chip count behind');
assert.deepEqual(IG.outcome(r,at(1)).chips,{playerOne:2,playerTwo:1});assert.equal(IG.outcome(r,at(1)).state,'live');
g=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:at(2)});assert.ok(g.ok);const won=g.record;
assert.deepEqual(won.winner,{role:'playerOne',beat:2,atMs:at(2)});
assert.deepEqual(IG.outcome(won,at(2)),{state:'won',winner:'playerOne',beat:2,chips:{playerOne:1,playerTwo:1}});
assert.deepEqual(IG.points(won),{playerOne:2,playerTwo:0},'a right guess at stage 3 is worth 2');
for(let b=0;b<IG.beats;b+=1)assert.deepEqual(IG.points(IG.applyGuess(r,{role:'playerTwo',correct:true,atMs:at(b)}).record),{playerOne:0,playerTwo:IG.stagePoints[b]});
assert.equal(IG.applyGuess(won,{role:'playerTwo',correct:true,atMs:at(2)+1}).reason,'ROUND_OVER','a right guess recorded later never wins');
// Same moment: two right guesses race; whichever transaction commits first wins (the second runs on the updated record).
const raceA=IG.applyGuess(r,{role:'playerTwo',correct:true,atMs:at(3)}).record;
assert.equal(IG.applyGuess(raceA,{role:'playerOne',correct:true,atMs:at(3)-50}).reason,'ROUND_OVER','server order decides, not the earlier phone clock');
ok('G5','each accepted guess spends one chip; a wrong one leaves only the chip count; the first right guess the server records wins 4, 3, 2 or 1 points by stage and ends the round');

// G6 running out, the flag window, draws
let d=r;
d=IG.applyGuess(d,{role:'playerTwo',correct:false,atMs:at(2)}).record;
assert.equal(IG.applyGuess(d,{role:'playerTwo',correct:true,atMs:at(3)}).reason,'NO_CHIPS','a manager out of chips only watches');
assert.equal(IG.outcome(d,at(3)).state,'live','the other manager can still win');
d=IG.applyGuess(d,{role:'playerOne',correct:false,atMs:at(3)}).record;
d=IG.applyGuess(d,{role:'playerOne',correct:false,atMs:at(3)+1}).record;
assert.deepEqual(IG.outcome(d,at(3)+1),{state:'draw',winner:null,beat:null,chips:{playerOne:0,playerTwo:0}},'all four chips spent: a draw at once');
assert.deepEqual(IG.points(d),{playerOne:0,playerTwo:0});
const late=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:IG.endsAt(T0)});assert.equal(late.reason,'ROUND_OVER','nothing counts after the stage 4 window');
assert.equal(IG.outcome(r,IG.endsAt(T0)-1).state,'live');assert.equal(IG.outcome(r,IG.endsAt(T0)+IG.drawSlackMs).state,'live','a winner may land until the Rules window closes (Fable F13-06)');assert.equal(IG.outcome(r,IG.endsAt(T0)+IG.drawSlackMs+1).state,'draw','nobody by the end of the Rules window: the whole card shows and nobody scores');
const last=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:at(3)});assert.equal(last.record.winner.beat,IG.lastBeat,'stage 4 is the last chance');assert.deepEqual(IG.points(last.record),{playerOne:1,playerTwo:0});
ok('G6','a manager with no chips only watches; all chips spent or stage 4 closing with no right guess is a draw with no points');

// G7 the record guard (what the Rules fragment will mirror)
assert.ok(IG.validRecord(won)&&IG.validRecord(d));
const bads=[
  null,{...won,v:2},{...won,season:11},{...won,chipsUsed:{playerOne:3,playerTwo:0}},{...won,chipsUsed:{playerOne:-1,playerTwo:0}},
  {...won,chipsUsed:{playerOne:1,playerTwo:0},winner:{role:'playerTwo',beat:4,atMs:1}},{...won,winner:{role:'playerOne',beat:4,atMs:1}},{...won,winner:{role:'x',beat:1,atMs:1}},
  {...IG.newRecord(1),chipsUsed:{playerOne:1,playerTwo:0}},{...won,arrived:{playerOne:'soon',playerTwo:null}}
];
for(const bad of bads){assert.equal(IG.validRecord(bad),false,JSON.stringify(bad));assert.equal(IG.applyGuess(bad,{role:'playerOne',correct:true,atMs:at(1)}).reason,'BAD_RECORD');assert.equal(IG.outcome(bad,0),null);assert.deepEqual(IG.points(bad),{playerOne:0,playerTwo:0});}
for(const bad of [{role:'playerOne',correct:'yes',atMs:at(1)},{role:'playerOne',correct:true},{role:'ref',correct:true,atMs:at(1)},undefined])assert.equal(IG.applyGuess(r,bad).reason,'BAD_GUESS');
assert.ok(Object.isFrozen(won)&&Object.isFrozen(won.chipsUsed)&&Object.isFrozen(won.winner),'records are immutable values');
ok('G7','a record with an impossible chip count, winner, season or arrival is refused, and the point is only ever read from a valid record');

// G8 one table (G Lead 2026-11-01): every number lives in STAGES in js/iconGuess.js; the Rules' stage edges and guess
// limits are the same clock (count-in, then the four stages), so a change to one without the other fails here.
{
  assert.deepEqual([...IG.stagePoints],[4,3,2,1]);assert.equal(IG.maxPoints,4);assert.equal(IG.leadMs,3000);
  const edge=b=>IG.leadMs+(b+1<IG.beats?IG.stageStarts[b+1]:IG.roundMs);
  for(const file of ['firestore.season-results-production.fragment.rules','firestore.season-commit-production.fragment.rules']){
    const rules=fs.readFileSync(path.join(ROOT,file),'utf8');
    const stage=/function ssjrPackStagePoints\(at, a, b\) \{\s*return at < \(a > b \? a : b\) \+ duration\.value\((\d+), 'ms'\) \? 4\s*: \(at < \(a > b \? a : b\) \+ duration\.value\((\d+), 'ms'\) \? 3\s*: \(at < \(a > b \? a : b\) \+ duration\.value\((\d+), 'ms'\) \? 2 : 1\)\);/.exec(rules);
    if(!stage)continue;
    assert.deepEqual(stage.slice(1).map(Number),[edge(0),edge(1),edge(2)],`${file}: the Rules' stage edges are the round's`);
    const window=/request\.time >= \(a > b \? a : b\) \+ duration\.value\((\d+), 's'\)\s*&& request\.time <= \(a > b \? a : b\) \+ duration\.value\((\d+), 's'\)/.exec(rules);
    assert.ok(window,`${file}: the guess window`);
    assert.ok(Number(window[1])*1000<=IG.leadMs&&Number(window[2])*1000>=edge(3)&&Number(window[2])*1000-edge(3)<=2000,`${file}: guesses from the count-in to stage 4's close (+2 s grace), never during the full reveal after it`);
  }
  assert.ok(fs.readFileSync(path.join(ROOT,'firestore.season-results-production.fragment.rules'),'utf8').includes('function ssjrPackStagePoints('),'the Rules score by stage');
  ok('G8','every number is one table (4, 3, 2, 1 points) and the Rules use the same stage edges (30.5 s, 52 s, 73.5 s after the later arrival) and close guessing at stage 4\'s end (95 s)');
}

console.log(`PASS r88 icon guess round contracts (${checks} checks)`);
