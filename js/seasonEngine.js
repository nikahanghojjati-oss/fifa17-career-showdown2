/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.9.0
   Season Entry and Progression Engine
===================================================== */

function initializeSeasonEngine(){
    const completeButton = document.getElementById("completeSeason");
    const nextButton = document.getElementById("nextSeasonAction");

    if(completeButton){
        completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(nextButton){
        nextButton.addEventListener("click", handleSeasonSummaryAction);
    }
}

function openSeasonEntry(){
    if(!currentShowdown){
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
    const error = document.getElementById("seasonEntryError");

    if(title){
        title.textContent = `SEASON ${currentShowdown.currentRound} RESULTS`;
    }

    if(managerOne){ managerOne.textContent = currentShowdown.managers.playerOne; }
    if(managerTwo){ managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo; }
    if(error){ error.textContent = ""; }

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

function readSeasonResult(prefix){
    return {
        leaguePosition: Number(document.getElementById(`${prefix}LeaguePosition`).value),
        leaguePoints: Number(document.getElementById(`${prefix}LeaguePoints`).value),
        leagueGoals: Number(document.getElementById(`${prefix}LeagueGoals`).value),
        domesticCup: document.getElementById(`${prefix}DomesticCup`).checked,
        championsLeague: document.getElementById(`${prefix}ChampionsLeague`).checked,
        topScorer: document.getElementById(`${prefix}TopScorer`).checked,
        topAssist: document.getElementById(`${prefix}TopAssist`).checked
    };
}

function validateSeasonEntry(prefix){
    const positionInput = document.getElementById(`${prefix}LeaguePosition`);
    const pointsInput = document.getElementById(`${prefix}LeaguePoints`);
    const goalsInput = document.getElementById(`${prefix}LeagueGoals`);

    if(!positionInput.value || !pointsInput.value || !goalsInput.value){
        return false;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);

    return Number.isInteger(position) && position >= 1 && Number.isFinite(points) && points >= 0 && Number.isFinite(goals) && goals >= 0;
}

function completeCurrentSeason(){
    if(!currentShowdown || currentShowdown.status === "Completed"){
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        openTransferChallenge();
        return;
    }

    const error = document.getElementById("seasonEntryError");

    if(!validateSeasonEntry("p1") || !validateSeasonEntry("p2")){
        if(error){
            error.textContent = "Enter league position, league points and league goals for both managers.";
        }
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    const seasonNumber = currentShowdown.currentRound;
    const alreadyCompleted = currentShowdown.rounds.some(round => round.roundNumber === seasonNumber);

    if(alreadyCompleted){
        if(error){
            error.textContent = "This season has already been completed.";
        }
        return;
    }

    const playerOne = readSeasonResult("p1");
    const playerTwo = readSeasonResult("p2");

    playerOne.scoring = calculatePlayerSeasonScore(playerOne);
    playerTwo.scoring = calculatePlayerSeasonScore(playerTwo);

    const roundRecord = {
        roundNumber: seasonNumber,
        completedAt: new Date().toISOString(),
        transferChallengeSeason: seasonNumber,
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    };

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
    saveCurrentShowdown();

    if(currentShowdown.status === "Completed"){
        archiveShowdown(currentShowdown);
    }

    updateShowdownUI();
    renderSeasonSummary(roundRecord);
    showScreen("seasonSummary");
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
    if(!container){
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

document.addEventListener("DOMContentLoaded", initializeSeasonEngine);
