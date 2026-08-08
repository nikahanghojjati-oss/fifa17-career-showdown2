/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1

   Screen and Navigation Engine
===================================================== */

const screens = [
    "mainMenu",
    "createShowdown",
    "leagueWheelScreen",
    "clubWheelScreen",
    "dashboard",
    "legacy"
];

let screenHistory = [];

function showScreen(screenName, addToHistory = true){
    if(!screens.includes(screenName)){
        return;
    }

    const current = screens.find(name => {
        const element = document.getElementById(name);
        return element && !element.classList.contains("hidden");
    });

    if(addToHistory && current && current !== screenName){
        screenHistory.push(current);
    }

    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if(element){
            element.classList.add("hidden");
        }
    });

    const activeScreen = document.getElementById(screenName);
    if(activeScreen){
        activeScreen.classList.remove("hidden");
    }
}

function goBack(){
    const previous = screenHistory.pop();

    if(previous){
        showScreen(previous, false);
        return;
    }

    showScreen("mainMenu", false);
}

function initializeScreens(){
    const newShowdownButton = document.getElementById("newShowdown");
    const continueButton = document.getElementById("continueCareer");
    const legacyButton = document.getElementById("legacyButton");

    if(newShowdownButton){
        newShowdownButton.addEventListener("click", () => {
            showScreen("createShowdown");
        });
    }

    if(continueButton){
        continueButton.addEventListener("click", () => {
            if(hasSavedShowdown()){
                currentShowdown = loadSavedShowdown();
                updateShowdownUI();
                showScreen("dashboard");
            }else{
                showScreen("createShowdown");
            }
        });
    }

    if(legacyButton){
        legacyButton.addEventListener("click", () => {
            showScreen("legacy");
        });
    }

    document.querySelectorAll("[data-back]").forEach(button => {
        button.addEventListener("click", () => {
            const target = button.dataset.back;
            if(target){
                showScreen(target, false);
            }else{
                goBack();
            }
        });
    });
}
