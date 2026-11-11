/* =====================================================
   FIFA 17 Career Mode Showdown
   History screen hand-over (r91: the local archive, backup, import,
   restore and reset tools were cut; the online career is the only source)
===================================================== */

let legacyModel = null;

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
    if(typeof window.openRivalryLegacyV10 === "function"){
        window.openRivalryLegacyV10("legacy", () => legacyModel);
    }else if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
            .then(() => window.CareerModeRivalryLegacyV10.mount("legacy", () => legacyModel))
            .catch(error => window.reportApplicationError?.("History screen could not load", error));
    }
    seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", source === "model" ? legacyModel : null)));
}

window.renderLegacy = renderLegacy;
