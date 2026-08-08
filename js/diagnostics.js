/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.11.0
   Runtime Diagnostics
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
    "statistics",
    "trophyRoom",
    "legacy",
    "ruleBook",
    "newShowdown",
    "continueCareer",
    "legacyButton",
    "trophyRoomButton",
    "ruleBookButton",
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
    "spinLeagueWheel",
    "prepareClubAssignment",
    "assignClubs",
    "openTransferChallenge",
    "completeTransferChallenge",
    "openSeasonEntry",
    "completeCurrentSeason",
    "calculatePlayerSeasonScore",
    "renderRivalryStatistics",
    "renderTrophyRoom",
    "renderLegacy",
    "openRuleBook"
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
        ["startShowdown", "showdownUiBound"],
        ["spinLeague", "leagueWheelBound"],
        ["openClubPack", "clubAssignmentBound"],
        ["continueClubAssignment", "clubAssignmentBound"],
        ["seasonPrimaryAction", "transferPrimaryBound"],
        ["completeTransferChallenge", "transferCompleteBound"],
        ["completeSeason", "seasonEngineBound"],
        ["ruleBookButton", "ruleBookBound"]
    ];

    return checks.reduce((problems, [id, marker]) => {
        const element = document.getElementById(id);
        if(element && element.dataset[marker] !== "true"){
            problems.push(`${id} is not bound`);
        }
        return problems;
    }, []);
}

function runApplicationDiagnostics(){
    const missingElements = DIAGNOSTIC_REQUIRED_ELEMENTS.filter(
        id => !document.getElementById(id)
    );

    const missingFunctions = DIAGNOSTIC_REQUIRED_FUNCTIONS.filter(
        name => typeof window[name] !== "function"
    );

    const bindingProblems = getControlBindingProblems();
    const storageAvailable = testLocalStorageAvailability();
    const healthy = missingElements.length === 0
        && missingFunctions.length === 0
        && bindingProblems.length === 0
        && storageAvailable;

    const result = {
        version: typeof APP_VERSION === "string" ? APP_VERSION : "unknown",
        healthy,
        storageAvailable,
        missingElements,
        missingFunctions,
        bindingProblems,
        checkedAt: new Date().toISOString()
    };

    window.__careerModeDiagnostics = result;

    if(!healthy){
        const problems = [];
        if(missingElements.length){ problems.push(`missing UI: ${missingElements.join(", ")}`); }
        if(missingFunctions.length){ problems.push(`missing code: ${missingFunctions.join(", ")}`); }
        if(bindingProblems.length){ problems.push(`unbound controls: ${bindingProblems.join(", ")}`); }
        if(!storageAvailable){ problems.push("browser storage unavailable"); }

        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError(
                "Application integrity check failed",
                new Error(problems.join("; "))
            );
        }else{
            console.error("Application integrity check failed:", problems.join("; "));
        }
    }

    return result;
}

window.runApplicationDiagnostics = runApplicationDiagnostics;
