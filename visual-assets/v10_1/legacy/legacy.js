// JOB-072 · Legacy fixture-driven scaffold.
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
      value.forEach((item, index) => {
        group.appendChild(renderValue(item, label + "[" + index + "]"));
      });
      return group;
    }

    if (value && typeof value === "object") {
      const heading = document.createElement("p");
      heading.textContent = label;
      group.appendChild(heading);
      Object.entries(value).forEach(([key, child]) => {
        group.appendChild(renderValue(child, key));
      });
      return group;
    }

    const key = document.createElement("span");
    key.textContent = label + ": ";
    group.append(key, scalarNode(value));
    return group;
  }

  function renderObject(root, object) {
    root.replaceChildren();
    Object.entries(object || {}).forEach(([key, value]) => {
      root.appendChild(renderValue(value, key));
    });
  }

  async function boot() {
    const response = await fetch("./fixtures.json", { cache: "no-store" });
    if (!response.ok) throw new Error("fixtures.json " + response.status);
    const fixtures = await response.json();
    const ids = Object.keys(fixtures.frames || {});
    const requested = new URLSearchParams(location.search).get("frame");
    const frameId = ids.includes(requested) ? requested : ids[0];
    const frame = fixtures.frames[frameId];

    stage.dataset.frame = frameId;
    frameLabel.textContent = frameId;
    document.getElementById("fixtureEyebrow").textContent = fixtures.strings.eyebrow;
    document.getElementById("legacyHeading").textContent = fixtures.strings.heading;
    document.getElementById("fixtureTagline").textContent = fixtures.strings.tagline;

    renderObject(stringsRoot, fixtures.strings);
    renderObject(valuesRoot, frame);
    window.LegacyFixture = { fixtures, frameId, frame };
  }

  boot().catch((error) => {
    stage.dataset.frame = "error";
    frameLabel.textContent = "Fixture load failed";
    valuesRoot.textContent = error.message;
  });
}());
