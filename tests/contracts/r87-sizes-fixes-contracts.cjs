"use strict";
// Geometry contracts for the remaining r87 size findings. Local app only; no Firebase.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
process.env.CMS_CHROMIUM_MULTI_CONTEXT = "1";
const root = path.resolve(__dirname, "../..");
(async () => {
  const port = 4678;
  const server = spawn(process.execPath, ["tests/support/static-server.cjs"], {
    cwd: root,
    env: { ...process.env, CMS_TEST_PORT: String(port) },
    stdio: "ignore",
  });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(await resolveChromiumRuntime()),
    });
    const failures = [];
    // F4: the same shell/body/intro/status structure produced by srjRenderAuto.
    // No session is opened: only the presentation markup is supplied here.
    const waitingContext = await browser.newContext({
      viewport: { width: 820, height: 1180 },
    });
    await waitingContext.route(
      (url) => url.hostname !== "127.0.0.1",
      (route) => route.abort(),
    );
    const waitingPage = await waitingContext.newPage();
    await waitingPage.goto(`http://127.0.0.1:${port}/`, {
      waitUntil: "domcontentloaded",
    });
    await waitingPage
      .locator("#loadingScreen")
      .waitFor({ state: "hidden", timeout: 30000 });
    await waitingPage.addStyleTag({
      path: path.join(root, "css/remoteJoining.css"),
    });
    await waitingPage.evaluate(() => {
      document.documentElement.dataset.v10Screen = "leagueWheelScreen";
      const overlay = document.createElement("div");
      overlay.id = "sparkRemoteJoiningOverlay";
      overlay.className = "remoteJoiningOverlay";
      overlay.innerHTML =
        '<div class="remoteJoiningShell"><div class="remoteJoiningHeader"><strong>CAREER MODE SHOWDOWN // 17</strong><button class="remoteJoiningDismiss">×</button></div><div class="remoteJoiningBody"><div class="remoteJoiningIntro"><span class="remoteJoiningEyebrow">CAREER MODE SHOWDOWN</span><h2>WAITING FOR NIK</h2><p>Your game is ready. It continues by itself as soon as Nik opens Career Mode Showdown and taps CONTINUE CAREER.</p></div><p class="remoteJoiningStatus">Waiting for Nik to open the game.</p></div></div>';
      document.body.append(overlay);
    });
    for (const [width, height] of [
      [768, 1024],
      [820, 1180],
      [844, 390],
      [740, 360],
      [1920, 1080],
    ]) {
      await waitingPage.setViewportSize({ width, height });
      const dimensions = await waitingPage
        .locator("#sparkRemoteJoiningOverlay")
        .evaluate((el) => ({ width: el.clientWidth, content: el.scrollWidth }));
      if (dimensions.content > dimensions.width + 1)
        failures.push(
          `F4 ${width}x${height}: ${dimensions.content}>${dimensions.width}`,
        );
    }
    await waitingContext.close();

    for (const [width, height] of [
      [768, 1024],
      [820, 1180],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.route(
        (url) => url.hostname !== "127.0.0.1",
        (route) => route.abort(),
      );
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator("#loadingScreen")
        .waitFor({ state: "hidden", timeout: 30000 });
      await page.locator(".homeLockup").waitFor();
      // Face landmarks in ENV_HOME_PLATE_V1 (1672 x 941), in source pixels.
      const face = await page.locator(".plateView").evaluate((el) => {
        const css = getComputedStyle(el),
          box = el.getBoundingClientRect();
        const size = css.backgroundSize;
        const height =
          size === "cover"
            ? Math.max(box.height, (box.width * 941) / 1672)
            : parseFloat(size.split(" ")[1]);
        const photoWidth = (height * 1672) / 941;
        const position = css.backgroundPositionX;
        const percent = Number(position.match(/([\d.]+)%/)?.[1] || 0) / 100;
        const pixels = Number(
          position.match(/([+-]?\s*[\d.]+)px/)?.[1]?.replace(/\s/g, "") || 0,
        );
        const offset = (box.width - photoWidth) * percent + pixels;
        return { right: offset + (1310 * height) / 941, width: innerWidth };
      });
      try {
        assert.ok(
          face.right <= face.width,
          `F5 ${width}: Nik's face ends at ${face.right}, outside ${face.width}`,
        );
      } catch (e) {
        failures.push(e.message);
      }
      const helpers = require("../support/career-fixture-helpers.cjs");
      const Career = require("../../js/sharedCareerAnalytics.js");
      const projection = helpers.projection({
        seed: "e",
        totalSeasons: 3,
        seasons: [
          [
            helpers.result({ leaguePosition: 1 }),
            helpers.result({ leaguePosition: 2 }),
          ],
        ],
      });
      const model = Career.buildCareerModel({
        indexStatus: "ready",
        showdowns: [
          {
            rivalryId: projection.rivalryId,
            classification: "completed",
            projection,
            final: helpers.finalFor(projection),
          },
        ],
      });
      await page.evaluate(async (model) => {
        await ensureGameplayModules();
        await loadRuntimeScript(
          "career-screen-seam",
          "js/careerScreenSeam.js",
          () => Boolean(window.CareerModeCareerScreenSeam),
        );
        await openOptionalModule("legacy");
        renderLegacy({ model });
      }, model);
      await page.locator("#legacy .legacyWordmark").waitFor();
      await page.waitForTimeout(600);
      const title = await page
        .locator("#legacy .legacyWordmarkWrap")
        .evaluate((el) => ({
          top: el.getBoundingClientRect().top,
          clearance: innerHeight * 0.55 * 0.65,
        }));
      try {
        assert.ok(
          title.top >= title.clearance,
          `F7 ${width}: title starts at ${title.top}, hand ends at ${title.clearance}`,
        );
      } catch (e) {
        failures.push(e.message);
      }
      await context.close();
    }
    for (const [width, height] of [
      [844, 390],
      [740, 360],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.route(
        (url) => url.hostname !== "127.0.0.1",
        (route) => route.abort(),
      );
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/`);
      await page
        .locator("#loadingScreen")
        .waitFor({ state: "hidden", timeout: 30000 });
      await page.evaluate(() => window.openOptionalModule("ruleBook"));
      await page.locator(".ruleBookTabs").waitFor();
      for (let tab = 0; tab < 6; tab++) {
        await page.locator(".ruleBookTab").nth(tab).click();
        const geometry = await page.evaluate(() => {
          const card = document.querySelector(
            '.ruleSection[data-rule-tab="on"]',
          );
          const main = document.querySelector("#app main");
          const st = getComputedStyle(card);
          const innerScroll =
            /auto|scroll/.test(st.overflowY) &&
            card.scrollHeight > card.clientHeight + 2;
          return {
            innerScroll,
            mainOverflow: getComputedStyle(main).overflowY,
            sideways: document.documentElement.scrollWidth > innerWidth + 1,
            cardHeight: card.clientHeight,
            contentHeight: card.scrollHeight,
          };
        });
        assert.equal(
          geometry.innerScroll,
          false,
          `F6 ${width}x${height} tab ${tab + 1}: ${JSON.stringify(geometry)}`,
        );
        assert.match(
          geometry.mainOverflow,
          /auto|scroll/,
          "F6 main owns vertical scrolling",
        );
        assert.equal(geometry.sideways, false, "F6 no sideways page scroll");
      }
      console.log(`PASS F6: all six tabs at ${width}x${height}`);
      await context.close();
    }
    assert.deepEqual(failures, [], "Remaining portrait findings");
    console.log(
      "PASS F5 and F7: tablet faces fit and Legacy title clears the hand at both portrait sizes",
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
