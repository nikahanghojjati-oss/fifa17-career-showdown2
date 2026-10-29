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
// board player and every one of the 15 can be hit; an empty turn hits nobody. Season 1 is the launch board; from season 2
// each manager's own edited board (drafted from last season's minus the player shot) decides the name.
const view=RRR.forSeason(rid,clubs,1);
assert.deepEqual(view.order,['playerOne','playerTwo']);assert.deepEqual(view.turns.map(t=>t.role),['playerOne','playerTwo']);
assert.equal(view.chambers,7);assert.equal(view.boards.playerOne[0].name,RRR.board('Liverpool')[0].name);
const fill=(draft,season)=>draft.map(p=>({pos:p.pos,name:p.name||`New Signing ${season}-${p.slot}`}));
let fired=0,turns=0,hitBench=0;const perSlot=new Array(15).fill(0);
for(let g=0;g<3000;g+=1){
  const r=id();let prev={playerOne:null,playerTwo:null};
  for(let season=1;season<=10;season+=1){
    let edited=null;
    if(season>1){
      edited={};
      for(const role of ['playerOne','playerTwo']){
        const draft=RRR.draft(r,clubs,season,role,prev[role]);
        assert.equal(draft.length,15);
        const last=RRR.forSeason(r,clubs,season-1,season-1>1?prev:null).turns.find(t=>t.role===role);
        assert.deepEqual(draft.filter(p=>p.name==='').map(p=>p.slot),last.fired?[last.hitSlot]:[],'only the player shot last season is taken off');
        edited[role]=fill(draft,season);
      }
    }
    const v=RRR.forSeason(r,clubs,season,edited);
    for(const t of v.turns){
      turns+=1;
      assert.ok(t.bulletChamber>=0&&t.bulletChamber<7&&t.stopChamber>=0&&t.stopChamber<7);
      assert.equal(t.fired,t.bulletChamber===t.stopChamber);
      if(t.fired){
        fired+=1;assert.ok(t.player&&t.hitSlot===t.player.slot,'a bullet always hits a player');
        assert.equal(t.player.name,v.boards[t.role][t.hitSlot].name);
        perSlot[t.hitSlot]+=1;if(t.player.bench)hitBench+=1;
      }else{assert.equal(t.player,null);assert.equal(t.hitSlot,null);}
    }
    prev={playerOne:v.boards.playerOne,playerTwo:v.boards.playerTwo};
  }
}
const rate=fired/turns;
assert.ok(Math.abs(rate-1/7)<0.01,`fire rate ${rate.toFixed(4)} is 1 in 7`);
assert.ok(perSlot.every(n=>n>0.85*fired/15&&n<1.15*fired/15),'every one of the 15 players can be hit, evenly');
assert.ok(hitBench>0,'subs can be hit');
ok('L3',`Daniel first; fire rate ${(rate*100).toFixed(2)}% over ${turns} spins; hits spread over all 15; edited boards name the hit`);

// L4 seasons are independent per Showdown; clubs and board edits never change who gets shot or which slot.
const seq=r=>Array.from({length:10},(_,i)=>RRR.forSeason(r,clubs,i+1).turns.map(t=>[t.bulletChamber,t.stopChamber,t.hitSlot]));
assert.notDeepEqual(seq(rid),seq(id()));
const other={playerOne:'Arsenal',playerTwo:'Juventus'};
for(let s=1;s<=10;s+=1)assert.deepEqual(RRR.forSeason(rid,clubs,s).turns.map(t=>[t.fired,t.hitSlot]),RRR.forSeason(rid,other,s).turns.map(t=>[t.fired,t.hitSlot]));
// A board not saved yet: the slot is already fixed, only the name waits.
const s2=RRR.forSeason(rid,clubs,2,{playerOne:fill(RRR.draft(rid,clubs,2,'playerOne'),2)});
assert.equal(s2.boards.playerTwo,null);assert.equal(s2.turns[1].player,null);
ok('L4','independent per Showdown; clubs and edits never change who gets shot; unsaved board = name pending');

// L5 an edited board must be a real board: 11 + 4, one GK in the XI, subs marked SUB, names 1-40 chars, no player twice.
const good=fill(RRR.draft(rid,clubs,2,'playerOne'),2);
const gk=good.findIndex(p=>p.pos==='GK'),outfield=gk===0?1:0;
assert.ok(RRR.normalizeBoard(good));
const bad=[
  null,good.slice(0,14),[...good,good[0]],
  good.map((p,i)=>i===gk?{...p,pos:'ST'}:p),                      // no keeper
  good.map((p,i)=>i===outfield?{...p,pos:'GK'}:p),               // two keepers
  good.map((p,i)=>i===12?{...p,pos:'ST'}:p),                      // sub not SUB
  good.map((p,i)=>i===outfield?{...p,pos:'SUB'}:p),              // starter marked SUB
  good.map((p,i)=>i===3?{...p,pos:'XX'}:p),
  good.map((p,i)=>i===4?{...p,name:''}:p),
  good.map((p,i)=>i===4?{...p,name:' Kane'}:p),
  good.map((p,i)=>i===4?{...p,name:'x'.repeat(41)}:p),
  good.map((p,i)=>i===11?{...p,name:good[12].name.toUpperCase()}:p), // same player twice
  good.map((p,i)=>i===5?{...p,name:7}:p),
];
for(const b of bad)assert.equal(RRR.normalizeBoard(b),null);
assert.equal(RRR.draft(rid,clubs,1,'playerOne'),null);assert.equal(RRR.draft(rid,clubs,3,'playerOne',null),null);assert.equal(RRR.draft(rid,clubs,2,'nobody'),null);
ok('L5','edited boards are checked: 11 + 4, one GK, no duplicates, clean names');

console.log(`r87 roster roulette contracts: ${checks} groups passed`);
