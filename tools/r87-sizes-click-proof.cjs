"use strict";
// Synchronized screenshots at the actual Transfer taps. The background proof
// watcher can miss a short phase; this recorder runs before the driven click,
// never scrolls a page concurrently with a tap, and changes no game state.
const fs = require("node:fs");
const path = require("node:path");
const { probe } = require("./proof-sizes-hook.cjs");
if (process.env.PROOF_SIZES && process.env.FIRESTORE_EMULATOR_HOST) {
  const { chromium } = require("playwright");
  const launch = chromium.launch.bind(chromium);
  const seen = new Set();
  const out = path.resolve(process.env.PROOF_OUT);
  fs.mkdirSync(out, { recursive: true });
  let installed = false;
  chromium.launch = async (...args) => {
    const browser = await launch(...args);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...args) => {
      const context = await newContext(...args);
      const newPage = context.newPage.bind(context);
      context.newPage = async (...args) => {
        const page = await newPage(...args);
        if (!installed) {
          installed = true;
          const prototype = Object.getPrototypeOf(page.locator("body"));
          const click = prototype.click;
          prototype.click = async function (...args) {
            const selector = this.toString();
            const phase = /startTransferTimer/.test(selector)
              ? "before-window"
              : /endTransferTimer/.test(selector)
                ? "window"
                : /LOCK MY GUESSES/.test(selector)
                  ? "guesses"
                  : /LOCK MY SIGNINGS/.test(selector)
                    ? "signings"
                    : null;
            if (phase) {
              const current = this.page();
              const who = new URL(current.url()).searchParams.get(
                "cmsEmulatorUser",
              );
              const size = current.viewportSize();
              const key = `${who}-${size.width}x${size.height}-${phase}`;
              if (!seen.has(key)) {
                seen.add(key);
                await this.scrollIntoViewIfNeeded();
                await current.waitForTimeout(350);
                await current
                  .waitForFunction(
                    () =>
                      !document.getAnimations().some((animation) => {
                        const timing = animation.effect?.getComputedTiming();
                        return (
                          animation.playState === "running" &&
                          timing &&
                          Number.isFinite(timing.endTime)
                        );
                      }),
                    null,
                    { timeout: 6000 },
                  )
                  .catch(() => {});
                const paint = await this.evaluate((element) => {
                  const ancestors = [];
                  for (let node = element; node; node = node.parentElement) {
                    const css = getComputedStyle(node);
                    ancestors.push({
                      node: node.id || node.className || node.tagName,
                      opacity: css.opacity,
                      display: css.display,
                      visibility: css.visibility,
                    });
                  }
                  return {
                    rect: element.getBoundingClientRect().toJSON(),
                    ancestors,
                  };
                });
                const state = await current.evaluate(probe);
                const shot = `tap-${key}.png`;
                await current.screenshot({ path: path.join(out, shot) });
                fs.appendFileSync(
                  path.join(out, "taps.jsonl"),
                  JSON.stringify({ who, size, phase, shot, state, paint }) +
                    "\n",
                );
                if (
                  paint.ancestors.some(
                    (node) =>
                      Number(node.opacity) === 0 ||
                      node.display === "none" ||
                      node.visibility === "hidden",
                  )
                ) {
                  throw new Error(
                    `Transfer target is not painted after settling: ${key}`,
                  );
                }
              }
            }
            return click.apply(this, args);
          };
        }
        return page;
      };
      return context;
    };
    return browser;
  };
}
