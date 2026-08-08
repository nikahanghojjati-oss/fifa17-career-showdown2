/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.14.1
   On-Demand View Module Loader
===================================================== */

const OPTIONAL_ASSET_REVISION = "0.14.1-r1";
const optionalScriptPromises = new Map();
const optionalStylePromises = new Map();
const optionalModuleStates = new Map();
let optionalModulesInitialized = false;

function optionalAssetUrl(path){
    return `${path}?v=${OPTIONAL_ASSET_REVISION}`;
}

function loadOptionalStyle(key, path){
    const existing = document.querySelector(`link[data-optional-style="${key}"]`);
    if(existing){
        return Promise.resolve(existing);
    }

    if(optionalStylePromises.has(key)){
        return optionalStylePromises.get(key);
    }

    const promise = new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = optionalAssetUrl(path);
        link.dataset.optionalStyle = key;
        link.addEventListener("load", () => resolve(link), { once: true });
        link.addEventListener("error", () => {
            link.remove();
            optionalStylePromises.delete(key);
            reject(new Error(`Unable to load ${path}.`));
        }, { once: true });
        document.head.appendChild(link);
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
        script.src = optionalAssetUrl(path);
        script.async = false;
        script.dataset.optionalScript = key;
        script.addEventListener("load", () => {
            if(typeof readinessCheck === "function" && !readinessCheck()){
                script.remove();
                optionalScriptPromises.delete(key);
                reject(new Error(`${path} loaded without its expected API.`));
                return;
            }
            resolve(true);
        }, { once: true });
        script.addEventListener("error", () => {
            script.remove();
            optionalScriptPromises.delete(key);
            reject(new Error(`Unable to load ${path}.`));
        }, { once: true });
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

async function openOptionalModule(name){
    setOptionalModuleBusy(name, true);
    try{
        await ensureOptionalModule(name);

        if(name === "statistics"){
            if(!currentShowdown){
                if(typeof window.showAppNotice === "function"){
                    window.showAppNotice("No active showdown is available for Rivalry Statistics.", "error");
                }
                return;
            }
            window.openRivalryStatistics();
        }else if(name === "trophyRoom"){
            window.openTrophyRoom();
        }else if(name === "ruleBook"){
            window.openRuleBook();
        }
    }catch(error){
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError(`Unable to open ${name}`, error);
        }else{
            console.error(error);
        }
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
        ruleBook: optionalModuleStates.get("ruleBook") || "idle"
    };
}

window.initializeOptionalModules = initializeOptionalModules;
window.ensureOptionalModule = ensureOptionalModule;
window.openOptionalModule = openOptionalModule;
window.getOptionalModuleState = getOptionalModuleState;
