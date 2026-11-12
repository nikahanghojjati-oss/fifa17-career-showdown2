"use strict";
// r91 layout hunt (real two-manager run, Transfer War at 1920x866): once a manager had locked their signings, the card
// beside Nik's sealed card still read "Both sets of guesses are locked. Enter your own signings; ..." (the text of the
// step before). In the locked state it now says the signings are locked and hidden until the rival locks.
//   T1 the signing step's summary has three branches: replay, locked, entry
//   T2 the locked branch never tells a manager to enter signings
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.resolve(__dirname, "../../js/productionSharedTransferChallenge.js"), "utf8");
const m = /summary\.textContent=isReplay\?"([^"]+)":locked\?"([^"]+)":"([^"]+)";/.exec(source);
assert.ok(m, "T1 the summary picks replay, then locked, then entry");
const [, replay, locked, entry] = m;
assert.match(replay, /^Replay:/);
assert.match(entry, /Enter your own signings/);
assert.match(locked, /^Your signings are locked\./, "T2 the locked line says so");
assert.doesNotMatch(locked, /Enter your own signings/i, "T2 the locked line does not ask for signings");
console.log("r91 transfer locked copy contracts passed (2 checks)");
