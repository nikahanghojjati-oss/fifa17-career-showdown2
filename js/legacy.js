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
// still paints History (Team V's History replaces this box when it draws). Only the latest open's hand-over counts.
const LEGACY_HAND_OVER_DEADLINE_MS = 15000;
let legacyHandOverFailed = false, legacyHandOverToken = 0, legacyHandOverTimer = null;

function failLegacyHandOver(token = legacyHandOverToken){
    if(token !== legacyHandOverToken){ return; }
    if(legacyHandOverTimer !== null){ window.clearTimeout?.(legacyHandOverTimer); legacyHandOverTimer = null; }
    legacyHandOverFailed = true;
    const box = document.querySelector("#legacy .legacyBox"), seam = window.CareerModeCareerScreenSeam;
    if(box && seam && legacyModel === null){ box.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", null))); }
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
    if(legacyHandOverTimer !== null){ window.clearTimeout?.(legacyHandOverTimer); legacyHandOverTimer = null; }
    legacyHandOverFailed = !handOver || typeof handOver.then !== "function";
    if(!legacyHandOverFailed){
        if(typeof window.setTimeout === "function"){ legacyHandOverTimer = window.setTimeout(() => { legacyHandOverTimer = null; failLegacyHandOver(token); }, LEGACY_HAND_OVER_DEADLINE_MS); }
        handOver.then(ok => {
            if(token !== legacyHandOverToken){ return; }
            if(legacyHandOverTimer !== null){ window.clearTimeout?.(legacyHandOverTimer); legacyHandOverTimer = null; }
            if(ok === false){ failLegacyHandOver(token); }
        }, () => failLegacyHandOver(token));
    }
    const view = source === "model" ? legacyModel : legacyHandOverFailed ? null : LEGACY_LOADING;
    seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", view)));
}

window.renderLegacy = renderLegacy;
