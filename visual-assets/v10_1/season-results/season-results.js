// JOB-077 scaffold + registered Season Results plate.
(function () {
  "use strict";

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
    const result = frame.managers && frame.managers[managerKey];
    const sealed = (frame.sealed || []).includes(managerKey) || !result;
    const name = managerKey === "daniel" ? "DANIEL" : "NIK";
    panel.classList.toggle("is-sealed", sealed);
    panel.replaceChildren();

    if (sealed) {
      const box = document.createElement("div");
      box.className = "sealed-copy";
      const strong = document.createElement("strong");
      const sub = document.createElement("span");
      strong.textContent = "Waiting for " + name;
      sub.textContent = "Your rival's unpublished season result stays private.";
      box.append(strong, sub);
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
      ["leaguePosition", result.leaguePosition, 1, 20],
      ["leaguePoints", result.leaguePoints, 0, 114],
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
    const score = scoreResult(result);
    const scoreBar = document.createElement("div");
    scoreBar.className = "season-score";
    scoreBar.style.setProperty("--season-score", score);
    scoreBar.innerHTML = '<span class="season-score-label">SEASON SCORE</span><span class="season-score-track"><i class="season-score-fill"></i></span><strong class="season-score-value"></strong>';
    scoreBar.querySelector(".season-score-value").textContent = String(score);

    panel.append(header, hint, body, scoreBar);
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

    if (frame.phase === "entering") {
      review.hidden = false;
      review.textContent = labels.review;
    } else if (frame.phase === "waiting-for-rival") {
      publish.hidden = false;
      publish.textContent = labels.published;
      publish.disabled = true;
      publish.setAttribute("aria-disabled", "true");
    } else if (frame.phase === "results-ready") {
      commit.hidden = false;
      commit.textContent = labels.commitCheck;
    } else if (frame.phase === "committed") {
      commit.hidden = false;
      commit.textContent = labels.acknowledge;
    }
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
    const frame = fixtures.frames[frameId];

    stage.dataset.frame = frameId;
    frameIdNode.textContent = "Frame: " + frameId;
    renderTopbar(fixtures);
    document.getElementById("season-semantic-title").textContent =
      fixtures.strings.titleTemplate.replace("{SEASON_NUMBER}", frame.context.season);
    document.getElementById("scoring-rules-text").textContent = fixtures.strings.scoringRules;
    renderManagerPanel(fixtures, frame, "daniel");
    renderManagerPanel(fixtures, frame, "nik");
    renderActions(fixtures, frame);
    renderTree(stringsNode, fixtures.strings);
    renderTree(frameNode, frame);
  }

  init().catch((error) => {
    stage.dataset.frame = "error";
    frameIdNode.textContent = "Season Results fixture error";
    frameNode.textContent = error.message;
  });
})();
