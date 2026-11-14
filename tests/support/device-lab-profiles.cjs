"use strict";
// The device lab's target devices (tests/browser/device-lab.cjs, PROFILES), for contracts. The lab script runs a browser
// when it is required, so its table is read from the source instead: one table, no second copy to drift.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = fs.readFileSync(path.resolve(__dirname, "../browser/device-lab.cjs"), "utf8");
const found = SRC.match(/\nconst PROFILES = (\{\n[\s\S]*?\n\});\n/);
if (!found) throw new Error("tests/browser/device-lab.cjs: the PROFILES table was not found");
const PROFILES = vm.runInNewContext(`(${found[1]})`);
for (const [key, p] of Object.entries(PROFILES)) {
  for (const field of ["renderer", "dpr", "cores", "maxBuffer", "maxTexture"]) if (p[field] === undefined) throw new Error(`device lab profile ${key} has no ${field}`);
  if (!(p.viewport && p.viewport.width > 0 && p.screen && p.screen.width > 0)) throw new Error(`device lab profile ${key} has no viewport or screen`);
}
// What a js/gfxTier.js sandbox needs from a profile. memory: what the page reads (Safari reports none).
function deviceOf(key) {
  const p = PROFILES[key];
  if (!p) throw new Error(`no device lab profile named ${key}`);
  return {gpu: p.renderer, dpr: p.dpr, memory: "memorySafari" in p ? (p.memorySafari ?? null) : p.memory, cores: p.cores,
    screen: [p.screen.width, p.screen.height], view: [p.viewport.width, p.viewport.height], maxBuffer: p.maxBuffer, maxTexture: p.maxTexture};
}
module.exports = {PROFILES, deviceOf};
