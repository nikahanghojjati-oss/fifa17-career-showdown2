const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const transactionSource = fs.readFileSync("js/storageTransaction.js", "utf8");

function createRuntime(){
    const values = new Map();
    const attempts = [];
    const events = [];
    const hooks = { get: null, set: null, remove: null };
    const localStorage = {
        getItem(key){
            const current = values.has(key) ? values.get(key) : null;
            return typeof hooks.get === "function" ? hooks.get(key, current) : current;
        },
        setItem(key, value){
            const text = String(value);
            attempts.push({ type: "set", key, value: text });
            if(typeof hooks.set === "function") hooks.set(key, text);
            values.set(key, text);
        },
        removeItem(key){
            attempts.push({ type: "remove", key, value: null });
            if(typeof hooks.remove === "function") hooks.remove(key);
            values.delete(key);
        }
    };
    const CustomEvent = class CustomEvent { constructor(type, options = {}){ this.type = type; this.detail = options.detail; } };
    const document = { documentElement: { dataset: {} }, visibilityState: "visible", addEventListener(){}, querySelector(){ return null; } };
    const window = {
        matchMedia(){ return { matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }; },
        addEventListener(){}, dispatchEvent(event){ events.push(event); }, setTimeout, clearTimeout, showAppNotice(){}, CustomEvent
    };
    window.window = window;
    const context = vm.createContext({
        console, localStorage, window, document, currentShowdown: null, structuredClone, CustomEvent,
        JSON, Date, Object, Array, Map, Set, Number, String, Boolean, Error, setTimeout, clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(transactionSource, context, { filename: "js/storageTransaction.js" });
    return { context, window, values, attempts, events, hooks };
}
function seed(runtime, keys, raw){
    runtime.values.clear(); runtime.attempts.length = 0; runtime.events.length = 0;
    runtime.hooks.get = runtime.hooks.set = runtime.hooks.remove = null;
    for(const [name, value] of Object.entries(raw)) if(value !== null && value !== undefined) runtime.values.set(keys[name], String(value));
}
function rawState(runtime, keys){
    return {
        activeShowdown: runtime.values.has(keys.activeShowdown) ? runtime.values.get(keys.activeShowdown) : null,
        legacyShowdowns: runtime.values.has(keys.legacyShowdowns) ? runtime.values.get(keys.legacyShowdowns) : null,
        preferences: runtime.values.has(keys.preferences) ? runtime.values.get(keys.preferences) : null
    };
}
function quota(message){ const error = new Error(message); error.name = "QuotaExceededError"; throw error; }

(() => {
    assert.ok(storageSource.includes("captureCareerModeRawRestoreSnapshot"));
    assert.ok(transactionSource.includes('io.read(name,"prewrite")'));
    assert.ok(transactionSource.includes("rollbackOwnershipConflicts"));
    assert.ok(!/\blocalStorage\b/.test(transactionSource), "Transaction engine must not become a second browser-storage owner.");

    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    const oldRaw = {
        activeShowdown: '{"id":"active-old"}',
        legacyShowdowns: '[{"id":"legacy-old"}]',
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
    const nextRaw = {
        activeShowdown: '{"id":"active-new"}',
        legacyShowdowns: '[{"id":"legacy-new"}]',
        preferences: '{"schemaVersion":2,"reducedMotion":true,"menuFeedback":false}'
    };

    seed(runtime, keys, oldRaw);
    const exact = runtime.window.captureCareerModeRawRestoreSnapshot();
    assert.equal(exact.ok, true);
    assert.deepEqual(JSON.parse(JSON.stringify(exact.raw)), oldRaw, "Strict snapshot must preserve exact raw strings.");
    runtime.hooks.get = (key, current) => { if(key === keys.legacyShowdowns) throw new Error("blocked"); return current; };
    const blockedSnapshot = runtime.window.captureCareerModeRawRestoreSnapshot();
    assert.equal(blockedSnapshot.ok, false);
    assert.deepEqual(Array.from(blockedSnapshot.failedKeys), ["legacyShowdowns"], "Read failure must not be represented as absence.");

    seed(runtime, keys, oldRaw);
    const success = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(success.ok, true);
    assert.equal(success.status, "success");
    assert.deepEqual(Array.from(success.committedKeys), ["activeShowdown", "legacyShowdowns", "preferences"]);
    assert.deepEqual(rawState(runtime, keys), nextRaw);

    seed(runtime, keys, nextRaw);
    const noOp = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, nextRaw);
    assert.equal(noOp.status, "no-op");
    assert.equal(runtime.attempts.length, 0, "Repeated identical restore must remain zero-write.");

    seed(runtime, keys, oldRaw);
    const staleExpected = { ...oldRaw, legacyShowdowns: "[]" };
    const stale = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, staleExpected);
    assert.equal(stale.status, "stale-precondition");
    assert.deepEqual(Array.from(stale.preconditionMismatches), ["legacyShowdowns"]);
    assert.equal(runtime.attempts.length, 0, "Stale base must fail before first write.");

    seed(runtime, keys, oldRaw);
    let failedFirst = false;
    runtime.hooks.set = (key, value) => {
        if(!failedFirst && key === keys.activeShowdown && value === nextRaw.activeShowdown){ failedFirst = true; quota("first write"); }
    };
    const first = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(first.status, "write-failed-clean");
    assert.equal(first.rollbackAttempted, false);
    assert.equal(first.rollbackVerified, true);
    assert.deepEqual(Array.from(first.committedKeys), []);
    assert.deepEqual(Array.from(first.rollbackKeys), []);
    assert.equal(runtime.attempts.length, 1, "Failed first write must not cause a rollback rewrite.");
    assert.deepEqual(rawState(runtime, keys), oldRaw);

    seed(runtime, keys, oldRaw);
    let failedMiddle = false;
    runtime.hooks.set = (key, value) => {
        if(!failedMiddle && key === keys.legacyShowdowns && value === nextRaw.legacyShowdowns){ failedMiddle = true; quota("middle write"); }
    };
    const middle = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(middle.status, "rolled-back");
    assert.deepEqual(Array.from(middle.committedKeys), ["activeShowdown"]);
    assert.deepEqual(Array.from(middle.rollbackKeys), ["activeShowdown"], "Only successfully mutated keys are rollback-owned.");
    assert.deepEqual(rawState(runtime, keys), oldRaw);

    seed(runtime, keys, oldRaw);
    let failedFinal = false;
    runtime.hooks.set = (key, value) => {
        if(!failedFinal && key === keys.preferences && value === nextRaw.preferences){ failedFinal = true; quota("final write"); }
    };
    const final = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(final.status, "rolled-back");
    assert.deepEqual(Array.from(final.rollbackKeys), ["legacyShowdowns", "activeShowdown"], "Rollback must unwind in reverse commit order.");
    assert.deepEqual(rawState(runtime, keys), oldRaw);

    seed(runtime, keys, oldRaw);
    const counts = new Map();
    runtime.hooks.get = (key, current) => {
        const n = (counts.get(key) || 0) + 1; counts.set(key, n);
        if(key === keys.legacyShowdowns && n === 2) return "external-drift";
        return current;
    };
    const drift = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(drift.failurePhase, "precondition");
    assert.deepEqual(Array.from(drift.committedKeys), ["activeShowdown"]);
    assert.deepEqual(Array.from(drift.rollbackKeys), ["activeShowdown"]);
    assert.equal(drift.rollbackVerified, true);
    assert.deepEqual(rawState(runtime, keys), oldRaw);

    seed(runtime, keys, oldRaw);
    let injectedOwnershipConflict = false;
    runtime.hooks.get = (key, current) => {
        if(!injectedOwnershipConflict && key === keys.legacyShowdowns && current === nextRaw.legacyShowdowns){
            injectedOwnershipConflict = true;
            runtime.values.set(keys.activeShowdown, '{"id":"external-newer"}');
            return `${current}-verify-mismatch`;
        }
        return current;
    };
    const critical = runtime.window.applyCareerModeRawStorageTransaction(nextRaw, oldRaw);
    assert.equal(critical.status, "rollback-failed-critical");
    assert.ok(Array.from(critical.rollbackOwnershipConflicts).includes("activeShowdown"));
    assert.equal(runtime.values.get(keys.activeShowdown), '{"id":"external-newer"}', "Rollback must refuse to clobber unowned newer bytes.");
    assert.equal(runtime.window.isCareerModeCriticalRecoveryLocked(), true);

    seed(runtime, keys, oldRaw);
    const removal = { activeShowdown: null, legacyShowdowns: null, preferences: nextRaw.preferences };
    const removed = runtime.window.applyCareerModeRawStorageTransaction(removal, oldRaw);
    assert.equal(removed.ok, true);
    assert.deepEqual(rawState(runtime, keys), removal, "Null plan values must mean exact key absence, not serialized null.");

    seed(runtime, keys, { activeShowdown: "{broken", legacyShowdowns: "[broken", preferences: "{broken" });
    const corruptBefore = rawState(runtime, keys);
    const corruptNoOp = runtime.window.applyCareerModeRawStorageTransaction({}, corruptBefore);
    assert.equal(corruptNoOp.ok, true);
    assert.deepEqual(rawState(runtime, keys), corruptBefore, "Opaque corrupt bytes must stay untouched until explicit replacement.");

    process.stdout.write("PASS  Candidate C ownership-scoped atomic storage and strict snapshot contracts\n");
})();
