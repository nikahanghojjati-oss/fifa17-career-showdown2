/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.0
   High-Performance Showdown Interface Controller
===================================================== */

let dashboardUI = null;

function cacheDashboardUI(){
    dashboardUI = {
        indicator: document.getElementById("seasonIndicator"),
        selectedLeague: document.getElementById("selectedLeague"),
        showdownName: document.getElementById("dashboardShowdownName"),
        league: document.getElementById("dashboardLeague"),
        round: document.getElementById("dashboardRound"),
        status: document.getElementById("dashboardStatus"),
        transferStatus: document.getElementById("dashboardTransferStatus"),
        managerOne: document.getElementById("dashboardManagerOne"),
        managerTwo: document.getElementById("dashboardManagerTwo"),
        clubOne: document.getElementById("dashboardClubOne"),
        clubTwo: document.getElementById("dashboardClubTwo"),
        scoreOne: document.getElementById("dashboardScoreOne"),
        scoreTwo: document.getElementById("dashboardScoreTwo"),
        lastPositionOne: document.getElementById("dashboardPositionOne"),
        lastPositionTwo: document.getElementById("dashboardPositionTwo"),
        primaryButton: document.getElementById("seasonPrimaryAction"),
        integrity: document.getElementById("dashboardIntegrityStatus")
    };
    return dashboardUI;
}

function getDashboardUI(){
    return dashboardUI || cacheDashboardUI();
}

function setDashboardTextIfChanged(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){
        element.textContent = next;
    }
}

function initializeShowdownUI(){
    const startButton = document.getElementById("startShowdown");
    if(startButton && startButton.dataset.showdownUiBound !== "true"){
        startButton.dataset.showdownUiBound = "true";
        startButton.addEventListener("click", createShowdown);
    }

    ensureActiveShowdownDeleteControl();
    ensureDashboardIntegrityStatus();
    cacheDashboardUI();
    updateVersionLabel();
}

function updateVersionLabel(){
    const footer = document.querySelector("footer");
    if(footer){
        const version = typeof APP_VERSION === "string" ? APP_VERSION : "0.15.0";
        footer.innerHTML = `Career Mode Showdown<br>v${version} · Original FIFA 17-era inspired visual system`;
    }
}

function ensureDashboardIntegrityStatus(){
    if(document.getElementById("dashboardIntegrityStatus")){ return; }
    const overview = document.querySelector("#dashboard .showdownOverview");
    if(!overview){ return; }
    const note = document.createElement("p");
    note.id = "dashboardIntegrityStatus";
    note.className = "stateNote hidden";
    overview.appendChild(note);
}

function ensureActiveShowdownDeleteControl(){
    if(document.getElementById("deleteActiveShowdown")){ return; }
    const actions = document.querySelector("#dashboard .dashboardActions");
    if(!actions){ return; }
    const button = document.createElement("button");
    button.type = "button";
    button.id = "deleteActiveShowdown";
    button.className = "backButton dangerButton";
    button.textContent = "DELETE CURRENT SHOWDOWN";
    button.addEventListener("click", deleteCurrentShowdownFromDashboard);
    actions.appendChild(button);
}

function deleteCurrentShowdownFromDashboard(){
    if(!currentShowdown && !hasSavedShowdown()){ return; }

    const saved = currentShowdown || loadSavedShowdown();
    const name = saved && saved.name ? saved.name : "the current showdown";
    const isCompleted = saved && saved.status === "Completed";
    const message = isCompleted
        ? `Delete the active copy of "${name}"? Its completed Legacy record will remain available.`
        : `Delete "${name}" and all of its unfinished progress? This cannot be undone.`;

    if(!window.confirm(message)){ return; }
    if(!clearSavedShowdown()){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The active showdown could not be deleted from browser storage.", "error");
        }
        return;
    }

    if(typeof stopTransferTimerLoop === "function"){
        stopTransferTimerLoop();
    }

    currentShowdown = null;
    screenHistory = [];
    setDashboardTextIfChanged(getDashboardUI().indicator, "No Active Showdown");
    showScreen("mainMenu", false);
}

function getCurrentTransferStatusLabel(){
    if(!currentShowdown || currentShowdown.status === "Completed"){ return ""; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status === "not_started"){ return "Transfer challenge: not started"; }
    if(challenge.status === "active"){ return "Transfer challenge: window live"; }
    if(challenge.status === "recording"){ return "Transfer challenge: record signings and guesses"; }
    return "Transfer challenge: complete";
}

function renderDashboardIntegrityStatus(){
    const note = getDashboardUI().integrity;
    if(!note || !currentShowdown){ return; }

    const warnings = Array.isArray(currentShowdown.integrityWarnings)
        ? currentShowdown.integrityWarnings
        : [];

    if(!warnings.length){
        setDashboardTextIfChanged(note, "");
        note.classList.add("hidden");
        note.classList.remove("locked");
        return;
    }

    setDashboardTextIfChanged(note, `SAVE WARNING: ${warnings.join(" ")}`);
    note.classList.remove("hidden");
    note.classList.add("locked");
}

function updateShowdownUI(){
    if(!currentShowdown){ return; }

    const ui = getDashboardUI();
    const completed = currentShowdown.status === "Completed";
    const leagueName = currentShowdown.selectedLeague
        ? currentShowdown.selectedLeague.name
        : null;
    const roundLabel = completed
        ? `${currentShowdown.rounds.length} seasons completed`
        : `Season ${currentShowdown.currentRound} of ${currentShowdown.totalRounds}`;
    const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];

    setDashboardTextIfChanged(
        ui.indicator,
        completed ? "Showdown Complete" : `Season ${currentShowdown.currentRound} / ${currentShowdown.totalRounds}`
    );
    setDashboardTextIfChanged(ui.selectedLeague, leagueName || "Spin to select league");
    setDashboardTextIfChanged(ui.showdownName, currentShowdown.name);
    setDashboardTextIfChanged(ui.league, leagueName || "League not selected");
    setDashboardTextIfChanged(ui.round, roundLabel);
    setDashboardTextIfChanged(ui.status, currentShowdown.status);
    setDashboardTextIfChanged(ui.transferStatus, getCurrentTransferStatusLabel());
    setDashboardTextIfChanged(ui.managerOne, currentShowdown.managers.playerOne);
    setDashboardTextIfChanged(ui.managerTwo, currentShowdown.managers.playerTwo);
    setDashboardTextIfChanged(ui.clubOne, currentShowdown.clubs.playerOne || "Club not assigned");
    setDashboardTextIfChanged(ui.clubTwo, currentShowdown.clubs.playerTwo || "Club not assigned");
    setDashboardTextIfChanged(ui.scoreOne, currentShowdown.score.playerOne);
    setDashboardTextIfChanged(ui.scoreTwo, currentShowdown.score.playerTwo);
    setDashboardTextIfChanged(
        ui.lastPositionOne,
        latestRound ? `Last league finish: ${latestRound.playerOne.leaguePosition}` : "No season completed"
    );
    setDashboardTextIfChanged(
        ui.lastPositionTwo,
        latestRound ? `Last league finish: ${latestRound.playerTwo.leaguePosition}` : "No season completed"
    );

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }

    renderDashboardIntegrityStatus();

    if(!ui.primaryButton){ return; }
    if(completed){
        if(!ui.primaryButton.disabled){ ui.primaryButton.disabled = true; }
        setDashboardTextIfChanged(ui.primaryButton, "SHOWDOWN COMPLETE — SAVED TO LEGACY");
        return;
    }

    if(ui.primaryButton.disabled){ ui.primaryButton.disabled = false; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    let primaryLabel;

    if(!challenge || challenge.status === "not_started"){
        primaryLabel = `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }else if(challenge.status === "active"){
        primaryLabel = `RESUME SEASON ${currentShowdown.currentRound} TRANSFER WINDOW`;
    }else if(challenge.status === "recording"){
        primaryLabel = `FINISH SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }else{
        primaryLabel = `ENTER SEASON ${currentShowdown.currentRound} RESULTS`;
    }

    setDashboardTextIfChanged(ui.primaryButton, primaryLabel);
}

window.initializeShowdownUI = initializeShowdownUI;
window.updateShowdownUI = updateShowdownUI;
