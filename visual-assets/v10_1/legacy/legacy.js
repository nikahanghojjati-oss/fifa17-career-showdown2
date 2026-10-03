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
