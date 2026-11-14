"use strict";
// r93 Golden Showdown (Nik 2026-11-14; plan gameplay/r93/GOLDEN_SHOWDOWN_PLAN.md, build R93-01). A manager who closes a finished
// 10-season Showdown on 150 (15, the most a season can score, in every season) earns the Golden Showdown. r93 gives it a moment
// of its own: a Golden Showdown screen right BEFORE Final Winner (Nik's card 2026-11-14 16:33 UTC), with one button, SEE FINAL
// WINNER. Pins (the parts that follow add GS4 and GS5):
//   GS1 the screen's rule is the career screens' rule (js/careerScreenSeam.js goldenShowdownManagers, G1-G3) on every row of
//       the truth table: 150 and 140, 150-150 (a DRAW and Golden for both, never a winner), 149, sacked in season 10 with all
//       10 played (still Golden, Rule Book), sacked in season 9, a 5-season 75 and a 3-season 45 (never Golden); on the live
//       reconciliation and on the closed terminal witness alike
//   GS2 both phones get the same screen: the frame is drawn from the shared final result only (nothing about who is looking),
//       and the season strip is the verified history's own ten season totals once the history is read
//   GS3 no Firestore read or write is added and nothing is stored but this device's "seen" mark (which only skips the
//       entrance motion): the Golden code calls no provider and the page's Firestore calls are the ones it had
//   GS6 layout: the face check draws the Golden screen at every size (tests/browser/phone-marble-facecheck-audit.cjs GOLDEN,
//       with SEE FINAL WINNER on screen or reached by scrolling and not under anything); its CSS keeps every block closed,
//       no dimming layer, and its entrance is off under Reduce Motion
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
const {projection,result}=require("../support/career-fixture-helpers.cjs");
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
  assert.deepEqual([...golden.matchAll(/localStorage\?\.(\w+)/g)].map(m=>m[1]).sort(),["getItem","setItem"],"the only thing stored is this device's seen mark");
  assert.match(golden,/GOLDEN_SEEN_KEY="careerModeShowdown\.goldenSeen\.v1"/);
  // the page's Firestore calls are the ones it had before r93 (the completed-Showdown read only)
  const count=re=>(src.match(re)||[]).length;
  assert.deepEqual([count(/readCompletedShowdown\(/g),count(/firestoreSdk/g),count(/getDoc/g),count(/setDoc|updateDoc|runTransaction|writeBatch|onSnapshot/g)],[1,3,3,0],"as at 2.5.0 (main 36b648ad)");
  ok("GS3","no Firestore read or write added; the Golden code stores only this device's seen mark");
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
