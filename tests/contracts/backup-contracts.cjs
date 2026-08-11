const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const backupSource = fs.readFileSync("js/backup.js", "utf8");

function createRuntime(){
    const values = new Map();
    const counters = { set: 0, remove: 0 };
    const localStorage = {
        getItem(key){ return values.has(key) ? values.get(key) : null; },
        setItem(key, value){ counters.set += 1; values.set(key, String(value)); },
        removeItem(key){ counters.remove += 1; values.delete(key); }
    };
    const document = {
        documentElement: null,
        querySelector(selector){
            return selector === 'meta[name="app-asset-revision"]' ? { content: "1.1.0-r1" } : null;
        },
        addEventListener(){},
        createElement(){ throw new Error("Download DOM should not be used by contract-only envelope tests."); }
    };
    const window = {
        crypto: webcrypto,
        matchMedia(){ return { matches: false, addEventListener(){} }; },
        setTimeout,
        clearTimeout,
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(){},
        CustomEvent: class CustomEvent {}
    };
    window.window = window;
    const context = vm.createContext({
        console,
        localStorage,
        window,
        document,
        currentShowdown: null,
        structuredClone,
        JSON,
        Date,
        TextEncoder,
        Blob,
        URL,
        setTimeout,
        clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(backupSource, context, { filename: "js/backup.js" });
    return { context, window, localStorage, values, counters };
}

(async () => {
    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    const active = { id: 1700000000000, name: "Backup Audit", status: "Active", updatedAt: "2026-08-11T12:00:00.000Z" };
    const legacy = [{ id: 1600000000000, name: "Archived Audit", status: "Completed", completedAt: "2026-08-10T12:00:00.000Z" }];
    const preferences = { schemaVersion: 2, reducedMotion: false, menuFeedback: true };

    runtime.values.set(keys.activeShowdown, JSON.stringify(active));
    runtime.values.set(keys.legacyShowdowns, JSON.stringify(legacy));
    runtime.values.set(keys.preferences, JSON.stringify(preferences));

    const writesBefore = { ...runtime.counters };
    const envelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(runtime.counters.set, writesBefore.set, "Backup envelope creation must not call localStorage.setItem().");
    assert.equal(runtime.counters.remove, writesBefore.remove, "Backup envelope creation must not call localStorage.removeItem().");
    assert.equal(envelope.formatId, "career-mode-showdown-backup");
    assert.equal(envelope.formatVersion, 1);
    assert.equal(envelope.appVersion, "1.1.0");
    assert.equal(envelope.runtimeRevision, "1.1.0-r1");
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.activeShowdown)), active);
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.legacyShowdowns)), legacy);
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.preferences)), preferences);
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(envelope), true, "Generated checksum must verify.");

    const mutated = structuredClone(envelope);
    mutated.payload.activeShowdown.name = "Tampered";
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(mutated), false, "Mutated backup content must fail checksum verification.");

    const readable = runtime.window.serializeCareerModeBackupEnvelope(envelope);
    assert.match(readable, /\n  "formatId":/);
    assert.ok(readable.endsWith("\n"), "Serialized backup should be human-readable and newline terminated.");

    runtime.values.set(keys.activeShowdown, "{broken-active");
    runtime.values.set(keys.legacyShowdowns, JSON.stringify({ not: "an array" }));
    runtime.values.set(keys.preferences, "{broken-preferences");
    runtime.context.currentShowdown = null;
    const corruptEnvelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(corruptEnvelope.counts.activeShowdowns, 0);
    assert.equal(corruptEnvelope.counts.legacyShowdowns, 0);
    assert.equal(corruptEnvelope.counts.preferenceRecords, 0);
    assert.equal(corruptEnvelope.warnings.length, 3, "All malformed current records must be surfaced as warnings.");
    assert.equal(corruptEnvelope.recovery.activeShowdown.raw, "{broken-active");
    assert.match(corruptEnvelope.recovery.legacyShowdowns.raw, /not/);
    assert.equal(corruptEnvelope.recovery.preferences.raw, "{broken-preferences");
    assert.equal(runtime.values.get(keys.activeShowdown), "{broken-active", "Corrupt active bytes must remain untouched.");
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(corruptEnvelope), true);

    // Bug 1: corrupt non-empty active data must not advertise a usable save.
    runtime.context.activeSavePresenceKnown = false;
    runtime.context.activeSavePresent = false;
    assert.equal(runtime.context.hasSavedShowdown(), false, "Corrupt raw active data must not produce a Continue Career false positive.");

    process.stdout.write("PASS  v1.1.0 Candidate A backup/storage contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
