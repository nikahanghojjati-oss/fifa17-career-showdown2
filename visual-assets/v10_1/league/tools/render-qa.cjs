// LEAGUE-V1 render + QA harness (gates G1-G13 of CLOUD_BRIEF_LEAGUE_V1_R3). Adapted from
// tr2/slice-02-plate/tools/render-qa.cjs (same Playwright pattern, brightest-pixel contrast method).
// Serve the repo root: python3 -m http.server 8765   (C4)
// Usage: NODE_PATH=$(npm root -g) node tools/render-qa.cjs [baseUrl] [outDir]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const base = process.argv[2] || "http://127.0.0.1:8765/visual-assets/v10_1/league/";
const out = process.argv[3] || path.join(ROOT, "evidence");
fs.mkdirSync(out, { recursive: true });
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures.json"), "utf8"));
const map = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/platemap.json"), "utf8"));
const intake = fs.readFileSync(path.join(ROOT, "assets/intake_report.md"), "utf8");

const FRAMES = ["L1", "L2", "L3", "L4"];
const VIEWS = [
  { vw: 1366, vh: 768, dpr: 1 }, { vw: 1440, vh: 900, dpr: 1 }, { vw: 1920, vh: 1080, dpr: 1 }, { vw: 1366, vh: 640, dpr: 1 },
  { vw: 1366, vh: 768, dpr: 2 },
  { vw: 360, vh: 640, dpr: 2, phone: true }, { vw: 375, vh: 553, dpr: 2, phone: true, scrollAllowed: true }, { vw: 390, vh: 844, dpr: 2, phone: true }, { vw: 430, vh: 932, dpr: 2, phone: true },
  // Nik's iPhone in Safari (visible area 393x660, DPR 3): no page scroll, Spin visible
  { vw: 393, vh: 660, dpr: 3, phone: true },
];
const shots = [];
for (const f of FRAMES) for (const v of VIEWS) shots.push(Object.assign({ frame: f }, v));
shots.push({ frame: "L1", vw: 1366, vh: 768, dpr: 1, grid: true });
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
if (ONLY) shots.splice(0, shots.length, ...shots.filter((s) => ONLY.test(`${s.frame}_${s.vw}x${s.vh}@${s.dpr}`)));

function expectedStrings(frame, phone) {
  const f = fx.frames[frame], c = fx.chrome;
  const want = [c.identityBadge, c.seasonIndicator, c.title, ...fx.leagues.map((l) => l.name), f.selectedLeague, f.spin, c.back];
  if (!phone) want.push(c.brandTitle, c.brandSub, ...c.footer);
  if (f.note) want.push(f.note);
  return want;
}
const d = fx.decorative;
const DECOR = [d.kicker, d.badge, d.script, d.footerTag, ...d.sloganLeft, ...d.sloganRight];

(async () => {
  const browser = await chromium.launch();
  const report = { base, when: new Date().toISOString(), viewports: VIEWS, results: [] };
  let failures = 0;
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: s.dpr, isMobile: !!s.phone, hasTouch: !!s.phone });
    const page = await ctx.newPage();
    const errors = [], failed = [], loaded = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("requestfailed", (r) => failed.push(r.url()));
    page.on("response", (r) => { loaded.push(r.url()); if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}index.html?frame=${s.frame}${s.grid ? "&grid=1" : ""}`);
    await page.waitForFunction(() => window.__leagueReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(250);
    const name = `${s.frame}_${s.vw}x${s.vh}${s.dpr > 1 && !s.phone ? "@2x" : ""}${s.grid ? "_grid" : ""}.jpg`;
    await page.screenshot({ path: path.join(out, name), type: "jpeg", quality: 88 });
    if (s.scrollAllowed) await page.screenshot({ path: path.join(out, name.replace(".jpg", "_fullpage.jpg")), type: "jpeg", quality: 88, fullPage: true });

    const r = await page.evaluate(({ want, decor, phone, scrollAllowed }) => {
      const q = (x) => document.querySelector(x);
      const stage = q("#stage-root");
      const vis = (n) => { for (let e = n; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0 || /rect\(0px,? 0px,? 0px,? 0px\)/.test(cs.clip)) return false; if (e.classList.contains("vh")) return false; } const b = n.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const res = { mode: stage.dataset.mode, data: Object.assign({}, stage.dataset), fail: [] };
      // G1 visible text nodes
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const got = []; let tn;
      while ((tn = walker.nextNode())) { const t = tn.textContent.trim(); if (!t || tn.parentElement.closest("script,style,svg")) continue; const rg = document.createRange(); rg.selectNodeContents(tn); const b = rg.getBoundingClientRect(); if (b.width < 1 || b.height < 1 || !vis(tn.parentElement)) continue; if (b.right < 0 || b.bottom < 0 || b.left > innerWidth || b.top > Math.max(innerHeight, document.documentElement.scrollHeight)) continue; got.push(t); }
      const missing = want.filter((w) => !got.includes(w));
      const extra = got.filter((g) => !want.includes(g) && !decor.includes(g));
      res.G1 = { visible: got, missing, extra };
      if (missing.length || extra.length) res.fail.push("G1");
      // G2 ids, roles, aria, DOM shape
      const ids = ["topHeader", "onlinePlayerIdentityBadge", "seasonIndicator", "leagueWheelScreen", "leagueWheel", "selectedLeague", "leagueStateNote", "spinLeague"];
      const counts = Object.fromEntries(ids.map((i) => [i, document.querySelectorAll("#" + i).length]));
      const sl = q("#selectedLeague"), ln = q("#leagueStateNote");
      const shape = {
        h2: q("#leagueWheelScreen h2") && q("#leagueWheelScreen h2").textContent === "SELECT LEAGUE",
        pointer: !!q(".wheelContainer > .wheelPointer"),
        wheel: !!q(".wheelContainer > #leagueWheel.leagueWheel > .wheelTrack"),
        items: [...document.querySelectorAll("#leagueWheel > .wheelTrack > .wheelItem")].map((n) => n.textContent),
        back: document.querySelectorAll(".backButton[data-smart-back]").length,
        selectedLeagueAria: [sl.getAttribute("role"), sl.getAttribute("aria-live"), sl.getAttribute("aria-atomic")],
        noteAria: [ln.getAttribute("role"), ln.getAttribute("aria-live")],
        trackTransform: q(".wheelTrack").style.transform,
      };
      res.G2 = { counts, shape };
      if (Object.values(counts).some((c) => c !== 1) || !shape.h2 || !shape.pointer || !shape.wheel || shape.back !== 1 || shape.items.join("|") !== "Premier League|LaLiga|Bundesliga|Serie A|Ligue 1"
        || shape.selectedLeagueAria.join() !== "status,polite,true" || shape.noteAria.join() !== "status,polite") res.fail.push("G2");
      // G3 no scroll
      const de = document.documentElement, bd = document.body;
      res.G3 = { html: [de.scrollWidth, de.scrollHeight], body: [bd.scrollWidth, bd.scrollHeight], vp: [innerWidth, innerHeight] };
      const vScroll = de.scrollHeight > innerHeight + 1 || bd.scrollHeight > innerHeight + 1, hScroll = de.scrollWidth > innerWidth + 1 || bd.scrollWidth > innerWidth + 1;
      // 375x553: vertical page scroll allowed (decision LEAGUE-M2: only the primary action must be in the first view)
      res.G3.verticalScroll = vScroll; res.G3.scrollAllowed = scrollAllowed;
      if (hScroll || (vScroll && !scrollAllowed)) res.fail.push("G3");
      // G4 primary action
      const sp = q("#spinLeague"), sb = sp.getBoundingClientRect();
      const hit = document.elementFromPoint(sb.left + sb.width / 2, sb.top + sb.height / 2);
      res.G4 = { rect: [sb.left, sb.top, sb.right, sb.bottom].map(Math.round), inView: sb.left >= 0 && sb.top >= 0 && sb.right <= innerWidth && sb.bottom <= innerHeight, hit: hit === sp || sp.contains(hit) };
      if (!res.G4.inView || !res.G4.hit) res.fail.push("G4");
      // G5 clipping
      const textEls = [...document.querySelectorAll("#topHeader *, footer *, #leagueWheelScreen *, .slogan *, .slogan")].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && vis(n));
      const clip = [];
      textEls.forEach((n) => { const cs = getComputedStyle(n); if (cs.display === "inline") return; if (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1 || cs.textOverflow === "ellipsis") clip.push({ el: n.id || n.className || n.tagName, t: n.textContent.slice(0, 40), sw: [n.scrollWidth, n.clientWidth], sh: [n.scrollHeight, n.clientHeight] }); });
      // wheel labels: glyph run must stay inside its item box (pre-transform widths)
      document.querySelectorAll(".wheelItem").forEach((n) => { const rg = document.createRange(); rg.selectNodeContents(n.firstChild); const w = [...rg.getClientRects()].length; if (n.scrollWidth > n.offsetWidth + 1) clip.push({ el: "wheelItem", t: n.textContent, sw: [n.scrollWidth, n.offsetWidth], lines: w }); });
      res.G5 = { clipped: clip };
      if (clip.length) res.fail.push("G5");
      // G6 sizes
      const ctl = [...document.querySelectorAll("button")].filter(vis).map((n) => { const b = n.getBoundingClientRect(); return { id: n.id || n.className, w: Math.round(b.width), h: Math.round(b.height * 10) / 10 }; });
      const fonts = textEls.map((n) => ({ el: n.id || n.className || n.tagName, px: parseFloat(getComputedStyle(n).fontSize) }));
      const minFont = Math.min(...fonts.map((f) => f.px));
      const noteFont = vis(ln) ? parseFloat(getComputedStyle(ln).fontSize) : null;
      res.G6 = { controls: ctl, minFont, minFontEl: fonts.find((f) => f.px === minFont), noteFont };
      if (phone ? ctl.some((c) => c.w < 44 || c.h < 44) || (noteFont !== null && noteFont < 14) : ctl.some((c) => c.h < 40)) res.fail.push("G6");
      if (minFont < 12) res.fail.push("G6");
      // G8 geometry (plate-registered): protected boxes through plateToScreen, clipped to the visible scene
      const L = window.LeagueV1, sc = q(".scene").getBoundingClientRect();
      const pr = (r) => { const a = L.plateToScreen(r[0], r[1]), b = L.plateToScreen(r[2], r[3]); return { l: a.x, t: a.y, r: b.x, b: b.y }; };
      const vbox = (b) => ({ l: Math.max(b.l, sc.left), t: Math.max(b.t, sc.top), r: Math.min(b.r, sc.right), b: Math.min(b.b, sc.bottom) });
      const uiSel = "#topHeader, footer, .title-block > *, .subtitle-row, #leagueStateNote, .button-row button, .slogan, .wheelItem";
      const runBox = (n) => { const rg = document.createRange(); rg.selectNodeContents(n); return rg.getBoundingClientRect(); };
      const ui = [...document.querySelectorAll(uiSel)].filter(vis).map((n) => { const b = /^(H2|DIV)$/.test(n.tagName) && !n.matches("#topHeader, .subtitle-row, #leagueStateNote, .slogan") ? runBox(n) : n.getBoundingClientRect(); return { el: n.id || n.className.split(" ")[0] || n.tagName, l: b.left, t: b.top, r: b.right, b: b.bottom }; });
      const gap = (a, b) => { const dx = Math.max(b.l - a.r, a.l - b.r, 0), dy = Math.max(b.t - a.b, a.t - b.b, 0); const inter = !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t); return inter ? -1 : Math.max(dx, dy) === 0 ? 0 : Math.hypot(dx, dy) && Math.max(dx, dy); };
      const g8 = {};
      for (const [k, r] of Object.entries(window.LEAGUE_MAP_FOR_QA.protected_boxes)) {
        const b = vbox(pr(r));
        if (b.r <= b.l || b.b <= b.t) { g8[k] = { outOfFrame: true }; continue; }
        let min = Infinity, who = null;
        ui.forEach((u) => { const g = gap(b, u); if (g < min) { min = g; who = u.el; } });
        g8[k] = { minClearPx: Math.round(min * 10) / 10, nearest: who, box: [b.l, b.t, b.r, b.b].map(Math.round) };
        if (min < 8) res.fail.push("G8:" + k);
      }
      // fingertip overlay registration (desktop, plate-registered) in CSS px and in device px
      const fo = q(".finger-ovl"), kr = window.LeagueV1.OVL_RECT;
      if (vis(fo)) {
        const b = fo.getBoundingClientRect(), e = pr(kr), d = devicePixelRatio;
        const css = Math.max(Math.abs(b.left - e.l), Math.abs(b.top - e.t), Math.abs(b.right - e.r), Math.abs(b.bottom - e.b));
        const dev = Math.max(...[[b.left, e.l], [b.top, e.t], [b.right, e.r], [b.bottom, e.b]].map(([x, y]) => Math.abs(Math.round(x * d) - Math.round(y * d))));
        g8.fingerOverlay = { shown: true, rect: kr, regErrCssPx: Math.round(css * 1e4) / 1e4, regErrDevicePx: dev, note: "edges compared on the device-pixel grid; CSS-px residue is Chromium LayoutUnit (1/64 px) rounding of top and height" };
        if (dev > 0) res.fail.push("G8:overlay-registration");
      }
      else g8.fingerOverlay = { shown: false };
      res.G8 = g8;
      // G9 imagery: every image + CSS background URL
      const urls = new Set();
      document.querySelectorAll("*").forEach((n) => { for (const pe of [null, "::before", "::after"]) { const cs = getComputedStyle(n, pe); for (const prop of ["backgroundImage", "maskImage", "webkitMaskImage"]) { const v = cs[prop]; if (v && v !== "none") [...v.matchAll(/url\("([^"]*)"\)/g)].forEach((m) => urls.add(m[1].startsWith("data:") ? m[1].slice(0, 26) : m[1])); } } });
      document.querySelectorAll("img").forEach((i) => urls.add(i.currentSrc));
      res.G9 = { urls: [...urls] };
      // G10 sides
      const fd = pr(window.LEAGUE_MAP_FOR_QA.protected_boxes.face_daniel), fn = pr(window.LEAGUE_MAP_FOR_QA.protected_boxes.face_nik);
      const hd = pr(window.LEAGUE_MAP_FOR_QA.protected_boxes.hand_daniel), hn = pr(window.LEAGUE_MAP_FOR_QA.protected_boxes.hand_nik);
      res.G10 = { faces: [(fd.l + fd.r) / 2, (fn.l + fn.r) / 2].map(Math.round), hands: [(hd.l + hd.r) / 2, (hn.l + hn.r) / 2].map(Math.round) };
      if (!(res.G10.faces[0] < res.G10.faces[1] && res.G10.hands[0] < res.G10.hands[1])) res.fail.push("G10");
      // G11 focusable order (enabled + visible), compared with visual reading order
      const foc = [...document.querySelectorAll("button, a[href], input, select, [tabindex]")].filter((n) => !n.disabled && vis(n) && n.tabIndex >= 0);
      const visual = [...foc].sort((a, b) => { const A = a.getBoundingClientRect(), B = b.getBoundingClientRect(); return Math.abs(A.top - B.top) > 8 ? A.top - B.top : A.left - B.left; });
      res.G11 = { dom: foc.map((n) => n.id || n.className), visual: visual.map((n) => n.id || n.className) };
      // G13 chrome snapshot
      const hb = q("#topHeader").getBoundingClientRect(), hcs = getComputedStyle(q("#topHeader"));
      const ft = q("footer"), fcs = getComputedStyle(ft), fb = ft.getBoundingClientRect();
      const bx = (sel) => { const n = q(sel); if (!n || !vis(n)) return null; const b = n.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10); };
      res.G13 = { header: { h: hb.height, bg: hcs.backgroundImage, border: hcs.borderBottom, badge: bx(".cm-badge"), badgeFont: getComputedStyle(q(".cm-badge span")).font, brand: bx(".brand"), identity: bx("#onlinePlayerIdentityBadge"), season: bx("#seasonIndicator"), controlFont: getComputedStyle(q("#seasonIndicator")).font },
        footer: fcs.display === "none" ? null : { h: fb.height, font: fcs.font, color: fcs.color, bg: fcs.backgroundImage } };
      // rotated wheel label: screen quad of its text line (probes at the local text-box corners)
      const quadOf = (n) => {
        const cs = getComputedStyle(n), cv = document.createElement("canvas").getContext("2d");
        cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; cv.letterSpacing = cs.letterSpacing;
        const words = n.textContent.toUpperCase();
        const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.05;
        const w = n.offsetWidth, h = n.offsetHeight - parseFloat(cs.paddingBottom);
        const lr = document.createRange(); lr.selectNodeContents(n.firstChild);
        const one = cv.measureText(words).width, wrapped = lr.getClientRects().length > 1;
        const tw = wrapped ? Math.max(...words.split(" ").map((x) => cv.measureText(x).width)) : Math.min(w, one);
        const textH = wrapped ? 2 * lineH : lineH;
        const pts = [[(w - tw) / 2, h - textH], [(w + tw) / 2, h - textH], [(w + tw) / 2, h], [(w - tw) / 2, h]];
        return pts.map(([x, y]) => { const p = document.createElement("i"); p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`; n.appendChild(p); const b = p.getBoundingClientRect(); p.remove(); return [b.left, b.top]; });
      };
      // G7 inputs: text nodes to measure (rect of the glyph run) + text colour
      const g7 = [];
      textEls.forEach((n, i) => { const tnode = [...n.childNodes].find((c) => c.nodeType === 3 && c.textContent.trim()); if (!tnode) return; const rg = document.createRange(); rg.selectNodeContents(tnode); const b0 = rg.getBoundingClientRect(); if (b0.width < 1) return; const cs = getComputedStyle(n);
        // glyph box = line box minus half-leading (line-height above 1 adds empty space that can sit over neighbours)
        const lead = Math.max(0, (parseFloat(cs.lineHeight) - parseFloat(cs.fontSize)) / 2) || 0; const b = { left: b0.left, right: b0.right, top: b0.top + lead, bottom: b0.bottom - lead }; const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700); g7.push({ el: n.id || n.className.split(" ")[0] || n.tagName, t: tnode.textContent.trim().slice(0, 28), rect: [b.left, b.top, b.right, b.bottom], color: n.matches("#leagueWheelScreen h2") ? "rgb(242, 196, 91)" : cs.color, large: big, quad: n.classList.contains("wheelItem") ? quadOf(n) : null }); });
      res.__g7 = g7;
      return res;
    }, { want: expectedStrings(s.frame, !!s.phone), decor: DECOR, phone: !!s.phone, scrollAllowed: !!s.scrollAllowed }).catch((e) => ({ fail: ["eval " + e] }));

    // G7 contrast: hide all text, screenshot, then brightest (light text) / darkest (dark text) pixel under each glyph run
    await page.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important} #leagueWheelScreen h2{background:none!important;filter:none!important}" });
    await page.waitForTimeout(80);
    const png = (await page.screenshot({ type: "png", fullPage: true })).toString("base64");   // page coords = rects at scroll 0
    r.G7 = await page.evaluate(async ({ png, items, dpr }) => {
      const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; const c2 = cv.getContext("2d"); c2.drawImage(img, 0, 0);
      const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const parse = (s) => s.match(/[\d.]+/g).map(Number);
      return items.map((it) => {
        const [r, g, b] = parse(it.color); const lt = lum(r, g, b), light = lt > 0.18;
        if (it.quad) { const xs = it.quad.map((p) => p[0]), ys = it.quad.map((p) => p[1]); it.rect = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
        const x0 = Math.max(0, Math.floor(it.rect[0] * dpr)), y0 = Math.max(0, Math.floor(it.rect[1] * dpr)), x1 = Math.min(cv.width, Math.ceil(it.rect[2] * dpr)), y1 = Math.min(cv.height, Math.ceil(it.rect[3] * dpr));
        if (x1 <= x0 || y1 <= y0) return Object.assign({}, it, { ratio: null });
        const d = c2.getImageData(x0, y0, x1 - x0, y1 - y0).data; let ext = light ? 0 : 1;
        const inQuad = (px, py) => { if (!it.quad) return true; const Q = it.quad.map(([a, b]) => [a * dpr, b * dpr]); let s = 0; for (let k = 0; k < 4; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % 4]; const c = (bx - ax) * (py - ay) - (by - ay) * (px - ax); if (c !== 0) { if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; } } return true; };
        for (let i = 0; i < d.length; i += 4) { const pxl = (i / 4) % (x1 - x0) + x0, pyl = Math.floor(i / 4 / (x1 - x0)) + y0; if (!inQuad(pxl + .5, pyl + .5)) continue; const l = lum(d[i], d[i + 1], d[i + 2]); ext = light ? Math.max(ext, l) : Math.min(ext, l); }
        const ratio = (Math.max(lt, ext) + 0.05) / (Math.min(lt, ext) + 0.05);
        const need = it.el === "wheelItem" ? 4.5 : it.large ? 3 : 4.5;   // every league label must reach 4.5:1 (LEAGUE-M2)
        return { el: it.el, t: it.t, large: it.large, ratio: Math.round(ratio * 100) / 100, need };
      });
    }, { png, items: r.__g7 || [], dpr: s.dpr });
    delete r.__g7;
    const lowC = (r.G7 || []).filter((x) => x.ratio !== null && x.ratio < x.need);
    if (lowC.length) (r.fail = r.fail || []).push("G7");
    r.G7fails = lowC;
    r.G12 = { errors, failed };
    if (errors.length || failed.length) (r.fail = r.fail || []).push("G12");
    r.loaded = [...new Set(loaded.map((u) => u.replace(/^https?:\/\/[^/]+/, "")))];
    r.shot = Object.assign({ file: name }, s);
    if (s.grid) { r.gridEvidenceOnly = true; r.failIgnored = r.fail; r.fail = []; }
    if (r.fail && r.fail.length) failures++;
    report.results.push(r);
    console.log(name, r.fail && r.fail.length ? "FAIL " + r.fail.join(",") : "ok");
    await ctx.close();
  }
  // G9 folder checks + G10 plate SHA
  const grepName = require("child_process").spawnSync("grep", ["-ril", "re" + "us", ROOT, "--exclude=qa_report.json"]).stdout.toString().trim();
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "assets", f))).digest("hex");
  const plates = ["ENV_LEAGUE_PLATE_V1_1X.webp", "ENV_LEAGUE_PLATE_V1_2X.webp", "ENV_LEAGUE_PLATE_V1_1X.png", "ENV_LEAGUE_PLATE_V1_2X.png"].map((f) => ({ f, sha: sha(f), matchesIntake: intake.includes(sha(f)) }));
  const allowed = /(ENV_LEAGUE_PLATE_V1_[12]X\.(webp|png)|OVL_DANIEL_FINGER_V1_[12]X\.png|\.woff2|^data:image\/svg|league\.(css|js)|index\.html|fixtures\.json|platemap\.json|visualIdentity\.js)/;
  const loadedAll = [...new Set(report.results.flatMap((r) => r.loaded || []))];
  const disallowed = loadedAll.filter((u) => !allowed.test(u.split("?")[0]));
  const bgDisallowed = [...new Set(report.results.flatMap((r) => (r.G9 && r.G9.urls) || []))].filter((u) => !allowed.test(u));
  report.G9 = { loaded: loadedAll, disallowedRequests: disallowed, disallowedBackgrounds: bgDisallowed, nameGrepHits: grepName ? grepName.split("\n") : [] };
  report.G10 = { plates };
  if (disallowed.length || bgDisallowed.length || grepName || plates.some((p) => !p.matchesIntake)) failures++;
  const g8f = path.join(out, "g8_finger.json"), seam = path.join(out, "seam_report.json");
  if (fs.existsSync(g8f)) report.G8_finger = JSON.parse(fs.readFileSync(g8f, "utf8"));
  if (fs.existsSync(seam)) report.seams = JSON.parse(fs.readFileSync(seam, "utf8"));
  report.summary = { shots: report.results.length, failingShots: report.results.filter((r) => r.fail && r.fail.length).map((r) => `${r.shot.file}: ${r.fail.join(",")}`) };
  fs.writeFileSync(path.join(out, "qa_report.json"), JSON.stringify(report, null, 1));
  console.log(`${report.results.length} shots, ${failures} failing`);
  await browser.close();
})();
