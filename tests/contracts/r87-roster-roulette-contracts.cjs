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
const Players=require('../../data/fifa17Players.js');
const RRR=require('../../js/rosterRoulette.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// L1 boards: every catalog club, 11 starters with one goalkeeper, exactly 4 subs, sane shirts and ratings.
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path_.join(ROOT,'data/clubs.js'),'utf8')+';this.c=clubsByLeague',ctx);
const catalog=Object.values(ctx.c).flat();
assert.equal(catalog.length,98);
assert.deepEqual(Object.keys(Squads.squads).sort(),[...catalog].sort());
for(const club of catalog){
  const {xi,subs,reserves}=Squads.squads[club];
  assert.equal(xi.length,11,`${club} XI`);assert.equal(subs.length,4,`${club} subs`);assert.equal(reserves.length,3,`${club} reserves`);
  assert.equal(xi.filter(r=>r[0]==='GK').length,1,`${club} one GK in the XI`);
  const rows=[...xi,...subs,...reserves];
  rows.forEach(([pos,name,number,rating])=>{
    assert.match(pos,/^(GK|SW|RWB|RB|RCB|CB|LCB|LB|LWB|RDM|CDM|LDM|RM|RCM|CM|LCM|LM|RAM|CAM|LAM|RF|CF|LF|RW|RS|ST|LS|LW)$/,`${club} ${name} pos`);
    assert.ok(typeof name==='string'&&name.length>1,`${club} name`);
    assert.ok(Number.isInteger(number)&&number>=1&&number<=99,`${club} ${name} shirt ${number}`);
    assert.ok(Number.isInteger(rating)&&rating>=40&&rating<=99,`${club} ${name} rating`);
  });
  assert.equal(new Set(rows.map(r=>r[1].trim().toLowerCase())).size,18,`${club} no duplicate player`);
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
// board player; the Special Player is never on the board (so never hit) and every player has the same chance; an empty
// non-firing turn hits nobody.
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
      assert.equal(board.length,15);assert.equal(board.filter(p=>p.special||p.name===sp[t.role].name).length,0,'the Special Player is never on the board');
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
// Season 1 boards are the same in every game, so each manager's 15 targets share his fired turns evenly (a larger fixed corpus).
for(let g=0;g<60000;g+=1){for(const t of RRR.forSeason(fixedId(g),clubs,1,{special:sp}).turns)if(t.fired)perSlot[t.role][t.hitSlot]+=1;}
const s1=RRR.forSeason(fixedId(0),clubs,1,{special:sp});
for(const role of ['playerOne','playerTwo']){
  const hits=perSlot[role],total=hits.reduce((a,b)=>a+b,0);
  assert.equal(s1.boards[role].length,15);
  assert.ok(hits.every(n=>n>0.85*total/15&&n<1.15*total/15),'every player has the same chance');
}
assert.ok(hitBench>0,'subs can be hit');
ok('L3',`Daniel first; fire rate ${(rate*100).toFixed(2)}% over ${turns} spins; Special Player never on the board; all 15 evenly`);

// L4 the board builds itself: the launch board in season 1 (never the Special Player); from season 2 the player shot last season
// is out and last season's kept signings come in by compatible line, then by bench overall;
// released signings and signings without an overall never join.
{
  const launch=RRR.board('Liverpool');
  const low=Math.min(...launch.map(p=>p.rating)),lowAt=launch.map(p=>p.rating).lastIndexOf(low);
  const b1=RRR.forSeason(rid,clubs,1,{special:sp}).boards.playerOne;
  assert.deepEqual(b1.map(p=>p.name),launch.map(p=>p.name),'season 1 is the launch board; the Special Player never joins');
  assert.equal(b1[lowAt].pos,launch[lowAt].pos);
  assert.deepEqual(RRR.forSeason(rid,clubs,1,{special:null}).boards.playerOne.map(p=>p.name),launch.map(p=>p.name),'no Special Player before r86');
  // Special Player already in the club's squad: skip him and fill his slot immediately.
  const spOwn={playerOne:{name:launch[0].name,overall:90},playerTwo:sp.playerTwo};
  const own=RRR.forSeason(rid,clubs,1,{special:spOwn}).boards.playerOne;
  assert.ok(own[0].name&&own[0].name!==launch[0].name);assert.equal(own.length,15);
  assert.ok(own.every(p=>p.name&&p.rating>0));assert.ok(!own.some(p=>p.name===launch[0].name));
  for(let g=0;g<200;g+=1){const v=RRR.forSeason(fixedId(g),clubs,1,{special:spOwn});for(const t of v.turns)if(t.fired)assert.ok(t.player.name&&t.player.name!==spOwn[t.role].name,'every fired turn hits a replacement, never the Special Player');}
  // A kept signing with the Special Player's name never joins.
  const spHist=[null,{playerOne:[{slot:1,name:sp.playerOne.name,overall:93,release:false}],playerTwo:[]}];
  assert.ok(!RRR.forSeason(rid,clubs,2,{special:sp,history:spHist}).boards.playerOne.some(p=>p.name===sp.playerOne.name));
  for(let g=0;g<400;g+=1){
    const r=fixedId(g);
    for(let season=2;season<=10;season+=1){
      const before=RRR.forSeason(r,clubs,season-1,{special:sp,history:hist}),after=RRR.forSeason(r,clubs,season,{special:sp,history:hist});
      const fallbackHistory=hist.slice();fallbackHistory[season-1]={playerOne:[],playerTwo:[]};
      const fallback=RRR.forSeason(r,clubs,season,{special:sp,history:fallbackHistory});
      for(const role of ['playerOne','playerTwo']){
        const turn=before.turns.find(t=>t.role===role),prev=before.boards[role],next=after.boards[role],kept=hist[season-1][role][0];
        const shot=turn.fired?turn.player.name:null;
        if(shot)assert.ok(!next.some(p=>p.name===shot)||kept.name===shot,'the player shot last season is gone');
        for(const gone of hist[season-1][role].slice(1))assert.ok(!next.some(p=>p.name===gone.name),'released or no-overall signings never join');
        // These synthetic names have no database position, so they may only join the bench.
        // Compare against the independently rebuilt board with no current-season signing:
        // promotion now fills its bench vacancy from reserves before an overall comparison.
        const floor=Math.min(...fallback.boards[role].filter(p=>p.bench).map(p=>p.rating));
        const joins=!!shot&&turn.player.bench||kept.overall>floor;
        assert.equal(next.some(p=>p.name===kept.name),joins,`season ${season}: sub-only signing fills a shot sub or beats a weaker replacement sub`);
        assert.ok(!next.some(p=>p.special||p.name===sp[role].name),'the Special Player is never on the board');
        assert.equal(next.filter(p=>p.name&&p.rating>0).length,15,'board is always full');
        assert.ok(!next.some(p=>!p.bench&&p.name===kept.name),'unknown-position signing stays sub-only');
      }
    }
  }
  // A missing season of history = no roulette (the step reads it first).
  assert.equal(RRR.forSeason(rid,clubs,3,{special:sp,history:[null,hist[1]]}),null);
  // No kept signing: bench and reserves keep every slot filled.
  const empty=[null];for(let k=1;k<=9;k+=1)empty.push({playerOne:[],playerTwo:[]});
  for(let g=0;g<400;g+=1){const r=fixedId(g);for(let season=2;season<=10;season+=1){const v=RRR.forSeason(r,clubs,season,{special:sp,history:empty});for(const t of v.turns)if(t.fired)assert.ok(t.player.name&&!t.player.special);}}
  ok('L4','auto board: launch board in season 1, never the Special Player; shot player out, kept signings in by overall; released and no-overall signings never join');
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
  assert.match(rules,/Special Player is never on your board, so he is never hit/,'Rule Book: the Special Player is never on the board');
  ok('L6','season step: auto boards from Transfer War verdicts, no editor, no new path; Rule Book line');
}
// L7 full launch database, exact formation sets and boards regenerated from all non-starters, including reserves.
assert.equal(RRR.contractVersion,4);
assert.equal(Players.rowCount,2975);
assert.ok(fs.statSync(path_.join(ROOT,'data/fifa17Players.js')).size<400000);
assert.deepEqual(Object.keys(Players.clubs),Object.keys(Squads.squads));
let rowCount=0;
for(const [club,data] of Object.entries(Players.clubs)){
  const starters=data.players.filter(p=>!['SUB','RES',''].includes(p[3]));
  const bench=data.players.filter(p=>['SUB','RES'].includes(p[3])).sort((a,b)=>b[1]-a[1]).slice(0,4);
  rowCount+=data.players.length;
  for(const p of data.players){assert.equal(p.length,6);assert.ok(p[2].length>0);assert.ok(p[1]>=40&&p[1]<=99);assert.ok(Number.isInteger(p[4]));assert.ok(p[5]);}
  assert.deepEqual(data.slots,starters.map(p=>p[3]),club+' source slots');
  assert.deepEqual([...data.slots].sort(),[...Players.formations[data.formation]].sort(),club+' formation');
  assert.deepEqual(Squads.squads[club].xi,starters.map(p=>[p[3],p[0],p[4],p[1]]));
  assert.deepEqual(Squads.squads[club].subs,bench.map(p=>[p[2][0],p[0],p[4],p[1]]));
  const used=new Set([...starters,...bench].map(p=>p[0].trim().toLowerCase()));
  const reserves=data.players.filter(p=>['SUB','RES'].includes(p[3])).sort((a,b)=>b[1]-a[1]||a[4]-b[4]).filter(p=>{
    const key=p[0].trim().toLowerCase();if(used.has(key))return false;used.add(key);return true;
  }).slice(0,3);
  assert.deepEqual(data.reserves,reserves,club+' database reserves');
  assert.deepEqual(Squads.squads[club].reserves,reserves.map(p=>[p[2][0],p[0],p[4],p[1]]),club+' squad reserves');
  assert.ok(Object.isFrozen(data.reserves)&&data.reserves.every(p=>Object.isFrozen(p)&&Object.isFrozen(p[2])));
  assert.ok(Object.isFrozen(Squads.squads[club].reserves));
  assert.deepEqual(RRR.board(club).slice(0,11).map(p=>p.pos),data.slots);
  assert.equal(RRR.forSeason(fixedId(0),{playerOne:club,playerTwo:club},1).formations.playerOne,data.formation);
}
assert.equal(rowCount,Players.rowCount);
ok('L7','2,975 source players, 98 formation XIs, highest-rated non-starters, compact database');

const row=(name,overall,position,slot=1)=>({slot,name,overall,position,release:false});
const second=(r,cs,rows,special=null)=>RRR.forSeason(r,cs,2,{special,history:[null,{playerOne:rows,playerTwo:[]}]});
// Locate a deterministic spin with a requested outcome, without stubbing or changing the random stream.
const spinWhere=(cs,predicate)=>{
  for(let g=0;g<10000;g+=1){const r=fixedId(g);if(predicate(RRR.forSeason(r,cs,1).turns[0]))return r;}
  assert.fail('no matching deterministic spin');
};
{
  const cs={playerOne:'Liverpool',playerTwo:'Real Madrid'},r=spinWhere(cs,t=>!t.fired),launch=RRR.board(cs.playerOne);
  const cb=launch.filter(p=>!p.bench&&/CB$/.test(p.pos)).sort((a,b)=>a.rating-b.rating||a.slot-b.slot)[0];
  const v=second(r,cs,[row('New defender',90,'CB')]);
  assert.equal(v.boards.playerOne[cb.slot].name,'New defender');
  assert.ok(v.boards.playerOne.some(p=>p.bench&&p.name===cb.name),'displaced CB beats weakest sub and stays');
  assert.ok(!v.boards.playerOne.some(p=>p.name==='E. Can'),'weakest sub leaves');
  const equal=second(r,cs,[row('Equal defender',cb.rating,'CB')]);
  assert.equal(equal.boards.playerOne[cb.slot].name,cb.name,'equal overall retains starter');
  const striker=second(r,cs,[row('New striker',99,'ST')]);
  for(const p of launch.filter(p=>!p.bench&&/CB$/.test(p.pos)))assert.equal(striker.boards.playerOne[p.slot].name,p.name,'ST never displaces CB');
  const db=second(r,cs,[row('R. Lewandowski',99,null)]).boards.playerOne;
  assert.equal(db.find(p=>p.name==='R. Lewandowski').pos,'ST','missing position uses database first position');
  const old=second(r,cs,[row('Unknown old signing',99,null)]).boards.playerOne;
  assert.ok(old.find(p=>p.name==='Unknown old signing').bench,'unknown name stays sub-only');
  // Earlier signing slot wins the equal-rating competition even when verdict rows arrive out of order.
  const tied=second(r,cs,[row('Later striker',99,'ST',8),row('Earlier striker',99,'ST',2)]).boards.playerOne;
  assert.equal(tied.find(p=>p.pos==='ST').name,'Earlier striker');
  assert.ok(tied.find(p=>p.name==='Later striker').bench);
  assert.ok(!second(r,cs,[row('Bad overall',null,'ST'),row('Out of range',100,'ST'),{...row('Released',99,'ST'),release:true}]).boards.playerOne.some(p=>['Bad overall','Out of range','Released'].includes(p.name)));
}
ok('L8','CB displaces weakest CB to bench, ST preserves CBs, database fallback, strict ties and validation');

{
  const cs={playerOne:'Arsenal',playerTwo:'Liverpool'},noShot=spinWhere(cs,t=>!t.fired);
  const board=second(noShot,cs,[row('Creative signing',99,'CAM')]).boards.playerOne;
  assert.equal(board.find(p=>p.name==='Creative signing').pos,'CAM','CAM prefers AM over lower-rated CM');
  for(const [position,slots] of [['RB',['RB','RWB']],['RWB',['RB','RWB']],['LB',['LB','LWB']],['LWB',['LB','LWB']],['RW',['RM','RW']],['RM',['RM','RW']],['LW',['LM','LW']],['LM',['LM','LW']],['CM',['LDM','RDM','CAM']],['CDM',['LDM','RDM','CAM']],['CF',['ST']],['GK',['GK']]]){
    const b=second(noShot,cs,[row('Line check',99,position)]).boards.playerOne;
    assert.ok(slots.includes(b.find(p=>p.name==='Line check').pos),position+' compatible side/line');
  }
  const cbShot=spinWhere(cs,t=>t.fired&&/CB$/.test(t.player.pos));
  const shot=RRR.forSeason(cbShot,cs,1).turns[0];
  const vacant=second(cbShot,cs,[row('Vacancy defender',60,'CB')]).boards.playerOne;
  assert.equal(vacant[shot.hitSlot].name,'Vacancy defender','compatible empty XI comes before rating comparison');
  const promoted=second(cbShot,cs,[]).boards.playerOne;
  assert.equal(promoted[shot.hitSlot].name,'P. Mertesacker','same-line bench player fills empty CB slot');
  assert.ok(!promoted.some(p=>p.name===shot.player.name),'shot player leaves');
  assert.equal(promoted.filter(p=>p.name).length,15,'promotion moves player and a reserve fills the bench');
  assert.ok(promoted.some(p=>p.bench&&p.name===Squads.squads.Arsenal.reserves[0][1]));
  const rbShot=spinWhere(cs,t=>t.fired&&t.player.pos==='RB');
  assert.equal(second(rbShot,cs,[]).boards.playerOne.find(p=>p.pos==='RB').name,'P. Mertesacker','without a same-line sub, best outfield overall fills the hole');
  const gkShot=spinWhere(cs,t=>t.fired&&t.player.pos==='GK');
  const gkSecond=second(gkShot,cs,[row('Incoming keeper',70,'GK')]).boards.playerOne;
  assert.equal(gkSecond.find(p=>p.pos==='GK').name,'Incoming keeper');
  // A GK on the bench promotes to a GK vacancy; no outfield player or sub-only signing occupies GK.
  const keepers={playerOne:'Liverpool',playerTwo:'Arsenal'},rk=spinWhere(keepers,t=>t.fired&&t.player.pos==='GK');
  const bk=second(rk,keepers,[]).boards.playerOne;
  assert.equal(bk.find(p=>p.pos==='GK').name,'L. Karius');
  const noKeeper=second(gkShot,cs,[row('Unknown keeperless',99,null)]).boards.playerOne;
  assert.equal(noKeeper.find(p=>p.pos==='GK').name,'D. Ospina','database keeper fills GK when no sub is a keeper');
  assert.ok(noKeeper.find(p=>p.name==='Unknown keeperless').bench);
}
ok('L9','all position lines, CAM preference, compatible vacancies, bench promotion and GK protection');

{
  const cs={playerOne:'Liverpool',playerTwo:'Arsenal'},r=fixedId(205),history=[null];
  const ps=['GK','CB','RB','LB','CDM','CAM','RW','LW','ST'];
  for(let k=1;k<=9;k+=1)history.push(Object.fromEntries(['playerOne','playerTwo'].map(role=>[role,ps.map((p,i)=>row(`${role} ${k} ${p}`,70+(k+i)%30,p,i+1))])));
  const options={history,special:{playerOne:{name:'R. Lewandowski',overall:99},playerTwo:{name:'M. Özil',overall:89}}};
  const before=JSON.stringify({history,options,players:Players,squads:Squads});
  const run=()=>Array.from({length:10},(_,i)=>RRR.forSeason(r,cs,i+1,options));
  const a=run();assert.deepEqual(a,run(),'10 complete boards and spins identical on two calls');
  assert.equal(JSON.stringify({history,options,players:Players,squads:Squads}),before,'no input/data mutation');
  for(const v of a)for(const b of Object.values(v.boards)){
    assert.equal(b.length,15);assert.equal(b.filter(p=>p.bench).length,4);assert.equal(b.filter(p=>!p.bench).length,11);
    assert.equal(new Set(b.filter(p=>p.name).map(p=>p.name.toLowerCase())).size,b.filter(p=>p.name).length);
    assert.ok(b.slice(0,11).filter(p=>p.name&&p.positions[0]==='GK').length<=1);
    if(b.some(p=>p.name&&p.positions[0]==='GK'))assert.equal(b.slice(0,11).filter(p=>p.name&&p.positions[0]==='GK').length,1);
    for(const t of v.turns)if(t.fired)assert.ok(v.boards[t.role][t.hitSlot].name);
  }
  for(const club of catalog){
    const v=RRR.forSeason(r,{playerOne:club,playerTwo:club},10,options);
    for(const b of Object.values(v.boards)){
      assert.ok(b.every(p=>p.name.trim()&&p.rating>0),club+' never empty');
      assert.equal(b.length,15,club+' bounded board');
      assert.equal(b.slice(0,11).filter(p=>p.name&&p.positions[0]==='GK').length,1,club+' one starting GK after ten seasons');
      assert.equal(new Set(b.filter(p=>p.name).map(p=>p.name)).size,b.filter(p=>p.name).length,club+' no duplicate after ten seasons');
    }
  }
  // Browser dependencies may finish in any order; lazy data indexing must still match CommonJS.
  const sandbox={};vm.createContext(sandbox);
  for(const file of ['js/rosterRoulette.js','data/rosterSquads.js','data/fifa17Players.js'])vm.runInContext(fs.readFileSync(path_.join(ROOT,file),'utf8'),sandbox);
  assert.equal(JSON.stringify(sandbox.CareerModeRosterRoulette.forSeason(r,cs,10,options)),JSON.stringify(a[9]));
  const step=fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8');
  assert.match(step,/rrsLoad\("fifa17-players","data\/fifa17Players.js"/);
  assert.ok(fs.readFileSync(path_.join(ROOT,'service-worker.js'),'utf8').includes('"data/fifa17Players.js"'),'database retained for reload/offline');
}
// Exercise the actual scene merge: authoritative formation and rating survive into its club model.
{
  const scene=fs.readFileSync(path_.join(ROOT,'visual-assets/v10_1/roulette/index.html'),'utf8');
  const mergeSource=scene.slice(scene.indexOf('const merge=(clubName,rows,'),scene.indexOf('const dEntry=merge('));
  const browser={clubByName:()=>({xi:[['ST','Returning player',70]],subs:[]})};vm.createContext(browser);
  vm.runInContext(mergeSource+"this.result=merge('Arsenal',[{pos:'ST',name:'Returning player',rating:95}], '4-2-3-1 (2)');",browser);
  assert.equal(browser.result.formation,'4-2-3-1 (2)');assert.equal(browser.result.xi[0][2],95);
  assert.match(scene,/club\.formation\|\|formationOf\(club\.xi\)/);
  vm.runInContext("this.benchResult=merge('Arsenal',[...Array.from({length:11},()=>({pos:'CB',name:'Starter',rating:70})),{pos:'SUB',position:'GK',name:'New keeper',rating:81}], '4-2-3-1 (2)');",browser);
  assert.equal(browser.benchResult.subs[0][0],'GK','new bench players keep their position in the scene');
}
ok('L10','bounded boards, one starting GK, pure 10-season replay, browser/CommonJS agreement and data delivery');

// L11 force only the random stream in an isolated browser VM: every bullet fires, and
// slots 0..9 are targeted in turn. Production has no test option and keeps its v4 stream.
function everyBullet(slotForSeason,forceFire=()=>true){
  const context={CareerModeRosterSquads:Squads,CareerModeFifa17Players:Players,slotForSeason,forceFire};vm.createContext(context);
  const source=fs.readFileSync(path_.join(ROOT,'js/rosterRoulette.js'),'utf8');
  const needle='const next=rrStream(hex,season,role);';assert.equal(source.split(needle).length,2);
  vm.runInContext(source.replace(needle,'const values=[0,root.forceFire(season)?0:1,root.slotForSeason(season,role)];const next=()=>values.shift();'),context);
  return context.CareerModeRosterRoulette;
}
const noSignings=[null,...Array.from({length:9},()=>({playerOne:[],playerTwo:[]}))];
function fullBoard(board,label){
  assert.equal(board.length,15,label);assert.equal(board.filter(p=>!p.bench).length,11,label);
  assert.equal(board.filter(p=>p.bench).length,4,label);
  assert.equal(board.slice(0,11).filter(p=>p.pos==='GK').length,1,label);
  assert.equal(board.slice(0,11).filter(p=>p.positions[0]==='GK').length,1,label+' actual keeper');
  assert.ok(board.every(p=>p.name.trim()&&p.rating>=30&&p.rating<=99),label+' no empty row');
  assert.equal(new Set(board.map(p=>p.name.trim().toLowerCase())).size,15,label+' unique');
}
{
  const forced=everyBullet(k=>k-1);
  for(const club of catalog){
    const cs={playerOne:club,playerTwo:club},options={history:noSignings};
    const run=()=>Array.from({length:10},(_,i)=>forced.forSeason(fixedId(87),cs,i+1,options));
    const first=run();assert.equal(JSON.stringify(first),JSON.stringify(run()),club+' identical 10-season replay');
    const lost={playerOne:new Set(),playerTwo:new Set()};
    for(const v of first)for(const role of RRR.roles){
      const b=v.boards[role];fullBoard(b,club+' season '+v.season);
      for(const p of b)assert.ok(!lost[role].has(p.name),club+' shot player never returns');
      const turn=v.turns.find(t=>t.role===role);assert.equal(turn.fired,true);
      assert.ok(turn.player.name&&turn.player.rating>0);lost[role].add(turn.player.name);
    }
  }
  assert.ok(!/rrEmpty|name:\s*""|rating:\s*0\b/.test(src),'no path writes an empty board row');
  const rules=fs.readFileSync(path_.join(ROOT,'js/ruleBook.js'),'utf8');
  assert.match(rules,/lost player is replaced by a kept signing or the bench/);
  assert.match(rules,/board is always full: 11 starters and 4 subs/);
}
ok('L11','every club: 10 forced firing seasons, no kept signing, full 11 + 4 with one GK, permanent losses and identical replay');

// L12 directed replacement priorities, hidden reserves and database replenishment.
{
  const cs={playerOne:'Arsenal',playerTwo:'Liverpool'},launch=RRR.board('Arsenal');
  const cbAt=launch.find(p=>p.pos==='RCB').slot,forced=everyBullet(()=>cbAt);
  const history=rows=>[null,{playerOne:rows,playerTwo:[]}];
  const next=rows=>forced.forSeason(fixedId(88),cs,2,{history:history(rows)}).boards.playerOne;
  assert.equal(next([row('Fitting kept defender',60,'CB'),{...row('Guessed defender',99,'CB'),release:true}])[cbAt].name,'Fitting kept defender','fitting kept signing precedes bench, regardless of lost overall');
  const promoted=next([]);assert.equal(promoted[cbAt].name,'P. Mertesacker');
  assert.ok(promoted.some(p=>p.bench&&p.name===Squads.squads.Arsenal.reserves[0][1]),'best reserve refills bench');
  const sub=everyBullet(()=>14);
  const after=sub.forSeason(fixedId(89),cs,2,{history:history([])}).boards.playerOne;
  assert.equal(after[14].name,Squads.squads.Arsenal.reserves[0][1],'shot sub gets best reserve');
  const released=sub.forSeason(fixedId(89),cs,2,{history:history([{...row('Guessed only',99,'CB'),release:true}])}).boards.playerOne;
  assert.equal(JSON.stringify(released),JSON.stringify(after),'guessed signing never joins');
  const guessedClubPlayer=Squads.squads.Arsenal.reserves[0][1];
  const guessedHistory=noSignings.slice();guessedHistory[1]={playerOne:[{...row(guessedClubPlayer,99,'CB'),release:true}],playerTwo:[]};
  for(let season=2;season<=10;season+=1){
    const b=sub.forSeason(fixedId(89),cs,season,{history:guessedHistory}).boards.playerOne;
    assert.ok(!b.some(p=>p.name===guessedClubPlayer),'guessed club player cannot join from reserves or database');
    fullBoard(b,'guessed database signing '+season);
  }
  // Repeated sub losses consume the three reserves, then use the next highest-rated
  // distinct database name; the independently maintained pool excludes every past loss.
  const occupied=new Set(launch.map(p=>p.name)),pool=Players.clubs.Arsenal.players.filter(p=>!occupied.has(p[0])).sort((a,b)=>b[1]-a[1]||a[4]-b[4]);
  const lost=new Set();
  for(let season=1;season<=10;season+=1){
    const v=sub.forSeason(fixedId(89),cs,season,{history:noSignings}),b=v.boards.playerOne;
    fullBoard(b,'sub replenishment '+season);
    if(season>1){
      const p=pool.shift();assert.equal(b[14].name,p[0],'reserve/database overall and jersey priority');
    }
    assert.ok(b.every(p=>!lost.has(p.name)));lost.add(v.turns[0].player.name);
  }
  // A better signing moves the displaced starter onto the bench, and retains the
  // sub he pushes out as a reserve. With no season-1 shot, observe both substitutions.
  const forcedAfterJoin=everyBullet(()=>12,k=>k>1);
  const signedHistory=[null,...Array.from({length:9},(_,i)=>({playerOne:i===0?[row('Better winger',99,'RW')]:[],playerTwo:[]}))];
  const signed2=forcedAfterJoin.forSeason(fixedId(90),cs,2,{history:signedHistory}).boards.playerOne;
  assert.equal(signed2[12].name,'A. Ramsey','displaced starter retained on bench');
  const signed3=forcedAfterJoin.forSeason(fixedId(90),cs,3,{history:signedHistory}).boards.playerOne;
  assert.equal(signed3[12].name,'F. Coquelin','displaced sub returns from reserves');
  const subHistory=[null,...Array.from({length:9},(_,i)=>({playerOne:i===0?[row('Better sub',99,null)]:[],playerTwo:[]}))];
  assert.equal(forcedAfterJoin.forSeason(fixedId(90),cs,2,{history:subHistory}).boards.playerOne[12].name,'Better sub');
  assert.equal(forcedAfterJoin.forSeason(fixedId(90),cs,3,{history:subHistory}).boards.playerOne[12].name,'F. Coquelin','directly displaced sub retained');
  // A kept signing with the same name as a prior shot cannot resurrect him.
  const shot=forced.forSeason(fixedId(88),cs,1).turns[0].player.name;
  assert.ok(!next([row(shot,99,'CB')]).some(p=>p.name===shot));
}
ok('L12','fitting kept signing first, bench and reserve substitutions, database refill, released and shot names excluded');

// L13 any of the 18 launch squad players can be Special Player; none can leave a hole
// or reappear from hidden reserves during a later season.
{
  for(const club of catalog){
    const squad=Squads.squads[club],cs={playerOne:club,playerTwo:'Liverpool'};
    for(const [,name,,overall] of [...squad.xi,...squad.subs,...squad.reserves]){
      const options={history:noSignings,special:{playerOne:{name,overall}}};
      for(const season of [1,10]){
        const board=RRR.forSeason(fixedId(91),cs,season,options).boards.playerOne;
        fullBoard(board,club+' Special Player '+name+' season '+season);
        assert.ok(board.every(p=>p.name!==name),'Special Player never joins from board, subs or reserves');
      }
    }
  }
}
ok('L13','all 98 clubs exclude any launch XI, sub or reserve Special Player and keep full boards');

// L14 Nik chose club-only replacements and explicit exhaustion reporting. A finite
// goalkeeper/club pool must never produce a blank row, resurrect a loss or import a player.
{
  for(const [club,exhaustedSeason] of [['Torino',2],['Cagliari',10]]){
    const cs={playerOne:club,playerTwo:'Liverpool'},gk=RRR.board(club).find(p=>p.pos==='GK');
    const forced=everyBullet(k=>club==='Torino'?gk.slot:k-1);
    const options={history:noSignings,special:{playerOne:{name:gk.name,overall:gk.rating}}};
    const ownNames=new Set(Players.clubs[club].players.map(p=>p[0]));
    const run=()=>Array.from({length:exhaustedSeason-1},(_,i)=>forced.forSeason(fixedId(92),cs,i+1,options));
    const first=run();assert.equal(JSON.stringify(first),JSON.stringify(run()));
    for(const v of first){
      const b=v.boards.playerOne;fullBoard(b,club+' before exhaustion '+v.season);
      assert.ok(b.every(p=>ownNames.has(p.name)&&p.name!==gk.name),'replacements stay club-only and skip Special Player');
    }
    for(let call=0;call<2;call+=1)assert.throws(()=>forced.forSeason(fixedId(92),cs,exhaustedSeason,options),error=>
      error.code==='ROSTER_EXHAUSTED'&&error.club===club&&error.message==='Club roster exhausted: '+club,'explicit deterministic exhaustion; no incomplete board returned');
  }
  const r='pair_4f30dc1baf68cf8f3e5cf3d58163ef451816249ea818b46fde9e9539ce3654fa';
  assert.throws(()=>RRR.forSeason(r,{playerOne:'Torino',playerTwo:'Liverpool'},10,{history:noSignings,special:{playerOne:{name:'J. Hart',overall:84}}}),error=>error.code==='ROSTER_EXHAUSTED'&&error.club==='Torino','real-stream goalkeeper exhaustion reported');
}
ok('L14','club-only replacements: finite goalkeeper and club pools report deterministic exhaustion without empty rows or imports');

console.log(`r87 roster roulette contracts: ${checks} groups passed`);
