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
    "legacy",
    "newShowdown",
    "continueCareer",
    "legacyButton",
    "startShowdown",
    "spinLeague",
    "openClubPack",
    "seasonPrimaryAction",
    "completeTransferChallenge",
    "completeSeason"
];

const DIAGNOSTIC_REQUIRED_FUNCTIONS = [
    "showScreen",
    "createShowdown",
    "normalizeShowdown",
    "saveCurrentShowdown",
    "spinLeagueWheel",
    "prepareClubAssignment",
    "assignClubs",
    "openTransferChallenge",
    "completeTransferChallenge",
    "openSeasonEntry",
    "completeCurrentSeason",
    "calculatePlayerSeasonScore"
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

function runApplicationDiagnostics(){
    const missingElements = DIAGNOSTIC_REQUIRED_ELEMENTS.filter(
        id => !document.getElementById(id)
    );

    const missingFunctions = DIAGNOSTIC_REQUIRED_FUNCTIONS.filter(
        name => typeof window[name] !== "function"
    );

    const storageAvailable = testLocalStorageAvailability();
    const healthy = missingElements.length === 0
        && missingFunctions.length === 0
        && storageAvailable;

    const result = {
        version: typeof APP_VERSION === "string" ? APP_VERSION : "unknown",
        healthy,
        storageAvailable,
        missingElements,
        missingFunctions,
        checkedAt: new Date().toISOString()
    };

    window.__careerModeDiagnostics = result;

    if(!healthy){
        const problems = [];
        if(missingElements.length){ problems.push(`missing UI: ${missingElements.join(", ")}`); }
        if(missingFunctions.length){ problems.push(`missing code: ${missingFunctions.join(", ")}`); }
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
