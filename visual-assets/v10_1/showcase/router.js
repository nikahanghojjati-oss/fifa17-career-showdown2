(() => {
  "use strict";

  const status = document.getElementById("route-status");
  const screenCount = document.getElementById("screen-count");
  const frameCount = document.getElementById("frame-count");

  fetch("routes.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`routes.json ${response.status}`);
      return response.json();
    })
    .then((manifest) => {
      const screens = Array.isArray(manifest.screens) ? manifest.screens : [];
      const expected = new Map(
        screens.map((screen) => [
          screen.id,
          new Set((screen.frames || []).map((frame) => frame.id))
        ])
      );

      let linkedFrames = 0;
      let mismatches = 0;

      document.querySelectorAll("[data-screen-id]").forEach((card) => {
        const ids = expected.get(card.dataset.screenId);
        const links = [...card.querySelectorAll("a[href*='?frame=']")];
        linkedFrames += links.length;

        if (!ids || links.length !== ids.size) {
          mismatches += 1;
          return;
        }

        for (const link of links) {
          const url = new URL(link.href, window.location.href);
          if (!ids.has(url.searchParams.get("frame"))) {
            mismatches += 1;
            break;
          }
        }
      });

      if (screenCount) screenCount.textContent = String(screens.length);
      if (frameCount) frameCount.textContent = String(linkedFrames);
      if (status) {
        status.textContent = mismatches === 0
          ? `${linkedFrames} routes ready`
          : `Route manifest mismatch: ${mismatches}`;
      }
    })
    .catch(() => {
      if (status) status.textContent = "Static routes ready";
    });
})();
