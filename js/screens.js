/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0
   Smart State-Aware Navigation Engine
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

const GAMEPLAY_SCREENS = new Set([
    "leagueWheelScreen",
    "clubWheelScreen",
    "dashboard",
    "transferChallenge",
    "seasonEntry",
    "seasonSummary",
    "statistics"
]);

const SAFE_BACK_TARGETS = Object.freeze({
    mainMenu: [],
    createShowdown: ["dashboard", "mainMenu"],
    leagueWheelScreen: ["createShowdown", "mainMenu"],
    clubWheelScreen: ["leagueWheelScreen", "mainMenu"],
    dashboard: ["mainMenu"],
    transferChallenge: ["dashboard", "mainMenu"],
    seasonEntry: ["dashboard", "mainMenu"],
    seasonSummary: ["dashboard", "mainMenu"],
    statistics: ["dashboard", "mainMenu"],
    trophyRoom: ["dashboard", "mainMenu"],
    legacy: ["dashboard", "mainMenu"],
    ruleBook: ["mainMenu"]
});

const MAX_SCREEN_HISTORY = 18;
let screenHistory = [];
let activeScreenName = null;
let navigationRevision = 0;
let navigationBusy = false;
let smartBackDelegationBound = false;

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

function resetNavigationState(){
    screenHistory.length = 0;
    navigationRevision += 1;
}

function resetTransientSelectionOperations(){
    if(typeof window.cancelLeagueWheelOperation === "function"){
        window.cancelLeagueWheelOperation();
    }
    if(typeof window.cancelClubAssignmentOperation === "function"){
        window.cancelClubAssignmentOperation();
    }
}

function getClubPairRouteState(showdown = currentShowdown){
    if(!showdown || !showdown.selectedLeague || !showdown.clubs){
        return false;
    }

    if(typeof getClubPairIntegrity === "function"){
        return Boolean(getClubPairIntegrity(showdown).valid);
    }

    const one = showdown.clubs.playerOne;
    const two = showdown.clubs.playerTwo;
    return Boolean(one && two && one !== two);
}

function isClubConfirmationPending(showdown = currentShowdown){
    return Boolean(
        showdown
        && showdown.status === "Clubs Assigned"
        && getClubPairRouteState(showdown)
    );
}

function getCurrentChallengeRouteState(showdown = currentShowdown){
    if(!showdown){ return null; }

    if(typeof getTransferChallengeForSeason === "function"){
        return getTransferChallengeForSeason(showdown.currentRound);
    }

    const challenges = Array.isArray(showdown.transferChallenges)
        ? showdown.transferChallenges
        : [];
    return challenges.find(
        challenge => challenge && Number(challenge.seasonNumber) === Number(showdown.currentRound)
    ) || null;
}

function isRouteStateValid(screenName){
    const showdown = typeof currentShowdown !== "undefined" ? currentShowdown : null;

    if(["mainMenu", "createShowdown", "trophyRoom", "legacy", "ruleBook"].includes(screenName)){
        return true;
    }

    if(screenName === "statistics"){
        return Boolean(showdown);
    }

    if(!showdown){
        return false;
    }

    if(screenName === "dashboard"){
        return !isClubConfirmationPending(showdown);
    }

    if(showdown.status === "Completed"){
        return screenName === "seasonSummary" && Array.isArray(showdown.rounds) && showdown.rounds.length > 0;
    }

    const clubsValid = getClubPairRouteState(showdown);
    const confirmationPending = clubsValid && isClubConfirmationPending(showdown);

    if(screenName === "leagueWheelScreen"){
        return !clubsValid;
    }

    if(screenName === "clubWheelScreen"){
        return Boolean(showdown.selectedLeague) && (!clubsValid || confirmationPending);
    }

    if(!clubsValid || confirmationPending){
        return false;
    }

    const challenge = getCurrentChallengeRouteState(showdown);

    if(screenName === "transferChallenge"){
        return !challenge || challenge.status !== "completed";
    }

    if(screenName === "seasonEntry"){
        return Boolean(challenge && challenge.status === "completed");
    }

    if(screenName === "seasonSummary"){
        return Array.isArray(showdown.rounds) && showdown.rounds.length > 0;
    }

    return true;
}

function resolveCanonicalShowdownRoute(){
    const showdown = typeof currentShowdown !== "undefined" ? currentShowdown : null;
    if(!showdown){
        return "mainMenu";
    }

    if(showdown.status === "Completed"){
        return "dashboard";
    }

    if(!showdown.selectedLeague){
        return "leagueWheelScreen";
    }

    if(!getClubPairRouteState(showdown) || isClubConfirmationPending(showdown)){
        return "clubWheelScreen";
    }

    const challenge = getCurrentChallengeRouteState(showdown);
    if(challenge && (challenge.status === "active" || challenge.status === "recording")){
        return "transferChallenge";
    }

    return "dashboard";
}

async function ensureGameplayRuntime(){
    if(typeof window.ensureGameplayModules !== "function"){
        throw new Error("The gameplay runtime loader is unavailable.");
    }
    return window.ensureGameplayModules();
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

        if(typeof window.stopTransferTimerLoop === "function"){
            window.stopTransferTimerLoop();
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
    if(screenName === "dashboard" && currentShowdown && typeof window.updateShowdownUI === "function"){
        window.updateShowdownUI();
    }
    if(screenName === "leagueWheelScreen" && typeof window.renderLeagueWheelState === "function"){
        window.renderLeagueWheelState();
    }
    if(screenName === "clubWheelScreen" && typeof window.renderClubAssignmentState === "function"){
        window.renderClubAssignmentState();
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

    if(!isRouteStateValid(screenName)){
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

async function navigateTo(screenName, options = {}){
    const addToHistory = options.addToHistory !== false;
    const allowCanonicalFallback = options.allowCanonicalFallback !== false;
    let target = screenName;

    try{
        if(GAMEPLAY_SCREENS.has(target)){
            await ensureGameplayRuntime();
        }

        if(!isRouteStateValid(target) && allowCanonicalFallback){
            target = resolveCanonicalShowdownRoute();
            if(GAMEPLAY_SCREENS.has(target)){
                await ensureGameplayRuntime();
            }
        }

        if(showScreen(target, addToHistory)){
            return true;
        }

        if(allowCanonicalFallback && target !== "mainMenu"){
            const canonical = resolveCanonicalShowdownRoute();
            if(canonical !== target && showScreen(canonical, addToHistory)){
                return true;
            }
            return showScreen("mainMenu", addToHistory);
        }
    }catch(error){
        reportRouteError(`Unable to navigate to ${screenName}`, error);
    }

    return false;
}

function getLegalBackTargets(screenName){
    return SAFE_BACK_TARGETS[screenName] || ["mainMenu"];
}

function consumeHistoryTo(target){
    const index = screenHistory.lastIndexOf(target);
    if(index >= 0){
        screenHistory.splice(index);
    }else{
        screenHistory.length = 0;
    }
}

async function navigateBackSmart(){
    if(navigationBusy){ return false; }
    navigationBusy = true;

    try{
        const current = getActiveScreenName() || resolveCanonicalShowdownRoute();
        const legalTargets = getLegalBackTargets(current);

        for(let index = screenHistory.length - 1; index >= 0; index -= 1){
            const candidate = screenHistory[index];
            if(
                legalTargets.includes(candidate)
                && candidate !== current
                && document.getElementById(candidate)
                && isRouteStateValid(candidate)
            ){
                if(await navigateTo(candidate, { addToHistory: false, allowCanonicalFallback: false })){
                    consumeHistoryTo(candidate);
                    return true;
                }
            }
        }

        for(const fallback of legalTargets){
            if(document.getElementById(fallback) && isRouteStateValid(fallback)){
                if(await navigateTo(fallback, { addToHistory: false, allowCanonicalFallback: false })){
                    screenHistory.length = 0;
                    return true;
                }
            }
        }

        const canonical = resolveCanonicalShowdownRoute();
        if(await navigateTo(canonical, { addToHistory: false, allowCanonicalFallback: false })){
            screenHistory.length = 0;
            return true;
        }

        screenHistory.length = 0;
        return showScreen("mainMenu", false);
    }finally{
        navigationBusy = false;
    }
}

function goBack(){
    return navigateBackSmart();
}

function openLegacy(){
    if(typeof window.openOptionalModule === "function"){
        return window.openOptionalModule("legacy");
    }

    reportRouteError("Legacy module loader is unavailable");
    return false;
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

function didNormalizationChange(saved, normalized){
    const before = {
        schema: Number(saved.schemaVersion) || 1,
        rounds: Number(saved.totalRounds) || 1,
        current: Number(saved.currentRound) || 1,
        status: String(saved.status || ""),
        one: String(saved.managers && saved.managers.playerOne || ""),
        two: String(saved.managers && saved.managers.playerTwo || ""),
        league: String(saved.selectedLeague && saved.selectedLeague.id || ""),
        clubOne: String(saved.clubs && saved.clubs.playerOne || ""),
        clubTwo: String(saved.clubs && saved.clubs.playerTwo || ""),
        scoreOne: Number(saved.score && saved.score.playerOne) || 0,
        scoreTwo: Number(saved.score && saved.score.playerTwo) || 0,
        warnings: Array.isArray(saved.integrityWarnings) ? saved.integrityWarnings.join("|") : ""
    };

    return before.schema !== Number(normalized.schemaVersion)
        || before.rounds !== Number(normalized.totalRounds)
        || before.current !== Number(normalized.currentRound)
        || before.status !== String(normalized.status || "")
        || before.one !== String(normalized.managers.playerOne || "")
        || before.two !== String(normalized.managers.playerTwo || "")
        || before.league !== String(normalized.selectedLeague && normalized.selectedLeague.id || "")
        || before.clubOne !== String(normalized.clubs.playerOne || "")
        || before.clubTwo !== String(normalized.clubs.playerTwo || "")
        || before.scoreOne !== Number(normalized.score.playerOne)
        || before.scoreTwo !== Number(normalized.score.playerTwo)
        || before.warnings !== normalized.integrityWarnings.join("|");
}

async function resumeSavedShowdown(){
    if(navigationBusy){ return; }
    navigationBusy = true;

    try{
        const saved = loadSavedShowdown();
        if(!saved){
            currentShowdown = null;
            resetNavigationState();
            showScreen("createShowdown");
            return;
        }

        await ensureGameplayRuntime();
        currentShowdown = normalizeShowdown(saved);
        surfaceIntegrityWarnings(currentShowdown);

        if(didNormalizationChange(saved, currentShowdown) && !saveCurrentShowdown()){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The saved showdown was loaded, but its repaired state could not be written back to browser storage.",
                    "error",
                    10000
                );
            }
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

        resetNavigationState();
        updateShowdownUI();

        const canonical = resolveCanonicalShowdownRoute();
        if(canonical === "transferChallenge" && typeof window.openTransferChallenge === "function"){
            window.openTransferChallenge();
            return;
        }
        if(canonical === "clubWheelScreen" && typeof window.prepareClubAssignment === "function"){
            window.prepareClubAssignment();
            return;
        }

        if(!showScreen(canonical, false)){
            throw new Error(`The saved showdown could not open its safe route (${canonical}).`);
        }
    }catch(error){
        reportRouteError("Unable to resume the saved showdown", error);
        await navigateTo("mainMenu", { addToHistory: false });
    }finally{
        navigationBusy = false;
    }
}

function bindNavigationButton(button, handler, marker){
    if(!button || button.dataset[marker] === "true"){
        return;
    }
    button.dataset[marker] = "true";
    button.addEventListener("click", handler);
}

function setNavigationBusyState(button, busy){
    if(!button){ return; }
    button.classList.toggle("isBusy", busy);
    button.setAttribute("aria-busy", String(Boolean(busy)));
    button.disabled = Boolean(busy);
}

async function startShowdownFromSetup(){
    const button = document.getElementById("startShowdown");
    if(navigationBusy){ return; }
    navigationBusy = true;
    setNavigationBusyState(button, true);

    try{
        await ensureGameplayRuntime();
        createShowdown();
    }catch(error){
        reportRouteError("Unable to start the showdown", error);
    }finally{
        setNavigationBusyState(button, false);
        navigationBusy = false;
    }
}

function warmGameplayRuntime(){
    if(typeof window.ensureGameplayModules !== "function"){
        return;
    }
    window.ensureGameplayModules().catch(() => {
        /* Predictive warm-up failures are surfaced only if the user actually navigates into gameplay. */
    });
}

function initializeSmartBackDelegation(){
    if(smartBackDelegationBound){
        return;
    }

    smartBackDelegationBound = true;
    document.addEventListener("click", event => {
        const target = event.target instanceof Element
            ? event.target.closest(".backButton")
            : null;

        if(!target || target.disabled || target.classList.contains("dangerButton")){
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        navigateBackSmart();
    }, true);
}

function initializeScreens(){
    const newShowdownButton = document.getElementById("newShowdown");
    const continueButton = document.getElementById("continueCareer");
    const legacyButton = document.getElementById("legacyButton");
    const startButton = document.getElementById("startShowdown");

    bindNavigationButton(newShowdownButton, () => navigateTo("createShowdown"), "navigationBound");
    bindNavigationButton(continueButton, resumeSavedShowdown, "navigationBound");
    bindNavigationButton(legacyButton, openLegacy, "navigationBound");
    bindNavigationButton(startButton, startShowdownFromSetup, "navigationBound");

    [continueButton, startButton].forEach(button => {
        if(!button || button.dataset.gameplayWarmBound === "true"){ return; }
        button.dataset.gameplayWarmBound = "true";
        button.addEventListener("pointerenter", warmGameplayRuntime, { passive: true });
        button.addEventListener("focus", warmGameplayRuntime, { passive: true });
    });

    initializeSmartBackDelegation();
}

function getNavigationDiagnostics(){
    return {
        activeScreen: getActiveScreenName(),
        canonicalScreen: resolveCanonicalShowdownRoute(),
        historyLength: screenHistory.length,
        history: screenHistory.slice(),
        busy: navigationBusy,
        backAuthority: smartBackDelegationBound ? "centralized" : "unbound"
    };
}

window.getActiveScreenName = getActiveScreenName;
window.getNavigationRevision = getNavigationRevision;
window.resetNavigationState = resetNavigationState;
window.resetTransientSelectionOperations = resetTransientSelectionOperations;
window.resolveCanonicalShowdownRoute = resolveCanonicalShowdownRoute;
window.navigateTo = navigateTo;
window.navigateBackSmart = navigateBackSmart;
window.getNavigationDiagnostics = getNavigationDiagnostics;
window.resumeSavedShowdown = resumeSavedShowdown;