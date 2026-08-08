/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.11.0
   Showdown Interface Controller
===================================================== */

function initializeShowdownUI(){
    const startButton = document.getElementById("startShowdown");
    if(startButton && startButton.dataset.showdownUiBound !== "true"){
        startButton.dataset.showdownUiBound = "true";
        startButton.addEventListener("click", createShowdown);
    }

    ensureActiveShowdownDeleteControl();
    ensureDashboardIntegrityStatus();
    updateVersionLabel();
}

function updateVersionLabel(){
    const footer = document.querySelector("footer");
    if(footer){
        footer.innerHTML = "FIFA 17 Career Mode Showdown<br>v0.11.0 Rule Book & Core Integrity";
    }
}

function ensureDashboardIntegrityStatus(){
    if(document.getElementById("dashboardIntegrityStatus")){
        return;
    }

    const overview = document.querySelector("#dashboard .showdownOverview");
    if(!overview){
        return;
    }

    const note = document.createElement("p");
    note.id = "dashboardIntegrityStatus";
    note.className = "stateNote hidden";
    overview.appendChild(note);
}

function ensureActiveShowdownDeleteControl(){
    if(document.getElementById("deleteActiveShowdown")){
        return;
    }

    const actions = document.querySelector("#dashboard .dashboardActions");
    if(!actions){
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "deleteActiveShowdown";
    button.className = "backButton dangerButton";
    button.textContent = "DELETE CURRENT SHOWDOWN";
    button.addEventListener("click", deleteCurrentShowdownFromDashboard);
    actions.appendChild(button);
}

function deleteCurrentShowdownFromDashboard(){
    if(!currentShowdown && !hasSavedShowdown()){
        return;
    }

    const saved = currentShowdown || loadSavedShowdown();
    const name = saved && saved.name ? saved.name : "the current showdown";
    const isCompleted = saved && saved.status === "Completed";
    const message = isCompleted
        ? `Delete the active copy of "${name}"? Its completed Legacy record will remain available.`
        : `Delete "${name}" and all of its unfinished progress? This cannot be undone.`;

    if(!window.confirm(message)){
        return;
    }

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

    const indicator = document.getElementById("seasonIndicator");
    if(indicator){
        indicator.textContent = "No Active Showdown";
    }

    showScreen("mainMenu", false);
}

function getCurrentTransferStatusLabel(){
    if(!currentShowdown || currentShowdown.status === "Completed"){
        return "";
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);

    if(!challenge || challenge.status === "not_started"){
        return "Transfer challenge: not started";
    }

    if(challenge.status === "active"){
        return "Transfer challenge: window live";
    }

    if(challenge.status === "recording"){
        return "Transfer challenge: record signings and guesses";
    }

    return "Transfer challenge: complete";
}

function renderDashboardIntegrityStatus(){
    const note = document.getElementById("dashboardIntegrityStatus");
    if(!note || !currentShowdown){
        return;
    }

    const warnings = Array.isArray(currentShowdown.integrityWarnings)
        ? currentShowdown.integrityWarnings
        : [];

    if(!warnings.length){
        note.textContent = "";
        note.classList.add("hidden");
        return;
    }

    note.textContent = `SAVE WARNING: ${warnings.join(" ")}`;
    note.classList.remove("hidden");
    note.classList.add("locked");
}

function updateShowdownUI(){
    if(!currentShowdown){
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    const indicator = document.getElementById("seasonIndicator");
    const selectedLeague = document.getElementById("selectedLeague");
    const showdownName = document.getElementById("dashboardShowdownName");
    const league = document.getElementById("dashboardLeague");
    const round = document.getElementById("dashboardRound");
    const status = document.getElementById("dashboardStatus");
    const transferStatus = document.getElementById("dashboardTransferStatus");
    const managerOne = document.getElementById("dashboardManagerOne");
    const managerTwo = document.getElementById("dashboardManagerTwo");
    const clubOne = document.getElementById("dashboardClubOne");
    const clubTwo = document.getElementById("dashboardClubTwo");
    const scoreOne = document.getElementById("dashboardScoreOne");
    const scoreTwo = document.getElementById("dashboardScoreTwo");
    const lastPositionOne = document.getElementById("dashboardPositionOne");
    const lastPositionTwo = document.getElementById("dashboardPositionTwo");
    const primaryButton = document.getElementById("seasonPrimaryAction");

    if(indicator){
        indicator.textContent = currentShowdown.status === "Completed"
            ? "Showdown Complete"
            : `Season ${currentShowdown.currentRound} / ${currentShowdown.totalRounds}`;
    }

    if(selectedLeague){
        selectedLeague.textContent = currentShowdown.selectedLeague
            ? currentShowdown.selectedLeague.name
            : "Spin to select league";
    }

    if(showdownName){ showdownName.textContent = currentShowdown.name; }
    if(league){ league.textContent = currentShowdown.selectedLeague ? currentShowdown.selectedLeague.name : "League not selected"; }
    if(round){
        round.textContent = currentShowdown.status === "Completed"
            ? `${currentShowdown.rounds.length} seasons completed`
            : `Season ${currentShowdown.currentRound} of ${currentShowdown.totalRounds}`;
    }
    if(status){ status.textContent = currentShowdown.status; }
    if(transferStatus){ transferStatus.textContent = getCurrentTransferStatusLabel(); }

    if(managerOne){ managerOne.textContent = currentShowdown.managers.playerOne; }
    if(managerTwo){ managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne || "Club not assigned"; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo || "Club not assigned"; }
    if(scoreOne){ scoreOne.textContent = currentShowdown.score.playerOne; }
    if(scoreTwo){ scoreTwo.textContent = currentShowdown.score.playerTwo; }

    const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
    if(lastPositionOne){
        lastPositionOne.textContent = latestRound ? `Last league finish: ${latestRound.playerOne.leaguePosition}` : "No season completed";
    }
    if(lastPositionTwo){
        lastPositionTwo.textContent = latestRound ? `Last league finish: ${latestRound.playerTwo.leaguePosition}` : "No season completed";
    }

    renderDashboardIntegrityStatus();

    if(primaryButton){
        if(currentShowdown.status === "Completed"){
            primaryButton.disabled = true;
            primaryButton.textContent = "SHOWDOWN COMPLETE — SAVED TO LEGACY";
            return;
        }

        primaryButton.disabled = false;
        const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);

        if(!challenge || challenge.status === "not_started"){
            primaryButton.textContent = `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
        }else if(challenge.status === "active"){
            primaryButton.textContent = `RESUME SEASON ${currentShowdown.currentRound} TRANSFER WINDOW`;
        }else if(challenge.status === "recording"){
            primaryButton.textContent = `FINISH SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
        }else{
            primaryButton.textContent = `ENTER SEASON ${currentShowdown.currentRound} RESULTS`;
        }
    }
}

window.initializeShowdownUI = initializeShowdownUI;
window.updateShowdownUI = updateShowdownUI;
