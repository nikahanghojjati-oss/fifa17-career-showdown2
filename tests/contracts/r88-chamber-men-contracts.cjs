"use strict";
// r88 Chamber Men (Nik 2026-11-02 13:53 UTC: name and rule; design https://claude.ai/artifact/KzN1uypy5EZhLx8C4AiQMK).
//   CM1 rule: 7 rounds, both managers pick a shot and a dive (L M R); a goal when the shot and the rival's dive differ;
//       a "-" shot (own clock out) is a miss, a "-" dive stays in the middle.
//   CM2 record: one pick string per manager, two letters a round, never ahead of the other, never more than 7 rounds.
//   CM3 cylinders: kick k of a manager loads chamber k of the RIVAL's cylinder; a manager's cylinder holds the rival's goals.
//   CM4 roulette: in a Chamber Men Showdown the spin fires exactly when the cylinder stops on a live chamber (goals out of 7),
//       aims at the same player as before, never falls back to one bullet, and a one-bullet Showdown plays exactly as 2.0.0.
//   CM5 order: Chamber Men -> Roster Russian Roulette -> Prime Pack -> Transfer War, the roulette fed by this season's cylinders.
//   CM6 boundary: only Showdowns confirmed from CHAMBER_FROM_MS on (r88's own release time, set by tools/set-release-time.cjs
//       --r88), never before 2.0.0's release; old Showdowns keep one bullet.
//   CM7 shell + Rules: the step, rules and styles are precached; the Rules allow own-string appends only.
//   CM8 screen: no dimming, no rgba scrim, nothing invented (no Math.random), every button reachable on a scrolling stage.
//   CM9 hand-off: BACK TO SHOWDOWN HOME runs the step's own handler (the app's smart-back delegation leaves it alone), and
//       after SPIN THE CYLINDER the screen stays until the roulette has run, so the dashboard never shows in between.
//   CM10 a pick is bound to its round (Codex #1205): a send for round k that reaches the server after this manager's round k
//       is already in (a second tab, a transaction retry) is refused, never stored as round k+1.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const CM=require("../../js/chamberMen.js");
const RR=require("../../js/rosterRoulette.js");
const Squads=require("../../data/rosterSquads.js");
const results=[];const ok=(id,label)=>{results.push(id);console.log(`ok ${results.length} ${id} ${label}`);};

// CM1
{
  assert.equal(CM.rounds,7);assert.equal(CM.chambers,7);assert.deepEqual([...CM.sides],["L","M","R"]);
  for(const shot of ["L","M","R"])for(const dive of ["L","M","R"])assert.equal(CM.goal(shot,dive),shot!==dive,`${shot} vs ${dive}`);
  assert.equal(CM.goal("-","L"),false,"no shot in time is a miss");
  assert.equal(CM.goal("L","-"),true,"a keeper out of time stays in the middle: a side shot goes in");
  assert.equal(CM.goal("M","-"),false,"a keeper out of time stays in the middle: a middle shot is saved");
  assert.equal(CM.pick("L",null),"L-");assert.equal(CM.pick(undefined,"R"),"-R");assert.equal(CM.pick("X","M"),"-M");
  ok("CM1","a goal is a shot the keeper did not go to; a timed-out shot misses, a timed-out keeper stays in the middle");
}
// CM2
{
  let r=CM.record({playerOne:"",playerTwo:""});
  assert.equal(CM.nextRound(r,"playerOne"),1);assert.equal(CM.nextRound(r,"playerTwo"),1);
  r=CM.send(r,"playerOne","LR");assert.deepEqual({...r},{playerOne:"LR",playerTwo:""});
  assert.equal(CM.nextRound(r,"playerOne"),null,"Daniel waits for Nik's round 1");
  assert.equal(CM.send(r,"playerOne","MM"),null,"no running ahead");
  assert.equal(CM.roundsOf(r).length,0,"a round shows only once both picks are in");
  r=CM.send(r,"playerTwo","RL");assert.equal(CM.roundsOf(r).length,1);
  assert.equal(CM.record({playerOne:"LRMM",playerTwo:""}),null,"two rounds ahead is never a valid record");
  assert.equal(CM.record({playerOne:"LRX",playerTwo:""}),null);assert.equal(CM.record({playerOne:"LZ",playerTwo:""}),null);
  assert.equal(CM.record({playerOne:"LR".repeat(8),playerTwo:"LR".repeat(7)}),null,"never more than 7 rounds");
  assert.equal(CM.send(r,"playerOne","LRM"),null,"exactly two letters a round");
  ok("CM2","one pick string each, one round at a time, never ahead, at most 7, hidden until both are in");
}
// CM3
{
  const r=CM.record({playerOne:"LRMMRL-LLRRMMR",playerTwo:"RLLMRRMMLRLLR-"});
  const rounds=CM.roundsOf(r),score=CM.score(r),cyl=CM.cylinders(r);
  assert.equal(rounds.length,7);
  for(const round of rounds){
    assert.equal(cyl.playerTwo[round.round-1],round.goal.playerOne,"Daniel's kick k loads chamber k of Nik's cylinder");
    assert.equal(cyl.playerOne[round.round-1],round.goal.playerTwo,"Nik's kick k loads chamber k of Daniel's cylinder");
  }
  assert.equal(CM.bullets(cyl.playerOne),score.playerTwo);assert.equal(CM.bullets(cyl.playerTwo),score.playerOne);
  assert.equal(CM.cylinders(CM.record({playerOne:"LR",playerTwo:"RL"})),null,"no cylinder from an unfinished shootout");
  assert.equal(CM.cylinders(CM.record({playerOne:"LL".repeat(7),playerTwo:"RR".repeat(7)})).playerOne.filter(Boolean).length,7,"Nik shoots right 7 times, Daniel dives left: 7 live rounds");
  ok("CM3","each manager's cylinder holds the rival's goals, chamber k = kick k; nothing before all 7 rounds");
}
// CM4
{
  const clubs=Object.keys(Squads.squads),pair={playerOne:clubs[0],playerTwo:clubs[1]};
  const crypto=require("node:crypto");
  const loaded=n=>Array.from({length:7},(_,i)=>i<n);
  let fired=0,total=0;
  for(let i=0;i<350;i+=1){
    const rid=`pair_${crypto.createHash("sha256").update(`cm4-${i}`).digest("hex")}`,n=i%8;
    const cyl={playerOne:loaded(n),playerTwo:loaded(7-n)};
    const classic=RR.forSeason(rid,pair,1,{});
    const plan=RR.forSeason(rid,pair,1,{chamberMen:true,chambers:{1:cyl}});
    for(const [k,turn] of plan.turns.entries()){
      const want=cyl[turn.role];
      assert.equal(turn.fired,want[turn.stopChamber],"fires exactly on a live chamber");
      assert.deepEqual([...turn.loadedChambers],want.map((on,j)=>on?j:-1).filter(j=>j>=0));
      assert.equal(turn.aimSlot,classic.turns[k].aimSlot,"the barrel aims where it always did");
      assert.equal(turn.stopChamber,classic.turns[k].stopChamber,"the drum stops where it always did");
      if(turn.fired)assert.equal(turn.bulletChamber,turn.stopChamber);
      if(turn.role==="playerOne"&&n===3){total+=1;if(turn.fired)fired+=1;}
    }
    if(n===0)assert.equal(plan.turns[0].fired,false,"no goals by the rival: safe");
    if(n===7)assert.equal(plan.turns[0].fired,true,"seven goals by the rival: a sure hit");
  }
  assert.ok(total>30&&fired/total>0.15&&fired/total<0.75,`3 of 7 fires about 3 times in 7 (${fired}/${total})`);
  const rid=`pair_${"cd".repeat(32)}`;
  assert.equal(RR.forSeason(rid,pair,1,{chamberMen:true}),null,"a Chamber Men Showdown never spins one bullet");
  assert.equal(RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{2:{playerOne:loaded(2),playerTwo:loaded(2)}},history:[null,{playerOne:[],playerTwo:[]}]}),null,"nor replays an earlier season without its saved spin or cylinders");
  const saved=RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{2:{playerOne:loaded(2),playerTwo:loaded(2)}},history:[null,{playerOne:[],playerTwo:[]}],hits:{1:{playerOne:{fired:false},playerTwo:{fired:false}}}});
  assert.ok(saved,"an earlier season replays from its saved spin marks");
  // A saved safe spin never stops on a live round; a saved hit stops on one.
  const safeSaved=RR.forSeason(rid,pair,1,{chamberMen:true,chambers:{1:{playerOne:loaded(6),playerTwo:loaded(6)}},hits:{1:{playerOne:{fired:false},playerTwo:{fired:false}}}});
  for(const turn of safeSaved.turns){assert.equal(turn.fired,false);assert.ok(!turn.loadedChambers.includes(turn.stopChamber),"a saved safe spin stops on an empty chamber");}
  // One-bullet Showdowns: unchanged from 2.0.0 (no loaded chambers, the same plan as the engine always made).
  const one=RR.forSeason(rid,pair,1,{});for(const turn of one.turns){assert.equal(turn.loadedChambers,null);assert.equal(turn.fired,turn.bulletChamber===turn.stopChamber);}
  ok("CM4","the roulette fires on a live chamber (goals out of 7), aims as before, never falls back to one bullet; one-bullet Showdowns unchanged");
}
// CM5
{
  const pstc=read("js/productionSharedTransferChallenge.js");
  const open=/async function pstcOpenNow\(\)\{[\s\S]*?\n/.exec(pstc)[0];
  const at=name=>open.indexOf(`await ${name}(request)`);
  assert.ok(at("pstcChamberMenFirst")>0&&at("pstcChamberMenFirst")<at("pstcRouletteFirst")&&at("pstcRouletteFirst")<at("pstcPrimePackFirst")&&at("pstcPrimePackFirst")<open.indexOf('navigateTo("transferChallenge")'),"Chamber Men, roulette, Prime Pack, Transfer War");
  assert.match(pstc,/chamberMen:chamberGate&&chamberGate\.key===request\.key\?\{active:true,chambers:/,"the roulette gets this season's cylinders");
  assert.match(pstc,/const cylinders=await step\.cylinders\(ctx,io\);\s*if\(!cylinders\|\|cylinders\.ok!==true\)\{rouletteError=PSTC_ROULETTE_TEXT\.chamberCylinders;return false;\}/,"no cylinders: the roulette stays shut");
  assert.match(pstc,/function pstcCloseRoulette\(\)\{try\{root\.CareerModeChamberMenStep\?\.close\?\.\(\);/,"the step closes with the others");
  const step=read("js/rosterRouletteStep.js");
  assert.match(step,/chamberMen:Boolean\(chamber\),chambers:chamber\?chambers:null/);
  assert.match(step,/const chambers=chamber&&known\?await rrsEarlierChambers\(ctx,engine,hits,chamber\):null;/,"earlier seasons without a saved spin replay their own shootout (F17-01)");
  assert.match(step,/loadedChambers:Array\.isArray\(turn\.loadedChambers\)/,"the scene gets the live chambers");
  const page=read("visual-assets/v10_1/roulette/index.html");
  assert.match(page,/cyl\.userData\.placeRounds=/);assert.match(page,/if\(plan\.loadedChambers\) cyl\.userData\.placeRounds\(plan\.loadedChambers\)/);
  ok("CM5","Chamber Men opens before the roulette, which spins this season's cylinders and shows every live round");
}
// CM6
{
  const tool=require("../../tools/set-release-time.cjs");
  assert.deepEqual(tool.R88_RELEASE_TIME_CONSTANTS.map(c=>`${c.file}:${c.name}`),["js/chamberMen.js:CHAMBER_FROM_MS","js/productionSharedTransferChallenge.js:CHAMBER_FROM_MS"]);
  const times=tool.read(tool.R88_RELEASE_TIME_CONSTANTS),r88=times[0].value,r87=tool.read()[0].value;
  assert.ok(times.every(t=>t.value===r88),"both Chamber Men start times are the same minute");
  // A Showdown confirmed before it never loads the step (a step file that fails to load cannot stop an older Showdown).
  assert.match(read("js/productionSharedTransferChallenge.js"),/if\(confirmedAtMs<CHAMBER_FROM_MS\)return true;\n\s*let timer;const step=await Promise\.race\(\[pstcLoadScript\("chamber-men-step"/);
  assert.ok(Date.parse(r88)>Date.parse(r87),"Chamber Men starts after 2.0.0's release");
  assert.equal(CM.fromMs,Date.parse(r88));
  const rid=`pair_${"ab".repeat(32)}`;
  assert.equal(CM.eligible(rid,Date.parse(r87)+3600000),false,"a 2.0.0 Showdown keeps one bullet");
  assert.equal(CM.eligible(rid,CM.fromMs),true);assert.equal(CM.eligible("pair_x",CM.fromMs),false);assert.equal(CM.eligible(rid,null),false);
  const Step=require("../../js/chamberMenStep.js");
  assert.equal(Step.applies({rivalryId:rid,managerRole:"playerOne",season:1,confirmedAtMs:CM.fromMs}),true);
  assert.equal(Step.applies({rivalryId:rid,managerRole:"playerOne",season:11,confirmedAtMs:CM.fromMs}),false);
  assert.equal(Step.applies({rivalryId:rid,managerRole:"playerOne",season:1,confirmedAtMs:CM.fromMs-1}),false);
  ok("CM6",`only Showdowns confirmed from ${r88} (r88's own release time) play Chamber Men`);
}
// CM7
{
  const sw=read("service-worker.js");
  for(const file of ["js/chamberMenStep.js","js/chamberMen.js","css/chamberMen.css"])assert.match(sw,new RegExp(`"${file.replace(/[.]/g,"\\.")}"`),`${file} is precached`);
  const rules=read("firestore.season-results-production.fragment.rules");
  assert.match(rules,/match \/chamberMenRounds\/\{seasonId\} \{\s*allow get: if ssjrEntitled\(rivalryId\);\s*allow list, delete: if false;/);
  assert.match(rules,/after\.kicks\[other\] == before\.kicks\[other\]\s*&& before\.kicks\[role\]\.size\(\) <= before\.kicks\[other\]\.size\(\)\s*&& after\.kicks\[role\]\.matches\(before\.kicks\[role\] \+ '\[LMR-\]\{2\}'\);/);
  assert.match(rules,/root\.kicks\.playerOne is string && root\.kicks\.playerOne\.size\(\) <= 14/);
  ok("CM7","the step, rules and styles are precached; the Rules allow only one own round at a time, never ahead");
}
// CM8
{
  const step=read("js/chamberMenStep.js"),css=read("css/chamberMen.css");
  assert.ok(!/Math\.random/.test(step+read("js/chamberMen.js")),"nothing is made up");
  assert.ok(!/background(?:-color)?\s*:\s*(?:rgba|hsla)\(/i.test(css),"no translucent scrim");
  assert.ok(!/opacity\s*:\s*0?\.\d/.test(css)&&!/filter\s*:\s*brightness/.test(css),"no dimming");
  assert.match(css,/#cmStage \{[\s\S]*?overflow: auto;/,"the stage scrolls, so every button stays reachable");
  assert.match(step,/BACK TO SHOWDOWN HOME/);
  ok("CM8","no dimming or scrim, nothing invented, a scrolling stage with a way home");
}
// CM9
{
  const step=read("js/chamberMenStep.js"),screens=read("js/screens.js"),pstc=read("js/productionSharedTransferChallenge.js");
  assert.equal((step.match(/cmsEl\("button","cmBack","BACK TO SHOWDOWN HOME"\)/g)||[]).length,2,"both of the step's back buttons are its own");
  assert.ok(!/cmsEl\("button","[^"]*backButton/.test(step),"never .backButton, which smart back takes first");
  assert.match(screens,/event\.target\.closest\("\.backButton"\)/,"smart back still only takes .backButton");
  assert.match(step,/running=cmsRunNow\(ctx,io\)\.then\(go=>\{if\(!go\)cmsClose\(\);return go;\}/,"a true result keeps the screen up");
  assert.match(pstc,/const rouletteGo=await pstcRouletteFirst\(request\);try\{root\.CareerModeChamberMenStep\?\.close\?\.\(\);\}catch\(_error\)\{\}/,"the window closes it once the roulette has run");
  assert.match(read("tests/browser/support/roster-roulette.cjs"),/async function playChamberMen\(page\)/,"browser journeys play it (CMS_CHAMBER_MEN_NOW=1)");
  ok("CM9","BACK TO SHOWDOWN HOME leaves the step; after SPIN THE CYLINDER the screen holds until the roulette has run");
}
// CM10
(async()=>{
  const Step=require("../../js/chamberMenStep.js");
  const rid=`pair_${"ab".repeat(32)}`,ctx={rivalryId:rid,managerRole:"playerOne",season:1};
  const io=data=>{
    const writes=[];
    const sdk={doc:()=>({}),serverTimestamp:()=>"ts",runTransaction:async(_fs,fn)=>fn({get:async()=>({exists:()=>Boolean(data),data:()=>data}),set:(_r,d)=>writes.push(["set",d]),update:(_r,d)=>writes.push(["update",d])})};
    return {io:{firestore:{},sdk,rivalryId:rid,sessionId:"s",deviceId:"d"},writes};
  };
  const doc=(p1,p2)=>({schemaVersion:1,objectType:"sharedChamberMenRound",rivalryId:rid,seasonNumber:1,kicks:{playerOne:p1,playerTwo:p2},revision:3});
  // Daniel's round 1 ("LR") and Nik's round 1 are in; a late round-1 send from Daniel's other tab must not become round 2.
  {const {io:a,writes}=io(doc("LR","RL"));const r=await Step.send(a,ctx,"MM",1);
    assert.equal(r.ok,false,"a late round-1 pick is refused");assert.equal(writes.length,0,"nothing is written");}
  {const {io:a,writes}=io(doc("LR","RL"));const r=await Step.send(a,ctx,"MM",2);
    assert.equal(r.ok,true,"the round-2 pick goes in");assert.equal(writes[0][1]["kicks.playerOne"],"LRMM");}
  // The first pick of all (no record yet) is round 1 only.
  {const {io:a,writes}=io(null);assert.equal((await Step.send(a,ctx,"LL",2)).ok,false);assert.equal(writes.length,0);
    const r=await Step.send(a,ctx,"LL",1);assert.equal(r.ok,true);assert.equal(writes[0][1].kicks.playerOne,"LL");}
  assert.match(read("js/chamberMenStep.js"),/cmsSend\(io,ctx,engine\.pick\(sel\.shot,sel\.dive\),round\)/,"the screen sends the round it is showing");
  ok("CM10","a pick goes in only as the round it was made for; a late or repeated send is refused");
  console.log(`PASS r88 Chamber Men contracts: ${results.length} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
