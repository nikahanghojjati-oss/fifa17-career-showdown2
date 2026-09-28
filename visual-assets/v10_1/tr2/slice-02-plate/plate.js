/* TW-PLATE-G · "Paint the stage, place the live text".
 * One locked key-art plate owns managers, table, props, panels and light.
 * This file only places screen-aligned live text and controls on the painted
 * panel faces (coordinates from platemap.json, plate px × k).
 * ?frame=G2 (Nik viewing) | G3 (Daniel viewing) | S0 (plate only). ?grid=1 draws the plate map.
 */
(function () {
  "use strict";

  var PLATE_W = 1672, PLATE_H = 941;

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

  // Place a node on a plate rect [x0,y0,x1,y1] in plate px. CSS uses --k for scale.
  function placeRect(node, r) {
    node.style.left = "calc(var(--k) * " + r[0] + "px)";
    node.style.top = "calc(var(--k) * " + r[1] + "px)";
    node.style.width = "calc(var(--k) * " + (r[2] - r[0]) + "px)";
    node.style.height = "calc(var(--k) * " + (r[3] - r[1]) + "px)";
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

  // ---------- builders -------------------------------------------------------

  function buildSign(map, S) {
    var s = map.signScreen;
    var wrap = el("div", { class: "sign-screen" });
    placeRect(wrap, [s.cx - s.w / 2, s.cy - s.h / 2, s.cx + s.w / 2, s.cy + s.h / 2]);
    wrap.appendChild(el("div", { id: "transferTimerDisplay", class: "sign-main closed", text: S.signWindowClosed }));
    wrap.appendChild(el("div", { id: "transferPhaseStatus", class: "sign-status", role: "status", "aria-live": "polite", text: S.guessStatus }));
    return wrap;
  }

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

  function buildOwnPanel(p, viewerIsNik, S) {
    var rival = viewerIsNik ? "Daniel" : "Nik";
    var prefix = viewerIsNik ? "p1" : "p2";
    var headingId = viewerIsNik ? "guessAgainstOneHeading" : "guessAgainstTwoHeading";
    var sec = el("section", { class: "panel own", "aria-labelledby": headingId, "data-panel": viewerIsNik ? "A" : "B" });

    var title = placeRect(el("div", { class: "panel-title" }), p.title);
    title.appendChild(el("h3", { id: headingId, class: "own-heading", text: viewerIsNik ? S.guessHeadingNikViewer : S.guessHeadingDanielViewer }));
    title.appendChild(el("span", { class: "chip chip-private", text: S.tagPrivate }));
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

  // Constant for every state: never reads or reflects rival data.
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

  function buildRulesCard(p, S) {
    var card = el("aside", { class: "rules-card", "aria-label": "Rules" });
    card.appendChild(placeRect(el("p", { class: "rule-note", text: S.ruleNote }), p.content));
    return card;
  }

  function buildYouChip(map, viewerIsNik, S) {
    var chip = el("div", { class: "you-chip " + (viewerIsNik ? "anchor-left" : "anchor-right") });
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
    var s = map.signScreen; box([s.cx - s.w / 2, s.cy - s.h / 2, s.cx + s.w / 2, s.cy + s.h / 2], "sign");
    return g;
  }

  // ---------- camera: cover-fit, bias so sign + panels + footer always fit ---

  function layout(stage, world, img, map) {
    var vw = stage.clientWidth, vh = stage.clientHeight;
    var W, H;
    if (vw / vh > PLATE_W / PLATE_H) { W = vw; H = vw * PLATE_H / PLATE_W; } else { H = vh; W = vh * PLATE_W / PLATE_H; }
    var k = W / PLATE_W;
    var footerH = parseFloat(getComputedStyle(stage).getPropertyValue("--footer-h")) || 36;
    var offY = 0, offX = 0;
    if (H > vh) {
      var need = map.keepVisible.panelBottom * k + footerH + 6 - vh;
      offY = Math.max(0, Math.min(H - vh, need));
    }
    if (W > vw) {
      var cx = (map.keepVisible.x[0] + map.keepVisible.x[1]) / 2 * k;
      offX = Math.max(0, Math.min(W - vw, cx - vw / 2));
    }
    world.style.width = W + "px"; world.style.height = H + "px";
    world.style.left = -offX + "px"; world.style.top = -offY + "px";
    world.style.setProperty("--k", k.toFixed(5));
    img.sizes = Math.round(W) + "px";
    stage.dataset.k = k.toFixed(4); stage.dataset.offY = Math.round(offY); stage.dataset.offX = Math.round(offX);
  }

  function main() {
    var frameId = qs("frame", "G2");
    Promise.all([fetch("fixtures.json").then(function (r) { return r.json(); }), fetch("platemap.json").then(function (r) { return r.json(); })])
      .then(function (res) {
        var fx = res[0], map = res[1], S = fx.strings, cfg = fx.frames[frameId];
        if (!cfg) { document.body.textContent = "Unknown frame " + frameId; return; }
        var stage = document.getElementById("stage-root");
        stage.dataset.frame = frameId;
        document.title = "Transfer War · " + frameId;

        var world = el("div", { class: "world" });
        var pic = el("picture", { class: "plate" });
        var base = "assets/ENV_TR2_PLATE_G_LOCKED_V1_";
        pic.appendChild(el("source", { type: "image/avif", srcset: base + "1672.avif 1672w, " + base + "3344.avif 3344w" }));
        pic.appendChild(el("source", { type: "image/webp", srcset: base + "1672.webp 1672w, " + base + "3344.webp 3344w" }));
        var img = el("img", { src: base + "1672.png", srcset: base + "1672.png 1672w, " + base + "3344.png 3344w", alt: "", decoding: "sync" });
        pic.appendChild(img);
        world.appendChild(pic);
        pic.querySelectorAll("source").forEach(function (s) { s.sizes = "100vw"; });

        if (!cfg.plateOnly) {
          var nik = cfg.viewer === "playerTwo";
          world.appendChild(buildSign(map, S));
          // Left-to-right DOM order (B then A). The sealed panel has no focusable content.
          if (nik) {
            world.appendChild(buildSealedPanel(map.panels.B, fx.managers.playerOne, S, "B"));
            world.appendChild(buildOwnPanel(map.panels.A, true, S));
          } else {
            world.appendChild(buildOwnPanel(map.panels.B, false, S));
            world.appendChild(buildSealedPanel(map.panels.A, fx.managers.playerTwo, S, "A"));
          }
          world.appendChild(buildRulesCard(map.panels.C, S));
          world.appendChild(buildYouChip(map, nik, S));
          world.appendChild(buildFingertip(map));
        }
        if (qs("grid", "") === "1") world.appendChild(buildGrid(map));
        stage.appendChild(world);
        if (!cfg.plateOnly) stage.appendChild(buildFooter(S, 1));

        function relayout() {
          layout(stage, world, img, map);
          pic.querySelectorAll("source").forEach(function (s) { s.sizes = img.sizes; });
        }
        relayout();
        addEventListener("resize", relayout);
        (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
          return document.fonts ? document.fonts.ready : null;
        }).then(function () { window.__plateReady = true; });
      })
      .catch(function (e) { document.body.textContent = "Failed: " + e; });
  }
  main();
})();
