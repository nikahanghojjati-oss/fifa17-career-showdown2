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

        const proof = await page.evaluate(async () => {
            const api = window.CareerModeProductionFirebaseRuntime;
            const diagnostics = api.diagnostics();
            const response = await fetch(new URL("firebase.runtime-config.json", location.href), {
                cache: "no-store",
                credentials: "same-origin"
            });
            const config = await response.json();
            const resources = performance.getEntriesByType("resource").map(entry => entry.name);
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
                firebaseResources: resources.filter(url => /firebase(?:js)?\//i.test(url) || /firebase-(?:app|app-check|auth|firestore|storage|functions)\.js/i.test(url))
            };
        });

        assert.equal(proof.configShape.responseOk, true, "Production runtime config must be readable from deployed Pages.");
        assert.equal(proof.configShape.schemaVersion, 1, "Production runtime config schema must remain version 1.");
        assert.equal(proof.configShape.configured, true, "Production runtime config must be deployment-rendered as configured.");
        assert.equal(proof.configShape.projectId, "fifa17-career-showdown-prod", "Production runtime config must target the production Firebase project.");
        assert.equal(proof.configShape.apiKeyPresent, true, "Production runtime config must contain the browser-public Firebase API key.");
        assert.equal(proof.configShape.siteKeyPresent, true, "Production runtime config must contain the reCAPTCHA Enterprise site key.");

        const diagnosticEvidence = JSON.stringify({appCheckDependencyFailures, appCheckRuntimeMessages});
        const acceptedStatuses = new Set(["ready", "ready-app-check-degraded"]);
        assert.ok(
            acceptedStatuses.has(proof.diagnostics.status),
            `Production App Check runtime reached an invalid state: ${proof.diagnostics.status}. Redacted evidence: ${diagnosticEvidence}`
        );
        assert.equal(proof.diagnostics.attempted, true, "Production App Check runtime must attempt initialization on eligible production Pages.");
        assert.equal(proof.diagnostics.connected, true, "Production App Check runtime must connect to the Firebase App Check SDK.");
        assert.equal(proof.diagnostics.provider, "recaptcha-enterprise", "Production App Check must use reCAPTCHA Enterprise.");
        assert.equal(proof.diagnostics.sdkVersion, "12.17.0", "Production Firebase SDK version changed unexpectedly.");
        assert.equal(proof.diagnostics.enforcement, false, "App Check enforcement must remain OFF during production proof.");
        assert.equal(
            proof.diagnostics.browserFirestoreWrites,
            expectedBrowserFirestoreWriteScope,
            "Production runtime diagnostics must expose only the reviewed Spark account/device/pairing/Connected Rivalry write scope."
        );

        const degraded = proof.diagnostics.status === "ready-app-check-degraded";
        if(degraded){
            assert.equal(proof.diagnostics.tokenObserved, false, "Degraded App Check proof must not claim that a legitimate token was observed.");
            assert.equal(proof.diagnostics.appCheckDegraded, true, "Degraded App Check proof must explicitly identify the attestation-observation degradation.");
            assert.ok(
                appCheckDependencyFailures.length > 0 || appCheckRuntimeMessages.length > 0,
                "A degraded production App Check proof must preserve redacted provider/runtime evidence rather than silently treating token absence as success."
            );
        }else{
            assert.equal(proof.diagnostics.tokenObserved, true, "Ready App Check runtime must obtain a legitimate App Check token.");
            assert.equal(proof.diagnostics.appCheckDegraded, false, "Ready App Check runtime must not be marked degraded.");
            if(proof.diagnostics.tokenExpireTimeMillis !== null && proof.diagnostics.tokenExpireTimeMillis !== undefined){
                assert.ok(
                    Number.isFinite(proof.diagnostics.tokenExpireTimeMillis) && proof.diagnostics.tokenExpireTimeMillis > Date.now(),
                    "Observed App Check token expiry, when exposed by the SDK, must be in the future."
                );
            }
        }

        assert.ok(
            proof.firebaseResources.some(url => /firebase-app\.js/i.test(url)),
            "Production runtime must load only the Firebase App foundation SDK before App Check."
        );
        assert.ok(
            proof.firebaseResources.some(url => /firebase-app-check\.js/i.test(url)),
            "Production runtime must load the Firebase App Check SDK."
        );
        assert.equal(
            proof.firebaseResources.some(url => /firebase-(?:auth|firestore|storage|functions)\.js/i.test(url)),
            false,
            "Production client must not initialize Auth, Firestore, Storage, or Functions SDKs in this proof lane."
        );
        assert.deepEqual(firstPartyFailures, [], "Production App Check proof detected failed first-party requests.");

        if(degraded){
            process.stdout.write(
                "Production App Check boundary passed in enforcement-OFF degraded state: deployed r3 initialized Firebase App + App Check, preserved the connected runtime after token-observation failure, retained redacted provider evidence, and loaded no client Auth/Firestore/Storage/Functions SDKs in this proof lane.\n"
            );
        }else{
            process.stdout.write(
                "Production App Check proof passed: deployed r3 obtained a reCAPTCHA Enterprise token with enforcement OFF, the reviewed Spark Connected Rivalry write scope, and no client Auth/Firestore/Storage/Functions SDKs.\n"
            );
        }
        await context.close();
    }finally{
        await browser.close();
    }
})().catch(error => {
    console.error("PRODUCTION APP CHECK RUNTIME AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
