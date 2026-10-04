/* Trophy Room desktop visual build · JOB-057 */
(function () {
  "use strict";

  const TROPHIES = [
    { key: "showdown", category: "SHOWDOWN", asset: "../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp", value: f => f.showdowns },
    { key: "leagueTitles", category: "LEAGUE TITLES", asset: "../shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp", value: f => f.managers && ({daniel:f.managers.daniel.leagueTitles, nik:f.managers.nik.leagueTitles}) },
    { key: "domesticCups", category: "DOMESTIC CUPS", asset: "../shared/trophies/TRO_DOMESTIC_CUP_V1_512.webp", value: f => f.managers && ({daniel:f.managers.daniel.domesticCups, nik:f.managers.nik.domesticCups}) },
    { key: "championsLeague", category: "CHAMPIONS LEAGUE", asset: "../shared/trophies/TRO_CONTINENTAL_V1_512.webp", value: f => f.managers && ({daniel:f.managers.daniel.championsLeagues, nik:f.managers.nik.championsLeagues}) }
  ];

  const state = { fixtures:null, frame:null, frameKey:"TR1", map:null, activeCategory:"ALL", stage:null };
  const qs = new URLSearchParams(location.search);
  state.frameKey = qs.get("frame") || "TR1";

  const esc = value => String(value == null ? "" : value).replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function collectStrings(value, out) {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach(v => collectStrings(v, out));
    return out;
  }

  function trophyCounts(trophy, frame) {
    if (trophy.key === "showdown") {
      return frame.showdowns ? { daniel:frame.showdowns.daniel.wins, nik:frame.showdowns.nik.wins } : null;
    }
    return trophy.value(frame) || null;
  }

  function picture(asset, alt, cls) {
    return `<picture class="${cls || ""}"><source type="image/webp" srcset="${asset}"><img src="${asset}" alt="${esc(alt)}" decoding="async"></picture>`;
  }

  function managerMarkers() {
    return `<span class="managerRegistration managerRegistration--daniel" data-manager="daniel"></span><span class="managerRegistration managerRegistration--nik" data-manager="nik"></span>`;
  }

  function titleBlock(strings) {
    return `<header class="trophyTitleBlock" data-sd-enter="title"><p class="sd-eyebrow trophyEyebrow">CAREER MODE SHOWDOWN 17</p><h2 id="trophyRoomScreenTitle" class="visually-hidden" tabindex="-1" data-route-focus-target="true">${esc(strings.heading)}</h2><img class="trophyBrushTitle" src="assets/TITLE_TR_V1.webp" alt="" aria-hidden="true"><p class="sd-tagline trophyTagline">TWO MANAGERS. ONE LEGACY.</p></header>`;
  }

  function ranking(frame) {
    if (!frame.managers || !frame.standings) return "";
    const rows = ["daniel","nik"].map(manager => {
      const s = frame.standings.find(x => x.manager === manager);
      const m = frame.managers[manager];
      if (!s || !m) return "";
      return `<div class="careerRank careerRank--${manager}" data-rank-manager="${manager}"><strong>${esc(s.rank)}</strong><span>${esc(m.displayName)}</span><b>${m.careerPoints}</b><small>CAREER POINTS · ${m.seasonWins} SEASON WINS</small></div>`;
    }).join("");
    return `<div class="careerRanks" data-sd-enter="panel" aria-label="Career standings">${rows}</div>`;
  }

  function hero(strings, frame) {
    const active = TROPHIES[0];
    const dim = frame.status === "loading" || frame.status === "unavailable";
    return `<div class="heroCeremony ${dim ? "is-muted" : ""}" data-sd-enter="panel" aria-hidden="${dim ? "true" : "false"}"><div class="heroSpotlight"></div>${picture(active.asset, strings.trophyTypes.showdown, "heroTrophyPicture")}<div class="heroReflection"></div><div class="heroPlinth"><span>${esc(strings.trophyTypes.showdown.toUpperCase())}</span><small>CAREER MODE SHOWDOWN</small></div></div>`;
  }

  function tabs(strings, frame) {
    const disabled = frame.status === "loading" || frame.status === "unavailable";
    return `<div class="trophyTabs" role="tablist" aria-label="Trophy category">${strings.categories.map(category => `<button type="button" class="trophyTab ${state.activeCategory === category ? "is-active" : ""}" role="tab" aria-selected="${state.activeCategory === category}" data-category="${esc(category)}" ${disabled ? "disabled" : ""}>${esc(category)}</button>`).join("")}</div>`;
  }

  function trophyCard(trophy, strings, frame) {
    const counts = trophyCounts(trophy, frame);
    const empty = counts && counts.daniel === 0 && counts.nik === 0;
    const dName = frame.managers?.daniel?.displayName || "Daniel";
    const nName = frame.managers?.nik?.displayName || "Nik";
    const left = counts ? (counts.daniel === 0 ? "—" : `×${counts.daniel}`) : "—";
    const right = counts ? (counts.nik === 0 ? "—" : `×${counts.nik}`) : "—";
    return `<article class="trophyCard ${empty ? "is-unwon" : ""}" data-trophy="${trophy.key}"><div class="trophyCardGlow"></div>${picture(trophy.asset, strings.trophyTypes[trophy.key], "trophyCardPicture")}<h3>${esc(strings.trophyTypes[trophy.key])}</h3><div class="managerCounts"><div data-side="daniel"><span>${esc(dName)}</span><strong>${esc(left)}</strong></div><div data-side="nik"><span>${esc(nName)}</span><strong>${esc(right)}</strong></div></div>${empty ? `<p class="notWonYet">${esc(strings.notWonYet)}</p>` : ""}</article>`;
  }

  function recordRibbon(strings, frame) {
    if (!Array.isArray(frame.records) || !frame.records.length) return "";
    const heading = frame.status === "partial" ? strings.stateCopy.partialRecordsHeading.text : strings.recordsReadyHeading;
    return `<div class="recordRibbon" data-sd-enter="panel" aria-label="${esc(heading)}"><span class="recordRibbonHeading">${esc(heading)}</span>${frame.records.map(record => {
      const manager = record.manager === "shared" ? "Shared" : (frame.managers?.[record.manager]?.displayName || record.manager);
      return `<div class="recordItem"><small>${esc(record.label)}</small><strong>${esc(record.value)}</strong><span>${esc(manager)}</span></div>`;
    }).join("")}</div>`;
  }

  function statePanel(strings, frame) {
    if (frame.status === "loading") return `<div class="statePanel statePanel--loading" data-sd-enter="panel"><i class="stateGlyph" aria-hidden="true"></i><strong>${esc(strings.stateCopy.loading.text)}</strong></div>`;
    if (frame.status === "unavailable") return `<div class="statePanel statePanel--unavailable" data-sd-enter="panel"><i class="stateGlyph" aria-hidden="true">!</i><strong>${esc(strings.stateCopy.unavailable.text)}</strong></div>`;
    if (frame.status === "partial") return `<div class="stateNotice" data-sd-enter="panel"><span class="stateNoticeIcon" aria-hidden="true">!</span><span>${esc(frame.stateMessage || strings.stateCopy.partial.text.replace("{READABLE}", frame.coverage.readable).replace("{INDEXED}", frame.coverage.indexed))}</span><b>${frame.coverage.readable} of ${frame.coverage.indexed} Showdowns readable</b></div>`;
    return "";
  }

  function shelf(strings, frame) {
    const noData = frame.status === "loading" || frame.status === "unavailable";
    const chosen = state.activeCategory === "ALL" ? TROPHIES : TROPHIES.filter(t => t.category === state.activeCategory);
    return `<section class="trophyShelf ${chosen.length === 1 ? "is-filtered" : ""}" data-sd-enter="panel" aria-label="${esc(strings.managerCabinetsHeading)}">${tabs(strings, frame)}<div class="shelfGlass"><div class="shelfTopEdge"></div>${statePanel(strings, frame)}${noData ? "" : `<div class="trophyGrid">${chosen.map(t => trophyCard(t, strings, frame)).join("")}</div>${recordRibbon(strings, frame)}`}</div></section>`;
  }

  function back(strings) {
    return `<button id="trophyRoomBack" type="button" class="backButton trophyBack" data-primary-action data-sd-enter="button">${esc(strings.back)}</button>`;
  }

  function render() {
    const frame = state.frame;
    const strings = state.fixtures.strings;
    const content = document.getElementById("trophyRoomContent");
    const preview = frame.previewLabel || strings.previewLabel;
    const fixtureMirror = [...new Set(collectStrings(strings, []).concat(collectStrings(frame, [])))].join(" · ");
    content.innerHTML = `${managerMarkers()}<div class="topbarReserve" aria-hidden="true"></div><div class="previewPill">${esc(preview)}</div>${titleBlock(strings)}${ranking(frame)}${hero(strings, frame)}${shelf(strings, frame)}${back(strings)}<div class="fixtureContract" hidden>${esc(fixtureMirror)}</div><div class="phoneNavReserve" aria-hidden="true"></div>`;
    content.dataset.state = frame.status;
    content.dataset.frame = state.frameKey;
    content.dataset.category = state.activeCategory;

    content.querySelectorAll(".trophyTab").forEach(btn => btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      state.activeCategory = category;
      render();
      const activeTab = [...document.querySelectorAll("#trophyRoomContent .trophyTab")].find(tab => tab.dataset.category === category);
      if (activeTab) activeTab.focus();
    }));
    const backButton = document.getElementById("trophyRoomBack");
    backButton.addEventListener("click", () => document.dispatchEvent(new CustomEvent("trophy-room:intent", { detail:{ route:"back" } })));
  }

  async function boot() {
    const [fixturesRes, mapRes] = await Promise.all([fetch("fixtures.json", {cache:"no-store"}), fetch("assets/platemap.json", {cache:"no-store"})]);
    if (!fixturesRes.ok || !mapRes.ok) throw new Error("Trophy Room fixture or plate map failed to load");
    state.fixtures = await fixturesRes.json();
    state.map = await mapRes.json();
    state.frame = state.fixtures.frames[state.frameKey] || state.fixtures.frames.TR1;
    state.activeCategory = state.frame.activeCategory || "ALL";
    state.stage = window.ShowdownStage.mount(document.querySelector(".trophyRoomScene"), {
      plate:{ width:1672, height:941, src1x:"../trophy-room/assets/ENV_TR_PLATE_V1_1X.webp", src2x:"../trophy-room/assets/ENV_TR_PLATE_V1_2X.webp" },
      focal:{ x:state.map.focal[0], y:state.map.focal[1] },
      platemap:state.map,
      dustCount:22,
      phoneBandRatio:.45
    });
    render();
    const root = document.getElementById("trophyRoom");
    if (typeof window.sdEnter === "function") window.sdEnter(root);
    document.documentElement.dataset.trophyReady = "1";
    window.__trophyRoomReady = true;
    window.__trophyRoomFrame = state.frame;
  }

  boot().catch(err => {
    console.error(err);
    const content = document.getElementById("trophyRoomContent");
    if (content) content.innerHTML = `<div class="fatalState">Career history is unavailable right now.</div>`;
  });
})();
