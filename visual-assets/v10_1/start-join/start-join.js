// START-JOIN-V1 · fixture-driven scaffold. Styling and stage registration are added in later steps.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const stage = document.getElementById("stage-root");

  async function loadFixtures() {
    const response = await fetch("fixtures.json", { cache: "no-store" });
    if (!response.ok) throw new Error("fixtures.json " + response.status);
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

    renderFrameValues(frame);
  }

  async function main() {
    const FX = await loadFixtures();
    const ids = Object.keys(FX.frames);
    const requested = qs.get("frame");
    const frameId = FX.frames[requested] ? requested : ids[0];
    render(FX, frameId);
    window.__startJoinReady = true;
  }

  main().catch((error) => {
    console.error(error);
    setText("stateError", "Preview could not load.");
  });
})();
