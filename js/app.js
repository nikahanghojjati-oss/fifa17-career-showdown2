const APP_VERSION = "1.1.5";
const APP_ASSET_REVISION = `${APP_VERSION}-r1`;
const STARTUP_SPLASH_MINIMUM_MS = 2700;
const STARTUP_SPLASH_REDUCED_MS = 220;
const STARTUP_SPLASH_EXIT_MS = 240;
const VISUAL_FIDELITY_STYLESHEET = `css/visual-fidelity-r3.css?v=${APP_ASSET_REVISION}`;
const EXTERNAL_RUNTIME_ERROR = /contentScriptData\.init_ts|(?:chrome|moz|safari-web)-extension:\/\/|webkit-masked-url:\/\//i;
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;
let performanceLifecycleInstalled = false;
let runtimeNoticeElement = null;
let runtimeNoticeTextElement = null;
let suppressedExternalRuntimeErrors = 0;
let offlineApplicationLoadPromise = null;

function versionedApplicationUrl(path){
    const url = new URL(path, window.location.href);
    url.searchParams.set("v", APP_ASSET_REVISION);
    return url.href;
}

function captureDeferredInstallPrompt(event){
    event.preventDefault();
    window.__cmsDeferredInstallPrompt = event;
}
window.addEventListener("beforeinstallprompt", captureDeferredInstallPrompt, { once: true });

function installOfflineMetadata(){
    let manifest = document.querySelector('link[rel="manifest"]');
    if(!manifest){
        manifest = document.createElement("link");
        manifest.rel = "manifest";
        manifest.dataset.offlineManifest = "true";
        document.head.appendChild(manifest);
    }
    manifest.href = versionedApplicationUrl("manifest.webmanifest");

    let theme = document.querySelector('meta[name="theme-color"]');
    if(!theme){
        theme = document.createElement("meta");
        theme.name = "theme-color";
        document.head.appendChild(theme);
    }
    theme.content = "#20272d";
}
installOfflineMetadata();

function installVisualFidelityStyles(){
    if(document.querySelector('link[data-visual-fidelity="reus-r3"]')){ return; }
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = VISUAL_FIDELITY_STYLESHEET;
    stylesheet.dataset.visualFidelity = "reus-r3";
    stylesheet.addEventListener("error", () => {
        console.warn("[Career Mode Showdown] Reus visual fidelity stylesheet could not be loaded. Base visuals remain available.");
    }, { once: true });
    document.head.appendChild(stylesheet);
}
installVisualFidelityStyles();

function getRuntimeNotice(){
    if(runtimeNoticeElement?.isConnected){ return runtimeNoticeElement; }
    const existing = document.getElementById("appRuntimeNotice");
    if(existing){
        runtimeNoticeElement = existing;
        runtimeNoticeTextElement = existing.querySelector(".runtimeNoticeText");
        return existing;
    }

    const notice = document.createElement("div");
    const text = document.createElement("span");
    const dismiss = document.createElement("button");
    notice.id = "appRuntimeNotice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    text.className = "runtimeNoticeText";
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Dismiss message");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => {
        if(runtimeNoticeTimer){ window.clearTimeout(runtimeNoticeTimer); }
        runtimeNoticeTimer = null;
        notice.remove();
        runtimeNoticeElement = null;
        runtimeNoticeTextElement = null;
    });
    notice.append(text, dismiss);
    document.body.appendChild(notice);
    runtimeNoticeElement = notice;
    runtimeNoticeTextElement = text;
    return notice;
}

function showAppNotice(message, type = "error", duration = 7000){
    const notice = getRuntimeNotice();
    if(notice.className !== type){ notice.className = type; }
    const nextMessage = String(message || "");
    if(runtimeNoticeTextElement && runtimeNoticeTextElement.textContent !== nextMessage){
        runtimeNoticeTextElement.textContent = nextMessage;
    }
    if(runtimeNoticeTimer){ window.clearTimeout(runtimeNoticeTimer); }
    runtimeNoticeTimer = duration > 0
        ? window.setTimeout(() => {
            if(runtimeNoticeElement?.isConnected){ runtimeNoticeElement.remove(); }
            runtimeNoticeElement = null;
            runtimeNoticeTextElement = null;
            runtimeNoticeTimer = null;
        }, duration)
        : null;
}
window.showAppNotice = showAppNotice;

function reportApplicationError(context, error){
    const detail = error?.message || String(error || "Unknown error");
    console.error(`[Career Mode Showdown] ${context}:`, error);
    showAppNotice(`${context}. ${detail}`, "error", 10000);
}
window.reportApplicationError = reportApplicationError;

function isFirstPartyRuntimeError(message = "", filename = "", stack = ""){
    const evidence = `${message}\n${filename}\n${stack}`;
    if(EXTERNAL_RUNTIME_ERROR.test(evidence)){ return false; }
    if(filename){
        try{
            if(new URL(filename, location.href).origin === location.origin){ return true; }
        }catch(error){}
    }
    return String(stack || "").includes(`${location.origin}/`);
}

function suppressExternalRuntimeError(){ suppressedExternalRuntimeErrors += 1; }
window.isFirstPartyRuntimeError = isFirstPartyRuntimeError;
window.getRuntimeErrorBoundaryDiagnostics = () => ({ installed: runtimeBoundaryInstalled, suppressedExternalRuntimeErrors });

function installRuntimeErrorBoundary(){
    if(runtimeBoundaryInstalled){ return; }
    runtimeBoundaryInstalled = true;
    addEventListener("error", event => {
        if(!event){ return; }
        const error = event.error;
        const message = String(event.message || error?.message || "");
        const stack = typeof error?.stack === "string" ? error.stack : "";
        if(!isFirstPartyRuntimeError(message, event.filename || "", stack)){
            suppressExternalRuntimeError();
            return;
        }
        reportApplicationError("A runtime error was detected", error || new Error(message || "Unknown runtime error"));
    });
    addEventListener("unhandledrejection", event => {
        const reason = event?.reason;
        const message = reason?.message ? String(reason.message) : String(reason || "Unknown promise rejection");
        const stack = typeof reason?.stack === "string" ? reason.stack : "";
        if(!isFirstPartyRuntimeError(message, "", stack)){
            suppressExternalRuntimeError();
            return;
        }
        reportApplicationError("An unexpected application error was detected", reason);
    });
}

function resumeVisibleTransferTimer(){
    if(
        typeof currentShowdown === "undefined"
        || !currentShowdown
        || typeof window.getActiveScreenName !== "function"
        || window.getActiveScreenName() !== "transferChallenge"
        || typeof getTransferChallengeForSeason !== "function"
    ){
        return;
    }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){ return; }
    if(typeof window.synchronizeTransferDeadline === "function"){
        window.synchronizeTransferDeadline(challenge);
    }
    if(challenge.status === "active" && typeof window.startTransferTimerLoop === "function"){
        window.startTransferTimerLoop();
    }else if(typeof window.renderTransferChallenge === "function"){
        window.renderTransferChallenge(challenge);
    }
}

function initializePerformanceLifecycle(){
    if(performanceLifecycleInstalled){ return; }
    performanceLifecycleInstalled = true;
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            if(typeof window.stopTransferTimerLoop === "function"){ window.stopTransferTimerLoop(); }
            return;
        }
        resumeVisibleTransferTimer();
    });
}
window.initializePerformanceLifecycle = initializePerformanceLifecycle;

function isStartupMotionReduced(){
    return typeof window.isReducedMotionPreferred === "function"
        ? window.isReducedMotionPreferred()
        : Boolean(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function finishStartupPresentation(loadingScreen, app, reducedMotion){
    if(loadingScreen){
        loadingScreen.setAttribute("aria-hidden", "true");
        loadingScreen.setAttribute("aria-busy", "false");
        loadingScreen.classList.add("is-exiting");
    }
    if(app){
        app.inert = false;
        app.removeAttribute("aria-hidden");
    }
    const finish = () => {
        if(!loadingScreen){ return; }
        loadingScreen.hidden = true;
        loadingScreen.classList.add("hidden");
    };
    reducedMotion ? finish() : setTimeout(finish, STARTUP_SPLASH_EXIT_MS);
}

function revealApplication(){
    const loadingScreen = document.getElementById("loadingScreen");
    const app = document.getElementById("app");
    if(app){
        app.classList.remove("hidden");
        app.inert = true;
    }
    const reducedMotion = isStartupMotionReduced();
    const minimumDuration = reducedMotion ? STARTUP_SPLASH_REDUCED_MS : STARTUP_SPLASH_MINIMUM_MS;
    const elapsed = typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : minimumDuration;
    if(loadingScreen){ loadingScreen.classList.add("is-ready"); }
    setTimeout(
        () => finishStartupPresentation(loadingScreen, app, reducedMotion),
        Math.max(0, minimumDuration - elapsed)
    );
}

function scheduleApplicationDiagnostics(){
    const run = async () => {
        try{
            if(typeof window.ensureDiagnosticsModule === "function"){
                await window.ensureDiagnosticsModule();
            }
            if(typeof window.runApplicationDiagnostics === "function"){
                window.runApplicationDiagnostics();
            }
        }catch(error){
            console.warn("[Career Mode Showdown] Diagnostics could not be loaded:", error);
        }
    };
    if(typeof requestIdleCallback === "function"){
        requestIdleCallback(() => run(), { timeout: 2200 });
    }else{
        setTimeout(run, 350);
    }
}

function loadOfflineApplicationSupport(){
    if(typeof window.getOfflineAppDiagnostics === "function"){
        return Promise.resolve(true);
    }
    if(offlineApplicationLoadPromise){ return offlineApplicationLoadPromise; }

    offlineApplicationLoadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-offline-application="true"]');
        const script = existing || document.createElement("script");
        let settled = false;

        const cleanup = () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
        };
        const handleLoad = () => {
            if(settled){ return; }
            settled = true;
            cleanup();
            if(typeof window.getOfflineAppDiagnostics !== "function"){
                reject(new Error("Offline application module loaded without exposing diagnostics."));
                return;
            }
            resolve(true);
        };
        const handleError = () => {
            if(settled){ return; }
            settled = true;
            cleanup();
            if(!existing){ script.remove(); }
            reject(new Error("Unable to load offline application support."));
        };

        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
        if(!existing){
            script.async = true;
            script.src = versionedApplicationUrl("js/offlineApp.js");
            script.dataset.offlineApplication = "true";
            document.body.appendChild(script);
        }
    }).catch(error => {
        offlineApplicationLoadPromise = null;
        reportApplicationError("Offline application support could not be loaded", error);
        return false;
    });

    return offlineApplicationLoadPromise;
}

function scheduleOfflineApplicationSupport(){
    const load = () => { void loadOfflineApplicationSupport(); };
    if(typeof requestIdleCallback === "function"){
        requestIdleCallback(load, { timeout: 1200 });
    }else{
        setTimeout(load, 140);
    }
}
window.loadOfflineApplicationSupport = loadOfflineApplicationSupport;

function runInitializer(name, initializer){
    if(typeof initializer !== "function"){
        throw new Error(`Required initializer is unavailable: ${name}`);
    }
    initializer();
}

function initializeApplicationModules(){
    [
        ["initializeStorageLifecycle", window.initializeStorageLifecycle],
        ["initializeScreens", window.initializeScreens || (typeof initializeScreens === "function" ? initializeScreens : null)],
        ["initializeMenuExperience", window.initializeMenuExperience || (typeof initializeMenuExperience === "function" ? initializeMenuExperience : null)],
        ["initializeOptionalModules", window.initializeOptionalModules],
        ["initializePerformanceLifecycle", initializePerformanceLifecycle]
    ].forEach(([name, initializer]) => runInitializer(name, initializer));
}

function startApplication(){
    if(applicationStarted){ return; }
    applicationStarted = true;
    installRuntimeErrorBoundary();
    try{
        initializeApplicationModules();
        if(!showScreen("mainMenu", false)){
            throw new Error("Main Menu could not be opened.");
        }
    }catch(error){
        reportApplicationError("The application could not finish initializing", error);
    }
    requestAnimationFrame(() => {
        revealApplication();
        scheduleOfflineApplicationSupport();
        scheduleApplicationDiagnostics();
    });
}

function bootstrapApplication(){ startApplication(); }
if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootstrapApplication, { once: true });
}else{
    bootstrapApplication();
}
