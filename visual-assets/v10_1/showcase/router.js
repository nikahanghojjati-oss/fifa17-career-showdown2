(() => {
  "use strict";

  const status = document.getElementById("route-status");
  const screenCount = document.getElementById("screen-count");
  const frameCount = document.getElementById("frame-count");

  function getScreen(manifest, id) {
    return (manifest.screens || []).find((screen) => screen.id === id) || null;
  }

  function resolveDestination(manifest, destination) {
    if (!destination || !destination.screen || destination.screen === "showcase") {
      return new URL((manifest.hub && manifest.hub.href) || "./index.html", window.location.href);
    }

    const screen = getScreen(manifest, destination.screen);
    if (!screen) {
      return new URL((manifest.hub && manifest.hub.href) || "./index.html", window.location.href);
    }

    const url = new URL(screen.folder + "/index.html", window.location.href);
    const frames = Array.isArray(screen.frames) ? screen.frames : [];
    const requested = destination.frame;
    const frame = frames.some((item) => item.id === requested)
      ? requested
      : (frames[0] && frames[0].id);

    if (frame) url.searchParams.set("frame", frame);
    return url;
  }

  function resolveProductRoute(manifest, group, key) {
    const table = manifest.navigation && manifest.navigation[group];
    const entry = table && table[key];
    return entry && entry.destination ? resolveDestination(manifest, entry.destination) : null;
  }

  function routeQuery(manifest) {
    const params = new URLSearchParams(window.location.search);
    const screenId = params.get("screen");
    if (!screenId) return false;

    if (screenId === "showcase") {
      window.history.replaceState({}, "", (manifest.hub && manifest.hub.href) || "./index.html");
      return false;
    }

    const screen = getScreen(manifest, screenId);
    if (!screen) {
      window.history.replaceState({}, "", (manifest.hub && manifest.hub.href) || "./index.html");
      if (status) status.textContent = "Unknown screen · hub restored";
      return false;
    }

    const target = resolveDestination(manifest, {
      screen: screenId,
      frame: params.get("frame")
    });
    window.location.replace(target.href);
    return true;
  }

  function validateDeck(manifest) {
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
        ? `${linkedFrames} frame routes ready`
        : `Route manifest mismatch: ${mismatches}`;
    }
  }

  fetch("routes.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`routes.json ${response.status}`);
      return response.json();
    })
    .then((manifest) => {
      window.ShowdownShowcaseRouter = Object.freeze({
        manifest,
        resolve: (screen, frame) => resolveDestination(manifest, { screen, frame }).href,
        resolveProductRoute: (group, key) => {
          const url = resolveProductRoute(manifest, group, key);
          return url ? url.href : null;
        },
        go: (group, key) => {
          const url = resolveProductRoute(manifest, group, key);
          if (url) window.location.assign(url.href);
        }
      });

      if (!routeQuery(manifest)) validateDeck(manifest);
    })
    .catch(() => {
      if (status) status.textContent = "Static routes ready";
    });
})();
