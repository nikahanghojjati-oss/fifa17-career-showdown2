/* LEAGUE-V1 · static checkpoint prototype. Frames: ?frame=L1|L2|L3|L4, &grid=1 overlays platemap boxes.
   One plate-mapping helper (C4b): plateToScreen(x, y) is used for every plate-registered thing. */
(() => {
  "use strict";
  const PW = 1536, PH = 864;
  // JOB-042 presentation constants. The 4000/80 ms durations mirror main/js/leagueWheel.js;
  // these helpers never choose or persist a league, they only dramatize an already-rendered frame.
  const SPIN_TOTAL_MS = 4000;
  const SPIN_REDUCED_MS = 80;
  const SPIN_CREEP_MS = 300;
  const SPIN_CREEP_DEG = 18;
  const SPIN_EXTRA_TURNS = 3;
  const SPIN_EASE = "cubic-bezier(.16,.76,.16,1)";
  const SPIN_CREEP_EASE = "cubic-bezier(.30,.78,.20,1)";
  const SPIN_DEMO_DELAY_MS = 650;
  const POINTER_TICK_MS = 96;
  const POINTER_TICK_EASE = "cubic-bezier(.22,.86,.30,1)";
  const WINNER_PAYOFF_MS = 520;
  const WINNER_BURST_PARTICLES = 42;
  const RESULT_BRUSH_MS = 460;
  const SLOT = { cx: 762, cy: 496, r: 240 };          // intake slot centre + radius (plate px)
  // Job 37 measured goal geometry. The visible wheel follows this target; the fingertip is the
  // invariant desktop contact anchor so short-laptop fitting cannot detach the rim from Daniel.
  const GOAL_WHEEL = { cx: 762.6, cy: 495.0, r: 233.3 };
  const FINGER = { x: 532.5, y: 457.0 };
  const BEZEL = 268 / 240, POINTER = 36 / 240;         // bezel outer radius / pointer rise, as fractions of R
  const LABEL_REACH = 0.78;                            // lowest live label pixel below centre, fraction of R
  const VEIL_R = 272;                                  // slot veil radius (plate px)
  // finger overlay rect (plate px): keep_rects[0] widened to the hand-box rows so the cut can follow
  // Daniel's sleeve outline (Sol decision LEAGUE-M1); must match tools/make_finger_overlay.py
  const OVL_RECT = [440, 410, 560, 500];
  const PHONE_MIN_R = 110;   // phone wheel floor (D 224 px = the smallest 360x640 wheel); decision LEAGUE-M2
  const PHONE_FLOW_R = 110;  // short-phone wheel when the page scrolls (D 228 px >= every 360x640 frame: 224-227)
  const PHONE_X = [195, 1280], PHONE_Y_TOP = 70, PHONE_HAND_CUT_Y = 520; // Job 37: retain Daniel fingertip/sleeve in the phone band
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
  let appliedRotation = 0;
  let spinPresentationTimer = null;
  let pointerTickRaf = null;
  let pointerTickAnimation = null;
  let winnerPayoffTimer = null;
  let resultRevealTimer = null;
  const px = (v) => `${v}px`;
  // measurements relative to the stage (equal to viewport coords in the prototype, where the stage is at 0,0)
  function rel(el) { const b = el.getBoundingClientRect(), o = stage.getBoundingClientRect(); return { top: b.top - o.top, bottom: b.bottom - o.top, height: b.height }; }
  function box(el, l, t, w, h) { Object.assign(el.style, { left: px(l), top: px(t), width: px(w), height: px(h) }); }

  /* ---------- frame state: strings exactly as js/leagueWheel.js sets them ---------- */
  function applyFrame() {
    const f = FX.frames[frameId] || FX.frames.L1;
    const track = q("#leagueWheel .wheelTrack");
    const items = [...track.querySelectorAll(".wheelItem")];
    items.forEach((el, i) => { el.textContent = FX.leagues[i].name; el.title = FX.leagues[i].id; });
    const missing = [];
    items.forEach((el, i) => {
      if (typeof window.applyLeagueMark === "function") window.applyLeagueMark(el, FX.leagues[i].id);
      if (!el.dataset.leagueMark) missing.push(FX.leagues[i].id);
    });
    stage.dataset.missingMarks = missing.join(",");
    stage.dataset.spinStartRotation = String(appliedRotation);
    track.style.setProperty("--rot", `${f.rotation}deg`);
    track.style.transform = `rotate(${f.rotation}deg)`;          // same transform production sets
    appliedRotation = Number(f.rotation) || 0;
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

  function ensureSpinBlurTrack(track) {
    let ghost = q("#leagueWheel .wheelTrack--blur");
    if (ghost) return ghost;
    ghost = track.cloneNode(true);
    ghost.classList.add("wheelTrack--blur");
    ghost.setAttribute("aria-hidden", "true");
    ghost.removeAttribute("style");
    track.parentNode.insertBefore(ghost, q("#leagueWheel .wheel-blur"));
    return ghost;
  }

  function reducedSpinPreferred() {
    if (window.ShowdownMotion && typeof window.ShowdownMotion.isReducedMotion === "function") {
      return window.ShowdownMotion.isReducedMotion();
    }
    return typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function rotorSector(track) {
    const transform = getComputedStyle(track).transform;
    if (!transform || transform === "none") return 0;
    const matrix = new DOMMatrixReadOnly(transform);
    const degrees = (Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + 360) % 360;
    return Math.floor(((degrees + 36) % 360) / 72);
  }

  function tickPointer(pointer) {
    if (!pointer || reducedSpinPreferred()) return;
    if (pointerTickAnimation) pointerTickAnimation.cancel();
    pointerTickAnimation = pointer.animate([
      { transform: "translate3d(0,0,0) rotate(0deg)", opacity: 1 },
      { offset: .34, transform: "translate3d(0,5px,0) rotate(8deg)", opacity: .96 },
      { offset: .68, transform: "translate3d(0,-1px,0) rotate(-2deg)", opacity: 1 },
      { transform: "translate3d(0,0,0) rotate(0deg)", opacity: 1 }
    ], {
      duration: POINTER_TICK_MS,
      easing: POINTER_TICK_EASE
    });
    pointerTickAnimation.onfinish = () => { pointerTickAnimation = null; };
  }

  function stopPointerTicks() {
    if (pointerTickRaf) {
      cancelAnimationFrame(pointerTickRaf);
      pointerTickRaf = null;
    }
    if (pointerTickAnimation) {
      pointerTickAnimation.cancel();
      pointerTickAnimation = null;
    }
  }

  function startPointerTicks(track) {
    if (!track || reducedSpinPreferred()) return;
    const pointer = q(".wheelPointer");
    if (!pointer) return;
    stopPointerTicks();
    let sector = rotorSector(track);
    const sample = () => {
      if (!stage.classList.contains("is-wheel-spinning")) {
        pointerTickRaf = null;
        return;
      }
      const nextSector = rotorSector(track);
      if (nextSector !== sector) {
        tickPointer(pointer);
        sector = nextSector;
      }
      pointerTickRaf = requestAnimationFrame(sample);
    };
    pointerTickRaf = requestAnimationFrame(sample);
  }

  function ensureWinnerEffects() {
    const wheel = q("#leagueWheel");
    if (!wheel) return {};
    let flash = wheel.querySelector(".winner-wedge-flash");
    if (!flash) {
      flash = document.createElement("div");
      flash.className = "winner-wedge-flash";
      flash.setAttribute("aria-hidden", "true");
      wheel.appendChild(flash);
    }
    let canvas = wheel.querySelector(".spin-burst-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "spin-burst-canvas";
      canvas.setAttribute("aria-hidden", "true");
      wheel.appendChild(canvas);
    }
    return { flash, canvas };
  }

  function cancelResultReveal() {
    if (resultRevealTimer) {
      clearTimeout(resultRevealTimer);
      resultRevealTimer = null;
    }
    const result = q("#selectedLeague");
    if (result) result.classList.remove("is-result-wiping");
  }

  async function runResultReveal() {
    const f = FX.frames[frameId] || FX.frames.L1;
    if (f.state !== "selected" || !f.selected) return false;
    const result = q("#selectedLeague");
    if (!result) return false;

    cancelResultReveal();
    if (!reducedSpinPreferred()) {
      void result.offsetWidth;
      result.classList.add("is-result-wiping");
      window.setTimeout(() => result.classList.remove("is-result-wiping"), RESULT_BRUSH_MS + 40);
    }
    if (typeof window.sdReveal === "function") {
      await window.sdReveal(result);
    }
    return true;
  }

  function scheduleResultReveal(delay = 120) {
    cancelResultReveal();
    resultRevealTimer = window.setTimeout(() => {
      resultRevealTimer = null;
      runResultReveal();
    }, Math.max(0, Number(delay) || 0));
  }

  function cancelWinnerPayoff() {
    cancelResultReveal();
    if (winnerPayoffTimer) {
      clearTimeout(winnerPayoffTimer);
      winnerPayoffTimer = null;
    }
    const track = q("#leagueWheel .wheelTrack:not(.wheelTrack--blur)");
    if (track) track.querySelectorAll(".is-winner-payoff").forEach((el) => el.classList.remove("is-winner-payoff"));
    const flash = q("#leagueWheel .winner-wedge-flash");
    if (flash) flash.classList.remove("is-active");
  }

  function runWinnerPayoff() {
    const f = FX.frames[frameId] || FX.frames.L1;
    if (f.state !== "selected" || !f.selected || reducedSpinPreferred()) return false;
    const track = q("#leagueWheel .wheelTrack:not(.wheelTrack--blur)");
    if (!track) return false;
    const winner = [...track.querySelectorAll(".wheelItem")].find((el) => el.title === f.selected);
    if (!winner) return false;
    const { flash, canvas } = ensureWinnerEffects();
    if (!flash || !canvas) return false;

    cancelWinnerPayoff();
    void flash.offsetWidth;
    flash.classList.add("is-active");
    winner.classList.add("is-winner-payoff");
    window.setTimeout(() => {
      flash.classList.remove("is-active");
      winner.classList.remove("is-winner-payoff");
    }, WINNER_PAYOFF_MS + 40);

    if (typeof window.sdBurst === "function") {
      const rect = canvas.getBoundingClientRect();
      window.sdBurst(canvas, rect.width / 2, rect.height * .14, {
        count: WINNER_BURST_PARTICLES,
        duration: 700,
        spread: Math.PI * 1.35,
        speedMin: 95,
        speedMax: 270
      });
    }
    return true;
  }

  function scheduleWinnerPayoff(delay = 120) {
    cancelWinnerPayoff();
    winnerPayoffTimer = window.setTimeout(() => {
      winnerPayoffTimer = null;
      runWinnerPayoff();
      runResultReveal();
    }, Math.max(0, Number(delay) || 0));
  }

  function cancelSpinPresentation() {
    cancelWinnerPayoff();
    if (spinPresentationTimer) {
      window.clearTimeout(spinPresentationTimer);
      spinPresentationTimer = null;
    }
    stage.classList.remove("is-wheel-spinning");
    stopPointerTicks();
    [q("#leagueWheel .wheelTrack:not(.wheelTrack--blur)"), q("#leagueWheel .wheelTrack--blur")]
      .filter(Boolean)
      .forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));
  }

  async function runSpinPresentation() {
    const f = FX.frames[frameId] || FX.frames.L1;
    if (f.state !== "spinning") return false;
    const track = q("#leagueWheel .wheelTrack:not(.wheelTrack--blur)");
    if (!track) return false;
    const ghost = ensureSpinBlurTrack(track);
    const start = Number(stage.dataset.spinStartRotation) || 0;
    const normalizedTarget = Number(f.rotation) || 0;

    if (reducedSpinPreferred()) {
      const reducedTarget = `rotate(${normalizedTarget}deg)`;
      [track, ghost].forEach((el) => {
        el.style.setProperty("--rot", `${normalizedTarget}deg`);
        el.animate(
          [{ opacity: .7, transform: reducedTarget }, { opacity: 1, transform: reducedTarget }],
          { duration: SPIN_REDUCED_MS, easing: "linear", fill: "both" }
        );
      });
      return true;
    }

    cancelSpinPresentation();
    stage.classList.add("is-wheel-spinning");
    const target = normalizedTarget + (SPIN_EXTRA_TURNS * 360);
    const preCreep = target - SPIN_CREEP_DEG;
    const creepOffset = (SPIN_TOTAL_MS - SPIN_CREEP_MS) / SPIN_TOTAL_MS;
    const frames = [
      { offset: 0, transform: `rotate(${start}deg)`, easing: SPIN_EASE },
      { offset: creepOffset, transform: `rotate(${preCreep}deg)`, easing: SPIN_CREEP_EASE },
      { offset: 1, transform: `rotate(${target}deg)` }
    ];
    const animations = [track, ghost].map((el) => el.animate(frames, {
      duration: SPIN_TOTAL_MS,
      fill: "both"
    }));
    startPointerTicks(track);

    await Promise.all(animations.map((animation) => animation.finished.catch(() => null)));
    if ((FX.frames[frameId] || {}).state !== "spinning") return false;
    [track, ghost].forEach((el) => {
      el.style.setProperty("--rot", `${normalizedTarget}deg`);
      el.style.transform = `rotate(${normalizedTarget}deg)`;
      el.getAnimations().forEach((animation) => animation.cancel());
    });
    stopPointerTicks();
    stage.classList.remove("is-wheel-spinning");
    return true;
  }

  function scheduleSpinPresentation(delay = SPIN_DEMO_DELAY_MS) {
    if (spinPresentationTimer) window.clearTimeout(spinPresentationTimer);
    spinPresentationTimer = window.setTimeout(() => {
      spinPresentationTimer = null;
      runSpinPresentation();
    }, Math.max(0, Number(delay) || 0));
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
    const f = plateRect(OVL_RECT);
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

  // Short phones may scroll (decision LEAGUE-M2: only the primary action must be in the first view).
  function setPageScroll(contentH) {
    if (window.LEAGUE_PREVIEW) return;
    const de = document.documentElement, b = document.body;
    if (contentH && contentH > innerHeight + 0.5) {
      Object.assign(stage.style, { position: "absolute", height: px(contentH) });
      de.style.overflowY = "auto"; b.style.overflow = "visible"; b.style.height = "auto";
    } else {
      stage.style.removeProperty("position"); stage.style.removeProperty("height");
      de.style.removeProperty("overflow-y"); b.style.removeProperty("overflow"); b.style.removeProperty("height");
    }
  }

  function layoutDesktop(W, H) {
    setPageScroll(null);
    const hdr = 56, short = H < 700, ftr = short ? 0 : 28;
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
    q("#leagueWheelScreen h2").style.setProperty("--title-size", px(Math.round((short ? 52 : 64) * Math.min(Math.max(s, 1), 1.25))));
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

    const Rfull = GOAL_WHEEL.r * k, c = plateToScreen(GOAL_WHEEL.cx, GOAL_WHEEL.cy);
    const finger = plateToScreen(FINGER.x, FINGER.y);
    const topLimit = titleBottom + 4;
    // Notes must sit completely below the rim; the old build only cleared the live labels.
    const fits = (cy, R) => cy - R * (1 + POINTER) >= topLimit &&
      cy + R <= btnTop - 4 &&
      (noteTop === null || cy + R <= noteTop - 8);
    let R = Rfull, cy = c.y;
    if (!fits(cy, R)) {
      const bottomLimit = noteTop === null ? btnTop - 4 : noteTop - 8;
      const span = (bottomLimit - topLimit) / (2 + POINTER);
      // Keep the short-laptop wheel heavy; shift its centre before shrinking it into a small disc.
      R = Math.max((noteTop === null ? 0.85 : 0.82) * Rfull, Math.min(Rfull, span));
      const lo = topLimit + R * (1 + POINTER), hi = bottomLimit - R;
      cy = hi >= lo ? Math.min(Math.max(c.y, lo), hi) : (lo + hi) / 2;
    }

    // Solve the circle against the registered fingertip. The fingertip sits 3 CSS px over the rim
    // at every desktop target and the cut-out layer remains above both rim and contact shadow.
    if (cy - finger.y >= R - 2) cy = finger.y + R - 2;
    if (finger.y - cy >= R - 2) cy = finger.y - R + 2;
    // Contact correction must not re-introduce the old state-note/rim collision on short laptops.
    if (noteTop !== null && cy + R > noteTop - 8) cy = noteTop - 8 - R;
    const contactOverlap = 3;
    const dx = Math.sqrt(Math.max(1, R * R - (finger.y - cy) * (finger.y - cy)));
    const cx = finger.x - contactOverlap + dx;
    placeWheel(cx, cy, R);
    box(q(".finger-contact"), finger.x - 5, finger.y - 1, 12, 6);

    const onSlot = Math.abs(R - Rfull) < 0.5 && Math.abs(cy - c.y) < 0.5 && Math.abs(cx - c.x) < 8;
    stage.dataset.onSlot = String(onSlot);
    stage.dataset.wheelScale = (R / Rfull).toFixed(3);
    stage.dataset.contactOverlap = contactOverlap.toFixed(1);
    q(".slot-veil").style.display = onSlot ? "none" : "";
    q(".finger-ovl").style.display = "";

    // slogan boxes cover the goal's slogan zones (remove_rects 4 and 5) at their goal positions
    const zl = plateRect(MAP.remove_rects[4]), zr = plateRect(MAP.remove_rects[5]);
    const grow = 0, maxBottom = H - ftr - 8;
    for (const [sel, z] of [[".slogan-left", zl], [".slogan-right", zr]]) {
      const h = z.b - z.t + 2 * grow, t = Math.min(z.t - grow, maxBottom - h);
      const w = Math.min(W - 16, z.r - z.l + 2 * grow);
      const l = Math.min(Math.max(8, z.l - grow), W - 8 - w);
      box(q(sel), l, t, w, h);
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
    const compactRow = H <= 570;
    const rowH = compactRow ? 44 : 44 * 2 + 6;
    const note = q("#leagueStateNote");
    // Phone band now continues through Daniel's fingertip/sleeve. The live wheel is contact-anchored
    // to the same registered fingertip, so the hand remains visible without floating beside the rim.
    const bandBottom = plateToScreen(0, PHONE_HAND_CUT_Y).y;
    const noteH = note.classList.contains("hidden") ? 0 : note.getBoundingClientRect().height;
    // The wheel hides the plate slot dome: its bezel must cover the slot circle (r 250) wherever it sits,
    // and it must stay >= 8 px clear of both face boxes.
    const slotC = plateToScreen(SLOT.cx, SLOT.cy), slotR = 250 * T.k, domeTop = slotC.y - slotR;
    const faces = ["face_daniel", "face_nik"].map((n) => plateRect(MAP.protected_boxes[n]));
    const clear = (cx, cy, rb) => faces.every((r) => { const nx = Math.max(r.l - 8, Math.min(cx, r.r + 8)), ny = Math.max(r.t - 8, Math.min(cy, r.b + 8)); return Math.hypot(cx - nx, cy - ny) > rb; });
    const valid = (r, c) => { const rb = r * BEZEL; return rb + 1 >= slotR + Math.abs(c - slotC.y) && clear(slotC.x, c, rb); };
    // 1) fixed layout (no scroll): buttons at the bottom, note above them, largest wheel that fits
    const btnTopFixed = H - 12 - rowH, hi = (noteH ? btnTopFixed - 8 - noteH : btnTopFixed) - 8;
    const phoneMinR = compactRow ? 100 : PHONE_MIN_R;
    const phoneFlowR = compactRow ? 100 : PHONE_FLOW_R;
    let R = null, cy = null, flow = false, btnTop = btnTopFixed;
    for (let r = Math.min(Math.max(phoneMinR, W * 0.34), 150); r >= phoneMinR; r -= 0.5) {
      const c = Math.min(domeTop + r * BEZEL, hi - r * BEZEL);
      if (valid(r, c)) { R = r; cy = c; break; }
    }
    if (R !== null) {
      if (noteH) note.style.top = px(btnTopFixed - 8 - noteH);
    } else {
      // 2) short phones (decision LEAGUE-M2): the wheel stays at the 360x640 size or larger; the note
      //    clears the full bezel and the buttons follow it.
      //    Largest R in [PHONE_FLOW_R .. PHONE_MIN_R] that fits without scroll, else PHONE_FLOW_R and the
      //    page scrolls; #spinLeague must stay in the first view either way (G4).
      flow = true;
      const place = (r) => {
        let c = null;
        for (let t = slotC.y - (r * BEZEL - slotR); t <= slotC.y + (r * BEZEL - slotR); t += 0.5) if (valid(r, t)) { c = t; break; }
        if (c === null) c = domeTop + r * BEZEL;
        const nTop = c + r + 8;
        const bTop = noteH ? nTop + noteH + 6 : c + r + 8;
        return { r, c, nTop, bTop, end: bTop + rowH + 12 };
      };
      let f = null;
      const floorR = noteH ? 92 : phoneMinR;
      for (let r = phoneFlowR; r >= floorR; r -= 0.5) { const t = place(r); if (t.end <= H) { f = t; break; } }
      if (!f) f = place(phoneFlowR);
      R = f.r; cy = f.c; btnTop = f.bTop;
      if (noteH) note.style.top = px(f.nTop);
    }
    row.style.top = px(btnTop);
    const finger = plateToScreen(FINGER.x, FINGER.y);
    // Keep the contact wheel, including its outer bezel, inside the phone viewport.
    const maxContactR = (W - 4 - finger.x) / (1 + BEZEL);
    R = Math.max(phoneMinR, Math.min(R, maxContactR));
    const targetDist = Math.max(4, R - 3);
    let dy = finger.y - cy;
    if (Math.abs(dy) >= targetDist) {
      cy = finger.y - Math.sign(dy || 1) * (targetDist - 1);
      dy = finger.y - cy;
    }
    const dx = Math.sqrt(Math.max(1, targetDist * targetDist - dy * dy));
    const wheelCx = finger.x + dx;
    placeWheel(wheelCx, cy, R);
    box(q(".finger-contact"), finger.x - 5, finger.y - 1, 12, 6);
    stage.dataset.contactOverlap = (R - Math.hypot(finger.x - wheelCx, finger.y - cy)).toFixed(1);
    stage.dataset.phoneWheelD = String(Math.round(2 * R));
    stage.dataset.flow = String(flow);
    setPageScroll(flow ? btnTop + rowH + 12 : null);
    const sc = q(".scene"), st = q(".scene-top");
    placeScene(sc, 0, bandTop, W, bandBottom - bandTop); placeScene(st, 0, bandTop, W, bandBottom - bandTop);
    const fade = "linear-gradient(to bottom, #000 calc(100% - 28px), transparent)";
    for (const el of [sc, st]) { el.style.webkitMaskImage = fade; el.style.maskImage = fade; }
    placePlateLayers({ x: 0, y: bandTop });
    q(".slot-veil").style.display = "";
    q(".finger-ovl").style.display = "";
    stage.dataset.onSlot = "false";
    stage.dataset.handVisible = "true";
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
    add(OVL_RECT, "#f6d743", "finger overlay");
    MAP.remove_rects.forEach((r) => add(r, "rgba(120,200,255,.8)", ""));
    const [cx, cy, rr] = MAP.remove_circles_cx_cy_r[0];
    const c = plateToScreen(cx, cy), d = document.createElement("div");
    box(d, c.x - rr * T.k, c.y - rr * T.k, 2 * rr * T.k, 2 * rr * T.k); d.style.borderRadius = "50%"; d.style.borderColor = "#7cd4ff"; g.appendChild(d);
  }

  let entranceStarted = false;
  async function runStandardEntrance() {
    if (entranceStarted || window.LEAGUE_PREVIEW) return;
    entranceStarted = true;
    if (typeof window.sdEnter !== "function") {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "../shared/motion.js";
        script.async = true;
        script.onload = resolve;
        script.onerror = () => {
          stage.dataset.motionLoad = "failed";
          resolve();
        };
        document.head.appendChild(script);
      });
    }
    if (typeof window.sdEnter === "function") {
      window.sdEnter(stage);
      stage.dataset.motionLoad = "ready";
    }
  }

  function layout() {
    // viewport in the prototype (the stage may grow taller than it on short phones); stage box in the preview
    const W = window.LEAGUE_PREVIEW ? stage.clientWidth : innerWidth, H = window.LEAGUE_PREVIEW ? stage.clientHeight : innerHeight;
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
    await runStandardEntrance();
    const activeFrame = FX.frames[frameId] || FX.frames.L1;
    if (activeFrame.state === "spinning") scheduleSpinPresentation();
    if (activeFrame.state === "selected") scheduleWinnerPayoff(820);
    const img = new Image();
    img.onload = img.onerror = () => { window.__leagueReady = true; };
    img.src = devicePixelRatio > 1 ? "assets/ENV_LEAGUE_PLATE_V1_2X.webp" : "assets/ENV_LEAGUE_PLATE_V1_1X.webp";
  }
  function setFrame(id) {
    cancelSpinPresentation();
    frameId = id;
    stage.dataset.frame = id;
    applyFrame();
    layout();
    const nextFrame = FX.frames[frameId] || FX.frames.L1;
    if (nextFrame.state === "spinning") scheduleSpinPresentation(50);
    if (nextFrame.state === "selected") scheduleWinnerPayoff(120);
  }
  window.LeagueV1 = { plateToScreen, T, SLOT, OVL_RECT, main, setFrame, layout, runSpinPresentation, runWinnerPayoff, runResultReveal };
  if (!window.LEAGUE_DEFER_MAIN) main();
})();
