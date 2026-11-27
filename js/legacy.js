/* =====================================================
   FIFA 17 Career Mode Showdown
   History screen hand-over (r91: the local archive, backup, import,
   restore and reset tools were cut; the online career is the only source)
===================================================== */

let legacyModel = null;
// H1 F1 (2026-11-27, Nik: History never looks broken or stale): no model here means Team V's History
// (js/rivalryLegacyV10.js) has not drawn yet, not a failure, so this box says loading until it is replaced. Only a
// History that cannot be loaded says unavailable, so the box never stays on loading for good.
const LEGACY_LOADING = Object.freeze({ status: "loading" });
// A hand-over still on its way after History's own deadline (js/rivalryLegacyV10.js LOAD_TIMEOUT, 15 s), for example a
// Team V History file fetch that hangs on a half-up link, says unavailable instead of loading for good. A late success
// still paints History. Only the latest open's hand-over counts.
// The deadline covers only the hand-over before Team V's History takes the screen (its files and their prepare):
// - once Team V's History has drawn (#legacy data-rivalry-legacy-v10="1"), its own progress-aware deadline owns
//   everything after, and this one stands down (a slow cold career that keeps progressing is never replaced);
// - while Team V's career read is running before anything is drawn, this one waits and starts its 15 s again from when
//   that read settles (so files still on their way get the full window); a read that hangs never settles, so the wait is
//   capped at LEGACY_HAND_OVER_MAX_MS (2 x 15 s) from the open whatever happens, and then it says unavailable;
// - Team V's own box (.legacyV10Screen.legacyBox) is never painted over.
const LEGACY_HAND_OVER_DEADLINE_MS = 15000;
const LEGACY_HAND_OVER_MAX_MS = 2 * LEGACY_HAND_OVER_DEADLINE_MS;
const LEGACY_CAREER_SETTLED_EVENT = "career-mode-online-career-load-settled";
let legacyHandOverFailed = false, legacyHandOverToken = 0, legacyHandOverTimer = null, legacyHandOverCapTimer = null, legacyHandOverSettledListener = null;

function legacyTakenByTeamV(){
    return document.getElementById?.("legacy")?.dataset?.rivalryLegacyV10 === "1";
}

function disarmLegacyHandOver(){
    if(legacyHandOverTimer !== null){ window.clearTimeout?.(legacyHandOverTimer); legacyHandOverTimer = null; }
    if(legacyHandOverCapTimer !== null){ window.clearTimeout?.(legacyHandOverCapTimer); legacyHandOverCapTimer = null; }
    if(legacyHandOverSettledListener){ window.removeEventListener?.(LEGACY_CAREER_SETTLED_EVENT, legacyHandOverSettledListener); legacyHandOverSettledListener = null; }
}

function armLegacyHandOver(token){
    disarmLegacyHandOver();
    if(typeof window.setTimeout !== "function"){ return; }
    const fire = () => {
        legacyHandOverTimer = null;
        if(token !== legacyHandOverToken){ return; }
        if(legacyTakenByTeamV()){ disarmLegacyHandOver(); return; }
        if(window.CareerModeRivalryLegacyV10?.careerModelLoading?.() === true){ legacyHandOverTimer = window.setTimeout(fire, LEGACY_HAND_OVER_DEADLINE_MS); return; }
        failLegacyHandOver(token);
    };
    legacyHandOverTimer = window.setTimeout(fire, LEGACY_HAND_OVER_DEADLINE_MS);
    // The cap: 30 s from the open, never restarted, unless Team V's History has drawn by then.
    legacyHandOverCapTimer = window.setTimeout(() => {
        legacyHandOverCapTimer = null;
        if(token !== legacyHandOverToken){ return; }
        if(legacyTakenByTeamV()){ disarmLegacyHandOver(); return; }
        failLegacyHandOver(token);
    }, LEGACY_HAND_OVER_MAX_MS);
    legacyHandOverSettledListener = () => {
        if(token !== legacyHandOverToken || legacyHandOverTimer === null){ return; }
        window.clearTimeout?.(legacyHandOverTimer);
        legacyHandOverTimer = window.setTimeout(fire, LEGACY_HAND_OVER_DEADLINE_MS);
    };
    window.addEventListener?.(LEGACY_CAREER_SETTLED_EVENT, legacyHandOverSettledListener);
}

function failLegacyHandOver(token = legacyHandOverToken){
    if(token !== legacyHandOverToken){ return; }
    disarmLegacyHandOver();
    legacyHandOverFailed = true;
    if(legacyTakenByTeamV()){ return; }
    const box = document.querySelector("#legacy .legacyBox"), seam = window.CareerModeCareerScreenSeam;
    if(box && seam && legacyModel === null && !/\blegacyV10Screen\b/.test(String(box.className || ""))){ box.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", null))); }
}

function readLegacyScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

function renderLegacy(request = false){
    const seamContainer = document.querySelector("#legacy .legacyBox");
    if(!seamContainer){ return; }
    const seam = readLegacyScreenSeam(() => renderLegacy(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ legacyModel = normalized.model; }
    const identity = window.CareerModeOnlinePlayerIdentity;
    const identityState = identity && typeof identity.getState === "function" ? identity.getState() : null;
    const source = seam.selectCareerScreenSource({ identityState, model: legacyModel });
    let handOver = null;
    if(typeof window.openRivalryLegacyV10 === "function"){
        handOver = window.openRivalryLegacyV10("legacy", () => legacyModel);
    }else if(typeof window.loadRuntimeScript === "function"){
        handOver = window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
            .then(() => window.CareerModeRivalryLegacyV10.mount("legacy", () => legacyModel))
            .then(() => true, error => { window.reportApplicationError?.("History screen could not load", error); return false; });
    }
    const token = ++legacyHandOverToken;
    disarmLegacyHandOver();
    legacyHandOverFailed = !handOver || typeof handOver.then !== "function";
    if(!legacyHandOverFailed){
        armLegacyHandOver(token);
        handOver.then(ok => {
            if(token !== legacyHandOverToken){ return; }
            disarmLegacyHandOver();
            if(ok === false){ failLegacyHandOver(token); }
        }, () => failLegacyHandOver(token));
    }
    const view = source === "model" ? legacyModel : legacyHandOverFailed ? null : LEGACY_LOADING;
    seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", view)));
}

window.renderLegacy = renderLegacy;
