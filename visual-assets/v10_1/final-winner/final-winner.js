// FINAL-WINNER-V1 · JOB-082 scaffold. Fixtures are the only source of preview copy/data.
(function () {
  "use strict";
  function bootFinalWinner() {

  const qs = new URLSearchParams(location.search);
  const root = window.FINAL_WINNER_ROOT || document.getElementById("stage-root");
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
    root.v10StageHandle = window.FinalWinnerStage = window.ShowdownStage.mount(root, {
      plate: {
        width: PLATE.width,
        height: PLATE.height,
        src1x: "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_1X.webp",
        src2x: "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.webp"
      },
      // Registration rule: 16:9 uses a cover-centred camera with no extra zoom or authored shift.
      focal: { x: PLATE.width / 2, y: PLATE.height / 2 },
      platemap: { phone_band: [280, 85, 1450, 600] },
      dustCount: 24
    });
  }

  // Labels, order and the missing-value word come from fixtures.strings.trophySummary (one copy authority).
  function trophyLine(manager, trophies, copy) {
    if (!copy) return manager;
    if (!trophies) return `${manager}: ${copy.unavailable}`;
    const field = (key) => Object.prototype.hasOwnProperty.call(trophies, key)
      ? `${copy.labels[key]} ${trophies[key]}`
      : `${copy.labels[key]} ${copy.unavailable}`;
    return [manager].concat(copy.order.map(field)).join(copy.separator);
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

  function renderResultPanel(frame, fixtures) {
    const ls = frame.lastSeason;
    const LS = fixtures.strings.lastSeason;
    setText("panelLastSeasonLabel", ls ? LS.label.replace("{season}", ls.season) : "FINAL SEASON");
    setMetricValue("panelLastSeasonDaniel", ls && ls.daniel);
    setMetricValue("panelLastSeasonNik", ls && ls.nik);
    setText("panelLastSeasonResult", ls ? LS.result[ls.winner] || "" : "");
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
    if (!window.FINAL_WINNER_APP) setText("sharedTerminalCloseStatus", frame.terminalStatus);
    setText("completionMark", frame.completionMark);
    setText("danielTotal", frame.totals && frame.totals.daniel);
    setText("nikTotal", frame.totals && frame.totals.nik);
    setText("outcomeHeadline", frame.outcomeHeadline);
    setText("resultText", frame.resultText);
    setText("seasonsPlayed", frame.seasonsPlayed == null ? "" : `${frame.seasonsPlayed} seasons played`);
    setText("danielTrophies", trophyLine("Daniel", frame.trophies && frame.trophies.daniel, fixtures.strings.trophySummary));
    setText("nikTrophies", trophyLine("Nik", frame.trophies && frame.trophies.nik, fixtures.strings.trophySummary));
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
    renderResultPanel(frame, fixtures);
    if (!window.FINAL_WINNER_APP) renderActions(frame, fixtures);
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

  // JOB-183 pack-rip ceremony. All timings are constants; transform/opacity/canvas only.
  const RIP = {
    anticipateMs: 400,     // screen dims, drum-roll pulse on the trophy glow
    flashAtMs: 400,        // white-gold flash
    flashMs: 220,
    burstAtMs: 300,        // confetti burst (kit sdBurst, hard cap 60)
    burstCount: 60,
    drawBurstCount: 30,    // draw: one smaller burst on each side
    nameWipeAtMs: 450,     // winner name brush-wipe (kit title-wipe classes)
    nameWipeMs: 450,
    countUpAtMs: 600,
    countUpMs: 600,
    shineSettleMs: 1080    // one 120 ms settle shine ends at the shared 1.2 s ceiling
  };

  function ceremonyReduced() {
    return !!(window.ShowdownMotion && window.ShowdownMotion.isReducedMotion && window.ShowdownMotion.isReducedMotion());
  }

  function runCeremony(frame) {
    if (ceremonyReduced() || frame.state !== "completed" || !frame.winner) return;
    const layer = root.querySelector(".finalWinnerConfettiLayer");
    const slot = root.querySelector(".winnerTrophySlot");
    if (!layer || !slot) return;
    const later = (ms, fn) => window.setTimeout(fn, ms);

    root.classList.add("fwAnticipate");
    later(RIP.anticipateMs, () => root.classList.remove("fwAnticipate"));

    const flash = document.createElement("span");
    flash.className = "finalWinnerFlash";
    flash.setAttribute("aria-hidden", "true");
    root.appendChild(flash);
    later(RIP.flashAtMs, () => flash.classList.add("is-flashing"));
    later(RIP.flashAtMs + RIP.flashMs + 40, () => flash.remove());

    const canvas = document.createElement("canvas");
    canvas.className = "finalWinnerFx";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = layer.clientWidth || 1;
    canvas.height = layer.clientHeight || 1;
    layer.appendChild(canvas);
    later(RIP.burstAtMs, () => {
      if (typeof window.sdBurst !== "function") return;
      if (frame.winner === "draw") {
        window.sdBurst(canvas, canvas.width * 0.22, canvas.height * 0.5, { count: RIP.drawBurstCount });
        window.sdBurst(canvas, canvas.width * 0.78, canvas.height * 0.5, { count: RIP.drawBurstCount });
        return;
      }
      const lr = layer.getBoundingClientRect(), tr = slot.getBoundingClientRect();
      window.sdBurst(canvas, tr.left + tr.width / 2 - lr.left, tr.top + tr.height * 0.35 - lr.top, { count: RIP.burstCount });
    });
    later(RIP.burstAtMs + 900, () => canvas.remove());

    const name = document.getElementById("outcomeHeadline");
    if (name) {
      name.classList.add("sd-title-wipe");
      later(RIP.nameWipeAtMs, () => name.classList.add("sd-is-animating"));
      later(RIP.nameWipeAtMs + RIP.nameWipeMs, () => { name.classList.remove("sd-is-animating"); name.classList.add("sd-entered"); });
    }

    if (typeof window.sdCountUp === "function") {
      ["danielTotal", "nikTotal", "panelSeasons", "panelMargin", "panelLastSeasonDaniel", "panelLastSeasonNik"].forEach((id) => {
        const el = document.getElementById(id);
        const to = el ? Number(el.textContent) : NaN;
        if (!Number.isFinite(to)) return;
        el.textContent = "0";
        later(RIP.countUpAtMs, () => window.sdCountUp(el, to, RIP.countUpMs));
      });
    }

    later(RIP.shineSettleMs, () => root.classList.add("fwSettled"));
  }

  mountStage();

  if (window.FINAL_WINNER_APP) {
    applyFrame(window.FINAL_WINNER_FIXTURES, "LIVE");
    if (typeof window.sdEnter === "function") window.sdEnter(root);
    runCeremony(window.FINAL_WINNER_FIXTURES.frames.LIVE);
    return;
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
      if (typeof window.sdEnter === "function") window.sdEnter(root);
      runCeremony(fixtures.frames[frameId]);
    })
    .catch((error) => {
      // fixtures.json itself is unreadable here, so this mirrors frame FW8's product copy; the error stays in the console only.
      console.warn("Final Winner fixtures unavailable", error);
      root.dataset.status = "unavailable";
      setText("finalWinnerHeading", "Final result unavailable");
      setText("finalWinnerMessage", "The shared Showdown result could not be read. Missing values are not zero.");
    });
  }
  window.ShowdownFinalWinnerBoot = bootFinalWinner;
  if (!window.FINAL_WINNER_APP) bootFinalWinner();
}());
