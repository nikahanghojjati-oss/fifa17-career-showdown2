// HO-049 item 4 · Career Start option B (Nik picked B, 2026-10-31). Opens the real Career Start (js/productionSharedCareerStart.js,
// in-page provider fakes as in shared-career-start-r33-audit) over the real Club Assignment screen and runs the spec's audit at
// the 7 sizes Nik named: each manager's crest and club name sit inside his pack frame ("fits"), nothing covers anything (packs,
// title, pillar or panel, buttons), the words never overflow their panel, all of it stays on screen, the Club screen's own
// buttons step aside, and closing the panel gives the Club screen back. Pending and waiting states, plus long club names.
// Usage: node tests/browser/career-start-b-fits-audit.cjs   (CMS_BASE_URL; CMS_CAREER_START_SHOTS=<dir> saves screenshots)
"use strict";
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const Career = require("../../js/sharedCareerStart.js");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const shotDir = process.env.CMS_CAREER_START_SHOTS || "";
const SIZES = [[1366, 768], [1440, 900], [1920, 1080], [393, 660], [375, 553], [360, 640], [412, 915]];
const rivalryId = "pair_" + "a".repeat(64), sessionId = "session_" + "b".repeat(64);
const CASES = [
    { name: "pending", clubs: ["Fiorentina", "Bologna"], state: null, sizes: SIZES },
    { name: "waiting", clubs: ["Fiorentina", "Bologna"], state: { revision: 1, phase: "WAITING_FOR_ACKNOWLEDGEMENTS", acknowledgedRoles: ["playerOne"] }, sizes: SIZES },
    { name: "long-names", clubs: ["Borussia Mönchengladbach", "Wolverhampton Wanderers"], state: null, sizes: SIZES }
];

async function openCareerStart(page, kase){
    const setup = { schemaVersion: 1, runtimeRevision: "1.9.1-r7", rivalryId, revision: 6, phase: "SHOWDOWN_CONFIRMED", coordinatorRole: "playerOne", leagueId: "serie_a", clubs: { playerOne: kase.clubs[0], playerTwo: kase.clubs[1] }, totalSeasons: 3, confirmedRoles: ["playerOne", "playerTwo"] };
    const shared = { state: kase.state };
    await page.exposeFunction("__careerReadBridge", async role => ({ ok: true, revision: shared.state?.revision || 0, state: shared.state, setup, managerRole: role, assignment: Career.localAssignment(setup, role) }));
    await page.exposeFunction("__careerAckBridge", async (role, operationId, baseRevision) => {
        try{ shared.state = JSON.parse(JSON.stringify(Career.apply({ state: shared.state, setup, actorRole: role, command: { type: "acknowledge-career-start", operationId, baseRevision } }).state)); return { ok: true, status: "accepted", revision: shared.state.revision, state: shared.state, setup, managerRole: role, assignment: Career.localAssignment(setup, role) }; }
        catch(error){ return { ok: false, code: error.code || "CAREER_START_PROVIDER_FAILED" }; }
    });
    await page.route("**/js/offlineApp.js*", route => route.fulfill({ contentType: "application/javascript", body: "window.getOfflineAppDiagnostics=()=>({isolatedGateScreenshot:true});" }));
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.evaluate(() => document.getElementById("onlinePlayerIdentityOverlay")?.remove());
    await page.waitForFunction(() => window.CareerModeClubScreenV10 && typeof window.ensureGameplayModules === "function", null, { timeout: 30000 });
    await page.evaluate(async ({ setup, rivalryId, sessionId }) => {
        window.setApplicationReducedMotionPreference(true);
        await window.ensureGameplayModules(); await window.CareerModeClubScreenV10.install();
        currentShowdown = { id: "career-start-b", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, selectedLeague: { id: "serie_a", name: "Serie A" }, clubs: { playerOne: null, playerTwo: null }, totalRounds: 3, currentRound: 1, status: "League Confirmed", rounds: [], transferChallenges: [], sharedJourney: { mode: "shared", rivalryId } };
        initializeClubAssignment(); showScreen("clubWheelScreen"); populateClubAssignmentBase(); renderReadyAssignmentState();
        currentShowdown.clubs = { ...setup.clubs }; renderClubConfirmationState();
        const state = { ready: true, status: "ready", open: false, busy: false, rivalryId, sessionId, accountId: "account_daniel", deviceId: "device_" + "1".repeat(32), managerRole: "playerOne", remoteRole: "host", setupUpdatedAtMs: Date.now(), setup };
        window.CareerModeProductionSharedShowdownSetup = { getState: () => state, async refresh(){ return { ok: true }; } };
        window.CareerModeSharedShowdownSetup = { feature: "career-start-b-audit" };
        window.CareerModeSparkSharedShowdownSetup = { async read(){ return { ok: true, state: setup }; } };
        window.CareerModeSparkSharedCareerStart = { async read(){ return window.__careerReadBridge("playerOne"); }, async acknowledge(options){ return window.__careerAckBridge("playerOne", options.operationId, options.baseRevision); } };
        window.CareerModeProductionSharedTransferChallenge = { install(){ return true; }, async open(){ return true; } };
        window.CareerModeProductionFirebaseRuntime = { async ensureAccountServices(){ return { ok: true, auth: { currentUser: { uid: "account_daniel" } }, firestore: {}, firestoreSdk: {} }; } };
        // Two Special Players, so the original-club lines (Nik 2026-10-29) are part of every layout checked.
        window.CareerModeSpecialPlayerChip = { forShowdown: () => ({ daniel: { name: "T. Courtois", club: "Chelsea" }, nik: { name: "J. Oblak", club: "Atlético Madrid" } }), clubLine: sp => sp ? `${sp.name} · ${sp.club}` : "", ensure: async () => true };
    }, { setup, rivalryId, sessionId });
    await page.waitForFunction(() => window.CareerModeClubScreenV10.isMounted() && !document.getElementById("clubWheelScreen").hasAttribute("data-v10-pending"), null, { timeout: 20000 });
    await page.evaluate(() => loadRuntimeScript("ssjr-production-career-start", "js/productionSharedCareerStart.js", () => window.CareerModeProductionSharedCareerStart));
    await page.evaluate(async () => { window.CareerModeProductionSharedCareerStart.install(); await window.CareerModeProductionSharedCareerStart.openPanel(); });
    await page.locator("#productionSharedCareerStartOverlay").waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(500); // fonts and the Club layout settle
}

(async() => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: runtime.args });
    const failures = [], lines = [];
    try{
        for(const kase of CASES) for(const [width, height] of kase.sizes){
            const phone = width <= 900;
            const context = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone, serviceWorkers: "block" });
            const page = await context.newPage(), errors = [];
            page.on("pageerror", error => errors.push(error.message));
            try{
                await openCareerStart(page, kase);
                const audit = await page.evaluate(() => window.CareerModeProductionSharedCareerStart.layoutAudit());
                const view = await page.evaluate(() => {
                    const host = document.getElementById("clubWheelScreen"), visible = id => { const n = document.getElementById(id); return Boolean(n && getComputedStyle(n).visibility === "visible" && n.getBoundingClientRect().width > 0); };
                    const overlay = document.getElementById("productionSharedCareerStartOverlay");
                    return { attr: document.documentElement.dataset.careerStartStage || "", inClub: host.contains(overlay), clubButtons: ["openClubPack", "continueClubAssignment", "clubAssignmentBack"].filter(visible), text: overlay.innerText,
                        scrollers: [...document.querySelectorAll("#app *")].filter(n => { const s = getComputedStyle(n); return /(auto|scroll)/.test(s.overflowY + s.overflowX) && (n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1) && n.tagName !== "MAIN"; }).map(n => n.id || n.className) };
                });
                if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `career-start-b-${kase.name}-${width}x${height}.png`) }); }
                const label = `${kase.name} ${width}x${height}`;
                assert.equal(audit.stage, true, `${label}: Career Start is a stage on the Club plate`);
                assert.equal(audit.mode, phone ? "phone" : "desktop", `${label}: layout mode`);
                assert.deepEqual(audit.holds.map(h => h.fits), ["fits", "fits"], `${label}: crest and name inside each pack frame ${JSON.stringify(audit.holds)}`);
                assert.deepEqual(audit.holds.map(h => h.club), kase.clubs, `${label}: Daniel's club left, Nik's right`);
                assert.deepEqual(audit.covers, [], `${label}: nothing covers anything`);
                assert.equal(audit.overflow, false, `${label}: the words fit their panel`);
                assert.equal(audit.onScreen, true, `${label}: the stage stays on screen`);
                assert.equal(view.attr, audit.mode, `${label}: the Club screen knows Career Start is up`);
                assert.equal(view.inClub, true, `${label}: the stage sits on the Club screen`);
                assert.deepEqual(view.clubButtons, [], `${label}: the Club screen's own buttons step aside`);
                assert.deepEqual(view.scrollers, [], `${label}: main is the only scroller`);
                assert.match(view.text, new RegExp(`I STARTED AT ${kase.clubs[0].toUpperCase()}|MY CAREER STARTED`), `${label}: the product's own button`);
                assert.match(view.text, /REFRESH/, `${label}: REFRESH stays`);
                assert.match(view.text, /T\. Courtois · Chelsea/, `${label}: Daniel's Special Player original club`);
                assert.match(view.text, /J\. Oblak · Atlético Madrid/, `${label}: Nik's Special Player original club`);
                assert.doesNotMatch(view.text, /marquee|\bMP\b/i, `${label}: Special Player / SP wording only`);
                if(kase.state) assert.match(view.text, /Waiting for your rival/, `${label}: the waiting status shows`);
                if(!kase.state && kase.name === "pending" && (width === 1366 || width === 375)){
                    // the stage's own button is the product's: a real tap records this manager's start and shows the waiting state
                    await page.getByRole("button", { name: `I STARTED AT ${kase.clubs[0].toUpperCase()}` }).click();
                    await page.getByRole("button", { name: "MY CAREER STARTED ✓" }).waitFor({ state: "visible", timeout: 5000 });
                    assert.match(await page.locator("#productionSharedCareerStartOverlay").innerText(), /Waiting for your rival/, `${label}: tap records the start`);
                    const after = await page.evaluate(() => window.CareerModeProductionSharedCareerStart.layoutAudit());
                    assert.equal(after.ok, true, `${label}: the waiting stage still fits ${JSON.stringify(after)}`);
                }
                const closed = await page.evaluate(() => { window.CareerModeProductionSharedCareerStart.closePanel(); return { attr: document.documentElement.dataset.careerStartStage || "", back: getComputedStyle(document.getElementById("clubAssignmentBack")).visibility }; });
                assert.deepEqual(closed, { attr: "", back: "visible" }, `${label}: closing gives the Club screen back`);
                assert.deepEqual(errors, [], `${label}: page errors`);
                lines.push(`${label}: ${audit.holds.map(h => `${h.club} crest ${h.crest}px name ${h.label}px ${h.fits}`).join(", ")}${audit.room ? ` (panel ${audit.room})` : ""}`);
            }catch(error){ failures.push(error.message); }
            finally{ await context.close().catch(() => {}); }
        }
    }finally{ await browser.close().catch(() => {}); }
    for(const line of lines) console.log(`ok ${line}`);
    if(failures.length){ for(const failure of failures) console.error(`FAIL ${failure}`); throw new Error(`${failures.length} Career Start option B check(s) failed`); }
    console.log(`PASS Career Start option B fits audit: ${lines.length} layouts (7 sizes x pending, waiting, long names); crest and name fit inside the pack frame at every size, nothing covers anything, main is the only scroller.`);
})().catch(error => { console.error("CAREER START OPTION B FITS AUDIT FAILED"); console.error(error.stack || error); process.exit(1); });
