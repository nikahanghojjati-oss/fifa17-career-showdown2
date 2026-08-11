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

    breakdown.awardsBonus = breakdown.individualAwardsBonus;

    breakdown.total =
        breakdown.championsLeague +
        breakdown.leagueTitle +
        breakdown.domesticCup +
        breakdown.performanceBonus +
        breakdown.individualAwardsBonus;

    return breakdown;
}

function determineSeasonWinner(playerOne, playerTwo){
    if(playerOne.scoring.total > playerTwo.scoring.total){
        return "playerOne";
    }

    if(playerTwo.scoring.total > playerOne.scoring.total){
        return "playerTwo";
    }

    if(playerOne.scoring.total !== 0 || playerTwo.scoring.total !== 0){
        return "draw";
    }

    if(playerOne.leaguePosition < playerTwo.leaguePosition){
        return "playerOne";
    }

    if(playerTwo.leaguePosition < playerOne.leaguePosition){
        return "playerTwo";
    }

    if(playerOne.leaguePoints > playerTwo.leaguePoints){
        return "playerOne";
    }

    if(playerTwo.leaguePoints > playerOne.leaguePoints){
        return "playerTwo";
    }

    return "draw";
}

function buildPerformanceBonusLabel(scoring){
    const triggers = scoring.triggers || {};
    const achievements = [];

    if(triggers.hundredLeaguePoints){ achievements.push("100 Points"); }
    if(triggers.hundredLeagueGoals){ achievements.push("100 Goals"); }

    return achievements.length
        ? `Performance Bonus (${achievements.join(" + ")})`
        : "Performance Bonus";
}

function buildAwardsBonusLabel(scoring){
    const triggers = scoring.triggers || {};
    const achievements = [];

    if(triggers.topScorer){ achievements.push("Top Scorer"); }
    if(triggers.topAssist){ achievements.push("Top Assist"); }

    return achievements.length
        ? `Awards Bonus (${achievements.join(" + ")})`
        : "Awards Bonus";
}

function getScoringBreakdownLines(scoring){
    return [
        ["Champions League", scoring.championsLeague || 0],
        ["League Title", scoring.leagueTitle || 0],
        ["Domestic Cup", scoring.domesticCup || 0],
        [buildPerformanceBonusLabel(scoring), scoring.performanceBonus || 0],
        [buildAwardsBonusLabel(scoring), scoring.individualAwardsBonus || scoring.awardsBonus || 0]
    ];
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
