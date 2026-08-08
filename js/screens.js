/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Lifecycle-Safe Screen and Navigation Engine
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

const MAX_SCREEN_HISTORY = 24;
let screenHistory = [];
let activeScreenName = null;
let navigationRevision = 0;

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

function getNavigationRevision(){
    return navigationRevision;
}

function resetTransientSelectionOperations(){
    if(typeof window.cancelLeagueWheelOperation === "function"){
        window.cancelLeagueWheelOperation();
    }
    if(typeof window.cancelClubAssignmentOperation === "function"){
        window.cancelClubAssignmentOperation();
    }
}

function flushScreenBeforeLeave(currentScreen, nextScreen){
    if(!currentScreen || currentScreen === nextScreen){
        return true;
    }

    if(currentScreen === "transferChallenge"){
        if(typeof window.flushTransferDraftSave === "function"){
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

        if(typeof stopTransferTimerLoop === "function"){
            stopTransferTimerLoop();
        }
    }

    if(typeof window.flushScheduledCurrentShowdownSave === "function"){
        const flushed = window.flushScheduledCurrentShowdownSave();
        if(flushed === false){
            return false;
        }
    }

    if(currentScreen === "leagueWheelScreen" && typeof window.cancelLeagueWheelOperation === "function"){
        window.cancelLeagueWheelOperation();
    }

    if(currentScreen === "clubWheelScreen" && typeof window.cancelClubAssignmentOperation === "function"){
        window.cancelClubAssignmentOperation();
    }

    if(currentScreen === "mainMenu" && typeof window.handleMainMenuExit === "function"){
        window.handleMainMenuExit();
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

    if(
        currentShowdown
        && ["clubWheelScreen", "dashboard", "transferChallenge", "seasonEntry", "seasonSummary"].includes(screenName)
        && typeof window.refreshClubVisualIdentity === "function"
    ){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function pushScreenHistory(screenName){
    if(!screenName || screenHistory[screenHistory.length - 1] === screenName){
        return;
    }

    screenHistory.push(screenName);
    if(screenHistory.length > MAX_SCREEN_HISTORY){
        screenHistory.splice(0, screenHistory.length - MAX_SCREEN_HISTORY);
    }
}

function pruneHistoryForExplicitBack(target){
    if(!target){ return; }

    const targetIndex = screenHistory.lastIndexOf(target);
    screenHistory = targetIndex >= 0
        ? screenHistory.slice(0, targetIndex)
        : [];
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
        pushScreenHistory(current);
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
    navigationRevision += 1;

    window.requestAnimationFrame(() => {
        if(activeScreenName === screenName){
            target.removeAttribute("data-route-state");
        }
    });

    return true;
}

function navigateBackTo(target){
    if(!target){
        goBack();
        return;
    }

    pruneHistoryForExplicitBack(target);
    showScreen(target, false);
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
    if(typeof window.openOptionalModule === "function"){
        window.openOptionalModule("legacy");
        return;
    }

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

        const previousSchemaVersion = Number(saved.schemaVersion) || 1;
        const previousLeagueId = saved.selectedLeague && saved.selectedLeague.id;
        const previousClubOne = saved.clubs && saved.clubs.playerOne;
        const previousClubTwo = saved.clubs && saved.clubs.playerTwo;
        const previousWarnings = Array.isArray(saved.integrityWarnings) ? saved.integrityWarnings.join("|") : "";
        const previousScoreOne = Number(saved.score && saved.score.playerOne) || 0;
        const previousScoreTwo = Number(saved.score && saved.score.playerTwo) || 0;

        currentShowdown = normalizeShowdown(saved);
        surfaceIntegrityWarnings(currentShowdown);

        const normalizationChangedState = previousSchemaVersion !== Number(currentShowdown.schemaVersion)
            || String(previousLeagueId || "") !== String(currentShowdown.selectedLeague && currentShowdown.selectedLeague.id || "")
            || String(previousClubOne || "") !== String(currentShowdown.clubs.playerOne || "")
            || String(previousClubTwo || "") !== String(currentShowdown.clubs.playerTwo || "")
            || previousWarnings !== currentShowdown.integrityWarnings.join("|")
            || previousScoreOne !== Number(currentShowdown.score.playerOne)
            || previousScoreTwo !== Number(currentShowdown.score.playerTwo);

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
            navigateBackTo(target || null);
        }, "backBound");
    });
}

window.getNavigationRevision = getNavigationRevision;
window.resetTransientSelectionOperations = resetTransientSelectionOperations;
window.navigateBackTo = navigateBackTo;
