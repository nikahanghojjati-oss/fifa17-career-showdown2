"use strict";
// A redraw (v10Redraw) replaces the Career Statistics stage, so OPEN TROPHY ROOM must not depend on a per-node listener.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../../js/careerScreensV10.js"),"utf8");
const wire=src.slice(src.indexOf("function v10Wire("),src.indexOf("function v10Wire(")+1800);
assert.ok(!/trophy\.addEventListener\("click"/.test(wire),"no per-node trophy listener (lost when the stage is replaced)");
assert.ok(/root\.document\?\.addEventListener\?\.\("click"[^]*closest\?\.\("#trophyRoomButton"\)[^]*openOptionalModule\("trophyRoom"\)/.test(wire),"one delegated document listener opens the Trophy Room");
assert.ok(/if\(!v10Wire\.tapBound\)\{v10Wire\.tapBound=true;/.test(wire),"the listener is bound once");
console.log("trophy-tap-delegated-contracts passed");
