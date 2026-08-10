const APP_VERSION = "1.0.1";
const STARTUP_SPLASH_MINIMUM_MS = 2700;
// STARTUP_SPLASH_MINIMUM_MS = 1900
const STARTUP_SPLASH_REDUCED_MS = 220;
const STARTUP_SPLASH_EXIT_MS = 240;
const VISUAL_FIDELITY_STYLESHEET = "css/visual-fidelity-r2.css?v=1.0.1-r4";
const EXTERNAL_RUNTIME_ERROR = /contentScriptData\.init_ts|(?:chrome|moz|safari-web)-extension:\/\/|webkit-masked-url:\/\//i;
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;
let performanceLifecycleInstalled = false;
let runtimeNoticeElement = null;
let runtimeNoticeTextElement = null;
let suppressedExternalRuntimeErrors = 0;

function installVisualFidelityStyles(){
    if(document.querySelector('link[data-visual-fidelity="reus-r2"]')) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = VISUAL_FIDELITY_STYLESHEET;
    stylesheet.dataset.visualFidelity = "reus-r2";
    stylesheet.addEventListener("error", () => {
        console.warn("[Career Mode Showdown] Reus visual fidelity stylesheet could not be loaded. Base visuals remain available.");
    }, { once: true });
    document.head.appendChild(stylesheet);
}
installVisualFidelityStyles();

function getRuntimeNotice(){
    if(runtimeNoticeElement && runtimeNoticeElement.isConnected) return runtimeNoticeElement;
    const existing = document.getElementById("appRuntimeNotice");
    if(existing){
        runtimeNoticeElement = existing;
        runtimeNoticeTextElement = existing.querySelector(".runtimeNoticeText");
        return existing;
    }
    const notice = document.createElement("div");
    notice.id = "appRuntimeNotice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    const text = document.createElement("span");
    text.className = "runtimeNoticeText";
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss message");
    close.textContent = "×";
    close.addEventListener("click", () => {
        if(runtimeNoticeTimer) window.clearTimeout(runtimeNoticeTimer);
        runtimeNoticeTimer = null;
        notice.remove();
        runtimeNoticeElement = null;
        runtimeNoticeTextElement = null;
    });
    notice.append(text, close);
    document.body.appendChild(notice);
    runtimeNoticeElement = notice;
    runtimeNoticeTextElement = text;
    return notice;
}

function showAppNotice(message, type = "error", duration = 7000){
    const notice = getRuntimeNotice();
    if(notice.className !== type) notice.className = type;
    if(runtimeNoticeTextElement){
        const nextMessage = String(message || "");
        if(runtimeNoticeTextElement.textContent !== nextMessage) runtimeNoticeTextElement.textContent = nextMessage;
    }
    if(runtimeNoticeTimer) window.clearTimeout(runtimeNoticeTimer);
    runtimeNoticeTimer = duration > 0 ? window.setTimeout(() => {
        if(runtimeNoticeElement && runtimeNoticeElement.isConnected) runtimeNoticeElement.remove();
        runtimeNoticeElement = null;
        runtimeNoticeTextElement = null;
        runtimeNoticeTimer = null;
    }, duration) : null;
}
window.showAppNotice = showAppNotice;

function reportApplicationError(context, error){
    const detail = error && error.message ? error.message : String(error || "Unknown error");
    console.error(`[Career Mode Showdown] ${context}:`, error);
    showAppNotice(`${context}. ${detail}`, "error", 10000);
}
window.reportApplicationError = reportApplicationError;

function isFirstPartyRuntimeError(message = "", filename = "", stack = ""){
    const evidence = `${message}\n${filename}\n${stack}`;
    if(EXTERNAL_RUNTIME_ERROR.test(evidence)) return false;
    if(filename){
        try{
            if(new URL(filename, window.location.href).origin === window.location.origin) return true;
        }catch(error){}
    }
    return String(stack || "").includes(`${window.location.origin}/`);
}

function suppressExternalRuntimeError(kind, message){
    suppressedExternalRuntimeErrors += 1;
    console.info(`[Career Mode Showdown] Suppressed non-app ${kind}.`, String(message || ""));
}

window.isFirstPartyRuntimeError = isFirstPartyRuntimeError;
window.getRuntimeErrorBoundaryDiagnostics = () => ({
    installed: runtimeBoundaryInstalled,
    suppressedExternalRuntimeErrors
});

function installRuntimeErrorBoundary(){
    if(runtimeBoundaryInstalled) return;
    runtimeBoundaryInstalled = true;
    window.addEventListener("error", event => {
        if(!event) return;
        const error = event.error;
        const message = String(event.message || (error && error.message) || "");
        const stack = error && typeof error.stack === "string" ? error.stack : "";
        if(!isFirstPartyRuntimeError(message, event.filename || "", stack)){
            suppressExternalRuntimeError("runtime error", message);
            return;
        }
        reportApplicationError("A runtime error was detected", error || new Error(message || "Unknown runtime error"));
    });
    window.addEventListener("unhandledrejection", event => {
        const reason = event ? event.reason : null;
        const message = reason && reason.message ? String(reason.message) : String(reason || "Unknown promise rejection");
        const stack = reason && typeof reason.stack === "string" ? reason.stack : "";
        if(!isFirstPartyRuntimeError(message, "", stack)){
            suppressExternalRuntimeError("promise rejection", message);
            return;
        }
        reportApplicationError("An unexpected application error was detected", reason);
    });
}

function resumeVisibleTransferTimer(){
    if(typeof currentShowdown === "undefined" || !currentShowdown) return;
    if(typeof window.getActiveScreenName !== "function" || window.getActiveScreenName() !== "transferChallenge") return;
    if(typeof getTransferChallengeForSeason !== "function") return;
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active") return;
    if(typeof window.synchronizeTransferDeadline === "function") window.synchronizeTransferDeadline(challenge);
    if(challenge.status === "active" && typeof window.startTransferTimerLoop === "function"){
        window.startTransferTimerLoop();
    }else if(typeof window.renderTransferChallenge === "function"){
        window.renderTransferChallenge(challenge);
    }
}

function initializePerformanceLifecycle(){
    if(performanceLifecycleInstalled) return;
    performanceLifecycleInstalled = true;
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            if(typeof window.stopTransferTimerLoop === "function") window.stopTransferTimerLoop();
            return;
        }
        resumeVisibleTransferTimer();
    });
}
window.initializePerformanceLifecycle = initializePerformanceLifecycle;

function isStartupMotionReduced(){
    if(typeof window.isReducedMotionPreferred === "function") return window.isReducedMotionPreferred();
    return Boolean(typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
    const removeSplash = () => {
        if(!loadingScreen) return;
        loadingScreen.hidden = true;
        loadingScreen.classList.add("hidden");
    };
    if(reducedMotion) removeSplash();
    else window.setTimeout(removeSplash, STARTUP_SPLASH_EXIT_MS);
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
    const elapsed = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : minimumDuration;
    const remaining = Math.max(0, minimumDuration - elapsed);
    if(loadingScreen) loadingScreen.classList.add("is-ready");
    window.setTimeout(() => finishStartupPresentation(loadingScreen, app, reducedMotion), remaining);
}

function scheduleApplicationDiagnostics(){
    const run = async () => {
        try{
            if(typeof window.ensureDiagnosticsModule === "function") await window.ensureDiagnosticsModule();
            if(typeof window.runApplicationDiagnostics === "function") window.runApplicationDiagnostics();
        }catch(error){
            console.warn("[Career Mode Showdown] Diagnostics could not be loaded:", error);
        }
    };
    if(typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => run(), { timeout: 2200 });
    else window.setTimeout(run, 350);
}

function runInitializer(name, initializer){
    if(typeof initializer !== "function") throw new Error(`Required initializer is unavailable: ${name}`);
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
    if(applicationStarted) return;
    applicationStarted = true;
    installRuntimeErrorBoundary();
    try{
        initializeApplicationModules();
        if(!showScreen("mainMenu", false)) throw new Error("Main Menu could not be opened.");
    }catch(error){
        reportApplicationError("The application could not finish initializing", error);
    }
    window.requestAnimationFrame(() => {
        revealApplication();
        scheduleApplicationDiagnostics();
    });
}

function bootstrapApplication(){ startApplication(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrapApplication, { once: true });
else bootstrapApplication();
