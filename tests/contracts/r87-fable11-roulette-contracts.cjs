"use strict";
// Fable job 11 (r87 Squad Roulette screen and boards), the fixes made for 2.0.0:
//  A1 F11-04 root cause for "an excluded player comes back": a saved shot this build keeps in the reserves never returns
//     through a later refill (rrTakeReserve asks rrExcluded like every other route).
//  A2 F11-07 a kept signing weaker than every fitting starter and every sub is named on the card ("waits in your reserves").
//  A3 F11-01 the scene's turn clock pauses while no frame ran (phone locked, app switched).
//  A4 F11-02 the Google title fonts never block the scene scripts.
//  A5 F11-08 BACK TO SHOWDOWN HOME keeps the roulette and the loading screen up until Home is on screen.
//  A6 F11-11 / F11-12 no dead frame under the result card; a card's buttons answer once.
//  A7 F11-19 long bench surnames are fitted.
//  A8 Nik 2026-11-01: the Rule Book says a guessed player can't be signed again (the entry refusal is HD-01, another PR);
//     the board keeps a guessed player off for good (engine unchanged).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const E=require("../../js/rosterRoulette.js");
const rid="pair_"+"3f9a1c7e5b2d4086a1e7c3b9f05d2e68".repeat(2);
const clubs={playerOne:"Arsenal",playerTwo:"Bournemouth"};
const special={playerOne:{name:"Neymar",overall:92,number:11},playerTwo:{name:"M. Özil",overall:89,number:11}};
const none={playerOne:[],playerTwo:[]};
const names=board=>board.filter(p=>p.name).map(p=>p.name);

// A1: season 1's saved shot names K. Gibbs (an Arsenal reserve on this build, not on the board); season 2's saved shot takes a
// sub, so the bench is refilled from the reserves, where Gibbs (80, #3) would rank first.
{
  const s1=E.forSeason(rid,clubs,1,{special,history:[null]});
  assert.ok(s1&&!names(s1.boards.playerOne).includes("K. Gibbs"),"Gibbs starts in the reserves");
  const subSlot=14,sub=s1.boards.playerOne[subSlot].name;
  const hits=[null,{playerOne:{fired:true,hitName:"K. Gibbs",hitNumber:3,hitSlot:12,hitSignedSeason:null},playerTwo:{fired:false}},
    {playerOne:{fired:true,hitName:sub,hitNumber:s1.boards.playerOne[subSlot].number,hitSlot:subSlot,hitSignedSeason:null},playerTwo:{fired:false}}];
  const s3=E.forSeason(rid,clubs,3,{special,history:[null,none,none],hits});
  assert.ok(s3,"season 3 builds");
  assert.ok(!names(s3.boards.playerOne).includes("K. Gibbs"),"a shot player never returns through a reserve refill");
  assert.ok(!names(s3.boards.playerOne).includes(sub),"the shot sub stays out");
  assert.equal(s3.boards.playerOne.filter(p=>p.name).length,15,"the bench is refilled by somebody else");
  // The same-window gap (a refill in the window the reserve was shot) is closed at its only writer: rrTakeReserve asks
  // rrExcluded, and the reserves are filtered again right after a shot.
  const engineSrc=read("js/rosterRoulette.js");
  assert.match(engineSrc,/for\(let i=0;i<state\.reserves\.length;i\+=1\)if\(!rrExcluded\(state,state\.reserves\[i\]\)&&predicate\(state\.reserves\[i\]\)/);
  assert.match(engineSrc,/rrExclude\(state,at>=0\?state\.board\[at\]:shot\);\n\s*state\.reserves=state\.reserves\.filter\(p=>!rrExcluded\(state,p\)\);/);
  ok("A1","F11-04 a saved shot kept in the reserves never comes back through a refill");
}
// A2
{
  const v1={playerOne:[{slot:1,name:"W. Ben Yedder",position:"ST",overall:72,release:false}],playerTwo:[]};
  const s2=E.forSeason(rid,clubs,2,{special,history:[null,v1]});
  assert.ok(!names(s2.boards.playerOne).includes("W. Ben Yedder"),"a weak signing is not on the board");
  assert.ok(s2.skipped.playerOne.some(x=>x.name==="W. Ben Yedder"&&x.reason==="reserve"&&x.season===1),"and the card is told why");
  const step=read("js/rosterRouletteStep.js");
  assert.match(step,/reserve:name=>`\$\{name\} waits in your reserves: every starter in his line and every sub has a higher overall\.`/);
  ok("A2","F11-07 a kept signing who waits in the reserves is named on the card");
}
const scene=read("visual-assets/v10_1/roulette/index.html");
assert.match(scene,/function tick\(draw\)\{ const t=now\(\);\s*\/\*[^*]*\*\/\s*if\(manual===null&&playing&&last>0&&t-last>\.25\) playing\.t0\+=t-last-\.016;/);
ok("A3","F11-01 the turn clock pauses while no frame ran");
assert.match(scene,/<link rel="stylesheet" media="print" onload="this\.media='all'" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Big\+Shoulders\+Display/);
assert.doesNotMatch(scene,/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com/,"no render-blocking font stylesheet is left");
ok("A4","F11-02 the title fonts never block the scene scripts");
const step=read("js/rosterRouletteStep.js");
assert.match(step,/if\(go===false\)\{leftForHome=true;holding=false;rrsLoadingOn\(\);const tear=\(\)=>\{if\(\(running&&running!==run\)\|\|holding\)return;rrsRemovePanel\(\);rrsRemoveStage\(\);rrsLoadingOff\(\);\};/);
assert.match(step,/void Promise\.resolve\(\)\.then\(\(\)=>root\.navigateTo\("mainMenu"\)\)\.catch\(\(\)=>\{\}\)\.finally\(tear\);else tear\(\);/);
ok("A5","F11-08 the roulette stays up until Showdown Home is on screen");
assert.match(step,/if\(end!=="continue"\)\{sceneFailedHere\.add\(rrsKey\(ctx\)\);rrsRemoveStage\(\);return "skipped";\}/);
assert.match(step,/for\(const other of pressed\)other\.disabled=true;/);
ok("A6","F11-11 no dead frame under the card; F11-12 one answer per card");
// r89: the bench is a strip of FIFA 17 cards; each surname is fitted to its card by fitText (shrink to 18 px, then "…").
assert.match(scene,/const surW=cw-24; const sur=fitText\(ctx,surname\(name\),700,25,18,surW\);/);
assert.match(scene,/function fitText\(ctx,text,weight,size,minSize,maxW\)\{[^\n]*\n\s*while\(fs>minSize&&ctx\.measureText\(t\)\.width>maxW\)\{ fs--; font\(\); \}\n\s*if\(ctx\.measureText\(t\)\.width>maxW\)\{ while\(t\.length>2&&ctx\.measureText\(t\+"…"\)\.width>maxW\) t=t\.slice\(0,-1\); t\+="…"; \}/);
ok("A7","F11-19 long bench surnames are fitted");
const rules=read("js/ruleBook.js");
assert.match(rules,/"A player your rival guesses is released, and you can never sign him again\."/);
// Owner 2026-11-03: the Rule Book's roulette card says how the board fills (the old "a signing weaker than every starter
// ... waits in your reserves" line was wrong: a lost player's place goes first to that window's signing in his line).
assert.match(rules,/A signing your rival guessed never joins your board: you can never sign him again\./);
assert.match(rules,/Kept signings, at the overall you typed, replace any weaker starter or sub, even when nobody was lost\./);
assert.match(rules,/A lost player's place goes first to that window's signing in his line, however weak, then to your best sub\. No keeper left: your best outfielder goes in goal until you sign one\./);
assert.match(rules,/Replaced players wait in hidden reserves, off the board, and come back when better players are lost\./);
assert.match(rules,/A player the roulette shot never comes back and can't be signed back\./);
assert.match(rules,/your chance of a hit is his goals out of 7: 0 goals never fires, 7 always does/);
assert.doesNotMatch(rules,/waits in your reserves|one in seven/i);
// The board keeps a guessed player off for good (Nik's pick 2026-11-01 14:02 UTC): a re-signed Kanté stays off.
{
  const v1={playerOne:[{slot:1,name:"N. Kanté",position:"CDM",overall:87,release:true}],playerTwo:[]};
  const v2={playerOne:[{slot:1,name:"N. Kanté",position:"CDM",overall:87,release:false}],playerTwo:[]};
  const s3=E.forSeason(rid,clubs,3,{special,history:[null,v1,v2]});
  assert.ok(!names(s3.boards.playerOne).includes("N. Kanté"));
  assert.ok(s3.skipped.playerOne.some(x=>x.name==="N. Kanté"&&x.reason==="guessed"));
}
ok("A8","Rule Book: a guessed player can't be signed again; the board keeps him off for good");
console.log(`r87 Fable job 11 roulette contracts: ${checks} checks passed`);
