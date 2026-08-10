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
const projectState = read("PROJECT_STATE.md");
const nextTask = read("NEXT_TASK.md");
const readme = read("README.md");
const changelog = read("CHANGELOG.md");

const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1];
const footerVersion = (html.match(/<footer>[\s\S]*?v([^<\s]+)\s*·\s*Stable[\s\S]*?<\/footer>/i) || [])[1];

assert.equal(packageJson.version, appVersion, "package.json and APP_VERSION must agree.");
assert.equal(packageJson.devDependencies["@sparticuz/chromium"], "149.0.0", "The registry-distributed Chromium runtime must remain pinned.");
assert.equal(footerVersion, appVersion, "The user-facing footer version is stale.");
assert.equal(revision, `${appVersion}-r1`, "The patch release must begin with an r1 cache identity.");
assert.ok(projectState.includes(`**Application version:** v${appVersion} — Stable`), "PROJECT_STATE version is stale.");
assert.ok(projectState.includes(`**Runtime asset revision:** \`${revision}\``), "PROJECT_STATE revision is stale.");
assert.ok(nextTask.includes(`**Application version:** v${appVersion}`), "NEXT_TASK version is stale.");
assert.ok(nextTask.includes(`**Runtime asset revision:** \`${revision}\``), "NEXT_TASK revision is stale.");
assert.ok(readme.includes(`**Application version:** v${appVersion} — Stable`), "README version is stale.");
assert.ok(changelog.includes(`# v${appVersion}`), "CHANGELOG has no current release entry.");
assert.ok(optional.includes("getApplicationAssetRevision()"), "Lazy assets must derive their revision from the shell.");

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
assert.equal(storage.hasSavedShowdown(), true, "Malformed active bytes must remain guarded from silent replacement.");
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

const workflow = read(".github/workflows/validate-stability-lane.yml");
assert.ok(workflow.includes("npm run test:contracts"), "Stability workflow must run contract fixtures.");
assert.ok(workflow.includes("npm run test:browser"), "Stability workflow must run the real browser audit.");
assert.ok(workflow.includes("npm run verify:deployment"), "Stability workflow must verify the deployed tree.");

for(const workflowPath of fs.readdirSync(path.join(root, ".github/workflows"))){
    if(!workflowPath.endsWith(".yml")){ continue; }
    const source = read(path.join(".github/workflows", workflowPath));
    assert.ok(!source.includes("actions/checkout@v4"), `${workflowPath} still uses the Node 20 checkout action.`);
    assert.ok(!source.includes("actions/setup-node@v4"), `${workflowPath} still uses the Node 20 setup-node action.`);
}

process.stdout.write(
    `Stability contracts passed for v${appVersion} / ${revision}: release coherence, corrupt data, quota rollback, CI ownership, and Node 24 actions.\n`
);
