"use strict";
// r87 Commentary v3 (Nik 2026-10-31): every word comes from the Showdown's own data and matches what happened.
// The booth (js/commentaryV3.js) is pinned here against an independent recomputation over thousands of simulated
// Showdowns of every length, plus exact scenarios for the decider maths, a decided Showdown, the Golden Showdown and draws.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const V=require("../../js/commentaryV3.js"),E=require("../../js/commentaryEngine.js"),L=require("../../data/commentaryLines.js");
let checks=0;const ok=(value,message)=>{assert.ok(value,message);checks+=1;};

// ---------- fixtures ----------
function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function score(x){const hp=x.leaguePoints>=100,hg=x.leagueGoals>=100,b={championsLeague:x.championsLeague?5:0,...(x.europaLeague?{europaLeague:3}:{}),leagueTitle:x.leaguePosition===1?3:0,domesticCup:x.domesticCup?1:0,performanceBonus:hp||hg?1:0,individualAwardsBonus:x.topScorer||x.topAssist?1:0,triggers:{hundredLeaguePoints:hp,hundredLeagueGoals:hg,topScorer:x.topScorer,topAssist:x.topAssist}};b.total=b.championsLeague+(b.europaLeague||0)+b.leagueTitle+b.domesticCup+b.performanceBonus+b.individualAwardsBonus;return b;}
function result(r,pos){const cl=r()<.2,el=!cl&&r()<.15;return {leaguePosition:pos,leaguePoints:Math.max(15,104-pos*4+Math.floor(r()*14)),leagueGoals:35+Math.floor(r()*72),championsLeague:cl,...(el?{europaLeague:true}:{}),domesticCup:r()<.2,topScorer:r()<.15,topAssist:r()<.15};}
function row(a,b){const A={...a,scoring:score(a)},B={...b,scoring:score(b)},x=A.scoring.total,y=B.scoring.total;return {playerOne:A,playerTwo:B,winner:x>y?"playerOne":y>x?"playerTwo":"draw"};}
function randomShowdown(seed,N){const r=rng(seed),history=[];for(let i=0;i<N;i+=1){const p=1+Math.floor(r()*20);let q=1+Math.floor(r()*20);if(q===p)q=p===20?19:p+1;history.push(row(result(r,p),result(r,q)));}return {showdownId:`rivalry_${seed}`,seasons:N,league:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},teamCount:20,history};}
// A season with exact Showdown points: CL 5, title 3, cup 1, bonus 1, award 1 (0..11).
function exact(points,pos){const parts={cl:false,title:false,cup:false,perf:false,award:false};let left=points;
  if(left>=5){parts.cl=true;left-=5;}if(left>=3){parts.title=true;left-=3;}if(left>=1){parts.cup=true;left-=1;}if(left>=1){parts.perf=true;left-=1;}if(left>=1){parts.award=true;left-=1;}
  assert.equal(left,0,`cannot build ${points}`);
  return {leaguePosition:parts.title?1:pos,leaguePoints:parts.perf?101:80,leagueGoals:70,championsLeague:parts.cl,domesticCup:parts.cup,topScorer:parts.award,topAssist:false};}
function scripted(id,pairs){const history=pairs.map(([a,b])=>row(exact(a,a>=8&&b>=8?2:3),exact(b,a>=8&&b>=8?3:4)));
  // Each manager plays their own FIFA career, so both can win their league in the same season.
  return {showdownId:id,seasons:pairs.length,league:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},teamCount:20,history};}

// ---------- independent recomputation ----------
const NAMES={playerOne:"Daniel",playerTwo:"Nik"};
function totalsOf(f,s){let a=0,b=0;for(const h of f.history.slice(0,s)){a+=h.playerOne.scoring.total;b+=h.playerTwo.scoring.total;}return {playerOne:a,playerTwo:b};}
const BAD_WORDS=/tie-?break|on goal difference|league position decides|marquee/i,BAD_FILL=/[{}]|\bundefined\b|\bNaN\b|\bnull\b/;
const FORBIDDEN={test:text=>BAD_WORDS.test(text)||BAD_FILL.test(text)};

// ---------- 1. fuzz: every call, every season, every length ----------
const lengths=[1,3,5,10];let calls=0;const leadSituations=new Set(),numberIds=new Set();
for(let seed=1;seed<=1200;seed+=1){
  const N=lengths[seed%4],f=randomShowdown(seed,N),usedIds=new Set();
  for(let s=1;s<=N;s+=1){
    const c=V.call(f,s,L);calls+=1;
    ok(c&&(c.lead||c.numbers),`seed ${seed} season ${s}: the booth always has something true to say`);
    const again=V.call(JSON.parse(JSON.stringify(f)),s,L);
    assert.deepEqual(again,c,"same facts, same words (both phones)");
    ok(c.moment===(s===N?"final":"season-result"),"the last season speaks for the whole Showdown");
    if(c.lead){
      leadSituations.add(c.lead.situation);
      ok(!usedIds.has(c.lead.id),`seed ${seed}: no lead line repeats within one Showdown (${c.lead.id})`);usedIds.add(c.lead.id);
      // The lead situation is one v2 says is true for these exact facts.
      const facts={managers:{playerOne:{name:"Daniel",club:"Arsenal",league:"premier_league"},playerTwo:{name:"Nik",club:"Liverpool",league:"premier_league"}},seasons:N,season:s,results:f.history.slice(0,s).map(h=>({...h,teamCount:20}))};
      const truth=E.situationsFor(s===N?"final":"season-result",s===N?{...facts,history:[]}:facts).map(e=>e.situation);
      ok(truth.includes(c.lead.situation),`seed ${seed} season ${s}: ${c.lead.situation} is true`);
      ok(!/^career-/.test(c.lead.situation),"the booth never claims career facts it does not hold");
      ok(!FORBIDDEN.test(c.lead.text),`lead text is clean: ${c.lead.text}`);
      ok(!/(^|[^\d.])1 (Showdown |league )?points\b/.test(c.lead.text),`"1 point", not "1 points": ${c.lead.text}`);
    }
    if(c.numbers){
      numberIds.add(c.numbers.id);
      ok(!FORBIDDEN.test(c.numbers.text),`numbers text is clean: ${c.numbers.text}`);
      if(c.lead)ok(c.numbers.topic!==V.topicOf(c.lead.situation),"the two voices never say the same thing");
      // Every "Overall: Daniel X, Nik Y" and "Seasons won" claim matches the recount.
      const t=totalsOf(f,s),overall=c.numbers.text.match(/Overall: Daniel (\d+), Nik (\d+)/);
      if(overall)ok(+overall[1]===t.playerOne&&+overall[2]===t.playerTwo,`overall ${c.numbers.text}`);
      const won=c.numbers.text.match(/Seasons won: Daniel (\d+), Nik (\d+)(?:, with (\w+) draws?)?/);
      if(won){const rows=f.history.slice(0,s);ok(+won[1]===rows.filter(h=>h.winner==="playerOne").length&&+won[2]===rows.filter(h=>h.winner==="playerTwo").length,`season count ${c.numbers.text}`);}
      const full=c.numbers.text.match(/(Daniel|Nik) (\d+), (Daniel|Nik) (\d+) at full time|Full time: (Daniel|Nik) (\d+), (Daniel|Nik) (\d+)/);
      if(full){const m=full.slice(1).filter(Boolean),T=totalsOf(f,N);ok(+m[1]===T[m[0]==="Daniel"?"playerOne":"playerTwo"]&&+m[3]===T[m[2]==="Daniel"?"playerOne":"playerTwo"],`full time ${c.numbers.text}`);}
      if(c.numbers.id==="decider"){
        const t2=totalsOf(f,s),lead=t2.playerOne>t2.playerTwo?"playerOne":"playerTwo",gap=Math.abs(t2.playerOne-t2.playerTwo);
        ok(N-s===1&&gap>0&&gap<11,"the decider maths only runs with one season left and a live race");
        ok(c.numbers.text.includes(`${NAMES[lead==="playerOne"?"playerTwo":"playerOne"]} must win it by ${gap+1} or more`)&&c.numbers.text.includes(`by exactly ${gap}, it ends level`),c.numbers.text);
      }
      if(c.numbers.id==="decided"){const t2=totalsOf(f,s);ok(Math.abs(t2.playerOne-t2.playerTwo)>11*(N-s)&&N>s,`decided means out of reach: ${c.numbers.text}`);}
      if(/drawn Showdown|Showdown is drawn|ends level/.test(c.numbers.text)&&c.numbers.id!=="decider"){const T=totalsOf(f,s);ok(c.numbers.id==="decider-level"?T.playerOne===T.playerTwo:c.numbers.id==="final-level"?T.playerOne===T.playerTwo&&s===N:c.numbers.id==="draw-only",`draw words only for draws: ${c.numbers.id}`);}
    }
  }
}
ok(calls>4000,`fuzzed ${calls} booth calls`);
for(const id of ["decider","decided","clock","season-count","final-count","final-sprint","final-late"])ok(numberIds.has(id),`the fuzz reaches the ${id} numbers line`);
ok(leadSituations.size>=40,`the booth uses a wide range of v2 situations (${leadSituations.size})`);

// ---------- 2. exact scenarios ----------
{ // 3 seasons: Nik leads by 1 with one to go.
  const f=scripted("decider",[[5,1],[0,5],[0,0]]),c=V.call(f,2,L);
  assert.equal(c.numbers.id,"decider");assert.equal(c.numbers.text,"One season left, Nik 6, Daniel 5. Daniel must win it by 2 or more to take the Showdown; by exactly 1, it ends level.");checks+=2;
}
{ // Level with one to go: equal points in the final season is a drawn Showdown.
  const f=scripted("level",[[3,4],[4,3],[0,0]]),c=V.call(f,2,L);
  assert.equal(c.numbers.id,"decider-level");ok(/Level on 7 with one season left/.test(c.numbers.text),c.numbers.text);
}
{ // 5 seasons, Daniel 23 clear after 3: at most 22 left, decided.
  const f=scripted("decided",[[11,0],[9,0],[3,0],[0,0],[0,0]]),c=V.call(f,3,L);
  const n=V.seasonNumbers(f,3);ok(n.some(x=>x.id==="decided"&&/leads by 23 with two seasons to play, and the most Nik can win back is 22/.test(x.text)),"decided wording");
  ok(!n.some(x=>x.id==="decider"),"no live-race maths once it is decided");
  ok(c.lead&&!/can still win|still in it/i.test(c.lead.text),"the lead line does not pretend the race is open");
}
{ // Exactly 11 per season left: only a level Showdown is still possible.
  const f=scripted("draw-only",[[11,0],[0,0],[0,0]]),n=V.seasonNumbers(f,2);
  ok(n[0].id==="draw-only"&&/Nik can no longer win it\. The best left is a level Showdown, and only by winning the last season 11 to 0\./.test(n[0].text),n[0].text);
}
{ // Lead changes are counted.
  const f=scripted("swing",[[5,0],[0,6],[4,0],[0,0],[0,0]]),n=V.seasonNumbers(f,3);
  ok(n.some(x=>x.id==="lead-change"&&/the second change of lead in this Showdown\. Daniel now leads 9 to 6\./.test(x.text)),JSON.stringify(n));
}
{ // Streak of three.
  const f=scripted("run",[[1,0],[3,1],[5,4],[0,0],[0,0]]),n=V.seasonNumbers(f,3);
  ok(n.some(x=>x.id==="run"&&x.text==="Daniel has now won 3 seasons in a row."),JSON.stringify(n));
}
{ // Golden Showdown: 110 for one manager.
  const f=scripted("golden",Array.from({length:10},()=>[11,4])),n=V.finalNumbers(f);
  ok(n[0].id==="final-golden"&&/110 out of 110 for Daniel/.test(n[0].text),n[0].text);
  const c=V.call(f,10,L);ok(c.moment==="final"&&(c.lead?.situation==="final-golden"||c.numbers?.id==="final-golden"),"the Golden Showdown is told on its last season");
}
{ // 110 each: a drawn Showdown and a Golden Showdown for both (lead request 2026-10-31).
  const f=scripted("golden-both",Array.from({length:10},()=>[11,11]));
  const n=V.finalNumbers(f);ok(n.some(x=>x.id==="final-golden-both"&&/110 each/.test(x.text)&&/Golden Showdown for both/.test(x.text)),JSON.stringify(n));
  const c=V.call(f,10,L);ok(c.numbers&&c.numbers.id==="final-golden-both","a double Golden Showdown is never told as a plain draw");
}
{ // Drawn Showdown.
  const f=scripted("drawn",[[5,3],[3,5],[1,1]]),c=V.call(f,3,L);
  ok(c.lead&&c.lead.situation==="final-drawn","a level finish leads with the drawn verdict");
  ok(!c.numbers||c.numbers.id==="final-level","and its numbers say level");
}
{ // Invalid data says nothing rather than something wrong.
  const f=randomShowdown(9,3);f.history[1].winner="playerOne";f.history[1].playerOne.scoring.total=0;f.history[1].playerTwo.scoring.total=4;
  assert.equal(V.call(f,2,L),null);checks+=1;
  assert.equal(V.call({...randomShowdown(9,3),seasons:4},1,L),null);checks+=1;
  const g=randomShowdown(10,3);g.history[0].playerOne.scoring.total=12;assert.equal(V.call(g,1,L),null);checks+=1;
}

// ---------- 3. wiring and rules ----------
const src=read("js/commentaryV3.js");
ok(!/getDoc|getDocs|onSnapshot|setDoc|updateDoc|runTransaction|firestore\b|fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/.test(src),"the booth reads only what the screen holds: no Firebase, network or storage");
ok(!/Math\.random|Date\.now|new Date/.test(src),"no randomness or clock: both phones show the same words");
ok(/pointer-events:none/.test(src)&&!/position:fixed/.test(src)&&!/z-index/.test(src),"the bar is in flow, never on top, never tappable");
ok(/sharedCanonicalScoringPanel/.test(src)&&!/finalWinner|rosterRoulette|specialPlayer|transfer/i.test(src.replace(/\/\/.*$/gm,"")),"only Season Results' SEASON SCORE box and Final Winner get the bar");
ok(/host\.after\(parts\.wrap\)/.test(src)&&/frame\.totals\?\.daniel!==a\|\|frame\.totals\?\.nik!==b/.test(src),"Final Winner: the bar goes below the stage, never inside it, and only when the history matches the totals on screen");
ok(!/filter:\s*brightness|backdrop-filter|rgba\(0,\s*0,\s*0,\s*\.[5-9]\)\s*;?\s*}/.test(src.replace(/text-shadow:[^;]*;/g,"")),"no dimming layer");
const sf=read("js/seasonFinalV10.js");
ok(/loadRuntimeScript\("commentary-v3","js\/commentaryV3\.js"/.test(sf),"Season Results installs the booth");
const sw=read("service-worker.js"),added=new Set(JSON.parse(sw.match(/SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\((\[[^\]]*\])\)/)[1]));
for(const file of ["js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js"]){
  ok(sw.includes(`"${file}",`),`${file} is in the offline shell (the service worker refuses files it does not know)`);
  ok(added.has(file),`${file} is marked new since the previous release`);
}
console.log(`r87 Commentary v3 contracts passed (${checks} checks, ${calls} booth calls)`);
