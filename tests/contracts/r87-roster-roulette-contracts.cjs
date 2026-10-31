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

// L1b Sol SQ-1-01: the 3D scene's own squads.json shows the same launch XI and 4 subs as the engine for every club
// (scripts/sync-roulette-scene-squads.cjs regenerates it after the roster build).
{
  const scene=JSON.parse(fs.readFileSync(path_.join(ROOT,'visual-assets/v10_1/roulette/assets/squads.json'),'utf8'));
  assert.deepEqual(scene.clubs.map(c=>c.club).sort(),[...catalog].sort(),'scene asset covers exactly the 98 clubs');
  for(const c of scene.clubs){
    const board=RRR.board(c.club);
    assert.deepEqual([...c.xi,...c.subs].map(r=>[r[1],r[2]]),board.map(p=>[p.name,p.rating]),`${c.club}: scene XI+subs match the engine board`);
    // Sol job 5 coverage gap: the scene must also put each starter in the engine's formation slot.
    assert.deepEqual(c.xi.map(r=>r[0]),board.slice(0,11).map(p=>p.pos),`${c.club}: scene XI positions match the engine formation`);
  }
}
ok('L1b','Sol SQ-1-01: the roulette scene asset carries the engine launch XI + 4 subs for all 98 clubs');

// L1c Sol job 2 (SQ-2-01..03): stopgaps hand back their slot, guessed players leave the board, repeats keep their window.
{
  const none=()=>[null,...Array.from({length:9},()=>({playerOne:[],playerTwo:[]}))];
  let h=none();h[7].playerOne=[{name:'R. Greenwood',overall:60,position:'LW',release:false}];
  const roma=RRR.forSeason('pair_52e7c95cc93839ff3455413e05872659093e8b558f1275a05170c77db665b65c',{playerOne:'Roma',playerTwo:'Lazio'},8,
    {special:{playerOne:{name:'S. Mané',overall:79,number:19},playerTwo:{name:'Neymar',overall:92,number:11}},history:h}).boards.playerOne;
  assert.equal(roma.find(p=>p.pos==='LW').name,'R. Greenwood','SQ-2-01: the fitting winger takes LW back from the RWB stopgap');
  assert.ok(roma.some(p=>p.bench&&p.name==='Bruno Peres'),'SQ-2-01: the stopgap stays in the squad');
  const ars={playerOne:'Arsenal',playerTwo:'Liverpool'},ramos={name:'Sergio Ramos',overall:89,position:'CB',release:false};
  const sp2={playerOne:{name:'K. Volland',overall:81,number:31},playerTwo:{name:'J. Vargas',overall:70,number:16}};
  const id2='pair_f81777fb406d8197eb25b80daa12475edd09db988cdf046088ec0e21f498ee72';
  h=[null,{playerOne:[ramos],playerTwo:[]},{playerOne:[{...ramos,release:true}],playerTwo:[]}];
  const s2=RRR.forSeason(id2,ars,2,{special:sp2,history:h}),s3=RRR.forSeason(id2,ars,3,{special:sp2,history:h});
  assert.ok(s2.boards.playerOne.some(p=>p.name==='Sergio Ramos'),'SQ-2-02: season 2 (before the guess) still shows him');
  assert.ok(!s3.boards.playerOne.some(p=>p.name==='Sergio Ramos'),'SQ-2-02: guessed in window 2, gone from the season 3 board');
  assert.notEqual(s3.turns[0].player&&s3.turns[0].player.name,'Sergio Ramos','SQ-2-02: the bullet can never hit him');
  assert.equal(s3.boards.playerOne.filter(p=>p.name).length,15,'SQ-2-02: his slot is refilled');
  const chal={name:'T. Chalobah',overall:55,position:'CB',release:false};
  const sp3={playerOne:{name:'De Gea',overall:90,number:1},playerTwo:{name:'C. Marchisio',overall:86,number:8}};
  const id3='pair_b523e277557caabcfb5f058275f09306482926c110195f695ad3b4613b547e1c';
  h=[null,{playerOne:[chal],playerTwo:[]},{playerOne:[],playerTwo:[]}];
  const plain=RRR.forSeason(id3,ars,3,{special:sp3,history:h}).boards.playerOne;
  h[2].playerOne=[{...chal}];
  const repeat=RRR.forSeason(id3,ars,3,{special:sp3,history:h}).boards.playerOne;
  assert.deepEqual(repeat,plain,'SQ-2-03: entering an earlier signing again changes nothing');
  assert.equal(plain[11].name,'M. Debuchy','SQ-2-03: the best club player fills the shot sub');
  // Sol job 5 coverage gap: a case only the repair pass fixes (no signing ever joins at RM). Hull City lose
  // R. Snodgrass in season 1; by season 5 the striker stopgap at RM hands the slot back to A. Elmohamady.
  const n=1707,hx=createHash('sha256').update('g'+n).digest();
  h=none();for(let k=1;k<=9;k+=1)h[k].playerOne=[0,1].map(j=>{const b=hx[(k*2+j)%32];return {slot:j+1,name:`X${n}_${k}_${j}`,overall:50+b%45,position:['CB','ST','LW','RW','LB','RB','GK','CM'][b%8],release:b%5===0};});
  const hull=RRR.forSeason('pair_'+createHash('sha256').update('f'+n).digest('hex'),{playerOne:'Hull City',playerTwo:'Werder Bremen'},5,{history:h}).boards.playerOne;
  assert.equal(hull[6].name,'A. Elmohamady','SQ-2-01 repair pass: the fitting RM takes his slot back');
  assert.ok(hull.some(p=>p.bench&&p.name==='D. Mbokani'),'SQ-2-01 repair pass: the stopgap returns to the bench');
}
ok('L1c','Sol job 2: outfield stopgap repair (SQ-2-01), guessed incumbent evicted (SQ-2-02), repeated signing keeps his window (SQ-2-03)');

// L1d Sol SQ-4-01 + Nik 2026-10-31 ("only the signing"): a signing and a club player are different people even with the
// same name. A guess removes only the signing; the club's own namesake stays. Then an independent oracle replays 400
// Showdowns x 10 seasons with namesake, repeated, guessed and shot signings: nobody excluded is ever on a board.
{
  const pal={playerOne:'Crystal Palace',playerTwo:'West Bromwich Albion'},id1='pair_'+'a'.repeat(64);
  const sp1={playerOne:{name:'J. Añor',overall:76,number:10},playerTwo:{name:'Williams',overall:80,number:11}};
  const ward={slot:1,name:'J. Ward',overall:62,position:'CM'};
  const s2=RRR.forSeason(id1,pal,2,{special:sp1,history:[null,{playerOne:[{...ward,release:true}],playerTwo:[]}]}).boards.playerOne;
  const own=s2.find(p=>p.name==='J. Ward');
  assert.ok(own&&own.number===2&&own.signedSeason===null&&own.pos==='RB','SQ-4-01: Palace keep their own J. Ward #2 when WBA\'s J. Ward is guessed');
  assert.equal(s2.filter(p=>p.name).length,15);
  const kept=RRR.forSeason(id1,pal,2,{special:sp1,history:[null,{playerOne:[{...ward,overall:90,release:false}],playerTwo:[]}]}).boards.playerOne;
  assert.equal(kept.filter(p=>p.name==='J. Ward').length,2,'a kept namesake signing joins next to the club player');
  const cag={playerOne:'Cagliari',playerTwo:'Napoli'},none=[null,...Array.from({length:9},()=>({playerOne:[],playerTwo:[]}))];
  const h=none.slice();h[1]={playerOne:[{slot:1,name:'Rafael',overall:74,position:'GK',release:true}],playerTwo:[]};
  for(let season=2;season<=10;season+=1)assert.ok(RRR.forSeason(id1,cag,season,{history:h}).boards.playerOne.some(p=>p.name==='Rafael'&&p.signedSeason===null),'Cagliari keep their own Rafael after Napoli\'s Rafael is guessed');
  // Oracle: identity = "c|name#shirt" for a club row, "s|name" for a signing (folded names).
  const fold=n=>String(n).normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
  const idOf=p=>p.signedSeason!==null?`s|${fold(p.name)}`:`c|${fold(p.name)}#${p.number}`;
  const clubs=catalog.slice().sort();
  const namesAt=Object.fromEntries(clubs.map(c=>[c,new Set(Players.clubs[c].players.map(r=>fold(r[0])))]));
  const others=c=>Players.clubs[clubs[(clubs.indexOf(c)+7)%clubs.length]].players;
  let boards=0,checked=0;
  for(let n=0;n<400;n+=1){
    const hex=createHash('sha256').update('L1d-'+n).digest('hex'),rid='pair_'+hex,byte=i=>parseInt(hex.slice(i*2,i*2+2),16);
    const pair={playerOne:clubs[byte(0)%98],playerTwo:clubs[(byte(0)+1+byte(1)%97)%98]};
    const hist=[null];
    for(let k=1;k<=9;k+=1){
      const w={};
      for(const [r,role] of ['playerOne','playerTwo'].entries()){
        const club=pair[role],pool=others(club),mine=Players.clubs[club].players,rows=[];
        for(let j=0;j<3;j+=1){
          const b=byte((k*6+r*3+j)%32),pick=b%4;
          // 0: another club's player; 1: a namesake of an own-club player; 2: repeat an earlier signing; 3: another club's player
          let name=pool[(b*7+k)%pool.length][0];
          if(pick===1)name=mine[(b+k)%mine.length][0];
          if(pick===2&&k>1){const prev=hist[k-1][role];if(prev.length)name=prev[b%prev.length].name;}
          rows.push({slot:j+1,name,overall:55+(b%40),position:['CB','ST','LW','CM','GK','RB'][b%6],release:(b>>3)%3===0});
        }
        w[role]=rows;
      }
      hist.push(w);
    }
    const ex={playerOne:new Set(),playerTwo:new Set()},signed={playerOne:new Set(),playerTwo:new Set()};
    for(let season=1;season<=10;season+=1){
      const v=RRR.forSeason(rid,pair,season,{history:hist});
      for(const role of ['playerOne','playerTwo']){
        const b=v.boards[role],filled=b.filter(p=>p.name),ids=filled.map(idOf);boards+=1;
        assert.equal(new Set(ids).size,ids.length,`L1d no duplicate person ${rid} s${season} ${role}`);
        for(const p of filled){
          const i=idOf(p);checked+=1;
          assert.ok(!ex[role].has(i),`L1d excluded ${i} back on the board ${rid} s${season} ${role}`);
          if(p.signedSeason===null)assert.ok(namesAt[pair[role]].has(fold(p.name)),`L1d ${p.name} is a ${pair[role]} player`);
          else assert.ok(signed[role].has(fold(p.name))&&p.signedSeason<season,`L1d ${p.name} is this manager's own earlier kept signing`);
        }
        assert.equal(b.filter(p=>p.name&&!p.bench).length,11,`L1d full XI ${rid} s${season} ${role}`);
        assert.equal(b.filter(p=>p.name&&p.bench).length,4,`L1d full bench ${rid} s${season} ${role}`);
        const t=v.turns.find(x=>x.role===role);
        if(t.fired){const p=t.player;ex[role].add(idOf(p));if(p.signedSeason===null)ex[role].add(`s|${fold(p.name)}`);}
        if(season<10)for(const row of hist[season][role]){
          if(row.release)ex[role].add(`s|${fold(row.name)}`);
          else if(!ex[role].has(`s|${fold(row.name)}`))signed[role].add(fold(row.name));
        }
      }
    }
  }
  assert.ok(boards===8000&&checked>100000);
}
ok('L1d','Sol SQ-4-01: a guess removes only the signing, never the club namesake; 400 x 10-season oracle, nobody excluded returns');

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
  // Red team R87-C-03 (Nik's rule, replaces the old "CAM preference"): fit only decides eligibility, so a CAM signing
  // replaces the WEAKEST compatible midfield starter (G. Xhaka 84 at LDM), not the stronger CAM M. Özil 89.
  assert.equal(board.find(p=>p.name==='Creative signing').pos,'LDM','CAM signing replaces the weakest compatible starter');
  assert.equal(board.find(p=>p.pos==='CAM').name,'M. Özil','the stronger CAM keeps his place');
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
  // Red team R87-C-02: without a fitting sub, the best fitting reserve (M. Debuchy, RB) goes straight in; the CB sub stays.
  assert.equal(second(rbShot,cs,[]).boards.playerOne.find(p=>p.pos==='RB').name,'M. Debuchy','without a same-line sub, the best fitting reserve fills the hole');
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
ok('L9','all position lines, weakest compatible starter (no CAM preference, R87-C-03), compatible vacancies, bench promotion and GK protection');

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
  assert.equal(new Set(board.map(p=>`${p.name.trim().toLowerCase()}#${p.number}`)).size,15,label+' unique');
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
      // One person = name + shirt (red team R87-C-05): Alavés' Manu García #26 may play after #19 is shot.
      for(const p of b)assert.ok(!lost[role].has(`${p.name}#${p.number}`),club+' shot player never returns');
      const turn=v.turns.find(t=>t.role===role);assert.equal(turn.fired,true);
      assert.ok(turn.player.name&&turn.player.rating>0);lost[role].add(`${turn.player.name}#${turn.player.number}`);
    }
  }
  // Empty rows exist only when a club has run out of players (Nik 2026-10-31): one writer, the rrPlace fallback.
  assert.equal(src.split('rrEmpty').length-1,2,'empty rows come only from the rrPlace fallback');
  assert.ok(!/name:\s*""/.test(src),'no blank-name rows');
  const rules=fs.readFileSync(path_.join(ROOT,'js/ruleBook.js'),'utf8');
  assert.match(rules,/lost player is replaced by a kept signing or the bench/);
  assert.match(rules,/the roulette still spins, and the bullet only ever hits a real player/);
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
  const strengthened=sub.forSeason(fixedId(89),cs,2,{history:history([row('New defender after sub loss',99,'CB')])}).boards.playerOne;
  assert.equal(strengthened.find(p=>p.name==='New defender after sub loss').pos,'RCB','sub loss preserves R87-2 position-fit XI upgrades');
  assert.equal(strengthened[14].name,'S. Mustafi','displaced starter fills the lost sub slot');
  fullBoard(strengthened,'signing after sub loss');
  const released=sub.forSeason(fixedId(89),cs,2,{history:history([{...row('Guessed only',99,'CB'),release:true}])}).boards.playerOne;
  assert.equal(JSON.stringify(released),JSON.stringify(after),'guessed signing never joins');
  const guessedClubPlayer=Squads.squads.Arsenal.reserves[0][1];
  const guessedHistory=noSignings.slice();guessedHistory[1]={playerOne:[{...row(guessedClubPlayer,99,'CB'),release:true}],playerTwo:[]};
  // Nik 2026-10-31 (Sol SQ-4-01): a guessed signing is the player the manager bought, never his own club's namesake, so
  // the club player still steps in from the reserves; only the signing is gone.
  assert.equal(sub.forSeason(fixedId(89),cs,2,{history:guessedHistory}).boards.playerOne[14].name,guessedClubPlayer,'a guessed namesake never blocks the club player');
  for(let season=2;season<=10;season+=1){
    const b=sub.forSeason(fixedId(89),cs,season,{history:guessedHistory}).boards.playerOne;
    assert.ok(!b.some(p=>p.name===guessedClubPlayer&&p.signedSeason!==null),'the guessed signing never joins');
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

// Red team r87 Roulette + Special Player (audit/r87/REDTEAM_R87_RR_SP.md, R87-C-01..C-06): the exact reproductions.
const MP=require('../../js/marqueePlayer.js');
// What the season step passes (js/rosterRouletteStep.js rrsSpecial, run in a VM below): name, overall, shirt number and
// the squad database name of both draws.
const drawFor=r=>{
  const box={CareerModeMarqueePlayers:require('../../data/marqueePlayers.js'),CareerModeMarqueePlayer:MP};vm.createContext(box);
  const stepSource=fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8');
  const fn=stepSource.slice(stepSource.indexOf('  function rrsSpecial('),stepSource.indexOf('/* rrsSpecial end */'));
  vm.runInContext('const root=this,ROLES=["playerOne","playerTwo"];'+fn+';this.special=rrsSpecial;',box);
  return JSON.parse(JSON.stringify(box.special({rivalryId:r,confirmedAtMs:Date.parse('2026-10-31T00:00:00Z')})));
};
const LINE={GK:'GK',CB:'CB',LCB:'CB',RCB:'CB',SW:'CB',RB:'RB',RWB:'RB',LB:'LB',LWB:'LB',CDM:'CM',RDM:'CM',LDM:'CM',CM:'CM',RCM:'CM',LCM:'CM',CAM:'CM',RAM:'CM',LAM:'CM',RM:'RW',RW:'RW',LM:'LW',LW:'LW',ST:'ST',CF:'ST',RS:'ST',LS:'ST',RF:'ST',LF:'ST'};
const fitsSlot=(positions,pos)=>positions.some(p=>LINE[p]&&LINE[p]===LINE[pos]);
const fold=n=>String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const AL={playerOne:'Arsenal',playerTwo:'Liverpool'};
const firstSeason=rows=>[null,{playerOne:rows,playerTwo:[]}];

// L14 Nik chose club-only replacements. A club out of KEEPERS puts its best remaining outfielder in goal (red team
// R87-E-02); only a club that has truly run out of players shows an empty slot. Never a revived loss or an import.
{
  const keeperless=(b,label)=>{
    assert.equal(b.length,15,label);assert.ok(b.every(p=>p.name&&p.rating>0),label+' no empty slot while outfielders remain');
    const gk=b.find(p=>p.pos==='GK');assert.ok(gk.positions[0]!=='GK',label+' an outfielder stands in goal');
    assert.equal(new Set(b.map(p=>`${p.name}#${p.number}`)).size,15,label+' unique');
  };
  {
    const club='Torino',cs={playerOne:club,playerTwo:'Liverpool'},gk=RRR.board(club).find(p=>p.pos==='GK');
    const forced=everyBullet(()=>gk.slot);
    const options={history:noSignings,special:{playerOne:{name:gk.name,overall:gk.rating}}};
    const ownNames=new Set(Players.clubs[club].players.map(p=>p[0]));
    fullBoard(forced.forSeason(fixedId(92),cs,1,options).boards.playerOne,'Torino season 1');
    for(let call=0;call<2;call+=1){
      const v=forced.forSeason(fixedId(92),cs,2,options),b=v.boards.playerOne;
      keeperless(b,club+' no keeper left');
      assert.ok(b.every(p=>ownNames.has(p.name)&&p.name!==gk.name),'still club-only, never the Special Player');
      const turn=v.turns.find(t=>t.role==='playerOne');assert.ok(turn.fired&&turn.player&&turn.player.name,'the bullet hits a real player');
      assert.equal(JSON.stringify(v),JSON.stringify(forced.forSeason(fixedId(92),cs,2,options)),'deterministic');
    }
  }
  // A kept keeper signing replaces the stopgap outfielder whatever his overall.
  {
    const gk=RRR.board('Torino').find(p=>p.pos==='GK'),forced=everyBullet(k=>k===1?gk.slot:14);
    const history=noSignings.slice();history[2]={playerOne:[row('Late keeper',45,'GK')],playerTwo:[]};
    const b=forced.forSeason(fixedId(92),{playerOne:'Torino',playerTwo:'Liverpool'},3,{history,special:{playerOne:{name:gk.name,overall:gk.rating}}}).boards.playerOne;
    assert.equal(b.find(p=>p.pos==='GK').name,'Late keeper','a keeper always takes the goal back from an outfielder');
    fullBoard(b,'keeper back in goal');
  }
  // Cagliari (24 players, one Special Player, nine shots) truly runs out by season 10: it keeps an EMPTY slot
  // (Nik 2026-10-31), the roulette still runs and the bullet only hits a real player.
  {
    const club='Cagliari',exhaustedSeason=10,cs={playerOne:club,playerTwo:'Liverpool'},gk=RRR.board(club).find(p=>p.pos==='GK');
    const forced=everyBullet(k=>k-1);
    const options={history:noSignings,special:{playerOne:{name:gk.name,overall:gk.rating}}};
    const ownNames=new Set(Players.clubs[club].players.map(p=>p[0]));
    const run=()=>Array.from({length:exhaustedSeason-1},(_,i)=>forced.forSeason(fixedId(92),cs,i+1,options));
    const first=run();assert.equal(JSON.stringify(first),JSON.stringify(run()));
    for(const v of first){
      const b=v.boards.playerOne;fullBoard(b,club+' before exhaustion '+v.season);
      assert.ok(b.every(p=>ownNames.has(p.name)&&p.name!==gk.name),'replacements stay club-only and skip Special Player');
    }
    for(let call=0;call<2;call+=1){
      const v=forced.forSeason(fixedId(92),cs,exhaustedSeason,options),b=v.boards.playerOne,filled=b.filter(p=>p.name);
      assert.equal(b.length,15,club+' board keeps 15 places');assert.ok(filled.length<15,club+' run-out club shows an empty slot');
      assert.ok(b.filter(p=>!p.name).every(p=>p.rating===0&&p.positions.length===0),'empty slot has no player data');
      assert.equal(new Set(filled.map(p=>p.name.toLowerCase())).size,filled.length,'no duplicate player');
      assert.ok(filled.every(p=>ownNames.has(p.name)&&p.name!==gk.name),'still club-only, never the Special Player');
      const turn=v.turns.find(t=>t.role==='playerOne');assert.ok(turn.fired,'forced bullet still fires');
      assert.ok(turn.player&&turn.player.name,'the bullet hits a real player, never the empty slot');
      assert.equal(JSON.stringify(v),JSON.stringify(forced.forSeason(fixedId(92),cs,exhaustedSeason,options)),'deterministic');
    }
    const history=noSignings.slice();history[9]={playerOne:[row('Kept reserve cover',40,null)],playerTwo:[]};
    const b=forced.forSeason(fixedId(92),cs,10,{...options,history}).boards.playerOne;
    fullBoard(b,'kept signing prevents club exhaustion');
    assert.ok(b.some(p=>p.bench&&p.name==='Kept reserve cover'),'kept sub-only signing can cover the promoted bench slot');
  }
  const r='pair_4f30dc1baf68cf8f3e5cf3d58163ef451816249ea818b46fde9e9539ce3654fa';
  const real=RRR.forSeason(r,{playerOne:'Torino',playerTwo:'Liverpool'},10,{history:noSignings,special:{playerOne:{name:'J. Hart',overall:84}}});
  keeperless(real.boards.playerOne,'real-stream Torino keeper run-out');
  assert.ok(real.turns.every(t=>!t.fired||(t.player&&t.player.name)),'real-stream bullets hit real players');
  // Red team R87-E-02 natural repro: Everton loses both keepers; from season 8 an outfielder is in goal, never empty.
  const ev='pair_b5e16e93ab412832c9430aa2a2b003bd61c6f1811b1fd8c373a53207c2af7c18',evSp=drawFor(ev);
  for(const season of [8,10]){
    const b=RRR.forSeason(ev,{playerOne:'Everton',playerTwo:'Middlesbrough'},season,{special:evSp,history:noSignings}).boards.playerOne;
    keeperless(b,'Everton season '+season);
  }
}
ok('L14','club-only replacements: no keeper left = best outfielder in goal (R87-E-02); only a truly run-out club keeps an empty slot, the roulette still runs');


// L17 R87-C-01 (P0): both managers' Special Players are off both boards, benches and hidden reserves, so never hit.
{
  const r='pair_a0000000000000030000012d0000000000000000000000000000000000000045',sp=drawFor(r);
  assert.equal(sp.playerOne.name,'L. Messi');assert.equal(sp.playerTwo.name,'Neymar');
  const isSp=p=>p.name&&['L. Messi','Neymar'].includes(p.name);
  const v1=RRR.forSeason(r,{playerOne:'Barcelona',playerTwo:'Liverpool'},1,{special:sp});
  assert.equal(v1.turns[0].fired,true,'the reported fired turn');
  assert.notEqual(v1.turns[0].player.name,'Neymar','the rival Special Player is never hit');
  assert.equal(v1.boards.playerOne[1].name,'André Gomes','LW: the best fitting sub moves up');
  assert.equal(v1.boards.playerOne[11].name,'J. Mathieu','the best reserve (81, above the report\u2019s example Denis Suárez 80) fills the bench');
  for(const cs of [{playerOne:'Barcelona',playerTwo:'Liverpool'},{playerOne:'Liverpool',playerTwo:'Barcelona'},{playerOne:'Barcelona',playerTwo:'Barcelona'}])
    for(let s=1;s<=10;s+=1){
      const v=RRR.forSeason(r,cs,s,{special:sp,history:noSignings});
      for(const role of RRR.roles){fullBoard(v.boards[role],'both SPs excluded '+s);assert.ok(!v.boards[role].some(isSp),'neither Special Player on any board');}
      for(const t of v.turns)if(t.fired)assert.ok(!isSp(t.player));
    }
  // Every Special Player in a catalog club, drawn as the RIVAL's: forced shots at a sub drain the hidden reserves and
  // the club database, and he never surfaces on the other manager's board (his own club).
  const forced=everyBullet(()=>14),Marquee=require('../../data/marqueePlayers.js');
  let checked=0;
  for(const m of Marquee.players){
    const dbName=Marquee.sourceNames[m.name]||m.name;
    const home=Object.entries(Players.clubs).find(([,d])=>d.players.some(p=>p[0]===dbName&&p[4]===m.number));
    if(!home)continue;checked+=1;
    const special={playerOne:{name:'Nobody Here',overall:80},playerTwo:{name:m.name,sourceName:dbName,overall:m.overall,number:m.number}};
    for(const season of [1,10]){
      const b=forced.forSeason(fixedId(93),{playerOne:home[0],playerTwo:'Liverpool'},season,{history:noSignings,special}).boards.playerOne;
      assert.ok(!b.some(p=>p.name===dbName&&p.number===m.number),`${m.name} (${home[0]}) never on the rival's board, season ${season}`);
    }
  }
  assert.ok(checked>=170,'every catalog Special Player checked');
  ok('L17',`red team R87-C-01: both Special Players off both boards and reserves (${checked} catalog draws as rival SP)`);
}

// L18 R87-C-02: a replacement needs a positive positional fit; a fitting reserve/database player beats a misfit sub.
{
  const rb='pair_aa5da30f08fc95a1210a286f52fa2c33b594e44bcb7381802e9a699cd68bcd0e';
  const s1=RRR.forSeason(rb,AL,1).turns[0];assert.equal(s1.player&&s1.player.name,'Héctor Bellerín');
  const b2=RRR.forSeason(rb,AL,2,{history:noSignings}).boards.playerOne;
  assert.equal(b2[10].name,'M. Debuchy','RB stays a right-back: the fitting reserve goes straight into the slot');
  assert.equal(b2[11].name,'P. Mertesacker','the misfit sub stays on the bench');
  const bel='pair_a000000000000085000000000000000000000000000000000000000000000000',spBel=drawFor(bel);
  assert.equal(spBel.playerOne.name,'Héctor Bellerín');
  const bb=RRR.forSeason(bel,AL,1,{special:spBel}).boards.playerOne;
  assert.equal(bb[10].name,'M. Debuchy','own-club Special Player: the next fitting player takes his place');
  assert.equal(bb[11].name,'P. Mertesacker');
  // Liverpool's no-signing walk: CB Sakho never plays ST while a striker remains.
  const forced=everyBullet(k=>k-1);
  const lv=forced.forSeason(fixedId(87),{playerOne:'Liverpool',playerTwo:'Arsenal'},3,{history:noSignings}).boards.playerOne;
  assert.ok(fitsSlot(lv[1].positions,lv[1].pos),'Liverpool season 3 ST is a striker, not '+lv[1].name);
  // Every club, ten forced firing seasons: a replaced starter fits his slot unless nobody left at the club fits it.
  let misfits=0;
  for(const club of catalog){
    const launch=RRR.board(club),lost=[];
    for(let season=1;season<=10;season+=1){
      const v=forced.forSeason(fixedId(87),{playerOne:club,playerTwo:club},season,{history:noSignings}),b=v.boards.playerOne;
      b.slice(0,11).forEach((p,i)=>{
        if(!p.name||p.name===launch[i].name||fitsSlot(p.positions,p.pos))return;
        misfits+=1;
        const spare=Players.clubs[club].players.find(row=>fitsSlot(row[2],p.pos)&&!b.some(q=>q.name===row[0]&&q.number===row[4])&&!lost.some(l=>l.name===row[0]&&l.number===row[4]));
        assert.ok(!spare,`${club} season ${season}: ${p.name} misfits ${p.pos} while ${spare&&spare[0]} fits`);
      });
      lost.push(v.turns[0].player);
    }
  }
  ok('L18',`red team R87-C-02: positive fit first (fitting sub, else fitting reserve/database), misfit fallback only when none fits (${misfits} genuine)`);
}

// L19 R87-C-03: fit decides eligibility only; a signing replaces the WEAKEST compatible starter when strictly better.
{
  const safe='pair_a9b24c458404d9c2f3b8a8937ba550a8e50867c1b522a009b99b2fdfbb1f66a5';
  assert.equal(RRR.forSeason(safe,AL,1).turns[0].fired,false);
  const b=RRR.forSeason(safe,AL,2,{history:firstSeason([row('Playmaker',90,'CAM')])}).boards.playerOne;
  assert.equal(b[0].name,'M. Özil','the stronger CAM stays');
  assert.equal(b[6].name,'Playmaker','the weakest compatible midfielder (G. Xhaka 84, LDM) is replaced');
  assert.equal(b[12].name,'G. Xhaka','the replaced starter beats the weakest sub');
  assert.ok(!b.some(p=>p.name==='F. Coquelin'),'the weakest sub goes to the reserves');
  ok('L19','red team R87-C-03: weakest compatible starter, strictly better; no CAM preference');
}

// L20 R87-C-04: the Transfer War entry order never changes a board or a release.
{
  const order='pair_a2621a78bf4fa1e0a09ea793d734478e32bc7178fe0b3971ff9563fad68d9c5c';
  const run=(a,b)=>RRR.forSeason(order,AL,2,{history:firstSeason([row('First CM',90,'CM',a),row('Second CM',90,'CM',b)])});
  const A=run(1,2),B=run(2,1);
  assert.equal(JSON.stringify(A),JSON.stringify(B),'same kept players, same board and the same released player');
  assert.equal(A.turns[0].fired,true);
  // Ties across names, positions and accents in every entry order.
  const tied=[row('Zed Tie',88,'CB'),row('Abe Tie',88,'CB'),row('Mid Tie',88,'CM'),row('Émile Tie',88,'ST'),row('Emile Tie',88,'ST')];
  const perms=[[0,1,2,3,4],[4,3,2,1,0],[2,0,4,1,3],[1,4,0,3,2]];
  for(const g of [0,1,2]){
    const runs=perms.map(perm=>JSON.stringify(RRR.forSeason(fixedId(g),AL,3,{history:[null,{playerOne:perm.map((i,slot)=>({...tied[i],slot:slot+1})),playerTwo:[]},{playerOne:[],playerTwo:[]}]})));
    assert.ok(runs.every(x=>x===runs[0]),'entry order never matters');
  }
  ok('L20','red team R87-C-04: equal-overall signings rank by identity, not entry slot');
}

// L21 R87-C-05 (partial): accents fold; a Special Player's exclusion is his own row (name + shirt), so a homonym at another
// club stays; Alavés' two Manu García rows are two people for the database refill.
{
  const mat='pair_a0000000000000d2000000000000000000000000000000000000000000000000',sp=drawFor(mat);
  assert.equal(sp.playerOne.name,'Matheus Pereira');assert.equal(sp.playerOne.number,73);
  const sub11=everyBullet(()=>11);
  const b4=sub11.forSeason(fixedId(94),{playerOne:'Empoli',playerTwo:'Liverpool'},4,{history:noSignings,special:sp}).boards.playerOne;
  assert.equal(b4[11].name,'Matheus Pereira','Empoli’s own Matheus Pereira stays in the hidden reserves');
  assert.equal(b4[11].rating,70);assert.equal(b4[11].number,31);
  // Alavés: shoot Manu García #19 (LDM), then the last sub every season; the refill reaches Manu García #26.
  const alaves=RRR.board('Alavés'),ldm=alaves.find(p=>p.name==='Manu García').slot;
  const walk=everyBullet(k=>k===1?ldm:14);
  const a10=walk.forSeason(fixedId(95),{playerOne:'Alavés',playerTwo:'Liverpool'},10,{history:noSignings}).boards.playerOne;
  assert.equal(a10[14].name,'Manu García','the other Manu García is a different person');
  assert.equal(a10[14].number,26);assert.deepEqual([...a10[14].positions],['CAM'],'his own positions, not #19’s');
  // Accent-folded identity: a kept "M. Ozil" is the Special Player M. Özil and never joins.
  const oz='pair_a000000000000012000000000000000000000000000000000000000000000000',spOz=drawFor(oz);
  assert.equal(spOz.playerOne.name,'M. Özil');
  for(const name of ['M. Ozil',' m. özil ','M. OZIL'])
    assert.ok(!RRR.forSeason(oz,AL,2,{special:spOz,history:firstSeason([row(name,89,'CAM')])}).boards.playerOne.some(p=>fold(p.name)==='m. ozil'),name+' never joins');
  // The season step passes the shirt number with each draw.
  assert.match(fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8'),/number:picks\[role\]\.number/);
  // R87-D-01 (P0): every Special Player at a catalog club is exactly one squad database row by (database name, shirt),
  // and none outside the catalog matches any row. K. Mbappé is "K. Mbappe Lottin" in the database.
  const Marquee=require('../../data/marqueePlayers.js');
  const py=fs.readFileSync(path_.join(ROOT,'scripts/build-fifa17-rosters.py'),'utf8');
  const aliases=Object.fromEntries([...py.slice(py.indexOf('ALIASES = {'),py.indexOf('}',py.indexOf('ALIASES = {'))).matchAll(/'([^']+)':\s*'([^']+)'/g)].map(m=>[m[2],m[1]]));
  let inCatalog=0;
  for(const m of Marquee.players){
    const dbName=Marquee.sourceNames[m.name]||m.name,club=aliases[m.club]||m.club;
    const rows=Object.entries(Players.clubs).flatMap(([c,d])=>d.players.filter(p=>fold(p[0])===fold(dbName)&&p[4]===m.number).map(p=>[c,p]));
    if(Players.clubs[club]){
      inCatalog+=1;
      assert.equal(rows.length,1,`${m.name} (${m.club}) is exactly one database row`);
      assert.equal(rows[0][0],club,`${m.name} row is at his own club`);assert.equal(rows[0][1][1],m.overall,`${m.name} same overall`);
    }else assert.equal(rows.length,0,`${m.name} (${m.club}, not in the catalog) matches no squad row`);
  }
  assert.equal(inCatalog,269,'269 of the 305 Special Players play for catalog clubs');
  const mb='pair_f13088c76395207270826b4fd7993470f9e24eeab5eb59952ffe87c2b474e4bd',spMb=drawFor(mb);
  assert.equal(spMb.playerOne.name,'K. Mbappé');assert.equal(spMb.playerOne.sourceName,'K. Mbappe Lottin');
  const isMb=p=>p&&p.name&&/^k\. mbapp/.test(fold(p.name));
  for(let season=1;season<=10;season+=1){
    const v=RRR.forSeason(mb,{playerOne:'Monaco',playerTwo:'Nice'},season,{special:spMb,history:noSignings});
    assert.ok(!v.boards.playerOne.some(isMb),'Mbappé never on Monaco’s board, season '+season);
    for(const t of v.turns)assert.ok(!isMb(t.player),'Mbappé is never shot');
  }
  const monaco=everyBullet(()=>14);
  for(const season of [5,6,10])assert.ok(!monaco.forSeason(fixedId(96),{playerOne:'Monaco',playerTwo:'Nice'},season,{special:spMb,history:noSignings}).boards.playerOne.some(isMb),'database refill skips Mbappé');
  // A typed signing with his display name is still the Special Player.
  assert.ok(!RRR.forSeason(mb,{playerOne:'Monaco',playerTwo:'Nice'},2,{special:spMb,history:firstSeason([row('K. Mbappe',80,'ST')])}).boards.playerOne.some(isMb));
  ok('L21','red team R87-C-05 (partial) + R87-D-01: folded names, SP excluded by own row (Empoli homonym stays, Mbappé caught by database name), Manu García #26 distinct');
}

// L22 R87-C-06: both phones animate the engine's own plan: chambers, aim and seed come from the step, never Math.random.
{
  for(let g=0;g<2000;g+=1)for(const t of RRR.forSeason(fixedId(g),AL,1).turns){
    assert.ok(Number.isInteger(t.aimSlot)&&t.aimSlot>=0&&t.aimSlot<15);
    if(t.fired)assert.equal(t.aimSlot,t.hitSlot);
  }
  const step=fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8');
  for(const field of ['bulletChamber:turn.bulletChamber','stopChamber:turn.stopChamber','hitSlot:turn.hitSlot','aimSlot:turn.aimSlot'])assert.ok(step.includes(field),'step passes '+field);
  assert.match(step,/seed:rrsSeed\(ctx\)/);
  const scene=fs.readFileSync(path_.join(ROOT,'visual-assets/v10_1/roulette/index.html'),'utf8');
  const start=scene.indexOf('function rrPlanTurn('),end=scene.indexOf('/* rrPlanTurn end */');
  assert.ok(start>0&&end>start,'the scene has one plan helper');
  const box={};vm.createContext(box);vm.runInContext(scene.slice(start,end)+';this.plan=rrPlanTurn;',box);
  const free=[{slot:3,name:'A'},{slot:11,name:'B'},{slot:14,name:'C'}];
  const p=box.plan({fire:false,bulletChamber:1,stopChamber:4,hitSlot:null,aimSlot:11},free,()=>{throw new Error('no random');});
  assert.equal(p.bulletAt,1);assert.equal(p.chamber,4);assert.equal(p.pick.name,'B');assert.equal(p.fire,false);
  const q=box.plan({fire:true,bulletChamber:5,stopChamber:5,hitSlot:14,aimSlot:14,target:'C'},free,()=>{throw new Error('no random');});
  assert.equal(q.chamber,5);assert.equal(q.pick.name,'C');assert.equal(q.fire,true);
  assert.match(scene,/Number\.isInteger\(g\.seed\)/,'the scene takes the Showdown seed');
  ok('L22','red team R87-C-06: the scene plays bulletChamber, stopChamber and the hit/aim slot from the engine, seeded');
}


// L23 red team RT5 engine fuzz (R87-E-01, Q1, Q2): stale signings, displaced starters and weak reserves never jump the
// queue; every refill is the best available club player.
{
  const cs={playerOne:'Arsenal',playerTwo:'Chelsea'},special={playerOne:{name:'Neymar',overall:92},playerTwo:{name:'Cristiano Ronaldo',overall:94}};
  const none={playerOne:[],playerTwo:[]},s1={playerOne:[row('Test Defender',50,'CB',0)],playerTwo:[]};
  // R87-E-01 XI case: Koscielny is shot in season 2; P. Mertesacker moves up and M. Debuchy fills the bench.
  const xi=`pair_${'0000002e'.repeat(8)}`;
  assert.equal(RRR.forSeason(xi,cs,2,{special,history:[null,s1]}).turns[0].player.name,'L. Koscielny');
  const x3=RRR.forSeason(xi,cs,3,{special,history:[null,s1,none]}).boards.playerOne;
  assert.equal(x3[4].name,'P. Mertesacker','a season-1 signing parked in the reserves does not take a season-3 vacancy');
  assert.ok(x3.some(p=>p.bench&&p.name==='M. Debuchy'));assert.ok(!x3.some(p=>p.name==='Test Defender'));
  // R87-E-01 bench case: Coquelin (sub) is shot in season 2; the best reserve M. Debuchy (80) fills slot 12.
  const bench=`pair_${'00000062'.repeat(8)}`;
  assert.equal(RRR.forSeason(bench,cs,2,{special,history:[null,s1]}).turns[0].player.name,'F. Coquelin');
  assert.equal(RRR.forSeason(bench,cs,3,{special,history:[null,s1,none]}).boards.playerOne[12].name,'M. Debuchy');
  // Q1: Test Back (RB 85) replaces Bellerín (79); Bellerín beats no remaining sub, so he goes to the reserves and the shot
  // sub's place goes to the best available club player, M. Debuchy (80).
  const s2={playerOne:[row('Test Back',85,'RB',0)],playerTwo:[]};
  const q1=RRR.forSeason(bench,cs,3,{special,history:[null,none,s2]}).boards.playerOne;
  assert.equal(q1[10].name,'Test Back');assert.equal(q1[12].name,'M. Debuchy','displaced 79 never takes the bench over an 80');
  assert.ok(!q1.some(p=>p.name==='Héctor Bellerín'));
  // Q2: a weak kept signing in the reserves never blocks a better unused club player. Season 1 is safe (he beats no sub,
  // so he is parked in the reserves), then sub 14 is shot every season; once
  // the hidden three are used, the refill is the best unused club player, not the parked 70.
  const sub=everyBullet(()=>14,k=>k>1),weak=[null,{playerOne:[row('Weak cover',70,null)],playerTwo:[]},...noSignings.slice(2)];
  const occupied=new Set(RRR.board('Arsenal').map(p=>p.name)),pool=Players.clubs.Arsenal.players.filter(p=>!occupied.has(p[0])).sort((a,b)=>b[1]-a[1]||a[4]-b[4]);
  for(let season=3;season<=10;season+=1){
    const b=sub.forSeason(fixedId(97),AL,season,{history:weak}).boards.playerOne;
    assert.equal(b[14].name,pool[season-3][0],`season ${season}: the best unused club player refills, not a weak reserve`);
    assert.ok(!b.some(p=>p.name==='Weak cover'));
  }
  ok('L23','red team RT5 engine: no stale-signing first refusal (E-01), displaced starter to the bench only when he beats a sub (Q1), best available refill (Q2)');
}

// L15 red team R87-B-02: the roulette's own files failing never opens the Transfer window silently. The step asks TRY
// AGAIN / BACK; a retry that loads runs the season; a club that runs out says so before the window.
async function stepWorld({loads,forSeason}){
  class El{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.classList={add(){},remove(){}};this.textContent='';this.parent=null;}
    append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
    addEventListener(t,fn){(this.listeners[t]||=[]).push(fn);}focus(){}
    all(){return [this,...this.children.flatMap(c=>c.all())];}
    querySelector(sel){return sel==='button'?this.all().slice(1).find(n=>n.tagName==='button')||null:null;}}
  const body=new El('body'),doc={body,createElement:tag=>new El(tag),getElementById:id=>body.all().find(n=>n.id===id)||null};
  const store=new Map();let attempt=0;
  const sandbox={document:doc,setTimeout,clearTimeout,location:{origin:'x'},addEventListener(){},removeEventListener(){},
    readStorageValue:k=>store.get(k)||null,writeStorageValue:(k,v)=>{store.set(k,v);return true;},
    loadRuntimeScript:async(key)=>{if(key==='fifa17-players'){attempt+=1;if(!loads(attempt))throw new Error('network unavailable');}
      sandbox.CareerModeFifa17Players={clubs:{Arsenal:{},Liverpool:{}}};sandbox.CareerModeRosterSquads={};sandbox.CareerModeMarqueePlayers={};sandbox.CareerModeMarqueePlayer={forShowdown:()=>null};
      sandbox.CareerModeRosterRoulette={forSeason,board:()=>[{}]};return true;}};
  vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8'),sandbox);
  const step=sandbox.CareerModeRosterRouletteStep;
  const panel=()=>doc.getElementById(step.panelId);
  const find=label=>panel()&&panel().all().find(n=>n.tagName==='button'&&n.textContent===label);
  const press=async label=>{for(let i=0;i<200&&!find(label);i+=1)await new Promise(r=>setTimeout(r,5));const b=panel().all().find(n=>n.tagName==='button'&&n.textContent===label);assert.ok(b,'button '+label);const title=panel().all().find(n=>n.className==='rrStepTitle').textContent;b.listeners.click[0]();await new Promise(r=>setTimeout(r,5));return title;};
  const ctx={rivalryId:'pair_'+'a'.repeat(64),managerRole:'playerOne',season:1,clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},confirmedAtMs:Date.parse('2026-11-01T00:00:00Z'),phase:'NOT_STARTED',verdicts:async()=>({ok:false})};
  return {step,ctx,press,store};
}
const stepChecks=(async()=>{
  {
    const w=await stepWorld({loads:()=>false,forSeason:()=>{throw new Error('not reached');}});
    assert.equal(w.step.decide(w.ctx),true);
    const run=w.step.runBeforeTransfers(w.ctx);
    assert.equal(await w.press('BACK TO SHOWDOWN HOME'),'Loading the roulette');
    assert.equal(await run,false,'a roulette that cannot load keeps the Transfer window shut');
    assert.equal(w.step.decide(w.ctx),true,'nothing is marked done or skipped: the next tap tries again');
  }
  {
    const plan={boards:{playerOne:[],playerTwo:[]},formations:{},turns:[{role:'playerOne',fired:false,player:null},{role:'playerTwo',fired:false,player:null}]};
    const w=await stepWorld({loads:n=>n>1,forSeason:()=>plan});
    w.store.set(w.step.watchedKey,JSON.stringify([`${w.ctx.rivalryId}|1|playerOne`]));// the scene was watched before a reload
    const run=w.step.runBeforeTransfers({...w.ctx});
    assert.equal(await w.press('TRY AGAIN'),'Loading the roulette');
    assert.equal(await w.press('GO TO THE TRANSFER WINDOW'),'Your squad is safe','a retry that loads shows this season’s result');
    assert.equal(await run,true);
  }
  assert.ok(!/ROSTER_EXHAUSTED|No roulette this season/.test(fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8')),'the roulette is never skipped for a short squad');
  {
    let calls=0;const w=await stepWorld({loads:()=>true,forSeason:()=>{calls+=1;throw new Error('boom');}});
    const run=w.step.runBeforeTransfers(w.ctx);
    assert.equal(await w.press('TRY AGAIN'),'The roulette hit a problem');
    assert.equal(await w.press('BACK TO SHOWDOWN HOME'),'The roulette hit a problem');
    assert.equal(await run,false,'an unexpected error never opens the window');assert.equal(calls,2,'retry rebuilds the same plan');
  }
  const pstc=fs.readFileSync(path_.join(ROOT,'js/productionSharedTransferChallenge.js'),'utf8');
  assert.match(pstc,/if\(!step\)\{rouletteError=PSTC_ROULETTE_TEXT\.load;return false;\}/,'the step file itself failing keeps the window shut');
  assert.match(pstc,/\}catch\(_error\)\{rouletteError=PSTC_ROULETTE_TEXT\.error;return false;\}/);
  ok('L15','red team R87-B-02: roulette load failure or error asks TRY AGAIN / BACK and never opens Transfers silently; never skipped for a short squad');

  // L16 red team R87-B-03/04/05/06: offline scene files, two-tab signing drafts, plain connection text, quota on direct gets.
  const swSource=fs.readFileSync(path_.join(ROOT,'service-worker.js'),'utf8');
  const unversioned=swSource.slice(swSource.indexOf('const UNVERSIONED_SHELL_ASSET_PATHS'),swSource.indexOf(']);',swSource.indexOf('const UNVERSIONED_SHELL_ASSET_PATHS')));
  for(const file of ['visual-assets/v10_1/roulette/vendor/three-r128.min.js','visual-assets/v10_1/roulette/platemap.json','visual-assets/v10_1/roulette/assets/squads.json'])
    assert.ok(unversioned.includes(`"${file}"`),'offline scene file '+file);
  assert.match(pstc,/root\.addEventListener\("storage",pstcSigningDraftStorage\)/,'a newer draft from another tab is taken over');
  assert.match(pstc,/pstcRestoreSigningDraft\(role,view\.ownInputs\|\|null,true\)/);
  assert.match(pstc,/unavailable\|deadline\|offline\|network\|aborted/,'connection codes read as plain words');
  const pairing=fs.readFileSync(path_.join(ROOT,'js/sparkPrivatePairing.js'),'utf8');
  assert.match(pairing,/function fsbGetFailed\(error,lookups\)\{[^\n]*if\(fsbIsQuotaError\(error\)\)fsbTrip\(\);\}/,'a quota answer on a direct get trips the pause');
  ok('L16','red team R87-B-03..06: offline scene files, two-tab drafts, plain error words, quota pause on direct gets');

  // L24 red team RT5-FLOW-01: a roulette page that says "ready" and then drops the setup (its squads file failed) never
  // traps the manager on a black stage: the page posts cms-rr-error, and the step keeps the stage hidden until
  // cms-rr-armed, removes it after a short wait and shows the result panel (never the Transfer window).
  {
    const scene=fs.readFileSync(path_.join(ROOT,'visual-assets/v10_1/roulette/index.html'),'utf8');
    assert.match(scene,/g\.turns\.length!==2\)\{ toGame\("cms-rr-error",\{message:SQUADS\?"setup":"squads"\}\); return; \}/,'the page reports a setup it cannot take');
    const stepSrc=fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8');
    assert.match(stepSrc,/event\.data\.type==="cms-rr-armed"\)onArmed\("armed"\)/);
    assert.ok(stepSrc.indexOf('if(armed!=="armed")throw')<stepSrc.indexOf('stage.style.visibility="visible"'),'the stage is shown only after armed');
    for(const pageSays of [['cms-rr-ready'],['cms-rr-ready',{type:'cms-rr-error',message:'squads'}]]){
      class El{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.classList={add(){},remove(){}};this.textContent='';this.parent=null;
        if(tag==='iframe')this.contentWindow={posted:[],postMessage(m){this.posted.push(m);},location:{href:'x'},THREE:{}};}
        append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
        remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
        setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
        addEventListener(t,fn){(this.listeners[t]||=[]).push(fn);}focus(){}
        all(){return [this,...this.children.flatMap(c=>c.all())];}
        querySelector(sel){return sel==='button'?this.all().slice(1).find(n=>n.tagName==='button')||null:null;}}
      const body=new El('body'),doc={body,createElement:tag=>new El(tag),getElementById:id=>body.all().find(n=>n.id===id)||null};
      const handlers=[],store=new Map();
      const plan={boards:{playerOne:RRR.board('Arsenal'),playerTwo:RRR.board('Liverpool')},formations:{playerOne:'x',playerTwo:'y'},turns:[{role:'playerOne',fired:false,player:null,bulletChamber:1,stopChamber:4,hitSlot:null,aimSlot:3},{role:'playerTwo',fired:false,player:null,bulletChamber:2,stopChamber:5,hitSlot:null,aimSlot:7}]};
      const sandbox={document:doc,setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,30)),clearTimeout,location:{origin:'x'},
        addEventListener:(t,fn)=>{if(t==='message')handlers.push(fn);},removeEventListener(){},
        readStorageValue:k=>store.get(k)||null,writeStorageValue:(k,v)=>{store.set(k,v);return true;},
        loadRuntimeScript:async()=>{sandbox.CareerModeFifa17Players={clubs:{Arsenal:{},Liverpool:{}}};sandbox.CareerModeRosterSquads={};sandbox.CareerModeMarqueePlayers={};sandbox.CareerModeMarqueePlayer={forShowdown:()=>null};sandbox.CareerModeRosterRoulette={forSeason:()=>plan,board:()=>[{}]};return true;}};
      vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path_.join(ROOT,'js/rosterRouletteStep.js'),'utf8'),sandbox);
      const step=sandbox.CareerModeRosterRouletteStep;
      const ctx={rivalryId:'pair_'+'b'.repeat(64),managerRole:'playerOne',season:1,clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},confirmedAtMs:Date.parse('2026-11-01T00:00:00Z'),phase:'NOT_STARTED',verdicts:async()=>({ok:false})};
      const run=step.runBeforeTransfers(ctx);
      let frame=null;for(let i=0;i<200&&!frame;i+=1){await new Promise(r=>setTimeout(r,5));frame=body.all().find(n=>n.tagName==='iframe')||null;}
      assert.ok(frame,'the roulette page is framed');
      for(const message of pageSays)for(const h of handlers)h({source:frame.contentWindow,origin:'x',data:typeof message==='string'?{type:message}:message});
      let panel=null;for(let i=0;i<300&&!panel;i+=1){await new Promise(r=>setTimeout(r,5));panel=doc.getElementById(step.panelId);}
      assert.ok(panel,'the result panel shows instead of a stuck stage');
      assert.equal(doc.getElementById(step.stageId),null,'the black stage is removed');
      assert.equal(panel.all().find(n=>n.className==='rrStepTitle').textContent,'Your squad is safe');
      assert.ok(frame.contentWindow.posted.some(m=>m.type==='cms-rr-setup'&&m.turns[0].bulletChamber===1&&m.turns[0].aimSlot===3&&Number.isInteger(m.seed)),'the setup carried the engine plan and seed (R87-C-06)');
      const back=panel.all().find(n=>n.tagName==='button'&&n.textContent==='BACK TO SHOWDOWN HOME');back.listeners.click[0]();
      assert.equal(await run,false,'BACK never opens the Transfer window');
    }
    ok('L24','red team RT5-FLOW-01: a page that drops the setup posts cms-rr-error; the stage waits for cms-rr-armed, times out to the result panel');
  }
  console.log(`r87 roster roulette contracts: ${checks} groups passed`);
})();
stepChecks.catch(error=>{console.error(error);process.exitCode=1;});
