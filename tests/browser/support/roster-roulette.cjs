"use strict";
// r87 Roster Russian Roulette in browser journeys: every season, before the Transfer Challenge opens, each manager plays
// both spins (Team V's page in the #rrStage frame: "Daniel spins", "Nik spins", "Continue") and taps the result panel's
// primary button (I HAVE RELEASED HIM / GO TO THE PRIME PACK / GO TO THE TRANSFER WAR). A scene that cannot load (no three.js) is skipped by the
// app and only the panel shows. waitForTransfer() plays whatever roulette is on screen until the Transfer Challenge shows.
//
// r87 Prime Pack (js/iconGuessStep.js, page visual-assets/v10_1/icon-guess) runs after the roulette and before the window.
// The round starts only when BOTH managers have arrived, so a journey must drive both phones at once: pass both pages
// (waitForTransfer([daniel.page, nik.page])); it also drives every other open page of the same browser and any page
// registered with track().
// See playPrimePack for the primeGuesser option. Every phone then taps Continue on the result.
//
// r88 Chamber Men (js/chamberMenStep.js, #cmStage) runs before the roulette in every Showdown
// (every journey runs it). Each phone picks a shot and a dive and taps LOCK IN for each of the seven
// rounds, then SPIN THE CYLINDER. The picks follow a fixed pattern by round and role, so a run gives a mix of goals and saves.
//
// r91 Squad Management (js/squadSheetStep.js, #sqStage) runs after Chamber Men and before the roulette ("pre": both squads
// locked, then GO TO THE RUSSIAN ROULETTE) and again after the Transfer War, before Season Results ("post", not in the
// Showdown's last season). playSquad taps the screen's own Lock my squad on the proposed squad, then the next button.
const prime=require("./prime-pack.cjs");
const STEP_MS=500;
const tracked=new Set();
const notesByPage=new WeakMap();// page -> what each Lock my squad tap saw (the click's own error, the screen's words), for a stall report
function squadNotes(page){if(!notesByPage.has(page))notesByPage.set(page,[]);const list=notesByPage.get(page);if(list.length>40)list.splice(0,list.length-40);return list;}
const rated=new WeakMap();// page -> seasons whose "pre" screen already got its CE2PG_SQUAD_RATE change

async function playRoulette0(page,opts={}){
  // The Prime Pack first: while it runs, the roulette's panel can still sit underneath its stage.
  track(page);
  const prime=await playPrimePack(page,opts);if(prime)return prime;
  const chamber=await playChamberMen(page);if(chamber)return chamber;
  const squad=await playSquad0(page);if(squad)return squad;
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

// One Squad Management step on this phone: "squad-next" (GO TO THE RUSSIAN ROULETTE / GO TO SEASON RESULTS), "squad-lock"
// (Lock my squad on the proposed squad), "squad-retry" (TRY AGAIN on a fault), "wait" (saving, or waiting for the rival's
// lock) or null (no Squad Management on screen).
async function playSquad0(page){
  const stage=page.locator("#sqStage");
  if(!await stage.isVisible().catch(()=>false))return null;
  // Left with its next button: it stays up under the next screen until that screen is on top.
  if(await stage.getAttribute("data-state").catch(()=>null)==="leaving")return null;
  const next=stage.locator(".sqNext");
  if(await next.isVisible().catch(()=>false)&&await next.isEnabled().catch(()=>false)){
    const label=process.env.CMS_ROULETTE_DEBUG==="1"?`:${await stage.getAttribute("data-stage").catch(()=>"")}`:"";
    await next.click({timeout:5000}).catch(()=>{});return `squad-next${label}`;
  }
  const lock=stage.locator(".sqmBtn.is-primary");
  // CE2PG_SQUAD_RATE=1 (r91 Gazette squad news proof): on each "pre" screen from season 2 this manager first raises one
  // starter's overall by one (the screen's own + button), so the next paper has squad news to print.
  if(process.env.CE2PG_SQUAD_RATE==="1"&&await stage.getAttribute("data-stage").catch(()=>null)==="pre"&&await lock.isVisible().catch(()=>false)){
    const season=await page.evaluate(()=>document.getElementById("seasonIndicator")?.textContent||"").catch(()=>"");
    const key=`${season}`;if(!rated.has(page))rated.set(page,new Set());
    if(!/^Season 1 \//.test(season)&&!rated.get(page).has(key)){
      rated.get(page).add(key);
      await stage.locator('[data-zone="xi"][data-index="3"]').first().click({timeout:5000}).catch(()=>{});
      await stage.locator('button[aria-label="Raise overall"]').first().click({timeout:5000}).catch(()=>{});
      await page.waitForTimeout(300);return "squad-rate";
    }
  }
  if(await lock.isVisible().catch(()=>false)&&await lock.isEnabled().catch(()=>false)){
    if(process.env.CMS_SQUAD_PROBE==="1")await probeLock(page,stage);
    // CE2PG_NAMESAKE=1 (hunt C1 proof): the screen's "Not in your squad" list, once per screen, so the report shows a shot
    // club player standing next to a kept signing with his name.
    if(process.env.CE2PG_NAMESAKE==="1"){
      const seen=await stage.evaluate(node=>{
        const season=document.getElementById("seasonIndicator")?.textContent||"",n=Number((/Season (\d+)/.exec(season)||[])[1]||0);
        // the roulette's saved outcomes this phone kept (name, shirt, signed season: a club player has no signed season)
        let hits=null;try{const list=JSON.parse(window.readStorageValue("careerModeShowdown.rouletteHits.v1")||"[]"),own=list.filter(item=>Array.isArray(item)&&String(item[0]).endsWith(`|${n}`)).pop();hits=own?own[1]:null;}catch(_e){hits=null;}
        const hit=h=>h&&h.fired?`${h.hitName} #${h.hitNumber??"-"}${h.hitSignedSeason?` (signed S${h.hitSignedSeason})`:" (club player)"}`:"none";
        return {stage:node.dataset.stage||"",season,out:[...node.querySelectorAll(".sqmLeftOut li")].map(x=>x.textContent),hits:hits?`playerOne ${hit(hits.playerOne)}, playerTwo ${hit(hits.playerTwo)}`:"not kept here",me:document.getElementById("onlinePlayerIdentityBadge")?.textContent||""};
      }).catch(()=>null);
      const key=seen?`${seen.season}|${seen.stage}`:"";if(!rated.has(page))rated.set(page,new Set());
      if(seen&&seen.out.length&&!rated.get(page).has(`ns|${key}`)){rated.get(page).add(`ns|${key}`);console.log(`--- squad not in squad ${key} [${seen.me}]: ${seen.out.join(" ; ")} | roulette: ${seen.hits}`);}
    }
    const started=Date.now();let failed=null;
    await lock.click({timeout:5000}).catch(error=>{failed=error;});
    // What the screen says now, and on a failed click what sits on the button (the element at its centre, and every layer over the stage).
    const said=await stage.evaluate((node,failed)=>{
      const out={status:node.querySelector(".sqStatus")?.textContent||"",live:node.querySelector(".sqmLive")?.textContent||"",lock:node.querySelector(".sqmBtn.is-primary")?.textContent||""};
      if(!failed)return out;
      const name=n=>n?`${n.tagName.toLowerCase()}${n.id?"#"+n.id:""}${typeof n.className==="string"&&n.className?"."+n.className.trim().split(/\s+/).join("."):""}`:"none";
      const b=node.querySelector(".sqmBtn.is-primary"),r=b&&b.getBoundingClientRect();
      if(r){const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);out.box=[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)];out.view=[innerWidth,innerHeight];out.atCentre=name(top);out.inStage=Boolean(top&&node.contains(top));}
      out.layers=[...document.body.children].filter(n=>n!==node&&getComputedStyle(n).position==="fixed"&&getComputedStyle(n).display!=="none"&&!n.hidden).map(n=>`${name(n)} z${getComputedStyle(n).zIndex} pe:${getComputedStyle(n).pointerEvents} op:${getComputedStyle(n).opacity}`).slice(0,12);
      out.stages=document.querySelectorAll("#sqStage").length;out.state=node.dataset.state||"";
      return out;
    },Boolean(failed)).catch(error=>({evaluate:String(error.message||error).slice(0,200)}));
    const note={at:new Date().toISOString(),ms:Date.now()-started,click:failed?String(failed.message||failed).split("\n").slice(0,8).join(" | "):"ok",...said};
    squadNotes(page).push(note);
    if(failed)console.log(`--- squad lock tap failed: ${JSON.stringify(note)}`);
    return "squad-lock";
  }
  const retry=stage.locator(".sqRetry");
  if(await retry.isVisible().catch(()=>false)&&await retry.isEnabled().catch(()=>false)){await retry.click({timeout:5000}).catch(()=>{});return "squad-retry";}
  return "wait";
}
// CMS_SQUAD_PROBE=1 (investigation, off by default): the first time a squad screen shows LOCK, sample for 3 s what is on
// top at LOCK's centre (document.elementFromPoint), whether LOCK moves or is redrawn between frames, and whether frames are
// painted at all; then wait a random 0-1.5 s before the tap (timing jitter). One "--- squad probe" line per screen.
async function probeLock(page,stage){
  const first=await stage.evaluate(node=>{if(node.dataset.cmsProbed)return false;node.dataset.cmsProbed="1";return true;}).catch(()=>false);
  if(!first)return;
  const report=await stage.evaluate(node=>new Promise(resolve=>{
    const name=n=>n?`${n.tagName.toLowerCase()}${n.id?"#"+n.id:""}${typeof n.className==="string"&&n.className?"."+n.className.trim().split(/\s+/).join("."):""}`:"none";
    // A thumb scrolls down to LOCK first (on a phone it sits below the fold): so does the probe, then it watches.
    node.querySelector(".sqmBtn.is-primary")?.scrollIntoView({block:"center"});
    const start=performance.now(),out={stage:node.dataset.stage,samples:0,frames:0,blocked:{},moved:0,redrawn:0,outside:0,scrolled:0};
    let lastTop=node.scrollTop;
    let lastBox=null,lastNode=null;
    const sample=()=>{
      const b=node.querySelector(".sqmBtn.is-primary");
      if(b){
        if(lastNode&&b!==lastNode)out.redrawn+=1;lastNode=b;
        const r=b.getBoundingClientRect(),box=[r.left,r.top,r.width,r.height].map(Math.round).join(",");
        if(lastBox&&box!==lastBox)out.moved+=1;lastBox=box;
        if(node.scrollTop!==lastTop)out.scrolled+=1;lastTop=node.scrollTop;
        const x=r.left+r.width/2,y=r.top+r.height/2;
        if(y<0||y>innerHeight||x<0||x>innerWidth)out.outside+=1;
        else{const top=document.elementFromPoint(x,y);if(!top||!(top===b||b.contains(top))){const k=name(top);out.blocked[k]=(out.blocked[k]||0)+1;}}
        out.samples+=1;
      }
      if(performance.now()-start<3000)setTimeout(sample,20+Math.random()*40);else resolve(out);
    };
    const frame=()=>{out.frames+=1;if(performance.now()-start<3000)requestAnimationFrame(frame);};
    requestAnimationFrame(frame);sample();
  })).catch(error=>({error:String(error.message||error).slice(0,160)}));
  console.log(`--- squad probe ${await page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").catch(()=>"")} ${JSON.stringify(report)}`);
  await page.waitForTimeout(Math.floor(Math.random()*1500));
}
// After CONTINUE TO SEASON RESULTS: plays the squad screen (if any) until Season Results (#seasonEntry) is on screen.
async function toSeasonEntry(page,timeout=60000){return playSquadUntil(page,()=>page.locator("#seasonEntry").isVisible(),timeout);}
// Plays the squad screen that comes between the Transfer War and Season Results until #seasonEntry (or whatever Season
// Results shows first) is on screen. Returns the steps seen.
async function playSquadUntil(page,ready,timeout=60000){
  const seen=[],until=Date.now()+timeout;
  while(Date.now()<until){
    if(await ready().catch(()=>false))return seen;
    const step=await playSquad(page);if(step&&step!=="wait")seen.push(step);
    await page.waitForTimeout(STEP_MS);
  }
  // In CI the picture goes with the journey screenshots ($RUNNER_TEMP/browser-journey is uploaded on every run).
  const dir=process.env.CMS_BROWSER_JOURNEY_ARTIFACTS||(process.env.RUNNER_TEMP?require("node:path").join(process.env.RUNNER_TEMP,"browser-journey"):"");
  if(dir){try{require("node:fs").mkdirSync(dir,{recursive:true});await page.screenshot({path:require("node:path").join(dir,`squad-stall-${Date.now()}.png`)});}catch(_error){}}
  const notes=squadNotes(page).slice(-3).map(n=>JSON.stringify(n)).join("\n  ");
  throw new Error(`Season Results did not open within ${timeout} ms (squad steps: ${seen.join(",")||"none"})${notes?`\n  last lock taps:\n  ${notes}`:""}`);
}
// One Chamber Men step on this phone: "chamber-kick" (picked and locked in), "chamber-continue" (SPIN THE CYLINDER),
// "chamber-retry" (TRY AGAIN on a fault), "wait" or null (no Chamber Men on screen). Real taps: anything standing over the
// buttons fails them. Turn by turn (Nik 2026-11-03): on each kick this phone shows only its own part, YOU SHOOT with the
// "Pick your shot" row or YOU KEEP with the "Pick your dive" row; the bot taps a side in the visible row only and checks
// the other row is hidden (nobody shoots and dives on the same kick).
const CHAMBER_SIDES=["L","M","R"];
// Where this phone shoots or dives on kick n. The bot drives both phones, so it can steer the score (CE2PG_CHAMBER_PLAN):
//   "extremes" (the default): season 1 Daniel scores all 7 and Nik none (Daniel's own cylinder empty, Nik's full: a sure hit),
//   season 2 the other way round, later seasons a mix; "mix": every season a mix (shooter and keeper sides from the kick).
// A goal: the keeper dives one side over from the shot; a save: he dives where the shot goes.
function chamberSide(kind,kick,role,season){
  const shooter=kick%2===1?"playerOne":"playerTwo",shot=CHAMBER_SIDES[(kick*7+(season||0))%3];
  const plan=process.env.CE2PG_CHAMBER_PLAN||"extremes";
  let goal;
  if(plan==="extremes"&&season===1)goal=shooter==="playerOne";
  else if(plan==="extremes"&&season===2)goal=shooter==="playerTwo";
  else goal=((kick*5+(season||0)*3)%7)<(1+((season||0)+(shooter==="playerOne"?0:2))%6);
  if(kind==="shot")return shot;
  return goal?CHAMBER_SIDES[(CHAMBER_SIDES.indexOf(shot)+1)%3]:shot;
}
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
  const turn=await stage.locator(".cmTurn").getAttribute("data-turn").catch(()=>null);
  if(turn!=="shoot"&&turn!=="keep")return "wait";
  const kind=turn==="shoot"?"shot":"dive",otherKind=kind==="shot"?"dive":"shot";
  if(await stage.locator(`.cmRow[data-kind="${otherKind}"]`).isVisible().catch(()=>false))throw new Error(`Chamber Men: the ${otherKind} row shows on a ${turn} turn`);
  const first=stage.locator(`.cmChoice[data-kind="${kind}"]`).first();
  if(!await first.isEnabled().catch(()=>false))return "wait";
  const kick=Number(((await stage.locator(".cmTurnCount").textContent().catch(()=>""))||"").replace(/\D+/g," ").trim().split(" ")[0])||1;
  const who=await page.evaluate(()=>{const v=window.CareerModeProductionSharedTransferChallenge?.getState?.();return {role:v?.managerRole||"playerOne",season:v?.seasonNumber||null};}).catch(()=>({role:"playerOne",season:null}));
  const side=chamberSide(kind,kick,who.role,who.season);
  await stage.locator(`.cmChoice[data-kind="${kind}"][data-side="${side}"]`).click({timeout:5000}).catch(()=>{});
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
  return await page.locator("#transferChallenge").isVisible().catch(()=>false)&&!(await page.locator("#cmStage, #sqStage, #rrStage, #rrStepPanel, #igStage, #igStepPanel").count());
}
// Plays every roulette and Prime Pack step on the given phones (and any tracked partner phone) until each given phone shows
// the Transfer Challenge. Returns the steps seen.
async function waitForTransfer(pages,timeout=45000,{primeGuesser=null,stopWhen=null}={}){
  const targets=(Array.isArray(pages)?pages:[pages]).filter(Boolean);track(targets);
  // A planned Prime Pack round can run its four stages out (~95 s); Chamber Men's 14 kicks (turn by turn) show for about 37 s.
  // Every Showdown plays Chamber Men, so the extra time is granted up front.
  const chamberNow=true,seen=[];
  let until=Date.now()+(prime.enabled()?Math.max(timeout,210000):timeout)+(chamberNow?150000:0),chamberTime=chamberNow;
  for(;;){
    const drive=[...new Set([...targets,...tracked,...browserPages(targets)])].filter(page=>!page.isClosed());
    const done=[];for(const page of targets)done.push(await onTransfer(page));
    if(done.every(Boolean))return seen;
    if(stopWhen&&await stopWhen())return seen;
    if(Date.now()>=until)break;
    for(const page of drive){
      if(targets.includes(page)&&done[targets.indexOf(page)])continue;
      const step=await playRoulette(page,{primeGuesser});
      if(step&&step!=="wait"){if(!chamberTime&&step.startsWith("chamber-")){chamberTime=true;until+=150000;}seen.push(step);if(process.env.CMS_ROULETTE_DEBUG==="1")console.log(`--- step ${new Date().toISOString().slice(11,23)} ${step}`);}
    }
    await targets[0].waitForTimeout(STEP_MS);
  }
  throw new Error(`Transfer Challenge did not open within ${timeout} ms (roulette steps: ${seen.join(",")||"none"})`);
}

// ---------- CE2PG_RELOAD_AT (opt-in, r92 T4; off unless set): reload a phone at chosen steps and walk it back into the game ----------
// CE2PG_RELOAD_AT="key:season:who[:delayMs],..."; key = a step name (chamber-kick, chamber-continue, spin, panel, prime-guess, prime-miss,
// prime-continue, squad-lock-pre, squad-lock-post, squad-next-pre, squad-next-post) or a waiting state (chamber-wait, squad-wait-pre,
// squad-wait-post, spin-wait, prime-wait). Each rule fires once.
const RELOAD_RULES=(process.env.CE2PG_RELOAD_AT||"").split(",").map(v=>v.trim()).filter(Boolean).map(v=>{const [key,season,who,delay]=v.split(":");return {key,season:Number(season),who,delay:Number(delay||0),done:false};});
const reloadRecovering=new WeakMap();// page -> {post:boolean, since:number, steps:[]}
const reloadStamp=()=>new Date().toISOString().slice(11,23);
async function reloadLook(page){
  return page.evaluate(()=>{
    const vis=s=>[...document.querySelectorAll(s)].some(n=>n.getClientRects().length>0);
    const v=window.CareerModeProductionSharedTransferChallenge?.getState?.();
    const sq=document.getElementById("sqStage");
    return {cm:vis("#cmStage"),sq:vis("#sqStage"),sqStage:sq?sq.getAttribute("data-stage"):null,sqState:sq?sq.getAttribute("data-state"):null,sqStatus:sq?(sq.querySelector(".sqStatus")?.textContent||"").trim().slice(0,120):null,sqLive:sq?(sq.querySelector(".sqmLive")?.textContent||"").trim().slice(0,120):null,
      rr:vis("#rrStage")||vis("#rrStepPanel"),ig:vis("#igStage")||vis("#igStepPanel"),transfer:vis("#transferChallenge"),entry:vis("#seasonEntry"),
      home:vis("#mainMenu")&&vis("#newShowdown"),tile:(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim(),overlay:vis("#productionSharedJourneyEntryOverlay"),dash:vis("#dashboard"),
      label:(document.getElementById("seasonPrimaryAction")?.textContent||"").trim(),role:v?.managerRole||null,season:v?.seasonNumber||null,ind:document.getElementById("seasonIndicator")?.textContent||"",
      screens:[...document.querySelectorAll(".screen:not(.hidden)")].map(n=>n.id).join(","),who:(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").trim().toLowerCase()};
  }).catch(()=>null);
}
async function reloadRecover(page){
  const rec=reloadRecovering.get(page);if(!rec)return null;
  const s=await reloadLook(page);if(!s)return "wait";
  const done=why=>{console.log(`RELOAD back ${s.who} after ${Date.now()-rec.since} ms on ${why} (${s.ind}; steps ${rec.steps.join(",")||"none"}; squad ${s.sqStage||"-"}/${s.sqState||"-"} "${s.sqStatus||""}" "${s.sqLive||""}")`);reloadRecovering.delete(page);return null;};
  if(s.cm)return done("Chamber Men");if(s.sq)return done("Squad");if(s.rr)return done("Russian Roulette");if(s.ig)return done("Prime Pack");if(s.entry)return done("Season Results");
  if(Date.now()-rec.since>120000){console.log(`RELOAD STUCK ${s.who} 120 s after the reload: ${JSON.stringify(s)}`);reloadRecovering.delete(page);return null;}
  const note=step=>{if(rec.steps[rec.steps.length-1]!==step)rec.steps.push(step);return "wait";};
  if(s.overlay){const go=page.locator("#productionSharedJourneyEntryOverlay").getByRole("button",{name:/^(START CAREER|CONTINUE CAREER)$/}).first();if(await go.isVisible().catch(()=>false)&&await go.isEnabled().catch(()=>false))await go.click({timeout:5000}).catch(()=>{});return note("get-ready");}
  if(s.transfer){
    if(!rec.post)return done("Transfer War");
    const b=page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true});
    if(await b.isVisible().catch(()=>false)&&await b.isEnabled().catch(()=>false)){await b.click({timeout:5000}).catch(()=>{});return note("continue-to-results");}
    return note("transfer-wait");
  }
  if(s.home){if(s.tile==="CONTINUE SHOWDOWN"){await page.locator("#newShowdown").click({timeout:5000}).catch(()=>{});return note("home-continue");}return note(`home-tile:${s.tile}`);}
  if(s.dash){if(await page.locator("#seasonPrimaryAction").isEnabled().catch(()=>false)){await page.locator("#seasonPrimaryAction").click({timeout:5000}).catch(()=>{});return note(`dash:${s.label}`);}return note("dash-wait");}
  return note(`screens:${s.screens}`);
}
async function reloadMaybe(page,step,before){
  if(!RELOAD_RULES.length||!step||!before||reloadRecovering.has(page))return;
  let key=String(step).split(":")[0];
  if(key==="wait")key=before.cm?"chamber-wait":before.sq?`squad-wait-${before.sqStage}`:before.ig?"prime-wait":before.rr?"spin-wait":"";
  else if(key.startsWith("squad-"))key=`${key}-${before.sqStage}`;
  if(!key)return;
  const who=before.role==="playerOne"?"daniel":before.role==="playerTwo"?"nik":before.who;
  const rule=RELOAD_RULES.find(r=>!r.done&&r.key===key&&r.season===before.season&&r.who===who);if(!rule)return;
  rule.done=true;
  if(rule.delay)await page.waitForTimeout(rule.delay);
  console.log(`RELOAD reload ${who} season ${before.season} at ${key}${rule.delay?` +${rule.delay} ms`:""} ${reloadStamp()} (squad before: ${before.sqStage||"-"}/${before.sqState||"-"} "${before.sqStatus||""}")`);
  await page.reload({waitUntil:"domcontentloaded"}).catch(error=>console.log(`RELOAD reload error ${String(error.message||error).slice(0,200)}`));
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:45000}).catch(()=>{});
  reloadRecovering.set(page,{post:key.endsWith("-post"),since:Date.now(),steps:[]});
}
async function playRoulette(page,opts={}){
  if(RELOAD_RULES.length){const r=await reloadRecover(page);if(r)return r;}
  const before=RELOAD_RULES.length?await reloadLook(page):null;
  const step=await playRoulette0(page,opts);
  await reloadMaybe(page,step,before);
  return step;
}
async function playSquad(page){
  if(RELOAD_RULES.length){const r=await reloadRecover(page);if(r)return r;}
  const before=RELOAD_RULES.length?await reloadLook(page):null;
  const step=await playSquad0(page);
  await reloadMaybe(page,step,before);
  return step;
}
if(RELOAD_RULES.length)process.on("exit",()=>{const left=RELOAD_RULES.filter(r=>!r.done);console.log(`RELOAD rules fired ${RELOAD_RULES.length-left.length}/${RELOAD_RULES.length}${left.length?`; never fired: ${left.map(r=>`${r.key}:${r.season}:${r.who}`).join(", ")}`:""}`);});

module.exports={playRoulette,playPrimePack,playChamberMen,playSquad,playSquadUntil,toSeasonEntry,chamberSide,primeNames,track,waitForTransfer};
