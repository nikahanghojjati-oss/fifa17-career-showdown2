const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

const read = file => fs.readFileSync(file, "utf8");
const source = {
    storage: read("js/storage.js"),
    transaction: read("js/storageTransaction.js"),
    foundation: read("js/saveLibraryFoundation.js"),
    persistence: read("js/saveLibraryPersistence.js"),
    html: read("index.html")
};
const keys = {
    saveLibrary: "careerModeShowdown.saveLibrary",
    activeShowdown: "careerModeShowdown.activeShowdown",
    legacyShowdowns: "careerModeShowdown.legacyShowdowns",
    preferences: "careerModeShowdown.preferences"
};

assert.ok(!/\blocalStorage\b/.test(source.persistence), "Save Library orchestration must never bypass js/storage.js with direct localStorage access.");
assert.ok(source.storage.includes("function captureCareerModeRawRestoreSnapshot()"), "Candidate C strict restore snapshot authority must remain present.");
assert.ok(source.storage.includes("window.captureCareerModeRawSaveLibraryMigrationSnapshot="), "Save Library migration needs a dedicated strict four-slot snapshot boundary.");
assert.ok(source.storage.includes("window.getCareerModeStorageKeys=()=>({saveLibrary:SAVE_KEY,activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY})"), "formatVersion 2 portability requires the public storage-key contract to expose the four-slot set (saveLibrary + the three legacy canonical keys) so backup/import can project the full library.");
assert.ok(source.transaction.includes('const ORDER=Object.freeze(["activeShowdown","legacyShowdowns","preferences","saveLibrary"])'), "The raw engine must recognize the transitional Save Library slot without changing Candidate C relative ordering.");
assert.ok(source.transaction.includes("guardRequestedBeforeEachWrite"), "Save Library migration must support all-requested-slot last-moment guards.");
assert.ok(!source.html.includes("js/saveLibraryFoundation.js") && !source.html.includes("js/saveLibraryPersistence.js"), "The persistence proof candidate must not make the async identity foundation or migration orchestrator eager runtime assets.");

function showdown(id, name, status = "Created"){
    const completed = status === "Completed";
    return {
        schemaVersion: 2,
        integrityWarnings: [],
        id,
        name,
        managers: { playerOne: "Alex", playerTwo: "Jordan" },
        totalRounds: 1,
        currentRound: 1,
        status,
        selectedLeague: null,
        clubs: { playerOne: null, playerTwo: null },
        score: { playerOne: 0, playerTwo: 0 },
        transferChallenges: [],
        rounds: [],
        createdAt: "2026-08-13T10:00:00.000Z",
        updatedAt: completed ? "2026-08-13T12:00:00.000Z" : "2026-08-13T10:00:00.000Z",
        completedAt: completed ? "2026-08-13T12:00:00.000Z" : null,
        archivedAt: null
    };
}

function rawSeed({ duplicateLegacy = false } = {}){
    const active = showdown("active-one", "Current Showdown");
    const legacy = [showdown("history-one", "History One", "Completed")];
    if(duplicateLegacy) legacy.push(structuredClone(legacy[0]));
    return {
        saveLibrary: null,
        activeShowdown: JSON.stringify(active),
        legacyShowdowns: JSON.stringify(legacy),
        preferences: '{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
}

function createRuntime(raw = rawSeed()){
    const values = new Map();
    for(const [name, value] of Object.entries(raw)) if(value !== null) values.set(keys[name], String(value));
    const writes = [];
    const hooks = { beforeGet: null, beforeSet: null, afterSet: null, beforeRemove: null, afterRemove: null };
    const storage = {
        getItem(key){
            if(hooks.beforeGet) hooks.beforeGet(key, values);
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value){
            const next = String(value);
            writes.push({ type: "set", key, value: next });
            if(hooks.beforeSet) hooks.beforeSet(key, next, values);
            values.set(key, next);
            if(hooks.afterSet) hooks.afterSet(key, next, values);
        },
        removeItem(key){
            writes.push({ type: "remove", key, value: null });
            if(hooks.beforeRemove) hooks.beforeRemove(key, values);
            values.delete(key);
            if(hooks.afterRemove) hooks.afterRemove(key, values);
        }
    };
    const notices = [];
    const context = {
        console: { error(){}, warn(){}, log(){} },
        currentShowdown: null,
        localStorage: storage,
        structuredClone,
        crypto: webcrypto,
        TextEncoder,
        setTimeout,
        clearTimeout,
        CustomEvent: class {},
        document: { documentElement: { dataset: {} }, addEventListener(){}, visibilityState: "visible" },
        matchMedia(){ return { matches: false, addEventListener(){}, addListener(){} }; },
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(message){ notices.push(message); }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(source.foundation, context);
    vm.runInContext(source.transaction, context);
    vm.runInContext(source.storage, context);
    vm.runInContext(source.persistence, context);
    return {
        context,
        values,
        writes,
        hooks,
        notices,
        api: context.CareerModeSaveLibraryPersistence,
        foundation: context.CareerModeSaveLibraryFoundation,
        snapshot(){
            return Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, values.has(key) ? values.get(key) : null]));
        },
        clearWrites(){ writes.length = 0; }
    };
}

function writeNames(runtime){
    return runtime.writes.map(item => `${item.type}:${Object.entries(keys).find(([, key]) => key === item.key)?.[0] || item.key}`);
}

async function initialMigrationAndRetry(){
    const runtime = createRuntime();
    const before = runtime.snapshot();
    const result = await runtime.api.migrate();
    assert.equal(result.ok, true);
    assert.equal(result.status, "migrated");
    assert.deepEqual(writeNames(runtime), ["set:legacyShowdowns", "set:saveLibrary", "remove:activeShowdown"], "Migration must migrate Legacy, stage the registry, then retire singleton authority last.");
    const after = runtime.snapshot();
    assert.equal(after.activeShowdown, null, "Accepted migrated state must retire singleton active authority.");
    assert.notEqual(after.saveLibrary, null, "Accepted migrated state must contain the Save Library registry.");
    assert.equal(after.preferences, before.preferences, "Preferences participate as exact guard bytes and must not be rewritten.");
    const library = JSON.parse(after.saveLibrary);
    assert.deepEqual(Array.from(runtime.foundation.validateSaveLibrary(library)), []);
    assert.equal(library.saves.length, 1);
    assert.match(library.activeSaveId, /^save_[0-9a-f]{24}$/);
    assert.equal(JSON.parse(after.legacyShowdowns)[0].identity.saveId.startsWith("save_"), true);

    runtime.clearWrites();
    const repeatBefore = runtime.snapshot();
    const repeat = await runtime.api.migrate();
    assert.equal(repeat.ok, true);
    assert.equal(repeat.status, "already-migrated");
    assert.deepEqual(runtime.writes, [], "Repeated completed migration must be a zero-write idempotent operation.");
    assert.deepEqual(runtime.snapshot(), repeatBefore, "Repeated completed migration must preserve all four raw slots byte-for-byte.");
}

async function retryAfterLegacyOnlyInterruption(){
    const runtime = createRuntime();
    const planned = await runtime.api.planTransition(runtime.snapshot());
    assert.equal(planned.status, "ready");
    runtime.values.set(keys.legacyShowdowns, planned.candidateRaw.legacyShowdowns);
    runtime.clearWrites();
    const result = await runtime.api.migrate();
    assert.equal(result.ok, true);
    assert.equal(result.status, "migrated");
    assert.equal(runtime.snapshot().activeShowdown, null);
    assert.notEqual(runtime.snapshot().saveLibrary, null);
    assert.equal(writeNames(runtime).at(-1), "remove:activeShowdown", "Retry after pre-registry interruption must still retire singleton authority only at the final write.");
}

async function retryAfterRegistryStagingInterruption({ duplicateLegacy = false } = {}){
    const runtime = createRuntime(rawSeed({ duplicateLegacy }));
    const planned = await runtime.api.planTransition(runtime.snapshot());
    assert.equal(planned.status, "ready");
    runtime.values.set(keys.legacyShowdowns, planned.candidateRaw.legacyShowdowns);
    runtime.values.set(keys.saveLibrary, planned.candidateRaw.saveLibrary);
    runtime.clearWrites();
    const result = await runtime.api.migrate();
    assert.equal(result.ok, true);
    assert.equal(result.status, "resumed");
    assert.deepEqual(writeNames(runtime), ["remove:activeShowdown"], "A verified staged registry must resume by retiring only the still-live singleton authority.");
    assert.equal(runtime.snapshot().activeShowdown, null);
    assert.equal(runtime.snapshot().saveLibrary, planned.candidateRaw.saveLibrary, "Retry must preserve exact staged registry bytes.");
}

async function conflictingDualAuthorityFailsClosed(){
    const runtime = createRuntime();
    const planned = await runtime.api.planTransition(runtime.snapshot());
    runtime.values.set(keys.legacyShowdowns, planned.candidateRaw.legacyShowdowns);
    runtime.values.set(keys.saveLibrary, planned.candidateRaw.saveLibrary);
    const changed = JSON.parse(runtime.values.get(keys.activeShowdown));
    changed.name = "Independent Active Truth";
    runtime.values.set(keys.activeShowdown, JSON.stringify(changed));
    runtime.clearWrites();
    const before = runtime.snapshot();
    const result = await runtime.api.migrate();
    assert.equal(result.ok, false);
    assert.equal(result.status, "dual-authority-conflict");
    assert.deepEqual(runtime.writes, []);
    assert.deepEqual(runtime.snapshot(), before, "Unverified dual authority must remain untouched for explicit recovery, never silently reconciled.");
}

async function corruptSourceAndStrictReadFailureAreZeroWrite(){
    const corrupt = rawSeed();
    corrupt.activeShowdown = "{broken-active";
    const corruptRuntime = createRuntime(corrupt);
    const corruptBefore = corruptRuntime.snapshot();
    const corruptResult = await corruptRuntime.api.migrate();
    assert.equal(corruptResult.ok, false);
    assert.equal(corruptResult.status, "source-corrupt");
    assert.deepEqual(corruptRuntime.writes, []);
    assert.deepEqual(corruptRuntime.snapshot(), corruptBefore, "Corrupt source bytes must be preserved exactly.");

    const blockedRuntime = createRuntime();
    blockedRuntime.hooks.beforeGet = key => { if(key === keys.saveLibrary) throw new Error("blocked Save Library read"); };
    const blockedResult = await blockedRuntime.api.migrate();
    assert.equal(blockedResult.ok, false);
    assert.equal(blockedResult.status, "snapshot-unavailable");
    assert.deepEqual(blockedRuntime.writes, [], "Strict snapshot failure must prevent every migration write.");
}

async function registryWriteFailureRollsBackExactly(){
    const runtime = createRuntime();
    const before = runtime.snapshot();
    let failed = false;
    runtime.hooks.beforeSet = key => {
        if(!failed && key === keys.saveLibrary){ failed = true; throw new DOMException("quota", "QuotaExceededError"); }
    };
    const result = await runtime.api.migrate();
    assert.equal(result.ok, false);
    assert.equal(result.status, "rolled-back");
    assert.equal(result.transaction.rollbackVerified, true);
    assert.deepEqual(runtime.snapshot(), before, "Failure after the first owned mutation must restore exact pre-migration raw bytes.");
    assert.deepEqual(writeNames(runtime), ["set:legacyShowdowns", "set:saveLibrary", "set:legacyShowdowns"]);
}

async function singletonRetirementFailureRollsBackExactly(){
    const runtime = createRuntime();
    const before = runtime.snapshot();
    let failed = false;
    runtime.hooks.beforeRemove = key => {
        if(!failed && key === keys.activeShowdown){ failed = true; throw new DOMException("remove blocked", "QuotaExceededError"); }
    };
    const result = await runtime.api.migrate();
    assert.equal(result.ok, false);
    assert.equal(result.status, "rolled-back");
    assert.equal(result.transaction.rollbackVerified, true);
    assert.deepEqual(runtime.snapshot(), before, "Failed singleton retirement must roll back registry and Legacy staging byte-for-byte.");
    assert.deepEqual(writeNames(runtime), [
        "set:legacyShowdowns",
        "set:saveLibrary",
        "remove:activeShowdown",
        "remove:saveLibrary",
        "set:legacyShowdowns"
    ]);
}

async function crossSlotDriftBlocksRetirementAndRollsBackOwnedWrites(){
    const runtime = createRuntime();
    const before = runtime.snapshot();
    let injected = false;
    runtime.hooks.afterSet = (key, value, values) => {
        if(!injected && key === keys.saveLibrary){
            injected = true;
            values.set(keys.preferences, '{"schemaVersion":2,"reducedMotion":true,"menuFeedback":true}');
        }
    };
    const result = await runtime.api.migrate();
    assert.equal(result.ok, false);
    assert.equal(result.status, "stale-state");
    assert.equal(result.transaction.rollbackVerified, true);
    const after = runtime.snapshot();
    assert.equal(after.activeShowdown, before.activeShowdown, "Cross-slot drift must block singleton retirement.");
    assert.equal(after.saveLibrary, null, "Owned staged registry must be removed during verified rollback.");
    assert.equal(after.legacyShowdowns, before.legacyShowdowns, "Owned Legacy migration must roll back exactly.");
    assert.notEqual(after.preferences, before.preferences, "The transaction must not clobber an external write to a key it never mutated.");
}

async function rollbackOwnershipConflictEscalatesCriticalRecovery(){
    const runtime = createRuntime();
    const originalActive = runtime.snapshot().activeShowdown;
    let injected = false;
    const externalLibrary = JSON.stringify({ schemaVersion: 1, activeSaveId: null, profiles: [], saves: [], external: true });
    runtime.hooks.afterSet = (key, value, values) => {
        if(!injected && key === keys.saveLibrary){
            injected = true;
            values.set(keys.saveLibrary, externalLibrary);
        }
    };
    const result = await runtime.api.migrate();
    assert.equal(result.ok, false);
    assert.equal(result.status, "rollback-failed-critical");
    assert.equal(result.transaction.rollbackOwnershipConflicts.includes("saveLibrary"), true);
    assert.equal(runtime.snapshot().activeShowdown, originalActive, "Critical conflict must never retire the old singleton authority.");
    assert.equal(runtime.snapshot().saveLibrary, externalLibrary, "Anti-clobber rollback must preserve unowned external registry bytes.");
    assert.equal(runtime.context.isCareerModeCriticalRecoveryLocked(), true, "Uncertain rollback ownership must activate the existing critical recovery lock.");
}

async function transactionPlanValidation(){
    const runtime = createRuntime();
    const bad = runtime.context.runCareerModeRawStorageTransaction(
        { saveLibrary: "{}", unknownSlot: "x" },
        { read(){ return { ok: true, value: null }; }, write(){ return true; } },
        null,
        { order: ["saveLibrary"] }
    );
    assert.equal(bad.ok, false);
    assert.equal(bad.status, "invalid-plan");
    const missingOrder = runtime.context.runCareerModeRawStorageTransaction(
        { activeShowdown: null, saveLibrary: "{}" },
        { read(){ return { ok: true, value: null }; }, write(){ return true; } },
        null,
        { order: ["saveLibrary"] }
    );
    assert.equal(missingOrder.status, "invalid-plan", "Custom transaction order must include every requested raw slot.");
}

(async () => {
    await initialMigrationAndRetry();
    await retryAfterLegacyOnlyInterruption();
    await retryAfterRegistryStagingInterruption();
    await retryAfterRegistryStagingInterruption({ duplicateLegacy: true });
    await conflictingDualAuthorityFailsClosed();
    await corruptSourceAndStrictReadFailureAreZeroWrite();
    await registryWriteFailureRollsBackExactly();
    await singletonRetirementFailureRollsBackExactly();
    await crossSlotDriftBlocksRetirementAndRollsBackOwnedWrites();
    await rollbackOwnershipConflictEscalatesCriticalRecovery();
    await transactionPlanValidation();
    process.stdout.write("PASS Save Library canonical persistence transition: strict four-slot snapshots, singleton-last retirement, interruption retry, dual-authority rejection, exact rollback, cross-slot stale guards and anti-clobber critical recovery are protected.\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
