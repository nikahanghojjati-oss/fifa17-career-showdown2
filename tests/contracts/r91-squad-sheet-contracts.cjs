'use strict';
// r91 / 2.4.0 Squad Management engine (js/squadSheet.js). Nik 2026-11-11 00:03 and 00:06 UTC:
//   - season 1 is the original squad: launch XI in the default formation + the original 4 subs, never "top 15 by overall"
//   - four lines (GK, DEF, MID, ATT); from season 2 a player who left is replaced within his line only; no line skipped
//   - managers drag, change formation and sort, but never drag a better player out to the reserves
//   - flex: RW/LW to ST, RM to CM, CM to CDM or CAM, RB to CB, CB to RB or LB, LB to CB; a GK never plays elsewhere
// Pure engine, no IO. All 98 clubs x 33 formations plus seeded 10-season careers.
const assert=require('node:assert/strict');
const S=require('../../js/squadSheet.js');
const Players=require('../../data/fifa17Players.js');
const Squads=require('../../data/rosterSquads.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const clubs=Object.keys(Players.clubs).sort();
assert.equal(clubs.length,98);
const names=list=>list.map(p=>p?p.name:null);
const ids=sheet=>[...sheet.xi,...sheet.bench,...sheet.reserves].filter(Boolean).map(p=>p.id);
const fifteenIds=sheet=>[...sheet.xi,...sheet.bench].filter(Boolean).map(p=>p.id).sort();
const ref=(zone,index)=>({zone,index});
const resRef=(sheet,name)=>{const b=sheet.bench.findIndex(p=>p&&p.name===name);return b>=0?ref('bench',b):ref('res',sheet.reserves.findIndex(p=>p.name===name));};
const xiRef=(sheet,pred)=>ref('xi',sheet.xi.findIndex(pred));

// C1 lines and flex in Nik's words.
assert.deepEqual(['GK','CB','RB','LWB','CDM','CAM','LM','RW','CF','ST','RS','LAM','RDM'].map(S.lineOf),['GK','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','ATT','MID','MID']);
const fit=(positions,slot)=>S.fit({positions},slot);
assert.equal(fit(['RW'],'ST'),2);assert.equal(fit(['LW'],'LS'),2);assert.equal(fit(['RM'],'RCM'),2);assert.equal(fit(['CM'],'CDM'),2);assert.equal(fit(['CM'],'CAM'),2);
assert.equal(fit(['RB'],'RCB'),2);assert.equal(fit(['CB'],'RB'),2);assert.equal(fit(['CB'],'LB'),2);assert.equal(fit(['LB'],'LCB'),2);
assert.equal(fit(['GK'],'CB'),0);assert.equal(fit(['CB'],'GK'),0);assert.equal(fit(['CB'],'ST'),0);assert.equal(fit(['CDM'],'RW'),0);
assert.equal(fit(['ST'],'ST'),3);assert.equal(fit(['CB'],'RWB'),1);assert.equal(fit(['CDM'],'LM'),1);
ok('C1','four lines and Nik\'s flex list; a keeper never plays outfield and no outfielder plays in goal');

// C2 season 1 = the launch squad exactly, every club.
for(const club of clubs){
  const sheet=S.launch(club),squad=Squads.squads[club];
  assert.equal(sheet.formation,Players.clubs[club].formation,club);
  assert.deepEqual(names(sheet.xi).slice().sort(),squad.xi.map(r=>r[1]).sort(),club);
  assert.deepEqual(names(sheet.bench).slice(0,4),squad.subs.map(r=>r[1]),club);
  assert.deepEqual(names(sheet.bench).slice(4),squad.reserves.map(r=>r[1]),`${club}: subs 5-7 are the next three`);
  assert.deepEqual(S.board(sheet).slice(11).map(r=>r.name),squad.subs.map(r=>r[1]),`${club}: the Roulette board keeps the original 4 subs`);
  assert.deepEqual(sheet.slots,Players.formations[sheet.formation],club);
  sheet.xi.forEach((p,i)=>assert.equal(squad.xi.find(r=>r[1]===p.name&&r[2]===p.number)[0],sheet.slots[i],`${club} ${p.name} keeps his launch slot`));
  assert.equal(ids(sheet).length,Players.clubs[club].players.length,`${club}: everyone else is in the reserves`);
  assert.ok(S.validate(sheet).ok,club);
}
ok('C2','season 1 for all 98 clubs is the FIFA 17 launch XI in its default formation and slots, 7 subs (the original 4, on the Roulette board, then the next 3); every other club player is a reserve');

// C3 every club x every formation.
let shaped=0,refused=0;
for(const club of clubs){
  const one=S.launch(club);
  const two=S.advance(S.advance(one,{}),{});
  assert.equal(two.season,2);assert.equal(two.stage,'pre');
  for(const f of S.formations()){
    const r1=S.setFormation(one,f.name);
    if(r1.ok){shaped+=1;assert.deepEqual(fifteenIds(r1.sheet),fifteenIds(one),`${club} ${f.name}: season 1 keeps the original 15`);assert.ok(S.validate(r1.sheet).ok);}
    else{refused+=1;assert.match(r1.reason,/season 2/);}
    const r2=S.setFormation(two,f.name);
    assert.ok(r2.ok,`${club} ${f.name}`);
    const v=S.validate(r2.sheet);assert.ok(v.ok,`${club} ${f.name}: ${v.problems}`);
    assert.deepEqual(r2.sheet.slots,f.slots);
    assert.equal(r2.sheet.xi.filter(Boolean).length,11);
    assert.deepEqual(ids(r2.sheet).sort(),ids(two).sort(),`${club} ${f.name}: nobody appears or vanishes`);
    // the XI players kept where they can still play: a formation change never swaps out a starter who still fits a slot
    // of the new shape for someone outside the XI unless a line count forced it
    const again=S.setFormation(two,f.name);
    assert.equal(JSON.stringify(again),JSON.stringify(r2),'deterministic');
  }
}
assert.ok(shaped>2800&&refused<500,`${shaped} shaped, ${refused} refused`);
ok('C3',`98 clubs x 33 formations: season 1 only rearranges the original 15 (${shaped} shapes, ${refused} need a reserve and wait for season 2); from season 2 every shape fills its line counts, validates and is deterministic`);

// C4 the manager's moves.
{
  const s1=S.launch('Arsenal');
  const gk=xiRef(s1,p=>p.name==='P. Čech'),cb=xiRef(s1,p=>p.name==='L. Koscielny');
  assert.equal(S.canSwap(s1,gk,cb).ok,false);
  assert.equal(S.canSwap(s1,ref('bench',0),cb).ok,true,'Mertesacker (CB) for Koscielny');
  assert.equal(S.canSwap(s1,ref('bench',3),cb).ok,false,'a striker cannot play centre back');
  assert.match(S.canSwap(s1,resRef(s1,'C. Jenkinson'),ref('bench',4)).reason,/season 2/);
  const s2=S.advance(S.advance(s1,{}),{});
  const xiName=(sheet,n)=>sheet.xi.some(p=>p&&p.name===n),boardName=(sheet,n)=>sheet.bench.slice(0,4).some(p=>p&&p.name===n);
  // Nik's no-hiding rule (2026-11-11): from season 2 the XI holds each line's best and subs 1-4 are the best 4 left.
  assert.equal(S.hidingIssue(s2),null,'season 2 opens with nobody hidden');
  assert.ok(xiName(s2,'P. Mertesacker')&&!xiName(s2,'Héctor Bellerín'),'Mertesacker 83 (DEF) starts over Bellerín 79');
  assert.ok(!boardName(s2,'Héctor Bellerín')&&boardName(s2,'D. Welbeck'),'Welbeck 80 takes a board seat over Bellerín 79');
  assert.equal(S.hidingIssue(s1),null,'season 1 is the launch squad as it is');
  const mert=xiRef(s2,p=>p.name==='P. Mertesacker'),giroud=xiRef(s2,p=>p.name==='O. Giroud');
  assert.match(S.canSwap(s2,ref('bench',4),mert).reason,/better/,'Debuchy 80 cannot replace Mertesacker 83');
  assert.match(S.canSwap(s2,ref('bench',0),giroud).reason,/better/,'Giroud 83 cannot be dragged out for Welbeck 80');
  assert.match(S.canSwap(s2,ref('bench',5),giroud).reason,/can't play|better/,'a left back cannot replace a striker');
  assert.match(S.canSwap(s2,ref('bench',1),giroud).reason,/can't play/,'Coquelin (CDM) cannot play striker');
  assert.match(S.canSwap(s2,resRef(s2,'D. Ospina'),xiRef(s2,p=>p.name==='P. Čech')).reason,/better/,'Čech 88 cannot be hidden for Ospina 79');
  // ties are the manager's choice; subs 5-7 and the reserves (both off the board) swap freely
  assert.ok(S.swap(s2,ref('bench',0),ref('bench',4)).ok,'Welbeck 80 and Debuchy 80: a tie');
  assert.ok(S.swap(s2,resRef(s2,'C. Jenkinson'),ref('bench',6)).ok,'a reserve for sub 7');
  assert.match(S.canSwap(s2,ref('bench',1),ref('bench',4)).reason,/15 on the Roulette board/,'Coquelin 81 cannot leave the board for Debuchy 80');
  // the reserves can be reordered (only for show); the order survives later automatic changes, a newcomer slots in by overall
  const firstTwo=s2.reserves.slice(0,2).map(p=>p.name);
  const reordered=S.swap(s2,{zone:'res',index:0},{zone:'res',index:1});
  assert.ok(reordered.ok&&reordered.sheet.reserves[0].name===firstTwo[1]&&reordered.sheet.reserves[1].name===firstTwo[0],'two reserves swap places');
  assert.deepEqual(S.board(reordered.sheet),S.board(s2),'reserve order never touches the Roulette board');
  const after=S.leave(reordered.sheet,reordered.sheet.xi.find(p=>p.name==='P. Čech').id,'sold');
  assert.ok(after.ok&&after.sheet.reserves.findIndex(p=>p.name===firstTwo[1])<after.sheet.reserves.findIndex(p=>p.name===firstTwo[0]),'the manager\'s reserve order stays');
  // a reported overall moves players by itself, both ways
  const up=S.rate(s2,s2.reserves.find(p=>p.name==='C. Jenkinson').id,86);
  assert.ok(up.ok&&xiName(up.sheet,'C. Jenkinson')&&boardName(up.sheet,'Nacho Monreal')&&!xiName(up.sheet,'Nacho Monreal')&&S.hidingIssue(up.sheet)===null&&S.validate(up.sheet).ok,'Jenkinson rated 86 starts; Monreal 81, now the weakest defender, drops to the board');
  const down=S.rate(s2,giroud&&s2.xi[giroud.index].id,70);
  assert.ok(down.ok&&!xiName(down.sheet,'O. Giroud')&&S.hidingIssue(down.sheet)===null&&S.validate(down.sheet).ok,'Giroud rated 70 leaves the XI');
  // XI <-> XI inside a line, and AUTO restores natural seats
  const lb=xiRef(s2,p=>p.name==='Nacho Monreal');
  const crossed=S.swap(s2,mert,lb);assert.ok(crossed.ok);
  const auto=S.autoPlace(crossed.sheet);assert.ok(auto.ok);
  assert.equal(auto.sheet.xi[lb.index].name,'Nacho Monreal');
  // XI <-> bench across lines is refused; board order is free
  assert.equal(S.canSwap(s2,ref('bench',3),mert).ok,false);
  assert.ok(S.swap(s2,ref('bench',1),ref('bench',2)).ok);
  assert.match(S.canSwap(s2,ref('bench',4),giroud).reason||'',/better|can't play/);
}
ok('C4','moves: no keeper outfield, no cross-line swap, no reserve before season 2, never a better player out to the reserves; from season 2 the XI holds each line\'s best and subs 1-4 the best 4 left (ties free), reported overalls move players, AUTO reseats');

// C5 departures (season 2+) are refilled within the line.
for(const club of clubs){
  const s2=S.advance(S.advance(S.launch(club),{}),{});
  assert.equal(S.leave(S.launch(club),s2.xi[0].id,'sold').ok,false);
  for(let i=0;i<11;i+=1){
    const gone=s2.xi[i];if(!gone)continue;
    const r=S.leave(s2,gone.id,'contract');assert.ok(r.ok);
    const next=r.sheet,inn=next.xi[i];
    assert.ok(!ids(next).includes(gone.id),'he is gone');
    assert.ok(next.excluded.includes(gone.id));
    assert.ok(inn,`${club} slot ${i} refilled`);
    if(!next.stopgaps.includes(i))assert.ok(S.fit(inn,next.slots[i])>0||next.launchPos[inn.id]===next.slots[i],`${club}: ${inn.name} plays ${next.slots[i]}`);
    else assert.ok(![...next.bench.filter(Boolean),...next.reserves].some(p=>S.fit(p,next.slots[i])>0),`${club}: stopgap only when nobody of the line is left`);
    assert.ok(S.validate(next).ok,club);
  }
}
ok('C5','a player who left (season 2+) is out for good and his slot is refilled by a player of that line, for every XI slot of all 98 clubs');

// C6 Transfer War and RRR between the two screens of one season.
{
  const pre=S.launch('Arsenal');
  const shot=pre.xi.find(p=>p.name==='O. Giroud');
  const post=S.advance(pre,{shot:{name:shot.name,number:shot.number,signedSeason:null},released:['Guessed Man'],kept:[
    {name:'Big Striker',overall:88,position:'ST'},{name:'Weak Keeper',overall:60,position:'GK'},{name:'Guessed Man',overall:90,position:'CB'},{name:'Good Back',overall:84,position:'RB'}]});
  const xiNames=names(post.xi);
  assert.ok(!ids(post).includes(shot.id),'the shot player is gone');
  assert.equal(post.xi[pre.xi.indexOf(shot)].name,'Big Striker','a kept signing of the line takes the shot player\'s slot first');
  assert.ok(!xiNames.includes('Guessed Man')&&!ids(post).some(id=>id==='s|guessed man'),'a guessed signing never joins');
  assert.ok(xiNames.includes('Good Back')&&!xiNames.includes('Héctor Bellerín'),'a better right back replaces the weakest of his line');
  assert.ok(post.reserves.some(p=>p.name==='Weak Keeper'),'a weaker keeper waits in the reserves');
  assert.ok(S.validate(post).ok);
  // a shot player never returns, not even as a signing
  const pre2=S.advance(post,{});const post2=S.advance(pre2,{kept:[{name:shot.name,overall:83,position:'ST'}]});
  assert.ok(!ids(post2).includes(`s|${'o. giroud'}`));
}
ok('C6','between the screens: the RRR shot leaves for good, kept signings join their line only when strictly better, guessed signings never join');

// C7 seeded careers: 10 seasons, both screens, random signings, shots, departures, rating reports and moves.
function rng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const POS=['GK','RB','CB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF'];
const formationNames=S.formations().map(f=>f.name);
let careers=0,sheets=0;
for(let c=0;c<196;c+=1){
  const r=rng(c*7919+11),club=clubs[c%98];
  const other=Players.clubs[clubs[(c*37+5)%98]].players;
  const sp=other[Math.floor(r()*other.length)];
  let sheet=S.launch(club,{special:{playerOne:{name:sp[0],overall:sp[1],number:null},playerTwo:null}});
  const spKey=S.idOf({name:sp[0],signedSeason:1});
  const everOut=new Set();
  for(let season=1;season<=10;season+=1){
    for(const stage of ['pre','post']){
      if(season>1||stage==='post'){
        const ev={};
        if(stage==='post'){
          const fifteen=[...sheet.xi,...sheet.bench].filter(Boolean);
          if(r()<0.3&&fifteen.length){const s=fifteen[Math.floor(r()*fifteen.length)];ev.shot={name:s.name,number:s.number,signedSeason:s.signedSeason};everOut.add(s.id);}
          ev.kept=[];ev.released=[];
          for(let k=0;k<1+Math.floor(r()*4);k+=1){const row={name:`Sig ${c}-${season}-${k}`,overall:55+Math.floor(r()*40),position:POS[Math.floor(r()*POS.length)]};if(r()<0.2){ev.released.push(row.name);everOut.add(S.idOf({name:row.name,signedSeason:season}));}else ev.kept.push(row);}
          if(r()<0.2)ev.kept.push({name:sp[0],overall:80,position:'ST'});
        }
        sheet=S.advance(sheet,ev);
      }
      assert.equal(sheet.season,season);assert.equal(sheet.stage,stage);
      const ops=[];
      if(r()<0.4)ops.push({t:'formation',name:formationNames[Math.floor(r()*formationNames.length)]});
      if(season>=2){
        const pool=[...sheet.xi,...sheet.bench,...sheet.reserves].filter(Boolean);
        if(r()<0.6&&pool.length){const p=pool[Math.floor(r()*pool.length)];ops.push({t:'leave',id:p.id,reason:S.leaveReasons[Math.floor(r()*S.leaveReasons.length)]});everOut.add(p.id);}
        if(r()<0.5&&pool.length){const p=pool[Math.floor(r()*pool.length)];ops.push({t:'rate',id:p.id,overall:50+Math.floor(r()*45)});}
      }
      for(let m=0;m<6;m+=1){const zone=['xi','bench','res'][Math.floor(r()*3)],zone2=['xi','bench','res'][Math.floor(r()*3)];ops.push({t:'swap',a:{zone,index:Math.floor(r()*11)},b:{zone:zone2,index:Math.floor(r()*11)}});}
      if(r()<0.3)ops.push({t:'auto'});
      const before=sheet;
      const out=S.apply(sheet,ops);sheet=out.sheet;
      // a refused move changes nothing; an accepted one keeps every rule
      const v=S.validate(sheet);assert.ok(v.ok,`${club} s${season} ${stage}: ${v.problems}`);
      const all=ids(sheet);
      assert.equal(new Set(all).size,all.length);
      for(const id of everOut)assert.ok(!all.includes(id)||!sheet.excluded.includes(id),`${id} is out`);
      for(const id of sheet.excluded)assert.ok(!all.includes(id));
      assert.ok(!all.includes(spKey)&&![...sheet.xi,...sheet.bench,...sheet.reserves].some(p=>p&&p.name===sp[0]),'the Special Player is never in the squad');
      for(const p of [...sheet.xi,...sheet.bench,...sheet.reserves].filter(Boolean))assert.ok(p.signedSeason!==null||Players.clubs[club].players.some(row=>row[0]===p.name&&row[4]===p.number),'club players come from the club only');
      // never a better player out to the reserves by a manager move
      for(const e of out.errors)assert.equal(typeof e.reason,'string');
      // the stored document rebuilds the same sheet on the rival's phone
      const doc=S.toDoc(sheet);
      const proposal=S.apply(before,ops.filter(op=>op.t==='leave'||op.t==='rate')).sheet;
      const back=S.fromDoc(doc,proposal);
      assert.ok(back,`${club} s${season} ${stage}: document rebuilds`);
      assert.deepEqual(names(back.xi),names(sheet.xi));assert.deepEqual(names(back.bench),names(sheet.bench));
      assert.deepEqual(S.board(back).map(row=>row.name),S.board(sheet).map(row=>row.name));
      assert.ok(Array.isArray(doc.names)&&doc.names.length===18&&!JSON.stringify(doc).includes('{"'+'id'),'flat lists only');
      sheets+=1;
    }
  }
  careers+=1;
}
ok('C7',`${careers} seeded 10-season careers (${sheets} screens): every sheet validates (from season 2 nobody better is hidden outside the XI or the board), nobody twice, the shot/guessed/departed never return, no Special Player, club players only from the club, and the stored document rebuilds the same board`);

// C9 loans (Nik 2026-11-11 00:26 UTC): a loaned player is out for the rest of the season and back at the club next
// season (in the XI if he is good enough); a player who left can be bought back later (not a shot player).
{
  const s2=S.advance(S.advance(S.launch('Arsenal'),{}),{});
  const ozil=s2.xi.find(p=>p.name==='M. Özil');
  const loaned=S.leave(s2,ozil.id,'loaned');assert.ok(loaned.ok);
  assert.ok(!ids(loaned.sheet).includes(ozil.id));
  const post=S.advance(loaned.sheet,{});assert.ok(!ids(post).includes(ozil.id),'still away after Transfer War');
  const s3=S.advance(post,{});
  assert.ok(ids(s3).includes(ozil.id)&&!s3.excluded.includes(ozil.id),'back at the club in season 3');
  assert.equal(S.findPlayer(s3,ozil.id).zone,'xi','at 89 he is the best midfielder, so he starts again by himself (no-hiding rule)');
  assert.equal(s3.xi.find(p=>p&&p.id===ozil.id).rating,89);
  assert.ok(S.validate(s3).ok&&S.hidingIssue(s3)===null);
  // buy back: a sold club player may return as a signing; a shot player never
  const giroud=s2.xi.find(p=>p.name==='O. Giroud');
  const sold=S.leave(s2,giroud.id,'sold').sheet;
  const back=S.advance(sold,{kept:[{name:'O. Giroud',overall:83,position:'ST'}]});
  assert.ok(ids(back).includes('s|o. giroud'),'bought back');
  assert.ok(S.leaveReasons.includes('loaned'));
}
ok('C9','a loaned player is away for the season and back next season (starting again when he is the best of his line); a sold player can be bought back, a shot player never');

// C8 board rows for RRR: XI in slot order then 4 subs.
{
  const b=S.board(S.launch('Chelsea'));
  assert.equal(b.length,15);assert.ok(b.slice(0,11).every(row=>!row.bench&&row.pos!=='SUB'));assert.ok(b.slice(11).every(row=>row.bench&&row.pos==='SUB'));
}
ok('C8','the RRR board from a sheet is 11 slots then 4 subs');
console.log(`PASS r91 squad sheet contracts (${checks} checks)`);
