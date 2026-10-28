'use strict';
// r86 Marquee Player draw (Nik 2026-10-27): the list from Nik's PDF, the ranking badge colours, a draw both phones agree on
// with no IO, and the old-save boundary (Sol round 2: never in a hashed document; a missing field is "no MP", never an error).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const List=require('../../data/marqueePlayers.js');
const MP=require('../../js/marqueePlayer.js');
const Adapter=require('../../js/sharedClosedShowdownAdapter.js');
const Analytics=require('../../js/sharedCareerAnalytics.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// L1 the list
assert.equal(List.listVersion,1);
assert.equal(List.players.length,305);
let prev=null;
List.players.forEach((p,i)=>{
  assert.deepEqual(Object.keys(p),['rank','name','club','overall','potential','number','nation','nationCode','position','stats'],`row ${i} shape`);
  assert.ok(Number.isInteger(p.number)&&p.number>=1&&p.number<=99,`row ${i} shirt number`);
  // Card face (Team V HO-035 walkout card): nation flag, position, and FIFA 17's six face stats (goalkeepers have their own six).
  assert.ok(typeof p.nation==='string'&&/^([A-Z]{2}|GB-(ENG|SCT|WLS|NIR))$/.test(p.nationCode),`row ${i} nation`);
  assert.match(p.position,/^(GK|CB|LB|RB|LWB|RWB|CDM|CM|CAM|LM|RM|LW|RW|CF|ST)$/,`row ${i} position`);
  assert.deepEqual(Object.keys(p.stats),p.position==='GK'?['DIV','HAN','KIC','REF','SPD','POS']:['PAC','SHO','PAS','DRI','DEF','PHY'],`row ${i} stats`);
  assert.ok(Object.values(p.stats).every(v=>Number.isInteger(v)&&v>=1&&v<=99),`row ${i} stat range`);
  assert.ok(typeof p.name==='string'&&p.name.length>1&&(p.club===null||typeof p.club==='string'));
  if(prev){
    assert.ok(p.potential<prev.potential||p.potential===prev.potential&&p.overall<=prev.overall,`row ${i} order`);
    // Competition rank: equal potential and overall share a rank, otherwise rank = position + 1.
    assert.equal(p.rank,p.potential===prev.potential&&p.overall===prev.overall?prev.rank:i+1,`row ${i} rank`);
  }else assert.equal(p.rank,1);
  prev=p;
});
assert.deepEqual(List.players.filter(p=>p.club===null).map(p=>p.name),[]);
// Launch database (HO-037): the tie at the cut is kept whole, and Gabriel Jesus (added after launch) is absent.
assert.equal(List.players.filter(p=>p.overall===75&&p.potential===85).length,8);
assert.ok(!List.players.some(p=>/Gabriel Jesus/.test(p.name)));
assert.equal(List.players.find(p=>p.name==='K. Mbappé').overall,71);assert.equal(List.players.find(p=>p.name==='Deulofeu').club,'Everton');
const named=name=>List.players.find(p=>p.name===name);
assert.equal(List.players[0].name,'Neymar');assert.equal(named('Cristiano Ronaldo').number,7);assert.equal(named('L. Messi').number,10);
assert.deepEqual(named('L. Messi').stats,{PAC:89,SHO:90,PAS:86,DRI:96,DEF:26,PHY:61});assert.equal(named('L. Messi').nationCode,'AR');assert.equal(List.players[304].rank,298);
assert.deepEqual(named('Cristiano Ronaldo').stats,{PAC:92,SHO:92,PAS:81,DRI:91,DEF:33,PHY:80},'launch card as printed');
ok('L1','the 305 launch-database players in potential-then-overall order with competition ranks (the 85/75 tie at 300 kept whole), each with launch club, shirt number, nation, position and printed card stats; no Gabriel Jesus');

// L2 ranking badges
for(const [rank,tier] of [[1,'black-blue-gold'],[3,'black-blue-gold'],[4,'blue-gold'],[10,'blue-gold'],[11,'gold'],[20,'gold'],[21,'silver'],[50,'silver'],[51,'bronze'],[188,'bronze']])assert.equal(MP.tier(rank),tier,`rank ${rank}`);
assert.equal(MP.tier(0),null);assert.equal(MP.tier(null),null);
ok('L2','top 3 black-blue-gold, top 10 blue-gold, top 20 gold, top 50 silver, the rest bronze');

// L3 the draw
const N=List.players.length,counts=new Array(N).fill(0);
for(let i=0;i<20000;i+=1){
  const id='pair_'+randomBytes(32).toString('hex'),p=MP.picks(id,N);
  assert.notEqual(p.playerOne,p.playerTwo);counts[p.playerOne]+=1;counts[p.playerTwo]+=1;
  assert.deepEqual(MP.picks(id,N),p,'same id, same draw');
  // The first hex digit is the season count: changing it never changes the draw.
  for(const marker of ['1','3','5','a'])assert.deepEqual(MP.picks('pair_'+marker+id.slice(6),N),p);
}
const mean=40000/N;assert.ok(Math.min(...counts)>mean*0.5&&Math.max(...counts)<mean*1.6,`every player can be drawn, none favoured (${Math.min(...counts)}-${Math.max(...counts)})`);
assert.equal(MP.picks('pair_short',N),null);assert.equal(MP.picks(null,N),null);
const source=read('js/marqueePlayer.js');
for(const word of ['getDoc','setDoc','runTransaction','updateDoc','localStorage','indexedDB','Math.random'])assert.ok(!source.includes(word),`the draw uses no ${word}`);
ok('L3','both managers always get different players, the draw depends only on the random part of the Showdown id, and it reads, writes and stores nothing');

// L4 which Showdowns have one
const id='pair_a'+'0123456789abcdef'.repeat(4).slice(1);
const both=MP.forShowdown(id,MP.fromMs+1);
assert.ok(both&&both.playerOne.name&&both.playerTwo.name&&both.playerOne.name!==both.playerTwo.name);
assert.deepEqual(Object.keys(both.playerOne),['listVersion','rank','name','club','overall','potential','number','nation','nationCode','position','stats','tier']);
assert.deepEqual(MP.forNewShowdown(id),both,'the reveal and the career screens show the same players');
assert.deepEqual(MP.forShowdown(id,{toMillis:()=>MP.fromMs+1}),both,'a Firestore Timestamp works too');
for(const old of [MP.fromMs-1,null,undefined,'2026-10-29',NaN,{}])assert.equal(MP.forShowdown(id,old),null,`no MP for ${String(old)}`);
ok('L4','a Showdown confirmed before r86 (or with no confirm time at all) has no Marquee Player; one confirmed after has the same pair the reveal showed');

// L5 old reads and the career model
const fixture=JSON.parse(read('tests/fixtures/data-contract-v1/multi-showdown-career.json'));
const showdowns=fixture.career.history.showdowns;assert.ok(showdowns.length>1);
for(const row of showdowns)assert.equal(row.setupConfirmedAt??null,null,'old fixtures carry no confirm time');assert.ok(showdowns.some(row=>Object.hasOwn(row,'setupConfirmedAt')));
const reader=read('js/sparkCompletedShowdownReader.js'),adapter=read('js/sharedClosedShowdownAdapter.js'),analytics=read('js/sharedCareerAnalytics.js');
assert.match(reader,/setupConfirmedAt:Number\.isFinite\(fields\.setupConfirmedAt\)\?fields\.setupConfirmedAt:null/);
assert.match(adapter,/entry\.setupConfirmedAt=Number\.isFinite\(read\.setupConfirmedAt\)\?read\.setupConfirmedAt:null/);
assert.match(analytics,/setupConfirmedAt:Number\.isFinite\(entry\.setupConfirmedAt\)\?entry\.setupConfirmedAt:null/);
assert.equal(typeof Adapter.buildClosedCareerInput,'function');assert.equal(typeof Analytics.buildCareerModel,'function');
// Nothing Marquee goes into a protocol document: no producer of a hashed or verified document mentions it.
for(const file of fs.readdirSync(path.join(ROOT,'js')).filter(f=>/^(spark|production|shared)[A-Za-z]*\.js$/.test(f)))assert.ok(!/marquee/i.test(read('js/'+file).replace(/\/\/[^\n]*/g,'')),`${file} stays Marquee-free`);
ok('L5','older reads and saves carry a null confirm time (no MP, still ready); no protocol module writes or verifies anything Marquee');

// L6 every Marquee club has a drawn crest (HO-038): the 15 clubs outside the five leagues have their own recipes, and the
// launch-dataset names of catalog clubs (FC Barcelona, Inter ...) resolve to the catalog crest, never the generated fallback.
{
  const vm=require('node:vm');const sandbox={window:{},document:{createElement:()=>({})},console};sandbox.window=sandbox;
  vm.runInNewContext(read('js/visualIdentity.js'),sandbox,{filename:'js/visualIdentity.js'});
  const clubs=[...new Set(List.players.map(p=>p.club).filter(Boolean))];
  for(const club of clubs){const id=sandbox.getClubIdentity(club);assert.notEqual(id.recipe.notes,'generated fallback crest',`${club} has a drawn crest`);assert.ok(!/generated/.test(JSON.stringify(id.recipe)),`${club} is not a generated crest`);}
  assert.equal(sandbox.getClubIdentity('FC Barcelona'),sandbox.getClubIdentity('Barcelona'),'dataset names share the catalog identity');
  assert.equal(sandbox.getClubIdentity('Inter').crest,sandbox.getClubIdentity('Inter Milan').crest);
}
ok('L6','all launch-list clubs draw a real crest: 15 new ones (HO-038) plus the dataset names mapped to the catalog clubs');

console.log(`PASS r86 Marquee Player contracts: ${checks} numbered checks (list, badges, draw, which Showdowns, old saves, crests).`);
