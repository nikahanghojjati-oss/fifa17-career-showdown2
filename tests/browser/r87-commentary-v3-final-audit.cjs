"use strict";
// r87 Commentary v3 on Final Winner: the FULL TIME bar sits below Team V's stage in the page flow. The stage keeps its exact
// place and size, nothing on it is covered, the bar is fully painted and never tappable. Fixture: the Champion review audit's.
process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");const {chromium}=require("playwright");const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const fixtures=require("../support/active-showdown-fixtures.cjs");const fixture=fixtures.completedShowdownStorage();const baseUrl=process.env.CMS_BASE_URL||"http://127.0.0.1:4173/";
async function prepare(page) {
    // Read-only provider doubles, as in the shared-results and final-reconciliation audits.
    // All navigation, rendering, controls and click interception use the real application.
    await page.route(/https:\/\/(?:[^/]*\.)?googleapis\.com\//, route => route.abort());
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 15000 });
    await page.evaluate(async fixture => {
        await ensureGameplayModules();
        for (const [key, value] of Object.entries(fixture.storage)) localStorage.setItem(key, value);
        currentShowdown = normalizeShowdown(fixture.active);
        currentShowdown.sharedJourney = { mode: "shared", rivalryId: fixture.ready.seasonResults.rivalryId };
        const snapshot = fixture.ready;
        const setup = { ready:true, rivalryId:snapshot.seasonResults.rivalryId, sessionId:"session_"+"8".repeat(64), deviceId:"device_"+"1".repeat(32), managerRole:"playerOne",
            setup:{ phase:"SHOWDOWN_CONFIRMED", revision:6, coordinatorRole:"playerOne", leagueId:"premier_league", totalSeasons:1, clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"} } };
        const transfer = { seasonNumber:1, state:{phase:"COMPLETED"}, setup:setup.setup };
        window.CareerModeProductionSharedShowdownSetup = { getState:()=>setup, refresh:async()=>setup };
        window.CareerModeProductionSharedTransferChallenge = { getState:()=>transfer, refresh:async()=>transfer };
        window.__championWrites = 0;
        window.CareerModeSparkSharedSeasonResults = { read:async()=>snapshot.seasonResults, publishResult:async()=>{ window.__championWrites++; throw new Error("Read-only review must not publish"); } };
        window.CareerModeProductionFirebaseRuntime = { ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct-daniel"}},firestore:{},firestoreSdk:{}}) };
        window.CareerModeProductionSharedMultiSeasonProgression = { getState:()=>snapshot.multiSeason, resolveSeason:()=>1 };
        for (const [key,name] of Object.entries({identity:"CareerModeOnlinePlayerIdentity",pair:"CareerModePersistentNikDanielPair",history:"CareerModeProductionSharedHistoryConvergence",finalReconciliation:"CareerModeProductionSharedFinalReconciliation",terminalClose:"CareerModeProductionSharedTerminalClose"})) {
            window[name] = { getState:()=>snapshot[key] };
        }
        await loadRuntimeScript("champion-audit-results","js/productionSharedSeasonResults.js",()=>window.CareerModeProductionSharedSeasonResults);
        await loadRuntimeScript("champion-audit-route","js/productionSharedSeasonResultsRoute.js",()=>window.CareerModeProductionSharedSeasonResultsRoute);
        CareerModeProductionSharedSeasonResults.install();
        CareerModeProductionSharedSeasonResultsRoute.install();
        await CareerModeProductionSharedSeasonResults.open();
        window.__championSnapshot = snapshot;
        window.__championFinished = fixture.finished;
    }, fixture);
    await page.locator(".v10SeasonStage:not([hidden]) #seasonReviewPanel").waitFor({state:"visible"});
    assert.equal(await page.locator("#completeSeason").isVisible(), false, "Shared Results review must still hide the entry action");
    assert.equal(await page.locator("#confirmSeasonCompletion").isVisible(), false, "Published results must not offer publication again");
    await page.evaluate(() => {
        Object.assign(window.__championSnapshot, window.__championFinished);
        window.__championStorage = Object.fromEntries(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"].map(key=>[key,localStorage.getItem(key)]));
        window.CareerModeV10Screens.invalidate("seasonEntry");
        document.dispatchEvent(new CustomEvent("career-mode-screen-shown",{detail:{screen:"seasonEntry"}}));
    });
    await page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:15000});
    await page.waitForFunction(()=>{
        const host=document.getElementById("seasonEntry");
        return !host.hasAttribute("data-v10-pending")&&!host.hasAttribute("data-v10-reveal")&&
            document.querySelector("#v10ExitSlot #completeSeason");
    },null,{timeout:15000});
}
(async()=>{
  const browser=await chromium.launch({headless:true,...await resolveChromiumRuntime()}),failures=[],dir=process.env.CMS_GALLERY_SHOTS;if(dir)fs.mkdirSync(dir,{recursive:true});
  try{for(const [w,h] of [[1920,1080],[1366,768],[1280,650],[844,390],[393,660],[360,640]]){
    const context=await browser.newContext({viewport:{width:w,height:h},reducedMotion:"reduce",isMobile:w<900,hasTouch:w<900}),page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
    await prepare(page);
    await page.waitForSelector("#commentaryV3Final",{state:"attached",timeout:15000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
    const r=await page.evaluate(()=>{
      const bar=document.getElementById("commentaryV3Final"),b=bar.getBoundingClientRect(),stage=document.querySelector(".v10FinalStage").getBoundingClientRect(),issues=[];
      if(!bar.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||b.height<40)issues.push("bar not painted");
      if(b.top<stage.bottom-1)issues.push(`bar starts inside the stage (${Math.round(b.top)} < ${Math.round(stage.bottom)})`);
      if(b.left<0||b.right>innerWidth)issues.push("bar off screen sideways");
      if(getComputedStyle(bar).pointerEvents!=="none")issues.push("bar catches taps");
      for(const el of document.querySelectorAll("#seasonEntry button,#seasonEntry img,#seasonEntry label")){if(!el.checkVisibility?.())continue;const e=el.getBoundingClientRect();if(e.width<2||e.height<2)continue;if(Math.max(0,Math.min(e.right,b.right)-Math.max(e.left,b.left))*Math.max(0,Math.min(e.bottom,b.bottom)-Math.max(e.top,b.top))>4)issues.push(`overlaps ${el.tagName}.${el.className}`);}
      const m=document.querySelector("#app main");if(m.scrollHeight<=m.clientHeight)issues.push("main does not scroll to the bar");
      return {issues,stage:[Math.round(stage.top),Math.round(stage.height)],text:bar.textContent.replace(/\s+/g," ").trim()};
    });
    // The stage is exactly where it was without the bar.
    const without=await page.evaluate(()=>{const bar=document.getElementById("commentaryV3Final"),next=bar.nextSibling,parent=bar.parentNode;bar.remove();const s=document.querySelector(".v10FinalStage").getBoundingClientRect();parent.insertBefore(bar,next);return [Math.round(s.top),Math.round(s.height)];});
    if(without.join()!==r.stage.join())r.issues.push(`stage moved ${without} -> ${r.stage}`);
    if(!/^FULL TIME/.test(r.text)||!/Daniel 9, Nik 0/.test(r.text))r.issues.push(`unexpected words: ${r.text}`);
    if(errors.length)r.issues.push(`page errors ${errors.join(" | ")}`);
    if(r.issues.length)failures.push(`${w}x${h}: ${r.issues.join("; ")}`);
    if(dir){await page.evaluate(()=>{const m=document.querySelector("#app main");m.scrollTop=m.scrollHeight;});await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,`final-winner-${w}x${h}.png`)});}
    console.log(`${w}x${h}: ${r.text}`);await context.close();
  }}finally{await browser.close();}
  if(failures.length){console.error(failures.join("\n"));process.exit(1);}
  console.log("r87 Commentary v3 Final Winner audit passed");
})().catch(e=>{console.error(e);process.exit(1);});
