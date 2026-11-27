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
let legacyHandOverFailed = false;

function failLegacyHandOver(){
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
    legacyHandOverFailed = !handOver || typeof handOver.then !== "function";
    if(!legacyHandOverFailed){ handOver.then(ok => { if(ok === false){ failLegacyHandOver(); } }, failLegacyHandOver); }
    const view = source === "model" ? legacyModel : legacyHandOverFailed ? null : LEGACY_LOADING;
    seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", view)));
}

window.renderLegacy = renderLegacy;
