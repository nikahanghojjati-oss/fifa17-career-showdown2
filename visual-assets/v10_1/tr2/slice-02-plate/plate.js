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

  // ---------- sign (read-only, rotated to the board: TWG-S7) ------------------

  function signRect(map) {
    var s = map.signScreen;
    return [s.cx - s.w / 2, s.cy - s.h / 2, s.cx + s.w / 2, s.cy + s.h / 2];
  }

  function buildSign(map, cfg, S) {
    var wrap = placeRect(el("div", { class: "sign-screen" }), signRect(map));
    wrap.style.setProperty("--rot", map.signScreen.boardAngleDeg + "deg");
    if (cfg.phase === "WINDOW_OPEN") {
      wrap.classList.add("is-live");
      wrap.appendChild(el("div", { id: "transferTimerDisplay", class: "sign-main timer", role: "timer", "aria-live": "off", text: fmtClock(cfg.timerSeconds) }));
    } else {
      wrap.appendChild(el("div", { id: "transferTimerDisplay", class: "sign-main closed", text: S.signWindowClosed }));
      if (cfg.phase === "SIGNING_ENTRY" || cfg.phase === "COMPLETED") wrap.classList.add("status-board");
    }
    return wrap;
  }

  // Separate node so portrait can move it to a lower-third; desktop registers it to the sign too.
  function buildStatus(map, cfg, S) {
    var st = placeRect(el("p", { id: "transferPhaseStatus", class: "sign-status", role: "status", "aria-live": "polite" }), signRect(map));
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
    var sel = el("select", { id: prefix + "Guess" + i + "Type", "data-transfer-field": true, "aria-label": "Guess " + i + " against " + rivalName + " type" }, [
      el("option", { value: "", text: S.selectPlaceholder }),
      el("option", { value: "league", text: S.selectLeague }),
      el("option", { value: "nationality", text: S.selectNationality })
    ]);
    var inp = el("input", { type: "text", id: prefix + "Guess" + i + "Value", "data-transfer-field": true, autocomplete: "off",
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
    var sec = el("section", { class: "panel own " + phaseClass, "aria-labelledby": labelledBy, "data-panel": viewerIsNik ? "A" : "B" });
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
    act.appendChild(el("button", { type: "button", id: "completeTransferChallenge", class: "btn-lock", text: S.primary }));
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
    var btn = el("button", { type: "button", id: "endTransferTimer", class: "btn-end", text: S.f1Action });
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
      fields.forEach(function (f) {
        var key = f[0] === "Name" ? "name" : f[0].toLowerCase();
        row.appendChild(el("input", { type: "text", id: prefix + "Signing" + i + f[0], "data-transfer-field": true, autocomplete: "off",
          "aria-label": who + " signing " + i + " " + f[2], placeholder: f[1], disabled: locked, value: locked ? (data[key] || "") : null }));
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
      var btn = el("button", { type: "button", id: "completeTransferChallenge", class: "btn-lock", text: S.signingPrimary });
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

  // ---------- F4 · Verdicts (both sides revealed read-only) ----------------------
  // #transferResultsOne / Two keep production's ids and heading format; verdict lines are the provider's
  // (fixtures.results), never recomputed here. Revealed inputs are text, not fields.
  function buildVerdictPanel(p, role, cfg, fx, S, isViewer) {
    var nik = role === "playerTwo";
    var rival = nik ? "playerOne" : "playerTwo";
    var name = fx.managers[role], club = fx.clubs[role];
    var sec = el("section", { class: "panel verdict" + (isViewer ? " own" : " rival"), id: nik ? "transferResultsTwo" : "transferResultsOne",
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
        li.appendChild(el("span", { class: "guess-num", "aria-hidden": "true", text: "0" + v.slot }));
        var who = el("div", { class: "vr-who" });
        who.appendChild(el("strong", { class: "vr-name", text: sig.name }));
        who.appendChild(el("span", { class: "vr-meta", text: sig.league + " · " + sig.nationality }));
        li.appendChild(who);
        var line = v.release ? S.verdictRelease : S.verdictKeep;
        var st = el("span", { class: "vr-verdict" });
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
    if (!g.length) gl.appendChild(el("span", { class: "gr-item", text: S.guessRevealNone }));
    g.forEach(function (x) {
      gl.appendChild(el("span", { class: "gr-item" }, [el("span", { class: "gr-type", text: x.type === "league" ? S.selectLeague : S.selectNationality }), " ", el("span", { class: "gr-val", text: x.value })]));
    });
    body.appendChild(gl);
    sec.appendChild(body);
    return sec;
  }

  // Constant for every phase and state: never reads or reflects rival data.
  function buildSealedPanel(p, rivalName, S, panelKey) {
    var sec = el("section", { class: "panel sealed", "aria-label": rivalName + " " + S.tagSealed, "data-panel": panelKey });
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

  function buildRulesCard(p, cfg, S) {
    var card = el("aside", { class: "rules-card" + (cfg.phase === "WINDOW_OPEN" ? " with-line" : ""), "aria-label": "Rules" });
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
      inner.appendChild(el("button", { type: "button", id: "continueFromTransfers", class: "btn-continue", disabled: true, text: S.continueLabel }));
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

  function buildFooter(S, activeIndex) {
    var f = el("footer", { class: "hud-footer" });
    f.appendChild(el("button", { type: "button", id: "backToShowdownHome", class: "ghost", text: S.back }));
    var mid = el("div", { class: "hud-mid" });
    mid.appendChild(el("h2", { id: "transferChallengeTitle", class: "hud-title", text: S.title.replace("{season}", "1") }));
    var rail = el("ol", { id: "transferPhaseNavigator", class: "rail", "aria-label": S.railAriaLabel });
    ["window", "guess_entry", "signing_entry", "completed"].forEach(function (key, i) {
      var st = i < activeIndex ? "done" : (i === activeIndex ? "active" : "upcoming");
      rail.appendChild(el("li", { class: st, "data-transfer-phase-step": key, "aria-current": i === activeIndex ? "step" : null }, [
        el("span", { class: "num", text: "0" + (i + 1) }), el("span", { class: "label", text: S.rail[i] })
      ]));
    });
    mid.appendChild(rail);
    f.appendChild(mid);
    f.appendChild(el("button", { type: "button", id: "refreshSharedTransferChallenge", class: "ghost", text: S.refresh }));
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
    var bottom = short ? map.keepVisible.contentBottom * k + footerH + 2 : map.keepVisible.panelBottom * k + footerH + 6;
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

    var world = el("div", { class: "world" });
    var scene = el("div", { class: "scene" });
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
    if (!cfg.plateOnly) stage.appendChild(buildFooter(S, ["WINDOW_OPEN", "GUESS_ENTRY", "SIGNING_ENTRY", "COMPLETED"].indexOf(cfg.phase)));
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
    var timer = stage.querySelector("#transferTimerDisplay"), tick = null;
    if (cfg.phase === "WINDOW_OPEN" && !opts.freeze) {
      var t0 = Date.now(), start = cfg.timerSeconds;
      tick = setInterval(function () { timer.textContent = fmtClock(start - (Date.now() - t0) / 1000); }, 250);
    }
    stage.__tw = { dispose: function () {
      if (tick) clearInterval(tick);
      if (ro) ro.disconnect();
      removeEventListener("resize", relayout);
      if (mq.removeEventListener) mq.removeEventListener("change", relayout);
    } };
    return (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
      return document.fonts ? document.fonts.ready : null;
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
