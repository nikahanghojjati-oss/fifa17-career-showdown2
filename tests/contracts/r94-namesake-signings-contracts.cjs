'use strict';
// R94-04 (Astra A-TW-01, P1): two different players who share a name, both kept in the Transfer War, are two people in the
// squad. Before this fix js/squadSheet.js knew a signing by his folded name only ("s|name"), so Tottenham's M. Dembélé
// (162240, CM 82) and Celtic's M. Dembélé (211591, ST 71) both got KEEP but only the CM reached the XI, bench or reserves.
// Now the first man kept under a name keeps "s|name" (every squad before the fix reads as before) and a later man of that
// name with another SoFIFA playerId is "s|name#playerId". The same man (same id) signed again keeps SQ-2-03. Documents of an
// earlier build load as that build read them (tests/fixtures/r94-namesake/pre-fix-squad-docs.json, stored by gameplay/r93
// ce4d1317). No Rules change: the Rules hold the squad document's list lengths, not its values.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../..'),get=p=>require(path.join(root,p));
const S=get('js/squadSheet.js'),Step=get('js/squadSheetStep.js'),TW=get('js/productionSharedTransferChallenge.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const ev=(rows,hit)=>Step.events({verdicts:{playerOne:rows,playerTwo:[]},hits:{playerOne:hit||{fired:false}}},'playerOne');
const all=p=>[...p.xi,...p.bench,...p.reserves].filter(Boolean);
const men=(p,name)=>all(p).filter(x=>x.name===name);
const docOf=sheet=>({...S.toDoc(sheet),rivalryId:'pair_x',role:'playerOne'});
const row=(slot,name,overall,position,playerId,release=false)=>({slot,name,overall,position,release,...(playerId?{playerId}:{})});
const T='M. Dembélé',CM=row(1,T,82,'CM',162240),ST=row(2,T,71,'ST',211591);
function rebuildsSame(club,season,stage,events,locked,label){
  const again=S.replay({club,special:null,season,stage,events,docs:{[`${season}_${stage}`]:docOf(locked)}});
  assert.ok(again.sheet,`${label}: the document rebuilds (${again.error||''})`);
  const r=p=>p?`${p.id}:${p.rating}:${p.signedSeason}`:'-';
  assert.deepEqual([...again.sheet.xi,...again.sheet.bench].map(r),[...locked.xi,...locked.bench].map(r),`${label}: the same 18`);
  assert.deepEqual(again.sheet.reserves.map(r).sort(),locked.reserves.map(r).sort(),`${label}: the same reserves`);
  assert.deepEqual(again.sheet.excluded,locked.excluded,`${label}: the same men away`);
  assert.ok(S.validate(again.sheet).ok,`${label}: lockable after a reload`);
  return again.sheet;
}

// N1 Astra's replay: the real Transfer War protocol (START, both early ends, both guess locks, both signing locks) on the
// shipped name list, the verdicts through the squad-event adapter and the squad engine, both roles, twice.
(async()=>{
  const Search=get('js/playerSearch.js'),F=get('js/sharedTransferChallenge.js');
  global.window=globalThis;get('data/transferOptions.js');
  const db=Search.load(JSON.parse(fs.readFileSync(path.join(root,'data/fifa17/players-170002.0aeb6a8d.json'),'utf8')));
  const protocol=await F.createProtocol({leagueIds:FIFA17_TRANSFER_LEAGUES.map(x=>x.id),nationalityIds:FIFA17_TRANSFER_NATIONALITIES.map(x=>x.id)});
  const rows=[162240,211591].map((id,i)=>{const p=db.byId(id);return {slot:i+1,name:p.name,playerId:id,overall:p.overall,position:p.position,leagueId:p.leagueId,nationalityId:p.nationalityId};});
  assert.deepEqual(rows.map(r=>[r.name,r.overall,r.position]),[[T,82,'CM'],[T,71,'ST']],'two real men of one name in the shipped list');
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:10,confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}};
  const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
  for(let repeat=1;repeat<=2;repeat+=1)for(const role of ['playerOne','playerTwo']){
    let state=null,n=0;
    const apply=async(actorRole,type,extra={})=>{state=(await protocol.apply({state,setup,careerStart,seasonNumber:1,actorRole,nowEpochMs:1000000,command:{type,operationId:'transfer_op_'+(++n).toString(16).padStart(32,'0'),baseRevision:state?.revision||0,...extra}})).state;};
    await apply('playerOne','start-window');
    for(const r of ['playerOne','playerTwo'])await apply(r,'request-end-window');
    for(const r of ['playerOne','playerTwo'])await apply(r,'lock-guesses',{guesses:[]});
    for(const r of ['playerOne','playerTwo'])await apply(r,'lock-signings',{signings:r===role?rows:[]});
    const verdicts={playerOne:protocol.evaluateRole('playerOne',state),playerTwo:protocol.evaluateRole('playerTwo',state)};
    assert.equal(verdicts[role].filter(x=>!x.release).length,2,'both KEEP');
    const events=Step.events({verdicts},role),sheet=S.advance(S.launch(setup.clubs[role]),events);
    const people=men(sheet,T);
    assert.equal(people.length,2,`${role} run ${repeat}: both Dembélés are in the squad (XI, bench or reserves)`);
    assert.deepEqual(people.map(p=>[p.rating,p.positions[0]]).sort(),[[71,'ST'],[82,'CM']]);
    assert.deepEqual(people.map(p=>p.id).sort(),['s|m. dembele','s|m. dembele#211591'],'the first keeps the name, the second is known by his id');
    assert.ok(S.validate(sheet).ok,S.validate(sheet).problems.join());
    const doc=S.toDoc(sheet),onDoc=doc.names.map((x,i)=>x===T?[doc.numbers[i],doc.signed[i]]:null).filter(Boolean);
    for(const [number,signed] of onDoc)assert.ok((number===-1||number===-1-211591)&&signed===1,'the document names the CM as before (-1) and the ST by his id (-1-playerId: every earlier build reads a negative as none)');
    assert.ok(S.board(sheet).every(r=>r.name!==T||r.number===null),'no shirt number on the Roulette board for either (hitNumber stays 0-99 or null)');
    rebuildsSame(setup.clubs[role],1,'post',[null,events],sheet,`Astra ${role} ${repeat}`);
  }
  ok('N1','Astra A-TW-01 replay (real protocol, shipped name list, both roles, twice): Tottenham\'s and Celtic\'s M. Dembélé both KEEP and both are in the squad, lockable, stored and rebuilt the same');

  // N2 The same man (same playerId) is still one man: twice in one window, again while at the club (SQ-2-03, keeps his first
  // window and place), and bought back after a sale. A row with no id goes by the name, as before.
  {
    const club='Arsenal';
    const twice=S.replay({club,special:null,season:1,stage:'post',events:[null,ev([CM,{...CM,slot:2}])],docs:{}}).proposal;
    assert.equal(men(twice,T).length,1,'same id twice in one window: one man');
    const events=[null,ev([CM])];
    const again=S.replay({club,special:null,season:2,stage:'post',events:events.concat([ev([{...CM,overall:88}])]),docs:{}}).proposal;
    assert.deepEqual(men(again,T).map(p=>[p.id,p.rating,p.signedSeason]),[['s|m. dembele',82,1]],'signed again while at the club: his first window and rating (SQ-2-03)');
    assert.equal(again.alts['s|m. dembele'].length,1,'kept as a repeat entry');
    let pre2=S.replay({club,special:null,season:2,stage:'pre',events,docs:{}}).proposal;
    const sold=S.leave(pre2,'s|m. dembele','sold');assert.ok(sold.ok,sold.reason);pre2=sold.sheet;
    const ev2=events.concat([ev([{...CM,overall:84}])]),docs={'2_pre':docOf(pre2)};
    const back=S.replay({club,special:null,season:2,stage:'post',events:ev2,docs}).proposal;
    assert.deepEqual(men(back,T).map(p=>[p.id,p.rating,p.signedSeason]),[['s|m. dembele',84,2]],'sold and signed again (same id): bought back at his new overall');
    assert.ok(back.notes.some(n=>n.name===T&&n.reason==='bought-back'));
    rebuildsSame(club,2,'post',ev2,back,'same man bought back');
    const typed=S.replay({club,special:null,season:2,stage:'post',events:events.concat([ev([row(1,T,80,'CM')])]),docs:{}}).proposal;
    assert.equal(men(typed,T).length,1,'a typed row (no id) after him is the name: the same man, as before');
    const typedFirst=S.replay({club,special:null,season:2,stage:'post',events:[null,ev([row(1,T,82,'CM')]),ev([ST])],docs:{}}).proposal;
    assert.equal(men(typedFirst,T).length,1,'when the name\'s first man was typed (no id), a later id goes by the name, as before');
    ok('N2','the same man (same playerId) stays one man: twice in a window, signed again while at the club (SQ-2-03), bought back after a sale; rows with no id go by the name');
  }

  // N3 Namesakes across seasons: the CM kept in S1, the ST in S2. Each is his own man for a guess, a loan, a sale and a
  // buy-back, and the roulette shooting one leaves the other. R96 (Nik 2026-11-17, item 6): a shot bars only the shot man's
  // id (the hit's window names one man), exactly as the Transfer War LOCK refuses; a Special Player's name bars both.
  {
    const club='Crotone',events=[null,ev([CM]),ev([ST])];
    const s2=S.replay({club,special:null,season:2,stage:'post',events,docs:{}}).proposal;
    assert.deepEqual(men(s2,T).map(p=>`${p.id}:${p.rating}:${p.signedSeason}`).sort(),['s|m. dembele#211591:71:2','s|m. dembele:82:1'],'both at the club');
    assert.ok(!s2.notes.some(n=>n.reason==='bought-back'),'the ST is a new signing, never the CM bought back');
    rebuildsSame(club,2,'post',events,s2,'namesakes across windows');
    // a guess of the ST (entered again and guessed) releases him only; a guess of the CM, him only
    for(const [guess,stays] of [[ST,'s|m. dembele'],[CM,'s|m. dembele#211591']]){
      const evs=events.concat([ev([{...guess,release:true}])]);
      const p=S.replay({club,special:null,season:3,stage:'post',events:evs,docs:{}}).proposal;
      assert.deepEqual(men(p,T).map(x=>x.id),[stays],`a guess of ${guess.playerId} releases him and nobody else`);
      assert.ok(S.validate(p).ok);rebuildsSame(club,3,'post',evs,p,`guess ${guess.playerId}`);
    }
    // a loan of the ST ends next season; the CM is untouched
    let s3=S.replay({club,special:null,season:3,stage:'pre',events:events.concat([ev([])]),docs:{}}).proposal;
    const loan=S.leave(s3,'s|m. dembele#211591','loaned');assert.ok(loan.ok,loan.reason);
    const evs3=events.concat([ev([])]),d3={'3_pre':docOf(loan.sheet)};
    assert.deepEqual(d3['3_pre'].outNumbers,[-1-211591],'the departure names the ST by his id');
    assert.equal(men(S.replay({club,special:null,season:3,stage:'post',events:evs3,docs:d3}).sheet||S.replay({club,special:null,season:3,stage:'post',events:evs3,docs:d3}).proposal,T).length,1,'away on loan: only the CM');
    const s4=S.replay({club,special:null,season:4,stage:'pre',events:evs3.concat([ev([])]),docs:d3}).proposal;
    assert.equal(men(s4,T).length,2,'the loan ends: both at the club in S4');
    // sold, then the ST bought back by his own id: the CM is never touched
    const sale=S.leave(s3,'s|m. dembele#211591','sold');assert.ok(sale.ok);
    const evsB=events.concat([ev([{...ST,overall:75}])]),dB={'3_pre':docOf(sale.sheet)};
    const b3=S.replay({club,special:null,season:3,stage:'post',events:evsB,docs:dB}).proposal;
    assert.deepEqual(men(b3,T).map(p=>`${p.id}:${p.rating}:${p.signedSeason}`).sort(),['s|m. dembele#211591:75:3','s|m. dembele:82:1'],'the ST bought back at 75, the CM unchanged');
    assert.ok(b3.notes.some(n=>n.reason==='bought-back'));rebuildsSame(club,3,'post',evsB,b3,'namesake bought back');
    // the roulette shoots the ST (window 2): he leaves, the CM stays; only the shot man's id is barred, exactly as LOCK refuses
    const pre3=S.replay({club,special:null,season:3,stage:'pre',events:evs3,docs:{}}).proposal,board=S.board(pre3);
    const i=board.findIndex(r=>r.name===T&&r.signedSeason===2),j=board.findIndex(r=>r.name===T&&r.signedSeason===1);
    assert.ok(i>=0&&j>=0,'both on the S3 board');
    for(const [slot,signed,stays,shotId] of [[i,2,'s|m. dembele',211591],[j,1,'s|m. dembele#211591',162240]]){
      const hit={fired:true,hitName:T,hitNumber:null,hitSlot:slot,hitSignedSeason:signed,version:'v'};
      const evs=events.concat([ev([],hit)]);
      const p=S.replay({club,special:null,season:3,stage:'post',events:evs,docs:{}}).proposal;
      assert.deepEqual(men(p,T).map(x=>x.id),[stays],`the roulette shoots the window-${signed} man only`);
      assert.deepEqual(p.barIds['s|m. dembele'],[shotId],'only the shot man\'s id is barred from then on');
      const map=TW.rouletteBlocked([null,{playerOne:[CM],playerTwo:[]},{playerOne:[ST],playerTwo:[]}],{3:{playerOne:hit,playerTwo:null}},3,'playerOne');
      assert.deepEqual(map.get('m. dembele').ids,[shotId],'LOCK bars only the shot man\'s id');
      assert.equal(map.get('m. dembele').whole,false,'never the whole name');
      for(const id of [162240,211591]){
        assert.equal(Boolean(TW.blockedFor(map,T,id)),id===shotId,`LOCK refuses ${id} only when he is the shot man`);
        assert.equal(Boolean(TW.blockedFor(map,T,id)),Boolean(S.barredAs(p,{name:T,playerId:id})),`LOCK and the engine agree on ${id}`);
      }
      assert.ok(TW.blockedFor(map,T,null),'a typed name with no id is still refused (it could be the shot man)');
      rebuildsSame(club,3,'post',evs,p,`shot window ${signed}`);
    }
    const sp=S.replay({club,special:{playerOne:{name:T,overall:82},playerTwo:null},season:2,stage:'post',events,docs:{}}).proposal;
    assert.equal(men(sp,T).length,0,'a Special Player\'s name bars every Dembélé');
    ok('N3','namesakes across seasons: each is his own man for a guess, a loan, a sale and a buy-back; the roulette shooting one leaves the other and bars only his id, as LOCK refuses (R96); a Special Player\'s name bars both');
  }

  // N4 Two namesakes of ONE window on the Roulette board, which the hit names by name and window only. The manager swapped
  // them (Crotone, both CM 85, RCM and LCM), so the automatic chain stands them the other way round. The hit slot on this
  // phone's chain, and the locked "pre" document's entry at the hit slot (docShotPid, read by the step from the kept copy),
  // name the exact man; a phone holding only a later document rebuilds the same squad with it, and never refuses one without.
  {
    const club='Crotone',A=row(1,T,85,'CM',162240),B=row(2,T,85,'CM',211591),events=[null,ev([A,B])];
    let pre=S.replay({club,special:null,season:2,stage:'pre',events,docs:{}}).proposal;
    const slots=pre.xi.map((p,i)=>p&&p.name===T?i:-1).filter(i=>i>=0);assert.equal(slots.length,2,'both start');
    const sw=S.swap(pre,{zone:'xi',index:slots[0]},{zone:'xi',index:slots[1]});assert.ok(sw.ok,sw.reason);pre=sw.sheet;
    const preDoc=docOf(pre),hitSlot=slots[0],who=pre.xi[hitSlot];
    assert.equal(who.id,'s|m. dembele#211591','the manager put the ST-id man where the automatic chain has the other');
    const hit={fired:true,hitName:T,hitNumber:null,hitSlot,hitSignedSeason:1,version:'v'};
    assert.equal(S.namesakesIn([A,B],T),true);assert.equal(S.namesakesIn([A,{...A,slot:2}],T),false);assert.equal(S.namesakesIn([row(1,T,80,'CM'),row(2,T,80,'CM')],T),false);
    assert.equal(S.namesakesIn([A,row(2,T,80,'CM')],T),true,'a row without an id beside one with an id may be another man: the board says');
    assert.equal(S.docShotPid(preDoc,hit),211591,'the locked board names the man at the hit slot');
    assert.equal(S.docShotPid(preDoc,{...hit,hitSlot:slots[1]}),0,'0 = the name\'s first man');
    assert.equal(S.docShotPid(preDoc,{...hit,hitSignedSeason:2}),null,'another window: not him');
    const shot=ev([],{...hit,pid:211591}).shot;assert.deepEqual([shot.slot,shot.pid],[hitSlot,211591],'the step carries the slot and the board\'s pick');
    const live=S.replay({club,special:null,season:2,stage:'post',events:events.concat([ev([],{...hit,pid:211591})]),docs:{'2_pre':preDoc}}).proposal;
    assert.deepEqual(men(live,T).map(p=>p.id),['s|m. dembele'],'the man the roulette hit is the one out');
    const fromSlot=S.replay({club,special:null,season:2,stage:'post',events:events.concat([ev([],hit)]),docs:{'2_pre':preDoc}}).proposal;
    assert.deepEqual(men(fromSlot,T).map(p=>p.id),['s|m. dembele'],'with the locked board under it, the hit slot alone names him too');
    const postDoc=docOf(live),evs=events.concat([ev([],{...hit,pid:211591})]);
    const later=S.replay({club,special:null,season:2,stage:'post',events:evs,docs:{'2_post':postDoc}});
    assert.ok(later.sheet,'a phone with only the post document rebuilds it');
    assert.deepEqual(men(later.sheet,T).map(p=>p.id),['s|m. dembele']);
    assert.deepEqual(later.sheet.excluded,live.excluded,'the same man away on every phone');
    // Codex on #1494 (P1): the ST-id man sold and bought back in S2 stands on the S3 board under window 2, while the automatic
    // chain (no sale) holds him under window 1 with a repeat entry in 2. The roulette shoots him: the CM stays, and a phone
    // holding only the S3 post document rebuilds it (it was BAD_DOC).
    {
      const evs=[null,ev([A,B])];
      let p2=S.replay({club,special:null,season:2,stage:'pre',events:evs,docs:{}}).proposal;
      const sale=S.leave(p2,'s|m. dembele#211591','sold');assert.ok(sale.ok,sale.reason);
      evs[2]=ev([{...B,overall:86}]);
      const post2=S.replay({club,special:null,season:2,stage:'post',events:evs,docs:{'2_pre':docOf(sale.sheet)}}).proposal;
      evs[3]=null;
      const pre3=S.replay({club,special:null,season:3,stage:'pre',events:evs,docs:{'2_post':docOf(post2)}}).proposal;
      const at=S.board(pre3).findIndex(x=>x.name===T&&x.signedSeason===2);assert.ok(at>=0,'the bought-back man is on the S3 board');
      evs[3]=ev([],{fired:true,hitName:T,hitNumber:null,hitSlot:at,hitSignedSeason:2,version:'v'});
      const live3=S.replay({club,special:null,season:3,stage:'post',events:evs,docs:{'3_pre':docOf(pre3)}}).proposal;
      assert.deepEqual(men(live3,T).map(p=>p.id),['s|m. dembele'],'the bought-back man is shot, the CM stays');
      const reload=rebuildsSame(club,3,'post',evs,live3,'bought-back namesake shot');
      assert.deepEqual(men(reload,T).map(p=>p.id),['s|m. dembele']);
    }
    // Codex on #1494 (round 2, P1): both kept in S1, both sold in S2 and bought back there, the first through a row without a
    // playerId and the second by his id. The S3 board stands the second where the automatic chain stands the first; the
    // roulette shoots him. The step reads the board for this window (one id beside a row without one), and a phone holding
    // only the S3 post document rebuilds the same squad: the first man stays (it brought the shot man back and took the other).
    {
      const evs=[null,ev([A,B])];
      let p2=S.replay({club,special:null,season:2,stage:'pre',events:evs,docs:{}}).proposal;
      for(const id of ['s|m. dembele','s|m. dembele#211591']){const r=S.leave(p2,id,'sold');assert.ok(r.ok,r.reason);p2=r.sheet;}
      const rows2=[row(1,T,86,'CM'),{...B,overall:86}];evs[2]=ev(rows2);
      const post2=S.replay({club,special:null,season:2,stage:'post',events:evs,docs:{'2_pre':docOf(p2)}}).proposal;
      assert.deepEqual(men(post2,T).map(p=>p.id).sort(),['s|m. dembele','s|m. dembele#211591'],'both bought back');
      evs[3]=null;
      const auto=S.replay({club,special:null,season:3,stage:'pre',events:evs,docs:{}}).proposal;
      const pre3=S.replay({club,special:null,season:3,stage:'pre',events:evs,docs:{'2_post':docOf(post2)}}).proposal;
      const at=auto.xi.findIndex(p=>p&&p.id==='s|m. dembele');
      assert.equal(pre3.xi[at]&&pre3.xi[at].id,'s|m. dembele#211591','the board has the second man where the automatic chain has the first');
      assert.equal(S.namesakesIn(rows2,T),true,'the step reads the board for this window');
      const hit={fired:true,hitName:T,hitNumber:null,hitSlot:at,hitSignedSeason:pre3.xi[at].signedSeason,version:'v'},pid=S.docShotPid(docOf(pre3),hit);
      assert.equal(pid,211591,'the locked board names the second man');
      evs[3]=ev([],{...hit,pid});
      const live3=S.replay({club,special:null,season:3,stage:'post',events:evs,docs:{'3_pre':docOf(pre3)}}).proposal;
      assert.deepEqual(men(live3,T).map(p=>p.id),['s|m. dembele'],'the second man is shot, the first stays');
      const reload=rebuildsSame(club,3,'post',evs,live3,'mixed-id namesake shot');
      assert.deepEqual(men(reload,T).map(p=>p.id),['s|m. dembele'],'a reload keeps the first man and the shot man away');
    }
    const blind=S.replay({club,special:null,season:2,stage:'post',events:events.concat([ev([],hit)]),docs:{'2_post':postDoc}});
    assert.ok(blind.sheet,'without the board\'s pick (no kept copy, no read) the document still loads: never a refused screen');
    const step=fs.readFileSync(path.join(root,'js/squadSheetStep.js'),'utf8');
    assert.match(step,/async function sqsHistory\(ctx,io\)\{/);assert.match(step,/try\{await sqsShotPids\(ctx,io,results\);\}catch\(_error\)\{\}/);
    assert.match(step,/let data=sqsKept\(sqsPointKey\(ctx,role,k,"pre"\)\)\|\|null;\n\s+if\(!data&&io\)\{const read=await sqsGet\(io,ctx,role,k,"pre",true\);/,'kept copy first, one read only when it is missing, and only for two men of one name in one window');
    assert.equal((step.match(/sqsHistory\(ctx\)|sqsHistory\(pre\)/g)||[]).length,0,'every chain the step builds gets the board\'s pick');
    ok('N4','two namesakes of one window on the board: the hit slot and the locked board name the exact man; a phone with only a later document rebuilds the same squad; without the pick a document still loads');
  }

  // N5 Documents an earlier build stored (gameplay/r93 ce4d1317, before this fix): a Showdown without namesakes rebuilds
  // byte for byte as that build did; Astra's collapsed window and a namesake read as "bought back" both still load, every
  // stored man where he was, and the man the old engine lost is back in the squad.
  {
    const fx=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r94-namesake/pre-fix-squad-docs.json'),'utf8'));
    assert.equal(fx.engineCommit,'ce4d13171a8affade61902d0747d56e1d15b0171');
    const summary=sheet=>({
      fifteen:[...sheet.xi,...sheet.bench].map(p=>p?`${p.name}:${p.rating}:${p.signedSeason}`:'-'),
      reserves:sheet.reserves.map(p=>`${p.name}:${p.rating}:${p.signedSeason}`).sort(),
      ids:all(sheet).map(p=>p.id).sort(),
      excluded:sheet.excluded.slice(),out:sheet.out.map(o=>`${o.name}:${o.reason}:${o.season}:${o.signedSeason}:${o.returned||0}`)
    });
    let loaded=0;
    for(const career of fx.careers){
      const events=career.results.map(r=>r?Step.events(r,'playerOne'):null);
      for(const c of career.cases){
        const [season,stage]=c.key.split('_');
        assert.ok(Step.parse(c.doc,Number(season),stage,'playerOne'),`${career.name} ${c.key}: the stored document parses`);
        const out=S.replay({club:career.club,special:null,season:Number(season),stage,events,docs:{[c.key]:c.doc}});
        assert.ok(out.sheet,`${career.name} ${c.key}: an earlier build's document loads (${out.error||''})`);
        const now=summary(out.sheet);loaded+=1;
        assert.deepEqual(now.fifteen,c.rebuilt.fifteen,`${career.name} ${c.key}: every stored man where he was`);
        if(career.name==='plain'){assert.deepEqual(now,c.rebuilt,`${career.name} ${c.key}: exactly as the earlier build`);continue;}
        for(const r of c.rebuilt.reserves)assert.ok(now.reserves.includes(r),`${career.name} ${c.key}: ${r} still in the reserves`);
        if(career.name==='same-window'&&c.key!=='1_pre')assert.ok(now.reserves.includes(`${T}:71:1`)||now.fifteen.includes(`${T}:71:1`),`${c.key}: Celtic's Dembélé, lost by the earlier build, is at the club`);
        if(career.name==='later-window'&&['2_post','3_pre','3_post','4_pre'].includes(c.key)){
          assert.ok(now.excluded.includes('s|m. dembele'),`${c.key}: Tottenham's Dembélé stays sold`);
          assert.ok(all(out.sheet).some(p=>p.id==='s|m. dembele#211591'),`${c.key}: the stored "bought back" man is Celtic's Dembélé`);
        }
        // Codex on #1494 (P2): the window-2 man's sale (window 2 on the departure) keeps him away, as the earlier build read it.
        if(career.name==='later-window-sold'&&['3_pre','3_post','4_pre'].includes(c.key))assert.deepEqual(men(out.sheet,T),[],`${c.key}: both Dembélés stay sold`);
        // Codex on #1494 (rounds 2 and 3): Celtic's Dembélé sold in S3 and bought back there keeps his id (it was the first
        // man's) and the overall the manager then gave him (79; an earlier build stored it under the name, -1).
        if(career.name==='later-window-buyback'&&['3_post','4_pre'].includes(c.key)){
          assert.deepEqual(men(out.sheet,T).map(p=>`${p.id}:${p.rating}`),['s|m. dembele#211591:79'],`${c.key}: Celtic's Dembélé is back, at his saved overall`);
          assert.ok(now.excluded.includes('s|m. dembele'),`${c.key}: Tottenham's Dembélé stays sold`);
        }
        assert.ok(S.validate(out.sheet).ok||career.name!=='plain',S.validate(out.sheet).problems.join());
      }
    }
    ok('N5',`earlier build's stored squad documents (${loaded} screens, ${fx.careers.length} Showdowns): without namesakes every rebuild is exactly as before; collapsed namesakes still load with every stored man in place, and the lost man is back`);
  }

  // N7 Namesake fuzz: random careers where a few names are shared by several men (several playerIds), kept in the same window
  // or apart, typed with no id now and then, guessed, shot (the pick read from the locked board, as the step does), with
  // random moves. Every proposal locks; a phone holding only the latest document rebuilds the same squad; a shot man never
  // returns; and every man kept this window who is not barred is in the squad (nobody collapses into a namesake).
  {
    const mul=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const clubs=['Crotone','Arsenal','Eibar','Darmstadt 98','Pescara','Burnley'],P=['GK','CB','RB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST'];
    const formations=S.formations().map(f=>f.name);
    const stats={careers:0,screens:0,twins:0,sameWindow:0,shotTwins:0};
    function career(seed){
      const r=mul(seed),pick=a=>a[Math.floor(r()*a.length)];
      const club=pick(clubs),seasons=pick([3,5,10]);
      const names=['Twin A','Twin B','Twin C'].map(n=>`${n} ${seed%13}`),cast=[];
      names.forEach((n,i)=>{for(let j=0;j<3;j+=1)cast.push([n,5000+i*10+j]);});
      const events=[null],docs={};let lastKey=null;
      for(let k=1;k<=seasons;k+=1)for(const stage of ['pre','post']){
        if(stage==='post'&&k===seasons)continue;
        if(stage==='post'){
          const preDoc=docs[`${k}_pre`],pre=S.replay({club,special:null,season:k,stage:'pre',events,docs:{[`${k}_pre`]:preDoc}});
          assert.ok(pre.sheet,`seed ${seed} S${k}: pre rebuilds`);
          const board=S.board(pre.sheet).map((x,i)=>[x,i]).filter(([x])=>x.name);
          let hit={fired:false};
          if(r()<0.7){const twins=board.filter(([x])=>x.signedSeason!==null),[x,i]=twins.length&&r()<0.8?pick(twins):pick(board);hit={fired:true,hitName:x.name,hitNumber:x.number,hitSlot:i,hitSignedSeason:x.signedSeason,version:'v'};}
          const rows=[];
          for(let slot=1;slot<=3;slot+=1){if(r()<0.2)continue;const [name,id]=pick(cast);rows.push(row(slot,name,60+Math.floor(r()*30),pick(P),r()<0.15?null:id,r()<0.25));}
          if(hit.fired&&hit.hitSignedSeason){const w=events[hit.hitSignedSeason],ws=w?w.kept:[];if(S.namesakesIn(ws.map(x=>({...x,release:false})),hit.hitName)){const pid=S.docShotPid(preDoc,hit);if(pid!==null)hit={...hit,pid};stats.shotTwins+=1;}}
          events[k]=ev(rows,hit);
          if(S.namesakesIn(rows,names[0])||S.namesakesIn(rows,names[1])||S.namesakesIn(rows,names[2]))stats.sameWindow+=1;
        }
        const out=S.replay({club,special:null,season:k,stage,events,docs:lastKey?{[lastKey]:docs[lastKey]}:{}});
        assert.ok(!out.error,`seed ${seed} S${k} ${stage}: ${out.error}`);
        const proposal=out.proposal,v=S.validate(proposal);
        assert.ok(v.ok,`seed ${seed} ${club} S${k} ${stage}: the proposal locks (${v.problems[0]})`);
        if(stage==='post'){
          for(const x of events[k].kept){
            const pid=Number.isInteger(x.playerId)?x.playerId:null;
            if(S.barredAs(proposal,{name:x.name,playerId:pid}))continue;
            const first=proposal.firstIds[`s|${x.name.toLowerCase()}`],byName=pid===null||!first||first===pid;
            assert.ok(all(proposal).some(p=>p.name===x.name&&p.signedSeason!==null&&(byName?!p.pid:p.pid===pid)),`seed ${seed} S${k}: ${x.name} ${pid} kept and not barred is at the club as himself`);
          }
        }
        stats.twins+=all(proposal).filter(p=>p.pid).length;
        let sheet=proposal;
        for(let m=0;m<Math.floor(r()*6);m+=1){
          const refs=[...sheet.xi.map((_,i)=>({zone:'xi',index:i})),...sheet.bench.map((_,i)=>({zone:'bench',index:i})),...sheet.reserves.map((_,i)=>({zone:'res',index:i}))];
          const people=all(sheet),u=r();let op=null;
          if(u<0.4)op={t:'swap',a:pick(refs),b:pick(refs)};else if(u<0.5)op={t:'formation',name:pick(formations)};else if(u<0.75&&people.length&&k>1)op={t:'leave',id:pick(people.filter(p=>p.signedSeason!==null).concat(people)).id,reason:pick(S.leaveReasons)};else if(people.length&&k>1){const p=pick(people);op={t:'rate',id:p.id,overall:Math.max(30,Math.min(99,p.rating+Math.floor(r()*9)-4))};}
          if(!op)continue;const res=S.apply(sheet,[op]);if(!res.errors.length)sheet=res.sheet;
        }
        assert.ok(S.validate(sheet).ok,`seed ${seed}: an accepted move left the squad unlockable`);
        const key=`${k}_${stage}`;docs[key]=docOf(sheet);lastKey=key;
        rebuildsSame(club,k,stage,events,sheet,`seed ${seed} S${k} ${stage}`);
        stats.screens+=1;
      }
      stats.careers+=1;
    }
    // (seeds 164 and 926 caught a bought-back first man and a departure of a shot one while Codex's #1494 findings were fixed)
    for(let seed=1;seed<=400;seed+=1)career(seed);career(926);
    assert.ok(stats.twins>200&&stats.sameWindow>20&&stats.shotTwins>5,`the fuzz reaches later namesakes (${stats.twins}), same-window pairs (${stats.sameWindow}) and shots among them (${stats.shotTwins})`);
    ok('N7',`namesake fuzz: ${stats.careers} careers, ${stats.screens} locked screens, ${stats.twins} later-namesake places, ${stats.sameWindow} windows with two men of one name, ${stats.shotTwins} roulette hits among them: every proposal locks, every reload from the latest document reads the same, every man kept and not barred is at the club as himself`);
  }

  // N6 No Rules change: the squad document's Rules hold list lengths and the owner, never a name or a number value, and the
  // roulette hit keeps hitNumber 0-99 or null (a namesake's id never reaches it). js/rosterRoulette.js builds its boards from
  // the locked sheets (2.4.0+), so the roulette and the squad agree; its name-only replay is the pre-2.4.0 fallback.
  {
    const rules=fs.readFileSync(path.join(root,'firestore.season-results-production.fragment.rules'),'utf8');
    const fn=rules.slice(rules.indexOf('function ssjrSquadSheetCreateValid'),rules.indexOf('// SSJR_SEASON_RESULTS_FUNCTIONS_END'));
    assert.ok(fn.length>200);assert.ok(!/after\.numbers\[|after\.names\[|outNumbers\[|ovNumbers\[/.test(fn),'no value of the lists is read');
    const tw=fs.readFileSync(path.join(root,'firestore.transfer-challenge-production.fragment.rules'),'utf8');
    assert.match(tw,/value\.hitNumber is int && value\.hitNumber >= 0 && value\.hitNumber <= 99/);
    const rr=fs.readFileSync(path.join(root,'js/rosterRoulette.js'),'utf8');
    assert.match(rr,/if\(sheets\)\{\n\s+boards\[role\]=sheets\[role\]\.board;/,'the roulette board is the locked sheet');
    ok('N6','no Rules change needed (list lengths only; hitNumber unchanged); the roulette spins on the locked squad sheets');
  }

  // N8 Mixed versions (Codex on #1493): a 2.5.1 phone (main 23bdd439, its squad engine vendored byte for byte in
  // tests/fixtures/r93-mixed-versions) puts its rival's Roulette board together as 2.5.1's js/squadSheetStep.js does: a full
  // rebuild from the rival's locked "pre" document, else the rows straight from the document (boardFromDoc). The roulette
  // engine and squad data are the same in both builds, and the shared board version hashes each row's name, number and window.
  // A later namesake's playerId is stored as -1-playerId, which 2.5.1 reads as no number: both phones build the same rows
  // (formation, name, number, window) for every squad, in both directions, and no playerId is ever a shirt number or a
  // hitNumber. (2.5.1 cannot hold two men of one name, so its rebuild of such a squad falls back to the document's rows.)
  {
    const crypto=require('node:crypto');
    const raw=fs.readFileSync(path.join(root,'tests/fixtures/r93-mixed-versions/squadSheet-2.5.1.js.txt'));
    assert.equal(crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex'),'5f4e4bc3278b687a00b1dc8e6ac02ca6e8aaca3b','the 2.5.1 squad engine (main 23bdd439 js/squadSheet.js), byte for byte');
    globalThis.CareerModeFifa17Players=get('data/fifa17Players.js');globalThis.CareerModeRosterSquads=get('data/rosterSquads.js');
    const mod={exports:{}};new Function('module','exports','require',raw.toString('utf8'))(mod,mod.exports,()=>{throw new Error('2.5.1 engine: no require');});
    const Old=mod.exports;assert.equal(typeof Old.boardFromDoc,'function');
    const R=get('js/rosterRoulette.js');
    const triples=b=>({formation:b.formation,rows:b.board.map(r=>[r.name,r.number,r.signedSeason])});
    const boardBy=(E,club,season,events,doc)=>{// 2.5.1 sqsRivalBoard / sqsBuildLocked, and this build's
      const out=E.replay({club,special:null,season,stage:'pre',events,docs:{[`${season}_pre`]:doc}});
      if(out.sheet)return {formation:out.sheet.formation,board:E.board(out.sheet),full:true};
      const rows=E.boardFromDoc(doc,out.auto||null);return rows?{formation:doc.formation,board:rows,full:false}:null;
    };
    const stats={screens:0,fallback:0,twinsOnBoard:0,collapsedDiffer:0,collapsedSame:0};
    const agree=(club,season,events,doc,label,collapsed=false)=>{
      const now=boardBy(S,club,season,events,doc),old=boardBy(Old,club,season,events,doc);
      assert.ok(now&&now.full,`${label}: this build rebuilds it`);assert.ok(old,`${label}: a 2.5.1 phone puts a board together`);
      for(const r of now.board)assert.ok(r.signedSeason===null||r.number===null,`${label}: a signing has no number on the board`);
      for(const r of old.board)assert.ok(r.signedSeason===null||r.number===null,`${label}: no playerId read as a signing's number on 2.5.1 (${r.number})`);
      // 2.5.1's own rule reads a later namesake kept in another window as the first man bought back (Astra A-TW-01, the bug
      // R94-04 fixes): where its chain holds the two as one, its rebuild can stand that man in another window. Release record.
      const same=JSON.stringify(triples(old))===JSON.stringify(triples(now));
      if(collapsed&&!same){stats.collapsedDiffer+=1;return;}
      assert.ok(same,`${label}: a 2.5.1 phone and a 2.6.0 phone build the same Roulette rows`);
      for(const r of old.board)assert.ok(r.number===null||(Number.isInteger(r.number)&&r.number>=0&&r.number<=99),`${label}: no playerId read as a shirt number on 2.5.1 (${r.number})`);
      const clubs={playerOne:club,playerTwo:'Arsenal'},other=S.board(S.launch('Arsenal'));
      const v=b=>R.version(clubs,{sheets:{playerOne:b,playerTwo:{formation:S.launch('Arsenal').formation,board:other}}});
      assert.equal(v(old),v(now),`${label}: the same shared board version`);
      stats.screens+=1;if(!old.full)stats.fallback+=1;if(now.board.some(r=>r.name&&doc.numbers[r.slot]<=-2))stats.twinsOnBoard+=1;
    };
    // Astra's window and the swapped same-window pair (both on the board), and a later namesake (sold, then the other man).
    {
      const club='Crotone',A=row(1,T,85,'CM',162240),B=row(2,T,85,'CM',211591),events=[null,ev([A,B])];
      let pre=S.replay({club,special:null,season:2,stage:'pre',events,docs:{}}).proposal;
      agree(club,2,events,docOf(pre),'two Dembélés on the board');
      const slots=pre.xi.map((p,i)=>p&&p.name===T?i:-1).filter(i=>i>=0);pre=S.swap(pre,{zone:'xi',index:slots[0]},{zone:'xi',index:slots[1]}).sheet;
      const doc=docOf(pre);assert.ok(doc.numbers.some(n=>n===-1-211591),'the second man is stored as -1-playerId');
      assert.ok(doc.numbers.every(n=>n<=99),'no stored number a 2.5.1 phone could take for a shirt number');
      agree(club,2,events,doc,'two Dembélés swapped on the board');
      const l=[null,ev([A])];let p2=S.replay({club,special:null,season:2,stage:'pre',events:l,docs:{}}).proposal;
      p2=S.leave(p2,'s|m. dembele','sold').sheet;l[2]=ev([B]);
      const post2=S.replay({club,special:null,season:2,stage:'post',events:l,docs:{'2_pre':docOf(p2)}}).proposal;l[3]=null;
      const pre3=S.replay({club,special:null,season:3,stage:'pre',events:l,docs:{'2_post':docOf(post2)}}).proposal;
      const d3=docOf(pre3);assert.deepEqual(d3.outNumbers,[-1],'the sold first man as before');
      agree(club,3,l,d3,'a later namesake');
    }
    // 2.5.1 writes, 2.6.0 reads: a 2.5.1 squad of the same two KEEPs (collapsed there) puts the same rows on both phones.
    {
      const club='Crotone',events=[null,ev([row(1,T,85,'CM',162240),row(2,T,85,'CM',211591)])];
      const oldPre=Old.replay({club,special:null,season:2,stage:'pre',events,docs:{}}).proposal,doc={...Old.toDoc(oldPre),rivalryId:'pair_x',role:'playerOne'};
      const old=boardBy(Old,club,2,events,doc),now=boardBy(S,club,2,events,doc);
      assert.ok(old&&now);assert.deepEqual(triples(now),triples(old),'a 2.5.1 squad reads the same on a 2.6.0 phone');
    }
    // Random namesake careers (as N7): every locked "pre" screen, both builds.
    {
      const mul=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
      const P=['GK','CB','RB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST'];
      for(let seed=1;seed<=120;seed+=1){
        const r=mul(seed),pick=a=>a[Math.floor(r()*a.length)],club=pick(['Crotone','Arsenal','Eibar','Pescara']);
        const cast=[];['Twin A','Twin B'].forEach((n,i)=>{for(let j=0;j<3;j+=1)cast.push([`${n} ${seed%11}`,6000+i*10+j]);});
        const events=[null];let last=null;
        for(let k=1;k<=6;k+=1)for(const stage of ['pre','post']){
          if(stage==='post'){
            const rows=[];for(let s=1;s<=3;s+=1){if(r()<0.2)continue;const [name,id]=pick(cast);rows.push(row(s,name,60+Math.floor(r()*35),pick(P),r()<0.15?null:id,r()<0.2));}
            events[k]=ev(rows);
          }
          const out=S.replay({club,special:null,season:k,stage,events,docs:last?{[last.key]:last.doc}:{}});assert.ok(!out.error,`seed ${seed}: ${out.error}`);
          let sheet=out.proposal;
          for(let m=0;m<Math.floor(r()*5);m+=1){
            const refs=[...sheet.xi.map((_,i)=>({zone:'xi',index:i})),...sheet.bench.map((_,i)=>({zone:'bench',index:i})),...sheet.reserves.map((_,i)=>({zone:'res',index:i}))];
            const people=all(sheet),u=r(),op=u<0.6?{t:'swap',a:pick(refs),b:pick(refs)}:u<0.8&&k>1&&people.length>14?{t:'leave',id:pick(people).id,reason:pick(S.leaveReasons)}:k>1?{t:'rate',id:pick(people).id,overall:50+Math.floor(r()*45)}:null;
            if(!op)continue;const res=S.apply(sheet,[op]);if(!res.errors.length)sheet=res.sheet;
          }
          const doc=docOf(sheet);last={key:`${k}_${stage}`,doc};
          // collapsed: this manager has kept two different men of one name in different windows (the 2.5.1 bug's ground)
          const kept=new Map();for(const e of events)if(e)for(const x of e.kept)if(Number.isInteger(x.playerId)){const w=kept.get(x.name)||new Set();w.add(x.playerId);kept.set(x.name,w);}
          const collapsed=[...kept.values()].some(w=>w.size>=2);
          if(stage==='pre'){const before=stats.collapsedDiffer;agree(club,k,events,doc,`seed ${seed} S${k}`,collapsed);if(collapsed&&stats.collapsedDiffer===before)stats.collapsedSame+=1;}
        }
      }
    }
    assert.ok(stats.fallback>=3&&stats.twinsOnBoard>=3,`the check reaches 2.5.1's fallback (${stats.fallback}) and later namesakes on the board (${stats.twinsOnBoard})`);
    ok('N8',`mixed versions: ${stats.screens} locked "pre" screens (${stats.fallback} that 2.5.1 builds from the document's rows, ${stats.twinsOnBoard} with a later namesake on the board): a 2.5.1 phone and a 2.6.0 phone build the same Roulette rows and board version both ways, Astra's window included; no playerId is ever a number; only where a manager kept two different men of one name can 2.5.1's own rule stand one elsewhere (${stats.collapsedDiffer} screens, ${stats.collapsedSame} the same)`);
  }
  // N9 R96 (Nik 2026-11-17, item 6): a shot bars only the man the roulette shot, so his namesake kept in another window can
  // be signed again in the Transfer War, and the squad takes him back as himself. Where the board cannot tell the two apart
  // (two men of the name in the hit's window) or a row of the name has no id, every kept id (or the whole name) stays barred,
  // as before. Through random careers the LOCK and the squad engine refuse exactly the same men, and a 2.8.0 phone (main
  // 30b79695, its engine vendored byte for byte) puts every locked board of this build together with the same rows.
  {
    const club='Crotone',hitOf=(sheet,signed)=>{const b=S.board(sheet),i=b.findIndex(r=>r.name===T&&r.signedSeason===signed);assert.ok(i>=0,`window-${signed} man on the board`);return {fired:true,hitName:T,hitNumber:null,hitSlot:i,hitSignedSeason:signed,version:'v'};};
    const lock=(rowsBy,hits,season)=>TW.rouletteBlocked(rowsBy.map(r=>r?{playerOne:r,playerTwo:[]}:null),hits.map(h=>h?{playerOne:h,playerTwo:null}:null),season,'playerOne');
    // S1 CM, S2 ST; S3 pre the CM is sold; S3 the roulette shoots the ST; S4 the CM is signed again
    const rowsBy=[null,[CM],[ST],[]],events=[null,ev([CM]),ev([ST])];
    let pre3=S.replay({club,special:null,season:3,stage:'pre',events,docs:{}}).proposal;
    pre3=S.leave(pre3,'s|m. dembele','sold').sheet;const hit3=hitOf(pre3,2),docs={'3_pre':docOf(pre3)};
    events[3]=ev([],hit3);
    const map4=lock(rowsBy,[null,null,null,hit3,null],4);
    assert.equal(TW.blockedFor(map4,T,162240),null,'LOCK lets the CM (not shot) be signed again');
    assert.ok(TW.blockedFor(map4,T,211591),'LOCK still refuses the shot ST');
    const again={...CM,overall:84};events[4]=ev([again,{...ST,slot:3}]);rowsBy[4]=[again,{...ST,slot:3}];
    const post4=S.replay({club,special:null,season:4,stage:'post',events,docs}).proposal;
    assert.deepEqual(men(post4,T).map(p=>`${p.id}:${p.rating}:${p.signedSeason}`),['s|m. dembele:84:4'],'the CM is back at 84 as himself; the shot ST never returns');
    assert.ok(!post4.excluded.includes('s|m. dembele'),'he is no longer away');
    assert.ok(S.validate(post4).ok);rebuildsSame(club,4,'post',events,post4,'namesake signed again after the other was shot');
    // the other way round: the CM shot, the ST (sold) signed again
    {
      const evs=[null,ev([CM]),ev([ST])];let p3=S.replay({club,special:null,season:3,stage:'pre',events:evs,docs:{}}).proposal;
      p3=S.leave(p3,'s|m. dembele#211591','sold').sheet;const h=hitOf(p3,1),d={'3_pre':docOf(p3)};evs[3]=ev([],h);
      const m=lock([null,[CM],[ST],[]],[null,null,null,h,null],4);
      assert.equal(TW.blockedFor(m,T,211591),null,'LOCK lets the ST be signed again');assert.ok(TW.blockedFor(m,T,162240),'and refuses the shot CM');
      evs[4]=ev([{...ST,overall:76}]);
      const p4=S.replay({club,special:null,season:4,stage:'post',events:evs,docs:d}).proposal;
      assert.deepEqual(men(p4,T).map(p=>`${p.id}:${p.rating}:${p.signedSeason}`),['s|m. dembele#211591:76:4'],'the ST is back as himself');
      rebuildsSame(club,4,'post',evs,p4,'the ST signed again after the CM was shot');
    }
    // two men of the name in the hit's window: the board cannot say which, so both stay barred (as before)
    {
      const A=row(1,T,85,'CM',162240),B=row(2,T,85,'CM',211591),evs=[null,ev([A,B])];
      const p2=S.replay({club,special:null,season:2,stage:'pre',events:evs,docs:{}}).proposal,h=hitOf(p2,1);evs[2]=ev([],h);
      const p=S.replay({club,special:null,season:2,stage:'post',events:evs,docs:{}}).proposal,m=lock([null,[A,B],[]],[null,null,h],2);
      assert.deepEqual(m.get('m. dembele').ids,[162240,211591]);assert.deepEqual(p.barIds['s|m. dembele'],[162240,211591],'same window: both ids, as before');
    }
    // a row of the name with no id (typed): the whole name stays barred (as before)
    {
      const typed=row(1,T,82,'CM'),evs=[null,ev([typed]),ev([ST])];
      const p3=S.replay({club,special:null,season:3,stage:'pre',events:evs,docs:{}}).proposal,h=hitOf(p3,1);evs[3]=ev([],h);
      const m=lock([null,[typed],[ST],[]],[null,null,null,h],3),p=S.replay({club,special:null,season:3,stage:'post',events:evs,docs:{}}).proposal;
      assert.equal(m.get('m. dembele').whole,true,'LOCK: the whole name');
      for(const id of [162240,211591,null])assert.ok(TW.blockedFor(m,T,id)&&S.barredAs(p,{name:T,playerId:id}),`legacy: ${id} refused by both`);
    }
    // LOCK and the engine agree, and a 2.8.0 rival builds the same boards, through random careers with shots and buy-backs
    const crypto=require('node:crypto');
    const raw=fs.readFileSync(path.join(root,'tests/fixtures/r96-mixed-versions/squadSheet-2.8.0.js.txt'));
    assert.equal(crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex'),'4f85eacd1ed3c98bcb05705bf0d07aa4d28aaa86','the 2.8.0 squad engine (main 30b79695 js/squadSheet.js), byte for byte');
    const mod={exports:{}};new Function('module','exports','require',raw.toString('utf8'))(mod,mod.exports,()=>{throw new Error('2.8.0 engine: no require');});
    const Old=mod.exports,R=get('js/rosterRoulette.js');
    const boardBy=(E,c,season,evs,doc)=>{const out=E.replay({club:c,special:null,season,stage:'pre',events:evs,docs:{[`${season}_pre`]:doc}});if(out.sheet)return {formation:out.sheet.formation,board:E.board(out.sheet)};const rows=E.boardFromDoc(doc,out.auto||null);return rows?{formation:doc.formation,board:rows}:null;};
    const triples=b=>({formation:b.formation,rows:b.board.map(r=>[r.name,r.number,r.signedSeason])});
    const mul=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const P=['GK','CB','RB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST'],last=Number(process.env.R96_NAMESAKE_SEEDS||300);
    const stats={careers:0,compared:0,narrow:0,backAfterShot:0,boards:0,oldStops:0};
    for(let seed=1;seed<=last;seed+=1){
      const r=mul(seed+7000),pick=a=>a[Math.floor(r()*a.length)],c=pick(['Crotone','Arsenal','Eibar','Pescara','Burnley']);
      const cast=[];['Twin A','Twin B'].forEach((n,i)=>{for(let j=0;j<3;j+=1)cast.push([`${n} ${seed%11}`,7000+i*10+j]);});
      const evs=[null],rowsBy=[null],hits=[null];let lastDoc=null,shotIds=new Set();
      for(let k=1;k<=6;k+=1)for(const stage of ['pre','post']){
        if(stage==='post'){
          const preDoc=lastDoc&&lastDoc.key===`${k}_pre`?lastDoc.doc:null;
          const pre=S.replay({club:c,special:null,season:k,stage:'pre',events:evs,docs:preDoc?{[`${k}_pre`]:preDoc}:{}});
          const preSheet=pre.sheet||pre.proposal,board=S.board(preSheet).map((x,i)=>[x,i]).filter(([x])=>x.name);
          let hit={fired:false};
          if(r()<0.6){const twins=board.filter(([x])=>x.signedSeason!==null),[x,i]=twins.length&&r()<0.85?pick(twins):pick(board);hit={fired:true,hitName:x.name,hitNumber:x.number,hitSlot:i,hitSignedSeason:x.signedSeason,version:'v'};}
          // the LOCK of season k: this season's shot, guesses before it
          const m=TW.rouletteBlocked(rowsBy.map(x=>x?{playerOne:x,playerTwo:[]}:null).concat([null]),hits.concat([hit.fired?hit:null]).map(h=>h?{playerOne:h,playerTwo:null}:null),k,'playerOne');
          const rows=[];
          for(let slot=1;slot<=3;slot+=1){if(r()<0.2)continue;const [name,id]=pick(cast),pid=r()<0.1?null:id;if(TW.blockedFor(m,name,pid))continue;rows.push(row(slot,name,60+Math.floor(r()*30),pick(P),pid,r()<0.2));}
          if(hit.fired&&hit.hitSignedSeason){const w=evs[hit.hitSignedSeason],ws=w?w.kept:[];if(S.namesakesIn(ws.map(x=>({...x,release:false})),hit.hitName)&&preDoc){const pid=S.docShotPid(preDoc,hit);if(pid!==null)hit={...hit,pid};}}
          evs[k]=ev(rows,hit);rowsBy[k]=rows;hits[k]=hit.fired?hit:null;
          for(const e of m.values())if(e.reason==='shot'&&e.whole===false&&e.ids.length===1)stats.narrow+=1;
          // every man LOCK let through and kept is in the squad as himself (never refused by the engine)
          const post=S.replay({club:c,special:null,season:k,stage:'post',events:evs,docs:preDoc?{[`${k}_pre`]:preDoc}:{}}).proposal;
          // (a name the rival also guessed in this same window is that guess's business, not the roulette's)
          for(const x of rows.filter(x=>!x.release&&!rows.some(q=>q.release&&q.name===x.name))){
            assert.ok(!S.barredAs(post,{name:x.name,playerId:x.playerId??null}),`seed ${seed} S${k}: ${x.name} ${x.playerId} passed LOCK but the squad refuses him`);
            if(x.playerId&&shotIds.has(`${x.name}|${x.playerId}`))assert.fail(`seed ${seed} S${k}: shot man ${x.playerId} signed again`);
          }
          // LOCK of the next season without its own shot = the engine's bars after this window, for every man of the cast
          const next=TW.rouletteBlocked(rowsBy.map(x=>x?{playerOne:x,playerTwo:[]}:null).concat([null]),hits.concat([null]).map(h=>h?{playerOne:h,playerTwo:null}:null),k+1,'playerOne');
          for(const [name,id] of cast)for(const pid of [id,null]){assert.equal(Boolean(TW.blockedFor(next,name,pid)),Boolean(S.barredAs(post,{name,playerId:pid})),`seed ${seed} S${k}: LOCK and the engine agree on ${name} ${pid}`);stats.compared+=1;}
          if(hit.fired&&hit.hitSignedSeason){const e=next.get(TW.nameKey(hit.hitName));if(e)for(const id of e.ids)if(e.ids.length===1)shotIds.add(`${hit.hitName}|${id}`);}
          if(rows.some(x=>!x.release&&x.playerId&&[...next.values()].some(e=>e.reason==='shot'&&TW.nameKey(e.name)===TW.nameKey(x.name))))stats.backAfterShot+=1;
        }
        const out=S.replay({club:c,special:null,season:k,stage,events:evs,docs:lastDoc?{[lastDoc.key]:lastDoc.doc}:{}});assert.ok(!out.error,`seed ${seed}: ${out.error}`);
        let sheet=out.proposal;
        for(let m=0;m<Math.floor(r()*5);m+=1){
          const refs=[...sheet.xi.map((_,i)=>({zone:'xi',index:i})),...sheet.bench.map((_,i)=>({zone:'bench',index:i})),...sheet.reserves.map((_,i)=>({zone:'res',index:i}))];
          const people=all(sheet),u=r(),op=u<0.5?{t:'swap',a:pick(refs),b:pick(refs)}:u<0.8&&k>1&&people.length>14?{t:'leave',id:pick(people.filter(p=>p.signedSeason!==null).concat(people)).id,reason:pick(S.leaveReasons)}:k>1?{t:'rate',id:pick(people).id,overall:50+Math.floor(r()*45)}:null;
          if(!op)continue;const res=S.apply(sheet,[op]);if(!res.errors.length)sheet=res.sheet;
        }
        assert.ok(S.validate(sheet).ok,`seed ${seed} S${k} ${stage}: locks`);
        const doc=docOf(sheet);lastDoc={key:`${k}_${stage}`,doc};
        rebuildsSame(c,k,stage,evs,sheet,`r96 seed ${seed} S${k} ${stage}`);
        if(stage==='pre'){
          const now=boardBy(S,c,k,evs,doc),old=boardBy(Old,c,k,evs,doc);assert.ok(now&&old,`seed ${seed} S${k}: both builds put a board together`);
          // The one place the builds part (release record): a namesake signed again after the other was shot, which 2.8.0's
          // wider bar refuses. Where its chain still holds him (back from a loan) it stands him in his old window, so the
          // roulette's version check stops the spin and asks that phone to update; anywhere else it reads the document's rows.
          if(JSON.stringify(triples(old))!==JSON.stringify(triples(now))){
            const oldBars=Old.replay({club:c,special:null,season:k,stage:'pre',events:evs,docs:{}}).proposal;
            const refused=all(sheet).some(p=>p.signedSeason&&Old.barredAs(oldBars,{name:p.name,playerId:S.playerIdOf(sheet,p)})&&!S.barredAs(sheet,{name:p.name,playerId:S.playerIdOf(sheet,p)}));
            assert.ok(refused,`seed ${seed} S${k}: a 2.8.0 phone builds the same Roulette rows`);
            stats.oldStops+=1;continue;
          }
          const clubs={playerOne:c,playerTwo:'Arsenal'},other={formation:S.launch('Arsenal').formation,board:S.board(S.launch('Arsenal'))};
          assert.equal(R.version(clubs,{sheets:{playerOne:old,playerTwo:other}}),R.version(clubs,{sheets:{playerOne:now,playerTwo:other}}),`seed ${seed} S${k}: the same shared board version`);
          stats.boards+=1;
        }
      }
      stats.careers+=1;
    }
    assert.ok(stats.narrow>20&&stats.backAfterShot>5,`the fuzz reaches narrowed shots (${stats.narrow}) and a namesake signed after a shot (${stats.backAfterShot})`);
    ok('N9',`R96 a shot bars only the shot man: his namesake from another window is signed again and back as himself (both ways); same-window pairs and typed rows stay barred as before; fuzz ${stats.careers} careers: LOCK and the engine agree on ${stats.compared} men, ${stats.narrow} narrowed shots, ${stats.backAfterShot} windows signing a namesake after a shot, and a 2.8.0 phone builds the same ${stats.boards} boards and board versions (${stats.oldStops} where it holds a namesake signed again after the other was shot in his old window: the roulette's version check asks it to update)`);
  }
  console.log(`PASS r94 namesake signings contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
