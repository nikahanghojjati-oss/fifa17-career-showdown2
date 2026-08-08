/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.7.0
   Showdown State Manager
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

function normalizeShowdown(showdown){
    if(!showdown){
        return null;
    }

    showdown.name = showdown.name || "Unnamed Showdown";
    showdown.managers = showdown.managers || { playerOne: "Manager 1", playerTwo: "Manager 2" };
    showdown.managers.playerOne = showdown.managers.playerOne || "Manager 1";
    showdown.managers.playerTwo = showdown.managers.playerTwo || "Manager 2";
    showdown.totalRounds = Number(showdown.totalRounds) || 1;
    showdown.currentRound = Number(showdown.currentRound) || 1;
    showdown.status = showdown.status || "Created";
    showdown.clubs = showdown.clubs || { playerOne: null, playerTwo: null };
    showdown.score = showdown.score || { playerOne: 0, playerTwo: 0 };
    showdown.score.playerOne = Number(showdown.score.playerOne) || 0;
    showdown.score.playerTwo = Number(showdown.score.playerTwo) || 0;
    showdown.rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];

    return showdown;
}
