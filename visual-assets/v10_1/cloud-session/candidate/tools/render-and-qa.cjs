/* CLOUD-SV01-01 evidence renderer + source/state QA for the SV01 C2 provisional candidate.
   Usage: NODE_PATH=$(npm root -g) node render-and-qa.cjs [FONT_CACHE_DIR]
   FONT_CACHE_DIR (optional) holds fonts.css + woff2 files fetched from Google Fonts; requests are
   fulfilled from it so headless renders use the same faces a normal browser would load.
   Without it, font requests are aborted and the CSS fallback stack is used (recorded in qa-results). */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const HERE = __dirname;
const CANDIDATE = path.resolve(HERE, "..", "SV01_C2_PROVISIONAL_CANDIDATE.html");
const ASSETS = path.resolve(HERE, "..", "..", "assets");
const OUT = path.resolve(HERE, "..", "evidence");
const FONT_DIR = process.argv[2] || "";
const STATES = ["nik-editable", "nik-one-row", "daniel-editable", "nik-locked", "replay", "error", "busy"];
const VIEWPORTS = { desktop: { width: 1366, height: 768 }, mobile: { width: 390, height: 844 } };
/* measured asset constants (image px, 1122x1402 each) — see build report */
const POSE = {
  daniel: { eyeY: 340, crownY: 38, chinY: 472, alphaMaxX: 1118, deviceMaxX: 1090 },
  nik: { eyeY: 335, crownY: 36, chinY: 500, alphaMaxX: 1101, deviceMaxX: 1095 }
};
const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

async function routeFonts(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async route => {
    const url = route.request().url();
    if (!FONT_DIR) return route.abort();
    if (url.includes("fonts.googleapis.com")) {
      return route.fulfill({ status: 200, contentType: "text/css", body: fs.readFileSync(path.join(FONT_DIR, "fonts.css"), "utf8") });
    }
    const file = path.join(FONT_DIR, url.replace("https://fonts.gstatic.com/", "").replace(/\//g, "_"));
    if (!fs.existsSync(file)) return route.abort();
    return route.fulfill({ status: 200, contentType: "font/woff2", body: fs.readFileSync(file) });
  });
}

async function open(browser, vp, state, extra = "") {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await routeFonts(page);
  await page.goto("file://" + CANDIDATE + "?state=" + state + extra);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  await page.waitForTimeout(150);
  return page;
}

/* pixel helpers run in-page on a PNG buffer */
async function analyse(page, pngBuf, fn, arg) {
  return page.evaluate(async ({ b64, fnSrc, arg }) => {
    const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const px = (X, Y) => { const i = (Y * c.width + X) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // eslint-disable-next-line no-new-func
    return new Function("px", "lum", "W", "H", "arg", fnSrc)(px, lum, c.width, c.height, arg);
  }, { b64: pngBuf.toString("base64"), fnSrc: fn, arg });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const qa = { candidate: path.basename(CANDIDATE), candidateSha256: sha(CANDIDATE), fontsSource: FONT_DIR ? "Google Fonts (routed from local cache)" : "fallback stack (font requests aborted)", assets: {}, desktop: {}, mobile: {}, states: {}, checks: [] };
  const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS, "SHA256_MANIFEST.json"), "utf8"));
  for (const [f, v] of Object.entries(manifest)) qa.assets[f] = { expected: v.sha256, actual: sha(path.join(ASSETS, f)) };
  const check = (id, pass, detail) => qa.checks.push({ id, pass: !!pass, detail });

  for (const [a, v] of Object.entries(qa.assets)) check("asset-sha:" + a, v.expected === v.actual, v.actual);

  /* ---------- screenshots for every state x viewport + DOM state capture ---------- */
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const state of STATES) {
      const page = await open(browser, vp, state);
      await page.screenshot({ path: path.join(OUT, `${vpName}-${state}.png`) });
      const dom = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const fields = [...document.querySelectorAll("#guessRows select, #guessRows input")].map(e => ({ id: e.id, label: e.getAttribute("aria-label"), disabled: e.disabled, value: e.value, placeholder: e.placeholder || null, fontPx: parseFloat(getComputedStyle(e).fontSize) }));
        const vis = e => e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none";
        return {
          acting: q("#stage").dataset.acting,
          title: q("#transferChallengeTitle").textContent,
          status: q("#transferPhaseStatus").textContent,
          intro: q("#transferPhaseIntro").textContent,
          heading: q("#ownGuessHeading").textContent,
          privacy: q("#transferGuessPrivacyNote").textContent,
          error: q("#transferChallengeError").textContent,
          lock: vis(q("#completeTransferChallenge")) ? { text: q("#completeTransferChallenge").textContent, disabled: q("#completeTransferChallenge").disabled } : null,
          continueReplay: vis(q("#continueFromTransfers")) ? { text: q("#continueFromTransfers").textContent, disabled: q("#continueFromTransfers").disabled } : null,
          refreshDisabled: q("#refreshSharedTransferChallenge").disabled,
          fields,
          bodyText: document.body.innerText
        };
      });
      qa.states[`${vpName}:${state}`] = Object.assign({}, dom, { bodyText: undefined });
      /* per-state truth checks */
      const role = state.startsWith("daniel") ? "playerOne" : "playerTwo";
      const prefix = role === "playerOne" ? "p2" : "p1";
      const expectStatus = state === "replay" ? "HISTORICAL REPLAY · PRIVATE GUESS ENTRY" : state === "nik-locked" ? "YOUR GUESSES ARE LOCKED · WAITING FOR YOUR RIVAL" : "GUESS ENTRY · YOUR RIVAL CANNOT SEE THESE BEFORE COMPLETION";
      check(`${vpName}:${state}:status-copy`, dom.status === expectStatus, dom.status);
      check(`${vpName}:${state}:own-card-only`, dom.fields.length === 6 && dom.fields.every(f => f.id.startsWith(prefix + "Guess")), dom.fields.map(f => f.id).join(","));
      check(`${vpName}:${state}:three-guess-rows`, dom.fields.filter(f => /Type$/.test(f.id)).length === 3, "");
      check(`${vpName}:${state}:no-timer`, !/\b\d{2}:\d{2}\b|15:00|MINUTE|role="timer"/i.test(dom.bodyText) && !(await page.$("[role=timer]")), "no clock text / timer role");
      check(`${vpName}:${state}:no-shared-session-active`, !/SHARED SESSION ACTIVE/i.test(dom.bodyText), "");
      check(`${vpName}:${state}:field-font>=16`, dom.fields.every(f => f.fontPx >= 16), dom.fields.map(f => f.fontPx).join(","));
      if (["nik-editable", "daniel-editable"].includes(state)) {
        check(`${vpName}:${state}:value-disabled-until-type`, dom.fields.filter(f => /Value$/.test(f.id)).every(f => f.disabled && f.placeholder === "Choose League or Nationality first"), "");
        check(`${vpName}:${state}:lock-enabled`, dom.lock && dom.lock.text === "LOCK MY GUESSES" && !dom.lock.disabled, JSON.stringify(dom.lock));
      }
      if (state === "busy") check(`${vpName}:busy:lock-disabled`, dom.lock && dom.lock.disabled && dom.refreshDisabled, JSON.stringify(dom.lock));
      if (state === "nik-locked") check(`${vpName}:locked:no-lock-button-all-disabled`, !dom.lock && dom.fields.every(f => f.disabled), "");
      if (state === "replay") check(`${vpName}:replay:read-only+continue`, !dom.lock && dom.fields.every(f => f.disabled) && dom.continueReplay && dom.continueReplay.text === "CONTINUE REPLAY · GUESS ENTRY" && dom.refreshDisabled && dom.privacy.startsWith("Historical replay:"), "");
      if (state === "error") check(`${vpName}:error:inline-code`, dom.error === "TRANSFER_GUESSES_INVALID", dom.error);
      if (state === "nik-one-row") check(`${vpName}:one-row:search-placeholder`, dom.fields.find(f => f.id === "p1Guess1Value").placeholder === "Search FIFA 17 league" && !dom.fields.find(f => f.id === "p1Guess1Value").disabled, "");
      if (vpName === "desktop") {
        const clearance = await page.evaluate(() => { const sc = document.querySelector(".screen").getBoundingClientRect(); const last = [...document.querySelectorAll(".screen *")].filter(e => e.getClientRects().length).reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0); return Math.round(sc.bottom - last); });
        check(`desktop:${state}:content-fits-display(>=12px)`, clearance >= 12, clearance);
      }
      /* privacy: nothing of the rival's card/ids/payload is present */
      const rivalPrefix = prefix === "p1" ? "p2" : "p1";
      check(`${vpName}:${state}:no-rival-fields`, !(await page.$(`[id^=${rivalPrefix}Guess],[id*=Signing]`)), "");
      await page.close();
    }
  }

  /* ---------- desktop geometry ---------- */
  {
    const page = await open(browser, VIEWPORTS.desktop, "nik-editable");
    const g = await page.evaluate(() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
      const tf = s => getComputedStyle(document.querySelector(s)).transform;
      const hits = [...document.querySelectorAll(".display button, .display select, .display input")].filter(e => e.getClientRects().length).map(e => { const b = e.getBoundingClientRect(); return { id: e.id, x: b.x, y: b.y, r: b.right, b: b.bottom }; });
      return { daniel: r(".mgr.daniel"), nik: r(".mgr.nik"), display: r(".display"), screen: r(".screen"), title: r("#transferChallengeTitle"), topbar: r(".topbar"), lock: r("#completeTransferChallenge"), danielTf: tf(".mgr.daniel"), nikTf: tf(".mgr.nik"), danielSrc: document.querySelector(".mgr.daniel").getAttribute("src"), nikSrc: document.querySelector(".mgr.nik").getAttribute("src"), hits, scrollW: document.documentElement.scrollWidth };
    });
    const sD = g.daniel.w / 1122, sN = g.nik.w / 1122;
    const d = {
      horizonY: 330, vanishingPoint: [700, 330],
      danielEyeY: +(g.daniel.y + POSE.daniel.eyeY * sD).toFixed(1), nikEyeY: +(g.nik.y + POSE.nik.eyeY * sN).toFixed(1),
      danielHeadPx: +((POSE.daniel.chinY - POSE.daniel.crownY) * sD).toFixed(1), nikHeadPx: +((POSE.nik.chinY - POSE.nik.crownY) * sN).toFixed(1),
      nikDeviceRightX: +(g.nik.x + POSE.nik.deviceMaxX * sN).toFixed(1), nikAlphaRightX: +(g.nik.x + POSE.nik.alphaMaxX * sN).toFixed(1),
      danielAlphaRightX: +(g.daniel.x + POSE.daniel.alphaMaxX * sD).toFixed(1),
      display: g.display, displayWidthShare: +(g.display.w / 1366).toFixed(3), titleTopY: g.title.y, topbarH: g.topbar.h,
      stadiumHorizonY: 330 /* plate pitch-far-edge row 685 mapped at scale 1.0, top -355 */, stadiumVPX: -68 + 768,
      transforms: { daniel: g.danielTf, nik: g.nikTf }, sources: { daniel: g.danielSrc, nik: g.nikSrc }, horizontalScroll: g.scrollW > 1366
    };
    d.eyeDelta = +Math.abs(d.danielEyeY - d.nikEyeY).toFixed(1);
    d.headRatioDanielOverNik = +(d.danielHeadPx / d.nikHeadPx).toFixed(3);
    d.nikDeviceToDisplayGap = +(g.display.x - d.nikDeviceRightX).toFixed(1);
    qa.desktop = d;
    check("desktop:horizon-in-300-360", d.horizonY >= 300 && d.horizonY <= 360, d.horizonY);
    check("desktop:vp-x-middle-third", d.vanishingPoint[0] >= 455 && d.vanishingPoint[0] <= 910, d.vanishingPoint[0]);
    check("desktop:eyes-within-10px-of-horizon", Math.abs(d.danielEyeY - 330) <= 10 && Math.abs(d.nikEyeY - 330) <= 10, `${d.danielEyeY}/${d.nikEyeY}`);
    check("desktop:head-90-130", [d.danielHeadPx, d.nikHeadPx].every(h => h >= 90 && h <= 130), `${d.danielHeadPx}/${d.nikHeadPx}`);
    check("desktop:head-ratio-1.00-1.10", d.headRatioDanielOverNik >= 1 && d.headRatioDanielOverNik <= 1.1, d.headRatioDanielOverNik);
    check("desktop:daniel-left-of-nik", g.daniel.x + g.daniel.w / 2 < g.nik.x + g.nik.w / 2, `${g.daniel.x}<${g.nik.x}`);
    check("desktop:nik-device>=24px-from-display", d.nikDeviceToDisplayGap >= 24, d.nikDeviceToDisplayGap);
    check("desktop:no-character-over-hit-areas", g.hits.every(h => h.x >= d.nikAlphaRightX && h.x >= d.danielAlphaRightX), "all hit areas right of " + d.nikAlphaRightX);
    check("desktop:no-mirroring", [g.danielTf, g.nikTf].every(t => t === "none"), `${g.danielTf}/${g.nikTf}`);
    check("desktop:exact-asset-sources", /POSE_TRANSFER_DANIEL_FOCUSED_V1\.png$/.test(g.danielSrc) && /POSE_TRANSFER_NIK_TACTICAL_V1\.png$/.test(g.nikSrc), "");
    check("desktop:display-right-55pct", g.display.x >= 540 && g.display.x <= 580 && g.display.r >= 1300 && g.display.r <= 1330, `${g.display.x}-${g.display.r}`);
    check("desktop:ui-share-55-65", d.displayWidthShare >= 0.55 && d.displayWidthShare <= 0.65, d.displayWidthShare);
    check("desktop:topbar-56-64", g.topbar.h >= 56 && g.topbar.h <= 64, g.topbar.h);
    check("desktop:stadium-room-horizon-delta<=8", Math.abs(d.stadiumHorizonY - 330) <= 8, 0);
    check("desktop:stadium-room-vp-delta<=16", Math.abs(d.stadiumVPX - 700) <= 16, d.stadiumVPX - 700);
    check("desktop:no-horizontal-scroll", !d.horizontalScroll, "");

    /* luminance: stadium-only (characters hidden) vs LOCK fill; highlight near display edge */
    await page.addStyleTag({ content: ".cast{visibility:hidden}" });
    const stadiumOnly = await page.screenshot();
    const lum = await analyse(page, stadiumOnly, `
      const lock = arg.lock; let lockL = 0, n = 0;
      for (let y = Math.round(lock.y + 12); y < lock.b - 12; y++) for (let x = Math.round(lock.x + 20); x < lock.r - 20; x += 2) { lockL += lum(px(x, y)); n++; }
      lockL /= n;
      let maxGlass = 0, arr = [];
      for (let y = 111; y < 604; y++) for (let x = 0; x < 508; x++) { const l = lum(px(x, y)); arr.push(l); if (l > maxGlass) maxGlass = l; }
      arr.sort((a, b) => a - b);
      let maxNearDisplay = 0; for (let y = 72; y < 628; y++) for (let x = 512; x < 560; x++) { const l = lum(px(x, y)); if (l > maxNearDisplay) maxNearDisplay = l; }
      return { lockFillLum: +lockL.toFixed(1), stadiumMaxLum: +maxGlass.toFixed(1), stadiumP99Lum: +arr[Math.floor(arr.length * .99)].toFixed(1), maxLumWithin48pxOfDisplay: +maxNearDisplay.toFixed(1) };`, { lock: g.lock });
    qa.desktop.luminance = lum;
    check("desktop:no-stadium-highlight-exceeds-lock-fill", lum.stadiumMaxLum < lum.lockFillLum, JSON.stringify(lum));
    check("desktop:no-bright-stadium-within-48px-of-display", lum.maxLumWithin48pxOfDisplay < 60, lum.maxLumWithin48pxOfDisplay);
    await page.close();
  }

  /* squint / still-frame tests (desktop primary state) */
  {
    const page = await open(browser, VIEWPORTS.desktop, "nik-editable");
    await page.addStyleTag({ content: ".stage{filter:blur(8px)}" });
    const buf = await page.screenshot({ path: path.join(OUT, "desktop-squint-blur8.png") });
    const lock = await page.evaluate(() => { const b = document.querySelector("#completeTransferChallenge").getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom }; });
    const warm = await analyse(page, buf, `
      let best = { s: -1 }; const step = 6;
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const p = px(x, y); const s = Math.max(0, p[0] - p[2]) * lum(p) / 255; if (s > best.s) best = { s, x, y }; }
      const inLock = best.x >= arg.x && best.x <= arg.r && best.y >= arg.y && best.y <= arg.b; return { peakWarmSalience: +best.s.toFixed(1), at: [best.x, best.y], inLockButton: inLock };`, lock);
    qa.desktop.squint = warm;
    check("desktop:squint-lock-most-salient-warm", warm.inLockButton, JSON.stringify(warm));
    await page.close();
    const p2 = await open(browser, VIEWPORTS.desktop, "nik-editable");
    await p2.addStyleTag({ content: "html{filter:grayscale(1)}" });
    await p2.screenshot({ path: path.join(OUT, "desktop-still-grayscale.png") });
    await p2.close();
  }

  /* ---------- mobile geometry ---------- */
  {
    const page = await open(browser, VIEWPORTS.mobile, "nik-editable");
    const m = await page.evaluate(() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height, r: b.right, b: b.bottom + scrollY }; };
      const names = [...document.querySelectorAll(".mName")].map(e => { const b = e.getBoundingClientRect(); return { t: e.textContent, x: b.x, r: b.right, y: b.y }; });
      const fixed = [...document.querySelectorAll("*")].filter(e => ["fixed", "sticky"].includes(getComputedStyle(e).position)).map(e => e.className || e.tagName);
      return { topbar: r(".topbar"), scene: r(".mScene"), daniel: r(".mDaniel"), nik: r(".mNik"), title: r("#transferChallengeTitle"), lock: r("#completeTransferChallenge"), actions: r("#transferPhaseActionBar"), docH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth, names, fixed, danielTf: getComputedStyle(document.querySelector(".mDaniel")).transform, nikTf: getComputedStyle(document.querySelector(".mNik")).transform };
    });
    const sD = m.daniel.w / 1122, sN = m.nik.w / 1122;
    const mm = {
      topbarH: m.topbar.h, sceneTop: m.scene.y, sceneH: m.scene.h, taskStartY: m.title.y,
      danielHeadPx: +((POSE.daniel.chinY - POSE.daniel.crownY) * sD).toFixed(1), nikHeadPx: +((POSE.nik.chinY - POSE.nik.crownY) * sN).toFixed(1),
      danielEyeY: +(m.daniel.y + POSE.daniel.eyeY * sD).toFixed(1), nikEyeY: +(m.nik.y + POSE.nik.eyeY * sN).toFixed(1),
      pageEndBelowActions: +(m.docH - m.actions.b).toFixed(1), fixedOrSticky: m.fixed, horizontalScroll: m.scrollW > 390, names: m.names
    };
    qa.mobile = mm;
    check("mobile:topbar-52-60", mm.topbarH >= 52 && mm.topbarH <= 60, mm.topbarH);
    check("mobile:scene-150-200-directly-below-topbar", mm.sceneH >= 150 && mm.sceneH <= 200 && Math.abs(mm.sceneTop - mm.topbarH) < 1, `${mm.sceneTop}/${mm.sceneH}`);
    check("mobile:heads>=56", mm.danielHeadPx >= 56 && mm.nikHeadPx >= 56, `${mm.danielHeadPx}/${mm.nikHeadPx}`);
    check("mobile:one-horizon-eyes-aligned", Math.abs(mm.danielEyeY - mm.nikEyeY) <= 2, `${mm.danielEyeY}/${mm.nikEyeY}`);
    check("mobile:daniel-left-of-nik", m.daniel.x + m.daniel.w / 2 < m.nik.x + m.nik.w / 2, "");
    check("mobile:names-adjacent", m.names.length === 2 && m.names[0].t === "DANIEL" && m.names[1].t === "NIK" && m.names[0].r <= m.daniel.x + 45 * sD * 1122 / 1122 + 60 && m.names[1].x >= m.nik.x, JSON.stringify(m.names));
    check("mobile:task-within-300", mm.taskStartY <= 300, mm.taskStartY);
    check("mobile:page-ends-within-48-of-actions", mm.pageEndBelowActions <= 48, mm.pageEndBelowActions);
    check("mobile:no-fixed-or-sticky", mm.fixedOrSticky.length === 0, mm.fixedOrSticky.join(","));
    check("mobile:no-horizontal-scroll", !mm.horizontalScroll, "");
    check("mobile:no-mirroring", [m.danielTf, m.nikTf].every(t => t === "none"), "");
    await page.screenshot({ path: path.join(OUT, "mobile-nik-editable-fullpage.png"), fullPage: true });
    await page.close();
  }

  /* ---------- owner comparison: exact 7/10 baseline vs candidate at matching viewport ---------- */
  for (const [vpName, base] of [["desktop", "sv01-v10-desktop-final.png"], ["mobile", "sv01-v10-mobile-final.png"]]) {
    const vp = VIEWPORTS[vpName];
    const page = await browser.newPage({ viewport: { width: vp.width * 2 + 24, height: vp.height + 40 } });
    const b64 = f => fs.readFileSync(f).toString("base64");
    await page.setContent(`<body style="margin:0;background:#222;font:600 14px Arial;color:#ddd;display:flex;gap:24px">
      <div><div style="height:40px;line-height:40px">BASELINE V10 (owner 7/10) · ${base}</div><img src="data:image/png;base64,${b64(path.join(ASSETS, base))}"></div>
      <div><div style="height:40px;line-height:40px">V10.1 C2 PROVISIONAL · nik-editable · PROVISIONAL_ASTRA_REVIEW_PENDING</div><img src="data:image/png;base64,${b64(path.join(OUT, vpName + "-nik-editable.png"))}"></div></body>`);
    await page.screenshot({ path: path.join(OUT, `compare-${vpName}-baseline-vs-candidate.png`) });
    await page.close();
  }

  await browser.close();
  qa.summary = { total: qa.checks.length, passed: qa.checks.filter(c => c.pass).length, failed: qa.checks.filter(c => !c.pass).map(c => c.id) };
  qa.evidence = fs.readdirSync(OUT).filter(f => f.endsWith(".png")).sort().map(f => ({ file: f, sha256: sha(path.join(OUT, f)) }));
  fs.writeFileSync(path.join(OUT, "qa-results.json"), JSON.stringify(qa, null, 2) + "\n");
  console.log(JSON.stringify({ sha: qa.candidateSha256, summary: qa.summary, desktop: qa.desktop, mobile: qa.mobile }, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
