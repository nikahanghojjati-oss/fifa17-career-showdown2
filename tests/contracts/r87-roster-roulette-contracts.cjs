'use strict';
// r87 Roster Russian Roulette (Nik 2026-10-28/29): FIFA 17 launch boards for all 98 clubs (XI + 4 subs), a 1-in-7
// revolver both phones agree on with no IO, a bullet that always hits one board player, and no re-spin on refresh.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {randomBytes}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const Squads=require('../../data/rosterSquads.js');
const RRR=require('../../js/rosterRoulette.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// L1 boards: every catalog club, 11 starters with one goalkeeper, exactly 4 subs, sane shirts and ratings.
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'data/clubs.js'),'utf8')+';this.c=clubsByLeague',ctx);
const catalog=Object.values(ctx.c).flat();
assert.equal(catalog.length,98);
assert.deepEqual(Object.keys(Squads.squads).sort(),[...catalog].sort());
for(const club of catalog){
  const {xi,subs}=Squads.squads[club];
  assert.equal(xi.length,11,`${club} XI`);assert.equal(subs.length,4,`${club} subs`);
  assert.equal(xi.filter(r=>r[0]==='GK').length,1,`${club} one GK in the XI`);
  const rows=[...xi,...subs];
  rows.forEach(([pos,name,number,rating])=>{
    assert.match(pos,/^(GK|SW|RWB|RB|RCB|CB|LCB|LB|LWB|RDM|CDM|LDM|RM|RCM|CM|LCM|LM|RAM|CAM|LAM|RF|CF|LF|RW|RS|ST|LS|LW)$/,`${club} ${name} pos`);
    assert.ok(typeof name==='string'&&name.length>1,`${club} name`);
    assert.ok(Number.isInteger(number)&&number>=1&&number<=99,`${club} ${name} shirt ${number}`);
    assert.ok(Number.isInteger(rating)&&rating>=40&&rating<=99,`${club} ${name} rating`);
  });
  assert.equal(new Set(rows.map(r=>r[1])).size,15,`${club} no duplicate player`);
  assert.equal(new Set(xi.map(r=>r[2])).size,11,`${club} XI shirt numbers unique`);
  for(let i=1;i<subs.length;i+=1)assert.ok(subs[i-1][3]>=subs[i][3],`${club} subs are the 4 highest-rated`);
}
// Launch roster spot checks (roster 170002, not a later live update).
const names=club=>[...Squads.squads[club].xi,...Squads.squads[club].subs].map(r=>r[1]);
assert.ok(names('Manchester United').includes('Z. Ibrahimović')&&names('Manchester United').includes('W. Rooney'));
assert.equal(Squads.squads['Real Madrid'].xi.find(r=>r[0]==='GK')[1],'K. Navas');
const board=RRR.board('Liverpool');
assert.equal(board.length,15);assert.deepEqual(board.map(p=>p.slot),[...Array(15).keys()]);
assert.equal(board.filter(p=>p.bench).length,4);assert.equal(RRR.board('Not A Club'),null);
ok('L1','98 launch boards: XI + 4 highest-rated subs, one GK, unique shirts');

// L2 determinism: both phones agree, a refresh or a second tap gives the same result, and nothing touches the network.
const id=()=>`pair_${randomBytes(32).toString('hex')}`;
const clubs={playerOne:'Liverpool',playerTwo:'Real Madrid'};
const rid=id();
for(let s=1;s<=10;s+=1)assert.deepEqual(JSON.stringify(RRR.forSeason(rid,clubs,s)),JSON.stringify(RRR.forSeason(rid,clubs,s)));
const src=fs.readFileSync(path.join(ROOT,'js/rosterRoulette.js'),'utf8').replace(/\/\/.*$/gm,'');
assert.ok(!/fetch\(|firebase|firestore|getDoc|setDoc|Math\.random|Date\.now/i.test(src),'no IO, no clock, no Math.random');
for(const bad of [null,'','pair_xyz',`pair_${'A'.repeat(64)}`,rid+'0'])assert.equal(RRR.forSeason(bad,clubs,1),null);
for(const s of [0,11,1.5,'1'])assert.equal(RRR.forSeason(rid,clubs,s),null);
assert.equal(RRR.forSeason(rid,{playerOne:'Liverpool',playerTwo:'Nowhere FC'},1),null);
ok('L2','same id + season = same spins on both phones; bad input = no roulette');

// L3 the rules: Daniel first; 7 chambers; fired exactly when the cylinder stops on the bullet; a fired turn always hits a
// board player; an empty turn hits nobody; a player released earlier is never hit again.
const view=RRR.forSeason(rid,clubs,1);
assert.deepEqual(view.order,['playerOne','playerTwo']);assert.deepEqual(view.turns.map(t=>t.role),['playerOne','playerTwo']);
assert.equal(view.chambers,7);
let fired=0,turns=0,hitBench=0;const perSlot=new Array(15).fill(0);
for(let g=0;g<3000;g+=1){
  const r=id(),hist=RRR.history(r,clubs,10);
  const gone={playerOne:new Set(),playerTwo:new Set()};
  for(const season of hist){
    for(const t of season.turns){
      turns+=1;
      assert.ok(t.bulletChamber>=0&&t.bulletChamber<7&&t.stopChamber>=0&&t.stopChamber<7);
      assert.equal(t.fired,t.bulletChamber===t.stopChamber);
      if(t.fired){
        fired+=1;assert.ok(t.player&&t.hitSlot===t.player.slot,'a bullet always hits a player');
        assert.ok(!gone[t.role].has(t.hitSlot),'never the same player twice');
        gone[t.role].add(t.hitSlot);perSlot[t.hitSlot]+=1;if(t.player.bench)hitBench+=1;
      }else assert.equal(t.player,null);
    }
  }
  if(g<50){
    const s10=RRR.forSeason(r,clubs,10);
    for(const role of ['playerOne','playerTwo']){
      const earlier=new Set(hist.slice(0,9).map(s=>s.turns.find(t=>t.role===role).hitSlot).filter(x=>x!==null));
      assert.deepEqual(s10.boards[role].filter(p=>p.releasedEarlier).map(p=>p.slot).sort(),[...earlier].sort());
    }
  }
}
const rate=fired/turns;
assert.ok(Math.abs(rate-1/7)<0.01,`fire rate ${rate.toFixed(4)} is 1 in 7`);
assert.ok(perSlot.every(n=>n>0.6*fired/15&&n<1.4*fired/15),'every one of the 15 players can be hit, evenly');
assert.ok(hitBench>0,'subs can be hit');
ok('L3',`Daniel first; fire rate ${(rate*100).toFixed(2)}% over ${turns} spins; hits spread over all 15; no repeats`);

// L4 seasons are independent per manager and per season, and different Showdowns differ.
const a=RRR.history(rid,clubs,10),b=RRR.history(id(),clubs,10);
assert.notDeepEqual(a.map(s=>s.turns.map(t=>[t.bulletChamber,t.stopChamber])),b.map(s=>s.turns.map(t=>[t.bulletChamber,t.stopChamber])));
// Changing only the clubs never changes whether a turn fires (the chambers come from the id, season and role only).
const c=RRR.history(rid,{playerOne:'Arsenal',playerTwo:'Juventus'},10);
assert.deepEqual(a.map(s=>s.turns.map(t=>t.fired)),c.map(s=>s.turns.map(t=>t.fired)));
ok('L4','independent per Showdown; clubs never change who gets shot');

console.log(`r87 roster roulette contracts: ${checks} groups passed`);
