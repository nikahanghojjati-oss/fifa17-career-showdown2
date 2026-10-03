// JOB-072 · Legacy fixture scaffold + registered cinematic stage.
(function () {
  "use strict";

  const stage = document.getElementById("stage-root");
  const valuesRoot = document.getElementById("fixtureValues");
  const stringsRoot = document.getElementById("fixtureStrings");
  const frameLabel = document.getElementById("fixtureFrameLabel");

  function scalarNode(value) {
    const span = document.createElement("span");
    span.textContent = value === null ? "null" : String(value);
    return span;
  }

  function renderValue(value, label) {
    const group = document.createElement("div");
    group.dataset.fixtureKey = label;

    if (Array.isArray(value)) {
      const heading = document.createElement("p");
      heading.textContent = label;
      group.appendChild(heading);
      value.forEach((item, index) => group.appendChild(renderValue(item, label + "[" + index + "]")));
      return group;
    }

    if (value && typeof value === "object") {
      const heading = document.createElement("p");
      heading.textContent = label;
      group.appendChild(heading);
      Object.entries(value).forEach(([key, child]) => group.appendChild(renderValue(child, key)));
      return group;
    }

    const key = document.createElement("span");
    key.textContent = label + ": ";
    group.append(key, scalarNode(value));
    return group;
  }

  function renderObject(root, object) {
    root.replaceChildren();
    Object.entries(object || {}).forEach(([key, value]) => root.appendChild(renderValue(value, key)));
  }

  function registerManagerBoxes(platemap) {
    const boxes = platemap.protected_boxes || {};
    ["daniel", "nik"].forEach((manager) => {
      const marker = stage.querySelector('[data-manager="' + manager + '"]');
      const box = boxes["face_" + manager];
      if (marker && box) marker.dataset.box = box.join(" ");
    });
  }

  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function leagueLabel(id) {
    return ({ premier_league: "PL", laliga: "LL", bundesliga: "BL", serie_a: "SA", ligue_1: "L1" })[id] || "LG";
  }

  function renderSideMenu(strings) {
    const menu = document.getElementById("legacySideMenu");
    menu.replaceChildren();
    [
      ["legacy", strings.sideMenu.legacy],
      ["trophyRoom", strings.sideMenu.trophyRoom],
      ["records", strings.sideMenu.records]
    ].forEach(([route, label], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.route = route;
      button.dataset.active = String(index === 0);
      button.textContent = label;
      if (index === 0) button.setAttribute("aria-current", "page");
      menu.appendChild(button);
    });
  }

  function renderCard(showdown, selected, strings) {
    const statusOnly = showdown.status === "abandoned" || showdown.status === "unavailable";
    const card = document.createElement(statusOnly ? "div" : "button");
    if (!statusOnly) card.type = "button";
    card.className = "legacyCard";
    card.dataset.showdown = String(showdown.number);
    card.dataset.status = showdown.status || "completed";
    card.dataset.selected = String(!statusOnly && showdown.number === selected);
    if (!statusOnly) card.setAttribute("aria-pressed", String(showdown.number === selected));

    const title = document.createElement("span");
    title.className = "legacyCardTitle";
    title.textContent = "Showdown #" + showdown.number;

    const body = document.createElement("span");
    body.className = "legacyCardBody";

    if (statusOnly) {
      const status = document.createElement("span");
      status.className = "legacyStatusOnly";
      status.textContent = showdown.status === "abandoned"
        ? strings.states.abandoned
        : strings.states.unavailable;
      body.appendChild(status);
      card.append(title, body);
      return card;
    }

    ["daniel", "nik"].forEach((manager, index) => {
      if (index === 1) {
        const score = document.createElement("span");
        score.className = "legacyScoreBlock";
        const league = document.createElement("span");
        league.className = "legacyLeagueMark";
        league.textContent = leagueLabel(showdown.leagueId);
        const numbers = document.createElement("span");
        numbers.className = "legacyScore";
        numbers.textContent = showdown.totals ? showdown.totals.daniel + " – " + showdown.totals.nik : "";
        const crown = document.createElement("span");
        crown.className = "legacyWinner";
        crown.textContent = showdown.winner && showdown.winner !== "draw" ? "♛" : "";
        crown.dataset.winner = showdown.winner || "";
        score.append(league, numbers, crown);
        body.appendChild(score);
      }

      const side = document.createElement("span");
      side.className = "legacyManager legacyManager--" + manager;
      const crest = document.createElement("span");
      crest.className = "legacyCrest";
      crest.textContent = initials(showdown.clubs && showdown.clubs[manager]);
      const who = document.createElement("span");
      who.className = "legacyManagerName";
      who.textContent = manager === "daniel" ? "Daniel" : "Nik";
      const club = document.createElement("span");
      club.className = "legacyClubName";
      club.textContent = showdown.clubs ? showdown.clubs[manager] : "";
      side.append(crest, who, club);
      body.appendChild(side);
    });

    const footer = document.createElement("span");
    footer.className = "legacyCardFooter";
    footer.textContent = showdown.seasonsPlayed + " / " + showdown.totalSeasons + " Seasons";
    card.append(title, body, footer);
    if (showdown.status === "completion-pending" || showdown.status === "in-progress") {
      const state = document.createElement("span");
      state.className = "legacyCardState";
      state.textContent = showdown.status === "completion-pending"
        ? strings.states.completionPending
        : "In progress";
      card.appendChild(state);
    }
    return card;
  }

  function renderSeasonHistory(frame, showdownNumber, strings) {
    const drawer = document.getElementById("legacySeasonHistory");
    const action = document.getElementById("viewSeasonHistory");
    const showdown = (frame.showdowns || []).find((item) => item.number === showdownNumber);
    drawer.replaceChildren();

    if (!showdown || !Array.isArray(showdown.seasons) || !showdown.seasons.length) {
      drawer.hidden = true;
      action.setAttribute("aria-expanded", "false");
      return;
    }

    const heading = document.createElement("h2");
    heading.className = "legacyHistoryHeading sd-label";
    heading.textContent = "Showdown #" + showdown.number + " · " + strings.actions.viewSeasonHistory;

    const rows = document.createElement("div");
    rows.className = "legacyHistoryRows";
    showdown.seasons.forEach((season) => {
      const row = document.createElement("div");
      row.className = "legacyHistoryRow";
      const label = document.createElement("span");
      label.textContent = "Season " + season.season;
      const daniel = document.createElement("span");
      daniel.className = "daniel";
      daniel.textContent = "Daniel " + season.score.daniel;
      const divider = document.createElement("span");
      divider.textContent = "–";
      const nik = document.createElement("span");
      nik.className = "nik";
      nik.textContent = season.score.nik + " Nik";
      row.append(label, daniel, divider, nik);
      rows.appendChild(row);
    });
    drawer.append(heading, rows);
    drawer.hidden = false;
    action.setAttribute("aria-expanded", "true");
  }

  function renderArchive(frame, strings) {
    const grid = document.getElementById("legacyCardGrid");
    const pager = document.getElementById("legacyPager");
    let page = Math.max(1, Number(frame.ui && frame.ui.page) || 1);
    const pages = Math.max(1, Number(frame.ui && frame.ui.totalPages) || 1);
    const pageSize = Math.max(1, Number(frame.ui && frame.ui.pageSize) || 4);
    let selected = frame.ui && frame.ui.selectedShowdown;

    function paint() {
      grid.replaceChildren();
      let records = frame.showdowns || [];
      if (frame.ui && Array.isArray(frame.ui.pageMap) && frame.ui.pageMap[page - 1]) {
        const wanted = new Set(frame.ui.pageMap[page - 1]);
        records = records.filter((item) => wanted.has(item.number));
      } else {
        records = records.slice((page - 1) * pageSize, page * pageSize);
      }
      records.forEach((item) => {
        const card = renderCard(item, selected, strings);
        if (item.status === "abandoned" || item.status === "unavailable") {
          grid.appendChild(card);
          return;
        }
        card.addEventListener("click", () => {
          selected = item.number;
          frame.ui.selectedShowdown = selected;
          if (window.LegacyFixture) window.LegacyFixture.selectedShowdown = selected;
          document.getElementById("legacySeasonHistory").hidden = true;
          document.getElementById("viewSeasonHistory").setAttribute("aria-expanded", "false");
          paint();
        });
        grid.appendChild(card);
      });

      pager.replaceChildren();
      if (pages <= 1) return;
      const prev = document.createElement("button");
      prev.type = "button"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous archive page");
      prev.disabled = page === 1;
      prev.addEventListener("click", () => { page -= 1; paint(); });
      pager.appendChild(prev);
      for (let i = 1; i <= pages; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button"; dot.className = "legacyPageDot"; dot.dataset.active = String(i === page);
        dot.setAttribute("aria-label", "Archive page " + i);
        dot.addEventListener("click", () => { page = i; paint(); });
        pager.appendChild(dot);
      }
      const next = document.createElement("button");
      next.type = "button"; next.textContent = "›"; next.setAttribute("aria-label", "Next archive page");
      next.disabled = page === pages;
      next.addEventListener("click", () => { page += 1; paint(); });
      pager.appendChild(next);
    }
    paint();
  }

  function applyFrameState(frame, strings) {
    const banner = document.getElementById("legacyStateBanner");
    const preview = document.getElementById("legacyPreviewTag");
    banner.replaceChildren();
    banner.hidden = true;
    preview.textContent = frame.previewLabel || strings.previewLabel;
    preview.hidden = !frame.previewLabel;
    stage.dataset.frameState = frame.status;

    let message = "";
    let icon = "•";
    if (frame.status === "empty") { message = strings.states.empty; icon = "◇"; }
    if (frame.status === "loading") { message = strings.states.loading; icon = "↻"; }
    if (frame.status === "unavailable") { message = strings.states.unavailable; icon = "!"; }
    if (frame.status === "partial") {
      const coverage = frame.coverage || { readable: 0, indexed: 0 };
      message = strings.states.partial
        .replace("{READABLE}", coverage.readable)
        .replace("{INDEXED}", coverage.indexed);
      icon = "!";
    }
    if (frame.interimLabel) { message = frame.interimLabel; icon = "i"; }

    if (message) {
      const mark = document.createElement("span");
      mark.className = "legacyStateIcon";
      mark.textContent = icon;
      const copy = document.createElement("p");
      copy.className = "legacyStateCopy";
      copy.textContent = message;
      banner.append(mark, copy);
      banner.hidden = false;
    }
  }

  async function boot() {
    const [fixtureResponse, mapResponse] = await Promise.all([
      fetch("./fixtures.json", { cache: "no-store" }),
      fetch("./assets/platemap.json", { cache: "no-store" })
    ]);
    if (!fixtureResponse.ok) throw new Error("fixtures.json " + fixtureResponse.status);
    if (!mapResponse.ok) throw new Error("platemap.json " + mapResponse.status);

    const fixtures = await fixtureResponse.json();
    const platemap = await mapResponse.json();
    const ids = Object.keys(fixtures.frames || {});
    const requested = new URLSearchParams(location.search).get("frame");
    const frameId = ids.includes(requested) ? requested : ids[0];
    const frame = fixtures.frames[frameId];

    registerManagerBoxes(platemap);
    const stageController = ShowdownStage.mount(stage, {
      plate: {
        width: 1672,
        height: 941,
        src1x: "./assets/ENV_LG_PLATE_V1_1X.webp",
        src2x: "./assets/ENV_LG_PLATE_V1_2X.webp"
      },
      focal: { x: 836, y: 470.5 },
      platemap
    });

    stage.dataset.frame = frameId;
    frameLabel.textContent = frameId;
    document.getElementById("fixtureEyebrow").textContent = fixtures.strings.eyebrow;
    document.getElementById("legacyHeading").textContent = fixtures.strings.heading;
    document.getElementById("fixtureTagline").textContent = fixtures.strings.tagline;

    const brand = document.getElementById("legacyBrand");
    brand.textContent = fixtures.strings.decorative.wordmark;
    document.getElementById("legacySlogan").textContent = fixtures.strings.decorative.moreThanAGame;
    const topNav = document.getElementById("legacyTopNav");
    topNav.replaceChildren();
    fixtures.strings.topNav.forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.route = label.toLowerCase();
      button.dataset.active = String(label === "CAREER");
      if (label === "CAREER") button.setAttribute("aria-current", "page");
      topNav.appendChild(button);
    });

    renderSideMenu(fixtures.strings);
    applyFrameState(frame, fixtures.strings);
    renderArchive(frame, fixtures.strings);
    const historyAction = document.getElementById("viewSeasonHistory");
    historyAction.textContent = fixtures.strings.actions.viewSeasonHistory;
    historyAction.dataset.route = "viewSeasonHistory";
    const selectedRecord = (frame.showdowns || []).find((item) => item.number === (frame.ui && frame.ui.selectedShowdown));
    historyAction.disabled = !selectedRecord || !Array.isArray(selectedRecord.seasons) || !selectedRecord.seasons.length;
    historyAction.addEventListener("click", () => {
      const selected = window.LegacyFixture && window.LegacyFixture.selectedShowdown;
      const drawer = document.getElementById("legacySeasonHistory");
      if (!drawer.hidden) {
        drawer.hidden = true;
        historyAction.setAttribute("aria-expanded", "false");
        return;
      }
      renderSeasonHistory(frame, selected, fixtures.strings);
    });
    renderObject(stringsRoot, fixtures.strings);
    renderObject(valuesRoot, frame);

    window.LegacyFixture = { fixtures, frameId, frame, platemap, stageController, selectedShowdown: frame.ui && frame.ui.selectedShowdown };
  }

  boot().catch((error) => {
    stage.dataset.frame = "error";
    frameLabel.textContent = "Fixture load failed";
    valuesRoot.textContent = error.message;
  });
}());
