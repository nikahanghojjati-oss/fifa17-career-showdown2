// START-JOIN-V1 · fixture-driven scaffold on the shared registered stage.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const stage = document.getElementById("stage-root");

  async function loadJSON(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(path + " " + response.status);
    return response.json();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? "" : String(value);
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

  function stateLabel(frame) {
    const raw = frame.session?.state || frame.pairing?.state || frame.status || "";
    return String(raw).replace(/-/g, " ").toUpperCase();
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
      (paired ? strings.liveStatus.careerReady : fallbackMessage)
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
    setText("privacyLine", strings.privacy.plain);
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
    window.__startJoinReady = true;
  }

  main().catch((error) => {
    console.error(error);
    setText("stateError", "Preview could not load.");
  });
})();
