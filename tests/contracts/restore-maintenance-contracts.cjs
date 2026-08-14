const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const restoreSource = fs.readFileSync("js/restore.js", "utf8");
const uiSource = fs.readFileSync("js/restoreUI.js", "utf8");

function analysis(){
    return {
        ok: true,
        checksum: { verified: true, algorithm: "SHA-256" },
        migratedPayload: {
            activeShowdown: { id: "backup-active", schemaVersion: 2, name: "Backup Active" },
            legacyShowdowns: [],
            preferences: { schemaVersion: 2, reducedMotion: true, menuFeedback: false }
        },
        errors: [], warnings: []
    };
}
function runtime(overrides = {}){
    const window = { ...overrides };
    window.window = window;
    const context = vm.createContext({ window, console, JSON, Object, Array, String, Boolean, Error, Map, Set, Promise });
    vm.runInContext(restoreSource, context, { filename: "js/restore.js" });
    return window;
}

(async () => {
    assert.ok(restoreSource.includes("const confirmedFile=file"), "Apply must bind the exact File object before asynchronous revalidation.");
    assert.ok(restoreSource.includes("confirmedChoices=clone"), "Apply must deep-copy confirmed choices before the first await.");
    assert.ok(restoreSource.includes("confirmedExpectedRaw=clone"), "Apply must deep-copy the reviewed raw-state precondition.");
    assert.ok(restoreSource.indexOf("confirmedChoices=clone") < restoreSource.indexOf("await window.analyzeCareerModeBackupFile"), "Confirmed intent must freeze before fresh asynchronous analysis starts.");
    assert.ok(restoreSource.indexOf("confirmedExpectedRaw=clone") < restoreSource.indexOf("await window.analyzeCareerModeBackupFile"), "Reviewed raw-state intent must freeze before fresh asynchronous analysis starts.");
    assert.ok(restoreSource.includes("captureCareerModeRawRestoreSnapshot"), "Apply must prefer the strict storage snapshot authority.");
    assert.ok(restoreSource.includes("let candidateRaw=plan.candidateRaw,expectedRaw=currentRaw") && restoreSource.includes("window.applyCareerModeRawStorageTransaction(candidateRaw,expectedRaw,transactionOptions)"), "The transaction boundary must receive the exact planning snapshot, or the exact four-slot Save Library snapshot derived from it, as a storage precondition.");

    assert.ok(uiSource.includes("fileGeneration"), "Restore UI must version selected-file identity across asynchronous review.");
    assert.ok(uiSource.includes("setRestoreControlsLocked"), "Restore UI must lock decision controls during review/apply.");
    assert.ok(uiSource.includes("confirmedFile=file"), "Restore UI must bind the confirmed file before Apply.");
    assert.ok(uiSource.includes("confirmedChoices=cloneValue(choices)"), "Restore UI must bind the exact confirmed decision set.");
    assert.ok(uiSource.includes("reviewGeneration!==fileGeneration||reviewFile!==file"), "A stale async file review must be discarded instead of becoming current analysis authority.");
    assert.ok(uiSource.includes('root.querySelectorAll("input,select,.careerRestoreReviewButton,.careerRestoreApply")'), "File, review, choices and Apply controls must lock together.");

    const raw = {
        activeShowdown: '{"id":"local-active"}',
        legacyShowdowns: "[]",
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
    let releaseAnalysis;
    const gate = new Promise(resolve => { releaseAnalysis = resolve; });
    let committedPlan = null;
    let transactionExpected = null;
    const fileA = { name: "confirmed-a.json" };
    const calls = [];
    const window = runtime({
        flushPendingApplicationWrites(){ calls.push("flush"); return true; },
        async analyzeCareerModeBackupFile(selected){ calls.push(`analyze:${selected.name}`); await gate; return analysis(); },
        captureCareerModeRawRestoreSnapshot(){ calls.push("strict-snapshot"); return { ok: true, raw: { ...raw }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(candidateRaw, expectedRaw){
            calls.push("transaction");
            committedPlan = JSON.parse(JSON.stringify(candidateRaw));
            transactionExpected = JSON.parse(JSON.stringify(expectedRaw));
            return { ok: true, status: "success", affectedKeys: Object.keys(candidateRaw) };
        }
    });
    const mutableChoices = { active: "use-backup", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {} };
    const mutableReview = { expectedRaw: { ...raw } };
    const pending = window.applyCareerModeRestore(fileA, mutableChoices, mutableReview);
    mutableChoices.active = "keep-current";
    mutableChoices.preferences = "use-backup";
    mutableReview.expectedRaw.activeShowdown = '{"id":"mutated-after-confirm"}';
    releaseAnalysis();
    const result = await pending;
    assert.equal(result.ok, true);
    assert.deepEqual(calls, ["flush", "analyze:confirmed-a.json", "strict-snapshot", "transaction"]);
    assert.equal(JSON.parse(committedPlan.activeShowdown).id, "backup-active", "Post-confirm mutation of the caller choices object must not change the committed plan.");
    assert.equal(Object.prototype.hasOwnProperty.call(committedPlan, "preferences"), false, "A preference choice added after confirmation must not leak into the transaction.");
    assert.equal(transactionExpected.activeShowdown, raw.activeShowdown, "Post-confirm mutation of reviewedRaw must not rewrite the transaction precondition.");

    let transactionCalled = false;
    const strictFailure = runtime({
        flushPendingApplicationWrites(){ return true; },
        async analyzeCareerModeBackupFile(){ return analysis(); },
        captureCareerModeRawRestoreSnapshot(){ return { ok: false, raw: null, failedKeys: ["legacyShowdowns"] }; },
        captureCareerModeRawBackupInputs(){ throw new Error("Loose snapshot must not be used when strict authority exists and fails."); },
        applyCareerModeRawStorageTransaction(){ transactionCalled = true; return { ok: true, status: "success" }; }
    });
    const blocked = await strictFailure.applyCareerModeRestore(fileA, {
        active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {}
    }, { expectedRaw: raw });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.status, "snapshot-unavailable");
    assert.deepEqual(Array.from(blocked.failedKeys), ["legacyShowdowns"]);
    assert.equal(transactionCalled, false, "Ambiguous storage reads must fail closed before planning or mutation.");

    const staleBoundary = runtime({
        flushPendingApplicationWrites(){ return true; },
        async analyzeCareerModeBackupFile(){ return analysis(); },
        captureCareerModeRawRestoreSnapshot(){ return { ok: true, raw: { ...raw }, failedKeys: [] }; },
        applyCareerModeRawStorageTransaction(){
            return { ok: false, status: "stale-precondition", failurePhase: "precondition", rollbackVerified: true, preconditionMismatches: ["legacyShowdowns"] };
        }
    });
    const stale = await staleBoundary.applyCareerModeRestore(fileA, {
        active: "use-backup", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {}
    }, { expectedRaw: raw });
    assert.equal(stale.ok, false);
    assert.equal(stale.status, "stale-state", "Last-moment transaction precondition drift must be normalized into explicit stale-state recovery UX.");
    assert.deepEqual(Array.from(stale.changedKeys), ["legacyShowdowns"]);

    process.stdout.write("PASS  v1.1.5 confirmed-intent, strict-snapshot and transaction-boundary restore contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
