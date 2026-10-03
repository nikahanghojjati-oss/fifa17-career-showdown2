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

  function renderCard(showdown, selected) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "legacyCard";
    card.dataset.showdown = String(showdown.number);
    card.dataset.selected = String(showdown.number === selected);
    card.setAttribute("aria-pressed", String(showdown.number === selected));

    const title = document.createElement("span");
    title.className = "legacyCardTitle";
    title.textContent = "Showdown #" + showdown.number;

    const body = document.createElement("span");
    body.className = "legacyCardBody";
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
    return card;
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
        const card = renderCard(item, selected);
        card.addEventListener("click", () => {
          selected = item.number;
          frame.ui.selectedShowdown = selected;
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
    renderArchive(frame, fixtures.strings);
    renderObject(stringsRoot, fixtures.strings);
    renderObject(valuesRoot, frame);

    window.LegacyFixture = { fixtures, frameId, frame, platemap, stageController };
  }

  boot().catch((error) => {
    stage.dataset.frame = "error";
    frameLabel.textContent = "Fixture load failed";
    valuesRoot.textContent = error.message;
  });
}());
