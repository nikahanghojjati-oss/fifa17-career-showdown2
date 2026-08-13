const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = relativePath => fs.existsSync(path.join(root, relativePath));

const html = read("index.html");
const app = read("js/app.js");
const offline = read("js/offlineApp.js");
const worker = read("service-worker.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

const revision = (html.match(/app-asset-revision"\s+content="([^"]+)"/) || [])[1];
const appVersion = (app.match(/const APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
const workerRevision = (worker.match(/const RUNTIME_REVISION\s*=\s*"([^"]+)"/) || [])[1];
assert.ok(revision, "The application shell must expose an asset revision.");
assert.ok(appVersion, "APP_VERSION is missing.");
assert.equal(revision, `${appVersion}-r1`, "Offline shell identity must track APP_VERSION.");
assert.equal(workerRevision, revision, "Service-worker cache identity must match the page runtime revision.");

assert.equal(manifest.start_url, "./", "Manifest start_url must stay inside the GitHub Pages scope.");
assert.equal(manifest.scope, "./", "Manifest scope must stay relative to the repository Pages path.");
assert.equal(manifest.display, "standalone", "Installable app must request standalone display mode.");
assert.ok(manifest.theme_color && manifest.background_color, "Install manifest must define theme and background colors.");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, "Install manifest must expose normal and maskable artwork.");
assert.ok(manifest.icons.some(icon => icon.sizes === "192x192" && /\bany\b/.test(icon.purpose || "any")), "Manifest needs a 192x192 install icon.");
assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && /\bany\b/.test(icon.purpose || "any")), "Manifest needs a 512x512 install icon.");
assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && /\bmaskable\b/.test(icon.purpose || "")), "Manifest needs a 512x512 maskable icon.");
for(const icon of manifest.icons){
    const parsed = new URL(icon.src, "https://example.invalid/app/");
    const relativePath = parsed.pathname.replace(/^\/app\//, "");
    assert.equal(parsed.searchParams.get("v"), revision, `${relativePath} must use the current install revision.`);
    assert.ok(exists(relativePath), `Manifest icon does not exist: ${relativePath}`);
}

for(const [file, expected] of [
    ["assets/icons/showdown-192.svg", "192"],
    ["assets/icons/showdown-512.svg", "512"],
    ["assets/icons/showdown-maskable-512.svg", "512"]
]){
    const source = read(file);
    assert.ok(source.includes(`width="${expected}"`) && source.includes(`height="${expected}"`), `${file} does not match its advertised square size.`);
}

const eagerScripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)].map(match => match[1]);
assert.equal(eagerScripts.length, 7, "Installable-app work must not expand the seven-script eager startup shell.");
assert.equal(eagerScripts.some(src => src.includes("offlineApp.js")), false, "Offline controller must remain lazy and outside startup budgets.");
assert.ok(app.includes("manifest.webmanifest") && app.includes("js/offlineApp.js"), "The eager app must lazily link the manifest and offline controller.");

const shellMatch = worker.match(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(shellMatch, "Service worker must declare an explicit version-owned shell list.");
const shellPaths = JSON.parse(shellMatch[1]);
assert.ok(shellPaths.length >= 50, "Offline shell list is unexpectedly small.");
assert.equal(new Set(shellPaths).size, shellPaths.length, "Offline shell list must not contain duplicate resources.");
for(const required of ["index.html", "manifest.webmanifest", "css/offline.css", "js/offlineApp.js", "js/backup.js", "js/importAnalysis.js", "js/restore.js", "js/storageTransaction.js", "assets/icons/showdown-192.svg", "assets/icons/showdown-512.svg", "assets/icons/showdown-maskable-512.svg"]){
    assert.ok(shellPaths.includes(required), `Offline shell is missing required resource: ${required}`);
}
for(const relativePath of shellPaths){
    assert.ok(exists(relativePath), `Offline shell resource does not exist: ${relativePath}`);
}

const installBlock = (worker.match(/self\.addEventListener\("install"[\s\S]*?\n\}\);/) || [""])[0];
assert.ok(installBlock.includes("populateCurrentCache"), "Service-worker install must fully populate and verify the new shell.");
assert.equal(installBlock.includes("skipWaiting"), false, "A newly installed revision must never auto-activate.");
assert.ok(worker.includes('type === "CMS_ACTIVATE_UPDATE"'), "Explicit Update Ready activation message is missing.");
assert.ok(worker.includes("const status = await verifyCache(RUNTIME_REVISION)") && worker.includes("await self.skipWaiting()"), "Update activation must verify the complete current cache before skipWaiting.");
assert.ok(worker.includes("chooseNavigationRuntime"), "Navigation must select one coherent runtime revision.");
assert.ok(worker.includes('type === "CMS_PROBE_NETWORK"'), "Connectivity verification must be worker-owned.");
assert.ok(worker.includes('type === "CMS_GET_CACHE_STATUS"'), "Offline diagnostics cache-status message is missing.");
assert.ok(worker.includes('type === "CMS_ROLLBACK_TO_PREVIOUS"'), "Known-good previous-runtime recovery message is missing.");
assert.ok(worker.includes("!keepShellCaches.has(name)"), "Activation must clean only obsolete application-shell revisions.");

assert.ok(offline.includes('new Set(["mainMenu","dashboard"])'), "Update activation safe boundaries must remain Home and Showdown Home only.");
assert.ok(offline.includes('[data-transaction-busy="true"],[data-critical-recovery="true"]'), "Update activation must observe Candidate C transaction/recovery busy state.");
assert.ok(offline.includes("activationRequested") && offline.includes("controllerchange") && offline.includes("location.reload()"), "Page reload must remain tied to an explicitly requested worker activation.");
assert.ok(offline.includes('updateViaCache:"none"'), "Service-worker update checks must bypass intermediary HTTP cache reuse.");
assert.ok(offline.includes("CMS_PROBE_NETWORK"), "Page connectivity must use the worker-owned network probe.");
assert.ok(offline.includes("OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION"), "External YouTube media must degrade explicitly offline.");
assert.ok(offline.includes("CrOS") && offline.includes("Android") && offline.includes("Add to Home Screen"), "Install guidance must cover Chromebook/Android and browser fallback paths.");

const workflowDirectory = path.join(root, ".github", "workflows");
const workflowSources = fs.readdirSync(workflowDirectory)
    .filter(file => /\.ya?ml$/i.test(file))
    .map(file => ({ file, source: fs.readFileSync(path.join(workflowDirectory, file), "utf8") }));
const offlineAuditOwners = workflowSources.flatMap(({ file, source }) => [...source.matchAll(/tests\/browser\/offline-app-audit\.cjs/g)].map(() => file));
assert.deepEqual(offlineAuditOwners, ["validate-stability-lane.yml", "validate-stability-lane.yml"], "Offline browser evidence must have one local and one deployed Stability owner without specialist duplication.");
const stability = workflowSources.find(item => item.file === "validate-stability-lane.yml")?.source || "";
assert.ok(stability.includes("CMS_CHROMIUM_MULTI_CONTEXT=1") && stability.includes("offline-app-audit.cjs"), "Local Stability must own the multi-context cache lifecycle proof.");
assert.ok(stability.includes("CMS_BASE_URL: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/") && stability.includes("Run install and offline audit against deployed Pages"), "Deployed Stability must own the public offline boundary proof.");

console.log(`Installable/offline static contracts passed for ${revision}: ${shellPaths.length} version-owned shell resources, ${manifest.icons.length} install icons, one local and one deployed Stability owner.`);