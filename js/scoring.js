/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.7.0
   Scoring Engine
===================================================== */

const SCORING_RULES = Object.freeze({
    championsLeague: 5,
    leagueTitle: 3,
    domesticCup: 1,
    hundredLeaguePoints: 1,
    hundredLeagueGoals: 1,
    topScorer: 1,
    topAssist: 1
});

function calculatePlayerSeasonScore(result){
    const breakdown = {
        championsLeague: result.championsLeague ? SCORING_RULES.championsLeague : 0,
        leagueTitle: result.leaguePosition === 1 ? SCORING_RULES.leagueTitle : 0,
        domesticCup: result.domesticCup ? SCORING_RULES.domesticCup : 0,
        hundredLeaguePoints: result.leaguePoints >= 100 ? SCORING_RULES.hundredLeaguePoints : 0,
        hundredLeagueGoals: result.leagueGoals >= 100 ? SCORING_RULES.hundredLeagueGoals : 0,
        topScorer: result.topScorer ? SCORING_RULES.topScorer : 0,
        topAssist: result.topAssist ? SCORING_RULES.topAssist : 0
    };

    breakdown.total = Object.values(breakdown).reduce((sum, points) => sum + points, 0);

    return breakdown;
}

function determineSeasonWinner(playerOne, playerTwo){
    if(playerOne.scoring.total > playerTwo.scoring.total){
        return "playerOne";
    }

    if(playerTwo.scoring.total > playerOne.scoring.total){
        return "playerTwo";
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

function getScoringBreakdownLines(scoring){
    return [
        ["Champions League", scoring.championsLeague],
        ["League Title", scoring.leagueTitle],
        ["Domestic Cup", scoring.domesticCup],
        ["100 League Points", scoring.hundredLeaguePoints],
        ["100 League Goals", scoring.hundredLeagueGoals],
        ["Top Scorer", scoring.topScorer],
        ["Top Assist", scoring.topAssist]
    ];
}
