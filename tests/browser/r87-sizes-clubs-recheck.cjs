// Read-only Club render fixtures; all remote requests aborted.
process.env.CMS_CHROMIUM_MULTI_CONTEXT = "1";
const path = require("node:path");
const R = path.resolve(__dirname, "../..");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require(
  R + "/tests/support/chromium-runtime.cjs",
);
const { prepareClub, measureStage } = require(
  R + "/tests/support/v10-club-motion.cjs",
);
const fs = require("fs");
const OUT = path.resolve(
  process.env.PROOF_OUT || "test-results/r87-sizes/clubs",
);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(await resolveChromiumRuntime()),
  });
  for (const [w, h] of [
    [768, 1024],
    [820, 1180],
    [844, 390],
    [740, 360],
    [1920, 1080],
  ]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.route(
      (u) => u.hostname !== "127.0.0.1",
      (r) => r.abort(),
    );
    const p = await c.newPage();
    await p.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
    await p.locator(".homeLockup").waitFor();
    await p
      .locator("#loadingScreen")
      .waitFor({ state: "hidden", timeout: 30000 });
    await prepareClub(p, false);
    for (const stage of [
      "ready",
      "opening",
      "manager-one",
      "manager-two",
      "confirmation",
    ]) {
      await measureStage(p, stage);
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `${OUT}/club-${w}x${h}-${stage}.png` });
      console.log(
        w,
        h,
        stage,
        await p
          .locator("#clubNameTwo")
          .evaluate((e) => ({
            text: e.textContent,
            opacity: getComputedStyle(e).opacity,
            rect: e.getBoundingClientRect().toJSON(),
          })),
      );
    }
    await c.close();
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
