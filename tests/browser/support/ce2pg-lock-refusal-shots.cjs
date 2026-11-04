"use strict";
// r88 LOCK refusals in the real game, loaded with NODE_OPTIONS next to the roulette observer (no edit to the harness):
//   CE2PG_LOCK_SHOTS_DIR=<dir> NODE_OPTIONS="--require ./tests/browser/support/ce2pg-roulette-observer.cjs --require ./tests/browser/support/ce2pg-lock-refusal-shots.cjs" \
//     CE2PG_PLAN=single CE2PG_SEASONS=3 node tests/browser/ce2pg-journey.cjs
// Inert unless CE2PG_LOCK_SHOTS_DIR is set, in every process except the CE2PG run inside the emulators.
// CE2PG_LOCK_SHOTS_GUESS=1: in season 1 Nik guesses Daniel's league (Premier League) instead of a nationality, so Daniel's
// season-1 signing is released and season 2 has a guessed player to refuse.
// Before each real LOCK MY SIGNINGS tap, the page's own refusal list (CareerModeProductionSharedTransferChallenge
// .blockedSignings(), the list LOCK uses) is asked; for the first shot and the first guessed name it types that name as
// signing 1, taps LOCK, waits for the refusal words, checks nothing locked, takes 1440x900 and 393x852 screenshots, then puts
// the harness's own signing back and lets the real tap go on. Lines start with "LOCK-SHOTS".
const fs=require("node:fs");
const path=require("node:path");
const DIR=process.env.CE2PG_LOCK_SHOTS_DIR;
const isCe2pg=Boolean(DIR)&&Boolean(process.env.FIRESTORE_EMULATOR_HOST)&&/ce2pg-journey\.cjs$/.test(process.argv[1]||"");
if(isCe2pg)install();

function install(){
  fs.mkdirSync(DIR,{recursive:true});
  const done=new Set(),results=[];
  const log=line=>{console.log(`LOCK-SHOTS ${line}`);results.push(line);};
  const prefixOf=async page=>page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.managerRole==="playerTwo"?"p2":"p1");
  async function demo(page,lockLocator){
    try{
      const state=await page.evaluate(()=>{const v=window.CareerModeProductionSharedTransferChallenge?.getState?.();return {role:v?.managerRole,season:v?.seasonNumber,phase:v?.state?.phase};});
      if(state.phase!=="SIGNING_ENTRY")return;
      const list=await page.evaluate(async()=>{try{return await window.CareerModeProductionSharedTransferChallenge.blockedSignings();}catch(error){return {error:String(error&&error.message||error)};}});
      if(!Array.isArray(list)){log(`season ${state.season} ${state.role}: blocked list failed: ${list.error}`);return;}
      log(`season ${state.season} ${state.role}: blocked ${JSON.stringify(list)}`);
      const prefix=await prefixOf(page),nameField=page.locator(`#${prefix}Signing1Name`),original=await nameField.inputValue();
      for(const entry of list){
        if(done.has(entry.reason))continue;
        done.add(entry.reason);
        await nameField.fill(entry.name);
        await page.evaluate(()=>{const n=document.getElementById("transferChallengeError");if(n)n.textContent="";});
        await lockLocator.click({timeout:30000});
        const words=entry.reason==="shot"?"He can't come back.":"You can't sign him again.";
        await page.waitForFunction(w=>String(document.getElementById("transferChallengeError")?.textContent||"").includes(w),words,{timeout:30000});
        const shown=await page.evaluate(()=>document.getElementById("transferChallengeError").textContent);
        const locked=await page.evaluate(()=>Boolean(window.CareerModeProductionSharedTransferChallenge.getState()?.state?.signingLockedRoles?.includes(window.CareerModeProductionSharedTransferChallenge.getState()?.managerRole)));
        log(`season ${state.season} ${state.role}: typed "${entry.name}" -> "${shown}" locked=${locked}`);
        if(locked)log(`PROBLEM season ${state.season} ${state.role}: the refused signing locked`);
        const before=page.viewportSize();
        for(const size of [{width:1440,height:900},{width:393,height:852}]){
          await page.setViewportSize(size);
          await page.locator("#transferChallengeError").scrollIntoViewIfNeeded().catch(()=>{});
          await page.waitForTimeout(300);
          const file=path.join(DIR,`lock-refusal-${entry.reason}-${size.width}x${size.height}.png`);
          await page.screenshot({path:file});
          log(`screenshot ${file}`);
        }
        if(before)await page.setViewportSize(before);
        await nameField.fill(original);
        await page.evaluate(()=>{const n=document.getElementById("transferChallengeError");if(n)n.textContent="";});
      }
    }catch(error){log(`PROBLEM demo failed: ${error&&error.message||error}`);}
  }
  async function forceGuess(page){
    try{
      const v=await page.evaluate(()=>{const s=window.CareerModeProductionSharedTransferChallenge?.getState?.();return {role:s?.managerRole,season:s?.seasonNumber};});
      if(process.env.CE2PG_LOCK_SHOTS_GUESS!=="1"||v.role!=="playerTwo"||v.season!==1)return;
      await page.locator("#p1Guess1Type").selectOption("league");
      await page.locator("#p1Guess1Value").fill("Premier League");
      await page.waitForFunction(()=>Boolean(document.getElementById("p1Guess1Value")?.dataset.canonicalId),null,{timeout:5000});
      log("season 1: Nik guesses Daniel's league Premier League");
    }catch(error){log(`PROBLEM guess change failed: ${error&&error.message||error}`);}
  }
  const wrapPage=page=>{
    if(page.__lockShots)return page;page.__lockShots=true;
    const getByRole=page.getByRole.bind(page);
    page.getByRole=(role,options)=>{
      const locator=getByRole(role,options),name=options&&options.name;
      if(role!=="button"||(name!=="LOCK MY SIGNINGS"&&name!=="LOCK MY GUESSES"))return locator;
      return new Proxy(locator,{get(target,prop){
        if(prop==="click")return async(...args)=>{if(name==="LOCK MY SIGNINGS")await demo(page,getByRole(role,options));else await forceGuess(page);return target.click(...args);};
        const value=target[prop];return typeof value==="function"?value.bind(target):value;
      }});
    };
    return page;
  };
  const pw=require("playwright");
  const launch=pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch=async(...args)=>{
    const browser=await launch(...args);
    const newContext=browser.newContext.bind(browser);
    browser.newContext=async(...cargs)=>{const ctx=await newContext(...cargs);const newPage=ctx.newPage.bind(ctx);ctx.newPage=async(...p)=>wrapPage(await newPage(...p));return ctx;};
    return browser;
  };
  process.on("exit",()=>{try{fs.writeFileSync(path.join(DIR,"lock-shots.log"),results.join("\n")+"\n");}catch(_e){}});
}
