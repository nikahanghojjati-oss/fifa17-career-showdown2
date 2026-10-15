const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const activeAdapter = require("../../js/sharedActiveShowdownAdapter.js");

const baseUrl = process.env.CMS_BASE_URL || "http://127.0.0.1:4173/";
const own = fixtures.result({ leaguePosition: 1, championsLeague: true });
const opponent = fixtures.result({ leaguePosition: 2 });
const history = fixtures.projection({ totalSeasons: 3, seasons: Array.from({ length: 3 }, () => [own, opponent]) });
const ready = {
    identity: fixtures.identity(),
    pair: fixtures.pair(history.rivalryId),
    multiSeason: fixtures.multi({ rivalryId: history.rivalryId, totalSeasons: 3, acceptedSeasons: 2 }),
    history: null,
    finalReconciliation: null,
    terminalClose: null,
    seasonResults: fixtures.seasonResults({ rivalryId: history.rivalryId, seasonNumber: 3, phase: "RESULTS_READY", published: ["playerOne", "playerTwo"], own, opponent })
};
const finished = {
    ...ready,
    multiSeason: fixtures.multiFor(history),
    history: fixtures.history(history),
    finalReconciliation: fixtures.finalReconciliation(history),
    terminalClose: fixtures.closed(history)
};
const showdown = {
    ...fixtures.completedShowdownStorage().active,
    totalRounds: 3,
    currentRound: 3,
    rounds: history.seasonHistory.slice(0, 2),
    transferChallenges: [1, 2, 3].map(seasonNumber => ({ seasonNumber, status: "completed", signings: { playerOne: [], playerTwo: [] }, guesses: { againstPlayerOne: [], againstPlayerTwo: [] } })),
    sharedJourney: { contractVersion: 1, mode: "shared", setupPending: false }
};

async function prepare(page, snapshot) {
    await page.evaluate(async ({ showdown, snapshot }) => {
        await window.ensureGameplayModules();
        await window.ensureRequiredFootballVisualExperience();
        // Read-only provider snapshots, as in the flash audit. All routes, buttons and mounts remain real.
        const names = { identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", multiSeason: "CareerModeProductionSharedMultiSeasonProgression", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose", seasonResults: "CareerModeProductionSharedSeasonResults" };
        for (const [key, name] of Object.entries(names)) window[name] = { getState: () => snapshot[key] };
        currentShowdown = showdown;
        window.resetNavigationState();
        assertRoute("mainMenu");
        assertRoute("dashboard");
        function assertRoute(screen) {
            if (!window.showScreen(screen)) throw new Error(`Fixture could not visit ${screen}`);
        }
    }, { showdown, snapshot });
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: runtime.args });
    const failures = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        page.setDefaultTimeout(12000);
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden" });

        const cases = [
            { name: "Season Results", screen: "seasonEntry", snapshot: ready, open: async () => {
                await page.evaluate(async () => {
                    await window.loadRuntimeScript("v10-season-final", "js/seasonFinalV10.js", () => window.CareerModeSeasonFinalV10);
                    await window.CareerModeSeasonFinalV10.install();
                    window.openSeasonEntry();
                    await window.CareerModeV10Screens.show("seasonEntry");
                });
                await page.locator("#seasonEntry .v10SeasonStage:not([hidden])").waitFor({ state: "visible" });
            } },
            { name: "Champion", screen: "seasonEntry", snapshot: finished, open: async () => {
                await page.evaluate(async () => {
                    window.CareerModeV10Screens.invalidate("seasonEntry");
                    window.openSeasonEntry();
                    await window.CareerModeV10Screens.show("seasonEntry");
                });
                await page.locator("#seasonEntry .v10FinalStage").waitFor({ state: "visible" });
            } },
            { name: "Rivalry Statistics", screen: "statistics", snapshot: finished, open: async () => {
                await page.evaluate(async model => {
                    await window.openOptionalModule("statistics");
                    window.openRivalryStatistics({ model });
                }, activeAdapter.rivalryView(finished));
                await page.locator("#statistics .rv-stage").waitFor({ state: "visible" });
            } },
            { name: "Transfer Challenge", screen: "transferChallenge", snapshot: ready, open: async () => {
                await page.evaluate(() => {
                    currentShowdown.transferChallenges = currentShowdown.transferChallenges.slice(0, 2);
                    if (!window.showScreen("transferChallenge")) throw new Error("Transfer Challenge route unavailable");
                });
            } },
            // Career Statistics currently says BACK TO MAIN MENU; preserve and verify that real control too.
            { name: "Career Statistics", screen: "careerStatistics", snapshot: finished, label: /BACK TO MAIN MENU/, open: async () => {
                await page.evaluate(() => window.openOptionalModule("careerStatistics"));
            } },
            { name: "Plain BACK", screen: "createShowdown", snapshot: ready, label: /^BACK$/, expected: "dashboard", open: async () => {
                await page.evaluate(() => window.navigateTo("createShowdown"));
            } }
        ];
        for (const test of cases) {
            await prepare(page, test.snapshot);
            await test.open();
            await page.locator(`#${test.screen}`).waitFor({ state: "visible" });
            const back = page.locator(`#${test.screen} .backButton`).filter({ hasText: test.label || /BACK TO SHOWDOWN HOME/ });
            assert.equal(await back.count(), 1, `${test.name} must expose its existing back control`);
            const label = (await back.textContent()).replace(/\s+/g, " ").trim();
            await back.click();
            await page.waitForFunction(screen => window.getActiveScreenName() !== screen, test.screen);
            const expected = test.expected || "mainMenu";
            const actual = await page.locator(".screen:not(.hidden)").evaluateAll(nodes => nodes.map(node => node.id));
            const passed = actual.length === 1 && actual[0] === expected;
            process.stdout.write(`${passed ? "PASS" : "FAIL"} ${test.name}: ${label} -> ${actual.join(",")} (expected ${expected})\n`);
            if (!passed) failures.push(`${test.name}: expected ${expected}, got ${actual.join(",")}`);
        }
        assert.deepEqual(pageErrors, [], "Home routing must not emit page errors");
        assert.deepEqual(failures, [], "Explicit Home controls must ignore dashboard history; plain BACK must retain it");
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
