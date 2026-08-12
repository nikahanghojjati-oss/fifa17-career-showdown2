const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const transactionSource = fs.readFileSync("js/storageTransaction.js", "utf8");

function createRuntime(){
    const values = new Map();
    const attempts = [];
    const events = [];
    const notices = [];
    const hooks = { get: null, set: null, remove: null };

    const localStorage = {
        getItem(key){
            const current = values.has(key) ? values.get(key) : null;
            if(typeof hooks.get === "function") return hooks.get(key, current);
            return current;
        },
        setItem(key, value){
            const text = String(value);
            attempts.push({ type: "set", key, value: text });
            if(typeof hooks.set === "function"){
                const decision = hooks.set(key, text);
                if(decision && Object.prototype.hasOwnProperty.call(decision, "storeValue")){
                    values.set(key, String(decision.storeValue));
                    return;
                }
            }
            values.set(key, text);
        },
        removeItem(key){
            attempts.push({ type: "remove", key, value: null });
            if(typeof hooks.remove === "function") hooks.remove(key);
            values.delete(key);
        }
    };

    const CustomEvent = class CustomEvent {
        constructor(type, options = {}){ this.type = type; this.detail = options.detail; }
    };
    const document = {
        documentElement: { dataset: {} },
        visibilityState: "visible",
        addEventListener(){},
        querySelector(){ return null; }
    };
    const window = {
        matchMedia(){ return { matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }; },
        addEventListener(){},
        dispatchEvent(event){ events.push(event); },
        setTimeout,
        clearTimeout,
        showAppNotice(message, type, duration){ notices.push({ message, type, duration }); },
        CustomEvent
    };
    window.window = window;

    const context = vm.createContext({
        console, localStorage, window, document, currentShowdown: null,
        structuredClone, CustomEvent, JSON, Date, Object, Array, Map, Set,
        Number, String, Boolean, Error, setTimeout, clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(transactionSource, context, { filename: "js/storageTransaction.js" });
    return { context, window, values, attempts, events, notices, hooks };
}

function seed(runtime, keys, raw){
    runtime.values.clear();
    runtime.attempts.length = 0;
    runtime.events.length = 0;
    runtime.notices.length = 0;
    runtime.hooks.get = null;
    runtime.hooks.set = null;
    runtime.hooks.remove = null;
    for(const [name, value] of Object.entries(raw)){
        const key = keys[name];
        if(value !== null && value !== undefined) runtime.values.set(key, String(value));
    }
}
function snapshot(runtime, keys){
    return {
        activeShowdown: runtime.values.has(keys.activeShowdown) ? runtime.values.get(keys.activeShowdown) : null,
        legacyShowdowns: runtime.values.has(keys.legacyShowdowns) ? runtime.values.get(keys.legacyShowdowns) : null,
        preferences: runtime.values.has(keys.preferences) ? runtime.values.get(keys.preferences) : null
    };
}
function assertRawState(runtime, keys, expected, message){ assert.deepEqual(snapshot(runtime, keys), expected, message); }
function throwQuota(label){ const error = new Error(label); error.name = "QuotaExceededError"; throw error; }

(() => {
    assert.ok(storageSource.includes("function captureCareerModeRawRestoreSnapshot"), "Strict restore snapshot authority must stay in js/storage.js.");
    assert.ok(storageSource.includes("function applyCareerModeRawStorageTransaction"), "Canonical transaction entry point must stay in js/storage.js.");
    assert.ok(transactionSource.includes("rollbackOwnershipConflicts"), "Rollback ownership conflicts must be first-class transaction evidence.");
    assert.ok(transactionSource.includes('io.read(name,"prewrite")'), "Every commit write must receive a last-moment byte precondition check.");
    assert.ok(!/\blocalStorage\b/.test(transactionSource), "Lazy transaction engine must not become a second browser-storage owner.");
    assert.ok(!/\bcurrentShowdown\b/.test(transactionSource), "Lazy transaction engine must remain independent of live application state.");

    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    const oldRaw = {
        activeShowdown: '{"id":"active-old","name":"Old Active"}',
        legacyShowdowns: '[{"id":"legacy-old","name":"Old Legacy"}]',
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
    const newRaw = {
        activeShowdown: '{"id":"active-new","name":"New Active"}',
        legacyShowdowns: '[{"id":"legacy-new","name":"New Legacy"}]',
        preferences: '{"schemaVersion":2,"reducedMotion":true,"menuFeedback":false}'
    };

    seed(runtime, keys, oldRaw);
    const strict = runtime.window.captureCareerModeRawRestoreSnapshot();
    assert.equal(strict.ok, true);
    assert.deepEqual(strict.raw, oldRaw, "Strict restore snapshots must preserve exact strings and absence semantics.");
    runtime.hooks.get = (key, current) => {
        if(key === keys.legacyShowdowns) throw new Error("blocked read");
        return current;
    };
    const strictFailure = runtime.window.captureCareerModeRawRestoreSnapshot();
    assert.equal(strictFailure.ok, false, "Read failure must never be converted into false key absence.");
    assert.deepEqual(strictFailure.failedKeys, ["legacyShowdowns"]);
    runtime.hooks.get = null;

    seed(runtime, keys, oldRaw);
    const revisionBefore = runtime.window.getLegacyStorageRevision();
    const success = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(success.ok, true);
    assert.equal(success.status, "success");
    assert.deepEqual(Array.from(success.affectedKeys), ["activeShowdown", "legacyShowdowns", "preferences"]);
    assert.deepEqual(Array.from(success.committedKeys), ["activeShowdown", "legacyShowdowns", "preferences"]);
    assertRawState(runtime, keys, newRaw, "Successful transaction must commit every requested raw value exactly.");
    assert.equal(runtime.window.getLegacyStorageRevision(), revisionBefore + 1, "Legacy cache revision changes only after complete commit success.");
    assert.equal(runtime.window.isCareerModeCriticalRecoveryLocked(), false);
    assert.equal(runtime.events.filter(event => event.type === "career-mode-preferences-change" && event.detail?.source === "restore").length, 1);
    assert.deepEqual(runtime.attempts.slice(0, 3).map(item => item.key), [keys.activeShowdown, keys.legacyShowdowns, keys.preferences]);

    seed(runtime, keys, newRaw);
    const noOp = runtime.window.applyCareerModeRawStorageTransaction(newRaw, newRaw);
    assert.equal(noOp.ok, true);
    assert.equal(noOp.status, "no-op");
    assert.equal(runtime.attempts.length, 0, "Idempotent repeat plans must remain zero-write transactions.");

    seed(runtime, keys, oldRaw);
    const staleExpected = { ...oldRaw, legacyShowdowns: "[]" };
    const stale = runtime.window.applyCareerModeRawStorageTransaction(newRaw, staleExpected);
    assert.equal(stale.ok, false);
    assert.equal(stale.status, "stale-precondition");
    assert.equal(stale.failurePhase, "precondition");
    assert.deepEqual(Array.from(stale.preconditionMismatches), ["legacyShowdowns"]);
    assert.equal(runtime.attempts.length, 0, "Initial stale precondition must abort before any write.");
    assertRawState(runtime, keys, oldRaw);

    seed(runtime, keys, oldRaw);
    let firstFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!firstFailureInjected && key === keys.activeShowdown && value === newRaw.activeShowdown){
            firstFailureInjected = true;
            throwQuota("first-key failure");
        }
        return null;
    };
    const firstFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(firstFailure.ok, false);
    assert.equal(firstFailure.status, "write-failed-clean");
    assert.equal(firstFailure.failedKey, "activeShowdown");
    assert.equal(firstFailure.rollbackAttempted, false, "A failed first write owns no mutation and must perform no rollback write.");
    assert.equal(firstFailure.rollbackVerified, true);
    assert.deepEqual(Array.from(firstFailure.committedKeys), []);
    assert.deepEqual(Array.from(firstFailure.rollbackKeys), []);
    assert.equal(runtime.attempts.length, 1, "Only the failed commit attempt itself should be observed.");
    assertRawState(runtime, keys, oldRaw, "First-key failure must leave exact original bytes untouched.");

    seed(runtime, keys, oldRaw);
    let middleFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!middleFailureInjected && key === keys.legacyShowdowns && value === newRaw.legacyShowdowns){
            middleFailureInjected = true;
            throwQuota("middle-key failure");
        }
        return null;
    };
    const middleFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(middleFailure.status, "rolled-back");
    assert.deepEqual(Array.from(middleFailure.committedKeys), ["activeShowdown"]);
    assert.deepEqual(Array.from(middleFailure.rollbackKeys), ["activeShowdown"], "Only the successfully changed active key is rollback-owned.");
    assertRawState(runtime, keys, oldRaw, "Middle failure must restore the one transaction-owned mutation byte-for-byte.");
    assert.deepEqual(runtime.attempts.map(item => item.key), [keys.activeShowdown, keys.legacyShowdowns, keys.activeShowdown]);

    seed(runtime, keys, oldRaw);
    let finalFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!finalFailureInjected && key === keys.preferences && value === newRaw.preferences){ finalFailureInjected = true; throwQuota("final-key failure"); }
        return null;
    };
    const finalFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(finalFailure.status, "rolled-back");
    assert.deepEqual(Array.from(finalFailure.committedKeys), ["activeShowdown", "legacyShowdowns"]);
    assert.deepEqual(Array.from(finalFailure.rollbackKeys), ["legacyShowdowns", "activeShowdown"], "Rollback must unwind owned writes in reverse commit order.");
    assertRawState(runtime, keys, oldRaw);

    seed(runtime, keys, oldRaw);
    let verificationMismatchInjected = false;
    runtime.hooks.get = (key, current) => {
        if(!verificationMismatchInjected && key === keys.legacyShowdowns && current === newRaw.legacyShowdowns){
            verificationMismatchInjected = true;
            return `${current}corrupted-after-write`;
        }
        return current;
    };
    const verificationFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(verificationFailure.status, "rolled-back");
    assert.equal(verificationFailure.failurePhase, "verify");
    assert.deepEqual(Array.from(verificationFailure.verificationMismatches), ["legacyShowdowns"]);
    assertRawState(runtime, keys, oldRaw, "Post-write verification mismatch must trigger exact reverse rollback.");

    seed(runtime, keys, oldRaw);
    const readCounts = new Map();
    runtime.hooks.get = (key, current) => {
        const count = (readCounts.get(key) || 0) + 1;
        readCounts.set(key, count);
        if(key === keys.legacyShowdowns && count === 2) return "external-concurrent-legacy";
        return current;
    };
    const drift = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(drift.ok, false);
    assert.equal(drift.failurePhase, "precondition");
    assert.deepEqual(Array.from(drift.preconditionMismatches), ["legacyShowdowns"]);
    assert.deepEqual(Array.from(drift.committedKeys), ["activeShowdown"]);
    assert.deepEqual(Array.from(drift.rollbackKeys), ["activeShowdown"]);
    assert.equal(drift.rollbackVerified, true);
    assertRawState(runtime, keys, oldRaw, "Cross-context drift before a later write must roll back only earlier owned mutations.");

    seed(runtime, keys, oldRaw);
    let mutatedExternally = false;
    runtime.hooks.get = (key, current) => {
        if(!mutatedExternally && key === keys.legacyShowdowns && current === newRaw.legacyShowdowns){
            mutatedExternally = true;
            runtime.values.set(keys.activeShowdown, '{"id":"external-newer"}');
            return `${current}verification-mismatch`;
        }
        return current;
    };
    const ownershipConflict = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(ownershipConflict.status, "rollback-failed-critical");
    assert.equal(ownershipConflict.rollbackVerified, false);
    assert.ok(Array.from(ownershipConflict.rollbackOwnershipConflicts).includes("activeShowdown"), "Rollback must refuse to overwrite bytes it can no longer prove belong to this transaction.");
    assert.equal(runtime.values.get(keys.activeShowdown), '{"id":"external-newer"}', "Newer/unowned bytes must survive critical rollback rather than being clobbered.");
    assert.equal(runtime.window.isCareerModeCriticalRecoveryLocked(), true, "Critical transaction uncertainty must invalidate runtime authority until refresh.");

    seed(runtime, keys, oldRaw);
    const removalPlan = { activeShowdown: null, legacyShowdowns: null, preferences: newRaw.preferences };
    const removalSuccess = runtime.window.applyCareerModeRawStorageTransaction(removalPlan, oldRaw);
    assert.equal(removalSuccess.ok, true);
    assertRawState(runtime, keys, removalPlan, "Transaction must distinguish exact absence from the serialized string null.");
    assert.equal(runtime.attempts[0].type, "remove");
    assert.equal(runtime.attempts[1].type, "remove");

    seed(runtime, keys, { ...oldRaw, activeShowdown: "{broken-active", legacyShowdowns: "{broken-legacy", preferences: "{broken-preferences" });
    const corruptBefore = snapshot(runtime, keys);
    const corruptNoOp = runtime.window.applyCareerModeRawStorageTransaction({}, corruptBefore);
    assert.equal(corruptNoOp.ok, true);
    assert.equal(runtime.attempts.length, 0);
    assertRawState(runtime, keys, corruptBefore, "Corrupt bytes remain opaque transaction bytes until explicit replacement is planned.");

    seed(runtime, keys, oldRaw);
    let readFailed = false;
    runtime.hooks.get = (key, current) => {
        if(!readFailed && key === keys.legacyShowdowns){ readFailed = true; throw new Error("snapshot read unavailable"); }
        return current;
    };
    const snapshotFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(snapshotFailure.status, "snapshot-failed");
    assert.equal(snapshotFailure.failurePhase, "snapshot");
    assert.equal(runtime.attempts.length, 0);
    assertRawState(runtime, keys, oldRaw);

    seed(runtime, keys, oldRaw);
    const invalidValue = runtime.window.applyCareerModeRawStorageTransaction({ activeShowdown: { id: "not-raw" } }, oldRaw);
    assert.equal(invalidValue.status, "invalid-plan");
    assert.equal(runtime.attempts.length, 0);

    const engine = runtime.window.runCareerModeRawStorageTransaction;
    delete runtime.window.runCareerModeRawStorageTransaction;
    const unavailable = runtime.window.applyCareerModeRawStorageTransaction(newRaw, oldRaw);
    assert.equal(unavailable.status, "engine-unavailable");
    runtime.window.runCareerModeRawStorageTransaction = engine;

    process.stdout.write("PASS  Candidate C ownership-scoped atomic storage and strict snapshot contracts\n");
})();
