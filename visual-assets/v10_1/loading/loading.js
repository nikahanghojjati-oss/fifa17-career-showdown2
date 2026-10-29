(() => {
  const params = new URLSearchParams(location.search);
  const requestedFrame = params.get("frame") || "LD1";
  const screen = document.getElementById("loadingScreen");
  const bind = (name) => document.querySelector(`[data-bind="${name}"]`);

  function setText(name, value) {
    const el = bind(name);
    if (el && typeof value === "string") el.textContent = value;
  }

  function applyFixture(fixtures) {
    const frame = fixtures.frames?.[requestedFrame] || fixtures.frames?.LD1;
    if (!frame) return;
    document.documentElement.dataset.frame = requestedFrame;
    screen.dataset.status = frame.status || "loading";
    screen.setAttribute("aria-busy", frame.status === "ready" ? "false" : "true");

    setText("kicker", fixtures.strings?.live?.kicker);
    setText("edition", fixtures.strings?.live?.edition);
    setText("support", fixtures.strings?.live?.support);

    const statusText = requestedFrame === "LD1"
      ? fixtures.strings?.live?.loadingStatus
      : frame.values?.statusText;
    setText("status", statusText || fixtures.strings?.live?.loadingStatus || "PREPARING CAREER MODE SHOWDOWN");
  }

  fetch("fixtures.json")
    .then((response) => {
      if (!response.ok) throw new Error(`fixtures ${response.status}`);
      return response.json();
    })
    .then(applyFixture)
    .catch(() => {
      document.documentElement.dataset.frame = requestedFrame;
    });
})();
