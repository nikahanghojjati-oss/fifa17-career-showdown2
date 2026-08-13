const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/restore.js", "utf8");

function clone(value){ return JSON.parse(JSON.stringify(value)); }
function analysis(payload){
    return {
        ok: true,
        checksum: { verified: true, algorithm: "SHA-256" },
        migratedPayload: clone(payload),
        warnings: [],
        errors: []
    };
}
function createRuntime(overrides = {}){
    const calls = [];
    const window = { ...overrides };
    window.window = window;
    const context = vm.createContext({ window, console, JSON, Object, Array, String, Boolean, Error, Map, Set, Promise });
    vm.runInContext(source, context, { filename: "js/restore.js" });
    return { window, calls };
}
function json(raw){ return raw === null ? null : JSON.parse(raw); }

(async () => {
    assert.ok(!/\blocalStorage\b/.test(source), "Restore planner/orchestrator must not own browser storage.");
    assert.ok(!/\bfetch\s*\(/.test(source), "Candidate C restore must remain local and network-free.");
    assert.ok(source.includes("window.analyzeCareerModeBackupFile(confirmedFile)"), "Apply must freshly re-run Candidate B analysis from the immutable confirmed File.");
    assert.ok(source.indexOf("flushPendingApplicationWrites") < source.indexOf("analyzeCareerModeBackupFile(confirmedFile)"), "Pending writes must flush before fresh Apply-time analysis.");
    assert.ok(source.includes("captureCareerModeRawRestoreSnapshot"), "Apply must require the exact restore snapshot authority.");
    assert.equal(source.includes("captureCareerModeRawBackupInputs"), false, "Candidate C must not fall back to the lossy backup reader for mutation authority.");
    assert.ok(source.indexOf("captureStrictRaw") < source.indexOf("applyCareerModeRawStorageTransaction"), "Fresh raw state must be captured before the storage transaction begins.");

    const runtime = createRuntime();
    const createPlan = runtime.window.createCareerModeRestorePlan;
    const payload = {
        activeShowdown: { id: "backup-active", schemaVersion: 2, name: "Backup Active" },
        legacyShowdowns: [
            { id: "same", schemaVersion: 2, name: "Identical" },
            { id: "new", schemaVersion: 2, name: "New History" },
            { id: "conflict", schemaVersion: 2, name: "Backup Conflict", updatedAt: "2026-08-01" }
        ],
        preferences: { schemaVersion: 2, reducedMotion: true, menuFeedback: false }
    };
    const currentRaw = {
        activeShowdown: JSON.stringify({ id: "local-active", schemaVersion: 2, name: "Local Active" }),
        legacyShowdowns: JSON.stringify([
            { id: "local", schemaVersion: 2, name: "Local History" },
            { id: "same", schemaVersion: 2, name: "Identical" },
            { id: "conflict", schemaVersion: 2, name: "Local Conflict", updatedAt: "2026-07-01" }
        ]),
        preferences: JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true })
    };

    const missingChoices = createPlan(analysis(payload), currentRaw, {});
    assert.equal(missingChoices.ok, false);
    assert.equal(missingChoices.status, "choice-required");
    assert.equal(Object.keys(missingChoices.candidateRaw).length, 0, "No raw commit plan may exist before top-level choices are explicit.");

    const conflictRequired = createPlan(analysis(payload), currentRaw, {
        active: "keep-current",
        legacy: "merge",
        preferences: "keep-current",
        legacyConflicts: {}
    });
    assert.equal(conflictRequired.ok, false);
    assert.equal(conflictRequired.status, "conflict-choice-required");
    assert.deepEqual(Array.from(conflictRequired.conflicts, conflict => conflict.id), ["conflict"]);
    assert.equal(Object.keys(conflictRequired.candidateRaw).length, 0, "An unresolved Legacy conflict must block the entire candidate raw plan.");

    const keepConflict = createPlan(analysis(payload), currentRaw, {
        active: "keep-current",
        legacy: "merge",
        preferences: "keep-current",
        legacyConflicts: { conflict: "keep-local" }
    });
    assert.equal(keepConflict.ok, true);
    assert.deepEqual(Object.keys(keepConflict.candidateRaw), ["legacyShowdowns"]);
    const keptLegacy = json(keepConflict.candidateRaw.legacyShowdowns);
    assert.deepEqual(keptLegacy.map(record => record.id), ["local", "same", "conflict", "new"]);
    assert.equal(keptLegacy.find(record => record.id === "conflict").name, "Local Conflict");
    assert.equal(keptLegacy.filter(record => record.id === "same").length, 1, "Exact duplicates must not multiply.");
    assert.deepEqual(Array.from(keepConflict.summary.legacyAdded), ["new"]);
    assert.ok(Array.from(keepConflict.summary.legacySkipped).includes("same"));
    assert.ok(Array.from(keepConflict.summary.legacySkipped).includes("conflict"));

    const useBackupConflict = createPlan(analysis(payload), currentRaw, {
        active: "use-backup",
        legacy: "merge",
        preferences: "use-backup",
        legacyConflicts: { conflict: "use-backup" }
    });
    assert.equal(useBackupConflict.ok, true);
    assert.equal(json(useBackupConflict.candidateRaw.activeShowdown).id, "backup-active");
    assert.equal(json(useBackupConflict.candidateRaw.preferences).reducedMotion, true);
    const replacedLegacy = json(useBackupConflict.candidateRaw.legacyShowdowns);
    assert.equal(replacedLegacy.find(record => record.id === "conflict").name, "Backup Conflict");
    assert.equal(replacedLegacy.filter(record => record.id === "conflict").length, 1);
    assert.deepEqual(Array.from(useBackupConflict.summary.legacyReplaced), ["conflict"]);

    const repeatRaw = {
        activeShowdown: useBackupConflict.candidateRaw.activeShowdown,
        legacyShowdowns: useBackupConflict.candidateRaw.legacyShowdowns,
        preferences: useBackupConflict.candidateRaw.preferences
    };
    const repeated = createPlan(analysis(payload), repeatRaw, {
        active: "use-backup",
        legacy: "merge",
        preferences: "use-backup",
        legacyConflicts: { conflict: "use-backup" }
    });
    assert.equal(repeated.ok, true);
    assert.equal(
        Object.prototype.hasOwnProperty.call(repeated.candidateRaw, "legacyShowdowns"),
        false,
        "Repeated identical Legacy restore planning must emit no Legacy rewrite at all."
    );
    assert.deepEqual(Array.from(repeated.summary.legacyAdded), []);
    assert.deepEqual(Array.from(repeated.summary.legacyReplaced), []);
    assert.ok(Array.from(repeated.summary.legacySkipped).includes("same"));
    assert.ok(Array.from(repeated.summary.legacySkipped).includes("new"));
    assert.ok(Array.from(repeated.summary.legacySkipped).includes("conflict"));

    const duplicatePayload = clone(payload);
    duplicatePayload.legacyShowdowns = [
        { id: "dup", schemaVersion: 2, name: "One" },
        { id: "dup", schemaVersion: 2, name: "One" }
    ];
    const deduped = createPlan(analysis(duplicatePayload), { ...currentRaw, legacyShowdowns: "[]" }, {
        active: "keep-current", legacy: "merge", preferences: "keep-current", legacyConflicts: {}
    });
    assert.equal(deduped.ok, true);
    assert.equal(json(deduped.candidateRaw.legacyShowdowns).length, 1, "Identical duplicate records inside the backup must collapse deterministically during restore planning.");

    const conflictingBackup = clone(payload);
    conflictingBackup.legacyShowdowns = [
        { id: "dup", schemaVersion: 2, name: "One" },
        { id: "dup", schemaVersion: 2, name: "Two" }
    ];
    const blockedInternalConflict = createPlan(analysis(conflictingBackup), { ...currentRaw, legacyShowdowns: "[]" }, {
        active: "keep-current", legacy: "replace-with-backup", preferences: "keep-current", legacyConflicts: {}
    });
    assert.equal(blockedInternalConflict.ok, false, "Conflicting same-ID records inside a backup must never reach a raw commit plan.");

    const corruptLegacy = { ...currentRaw, legacyShowdowns: "{broken" };
    const unsafeMerge = createPlan(analysis(payload), corruptLegacy, {
        active: "keep-current", legacy: "merge", preferences: "keep-current", legacyConflicts: { conflict: "use-backup" }
    });
    assert.equal(unsafeMerge.ok, false);
    assert.equal(unsafeMerge.status, "choice-blocked");
    assert.match(unsafeMerge.errors.join(" "), /unreadable/i);
    const explicitReplace = createPlan(analysis(payload), corruptLegacy, {
        active: "keep-current", legacy: "replace-with-backup", preferences: "keep-current", legacyConflicts: {}
    });
    assert.equal(explicitReplace.ok, true);
    assert.ok(explicitReplace.warnings.some(message => /Unreadable current Legacy bytes/i.test(message)));

    const nullPayload = { activeShowdown: null, legacyShowdowns: null, preferences: null };
    const matchEmptyBackup = createPlan(analysis(nullPayload), currentRaw, {
        active: "use-backup", legacy: "replace-with-backup", preferences: "use-backup", legacyConflicts: {}
    });
    assert.equal(matchEmptyBackup.ok, true);
    assert.equal(matchEmptyBackup.candidateRaw.activeShowdown, null);
    assert.equal(matchEmptyBackup.candidateRaw.legacyShowdowns, null);
    assert.equal(matchEmptyBackup.candidateRaw.preferences, null);

    const blockedAnalysis = createPlan({ ok: false, checksum: { verified: false } }, currentRaw, {
        active: "use-backup", legacy: "merge", preferences: "use-backup"
    });
    assert.equal(blockedAnalysis.ok, false);
    assert.equal(blockedAnalysis.status, "analysis-blocked");

    const applyCalls = [];
    const freshAnalysis = analysis({ activeShowdown: { id: "fresh", schemaVersion: 2 }, legacyShowdowns: [], preferences: { schemaVersion: 2, reducedMotion: false, menuFeedback: true } });
    const applyRuntime = createRuntime({
        flushPendingApplicationWrites(){ applyCalls.push("flush"); return true; },
        async analyzeCareerModeBackupFile(file){ applyCalls.push(`analyze:${file.name}`); return freshAnalysis; },
        captureCareerModeRawRestoreSnapshot(){ applyCalls.push("snapshot"); return { ok: true, raw: { activeShowdown: null, legacyShowdowns: "[]", preferences: null }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(candidateRaw){ applyCalls.push("transaction"); return { ok: true, status: "success", affectedKeys: Object.keys(candidateRaw) }; }
    });
    const applied = await applyRuntime.window.applyCareerModeRestore({ name: "fresh.json" }, {
        active: "use-backup", legacy: "merge", preferences: "use-backup", legacyConflicts: {}
    });
    assert.equal(applied.ok, true);
    assert.equal(applied.status, "success");
    assert.deepEqual(applyCalls, ["flush", "analyze:fresh.json", "snapshot", "transaction"], "Apply sequence must flush → fresh analyze → fresh raw snapshot → transaction.");

    let looseSnapshotCalled = false;
    let missingStrictTransactionCalled = false;
    const strictMissingRuntime = createRuntime({
        flushPendingApplicationWrites(){ return true; },
        async analyzeCareerModeBackupFile(){ return freshAnalysis; },
        captureCareerModeRawBackupInputs(){ looseSnapshotCalled = true; return { activeShowdown: null, legacyShowdowns: "[]", preferences: null }; },
        applyCareerModeRawStorageTransaction(){ missingStrictTransactionCalled = true; return { ok: true, status: "success" }; }
    });
    const strictMissing = await strictMissingRuntime.window.applyCareerModeRestore({ name: "missing-strict.json" }, {
        active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {}
    });
    assert.equal(strictMissing.ok, false);
    assert.equal(strictMissing.status, "snapshot-unavailable");
    assert.equal(looseSnapshotCalled, false, "Missing strict authority must never consult the loose backup reader.");
    assert.equal(missingStrictTransactionCalled, false, "Missing strict authority must fail before any storage transaction.");

    let releaseAnalysis;
    const pendingAnalysis = new Promise(resolve => { releaseAnalysis = resolve; });
    const busyRuntime = createRuntime({
        flushPendingApplicationWrites(){ return true; },
        analyzeCareerModeBackupFile(){ return pendingAnalysis; },
        captureCareerModeRawRestoreSnapshot(){ return { ok: true, raw: { activeShowdown: null, legacyShowdowns: "[]", preferences: null }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(){ return { ok: true, status: "success", affectedKeys: [] }; }
    });
    const firstApply = busyRuntime.window.applyCareerModeRestore({ name: "one.json" }, {
        active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {}
    });
    const secondApply = await busyRuntime.window.applyCareerModeRestore({ name: "two.json" }, {
        active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {}
    });
    assert.equal(secondApply.ok, false);
    assert.equal(secondApply.status, "busy", "Rapid second Apply must be a no-op while fresh analysis/transaction is in flight.");
    releaseAnalysis(analysis({ activeShowdown: null, legacyShowdowns: [], preferences: null }));
    assert.equal((await firstApply).ok, true);
    assert.equal(busyRuntime.window.isCareerModeRestoreInFlight(), false);

    const txFailRuntime = createRuntime({
        flushPendingApplicationWrites(){ return true; },
        async analyzeCareerModeBackupFile(){ return freshAnalysis; },
        captureCareerModeRawRestoreSnapshot(){ return { ok: true, raw: { activeShowdown: null, legacyShowdowns: "[]", preferences: null }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(){ return { ok: false, status: "rollback-failed-critical", rollbackVerified: false }; }
    });
    const txFailed = await txFailRuntime.window.applyCareerModeRestore({ name: "failure.json" }, {
        active: "use-backup", legacy: "merge", preferences: "use-backup", legacyConflicts: {}
    });
    assert.equal(txFailed.ok, false);
    assert.equal(txFailed.status, "rollback-failed-critical", "Critical rollback failure must propagate unchanged to recovery UX.");

    process.stdout.write("PASS  Candidate C restore planning, conflict, freshness, strict snapshot, idempotence and double-Apply contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});