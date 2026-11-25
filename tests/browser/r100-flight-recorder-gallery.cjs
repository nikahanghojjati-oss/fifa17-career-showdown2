"use strict";
// r100 Phoenix B5: the real app, no Firebase. Two checks per window size, screenshots to test-results/r100-flight-recorder/:
//   background  Nik 2026-11-24: Phoenix stays in the background. A whole 3-season Showdown is fed through observe() step by
//             step with a sentinel in every private field (tests/support/flight-recorder-fixture.cjs): the recorder keeps every
//             step silently, and after EVERY step the page's whole DOM (text and attributes) and localStorage hold no
//             sentinel. Settings, opened with a full journal and a whole POS1M seal on the server, shows no FLIGHT RECORDER and
//             no Proof Wall, and the game never asks for data/pos1m-seal.json.
//   phoenix   Phoenix Rebirth: a cold first open with a live Showdown shows no phoenix; the same browser reloaded rises it once
//             over the status line (screenshot mid-rise), never covering a button, gone after about a second; a page that has
//             risen does not rise again.
//   CMS_BASE_URL (default http://127.0.0.1:4511/)   CMS_FR_SIZES=1920x866,390x844   CMS_FR_SCALE=2 (screenshots for people)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const { RID, SECRET, plainStamp, showdown } = require("../support/flight-recorder-fixture.cjs");

const baseUrl = process.env.CMS_BASE_URL || "http://127.0.0.1:4511/";
const output = path.resolve(process.env.CMS_TEST_RESULTS || "test-results", "r100-flight-recorder");
const scale = Number(process.env.CMS_FR_SCALE || 1);
const sizes = (process.env.CMS_FR_SIZES || "1920x866,1920x1035,1366x768,1280x650,390x844,375x667,844x390,768x1024").split(",").map(s => s.split("x").map(Number));
const APP_VERSION = /const APP_VERSION = "([^"]+)"/.exec(fs.readFileSync(path.resolve(__dirname, "../../js/app.js"), "utf8"))[1];
const SEAL = { schemaVersion: 1, engine: "POS1M", sealed: true, build: APP_VERSION, commit: "c0ffee".padEnd(40, "0"), sealedAt: "2026-11-28T03:00:00Z",
  stories: { survived: 1000000, run: 1000000 }, laws: { held: 15, total: 15 }, plantedBugs: { caught: 40, total: 40 }, ledgerReplays: { refound: 12, total: 12 } };
const STEPS = showdown(3, { stamp: plainStamp }).steps;

function overlaps(a, b) { return a && b && a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1; }

async function boot(page, { seal = SEAL, asked = null } = {}) {
  await page.route(/https:\/\/(?:[^/]*\.)?googleapis\.com\//, route => route.abort());
  // a whole seal for this build sits on the server: the game must never ask for it
  await page.route(/\/data\/pos1m-seal\.json(\?.*)?$/, route => { if (asked) asked.count += 1; return seal ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(seal) }) : route.fulfill({ status: 404, body: "" }); });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 20000 });
  await page.evaluate(() => loadRuntimeScript("flight-recorder", "js/flightRecorder.js", () => Boolean(window.CareerModeFlightRecorder)));
}
async function feed(page, steps) {
  await page.evaluate(steps => { for (const step of steps) window.CareerModeFlightRecorder.observe(step.path, { exists: () => true, data: () => step.data, metadata: { fromCache: false, hasPendingWrites: false } }); }, steps);
}
async function openSettings(page) {
  await page.evaluate(() => document.getElementById("settingsButton").click());
  await page.locator("#settingsOverlay:not(.hidden) #settingsContent").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);
}
async function assertPrivate(page, label) {
  const leak = await page.evaluate(source => {
    const secret = new RegExp(source);
    const html = document.documentElement.outerHTML;
    const stored = Object.keys(localStorage).map(key => localStorage.getItem(key)).join("\n");
    const m = secret.exec(html) || secret.exec(stored);
    return m ? (html.slice(Math.max(0, m.index - 80), m.index + 40)) : null;
  }, SECRET.source);
  assert.equal(leak, null, `${label}: a private value reached the page or this browser's storage: ${leak}`);
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const runtime = await resolveChromiumRuntime();
  const failures = [];
  for (const [width, height] of sizes) {
    const phone = width < 900 || height < 500;
    const tag = `${width}x${height}`;
    // one browser per context: the CI runtime is single-process and a second context in one browser can stall
    const launch = () => chromium.launch({ headless: true, ...runtime });
    let browser = null;
    try {
      // ---- background: records silently, nothing of it is shown ----
      {
        browser = await launch();
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce", isMobile: phone, hasTouch: phone });
        const page = await context.newPage();
        const asked = { count: 0 };
        try {
          await boot(page, { asked });
          for (let i = 0; i < STEPS.length; i += 1) {
            await feed(page, [STEPS[i]]);
            await assertPrivate(page, `step ${i + 1}`);
          }
          assert.equal(await page.evaluate(() => window.CareerModeFlightRecorder.steps().steps.length), 6 + 2 + 3 * 10 + 1, "every step of the 3-season Showdown is recorded");
          await openSettings(page);
          await page.waitForTimeout(800);
          const shown = await page.evaluate(() => {
            const visibleText = document.body.innerText;
            return {
              words: (visibleText.match(/FLIGHT RECORDER|PROOF WALL|STORIES SURVIVED|PLANTED BUGS|Sealed by POS1M/gi) || []),
              nodes: [...document.querySelectorAll("[class*='flightRecorder' i], [class*='proofWall' i], [data-flight-recorder-steps], [data-settings-view='flight']")].map(el => el.className || el.tagName),
              rows: [...document.querySelectorAll("time")].filter(el => /flight/i.test(el.className)).length
            };
          });
          await page.screenshot({ path: path.join(output, `${tag}-settings.png`) });
          assert.deepEqual(shown.words, [], "Settings shows no Flight Recorder or Proof Wall words");
          assert.deepEqual(shown.nodes, [], "no Flight Recorder or Proof Wall element exists anywhere");
          // and every SHOWDOWN DATA button there is today's: no new way in
          const buttons = await page.evaluate(() => [...document.querySelectorAll("#settingsContent button")].map(b => b.textContent.trim().toUpperCase()));
          assert.ok(!buttons.some(t => /FLIGHT|RECORDER|PROOF/.test(t)), `no button opens it: ${buttons.join(" | ")}`);
          await assertPrivate(page, "Settings open");
          assert.equal(asked.count, 0, "the game never asks for data/pos1m-seal.json");
          console.log(`PASS ${tag} background: ${STEPS.length} steps recorded silently; no Flight Recorder or Proof Wall anywhere; seal never asked for`);
        } finally { await context.close().catch(() => {}); await browser.close().catch(() => {}); browser = null; }
      }
      // ---- phoenix ----
      {
        browser = await launch();
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "no-preference", isMobile: phone, hasTouch: phone });
        const page = await context.newPage();
        try {
          const live = STEPS[0];
          const showChip = () => page.evaluate(() => { const chip = document.getElementById("seasonIndicator"); chip.textContent = "Season 2 / 3"; chip.dataset.homeShowdown = "current"; });
          await boot(page);
          await showChip();
          await feed(page, [live]);
          await page.waitForTimeout(1500);
          assert.equal(await page.evaluate(() => document.documentElement.dataset.phoenixRose || null), null, "cold first open: no phoenix");
          assert.equal(await page.evaluate(() => document.querySelectorAll(".phoenixRise").length), 0);
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 20000 });
          await page.evaluate(() => loadRuntimeScript("flight-recorder", "js/flightRecorder.js", () => Boolean(window.CareerModeFlightRecorder)));
          await showChip();
          // Settings is open over the header when the Showdown resumes: the phoenix waits, it never draws over an open overlay
          await openSettings(page);
          await feed(page, [live]);
          await page.waitForTimeout(1000);
          assert.equal(await page.evaluate(() => document.querySelectorAll(".phoenixRise").length), 0, "no phoenix over open Settings");
          assert.equal(await page.evaluate(() => document.documentElement.dataset.phoenixRose || null), null, "and it has not risen behind it");
          await page.evaluate(() => window.closeSettings());
          await page.waitForSelector(".phoenixRise", { timeout: 3000 });
          // every frame of the rise (paused and stepped, 0 to 1000 ms): clear of every button, link, field and the music
          // player, and inside the window; then it plays on
          const path_ = await page.evaluate(() => {
            const bird = document.querySelector(".phoenixRise"), runs = bird.getAnimations(), out = [];
            const clear = [...document.querySelectorAll("button, a[href], [role=button], input, select, textarea, audio, video, [class*='music' i]")].filter(el => { const r = el.getBoundingClientRect(); return el.id !== "seasonIndicator" && r.width && r.height && getComputedStyle(el).visibility !== "hidden"; });
            for (const a of runs) a.pause();
            for (let t = 0; t <= 1000; t += 50) {
              for (const a of runs) a.currentTime = t;
              const b = bird.getBoundingClientRect(), opacity = Number(getComputedStyle(bird).opacity);
              const hit = clear.filter(el => { const q = el.getBoundingClientRect(); return q.x < b.right && b.x < q.right && q.y < b.bottom && b.y < q.bottom; }).map(el => (el.id || el.className || el.tagName).toString().slice(0, 30));
              out.push({ t, opacity, top: b.top, bottom: b.bottom, left: b.left, right: b.right, hit });
            }
            for (const a of runs) { a.currentTime = 0; a.play(); }
            return out;
          });
          for (const f of path_) {
            if (f.opacity <= 0) continue;
            assert.deepEqual(f.hit, [], `phoenix at ${f.t} ms clear of every button and the music player`);
            assert.ok(f.top >= 0 && f.left >= 0 && f.bottom <= height && f.right <= width, `phoenix at ${f.t} ms inside the window`);
          }
          await page.waitForTimeout(330);
          const mid = await page.evaluate(() => {
            const box = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
            const bird = document.querySelector(".phoenixRise"), chip = document.getElementById("seasonIndicator");
            const buttons = [...document.querySelectorAll("button, a, [role=button]")].filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== "hidden"; }).map(el => ({ box: box(el), text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30) }));
            return { bird: box(bird), chip: box(chip), opacity: Number(getComputedStyle(bird).opacity), events: getComputedStyle(bird).pointerEvents, rose: document.documentElement.dataset.phoenixRose, buttons };
          });
          await page.screenshot({ path: path.join(output, `${tag}-phoenix.png`) });
          assert.equal(mid.rose, "1", "the resumed page rises the phoenix once");
          assert.equal(mid.events, "none", "the phoenix never takes a tap");
          assert.ok(mid.opacity > 0.3, `the phoenix is seen (opacity ${mid.opacity})`);
          const cx = mid.bird.x + mid.bird.width / 2;
          assert.ok(cx >= mid.chip.x && cx <= mid.chip.x + mid.chip.width, "the phoenix rises over the status line");
          for (const b of mid.buttons) assert.ok(!overlaps(mid.bird, b.box), `the phoenix clear of the button ${b.text}`);
          await page.waitForTimeout(1200);
          assert.equal(await page.evaluate(() => document.querySelectorAll(".phoenixRise").length), 0, "gone after about a second");
          await feed(page, [live]);
          await page.waitForTimeout(800);
          assert.equal(await page.evaluate(() => document.documentElement.dataset.phoenixRose), "1", "once per page");
          console.log(`PASS ${tag} phoenix: none on a cold open, once after a reload, over the status line, clear of every button`);
        } finally { await context.close().catch(() => {}); await browser.close().catch(() => {}); browser = null; }
      }
    } catch (error) {
      console.error(`FAIL ${tag}: ${error.message}`);
      failures.push(`${tag}: ${error.message}`);
    } finally { if (browser) await browser.close().catch(() => {}); }
  }
  assert.deepEqual(failures, [], failures.join("\n"));
  console.log(`PASS r100 Flight Recorder gallery: ${sizes.length} sizes`);
})().catch(error => { console.error(error); process.exitCode = 1; });
