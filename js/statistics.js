/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Career + Current Rivalry Statistics Presentation
===================================================== */

let careerStatisticsModel = null;
let rivalryStatisticsModel = null;

function readCareerScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

// JOB-13: online (or model-fed) Career Statistics and Trophy Room open Team V's screens, loaded on demand.
function openCareerScreensV10(screen){
    if(typeof window.loadRuntimeScript !== "function"){ return; }
    const screens = window.CareerModeV10Screens;
    const fail = error => { screens?.settle?.(screen); if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } };
    const seam = window.CareerModeCareerScreenSeam;
    if(!seam){
        // First open: the seam is still loading, so the route is decided when it arrives (the old screen stays hidden meanwhile).
        screens?.expect?.(screen);
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(() => { if(typeof window.getActiveScreenName === "function" && window.getActiveScreenName() === screen){ openCareerScreensV10(screen); }else{ screens?.settle?.(screen); } })
            .catch(fail);
        return;
    }
    const getModel = () => screen === "trophyRoom" ? (typeof trophyRoomModel === "undefined" ? null : trophyRoomModel) : careerStatisticsModel;
    screens?.expect?.(screen);
    window.loadRuntimeScript("career-screens-v10", "js/careerScreensV10.js", () => Boolean(window.CareerModeCareerScreensV10))
        .then(() => window.CareerModeCareerScreensV10.mount(screen, getModel))
        .catch(fail);
}

// JOB-28: the same live model seam, now drawn through the shared lazy loader.
function openRivalryLegacyV10(screen, getModel){
    if(typeof window.loadRuntimeScript !== "function"){ return; }
    const host = screen === "legacy" ? "legacy" : "statistics";
    window.CareerModeV10Screens?.expect?.(host);
    window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
        .then(() => window.CareerModeRivalryLegacyV10.mount(screen, getModel))
        .catch(error => { window.CareerModeV10Screens?.settle?.(host); window.reportApplicationError?.("History and stats screens could not load", error); });
}
window.openRivalryLegacyV10 = openRivalryLegacyV10;

function readCareerIdentityState(){
    const identity = window.CareerModeOnlinePlayerIdentity;
    return identity && typeof identity.getState === "function" ? identity.getState() : null;
}


function createStatisticsScreen(){
    if(document.getElementById("statistics")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "statistics";
    section.className = "screen hidden analyticsScreen";
    const heading = document.createElement("h2");
    heading.textContent = "RIVALRY STATISTICS";
    const content = document.createElement("div");
    content.id = "rivalryStatisticsContent";
    content.className = "analyticsContent";
    const actions = document.createElement("div");
    actions.className = "analyticsActions";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK TO SHOWDOWN HOME";
    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function createCareerStatisticsScreen(){
    if(document.getElementById("careerStatistics")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "careerStatistics";
    section.className = "screen hidden analyticsScreen";

    const heading = document.createElement("h2");
    heading.textContent = "CAREER STATISTICS";

    const content = document.createElement("div");
    content.id = "careerStatisticsContent";
    content.className = "analyticsContent";

    const actions = document.createElement("div");
    actions.className = "dashboardActions";

    const rivalryButton = document.createElement("button");
    rivalryButton.type = "button";
    rivalryButton.id = "careerStatisticsRivalryButton";
    rivalryButton.className = "menuButton";
    rivalryButton.textContent = "CURRENT RIVALRY STATISTICS";
    rivalryButton.addEventListener("click", () => {
        if(currentShowdown){ openRivalryStatistics(); }
    });

    const trophyButton = document.createElement("button");
    trophyButton.type = "button";
    trophyButton.id = "careerStatisticsTrophyButton";
    trophyButton.className = "menuButton";
    trophyButton.textContent = "OPEN TROPHY ROOM";
    trophyButton.addEventListener("click", () => {
        if(typeof window.openOptionalModule === "function"){
            window.openOptionalModule("trophyRoom");
        }
    });

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK TO HOME";

    actions.append(rivalryButton, trophyButton, back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

// r90: Career Statistics is always the online model view (or its unavailable state); the old local
// tables, leader cards and comparison rows were unreachable since r61 and are gone with js/analytics.js.
function renderCareerStatistics(request = false){
    const content = document.getElementById("careerStatisticsContent");
    if(!content){ return; }
    const seam = readCareerScreenSeam(() => renderCareerStatistics(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ careerStatisticsModel = normalized.model; }
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: careerStatisticsModel });
    content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("careerStatistics", source === "model" ? careerStatisticsModel : null)));
}

function renderRivalryStatistics(request = false){
    const content = document.getElementById("rivalryStatisticsContent");
    if(!content){ return; }
    const seam = readCareerScreenSeam(() => renderRivalryStatistics(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ rivalryStatisticsModel = normalized.model; }
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: rivalryStatisticsModel });
    content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("rivalryStatistics", source === "model" ? rivalryStatisticsModel : null)));
}

function openCareerStatistics(request = false){
    createCareerStatisticsScreen();
    renderCareerStatistics(request);
    showScreen("careerStatistics");
    openCareerScreensV10("careerStatistics");
}

function openRivalryStatistics(request = false){
    const suppliesModel = Boolean(request && typeof request === "object" && request.model);
    if(!suppliesModel && !currentShowdown && typeof window.loadRuntimeScript !== "function"){ return; }
    createStatisticsScreen();
    renderRivalryStatistics(request);
    showScreen("statistics");
    openRivalryLegacyV10("rivalryStatistics", () => rivalryStatisticsModel);
}

window.renderCareerStatistics = renderCareerStatistics;
window.openCareerStatistics = openCareerStatistics;
window.renderRivalryStatistics = renderRivalryStatistics;
window.openRivalryStatistics = openRivalryStatistics;
// Rivalry Statistics also reads completed career history without a local active save.
// Match the read-only Standings route extension; every other route keeps its guard.
if(typeof window.isRouteStateValid === "function"){
    const rivalryRouteStateValid = window.isRouteStateValid;
    window.isRouteStateValid = function(screen){ return screen === "statistics" || rivalryRouteStateValid.apply(this, arguments); };
}
