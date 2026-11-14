"use strict";
// r93 Golden Showdown (Nik 2026-11-14; plan gameplay/r93/GOLDEN_SHOWDOWN_PLAN.md, build R93-01). A manager who closes a finished
// 10-season Showdown on 150 (15, the most a season can score, in every season) earns the Golden Showdown. r93 gives it a moment
// of its own: a Golden Showdown screen right BEFORE Final Winner (Nik's card 2026-11-14 16:33 UTC), with one button, SEE FINAL
// WINNER; and the gold trophy gets its own case and GOLDEN tab in the Trophy Room (part B); part C shows it during the run (Season Results chip) and on Career Statistics. Pins:
//   GS1 the screen's rule is the career screens' rule (js/careerScreenSeam.js goldenShowdownManagers, G1-G3) on every row of
//       the truth table: 150 and 140, 150-150 (a DRAW and Golden for both, never a winner), 149, sacked in season 10 with all
//       10 played (still Golden, Rule Book), sacked in season 9, a 5-season 75 and a 3-season 45 (never Golden); on the live
//       reconciliation and on the closed terminal witness alike
//   GS2 both phones get the same screen: the frame is drawn from the shared final result only (nothing about who is looking),
//       and the season strip is the verified history's own ten season totals once the history is read
//   GS3 no Firestore read or write is added and nothing is stored on the device (the entrance plays once per page): the
//       Golden code calls no provider and the page's Firestore calls are the ones it had
//   GS4 Trophy Room: the gold case's counts are goldenShowdownCounts of the career's History rows, on every career (0 and 0
//       too: the case is always on the ALL shelf and under its own GOLDEN tab, greyed with "150 in a 10-season Showdown" until
//       won); the gold trophy is one picture, the same constant in the Trophy Room and on the Golden screen
//   GS5 Season Results: "ON COURSE FOR GOLDEN · 15 every season" (one line under the title on a desktop window, a line in
//       each manager's card on a phone; tests/browser/phone-marble-facecheck-audit.cjs GOLDEN_COURSE) while he has 15 in every season
//       committed so far of a 10-season Showdown (seasons 1-9), from the verified shared history only (so never early), gone at
//       his first dropped point; never in a 1, 3 or 5-season Showdown and never on Final Winner; Career Statistics shows the
//       gold line as a small gold-trophy tile with the same trophy picture
//   GS6 layout: the face check draws the Golden screen at every size (tests/browser/phone-marble-facecheck-audit.cjs GOLDEN,
//       with SEE FINAL WINNER on screen or reached by scrolling and not under anything); its CSS keeps every block closed,
//       no dimming layer, and its entrance is off under Reduce Motion
//   GS7 Golden everywhere it belongs (Nik 2026-11-14 17:15 UTC, part D): Standings CAREER gets a gold GOLDEN SHOWDOWNS row once
//       either manager has one (goldenShowdownCounts of the History rows, never on THIS SHOWDOWN), and every place that draws
//       the Golden Showdown uses the one gold trophy picture (Golden screen, Trophy Room, Career Statistics, Rivalry Statistics,
//       History cards)
// The DOM hand-over (Golden screen first, live panels and Back untouched, SEE FINAL WINNER draws Final Winner) is pinned in
// tests/contracts/v10-season-final-contracts.cjs V29.8b.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const Season=require("../../js/seasonFinalV10.js");
const fx=require("../support/active-showdown-fixtures.cjs");
const {projection,result,finalFor}=require("../support/career-fixture-helpers.cjs");
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
const plain=x=>JSON.parse(JSON.stringify(x));

function loadSeam(){
  const context={console};context.globalThis=context;vm.createContext(context);
  vm.runInContext(read("js/careerScreenSeam.js"),context,{filename:"js/careerScreenSeam.js"});
  return context.CareerModeCareerScreenSeam;
}
const Seam=loadSeam();
const ID="pair_"+"5".repeat(64);
// A verified final result as the Final Winner reads it (reconciliation), or after close as its terminal witness.
function recon({a,b,total=10,played=total,sacked=null}){
  return {phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,rivalryId:ID,totalSeasons:total,acceptedSeasons:played,completedSeason:played,winner:a>b?"playerOne":b>a?"playerTwo":"draw",managerTotals:{playerOne:a,playerTwo:b},...(sacked?{endedBy:"sacked",sacked}:{})};
}
const closedOnly=r=>({phase:"CLOSED",terminal:true,rivalryId:r.rivalryId,terminalWitness:r});

// GS1
{
  const rows=[
    ["150 and 140",{a:150,b:140},["daniel"]],
    ["140 and 150",{a:140,b:150},["nik"]],
    ["150-150 DRAW",{a:150,b:150},["daniel","nik"]],
    ["149 and 140",{a:149,b:140},[]],
    ["149-149",{a:149,b:149},[]],
    ["sacked in season 10, all 10 played",{a:150,b:118,sacked:{playerOne:false,playerTwo:true}},["daniel"]],
    ["sacked in season 9",{a:135,b:100,total:10,played:9,sacked:{playerOne:false,playerTwo:true}},[]],
    ["a 5-season 75",{a:75,b:60,total:5},[]],
    ["a 3-season 45",{a:45,b:45,total:3},[]]
  ];
  for(const [label,row,want] of rows){
    const r=recon(row),seam=plain(Seam.goldenShowdownManagers({status:"completed",totalSeasons:r.totalSeasons,seasonsPlayed:r.completedSeason,totals:{daniel:row.a,nik:row.b}}));
    assert.deepEqual(seam,want,`${label}: the career rule`);
    for(const [path,frame] of [["live",Season.finalFrame(r)],["closed",Season.finalFrame(null,closedOnly(r))]]){
      assert.deepEqual(frame.golden?plain(frame.golden.managers):[],want,`${label} (${path}): the screen's rule is the career rule`);
      if(frame.golden){assert.equal(frame.golden.draw,want.length===2,`${label}: DRAW only when both`);assert.equal(frame.golden.points,150);assert.equal(frame.golden.key,ID);}
    }
  }
  // the draw is still a draw on Final Winner (no tiebreak) and the Golden frame names no winner
  const draw=Season.finalFrame(recon({a:150,b:150}));assert.equal(draw.winner,"draw");assert.equal(draw.outcomeHeadline,"DRAW");
  assert.equal(Seam.GOLDEN_SHOWDOWN.points,150);assert.equal(Seam.GOLDEN_SHOWDOWN.seasons,10);
  ok("GS1","the Golden screen's rule is the career screens' rule on every row (150, 150-150 DRAW, 149, sacked s10 / s9, 5 and 3 seasons), live and closed");
}

// GS2
{
  const p15=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true,primePack:4});
  const p14=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,primePack:4});
  const p=projection({seed:"5",totalSeasons:10,seasons:Array.from({length:10},(_,i)=>[p15(),i===3?p14():p15()])});
  assert.equal(p.managerRecords.playerOne.totalPoints,150);assert.equal(p.managerRecords.playerTwo.totalPoints,149);
  const daniel=Season.finalFrame(fx.finalReconciliation(p),fx.closed(p),{...fx.history(p),managerRole:"playerOne"});
  const nik=Season.finalFrame(fx.finalReconciliation(p),fx.closed(p),{...fx.history(p),managerRole:"playerTwo",runtimeRevision:"other"});
  assert.equal(daniel.status,"ready");assert.deepEqual(plain(daniel),plain(nik),"both phones, the same frame");
  assert.deepEqual(plain(daniel.golden.managers),["daniel"]);
  assert.deepEqual(plain(daniel.golden.seasons),p.seasonHistory.map(s=>({season:s.roundNumber,daniel:s.playerOne.scoring.total,nik:s.playerTwo.scoring.total})),"the strip is the verified history's own totals");
  assert.equal(daniel.golden.seasons[3].nik,14);
  // before the history is read (a reload after close) the screen already shows, from the verified totals alone
  const early=Season.finalFrame(null,fx.closed(p),null);assert.equal(early.status,"partial");assert.deepEqual(plain(early.golden.managers),["daniel"]);assert.equal(early.golden.seasons,null);
  // and no Golden screen at all for a Showdown that is not Golden
  const q=projection({seed:"4",totalSeasons:10,seasons:Array.from({length:10},()=>[p14(),p14()])});
  assert.equal(Season.finalFrame(fx.finalReconciliation(q),fx.closed(q),fx.history(q)).golden,undefined);
  ok("GS2","both phones draw the same Golden frame from the shared result; the strip is the verified history's ten totals; none when not Golden");
}

// GS3
{
  const src=read("js/seasonFinalV10.js");
  const part=(from,to)=>{const i=src.indexOf(from),j=src.indexOf(to,i+1);assert.ok(i>0&&j>i,from);return src.slice(i,j);};
  const golden=part("// r93 Golden Showdown screen (Nik 2026-11-14","// r87 one-tap Rematch")+part("// r93 Golden Showdown screen (part A","// r89 Sacked: a small crimson");
  assert.doesNotMatch(golden,/firestore|getDoc|setDoc|updateDoc|runTransaction|onSnapshot|writeBatch|fetch\(|loadRuntimeScript|CareerModeFirestoreBudget|readCompletedShowdown/i,"the Golden code calls no provider");
  assert.doesNotMatch(golden,/\b110\b|\b11 a season\b/,"no 110 anywhere");
  assert.doesNotMatch(golden,/localStorage|sessionStorage|indexedDB/,"the Golden screen stores nothing; the rise plays once per page");
  // the page's Firestore calls are the ones it had before r93 (the completed-Showdown read only)
  const count=re=>(src.match(re)||[]).length;
  assert.deepEqual([count(/readCompletedShowdown\(/g),count(/firestoreSdk/g),count(/getDoc/g),count(/setDoc|updateDoc|runTransaction|writeBatch|onSnapshot/g)],[1,3,3,0],"as at 2.5.0 (main 36b648ad)");
  ok("GS3","no Firestore read or write added; the Golden code stores nothing at all");
}

// GS4
{
  const Career=require("../../js/sharedCareerAnalytics.js"),Screens=require("../../js/careerScreensV10.js");
  const p15=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true,primePack:4});
  const p14=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,primePack:4});
  const sd=(seed,total,pair)=>{const p=projection({seed,totalSeasons:total,seasons:Array.from({length:total},(_,i)=>pair(i))});return {rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)};};
  const careers=[
    [],
    [sd("1",3,()=>[p15(),p14()])],
    [sd("2",10,()=>[p15(),p14()])],
    [sd("2",10,()=>[p15(),p14()]),sd("3",10,()=>[p15(),p15()]),sd("4",10,i=>[p14(),i===9?p14():p15()])]
  ];
  for(const showdowns of careers){
    const model=Career.buildCareerModel({indexStatus:"ready",showdowns});
    const frame=plain(Screens.toV10Frame(model,"trophyRoom"));if(frame.status!=="ready")continue;
    assert.deepEqual(frame.goldenShowdowns,plain(Seam.goldenShowdownCounts(model.history.showdowns)),"the case counts the History rows");
  }
  const last=plain(Screens.toV10Frame(Career.buildCareerModel({indexStatus:"ready",showdowns:careers[3]}),"trophyRoom"));assert.deepEqual(last.goldenShowdowns,{daniel:2,nik:1});
  const none=plain(Screens.toV10Frame(Career.buildCareerModel({indexStatus:"ready",showdowns:careers[1]}),"trophyRoom"));assert.deepEqual(none.goldenShowdowns,{daniel:0,nik:0},"unwon, still on the shelf");
  assert.equal(plain(Screens.toV10Frame(Career.buildCareerModel({indexStatus:"ready",showdowns:careers[1]}),"careerStatistics")).goldenShowdowns,undefined,"Career Statistics only when won");
  const room=read("visual-assets/v10_1/trophy-room/trophy-room.js"),binder=read("js/careerScreensV10.js");
  assert.match(binder,/categories:\["ALL","SHOWDOWN","GOLDEN","LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE","EUROPA LEAGUE"\]/);
  assert.match(binder,/goldenNotWonYet:"150 in a 10-season Showdown"/);
  assert.match(room,/const GOLDEN = \{ key: "goldenShowdown", category: "GOLDEN", asset: GOLDEN_TROPHY\.src/);
  assert.match(room,/state\.activeCategory === "ALL" \? TROPHIES\.concat\(golden\) : state\.activeCategory === GOLDEN\.category \? golden :/);
  const roomSrc=/const GOLDEN_TROPHY = \{ src: BASE \+ "\.\.\/shared\/(trophies-hc\/[\w.]+)", tint: (true|false) \}/.exec(room),screenSrc=/const GOLDEN_TROPHY=Object\.freeze\(\{src:"visual-assets\/v10_1\/shared\/(trophies-hc\/[\w.]+)",tint:(true|false)\}\)/.exec(read("js/seasonFinalV10.js"));
  assert.ok(roomSrc&&screenSrc);assert.deepEqual(roomSrc.slice(1),screenSrc.slice(1),"one gold trophy picture in both places");
  assert.ok(fs.existsSync(path.join(ROOT,"visual-assets/v10_1/shared",roomSrc[1])),"the picture exists");
  ok("GS4","the Trophy Room's gold case counts the History rows (0 and 0 too), has its own GOLDEN tab, and shows the same gold trophy as the Golden screen");
}

// GS5
{
  const p15=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true,primePack:4});
  const p14=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,primePack:4});
  const live=(total,pairs)=>fx.history(projection({seed:"7",totalSeasons:total,seasons:pairs}));
  const course=h=>{const c=Season.goldenCourse(h);return c?plain(c):null;};
  // 15 in every committed season of a 10-season Showdown: on course, for each manager on his own
  assert.deepEqual(course(live(10,[[p15(),p15()]])),{managers:["daniel","nik"],through:1});
  assert.deepEqual(course(live(10,[[p15(),p15()],[p15(),p14()],[p15(),p15()]])),{managers:["daniel"],through:3},"Nik dropped a point in season 2: his chip is gone for good");
  assert.deepEqual(course(live(10,Array.from({length:9},()=>[p15(),p15()]))),{managers:["daniel","nik"],through:9});
  assert.equal(course(live(10,[[p14(),p15()],[p15(),p14()]])),null,"both dropped a point: no chip");
  assert.equal(course(live(10,Array.from({length:10},()=>[p15(),p15()]))),null,"after season 10 the Golden screen takes over");
  for(const total of [1,3,5])assert.equal(course(live(total,[[p15(),p15()]])),null,`never in a ${total}-season Showdown`);
  // only the verified shared history: an unconverged or non-authoritative view, or one whose seasons do not line up, shows nothing
  const h=live(10,[[p15(),p15()],[p15(),p15()]]);
  for(const bad of [null,{...h,authoritative:false},{...h,phase:"HISTORY_PENDING"},{...h,throughSeason:3},{...h,throughSeason:0},{...h,rivalryId:"pair_"+"8".repeat(64)},{...h,projection:{...h.projection,seasonHistory:[...h.projection.seasonHistory].reverse()}}])assert.equal(course(bad),null);
  // the chip goes under each on-course manager's header and is removed the moment he is no longer on course
  class N{constructor(tag,doc){this.tagName=tag;this.doc=doc;this.children=[];this.parent=null;this.attrs={};this.className="";this.id="";this.textContent="";}
    appendChild(n){n.parent=this;this.children.push(n);return n;}
    after(n){const list=this.parent.children;n.parent=this.parent;list.splice(list.indexOf(this)+1,0,n);}
    remove(){const list=this.parent.children;list.splice(list.indexOf(this),1);this.parent=null;}
    setAttribute(k,v){this.attrs[k]=String(v);}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    match(sel){return sel.startsWith("#")?this.id===sel.slice(1):this.className.split(" ").includes(sel.slice(1));}
    querySelectorAll(sel){const parts=sel.split(" ");let nodes=[this];for(const part of parts)nodes=nodes.flatMap(n=>n.all().filter(x=>x.match(part)));return nodes;}
    querySelector(sel){return this.querySelectorAll(sel)[0]||null;}}
  const doc={styles:[],createElement:t=>new N(t,doc),getElementById:id=>doc.styles.find(x=>x.id===id)||null,head:{appendChild:n=>doc.styles.push(n)}};
  const stage=new N("section",doc),tagline=stage.appendChild(new N("p",doc));tagline.className="season-tagline";
  for(const id of ["daniel-entry-panel","nik-entry-panel"]){const card=stage.appendChild(new N("article",doc));card.id=id;const header=card.appendChild(new N("div",doc));header.className="seasonManagerHeader";card.appendChild(new N("div",doc)).className="seasonResultFields";}
  const saved=globalThis.document;globalThis.document=doc;
  try{
    const chips=()=>stage.querySelectorAll(".seasonGoldenCourse").map(c=>c.parent.id);
    Season.goldenCourseChips(stage,Season.goldenCourse(live(10,[[p15(),p15()]])));
    assert.deepEqual(chips(),["daniel-entry-panel","nik-entry-panel"]);
    const chip=stage.querySelector(".seasonGoldenCourse");
    assert.equal(chip.parent.children.indexOf(chip),1,"right under the header, before the fields");
    assert.deepEqual(chip.children.map(c=>c.textContent),["","ON COURSE FOR GOLDEN","15 every season"]);
    assert.match(chip.attrs["aria-label"],/15 in every season so far \(1 of 10\)/);
    const line=()=>stage.querySelectorAll(".seasonGoldenCourseLine").map(c=>c.children.map(x=>x.textContent));
    assert.deepEqual(line(),[["","ON COURSE FOR GOLDEN","DANIEL · NIK","15 every season"]],"one line under the title on a desktop window");
    Season.goldenCourseChips(stage,Season.goldenCourse(live(10,[[p15(),p15()],[p15(),p14()]])));
    assert.deepEqual(chips(),["daniel-entry-panel"],"re-rendered: Nik's chip is gone, Daniel's is not doubled");
    assert.deepEqual(line(),[["","ON COURSE FOR GOLDEN","DANIEL","15 every season"]]);
    Season.goldenCourseChips(stage,null);assert.deepEqual(chips(),[]);assert.deepEqual(line(),[]);
    assert.equal(doc.styles.length,1,"one style block");
    assert.match(doc.styles[0].textContent,/#app #seasonEntry\.v10FinalMode :is\(\.seasonGoldenCourse,\.seasonGoldenCourseLine\) \{ display:none; \}/,"never on Final Winner");
    assert.doesNotMatch(doc.styles[0].textContent,/font[^;]*\b(?:[0-9]|1[01])px/,"no text under 12px");
  }finally{globalThis.document=saved;}
  // wiring: Season Results renders it from the live Showdown's history only (never a closed or kept one); no provider in it
  const src=read("js/seasonFinalV10.js"),part=(from,to)=>{const i=src.indexOf(from),j=src.indexOf(to,i+1);assert.ok(i>0&&j>i,from);return src.slice(i,j);};
  assert.match(src,/sfSeasonChips\(stage,frame\.specialPlayers\);\n    sfGoldenCourse\(stage,frame\.goldenCourse\);/);
  assert.match(src,/const source=seasonSource\(\),s=sfSnapshot\(\),course=s\.terminalClose\?\.phase==="CLOSED"\?null:goldenCourse\(s\.history\);/);
  assert.match(src,/frame:seasonScreenSource,/);assert.match(src,/screen==="seasonEntry"\?seasonScreenSource\(\):/);
  const code=part("// r93 part C (Nik 2026-11-14)","// r87 one-tap Rematch")+part("// r93 part C: on a desktop window the chip","// HO-068: the Standings phone art")+part("// r93 part C: Season Results also carries","// The pair module notifies");
  assert.doesNotMatch(code,/firestore|getDoc|setDoc|readCompletedShowdown|localStorage|fetch\(|\b110\b/i);
  // Career Statistics: the gold line is a small tile with the same gold trophy picture as the Trophy Room and the Golden screen
  const stats=read("visual-assets/v10_1/career-statistics/career-statistics.js"),room=read("visual-assets/v10_1/trophy-room/trophy-room.js");
  const statsSrc=/const GOLDEN_TROPHY=\{src:"\.\.\/shared\/(trophies-hc\/[\w.]+)",tint:(true|false)\};/.exec(stats),roomSrc=/const GOLDEN_TROPHY = \{ src: BASE \+ "\.\.\/shared\/(trophies-hc\/[\w.]+)", tint: (true|false) \}/.exec(room);
  assert.ok(statsSrc&&roomSrc);assert.deepEqual(statsSrc.slice(1),roomSrc.slice(1),"one gold trophy picture");
  assert.match(stats,/goldenShowdownNote goldenShowdownTile/);
  ok("GS5","Season Results shows ON COURSE FOR GOLDEN only while a manager has 15 in every committed season of a 10-season Showdown (seasons 1-9), from the verified shared history only, and drops it at his first dropped point");
}

// GS7
{
  const p15=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true,primePack:4});
  const p14=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,primePack:4});
  const Career=require("../../js/sharedCareerAnalytics.js");
  const sd=(seed,total,pair)=>{const p=projection({seed,totalSeasons:total,seasons:Array.from({length:total},(_,i)=>pair(i))});return {rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)};};
  const golden=Career.buildCareerModel({indexStatus:"ready",showdowns:[sd("2",10,()=>[p15(),p14()]),sd("3",10,()=>[p15(),p15()]),sd("4",3,()=>[p14(),p15()])]});
  const plainCareer=Career.buildCareerModel({indexStatus:"ready",showdowns:[sd("4",3,()=>[p14(),p15()])]});
  const saved=globalThis.CareerModeCareerScreenSeam;globalThis.CareerModeCareerScreenSeam=Seam;
  try{
    const career=m=>plain(Season.standingsFrames(null,m).CAREER.model);
    assert.deepEqual(career(golden).goldenShowdowns,plain(Seam.goldenShowdownCounts(golden.history.showdowns)),"Standings CAREER counts the History rows by the one rule");
    assert.deepEqual(career(golden).goldenShowdowns,{daniel:2,nik:1});
    assert.equal(career(plainCareer).goldenShowdowns,undefined,"no row until someone has one");
    assert.equal(plain(Season.standingsFrames(null,golden).SHOWDOWN.model).goldenShowdowns,undefined,"THIS SHOWDOWN never");
  }finally{globalThis.CareerModeCareerScreenSeam=saved;}
  // Standings loads the seam itself (Codex #1468): the row is there when Standings is the first career screen after a reload.
  const modules=/async function standingsModules\(\)\{[\s\S]*?\n  \}/.exec(read("js/seasonFinalV10.js"));
  assert.ok(modules&&modules[0].includes('["career-screen-seam","js/careerScreenSeam.js","CareerModeCareerScreenSeam"]'),"Standings prepare loads the career seam");
  const standings=read("visual-assets/v10_1/standings/standings.js");
  assert.match(standings,/const g = view === "career" && !interim \? m\.goldenShowdowns : null;/);
  assert.match(standings,/row\.className = "sdg-row sdg-row--golden";/);
  // one gold trophy picture wherever the Golden Showdown is drawn: the Golden screen, Trophy Room, Career Statistics, Rivalry
  // Statistics and the History cards
  const pic=[];
  pic.push(/const GOLDEN_TROPHY=Object\.freeze\(\{src:"visual-assets\/v10_1\/shared\/(trophies-hc\/[\w.]+)",tint:(true|false)\}\)/.exec(read("js/seasonFinalV10.js")));
  pic.push(/const GOLDEN_TROPHY = \{ src: BASE \+ "\.\.\/shared\/(trophies-hc\/[\w.]+)", tint: (true|false) \}/.exec(read("visual-assets/v10_1/trophy-room/trophy-room.js")));
  pic.push(/const GOLDEN_TROPHY=\{src:"\.\.\/shared\/(trophies-hc\/[\w.]+)",tint:(true|false)\};/.exec(read("visual-assets/v10_1/career-statistics/career-statistics.js")));
  pic.push(/const GOLDEN_TROPHY=\{src:"visual-assets\/v10_1\/shared\/(trophies-hc\/[\w.]+)",tint:(true|false)\};/.exec(read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js")));
  pic.push(/const GOLDEN_TROPHY = \{ src: "visual-assets\/v10_1\/shared\/(trophies-hc\/[\w.]+)", tint: (true|false) \};/.exec(read("visual-assets/v10_1/legacy/legacy.js")));
  assert.ok(pic.every(Boolean),"every Golden place names the gold trophy constant");
  assert.equal(new Set(pic.map(m=>m[1]+"|"+m[2])).size,1,"one picture, one tint, everywhere");
  assert.match(read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js"),/<img src="'\+GOLDEN_TROPHY\.src\+'"/);
  assert.match(read("visual-assets/v10_1/legacy/legacy.js"),/star\.src = GOLDEN_TROPHY\.src;/);
  assert.doesNotMatch(read("css/rivalryLegacyV10.css"),/\b110 points\b/,"no 110 anywhere");
  ok("GS7","Golden everywhere it belongs (Nik 2026-11-14 17:15 UTC): Standings CAREER row from the one rule, and one gold trophy picture on the Golden screen, Trophy Room, Career Statistics, Rivalry Statistics and History");
}

// GS6
{
  const src=read("js/seasonFinalV10.js");
  const css=/style\.id="v10GoldenRule";[\s\S]*?style\.textContent=`([\s\S]*?)`;\s*parent\.appendChild\(style\)/.exec(src)?.[1];
  assert.ok(css,"the Golden screen's rules are found");
  let depth=0;for(const ch of css.replace(/\$\{[^}]*\}/g,"")){if(ch==="{")depth++;if(ch==="}")depth--;assert.ok(depth>=0,"no stray }");}assert.equal(depth,0,"every block closed");
  assert.doesNotMatch(css,/rgba?\(0,\s*0,\s*0,\s*\.[3-9]\)\s*;?\s*}|::(?:before|after)/,"no dimming layer");
  assert.match(css,/prefers-reduced-motion: reduce\)[^}]*\.goldenEnter \* \{ animation:none !important; \}/);
  assert.match(css,/data-motion-reduced="true"\],\[data-reduced-motion="true"\]\) #app #seasonEntry \.v10GoldenStage\.goldenEnter \* \{ animation:none !important; \}/);
  const face=read("tests/browser/phone-marble-facecheck-audit.cjs");
  assert.match(face,/GOLDEN: \{ host: "seasonEntry"/,"the face check draws the Golden screen");assert.match(face,/goldenButtonClear/,"and checks SEE FINAL WINNER is reachable and clear");
  ok("GS6","the Golden screen's CSS is closed, has no dimming layer, respects Reduce Motion, and the face check draws it at every size");
}
console.log(`r93 golden showdown contracts: PASS (${checks} checks)`);
