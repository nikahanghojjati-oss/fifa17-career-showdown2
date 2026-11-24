"use strict";
// r100 Phoenix B5: Final Winner with Turning Points, read-only provider doubles as in champion-review-season-visible-audit.cjs.
// Draws a finished 3-season Showdown (and the 1-season fixture game) at the Chromebook sizes and on phones, checks the three
// lines are on screen, inside the viewport (or reachable by main's scroll on phones), clear of the faces, the exits and each
// other, and writes the screenshots to test-results/r100-turning-points/.
//   CMS_BASE_URL (default http://127.0.0.1:4511/)   CMS_TP_SIZES=1920x866,390x844   CMS_TP_SCALE=2 (screenshots for people)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const { result } = require("../support/career-fixture-helpers.cjs");

const baseUrl = process.env.CMS_BASE_URL || "http://127.0.0.1:4511/";
const output = path.resolve(process.env.CMS_TEST_RESULTS || "test-results", "r100-turning-points");
const scale = Number(process.env.CMS_TP_SCALE || 1);
const sizes = (process.env.CMS_TP_SIZES || "1920x866,1920x1035,1366x768,1280x650,390x844,375x667,844x390,768x1024").split(",").map(s => s.split("x").map(Number));
// Daniel comes from 4 down and wins 13-10; the Europa League is the whole margin in season 2.
const GAMES = {
  three: { totalSeasons: 3, seasons: [
    [result(), result({ leaguePosition: 1, championsLeague: true })],
    [result({ europaLeague: true, domesticCup: true }), result()],
    [result({ leaguePosition: 1, championsLeague: true, domesticCup: true }), result({ primePack: 2 })]
  ] },
  one: {}
};
const games = (process.env.CMS_TP_GAMES || "three,one").split(",");

async function open(page, fixture) {
  await page.route(/https:\/\/(?:[^/]*\.)?googleapis\.com\//, route => route.abort());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 20000 });
  await page.evaluate(() => window.CareerModeSharedJourneyReady?.());
  await page.waitForFunction(() => Boolean(window.CareerModeProductionSharedTransferChallenge), null, { timeout: 30000 });
  await page.evaluate(async fixture => {
    await ensureGameplayModules();
    for (const [key, value] of Object.entries(fixture.storage)) localStorage.setItem(key, value);
    currentShowdown = normalizeShowdown(fixture.active);
    currentShowdown.sharedJourney = { mode: "shared", rivalryId: fixture.ready.seasonResults.rivalryId };
    const snapshot = fixture.ready;
    const setup = { ready: true, rivalryId: snapshot.seasonResults.rivalryId, sessionId: "session_" + "8".repeat(64), deviceId: "device_" + "1".repeat(32), managerRole: "playerOne",
      setup: { phase: "SHOWDOWN_CONFIRMED", revision: 6, coordinatorRole: "playerOne", leagueId: "premier_league", totalSeasons: 1, clubs: { playerOne: "Arsenal", playerTwo: "Liverpool" } } };
    const transfer = { seasonNumber: 1, state: { phase: "COMPLETED" }, setup: setup.setup };
    window.CareerModeProductionSharedShowdownSetup = { getState: () => setup, refresh: async () => setup };
    window.CareerModeProductionSharedTransferChallenge = { getState: () => transfer, refresh: async () => transfer };
    window.__tpWrites = 0;
    window.CareerModeSparkSharedSeasonResults = { read: async () => snapshot.seasonResults, publishResult: async () => { window.__tpWrites++; throw new Error("read-only"); } };
    window.CareerModeProductionFirebaseRuntime = { ensureAccountServices: async () => ({ ok: true, auth: { currentUser: { uid: "acct-daniel" } }, firestore: {}, firestoreSdk: {} }) };
    window.CareerModeProductionSharedMultiSeasonProgression = { getState: () => snapshot.multiSeason, resolveSeason: () => 1 };
    for (const [key, name] of Object.entries({ identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose" })) window[name] = { getState: () => snapshot[key] };
    await loadRuntimeScript("tp-results", "js/productionSharedSeasonResults.js", () => window.CareerModeProductionSharedSeasonResults);
    await loadRuntimeScript("tp-route", "js/productionSharedSeasonResultsRoute.js", () => window.CareerModeProductionSharedSeasonResultsRoute);
    CareerModeProductionSharedSeasonResults.install();
    CareerModeProductionSharedSeasonResultsRoute.install();
    await CareerModeProductionSharedSeasonResults.open();
    window.__tpSnapshot = snapshot; window.__tpFinished = fixture.finished;
  }, fixture);
  await page.locator(".v10SeasonStage:not([hidden]) #seasonReviewPanel").waitFor({ state: "visible", timeout: 20000 });
  await page.evaluate(() => {
    Object.assign(window.__tpSnapshot, window.__tpFinished);
    window.CareerModeV10Screens.invalidate("seasonEntry");
    document.dispatchEvent(new CustomEvent("career-mode-screen-shown", { detail: { screen: "seasonEntry" } }));
  });
  await page.locator("#finalWinnerScreen").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => { const host = document.getElementById("seasonEntry"); return !host.hasAttribute("data-v10-pending") && !host.hasAttribute("data-v10-reveal") && document.querySelector("#v10ExitSlot #completeSeason"); }, null, { timeout: 20000 });
  await page.waitForTimeout(400);
}

function overlaps(a, b) { return a && b && a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1; }

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const runtime = await resolveChromiumRuntime();
  const failures = [];
  {
    for (const game of games) {
      const fixture = fixtures.completedShowdownStorage(GAMES[game]);
      for (const [width, height] of sizes) {
        const phone = width < 900 || height < 500;
        // one browser per size: the CI runtime is single-process and a second context in it can stall
        const browser = await chromium.launch({ headless: true, ...runtime });
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce", isMobile: phone, hasTouch: phone });
        const page = await context.newPage();
        const tag = `${game}-${width}x${height}`;
        try {
          await open(page, fixture);
          // Phones: the third tab holds the lines; show it the way a tap does.
          const tab = page.locator("label[for='finalWinnerTabTurning']");
          if (await tab.isVisible().catch(() => false)) {
            await page.screenshot({ path: path.join(output, `${tag}-summary.png`) });
            await tab.click();
            await page.waitForTimeout(200);
          }
          const probe = await page.evaluate(() => {
            const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.x, y: r.y, width: r.width, height: r.height } : null; };
            const block = document.getElementById("finalWinnerTurningPoints");
            const lines = [...document.querySelectorAll("#finalWinnerTurningPoints .finalWinnerTurningLine")];
            const faces = [...document.querySelectorAll(".finalWinnerPhoneHero img, .sd-stage__cutout img, .finalWinnerHero img")].map(box).filter(Boolean);
            const buttons = [...document.querySelectorAll("#v10ExitSlot button")].map(box).filter(Boolean);
            const vis = el => { for (let n = el; n; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false; } return true; };
            const others = ["finalWinnerMetaStrip", "finalWinnerHonours", "outcomeHeadline", "danielTotal", "nikTotal"].map(id => document.getElementById(id)).filter(el => el && vis(el)).map(box).filter(Boolean)
              .concat([...document.querySelectorAll(".finalWinnerPhoneTabs label")].filter(vis).map(box).filter(Boolean));
            const main = document.querySelector("#app main");
            return { present: Boolean(block), visible: block ? vis(block) : false, box: box(block), lines: lines.map(l => ({ text: l.textContent.trim(), box: box(l), clipped: l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1 })),
              buttons, others, scroll: main ? { top: main.scrollTop, height: main.scrollHeight, client: main.clientHeight } : null, writes: window.__tpWrites, view: { w: innerWidth, h: innerHeight } };
          });
          await page.screenshot({ path: path.join(output, `${tag}.png`) });
          assert.equal(probe.present, true, "Turning Points block is on Final Winner");
          assert.equal(probe.visible, true, "Turning Points block is painted");
          assert.ok(probe.lines.length >= 1 && probe.lines.length <= 3, `1 to 3 lines (got ${probe.lines.length})`);
          for (const line of probe.lines) {
            assert.ok(line.box, `line has a box: ${line.text}`);
            assert.equal(line.clipped, false, `line is not cut: ${line.text}`);
            assert.ok(line.box.x >= 0 && line.box.x + line.box.width <= probe.view.w + 1, `line inside the width: ${line.text}`);
            for (const b of probe.buttons) assert.ok(!overlaps(line.box, b), `line clear of the exits: ${line.text}`);
            for (const b of probe.others) assert.ok(!overlaps(line.box, b), `line clear of the summary, honours, totals and tabs: ${line.text}`);
          }
          for (let i = 0; i < probe.lines.length; i += 1) for (let j = i + 1; j < probe.lines.length; j += 1) assert.ok(!overlaps(probe.lines[i].box, probe.lines[j].box), "lines do not overlap");
          for (const b of probe.buttons) assert.ok(!overlaps(probe.box, b), "block clear of the exits");
          assert.equal(probe.writes, 0, "no write");
          console.log(`PASS ${tag}: ${probe.lines.map(l => l.text).join(" | ")}`);
        } catch (error) {
          console.error(`FAIL ${tag}: ${error.message}`);
          failures.push(`${tag}: ${error.message}`);
          await page.screenshot({ path: path.join(output, `${tag}-fail.png`) }).catch(() => {});
        } finally { await context.close().catch(() => {}); await browser.close().catch(() => {}); }
      }
    }
  }
  assert.deepEqual(failures, [], failures.join("\n"));
  console.log(`PASS r100 Turning Points gallery: ${games.length} games x ${sizes.length} sizes`);
})().catch(error => { console.error(error); process.exitCode = 1; });
