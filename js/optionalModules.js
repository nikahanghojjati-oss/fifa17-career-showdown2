/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Unified On-Demand Runtime Module Loader
===================================================== */

function getApplicationAssetRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    const revision = meta && meta.content ? meta.content.trim() : "";
    return revision || "1.0.1-r3";
}

const OPTIONAL_ASSET_REVISION = getApplicationAssetRevision();
const OPTIONAL_LOAD_TIMEOUT_MS = 12000;
const runtimeScriptPromises = new Map();
const runtimeStylePromises = new Map();
const optionalModuleStates = new Map();
let optionalModulesInitialized = false;
let optionalOpenRequestId = 0;
let gameplayRuntimeState = "idle";
let gameplayRuntimePromise = null;
let gameplayRuntimeInitialized = false;

function optionalAssetUrl(path){
    return `${path}?v=${OPTIONAL_ASSET_REVISION}`;
}

function loadRuntimeStyle(key, path){
    if(runtimeStylePromises.has(key)){
        return runtimeStylePromises.get(key);
    }

    const existing = document.querySelector(`link[data-optional-style="${key}"]`);
    if(existing && existing.sheet){
        return Promise.resolve(existing);
    }

    const promise = new Promise((resolve, reject) => {
        const link = existing || document.createElement("link");
        let settled = false;

        if(!existing){
            link.rel = "stylesheet";
            link.href = optionalAssetUrl(path);
            link.dataset.optionalStyle = key;
        }

        const cleanup = () => {
            link.removeEventListener("load", handleLoad);
            link.removeEventListener("error", handleError);
            window.clearTimeout(timeoutId);
        };

        const handleLoad = () => {
            if(settled){ return; }
            settled = true;
            cleanup();
            resolve(link);
        };

        const handleError = () => {
            if(settled){ return; }
            settled = true;
            cleanup();
            link.remove();
            runtimeStylePromises.delete(key);
            reject(new Error(`Unable to load ${path}.`));
        };

        const timeoutId = window.setTimeout(() => {
            if(settled){ return; }
            settled = true;
            link.removeEventListener("load", handleLoad);
            link.removeEventListener("error", handleError);
            link.remove();
            runtimeStylePromises.delete(key);
            reject(new Error(`${path} timed out while loading.`));
        }, OPTIONAL_LOAD_TIMEOUT_MS);

        link.addEventListener("load", handleLoad, { once: true });
        link.addEventListener("error", handleError, { once: true });

        if(!existing){
            const appStyles = document.getElementById("appStyles");
            if(appStyles && appStyles.parentNode === document.head){
                document.head.insertBefore(link, appStyles);
            }else{
                document.head.appendChild(link);
            }
        }
    });

    runtimeStylePromises.set(key, promise);
    return promise;
}

function loadRuntimeScript(key, path, readinessCheck){
    if(typeof readinessCheck === "function" && readinessCheck()){
        return Promise.resolve(true);
    }

    if(runtimeScriptPromises.has(key)){
        return runtimeScriptPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        let settled = false;
        script.src = optionalAssetUrl(path);
        script.async = false;
        script.dataset.runtimeScript = key;

        const cleanup = () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
            window.clearTimeout(timeoutId);
        };

        const failRetryable = message => {
            if(settled){ return; }
            settled = true;
            cleanup();
            script.remove();
            runtimeScriptPromises.delete(key);
            reject(new Error(message));
        };

        const failExecuted = message => {
            if(settled){ return; }
            settled = true;
            cleanup();
            reject(new Error(message));
        };

        const handleLoad = () => {
            if(settled){ return; }
            if(typeof readinessCheck === "function" && !readinessCheck()){
                failExecuted(`${path} loaded but did not expose its expected API. Refresh before retrying this module.`);
                return;
            }
            settled = true;
            cleanup();
            resolve(true);
        };

        const handleError = () => failRetryable(`Unable to load ${path}.`);
        const timeoutId = window.setTimeout(
            () => failRetryable(`${path} timed out while loading.`),
            OPTIONAL_LOAD_TIMEOUT_MS
        );

        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
        document.head.appendChild(script);
    });

    runtimeScriptPromises.set(key, promise);
    return promise;
}

function initializeGameplayRuntime(){
    if(gameplayRuntimeInitialized){ return; }

    const initializers = [
        ["initializeShowdownUI", window.initializeShowdownUI],
        ["initializeLeagueWheel", window.initializeLeagueWheel],
        ["initializeClubAssignment", window.initializeClubAssignment],
        ["initializeTransferChallenge", window.initializeTransferChallenge],
        ["initializeSeasonEngine", window.initializeSeasonEngine]
    ];

    initializers.forEach(([name, initializer]) => {
        if(typeof initializer !== "function"){
            throw new Error(`Gameplay initializer is unavailable: ${name}`);
        }
        initializer();
    });

    gameplayRuntimeInitialized = true;
}

async function loadGameplayRuntimeFiles(){
    await loadRuntimeScript(
        "league-data",
        "data/leagues.js",
        () => typeof leagues !== "undefined" && Array.isArray(leagues)
    );
    await loadRuntimeScript(
        "club-data",
        "data/clubs.js",
        () => typeof window.getClubsForLeague === "function" && typeof window.getRandomClubPair === "function"
    );
    await loadRuntimeScript(
        "data-engine",
        "js/dataEngine.js",
        () => typeof window.getRandomLeague === "function"
    );
    await loadRuntimeScript(
        "visual-identity",
        "js/visualIdentity.js",
        () => typeof window.applyClubIdentity === "function" && typeof window.refreshClubVisualIdentity === "function"
    );
    await ensureFootballVisualModule();
    await loadRuntimeScript(
        "showdown-ui",
        "js/showdownUI.js",
        () => typeof window.initializeShowdownUI === "function" && typeof window.updateShowdownUI === "function"
    );
    await loadRuntimeScript(
        "league-wheel",
        "js/leagueWheel.js",
        () => typeof window.initializeLeagueWheel === "function" && typeof window.spinLeagueWheel === "function"
    );
    await loadRuntimeScript(
        "club-assignment",
        "js/clubAssignment.js",
        () => typeof window.initializeClubAssignment === "function" && typeof window.prepareClubAssignment === "function"
    );

    const transferStylePromise = loadRuntimeStyle("transfer-ui", "css/transfer.css");
    await loadRuntimeScript(
        "transfer-options",
        "data/transferOptions.js",
        () => Array.isArray(window.FIFA17_TRANSFER_LEAGUES)
            && window.FIFA17_TRANSFER_LEAGUES.length === 36
            && Array.isArray(window.FIFA17_TRANSFER_NATIONALITIES)
            && window.FIFA17_TRANSFER_NATIONALITIES.length === 164
    );
    await loadRuntimeScript(
        "transfer-selector",
        "js/transferSelector.js",
        () => typeof window.enhanceTransferSelector === "function"
            && typeof window.getTransferSelectorCanonicalValue === "function"
    );
    await transferStylePromise;
    await loadRuntimeScript(
        "transfer-challenge",
        "js/transferChallenge.js",
        () => typeof window.initializeTransferChallenge === "function"
            && typeof window.openTransferChallenge === "function"
            && typeof window.normalizeTransferChallengePhase === "function"
    );

    const seasonStylePromise = loadRuntimeStyle("season-review-ui", "css/season.css");
    await loadRuntimeScript(
        "season-engine",
        "js/seasonEngine.js",
        () => typeof window.initializeSeasonEngine === "function"
            && typeof window.openSeasonEntry === "function"
            && typeof window.confirmCurrentSeason === "function"
            && typeof window.getSeasonReviewIntegrity === "function"
    );
    await seasonStylePromise;
}

function ensureGameplayModules(){
    if(gameplayRuntimeState === "ready"){
        return Promise.resolve(true);
    }
    if(gameplayRuntimePromise){
        return gameplayRuntimePromise;
    }

    gameplayRuntimeState = "loading";
    gameplayRuntimePromise = (async () => {
        try{
            await loadGameplayRuntimeFiles();
            initializeGameplayRuntime();
            gameplayRuntimeState = "ready";
            return true;
        }catch(error){
            gameplayRuntimeState = "error";
            throw error;
        }finally{
            gameplayRuntimePromise = null;
        }
    })();

    return gameplayRuntimePromise;
}

function getGameplayModuleState(){
    return gameplayRuntimeState;
}

async function ensureDiagnosticsModule(){
    await loadRuntimeScript(
        "diagnostics",
        "js/diagnostics.js",
        () => typeof window.runApplicationDiagnostics === "function"
    );
    return true;
}

function ensureMenuFeedbackModule(){
    return loadRuntimeScript(
        "menu-feedback",
        "js/menuFeedback.js",
        () => typeof window.playMenuFeedbackCue === "function"
            && typeof window.getMenuFeedbackDiagnostics === "function"
    );
}

async function ensureFootballVisualModule(){
    const stylePromise = loadRuntimeStyle("football-visual-ui", "css/footballVisuals.css");
    await loadRuntimeScript(
        "football-visual-data",
        "data/footballVisuals.js",
        () => Boolean(window.FOOTBALL_VISUALS && window.FOOTBALL_VISUAL_SCREEN_PLAN)
    );
    await loadRuntimeScript(
        "football-visual-ui",
        "js/footballVisuals.js",
        () => typeof window.initializeFootballVisuals === "function"
            && typeof window.prepareFootballVisualScreen === "function"
    );
    await stylePromise;
    window.initializeFootballVisuals();
    return true;
}

async function ensureAnalyticsEngine(){
    await loadRuntimeScript(
        "analytics-engine",
        "js/analytics.js",
        () => typeof window.buildRivalryAnalytics === "function" && typeof window.buildCareerAnalytics === "function"
    );
}

async function ensureStatisticsScript(){
    await ensureAnalyticsEngine();
    await loadRuntimeScript(
        "statistics-ui",
        "js/statistics.js",
        () => typeof window.openRivalryStatistics === "function"
            && typeof window.openCareerStatistics === "function"
            && typeof window.createAnalyticsStat === "function"
    );
}

async function ensureStatisticsModule(){
    const stylePromise = loadRuntimeStyle("analytics-ui", "css/analytics.css");
    const visualPromise = ensureFootballVisualModule();
    await ensureStatisticsScript();
    await Promise.all([stylePromise, visualPromise]);
}

async function ensureTrophyRoomModule(){
    const stylePromise = loadRuntimeStyle("analytics-ui", "css/analytics.css");
    const visualPromise = ensureFootballVisualModule();
    await ensureStatisticsScript();
    await loadRuntimeScript(
        "trophy-room-ui",
        "js/trophyRoom.js",
        () => typeof window.openTrophyRoom === "function"
    );
    await Promise.all([stylePromise, visualPromise]);
}

async function ensureLegacyModule(){
    const stylePromise = loadRuntimeStyle("legacy-ui", "css/legacy.css");
    await loadRuntimeScript(
        "legacy-ui",
        "js/legacy.js",
        () => typeof window.renderLegacy === "function"
    );
    await stylePromise;
}

async function ensureRuleBookModule(){
    const stylePromise = loadRuntimeStyle("rule-book-ui", "css/rulebook.css");
    await loadRuntimeScript(
        "rule-book-ui",
        "js/ruleBook.js",
        () => typeof window.openRuleBook === "function"
    );
    await stylePromise;
}

async function ensureSettingsModule(){
    const stylePromise = loadRuntimeStyle("settings-ui", "css/settings.css");
    await loadRuntimeScript(
        "settings-ui",
        "js/settings.js",
        () => typeof window.initializeSettings === "function" && typeof window.openSettings === "function"
    );
    await stylePromise;
    window.initializeSettings();
}

function getOptionalModuleButton(name){
    if(name === "careerStatistics"){ return document.getElementById("careerStatisticsButton"); }
    if(name === "statistics"){ return document.getElementById("rivalryStatisticsButton"); }
    if(name === "trophyRoom"){
        return document.getElementById("careerStatisticsTrophyButton");
    }
    if(name === "legacy"){ return document.getElementById("legacyButton"); }
    if(name === "ruleBook"){ return document.getElementById("ruleBookButton"); }
    if(name === "settings"){ return document.getElementById("settingsButton"); }
    return null;
}

function setOptionalModuleBusy(name, busy){
    const button = getOptionalModuleButton(name);
    if(!button){ return; }
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.classList.toggle("isBusy", busy);
}

async function ensureOptionalModule(name){
    if(optionalModuleStates.get(name) === "ready"){ return true; }

    optionalModuleStates.set(name, "loading");
    try{
        if(name === "careerStatistics" || name === "statistics"){
            await ensureStatisticsModule();
        }else if(name === "trophyRoom"){
            await ensureTrophyRoomModule();
        }else if(name === "legacy"){
            await ensureLegacyModule();
        }else if(name === "ruleBook"){
            await ensureRuleBookModule();
        }else if(name === "settings"){
            await ensureSettingsModule();
        }else{
            throw new Error(`Unknown optional module: ${name}`);
        }
        optionalModuleStates.set(name, "ready");
        return true;
    }catch(error){
        optionalModuleStates.set(name, "error");
        throw error;
    }
}

function isOptionalOpenContextCurrent(originScreen, originRevision, requestId){
    const currentScreen = typeof window.getActiveScreenName === "function"
        ? window.getActiveScreenName()
        : originScreen;
    const currentRevision = typeof window.getNavigationRevision === "function"
        ? window.getNavigationRevision()
        : originRevision;

    return requestId === optionalOpenRequestId
        && currentScreen === originScreen
        && currentRevision === originRevision;
}

async function openOptionalModule(name){
    const requestId = ++optionalOpenRequestId;
    const originScreen = typeof window.getActiveScreenName === "function"
        ? window.getActiveScreenName()
        : null;
    const originRevision = typeof window.getNavigationRevision === "function"
        ? window.getNavigationRevision()
        : 0;

    setOptionalModuleBusy(name, true);
    try{
        await ensureOptionalModule(name);
        if(!isOptionalOpenContextCurrent(originScreen, originRevision, requestId)){ return false; }

        if(name === "careerStatistics"){
            window.openCareerStatistics();
        }else if(name === "statistics"){
            if(!currentShowdown){
                if(typeof window.showAppNotice === "function"){
                    window.showAppNotice("No active showdown is available for Rivalry Statistics.", "error");
                }
                return false;
            }
            window.openRivalryStatistics();
        }else if(name === "trophyRoom"){
            window.openTrophyRoom();
        }else if(name === "legacy"){
            showScreen("legacy");
        }else if(name === "ruleBook"){
            window.openRuleBook();
        }else if(name === "settings"){
            window.openSettings();
        }
        return true;
    }catch(error){
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError(`Unable to open ${name}`, error);
        }else{ console.error(error); }
        return false;
    }finally{
        setOptionalModuleBusy(name, false);
    }
}

function ensureStatisticsDashboardButtonShell(){
    if(document.getElementById("rivalryStatisticsButton")){ return; }
    const actions = document.querySelector("#dashboard .dashboardActions");
    if(!actions){ return; }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "rivalryStatisticsButton";
    button.className = "menuButton";
    button.textContent = "RIVALRY STATISTICS";

    const deleteButton = document.getElementById("deleteActiveShowdown");
    if(deleteButton){ actions.insertBefore(button, deleteButton); }
    else { actions.appendChild(button); }
}

function bindOptionalModuleButton(button, moduleName, marker){
    if(!button || button.dataset[marker] === "true"){ return; }
    button.dataset[marker] = "true";
    button.addEventListener("click", () => openOptionalModule(moduleName));
}

function initializeOptionalModules(){
    if(optionalModulesInitialized){ return; }

    ensureStatisticsDashboardButtonShell();
    bindOptionalModuleButton(document.getElementById("careerStatisticsButton"), "careerStatistics", "careerStatisticsBound");
    bindOptionalModuleButton(document.getElementById("rivalryStatisticsButton"), "statistics", "statisticsLazyBound");
    bindOptionalModuleButton(document.getElementById("ruleBookButton"), "ruleBook", "ruleBookBound");
    bindOptionalModuleButton(document.getElementById("settingsButton"), "settings", "settingsBound");

    optionalModulesInitialized = true;
}

function getOptionalModuleState(){
    return {
        careerStatistics: optionalModuleStates.get("careerStatistics") || "idle",
        statistics: optionalModuleStates.get("statistics") || "idle",
        trophyRoom: optionalModuleStates.get("trophyRoom") || "idle",
        legacy: optionalModuleStates.get("legacy") || "idle",
        ruleBook: optionalModuleStates.get("ruleBook") || "idle",
        settings: optionalModuleStates.get("settings") || "idle"
    };
}

window.initializeOptionalModules = initializeOptionalModules;
window.ensureGameplayModules = ensureGameplayModules;
window.getGameplayModuleState = getGameplayModuleState;
window.ensureDiagnosticsModule = ensureDiagnosticsModule;
window.ensureMenuFeedbackModule = ensureMenuFeedbackModule;
window.ensureFootballVisualModule = ensureFootballVisualModule;
window.ensureOptionalModule = ensureOptionalModule;
window.openOptionalModule = openOptionalModule;
window.getOptionalModuleState = getOptionalModuleState;
