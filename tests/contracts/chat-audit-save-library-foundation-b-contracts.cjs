const assert = require("node:assert/strict");
const foundation = require("../../js/saveLibraryFoundation.js");

// Both manager roles may each own a different Local Profile, but not the same one.
// A library restored from a backup must be checked before it becomes active.
const p1 = "profile_" + "a".repeat(24);
const p2 = "profile_" + "b".repeat(24);
const saveId = "save_" + "c".repeat(24);
const library = {
    schemaVersion: 1,
    activeSaveId: saveId,
    profiles: [
        { profileId: p1, displayName: "Manager One" },
        { profileId: p2, displayName: "Manager Two" }
    ],
    saves: [{
        saveId,
        showdown: {
            identity: { saveId, managerProfileIds: { playerOne: p1, playerTwo: p2 } },
            rounds: [{ roundNumber: 1, seasonId: "season_" + "d".repeat(24) }]
        }
    }]
};

assert.deepEqual(foundation.validateSaveLibrary(library), [], "different profiles must remain valid");
library.saves[0].showdown.identity.managerProfileIds.playerTwo = p1;
assert.ok(
    foundation.validateSaveLibrary(library).some(error => /same Local Profile to both manager roles/.test(error)),
    "the same Local Profile must not represent both managers in one Showdown"
);
console.log("PASS save library manager identity contract");
