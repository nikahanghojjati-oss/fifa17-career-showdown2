'use strict';
// r87 Touchline Gazette (Nik 2026-10-31: a SEASON edition after each Season Results, a FINAL edition after Final Winner, each
// its own page with one CONTINUE). Team V's HO-041 newspaper with the HO-048 copy (approved by Nik 2026-10-31), filled by
// js/touchlineGazette.js from what the screen already holds. Pins: the same paper for the same Showdown and season on both
// phones, rows picked by situation from only the true situations (equal points are a DRAW, no tiebreak), no row repeated
// across one Showdown, every placeholder filled, no "Marquee", zero Firestore reads or writes, and CONTINUE running exactly
// the step the tapped button ran (the flow goes on to the same next screen, and a paper is never shown twice or in the way).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const G=require('../../js/touchlineGazette.js');
const Copy=require('../../data/gazetteCopy.js');
const Pages=require('../../data/frontPages.js');
const Season=require('../../js/seasonFinalV10.js');
const fx=require('../support/active-showdown-fixtures.cjs');
const {projection,result}=require('../support/career-fixture-helpers.cjs');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// Season results, by Showdown points: CL 5, EL 3, league title 3, cup 1, performance 1, awards 1 (11 at most).
const R={
  max:result({leaguePosition:1,leaguePoints:101,championsLeague:true,domesticCup:true,topScorer:true}), // 11
  clLeague:result({leaguePosition:1,championsLeague:true}), // 8
  cl:result({championsLeague:true}), // 5
  league:result({leaguePosition:1}), // 3
  cupAward:result({domesticCup:true,topScorer:true}), // 2
  cup:result({domesticCup:true}), // 1
  none:result({leaguePosition:9}) // 0
};
const proj=(seed,T,seasons)=>projection({seed,totalSeasons:T,seasons});
const sp={daniel:{name:'Lionel Messi'},nik:{name:'Cristiano Ronaldo'}};
const frame=p=>Season.finalFrame(fx.finalReconciliation(p),fx.closed(p),fx.history(p));
const DRAW_SITUATIONS=new Set(['draw','level-overall','final-season-decider']);

// G1 the same Showdown and season always print the same paper; the Showdown id steers the choice.
{
  const p=proj('a',3,[[R.clLeague,R.cupAward],[R.cl,R.cl]]);
  const a=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp}),b=G.seasonEdition({projection:JSON.parse(JSON.stringify(p)),seasonNumber:1,specialPlayers:sp});
  assert.ok(a&&Object.isFrozen(a));assert.equal(a.key,`${p.rivalryId}|season|1`);assert.equal(G.paperText(a),G.paperText(b));assert.deepEqual(a.ids,b.ids);
  assert.notEqual(G.paperText(a),G.paperText(G.seasonEdition({projection:p,seasonNumber:2})),'another season, another paper');
  const heads=new Set();for(const seed of '0123456789abcdef')heads.add(G.seasonEdition({projection:proj(seed,3,[[R.clLeague,R.cupAward]]),seasonNumber:1}).paper.headline);
  assert.ok(heads.size>=8,`the Showdown id steers the paper (${heads.size} headlines over 16 Showdowns with the same season)`);
  const f1=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])}),f2=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])});
  assert.equal(f1.key,`${'pair_'+'b'.repeat(64)}|final|3`);assert.equal(G.paperText(f1),G.paperText(f2));
  ok('G1','one paper per Showdown + season (+ edition), the same on every run, chosen by the Showdown id');
}

// G2 both phones print the same paper: nothing about who is looking reaches the choice.
{
  const p=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max]]);
  const daniel={...fx.history(p),managerRole:'playerOne'},nik={...fx.history(p),managerRole:'playerTwo',runtimeRevision:'other'};
  const a=G.seasonEdition(G.seasonInput({history:daniel,specialPlayers:sp})),b=G.seasonEdition(G.seasonInput({history:nik,specialPlayers:sp}));
  assert.ok(a&&b);assert.equal(G.paperText(a),G.paperText(b));assert.equal(a.paper.left.name,'Daniel');assert.equal(a.paper.right.name,'Nik');
  const full=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max],[R.none,R.cup]]),fr=frame(full);
  const fa=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerOne'}})),fb=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerTwo'}}));
  assert.ok(fa&&fb);assert.equal(G.paperText(fa),G.paperText(fb));
  const src=read('js/touchlineGazette.js');assert.ok(!/managerRole|managerId|CareerModeIdentity|getIdentity|accountId|deviceId/.test(src),'the Gazette never reads who is looking');
  ok('G2','Daniel\'s and Nik\'s phones print the same season and final papers (Daniel on the left, Nik on the right)');
}

// G3 equal points are a DRAW: drawn pages only, kicker DRAWN, never a winner, no tiebreak (seasons won do not count).
{
  const p=proj('d',3,[[R.cl,R.cl]]);const e=G.seasonEdition({projection:p,seasonNumber:1});
  assert.equal(e.winner,'draw');assert.equal(e.paper.kicker,'DRAWN');assert.equal(e.situation,'draw');assert.equal(e.paper.variant,'draw');assert.equal(e.paper.photo.name,'GZ_LEAD_DRAW');
  assert.deepEqual(G.seasonSituations(p,1),['draw']);
  assert.ok(!/\bwins\b|\bwinner\b|\bbeat\b/i.test([e.paper.kicker,e.paper.headline].join(' ')));
  for(const seed of '0123456789abcdef'){
    const d=G.seasonEdition({projection:proj(seed,3,[[R.league,R.cup],[R.cup,R.cup]]),seasonNumber:2});
    assert.equal(d.paper.kicker,'DRAWN');assert.ok(DRAW_SITUATIONS.has(d.situation),d.situation);
    assert.ok(Pages.season.find(r=>r.id===d.ids.headline).situation===d.situation);
    const row=Pages.season.find(r=>r.id===d.ids.headline),story=Copy.stories.find(s=>s.id===d.ids.story);
    assert.ok(!/\{(winner|loser)/.test(JSON.stringify([row,story])),'a drawn season never takes a winner row');
  }
  // Final: Daniel wins two of three seasons, Nik's one big season levels the totals: a drawn Showdown, no tiebreak.
  const level=proj('e',3,[[R.cup,R.none],[R.cup,R.none],[R.none,R.cupAward]]);
  assert.equal(level.managerRecords.playerOne.totalPoints,level.managerRecords.playerTwo.totalPoints);
  const f=G.finalEdition({projection:level,final:frame(level)});
  assert.equal(f.winner,'draw');assert.equal(f.situation,'showdown-drawn');assert.equal(f.paper.kicker,'DRAWN');assert.equal(f.paper.photo.name,'GZ_LEAD_DRAW');assert.equal(f.paper.portrait,null);
  assert.ok(!f.paper.briefs.some(b=>b.trophy==='TRO_SHOWDOWN_CHAMPION'),'nobody gets the Showdown trophy on a draw');
  assert.ok(!/tie-?break|goal difference|head[- ]to[- ]head|on goals|seasons won/i.test(G.paperText(f)));
  ok('G3','equal points print a DRAW (season and final), from the drawn pages only, with no winner, trophy or tiebreak');
}

// G4 only true situations are offered, and a paper never contradicts the screen.
{
  const sit=(seasons,N,T=3)=>G.seasonSituations(proj('f',T,seasons),N);
  assert.ok(sit([[R.cupAward,R.cup]],1).includes('narrow-win'));assert.ok(!sit([[R.cupAward,R.cup]],1).includes('big-win'),'a 1-point win is never a big win');
  assert.ok(sit([[R.clLeague,R.cupAward]],1).includes('big-win'));assert.ok(sit([[R.cl,R.cupAward]],1).includes('comfortable-win'));
  assert.ok(sit([[R.cl,R.league]],1).includes('champions-league'));assert.ok(!sit([[R.cl,R.cl]],1).includes('champions-league'));
  assert.ok(sit([[R.none,R.cl],[R.cl,R.none]],2).includes('level-overall'));
  assert.ok(sit([[R.none,R.max],[R.cl,R.none]],2).includes('comeback'));assert.ok(sit([[R.cl,R.none],[R.cl,R.none]],2).includes('lead-extended'));
  assert.ok(sit([[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]],3,5).includes('winning-streak'));assert.ok(!sit([[R.cl,R.none],[R.cl,R.none]],2,5).includes('winning-streak'));
  assert.ok(sit([[R.cl,R.none],[R.cup,R.none]],2).includes('final-season-decider'),'shown before the last season');
  assert.ok(!sit([[R.max,R.none],[R.max,R.none]],2).includes('final-season-decider'),'not when the last season can no longer settle it');
  assert.ok(!sit([[R.cl,R.none]],1).includes('final-season-decider'));
  assert.equal(G.seasonEdition({projection:proj('f',3,[[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]]),seasonNumber:3}),null,'the last season is told by the final edition');
  // a bonus-only win never prints silverware talk
  for(const seed of '0123456789abcdef'){const e=G.seasonEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none]]),seasonNumber:1});assert.ok(!/silver|troph|cabinet|shelf|title|crown|medal|cup\b/i.test([e.paper.headline,e.paper.subhead,...e.paper.story.paragraphs,e.paper.quote?.text||''].join(' ')),e.paper.headline);}
  // final situations
  const fin=(seed,T,seasons)=>G.finalEdition({projection:proj(seed,T,seasons)});
  assert.equal(fin('1',1,[[R.cl,R.none]]).situation,'showdown-won-1-season');
  const ten=Array.from({length:10},()=>[R.max,R.clLeague]);const golden=fin('2',10,ten);
  assert.equal(golden.situation,'golden-showdown-won');assert.equal(golden.golden,true);assert.equal(golden.paper.variant,'gold');assert.equal(golden.paper.photo.name,'GZ_LEAD_GOLD');
  const tenPlain=fin('3',10,Array.from({length:10},(x,i)=>i%2?[R.cl,R.league]:[R.league,R.cup]));
  assert.ok(['showdown-won-5-seasons','dominant-win','won-on-the-final-day'].includes(tenPlain.situation),tenPlain.situation);assert.equal(tenPlain.golden,false);
  const lastDay=G.finalEdition({projection:proj('4',3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])});
  const lastSits=new Set();for(const seed of '0123456789abcdef')lastSits.add(G.finalEdition({projection:proj(seed,3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])}).situation);
  assert.ok([...lastSits].every(s=>['showdown-won-3-seasons','won-on-the-final-day'].includes(s))&&lastSits.has('won-on-the-final-day'),[...lastSits].join());
  assert.equal(lastDay.winner,'Daniel');
  const domSits=new Set();for(const seed of '0123456789abcdef')domSits.add(G.finalEdition({projection:proj(seed,3,[[R.max,R.none],[R.max,R.none],[R.none,R.cl]])}).situation);
  assert.ok([...domSits].every(s=>['showdown-won-3-seasons','dominant-win'].includes(s))&&domSits.has('dominant-win'),[...domSits].join());
  // the Final Winner frame and the paper never disagree
  const p=proj('5',3,[[R.cl,R.none],[R.cup,R.none],[R.none,R.cup]]),fr=frame(p);
  assert.ok(G.finalEdition({projection:p,final:fr}));assert.equal(G.finalEdition({projection:p,final:{...fr,winner:'nik'}}),null);assert.equal(G.finalEdition({projection:p,final:{...fr,totals:{daniel:1,nik:0}}}),null);
  ok('G4','situations are true to the scores (margins, trophies, overall table, streaks, last-season decider, golden, last-day, dominant) and agree with Final Winner');
}

// G5 every paper of hundreds of Showdowns: printed, placeholders filled, no "Marquee", no repeats inside one Showdown.
{
  let seed=11;const rnd=()=>(seed=(Math.imul(seed,1103515245)+12345)>>>0)/4294967296;
  const one=()=>rnd()<0.15?R.none:result({leaguePosition:rnd()<0.35?1:2+Math.floor(rnd()*8),...(rnd()<0.25?{championsLeague:true}:rnd()<0.2?{europaLeague:true}:{}),domesticCup:rnd()<0.3,topScorer:rnd()<0.2,topAssist:rnd()<0.15,leaguePoints:60+Math.floor(rnd()*45)});
  let papers=0;const seen=new Set();
  for(let n=0;n<400;n+=1){
    const T=[1,3,5,10][n%4],seasons=[];for(let i=0;i<T;i+=1)seasons.push(rnd()<0.12?(r=>[r,r])(one()):[one(),one()]);
    const p={...proj((n%16).toString(16),T,seasons),rivalryId:'pair_'+(n.toString(16)+'0'.repeat(64)).slice(0,64)};
    const heads=[],stories=[];
    for(let N=1;N<T;N+=1){
      const e=G.seasonEdition({projection:p,seasonNumber:N,specialPlayers:sp});assert.ok(e,`season ${N} of Showdown ${n}`);papers+=1;seen.add(e.situation);
      const t=G.paperText(e);assert.ok(!/[{}]/.test(t),`braces: ${n}/${N}`);assert.ok(!/marquee/i.test(t),`Marquee: ${n}/${N}`);
      assert.equal(e.paper.left.score===e.paper.right.score,e.winner==='draw');heads.push(e.ids.headline);stories.push(e.ids.story);
    }
    assert.equal(new Set(heads).size,heads.length,`a headline repeated in Showdown ${n}`);assert.equal(new Set(stories).size,stories.length,`a story repeated in Showdown ${n}`);
    const f=G.finalEdition({projection:p,specialPlayers:sp});assert.ok(f,`final of Showdown ${n}`);papers+=1;seen.add('F:'+f.situation);
    const t=G.paperText(f);assert.ok(!/[{}]/.test(t)&&!/marquee/i.test(t),`final ${n}`);assert.ok(!/next season|next year/i.test(t),`final ${n} looks ahead`);
  }
  for(const s of ['big-win','comfortable-win','narrow-win','draw','champions-league','europa-league','league-title','comeback','lead-extended','level-overall','winning-streak','final-season-decider','F:showdown-won-1-season','F:showdown-won-3-seasons','F:showdown-won-5-seasons','F:showdown-drawn','F:won-on-the-final-day','F:dominant-win'])assert.ok(seen.has(s),`never printed: ${s}`);
  assert.ok(!/marquee/i.test(read('js/touchlineGazette.js').replace(/\/\/.*$/gm,'').replace(/BANNED=\/marquee\/i/,'')),'screen words say Special Player or SP');
  ok('G5',`${papers} papers over 400 Showdowns: all printed, every placeholder filled, no "Marquee", no headline or story repeated within a Showdown, finals never look ahead`);
}

// G14 (Fable cloud job 1) "1 seasons" is printed as "1 season": a drawn 1-season Showdown's pages say "After 1 season", never "1 seasons".
{
  assert.equal(G.fill('After {seasonsTotal} seasons, {points} points',{seasonsTotal:1,points:1}),'After 1 season, 1 point');
  assert.equal(G.fill('{seasonsTotal} seasons',{seasonsTotal:3}),'3 seasons');
  let singular=0;
  for(const seed of '0123456789abcdef'){const f=G.finalEdition({projection:proj(seed,1,[[R.league,R.league]])});assert.equal(f.situation,'showdown-drawn');const t=G.paperText(f);assert.ok(!/\b1 seasons\b/.test(t),t);if(/\b1 season\b/.test(t))singular+=1;}
  assert.ok(singular>0,'a row with {seasonsTotal} seasons printed for a 1-season Showdown');
  ok('G14','"1 seasons" is printed as "1 season" (the plural fix covers seasons as well as points)');
}
// G15 (Fable cloud job 1) the last-season decider is offered only while the trailer can still WIN the Showdown in the last
// season: a gap of 11 can only be levelled (equal totals are a draw), so its pages ("whoever wins it", "turn it upside down",
// "change of monarch") are not printed then.
{
  const sit=(seasons,N,T=3)=>G.seasonSituations(proj('f',T,seasons),N);
  assert.ok(!sit([[R.max,R.none],[R.none,R.none]],2).includes('final-season-decider'),'gap 11: the trailer can at best level it');
  assert.ok(sit([[R.clLeague,R.none],[R.cupAward,R.none]],2).includes('final-season-decider'),'gap 10: still winnable');
  assert.ok(sit([[R.cl,R.cl],[R.cup,R.cup]],2).includes('final-season-decider'),'level before the last season');
  for(const seed of '0123456789abcdef'){const e=G.seasonEdition({projection:proj(seed,3,[[R.max,R.none],[R.none,R.none]]),seasonNumber:2});assert.notEqual(e.situation,'final-season-decider');assert.ok(!/whoever wins|upside down|change of monarch|sudden death/i.test(G.paperText(e)),e.paper.headline);}
  ok('G15','the last-season decider needs a gap of at most 10 (a gap of 11 can only be levelled, never turned)');
}
// G16 (Fable cloud job 1) the dominant pages (landslides, "from start to finish", "out of sight by the end") print only when
// the winner was ahead after every season, out of reach before the last one and still more than a season clear at the end.
{
  const fin=(seed,T,seasons)=>G.finalEdition({projection:proj(seed,T,seasons)});
  const sits=(T,seasons)=>{const s=new Set();for(const seed of '0123456789abcdef')s.add(fin(seed,T,seasons).situation);return s;};
  assert.ok(sits(3,[[R.max,R.none],[R.max,R.none],[R.none,R.cl]]).has('dominant-win'),'led throughout, out of reach before the last, 17 clear at the end');
  assert.ok(!sits(3,[[R.max,R.none],[R.max,R.none],[R.none,R.max]]).has('dominant-win'),'out of reach before the last but only 11 clear at the end: no landslide');
  assert.ok(!sits(5,[[R.none,R.cl],[R.max,R.none],[R.max,R.none],[R.max,R.none],[R.max,R.none]]).has('dominant-win'),'behind after season 1: not "from start to finish"');
  assert.ok(!sits(5,[[R.cl,R.cl],[R.max,R.none],[R.max,R.none],[R.max,R.none],[R.max,R.none]]).has('dominant-win'),'level after season 1: not "from start to finish"');
  for(const seed of '0123456789abcdef'){const f=fin(seed,3,[[R.max,R.none],[R.max,R.none],[R.none,R.max]]);assert.ok(!/landslide|ocean|laps and laps|out of sight|run away with|by a distance|enormous lead/i.test(G.paperText(f)),f.paper.headline);}
  ok('G16','dominant pages need a lead after every season, an unreachable gap before the last season and more than a season clear at the end');
}
// G17 (Fable cloud job 1) no silverware talk where there is no trophy on the page: the ears obey the same rule as the headline,
// story, quote and caption, a drawn season without a trophy either side prints none, nor does a drawn Showdown without one.
{
  const silver=/silver|troph|cabinet|shelf|shelves|title|crown|medal|engrav|plaque|\bcups?\b|display case|glass case/i;
  const parts=e=>[e.paper.headline,e.paper.subhead,...e.paper.ears,e.paper.photo.caption,...e.paper.story.paragraphs,e.paper.quote?.text||''].join(' ');
  for(const seed of '0123456789abcdef'){
    const bonus=G.seasonEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none]]),seasonNumber:1});assert.ok(!silver.test(parts(bonus)),'bonus-only win: '+parts(bonus));
    const nil=G.seasonEdition({projection:proj(seed,10,[[R.none,R.none],[result({topScorer:true}),result({leaguePoints:100})]]),seasonNumber:2});assert.equal(nil.winner,'draw');assert.ok(!silver.test(parts(nil)),'trophy-less draw: '+parts(nil));
    const both=G.seasonEdition({projection:proj(seed,3,[[R.cup,R.cup]]),seasonNumber:1});assert.ok(both.paper.ears.every(Boolean),'two ears');
    const level=G.finalEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none],[R.none,result({topScorer:true})],[R.none,R.none]])});assert.equal(level.situation,'showdown-drawn');assert.ok(!silver.test(parts(level)),'trophy-less drawn Showdown: '+parts(level));
    const won=G.finalEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none],[R.none,R.none],[R.none,R.none]])});assert.ok(won.paper.briefs[0].trophy==='TRO_SHOWDOWN_CHAMPION','a won Showdown has its trophy');
  }
  // the walker prefers a situation whose headline and story are both unused in this Showdown (nine drawn 0-0 seasons never repeat a story)
  const zeros=Array.from({length:10},()=>[R.none,R.none]);const stories=[];for(let N=1;N<10;N+=1)stories.push(G.seasonEdition({projection:proj('7',10,zeros),seasonNumber:N}).ids.story);
  assert.equal(new Set(stories).size,stories.length,stories.join());
  ok('G17','no silverware talk without a trophy: ears included, trophy-less drawn seasons and Showdowns included; fresh situations preferred');
}
// G18 (Fable cloud job 1) the truth sweep, fixed seed: every score pair with a trophy mix as season 1, 2 and 9 of 10 and as the
// last season of 1, 3 and 5, plus the named final cases, through the mechanical checks (braces, undefined/NaN/null, "1 points",
// "marquee", foreign managers and clubs, invented numbers, both phones, null/throw); and the rows the full read found false,
// each now carrying its corrected words.
{
  const Sweep=require('../support/gazetteTruthSweep.cjs');
  const t0=Date.now();const report=Sweep.runFast();const secs=(Date.now()-t0)/1000;
  assert.equal(report.failures.length,0,JSON.stringify(report.failures.slice(0,5)));
  assert.ok(report.papers>1000&&report.summary.rowsPrinted>600,`${report.papers} papers, ${report.summary.rowsPrinted} rows`);
  assert.ok(secs<10,`fast sweep took ${secs}s`);
  for(const row of Object.values(report.rows)){
    if(row.situation==='dominant-win'){assert.ok(Object.keys(row.facts.margin).every(m=>Number(m)>11),row.id+' margin');assert.deepEqual(Object.keys(row.facts.ledThroughout),['true'],row.id+' led');}
    if(row.situation==='final-season-decider')assert.ok(Object.keys(row.facts.gap).every(g=>Number(g)<=10),row.id+' gap');
    if(row.kind==='ear'&&/silver|troph|cabinet|shelf|shelves|title|crown|medal|engrav|plaque|\bcups?\b/i.test(row.template))assert.ok(!row.facts.winnerTrophies||!row.facts.winnerTrophies['0'],row.id+' on a trophy-less win');
    for(const text of row.texts)assert.ok(!/\b1 seasons\b|\b1 points\b/.test(text),row.id);
  }
  const FALSE_ROWS={
    'h1-002':[/Corner after corner was filled/,/Not a corner was left empty/],'h1-033':[/took the pick of the honours/,/cleared the table of honours/],'h1-110':[/NARROWLY SKETCHED ENDING/,/DRAWN/],
    'h1-127':[/FULL TIME, FULL RESPECT/,/HALF TIME/],'h1-220':[/a contest leaning the other way/,/once leaning/],'h1-235':[/narrowed the previous gap/,/closed the previous gap/],
    'h1-252':[/Before this season \{leader\} held/,/From the outset/],'h1-380':[/\{trailer\} is far from finished/,/The chaser is/],'h1-383':[/After the seasons of preparation/,/many seasons/],
    'h1-387':[/This one decides who will be remembered/,/Whoever owns this one/],'h1-388':[/then the Showdown is over/,/must produce a winner/],
    'h2-004':[/a single season that ended/,/tight season/],'h2-029':[/never allowed a second season/,/never allowed a rematch/],'h2-042':[/finished as the Showdown winners/,/clear Showdown winners/],
    'h2-044':[/came out on top of the \{seasonsTotal\}-part saga/,/from the front/],'h2-064':[/reached the end of it first/,/without ever losing the way/],'h2-066':[/still playing the lead when the music stopped/,/best of the music for last/],
    'h2-103':[/lasted \{seasonsTotal\} seasons/,/a great many seasons/],'h2-172':[/ends in deadlock/,/held through the whole Showdown/],'h2-189':[/TOOK HOLD AT THE FINISH/,/refused to let go/],
    'h2-192':[/A FINISH OF NERVE/,/COMEBACK/],'h2-198':[/passed \{loser\} at the line/,/edged \{loser\}/],'h2-201':[/THE CROWN SETTLED LATE/,/wore it in turn/],
    'h2-220':[/was in it all the way/,/chased all the way/],'h2-221':[/The question stayed open all the way/,/Margins narrowed/],'h2-246':[/The lead was built early/,/Each season added to the lead/],
    's-014':[/merely one round of a long argument/,/opening round/],'s-097':[/spent the whole Showdown trading blows/,/spent years/],'s-101':[/traded blows, pressure and nerves/,/traded the lead/],
    's-103':[/who came home by \{margin\}/,/edged home|sounds small/],'s-104':[/Late finishes are the stuff of memory/,/Close finishes|how near the distance/],'s-107':[/kept the question open for long stretches/,/inseparable/],
    's-108':[/came through when \{loser\} pushed hardest/,/held on when/],'s-114':[/tilted early and stayed tilted/,/kept tilting/]
  };
  const rowText=id=>{const r=[...Pages.season,...Pages.final].find(r=>r.id===id);if(r)return JSON.stringify(r);const st=Copy.stories.find(s=>s.id===id);return st?JSON.stringify(st):null;};
  for(const [id,[must,mustNot]] of Object.entries(FALSE_ROWS)){const text=rowText(id);assert.ok(text,id);assert.match(text,must,id);assert.doesNotMatch(text,mustNot,id);}
  assert.equal(Object.keys(FALSE_ROWS).length,34);
  ok('G18',`truth sweep (fixed seed): ${report.papers} papers, ${report.summary.rowsPrinted} printed rows, 0 mechanical failures in ${secs.toFixed(1)}s; the 34 rows the full read found false carry their corrected words`);
}

// G6 zero Firestore: the Gazette reads only what the screen already holds and writes nothing but one small local list.
{
  assert.equal(G.firestoreReads,0);assert.equal(G.firestoreWrites,0);
  for(const file of ['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','visual-assets/v10_1/content/frontpage.js']){
    const src=read(file).replace(/^\s*\/\/.*$/gm,"").replace(/firestore(Reads|Writes):0/g,"");assert.ok(!/firebase|firestore|getDocs?\(|setDoc|updateDoc|onSnapshot|runTransaction|collection\(|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/i.test(src),file);
  }
  assert.ok(/root\.writeStorageValue\(SEEN_KEY/.test(read('js/touchlineGazette.js'))&&!/\blocalStorage\b/.test(read('js/touchlineGazette.js')),'the seen list goes through js/storage.js');assert.equal(G.SEEN_KEY,'careerModeShowdown.gazetteSeen.v1');
  ok('G6','zero Firestore reads or writes: no Firebase, network or storage call besides the local seen list');
}

// ---------- a small page for the flow (just what js/touchlineGazette.js touches) ----------
// advance: replaces continueToNextSeason (a promise that takes its time, or fails). chipLate: the Special Player chip is not on
// the page at the tap and arrives through loadRuntimeScript. chipFails: the chip is there but its data cannot load.
// Timers of a second or more (safety timers, the asset cap) are captured in calls.longTimers and fired only by the test.
function world({loadFails=false,lateFiles=false,proceedResult=true,final=null,history,managerRole='playerOne',advance=null,chipLate=false,chipFails=false}={}){
  const capture=[],docListeners={},store=new Map(),calls={continue:0,ownSeason:0,ownBack:0,shown:[],loads:[],longTimers:[]};
  let screen='seasonEntry';
  class El{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parent=null;this.dataset={};this.attrs={};this.listeners={};this.classes=new Set();this.id='';this.disabled=false;this.textContent='';this.scrollTop=0;this.scrollHeight=0;this.offsetHeight=100;const self=this;this.style={setProperty(k,v){self.style[k]=v;}};this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c)};}
    set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.classes].join(' ');}
    get firstElementChild(){return this.children[0]||null;}
    appendChild(c){c.remove();c.parent=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
    before(c){const p=this.parent;c.remove();c.parent=p;p.children.splice(p.children.indexOf(this),0,c);}
    after(c){const p=this.parent;c.remove();c.parent=p;p.children.splice(p.children.indexOf(this)+1,0,c);}
    remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
    get isConnected(){let n=this;while(n.parent)n=n.parent;return n===doc.documentElement;}
    contains(n){while(n){if(n===this)return true;n=n.parent;}return false;}
    matches(sel){return sel.split(',').some(one=>{one=one.trim();if(/\s/.test(one))return false;const m=one.match(/^([a-z]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/i);if(!m)return false;if(m[1]&&m[1].toUpperCase()!==this.tagName)return false;if(m[2]&&m[2].slice(1)!==this.id)return false;return (m[3]||'').split('.').filter(Boolean).every(c=>this.classes.has(c));});}
    closest(sel){let n=this;while(n){if(n.matches(sel))return n;n=n.parent;}return null;}
    querySelector(sel){for(const c of this.children){if(c.matches(sel))return c;const d=c.querySelector(sel);if(d)return d;}return null;}
    setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}
    getBoundingClientRect(){return {top:0,left:0,width:0,height:0};}focus(){}
    click(){dispatch(this);}
  }
  const doc={documentElement:new El('html'),createElement:t=>new El(t),baseURI:'http://localhost/',
    getElementById(id){const walk=n=>{if(n.id===id)return n;for(const c of n.children){const d=walk(c);if(d)return d;}return null;};return walk(doc.documentElement);},
    addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f);}};
  doc.head=doc.documentElement.appendChild(new El('head'));const body=doc.documentElement.appendChild(new El('body'));
  const main=body.appendChild(new El('main'));const host=main.appendChild(new El('section'));host.id='seasonEntry';
  function dispatch(target){
    const ev={target,stopped:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;}};
    for(const f of capture)f(ev);
    if(!ev.stopped)for(let n=target;n;n=n.parent)for(const f of n.listeners.click||[])f(ev);
    return ev;
  }
  const go=to=>{screen=to;for(const f of docListeners['career-mode-screen-shown']||[])f({detail:{screen:to}});};
  // the Season Results continue button (production: js/productionSharedMultiSeasonProgression.js) and Final Winner's exit
  const seasonButton=host.appendChild(new El('button'));seasonButton.id='sharedMultiSeasonContinueAction';
  seasonButton.addEventListener('click',()=>{calls.ownSeason+=1;sandbox.CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason();});
  let back=null;
  if(final){
    host.classList.add('v10FinalMode');seasonButton.remove();
    const stage=host.appendChild(new El('div'));stage.className='v10FinalStage';const actions=stage.appendChild(new El('div'));actions.className='seasonEntryActions';
    back=actions.appendChild(new El('button'));back.className='backButton';back.addEventListener('click',()=>{calls.ownBack+=1;go('mainMenu');});
  }
  const sandbox={
    document:doc,console,Promise,URL,clearTimeout,innerHeight:900,
    setTimeout:(fn,ms,...rest)=>{if(ms>=1000){calls.longTimers.push({fn,ms});return -1;}return setTimeout(fn,ms,...rest);},
    addEventListener(t,f,cap){if(t==='click'&&cap)capture.push(f);},removeEventListener(){},scrollTo(){},
    matchMedia:()=>({matches:false}),
    readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,String(v));return true;},
    getActiveScreenName:()=>screen,optionalAssetUrl:p=>p+'?v=test',
    loadRuntimeScript:(key)=>{if(loadFails)return Promise.reject(new Error('offline'));const install=()=>{if(late[key]&&!sandbox[late[key][0]])sandbox[late[key][0]]=late[key][1];calls.loads.push(key);return true;};return lateFiles?new Promise(resolve=>setTimeout(()=>resolve(install()),60)):Promise.resolve(install());},loadRuntimeStyle:()=>loadFails?Promise.reject(new Error('offline')):Promise.resolve(true),
    Image:class{set src(v){setTimeout(()=>this.onload&&this.onload(),0);}decode(){return Promise.resolve();}},
    ShowdownContent:{frontPage:{art:n=>`visual-assets/v10_1/content/gazette/${n}.webp`,screen(slot,p,onContinue){
      calls.shown.push(p);const s=slot.appendChild(new El('section'));s.className='cmx-fp-screen';const t=s.appendChild(new El('h2'));t.className='cmx-fp-screen__title';
      const desk=s.appendChild(new El('div'));desk.className='cmx-fp-screen__desk';const paper=desk.appendChild(new El('article'));paper.className='cmx-paper';const photo=paper.appendChild(new El('figure'));photo.className='cmx-paper__photo';
      const b=s.appendChild(new El('button'));b.className='cmx-continue';b.addEventListener('click',()=>{if(onContinue)onContinue();});}}},
    CareerModeGazetteCopy:Copy,CareerModeFrontPages:Pages,
    CareerModeProductionSharedHistoryConvergence:{getState:()=>({...history,managerRole})},
    CareerModeProductionSharedMultiSeasonProgression:{canContinue:()=>true,continueToNextSeason:()=>{calls.continue+=1;if(advance)return advance();if(proceedResult)go('dashboard');return proceedResult;}},
    CareerModeSpecialPlayerChip:{liveFor:()=>sp,...(chipFails?{ensure:()=>Promise.resolve(false)}:{})},
    FINAL_WINNER_FIXTURES:final?{frames:{LIVE:final}}:undefined,CareerModeSeasonFinalV10:{gazetteHistory:()=>final?history:null}
  };
  // lateFiles: the paper, the copy and the headlines are not on the page yet when the player taps (a tap before warm() ends)
  const late={'gazette-frontpage':['ShowdownContent',sandbox.ShowdownContent],'gazette-copy':['CareerModeGazetteCopy',Copy],'gazette-headlines':['CareerModeFrontPages',Pages],'special-player-chip':['CareerModeSpecialPlayerChip',sandbox.CareerModeSpecialPlayerChip]};
  if(lateFiles)for(const key of ['gazette-frontpage','gazette-copy','gazette-headlines'])delete sandbox[late[key][0]];
  if(chipLate)delete sandbox.CareerModeSpecialPlayerChip;
  vm.createContext(sandbox);vm.runInContext(read('js/touchlineGazette.js'),sandbox,{filename:'touchlineGazette.js'});
  const api=sandbox.CareerModeTouchlineGazette;api.install();
  return {api,calls,host,doc,seasonButton,back,dispatch,go,store,screen:()=>screen,page:()=>doc.getElementById('touchlineGazette'),continueButton:()=>doc.getElementById('touchlineGazetteContinue')};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));

(async()=>{
  // G7 SEASON: CONTINUE TO SEASON N+1 opens the paper (its own page), and the paper's CONTINUE runs exactly that step, once.
  {
    const p=proj('6',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    const w=world({history});
    const ev=w.dispatch(w.seasonButton);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownSeason,0,'the tap is held while the paper shows');
    await settle();
    assert.ok(w.page(),'the paper is up');assert.equal(w.page().parent,w.host,'inside Season Results, replacing its stage (css hides the rest)');
    assert.equal(w.host.dataset.gazette,'season');assert.equal(w.doc.documentElement.dataset.gazette,'season');assert.equal(w.calls.continue,0);
    const expected=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp});assert.equal(w.calls.shown[0].headline,expected.paper.headline,'the paper on screen is the pure edition');
    assert.ok(w.page().querySelector('.tgz-sp'),'the Special Players line');
    const race=w.page().querySelector('.tgz-race');assert.ok(race,'THE RACE strip');assert.equal(race.children[1].textContent,expected.paper.race.line);
    // Nik's phone prints the same paper
    const n=world({history,managerRole:'playerTwo'});n.dispatch(n.seasonButton);await settle();assert.deepEqual(JSON.parse(JSON.stringify(n.calls.shown[0])),JSON.parse(JSON.stringify(w.calls.shown[0])));
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.continue,1,'continueToNextSeason ran once');assert.equal(w.screen(),'dashboard','the flow went on to the same next screen');
    assert.equal(w.page(),null,'the paper closed with the screen');assert.equal(w.host.dataset.gazette,undefined);assert.equal(w.doc.documentElement.dataset.gazette,undefined);
    // replay / reload: the same season's tap goes straight on (the paper is shown once per phone)
    w.go('seasonEntry');const again=w.dispatch(w.seasonButton);await settle();
    assert.equal(again.defaultPrevented,false);assert.equal(w.page(),null);assert.equal(w.calls.ownSeason,1);assert.equal(w.calls.continue,2);
    assert.deepEqual(JSON.parse(w.store.get(G.SEEN_KEY)),[`${p.rivalryId}|season|1`]);
    ok('G7','SEASON edition: shown on CONTINUE TO SEASON N+1, its CONTINUE runs continueToNextSeason once and lands on the same next screen; shown once per phone; both phones print the same paper');
  }
  // G8 FINAL: leaving Final Winner shows the final paper; its CONTINUE lets the same button through, untouched, once.
  {
    const p=proj('7',3,[[R.cl,R.none],[R.cup,R.league],[R.none,R.cup]]),history=fx.history(p),fr=frame(p);
    const w=world({history,final:fr});
    const ev=w.dispatch(w.back);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownBack,0);
    await settle();assert.ok(w.page());assert.equal(w.host.dataset.gazette,'final');
    assert.equal(w.calls.shown[0].headline,G.finalEdition({projection:p,final:fr}).paper.headline);
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.ownBack,1,'BACK TO SHOWDOWN HOME ran once, by its own listener');assert.equal(w.screen(),'mainMenu');assert.equal(w.page(),null);
    w.go('seasonEntry');w.dispatch(w.back);await settle();assert.equal(w.calls.ownBack,2,'second time: straight through');assert.equal(w.page(),null);
    ok('G8','FINAL edition: shown when leaving Final Winner, its CONTINUE lets that same button through once, to the same screen; never twice');
  }
  // G9 never in the way: files that do not load let the tap go on at once; a step that cannot go on closes the paper.
  {
    const p=proj('8',3,[[R.cl,R.none]]),history=fx.history(p);
    const off=world({history,loadFails:true});const ev=off.dispatch(off.seasonButton);assert.equal(ev.defaultPrevented,true);await settle();
    assert.equal(off.page(),null);assert.equal(off.calls.continue,1,'offline: the tap simply went on');assert.equal(off.screen(),'dashboard');
    const stuck=world({history,proceedResult:false});stuck.dispatch(stuck.seasonButton);await settle();assert.ok(stuck.page());
    stuck.dispatch(stuck.continueButton());await settle();assert.equal(stuck.calls.continue,1);assert.equal(stuck.page(),null,'Season Results is back with its own button');assert.equal(stuck.host.dataset.gazette,undefined);
    const src=read('js/touchlineGazette.js');assert.match(src,/ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500;/);
    ok('G9','the Gazette never holds anyone up: no files means the tap goes on, a step that cannot go on closes the paper');
  }
  // G11 a fast tap: CONTINUE pressed before the paper's files are on the page (warm() not finished) is still held for its
  // paper; the files load after the tap, the paper is built and shown, and its CONTINUE runs the same step once (Codex P2).
  {
    const p=proj('9',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    const w=world({history,lateFiles:true});
    const ev=w.dispatch(w.seasonButton);assert.equal(ev.defaultPrevented,true,'held although the copy is not loaded yet');assert.equal(w.calls.ownSeason,0);
    assert.equal(w.page(),null);await new Promise(resolve=>setTimeout(resolve,150));
    assert.deepEqual([...w.calls.loads].sort(),['gazette-copy','gazette-frontpage','gazette-headlines','special-player-chip','visual-identity']);
    assert.ok(w.page(),'the paper came up once its files arrived');assert.equal(w.calls.shown[0].headline,G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp}).paper.headline);
    w.dispatch(w.continueButton());await settle();assert.equal(w.calls.continue,1);assert.equal(w.screen(),'dashboard');assert.equal(w.page(),null);
    const q=proj('9',3,[[R.cl,R.none],[R.cup,R.league],[R.none,R.cup]]),fr=frame(q),f=world({history:fx.history(q),final:fr,lateFiles:true});
    assert.equal(f.dispatch(f.back).defaultPrevented,true);await new Promise(resolve=>setTimeout(resolve,150));
    assert.ok(f.page(),'final paper after a fast tap');f.dispatch(f.continueButton());await settle();assert.equal(f.calls.ownBack,1);assert.equal(f.screen(),'mainMenu');
    // a second tap while the files are still loading is held too (one paper, one step)
    const d=world({history,lateFiles:true});d.dispatch(d.seasonButton);assert.equal(d.dispatch(d.seasonButton).defaultPrevented,true);await new Promise(resolve=>setTimeout(resolve,150));
    assert.equal(d.calls.shown.length,1);assert.equal(d.calls.continue,0);
    ok('G11','a tap made before the paper\'s files arrive is still held for its paper (season and final), shown once, then the same step runs once');
  }
  // G12 (Fable job 2 F2-15) a SEASON paper stays until continueToNextSeason has finished or failed: no timer closes it while
  // the step is in flight, a busy CONTINUE never runs the step twice, and a failed step gives Season Results back with its
  // own working button.
  {
    const p=proj('a',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    let finish=null;const w=world({history,advance:()=>new Promise(resolve=>{finish=resolve;})});
    w.dispatch(w.seasonButton);await settle();assert.ok(w.page());
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.continue,1);assert.ok(w.page(),'the paper stays while continueToNextSeason runs');assert.equal(w.continueButton().disabled,true);assert.equal(w.continueButton().attrs['aria-busy'],'true');
    assert.ok(!w.calls.longTimers.some(t=>t.ms>=5000),'no long safety timer on a season paper');
    for(const t of w.calls.longTimers.splice(0))t.fn();await settle();
    assert.ok(w.page(),'no timer closes the paper mid-flight');assert.equal(w.host.dataset.gazette,'season');
    w.dispatch(w.continueButton());await settle();assert.equal(w.calls.continue,1,'a tap on the busy CONTINUE runs nothing more');
    w.go('dashboard');finish(true);await settle();
    assert.equal(w.page(),null,'closed with the screen it left for');assert.equal(w.calls.continue,1);assert.equal(w.host.dataset.gazette,undefined);
    // the step fails after a while: the paper closes, Season Results is back and its own button goes straight on, once
    let fail=null;const f=world({history,advance:()=>new Promise((resolve,reject)=>{fail=reject;})});
    f.dispatch(f.seasonButton);await settle();f.dispatch(f.continueButton());await settle();assert.ok(f.page());
    fail(new Error('offline'));await settle();assert.equal(f.page(),null);assert.equal(f.host.dataset.gazette,undefined);assert.ok(f.seasonButton.isConnected);
    const ev=f.dispatch(f.seasonButton);assert.equal(ev.defaultPrevented,false);await settle();assert.equal(f.calls.ownSeason,1);assert.equal(f.calls.continue,2);
    // the step finished (true) without leaving this screen, or said false: the paper closes at once
    for(const value of [true,false]){const s=world({history,advance:()=>Promise.resolve(value)});s.dispatch(s.seasonButton);await settle();s.dispatch(s.continueButton());await settle();assert.equal(s.page(),null,String(value));assert.equal(s.calls.continue,1);}
    assert.ok(!/SEASON_SAFETY_MS/.test(read('js/touchlineGazette.js')),'no season safety timer');
    ok('G12','F2-15: a season paper stays (CONTINUE busy) until continueToNextSeason has finished or failed, never closed by a timer mid-flight, the step never run twice, a failure hands Season Results back with a working button');
  }
  // G13 (Fable job 2 F2-16) both phones print the identical paper, Special Players line included: the chip and its data are
  // loaded as one of the paper's files, and the line is read when the paper is built, not at the tap.
  {
    const p=proj('b',3,[[R.cl,R.league]]),history=fx.history(p);
    const a=world({history}),b=world({history,managerRole:'playerTwo',chipLate:true});
    a.dispatch(a.seasonButton);b.dispatch(b.seasonButton);await settle();
    assert.ok(a.page()&&b.page());assert.ok(b.calls.loads.includes('special-player-chip'),'the chip is loaded with the paper\'s files');
    const plain=x=>JSON.parse(JSON.stringify(x));
    assert.deepEqual(plain(b.calls.shown[0]),plain(a.calls.shown[0]),'the same paper on the phone whose chip was missing at the tap');
    assert.deepEqual(plain(b.calls.shown[0].specialPlayers),{daniel:'Lionel Messi',nik:'Cristiano Ronaldo'});assert.ok(b.page().querySelector('.tgz-sp'));
    const full=proj('b',3,[[R.cl,R.league],[R.cup,R.none],[R.none,R.cup]]),fr=frame(full);assert.equal(fr.specialPlayers,undefined);
    const fa=world({history:fx.history(full),final:fr}),fb=world({history:fx.history(full),final:fr,managerRole:'playerTwo',chipLate:true});
    fa.dispatch(fa.back);fb.dispatch(fb.back);await settle();assert.ok(fa.page()&&fb.page());
    assert.deepEqual(plain(fb.calls.shown[0]),plain(fa.calls.shown[0]));assert.ok(fb.page().querySelector('.tgz-sp'),'final: the Special Players line on both phones');
    // the chip's data cannot load: no paper on this phone (the tap goes on), never a paper missing the line on one phone only
    const c=world({history,chipFails:true});c.dispatch(c.seasonButton);await settle();assert.equal(c.page(),null);assert.equal(c.calls.continue,1);
    ok('G13','F2-16: the Special Player chip is loaded with the paper\'s files and read when the paper is built, so both phones print the identical paper (season and final), line included');
  }
  // G10 the files: HO-048 copy byte for byte, shell-cached, fonts licensed, images on the V10 runtime cache, wired in once.
  {
    const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
    // Team V HO-048, origin/claude/project-thread-fyjnky 8fa67110 visual-assets/v10_1/content/{fixtures/gazetteCopy.js,fixtures/frontPages.js,frontpage.js,content.css},
    // with the Fable cloud job 1 truth edits to 26 headlines and 8 stories (G18 lists them): same rows, same ids, same counts.
    assert.equal(sha('data/gazetteCopy.js'),'2a3caf1dd4713f628e2fb39b83415a5b53b8372173148c88e482fd3715429d0d');
    assert.equal(sha('data/frontPages.js'),'1b73a935a115c2bdb5e8e28961ad1a26282f07fd68a2e353d55d5f26433ec70a');
    assert.equal(sha('visual-assets/v10_1/content/frontpage.js'),'a4b8ced9ac63123795bfe1d9ee2741027df7426466b5f5b5314c3bf55a58baf6');
    assert.equal(sha('visual-assets/v10_1/content/content.css'),'cfa7f1a4227673127ad34f59f5c0c4272248846cf3a456d2c814923ad0f6f7dc');
    assert.equal(Copy.stories.length,114);assert.equal(Copy.duets.length,288);for(const k of ['briefs','captions','ears','quotes'])assert.equal(Copy.small[k].length,30,k);
    assert.equal(Pages.contentVersion,2);assert.equal(Pages.season.length,477);assert.equal(Pages.final.length,258);
    const sw=read('service-worker.js'),added=new Set(JSON.parse(sw.match(/SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\((\[[^\]]*\])\)/)[1]));
    const files=['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','css/v10Gazette.css','visual-assets/v10_1/content/content.css','visual-assets/v10_1/content/frontpage.js',...G.FONT_FILES,...['unifrakturmaguntia','playfair-display','old-standard-tt'].map(f=>`visual-assets/v10_1/content/gazette/fonts/LICENSE-${f}.txt`)];
    for(const f of files){assert.ok(fs.existsSync(path.join(ROOT,f)),f);assert.ok(sw.includes(`  "${f}",`)&&added.has(f),`shell lists ${f} (and as added since r86)`);}
    assert.ok(!/content\/gazette\/GZ_[A-Z_]+\.webp/.test(sw),'press photos ride the V10 image runtime cache, not the shell');
    for(const f of G.FONT_FILES)assert.ok(/LICENSE|SIL Open Font License/i.test(read(`visual-assets/v10_1/content/gazette/fonts/LICENSE-${path.basename(f).split('-latin')[0]}.txt`)),f);
    assert.ok(!fs.readdirSync(path.join(ROOT,'visual-assets/v10_1/content')).some(f=>/\.(md|html|json)$/.test(f)),'reference files live in project-documents/r87/touchline-gazette');
    const sf=read('js/seasonFinalV10.js');
    assert.match(sf,/loadRuntimeScript\("touchline-gazette","js\/touchlineGazette\.js"/);assert.match(sf,/CareerModeTouchlineGazette\?\.install\?\.\(\)/);
    assert.match(sf,/sfGazetteHistory=final\.status==="ready"\?history:null;/);assert.match(sf,/gazetteHistory:\(\)=>sfGazetteHistory/);
    // Commentary v2 keeps its own 5,100 lines: HO-048's commentaryLines.js (24 different situations) is not swapped in.
    assert.equal(require('../../data/commentaryLines.js').results.length,5100);
    const css=read('css/v10Gazette.css');assert.ok(!/rgba\(0,\s*0,\s*0,\s*0?\.\d+\)\s*;?\s*\}?\s*$/m.test(css.replace(/box-shadow[^;]*;/g,'')),'no scrim');assert.ok(!/backdrop-filter|opacity:\s*0?\.\d/.test(css),'no dimming');
    ok('G10','HO-048 headlines and copy (with the job 1 truth edits), paper and sheet byte for byte; every runtime file shell-cached with its font licence; photos on the image cache; wired from Season Results; Commentary v2 lines untouched; no scrim');
  }
  // G12 (2.0.0) THE RACE and the record book come from the seasons alone and are always true: level is "All square" (never a
  // lead), a lead beyond 11 x the seasons left cannot be caught, exactly that can only be levelled, a final draw is never a
  // win; seasons won, trophies, streaks, perfect 11s and the Golden watch match the history; a 110-110 Showdown is a drawn
  // Golden Showdown for both. The strip is drawn above the trophy desk on desktop and phone.
  {
    const pool=Object.values(R),T=[3,5,10];let seen=new Set();
    const tro=r=>(r.championsLeague?1:0)+(r.europaLeague?1:0)+(r.leaguePosition===1?1:0)+(r.domesticCup?1:0);
    const pts=r=>require('../support/career-fixture-helpers.cjs').score(r).total;
    for(let i=0;i<240;i+=1){
      const len=T[i%3],n=1+(i*7)%len,rows=[];for(let k=0;k<len;k+=1)rows.push([pool[(i*3+k*5)%pool.length],pool[(i*11+k*2+1)%pool.length]]);
      const p=proj('0123456789abcdef'[i%16],len,rows);
      const editions=[];if(n<len)editions.push([G.seasonEdition({projection:p,seasonNumber:n}),n,false]);editions.push([G.finalEdition({projection:p}),len,true]);
      for(const [e,N,final] of editions){
        assert.ok(e&&e.paper.race,'every paper carries THE RACE');const race=e.paper.race,played=rows.slice(0,N);
        const a=played.reduce((t,r)=>t+pts(r[0]),0),b=played.reduce((t,r)=>t+pts(r[1]),0),gap=Math.abs(a-b),left=(len-N)*11,lead=a>b?'Daniel':b>a?'Nik':null;
        assert.equal(race.chips.length,N);race.chips.forEach((c,k)=>{assert.equal(c.left,pts(played[k][0]));assert.equal(c.right,pts(played[k][1]));assert.equal(c.winner,c.left>c.right?'left':c.right>c.left?'right':'draw');});
        assert.equal(race.leader,lead);
        if(!lead){assert.ok(!/leads|wins|clear|caught/.test(race.line),race.line);assert.match(race.line,final?/drawn Showdown/:/All square/);}
        else if(final){assert.equal(race.line,`${lead} wins the Showdown ${Math.max(a,b)} to ${Math.min(a,b)}, by ${gap} point${gap===1?'':'s'}.`);}
        else if(gap>left){assert.match(race.line,/can no longer be caught/);seen.add('caught');}
        else if(gap===left){assert.match(race.line,/can still draw level, but only/);seen.add('level-only');}
        else{assert.ok(race.line.startsWith(`${lead} leads by ${gap} point`),race.line);assert.ok(race.line.includes(`${left} points still to play`));seen.add('open');}
        if(final)assert.ok(!/to go|still to play|next season/i.test(race.line+e.paper.inside.join(' ')),'a final page never looks ahead');
        const book=e.paper.inside.join('\n'),won=k=>played.filter(r=>k===0?pts(r[0])>pts(r[1]):pts(r[1])>pts(r[0])).length,draws=played.filter(r=>pts(r[0])===pts(r[1])).length;
        assert.equal(/Seasons won/.test(book),N>=2&&a!==b,'no seasons-won count beside level totals');
        if(N>=2&&a!==b)assert.ok(book.includes(`Seasons won: Daniel ${won(0)} · Nik ${won(1)}${draws?` · drawn ${draws}`:''}`),book);
        assert.ok(book.includes(`Daniel ${played.reduce((t,r)=>t+tro(r[0]),0)} · Nik ${played.reduce((t,r)=>t+tro(r[1]),0)}`),book);
        const perfect=k=>played.filter(r=>pts(r[k])===11).length;
        assert.equal(/Golden watch/.test(book),!final&&len===10&&(perfect(0)===N||perfect(1)===N),book);
        assert.ok(!/marquee|[{}]|undefined|NaN/i.test(book+race.line),book);
        assert.ok(G.paperText(e).includes(race.line),'the race is part of the printed paper');
      }
    }
    assert.ok(seen.has('open'),'the sweep met open races');
    const gone=G.seasonEdition({projection:proj('a',3,[[R.max,R.none],[R.max,R.none]]),seasonNumber:2});
    assert.equal(gone.paper.race.line,'Daniel is 22 clear with only 11 points left to play for: the Showdown can no longer be caught.');
    // the lead of exactly 11 x seasons left, built on purpose: 3 seasons, Daniel 11-0 then 0-0 before the last season
    const exact=G.seasonEdition({projection:proj('9',3,[[R.max,R.none],[R.none,R.none]]),seasonNumber:2});
    assert.equal(exact.paper.race.line,'Daniel leads by 11. Nik can still draw level, but only with every one of the last 11 points while Daniel scores none.');
    // 110-110 over ten seasons: a drawn Showdown, and the gold edition for both
    const gold=proj('8',10,Array.from({length:10},()=>[R.max,R.max])),ge=G.finalEdition({projection:gold,final:frame(gold)});
    assert.ok(ge);assert.equal(ge.winner,'draw');assert.equal(ge.golden,true);assert.equal(ge.paper.variant,'gold');assert.equal(ge.paper.kicker,'DRAWN');assert.equal(ge.paper.photo.name,'GZ_LEAD_GOLD');
    assert.deepEqual(ge.paper.briefs.map(b=>b.head),['Golden Showdown','Golden Showdown']);assert.ok(!/seasons won/i.test(G.paperText(ge)),'a drawn ten-season paper prints no seasons-won count');assert.match(ge.paper.race.line,/drawn Showdown, and a Golden Showdown for both/);
    const solo=G.finalEdition({projection:proj('7',10,Array.from({length:10},()=>[R.max,R.cl]))});assert.equal(solo.golden,true);assert.equal(solo.winner,'Daniel');
    const plain10=G.finalEdition({projection:proj('6',10,Array.from({length:10},()=>[R.cl,R.cl]))});assert.equal(plain10.golden,false);assert.equal(plain10.paper.variant,'draw');
    assert.equal(G.fill('used {n} seasons, {m} seasons, 1 points',{n:1,m:11}),'used 1 season, 11 seasons, 1 point','singular after 1 (seasons and points)');
    const src=read('js/touchlineGazette.js');assert.match(src,/addSpecialPlayers\(paper,plan\.edition\.paper\.specialPlayers,doc\);try\{addRace\(paper,plan\.edition\.paper\.race,doc\);\}catch/);
    assert.match(src,/if\(desk\)desk\.before\(box\)/);
    const css=read('css/v10Gazette.css');assert.match(css,/#touchlineGazette\.tgzPage::before \{[^}]*background: var\(--tgz-plate-phone\) 50% 0 \/ cover no-repeat;/,'the phone plate covers a tall window');
    ok('G12','THE RACE and the record book are true for 480 papers (level, open, uncatchable, level-only, final), 110-110 is a shared Golden Showdown, the strip sits above the trophy desk');
  }
  // G20: a 110-110 Golden draw never prints a "no trophy" consolation row, and a Showdown level after every season never
  // "pointed toward a winner" (both phones, 120 Showdown ids each).
  {
    const Sweep=require('../support/gazetteTruthSweep.cjs');const G=require('../../js/touchlineGazette.js');
    const cases={golden:Array.from({length:10},()=>[Sweep.M.max,Sweep.M.max]),level:Array.from({length:5},()=>[Sweep.M.title,Sweep.M.title])};
    for(const [name,seasons] of Object.entries(cases))for(let id=0;id<120;id+=1){
      const T=seasons.length,p=Sweep.buildProjection({seed:51000+id,totalSeasons:T,seasons});const pts=p.managerRecords.playerOne.totalPoints;
      const ed=G.finalEdition({projection:p,final:{winner:'draw',totals:{daniel:pts,nik:pts},seasonsPlayed:T},specialPlayers:Sweep.SP});
      assert.ok(ed,`${name} ${id}: a drawn final paper prints`);const text=G.paperText(ed);
      if(name==='golden')assert.doesNotMatch(text,/may not come with a trophy|trophy talk for another year/i,`${name} ${id}`);
      assert.doesNotMatch(text,/pointed toward a winner|promised a winner/i,`${name} ${id}`);
    }
    ok('G20','a 110-110 Golden draw prints no "no trophy" consolation row; a Showdown level after every season never "pointed toward a winner"');
  }
  console.log(`PASS r87 Touchline Gazette contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});
