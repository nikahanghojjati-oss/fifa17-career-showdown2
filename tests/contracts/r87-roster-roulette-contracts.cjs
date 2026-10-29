'use strict';
// r87 Roster Russian Roulette (Nik 2026-10-28/29): FIFA 17 launch boards for all 98 clubs (XI + 4 subs), a 1-in-7
// revolver both phones agree on with no IO, a bullet that always hits one board player, and no re-spin on refresh.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path_=require('node:path');
const vm=require('node:vm');
const {randomBytes,createHash}=require('node:crypto');
const ROOT=path_.resolve(__dirname,'../..');
const Squads=require('../../data/rosterSquads.js');
const RRR=require('../../js/rosterRoulette.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// L1 boards: every catalog club, 11 starters with one goalkeeper, exactly 4 subs, sane shirts and ratings.
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path_.join(ROOT,'data/clubs.js'),'utf8')+';this.c=clubsByLeague',ctx);
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
const src=fs.readFileSync(path_.join(ROOT,'js/rosterRoulette.js'),'utf8').replace(/\/\/.*$/gm,'');
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
// A fixed corpus of ids, so the tight spread check below is reproducible and never fails by chance.
const fixedId=g=>`pair_${createHash('sha256').update(`rrr-contract-${g}`).digest('hex')}`;
for(let g=0;g<3000;g+=1){
  const r=fixedId(g);let prev={playerOne:null,playerTwo:null};
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

// L6 the board store (js/rosterBoardStore.js) on a fake transaction SDK, and the Rules it relies on: 1 write per manager per
// season, a saved board is never replaced, a phone copy answers later reads, nothing but transaction reads, and the Rules
// accept exactly the positions and name length the engine accepts.
(async()=>{
  const Store=require('../../js/rosterBoardStore.js');
  const docs=new Map(),log=[];
  const fakeSdk={
    doc:(db,...parts)=>({path:parts.join('/')}),
    serverTimestamp:()=>'SERVER_TIME',
    runTransaction:async(db,fn)=>fn({
      get:async ref=>{log.push(['get',ref.path]);const v=docs.get(ref.path);return {exists:()=>v!==undefined,data:()=>v};},
      set:(ref,value)=>{log.push(['set',ref.path]);docs.set(ref.path,JSON.parse(JSON.stringify(value)));}
    })
  };
  const base={firestore:{},firebaseSdk:fakeSdk,rivalryId:rid,sessionId:`session_${'3'.repeat(64)}`,deviceId:`device_${'a'.repeat(32)}`};
  const rows=fill(RRR.draft(rid,clubs,2,'playerOne'),2);
  const path=`rivalries/${rid}/rosterBoards/season_2_playerOne`;
  const missing=await Store.read({...base,season:2,role:'playerOne'});
  assert.deepEqual([missing.ok,missing.rows],[true,null]);
  const saved=await Store.save({...base,season:2,role:'playerOne',rows});
  assert.deepEqual([saved.ok,saved.created],[true,true]);
  const stored=docs.get(path);
  assert.deepEqual(Object.keys(stored).sort(),['activeSessionId','createdAt','managerRole','names','objectType','positions','rivalryId','schemaVersion','seasonNumber','updatedByDeviceId']);
  assert.equal(stored.positions.length,11);assert.equal(stored.names.length,15);assert.equal(stored.createdAt,'SERVER_TIME');
  assert.deepEqual(stored.names,rows.map(r=>r.name));assert.deepEqual(stored.positions,rows.slice(0,11).map(r=>r.pos));
  const changed=rows.map((r,i)=>i===3?{...r,name:'Changed Mind'}:r);
  const before=log.length;
  const again=await Store.save({...base,season:2,role:'playerOne',rows:changed});
  assert.deepEqual([again.created,again.rows[3].name],[false,rows[3].name]);assert.equal(log.length,before,'a second save on this phone costs nothing');
  Store.forgetPhoneCopies();
  const fresh=await Store.save({...base,season:2,role:'playerOne',rows:changed});
  assert.deepEqual([fresh.created,fresh.rows[3].name],[false,rows[3].name],'a fresh page keeps the board locked first');
  assert.equal(log.filter(([k])=>k==='set').length,1,'exactly one write');
  Store.forgetPhoneCopies();
  const read=await Store.read({...base,season:2,role:'playerOne'});
  assert.deepEqual([read.source,read.rows],['server',rows]);
  const n=log.length;assert.equal((await Store.read({...base,season:2,role:'playerOne'})).source,'phone');assert.equal(log.length,n);
  for(const [opts,code] of [[{rows:rows.slice(0,14)},'ROSTER_BOARD_INVALID'],[{season:1},'ROSTER_SEASON_INVALID'],[{role:'nobody'},'ROSTER_ROLE_INVALID'],[{sessionId:'x'},'ROSTER_SESSION_INVALID'],[{season:3,firebaseSdk:{doc:fakeSdk.doc}},'ROSTER_PROVIDER_UNAVAILABLE']]){
    const r=await Store.save({...base,season:2,role:'playerOne',rows,...opts});assert.deepEqual([r.ok,r.code],[false,code]);
  }
  const src=fs.readFileSync(path_.join(ROOT,'js/rosterBoardStore.js'),'utf8');
  assert.ok(!/\b(?:getDocs?|getDocFromServer|onSnapshot|setDoc)\b/.test(src)&&/runTransaction/.test(src),'transaction reads and writes only');
  const rules=fs.readFileSync(path_.join(ROOT,'firestore.persistent-pair-production.fragment.rules'),'utf8');
  const listed=rules.match(/positions\.toSet\(\)\.hasOnly\(\[([^\]]+)\]\)/)[1].split(',').map(x=>x.trim().replace(/'/g,''));
  assert.deepEqual(listed,RRR.positions.filter(p=>p!=='SUB'),'the Rules accept exactly the engine positions');
  assert.ok(rules.includes(`{0,${RRR.nameMax-2}}`),'the Rules name length matches the engine');
  assert.ok(rules.includes('allow create: if cmsRosterBoardCreateValid(rivalryId, boardId);')&&rules.includes('allow update, list, delete: if false;'));
  ok('L6','board store: 1 write, locked once saved, phone copy, transaction reads only; Rules match the engine');
  console.log(`r87 roster roulette contracts: ${checks} groups passed`);
})().catch(error=>{console.error(error);process.exit(1);});
