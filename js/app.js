/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.13.1
   Performance-Stabilized Application Controller
===================================================== */

const APP_VERSION = "0.13.1";
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;

function showAppNotice(message, type = "error", duration = 7000){
    let notice = document.getElementById("appRuntimeNotice");

    if(!notice){
        notice = document.createElement("div");
        notice.id = "appRuntimeNotice";
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");

        const text = document.createElement("span");
        text.className = "runtimeNoticeText";

        const close = document.createElement("button");
        close.type = "button";
        close.setAttribute("aria-label", "Dismiss message");
        close.textContent = "×";
        close.addEventListener("click", () => notice.remove());

        notice.append(text, close);
        document.body.appendChild(notice);
    }

    notice.className = type;
    const text = notice.querySelector(".runtimeNoticeText");
    if(text){
        text.textContent = message;
    }

    if(runtimeNoticeTimer){
        window.clearTimeout(runtimeNoticeTimer);
        runtimeNoticeTimer = null;
    }

    if(duration > 0){
        runtimeNoticeTimer = window.setTimeout(() => {
            const activeNotice = document.getElementById("appRuntimeNotice");
            if(activeNotice){ activeNotice.remove(); }
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
        window.requestIdleCallback(run, { timeout: 1000 });
    }else{
        window.setTimeout(run, 0);
    }
}

function runInitializer(name, initializer){
    if(typeof initializer !== "function"){
        throw new Error(`Required initializer is unavailable: ${name}`);
    }
    initializer();
}

function initializeApplicationModules(){
    [
        ["initializeStorageLifecycle", initializeStorageLifecycle],
        ["initializeShowdownUI", initializeShowdownUI],
        ["initializeLeagueWheel", initializeLeagueWheel],
        ["initializeClubAssignment", initializeClubAssignment],
        ["initializeTransferChallenge", initializeTransferChallenge],
        ["initializeSeasonEngine", initializeSeasonEngine],
        ["initializeStatistics", initializeStatistics],
        ["initializeTrophyRoom", initializeTrophyRoom],
        ["initializeRuleBook", initializeRuleBook],
        ["initializeScreens", initializeScreens],
        ["initializeMenuExperience", initializeMenuExperience]
    ].forEach(([name, initializer]) => runInitializer(name, initializer));
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
