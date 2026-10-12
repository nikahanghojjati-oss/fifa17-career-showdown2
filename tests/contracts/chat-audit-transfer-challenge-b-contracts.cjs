"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../js/transferChallenge.js"), "utf8");
const listeners = new Map();
let activeTick = null;
let intervalStarts = 0;
let saves = 0;
const challenge = {
    seasonNumber: 1,
    status: "active",
    phase: "window",
    deadlineAt: Date.now() + 60_000,
    endedEarly: false,
    endedAt: null,
    signings: { playerOne: [], playerTwo: [] },
    guesses: { againstPlayerOne: [], againstPlayerTwo: [] }
};
const currentShowdown = { currentRound: 1, status: "Transfer Window Active" };
const document = {
    visibilityState: "visible",
    getElementById: () => null,
    addEventListener(name, handler){
        if(!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(handler);
    }
};
const sandbox = {
    console,
    document,
    currentShowdown,
    getActiveScreenName: () => "transferChallenge",
    getTransferChallengeForSeason: () => challenge,
    cloneForStorage: value => JSON.parse(JSON.stringify(value)),
    saveCurrentShowdown: () => { saves += 1; return true; },
    window: {
        setInterval(handler){ activeTick = handler; return ++intervalStarts; },
        clearInterval(){ activeTick = null; },
        clearTimeout(){},
        setTimeout(){}
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/transferChallenge.js" });

// Keep the real timer and finish-window logic. Stub only screen construction.
vm.runInContext(
    "ensureTransferPhaseLayout=()=>{};cacheTransferFields=()=>{};cacheTransferUI=()=>({});enhanceTransferChallengeSelectors=()=>{};renderTransferChallenge=()=>{};restoreTransferForm=()=>{};",
    sandbox
);
sandbox.window.initializeTransferChallenge();
sandbox.window.initializeTransferChallenge();
assert.equal((listeners.get("visibilitychange") || []).length, 1,
    "Transfer timer must install exactly one tab-return handler");

sandbox.window.startTransferTimerLoop();
assert.equal(typeof activeTick, "function", "active transfer window must start its clock");
document.visibilityState = "hidden";
activeTick();
assert.equal(activeTick, null, "hidden transfer window should pause its on-screen clock");

// The real deadline passes while the tab is in the background.
challenge.deadlineAt = Date.now() - 60_000;
document.visibilityState = "visible";
for(const listener of listeners.get("visibilitychange") || []) listener();
assert.equal(challenge.status, "recording",
    "returning to the transfer tab must close an expired window without another tap or refresh");
assert.equal(challenge.phase, "guess_entry");
assert.equal(challenge.endedEarly, false, "expiry after tab return is not an early end");
assert.equal(currentShowdown.status, "Transfer Guess Entry");
assert.equal(saves, 1, "deadline expiry on return must save the transition once");

const previousIntervals = intervalStarts;
for(const listener of listeners.get("visibilitychange") || []) listener();
assert.equal(intervalStarts, previousIntervals,
    "a closed window must not restart its timer on later tab visibility changes");

console.log("PASS transfer timer resumes on tab return and saves an expired window once");
