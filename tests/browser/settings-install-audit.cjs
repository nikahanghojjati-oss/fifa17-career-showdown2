const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const productionOrigin = "https://nikahanghojjati-oss.github.io";
const productionAuthHelperOrigin = "https://fifa17-career-showdown-prod.firebaseapp.com";

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

function isExpectedExternalFirebaseAuthHelperPageError(error){
    const message = String(error && error.message || "").trim();
    const stack = String(error && error.stack || "");
    if(!/^fireauth is not defined$/i.test(message)) return false;
    return stack.includes(`${productionAuthHelperOrigin}/__/auth/`);
}

function sanitizedPageErrorEvidence(error){
    return {
        message: sanitizeDiagnosticText(error && error.message),
        stack: sanitizeDiagnosticText(error && error.stack)
    };
}

assert.equal(
    isExpectedExternalFirebaseAuthHelperPageError({
        message: "fireauth is not defined",
        stack: `ReferenceError: fireauth is not defined\n    at ${productionAuthHelperOrigin}/__/auth/iframe:8:1`
    }),
    true,
    "The exact Firebase-hosted Auth helper error must be classifiable as external provider noise."
);
assert.equal(
    isExpectedExternalFirebaseAuthHelperPageError({
        message: "fireauth is not defined",
        stack: `ReferenceError: fireauth is not defined\n    at ${baseUrl.origin}/fifa17-career-showdown2/js/app.js:8:1`
    }),
    false,
    "A same-origin fireauth error must never be suppressed as provider noise."
);

async function run(){
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch(runtime);
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1"
    });
    const page = await context.newPage();
    const pageErrors = [];
    const ignoredExternalAuthHelperErrors = [];

    page.on("pageerror", error => {
        if(isExpectedExternalFirebaseAuthHelperPageError(error)){
            ignoredExternalAuthHelperErrors.push(sanitizedPageErrorEvidence(error));
            return;
        }
        pageErrors.push(sanitizedPageErrorEvidence(error));
    });

    try{
        await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 15000 });
        const opener = page.locator("#settingsButton");
        await opener.waitFor({ state: "visible" });
        await page.waitForFunction(() => typeof window.getOfflineAppSettingsState === "function", { timeout: 15000 });

        assert.equal(
            await page.locator("#offlineAppRail,#offlineAppPanel,#offlineInstallAction").count(),
            0,
            "Global install rail/panel/action must not exist."
        );

        await opener.click();
        const overlay = page.locator("#settingsOverlay");
        await overlay.waitFor({ state: "visible", timeout: 15000 });
        const panel = overlay.locator(".settingsOfflinePanel");
        await panel.waitFor({ state: "visible" });
        const install = panel.locator(".settingsOfflineInstallButton");

        assert.equal(await install.count(), 1, "Settings must expose one install action.");
        assert.equal(await page.locator(".settingsOfflineInstallButton").count(), 1, "Install action must not be duplicated globally.");
        assert.equal(await install.evaluate(el => Boolean(el.closest("#settingsOverlay"))), true, "Install action must be owned by Settings overlay.");

        const state = await page.evaluate(() => window.getOfflineAppSettingsState());
        assert.ok(state.installationLabel && state.shellLabel && state.connectivityLabel, "Settings state must expose installation, shell and connectivity labels.");
        assert.match(await panel.innerText(), /OFFLINE APP/i);
        assert.match(await panel.innerText(), /INSTALLATION/i);
        assert.match(await panel.innerText(), /OFFLINE SHELL/i);
        assert.match(await panel.innerText(), /CONNECTIVITY/i);

        if(baseUrl.origin === productionOrigin){
            await page.waitForFunction(() => {
                const runtimeApi = window.CareerModeProductionFirebaseRuntime;
                const accountApi = window.CareerModeSparkConnectedAccount;
                if(!runtimeApi || typeof runtimeApi.diagnostics !== "function" || !accountApi || typeof accountApi.getState !== "function") return false;
                const accountState = accountApi.getState();
                const diagnostics = runtimeApi.diagnostics();
                return Boolean(accountState && accountState.initialized && !accountState.busy && diagnostics && diagnostics.authInitialized && diagnostics.firestoreInitialized);
            }, null, { timeout: 20000 });

            const connectedProof = await page.evaluate(() => ({
                runtime: window.CareerModeProductionFirebaseRuntime.diagnostics(),
                account: window.CareerModeSparkConnectedAccount.getState()
            }));
            assert.equal(connectedProof.runtime.authInitialized, true, "Opening production Settings must initialize optional Firebase Auth successfully.");
            assert.equal(connectedProof.runtime.firestoreInitialized, true, "Opening production Settings must initialize memory-only Firestore successfully.");
            assert.equal(connectedProof.runtime.persistentFirestoreCache, false, "Connected Account must keep persistent Firestore cache disabled.");
            assert.equal(connectedProof.runtime.authPersistence, "browserSessionPersistence", "Connected Account must preserve session-only Auth persistence.");
            assert.equal(connectedProof.account.initialized, true, "Connected Account state must finish initialization in production Settings.");
            assert.equal(connectedProof.account.status, "signed-out", "A fresh production audit context must settle to signed-out rather than runtime-unavailable.");
            assert.equal(connectedProof.account.signedIn, false, "The headless production audit must not fabricate a signed-in Google user.");
            assert.equal(connectedProof.account.connected, false, "Private account readiness still requires genuine Google sign-in and bootstrap proof.");
            assert.equal(
                await overlay.locator("#sparkConnectedAccountPanel .settingsConnectedAccountButton").innerText(),
                "SIGN IN WITH GOOGLE",
                "Production Settings must expose the real Google sign-in action after account services initialize."
            );
        }

        if(!(await install.isDisabled())){
            await install.click();
            await page.waitForTimeout(100);
            assert.ok(
                (await panel.locator(".settingsOfflineNote").innerText()).trim().length > 20,
                "Install action must surface device/browser guidance or native-prompt outcome inside Settings."
            );
        }

        const data = overlay.locator(".settingsDataButton");
        await data.focus();
        assert.equal(await data.evaluate(el => el === document.activeElement), true, "Data Management control must accept focus before connectivity rerender.");
        await context.setOffline(true);
        await page.waitForTimeout(150);
        assert.equal(await data.evaluate(el => el === document.activeElement), true, "Offline-state rerender must restore focus to the equivalent Settings control.");
        assert.equal(await data.evaluate(el => Boolean(el.closest("#settingsDialog"))), true, "Focus must remain inside the Settings dialog after connectivity rerender.");
        await context.setOffline(false);
        await page.waitForTimeout(150);
        assert.equal(await data.evaluate(el => el === document.activeElement), true, "Online-state rerender must preserve Settings focus a second time.");

        const done = overlay.locator(".settingsFooter button");
        await done.focus();
        await page.keyboard.press("Tab");
        assert.equal(await page.locator("#settingsClose").evaluate(el => el === document.activeElement), true, "Tab from the last control must wrap to Settings Close.");
        await page.keyboard.press("Escape");
        await overlay.waitFor({ state: "hidden" });
        assert.equal(await opener.evaluate(el => el === document.activeElement), true, "Escape must restore focus to the Settings tile.");
        assert.equal(await page.locator("#app").evaluate(el => el.hasAttribute("inert")), false, "Closing Settings must release background inert state.");
        assert.equal(await page.locator("#offlineAppRail,#offlineAppPanel,#offlineInstallAction").count(), 0, "Closing Settings must not leave persistent install UI behind.");

        assert.equal(
            pageErrors.length,
            0,
            `Settings install audit emitted non-provider page errors: ${JSON.stringify(pageErrors)}`
        );
        if(ignoredExternalAuthHelperErrors.length){
            console.log(
                `INFO Settings install audit ignored ${ignoredExternalAuthHelperErrors.length} exact Firebase-hosted Auth helper page error(s) after proving Auth + memory-only Firestore initialization remained healthy. Sanitized provider provenance: ${JSON.stringify(ignoredExternalAuthHelperErrors)}`
            );
        }
        console.log("Settings-owned install UI and focus lifecycle passed: connectivity rerenders preserve focus, Tab stays trapped, Escape restores opener.");
    }finally{
        await context.close();
        await browser.close();
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
