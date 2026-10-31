'use strict';
// r87 test gaps (2026-10-31): seeded property test for the Russian Roster Roulette boards over whole 10-season careers.
// The fixed cases in r87-roster-roulette-contracts.cjs pin one example per bug (SQ-2-01..03, R87-C-01/05, R87-E-02). This
// file drives js/rosterRoulette.js with many random Showdowns and random Transfer War histories (kept signings, released
// signings, guessed incumbents, repeats, accent and case variants of names) and checks, for every season of every career:
//   P1 a player the rival guessed (release:true) never stands on a later board ("guessed player stays on board", Nik)
//   P2 a player the bullet hit never comes back
//   P3 neither Special Player is on either board (by name, by shirt number when he has one, by his squad name)
//   P4 board names come only from the manager's own club pool or his own kept signings (Nik: squads only from own club)
//   P5 15 slots in order, no person twice, empty rows only as name null / rating 0, the bullet only hits a filled row
//   P6 the shot already shown never changes: season k is identical whatever is entered in later windows
//   P7 one manager's entries never change the other manager's board or shot (Special Players aside)
//   P8 same inputs, same result (both phones)
//   P9 the real verdict chain: the Spark and the shared evaluators agree, a signing is released exactly when a rival league or
//      nationality guess matches, the production row filter and its local copy (JSON) keep name and release, and the engine
//      then keeps every released signing off every later board
// Pure engine, no IO: runs in well under a second per 100 careers.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path_=require('node:path');
const vm=require('node:vm');
const ROOT=path_.resolve(__dirname,'../..');
const Players=require('../../data/fifa17Players.js');
const RRR=require('../../js/rosterRoulette.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path_.join(ROOT,'data/clubs.js'),'utf8')+';this.c=clubsByLeague',ctx);
const catalog=Object.values(ctx.c).flat();
assert.equal(catalog.length,98);

// Same identity rule as the engine (accents folded, trimmed, lower-cased); written out here so a change to the engine's
// rule has to change this file too.
const key=name=>String(name||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const SIGNING_POSITIONS=['GK','RB','RWB','CB','LB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'];
const ROLES=['playerOne','playerTwo'];

// mulberry32: a fixed seed so every run checks the same careers and a failure can be replayed.
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const SEED=Number(process.env.RRR_PROPERTY_SEED||20261031);
const CAREERS=Number(process.env.RRR_PROPERTY_CAREERS||60);
const rand=rng(SEED);
const int=n=>Math.floor(rand()*n);
const pick=list=>list[int(list.length)];
const hex=n=>Array.from({length:n},()=>'0123456789abcdef'[int(16)]).join('');
const allRows=catalog.flatMap(club=>Players.clubs[club].players.map(p=>({club,name:p[0],overall:p[1],positions:p[2],number:p[4]})));
// A name as a manager might type it: accents dropped, other case, stray spaces. The engine must treat all as one person.
function variant(name){
  const r=int(5);
  if(r===0)return name.normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(r===1)return name.toUpperCase();
  if(r===2)return `  ${name} `;
  if(r===3)return name.toLowerCase();
  return name;
}
const signingRow=(slot,p,release)=>({slot,name:p.name,overall:p.overall,position:SIGNING_POSITIONS.includes(p.positions[0])?p.positions[0]:null,release});

function careerInputs(){
  const a=pick(catalog);let b=pick(catalog);while(b===a)b=pick(catalog);
  const clubs={playerOne:a,playerTwo:b};
  const id=`pair_${hex(64)}`;
  // Special Players: sometimes a launch-board player of either club (must be skipped), sometimes from elsewhere,
  // sometimes without a shirt number (older draw), sometimes with a squad name that differs from the shown name.
  const special={};
  for(const role of ROLES){
    const own=Players.clubs[pick([a,b])].players,src=rand()<0.5?pick(own.slice(0,15)):pick(allRows);
    const row=Array.isArray(src)?{name:src[0],overall:src[1],number:src[4]}:src;
    const sp={name:row.name,overall:row.overall,number:rand()<0.8?row.number:undefined};
    if(rand()<0.15){sp.sourceName=row.name;sp.name=`${row.name} Jr`;}
    special[role]=sp;
  }
  return {id,clubs,special};
}

function personKey(row){return `${key(row.name)}#${Number.isInteger(row.number)?row.number:'-'}`;}
function onBoard(board,name,number){
  const k=key(name);
  return board.some(p=>p.name&&key(p.name)===k&&(number===null||number===undefined||!Number.isInteger(p.number)||p.number===number));
}

const t0=Date.now();
let seasonsChecked=0,guessedChecked=0,shotsChecked=0,emptyRows=0,incumbentGuesses=0,variantsUsed=0;
for(let c=0;c<CAREERS;c+=1){
  const {id,clubs,special}=careerInputs();
  const history=[null];
  const shown=[null];
  const kept={playerOne:new Set(),playerTwo:new Set()};
  const guessed={playerOne:[],playerTwo:[]};
  const shot={playerOne:[],playerTwo:[]};
  const pool={};for(const role of ROLES)pool[role]=new Set(Players.clubs[clubs[role]].players.map(p=>key(p[0])));
  for(let s=1;s<=10;s+=1){
    const label=`seed ${SEED} career ${c} (${clubs.playerOne} v ${clubs.playerTwo}) season ${s}`;
    const plan=RRR.forSeason(id,clubs,s,{special,history});
    assert.ok(plan,`${label}: a plan`);
    // P8 both phones: a second call (fresh arrays, same values) gives the same plan.
    assert.deepEqual(JSON.parse(JSON.stringify(RRR.forSeason(id,JSON.parse(JSON.stringify(clubs)),s,{special:JSON.parse(JSON.stringify(special)),history:JSON.parse(JSON.stringify(history))}))),JSON.parse(JSON.stringify(plan)),`${label}: same inputs, same plan`);
    shown.push(plan);
    for(const role of ROLES){
      const board=plan.boards[role],turn=plan.turns.find(t=>t.role===role);
      // P5 shape.
      assert.equal(board.length,15,`${label} ${role}: 15 slots`);
      assert.deepEqual(board.map(p=>p.slot),[...Array(15).keys()],`${label} ${role}: slots in order`);
      const filled=board.filter(p=>p.name);
      for(const p of board)if(!p.name){emptyRows+=1;assert.equal(p.rating,0,`${label} ${role}: an empty row has rating 0`);}
      const seen=new Set();
      for(const p of filled){
        const k=key(p.name);
        assert.ok(!seen.has(personKey(p)),`${label} ${role}: ${p.name} twice on the board`);
        seen.add(personKey(p));
        if(!Number.isInteger(p.number))assert.equal(filled.filter(q=>key(q.name)===k).length,1,`${label} ${role}: a signing ${p.name} is one person on the board`);
        // P4 own pool or own kept signing.
        assert.ok(pool[role].has(k)||kept[role].has(k),`${label} ${role}: ${p.name} is not from ${clubs[role]} or a kept signing`);
        assert.notEqual(p.special,true,`${label} ${role}: no row is flagged special`);
      }
      // P1 guessed players stay off.
      for(const g of guessed[role]){guessedChecked+=1;assert.ok(!onBoard(board,g,null),`${label} ${role}: guessed ${g} is back on the board`);}
      // P2 shot players stay off.
      for(const p of shot[role]){shotsChecked+=1;assert.ok(!board.some(q=>q.name&&personKey(q)===personKey(p)),`${label} ${role}: shot ${p.name} is back on the board`);}
      // P3 Special Players, both managers', on both boards.
      for(const r of ROLES){
        const sp=special[r],num=Number.isInteger(sp.number)?sp.number:null;
        for(const name of [sp.name,sp.sourceName].filter(Boolean))assert.ok(!onBoard(board,name,num),`${label} ${role}: Special Player ${name} on the board`);
      }
      // P5 the bullet.
      assert.equal(turn.role,role);
      if(turn.fired){
        assert.ok(Number.isInteger(turn.hitSlot)&&board[turn.hitSlot].name,`${label} ${role}: the bullet hits a filled row`);
        assert.deepEqual(turn.player,board[turn.hitSlot],`${label} ${role}: the shown victim is the board row`);
      }else assert.equal(turn.player,null,`${label} ${role}: no shot, no victim`);
    }
    seasonsChecked+=1;
    // Record what the screen showed this season, then enter this season's Transfer War.
    for(const role of ROLES){
      const turn=plan.turns.find(t=>t.role===role);
      if(turn.fired)shot[role].push(turn.player);
    }
    if(s===10)break;
    const entry={};
    for(const role of ROLES){
      const rows=[];let slot=0;
      const n=int(4);
      for(let i=0;i<n;i+=1){
        const p=pick(allRows),release=rand()<0.4;
        rows.push(signingRow(slot++,p,release));
      }
      // A guessed incumbent: one of his own board players entered and released (Sol SQ-2-02 shape).
      if(rand()<0.35){
        const board=plan.boards[role].filter(p=>p.name);
        const p=pick(board);const name=variant(p.name);if(name!==p.name)variantsUsed+=1;
        rows.push({slot:slot++,name,overall:p.rating>=40?p.rating:60,position:null,release:true});incumbentGuesses+=1;
      }
      // A repeat of an earlier kept signing (Sol SQ-2-03) keeps him where he is.
      if(kept[role].size&&rand()<0.25){
        const earlier=history.slice(1).flatMap(h=>h[role]).filter(r=>r.release===false);
        if(earlier.length){const r=pick(earlier);rows.push({...r,slot:slot++});}
      }
      entry[role]=rows;
    }
    history.push(entry);
    for(const role of ROLES)for(const r of entry[role]){
      if(r.release===true)guessed[role].push(r.name);
      else if(Number.isInteger(r.overall)&&r.overall>=30)kept[role].add(key(r.name));
    }
  }
  // P6 the shot already shown never changes: every earlier season, rebuilt with the full history, is identical.
  for(let k=1;k<=10;k+=1){
    const again=RRR.forSeason(id,clubs,k,{special,history});
    assert.deepEqual(JSON.parse(JSON.stringify(again)),JSON.parse(JSON.stringify(shown[k])),`seed ${SEED} career ${c} season ${k}: later windows changed an earlier season`);
  }
  // P7 independence: wipe the other manager's entries; this manager's board and shot stay the same every season.
  for(const role of ROLES){
    const other=role==='playerOne'?'playerTwo':'playerOne';
    const solo=history.map(h=>h&&{[role]:h[role],[other]:[]});
    for(let k=1;k<=10;k+=1){
      const plan=RRR.forSeason(id,clubs,k,{special,history:solo});
      assert.deepEqual(JSON.parse(JSON.stringify(plan.boards[role])),JSON.parse(JSON.stringify(shown[k].boards[role])),`seed ${SEED} career ${c} season ${k}: ${other}'s entries changed ${role}'s board`);
      assert.deepEqual(plan.turns.find(t=>t.role===role),shown[k].turns.find(t=>t.role===role),`seed ${SEED} career ${c} season ${k}: ${other}'s entries changed ${role}'s shot`);
    }
  }
}
assert.ok(guessedChecked>200,`enough guessed-player checks (${guessedChecked})`);
assert.ok(incumbentGuesses>50&&variantsUsed>10,`guessed incumbents ${incumbentGuesses}, name variants ${variantsUsed}`);
assert.ok(shotsChecked>20,`enough shot-player checks (${shotsChecked})`);
ok('P1','a guessed player (release:true, any accent/case/space variant) never stands on a later board');
ok('P2','a player the bullet hit never comes back');
ok('P3','neither Special Player is on either board (name, shirt number, squad name)');
ok('P4','every board name is from the manager\'s own club pool or his own kept signing');
ok('P5','15 ordered slots, no person twice, empty rows are blank with rating 0, the bullet only hits a filled row');
ok('P6','the shot already shown never changes when later windows are entered');
ok('P7','one manager\'s entries never change the other manager\'s board or shot');
ok('P8','same inputs give the same plan');
// P9 the verdict chain the roulette step reads (js/rosterRouletteStep.js rrsHistory <- productionSharedTransferChallenge
// pstcRouletteVerdicts <- the provider's verdicts). The functions are taken from the shipped files, not copied.
function extract(file,head){
  const src=fs.readFileSync(path_.join(ROOT,file),'utf8'),at=src.indexOf(head);
  assert.ok(at>=0,`${file}: ${head}`);
  const lineEnd=src.indexOf('\n',at),firstLine=src.slice(at,lineEnd);
  if(firstLine.trim().endsWith('}')&&!firstLine.trim().endsWith('{'))return firstLine;
  const close=src.indexOf('\n  }\n',at);assert.ok(close>at,`${file}: end of ${head}`);
  return src.slice(at,close+4);
}
const chain={};vm.createContext(chain);
vm.runInContext([
  'const ROLES=["playerOne","playerTwo"];',
  'function stcFail(code){const e=new Error(code);e.code=code;throw e;}',
  extract('js/sharedTransferChallenge.js','function stcRole(value)'),
  extract('js/sharedTransferChallenge.js','function stcEvaluateRole(role,state)'),
  extract('js/sparkSharedTransferChallenge.js','function stspProtocolVerdict(role,state)'),
  extract('js/productionSharedTransferChallenge.js','const SIGNING_POSITIONS=').trim(),
  extract('js/productionSharedTransferChallenge.js','function pstcVerdictRows(rows)'),
  'this.shared=stcEvaluateRole;this.spark=stspProtocolVerdict;this.rows=pstcVerdictRows;'
].join('\n'),chain);
{
  const leagues=['eng-1','esp-1','ger-1','ita-1','fra-1','por-1'],nations=['england','spain','germany','brazil','france','argentina','italy','netherlands'];
  let released=0,keptRows=0,careers=0;
  for(let c=0;c<Math.max(10,Math.floor(CAREERS/3));c+=1){
    const {id,clubs,special}=careerInputs();careers+=1;
    const history=[null],gone={playerOne:[],playerTwo:[]};
    for(let s=1;s<=10;s+=1){
      const plan=RRR.forSeason(id,clubs,s,{special,history});assert.ok(plan);
      for(const role of ROLES)for(const name of gone[role])assert.ok(!onBoard(plan.boards[role],name,null),`P9 career ${c} season ${s} ${role}: released ${name} is on the board`);
      if(s===10)break;
      const inputs={};
      for(const role of ROLES){
        const signings=Array.from({length:int(4)},(_,i)=>{const p=pick(allRows);return {slot:i+1,name:rand()<0.3?variant(p.name):p.name,leagueId:pick(leagues),nationalityId:pick(nations),overall:p.overall,position:SIGNING_POSITIONS.includes(p.positions[0])?p.positions[0]:'CM'};});
        // Sometimes he signs a player already on his own board (the guessed-incumbent case).
        if(signings.length<3&&rand()<0.4){const p=pick(plan.boards[role].filter(q=>q.name));signings.push({slot:signings.length+1,name:p.name,leagueId:pick(leagues),nationalityId:pick(nations),overall:Math.max(30,p.rating),position:'CM'});}
        const guesses=Array.from({length:int(4)},(_,i)=>rand()<0.5?{slot:i+1,type:'league',valueId:pick(leagues)}:{slot:i+1,type:'nationality',valueId:pick(nations)});
        inputs[role]={signings,guesses};
      }
      const state={phase:'COMPLETED',inputs};
      const entry={};
      for(const role of ROLES){
        const a=chain.shared(role,state),b=chain.spark(role,state);
        assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),`P9 ${role}: the shared and the Spark evaluators agree`);
        const rival=inputs[role==='playerOne'?'playerTwo':'playerOne'].guesses;
        a.forEach((row,i)=>{
          const sg=inputs[role].signings[i],hit=rival.some(g=>(g.type==='league'&&g.valueId===sg.leagueId)||(g.type==='nationality'&&g.valueId===sg.nationalityId));
          assert.equal(row.release,hit,`P9 ${role} ${sg.name}: released exactly when a rival guess matches`);
        });
        // What the roulette step gets: the production row filter, then its local copy (JSON in storage) on a refresh.
        const rows=JSON.parse(JSON.stringify(chain.rows(JSON.parse(JSON.stringify(a)))));
        assert.deepEqual(rows.map(r=>[r.name,r.release]),a.map(r=>[r.name,r.release]),`P9 ${role}: names and release survive the row filter and the local copy`);
        entry[role]=rows;
        for(const r of rows){if(r.release){released+=1;gone[role].push(r.name);}else keptRows+=1;}
      }
      history.push(entry);
    }
  }
  assert.ok(released>100&&keptRows>100,`P9 coverage: ${released} released, ${keptRows} kept`);
  ok('P9',`the verdict chain (shared = Spark evaluator, row filter, local copy) keeps every released signing off every later board (${careers} careers, ${released} released)`);
}
console.log(`PASS r87 roulette board invariants: ${CAREERS} careers, ${seasonsChecked} seasons, ${guessedChecked} guessed and ${shotsChecked} shot checks, ${emptyRows} empty rows, seed ${SEED}, ${Date.now()-t0} ms (${checks} checks)`);
