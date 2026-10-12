"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "js/importAnalysis.js"), "utf8");
const context = vm.createContext({ window: {}, structuredClone, console });
vm.runInContext(source, context, { filename: "js/importAnalysis.js" });
const validate = context.window.validateCareerModeImportShowdownRecord;

const valid = {
    schemaVersion: 2,
    id: 1748,
    name: "Saved career",
    managers: { playerOne: "Daniel", playerTwo: "Nik" },
    totalRounds: 3,
    currentRound: 1,
    status: "Created",
    selectedLeague: null,
    clubs: { playerOne: null, playerTwo: null },
    score: { playerOne: 0, playerTwo: 7 },
    transferChallenges: [],
    rounds: [],
    integrityWarnings: [],
    createdAt: null,
    updatedAt: null,
    completedAt: null,
    archivedAt: null
};
assert.equal(validate(valid).ok, true, "real numeric scores stay valid");

for(const bad of [null, "", "0", false]){
    const backup = structuredClone(valid);
    backup.score.playerOne = bad;
    const analyzed = validate(backup);
    assert.equal(analyzed.ok, false, "non-numeric saved score must block restore: " + String(bad));
    assert.equal(analyzed.value, null, "blocked backup must not expose a restorable career");
    assert.ok(analyzed.errors.includes("Showdown score is invalid."), "use the existing score validation message");
}

const older = structuredClone(valid);
older.schemaVersion = 1;
older.score = { playerOne: "5", playerTwo: "2" };
const migrated = validate(older);
assert.equal(migrated.ok, true, "legacy schema 1 scores still migrate");
assert.equal(migrated.value.score.playerOne, 5);
assert.equal(migrated.value.score.playerTwo, 2);
assert.deepEqual(Array.from(migrated.steps), ["showdown-schema-1-to-2"]);

console.log("PASS import analysis rejects invalid current career scores and retains older career score migration");
