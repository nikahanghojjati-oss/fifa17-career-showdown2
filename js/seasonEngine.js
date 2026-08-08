/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Stabilized Season Entry and Progression Engine
===================================================== */

let seasonCompletionInProgress = false;
let seasonEntryRenderedRound = null;
let seasonEntryRenderedShowdownId = null;
let seasonUI = null;

function cacheSeasonUI(){
    seasonUI = {
        completeButton: document.getElementById("completeSeason"),
        nextButton: document.getElementById("nextSeasonAction"),
        entryError: document.getElementById("seasonEntryError"),
        entryTitle: document.getElementById("seasonEntryTitle"),
        managerOne: document.getElementById("seasonManagerOne"),
        managerTwo: document.getElementById("seasonManagerTwo"),
        clubOne: document.getElementById("seasonClubOne"),
        clubTwo: document.getElementById("seasonClubTwo"),
        summaryTitle: document.getElementById("seasonSummaryTitle"),
        summaryResult: document.getElementById("seasonSummaryResult"),
        overall: document.getElementById("seasonOverallScore"),
        summaryOne: document.getElementById("seasonSummaryOne"),
        summaryTwo: document.getElementById("seasonSummaryTwo")
    };
    return seasonUI;
}

function getSeasonUI(){
    return seasonUI || cacheSeasonUI();
}

function setSeasonText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function initializeSeasonEngine(){
    const ui = cacheSeasonUI();

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        ui.completeButton.dataset.seasonEngineBound = "true";
        ui.completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(ui.nextButton && ui.nextButton.dataset.seasonEngineBound !== "true"){
        ui.nextButton.dataset.seasonEngineBound = "true";
        ui.nextButton.addEventListener("click", handleSeasonSummaryAction);
    }
}

function setSeasonEntryError(message = ""){
    setSeasonText(getSeasonUI().entryError, message);
}

function setSeasonCompletionBusy(isBusy){
    const button = getSeasonUI().completeButton;
    if(!button){
        return;
    }

    button.disabled = isBusy;
    button.classList.toggle("isBusy", isBusy);
    button.setAttribute("aria-busy", isBusy ? "true" : "false");
    setSeasonText(button, isBusy ? "SAVING SEASON..." : "COMPLETE SEASON");
}

function reportSeasonError(message, error){
    console.error(`[Career Mode Showdown] ${message}:`, error);
    setSeasonEntryError(`${message}. ${error && error.message ? error.message : "Please try again."}`);

    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error);
    }
}

function openSeasonEntry(){
    if(!currentShowdown){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No active showdown is available.", "error");
        }
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        openTransferChallenge();
        return;
    }

    const ui = getSeasonUI();
    const currentRound = Number(currentShowdown.currentRound);
    const currentShowdownId = String(currentShowdown.id);

    setSeasonText(ui.entryTitle, `SEASON ${currentRound} RESULTS`);
    setSeasonText(ui.managerOne, currentShowdown.managers.playerOne);
    setSeasonText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setSeasonText(ui.clubOne, currentShowdown.clubs.playerOne);
    setSeasonText(ui.clubTwo, currentShowdown.clubs.playerTwo);

    if(
        seasonEntryRenderedRound !== currentRound
        || String(seasonEntryRenderedShowdownId) !== currentShowdownId
    ){
        resetSeasonEntryFields();
        seasonEntryRenderedRound = currentRound;
        seasonEntryRenderedShowdownId = currentShowdownId;
    }

    setSeasonEntryError("");
    showScreen("seasonEntry");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function resetSeasonEntryFields(){
    ["p1", "p2"].forEach(prefix => {
        ["LeaguePosition", "LeaguePoints", "LeagueGoals"].forEach(field => {
            const input = document.getElementById(`${prefix}${field}`);
            if(input && input.value !== ""){ input.value = ""; }
        });

        ["DomesticCup", "ChampionsLeague", "TopScorer", "TopAssist"].forEach(field => {
            const checkbox = document.getElementById(`${prefix}${field}`);
            if(checkbox && checkbox.checked){ checkbox.checked = false; }
        });
    });
}

function getSeasonInput(prefix, field){
    return document.getElementById(`${prefix}${field}`);
}

function readSeasonResult(prefix){
    const position = getSeasonInput(prefix, "LeaguePosition");
    const points = getSeasonInput(prefix, "LeaguePoints");
    const goals = getSeasonInput(prefix, "LeagueGoals");
    const domesticCup = getSeasonInput(prefix, "DomesticCup");
    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const topScorer = getSeasonInput(prefix, "TopScorer");
    const topAssist = getSeasonInput(prefix, "TopAssist");

    if(!position || !points || !goals || !domesticCup || !championsLeague || !topScorer || !topAssist){
        throw new Error(`Season form controls are missing for ${prefix}.`);
    }

    return {
        leaguePosition: Number(position.value),
        leaguePoints: Number(points.value),
        leagueGoals: Number(goals.value),
        domesticCup: domesticCup.checked,
        championsLeague: championsLeague.checked,
        topScorer: topScorer.checked,
        topAssist: topAssist.checked
    };
}

function getCurrentLeagueTeamCount(){
    if(!currentShowdown || !currentShowdown.selectedLeague || typeof getClubsForLeague !== "function"){
        return null;
    }

    const clubs = getClubsForLeague(currentShowdown.selectedLeague.id);
    return Array.isArray(clubs) && clubs.length ? clubs.length : null;
}

function getSeasonEntryValidationMessage(prefix, managerLabel){
    const positionInput = getSeasonInput(prefix, "LeaguePosition");
    const pointsInput = getSeasonInput(prefix, "LeaguePoints");
    const goalsInput = getSeasonInput(prefix, "LeagueGoals");

    if(!positionInput || !pointsInput || !goalsInput){
        return `${managerLabel}'s season form is incomplete.`;
    }

    if(positionInput.value === "" || pointsInput.value === "" || goalsInput.value === ""){
        return `Enter league position, league points and league goals for ${managerLabel}.`;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);
    const teamCount = getCurrentLeagueTeamCount();

    if(!Number.isInteger(position) || position < 1){
        return `${managerLabel}'s league position must be a whole number of 1 or higher.`;
    }

    if(teamCount && position > teamCount){
        return `${managerLabel}'s league position cannot be lower than ${teamCount}th in this league.`;
    }

    if(!Number.isInteger(points) || points < 0){
        return `${managerLabel}'s league points must be a non-negative whole number.`;
    }

    if(!Number.isInteger(goals) || goals < 0){
        return `${managerLabel}'s league goals must be a non-negative whole number.`;
    }

    return "";
}

function validateSeasonEntry(prefix){
    const label = prefix === "p1"
        ? (currentShowdown ? currentShowdown.managers.playerOne : "Manager 1")
        : (currentShowdown ? currentShowdown.managers.playerTwo : "Manager 2");

    return getSeasonEntryValidationMessage(prefix, label) === "";
}

function buildSeasonRecord(seasonNumber, playerOne, playerTwo){
    playerOne.scoring = calculatePlayerSeasonScore(playerOne);
    playerTwo.scoring = calculatePlayerSeasonScore(playerTwo);

    return {
        roundNumber: seasonNumber,
        completedAt: new Date().toISOString(),
        transferChallengeSeason: seasonNumber,
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    };
}

function persistCompletedSeason(roundRecord, seasonNumber){
    const previousState = {
        roundsLength: currentShowdown.rounds.length,
        currentRound: currentShowdown.currentRound,
        status: currentShowdown.status,
        completedAt: currentShowdown.completedAt,
        score: cloneForStorage(currentShowdown.score)
    };

    currentShowdown.rounds.push(roundRecord);
    recalculateShowdownScores(currentShowdown);

    if(seasonNumber >= currentShowdown.totalRounds){
        currentShowdown.status = "Completed";
        currentShowdown.completedAt = currentShowdown.completedAt || new Date().toISOString();
    }else{
        currentShowdown.currentRound = seasonNumber + 1;
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
        currentShowdown.rounds.length = previousState.roundsLength;
        currentShowdown.currentRound = previousState.currentRound;
        currentShowdown.status = previousState.status;
        currentShowdown.completedAt = previousState.completedAt;
        currentShowdown.score = previousState.score;
        throw new Error("The season could not be saved to browser storage.");
    }

    if(currentShowdown.status === "Completed"){
        const archived = archiveShowdown(currentShowdown);
        if(!archived && typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved, but the completed showdown could not be copied to Legacy. The active save is safe and can be archived again later.",
                "error",
                10000
            );
        }
    }
}

function completeCurrentSeason(){
    if(seasonCompletionInProgress){
        return;
    }

    if(!currentShowdown){
        setSeasonEntryError("No active showdown is available.");
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        setSeasonEntryError("Complete the current season's Transfer Challenge before submitting results.");
        return;
    }

    const playerOneValidation = getSeasonEntryValidationMessage(
        "p1",
        currentShowdown.managers.playerOne
    );
    if(playerOneValidation){
        setSeasonEntryError(playerOneValidation);
        return;
    }

    const playerTwoValidation = getSeasonEntryValidationMessage(
        "p2",
        currentShowdown.managers.playerTwo
    );
    if(playerTwoValidation){
        setSeasonEntryError(playerTwoValidation);
        return;
    }

    const seasonNumber = Number(currentShowdown.currentRound);
    const alreadyCompleted = currentShowdown.rounds.some(
        round => Number(round.roundNumber) === seasonNumber
    );

    if(alreadyCompleted){
        setSeasonEntryError("This season has already been completed. Return to Showdown Home to continue.");
        return;
    }

    seasonCompletionInProgress = true;
    setSeasonCompletionBusy(true);
    setSeasonEntryError("");

    let roundRecord = null;

    try{
        const playerOne = readSeasonResult("p1");
        const playerTwo = readSeasonResult("p2");
        roundRecord = buildSeasonRecord(seasonNumber, playerOne, playerTwo);
        persistCompletedSeason(roundRecord, seasonNumber);
        seasonEntryRenderedRound = null;
        seasonEntryRenderedShowdownId = null;
    }catch(error){
        reportSeasonError("Season completion failed", error);
        seasonCompletionInProgress = false;
        setSeasonCompletionBusy(false);
        return;
    }

    try{
        updateShowdownUI();
        renderSeasonSummary(roundRecord);

        if(!showScreen("seasonSummary")){
            throw new Error("The Season Summary screen could not be opened.");
        }

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(`Season ${seasonNumber} saved successfully.`, "success", 3500);
        }
    }catch(error){
        console.error("Season was saved but the summary screen failed to render:", error);
        setSeasonEntryError("Season saved successfully, but the summary screen could not be displayed. Return to Showdown Home or refresh to continue.");

        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Season saved, but the summary screen failed", error);
        }
    }finally{
        seasonCompletionInProgress = false;
        setSeasonCompletionBusy(false);
    }
}

function renderSeasonSummary(roundRecord){
    if(!currentShowdown || !roundRecord){
        return;
    }

    const ui = getSeasonUI();
    setSeasonText(ui.summaryTitle, `SEASON ${roundRecord.roundNumber} SUMMARY`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerOne} wins the season`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerTwo} wins the season`);
    }else{
        setSeasonText(ui.summaryResult, "Season finishes level");
    }

    renderManagerSeasonSummary(
        ui.summaryOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );

    renderManagerSeasonSummary(
        ui.summaryTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    setSeasonText(
        ui.overall,
        `${currentShowdown.managers.playerOne} ${currentShowdown.score.playerOne}  •  ${currentShowdown.score.playerTwo} ${currentShowdown.managers.playerTwo}`
    );

    if(ui.nextButton){
        setSeasonText(
            ui.nextButton,
            currentShowdown.status === "Completed"
                ? "VIEW COMPLETED SHOWDOWN"
                : `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`
        );
    }

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderManagerSeasonSummary(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){
        return;
    }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSummaryLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSummaryLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSummaryLine(fragment, "League Goals", playerRecord.leagueGoals);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        if(points > 0){
            appendSummaryLine(fragment, label, `+${points}`);
        }
    });

    const total = document.createElement("div");
    total.className = "summaryTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function appendSummaryLine(container, label, value){
    const row = document.createElement("div");
    row.className = "summaryLine";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    container.appendChild(row);
}

function handleSeasonSummaryAction(){
    if(!currentShowdown){
        return;
    }

    if(currentShowdown.status === "Completed"){
        updateShowdownUI();
        showScreen("dashboard");
        return;
    }

    openTransferChallenge();
}

window.initializeSeasonEngine = initializeSeasonEngine;
window.openSeasonEntry = openSeasonEntry;
window.completeCurrentSeason = completeCurrentSeason;
window.renderSeasonSummary = renderSeasonSummary;
