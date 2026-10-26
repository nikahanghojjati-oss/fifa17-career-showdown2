"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");

const baseUrl = process.env.CMS_BASE_URL || "http://127.0.0.1:4511/";
const output = path.resolve(process.env.CMS_TEST_RESULTS || "test-results", "champion-review-season");
const label = process.env.CMS_AUDIT_RUN || "after";
const fixture = fixtures.completedShowdownStorage();
const viewports = [[1920,1080],[1280,650],[393,660],[844,390]];

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

(async () => {
    fs.mkdirSync(output,{recursive:true});
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({headless:true,...runtime});
    const failures = [];
    try {
        for (const [width,height] of viewports) {
            const context = await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
            const page = await context.newPage();
            try {
                await prepare(page);
                await page.screenshot({path:path.join(output,`${label}-${width}x${height}.png`)});
                const probe = await page.locator("#completeSeason").evaluate(button => {
                    const box=button.getBoundingClientRect(),style=getComputedStyle(button);
                    const hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
                    let painted=true;
                    for(let node=button;node;node=node.parentElement){const s=getComputedStyle(node);if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0)painted=false;}
                    return {display:style.display,visibility:style.visibility,width:box.width,height:box.height,painted,centreHit:hit===button||button.contains(hit),label:button.textContent.trim()};
                });
                console.log(`${width}x${height}: ${JSON.stringify(probe)}`);
                assert.notEqual(probe.display,"none","Champion REVIEW SEASON must not be display:none");
                assert.notEqual(probe.visibility,"hidden");
                assert.equal(probe.painted,true,"Champion REVIEW SEASON and its ancestors must be painted");
                assert.ok(probe.width>0&&probe.height>0,"Champion REVIEW SEASON must have a non-zero box");
                assert.equal(probe.centreHit,true,"Champion REVIEW SEASON must receive a pointer at its centre");
                assert.equal(probe.label,"REVIEW SEASON");
                await page.locator("#completeSeason").click();
                await page.locator(".v10SeasonStage:not([hidden]) #seasonReviewPanel").waitFor({state:"visible",timeout:5000});
                assert.equal(await page.locator("#finalWinnerScreen").count(),0,"Review must leave the Champion presentation");
                assert.match(await page.locator("#seasonEntryTitle").textContent(),/SEASON 1 RESULTS/);
                for (const [id,result] of [["seasonReviewOne",fixture.ready.seasonResults.ownResult],["seasonReviewTwo",fixture.ready.seasonResults.opponentResult]]) {
                    const text=await page.locator(`#${id}`).innerText();
                    assert.ok(text.includes(String(result.leaguePoints))&&text.includes(String(result.leagueGoals)),"Review must show the final season's published facts");
                }
                assert.equal(await page.evaluate(()=>window.__championWrites),0);
                assert.equal(await page.locator("#confirmSeasonCompletion").isVisible(),false);
                assert.equal(await page.locator("#editSeasonResults").isVisible(),false,"Published final-season review must not offer editing");
                assert.equal(await page.locator("#completeSeason").isVisible(),false,"Entry action must be hidden again outside the Champion exit slot");
                assert.equal(await page.locator("#p1LeaguePoints").isDisabled(),true);
                assert.equal(await page.locator("#p2LeaguePoints").isDisabled(),true);
                assert.equal(await page.evaluate(()=>Object.entries(window.__championStorage).every(([key,value])=>localStorage.getItem(key)===value)),true,"Review must preserve canonical storage");
                await page.evaluate(async()=>{await navigateTo("mainMenu");await CareerModeProductionSharedSeasonResults.open();});
                await page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:10000});
                assert.equal(await page.locator("#v10ExitSlot #completeSeason").isVisible(),true,"Reopening the finished Showdown must return to Champion with both exits");
                console.log(`PASS ${width}x${height}: visible Champion exit opens read-only final-season review`);
            } catch (error) {
                console.error(`FAIL ${width}x${height}: ${error.message}`);
                failures.push(`${width}x${height}: ${error.message}`);
            } finally { await context.close(); }
        }
    } finally { await browser.close(); }
    assert.deepEqual(failures,[],failures.join("\n"));
    console.log("PASS Champion REVIEW SEASON visibility and read-only review at all four window sizes; shared Results review remains unchanged");
})().catch(error=>{console.error(error);process.exitCode=1;});
