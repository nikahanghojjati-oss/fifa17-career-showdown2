"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../../js/showdownUI.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/showdownUI.js" });
const getSeriesStatusPresentation = vm.runInContext("getSeriesStatusPresentation", sandbox);

function expectSeriesStatus(one, two, status, expectedLabel, expectedClass) {
    const showdown = {
        score: { playerOne: one, playerTwo: two },
        managers: { playerOne: "Nik", playerTwo: "Daniel" },
        status
    };
    const actual = getSeriesStatusPresentation(showdown);
    assert.equal(actual.label, expectedLabel, `Incorrect chip label for ${status}, score ${one}-${two}`);
    assert.equal(actual.className, expectedClass, "Existing chip styling must stay the same");
}

// Before the fix, the first two cases produce LEADS and fail.
expectSeriesStatus(3, 1, "Completed", "NIK WINS", "series-lead-one");
expectSeriesStatus(1, 3, "Completed", "DANIEL WINS", "series-lead-two");
expectSeriesStatus(3, 1, "In Progress", "NIK LEADS", "series-lead-one");
expectSeriesStatus(1, 3, "In Progress", "DANIEL LEADS", "series-lead-two");
expectSeriesStatus(2, 2, "Completed", "SHOWDOWN LEVEL", "series-level");
expectSeriesStatus(2, 2, "In Progress", "LEVEL", "series-level");

console.log("PASS completed showdown WINS contracts: completed leaders win, running leaders lead, ties unchanged.");
