/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   Lightweight Read-Only Statistics and Records Engine
===================================================== */

let careerAnalyticsCacheKey = null;
let careerAnalyticsCacheValue = null;

function analyticsNormalizeName(value){
    return String(value || "Unknown Manager")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function getCompletedShowdownsForAnalytics(){
    const byId = new Map();

    loadLegacyShowdowns().forEach(showdown => {
        if(showdown && showdown.status === "Completed"){
            byId.set(String(showdown.id), showdown);
        }
    });

    const active = currentShowdown || loadSavedShowdown();
    if(active && active.status === "Completed"){
        byId.set(String(active.id), active);
    }

    return Array.from(byId.values()).sort((a, b) => {
        const aTime = new Date(a.completedAt || a.archivedAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.completedAt || b.archivedAt || b.updatedAt || 0).getTime();
        return aTime - bTime;
    });
}

function getCareerAnalyticsCacheKey(){
    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : 0;
    const active = currentShowdown;
    const activeSignature = active && active.status === "Completed"
        ? `${active.id}:${active.updatedAt || active.completedAt || ""}`
        : "none";
    return `${revision}|${activeSignature}`;
}

function getShowdownWinnerKey(showdown){
    const playerOne = Number(showdown && showdown.score && showdown.score.playerOne) || 0;
    const playerTwo = Number(showdown && showdown.score && showdown.score.playerTwo) || 0;

    if(playerOne > playerTwo){ return "playerOne"; }
    if(playerTwo > playerOne){ return "playerTwo"; }
    return "draw";
}

function getTransferChallengeFromShowdown(showdown, seasonNumber){
    if(!showdown || !Array.isArray(showdown.transferChallenges)){
        return null;
    }

    return showdown.transferChallenges.find(
        challenge => Number(challenge.seasonNumber) === Number(seasonNumber)
    ) || null;
}

function getAnalyticsScoring(player){
    if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
        return player.scoring;
    }
    return typeof calculatePlayerSeasonScore === "function"
        ? calculatePlayerSeasonScore(player || {})
        : { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
}

function createManagerCareerStats(name){
    return {
        key: analyticsNormalizeName(name),
        name: String(name || "Unknown Manager").trim() || "Unknown Manager",
        showdowns: 0,
        showdownWins: 0,
        showdownLosses: 0,
        showdownDraws: 0,
        seasons: 0,
        seasonWins: 0,
        seasonLosses: 0,
        seasonDraws: 0,
        totalPoints: 0,
        leagueTitles: 0,
        domesticCups: 0,
        championsLeagues: 0,
        performanceBonuses: 0,
        awardsBonuses: 0,
        hundredPointSeasons: 0,
        hundredGoalSeasons: 0,
        topScorerSeasons: 0,
        topAssistSeasons: 0,
        perfectSeasons: 0,
        totalLeaguePoints: 0,
        totalLeagueGoals: 0,
        bestLeaguePosition: null,
        bestLeaguePoints: null,
        bestLeagueGoals: null,
        bestSeasonScore: null,
        signings: 0,
        releasedSignings: 0,
        safeSignings: 0,
        clubs: new Set(),
        leagues: new Set(),
        averageSeasonScore: 0,
        averageLeaguePoints: 0,
        averageLeagueGoals: 0,
        showdownWinRate: 0,
        totalTrophies: 0
    };
}

function getOrCreateManagerStats(map, name){
    const key = analyticsNormalizeName(name);
    if(!map.has(key)){
        map.set(key, createManagerCareerStats(name));
    }
    return map.get(key);
}

function accumulateTransferStats(stats, challenge, playerKey){
    if(!challenge || !challenge.signings){
        return;
    }

    const signings = Array.isArray(challenge.signings[playerKey])
        ? challenge.signings[playerKey]
        : [];

    stats.signings += signings.length;
    signings.forEach(signing => {
        if(signing && signing.release){
            stats.releasedSignings += 1;
        }else{
            stats.safeSignings += 1;
        }
    });
}

function accumulateRoundStats(stats, showdown, round, playerKey){
    const player = round && round[playerKey];
    if(!player){
        return;
    }

    const scoring = getAnalyticsScoring(player);
    const score = Number(scoring.total) || 0;
    const leaguePosition = Number(player.leaguePosition);
    const leaguePoints = Number(player.leaguePoints) || 0;
    const leagueGoals = Number(player.leagueGoals) || 0;

    stats.seasons += 1;
    stats.totalPoints += score;
    stats.totalLeaguePoints += leaguePoints;
    stats.totalLeagueGoals += leagueGoals;

    if(round.winner === playerKey){ stats.seasonWins += 1; }
    else if(round.winner === "draw"){ stats.seasonDraws += 1; }
    else { stats.seasonLosses += 1; }

    if(leaguePosition === 1){ stats.leagueTitles += 1; }
    if(player.domesticCup){ stats.domesticCups += 1; }
    if(player.championsLeague){ stats.championsLeagues += 1; }
    if(scoring.performanceBonus){ stats.performanceBonuses += 1; }
    if(scoring.individualAwardsBonus || scoring.awardsBonus){ stats.awardsBonuses += 1; }
    if(leaguePoints >= 100){ stats.hundredPointSeasons += 1; }
    if(leagueGoals >= 100){ stats.hundredGoalSeasons += 1; }
    if(player.topScorer){ stats.topScorerSeasons += 1; }
    if(player.topAssist){ stats.topAssistSeasons += 1; }
    if(score === 11){ stats.perfectSeasons += 1; }

    if(Number.isFinite(leaguePosition) && leaguePosition > 0){
        stats.bestLeaguePosition = stats.bestLeaguePosition === null
            ? leaguePosition
            : Math.min(stats.bestLeaguePosition, leaguePosition);
    }

    stats.bestLeaguePoints = stats.bestLeaguePoints === null ? leaguePoints : Math.max(stats.bestLeaguePoints, leaguePoints);
    stats.bestLeagueGoals = stats.bestLeagueGoals === null ? leagueGoals : Math.max(stats.bestLeagueGoals, leagueGoals);
    stats.bestSeasonScore = stats.bestSeasonScore === null ? score : Math.max(stats.bestSeasonScore, score);

    accumulateTransferStats(
        stats,
        getTransferChallengeFromShowdown(showdown, round.roundNumber),
        playerKey
    );
}

function finalizeManagerCareerStats(stats){
    stats.totalTrophies = stats.leagueTitles + stats.domesticCups + stats.championsLeagues;
    stats.averageSeasonScore = stats.seasons ? stats.totalPoints / stats.seasons : 0;
    stats.averageLeaguePoints = stats.seasons ? stats.totalLeaguePoints / stats.seasons : 0;
    stats.averageLeagueGoals = stats.seasons ? stats.totalLeagueGoals / stats.seasons : 0;
    stats.showdownWinRate = stats.showdowns ? (stats.showdownWins / stats.showdowns) * 100 : 0;
    stats.clubs = Array.from(stats.clubs).sort();
    stats.leagues = Array.from(stats.leagues).sort();
    return stats;
}

function calculateCareerAnalytics(history){
    const managerMap = new Map();
    let totalSeasons = 0;
    let totalPoints = 0;
    let totalTrophies = 0;

    history.forEach(showdown => {
        if(!showdown || !showdown.managers){
            return;
        }

        const winner = getShowdownWinnerKey(showdown);
        const rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];

        ["playerOne", "playerTwo"].forEach(playerKey => {
            const managerName = showdown.managers[playerKey];
            const stats = getOrCreateManagerStats(managerMap, managerName);
            stats.name = managerName || stats.name;
            stats.showdowns += 1;

            if(winner === playerKey){ stats.showdownWins += 1; }
            else if(winner === "draw"){ stats.showdownDraws += 1; }
            else { stats.showdownLosses += 1; }

            if(showdown.clubs && showdown.clubs[playerKey]){
                stats.clubs.add(showdown.clubs[playerKey]);
            }
            if(showdown.selectedLeague && showdown.selectedLeague.name){
                stats.leagues.add(showdown.selectedLeague.name);
            }

            rounds.forEach(round => accumulateRoundStats(stats, showdown, round, playerKey));
        });

        totalSeasons += rounds.length;
        totalPoints += (Number(showdown.score && showdown.score.playerOne) || 0)
            + (Number(showdown.score && showdown.score.playerTwo) || 0);

        rounds.forEach(round => {
            [round.playerOne, round.playerTwo].forEach(player => {
                if(!player){ return; }
                if(Number(player.leaguePosition) === 1){ totalTrophies += 1; }
                if(player.domesticCup){ totalTrophies += 1; }
                if(player.championsLeague){ totalTrophies += 1; }
            });
        });
    });

    const managers = Array.from(managerMap.values())
        .map(finalizeManagerCareerStats)
        .sort((a, b) => {
            if(b.showdownWins !== a.showdownWins){ return b.showdownWins - a.showdownWins; }
            if(b.totalTrophies !== a.totalTrophies){ return b.totalTrophies - a.totalTrophies; }
            return b.totalPoints - a.totalPoints;
        });

    return {
        history,
        managers,
        totals: {
            showdowns: history.length,
            seasons: totalSeasons,
            trophies: totalTrophies,
            points: totalPoints
        },
        records: buildCareerRecords(history, managers)
    };
}

function buildCareerAnalytics(history = null){
    if(history){
        return calculateCareerAnalytics(history);
    }

    const cacheKey = getCareerAnalyticsCacheKey();
    if(careerAnalyticsCacheValue && careerAnalyticsCacheKey === cacheKey){
        return careerAnalyticsCacheValue;
    }

    careerAnalyticsCacheValue = calculateCareerAnalytics(getCompletedShowdownsForAnalytics());
    careerAnalyticsCacheKey = cacheKey;
    return careerAnalyticsCacheValue;
}

function createRecordCandidate(showdown, round, playerKey, value){
    return {
        value,
        manager: showdown.managers[playerKey],
        club: showdown.clubs && showdown.clubs[playerKey],
        showdown: showdown.name,
        season: round.roundNumber
    };
}

function findSeasonRecord(history, valueGetter){
    let bestValue = null;
    let holders = [];

    history.forEach(showdown => {
        (showdown.rounds || []).forEach(round => {
            ["playerOne", "playerTwo"].forEach(playerKey => {
                const player = round[playerKey];
                if(!player){ return; }

                const value = Number(valueGetter(player, round, showdown, playerKey));
                if(!Number.isFinite(value)){ return; }

                if(bestValue === null || value > bestValue){
                    bestValue = value;
                    holders = [createRecordCandidate(showdown, round, playerKey, value)];
                }else if(value === bestValue){
                    holders.push(createRecordCandidate(showdown, round, playerKey, value));
                }
            });
        });
    });

    return { value: bestValue, holders };
}

function findManagerLeaders(managers, field){
    if(!managers.length){
        return { value: null, holders: [] };
    }

    const bestValue = Math.max(...managers.map(manager => Number(manager[field]) || 0));
    return {
        value: bestValue,
        holders: managers.filter(manager => (Number(manager[field]) || 0) === bestValue)
    };
}

function findBiggestShowdownMargin(history){
    let best = null;

    history.forEach(showdown => {
        const playerOne = Number(showdown.score && showdown.score.playerOne) || 0;
        const playerTwo = Number(showdown.score && showdown.score.playerTwo) || 0;
        const margin = Math.abs(playerOne - playerTwo);

        if(!best || margin > best.value){
            const winnerKey = playerOne === playerTwo ? "draw" : (playerOne > playerTwo ? "playerOne" : "playerTwo");
            best = {
                value: margin,
                showdown: showdown.name,
                score: `${playerOne} - ${playerTwo}`,
                manager: winnerKey === "draw" ? "Draw" : showdown.managers[winnerKey]
            };
        }
    });

    return best;
}

function buildCareerRecords(history, managers){
    return {
        showdownWins: findManagerLeaders(managers, "showdownWins"),
        totalPoints: findManagerLeaders(managers, "totalPoints"),
        trophies: findManagerLeaders(managers, "totalTrophies"),
        championsLeagues: findManagerLeaders(managers, "championsLeagues"),
        leagueTitles: findManagerLeaders(managers, "leagueTitles"),
        domesticCups: findManagerLeaders(managers, "domesticCups"),
        perfectSeasons: findManagerLeaders(managers, "perfectSeasons"),
        highestSeasonScore: findSeasonRecord(history, player => getAnalyticsScoring(player).total),
        highestLeaguePoints: findSeasonRecord(history, player => player.leaguePoints),
        highestLeagueGoals: findSeasonRecord(history, player => player.leagueGoals),
        biggestShowdownMargin: findBiggestShowdownMargin(history)
    };
}

function buildRivalryManagerStats(showdown, playerKey){
    const managers = showdown.managers || {};
    const stats = createManagerCareerStats(managers[playerKey]);
    stats.showdowns = 1;

    if(showdown.clubs && showdown.clubs[playerKey]){
        stats.clubs.add(showdown.clubs[playerKey]);
    }
    if(showdown.selectedLeague && showdown.selectedLeague.name){
        stats.leagues.add(showdown.selectedLeague.name);
    }

    const winner = getShowdownWinnerKey(showdown);
    if(showdown.status === "Completed"){
        if(winner === playerKey){ stats.showdownWins = 1; }
        else if(winner === "draw"){ stats.showdownDraws = 1; }
        else { stats.showdownLosses = 1; }
    }

    (showdown.rounds || []).forEach(round => accumulateRoundStats(stats, showdown, round, playerKey));
    return finalizeManagerCareerStats(stats);
}

function buildRivalryAnalytics(showdown){
    if(!showdown){
        return null;
    }

    const playerOne = buildRivalryManagerStats(showdown, "playerOne");
    const playerTwo = buildRivalryManagerStats(showdown, "playerTwo");

    return {
        showdown,
        playerOne,
        playerTwo,
        seasonRows: (showdown.rounds || []).map(round => ({
            season: round.roundNumber,
            winner: round.winner,
            playerOneScore: Number(getAnalyticsScoring(round.playerOne).total) || 0,
            playerTwoScore: Number(getAnalyticsScoring(round.playerTwo).total) || 0,
            playerOneLeaguePoints: Number(round.playerOne && round.playerOne.leaguePoints) || 0,
            playerTwoLeaguePoints: Number(round.playerTwo && round.playerTwo.leaguePoints) || 0,
            playerOneLeagueGoals: Number(round.playerOne && round.playerOne.leagueGoals) || 0,
            playerTwoLeagueGoals: Number(round.playerTwo && round.playerTwo.leagueGoals) || 0
        }))
    };
}

window.buildCareerAnalytics = buildCareerAnalytics;
window.buildRivalryAnalytics = buildRivalryAnalytics;
window.getCompletedShowdownsForAnalytics = getCompletedShowdownsForAnalytics;
