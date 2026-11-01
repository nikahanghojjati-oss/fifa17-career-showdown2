const SCORING_RULES = Object.freeze({
    championsLeague: 5,
    leagueTitle: 3,
    domesticCup: 1,
    performanceBonus: 1,
    individualAwardsBonus: 1
});

function calculatePlayerSeasonScore(result){
    const hundredLeaguePoints = Number(result.leaguePoints) >= 100;
    const hundredLeagueGoals = Number(result.leagueGoals) >= 100;
    const topScorer = Boolean(result.topScorer);
    const topAssist = Boolean(result.topAssist);

    const breakdown = {
        championsLeague: result.championsLeague ? SCORING_RULES.championsLeague : 0,
        leagueTitle: Number(result.leaguePosition) === 1 ? SCORING_RULES.leagueTitle : 0,
        domesticCup: result.domesticCup ? SCORING_RULES.domesticCup : 0,
        performanceBonus: (hundredLeaguePoints || hundredLeagueGoals) ? SCORING_RULES.performanceBonus : 0,
        individualAwardsBonus: (topScorer || topAssist) ? SCORING_RULES.individualAwardsBonus : 0,
        triggers: {
            hundredLeaguePoints,
            hundredLeagueGoals,
            topScorer,
            topAssist
        }
    };

    // r80: Europa League win +3, never with CL
    if(result.europaLeague === true && !result.championsLeague){ breakdown.europaLeague = 3; }

    breakdown.awardsBonus = breakdown.individualAwardsBonus;

    breakdown.total =
        breakdown.championsLeague +
        (breakdown.europaLeague || 0) +
        breakdown.leagueTitle +
        breakdown.domesticCup +
        breakdown.performanceBonus +
        breakdown.individualAwardsBonus;

    return breakdown;
}

// r83 (Nik 2026-10-23): no tiebreak. More Showdown points wins the season; equal points (0-0 included) is a draw.
// League position, league points and goals never decide a season.
function determineSeasonWinner(playerOne, playerTwo){
    if(playerOne.scoring.total > playerTwo.scoring.total){
        return "playerOne";
    }

    if(playerTwo.scoring.total > playerOne.scoring.total){
        return "playerTwo";
    }

    return "draw";
}

function recalculateShowdownScores(showdown){
    if(!showdown || !Array.isArray(showdown.rounds)){
        return showdown;
    }

    let playerOneTotal = 0;
    let playerTwoTotal = 0;

    showdown.rounds.forEach(round => {
        if(!round || !round.playerOne || !round.playerTwo){
            return;
        }

        round.playerOne.scoring = calculatePlayerSeasonScore(round.playerOne);
        round.playerTwo.scoring = calculatePlayerSeasonScore(round.playerTwo);
        round.winner = determineSeasonWinner(round.playerOne, round.playerTwo);

        playerOneTotal += round.playerOne.scoring.total;
        playerTwoTotal += round.playerTwo.scoring.total;
    });

    showdown.score = {
        playerOne: playerOneTotal,
        playerTwo: playerTwoTotal
    };

    return showdown;
}
