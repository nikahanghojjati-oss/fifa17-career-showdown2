// TW-PLATE-G render + QA harness. Usage: node tools/render-qa.cjs <baseUrl> <outDir>
// Carries forward the CP1P harness intent: strings, privacy, tab order, fit, scroll safety.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const base = process.argv[2] || "http://127.0.0.1:8765/";
const out = process.argv[3] || "evidence";
fs.mkdirSync(out, { recursive: true });
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures.json"), "utf8"));
const S = fx.strings;

const shots = [
  { frame: "S0", vw: 1366, vh: 768, dpr: 1 },
  { frame: "G2", vw: 1366, vh: 768, dpr: 1 },
  { frame: "G3", vw: 1366, vh: 768, dpr: 1 },
  { frame: "G2", vw: 1366, vh: 640, dpr: 1 },
  { frame: "G3", vw: 1366, vh: 640, dpr: 1 },
  { frame: "G2", vw: 1920, vh: 1080, dpr: 1 },
  { frame: "G2", vw: 1440, vh: 900, dpr: 1 },
  { frame: "G2", vw: 1366, vh: 768, dpr: 2 },
  { frame: "G2", vw: 1366, vh: 768, dpr: 1, grid: true },
];

(async () => {
  const browser = await chromium.launch();
  const report = { base, when: new Date().toISOString(), results: [] };
  const frostHtml = {};
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: s.dpr });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}index.html?frame=${s.frame}${s.grid ? "&grid=1" : ""}`);
    await page.waitForFunction(() => window.__plateReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(150);
    const name = `${s.frame}_${s.vw}x${s.vh}${s.dpr > 1 ? "@2x" : ""}${s.grid ? "_grid" : ""}.png`;
    await page.screenshot({ path: path.join(out, name) });

    const r = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const rect = (n) => { const b = n.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
      const res = { checks: {} };
      const stage = q("#stage-root");
      res.k = +stage.dataset.k; res.offY = +stage.dataset.offY; res.offX = +stage.dataset.offX;
      res.docScroll = { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth, vh: innerHeight };
      if (!q(".panel")) return res;
      const text = (id) => (document.getElementById(id) || {}).textContent;
      res.strings = {
        title: text("transferChallengeTitle"), back: text("backToShowdownHome"), refresh: text("refreshSharedTransferChallenge"),
        rail: [...document.querySelectorAll("#transferPhaseNavigator .label")].map((n) => n.textContent),
        status: text("transferPhaseStatus"), sign: text("transferTimerDisplay"),
        heading: (q(".own-heading") || {}).textContent, privacy: text("transferGuessPrivacyNote"), primary: text("completeTransferChallenge"),
        rule: (q(".rule-note") || {}).textContent, placeholder: (q(".guess-col input") || {}).placeholder,
        chips: [...document.querySelectorAll(".chip")].map((n) => n.textContent), intro: !!document.getElementById("transferPhaseIntro"),
      };
      // fit: nothing inside title/body/rules overflows its painted rect
      const fit = [];
      document.querySelectorAll(".panel-title, .panel-body, .rule-note, .sign-screen").forEach((n) => {
        const b = n.getBoundingClientRect();
        [...n.querySelectorAll("*")].concat([n]).forEach((c) => {
          if (c.closest(".sr-only")) return;
          const cb = c.getBoundingClientRect();
          if (cb.width === 0) return;
          if (cb.left < b.left - 0.5 || cb.right > b.right + 0.5 || cb.top < b.top - 0.5 || cb.bottom > b.bottom + 0.5)
            fit.push({ box: n.className, el: c.tagName + (c.id ? "#" + c.id : "." + c.className), over: [Math.round(b.left - cb.left), Math.round(cb.right - b.right), Math.round(b.top - cb.top), Math.round(cb.bottom - b.bottom)] });
        });
        if (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1) fit.push({ box: n.className, scroll: [n.scrollWidth, n.clientWidth, n.scrollHeight, n.clientHeight] });
      });
      res.checks.fit = fit;
      // placeholder / option text fits its control
      const cv = document.createElement("canvas").getContext("2d");
      const clip = [];
      document.querySelectorAll(".guess-col input, .guess-col select, .btn-lock, .own-heading, .privacy-note").forEach((c) => {
        const cs = getComputedStyle(c);
        cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        cv.letterSpacing = cs.letterSpacing;
        let t = c.tagName === "INPUT" ? c.placeholder : c.tagName === "SELECT" ? [...c.options].reduce((a, o) => (o.text.length > a.length ? o.text : a), "") : c.textContent;
        const avail = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const need = cv.measureText(t).width;
        if (c.classList.contains("privacy-note")) return; // wraps by design
        if (need > avail + 0.5) clip.push({ el: c.id || c.className, t, need: Math.round(need), avail: Math.round(avail) });
      });
      res.checks.textClip = clip;
      // sizes
      const ctl = [...document.querySelectorAll(".guess-col select, .guess-col input, .btn-lock")].map((c) => ({ id: c.id, h: Math.round(c.getBoundingClientRect().height), font: parseFloat(getComputedStyle(c).fontSize) }));
      res.controls = { minH: Math.min(...ctl.map((c) => c.h)), minFont: Math.min(...ctl.map((c) => c.font)), lockH: ctl.find((c) => c.id === "completeTransferChallenge").h };
      const txtFonts = [...document.querySelectorAll(".own-heading, .privacy-note, .rule-note, .sign-status, .rail li, .hud-title, .rival-name")].map((n) => parseFloat(getComputedStyle(n).fontSize));
      res.minTextFont = Math.min(...txtFonts);
      // privacy
      const sealed = q(".panel.sealed");
      res.checks.privacy = {
        sealedFocusable: sealed.querySelectorAll("input,select,button,textarea,a,[tabindex]").length,
        sealedText: sealed.textContent,
        ownPrefixIds: [...document.querySelectorAll(".panel.own [id]")].map((n) => n.id).filter((i) => /^p\dGuess/.test(i)).map((i) => i.slice(0, 2)),
        rivalIdsPresent: [...document.querySelectorAll("[id]")].map((n) => n.id).filter((i) => /^p\dGuess/.test(i)).map((i) => i.slice(0, 2)).filter((v, i, a) => a.indexOf(v) === i),
      };
      res.frostHtml = sealed.querySelector(".frost").innerHTML;
      // layout safety
      const foot = q(".hud-footer").getBoundingClientRect();
      const panels = [...document.querySelectorAll(".panel-body")].map((n) => n.getBoundingClientRect().bottom);
      const sign = q(".sign-screen").getBoundingClientRect();
      res.checks.layout = {
        footerTop: Math.round(foot.top), panelBottomMax: Math.round(Math.max(...panels)),
        footerClearsPanels: foot.top >= Math.max(...panels) - 0.5,
        signInView: sign.top >= 0 && sign.bottom <= innerHeight,
        noPageScroll: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
        footerClip: q(".hud-footer").scrollWidth > q(".hud-footer").clientWidth + 1,
      };
      return res;
    });

    // tab order
    const tabs = [];
    await page.focus("body");
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
      tabs.push(id);
    }
    r.tabOrder = tabs;

    // interaction: type select enables value input
    if (s.frame !== "S0" && !s.grid && s.vh === 768 && s.dpr === 1 && s.vw === 1366) {
      const prefix = s.frame === "G2" ? "p1" : "p2";
      const before = await page.evaluate((p) => document.getElementById(p + "Guess1Value").disabled, prefix);
      await page.selectOption(`#${prefix}Guess1Type`, "league");
      const after = await page.evaluate((p) => { const i = document.getElementById(p + "Guess1Value"); return { disabled: i.disabled, ph: i.placeholder }; }, prefix);
      await page.fill(`#${prefix}Guess1Value`, "Premier League");
      await page.selectOption(`#${prefix}Guess2Type`, "nationality");
      await page.fill(`#${prefix}Guess2Value`, "Netherlands");
      await page.screenshot({ path: path.join(out, `${s.frame}_${s.vw}x${s.vh}_filled.png`) });
      const frostAfter = await page.evaluate(() => document.querySelector(".panel.sealed .frost").innerHTML);
      await page.selectOption(`#${prefix}Guess1Type`, "");
      const reset = await page.evaluate((p) => { const i = document.getElementById(p + "Guess1Value"); return { disabled: i.disabled, v: i.value, ph: i.placeholder }; }, prefix);
      r.interaction = { beforeDisabled: before, afterSelect: after, reset, frostUnchangedByInput: frostAfter === r.frostHtml };
    }
    if (r.frostHtml) frostHtml[s.frame] = r.frostHtml;
    delete r.frostHtml;
    r.errors = errors;
    report.results.push({ shot: name, ...s, ...r });
    await ctx.close();
  }
  report.frostIdenticalAcrossViewers = frostHtml.G2 === frostHtml.G3;
  fs.writeFileSync(path.join(out, "qa_report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log("wrote", out);
})().catch((e) => { console.error(e); process.exit(1); });
