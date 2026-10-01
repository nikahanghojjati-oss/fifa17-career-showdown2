/* LEAGUE-V1 · static checkpoint prototype. Frames: ?frame=L1|L2|L3|L4, &grid=1 overlays platemap boxes.
   One plate-mapping helper (C4b): plateToScreen(x, y) is used for every plate-registered thing. */
(() => {
  "use strict";
  const PW = 1536, PH = 864;
  const SLOT = { cx: 762, cy: 496, r: 240 };          // wheel slot centre + rim radius (plate px)
  const BEZEL = 268 / 240, POINTER = 36 / 240;         // bezel outer radius / pointer rise, as fractions of R
  const LABEL_REACH = 0.78;                            // lowest live label pixel below centre, fraction of R
  const VEIL_R = 272;                                  // slot veil radius (plate px)
  const PHONE_X = [195, 1280], PHONE_Y_TOP = 70, PHONE_HAND_CUT_Y = 400; // phone band crop (plate px)
  const q = (s) => document.querySelector(s);
  const stage = q("#stage-root");
  const params = new URLSearchParams(location.search);
  let frameId = params.get("frame") || "L1";
  stage.dataset.frame = frameId;
  if (params.get("grid") === "1") stage.dataset.grid = "1";

  // stage -> plate transform (k, offsets) for the current layout; the phone band writes its own values
  const T = { k: 1, ox: 0, oy: 0 };
  function plateToScreen(x, y) { return { x: T.ox + x * T.k, y: T.oy + y * T.k }; }
  function plateRect(r) { const a = plateToScreen(r[0], r[1]), b = plateToScreen(r[2], r[3]); return { l: a.x, t: a.y, r: b.x, b: b.y }; }

  let FX, MAP;
  const px = (v) => `${v}px`;
  // measurements relative to the stage (equal to viewport coords in the prototype, where the stage is at 0,0)
  function rel(el) { const b = el.getBoundingClientRect(), o = stage.getBoundingClientRect(); return { top: b.top - o.top, bottom: b.bottom - o.top, height: b.height }; }
  function box(el, l, t, w, h) { Object.assign(el.style, { left: px(l), top: px(t), width: px(w), height: px(h) }); }

  /* ---------- frame state: strings exactly as js/leagueWheel.js sets them ---------- */
  function applyFrame() {
    const f = FX.frames[frameId] || FX.frames.L1;
    const track = q("#leagueWheel .wheelTrack");
    const items = [...track.querySelectorAll(".wheelItem")];
    items.forEach((el, i) => { el.textContent = FX.leagues[i].name; });
    const missing = [];
    items.forEach((el, i) => {
      if (typeof window.applyLeagueMark === "function") window.applyLeagueMark(el, FX.leagues[i].id);
      if (!el.dataset.leagueMark) missing.push(FX.leagues[i].id);
    });
    stage.dataset.missingMarks = missing.join(",");
    track.style.setProperty("--rot", `${f.rotation}deg`);
    track.style.transform = `rotate(${f.rotation}deg)`;          // same transform production sets
    // the segment under the fixed wedge at 12 o'clock
    let top = 0, best = 999;
    items.forEach((el, i) => {
      const a = (((i * 72 + f.rotation) % 360) + 360) % 360, d = Math.min(a, 360 - a);
      if (d < best) { best = d; top = i; }
    });
    items.forEach((el, i) => el.classList.toggle("is-top", i === top && best <= 36));

    q("#selectedLeague").textContent = f.selectedLeague;
    stage.dataset.hasLeague = f.selected ? "true" : "false";
    const spin = q("#spinLeague");
    spin.textContent = f.spin;
    spin.disabled = !!f.spinDisabled;
    const note = q("#leagueStateNote");
    note.textContent = f.note || "";
    note.classList.toggle("hidden", !f.note);
    note.classList.toggle("locked", !!f.noteLocked);
    const back = q("#leagueWheelScreen .backButton");
    back.disabled = !!f.backDisabled;
    if (f.state === "spinning") back.setAttribute("aria-disabled", "true");
    else if (f.state === "selected") back.setAttribute("aria-disabled", "false");
    q("#onlinePlayerIdentityBadge").textContent = FX.chrome.identityBadge;
    q("#seasonIndicator").textContent = FX.chrome.seasonIndicator;
  }

  /* ---------- static wheel art (aria-hidden SVG): rim, studs, inner ring, hub ---------- */
  function buildWheelArt() {
    const studs = Array.from({ length: 20 }, (_, i) => {
      const a = (i * 18 - 90) * Math.PI / 180, r = 231;
      return `<circle cx="${(240 + r * Math.cos(a)).toFixed(2)}" cy="${(240 + r * Math.sin(a)).toFixed(2)}" r="3.2" fill="url(#stud)" stroke="#5c421a" stroke-width=".8"/>`;
    }).join("");
    q(".wheel-rim").innerHTML = `<svg viewBox="0 0 480 480" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="rimg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#C99B45"/><stop offset="1" stop-color="#7A5A22"/></linearGradient>
      <radialGradient id="stud" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#FFF6D2"/><stop offset=".6" stop-color="#D9AE52"/><stop offset="1" stop-color="#6E5020"/></radialGradient></defs>
      <circle cx="240" cy="240" r="231" fill="none" stroke="url(#rimg)" stroke-width="18"/>
      <circle cx="240" cy="240" r="239.2" fill="none" stroke="#5a4118" stroke-width="1.6" opacity=".9"/>
      <circle cx="240" cy="240" r="221" fill="none" stroke="#07080a" stroke-width="2.4"/>
      <circle cx="240" cy="240" r="219" fill="none" stroke="rgba(242,196,91,.45)" stroke-width="1"/>${studs}</svg>`;
    q(".wheel-hub").innerHTML = `<svg viewBox="0 0 480 480" aria-hidden="true" focusable="false"><defs>
      <radialGradient id="hubg" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#23272e"/><stop offset="1" stop-color="#0a0b0d"/></radialGradient></defs>
      <circle cx="240" cy="240" r="52.8" fill="url(#hubg)" stroke="url(#rimg)" stroke-width="4"/>
      <circle cx="240" cy="240" r="47" fill="none" stroke="rgba(242,196,91,.35)" stroke-width="1"/>
      <path d="M216 252l-6-28 16 12 14-22 14 22 16-12-6 28z" fill="url(#rimg)" stroke="#6E5020" stroke-width="1"/>
      <rect x="216" y="255" width="48" height="6" rx="1.5" fill="url(#rimg)"/></svg>`;
  }

  /* ---------- layout ---------- */
  function placeScene(sceneEl, l, t, w, h) { box(sceneEl, l, t, w, h); }
  function placePlateLayers(origin) {
    const pl = plateToScreen(0, 0);
    box(q(".plate"), pl.x - origin.x, pl.y - origin.y, PW * T.k, PH * T.k);
    const heal = (sel, r) => { const R = plateRect(r); box(q(sel), R.l - origin.x, R.t - origin.y, R.r - R.l, R.b - R.t); };
    heal(".heal-head", [0, 0, 1536, 92]);
    heal(".heal-title", [440, 40, 1072, 290]);
    heal(".heal-deck", [440, 700, 1080, 846]);
    heal(".heal-foot", [0, 776, 1536, 864]);
    const c = plateToScreen(SLOT.cx, SLOT.cy);
    box(q(".slot-veil"), c.x - VEIL_R * T.k - origin.x, c.y - VEIL_R * T.k - origin.y, 2 * VEIL_R * T.k, 2 * VEIL_R * T.k);
    const kr = MAP.keep_rects[0], f = plateRect(kr);
    box(q(".finger-ovl"), f.l - origin.x, f.t - origin.y, f.r - f.l, f.b - f.t);
  }

  function placeWheel(cx, cy, R) {
    stage.style.setProperty("--R", px(R));
    box(q("#leagueWheel"), cx - R, cy - R, 2 * R, 2 * R);
    const rb = R * BEZEL;
    box(q(".wheel-bezel"), cx - rb, cy - rb, 2 * rb, 2 * rb);
    // pointer: gold chevron + crown at 12 o'clock, sitting on the rim (44 x 62 plate px at R = 240)
    const pw = R * 44 / 240, ph = R * 62 / 240;
    box(q(".wheelPointer"), cx - pw / 2, cy - R - R * POINTER, pw, ph);
    Object.assign(stage.dataset, { wheelCx: cx.toFixed(2), wheelCy: cy.toFixed(2), wheelR: R.toFixed(2) });
  }

  function layoutDesktop(W, H) {
    const hdr = 56, ftr = 28;
    const k = Math.max(W / PW, H / PH);
    let ox = (W - PW * k) / 2, oy = (H - PH * k) / 2;
    // vertical bias: keep both faces >= 8 px below the header (C4b: offsets follow the position)
    const faceTop = Math.min(MAP.protected_boxes.face_daniel[1], MAP.protected_boxes.face_nik[1]);
    const minOy = hdr + 8 - faceTop * k;
    if (oy < minOy) oy = Math.min(0, minOy);
    Object.assign(T, { k, ox, oy });
    stage.dataset.mode = "desktop";
    placeScene(q(".scene"), 0, 0, W, H); placeScene(q(".scene-top"), 0, 0, W, H);
    q(".scene").style.removeProperty("-webkit-mask-image"); q(".scene").style.removeProperty("mask-image");
    placePlateLayers({ x: 0, y: 0 });

    const s = k / (1366 / PW);
    const short = H < 700;
    q("#leagueWheelScreen h2").style.setProperty("--title-size", px(Math.round((short ? 60 : 72) * Math.min(Math.max(s, 1), 1.25))));
    const tb = q(".title-block");
    const kickerTop = Math.max(hdr + (short ? 6 : 12), oy + 86 * k);
    tb.style.top = px(kickerTop);
    const h2b = rel(q("#leagueWheelScreen h2"));
    const sub = q(".subtitle-row");
    // the h2 line box carries ~0.2em of italic-glyph headroom (G5); tuck the subtitle into it
    const ts = parseFloat(getComputedStyle(q("#leagueWheelScreen h2")).fontSize);
    sub.style.top = px(h2b.bottom - ts * 0.16);
    const titleBottom = rel(sub).bottom;

    const row = q(".button-row");
    const btnTop = Math.min(oy + 743 * k, H - ftr - (short ? 8 : 12) - 56);
    row.style.top = px(btnTop);
    const note = q("#leagueStateNote");
    let noteTop = null;
    if (!note.classList.contains("hidden")) {
      const nh = note.getBoundingClientRect().height;
      noteTop = btnTop - 8 - nh;
      note.style.top = px(noteTop);
    }

    const Rfull = SLOT.r * k, c = plateToScreen(SLOT.cx, SLOT.cy);
    const topLimit = titleBottom + 4;
    const fits = (cy, R) => cy - R * (1 + POINTER) >= topLimit && cy + R <= btnTop - 4 && (noteTop === null || cy + R * LABEL_REACH <= noteTop - 2);
    let R = Rfull, cy = c.y;
    if (!fits(cy, R)) {
      const spanA = (btnTop - 4 - topLimit) / (2 + POINTER);
      const spanB = noteTop === null ? Infinity : (noteTop - 2 - topLimit) / (1 + POINTER + LABEL_REACH);
      R = Math.max(0.8 * Rfull, Math.min(Rfull, spanA, spanB));
      const lo = topLimit + R * (1 + POINTER), hi = Math.min(btnTop - 4 - R, noteTop === null ? Infinity : noteTop - 2 - R * LABEL_REACH);
      cy = hi >= lo ? Math.min(Math.max(c.y, lo), hi) : lo;
    }
    placeWheel(c.x, cy, R);
    const onSlot = Math.abs(R - Rfull) < 0.5 && Math.abs(cy - c.y) < 0.5;
    stage.dataset.onSlot = String(onSlot);
    stage.dataset.wheelScale = (R / Rfull).toFixed(3);
    q(".slot-veil").style.display = onSlot ? "none" : "";
    q(".finger-ovl").style.display = "";

    // slogan boxes cover the goal's slogan zones (remove_rects 4 and 5) at their goal positions
    const zl = plateRect(MAP.remove_rects[4]), zr = plateRect(MAP.remove_rects[5]);
    const grow = 6, maxBottom = H - ftr - 8;
    for (const [sel, z] of [[".slogan-left", zl], [".slogan-right", zr]]) {
      const h = z.b - z.t + 2 * grow, t = Math.min(z.t - grow, maxBottom - h);
      box(q(sel), z.l - grow, t, z.r - z.l + 2 * grow, h);
    }
  }

  function layoutPhone(W, H) {
    const hdr = 48;
    stage.dataset.mode = "phone";
    q("#leagueWheelScreen h2").style.removeProperty("--title-size");
    const kb = W / (PHONE_X[1] - PHONE_X[0]);
    const tb = q(".title-block");
    tb.style.top = px(hdr + 6);
    const h2b = rel(q("#leagueWheelScreen h2"));
    const sub = q(".subtitle-row");
    sub.style.top = px(h2b.bottom + 2);
    const bandTop = rel(sub).bottom + 4;
    Object.assign(T, { k: kb, ox: -PHONE_X[0] * kb, oy: bandTop - PHONE_Y_TOP * kb });

    const row = q(".button-row");
    const rowH = 48 * 2 + 8, btnTop = H - 12 - rowH;
    row.style.top = px(btnTop);
    const note = q("#leagueStateNote");
    // Phone band: plate y 70..400 keeps both faces whole and ends above Daniel's hand box (- 8 px),
    // so the wheel can overlap the band's lower centre without touching any hand. The finger overlay
    // is hidden on phone (W5: overlay cannot stay aligned with a 220-250 px wheel).
    const bandBottom = plateToScreen(0, PHONE_HAND_CUT_Y).y;
    const noteH = note.classList.contains("hidden") ? 0 : note.getBoundingClientRect().height;
    const deckTop = noteH ? btnTop - 8 - noteH : btnTop;
    // The wheel hides the plate slot dome: its bezel must cover the slot circle (r 250) wherever it sits,
    // and it must stay >= 8 px clear of both face boxes. Largest radius that satisfies both wins.
    const slotC = plateToScreen(SLOT.cx, SLOT.cy), slotR = 250 * T.k, domeTop = slotC.y - slotR;
    const hi = deckTop - 8;
    const faces = ["face_daniel", "face_nik"].map((n) => plateRect(MAP.protected_boxes[n]));
    const clear = (cx, cy, rb) => faces.every((r) => { const nx = Math.max(r.l - 8, Math.min(cx, r.r + 8)), ny = Math.max(r.t - 8, Math.min(cy, r.b + 8)); return Math.hypot(cx - nx, cy - ny) > rb; });
    let R = 80, cy = hi - 80 * BEZEL;
    for (let r = Math.min(Math.max(110, W * 0.34), 150); r >= 80; r -= 0.5) {
      const rb = r * BEZEL, c = Math.min(domeTop + rb, hi - rb);
      if (rb + 1 >= slotR + Math.abs(c - slotC.y) && clear(slotC.x, c, rb)) { R = r; cy = c; break; }
    }
    if (noteH) note.style.top = px(btnTop - 8 - noteH);
    placeWheel(slotC.x, cy, R);
    stage.dataset.phoneWheelD = String(Math.round(2 * R));
    const sc = q(".scene"), st = q(".scene-top");
    placeScene(sc, 0, bandTop, W, bandBottom - bandTop); placeScene(st, 0, bandTop, W, bandBottom - bandTop);
    const fade = "linear-gradient(to bottom, #000 calc(100% - 28px), transparent)";
    for (const el of [sc, st]) { el.style.webkitMaskImage = fade; el.style.maskImage = fade; }
    placePlateLayers({ x: 0, y: bandTop });
    q(".slot-veil").style.display = "";
    q(".finger-ovl").style.display = "none";
    stage.dataset.onSlot = "false";
    stage.dataset.handVisible = "false";
    stage.dataset.band = [0, Math.round(bandTop), W, Math.round(bandBottom)].join(",");
    stage.dataset.bandPlateY = [PHONE_Y_TOP, Math.round((bandBottom - T.oy) / kb)].join(",");
  }

  function drawGrid() {
    const g = q(".grid-layer");
    if (stage.dataset.grid !== "1") return;
    g.innerHTML = "";
    const add = (r, color, label) => { const R = plateRect(r); const d = document.createElement("div"); box(d, R.l, R.t, R.r - R.l, R.b - R.t); d.style.borderColor = color; d.style.color = color; d.textContent = label; g.appendChild(d); };
    Object.entries(MAP.protected_boxes).forEach(([k2, r]) => add(r, "#ff4d6d", k2));
    MAP.keep_rects.forEach((r) => add(r, "#38f2a6", "keep"));
    MAP.remove_rects.forEach((r) => add(r, "rgba(120,200,255,.8)", ""));
    const [cx, cy, rr] = MAP.remove_circles_cx_cy_r[0];
    const c = plateToScreen(cx, cy), d = document.createElement("div");
    box(d, c.x - rr * T.k, c.y - rr * T.k, 2 * rr * T.k, 2 * rr * T.k); d.style.borderRadius = "50%"; d.style.borderColor = "#7cd4ff"; g.appendChild(d);
  }

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;   // = viewport in the prototype (stage is fixed, inset 0)
    stage.dataset.wide = W >= 1200 ? "1" : "0";
    stage.dataset.narrow = W < 900 ? "1" : "0";
    if (W <= 760 && H > W) layoutPhone(W, H); else layoutDesktop(W, H);
    stage.dataset.k = T.k.toFixed(5); stage.dataset.ox = T.ox.toFixed(2); stage.dataset.oy = T.oy.toFixed(2);
    drawGrid();
  }

  async function main() {
    FX = window.LEAGUE_FX || await (await fetch("fixtures.json")).json();
    MAP = window.LEAGUE_MAP || await (await fetch("assets/platemap.json")).json();
    window.LEAGUE_MAP_FOR_QA = MAP;
    buildWheelArt();
    applyFrame();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    layout();
    addEventListener("resize", layout);
    if (window.LEAGUE_PREVIEW) { window.__leagueReady = true; return; }
    const img = new Image();
    img.onload = img.onerror = () => { window.__leagueReady = true; };
    img.src = devicePixelRatio > 1 ? "assets/ENV_LEAGUE_PLATE_V1_2X.webp" : "assets/ENV_LEAGUE_PLATE_V1_1X.webp";
  }
  function setFrame(id) { frameId = id; stage.dataset.frame = id; applyFrame(); layout(); }
  window.LeagueV1 = { plateToScreen, T, SLOT, main, setFrame, layout };
  if (!window.LEAGUE_DEFER_MAIN) main();
})();
