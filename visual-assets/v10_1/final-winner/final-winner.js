// FINAL-WINNER-V1 · JOB-082 scaffold. Fixtures are the only source of preview copy/data.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const root = document.getElementById("stage-root");

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
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
