/* Showdown shared motion runtime · JOB-016
   Lazy-load this module only when a screen needs choreography. */
(() => {
  "use strict";

  const PREF_KEY = "careerModeShowdown.preferences";
  const REDUCED_MS = 150;
  const TIMING = Object.freeze({
    scene: { delay: 0, duration: 400 },
    character: { delay: 150, duration: 450 },
    title: { delay: 250, duration: 450 },
    panel: { delay: 400, duration: 500, stagger: 60 },
    button: { delay: 760, duration: 320 },
    crown: { delay: 500, duration: 420 },
    card: { delay: 460, duration: 520 },
    slam: { delay: 430, duration: 360 },
    cleanup: 1200
  });

  function queryAll(root, selector) {
    if (!root) return [];
    if (typeof root.querySelectorAll === "function") return Array.from(root.querySelectorAll(selector));
    return [];
  }

  function motionRoot(root) {
    if (root && root.nodeType === 1) return root;
    if (root && root.documentElement) return root.documentElement;
    return document.documentElement;
  }

  function readStoredReducedMotion() {
    try {
      const raw = window.localStorage?.getItem(PREF_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.reducedMotion);
    } catch (_) {
      return false;
    }
  }

  function isReducedMotion() {
    try {
      if (typeof window.isReducedMotionPreferred === "function") {
        return Boolean(window.isReducedMotionPreferred());
      }
      if (typeof window.getApplicationMotionPreferenceState === "function") {
        return Boolean(window.getApplicationMotionPreferenceState()?.effectiveReduced);
      }
    } catch (_) {
      /* Fall through to the same persisted preference used by js/storage.js. */
    }
    const systemReduced = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return Boolean(systemReduced || readStoredReducedMotion());
  }

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, Math.max(0, ms)));
  }

  function releaseClass(el, activeClass, duration, entered = true) {
    window.setTimeout(() => {
      el.classList.remove(activeClass);
      if (entered) el.classList.add("sd-entered");
    }, Math.max(0, duration) + 34);
  }

  function trigger(el, className, duration, delay = 0, entered = true) {
    window.setTimeout(() => {
      el.classList.add(className);
      releaseClass(el, className, duration, entered);
    }, Math.max(0, delay));
  }

  function triggerEnter(el, delay, duration) {
    window.setTimeout(() => {
      el.classList.add("sd-is-animating");
      releaseClass(el, "sd-is-animating", duration, true);
    }, Math.max(0, delay));
  }

  function setReducedDataset(rootEl, reduced) {
    const html = document.documentElement;
    if (html) html.dataset.motionReduced = reduced ? "true" : "false";
    if (rootEl && rootEl !== html) rootEl.dataset.sdMotionReduced = reduced ? "true" : "false";
  }

  /**
   * Run the shared entrance order from data attributes.
   * Core attributes: scene, character-left, character-right, title, panel, button.
   * Optional reward attributes: crown, card, slam.
   */
  function sdEnter(root = document) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : document;
    const rootEl = motionRoot(root);
    const reduced = isReducedMotion();
    const fadeMs = REDUCED_MS;

    rootEl.classList.add("sd-motion-ready");
    setReducedDataset(rootEl, reduced);

    const all = queryAll(scope, "[data-sd-enter]");
    all.forEach(el => {
      el.classList.remove(
        "sd-entered",
        "sd-is-animating",
        "sd-is-pulsing",
        "sd-is-popping",
        "sd-is-flipping",
        "sd-is-slamming",
        "sd-is-glinting"
      );
    });

    if (reduced) {
      all.forEach(el => triggerEnter(el, 0, fadeMs));
      window.setTimeout(() => rootEl.classList.remove("sd-motion-ready"), fadeMs + 50);
      return { reduced: true, duration: fadeMs };
    }

    queryAll(scope, '[data-sd-enter="scene"]').forEach(el => {
      triggerEnter(el, TIMING.scene.delay, TIMING.scene.duration);
    });

    queryAll(scope, '[data-sd-enter="character-left"], [data-sd-enter="character-right"]').forEach(el => {
      triggerEnter(el, TIMING.character.delay, TIMING.character.duration);
    });

    queryAll(scope, '[data-sd-enter="title"]').forEach(el => {
      triggerEnter(el, TIMING.title.delay, TIMING.title.duration);
      window.setTimeout(() => {
        el.classList.add("sd-is-glinting");
        releaseClass(el, "sd-is-glinting", 420, false);
      }, 640);
    });

    queryAll(scope, '[data-sd-enter="panel"]').forEach((el, index) => {
      const staggerIndex = Math.min(index, 5);
      el.style.setProperty("--i", String(staggerIndex));
      triggerEnter(el, TIMING.panel.delay + (staggerIndex * TIMING.panel.stagger), TIMING.panel.duration);
    });

    queryAll(scope, '[data-sd-enter="button"]').forEach(el => {
      trigger(el, "sd-is-pulsing", TIMING.button.duration, TIMING.button.delay, true);
    });

    queryAll(scope, '[data-sd-enter="crown"]').forEach(el => {
      trigger(el, "sd-is-popping", TIMING.crown.duration, TIMING.crown.delay, true);
    });

    queryAll(scope, '[data-sd-enter="card"]').forEach(el => {
      trigger(el, "sd-is-flipping", TIMING.card.duration, TIMING.card.delay, true);
    });

    queryAll(scope, '[data-sd-enter="slam"]').forEach(el => {
      trigger(el, "sd-is-slamming", TIMING.slam.duration, TIMING.slam.delay, true);
    });

    window.setTimeout(() => rootEl.classList.remove("sd-motion-ready"), TIMING.cleanup);
    return { reduced: false, duration: TIMING.cleanup };
  }

  /** Animate a numeric text node without changing layout. */
  function sdCountUp(el, to, ms = 500) {
    if (!el) return Promise.resolve(false);
    const target = Number(to);
    if (!Number.isFinite(target)) return Promise.resolve(false);

    const duration = Math.max(0, Number(ms) || 0);
    const reduced = isReducedMotion();
    const sourceText = String(el.textContent || "").replace(/[^0-9+\-.]/g, "");
    const from = Number.parseFloat(sourceText);
    const startValue = Number.isFinite(from) ? from : 0;
    const decimals = Number.isInteger(target) ? 0 : Math.min(2, Math.max(0, (String(target).split(".")[1] || "").length));
    const format = value => decimals ? value.toFixed(decimals) : String(Math.round(value));

    el.classList.add("sd-count-up");
    el.setAttribute("aria-label", format(target));

    if (reduced || duration === 0) {
      el.textContent = format(target);
      el.classList.add("sd-count-complete");
      window.setTimeout(() => el.classList.remove("sd-count-complete"), REDUCED_MS + 40);
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(startValue + ((target - startValue) * eased));
        if (p < 1) {
          requestAnimationFrame(tick);
          return;
        }
        el.textContent = format(target);
        el.classList.add("sd-count-complete");
        window.setTimeout(() => el.classList.remove("sd-count-complete"), 300);
        resolve(true);
      };
      requestAnimationFrame(tick);
    });
  }

  /** Gold particle burst. Coordinates are CSS pixels within the canvas. */
  function sdBurst(canvas, x, y, opts = {}) {
    if (!canvas || typeof canvas.getContext !== "function" || isReducedMotion()) {
      return Promise.resolve(false);
    }

    const count = Math.max(1, Math.min(60, Number(opts.count) || 36));
    const duration = Math.max(120, Math.min(900, Number(opts.duration) || 900));
    const gravity = Number.isFinite(Number(opts.gravity)) ? Number(opts.gravity) : 680;
    const spread = Number.isFinite(Number(opts.spread)) ? Number(opts.spread) : Math.PI * 1.65;
    const speedMin = Number.isFinite(Number(opts.speedMin)) ? Number(opts.speedMin) : 120;
    const speedMax = Number.isFinite(Number(opts.speedMax)) ? Number(opts.speedMax) : 330;
    const color = opts.color || getComputedStyle(document.documentElement).getPropertyValue("--sd-gold-500").trim() || "#f5c518";
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(false);

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (-Math.PI / 2) + ((Math.random() - .5) * spread);
      const speed = speedMin + (Math.random() * Math.max(0, speedMax - speedMin));
      return {
        x: Number(x) || rect.width / 2,
        y: Number(y) || rect.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + (Math.random() * 3.5),
        spin: (Math.random() - .5) * 8,
        phase: i * .61
      };
    });

    return new Promise(resolve => {
      const t0 = performance.now();
      const frame = now => {
        const elapsedMs = now - t0;
        const t = Math.min(1, elapsedMs / duration);
        const sec = elapsedMs / 1000;
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(t, 1.55));
        ctx.fillStyle = color;

        for (const p of particles) {
          const px = p.x + (p.vx * sec);
          const py = p.y + (p.vy * sec) + (.5 * gravity * sec * sec);
          const s = p.size * (1 - (.35 * t));
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.phase + (p.spin * sec));
          ctx.fillRect(-s / 2, -s / 2, s, s * .62);
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        if (t < 1) {
          requestAnimationFrame(frame);
          return;
        }
        ctx.clearRect(0, 0, rect.width, rect.height);
        resolve(true);
      };
      requestAnimationFrame(frame);
    });
  }

  /** Pack-rip reveal: 300 ms anticipation → flash → settle. */
  async function sdReveal(el) {
    if (!el) return false;
    el.classList.add("sd-reveal-target");

    if (isReducedMotion()) {
      el.classList.add("sd-reveal-settling");
      await wait(REDUCED_MS);
      el.classList.remove("sd-reveal-settling");
      return true;
    }

    el.classList.add("sd-reveal-anticipating");
    await wait(300);
    el.classList.remove("sd-reveal-anticipating");
    el.classList.add("sd-reveal-flashing");
    await wait(90);
    el.classList.remove("sd-reveal-flashing");
    el.classList.add("sd-reveal-settling", "sd-is-glinting");
    await wait(420);
    el.classList.remove("sd-reveal-settling", "sd-is-glinting");
    return true;
  }

  window.sdEnter = sdEnter;
  window.sdCountUp = sdCountUp;
  window.sdBurst = sdBurst;
  window.sdReveal = sdReveal;
  window.ShowdownMotion = Object.freeze({
    sdEnter,
    sdCountUp,
    sdBurst,
    sdReveal,
    isReducedMotion,
    timing: TIMING
  });
})();
