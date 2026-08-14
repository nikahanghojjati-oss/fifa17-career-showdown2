const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
globalThis.crypto = webcrypto;
const foundation = require("../../js/saveLibraryFoundation.js");

function showdown(id, one = "Alex", two = "Sam", status = "In Progress"){
    return {
        schemaVersion: 2,
        id,
        name: `Showdown ${id}`,
        managers: { playerOne: one, playerTwo: two },
        totalRounds: 3,
        currentRound: 2,
        status,
        selectedLeague: { id: "premier-league", name: "Premier League" },
        clubs: { playerOne: "Chelsea", playerTwo: "Liverpool" },
        score: { playerOne: 1, playerTwo: 0 },
        transferChallenges: [],
        rounds: [{ roundNumber: 1, playerOne: {}, playerTwo: {} }],
        integrityWarnings: [],
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
        completedAt: status === "Completed" ? "2026-08-02T00:00:00.000Z" : null,
        archivedAt: null
    };
}

(async () => {
    assert.equal(foundation.SAVE_LIBRARY_STORAGE_KEY, "careerModeShowdown.saveLibrary");
    assert.equal(foundation.LEGACY_ACTIVE_STORAGE_KEY, "careerModeShowdown.activeShowdown");

    const activeOnly = await foundation.buildRawSingletonMigrationPlan({
        saveLibrary: null,
        activeShowdown: JSON.stringify(showdown(1700000000000, "Nik", "Matt")),
        legacyShowdowns: "[]",
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    });
    assert.equal(activeOnly.ok, true);
    assert.equal(activeOnly.status, "ready");
    assert.equal(activeOnly.library.saves.length, 1);
    assert.equal(activeOnly.library.profiles.length, 2);
    assert.notEqual(activeOnly.library.profiles[0].profileId, activeOnly.library.profiles[1].profileId, "Two manager roles must never collapse merely because names could match.");
    assert.equal(activeOnly.library.activeSaveId, activeOnly.library.saves[0].saveId);
    assert.equal(activeOnly.library.saves[0].showdown.identity.saveId, activeOnly.library.activeSaveId);
    assert.equal(activeOnly.library.saves[0].showdown.rounds[0].seasonId.startsWith("season_"), true);
    assert.equal(activeOnly.candidateRaw.activeShowdown, null, "The migration candidate must retire the singleton active slot only as part of the atomic candidate plan.");
    assert.equal(activeOnly.expectedRaw.preferences.includes("schemaVersion"), true, "Preferences remain an exact raw precondition even though this migration does not rewrite them.");

    const repeated = await foundation.buildRawSingletonMigrationPlan({
        saveLibrary: null,
        activeShowdown: JSON.stringify(showdown(1700000000000, "Nik", "Matt")),
        legacyShowdowns: "[]",
        preferences: null
    });
    assert.equal(repeated.library.activeSaveId, activeOnly.library.activeSaveId, "Legacy ID migration must be deterministic across repeated previews.");
    assert.equal(repeated.library.profiles[0].profileId, activeOnly.library.profiles[0].profileId, "Profile migration must be deterministic across repeated previews.");
    assert.equal(repeated.library.saves[0].showdown.rounds[0].seasonId, activeOnly.library.saves[0].showdown.rounds[0].seasonId, "Season migration must be deterministic across repeated previews.");

    const sameName = await foundation.buildSingletonMigrationPlan({
        activeShowdown: showdown(1700000000001, "Alex", "Alex"),
        legacyShowdowns: [showdown(1700000000002, "Alex", "Alex", "Completed")]
    });
    assert.equal(sameName.ok, true);
    assert.equal(sameName.library.profiles.length, 2);
    assert.notEqual(sameName.library.profiles[0].profileId, sameName.library.profiles[1].profileId, "Identical display names in different manager roles must still produce separate profiles.");
    assert.equal(sameName.mappingRequired.length, 1, "Historical Legacy names must require explicit mapping instead of automatic name equality.");
    assert.equal(sameName.legacyShowdowns[0].identity.managerProfileIds.playerOne, null);
    assert.equal(sameName.legacyShowdowns[0].identity.managerProfileIds.playerTwo, null);

    const activeLegacySameIdentity = await foundation.buildSingletonMigrationPlan({
        activeShowdown: showdown(1700000000003, "Nik", "Matt", "Completed"),
        legacyShowdowns: [{ ...showdown(1700000000003, "Nik", "Matt", "Completed"), archivedAt: "2026-08-03T00:00:00.000Z" }]
    });
    assert.equal(activeLegacySameIdentity.ok, true);
    assert.equal(activeLegacySameIdentity.relationships.activeMatchesLegacy, true);
    assert.equal(activeLegacySameIdentity.mappingRequired.length, 0, "A Legacy record with the exact existing Showdown identity may reuse the active record's explicit profile mapping.");
    assert.equal(activeLegacySameIdentity.legacyShowdowns[0].identity.managerProfileIds.playerOne, activeLegacySameIdentity.library.profiles[0].profileId);

    const duplicate = showdown(1700000000004, "A", "B", "Completed");
    const exactDuplicate = await foundation.buildSingletonMigrationPlan({
        activeShowdown: null,
        legacyShowdowns: [duplicate, JSON.parse(JSON.stringify(duplicate))]
    });
    assert.equal(exactDuplicate.ok, true);
    assert.equal(exactDuplicate.legacyShowdowns.length, 1);
    assert.equal(exactDuplicate.library.migration.exactLegacyDuplicatesRemoved, 1);

    const conflicting = await foundation.buildSingletonMigrationPlan({
        activeShowdown: null,
        legacyShowdowns: [duplicate, { ...JSON.parse(JSON.stringify(duplicate)), name: "Conflicting revision" }]
    });
    assert.equal(conflicting.ok, false);
    assert.equal(conflicting.status, "legacy-conflict", "Same legacy ID with different content must block migration rather than pick a winner.");

    const malformedSeason = await foundation.buildRawSingletonMigrationPlan({
        saveLibrary: null,
        activeShowdown: JSON.stringify({ ...showdown(1700000000005), rounds: [{ roundNumber: 1 }, { roundNumber: 1 }] }),
        legacyShowdowns: "[]",
        preferences: null
    });
    assert.equal(malformedSeason.ok, false);
    assert.equal(malformedSeason.status, "identity-migration-unavailable");
    assert.deepEqual(malformedSeason.candidateRaw, {}, "Ambiguous Season identity must fail before a storage candidate exists.");

    const corrupt = await foundation.buildRawSingletonMigrationPlan({
        saveLibrary: null,
        activeShowdown: "{broken",
        legacyShowdowns: "[]",
        preferences: null
    });
    assert.equal(corrupt.ok, false);
    assert.equal(corrupt.status, "source-corrupt");
    assert.deepEqual(corrupt.candidateRaw, {}, "Corrupt source bytes must produce no mutation candidate.");

    const already = await foundation.buildRawSingletonMigrationPlan({
        saveLibrary: activeOnly.candidateRaw.saveLibrary,
        activeShowdown: activeOnly.expectedRaw.activeShowdown,
        legacyShowdowns: activeOnly.candidateRaw.legacyShowdowns,
        preferences: null
    });
    assert.equal(already.ok, true);
    assert.equal(already.status, "already-migrated");
    assert.deepEqual(already.candidateRaw, {}, "A valid existing Save Library must make migration idempotent and non-mutating.");

    process.stdout.write("PASS save-library foundation: deterministic identities, explicit historical mapping, conflict blocking and raw migration planning\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
