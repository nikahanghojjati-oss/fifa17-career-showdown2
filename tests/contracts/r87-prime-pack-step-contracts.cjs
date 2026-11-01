"use strict";
// r87 Prime Pack season step (js/iconGuessStep.js) and where it hooks in (Nik 2026-10-31/11-01).
// The Rules side, run against the emulator with this same step code, is tests/firebase/prime-pack-rules-emulator.cjs.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.join(__dirname,"..","..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

global.window=globalThis;
require("../../data/icons.js");
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const Names=require("../../js/iconNames.js");
globalThis.CareerModeIcons=globalThis.CareerModeIcons||require("../../data/icons.js");
globalThis.CareerModeIconNames=globalThis.CareerModeIconNames||Names;
const RID=`pair_${"7".repeat(64)}`;
const ts=ms=>({toMillis:()=>ms});

// S1 who plays it: Showdowns confirmed on r87 or later only (the Roster Roulette boundary), seasons 1 to 10, the kill switch.
{
  const now=Date.now(),ctx={rivalryId:RID,managerRole:"playerOne",season:1,confirmedAtMs:now};
  assert.equal(Step.applies(ctx),true);
  assert.equal(Step.applies({...ctx,confirmedAtMs:Guess.fromMs-1}),false,"a Showdown confirmed before r87 never plays it");
  assert.equal(Step.applies({...ctx,confirmedAtMs:null}),false,"no confirm time, no Prime Pack");
  assert.equal(Step.applies({...ctx,season:11}),false);assert.equal(Step.applies({...ctx,managerRole:"host"}),false);
  assert.equal(Step.applies({...ctx,rivalryId:"pair_x"}),false);
  globalThis.CMS_PRIME_PACK="off";assert.equal(Step.applies(ctx),false,"the kill switch turns it off");delete globalThis.CMS_PRIME_PACK;
  assert.equal(Guess.fromMs,require("../../js/rosterRouletteStep.js").fromMs,"the same boundary as Roster Roulette");
  ok("S1","only Showdowns confirmed on r87 or later play Prime Pack, seasons 1 to 10; the kill switch turns it off");
}

// S2 the stored round reads back as the round logic's record.
{
  const a=1_800_000_000_000,b=a+4000,start=b+Guess.leadMs;
  const stored={schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:3,arrived:{playerOne:ts(a),playerTwo:ts(b)},chipsUsed:{playerOne:1,playerTwo:0},namedBy:null,revision:4};
  const live=Step.record(stored,3);
  assert.deepEqual(live.arrived,{playerOne:a,playerTwo:b});assert.equal(live.winner,null);
  assert.equal(Guess.outcome(live,start+100,Guess.windowMs).state,"live");
  const wonAt=start+2*(Guess.revealMs+Guess.windowMs)+Guess.revealMs+500;
  const won=Step.record({...stored,chipsUsed:{playerOne:1,playerTwo:1},namedBy:"playerTwo",updatedAt:ts(wonAt)},3);
  assert.deepEqual(won.winner,{role:"playerTwo",beat:2,atMs:wonAt},"the winning write's server time gives the beat");
  assert.deepEqual(Guess.points(won),{playerOne:0,playerTwo:2},"a right guess at stage 3 is worth 2 (Nik 2026-11-01: 4, 3, 2, 1)");
  assert.equal(Step.record(stored,4),null,"another season's record is refused");
  assert.equal(Step.record({...stored,objectType:"x"},3),null);
  assert.equal(Step.record({...stored,chipsUsed:{playerOne:3,playerTwo:0}},3),null,"more than two chips is refused");
  assert.equal(Step.record({...stored,arrived:{playerOne:null,playerTwo:ts(b)},chipsUsed:{playerOne:1,playerTwo:0}},3),null,"a chip before arriving is refused");
  ok("S2","the stored round reads back as the round logic's record; the winner's stage, and so the points, comes from the winning write's server time; bad records are refused");
}

// S3 the card the page gets: the seeded draw from the list, the name and overall sent for the result only.
{
  const ctx={rivalryId:RID,managerRole:"playerTwo",season:2,confirmedAtMs:Date.now()};
  const pick=Step.round(ctx),list=globalThis.CareerModeIcons;
  const draw=Guess.draw(RID,2,list.players.length,list.listVersion),icon=list.players[draw.index];
  assert.equal(pick.answerId,icon.id);
  assert.equal(pick.round.me,"playerTwo");assert.deepEqual(pick.round.names,{playerOne:"Daniel",playerTwo:"Nik"});
  assert.deepEqual(pick.round.statOrder,[...draw.statOrder]);assert.deepEqual(pick.round.stats,icon.stats);
  assert.equal(pick.round.overallHidden,true,"Nik N2: the overall stays hidden until the result");
  assert.equal(pick.round.windowMs,Guess.windowMs);
  assert.deepEqual(pick.round.stagePoints,[...Guess.stagePoints],"the page gets the one stage-points table with the round");
  assert.equal(Step.round({...ctx,managerRole:"playerOne"}).answerId,pick.answerId,"both phones get the same icon");
  const seasons=new Set(Array.from({length:10},(_,i)=>Step.round({...ctx,season:i+1}).answerId));
  assert.equal(seasons.size,10,"no icon twice in one Showdown");
  ok("S3","both phones draw the same icon from the Showdown id, never the same one twice in 10 seasons; the overall stays hidden");
}

// S3b Nik 2026-11-01 ("the stat itself always draws from real data base stats and never random; the selection of which stats
// get revealed is random"): every value a stage shows is that Icon's own card stat from data/icons.js, unchanged; only which of
// the six shows at each stage is random, each one once, and stage 4 shows four of them.
{
  const list=globalThis.CareerModeIcons,byId=new Map(list.players.map(p=>[p.id,p]));
  const {randomBytes}=require("node:crypto");
  const orders=new Set();let rounds=0;
  for(let i=0;i<300;i+=1){
    const rid="pair_"+randomBytes(32).toString("hex");
    for(const season of [1,4,10]){
      const pick=Step.round({rivalryId:rid,managerRole:"playerOne",season,confirmedAtMs:Date.now()}),player=byId.get(pick.answerId);
      assert.ok(player,"the round's icon is in the list");
      assert.deepEqual(pick.round.stats,player.stats,"the six values are the player's own card stats");
      assert.equal(new Set(pick.round.statOrder).size,6,"each stat at most once");assert.deepEqual([...pick.round.statOrder].sort(),[...Guess.stats].sort());
      for(let stage=0;stage<Guess.beats;stage+=1){
        const shown=Guess.revealed(stage,pick.round.statOrder).stats;
        assert.equal(shown.length,stage+1,"stage n shows n stats");
        for(const key of shown)assert.equal(pick.round.stats[key],player.stats[key],`${player.id} ${key} is the real value`);
      }
      orders.add(pick.round.statOrder.slice(0,4).join());rounds+=1;
    }
  }
  assert.ok(orders.size>=300,`which stats show, and in what order, varies from round to round (${orders.size} of 360 possible over ${rounds} rounds)`);
  const page=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(page,/statEl\(k\)\.querySelector\("em"\)\.textContent=String\(round\.stats\[k\]\)/,"the page prints the round's values as given");
  assert.ok(!/Math\.random/.test(read("js/iconGuess.js")+read("js/iconGuessStep.js")+page),"nothing makes a value up");
  assert.match(read("js/ruleBook.js"),/Which stats show is random; the values never are\./,"the Rule Book says so");
  ok("S3b","every value a stage shows is the Icon's real card stat from the list; only which of the six shows is random, each once; the Rule Book says so");
}

// S4 suggestions: a card name two icons share is offered as the full name (typing it alone costs no chip).
{
  const index=Names.defaultIndex();
  const shared=Names.index(globalThis.CareerModeIcons.players).entries.find(e=>Names.match(index,e.name).status==="ambiguous");
  if(shared){const offered=Step.suggestions(index,shared.name);assert.ok(offered.length>0);assert.ok(!offered.includes(shared.name),`"${shared.name}" alone is ambiguous, so it is offered as a full name`);}
  assert.deepEqual(Step.suggestions(index,"z"),[],"one letter offers nothing");
  assert.ok(Step.suggestions(index,"zid").some(name=>/Zidane/.test(name)));
  ok("S4","suggestions offer card names, and the full name where a card name is shared");
}

// S5 the hook: after Roster Roulette, before the window; a false keeps the window shut with a dashboard line.
{
  const pstc=read("js/productionSharedTransferChallenge.js");
  const open=pstc.slice(pstc.indexOf("async function pstcOpenNow"));
  const roulette=open.indexOf("pstcRouletteFirst(request)"),pack=open.indexOf("pstcPrimePackFirst(request)"),nav=open.indexOf('root.navigateTo("transferChallenge")');
  assert.ok(roulette>0&&pack>roulette&&nav>pack,"roulette, then Prime Pack, then the window");
  assert.match(pstc,/async function pstcPrimePackFirst\(request\)\{[\s\S]*?pstcLoadScript\("prime-pack-step","js\/iconGuessStep\.js"[\s\S]*?step\.applies\(ctx\)[\s\S]*?pstcProviderOptions\(request,true\)[\s\S]*?now:\(\)=>pstcAuthoritativeNow\(request\)/);
  assert.match(pstc,/Prime Pack could not load\. Check the connection and tap again\./);
  assert.match(pstc,/function pstcCloseRoulette\(\)\{[^\n]*CareerModeIconGuessStep\?\.close/);
  ok("S5","pstcOpenNow runs Prime Pack after the roulette and before the window, on the server clock; a failure keeps the window shut with a TRY AGAIN line");
}

// S6 the point goes into the winner's Season Result, read from the round record.
{
  const pssr=read("js/productionSharedSeasonResults.js");
  assert.match(pssr,/const publishedResult=await pssrWithPrimePack\(ctx,request,draft\.result\);[\s\S]{0,200}provider\.publishResult\(\{[^}]*result:publishedResult\}\)/);
  assert.match(pssr,/const points=await step\.pointsFor\(/);assert.match(pssr,/Number\.isInteger\(points\)&&points>=1&&points<=4\?\{\.\.\.rest,primePack:points\}:rest/);
  const sw=read("service-worker.js");
  for(const file of ["js/iconGuessStep.js","js/iconGuess.js","js/iconNames.js","data/icons.js","visual-assets/v10_1/icon-guess/index.html"]){
    assert.ok(sw.includes(`  "${file}",`),`${file} is in the offline shell`);
    assert.match(sw,new RegExp(`SHELL_PATHS_ADDED_SINCE_PREVIOUS[^;]*"${file.replace(/[.\/]/g,"\\$&")}"`),`${file} offline for existing installs`);
  }
  assert.match(read("js/ruleBook.js"),/Prime Pack: first to name the masked Icon/);
  ok("S6","the winner publishes primePack 1 to 4 (its stage's points) from the round record; the five files are offline; the Rule Book has the line");
}

// S7 the step's own messages to the page match the page's protocol.
{
  const step=read("js/iconGuessStep.js"),page=read("visual-assets/v10_1/icon-guess/index.html");
  for(const type of ["cms-ig-start","cms-ig-waiting","cms-ig-reveal","cms-ig-chips","cms-ig-suggestions","cms-ig-feedback","cms-ig-result"]){assert.ok(step.includes(`"${type}"`),type);assert.ok(page.includes(`"${type}"`),type);}
  for(const kind of ["not-in-list","ambiguous","wrong","used","late","error"]){assert.ok(step.includes(`kind:"${kind}"`)||step.includes(`"${kind}"`),kind);assert.match(page,new RegExp(`kind==="${kind}"`),kind);}
  assert.doesNotMatch(step,/Icon Unmasked/,"players see Prime Pack");
  ok("S7","every message and feedback kind the step sends is one the page handles");
}

console.log(`PASS r87 Prime Pack step contracts: ${checks} checks.`);
