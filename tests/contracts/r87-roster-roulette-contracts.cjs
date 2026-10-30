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
// board player; the Special Player is never hit and every other player has the same chance; an empty turn hits nobody.
const sp={playerOne:{name:'L. Messi',overall:93},playerTwo:{name:'Neymar',overall:92}};
const view=RRR.forSeason(rid,clubs,1,{special:sp});
assert.deepEqual(view.order,['playerOne','playerTwo']);assert.deepEqual(view.turns.map(t=>t.role),['playerOne','playerTwo']);
assert.equal(view.chambers,7);
// Fixed signings per season: one kept (overall rises each season), one released by the rival's guess, one with no overall.
const sign=(role,k)=>[{slot:1,name:`${role} keep ${k}`,overall:70+k,release:false},{slot:2,name:`${role} gone ${k}`,overall:95,release:true},{slot:3,name:`${role} old ${k}`,overall:null,release:false}];
const hist=[null];for(let k=1;k<=9;k+=1)hist.push({playerOne:sign('D',k),playerTwo:sign('N',k)});
let fired=0,turns=0,spHits=0,hitBench=0;const perSlot={playerOne:new Array(15).fill(0),playerTwo:new Array(15).fill(0)};
// A fixed corpus of ids, so the tight spread check below is reproducible and never fails by chance.
const fixedId=g=>`pair_${createHash('sha256').update(`rrr-contract-${g}`).digest('hex')}`;
for(let g=0;g<3000;g+=1){
  const r=fixedId(g);
  for(let season=1;season<=10;season+=1){
    const v=RRR.forSeason(r,clubs,season,{special:sp,history:hist});
    for(const t of v.turns){
      turns+=1;const board=v.boards[t.role];
      assert.equal(board.length,15);assert.equal(board.filter(p=>p.special).length,1,'the Special Player stays on the board');
      assert.ok(t.bulletChamber>=0&&t.bulletChamber<7&&t.stopChamber>=0&&t.stopChamber<7);
      assert.equal(t.fired,t.bulletChamber===t.stopChamber);
      if(t.fired){
        fired+=1;assert.ok(t.player&&t.hitSlot===t.player.slot&&t.player.name,'a bullet always hits a player');
        assert.equal(t.player.name,board[t.hitSlot].name);
        if(t.player.special)spHits+=1;
        
        if(t.player.bench)hitBench+=1;
      }else{assert.equal(t.player,null);assert.equal(t.hitSlot,null);}
    }
  }
}
const rate=fired/turns;
assert.ok(Math.abs(rate-1/7)<0.01,`fire rate ${rate.toFixed(4)} is 1 in 7`);
assert.equal(spHits,0,'the Special Player is never hit');
// Season 1 boards are the same in every game, so each manager's 14 targets share his fired turns evenly (a larger fixed corpus).
for(let g=0;g<60000;g+=1){for(const t of RRR.forSeason(fixedId(g),clubs,1,{special:sp}).turns)if(t.fired)perSlot[t.role][t.hitSlot]+=1;}
const s1=RRR.forSeason(fixedId(0),clubs,1,{special:sp});
for(const role of ['playerOne','playerTwo']){
  const at=s1.boards[role].findIndex(p=>p.special),hits=perSlot[role],total=hits.reduce((a,b)=>a+b,0);
  assert.equal(hits[at],0);
  assert.ok(hits.filter((n,i)=>i!==at).every(n=>n>0.85*total/14&&n<1.15*total/14),'every other player has the same chance');
}
assert.ok(hitBench>0,'subs can be hit');
ok('L3',`Daniel first; fire rate ${(rate*100).toFixed(2)}% over ${turns} spins; Special Player never hit; the other 14 evenly`);

// L4 the board builds itself: Special Player in for the lowest overall in season 1; from season 2 the player shot last season
// is out and last season's kept signings come in (empty slot first, then over the lowest overall when strictly better);
// released signings and signings without an overall never join.
{
  const launch=RRR.board('Liverpool');
  const low=Math.min(...launch.map(p=>p.rating)),lowAt=launch.map(p=>p.rating).lastIndexOf(low);
  const b1=RRR.forSeason(rid,clubs,1,{special:sp}).boards.playerOne;
  assert.equal(b1[lowAt].name,'L. Messi');assert.equal(b1[lowAt].pos,launch[lowAt].pos,'the slot keeps its position');
  assert.equal(RRR.forSeason(rid,clubs,1,{special:null}).boards.playerOne[lowAt].name,launch[lowAt].name,'no Special Player before r86');
  // Special Player already in the squad: he is marked, nobody leaves.
  const own=RRR.forSeason(rid,clubs,1,{special:{playerOne:{name:launch[0].name,overall:90},playerTwo:sp.playerTwo}}).boards.playerOne;
  assert.deepEqual(own.map(p=>p.name),launch.map(p=>p.name));assert.ok(own[0].special);
  for(let g=0;g<400;g+=1){
    const r=fixedId(g);
    for(let season=2;season<=10;season+=1){
      const before=RRR.forSeason(r,clubs,season-1,{special:sp,history:hist}),after=RRR.forSeason(r,clubs,season,{special:sp,history:hist});
      for(const role of ['playerOne','playerTwo']){
        const turn=before.turns.find(t=>t.role===role),prev=before.boards[role],next=after.boards[role],kept=hist[season-1][role][0];
        const shot=turn.fired?turn.player.name:null;
        if(shot)assert.ok(!next.some(p=>p.name===shot)||kept.name===shot,'the player shot last season is gone');
        for(const gone of hist[season-1][role].slice(1))assert.ok(!next.some(p=>p.name===gone.name),'released or no-overall signings never join');
        const rest=prev.filter(p=>p.name&&p.name!==shot&&!p.special),weakest=Math.min(...rest.map(p=>p.rating));
        const joins=shot!==null||kept.overall>weakest;
        assert.equal(next.some(p=>p.name===kept.name),joins,`season ${season}: kept signing joins only into an empty slot or over a weaker player`);
        assert.ok(next.some(p=>p.special&&p.name===sp[role].name),'the Special Player never leaves');
        assert.equal(next.filter(p=>!p.name).length,0,'every empty slot is filled when a signing exists');
      }
    }
  }
  // A missing season of history = no roulette (the step reads it first).
  assert.equal(RRR.forSeason(rid,clubs,3,{special:sp,history:[null,hist[1]]}),null);
  // No kept signing: the shot slot stays empty and is never a target.
  const empty=[null];for(let k=1;k<=9;k+=1)empty.push({playerOne:[],playerTwo:[]});
  for(let g=0;g<400;g+=1){const r=fixedId(g);for(let season=2;season<=10;season+=1){const v=RRR.forSeason(r,clubs,season,{special:sp,history:empty});for(const t of v.turns)if(t.fired)assert.ok(t.player.name&&!t.player.special);}}
  ok('L4','auto board: Special Player in season 1; shot player out, kept signings in by overall; released and no-overall signings never join');
}

// L5 seasons are independent per Showdown; the same inputs give the same boards and spins on both phones.
const seq=r=>Array.from({length:10},(_,i)=>RRR.forSeason(r,clubs,i+1,{special:sp,history:hist}).turns.map(t=>[t.bulletChamber,t.stopChamber,t.hitSlot]));
assert.notDeepEqual(seq(rid),seq(id()));assert.deepEqual(seq(rid),seq(rid));
ok('L5','independent per Showdown; same inputs, same result');

// L6 the season step: no board editor, no board document, no new Firebase path; the boards come from the Transfer War
// verdicts (kept on the phone, else one Transfer Challenge read per missing season); the Rule Book says the Special
// Player is never hit.
{
  const step=fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8'),pstc=fs.readFileSync(path_.join(ROOT,'js/productionSharedTransferChallenge.js'),'utf8');
  assert.ok(!fs.existsSync(path_.join(ROOT,'js/rosterBoardStore.js')));
  assert.ok(!/rosterBoards|rrsEditor|LOCK MY BOARD/.test(step),'no board editor or board document');
  assert.ok(!/rosterBoards/.test(fs.readFileSync(path_.join(ROOT,'firestore.persistent-pair-production.fragment.rules'),'utf8')),'no board Rules');
  assert.match(pstc,/verdicts:season=>pstcRouletteVerdicts\(request,season\)/);
  assert.match(pstc,/careerModeShowdown\.rouletteVerdicts\.v1/);
  assert.match(pstc,/provider\.read\(\{\.\.\.provided\.options,seasonNumber:season\}\)/);
  assert.match(step,/history:ctx\.season>1\?|const history=ctx\.season>1\?await rrsHistory\(ctx\):\[null\]/);
  const rules=fs.readFileSync(path_.join(ROOT,'js/ruleBook.js'),'utf8');
  assert.match(rules,/Special Player is never hit/,'Rule Book: the Special Player is never hit');
  ok('L6','season step: auto boards from Transfer War verdicts, no editor, no new path; Rule Book line');
}
console.log(`r87 roster roulette contracts: ${checks} groups passed`);
