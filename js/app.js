/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.10.0
   Application Controller
===================================================== */

const APP_VERSION = "0.10.0";

document.addEventListener("DOMContentLoaded", bootstrapApplication);

function ensureFeatureStylesheet(){
    if(document.getElementById("analyticsStylesheet")){
        return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.id = "analyticsStylesheet";
    stylesheet.rel = "stylesheet";
    stylesheet.href = `css/analytics.css?v=${APP_VERSION}`;
    document.head.appendChild(stylesheet);
}

function loadFeatureScript(id, source){
    const existing = document.getElementById(id);
    if(existing){
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = id;
        script.src = `${source}?v=${APP_VERSION}`;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load ${source}`));
        document.body.appendChild(script);
    });
}

async function loadVersionFeatures(){
    ensureFeatureStylesheet();

    await loadFeatureScript("analyticsEngineScript", "js/analytics.js");
    await loadFeatureScript("statisticsFeatureScript", "js/statistics.js");
    await loadFeatureScript("trophyRoomFeatureScript", "js/trophyRoom.js");
}

async function bootstrapApplication(){
    try{
        await loadVersionFeatures();
    }catch(error){
        console.error("Optional v0.10.0 features could not be loaded:", error);
    }

    startApplication();
}

function startApplication(){
    const loadingScreen = document.getElementById("loadingScreen");
    const app = document.getElementById("app");

    setTimeout(() => {
        if(loadingScreen){
            loadingScreen.classList.add("hidden");
        }

        if(app){
            app.classList.remove("hidden");
        }

        initializeScreens();
        showScreen("mainMenu");
    }, 2500);
}
