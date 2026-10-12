"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../js/showdownUI.js"), "utf8");
const ui = {
    lastPositionOne: { textContent: "" },
    lastPositionTwo: { textContent: "" },
    primaryButton: { textContent: "", disabled: false }
};
const sandbox = {
    window: {},
    getTransferChallengeForSeason: () => null
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/showdownUI.js" });
vm.runInContext("getDashboardUI = () => __ui", Object.assign(sandbox, { __ui: ui }));

const showdown = {
    name: "Daniel vs Nik",
    status: "Ready",
    totalRounds: 3,
    currentRound: 2,
    managers: { playerOne: "Daniel", playerTwo: "Nik" },
    clubs: { playerOne: "Club A", playerTwo: "Club B" },
    score: { playerOne: 0, playerTwo: 0 },
    selectedLeague: { name: "Premier League" },
    rounds: []
};

// A saved or restored partial last round is retained by normalizeShowdown;
// scoring skips it. Dashboard refresh must not crash when one player is absent.
sandbox.currentShowdown = { ...showdown, rounds: [
    { roundNumber: 1, playerOne: { leaguePosition: 2 }, playerTwo: null }
] };
assert.doesNotThrow(() => sandbox.window.updateShowdownUI(), "partial saved round must not crash Showdown Home");
assert.equal(ui.lastPositionOne.textContent, "No season completed");
assert.equal(ui.lastPositionTwo.textContent, "No season completed");

// Complete history must continue showing the same player positions.
sandbox.currentShowdown = { ...showdown, rounds: [
    { roundNumber: 1, playerOne: { leaguePosition: 2 }, playerTwo: { leaguePosition: 5 } }
] };
sandbox.window.updateShowdownUI();
assert.equal(ui.lastPositionOne.textContent, "Last league finish: 2");
assert.equal(ui.lastPositionTwo.textContent, "Last league finish: 5");
console.log("PASS Showdown UI partial saved round: refresh remains usable and valid league finishes are unchanged.");
