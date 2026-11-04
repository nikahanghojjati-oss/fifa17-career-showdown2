// JOB-072 · Legacy fixture scaffold + registered cinematic stage.
window.ShowdownLegacyBoot = function () {
  "use strict";

  const stage = document.getElementById("stage-root");
  const valuesRoot = document.getElementById("fixtureValues");
  const stringsRoot = document.getElementById("fixtureStrings");
  const frameLabel = document.getElementById("fixtureFrameLabel");

  // Signature-only timing; the shared kit continues to own entrance timing.
  const LEGACY_MOTION = Object.freeze({ deal: 400, stagger: 50, crown: 220,
    page: 280, parallax: 320, fade: 150, ease: "cubic-bezier(.22,1,.36,1)" });
  const motionTimers = new WeakMap();
  // r86 Special Player chip next to the manager's name (only for a Showdown that carries one: js/specialPlayerChip.js).
  function specialPlayerChip(showdown, manager) {
    const api = window.CareerModeSpecialPlayerChip, sp = showdown && showdown.specialPlayers && showdown.specialPlayers[manager];
    return api && sp ? api.element(document, sp) : null;
  }
  function reducedMotion() {
    let app = false;
    try {
      app = !!(window.isReducedMotionPreferred?.() ||
        window.getApplicationMotionPreferenceState?.()?.effectiveReduced ||
        false);
    } catch (_) { /* The system preference still applies if storage is unavailable. */ }
    return app || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motionReduced === "true" ||
      document.documentElement.dataset.reducedMotion === "true";
  }
  function animateLegacy(element, name, duration, delay = 0) {
    if (!element) return;
    clearTimeout(motionTimers.get(element));
    element.classList.remove("legacyDealing", "legacyCrowning", "legacyPaging", "legacyParallax", "legacyFading");
    const reduced = reducedMotion();
    const ms = reduced ? LEGACY_MOTION.fade : duration;
    const wait = reduced ? 0 : delay;
    element.style.setProperty("--lg-motion-ms", ms + "ms");
    element.style.setProperty("--lg-motion-delay", wait + "ms");
    element.style.setProperty("--lg-motion-ease", LEGACY_MOTION.ease);
    element.classList.add(reduced ? "legacyFading" : name);
    // Reset the same CSS animation on rapid repeat input without measuring layout.
    element.getAnimations?.().filter(a => /^(legacy-|sd-reduced-fade)/.test(a.animationName || "")).forEach(a => { a.currentTime = 0; });
    motionTimers.set(element, setTimeout(() => {
      element.classList.remove(name, "legacyFading");
      ["--lg-motion-ms", "--lg-motion-delay", "--lg-motion-ease"].forEach(key => element.style.removeProperty(key));
      motionTimers.delete(element);
    }, wait + ms + 20));
  }
  function dealCards(initial = false) {
    // Only the currently visible phone card is dealt. Other cards appear on selection.
    const phone = window.matchMedia("(max-width: 900px)").matches;
    const cards = Array.from(document.querySelectorAll(".legacyCard"));
    const selected = cards.find(card => card.dataset.selected === "true") || cards[0];
    (phone ? cards.filter(card => card === selected) : cards).forEach((card, index) => {
      const delay = (initial ? 400 : 0) + Math.min(index, 3) * LEGACY_MOTION.stagger;
      animateLegacy(card, "legacyDealing", LEGACY_MOTION.deal, delay);
      animateLegacy(card.querySelector(".legacyWinnerCrown"), "legacyCrowning", LEGACY_MOTION.crown, delay + LEGACY_MOTION.deal);
    });
  }

  function pageMotion(direction, moveCards = true) {
    const grid = document.getElementById("legacyCardGrid");
    grid.style.setProperty("--lg-page-x", (direction * 18) + "px");
    if (moveCards) animateLegacy(grid, "legacyPaging", LEGACY_MOTION.page);
    document.querySelectorAll(".legacyPhonePlate, .sd-stage__plate").forEach(plate => {
      plate.style.setProperty("--lg-parallax-x", (-direction * 4) + "px");
      animateLegacy(plate, "legacyParallax", LEGACY_MOTION.parallax);
    });
  }

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

  // Original SVGs are loaded only by this optional screen, never app startup.
  function identityMark(host, svg, league = false) {
    if (!svg) return;
    host.innerHTML = svg;
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "clip-path:none;background:none;border:0;padding:0";
    const image = host.querySelector("svg");
    image.style.cssText = league ? "display:block;width:24px;height:24px" : "display:block;width:100%;height:100%";
  }

  function copy(strings, key, values = {}) {
    return strings.ui[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  }

  // Minimal bootstrap copy remains usable if the dictionary itself cannot load.
  let screenStrings;

  function renderSideMenu(strings) {
    const menu = document.getElementById("legacySideMenu");
    menu.replaceChildren();
    [
      ["legacy", strings.sideMenu.legacy],
      ["trophyRoom", strings.sideMenu.trophyRoom],
      ["careerStatistics", strings.sideMenu.records]
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
    title.textContent = copy(strings, "showdown", { number: showdown.number });

    const body = document.createElement("span");
    body.className = "legacyCardBody";

    if (statusOnly) {
      const status = document.createElement("span");
      status.className = "legacyStatusOnly";
      // r80 Ended early: the seam's "Ended early · 19 Oct 2026 · 1 season" reads as the status line, then the date and
      // seasons played on one footer line (as the completed card's season count). The separator between the two lines is
      // not drawn, so no line starts with "·", and the row's text stays the seam's label.
      const [label, ...details] = showdown.status === "abandoned"
        ? String(showdown.endedLabel || strings.states.abandoned).split(" · ")
        : [strings.states.unavailable];
      status.textContent = label;
      body.appendChild(status);
      card.append(title, body);
      if (details.length) {
        const meta = document.createElement("span");
        meta.className = "legacyEndedMeta";
        const separator = document.createElement("span");
        separator.className = "legacyEndedSeparator";
        separator.textContent = " · ";
        meta.append(separator, document.createTextNode(details.join(" · ")));
        card.appendChild(meta);
      }
      return card;
    }

    ["daniel", "nik"].forEach((manager, index) => {
      if (index === 1) {
        const score = document.createElement("span");
        score.className = "legacyScoreBlock";
        const finalResult = ["completed", "completion-pending"].includes(showdown.status);
        const winner = finalResult ? showdown.winner : "";
        const league = document.createElement("span");
        league.className = "legacyLeagueMark";
        // r87: the Premier League mark is a gold crown, and over a level score it read as a winner's crown. A draw shows an
        // "=" in its place (no crown on a draw).
        if (winner === "draw") {
          league.classList.add("legacyLeagueMark--draw");
          league.dataset.draw = "true";
          league.setAttribute("aria-hidden", "true");
          league.style.cssText = "clip-path:none;background:none;border:0;padding:0;width:24px;height:24px;line-height:24px;font-size:22px;font-weight:700;text-align:center;color:#f2c45b";
          league.textContent = "=";
        } else identityMark(league, window.getLeagueMark(showdown.leagueId)?.svg, true);
        const numbers = document.createElement("span");
        numbers.className = "legacyScore";
        numbers.textContent = showdown.totals ? copy(strings, "score", showdown.totals) : "";
        const crown = document.createElement("span");
        crown.className = "legacyWinner";
        crown.dataset.winner = winner || "";
        crown.style.cssText = "height:auto;min-height:14px;font-size:.6875rem;line-height:1.2";
        if (winner === "draw") crown.textContent = strings.ui.draw;
        else if (["daniel", "nik"].includes(winner)) {
          const icon = document.createElement("span");
          icon.className = "legacyWinnerCrown";
          icon.textContent = "♛";
          icon.setAttribute("aria-hidden", "true");
          crown.append(icon, document.createTextNode(" " + copy(strings, "winner", { manager: strings.ui.managers[winner] })));
        }
        score.append(league, numbers, crown);
        body.appendChild(score);
      }

      const side = document.createElement("span");
      side.className = "legacyManager legacyManager--" + manager;
      const crest = document.createElement("span");
      crest.className = "legacyCrest";
      identityMark(crest, window.getClubCrestSvg(showdown.clubs && showdown.clubs[manager]));
      const who = document.createElement("span");
      who.className = "legacyManagerName";
      who.textContent = strings.ui.managers[manager];
      const club = document.createElement("span");
      club.className = "legacyClubName";
      club.textContent = showdown.clubs ? showdown.clubs[manager] : "";
      side.append(crest, who, club);
      body.appendChild(side);
    });

    const footer = document.createElement("span");
    footer.className = "legacyCardFooter";
    footer.textContent = copy(strings, "seasons", { played: showdown.seasonsPlayed, total: showdown.totalSeasons });
    // r86: each manager's Special Player, on one line under that manager's side of the card (none before r86).
    const chips = ["daniel", "nik"].map((manager) => specialPlayerChip(showdown, manager));
    const special = chips[0] && chips[1] ? document.createElement("span") : null;
    if (special) {
      special.className = "legacyCardSpecial";
      chips.forEach((chip, index) => { chip.dataset.manager = index ? "nik" : "daniel"; special.appendChild(chip); });
    }
    card.append(title, body, ...(special ? [special] : []), footer);
    // r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 150 points (r87: 15 a season).
    const golden = Array.isArray(showdown.goldenShowdown) ? showdown.goldenShowdown.filter((manager) => manager === "daniel" || manager === "nik") : [];
    if (golden.length) {
      card.dataset.golden = "true";
      const mark = document.createElement("span");
      mark.className = "legacyGoldenShowdown";
      mark.dataset.goldenShowdown = "true";
      const star = document.createElement("span");
      star.className = "legacyGoldenShowdownStar";
      star.textContent = "★";
      star.setAttribute("aria-hidden", "true");
      mark.append(star, document.createTextNode(" " + (strings.ui.goldenShowdown || "Golden Showdown") + " · " + golden.map((manager) => strings.ui.managers[manager]).join(" & ")));
      card.appendChild(mark);
    }
    if (showdown.status === "completion-pending" || showdown.status === "in-progress") {
      const state = document.createElement("span");
      state.className = "legacyCardState";
      state.textContent = showdown.status === "completion-pending"
        ? strings.states.completionPending
        : strings.ui.inProgress;
      card.appendChild(state);
    }
    return card;
  }

  function canDisclose(record) {
    return record && ["completed", "completion-pending", "in-progress"].includes(record.status)
      && Array.isArray(record.seasons) && record.seasons.length > 0;
  }

  function closeHistory(returnFocus = false) {
    const drawer = document.getElementById("legacySeasonHistory");
    drawer.hidden = true;
    document.getElementById("viewSeasonHistory").setAttribute("aria-expanded", "false");
    if (returnFocus) document.getElementById("viewSeasonHistory").focus();
  }

  function renderSeasonHistory(frame, showdownNumber, strings) {
    const drawer = document.getElementById("legacySeasonHistory");
    const action = document.getElementById("viewSeasonHistory");
    const showdown = (frame.showdowns || []).find((item) => item.number === showdownNumber);
    if (!canDisclose(showdown)) { closeHistory(); return; }
    drawer.replaceChildren();
    drawer.setAttribute("role", "region");
    drawer.setAttribute("aria-labelledby", "legacyHistoryHeading");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "sd-btn legacyHistoryClose";
    close.textContent = strings.ui.close;
    close.style.cssText = "position:sticky;top:0;z-index:2;min-height:44px;min-width:44px;background:#0d0f13;color:#f4f1ea";
    close.addEventListener("click", () => closeHistory(true));
    const heading = document.createElement("h2");
    heading.id = "legacyHistoryHeading";
    heading.className = "legacyHistoryHeading sd-label";
    heading.textContent = copy(strings, "historyHeading", { showdown: copy(strings, "showdown", { number: showdown.number }), action: strings.ui.seasonBySeason || strings.actions.viewSeasonHistory });
    // r87 polish: the season list is a real table (Season · Daniel · Nik · Result), one row per season. Each manager's cell
    // carries the season's Showdown points large, then the league finish, points and goals, then a Europa League win. The
    // Result column names the season winner with the crown, or "=" and Draw when the points are equal (no tiebreak).
    const ui = strings.ui;
    const text = (key, fallback, values) => (ui[key] ? copy(strings, key, values) : fallback);
    const cell = (tag, className, content) => { const el = document.createElement(tag); if (className) el.className = className; if (content != null) el.textContent = content; return el; };
    const rows = cell("table", "legacyHistoryTable");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.append(cell("th", "legacyHistorySeasonHead", text("seasonColumn", "Season")),
      cell("th", "daniel", ui.managers.daniel), cell("th", "nik", ui.managers.nik),
      cell("th", "legacyHistoryResultHead", text("resultColumn", "Result")));
    headRow.querySelectorAll("th").forEach((th) => th.setAttribute("scope", "col"));
    head.appendChild(headRow);
    const body = document.createElement("tbody");
    showdown.seasons.forEach((season) => {
      const row = document.createElement("tr");
      row.className = "legacyHistorySeason";
      const d = Number(season.score.daniel), n = Number(season.score.nik);
      const winner = d > n ? "daniel" : n > d ? "nik" : "draw";
      row.dataset.winner = winner;
      const label = cell("th", "legacyHistorySeasonLabel", copy(strings, "season", { number: season.season }));
      label.setAttribute("scope", "row");
      row.appendChild(label);
      ["daniel", "nik"].forEach((manager) => {
        const side = cell("td", manager);
        side.dataset.won = String(winner === manager);
        side.appendChild(cell("b", "legacyHistoryPoints", String(season.score[manager])));
        // r87: a real space keeps "8 #3" two words wherever the points and the finish sit on one line (copy, screen readers, CE2PG).
        side.appendChild(document.createTextNode(" "));
        side.appendChild(cell("span", "legacyHistoryDetail", copy(strings, "seasonDetail", { position: season.leaguePosition[manager], points: season.leaguePoints[manager], goals: season.leagueGoals[manager] })));
        // r80: a season row names a Europa League win (the career season row carries it only for such a season).
        if (season.europaLeague && season.europaLeague[manager] === true) side.append(" ", cell("span", "legacyHistoryEuropa", strings.ui.europaLeague || "Europa League winner"));
        row.appendChild(side);
      });
      const result = cell("td", "legacyHistoryResult");
      result.appendChild(cell("span", "legacyHistoryMark", winner === "draw" ? "=" : "\u265B")).setAttribute("aria-hidden", "true");
      result.appendChild(document.createTextNode(" "));
      result.appendChild(cell("span", "legacyHistoryWinner", winner === "draw" ? ui.draw : ui.managers[winner]));
      row.appendChild(result);
      body.appendChild(row);
    });
    rows.append(head, body);
    // r86: this Showdown's Special Players, each next to the manager's name (none for a Showdown from before r86).
    const chips = ["daniel", "nik"].map((manager) => [manager, specialPlayerChip(showdown, manager)]).filter(([, chip]) => chip);
    const special = chips.length === 2 ? document.createElement("p") : null;
    if (special) {
      special.className = "legacyHistorySpecialPlayers spChipPair";
      chips.forEach(([manager, chip]) => { const who = document.createElement("span"); who.append(document.createTextNode(strings.ui.managers[manager]), chip); special.appendChild(who); });
    }
    drawer.append(close, heading, ...(special ? [special] : []), rows);
    drawer.onkeydown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeHistory(true); }
    };
    drawer.hidden = false;
    action.setAttribute("aria-expanded", "true");
    close.focus({ preventScroll: true });
    // r87: on a phone the list opens below the fold, under the tab bar; bring it into view (its scroll-margin clears the bar).
    drawer.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion() ? "instant" : "smooth" });
  }

  // r87 (transitions): phone History draws the selected card and this many on each side; a career of hundreds of
  // Showdowns used to build every card (three crests each) before the screen could open.
  // Studio Small Axe History finder: the list shows up to this many Showdowns per page. On desktop the page size is then
  // fitted to the window (never under LIST_MIN_PAGE_SIZE), so VIEW SEASON HISTORY and the pager stay on screen.
  const LIST_PAGE_SIZE = 12;
  const LIST_MIN_PAGE_SIZE = 5;
  const ARCHIVE_FILTERS = [["all", "ALL"], ["daniel", "DANIEL WINS"], ["nik", "NIK WINS"], ["draw", "DRAWS"], ["golden", "GOLDEN"]];
  function archiveWinner(item) {
    return item && ["completed", "completion-pending"].includes(item.status) ? item.winner || "" : "";
  }
  function archiveGolden(item) {
    return Boolean(item && Array.isArray(item.goldenShowdown) && item.goldenShowdown.some((manager) => manager === "daniel" || manager === "nik"));
  }
  function archiveMatches(item, filter) {
    if (filter === "golden") return archiveGolden(item);
    if (filter === "daniel" || filter === "nik" || filter === "draw") return archiveWinner(item) === filter;
    return true;
  }
  function archiveFilterLabel(filter) {
    return ({ daniel: "Daniel wins", nik: "Nik wins", draw: "Draws", golden: "Golden" })[filter] || "this filter";
  }
  function archiveEmptyLine(filter) {
    return ({ daniel: "No Daniel wins yet.", nik: "No Nik wins yet.", draw: "No draws yet.", golden: "No Golden Showdowns yet." })[filter] || "No Showdowns here yet.";
  }
  const PHONE_CARD_WINDOW = 3;
  function renderArchive(frame, strings) {
    const grid = document.getElementById("legacyCardGrid");
    const pager = document.getElementById("legacyPager");
    const action = document.getElementById("viewSeasonHistory");
    const phone = window.matchMedia("(max-width: 900px)");
    frame.ui = frame.ui || {};
    let page = Math.max(1, Number(frame.ui.page) || 1);
    // Studio Small Axe (Nik 2026-11-03): a CARDS / LIST view, a "Go to #" box and result filters, all over the rows this
    // frame already holds (no new reads). The choice lasts while the app is open.
    const prefs = window.CareerModeLegacyArchivePrefs || (window.CareerModeLegacyArchivePrefs = { view: "cards", filter: "all" });
    if (!ARCHIVE_FILTERS.some(([key]) => key === prefs.filter)) prefs.filter = "all";
    if (prefs.view !== "list") prefs.view = "cards";
    const allRecords = frame.showdowns || [];
    const cardPageSize = Math.max(1, Number(frame.ui.pageSize) || 4);
    let listSize = LIST_PAGE_SIZE;
    let fitFrame = 0;
    const nextFrame = (fn) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(fn) : 0);
    const dropFrame = (id) => { if (id && typeof cancelAnimationFrame === "function") cancelAnimationFrame(id); };
    let records = allRecords.filter((item) => archiveMatches(item, prefs.filter));
    let pageSize = prefs.view === "list" ? listSize : cardPageSize;
    let pages = Math.max(1, Math.ceil(records.length / pageSize));
    // The phone's one-card-at-a-time carousel applies to cards only; the list pages on every size.
    const single = () => phone.matches && prefs.view !== "list";
    // The list counts its pages back from the newest Showdown, so the page it opens on is always full (the oldest page
    // holds the remainder). Cards keep their pages from the oldest.
    const pageStart = (p) => prefs.view === "list" ? Math.max(0, records.length - (pages - p + 1) * pageSize) : (p - 1) * pageSize;
    const pageEnd = (p) => prefs.view === "list" ? Math.max(0, records.length - (pages - p) * pageSize) : Math.min(records.length, p * pageSize);
    const pageOf = (index) => prefs.view === "list" ? pages - Math.floor((records.length - 1 - Math.max(0, index)) / pageSize) : Math.floor(Math.max(0, index) / pageSize) + 1;
    let selected = frame.ui.selectedShowdown;
    if (prefs.view === "list" || prefs.filter !== "all") {
      let index = records.findIndex((item) => item.number === selected);
      if (index < 0) index = records.length - 1;
      selected = index >= 0 ? records[index].number : undefined;
      page = single() ? index + 1 : pageOf(index);
    }
    let visible = [];
    let settling = 0;
    let pagerBuiltFor = null;

    function liveCard(item) {
      const card = renderCard(item, selected, strings);
      card.addEventListener("click", () => select(item.number));
      return card;
    }
    function standIn(item) {
      const card = document.createElement("div");
      card.className = "legacyCard";
      card.dataset.showdown = String(item.number);
      card.dataset.status = item.status || "completed";
      card.dataset.selected = "false";
      card.dataset.standIn = "true";
      // The screen's layout reads data-golden from any card (css/rivalryLegacyV10.css :has()), so a stand-in carries it too.
      if (Array.isArray(item.goldenShowdown) && item.goldenShowdown.some((manager) => manager === "daniel" || manager === "nik")) card.dataset.golden = "true";
      card.setAttribute("aria-hidden", "true");
      return card;
    }
    function listRow(item) {
      const statusOnly = item.status === "abandoned" || item.status === "unavailable";
      const row = document.createElement(statusOnly ? "div" : "button");
      if (!statusOnly) row.type = "button";
      row.className = "legacyListRow";
      row.dataset.showdown = String(item.number);
      row.dataset.status = item.status || "completed";
      const number = document.createElement("span");
      number.className = "legacyListNumber";
      number.textContent = "#" + item.number;
      row.appendChild(number);
      if (statusOnly) {
        const ended = document.createElement("span");
        ended.className = "legacyListEnded";
        ended.textContent = item.status === "abandoned" ? String(item.endedLabel || strings.states.abandoned) : strings.states.unavailable;
        row.appendChild(ended);
        return row;
      }
      const winner = archiveWinner(item);
      row.dataset.winner = winner || "";
      const match = document.createElement("span");
      match.className = "legacyListMatch";
      ["daniel", "nik"].forEach((manager, index) => {
        const side = document.createElement("span");
        side.className = "legacyListSide legacyListSide--" + manager;
        const who = document.createElement("b");
        who.textContent = strings.ui.managers[manager];
        const club = document.createElement("small");
        club.textContent = item.clubs ? item.clubs[manager] || "" : "";
        side.append(who, club);
        if (index === 1) {
          const score = document.createElement("span");
          score.className = "legacyListScore";
          score.textContent = item.totals ? copy(strings, "score", item.totals) : "–";
          match.appendChild(score);
        }
        match.appendChild(side);
      });
      const result = document.createElement("span");
      result.className = "legacyListResult";
      result.dataset.winner = winner || "";
      if (winner === "draw") result.textContent = "= " + strings.ui.draw;
      else if (winner === "daniel" || winner === "nik") result.textContent = "♛ " + copy(strings, "winner", { manager: strings.ui.managers[winner] });
      else result.textContent = strings.ui.inProgress;
      const seasons = document.createElement("span");
      seasons.className = "legacyListSeasons";
      seasons.textContent = copy(strings, "seasons", { played: item.seasonsPlayed, total: item.totalSeasons });
      const golden = document.createElement("span");
      golden.className = "legacyListGolden";
      if (archiveGolden(item)) {
        golden.textContent = "★";
        golden.title = strings.ui.goldenShowdown;
        golden.setAttribute("aria-label", strings.ui.goldenShowdown);
        row.dataset.golden = "true";
      } else golden.setAttribute("aria-hidden", "true");
      row.append(match, result, seasons, golden);
      row.setAttribute("aria-pressed", String(item.number === selected));
      row.dataset.rowSelected = String(item.number === selected);
      row.addEventListener("click", () => select(item.number));
      return row;
    }
    // The finding tools: view, "Go to #", filters with counts. Desktop (Nik 2026-11-04, "Move both"): one toolbar row above
    // the archive, so the side column keeps only the three tabs. Phones keep them under the tabs, folded under FIND.
    const menu = document.getElementById("legacySideMenu");
    let tools = null;
    function placeTools() {
      if (!tools) return;
      const host = !phone.matches && grid && grid.parentElement && typeof grid.before === "function" ? grid.parentElement : menu;
      if (host === menu) { if (tools.parentElement !== menu) menu.appendChild(tools); }
      else if (tools.parentElement !== host || tools.nextElementSibling !== grid) grid.before(tools);
      tools.dataset.toolbar = String(host !== menu);
    }
    function renderTools() {
      if (!menu) return;
      menu.querySelectorAll(".legacyTools").forEach((node) => node.remove());
      if (grid && grid.parentElement && typeof grid.parentElement.querySelectorAll === "function") grid.parentElement.querySelectorAll(":scope > .legacyTools").forEach((node) => node.remove());
      tools = null;
      if (!allRecords.length) return;
      tools = document.createElement("div");
      tools.className = "legacyTools";
      tools.setAttribute("role", "group");
      tools.setAttribute("aria-label", "Find a Showdown");
      const views = document.createElement("div");
      views.className = "legacyViewToggle";
      views.setAttribute("role", "group");
      views.setAttribute("aria-label", "Archive view");
      [["cards", "CARDS"], ["list", "LIST"]].forEach(([key, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.archiveView = key;
        button.textContent = label;
        button.addEventListener("click", () => { if (prefs.view !== key) { prefs.view = key; rebuild(selected); } });
        views.appendChild(button);
      });
      const jump = document.createElement("form");
      jump.className = "legacyJump";
      jump.noValidate = true;
      const label = document.createElement("label");
      label.htmlFor = "legacyJumpInput";
      label.textContent = "GO TO #";
      const input = document.createElement("input");
      input.id = "legacyJumpInput";
      input.type = "number";
      input.inputMode = "numeric";
      input.min = "1";
      input.step = "1";
      input.placeholder = String(allRecords[allRecords.length - 1].number);
      input.setAttribute("aria-describedby", "legacyJumpNote");
      const go = document.createElement("button");
      go.type = "submit";
      go.textContent = "GO";
      go.setAttribute("aria-label", "Go to Showdown");
      const note = document.createElement("span");
      note.id = "legacyJumpNote";
      note.className = "legacyJumpNote";
      note.setAttribute("role", "status");
      note.setAttribute("role", "status");
      note.setAttribute("aria-live", "polite");
      jump.append(label, input, go, note);
      jump.addEventListener("submit", (event) => {
        event.preventDefault();
        const wanted = Number(String(input.value).trim());
        const found = Number.isInteger(wanted) ? allRecords.find((item) => item.number === wanted) : null;
        if (!found) { note.textContent = input.value ? "No Showdown #" + input.value : "Type a Showdown number"; return; }
        note.textContent = "";
        if (!archiveMatches(found, prefs.filter)) prefs.filter = "all";
        rebuild(found.number, true);
      });
      const filters = document.createElement("div");
      filters.className = "legacyFilters";
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Show Showdowns");
      ARCHIVE_FILTERS.forEach(([key, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.archiveFilter = key;
        const name = document.createElement("span");
        const [first, ...rest] = label.split(" ");
        name.textContent = first;
        if (rest.length) {
          const tail = document.createElement("span");
          tail.className = "legacyFilterTail";
          tail.textContent = " " + rest.join(" ");
          name.appendChild(tail);
        }
        const count = document.createElement("b");
        count.textContent = String(allRecords.filter((item) => archiveMatches(item, key)).length);
        button.append(name, count);
        button.setAttribute("aria-label", archiveFilterLabel(key) === "this filter" ? "All Showdowns" : archiveFilterLabel(key));
        button.addEventListener("click", () => { if (prefs.filter !== key) { prefs.filter = key; rebuild(selected); } });
        filters.appendChild(button);
      });
      // Phones: the Go to # box and the filters fold under one FIND button, so the hero and the pager keep their room.
      const find = document.createElement("button");
      find.type = "button";
      find.className = "legacyFindToggle";
      find.setAttribute("aria-expanded", "false");
      find.addEventListener("click", () => {
        const open = tools.dataset.findOpen !== "true";
        tools.dataset.findOpen = String(open);
        find.setAttribute("aria-expanded", String(open));
        if (open) input.focus({ preventScroll: true });
      });
      tools.append(views, find, jump, filters);
      menu.appendChild(tools);
      placeTools();
      syncTools();
    }
    function syncTools() {
      if (!tools) return;
      tools.querySelectorAll("[data-archive-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.archiveView === prefs.view)));
      tools.querySelectorAll("[data-archive-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.archiveFilter === prefs.filter)));
      const find = tools.querySelector(".legacyFindToggle");
      if (find) find.textContent = prefs.filter === "all" ? "FIND" : "FIND · " + ARCHIVE_FILTERS.find(([key]) => key === prefs.filter)[1].split(" ")[0];
      const input = tools.querySelector("#legacyJumpInput");
      if (input) input.max = String(Math.max(...allRecords.map((item) => Number(item.number) || 0)));
      const host = document.getElementById("legacy");
      if (host) { host.dataset.historyView = prefs.view; host.dataset.historyFilter = prefs.filter; }
    }
    // Re-filters and redraws around one Showdown (kept when it is still shown, otherwise the newest shown).
    function rebuild(target, focus = false) {
      records = allRecords.filter((item) => archiveMatches(item, prefs.filter));
      pageSize = prefs.view === "list" ? listSize : cardPageSize;
      pages = Math.max(1, Math.ceil(records.length / pageSize));
      pagerBuiltFor = null;
      let index = records.findIndex((item) => item.number === target);
      if (index < 0) index = records.length - 1;
      selected = index >= 0 ? records[index].number : undefined;
      page = single() ? Math.max(0, index) + 1 : pageOf(index);
      paint(focus);
      syncTools();
    }
    // Draws the real cards within PHONE_CARD_WINDOW of the given Showdown (a stand-in becomes its card in place).
    function drawNear(number) {
      if (!single()) return;
      const index = records.findIndex((item) => item.number === number);
      if (index < 0) return;
      for (let i = Math.max(0, index - PHONE_CARD_WINDOW); i <= Math.min(records.length - 1, index + PHONE_CARD_WINDOW); i++) {
        const node = grid.children[i];
        if (node && node.dataset.standIn === "true" && Number(node.dataset.showdown) === records[i].number) node.replaceWith(liveCard(records[i]));
      }
    }
    function select(number, scroll = false) {
      drawNear(number);
      const previousIndex = records.findIndex(item => item.number === selected);
      const changed = number !== selected;
      const before = selected;
      selected = number;
      frame.ui.selectedShowdown = selected;
      if (window.LegacyFixture) window.LegacyFixture.selectedShowdown = selected;
      const record = records.find((item) => item.number === selected);
      action.disabled = !canDisclose(record);
      closeHistory();
      grid.querySelectorAll(".legacyListRow").forEach((row) => {
        const active = Number(row.dataset.showdown) === selected;
        if (row.dataset.rowSelected !== String(active)) row.dataset.rowSelected = String(active);
        if (row.tagName === "BUTTON" && row.getAttribute("aria-pressed") !== String(active)) row.setAttribute("aria-pressed", String(active));
      });
      grid.querySelectorAll(".legacyCard").forEach((card) => {
        const active = Number(card.dataset.showdown) === selected;
        // r87 (transitions): only cards whose state changes are written, so a long career restyles two cards per step, not all.
        // The old and new selected cards are always written: two Ended early cards both stay "false", and the shell's
        // MutationObserver (js/rivalryLegacyV10.js) moves the shown card only on a data-selected write (Codex #1120).
        const shown = String(active && canDisclose(record));
        const step = changed && (active || Number(card.dataset.showdown) === before);
        if (step || card.dataset.selected !== shown) card.dataset.selected = shown;
        if (card.tagName === "BUTTON" && card.getAttribute("aria-pressed") !== String(active)) card.setAttribute("aria-pressed", String(active));
        if (active && scroll) grid.scrollLeft = Array.from(grid.children).indexOf(card) * grid.clientWidth;
      });
      const index = records.findIndex((item) => item.number === selected);
      const prev = pager.querySelector('[data-direction="-1"]');
      const next = pager.querySelector('[data-direction="1"]');
      if (prev) prev.disabled = single() ? index <= 0 : page <= 1;
      if (next) next.disabled = single() ? index >= records.length - 1 : page >= pages;
      const currentPage = single() ? Math.max(0, index) + 1 : page;
      frame.ui.page = currentPage;
      // r87 career fixes (Nik 2026-10-31): long careers use a compact counter and a scrubber instead of one dot per item.
      const total = single() ? records.length : pages;
      const counter = pager.querySelector(".legacyPageCounter");
      if (counter) {
        const firstShown = pageStart(page) + 1, lastShown = pageEnd(page);
        counter.textContent = single() ? currentPage + " / " + total : (firstShown === lastShown ? String(firstShown) : firstShown + "–" + lastShown) + " / " + records.length;
        counter.setAttribute("aria-label", copy(strings, "page", { number: currentPage, total }));
      }
      const scrub = pager.querySelector(".legacyPageScrub");
      if (scrub) { scrub.value = String(currentPage); scrub.setAttribute("aria-valuetext", copy(strings, "page", { number: currentPage, total })); }
      const oldest = pager.querySelector('[data-jump="oldest"]'), newest = pager.querySelector('[data-jump="newest"]');
      if (oldest) oldest.disabled = currentPage <= 1;
      if (newest) newest.disabled = currentPage >= total;
      const dots = pager.querySelector(".legacyPageDots");
      if (dots) {
        dots.setAttribute("aria-label", copy(strings, "page", { number: currentPage, total: single() ? records.length : pages }));
        dots.querySelectorAll(".legacyPageDot").forEach((dot, dotIndex) => {
          dot.dataset.active = String(dotIndex + 1 === currentPage);
        });
      }
      if (single() && changed) pageMotion(index > previousIndex ? 1 : -1, scroll);
    }

    // Desktop list: when the rows would push VIEW SEASON HISTORY under the window's bottom edge, the page holds fewer rows
    // (one measured row pitch at a time, never fewer than LIST_MIN_PAGE_SIZE). Layout reads only, no data reads.
    function fitList() {
      if (prefs.view !== "list" || phone.matches || !action || typeof action.getBoundingClientRect !== "function" || typeof getComputedStyle !== "function") return;
      const rows = grid.querySelectorAll(".legacyListRow");
      if (rows.length < 2 || rows.length < listSize) return;
      const pitch = rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top;
      if (!(pitch > 0)) return;
      // Two limits, the smaller wins: VIEW SEASON HISTORY stays above the window's bottom edge, and the rows plus a
      // natural-height pager fill the archive panel's own height (the height the cards use, or the side column's when that
      // is taller), so the panel never grows past it and the pager is not stretched over empty marble.
      const gridTop = rows[0].getBoundingClientRect().top;
      const pagerBox = pager.getBoundingClientRect();
      const lead = pagerBox.top - rows[rows.length - 1].getBoundingClientRect().bottom;
      const pagerMin = parseFloat(getComputedStyle(pager).minHeight) || 44;
      const rowGap = pitch - rows[0].getBoundingClientRect().height;
      let next = listSize;
      const viewOver = action.getBoundingClientRect().bottom + 8 - window.innerHeight;
      if (viewOver > 0) next = Math.min(next, listSize - Math.ceil(viewOver / pitch));
      const panel = grid.closest(".legacyArchivePanel");
      const panelMin = panel ? parseFloat(getComputedStyle(panel).minHeight) : 0;
      const side = document.querySelector("#legacy .legacySidePanel");
      const kids = side ? [...side.children].filter((kid) => kid.getClientRects().length) : [];
      const sideBottom = kids.length ? Math.max(...kids.map((kid) => kid.getBoundingClientRect().bottom)) : 0;
      if (panelMin > 0 || sideBottom > 0) {
        const panelBox = panel ? panel.getBoundingClientRect() : pagerBox;
        const bottom = Math.max(panelMin > 0 ? panelBox.top + panelMin - (panelBox.bottom - pagerBox.bottom) : 0, sideBottom);
        next = Math.min(next, Math.floor((bottom - pagerMin - lead - gridTop + rowGap) / pitch));
      }
      next = Math.max(LIST_MIN_PAGE_SIZE, next);
      if (next >= listSize) return;
      listSize = next;
      rebuild(selected);
    }
    function paint(focusCard = false) {
      page = Math.max(1, Math.min(pages, page));
      visible = single() ? records : records.slice(pageStart(page), pageEnd(page));
      if (!visible.some((item) => item.number === selected)) {
        selected = (visible.find(canDisclose) || visible[0] || {}).number;
      }
      frame.ui.page = page;
      grid.replaceChildren();
      grid.dataset.view = prefs.view;
      if (prefs.view === "list" || !records.length) {
        if (!records.length && allRecords.length) {
          const empty = document.createElement("p");
          empty.className = "legacyListEmpty";
          empty.setAttribute("role", "status");
          empty.textContent = archiveEmptyLine(prefs.filter);
          grid.appendChild(empty);
        }
        visible.forEach((item) => grid.appendChild(listRow(item)));
      } else {
      // r87 (transitions): the phone shows one card at a time, so only the cards near the selected Showdown are drawn;
      // the rest are light stand-ins (same class, hidden like any unselected phone card) drawn when they come near.
      const at = single() ? Math.max(0, visible.findIndex((item) => item.number === selected)) : 0;
      visible.forEach((item, index) => {
        grid.appendChild(single() && Math.abs(index - at) > PHONE_CARD_WINDOW ? standIn(item) : liveCard(item));
      });
      }
      // Codex #1103: the pager is built once per layout (phone or desktop) and kept while the cards change, so a scrubber
      // drag or a keyboard step on it is never cut short by its own element being replaced; select() updates it.
      const pagerKey = records.length ? (single() ? "phone:" + records.length : "desktop:" + pageSize + ":" + pages) : "empty";
      if (pagerKey !== pagerBuiltFor) {
      pagerBuiltFor = pagerKey;
      pager.replaceChildren();
      if (records.length) {
        const total = single() ? records.length : pages;
        // Up to 10 positions keep the dots; more use "‹ 37 / 100 ›", jumps to the oldest and newest Showdown and a
        // scrubber, so a career of hundreds of Showdowns is a few taps (or one drag) from end to end.
        const compact = total > 10;
        pager.dataset.compact = String(compact);
        let middle;
        if (compact) {
          middle = document.createElement("span");
          middle.className = "legacyPageCounter";
          middle.setAttribute("role", "status");
          middle.setAttribute("aria-live", "polite");
        } else {
          middle = document.createElement("span");
          middle.className = "legacyPageDots";
          middle.setAttribute("role", "img");
          // Indicators, not tiny controls: 44px arrows and swipe own navigation.
          Array.from({ length: total }, () => {
            const dot = document.createElement("span");
            dot.className = "legacyPageDot";
            dot.setAttribute("aria-hidden", "true");
            middle.appendChild(dot);
          });
        }
        const jump = (kind) => {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.jump = kind;
          button.className = "legacyPageJump";
          button.textContent = kind === "oldest" ? "«" : "»";
          button.setAttribute("aria-label", kind === "oldest" ? "Oldest Showdown" : "Newest Showdown");
          button.title = kind === "oldest" ? "Oldest" : "Newest";
          button.addEventListener("click", () => goTo(kind === "oldest" ? 1 : total));
          return button;
        };
        if (compact) pager.appendChild(jump("oldest"));
        [-1, 1].forEach((direction) => {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.direction = String(direction);
          button.textContent = direction < 0 ? "‹" : "›";
          button.setAttribute("aria-label", direction < 0 ? strings.ui.previous : strings.ui.next);
          button.addEventListener("click", () => step(direction));
          pager.appendChild(button);
          if (direction === -1) pager.appendChild(middle);
        });
        if (compact) {
          pager.appendChild(jump("newest"));
          const scrub = document.createElement("input");
          scrub.type = "range";
          scrub.className = "legacyPageScrub";
          scrub.min = "1";
          scrub.max = String(total);
          scrub.step = "1";
          scrub.setAttribute("aria-label", single() ? "Choose a Showdown" : "Choose an archive page");
          scrub.addEventListener("input", () => goTo(Number(scrub.value), false));
          pager.appendChild(scrub);
        }
      }
      }
      select(selected, single());
      if (focusCard) {
        const target = grid.querySelector('[data-selected="true"], [data-row-selected="true"]') || grid.querySelector("button");
        if (target) target.focus({ preventScroll: true });
      }
      // Measured once the new rows, pager and tools have laid out (two frames), so the fit sees the final page.
      dropFrame(fitFrame);
      fitFrame = nextFrame(() => { fitFrame = nextFrame(fitList); });
    }
    // r87 career fixes: one way to move for the arrows, the jumps, the scrubber, the keyboard and a swipe.
    function goTo(position, focusCard = true) {
      if (!records.length) return;
      if (single()) {
        const target = records[Math.max(0, Math.min(records.length - 1, position - 1))];
        if (target && target.number !== selected) select(target.number, true);
      } else {
        const next = Math.max(1, Math.min(pages, position));
        if (next === page) return;
        const direction = next > page ? 1 : -1;
        page = next;
        paint(focusCard);
        pageMotion(direction);
      }
    }
    function step(direction) {
      if (single()) {
        const index = records.findIndex((item) => item.number === selected);
        goTo(Math.max(0, index) + 1 + direction);
      } else goTo(page + direction);
    }
    // Desktop (and a phone with a keyboard): ← → step, Home / End jump to the oldest / newest. Never while typing, while
    // the season list is open, or when another screen shows.
    const onKey = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const host = document.getElementById("legacy");
      if (!host || host.classList.contains("hidden") || !host.contains(grid)) return;
      const t = event.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      const drawer = document.getElementById("legacySeasonHistory");
      if (drawer && !drawer.hidden) return;
      event.preventDefault();
      const total = single() ? records.length : pages;
      if (event.key === "Home") goTo(1);
      else if (event.key === "End") goTo(total);
      else step(event.key === "ArrowRight" ? 1 : -1);
    };
    if (typeof document.addEventListener === "function") document.addEventListener("keydown", onKey);
    // Phone: a sideways swipe on the card moves one Showdown (a mostly vertical drag still scrolls the page).
    let touch = null;
    const onTouchStart = (event) => { const p = event.changedTouches && event.changedTouches[0]; touch = p ? { x: p.clientX, y: p.clientY } : null; };
    const onTouchEnd = (event) => {
      const p = event.changedTouches && event.changedTouches[0];
      if (!touch || !p || !single()) { touch = null; return; }
      const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    };
    grid.addEventListener("touchstart", onTouchStart, { passive: true });
    grid.addEventListener("touchend", onTouchEnd, { passive: true });
    grid.addEventListener("scroll", () => {
      clearTimeout(settling);
      settling = setTimeout(() => {
        if (!single() || !grid.children.length) return;
        const index = Math.max(0, Math.min(records.length - 1, Math.round(grid.scrollLeft / Math.max(1, grid.clientWidth))));
        select(records[index].number);
      }, 100);
    }, { passive: true });
    grid.addEventListener("keydown", (event) => {
      if (!single() || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const index = records.findIndex((item) => item.number === selected);
      const next = records[Math.max(0, Math.min(records.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)))];
      if (next) {
        select(next.number, true);
        const target = grid.querySelector('[data-showdown="' + next.number + '"]');
        if (target.tagName === "BUTTON") target.focus({ preventScroll: true });
      }
    });
    const onPhoneChange = () => {
      placeTools();
      const index = Math.max(0, records.findIndex(item => item.number === selected));
      page = pageOf(index);
      paint();
    };
    phone.addEventListener("change", onPhoneChange);
    // A taller or shorter window re-fits the desktop list from the full page size.
    let refit = 0;
    const onListResize = () => {
      if (prefs.view !== "list" || phone.matches) return;
      dropFrame(refit);
      refit = nextFrame(() => { listSize = LIST_PAGE_SIZE; rebuild(selected); });
    };
    if (typeof window.addEventListener === "function") window.addEventListener("resize", onListResize);
    renderTools();
    window.LEGACY_BOOT.cleanup = () => { phone.removeEventListener("change", onPhoneChange); if (typeof window.removeEventListener === "function") window.removeEventListener("resize", onListResize); dropFrame(refit); dropFrame(fitFrame); cancelAnimationFrame(fitFrame); clearTimeout(settling); if (typeof document.removeEventListener === "function") document.removeEventListener("keydown", onKey); if (typeof grid.removeEventListener === "function") { grid.removeEventListener("touchstart", onTouchStart); grid.removeEventListener("touchend", onTouchEnd); } };
    paint();
  }

  function applyFrameState(frame, strings) {
    const banner = document.getElementById("legacyStateBanner");
    const preview = document.getElementById("legacyPreviewTag");
    banner.replaceChildren();
    banner.hidden = true;
    banner.dataset.compact = String(frame.status === "partial" || !!frame.interimLabel);
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

  function mountNavigation() {
    document.getElementById("legacySideMenu").addEventListener("click", event => {
      const button = event.target.closest("button[data-route]");
      if (button && button.dataset.route !== "legacy") window.openOptionalModule?.(button.dataset.route);
    });
  }

  function boot() {
    const fixtures = window.LEGACY_BOOT.fixtures;
    const platemap = window.LEGACY_BOOT.platemap;
    const frameId = "LIVE", frame = fixtures.frames.LIVE;
    screenStrings = fixtures.strings;

    registerManagerBoxes(platemap);
    const stageController = ShowdownStage.mount(stage, {
      plate: {
        width: 1672,
        height: 941,
        src1x: "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp",
        src2x: "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp"
      },
      focal: { x: 836, y: 470.5 },
      platemap
    });

    stage.dataset.frame = frameId;
    frameLabel.textContent = frameId;
    document.getElementById("fixtureEyebrow").textContent = fixtures.strings.eyebrow;
    document.getElementById("legacyHeadingText").textContent = fixtures.strings.heading;
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
    mountNavigation();
    applyFrameState(frame, fixtures.strings);
    renderArchive(frame, fixtures.strings);
    const historyAction = document.getElementById("viewSeasonHistory");
    const actionLabel = document.createElement("span");
    actionLabel.className = "legacyActionLabel";
    actionLabel.dataset.sdEnter = "button";
    actionLabel.style.display = "inline-block";
    actionLabel.textContent = fixtures.strings.actions.viewSeasonHistory;
    historyAction.replaceChildren(actionLabel);
    historyAction.dataset.route = "viewSeasonHistory";
    const selectedRecord = (frame.showdowns || []).find((item) => item.number === (frame.ui && frame.ui.selectedShowdown));
    historyAction.disabled = !canDisclose(selectedRecord);
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
    // r87 (transitions): the live frame is not copied into the hidden debug section. With hundreds of Showdowns it built
    // ~140k hidden elements and made History slow to open and to page through.

    window.LegacyFixture = { fixtures, frameId, frame, platemap, stageController, selectedShowdown: frame.ui && frame.ui.selectedShowdown };
    // The optional screen owns this entrance; all controls are already wired.
    if (typeof window.sdEnter === "function") window.sdEnter(stage);
    dealCards(true);
  }

  try { boot(); } catch (error) {
    stage.dataset.frame = "error";
    stage.dataset.frameState = "unavailable";
    const banner = document.getElementById("legacyStateBanner");
    banner.replaceChildren();
    banner.dataset.compact = "false";
    const copy = document.createElement("p");
    copy.className = "legacyStateCopy";
    // Honest fallback for a renderer failure.
    copy.textContent = screenStrings?.ui.unavailableFallback || "Your Showdown history could not be loaded.";
    banner.appendChild(copy);
    banner.hidden = false;
    document.getElementById("fixtureEyebrow").textContent = screenStrings?.eyebrow || "CAREER MODE SHOWDOWN 17";
    document.getElementById("viewSeasonHistory").textContent = screenStrings?.actions.viewSeasonHistory || "VIEW SEASON HISTORY";
    document.getElementById("viewSeasonHistory").disabled = true;
    document.getElementById("legacyCardGrid").replaceChildren();
    document.getElementById("legacyPager").replaceChildren();
    frameLabel.textContent = copy.textContent;
    valuesRoot.textContent = error.message;
  }
};


