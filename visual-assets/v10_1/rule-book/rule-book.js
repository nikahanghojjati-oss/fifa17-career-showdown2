// RULE-BOOK-V1 · fixture-driven scaffold. No screen styling in step 1.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);

  async function loadFixtures() {
    const response = await fetch("fixtures.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Rule Book fixtures could not be loaded.");
    return response.json();
  }

  function text(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value == null ? "" : String(value);
  }

  function ruleList(rules) {
    const list = document.createElement("ul");
    rules.forEach((rule) => {
      const item = document.createElement("li");
      item.textContent = rule;
      list.appendChild(item);
    });
    return list;
  }

  function scoringTable(section) {
    const wrap = document.createElement("div");
    wrap.className = "ruleScoreTable";

    section.rows.forEach((row) => {
      const line = document.createElement("div");
      line.className = "ruleScoreRow";
      const label = document.createElement("span");
      const value = document.createElement("strong");
      label.textContent = row.label;
      value.textContent = row.value;
      line.append(label, value);
      wrap.appendChild(line);
    });

    const maximum = document.createElement("div");
    maximum.className = "ruleScoreMaximum";
    const maxLabel = document.createElement("span");
    const maxValue = document.createElement("strong");
    maxLabel.textContent = section.maximum.label;
    maxValue.textContent = section.maximum.value;
    maximum.append(maxLabel, maxValue);
    wrap.appendChild(maximum);
    return wrap;
  }

  function buildSections(strings) {
    const index = document.getElementById("ruleBookIndex");
    const grid = document.getElementById("ruleBookSections");
    index.replaceChildren();
    grid.replaceChildren();

    Object.entries(strings.sections).forEach(([number, section]) => {
      const anchor = document.createElement("a");
      anchor.href = "#rule-section-" + number;
      anchor.className = "ruleBookIndexChip";
      anchor.textContent = number;
      anchor.setAttribute("aria-label", number + " " + section.title);
      anchor.setAttribute("aria-controls", "rule-section-" + number);
      index.appendChild(anchor);

      const card = document.createElement("article");
      card.id = "rule-section-" + number;
      card.className = number === "04"
        ? "ruleSection scoringRuleSection sd-panel sd-panel--hero"
        : "ruleSection sd-panel";

      const header = document.createElement("header");
      header.className = "ruleSectionHeader";
      const badge = document.createElement("span");
      badge.className = "ruleSectionNumber";
      badge.textContent = number;
      const heading = document.createElement("h2");
      heading.textContent = section.title;
      header.append(badge, heading);
      card.appendChild(header);

      if (section.rules) card.appendChild(ruleList(section.rules));
      if (section.rows) card.appendChild(scoringTable(section));
      grid.appendChild(card);
    });
  }

  function applyFrame(fixtures, frameId) {
    const frame = fixtures.frames[frameId];
    const strings = fixtures.strings;
    const stage = document.getElementById("stage-root");

    stage.dataset.frame = frameId;
    stage.dataset.status = frame.status;

    text("ruleBookPreview", frame.previewLabel);
    text("ruleBookFrameStatus", frame.status);
    text("ruleBookFrameNote", frame.note);
    text("ruleBookEyebrow", strings.hero.eyebrow);
    text("ruleBookHeading", strings.heading);
    text("ruleBookHeroTitle", strings.hero.title);
    text("ruleBookSummary", strings.hero.summary);
    text("ruleBookBack", strings.buttons.back);

    buildSections(strings);

    const preview = document.getElementById("ruleBookPreview");
    preview.hidden = !frame.previewLabel;
  }

  loadFixtures()
    .then((fixtures) => {
      const ids = Object.keys(fixtures.frames);
      const requested = qs.get("frame");
      const frameId = requested && fixtures.frames[requested] ? requested : ids[0];
      applyFrame(fixtures, frameId);
    })
    .catch((error) => {
      text("ruleBookFrameStatus", error.message);
      document.getElementById("stage-root").dataset.status = "error";
    });
})();
