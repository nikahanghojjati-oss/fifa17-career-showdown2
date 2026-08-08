/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.7.0
   Showdown Interface Controller
===================================================== */

document.addEventListener("DOMContentLoaded", initializeShowdownUI);

function initializeShowdownUI(){
    const startButton = document.getElementById("startShowdown");
    if(startButton){
        startButton.addEventListener("click", createShowdown);
    }
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
    const managerOne = document.getElementById("dashboardManagerOne");
    const managerTwo = document.getElementById("dashboardManagerTwo");
    const clubOne = document.getElementById("dashboardClubOne");
    const clubTwo = document.getElementById("dashboardClubTwo");
    const scoreOne = document.getElementById("dashboardScoreOne");
    const scoreTwo = document.getElementById("dashboardScoreTwo");
    const lastPositionOne = document.getElementById("dashboardPositionOne");
    const lastPositionTwo = document.getElementById("dashboardPositionTwo");
    const enterButton = document.getElementById("enterSeasonResults");

    if(indicator){
        indicator.textContent = currentShowdown.status === "Completed"
            ? "Showdown Complete"
            : `Season ${currentShowdown.currentRound} / ${currentShowdown.totalRounds}`;
    }

    if(selectedLeague && currentShowdown.selectedLeague){
        selectedLeague.textContent = currentShowdown.selectedLeague.name;
    }

    if(showdownName){ showdownName.textContent = currentShowdown.name; }
    if(league){ league.textContent = currentShowdown.selectedLeague ? currentShowdown.selectedLeague.name : "League not selected"; }
    if(round){
        round.textContent = currentShowdown.status === "Completed"
            ? `${currentShowdown.totalRounds} seasons completed`
            : `Season ${currentShowdown.currentRound} of ${currentShowdown.totalRounds}`;
    }
    if(status){ status.textContent = currentShowdown.status; }

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

    if(enterButton){
        enterButton.disabled = currentShowdown.status === "Completed";
        enterButton.textContent = currentShowdown.status === "Completed"
            ? "SHOWDOWN COMPLETE"
            : `ENTER SEASON ${currentShowdown.currentRound} RESULTS`;
    }
}
