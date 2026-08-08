/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   Performance-Stabilized Application Controller
===================================================== */

const APP_VERSION = "0.12.0";
let applicationStarted = false;
let runtimeNoticeTimer = null;
let runtimeBoundaryInstalled = false;
let fastInputUxBound = false;

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

function getFastEntrySequence(screen){
    if(!screen){
        return [];
    }

    if(screen.id === "transferChallenge"){
        return Array.from(screen.querySelectorAll("[data-transfer-field]:not(:disabled)"));
    }

    if(screen.id === "seasonEntry"){
        return [
            "p1LeaguePosition",
            "p1LeaguePoints",
            "p1LeagueGoals",
            "p2LeaguePosition",
            "p2LeaguePoints",
            "p2LeagueGoals",
            "completeSeason"
        ].map(id => document.getElementById(id)).filter(Boolean);
    }

    if(screen.id === "createShowdown"){
        return [
            "showdownName",
            "managerOne",
            "managerTwo",
            "roundAmount",
            "startShowdown"
        ].map(id => document.getElementById(id)).filter(Boolean);
    }

    return [];
}

function handleFastInputKeydown(event){
    if(event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey){
        return;
    }

    const target = event.target;
    if(!(target instanceof HTMLInputElement) || target.type === "checkbox"){
        return;
    }

    const screen = target.closest(".screen");
    const sequence = getFastEntrySequence(screen);
    const index = sequence.indexOf(target);

    if(index < 0 || index >= sequence.length - 1){
        return;
    }

    const next = sequence[index + 1];
    if(!next || next.disabled){
        return;
    }

    event.preventDefault();
    next.focus({ preventScroll: true });

    if(typeof next.select === "function" && next.tagName === "INPUT"){
        next.select();
    }

    if(typeof next.scrollIntoView === "function"){
        next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

function initializeFastInputUX(){
    if(fastInputUxBound){
        return;
    }

    fastInputUxBound = true;
    document.addEventListener("keydown", handleFastInputKeydown);
}

function runInitializer(name, initializer){
    if(typeof initializer !== "function"){
        throw new Error(`Required initializer is unavailable: ${name}`);
    }
    initializer();
}

function initializeApplicationModules(){
    /*
       Persistence lifecycle is first so pending input is protected before any
       screen becomes interactive. The rest of the order remains deterministic.
    */
    [
        ["initializeStorageLifecycle", initializeStorageLifecycle],
        ["initializeFastInputUX", initializeFastInputUX],
        ["initializeShowdownUI", initializeShowdownUI],
        ["initializeLeagueWheel", initializeLeagueWheel],
        ["initializeClubAssignment", initializeClubAssignment],
        ["initializeTransferChallenge", initializeTransferChallenge],
        ["initializeSeasonEngine", initializeSeasonEngine],
        ["initializeStatistics", initializeStatistics],
        ["initializeTrophyRoom", initializeTrophyRoom],
        ["initializeRuleBook", initializeRuleBook],
        ["initializeScreens", initializeScreens]
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

        if(typeof window.runApplicationDiagnostics === "function"){
            window.runApplicationDiagnostics();
        }
    }catch(error){
        reportApplicationError("The application could not finish initializing", error);
    }

    window.setTimeout(revealApplication, 350);
}

function bootstrapApplication(){
    startApplication();
}

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootstrapApplication, { once: true });
}else{
    bootstrapApplication();
}
