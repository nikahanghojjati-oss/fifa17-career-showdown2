// JOB-077 scaffold + registered Season Results plate.
(function () {
  "use strict";

  if (window.SEASON_RESULTS_APP) {
    window.ShowdownSeasonResultsBoot = function(stage) {
      window.ShowdownStage.mount(stage, {plate:{width:1536,height:864,
        src1x:"visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_1X.webp",
        src2x:"visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_2X.webp"},
        focal:{x:768,y:432},platemap:{phone_band:[120,45,1450,575]}});
      if (typeof window.sdEnter === "function") window.sdEnter(stage);
    };
    return;
  }
  const qs = new URLSearchParams(location.search);
  const stage = document.getElementById("stage-root");
  const frameIdNode = document.getElementById("frame-id");
  const stringsNode = document.getElementById("fixture-strings");
  const frameNode = document.getElementById("frame-values");

  window.ShowdownStage.mount(stage, {
    plate: {
      width: 1536,
      height: 864,
      src1x: "assets/ENV_SR_PLATE_V1_1X.webp",
      src2x: "assets/ENV_SR_PLATE_V1_2X.webp"
    },
    focal: { x: 768, y: 432 },
    platemap: { phone_band: [120, 45, 1450, 575] }
  });

  const SR_MOTION = Object.freeze({
    tick: 120, rollDelay: 550, roll: 320, cap: 120, reduced: 150,
    ease: "cubic-bezier(.22,1,.36,1)"
  });
  function reducedMotion() {
    return window.ShowdownMotion?.isReducedMotion() || matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function feedbackMotion(node, frames, duration) {
    if (!node || typeof node.animate !== "function") return;
    return node.animate(reducedMotion() ? [{ opacity: .65 }, { opacity: 1 }] : frames,
      { duration: reducedMotion() ? SR_MOTION.reduced : duration, easing: SR_MOTION.ease });
  }

  function appendValue(parent, key, value) {
    if (value && typeof value === "object") {
      const group = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = key;
      group.appendChild(heading);

      if (Array.isArray(value)) {
        value.forEach((item, index) => appendValue(group, String(index), item));
      } else {
        Object.entries(value).forEach(([childKey, childValue]) => {
          appendValue(group, childKey, childValue);
        });
      }
      parent.appendChild(group);
      return;
    }

    const row = document.createElement("p");
    const label = document.createElement("span");
    const output = document.createElement("span");
    label.textContent = key + ": ";
    output.textContent = value === null ? "null" : String(value);
    row.append(label, output);
    parent.appendChild(row);
  }

  function scoreResult(result) {
    if (!result) return null;
    return (result.championsLeague ? 5 : 0)
      + (result.leaguePosition === 1 ? 3 : 0)
      + (result.domesticCup ? 1 : 0)
      + ((result.leaguePoints >= 100 || result.leagueGoals >= 100) ? 1 : 0)
      + ((result.topScorer || result.topAssist) ? 1 : 0);
  }

  function clubLabel(value) {
    return String(value || "").replaceAll("_", " ").toUpperCase();
  }

  function renderManagerPanel(fixtures, frame, managerKey) {
    const panel = document.getElementById(managerKey + "-entry-panel");
    panel.replaceChildren();
    panel.hidden = frame.status !== "ready";
    if (frame.status !== "ready") {
      panel.classList.remove("is-sealed");
      return;
    }

    const result = frame.managers && frame.managers[managerKey];
    const sealed = (frame.sealed || []).includes(managerKey) || !result;
    const name = managerKey === "daniel" ? "DANIEL" : "NIK";
    panel.classList.toggle("is-sealed", sealed);

    if (sealed) {
      const box = document.createElement("div");
      box.className = "sealed-copy";
      const strong = document.createElement("strong");
      strong.textContent = fixtures.strings.sealedWaitingTemplate.replace("{MANAGER}", name);
      box.appendChild(strong);
      panel.appendChild(box);
      return;
    }

    const ids = fixtures.ids;
    const fields = ids.fields[managerKey];
    const header = document.createElement("header");
    header.className = "manager-card-header";
    header.innerHTML = '<span class="manager-crown" aria-hidden="true">♛</span><h2 class="manager-name"></h2><p class="manager-club"></p>';
    header.querySelector(".manager-name").id = ids.managerNames[managerKey];
    header.querySelector(".manager-name").textContent = name;
    header.querySelector(".manager-club").id = ids.clubPlaceholders[managerKey];
    header.querySelector(".manager-club").textContent = clubLabel(frame.context.clubs[managerKey]);

    const hint = document.createElement("p");
    hint.className = "manager-hint";
    hint.textContent = fixtures.strings.entryHintTemplate.replace("{MANAGER}", name);

    const body = document.createElement("div");
    body.className = "manager-fields";
    const stats = document.createElement("div");
    stats.className = "stat-fields";
    const achievements = document.createElement("div");
    achievements.className = "achievement-fields";

    const numeric = [
      ["leaguePosition", result.leaguePosition, 1, frame.teamCount],
      ["leaguePoints", result.leaguePoints, 0, frame.maxPoints],
      ["leagueGoals", result.leagueGoals, 0, 300]
    ];
    numeric.forEach(([key, value, min, max]) => {
      const row = document.createElement("div");
      row.className = "field-row";
      const label = document.createElement("label");
      const input = document.createElement("input");
      label.htmlFor = fields[key];
      label.textContent = fixtures.strings.fieldLabels[key];
      input.id = fields[key];
      input.type = "number";
      input.inputMode = "numeric";
      input.min = String(min);
      input.max = String(max);
      input.value = String(value);
      input.disabled = frame.phase !== "entering" || frame.viewer !== managerKey;
      row.append(label, input);
      stats.appendChild(row);
    });

    ["domesticCup", "championsLeague", "topScorer", "topAssist"].forEach((key) => {
      const row = document.createElement("div");
      row.className = "achievement-row";
      const label = document.createElement("label");
      const input = document.createElement("input");
      label.htmlFor = fields[key];
      label.textContent = fixtures.strings.inputAchievements[key];
      input.id = fields[key];
      input.type = "checkbox";
      input.checked = !!result[key];
      input.disabled = frame.phase !== "entering" || frame.viewer !== managerKey;
      row.append(label, input);
      achievements.appendChild(row);
    });

    body.append(stats, achievements);
    panel.append(header, hint, body);
    const capTags = document.createElement("span");
    capTags.className = "sr-cap-tags";
    capTags.setAttribute("aria-hidden", "true");
    ["performance", "awards"].forEach(bonus => {
      const tag = document.createElement("span");
      tag.className = "sr-max-tag";
      tag.dataset.bonus = bonus;
      tag.textContent = "MAX";
      tag.hidden = true;
      capTags.appendChild(tag);
    });
    header.appendChild(capTags);
    function refreshCaps() {
      const points = Number(panel.querySelector("#" + fields.leaguePoints).value);
      const goals = Number(panel.querySelector("#" + fields.leagueGoals).value);
      const caps = {
        performance: (points >= 100 && points <= frame.maxPoints) || (goals >= 100 && goals <= 300),
        awards: panel.querySelector("#" + fields.topScorer).checked || panel.querySelector("#" + fields.topAssist).checked
      };
      capTags.querySelectorAll("[data-bonus]").forEach(tag => {
        const show = !!caps[tag.dataset.bonus];
        const newlyReached = tag.hidden && show;
        tag.hidden = !show;
        if (newlyReached) feedbackMotion(tag,
          [{ transform: "scale(1.4)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], SR_MOTION.cap);
      });
    }
    refreshCaps();
    panel.addEventListener("input", refreshCaps);
    panel.addEventListener("change", event => {
      const input = event.target;
      if (input.matches('input[type="checkbox"]') && !input.disabled && input.checked) {
        feedbackMotion(input, [{ transform: "scale(1.4)", opacity: .55 }, { transform: "scale(1)", opacity: 1 }], SR_MOTION.tick);
      }
    });

    const canonical =
      frame.scoringState === "SCORING_RECONCILED"
      && frame.breakdown
      && frame.breakdown[managerKey];
    if (canonical) {
      const score = canonical.total;
      const scoreBar = document.createElement("div");
      scoreBar.className = "season-score";
      scoreBar.style.setProperty("--season-score", score);
      scoreBar.innerHTML = '<span class="season-score-label"></span><span class="season-score-track"><i class="season-score-fill"></i></span><strong class="season-score-value sd-number sd-number--small"></strong>';
      scoreBar.querySelector(".season-score-label").textContent = fixtures.strings.canonicalScoring.scoreLabel;
      scoreBar.querySelector(".season-score-value").textContent = String(score);
      panel.appendChild(scoreBar);
    }
  }

  function renderActions(fixtures, frame) {
    const labels = fixtures.strings.buttons;
    const review = document.getElementById("completeSeason");
    const publish = document.getElementById("confirmSeasonCompletion");
    const edit = document.getElementById("editSeasonResults");
    const commit = document.getElementById("sharedSeasonCommitAction");
    const back = document.querySelector(".season-action-row .backButton");

    [review, publish, edit, commit].forEach((button) => {
      button.hidden = true;
      button.disabled = false;
      button.removeAttribute("aria-disabled");
    });
    back.textContent = labels.back;

    if (frame.status !== "ready") return;

    if (frame.phase === "entering") {
      review.hidden = false;
      review.textContent = labels.review;
      if (frame.error) {
        edit.hidden = false;
        edit.textContent = labels.edit;
      }
    } else if (frame.phase === "unpublished-review") {
      publish.hidden = false;
      publish.textContent = labels.publish;
      edit.hidden = false;
      edit.textContent = labels.edit;
    } else if (frame.phase === "waiting-for-rival") {
      publish.hidden = false;
      publish.textContent = labels.published;
      publish.disabled = true;
      publish.setAttribute("aria-disabled", "true");
    } else if (frame.phase === "results-ready" || frame.phase === "committed") {
      const state = sharedCommitPresentation(fixtures, frame);
      commit.hidden = false;
      commit.textContent = state.label;
      commit.disabled = state.disabled;
      commit.setAttribute("aria-disabled", String(state.disabled));
    }
  }


  // Adapter states mirror productionSharedSeasonCommit.psscRender; presentation only.
  function sharedCommitPresentation(fixtures, frame) {
    const buttons = fixtures.strings.buttons;
    const copy = fixtures.strings.commitStatus;
    const state = frame.commitState || (frame.phase === "committed" ? "acknowledged" : "checking");
    const states = {
      checking: [buttons.commitCheck, copy.checking, !!frame.commitBusy],
      retry: [buttons.commitRetry, copy.failedTemplate.replace("{ERROR_CODE}", frame.commitErrorCode || ""), !!frame.commitBusy],
      coordinator: [buttons.commit, copy.coordinatorReady, !!frame.commitBusy],
      peer: [buttons.waitCoordinator, copy.peerReadyTemplate.replace("{COORDINATOR}", frame.coordinatorName || "DANIEL"), true],
      committed: [buttons.acknowledge, copy.committed, !!frame.commitBusy],
      "own-acknowledged": [buttons.acknowledgedWaiting, copy.ownAcknowledged, true],
      acknowledged: [buttons.acknowledged, copy.acknowledged, true]
    };
    const [label, status, disabled] = states[state] || states.checking;
    return { label, status, disabled };
  }

  function formatTemplate(template, replacements) {
    return Object.entries(replacements).reduce(
      (value, [token, replacement]) => value.replaceAll(token, String(replacement)),
      template
    );
  }

  function renderWorkflowState(fixtures, frame) {
    const panel = document.getElementById("seasonReviewPanel");
    const status = document.getElementById("seasonReviewStatusMeta");
    const heading = document.getElementById("seasonReviewHeading");
    const result = document.getElementById("seasonReviewResult");
    const error = document.getElementById("seasonReviewError");
    const canonical = document.getElementById("sharedCanonicalScoringPanel");

    panel.hidden = true;
    panel.className = "season-review-panel sd-panel";
    delete panel.dataset.contractState;
    canonical.hidden = true;
    status.textContent = "";
    heading.textContent = "";
    result.textContent = "";
    error.textContent = "";
    const commitStatus = document.getElementById("sharedSeasonCommitStatus");
    if (commitStatus) {
      commitStatus.hidden = !["results-ready", "committed"].includes(frame.phase) || frame.status !== "ready";
      commitStatus.textContent = commitStatus.hidden ? "" : sharedCommitPresentation(fixtures, frame).status;
    }

    if (frame.status !== "ready") {
      panel.hidden = false;
      panel.classList.add("is-contract-state", "is-" + frame.status);
      panel.dataset.contractState = frame.status;
      status.textContent = frame.status.toUpperCase();
      heading.textContent = frame.note;
      result.textContent = frame.interimLabel || "";
      return;
    }

    if (frame.phase === "unpublished-review") {
      const copy = fixtures.strings.review.draft;
      panel.hidden = false;
      panel.classList.add("is-draft");
      status.textContent = copy.status;
      heading.textContent = copy.heading;
      result.textContent = copy.result;
      error.textContent = frame.error || "";
    } else if (frame.phase === "waiting-for-rival") {
      const copy = fixtures.strings.review.waiting;
      panel.hidden = false;
      panel.classList.add("is-waiting");
      status.textContent = copy.status;
      heading.textContent = copy.heading;
      result.textContent = copy.result;
    } else if (frame.phase === "results-ready") {
      const copy = fixtures.strings.review.ready;
      panel.hidden = false;
      panel.classList.add("is-ready");
      status.textContent = copy.status;
      heading.textContent = copy.heading;
      result.textContent = copy.result;
    } else if (frame.phase === "committed" && frame.scoringState === "SCORING_RECONCILED" && frame.breakdown) {
      const labels = fixtures.strings.canonicalScoring;
      const d = frame.breakdown.daniel;
      const n = frame.breakdown.nik;
      panel.hidden = false;
      panel.classList.add("is-committed");
      status.textContent = fixtures.strings.commitStatus.acknowledged;
      heading.textContent = labels.heading;
      result.textContent = frame.tiebreak === "none" ? labels.reconciled : frame.tiebreak;
      canonical.hidden = false;
      document.getElementById("sharedCanonicalScoringHeading").textContent = labels.heading;
      document.getElementById("sharedCanonicalScoringTotals").textContent =
        formatTemplate(labels.totalsTemplate, {
          "{DANIEL}": "DANIEL", "{DANIEL_TOTAL}": d.total,
          "{NIK}": "NIK", "{NIK_TOTAL}": n.total
        });
      document.getElementById("sharedCanonicalScoringBreakdown").textContent =
        formatTemplate(labels.breakdownTemplate, {
          "{D_CL}": d.championsLeague, "{N_CL}": n.championsLeague,
          "{D_LEAGUE}": d.leagueTitle, "{N_LEAGUE}": n.leagueTitle,
          "{D_CUP}": d.domesticCup, "{N_CUP}": n.domesticCup,
          "{D_PERFORMANCE}": d.performanceBonus, "{N_PERFORMANCE}": n.performanceBonus,
          "{D_AWARDS}": d.awardsBonus, "{N_AWARDS}": n.awardsBonus
        });
      document.getElementById("sharedCanonicalScoringWinner").textContent =
        frame.winner
          ? labels.winnerTemplate.replace("{MANAGER}", frame.winner.toUpperCase())
          : labels.draw;
    } else if (frame.error) {
      const copy = fixtures.strings.review.draft;
      panel.hidden = false;
      panel.classList.add("is-error");
      status.textContent = copy.status;
      heading.textContent = copy.heading;
      result.textContent = copy.result;
      error.textContent = frame.error;
    }
  }


  function animateCanonicalScores(frame) {
    if (frame.status !== "ready" || frame.phase !== "committed"
        || frame.scoringState !== "SCORING_RECONCILED" || !frame.breakdown) return;
    ["daniel", "nik"].forEach(key => {
      const panel = document.getElementById(key + "-entry-panel");
      const number = panel.querySelector(".season-score-value");
      const fill = panel.querySelector(".season-score-fill");
      const total = frame.breakdown[key]?.total;
      if (!number || !Number.isFinite(total)) return;
      const target = Number(total);
      number.setAttribute("aria-label", String(target));
      if (!reducedMotion() && typeof window.sdCountUp === "function") {
        number.textContent = "0";
        window.sdCountUp(number, target, SR_MOTION.roll);
      }
      feedbackMotion(fill, [{ transform: "scaleX(0)", opacity: .5 }, { transform: "scaleX(1)", opacity: 1 }], SR_MOTION.roll);
    });
  }

  // DEFAULT: old labelled committed fixtures predate the scoring gate and carry stale totals.
  // Normalize preview facts only; never recompute/replace a provider's authoritative breakdown.
  function normalizeLegacyPreview(frame) {
    if (frame.previewLabel !== "Preview data" || frame.phase !== "committed" || frame.scoringState) return;
    frame.breakdown = {};
    ["daniel", "nik"].forEach(key => {
      const r = frame.managers[key];
      frame.breakdown[key] = {
        championsLeague: r.championsLeague ? 5 : 0,
        leagueTitle: r.leaguePosition === 1 ? 3 : 0,
        domesticCup: r.domesticCup ? 1 : 0,
        performanceBonus: r.leaguePoints >= 100 || r.leagueGoals >= 100 ? 1 : 0,
        awardsBonus: r.topScorer || r.topAssist ? 1 : 0,
        total: scoreResult(r)
      };
    });
    const d = frame.breakdown.daniel.total, n = frame.breakdown.nik.total;
    const dr = frame.managers.daniel, nr = frame.managers.nik;
    frame.winner = d !== n ? (d > n ? "daniel" : "nik")
      : dr.leaguePosition !== nr.leaguePosition ? (dr.leaguePosition < nr.leaguePosition ? "daniel" : "nik")
      : dr.leaguePoints !== nr.leaguePoints ? (dr.leaguePoints > nr.leaguePoints ? "daniel" : "nik") : null;
    frame.tiebreak = d !== n ? "none" : dr.leaguePosition !== nr.leaguePosition ? "league-position"
      : dr.leaguePoints !== nr.leaguePoints ? "league-points" : "draw";
    frame.scoringState = "SCORING_RECONCILED";
  }

  function renderPreviewTag(fixtures, frame) {
    let tag = document.getElementById("season-preview-tag");
    if (!tag) {
      tag = document.createElement("p");
      tag.id = "season-preview-tag";
      tag.className = "sd-preview-tag season-preview-tag";
      document.querySelector(".season-layout").appendChild(tag);
    }
    tag.dataset.owner = frame.viewer === "nik" ? "nik" : "daniel";
    tag.textContent = frame.previewLabel || fixtures.strings.previewLabel;
  }

  function renderTopbar(fixtures) {
    const nav = document.getElementById("season-nav-tabs");
    const route = fixtures.routes.topNavigation;
    nav.replaceChildren();
    route.tabs.forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.disabled = route.lockedOnScreen;
      button.setAttribute("aria-disabled", String(route.lockedOnScreen));
      button.title = route.lockedOnScreen ? route.lockMessage : "";
      nav.appendChild(button);
    });
    const settings = document.getElementById("season-settings");
    settings.hidden = !route.settingsIcon;
    settings.title = route.lockMessage;
  }

  function renderTree(parent, value) {
    parent.replaceChildren();
    Object.entries(value || {}).forEach(([key, childValue]) => {
      appendValue(parent, key, childValue);
    });
  }

  async function init() {
    const response = await fetch("fixtures.json", { cache: "no-store" });
    if (!response.ok) throw new Error("fixtures.json could not be loaded");
    const fixtures = await response.json();
    const frameIds = Object.keys(fixtures.frames || {});
    const requested = qs.get("frame");
    const frameId = requested && fixtures.frames[requested] ? requested : frameIds[0];
    const frame = { ...fixtures.frames[frameId] };
    normalizeLegacyPreview(frame);
    // DEFAULT: older fixtures omit bounds; derive contract §0 bounds at the adapter edge.
    const contractTeams = { premier_league: 20, laliga: 20, bundesliga: 18, serie_a: 20, ligue_1: 20 };
    frame.teamCount = frame.teamCount ?? contractTeams[frame.context.leagueId];
    frame.maxPoints = frame.maxPoints ?? (frame.teamCount - 1) * 6;
    // Labelled preview selector covers each real commit presentation without writing product state.
    const previewCommit = qs.get("commitState");
    if (["checking", "retry", "coordinator", "peer", "committed", "own-acknowledged", "acknowledged"].includes(previewCommit)
        && ["results-ready", "committed"].includes(frame.phase)) frame.commitState = previewCommit;

    stage.dataset.frame = frameId;
    stage.dataset.status = frame.status || "ready";
    frameIdNode.textContent = "Frame: " + frameId;
    renderTopbar(fixtures);
    document.getElementById("season-semantic-title").textContent =
      fixtures.strings.titleTemplate.replace("{SEASON_NUMBER}", frame.context.season);
    document.getElementById("scoring-rules-text").textContent = fixtures.strings.scoringRules;
    renderManagerPanel(fixtures, frame, "daniel");
    renderManagerPanel(fixtures, frame, "nik");
    renderActions(fixtures, frame);
    renderWorkflowState(fixtures, frame);
    renderPreviewTag(fixtures, frame);
    renderTree(stringsNode, fixtures.strings);
    renderTree(frameNode, frame);
    // Motion belongs to this optional screen; it never gates a product control.
    stage.querySelectorAll(".season-action-row .sd-btn--primary").forEach(button => {
      if (!button.hidden) button.dataset.sdEnter = "button";
      else delete button.dataset.sdEnter;
    });
    stage.querySelectorAll('[data-sd-enter="panel"]').forEach((panel, index) => {
      panel.style.setProperty("--i", String(Math.min(index, 5)));
    });
    if (document.fonts) await document.fonts.ready;
    if (typeof window.sdEnter === "function") window.sdEnter(stage);
    window.setTimeout(() => animateCanonicalScores(frame), reducedMotion() ? 0 : SR_MOTION.rollDelay);
  }

  init().catch((error) => {
    stage.dataset.frame = "error";
    frameIdNode.textContent = "Season Results fixture error";
    frameNode.textContent = error.message;
  });
})();
