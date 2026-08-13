const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/restore.js", "utf8");

function createAnalysis(){
    return {
        ok: true,
        checksum: { verified: true, algorithm: "SHA-256" },
        migratedPayload: {
            activeShowdown: { schemaVersion: 2, id: "backup-active", name: "Backup Active" },
            legacyShowdowns: [],
            preferences: { schemaVersion: 2, reducedMotion: false, menuFeedback: true }
        },
        errors: [],
        warnings: []
    };
}

function createRuntime(currentRaw, calls){
    const window = {
        flushPendingApplicationWrites(){ calls.push("flush"); return true; },
        async analyzeCareerModeBackupFile(){ calls.push("analyze"); return createAnalysis(); },
        captureCareerModeRawRestoreSnapshot(){ calls.push("snapshot"); return { ok: true, raw: { ...currentRaw }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(candidateRaw){ calls.push("transaction"); return { ok: true, status: "success", affectedKeys: Object.keys(candidateRaw) }; }
    };
    window.window = window;
    const context = vm.createContext({ window, console, JSON, Object, Array, String, Boolean, Error, Map, Set, Promise });
    vm.runInContext(source, context, { filename: "js/restore.js" });
    return window;
}

(async () => {
    assert.ok(source.includes('status:"stale-state"'), "Candidate C must expose an explicit stale-state result before storage commit.");
    assert.ok(source.indexOf("compareReviewedRawState") < source.indexOf("applyCareerModeRawStorageTransaction(plan.candidateRaw,currentRaw)"), "Reviewed-state comparison must occur before the storage transaction boundary.");
    assert.ok(source.includes("transaction.failurePhase===\"precondition\""), "A last-moment storage precondition failure must also normalize into stale-state recovery.");

    const reviewedRaw = {
        activeShowdown: '{"id":"local-active"}',
        legacyShowdowns: '[{"id":"legacy-old"}]',
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
    const changedRaw = { ...reviewedRaw, legacyShowdowns: '[{"id":"legacy-changed"}]' };
    const calls = [];
    const runtime = createRuntime(changedRaw, calls);
    const blocked = await runtime.applyCareerModeRestore(
        { name: "backup.json" },
        { active: "use-backup", legacy: "merge", preferences: "use-backup", legacyConflicts: {} },
        { expectedRaw: reviewedRaw }
    );
    assert.equal(blocked.ok, false);
    assert.equal(blocked.status, "stale-state");
    assert.deepEqual(Array.from(blocked.changedKeys), ["legacyShowdowns"]);
    assert.deepEqual(calls, ["flush", "analyze", "snapshot"], "Stale reviewed bytes must abort before planning or transaction writes.");
    assert.equal(Object.prototype.hasOwnProperty.call(blocked, "transaction"), false);
    assert.equal(blocked.currentRaw.legacyShowdowns, changedRaw.legacyShowdowns);

    const matchingCalls = [];
    const matchingRuntime = createRuntime(reviewedRaw, matchingCalls);
    const allowed = await matchingRuntime.applyCareerModeRestore(
        { name: "backup.json" },
        { active: "use-backup", legacy: "keep-current", preferences: "use-backup", legacyConflicts: {} },
        { expectedRaw: reviewedRaw }
    );
    assert.equal(allowed.ok, true);
    assert.equal(allowed.status, "success");
    assert.deepEqual(matchingCalls, ["flush", "analyze", "snapshot", "transaction"], "Unchanged reviewed bytes may proceed to the storage-owned transaction.");

    const missingContextCalls = [];
    const legacyCompatibleRuntime = createRuntime(reviewedRaw, missingContextCalls);
    const compatible = await legacyCompatibleRuntime.applyCareerModeRestore(
        { name: "backup.json" },
        { active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {} }
    );
    assert.equal(compatible.ok, true, "Internal callers without review context remain compatible; the user-facing UI always supplies exact reviewed bytes.");
    assert.deepEqual(missingContextCalls, ["flush", "analyze", "snapshot", "transaction"]);

    process.stdout.write("PASS  Candidate C reviewed-state plus transaction-precondition stale Apply contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
