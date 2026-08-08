/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Resilient On-Demand View Module Loader
===================================================== */

const OPTIONAL_ASSET_REVISION = "0.15.1-r1";
const OPTIONAL_LOAD_TIMEOUT_MS = 12000;
const optionalScriptPromises = new Map();
const optionalStylePromises = new Map();
const optionalModuleStates = new Map();
const optionalOpenPromises = new Map();
let optionalModulesInitialized = false;

function optionalAssetUrl(path){
    return `${path}?v=${OPTIONAL_ASSET_REVISION}`;
}

function loadOptionalStyle(key, path){
    if(optionalStylePromises.has(key)){
        return optionalStylePromises.get(key);
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

        const finish = callback => value => {
            if(settled){ return; }
            settled = true;
            cleanup();
            callback(value);
        };

        const handleLoad = finish(resolve);
        const handleError = finish(() => {
            link.remove();
            optionalStylePromises.delete(key);
            reject(new Error(`Unable to load ${path}.`));
        });

        const timeoutId = window.setTimeout(() => {
            if(settled){ return; }
            settled = true;
            link.removeEventListener("load", handleLoad);
            link.removeEventListener("error", handleError);
            link.remove();
            optionalStylePromises.delete(key);
            reject(new Error(`${path} timed out while loading.`));
        }, OPTIONAL_LOAD_TIMEOUT_MS);

        link.addEventListener("load", handleLoad, { once: true });
        link.addEventListener("error", handleError, { once: true });

        if(!existing){
            const theme = document.getElementById("fifa17Theme");
            if(theme && theme.parentNode === document.head){
                document.head.insertBefore(link, theme);
            }else{
                document.head.appendChild(link);
            }
        }
    });

    optionalStylePromises.set(key, promise);
    return promise;
}

function loadOptionalScript(key, path, readinessCheck){
    if(typeof readinessCheck === "function" && readinessCheck()){
        return Promise.resolve(true);
    }

    if(optionalScriptPromises.has(key)){
        return optionalScriptPromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        let settled = false;
        script.src = optionalAssetUrl(path);
        script.async = false;
        script.dataset.optionalScript = key;

        const cleanup = () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
            window.clearTimeout(timeoutId);
        };

        const fail = message => {
            if(settled){ return; }
            settled = true;
            cleanup();
            script.remove();
            optionalScriptPromises.delete(key);
            reject(new Error(message));
        };

        const handleLoad = () => {
            if(settled){ return; }
            if(typeof readinessCheck === "function" && !readinessCheck()){
                fail(`${path} loaded without its expected API.`);
                return;
            }
            settled = true;
            cleanup();
            resolve(true);
        };

        const handleError = () => fail(`Unable to load ${path}.`);
        const timeoutId = window.setTimeout(
            () => fail(`${path} timed out while loading.`),
            OPTIONAL_LOAD_TIMEOUT_MS
        );

        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
        document.head.appendChild(script);
    });

    optionalScriptPromises.set(key, promise);
    return promise;
}

async function ensureAnalyticsEngine(){
    await loadOptionalScript(
        "analytics-engine",
        "js/analytics.js",
        () => typeof window.buildRivalryAnalytics === "function" && typeof window.buildCareerAnalytics === "function"
    );
}

async function ensureStatisticsScript(){
    await ensureAnalyticsEngine();
    await loadOptionalScript(
        "statistics-ui",
        "js/statistics.js",
        () => typeof window.openRivalryStatistics === "function" && typeof window.createAnalyticsStat === "function"
    );
}

async function ensureStatisticsModule(){
    const stylePromise = loadOptionalStyle("analytics-ui", "css/analytics.css");
    await ensureStatisticsScript();
    await stylePromise;
}

async function ensureTrophyRoomModule(){
    const stylePromise = loadOptionalStyle("analytics-ui", "css/analytics.css");
    await ensureStatisticsScript();
    await loadOptionalScript(
        "trophy-room-ui",
        "js/trophyRoom.js",
        () => typeof window.openTrophyRoom === "function"
    );
    await stylePromise;
}

async function ensureLegacyModule(){
    const stylePromise = loadOptionalStyle("legacy-ui", "css/legacy.css");
    await loadOptionalScript(
        "legacy-ui",
        "js/legacy.js",
        () => typeof window.renderLegacy === "function"
    );
    await stylePromise;
}

async function ensureRuleBookModule(){
    const stylePromise = loadOptionalStyle("rule-book-ui", "css/rulebook.css");
    await loadOptionalScript(
        "rule-book-ui",
        "js/ruleBook.js",
        () => typeof window.openRuleBook === "function"
    );
    await stylePromise;
}

function getOptionalModuleButton(name){
    if(name === "statistics"){
        return document.getElementById("rivalryStatisticsButton");
    }
    if(name === "trophyRoom"){
        return document.getElementById("trophyRoomButton");
    }
    if(name === "legacy"){
        return document.getElementById("legacyButton");
    }
    if(name === "ruleBook"){
        return document.getElementById("ruleBookButton");
    }
    return null;
}

function setOptionalModuleBusy(name, busy){
    const button = getOptionalModuleButton(name);
    if(!button){ return; }
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.classList.toggle("isBusy", busy);
}

async function ensureOptionalModule(name){
    if(optionalModuleStates.get(name) === "ready"){
        return true;
    }

    optionalModuleStates.set(name, "loading");
    try{
        if(name === "statistics"){
            await ensureStatisticsModule();
        }else if(name === "trophyRoom"){
            await ensureTrophyRoomModule();
        }else if(name === "legacy"){
            await ensureLegacyModule();
        }else if(name === "ruleBook"){
            await ensureRuleBookModule();
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

function isOptionalOpenContextCurrent(originScreen, originRevision){
    const currentScreen = typeof getActiveScreenName === "function" ? getActiveScreenName() : originScreen;
    const currentRevision = typeof window.getNavigationRevision === "function"
        ? window.getNavigationRevision()
        : originRevision;

    return currentScreen === originScreen && currentRevision === originRevision;
}

function openOptionalModule(name){
    if(optionalOpenPromises.has(name)){
        return optionalOpenPromises.get(name);
    }

    const originScreen = typeof getActiveScreenName === "function" ? getActiveScreenName() : null;
    const originRevision = typeof window.getNavigationRevision === "function"
        ? window.getNavigationRevision()
        : 0;

    const openPromise = (async () => {
        setOptionalModuleBusy(name, true);
        try{
            await ensureOptionalModule(name);

            if(!isOptionalOpenContextCurrent(originScreen, originRevision)){
                return false;
            }

            if(name === "statistics"){
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
            }
            return true;
        }catch(error){
            if(typeof window.reportApplicationError === "function"){
                window.reportApplicationError(`Unable to open ${name}`, error);
            }else{
                console.error(error);
            }
            return false;
        }finally{
            setOptionalModuleBusy(name, false);
        }
    })();

    optionalOpenPromises.set(name, openPromise);
    openPromise.finally(() => {
        if(optionalOpenPromises.get(name) === openPromise){
            optionalOpenPromises.delete(name);
        }
    });
    return openPromise;
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
    if(!button || button.dataset[marker] === "true"){
        return;
    }

    button.dataset[marker] = "true";
    button.addEventListener("click", () => openOptionalModule(moduleName));
}

function initializeOptionalModules(){
    if(optionalModulesInitialized){ return; }

    ensureStatisticsDashboardButtonShell();
    bindOptionalModuleButton(
        document.getElementById("rivalryStatisticsButton"),
        "statistics",
        "statisticsLazyBound"
    );
    bindOptionalModuleButton(
        document.getElementById("trophyRoomButton"),
        "trophyRoom",
        "trophyRoomReady"
    );
    bindOptionalModuleButton(
        document.getElementById("ruleBookButton"),
        "ruleBook",
        "ruleBookBound"
    );

    optionalModulesInitialized = true;
}

function getOptionalModuleState(){
    return {
        statistics: optionalModuleStates.get("statistics") || "idle",
        trophyRoom: optionalModuleStates.get("trophyRoom") || "idle",
        legacy: optionalModuleStates.get("legacy") || "idle",
        ruleBook: optionalModuleStates.get("ruleBook") || "idle"
    };
}

window.initializeOptionalModules = initializeOptionalModules;
window.ensureOptionalModule = ensureOptionalModule;
window.openOptionalModule = openOptionalModule;
window.getOptionalModuleState = getOptionalModuleState;
