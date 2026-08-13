const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const repositoryRoot = path.resolve(__dirname, "../..");
const localLifecycleProof = ["127.0.0.1", "localhost"].includes(baseUrl.hostname);
const activeStorageKey = "careerModeShowdown.activeShowdown";
const legacyStorageKey = "careerModeShowdown.legacyShowdowns";
const preferencesStorageKey = "careerModeShowdown.preferences";
const lifecycleDirectory = path.join(repositoryRoot, "tests", ".tmp-offline-lifecycle");

function checkpoint(message){ process.stdout.write(`PASS  ${message}\n`); }

function createPageMonitors(page){
    const pageErrors = [];
    const firstPartyFailures = [];
    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("requestfailed", request => {
        if(String(request.url()).startsWith(baseUrl.origin)){
            firstPartyFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
        }
    });
    page.on("response", response => {
        if(String(response.url()).startsWith(baseUrl.origin) && response.status() >= 400){
            firstPartyFailures.push(`${response.status()} ${response.url()}`);
        }
    });
    return {
        assertClean(label){
            assert.deepEqual(pageErrors, [], `${label} emitted page errors.`);
            assert.deepEqual(firstPartyFailures, [], `${label} had failed first-party requests.`);
        }
    };
}

async function waitForApplication(page, { requireOfflineReady = true } = {}){
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 15000 });
    await page.locator("#newShowdown").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForFunction(() => typeof window.getOfflineAppDiagnostics === "function", null, { timeout: 15000 });
    if(requireOfflineReady){
        await page.waitForFunction(() => window.getOfflineAppDiagnostics().offlineReady === true, null, { timeout: 30000 });
    }
}

async function openApplication(page, options = {}){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await waitForApplication(page, options);
}

async function readCanonicalStorage(page){
    return page.evaluate(keys => ({
        activeShowdown: localStorage.getItem(keys.active),
        legacyShowdowns: localStorage.getItem(keys.legacy),
        preferences: localStorage.getItem(keys.preferences)
    }), { active: activeStorageKey, legacy: legacyStorageKey, preferences: preferencesStorageKey });
}

async function seedCanonicalStorage(page){
    const fixture = {
        activeShowdown: JSON.stringify({
            schemaVersion: 2,
            id: "offline-audit-save",
            name: "Offline Audit",
            managers: { playerOne: "Manager One", playerTwo: "Manager Two" },
            totalRounds: 1,
            currentRound: 1,
            status: "Created",
            selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null },
            score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [],
            rounds: [],
            integrityWarnings: [],
            createdAt: "2026-08-13T00:00:00.000Z",
            updatedAt: "2026-08-13T00:00:00.000Z",
            completedAt: null,
            archivedAt: null
        }),
        legacyShowdowns: "[]",
        preferences: JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true })
    };
    await page.evaluate(({ keys, fixture: values }) => {
        localStorage.setItem(keys.active, values.activeShowdown);
        localStorage.setItem(keys.legacy, values.legacyShowdowns);
        localStorage.setItem(keys.preferences, values.preferences);
    }, {
        keys: { active: activeStorageKey, legacy: legacyStorageKey, preferences: preferencesStorageKey },
        fixture
    });
    return fixture;
}

async function getWorkerStatus(page){
    return page.evaluate(() => new Promise((resolve, reject) => {
        const worker = navigator.serviceWorker.controller;
        if(!worker){ reject(new Error("No controlling service worker.")); return; }
        const channel = new MessageChannel();
        const timeout = setTimeout(() => reject(new Error("Worker status timed out.")), 5000);
        channel.port1.onmessage = event => {
            clearTimeout(timeout);
            resolve({ scriptURL: worker.scriptURL, response: event.data });
        };
        worker.postMessage({ type: "CMS_GET_CACHE_STATUS" }, [channel.port2]);
    }));
}

async function runApplicationOfflineProof(browser){
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    const page = await context.newPage();
    const monitors = createPageMonitors(page);

    try{
        await openApplication(page);
        const diagnostics = await page.evaluate(() => window.getOfflineAppDiagnostics());
        assert.equal(diagnostics.supported, true, "Chromium audit runtime must support service workers.");
        assert.equal(diagnostics.registration, true, "Application must own a service-worker registration after first online load.");
        assert.equal(diagnostics.offlineReady, true, "First online load must prepare a complete offline shell.");
        assert.ok(diagnostics.installGuidance, "Install guidance must remain available even when a browser does not emit beforeinstallprompt.");
        checkpoint("first online install prepared a complete application shell");

        const manifest = await page.evaluate(async () => {
            const link = document.querySelector('link[rel="manifest"]');
            if(!link){ return null; }
            const response = await fetch(link.href);
            return {
                href: link.href,
                ok: response.ok,
                contentType: response.headers.get("content-type") || "",
                body: await response.json()
            };
        });
        assert.ok(manifest?.ok, "Linked web app manifest must be fetchable.");
        assert.match(manifest.contentType, /manifest\+json|application\/json/i, "Manifest must be served as manifest/JSON content.");
        assert.equal(manifest.body.display, "standalone", "Manifest must preserve standalone display mode.");
        assert.ok(manifest.body.icons.some(icon => icon.sizes === "192x192"), "Manifest must expose a 192px icon.");
        assert.ok(manifest.body.icons.some(icon => icon.sizes === "512x512"), "Manifest must expose a 512px icon.");
        checkpoint("install manifest is linked, fetchable, and install-sized");

        const status = await getWorkerStatus(page);
        assert.equal(status.response.current.ok, true, "Current application cache must verify completely.");
        assert.equal(status.response.current.missing.length, 0, "Verified current cache must have no missing shell resources.");
        const pageRevision = await page.locator('meta[name="app-asset-revision"]').getAttribute("content");
        assert.equal(status.response.current.revision, pageRevision, "Controlling cache revision must match the loaded page identity.");
        checkpoint("service-worker cache identity matches the loaded runtime");

        const fixture = await seedCanonicalStorage(page);
        assert.deepEqual(await readCanonicalStorage(page), fixture, "Canonical raw fixture must be written exactly before offline transition.");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForApplication(page);

        const offlineDiagnostics = await page.evaluate(() => window.getOfflineAppDiagnostics());
        assert.equal(offlineDiagnostics.connectivity, "offline", "Offline reload must expose offline connectivity state.");
        assert.equal(offlineDiagnostics.offlineReady, true, "Installed application must remain offline-ready after reload.");
        assert.match(await page.locator("#offlineAppState").innerText(), /OFFLINE/i, "Visible app status must explicitly report offline state.");
        assert.equal(await page.locator("#menuMusicToggle").isDisabled(), true, "Remote YouTube playback must be disabled while offline.");
        assert.match(await page.locator("#menuMusicStatus").innerText(), /OFFLINE.*YOUTUBE/i, "Remote media must explain why it is unavailable offline.");
        assert.deepEqual(await readCanonicalStorage(page), fixture, "Offline boot must preserve all three canonical raw values exactly.");
        checkpoint("installed offline boot preserves local data and degrades external media explicitly");

        await page.locator("#ruleBookButton").click();
        await page.locator("#ruleBook").waitFor({ state: "visible", timeout: 15000 });
        await page.locator("#ruleBook [data-smart-back]").click();
        await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 10000 });

        await page.locator("#newShowdown").click();
        await page.locator("#createShowdown").waitFor({ state: "visible", timeout: 20000 });
        const unsafeBoundary = await page.evaluate(() => window.getOfflineUpdateBoundaryStatus());
        assert.equal(unsafeBoundary.safe, false, "Unsaved creation form must not be an update activation boundary.");
        await page.locator("#createShowdown [data-smart-back]").click();
        await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 10000 });
        const safeBoundary = await page.evaluate(() => window.getOfflineUpdateBoundaryStatus());
        assert.equal(safeBoundary.safe, true, "Home must be an explicit safe update boundary.");

        await page.locator("#legacyButton").click();
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 20000 });
        const recoveryApis = await page.evaluate(() => ({
            candidateA: typeof window.createCareerModeBackupEnvelope,
            candidateB: typeof window.analyzeCareerModeBackupFile,
            candidateCPlan: typeof window.createCareerModeRestorePlan,
            candidateCApply: typeof window.applyCareerModeRestore,
            transaction: typeof window.runCareerModeRawStorageTransaction
        }));
        assert.deepEqual(recoveryApis, {
            candidateA: "function",
            candidateB: "function",
            candidateCPlan: "function",
            candidateCApply: "function",
            transaction: "function"
        }, "Candidate A/B/C modules must remain loadable from the offline shell.");
        assert.deepEqual(await readCanonicalStorage(page), fixture, "Loading Candidate A/B/C offline must not mutate canonical raw bytes.");
        checkpoint("core optional routes and Candidate A/B/C modules load offline without storage mutation");

        await context.setOffline(false);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForApplication(page);
        assert.deepEqual(await readCanonicalStorage(page), fixture, "Repeat online load after offline use must preserve canonical raw bytes.");
        monitors.assertClean("Application offline proof");
        checkpoint("repeat online load remained clean after offline session");
    }finally{
        await context.close();
    }
}

function lifecycleWorkerSource(baseSource, revision, previousRevision, { failPopulation = false } = {}){
    let source = baseSource
        .replace(/const RUNTIME_REVISION = "[^"]+";/, `const RUNTIME_REVISION = "${revision}";`)
        .replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/, `const PREVIOUS_RUNTIME_REVISION = "${previousRevision}";`)
        .replace(/const SHELL_PATHS = Object\.freeze\(\[[\s\S]*?\]\);/, 'const SHELL_PATHS = Object.freeze(["index.html", "app.js"]);');
    if(failPopulation){
        source = source.replace(
            'const SHELL_PATHS = Object.freeze(["index.html", "app.js"]);',
            'const SHELL_PATHS = Object.freeze(["index.html", "app.js", "missing-required-shell.js"]);'
        );
    }
    return source;
}

function writeLifecycleRuntime(revision){
    fs.writeFileSync(
        path.join(lifecycleDirectory, "index.html"),
        `<!doctype html><html><head><meta charset="utf-8"><meta name="audit-runtime" content="${revision}"></head><body><main id="runtime">pending</main><script src="app.js?v=${revision}"></script></body></html>\n`
    );
    fs.writeFileSync(
        path.join(lifecycleDirectory, "app.js"),
        `document.getElementById("runtime").textContent=${JSON.stringify(revision)};document.documentElement.dataset.auditRuntime=${JSON.stringify(revision)};\n`
    );
}

async function waitForLifecycleRuntime(page, revision){
    await page.waitForFunction(expected => document.documentElement.dataset.auditRuntime === expected, revision, { timeout: 10000 });
}

async function lifecycleWorkerMessage(page, workerSelector, type){
    return page.evaluate(({ selector, messageType }) => new Promise((resolve, reject) => {
        navigator.serviceWorker.getRegistration("./").then(registration => {
            const worker = selector === "waiting" ? registration?.waiting : registration?.active;
            if(!worker){ reject(new Error(`No ${selector} worker available.`)); return; }
            const channel = new MessageChannel();
            const timeout = setTimeout(() => reject(new Error(`${messageType} timed out.`)), 5000);
            channel.port1.onmessage = event => {
                clearTimeout(timeout);
                resolve(event.data);
            };
            worker.postMessage({ type: messageType }, [channel.port2]);
        }).catch(reject);
    }), { selector: workerSelector, messageType: type });
}

async function requestLifecycleUpdate(page){
    return page.evaluate(() => new Promise(async (resolve, reject) => {
        const registration = await navigator.serviceWorker.getRegistration("./");
        if(!registration){ reject(new Error("Lifecycle registration missing.")); return; }
        const timeout = setTimeout(() => reject(new Error("Lifecycle update timed out.")), 15000);
        const settle = worker => {
            if(!worker){ return false; }
            const finish = () => {
                if(worker.state === "installed" || worker.state === "redundant"){
                    clearTimeout(timeout);
                    resolve({ state: worker.state, scriptURL: worker.scriptURL });
                }
            };
            worker.addEventListener("statechange", finish);
            finish();
            return true;
        };
        registration.addEventListener("updatefound", () => settle(registration.installing), { once: true });
        await registration.update();
        settle(registration.installing);
    }));
}

async function activateLifecycleWaitingWorker(page){
    const response = await lifecycleWorkerMessage(page, "waiting", "CMS_ACTIVATE_UPDATE");
    assert.equal(response.type, "CMS_ACTIVATION_ACCEPTED", "Waiting lifecycle worker must accept activation only after complete cache verification.");
    assert.equal(response.ok, true, "Verified lifecycle update must be activatable.");
    await page.waitForFunction(() => navigator.serviceWorker.getRegistration("./").then(registration => !registration.waiting), null, { timeout: 10000 });
}

async function corruptLifecycleCache(page, revision){
    await page.evaluate(async revisionValue => {
        const cacheName = `career-mode-showdown-shell-${revisionValue}`;
        const cache = await caches.open(cacheName);
        const url = new URL("app.js", location.href);
        url.searchParams.set("v", revisionValue);
        const removed = await cache.delete(url.href);
        if(!removed){ throw new Error(`Unable to corrupt ${cacheName} for audit.`); }
    }, revision);
}

async function runLifecycleProof(browser){
    if(!localLifecycleProof){
        process.stdout.write("SKIP  synthetic cache-revision lifecycle proof runs only against the local repository server\n");
        return;
    }

    fs.rmSync(lifecycleDirectory, { recursive: true, force: true });
    fs.mkdirSync(lifecycleDirectory, { recursive: true });
    const productionWorker = fs.readFileSync(path.join(repositoryRoot, "service-worker.js"), "utf8");
    const workerPath = path.join(lifecycleDirectory, "service-worker.js");
    const revisions = { r1: "audit-r1", bad: "audit-bad", r2: "audit-r2", r3: "audit-r3" };
    writeLifecycleRuntime(revisions.r1);
    fs.writeFileSync(workerPath, lifecycleWorkerSource(productionWorker, revisions.r1, ""));

    const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
    const page = await context.newPage();
    const lifecycleUrl = new URL("tests/.tmp-offline-lifecycle/", baseUrl).href;

    try{
        await page.goto(lifecycleUrl, { waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(page, revisions.r1);
        await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.register("service-worker.js", { scope: "./", updateViaCache: "none" });
            await navigator.serviceWorker.ready;
            if(!navigator.serviceWorker.controller){
                await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
            }
            return registration.active?.state || "";
        });
        const initialStatus = await lifecycleWorkerMessage(page, "active", "CMS_GET_CACHE_STATUS");
        assert.equal(initialStatus.current.ok, true, "Lifecycle r1 cache must install completely.");
        await page.evaluate(() => caches.open("unrelated-audit-cache").then(cache => cache.put("marker", new Response("keep"))));
        checkpoint("lifecycle harness installed coherent r1 shell");

        fs.writeFileSync(workerPath, lifecycleWorkerSource(productionWorker, revisions.bad, revisions.r1, { failPopulation: true }));
        const failedUpdate = await requestLifecycleUpdate(page);
        assert.equal(failedUpdate.state, "redundant", "Failed cache population must discard the new worker.");
        const afterFailure = await lifecycleWorkerMessage(page, "active", "CMS_GET_CACHE_STATUS");
        assert.equal(afterFailure.current.revision, revisions.r1, "Failed population must leave the old active runtime authoritative.");
        assert.equal(afterFailure.current.ok, true, "Old cache must remain complete after failed update attempt.");
        checkpoint("failed new-cache population preserved active known-good runtime");

        writeLifecycleRuntime(revisions.r2);
        fs.writeFileSync(workerPath, lifecycleWorkerSource(productionWorker, revisions.r2, revisions.r1));
        const r2Update = await requestLifecycleUpdate(page);
        assert.equal(r2Update.state, "installed", "Complete r2 update must wait rather than auto-activate.");
        assert.equal(await page.locator("#runtime").innerText(), revisions.r1, "Live page must stay on r1 while r2 is waiting.");
        const waitingR2 = await lifecycleWorkerMessage(page, "waiting", "CMS_GET_CACHE_STATUS");
        assert.equal(waitingR2.current.ok, true, "Waiting r2 worker must own a fully verified cache.");
        await activateLifecycleWaitingWorker(page);
        assert.equal(await page.locator("#runtime").innerText(), revisions.r1, "Controller activation alone must not rewrite the live document.");
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(page, revisions.r2);
        const unrelatedStillPresent = await page.evaluate(() => caches.keys().then(names => names.includes("unrelated-audit-cache")));
        assert.equal(unrelatedStillPresent, true, "Activation must not delete unrelated origin caches.");
        checkpoint("r1 to r2 update waited, activated explicitly, and preserved unrelated caches");

        await corruptLifecycleCache(page, revisions.r2);
        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(page, revisions.r1);
        const r2Recovery = await lifecycleWorkerMessage(page, "active", "CMS_GET_CACHE_STATUS");
        assert.equal(r2Recovery.current.ok, false, "Corrupted r2 cache must be detected as incomplete.");
        assert.equal(r2Recovery.previous.ok, true, "Known-good r1 cache must remain complete for coherent recovery.");
        checkpoint("cycle one corruption rolled the entire offline navigation back to coherent r1");

        await context.setOffline(false);
        writeLifecycleRuntime(revisions.r3);
        fs.writeFileSync(workerPath, lifecycleWorkerSource(productionWorker, revisions.r3, revisions.r1));
        const r3Update = await requestLifecycleUpdate(page);
        assert.equal(r3Update.state, "installed", "Complete r3 update must wait for explicit activation.");
        await activateLifecycleWaitingWorker(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(page, revisions.r3);
        await corruptLifecycleCache(page, revisions.r3);
        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(page, revisions.r1);
        const r3Recovery = await lifecycleWorkerMessage(page, "active", "CMS_GET_CACHE_STATUS");
        assert.equal(r3Recovery.current.ok, false, "Corrupted r3 cache must be detected as incomplete.");
        assert.equal(r3Recovery.previous.ok, true, "r1 must remain known-good through the second upgrade cycle.");
        checkpoint("cycle two corruption again rolled the entire offline navigation back to coherent r1");

        await page.close();
        const restarted = await context.newPage();
        await restarted.goto(lifecycleUrl, { waitUntil: "domcontentloaded" });
        await waitForLifecycleRuntime(restarted, revisions.r1);
        checkpoint("new page under restarted offline control deterministically selected the known-good shell");
        await restarted.close();
    }finally{
        await context.close();
        fs.rmSync(lifecycleDirectory, { recursive: true, force: true });
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
    try{
        await runApplicationOfflineProof(browser);
        await runLifecycleProof(browser);
        process.stdout.write("Installable/offline browser audit passed.\n");
    }finally{
        await browser.close();
        fs.rmSync(lifecycleDirectory, { recursive: true, force: true });
    }
})().catch(error => {
    console.error("INSTALLABLE/OFFLINE BROWSER AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
