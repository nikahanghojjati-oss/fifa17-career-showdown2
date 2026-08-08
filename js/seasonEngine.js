/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.10.1
   Stabilized Season Entry and Progression Engine
===================================================== */

let seasonCompletionInProgress = false;

function initializeSeasonEngine(){
    const completeButton = document.getElementById("completeSeason");
    const nextButton = document.getElementById("nextSeasonAction");

    if(completeButton && completeButton.dataset.seasonEngineBound !== "true"){
        completeButton.dataset.seasonEngineBound = "true";
        completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(nextButton && nextButton.dataset.seasonEngineBound !== "true"){
        nextButton.dataset.seasonEngineBound = "true";
        nextButton.addEventListener("click", handleSeasonSummaryAction);
    }
}

function setSeasonEntryError(message = ""){
    const error = document.getElementById("seasonEntryError");
    if(error){
        error.textContent = message;
    }
}

function setSeasonCompletionBusy(isBusy){
    const button = document.getElementById("completeSeason");
    if(!button){
        return;
    }

    button.disabled = isBusy;
    button.classList.toggle("isBusy", isBusy);
    button.setAttribute("aria-busy", isBusy ? "true" : "false");
    button.textContent = isBusy ? "SAVING SEASON..." : "COMPLETE SEASON";
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

    currentShowdown = normalizeShowdown(currentShowdown);

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

    const title = document.getElementById("seasonEntryTitle");
    const managerOne = document.getElementById("seasonManagerOne");
    const managerTwo = document.getElementById("seasonManagerTwo");
    const clubOne = document.getElementById("seasonClubOne");
    const clubTwo = document.getElementById("seasonClubTwo");

    if(title){
        title.textContent = `SEASON ${currentShowdown.currentRound} RESULTS`;
    }

    if(managerOne){ managerOne.textContent = currentShowdown.managers.playerOne; }
    if(managerTwo){ managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo; }

    setSeasonEntryError("");
    resetSeasonEntryFields();
    showScreen("seasonEntry");
}

function resetSeasonEntryFields(){
    ["p1", "p2"].forEach(prefix => {
        ["LeaguePosition", "LeaguePoints", "LeagueGoals"].forEach(field => {
            const input = document.getElementById(`${prefix}${field}`);
            if(input){ input.value = ""; }
        });

        ["DomesticCup", "ChampionsLeague", "TopScorer", "TopAssist"].forEach(field => {
            const checkbox = document.getElementById(`${prefix}${field}`);
            if(checkbox){ checkbox.checked = false; }
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

function validateSeasonEntry(prefix){
    const positionInput = getSeasonInput(prefix, "LeaguePosition");
    const pointsInput = getSeasonInput(prefix, "LeaguePoints");
    const goalsInput = getSeasonInput(prefix, "LeagueGoals");

    if(!positionInput || !pointsInput || !goalsInput){
        return false;
    }

    if(positionInput.value === "" || pointsInput.value === "" || goalsInput.value === ""){
        return false;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);

    return Number.isInteger(position)
        && position >= 1
        && Number.isFinite(points)
        && points >= 0
        && Number.isFinite(goals)
        && goals >= 0;
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
    currentShowdown.rounds.push(roundRecord);
    recalculateShowdownScores(currentShowdown);

    if(seasonNumber >= currentShowdown.totalRounds){
        currentShowdown.status = "Completed";
        currentShowdown.completedAt = new Date().toISOString();
    }else{
        currentShowdown.currentRound = seasonNumber + 1;
        currentShowdown.status = "Ready";
    }

    touchCurrentShowdown();

    if(!saveCurrentShowdown()){
        currentShowdown.rounds = currentShowdown.rounds.filter(
            round => Number(round.roundNumber) !== Number(seasonNumber)
        );
        currentShowdown.currentRound = seasonNumber;
        currentShowdown.status = "Ready";
        currentShowdown.completedAt = null;
        recalculateShowdownScores(currentShowdown);
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

    currentShowdown = normalizeShowdown(currentShowdown);

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

    if(!validateSeasonEntry("p1") || !validateSeasonEntry("p2")){
        setSeasonEntryError("Enter a valid league position, league points and league goals for both managers.");
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

    const title = document.getElementById("seasonSummaryTitle");
    const result = document.getElementById("seasonSummaryResult");
    const overall = document.getElementById("seasonOverallScore");
    const nextButton = document.getElementById("nextSeasonAction");

    if(title){
        title.textContent = `SEASON ${roundRecord.roundNumber} SUMMARY`;
    }

    if(result){
        if(roundRecord.winner === "playerOne"){
            result.textContent = `${currentShowdown.managers.playerOne} wins the season`;
        }else if(roundRecord.winner === "playerTwo"){
            result.textContent = `${currentShowdown.managers.playerTwo} wins the season`;
        }else{
            result.textContent = "Season finishes level";
        }
    }

    renderManagerSeasonSummary(
        document.getElementById("seasonSummaryOne"),
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );

    renderManagerSeasonSummary(
        document.getElementById("seasonSummaryTwo"),
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    if(overall){
        overall.textContent = `${currentShowdown.managers.playerOne} ${currentShowdown.score.playerOne}  •  ${currentShowdown.score.playerTwo} ${currentShowdown.managers.playerTwo}`;
    }

    if(nextButton){
        nextButton.textContent = currentShowdown.status === "Completed"
            ? "VIEW COMPLETED SHOWDOWN"
            : `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`;
    }
}

function renderManagerSeasonSummary(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){
        return;
    }

    container.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    container.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    container.appendChild(club);

    appendSummaryLine(container, "League Position", playerRecord.leaguePosition);
    appendSummaryLine(container, "League Points", playerRecord.leaguePoints);
    appendSummaryLine(container, "League Goals", playerRecord.leagueGoals);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        if(points > 0){
            appendSummaryLine(container, label, `+${points}`);
        }
    });

    const total = document.createElement("div");
    total.className = "summaryTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    container.appendChild(total);
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

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initializeSeasonEngine, { once: true });
}else{
    initializeSeasonEngine();
}
