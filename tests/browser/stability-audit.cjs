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

function createPageMonitors(page, expectedConsoleErrors = []){
    const pageErrors = [];
    const severeConsole = [];
    const localFailures = [];

    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() !== "error" || /^Failed to load resource/.test(message.text())){
            return;
        }
        if(expectedConsoleErrors.some(pattern => pattern.test(message.text()))){
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
    assert.equal((await readActiveSave(page)).status, "League Selected");
    await runAxe(page, `${prefix} League Selected`);
    await assertLayout(page, `${prefix} League Selected`);
    checkpoint(`${prefix} explicit League Continue idle checkpoint`, selectedLeague);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    assert.equal(await page.locator("#continueCareer").isEnabled(), true);
    await page.locator("#continueCareer").click();
    await waitForScreen(page, "leagueWheelScreen");
    assert.equal(normalizeText(await page.locator("#selectedLeague").textContent()), selectedLeague);
    assert.match(await page.locator("#spinLeague").innerText(), /CONTINUE TO CLUB ASSIGNMENT/i);
    checkpoint(`${prefix} League Selected reload recovery`, selectedLeague);

    await page.locator("#spinLeague").click();
    await waitForScreen(page, "clubWheelScreen");
    assert.equal((await readActiveSave(page)).status, "League Confirmed");
    await page.locator("#clubAssignmentBack").click();
    await waitForScreen(page, "leagueWheelScreen");
    await page.locator("#spinLeague").click();
    await waitForScreen(page, "clubWheelScreen");
    checkpoint(`${prefix} confirmed League Smart Back and reopen`, selectedLeague);
}

async function revealPermanentClubs(page, prefix){
    await page.locator("#openClubPack").click();
    await page.locator("#continueClubAssignment").waitFor({ state: "visible", timeout: 6000 });
    const clubOne = normalizeText(await page.locator("#clubNameOne").innerText());
    const clubTwo = normalizeText(await page.locator("#clubNameTwo").innerText());
    assert.ok(clubOne && clubTwo && clubOne !== "?" && clubTwo !== "?");
    assert.notEqual(clubOne, clubTwo, "Assigned clubs must be different.");
    const save = await readActiveSave(page);
    assert.equal(save.status, "Clubs Assigned");
    assert.deepEqual([save.clubs.playerOne, save.clubs.playerTwo], [clubOne, clubTwo]);
    await runAxe(page, `${prefix} Club Rivalry Confirmation`);
    await page.locator("#continueClubAssignment").click();
    await waitForScreen(page, "dashboard");
    await runAxe(page, `${prefix} Showdown Home`);
    await assertLayout(page, `${prefix} Showdown Home`);
    checkpoint(`${prefix} permanent two-pack rivalry`, `${clubOne} vs ${clubTwo}`);
}

async function completeTransferWithRapidDraftRecovery(page, prefix, recoverDraft){
    await page.locator("#seasonPrimaryAction").click();
    await waitForScreen(page, "transferChallenge");
    await runAxe(page, `${prefix} Transfer Window`);
    await page.locator("#startTransferTimer").click();
    await page.locator("#endTransferTimer").waitFor({ state: "visible" });
    await page.locator("#endTransferTimer").click();
    await page.locator("#completeTransferChallenge").filter({ hasText: /LOCK GUESSES/i }).waitFor({ state: "visible" });
    await runAxe(page, `${prefix} Transfer Guess Entry`);

    await page.locator("#p1Guess1Type").selectOption("league");
    await fillCanonical(page, "#p1Guess1Value", "Premier League");
    await page.locator("#p2Guess1Type").selectOption("nationality");
    await fillCanonical(page, "#p2Guess1Value", "Germany");
    await page.locator("#completeTransferChallenge").click();
    await page.locator("#completeTransferChallenge").filter({ hasText: /LOCK SIGNINGS/i }).waitFor({ state: "visible" });
    await runAxe(page, `${prefix} Transfer Signing Entry`);

    await page.locator("#p1Signing1Name").fill("Draft A");
    await page.locator("#p1Signing1Name").fill("Draft B");
    await page.locator("#p1Signing1Name").fill("Final Browser One");
    await fillCanonical(page, "#p1Signing1League", "Premier League");
    await fillCanonical(page, "#p1Signing1Nationality", "England");
    await page.locator("#p2Signing1Name").fill("Final Browser Two");
    await fillCanonical(page, "#p2Signing1League", "1. Bundesliga");
    await fillCanonical(page, "#p2Signing1Nationality", "Germany");

    if(recoverDraft){
        await page.waitForTimeout(520);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForApplication(page);
        await page.locator("#continueCareer").click();
        await waitForScreen(page, "transferChallenge");
        assert.equal(await page.locator("#p1Signing1Name").inputValue(), "Final Browser One");
        assert.equal(await page.locator("#p1Signing1League").inputValue(), "Premier League");
        assert.equal(await page.locator("#p2Signing1Name").inputValue(), "Final Browser Two");
        checkpoint(`${prefix} rapid Transfer draft reload recovery`, "latest values retained");
    }

    await page.locator("#completeTransferChallenge").click();
    await page.locator("#continueFromTransfers").waitFor({ state: "visible" });
    await runAxe(page, `${prefix} Transfer Verdicts`);
    const verdicts = normalizeText(await page.locator("#transferChallengeResults").innerText());
    assert.match(verdicts, /Final Browser One/);
    assert.match(verdicts, /Final Browser Two/);
    await page.locator("#continueFromTransfers").click();
    await waitForScreen(page, "seasonEntry");
    await runAxe(page, `${prefix} Season Results Entry`);
    await assertLayout(page, `${prefix} Season Results Entry`);
    checkpoint(`${prefix} phased Transfer Challenge completion`);
}

async function completeSeasonWithDoubleSubmitGuard(page, prefix){
    await page.locator("#p1LeaguePosition").fill("1");
    await page.locator("#p1LeaguePoints").fill("100");
    await page.locator("#p1LeagueGoals").fill("100");
    await page.locator("#p1DomesticCup").check();
    await page.locator("#p1ChampionsLeague").check();
    await page.locator("#p1TopScorer").check();
    await page.locator("#p1TopAssist").check();
    await page.locator("#p2LeaguePosition").fill("2");
    await page.locator("#p2LeaguePoints").fill("80");
    await page.locator("#p2LeagueGoals").fill("80");

    await page.locator("#completeSeason").click();
    await page.locator("#seasonReviewPanel").waitFor({ state: "visible" });
    await runAxe(page, `${prefix} Season Review`);
    assert.match(normalizeText(await page.locator("#seasonReviewOne").innerText()), /SEASON SCORE 11/);
    assert.equal((await readActiveSave(page)).rounds.length, 0, "Review must remain memory-only.");

    await page.locator("#editSeasonResults").click();
    assert.deepEqual(await activeScreens(page), ["seasonEntry"]);
    assert.equal(await page.locator("#p1LeaguePoints").inputValue(), "100");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "p1LeaguePosition");
    await page.locator("#p1LeaguePoints").fill("101");
    await page.locator("#completeSeason").click();
    await page.locator("#seasonReviewPanel").waitFor({ state: "visible" });

    await page.evaluate(() => {
        const button = document.getElementById("confirmSeasonCompletion");
        button.click();
        button.click();
    });
    await waitForScreen(page, "seasonSummary");
    await runAxe(page, `${prefix} Season Summary`);
    await assertLayout(page, `${prefix} Season Summary`);
    const save = await readActiveSave(page);
    assert.equal(save.status, "Completed");
    assert.equal(save.rounds.length, 1);
    assert.equal(save.rounds[0].playerOne.leaguePoints, 101);
    assert.equal(save.rounds.filter(round => Number(round.roundNumber) === 1).length, 1);
    assert.match(save.rounds[0].seasonId, /^season_[0-9a-f]{24}$/i, "Completed Season must retain its stable Save Library identity.");
    checkpoint(`${prefix} Review Edit and double confirmation guard`, "one Season committed");

    await page.locator("#nextSeasonAction").click();
    await waitForScreen(page, "dashboard");
    assert.match(normalizeText(await page.locator("#dashboard").innerText()), /1 season completed/i);
}

async function verifyReloadAndHistoryRecovery(page, prefix){
    await page.locator("#dashboard [data-smart-back]").click();
    await waitForScreen(page, "mainMenu");
    assert.match(await page.locator("#seasonIndicator").innerText(), /Showdown Complete/i);
    await runAxe(page, `${prefix} Completed Home`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    assert.match(await page.locator("#seasonIndicator").innerText(), /Showdown Complete/i);
    await page.locator("#continueCareer").click();
    await waitForScreen(page, "dashboard");

    await page.goto("about:blank");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    assert.match(await page.locator("#seasonIndicator").innerText(), /Showdown Complete/i);
    await page.goForward({ waitUntil: "load" });
    assert.equal(page.url(), "about:blank");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await waitForApplication(page);
    assert.match(await page.locator("#seasonIndicator").innerText(), /Showdown Complete/i);
    await page.locator("#continueCareer").click();
    await waitForScreen(page, "dashboard");
    assert.equal((await readActiveSave(page)).rounds.length, 1);
    checkpoint(`${prefix} reload plus browser Back and Forward recovery`, "completed Save Library identity retained");
}

async function smokeOptionalDestinations(page, prefix){
    await runAxe(page, `${prefix} Completed Showdown Home`);
    await page.locator("#rivalryStatisticsButton").click();
    await waitForScreen(page, "statistics");
    await runAxe(page, `${prefix} Rivalry Statistics`);
    await page.locator("#statistics .backButton").click();
    await waitForScreen(page, "dashboard");
    await page.locator("#dashboard [data-smart-back]").click();
    await waitForScreen(page, "mainMenu");

    await page.locator("#legacyButton").click();
    await waitForScreen(page, "legacy");
    await runAxe(page, `${prefix} Legacy`);
    await page.locator("#legacy .backButton").click();
    await waitForScreen(page, "mainMenu");

    await page.locator("#careerStatisticsButton").click();
    await waitForScreen(page, "careerStatistics");
    await runAxe(page, `${prefix} Career Statistics`);
    await page.locator("#careerStatisticsTrophyButton").click();
    await waitForScreen(page, "trophyRoom");
    await runAxe(page, `${prefix} Trophy Room`);
    await page.locator("#trophyRoom .backButton").click();
    await waitForScreen(page, "careerStatistics");
    await page.locator("#careerStatistics .backButton").click();
    await waitForScreen(page, "mainMenu");

    await page.locator("#ruleBookButton").click();
    await waitForScreen(page, "ruleBook");
    await runAxe(page, `${prefix} Rule Book`);
    await page.locator("#ruleBook .backButton").click();
    await waitForScreen(page, "mainMenu");

    assert.equal(await page.locator("[data-menu-media-source]").count(), 7, "Home must retain exactly seven media choices.");
    assert.equal(await page.locator("#menuMusicPlayer iframe").count(), 0, "Home media must remain unloaded before Play.");

    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({ state: "visible" });
    await runAxe(page, `${prefix} Settings`);
    const eventCount = await page.evaluate(() => window.__cmsRouteEvents.length);
    await page.getByRole("radio", { name: /REDUCE MOTION/i }).click();
    await page.locator("#settingsClose").click();
    await page.locator("#ruleBookButton").click();
    await waitForScreen(page, "ruleBook");
    await page.locator("#ruleBook .backButton").click();
    await waitForScreen(page, "mainMenu");
    assert.equal(
        await page.evaluate(start => window.__cmsRouteEvents.length - start, eventCount),
        0,
        "Reduced Motion must suppress theatrical route markers."
    );

    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({ state: "visible" });
    await page.getByRole("radio", { name: /FOLLOW DEVICE/i }).click();
    await page.locator("#settingsClose").click();
    await assertNoDuplicateIds(page, `${prefix} fully loaded DOM`);
    checkpoint(`${prefix} optional destination and Settings coverage`);
}

async function runProductScenario(browser, config){
    const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.deviceScaleFactor || 1,
        isMobile: Boolean(config.isMobile),
        hasTouch: Boolean(config.hasTouch),
        reducedMotion: config.reducedMotion,
        locale: "en-US"
    });
    const page = await context.newPage();
    const monitors = createPageMonitors(page);
    await installAuditRuntime(page);

    try{
        await openApplication(page);
        assert.equal(normalizeText(await page.locator("#seasonIndicator").textContent()), "No Active Showdown");
        assert.equal(await page.locator("#continueCareer").isEnabled(), false);
        await runAxe(page, `${config.prefix} Empty Home`);
        await assertLayout(page, `${config.prefix} Empty Home`);

        await createShowdownWithRapidActivation(page, config.prefix);
        await selectAndConfirmLeague(page, config.prefix);
        await revealPermanentClubs(page, config.prefix);
        await completeTransferWithRapidDraftRecovery(page, config.prefix, config.recoverDraft);
        await completeSeasonWithDoubleSubmitGuard(page, config.prefix);
        await verifyReloadAndHistoryRecovery(page, config.prefix);

        if(config.fullOptional){
            await smokeOptionalDestinations(page, config.prefix);
        }else{
            await runAxe(page, `${config.prefix} Completed Dashboard`);
            await assertLayout(page, `${config.prefix} Completed Dashboard`);
            await page.locator("#dashboard [data-smart-back]").click();
            await waitForScreen(page, "mainMenu");
            await assertLayout(page, `${config.prefix} Completed Home`);
        }

        await assertNoDuplicateIds(page, `${config.prefix} final DOM`);
        monitors.assertClean(config.prefix);
        checkpoint(`${config.prefix} clean runtime and local assets`);
    }finally{
        await context.close();
    }
}

async function runCorruptStorageFixture(browser){
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: "en-US" });
    await context.addInitScript(({ origin, activeKey, legacyKey, preferencesKey }) => {
        if(location.origin !== origin){ return; }
        localStorage.setItem(activeKey, "{corrupt active");
        localStorage.setItem(legacyKey, "{corrupt legacy");
        localStorage.setItem(preferencesKey, "[]");
    }, {
        origin: baseUrl.origin,
        activeKey: activeStorageKey,
        legacyKey: legacyStorageKey,
        preferencesKey: preferencesStorageKey
    });
    const page = await context.newPage();
    const monitors = createPageMonitors(page, [
        /Unable to parse the active showdown/,
        /Unable to parse Legacy history/,
        /Unable to parse application preferences/,
        /Unable to prepare local Save Library authority/,
        /Save Library activation failed/
    ]);
    await installAuditRuntime(page);

    try{
        await openApplication(page);
        assert.equal(await page.locator("#continueCareer").isEnabled(), false, "Corrupt active data must not enable Continue.");
        assert.equal(await page.evaluate(key => localStorage.getItem(key), activeStorageKey), "{corrupt active");

        await page.locator("#legacyButton").click();
        await waitForScreen(page, "legacy");
        await runAxe(page, "Corrupt Legacy fallback");
        assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyStorageKey), "{corrupt legacy");
        await page.locator("#legacy .backButton").click();
        await waitForScreen(page, "mainMenu");

        await page.locator("#newShowdown").click();
        await waitForScreen(page, "createShowdown");
        await page.locator("#showdownName").fill("Recovery Guard Audit");
        await page.locator("#managerOne").fill("Recovery One");
        await page.locator("#managerTwo").fill("Recovery Two");

        await page.locator("#startShowdown").click();
        await page.waitForFunction(() => !document.getElementById("startShowdown").disabled);
        assert.deepEqual(await activeScreens(page), ["createShowdown"], "Corrupt singleton bytes must block normal Start rather than being replaced during cutover.");
        assert.equal(await page.evaluate(key => localStorage.getItem(key), activeStorageKey), "{corrupt active");
        assert.equal(await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey), null, "Failed cutover must not fabricate Save Library authority from corrupt singleton bytes.");
        assert.equal(await page.evaluate(() => typeof currentShowdown === "undefined" ? "missing" : currentShowdown), null);
        monitors.assertClean("Corrupt storage fixture");
        checkpoint("Corrupt singleton bytes fail closed at Save Library cutover");
    }finally{
        await context.close();
    }
}

async function runQuotaFailureFixture(browser){
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: "en-US" });
    const page = await context.newPage();
    const monitors = createPageMonitors(page, [/Unable to write local save data/, /Unable to prepare local Save Library authority/, /Save Library/]);
    await installAuditRuntime(page);

    try{
        await openApplication(page);
        await page.locator("#newShowdown").click();
        await waitForScreen(page, "createShowdown");
        await page.locator("#showdownName").fill("Quota Rollback Audit");
        await page.locator("#managerOne").fill("Quota One");
        await page.locator("#managerTwo").fill("Quota Two");

        await page.evaluate(key => {
            window.__cmsQuotaOriginalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function quotaSetItem(storageKey, value){
                if(storageKey === key){
                    throw new DOMException("Simulated quota exhaustion", "QuotaExceededError");
                }
                return window.__cmsQuotaOriginalSetItem.call(this, storageKey, value);
            };
        }, saveLibraryStorageKey);
        await page.locator("#startShowdown").click();
        await page.waitForFunction(() => !document.getElementById("startShowdown").disabled);
        assert.deepEqual(await activeScreens(page), ["createShowdown"]);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), activeStorageKey), null);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), saveLibraryStorageKey), null, "Failed Save Library write must roll back without accepting authority.");
        assert.equal(await page.evaluate(() => typeof currentShowdown === "undefined" ? "missing" : currentShowdown), null);
        await runAxe(page, "Quota failure recovery state");

        await page.evaluate(() => {
            Storage.prototype.setItem = window.__cmsQuotaOriginalSetItem;
            delete window.__cmsQuotaOriginalSetItem;
        });
        await page.locator("#startShowdown").click();
        await waitForScreen(page, "leagueWheelScreen");
        assert.equal((await readActiveSave(page)).name, "Quota Rollback Audit");
        monitors.assertClean("Quota failure fixture");
        checkpoint("Save Library quota rejection blocks navigation and preserves rollback state");
    }finally{
        await context.close();
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const tasks = [
        runCorruptStorageFixture,
        runQuotaFailureFixture,
        browser => runProductScenario(browser, {
            prefix: "Chromebook",
            viewport: { width: 1366, height: 768 },
            reducedMotion: "no-preference",
            recoverDraft: true,
            fullOptional: true
        }),
        browser => runProductScenario(browser, {
            prefix: "Mobile",
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            reducedMotion: "reduce",
            recoverDraft: false,
            fullOptional: false
        })
    ];

    for(const task of tasks){
        const browser = await chromium.launch({
            executablePath: runtime.executablePath,
            headless: true,
            args: runtime.args
        });
        if(!report.browserVersion){
            report.browserVersion = await browser.version();
            process.stdout.write(`Chromium ${report.browserVersion} · ${runLabel}\n`);
        }
        try{
            await task(browser);
        }finally{
            if(browser.isConnected()){
                await browser.close();
            }
        }
    }

    const reportPath = path.join(resultsDirectory, `stability-audit-${runLabel}.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(`REPORT ${reportPath}\n`);
    process.stdout.write(`CHECKPOINTS ${report.checkpoints.length}\n`);
    process.stdout.write(`AXE_SCANS ${report.axeScans.length}\n`);
})().catch(error => {
    const reportPath = path.join(resultsDirectory, `stability-audit-${runLabel}-failed.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify({ ...report, failure: error.stack || error.message }, null, 2)}\n`);
    console.error("STABILITY BROWSER AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});
