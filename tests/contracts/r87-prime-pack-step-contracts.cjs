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
  assert.equal(Guess.outcome(live,start+100).state,"live");
  const wonAt=start+Guess.stageStarts[2]+Guess.stages[2].revealMs+500;
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
  assert.equal(pick.round.overallHidden,undefined,"the stages table says when the overall shows (stage 4, G Lead 2026-11-01)");
  assert.equal(pick.round.windowMs,undefined);assert.strictEqual(pick.round.stages,Guess.stages,"the page gets the one stages table with the round");
  assert.deepEqual(pick.round.stagePoints,[...Guess.stagePoints],"the page gets the one stage-points table with the round");
  assert.equal(Step.round({...ctx,managerRole:"playerOne"}).answerId,pick.answerId,"both phones get the same icon");
  const seasons=new Set(Array.from({length:10},(_,i)=>Step.round({...ctx,season:i+1}).answerId));
  assert.equal(seasons.size,10,"no icon twice in one Showdown");
  ok("S3","both phones draw the same icon from the Showdown id, never the same one twice in 10 seasons; the page gets the one stages table");
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
        assert.equal(shown.length,Guess.stages[stage].stats,"each stage shows the stat count in the one table");
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
  // The service worker and shell lists are G Lead's after #1149 merges (scope split, 2026-11-01 10:44 UTC): the five files
  // are listed in the handoff note for G Lead to add; this PR leaves service-worker.js as gameplay/r87 has it.
  assert.match(read("js/ruleBook.js"),/Prime Pack: first to name the masked Icon/);
  ok("S6","the winner publishes primePack 1 to 4 (its stage's points) from the round record; the Rule Book has the line");
}

// S8 Nik 2026-11-01 (via G Lead): no dimming, ever. The step's own overlay (igsAsk) is solid, and the file sets no
// translucent background anywhere.
{
  const step=read("js/iconGuessStep.js");
  assert.match(step,/function igsAsk\([\s\S]{0,1200}background:#050403;/,"the igsAsk overlay is solid #050403");
  assert.ok(!/background(?:-color)?\s*:\s*(?:rgba|hsla)\(/i.test(step),"no rgba or hsla background in js/iconGuessStep.js");
  assert.ok(!/\.background(?:Color)?\s*=\s*["'`](?:rgba|hsla)\(/i.test(step),"no rgba or hsla background set from script");
  ok("S8","the Prime Pack step never dims the screen: its overlay is solid #050403 and it sets no rgba background");
}

// S7 the step's own messages to the page match the page's protocol.
{
  const step=read("js/iconGuessStep.js"),page=read("visual-assets/v10_1/icon-guess/index.html");
  for(const type of ["cms-ig-start","cms-ig-waiting","cms-ig-reveal","cms-ig-chips","cms-ig-suggestions","cms-ig-feedback","cms-ig-result"]){assert.ok(step.includes(`"${type}"`),type);assert.ok(page.includes(`"${type}"`),type);}
  for(const kind of ["not-in-list","ambiguous","wrong","used","late","error"]){assert.ok(step.includes(`kind:"${kind}"`)||step.includes(`"${kind}"`),kind);assert.match(page,new RegExp(`kind==="${kind}"`),kind);}
  assert.doesNotMatch(step,/Icon Unmasked/,"players see Prime Pack");
  ok("S7","every message and feedback kind the step sends is one the page handles");
}

// S9 leaving the Prime Pack for Showdown Home is not a fault; a step that could not run says so (never the generic
// "could not be opened from this Career Start state").
{
  const step=read("js/iconGuessStep.js"),pstc=read("js/productionSharedTransferChallenge.js"),pcst=read("js/productionSharedCareerStart.js");
  assert.match(step,/if\(result==="back"\)\{wentHome=true;return false;\}/,"BACK on the stage marks wentHome");
  assert.match(step,/if\(choice==="back"\)\{wentHome=true;return false;\}/,"BACK on the error panel marks wentHome");
  assert.match(step,/wentHome:\(\)=>wentHome/,"the step exports wentHome");
  assert.match(pstc,/if\(go!==true&&!step\.wentHome\?\.\(\)\)primePackLoadError=true;/,"a false run that was not BACK is a Prime Pack fault");
  assert.match(pstc,/rouletteError:\(\)=>rouletteError\|\|\(primePackLoadError\?PSTC_PRIME_PACK_TEXT:""\)/,"Career Start reads the Prime Pack reason");
  assert.equal((pcst.match(/root\.CareerModeIconGuessStep\?\.wentHome\?\.\(\)/g)||[]).length,2,"Career Start treats BACK from the Prime Pack like BACK from the roulette (both places)");
  ok("S9","BACK from the Prime Pack returns home quietly and a Prime Pack fault shows its own reason");
}

// S10 the service worker serves the Prime Pack: its five files are in the install shell (a versioned path outside it is
// refused), and its page is a frame navigation served from the shell (else the frame would get the app's index.html).
{
  const sw=read("service-worker.js");
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  for(const file of ["js/iconGuessStep.js","js/iconGuess.js","js/iconNames.js","data/icons.js","visual-assets/v10_1/icon-guess/index.html"])assert.ok(shell.includes(file),`shell lists ${file}`);
  const frames=/const SHELL_FRAME_NAVIGATION_PATHS = new Set\(\[([\s\S]*?)\]\);/.exec(sw)[1];
  assert.ok(frames.includes('"visual-assets/v10_1/icon-guess/index.html"'),"the Prime Pack page is a shell frame navigation");
  const step=read("js/iconGuessStep.js"),stageFn=step.slice(step.indexOf("function igsStage("),step.indexOf("function igsStage(")+2500);
  assert.ok(stageFn.indexOf("doc.body.append(stage)")>0&&!stageFn.slice(0,stageFn.indexOf("function igsPost(")).includes("CareerModeRosterRouletteStep?.close?.()"),"the stage alone never closes the roulette's panel (Fable F13-07: it stays over a loading page)");
  const ready=step.slice(step.indexOf('if(m.type==="cms-ig-ready"){'),step.indexOf('}else if(m.type==="cms-ig-input")'));
  assert.match(ready,/closeRoulette\(\);join\(\);/,"the roulette's panel goes once the page is ready, so nothing covers the Prime Pack");
  assert.match(step,/const closeRoulette=\(\)=>\{try\{root\.CareerModeRosterRouletteStep\?\.close\?\.\(\);\}catch\(_error\)\{\}\};/);
  ok("S10","the service worker serves the Prime Pack files and its frame page from the shell, and no roulette panel covers its ready stage");
}

// S11 Fable F12-01/03: a right guess scores the stage of the SERVER time of its write. A guess sent at 30.25 s after the later
// arrival whose commit lands at 30.65 s is stage 2 (3 points) on both phones and in the season result, never the 4 points
// this phone's clock saw; the step reads the stamped record back instead of adopting its own client-timed winner, and the
// result on screen follows the record (a winner landing after a shown draw replaces it).
{
  const T=Date.parse("2026-11-01T12:00:00Z");
  const doc=(updatedAtMs)=>({objectType:"sharedPrimePackRound",seasonNumber:1,arrived:{playerOne:ts(T-5000),playerTwo:ts(T)},chipsUsed:{playerOne:1,playerTwo:0},namedBy:"playerOne",updatedAt:ts(updatedAtMs)});
  const stamped=Step.record(doc(T+30650),1);
  assert.equal(Guess.points(stamped).playerOne,3,"a commit stamped at 30.65 s after the later arrival is stage 2: 3 points");
  assert.equal(Guess.points(Step.record(doc(T+30450),1)).playerOne,4,"stamped at 30.45 s it is still stage 1: 4 points");
  const clientTimed=Guess.applyGuess(Step.record({...doc(T),namedBy:null,chipsUsed:{playerOne:0,playerTwo:0}},1),{role:"playerOne",correct:true,atMs:T+30250});
  assert.equal(clientTimed.ok,true);assert.equal(Guess.points(clientTimed.record).playerOne,4,"the phone's own clock at the read would have said 4 (the straddle)");
  const rules=read("firestore.season-results-production.fragment.rules");
  assert.match(rules,/at < \(a > b \? a : b\) \+ duration\.value\(30500, 'ms'\) \? 4/,"the Rules edge for 4 points is 30.5 s after the later arrival");
  const step=read("js/iconGuessStep.js"),guessFn=step.slice(step.indexOf('m.type==="cms-ig-guess"'),step.indexOf('m.type==="cms-ig-continue"'));
  assert.match(guessFn,/if\(check\.correct\)return readBack\(\);/,"a right guess reads the stamped record back");
  assert.ok(guessFn.indexOf("record=next.record")>guessFn.indexOf("if(check.correct)return readBack();"),"only a wrong guess adopts the transaction's record");
  assert.match(step,/const points=out\.winner\?guess\.points\(record\)\[out\.winner\]:0,shown=`\$\{out\.winner\|\|"draw"\}:\$\{points\}`;/,"the result shown is keyed on winner and points, so it follows the record");
  const page=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(page,/if\(S\.result && \(S\.result!=="draw" \|\| result==="draw"\)\) return;/,"the page lets only a late winner replace a shown draw");
  ok("S11","a right guess scores the stage of its server time (30.5 s straddle), and the result on screen follows the stamped record");
}

// S12 Fable F12-02: leaving the screen (BACK, or the phone hidden) before the other manager has arrived withdraws this
// arrival in the Rules and the step, so the round never starts while he is away; showing the screen again arrives again.
{
  const step=read("js/iconGuessStep.js"),rules=read("firestore.season-results-production.fragment.rules");
  assert.match(rules,/function ssjrPackLeave\(before, after, role\) \{\s*return before\.arrived\[role\] != null\s*&& before\.arrived\[ssjrPackOther\(role\)\] == null\s*&& after\.arrived\[role\] == null/,"the Rules let a manager withdraw only his own arrival, only while the other has not arrived");
  assert.match(rules,/ssjrPackArrive\(before, after, role\) \|\| ssjrPackLeave\(before, after, role\) \|\| ssjrPackGuess/,"the update rule takes the leave");
  assert.match(step,/async function igsLeave\(io,ctx\)[\s\S]*?data\.arrived\[me\]!=null&&data\.arrived\[igsOther\(me\)\]===null&&data\.namedBy===null\)\{tx\.update\(ref,\{\[`arrived\.\$\{me\}`\]:null/,"the step withdraws only while the other has not arrived");
  assert.match(step,/back\.addEventListener\("click",\(\)=>\{if\(finished\)return;leave\(\);end\("back"\);\}\)/,"BACK withdraws");
  assert.match(step,/visibilityState==="hidden"\)\{if\(record&&!record\.winner&&record\.arrived\[other\]===null\)\{away=true;leave\(\);\}return;\}[\s\S]{0,200}?if\(away\)\{away=false;rejoinedAt=Date\.now\(\);igsPresence\(\(\)=>igsArrive\(io,ctx\)\)/,"a hidden phone withdraws and arrives again when shown");
  assert.match(step,/await igsPresence\(\(\)=>igsArrive\(io,ctx\)\)/,"arrive and leave run in order");
  ok("S12","leaving while the other manager has not arrived withdraws the arrival (Rules + step: BACK and a hidden phone), and coming back arrives again");
}

console.log(`PASS r87 Prime Pack step contracts: ${checks} checks.`);
// The Fable job 13 fixes run the step itself against a fake page and record (its own file, run here so this entry covers it).
require("node:child_process").execFileSync(process.execPath,[path.join(__dirname,"r87-prime-pack-f13-contracts.cjs")],{stdio:"inherit"});
