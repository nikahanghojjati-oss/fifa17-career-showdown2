#!/usr/bin/env node
/**
 * CLOUD-TR2-01-CP1 render + QA pass (Appendix E/F).
 *
 * Serves the static prototype from this directory, captures every required
 * frame/viewport/DPR combination with Playwright's preinstalled Chromium,
 * runs the console-error / tab-order / contrast checks, and writes raw
 * screenshots + JSON reports under evidence/. A second pass
 * (`python3 tools/intake.py --evidence`) assembles the raster contact
 * sheets (E1-E6) from these raw captures plus the derived assets.
 *
 * Usage: node tools/render-and-qa.cjs
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "evidence");
const RAW_DIR = path.join(EVIDENCE_DIR, "raw");
const PORT = 8793;

fs.mkdirSync(RAW_DIR, { recursive: true });

function findChromiumExecutable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  const entries = fs.readdirSync(base).filter((d) => d.startsWith("chromium-"));
  if (!entries.length) throw new Error("No preinstalled chromium-* found under " + base);
  const dir = path.join(base, entries.sort().reverse()[0], "chrome-linux", "chrome");
  if (!fs.existsSync(dir)) throw new Error("chrome executable not found at " + dir);
  return dir;
}

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".webp": "image/webp",
  ".avif": "image/avif", ".woff2": "font/woff2", ".svg": "image/svg+xml",
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split("?")[0]);
    if (reqPath === "/") reqPath = "/index.html";
    const filePath = path.join(ROOT, reqPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found: " + reqPath); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

// -- relative luminance / contrast (WCAG) -----------------------------------

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function parseColor(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return [255, 255, 255];
  return m[1].split(",").slice(0, 3).map((x) => parseFloat(x));
}

async function measureContrastForElement(page, selector) {
  const handle = await page.$(selector);
  if (!handle) return null;
  const box = await handle.boundingBox();
  if (!box || box.width < 1 || box.height < 1) return null;
  // For an empty input the visible text is the ::placeholder, styled separately
  // from the element's own `color`; read whichever is actually on screen.
  const color = await handle.evaluate((el) => {
    const isEmptyInput = el.tagName === "INPUT" && el.value === "" && el.placeholder;
    return isEmptyInput ? getComputedStyle(el, "::placeholder").color : getComputedStyle(el).color;
  });
  const [tr, tg, tb] = parseColor(color);
  const textLum = relLuminance(tr, tg, tb);
  // Inset slightly so a decorative border (not "background behind the text") doesn't
  // skew the brightest-pixel search.
  const inset = 4;
  const clip = {
    x: Math.max(0, box.x + inset), y: Math.max(0, box.y + inset),
    width: Math.max(1, box.width - inset * 2), height: Math.max(1, box.height - inset * 2),
  };
  // Measure the background BEHIND the text, not the glyphs themselves: temporarily
  // make this element's own text (and any ::placeholder) transparent so the
  // screenshot captures only the composited panel/scene behind it.
  const styleTag = await handle.evaluate((el) => {
    const all = [el, ...el.querySelectorAll("*")];
    all.forEach((node) => { node.dataset.__prevColor = node.style.color; node.style.color = "transparent"; });
    const tag = document.createElement("style");
    tag.textContent = "*::placeholder { color: transparent !important; }";
    document.head.appendChild(tag);
    return true;
  });
  const buf = await page.screenshot({ clip });
  await handle.evaluate((el) => {
    const all = [el, ...el.querySelectorAll("*")];
    all.forEach((node) => { node.style.color = node.dataset.__prevColor || ""; delete node.dataset.__prevColor; });
    const tag = [...document.head.querySelectorAll("style")].find((s) => s.textContent.includes("::placeholder"));
    if (tag) tag.remove();
  });
  const png = PNG.sync.read(buf);
  let maxLum = 0, maxPixel = [0, 0, 0];
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    const lum = relLuminance(r, g, b);
    if (lum > maxLum) { maxLum = lum; maxPixel = [r, g, b]; }
  }
  const ratio = contrastRatio(textLum, maxLum);
  return { selector, textColor: [tr, tg, tb], brightestBg: maxPixel, ratio: Math.round(ratio * 100) / 100 };
}

// -- capture matrix -----------------------------------------------------------

const DESKTOP_FRAMES = ["F1", "F2", "F3"];
const DESKTOP_VIEWPORT = { width: 1366, height: 768 };
const MOBILE_FRAMES = ["F4", "F5"];
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const SPOT_CHECKS = [
  { frame: "F2", viewport: { width: 1920, height: 1080 } },
  { frame: "F2", viewport: { width: 1440, height: 900 } },
  { frame: "F2", viewport: { width: 1366, height: 640 } },
  { frame: "F5", viewport: { width: 360, height: 780 } },
];

async function gotoFrame(context, frame, viewport, dpr) {
  const page = await context.newPage({});
  await page.setViewportSize(viewport);
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push("console.error: " + msg.text()); });
  const failedRequests = [];
  page.on("response", (r) => { if (!r.ok() && !r.url().endsWith("/favicon.ico")) failedRequests.push(r.status() + " " + r.url()); });
  await page.goto(`http://127.0.0.1:${PORT}/index.html?frame=${frame}`, { waitUntil: "networkidle" });
  await page.waitForFunction("window.__cp1FrameReady === true", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(150);
  return { page, consoleErrors, failedRequests };
}

async function main() {
  const server = await startServer();
  const executablePath = findChromiumExecutable();
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });

  const report = { consoleErrors: {}, failedRequests: {}, tabOrder: {}, contrast: {}, measurements: {}, screenshots: [] };

  async function capture(frame, viewport, dpr, label) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
    const { page, consoleErrors, failedRequests } = await gotoFrame(context, frame, viewport, dpr);
    const fileName = `${frame}_${viewport.width}x${viewport.height}_dpr${dpr}${label ? "_" + label : ""}.png`;
    const outPath = path.join(RAW_DIR, fileName);
    const fullPage = frame === "F4" || frame === "F5";
    await page.screenshot({ path: outPath, fullPage });
    report.consoleErrors[fileName] = consoleErrors;
    report.failedRequests[fileName] = failedRequests;
    report.screenshots.push(fileName);
    return { page, context, outPath, fileName };
  }

  // --- Primary viewports for F1-F5 at DPR1 and DPR2 (F4/F5 also DPR1) ---
  for (const frame of DESKTOP_FRAMES) {
    for (const dpr of [1, 2]) {
      const { context } = await capture(frame, DESKTOP_VIEWPORT, dpr);
      await context.close();
    }
  }
  for (const frame of MOBILE_FRAMES) {
    for (const dpr of [2, 1]) {
      const { context } = await capture(frame, MOBILE_VIEWPORT, dpr);
      await context.close();
    }
  }
  // S1/S2 (plate-only cue stills) at DPR1
  for (const frame of ["S1", "S2"]) {
    const { context } = await capture(frame, DESKTOP_VIEWPORT, 1);
    await context.close();
  }

  // --- E10 spot checks ---
  for (const spot of SPOT_CHECKS) {
    const { context } = await capture(spot.frame, spot.viewport, 1, "spotcheck");
    await context.close();
  }

  // --- E9: F2 with keyboard focus on slot 1 type ---
  {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, "F2", DESKTOP_VIEWPORT, 1);
    await page.focus("#p1Guess1Type");
    await page.screenshot({ path: path.join(RAW_DIR, "E9_F2_focus_slot1type.png") });
    await context.close();
  }

  // --- E8: F1 and F2 grayscale + 8px blur (squint) versions ---
  for (const frame of ["F1", "F2"]) {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, frame, DESKTOP_VIEWPORT, 1);
    await page.evaluate(() => { document.documentElement.style.filter = "grayscale(1)"; });
    await page.screenshot({ path: path.join(RAW_DIR, `E8_${frame}_grayscale.png`) });
    await page.evaluate(() => { document.documentElement.style.filter = "blur(8px)"; });
    await page.screenshot({ path: path.join(RAW_DIR, `E8_${frame}_blur8px.png`) });
    await context.close();
  }

  // --- E7: F3 with Nik's eyeline drawn + Daniel's panel rect ---
  {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, "F3", DESKTOP_VIEWPORT, 1);
    const info = await page.evaluate(() => {
      const poseImgs = document.querySelectorAll(".pose-right"); // Nik is on the right in F3 too (Daniel left/Nik right always)
      const nikImg = poseImgs[0];
      const nikRect = nikImg ? nikImg.getBoundingClientRect() : null;
      const panel = document.querySelector(".guess-viewer-panel");
      const panelRect = panel ? panel.getBoundingClientRect() : null;
      return { nikRect, panelRect };
    });
    // Nik's eye centre in element-fraction terms (from fixtures: eyeLeft/eyeRight avg over source h/w for file3)
    // file3 (POSE_TRANSFER_NIK_TACTICAL_V1): eyeLeft [470,320], eyeRight [590,310], source 1122x1402
    const eyeFracX = ((470 + 590) / 2) / 1122;
    const eyeFracY = ((320 + 310) / 2) / 1402;
    const overlay = await page.evaluate(({ nikRect, panelRect, eyeFracX, eyeFracY }) => {
      if (!nikRect) return null;
      const eyeX = nikRect.x + nikRect.width * eyeFracX;
      const eyeY = nikRect.y + nikRect.height * eyeFracY;
      // gaze direction: down and toward image-left, per brief B3 privacy gaze rule
      const gazeX = eyeX - 260, gazeY = eyeY + 200;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("style", "position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none;");
      svg.innerHTML = `
        <line x1="${eyeX}" y1="${eyeY}" x2="${gazeX}" y2="${gazeY}" stroke="#ff2d55" stroke-width="3" />
        <circle cx="${eyeX}" cy="${eyeY}" r="5" fill="#ff2d55" />
        ${panelRect ? `<rect x="${panelRect.x}" y="${panelRect.y}" width="${panelRect.width}" height="${panelRect.height}" fill="none" stroke="#31d0ff" stroke-width="3" stroke-dasharray="8 6" />` : ""}
      `;
      document.body.appendChild(svg);
      return { eyeX, eyeY, gazeX, gazeY, panelRight: panelRect ? panelRect.x + panelRect.width : null };
    }, { nikRect: info.nikRect, panelRect: info.panelRect, eyeFracX, eyeFracY });
    await page.screenshot({ path: path.join(RAW_DIR, "E7_F3_eyeline.png") });
    report.measurements.E7_gaze_check = overlay;
    await context.close();
  }

  // --- Tab order checks (F2, F5) ---
  for (const frame of ["F2", "F5"]) {
    const viewport = frame === "F2" ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, frame, viewport, 1);
    await page.evaluate(() => { document.body.focus(); if (document.activeElement) document.activeElement.blur(); });
    const sequence = [];
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? (el.id || el.tagName.toLowerCase()) : null;
      });
      sequence.push(id);
    }
    report.tabOrder[frame] = sequence;
    await context.close();
  }

  // --- Contrast measurements (Appendix B5) on F1 and F2 text blocks ---
  {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, "F1", DESKTOP_VIEWPORT, 1);
    const selectors = ["#transferPhaseStatus .status-text", ".phase-intro", ".rules-line", ".rule-note", ".btn-secondary"];
    report.contrast.F1 = [];
    for (const sel of selectors) {
      const r = await measureContrastForElement(page, sel);
      if (r) report.contrast.F1.push(r);
    }
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, "F2", DESKTOP_VIEWPORT, 1);
    const selectors = [".guess-header .status-text", ".guess-viewer-panel .phase-intro", ".guess-heading", ".rule-note", ".privacy-note", ".btn-primary", "#p1Guess1Value"];
    report.contrast.F2 = [];
    for (const sel of selectors) {
      const r = await measureContrastForElement(page, sel);
      if (r) report.contrast.F2.push(r);
    }
    await context.close();
  }

  // --- E11 measurements.json: geometry + font sizes + clearances per frame ---
  const measureFrames = ["F1", "F2", "F3"];
  for (const frame of measureFrames) {
    const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
    const { page } = await gotoFrame(context, frame, DESKTOP_VIEWPORT, 1);
    const data = await page.evaluate(() => {
      function rectOf(sel) { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; }
      function fontSizeOf(sel) { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontSize : null; }
      const poseLeft = rectOf(".pose-left");
      const poseRight = rectOf(".pose-right");
      const panel = rectOf(".window-brief-panel") || rectOf(".guess-viewer-panel");
      const dossier = rectOf(".sealed-dossier");
      return {
        poseLeftRect: poseLeft, poseRightRect: poseRight,
        panelRect: panel, dossierRect: dossier,
        statusFontSize: fontSizeOf("#transferPhaseStatus"),
        headingFontSize: fontSizeOf(".guess-heading") || fontSizeOf(".status-line"),
        ruleNoteFontSize: fontSizeOf(".rule-note"),
      };
    });
    // clearance: panel top vs. bottom of each pose's bounding box (B3 rule 1 proxy)
    let clearanceLeft = null, clearanceRight = null;
    if (data.panelRect) {
      if (data.poseLeftRect) clearanceLeft = data.panelRect.y - data.poseLeftRect.y; // proxy, refined manually in result
      if (data.poseRightRect) clearanceRight = data.panelRect.y - data.poseRightRect.y;
    }
    report.measurements[frame] = Object.assign({}, data, { clearanceLeftPanelTopMinusPoseTop: clearanceLeft, clearanceRightPanelTopMinusPoseTop: clearanceRight });
    await context.close();
  }

  // --- page bytes (transfer size) for the first scene, desktop + mobile ---
  for (const [frame, viewport] of [["F1", DESKTOP_VIEWPORT], ["F4", MOBILE_VIEWPORT]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    let totalBytes = 0;
    page.on("response", async (r) => {
      try {
        const buf = await r.body();
        totalBytes += buf.length;
      } catch (e) { /* ignore (e.g. redirected/opaque responses) */ }
    });
    await page.goto(`http://127.0.0.1:${PORT}/index.html?frame=${frame}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    report.measurements[`${frame}_pageBytes`] = totalBytes;
    await context.close();
  }

  fs.writeFileSync(path.join(EVIDENCE_DIR, "render_qa_report.json"), JSON.stringify(report, null, 2));
  console.log("Wrote evidence/render_qa_report.json");
  console.log("Console errors total:", Object.values(report.consoleErrors).reduce((a, b) => a + b.length, 0));

  await browser.close();
  server.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
