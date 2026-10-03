// HOME-V1 · Rivalry Headquarters on the Home plate.
// Frames: ?frame=HM1|HM2|HM3|S0 · &grid=1 overlays platemap boxes · &mends=0 switches seam mends off (evidence only).
(function () {
  "use strict";
  const PW = 1672, PH = 941;
  const HOME_MOTION = Object.freeze({
    manager: Object.freeze({
      durationMs: 450,
      easing: "cubic-bezier(.22,1,.36,1)",
      danielSettlePx: 2
    })
  });
  let motionLoadPromise = null;

  function applyHomeMotionConstants(root) {
    root.style.setProperty("--home-manager-duration", HOME_MOTION.manager.durationMs + "ms");
    root.style.setProperty("--home-manager-ease", HOME_MOTION.manager.easing);
    root.style.setProperty("--home-daniel-settle", HOME_MOTION.manager.danielSettlePx + "px");
  }

  function loadMotionKit() {
    if (typeof window.sdEnter === "function") return Promise.resolve(window.sdEnter);
    if (motionLoadPromise) return motionLoadPromise;
    motionLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "../shared/motion.js";
      script.async = true;
      script.onload = () => {
        if (typeof window.sdEnter !== "function") {
          reject(new Error("Showdown motion kit loaded without sdEnter"));
          return;
        }
        resolve(window.sdEnter);
      };
      script.onerror = () => reject(new Error("Failed to load Showdown motion kit"));
      document.head.appendChild(script);
    });
    return motionLoadPromise;
  }

  async function runHomeEntrance(root) {
    const enter = await loadMotionKit();
    return enter(root);
  }
  const qs = new URLSearchParams(window.HOME_QS || location.search); // HOME_QS: single-file preview (srcdoc)
  const stage = document.getElementById("stage-root");
  const H = window.HomePlate = window.HomePlate || {};

  // ---------- C4b: the one plate-mapping helper ----------
  // Desktop camera: cover-fit, horizontally centred, TOP-anchored (background-position: offX 0), so both faces stay whole
  // down to 1366x640 (vertical bias; the offsets below follow that exact position).
  // Phone band: explicit band transform (see bandTransform), measured with the same function.
  let cam = { k: 1, offX: 0, offY: 0, boxX: 0, boxY: 0, mode: "desktop" };
  function plateToScreen(x, y) { return { x: cam.boxX + cam.offX + x * cam.k, y: cam.boxY + cam.offY + y * cam.k }; }
  function rectToScreen(r) { const a = plateToScreen(r[0], r[1]), b = plateToScreen(r[2], r[3]); return { left: a.x, top: a.y, right: b.x, bottom: b.y, width: b.x - a.x, height: b.y - a.y }; }
  H.plateToScreen = plateToScreen; H.rectToScreen = rectToScreen;

  function desktopCamera(W, Hh) {
    const k = Math.max(W / PW, Hh / PH);
    return { k, offX: (W - PW * k) / 2, offY: 0, boxX: 0, boxY: 0, mode: "desktop" };
  }
  // Phone band: fit the union of both face boxes (+ margin) into the band, never cutting a face, while the plate still covers the band.
  // Faces (face_daniel ∪ face_nik = x 725–1300, y 30–400) are fitted inside the band with >= 10 px above and below,
  // so the header and the UI under the band stay >= 8 px clear. Where the plate cannot cover the band's top edge
  // without that, the band's own ink background shows (a few px under the header).
  const FACES = [725, 30, 1300, 400], BAND_PAD = 10, BAND_SIDE = 20;
  function bandTransform(box) {
    const tw = FACES[2] - FACES[0] + 2 * BAND_SIDE, th = FACES[3] - FACES[1];
    let k = Math.min(box.width / tw, (box.height - 2 * BAND_PAD) / th);
    k = Math.max(k, box.width / PW);
    const cx = (FACES[0] + FACES[2]) / 2;
    let offX = box.width / 2 - cx * k;
    offX = Math.min(0, Math.max(box.width - PW * k, offX));
    // centre the faces vertically, then prefer covering the band with plate while keeping the face margins
    let offY = (box.height - th * k) / 2 - FACES[1] * k;
    const lo = BAND_PAD - FACES[1] * k, hi = box.height - BAND_PAD - FACES[3] * k; // face-margin window for offY
    offY = Math.min(Math.max(offY, Math.max(lo, box.height - PH * k)), Math.max(lo, Math.min(hi, 0)));
    return { k, offX, offY, boxX: box.left, boxY: box.top, mode: "mobile" };
  }

  // ---------- fixtures ----------
  async function loadJSON(name, inline) {
    if (inline) return inline;
    const r = await fetch(name, { cache: "no-store" });
    return r.json();
  }

  function setText(el, v) { if (el && el.textContent !== v) el.textContent = v; }

  function applyFrame(FX, frameId) {
    const S = FX.strings, f = FX.frames[frameId];
    stage.dataset.frame = frameId;
    if (f.plateOnly) { stage.classList.add("plate-only"); return; }
    setText(document.getElementById("onlinePlayerIdentityBadge"), f.badge);
    setText(document.getElementById("seasonIndicator"), f.indicator);
    // Continue: getSavedShowdownMenuMeta + refreshMainMenuExperience (main)
    const cont = document.getElementById("continueCareer");
    setText(cont.querySelector(".menuTileCode"), S.tiles.continueCareer.code);
    setText(cont.querySelector(".menuTileLabel"), f.save.label);
    setText(cont.querySelector(".menuTileMeta"), f.save.meta);
    cont.disabled = !f.save.hasSave;
    cont.setAttribute("aria-disabled", String(!f.save.hasSave));
    // New/Join: configureOnlineProductSurface (main)
    const nt = S.tiles[f.newTile], nw = document.getElementById("newShowdown");
    setText(nw.querySelector(".menuTileCode"), nt.code);
    setText(nw.querySelector(".menuTileLabel"), nt.label);
    setText(nw.querySelector(".menuTileMeta"), nt.meta);
    const st = document.getElementById("settingsButton");
    setText(st.querySelector(".menuTileMeta"), S.tiles.settingsButton.meta);

    // DATA_CONTRACT_V1 §1: never hide history/statistics/trophy tiles. Disable honestly with a closed-set reason.
    const availabilityTargets = {
      history: ["legacyButton", "legacyButton"],
      statistics: ["careerStatisticsButton", "careerStatisticsButton"],
      trophyRoom: ["trophyRoomButton", "trophyRoomButton"]
    };
    Object.entries(availabilityTargets).forEach(([key, pair]) => {
      const state = f.tiles && f.tiles[key];
      const tile = document.getElementById(pair[0]);
      const copy = S.tiles[pair[1]];
      if (!tile || !state) return;
      tile.disabled = !state.available;
      tile.setAttribute("aria-disabled", String(!state.available));
      tile.dataset.available = String(!!state.available);
      if (state.reason) {
        tile.dataset.reason = state.reason;
        setText(tile.querySelector(".menuTileMeta"), FX.availabilityMessages[state.reason]);
      } else {
        delete tile.dataset.reason;
        setText(tile.querySelector(".menuTileMeta"), copy.meta);
      }
    });
    if (f.tiles && f.tiles.rivalry) {
      stage.dataset.rivalryAvailable = String(!!f.tiles.rivalry.available);
      stage.dataset.rivalryReason = f.tiles.rivalry.reason || "";
    }

    stage.classList.toggle("primary-new", f.primary === "newShowdown");
    stage.dataset.primary = f.primary;
  }

  // Media selector, built like main's ensureMenuMediaSelector (Audius tracks per the approved exception)
  function buildSelector(FX) {
    const M = FX.strings.media, sel = document.getElementById("menuMediaSelector");
    sel.replaceChildren();
    M.tracks.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "menuMediaChoice"; b.dataset.menuMediaSource = t.key;
      const selected = t.key === M.defaultTrack;
      b.setAttribute("aria-pressed", String(selected));
      if (selected) b.classList.add("selected");
      const s = document.createElement("strong"); s.textContent = t.title;
      const m = document.createElement("small"); m.textContent = t.artist;
      b.append(s, m); sel.appendChild(b);
    });
    const d = M.tracks.find((t) => t.key === M.defaultTrack);
    setText(document.querySelector(".menuMusicHeader span"), M.category);
    setText(document.querySelector(".menuMusicHeader strong"), d.title);
    setText(document.querySelector(".menuMusicArtist"), d.artist);
    setText(document.getElementById("menuMusicStatus"), M.statusTemplate.replace("{TITLE}", d.title));
  }

  // ---------- geometry helpers ----------
  const grow = (r, g) => [r[0] - g, r[1] - g, r[2] + g, r[3] + g];
  function protectedList(MAP) { return Object.entries(MAP.protected_boxes); }

  // Seam mends: one strip per intake zone edge (plate px), trimmed so it never enters a protected box (+2 px).
  function mendStrips(MAP) {
    const T = 4, out = [];
    const prot = protectedList(MAP).map(([n, r]) => [n, grow(r, 2)]);
    MAP.remove_rects.forEach((z, zi) => {
      const [x0, y0, x1, y1] = z;
      const edges = [];
      if (y0 > 0) edges.push({ o: "h", at: y0, a: x0, b: x1, name: "top" });
      if (y1 < PH) edges.push({ o: "h", at: y1, a: x0, b: x1, name: "bottom" });
      if (x0 > 0) edges.push({ o: "v", at: x0, a: y0, b: y1, name: "left" });
      if (x1 < PW) edges.push({ o: "v", at: x1, a: y0, b: y1, name: "right" });
      edges.forEach((e) => {
        // strip segments along the edge; cut where a protected box crosses the strip, keep a thinner strip if the line itself stays clear
        let segs = [{ a: Math.max(0, e.a - 6), b: Math.min(e.o === "h" ? PW : PH, e.b + 6), lo: e.at - T, hi: e.at + T }];
        prot.forEach(([n, r]) => {
          const [pa, pb, plo, phi] = e.o === "h" ? [r[0], r[2], r[1], r[3]] : [r[1], r[3], r[0], r[2]];
          const next = [];
          segs.forEach((s) => {
            if (pb <= s.a || pa >= s.b || phi <= s.lo || plo >= s.hi) { next.push(s); return; }
            if (s.a < pa) next.push({ a: s.a, b: pa, lo: s.lo, hi: s.hi });
            if (s.b > pb) next.push({ a: pb, b: s.b, lo: s.lo, hi: s.hi });
            // overlapped part: shrink thickness to the side of the line away from the box
            let lo = s.lo, hi = s.hi;
            // keep the part of the strip on the far side of the box (the hairline can sit a few px inside the zone edge)
            if (plo > s.lo) hi = Math.min(hi, plo); else if (phi < s.hi) lo = Math.max(lo, phi); else { lo = hi = e.at; }
            if (hi - lo >= 6) next.push({ a: Math.max(s.a, pa), b: Math.min(s.b, pb), lo, hi, trimmed: n });
            else out.push({ zone: zi, edge: e.name, o: e.o, at: e.at, a: Math.max(s.a, pa), b: Math.min(s.b, pb), skipped: n });
          });
          segs = next;
        });
        segs.forEach((s) => out.push({ zone: zi, edge: e.name, o: e.o, at: e.at, a: s.a, b: s.b, lo: s.lo, hi: s.hi, trimmed: s.trimmed || null }));
      });
    });
    return out;
  }

  function renderMends(MAP) {
    const layer = stage.querySelector(".plateLayer");
    layer.replaceChildren();
    if (qs.get("mends") === "0") return [];

    // JOB-031: source tone/variance repair owns the broad transitions.
    // Keep only narrow edge mends where the 400% audit still showed a 1–2 px ridge.
    const wanted = new Map([
      [0, new Set(["bottom"])],
      [1, new Set(["bottom", "left", "right"])],
      [2, new Set(["bottom", "left", "right"])],
      [3, new Set(["top", "bottom", "right"])],
      [4, new Set(["top", "bottom", "right"])],
      [5, new Set(["top", "right"])],
      [6, new Set(["top"])],
    ]);
    const strips = mendStrips(MAP).filter((s) => wanted.get(s.zone)?.has(s.edge));

    strips.filter((s) => !s.skipped).forEach((s) => {
      const r = s.o === "h" ? [s.a, s.lo, s.b, s.hi] : [s.lo, s.a, s.hi, s.b];
      const a = { x: cam.offX + r[0] * cam.k, y: cam.offY + r[1] * cam.k };
      const b = { x: cam.offX + r[2] * cam.k, y: cam.offY + r[3] * cam.k };
      const d = document.createElement("i");
      d.className = "mend " + s.o;
      d.dataset.zone = s.zone;
      d.dataset.edge = s.edge;
      Object.assign(d.style, {
        left: a.x + "px",
        top: a.y + "px",
        width: Math.max(1, b.x - a.x) + "px",
        height: Math.max(1, b.y - a.y) + "px"
      });
      // Slightly stronger only at the sky/nav seams; left-column figure edges stay crisp.
      const plateBlur = s.zone <= 2 ? 2.0 : (s.zone === 6 ? 1.7 : 1.45);
      d.style.setProperty("--mb", Math.max(0.9, plateBlur * Math.min(1, cam.k * 1.15)).toFixed(2) + "px");
      layer.appendChild(d);
    });
    return strips;
  }

  function renderGrid(MAP, strips) {
    const g = stage.querySelector(".gridOverlay");
    g.replaceChildren();
    if (qs.get("grid") !== "1") return;
    stage.classList.add("grid");
    const add = (r, cls, label) => {
      const s = rectToScreen(r), b = document.createElement("b");
      b.className = cls; b.textContent = label || "";
      Object.assign(b.style, { left: s.left + "px", top: s.top + "px", width: s.width + "px", height: s.height + "px" });
      g.appendChild(b);
    };
    MAP.remove_rects.forEach((z, i) => add(z, "zone", "zone " + i));
    protectedList(MAP).forEach(([n, r]) => { add(r, "", n); add(grow(r, 8), "grow", ""); });
    (strips || []).filter((s) => !s.skipped).forEach((s) => add(s.o === "h" ? [s.a, s.lo, s.b, s.hi] : [s.lo, s.a, s.hi, s.b], "mendBox", ""));
  }

  // ---------- desktop layout ----------
  function layoutDesktop(MAP) {
    const W = innerWidth, Hh = innerHeight;
    cam = desktopCamera(W, Hh);
    const pv = stage.querySelector(".plateView");
    pv.style.backgroundSize = `${PW * cam.k}px ${PH * cam.k}px`;
    pv.style.backgroundPosition = `${cam.offX}px ${cam.offY}px`;
    const P = MAP.protected_boxes;
    const gutter = 0.024 * W, hdr = 56, ftr = 28;
    const tileH = Math.min(158, Math.max(136, 0.175 * Hh));
    const tileTop = Math.round(Hh - ftr - 8 - tileH);
    stage.style.setProperty("--tile-top", tileTop + "px");
    stage.style.setProperty("--tile-h", tileH + "px");
    // dock bed starts above the dock zone's top edge (plate y 684) so the tone-match edge sits under its opaque part


    const growS = (r, g) => ({ left: r.left - g, top: r.top - g, right: r.right + g, bottom: r.bottom + g, width: r.width + 2 * g, height: r.height + 2 * g });
    const handD = growS(rectToScreen(P.hand_daniel), 9), faceD = growS(rectToScreen(P.face_daniel), 9);
    const handN = growS(rectToScreen(P.hand_nik), 9), faceN = growS(rectToScreen(P.face_nik), 9);
    // dock bed starts above the dock zone's top edge (plate y 684) so the tone-match edge sits under its opaque part,
    // but never above Daniel's pointing hand (+9 px)
    stage.style.setProperty("--bed-top", Math.max(handD.bottom, Math.min(tileTop - 24, plateToScreen(0, 662).y)) + "px");

    // left column: heading width stops 12 px before Daniel's pointing hand
    const colW = Math.max(260, Math.min(0.36 * W, handD.left - gutter - 12));
    stage.style.setProperty("--col-w", colW + "px");
    // wordmark ≈ 32 % of the viewport, never reaching Daniel's face box (+8) and never meeting the heading block
    const heading = stage.querySelector(".fifaMenuHeading");
    const lockTop = hdr + Math.min(44, Math.max(14, 0.04 * Hh));
    const headTop = tileTop - Math.min(22, Math.max(12, 0.024 * Hh)) - heading.offsetHeight;
    const vRoom = headTop - 14 - lockTop - 2 * 19 - 2 * 6; // kicker + legacy lines + gaps
    const wmW = Math.max(200, Math.min(0.32 * W, faceD.left - gutter - 16, (vRoom * 2078) / 755));
    stage.style.setProperty("--wm-w", wmW + "px");

    // header background: two segments, open over any face/hand box the header row would cover (the goal's nav bar does the same)
    const hb = stage.querySelector(".hdrBg");
    hb.replaceChildren();
    const gaps = [faceD, faceN, handD, handN].filter((r) => r.top < hdr).map((r) => [Math.max(0, r.left), Math.min(W, r.right)]).sort((a, b) => a[0] - b[0]);
    let x = 0; const segs = [];
    gaps.forEach(([a, b]) => { if (a > x) segs.push([x, a]); x = Math.max(x, b); });
    if (x < W) segs.push([x, W]);
    segs.forEach(([a, b]) => { const i = document.createElement("i"); i.style.left = a + "px"; i.style.width = b - a + "px"; hb.appendChild(i); });
    stage.dataset.headerGaps = JSON.stringify(gaps.map((g) => g.map(Math.round)));
    // keep the right header controls inside the right segment
    const rightSeg = segs[segs.length - 1];
    stage.dataset.headerRightSeg = JSON.stringify(rightSeg.map(Math.round));
    // right header controls must start >= 8 px right of the open gap (face box clearance); tighten their padding if needed
    const hdrEl = document.getElementById("topHeader"), badgeEl = document.getElementById("onlinePlayerIdentityBadge");
    hdrEl.classList.remove("tight");
    if (badgeEl.getBoundingClientRect().left < rightSeg[0]) hdrEl.classList.add("tight");
    stage.dataset.headerTight = hdrEl.classList.contains("tight") ? "1" : "0";

    // scrims (H1): brief gradient .78 → .35 (73 %) → 0, ended before the protected boxes (+8)
    const sTop = stage.querySelector(".scrimTop"), sLow = stage.querySelector(".scrimLow");
    const g = (e) => `linear-gradient(90deg, rgba(6,7,9,.78) 0, rgba(6,7,9,.35) ${0.73 * e}px, rgba(6,7,9,0) ${e}px)`;
    const e1 = Math.max(0, Math.min(handD.left, faceD.left));
    Object.assign(sTop.style, { left: 0, top: 0, width: e1 + "px", height: Math.max(0, handD.bottom + 48) + "px", background: g(e1) });
    const fade = `linear-gradient(180deg, #000 ${Math.max(0, handD.bottom)}px, transparent ${Math.max(0, handD.bottom) + 48}px)`;
    sTop.style.webkitMaskImage = sTop.style.maskImage = fade;
    const e2 = 0.52 * W;
    Object.assign(sLow.style, { left: 0, top: Math.max(0, handD.bottom) + "px", width: e2 + "px", bottom: 0, background: g(e2) });

    // soundtrack card (H3)
    placeCard(MAP, { W, Hh, gutter, hdr, tileTop, handN, faceN });
    return { tileTop, tileH, colW, wmW };
  }

  function placeCard(MAP, L) {
    const card = stage.querySelector(".menuMusicTile");
    const set = (left, top, width, height) => Object.assign(card.style, { left: left + "px", top: top + "px", width: width + "px", height: height == null ? "auto" : height + "px" });
    const need = (w, side) => { card.classList.toggle("side", !!side); set(0, 0, w, null); return card.offsetHeight; };
    // goal position: plate x 1060..1640 (goal 64–97.6 %, widened to cover the intake zone edges), y from 486 (below Nik's hand +8)
    const left = plateToScreen(1060, 0).x, right = Math.min(plateToScreen(1640, 0).x, L.W - 16);
    const top = Math.max(plateToScreen(0, 486).y, L.handN.bottom);
    const bottomMax = L.tileTop - 12;
    const w = right - left, h = need(w, false) + 2;
    if (top + h <= bottomMax) {
      const bottom = Math.min(bottomMax, Math.max(top + h, plateToScreen(0, 670).y));
      set(left, top, w, bottom - top);
      stage.dataset.cardMode = "goal";
    } else {
      // short desktops: beside Nik's hand/face (+8), bottom-anchored over the tile row
      const sl = Math.max(L.handN.right, L.faceN.right) + 4, sr = L.W - L.gutter;
      const sw = sr - sl, sh = need(sw, true) + 2;
      const sTop = Math.max(L.hdr + 40, bottomMax - sh);
      set(sl, sTop, sw, Math.min(sh, bottomMax - sTop));
      stage.dataset.cardMode = "side";
    }
    stage.dataset.cardNeed = h;
  }

  // ---------- phone layout ----------
  function layoutMobile(MAP) {
    const card = stage.querySelector(".menuMusicTile");
    card.classList.remove("side");
    ["left", "top", "width", "height"].forEach((p) => (card.style[p] = ""));
    const pv = stage.querySelector(".plateView");
    const box = pv.getBoundingClientRect();
    cam = bandTransform(box);
    pv.style.backgroundSize = `${PW * cam.k}px ${PH * cam.k}px`;
    pv.style.backgroundPosition = `${cam.offX}px ${cam.offY}px`;
    stage.dataset.band = JSON.stringify({ top: Math.round(box.top), height: Math.round(box.height), k: +cam.k.toFixed(4), offX: Math.round(cam.offX), offY: Math.round(cam.offY) });
  }

  function positionManagerMarkers(MAP) {
    const targets = {
      daniel: MAP.protected_boxes.face_daniel,
      nik: MAP.protected_boxes.face_nik
    };
    Object.entries(targets).forEach(([manager, source]) => {
      const el = stage.querySelector('[data-manager="' + manager + '"]');
      if (!el || !source) return;
      const r = rectToScreen(source);
      Object.assign(el.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    });
  }

  function layout(MAP) {
    const mobile = matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
    stage.dataset.mode = mobile ? "mobile" : "desktop";
    if (mobile) layoutMobile(MAP); else layoutDesktop(MAP);
    positionManagerMarkers(MAP);
    // mends live in the plate box (desktop: viewport; phone: band), positioned in plate-box coordinates
    const strips = renderMends(MAP);
    renderGrid(MAP, strips);
    stage.dataset.k = cam.k.toFixed(5);
    stage.dataset.offX = cam.offX.toFixed(2);
    stage.dataset.offY = cam.offY.toFixed(2);
    H.cam = cam; H.strips = strips;
  }

  async function main() {
    const FX = await loadJSON("fixtures.json", H.FX);
    const MAP = await loadJSON("assets/platemap.json", H.MAP);
    H.FX = FX; H.MAP = MAP;
    const frame = FX.frames[qs.get("frame")] ? qs.get("frame") : "HM1";
    buildSelector(FX);
    applyFrame(FX, frame);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    layout(MAP);
    layout(MAP); // second pass: heading height settles after fonts and widths
    applyHomeMotionConstants(stage);
    await runHomeEntrance(stage);
    addEventListener("resize", () => layout(MAP));
    // Visual-only routing: each tile names the existing product destination it opens (fixtures.routes); no data code runs.
    document.querySelectorAll(".fifaMenuGrid > button.menuTile").forEach((b) => b.addEventListener("click", () => {
      const d = (FX.destinations || []).find((x) => x.id === b.id);
      const routeKey = (d && d.route) || b.dataset.routeKey || b.id;
      const r = FX.routes[routeKey];
      stage.dataset.lastIntent = b.id;
      document.dispatchEvent(new CustomEvent("home:intent", { detail: { tile: b.id, route: routeKey, opens: r && r.opens } }));
    }));
    window.__homeReady = true;
  }
  main().catch((e) => { console.error(e); });
})();
