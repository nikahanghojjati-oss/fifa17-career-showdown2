// STANDINGS-V1 · fixture-driven screen on the shared registered stage.
// ?frame=SD1..SD9 picks a fixture frame; the toggle only changes the projection (no gameplay, no extra reads).
(() => {
  "use strict";

  const qs = new URLSearchParams(window.STANDINGS_QS || location.search);
  const stage = document.getElementById("stage-root");
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value == null ? "" : String(value); };
  const fill = (tpl, values) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (values[k] == null ? m : values[k]));
  const crest = (club) => (window.getClubCrestSvg ? window.getClubCrestSvg(club || "") : "");

  const SCOPE_ROWS = ["seasonWins", "seasonDraws", "seasonLosses", "championsLeagues", "leagueTitles", "domesticCups", "totalTrophies"];
  const PLATE = {
    width: 1672, height: 941,
    src1x: "../rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp",
    src2x: "../rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp"
  };

  let FX = null, frameId = null, stageHandle = null;

  function mountStage(platemap) {
    if (!window.ShowdownStage || stageHandle) return;
    stageHandle = window.ShowdownStage.mount(stage, {
      plate: PLATE,
      platemap,
      focal: { x: 836, y: 470.5 },
      dustCount: 24,
      phoneBandRatio: .46
    });
  }

  // Leader rules (TRUTH.md): This Showdown = higher score only; Career = careerPoints, then seasonWins; otherwise Level.
  function leaderText(S, view, m, interim) {
    if (m.status === "loading" || m.status === "unavailable" || m.status === "partial") return "";
    const nameOf = (side) => S.managers[side];
    if (view === "this-showdown" || interim) {
      const a = m.score && m.score.daniel, b = m.score && m.score.nik;
      if (typeof a !== "number" || typeof b !== "number") return "";
      if (a === b) return S.level;
      return fill(S.leaderTemplate, { manager: nameOf(a > b ? "daniel" : "nik") });
    }
    const d = m.standings && m.standings.daniel, n = m.standings && m.standings.nik;
    if (!d || !n) return "";
    if (d.careerPoints !== n.careerPoints) return fill(S.leaderTemplate, { manager: nameOf(d.careerPoints > n.careerPoints ? "daniel" : "nik") });
    if (d.seasonWins !== n.seasonWins) return fill(S.leaderSeasonWinsTemplate, { manager: nameOf(d.seasonWins > n.seasonWins ? "daniel" : "nik") });
    return S.level;
  }

  function leaderSide(m, view, interim) {
    if (m.status !== "ready" && m.status !== "empty") return null;
    let a, b, a2, b2;
    if (view === "this-showdown" || interim) { a = m.score && m.score.daniel; b = m.score && m.score.nik; }
    else {
      const d = m.standings && m.standings.daniel, n = m.standings && m.standings.nik;
      if (!d || !n) return null;
      a = d.careerPoints; b = n.careerPoints; a2 = d.seasonWins; b2 = n.seasonWins;
    }
    if (typeof a !== "number" || typeof b !== "number") return null;
    if (a !== b) return a > b ? "daniel" : "nik";
    if (a2 !== b2 && typeof a2 === "number") return a2 > b2 ? "daniel" : "nik";
    return null;
  }

  function recordsFor(view, m, interim) {
    if (view === "this-showdown" || interim) return m.managerRecords || null;
    return m.standings && m.standings.daniel ? m.standings : null;
  }

  function render() {
    const S = FX.strings, f = FX.frames[frameId], m = f.model || {};
    const interim = !!m.interimLabel && f.view === "career";
    const view = f.view;
    const hasNumbers = m.status === "ready" || m.status === "partial" || (m.status === "empty" && (m.score || (m.standings && m.standings.daniel)));
    const showScope = view === "this-showdown" || interim;

    stage.dataset.frame = frameId;
    stage.dataset.view = view;
    stage.dataset.status = m.status || "";
    document.documentElement.dataset.frame = frameId;

    text("sdgPreview", f.previewLabel || S.previewLabel);
    text("sdgHeading", S.heading);

    const tShow = $("sdgViewShowdown"), tCareer = $("sdgViewCareer");
    tShow.textContent = S.viewThisShowdown;
    tCareer.textContent = S.viewCareer;
    [[tShow, "this-showdown"], [tCareer, "career"]].forEach(([el, v]) => {
      const on = view === v;
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
    });

    let section = view === "career" ? S.sectionCareer : S.sectionThisShowdown;
    if (m.status === "partial") section = S.sectionPartial;
    if (interim) section = S.sectionInterim;
    text("sdgSection", section);

    const prog = $("sdgProgress");
    prog.hidden = !(showScope && m.season && m.totalSeasons);
    prog.textContent = prog.hidden ? "" : fill(S.seasonTemplate, { season: m.season, totalSeasons: m.totalSeasons });

    const interimEl = $("sdgInterim");
    interimEl.hidden = !interim;
    interimEl.textContent = interim ? m.interimLabel : "";

    const cov = $("sdgCoverage");
    cov.hidden = !(m.status === "partial" && m.coverage);
    cov.textContent = cov.hidden ? "" : S.partial + " " + fill(S.coverageTemplate, m.coverage);

    text("sdgNameDaniel", S.managers.daniel);
    text("sdgNameNik", S.managers.nik);
    const clubs = (showScope && m.clubs) || {};
    text("sdgClubDaniel", clubs.daniel || "");
    text("sdgClubNik", clubs.nik || "");
    $("sdgCrestDaniel").innerHTML = clubs.daniel ? crest(clubs.daniel) : "";
    $("sdgCrestNik").innerHTML = clubs.nik ? crest(clubs.nik) : "";

    // Headline numbers.
    const recs = recordsFor(view, m, interim);
    let a = "", b = "", label = showScope ? S.fields.score : S.fields.careerPoints;
    if (hasNumbers) {
      if (showScope && m.score) { a = m.score.daniel; b = m.score.nik; }
      else if (!showScope && m.standings && m.standings.daniel) { a = m.standings.daniel.careerPoints; b = m.standings.nik.careerPoints; }
    }
    text("sdgScoreLabel", label);
    text("sdgScoreDaniel", a === "" ? "—" : a);
    text("sdgScoreNik", b === "" ? "—" : b);
    const lead = leaderSide(m, view, interim);
    const hideLeader = m.status === "partial";
    $("sdgScoreDaniel").classList.toggle("is-leader", !hideLeader && lead === "daniel");
    $("sdgScoreNik").classList.toggle("is-leader", !hideLeader && lead === "nik");
    text("sdgLeader", hasNumbers ? leaderText(S, view, m, interim) : "");
    $("sdgScoreboard").hidden = !hasNumbers;

    // Detail rows.
    const rows = $("sdgRows");
    rows.replaceChildren();
    if (hasNumbers && recs) {
      SCOPE_ROWS.forEach((key) => {
        const row = document.createElement("div");
        row.className = "sdg-row";
        row.dataset.field = key;
        const l = document.createElement("span"), mid = document.createElement("span"), r = document.createElement("span");
        l.className = "sdg-val sdg-val--daniel"; r.className = "sdg-val sdg-val--nik"; mid.className = "sdg-label";
        l.textContent = recs.daniel[key]; r.textContent = recs.nik[key]; mid.textContent = S.fields[key];
        row.append(l, mid, r);
        rows.appendChild(row);
      });
    }
    rows.hidden = !rows.children.length;

    // Availability copy for states without numbers, and the new-career / first-season messages.
    let msg = "";
    if (m.status === "loading") msg = S.loading;
    else if (m.status === "unavailable") msg = S.unavailable;
    else if (m.status === "empty") {
      if (m.score) msg = S.emptySeason;
      else msg = view === "career" ? S.emptyCareer : S.emptyShowdown;
    }
    const state = $("sdgState");
    state.hidden = !msg;
    state.textContent = msg;
    state.dataset.status = m.status || "";
  }

  function pickFrameFor(view) {
    const ids = Object.keys(FX.frames);
    return ids.find((id) => FX.frames[id].view === view && FX.frames[id].model.status === "ready" && !FX.frames[id].model.interimLabel) || ids[0];
  }

  function bindToggle() {
    const tabs = [$("sdgViewShowdown"), $("sdgViewCareer")];
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        if (FX.frames[frameId].view === tab.dataset.view) return;
        frameId = pickFrameFor(tab.dataset.view);
        render();
      });
      tab.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const next = tabs[(i + d + tabs.length) % tabs.length];
        next.click();
        next.focus();
      });
    });
  }

  function boot(fixtures, platemap) {
    FX = fixtures;
    window.StandingsFixtures = fixtures;
    const ids = Object.keys(FX.frames);
    frameId = FX.frames[qs.get("frame")] ? qs.get("frame") : ids[0];
    mountStage(platemap);
    bindToggle();
    render();
    if (typeof window.sdEnter === "function") window.sdEnter(document.getElementById("stage-root"));
  }

  Promise.all([
    fetch("fixtures.json").then((r) => r.json()),
    fetch("../rivalry-statistics/assets/platemap.json").then((r) => r.json()).catch(() => null)
  ]).then((x) => boot(x[0], x[1]));
})();
