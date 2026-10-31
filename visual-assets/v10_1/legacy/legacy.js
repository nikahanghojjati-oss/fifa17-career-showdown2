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
    // r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 110 points.
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
        side.appendChild(cell("span", "legacyHistoryDetail", copy(strings, "seasonDetail", { position: season.leaguePosition[manager], points: season.leaguePoints[manager], goals: season.leagueGoals[manager] })));
        // r80: a season row names a Europa League win (the career season row carries it only for such a season).
        if (season.europaLeague && season.europaLeague[manager] === true) side.appendChild(cell("span", "legacyHistoryEuropa", ui.europaLeague || "Europa League winner"));
        row.appendChild(side);
      });
      const result = cell("td", "legacyHistoryResult");
      result.appendChild(cell("span", "legacyHistoryMark", winner === "draw" ? "=" : "\u265B")).setAttribute("aria-hidden", "true");
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

  function renderArchive(frame, strings) {
    const grid = document.getElementById("legacyCardGrid");
    const pager = document.getElementById("legacyPager");
    const action = document.getElementById("viewSeasonHistory");
    const phone = window.matchMedia("(max-width: 900px)");
    frame.ui = frame.ui || {};
    let page = Math.max(1, Number(frame.ui.page) || 1);
    const records = frame.showdowns || [];
    const pageSize = Math.max(1, Number(frame.ui.pageSize) || 4);
    const pages = Math.max(1, Math.ceil(records.length / pageSize));
    let selected = frame.ui.selectedShowdown;
    let visible = [];
    let settling = 0;

    function select(number, scroll = false) {
      const previousIndex = records.findIndex(item => item.number === selected);
      const changed = number !== selected;
      selected = number;
      frame.ui.selectedShowdown = selected;
      if (window.LegacyFixture) window.LegacyFixture.selectedShowdown = selected;
      const record = records.find((item) => item.number === selected);
      action.disabled = !canDisclose(record);
      closeHistory();
      grid.querySelectorAll(".legacyCard").forEach((card) => {
        const active = Number(card.dataset.showdown) === selected;
        card.dataset.selected = String(active && canDisclose(record));
        if (card.tagName === "BUTTON") card.setAttribute("aria-pressed", String(active));
        if (active && scroll) grid.scrollLeft = Array.from(grid.children).indexOf(card) * grid.clientWidth;
      });
      const index = records.findIndex((item) => item.number === selected);
      const prev = pager.querySelector('[data-direction="-1"]');
      const next = pager.querySelector('[data-direction="1"]');
      if (prev) prev.disabled = phone.matches ? index <= 0 : page <= 1;
      if (next) next.disabled = phone.matches ? index >= records.length - 1 : page >= pages;
      const currentPage = phone.matches ? Math.max(0, index) + 1 : page;
      frame.ui.page = currentPage;
      // r87 career fixes (Nik 2026-10-31): long careers use a compact counter and a scrubber instead of one dot per item.
      const total = phone.matches ? records.length : pages;
      const counter = pager.querySelector(".legacyPageCounter");
      if (counter) {
        const firstShown = (page - 1) * pageSize + 1, lastShown = Math.min(records.length, page * pageSize);
        counter.textContent = phone.matches ? currentPage + " / " + total : (firstShown === lastShown ? String(firstShown) : firstShown + "–" + lastShown) + " / " + records.length;
        counter.setAttribute("aria-label", copy(strings, "page", { number: currentPage, total }));
      }
      const scrub = pager.querySelector(".legacyPageScrub");
      if (scrub) { scrub.value = String(currentPage); scrub.setAttribute("aria-valuetext", copy(strings, "page", { number: currentPage, total })); }
      const oldest = pager.querySelector('[data-jump="oldest"]'), newest = pager.querySelector('[data-jump="newest"]');
      if (oldest) oldest.disabled = currentPage <= 1;
      if (newest) newest.disabled = currentPage >= total;
      const dots = pager.querySelector(".legacyPageDots");
      if (dots) {
        dots.setAttribute("aria-label", copy(strings, "page", { number: currentPage, total: phone.matches ? records.length : pages }));
        dots.querySelectorAll(".legacyPageDot").forEach((dot, dotIndex) => {
          dot.dataset.active = String(dotIndex + 1 === currentPage);
        });
      }
      if (phone.matches && changed) pageMotion(index > previousIndex ? 1 : -1, scroll);
    }

    function paint(focusCard = false) {
      page = Math.max(1, Math.min(pages, page));
      visible = phone.matches ? records : records.slice((page - 1) * pageSize, page * pageSize);
      if (!visible.some((item) => item.number === selected)) {
        selected = (visible.find(canDisclose) || visible[0] || {}).number;
      }
      frame.ui.page = page;
      grid.replaceChildren();
      visible.forEach((item) => {
        const card = renderCard(item, selected, strings);
        card.addEventListener("click", () => select(item.number));
        grid.appendChild(card);
      });
      pager.replaceChildren();
      if (records.length) {
        const total = phone.matches ? records.length : pages;
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
          scrub.setAttribute("aria-label", phone.matches ? "Choose a Showdown" : "Choose an archive page");
          scrub.addEventListener("input", () => goTo(Number(scrub.value), false));
          pager.appendChild(scrub);
        }
      }
      select(selected, phone.matches);
      if (focusCard) {
        const target = grid.querySelector('[data-selected="true"]') || grid.querySelector("button");
        if (target) target.focus({ preventScroll: true });
      }
    }
    // r87 career fixes: one way to move for the arrows, the jumps, the scrubber, the keyboard and a swipe.
    function goTo(position, focusCard = true) {
      if (!records.length) return;
      if (phone.matches) {
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
      if (phone.matches) {
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
      const total = phone.matches ? records.length : pages;
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
      if (!touch || !p || !phone.matches) { touch = null; return; }
      const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    };
    grid.addEventListener("touchstart", onTouchStart, { passive: true });
    grid.addEventListener("touchend", onTouchEnd, { passive: true });
    grid.addEventListener("scroll", () => {
      clearTimeout(settling);
      settling = setTimeout(() => {
        if (!phone.matches || !grid.children.length) return;
        const index = Math.max(0, Math.min(records.length - 1, Math.round(grid.scrollLeft / Math.max(1, grid.clientWidth))));
        select(records[index].number);
      }, 100);
    }, { passive: true });
    grid.addEventListener("keydown", (event) => {
      if (!phone.matches || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
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
      const index = Math.max(0, records.findIndex(item => item.number === selected));
      page = Math.floor(index / pageSize) + 1;
      paint();
    };
    phone.addEventListener("change", onPhoneChange);
    window.LEGACY_BOOT.cleanup = () => { phone.removeEventListener("change", onPhoneChange); clearTimeout(settling); if (typeof document.removeEventListener === "function") document.removeEventListener("keydown", onKey); if (typeof grid.removeEventListener === "function") { grid.removeEventListener("touchstart", onTouchStart); grid.removeEventListener("touchend", onTouchEnd); } };
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
    renderObject(valuesRoot, frame);

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


