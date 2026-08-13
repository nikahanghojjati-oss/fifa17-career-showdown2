const OFFLINE_APP_REVISION = (() => {
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "1.1.5-r1";
})();
const OFFLINE_MESSAGE_TIMEOUT_MS = 4500;
const SAFE_UPDATE_SCREENS = new Set(["mainMenu", "dashboard"]);

let offlineRegistration = null;
let deferredInstallPrompt = window.__cmsDeferredInstallPrompt || null;
let activationRequested = false;
let controllerReloaded = false;
let offlineUI = null;
let installPromptCaptured = Boolean(deferredInstallPrompt);
let installedStandalone = false;
let offlineReady = false;
let lastCacheStatus = null;
let menuMediaStatusBeforeOffline = "";

function isStandaloneDisplay(){
    return Boolean(
        (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches)
        || navigator.standalone === true
    );
}

function isServiceWorkerSupported(){
    return "serviceWorker" in navigator;
}

function getActiveApplicationScreen(){
    return typeof window.getActiveScreenName === "function"
        ? window.getActiveScreenName()
        : document.querySelector(".screen:not(.hidden)")?.id || "";
}

function getUpdateBoundaryStatus(){
    const screen = getActiveApplicationScreen();
    const recoveryBusy = Boolean(document.querySelector('[data-transaction-busy="true"],[data-critical-recovery="true"]'));
    const uiBusy = Boolean(document.querySelector('[aria-busy="true"]:not(#loadingScreen):not(#offlineAppRail)'));
    return {
        safe: SAFE_UPDATE_SCREENS.has(screen) && !recoveryBusy && !uiBusy,
        screen,
        recoveryBusy,
        uiBusy
    };
}

function versionedLocalUrl(path){
    const url = new URL(path, window.location.href);
    url.searchParams.set("v", OFFLINE_APP_REVISION);
    return url.href;
}

function ensureOfflineStyles(){
    if(document.querySelector('link[data-offline-app-style="true"]')){ return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = versionedLocalUrl("css/offline.css");
    link.dataset.offlineAppStyle = "true";
    link.addEventListener("error", () => {
        console.warn("[Career Mode Showdown] Offline status styling could not be loaded.");
    }, { once: true });
    document.head.appendChild(link);
}

function ensureOfflineUI(){
    if(offlineUI){ return offlineUI; }

    const rail = document.createElement("div");
    rail.id = "offlineAppRail";
    rail.className = "offlineAppRail";
    rail.setAttribute("role", "region");
    rail.setAttribute("aria-label", "Install and offline application status");

    const state = document.createElement("span");
    state.className = "offlineAppState";
    state.id = "offlineAppState";
    state.setAttribute("role", "status");
    state.setAttribute("aria-live", "polite");

    const install = document.createElement("button");
    install.type = "button";
    install.className = "offlineAppAction";
    install.id = "offlineInstallAction";
    install.textContent = "INSTALL INFO";

    const update = document.createElement("button");
    update.type = "button";
    update.className = "offlineAppAction offlineAppUpdate";
    update.id = "offlineUpdateAction";
    update.textContent = "UPDATE READY";
    update.hidden = true;

    rail.append(state, install, update);

    const panel = document.createElement("section");
    panel.id = "offlineAppPanel";
    panel.className = "offlineAppPanel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "offlineAppPanelTitle");

    const heading = document.createElement("h2");
    heading.id = "offlineAppPanelTitle";
    heading.textContent = "INSTALL SHOWDOWN 17";

    const copy = document.createElement("p");
    copy.id = "offlineAppPanelCopy";

    const actions = document.createElement("div");
    actions.className = "offlineAppPanelActions";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "offlineAppAction";
    close.textContent = "CLOSE";
    close.addEventListener("click", () => {
        panel.hidden = true;
        if(!install.hidden){ install.focus(); }
    });

    actions.append(close);
    panel.append(heading, copy, actions);
    document.body.append(rail, panel);

    install.addEventListener("click", handleInstallAction);
    update.addEventListener("click", activateWaitingUpdate);

    offlineUI = { rail, state, install, update, panel, heading, copy, actions, close };
    return offlineUI;
}

function getInstallGuidance(){
    const ua = navigator.userAgent || "";
    const isiOS = /iPad|iPhone|iPod/i.test(ua)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if(isiOS){
        return "In Safari, use Share, then Add to Home Screen. Your tracker stays on this device and can reopen its cached application shell offline.";
    }
    if(/Android|CrOS/i.test(ua)){
        return "Use Install app from the browser address bar or menu when offered. Career Mode Showdown keeps its tracker data local to this device.";
    }
    return "Use your browser's Install app or Add to Home Screen command when available. Installation support and menu wording vary by browser.";
}

function refreshRailVisibility(){
    const ui = ensureOfflineUI();
    const shouldHide = installedStandalone
        && navigator.onLine !== false
        && !offlineRegistration?.waiting;
    ui.rail.hidden = shouldHide;
}

function refreshInstallAction(){
    const ui = ensureOfflineUI();
    installedStandalone = isStandaloneDisplay();
    if(installedStandalone){
        ui.install.hidden = true;
        ui.panel.hidden = true;
        refreshRailVisibility();
        return;
    }
    ui.install.hidden = false;
    ui.install.textContent = deferredInstallPrompt && navigator.onLine !== false ? "INSTALL APP" : "INSTALL INFO";
    refreshRailVisibility();
}

async function handleInstallAction(){
    const ui = ensureOfflineUI();
    if(deferredInstallPrompt && navigator.onLine !== false){
        const prompt = deferredInstallPrompt;
        deferredInstallPrompt = null;
        refreshInstallAction();
        try{
            await prompt.prompt();
            await prompt.userChoice;
        }catch(error){
            window.reportApplicationError?.("The browser install prompt could not be opened", error);
        }
        return;
    }

    ui.heading.textContent = "INSTALL SHOWDOWN 17";
    ui.copy.textContent = getInstallGuidance();
    ui.panel.hidden = false;
    ui.close.focus();
}

function setMenuMediaOfflineState(offline){
    const toggle = document.getElementById("menuMusicToggle");
    const status = document.getElementById("menuMusicStatus");

    if(offline){
        try{
            if(window.isMenuMediaPlaying?.() && toggle && !toggle.disabled){
                toggle.click();
            }
        }catch(error){
            console.warn("[Career Mode Showdown] External media could not be paused while entering offline mode:", error);
        }
        if(status){
            menuMediaStatusBeforeOffline = status.textContent || menuMediaStatusBeforeOffline;
            status.textContent = "OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION";
        }
        if(toggle){
            toggle.disabled = true;
            toggle.setAttribute("aria-disabled", "true");
        }
        return;
    }

    if(toggle){
        toggle.disabled = false;
        toggle.removeAttribute("aria-disabled");
    }
    if(status && menuMediaStatusBeforeOffline){
        status.textContent = menuMediaStatusBeforeOffline;
    }
}

function refreshConnectivity(){
    const ui = ensureOfflineUI();
    const offline = navigator.onLine === false;
    ui.rail.dataset.connectivity = offline ? "offline" : "online";

    if(!isServiceWorkerSupported()){
        ui.state.textContent = offline
            ? "OFFLINE · APP SHELL UNSUPPORTED"
            : "ONLINE · INSTALL SUPPORT VARIES";
    }else if(offlineReady){
        ui.state.textContent = offline
            ? "OFFLINE · LOCAL TRACKER READY"
            : "ONLINE · OFFLINE SHELL READY";
    }else{
        ui.state.textContent = offline
            ? "OFFLINE · SHELL NOT READY"
            : "ONLINE · PREPARING OFFLINE SHELL";
    }

    setMenuMediaOfflineState(offline);
    refreshInstallAction();
    refreshRailVisibility();
}

function markUpdateReady(){
    const ui = ensureOfflineUI();
    if(!offlineRegistration?.waiting){
        ui.update.hidden = true;
        ui.update.disabled = false;
        refreshRailVisibility();
        return;
    }
    ui.update.hidden = false;
    ui.update.disabled = false;
    ui.update.textContent = "UPDATE READY";
    refreshRailVisibility();
}

function sendWorkerMessage(worker, type, payload = {}){
    return new Promise((resolve, reject) => {
        if(!worker){
            reject(new Error("No service worker is available for this request."));
            return;
        }
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
            channel.port1.close();
            reject(new Error(`Service worker message timed out: ${type}`));
        }, OFFLINE_MESSAGE_TIMEOUT_MS);

        channel.port1.onmessage = event => {
            window.clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data || {});
        };
        worker.postMessage({ type, ...payload }, [channel.port2]);
    });
}

async function verifyOfflineReadiness(worker = offlineRegistration?.active || navigator.serviceWorker?.controller){
    if(!worker){
        offlineReady = false;
        refreshConnectivity();
        return false;
    }
    try{
        const response = await sendWorkerMessage(worker, "CMS_GET_CACHE_STATUS");
        lastCacheStatus = response;
        offlineReady = Boolean(response.current?.ok ?? response.ok);
    }catch(error){
        offlineReady = false;
        if(navigator.onLine !== false){
            console.warn("[Career Mode Showdown] Offline shell verification could not complete:", error);
        }
    }
    refreshConnectivity();
    return offlineReady;
}

async function activateWaitingUpdate(){
    const waiting = offlineRegistration?.waiting;
    if(!waiting){
        markUpdateReady();
        return false;
    }

    const boundary = getUpdateBoundaryStatus();
    if(!boundary.safe){
        const message = boundary.recoveryBusy || boundary.uiBusy
            ? "Update is ready, but an application operation is still in progress. Finish it and return to Home or Showdown Home before updating."
            : "Update is ready. Return to Home or Showdown Home before applying it so unsaved form work is never discarded.";
        window.showAppNotice?.(message, "error", 8000);
        return false;
    }

    const ui = ensureOfflineUI();
    ui.update.disabled = true;
    ui.update.textContent = "VERIFYING UPDATE";
    try{
        const response = await sendWorkerMessage(waiting, "CMS_ACTIVATE_UPDATE", {
            pageRevision: OFFLINE_APP_REVISION,
            screen: boundary.screen
        });
        if(!response.ok || response.type !== "CMS_ACTIVATION_ACCEPTED"){
            const missing = Array.isArray(response.missing) && response.missing.length
                ? `: ${response.missing.join(", ")}`
                : ".";
            throw new Error(response.error || `Cached update is incomplete${missing}`);
        }
        activationRequested = true;
        ui.update.textContent = "APPLYING UPDATE";
        return true;
    }catch(error){
        ui.update.disabled = false;
        ui.update.textContent = "UPDATE READY";
        window.reportApplicationError?.("The update was not activated because its offline shell could not be verified", error);
        return false;
    }
}

async function requestPreviousRuntimeRollback(){
    const boundary = getUpdateBoundaryStatus();
    if(!boundary.safe){
        window.showAppNotice?.("Return to Home or Showdown Home before reloading a previous offline version.", "error", 7000);
        return false;
    }
    const worker = navigator.serviceWorker?.controller || offlineRegistration?.active;
    try{
        const response = await sendWorkerMessage(worker, "CMS_ROLLBACK_TO_PREVIOUS");
        if(!response.ok || response.type !== "CMS_ROLLBACK_ACCEPTED"){
            throw new Error(response.error || "No complete previous offline shell is available.");
        }
        window.location.reload();
        return true;
    }catch(error){
        window.reportApplicationError?.("A previous offline version could not be selected", error);
        return false;
    }
}

function observeRegistration(registration){
    offlineRegistration = registration;
    markUpdateReady();
    registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if(!installing){ return; }
        installing.addEventListener("statechange", () => {
            if(installing.state === "installed"){
                if(navigator.serviceWorker.controller){
                    markUpdateReady();
                }else{
                    verifyOfflineReadiness(registration.active || installing);
                }
            }
        });
    });
}

async function registerOfflineApplication(){
    if(!isServiceWorkerSupported()){ return null; }
    const workerUrl = new URL("service-worker.js", window.location.href);
    workerUrl.searchParams.set("v", OFFLINE_APP_REVISION);
    const registration = await navigator.serviceWorker.register(workerUrl.href, {
        scope: "./",
        updateViaCache: "none"
    });
    observeRegistration(registration);

    const readyRegistration = await navigator.serviceWorker.ready;
    offlineRegistration = readyRegistration;
    await verifyOfflineReadiness(readyRegistration.active || navigator.serviceWorker.controller);

    if(navigator.onLine !== false){
        try{ await registration.update(); }catch(error){
            console.warn("[Career Mode Showdown] Service worker update check could not complete:", error);
        }
    }
    markUpdateReady();
    return registration;
}

function consumeEarlyInstallPrompt(){
    if(window.__cmsDeferredInstallPrompt){
        deferredInstallPrompt = window.__cmsDeferredInstallPrompt;
        window.__cmsDeferredInstallPrompt = null;
        installPromptCaptured = true;
    }
}

function initializeOfflineApplication(){
    ensureOfflineStyles();
    ensureOfflineUI();
    consumeEarlyInstallPrompt();
    refreshInstallAction();
    refreshConnectivity();

    window.addEventListener("online", refreshConnectivity);
    window.addEventListener("offline", refreshConnectivity);
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installPromptCaptured = true;
        refreshInstallAction();
    });
    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        installedStandalone = true;
        refreshInstallAction();
        window.showAppNotice?.("Career Mode Showdown is installed and ready for local offline use.", "success", 5500);
    });

    if(!isServiceWorkerSupported()){
        refreshConnectivity();
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if(activationRequested && !controllerReloaded){
            controllerReloaded = true;
            window.location.reload();
            return;
        }
        verifyOfflineReadiness(navigator.serviceWorker.controller);
    });

    registerOfflineApplication().catch(error => {
        offlineReady = false;
        refreshConnectivity();
        window.reportApplicationError?.("Offline application support could not be prepared", error);
    });
}

window.getOfflineAppDiagnostics = () => ({
    revision: OFFLINE_APP_REVISION,
    supported: isServiceWorkerSupported(),
    registration: Boolean(offlineRegistration),
    waiting: Boolean(offlineRegistration?.waiting),
    connectivity: navigator.onLine === false ? "offline" : "online",
    standalone: isStandaloneDisplay(),
    installPromptCaptured,
    offlineReady,
    cacheStatus: lastCacheStatus,
    safeUpdateBoundary: getUpdateBoundaryStatus()
});
window.getOfflineUpdateBoundaryStatus = getUpdateBoundaryStatus;
window.activateWaitingOfflineUpdate = activateWaitingUpdate;
window.requestPreviousOfflineRuntime = requestPreviousRuntimeRollback;

initializeOfflineApplication();
