"use strict";
// r87 Russian Roster Roulette in browser journeys: every season, before the Transfer Challenge opens, each manager plays
// both spins (Team V's page in the #rrStage frame: "Daniel spins", "Nik spins", "Continue") and taps the result panel's
// primary button (I'VE RELEASED HIM / GO TO THE TRANSFER WINDOW). A scene that cannot load (no three.js) is skipped by the
// app and only the panel shows. waitForTransfer() plays whatever roulette is on screen until the Transfer Challenge shows.
const STEP_MS=500;

async function playRoulette(page){
  const stage=page.locator("#rrStage");
  if(await stage.isVisible().catch(()=>false)){
    const cta=page.frameLocator("#rrStage iframe").locator("#cta");
    if(await cta.isEnabled({timeout:STEP_MS}).catch(()=>false)){await cta.click({timeout:5000}).catch(()=>{});return "spin";}
    return "wait";
  }
  const primary=page.locator("#rrStepPanel .rrStepPrimary");
  if(await primary.isVisible().catch(()=>false)){await primary.click({timeout:5000}).catch(()=>{});return "panel";}
  return null;
}

async function waitForTransfer(page,timeout=45000){
  const until=Date.now()+timeout,seen=[];
  while(Date.now()<until){
    if(await page.locator("#transferChallenge").isVisible().catch(()=>false)&&!(await page.locator("#rrStage, #rrStepPanel").count()))return seen;
    const step=await playRoulette(page);
    if(step&&step!=="wait")seen.push(step);
    await page.waitForTimeout(STEP_MS);
  }
  throw new Error(`Transfer Challenge did not open within ${timeout} ms (roulette steps: ${seen.join(",")||"none"})`);
}

module.exports={playRoulette,waitForTransfer};
