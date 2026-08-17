/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Lightweight Showdown Home and Completion Hub
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
        seriesStatus: document.getElementById("dashboardSeriesStatus"),
        lastSeasonSummary: document.getElementById("dashboardLastSeasonSummary"),
        lastSeasonLabel: document.getElementById("dashboardLastSeasonLabel"),
        lastSeasonResult: document.getElementById("dashboardLastSeasonResult"),
        lastPositionOne: document.getElementById("dashboardPositionOne"),
        lastPositionTwo: document.getElementById("dashboardPositionTwo"),
        primaryButton: document.getElementById("seasonPrimaryAction"),
        integrity: document.getElementById("dashboardIntegrityStatus"),
        completionHub: document.getElementById("completedShowdownHub"),
        completionTitle: document.getElementById("completedShowdownTitle"),
        completionResult: document.getElementById("completedShowdownResult"),
        completionMeta: document.getElementById("completedShowdownMeta")
    };
    return dashboardUI;
}

function getDashboardUI(){
    return dashboardUI || cacheDashboardUI();
}

function setDashboardTextIfChanged(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function createCompletionAction(label, handler, className = "menuButton"){
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
}

function ensureCompletionHub(){
    if(document.getElementById("completedShowdownHub")){ return; }

    const dashboard = document.getElementById("dashboard");
    const playerCards = dashboard ? dashboard.querySelector(".playerCards") : null;
    const actions = dashboard ? dashboard.querySelector(".dashboardActions") : null;
    if(!dashboard || !playerCards || !actions){ return; }

    const hub = document.createElement("section");
    hub.id = "completedShowdownHub";
    hub.className = "completionHub hidden";

    const title = document.createElement("h3");
    title.id = "completedShowdownTitle";
    title.textContent = "SHOWDOWN COMPLETE";

    const result = document.createElement("p");
    result.id = "completedShowdownResult";
    const meta = document.createElement("p");
    meta.id = "completedShowdownMeta";

    const hubActions = document.createElement("div");
    hubActions.className = "completionHubActions";
    hubActions.append(
        createCompletionAction("VIEW LEGACY", () => window.openOptionalModule && window.openOptionalModule("legacy")),
        createCompletionAction("TROPHY ROOM", () => window.openOptionalModule && window.openOptionalModule("trophyRoom")),
        createCompletionAction("RIVALRY STATISTICS", () => window.openOptionalModule && window.openOptionalModule("statistics")),
        createCompletionAction("NEW SHOWDOWN", () => window.navigateTo && window.navigateTo("createShowdown")),
        createCompletionAction("MAIN MENU", () => window.navigateTo && window.navigateTo("mainMenu", { addToHistory: false }), "backButton")
    );

    hub.append(title, result, meta, hubActions);
    dashboard.insertBefore(hub, actions);
    dashboardUI = null;
}

function ensurePhaseCHomeStyles(){
    if(document.getElementById("phaseCHomeStyles")){ return; }
    const style = document.createElement("style");
    style.id = "phaseCHomeStyles";
    style.textContent = [
        ".showdownScoreboard{display:flex;flex-direction:column;gap:8px;padding:12px 18px;margin-bottom:14px}",
        ".seriesStatusRow{display:flex;justify-content:center}",
        ".seriesStatusChip{display:inline-flex;align-items:center;min-height:22px;padding:4px 10px;font:800 9px/1 var(--f17-display);letter-spacing:1.2px;text-transform:uppercase;color:#e5ecef;background:#4b5962}",
        ".seriesStatusChip.series-lead-one{color:#fff;background:var(--f17-blue)}",
        ".seriesStatusChip.series-lead-two{color:var(--f17-ink);background:var(--f17-yellow)}",
        ".scoreboardScores{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:22px}",
        ".scoreboardScores div:not(.scoreDivider){display:flex;flex-direction:column;align-items:center}",
        ".scoreboardScores span{font:800 52px/.88 var(--f17-display);color:var(--f17-yellow)}",
        ".scoreboardScores small{margin-top:5px;color:#c2ccd3;font-size:8px;letter-spacing:1.4px}",
        ".lastSeasonSummary{width:min(570px,90vw);margin:0 auto 12px;padding:8px 12px;background:var(--f17-panel);border-left:5px solid var(--f17-cyan);box-shadow:var(--f17-shadow-soft)}",
        ".lastSeasonSummary.hidden{display:none}",
        ".lastSeasonLabel{margin:0;color:#596873;font:700 9px/1 var(--f17-display);letter-spacing:1.2px;text-transform:uppercase}",
        ".lastSeasonResult{margin:0;color:var(--f17-ink);font:700 13px/1.3 var(--f17-display)}"
    ].join("");
    document.head.appendChild(style);
}

function initializeShowdownUI(){
    ensurePhaseCHomeStyles();
    ensureActiveShowdownDeleteControl();
    ensureDashboardIntegrityStatus();
    ensureCompletionHub();
    cacheDashboardUI();
    updateVersionLabel();
}

function updateVersionLabel(){
    const footer = document.querySelector("footer");
    if(footer){
        const version = typeof APP_VERSION === "string" ? APP_VERSION : "1.0.1";
        footer.innerHTML = `Career Mode Showdown<br>v${version} · Stable`;
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

    if(typeof window.stopTransferTimerLoop === "function"){ window.stopTransferTimerLoop(); }
    if(typeof window.resetTransientSelectionOperations === "function"){ window.resetTransientSelectionOperations(); }
    if(typeof window.resetNavigationState === "function"){ window.resetNavigationState(); }

    currentShowdown = null;
    if(typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
    showScreen("mainMenu", false);
}

function getTransferPhaseForDashboard(challenge){
    if(!challenge){ return "window"; }
    if(typeof window.normalizeTransferChallengePhase === "function"){
        return window.normalizeTransferChallengePhase(challenge);
    }
    if(challenge.status === "completed"){ return "completed"; }
    if(challenge.status === "recording" && challenge.phase === "signing_entry"){ return "signing_entry"; }
    if(challenge.status === "recording"){ return "guess_entry"; }
    return "window";
}

function getCurrentTransferStatusLabel(){
    if(!currentShowdown || currentShowdown.status === "Completed"){ return ""; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status === "not_started"){ return "Transfer challenge: not started"; }
    if(challenge.status === "active"){ return "Transfer challenge: window live"; }
    if(challenge.status === "recording"){
        return getTransferPhaseForDashboard(challenge) === "signing_entry"
            ? "Transfer challenge: signing entry"
            : "Transfer challenge: guess entry";
    }
    return "Transfer challenge: complete";
}

function renderDashboardIntegrityStatus(){
    const note = getDashboardUI().integrity;
    if(!note || !currentShowdown){ return; }
    const warnings = Array.isArray(currentShowdown.integrityWarnings) ? currentShowdown.integrityWarnings : [];

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

function getCompletedShowdownResultText(){
    const winner = typeof getShowdownWinner === "function" ? getShowdownWinner(currentShowdown) : "draw";
    if(winner === "playerOne"){ return `${currentShowdown.managers.playerOne} wins the showdown`; }
    if(winner === "playerTwo"){ return `${currentShowdown.managers.playerTwo} wins the showdown`; }
    return "The showdown finishes level";
}

function isCurrentShowdownArchived(){
    if(!currentShowdown || currentShowdown.status !== "Completed" || typeof loadLegacyShowdowns !== "function"){
        return false;
    }
    try{
        return loadLegacyShowdowns().some(showdown => showdown && String(showdown.id) === String(currentShowdown.id));
    }catch(error){ return false; }
}

function renderCompletionHub(completed){
    const ui = getDashboardUI();
    if(!ui.completionHub){ return; }
    ui.completionHub.classList.toggle("hidden", !completed);
    if(!completed){ return; }

    const archiveStatus = isCurrentShowdownArchived()
        ? "Saved to Legacy"
        : "Active save retained · Legacy sync pending";

    setDashboardTextIfChanged(ui.completionTitle, "SHOWDOWN COMPLETE");
    setDashboardTextIfChanged(ui.completionResult, getCompletedShowdownResultText());
    setDashboardTextIfChanged(
        ui.completionMeta,
        `${currentShowdown.rounds.length} season${currentShowdown.rounds.length === 1 ? "" : "s"} completed · Final score ${currentShowdown.score.playerOne} - ${currentShowdown.score.playerTwo} · ${archiveStatus}`
    );
}

function getSeriesStatusPresentation(showdown){
    if(!showdown || !showdown.score){
        return { label: "LEVEL", className: "series-level" };
    }
    const one = Number(showdown.score.playerOne) || 0;
    const two = Number(showdown.score.playerTwo) || 0;
    if(one > two){
        const name = (showdown.managers && showdown.managers.playerOne) ? showdown.managers.playerOne : "MANAGER 1";
        return { label: `${String(name).toUpperCase()} LEADS`, className: "series-lead-one" };
    }
    if(two > one){
        const name = (showdown.managers && showdown.managers.playerTwo) ? showdown.managers.playerTwo : "MANAGER 2";
        return { label: `${String(name).toUpperCase()} LEADS`, className: "series-lead-two" };
    }
    if(showdown.status === "Completed"){
        return { label: "SHOWDOWN LEVEL", className: "series-level" };
    }
    return { label: "LEVEL", className: "series-level" };
}

function getLastSeasonSummaryText(showdown){
    if(!showdown || !Array.isArray(showdown.rounds) || showdown.rounds.length === 0){
        return null;
    }
    const latest = showdown.rounds[showdown.rounds.length - 1];
    if(!latest || !latest.playerOne || !latest.playerTwo){
        return null;
    }
    const seasonNumber = latest.roundNumber || showdown.rounds.length;
    const oneTotal = latest.playerOne.scoring && typeof latest.playerOne.scoring.total === "number"
        ? latest.playerOne.scoring.total
        : null;
    const twoTotal = latest.playerTwo.scoring && typeof latest.playerTwo.scoring.total === "number"
        ? latest.playerTwo.scoring.total
        : null;
    const oneName = (showdown.managers && showdown.managers.playerOne) ? showdown.managers.playerOne : "Manager 1";
    const twoName = (showdown.managers && showdown.managers.playerTwo) ? showdown.managers.playerTwo : "Manager 2";

    let outcome = "Draw";
    if(latest.winner === "playerOne"){ outcome = `${oneName} won`; }
    else if(latest.winner === "playerTwo"){ outcome = `${twoName} won`; }

    if(oneTotal !== null && twoTotal !== null){
        return `Season ${seasonNumber}: ${oneTotal}–${twoTotal} · ${outcome}`;
    }
    return `Season ${seasonNumber}: ${outcome}`;
}

function renderSeriesStatus(showdown){
    const ui = getDashboardUI();
    if(!ui.seriesStatus){ return; }
    const presentation = getSeriesStatusPresentation(showdown);
    setDashboardTextIfChanged(ui.seriesStatus, presentation.label);
    ui.seriesStatus.className = `seriesStatusChip ${presentation.className}`;
}

function renderLastSeasonSummary(showdown){
    const ui = getDashboardUI();
    if(!ui.lastSeasonSummary || !ui.lastSeasonResult){ return; }
    const summary = getLastSeasonSummaryText(showdown);
    if(!summary){
        ui.lastSeasonSummary.classList.add("hidden");
        setDashboardTextIfChanged(ui.lastSeasonResult, "—");
        return;
    }
    const seasonCount = Array.isArray(showdown.rounds) ? showdown.rounds.length : 0;
    setDashboardTextIfChanged(ui.lastSeasonLabel, seasonCount === 1 ? "LAST SEASON" : `AFTER ${seasonCount} SEASONS`);
    setDashboardTextIfChanged(ui.lastSeasonResult, summary);
    ui.lastSeasonSummary.classList.remove("hidden");
}

function updateShowdownUI(){
    if(!currentShowdown){ return; }

    const ui = getDashboardUI();
    const completed = currentShowdown.status === "Completed";
    const leagueName = currentShowdown.selectedLeague ? currentShowdown.selectedLeague.name : null;
    const completedSeasonCount = Array.isArray(currentShowdown.rounds) ? currentShowdown.rounds.length : 0;
    const roundLabel = completed
        ? `${completedSeasonCount} ${completedSeasonCount === 1 ? "season" : "seasons"} completed`
        : `Season ${currentShowdown.currentRound} of ${currentShowdown.totalRounds}`;
    const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];

    setDashboardTextIfChanged(ui.indicator, completed ? "Showdown Complete" : `Season ${currentShowdown.currentRound} / ${currentShowdown.totalRounds}`);
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
    setDashboardTextIfChanged(ui.lastPositionOne, latestRound ? `Last league finish: ${latestRound.playerOne.leaguePosition}` : "No season completed");
    setDashboardTextIfChanged(ui.lastPositionTwo, latestRound ? `Last league finish: ${latestRound.playerTwo.leaguePosition}` : "No season completed");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }

    renderSeriesStatus(currentShowdown);
    renderLastSeasonSummary(currentShowdown);
    renderDashboardIntegrityStatus();
    renderCompletionHub(completed);

    if(!ui.primaryButton){ return; }
    if(ui.primaryButton.disabled){ ui.primaryButton.disabled = false; }

    if(completed){
        setDashboardTextIfChanged(ui.primaryButton, "VIEW COMPLETED SHOWDOWN");
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    let primaryLabel;

    if(!challenge || challenge.status === "not_started"){
        primaryLabel = `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }else if(challenge.status === "active"){
        primaryLabel = `RESUME SEASON ${currentShowdown.currentRound} TRANSFER WINDOW`;
    }else if(challenge.status === "recording"){
        primaryLabel = getTransferPhaseForDashboard(challenge) === "signing_entry"
            ? `ENTER SEASON ${currentShowdown.currentRound} SIGNINGS`
            : `ENTER SEASON ${currentShowdown.currentRound} GUESSES`;
    }else{
        primaryLabel = `ENTER SEASON ${currentShowdown.currentRound} RESULTS`;
    }

    setDashboardTextIfChanged(ui.primaryButton, primaryLabel);
}

window.initializeShowdownUI = initializeShowdownUI;
window.updateShowdownUI = updateShowdownUI;
