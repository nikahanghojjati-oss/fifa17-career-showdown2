/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.10.1
   Stabilized Screen and Navigation Engine
===================================================== */

const screens = [
    "mainMenu",
    "createShowdown",
    "leagueWheelScreen",
    "clubWheelScreen",
    "dashboard",
    "transferChallenge",
    "seasonEntry",
    "seasonSummary",
    "statistics",
    "trophyRoom",
    "legacy"
];

let screenHistory = [];

function reportRouteError(message, error = null){
    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error || new Error(message));
    }else{
        console.error(message, error || "");
    }
}

function getActiveScreenName(){
    return screens.find(name => {
        const element = document.getElementById(name);
        return element && !element.classList.contains("hidden");
    }) || null;
}

function renderScreenBeforeEnter(screenName){
    if(screenName === "dashboard" && currentShowdown && typeof updateShowdownUI === "function"){
        updateShowdownUI();
    }

    if(screenName === "statistics" && currentShowdown && typeof window.renderRivalryStatistics === "function"){
        window.renderRivalryStatistics();
    }

    if(screenName === "trophyRoom" && typeof window.renderTrophyRoom === "function"){
        window.renderTrophyRoom();
    }

    if(screenName === "legacy" && typeof window.renderLegacy === "function"){
        window.renderLegacy();
    }
}

function showScreen(screenName, addToHistory = true){
    if(!screens.includes(screenName)){
        reportRouteError(`Unknown screen requested: ${screenName}`);
        return false;
    }

    const target = document.getElementById(screenName);
    if(!target){
        reportRouteError(`Screen is not available: ${screenName}`);
        return false;
    }

    const current = getActiveScreenName();

    try{
        renderScreenBeforeEnter(screenName);
    }catch(error){
        reportRouteError(`Unable to prepare ${screenName}`, error);
        return false;
    }

    if(addToHistory && current && current !== screenName){
        screenHistory.push(current);
    }

    screens.forEach(name => {
        const element = document.getElementById(name);
        if(element){
            element.classList.add("hidden");
            element.removeAttribute("data-route-state");
        }
    });

    target.classList.remove("hidden");
    target.setAttribute("data-route-state", "entering");

    window.requestAnimationFrame(() => {
        target.removeAttribute("data-route-state");
    });

    return true;
}

function goBack(){
    while(screenHistory.length){
        const previous = screenHistory.pop();
        if(previous && document.getElementById(previous)){
            showScreen(previous, false);
            return;
        }
    }

    showScreen("mainMenu", false);
}

function openLegacy(){
    if(typeof window.renderLegacy !== "function"){
        reportRouteError("Legacy module is unavailable");
        return;
    }

    showScreen("legacy");
}

function resumeSavedShowdown(){
    try{
        const saved = loadSavedShowdown();

        if(!saved){
            showScreen("createShowdown");
            return;
        }

        currentShowdown = normalizeShowdown(saved);

        if(currentShowdown.status === "Completed"){
            archiveShowdown(currentShowdown);
        }

        saveCurrentShowdown();
        updateShowdownUI();

        if(!currentShowdown.selectedLeague){
            showScreen("leagueWheelScreen");
            return;
        }

        if(!currentShowdown.clubs.playerOne || !currentShowdown.clubs.playerTwo){
            prepareClubAssignment();
            return;
        }

        if(currentShowdown.status !== "Completed"){
            const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
            if(challenge && (challenge.status === "active" || challenge.status === "recording")){
                openTransferChallenge();
                return;
            }
        }

        showScreen("dashboard");
    }catch(error){
        reportRouteError("Unable to resume the saved showdown", error);
    }
}

function bindNavigationButton(button, handler, marker){
    if(!button || button.dataset[marker] === "true"){
        return;
    }

    button.dataset[marker] = "true";
    button.addEventListener("click", handler);
}

function initializeScreens(){
    const newShowdownButton = document.getElementById("newShowdown");
    const continueButton = document.getElementById("continueCareer");
    const legacyButton = document.getElementById("legacyButton");

    bindNavigationButton(newShowdownButton, () => showScreen("createShowdown"), "navigationBound");
    bindNavigationButton(continueButton, resumeSavedShowdown, "navigationBound");
    bindNavigationButton(legacyButton, openLegacy, "navigationBound");

    document.querySelectorAll("[data-back]").forEach(button => {
        bindNavigationButton(button, () => {
            const target = button.dataset.back;
            if(target){
                showScreen(target, false);
            }else{
                goBack();
            }
        }, "backBound");
    });
}
