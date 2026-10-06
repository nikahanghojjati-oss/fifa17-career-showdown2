"use strict";
// Shared, reusable filled-data fixtures for layout measurement (used by layout-audit.cjs; other teams can require this too).
// One finished-looking showdown: Daniel (playerOne) vs Nik (playerTwo), three accepted seasons with trophies on both sides,
// the final reconciliation and terminal close, plus the career model used by Statistics, Trophy Room and Legacy.
// Page-side installers are in page-fixtures.js (window.__auditFixtures).
const fs = require("node:fs");
const path = require("node:path");
function build(){
    const root = path.resolve(__dirname, "../../..");
    const out = {};
    try{
        const F = require(path.join(root, "tests/support/active-showdown-fixtures.cjs"));
        const p = F.projection({ totalSeasons: 3, seasons: [
            [F.result({ leaguePosition: 1, leaguePoints: 91, leagueGoals: 88, championsLeague: true, topScorer: true }), F.result({ leaguePosition: 3, leaguePoints: 70 })],
            [F.result({ leaguePosition: 2, leaguePoints: 80, domesticCup: true }), F.result({ leaguePosition: 1, leaguePoints: 95, championsLeague: true })],
            [F.result({ leaguePosition: 1, leaguePoints: 99, leagueGoals: 101, domesticCup: true, topAssist: true }), F.result({ leaguePosition: 4, leaguePoints: 66 })]] });
        out.identity = F.identity("daniel"); out.pair = F.pair(p.rivalryId); out.multi = F.multiFor(p); out.history = F.history(p);
        out.finalReconciliation = F.finalReconciliation(p); out.closed = F.closed(p); out.rivalryId = p.rivalryId;
    }catch(error){ out.error = String(error.message || error); }
    try{ out.careerModel = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/data-contract-v1/finished-three-seasons.json"), "utf8")).career; }catch(error){ out.careerError = String(error.message || error); }
    return out;
}
module.exports = { build, pageFixturesPath: path.join(__dirname, "page-fixtures.js") };
if(require.main === module) process.stdout.write(JSON.stringify(build(), null, 1));
