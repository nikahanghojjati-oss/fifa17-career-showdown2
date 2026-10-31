'use strict';
// r88 Icon Unmasked round logic (Nik 2026-10-31, project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md):
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

// G1b only Showdowns confirmed on R88 or later (Nik N1)
assert.ok(IG.fromMs>Date.parse('2026-11-01T00:00:00Z'),'until the release PR pins it, no Showdown plays the game');
const R88=Date.parse('2026-11-05T00:00:00Z');
assert.equal(IG.eligible(one,R88,{fromMs:R88}),true);assert.equal(IG.eligible(one,{toMillis:()=>R88+1},{fromMs:R88}),true);assert.equal(IG.eligible(one,new Date(R88),{fromMs:R88}),true);
for(const old of [R88-1,null,undefined,'2026-11-06',NaN,{}])assert.equal(IG.eligible(one,old,{fromMs:R88}),false,`not for ${String(old)}`);
assert.equal(IG.eligible('pair_short',R88,{fromMs:R88}),false);
assert.equal(IG.eligible(one,Date.parse('2026-10-31T12:00:00Z')),false,'a Showdown running today never starts the game mid-way');
ok('G1b','only a Showdown confirmed on R88 or later plays Icon Unmasked, so no Showdown mixes 11-point and 12-point seasons');

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

// G3 the reveal clock
const W=IG.windowMs,P=IG.revealMs+W,S=1_800_000_000_000;
assert.deepEqual(IG.beatAt(S,S-1,W),{phase:'waiting',beat:-1,msLeft:1});
assert.deepEqual(IG.beatAt(S,S,W),{phase:'reveal',beat:0,msLeft:IG.revealMs});
assert.deepEqual(IG.beatAt(S,S+IG.revealMs,W),{phase:'window',beat:0,msLeft:W});
for(let b=0;b<IG.beats;b+=1){assert.equal(IG.beatAt(S,S+b*P+10,W).beat,b);assert.equal(IG.beatAt(S,S+(b+1)*P-1,W).phase,'window');}
assert.equal(IG.endsAt(S,W),S+8*P);assert.equal(IG.beatAt(S,S+8*P-1,W).beat,IG.flagBeat);assert.equal(IG.beatAt(S,S+8*P,W).phase,'over');
assert.equal(IG.beatAt(S,S+86_400_000,W).phase,'over','a phone that missed the whole game lands on the end');
assert.equal(IG.endsAt(S,5000),S+8*(IG.revealMs+5000));assert.equal(IG.endsAt(S,10000),S+8*(IG.revealMs+10000));
for(const bad of [4999,10001,7.5,undefined,'8000'])assert.equal(IG.endsAt(S,bad),S+8*P,`window ${String(bad)} falls back to 8 s`);
const order=['DRI','PAC','SHO','PAS','DEF','PHY'];
const hidden={overall:false,name:false};
assert.deepEqual(IG.revealed(-1,order),{position:false,stats:[],flag:false,...hidden});
assert.deepEqual(IG.revealed(0,order),{position:true,stats:[],flag:false,...hidden});
assert.deepEqual(IG.revealed(2,order),{position:true,stats:['DRI','PAC'],flag:false,...hidden});
assert.deepEqual(IG.revealed(6,order),{position:true,stats:order,flag:false,...hidden});
assert.deepEqual(IG.revealed(7,order),{position:true,stats:order,flag:true,...hidden},'the overall and name stay hidden even at the flag (Nik N2)');
assert.deepEqual(IG.resultView(order),{position:true,stats:order,flag:true,overall:true,name:true},'the result screen shows the whole card');
ok('G3','eight beats (position, six stats, flag) each a short reveal then a guess window of 8 s (5 to 10 s allowed), computed only from the server start time, so a reloaded phone rejoins on the current beat');

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
const T0=IG.startMs(r),at=b=>T0+b*P+IG.revealMs+100;
let g=IG.applyGuess(r,{role:'playerTwo',correct:false,atMs:at(1)});assert.ok(g.ok);r=g.record;
assert.deepEqual(r.chipsUsed,{playerOne:0,playerTwo:1});assert.equal(r.winner,null);
assert.ok(!JSON.stringify(r).match(/guess|name|icon/i),'a wrong guess leaves only a chip count behind');
assert.deepEqual(IG.outcome(r,at(1)).chips,{playerOne:2,playerTwo:1});assert.equal(IG.outcome(r,at(1)).state,'live');
g=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:at(4)});assert.ok(g.ok);const won=g.record;
assert.deepEqual(won.winner,{role:'playerOne',beat:4,atMs:at(4)});
assert.deepEqual(IG.outcome(won,at(4)),{state:'won',winner:'playerOne',beat:4,chips:{playerOne:1,playerTwo:1}});
assert.deepEqual(IG.points(won),{playerOne:1,playerTwo:0});
assert.equal(IG.applyGuess(won,{role:'playerTwo',correct:true,atMs:at(4)+1}).reason,'ROUND_OVER','a right guess recorded later never wins');
// Same moment: two right guesses race; whichever transaction commits first wins (the second runs on the updated record).
const raceA=IG.applyGuess(r,{role:'playerTwo',correct:true,atMs:at(5)}).record;
assert.equal(IG.applyGuess(raceA,{role:'playerOne',correct:true,atMs:at(5)-50}).reason,'ROUND_OVER','server order decides, not the earlier phone clock');
ok('G5','each accepted guess spends one chip; a wrong one leaves only the chip count; the first right guess the server records wins 1 point and ends the round');

// G6 running out, the flag window, draws
let d=r;
d=IG.applyGuess(d,{role:'playerTwo',correct:false,atMs:at(2)}).record;
assert.equal(IG.applyGuess(d,{role:'playerTwo',correct:true,atMs:at(3)}).reason,'NO_CHIPS','a manager out of chips only watches');
assert.equal(IG.outcome(d,at(3)).state,'live','the other manager can still win');
d=IG.applyGuess(d,{role:'playerOne',correct:false,atMs:at(3)}).record;
d=IG.applyGuess(d,{role:'playerOne',correct:false,atMs:at(7)}).record;
assert.deepEqual(IG.outcome(d,at(7)),{state:'draw',winner:null,beat:null,chips:{playerOne:0,playerTwo:0}},'all four chips spent: a draw at once');
assert.deepEqual(IG.points(d),{playerOne:0,playerTwo:0});
const late=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:IG.endsAt(T0)});assert.equal(late.reason,'ROUND_OVER','nothing counts after the flag window');
assert.equal(IG.outcome(r,IG.endsAt(T0)-1).state,'live');assert.equal(IG.outcome(r,IG.endsAt(T0)).state,'draw','nobody by the flag: a draw, nobody scores');
const flag=IG.applyGuess(r,{role:'playerOne',correct:true,atMs:at(7)});assert.equal(flag.record.winner.beat,IG.flagBeat,'the flag window is the last chance');
ok('G6','a manager with no chips only watches; all chips spent or the flag window closing with no right guess is a draw with no points');

// G7 the record guard (what the Rules fragment will mirror)
assert.ok(IG.validRecord(won)&&IG.validRecord(d));
const bads=[
  null,{...won,v:2},{...won,season:11},{...won,chipsUsed:{playerOne:3,playerTwo:0}},{...won,chipsUsed:{playerOne:-1,playerTwo:0}},
  {...won,chipsUsed:{playerOne:1,playerTwo:0},winner:{role:'playerTwo',beat:4,atMs:1}},{...won,winner:{role:'playerOne',beat:8,atMs:1}},{...won,winner:{role:'x',beat:1,atMs:1}},
  {...IG.newRecord(1),chipsUsed:{playerOne:1,playerTwo:0}},{...won,arrived:{playerOne:'soon',playerTwo:null}}
];
for(const bad of bads){assert.equal(IG.validRecord(bad),false,JSON.stringify(bad));assert.equal(IG.applyGuess(bad,{role:'playerOne',correct:true,atMs:at(1)}).reason,'BAD_RECORD');assert.equal(IG.outcome(bad,0),null);assert.deepEqual(IG.points(bad),{playerOne:0,playerTwo:0});}
for(const bad of [{role:'playerOne',correct:'yes',atMs:at(1)},{role:'playerOne',correct:true},{role:'ref',correct:true,atMs:at(1)},undefined])assert.equal(IG.applyGuess(r,bad).reason,'BAD_GUESS');
assert.ok(Object.isFrozen(won)&&Object.isFrozen(won.chipsUsed)&&Object.isFrozen(won.winner),'records are immutable values');
ok('G7','a record with an impossible chip count, winner, season or arrival is refused, and the point is only ever read from a valid record');

console.log(`PASS r88 icon guess round contracts (${checks} checks)`);
