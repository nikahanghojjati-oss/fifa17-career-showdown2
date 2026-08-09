/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0
   Lazy-Runtime Diagnostics and Navigation Integrity
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

const CORE_REQUIRED_FUNCTIONS = [
    "showScreen",
    "navigateTo",
    "navigateBackSmart",
    "resolveCanonicalShowdownRoute",
    "getNavigationDiagnostics",
    "normalizeShowdown",
    "saveCurrentShowdown",
    "initializeStorageLifecycle",
    "flushPendingApplicationWrites",
    "initializeMenuExperience",
    "refreshMainMenuExperience",
    "selectMenuMedia",
    "handleMainMenuExit",
    "initializeOptionalModules",
    "ensureGameplayModules",
    "getGameplayModuleState",
    "ensureOptionalModule",
    "openOptionalModule",
    "getOptionalModuleState",
    "initializePerformanceLifecycle"
];

const GAMEPLAY_REQUIRED_FUNCTIONS = [
    "getClubPairIntegrity",
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
    "applyClubIdentity",
    "refreshClubVisualIdentity",
    "updateShowdownUI"
];

function getExpectedAssetRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "";
}

function getExpectedRuntimeVersion(){
    const revision = getExpectedAssetRevision();
    if(!revision){ return ""; }
    const separatorIndex = revision.indexOf("-");
    return separatorIndex >= 0 ? revision.slice(0, separatorIndex) : revision;
}

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

function getGameplayState(){
    return typeof window.getGameplayModuleState === "function"
        ? window.getGameplayModuleState()
        : "unavailable";
}

function getControlBindingProblems(gameplayReady){
    const checks = [
        ["newShowdown", "navigationBound"],
        ["continueCareer", "navigationBound"],
        ["legacyButton", "navigationBound"],
        ["trophyRoomButton", "trophyRoomReady"],
        ["ruleBookButton", "ruleBookBound"],
        ["rivalryStatisticsButton", "statisticsLazyBound"],
        ["menuMusicToggle", "musicBound"],
        ["menuMusicMute", "musicBound"],
        ["startShowdown", "navigationBound"]
    ];

    if(gameplayReady){
        checks.push(
            ["spinLeague", "leagueWheelBound"],
            ["openClubPack", "clubAssignmentBound"],
            ["continueClubAssignment", "clubAssignmentBound"],
            ["seasonPrimaryAction", "transferPrimaryBound"],
            ["completeTransferChallenge", "transferCompleteBound"],
            ["completeSeason", "seasonEngineBound"]
        );
    }

    return checks.reduce((problems, [id, marker]) => {
        const element = document.getElementById(id);
        if(element && element.dataset[marker] !== "true"){
            problems.push(`${id} is not bound`);
        }
        return problems;
    }, []);
}

function getTransferInputBindingProblems(gameplayReady){
    if(!gameplayReady){ return []; }

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
    const styles = document.getElementById("appStyles");
    if(!styles){
        return ["unified application stylesheet is missing"];
    }

    const expected = getExpectedAssetRevision();
    if(!expected){
        return ["application asset revision metadata is missing"];
    }

    const href = String(styles.getAttribute("href") || "");
    return href.includes("css/app.css") && href.includes(`v=${expected}`)
        ? []
        : ["unified application stylesheet revision is stale"];
}

function getLifecycleProblems(gameplayReady){
    if(!gameplayReady){ return []; }

    const problems = [];
    const activeScreen = typeof window.getActiveScreenName === "function"
        ? window.getActiveScreenName()
        : null;

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

    return problems;
}

function getNavigationProblems(){
    if(typeof window.getNavigationDiagnostics !== "function"){
        return ["smart navigation diagnostics are unavailable"];
    }

    const navigation = window.getNavigationDiagnostics();
    const problems = [];
    if(Number(navigation.historyLength) > 18){
        problems.push(`route history exceeded its 18-entry bound (${navigation.historyLength})`);
    }
    if(!navigation.activeScreen){
        problems.push("no active application screen is visible");
    }
    if(navigation.backAuthority !== "centralized"){
        problems.push("Back navigation authority is not centralized");
    }
    return problems;
}

function getBundleProblems(){
    const expected = getExpectedAssetRevision();
    if(!expected){
        return ["application asset revision metadata is missing"];
    }

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
    const expected = getExpectedRuntimeVersion();
    if(!expected){
        return ["runtime version expectation is unavailable"];
    }
    return version === expected ? [] : [`runtime version is ${version}; expected ${expected}`];
}

function runApplicationDiagnostics(){
    const gameplayState = getGameplayState();
    const gameplayReady = gameplayState === "ready";
    const requiredFunctions = gameplayReady
        ? CORE_REQUIRED_FUNCTIONS.concat(GAMEPLAY_REQUIRED_FUNCTIONS)
        : CORE_REQUIRED_FUNCTIONS;

    const missingElements = DIAGNOSTIC_REQUIRED_ELEMENTS.filter(id => !document.getElementById(id));
    const missingFunctions = requiredFunctions.filter(name => typeof window[name] !== "function");
    const bindingProblems = [
        ...getControlBindingProblems(gameplayReady),
        ...getTransferInputBindingProblems(gameplayReady),
        ...getMenuMediaProblems(),
        ...getOptionalModuleProblems(),
        ...getVisualSystemProblems(),
        ...getLifecycleProblems(gameplayReady),
        ...getNavigationProblems(),
        ...getBundleProblems()
    ];
    const versionProblems = getVersionProblems();
    const storageAvailable = testLocalStorageAvailability();
    const healthy = missingElements.length === 0
        && missingFunctions.length === 0
        && bindingProblems.length === 0
        && versionProblems.length === 0
        && storageAvailable
        && gameplayState !== "error";

    const result = {
        version: typeof APP_VERSION === "string" ? APP_VERSION : "unknown",
        assetRevision: getExpectedAssetRevision() || "missing",
        expectedVersion: getExpectedRuntimeVersion() || "missing",
        healthy,
        storageAvailable,
        gameplayState,
        missingElements,
        missingFunctions,
        bindingProblems,
        versionProblems,
        unifiedStylesLoaded: Boolean(document.getElementById("appStyles")),
        navigation: typeof window.getNavigationDiagnostics === "function"
            ? window.getNavigationDiagnostics()
            : null,
        lazyScreens: ["statistics", "trophyRoom", "legacy", "ruleBook"],
        optionalModules: typeof window.getOptionalModuleState === "function"
            ? window.getOptionalModuleState()
            : null,
        transferFieldsChecked: gameplayReady
            ? document.querySelectorAll("[data-transfer-field]").length
            : 0,
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
        if(gameplayState === "error"){ problems.push("gameplay runtime previously failed to load"); }
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
