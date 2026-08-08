/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.8.0
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
        transferChallenges: [],
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
    showdown.clubs.playerOne = showdown.clubs.playerOne || null;
    showdown.clubs.playerTwo = showdown.clubs.playerTwo || null;
    showdown.score = showdown.score || { playerOne: 0, playerTwo: 0 };
    showdown.score.playerOne = Number(showdown.score.playerOne) || 0;
    showdown.score.playerTwo = Number(showdown.score.playerTwo) || 0;
    showdown.transferChallenges = Array.isArray(showdown.transferChallenges) ? showdown.transferChallenges : [];
    showdown.rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];

    showdown.transferChallenges.forEach(challenge => {
        if(!challenge){ return; }
        challenge.seasonNumber = Number(challenge.seasonNumber) || 1;
        challenge.status = challenge.status || "not_started";
        challenge.durationSeconds = Number(challenge.durationSeconds) || 900;
        challenge.startedAt = challenge.startedAt || null;
        challenge.deadlineAt = challenge.deadlineAt || null;
        challenge.endedAt = challenge.endedAt || null;
        challenge.signings = challenge.signings || { playerOne: [], playerTwo: [] };
        challenge.signings.playerOne = Array.isArray(challenge.signings.playerOne) ? challenge.signings.playerOne : [];
        challenge.signings.playerTwo = Array.isArray(challenge.signings.playerTwo) ? challenge.signings.playerTwo : [];
        challenge.guesses = challenge.guesses || { againstPlayerOne: [], againstPlayerTwo: [] };
        challenge.guesses.againstPlayerOne = Array.isArray(challenge.guesses.againstPlayerOne) ? challenge.guesses.againstPlayerOne : [];
        challenge.guesses.againstPlayerTwo = Array.isArray(challenge.guesses.againstPlayerTwo) ? challenge.guesses.againstPlayerTwo : [];
    });

    if(typeof recalculateShowdownScores === "function"){
        recalculateShowdownScores(showdown);
    }

    return showdown;
}

function getTransferChallengeForSeason(seasonNumber){
    if(!currentShowdown){
        return null;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    return currentShowdown.transferChallenges.find(
        challenge => Number(challenge.seasonNumber) === Number(seasonNumber)
    ) || null;
}

function isTransferChallengeComplete(seasonNumber){
    const challenge = getTransferChallengeForSeason(seasonNumber);
    return Boolean(challenge && challenge.status === "completed");
}
