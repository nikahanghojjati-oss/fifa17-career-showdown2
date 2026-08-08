/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.9.0
   Showdown State Manager
===================================================== */

let currentShowdown = null;

function createShowdown(){
    if(hasSavedShowdown()){
        const existing = loadSavedShowdown();
        const existingName = existing && existing.name ? existing.name : "your current showdown";
        const proceed = window.confirm(
            `Start a new showdown and replace the active save "${existingName}"? Completed showdowns already stored in Legacy will not be deleted.`
        );

        if(!proceed){
            return;
        }
    }

    const showdownName = document.getElementById("showdownName").value.trim();
    const managerOne = document.getElementById("managerOne").value.trim();
    const managerTwo = document.getElementById("managerTwo").value.trim();
    const roundAmount = Number(document.getElementById("roundAmount").value);
    const now = new Date().toISOString();

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
        rounds: [],
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        archivedAt: null
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
    showdown.createdAt = showdown.createdAt || null;
    showdown.updatedAt = showdown.updatedAt || null;
    showdown.completedAt = showdown.completedAt || null;
    showdown.archivedAt = showdown.archivedAt || null;

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

function touchCurrentShowdown(){
    if(!currentShowdown){
        return;
    }

    currentShowdown.updatedAt = new Date().toISOString();
}

function getShowdownWinner(showdown = currentShowdown){
    if(!showdown){
        return "draw";
    }

    if(Number(showdown.score.playerOne) > Number(showdown.score.playerTwo)){
        return "playerOne";
    }

    if(Number(showdown.score.playerTwo) > Number(showdown.score.playerOne)){
        return "playerTwo";
    }

    return "draw";
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
