const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/");
const expectedOrigin = "https://nikahanghojjati-oss.github.io";
const expectedPathPrefix = "/fifa17-career-showdown2/";
const expectedBrowserFirestoreWriteScope = "spark-private-account-device-pairing-connected-rivalry-state";

function sanitizeDiagnosticText(value){
    return String(value || "")
        .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-browser-key]")
        .replace(/https?:\/\/[^\s)]+/g, rawUrl => {
            try{
                const url = new URL(rawUrl.replace(/[,'";]+$/g, ""));
                return `${url.origin}${url.pathname}`;
            }catch(_error){
                return "[redacted-url]";
            }
        });
}

function sanitizeDependencyUrl(rawUrl){
    try{
        const url = new URL(rawUrl);
        return `${url.origin}${url.pathname}`;
    }catch(_error){
        return "[invalid-url]";
    }
}

function isAppCheckDependency(rawUrl){
    try{
        const url = new URL(rawUrl);
        if(url.hostname === "www.gstatic.com") return /\/firebasejs\/|\/recaptcha\//i.test(url.pathname);
        if(url.hostname === "firebaseappcheck.googleapis.com") return true;
        if(url.hostname === "recaptchaenterprise.googleapis.com") return true;
        return /(^|\.)google\.com$/i.test(url.hostname) && /\/recaptcha\//i.test(url.pathname);
    }catch(_error){
        return false;
    }
}

assert.equal(baseUrl.origin, expectedOrigin, "Production App Check proof must target the GitHub Pages production origin.");
assert.ok(baseUrl.pathname.startsWith(expectedPathPrefix), "Production App Check proof must target the production project path.");

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({
        executablePath: runtime.executablePath,
        args: runtime.args,
        headless: true
    });

    try{
        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            locale: "en-US"
        });
        const page = await context.newPage();
        const firstPartyFailures = [];
        const appCheckDependencyFailures = [];
        const appCheckRuntimeMessages = [];

        page.on("requestfailed", request => {
            if(request.url().startsWith(baseUrl.href)){
                firstPartyFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
            }
            if(isAppCheckDependency(request.url())){
                appCheckDependencyFailures.push({
                    kind: "requestfailed",
                    method: request.method(),
                    url: sanitizeDependencyUrl(request.url()),
                    error: sanitizeDiagnosticText(request.failure()?.errorText || "failed")
                });
            }
        });
        page.on("response", response => {
            if(response.url().startsWith(baseUrl.href) && response.status() >= 400){
                firstPartyFailures.push(`${response.status()} ${response.url()}`);
            }
            if(isAppCheckDependency(response.url()) && response.status() >= 400){
                appCheckDependencyFailures.push({
                    kind: "response",
                    status: response.status(),
                    url: sanitizeDependencyUrl(response.url())
                });
            }
        });
        page.on("console", message => {
            if(!["warning", "error"].includes(message.type())) return;
            const text = message.text();
            if(!/Career Mode Showdown.*App Check|FirebaseError|appCheck\//i.test(text)) return;
            const location = message.location();
            appCheckRuntimeMessages.push({
                type: message.type(),
                text: sanitizeDiagnosticText(text),
                source: location && location.url ? sanitizeDependencyUrl(location.url) : null
            });
        });
        page.on("pageerror", error => {
            const message = sanitizeDiagnosticText(error && error.message ? error.message : error);
            if(/App Check|FirebaseError|appCheck\//i.test(message)){
                appCheckRuntimeMessages.push({type: "pageerror", text: message, source: null});
            }
        });

        await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });

        await page.waitForFunction(() => {
            const api = window.CareerModeProductionFirebaseRuntime;
            if(!api || typeof api.diagnostics !== "function") return false;
            const state = api.diagnostics();
            return Boolean(state && state.attempted && state.status !== "initializing");
        }, null, { timeout: 20000 });

        await page.waitForFunction(() => {
            const api = window.CareerModeProductionFirebaseRuntime;
            if(!api || typeof api.diagnostics !== "function") return false;
            const state = api.diagnostics();
            return Boolean(state && state.authInitialized === true && state.firestoreInitialized === true);
        }, null, { timeout: 20000 });

        const proof = await page.evaluate(async () => {
            const api = window.CareerModeProductionFirebaseRuntime;
            const diagnostics = api.diagnostics();
            const response = await fetch(new URL("firebase.runtime-config.json", location.href), {
                cache: "no-store",
                credentials: "same-origin"
            });
            const config = await response.json();
            const resources = performance.getEntriesByType("resource").map(entry => ({
                name: entry.name,
                startTime: Number(entry.startTime || 0),
                responseEnd: Number(entry.responseEnd || 0)
            }));
            return {
                diagnostics,
                configShape: {
                    responseOk: response.ok,
                    schemaVersion: config && config.schemaVersion,
                    configured: config && config.configured,
                    projectId: config && config.firebaseConfig && config.firebaseConfig.projectId,
                    apiKeyPresent: Boolean(config && config.firebaseConfig && typeof config.firebaseConfig.apiKey === "string" && config.firebaseConfig.apiKey.length >= 20),
                    siteKeyPresent: Boolean(config && typeof config.recaptchaEnterpriseSiteKey === "string" && config.recaptchaEnterpriseSiteKey.length >= 20)
                },
                firebaseResources: resources.filter(entry => /firebase(?:js)?\//i.test(entry.name) || /firebase-(?:app|app-check|auth|firestore|storage|functions)\.js/i.test(entry.name))
            };
        });

        assert.equal(proof.configShape.responseOk, true, "Production runtime config must be readable from deployed Pages.");
        assert.equal(proof.configShape.schemaVersion, 1, "Production runtime config schema must remain version 1.");
        assert.equal(proof.configShape.configured, true, "Production runtime config must be deployment-rendered as configured.");
        assert.equal(proof.configShape.projectId, "fifa17-career-showdown-prod", "Production runtime config must target the production Firebase project.");
        assert.equal(proof.configShape.apiKeyPresent, true, "Production runtime config must contain the browser-public Firebase API key.");
        assert.equal(proof.configShape.siteKeyPresent, false, "Production runtime config must not contain a reCAPTCHA Enterprise site key.");

        assert.equal(proof.diagnostics.status, "ready", "Production Firebase runtime must initialize successfully without App Check.");
        assert.equal(proof.diagnostics.attempted, true, "Production Firebase runtime must attempt initialization on eligible production Pages.");
        assert.equal(proof.diagnostics.connected, true, "Production Firebase runtime must connect to the Firebase App.");
        assert.equal(proof.diagnostics.appCheckDisabled, true, "Production diagnostics must explicitly report App Check disabled.");
        assert.equal(proof.diagnostics.tokenObserved, false, "No App Check token should be requested or observed.");
        assert.equal(proof.diagnostics.enforcement, false, "App Check enforcement must remain OFF.");
        assert.equal(proof.diagnostics.provider, "firebase-auth-firestore", "Production provider must be plain Firebase Auth + Firestore.");
        assert.equal(proof.diagnostics.sdkVersion, "12.17.0", "Production Firebase SDK version changed unexpectedly.");
        assert.equal(
            proof.diagnostics.browserFirestoreWrites,
            expectedBrowserFirestoreWriteScope,
            "Production runtime diagnostics must expose only the reviewed Spark account/device/pairing/Connected Rivalry write scope."
        );

        const firebaseResourceNames = proof.firebaseResources.map(entry => entry.name);
        assert.ok(firebaseResourceNames.some(url => /firebase-app\.js/i.test(url)), "Production runtime must load Firebase App.");
        assert.equal(
            firebaseResourceNames.some(url => /firebase-app-check\.js/i.test(url)),
            false,
            "Production runtime must not load the Firebase App Check SDK."
        );
        assert.equal(
            firebaseResourceNames.some(url => /recaptcha/i.test(url)),
            false,
            "Production runtime must not load reCAPTCHA resources."
        );

        const authObserved = firebaseResourceNames.some(url => /firebase-auth\.js/i.test(url));
        const firestoreObserved = firebaseResourceNames.some(url => /firebase-firestore\.js/i.test(url));
        assert.equal(authObserved, true, "Online-only production startup must load Firebase Auth for the player bootstrap.");
        assert.equal(firestoreObserved, true, "Online-only production startup must load Firestore for the player bootstrap.");
        assert.equal(Boolean(proof.diagnostics.authInitialized), true, "Production diagnostics must confirm initialized Auth account services.");
        assert.equal(Boolean(proof.diagnostics.firestoreInitialized), true, "Production diagnostics must confirm initialized Firestore account services.");
        assert.equal(
            firebaseResourceNames.some(url => /firebase-(?:storage|functions)\.js/i.test(url)),
            false,
            "Production client must never load Storage or Functions SDKs."
        );

        assert.deepEqual(appCheckDependencyFailures, [], "Production must not issue failing App Check/reCAPTCHA dependency requests because it must not request them at all.");
        assert.deepEqual(appCheckRuntimeMessages, [], "Production must not emit App Check/reCAPTCHA runtime errors.");
        assert.deepEqual(firstPartyFailures, [], "Production Firebase runtime proof detected failed first-party requests.");
        process.stdout.write(
            "Production Firebase runtime proof passed: deployed game initialized Firebase App + Auth + Firestore with App Check/reCAPTCHA disabled, preserved the reviewed Spark write scope, and loaded no Storage/Functions SDKs.\n"
        );
        await context.close();
    }finally{
        await browser.close();
    }
})().catch(error => {
    console.error("PRODUCTION APP CHECK RUNTIME AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
