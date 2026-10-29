// JOB-072 · Legacy fixture scaffold + registered cinematic stage.
(function () {
  "use strict";

  const stage = document.getElementById("stage-root");
  const valuesRoot = document.getElementById("fixtureValues");
  const stringsRoot = document.getElementById("fixtureStrings");
  const frameLabel = document.getElementById("fixtureFrameLabel");

  // Signature-only timing; the shared kit continues to own entrance timing.
  const LEGACY_MOTION = Object.freeze({ deal: 400, stagger: 50, crown: 220,
    page: 280, parallax: 320, fade: 150, ease: "cubic-bezier(.22,1,.36,1)" });
  const motionTimers = new WeakMap();
  function reducedMotion() {
    let app = false;
    try {
      app = !!(window.isReducedMotionPreferred?.() ||
        window.getApplicationMotionPreferenceState?.()?.effectiveReduced ||
        JSON.parse(localStorage.getItem("careerModeShowdown.preferences") || "{}").reducedMotion);
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
        identityMark(league, window.getLeagueMark(showdown.leagueId)?.svg, true);
        const numbers = document.createElement("span");
        numbers.className = "legacyScore";
        numbers.textContent = showdown.totals ? copy(strings, "score", showdown.totals) : "";
        const crown = document.createElement("span");
        crown.className = "legacyWinner";
        const finalResult = ["completed", "completion-pending"].includes(showdown.status);
        const winner = finalResult ? showdown.winner : "";
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
    card.append(title, body, footer);
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
    close.className = "sd-btn";
    close.textContent = strings.ui.close;
    close.style.cssText = "position:sticky;top:0;z-index:2;min-height:44px;min-width:44px;background:#0d0f13;color:#f4f1ea";
    close.addEventListener("click", () => closeHistory(true));
    const heading = document.createElement("h2");
    heading.id = "legacyHistoryHeading";
    heading.className = "legacyHistoryHeading sd-label";
    heading.textContent = copy(strings, "historyHeading", { showdown: copy(strings, "showdown", { number: showdown.number }), action: strings.actions.viewSeasonHistory });
    const rows = document.createElement("div");
    rows.className = "legacyHistoryRows";
    showdown.seasons.forEach((season) => {
      const row = document.createElement("div");
      row.className = "legacyHistoryRow";
      const label = document.createElement("span");
      label.textContent = copy(strings, "season", { number: season.season });
      row.appendChild(label);
      ["daniel", "nik"].forEach((manager, index) => {
        if (index) {
          const divider = document.createElement("span");
          divider.textContent = "–";
          row.appendChild(divider);
        }
        const side = document.createElement("span");
        side.className = manager;
        side.textContent = copy(strings, "managerScore", { manager: strings.ui.managers[manager], score: season.score[manager] });
        const detail = document.createElement("span");
        detail.style.cssText = "display:block;line-height:1.4;color:#b9b3a4";
        detail.textContent = copy(strings, "seasonDetail", { position: season.leaguePosition[manager], points: season.leaguePoints[manager], goals: season.leagueGoals[manager] });
        side.appendChild(detail);
        row.appendChild(side);
      });
      rows.appendChild(row);
    });
    drawer.append(close, heading, rows);
    drawer.onkeydown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeHistory(true); }
    };
    drawer.hidden = false;
    action.setAttribute("aria-expanded", "true");
    close.focus();
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
        const dots = document.createElement("span");
        dots.className = "legacyPageDots";
        dots.setAttribute("role", "img");
        // Indicators, not tiny controls: 44px arrows and swipe own navigation.
        Array.from({ length: phone.matches ? records.length : pages }, () => {
          const dot = document.createElement("span");
          dot.className = "legacyPageDot";
          dot.setAttribute("aria-hidden", "true");
          dots.appendChild(dot);
        });
        [-1, 1].forEach((direction) => {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.direction = String(direction);
          button.textContent = direction < 0 ? "‹" : "›";
          button.setAttribute("aria-label", direction < 0 ? strings.ui.previous : strings.ui.next);
          button.addEventListener("click", () => {
            if (phone.matches) {
              const index = records.findIndex((item) => item.number === selected);
              select(records[Math.max(0, Math.min(records.length - 1, index + direction))].number, true);
            } else {
              page = Math.max(1, Math.min(pages, page + direction));
              paint(true);
              pageMotion(direction);
            }
          });
          pager.appendChild(button);
          if (direction === -1) pager.appendChild(dots);
        });
      }
      select(selected, phone.matches);
      if (focusCard) {
        const target = grid.querySelector('[data-selected="true"]') || grid.querySelector("button");
        if (target) target.focus({ preventScroll: true });
      }
    }
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
    phone.addEventListener("change", () => {
      const index = Math.max(0, records.findIndex(item => item.number === selected));
      page = Math.floor(index / pageSize) + 1;
      paint();
    });
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

  function loadScreenResource(path, stylesheet = false) {
    return new Promise((resolve, reject) => {
      const node = document.createElement(stylesheet ? "link" : "script");
      if (stylesheet) { node.rel = "stylesheet"; node.href = path; }
      else { node.src = path; node.async = true; }
      node.onload = resolve;
      node.onerror = () => reject(new Error("Screen resource unavailable"));
      document.head.appendChild(node);
    });
  }

  async function mountNavigation() {
    const routes = {
      home: "../home/index.html", career: "../start-join/index.html",
      standings: "../standings/index.html", stats: "../career-statistics/index.html",
      rules: "../rule-book/index.html", settings: "../settings/index.html",
      legacy: "./index.html", trophyRoom: "../trophy-room/index.html",
      careerStatistics: "../career-statistics/index.html"
    };
    const hostRoutes = { home: "mainMenu", career: "startJoin", standings: "standings",
      stats: "careerStatistics", rules: "ruleBook", settings: "settings",
      legacy: "legacy", trophyRoom: "trophyRoom", careerStatistics: "careerStatistics" };
    function navigate(key) {
      if (!routes[key]) return;
      if (typeof window.openOptionalModule === "function" &&
          ["trophyRoom", "careerStatistics", "legacy"].includes(hostRoutes[key])) {
        window.openOptionalModule(hostRoutes[key]);
      } else if (typeof window.showScreen === "function" && document.getElementById(hostRoutes[key])) {
        window.showScreen(hostRoutes[key]);
      } else { window.location.href = routes[key]; }
    }
    document.documentElement.dataset.nav = "hub";
    document.querySelectorAll("#legacyTopNav button").forEach((button) => button.classList.add("topBarTab"));
    document.getElementById("legacySettings").classList.add("topBarSettings");
    document.querySelector(".nav-reserve").style.pointerEvents = "auto";
    await Promise.all([
      loadScreenResource("../shared/navbar/navbar.css", true),
      window.SDNav ? Promise.resolve() : loadScreenResource("../shared/navbar/navbar.js")
    ]);
    window.SDNav.mount({ active: "career", locked: false, routes,
      adopt: ".legacyTopbar", onNavigate: navigate });
    document.getElementById("legacySideMenu").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-route]");
      if (button) navigate(button.dataset.route);
    });
  }

  async function boot() {
    const [fixtureResponse, mapResponse] = await Promise.all([
      fetch("./fixtures.json", { cache: "no-store" }),
      fetch("./assets/platemap.json", { cache: "no-store" })
    ]);
    if (!fixtureResponse.ok) throw new Error("fixtures.json " + fixtureResponse.status);
    if (!mapResponse.ok) throw new Error("platemap.json " + mapResponse.status);

    const fixtures = await fixtureResponse.json();
    screenStrings = fixtures.strings;
    if (!window.getClubCrestSvg || !window.getLeagueMark) await loadScreenResource("../../../js/visualIdentity.js");
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
    await mountNavigation();
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

  boot().catch((error) => {
    stage.dataset.frame = "error";
    stage.dataset.frameState = "unavailable";
    const banner = document.getElementById("legacyStateBanner");
    banner.replaceChildren();
    banner.dataset.compact = "false";
    const copy = document.createElement("p");
    copy.className = "legacyStateCopy";
    // Bootstrap fallback must remain available even when fixtures.json cannot be read.
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
  });
}());


