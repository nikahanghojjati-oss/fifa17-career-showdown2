// TW-PLATE-G render + QA harness (F1 Window, Guess Entry, F3 Signing Entry, F4 Verdicts; desktop + portrait).
// Usage: NODE_PATH=$(npm root -g) node tools/render-qa.cjs <baseUrl> <outDir>
// Carries forward the CP1P harness intent: strings, privacy, tab order, fit, scroll safety,
// plus M2/M3/M5-style mobile sizing (44 px targets, 16 px inputs) and staging-cover checks.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const base = process.argv[2] || "http://127.0.0.1:8765/";
const out = process.argv[3] || "evidence";
fs.mkdirSync(out, { recursive: true });
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures.json"), "utf8"));
const map = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "platemap.json"), "utf8"));
const S = fx.strings;

// Staging that live UI must never cover (plate px). Faces measured on the 1672 plate; fingertip = overlay rect.
const STAGING = {
  danielFace: [525, 130, 665, 300],
  nikFace: [1075, 130, 1235, 300],
  nikFingertip: map.overlays.nikFingertip.rect,
};

const D = (frame, vw, vh, extra) => Object.assign({ frame, vw, vh, dpr: 1 }, extra || {});
const M = (frame, vw, vh, extra) => Object.assign({ frame, vw, vh, dpr: 2, mobile: true }, extra || {});
const shots = [
  D("S0", 1366, 768),
  D("F1", 1366, 768), D("F1D", 1366, 768), D("F1R", 1366, 768), D("F1DR", 1366, 768),
  D("F1", 1366, 640), D("F1D", 1366, 640),
  D("F1", 1440, 900), D("F1", 1920, 1080), D("F1", 1366, 768, { dpr: 2 }), D("F1", 1366, 768, { grid: true }),
  D("G2", 1366, 768), D("G3", 1366, 768), D("G2", 1366, 640), D("G3", 1366, 640), D("G2", 1440, 900), D("G2", 1920, 1080),
  // Phone viewports: visible browser area (iPhone 12-15 Safari 390x664, Pro Max 430x740, Android 360x640,
  // full-screen/tall 390x844 and 430x932, iPhone SE Safari 375x553 = scroll tolerated, action must show).
  M("F1", 390, 664), M("F1D", 390, 664), M("F1R", 390, 664), M("F1DR", 390, 664),
  M("F1", 390, 844), M("F1", 430, 740), M("F1", 430, 932), M("F1", 360, 640), M("F1", 375, 667), M("F1", 375, 553, { tight: true }),
  M("G2", 390, 664), M("G3", 390, 664), M("G2", 390, 844), M("G2", 430, 740), M("G3", 430, 932), M("G2", 360, 640), M("G3", 375, 667), M("G2", 375, 553, { tight: true }),
  M("S0", 390, 664), M("S0", 430, 932),
  // F3 Signing Entry + F4 Verdicts (Sol TWF F3/F4 brief R2 §6)
  D("F3", 1366, 768), D("F3D", 1366, 768), D("F3L", 1366, 768), D("F3DL", 1366, 768), D("F3", 1366, 640), D("F3D", 1366, 640),
  D("F3", 1440, 900), D("F3D", 1920, 1080), D("F3", 1366, 768, { dpr: 2 }),
  D("F4", 1366, 768), D("F4D", 1366, 768), D("F4E", 1366, 768), D("F4DE", 1366, 768), D("F4", 1366, 640), D("F4D", 1366, 640),
  D("F4", 1440, 900), D("F4D", 1920, 1080), D("F4", 1366, 768, { dpr: 2 }),
  M("F3", 390, 664), M("F3D", 390, 664), M("F3L", 390, 664), M("F3DL", 390, 664), M("F3", 390, 844), M("F3D", 430, 740), M("F3", 430, 932),
  M("F3", 360, 640), M("F3D", 360, 640), M("F3L", 360, 640), M("F3", 375, 667), M("F3", 375, 553, { tight: true }), M("F3D", 375, 553, { tight: true }),
  M("F4", 390, 664), M("F4D", 390, 664), M("F4E", 390, 664), M("F4DE", 390, 664), M("F4", 390, 844), M("F4D", 430, 740), M("F4", 430, 932),
  M("F4", 360, 640), M("F4D", 360, 640), M("F4E", 360, 640), M("F4", 375, 667), M("F4", 375, 553, { tight: true }), M("F4DE", 375, 553, { tight: true }),
  // gate pre-check gaps (F3 items 4/6): locked frames at the SE floor, Daniel locked at the 360x640 floor
  M("F3L", 375, 553, { tight: true }), M("F3DL", 375, 553, { tight: true }), M("F3DL", 360, 640),
];

// Expected keyboard order per frame (= visual order, top to bottom, left to right). Asserted, not just recorded.
function expectedTabOrder(frame) {
  const c = fx.frames[frame];
  const hud = ["backToShowdownHome", "refreshSharedTransferChallenge"];
  if (c.plateOnly) return [];
  if (c.phase === "WINDOW_OPEN") return (c.endRequested ? [] : ["endTransferTimer"]).concat(hud);
  if (c.phase === "GUESS_ENTRY") { const p = c.viewer === "playerTwo" ? "p1" : "p2"; return [1, 2, 3].map((i) => `${p}Guess${i}Type`).concat(["completeTransferChallenge"], hud); }
  if (c.phase === "SIGNING_ENTRY") {
    if (c.signingsLocked) return hud;
    const p = c.viewer === "playerTwo" ? "p2" : "p1";
    return [1, 2, 3].flatMap((i) => ["Name", "League", "Nationality"].map((f) => `${p}Signing${i}${f}`)).concat(["completeTransferChallenge"], hud);
  }
  return hud; // COMPLETED: continuation is disabled, no private fields
}

function stringsFor(frame) {
  const c = fx.frames[frame];
  const nik = c.viewer === "playerTwo";
  const common = { title: S.title.replace("{season}", "1"), back: S.back, refresh: S.refresh, rail: S.rail, rule: S.ruleNote };
  if (c.phase === "WINDOW_OPEN") return Object.assign(common, {
    status: S.f1Status, heading: nik ? S.nameplateTwo : S.nameplateOne, brief: S.f1Intro,
    action: c.endRequested ? S.f1ActionRequested : S.f1Action, rulesLine: S.f1RulesLine, activeRail: S.rail[0],
  });
  if (c.phase === "SIGNING_ENTRY") return Object.assign({ title: common.title, back: S.back, refresh: S.refresh, rail: S.rail }, {
    status: c.signingsLocked ? S.signingStatusLocked : S.signingStatus, sign: S.signWindowClosed, heading: nik ? S.nameplateTwo : S.nameplateOne,
    signingPrivacy: nik ? S.privacyNoteNikViewer : S.privacyNoteDanielViewer, primary: c.signingsLocked ? undefined : S.signingPrimary,
    summary: S.signingLockSummary, activeRail: S.rail[2],
    placeholders: c.signingsLocked ? [] : [S.signingPlaceholderName, S.signingPlaceholderLeague, S.signingPlaceholderNationality],
    __locked: !!c.signingsLocked,
  });
  if (c.phase === "COMPLETED") {
    const heading = (role) => S.verdictHeading.replace("{MANAGER}", fx.managers[role]).replace("{CLUB}", fx.clubs[role]);
    const lines = (role) => (fx.results[c.result][role] || []).map((v) => (v.release ? S.verdictRelease : S.verdictKeep));
    return Object.assign(common, {
      status: S.completedStatus, sign: S.signWindowClosed, heading: heading(c.viewer), activeRail: S.rail[3], continueLabel: S.continueLabel,
      verdictHeadings: [heading("playerOne"), heading("playerTwo")], verdictLines: [lines("playerOne"), lines("playerTwo")],
      emptyLines: ["playerOne", "playerTwo"].filter((r) => !(fx.results[c.result][r] || []).length).map(() => S.verdictEmpty),
      // revealed read-only guesses: card One (Daniel) carries Nik's guesses against Daniel, card Two the reverse
      guessReveal: [["playerOne", "playerTwo"], ["playerTwo", "playerOne"]].map(([owner, guesser]) => {
        const g = fx.inputs[guesser].guessesAgainstRival || [];
        return { head: S.guessRevealHeading.replace("{GUESSER}", fx.managers[guesser]).replace("{OWNER}", fx.managers[owner]),
          items: g.length ? g.map((x) => `${x.type === "league" ? S.selectLeague : S.selectNationality} ${x.value}`) : [S.guessRevealNone], fields: 0 };
      }),
    });
  }
  return Object.assign(common, {
    status: S.guessStatus, sign: S.signWindowClosed, heading: nik ? S.guessHeadingNikViewer : S.guessHeadingDanielViewer,
    privacy: nik ? S.privacyNoteNikViewer : S.privacyNoteDanielViewer, primary: S.primary, placeholder: S.valuePlaceholder, activeRail: S.rail[1],
  });
}

(async () => {
  const browser = await chromium.launch();
  const report = { base, when: new Date().toISOString(), staging: STAGING, results: [] };
  const sealedSig = {};
  const verdictSig = {};
  let failures = 0;
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: s.dpr, isMobile: !!s.mobile, hasTouch: !!s.mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}index.html?frame=${s.frame}&freeze=1${s.grid ? "&grid=1" : ""}`);
    await page.waitForFunction(() => window.__plateReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(150);
    const tag = `${s.frame}_${s.vw}x${s.vh}${s.dpr > 1 && !s.mobile ? "@2x" : ""}${s.grid ? "_grid" : ""}`;
    const name = `${s.mobile ? "M_" : ""}${tag}.jpg`;
    await page.screenshot({ path: path.join(out, name), type: "jpeg", quality: 86 });

    const r = await page.evaluate(({ STAGING, expect }) => {
      const q = (sel) => document.querySelector(sel);
      const vis = (n) => { if (!n) return false; const cs = getComputedStyle(n); const b = n.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && b.width > 0 && b.height > 0; };
      const stage = q("#stage-root");
      const res = { mode: stage.dataset.mode, k: +stage.dataset.k, offY: +stage.dataset.offY, titleCropPx: +(stage.dataset.titleCropPx || 0), checks: {}, fail: [] };
      res.docScroll = { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth, vh: innerHeight };
      res.checks.noHorizontalScroll = document.documentElement.scrollWidth <= innerWidth && (stage.dataset.mode !== "mobile" || stage.scrollWidth <= stage.clientWidth + 1);
      if (!res.checks.noHorizontalScroll) res.fail.push("horizontal scroll");
      if (!q(".panel")) { res.sceneCrop = stage.dataset.sceneCrop; return res; }
      const mobile = res.mode === "mobile";
      const text = (id) => (document.getElementById(id) || {}).textContent;

      // ---- strings
      const got = {
        title: text("transferChallengeTitle"), back: text("backToShowdownHome"), refresh: text("refreshSharedTransferChallenge"),
        rail: [...document.querySelectorAll("#transferPhaseNavigator .label")].map((n) => n.textContent),
        activeRail: (q("#transferPhaseNavigator li.active .label") || {}).textContent,
        status: text("transferPhaseStatus"), sign: text("transferTimerDisplay"),
        heading: (q(".panel.own .own-heading") || {}).textContent, rule: (q(".rule-note") || {}).textContent,
        brief: text("transferWindowBrief"), action: text("endTransferTimer"), rulesLine: (q(".rules-line") || {}).textContent,
        privacy: text("transferGuessPrivacyNote"), primary: text("completeTransferChallenge"),
        placeholder: (q(".guess-col input") || {}).placeholder,
        signingPrivacy: text("transferSigningPrivacyNote"), summary: text("transferPhaseLockSummary"), continueLabel: text("continueFromTransfers"),
        placeholders: [...new Set([...document.querySelectorAll(".signing-row input")].map((n) => n.placeholder))],
        verdictHeadings: ["transferResultsOne", "transferResultsTwo"].map((id) => (q("#" + id + " h4") || {}).textContent),
        verdictLines: ["transferResultsOne", "transferResultsTwo"].map((id) => [...document.querySelectorAll("#" + id + " .vr-verdict")].map((n) => n.textContent)),
        emptyLines: [...document.querySelectorAll(".verdict-empty")].map((n) => n.textContent),
        guessReveal: document.getElementById("transferResultsOne") ? ["transferResultsOne", "transferResultsTwo"].map((id) => {
          const b = q("#" + id + " .guess-reveal");
          return b ? { head: (b.querySelector(".gr-head") || {}).textContent, items: [...b.querySelectorAll(".gr-item")].filter(vis).map((n) => n.textContent),
            fields: b.querySelectorAll("input, select, textarea, button, [contenteditable]").length } : null;
        }) : undefined,
        visibleChips: [...document.querySelectorAll(".chip")].filter(vis).map((n) => n.textContent),
        intro: !!document.getElementById("transferPhaseIntro"),
      };
      const mism = Object.keys(expect).filter((k) => !k.startsWith("__") && JSON.stringify(got[k]) !== JSON.stringify(expect[k])).map((k) => ({ key: k, want: expect[k], got: got[k] }));
      res.strings = got; res.checks.stringMismatches = mism;
      if (mism.length) res.fail.push("strings");
      if (got.intro) res.fail.push("intro present");
      if (got.visibleChips.filter((c) => c === "YOU").length !== 1) res.fail.push("YOU chip count");

      // ---- fit: nothing overflows its registered glass / card / sign
      const fit = [];
      const boxes = mobile ? ".panel, .rules-card, .sign-screen" : ".panel-title, .panel-body, .rules-inner, .sign-screen";
      document.querySelectorAll(boxes).forEach((n) => {
        const b = n.getBoundingClientRect();
        const clipToView = mobile && n.classList.contains("panel");
        [...n.querySelectorAll("*")].forEach((c) => {
          if (c.closest(".sr-only") || c.closest(".sep") || !vis(c) || c.closest("svg")) return;
          const cb = c.getBoundingClientRect();
          if (cb.left < b.left - 0.5 || cb.right > b.right + 0.5 || cb.top < b.top - 0.5 || cb.bottom > b.bottom + 0.5)
            fit.push({ box: n.className, el: c.tagName + (c.id ? "#" + c.id : "." + c.className), over: [Math.round(b.left - cb.left), Math.round(cb.right - b.right), Math.round(b.top - cb.top), Math.round(cb.bottom - b.bottom)] });
        });
        if (n.scrollWidth > n.clientWidth + 1) fit.push({ box: n.className, scrollW: [n.scrollWidth, n.clientWidth] });
        if (clipToView && (b.left < -0.5 || b.right > innerWidth + 0.5)) fit.push({ box: n.className, offscreen: [b.left, b.right] });
      });
      // mobile: content stays inside the painted frame insets of the 9-slice (top 31 / right 18 / bottom 28 / left 40 css px, less 16 px slack for the frame's own glow band)
      if (mobile) document.querySelectorAll(".panel-body").forEach((n) => {
        const host = n.closest(".panel").getBoundingClientRect();
        const b = n.getBoundingClientRect();
        [...n.querySelectorAll("button, input, select, p, .stat")].filter(vis).forEach((c) => {
          const cb = c.getBoundingClientRect();
          if (cb.bottom > host.bottom - 12 || cb.left < host.left + 12 || cb.right > host.right - 10)
            fit.push({ glass: n.className, el: c.tagName + (c.id ? "#" + c.id : "." + c.className), rect: [Math.round(cb.left - host.left), Math.round(host.right - cb.right), Math.round(host.bottom - cb.bottom)] });
        });
      });
      // F3/F4: the full status stays inside the board (desktop, measured unrotated) and verdict text never overlaps
      const full = q(".sign-status.full");
      if (full && !mobile) {
        const keep = full.style.transform; full.style.transform = "none";
        const fb = full.getBoundingClientRect();
        full.querySelectorAll(".part").forEach((c) => { const cb = c.getBoundingClientRect();
          if (cb.left < fb.left - 0.5 || cb.right > fb.right + 0.5 || cb.top < fb.top - 0.5 || cb.bottom > fb.bottom + 0.5) fit.push({ box: "sign-status.full", el: c.textContent, over: [Math.round(fb.left - cb.left), Math.round(cb.right - fb.right), Math.round(fb.top - cb.top), Math.round(cb.bottom - fb.bottom)] }); });
        full.style.transform = keep;
      }
      document.querySelectorAll(".signing-row.is-readonly").forEach((row) => {
        const rb = row.getBoundingClientRect();
        row.querySelectorAll(".vr-name, .vr-meta").forEach((c) => { const cb = c.getBoundingClientRect(); if (cb.right > rb.right + 0.5) fit.push({ readonlyClip: c.textContent, by: Math.round(cb.right - rb.right) }); });
      });
      document.querySelectorAll(".verdict-row").forEach((row) => {
        const v = row.querySelector(".vr-verdict").getBoundingClientRect();
        row.querySelectorAll(".vr-name, .vr-meta").forEach((c) => { const cb = c.getBoundingClientRect(); if (cb.right > v.left - 2) fit.push({ verdictOverlap: c.textContent, by: Math.round(cb.right - v.left + 2) }); });
      });
      if (mobile) document.querySelectorAll(".verdict-body").forEach((n) => {
        const host = n.closest(".panel").getBoundingClientRect();
        [...n.querySelectorAll(".verdict-row, .guess-reveal, .verdict-empty")].filter(vis).forEach((c) => {
          const cb = c.getBoundingClientRect();
          if (cb.bottom > host.bottom - 12 || cb.left < host.left + 12 || cb.right > host.right - 10) fit.push({ glass: "verdict", el: c.className, rect: [Math.round(cb.left - host.left), Math.round(host.right - cb.right), Math.round(host.bottom - cb.bottom)] });
        });
      });
      res.checks.fit = fit;
      if (fit.length) res.fail.push("fit");

      // ---- text clipping inside controls
      const cv = document.createElement("canvas").getContext("2d");
      const clip = [];
      document.querySelectorAll(".guess-col input, .guess-col select, .btn-lock, .btn-end, .own-heading, .ghost").forEach((c) => {
        if (!vis(c)) return;
        const cs = getComputedStyle(c);
        cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        cv.letterSpacing = cs.letterSpacing;
        const t = c.tagName === "INPUT" ? c.placeholder : c.tagName === "SELECT" ? [...c.options].reduce((a, o) => (o.text.length > a.length ? o.text : a), "") : c.textContent;
        const avail = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const need = cv.measureText(t).width;
        if (need > avail + 0.5) clip.push({ el: c.id || c.className, t, need: Math.round(need), avail: Math.round(avail) });
      });
      document.querySelectorAll(".signing-row input, .btn-continue").forEach((c) => {
        if (!vis(c)) return;
        const cs = getComputedStyle(c);
        const avail = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (c.tagName === "INPUT") {
          const ps = getComputedStyle(c, "::placeholder");
          cv.font = `${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily}`; cv.letterSpacing = ps.letterSpacing === "normal" ? "0px" : ps.letterSpacing;
          if (cv.measureText(c.placeholder).width > avail + 0.5) clip.push({ el: c.id, t: c.placeholder, need: Math.round(cv.measureText(c.placeholder).width), avail: Math.round(avail) });
          if (c.value) { cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; cv.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
            if (cv.measureText(c.value).width > avail + 0.5) clip.push({ el: c.id, t: c.value, need: Math.round(cv.measureText(c.value).width), avail: Math.round(avail) }); }
        } else if (c.scrollWidth > c.clientWidth + 1 || c.scrollHeight > c.clientHeight + 1) clip.push({ el: c.id, t: c.textContent });
      });
      res.checks.textClip = clip;
      if (clip.length) res.fail.push("text clip");

      // ---- sizes
      const ctls = [...document.querySelectorAll("button, input, select")].filter(vis).map((c) => {
        const b = c.getBoundingClientRect();
        return { id: c.id, h: Math.round(b.height * 10) / 10, w: Math.round(b.width), font: parseFloat(getComputedStyle(c).fontSize), tag: c.tagName };
      });
      res.controls = ctls;
      res.minTarget = Math.min(...ctls.map((c) => Math.min(c.h, c.w)));
      const fields = ctls.filter((c) => c.tag !== "BUTTON");
      res.minFieldFont = fields.length ? Math.min(...fields.map((c) => c.font)) : null;
      const txt = [...document.querySelectorAll(".own-heading, .privacy-note, .rule-note, .sign-status, .rail li, .hud-title, .rival-name, .f1-brief, .stat-l, .lock-summary, .vr-name, .vr-meta, .vr-word, .vr-why, .guess-reveal span, .verdict-empty, .error-line")].filter(vis).map((n) => parseFloat(getComputedStyle(n).fontSize));
      res.minTextFont = Math.min(...txt);
      if (mobile) {
        if (res.minTarget < 44) res.fail.push("mobile target < 44");
        if (res.minFieldFont !== null && res.minFieldFont < 16) res.fail.push("mobile input font < 16");
      } else {
        const inPanel = ctls.filter((c) => c.tag !== "BUTTON" || /completeTransferChallenge|endTransferTimer/.test(c.id));
        res.minPanelControlH = Math.min(...inPanel.map((c) => c.h));
        if (res.minPanelControlH < 30.5) res.fail.push("desktop panel control < 31 (TWG-S6)");
      }

      // ---- privacy: the sealed rival surface is constant
      const sealed = q(".panel.sealed");
      const ids = [...document.querySelectorAll("[id]")].map((n) => n.id);
      res.checks.privacy = {
        signingIdPrefixes: [...new Set(ids.filter((i) => /^p\dSigning/.test(i)).map((i) => i.slice(0, 2)))],
        guessIdPrefixes: [...new Set(ids.filter((i) => /^p\dGuess/.test(i)).map((i) => i.slice(0, 2)))],
        interactiveFields: document.querySelectorAll("input:not([disabled]), select:not([disabled]), textarea").length,
        fields: document.querySelectorAll("input, select, textarea").length,
      };
      if (!sealed) {
        // F4: both sides revealed read-only; no private field exists and nothing is sealed
        if (res.checks.privacy.fields) res.fail.push("interactive private fields in verdicts");
        res.verdictSig = JSON.stringify(["transferResultsOne", "transferResultsTwo"].map((id) => q("#" + id + " h4").textContent + " | " + q("#" + id + " .verdict-body").textContent));
      } else {
      const sb = sealed.querySelector(".frost").getBoundingClientRect();
      const st = sealed.querySelector(".panel-title").getBoundingClientRect();
      Object.assign(res.checks.privacy, { sealedFocusable: sealed.querySelectorAll("input,select,button,textarea,a,[tabindex]").length, sealedText: sealed.textContent });
      if (res.checks.privacy.sealedFocusable) res.fail.push("sealed focusable");
      // only the viewer's own private inputs exist (Signing: Nik p2 / Daniel p1; Guess: Nik p1 / Daniel p2)
      const nikV = expect.heading === "NIK" || /Daniel's/.test(expect.heading || "");
      const phase = stage.dataset.phase;
      const wantSign = phase === "SIGNING_ENTRY" && !expect.__locked ? [nikV ? "p2" : "p1"] : [], wantGuess = phase === "GUESS_ENTRY" ? [nikV ? "p1" : "p2"] : [];
      if (JSON.stringify(res.checks.privacy.signingIdPrefixes) !== JSON.stringify(wantSign) || JSON.stringify(res.checks.privacy.guessIdPrefixes) !== JSON.stringify(wantGuess)) res.fail.push("rival or foreign private ids present");
      res.sealedSig = JSON.stringify({ html: sealed.innerHTML.replace(/--[xywh]: [\d.]+;?/g, ""), frost: [Math.round(sb.width), Math.round(sb.height)], title: [Math.round(st.width), Math.round(st.height)],
        glow: getComputedStyle(sealed.querySelector(".seal")).filter, anim: getComputedStyle(sealed.querySelector(".frost")).animationName });
      }

      // ---- sign: timer/closed line and status never collide (measured unrotated, desktop only)
      if (!mobile) {
        const sg = q(".sign-screen"), stt = q("#transferPhaseStatus");
        const keep = [sg.style.transform, stt.style.transform];
        sg.style.transform = stt.style.transform = "none";
        const mainB = q("#transferTimerDisplay").getBoundingClientRect();
        const partTops = [...stt.querySelectorAll(".part")].map((n) => n.getBoundingClientRect().top);
        sg.style.transform = keep[0]; stt.style.transform = keep[1];
        res.checks.signGap = Math.round((Math.min(...partTops) - mainB.bottom) * 10) / 10;
        if (res.checks.signGap < 0) res.fail.push("sign lines collide");
      }
      // ---- rotation: sign rotated (read-only only); interactive text never rotated
      const ang = (n) => { const m = getComputedStyle(n).transform; if (!m || m === "none") return 0; const v = m.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number); return Math.round(Math.atan2(v[1], v[0]) * 1800 / Math.PI) / 10; };
      res.checks.rotation = { sign: ang(q(".sign-screen")), status: ang(q("#transferPhaseStatus")), controls: [...document.querySelectorAll("button, input, select, .panel-body, .panel-title")].map(ang).filter((a) => a !== 0) };
      if (Math.abs(res.checks.rotation.sign - 7.5) > 0.05) res.fail.push("sign not rotated to board");
      if (res.checks.rotation.controls.length) res.fail.push("rotated interactive text");

      // ---- staging: live UI never covers faces or the fingertip contact
      const kk = res.k, plane = q(".plane").getBoundingClientRect();
      const covers = [];
      Object.entries(STAGING).forEach(([key, r]) => {
        const box = { l: plane.left + r[0] * kk, t: plane.top + r[1] * kk, r: plane.left + r[2] * kk, b: plane.top + r[3] * kk };
        document.querySelectorAll(".sign-screen .sign-main, .sign-status > *, .panel-title > *, .panel-body > *, .rules-inner > *, .you-chip, .frost, .hud-footer").forEach((n) => {
          if (!vis(n)) return;
          if (key === "nikFingertip" && mobile) return; // phone: the crop ends above the panels, fingertip is masked out by design
          if (key === "nikFingertip" && !mobile && n.closest(".panel[data-panel='A']")) return; // desktop: the finger rests on panel A by design and is layered above it
          const c = n.getBoundingClientRect();
          if (c.left < box.r && c.right > box.l && c.top < box.b && c.bottom > box.t) covers.push({ staging: key, el: n.className || n.tagName });
        });
      });
      res.checks.stagingCovered = covers;
      if (covers.length) res.fail.push("staging covered");

      // ---- layout
      const foot = q(".hud-footer").getBoundingClientRect();
      if (mobile) {
        const sc = stage;
        const scene = q(".scene").getBoundingClientRect(), band = q(".sign-status").getBoundingClientRect();
        const act = q("#completeTransferChallenge") || q("#endTransferTimer") || q("#continueFromTransfers") || q(".panel.own .signing-row:last-child");
        const ab = act.getBoundingClientRect();
        const kk2 = res.k, pl = q(".plane").getBoundingClientRect();
        const inScene = (r) => pl.left + r[0] * kk2 >= scene.left - 0.5 && pl.left + r[2] * kk2 <= scene.right + 0.5 && pl.top + r[1] * kk2 >= scene.top - 0.5 && pl.top + r[3] * kk2 <= band.top + 0.5;
        const sg = q(".sign-screen").getBoundingClientRect();
        res.checks.layout = {
          footerFixedBottom: Math.round(foot.bottom) === innerHeight, footerH: Math.round(foot.height),
          noScroll: sc.scrollHeight <= sc.clientHeight + 1, scrollExcess: sc.scrollHeight - sc.clientHeight,
          pageScroll: document.documentElement.scrollHeight > innerHeight,
          primaryVisible: ab.top >= 0 && ab.bottom <= foot.top + 0.5,
          sceneH: Math.round(band.top - scene.top), sceneCrop: stage.dataset.sceneCrop,
          facesInScene: inScene(STAGING.danielFace) && inScene(STAGING.nikFace),
          signInScene: sg.top >= scene.top - 0.5 && sg.bottom <= band.top + 0.5,
          fingertipInScene: inScene(STAGING.nikFingertip),
          managersWhole: (() => { const c = (stage.dataset.sceneCrop || '').split(',').map(Number); return c[0] <= 330.5 && c[2] >= 1389.5; })(),
          paintedPanelsHidden: (() => { const c = (stage.dataset.sceneCrop || '').split(',').map(Number); return c[3] <= 528.5; })(),
        };
        const home = q("#backToShowdownHome").getBoundingClientRect(), refresh = q("#refreshSharedTransferChallenge").getBoundingClientRect();
        const midKids = [...q(".hud-mid").querySelectorAll(".hud-title, .rail li")].filter(vis).map((b) => b.getBoundingClientRect());
        res.checks.layout.hudNoOverlap = midKids.every((b) => b.left >= home.right + 2 && b.right <= refresh.left - 2);
        const L = res.checks.layout;
        if (!L.footerFixedBottom || L.pageScroll || !L.primaryVisible || !L.hudNoOverlap || !L.facesInScene || !L.signInScene || !L.managersWhole || !L.paintedPanelsHidden || (!L.noScroll && !expect.__tight)) res.fail.push("mobile layout");
      } else {
        const panels = [...document.querySelectorAll(".panel-body, .frost, .rules-inner")].map((n) => n.getBoundingClientRect().bottom);
        const sign = q(".sign-screen").getBoundingClientRect();
        res.checks.layout = {
          footerTop: Math.round(foot.top), panelBottomMax: Math.round(Math.max(...panels)),
          footerClearsPanels: foot.top >= Math.max(...panels) - 0.5,
          signInView: sign.top >= 0 && sign.bottom <= innerHeight,
          noPageScroll: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
          footerClip: q(".hud-footer").scrollWidth > q(".hud-footer").clientWidth + 1,
        };
        const L = res.checks.layout;
        if (!L.footerClearsPanels || !L.signInView || !L.noPageScroll || L.footerClip) res.fail.push("desktop layout");
      }
      return res;
    }, { STAGING, expect: fx.frames[s.frame].plateOnly ? {} : Object.assign(stringsFor(s.frame), s.tight ? { __tight: true } : {}) });

    // ---- tab order + visible focus
    const tabs = [];
    let focusVisibleAll = true;
    await page.focus("body");
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        const cs = getComputedStyle(a);
        return { id: a.id || a.tagName, outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
      });
      if (!f) break;
      if (tabs.length && f.id === tabs[0]) break;
      tabs.push(f.id);
      if (!f.outline) focusVisibleAll = false;
    }
    r.tabOrder = tabs;
    r.tabOrderExpected = expectedTabOrder(s.frame);
    r.tabOrderMatches = JSON.stringify(tabs) === JSON.stringify(r.tabOrderExpected);
    if (!r.tabOrderMatches) r.fail.push("tab order");
    r.focusVisibleAll = focusVisibleAll;
    if (r.strings && !focusVisibleAll) r.fail.push("focus not visible");

    // ---- interactions (once per frame family, base size)
    const phase = fx.frames[s.frame].phase;
    const baseSize = (!s.mobile && s.vw === 1366 && s.vh === 768 && s.dpr === 1 && !s.grid) || (s.mobile && s.vw === 390 && s.vh === 664);
    if (phase === "WINDOW_OPEN" && baseSize && !fx.frames[s.frame].endRequested) {
      const sealedBefore = await page.evaluate(() => document.querySelector(".panel.sealed").innerHTML);
      await page.evaluate(() => { window.__intents = []; document.addEventListener("transfer:intent", (e) => window.__intents.push(e.detail)); });
      await page.click("#endTransferTimer");
      const after = await page.evaluate(() => { const b = document.getElementById("endTransferTimer"); return { text: b.textContent, disabled: b.disabled, intents: window.__intents, sealed: document.querySelector(".panel.sealed").innerHTML }; });
      await page.screenshot({ path: path.join(out, `${s.mobile ? "M_" : ""}${s.frame}_${s.vw}x${s.vh}_after_end_early.jpg`), type: "jpeg", quality: 86 });
      r.interaction = { endEarly: { intents: after.intents, requestedText: after.text, disabled: after.disabled, sealedUnchanged: after.sealed === sealedBefore } };
      if (after.intents.length !== 1 || after.intents[0].action !== "requestEndWindow" || !after.disabled || after.sealed !== sealedBefore) r.fail.push("end early wiring");
    }
    if (phase === "GUESS_ENTRY" && baseSize) {
      const prefix = fx.frames[s.frame].viewer === "playerTwo" ? "p1" : "p2";
      const sealedBefore = await page.evaluate(() => document.querySelector(".panel.sealed").innerHTML);
      const before = await page.evaluate((p) => document.getElementById(p + "Guess1Value").disabled, prefix);
      await page.selectOption(`#${prefix}Guess1Type`, "league");
      const afterSel = await page.evaluate((p) => { const i = document.getElementById(p + "Guess1Value"); return { disabled: i.disabled, ph: i.placeholder }; }, prefix);
      await page.fill(`#${prefix}Guess1Value`, "Premier League");
      await page.selectOption(`#${prefix}Guess2Type`, "nationality");
      await page.fill(`#${prefix}Guess2Value`, "Netherlands");
      await page.screenshot({ path: path.join(out, `${s.mobile ? "M_" : ""}${s.frame}_${s.vw}x${s.vh}_filled.jpg`), type: "jpeg", quality: 86 });
      const sealedAfter = await page.evaluate(() => document.querySelector(".panel.sealed").innerHTML);
      await page.selectOption(`#${prefix}Guess1Type`, "");
      const reset = await page.evaluate((p) => { const i = document.getElementById(p + "Guess1Value"); return { disabled: i.disabled, v: i.value, ph: i.placeholder }; }, prefix);
      r.interaction = { beforeDisabled: before, afterSelect: afterSel, reset, sealedUnchangedByInput: sealedAfter === sealedBefore };
      if (!before || afterSel.disabled || !reset.disabled || reset.v !== "" || sealedAfter !== sealedBefore) r.fail.push("guess interaction");
    }
    // ---- F3: LOCK MY SIGNINGS validates like production, then emits one lockSignings intent
    if (phase === "SIGNING_ENTRY" && baseSize && !fx.frames[s.frame].signingsLocked) {
      const pre = fx.frames[s.frame].viewer === "playerTwo" ? "p2" : "p1";
      const own = fx.inputs[fx.frames[s.frame].viewer].signings;
      const sealedBefore = await page.evaluate(() => document.querySelector(".panel.sealed").innerHTML);
      await page.evaluate(() => { window.__intents = []; document.addEventListener("transfer:intent", (e) => window.__intents.push(e.detail)); });
      for (const f of ["Name", "League", "Nationality"]) await page.fill(`#${pre}Signing1${f}`, own[0][f === "Name" ? "name" : f.toLowerCase()]);
      await page.fill(`#${pre}Signing2Name`, own[1].name);
      await page.click("#completeTransferChallenge");
      const invalid = await page.evaluate(() => ({ err: document.getElementById("transferChallengeError").textContent, intents: window.__intents.length }));
      await page.screenshot({ path: path.join(out, `${s.mobile ? "M_" : ""}${s.frame}_${s.vw}x${s.vh}_invalid.jpg`), type: "jpeg", quality: 86 });
      const errFits = await page.evaluate(() => { const e = document.getElementById("transferChallengeError"), b = e.closest(".panel-body").getBoundingClientRect(), r = e.getBoundingClientRect(), st = document.getElementById("stage-root"); return r.bottom <= b.bottom && r.top >= b.top && st.scrollHeight <= st.clientHeight + 1; });
      for (const i of [2, 3]) for (const f of ["Name", "League", "Nationality"]) await page.fill(`#${pre}Signing${i}${f}`, own[i - 1][f === "Name" ? "name" : f.toLowerCase()]);
      await page.screenshot({ path: path.join(out, `${s.mobile ? "M_" : ""}${s.frame}_${s.vw}x${s.vh}_filled.jpg`), type: "jpeg", quality: 86 });
      const clipFilled = await page.evaluate(() => { const cv = document.createElement("canvas").getContext("2d"); return [...document.querySelectorAll(".signing-row input")].filter((c) => { const cs = getComputedStyle(c); cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; cv.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing; return cv.measureText(c.value).width > c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.5; }).map((c) => c.id + "=" + c.value); });
      await page.click("#completeTransferChallenge");
      const ok = await page.evaluate(() => ({ err: document.getElementById("transferChallengeError").textContent, intents: window.__intents, sealed: document.querySelector(".panel.sealed").innerHTML }));
      r.interaction = { invalid, errFitsNoScroll: errFits, filledValuesClipped: clipFilled, valid: { err: ok.err, intents: ok.intents }, sealedUnchangedByInput: ok.sealed === sealedBefore };
      if (invalid.err !== S.signingInvalid.replace("{n}", "2") || invalid.intents !== 0 || ok.err !== "" || ok.intents.length !== 1 || ok.intents[0].action !== "lockSignings" || ok.sealed !== sealedBefore || !errFits) r.fail.push("signing interaction");
      r.filledValuesClipped = clipFilled; // recorded; entry fields scroll natively, so this is informational
    }
    // ---- live clock ticks when not frozen (read-only sign; production owns the value)
    if (phase === "WINDOW_OPEN" && baseSize && !s.mobile && s.frame === "F1") {
      const p2 = await ctx.newPage();
      await p2.goto(`${base}index.html?frame=F1`);
      await p2.waitForFunction(() => window.__plateReady === true);
      const t1 = await p2.textContent("#transferTimerDisplay");
      await p2.waitForTimeout(1300);
      const t2 = await p2.textContent("#transferTimerDisplay");
      const role = await p2.getAttribute("#transferTimerDisplay", "role");
      r.clock = { t1, t2, ticks: t1 !== t2, role };
      if (t1 === t2 || role !== "timer") r.fail.push("clock");
      await p2.close();
    }
    if (r.sealedSig) {
      const key = `${s.mobile ? "m" : "d"}_${s.vw}x${s.vh}_${fx.frames[s.frame].viewer}`;
      (sealedSig[key] = sealedSig[key] || {})[s.frame] = r.sealedSig;
      r.sealedSigKey = key;
    }
    delete r.sealedSig;
    if (r.verdictSig) {
      const key = `${s.mobile ? "m" : "d"}_${s.vw}x${s.vh}_${fx.frames[s.frame].result}`;
      (verdictSig[key] = verdictSig[key] || {})[fx.frames[s.frame].viewer] = r.verdictSig;
      delete r.verdictSig;
    }
    r.errors = errors;
    if (errors.length) r.fail.push("page errors");
    if (r.fail.length) failures++;
    report.results.push({ shot: name, ...s, ...r });
    await ctx.close();
  }
  // Rival surface identical across phases/states for the same viewer + viewport (TWG-S10), and markup identical across viewers.
  const constancy = {};
  Object.entries(sealedSig).forEach(([k, byFrame]) => { const vals = Object.values(byFrame); constancy[k] = { frames: Object.keys(byFrame), identical: vals.every((v) => v === vals[0]) }; });
  report.sealedConstancy = constancy;
  const htmlOnly = (sig) => JSON.parse(sig).html.replace(/DANIEL|NIK|Daniel|Nik/g, "RIVAL");
  const allHtml = [...new Set(Object.values(sealedSig).flatMap((o) => Object.values(o)).map(htmlOnly))];
  report.sealedMarkupIdenticalAcrossViewersAndPhases = allHtml.length === 1;
  const constancyFail = Object.values(constancy).some((c) => !c.identical) || allHtml.length !== 1;
  // F4: both viewers see the same verdict authority (same text in both result cards) at the same viewport
  const shared = {};
  Object.entries(verdictSig).forEach(([k, byViewer]) => { const v = Object.values(byViewer); shared[k] = { viewers: Object.keys(byViewer), identical: v.every((x) => x === v[0]) }; });
  report.verdictAuthorityShared = shared;
  const sharedFail = Object.values(shared).some((c) => !c.identical) || !Object.values(shared).some((c) => c.viewers.length === 2);
  report.summary = { shots: shots.length, shotsWithFailures: failures, sealedConstancyFail: constancyFail, verdictAuthorityFail: sharedFail };
  fs.writeFileSync(path.join(out, "qa_report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report.summary));
  report.results.filter((x) => x.fail && x.fail.length).forEach((x) => console.log("FAIL", x.shot, x.fail.join(", ")));
})().catch((e) => { console.error(e); process.exit(1); });
