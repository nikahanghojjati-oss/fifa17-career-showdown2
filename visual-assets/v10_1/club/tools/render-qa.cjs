// CLUB-V1 render + QA harness (gates G1-G13, OWNER-3 pack-rip QA, intake-zone edge coverage).
// Adapted from ../tr2/slice-02-plate/tools/render-qa.cjs. Serve the repo root on :8765, then from the club folder:
//   NODE_PATH=$(npm root -g) node tools/render-qa.cjs http://127.0.0.1:8765/visual-assets/v10_1/club/ evidence
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), crypto = require("crypto");

const base = process.argv[2] || "http://127.0.0.1:8765/visual-assets/v10_1/club/";
const out = process.argv[3] || "evidence";
fs.mkdirSync(out, { recursive: true });
const ROOT = path.join(__dirname, "..");
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures.json"), "utf8"));
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/platemap.json"), "utf8"));
const HANDS = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/handmap.json"), "utf8"));
const intake = fs.readFileSync(path.join(ROOT, "assets/intake_report.md"), "utf8");
const INTAKE_SHA = {};
for (const m of intake.matchAll(/`(ENV_CLUB_PLATE_V1_[12]X\.(?:png|webp))` `([0-9a-f]{64})`/g)) INTAKE_SHA[m[1]] = m[2];

const FRAMES = ["CL1", "CL2", "CL3", "CL4", "CL5", "CL6"];
const D = (vw, vh, dpr = 1) => ({ vw, vh, dpr, mobile: false });
const M = (vw, vh, dpr = 2) => ({ vw, vh, dpr, mobile: true });
// 393x660 @3 = Nik's iPhone, Safari visible area (owner request 2026-10-01)
const VIEWS = [D(1366, 768), D(1440, 900), D(1920, 1080), D(1366, 640), D(1366, 768, 2), M(360, 640), M(375, 553), M(390, 844), M(430, 932), M(393, 660, 3)];
const PRODUCT_IDS = ["clubWheelScreen", "clubAssignmentLeague", "clubPackStatus", "clubCardOne", "clubCardTwo", "clubPlayerOne", "clubPlayerTwo",
  "clubNameOne", "clubNameTwo", "clubCardStateOne", "clubCardStateTwo", "clubRivalryConfirmation", "clubConfirmationShowdown", "clubConfirmationMeta",
  "clubConfirmationManagerOne", "clubConfirmationManagerTwo", "clubConfirmationClubOne", "clubConfirmationClubTwo", "openClubPack",
  "continueClubAssignment", "clubAssignmentBack", "topHeader", "seasonIndicator", "onlinePlayerIdentityBadge"];

const name = (f, v, suffix = "") => `${f}_${v.vw}x${v.vh}${v.dpr === 2 && !v.mobile ? "@2x" : ""}${suffix}.jpg`;

/* ---------- in-page measurement (runs in the browser) ---------- */
function measure(args) {
  const { fx, frame, mobile, PRODUCT_IDS } = args;
  const Q = window.ClubQA, T = Q.T, MAP = Q.MAP, HANDS = Q.HANDS;
  const f = fx.frames[frame];
  const r = { fail: [], frame, T: { k: +T.k.toFixed(5), offX: +T.offX.toFixed(2), offY: +T.offY.toFixed(2), mode: T.mode } };
  const vis = el => {
    if (!el || !el.getClientRects().length) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
      if (cs.clipPath === "inset(50%)" || (cs.clip && cs.clip.startsWith("rect(0px, 0px, 0px, 0px)"))) return false;
    }
    const b = el.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  };
  // G1 strings
  const texts = [], textEls = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const n = tw.currentNode, t = n.textContent.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const p = n.parentElement;
    if (p.closest("svg") || p.closest("script,style")) continue;   // crest initials inside visualIdentity SVGs: allowed decorative
    const rg = document.createRange(); rg.selectNodeContents(n); const rb = rg.getBoundingClientRect();
    if (!(rb.width > 1 && rb.height > 1)) continue;
    let hid = false; for (let e = p; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0 || cs.clipPath === "inset(50%)") hid = true; }
    if (hid) continue;
    texts.push(t); textEls.add(p);
  }
  // footer text node split by <br>
  const found = new Set(texts);
  const expected = new Set(f.expected), deco = new Set(fx.decorative);
  const optional = new Set([...(mobile ? fx.optional_visible.phone_may_hide : []), ...fx.optional_visible.desktop_only]);
  const missing = [...expected].filter(s => !found.has(s) && !(optional.has(s)));
  const extra = [...found].filter(s => !expected.has(s) && !deco.has(s));
  r.G1 = { visible: [...found].sort(), missing, extra, pass: !missing.length && !extra.length };
  if (!r.G1.pass) r.fail.push("G1");
  // G2 ids / aria
  const idCounts = Object.fromEntries(PRODUCT_IDS.map(id => [id, document.querySelectorAll("#" + id).length]));
  const aria = {
    statusLive: document.getElementById("clubPackStatus").getAttribute("aria-live"),
    confLive: document.getElementById("clubRivalryConfirmation").getAttribute("aria-live"),
    progressHidden: document.querySelector(".clubRevealProgress").getAttribute("aria-hidden"),
    doorsHidden: [...document.querySelectorAll(".clubPackDoor")].map(d => d.getAttribute("aria-hidden")),
    progressSteps: [...document.querySelectorAll(".clubRevealProgress [data-reveal-step]")].map(s => s.textContent.trim()),
  };
  const g2ok = Object.values(idCounts).every(c => c === 1) && aria.statusLive === "polite" && aria.confLive === "polite" && aria.progressHidden === "true"
    && aria.doorsHidden.every(v => v === "true") && aria.progressSteps.join("|") === "01 DRAW|02 PACK 1|03 PACK 2|04 VS|05 LOCK";
  r.G2 = { idCounts, aria, pass: g2ok }; if (!g2ok) r.fail.push("G2");
  // G3 scroll
  const de = document.documentElement, bd = document.body;
  r.G3 = { html: [de.scrollWidth, de.scrollHeight], body: [bd.scrollWidth, bd.scrollHeight], inner: [innerWidth, innerHeight] };
  r.G3.pass = de.scrollHeight <= innerHeight + 1 && de.scrollWidth <= innerWidth + 1 && bd.scrollHeight <= innerHeight + 1 && bd.scrollWidth <= innerWidth + 1;
  // Short desktop (decision 1, 2026-10-01): vertical page scroll is allowed there so the header never covers
  // a face; horizontal scroll is still a fail. Recorded as an owner-approved waiver, not a silent pass.
  r.G3.shortDesktopScroll = !mobile && de.classList.contains("scrolly");
  if (r.G3.shortDesktopScroll) { r.G3.waiver = "decision 1: vertical scroll allowed on short desktop"; r.G3.pass = de.scrollWidth <= innerWidth + 1 && bd.scrollWidth <= innerWidth + 1; }
  // phone: the stage itself must not overflow (content clipped by overflow hidden would also be a fail)
  const sec = document.getElementById("clubWheelScreen");
  r.G3.sectionOverflow = mobile ? sec.scrollHeight - sec.clientHeight : 0;
  if (mobile && r.G3.sectionOverflow > 1) r.G3.pass = false;
  if (!r.G3.pass) r.fail.push("G3");
  // G4 primary
  if (f.primary) {
    const b = document.getElementById(f.primary), rc = b.getBoundingClientRect();
    const inside = rc.left >= 0 && rc.top >= 0 && rc.right <= innerWidth && rc.bottom <= innerHeight;
    const hit = document.elementFromPoint(rc.left + rc.width / 2, rc.top + rc.height / 2);
    r.G4 = { id: f.primary, rect: [rc.left, rc.top, rc.width, rc.height].map(v => +v.toFixed(1)), inside, hitOk: !!hit && (hit === b || b.contains(hit)) };
    r.G4.pass = inside && r.G4.hitOk; if (!r.G4.pass) r.fail.push("G4");
  } else r.G4 = { exempt: true, pass: true };
  // G5 clipping
  const clipped = [];
  textEls.forEach(e => {
    const cs = getComputedStyle(e);
    if (cs.textOverflow === "ellipsis") clipped.push({ t: e.textContent.trim(), why: "ellipsis" });
    if (e.clientWidth > 0 && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && cs.display !== "inline") clipped.push({ t: e.textContent.trim().slice(0, 40), sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight });
    // also: not cut by the viewport
    const b = e.getBoundingClientRect();
    if (b.right > innerWidth + 1 || b.left < -1 || b.bottom > Math.max(innerHeight, de.classList.contains("scrolly") ? de.scrollHeight : 0) + 1) clipped.push({ t: e.textContent.trim().slice(0, 40), why: "outside viewport" });
  });
  r.G5 = { clipped, pass: !clipped.length }; if (!r.G5.pass) r.fail.push("G5");
  // G6 sizes
  const controls = [...document.querySelectorAll("button")].filter(vis).map(b => { const c = b.getBoundingClientRect(); return { id: b.id, w: +c.width.toFixed(1), h: +c.height.toFixed(1) }; });
  const small = [];
  textEls.forEach(e => { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 12) small.push({ t: e.textContent.trim().slice(0, 30), fs }); });
  const note = document.querySelector(".clubRivalryLockNote");
  const bodyFs = vis(note) ? parseFloat(getComputedStyle(note).fontSize) : null;
  const ctlBad = controls.filter(c => mobile ? (c.h < 44 || c.w < 44) : c.h < 40);
  r.G6 = { controls, smallText: small, lockNoteFs: bodyFs, pass: !ctlBad.length && !small.length && (!mobile || bodyFs == null || bodyFs >= 14) };
  if (!r.G6.pass) r.fail.push("G6");
  // boxes for G8 / G10
  const P = MAP.protected_boxes;
  const scr = rr => Q.rectToScreen(rr);
  const grow = (b, g) => ({ left: b.left - g, top: b.top - g, right: b.right + g, bottom: b.bottom + g });
  const inter = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const dist = (a, b) => { const dx = Math.max(0, a.left - b.right, b.left - a.right), dy = Math.max(0, a.top - b.bottom, b.top - a.bottom); return Math.hypot(dx, dy); };
  const clipR = { left: T.clip[0], top: T.clip[1], right: T.clip[0] + T.clip[2], bottom: T.clip[1] + T.clip[3] };
  const prot = {};
  for (const [n, b] of Object.entries(P)) prot[n] = scr(b);
  for (const [n, h] of Object.entries(HANDS.hands)) prot[n] = scr(h.box);
  // phone: only the part of a protected box that the band shows can be covered; faces must be whole or fully out
  const faceFrame = {}, protFull = Object.assign({}, prot);
  if (T.mode === "phone") for (const n of Object.keys(prot)) {
    const b = prot[n], c = clipR;
    if (n.startsWith("face")) faceFrame[n] = (b.left >= c.left && b.right <= c.right && b.top >= c.top && b.bottom <= c.bottom) ? "whole" : inter(b, c) ? "CUT" : "out";
    prot[n] = { left: Math.max(b.left, c.left), top: Math.max(b.top, c.top), right: Math.min(b.right, c.right), bottom: Math.min(b.bottom, c.bottom) };
  }
  const uiBoxes = [];
  textEls.forEach(e => { if (e.closest(".clubPackDoor")) return; const rg = document.createRange(); rg.selectNodeContents(e); const b = rg.getBoundingClientRect(); uiBoxes.push({ kind: "text", what: e.textContent.trim().slice(0, 28), b }); });
  [...document.querySelectorAll("button")].filter(vis).forEach(e => uiBoxes.push({ kind: "control", what: e.id, b: e.getBoundingClientRect() }));
  [".clubCardFace", "#clubRivalryConfirmation", ".clubVs", ".clubRevealProgress", ".clubAssignmentHeader"].forEach(sel => document.querySelectorAll(sel).forEach(e => { if (vis(e)) uiBoxes.push({ kind: "panel", what: sel, b: e.getBoundingClientRect() }); }));
  // decorative covers (dark-glass shapes) count as panels: test the polygons in plate space on a 2 px grid
  const C = T.covers;
  const pip = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const coverPolys = { banner: C.banner, vs: C.vs, panel: C.panel, dock: C.dock, apron: C.apron };
  if (T.mode === "desktop") C.hdr.forEach(([a, b], i) => { coverPolys["hdr" + i] = [[a, 0], [b, 0], [b, 80], [a, 80]]; });
  const coverHits = {};
  const g8 = { face: {}, hand: {}, pack: {}, coverHits };
  const kpx = T.k;
  for (const [pn, pb] of Object.entries(prot)) {
    const isFace = pn.startsWith("face"), isPack = pn.startsWith("pack");
    // only boxes that are on screen (inside the band on phone) matter
    const onScreen = inter(pb, clipR) && inter(pb, { left: 0, top: 0, right: innerWidth, bottom: innerHeight });
    let minD = Infinity, worst = null; const hits = [];
    for (const u of uiBoxes) {
      const d = dist(u.b, pb);
      if (d < minD) { minD = d; worst = u.kind + ":" + u.what; }
      if (inter(u.b, grow(pb, 8))) hits.push(u.kind + ":" + u.what + " d=" + d.toFixed(1));
    }
    // covers vs grown box (plate space; 8 screen px = 8/k plate px)
    const pr = pn.startsWith("hand") ? HANDS.hands[pn].box : P[pn], g = 8 / kpx;
    for (const [cn, poly] of Object.entries(coverPolys)) {
      let hit = 0;
      for (let y = pr[1] - g; y <= pr[3] + g; y += 2) for (let x = pr[0] - g; x <= pr[2] + g; x += 2) if (pip(poly, x, y)) { hit++; }
      if (hit) (coverHits[pn] = coverHits[pn] || []).push(cn + ":" + hit);
    }
    const rec = { onScreen, minClearancePx: minD === Infinity ? null : +minD.toFixed(1), nearest: worst, intersections: hits, coverHits: coverHits[pn] || [] };
    (isFace ? g8.face : isPack ? g8.pack : g8.hand)[pn] = rec;
  }
  // header chrome band vs faces (reported separately)
  const hdr = document.getElementById("topHeader").getBoundingClientRect();
  g8.headerBand = Object.fromEntries(["face_daniel", "face_nik"].map(n => [n, +(prot[n].top - hdr.bottom).toFixed(1)]));
  const bad = [...Object.values(g8.face), ...Object.values(g8.hand), ...Object.values(g8.pack)].filter(v => v.onScreen && (v.intersections.length || v.coverHits.length));
  // JOB-043: the header element itself is transparent after exact scene registration.
  // Painted segmented header-cover polygons are already checked above against the grown protected boxes.
  const hdrStyle = getComputedStyle(document.getElementById("topHeader"));
  const hdrPainted = hdrStyle.backgroundImage !== "none" || parseFloat(hdrStyle.borderBottomWidth || "0") > 0;
  g8.headerBandOverlap = hdrPainted
    ? Object.entries(g8.headerBand).filter(([n, d]) => d < 8 && prot[n].bottom > hdr.bottom).map(([n, d]) => n + " " + d)
    : [];
  // reveal containment (b) and no live UI in pack boxes (c)
  g8.revealContainment = [...document.querySelectorAll(".reveal.on")].map(w => {
    const i = +w.dataset.side, b = w.getBoundingClientRect(), pb = protFull[i ? "pack_nik" : "pack_daniel"];
    const err = Math.max(Math.abs(b.left - pb.left), Math.abs(b.top - pb.top), Math.abs(b.right - pb.right), Math.abs(b.bottom - pb.bottom));
    return { side: i ? "nik" : "daniel", overflow: getComputedStyle(w).overflow, rectErrPx: +err.toFixed(2), pass: getComputedStyle(w).overflow === "hidden" && err < 0.5 };
  });
  g8.phoneFaceFraming = faceFrame;
  g8.pass = !bad.length && !g8.headerBandOverlap.length && g8.revealContainment.every(c => c.pass) && !Object.values(faceFrame).includes("CUT");
  g8.failing = bad.map(v => v.nearest);
  r.G8 = g8; if (!g8.pass) r.fail.push("G8");
  // G9 imagery
  const res = performance.getEntriesByType("resource").map(e => e.name.replace(location.origin, ""));
  const imgs = res.filter(u => /\.(png|webp|jpe?g|avif|gif|svg)(\?|$)/i.test(u));
  const bgs = new Set();
  document.querySelectorAll("*").forEach(e => { const bi = getComputedStyle(e).backgroundImage; if (bi && bi.includes("url(")) bgs.add(bi.replace(location.origin, "")); });
  const allowed = u => /ENV_CLUB_PLATE_V1_[12]X\.(webp|png)/.test(u)
  || /OVL_CLUB_(?:SEAM_MENDS|HAND_CONTACTS|HAND_CORES|DANIEL_(?:TOP|SIDE)_HAND|NIK_(?:TOP|SIDE)_HAND)_V1_[12]X\.webp/.test(u)
  || /^data:image\/svg/.test(u);
  r.G9 = { loaded: imgs, cssBackgrounds: [...bgs], pass: imgs.every(allowed) };
  if (!r.G9.pass) r.fail.push("G9");
  // G10 sides
  const cx = sel => { const e = document.querySelector(sel); if (!vis(e)) return null; const b = e.getBoundingClientRect(); return b.left + b.width / 2; };
  const pairs = [["#clubPlayerOne", "#clubPlayerTwo"], ["#clubNameOne", "#clubNameTwo"], ["#clubCardStateOne", "#clubCardStateTwo"], ["#clubCardOne .clubRevealIndex", "#clubCardTwo .clubRevealIndex"],
    ["#clubCardOne .shieldSlot", "#clubCardTwo .shieldSlot"], ["#clubConfirmationManagerOne", "#clubConfirmationManagerTwo"], ["#clubConfirmationClubOne", "#clubConfirmationClubTwo"],
    [".reveal[data-side='0']", ".reveal[data-side='1']"]];
  const p10 = pairs.map(([a, b]) => { const x = cx(a), y = cx(b); return { a, b, one: x && +x.toFixed(1), two: y && +y.toFixed(1), ok: x == null || y == null || x < y }; });
  r.G10 = { pairs: p10, pass: p10.every(p => p.ok) }; if (!r.G10.pass) r.fail.push("G10");
  // G13 chrome snapshot
  const st = (sel, props) => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return Object.assign({ box: [b.left, b.top, b.width, b.height].map(v => +v.toFixed(1)) }, Object.fromEntries(props.map(p => [p, cs[p]]))); };
  r.G13 = {
    header: st("#topHeader", ["height", "backgroundImage", "borderBottom"]), badge: st(".cmBadge b", ["fontFamily", "fontSize", "fontStyle", "color"]),
    brand: st(".brand h1", ["fontSize", "letterSpacing", "color"]), identity: st("#onlinePlayerIdentityBadge", ["fontFamily", "fontSize", "minHeight", "background", "borderTop"]),
    season: st("#seasonIndicator", ["fontSize", "minHeight"]), footer: st("footer", ["height", "display"]),
  };
  return r;
}

/* zone edge coverage: which intake-zone edges remain visible after covers/chrome (plate px samples) */
function zoneCoverage() {
  const Q = window.ClubQA, T = Q.T, MAP = Q.MAP, C = T.covers;
  const pip = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const polys = [C.banner, C.vs, C.panel, C.dock, C.apron];
  if (T.mode === "desktop") C.hdr.forEach(([a, b]) => polys.push([[a, 0], [b, 0], [b, 80], [a, 80]]));
  const inBox = (b, x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
  const P = Object.values(MAP.protected_boxes);
  const hdrH = document.getElementById("topHeader").getBoundingClientRect().bottom;
  const docH = document.documentElement.classList.contains("scrolly") ? document.documentElement.scrollHeight : innerHeight;
  const ft = document.querySelector("footer"); const ftTop = getComputedStyle(ft).display === "none" ? innerHeight : ft.getBoundingClientRect().top;
  const clip = T.clip;
  const res = [];
  for (const z of MAP.remove_rects) {
    const edges = { L: [[z[0], z[1]], [z[0], z[3]]], R: [[z[2], z[1]], [z[2], z[3]]], T: [[z[0], z[1]], [z[2], z[1]]], B: [[z[0], z[3]], [z[2], z[3]]] };
    const zr = { zone: z, edges: {} };
    for (const [en, [[x0, y0], [x1, y1]]] of Object.entries(edges)) {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
      let vis = 0, segs = [], cur = null;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        const [sx, sy] = Q.plateToScreen(x, y);
        const offscreen = sx < clip[0] || sx > clip[0] + clip[2] || sy < clip[1] || sy > clip[1] + clip[3] || sx < 0 || sx > innerWidth || sy < 0 || sy > docH;
        const chrome = sy <= hdrH || sy >= ftTop;
        const protectedPx = P.some(b => inBox(b, x, y));   // intake hard-restored these pixels: no zone edge there
        const covered = polys.some(p => pip(p, x, y));
        const v = !(offscreen || chrome || protectedPx || covered);
        if (v) { vis++; if (!cur) cur = [x, y, x, y]; else { cur[2] = x; cur[3] = y; } } else if (cur) { segs.push(cur); cur = null; }
      }
      if (cur) segs.push(cur);
      zr.edges[en] = { visiblePlatePx: vis * 2, segments: segs.map(s => s.map(v => Math.round(v))) };
    }
    // protected-box seams that bound the zone (zone pixels next to restored originals)
    res.push(zr);
  }
  return res;
}

async function canvasDiff(page, aB64, bB64, polysScreen, dpr) {
  // max abs RGB difference and count of changed px (>2) inside polygons eroded by 1.5 css px
  return page.evaluate(async ({ aB64, bB64, polysScreen, dpr }) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
    const [A, B] = await Promise.all([load(aB64), load(bB64)]);
    const c = document.createElement("canvas"); c.width = A.width; c.height = A.height; const g = c.getContext("2d");
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
    const m = document.createElement("canvas"); m.width = c.width; m.height = c.height; const mg = m.getContext("2d");
    mg.fillStyle = "#fff";
    polysScreen.forEach(p => { mg.beginPath(); p.forEach(([x, y], i) => i ? mg.lineTo(x * dpr, y * dpr) : mg.moveTo(x * dpr, y * dpr)); mg.closePath(); mg.fill(); });
    // erode: stroke the outline in black
    mg.strokeStyle = "#000"; mg.lineWidth = 3 * dpr;
    polysScreen.forEach(p => { mg.beginPath(); p.forEach(([x, y], i) => i ? mg.lineTo(x * dpr, y * dpr) : mg.moveTo(x * dpr, y * dpr)); mg.closePath(); mg.stroke(); });
    const mk = mg.getImageData(0, 0, m.width, m.height).data;
    let n = 0, changed = 0, maxd = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (mk[i] < 250) continue; n++;
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > maxd) maxd = d; if (d > 2) changed++;
    }
    return { pixelsChecked: n, changedPx: changed, maxAbsDiff: maxd };
  }, { aB64, bB64, polysScreen, dpr });
}

async function contrast(page, dpr) {
  // G7 brightest-background-pixel method: render once with text hidden, sample each text box.
  const items = await page.evaluate(() => {
    const out = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
    while (tw.nextNode()) {
      const n = tw.currentNode, p = n.parentElement; if (!n.textContent.trim() || p.closest("svg") || seen.has(p)) continue;
      if (!p.getClientRects().length) continue;
      let hidden = false; for (let e = p; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || cs.clipPath === "inset(50%)") hidden = true; }
      if (hidden) continue; seen.add(p);
      const cs = getComputedStyle(p); const rg = document.createRange(); rg.selectNodeContents(n); const b0 = rg.getBoundingClientRect(); if (b0.width < 2) continue;
      const b = { left: b0.left + 1, top: b0.top + 1, width: b0.width - 2, height: b0.height - 2 };
      // gradient-filled titles: use the darkest gradient stop as the text colour (conservative)
      let col = cs.webkitTextFillColor && !cs.webkitTextFillColor.includes("0)") ? cs.webkitTextFillColor : cs.color;
      if (cs.webkitTextFillColor && /rgba\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor)) col = "rgb(185,138,47)";
      const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
      out.push({ t: n.textContent.trim().slice(0, 32), rect: [b.left, b.top, b.width, b.height], L: lum(col), large: fs >= 24 || (fs >= 18.66 && fw >= 700) });
    }
    document.documentElement.classList.add("qa-notext");
    return out;
  });
  const full = await page.evaluate(() => document.documentElement.classList.contains("scrolly"));
  const png = (await page.screenshot({ type: "png", fullPage: full })).toString("base64");
  await page.evaluate(() => document.documentElement.classList.remove("qa-notext"));
  return page.evaluate(async ({ png, items, dpr }) => {
    const i = await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = "data:image/png;base64," + png; });
    const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const g = c.getContext("2d"); g.drawImage(i, 0, 0);
    const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return items.map(it => {
      const [x, y, w, h] = it.rect.map(v => Math.round(v * dpr));
      const xx = Math.max(0, x), yy = Math.max(0, y), ww = Math.min(c.width - xx, w), hh = Math.min(c.height - yy, h);
      if (ww <= 0 || hh <= 0) return Object.assign(it, { ratio: null });
      const d = g.getImageData(xx, yy, ww, hh).data; let max = 0, min = 1;
      for (let k = 0; k < d.length; k += 4) { const L = .2126 * f(d[k]) + .7152 * f(d[k + 1]) + .0722 * f(d[k + 2]); if (L > max) max = L; if (L < min) min = L; }
      // light text: worst case is the brightest background pixel; dark text (buttons): the darkest
      const dark = it.L < 0.2;
      const ratio = dark ? (min + .05) / (it.L + .05) : (it.L + .05) / (max + .05);
      const need = it.large ? 3 : 4.5;
      return { t: it.t, ratio: +ratio.toFixed(2), need, pass: ratio >= need };
    });
  }, { png, items, dpr });
}

(async () => {
  const browser = await chromium.launch();
  const report = { generated: new Date().toISOString(), base, intakeSha: INTAKE_SHA, shots: [], owner3: {}, zoneCoverage: {}, summary: {} };
  const plateSha = {};
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.vw, height: v.vh }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: v.mobile });
    for (const frame of FRAMES) {
      const page = await ctx.newPage();
      const errors = [], failed = [];
      page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", e => errors.push("pageerror: " + e.message));
      page.on("requestfailed", q => failed.push(q.url()));
      page.on("response", async resp => {
        const u = resp.url(); const m = u.match(/(ENV_CLUB_PLATE_V1_[12]X\.(?:png|webp))$/);
        if (m && !plateSha[m[1]]) { try { plateSha[m[1]] = crypto.createHash("sha256").update(await resp.body()).digest("hex"); } catch (e) {} }
        if (resp.status() >= 400) failed.push(u + " " + resp.status());
      });
      await page.goto(`${base}index.html?frame=${frame}`);
      await page.waitForFunction(() => document.documentElement.classList.contains("ready"), null, { timeout: 15000 });
      await page.waitForTimeout(250);
      const r = await page.evaluate(measure, { fx, frame, mobile: v.mobile, PRODUCT_IDS });
      Object.assign(r, { vw: v.vw, vh: v.vh, dpr: v.dpr, mobile: v.mobile, shot: name(frame, v) });
      r.G7 = await contrast(page, v.dpr);
      const g7fail = r.G7.filter(x => x.ratio != null && !x.pass);
      r.G7summary = { checked: r.G7.length, failing: g7fail };
      if (g7fail.length) r.fail.push("G7");
      // G11 tab order
      const tab = await page.evaluate(() => {
        const vis = e => e.getClientRects().length && !e.disabled && getComputedStyle(e).visibility !== "hidden";
        const els = [...document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]")].filter(vis);
        const exp = els.map(e => ({ id: e.id, b: e.getBoundingClientRect() })).sort((a, b) => (Math.abs(a.b.top - b.b.top) > 12 ? a.b.top - b.b.top : a.b.left - b.b.left)).map(e => e.id);
        return exp;
      });
      const seq = [];
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      for (let i = 0; i < tab.length; i++) { await page.keyboard.press("Tab"); seq.push(await page.evaluate(() => document.activeElement && document.activeElement.id)); }
      r.G11 = { expected: tab, actual: seq, pass: JSON.stringify(tab) === JSON.stringify(seq) };
      if (!r.G11.pass) r.fail.push("G11");
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await page.screenshot({ path: path.join(out, r.shot), type: "jpeg", quality: 86 });
      if (r.G3.shortDesktopScroll) { r.fullPageShot = name(frame, v, "_fullpage"); await page.screenshot({ path: path.join(out, r.fullPageShot), type: "jpeg", quality: 86, fullPage: true }); }
      r.zones = await page.evaluate(zoneCoverage);
      r.G12 = { consoleErrors: errors, failedRequests: failed, pass: !errors.length && !failed.length };
      if (!r.G12.pass) r.fail.push("G12");
      report.shots.push(r);
      console.log(r.shot, r.fail.length ? "FAIL " + r.fail.join(",") : "ok");
      await page.close();
    }
    await ctx.close();
  }
  // G10 plate hash
  report.plateSha = plateSha;
  const shaOk = Object.entries(plateSha).every(([n, h]) => INTAKE_SHA[n] === h) && Object.keys(plateSha).length > 0;
  report.summary.G10_plateSha = { loaded: plateSha, pass: shaOk };

  // grid evidence + plate-only evidence
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    for (const [q, f] of [["frame=CL1&grid=1", "CL1_1366x768_grid.jpg"], ["frame=S0", "S0_1366x768_plate_only.jpg"], ["frame=CL6&grid=1", "CL6_1366x768_grid.jpg"]]) {
      await page.goto(`${base}index.html?${q}`); await page.waitForFunction(() => document.documentElement.classList.contains("ready"));
      await page.waitForTimeout(200); await page.screenshot({ path: path.join(out, f), type: "jpeg", quality: 88 });
    }
    await ctx.close();
  }

  // OWNER-3 pack-rip QA: frame strips + hand overlay registration/occlusion + reduced motion end state
  for (const v of [D(1366, 768), M(390, 844)]) {
    const ctx = await browser.newContext({ viewport: { width: v.vw, height: v.vh }, deviceScaleFactor: v.dpr, isMobile: v.mobile, hasTouch: v.mobile });
    const page = await ctx.newPage();
    const key = `${v.vw}x${v.vh}`; report.owner3[key] = {};
    for (const frame of ["CL3", "CL4", "CL5", "CL6"]) {
      await page.goto(`${base}index.html?frame=${frame}&t=0`); await page.waitForFunction(() => document.documentElement.classList.contains("ready"));
      await page.waitForTimeout(200);
      const geo = await page.evaluate(() => {
        const Q = window.ClubQA, k = Q.T.k;
        const packs = ["pack_daniel", "pack_nik"].map(n => Q.rectToScreen(Q.MAP.protected_boxes[n]));
        const hands = Object.entries(Q.HANDS.hands).map(([n, h]) => ({ n, poly: h.polygon.map(([x, y]) => Q.plateToScreen(x, y)), overlap: h.pack_overlap_box,
cutoutOk: (() => { const el=document.querySelector(`.handOv[data-hand="${n}"]`); return !!el && el.dataset.cutout==="1" && getComputedStyle(el).backgroundImage.includes("OVL_CLUB_"); })() }));
        const base = document.querySelector(".plateBase").getBoundingClientRect();
        const regErr = [...document.querySelectorAll(".handOv")].map(o => { const b = o.getBoundingClientRect(); return Math.max(Math.abs(b.left - base.left), Math.abs(b.top - base.top), Math.abs(b.width - base.width), Math.abs(b.height - base.height)); });
        // hand overlays are later in the world than every reveal layer (paint order = DOM order, no z-index)
        const world = document.getElementById("world"); const kids = [...world.children];
        const lastReveal = Math.max(...kids.map((c, i) => c.classList.contains("reveal") ? i : -1)), firstHand = kids.findIndex(c => c.classList.contains("handOv"));
        const strip = packs.reduce((a, b) => ({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) }));
        return { packs, hands, regErrPx: Math.max(...regErr), handsAbove: firstHand > lastReveal, strip: [strip.left, strip.top, strip.right - strip.left, strip.bottom - strip.top], clip: Q.T.clip };
      });
      const clip = { x: Math.max(geo.clip[0], geo.strip[0] - 30), y: Math.max(geo.clip[1], geo.strip[1] - 20), width: 0, height: 0 };
      clip.width = Math.min(geo.clip[0] + geo.clip[2], geo.strip[0] + geo.strip[2] + 30) - clip.x; clip.height = Math.min(geo.clip[1] + geo.clip[3], geo.strip[1] + geo.strip[3] + 20) - clip.y;
      // reference: same page with the reveal hidden = plate pixels only under the hands
      await page.evaluate(() => document.documentElement.classList.add("qa-noreveal"));
      const ref = (await page.screenshot({ type: "png" })).toString("base64");
      await page.evaluate(() => document.documentElement.classList.remove("qa-noreveal"));
      const strip = [], occl = [];
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        await page.evaluate(t => window.ClubQA.setT(t), t); await page.waitForTimeout(60);
        const full = (await page.screenshot({ type: "png" })).toString("base64");
        const d = await canvasDiff(page, ref, full, geo.hands.map(h => h.poly), v.dpr);
        occl.push(Object.assign({ t }, d));
        strip.push((await page.screenshot({ type: "png", clip })).toString("base64"));
      }
      // compose the strip in-page
      const stripName = `RIP_${frame}_${key}_strip.jpg`;
      const b64 = await page.evaluate(async (imgs) => {
        const ims = await Promise.all(imgs.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; })));
        const w = ims[0].width, h = ims[0].height, gap = 8, lab = 34;
        const c = document.createElement("canvas"); c.width = w; c.height = (h + lab + gap) * ims.length; const g = c.getContext("2d");
        g.fillStyle = "#111"; g.fillRect(0, 0, c.width, c.height);
        ims.forEach((im, i) => { const y = i * (h + lab + gap); g.fillStyle = "#F2C45B"; g.font = "bold 24px sans-serif"; g.fillText(["0%", "25%", "50%", "75%", "100%"][i], 10, y + 26); g.drawImage(im, 0, y + lab); });
        return c.toDataURL("image/jpeg", .86).split(",")[1];
      }, strip);
      fs.writeFileSync(path.join(out, stripName), Buffer.from(b64, "base64"));
      // reduced motion: end state equals the normal end state inside the pack boxes; mid-crossfade evidence
      await page.evaluate(() => window.ClubQA.setT(1));
      const endNormal = (await page.screenshot({ type: "png" })).toString("base64");
      await page.goto(`${base}index.html?frame=${frame}&rm=1&t=1`); await page.waitForFunction(() => document.documentElement.classList.contains("ready")); await page.waitForTimeout(150);
      const endRm = (await page.screenshot({ type: "png" })).toString("base64");
      const packPolys = geo.packs.map(p => [[p.left, p.top], [p.right, p.top], [p.right, p.bottom], [p.left, p.bottom]]);
      const rmDiff = await canvasDiff(page, endNormal, endRm, packPolys, v.dpr);
      await page.screenshot({ path: path.join(out, `RIP_${frame}_${key}_reduced_motion_end.jpg`), type: "jpeg", quality: 86 });
      await page.goto(`${base}index.html?frame=${frame}&rm=1&t=0.5`); await page.waitForFunction(() => document.documentElement.classList.contains("ready")); await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(out, `RIP_${frame}_${key}_reduced_motion_mid.jpg`), type: "jpeg", quality: 86 });
      const handOverlap = geo.hands.map(h => ({ hand: h.n, packBoxOverlapPlatePx: h.overlap, registeredCutout: h.cutoutOk }));
      report.owner3[key][frame] = {
        strip: stripName,
        q1_containment: "reveal layers live in .reveal (overflow:hidden) sized to the pack box via plateToScreen; see shots[].G8.revealContainment",
        q2_overlap: handOverlap,
        q3_overlapCoveredByOverlay: handOverlap.every(h => h.registeredCutout) && geo.handsAbove,
        q4_registrationErrPx: geo.regErrPx,
        q5_revealPixelsAboveHands: occl,
        q5_rasterFloor: { changedPx: occl[0]?.changedPx || 0, maxAbsDiff: occl[0]?.maxAbsDiff || 0 },
        q5_pass: (() => {
          const b = occl[0] || { changedPx: 0, maxAbsDiff: 0 };
          // OWNER-3 measures reveal leakage. Treat only a proven t=0 compositor floor as noise:
          // at most one physical pixel, at most three RGB levels, and no reveal frame may exceed it.
          if (b.changedPx > 1 || b.maxAbsDiff > 3) return false;
          return occl.every(o => o.changedPx <= b.changedPx && o.maxAbsDiff <= b.maxAbsDiff);
        })(),
        q8_reducedMotion: { endStateDiffInPackBoxes: rmDiff, evidence: [`RIP_${frame}_${key}_reduced_motion_mid.jpg`, `RIP_${frame}_${key}_reduced_motion_end.jpg`] },
      };
      console.log("OWNER-3", key, frame, "reg", geo.regErrPx, "occl", occl.map(o => o.changedPx).join("/"), "rm", rmDiff.changedPx);
    }
    await ctx.close();
  }
  await browser.close();
  // summary
  const gates = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
  for (const g of gates) report.summary[g] = { failing: report.shots.filter(s => s.fail.includes(g)).map(s => s.shot) };
  report.summary.shots = report.shots.length;
  report.summary.shotsAllPass = report.shots.filter(s => !s.fail.length).length;
  fs.writeFileSync(path.join(out, "qa_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(Object.fromEntries(gates.map(g => [g, report.summary[g].failing.length])), null, 0), "plateSha", shaOk);
})();
