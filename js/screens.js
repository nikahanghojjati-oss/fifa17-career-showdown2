/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.13.0
   Performance-Stabilized Screen and Navigation Engine
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
    "legacy",
    "ruleBook"
];

let screenHistory = [];
let activeScreenName = null;

function reportRouteError(message, error = null){
    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error || new Error(message));
    }else{
        console.error(message, error || "");
    }
}

function getActiveScreenName(){
    if(activeScreenName){
        const cached = document.getElementById(activeScreenName);
        if(cached && !cached.classList.contains("hidden")){
            return activeScreenName;
        }
        activeScreenName = null;
    }

    activeScreenName = screens.find(name => {
        const element = document.getElementById(name);
        return element && !element.classList.contains("hidden");
    }) || null;

    return activeScreenName;
}

function flushScreenBeforeLeave(currentScreen, nextScreen){
    if(!currentScreen || currentScreen === nextScreen){
        return true;
    }

    if(currentScreen === "transferChallenge" && typeof window.flushTransferDraftSave === "function"){
        const flushed = window.flushTransferDraftSave();
        if(flushed === false){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "Your latest transfer entry could not be saved, so navigation was paused. Try again after browser storage becomes available.",
                    "error",
                    9000
                );
            }
            return false;
        }
    }

    if(typeof window.flushScheduledCurrentShowdownSave === "function"){
        const flushed = window.flushScheduledCurrentShowdownSave();
        if(flushed === false){
            return false;
        }
    }

    return true;
}

function renderScreenBeforeEnter(screenName){
    if(screenName === "mainMenu" && typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
    if(screenName === "dashboard" && currentShowdown && typeof updateShowdownUI === "function"){
        updateShowdownUI();
    }
    if(screenName === "leagueWheelScreen" && typeof renderLeagueWheelState === "function"){
        renderLeagueWheelState();
    }
    if(screenName === "clubWheelScreen" && typeof renderClubAssignmentState === "function"){
        renderClubAssignmentState();
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
    if(!flushScreenBeforeLeave(current, screenName)){
        return false;
    }

    try{
        renderScreenBeforeEnter(screenName);
    }catch(error){
        reportRouteError(`Unable to prepare ${screenName}`, error);
        return false;
    }

    if(current === screenName){
        activeScreenName = screenName;
        return true;
    }

    if(addToHistory && current){
        screenHistory.push(current);
    }

    if(current){
        const currentElement = document.getElementById(current);
        if(currentElement){
            currentElement.classList.add("hidden");
            currentElement.removeAttribute("data-route-state");
        }
    }

    target.classList.remove("hidden");
    target.setAttribute("data-route-state", "entering");
    activeScreenName = screenName;

    window.requestAnimationFrame(() => {
        if(activeScreenName === screenName){
            target.removeAttribute("data-route-state");
        }
    });

    return true;
}

function goBack(){
    while(screenHistory.length){
        const previous = screenHistory.pop();
        if(previous && document.getElementById(previous)){
            if(showScreen(previous, false)){
                return;
            }
            break;
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

function surfaceIntegrityWarnings(showdown){
    if(!showdown || !Array.isArray(showdown.integrityWarnings) || !showdown.integrityWarnings.length){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            `Saved showdown warning: ${showdown.integrityWarnings.join(" ")}`,
            "error",
            12000
        );
    }
}

function resumeSavedShowdown(){
    try{
        const saved = loadSavedShowdown();
        if(!saved){
            showScreen("createShowdown");
            return;
        }

        let serializedBeforeNormalization = null;
        try{
            serializedBeforeNormalization = JSON.stringify(saved);
        }catch(error){
            serializedBeforeNormalization = null;
        }

        currentShowdown = normalizeShowdown(saved);
        surfaceIntegrityWarnings(currentShowdown);

        let normalizationChangedState = true;
        if(serializedBeforeNormalization !== null){
            try{
                normalizationChangedState = JSON.stringify(currentShowdown) !== serializedBeforeNormalization;
            }catch(error){
                normalizationChangedState = true;
            }
        }

        if(normalizationChangedState && !saveCurrentShowdown() && typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "The saved showdown was loaded, but its repaired state could not be written back to browser storage.",
                "error",
                10000
            );
        }

        if(currentShowdown.status === "Completed"){
            if(!archiveShowdown(currentShowdown) && typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The completed showdown is loaded, but its Legacy copy could not be refreshed.",
                    "error",
                    9000
                );
            }
        }

        updateShowdownUI();

        if(!currentShowdown.selectedLeague){
            showScreen("leagueWheelScreen");
            return;
        }

        const clubIntegrity = typeof getClubPairIntegrity === "function"
            ? getClubPairIntegrity(currentShowdown)
            : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

        if(!clubIntegrity.valid){
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
            if(target){ showScreen(target, false); }
            else { goBack(); }
        }, "backBound");
    });
}
