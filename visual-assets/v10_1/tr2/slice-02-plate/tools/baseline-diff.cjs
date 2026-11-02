// No-regression proof for the owner-approved frames (F1 Window + Guess Entry + plate only):
// renders each frame from the approved build (baseline URL, e.g. a worktree of 18db080) and from the
// current build, then compares the stage DOM (normalised outerHTML) and the rendered pixels.
// Usage: NODE_PATH=$(npm root -g) node tools/baseline-diff.cjs <baselineUrl> <currentUrl> <outDir> [baselineSha]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const [baseUrl, curUrl, out = "evidence", sha = "18db080"] = process.argv.slice(2);
const FRAMES = ["F1", "F1D", "F1R", "F1DR", "G2", "G3", "S0"];
const VIEWS = [
  { vw: 1366, vh: 768 }, { vw: 1366, vh: 640 }, { vw: 1920, vh: 1080 },
  { vw: 390, vh: 664, mobile: true }, { vw: 360, vh: 640, mobile: true }, { vw: 375, vh: 553, mobile: true },
];

async function grab(browser, url, frame, v) {
  const ctx = await browser.newContext({ viewport: { width: v.vw, height: v.vh }, deviceScaleFactor: v.mobile ? 2 : 1, isMobile: !!v.mobile, hasTouch: !!v.mobile });
  const page = await ctx.newPage();
  await page.goto(`${url}index.html?frame=${frame}&freeze=1`);
  await page.waitForFunction(() => window.__plateReady === true, null, { timeout: 15000 });
  await page.waitForTimeout(150);
  const png = await page.screenshot({ type: "png" });
  // normalise: drop data-* that only the newer camera writes, keep everything else verbatim
  const dom = await page.evaluate(() => document.getElementById("stage-root").innerHTML);
  const data = await page.evaluate(() => Object.assign({}, document.getElementById("stage-root").dataset));
  await ctx.close();
  return { png, dom, data };
}

(async () => {
  const browser = await chromium.launch();
  const cmp = await (await browser.newContext()).newPage();
  const results = [];
  for (const frame of FRAMES) for (const v of VIEWS) {
    const a = await grab(browser, baseUrl, frame, v), b = await grab(browser, curUrl, frame, v);
    const pxDiff = (pa, pb) => cmp.evaluate(async ([pa, pb]) => {
      const load = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + b64; });
      const [ia, ib] = await Promise.all([load(pa), load(pb)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: true };
      const c = document.createElement("canvas"); c.width = ia.width; c.height = ia.height;
      const g = c.getContext("2d");
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
      g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
      let diff = 0, maxDelta = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        if (d) { diff++; if (d > maxDelta) maxDelta = d; }
      }
      return { pixels: da.length / 4, diffPixels: diff, maxChannelDelta: maxDelta };
    }, [pa.toString("base64"), pb.toString("base64")]);
    const px = await pxDiff(a.png, b.png);
    // If pixels differ with identical DOM, render the baseline again: a baseline-vs-baseline difference of the
    // same size means GPU/raster noise in the approved build itself, not a regression.
    // The approved build itself does not always raster identically (measured: G2 at 1366x640 alternates between
    // two states 1006 px apart when rendered twice from 18db080). So on a pixel difference with identical DOM,
    // re-render the baseline up to 4 more times: pass when the current frame is pixel-identical to any baseline sample.
    if (px.diffPixels && a.dom === b.dom) {
      px.baselineResamples = [];
      for (let t = 0; t < 4; t++) {
        const a2 = await grab(browser, baseUrl, frame, v);
        const self = (await pxDiff(a.png, a2.png)).diffPixels, vsCur = (await pxDiff(a2.png, b.png)).diffPixels;
        px.baselineResamples.push({ baselineSelfDiffPixels: self, currentVsSampleDiffPixels: vsCur });
        if (vsCur === 0) break;
      }
      px.baselineSelfDiffPixels = Math.max(...px.baselineResamples.map((x) => x.baselineSelfDiffPixels));
      px.matchesABaselineSample = px.baselineResamples.some((x) => x.currentVsSampleDiffPixels === 0);
    }
    const dataKeys = [...new Set(Object.keys(a.data).concat(Object.keys(b.data)))].filter((k) => a.data[k] !== b.data[k]);
    const r = { frame, view: `${v.mobile ? "phone " : ""}${v.vw}x${v.vh}`, domIdentical: a.dom === b.dom, stageDataDiff: dataKeys, ...px };
    r.renderNoiseOnly = !!px.diffPixels && !!px.matchesABaselineSample;
    r.pass = r.domIdentical && !dataKeys.length && !px.sizeMismatch && (px.diffPixels === 0 || r.renderNoiseOnly);
    results.push(r);
    console.log(r.pass ? (r.renderNoiseOnly ? "SAME*" : "SAME") : "DIFF", frame, r.view, r.domIdentical ? "dom=" : "dom!", px.diffPixels, px.baselineSelfDiffPixels ?? "", dataKeys.join(","));
  }
  await browser.close();
  const report = { baseline: sha, baseUrl, curUrl, when: new Date().toISOString(), frames: FRAMES, results,
    summary: { comparisons: results.length, identical: results.filter((r) => r.pass).length, pixelIdentical: results.filter((r) => r.diffPixels === 0).length,
      renderNoiseOnly: results.filter((r) => r.renderNoiseOnly).length, different: results.filter((r) => !r.pass).length } };
  fs.writeFileSync(path.join(out, `baseline_diff_${sha}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  process.exit(report.summary.different ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
