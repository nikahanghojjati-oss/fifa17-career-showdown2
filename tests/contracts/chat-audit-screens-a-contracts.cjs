const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../js/screens.js"), "utf8");
const events = [];
const sandbox = {
    console,
    window: {
        flushTransferDraftSave(){ events.push("transfer-save"); return true; },
        flushScheduledCurrentShowdownSave(){ events.push("showdown-save"); return false; },
        stopTransferTimerLoop(){ events.push("stop-timer"); }
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/screens.js" });

const navigateAway = () => vm.runInContext(
    'flushScreenBeforeLeave("transferChallenge", "dashboard")', sandbox
);

assert.equal(navigateAway(), false, "failed showdown save must block the route");
assert.deepEqual(events, ["transfer-save", "showdown-save"],
    "a blocked exit must leave the visible transfer timer updating");

events.length = 0;
sandbox.window.flushScheduledCurrentShowdownSave = () => {
    events.push("showdown-save");
    return true;
};
assert.equal(navigateAway(), true, "successful saves must allow the route");
assert.deepEqual(events, ["transfer-save", "showdown-save", "stop-timer"],
    "the transfer timer must stop once the route may safely change");

console.log("PASS chat audit screens A: rejected routes retain transfer timer updates.");
