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

  function setMetricValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const available = value !== undefined && value !== null;
    el.textContent = available ? String(value) : "—";
    el.dataset.missing = String(!available);
    if (available) el.removeAttribute("aria-label");
    else el.setAttribute("aria-label", "Unavailable");
  }

  function renderResultPanel(frame) {
    setMetricValue("panelSeasons", frame.seasonsPlayed);
    setMetricValue("panelMargin", frame.margin);
    const d = frame.trophies && frame.trophies.daniel;
    const n = frame.trophies && frame.trophies.nik;
    setMetricValue("panelDanielContinental", d && d.championsLeague);
    setMetricValue("panelNikContinental", n && n.championsLeague);
    setMetricValue("panelDanielLeague", d && d.leagueTitles);
    setMetricValue("panelNikLeague", n && n.leagueTitles);
    setMetricValue("panelDanielCup", d && d.domesticCups);
    setMetricValue("panelNikCup", n && n.domesticCups);
    setMetricValue("panelDanielTrophies", d && d.total);
    setMetricValue("panelNikTrophies", n && n.total);
  }

  function renderActions(frame, fixtures) {
    const host = document.getElementById("sharedTerminalCloseActions");
    host.replaceChildren();

    const allowed = new Map([
      [fixtures.strings.terminalClose.closeAction, {
        id: fixtures.ids.terminalClose.closeAction,
        intent: "close",
        className: "sd-btn sd-btn--primary"
      }],
      [fixtures.strings.terminalClose.retryAction, {
        id: fixtures.ids.terminalClose.retryAction,
        intent: "retry",
        className: "sd-btn sd-btn--primary"
      }]
    ]);

    (frame.actions || []).forEach((label) => {
      const spec = allowed.get(label);
      if (!spec) return;
      const button = document.createElement("button");
      button.id = spec.id;
      button.type = "button";
      button.className = spec.className;
      button.textContent = label;
      button.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("final-winner:intent", {
          detail: { route: "terminalClose", action: spec.intent }
        }));
      });
      host.appendChild(button);
    });
  }

  function applyFrame(fixtures, frameId) {
    const frame = fixtures.frames[frameId];
    root.dataset.frame = frameId;
    root.dataset.status = frame.status || "";
    root.dataset.state = frame.state || "";
    root.dataset.winner = frame.winner || "unconfirmed";
    root.dataset.spotlight = frame.presentation && frame.presentation.spotlight
      ? frame.presentation.spotlight
      : "neutral";

    const heading = typeof frame.heading === "object" ? frame.heading.text : frame.heading;
    const message = typeof frame.message === "object" ? frame.message.text : frame.message;

    setText("previewLabel", frame.previewLabel || fixtures.strings.previewLabel);
    setText("frameNote", frame.note);
    setText("finalWinnerHeading", heading);
    setText("finalWinnerTerminalHeading", frame.terminalHeading);
    setText("finalWinnerMessage", message);
    setText("finalWinnerStateTitle", heading);
    setText("finalWinnerStateMessage", message);
    setText("finalWinnerStatus", frame.terminalStatus);
    setText("sharedTerminalCloseStatus", frame.terminalStatus);
    setText("completionMark", frame.completionMark);
    setText("danielTotal", frame.totals && frame.totals.daniel);
    setText("nikTotal", frame.totals && frame.totals.nik);
    setText("outcomeHeadline", frame.outcomeHeadline);
    setText("resultText", frame.resultText);
    setText("seasonsPlayed", frame.seasonsPlayed == null ? "" : `${frame.seasonsPlayed} seasons played`);
    setText("danielTrophies", trophyLine("Daniel", frame.trophies && frame.trophies.daniel));
    setText("nikTrophies", trophyLine("Nik", frame.trophies && frame.trophies.nik));
    setText("finalWinnerPartialMessage", frame.status === "partial" ? message : "");
    setText(
      "finalWinnerPartialCoverage",
      frame.status === "partial" && frame.coverage
        ? `${frame.coverage.readable} OF ${frame.coverage.indexed} SHOWDOWNS READABLE`
        : ""
    );
    const glyph = document.getElementById("finalWinnerStateGlyph");
    if (glyph) {
      glyph.textContent = "";
      glyph.dataset.kind = frame.status || "";
    }
    renderResultPanel(frame);
    renderActions(frame, fixtures);
    setText("fixtureDump", JSON.stringify(frame, null, 2));

    root.querySelectorAll(".finalWinnerNavTabs [data-route], .finalWinnerSettings[data-route]").forEach((control) => {
      if (control.dataset.bound === "1") return;
      control.dataset.bound = "1";
      control.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("final-winner:intent", {
          detail: { route: control.dataset.route }
        }));
      });
    });
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
