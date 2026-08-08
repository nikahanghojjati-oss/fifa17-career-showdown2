/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1

   Showdown Manager
===================================================== */

let currentShowdown = null;

function createShowdown(){
    const showdownName = document.getElementById("showdownName").value.trim();
    const managerOne = document.getElementById("managerOne").value.trim();
    const managerTwo = document.getElementById("managerTwo").value.trim();
    const roundAmount = Number(document.getElementById("roundAmount").value);

    currentShowdown = {
        id: Date.now(),
        name: showdownName || "Unnamed Showdown",
        managers: {
            playerOne: managerOne || "Manager 1",
            playerTwo: managerTwo || "Manager 2"
        },
        totalRounds: roundAmount,
        currentRound: 1,
        status: "Created",
        selectedLeague: null,
        clubs: {
            playerOne: null,
            playerTwo: null
        },
        score: {
            playerOne: 0,
            playerTwo: 0
        },
        rounds: []
    };

    saveCurrentShowdown();
    showScreen("leagueWheelScreen");
}

function updateShowdownUI(){
    if(!currentShowdown){
        return;
    }

    const indicator = document.getElementById("seasonIndicator");
    if(indicator){
        indicator.textContent = `Season ${currentShowdown.currentRound || 1}`;
    }

    const selectedLeague = document.getElementById("selectedLeague");
    if(selectedLeague && currentShowdown.selectedLeague){
        selectedLeague.textContent = currentShowdown.selectedLeague.name;
    }
}
