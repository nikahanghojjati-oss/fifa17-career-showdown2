const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const html = read("index.html");
const app = read("js/app.js");
const optional = read("js/optionalModules.js");
const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const projectState = read("PROJECT_STATE.md");
const nextTask = read("NEXT_TASK.md");
const readme = read("README.md");
const changelog = read("CHANGELOG.md");
const handoffGoldenRule = read("00_HANDOFF_GOLDEN_RULE.md");

const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1];
const footerVersion = (html.match(/<footer>[\s\S]*?v([^<\s]+)\s*·\s*Stable[\s\S]*?<\/footer>/i) || [])[1];
const releaseRecordPath = `RELEASE_V${appVersion}.md`;

assert.ok(appVersion, "APP_VERSION is missing.");
assert.equal(packageJson.version, appVersion, "package.json and APP_VERSION must agree.");
assert.equal(packageLock.version, appVersion, "package-lock.json top-level version is stale.");
assert.equal(packageLock.packages?.[""]?.version, appVersion, "package-lock.json root-package version is stale.");
assert.equal(packageJson.devDependencies["@sparticuz/chromium"], "149.0.0", "The registry-distributed Chromium runtime must remain pinned.");
assert.equal(footerVersion, appVersion, "The user-facing footer version is stale.");
assert.equal(revision, `${appVersion}-r1`, "The current release must use its r1 cache identity.");
assert.ok(fs.existsSync(path.join(root, releaseRecordPath)), `Current release record is missing: ${releaseRecordPath}`);
const releaseRecord = read(releaseRecordPath);
const releaseCandidate = /Status:\s*RELEASE CANDIDATE/i.test(releaseRecord);
assert.ok(releaseRecord.includes(`Release tag: \`v${appVersion}\``), "Current release record tag is stale.");
assert.ok(releaseRecord.includes(`Runtime asset revision: \`${revision}\``), "Current release record revision is stale.");
assert.ok(
    projectState.includes(`**Application version:** v${appVersion}`) ||
    projectState.includes(`**Release candidate:** v${appVersion}`) ||
    projectState.includes(`Application version: v${appVersion}`) ||
    projectState.includes(`Release candidate: v${appVersion}`),
    "PROJECT_STATE version is stale."
);
assert.ok(
    projectState.includes(`**Runtime asset revision:** \`${revision}\``) ||
    projectState.includes(`Runtime asset revision: \`${revision}\``),
    "PROJECT_STATE revision is stale."
);
assert.ok(
    nextTask.includes(`Application version: v${appVersion}`) || nextTask.includes(`Release-candidate application: \`v${appVersion}\``),
    "NEXT_TASK version is stale."
);
assert.ok(nextTask.includes(`Runtime asset revision: \`${revision}\``), "NEXT_TASK revision is stale.");
if(!releaseCandidate){
    assert.ok(
        readme.includes(`**Application version:** v${appVersion}`) ||
        readme.includes(`**Release candidate:** v${appVersion}`) ||
        readme.includes(`Application version: v${appVersion}`) ||
        readme.includes(`Release candidate: v${appVersion}`),
        "README version is stale after production promotion."
    );
    assert.ok(changelog.includes(`# v${appVersion}`), "CHANGELOG has no promoted production release entry.");
}else{
    assert.ok(/v1\.1\.5/.test(readme) && /production-proven|production proven/i.test(readme), "During a release candidate, README must continue identifying the last production-proven release.");
    assert.ok(changelog.includes("# v1.1.5"), "During a release candidate, CHANGELOG must retain the last promoted production release.");
}
assert.ok(handoffGoldenRule.includes("Every developer or ChatGPT session") && handoffGoldenRule.includes("continuously"), "The owner-mandated continuous public handoff golden rule is missing.");
assert.ok(optional.includes("getApplicationAssetRevision()"), "Lazy assets must derive their revision from the shell.");
assert.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`), "The lazy visual fidelity stylesheet must use the shell cache identity.");
assert.ok(app.includes("contentScriptData\\.init_ts"), "The reproduced injected content-script signature must remain explicitly filtered.");
assert.ok(app.includes("isFirstPartyRuntimeError") && app.includes("suppressedExternalRuntimeErrors"), "Runtime provenance boundary contract is missing.");
assert.ok(nextTask.includes("v1.2.0") && /Installable Offline App/i.test(nextTask), "The v1.2.0 offline-app release task is missing from NEXT_TASK.");

const localShellRefs = Array.from(html.matchAll(/(?:src|href)="((?:css|js|data|assets)\/[^"?]+)(?:\?v=([^"]+))?"/g));
assert.ok(localShellRefs.length >= 9, "The initial shell asset set is unexpectedly incomplete.");
assert.deepEqual(
    localShellRefs.filter(match => match[2] !== revision).map(match => match[1]),
    [],
    "The initial shell contains a missing or mixed asset revision."
);

const storageValues = new Map();
const notices = [];
const localStorage = {
    getItem(key){ return storageValues.has(key) ? storageValues.get(key) : null; },
    setItem(key, value){ storageValues.set(key, String(value)); },
    removeItem(key){ storageValues.delete(key); }
};
const context = {
    console: { error(){}, warn(){}, log(){} },
    currentShowdown: null,
    localStorage,
    structuredClone,
    setTimeout,
    clearTimeout,
    CustomEvent: class CustomEvent {},
    document: {
        documentElement: { dataset: {} },
        addEventListener(){},
        visibilityState: "visible"
    },
    matchMedia(){
        return { matches: false, addEventListener(){}, addListener(){} };
    },
    addEventListener(){},
    dispatchEvent(){},
    showAppNotice(message){ notices.push(message); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(
    `${read("js/storage.js")}\n;globalThis.__storage = {` +
    "loadSavedShowdown,hasSavedShowdown,saveCurrentShowdown,loadLegacyShowdowns," +
    "loadApplicationPreferences,clearAllCareerModeData,STORAGE_KEY,LEGACY_STORAGE_KEY,APPLICATION_PREFERENCES_KEY};",
    context,
    { filename: "js/storage.js" }
);

const storage = context.__storage;
storageValues.set(storage.STORAGE_KEY, "{not valid json");
assert.equal(storage.loadSavedShowdown(), null, "Malformed active data must fail closed.");
assert.equal(storage.hasSavedShowdown(), false, "Malformed active bytes must remain preserved without advertising a usable Continue Career save.");
assert.equal(storageValues.get(storage.STORAGE_KEY), "{not valid json", "A stability read must not destroy recoverable raw bytes.");
assert.ok(notices.some(message => /parse the active showdown/i.test(message)), "Malformed active data needs a visible recovery notice.");

storageValues.set(storage.LEGACY_STORAGE_KEY, "{broken legacy");
assert.deepEqual(Array.from(storage.loadLegacyShowdowns()), [], "Malformed Legacy data must degrade to an empty derived view.");
assert.equal(storageValues.get(storage.LEGACY_STORAGE_KEY), "{broken legacy", "Malformed Legacy bytes must not be silently erased.");

storageValues.set(storage.APPLICATION_PREFERENCES_KEY, "[]");
const preferences = storage.loadApplicationPreferences();
assert.deepEqual(
    { ...preferences },
    { schemaVersion: 2, reducedMotion: false, menuFeedback: true },
    "Malformed preferences must fall back to the safe defaults."
);

context.currentShowdown = { id: 7, updatedAt: "preserved" };
const originalSetItem = localStorage.setItem;
localStorage.setItem = function setItemWithQuotaFailure(key, value){
    if(key === storage.STORAGE_KEY){
        throw new DOMException("Storage quota reached", "QuotaExceededError");
    }
    return originalSetItem.call(this, key, value);
};
assert.equal(storage.saveCurrentShowdown(), false, "Quota rejection must block a critical save.");
assert.equal(context.currentShowdown.updatedAt, "preserved", "A failed critical save must roll back updatedAt.");
localStorage.setItem = originalSetItem;

const stabilityWorkflow = read(".github/workflows/validate-stability-lane.yml");
for(const command of [
    "npm run test:contracts",
    "npm run test:runtime-boundary",
    "npm run test:home-visual",
    "npm run test:football-visual",
    "npm run test:backup-browser",
    "npm run test:import-browser",
    "npm run test:restore-browser",
    "npm run test:browser",
    "npm run verify:deployment"
]){
    assert.ok(stabilityWorkflow.includes(command), `Stability workflow lost required production/local command: ${command}`);
}
assert.ok(/canonical-stability-/.test(stabilityWorkflow), "Local Stability must own the canonical integration report artifact.");
assert.ok(/stability-audit-\*\.json/.test(stabilityWorkflow), "Local Stability artifact must retain the integration report.");

const candidateBWorkflow = read(".github/workflows/validate-import-analysis.yml");
assert.ok(/candidate-b-import-analysis-/.test(candidateBWorkflow), "Candidate B workflow must own its Data Management evidence artifact.");
assert.ok(/candidate-b-import-\*\.png/.test(candidateBWorkflow), "Candidate B screenshot evidence path is missing.");

const candidateCWorkflow = read(".github/workflows/validate-atomic-restore.yml");
assert.ok(/candidate-c-atomic-restore-/.test(candidateCWorkflow), "Candidate C workflow must own restore/recovery evidence.");
assert.ok(/candidate-c-restore-\*\.png/.test(candidateCWorkflow), "Candidate C restore/recovery screenshot evidence path is missing.");
assert.ok(fs.existsSync(path.join(root, ".github/workflows/validate-atomic-restore.yml")), "Candidate C dedicated permanent workflow is missing.");

const burnInWorkflow = read(".github/workflows/validate-v110-release-burnin.yml");
const burnInScript = read("tests/support/run-release-burnin-pass.sh");
assert.ok(/Validate Release Integration Burn-In/.test(burnInWorkflow), "Focused release integration Burn-In workflow is missing.");
assert.ok(/pass:\s*\[1, 2\]/.test(burnInWorkflow), "Release integration Burn-In must retain two independent journey passes.");
assert.ok(burnInScript.includes("npm run test:browser"), "Every release integration Burn-In pass must exercise the complete stateful journey.");
assert.ok(!burnInScript.includes("npm run test:restore-browser"), "Burn-In must not duplicate Candidate C's dedicated browser ownership.");

for(const workflowPath of fs.readdirSync(path.join(root, ".github/workflows"))){
    if(!workflowPath.endsWith(".yml")){ continue; }
    const source = read(path.join(".github/workflows", workflowPath));
    assert.ok(!source.includes("actions/checkout@v4"), `${workflowPath} still uses the Node 20 checkout action.`);
    assert.ok(!source.includes("actions/setup-node@v4"), `${workflowPath} still uses the Node 20 setup-node action.`);
}

process.stdout.write(
    `Stability contracts passed for v${appVersion} / ${revision}: release/package/document coherence, candidate-vs-production publication semantics, runtime provenance, corrupt raw-data preservation, quota rollback, single-owner Candidate B/C evidence, exhaustive deployed A/B/C proof, focused two-pass integration Burn-In, v1.2 offline release reservation, and Node 24 actions.\n`
);