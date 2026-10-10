(() => {
  "use strict";

  const status = document.getElementById("route-status");
  const screenCount = document.getElementById("screen-count");
  const frameCount = document.getElementById("frame-count");
  const phoneToggle = document.getElementById("phone-toggle");
  const phonePreview = document.getElementById("phone-preview");
  const phoneFrame = document.getElementById("phone-frame");
  const phoneTitle = document.getElementById("phone-preview-title");
  const phoneOpen = document.getElementById("phone-open");
  const TRANSITION_MS = 350;
  let transitionInFlight = false;

  function prefersReducedMotion() {
    const root = document.documentElement;
    return root.getAttribute("data-motion-reduced") === "true"
      || root.getAttribute("data-reduced-motion") === "true"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getTransitionLayer() {
    let layer = document.querySelector(".showcase-transition");
    if (layer) return layer;

    layer = document.createElement("div");
    layer.className = "showcase-transition";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = '<span class="showcase-transition__gold"></span>';
    (document.body || document.documentElement).appendChild(layer);
    return layer;
  }

  function navigateWithTransition(url, mode = "assign") {
    if (!url || transitionInFlight) return;

    const target = new URL(url, window.location.href);
    if (target.href === window.location.href) return;

    transitionInFlight = true;
    const layer = getTransitionLayer();
    layer.classList.toggle("showcase-transition--reduced", prefersReducedMotion());

    requestAnimationFrame(() => {
      layer.classList.add("showcase-transition--active");
      window.setTimeout(() => {
        window.location[mode](target.href);
      }, TRANSITION_MS);
    });
  }

  // Claude intake fix (job 231): Back/Forward can restore this page from the back-forward cache with the
  // black layer still active; clear it so the showcase is never left black and unclickable.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    transitionInFlight = false;
    const layer = document.querySelector(".showcase-transition");
    if (layer) layer.classList.remove("showcase-transition--active");
  });

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
    if (params.get("phone") === "1") return false;

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
    navigateWithTransition(target.href, "replace");
    return true;
  }

  function getPhoneSelection(manifest, params = new URLSearchParams(window.location.search)) {
    const screen = getScreen(manifest, params.get("screen"));
    if (!screen) return null;

    const frames = Array.isArray(screen.frames) ? screen.frames : [];
    const requested = params.get("frame");
    const frame = frames.some((item) => item.id === requested)
      ? requested
      : (frames[0] && frames[0].id);

    return frame ? { screen: screen.id, frame } : null;
  }

  function defaultPhoneSelection(manifest) {
    const screen = (manifest.screens || []).find((item) => Array.isArray(item.frames) && item.frames.length);
    return screen ? { screen: screen.id, frame: screen.frames[0].id } : null;
  }

  function writePhoneQuery(selection, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", selection.screen);
    url.searchParams.set("frame", selection.frame);
    url.searchParams.set("phone", "1");
    window.history[replace ? "replaceState" : "pushState"]({}, "", url.href);
  }

  function clearPhoneQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete("phone");
    url.searchParams.delete("screen");
    url.searchParams.delete("frame");
    window.history.pushState({}, "", url.href);
  }

  function paintPhonePreview(manifest, selection) {
    if (!phoneToggle || !phonePreview || !phoneFrame || !phoneTitle || !phoneOpen || !selection) return;

    const target = resolveDestination(manifest, selection);
    const screen = getScreen(manifest, selection.screen);
    const frame = screen && (screen.frames || []).find((item) => item.id === selection.frame);
    const screenLabel = (screen && (screen.label || screen.title || screen.name)) || selection.screen;
    const frameLabel = (frame && (frame.label || frame.title || frame.name)) || selection.frame;

    phoneToggle.setAttribute("aria-pressed", "true");
    phonePreview.hidden = false;
    phoneTitle.textContent = `${screenLabel} · ${frameLabel}`;
    phoneOpen.href = target.href;

    if (phoneFrame.src !== target.href) {
      phoneFrame.src = target.href;
    }
  }

  function disablePhonePreview() {
    if (phoneToggle) phoneToggle.setAttribute("aria-pressed", "false");
    if (phonePreview) phonePreview.hidden = true;
    if (phoneFrame) phoneFrame.removeAttribute("src");
  }

  function setupPhonePreview(manifest) {
    if (!phoneToggle || !phonePreview || !phoneFrame) return;

    let selection = getPhoneSelection(manifest);
    const initialPhoneMode = new URLSearchParams(window.location.search).get("phone") === "1";

    if (initialPhoneMode) {
      selection = selection || defaultPhoneSelection(manifest);
      if (selection) {
        writePhoneQuery(selection, true);
        paintPhonePreview(manifest, selection);
      }
    }

    phoneToggle.addEventListener("click", () => {
      const enabled = phoneToggle.getAttribute("aria-pressed") === "true";
      if (enabled) {
        disablePhonePreview();
        clearPhoneQuery();
        return;
      }

      selection = selection || defaultPhoneSelection(manifest);
      if (!selection) return;
      writePhoneQuery(selection);
      paintPhonePreview(manifest, selection);
    });

    document.addEventListener("click", (event) => {
      if (phoneToggle.getAttribute("aria-pressed") !== "true") return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest(".showcase-links a");
      if (!link) return;

      const card = link.closest("[data-screen-id]");
      const screen = card && getScreen(manifest, card.dataset.screenId);
      if (!screen) return;

      const frameId = new URL(link.href, window.location.href).searchParams.get("frame");
      if (!(screen.frames || []).some((item) => item.id === frameId)) return;

      event.preventDefault();
      selection = { screen: screen.id, frame: frameId };
      writePhoneQuery(selection);
      paintPhonePreview(manifest, selection);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      phonePreview.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    });

    window.addEventListener("popstate", () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("phone") !== "1") {
        disablePhonePreview();
        return;
      }

      selection = getPhoneSelection(manifest, params) || defaultPhoneSelection(manifest);
      if (selection) paintPhonePreview(manifest, selection);
    });
  }

  function setupScreenTransitions() {
    document.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest(".showcase-links a, .showcase-phone__open");
      if (!link || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) return;

      event.preventDefault();
      navigateWithTransition(target.href);
    });
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
          if (url) navigateWithTransition(url.href);
        }
      });

      if (!routeQuery(manifest)) {
        validateDeck(manifest);
        setupPhonePreview(manifest);
        setupScreenTransitions();
      }
    })
    .catch(() => {
      if (status) status.textContent = "Static routes ready";
    });
})();
