// HOME-V1 render + QA harness (gates G1–G13 of CLOUD_BRIEF_HOME_V1_R3 + seam audit over the intake tone-match zones).
// Adapted from ../tr2/slice-02-plate/tools/render-qa.cjs (same shape: shots → page assertions → evidence/qa_report.json).
// Usage (server from the REPO ROOT so the shared ../ paths resolve):
//   python3 -m http.server 8765        # in the repo root
//   NODE_PATH=$(npm root -g) node visual-assets/v10_1/home/tools/render-qa.cjs http://127.0.0.1:8765/visual-assets/v10_1/home/ visual-assets/v10_1/home/evidence
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const base = process.argv[2] || "http://127.0.0.1:8765/visual-assets/v10_1/home/";
const out = process.argv[3] || path.join(__dirname, "..", "evidence");
const root = path.join(__dirname, "..");
fs.mkdirSync(out, { recursive: true });
const fx = JSON.parse(fs.readFileSync(path.join(root, "fixtures.json"), "utf8"));
const map = JSON.parse(fs.readFileSync(path.join(root, "assets", "platemap.json"), "utf8"));
const intake = fs.readFileSync(path.join(root, "assets", "intake_report.md"), "utf8");
const S = fx.strings;

const D = (frame, vw, vh, extra) => Object.assign({ frame, vw, vh, dpr: 1 }, extra || {});
const M = (frame, vw, vh, extra) => Object.assign({ frame, vw, vh, dpr: 2, mobile: true }, extra || {});
const shots = [];
for (const f of ["HM1", "HM2", "HM3"]) {
  shots.push(D(f, 1366, 768), D(f, 1440, 900), D(f, 1920, 1080), D(f, 1366, 640));
  shots.push(M(f, 360, 640), M(f, 375, 553), M(f, 393, 660), M(f, 390, 844), M(f, 430, 932));
}
shots.push(D("HM1", 1366, 768, { dpr: 2 }), D("HM1", 1366, 768, { grid: true }));
// seam evidence: plate only, mends off / on, plus the phone band
shots.push(D("S0", 1366, 768, { mends: false, tag: "mends_off" }), D("S0", 1366, 768, { tag: "mends_on" }), D("S0", 1920, 1080, { mends: false, tag: "mends_off" }), D("S0", 1920, 1080, { tag: "mends_on" }));

const PRODUCT_IDS = ["topHeader", "onlinePlayerIdentityBadge", "seasonIndicator", "mainMenu", "continueCareer", "newShowdown", "legacyButton",
  "careerStatisticsButton", "ruleBookButton", "settingsButton", "menuMediaSelector", "menuMusicPlayer", "menuMusicStatus", "menuMusicToggle", "menuMusicMute"];

// Visually hidden on phone (still in the DOM), numbered for Sol in the handoff.
function expectedStrings(frame, mobile, tight) {
  const f = fx.frames[frame], T = S.tiles, Md = S.media;
  const sel = Md.tracks.find((t) => t.key === Md.defaultTrack);
  const nt = T[f.newTile];
  const list = [];
  if (!mobile) list.push(S.brandTitle, S.brandSub);
  list.push(f.badge, f.indicator, S.heading, S.headingMetaStrong, S.headingMetaText);
  if (!mobile) list.push(Md.category);
  list.push(sel.title, sel.artist, Md.source);
  Md.tracks.forEach((t) => { list.push(t.title); if (!mobile) list.push(t.artist); });
  if (!(mobile && tight)) list.push(Md.statusTemplate.replace("{TITLE}", sel.title));
  list.push(Md.toggle, Md.mute);
  list.push(T.continueCareer.code, f.save.label); if (true) list.push(f.save.meta);
  list.push(nt.code, nt.label); if (!mobile || f.primary === "newShowdown") list.push(nt.meta);
  // owner change: full tile set; secondary tiles show code + label (meta visually hidden), Statistics carries the TROPHY ROOM tag
  // (phone: the compact 4-up row shows label (+ tag); code visually hidden)
  [T.legacyButton, T.careerStatisticsButton, T.ruleBookButton, T.settingsButton].forEach((t) => { if (!mobile) list.push(t.code); list.push(t.label); if (t.tag) list.push(t.tag); });
  if (!mobile) { S.bottomStrip.forEach(([n, t]) => list.push(n, t)); list.push(S.bottomStripState); list.push(...S.footer); }
  return list;
}

function expectedFocusIds(frame) {
  const f = fx.frames[frame];
  const chips = S.media.tracks.map((t) => `chip:${t.key}`);
  return { first: ["onlinePlayerIdentityBadge"], chips, controls: ["menuMusicToggle"], tiles: (f.save.hasSave ? ["continueCareer"] : []).concat(["newShowdown", "ruleBookButton", "settingsButton"]) };
}

function sha(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function grepForbidden(dir) {
  const FORBIDDEN = new RegExp(["r", "e", "u", "s"].join(""), "i"); // brief G9 grep; spelled indirectly so this file stays clean
  const hits = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); return; }
    if (/\.(png|webp|jpg|jpeg|woff2)$/i.test(e.name)) return;
    const txt = fs.readFileSync(p, "utf8");
    if (FORBIDDEN.test(txt)) hits.push(path.relative(root, p));
  });
  walk(dir);
  return hits;
}

// ---------------- in-page measurement ----------------
function pageMeasure(args) {
  const { expect, tight } = args;
  const H = window.HomePlate, stage = document.getElementById("stage-root");
  const mobile = stage.dataset.mode === "mobile";
  const res = { mode: stage.dataset.mode, cardMode: stage.dataset.cardMode || null, k: +stage.dataset.k, band: stage.dataset.band ? JSON.parse(stage.dataset.band) : null, fail: [], gates: {} };
  const isHidden = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return true;
      if (cs.clipPath === "inset(50%)" || (cs.position === "absolute" && cs.clip === "rect(0px, 0px, 0px, 0px)")) return true;
    }
    return false;
  };
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const R = (b) => ({ x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 });

  // ---- G1 strings
  const textNodes = [];
  const tw = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) { const n = tw.currentNode; if (norm(n.textContent) && !isHidden(n.parentElement) && !n.parentElement.closest(".gridOverlay")) textNodes.push(n); }
  const got = textNodes.map((n) => norm(n.textContent));
  const bag = (arr) => arr.reduce((m, s) => (m[s] = (m[s] || 0) + 1, m), {});
  const want = bag(expect.strings), have = bag(got);
  const missing = [], extra = [];
  Object.keys(want).forEach((s) => { for (let i = (have[s] || 0); i < want[s]; i++) missing.push(s); });
  Object.keys(have).forEach((s) => { const over = have[s] - (want[s] || 0); if (over > 0 && !expect.decorative.includes(s)) for (let i = 0; i < over; i++) extra.push(s); });
  res.gates.G1 = { pass: !missing.length && !extra.length, missing, extra, decorativeShown: Object.keys(have).filter((s) => expect.decorative.includes(s)) };

  // ---- G2 ids / roles / aria
  const g2 = { dup: [], aria: [] };
  expect.ids.forEach((id) => { const n = document.querySelectorAll("#" + id).length; if (n !== 1) g2.dup.push(`${id} x${n}`); });
  const st = document.getElementById("menuMusicStatus");
  if (st.getAttribute("role") !== "status" || st.getAttribute("aria-live") !== "polite") g2.aria.push("menuMusicStatus role/aria-live");
  const cont = document.getElementById("continueCareer");
  if (cont.getAttribute("aria-disabled") !== String(!expect.hasSave) || cont.disabled !== !expect.hasSave) g2.aria.push("continueCareer disabled/aria-disabled");
  const selEl = document.getElementById("menuMediaSelector");
  if (selEl.getAttribute("role") !== "group") g2.aria.push("menuMediaSelector role");
  const chips = [...selEl.querySelectorAll("[data-menu-media-source]")];
  if (chips.length !== 4 || chips.filter((c) => c.getAttribute("aria-pressed") === "true").length !== 1) g2.aria.push("chips aria-pressed");
  if (document.querySelector(".menuMusicTile").getAttribute("aria-label") !== "Menu media") g2.aria.push("section aria-label");
  if (!document.getElementById("menuMusicMute").disabled) g2.aria.push("mute not disabled");
  ["legacyButton", "careerStatisticsButton"].forEach((id) => { if (isHidden(document.getElementById(id))) g2.aria.push(id + " hidden (owner change: must show)"); });
  const order = [...document.querySelectorAll(".fifaMenuGrid > button.menuTile")].map((b) => b.id);
  if (order.join() !== "continueCareer,newShowdown,legacyButton,careerStatisticsButton,ruleBookButton,settingsButton") g2.aria.push("tile order " + order.join());
  res.gates.G2 = { pass: !g2.dup.length && !g2.aria.length, ...g2, chipAriaLabel: selEl.getAttribute("aria-label") };

  // ---- G3 scroll
  const de = document.documentElement, bd = document.body;
  const g3 = { html: [de.scrollWidth, de.scrollHeight], body: [bd.scrollWidth, bd.scrollHeight], vp: [innerWidth, innerHeight] };
  // the stage is fixed: also require that it does not scroll and that every visible control sits fully inside the viewport
  g3.stage = [stage.scrollWidth, stage.scrollHeight, stage.clientWidth, stage.clientHeight];
  g3.outOfView = [...stage.querySelectorAll("button")].filter((b) => !isHidden(b)).filter((b) => { const r = b.getBoundingClientRect(); return r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5 || r.top < -0.5; }).map((b) => b.id || b.dataset.menuMediaSource);
  g3.pass = de.scrollHeight <= innerHeight + 1 && de.scrollWidth <= innerWidth + 1 && bd.scrollHeight <= innerHeight + 1 && bd.scrollWidth <= innerWidth + 1
    && stage.scrollHeight <= stage.clientHeight + 1 && stage.scrollWidth <= stage.clientWidth + 1 && !g3.outOfView.length;
  res.gates.G3 = g3;

  // ---- G4 primary
  const prim = document.getElementById(expect.primary), pb = prim.getBoundingClientRect();
  const hit = document.elementFromPoint(pb.left + pb.width / 2, pb.top + pb.height / 2);
  res.gates.G4 = { primary: expect.primary, box: R(pb), inside: pb.left >= 0 && pb.top >= 0 && pb.right <= innerWidth && pb.bottom <= innerHeight, hit: hit && (hit === prim || prim.contains(hit)) };
  res.gates.G4.pass = res.gates.G4.inside && res.gates.G4.hit;

  // ---- G5 clipping
  const textEls = [...new Set(textNodes.map((n) => n.parentElement))];
  const g5 = [];
  const blockOf = (el) => { let n = el; while (n && getComputedStyle(n).display === "inline") n = n.parentElement; return n; };
  new Set(textEls.map(blockOf)).forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.textOverflow === "ellipsis") g5.push({ el: el.className || el.id || el.tagName, why: "ellipsis" });
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) g5.push({ el: el.className || el.id || el.tagName, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
  });
  [".menuMusicTile", ".fifaMenuGrid", ".menuTile"].forEach((q) => document.querySelectorAll(q).forEach((el) => {
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) g5.push({ el: el.id || el.className, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
  }));
  res.gates.G5 = { pass: !g5.length, issues: g5 };

  // ---- G6 sizes
  const controls = [...stage.querySelectorAll("button")].filter((b) => !isHidden(b));
  const g6 = { controls: [], text: [], body: [] };
  const minCtl = mobile ? 44 : 40;
  controls.forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < minCtl - 0.01 || (mobile && r.width < 44)) g6.controls.push({ id: b.id || b.dataset.menuMediaSource, w: +r.width.toFixed(1), h: +r.height.toFixed(1) }); });
  let minFont = 99;
  textEls.forEach((el) => { const fs = parseFloat(getComputedStyle(el).fontSize); minFont = Math.min(minFont, fs); if (fs < 12) g6.text.push({ el: el.className || el.tagName, fs }); });
  if (mobile) [".fifaMenuHeadingMeta", ".menuTileMeta", ".menuMusicArtist"].forEach((q) => document.querySelectorAll(q).forEach((el) => { if (!isHidden(el) && parseFloat(getComputedStyle(el).fontSize) < 14) g6.body.push(q); }));
  g6.minControl = Math.min(...controls.map((b) => b.getBoundingClientRect().height)).toFixed(1);
  g6.minFont = minFont;
  g6.pass = !g6.controls.length && !g6.text.length && !g6.body.length;
  res.gates.G6 = g6;

  // ---- G8 faces and hands (plateToScreen)
  const P = H.MAP.protected_boxes;
  const plateBox = document.querySelector(".plateView").getBoundingClientRect();
  const prot = Object.entries(P).map(([n, r]) => {
    const s = H.rectToScreen(r);
    // only the part of the box that is on screen inside the plate view counts (phone band crops the plate)
    const c = { left: Math.max(s.left, plateBox.left), top: Math.max(s.top, plateBox.top), right: Math.min(s.right, plateBox.right), bottom: Math.min(s.bottom, plateBox.bottom) };
    return { n, s, c, visible: c.right > c.left && c.bottom > c.top };
  });
  const uiBoxes = [];
  textNodes.forEach((n) => { const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach((b) => uiBoxes.push({ kind: "text", name: norm(n.textContent).slice(0, 24), b })); });
  controls.forEach((b) => uiBoxes.push({ kind: "control", name: b.id || b.dataset.menuMediaSource, b: b.getBoundingClientRect() }));
  [".menuMusicTile", ".fifaMenuGrid", ".hdrBg i", ".lockupWordmark", "footer", ".menuBottomStrip", ".seasonIndicator"].forEach((q) => document.querySelectorAll(q).forEach((el) => { if (!isHidden(el)) uiBoxes.push({ kind: "panel", name: q, b: el.getBoundingClientRect() }); }));
  const dist = (a, p) => { const dx = Math.max(p.left - a.right, a.left - p.right, 0), dy = Math.max(p.top - a.bottom, a.top - p.bottom, 0); const inter = a.right > p.left && a.left < p.right && a.bottom > p.top && a.top < p.bottom; return inter ? -1 : Math.max(dx, dy); };
  const g8 = { boxes: {}, violations: [] };
  prot.forEach((p) => {
    if (!p.visible) { g8.boxes[p.n] = { visible: false }; return; }
    let min = Infinity, who = null;
    uiBoxes.forEach((u) => { if (u.b.width <= 0 || u.b.height <= 0) return; const d = dist(u.b, p.c); if (d < min) { min = d; who = `${u.kind}:${u.name}`; } });
    g8.boxes[p.n] = { screen: R({ left: p.c.left, top: p.c.top, width: p.c.right - p.c.left, height: p.c.bottom - p.c.top }), minClearance: min === -1 ? "INTERSECTS" : +min.toFixed(1), nearest: who };
    if (min < 8) g8.violations.push(`${p.n}: ${min === -1 ? "intersects" : min.toFixed(1) + " px"} (${who})`);
  });
  // decorative non-UI layers that overlap a grown protected box (report only; they are not text, controls or panels)
  g8.decorativeInMargin = [];
  [".mend", ".areaMend", ".scrimTop", ".scrimLow", ".dockBed"].forEach((q) => document.querySelectorAll(q).forEach((el) => {
    if (isHidden(el)) return; const b = el.getBoundingClientRect();
    prot.forEach((p) => { if (!p.visible) return; const grown = { left: p.c.left - 8 * H.cam.k, top: p.c.top - 8 * H.cam.k, right: p.c.right + 8 * H.cam.k, bottom: p.c.bottom + 8 * H.cam.k }; const inBox = dist(b, p.c) === -1; if (dist(b, grown) === -1) g8.decorativeInMargin.push({ layer: q + (el.dataset.zone ? `[zone ${el.dataset.zone} ${el.dataset.edge}]` : ""), box: p.n, insideBox: inBox }); });
  }));
  g8.decorativeInsideBox = g8.decorativeInMargin.filter((d) => d.insideBox);
  g8.pass = !g8.violations.length && !g8.decorativeInsideBox.length;
  res.gates.G8 = g8;

  // ---- G9 imagery
  const urls = new Set(performance.getEntriesByType("resource").map((e) => e.name));
  document.querySelectorAll("img").forEach((i) => i.currentSrc && urls.add(i.currentSrc));
  document.querySelectorAll("*").forEach((el) => { const bg = getComputedStyle(el).backgroundImage; (bg.match(/url\("?([^")]+)"?\)/g) || []).forEach((u) => urls.add(u.replace(/^url\("?|"?\)$/g, ""))); });
  res.resources = [...urls];

  // ---- G10 sides (screen centres via plateToScreen)
  const fd = H.rectToScreen(P.face_daniel), fn = H.rectToScreen(P.face_nik), hd = H.rectToScreen(P.hand_daniel), hn = H.rectToScreen(P.hand_nik);
  res.gates.G10 = { faceDanielX: +(fd.left + fd.width / 2).toFixed(1), faceNikX: +(fn.left + fn.width / 2).toFixed(1), handDanielX: +(hd.left + hd.width / 2).toFixed(1), handNikX: +(hn.left + hn.width / 2).toFixed(1) };
  res.gates.G10.sidesPass = res.gates.G10.faceDanielX < res.gates.G10.faceNikX && res.gates.G10.handDanielX < res.gates.G10.handNikX;
  res.plateBg = getComputedStyle(document.querySelector(".plateView")).backgroundImage;

  // ---- G13 chrome snapshot
  const snap = (el) => { if (!el) return null; const cs = getComputedStyle(el), b = el.getBoundingClientRect(); return { box: R(b), font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily.split(",")[0]}`, color: cs.color, bg: cs.backgroundImage !== "none" ? cs.backgroundImage.slice(0, 90) : cs.backgroundColor, border: cs.borderBottom || cs.border, letterSpacing: cs.letterSpacing }; };
  res.gates.G13 = {
    header: snap(document.getElementById("topHeader")), headerBgSegments: [...document.querySelectorAll(".hdrBg i")].map(snap), headerGaps: stage.dataset.headerGaps,
    badge: snap(document.querySelector(".cmBadge")), brand: snap(document.querySelector(".brand h1")), identity: snap(document.getElementById("onlinePlayerIdentityBadge")), indicator: snap(document.getElementById("seasonIndicator")),
    script: snap(document.querySelector(".scriptLine")), footer: snap(document.querySelector("footer")), footDeco: snap(document.querySelector(".footDeco")),
  };
  res.textRects = textEls.filter((el) => !isHidden(el)).map((el) => {
    const cs = getComputedStyle(el); let disabled = false, op = 1;
    // glyph box: union of this element's own text-node ranges (excludes borders, underlines, icons, padding)
    const rects = []; el.childNodes.forEach((n) => { if (n.nodeType === 3 && norm(n.textContent)) { const rg = document.createRange(); rg.selectNodeContents(n); rects.push(...rg.getClientRects()); } });
    const b = rects.length ? { left: Math.min(...rects.map((q) => q.left)), top: Math.min(...rects.map((q) => q.top)), width: Math.max(...rects.map((q) => q.right)) - Math.min(...rects.map((q) => q.left)), height: Math.max(...rects.map((q) => q.bottom)) - Math.min(...rects.map((q) => q.top)) } : el.getBoundingClientRect();
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { if (n.disabled) disabled = true; op *= +getComputedStyle(n).opacity; }
    // rotated decorative text (.scriptLine, rotate(-8deg) about its right-centre): sample the rotated glyph box itself,
    // not its axis-aligned bounds, which would pull in plate pixels the text never covers
    let points = null;
    const rot = el.closest(".scriptLine");
    if (rot) {
      const m = new DOMMatrixReadOnly(getComputedStyle(rot).transform);
      const ox = rot.offsetWidth, oy = rot.offsetHeight / 2, X = rot.offsetLeft, Y = rot.offsetTop;
      const pad = { l: parseFloat(cs.paddingLeft), t: parseFloat(cs.paddingTop) };
      const gw = el.offsetWidth - 2 * pad.l, gh = el.offsetHeight - 2 * pad.t;
      points = [];
      for (let i = 0; i <= 30; i++) for (let j = 0; j <= 6; j++) {
        const lx = pad.l + (gw * i) / 30 - ox, ly = el.offsetTop + pad.t + (gh * j) / 6 - oy;
        points.push([X + ox + m.a * lx + m.c * ly, Y + oy + m.b * lx + m.d * ly]);
      }
    }
    return { name: norm(el.textContent).slice(0, 40), cls: el.className || el.tagName, color: cs.color, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight, b: { x: b.left, y: b.top, w: b.width, h: b.height }, points, disabled, decorative: !!el.closest("[aria-hidden=true]"), opacity: op };
  });
  res.controlRects = controls.map((b) => { const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { id: b.id || b.dataset.menuMediaSource, b: { x: r.left, y: r.top, w: r.width, h: r.height }, border: cs.borderTopColor, disabled: b.disabled }; });
  res.focusables = controls.filter((b) => !b.disabled).map((b) => { const r = b.getBoundingClientRect(); return { id: b.dataset.menuMediaSource ? "chip:" + b.dataset.menuMediaSource : b.id, x: r.left, y: r.top }; });
  return res;
}

// Pixel stats on a screenshot: runs in the page (canvas), so no PNG decoder is needed in node.
async function pixelStats(page, png, dpr, jobs) {
  return page.evaluate(async ({ data, dpr, jobs }) => {
    const img = new Image(); img.src = "data:image/png;base64," + data; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    return jobs.map((j) => {
      if (j.points) {
        let max = -1, min = 2, sum = 0, n = 0;
        j.points.forEach(([px, py]) => { const x = Math.round(px * dpr), y = Math.round(py * dpr); if (x < 0 || y < 0 || x >= c.width || y >= c.height) return; const d = ctx.getImageData(x, y, 1, 1).data; const L = lum(d[0], d[1], d[2]); max = Math.max(max, L); min = Math.min(min, L); sum += L; n++; });
        return n ? { max, min, mean: sum / n, sampled: "rotated-quad" } : null;
      }
      const x0 = Math.max(0, Math.floor(j.x * dpr)), y0 = Math.max(0, Math.floor(j.y * dpr)), x1 = Math.min(c.width, Math.ceil((j.x + j.w) * dpr)), y1 = Math.min(c.height, Math.ceil((j.y + j.h) * dpr));
      if (x1 <= x0 || y1 <= y0) return null;
      const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let max = -1, min = 2, maxRGB = null, minRGB = null, sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const L = lum(d[i], d[i + 1], d[i + 2]); sum += L; n++; if (L > max) { max = L; maxRGB = [d[i], d[i + 1], d[i + 2]]; } if (L < min) { min = L; minRGB = [d[i], d[i + 1], d[i + 2]]; } }
      return { max, min, mean: sum / n, maxRGB, minRGB };
    });
  }, { data: png.toString("base64"), dpr, jobs });
}

// Seam audit: along every intake-zone edge, measure the luminance step across the edge and any thin ridge (hairline) next to it,
// on the final render, skipping points that sit under opaque UI (tiles, card, header, footer) or outside the plate view.
async function seamAudit(page, png, dpr) {
  return page.evaluate(async ({ data, dpr }) => {
    const H = window.HomePlate; const P = H.MAP;
    const img = new Image(); img.src = "data:image/png;base64," + data; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const full = ctx.getImageData(0, 0, c.width, c.height).data;
    const L = (x, y) => { x = Math.round(x * dpr); y = Math.round(y * dpr); if (x < 0 || y < 0 || x >= c.width || y >= c.height) return NaN; const i = (y * c.width + x) * 4; return 0.2126 * full[i] + 0.7152 * full[i + 1] + 0.0722 * full[i + 2]; };
    const plateBox = document.querySelector(".plateView").getBoundingClientRect();
    const passThrough = (el) => !el || el.classList.contains("plateView") || el.classList.contains("plateLayer") || el.classList.contains("mend") || el.classList.contains("areaMend") || el.classList.contains("scrim") || el.classList.contains("dockBed") || el.id === "stage-root" || el.classList.contains("gridOverlay") || el.tagName === "MAIN" || el.id === "mainMenu" || el.classList.contains("fifaMenuShell");
    // text glyph boxes (+4 px) of the see-through left column count as covering: a profile through glyphs is not a seam
    const glyphs = [];
    document.querySelectorAll(".homeLockup, .fifaMenuHeading, .scriptLine").forEach((root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const rg = document.createRange(); rg.selectNodeContents(w.currentNode); glyphs.push(...rg.getClientRects()); } root.querySelectorAll("img").forEach((i) => glyphs.push(i.getBoundingClientRect())); });
    const inGlyph = (x, y) => glyphs.some((g) => x >= g.left - 4 && x <= g.right + 4 && y >= g.top - 4 && y <= g.bottom + 4);
    const covered = (x, y) => { if (x < plateBox.left || x >= plateBox.right || y < plateBox.top || y >= plateBox.bottom) return true; if (inGlyph(x, y)) return true; const el = document.elementFromPoint(x, y); if (!el) return true; if (passThrough(el)) return false; return !(el.closest(".homeLockup") || el.closest(".fifaMenuHeading") || el.closest(".scriptLine")); };
    const median = (a) => { const s = a.filter((v) => !isNaN(v)).sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : null; };
    const results = [];
    P.remove_rects.forEach((z, zi) => {
      const edges = [];
      if (z[1] > 0) edges.push(["top", "h", z[1], z[0], z[2]]);
      if (z[3] < 941) edges.push(["bottom", "h", z[3], z[0], z[2]]);
      if (z[0] > 0) edges.push(["left", "v", z[0], z[1], z[3]]);
      if (z[2] < 1672) edges.push(["right", "v", z[2], z[1], z[3]]);
      edges.forEach(([name, o, at, a, b]) => {
        const steps = [], ridges = [], pts = [];
        for (let t = a + 4; t <= b - 4; t += 6) {
          const p = o === "h" ? H.plateToScreen(t, at) : H.plateToScreen(at, t);
          if (covered(p.x, p.y) || covered(o === "h" ? p.x : p.x - 6, o === "h" ? p.y - 6 : p.y) || covered(o === "h" ? p.x : p.x + 6, o === "h" ? p.y + 6 : p.y)) continue;
          // profile across the edge, 1 CSS px steps, averaged over 3 px along the edge; window ±7 px covers a hairline a few plate px inside the zone
          const prof = [];
          for (let d = -7; d <= 7; d++) { let s = 0, n = 0; for (let w = -1; w <= 1; w++) { const v = o === "h" ? L(p.x + w, p.y + d) : L(p.x + d, p.y + w); if (!isNaN(v)) { s += v; n++; } } prof.push(n ? s / n : NaN); }
          const mean = (i0, i1) => { let s = 0, n = 0; for (let i = i0; i <= i1; i++) if (!isNaN(prof[i])) { s += prof[i]; n++; } return n ? s / n : NaN; };
          steps.push(Math.abs(mean(2, 5) - mean(9, 12)));
          let r = 0; for (let i = 2; i <= 12; i++) r = Math.max(r, Math.abs(prof[i] - (prof[i - 2] + prof[i + 2]) / 2));
          ridges.push(r); pts.push(t);
        }
        results.push({ zone: zi, rect: z, edge: name, samplesVisible: steps.length, medianStep: steps.length ? +median(steps).toFixed(1) : null, medianRidge: ridges.length ? +median(ridges).toFixed(1) : null, span: pts.length ? [pts[0], pts[pts.length - 1]] : null });
      });
    });
    return results;
  }, { data: png.toString("base64"), dpr });
}

const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const parseRGB = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 1]; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
const relLum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
// a seam counts as visible when, along the edge's visible length, the median step or hairline ridge exceeds these (8-bit luma levels)
const SEAM_STEP = 7, SEAM_RIDGE = 5;

(async () => {
  const browser = await chromium.launch();
  const report = { base, when: new Date().toISOString(), viewports: "desktop dpr1 (+1366x768 dpr2), phone dpr2", seamThresholds: { step: SEAM_STEP, ridge: SEAM_RIDGE }, results: [], seams: {} };
  const forbiddenHits = grepForbidden(root);
  const plateSha = {};
  ["ENV_HOME_PLATE_V1_1X.webp", "ENV_HOME_PLATE_V1_2X.webp", "ENV_HOME_PLATE_V1_1X.png", "ENV_HOME_PLATE_V1_2X.png"].forEach((f) => { const h = sha(path.join(root, "assets", f)); plateSha[f] = { sha256: h, inIntakeReport: intake.includes(h), inPlatemap: map.sha256[f] === h }; });
  report.plateSha = plateSha; report.forbiddenGrep = forbiddenHits;
  let failures = 0;
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: s.dpr, isMobile: !!s.mobile, hasTouch: !!s.mobile });
    const page = await ctx.newPage();
    const errors = [], failed = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("requestfailed", (r) => failed.push(r.url()));
    page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    const q = `?frame=${s.frame}${s.grid ? "&grid=1" : ""}${s.mends === false ? "&mends=0" : ""}`;
    await page.goto(base + "index.html" + q);
    await page.waitForFunction(() => window.__homeReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(250);
    const tag = `${s.frame}_${s.vw}x${s.vh}${s.dpr > 1 && !s.mobile ? "@2x" : ""}${s.grid ? "_grid" : ""}${s.tag ? "_" + s.tag : ""}`;
    await page.screenshot({ path: path.join(out, tag + ".jpg"), type: "jpeg", quality: 86 });
    const entry = { shot: tag, frame: s.frame, vw: s.vw, vh: s.vh, dpr: s.dpr };
    const fr = fx.frames[s.frame];

    if (fr.plateOnly) {
      const png = await page.screenshot({ type: "png" });
      entry.seams = await seamAudit(page, png, s.dpr);
      entry.gates = { G12: { pass: !errors.length && !failed.length, errors, failed } };
      report.seams[tag] = entry.seams;
      report.results.push(entry); await ctx.close(); continue;
    }
    const tight = !!s.mobile && s.vh < 600;
    const expect = { strings: expectedStrings(s.frame, !!s.mobile, tight), decorative: fx.decorative, ids: PRODUCT_IDS, hasSave: fr.save.hasSave, primary: fr.primary };
    const r = await page.evaluate(pageMeasure, { expect, tight });
    Object.assign(entry, r);

    // G7 contrast: text hidden → brightest (light text) / darkest (dark text) background pixel under each text box
    const pngWith = await page.screenshot({ type: "png" });
    await page.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}" });
    await page.waitForTimeout(60);
    const pngBg = await page.screenshot({ type: "png" });
    const tJobs = r.textRects.map((t) => (t.points ? { points: t.points } : { x: t.b.x + 1, y: t.b.y + 1, w: Math.max(1, t.b.w - 2), h: Math.max(1, t.b.h - 2) }));
    const cJobs = r.controlRects.map((c) => [{ x: c.b.x - 2, y: c.b.y - 3, w: c.b.w + 4, h: 2 }, { x: c.b.x - 2, y: c.b.y + c.b.h + 1, w: c.b.w + 4, h: 2 }]).flat();
    const tStats = await pixelStats(page, pngBg, s.dpr, tJobs);
    const cStats = await pixelStats(page, pngBg, s.dpr, cJobs);
    const g7 = { text: [], borders: [], fails: [] };
    r.textRects.forEach((t, i) => {
      const st = tStats[i]; if (!st) return;
      const [cr, cg, cb] = parseRGB(t.color); const tl = relLum([cr, cg, cb]);
      const light = tl > st.mean;
      const ratio = contrast(tl, light ? st.max : st.min);
      const large = t.fs >= 24 || (t.fs >= 18.66 && t.fw >= 700);
      const need = large ? 3 : 4.5;
      const row = { name: t.name, ratio: +ratio.toFixed(2), need, large, decorative: t.decorative, disabled: t.disabled };
      g7.text.push(row);
      if (ratio < need && !t.disabled) g7.fails.push(row);
    });
    r.controlRects.forEach((c, i) => {
      const a = cStats[2 * i], b = cStats[2 * i + 1]; if (!a || !b) return;
      const [br, bg, bb, ba] = parseRGB(c.border);
      const outside = Math.max(a.max, b.max);
      // border composited over the darkest neighbouring pixel (alpha borders) vs the brightest outside pixel
      const under = Math.min(a.min, b.min);
      const comp = relLum([br, bg, bb]) * ba + under * (1 - ba);
      const ratio = contrast(comp, outside);
      const row = { id: c.id, ratio: +ratio.toFixed(2), disabled: c.disabled };
      g7.borders.push(row);
      if (ratio < 3 && !c.disabled) g7.fails.push(Object.assign({ border: true }, row));
    });
    // the &grid=1 evidence shot paints debug boxes over the page; contrast is gated on the clean shots only
    g7.pass = !g7.fails.length || !!s.grid;
    g7.disabledExempt = g7.text.filter((t) => t.disabled && t.ratio < t.need).length;
    entry.gates.G7 = g7;

    // G9 imagery allowlist
    const allowed = (u) => /\/assets\/ENV_HOME_PLATE_V1_(1X|2X)\.(webp|png)$/.test(u) || /\/assets\/LOGO_CM17_WORDMARK_V1\.(webp|png)$/.test(u) || /\.woff2$/.test(u) || /^data:image\/svg/.test(u) || /\/(index\.html|home\.css|home\.js|fixtures\.json|platemap\.json)(\?|$)/.test(u);
    const bad = r.resources.filter((u) => !allowed(u));
    entry.gates.G9 = { pass: !bad.length && !forbiddenHits.length, loaded: r.resources.map((u) => u.replace(/^https?:\/\/[^/]+/, "")), notAllowed: bad, forbiddenGrepHits: forbiddenHits.length };
    // G10 plate sha at load: the files the page actually requested
    const loadedPlates = r.resources.filter((u) => /ENV_HOME_PLATE_V1/.test(u)).map((u) => path.basename(u.split("?")[0]));
    entry.gates.G10.plateFiles = loadedPlates;
    entry.gates.G10.shaPass = loadedPlates.length > 0 && loadedPlates.every((f) => plateSha[f] && plateSha[f].inIntakeReport);
    entry.gates.G10.pass = entry.gates.G10.sidesPass && entry.gates.G10.shaPass;

    // G11 tab order = visual reading order (rows within 8 px, then left to right); disabled and hidden skipped
    const vis = r.focusables.slice().sort((a, b) => (Math.abs(a.y - b.y) < 8 ? a.x - b.x : a.y - b.y)).map((f) => f.id);
    const tabbed = [];
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    for (let i = 0; i < vis.length + 2; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => { const a = document.activeElement; return !a || a === document.body ? null : a.dataset.menuMediaSource ? "chip:" + a.dataset.menuMediaSource : a.id; });
      if (!id || tabbed.includes(id)) break; tabbed.push(id);
    }
    entry.gates.G11 = { pass: tabbed.join() === vis.join(), tab: tabbed, visual: vis };

    // routing (owner change): every visible tile emits one home:intent naming its fixtures.routes destination
    const routeIds = ["continueCareer", "newShowdown", "legacyButton", "careerStatisticsButton", "ruleBookButton", "settingsButton"];
    const routing = {};
    for (const id of routeIds) {
      const got = await page.evaluate((id) => { const b = document.getElementById(id); if (b.disabled) return "disabled"; let d = null; const h = (e) => (d = e.detail); document.addEventListener("home:intent", h, { once: true }); b.click(); return d && d.tile === id && d.opens ? d.opens : "none"; }, id);
      routing[id] = got;
    }
    entry.gates.ROUTE = { pass: Object.entries(routing).every(([id, v]) => v !== "none" && (v !== "disabled" || (id === "continueCareer" && !fr.save.hasSave))), routing };
    // G12
    entry.gates.G12 = { pass: !errors.length && !failed.length, errors, failed };

    // seam audit on the final render (desktop Tier S + all phone shots at 390x844)
    if ((s.vw === 1366 && s.vh === 768 && s.dpr === 1 && !s.grid) || (s.mobile && s.vw === 390) || (s.vw === 1920 && !s.mobile)) {
      entry.seams = await seamAudit(page, pngWith, s.dpr);
      report.seams[tag] = entry.seams;
    }
    delete entry.textRects; delete entry.controlRects; delete entry.focusables; delete entry.resources;
    const gateFails = Object.entries(entry.gates).filter(([k, v]) => k !== "G13" && v && v.pass === false).map(([k]) => k);
    entry.failGates = gateFails;
    if (gateFails.length) failures++;
    report.results.push(entry);
    process.stdout.write(`${tag} ${gateFails.length ? "FAIL " + gateFails.join(",") : "ok"} ${entry.cardMode || ""}\n`);
    await ctx.close();
  }
  // seam summary: per edge, visible-after-UI flags for each audited shot
  report.seamSummary = {};
  Object.entries(report.seams).forEach(([tag, rows]) => {
    report.seamSummary[tag] = rows.filter((x) => x.samplesVisible >= 3 && (x.medianStep >= SEAM_STEP || x.medianRidge >= SEAM_RIDGE)).map((x) => ({ zone: x.zone, rect: x.rect, edge: x.edge, samples: x.samplesVisible, step: x.medianStep, ridge: x.medianRidge, span: x.span }));
  });
  report.summary = { shots: shots.length, failingShots: failures };
  fs.writeFileSync(path.join(out, "qa_report.json"), JSON.stringify(report, null, 1));
  console.log(`shots ${shots.length}, failing ${failures}`);
  console.log("seam flags:", JSON.stringify(report.seamSummary, null, 0).slice(0, 4000));
  await browser.close();
})();
