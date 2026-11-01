"use strict";
// Run the existing pixel/RAF transition audit at the five requested sizes.
// Only its viewport input changes; keep every assertion and timing threshold.
// The original audit is protected by #1137 and remains byte-for-byte unchanged.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const filename = path.resolve(
  __dirname,
  "../tests/browser/r87-transition-speed-audit.cjs",
);
const source = fs.readFileSync(filename, "utf8");
const start = source.indexOf("const viewports = [");
const end = source.indexOf("\n];", start);
if (start < 0 || end < 0)
  throw new Error("Transition audit viewport input changed");
const sizes = [
  [768, 1024],
  [820, 1180],
  [844, 390],
  [740, 360],
  [1920, 1080],
];
const viewports = sizes.map(([width, height]) => ({
  name: `${width}x${height}`,
  viewport: { width, height },
  deviceScaleFactor: 1,
}));
const runner = new Module(filename, module);
runner.filename = filename;
runner.paths = Module._nodeModulePaths(path.dirname(filename));
runner._compile(
  source.slice(0, start) +
    "const viewports = " +
    JSON.stringify(viewports) +
    ";" +
    source.slice(end + 3),
  filename,
);
