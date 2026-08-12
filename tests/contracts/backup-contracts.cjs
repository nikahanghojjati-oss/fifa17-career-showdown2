const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");
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
    const CustomEvent = class CustomEvent { constructor(type, options = {}){ this.type = type; this.detail = options.detail; } };
    const document = {
        documentElement: { dataset: {} },
        querySelector(selector){
            return selector === 'meta[name="app-asset-revision"]' ? { content: "1.1.4-r1" } : null;
        },
        addEventListener(){},
        createElement(){ throw new Error("Download DOM should not be used by contract-only envelope tests."); }
    };
    const window = {
        crypto: webcrypto,
        matchMedia(){ return { matches: false, addEventListener(){}, removeEventListener(){} }; },
        setTimeout,
        clearTimeout,
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(){},
        CustomEvent
    };
    window.window = window;
    const context = vm.createContext({
        console,
        localStorage,
        window,
        document,
        currentShowdown: null,
        structuredClone,
        CustomEvent,
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
    return { context, window, values, counters };
}

function setScenario(runtime, keys, { active, legacy, preferences }){
    runtime.values.clear();
    runtime.context.currentShowdown = null;
    if(active !== undefined){ runtime.values.set(keys.activeShowdown, JSON.stringify(active)); }
    if(legacy !== undefined){ runtime.values.set(keys.legacyShowdowns, JSON.stringify(legacy)); }
    if(preferences !== undefined){ runtime.values.set(keys.preferences, JSON.stringify(preferences)); }
}

async function assertScenario(runtime, keys, name, input, expected){
    setScenario(runtime, keys, input);
    const before = { ...runtime.counters };
    const envelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(runtime.counters.set, before.set, `${name}: export analysis must not write localStorage.`);
    assert.equal(runtime.counters.remove, before.remove, `${name}: export analysis must not remove localStorage data.`);
    assert.equal(envelope.counts.activeShowdowns, expected.active);
    assert.equal(envelope.counts.legacyShowdowns, expected.legacy);
    assert.equal(envelope.counts.preferenceRecords, expected.preferences);
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(envelope), true, `${name}: checksum must verify.`);
    return envelope;
}

(async () => {
    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    const active = { id: 1700000000000, name: "Backup Audit", status: "Active", updatedAt: "2026-08-11T12:00:00.000Z" };
    const completedActive = { ...active, status: "Completed", completedAt: "2026-08-11T12:30:00.000Z" };
    const legacy = [{ id: 1600000000000, name: "Archived Audit", status: "Completed", completedAt: "2026-08-10T12:00:00.000Z" }];
    const matchingLegacy = [structuredClone(completedActive), ...legacy];
    const preferences = { schemaVersion: 2, reducedMotion: false, menuFeedback: true };

    const empty = await assertScenario(runtime, keys, "empty", {}, { active: 0, legacy: 0, preferences: 0 });
    assert.equal(empty.payload.activeShowdown, null);
    assert.equal(empty.payload.legacyShowdowns, null);
    assert.equal(empty.payload.preferences, null);

    const activeOnly = await assertScenario(runtime, keys, "active-only", { active }, { active: 1, legacy: 0, preferences: 0 });
    assert.deepEqual(JSON.parse(JSON.stringify(activeOnly.payload.activeShowdown)), active);

    const legacyOnly = await assertScenario(runtime, keys, "Legacy-only", { legacy }, { active: 0, legacy: 1, preferences: 0 });
    assert.deepEqual(JSON.parse(JSON.stringify(legacyOnly.payload.legacyShowdowns)), legacy);

    const preferencesOnly = await assertScenario(runtime, keys, "preferences-only", { preferences }, { active: 0, legacy: 0, preferences: 1 });
    assert.deepEqual(JSON.parse(JSON.stringify(preferencesOnly.payload.preferences)), preferences);

    const full = await assertScenario(runtime, keys, "full", { active, legacy, preferences }, { active: 1, legacy: 1, preferences: 1 });
    assert.equal(full.formatId, "career-mode-showdown-backup");
    assert.equal(full.formatVersion, 1);
    assert.equal(full.appVersion, "1.1.3");
    assert.equal(full.runtimeRevision, "1.1.4-r1");
    assert.equal(full.checksumAlgorithm, "SHA-256");
    assert.ok(/^[a-f0-9]{64}$/.test(full.checksum), "Backup checksum must be a SHA-256 hex digest.");

    const matching = await assertScenario(
        runtime,
        keys,
        "completed active plus matching Legacy",
        { active: completedActive, legacy: matchingLegacy, preferences },
        { active: 1, legacy: 2, preferences: 1 }
    );
    assert.equal(matching.relationships.completedActiveMatchesLegacy, true);
    assert.equal(matching.relationships.matchingLegacyIndex, 0);
    assert.equal(String(matching.payload.activeShowdown.id), String(completedActive.id), "Existing Showdown IDs must survive unchanged.");
    assert.equal(matching.payload.activeShowdown.updatedAt, completedActive.updatedAt, "Existing timestamps must survive unchanged.");
    assert.equal(matching.payload.activeShowdown.completedAt, completedActive.completedAt, "Completion timestamp must survive unchanged.");

    const mutated = structuredClone(full);
    mutated.payload.activeShowdown.name = "Tampered";
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(mutated), false, "Mutated backup content must fail checksum verification.");

    const readable = runtime.window.serializeCareerModeBackupEnvelope(full);
    assert.match(readable, /\n  "formatId":/);
    assert.ok(readable.endsWith("\n"), "Serialized backup should be human-readable and newline terminated.");

    // Large-history responsiveness: preserve 1,000 records without mutating storage.
    const largeLegacy = Array.from({ length: 1000 }, (_, index) => ({
        id: 1800000000000 + index,
        name: `Historical Showdown ${index + 1}`,
        status: "Completed",
        completedAt: new Date(1700000000000 + index * 1000).toISOString()
    }));
    setScenario(runtime, keys, { legacy: largeLegacy, preferences });
    const largeBefore = { ...runtime.counters };
    const started = performance.now();
    const largeEnvelope = await runtime.window.createCareerModeBackupEnvelope();
    const elapsed = performance.now() - started;
    assert.equal(largeEnvelope.counts.legacyShowdowns, 1000);
    assert.ok(elapsed < 2000, `Large Legacy backup should remain responsive; took ${elapsed.toFixed(1)}ms.`);
    assert.equal(runtime.counters.set, largeBefore.set);
    assert.equal(runtime.counters.remove, largeBefore.remove);

    // Recovery representation: malformed bytes stay present and byte-for-byte untouched.
    runtime.values.clear();
    runtime.context.currentShowdown = null;
    runtime.values.set(keys.activeShowdown, "{broken-active");
    runtime.values.set(keys.legacyShowdowns, JSON.stringify({ not: "an array" }));
    runtime.values.set(keys.preferences, "{broken-preferences");
    const corruptBefore = new Map(runtime.values);
    const corruptEnvelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(corruptEnvelope.counts.activeShowdowns, 0);
    assert.equal(corruptEnvelope.counts.legacyShowdowns, 0);
    assert.equal(corruptEnvelope.counts.preferenceRecords, 0);
    assert.equal(corruptEnvelope.warnings.length, 3, "All malformed current records must be surfaced as warnings.");
    assert.equal(corruptEnvelope.recovery.activeShowdown.raw, "{broken-active");
    assert.match(corruptEnvelope.recovery.legacyShowdowns.raw, /not/);
    assert.equal(corruptEnvelope.recovery.preferences.raw, "{broken-preferences");
    assert.deepEqual([...runtime.values.entries()], [...corruptBefore.entries()], "Corrupt storage bytes must remain untouched.");
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(corruptEnvelope), true);

    // Bug 1: corrupt non-empty active data must not advertise a usable save.
    assert.equal(runtime.context.hasSavedShowdown(), false, "Corrupt raw active data must not produce a Continue Career false positive.");

    process.stdout.write("PASS  v1.1.0 Candidate A backup/storage contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
