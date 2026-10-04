// START-JOIN-V1 · fixture-driven scaffold on the shared registered stage.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const stage = document.getElementById("stage-root");
  const SJ_HOST_MOTION = Object.freeze({
    delayMs: 520,
    dealMs: 300,
    glyphMs: 140,
    ease: "cubic-bezier(.22,1,.36,1)"
  });
  const SJ_PAIR_MOTION = Object.freeze({
    revealDelayMs: 350,
    linkDelayMs: 520,
    linkMs: 260,
    burstDelayMs: 190,
    burstMs: 340,
    burstCount: 28,
    ease: "cubic-bezier(.22,1,.36,1)"
  });
  let hostingMomentTimer = 0;
  let pairingRevealTimer = 0;
  let pairingMomentTimer = 0;
  let pairingBurstTimer = 0;

  async function loadJSON(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(path + " " + response.status);
    return response.json();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  function motionIsReduced() {
    if (window.ShowdownMotion && typeof window.ShowdownMotion.isReducedMotion === "function") {
      return window.ShowdownMotion.isReducedMotion();
    }
    return typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function dealHostCode(el, code) {
    if (!el || !code) return Promise.resolve(false);
    const finalCode = String(code);
    el.setAttribute("aria-label", finalCode);

    if (motionIsReduced()) {
      el.textContent = finalCode;
      return Promise.resolve(true);
    }

    const chars = Array.from(finalCode);
    const travelWindow = Math.max(0, SJ_HOST_MOTION.dealMs - SJ_HOST_MOTION.glyphMs);
    const step = chars.length > 1 ? travelWindow / (chars.length - 1) : 0;
    el.replaceChildren();
    el.classList.add("is-dealing");
    el.style.setProperty("--sj-host-glyph-ms", SJ_HOST_MOTION.glyphMs + "ms");
    el.style.setProperty("--sj-host-ease", SJ_HOST_MOTION.ease);

    chars.forEach((char, index) => {
      const glyph = document.createElement("span");
      glyph.className = "sj-code-char";
      glyph.textContent = char;
      glyph.style.setProperty("--sj-slot-delay", Math.round(index * step) + "ms");
      el.appendChild(glyph);
    });

    return new Promise((resolve) => {
      window.setTimeout(() => {
        el.classList.remove("is-dealing");
        resolve(true);
      }, SJ_HOST_MOTION.dealMs + 24);
    });
  }

  function scheduleHostingMoment(hostCode, paired) {
    const panel = document.querySelector(".sj-current-panel");
    const code = document.getElementById("currentPairingCode");
    window.clearTimeout(hostingMomentTimer);
    panel.classList.remove("is-host-open");

    if (!hostCode || paired) return;
    const finalCode = String(hostCode);

    if (motionIsReduced()) {
      code.textContent = finalCode;
      panel.classList.add("is-host-open");
      return;
    }

    hostingMomentTimer = window.setTimeout(() => {
      dealHostCode(code, finalCode).then(() => {
        panel.classList.add("is-host-open");
      });
    }, SJ_HOST_MOTION.delayMs);
  }

  function ensurePairMomentLayer() {
    let layer = stage.querySelector(".sj-pair-moment");
    if (layer) {
      return {
        layer,
        line: layer.querySelector(".sj-pair-link"),
        canvas: layer.querySelector(".sj-pair-burst")
      };
    }

    layer = document.createElement("div");
    layer.className = "sj-pair-moment";
    layer.setAttribute("aria-hidden", "true");

    const line = document.createElement("span");
    line.className = "sj-pair-link";

    const canvas = document.createElement("canvas");
    canvas.className = "sj-pair-burst";
    canvas.setAttribute("aria-hidden", "true");

    layer.append(line, canvas);
    stage.appendChild(layer);
    return { layer, line, canvas };
  }

  function clearPairMomentCanvas(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") return;
    const context = canvas.getContext("2d");
    if (context) context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function schedulePairingMoment(paired) {
    const parts = ensurePairMomentLayer();
    const badge = document.getElementById("currentStateBadge");

    window.clearTimeout(pairingRevealTimer);
    window.clearTimeout(pairingMomentTimer);
    window.clearTimeout(pairingBurstTimer);
    parts.layer.classList.remove("is-pairing", "is-linking");
    parts.layer.style.setProperty("--sj-pair-link-ms", SJ_PAIR_MOTION.linkMs + "ms");
    parts.layer.style.setProperty("--sj-pair-ease", SJ_PAIR_MOTION.ease);
    clearPairMomentCanvas(parts.canvas);

    if (!paired) return;

    if (motionIsReduced()) {
      parts.layer.classList.add("is-pairing", "is-linking");
      if (typeof window.sdReveal === "function") window.sdReveal(badge);
      return;
    }

    pairingRevealTimer = window.setTimeout(() => {
      if (typeof window.sdReveal === "function") window.sdReveal(badge);
    }, SJ_PAIR_MOTION.revealDelayMs);

    pairingMomentTimer = window.setTimeout(() => {
      parts.layer.classList.add("is-pairing", "is-linking");

      pairingBurstTimer = window.setTimeout(() => {
        if (typeof window.sdBurst !== "function") return;
        const layerRect = parts.layer.getBoundingClientRect();
        const lineRect = parts.line.getBoundingClientRect();
        const x = (lineRect.left - layerRect.left) + (lineRect.width / 2);
        const y = (lineRect.top - layerRect.top) + (lineRect.height / 2);
        window.sdBurst(parts.canvas, x, y, {
          count: SJ_PAIR_MOTION.burstCount,
          duration: SJ_PAIR_MOTION.burstMs,
          gravity: 240,
          spread: Math.PI * 1.2,
          speedMin: 70,
          speedMax: 180
        });
      }, SJ_PAIR_MOTION.burstDelayMs);
    }, SJ_PAIR_MOTION.linkDelayMs);
  }

  function addButton(targetId, label) {
    if (!label) return;
    const target = document.getElementById(targetId);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    target.appendChild(button);
  }

  const actionHooks = {
    "START A SHOWDOWN": { id: "startShowdown", hook: "startShowdown" },
    "JOIN DANIEL'S SHOWDOWN": { hook: "pairJoinPairing" },
    "COPY CODE": { hook: "pairCopyText" },
    "NEW CODE": { hook: "pairStartPairing" },
    "CHECK STATUS": { hook: "pairInitialize" },
    "START CAREER": { hook: "openSharedExperience" },
    "RETRY CONNECTION": { hook: "pairRetryPairLink" },
    "REVOKE OPEN SESSION": { hook: "srjRevokeSession" },
    "CLOSE SESSION": { hook: "srjCloseSession" },
    "FORGET CODE": { hook: "srjForgetSession" }
  };

  function makeActionButton(label, primary, compact) {
    const meta = actionHooks[label] || {};
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "sd-btn " + (primary ? "sd-btn--primary" : "sd-btn--secondary") +
      (compact ? " sj-copy-button" : "");
    button.textContent = compact ? "⧉" : label;
    button.setAttribute("aria-label", label);
    if (compact) button.title = label;
    if (meta.id) button.id = meta.id;
    if (meta.hook) button.dataset.productAction = meta.hook;
    if (primary) button.dataset.sdEnter = "button";
    return button;
  }

  function appendAction(target, label, primary) {
    if (!label) return null;
    const button = makeActionButton(label, primary, false);
    target.appendChild(button);
    return button;
  }

  function appendMoreMenu(target, frame, strings) {
    if (!frame.more?.actions?.length) return;
    const details = document.createElement("details");
    details.className = "sj-more-menu";
    const summary = document.createElement("summary");
    summary.className = "sd-btn sd-btn--secondary";
    summary.textContent = frame.more.label || strings.moreMenu.label;
    details.appendChild(summary);

    const menu = document.createElement("div");
    menu.className = "sj-more-popover";
    frame.more.actions.forEach((item) => {
      const button = makeActionButton(item.label, false, false);
      button.dataset.confirm = item.confirm ? "true" : "false";
      if (item.confirm) {
        button.addEventListener("click", (event) => {
          // DEFAULT: contract requires confirmation but supplies no exact copy.
          if (!window.confirm("Confirm this connection action?")) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        });
      }
      menu.appendChild(button);
    });
    details.appendChild(menu);
    target.appendChild(details);
  }

  function renderMainActions(frame, strings) {
    const daniel = document.getElementById("danielMainActions");
    const nik = document.getElementById("nikMainActions");
    const current = document.getElementById("currentMainActions");
    const codeRow = document.getElementById("currentCodeRow");
    [daniel, nik, current].forEach((target) => target.replaceChildren());

    const oldCopy = codeRow.querySelector(".sj-copy-button");
    if (oldCopy) oldCopy.remove();

    if (frame.status === "loading") return;

    if (frame.actions && !Array.isArray(frame.actions)) {
      appendAction(daniel, frame.actions.danielPrimary, true);
      appendAction(nik, frame.actions.nikPrimary, false);
      return;
    }

    if (Array.isArray(frame.actions)) {
      frame.actions.forEach((label) => {
        if (label === strings.buttons.copyCode && !codeRow.hidden) {
          codeRow.appendChild(makeActionButton(label, true, true));
        } else {
          appendAction(current, label, false);
        }
      });
      return;
    }

    if (frame.action) {
      const target = frame.viewer === "nik" ? nik : current;
      appendAction(target, frame.action, true);
    }

    appendMoreMenu(current, frame, strings);
  }

  function flatten(value, prefix, rows) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => flatten(item, prefix + "[" + index + "]", rows));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => {
        if (key === "validationOnly") return;
        flatten(item, prefix ? prefix + "." + key : key, rows);
      });
      return;
    }
    rows.push([prefix, value]);
  }

  function renderFrameValues(frame) {
    const list = document.getElementById("frameValues");
    list.replaceChildren();
    const rows = [];
    flatten(frame, "", rows);
    rows.forEach(([key, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = key;
      dd.textContent = value == null ? "null" : String(value);
      list.append(dt, dd);
    });
  }

  function wireBack(strings) {
    const back = document.getElementById("startJoinBack");
    if (!back) return;
    back.textContent = strings.buttons.back;
    back.dataset.route = "navigateBackSmart()";
    back.setAttribute("aria-label", strings.buttons.back);
    back.addEventListener("click", () => {
      if (typeof window.navigateBackSmart === "function") {
        window.navigateBackSmart();
      }
    });
  }

  function stateTone(frame) {
    if (frame.error) return "error";
    if (frame.status === "loading") return "loading";
    if (frame.status === "partial") return "partial";
    if (frame.status === "unavailable") return "unavailable";
    if (frame.pairing?.state === "paired") return "paired";
    if (frame.pairing?.state === "waiting-for-nik") return "waiting";
    if (frame.status === "empty") return "empty";
    return "ready";
  }

  function stateLabel(frame) {
    if (frame.error) return "CODE ERROR";
    const raw = frame.session?.state || frame.pairing?.state || frame.status || "";
    return String(raw).replace(/-/g, " ").toUpperCase();
  }

  function renderStatePresentation(frame) {
    const tone = stateTone(frame);
    const current = document.querySelector(".sj-current-panel");
    const daniel = document.querySelector(".sj-role-panel--daniel");
    const nik = document.querySelector(".sj-role-panel--nik");

    current.dataset.state = tone;
    stage.dataset.stateTone = tone;
    daniel.classList.toggle("is-read-pending", tone === "loading");
    nik.classList.toggle("is-read-pending", tone === "loading");
    daniel.classList.toggle("is-read-unavailable", tone === "unavailable");
    nik.classList.toggle("is-read-unavailable", tone === "unavailable");
  }

  function renderMainPanels(frame, strings) {
    const paired = frame.pairing?.state === "paired";
    const hostCode = frame.viewer === "daniel" ? frame.pairing?.code || "" : "";
    const joinVisible =
      !paired &&
      frame.pairing?.state === "none" &&
      (frame.viewer === "nik" || frame.viewer === "either") &&
      frame.status !== "loading" &&
      frame.status !== "unavailable";

    setText("danielRoleHeading", strings.buttons.startShowdown);
    setText("nikRoleHeading", strings.buttons.joinDaniel);

    const fallbackMessage =
      frame.message ||
      frame.statusText ||
      strings.stateCopy[frame.status]?.text ||
      strings.liveStatus.needConnect;
    setText(
      "danielRoleCopy",
      hostCode ? strings.liveStatus.sendCode : paired ? strings.liveStatus.careerReady : fallbackMessage
    );
    setText(
      "nikRoleCopy",
      frame.error || (frame.viewer === "nik" && frame.statusText) ||
      (paired ? strings.liveStatus.careerReady : (frame.viewer === "nik" ? fallbackMessage : strings.liveStatus.needConnect))
    );

    const seasonLine = document.getElementById("danielSeasonLine");
    const showSeasons = frame.context?.shown?.includes("totalSeasons");
    seasonLine.hidden = !showSeasons;
    setText("danielSeasonValue", showSeasons ? frame.context.totalSeasons : "");

    const mainInputWrap = document.getElementById("joinCodeMainWrap");
    const mainInput = document.getElementById("joinCodeMain");
    mainInputWrap.hidden = !joinVisible;
    mainInput.value = joinVisible ? frame.joinDraft?.value || "" : "";
    mainInput.placeholder = frame.joinDraft?.placeholder || strings.inputs.pairingPlaceholder;

    setText("currentHeading", paired ? strings.screen.readyHeading : strings.screen.connectionHeading);
    setText("currentStateBadge", stateLabel(frame));
    setText(
      "currentStatusCopy",
      frame.error || frame.statusText || frame.message || strings.stateCopy[frame.status]?.text || ""
    );

    const codeRow = document.getElementById("currentCodeRow");
    codeRow.hidden = !hostCode;
    setText("currentPairingCode", hostCode);
    scheduleHostingMoment(hostCode, paired);
    schedulePairingMoment(paired);
    setText("privacyLine", strings.privacy.plain);
    renderStatePresentation(frame);
    renderMainActions(frame, strings);

    const danielPanel = document.querySelector(".sj-role-panel--daniel");
    const nikPanel = document.querySelector(".sj-role-panel--nik");
    danielPanel.classList.toggle("is-active", frame.viewer === "daniel");
    nikPanel.classList.toggle("is-active", frame.viewer === "nik");
    danielPanel.classList.toggle("is-paired", paired);
    nikPanel.classList.toggle("is-paired", paired);

    stage.dataset.status = frame.status || "";
    stage.dataset.viewer = frame.viewer || "";
    stage.dataset.pairingState = frame.pairing?.state || "";
  }

  function render(FX, frameId) {
    const frame = FX.frames[frameId];
    const strings = FX.strings;

    stage.dataset.frame = frameId;
    setText("previewTag", frame.previewLabel || strings.previewLabel);
    setText("screenEyebrow", strings.screen.eyebrow);
    setText("stateHeading",
      frame.status === "ready" && frame.pairing && frame.pairing.state === "paired"
        ? strings.screen.readyHeading
        : strings.screen.connectionHeading);
    setText("stateMessage", frame.message || frame.statusText || strings.stateCopy[frame.status]?.text || "");
    setText("stateError", frame.error || "");
    document.getElementById("stateError").hidden = !frame.error;

    ["danielActions", "nikActions", "sessionActions"].forEach((id) => {
      document.getElementById(id).replaceChildren();
    });

    if (frame.actions && !Array.isArray(frame.actions)) {
      addButton("danielActions", frame.actions.danielPrimary);
      addButton("nikActions", frame.actions.nikPrimary);
    } else if (Array.isArray(frame.actions)) {
      frame.actions.forEach((label) => addButton("sessionActions", label));
    } else if (frame.action) {
      addButton(frame.viewer === "nik" ? "nikActions" : "sessionActions", frame.action);
    }

    const input = document.getElementById("joinCodeInput");
    input.value = frame.joinDraft?.value || "";
    input.placeholder = frame.joinDraft?.placeholder || strings.inputs.pairingPlaceholder;
    input.hidden = !(frame.viewer === "nik" || frame.viewer === "either");

    const pairingCode = frame.viewer === "daniel" ? frame.pairing?.code : "";
    setText("pairingCode", pairingCode || "");
    document.getElementById("pairingCode").hidden = !pairingCode;

    if (frame.more?.label) addButton("sessionActions", frame.more.label);
    setText("sessionStatus", frame.statusText || frame.message || frame.error || "");

    renderMainPanels(frame, strings);
    renderFrameValues(frame);
  }

  function registerManagers(MAP) {
    const boxes = MAP.protected_boxes || {};
    [["daniel", boxes.face_daniel], ["nik", boxes.face_nik]].forEach(([manager, box]) => {
      const marker = stage.querySelector('[data-manager="' + manager + '"]');
      if (marker && box) marker.dataset.box = box.join(" ");
    });
  }

  function mountStage(MAP) {
    if (!window.ShowdownStage || typeof window.ShowdownStage.mount !== "function") {
      throw new Error("Shared stage engine is unavailable.");
    }
    registerManagers(MAP);
    stage.dataset.atmosphere = "on";
    // Registration rule: 16:9 uses a single cover-centred camera, with no extra zoom or shift.
    window.ShowdownStage.mount(stage, {
      plate: {
        width: 1672,
        height: 941,
        src1x: "assets/ENV_SJ_PLATE_V1_1X.webp",
        src2x: "assets/ENV_SJ_PLATE_V1_2X.webp"
      },
      focal: { x: 836, y: 470.5 },
      platemap: MAP
    });
  }

  async function main() {
    const [FX, MAP] = await Promise.all([
      loadJSON("fixtures.json"),
      loadJSON("assets/platemap.json")
    ]);
    const ids = Object.keys(FX.frames);
    const requested = qs.get("frame");
    const frameId = FX.frames[requested] ? requested : ids[0];

    mountStage(MAP);
    wireBack(FX.strings);
    render(FX, frameId);
    window.sdEnter(stage);
    window.__startJoinReady = true;
  }

  main().catch((error) => {
    console.error(error);
    setText("stateError", "Preview could not load.");
  });
})();
