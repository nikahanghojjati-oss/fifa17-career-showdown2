/* CLOUD-TR2-01-CP1 static frame renderer.
 * Fixture-driven, no network calls beyond same-origin static assets, no animation.
 * Renders exactly one frame per ?frame=F1..F5|S1|S2 query parameter.
 */
(function () {
  "use strict";

  var ASSET_BASE = "assets/derived/";

  function qs(name, fallback) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || fallback;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.indexOf("aria-") === 0 || k === "role" || k === "tabindex") node.setAttribute(k, attrs[k]);
        else if (k === "style") Object.assign(node.style, attrs[k]);
        else if (k === "dataset") Object.assign(node.dataset, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  // Plate exports are named ENV_TR2_WARROOM_PLATE_V1_<width>.{webp,avif}; there is
  // no matching PNG at that exact width, so the <img> fallback src points at the
  // 1672-wide WebP (always present) rather than a nonexistent PNG twin.
  function platePicture(width, altText) {
    var pic = document.createElement("picture");
    var base = ASSET_BASE + "ENV_TR2_WARROOM_PLATE_V1_" + width;
    pic.appendChild(el("source", { srcset: base + ".avif", type: "image/avif" }));
    pic.appendChild(el("source", { srcset: base + ".webp", type: "image/webp" }));
    pic.appendChild(el("img", { src: ASSET_BASE + "ENV_TR2_WARROOM_PLATE_V1_1672.webp", alt: altText || "", decoding: "sync" }));
    return pic;
  }

  function tableCutoutPicture() {
    var pic = document.createElement("picture");
    var base = ASSET_BASE + "ENV_TR2_WARROOM_TABLEMASK_V1";
    pic.appendChild(el("source", { srcset: base + ".avif", type: "image/avif" }));
    pic.appendChild(el("source", { srcset: base + ".webp", type: "image/webp" }));
    pic.appendChild(el("img", { src: base + ".png", alt: "" }));
    return pic;
  }

  function posePicture(assetId, altText) {
    var pic = document.createElement("picture");
    var base = ASSET_BASE + assetId;
    pic.appendChild(el("source", { srcset: base + ".avif", type: "image/avif" }));
    pic.appendChild(el("source", { srcset: base + ".webp", type: "image/webp" }));
    pic.appendChild(el("img", { src: base + "_MASTER.png", alt: altText || "", decoding: "sync" }));
    return pic;
  }

  function fitTextToWidth(node, maxWidthPx, startSizePx, minSizePx) {
    var size = startSizePx;
    node.style.fontSize = size + "px";
    node.style.whiteSpace = "nowrap";
    // measure via the node itself once attached to the DOM
    requestFit();
    function requestFit() {
      var tries = 0;
      (function step() {
        if (node.scrollWidth <= maxWidthPx || size <= minSizePx || tries > 40) return;
        size -= 2;
        node.style.fontSize = size + "px";
        tries += 1;
        step();
      })();
    }
  }

  function worldBoxFor(viewportW, viewportH) {
    var worldAspect = 16 / 9;
    var viewportAspect = viewportW / viewportH;
    var width, height;
    if (viewportAspect > worldAspect) {
      width = viewportW;
      height = width / worldAspect;
    } else {
      height = viewportH;
      width = height * worldAspect;
    }
    return {
      width: width,
      height: height,
      left: (viewportW - width) / 2,
      top: (viewportH - height) / 2,
    };
  }

  // Converts a desired final on-screen fraction (u,v) into the world-space pixel
  // position that lands there once the camera's scale+focus-origin transform is
  // applied. This lets pose eye-points and world-anchored HUD attachments (which
  // are authored against fixed screen targets) stay correct under any camera zoom.
  function worldPxFromScreenFraction(u, v, camera, worldW, worldH) {
    var fu = camera.focus[0], fv = camera.focus[1], s = camera.scale;
    var wu = fu + (u - fu) / s;
    var wv = fv + (v - fv) / s;
    return [wu * worldW, wv * worldH];
  }

  function computePosePlacement(managerKey, poseFileKey, camera, fixtures, worldW, worldH) {
    var eyeTarget = fixtures.eyeTargets[managerKey];
    var eyeWorldPx = worldPxFromScreenFraction(eyeTarget[0], eyeTarget[1], camera, worldW, worldH);
    var meta = fixtures.poseSourceMeta[poseFileKey];
    var targetWorldHeadHeightPx = (fixtures.worldHeadHeightTargetPx / fixtures.worldReferenceHeight) * worldH;
    var scaleFactor = targetWorldHeadHeightPx / meta.headHeight;
    var eyeCenterSrc = [(meta.eyeLeft[0] + meta.eyeRight[0]) / 2, (meta.eyeLeft[1] + meta.eyeRight[1]) / 2];
    var width = meta.width * scaleFactor;
    var height = meta.height * scaleFactor;
    var left = eyeWorldPx[0] - eyeCenterSrc[0] * scaleFactor;
    var top = eyeWorldPx[1] - eyeCenterSrc[1] * scaleFactor;
    return { left: left, top: top, width: width, height: height, scaleFactor: scaleFactor };
  }

  function buildCueOverlay(cueType, plateMap, masks) {
    var wrap = el("div", { class: "layer l1-cue", "aria-hidden": "true" });
    if (cueType === "CUE-WINDOW") {
      var lift = el("div", { class: "cue-overlay cue-lift" });
      lift.style.setProperty("--mask-url", "url(" + masks.LIGHTRIG_GLASS + ")");
      wrap.appendChild(lift);
    } else if (cueType === "CUE-PRIVATE") {
      var glassDark = el("div", { class: "cue-overlay cue-darken" });
      glassDark.style.setProperty("--mask-url", "url(" + masks.LIGHTRIG_GLASS + ")");
      glassDark.style.opacity = "0.42";
      var tacticsDark = el("div", { class: "cue-overlay cue-darken" });
      tacticsDark.style.setProperty("--mask-url", "url(" + masks.LIGHTRIG_TACTICS + ")");
      tacticsDark.style.opacity = "0.52";
      var vignette = el("div", { class: "cue-overlay cue-vignette" });
      wrap.appendChild(glassDark);
      wrap.appendChild(tacticsDark);
      wrap.appendChild(vignette);
    }
    return wrap;
  }

  function buildLockup(compact) {
    var wrap = el("div", { class: "lockup" + (compact ? " compact" : ""), "aria-hidden": "true" });
    var svgNs = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 340 90");
    svg.setAttribute("role", "presentation");
    var text = document.createElementNS(svgNs, "text");
    text.setAttribute("x", "6");
    text.setAttribute("y", "62");
    text.setAttribute("font-family", "'Kaushan Script', cursive");
    text.setAttribute("font-size", "52");
    text.setAttribute("fill", "#F2C45B");
    text.setAttribute("stroke", "#3a2a0a");
    text.setAttribute("stroke-width", "1.5");
    text.setAttribute("paint-order", "stroke");
    text.textContent = "Transfer War";
    svg.appendChild(text);
    wrap.appendChild(svg);
    return wrap;
  }

  function buildTopBar(strings, mobile) {
    var bar = el("div", { class: "top-bar" });
    var back = el("button", { type: "button", class: "ghost-chip", id: "backToShowdownHome" }, []);
    back.textContent = strings.back;
    var refresh = el("button", { type: "button", class: "ghost-chip", id: "refreshSharedTransferChallenge" }, []);
    refresh.textContent = strings.refresh;
    var title = el("div", { class: "top-bar-title", id: "transferChallengeTitle" });
    title.textContent = strings.title.replace("{season}", "1");
    bar.appendChild(back);
    bar.appendChild(title);
    bar.appendChild(refresh);
    return bar;
  }

  function buildPhaseRail(strings, activeIndex, doneUpTo, mobile) {
    var nav = el("ol", {
      class: "phase-rail", id: "transferPhaseNavigator", "aria-label": strings.railAriaLabel,
      tabindex: "-1",
    });
    strings.rail.forEach(function (label, i) {
      var num = String(i + 1).padStart(2, "0");
      var state = i < doneUpTo ? "done" : (i === activeIndex ? "active" : "upcoming");
      var li = el("li", {
        class: state, "data-transfer-phase-step": ["window", "guess_entry", "signing_entry", "completed"][i],
      });
      li.appendChild(el("span", { class: "num", text: num }));
      li.appendChild(el("span", { class: "label", text: label }));
      nav.appendChild(li);
    });
    return nav;
  }

  function buildSignDisplay(text, plateMap, worldW, worldH, dimmed, isTimer) {
    var rect = plateMap.sign_face_rect;
    var left = rect.u0 * worldW;
    var top = rect.v0 * worldH;
    var width = (rect.u1 - rect.u0) * worldW;
    var height = (rect.v1 - rect.v0) * worldH;
    var attrs = {
      class: "sign-display" + (dimmed ? " dimmed" : ""),
      id: "transferTimerDisplay",
      style: { left: left + "px", top: top + "px", width: width + "px", height: height + "px" },
    };
    if (isTimer) { attrs.role = "timer"; attrs["aria-live"] = "off"; }
    var node = el("div", attrs);
    node.textContent = text;
    fitTextToWidth(node, width * 0.92, height * 0.78, 10);
    return node;
  }

  function buildNameplate(text, tag, tagClass, rect) {
    var node = el("div", { class: "nameplate", style: rect });
    var label = document.createTextNode(text);
    node.appendChild(label);
    if (tag) node.appendChild(el("span", { class: "tag " + tagClass, text: tag }));
    return node;
  }

  function buildMotto(text, rect) {
    return el("div", { class: "motto", style: rect, "aria-hidden": "true", text: text });
  }

  function buildWindowBriefPanel(strings, earlyEndRequested) {
    var panel = el("div", { class: "glass-panel chamfer-tr window-brief-panel" });
    panel.appendChild(el("div", { class: "rail-left" }));
    panel.appendChild(el("div", { class: "rail-right" }));
    var status = el("div", { class: "status-line", id: "transferPhaseStatus", role: "status", "aria-live": "polite" });
    status.appendChild(el("span", { class: "live-dot", "aria-hidden": "true" }));
    status.appendChild(el("span", { class: "status-text", text: strings.f1Status }));
    panel.appendChild(status);
    panel.appendChild(el("p", { class: "phase-intro", id: "transferPhaseIntro", text: strings.f1Intro }));
    panel.appendChild(el("p", { class: "rules-line", text: strings.f1RulesLine }));
    panel.appendChild(el("p", { class: "rule-note", text: strings.ruleNote }));
    var btn = el("button", { type: "button", class: "btn-secondary", id: "endTransferTimer" });
    btn.textContent = earlyEndRequested ? "EARLY END REQUESTED ✓" : strings.f1Action;
    panel.appendChild(btn);
    return panel;
  }

  function buildGuessSlot(index, prefix, rivalName) {
    var slot = el("div", { class: "scouting-slot" });
    slot.appendChild(el("div", { class: "slot-num", "aria-hidden": "true", text: String(index).padStart(2, "0") }));
    var fields = el("div", { class: "slot-fields" });
    var typeId = prefix + "Guess" + index + "Type";
    var valueId = prefix + "Guess" + index + "Value";
    var select = el("select", { id: typeId, "aria-label": "Guess " + index + " against " + rivalName + " type" });
    select.appendChild(el("option", { value: "", text: "Guess type" }));
    select.appendChild(el("option", { value: "league", text: "League" }));
    select.appendChild(el("option", { value: "nationality", text: "Nationality" }));
    var input = el("input", {
      type: "text", id: valueId, "aria-label": "Guess " + index + " against " + rivalName + " value",
      placeholder: "Choose League or Nationality first", disabled: "disabled",
    });
    fields.appendChild(select);
    fields.appendChild(input);
    slot.appendChild(fields);
    return slot;
  }

  function buildGuessViewerPanel(strings, side, viewerIsPlayerTwo) {
    var prefix = viewerIsPlayerTwo ? "p1" : "p2";
    var rivalName = viewerIsPlayerTwo ? "Daniel" : "Nik";
    var headingId = viewerIsPlayerTwo ? "guessAgainstOneHeading" : "guessAgainstTwoHeading";
    var heading = viewerIsPlayerTwo ? strings.guessHeadingNikViewer : strings.guessHeadingDanielViewer;

    var panel = el("div", { class: "glass-panel guess-viewer-panel side-" + side });
    panel.appendChild(el("div", { class: "rail-left" }));
    panel.appendChild(el("div", { class: "rail-right" }));
    var header = el("div", { class: "guess-header" });
    header.appendChild(el("span", { class: "lock-glyph", "aria-hidden": "true" }));
    header.appendChild(el("span", {
      class: "status-text", id: "transferPhaseStatus", role: "status", "aria-live": "polite", text: strings.guessStatus,
    }));
    header.appendChild(el("span", { class: "chip-private", text: strings.tagPrivate }));
    panel.appendChild(header);
    panel.appendChild(el("p", { class: "phase-intro", id: "transferPhaseIntro", text: strings.guessIntro }));
    panel.appendChild(el("h3", { class: "guess-heading", id: headingId, text: heading }));
    panel.appendChild(el("p", { class: "rule-note", text: strings.ruleNote }));

    var slots = el("div", { class: "scouting-slots" });
    for (var i = 1; i <= 3; i++) slots.appendChild(buildGuessSlot(i, prefix, rivalName));
    panel.appendChild(slots);

    var actionRow = el("div", { class: "action-row" });
    actionRow.appendChild(el("p", { class: "privacy-note", id: "transferGuessPrivacyNote", text: strings.privacyNote }));
    actionRow.appendChild(el("button", { type: "button", class: "btn-primary", id: "completeTransferChallenge", text: strings.primary }));
    panel.appendChild(actionRow);

    panel.appendChild(el("p", { class: "error-line", id: "transferChallengeError" }));
    return panel;
  }

  function buildSealedDossier(name, rect) {
    var node = el("div", { class: "sealed-dossier", style: rect });
    node.appendChild(el("div", { class: "dossier-name", text: name.toUpperCase() + " · SEALED" }));
    node.appendChild(el("div", { class: "dossier-lock", "aria-hidden": "true", text: "🔒" }));
    var seal = el("div", { class: "dossier-seal", "aria-hidden": "true" });
    var svgNs = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 48 48");
    var circle = document.createElementNS(svgNs, "circle");
    circle.setAttribute("cx", "24"); circle.setAttribute("cy", "24"); circle.setAttribute("r", "20");
    circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "#C99B45"); circle.setAttribute("stroke-width", "2");
    var text = document.createElementNS(svgNs, "text");
    text.setAttribute("x", "24"); text.setAttribute("y", "30"); text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-family", "'Barlow Condensed', sans-serif"); text.setAttribute("font-weight", "700");
    text.setAttribute("font-size", "16"); text.setAttribute("fill", "#C99B45");
    text.textContent = "CM17";
    svg.appendChild(circle); svg.appendChild(text);
    seal.appendChild(svg);
    node.appendChild(seal);
    var slots = el("div", { class: "dossier-slots" });
    for (var i = 0; i < 3; i++) slots.appendChild(el("div", { class: "dossier-slot" }));
    node.appendChild(slots);
    return node;
  }

  function attachScrim(container, rect) {
    var pad = 20;
    container.appendChild(el("div", {
      class: "scrim",
      style: {
        left: (rect.left - pad) + "px", top: (rect.top - pad) + "px",
        width: (rect.width + pad * 2) + "px", height: (rect.height + pad * 2) + "px",
      },
    }));
  }

  // ---------------------------------------------------------------------
  // Desktop frame builder (F1, F2, F3, S1, S2)
  // ---------------------------------------------------------------------

  function buildDesktopFrame(root, frameId, cfg, fixtures, plateMap, masks) {
    document.body.classList.add("desktop-layout");
    var vw = cfg.viewport[0], vh = cfg.viewport[1];
    var camera = fixtures.cameraPresets[cfg.camera];

    var stage = el("div", { class: "scene-stage" });
    var world = worldBoxFor(vw, vh);
    var worldEl = el("div", {
      class: "scene-world",
      style: { left: world.left + "px", top: world.top + "px", width: world.width + "px", height: world.height + "px" },
    });
    var cameraEl = el("div", { class: "scene-camera" });
    cameraEl.style.transform = "scale(" + camera.scale + ")";
    cameraEl.style.transformOrigin = (camera.focus[0] * 100) + "% " + (camera.focus[1] * 100) + "%";

    // L0 plate
    var l0 = el("div", { class: "layer l0-plate", "aria-hidden": "true" });
    l0.appendChild(platePicture(world.width > 2000 ? 3344 : 1672, ""));
    cameraEl.appendChild(l0);

    // L1 cue
    cameraEl.appendChild(buildCueOverlay(cfg.cue, plateMap, masks));

    var scrimLayer = el("div", { class: "layer l4-scrims" });

    if (!cfg.plateOnly) {
      // L2 poses
      var l2 = el("div", { class: "layer l2-poses", "aria-hidden": "true" });
      ["left", "right"].forEach(function (side) {
        var managerKey = side === "left" ? "daniel" : "nik";
        var poseFileKey = cfg.poses[side];
        var meta = fixtures.poseSourceMeta[poseFileKey];
        var placement = computePosePlacement(managerKey, poseFileKey, camera, fixtures, world.width, world.height);
        var pic = posePicture(meta.asset, managerKey + " pose");
        pic.querySelector("img").className = "pose pose-" + side;
        Object.assign(pic.querySelector("img").style, {
          left: placement.left + "px", top: placement.top + "px",
          width: placement.width + "px", height: placement.height + "px",
        });
        l2.appendChild(pic);
      });
      cameraEl.appendChild(l2);

      // L3 table cutout
      var l3 = el("div", { class: "layer l3-table", "aria-hidden": "true" });
      l3.appendChild(tableCutoutPicture());
      cameraEl.appendChild(l3);
    }

    // L5 world-anchored DOM
    var l5 = el("div", { class: "layer l5-world" });
    var strings = fixtures.strings;

    if (frameId === "F1") {
      l5.appendChild(buildSignDisplay(cfg.clockFixture, plateMap, world.width, world.height, false, true));
      var briefScreenRect = { left: 683 - 250, top: 460, width: 500 };
      var nlWorld = worldPxFromScreenFraction(310 / 1366, 606 / 768, camera, world.width, world.height);
      var nrWorld = worldPxFromScreenFraction(950 / 1366, 606 / 768, camera, world.width, world.height);
      l5.appendChild(buildNameplate(strings.nameplateOne, strings.tagYou === "YOU" && cfg.viewer === "playerOne" ? strings.tagYou : null, "you",
        { left: nlWorld[0] + "px", top: nlWorld[1] + "px" }));
      var nrTag = cfg.viewer === "playerTwo" ? strings.tagYou : null;
      l5.appendChild(buildNameplate(strings.nameplateTwo, nrTag, "you", { left: nrWorld[0] + "px", top: nrWorld[1] + "px" }));
      var mlWorld = worldPxFromScreenFraction(310 / 1366, 640 / 768, camera, world.width, world.height);
      var mrWorld = worldPxFromScreenFraction(950 / 1366, 640 / 768, camera, world.width, world.height);
      l5.appendChild(buildMotto(strings.mottoOne, { left: mlWorld[0] + "px", top: mlWorld[1] + "px" }));
      l5.appendChild(buildMotto(strings.mottoTwo, { left: mrWorld[0] + "px", top: mrWorld[1] + "px" }));
    } else if (frameId === "F2" || frameId === "F3") {
      l5.appendChild(buildSignDisplay(strings.signWindowClosed, plateMap, world.width, world.height, true, false));
      var nikViewer = cfg.viewer === "playerTwo";
      var panelScreen = nikViewer ? { left: 782, top: 330, width: 560, height: 440 } : { left: 46, top: 330, width: 560, height: 440 };
      var dossierScreen = nikViewer ? { left: 60, top: 490, width: 340, height: 250 } : { left: 966, top: 490, width: 340, height: 250 };
      attachScrim(scrimLayer, panelScreen);
      attachScrim(scrimLayer, dossierScreen);

      var ownNamePlateOuterX = nikViewer ? panelScreen.left + panelScreen.width - 140 : panelScreen.left;
      var ownNameWorld = worldPxFromScreenFraction(ownNamePlateOuterX / 1366, (panelScreen.top - 34) / 768, camera, world.width, world.height);
      var rivalNameWorld = worldPxFromScreenFraction(dossierScreen.left / 1366, (dossierScreen.top - 34) / 768, camera, world.width, world.height);
      var ownName = nikViewer ? strings.nameplateTwo : strings.nameplateOne;
      var rivalName = nikViewer ? strings.nameplateOne : strings.nameplateTwo;
      l5.appendChild(buildNameplate(ownName, strings.tagYou, "you", { left: ownNameWorld[0] + "px", top: ownNameWorld[1] + "px" }));
      l5.appendChild(buildNameplate(rivalName, strings.tagSealed, "sealed", { left: rivalNameWorld[0] + "px", top: rivalNameWorld[1] + "px" }));

      var dossierWorldTL = worldPxFromScreenFraction(dossierScreen.left / 1366, dossierScreen.top / 768, camera, world.width, world.height);
      var dossierWorldBR = worldPxFromScreenFraction((dossierScreen.left + dossierScreen.width) / 1366, (dossierScreen.top + dossierScreen.height) / 768, camera, world.width, world.height);
      l5.appendChild(buildSealedDossier(rivalName.split("·")[1].trim(), {
        left: dossierWorldTL[0] + "px", top: dossierWorldTL[1] + "px",
        width: (dossierWorldBR[0] - dossierWorldTL[0]) + "px", height: (dossierWorldBR[1] - dossierWorldTL[1]) + "px",
      }));
    } else if (cfg.plateOnly) {
      // S1/S2: plate + cue only, no world DOM.
    }
    cameraEl.appendChild(l5);

    worldEl.appendChild(cameraEl);
    stage.appendChild(worldEl);
    stage.appendChild(scrimLayer);

    // L7 top bar (screen-aligned) - appended before the panel so "back, refresh"
    // precede the panel's form controls in DOM/tab order (B5: tab order = visual order).
    if (!cfg.plateOnly) stage.appendChild(buildTopBar(strings, false));

    // L6 HUD (screen-aligned)
    if (!cfg.plateOnly) {
      stage.appendChild(buildLockup(frameId !== "F1"));
      var activeIndex = cfg.phase === "WINDOW_OPEN" ? 0 : 1;
      var doneUpTo = cfg.phase === "WINDOW_OPEN" ? 0 : 1;
      stage.appendChild(buildPhaseRail(strings, activeIndex, doneUpTo, false));

      if (frameId === "F1") {
        stage.appendChild(buildWindowBriefPanel(strings, cfg.earlyEndRequested));
      } else if (frameId === "F2") {
        stage.appendChild(buildGuessViewerPanel(strings, "right", true));
      } else if (frameId === "F3") {
        stage.appendChild(buildGuessViewerPanel(strings, "left", false));
      }
    }

    stage.style.width = vw + "px";
    stage.style.height = vh + "px";
    root.appendChild(stage);
  }

  // ---------------------------------------------------------------------
  // Mobile frame builder (F4, F5)
  // ---------------------------------------------------------------------

  function buildMobileFrame(root, frameId, cfg, fixtures, plateMap, masks) {
    document.body.classList.add("mobile-layout");
    var vw = cfg.viewport[0];
    var camera = fixtures.cameraPresets[cfg.camera];
    var strings = fixtures.strings;

    root.appendChild(buildTopBar(strings, true));

    var activeIndex = cfg.phase === "WINDOW_OPEN" ? 0 : 1;
    var doneUpTo = cfg.phase === "WINDOW_OPEN" ? 0 : 1;
    root.appendChild(buildPhaseRail(strings, activeIndex, doneUpTo, true));

    var strip = el("div", { class: "scene-strip", style: { height: cfg.stripHeight + "px" } });
    // Cover-fit the full 16:9 plate into the strip (matches strip height, crops left/right).
    // At this scale the sign/head/table composition keeps its normal relative layout,
    // just rendered smaller; head height already clears the >=64px floor (B6) without
    // any extra vertical crop, so no additional bias is applied here.
    var world = worldBoxFor(vw, cfg.stripHeight);
    var worldEl = el("div", {
      class: "scene-world",
      style: { left: world.left + "px", top: world.top + "px", width: world.width + "px", height: world.height + "px" },
    });
    var cameraEl = el("div", { class: "scene-camera" });
    cameraEl.style.transform = "scale(" + camera.scale + ")";
    cameraEl.style.transformOrigin = (camera.focus[0] * 100) + "% " + (camera.focus[1] * 100) + "%";

    var l0 = el("div", { class: "layer l0-plate", "aria-hidden": "true" });
    l0.appendChild(platePicture(1672, ""));
    cameraEl.appendChild(l0);
    cameraEl.appendChild(buildCueOverlay(cfg.cue, plateMap, masks));

    var l2 = el("div", { class: "layer l2-poses", "aria-hidden": "true" });
    ["left", "right"].forEach(function (side) {
      var managerKey = side === "left" ? "daniel" : "nik";
      var poseFileKey = cfg.poses[side];
      var meta = fixtures.poseSourceMeta[poseFileKey];
      var placement = computePosePlacement(managerKey, poseFileKey, camera, fixtures, world.width, world.height);
      var pic = posePicture(meta.asset, managerKey + " pose");
      var img = pic.querySelector("img");
      img.className = "pose pose-" + side;
      Object.assign(img.style, {
        left: placement.left + "px", top: placement.top + "px",
        width: placement.width + "px", height: placement.height + "px",
      });
      l2.appendChild(pic);
    });
    cameraEl.appendChild(l2);

    var l3 = el("div", { class: "layer l3-table", "aria-hidden": "true" });
    l3.appendChild(tableCutoutPicture());
    cameraEl.appendChild(l3);

    if (frameId === "F4") {
      var sign = el("div", { class: "mobile-sign", role: "timer", "aria-live": "off", id: "transferTimerDisplay", text: cfg.clockFixture });
      cameraEl.appendChild(sign);
    }

    worldEl.appendChild(cameraEl);
    strip.appendChild(worldEl);
    root.appendChild(strip);

    if (frameId === "F4") {
      var namesRow = el("div", { class: "mobile-nameplates" });
      var d = el("span", { text: strings.nameplateOne });
      var n = el("span", { text: strings.nameplateTwo });
      if (cfg.viewer === "playerOne") d.appendChild(el("span", { class: "tag you", text: strings.tagYou }));
      if (cfg.viewer === "playerTwo") n.appendChild(el("span", { class: "tag you", text: strings.tagYou }));
      namesRow.appendChild(d); namesRow.appendChild(n);
      root.appendChild(namesRow);
      var mottoRow = el("div", { class: "mobile-mottos" });
      mottoRow.appendChild(el("span", { text: strings.mottoOne }));
      mottoRow.appendChild(el("span", { text: strings.mottoTwo }));
      root.appendChild(mottoRow);

      var content = el("div", { class: "mobile-content" });
      content.appendChild(buildWindowBriefPanel(strings, cfg.earlyEndRequested));
      root.appendChild(content);
    } else if (frameId === "F5") {
      var dossierBar = el("div", { class: "mobile-dossier-bar" });
      dossierBar.appendChild(el("span", { class: "lock-glyph", "aria-hidden": "true" }));
      dossierBar.appendChild(el("span", { text: "DANIEL · SEALED" }));
      root.appendChild(dossierBar);

      var content5 = el("div", { class: "mobile-content f5-content" });
      var panel = buildGuessViewerPanel(strings, "full", true);
      panel.classList.remove("side-right");
      // action row + lock button flow full width, in-flow (never fixed/sticky) per B6
      content5.appendChild(panel);
      root.appendChild(content5);
    }
  }

  // ---------------------------------------------------------------------

  function main() {
    var frameId = qs("frame", "F1");
    Promise.all([
      fetch("fixtures.json").then(function (r) { return r.json(); }),
      fetch(ASSET_BASE + "ENV_TR2_WARROOM_PLATEMAP_V1.json").then(function (r) { return r.json(); }),
    ]).then(function (results) {
      var fixtures = results[0];
      var plateMap = results[1];
      var cfg = fixtures.frames[frameId];
      if (!cfg) { document.body.textContent = "Unknown frame: " + frameId; return; }
      var masks = {
        LIGHTRIG_GLASS: ASSET_BASE + "LIGHTRIG_GLASS.png",
        LIGHTRIG_TACTICS: ASSET_BASE + "LIGHTRIG_TACTICS.png",
        LIGHTRIG_SIGNFACE: ASSET_BASE + "LIGHTRIG_SIGNFACE.png",
      };
      var root = document.getElementById("stage-root");
      root.setAttribute("data-frame", frameId);
      document.title = "CP1 · " + frameId;
      if (cfg.layout === "mobile") {
        buildMobileFrame(root, frameId, cfg, fixtures, plateMap, masks);
      } else {
        buildDesktopFrame(root, frameId, cfg, fixtures, plateMap, masks);
      }
      window.__cp1FrameReady = true;
    }).catch(function (err) {
      document.body.textContent = "Failed to load frame: " + err;
      console.error(err);
    });
  }

  main();
})();
