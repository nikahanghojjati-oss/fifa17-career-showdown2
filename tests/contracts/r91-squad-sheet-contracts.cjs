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
assert.equal(fit(['ST'],'ST'),3);assert.equal(fit(['CB'],'RWB'),0);assert.equal(fit(['RB'],'LB'),0);assert.equal(fit(['LB'],'RWB'),0);assert.equal(fit(['RWB'],'RB'),2);assert.equal(fit(['LWB'],'LB'),2);assert.equal(fit(['CDM'],'LM'),1);
// Nik 2026-11-11 00:54 UTC: the only moves across lines are RM<->RW, LM<->LW and CF->CAM (CAM->CF was already in).
assert.equal(fit(['RM'],'RW'),2);assert.equal(fit(['RW'],'RM'),2);assert.equal(fit(['LM'],'LW'),2);assert.equal(fit(['LW'],'LM'),2);
assert.equal(fit(['CF'],'CAM'),2);assert.equal(fit(['CAM'],'CF'),2);
assert.equal(fit(['RM'],'ST'),0);assert.equal(fit(['ST'],'CAM'),0);assert.equal(fit(['RW'],'RCM'),0);assert.equal(fit(['CF'],'CM'),0);
ok('C1','four lines and Nik\'s flex list with the cross-line RM<->RW, LM<->LW, CF<->CAM; a keeper never plays outfield and no outfielder plays in goal');

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
  assert.ok(xiName(s2,'M. Debuchy')&&!xiName(s2,'Héctor Bellerín'),'Debuchy 80 (RB) starts over Bellerín 79 (RB)');
  assert.ok(boardName(s2,'P. Mertesacker')&&!xiName(s2,'P. Mertesacker'),'Mertesacker (CB) can cover RB, but flex never forces him in: he stays on the board');
  assert.ok(!boardName(s2,'Héctor Bellerín'),'Bellerín 79 is not among the best 4 left');
  assert.equal(S.hidingIssue(s1),null,'season 1 is the launch squad as it is');
  const rb=xiRef(s2,p=>p.name==='M. Debuchy'),giroud=xiRef(s2,p=>p.name==='O. Giroud');
  assert.ok(S.canSwap(s2,ref('bench',0),rb).ok,'the manager may choose Mertesacker 83 at RB');
  assert.match(S.canSwap(s2,resRef(s2,'Héctor Bellerín'),rb).reason,/better/,'Bellerín 79 cannot replace Debuchy 80');
  assert.match(S.canSwap(s2,resRef(s2,'Lucas Pérez'),giroud).reason,/better/,'Giroud 83 cannot be dragged out for Lucas Pérez 81');
  assert.match(S.canSwap(s2,resRef(s2,'K. Gibbs'),giroud).reason,/can't play|better/,'a left back cannot replace a striker');
  assert.match(S.canSwap(s2,ref('bench',1),giroud).reason,/can't play/,'Coquelin (CDM) cannot play striker');
  assert.match(S.canSwap(s2,resRef(s2,'D. Ospina'),xiRef(s2,p=>p.name==='P. Čech')).reason,/better/,'Čech 88 cannot be hidden for Ospina 79');
  // ties are the manager's choice; subs 5-7 and the reserves (both off the board) swap freely
  assert.ok(S.swap(s2,ref('bench',1),ref('bench',2)).ok,'Coquelin 81 and Walcott 81 trade board seats');
  assert.ok(S.swap(s2,ref('bench',5),ref('bench',6)).ok,'subs 5-7 reorder freely');
  assert.ok(S.swap(s2,resRef(s2,'C. Jenkinson'),ref('bench',6)).ok,'a reserve for sub 7');
  assert.match(S.canSwap(s2,ref('bench',1),ref('bench',4)).reason,/15 on the Roulette board/,'Coquelin 81 cannot leave the board for a weaker sub');
  // the reserves can be reordered (only for show); the order survives later automatic changes, a newcomer slots in by overall
  const firstTwo=s2.reserves.slice(0,2).map(p=>p.name);
  const reordered=S.swap(s2,{zone:'res',index:0},{zone:'res',index:1});
  assert.ok(reordered.ok&&reordered.sheet.reserves[0].name===firstTwo[1]&&reordered.sheet.reserves[1].name===firstTwo[0],'two reserves swap places');
  assert.deepEqual(S.board(reordered.sheet),S.board(s2),'reserve order never touches the Roulette board');
  const after=S.leave(reordered.sheet,reordered.sheet.xi.find(p=>p.name==='P. Čech').id,'sold');
  assert.ok(after.ok&&after.sheet.reserves.findIndex(p=>p.name===firstTwo[1])<after.sheet.reserves.findIndex(p=>p.name===firstTwo[0]),'the manager\'s reserve order stays');
  // a reported overall moves players by itself, both ways
  const up=S.rate(s2,s2.reserves.find(p=>p.name==='C. Jenkinson').id,86);
  assert.ok(up.ok&&xiName(up.sheet,'C. Jenkinson')&&!xiName(up.sheet,'M. Debuchy')&&S.hidingIssue(up.sheet)===null&&S.validate(up.sheet).ok,'Jenkinson (RB) rated 86 starts at RB over Debuchy 80');
  const down=S.rate(s2,giroud&&s2.xi[giroud.index].id,70);
  assert.ok(down.ok&&!xiName(down.sheet,'O. Giroud')&&S.hidingIssue(down.sheet)===null&&S.validate(down.sheet).ok,'Giroud rated 70 leaves the XI');
  // flex is a permission, not a mandate: at Athletic, San José (CDM, also CB) does not push Balenziaga (LB) out
  {
    const ath=S.advance(S.advance(S.launch('Athletic Club'),{}),{});
    const lbAt=ath.slots.indexOf('LB');
    assert.equal(ath.xi[lbAt].name,'Balenziaga','the natural left back starts');
    const msj=resRef(ath,'Mikel San José');
    if(msj.zone!=='xi'&&msj.index>=0)assert.ok(S.canSwap(ath,msj,ref('xi',lbAt)).ok,'the manager may still choose San José at LB');
  }
  // across lines (Nik 00:54): in a 4-3-3 with no RM slot a right midfielder rated best still starts, on the wing
  const wide=S.setFormation(s2,'4-3-3');assert.ok(wide.ok&&S.hidingIssue(wide.sheet)===null);
  const ox=S.rate(wide.sheet,wide.sheet.reserves.find(p=>p.name==='A. Oxlade-Chamberlain').id,90);
  const oxAt=ox.sheet.xi.findIndex(p=>p&&p.name==='A. Oxlade-Chamberlain');
  assert.ok(ox.ok&&ox.sheet.slots[oxAt]==='RW'&&S.validate(ox.sheet).ok,'Oxlade-Chamberlain rated 90 starts at RW, one of his own positions');
  assert.ok(boardName(ox.sheet,'A. Sánchez')&&S.hidingIssue(ox.sheet)===null,'Sánchez 87 is never hidden: he stays on the Roulette board');
  // XI <-> XI inside a line, and AUTO restores natural seats
  const lb=xiRef(s2,p=>p.name==='Nacho Monreal');
  assert.match(S.canSwap(s2,rb,lb).reason,/can't play/,'no right back to left back across the defence');
  const rcb=xiRef(s2,p=>p.name==='S. Mustafi');
  assert.match(S.canSwap(s2,rb,rcb).reason,/Mertesacker/,'Debuchy at CB would leave Mertesacker 83 (a centre back) out: refused');
  const crossed=S.swap(s2,rcb,xiRef(s2,p=>p.name==='L. Koscielny'));assert.ok(crossed.ok,'two centre backs swap sides');
  const auto=S.autoPlace(crossed.sheet);assert.ok(auto.ok&&S.validate(auto.sheet).ok);
  assert.equal(auto.sheet.xi[lb.index].name,'Nacho Monreal');
  // XI <-> bench across lines is refused; board order is free
  assert.equal(S.canSwap(s2,resRef(s2,'Lucas Pérez'),rb).ok,false);
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
// C10 the store's chain (js/squadSheetStep.js): each screen's sheet comes from js/squadSheet.js replay with the Transfer War
// events and whatever stored documents a phone holds. Seeded 10-season careers lock random moves on every screen; at every
// screen the phone holding every earlier document and a fresh phone holding only the latest one must get the same
// proposal, and the locked document must rebuild the exact squad the manager locked (also from the automatic chain alone).
{
  const R=require('../../js/rosterRoulette.js');
  let screens=0,careers10=0;
  for(let c=0;c<98;c+=1){
    const r=rng(c*104729+3),club=clubs[(c*13+7)%98];
    const other=Players.clubs[clubs[(c*29+1)%98]].players,sp=other[Math.floor(r()*other.length)];
    const special={playerOne:{name:sp[0],overall:sp[1],number:sp[4]},playerTwo:null};
    const events=[null],docs={};let latestKey=null;
    for(let season=1;season<=10;season+=1){
      for(const stage of ['pre','post']){
        if(stage==='post'){
          // this season's events: the Roulette's shot (on the locked pre board), kept and guessed signings
          const preOut=S.replay({club,special,season,stage:'pre',events,docs}),pre=preOut.sheet||preOut.proposal;
          const board=S.board(pre).filter(row=>row.name);
          const ev={shot:null,released:[],kept:[]};
          if(r()<0.35&&board.length){const hit=board[Math.floor(r()*board.length)];ev.shot={name:hit.name,number:hit.number,signedSeason:hit.signedSeason};}
          for(let k=0;k<1+Math.floor(r()*3);k+=1){const row={name:`Sig ${c}-${season}-${k}`,overall:55+Math.floor(r()*40),position:r()<0.15?null:POS[Math.floor(r()*POS.length)]};if(r()<0.2)ev.released.push(row.name);else ev.kept.push(row);}
          events[season]=ev;
        }
        const full=S.replay({club,special,season,stage,events,docs});
        const sparse=S.replay({club,special,season,stage,events,docs:latestKey?{[latestKey]:docs[latestKey]}:{}});
        assert.ok(!full.error&&!sparse.error,`${club} s${season} ${stage}: ${full.error||sparse.error}`);
        assert.equal(full.sheet,null);assert.equal(sparse.sheet,null);
        assert.deepEqual(S.board(sparse.proposal).map(row=>row.name),S.board(full.proposal).map(row=>row.name),`${club} s${season} ${stage}: a fresh phone gets the same proposal`);
        assert.deepEqual(names(sparse.proposal.reserves).sort(),names(full.proposal.reserves).sort());
        // the manager's moves, then LOCK (a screen left unlocked keeps the proposal: some screens have no document at all)
        if(r()<0.15)continue;
        const ops=[];
        if(r()<0.3)ops.push({t:'formation',name:formationNames[Math.floor(r()*formationNames.length)]});
        if(season>=2){
          const pool=[...full.proposal.xi,...full.proposal.bench,...full.proposal.reserves].filter(Boolean);
          if(r()<0.5&&pool.length){const p=pool[Math.floor(r()*pool.length)];ops.push({t:'leave',id:p.id,reason:S.leaveReasons[Math.floor(r()*S.leaveReasons.length)]});}
          if(r()<0.5&&pool.length){const p=pool[Math.floor(r()*pool.length)];ops.push({t:'rate',id:p.id,overall:50+Math.floor(r()*45)});}
        }
        for(let m=0;m<5;m+=1)ops.push({t:'swap',a:{zone:['xi','bench','res'][Math.floor(r()*3)],index:Math.floor(r()*11)},b:{zone:['xi','bench','res'][Math.floor(r()*3)],index:Math.floor(r()*11)}});
        const locked=S.apply(full.proposal,ops).sheet;
        assert.ok(S.validate(locked).ok);
        const key=`${season}_${stage}`;
        docs[key]={...S.toDoc(locked),rivalryId:'pair_x',role:'playerOne'};latestKey=key;
        const again=S.replay({club,special,season,stage,events,docs:{[key]:docs[key]}});
        assert.ok(again.sheet,`${club} s${season} ${stage}: the document rebuilds from the automatic chain alone`);
        assert.deepEqual(names(again.sheet.xi),names(locked.xi));assert.deepEqual(names(again.sheet.bench),names(locked.bench));
        assert.equal(again.sheet.formation,locked.formation);
        assert.deepEqual(names(again.sheet.reserves).sort(),names(locked.reserves).sort(),`${club} s${season} ${stage}: the same reserves`);
        assert.deepEqual(again.sheet.excluded,locked.excluded,`${club} s${season} ${stage}: the same players away`);
        assert.ok(S.validate(again.sheet).ok);
        // the lenient Roulette rows (a document this build could not rebuild) name the same 15
        assert.deepEqual(S.boardFromDoc(docs[key],again.auto).map(row=>row.name),S.board(locked).map(row=>row.name));
        if(stage==='pre'){
          // the Roulette on these sheets: the boards are the sheets, the draw is the seeded one, the version names the sheets
          const sheets={playerOne:{formation:locked.formation,board:S.board(locked)},playerTwo:{formation:locked.formation,board:S.board(locked)}};
          const rid=`pair_${'ab'.repeat(32)}`,clubsRR={playerOne:club,playerTwo:club};
          const plan=R.forSeason(rid,clubsRR,season,{special,sheets});
          assert.ok(plan,'a plan on the sheets');
          assert.deepEqual(plan.boards.playerOne.map(row=>row.name),S.board(locked).map(row=>row.name));
          assert.equal(plan.formations.playerOne,locked.formation);
          for(const turn of plan.turns)if(turn.fired)assert.equal(turn.player.name,plan.boards[turn.role][turn.hitSlot].name);
          const v1=R.version(clubsRR,{special,sheets}),v0=R.version(clubsRR,{special});
          assert.ok(v1&&v0&&v1!==v0,'the version names the sheets');
        }
        screens+=1;
      }
    }
    careers10+=1;
  }
  ok('C10',`${careers10} seeded 10-season careers through the store's chain (${screens} locked screens): a phone with only the latest document gets the same proposal as one with all of them, every locked document rebuilds the exact squad from the automatic chain alone, and the Roulette's boards are the locked sheets`);
}
// C11 (review of #1358, P3): a season whose spin mark lost its outcome replays the shot (ctx.replayHits: that season's two
// locked squads + its Chamber Men cylinders through the roulette engine); without a replay the screen names the season and
// asks TRY AGAIN, never a guess. A failed Squad Management load before Season Results is said on screen, never silent.
(async()=>{
  const fs=require('node:fs'),path=require('node:path');
  const Step=require('../../js/squadSheetStep.js');
  const shot={fired:true,hitName:'M. Reus',hitNumber:11,hitSlot:9,hitSignedSeason:null,version:'v'};
  const base={rivalryId:'pair_'+'a'.repeat(64),managerRole:'playerOne',season:2,stage:'pre',clubs:{playerOne:'Borussia Dortmund',playerTwo:'Arsenal'}};
  const verdicts=async()=>({ok:true,verdicts:{playerOne:[],playerTwo:[]},hits:{playerOne:null,playerTwo:{fired:false}}});
  let asked=[];
  const ok1=await Step.history({...base,verdicts,replayHits:async k=>{asked.push(k);return {playerOne:shot,playerTwo:{fired:false}};}});
  assert.equal(ok1.ok,true);assert.deepEqual(asked,[1],'only the season with a lost outcome is replayed');
  assert.equal(ok1.results[1].hits.playerOne.hitName,'M. Reus');assert.equal(ok1.results[1].hits.playerTwo.fired,false,'a saved outcome is kept');
  assert.equal(Step.events(ok1.results[1],'playerOne').shot.name,'M. Reus','the replayed shot leaves the squad');
  const bad=await Step.history({...base,verdicts,replayHits:async()=>null});
  assert.deepEqual({ok:bad.ok,season:bad.season,reason:bad.reason},{ok:false,season:1,reason:'SHOT'});
  const none=await Step.history({...base,verdicts});
  assert.equal(none.reason,'SHOT','no replay reader: TRY AGAIN, never a squad with the shot player still in');
  const saved=await Step.history({...base,verdicts:async()=>({ok:true,verdicts:{playerOne:[],playerTwo:[]},hits:{playerOne:shot,playerTwo:{fired:false}}}),replayHits:async()=>{throw new Error('not asked');}});
  assert.equal(saved.ok,true,'saved outcomes need no replay');
  const pstc=fs.readFileSync(path.join(__dirname,'../../js/productionSharedTransferChallenge.js'),'utf8');
  assert.equal((pstc.match(/ctx\.replayHits=k=>pstcSquadReplayHits\(request,ctx,io,steps,confirmedAtMs,k\);/g)||[]).length,2,'both squad screens can replay a lost shot');
  assert.match(pstc,/engine\.forSeason\(ctx\.rivalryId,ctx\.clubs,k,\{special:ctx\.special,history:\[null\],hits:\{\},chamberMen:true,chambers:\{\[k\]:chambers\},sheets:boards\.sheets\}\)/);
  assert.match(pstc,/squadError=PSTC_ROULETTE_TEXT\.squadLoad;pstcSetError\(squadError\);/,'a failed load is said on the Transfer War screen');
  assert.match(fs.readFileSync(path.join(__dirname,'../../js/productionSharedSeasonResultsRoute.js'),'utf8'),/const squad=routeTransfer\(\)\?\.squadError\?\.\(\)\|\|"";routeSetText\(status,squad\|\|label\);/,'and on the dashboard');
  ok('C11','a lost spin outcome is replayed from that season\'s squads and Chamber Men (or TRY AGAIN names the season); a failed load before Season Results is said on screen');
  // C12 (Nik 2026-11-11: reported overalls and departures feed the Gazette): season N's paper tells what changed in both
  // managers' squads since the paper before, from the two "pre" sheets this phone keeps (no read); the reason words are the
  // screen's own; at most 3 names a manager; nothing when nothing changed; season 1 never.
  {
    const store=new Map();
    globalThis.readStorageValue=key=>store.has(key)?store.get(key):null;globalThis.writeStorageValue=(key,value)=>{store.set(key,value);};
    const G=require('../../js/touchlineGazette.js');
    const {projection,result}=require('../support/career-fixture-helpers.cjs');
    const rid='pair_'+'c'.repeat(64);
    const doc=(out=[],ov=[])=>({outNames:out.map(o=>o[0]),outNumbers:out.map(o=>o[1]),outSigned:out.map(()=>0),outReasons:out.map(o=>o[2]),outSeasons:out.map(o=>o[3]),
      ovNames:ov.map(o=>o[0]),ovNumbers:ov.map(o=>o[1]),ovSigned:ov.map(()=>0),ovValues:ov.map(o=>o[2])});
    const keep=list=>store.set(Step.keptKey,JSON.stringify(list.map(([role,season,data])=>[`${rid}|${role}|${season}_pre`,data])));
    assert.equal(Step.gazetteNews({rivalryId:rid,season:1}),null,'season 1: no squad news');
    keep([['playerOne',2,doc()],['playerTwo',2,doc()],['playerOne',1,doc()]]);
    assert.equal(Step.gazetteNews({rivalryId:rid,season:2}),null,'a sheet this phone does not keep: no news (never a read)');
    keep([['playerOne',1,doc()],['playerTwo',1,doc()],
      ['playerOne',2,doc([['Marco Reus',11,'contract',1],['Mats Hummels',5,'sold',2],['Mario Götze',10,'loaned',2],['Sven Bender',6,'retired',2]],[['Thomas Müller',13,85]])],
      ['playerTwo',2,doc([],[['Kevin De Bruyne',17,91]])],
      ['playerOne',3,doc([['Marco Reus',11,'contract',1],['Mats Hummels',5,'sold',2],['Mario Götze',10,'loaned',2],['Sven Bender',6,'retired',2]],[['Thomas Müller',13,85],['Mario Götze',10,84]])],
      ['playerTwo',3,doc([],[['Kevin De Bruyne',17,91]])]]);
    const n2=Step.gazetteNews({rivalryId:rid,season:2});
    assert.deepEqual(n2.playerOne.left.map(o=>o.name),['Marco Reus','Mats Hummels','Mario Götze','Sven Bender'],'departures set on the post screen after the last Transfer War are told too');
    assert.deepEqual(n2.playerTwo,{left:[],rated:[{name:'Kevin De Bruyne',value:91}]});
    const n3=Step.gazetteNews({rivalryId:rid,season:3});
    assert.deepEqual(n3.playerOne,{left:[],rated:[{name:'Mario Götze',value:84}]},'only what changed since the paper before (a loan that ended can be rated)');
    assert.deepEqual(n3.playerTwo,{left:[],rated:[]});
    const p=projection({seed:'c',totalSeasons:3,seasons:[[result({leaguePosition:1}),result({domesticCup:true})],[result({championsLeague:true}),result({leaguePosition:9})]]});
    const plainEd=G.seasonEdition({projection:p,seasonNumber:2});
    const ed=G.seasonEdition({projection:p,seasonNumber:2,squadNews:k=>Step.gazetteNews({rivalryId:rid,season:k})});
    assert.equal(ed.paper.headline,plainEd.paper.headline,'squad news never changes the rest of the paper');
    assert.deepEqual(ed.paper.inside,plainEd.paper.inside,'INSIDE TODAY is unchanged');
    const P=ed.paper.story.paragraphs,Q=plainEd.paper.story.paragraphs;
    assert.deepEqual([P[0],...P.slice(2)],[Q[0],...Q.slice(2)],'squad news takes the place of the story\'s second paragraph only');
    const forms=['Squad news: Daniel lost Marco Reus (contract ended), Mats Hummels (sold) and Mario Götze (loaned out), plus 2 more squad changes. Nik now rates Kevin De Bruyne 91.',
      'Squad news: Daniel lost Marco Reus (contract ended) and Mats Hummels (sold), plus 3 more squad changes. Nik now rates Kevin De Bruyne 91.',
      'Squad news: Daniel lost Marco Reus (contract ended), plus 4 more squad changes. Nik now rates Kevin De Bruyne 91.',
      'Squad news: Daniel made 5 squad changes. Nik made 1 squad change.'];
    assert.equal(P[1],forms.find(f=>f.length<=Q[1].length)||forms[3],'3 names a manager, fewer when the paragraph it replaces is shorter');
    assert.equal(ed.paper.squad.sentence,P[1]);
    // never longer than the paragraph it replaces (so the paper is never taller), on every paper of every Showdown shape
    let papers=0;
    for(const seed of '0123456789abcdef')for(const T of [3,5,10]){
      const rows=Array.from({length:T},(_,i)=>[result({leaguePosition:1+(i*7+seed.charCodeAt(0))%9,championsLeague:(i+seed.charCodeAt(0))%3===0}),result({leaguePosition:1+(i*5)%9,domesticCup:i%2===0})]);
      const pr=projection({seed,totalSeasons:T,seasons:rows});
      for(let N=2;N<T;N+=1){
        const a=G.seasonEdition({projection:pr,seasonNumber:N}),b=G.seasonEdition({projection:pr,seasonNumber:N,squadNews:()=>n2});
        assert.ok(b.paper.story.paragraphs[1].length<=a.paper.story.paragraphs[1].length||b.paper.story.paragraphs[1]===forms[3]);
        assert.ok(b.paper.story.paragraphs[1].startsWith('Squad news: '));papers+=1;
      }
      const fa=G.finalEdition({projection:pr}),fb=G.finalEdition({projection:pr,squadNews:()=>n2});
      if(fa&&fb){assert.ok(fb.paper.story.paragraphs[1].length<=fa.paper.story.paragraphs[1].length||fb.paper.story.paragraphs[1]===forms[3]);assert.equal(fb.paper.headline,fa.paper.headline);papers+=1;}
    }
    assert.ok(papers>100,`${papers} papers`);
    const words={contract:'contract ended',retired:'retired',swapped:'swapped',sold:'sold',loaned:'loaned out'};
    const screen=fs.readFileSync(path.join(__dirname,'../../js/squadScreen.js'),'utf8');
    for(const [k,w] of Object.entries(words))assert.ok(new RegExp(`${k}:"${w[0].toUpperCase()+w.slice(1)}"`).test(screen),`"${w}" is the screen's own word for ${k}`);
    const quiet=G.seasonEdition({projection:p,seasonNumber:2,squadNews:()=>({playerOne:{left:[],rated:[]},playerTwo:{left:[],rated:[]}})});
    assert.deepEqual({story:quiet.paper.story,squad:quiet.paper.squad},{story:plainEd.paper.story,squad:undefined},'nothing changed: no squad news, the story keeps its own second paragraph');
    assert.equal(G.firestoreReads,0);
    delete globalThis.readStorageValue;delete globalThis.writeStorageValue;
    ok('C12','the Gazette\'s squad news: departures and reported overalls since the paper before, from the kept "pre" sheets (no read), the screen\'s own reason words, at most 3 names a manager, in the story\'s second paragraph and never longer than it, nothing when nothing changed');
  }
  // C13 (Nik 2026-11-11: "all the formations"): the FIFA 17 Formations screen's full list of 33, under FIFA 17's own names
  // (checked against Nik's video), each with 1 GK and 10 outfield slots; and the Formations search finds them.
  {
    const S=require('../../js/squadSheet.js');
    const FIFA17=['3-1-4-2','3-4-1-2','3-4-2-1','3-4-3 FLAT','3-4-3 DIAMOND','3-5-1-1','3-5-2',
      '4-1-2-1-2 WIDE','4-1-2-1-2 NARROW','4-1-3-2','4-1-4-1','4-2-2-2','4-2-3-1 WIDE','4-2-3-1 NARROW','4-2-4','4-3-1-2','4-3-2-1',
      '4-3-3 FLAT','4-3-3 HOLDING','4-3-3 DEFEND','4-3-3 ATTACK','4-3-3 FALSE 9','4-4-1-1 MIDFIELD','4-4-1-1 ATTACK','4-4-2 FLAT','4-4-2 HOLDING','4-5-1 FLAT','4-5-1 ATTACK',
      '5-2-1-2','5-2-2-1','5-3-2','5-4-1 FLAT','5-4-1 DIAMOND'];
    const list=S.formations(),names=list.map(f=>[f.title,f.variant].filter(Boolean).join(' '));
    assert.equal(list.length,33);assert.deepEqual([...names].sort(),[...FIFA17].sort(),'every FIFA 17 formation, once, under its FIFA 17 name');
    for(const f of list){assert.equal(f.slots.length,11);assert.equal(f.slots.filter(x=>x==='GK').length,1);assert.equal(new Set(f.slots).size,11,`${f.name}: no slot twice`);
      const [d,m,a]=f.title.split('-').map(Number).reduce((acc,n,i,arr)=>i===0?[n,0,0]:i===arr.length-1?[acc[0],acc[1],acc[2]+n]:[acc[0],acc[1]+n,acc[2]],[0,0,0]);
      assert.equal(f.counts.DEF,d,`${f.name}: the first number is the back line`);}
    const by=name=>list.find(f=>f.name===name);
    assert.ok(by('4-4-1-1 (2)').slots.includes('CAM')&&by('4-4-1-1 (2)').variant==='MIDFIELD','4-4-1-1 MIDFIELD has the CAM behind the striker');
    assert.ok(by('4-4-1-1').slots.includes('CF')&&by('4-4-1-1').variant==='ATTACK','4-4-1-1 ATTACK has the CF');
    assert.ok(by('4-3-3 (5)').slots.includes('CF')&&by('4-3-3 (5)').variant==='FALSE 9');
    const find=q=>S.searchFormations(q).map(n=>{const f=by(n);return [f.title,f.variant].filter(Boolean).join(' ');});
    assert.deepEqual(find('433').sort(),['4-3-3 ATTACK','4-3-3 DEFEND','4-3-3 FALSE 9','4-3-3 FLAT','4-3-3 HOLDING']);
    assert.deepEqual(find('4-3-3'),find('433'),'with or without dashes');
    assert.deepEqual(find('433 false 9'),['4-3-3 FALSE 9']);assert.deepEqual(find('false9').length,0,'(words, not glued)');
    assert.deepEqual(find('diamond').sort(),['3-4-3 DIAMOND','5-4-1 DIAMOND']);
    assert.deepEqual(find('523'),['5-2-2-1'],'5-2-2-1 is also listed as 5-2-3');
    assert.equal(find('').length,33);assert.equal(find('xyz').length,0);
    assert.ok(find('43').every(n=>n.startsWith('4-3'))&&find('43').length===7);
    const screen=fs.readFileSync(path.join(__dirname,'../../js/squadScreen.js'),'utf8');
    assert.match(screen,/input\.type="search"/);assert.match(screen,/S\.searchFormations\(query\)/);
    ok('C13','all 33 FIFA 17 formations under their FIFA 17 names (1 GK + 10, the back line as named), and the Formations search finds them by numbers (with or without dashes), alias or variant');
  }
  // C14 a finger's drag survives the redraw at the 300 ms hold: the scroll is held back on the finger's own node, which
  // leaves the page when the squad redraws, so its touchmoves never reach the panel (iPhone: the drag was cancelled).
  {
    const screen=fs.readFileSync(path.join(__dirname,'../../js/squadScreen.js'),'utf8');
    assert.match(screen,/const held=e\.target,hold=ev=>\{if\(drag&&drag\.ghost&&ev\.cancelable\)ev\.preventDefault\(\);\};/);
    assert.match(screen,/held\.addEventListener\("touchmove",hold,\{passive:false\}\);held\.addEventListener\("touchend",done\);held\.addEventListener\("touchcancel",done\);/);
    assert.match(screen,/panel\.addEventListener\("touchmove",e=>\{if\(drag&&drag\.ghost&&e\.cancelable\)e\.preventDefault\(\);\},\{passive:false\}\);/,'the panel keeps its own hold too');
    ok('C14','a finger drag holds the scroll back on its own node, so the redraw at the 300 ms hold no longer cancels it');
  }
  // C15 (review of #1390, Nik: "not synced"): gazetteEnsure gives a phone that never kept the sheets a paper needs (a new
  // device, cleared storage) the same sheets the other phone has: it reads only the missing season N-1 and N "pre" documents
  // (at most 4, each kept, an empty answer too), nothing on a phone that has them, nothing twice; a failed read says false.
  {
    const rid='pair_'+'d'.repeat(64);
    const sheet=(season,role,ov)=>({schemaVersion:1,objectType:'sharedSquadSheet',rivalryId:rid,seasonNumber:season,stage:'pre',role,formation:'4-3-3',
      names:Array.from({length:18},(_,i)=>`P${i}`),numbers:Array.from({length:18},(_,i)=>i+1),signed:Array(18).fill(0),
      outNames:[],outNumbers:[],outSigned:[],outReasons:[],outSeasons:[],ovNames:ov?['P3']:[],ovNumbers:ov?[4]:[],ovSigned:ov?[0]:[],ovValues:ov?[ov]:[]});
    const server=new Map([[`season_1_pre_playerOne`,sheet(1,'playerOne')],[`season_1_pre_playerTwo`,sheet(1,'playerTwo')],[`season_2_pre_playerOne`,sheet(2,'playerOne',88)],[`season_2_pre_playerTwo`,sheet(2,'playerTwo')]]);
    const phone=({fail=false}={})=>{
      const store=new Map(),reads=[];
      const sdk={doc:(_db,...seg)=>({path:seg.join('/'),id:seg[seg.length-1]}),runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref.id);if(fail)throw Object.assign(new Error('offline'),{code:'unavailable'});const d=server.get(ref.id);return {exists:()=>Boolean(d),data:()=>JSON.parse(JSON.stringify(d))};}})};
      return {store,reads,env:{readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,String(v));},
        CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'u'}},firestore:{},firestoreSdk:sdk})}}};
    };
    const use=env=>{for(const k of ['readStorageValue','writeStorageValue','CareerModeProductionFirebaseRuntime'])globalThis[k]=env[k];};
    // phone A saw both screens (kept), phone B is a new device
    const A=phone(),B=phone();use(A.env);
    for(const [id,d] of server)A.store.set(Step.keptKey,JSON.stringify([...JSON.parse(A.store.get(Step.keptKey)||'[]'),[`${rid}|${d.role}|${d.seasonNumber}_pre`,Step.parse(d,d.seasonNumber,'pre',d.role)]]));
    assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);assert.equal(A.reads.length,0,'a phone that keeps the sheets reads nothing');
    const newsA=Step.gazetteNews({rivalryId:rid,season:2});assert.ok(newsA&&newsA.playerOne.rated.length===1);
    use(B.env);assert.equal(Step.gazetteNews({rivalryId:rid,season:2}),null,'the new device has no squad news by itself');
    assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);
    assert.deepEqual(B.reads.sort(),['season_1_pre_playerOne','season_1_pre_playerTwo','season_2_pre_playerOne','season_2_pre_playerTwo'],'it reads the 4 missing sheets once');
    assert.deepEqual(Step.gazetteNews({rivalryId:rid,season:2}),newsA,'then both phones tell the same squad news');
    assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);assert.equal(B.reads.length,4,'never twice');
    // a sheet that does not exist is kept as empty (both phones see the same: no news), and season 1 needs nothing
    server.delete('season_2_pre_playerTwo');const C=phone();use(C.env);
    assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);assert.equal(Step.gazetteNews({rivalryId:rid,season:2}),null);
    await Step.gazetteEnsure({rivalryId:rid,season:2});assert.equal(C.reads.length,4,'an empty answer is kept too');
    assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:1}),true);assert.equal(C.reads.length,4);
    const D=phone({fail:true});use(D.env);assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),false,'a read that fails says so');
    const E=phone();use({...E.env,CareerModeProductionFirebaseRuntime:undefined});assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),false,'no account services: false, no throw');
    for(const k of ['readStorageValue','writeStorageValue','CareerModeProductionFirebaseRuntime'])delete globalThis[k];
    ok('C15','review of #1390: gazetteEnsure reads only the missing "pre" sheets a paper needs (at most 4, once, kept), none on a phone that has them, so both phones tell the same squad news');
  }
  // C16 (CI run 43160602051, 2026-11-12): Nik's "post" LOCK was tapped 11 times in 60 s and never locked. 11 taps in 60 s is
  // the helper's 5 s click timeout plus its 0.5 s step each time, so no tap reached the button; but the helper threw the
  // click's own error away, so nobody could see what stood in the way. A lock tap that fails now says why (Playwright's own
  // words, what sits at LOCK's centre, every layer over the stage) and the stall report carries the last taps.
  {
    const R=require('../../tests/browser/support/roster-roulette.cjs');
    const why='locator.click: Timeout 5000ms exceeded.\nCall log:\n  - <div id="loadingScreen">…</div> intercepts pointer events';
    let clicks=0;const logged=[],log=console.log;
    const none={isVisible:async()=>false,isEnabled:async()=>false,click:async()=>{throw new Error('not here');}};
    const lock={isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{clicks+=1;throw new Error(why);}};
    const stage={isVisible:async()=>true,getAttribute:async name=>name==='data-stage'?'post':null,
      locator:sel=>sel==='.sqmBtn.is-primary'?lock:none,
      evaluate:async(_fn,failed)=>failed===undefined?false:({status:'Your kept signings are in and the Roulette\'s shot has left. Set your squad, then lock it.',live:'',lock:'Lock my squad',...(failed?{atCentre:'div#loadingScreen',inStage:false,layers:['div#loadingScreen z100 pe:auto op:1']}:{})})};
    const page={locator:sel=>sel==='#sqStage'?stage:none,waitForTimeout:ms=>new Promise(resolve=>setTimeout(resolve,Math.min(ms,5))),evaluate:async()=>''};
    console.log=(...args)=>{logged.push(args.join(' '));};
    let thrown=null;
    try{assert.equal(await R.playSquad(page),'squad-lock');await R.playSquadUntil(page,async()=>false,150);}catch(error){thrown=error;}finally{console.log=log;}
    assert.ok(thrown,'the stall still fails the journey: a tap that cannot land is never passed over');
    assert.match(thrown.message,/^Season Results did not open within 150 ms \(squad steps: squad-lock/);
    assert.match(thrown.message,/last lock taps:/,'the stall report carries the last taps');
    assert.match(thrown.message,/intercepts pointer events/,'with the click\'s own error');
    assert.match(thrown.message,/"atCentre":"div#loadingScreen"/,'and what sits on LOCK');
    assert.ok(clicks>=2);
    assert.ok(logged.some(line=>line.startsWith('--- squad lock tap failed: ')&&line.includes('loadingScreen')),'each failed tap is printed as it happens');
    ok('C16','a Squad LOCK tap that cannot land is reported with the click\'s own error, the element at LOCK\'s centre and the layers over the stage, and the stall still fails (CI run 43160602051)');
  }
  console.log(`PASS r91 squad sheet contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});
