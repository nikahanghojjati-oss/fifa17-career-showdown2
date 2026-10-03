// FINAL-WINNER-V1 · JOB-082 scaffold. Fixtures are the only source of preview copy/data.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const root = document.getElementById("stage-root");
  const PLATE = { width: 1672, height: 941 };
  const FACE_BOXES = {
    daniel: [318, 141, 472, 335],
    nik: [1138, 130, 1309, 336]
  };

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  }

  function registerManagerMarkers() {
    root.querySelectorAll(".managerPlateMarker[data-manager]").forEach((marker) => {
      const box = FACE_BOXES[marker.dataset.manager];
      if (!box) return;
      const [x0, y0, x1, y1] = box;
      marker.dataset.box = box.join(" ");
      marker.style.left = `${(x0 / PLATE.width) * 100}%`;
      marker.style.top = `${(y0 / PLATE.height) * 100}%`;
      marker.style.width = `${((x1 - x0) / PLATE.width) * 100}%`;
      marker.style.height = `${((y1 - y0) / PLATE.height) * 100}%`;
    });
  }

  function mountStage() {
    registerManagerMarkers();
    if (!window.ShowdownStage) return;
    window.FinalWinnerStage = window.ShowdownStage.mount(root, {
      plate: {
        width: PLATE.width,
        height: PLATE.height,
        src1x: "../trophy-room/assets/ENV_FW_PLATE_V1_1X.webp",
        src2x: "../trophy-room/assets/ENV_FW_PLATE_V1_2X.webp"
      },
      // Registration rule: 16:9 uses a cover-centred camera with no extra zoom or authored shift.
      focal: { x: PLATE.width / 2, y: PLATE.height / 2 },
      platemap: { phone_band: [280, 85, 1450, 600] },
      dustCount: 24
    });
  }

  function trophyLine(manager, trophies) {
    if (!trophies) return `${manager}: unavailable`;
    const field = (key, label) => Object.prototype.hasOwnProperty.call(trophies, key)
      ? `${label} ${trophies[key]}`
      : `${label} unavailable`;
    return [
      manager,
      field("championsLeague", "Continental"),
      field("leagueTitles", "League"),
      field("domesticCups", "Domestic cup"),
      field("total", "Total")
    ].join(" · ");
  }

  function renderActions(frame) {
    const host = document.getElementById("winnerActions");
    host.replaceChildren();
    (frame.actions || []).forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      host.appendChild(button);
    });
  }

  function applyFrame(fixtures, frameId) {
    const frame = fixtures.frames[frameId];
    root.dataset.frame = frameId;
    root.dataset.status = frame.status || "";
    root.dataset.state = frame.state || "";

    const heading = typeof frame.heading === "object" ? frame.heading.text : frame.heading;
    const message = typeof frame.message === "object" ? frame.message.text : frame.message;

    setText("previewLabel", frame.previewLabel || fixtures.strings.previewLabel);
    setText("frameNote", frame.note);
    setText("finalWinnerHeading", heading);
    setText("finalWinnerMessage", message);
    setText("finalWinnerStatus", frame.terminalStatus);
    setText("completionMark", frame.completionMark);
    setText("danielTotal", frame.totals && frame.totals.daniel);
    setText("nikTotal", frame.totals && frame.totals.nik);
    setText("outcomeHeadline", frame.outcomeHeadline);
    setText("resultText", frame.resultText);
    setText("seasonsPlayed", frame.seasonsPlayed == null ? "" : `${frame.seasonsPlayed} seasons played`);
    setText("danielTrophies", trophyLine("Daniel", frame.trophies && frame.trophies.daniel));
    setText("nikTrophies", trophyLine("Nik", frame.trophies && frame.trophies.nik));
    renderActions(frame);
    setText("fixtureDump", JSON.stringify(frame, null, 2));
  }

  mountStage();

  fetch("fixtures.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`fixtures ${response.status}`);
      return response.json();
    })
    .then((fixtures) => {
      const frameIds = Object.keys(fixtures.frames);
      const requested = qs.get("frame");
      const frameId = requested && fixtures.frames[requested] ? requested : frameIds[0];
      applyFrame(fixtures, frameId);
    })
    .catch((error) => {
      root.dataset.status = "unavailable";
      setText("finalWinnerHeading", "Final result unavailable");
      setText("finalWinnerMessage", error.message);
    });
}());
