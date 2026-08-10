const APP_VERSION = "1.0.1";
const STARTUP_SPLASH_MINIMUM_MS = 2700;
// STARTUP_SPLASH_MINIMUM_MS = 1900
const STARTUP_SPLASH_REDUCED_MS = 220;
const STARTUP_SPLASH_EXIT_MS = 240;
const VISUAL_FIDELITY_STYLESHEET = "css/visual-fidelity-r2.css?v=1.0.1-r3";
const EXTERNAL_RUNTIME_SOURCE_PROTOCOLS = new Set([
    "chrome-extension:",
    "moz-extension:",
    "safari-web-extension:",
    "webkit-masked-url:"
]);
const EXTERNAL_RUNTIME_NOISE_PATTERNS = [
    /contentScriptData\.init_ts/i,
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
    /safari-web-extension:\/\//i,
    /webkit-masked-url:\/\//i
];
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;
let performanceLifecycleInstalled = false;
let runtimeNoticeElement = null;
let runtimeNoticeTextElement = null;
let suppressedExternalRuntimeErrors = 0;

function installVisualFidelityStyles(){
    if(document.querySelector('link[data-visual-fidelity="reus-r2"]')){
        return;
    }

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
    if(runtimeNoticeElement && runtimeNoticeElement.isConnected){
        return runtimeNoticeElement;
    }

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
        if(runtimeNoticeTimer){
            window.clearTimeout(runtimeNoticeTimer);
            runtimeNoticeTimer = null;
        }
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
    if(notice.className !== type){ notice.className = type; }

    if(runtimeNoticeTextElement){
        const nextMessage = String(message || "");
        if(runtimeNoticeTextElement.textContent !== nextMessage){
            runtimeNoticeTextElement.textContent = nextMessage;
        }
    }

    if(runtimeNoticeTimer){
        window.clearTimeout(runtimeNoticeTimer);
        runtimeNoticeTimer = null;
    }

    if(duration > 0){
        runtimeNoticeTimer = window.setTimeout(() => {
            if(runtimeNoticeElement && runtimeNoticeElement.isConnected){
                runtimeNoticeElement.remove();
            }
            runtimeNoticeElement = null;
            runtimeNoticeTextElement = null;
            runtimeNoticeTimer = null;
        }, duration);
    }
}

window.showAppNotice = showAppNotice;

function reportApplicationError(context, error){
    const detail = error && error.message ? error.message : String(error || "Unknown error");
    console.error(`[Career Mode Showdown] ${context}:`, error);
    showAppNotice(`${context}. ${detail}`, "error", 10000);
}

window.reportApplicationError = reportApplicationError;

function getRuntimeErrorText(value){
    return typeof value === "string" ? value : "";
}

function getRuntimeErrorStack(error){
    return error && typeof error.stack === "string" ? error.stack : "";
}

function getRuntimeSourceUrls(filename, stack){
    const sources = [];
    if(filename){ sources.push(filename); }

    const matches = getRuntimeErrorText(stack).match(/(?:https?:\/\/|chrome-extension:\/\/|moz-extension:\/\/|safari-web-extension:\/\/|webkit-masked-url:\/\/)[^\s)]+/gi) || [];
    matches.forEach(source => sources.push(source));
    return [...new Set(sources)];
}

function parseRuntimeSourceUrl(source){
    try{
        return new URL(source, window.location.href);
    }catch(error){
        return null;
    }
}

function isExplicitExternalRuntimeNoise(message, filename, stack){
    const combined = `${getRuntimeErrorText(message)}\n${getRuntimeErrorText(filename)}\n${getRuntimeErrorText(stack)}`;
    return EXTERNAL_RUNTIME_NOISE_PATTERNS.some(pattern => pattern.test(combined));
}

function isFirstPartyRuntimeError(message, filename, stack){
    if(isExplicitExternalRuntimeNoise(message, filename, stack)){
        return false;
    }

    const sources = getRuntimeSourceUrls(filename, stack);
    if(!sources.length){
        return false;
    }

    return sources.some(source => {
        const parsed = parseRuntimeSourceUrl(source);
        if(!parsed || EXTERNAL_RUNTIME_SOURCE_PROTOCOLS.has(parsed.protocol)){
            return false;
        }
        return parsed.origin === window.location.origin;
    });
}

function suppressExternalRuntimeError(kind, message, filename, stack){
    suppressedExternalRuntimeErrors += 1;
    console.info(`[Career Mode Showdown] Suppressed non-app ${kind}.`, {
        message: getRuntimeErrorText(message),
        filename: getRuntimeErrorText(filename),
        stack: getRuntimeErrorText(stack)
    });
}

function getRuntimeErrorBoundaryDiagnostics(){
    return {
        installed: runtimeBoundaryInstalled,
        suppressedExternalRuntimeErrors
    };
}

window.getRuntimeErrorBoundaryDiagnostics = getRuntimeErrorBoundaryDiagnostics;
window.isFirstPartyRuntimeError = isFirstPartyRuntimeError;

function installRuntimeErrorBoundary(){
    if(runtimeBoundaryInstalled){
        return;
    }

    runtimeBoundaryInstalled = true;

    window.addEventListener("error", event => {
        if(!event){
            return;
        }

        const error = event.error;
        const message = getRuntimeErrorText(event.message || (error && error.message));
        const filename = getRuntimeErrorText(event.filename);
        const stack = getRuntimeErrorStack(error);

        if(!isFirstPartyRuntimeError(message, filename, stack)){
            suppressExternalRuntimeError("runtime error", message, filename, stack);
            return;
        }

        reportApplicationError("A runtime error was detected", error || new Error(message || "Unknown runtime error"));
    });

    window.addEventListener("unhandledrejection", event => {
        const reason = event ? event.reason : null;
        const message = reason && reason.message ? String(reason.message) : String(reason || "Unknown promise rejection");
        const stack = getRuntimeErrorStack(reason);

        if(!isFirstPartyRuntimeError(message, "", stack)){
            suppressExternalRuntimeError("promise rejection", message, "", stack);
            return;
        }

        reportApplicationError("An unexpected application error was detected", reason);
    });
}

function resumeVisibleTransferTimer(){
    if(typeof currentShowdown === "undefined" || !currentShowdown){
        return;
    }
    if(typeof window.getActiveScreenName !== "function" || window.getActiveScreenName() !== "transferChallenge"){
        return;
    }
    if(typeof getTransferChallengeForSeason !== "function"){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){
        return;
    }

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
    if(performanceLifecycleInstalled){
        return;
    }

    performanceLifecycleInstalled = true;
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            if(typeof window.stopTransferTimerLoop === "function"){
                window.stopTransferTimerLoop();
            }
            return;
        }

        resumeVisibleTransferTimer();
    });
}

window.initializePerformanceLifecycle = initializePerformanceLifecycle;

function isStartupMotionReduced(){
    if(typeof window.isReducedMotionPreferred === "function"){
        return window.isReducedMotionPreferred();
    }
    return Boolean(
        typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
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
        if(!loadingScreen){ return; }
        loadingScreen.hidden = true;
        loadingScreen.classList.add("hidden");
    };
    if(reducedMotion){
        removeSplash();
    }else{
        window.setTimeout(removeSplash, STARTUP_SPLASH_EXIT_MS);
    }
}

function revealApplication(){
    const loadingScreen = document.getElementById("loadingScreen");
    const app = document.getElementById("app");

    if(app){
        app.classList.remove("hidden");
        app.inert = true;
    }

    const reducedMotion = isStartupMotionReduced();
    const minimumDuration = reducedMotion
        ? STARTUP_SPLASH_REDUCED_MS
        : STARTUP_SPLASH_MINIMUM_MS;
    const elapsed = typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : minimumDuration;
    const remaining = Math.max(0, minimumDuration - elapsed);

    if(loadingScreen){ loadingScreen.classList.add("is-ready"); }
    window.setTimeout(
        () => finishStartupPresentation(loadingScreen, app, reducedMotion),
        remaining
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

    if(typeof window.requestIdleCallback === "function"){
        window.requestIdleCallback(() => run(), { timeout: 2200 });
    }else{
        window.setTimeout(run, 350);
    }
}

function runInitializer(name, initializer){
    if(typeof initializer !== "function"){
        throw new Error(`Required initializer is unavailable: ${name}`);
    }
    initializer();
}

function initializeApplicationModules(){
    const initializers = [
        ["initializeStorageLifecycle", window.initializeStorageLifecycle],
        ["initializeScreens", window.initializeScreens || (typeof initializeScreens === "function" ? initializeScreens : null)],
        ["initializeMenuExperience", window.initializeMenuExperience || (typeof initializeMenuExperience === "function" ? initializeMenuExperience : null)],
        ["initializeOptionalModules", window.initializeOptionalModules],
        ["initializePerformanceLifecycle", initializePerformanceLifecycle]
    ];

    initializers.forEach(([name, initializer]) => runInitializer(name, initializer));
}

function startApplication(){
    if(applicationStarted){
        return;
    }

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

    window.requestAnimationFrame(() => {
        revealApplication();
        scheduleApplicationDiagnostics();
    });
}

function bootstrapApplication(){
    startApplication();
}

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootstrapApplication, { once: true });
}else{
    bootstrapApplication();
}
