const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const axePath = require.resolve("axe-core/axe.min.js");
const runLabel = process.env.CMS_AUDIT_RUN || "run-1";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const activeStorageKey = "careerModeShowdown.activeShowdown";
const saveLibraryStorageKey = "careerModeShowdown.saveLibrary";
const legacyStorageKey = "careerModeShowdown.legacyShowdowns";
const preferencesStorageKey = "careerModeShowdown.preferences";

const report = {
    run: runLabel,
    baseUrl: baseUrl.href,
    browserVersion: "",
    checkpoints: [],
    axeScans: [],
    layouts: [],
    requestFailures: []
};

fs.mkdirSync(resultsDirectory, { recursive: true });

function checkpoint(name, detail = ""){
    report.checkpoints.push({ name, detail });
    process.stdout.write(`PASS  ${name}${detail ? ` :: ${detail}` : ""}\n`);
}

function normalizeText(value){
    return String(value || "").replace(/\s+/g, " ").trim();
}

function isFirstParty(url){
    return String(url || "").startsWith(baseUrl.href);
}
const productionOrigin = "https://nikahanghojjati-oss.github.io";
const productionPathPrefix = "/fifa17-career-showdown2/";

function isExpectedProductionAppCheckConsoleNoise(message){
    if(baseUrl.origin !== productionOrigin || !baseUrl.pathname.startsWith(productionPathPrefix)){
        return false;
    }
    const text = message.text();
    if(text.startsWith("Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive: \"frame-ancestors 'self'\".")){
        return true;
    }
    if(text === "requestStorageAccess: Permission denied."){
        const sourceUrl = message.location()?.url || "";
        return !sourceUrl || !sourceUrl.startsWith(baseUrl.origin);
    }
    return false;
}

function createPageMonitors(page, expectedConsoleErrors = []){
    const pageErrors = [];
    const severeConsole = [];
    const localFailures = [];

    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() !== "error" || /^Failed to load resource/.test(message.text())){
            return;
        }
        if(expectedConsoleErrors.some(pattern => pattern.test(message.text()))
            || isExpectedProductionAppCheckConsoleNoise(message)){
            return;
        }
        severeConsole.push(message.text());
    });
    page.on("requestfailed", request => {
        const entry = `${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`;
        report.requestFailures.push(entry);
        if(isFirstParty(request.url())){
            localFailures.push(entry);
        }
    });
    page.on("response", response => {
        if(isFirstParty(response.url()) && response.status() >= 400){
            localFailures.push(`${response.status()} ${response.url()}`);
        }
    });

    return {
        assertClean(label){
            assert.deepEqual(pageErrors, [], `${label} emitted page errors.`);
            assert.deepEqual(severeConsole, [], `${label} emitted unexpected console errors.`);
            assert.deepEqual(localFailures, [], `${label} had failed local assets or requests.`);
        }
    };
}

async function installAuditRuntime(page){
    await page.addInitScript(() => {
        window.__cmsRouteEvents = [];
        document.addEventListener("DOMContentLoaded", () => {
            const observer = new MutationObserver(records => {
                records.forEach(record => {
                    if(
                        record.type === "attributes"
                        && record.attributeName === "data-route-state"
                        && record.target instanceof Element
                        && record.target.getAttribute("data-route-state") === "entering"
                    ){
                        window.__cmsRouteEvents.push({
                            id: record.target.id,
                            direction: record.target.getAttribute("data-route-direction")
                        });
                    }
                });
            });
            observer.observe(document.body, { subtree: true, attributes: true });
        }, { once: true });
    });
    await page.addInitScript({ path: axePath });
}

async function waitForApplication(page){
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#newShowdown").waitFor({ state: "visible", timeout: 12000 });
    assert.equal(await page.locator("#app").getAttribute("aria-hidden"), null, "The app must re-enter the accessibility tree after startup.");
    assert.equal(await page.locator("#app").evaluate(element => element.inert), false, "The app must become interactive after startup.");
}

async function openApplication(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await waitForApplication(page);
}

async function assertStableReleaseIdentity(page, label){
    await page.waitForTimeout(5000);
    const footer = normalizeText(await page.locator("#app > footer").innerText());
    assert.equal(footer, "Career Mode Showdown v1.9.0 · Private Remote Joining", `${label} release footer changed after startup settled.`);
    const tile = await page.locator("#settingsButton").evaluate(button => ({
        code: button.querySelector(".menuTileCode")?.textContent?.trim() || "",
        label: button.querySelector(".menuTileLabel")?.textContent?.trim() || "",
        meta: button.querySelector(".menuTileMeta")?.textContent?.trim() || ""
    }));
    assert.deepEqual(tile,{code:"LOCAL",label:"SAVE LIBRARY",meta:"Local Showdowns, manager profiles and settings"},`${label} Home local-data identity changed after startup settled.`);
    checkpoint(`${label} stable release identity`, "v1.9.0 · Private Remote Joining · Save Library");
}

async function activeScreens(page){
    return page.locator(".screen:not(.hidden)").evaluateAll(elements => elements.map(element => element.id));
}

async function waitForScreen(page, screenId, options = {}){
    await page.locator(`#${screenId}`).waitFor({ state: "visible", timeout: options.timeout || 12000 });
    await page.waitForTimeout(options.settle === false ? 20 : 290);
    assert.deepEqual(await activeScreens(page), [screenId], `Expected only ${screenId} to be active.`);
    const accessibility = await page.locator(`#${screenId}`).evaluate(element => ({
        ariaHidden: element.getAttribute("aria-hidden"),
        labelledBy: element.getAttribute("aria-labelledby"),
        headingId: element.querySelector("h2")?.id || ""
    }));
    assert.equal(accessibility.ariaHidden, "false", `${screenId} must be exposed to assistive technology.`);
    assert.ok(accessibility.labelledBy, `${screenId} must have an accessible heading reference.`);
    assert.equal(accessibility.labelledBy, accessibility.headingId, `${screenId} must reference its exact heading.`);
}

async function assertRouteFocus(page, screenId){
    await page.waitForTimeout(60);
    const focused = await page.evaluate(() => ({
        tag: document.activeElement?.tagName || "",
        parent: document.activeElement?.closest(".screen")?.id || ""
    }));
    assert.equal(focused.tag, "H2", `${screenId} should focus its heading after route entry.`);
    assert.equal(focused.parent, screenId, `${screenId} should own the focused route heading.`);
}

async function assertLayout(page, label){
    await page.waitForTimeout(40);
    const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const visibleRoot = document.querySelector(".screen:not(.hidden)");
        const viewportWidth = window.innerWidth;
        const offenders = visibleRoot
            ? Array.from(visibleRoot.querySelectorAll("*")).filter(element => {
                const style = getComputedStyle(element);
                if(style.display === "none" || style.visibility === "hidden"){ return false; }
                const rect = element.getBoundingClientRect();
                if(!rect.width || !rect.height){ return false; }
                if(rect.left >= -1 && rect.right <= viewportWidth + 1){ return false; }

                let ancestor = element.parentElement;
                while(ancestor){
                    const ancestorStyle = getComputedStyle(ancestor);
                    const clipsHorizontally = [ancestorStyle.overflowX, ancestorStyle.overflow]
                        .some(value => value === "hidden" || value === "clip");
                    if(clipsHorizontally){
                        const ancestorRect = ancestor.getBoundingClientRect();
                        if(ancestorRect.left >= -1 && ancestorRect.right <= viewportWidth + 1){
                            return false;
                        }
                    }
                    if(ancestor === visibleRoot){ break; }
                    ancestor = ancestor.parentElement;
                }
                return true;
            }).slice(0, 12).map(element => {
                const rect = element.getBoundingClientRect();
                return {
                    tag: element.tagName,
                    id: element.id,
                    className: String(element.className || "").slice(0, 90),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right)
                };
            })
            : [];
        return {
            viewportWidth,
            viewportHeight: window.innerHeight,
            documentWidth: root.scrollWidth,
            clientWidth: root.clientWidth,
            offenders
        };
    });
    report.layouts.push({ label, ...layout });
    assert.ok(layout.documentWidth <= layout.clientWidth + 1, `${label} has horizontal document overflow.`);
    assert.deepEqual(layout.offenders, [], `${label} has elements outside the viewport.`);
    checkpoint(`${label} responsive containment`, `${layout.viewportWidth} × ${layout.viewportHeight}`);
}

async function runAxe(page, label){
    const violations = await page.evaluate(async () => {
        if(!window.axe){ throw new Error("axe-core was not injected into the document."); }
        const result = await window.axe.run(document, {
            resultTypes: ["violations"],
            rules: { region: { enabled: false } }
        });
        return result.violations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
        }));
    });
    report.axeScans.push({ label, violations });
    assert.deepEqual(violations, [], `${label} has automated accessibility violations.`);
    checkpoint(`${label} accessibility scan`);
}

async function assertNoDuplicateIds(page, label){
    const duplicates = await page.evaluate(() => {
        const counts = new Map();
        document.querySelectorAll("[id]").forEach(element => {
            counts.set(element.id, (counts.get(element.id) || 0) + 1);
        });
        return Array.from(counts.entries()).filter(([, count]) => count > 1);
    });
    assert.deepEqual(duplicates, [], `${label} has duplicate IDs.`);
}

async function readActiveSave(page){
    const state = await page.evaluate(({ singletonKey, libraryKey }) => {
        const singletonRaw = localStorage.getItem(singletonKey);
        const libraryRaw = localStorage.getItem(libraryKey);
        let active = null;
        let saveCount = 0;
        let activeSaveId = null;
        if(libraryRaw){
            const library = JSON.parse(libraryRaw);
            saveCount = Array.isArray(library.saves) ? library.saves.length : 0;
            activeSaveId = library.activeSaveId || null;
            if(activeSaveId){
                const matches = library.saves.filter(entry => entry && entry.saveId === activeSaveId);
                if(matches.length === 1) active = matches[0].showdown || null;
            }
        }
        return { singletonRaw, libraryRaw, active, saveCount, activeSaveId };
    }, { singletonKey: activeStorageKey, libraryKey: saveLibraryStorageKey });
    assert.equal(state.singletonRaw, null, "The retired singleton key must remain absent after Save Library cutover.");
    assert.ok(state.libraryRaw, "Save Library bytes must exist after runtime cutover.");
    assert.ok(state.activeSaveId, "Save Library must expose one authoritative active save identity.");
    assert.ok(state.active, "Save Library active identity must resolve to one Showdown.");
    return state.active;
}

async function fillCanonical(page, selector, value){
    const input = page.locator(selector);
    await input.fill(value);
    await input.press("Enter");
    assert.ok(await input.getAttribute("data-canonical-id"), `${selector} must resolve ${value} canonically.`);
    assert.equal(await input.inputValue(), value, `${selector} should retain the canonical display value.`);
}

async function createShowdownWithRapidActivation(page, prefix){
    await page.locator("#newShowdown").click();
    await waitForScreen(page, "createShowdown");
    await assertRouteFocus(page, "createShowdown");
    await runAxe(page, `${prefix} Create Showdown`);

    await page.locator("#showdownName").fill(`${prefix} Stability Audit`);
    await page.locator("#managerOne").fill(`${prefix} One`);
    await page.locator("#managerTwo").fill(`${prefix} Two`);
    await page.locator("#roundAmount").selectOption("1");

    await page.evaluate(({ singletonKey, libraryKey }) => {
        window.__cmsOriginalSetItem = Storage.prototype.setItem;
        window.__cmsSingletonWrites = 0;
        window.__cmsLibraryWrites = 0;
        Storage.prototype.setItem = function auditedSetItem(storageKey, value){
            if(storageKey === singletonKey){ window.__cmsSingletonWrites += 1; }
            if(storageKey === libraryKey){ window.__cmsLibraryWrites += 1; }
            return window.__cmsOriginalSetItem.call(this, storageKey, value);
        };
        const button = document.getElementById("startShowdown");
        button.click();
        button.click();
    }, { singletonKey: activeStorageKey, libraryKey: saveLibraryStorageKey });

    await waitForScreen(page, "leagueWheelScreen");
    const writes = await page.evaluate(({ singletonKey, libraryKey }) => {
        const result = {
            singletonWrites: window.__cmsSingletonWrites,
            libraryWrites: window.__cmsLibraryWrites,
            singletonRaw: localStorage.getItem(singletonKey),
            library: JSON.parse(localStorage.getItem(libraryKey) || "null")
        };
        Storage.prototype.setItem = window.__cmsOriginalSetItem;
        delete window.__cmsOriginalSetItem;
        delete window.__cmsSingletonWrites;
        delete window.__cmsLibraryWrites;
        return result;
    }, { singletonKey: activeStorageKey, libraryKey: saveLibraryStorageKey });
    assert.equal(writes.singletonWrites, 0, "Rapid Start activation must never recreate the retired singleton writer.");
    assert.equal(writes.singletonRaw, null, "The singleton key must be retired before the first runtime save is accepted.");
    assert.ok(writes.libraryWrites >= 1, "Rapid Start activation must persist through Save Library authority.");
    assert.equal(writes.library.saves.length, 1, "Rapid Start activation must create exactly one logical Save Library entry.");
    assert.ok(writes.library.activeSaveId, "The created Showdown must own one stable active Save Library identity.");
    assert.match(await page.locator("#seasonIndicator").innerText(), /Season 1 \/ 1/i);
    checkpoint(`${prefix} rapid Start activation deduplicated`, `${writes.library.saves.length} Save Library entry · 0 singleton writes`);
}

async function selectAndConfirmLeague(page, prefix){
    await page.locator("#spinLeague").click();
    await page.locator("#spinLeague").filter({ hasText: /CONTINUE TO CLUB ASSIGNMENT/i }).waitFor({ state: "visible", timeout: 8000 });
    const selectedLeague = normalizeText(await page.locator("#selectedLeague").textContent());
    assert.ok(selectedLeague && !/spin/i.test(selectedLeague), "League Wheel must expose the permanent selected league.");

    await page.waitForTimeout(2200);
    assert.deepEqual(await activeScreens(page), ["leagueWheelScreen"], "League selection must wait indefinitely for explicit Continue.");
    await page.locator("#spinLeague").click();
    await waitForScreen(page, "clubWheelScreen");
    checkpoint(`${prefix} league Continue routed`, selectedLeague);
}

async function assignClubs(page, prefix){
    await page.locator("#spinClub1").click();
    await page.locator("#spinClub1").filter({ hasText: /CONTINUE/i }).waitFor({ state: "visible", timeout: 8000 });
    await page.locator("#spinClub1").click();
    await page.locator("#spinClub2").click();
    await page.locator("#spinClub2").filter({ hasText: /CONTINUE/i }).waitFor({ state: "visible", timeout: 8000 });
    await page.locator("#spinClub2").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} club assignment completed`);
}

async function assertHomeRoute(page, prefix, options = {}){
    assert.equal(normalizeText(await page.locator("#showdownHomeTitle").innerText()), "SHOWDOWN HOME");
    assert.ok(normalizeText(await page.locator("#showdownHomeName").innerText()).includes("Stability Audit"));
    assert.equal(await page.locator("#continueShowdown").count(), 1, "Showdown Home must expose exactly one continue control.");
    assert.equal(await page.locator("#connectedRivalry").count(), 1, "Showdown Home must expose exactly one Connected Rivalry control.");
    assert.equal(await page.locator("#remoteJoining").count(), 1, "Showdown Home must expose exactly one Remote Joining control.");
    if(options.expectTransition !== false){
        assert.ok((await page.evaluate(() => window.__cmsRouteEvents.filter(event => event.id === "showdownHome").length)) >= 1, "Showdown Home route transition must be recorded.");
    }
    await runAxe(page, `${prefix} Showdown Home`);
    await assertLayout(page, `${prefix} Showdown Home`);
    checkpoint(`${prefix} Showdown Home available`);
}

async function createFullShowdown(page, prefix){
    await createShowdownWithRapidActivation(page, prefix);
    await selectAndConfirmLeague(page, prefix);
    await assignClubs(page, prefix);
    await assertHomeRoute(page, prefix);
}

async function openContinueShowdown(page){
    await page.locator("#continueShowdown").click();
    await waitForScreen(page, "season1");
}

async function assertSeasonOne(page, prefix){
    assert.equal(normalizeText(await page.locator("#seasonTitle").innerText()), "SEASON 1");
    await runAxe(page, `${prefix} Season 1`);
    await assertLayout(page, `${prefix} Season 1`);
    checkpoint(`${prefix} Season 1 rendered`);
}

async function enterSeasonData(page){
    await fillCanonical(page, "#clWinner", "Arsenal");
    await fillCanonical(page, "#leagueWinner", "Chelsea");
    await fillCanonical(page, "#cupWinner", "Liverpool");
    await page.locator("#leaguePosition1").fill("2");
    await page.locator("#leaguePosition2").fill("1");
    await page.locator("#leaguePoints1").fill("88");
    await page.locator("#leaguePoints2").fill("92");
    await page.locator("#leagueGoals1").fill("81");
    await page.locator("#leagueGoals2").fill("84");
    await page.locator("#topScorer").fill("Audit Scorer");
    await page.locator("#topScorerClub").fill("Chelsea");
    await page.locator("#topAssists").fill("Audit Creator");
    await page.locator("#topAssistsClub").fill("Arsenal");
    await page.locator("#transferPlayer").fill("Audit Transfer");
    await fillCanonical(page, "#transferFrom", "Arsenal");
    await fillCanonical(page, "#transferTo", "Chelsea");
    await page.locator("#transferFee").fill("42");
    await page.locator("#addTransfer").click();
    await page.locator("#saveSeason").click();
    await waitForScreen(page, "seasonReview");
}

async function assertSeasonReview(page, prefix){
    assert.match(normalizeText(await page.locator("#reviewHeadline").innerText()), /Season 1 complete/i);
    assert.ok(normalizeText(await page.locator("#reviewScoreboard").innerText()).length > 0, "Season Review must render the score board.");
    await runAxe(page, `${prefix} Season Review`);
    await assertLayout(page, `${prefix} Season Review`);
    checkpoint(`${prefix} Season Review rendered`);
}

async function continueAfterReview(page){
    await page.locator("#reviewNext").click();
    await waitForScreen(page, "showdownComplete");
}

async function assertFinalReview(page, prefix){
    assert.match(normalizeText(await page.locator("#completeTitle").innerText()), /Showdown complete/i);
    assert.ok(normalizeText(await page.locator("#completeScoreboard").innerText()).length > 0, "Final Review must render the score board.");
    await runAxe(page, `${prefix} Final Review`);
    await assertLayout(page, `${prefix} Final Review`);
    checkpoint(`${prefix} Final Review rendered`);
}

async function returnHome(page){
    await page.locator("#completeHome").click();
    await waitForScreen(page, "showdownHome");
}

async function assertPersistenceAfterReload(page, prefix){
    const before = await readActiveSave(page);
    const beforeRaw = await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    await waitForScreen(page, "showdownHome");
    const after = await readActiveSave(page);
    const afterRaw = await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey);
    assert.deepEqual(after, before, `${prefix} active Showdown changed across reload.`);
    assert.equal(afterRaw, beforeRaw, `${prefix} Save Library bytes changed across reload.`);
    checkpoint(`${prefix} Save Library persisted across reload`);
}

async function assertSaveLibraryKeyboardMutation(page, prefix){
    await page.locator("#settingsButton").click();
    await waitForScreen(page, "settingsScreen");
    const renameInput = page.locator('.settingsSaveCard[data-active="true"] .settingsSaveNameInput');
    await renameInput.focus();
    await renameInput.fill(`${prefix} Renamed`);
    await renameInput.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("settingsSaveNameInput")), true, "Save Library rename should preserve keyboard focus after mutation rerender.");
    assert.equal(await renameInput.inputValue(), `${prefix} Renamed`);
    await page.locator("#settingsBack").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} Save Library keyboard rename preserved focus`);
}

async function assertManagerLinkage(page, prefix){
    await page.locator("#settingsButton").click();
    await waitForScreen(page, "settingsScreen");
    await page.locator("#managerProfilesOpen").click();
    await waitForScreen(page, "managerProfilesScreen");
    await assertLayout(page, `${prefix} Manager Profiles`);
    const cards = page.locator(".managerProfileCard");
    assert.equal(await cards.count(), 2, "The created Showdown must expose two manager profiles.");
    const managerOneCard = cards.filter({ hasText: `${prefix} One` });
    assert.equal(await managerOneCard.count(), 1, "Manager One profile must be distinct.");
    await managerOneCard.locator(".managerProfileNameInput").fill(`${prefix} One Profile`);
    await managerOneCard.locator(".managerProfileNameInput").press("Enter");
    assert.ok(normalizeText(await page.locator("#managerProfilesMeta").innerText()).includes("2 manager profiles"));
    await page.locator("#managerProfilesBack").click();
    await waitForScreen(page, "settingsScreen");
    await page.locator("#settingsBack").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} manager profile identity linkage persisted`);
}

async function assertCareerAnalytics(page, prefix){
    await page.locator("#careerStats").click();
    await waitForScreen(page, "careerStatsScreen");
    await assertLayout(page, `${prefix} Career Statistics`);
    assert.match(normalizeText(await page.locator("#careerStatsContent").innerText()), new RegExp(`${prefix} One Profile`));
    await page.locator("#careerStatsBack").click();
    await waitForScreen(page, "showdownHome");

    await page.locator("#trophyRoom").click();
    await waitForScreen(page, "trophyRoomScreen");
    await assertLayout(page, `${prefix} Trophy Room`);
    await page.locator("#trophyRoomBack").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} identity-safe Career Analytics refreshed`);
}

async function assertTransferWorkspace(page, prefix){
    await page.locator("#transferWorkspace").click();
    await waitForScreen(page, "transferWorkspaceScreen");
    await assertLayout(page, `${prefix} Transfer Workspace`);
    const content = normalizeText(await page.locator("#transferWorkspaceContent").innerText());
    assert.match(content, /Audit Transfer/);
    assert.match(content, /£42m/);
    await page.locator("#transferWorkspaceBack").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} Transfer Workspace retained history`);
}

async function assertBackupExport(page, prefix){
    await page.locator("#settingsButton").click();
    await waitForScreen(page, "settingsScreen");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#backupExport").click();
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    assert.match(suggestedFilename, /^career-mode-showdown-backup-\d{4}-\d{2}-\d{2}\.json$/);
    checkpoint(`${prefix} backup export available`, suggestedFilename);
    await page.locator("#settingsBack").click();
    await waitForScreen(page, "showdownHome");
}

async function assertOfflineReload(page, context, prefix){
    const beforeRaw = await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    await waitForScreen(page, "showdownHome");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey), beforeRaw, `${prefix} offline reload changed canonical Save Library bytes.`);
    await assertLayout(page, `${prefix} offline Showdown Home`);
    await context.setOffline(false);
    checkpoint(`${prefix} offline reload preserved Save Library`);
}

async function assertRemoteJoiningSurface(page, prefix){
    await page.locator("#remoteJoining").click();
    await waitForScreen(page, "remoteJoiningScreen");
    await assertLayout(page, `${prefix} Remote Joining`);
    await runAxe(page, `${prefix} Remote Joining`);
    assert.match(normalizeText(await page.locator("#remoteJoiningContent").innerText()), /Private session access|Connected Account required|Remote Joining is unavailable/i);
    await page.locator("#remoteJoiningBack").click();
    await waitForScreen(page, "showdownHome");
    checkpoint(`${prefix} Remote Joining surface remains bounded`);
}

async function runProductScenario(browser, viewport, prefix){
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const monitors = createPageMonitors(page);
    try{
        await installAuditRuntime(page);
        await openApplication(page);
        await assertStableReleaseIdentity(page, prefix);
        await assertLayout(page, `${prefix} Home`);
        await runAxe(page, `${prefix} Home`);
        await assertNoDuplicateIds(page, `${prefix} Home`);
        await createFullShowdown(page, prefix);
        await assertStableReleaseIdentity(page, prefix);
        await openContinueShowdown(page);
        await assertSeasonOne(page, prefix);
        await enterSeasonData(page);
        await assertSeasonReview(page, prefix);
        await continueAfterReview(page);
        await assertFinalReview(page, prefix);
        await returnHome(page);
        await assertPersistenceAfterReload(page, prefix);
        await assertSaveLibraryKeyboardMutation(page, prefix);
        await assertManagerLinkage(page, prefix);
        await assertCareerAnalytics(page, prefix);
        await assertTransferWorkspace(page, prefix);
        await assertBackupExport(page, prefix);
        await assertRemoteJoiningSurface(page, prefix);
        await assertOfflineReload(page, context, prefix);
        await assertStableReleaseIdentity(page, prefix);
        monitors.assertClean(`${prefix} product scenario`);
        checkpoint(`${prefix} complete integration journey`);
    }finally{
        await context.close();
    }
}

async function main(){
    const { executablePath, chromiumSandbox } = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath, chromiumSandbox, headless: true });
    report.browserVersion = browser.version();
    process.stdout.write(`Chromium ${report.browserVersion} · ${runLabel}\n`);
    try{
        const scenarios = [
            { viewport: { width: 1366, height: 768 }, prefix: "Chromebook" },
            { viewport: { width: 390, height: 844 }, prefix: "Mobile" }
        ];
        for(const scenario of scenarios){
            await runProductScenario(browser, scenario.viewport, scenario.prefix);
        }
    }finally{
        await browser.close();
        fs.writeFileSync(path.join(resultsDirectory, `stability-audit-${runLabel}.json`), JSON.stringify(report, null, 2));
    }
    process.stdout.write("Stability browser audit passed.\n");
}

main().catch(error => {
    process.stderr.write(`STABILITY BROWSER AUDIT FAILED\n${error.stack || error.message}\n`);
    process.exitCode = 1;
});
