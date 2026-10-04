/* TW-PLATE-G · "Paint the stage, place the live text".
 * One locked key-art plate owns managers, table, props, panels and light.
 * This file places live text and controls on the painted surfaces (platemap.json, plate px × k).
 *
 * Frames: ?frame=F1 (Window, Nik viewing) | F1D (Window, Daniel viewing) | F1R / F1DR (own early-end request locked)
 *         G2 (Guess Entry, Nik viewing) | G3 (Guess Entry, Daniel viewing) | S0 (plate only)
 *         F3 / F3D (Signing Entry, Nik / Daniel viewing) | F3L / F3DL (own signings locked, waiting)
 *         F4 / F4D (Verdicts, Nik / Daniel viewing) | F4E / F4DE (Verdicts, Daniel entered no signings)
 * Flags:  &grid=1 plate map · &freeze=1 stops the demo clock (QA)
 *
 * Desktop: the plate is the stage; live DOM is registered to the painted glass.
 * Portrait (CSS media query "mobile"): the same DOM is recomposed: a scene crop of the plate
 * (both managers, sign, fingertip contact), then the viewer's glass, the sealed rival, the rules card.
 */
(function () {
  "use strict";

  var PLATE_W = 1672, PLATE_H = 941;
  var MOBILE_MQ = "(max-width: 760px) and (orientation: portrait)";

  // JOB-145 signature motion constants. Presentation only: these never gate or delay gameplay intents.
  var TW_MOTION = Object.freeze({
    clockTick: Object.freeze({ duration: 280, easing: "cubic-bezier(.22,1,.36,1)" }),
    guessSubmit: Object.freeze({ slide: 560, stampDelay: 350, stamp: 260, total: 720, easing: "cubic-bezier(.22,1,.36,1)" }),
    verdictReveal: Object.freeze({ crack: 180, fanDelay: 110, fan: 340, revealDelay: 220, brushDelay: 390, brush: 420, burstDelay: 690, burst: 360, total: 1080, easing: "cubic-bezier(.22,1,.36,1)" })
  });

  function motionReduced() {
    return !!(window.ShowdownMotion && typeof window.ShowdownMotion.isReducedMotion === "function" && window.ShowdownMotion.isReducedMotion());
  }

  function applySignatureMotionConstants(stage) {
    stage.style.setProperty("--tw-clock-tick-ms", TW_MOTION.clockTick.duration + "ms");
    stage.style.setProperty("--tw-clock-ease", TW_MOTION.clockTick.easing);
    stage.style.setProperty("--tw-guess-slide-ms", TW_MOTION.guessSubmit.slide + "ms");
    stage.style.setProperty("--tw-guess-stamp-ms", TW_MOTION.guessSubmit.stamp + "ms");
    stage.style.setProperty("--tw-guess-ease", TW_MOTION.guessSubmit.easing);
    stage.style.setProperty("--tw-verdict-crack-ms", TW_MOTION.verdictReveal.crack + "ms");
    stage.style.setProperty("--tw-verdict-fan-ms", TW_MOTION.verdictReveal.fan + "ms");
    stage.style.setProperty("--tw-verdict-brush-ms", TW_MOTION.verdictReveal.brush + "ms");
    stage.style.setProperty("--tw-verdict-ease", TW_MOTION.verdictReveal.easing);
  }
  var SIGNATURE_MOTION = Object.freeze({
    easeOut: "cubic-bezier(.22,1,.36,1)",
    easeInOut: "cubic-bezier(.65,0,.35,1)",
    reducedMs: 150,
    clockTickMs: 260,
    guessSlideMs: 480,
    guessSealMs: 360,
    verdictCrackMs: 260,
    verdictPageMs: 360,
    verdictWipeMs: 420,
    verdictRevealMs: 810,
    burstMs: 720
  });

  function motionReduced() {
    if (window.ShowdownMotion && typeof window.ShowdownMotion.isReducedMotion === "function") {
      return window.ShowdownMotion.isReducedMotion();
    }
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function qs(name, fallback) { return new URLSearchParams(location.search).get(name) || fallback; }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k === "style") Object.assign(n.style, v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  // Register a node to a plate rect [x0,y0,x1,y1]. CSS reads --x/--y/--w/--h (plate px) and --k.
  // Desktop CSS positions with them; the portrait layout ignores them and flows.
  function placeRect(node, r) {
    node.style.setProperty("--x", r[0]);
    node.style.setProperty("--y", r[1]);
    node.style.setProperty("--w", r[2] - r[0]);
    node.style.setProperty("--h", r[3] - r[1]);
    node.classList.add("reg");
    return node;
  }

  function sealSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<path d="M33 44 L38 30 L45 39 L50 26 L55 39 L62 30 L67 44 Z" fill="currentColor"/>' +
      '<rect x="33" y="46" width="34" height="3.5" fill="currentColor"/>' +
      '<text x="50" y="70" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="17" fill="currentColor" letter-spacing="1">CM17</text>';
    return svg;
  }

  function buildWordmark() {
    var h = el("h1", { class: "transfer-wordmark sd-title--wordmark", "data-sd-enter": "title" });
    h.appendChild(el("img", { src: "../../shared/wordmarks/TITLE_TRANSFER_V1.webp", alt: "", "aria-hidden": "true", decoding: "async" }));
    h.appendChild(el("span", { class: "sd-visually-hidden", text: "TRANSFER WAR" }));
    return h;
  }

  // "A · B" -> <span>A</span><span class="sep"> · </span><span>B</span>. textContent stays exact.
  function splitDots(text, partClass) {
    var parts = text.split(" · ");
    var out = [];
    parts.forEach(function (p, i) {
      if (i) out.push(el("span", { class: "sep", text: " · " }));
      out.push(el("span", { class: partClass || "part", text: p }));
    });
    return out;
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }

  // Presentation-only second hand: the authoritative timer remains #transferTimerDisplay DOM text.
  function setClockHand(hand, wholeSeconds, animate) {
    if (!hand) return;
    var angle = (Math.max(0, wholeSeconds) % 60) * 6;
    var next = "translate(-50%, -100%) rotate(" + angle + "deg)";
    var prevAngle = Number(hand.dataset.angle);
    var prev = Number.isFinite(prevAngle)
      ? "translate(-50%, -100%) rotate(" + prevAngle + "deg)"
      : next;
    hand.dataset.angle = String(angle);
    hand.style.transform = next;
    if (!animate || motionReduced() || typeof hand.animate !== "function") return;
    hand.animate([
      { transform: prev, opacity: 0.58 },
      { transform: next, opacity: 1, offset: 0.56 },
      { transform: next, opacity: 0.72 }
    ], { duration: SIGNATURE_MOTION.clockTickMs, easing: SIGNATURE_MOTION.easeOut });
  }

  function stampGuessSeal(stage, target) {
    if (!stage || !target) return;
    if (motionReduced()) {
      if (typeof target.animate === "function") {
        target.animate([{ opacity: 0.62 }, { opacity: 1 }], {
          duration: SIGNATURE_MOTION.reducedMs,
          easing: "linear"
        });
      }
      return;
    }
    var sr = stage.getBoundingClientRect(), tr = target.getBoundingClientRect();
    var stamp = el("div", { class: "seal tw-motion-wax sd-slam-in", "aria-hidden": "true" });
    stamp.appendChild(sealSvg());
    stamp.style.left = (tr.left - sr.left) + "px";
    stamp.style.top = (tr.top - sr.top) + "px";
    stamp.style.width = tr.width + "px";
    stamp.style.height = tr.height + "px";
    stamp.style.animationDuration = SIGNATURE_MOTION.guessSealMs + "ms";
    stamp.style.animationTimingFunction = SIGNATURE_MOTION.easeOut;
    stage.appendChild(stamp);
    requestAnimationFrame(function () { stamp.classList.add("sd-is-slamming"); });
    window.setTimeout(function () { stamp.remove(); }, SIGNATURE_MOTION.guessSealMs + 80);
  }

  // Presentation only: never copies the private guess values into the travelling card.
  function runGuessSubmitMotion(sourcePanel) {
    if (!sourcePanel || sourcePanel.dataset.motionSubmitting === "true") return;
    var stage = sourcePanel.closest(".stage") || document.getElementById("stage-root");
    var target = stage && stage.querySelector(".panel.sealed .seal");
    if (!stage || !target) return;
    sourcePanel.dataset.motionSubmitting = "true";

    if (motionReduced() || typeof sourcePanel.animate !== "function") {
      stampGuessSeal(stage, target);
      window.setTimeout(function () { delete sourcePanel.dataset.motionSubmitting; }, SIGNATURE_MOTION.reducedMs + 40);
      return;
    }

    var sr = stage.getBoundingClientRect(), a = sourcePanel.getBoundingClientRect(), b = target.getBoundingClientRect();
    var w = Math.max(112, Math.min(220, a.width * 0.46));
    var h = Math.max(46, Math.min(78, a.height * 0.24));
    var startX = a.left - sr.left + (a.width - w) / 2;
    var startY = a.top - sr.top + (a.height - h) / 2;
    var endX = b.left - sr.left + b.width / 2 - w / 2;
    var endY = b.top - sr.top + b.height / 2 - h / 2;
    var card = el("div", { class: "tw-guess-flight", "aria-hidden": "true" });
    card.style.left = startX + "px";
    card.style.top = startY + "px";
    card.style.width = w + "px";
    card.style.height = h + "px";
    stage.appendChild(card);

    var anim = card.animate([
      { transform: "translate3d(0,0,0) scale(1)", opacity: 0.96 },
      { transform: "translate3d(" + ((endX - startX) * 0.74) + "px," + ((endY - startY) * 0.74) + "px,0) scale(.62)", opacity: 0.92, offset: 0.74 },
      { transform: "translate3d(" + (endX - startX) + "px," + (endY - startY) + "px,0) scale(.28)", opacity: 0.08 }
    ], {
      duration: SIGNATURE_MOTION.guessSlideMs,
      easing: SIGNATURE_MOTION.easeInOut,
      fill: "forwards"
    });
    Promise.resolve(anim.finished).catch(function () {}).then(function () {
      card.remove();
      stampGuessSeal(stage, target);
      window.setTimeout(function () { delete sourcePanel.dataset.motionSubmitting; }, SIGNATURE_MOTION.guessSealMs + 40);
    });
  }

  // ---------- sign (read-only, rotated to the board: TWG-S7) ------------------

  function signRect(map) {
    var s = map.signScreen;
    return [s.cx - s.w / 2, s.cy - s.h / 2, s.cx + s.w / 2, s.cy + s.h / 2];
  }

  function buildSign(map, cfg, S) {
    var wrap = placeRect(el("div", { class: "sign-screen", "data-sd-enter": "panel" }), signRect(map));
    wrap.style.setProperty("--rot", map.signScreen.boardAngleDeg + "deg");
    if (cfg.phase === "WINDOW_OPEN") {
      wrap.classList.add("is-live");
      var timer = el("div", { id: "transferTimerDisplay", class: "sign-main timer", role: "timer", "aria-live": "off" });
      timer.appendChild(el("span", { class: "timer-text", text: fmtClock(cfg.timerSeconds) }));
      var clock = el("span", { class: "timer-clock", "aria-hidden": "true" });
      var hand = el("span", { class: "timer-hand", "aria-hidden": "true" });
      clock.appendChild(hand);
      timer.appendChild(clock);
      setClockHand(hand, Math.floor(cfg.timerSeconds), false);
      wrap.appendChild(timer);
    } else {
      wrap.appendChild(el("div", { id: "transferTimerDisplay", class: "sign-main closed", text: S.signWindowClosed }));
      if (cfg.phase === "SIGNING_ENTRY" || cfg.phase === "COMPLETED") wrap.classList.add("status-board");
    }
    return wrap;
  }

  // Separate node so portrait can move it to a lower-third; desktop registers it to the sign too.
  function buildStatus(map, cfg, S) {
    var st = placeRect(el("p", { id: "transferPhaseStatus", class: "sign-status", role: "status", "aria-live": "polite", "data-sd-enter": "panel" }), signRect(map));
    st.style.setProperty("--rot", map.signScreen.boardAngleDeg + "deg");
    splitDots(phaseStatus(cfg, S)).forEach(function (n) { st.appendChild(n); });
    if (cfg.phase === "WINDOW_OPEN") st.classList.add("two-line");
    if (cfg.phase === "SIGNING_ENTRY" || cfg.phase === "COMPLETED") {
      st.classList.add("full");
      if (phaseStatus(cfg, S).split(" · ")[0].length <= 14) st.classList.add("lead"); // short phase name gets the board lettering
    }
    return st;
  }

  function phaseStatus(cfg, S) {
    if (cfg.phase === "WINDOW_OPEN") return S.f1Status;
    if (cfg.phase === "GUESS_ENTRY") return S.guessStatus;
    if (cfg.phase === "SIGNING_ENTRY") return cfg.signingsLocked ? S.signingStatusLocked : S.signingStatus;
    return S.completedStatus;
  }

  // ---------- viewer panel -----------------------------------------------------

  function buildGuessColumn(i, prefix, rivalName, S) {
    var col = el("div", { class: "guess-col guessRow" });
    col.appendChild(el("span", { class: "guess-num", "aria-hidden": "true", text: "0" + i }));
    var sel = el("select", { class: "sd-select", id: prefix + "Guess" + i + "Type", "data-transfer-field": true, "aria-label": "Guess " + i + " against " + rivalName + " type" }, [
      el("option", { value: "", text: S.selectPlaceholder }),
      el("option", { value: "league", text: S.selectLeague }),
      el("option", { value: "nationality", text: S.selectNationality })
    ]);
    var inp = el("input", { class: "sd-input", type: "text", id: prefix + "Guess" + i + "Value", "data-transfer-field": true, autocomplete: "off",
      "aria-label": "Guess " + i + " against " + rivalName + " value", placeholder: S.valuePlaceholder, disabled: true });
    sel.addEventListener("change", function () {
      var opt = sel.options[sel.selectedIndex];
      if (sel.value) { inp.disabled = false; inp.placeholder = opt.textContent; }
      else { inp.value = ""; inp.disabled = true; inp.placeholder = S.valuePlaceholder; }
    });
    col.appendChild(sel);
    col.appendChild(inp);
    return col;
  }

  function panelShell(p, viewerIsNik, labelledBy, phaseClass) {
    var sec = el("section", { class: "panel own " + phaseClass, "aria-labelledby": labelledBy, "data-panel": viewerIsNik ? "A" : "B", "data-sd-enter": "panel" });
    sec.style.setProperty("--pa", (p.angleDeg || 0) + "deg");
    return sec;
  }

  function buildGuessPanel(p, viewerIsNik, S) {
    var rival = viewerIsNik ? "Daniel" : "Nik";
    var prefix = viewerIsNik ? "p1" : "p2";
    var headingId = viewerIsNik ? "guessAgainstOneHeading" : "guessAgainstTwoHeading";
    var sec = panelShell(p, viewerIsNik, headingId, "phase-guess");

    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    title.appendChild(el("h3", { id: headingId, class: "own-heading", text: viewerIsNik ? S.guessHeadingNikViewer : S.guessHeadingDanielViewer }));
    title.appendChild(el("span", { class: "chip chip-private", text: S.tagPrivate }));
    title.appendChild(el("span", { class: "chip chip-you m-only", text: S.tagYou }));
    sec.appendChild(title);

    var body = placeRect(el("div", { class: "panel-body" }), p.content);
    var cols = el("div", { class: "guess-cols" });
    for (var i = 1; i <= 3; i++) cols.appendChild(buildGuessColumn(i, prefix, rival, S));
    body.appendChild(cols);
    var act = el("div", { class: "action-row" });
    act.appendChild(el("p", { id: "transferGuessPrivacyNote", class: "privacy-note", text: viewerIsNik ? S.privacyNoteNikViewer : S.privacyNoteDanielViewer }));
    var lockGuess = el("button", { type: "button", id: "completeTransferChallenge", class: "btn-lock sd-btn sd-btn--primary", "data-sd-enter": "button", text: S.primary });
    lockGuess.addEventListener("click", function () { runGuessSubmitMotion(sec); });
    act.appendChild(lockGuess);
    body.appendChild(act);
    body.appendChild(el("p", { id: "transferChallengeError", class: "error-line", role: "alert" }));
    sec.appendChild(body);
    return sec;
  }

  // F1: the viewer's glass carries the Window brief and the existing early-end control only.
  // #endTransferTimer is production's id: production's capture handler maps it to requestEndWindow
  // (js/productionSharedTransferChallenge.js). The prototype only emits the same intent.
  function buildWindowPanel(p, viewerIsNik, cfg, S) {
    var headingId = viewerIsNik ? "transferManagerTwo" : "transferManagerOne";
    var sec = panelShell(p, viewerIsNik, headingId, "phase-window");

    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    title.appendChild(el("h3", { id: headingId, class: "own-heading own-name", text: viewerIsNik ? S.nameplateTwo : S.nameplateOne }));
    title.appendChild(el("span", { class: "chip chip-you m-only", text: S.tagYou }));
    sec.appendChild(title);

    var body = placeRect(el("div", { class: "panel-body window-body" }), p.content);
    body.appendChild(el("p", { id: "transferWindowBrief", class: "f1-brief", text: S.f1Intro }));
    var act = el("div", { class: "end-row" });
    var btn = el("button", { type: "button", id: "endTransferTimer", class: "btn-end sd-btn sd-btn--secondary", "data-sd-enter": "button", text: S.f1Action });
    function setRequested() {
      btn.textContent = S.f1ActionRequested;
      btn.disabled = true;
      btn.classList.add("requested");
      sec.classList.add("end-requested");
    }
    if (cfg.endRequested) setRequested();
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      document.dispatchEvent(new CustomEvent("transfer:intent", { detail: { control: "endTransferTimer", action: "requestEndWindow" } }));
      setRequested(); // prototype echo of production's re-render after requestEndWindow
    });
    act.appendChild(btn);
    body.appendChild(act);
    body.appendChild(el("p", { id: "transferChallengeError", class: "error-line", role: "alert" }));
    sec.appendChild(body);
    return sec;
  }

  // ---------- F3 · Signing Entry ------------------------------------------------
  // Production ids: p1Signing{i}* = Daniel (playerOne), p2Signing{i}* = Nik (playerTwo); only the viewer's own
  // three rows exist in the DOM. LOCK MY SIGNINGS keeps #completeTransferChallenge (production maps it to
  // lockSignings in SIGNING_ENTRY). The prototype validates like production and emits the intent only.
  function buildSigningPanel(p, viewerIsNik, cfg, fx, S) {
    var role = viewerIsNik ? "playerTwo" : "playerOne";
    var prefix = viewerIsNik ? "p2" : "p1";
    var who = viewerIsNik ? "Player Two" : "Player One";
    var headingId = viewerIsNik ? "transferManagerTwo" : "transferManagerOne";
    var sec = panelShell(p, viewerIsNik, headingId, "phase-signing");
    var locked = !!cfg.signingsLocked;
    if (locked) sec.classList.add("is-locked");

    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    title.appendChild(el("h3", { id: headingId, class: "own-heading own-name", text: viewerIsNik ? S.nameplateTwo : S.nameplateOne }));
    title.appendChild(el("span", { class: "chip chip-private", text: S.tagPrivate }));
    title.appendChild(el("span", { class: "chip chip-you m-only", text: S.tagYou }));
    sec.appendChild(title);

    var body = placeRect(el("div", { class: "panel-body signing-body" }), p.signingContent || p.content);
    var rows = el("div", { class: "signing-rows" });
    var own = (fx.inputs[role] || {}).signings || [];
    var fields = [["Name", S.signingPlaceholderName, "player name"], ["League", S.signingPlaceholderLeague, "previous league"], ["Nationality", S.signingPlaceholderNationality, "nationality"]];
    for (var i = 1; i <= 3; i++) {
      var row = el("div", { class: "signing-row signingRow" });
      row.appendChild(el("span", { class: "guess-num", "aria-hidden": "true", text: "0" + i }));
      var data = own.filter(function (r) { return r.slot === i; })[0] || {};
      if (locked) {
        // Locked: the viewer's own committed signings read back as text (production shows them disabled).
        row.classList.add("is-readonly");
        var who = el("div", { class: "vr-who" });
        who.appendChild(el("strong", { class: "vr-name", text: data.name || "" }));
        who.appendChild(el("span", { class: "vr-meta", text: data.name ? data.league + " · " + data.nationality : "" }));
        row.appendChild(who);
        rows.appendChild(row);
        continue;
      }
      fields.forEach(function (f) {
        row.appendChild(el("input", { class: "sd-input", type: "text", id: prefix + "Signing" + i + f[0], "data-transfer-field": true, autocomplete: "off",
          "aria-label": who + " signing " + i + " " + f[2], placeholder: f[1] }));
      });
      rows.appendChild(row);
    }
    body.appendChild(rows);
    var act = el("div", { class: "action-row" });
    var note = el("p", { id: "transferSigningPrivacyNote", class: "privacy-note", text: viewerIsNik ? S.privacyNoteNikViewer : S.privacyNoteDanielViewer });
    act.appendChild(note);
    var err = el("p", { id: "transferChallengeError", class: "error-line", role: "alert" });
    act.appendChild(err);
    if (!locked) {
      var btn = el("button", { type: "button", id: "completeTransferChallenge", class: "btn-lock sd-btn sd-btn--primary", "data-sd-enter": "button", text: S.signingPrimary });
      btn.addEventListener("click", function () {
        var out = [];
        for (var n = 1; n <= 3; n++) {
          var v = ["Name", "League", "Nationality"].map(function (f) { return document.getElementById(prefix + "Signing" + n + f).value.trim(); });
          if (!v[0] && !v[1] && !v[2]) continue;
          if (!v[0] || !v[1] || !v[2]) { err.textContent = S.signingInvalid.replace("{n}", n); sec.classList.add("has-error"); return; }
          out.push({ slot: n });
        }
        err.textContent = ""; sec.classList.remove("has-error");
        document.dispatchEvent(new CustomEvent("transfer:intent", { detail: { control: "completeTransferChallenge", action: "lockSignings", rows: out.length } }));
      });
      act.appendChild(btn);
    }
    body.appendChild(act);
    sec.appendChild(body);
    return sec;
  }

  function buildVerdictDossierCover() {
    var cover = el("div", { class: "tw-verdict-dossier", "aria-hidden": "true" });
    var pages = el("div", { class: "tw-verdict-pages" });
    for (var i = 0; i < 3; i++) pages.appendChild(el("span", { class: "tw-page tw-page-" + (i + 1) }));
    var wax = el("div", { class: "tw-verdict-wax" });
    ["left", "right"].forEach(function (side) {
      var half = el("span", { class: "tw-wax-half is-" + side });
      half.appendChild(sealSvg());
      wax.appendChild(half);
    });
    cover.appendChild(pages);
    cover.appendChild(wax);
    return cover;
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  // Reveal choreography is presentation-only. Provider verdicts are already in the DOM and are never recomputed.
  async function runVerdictReveal(stage) {
    if (!stage) return false;
    var panels = Array.from(stage.querySelectorAll(".panel.verdict"));
    if (!panels.length) return false;
    var covers = panels.map(function (p) { return p.querySelector(".tw-verdict-dossier"); }).filter(Boolean);
    var verdictWords = Array.from(stage.querySelectorAll(".vr-verdict"));
    var slotCounts = Array.from(stage.querySelectorAll(".tw-slot-count"));
    var reduced = motionReduced();

    stage.style.setProperty("--tw-verdict-wipe-ms", SIGNATURE_MOTION.verdictWipeMs + "ms");
    stage.style.setProperty("--tw-motion-ease-out", SIGNATURE_MOTION.easeOut);

    if (reduced) {
      covers.forEach(function (cover) {
        if (typeof window.sdReveal === "function") window.sdReveal(cover);
      });
      covers.forEach(function (cover) {
        if (typeof cover.animate === "function") {
          cover.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: SIGNATURE_MOTION.reducedMs,
            easing: "linear",
            fill: "forwards"
          });
        } else {
          cover.style.opacity = "0";
        }
      });
      verdictWords.forEach(function (node) {
        node.classList.add("tw-wipe-complete");
        if (typeof node.animate === "function") {
          node.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: SIGNATURE_MOTION.reducedMs,
            easing: "linear"
          });
        }
      });
      slotCounts.forEach(function (node) {
        var target = Number(node.dataset.target);
        if (typeof window.sdCountUp === "function") window.sdCountUp(node, target, 0);
        else node.textContent = String(target);
      });
      await delay(SIGNATURE_MOTION.reducedMs);
      covers.forEach(function (cover) { cover.remove(); });
      return true;
    }

    var revealPromises = covers.map(function (cover) {
      return typeof window.sdReveal === "function" ? window.sdReveal(cover) : Promise.resolve(false);
    });

    await delay(170);
    covers.forEach(function (cover) {
      var halves = Array.from(cover.querySelectorAll(".tw-wax-half"));
      halves.forEach(function (half, i) {
        if (typeof half.animate !== "function") return;
        var dx = i === 0 ? -17 : 17;
        var rot = i === 0 ? -9 : 9;
        half.animate([
          { transform: "translate3d(0,0,0) rotate(0deg)", opacity: 1 },
          { transform: "translate3d(" + dx + "px,-2px,0) rotate(" + rot + "deg)", opacity: 0 }
        ], {
          duration: SIGNATURE_MOTION.verdictCrackMs,
          easing: SIGNATURE_MOTION.easeOut,
          fill: "forwards"
        });
      });

      Array.from(cover.querySelectorAll(".tw-page")).forEach(function (page, i) {
        if (typeof page.animate !== "function") return;
        var x = (i - 1) * 18;
        var y = 6 + i * 4;
        var r = (i - 1) * 4.5;
        page.animate([
          { transform: "translate3d(0,0,0) rotate(0deg) scale(.96)", opacity: 0.92 },
          { transform: "translate3d(" + x + "px," + y + "px,0) rotate(" + r + "deg) scale(1)", opacity: 1, offset: 0.62 },
          { transform: "translate3d(" + (x * 1.25) + "px," + (y + 8) + "px,0) rotate(" + (r * 1.3) + "deg) scale(1.01)", opacity: 0 }
        ], {
          duration: SIGNATURE_MOTION.verdictPageMs,
          easing: SIGNATURE_MOTION.easeOut,
          fill: "forwards"
        });
      });

      if (typeof cover.animate === "function") {
        cover.animate([
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.48 },
          { opacity: 0, offset: 1 }
        ], {
          duration: SIGNATURE_MOTION.verdictRevealMs,
          easing: SIGNATURE_MOTION.easeInOut,
          fill: "forwards"
        });
      }
    });

    await delay(260);
    verdictWords.forEach(function (node, i) {
      window.setTimeout(function () { node.classList.add("tw-wipe-running"); }, Math.min(i, 5) * 55);
    });
    slotCounts.forEach(function (node, i) {
      window.setTimeout(function () {
        var target = Number(node.dataset.target);
        if (typeof window.sdCountUp === "function") window.sdCountUp(node, target, 280);
        else node.textContent = String(target);
      }, Math.min(i, 5) * 45);
    });

    await delay(270);
    var winningVerdict = stage.querySelector(".verdict-row.is-release .vr-word");
    if (winningVerdict && typeof window.sdBurst === "function") {
      var canvas = el("canvas", { class: "tw-burst-layer", "aria-hidden": "true" });
      stage.appendChild(canvas);
      var cr = canvas.getBoundingClientRect(), wr = winningVerdict.getBoundingClientRect();
      await window.sdBurst(canvas, wr.left - cr.left + wr.width / 2, wr.top - cr.top + wr.height / 2, {
        count: 42,
        duration: SIGNATURE_MOTION.burstMs,
        spread: Math.PI * 1.35,
        gravity: 520,
        speedMin: 90,
        speedMax: 250
      });
      canvas.remove();
    }

    await Promise.all(revealPromises);
    covers.forEach(function (cover) { cover.remove(); });
    return true;
  }

  // ---------- F4 · Verdicts (both sides revealed read-only) ----------------------
  // #transferResultsOne / Two keep production's ids and heading format; verdict lines are the provider's
  // (fixtures.results), never recomputed here. Revealed inputs are text, not fields.
  function buildVerdictPanel(p, role, cfg, fx, S, isViewer) {
    var nik = role === "playerTwo";
    var rival = nik ? "playerOne" : "playerTwo";
    var name = fx.managers[role], club = fx.clubs[role];
    var sec = el("section", { class: "panel verdict" + (isViewer ? " own" : " rival"), id: nik ? "transferResultsTwo" : "transferResultsOne", "data-sd-enter": "panel",
      "aria-labelledby": (nik ? "transferResultsTwo" : "transferResultsOne") + "Heading", "data-panel": nik ? "A" : "B" });
    sec.style.setProperty("--pa", (p.angleDeg || 0) + "deg");
    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    var h = el("h4", { id: sec.id + "Heading", class: "own-heading verdict-heading" });
    splitDots(S.verdictHeading.replace("{MANAGER}", name).replace("{CLUB}", club), "vh").forEach(function (n) { h.appendChild(n); });
    title.appendChild(h);
    if (isViewer) title.appendChild(el("span", { class: "chip chip-you m-only", text: S.tagYou }));
    sec.appendChild(title);

    var body = placeRect(el("div", { class: "panel-body verdict-body" }), p.verdictContent || p.content);
    var verdicts = fx.results[cfg.result][role] || [];
    var inputs = fx.inputs[role].signings;
    if (!verdicts.length) {
      body.classList.add("is-empty");
      body.appendChild(el("p", { class: "verdict-empty", text: S.verdictEmpty }));
    } else {
      var list = el("ol", { class: "verdict-rows" });
      verdicts.forEach(function (v) {
        var sig = inputs.filter(function (r) { return r.slot === v.slot; })[0];
        var li = el("li", { class: "verdict-row " + (v.release ? "is-release" : "is-keep"), "data-slot": v.slot });
        var rowNum = el("span", { class: "guess-num", "aria-hidden": "true" });
        rowNum.appendChild(document.createTextNode("0"));
        rowNum.appendChild(el("span", { class: "tw-slot-count", "data-target": v.slot, text: "0" }));
        li.appendChild(rowNum);
        var who = el("div", { class: "vr-who" });
        who.appendChild(el("strong", { class: "vr-name", text: sig.name }));
        who.appendChild(el("span", { class: "vr-meta", text: sig.league + " · " + sig.nationality }));
        li.appendChild(who);
        var line = v.release ? S.verdictRelease : S.verdictKeep;
        var st = el("span", { class: "vr-verdict tw-verdict-brush" });
        var parts = line.split(" · ");
        st.appendChild(el("span", { class: "vr-word", text: parts[0] }));
        st.appendChild(el("span", { class: "sep", text: " · " }));
        st.appendChild(el("span", { class: "vr-why", text: parts[1] }));
        li.appendChild(st);
        list.appendChild(li);
      });
      body.appendChild(list);
    }
    // The rival's guesses against this manager (read-only reveal): why a signing is released.
    var g = fx.inputs[rival].guessesAgainstRival || [];
    var gl = el("p", { class: "guess-reveal" });
    gl.appendChild(el("span", { class: "gr-head", text: S.guessRevealHeading.replace("{GUESSER}", fx.managers[rival]).replace("{OWNER}", name) }));
    g.forEach(function (x) {
      gl.appendChild(el("span", { class: "gr-item" }, [el("span", { class: "gr-type", text: x.type === "league" ? S.selectLeague : S.selectNationality }), " ", el("span", { class: "gr-val", text: x.value })]));
    });
    body.appendChild(gl);
    body.appendChild(buildVerdictDossierCover());
    sec.appendChild(body);
    return sec;
  }

  // Constant for every phase and state: never reads or reflects rival data.
  function buildSealedPanel(p, rivalName, S, panelKey) {
    var sec = el("section", { class: "panel sealed", "aria-label": rivalName + " " + S.tagSealed, "data-panel": panelKey, "data-sd-enter": "panel" });
    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    title.appendChild(el("span", { class: "rival-name", text: rivalName.toUpperCase() }));
    title.appendChild(el("span", { class: "chip chip-sealed", text: S.tagSealed }));
    sec.appendChild(title);
    var frost = placeRect(el("div", { class: "frost", "aria-hidden": "true" }), p.content);
    var seal = el("div", { class: "seal" }); seal.appendChild(sealSvg());
    frost.appendChild(seal);
    sec.appendChild(frost);
    return sec;
  }

  // JOB-145 moment 2: a presentation-only card files into the already-sealed rival dossier.
  // The click is never prevented, delayed or replaced; production remains the owner of submission state.
  function runGuessSubmitMotion(stage) {
    var button = stage.querySelector("#completeTransferChallenge");
    if (!button || stage.querySelector(".tw-guess-flight")) return;
    if (motionReduced()) {
      if (typeof window.sdReveal === "function") window.sdReveal(button);
      return;
    }
    var own = stage.querySelector(".panel.own");
    var dossier = stage.querySelector(".panel.sealed");
    if (!own || !dossier) return;

    var from = own.getBoundingClientRect();
    var to = dossier.getBoundingClientRect();
    var flight = el("div", { class: "tw-guess-flight", "aria-hidden": "true" });
    var wax = el("span", { class: "tw-guess-wax" });
    wax.appendChild(sealSvg());
    flight.appendChild(el("span", { class: "tw-guess-card-mark" }));
    flight.appendChild(wax);
    flight.style.left = from.left + "px";
    flight.style.top = from.top + "px";
    flight.style.width = from.width + "px";
    flight.style.height = from.height + "px";
    flight.style.setProperty("--tw-flight-x", ((to.left + to.width / 2) - (from.left + from.width / 2)) + "px");
    flight.style.setProperty("--tw-flight-y", ((to.top + to.height / 2) - (from.top + from.height / 2)) + "px");
    stage.appendChild(flight);

    requestAnimationFrame(function () {
      flight.classList.add("is-flying");
      setTimeout(function () { if (flight.isConnected) flight.classList.add("is-stamping"); }, TW_MOTION.guessSubmit.stampDelay);
    });
    setTimeout(function () { if (flight.isConnected) flight.remove(); }, TW_MOTION.guessSubmit.total);
  }

  function wireGuessSubmitMotion(stage, cfg) {
    if (cfg.phase !== "GUESS_ENTRY") return;
    var button = stage.querySelector("#completeTransferChallenge");
    if (!button) return;
    button.addEventListener("click", function () { runGuessSubmitMotion(stage); }, { passive: true });
  }

  function buildRulesCard(p, cfg, S) {
    var card = el("aside", { class: "rules-card" + (cfg.phase === "WINDOW_OPEN" ? " with-line" : ""), "aria-label": "Rules", "data-sd-enter": "panel" });
    var inner = placeRect(el("div", { class: "rules-inner" }), p.content);
    if (cfg.phase === "WINDOW_OPEN") {
      var line = el("p", { class: "rules-line transferRulesLine" });
      S.f1RulesLine.split(" · ").forEach(function (part, i) {
        if (i) line.appendChild(el("span", { class: "sep", text: " · " }));
        var sp = part.indexOf(" ");
        line.appendChild(el("span", { class: "stat" }, [
          el("span", { class: "stat-n", text: part.slice(0, sp) }), " ",
          el("span", { class: "stat-l", text: part.slice(sp + 1) })
        ]));
      });
      inner.appendChild(line);
    }
    if (cfg.phase === "SIGNING_ENTRY") {
      card.classList.add("with-summary");
      inner.appendChild(el("p", { id: "transferPhaseLockSummary", class: "lock-summary", text: S.signingLockSummary }));
    } else {
      inner.appendChild(el("p", { class: "rule-note transferRuleNote", text: S.ruleNote }));
    }
    if (cfg.phase === "COMPLETED") {
      card.classList.add("with-continue");
      inner.appendChild(el("button", { type: "button", id: "continueFromTransfers", class: "btn-continue sd-btn sd-btn--secondary", "data-sd-enter": "button", disabled: true, text: S.continueLabel }));
    }
    card.appendChild(inner);
    return card;
  }

  function buildYouChip(map, viewerIsNik, S) {
    var chip = el("div", { class: "you-chip d-only " + (viewerIsNik ? "anchor-left" : "anchor-right") });
    chip.appendChild(el("span", { class: "sr-only", text: viewerIsNik ? S.nameplateTwo : S.nameplateOne }));
    chip.appendChild(el("span", { class: "chip chip-you", text: S.tagYou }));
    var a = viewerIsNik ? map.paintedNames.playerTwo.chipAnchorLeft : map.paintedNames.playerOne.chipAnchorRight;
    chip.style.setProperty("--ax", a[0]); chip.style.setProperty("--ay", a[1]);
    return chip;
  }

  function buildFooter(S, fx, activeIndex) {
    var f = el("footer", { class: "hud-footer", "data-sd-enter": "panel" });
    f.appendChild(el("button", { type: "button", id: "backToShowdownHome", class: "ghost sd-btn sd-btn--secondary", text: S.back }));
    var mid = el("div", { class: "hud-mid" });
    mid.appendChild(el("h2", { id: "transferChallengeTitle", class: "hud-title", text: S.title.replace("{season}", String(fx.seasonNumber)) }));
    var rail = el("ol", { id: "transferPhaseNavigator", class: "rail", "aria-label": S.railAriaLabel });
    ["window", "guess_entry", "signing_entry", "completed"].forEach(function (key, i) {
      var st = i < activeIndex ? "done" : (i === activeIndex ? "active" : "upcoming");
      rail.appendChild(el("li", { class: st, "data-transfer-phase-step": key, "aria-current": i === activeIndex ? "step" : null }, [
        el("span", { class: "num", text: "0" + (i + 1) }), el("span", { class: "label", text: S.rail[i] })
      ]));
    });
    mid.appendChild(rail);
    f.appendChild(mid);
    f.appendChild(el("button", { type: "button", id: "refreshSharedTransferChallenge", class: "ghost sd-btn sd-btn--secondary", text: S.refresh }));
    return f;
  }

  // Nik's fingertip, cut from the plate, above the live text: the finger is in front of the glass.
  function buildFingertip(map) {
    var o = map.overlays.nikFingertip;
    var img = el("img", { class: "overlay-fingertip", alt: "", "aria-hidden": "true", decoding: "sync",
      src: o.files["1672"], srcset: o.files["1672"] + " 1x, " + o.files["3344"] + " 2x" });
    return placeRect(img, o.rect);
  }

  function buildGrid(map) {
    var g = el("div", { class: "debug-grid", "aria-hidden": "true" });
    function box(r, label) { var b = placeRect(el("div", { class: "dbg" }), r); b.setAttribute("data-label", label); g.appendChild(b); }
    Object.keys(map.panels).forEach(function (k) { var p = map.panels[k]; box(p.frame, k + " frame"); box(p.title, k + " title"); box(p.content, k + " content"); });
    var s = placeRect(el("div", { class: "dbg rot" }), signRect(map));
    s.setAttribute("data-label", "sign"); s.style.setProperty("--rot", map.signScreen.boardAngleDeg + "deg");
    g.appendChild(s);
    return g;
  }

  // ---------- cameras ----------------------------------------------------------

  // Desktop: cover-fit with a vertical bias so sign + panels + footer always fit.
  function layoutDesktop(stage, world, map) {
    var vw = stage.clientWidth, vh = stage.clientHeight;
    var W, H;
    if (vw / vh > PLATE_W / PLATE_H) { W = vw; H = vw * PLATE_H / PLATE_W; } else { H = vh; W = vh * PLATE_W / PLATE_H; }
    var k = W / PLATE_W;
    // Short viewports (TWG-S11): a slimmer HUD may overlap the panels' painted bottom glow (not their
    // glass content), which lowers the camera and keeps more of the painted title. Controls keep k.
    var short = vh < 700;
    stage.classList.toggle("short", short);
    var footerH = short ? 30 : 36;
    var contentBottom = Math.max(map.keepVisible.contentBottom, +(stage.dataset.contentBottom || 0));
    var bottom = short ? contentBottom * k + footerH + 2 : map.keepVisible.panelBottom * k + footerH + 6;
    var offY = 0, offX = 0;
    if (H > vh) offY = Math.max(0, Math.min(H - vh, bottom - vh));
    if (W > vw) {
      var cx = (map.keepVisible.x[0] + map.keepVisible.x[1]) / 2 * k;
      offX = Math.max(0, Math.min(W - vw, cx - vw / 2));
    }
    world.style.width = W + "px"; world.style.height = H + "px";
    world.style.left = -offX + "px"; world.style.top = -offY + "px";
    world.style.setProperty("--k", k.toFixed(5));
    world.style.removeProperty("--sk");
    stage.dataset.mode = "desktop";
    stage.dataset.k = k.toFixed(4); stage.dataset.offY = Math.round(offY); stage.dataset.offX = Math.round(offX);
    stage.dataset.titleCropPx = Math.max(0, Math.round(offY - map.keepVisible.titleTop * k));
    return W;
  }

  // Portrait: the live UI keeps its natural height and the scene box gets what is left (CSS flex).
  // The crop never gets narrower than wholeX (both managers whole) and never shows below sceneY[1]
  // (the painted desktop panels start there): the plate fades to black above them. Spare height is a
  // dark band around the scene; on very short screens the crop widens up to maxCropW.
  function layoutMobile(stage, world, map) {
    world.style.width = ""; world.style.height = ""; world.style.left = ""; world.style.top = "";
    stage.dataset.mode = "mobile"; stage.classList.remove("short");
    var scene = world.querySelector(".scene");
    var band = stage.dataset.phase === "none" ? 0 : (parseFloat(getComputedStyle(stage).getPropertyValue("--band-h")) || 28);
    var vw = stage.clientWidth, H = Math.max(1, scene.clientHeight - band);
    var m = map.mobile, want = m.sceneY[1] - m.sceneY[0];
    var kMax = vw / (m.wholeX[1] - m.wholeX[0]), kMin = vw / m.maxCropW;
    var k = Math.min(kMax, Math.max(kMin, H / want));
    var visH = H / k;
    // spare height goes above the scene (blurred stadium), so the scene sits on the caption
    var spare = stage.dataset.phase === "none" ? 0.5 : 1;                  // plate only: centred
    var y0 = visH >= want ? m.sceneY[0] - (visH - want) * spare : m.sceneY[0];
    var cutY = Math.min(m.sceneY[1], y0 + visH), fadeStart = cutY - m.fadePlate;
    var x0 = (m.wholeX[0] + m.wholeX[1]) / 2 - vw / k / 2;
    world.style.setProperty("--k", k.toFixed(5));
    world.style.setProperty("--crop-x", x0.toFixed(1)); world.style.setProperty("--crop-y", y0.toFixed(1));
    // plane-space mask: soft top edge, fade out before the painted desktop panels
    world.style.setProperty("--mask-a", (Math.max(0, y0) * k + 22).toFixed(1) + "px");
    world.style.setProperty("--mask-top", (Math.max(0, y0) * k).toFixed(1) + "px");
    world.style.setProperty("--mask-b", (fadeStart * k).toFixed(1) + "px");
    world.style.setProperty("--mask-c", (cutY * k).toFixed(1) + "px");
    stage.dataset.k = k.toFixed(4); stage.dataset.offY = Math.round(y0 * k); stage.dataset.offX = Math.round(x0 * k);
    stage.dataset.sceneCrop = [Math.round(x0), Math.round(y0), Math.round(x0 + vw / k), Math.round(cutY)].join(",");
    return PLATE_W * k;
  }

  // Renders one frame into a stage. opts.mobile forces the portrait layout (review page);
  // otherwise the MOBILE_MQ media query decides. opts.freeze stops the demo clock.
  function render(stage, fx, map, frameId, opts) {
    opts = opts || {};
    var S = fx.strings, cfg = fx.frames[frameId];
    if (!cfg) throw new Error("Unknown frame " + frameId);
    if (stage.__tw) stage.__tw.dispose();
    stage.innerHTML = "";
    stage.dataset.frame = frameId;
    stage.dataset.phase = cfg.phase || "none";
    applySignatureMotionConstants(stage);
    // F3/F4 glass content uses the painted glass down to the inner frame line (platemap signingContent / verdictContent)
    if (cfg.phase === "SIGNING_ENTRY") stage.dataset.contentBottom = map.panels.A.signingContent[3];
    else if (cfg.phase === "COMPLETED") stage.dataset.contentBottom = map.panels.A.verdictContent[3];
    else delete stage.dataset.contentBottom;

    var world = el("div", { class: "world" });
    var scene = el("div", { class: "scene", "data-sd-enter": "scene" });
    var plane = el("div", { class: "plane" });
    var pic = el("picture", { class: "plate" });
    var base = "assets/ENV_TR2_PLATE_G_LOCKED_V1_";
    if (!opts.webpOnly) pic.appendChild(el("source", { type: "image/avif", srcset: base + "1672.avif 1672w, " + base + "3344.avif 3344w" }));
    pic.appendChild(el("source", { type: "image/webp", srcset: base + "1672.webp 1672w, " + base + "3344.webp 3344w" }));
    var img = opts.webpOnly
      ? el("img", { src: base + "1672.webp", alt: "", decoding: "async" })
      : el("img", { src: base + "1672.png", srcset: base + "1672.png 1672w, " + base + "3344.png 3344w", alt: "", decoding: "sync" });
    pic.appendChild(img);
    plane.appendChild(pic);
    scene.appendChild(el("div", { class: "scene-atmos", "aria-hidden": "true" }));
    scene.appendChild(plane);
    world.appendChild(buildWordmark());
    world.appendChild(scene);

    if (!cfg.plateOnly) {
      var nik = cfg.viewer === "playerTwo";
      var win = cfg.phase === "WINDOW_OPEN";
      plane.appendChild(buildSign(map, cfg, S));
      plane.appendChild(buildYouChip(map, nik, S));
      plane.appendChild(buildFingertip(map));
      scene.appendChild(buildStatus(map, cfg, S));
      var own = nik ? map.panels.A : map.panels.B;
      if (cfg.phase === "COMPLETED") {
        // Both sides revealed; viewer's panel first in DOM (reading order: you, then rival).
        var vA = buildVerdictPanel(map.panels.A, "playerTwo", cfg, fx, S, nik);
        var vB = buildVerdictPanel(map.panels.B, "playerOne", cfg, fx, S, !nik);
        world.appendChild(nik ? vA : vB); world.appendChild(nik ? vB : vA);
      } else {
      var ownPanel = win ? buildWindowPanel(own, nik, cfg, S)
        : cfg.phase === "SIGNING_ENTRY" ? buildSigningPanel(own, nik, cfg, fx, S) : buildGuessPanel(own, nik, S);
      // Left-to-right DOM order (B then A). The sealed panel has no focusable content.
      if (nik) {
        world.appendChild(buildSealedPanel(map.panels.B, fx.managers.playerOne, S, "B"));
        world.appendChild(ownPanel);
      } else {
        world.appendChild(ownPanel);
        world.appendChild(buildSealedPanel(map.panels.A, fx.managers.playerTwo, S, "A"));
      }
      }
      world.appendChild(buildRulesCard(map.panels.C, cfg, S));
    }
    if (opts.grid) plane.appendChild(buildGrid(map));
    stage.appendChild(world);
    if (!cfg.plateOnly) stage.appendChild(buildFooter(S, fx, ["WINDOW_OPEN", "GUESS_ENTRY", "SIGNING_ENTRY", "COMPLETED"].indexOf(cfg.phase)));
    wireGuessSubmitMotion(stage, cfg);
    world.style.setProperty("--glass", "url(" + map.mobile.glass.file + ")");
    world.style.setProperty("--plate-url", "url(" + base + "1672.webp)");

    var mq = matchMedia(MOBILE_MQ);
    function isMobile() { return typeof opts.mobile === "boolean" ? opts.mobile : mq.matches; }
    function relayout() {
      stage.classList.toggle("pv-mobile", isMobile());
      var W = isMobile() ? layoutMobile(stage, world, map) : layoutDesktop(stage, world, map);
      img.sizes = Math.round(W) + "px";
      pic.querySelectorAll("source").forEach(function (s) { s.sizes = img.sizes; });
    }
    relayout();
    addEventListener("resize", relayout);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { if (isMobile()) relayout(); }) : null;
    if (ro) ro.observe(scene);
    if (mq.addEventListener) mq.addEventListener("change", relayout);

    // Demo clock. Production owns the real value (server-authoritative; SYNC / 00:00 states).
    // The small hand is decorative only and ticks once per displayed second.
    var timer = stage.querySelector("#transferTimerDisplay"), tick = null;
    if (cfg.phase === "WINDOW_OPEN" && !opts.freeze) {
      var timerText = timer && timer.querySelector(".timer-text");
      var timerHand = timer && timer.querySelector(".timer-hand");
      var t0 = Date.now(), start = cfg.timerSeconds, lastWhole = Math.max(0, Math.floor(start));
      tick = setInterval(function () {
        var remaining = Math.max(0, start - (Date.now() - t0) / 1000);
        var whole = Math.floor(remaining);
        if (timerText) timerText.textContent = fmtClock(whole);
        if (whole !== lastWhole) {
          setClockHand(timerHand, whole, true);
          lastWhole = whole;
        }
      }, 250);
    }
    stage.__tw = { dispose: function () {
      if (tick) clearInterval(tick);
      if (ro) ro.disconnect();
      removeEventListener("resize", relayout);
      if (mq.removeEventListener) mq.removeEventListener("change", relayout);
    } };
    return (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
      return document.fonts ? document.fonts.ready : null;
    }).then(function () {
      var root = document;
      var entrance = typeof window.sdEnter === "function" ? window.sdEnter(root) : null;
      var entranceWait = new Promise(function (resolve) {
        window.setTimeout(resolve, entrance && entrance.duration ? entrance.duration : 0);
      });
      var signature = cfg.phase === "COMPLETED" ? runVerdictReveal(stage) : Promise.resolve(false);
      return Promise.all([entranceWait, signature]);
    });
  }
  window.TWPlate = { render: render, frames: null };

  function main() {
    var stage = document.getElementById("stage-root");
    if (!stage || stage.hasAttribute("data-manual")) return;
    var frameId = qs("frame", "F1");
    Promise.all([fetch("fixtures.json").then(function (r) { return r.json(); }), fetch("platemap.json").then(function (r) { return r.json(); })])
      .then(function (res) {
        document.title = "Transfer War · " + frameId;
        return render(stage, res[0], res[1], frameId, { grid: qs("grid", "") === "1", freeze: qs("freeze", "") === "1" });
      })
      .then(function () { window.__plateReady = true; })
      .catch(function (e) { document.body.textContent = "Failed: " + e; });
  }
  main();
})();
