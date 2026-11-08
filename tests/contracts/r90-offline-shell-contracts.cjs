"use strict";
// r90: the live checks of the three unregistered offline-shell contracts (offline-shell, -v2, -v3; originals on branch
// archive/pre-r90), re-pointed at today's worker and registered so they run. Dropped, because the behaviour is gone:
// the YouTube offline notice (no YouTube media since the music player change), the css/offline.css mobile Reus band and
// crop (loading screen rebuilt in r71), and owners for offline-app-audit / settings-install-audit (workflows retired).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = relativePath => fs.existsSync(path.join(root, relativePath));
let checks = 0;
function check(name, work){ work(); checks++; console.log(`ok ${checks} ${name}`); }

const html = read("index.html");
const app = read("js/app.js");
const offline = read("js/offlineApp.js");
const offlineCss = read("css/offline.css");
const settings = read("js/settings.js");
const settingsCss = read("css/settings.css");
const worker = read("service-worker.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
const revision = (html.match(/app-asset-revision"\s+content="([^"]+)"/) || [])[1];

check("OS1 one numbered runtime revision for page and worker; the previous one never aliases it", () => {
  const appVersion = (app.match(/const APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
  const workerRevision = (worker.match(/const RUNTIME_REVISION\s*=\s*"([^"]+)"/) || [])[1];
  const previousWorkerRevision = (worker.match(/const PREVIOUS_RUNTIME_REVISION\s*=\s*"([^"]*)"/) || [])[1];
  assert.ok(revision, "The application shell must expose an asset revision.");
  assert.ok(appVersion, "APP_VERSION is missing.");
  assert.match(revision, new RegExp(`^${appVersion.replace(/\./g, "\\.")}-r[1-9]\\d*$`), "Offline shell identity must be a numbered runtime revision for APP_VERSION.");
  assert.equal(workerRevision, revision, "Service-worker cache identity must match the page runtime revision.");
  assert.notEqual(previousWorkerRevision, workerRevision, "Previous known-good runtime must never alias the current cache revision.");
});

check("OS2 the install manifest stays in the Pages scope with standalone display and normal plus maskable icons", () => {
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
  for(const [file, expected] of [["assets/icons/showdown-192.svg", "192"], ["assets/icons/showdown-512.svg", "512"], ["assets/icons/showdown-maskable-512.svg", "512"]]){
    const source = read(file);
    assert.ok(source.includes(`width="${expected}"`) && source.includes(`height="${expected}"`), `${file} does not match its advertised square size.`);
  }
});

check("OS3 the offline controller stays lazy: seven eager scripts, manifest and offlineApp.js linked from app.js", () => {
  const eagerScripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)].map(match => match[1]);
  assert.equal(eagerScripts.length, 7, "Installable-app work must not expand the seven-script eager startup shell.");
  assert.equal(eagerScripts.some(src => src.includes("offlineApp.js")), false, "Offline controller must remain lazy and outside startup budgets.");
  assert.ok(app.includes("manifest.webmanifest") && app.includes("js/offlineApp.js"), "The eager app must lazily link the manifest and offline controller.");
});

check("OS4 the shell list is explicit, has no duplicates, holds the recovery files and every listed file exists", () => {
  const shellMatch = worker.match(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
  assert.ok(shellMatch, "Service worker must declare an explicit version-owned shell list.");
  const shellPaths = JSON.parse(shellMatch[1]);
  assert.ok(shellPaths.length >= 50, "Offline shell list is unexpectedly small.");
  assert.equal(new Set(shellPaths).size, shellPaths.length, "Offline shell list must not contain duplicate resources.");
  for(const required of ["index.html", "manifest.webmanifest", "css/offline.css", "css/settings.css", "js/offlineApp.js", "js/settings.js", "js/backup.js", "js/importAnalysis.js", "js/restore.js", "js/storageTransaction.js", "assets/icons/showdown-192.svg", "assets/icons/showdown-512.svg", "assets/icons/showdown-maskable-512.svg"]){
    assert.ok(shellPaths.includes(required), `Offline shell is missing required resource: ${required}`);
  }
  for(const relativePath of shellPaths) assert.ok(exists(relativePath), `Offline shell resource does not exist: ${relativePath}`);
});

check("OS5 install only fills the new cache; activation is an explicit, verified message; probe, status and rollback stay worker-owned", () => {
  const install = (worker.match(/self\.addEventListener\("install"[^\n]*/) || [""])[0];
  assert.ok(install.includes("populateCurrentCache"), "Service-worker install must fully populate and verify the new shell.");
  assert.equal(install.includes("skipWaiting"), false, "A newly installed revision must never auto-activate.");
  const handler = type => { const start = worker.search(new RegExp(`type\\s*===\\s*"${type}"`)); assert.ok(start >= 0, `worker message ${type} is missing`); return worker.slice(start, worker.indexOf("\n", start)); };
  const activate = handler("CMS_ACTIVATE_UPDATE");
  assert.ok(/const status\s*=\s*await verifyCache\(RUNTIME_REVISION\)/.test(activate) && activate.indexOf("verifyCache") < activate.indexOf("await self.skipWaiting()"), "Update activation must verify the complete current cache before skipWaiting.");
  for(const type of ["CMS_PROBE_NETWORK", "CMS_GET_CACHE_STATUS", "CMS_ROLLBACK_TO_PREVIOUS"]) handler(type);
  assert.ok(worker.includes("chooseNavigationRuntime"), "Navigation must select one coherent runtime revision.");
  assert.ok(worker.includes("!keepShellCaches.has(name)"), "Activation must clean only obsolete application-shell revisions.");
});

check("OS6 the page activates only at Home or Showdown Home, never mid-transaction, and reloads only after its own request", () => {
  assert.ok(offline.includes('new Set(["mainMenu","dashboard"])'), "Update activation safe boundaries must remain Home and Showdown Home only.");
  assert.ok(offline.includes('[data-transaction-busy="true"],[data-critical-recovery="true"]'), "Update activation must observe Candidate C transaction/recovery busy state.");
  assert.ok(offline.includes("activationRequested") && offline.includes("controllerchange") && offline.includes("location.reload()"), "Page reload must remain tied to an explicitly requested worker activation.");
  assert.ok(offline.includes('updateViaCache:"none"'), "Service-worker update checks must bypass intermediary HTTP cache reuse.");
  assert.ok(offline.includes("CMS_PROBE_NETWORK"), "Page connectivity must use the worker-owned network probe.");
  assert.ok(offline.includes("CrOS") && offline.includes("Android") && offline.includes("Add to Home Screen"), "Install guidance must cover Chromebook/Android, iOS and browser fallback paths.");
  assert.ok(offline.includes("getOfflineAppSettingsState") && offline.includes("requestOfflineAppInstall"), "Offline controller must expose UI-neutral Settings APIs.");
});

check("OS7 install UI lives only in Settings: no global rail or panel, no fixed or sticky offline UI, no raw vh art geometry", () => {
  for(const forbidden of ["offlineAppRail", "offlineAppPanel", "ensureOfflineUI", "offlineInstallPanel"]){
    assert.equal(offline.includes(forbidden), false, `Global install presentation returned to offline controller: ${forbidden}`);
    assert.equal(offlineCss.includes(forbidden), false, `Global install presentation returned to offline stylesheet: ${forbidden}`);
  }
  assert.equal(/position\s*:\s*(fixed|sticky)/i.test(offlineCss), false, "Offline stylesheet must not create fixed or sticky install UI.");
  assert.equal(/\b100(?:d|s|l)?vh\b/i.test(offlineCss), false, "Offline stylesheet must not use raw viewport-height units for art geometry.");
  assert.ok(settings.includes("createOfflinePanel") && settings.includes("settingsOfflineInstallButton"), "Settings must own the Offline App installation panel and action.");
  assert.ok(settings.includes("requestOfflineAppInstall") && settings.includes("activateWaitingOfflineUpdate"), "Settings installation and update controls must delegate to the existing offline controller.");
  assert.ok(settingsCss.includes(".settingsOfflinePanel") && settingsCss.includes(".settingsOfflineInstallButton"), "Settings Offline App presentation is missing.");
});

check("OS8 the Stability lane owns the offline boundary proof, locally (multi-context) and against deployed Pages", () => {
  const dir = path.join(root, ".github", "workflows");
  const sources = fs.readdirSync(dir).filter(file => /\.ya?ml$/i.test(file)).map(file => ({ file, source: fs.readFileSync(path.join(dir, file), "utf8") }));
  const owners = pattern => sources.flatMap(({ file, source }) => [...source.matchAll(pattern)].map(() => file));
  assert.deepEqual(owners(/tests\/browser\/offline-boundary-audit\.cjs/g), ["validate-stability-lane.yml", "validate-stability-lane.yml"], "offline boundary owner count");
  assert.ok(exists("tests/browser/offline-boundary-audit.cjs"), "offline boundary audit is missing");
  const stability = sources.find(item => item.file === "validate-stability-lane.yml").source;
  assert.ok(stability.includes("CMS_CHROMIUM_MULTI_CONTEXT=1"), "multi-context lifecycle marker missing");
  assert.ok(stability.includes("Run install and offline boundary audit against deployed Pages"), "deployed offline boundary step missing");
});

console.log(`PASS r90 offline shell contracts: ${checks} checks`);
