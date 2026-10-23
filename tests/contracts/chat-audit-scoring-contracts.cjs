"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../js/scoring.js"), "utf8"), context, { filename: "js/scoring.js" });
const { calculatePlayerSeasonScore, determineSeasonWinner, recalculateShowdownScores } =
    vm.runInContext("({ calculatePlayerSeasonScore, determineSeasonWinner, recalculateShowdownScores })", context);

function scored(fields = {}){
    const player = {
        leaguePosition: "5",
        leaguePoints: "80",
        leagueGoals: "70",
        championsLeague: false,
        domesticCup: false,
        topScorer: false,
        topAssist: false,
        ...fields
    };
    player.scoring = calculatePlayerSeasonScore(player);
    return player;
}

// r83 (Nik 2026-10-23): no tiebreak. Equal Showdown points is a draw, whatever the league position.
const positionOne = scored({ leaguePosition: "10" });
const positionTwo = scored({ leaguePosition: "2" });
assert.equal(positionOne.scoring.total, positionTwo.scoring.total);
assert.equal(determineSeasonWinner(positionOne, positionTwo), "draw");

// Both managers score one Showdown point; 100 league points against 99 changes nothing.
const pointsOne = scored({ leaguePoints: "99", domesticCup: true });
const pointsTwo = scored({ leaguePoints: "100" });
assert.equal(pointsOne.scoring.total, 1);
assert.equal(pointsTwo.scoring.total, 1);
assert.equal(determineSeasonWinner(pointsOne, pointsTwo), "draw");

// Equal scores, league positions and league points must remain a draw.
assert.equal(determineSeasonWinner(scored({ leaguePoints: "72" }), scored({ leaguePoints: "72" })), "draw");

// Recalculating a ten-Season showdown must count each Season only once.
const showdown = {
    rounds: Array.from({ length: 10 }, (_, index) => ({
        roundNumber: index + 1,
        playerOne: scored({ championsLeague: index % 2 === 0 }),
        playerTwo: scored({ domesticCup: index % 2 === 1 })
    }))
};
for(let repeat = 0; repeat < 2; repeat += 1){
    recalculateShowdownScores(showdown);
    assert.equal(showdown.score.playerOne, 25);
    assert.equal(showdown.score.playerTwo, 5);
    assert.equal(showdown.rounds.filter(round => round.winner === "playerOne").length, 5);
    assert.equal(showdown.rounds.filter(round => round.winner === "playerTwo").length, 5);
}
console.log("PASS chat audit scoring: numeric Season tie-breaks, draws and stable ten-Season totals.");
