"use strict";
// r87 Russian Roster Roulette in browser journeys: every season, before the Transfer Challenge opens, each manager plays
// both spins (Team V's page in the #rrStage frame: "Daniel spins", "Nik spins", "Continue") and taps the result panel's
// primary button (I'VE RELEASED HIM / GO TO THE PRIME PACK / GO TO THE TRANSFER WAR). A scene that cannot load (no three.js) is skipped by the
// app and only the panel shows. waitForTransfer() plays whatever roulette is on screen until the Transfer Challenge shows.
//
// r87 Prime Pack (js/iconGuessStep.js, page visual-assets/v10_1/icon-guess) runs after the roulette and before the window.
// The round starts only when BOTH managers have arrived, so a journey must drive both phones at once: pass both pages
// (waitForTransfer([daniel.page, nik.page])); it also drives every other open page of the same browser and any page
// registered with track().
// See playPrimePack for the primeGuesser option. Every phone then taps Continue on the result.
//
// r88 Chamber Men (js/chamberMenStep.js, #cmStage) runs before the roulette in Showdowns confirmed from CHAMBER_FROM_MS on
// (journeys run it now with CMS_CHAMBER_MEN_NOW=1). Each phone picks a shot and a dive and taps LOCK IN for each of the seven
// rounds, then SPIN THE CYLINDER. The picks follow a fixed pattern by round and role, so a run gives a mix of goals and saves.
const prime=require("./prime-pack.cjs");
const STEP_MS=500;
const tracked=new Set();

async function playRoulette(page,opts={}){
  // The Prime Pack first: while it runs, the roulette's panel can still sit underneath its stage.
  track(page);
  const prime=await playPrimePack(page,opts);if(prime)return prime;
  const chamber=await playChamberMen(page);if(chamber)return chamber;
  const stage=page.locator("#rrStage");
  if(await stage.isVisible().catch(()=>false)){
    const cta=page.frameLocator("#rrStage iframe").locator("#cta");
    if(await cta.isEnabled({timeout:STEP_MS}).catch(()=>false)){await cta.click({timeout:5000}).catch(()=>{});return "spin";}
    return "wait";
  }
  const primary=page.locator("#rrStepPanel .rrStepPrimary");
  if(await primary.isVisible().catch(()=>false)){const label=process.env.CMS_ROULETTE_DEBUG==="1"?`:${(await primary.textContent().catch(()=>"")||"").trim()}`:"";await primary.click({timeout:5000}).catch(()=>{});return `panel${label}`;}
  return null;
}

// One Chamber Men step on this phone: "chamber-kick" (picked and locked in), "chamber-continue" (SPIN THE CYLINDER),
// "chamber-retry" (TRY AGAIN on a fault), "wait" or null (no Chamber Men on screen). Real taps: anything standing over the
// buttons fails them.
const CHAMBER_SIDES=["L","M","R"];
async function playChamberMen(page){
  const stage=page.locator("#cmStage");
  if(!await stage.isVisible().catch(()=>false))return null;
  const next=stage.locator(".cmNext");
  if(await next.isVisible().catch(()=>false)){
    // Pressed: the screen stays under the roulette until the roulette is on screen.
    if(!await next.isEnabled().catch(()=>false))return null;
    await next.click({timeout:5000}).catch(()=>{});return "chamber-continue";
  }
  const lock=stage.locator(".cmLock");
  if(!await lock.isVisible().catch(()=>false)){
    const retry=stage.locator(".menuButton",{hasText:"TRY AGAIN"});
    if(await retry.isVisible().catch(()=>false)){await retry.click({timeout:5000}).catch(()=>{});return "chamber-retry";}
    return "wait";
  }
  const shotButton=stage.locator('.cmChoice[data-kind="shot"]').first();
  if(!await shotButton.isEnabled().catch(()=>false))return "wait";
  const round=Number(((await stage.locator(".cmRound").textContent().catch(()=>""))||"").replace(/\D+/g," ").trim().split(" ")[0])||1;
  const role=await page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.managerRole||"playerOne").catch(()=>"playerOne");
  const one=role==="playerOne"?0:1;
  const shot=CHAMBER_SIDES[(round+one)%3],dive=CHAMBER_SIDES[(round*2+one)%3];
  await stage.locator(`.cmChoice[data-kind="shot"][data-side="${shot}"]`).click({timeout:5000}).catch(()=>{});
  await stage.locator(`.cmChoice[data-kind="dive"][data-side="${dive}"]`).click({timeout:5000}).catch(()=>{});
  if(!await lock.isEnabled().catch(()=>false))return "wait";
  await lock.click({timeout:5000}).catch(()=>{});
  return "chamber-kick";
}

function primeFrame(page){return page.frames().find(frame=>/\/icon-guess\//.test(frame.url()))||null;}
// This season's answer and two wrong names, from the same draw the app uses (the page never holds the name before the result).
async function primeNames(page){
  return page.evaluate(()=>{
    const v=window.CareerModeProductionSharedTransferChallenge?.getState?.(),step=window.CareerModeIconGuessStep,list=window.CareerModeIcons;
    if(!v||!step||!list)return null;
    const pick=step.round({rivalryId:v.rivalryId,season:v.seasonNumber,managerRole:v.managerRole});
    if(!pick||!pick.round)return null;
    const wrong=list.players.filter(p=>p.id!==pick.answerId).slice(v.managerRole==="playerOne"?0:2).slice(0,2).map(p=>p.fullName);
    // Two Icons share the card name "Laudrup": the app answers that name "ambiguous" (no chip, no guess), as a phone does, and
    // offers both full names. The guesser then names the full name, as a player picks it from the suggestions.
    const icon=list.players.find(p=>p.id===pick.answerId),shared=list.players.filter(p=>p.name===pick.round.name).length>1;
    return {answer:shared&&icon?icon.fullName:pick.round.name,wrong};
  }).catch(()=>null);
}
// One Prime Pack step on this phone: "prime-guess" (the right name), "prime-miss" (a wrong name), "prime-continue",
// "prime-retry", "wait" or null (no Prime Pack on screen). primeGuesser "playerOne" | "playerTwo": that manager names the card
// as soon as he can (stage 1, 4 points) and the other waits; null (the default): every phone spends both guesses on wrong
// names, so the round is a draw at once (no points, no 95 s wait); "timeout": nobody guesses and the stages run out.
// A fresh browser shows this season's finished round once (Continue).
// One line each time a phone's Prime Pack reason changes (why it waits, what it typed), so a round that runs out in CI says why.
const primeWhyLast=new WeakMap();
function primeWhy(page,state,why){
  const line=state?`${why} | me=${state.me} stage=${state.stage} chips=${JSON.stringify(state.chips)} waitingFor=${state.waitingFor} pending=${state.pending} result=${state.result?JSON.stringify(state.result):null} banner=${state.banner}`:`${why} | no page state`;
  if(primeWhyLast.get(page)!==line){primeWhyLast.set(page,line);console.log(`--- prime ${new Date().toISOString().slice(11,23)} ${line}`);}
  return "wait";
}
async function playPrimePack(page,{primeGuesser=null}={}){
  const panel=page.locator("#igStepPanel .rrStepPrimary");
  if(await panel.isVisible().catch(()=>false)){await panel.click({timeout:5000}).catch(()=>{});return "prime-retry";}
  if(!await page.locator("#igStage").isVisible().catch(()=>false))return null;
  const frame=primeFrame(page);if(!frame)return "wait";
  const state=await frame.evaluate(()=>window.__ig?.state?.()||null).catch(()=>null);if(!state)return "wait";
  const planned=prime.enabled()?await page.evaluate(()=>{const v=window.CareerModeProductionSharedTransferChallenge?.getState?.();return v?{season:v.seasonNumber,role:v.managerRole}:null;}).catch(()=>null):null;
  if(state.result&&planned)prime.observe(planned.role,planned.season,state);
  // A real tap (no forced click): anything standing over the Prime Pack would fail it.
  if(state.cta){const r=await frame.locator("#cta").click({timeout:5000}).then(()=>"",e=>process.env.CMS_ROULETTE_DEBUG==="1"?":"+String(e.message).slice(0,900):"");return "prime-continue"+r;}
  // CE2PG_PRIME=table|golden (tests/browser/support/prime-pack.cjs): the season's planned winner names the card in the planned stage
  // (4, 3, 2 or 1 points); a season with no winner runs the stages out. Seen results are kept for the end-of-run check.
  const plan=planned&&prime.planFor(planned.season);
  if(plan){
    if(!plan.winner)return state.result||!state.canGuess?"wait":"wait";
    primeGuesser=plan.winner==="daniel"?"playerOne":"playerTwo";
    // Sol r4 S61-r87-01: the server stamps the guess with its own time and the phone's clock comes from a second-resolution
    // token time (up to about 0.5 s off), so a guess typed the instant a stage appears can land in the previous stage on the
    // server. Guess only once this stage's reveal has finished (1.5 s or more in), well clear of the stage edge.
    if(!state.result&&state.me===primeGuesser&&(state.beat!==plan.beat||state.revealing))return "wait";
  }
  if(state.result||!state.canGuess||primeGuesser==="timeout")return primeWhy(page,state,state.result?"result":!state.canGuess?"cannot-guess":"timeout-plan");
  if(primeGuesser&&state.me!==primeGuesser)return primeWhy(page,state,"not-the-guesser");
  const names=await primeNames(page);if(!names)return primeWhy(page,state,"no-names");
  const text=primeGuesser?names.answer:names.wrong[2-(state.chips[state.me]||0)];if(!text)return "wait";
  await frame.locator("#guess").fill(text,{timeout:5000}).catch(()=>{});
  // Enter sends the typed name, as the phone keyboard's send key does.
  await frame.locator("#guess").press("Enter",{timeout:5000}).catch(()=>{});
  await page.waitForTimeout(STEP_MS);
  primeWhy(page,await frame.evaluate(()=>window.__ig?.state?.()||null).catch(()=>null),`typed ${primeGuesser?"answer":"wrong"} "${text}"`);
  return primeGuesser?"prime-guess":"prime-miss";
}

// Every open page of the browsers the given phones run in: the partner phone is usually another context of the same browser.
function browserPages(pages){const out=[];for(const page of pages){try{for(const context of page.context().browser()?.contexts()||[])out.push(...context.pages());}catch(_error){}}return out;}
function track(...pages){for(const page of pages.flat())if(page)tracked.add(page);}
async function onTransfer(page){
  return await page.locator("#transferChallenge").isVisible().catch(()=>false)&&!(await page.locator("#cmStage, #rrStage, #rrStepPanel, #igStage, #igStepPanel").count());
}
// Plays every roulette and Prime Pack step on the given phones (and any tracked partner phone) until each given phone shows
// the Transfer Challenge. Returns the steps seen.
async function waitForTransfer(pages,timeout=45000,{primeGuesser=null}={}){
  const targets=(Array.isArray(pages)?pages:[pages]).filter(Boolean);track(targets);
  // A planned Prime Pack round can run its four stages out (~95 s); Chamber Men's seven rounds replay for about 31 s.
  const until=Date.now()+(prime.enabled()?Math.max(timeout,210000):timeout)+(process.env.CMS_CHAMBER_MEN_NOW==="1"?90000:0),seen=[];
  for(;;){
    const drive=[...new Set([...targets,...tracked,...browserPages(targets)])].filter(page=>!page.isClosed());
    const done=[];for(const page of targets)done.push(await onTransfer(page));
    if(done.every(Boolean))return seen;
    if(Date.now()>=until)break;
    for(const page of drive){
      if(targets.includes(page)&&done[targets.indexOf(page)])continue;
      const step=await playRoulette(page,{primeGuesser});
      if(step&&step!=="wait"){seen.push(step);if(process.env.CMS_ROULETTE_DEBUG==="1")console.log(`--- step ${new Date().toISOString().slice(11,23)} ${step}`);}
    }
    await targets[0].waitForTimeout(STEP_MS);
  }
  throw new Error(`Transfer Challenge did not open within ${timeout} ms (roulette steps: ${seen.join(",")||"none"})`);
}

module.exports={playRoulette,playPrimePack,playChamberMen,primeNames,track,waitForTransfer};
