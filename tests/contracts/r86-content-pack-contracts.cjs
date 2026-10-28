'use strict';
// r86 content pack (Nik 2026-10-27 "All three"; placements picked 2026-10-28 "A B A A"): commentator lines, front pages,
// club cards and Marquee Player scouting cards, written once and shipped as static data. Pins the shape, the counts, the
// slots each line may use, the no-tiebreak rule, no hard-coded manager names, and that every club and player is covered.
const assert=require('node:assert/strict');
const Lines=require('../../data/commentaryLines.js');
const Pages=require('../../data/frontPages.js');
const Clubs=require('../../data/clubCards.js');
const Scouting=require('../../data/scoutingCards.js');
const MP=require('../../data/marqueePlayers.js');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const clubSandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../data/clubs.js'),'utf8')+';this.out=clubsByLeague;',clubSandbox);
const CATALOG=Object.values(clubSandbox.out).flat();
const RESULT_SLOTS=new Set('winner loser winnerClub loserClub winnerPoints loserPoints margin season seasons leader trailer totalLeader totalTrailer managerA managerB clubA clubB points'.split(' '));
const CLUB_SLOTS=new Set(['manager','rival','rivalClub','season']);
const FORBIDDEN=/tie-?break|goal difference|edged it|on goals|\b(Daniel|Nik)\b/i;
const words=s=>String(s).trim().split(/\s+/).length;
const slots=(text,allowed,label)=>{for(const m of String(text).matchAll(/\{([^}]*)\}/g))assert.ok(allowed.has(m[1]),`${label}: slot {${m[1]}}`);};
const clean=(row,label)=>assert.ok(!FORBIDDEN.test(JSON.stringify(row)),`${label}: tiebreak wording or a manager name`);
const between=(text,lo,hi,label)=>{const n=words(text);assert.ok(n>=lo&&n<=hi,`${label}: ${n} words`);};
const unique=(list,key,label)=>assert.equal(new Set(list.map(key)).size,list.length,`${label} unique`);

// K1 result commentary
const SITUATIONS=['big-win','narrow-win','comfortable-win','draw','champions-league','europa-league','league-title','cup-double','no-trophy','comeback','lead-extended','level-overall','winning-streak','streak-broken','opening-season','halfway','final-season-decider','showdown-won','showdown-drawn','golden-showdown','one-season-sprint','dominant-run','rivalry-history','season-preview'];
assert.equal(Lines.results.length,1500);unique(Lines.results,r=>r.id,'line ids');unique(Lines.results,r=>r.text,'line texts');
for(const r of Lines.results){assert.deepEqual(Object.keys(r),['id','situation','text']);assert.ok(SITUATIONS.includes(r.situation),r.id);slots(r.text,RESULT_SLOTS,r.id);clean(r,r.id);between(r.text,8,28,r.id);}
for(const s of SITUATIONS)assert.ok(Lines.results.filter(r=>r.situation===s).length>=60,`${s} has lines`);
ok('K1','1,500 result lines across 24 situations, each 8-28 words, only result slots, no tiebreak wording, no names');

// K2 club-history commentary
assert.equal(Lines.clubs.length,490);
for(const r of Lines.clubs){assert.deepEqual(Object.keys(r),['club','mood','text']);assert.ok(CATALOG.includes(r.club),r.club);assert.ok(['win','draw','trophy','any'].includes(r.mood));slots(r.text,CLUB_SLOTS,r.club);clean(r,r.club);between(r.text,8,28,r.club);}
for(const club of CATALOG)assert.equal(Lines.clubs.filter(r=>r.club===club).length,5,club);
ok('K2','5 history lines for every one of the 98 catalog clubs, with only club slots');

// K3 front pages
const FINAL_SITUATIONS=['showdown-won-1-season','showdown-won-3-seasons','showdown-won-5-seasons','golden-showdown-won','showdown-drawn','won-on-the-final-day','dominant-win'];
assert.equal(Pages.season.length,200);assert.equal(Pages.final.length,80);
for(const [list,keys,sits] of [[Pages.season,['id','situation','headline','subhead'],SITUATIONS],[Pages.final,['id','situation','headline','subhead','kicker'],FINAL_SITUATIONS]]){
  unique(list,p=>p.id,'page ids');unique(list,p=>p.headline,'headlines');
  for(const p of list){assert.deepEqual(Object.keys(p),keys);assert.ok(sits.includes(p.situation),p.id);slots(p.headline+' '+p.subhead,RESULT_SLOTS,p.id);clean(p,p.id);between(p.headline,3,8,p.id);between(p.subhead,12,24,p.id);if(p.kicker!==undefined)between(p.kicker,1,3,p.id);}
}
for(const s of FINAL_SITUATIONS)assert.ok(Pages.final.some(p=>p.situation===s),s);
ok('K3','200 season front pages and 80 Final Winner pages, every Final situation covered');

// K4 club cards and scouting cards
assert.deepEqual(Clubs.cards.map(c=>c.club).sort(),[...CATALOG].sort());
for(const c of Clubs.cards){assert.deepEqual(Object.keys(c),['club','league','city','nickname','stadium','story','challenge']);clean(c,c.club);between(c.story,20,35,c.club);between(c.challenge,8,16,c.club);assert.ok(c.city&&c.stadium,c.club);}
assert.equal(Scouting.cards.length,MP.players.length);
Scouting.cards.forEach((s,i)=>{const p=MP.players[i];assert.deepEqual(Object.keys(s),['rank','name','club','position','style','report','special']);assert.equal(s.rank,p.rank);assert.equal(s.name,p.name);assert.equal(s.club??null,p.club??null);assert.match(s.position,/^(GK|CB|LB|RB|LWB|RWB|CDM|CM|CAM|LM|RM|LW|RW|CF|ST)$/);clean(s,s.name);between(s.style,2,4,s.name);between(s.report,25,40,s.name);between(s.special,8,14,s.name);});
ok('K4','a club card for each catalog club and a scouting card for each Marquee Player, in list order');

console.log(`PASS r86 content pack contracts: ${checks} numbered checks (results, club history, front pages, cards).`);
