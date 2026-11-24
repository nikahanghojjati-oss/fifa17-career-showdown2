"use strict";
// r100 Phoenix B5: the real app, no Firebase. Three checks per window size, screenshots to test-results/r100-flight-recorder/:
//   settings  Settings with the FLIGHT RECORDER button in SHOWDOWN DATA and the Proof Wall plaque (a sample seal for this build,
//             served in place of data/pos1m-seal.json, which POS1M writes): both painted, inside the window, clear of every other
//             card, DONE and each other; no plaque at all when the seal is missing or belongs to another build.
//   flight    FLIGHT RECORDER opens the page inside Settings: a whole 3-season Showdown fed through observe() step by step, with a
//             sentinel in every private field (tests/support/flight-recorder-fixture.cjs). At EVERY step the page's whole DOM
//             (text and attributes) and localStorage hold no sentinel; at the end every row is painted, not cut, inside the width,
//             rows never overlap; BACK TO SETTINGS returns to the panels.
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
const SEAL = { schemaVersion: 1, engine: "POS1M", build: APP_VERSION, commit: "c0ffee".padEnd(40, "0"), sealedAt: "2026-11-28T03:00:00Z",
  stories: { survived: 1000000, run: 1000000 }, laws: { held: 15, total: 15 }, plantedBugs: { caught: 40, total: 40 }, ledgerReplays: { refound: 12, total: 12 } };
const STEPS = showdown(3, { stamp: plainStamp }).steps;

function overlaps(a, b) { return a && b && a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1; }

async function boot(page, { seal = SEAL } = {}) {
  await page.route(/https:\/\/(?:[^/]*\.)?googleapis\.com\//, route => route.abort());
  await page.route(/\/data\/pos1m-seal\.json(\?.*)?$/, route => seal ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(seal) }) : route.fulfill({ status: 404, body: "" }));
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
const probe = (page, selectors) => page.evaluate(selectors => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.x, y: r.y, width: r.width, height: r.height } : null; };
  const vis = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false; } return true; };
  const out = {};
  for (const [name, selector] of Object.entries(selectors)) out[name] = [...document.querySelectorAll(selector)].filter(vis).map(el => ({ box: box(el), text: el.textContent.trim().slice(0, 80), cut: el.scrollWidth > el.clientWidth + 1 }));
  const content = document.getElementById("settingsContent");
  out.view = { w: innerWidth, h: innerHeight, scroll: content ? content.scrollHeight - content.clientHeight : 0 };
  return out;
}, selectors);
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

async function assertClearOfChrome(page, targets, label) {
  // every scroll position of every scroller: the painted part of each target (cut to its scrollers) stays clear of the page
  // title, the x, DONE and (for the plaque) the sticky Account card
  const hits = await page.evaluate(targets => {
    const shown = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false; } return true; };
    const painted = el => {
      let r = el.getBoundingClientRect(); let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.overflowX !== "visible" || s.overflowY !== "visible") { const c = n.getBoundingClientRect(); x1 = Math.max(x1, c.left); y1 = Math.max(y1, c.top); x2 = Math.min(x2, c.right); y2 = Math.min(y2, c.bottom); }
      }
      x1 = Math.max(x1, 0); y1 = Math.max(y1, 0); x2 = Math.min(x2, innerWidth); y2 = Math.min(y2, innerHeight);
      return x2 - x1 > 1 && y2 - y1 > 1 ? { x1, y1, x2, y2 } : null;
    };
    const meet = (a, b) => a && b && a.x1 < b.x2 - 1 && b.x1 < a.x2 - 1 && a.y1 < b.y2 - 1 && b.y1 < a.y2 - 1;
    const chrome = [...document.querySelectorAll(".settingsTitleBlock, #settingsClose, .settingsFooter .menuButton, #settingsContent > .settingsConnectedAccountPanel")].filter(shown);
    const scrollers = [document.scrollingElement, ...document.querySelectorAll("#settingsOverlay, #settingsOverlay *")].filter(n => n && n.scrollHeight > n.clientHeight + 1 && (n === document.scrollingElement || /auto|scroll/.test(getComputedStyle(n).overflowY)));
    const saved = scrollers.map(n => n.scrollTop);
    const out = [];
    const check = where => {
      for (const selector of targets) for (const el of document.querySelectorAll(selector)) {
        if (!shown(el)) continue;
        const a = painted(el);
        for (const c of chrome) if (c !== el && !c.contains(el) && !el.contains(c) && meet(a, painted(c))) out.push(`${selector} meets ${c.className || c.id} ${where}`);
      }
    };
    check("at the top");
    scrollers.forEach((n, i) => { for (const f of [0.25, 0.5, 0.75, 1]) { n.scrollTop = Math.round((n.scrollHeight - n.clientHeight) * f); check(`with scroller ${i} at ${f * 100}%`); } n.scrollTop = saved[i]; });
    return [...new Set(out)];
  }, targets);
  assert.deepEqual(hits, [], `${label}: ${hits.join("; ")}`);
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
      // ---- settings + flight ----
      {
        browser = await launch();
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce", isMobile: phone, hasTouch: phone });
        const page = await context.newPage();
        try {
          await boot(page);
          // a live Showdown in its second season, seen step by step
          const cut = STEPS.findIndex(step => /transferChallenges\/season_2$/.test(step.path) && step.data.revision === 3);
          await feed(page, STEPS.slice(0, cut + 1));
          await openSettings(page);
          // the seal arrives after the first draw and the panels are drawn again; wait until both are in and fully shown
          await page.waitForFunction(() => {
            const shown = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) < 1) return false; } return true; };
            const button = document.querySelector(".settingsFlightRecorderButton"), plaque = document.querySelector(".settingsProofWall");
            return Boolean(button && plaque && shown(button) && shown(plaque));
          }, null, { timeout: 10000 });
          const main = await probe(page, { button: ".settingsFlightRecorderButton", plaque: ".settingsProofWall", panels: "#settingsContent > .settingsPanel:not(.settingsProofWall)", done: ".settingsFooter .menuButton" });
          await page.screenshot({ path: path.join(output, `${tag}-settings.png`) });
          assert.equal(main.button.length, 1, `FLIGHT RECORDER is in SHOWDOWN DATA (${JSON.stringify(main.button)})`);
          assert.equal(main.plaque.length, 1, "the Proof Wall plaque is painted");
          assert.match(main.plaque[0].text, /PROOF WALL\s*BUILD/);
          for (const item of [...main.button, ...main.plaque]) {
            assert.ok(item.box && item.box.x >= 0 && item.box.x + item.box.width <= main.view.w + 1, `inside the width: ${item.text}`);
            assert.equal(item.cut, false, `not cut: ${item.text}`);
          }
          for (const card of main.panels) assert.ok(!overlaps(main.plaque[0].box, card.box), `plaque clear of ${card.text.slice(0, 30)}`);
          for (const done of main.done) assert.ok(!overlaps(main.plaque[0].box, done.box), "plaque clear of DONE");
          await assertClearOfChrome(page, [".settingsProofWall", ".settingsFlightRecorderButton"], "Settings");
          await page.locator(".settingsFlightRecorderButton").click();
          await page.locator(".settingsFlightRecorderPanel").waitFor({ state: "visible", timeout: 5000 });
          // the rest of the Showdown arrives while the page is open: every step, private check after each
          for (let i = cut + 1; i < STEPS.length; i += 1) {
            await feed(page, [STEPS[i]]);
            await assertPrivate(page, `step ${i + 1}`);
          }
          await page.waitForTimeout(200);
          const flight = await probe(page, { rows: ".flightRecorderStep", back: ".settingsFlightRecorderBack", others: "#settingsContent > .settingsPanel:not(.settingsFlightRecorderPanel)", heads: ".flightRecorderGroupHead" });
          await page.screenshot({ path: path.join(output, `${tag}-flight.png`) });
          await page.screenshot({ path: path.join(output, `${tag}-flight-full.png`), fullPage: true });
          assert.equal(flight.others.length, 0, "the Flight Recorder page stands alone");
          assert.equal(flight.back.length, 1, "BACK TO SETTINGS is there");
          assert.equal(flight.rows.length, 6 + 2 + 3 * 10 + 1, "every step of the 3-season Showdown");
          assert.deepEqual(flight.heads.map(h => h.text), ["SET-UP", "SEASON 1", "SEASON 2", "SEASON 3", "THE END"]);
          for (const row of flight.rows) {
            assert.ok(row.box && row.box.x >= 0 && row.box.x + row.box.width <= flight.view.w + 1, `row inside the width: ${row.text}`);
            assert.equal(row.cut, false, `row not cut: ${row.text}`);
          }
          for (let i = 0; i < flight.rows.length; i += 1) for (let j = i + 1; j < flight.rows.length; j += 1) assert.ok(!overlaps(flight.rows[i].box, flight.rows[j].box), "rows do not overlap");
          await assertPrivate(page, "the end");
          await assertClearOfChrome(page, [".settingsFlightRecorderPanel"], "Flight Recorder");
          await page.locator(".settingsFlightRecorderBack").click();
          await page.locator(".settingsFlightRecorderButton").waitFor({ state: "visible", timeout: 5000 });
          console.log(`PASS ${tag} settings + flight: ${flight.rows.length} steps, plaque "${main.plaque[0].text.replace(/\s+/g, " ").slice(0, 70)}"`);
        } finally { await context.close().catch(() => {}); await browser.close().catch(() => {}); browser = null; }
      }
      // ---- no plaque without a valid seal for this build ----
      if (width === 1920 && height === 866 || width === 390) {
        for (const seal of [null, { ...SEAL, build: "9.9.9" }, { ...SEAL, stories: { survived: 999999, run: 1000000 } }]) {
          browser = await launch();
          const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", isMobile: phone, hasTouch: phone });
          const page = await context.newPage();
          try {
            await boot(page, { seal });
            await openSettings(page);
            assert.equal(await page.locator(".settingsProofWall").count(), 0, `no plaque for ${JSON.stringify(seal && { build: seal.build, stories: seal.stories })}`);
          } finally { await context.close().catch(() => {}); await browser.close().catch(() => {}); browser = null; }
        }
        console.log(`PASS ${tag} no plaque without a whole seal for this build`);
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
