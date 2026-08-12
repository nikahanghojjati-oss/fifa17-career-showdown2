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
        matchMedia(){
            return { matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} };
        },
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
    assert.ok(storageSource.includes("function applyCareerModeRawStorageTransaction"), "Canonical transaction entry point must stay in js/storage.js.");
    assert.ok(transactionSource.includes("window.runCareerModeRawStorageTransaction"), "Lazy transaction state machine export is missing.");
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
    const revisionBefore = runtime.window.getLegacyStorageRevision();
    const success = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(success.ok, true);
    assert.equal(success.status, "success");
    assert.deepEqual(Array.from(success.affectedKeys), ["activeShowdown", "legacyShowdowns", "preferences"]);
    assertRawState(runtime, keys, newRaw, "Successful transaction must commit every requested raw value exactly.");
    assert.equal(runtime.window.getLegacyStorageRevision(), revisionBefore + 1, "Legacy cache revision changes only after complete commit success.");
    assert.equal(
        runtime.events.filter(event => event.type === "career-mode-preferences-change" && event.detail && event.detail.source === "restore").length,
        1,
        "Preferences restore should publish one post-success preference event."
    );
    assert.deepEqual(
        runtime.attempts.slice(0, 3).map(item => item.key),
        [keys.activeShowdown, keys.legacyShowdowns, keys.preferences],
        "Candidate C writes must follow deterministic active → Legacy → preferences order."
    );

    seed(runtime, keys, newRaw);
    const noOp = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(noOp.ok, true);
    assert.equal(noOp.status, "no-op");
    assert.deepEqual(Array.from(noOp.affectedKeys), []);
    assert.equal(runtime.attempts.length, 0, "Idempotent repeat plans must not rewrite identical raw storage.");
    assert.equal(runtime.events.length, 0, "No-op restore must not emit preference-change events.");

    seed(runtime, keys, oldRaw);
    let firstFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!firstFailureInjected && key === keys.activeShowdown && value === newRaw.activeShowdown){
            firstFailureInjected = true;
            throwQuota("first-key failure");
        }
        return null;
    };
    const firstFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(firstFailure.ok, false);
    assert.equal(firstFailure.status, "rolled-back");
    assert.equal(firstFailure.failurePhase, "write");
    assert.equal(firstFailure.failedKey, "activeShowdown");
    assert.equal(firstFailure.rollbackAttempted, true);
    assert.equal(firstFailure.rollbackVerified, true);
    assertRawState(runtime, keys, oldRaw, "First-key failure must restore exact original bytes for every affected key.");
    assert.equal(runtime.events.length, 0, "Rolled-back transaction must not update runtime preference state.");
    assert.deepEqual(
        runtime.attempts.slice(-3).map(item => item.key),
        [keys.activeShowdown, keys.legacyShowdowns, keys.preferences],
        "Rollback must attempt the complete affected-key set even when the first write failed."
    );

    seed(runtime, keys, oldRaw);
    let middleFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!middleFailureInjected && key === keys.legacyShowdowns && value === newRaw.legacyShowdowns){
            middleFailureInjected = true;
            throwQuota("middle-key failure");
        }
        return null;
    };
    const middleFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(middleFailure.ok, false);
    assert.equal(middleFailure.status, "rolled-back");
    assert.equal(middleFailure.failedKey, "legacyShowdowns");
    assertRawState(runtime, keys, oldRaw, "Middle-key failure must undo an earlier successful write byte-for-byte.");

    seed(runtime, keys, oldRaw);
    let finalFailureInjected = false;
    runtime.hooks.set = (key, value) => {
        if(!finalFailureInjected && key === keys.preferences && value === newRaw.preferences){
            finalFailureInjected = true;
            throwQuota("final-key failure");
        }
        return null;
    };
    const finalFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(finalFailure.ok, false);
    assert.equal(finalFailure.status, "rolled-back");
    assert.equal(finalFailure.failedKey, "preferences");
    assertRawState(runtime, keys, oldRaw, "Final-key failure must undo both earlier successful writes.");

    seed(runtime, keys, oldRaw);
    let verificationMismatchInjected = false;
    runtime.hooks.get = (key, current) => {
        if(!verificationMismatchInjected && key === keys.legacyShowdowns && current === newRaw.legacyShowdowns){
            verificationMismatchInjected = true;
            return `${current}corrupted-after-write`;
        }
        return current;
    };
    const verificationFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(verificationFailure.ok, false);
    assert.equal(verificationFailure.status, "rolled-back");
    assert.equal(verificationFailure.failurePhase, "verify");
    assert.equal(verificationFailure.failedKey, "legacyShowdowns");
    assert.deepEqual(Array.from(verificationFailure.verificationMismatches), ["legacyShowdowns"]);
    assertRawState(runtime, keys, oldRaw, "Post-write verification mismatch must trigger exact rollback.");

    seed(runtime, keys, oldRaw);
    let commitFailureReached = false;
    runtime.hooks.set = (key, value) => {
        if(key === keys.legacyShowdowns && value === newRaw.legacyShowdowns && !commitFailureReached){
            commitFailureReached = true;
            throwQuota("commit failure before broken rollback");
        }
        if(commitFailureReached && key === keys.activeShowdown && value === oldRaw.activeShowdown) throwQuota("rollback write failure");
        return null;
    };
    const rollbackFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(rollbackFailure.ok, false);
    assert.equal(rollbackFailure.status, "rollback-failed-critical");
    assert.equal(rollbackFailure.rollbackAttempted, true);
    assert.equal(rollbackFailure.rollbackVerified, false);
    assert.deepEqual(Array.from(rollbackFailure.rollbackFailures), ["activeShowdown"]);
    assert.ok(Array.from(rollbackFailure.rollbackVerificationMismatches).includes("activeShowdown"), "A failed rollback write must also fail exact rollback verification.");
    assert.equal(runtime.values.get(keys.activeShowdown), newRaw.activeShowdown, "Critical rollback failure must not be falsely reported as restored.");
    assert.equal(runtime.values.get(keys.legacyShowdowns), oldRaw.legacyShowdowns, "Rollback must continue attempting later keys after one rollback write fails.");
    assert.equal(runtime.values.get(keys.preferences), oldRaw.preferences, "Rollback must continue through the final key after a rollback failure.");
    assert.equal(runtime.events.length, 0, "Critical rollback failure must not synchronize post-success caches/preferences.");

    seed(runtime, keys, oldRaw);
    const removalPlan = { activeShowdown: null, legacyShowdowns: null, preferences: newRaw.preferences };
    const removalSuccess = runtime.window.applyCareerModeRawStorageTransaction(removalPlan);
    assert.equal(removalSuccess.ok, true);
    assert.equal(removalSuccess.status, "success");
    assertRawState(runtime, keys, removalPlan, "Transaction must distinguish exact absence from a serialized null string.");
    assert.equal(runtime.attempts[0].type, "remove");
    assert.equal(runtime.attempts[1].type, "remove");

    seed(runtime, keys, oldRaw);
    let readFailed = false;
    runtime.hooks.get = (key, current) => {
        if(!readFailed && key === keys.legacyShowdowns){ readFailed = true; throw new Error("snapshot read unavailable"); }
        return current;
    };
    const snapshotFailure = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(snapshotFailure.ok, false);
    assert.equal(snapshotFailure.status, "snapshot-failed");
    assert.equal(snapshotFailure.failurePhase, "snapshot");
    assert.equal(snapshotFailure.failedKey, "legacyShowdowns");
    assert.equal(runtime.attempts.length, 0, "Snapshot failure must abort before the first canonical write.");
    assertRawState(runtime, keys, oldRaw, "Snapshot failure must leave canonical storage untouched.");

    seed(runtime, keys, oldRaw);
    const invalidValue = runtime.window.applyCareerModeRawStorageTransaction({ activeShowdown: { id: "not-raw" } });
    assert.equal(invalidValue.ok, false);
    assert.equal(invalidValue.status, "invalid-plan");
    assert.equal(runtime.attempts.length, 0);
    const invalidRoot = runtime.window.applyCareerModeRawStorageTransaction(null);
    assert.equal(invalidRoot.ok, false);
    assert.equal(invalidRoot.status, "invalid-plan");

    const engine = runtime.window.runCareerModeRawStorageTransaction;
    delete runtime.window.runCareerModeRawStorageTransaction;
    const unavailable = runtime.window.applyCareerModeRawStorageTransaction(newRaw);
    assert.equal(unavailable.ok, false);
    assert.equal(unavailable.status, "engine-unavailable");
    runtime.window.runCareerModeRawStorageTransaction = engine;

    process.stdout.write("PASS  Candidate C lazy atomic storage transaction contracts\n");
})();
