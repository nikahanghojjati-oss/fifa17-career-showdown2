'use strict';
// Sol S-SQ-01 (2.6.0 audit, P1): a fair squad could not lock. The squad document's departures list is cumulative and the Rules
// hold it to 100 entries (firestore.season-results-production.fragment.rules, outNames.size() <= 100; js/squadSheetStep.js
// reads with the same limit). Every "Loaned out" added an entry, and a loan that ended stayed in the list, so twelve men loaned
// out every season reached 101 entries in season 10: LOCK was refused (permission-denied) and the screen said "Check the
// connection and try again". Now a loan that ended at a season's end is folded into that man's next departure (only his
// latest such loan stays, as his last record). The squad, the Roulette board and every stored document's rebuild are exactly
// as before; the Rules are unchanged; a squad past the limit is never sent, and a refused LOCK says what happened.
//   L1  Sol's replay: Arsenal and Chelsea, the same twelve club players loaned out in seasons 2-9, five again in season 10:
//       every screen's document is one the store sends (12 departures, not 101), and each rebuilds the same board
//   L2  documents the pre-fix engine stored (gameplay/r93 d432dc07, tests/fixtures/r93-loan-records): each rebuilds exactly
//       as that engine did (squad, men away, every departure in order); from its season-9 document the fifth season-10
//       loan now saves (the inherited history folds) with the same board the pre-fix engine had
//   L3  worst case fuzz: ten seasons of loans every season, sales, three kept signings a window (buy-backs and loans of
//       signings), Roulette shots and moves: every document stays within the limit and under the bound (the club's men plus
//       the kept signing rows), every reload rebuilds the same squad, board and departures
//   L4  a refused LOCK: a squad past a save limit is never sent and says so; the store's refusal is not "the connection"
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../..'),get=p=>require(path.join(root,p));
const S=get('js/squadSheet.js'),Step=get('js/squadSheetStep.js'),P=get('data/fifa17Players.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const people=s=>[...s.xi,...s.bench,...s.reserves].filter(Boolean);
const docOf=(sheet,season,stage,role='playerOne')=>({...S.toDoc(sheet),schemaVersion:1,objectType:'sharedSquadSheet',rivalryId:`pair_${'a'.repeat(64)}`,seasonNumber:season,stage,role});
const outKey=o=>`${o.id}:${o.reason}:${o.season}:${o.signedSeason}:${o.returned||0}`;
const summary=sheet=>({
  fifteen:[...sheet.xi,...sheet.bench].map(p=>p?`${p.id}:${p.rating}:${p.signedSeason}`:'-'),
  reserves:sheet.reserves.map(p=>`${p.id}:${p.rating}:${p.signedSeason}`).sort(),
  excluded:sheet.excluded.slice(),out:sheet.out.map(outKey)
});
const LIMIT=100;

// L1 Sol's replay (the pure engine part; the store part runs in tests/firebase/squad-sheets-rules-emulator.cjs group 6).
for(const repeat of [1,2])for(const [role,club] of [['playerOne','Arsenal'],['playerTwo','Chelsea']]){
  const events=[null];let sheet=S.launch(club),borrowers=[],most=0;
  for(let season=1;season<=10;season+=1){
    if(season>1)sheet=S.advance(sheet);
    if(season===2)borrowers=people(sheet).filter(p=>p.signedSeason===null).sort((a,b)=>a.rating-b.rating||a.id.localeCompare(b.id)).slice(0,12).map(p=>p.id);
    if(season>=2)for(const id of borrowers.slice(0,season===10?5:12)){const r=S.leave(sheet,id,'loaned');assert.ok(r.ok,r.reason);sheet=r.sheet;}
    for(const stage of ['pre','post']){
      if(stage==='post'){if(season===10)break;events[season]={shot:null,released:[],kept:[]};sheet=S.advance(sheet,events[season]);}
      assert.ok(S.validate(sheet).ok,`${club} S${season} ${stage}: the squad locks`);
      const data=docOf(sheet,season,stage,role);most=Math.max(most,data.outNames.length);
      assert.ok(Step.parse(data,season,stage,role),`${club} S${season} ${stage}: a document the store sends (${data.outNames.length} departures)`);
      const again=S.replay({club,special:null,season,stage,events,docs:{[`${season}_${stage}`]:data}});
      assert.ok(again.sheet,again.error);
      assert.deepEqual(S.board(again.sheet),S.board(sheet),`${club} S${season} ${stage}: the same Roulette board`);
      assert.deepEqual(summary(again.sheet).fifteen,summary(sheet).fifteen);
    }
  }
  assert.equal(most,12,`${club} run ${repeat}: twelve men loaned again and again are twelve departures`);
  // Each man's one record is his latest loan, marked back (or away now, for the five loaned in season 10).
  const last=new Map(sheet.out.map(o=>[o.id,o]));
  assert.deepEqual([...last.keys()].sort(),borrowers.slice().sort());
  for(const id of borrowers.slice(0,5))assert.equal(last.get(id).season,10,'loaned again in season 10: away now');
  for(const id of borrowers.slice(5))assert.deepEqual([last.get(id).season,last.get(id).returned],[9,10],'loaned in season 9, back in season 10');
}
ok('L1','Sol S-SQ-01 replay (Arsenal and Chelsea, both roles, twice): twelve men loaned out every season, five again in season 10: twelve departures, not 101; every screen sends and rebuilds the same board');

// L2 Documents the pre-fix engine stored.
{
  const fx=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/r93-loan-records/pre-fix-loan-history.json'),'utf8'));
  assert.equal(fx.engineCommit,'d432dc076f7d1c72ea8c89ba1bc6e00145d8b9f5');
  let loaded=0;
  for(const career of fx.careers){
    const events=career.events;
    for(const c of career.cases){
      const [season,stage]=c.key.split('_'),n=Number(season);
      assert.ok(Step.parse({...c.doc,schemaVersion:1,objectType:'sharedSquadSheet',seasonNumber:n,stage},n,stage,'playerOne'),`${career.club} ${c.key}: the stored document parses`);
      const out=S.replay({club:career.club,special:null,season:n,stage,events,docs:{[c.key]:c.doc}});
      assert.ok(out.sheet,`${career.club} ${c.key}: ${out.error}`);
      assert.deepEqual(summary(out.sheet),c.rebuilt,`${career.club} ${c.key}: exactly as the pre-fix engine rebuilt it (squad, men away, every departure in order)`);
      if(c.board)assert.deepEqual(S.board(out.sheet),c.board,`${career.club} ${c.key}: the same Roulette board`);
      loaded+=1;
    }
    // From the stored season-10 "pre" document (100 departures, four of the season-10 loans made): the fifth loan Sol made.
    const ten=career.cases.find(c=>c.key==='10_pre');assert.equal(ten.doc.outNames.length,100);
    const open=S.replay({club:career.club,special:null,season:10,stage:'pre',events,docs:{'10_pre':ten.doc}}).sheet;
    const fifth=S.leave(open,career.fifth.id,'loaned');assert.ok(fifth.ok,fifth.reason);
    assert.equal(career.fifth.departures,101,'the pre-fix engine stored 101 here');
    const data=docOf(fifth.sheet,10,'pre');
    assert.equal(data.outNames.length,12,'the inherited history folds: one record per man');
    assert.ok(Step.parse(data,10,'pre','playerOne'),'the store sends it');
    assert.deepEqual(S.board(fifth.sheet),career.fifth.board,'the same board the pre-fix engine had for that squad');
    const again=S.replay({club:career.club,special:null,season:10,stage:'pre',events,docs:{'10_pre':data}});
    assert.ok(again.sheet,again.error);assert.deepEqual(S.board(again.sheet),career.fifth.board);
    assert.deepEqual(again.sheet.excluded,fifth.sheet.excluded,'the same five away');
  }
  ok('L2',`documents the pre-fix engine stored (${loaded} screens, ${fx.careers.length} Showdowns of 96-100 departures): each rebuilds exactly as before; the fifth season-10 loan now saves with the same board`);
}

// L3 Worst-case fuzz: as many departures as a fair Showdown can make.
{
  const mul=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
  const POS=['GK','CB','RB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST'];
  const clubs=Object.keys(P.clubs).filter(c=>P.clubs[c].players.length>=33).slice(0,4).concat(['Crotone','Eibar']);
  const stats={careers:0,screens:0,most:0,bound:0};
  function career(seed){
    const r=mul(seed),pick=a=>a[Math.floor(r()*a.length)];
    const club=pick(clubs),cast=Array.from({length:6},(_,i)=>[`Loanee ${i} ${seed%7}`,8000+i]);
    const events=[null];let lastDoc=null,lastKey=null,keptRows=0;
    for(let k=1;k<=10;k+=1)for(const stage of ['pre','post']){
      if(stage==='post'&&k===10)continue;
      if(stage==='post'){
        const pre=S.replay({club,special:null,season:k,stage:'pre',events,docs:{[lastKey]:lastDoc}}).sheet;
        const board=S.board(pre).map((x,i)=>[x,i]).filter(([x])=>x.name);let hit={fired:false};
        if(r()<0.3){const [x,i]=pick(board);hit={fired:true,hitName:x.name,hitNumber:x.number,hitSlot:i,hitSignedSeason:x.signedSeason,version:'v'};}
        const rows=[];for(let s=1;s<=3;s+=1){const [name,id]=pick(cast);rows.push({slot:s,name,overall:60+Math.floor(r()*30),position:pick(POS),release:r()<0.1,playerId:id});}
        keptRows+=rows.filter(x=>!x.release).length;
        events[k]=Step.events({verdicts:{playerOne:rows,playerTwo:[]},hits:{playerOne:hit}},'playerOne');
      }
      const out=S.replay({club,special:null,season:k,stage,events,docs:lastKey?{[lastKey]:lastDoc}:{}});
      assert.ok(!out.error,`seed ${seed} S${k} ${stage}: ${out.error}`);
      let sheet=out.proposal;
      // Every man who can go goes on loan (down to the 14 a squad needs), now and then a sale; ratings and swaps between.
      for(const p of people(sheet).sort(()=>r()-0.5)){
        if(k<2||people(sheet).length<=14)break;
        const res=S.apply(sheet,[{t:'leave',id:p.id,reason:r()<0.85?'loaned':pick(['sold','contract','retired','swapped','other'])}]);
        if(!res.errors.length)sheet=res.sheet;
      }
      for(let m=0;m<Math.floor(r()*4);m+=1){
        const refs=[...sheet.xi.map((_,i)=>({zone:'xi',index:i})),...sheet.bench.map((_,i)=>({zone:'bench',index:i}))];
        const res=S.apply(sheet,[r()<0.5||k<2?{t:'swap',a:pick(refs),b:pick(refs)}:{t:'rate',id:pick(people(sheet)).id,overall:40+Math.floor(r()*55)}]);
        if(!res.errors.length)sheet=res.sheet;
      }
      assert.ok(S.validate(sheet).ok,`seed ${seed} S${k} ${stage}: the squad locks`);
      const key=`${k}_${stage}`,data=docOf(sheet,k,stage),n=data.outNames.length,bound=P.clubs[club].players.length+keptRows;
      assert.ok(n<=LIMIT&&Step.parse(data,k,stage,'playerOne'),`seed ${seed} ${club} ${key}: ${n} departures: a document the store sends`);
      assert.ok(n<=bound,`seed ${seed} ${club} ${key}: ${n} departures, over the bound ${bound}`);
      const again=S.replay({club,special:null,season:k,stage,events,docs:{[key]:data}});
      assert.ok(again.sheet,`seed ${seed} ${key}: ${again.error}`);
      const a=summary(again.sheet),b=summary(sheet);
      assert.deepEqual([a.fifteen,a.reserves,a.excluded],[b.fifteen,b.reserves,b.excluded],`seed ${seed} ${key}: a reload rebuilds the same squad`);
      assert.deepEqual(S.board(again.sheet),S.board(sheet),`seed ${seed} ${key}: the same board`);
      assert.deepEqual(again.sheet.out.map(o=>o.id).sort(),sheet.out.map(o=>o.id).sort(),`seed ${seed} ${key}: the same departures`);
      lastDoc=data;lastKey=key;stats.screens+=1;stats.most=Math.max(stats.most,n);stats.bound=Math.max(stats.bound,bound);
    }
    stats.careers+=1;
  }
  for(let seed=1;seed<=150;seed+=1)career(seed);
  assert.ok(stats.most>=30,`the fuzz reaches long departure lists (${stats.most})`);
  ok('L3',`worst-case fuzz: ${stats.careers} ten-season careers, ${stats.screens} locked screens, loans every season, sales, three signings a window and shots: at most ${stats.most} departures (bound up to ${stats.bound}, limit ${LIMIT}); every reload the same squad, board and departures`);
}

// L4 A refused LOCK says what happened.
{
  const step=fs.readFileSync(path.join(root,'js/squadSheetStep.js'),'utf8');
  const lock=step.slice(step.indexOf('onLock:async locked=>{'),step.indexOf('afterLock(result.data);'));
  assert.ok(lock.length>0);
  assert.match(lock,/if\(!sqsParse\(doc,ctx\.season,ctx\.stage,ctx\.managerRole\)\)return \{ok:false,reason:LOCK_TOO_BIG\};\n[\s\S]*sqsCreate\(io,ctx,doc/,'a squad the store would refuse is checked before anything is sent');
  assert.match(lock,/sqsRefused\(result\.error\)\?LOCK_REFUSED:"Could not save your squad\. Check the connection and try again\."/,'"check the connection" only when it may be the connection');
  assert.match(step,/const LOCK_TOO_BIG="This squad is over a save limit, so it cannot be saved\. Nothing was saved\. Trying again will not help\.";/);
  assert.match(step,/const LOCK_REFUSED="The game refused to save this squad\. This is not your connection, so trying again will not help\. Nothing was saved\.";/);
  assert.match(step,/function sqsRefused\(error\)\{/);
  // the client limit is the Rules' limit, unchanged
  const rules=fs.readFileSync(path.join(root,'firestore.season-results-production.fragment.rules'),'utf8');
  assert.match(rules,/after\.outNames is list && after\.outNames\.size\(\) <= 100/);
  assert.match(step,/const LIST_MAX=Object\.freeze\(\{names:18,out:100,ov:150\}\);/);
  // the same refusal the store gives: a document past the limit is not one this build sends
  const sheet=S.launch('Arsenal'),big={...docOf(sheet,1,'pre'),outNames:new Array(101).fill('X'),outNumbers:new Array(101).fill(-1),outSigned:new Array(101).fill(0),outReasons:new Array(101).fill('sold'),outSeasons:new Array(101).fill(1)};
  assert.equal(Step.parse(big,1,'pre','playerOne'),null);
  assert.ok(Step.parse({...big,...Object.fromEntries(['outNames','outNumbers','outSigned','outReasons','outSeasons'].map(k=>[k,big[k].slice(1)]))},1,'pre','playerOne'));
  ok('L4','a refused LOCK: a squad past the save limit is never sent and says so ("over a save limit"); a store refusal says it is not the connection; the Rules and the client keep the same 100');
}
console.log(`PASS r93 loan records contracts (${checks} checks)`);
