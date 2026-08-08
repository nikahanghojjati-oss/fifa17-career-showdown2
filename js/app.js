/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Stabilized Application Controller
===================================================== */

const APP_VERSION = "0.15.1";
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;
let performanceLifecycleInstalled = false;
let runtimeNoticeElement = null;
let runtimeNoticeTextElement = null;

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

function installRuntimeErrorBoundary(){
    if(runtimeBoundaryInstalled){
        return;
    }

    runtimeBoundaryInstalled = true;

    window.addEventListener("error", event => {
        if(!event || !event.error){
            return;
        }
        reportApplicationError("A runtime error was detected", event.error);
    });

    window.addEventListener("unhandledrejection", event => {
        reportApplicationError("An unexpected application error was detected", event.reason);
    });
}

function resumeVisibleTransferTimer(){
    if(typeof currentShowdown === "undefined" || !currentShowdown){
        return;
    }
    if(typeof getActiveScreenName !== "function" || getActiveScreenName() !== "transferChallenge"){
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

function revealApplication(){
    const loadingScreen = document.getElementById("loadingScreen");
    const app = document.getElementById("app");

    if(loadingScreen){
        loadingScreen.classList.add("hidden");
    }

    if(app){
        app.classList.remove("hidden");
    }
}

function scheduleApplicationDiagnostics(){
    if(typeof window.runApplicationDiagnostics !== "function"){
        return;
    }

    const run = () => window.runApplicationDiagnostics();

    if(typeof window.requestIdleCallback === "function"){
        window.requestIdleCallback(run, { timeout: 1400 });
    }else{
        window.setTimeout(run, 120);
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
        ["initializeStorageLifecycle", initializeStorageLifecycle],
        ["initializeShowdownUI", initializeShowdownUI],
        ["initializeLeagueWheel", initializeLeagueWheel],
        ["initializeClubAssignment", initializeClubAssignment],
        ["initializeTransferChallenge", initializeTransferChallenge],
        ["initializeSeasonEngine", initializeSeasonEngine],
        ["initializeScreens", initializeScreens],
        ["initializeMenuExperience", initializeMenuExperience],
        ["initializeOptionalModules", initializeOptionalModules],
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
