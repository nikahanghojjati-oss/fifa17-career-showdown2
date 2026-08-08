/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.14.1
   Runtime Diagnostics and Performance Integrity
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
    "getClubPairIntegrity",
    "saveCurrentShowdown",
    "initializeStorageLifecycle",
    "flushPendingApplicationWrites",
    "flushTransferDraftSave",
    "spinLeagueWheel",
    "prepareClubAssignment",
    "assignClubs",
    "openTransferChallenge",
    "completeTransferChallenge",
    "openSeasonEntry",
    "completeCurrentSeason",
    "calculatePlayerSeasonScore",
    "renderLegacy",
    "initializeMenuExperience",
    "refreshMainMenuExperience",
    "selectMenuMedia",
    "handleMainMenuExit",
    "initializeOptionalModules",
    "ensureOptionalModule",
    "openOptionalModule",
    "getOptionalModuleState",
    "initializePerformanceLifecycle"
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

    const state = window.getOptionalModuleState();
    return Object.entries(state)
        .filter(([, value]) => value === "error")
        .map(([name]) => `${name} optional module previously failed to load`);
}

function getVersionProblems(){
    const version = typeof APP_VERSION === "string" ? APP_VERSION : "unknown";
    return version === "0.14.1" ? [] : [`runtime version is ${version}`];
}

function runApplicationDiagnostics(){
    const missingElements = DIAGNOSTIC_REQUIRED_ELEMENTS.filter(id => !document.getElementById(id));
    const missingFunctions = DIAGNOSTIC_REQUIRED_FUNCTIONS.filter(name => typeof window[name] !== "function");
    const bindingProblems = [
        ...getControlBindingProblems(),
        ...getTransferInputBindingProblems(),
        ...getMenuMediaProblems(),
        ...getOptionalModuleProblems()
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
        lazyScreens: ["statistics", "trophyRoom", "ruleBook"],
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
        if(bindingProblems.length){ problems.push(`unbound controls: ${bindingProblems.join(", ")}`); }
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
