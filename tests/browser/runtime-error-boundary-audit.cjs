const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
    await page.waitForFunction(() => {
        return typeof window.isFirstPartyRuntimeError === "function"
            && typeof window.getRuntimeErrorBoundaryDiagnostics === "function";
    }, null, { timeout: 5000 });
}

async function dispatchExternalRuntimeError(page){
    return page.evaluate(() => {
        const before = window.getRuntimeErrorBoundaryDiagnostics();
        const externalError = new Error("undefined is not an object (evaluating 'contentScriptData.init_ts')");
        Object.defineProperty(externalError, "stack", {
            configurable: true,
            value: "Error: undefined is not an object (evaluating 'contentScriptData.init_ts')\n    at safari-web-extension://example/content.js:10:4"
        });
        const event = new ErrorEvent("error", {
            message: externalError.message,
            filename: "safari-web-extension://example/content.js",
            lineno: 10,
            colno: 4,
            error: externalError
        });
        window.dispatchEvent(event);
        const after = window.getRuntimeErrorBoundaryDiagnostics();
        return {
            before,
            after,
            classifier: window.isFirstPartyRuntimeError(externalError.message, event.filename, externalError.stack),
            notice: document.getElementById("appRuntimeNotice")?.textContent || ""
        };
    });
}

async function dispatchExternalUnhandledRejection(page){
    return page.evaluate(() => {
        const before = window.getRuntimeErrorBoundaryDiagnostics();
        const externalReason = new Error("undefined is not an object (evaluating 'contentScriptData.init_ts')");
        Object.defineProperty(externalReason, "stack", {
            configurable: true,
            value: "Error: undefined is not an object (evaluating 'contentScriptData.init_ts')\n    at safari-web-extension://example/content.js:14:7"
        });
        const event = new Event("unhandledrejection");
        Object.defineProperty(event, "reason", { value: externalReason });
        window.dispatchEvent(event);
        const after = window.getRuntimeErrorBoundaryDiagnostics();
        return {
            before,
            after,
            classifier: window.isFirstPartyRuntimeError(externalReason.message, "", externalReason.stack),
            notice: document.getElementById("appRuntimeNotice")?.textContent || ""
        };
    });
}

async function dispatchFirstPartyUnhandledRejection(page){
    return page.evaluate(() => {
        const reason = new Error("First-party provenance audit failure");
        Object.defineProperty(reason, "stack", {
            configurable: true,
            value: `Error: First-party provenance audit failure\n    at ${window.location.origin}${window.location.pathname}js/app.js:42:7`
        });
        const classifier = window.isFirstPartyRuntimeError(reason.message, "", reason.stack);
        const event = new Event("unhandledrejection");
        Object.defineProperty(event, "reason", { value: reason });
        window.dispatchEvent(event);
        return classifier;
    });
}

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
            hasTouch: true
        });
        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        await waitForApp(page);
        assert.equal(await page.locator("#appRuntimeNotice").count(), 0, "Runtime notice must start absent.");

        const externalError = await dispatchExternalRuntimeError(page);
        assert.equal(externalError.classifier, false, "contentScriptData extension error must be classified as non-app.");
        assert.equal(externalError.notice, "", "Injected runtime error must not create a user-facing app notice.");
        assert.equal(
            externalError.after.suppressedExternalRuntimeErrors,
            externalError.before.suppressedExternalRuntimeErrors + 1,
            "Injected runtime error must be counted as suppressed external noise."
        );

        const externalRejection = await dispatchExternalUnhandledRejection(page);
        assert.equal(externalRejection.classifier, false, "contentScriptData rejection must be classified as non-app.");
        assert.equal(externalRejection.notice, "", "Injected promise rejection must not create a user-facing app notice.");
        assert.equal(
            externalRejection.after.suppressedExternalRuntimeErrors,
            externalRejection.before.suppressedExternalRuntimeErrors + 1,
            "Injected promise rejection must be counted as suppressed external noise."
        );

        const firstPartyClassifier = await dispatchFirstPartyUnhandledRejection(page);
        assert.equal(firstPartyClassifier, true, "Same-origin app rejection must remain first-party.");
        await page.locator("#appRuntimeNotice").waitFor({ state: "visible", timeout: 3000 });
        const firstPartyNotice = await page.locator("#appRuntimeNotice").innerText();
        assert.match(firstPartyNotice, /unexpected application error/i, "First-party rejection must surface through the app error notice.");
        assert.match(firstPartyNotice, /First-party provenance audit failure/i, "Visible notice must preserve first-party error detail.");

        await page.locator('#appRuntimeNotice button[aria-label="Dismiss message"]').click();
        await page.locator("#appRuntimeNotice").waitFor({ state: "detached", timeout: 3000 });

        assert.deepEqual(pageErrors, [], `Boundary audit caused page errors: ${pageErrors.join(" | ")}`);
        await context.close();
        process.stdout.write("Runtime error provenance audit passed: injected contentScriptData noise suppressed, same-origin failures remain visible.\n");
    }finally{
        await browser.close();
    }
})().catch(error => {
    console.error("RUNTIME ERROR BOUNDARY AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
