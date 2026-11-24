"use strict";
// r100 Phoenix B5: Final Winner with Turning Points, read-only provider doubles as in champion-review-season-visible-audit.cjs.
// Draws a finished 3-season Showdown, the 1-season fixture game, a 3-season draw and a Sacked ending at the Chromebook sizes and on phones, checks the three
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
const sizes = (process.env.CMS_TP_SIZES || "1920x866,1920x1035,1366x768,1280x650,1100x700,880x600,800x900,390x844,375x667,844x390,768x1024").split(",").map(s => s.split("x").map(Number));
// Where the lines must show: Nik's Chromebook (windowed and full screen) and every phone and tablet. Any other window may keep
// today's panel when the third column has no room (v10TurningNoRoom), but then it must be exactly today's: no column, no tab.
const MUST_SHOW = new Set((process.env.CMS_TP_MUST_SHOW || "1920x866,1920x1035,800x900,390x844,375x667,844x390,768x1024").split(","));
// Daniel comes from 4 down and wins 13-10; the Europa League is the whole margin in season 2.
const GAMES = {
  three: { totalSeasons: 3, seasons: [
    [result(), result({ leaguePosition: 1, championsLeague: true })],
    [result({ europaLeague: true, domesticCup: true }), result()],
    [result({ leaguePosition: 1, championsLeague: true, domesticCup: true }), result({ primePack: 2 })]
  ] },
  one: {},
  // level at 9 each after 3 seasons: told as a draw, never a winner
  draw: { totalSeasons: 3, seasons: [
    [result({ leaguePosition: 1, championsLeague: true }), result()],
    [result(), result({ leaguePosition: 1, championsLeague: true })],
    [result({ domesticCup: true }), result({ domesticCup: true })]
  ] },
  // Nik sacked in season 2 of 3 (sackedFixture below records the ending as the real modules do)
  sacked: { totalSeasons: 3, seasons: [
    [result({ leaguePosition: 1, championsLeague: true }), result({ domesticCup: true })],
    [result({ domesticCup: true }), result({ leaguePosition: 18, sacked: true })]
  ] }
};
const games = (process.env.CMS_TP_GAMES || "three,one,draw,sacked").split(",");
// A Sacked ending as js/sharedFinalReconciliation.js and js/sharedTerminalClose.js record it: the Showdown is complete after the
// sacked season (sackedSeason), the final witness says endedBy "sacked" and completedSeason = the seasons played.
function sackedFixture(fixture) {
  const Terminal = require("../../js/sharedTerminalClose.js");
  const p = fixture.finished.history.projection, played = p.acceptedSeasons;
  const fr = { ...fixtures.finalReconciliation(p), acceptedSeasons: played, completedSeason: played, endedBy: "sacked", sacked: { playerOne: false, playerTwo: true } };
  const multi = fixtures.multiFor(p);
  fixture.finished.multiSeason = { ...multi, phase: "SHOWDOWN_COMPLETE", state: { ...multi.state, phase: "SHOWDOWN_COMPLETE", activeSeason: null, completedSeason: played, terminal: true, sackedSeason: played } };
  fixture.finished.finalReconciliation = fr;
  fixture.finished.terminalClose = { ...fixture.finished.terminalClose, terminalWitness: JSON.parse(JSON.stringify(Terminal.prepare(fr, { sessionId: fixtures.SESSION }))) };
  return fixture;
}
const EXPECT = { draw: /^THE SHOWDOWN\s*Level at 9 points each after 3 seasons: a draw\./, sacked: /^SEASON 2\s*Nik was sacked, so the Showdown ended there, with Daniel 8 points ahead\./ };

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
      const fixture = game === "sacked" ? sackedFixture(fixtures.completedShowdownStorage(GAMES[game])) : fixtures.completedShowdownStorage(GAMES[game]);
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
              .concat([...document.querySelectorAll(".finalWinnerPhoneTabs label")].filter(vis).map(box).filter(Boolean))
              // every painted word of the summary and the honours table too: a cell can run past its own column's box
              .concat([...document.querySelectorAll("#finalWinnerMetaStrip *, #finalWinnerHonours *")].filter(el => !el.children.length && el.textContent.trim() && vis(el)).map(box).filter(Boolean));
            const main = document.querySelector("#app main");
            const panel = document.querySelector(".finalWinnerResultsPanel");
            const tabTurning = document.querySelector("label[for='finalWinnerTabTurning']");
            return { noRoom: Boolean(panel && panel.classList.contains("v10TurningNoRoom")), tabShown: Boolean(tabTurning && vis(tabTurning)), columns: panel ? getComputedStyle(panel).gridTemplateColumns.split(" ").length : 0,
              present: Boolean(block), visible: block ? vis(block) : false, box: box(block), inner: block ? block.scrollHeight - block.clientHeight : 0, lines: lines.map(l => ({ text: l.textContent.trim(), box: box(l), clipped: l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1 })),
              buttons, others, scroll: main ? { top: main.scrollTop, height: main.scrollHeight, client: main.clientHeight } : null, writes: window.__tpWrites, view: { w: innerWidth, h: innerHeight } };
          });
          await page.screenshot({ path: path.join(output, `${tag}.png`) });
          assert.equal(probe.present, true, "Turning Points block is on Final Winner");
          if (!probe.visible && !MUST_SHOW.has(`${width}x${height}`)) {
            // no room for a third column here: the panel must be exactly today's
            assert.equal(probe.noRoom, true, "a hidden column is the measured no-room case (v10TurningNoRoom)");
            assert.equal(probe.tabShown, false, "no TURNING POINTS tab");
            assert.ok(probe.columns <= 2, `today's two-part panel (${probe.columns} columns)`);
            for (const b of probe.buttons) for (const o of probe.others) assert.ok(!overlaps(o, b), "summary and honours clear of the exits");
            assert.equal(probe.writes, 0, "no write");
            console.log(`PASS ${tag}: no room for a third column; today's panel kept`);
            continue;
          }
          assert.equal(probe.visible, true, "Turning Points block is painted");
          assert.ok(probe.lines.length >= 1 && probe.lines.length <= 3, `1 to 3 lines (got ${probe.lines.length})`);
          assert.ok(probe.inner <= 1, `every line fits the panel with no scroll of its own (${probe.inner}px over)`);
          for (const line of probe.lines) {
            assert.ok(line.box && line.box.y >= probe.box.y - 1 && line.box.y + line.box.height <= probe.box.y + probe.box.height + 1, `line inside the panel: ${line.text}`);
            assert.ok(line.box, `line has a box: ${line.text}`);
            assert.equal(line.clipped, false, `line is not cut: ${line.text}`);
            assert.ok(line.box.x >= 0 && line.box.x + line.box.width <= probe.view.w + 1, `line inside the width: ${line.text}`);
            for (const b of probe.buttons) assert.ok(!overlaps(line.box, b), `line clear of the exits: ${line.text}`);
            for (const b of probe.others) assert.ok(!overlaps(line.box, b), `line clear of the summary, honours, totals and tabs: ${line.text}`);
          }
          for (let i = 0; i < probe.lines.length; i += 1) for (let j = i + 1; j < probe.lines.length; j += 1) assert.ok(!overlaps(probe.lines[i].box, probe.lines[j].box), "lines do not overlap");
          for (const b of probe.buttons) assert.ok(!overlaps(probe.box, b), "block clear of the exits");
          assert.equal(probe.writes, 0, "no write");
          if (EXPECT[game]) assert.match(probe.lines[0].text, EXPECT[game], "the first line tells how it ended");
          if (game === "draw") for (const line of probe.lines) assert.doesNotMatch(line.text, /\b(won|wins|beat|winner|tie-?break)\b/i, "a draw names no winner");
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
