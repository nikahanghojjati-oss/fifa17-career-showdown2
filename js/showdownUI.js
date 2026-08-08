/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
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
        footer.innerHTML = "FIFA 17 Career Mode Showdown<br>v0.12.0 Performance & Stability";
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
    const ui = getDashboardUI();
    if(ui.indicator){ ui.indicator.textContent = "No Active Showdown"; }
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
        note.textContent = "";
        note.classList.add("hidden");
        note.classList.remove("locked");
        return;
    }

    note.textContent = `SAVE WARNING: ${warnings.join(" ")}`;
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

    if(ui.indicator){
        ui.indicator.textContent = completed
            ? "Showdown Complete"
            : `Season ${currentShowdown.currentRound} / ${currentShowdown.totalRounds}`;
    }
    if(ui.selectedLeague){ ui.selectedLeague.textContent = leagueName || "Spin to select league"; }
    if(ui.showdownName){ ui.showdownName.textContent = currentShowdown.name; }
    if(ui.league){ ui.league.textContent = leagueName || "League not selected"; }
    if(ui.round){
        ui.round.textContent = completed
            ? `${currentShowdown.rounds.length} seasons completed`
            : `Season ${currentShowdown.currentRound} of ${currentShowdown.totalRounds}`;
    }
    if(ui.status){ ui.status.textContent = currentShowdown.status; }
    if(ui.transferStatus){ ui.transferStatus.textContent = getCurrentTransferStatusLabel(); }
    if(ui.managerOne){ ui.managerOne.textContent = currentShowdown.managers.playerOne; }
    if(ui.managerTwo){ ui.managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(ui.clubOne){ ui.clubOne.textContent = currentShowdown.clubs.playerOne || "Club not assigned"; }
    if(ui.clubTwo){ ui.clubTwo.textContent = currentShowdown.clubs.playerTwo || "Club not assigned"; }
    if(ui.scoreOne){ ui.scoreOne.textContent = currentShowdown.score.playerOne; }
    if(ui.scoreTwo){ ui.scoreTwo.textContent = currentShowdown.score.playerTwo; }

    const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
    if(ui.lastPositionOne){
        ui.lastPositionOne.textContent = latestRound
            ? `Last league finish: ${latestRound.playerOne.leaguePosition}`
            : "No season completed";
    }
    if(ui.lastPositionTwo){
        ui.lastPositionTwo.textContent = latestRound
            ? `Last league finish: ${latestRound.playerTwo.leaguePosition}`
            : "No season completed";
    }

    renderDashboardIntegrityStatus();

    if(!ui.primaryButton){ return; }
    if(completed){
        ui.primaryButton.disabled = true;
        ui.primaryButton.textContent = "SHOWDOWN COMPLETE — SAVED TO LEGACY";
        return;
    }

    ui.primaryButton.disabled = false;
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status === "not_started"){
        ui.primaryButton.textContent = `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }else if(challenge.status === "active"){
        ui.primaryButton.textContent = `RESUME SEASON ${currentShowdown.currentRound} TRANSFER WINDOW`;
    }else if(challenge.status === "recording"){
        ui.primaryButton.textContent = `FINISH SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }else{
        ui.primaryButton.textContent = `ENTER SEASON ${currentShowdown.currentRound} RESULTS`;
    }
}

window.initializeShowdownUI = initializeShowdownUI;
window.updateShowdownUI = updateShowdownUI;
