// JOB-077 step 1 scaffold: fixture-driven text only, no visual styling yet.
(function () {
  "use strict";

  const qs = new URLSearchParams(location.search);
  const stage = document.getElementById("stage-root");
  const frameIdNode = document.getElementById("frame-id");
  const stringsNode = document.getElementById("fixture-strings");
  const frameNode = document.getElementById("frame-values");

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
    renderTree(stringsNode, fixtures.strings);
    renderTree(frameNode, frame);
  }

  init().catch((error) => {
    stage.dataset.frame = "error";
    frameIdNode.textContent = "Season Results fixture error";
    frameNode.textContent = error.message;
  });
})();
