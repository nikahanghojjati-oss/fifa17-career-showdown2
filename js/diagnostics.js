/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Runtime Diagnostics, Lifecycle Integrity and Performance
===================================================== */

const DIAGNOSTIC_REQUIRED_ELEMENTS = [
    "mainMenu",
    "createShowdown",
    "leagueWheelScreen",
    "clubWheelScreen",
    "dashboard",
    "transferChallenge",
    "seasonEntry",
    "seasonSummary",
    "legacy",
    "newShowdown",
    "continueCareer",
    "legacyButton",
    "trophyRoomButton",
    "ruleBookButton",
    "rivalryStatisticsButton",
    "menuMediaSelector",
    "menuMusicToggle",
    "menuMusicMute",
    "menuMusicPlayer",
    "startShowdown",
    "spinLeague",
    "openClubPack",
    "continueClubAssignment",
    "seasonPrimaryAction",
    "completeTransferChallenge",
    "completeSeason"
];

const DIAGNOSTIC_REQUIRED_FUNCTIONS = [
    "showScreen",
    "createShowdown",
    "normalizeShowdown",
    "ensureCurrentShowdownNormalized",
    "getClubPairIntegrity",
    "saveCurrentShowdown",
    "initializeStorageLifecycle",
    "flushPendingApplicationWrites",
    "flushTransferDraftSave",
    "spinLeagueWheel",
    "cancelLeagueWheelOperation",
    "prepareClubAssignment",
    "assignClubs",
    "cancelClubAssignmentOperation",
    "openTransferChallenge",
    "completeTransferChallenge",
    "startTransferTimerLoop",
    "stopTransferTimerLoop",
    "openSeasonEntry",
    "completeCurrentSeason",
    "calculatePlayerSeasonScore",
    "openLegacy",
    "initializeMenuExperience",
    "refreshMainMenuExperience",
    "selectMenuMedia",
    "handleMainMenuExit",
    "initializeOptionalModules",
    "ensureOptionalModule",
    "openOptionalModule",
    "getOptionalModuleState",
    "initializePerformanceLifecycle",
    "getNavigationRevision",
    "resetTransientSelectionOperations",
    "applyClubIdentity",
    "refreshClubVisualIdentity"
];

function testLocalStorageAvailability(){
    const key = "careerModeShowdown.diagnostic";
    try{
        localStorage.setItem(key, "ok");
        const value = localStorage.getItem(key);
        localStorage.removeItem(key);
        return value === "ok";
    }catch(error){
        return false;
    }
}

function getControlBindingProblems(){
    const checks = [
        ["newShowdown", "navigationBound"],
        ["continueCareer", "navigationBound"],
        ["legacyButton", "navigationBound"],
        ["trophyRoomButton", "trophyRoomReady"],
        ["ruleBookButton", "ruleBookBound"],
        ["rivalryStatisticsButton", "statisticsLazyBound"],
        ["menuMusicToggle", "musicBound"],
        ["menuMusicMute", "musicBound"],
        ["startShowdown", "showdownUiBound"],
        ["spinLeague", "leagueWheelBound"],
        ["openClubPack", "clubAssignmentBound"],
        ["continueClubAssignment", "clubAssignmentBound"],
        ["seasonPrimaryAction", "transferPrimaryBound"],
        ["completeTransferChallenge", "transferCompleteBound"],
        ["completeSeason", "seasonEngineBound"]
    ];

    return checks.reduce((problems, [id, marker]) => {
        const element = document.getElementById(id);
        if(element && element.dataset[marker] !== "true"){
            problems.push(`${id} is not bound`);
        }
        return problems;
    }, []);
}

function getTransferInputBindingProblems(){
    return Array.from(document.querySelectorAll("[data-transfer-field]")).reduce((problems, field) => {
        if(field.dataset.transferChangeBound !== "true"){
            problems.push(`${field.id || "transfer field"} change handler missing`);
        }
        if(field.tagName === "INPUT" && field.dataset.transferInputBound !== "true"){
            problems.push(`${field.id || "transfer input"} input handler missing`);
        }
        return problems;
    }, []);
}

function getMenuMediaProblems(){
    const choices = Array.from(document.querySelectorAll("[data-menu-media-source]"));
    if(choices.length !== 7){
        return [`menu media selector contains ${choices.length} choices instead of 7`];
    }

    const expected = ["bastille", "highlow", "move", "music", "shelter", "trailer", "youth"];
    const keys = choices.map(button => button.dataset.menuMediaSource).sort();
    return keys.join(",") === expected.join(",") ? [] : ["menu media choices are invalid"];
}

function getOptionalModuleProblems(){
    if(typeof window.getOptionalModuleState !== "function"){
        return ["optional module state is unavailable"];
    }

    const problems = [];
    const state = window.getOptionalModuleState();
    Object.entries(state)
        .filter(([, value]) => value === "error")
        .forEach(([name]) => problems.push(`${name} optional module previously failed to load`));

    const styleCounts = new Map();
    document.querySelectorAll("link[data-optional-style]").forEach(link => {
        const key = link.dataset.optionalStyle;
        styleCounts.set(key, (styleCounts.get(key) || 0) + 1);
    });
    styleCounts.forEach((count, key) => {
        if(count > 1){ problems.push(`${key} optional stylesheet is duplicated ${count} times`); }
    });

    return problems;
}

function getVisualSystemProblems(){
    const problems = [];
    const theme = document.getElementById("fifa17Theme");

    if(!theme){
        problems.push("FIFA 17-era visual theme stylesheet is missing");
    }else if(!String(theme.getAttribute("href") || "").includes("0.15.1-r1")){
        problems.push("visual theme cache revision is stale");
    }

    if(typeof window.applyClubIdentity !== "function" || typeof window.refreshClubVisualIdentity !== "function"){
        problems.push("original club identity renderer is unavailable");
    }

    return problems;
}

function getLifecycleProblems(){
    const problems = [];
    const activeScreen = typeof getActiveScreenName === "function" ? getActiveScreenName() : null;

    if(
        typeof transferTimerInterval !== "undefined"
        && transferTimerInterval
        && activeScreen !== "transferChallenge"
    ){
        problems.push("transfer timer is running outside Transfer Challenge");
    }

    if(
        typeof leagueWheelSpinInProgress !== "undefined"
        && leagueWheelSpinInProgress
        && activeScreen !== "leagueWheelScreen"
    ){
        problems.push("league wheel operation is active off-screen");
    }

    if(
        typeof clubAssignmentInProgress !== "undefined"
        && clubAssignmentInProgress
        && activeScreen !== "clubWheelScreen"
    ){
        problems.push("club reveal operation is active off-screen");
    }

    if(
        typeof screenHistory !== "undefined"
        && typeof MAX_SCREEN_HISTORY !== "undefined"
        && screenHistory.length > MAX_SCREEN_HISTORY
    ){
        problems.push(`route history exceeded its ${MAX_SCREEN_HISTORY}-entry bound`);
    }

    return problems;
}

function getBundleProblems(){
    const expected = "0.15.1-r1";
    const localAssets = [
        ...document.querySelectorAll("script[src]"),
        ...document.querySelectorAll("link[rel='stylesheet'][href]")
    ];

    return localAssets.reduce((problems, element) => {
        const value = element.getAttribute("src") || element.getAttribute("href") || "";
        if(!/^(?:js|css|data)\//.test(value)){
            return problems;
        }
        if(!value.includes(`v=${expected}`)){
            problems.push(`stale local asset: ${value.split("?")[0]}`);
        }
        return problems;
    }, []);
}

function getVersionProblems(){
    const version = typeof APP_VERSION === "string" ? APP_VERSION : "unknown";
    return version === "0.15.1" ? [] : [`runtime version is ${version}`];
}

function runApplicationDiagnostics(){
    const missingElements = DIAGNOSTIC_REQUIRED_ELEMENTS.filter(id => !document.getElementById(id));
    const missingFunctions = DIAGNOSTIC_REQUIRED_FUNCTIONS.filter(name => typeof window[name] !== "function");
    const bindingProblems = [
        ...getControlBindingProblems(),
        ...getTransferInputBindingProblems(),
        ...getMenuMediaProblems(),
        ...getOptionalModuleProblems(),
        ...getVisualSystemProblems(),
        ...getLifecycleProblems(),
        ...getBundleProblems()
    ];
    const versionProblems = getVersionProblems();
    const storageAvailable = testLocalStorageAvailability();
    const healthy = missingElements.length === 0
        && missingFunctions.length === 0
        && bindingProblems.length === 0
        && versionProblems.length === 0
        && storageAvailable;

    const result = {
        version: typeof APP_VERSION === "string" ? APP_VERSION : "unknown",
        healthy,
        storageAvailable,
        missingElements,
        missingFunctions,
        bindingProblems,
        versionProblems,
        visualThemeLoaded: Boolean(document.getElementById("fifa17Theme")),
        activeScreen: typeof getActiveScreenName === "function" ? getActiveScreenName() : null,
        routeHistoryDepth: typeof screenHistory !== "undefined" ? screenHistory.length : null,
        lazyScreens: ["statistics", "trophyRoom", "legacy", "ruleBook"],
        optionalModules: typeof window.getOptionalModuleState === "function"
            ? window.getOptionalModuleState()
            : null,
        transferFieldsChecked: document.querySelectorAll("[data-transfer-field]").length,
        menuMediaChoicesChecked: document.querySelectorAll("[data-menu-media-source]").length,
        checkedAt: new Date().toISOString()
    };

    window.__careerModeDiagnostics = result;

    if(!healthy){
        const problems = [];
        if(missingElements.length){ problems.push(`missing UI: ${missingElements.join(", ")}`); }
        if(missingFunctions.length){ problems.push(`missing code: ${missingFunctions.join(", ")}`); }
        if(bindingProblems.length){ problems.push(`integrity problems: ${bindingProblems.join(", ")}`); }
        if(versionProblems.length){ problems.push(`version mismatch: ${versionProblems.join(", ")}`); }
        if(!storageAvailable){ problems.push("browser storage unavailable"); }

        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Application integrity check failed", new Error(problems.join("; ")));
        }else{
            console.error("Application integrity check failed:", problems.join("; "));
        }
    }

    return result;
}

window.runApplicationDiagnostics = runApplicationDiagnostics;
