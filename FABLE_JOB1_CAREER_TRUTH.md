# Fable job 1: career and history truth audit (Career Mode Showdown r87 / 2.0.0)

Code snapshot: gameplay/r87 @ d1a25535e, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every file on the career truth chain is below this brief.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore, GitHub Pages). Two managers, Daniel (playerOne) and Nik (playerTwo), play a "Showdown" of 1, 3, 5 or 10 seasons. After each real FIFA season both enter their results; the app scores each season and keeps a lifetime career across every Showdown. Career screens: History, Career Statistics (Stats), Trophy Room, Rivalry, Legacy, Standings, Rule Book, plus per-season Season Results and the Final Winner.

## House rules (these are the truth; the code must match them)
- Scoring is what js/scoring.js, js/sharedCanonicalScoring.js and the Rule Book (js/ruleBook.js, full text below) say. Where code and Rule Book disagree, flag it; do not guess which is right.
- NO tiebreak anywhere. Equal season scores = season DRAW. Equal Showdown totals = Showdown DRAW. Equal career points = level. League position never decides anything.
- Europa League win = +3, Champions League win = +5, a manager can never have both in one season.
- Golden Showdown: reaching 110 in a 10-season Showdown (shown in gold on Trophy Room, Stats, Rivalry, Legacy, Rule Book).
- Which games count: every Showdown finished from build r79 onward counts and shows everywhere. Earlier builds stay hidden. Ended-early Showdowns show only a status card in History ("Ended early", date, seasons played) and NEVER count in points, trophies, records or W/D/L. Unjoined Showdowns stay hidden.
- Both phones must show identical numbers for the same career (no device-local drift).
- Since r86 the career is read from per-Showdown summary documents (js/careerSummaryStore.js) with a fallback to full history (js/sparkClosedShowdownCareerLoader.js); both paths must give identical results.

## Already known, do not re-report (fixes in progress)
- Red-team report below ("CAREER_HISTORY hunt") lists findings B1-B9 / D-01..D-03 that are being fixed now. D-01 (ended-early card) is rejected by the owner; D-02 (roulette releases in History) is parked. Only report something from that list if you find it is worse or different than described.

## Your job
Work as the senior engineer who owns "every career number is true". Read every file below in full.

Reply 1 (this message): an audit. For every number shown on every career screen, trace it from the raw season inputs to the pixel. Report each place where a number can be wrong, differ between the two paths (summary vs full history), differ between phones, double count, miss a season, count an ended-early or pre-r79 Showdown, break at 10 seasons or at 100 Showdowns, or contradict the house rules or Rule Book. For each finding give: ID (F1-01...), severity (P0 wrong number a player would see / P1 rare or edge / P2 cosmetic), file:line, a concrete input that shows it (a small JSON fixture of seasons), expected vs actual value, and the smallest fix as a unified diff. Then list what you checked and found correct, screen by screen. Rank findings most severe first. Be strict: only real, reproducible findings; say "none found" where that is the truth.

Later replies (I will ask): reply 2 = a pure Node CommonJS module tests/support/careerTruthOracle.cjs that recomputes every career-screen number independently from raw Showdown records (do not import app code), plus a fixture generator for 1/3/5/10-season Showdowns and a 100-Showdown career covering draws, EL/CL, Golden Showdown, ended-early and pre-r79 games. Reply 3 = combined final diffs for all valid findings.

Keep each reply's visible text under about 60,000 characters; put code in fenced blocks with the target path on the line above.

---
## CAREER_HISTORY hunt (red-team brief already run)

Red team (Codex), r87 job D: career pages and history.
Repo nikahanghojjati-oss/fifa17-career-showdown2, branch gameplay/r87 (latest commit). Change no game code: add only one file, audit/r87/REDTEAM_R87_CAREER_HISTORY.md, on a new branch and open a PR into gameplay/r87 titled "Red team r87: CAREER_HISTORY".

The game: a private two-player FIFA 17 Career Mode tracker (Daniel and Nik, one phone each) synced through Firebase (Spark plan). r87 (2.0.0) ships only after one 10-season Showdown where every career screen matches the online data exactly. Goal: every number, name, trophy and record on every career page is right for 1, 3, 5 and 10-season Showdowns, for tens of finished Showdowns, on desktop and phone, after reloads and on a fresh phone.

Threat model: normal play only. Ignore anything only a modified app could cause.

House rules the pages must follow: equal scores are a DRAW and equal career points are level (no tiebreak anywhere; league position never decides anything). Europa League +3, Champions League +5, never both. Golden Showdown = 110 in a 10-season Showdown. Every Showdown finished from r79 onward counts and shows everywhere; earlier builds, ended-early and unjoined Showdowns stay hidden. Always "Special Player"/"SP" on screen, never "Marquee".

Hunt for, with file:line evidence:
1. Wrong numbers: totals, W/D/L, points, seasons, trophies, EL/CL bonuses, records, streaks, averages or Golden Showdown differing between the Firebase data and Trophy Room, Stats, Rivalry, Legacy, Standings, History, Rule Book or Final Winner. Work real arithmetic for a 10-season Showdown with draws, equal points, EL and CL seasons.
2. Counting rules: a Showdown counted twice, missing, or shown when it must be hidden (pre-r79, ended early, unjoined, abandoned); a rematch or a second Showdown with the same pairing mixing seasons.
3. Summaries and phone copies (js/careerSummaryStore.js, js/sparkClosedShowdownCareerLoader.js): a summary that disagrees with the full Showdown, a stale reader version, a phone copy kept after the data changed, a fresh phone or cleared storage showing different numbers.
4. Scale: 10, 30 and 100 finished Showdowns: slow pages, timeouts, a page stuck on loading, sort order, paging.
5. r87 additions on career pages: Roster Roulette releases and Special Player shown where they should be, and never changing points or results.
6. Phone vs desktop: the same numbers, nothing cut off or hidden, every value readable.
7. Wording: anything a player could read as wrong (draw shown as a win, "level" shown as a lead, empty career text when there are games).

Key files: js/careerScreensV10.js, js/rivalryLegacyV10.js, js/rivalryLegacyV10Markup.js, js/trophyRoom.js, js/legacy.js, js/sharedCareerAnalytics.js, js/careerSummaryStore.js, js/sparkClosedShowdownCareerLoader.js, js/sparkCompletedTransferHistoryReader.js, js/sharedHistoryConvergence.js, js/productionSharedHistoryConvergence.js, js/sparkSharedHistoryConvergence.js, js/ruleBook.js, js/seasonFinalV10.js, and the CE2PG test tests/browser/ce2pg-journey.cjs.

Already found in earlier rounds, do not re-report unless still present at this commit: History inactivity deadline, loader 'live' skipping the summary for a completed current Showdown, CE2PG meter missing reconnects, Standings empty-career wording, summary get retry (r87 reads fixes).

Output: that one Markdown report file. Run the code to prove findings (node, npm run test:contracts, the Firebase emulator; local emulator runs need firebase@12.17.0); never contact production Firebase. For each finding: ID (R87-D-01...), severity (P0 wrong result or wrong winner shown, P1 wrong number or missing Showdown on a career page, P2 recoverable glitch, P3 small), file:line, exact steps, what the player sees, the root cause, the smallest fix. Then a ranked top 5, a table of every career screen with the values you checked against the data, anything unverified marked "unknown", and a score out of 10 with what would make it 10/10. Do not guess; show the code path and the arithmetic for each claim.


## FILE: js/ruleBook.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   Rule Book — Lazy UI Construction
===================================================== */

function createRuleBookScreen(){
    if(document.getElementById("ruleBook")){
        return;
    }

    const main = document.querySelector("main");
    if(!main){
        return;
    }

    const section = document.createElement("section");
    section.id = "ruleBook";
    section.className = "screen hidden ruleBookScreen";

    const heading = document.createElement("h2");
    heading.textContent = "RULE BOOK";

    const intro = document.createElement("div");
    intro.className = "ruleBookHero";
    intro.innerHTML = `
        <span>CAREER MODE SHOWDOWN</span>
        <strong>THE RULES</strong>
        <p>Daniel and Nik. One league. Fixed clubs. One Showdown.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "ruleBookGrid";

    grid.append(
        createRuleSection("01", "SHOWDOWN FORMAT", [
            "Career Mode Showdown is a two-player game for Daniel and Nik.",
            "Daniel is Player One. Nik is Player Two.",
            "You both play in the same league, and each of you keeps one club for the whole Showdown.",
            "A Showdown is 1, 3, 5 or 10 seasons.",
            "Most Showdown points across all seasons wins. Equal totals are a draw."
        ]),
        createRuleSection("02", "MATCH PLAY", [
            "Simulate every match.",
            "You may play or simulate a Champions League or Europa League final.",
            "You may play or simulate the main domestic cup final.",
            "Skip pre-season in FIFA 17.",
            "1- and 3-season Showdowns: only your Special Player can be trained.",
            "5- and 10-season Showdowns: all players can be trained."
        ]),
        createRuleSection("03", "TRANSFER CHALLENGE", [
            "Each of you may sign up to three players a season.",
            "The transfer window lasts 15 minutes.",
            "In FIFA 17, you can sign players up to the transfer deadline.",
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses. Each guess is a league or a nationality.",
            "If a guess matches one of your signings, release that player before the season starts.",
            "Type each signing's FIFA 17 overall. Only you see it, and it is never part of a guess.",
            "Your Special Player is a free extra signing: he never counts toward the three, and guesses never release him.",
            // r87 Russian Roster Roulette (Nik 2026-10-30: "in rule screen mention special player wont get hit").
            "Before each transfer window, Daniel and then Nik spin the Roster Roulette. One spin in seven fires and hits one player on your starting XI or 4 best subs: release him in FIFA 17.",
            "Your Special Player is never on your board, so he is never hit. Every player on your board has the same chance.",
            "Your board builds itself: your FIFA 17 launch squad. From season 2, a lost player is replaced by a kept signing or the bench, with reserves filling in. Your board is always full: 11 starters and 4 subs."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "The browser keeps a backup copy for recovery. You can't play from it.",
            "Type in results by hand from FIFA 17. No screenshots or notes needed."
        ]),
        createSpecialPlayerRuleSection()
    );

    const actions = document.createElement("div");
    actions.className = "ruleBookActions";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.setAttribute("data-smart-back", "");
    back.textContent = "BACK TO HOME";

    actions.appendChild(back);
    section.append(heading, intro, grid, actions);
    main.appendChild(section);
}

function createRuleSection(number, title, rules){
    const article = document.createElement("article");
    article.className = "ruleSection";

    const header = document.createElement("div");
    header.className = "ruleSectionHeader";

    const numberElement = document.createElement("span");
    numberElement.textContent = number;

    const heading = document.createElement("h3");
    heading.textContent = title;

    header.append(numberElement, heading);

    const list = document.createElement("ul");
    const fragment = document.createDocumentFragment();
    rules.forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        fragment.appendChild(item);
    });
    list.appendChild(fragment);

    article.append(header, list);
    return article;
}

function createScoringRuleSection(){
    const article = document.createElement("article");
    article.className = "ruleSection scoringRuleSection";

    const header = document.createElement("div");
    header.className = "ruleSectionHeader";

    const number = document.createElement("span");
    number.textContent = "04";

    const heading = document.createElement("h3");
    heading.textContent = "SCORING";

    header.append(number, heading);

    const scoring = document.createElement("div");
    scoring.className = "ruleScoreTable";
    const fragment = document.createDocumentFragment();

    [
        ["Champions League winner", "+5"],
        ["Europa League winner", "+3"],
        ["Domestic league winner", "+3"],
        ["Main domestic cup winner", "+1"],
        ["100 league points or 100 league goals", "+1 MAX"],
        ["League top scorer or top assist", "+1 MAX"]
    ].forEach(([label, value]) => {
        const row = document.createElement("div");
        const labelElement = document.createElement("span");
        const valueElement = document.createElement("strong");
        labelElement.textContent = label;
        valueElement.textContent = value;
        row.append(labelElement, valueElement);
        fragment.appendChild(row);
    });
    scoring.appendChild(fragment);

    const maximum = document.createElement("div");
    maximum.className = "ruleScoreMaximum";
    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>11</strong>";

    // r80 Europa League (owner rules, 2026-10-19). r86 (Nik 2026-10-29): the lines FIFA 17 already enforces (no CL and EL
    // in one season, the 3rd-place drop, EL by league position, only winning scores, best season 11/9) stay in the scoring
    // engine but are no longer printed; only the season 1 setup note is shown.
    const notes = document.createElement("ul");
    notes.className = "ruleScoreNotes";
    [
        "Season 1: both clubs play in the Champions League. Set this up in FIFA by redrawing the Champions League groups twice."
    ].forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        notes.appendChild(item);
    });

    // r84 Golden Showdown: its own gold line under the season maximum (Nik 2026-10-26).
    const golden = document.createElement("p");
    golden.className = "ruleGoldenShowdown";
    const goldenLabel = document.createElement("strong");
    goldenLabel.textContent = "GOLDEN SHOWDOWN";
    const goldenText = document.createElement("span");
    goldenText.textContent = "Score 110 points in a 10-season Showdown (11 in every season) to win the gold trophy.";
    golden.append(goldenLabel, goldenText);

    // r86 Special Player (Nik 2026-10-29): the SP chip's own rule line, in the Golden Showdown's style. The live Showdown's
    // two chips are filled in when the Rule Book opens (renderRuleBookSpecialPlayers); none before r86.
    const special = document.createElement("p");
    special.className = "ruleGoldenShowdown ruleSpecialPlayer";
    const specialLabel = document.createElement("strong");
    const specialTag = document.createElement("span");
    specialTag.className = "ruleSpecialPlayerTag";
    specialTag.textContent = "SP";
    const specialName = document.createElement("span");
    specialName.textContent = " SPECIAL PLAYER";
    specialLabel.append(specialTag, specialName);
    const specialText = document.createElement("span");
    specialText.textContent = "Each manager draws one FIFA 17 player at the start of every Showdown. Your Special Player scores no points. Full rules in card 06.";
    const specialLive = document.createElement("span");
    specialLive.className = "ruleSpecialPlayerLive spChipPair";
    specialLive.hidden = true;
    special.append(specialLabel, specialText, specialLive);

    article.append(header, scoring, maximum, golden, special, notes);
    return article;
}

// r86 Special Player rules (Nik 2026-10-29 15:24 UTC): the full card, last, with the training rule by length.
// The draws card is gone (Nik 2026-10-29 21:10 UTC): the no-tiebreak rules stay in scoring.js, not on the page.
function createSpecialPlayerRuleSection(){
    const article = createRuleSection("06", "SPECIAL PLAYER", [
        "At the start of every Showdown, after Club Assignment, each manager draws one Special Player.",
        "The draw picks from the top 300 FIFA 17 players by potential. You and your rival never draw the same player.",
        "Both draws are shown on the reveal screen, and each Special Player stays with his manager for the whole Showdown.",
        "Career Start shows each Special Player's FIFA 17 club, so you can sign yours in-game.",
        "Your Special Player is a free extra signing. He doesn't count toward your three signings, and your rival's guesses can never release him.",
        "1- and 3-season Showdowns: your Special Player is the only player you can train.",
        "5- and 10-season Showdowns: all players can be trained.",
        "Your Special Player scores no Showdown points. His SP chip sits next to your name on the career screens."
    ]);
    article.className = "ruleSection specialPlayerRuleSection";
    return article;
}

// This Showdown's Special Players next to each manager's name (only for a Showdown confirmed on r86 or later).
function renderRuleBookSpecialPlayers(){
    const book = document.getElementById("ruleBook");
    const slot = book && typeof book.querySelector === "function" ? book.querySelector(".ruleSpecialPlayerLive") : null;
    if(!slot){ return false; }
    const api = window.CareerModeSpecialPlayerChip;
    let sp = null;
    try{ sp = api && typeof api.live === "function" ? api.live() : null; }catch(_error){ sp = null; }
    slot.replaceChildren();
    const chips = sp ? [["Daniel", api.element(document, sp.daniel)], ["Nik", api.element(document, sp.nik)]].filter(([, chip]) => chip) : [];
    if(chips.length !== 2){ slot.hidden = true; return false; }
    for(const [name, chip] of chips){
        const who = document.createElement("span");
        who.append(document.createTextNode(name), chip);
        slot.appendChild(who);
    }
    slot.hidden = false;
    return true;
}

function openRuleBook(){
    createRuleBookScreen();
    renderRuleBookSpecialPlayers();
    showScreen("ruleBook");
    window.CareerModeV10Screens?.expect?.("ruleBook");
    window.loadRuntimeScript("rules-settings-v10", "js/rulesSettingsV10.js", () => Boolean(window.CareerModeRulesSettingsV10)).then(() => window.CareerModeRulesSettingsV10.install()).catch(() => { window.CareerModeV10Screens?.settle?.("ruleBook"); });
}

window.openRuleBook = openRuleBook;
```

## FILE: js/scoring.js
```js
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

```

## FILE: js/sharedCanonicalScoring.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r11";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const BREAKDOWN_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total","triggers"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","seasonCommitRevision","seasonCommitContentHash","scoring","winner","contentHash"]);
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,europaLeague:3});
  // r80 Europa League: a sparse 8th result key. It is present only when that manager won the Europa League, and then it is exactly
  // true with championsLeague false (one manager's season is CL or EL, never both; the two managers are never compared). A result
  // without the key is the unchanged 7-key r79 shape, so every hash over old results stays byte-identical. The breakdown carries
  // europaLeague:3 only for such a result.
  const EUROPA_LEAGUE="europaLeague";

  function scFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function scExact(value,keys,code="CANONICAL_SCORING_VALUE_INVALID"){if(!scPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scFail(code);return value;}
  function scClone(value){return JSON.parse(JSON.stringify(value));}
  function scFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scFreeze);Object.freeze(value);}return value;}
  function scCanonical(value){if(Array.isArray(value))return `[${value.map(scCanonical).join(",")}]`;if(scPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function scHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scFail("CANONICAL_SCORING_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function scTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)scFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return value;}
  function scEuropaLeague(value,code){if(!scPlain(value))scFail(code);const won=Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,won?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scFail(code);return won;}
  function scResult(value,teamCount){const europaLeague=scEuropaLeague(value,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)scFail("CANONICAL_SCORING_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scFail("CANONICAL_SCORING_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{})};}
  function scBreakdown(result){
    const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=result.topScorer,topAssist=result.topAssist;
    const breakdown={championsLeague:result.championsLeague?RULES.championsLeague:0,...(result.europaLeague===true?{europaLeague:RULES.europaLeague}:{}),leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,domesticCup:result.domesticCup?RULES.domesticCup:0,performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?RULES.performanceBonus:0,individualAwardsBonus:(topScorer||topAssist)?RULES.individualAwardsBonus:0,total:0,triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}};
    breakdown.total=breakdown.championsLeague+(breakdown.europaLeague||0)+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;return breakdown;
  }
  function scWinner(results,scoring){if(scoring.playerOne.total>scoring.playerTwo.total)return "playerOne";if(scoring.playerTwo.total>scoring.playerOne.total)return "playerTwo";return "draw";}
  function scValidateBreakdown(value){const europaLeague=scPlain(value)&&Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,europaLeague?[...BREAKDOWN_KEYS,EUROPA_LEAGUE]:BREAKDOWN_KEYS,"CANONICAL_SCORING_STATE_INVALID");if(europaLeague&&(value.europaLeague!==RULES.europaLeague||value.championsLeague!==0))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.triggers,TRIGGER_KEYS,"CANONICAL_SCORING_STATE_INVALID");for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]){if(!Number.isInteger(value[key])||value[key]<0||value[key]>11)scFail("CANONICAL_SCORING_STATE_INVALID");}for(const key of TRIGGER_KEYS){if(typeof value.triggers[key]!=="boolean")scFail("CANONICAL_SCORING_STATE_INVALID");}return value;}

  async function scCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonCommitModule=(typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit)}={}){
    const teams=scTeamCount(teamCount);if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");const commitProtocol=await seasonCommitModule.createProtocol({teamCount:teams,cryptoImpl});
    function scScoreAuthoritativeResults(value){scExact(value,ROLES,"CANONICAL_SCORING_RESULTS_INVALID");const results={playerOne:scResult(value.playerOne,teams),playerTwo:scResult(value.playerTwo,teams)},scoring={playerOne:null,playerTwo:null};scoring.playerOne=scBreakdown(results.playerOne);scoring.playerTwo=scBreakdown(results.playerTwo);return scFreeze({results,scoring,winner:scWinner(results,scoring)});}
    async function scAcknowledgedCommit(value){let verified;try{verified=await commitProtocol.verifyState(value);}catch(_error){scFail("CANONICAL_SCORING_SEASON_COMMIT_INVALID");}if(verified.phase!=="ACKNOWLEDGED"||verified.revision!==3||!verified.results?.playerOne||!verified.results?.playerTwo)scFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");return verified;}
    async function scSealState(core){return scFreeze({...scClone(core),contentHash:await scHash(core,cryptoImpl)});}
    async function scReconcile({seasonCommit}){const committed=await scAcknowledgedCommit(seasonCommit),projection=scScoreAuthoritativeResults(committed.results);const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:committed.seasonNumber,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:committed.revision,seasonCommitContentHash:committed.contentHash,scoring:projection.scoring,winner:projection.winner};return scSealState(core);}
    async function scVerifyScoringState(value,{seasonCommit}={}){scExact(value,STATE_KEYS,"CANONICAL_SCORING_STATE_INVALID");const core=scClone(value),hash=core.contentHash;delete core.contentHash;if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!=="SCORING_RECONCILED"||value.revision!==1||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||value.seasonCommitRevision!==3||!HASH.test(value.seasonCommitContentHash)||!HASH.test(hash)||!["playerOne","playerTwo","draw"].includes(value.winner))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.scoring,ROLES,"CANONICAL_SCORING_STATE_INVALID");ROLES.forEach(role=>scValidateBreakdown(value.scoring[role]));if(await scHash(core,cryptoImpl)!==hash)scFail("CANONICAL_SCORING_STATE_HASH_MISMATCH");if(seasonCommit){const expected=await scReconcile({seasonCommit});if(expected.seasonNumber!==value.seasonNumber||expected.seasonCommitContentHash!==value.seasonCommitContentHash||scCanonical(expected.scoring)!==scCanonical(value.scoring)||expected.winner!==value.winner)scFail("CANONICAL_SCORING_RECOMPUTE_MISMATCH");}return scFreeze(scClone(value));}
    function scProjectForRole(state,role){if(!ROLES.includes(role))scFail("CANONICAL_SCORING_ROLE_INVALID");return scFreeze({schemaVersion:state.schemaVersion,runtimeRevision:state.runtimeRevision,seasonNumber:state.seasonNumber,phase:state.phase,revision:state.revision,seasonCommitRevision:state.seasonCommitRevision,seasonCommitContentHash:state.seasonCommitContentHash,managerRole:role,scoring:scClone(state.scoring),winner:state.winner});}
    return scFreeze({contractVersion:1,feature:"ssjr-canonical-scoring",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,reconcile:scReconcile,verifyState:scVerifyScoringState,projectForRole:scProjectForRole,scoreAuthoritativeResults:scScoreAuthoritativeResults,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,leaguePositionThenPointsTiebreak:false,drawOnEqualTotals:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-canonical-scoring-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,createProtocol:scCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,leaguePositionThenPointsTiebreak:false,drawOnEqualTotals:true});
});
```

## FILE: js/productionSharedCanonicalScoring.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): after this manager acknowledged, read every 3 s for at most 3 minutes until the canonical score is reconciled.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  let installed=false,busy=false,view=null,contextKey="",setupApi=null,commitApi=null,provider=null,catalogApi=null,refreshPromise=null,headingObserver=null,bootstrapObserver=null;

  function pcscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pcscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pcscSharedMarker(){const showdown=pcscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pcscField(id){return root.document&&root.document.getElementById(id);}
  function pcscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pcscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pcscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pcscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pcscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pcscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcscLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
    await pcscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pcscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await pcscLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
    await pcscLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
    await pcscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;provider=root.CareerModeSparkSharedCanonicalScoring;catalogApi=root.CareerModeSharedShowdownCatalog;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pcscFail("CANONICAL_SCORING_SETUP_UNAVAILABLE");
    if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")pcscFail("CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE");
    if(!catalogApi||!catalogApi.catalog)pcscFail("CANONICAL_SCORING_CATALOG_UNAVAILABLE");
  }
  function pcscTeamCount(){const setup=setupApi?.getState?.()?.setup,clubs=setup?.leagueId?catalogApi?.catalog?.[setup.leagueId]:null;if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)pcscFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return clubs.length;}
  function pcscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pcscShowdown()?.currentRound,season=Number(pcscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pcscFail("CANONICAL_SCORING_SEASON_INVALID");return season;}
  function pcscConfirmedSetupRivalry(){try{const s=(setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function pcscRequestContext(){const showdown=pcscShowdown(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pcscConfirmedSetupRivalry()||"").trim();let seasonNumber;try{seasonNumber=pcscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function pcscContextMatches(request){const current=pcscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pcscCommitReady(request=pcscRequestContext()){const state=commitApi?.getState?.();return Boolean(request&&state&&state.committed===true&&state.phase==="ACKNOWLEDGED"&&state.revision===3&&Number(state.seasonNumber)===request.seasonNumber&&String(state.rivalryId||"")===request.rivalryId);}
  function pcscResult(result){if(result&&result.ok===true)return result;const error=new Error("Shared canonical scoring could not be verified.");error.code=result&&result.code||"CANONICAL_SCORING_PROVIDER_FAILED";throw error;}
  function pcscManagerName(role){return pcscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pcscEnsureUi(){
    const review=pcscField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
    let panel=pcscField("sharedCanonicalScoringPanel");if(!panel){panel=root.document.createElement("section");panel.id="sharedCanonicalScoringPanel";panel.className="seasonReviewBreakdown sharedCanonicalScoringPanel hidden";panel.setAttribute("aria-live","polite");panel.innerHTML='<h3 id="sharedCanonicalScoringHeading">SEASON SCORE</h3><p id="sharedCanonicalScoringTotals"></p><p id="sharedCanonicalScoringBreakdown"></p><p id="sharedCanonicalScoringWinner"></p>';actions.parentNode.insertBefore(panel,actions);}
    return {panel,totals:pcscField("sharedCanonicalScoringTotals"),breakdown:pcscField("sharedCanonicalScoringBreakdown"),winner:pcscField("sharedCanonicalScoringWinner")};
  }
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pcscWatchedKey=null;
  function pcscWatchSync(){let key="";try{key=pcscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcscWatchedKey)return;pcscWatchedKey=key;try{pcscWatchWait();}catch(_error){}}
  function pcscRender(){pcscWatchSync();
    const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
    const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
    pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
    pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);return true;
  }
  async function pcscProviderOptions(request){
    const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");
    if(String(setup.rivalryId)!==request.rivalryId)pcscFail("CANONICAL_SCORING_CONTEXT_STALE");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,teamCount:pcscTeamCount(),cryptoImpl:root.crypto,nowEpochMs:Date.now()};
  }
  // Job 33 (R1): a fast waiting read (light) reuses the already-ACKNOWLEDGED (immutable) Season Commit and confirmed Setup.
  async function pcscRefreshNow(request=pcscRequestContext(),light=false){
    if(!request||!pcscSharedMarker())return null;await pcscEnsureDependencies();if(!pcscContextMatches(request))return null;
    if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
    if(light!==true){await setupApi.refresh();if(!pcscContextMatches(request))return null;await commitApi.refresh();if(!pcscContextMatches(request))return null;}
    if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
    const result=pcscResult(await provider.read(await pcscProviderOptions(request)));if(!pcscContextMatches(request))return null;
    if(result.phase!=="SCORING_RECONCILED"||result.revision!==1||result.seasonCommitRevision!==3||Number(result.seasonNumber)!==request.seasonNumber)pcscFail("CANONICAL_SCORING_PROJECTION_INVALID");
    view={...result,rivalryId:request.rivalryId};contextKey=request.key;pcscRender();return view;
  }
  function pcscRefresh(light=false,reread=false){const request=pcscRequestContext();if(!request)return Promise.resolve(null);if(reread!==true&&view&&contextKey===request.key&&view.phase==="SCORING_RECONCILED"&&!refreshPromise)return Promise.resolve(view);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pcscRefreshNow(request,light===true);refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pcscWaitingKey(){
    const screen=pcscField("seasonEntry"),request=pcscRequestContext(),commit=(commitApi||root.CareerModeProductionSharedSeasonCommit)?.getState?.();if(!screen||screen.classList.contains("hidden")||!request||!commit)return "";
    if(commit.committed!==true||!(commit.ownAcknowledged===true||commit.phase==="ACKNOWLEDGED")||Number(commit.seasonNumber)!==request.seasonNumber||String(commit.rivalryId||"")!==request.rivalryId)return "";
    if(contextKey===request.key&&view&&view.phase==="SCORING_RECONCILED")return "";
    return `${request.key}|score`;
  }
  function pcscFastPollDue(){const key=pcscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  function pcscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcscWaitingKey()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(pcscRequestContext()):null);}catch(_error){path=null;}budget.watchWaitPoint("canonical-scoring",path,pcscWaitWake);}
  function pcscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void pcscTick(true);};inflight.then(again,again);return;}if(!busy){void pcscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcscTick(true);},400);}
  function pcscFastTick(){pcscWatchWait();if(root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||root.document?.visibilityState==="hidden"||busy||!pcscFastPollDue())return;void pcscTick(true);}
  // Job 33: a failed fast (3 s) read is retried by the next poll and is not reported; the 15 s poll still reports a real failure.
  // Job 33: a reconciled score is immutable, so the poll stops re-reading it (Spark reads, emulator contention) until the season changes.
  // A read that was overtaken by CONTINUE TO SEASON N (the season cursor moved mid-read) is not an error; the next tick reads the new season.
  // A season cursor change event still re-reads (reread=true), so a real failure there is reported and clears the view.
  // *_CONTEXT_STALE means the season moved on while a nested read ran; the next tick re-reads. Stay quiet and keep the view:
  // pcscRender only shows it for its own season key, and a reconciled season score never changes.
  function pcscContextStale(error){return /_CONTEXT_STALE$/.test(String(error?.code||""));}
  async function pcscTick(light=false,reread=false){if(!pcscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=pcscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;const request=pcscRequestContext();if(reread!==true&&request&&contextKey===request.key&&view?.phase==="SCORING_RECONCILED"){pcscRender();return;}busy=true;try{await pcscRefresh(light===true,reread===true);}catch(error){if(request&&!pcscContextMatches(request))return;if(pcscContextStale(error)){pcscRender();return;}if(light===true)return;view=null;pcscRender();pcscReport("Unable to refresh Shared Canonical Scoring",error);}finally{busy=false;}}
  function pcscAttachHeadingObserver(){if(!root.MutationObserver||!root.document)return false;const heading=pcscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;headingObserver=new root.MutationObserver(()=>void pcscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;}
  function pcscInstallObservers(){if(pcscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(pcscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function pcscInstall(){if(installed)return true;installed=true;pcscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pcscTick(false,true));if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pcscTick();},POLL_MS);root.setInterval(pcscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-canonical-scoring",productionEnabled:true,runtimeRevision:"1.9.1-r11",requiresAcknowledgedSeasonCommit:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,reusesSeasonReview:true,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcscWaitingKey()),install:pcscInstall,refresh:pcscRefresh,getState:()=>view,isActive:pcscSharedMarker});
});

```

## FILE: js/seasonEngine.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Season Entry, Pre-Commit Review and Progression Engine
===================================================== */

let seasonCompletionInProgress = false;
let seasonEntryRenderedRound = null;
let seasonEntryRenderedShowdownId = null;
let seasonReviewDraft = null;
let seasonReviewActive = false;
let seasonUI = null;

function ensureSeasonReviewUI(){
    if(document.getElementById("seasonReviewPanel")){
        return;
    }

    const seasonEntry = document.getElementById("seasonEntry");
    const completeButton = document.getElementById("completeSeason");
    const entryActions = completeButton ? completeButton.closest(".seasonEntryActions") : null;
    if(!seasonEntry || !entryActions){
        throw new Error("Season Review could not initialize because the Season Results shell is incomplete.");
    }

    const panel = document.createElement("section");
    panel.id = "seasonReviewPanel";
    panel.className = "seasonReviewPanel hidden";
    panel.setAttribute("aria-labelledby", "seasonReviewHeading");

    const status = document.createElement("div");
    status.className = "seasonReviewStatus";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "FINAL CHECK";
    const statusMeta = document.createElement("strong");
    statusMeta.id = "seasonReviewStatusMeta";
    statusMeta.textContent = "NOT SAVED YET";
    status.append(statusLabel, statusMeta);

    const heading = document.createElement("h3");
    heading.id = "seasonReviewHeading";
    heading.tabIndex = -1;
    heading.textContent = "REVIEW SEASON BEFORE SAVING";

    const intro = document.createElement("p");
    intro.className = "seasonReviewIntro";
    intro.textContent = "Check both managers: results and calculated scores.";

    const result = document.createElement("p");
    result.id = "seasonReviewResult";
    result.className = "summaryResult seasonReviewResult";
    result.setAttribute("aria-live", "polite");

    const grid = document.createElement("div");
    grid.className = "seasonSummaryGrid seasonReviewGrid";

    const playerOne = document.createElement("div");
    playerOne.id = "seasonReviewOne";
    playerOne.className = "seasonSummaryCard seasonReviewCard";

    const playerTwo = document.createElement("div");
    playerTwo.id = "seasonReviewTwo";
    playerTwo.className = "seasonSummaryCard seasonReviewCard";
    grid.append(playerOne, playerTwo);

    const overall = document.createElement("div");
    overall.className = "overallScoreBox seasonReviewOverall";
    const overallLabel = document.createElement("span");
    overallLabel.textContent = "SHOWDOWN SCORE AFTER THIS SEASON";
    const overallValue = document.createElement("strong");
    overallValue.id = "seasonReviewOverallScore";
    overallValue.textContent = "0 • 0";
    overall.append(overallLabel, overallValue);

    const warning = document.createElement("p");
    warning.className = "seasonReviewWarning";
    warning.textContent = "CONFIRMING IS FINAL · THE SEASON CAN'T BE EDITED AFTER";

    const error = document.createElement("p");
    error.id = "seasonReviewError";
    error.className = "formError seasonReviewError";
    error.setAttribute("aria-live", "assertive");

    const actions = document.createElement("div");
    actions.className = "seasonEntryActions seasonReviewActions";

    const confirm = document.createElement("button");
    confirm.id = "confirmSeasonCompletion";
    confirm.className = "menuButton";
    confirm.type = "button";
    confirm.textContent = "CONFIRM & SAVE SEASON";

    const edit = document.createElement("button");
    edit.id = "editSeasonResults";
    edit.className = "compactButton";
    edit.type = "button";
    edit.textContent = "EDIT RESULTS";

    actions.append(confirm, edit);
    panel.append(status, heading, intro, result, grid, overall, warning, error, actions);
    entryActions.parentNode.insertBefore(panel, entryActions);

    seasonUI = null;
}

function cacheSeasonUI(){
    seasonUI = {
        entryScreen: document.getElementById("seasonEntry"),
        entryHint: document.querySelector("#seasonEntry .seasonEntryHint"),
        entryGrid: document.querySelector("#seasonEntry .seasonEntryGrid"),
        entryActions: document.getElementById("completeSeason")?.closest(".seasonEntryActions") || null,
        completeButton: document.getElementById("completeSeason"),
        nextButton: document.getElementById("nextSeasonAction"),
        entryError: document.getElementById("seasonEntryError"),
        entryTitle: document.getElementById("seasonEntryTitle"),
        managerOne: document.getElementById("seasonManagerOne"),
        managerTwo: document.getElementById("seasonManagerTwo"),
        clubOne: document.getElementById("seasonClubOne"),
        clubTwo: document.getElementById("seasonClubTwo"),
        reviewPanel: document.getElementById("seasonReviewPanel"),
        reviewHeading: document.getElementById("seasonReviewHeading"),
        reviewStatusMeta: document.getElementById("seasonReviewStatusMeta"),
        reviewResult: document.getElementById("seasonReviewResult"),
        reviewOne: document.getElementById("seasonReviewOne"),
        reviewTwo: document.getElementById("seasonReviewTwo"),
        reviewOverall: document.getElementById("seasonReviewOverallScore"),
        reviewError: document.getElementById("seasonReviewError"),
        reviewConfirm: document.getElementById("confirmSeasonCompletion"),
        reviewEdit: document.getElementById("editSeasonResults"),
        summaryTitle: document.getElementById("seasonSummaryTitle"),
        summaryResult: document.getElementById("seasonSummaryResult"),
        overall: document.getElementById("seasonOverallScore"),
        summaryOne: document.getElementById("seasonSummaryOne"),
        summaryTwo: document.getElementById("seasonSummaryTwo")
    };
    return seasonUI;
}

function getSeasonUI(){
    return seasonUI || cacheSeasonUI();
}

function setSeasonText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function cloneSeasonValue(value){
    if(typeof cloneForStorage === "function"){
        return cloneForStorage(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function getSeasonReviewIntegrity(){
    const ui = getSeasonUI();
    const required = {
        panel: ui.reviewPanel,
        heading: ui.reviewHeading,
        playerOne: ui.reviewOne,
        playerTwo: ui.reviewTwo,
        overall: ui.reviewOverall,
        confirm: ui.reviewConfirm,
        edit: ui.reviewEdit
    };
    const missing = Object.entries(required)
        .filter(([, element]) => !element)
        .map(([name]) => name);
    const bindingProblems = [];

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        bindingProblems.push("review entry is not bound");
    }
    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        bindingProblems.push("season confirmation is not bound");
    }
    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        bindingProblems.push("season edit return is not bound");
    }

    return {
        healthy: missing.length === 0 && bindingProblems.length === 0,
        missing,
        bindingProblems,
        active: seasonReviewActive,
        hasDraft: Boolean(seasonReviewDraft)
    };
}

function initializeSeasonEngine(){
    ensureSeasonReviewUI();
    const ui = cacheSeasonUI();

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        ui.completeButton.dataset.seasonEngineBound = "true";
        ui.completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        ui.reviewConfirm.dataset.seasonConfirmBound = "true";
        ui.reviewConfirm.addEventListener("click", confirmCurrentSeason);
    }

    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        ui.reviewEdit.dataset.seasonEditBound = "true";
        ui.reviewEdit.addEventListener("click", editSeasonResults);
    }

    if(!seasonContinentalBound && typeof document.addEventListener === "function"){
        seasonContinentalBound = true;
        document.addEventListener("change", keepContinentalExclusive, true);
    }

    if(ui.nextButton && ui.nextButton.dataset.seasonEngineBound !== "true"){
        ui.nextButton.dataset.seasonEngineBound = "true";
        ui.nextButton.addEventListener("click", handleSeasonSummaryAction);
    }

    setSeasonText(ui.completeButton, "REVIEW SEASON");
    setSeasonEntryMode(false);

    const integrity = getSeasonReviewIntegrity();
    if(!integrity.healthy){
        throw new Error(`Season Review initialization failed: ${integrity.missing.concat(integrity.bindingProblems).join(", ")}`);
    }
}

function setSeasonEntryError(message = ""){
    setSeasonText(getSeasonUI().entryError, message);
}

function setSeasonReviewError(message = ""){
    setSeasonText(getSeasonUI().reviewError, message);
}

function setSeasonConfirmationBusy(isBusy){
    const ui = getSeasonUI();

    if(ui.reviewConfirm){
        ui.reviewConfirm.disabled = isBusy;
        ui.reviewConfirm.classList.toggle("isBusy", isBusy);
        ui.reviewConfirm.setAttribute("aria-busy", isBusy ? "true" : "false");
        setSeasonText(ui.reviewConfirm, isBusy ? "SAVING SEASON..." : "CONFIRM & SAVE SEASON");
    }
    if(ui.reviewEdit){
        ui.reviewEdit.disabled = isBusy;
    }
}

function reportSeasonError(message, error){
    console.error(`[Career Mode Showdown] ${message}:`, error);
    const detail = `${message}. ${error && error.message ? error.message : "Please try again."}`;
    if(seasonReviewActive){ setSeasonReviewError(detail); }
    else { setSeasonEntryError(detail); }

    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error);
    }
}

function setSeasonEntryMode(reviewing){
    const ui = getSeasonUI();
    seasonReviewActive = Boolean(reviewing);

    if(ui.entryScreen){
        ui.entryScreen.dataset.seasonEntryMode = reviewing ? "review" : "entry";
    }
    [ui.entryHint, ui.entryGrid, ui.entryActions, ui.entryError].forEach(element => {
        if(element){ element.classList.toggle("hidden", reviewing); }
    });
    if(ui.reviewPanel){
        ui.reviewPanel.classList.toggle("hidden", !reviewing);
    }
}

function clearSeasonReviewDraft(){
    seasonReviewDraft = null;
    setSeasonReviewError("");
}

function restoreSeasonEntryFromReview({ focus = false, clearDraft = true } = {}){
    if(clearDraft){ clearSeasonReviewDraft(); }
    setSeasonEntryMode(false);

    if(currentShowdown){
        setSeasonText(getSeasonUI().entryTitle, `SEASON ${Number(currentShowdown.currentRound)} RESULTS`);
    }

    if(focus){
        const firstInput = getSeasonInput("p1", "LeaguePosition");
        if(firstInput){ firstInput.focus({ preventScroll: true }); }
    }
}

function openSeasonEntry(){
    if(!currentShowdown){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No Showdown in progress. Start or join one from Home.", "error");
        }
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    restoreSeasonEntryFromReview({ focus: false, clearDraft: true });

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        openTransferChallenge();
        return;
    }

    const ui = getSeasonUI();
    const currentRound = Number(currentShowdown.currentRound);
    const currentShowdownId = String(currentShowdown.id);

    setSeasonText(ui.entryTitle, `SEASON ${currentRound} RESULTS`);
    setSeasonText(ui.managerOne, currentShowdown.managers.playerOne);
    setSeasonText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setSeasonText(ui.clubOne, currentShowdown.clubs.playerOne);
    setSeasonText(ui.clubTwo, currentShowdown.clubs.playerTwo);
    setSeasonText(ui.completeButton, "REVIEW SEASON");

    if(
        seasonEntryRenderedRound !== currentRound
        || String(seasonEntryRenderedShowdownId) !== currentShowdownId
    ){
        resetSeasonEntryFields();
        seasonEntryRenderedRound = currentRound;
        seasonEntryRenderedShowdownId = currentShowdownId;
    }

    setSeasonEntryError("");
    showScreen("seasonEntry");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function resetSeasonEntryFields(){
    ["p1", "p2"].forEach(prefix => {
        ["LeaguePosition", "LeaguePoints", "LeagueGoals"].forEach(field => {
            const input = document.getElementById(`${prefix}${field}`);
            if(input && input.value !== ""){ input.value = ""; }
        });

        ["DomesticCup", "ChampionsLeague", "EuropaLeague", "TopScorer", "TopAssist"].forEach(field => {
            const checkbox = document.getElementById(`${prefix}${field}`);
            if(checkbox && checkbox.checked){ checkbox.checked = false; }
        });
    });
}

// Review and summary breakdown lines. They live here (moved out of the startup js/scoring.js in r80), the only place they are shown.
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
    // r80: the Europa League line shows only for a season that won it (+3), so every other season reads as before.
    return [
        ["Champions League", scoring.championsLeague || 0],
        ...(scoring.europaLeague > 0 ? [["Europa League", scoring.europaLeague]] : []),
        ["League Title", scoring.leagueTitle || 0],
        ["Domestic Cup", scoring.domesticCup || 0],
        [buildPerformanceBonusLabel(scoring), scoring.performanceBonus || 0],
        [buildAwardsBonusLabel(scoring), scoring.individualAwardsBonus || scoring.awardsBonus || 0]
    ];
}

function getSeasonInput(prefix, field){
    return document.getElementById(`${prefix}${field}`);
}

function readSeasonResult(prefix){
    const position = getSeasonInput(prefix, "LeaguePosition");
    const points = getSeasonInput(prefix, "LeaguePoints");
    const goals = getSeasonInput(prefix, "LeagueGoals");
    const domesticCup = getSeasonInput(prefix, "DomesticCup");
    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const topScorer = getSeasonInput(prefix, "TopScorer");
    const topAssist = getSeasonInput(prefix, "TopAssist");
    const europaLeague = getSeasonInput(prefix, "EuropaLeague");

    if(!position || !points || !goals || !domesticCup || !championsLeague || !topScorer || !topAssist){
        throw new Error(`Season form controls are missing for ${prefix}.`);
    }

    const result = {
        leaguePosition: Number(position.value),
        leaguePoints: Number(points.value),
        leagueGoals: Number(goals.value),
        domesticCup: domesticCup.checked,
        championsLeague: championsLeague.checked,
        topScorer: topScorer.checked,
        topAssist: topAssist.checked
    };
    // r80: the stored result carries europaLeague only when that manager won it (never together with the Champions League).
    if(europaLeague && europaLeague.checked && !result.championsLeague){ result.europaLeague = true; }
    return result;
}

// r80: one manager's season is Champions League or Europa League, never both. Ticking one unticks the other for that manager
// only; the two managers play different FIFA saves, so their boxes are never compared.
let seasonContinentalBound = false;
function keepContinentalExclusive(event){
    const match = /^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(event && event.target && event.target.id || ""));
    if(!match || !event.target.checked){ return; }
    const other = getSeasonInput(match[1], match[2] === "ChampionsLeague" ? "EuropaLeague" : "ChampionsLeague");
    if(other && other.checked){ other.checked = false; }
}

function getCurrentLeagueTeamCount(){
    if(!currentShowdown || !currentShowdown.selectedLeague || typeof getClubsForLeague !== "function"){
        return null;
    }

    const clubs = getClubsForLeague(currentShowdown.selectedLeague.id);
    return Array.isArray(clubs) && clubs.length ? clubs.length : null;
}

function getSeasonEntryValidationMessage(prefix, managerLabel){
    const positionInput = getSeasonInput(prefix, "LeaguePosition");
    const pointsInput = getSeasonInput(prefix, "LeaguePoints");
    const goalsInput = getSeasonInput(prefix, "LeagueGoals");

    if(!positionInput || !pointsInput || !goalsInput){
        return `${managerLabel}'s season form is incomplete.`;
    }

    if(positionInput.value === "" || pointsInput.value === "" || goalsInput.value === ""){
        return `Enter league position, league points and league goals for ${managerLabel}.`;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);
    const teamCount = getCurrentLeagueTeamCount();

    if(!Number.isInteger(position) || position < 1){
        return `${managerLabel}'s league position must be a whole number of 1 or higher.`;
    }

    if(teamCount && position > teamCount){
        return `${managerLabel}'s league position cannot be lower than ${teamCount}th in this league.`;
    }

    if(!Number.isInteger(points) || points < 0){
        return `${managerLabel}'s league points must be a non-negative whole number.`;
    }

    if(!Number.isInteger(goals) || goals < 0){
        return `${managerLabel}'s league goals must be a non-negative whole number.`;
    }

    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const europaLeague = getSeasonInput(prefix, "EuropaLeague");
    if(championsLeague && championsLeague.checked && europaLeague && europaLeague.checked){
        return `${managerLabel}: pick Champions League or Europa League, not both.`;
    }

    return "";
}

function validateSeasonEntry(prefix){
    const label = prefix === "p1"
        ? (currentShowdown ? currentShowdown.managers.playerOne : "Manager 1")
        : (currentShowdown ? currentShowdown.managers.playerTwo : "Manager 2");

    return getSeasonEntryValidationMessage(prefix, label) === "";
}

function buildSeasonRecord(seasonNumber, playerOne, playerTwo, completedAt = new Date().toISOString()){
    playerOne.scoring = calculatePlayerSeasonScore(playerOne);
    playerTwo.scoring = calculatePlayerSeasonScore(playerTwo);

    return {
        roundNumber: seasonNumber,
        completedAt,
        transferChallengeSeason: seasonNumber,
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    };
}

function getSeasonReviewFingerprint(roundRecord){
    if(!roundRecord || !roundRecord.playerOne || !roundRecord.playerTwo){
        return "";
    }

    const normalizePlayer = player => ({
        leaguePosition: Number(player.leaguePosition),
        leaguePoints: Number(player.leaguePoints),
        leagueGoals: Number(player.leagueGoals),
        domesticCup: Boolean(player.domesticCup),
        championsLeague: Boolean(player.championsLeague),
        europaLeague: player.europaLeague === true,
        topScorer: Boolean(player.topScorer),
        topAssist: Boolean(player.topAssist),
        scoring: calculatePlayerSeasonScore(player)
    });

    const playerOne = normalizePlayer(roundRecord.playerOne);
    const playerTwo = normalizePlayer(roundRecord.playerTwo);

    return JSON.stringify({
        roundNumber: Number(roundRecord.roundNumber),
        transferChallengeSeason: Number(roundRecord.transferChallengeSeason),
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    });
}

function buildTrustedSeasonRecordFromReview(draft){
    if(!draft || !draft.roundRecord){
        throw new Error("No reviewed season is available to save.");
    }

    const source = draft.roundRecord;
    const playerOne = cloneSeasonValue(source.playerOne);
    const playerTwo = cloneSeasonValue(source.playerTwo);
    delete playerOne.scoring;
    delete playerTwo.scoring;

    const trusted = buildSeasonRecord(draft.seasonNumber, playerOne, playerTwo, null);
    const fingerprint = getSeasonReviewFingerprint(trusted);
    if(!draft.fingerprint || fingerprint !== draft.fingerprint){
        throw new Error("The reviewed season changed before confirmation. Return to Edit Results and review it again.");
    }

    trusted.completedAt = new Date().toISOString();
    return trusted;
}

function persistCompletedSeason(roundRecord, seasonNumber){
    const previousState = {
        roundsLength: currentShowdown.rounds.length,
        currentRound: currentShowdown.currentRound,
        status: currentShowdown.status,
        completedAt: currentShowdown.completedAt,
        score: cloneForStorage(currentShowdown.score)
    };

    currentShowdown.rounds.push(roundRecord);
    recalculateShowdownScores(currentShowdown);

    if(seasonNumber >= currentShowdown.totalRounds){
        currentShowdown.status = "Completed";
        currentShowdown.completedAt = currentShowdown.completedAt || new Date().toISOString();
    }else{
        currentShowdown.currentRound = seasonNumber + 1;
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
        currentShowdown.rounds.length = previousState.roundsLength;
        currentShowdown.currentRound = previousState.currentRound;
        currentShowdown.status = previousState.status;
        currentShowdown.completedAt = previousState.completedAt;
        currentShowdown.score = previousState.score;
        throw new Error("The season could not be saved.");
    }

    if(currentShowdown.status === "Completed"){
        const archived = archiveShowdown(currentShowdown);
        if(!archived && typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved, but the completed showdown could not be copied to Legacy. The active save is safe and can be archived again later.",
                "error",
                10000
            );
        }
    }
}

function getSeasonCompletionContextMessage(){
    if(!currentShowdown){
        return "No Showdown in progress. Start or join one from Home.";
    }

    if(currentShowdown.status === "Completed"){
        return "This showdown is already completed.";
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        return "Complete the current season's Transfer Challenge before submitting results.";
    }

    const playerOneValidation = getSeasonEntryValidationMessage("p1", currentShowdown.managers.playerOne);
    if(playerOneValidation){ return playerOneValidation; }

    const playerTwoValidation = getSeasonEntryValidationMessage("p2", currentShowdown.managers.playerTwo);
    if(playerTwoValidation){ return playerTwoValidation; }

    const seasonNumber = Number(currentShowdown.currentRound);
    const alreadyCompleted = currentShowdown.rounds.some(
        round => Number(round.roundNumber) === seasonNumber
    );
    return alreadyCompleted
        ? "This season has already been completed. Return to Showdown Home to continue."
        : "";
}

function createSeasonReviewDraft(){
    const seasonNumber = Number(currentShowdown.currentRound);
    const playerOne = readSeasonResult("p1");
    const playerTwo = readSeasonResult("p2");
    const roundRecord = buildSeasonRecord(seasonNumber, playerOne, playerTwo, null);

    return {
        showdownId: String(currentShowdown.id),
        seasonNumber,
        roundRecord: cloneSeasonValue(roundRecord),
        fingerprint: getSeasonReviewFingerprint(roundRecord)
    };
}

function appendSeasonReviewLine(container, label, value, className = ""){
    const row = document.createElement("div");
    row.className = `summaryLine seasonReviewLine${className ? ` ${className}` : ""}`;

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    container.appendChild(row);
}

function renderSeasonReviewAchievements(container, playerRecord){
    const group = document.createElement("div");
    group.className = "seasonReviewAchievements";

    [
        ["Champions League", playerRecord.championsLeague],
        ["Europa League", playerRecord.europaLeague === true],
        ["Domestic Cup", playerRecord.domesticCup],
        ["Top Scorer", playerRecord.topScorer],
        ["Top Assist", playerRecord.topAssist]
    ].forEach(([label, active]) => {
        const item = document.createElement("span");
        item.className = active ? "isEarned" : "isNotEarned";
        item.textContent = `${active ? "✓" : "—"} ${label}`;
        group.appendChild(item);
    });

    container.appendChild(group);
}

function renderManagerSeasonReview(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){ return; }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSeasonReviewLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSeasonReviewLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSeasonReviewLine(fragment, "League Goals", playerRecord.leagueGoals);
    renderSeasonReviewAchievements(fragment, playerRecord);

    const scoreHeading = document.createElement("p");
    scoreHeading.className = "seasonReviewScoreHeading";
    scoreHeading.textContent = "CALCULATED SCORE";
    fragment.appendChild(scoreHeading);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        appendSeasonReviewLine(fragment, label, `+${points}`, points === 0 ? "isZero" : "isScoring");
    });

    const total = document.createElement("div");
    total.className = "summaryTotal seasonReviewTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function renderSeasonReview(draft){
    const ui = getSeasonUI();
    const roundRecord = draft.roundRecord;
    const seasonNumber = Number(draft.seasonNumber);

    setSeasonText(ui.entryTitle, `SEASON ${seasonNumber} REVIEW`);
    setSeasonText(ui.reviewHeading, `REVIEW SEASON ${seasonNumber} BEFORE SAVING`);
    setSeasonText(ui.reviewStatusMeta, `SEASON ${seasonNumber} · NOT SAVED YET`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerOne} is projected to win Season ${seasonNumber}`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerTwo} is projected to win Season ${seasonNumber}`);
    }else{
        setSeasonText(ui.reviewResult, `Season ${seasonNumber} is heading for a draw`);
    }

    renderManagerSeasonReview(
        ui.reviewOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );
    renderManagerSeasonReview(
        ui.reviewTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    const priorOne = Number(currentShowdown.score && currentShowdown.score.playerOne) || 0;
    const priorTwo = Number(currentShowdown.score && currentShowdown.score.playerTwo) || 0;
    setSeasonText(
        ui.reviewOverall,
        `${currentShowdown.managers.playerOne} ${priorOne + roundRecord.playerOne.scoring.total}  •  ${priorTwo + roundRecord.playerTwo.scoring.total} ${currentShowdown.managers.playerTwo}`
    );

    setSeasonReviewError("");
    setSeasonEntryMode(true);

    if(ui.reviewHeading){
        window.requestAnimationFrame(() => ui.reviewHeading.focus({ preventScroll: true }));
    }
}

function completeCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(!currentShowdown){
        setSeasonEntryError("No Showdown in progress. Start or join one from Home.");
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    const validationMessage = getSeasonCompletionContextMessage();
    if(validationMessage){
        setSeasonEntryError(validationMessage);
        return;
    }

    try{
        seasonReviewDraft = createSeasonReviewDraft();
        if(!seasonReviewDraft.fingerprint){
            throw new Error("The Season Review snapshot could not be verified.");
        }
        setSeasonEntryError("");
        renderSeasonReview(seasonReviewDraft);
    }catch(error){
        clearSeasonReviewDraft();
        reportSeasonError("Season review failed", error);
    }
}

function getSeasonReviewConfirmationMessage(draft){
    if(!draft || !currentShowdown){
        return "The reviewed season is no longer available. Return to Edit Results and review it again.";
    }
    if(String(currentShowdown.id) !== String(draft.showdownId)){
        return "The active showdown changed after this review. Return to Edit Results and review the current season again.";
    }
    if(Number(currentShowdown.currentRound) !== Number(draft.seasonNumber)){
        return "The active season changed after this review. Return to Showdown Home before continuing.";
    }
    if(currentShowdown.status === "Completed"){
        return "This showdown has already been completed.";
    }
    if(!isTransferChallengeComplete(draft.seasonNumber)){
        return "The Transfer Challenge is no longer complete for this reviewed season.";
    }
    if(currentShowdown.rounds.some(round => Number(round.roundNumber) === Number(draft.seasonNumber))){
        return "This season has already been saved. Return to Showdown Home to continue.";
    }
    return "";
}

function confirmCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    const contextMessage = getSeasonReviewConfirmationMessage(seasonReviewDraft);
    if(contextMessage){
        setSeasonReviewError(contextMessage);
        return;
    }

    let roundRecord;
    try{
        roundRecord = buildTrustedSeasonRecordFromReview(seasonReviewDraft);
    }catch(error){
        reportSeasonError("Season confirmation blocked", error);
        return;
    }

    const seasonNumber = Number(seasonReviewDraft.seasonNumber);
    seasonCompletionInProgress = true;
    setSeasonConfirmationBusy(true);
    setSeasonReviewError("");

    try{
        persistCompletedSeason(roundRecord, seasonNumber);
        seasonEntryRenderedRound = null;
        seasonEntryRenderedShowdownId = null;
        seasonReviewDraft = null;
    }catch(error){
        reportSeasonError("Season completion failed", error);
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
        return;
    }

    try{
        seasonReviewActive = false;
        updateShowdownUI();
        renderSeasonSummary(roundRecord);

        if(!showScreen("seasonSummary")){
            throw new Error("The Season Summary screen could not be opened.");
        }

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(`Season ${seasonNumber} saved successfully.`, "success", 3500);
        }
    }catch(error){
        console.error("Season was saved but the summary screen failed to render:", error);
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Season saved, but the summary screen failed", error);
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved successfully, but the summary could not be displayed. Showdown Home remains safe to continue from.",
                "error",
                9000
            );
        }
        showScreen("dashboard");
    }finally{
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
    }
}

function editSeasonResults(){
    if(seasonCompletionInProgress){ return; }
    restoreSeasonEntryFromReview({ focus: true, clearDraft: true });
}

function renderSeasonSummary(roundRecord){
    if(!currentShowdown || !roundRecord){
        return;
    }

    const ui = getSeasonUI();
    setSeasonText(ui.summaryTitle, `SEASON ${roundRecord.roundNumber} SUMMARY`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerOne} wins the season`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerTwo} wins the season`);
    }else{
        setSeasonText(ui.summaryResult, "Season is a draw");
    }

    renderManagerSeasonSummary(
        ui.summaryOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );

    renderManagerSeasonSummary(
        ui.summaryTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    setSeasonText(
        ui.overall,
        `${currentShowdown.managers.playerOne} ${currentShowdown.score.playerOne}  •  ${currentShowdown.score.playerTwo} ${currentShowdown.managers.playerTwo}`
    );

    if(ui.nextButton){
        setSeasonText(
            ui.nextButton,
            currentShowdown.status === "Completed"
                ? "VIEW COMPLETED SHOWDOWN"
                : `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`
        );
    }

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderManagerSeasonSummary(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){
        return;
    }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSummaryLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSummaryLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSummaryLine(fragment, "League Goals", playerRecord.leagueGoals);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        if(points > 0){
            appendSummaryLine(fragment, label, `+${points}`);
        }
    });

    const total = document.createElement("div");
    total.className = "summaryTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function appendSummaryLine(container, label, value){
    const row = document.createElement("div");
    row.className = "summaryLine";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    container.appendChild(row);
}

function handleSeasonSummaryAction(){
    if(!currentShowdown){
        return;
    }

    if(currentShowdown.status === "Completed"){
        updateShowdownUI();
        showScreen("dashboard");
        return;
    }

    openTransferChallenge();
}

window.initializeSeasonEngine = initializeSeasonEngine;
window.openSeasonEntry = openSeasonEntry;
window.completeCurrentSeason = completeCurrentSeason;
window.confirmCurrentSeason = confirmCurrentSeason;
window.editSeasonResults = editSeasonResults;
window.getSeasonReviewIntegrity = getSeasonReviewIntegrity;
window.renderSeasonSummary = renderSeasonSummary;

```

## FILE: js/sharedCareerAnalytics.js
```js
(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerAnalytics=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History){
  "use strict";

  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const COUNTERS=Object.freeze(["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","performanceBonuses","awardsBonuses"]);
  const BESTS=Object.freeze(["bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition"]);
  const AVERAGES=Object.freeze(["averageSeasonScore","averageLeaguePoints","averageLeagueGoals"]);
  const CABINET=Object.freeze(["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"]);
  const LABELS=Object.freeze(["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"]);

  function caFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(caFreeze);Object.freeze(value);}return value;}
  function managerBase(unknown){
    return {...Object.fromEntries(COUNTERS.map(key=>[key,unknown?null:0])),...Object.fromEntries([...BESTS,...AVERAGES].map(key=>[key,null])),showdowns:{completed:unknown?null:0,wins:unknown?null:0,draws:unknown?null:0,losses:unknown?null:0}};
  }
  function managerFor(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
  function seasonTiebreak(season){
    const a=season.playerOne,b=season.playerTwo;
    // r83: no tiebreak. Equal Showdown points is a draw, whatever the league table says.
    return a.scoring.total!==b.scoring.total?"none":"draw";
  }
  function caCanonical(value){
    if(Array.isArray(value))return "["+value.map(caCanonical).join(",")+"]";
    if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+caCanonical(value[key])).join(",")+"}";
    return JSON.stringify(value);
  }
  function verified(entry){
    const classification=entry.classification;
    if(classification==="abandoned"||classification==="unavailable")return {rivalryId:entry.rivalryId,classification,projection:null,final:null,...(classification==="abandoned"&&entry.ended&&typeof entry.ended==="object"?{ended:endedOf(entry.ended)}:{})};
    if(!["active","completion-pending","completed"].includes(classification))return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};
    try{
      const p=History.verifyProjection(entry.projection);
      if(p.rivalryId!==entry.rivalryId)throw new Error("CAREER_RIVALRY_MISMATCH");
      let final=null;
      if(classification!=="active"){
        const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
        const winner=a>b?"playerOne":b>a?"playerTwo":"draw";
        if(entry.final?.totals?.playerOne!==a||entry.final?.totals?.playerTwo!==b||entry.final?.winner!==winner)throw new Error("CAREER_FINAL_MISMATCH");
        final={totals:{playerOne:a,playerTwo:b},winner};
      }
      // r86 (red team #13): the Setup confirm time rides along, so a row can say whether this Showdown has Special Players.
      return {rivalryId:entry.rivalryId,classification,projection:p,final,setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null};
    }catch(_error){return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};}
  }
  function uniqueEntries(showdowns){
    const entries=[],positions=new Map(),fingerprints=new Map();
    for(const source of showdowns){
      if(source.classification==="pending")continue;
      const entry=verified(source),id=entry.rivalryId;
      // Lifecycle and setup disagreements are also integrity failures; never choose a side.
      const fingerprint=caCanonical({classification:source.classification,projection:source.projection??null,final:source.final??null});
      if(!positions.has(id)){
        positions.set(id,entries.length);fingerprints.set(id,fingerprint);entries.push(entry);
      }else if(fingerprints.get(id)!==fingerprint||entry.classification==="unavailable"){
        entries[positions.get(id)]={rivalryId:id,classification:"unavailable",projection:null,final:null};
      }
    }
    return entries;
  }
  // r80 Ended early: an abandoned row read from its closed root also carries its close time and seasons played (null when
  // unknown); it never counts.
  function endedOf(ended){const at=ended?.endedAt,played=ended?.seasonsPlayed;return {endedAt:Number.isFinite(at)&&at>0?at:null,seasonsPlayed:Number.isInteger(played)&&played>=0&&played<=10?played:null};}
  function statusRow(entry,number){const ended=entry.ended||null;return {number,rivalryId:entry.rivalryId,status:entry.classification,leagueId:null,clubs:null,seasonsPlayed:ended?ended.seasonsPlayed:null,totalSeasons:null,totals:null,winner:null,seasons:[],setupConfirmedAt:null,...(ended?{endedAt:ended.endedAt}:{})};}
  function seasonRow(season){
    const pair=field=>({daniel:season.playerOne[field],nik:season.playerTwo[field]});
    // r80: a season with a Europa League win also names who won it (History shows it); other seasons keep the r79 row shape.
    const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
    return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
  }
  function accumulate(record,season,role,sums){
    const r=season[role],score=r.scoring.total;
    record.seasons+=1;record.careerPoints+=score;
    sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(r.championsLeague)record.championsLeagues+=1;
    if(r.europaLeague===true)record.europaLeagues+=1;
    if(r.leaguePosition===1)record.leagueTitles+=1;
    if(r.domesticCup)record.domesticCups+=1;
    if(r.leaguePoints>=100)record.hundredPointSeasons+=1;
    if(r.leagueGoals>=100)record.hundredGoalSeasons+=1;
    if(r.topScorer)record.topScorerSeasons+=1;
    if(r.topAssist)record.topAssistSeasons+=1;
    if(score===11)record.perfectSeasons+=1;
    record.performanceBonuses+=r.scoring.performanceBonus;
    record.awardsBonuses+=r.scoring.individualAwardsBonus;
    for(const [key,value] of [["bestSeasonScore",score],["bestLeaguePoints",r.leaguePoints],["bestLeagueGoals",r.leagueGoals],["bestLeaguePosition",r.leaguePosition]]){
      record[key]=record[key]===null?value:key==="bestLeaguePosition"?Math.min(record[key],value):Math.max(record[key],value);
    }
  }
  function bestRecord(label,candidates){
    if(!candidates.length)return {label,manager:"shared",value:null,ref:null};
    const value=Math.max(...candidates.map(candidate=>candidate.value));
    const tied=candidates.filter(candidate=>candidate.value===value);
    const managers=new Set(tied.map(candidate=>candidate.manager));
    const places=new Set(tied.map(candidate=>caCanonical(candidate.ref)));
    return {label,manager:managers.size===1?tied[0].manager:"shared",value,ref:places.size===1&&tied[0].ref?{...tied[0].ref}:null};
  }
  function trophyRoom(managers,records,unknown){
    const cabinet=Object.fromEntries(MANAGERS.map(manager=>[manager,Object.fromEntries(CABINET.map(key=>[key,managers[manager][key]]))]));
    const standings=unknown?[]:MANAGERS.map(manager=>({manager,careerPoints:managers[manager].careerPoints,seasonWins:managers[manager].seasonWins}));
    // r83 (Nik 2026-10-23): equal career points are level, as a tied Showdown total is a DRAW. Season wins are a stat, never
    // a tiebreak for the crown or #1, so Legacy's DRAW and the career ranks always tell the same story.
    standings.sort((a,b)=>b.careerPoints-a.careerPoints);
    if(standings.length&&standings[0].careerPoints===standings[1].careerPoints)standings.forEach(row=>{row.level=true;});
    return {cabinet,standings,records};
  }
  function buildCareerModel({indexStatus,showdowns=[],...options}={}){
    const interimLabel=options["current"+"ShowdownOnly"]===true?"Current Showdown only. Career history is not yet available.":null;
    const unknown=indexStatus!=="ready";
    const managers={daniel:managerBase(unknown),nik:managerBase(unknown)};
    if(unknown)return caFreeze({status:indexStatus==="loading"?"loading":"unavailable",interimLabel,coverage:{readable:null,indexed:null},managers,biggestShowdownWin:null,trophyRoom:trophyRoom(managers,[],true),history:{showdowns:[]}});

    const entries=uniqueEntries(showdowns),rows=[],sums={daniel:{points:0,goals:0},nik:{points:0,goals:0}};
    const candidates=[[],[],[],[],[]];
    let readable=0,biggestShowdownWin=null;
    for(const entry of entries){
      const {projection:p,classification}=entry;
      if(classification==="unavailable"||classification==="abandoned"){
        if(classification==="abandoned")readable+=1;
        rows.push(statusRow(entry,rows.length+1));continue;
      }
      readable+=1;
      // r83 (JOB-4 F1): career totals, cabinets, ranks and records count finished Showdowns only, so every career screen
      // agrees with History/Legacy and never depends on whether this page holds the live History. An unfinished Showdown
      // keeps its row and shows on THIS SHOWDOWN / Rivalry Statistics. The labelled current-only view (interimLabel) is that
      // live Showdown on its own, so it still counts it.
      if(classification==="completed"||interimLabel!==null)for(const season of p.seasonHistory){
        for(let i=0;i<ROLES.length;i+=1){
          const role=ROLES[i],manager=MANAGERS[i],r=season[role];
          accumulate(managers[manager],season,role,sums[manager]);
          const ref={rivalryId:entry.rivalryId,season:season.roundNumber};
          for(const [index,value] of [r.scoring.total,r.leaguePoints,r.leagueGoals].entries())candidates[index].push({manager,value,ref});
        }
      }
      const totals={daniel:p.managerRecords.playerOne.totalPoints,nik:p.managerRecords.playerTwo.totalPoints};
      const finalWinner=classification==="active"?null:managerFor(entry.final.winner);
      rows.push({number:rows.length+1,rivalryId:entry.rivalryId,status:classification==="active"?"in-progress":classification,leagueId:p.leagueId,clubs:{daniel:p.managerRecords.playerOne.club,nik:p.managerRecords.playerTwo.club},seasonsPlayed:p.acceptedSeasons,totalSeasons:p.totalSeasons,totals,winner:finalWinner,seasons:p.seasonHistory.map(seasonRow),setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null});
      if(classification==="completed"){
        for(const manager of MANAGERS){
          const outcomes=managers[manager].showdowns;outcomes.completed+=1;
          if(finalWinner==="draw")outcomes.draws+=1;else if(finalWinner===manager)outcomes.wins+=1;else outcomes.losses+=1;
        }
        if(finalWinner!=="draw"){
          const margin=Math.abs(totals.daniel-totals.nik);
          const win={manager:finalWinner,margin,showdownRef:entry.rivalryId};
          // Equal biggest wins keep the first career-order witness; the record reports shared ties.
          if(biggestShowdownWin===null||margin>biggestShowdownWin.margin)biggestShowdownWin=win;
          candidates[3].push({manager:finalWinner,value:margin,ref:{rivalryId:entry.rivalryId}});
        }
      }
    }
    for(const manager of MANAGERS){
      const record=managers[manager];record.totalTrophies=record.championsLeagues+record.europaLeagues+record.leagueTitles+record.domesticCups;
      if(record.seasons){
        record.averageSeasonScore=record.careerPoints/record.seasons;
        record.averageLeaguePoints=sums[manager].points/record.seasons;
        record.averageLeagueGoals=sums[manager].goals/record.seasons;
        candidates[4].push({manager,value:record.perfectSeasons,ref:null});
      }
    }
    const records=LABELS.map((label,index)=>bestRecord(label,candidates[index]));
    // A cross-manager tie for the biggest win is shared, as in the Trophy Room record.
    if(biggestShowdownWin&&records[3].manager==="shared")biggestShowdownWin={manager:"shared",margin:biggestShowdownWin.margin,showdownRef:null};
    return caFreeze({status:entries.length===0?"empty":readable<entries.length?"partial":"ready",interimLabel,coverage:{readable,indexed:entries.length},managers,biggestShowdownWin,trophyRoom:trophyRoom(managers,records,false),history:{showdowns:rows}});
  }
  return Object.freeze({buildCareerModel,seasonTiebreak});
});

```

## FILE: js/careerSummaryStore.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerSummaryStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 reads at scale (Nik 2026-10-27): a finished Showdown never changes, so after one full verified read its result is
  // kept as one summary in Firebase (accounts/{uid}/careerSummary/{rivalryId}, create-only, Rules check the totals against
  // the Terminal Close witness) and as a copy on this phone (IndexedDB). Firebase stays the only truth: a phone without its
  // copy reads the summaries, and a Showdown without a summary is read in full as before and then summarised (this also
  // backfills games finished before r86). Only results of a closed root are summarised: completed (Rules check the totals),
  // abandoned / Ended early and never-started codes (status only); the payload is the reader's own result, byte for byte.
  const CSS_STATUSES=Object.freeze(["completed","abandoned","never-started"]);
  const CSS_ID=/^pair_[0-9a-f]{64}$/;
  const CSS_HASH=/^sha256:[0-9a-f]{64}$/;
  const CSS_MAX_PAYLOAD=262144;
  const CSS_DB="cms-career-summaries",CSS_STORE="summaries";
  const CSS_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","status","totalSeasons","managerTotals","winner","payload","payloadHash"]);
  // The reader version this payload comes from (Sol r86 #11). The Firebase summary carries it as schemaVersion and the
  // phone copy as readerVersion; a copy from another version is not used. A future reader change bumps it and, since a
  // summary is never updated, the Rules then need the new schemaVersion and an update to a higher one.
  const CSS_READER_VERSION=1;
  const cssLocal=new Map();

  function cssFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(cssFreeze);Object.freeze(value);}return value;}
  async function cssDigest(text,cryptoImpl){
    const c=cryptoImpl||root.crypto;
    if(!c?.subtle||typeof TextEncoder==="undefined")return null;
    const bytes=new Uint8Array(await c.subtle.digest("SHA-256",new TextEncoder().encode(text)));
    return "sha256:"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  }
  // A summary-worthy result: a closed root's terminal answer for exactly this Showdown.
  function cssSummarisable(state,rivalryId){
    if(!state||typeof state!=="object"||!CSS_STATUSES.includes(state.status)||state.rivalryId!==rivalryId)return false;
    if(state.status==="completed")return Boolean(state.projection&&typeof state.projection==="object"&&state.final&&state.terminalWitness?.managerTotals);
    return Boolean(state.ended&&typeof state.ended==="object");
  }
  // A payload is used only when it hashes to its recorded hash and holds such a result.
  async function cssParse(payload,payloadHash,rivalryId,cryptoImpl){
    if(typeof payload!=="string"||!payload||payload.length>CSS_MAX_PAYLOAD||typeof payloadHash!=="string"||!CSS_HASH.test(payloadHash))return null;
    if(await cssDigest(payload,cryptoImpl)!==payloadHash)return null;
    let state;try{state=JSON.parse(payload);}catch(_error){return null;}
    if(!cssSummarisable(state,rivalryId))return null;
    return cssFreeze(state);
  }

  // ---- phone copy (IndexedDB; absent or blocked storage simply means no copy) ----
  function cssOpen(phoneStorage){
    return new Promise(resolve=>{
      try{
        if(!phoneStorage?.open)return resolve(null);
        const request=phoneStorage.open(CSS_DB,1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(CSS_STORE))request.result.createObjectStore(CSS_STORE);};
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);
      }catch(_error){resolve(null);}
    });
  }
  // One cursor pass per account and page load; later lookups are in memory.
  function cssLocalFor(uid,phoneStorage){
    if(cssLocal.has(uid))return cssLocal.get(uid);
    const loading=(async()=>{
      const map=new Map(),db=await cssOpen(phoneStorage);
      if(!db)return {db:null,map};
      await new Promise(resolve=>{
        try{
          const range=root.IDBKeyRange?.bound?root.IDBKeyRange.bound(uid+"/",uid+"/￿"):null;
          const request=db.transaction(CSS_STORE,"readonly").objectStore(CSS_STORE).openCursor(range);
          request.onsuccess=()=>{const cursor=request.result;if(!cursor)return resolve();if(typeof cursor.key==="string"&&cursor.key.startsWith(uid+"/"))map.set(cursor.key.slice(uid.length+1),cursor.value);cursor.continue();};
          request.onerror=()=>resolve();
        }catch(_error){resolve();}
      });
      return {db,map};
    })();
    cssLocal.set(uid,loading);
    return loading;
  }
  async function cssPutLocal(uid,rivalryId,record,phoneStorage){
    try{
      const local=await cssLocalFor(uid,phoneStorage);local.map.set(rivalryId,record);
      if(!local.db)return;
      await new Promise(resolve=>{try{const tx=local.db.transaction(CSS_STORE,"readwrite");tx.objectStore(CSS_STORE).put(record,uid+"/"+rivalryId);tx.oncomplete=resolve;tx.onerror=resolve;tx.onabort=resolve;}catch(_error){resolve();}});
    }catch(_error){}
  }

  // ---- Firebase summary ----
  function cssDocument(state,payload,payloadHash){
    const w=state.status==="completed"?state.terminalWitness:null;
    return {schemaVersion:CSS_READER_VERSION,objectType:"careerSummary",rivalryId:state.rivalryId,status:state.status,totalSeasons:w?w.totalSeasons:null,managerTotals:w?{playerOne:w.managerTotals.playerOne,playerTwo:w.managerTotals.playerTwo}:null,winner:w?w.winner:null,payload,payloadHash};
  }
  function cssValidDocument(value,rivalryId){
    return Boolean(value)&&typeof value==="object"&&Object.keys(value).length===CSS_KEYS.length&&CSS_KEYS.every(key=>Object.hasOwn(value,key))
      &&value.schemaVersion===CSS_READER_VERSION&&value.objectType==="careerSummary"&&value.rivalryId===rivalryId&&CSS_STATUSES.includes(value.status);
  }

  // Phone copy first, then the Firebase summary (one exact get). null = read the Showdown in full.
  async function cssLoad({firestore,firebaseSdk,uid,rivalryId,cryptoImpl,phoneStorage=root.indexedDB,firebase=true}={}){
    if(typeof uid!=="string"||!uid||!CSS_ID.test(String(rivalryId)))return null;
    try{
      const local=await cssLocalFor(uid,phoneStorage),kept=local.map.get(rivalryId);
      if(kept&&kept.readerVersion===CSS_READER_VERSION){const state=await cssParse(kept.payload,kept.payloadHash,rivalryId,cryptoImpl);if(state)return {state,source:"phone"};local.map.delete(rivalryId);}
    }catch(_error){}
    if(!firebase||!firestore||typeof firebaseSdk?.doc!=="function"||typeof firebaseSdk?.getDoc!=="function")return null;
    let snapshot;
    // A failed get (offline, cancelled, denied) is not a missing summary: the caller decides (it does not read in full).
    snapshot=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",uid,"careerSummary",rivalryId));
    const value=snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;
    if(!cssValidDocument(value,rivalryId))return null;
    const state=await cssParse(value.payload,value.payloadHash,rivalryId,cryptoImpl);
    if(!state||state.status!==value.status)return null;
    await cssPutLocal(uid,rivalryId,{readerVersion:CSS_READER_VERSION,payload:value.payload,payloadHash:value.payloadHash},phoneStorage);
    return {state,source:"firebase"};
  }
  // After a full verified read: keep the phone copy, then start the summary write once (create-only; a summary the other
  // tab or a retry already wrote is refused by the Rules and is not an error). The write is never awaited: offline, a
  // Firestore write stays pending until the server answers, and History must not wait for it (Codex P2 on #1026).
  // Never throws: the career still shows without it. `written` settles to true or false.
  const cssWrites=new Set();
  async function cssSave({firestore,firebaseSdk,uid,state,cryptoImpl,phoneStorage=root.indexedDB,writeFirebase=true}={}){
    try{
      if(typeof uid!=="string"||!uid||!CSS_ID.test(String(state?.rivalryId))||!cssSummarisable(state,state.rivalryId))return {ok:false,written:Promise.resolve(false)};
      const payload=JSON.stringify(state);
      if(payload.length>CSS_MAX_PAYLOAD)return {ok:false,written:Promise.resolve(false)};
      const payloadHash=await cssDigest(payload,cryptoImpl);if(!payloadHash)return {ok:false,written:Promise.resolve(false)};
      await cssPutLocal(uid,state.rivalryId,{readerVersion:CSS_READER_VERSION,payload,payloadHash},phoneStorage);
      let written=Promise.resolve(false);
      if(writeFirebase&&firestore&&typeof firebaseSdk?.setDoc==="function"&&typeof firebaseSdk?.doc==="function"){
        try{written=Promise.resolve(firebaseSdk.setDoc(firebaseSdk.doc(firestore,"accounts",uid,"careerSummary",state.rivalryId),cssDocument(state,payload,payloadHash))).then(()=>true,()=>false);}catch(_error){written=Promise.resolve(false);}
        cssWrites.add(written);written.then(()=>cssWrites.delete(written));
      }
      return {ok:true,written};
    }catch(_error){return {ok:false,written:Promise.resolve(false)};}
  }
  // Tests and the gallery: wait until every started summary write has settled.
  function cssSettled(){return Promise.all([...cssWrites]).then(()=>undefined);}
  function cssForget(){cssLocal.clear();}

  return Object.freeze({contractVersion:1,feature:"cms-career-summary-store",readerVersion:CSS_READER_VERSION,statuses:CSS_STATUSES,summarisable:cssSummarisable,documentKeys:CSS_KEYS,maxPayload:CSS_MAX_PAYLOAD,loadSummary:cssLoad,saveSummary:cssSave,writesSettled:cssSettled,forgetPhoneCopies:cssForget,documentFor:cssDocument});
});

```

## FILE: js/sparkClosedShowdownCareerLoader.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkClosedShowdownCareerLoader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-09 (G-9): thin loader. Walks the signed-in account's career index (pages, then head; JOB-07),
  // reads each Showdown with the session-free reader (JOB-08), and hands everything to the pure adapter
  // and the career model. Exact gets only, through those two modules; no session, no write, no list.
  // r86: js/careerSummaryStore.js may answer a Showdown first (phone copy, then its one Firebase summary) and, after a full
  // read, writes that summary once; this file itself still writes and stores nothing.
  // Terminal results (including closed unused codes) are cached in memory per signed-in account only.
  const cclNode=typeof module!=="undefined"&&module.exports;
  const cclModule=(file,key)=>cclNode?require(file):root[key];
  const cclModules={
    get pair(){return cclModule("./persistentNikDanielPair.js","CareerModePersistentNikDanielPair");},
    get reader(){return cclModule("./sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader");},
    get adapter(){return cclModule("./sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter");},
    get career(){return cclModule("./sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics");},
    get summary(){try{return cclModule("./careerSummaryStore.js","CareerModeCareerSummaryStore")||null;}catch(_error){return null;}}
  };
  const TERMINAL=Object.freeze(["completed","abandoned","hidden"]);
  const COLD_READ_LIMIT=3;
  let cclScope=null;
  function cclNewScope(uid){return {uid,cache:new Map(),pending:new Map(),queue:[],active:0};}
  function cclPump(scope){
    while(scope.active<COLD_READ_LIMIT&&scope.queue.length){
      const run=scope.queue.shift();scope.active++;
      void run().finally(()=>{scope.active--;cclPump(scope);});
    }
  }

  function cclFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cclFreeze(item,borrowed));Object.freeze(value);}return value;}
  // Also drops this page's in-memory view of the phone copy (the copy itself stays on the phone and is read again).
  function cclClear(){cclScope=null;try{cclModules.summary?.forgetPhoneCopies?.();}catch(_error){}}
  function cclResult(accountId,careerInput,entries){
    const model=cclModules.career.buildCareerModel(careerInput);
    return cclFreeze({status:model.status,accountId,careerInput,model,entries},new Set([careerInput,model,entries]));
  }
  function cclUnavailable(accountId,code){
    const careerInput=cclModules.adapter.buildClosedCareerInput({index:{status:"unavailable",code}});
    return cclResult(accountId,careerInput,Object.freeze([Object.freeze({rivalryId:null,source:"index",classification:"unavailable",code})]));
  }
  function cclRead(reader,options,scope,rivalryId,interested,beat){
    if(scope.cache.has(rivalryId))return Promise.resolve(scope.cache.get(rivalryId));
    let flight=scope.pending.get(rivalryId);
    // A new screen arriving while an abandoned batch drains retries after that batch settles.
    if(flight?.cancelled)return flight.promise.then(()=>interested()?cclRead(reader,options,scope,rivalryId,interested,beat):null);
    if(!flight){
      flight={consumers:new Set(),promise:null};
      flight.promise=new Promise(resolve=>scope.queue.push(async()=>{
        let read=null;
        const live=()=>cclScope===scope&&[...flight.consumers].some(check=>check());
        try{
          // Each exact get checks that at least one screen still needs this record. Already sent gets
          // cannot be cancelled; no later season or queued record is read after the last consumer leaves.
          const sdk={...options.firebaseSdk,getDoc:ref=>{
            if(!live()){flight.cancelled=true;throw Object.assign(new Error("CLOSED_LOAD_CANCELLED"),{code:"CLOSED_LOAD_CANCELLED"});}
            return options.firebaseSdk.getDoc(ref);
          }};
          if(!live())flight.cancelled=true;
          else{
            // r86: the phone copy or the Firebase summary first; a Showdown without one is read in full and then summarised.
            // A denied summary get falls back to the full read, so a Rules change never hides a game. Any other failed get
            // (offline, unavailable) is tried once more and otherwise leaves the game unavailable for this open: a blip must not
            // turn a 2-read summary into a full read (~145 billed for 10 seasons; red team r87 A-01).
            const store=cclModules.summary,storeOptions={firestore:options.firestore,firebaseSdk:sdk,uid:scope.uid,rivalryId,cryptoImpl:options.cryptoImpl,...(options.phoneStorage!==undefined?{phoneStorage:options.phoneStorage}:{})};
            // The Showdown the app is showing live is still being played: it gets no Firebase summary check, so a live game costs
            // no extra read. Once the app sees it completed or abandoned it is a finished game like any other (Sol r86 #01: a
            // device with no phone copy otherwise read the whole game again instead of its Firebase summary).
            const current=options.current,entry=Array.isArray(current?.showdowns)?current.showdowns.find(item=>item?.rivalryId===rivalryId):undefined;
            const live=entry?!["completed","abandoned"].includes(entry.classification):current?.currentRivalryId===rivalryId;
            let kept=null;
            if(store&&options.careerSummaries!==false){
              const denied=error=>/permission-denied/.test(String(error?.code||""));
              try{kept=await store.loadSummary({...storeOptions,firebase:!live});}
              catch(error){
                if(error?.code==="CLOSED_LOAD_CANCELLED")throw error;
                if(!denied(error)){try{kept=await store.loadSummary({...storeOptions,firebase:!live});}catch(again){if(again?.code==="CLOSED_LOAD_CANCELLED"||!denied(again))throw again;kept=null;}}
                else kept=null;
              }
            }
            if(kept)read=kept.state;
            else{
              read=await reader.readCompletedShowdown({firestore:options.firestore,firebaseSdk:sdk,user:{uid:scope.uid},rivalryId,cryptoImpl:options.cryptoImpl,...(typeof beat==="function"?{onSeasonRead:beat}:{})});
              if(store&&options.careerSummaries!==false&&store.summarisable(read,rivalryId))await store.saveSummary({...storeOptions,firebaseSdk:options.firebaseSdk,state:read});
            }
          }
          // r86 (red team #7): a failure stored in the game's own documents repeats on every read, so it is kept for this page
          // like a finished game instead of costing a full re-read (~154 billed for 10 seasons) on every career-screen open.
          if(read&&read.rivalryId===rivalryId&&(TERMINAL.includes(read.status)||read.status==="never-started"&&read.ended!=null||reader.permanentFailure?.(read)===true)&&cclScope===scope)scope.cache.set(rivalryId,read);
        }catch(_error){}finally{scope.pending.delete(rivalryId);resolve(read);}
      }));
      scope.pending.set(rivalryId,flight);
    }
    flight.consumers.add(interested);cclPump(scope);
    return flight.promise.finally(()=>flight.consumers.delete(interested));
  }
  async function cclLoad(options={},shouldContinue=options?.shouldContinue){
    let uid=null;
    try{
      const o=options&&typeof options==="object"?options:{};
      uid=o.user&&typeof o.user.uid==="string"?o.user.uid.trim():"";
      if(!uid){uid=null;return cclUnavailable(null,"CLOSED_AUTH_REQUIRED");}
      if(!o.firestore||!o.firebaseSdk||typeof o.firebaseSdk.doc!=="function"||typeof o.firebaseSdk.getDoc!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      const pair=cclModules.pair,reader=cclModules.reader;
      if(!pair||typeof pair.readCareerIndex!=="function"||!reader||typeof reader.readCompletedShowdown!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      // A different signed-in account never sees the previous account's cached Showdowns.
      if(!cclScope||cclScope.uid!==uid)cclScope=cclNewScope(uid);
      const scope=cclScope;
      const interested=()=>cclScope===scope&&(typeof shouldContinue!=="function"||shouldContinue());
      let index;
      // r80 (real vs test): an account whose real career has not started holds only test runs; its career is empty and
      // nothing is read (a live test Showdown outside the index is dropped by the adapter as well).
      if(o.testRunsOnly===true)index={status:"ready",rivalryIds:[]};
      else try{index=await pair.readCareerIndex({firestore:o.firestore,firebaseSdk:o.firebaseSdk,accountId:uid});}catch(_error){index={status:"unavailable",code:"CAREER_INDEX_UNAVAILABLE"};}
      // Career start marker: the caller may name Showdowns to leave out (the account's test Showdowns before its real
      // career). They are dropped from the index before any read, so they get no read and never reach the model.
      // Absent, empty or malformed: nothing changes.
      const hidden=Array.isArray(o.hiddenRivalryIds)?new Set(o.hiddenRivalryIds.filter(id=>typeof id==="string")):null;
      if(hidden&&hidden.size&&index&&index.status==="ready"&&Array.isArray(index.rivalryIds))index={...index,rivalryIds:index.rivalryIds.filter(id=>!hidden.has(id))};
      const reads={};
      if(index&&index.status==="ready"&&Array.isArray(index.rivalryIds)){
        const ids=[...new Set(index.rivalryIds.filter(id=>typeof id==="string"))];
        // r86 (Sol S61-r85-04): each finished Showdown reports progress, so a long cold career keeps its screen alive.
        // Red team #10: each season read inside a full read reports it too (same count): one 10-season game is ~12 round trips,
        // longer than the screen's 15 s inactivity limit on a ~1.1 s connection.
        let next=0,done=0;
        const progress=()=>{try{if(typeof o.onProgress==="function"&&interested())o.onProgress({done,total:ids.length});}catch(_error){}};
        progress();
        const worker=async()=>{
          while(next<ids.length&&interested()){
            const rivalryId=ids[next++];reads[rivalryId]=await cclRead(reader,o,scope,rivalryId,interested,typeof o.onProgress==="function"?progress:null);done++;progress();
          }
        };
        await Promise.all(Array.from({length:Math.min(COLD_READ_LIMIT,ids.length)},worker));
      }
      const input={index,reads,current:o.current};
      return cclResult(uid,cclModules.adapter.buildClosedCareerInput(input),cclModules.adapter.describeClosedCareer(input));
    }catch(_error){
      try{return cclUnavailable(uid,"CLOSED_LOADER_FAILED");}catch(_inner){return Object.freeze({status:"unavailable",accountId:uid,careerInput:null,model:null,entries:Object.freeze([])});}
    }
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-career-loader",loadClosedShowdownCareer:cclLoad,clearClosedShowdownCache:cclClear,closedShowdownCacheSize:()=>cclScope?.cache.size||0,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});

```

## FILE: js/sharedHistoryConvergence.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r12";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PROFILE_ID=/^profile_[0-9a-f]{24}$/;
  const SAVE_ID=/^save_[0-9a-f]{24}$/;
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const SCORE_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  // r80 Europa League: a result may carry the sparse 8th key europaLeague (exactly true, never with championsLeague true; checked per
  // manager only), and its score then carries europaLeague:3. A result without it is the unchanged r79 shape and scores as before.
  const EUROPA_LEAGUE="europaLeague";
  const LEAGUE_TEAM_COUNTS=Object.freeze({premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20});

  function hcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,won?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS,"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
  function hcResultKeys(value){return Object.hasOwn(value,EUROPA_LEAGUE)?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS;}
  function hcResult(value,teamCount){
    hcEuropaLeague(value);
    const maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
    // The 7 keys in their fixed order, then europaLeague only when present (the order every normalizer writes), so the tamper rebuild matches.
    return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
  }
  function hcExpectedScore(result){
    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0;
    const leagueTitle=result.leaguePosition===1?3:0;
    const domesticCup=result.domesticCup?1:0;
    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
    return {championsLeague,...(europaLeague?{europaLeague}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
  }
  function hcScore(value,result){
    if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE);
    const scoreKeys=hasEuropaLeague?[...SCORE_KEYS,EUROPA_LEAGUE]:SCORE_KEYS,allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
    if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const expected=hcExpectedScore(result);
    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
    for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    if(hasTriggers){
      hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
      const expectedTriggers={
        hundredLeaguePoints:result.leaguePoints>=100,
        hundredLeagueGoals:result.leagueGoals>=100,
        topScorer:result.topScorer,
        topAssist:result.topAssist
      };
      for(const key of TRIGGER_KEYS){if(value.triggers[key]!==expectedTriggers[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    }
    return Object.fromEntries(Object.keys(expected).map(key=>[key,value[key]]));
  }
  function hcSlots(value){
    if(!Array.isArray(value)||value.length!==2)hcFail("HISTORY_CONVERGENCE_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>value.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||!PROFILE_ID.test(String(slot.profileId||""))||!SAVE_ID.test(String(slot.saveId||""))||typeof slot.accountId!=="string"||!slot.accountId.trim()||slot.entitlementState!=="active"))hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    return ordered.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId}));
  }
  function hcSetup(value,rivalryId){
    if(!hcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!hcPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)hcFail("HISTORY_CONVERGENCE_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return value;
  }
  function hcCommit(value,rivalryId,seasonNumber,teamCount){
    if(!hcPlain(value)||value.ok!==true||value.committed!==true||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2||value.seasonNumber!==seasonNumber||!HASH.test(String(value.resultsContentHash||""))||!hcPlain(value.results))hcFail("HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return {results:{playerOne:hcResult(value.results.playerOne,teamCount),playerTwo:hcResult(value.results.playerTwo,teamCount)},resultsRevision:value.resultsRevision,resultsContentHash:value.resultsContentHash};
  }
  function hcScoring(value,rivalryId,seasonNumber,commit){
    if(!hcPlain(value)||value.ok!==true||value.authoritative!==true||value.phase!=="SCORING_RECONCILED"||value.revision!==1||value.seasonCommitRevision!==3||value.resultsRevision!==commit.resultsRevision||value.resultsContentHash!==commit.resultsContentHash||value.seasonNumber!==seasonNumber||!hcPlain(value.scoring)||!ROLES.includes(value.winner)&&value.winner!=="draw")hcFail("HISTORY_CONVERGENCE_SCORING_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    const scoring={playerOne:hcScore(value.scoring.playerOne,commit.results.playerOne),playerTwo:hcScore(value.scoring.playerTwo,commit.results.playerTwo)};
    const a=scoring.playerOne.total,b=scoring.playerTwo.total;
    // r83: no tiebreak. Equal Showdown points is a draw.
    const expected=a>b?"playerOne":b>a?"playerTwo":"draw";
    if(value.winner!==expected)hcFail("HISTORY_CONVERGENCE_WINNER_MISMATCH");
    return {scoring,winner:value.winner};
  }
  function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,europaLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
  function hcAccumulate(record,season,role){
    const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===11)record.perfectSeasons+=1;
    record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
  }
  function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
  function hcBuild({rivalryId,setup,managerSlots,seasons}={}){
    const id=hcRivalry(rivalryId),finalSetup=hcSetup(setup,id),teamCount=hcTeamCount(finalSetup.leagueId),slots=hcSlots(managerSlots);
    if(!Array.isArray(seasons)||seasons.length<1||seasons.length>finalSetup.totalSeasons)hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const history=[];
    for(let index=0;index<seasons.length;index+=1){
      const seasonNumber=index+1,source=seasons[index];if(!hcPlain(source))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
      const commit=hcCommit(source.commit,id,seasonNumber,teamCount),canonical=hcScoring(source.scoring,id,seasonNumber,commit);
      history.push({roundNumber:seasonNumber,acceptedResultRevision:commit.resultsRevision,acceptedResultContentHash:commit.resultsContentHash,seasonCommitRevision:3,canonicalScoringRevision:1,playerOne:{...commit.results.playerOne,scoring:canonical.scoring.playerOne},playerTwo:{...commit.results.playerTwo,scoring:canonical.scoring.playerTwo},winner:canonical.winner});
    }
    const managerRecords={playerOne:hcManagerBase(slots[0],finalSetup.clubs.playerOne),playerTwo:hcManagerBase(slots[1],finalSetup.clubs.playerTwo)};
    for(const season of history){for(const role of ROLES)hcAccumulate(managerRecords[role],season,role);}
    for(const role of ROLES)hcFinalize(managerRecords[role]);
    const trophyAttribution={playerOne:{profileId:managerRecords.playerOne.profileId,leagueTitles:managerRecords.playerOne.leagueTitles,domesticCups:managerRecords.playerOne.domesticCups,championsLeagues:managerRecords.playerOne.championsLeagues,europaLeagues:managerRecords.playerOne.europaLeagues,totalTrophies:managerRecords.playerOne.totalTrophies},playerTwo:{profileId:managerRecords.playerTwo.profileId,leagueTitles:managerRecords.playerTwo.leagueTitles,domesticCups:managerRecords.playerTwo.domesticCups,championsLeagues:managerRecords.playerTwo.championsLeagues,europaLeagues:managerRecords.playerTwo.europaLeagues,totalTrophies:managerRecords.playerTwo.totalTrophies}};
    const acceptedRevisionKey=history.map(item=>`${item.roundNumber}:${item.acceptedResultRevision}:${item.acceptedResultContentHash}`).join("|");
    return hcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId:id,setupRevision:6,leagueId:finalSetup.leagueId,totalSeasons:finalSetup.totalSeasons,acceptedSeasons:history.length,acceptedRevisionKey,managerSlots:slots,seasonHistory:history,managerRecords,trophyAttribution,canonicalStorageMutation:false,providerWriteRequired:false});
  }
  function hcVerify(projection){
    if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
    const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(hcResultKeys(season.playerOne).map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(hcResultKeys(season.playerTwo).map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
    if(JSON.stringify(rebuilt)!==JSON.stringify(projection))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");return projection;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
});
```

## FILE: js/careerScreenSeam.js
```js
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreenSeam=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SCREENS=["careerStatistics","trophyRoom","legacy","rivalryStatistics"];
  const STATUSES=["loading","empty","unavailable","partial","ready"];
  const TEXT={
    loading:"Loading career history.",
    unavailable:"Career history is unavailable right now. Nothing is lost. Try again when you are reconnected.",
    partial:"Showing {readable} of {indexed} Showdowns. Some Showdowns could not be read, so these are not complete career totals.",
    empty:{
      careerStatistics:"Career Statistics appear after your first completed Showdown. Stats for the current Showdown are on Showdown Home.",
      trophyRoom:"The Trophy Room is empty. Finish a Showdown and its trophies and records appear here.",
      legacy:"No completed Showdowns yet. Finish one and it appears here.",
      rivalryStatistics:"No season completed yet. Stats appear as seasons finish."
    },
    historyStatus:{completed:"Completed","in-progress":"In progress","completion-pending":"Final result, completion pending",abandoned:"Ended early",unavailable:"Unavailable"},
    winner:{daniel:"Daniel won",nik:"Nik won",draw:"Draw"}
  };
  const csNames={daniel:"Daniel",nik:"Nik",shared:"Shared"};
  const csCareerFields=[["Career points","careerPoints"],["Seasons played","seasons"],["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"]];
  const csShowdownFields=[["Showdowns completed","completed"],["Showdown wins","wins"],["Showdown draws","draws"],["Showdown losses","losses"]];
  const csRecordFields=[["Best season score","bestSeasonScore"],["Best league points","bestLeaguePoints"],["Best league goals","bestLeagueGoals"],["Best league position","bestLeaguePosition"],["Average season score","averageSeasonScore"],["Average league points","averageLeaguePoints"],["Average league goals","averageLeagueGoals"],["Perfect seasons","perfectSeasons"],["100-point seasons","hundredPointSeasons"],["100-goal seasons","hundredGoalSeasons"],["Top scorer seasons","topScorerSeasons"],["Top assist seasons","topAssistSeasons"],["Performance bonuses","performanceBonuses"],["Awards bonuses","awardsBonuses"]];
  const csCabinetFields=[["Champions Leagues","championsLeagues"],["Europa Leagues","europaLeagues"],["League titles","leagueTitles"],["Domestic cups","domesticCups"],["Total trophies","totalTrophies"]];
  const csRivalryFields=[["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"],...csCabinetFields,["Perfect seasons","perfectSeasons"],["Best season score","bestSeasonScore"]];

  function csFreeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.values(value).forEach(csFreeze);Object.freeze(value);
    }
    return value;
  }
  function normalizeRenderRequest(arg){
    if(arg===undefined||arg===null||arg===false)return Object.freeze({force:false,hasModel:false,model:null});
    if(arg===true)return Object.freeze({force:true,hasModel:false,model:null});
    if(typeof arg!=="object"||Array.isArray(arg))throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    const proto=Object.getPrototypeOf(arg);
    if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    return Object.freeze({force:arg.force===true,hasModel:Object.prototype.hasOwnProperty.call(arg,"model"),model:arg.model??null});
  }
  function isOnlineCareerRoute(identityState){
    return Boolean(identityState&&identityState.registered===true&&["daniel","nik"].includes(identityState.managerId));
  }
  // The game is online only, so every career screen is Team V's (r61): with no model it shows the unavailable state,
  // signed in or not. The old local page runs only when Legacy's data tools (backup, restore, reset) are asked for.
  function selectCareerScreenSource({identityState,model,dataTools=false}){
    if(model!==undefined&&model!==null)return model&&STATUSES.includes(model.status)?"model":"unavailable";
    return dataTools===true?"local":"unavailable";
  }
  // r80 Ended early row: "Ended early · 18 Oct 2026 · 1 season"; an unknown date or count (closes before the mark) is a dash.
  function endedEarlyText(row){
    const at=row&&Number.isFinite(row.endedAt)&&row.endedAt>0?new Date(row.endedAt):null,played=row&&Number.isInteger(row.seasonsPlayed)?row.seasonsPlayed:null;
    let date="-";if(at){try{date=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(at);}catch(_error){date="-";}}
    return TEXT.historyStatus.abandoned+" · "+date+" · "+(played===null?"- seasons":played+(played===1?" season":" seasons"));
  }
  // r84 Golden Showdown (Nik): a manager who scores 110 Showdown points (11, the most a season can score, in every season)
  // in a finished 10-season Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An
  // ended-early, unfinished or shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110});
  function goldenShowdownManagers(row){
    if(!row||row.status!=="completed"||row.totalSeasons!==GOLDEN_SHOWDOWN.seasons||row.seasonsPlayed!==GOLDEN_SHOWDOWN.seasons||!row.totals)return [];
    return ["daniel","nik"].filter(manager=>Number.isInteger(row.totals[manager])&&row.totals[manager]>=GOLDEN_SHOWDOWN.points);
  }
  function goldenShowdownCounts(rows){
    const counts={daniel:0,nik:0};
    for(const row of Array.isArray(rows)?rows:[])for(const manager of goldenShowdownManagers(row))counts[manager]+=1;
    return counts;
  }
  function csNumber(value){return value===null?"-":Number.isInteger(value)?String(value):value.toFixed(1);}
  function csNumeric(value){return value===null||typeof value==="number"&&Number.isFinite(value);}
  function csFieldsValid(fields,record){return Boolean(record&&fields.every(([,key])=>csNumeric(record[key])));}
  function csModelValid(model){
    if(!model||typeof model!=="object"||!STATUSES.includes(model.status))return false;
    if(model.status!=="ready"&&model.status!=="partial")return true;
    const managers=model.managers,room=model.trophyRoom,history=model.history;
    if(!managers||!room||!history||!Array.isArray(history.showdowns))return false;
    for(const manager of ["daniel","nik"]){
      const record=managers[manager];
      if(!csFieldsValid([...csCareerFields,...csRecordFields,...csCabinetFields],record)||!csFieldsValid(csShowdownFields,record.showdowns)||!csFieldsValid(csCabinetFields,room.cabinet?.[manager]))return false;
    }
    if(!Array.isArray(room.standings)||!Array.isArray(room.records))return false;
    if(!room.standings.every(row=>row&&["daniel","nik"].includes(row.manager)&&csNumeric(row.careerPoints)&&csNumeric(row.seasonWins)))return false;
    if(!room.records.every(row=>row&&typeof row.label==="string"&&["daniel","nik","shared"].includes(row.manager)&&csNumeric(row.value)))return false;
    if(!history.showdowns.every(row=>row&&Number.isInteger(row.number)&&Object.prototype.hasOwnProperty.call(TEXT.historyStatus,row.status)&&Array.isArray(row.seasons)&&(row.status==="abandoned"||row.status==="unavailable"||((!row.totals||csNumeric(row.totals.daniel)&&csNumeric(row.totals.nik))&&row.seasons.every(season=>season&&Number.isInteger(season.season)&&season.score&&csNumeric(season.score.daniel)&&csNumeric(season.score.nik))))))return false;
    return model.status!=="partial"||Boolean(model.coverage&&Number.isInteger(model.coverage.readable)&&Number.isInteger(model.coverage.indexed));
  }
  function csCompare(fields,records){
    return fields.map(([label,key])=>({label,daniel:csNumber(records.daniel[key]),nik:csNumber(records.nik[key])}));
  }
  function csCareerSections(model){
    const win=model.biggestShowdownWin;
    const value=win&&csNames[win.manager]&&csNumeric(win.margin)?csNames[win.manager]+(win.manager==="shared"?" · ":" by ")+csNumber(win.margin):"-";
    return [
      {heading:"CAREER TABLE",rows:[...csCompare(csCareerFields,model.managers),...csCompare(csShowdownFields,{daniel:model.managers.daniel.showdowns,nik:model.managers.nik.showdowns}),{label:"Biggest Showdown win",value}]},
      {heading:"SEASON RECORDS",rows:csCompare(csRecordFields,model.managers)}
    ];
  }
  function csTrophySections(model){
    const room=model.trophyRoom;
    return [
      {heading:"MANAGER CABINETS",rows:csCompare(csCabinetFields,room.cabinet)},
      {heading:"CAREER TABLE",rows:room.standings.map((row,index)=>({label:(row.level?1:index+1)+". "+csNames[row.manager]+(row.level?" (level)":""),value:csNumber(row.careerPoints)+" points, "+csNumber(row.seasonWins)+" season wins"}))},
      {heading:"ALL-TIME RECORDS",rows:room.records.map(row=>({label:row.label,value:row.value===null?"-":csNames[row.manager]+" · "+csNumber(row.value)}))}
    ];
  }
  function csLegacySections(model){
    return [{heading:"SHOWDOWNS",rows:model.history.showdowns.map(row=>{
      let value=row.status==="abandoned"?endedEarlyText(row):TEXT.historyStatus[row.status];
      if(row.status!=="abandoned"&&row.status!=="unavailable"){
        if(row.totals)value+=" · Daniel "+csNumber(row.totals.daniel)+" - Nik "+csNumber(row.totals.nik);
        if(Object.prototype.hasOwnProperty.call(TEXT.winner,row.winner))value+=" · "+TEXT.winner[row.winner];
      }
      return {label:"SHOWDOWN "+row.number,value};
    })}];
  }
  function csRivalrySections(model){
    const row=model.history.showdowns[0],totals=row.totals||{daniel:null,nik:null};
    return [
      {heading:"HEAD TO HEAD",rows:[{label:"Showdown points",daniel:csNumber(totals.daniel),nik:csNumber(totals.nik)},...csCompare(csRivalryFields,model.managers)]},
      {heading:"SEASONS",rows:row.seasons.map(season=>({label:"Season "+season.season,daniel:csNumber(season.score.daniel),nik:csNumber(season.score.nik)}))}
    ];
  }
  function careerScreenView(screen,model){
    if(!SCREENS.includes(screen))throw new TypeError("CAREER_SCREEN_UNKNOWN");
    let status=csModelValid(model)?model.status:"unavailable";
    if(screen==="rivalryStatistics"&&["ready","partial"].includes(status)&&model.history.showdowns.length!==1)status="unavailable";
    const interimLabel=status!=="unavailable"&&typeof model.interimLabel==="string"?model.interimLabel:null;
    let message=null,sections=[];
    if(status==="loading")message=TEXT.loading;
    else if(status==="unavailable")message=TEXT.unavailable;
    else if(status==="empty")message=TEXT.empty[screen];
    else{
      if(status==="partial")message=TEXT.partial.replace("{readable}",String(model.coverage.readable)).replace("{indexed}",String(model.coverage.indexed));
      sections=screen==="careerStatistics"?csCareerSections(model):screen==="trophyRoom"?csTrophySections(model):screen==="legacy"?csLegacySections(model):csRivalrySections(model);
    }
    return csFreeze({screen,status,message,interimLabel,sections});
  }
  function csElement(doc,tag,className,text){
    const node=doc.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function paintCareerScreenView(doc,view){
    const fragment=doc.createDocumentFragment(),root=csElement(doc,"div","careerScreenView");
    root.setAttribute("data-career-screen",view.screen);root.setAttribute("data-career-status",view.status);
    if(view.interimLabel)root.appendChild(csElement(doc,"p","careerScreenInterim",view.interimLabel));
    if(view.message){
      const message=csElement(doc,"div","analyticsEmpty",view.message);message.setAttribute("role","status");root.appendChild(message);
    }
    for(const section of view.sections){
      root.appendChild(csElement(doc,"h3","analyticsSectionHeading",section.heading));
      const holder=csElement(doc,"div","careerScreenSection");
      if(section.rows.some(row=>Object.prototype.hasOwnProperty.call(row,"daniel"))){
        const names=csElement(doc,"div","comparisonRow careerScreenNames");
        names.append(csElement(doc,"strong","","DANIEL"),csElement(doc,"span","",""),csElement(doc,"strong","","NIK"));holder.appendChild(names);
      }
      for(const row of section.rows){
        if(Object.prototype.hasOwnProperty.call(row,"daniel")){
          const comparison=csElement(doc,"div","comparisonRow");
          comparison.append(csElement(doc,"strong","",row.daniel),csElement(doc,"span","",row.label),csElement(doc,"strong","",row.nik));holder.appendChild(comparison);
        }else{
          const single=csElement(doc,"div","careerScreenRow");
          single.append(csElement(doc,"span","",row.label),csElement(doc,"strong","",row.value));holder.appendChild(single);
        }
      }
      root.appendChild(holder);
    }
    fragment.appendChild(root);return fragment;
  }
  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,GOLDEN_SHOWDOWN,endedEarlyText,goldenShowdownManagers,goldenShowdownCounts,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
});

```

## FILE: js/analytics.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   Lightweight Read-Only Statistics and Records Engine
===================================================== */

let careerAnalyticsCacheKey = null;
let careerAnalyticsCacheValue = null;

const ANALYTICS_PROFILE_ID_PATTERN = /^profile_[a-f0-9]{24}$/;
const ANALYTICS_MANAGER_ROLES = Object.freeze(["playerOne", "playerTwo"]);

function analyticsNormalizeName(value){
    return String(value || "Unknown Manager")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function analyticsGetManagerProfileId(showdown, playerKey){
    const profileId = showdown
        && showdown.identity
        && showdown.identity.managerProfileIds
        && showdown.identity.managerProfileIds[playerKey];
    return typeof profileId === "string" && ANALYTICS_PROFILE_ID_PATTERN.test(profileId)
        ? profileId
        : null;
}

function analyticsGetActiveIdentitySignature(showdown){
    if(!showdown || showdown.status !== "Completed"){
        return "none";
    }
    const playerOne = analyticsGetManagerProfileId(showdown, "playerOne") || "unresolved";
    const playerTwo = analyticsGetManagerProfileId(showdown, "playerTwo") || "unresolved";
    return `${showdown.id}:${showdown.updatedAt || showdown.completedAt || ""}:${playerOne}:${playerTwo}`;
}

function analyticsCreateProfilePresentationState(profiles){
    const names = new Map();
    (Array.isArray(profiles) ? profiles : []).forEach(profile => {
        if(!profile || typeof profile.profileId !== "string" || !ANALYTICS_PROFILE_ID_PATTERN.test(profile.profileId)){
            return;
        }
        const displayName = String(profile.displayName || "Unknown Manager").trim() || "Unknown Manager";
        names.set(profile.profileId, displayName);
    });
    const signature = Array.from(names.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([profileId, displayName]) => `${profileId}:${displayName}`)
        .join("|");
    return { names, signature: signature || "none" };
}

function analyticsGetRawProfilePresentationState(){
    if(typeof window === "undefined" || typeof window.captureCareerModeRawSaveLibraryMigrationSnapshot !== "function"){
        return null;
    }
    try{
        const snapshot = window.captureCareerModeRawSaveLibraryMigrationSnapshot();
        const raw = snapshot && snapshot.ok === true ? snapshot.raw : null;
        if(!raw || raw.saveLibrary === null || raw.activeShowdown !== null){
            return null;
        }
        const library = JSON.parse(raw.saveLibrary);
        if(!library || typeof library !== "object" || !Array.isArray(library.profiles)){
            return null;
        }
        return analyticsCreateProfilePresentationState(library.profiles);
    }catch(error){
        return null;
    }
}

function analyticsGetProfilePresentationState(){
    const runtime = typeof window !== "undefined" ? window.CareerModeSaveLibraryRuntime : null;
    if(runtime && typeof runtime.isReady === "function" && runtime.isReady() && typeof runtime.getIdentityMappingSnapshot === "function"){
        const snapshot = runtime.getIdentityMappingSnapshot();
        if(snapshot && snapshot.ok === true && snapshot.library && Array.isArray(snapshot.library.profiles)){
            return analyticsCreateProfilePresentationState(snapshot.library.profiles);
        }
    }

    return analyticsGetRawProfilePresentationState() || { names: new Map(), signature: "unavailable" };
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

function getCareerAnalyticsCacheKey(profilePresentationState = null){
    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : 0;
    const active = currentShowdown || loadSavedShowdown();
    const presentation = profilePresentationState || analyticsGetProfilePresentationState();
    return `${revision}|${analyticsGetActiveIdentitySignature(active)}|${presentation.signature}`;
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

function createManagerCareerStats(name, key = analyticsNormalizeName(name), profileId = null){
    return {
        key,
        profileId,
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
        europaLeagues: 0,
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

function getOrCreateManagerStats(map, profileId, name){
    if(!map.has(profileId)){
        map.set(profileId, createManagerCareerStats(name, profileId, profileId));
    }
    return map.get(profileId);
}

function createUnresolvedManagerRole(showdown, playerKey){
    return {
        showdownId: String(showdown && showdown.id || ""),
        saveId: showdown && showdown.identity && typeof showdown.identity.saveId === "string"
            ? showdown.identity.saveId
            : null,
        role: playerKey,
        name: String(showdown && showdown.managers && showdown.managers[playerKey] || "Unknown Manager").trim() || "Unknown Manager"
    };
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
    if(player.europaLeague === true && !player.championsLeague){ stats.europaLeagues += 1; }
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
    stats.totalTrophies = stats.leagueTitles + stats.domesticCups + stats.championsLeagues + stats.europaLeagues;
    stats.averageSeasonScore = stats.seasons ? stats.totalPoints / stats.seasons : 0;
    stats.averageLeaguePoints = stats.seasons ? stats.totalLeaguePoints / stats.seasons : 0;
    stats.averageLeagueGoals = stats.seasons ? stats.totalLeagueGoals / stats.seasons : 0;
    stats.showdownWinRate = stats.showdowns ? (stats.showdownWins / stats.showdowns) * 100 : 0;
    stats.clubs = Array.from(stats.clubs).sort();
    stats.leagues = Array.from(stats.leagues).sort();
    return stats;
}

function calculateCareerAnalytics(history, profileNames = new Map()){
    const managerMap = new Map();
    const unresolvedRoles = [];
    const unresolvedShowdowns = new Set();
    let totalSeasons = 0;
    let totalPoints = 0;
    let totalTrophies = 0;

    history.forEach(showdown => {
        if(!showdown || !showdown.managers){
            return;
        }

        const winner = getShowdownWinnerKey(showdown);
        const rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];

        ANALYTICS_MANAGER_ROLES.forEach(playerKey => {
            const profileId = analyticsGetManagerProfileId(showdown, playerKey);
            if(!profileId){
                unresolvedRoles.push(createUnresolvedManagerRole(showdown, playerKey));
                unresolvedShowdowns.add(String(showdown.id));
                return;
            }

            const managerName = showdown.managers[playerKey];
            const displayName = profileNames.get(profileId) || managerName || "Unknown Manager";
            const stats = getOrCreateManagerStats(managerMap, profileId, displayName);
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
                if(player.europaLeague === true && !player.championsLeague){ totalTrophies += 1; }
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
        identity: {
            unresolvedRoleCount: unresolvedRoles.length,
            unresolvedShowdownCount: unresolvedShowdowns.size,
            unresolvedRoles
        },
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
    const profilePresentation = analyticsGetProfilePresentationState();
    const profileNames = profilePresentation.names;
    if(history){
        return calculateCareerAnalytics(history, profileNames);
    }

    const cacheKey = getCareerAnalyticsCacheKey(profilePresentation);
    if(careerAnalyticsCacheValue && careerAnalyticsCacheKey === cacheKey){
        return careerAnalyticsCacheValue;
    }

    careerAnalyticsCacheValue = calculateCareerAnalytics(getCompletedShowdownsForAnalytics(), profileNames);
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
            ANALYTICS_MANAGER_ROLES.forEach(playerKey => {
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
window.getCareerAnalyticsRevisionKey = getCareerAnalyticsCacheKey;
```

## FILE: js/statistics.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Career + Current Rivalry Statistics Presentation
===================================================== */

let rivalryStatisticsRenderKey = null;
let careerStatisticsRenderKey = null;
let careerStatisticsModel = null;
let rivalryStatisticsModel = null;

function readCareerScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

// JOB-13: online (or model-fed) Career Statistics and Trophy Room open Team V's screens, loaded on demand.
function openCareerScreensV10(screen){
    if(typeof window.loadRuntimeScript !== "function"){ return; }
    const screens = window.CareerModeV10Screens;
    const fail = error => { screens?.settle?.(screen); if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } };
    const seam = window.CareerModeCareerScreenSeam;
    if(!seam){
        // First open: the seam is still loading, so the route is decided when it arrives (the old screen stays hidden meanwhile).
        screens?.expect?.(screen);
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(() => { if(typeof window.getActiveScreenName === "function" && window.getActiveScreenName() === screen){ openCareerScreensV10(screen); }else{ screens?.settle?.(screen); } })
            .catch(fail);
        return;
    }
    const getModel = () => screen === "trophyRoom" ? (typeof trophyRoomModel === "undefined" ? null : trophyRoomModel) : careerStatisticsModel;
    if(seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: getModel() }) === "local"){ screens?.settle?.(screen); return; }
    screens?.expect?.(screen);
    window.loadRuntimeScript("career-screens-v10", "js/careerScreensV10.js", () => Boolean(window.CareerModeCareerScreensV10))
        .then(() => window.CareerModeCareerScreensV10.mount(screen, getModel))
        .catch(fail);
}

// JOB-28: the same live model seam, now drawn through the shared lazy loader.
function openRivalryLegacyV10(screen, getModel){
    if(typeof window.loadRuntimeScript !== "function"){ return; }
    const host = screen === "legacy" ? "legacy" : "statistics";
    window.CareerModeV10Screens?.expect?.(host);
    window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
        .then(() => window.CareerModeRivalryLegacyV10.mount(screen, getModel))
        .catch(error => { window.CareerModeV10Screens?.settle?.(host); window.reportApplicationError?.("History and stats screens could not load", error); });
}
window.openRivalryLegacyV10 = openRivalryLegacyV10;

function readCareerIdentityState(){
    const identity = window.CareerModeOnlinePlayerIdentity;
    return identity && typeof identity.getState === "function" ? identity.getState() : null;
}


function createStatisticsScreen(){
    if(document.getElementById("statistics")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "statistics";
    section.className = "screen hidden analyticsScreen";
    const heading = document.createElement("h2");
    heading.textContent = "RIVALRY STATISTICS";
    const content = document.createElement("div");
    content.id = "rivalryStatisticsContent";
    content.className = "analyticsContent";
    const actions = document.createElement("div");
    actions.className = "analyticsActions";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK TO SHOWDOWN HOME";
    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function createCareerStatisticsScreen(){
    if(document.getElementById("careerStatistics")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "careerStatistics";
    section.className = "screen hidden analyticsScreen";

    const heading = document.createElement("h2");
    heading.textContent = "CAREER STATISTICS";

    const content = document.createElement("div");
    content.id = "careerStatisticsContent";
    content.className = "analyticsContent";

    const actions = document.createElement("div");
    actions.className = "dashboardActions";

    const rivalryButton = document.createElement("button");
    rivalryButton.type = "button";
    rivalryButton.id = "careerStatisticsRivalryButton";
    rivalryButton.className = "menuButton";
    rivalryButton.textContent = "CURRENT RIVALRY STATISTICS";
    rivalryButton.addEventListener("click", () => {
        if(currentShowdown){ openRivalryStatistics(); }
    });

    const trophyButton = document.createElement("button");
    trophyButton.type = "button";
    trophyButton.id = "careerStatisticsTrophyButton";
    trophyButton.className = "menuButton";
    trophyButton.textContent = "OPEN TROPHY ROOM";
    trophyButton.addEventListener("click", () => {
        if(typeof window.openOptionalModule === "function"){
            window.openOptionalModule("trophyRoom");
        }
    });

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK TO HOME";

    actions.append(rivalryButton, trophyButton, back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function getRivalryStatisticsRenderKey(){
    if(!currentShowdown){ return "none"; }
    return [
        currentShowdown.id,
        currentShowdown.updatedAt || "",
        currentShowdown.status || "",
        Array.isArray(currentShowdown.rounds) ? currentShowdown.rounds.length : 0
    ].join("|");
}

function getCareerStatisticsRenderKey(){
    if(typeof window.getCareerAnalyticsRevisionKey === "function"){
        return window.getCareerAnalyticsRevisionKey();
    }
    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : 0;
    const active = currentShowdown;
    const activeKey = active && active.status === "Completed"
        ? `${active.id}:${active.updatedAt || active.completedAt || ""}`
        : "none";
    return `${revision}|${activeKey}`;
}

function createAnalyticsStat(label, value, subtext = ""){
    const card = document.createElement("div");
    card.className = "analyticsStatCard";
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    card.append(labelElement, valueElement);
    if(subtext){
        const note = document.createElement("small");
        note.textContent = subtext;
        card.appendChild(note);
    }
    return card;
}

function formatAnalyticsNumber(value, digits = 1){
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : number.toFixed(digits);
}

function formatAnalyticsPercent(value){
    const number = Number(value) || 0;
    return `${formatAnalyticsNumber(number, 1)}%`;
}

function createRivalryManagerHero(stats, clubName, showdownScore){
    const card = document.createElement("div");
    card.className = "rivalryManagerHero";
    const name = document.createElement("h3");
    name.textContent = stats.name;
    const club = document.createElement("p");
    club.className = "analyticsClubName";
    club.textContent = clubName || "Club";
    const score = document.createElement("strong");
    score.className = "rivalryHeroScore";
    score.textContent = showdownScore;
    const scoreLabel = document.createElement("span");
    scoreLabel.textContent = "SHOWDOWN POINTS";
    card.append(name, club, score, scoreLabel);
    return card;
}

function createComparisonRow(label, playerOneValue, playerTwoValue, higherIsBetter = true){
    const row = document.createElement("div");
    row.className = "comparisonRow";
    const one = document.createElement("strong");
    one.textContent = playerOneValue;
    const title = document.createElement("span");
    title.textContent = label;
    const two = document.createElement("strong");
    two.textContent = playerTwoValue;

    const oneNumber = Number(String(playerOneValue).replace("%", ""));
    const twoNumber = Number(String(playerTwoValue).replace("%", ""));
    if(Number.isFinite(oneNumber) && Number.isFinite(twoNumber) && oneNumber !== twoNumber){
        const oneLeads = higherIsBetter ? oneNumber > twoNumber : oneNumber < twoNumber;
        (oneLeads ? one : two).classList.add("comparisonLeader");
    }
    row.append(one, title, two);
    return row;
}

function createCareerStandingsTable(managers){
    const wrapper = document.createElement("div");
    wrapper.className = "careerStandings";
    const fragment = document.createDocumentFragment();
    const header = document.createElement("div");
    header.className = "careerStandingsRow header";
    ["#", "Manager", "Showdowns", "Season W-D-L", "Points", "Trophies"].forEach(text => {
        const cell = document.createElement("span");
        cell.textContent = text;
        header.appendChild(cell);
    });
    fragment.appendChild(header);

    managers.forEach((manager, index) => {
        const row = document.createElement("div");
        row.className = "careerStandingsRow";
        if(manager.profileId){ row.dataset.profileId = manager.profileId; }
        [
            index + 1,
            manager.name,
            `${manager.showdownWins}-${manager.showdownDraws}-${manager.showdownLosses}`,
            `${manager.seasonWins}-${manager.seasonDraws}-${manager.seasonLosses}`,
            manager.totalPoints,
            manager.totalTrophies
        ].forEach((value, cellIndex) => {
            const cell = document.createElement(cellIndex === 1 ? "strong" : "span");
            cell.textContent = value;
            row.appendChild(cell);
        });
        fragment.appendChild(row);
    });

    wrapper.appendChild(fragment);
    return wrapper;
}

function getManagerFieldLeader(managers, field){
    if(!managers.length){ return { value: null, holders: [] }; }
    const bestValue = Math.max(...managers.map(manager => Number(manager[field]) || 0));
    return {
        value: bestValue,
        holders: managers.filter(manager => (Number(manager[field]) || 0) === bestValue)
    };
}

function createCareerLeaderCard(label, record, suffix = ""){
    const card = document.createElement("div");
    card.className = "recordCard";
    const heading = document.createElement("span");
    heading.textContent = label;
    const value = document.createElement("strong");
    const detail = document.createElement("small");

    if(!record || record.value === null || !Array.isArray(record.holders) || !record.holders.length){
        value.textContent = "—";
        detail.textContent = "No completed record yet";
    }else{
        value.textContent = `${formatAnalyticsNumber(record.value)}${suffix}`;
        detail.textContent = record.holders
            .map(holder => holder.name || holder.manager || "Unknown Manager")
            .join(" · ");
    }

    card.append(heading, value, detail);
    return card;
}

function renderCareerLeaders(container, analytics){
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "CAREER LEADERS";

    const grid = document.createElement("div");
    grid.className = "recordsGrid";
    grid.append(
        createCareerLeaderCard("MOST SHOWDOWN WINS", analytics.records.showdownWins),
        createCareerLeaderCard("MOST CAREER POINTS", analytics.records.totalPoints),
        createCareerLeaderCard("MOST TROPHIES", analytics.records.trophies),
        createCareerLeaderCard("MOST SEASON WINS", getManagerFieldLeader(analytics.managers, "seasonWins")),
        createCareerLeaderCard("BEST AVG SEASON SCORE", getManagerFieldLeader(analytics.managers, "averageSeasonScore"), " pts"),
        createCareerLeaderCard("BEST SEASON SCORE", analytics.records.highestSeasonScore, " pts")
    );
    container.append(heading, grid);
}

function renderCareerManagerComparison(container, analytics){
    if(analytics.managers.length !== 2){ return; }

    const one = analytics.managers[0];
    const two = analytics.managers[1];
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "MANAGER COMPARISON";

    const hero = document.createElement("div");
    hero.className = "rivalryStatisticsHero";
    const overview = document.createElement("div");
    overview.className = "rivalryStatisticsOverview";
    const title = document.createElement("strong");
    title.textContent = `${one.name} vs ${two.name}`;
    const meta = document.createElement("span");
    meta.textContent = `${analytics.totals.showdowns} completed showdown${analytics.totals.showdowns === 1 ? "" : "s"}`;
    overview.append(title, meta);

    const matchup = document.createElement("div");
    matchup.className = "rivalryStatisticsMatchup";
    matchup.append(
        createRivalryManagerHero(one, `${one.showdownWins} showdown win${one.showdownWins === 1 ? "" : "s"}`, one.totalPoints),
        createRivalryManagerHero(two, `${two.showdownWins} showdown win${two.showdownWins === 1 ? "" : "s"}`, two.totalPoints)
    );
    hero.append(overview, matchup);

    const table = document.createElement("div");
    table.className = "comparisonTable";
    [
        ["Showdown Wins", one.showdownWins, two.showdownWins],
        ["Showdown Win Rate", formatAnalyticsPercent(one.showdownWinRate), formatAnalyticsPercent(two.showdownWinRate)],
        ["Season Wins", one.seasonWins, two.seasonWins],
        ["Career Points", one.totalPoints, two.totalPoints],
        ["Average Season Score", formatAnalyticsNumber(one.averageSeasonScore), formatAnalyticsNumber(two.averageSeasonScore)],
        ["Best Season Score", one.bestSeasonScore ?? 0, two.bestSeasonScore ?? 0],
        ["Average League Points", formatAnalyticsNumber(one.averageLeaguePoints), formatAnalyticsNumber(two.averageLeaguePoints)],
        ["Average League Goals", formatAnalyticsNumber(one.averageLeagueGoals), formatAnalyticsNumber(two.averageLeagueGoals)],
        ["Perfect 11-Point Seasons", one.perfectSeasons, two.perfectSeasons],
        ["Transfer Signings", one.signings, two.signings],
        ["Signings Released", one.releasedSignings, two.releasedSignings, false]
    ].forEach(([label, valueOne, valueTwo, higherIsBetter]) => {
        table.appendChild(createComparisonRow(label, valueOne, valueTwo, higherIsBetter === undefined ? true : higherIsBetter));
    });

    container.append(heading, hero, table);
}

function createCareerIdentityNotice(analytics){
    const unresolved = Number(analytics && analytics.identity && analytics.identity.unresolvedRoleCount) || 0;
    if(!unresolved){ return null; }
    const notice = document.createElement("div");
    notice.className = "analyticsEmpty analyticsIdentityNotice";
    notice.dataset.unresolvedRoles = String(unresolved);
    notice.textContent = `${unresolved} historical manager role${unresolved === 1 ? " remains" : "s remain"} unresolved. ${unresolved === 1 ? "It is" : "They are"} excluded from longitudinal manager totals and leaderboards until explicitly linked to Local Profiles. Overall Showdown, season, points, trophies and season records remain complete.`;
    return notice;
}

function renderCareerStatistics(request = false){
    const content = document.getElementById("careerStatisticsContent");
    if(!content){ return; }

    const seam = readCareerScreenSeam(() => renderCareerStatistics(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ careerStatisticsModel = normalized.model; }
    const force = normalized.force;
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: careerStatisticsModel });
    if(source !== "local"){
        content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("careerStatistics", source === "model" ? careerStatisticsModel : null)));
        careerStatisticsRenderKey = null;
        return;
    }

    const nextKey = getCareerStatisticsRenderKey();
    if(!force && careerStatisticsRenderKey === nextKey && content.childElementCount){
        const rivalryButton = document.getElementById("careerStatisticsRivalryButton");
        if(rivalryButton){ rivalryButton.classList.toggle("hidden", !currentShowdown); }
        return;
    }

    const analytics = buildCareerAnalytics();
    const fragment = document.createDocumentFragment();

    const summary = document.createElement("div");
    summary.className = "analyticsStatsGrid trophyRoomSummary";
    summary.append(
        createAnalyticsStat("COMPLETED SHOWDOWNS", analytics.totals.showdowns),
        createAnalyticsStat("SEASONS PLAYED", analytics.totals.seasons),
        createAnalyticsStat("CAREER POINTS", analytics.totals.points),
        createAnalyticsStat("TROPHIES WON", analytics.totals.trophies)
    );
    fragment.appendChild(summary);

    const identityNotice = createCareerIdentityNotice(analytics);
    if(identityNotice){ fragment.appendChild(identityNotice); }

    if(!analytics.managers.length){
        if(!identityNotice){
            const empty = document.createElement("div");
            empty.className = "analyticsEmpty";
            empty.textContent = "Career Statistics appear after your first completed Showdown. Stats for the current Showdown are on Showdown Home.";
            fragment.appendChild(empty);
        }
    }else{
        const standingsHeading = document.createElement("h3");
        standingsHeading.className = "analyticsSectionHeading";
        standingsHeading.textContent = "CAREER TABLE";
        fragment.append(standingsHeading, createCareerStandingsTable(analytics.managers));

        const host = document.createElement("div");
        renderCareerManagerComparison(host, analytics);
        renderCareerLeaders(host, analytics);
        while(host.firstChild){ fragment.appendChild(host.firstChild); }
    }

    content.replaceChildren(fragment);
    careerStatisticsRenderKey = nextKey;

    const rivalryButton = document.getElementById("careerStatisticsRivalryButton");
    if(rivalryButton){ rivalryButton.classList.toggle("hidden", !currentShowdown); }
}

function renderRivalryComparison(container, analytics){
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "HEAD-TO-HEAD";
    const table = document.createElement("div");
    table.className = "comparisonTable";
    const one = analytics.playerOne;
    const two = analytics.playerTwo;
    const rows = [
        ["Showdown Points", one.totalPoints, two.totalPoints],
        ["Season Wins", one.seasonWins, two.seasonWins],
        ["Season Draws", one.seasonDraws, two.seasonDraws],
        ["Total Trophies", one.totalTrophies, two.totalTrophies],
        ["Champions Leagues", one.championsLeagues, two.championsLeagues],
        ["Europa Leagues", one.europaLeagues || 0, two.europaLeagues || 0],
        ["League Titles", one.leagueTitles, two.leagueTitles],
        ["Domestic Cups", one.domesticCups, two.domesticCups],
        ["Performance Bonuses", one.performanceBonuses, two.performanceBonuses],
        ["Awards Bonuses", one.awardsBonuses, two.awardsBonuses],
        ["100-Point Seasons", one.hundredPointSeasons, two.hundredPointSeasons],
        ["100-Goal Seasons", one.hundredGoalSeasons, two.hundredGoalSeasons],
        ["Top Scorer Seasons", one.topScorerSeasons, two.topScorerSeasons],
        ["Top Assist Seasons", one.topAssistSeasons, two.topAssistSeasons],
        ["Perfect 11-Point Seasons", one.perfectSeasons, two.perfectSeasons],
        ["Average Season Score", formatAnalyticsNumber(one.averageSeasonScore), formatAnalyticsNumber(two.averageSeasonScore)],
        ["Best Season Score", one.bestSeasonScore ?? 0, two.bestSeasonScore ?? 0],
        ["Best League Points", one.bestLeaguePoints ?? 0, two.bestLeaguePoints ?? 0],
        ["Best League Goals", one.bestLeagueGoals ?? 0, two.bestLeagueGoals ?? 0],
        ["Transfer Signings", one.signings, two.signings],
        ["Signings Released", one.releasedSignings, two.releasedSignings, false]
    ];
    const fragment = document.createDocumentFragment();
    rows.forEach(([label, valueOne, valueTwo, higherIsBetter]) => {
        fragment.appendChild(createComparisonRow(label, valueOne, valueTwo, higherIsBetter === undefined ? true : higherIsBetter));
    });
    table.appendChild(fragment);
    container.append(heading, table);
}

function getSeasonWinnerText(analytics, row){
    if(row.winner === "playerOne"){ return `${analytics.playerOne.name} won`; }
    if(row.winner === "playerTwo"){ return `${analytics.playerTwo.name} won`; }
    return "Draw";
}

function createSeasonBar(name, score, alignRight = false){
    const wrap = document.createElement("div");
    wrap.className = `seasonStatSide${alignRight ? " right" : ""}`;
    const top = document.createElement("div");
    top.className = "seasonStatTop";
    const manager = document.createElement("span");
    manager.textContent = name;
    const value = document.createElement("strong");
    value.textContent = score;
    top.append(manager, value);
    const track = document.createElement("div");
    track.className = "seasonPointTrack";
    const fill = document.createElement("div");
    fill.className = "seasonPointFill";
    fill.style.width = `${Math.min(100, Math.max(0, (Number(score) / 11) * 100))}%`;
    track.appendChild(fill);
    wrap.append(top, track);
    return wrap;
}

function renderSeasonProgression(container, analytics){
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "SEASON-BY-SEASON";
    container.appendChild(heading);

    if(!analytics.seasonRows.length){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "No season completed yet. Stats appear as seasons finish.";
        container.appendChild(empty);
        return;
    }

    const list = document.createElement("div");
    list.className = "seasonProgressionList";
    const fragment = document.createDocumentFragment();
    analytics.seasonRows.forEach(row => {
        const season = document.createElement("div");
        season.className = "seasonProgressionRow";
        const label = document.createElement("div");
        label.className = "seasonProgressionLabel";
        const number = document.createElement("strong");
        number.textContent = `SEASON ${row.season}`;
        const winner = document.createElement("span");
        winner.textContent = getSeasonWinnerText(analytics, row);
        label.append(number, winner);
        season.append(
            label,
            createSeasonBar(analytics.playerOne.name, row.playerOneScore),
            createSeasonBar(analytics.playerTwo.name, row.playerTwoScore, true)
        );
        fragment.appendChild(season);
    });
    list.appendChild(fragment);
    container.appendChild(list);
}

function renderRivalryHighlights(container, analytics){
    const one = analytics.playerOne;
    const two = analytics.playerTwo;
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "RIVALRY TOTALS";
    const grid = document.createElement("div");
    grid.className = "analyticsStatsGrid";
    grid.append(
        createAnalyticsStat("SEASONS COMPLETED", analytics.seasonRows.length, `of ${analytics.showdown.totalRounds}`),
        createAnalyticsStat("TROPHIES WON", one.totalTrophies + two.totalTrophies),
        createAnalyticsStat("SHOWDOWN POINTS", one.totalPoints + two.totalPoints),
        createAnalyticsStat("TRANSFER SIGNINGS", one.signings + two.signings),
        createAnalyticsStat("RELEASED SIGNINGS", one.releasedSignings + two.releasedSignings),
        createAnalyticsStat("PERFECT SEASONS", one.perfectSeasons + two.perfectSeasons, "11-point seasons")
    );
    container.append(heading, grid);
}

function renderRivalryStatistics(request = false){
    const content = document.getElementById("rivalryStatisticsContent");
    if(!content){ return; }

    const seam = readCareerScreenSeam(() => renderRivalryStatistics(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ rivalryStatisticsModel = normalized.model; }
    const force = normalized.force;
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: rivalryStatisticsModel });
    if(source !== "local"){
        content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("rivalryStatistics", source === "model" ? rivalryStatisticsModel : null)));
        rivalryStatisticsRenderKey = null;
        return;
    }

    const nextKey = getRivalryStatisticsRenderKey();
    if(!force && rivalryStatisticsRenderKey === nextKey && content.childElementCount){
        return;
    }

    if(!currentShowdown){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "No Showdown in progress. Start or join one from Home.";
        content.replaceChildren(empty);
        rivalryStatisticsRenderKey = nextKey;
        return;
    }

    const analytics = buildRivalryAnalytics(currentShowdown);
    if(!analytics){ return; }
    const fragment = document.createDocumentFragment();

    const hero = document.createElement("div");
    hero.className = "rivalryStatisticsHero";
    const overview = document.createElement("div");
    overview.className = "rivalryStatisticsOverview";
    const title = document.createElement("strong");
    title.textContent = analytics.showdown.name;
    const meta = document.createElement("span");
    const league = analytics.showdown.selectedLeague ? analytics.showdown.selectedLeague.name : "League not selected";
    meta.textContent = `${league} · ${analytics.showdown.status}`;
    overview.append(title, meta);
    const matchup = document.createElement("div");
    matchup.className = "rivalryStatisticsMatchup";
    matchup.append(
        createRivalryManagerHero(analytics.playerOne, analytics.showdown.clubs.playerOne, analytics.playerOne.totalPoints),
        createRivalryManagerHero(analytics.playerTwo, analytics.showdown.clubs.playerTwo, analytics.playerTwo.totalPoints)
    );
    hero.append(overview, matchup);
    fragment.appendChild(hero);

    const host = document.createElement("div");
    renderRivalryHighlights(host, analytics);
    renderRivalryComparison(host, analytics);
    renderSeasonProgression(host, analytics);
    while(host.firstChild){ fragment.appendChild(host.firstChild); }

    content.replaceChildren(fragment);
    rivalryStatisticsRenderKey = nextKey;
}

function openCareerStatistics(request = false){
    createCareerStatisticsScreen();
    renderCareerStatistics(request);
    showScreen("careerStatistics");
    openCareerScreensV10("careerStatistics");
}

function openRivalryStatistics(request = false){
    const suppliesModel = Boolean(request && typeof request === "object" && request.model);
    if(!suppliesModel && !currentShowdown && typeof window.loadRuntimeScript !== "function"){ return; }
    createStatisticsScreen();
    renderRivalryStatistics(request);
    showScreen("statistics");
    openRivalryLegacyV10("rivalryStatistics", () => rivalryStatisticsModel);
}

window.renderCareerStatistics = renderCareerStatistics;
window.openCareerStatistics = openCareerStatistics;
window.createCareerStandingsTable = createCareerStandingsTable;
window.renderRivalryStatistics = renderRivalryStatistics;
window.openRivalryStatistics = openRivalryStatistics;
window.createAnalyticsStat = createAnalyticsStat;
// Rivalry Statistics also reads completed career history without a local active save.
// Match the read-only Standings route extension; every other route keeps its guard.
if(typeof window.isRouteStateValid === "function"){
    const rivalryRouteStateValid = window.isRouteStateValid;
    window.isRouteStateValid = function(screen){ return screen === "statistics" || rivalryRouteStateValid.apply(this, arguments); };
}

```

## FILE: js/trophyRoom.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Lightweight Trophy Room and All-Time Records
===================================================== */

let trophyRoomRenderKey = null;

function createTrophyRoomScreen(){
    if(document.getElementById("trophyRoom")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "trophyRoom";
    section.className = "screen hidden analyticsScreen";
    const heading = document.createElement("h2");
    heading.textContent = "TROPHY ROOM";
    const content = document.createElement("div");
    content.id = "trophyRoomContent";
    content.className = "analyticsContent";
    const actions = document.createElement("div");
    actions.className = "analyticsActions";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK";
    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function getTrophyRoomRenderKey(){
    if(typeof window.getCareerAnalyticsRevisionKey === "function"){
        return window.getCareerAnalyticsRevisionKey();
    }
    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : 0;
    const active = currentShowdown;
    const activeKey = active && active.status === "Completed"
        ? `${active.id}:${active.updatedAt || active.completedAt || ""}`
        : "none";
    return `${revision}|${activeKey}`;
}

function createTrophyCount(label, value, code){
    const item = document.createElement("div");
    item.className = "trophyCount";
    const crest = document.createElement("div");
    crest.className = "trophyGlyph";
    crest.textContent = code;
    const details = document.createElement("div");
    const amount = document.createElement("strong");
    amount.textContent = value;
    const title = document.createElement("span");
    title.textContent = label;
    details.append(amount, title);
    item.append(crest, details);
    return item;
}

function createManagerCabinet(manager, rank){
    const cabinet = document.createElement("article");
    cabinet.className = "managerCabinet";
    if(manager.profileId){ cabinet.dataset.profileId = manager.profileId; }
    const header = document.createElement("div");
    header.className = "managerCabinetHeader";
    const rankElement = document.createElement("span");
    rankElement.className = "managerRank";
    rankElement.textContent = `#${rank}`;
    const identity = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = manager.name;
    const record = document.createElement("p");
    record.textContent = `${manager.showdownWins}W · ${manager.showdownDraws}D · ${manager.showdownLosses}L across ${manager.showdowns} showdown${manager.showdowns === 1 ? "" : "s"}`;
    identity.append(name, record);
    const points = document.createElement("div");
    points.className = "managerCareerPoints";
    const amount = document.createElement("strong");
    amount.textContent = manager.totalPoints;
    const label = document.createElement("span");
    label.textContent = "CAREER POINTS";
    points.append(amount, label);
    header.append(rankElement, identity, points);

    const shelf = document.createElement("div");
    shelf.className = "trophyShelf";
    shelf.append(
        createTrophyCount("Champions League", manager.championsLeagues, "UCL"),
        createTrophyCount("Europa League", manager.europaLeagues || 0, "UEL"),
        createTrophyCount("League Titles", manager.leagueTitles, "LGE"),
        createTrophyCount("Domestic Cups", manager.domesticCups, "CUP")
    );

    const supporting = document.createElement("div");
    supporting.className = "cabinetSupportingStats";
    supporting.append(
        createAnalyticsStat("TOTAL TROPHIES", manager.totalTrophies),
        createAnalyticsStat("SEASON WINS", manager.seasonWins),
        createAnalyticsStat("PERFECT SEASONS", manager.perfectSeasons, "11 points"),
        createAnalyticsStat("100-POINT SEASONS", manager.hundredPointSeasons),
        createAnalyticsStat("100-GOAL SEASONS", manager.hundredGoalSeasons),
        createAnalyticsStat("SAFE SIGNINGS", manager.safeSignings)
    );

    const achievements = document.createElement("div");
    achievements.className = "cabinetAchievementStrip";
    const bonusText = document.createElement("span");
    bonusText.textContent = `${manager.performanceBonuses} performance bonus${manager.performanceBonuses === 1 ? "" : "es"} · ${manager.awardsBonuses} awards bonus${manager.awardsBonuses === 1 ? "" : "es"}`;
    const clubText = document.createElement("span");
    clubText.textContent = manager.clubs.length
        ? `${manager.clubs.length} club${manager.clubs.length === 1 ? "" : "s"}: ${manager.clubs.join(", ")}`
        : "No club history";
    achievements.append(bonusText, clubText);
    cabinet.append(header, shelf, supporting, achievements);
    return cabinet;
}

function managerLeaderText(record, suffix = ""){
    if(!record || record.value === null || !record.holders || !record.holders.length){
        return { value: "—", detail: "No completed record yet" };
    }
    if(Number(record.value) === 0){
        return { value: "0", detail: "No manager has recorded this achievement yet" };
    }
    return {
        value: `${record.value}${suffix}`,
        detail: record.holders.map(holder => holder.name).join(" · ")
    };
}

function seasonRecordText(record, suffix = ""){
    if(!record || record.value === null || !record.holders || !record.holders.length){
        return { value: "—", detail: "No completed record yet" };
    }
    const holder = record.holders[0];
    const tied = record.holders.length > 1 ? ` · ${record.holders.length}-way tie` : "";
    return {
        value: `${record.value}${suffix}`,
        detail: `${holder.manager} · ${holder.club} · Season ${holder.season} · ${holder.showdown}${tied}`
    };
}

function createRecordCard(label, recordText){
    const card = document.createElement("div");
    card.className = "recordCard";
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const value = document.createElement("strong");
    value.textContent = recordText.value;
    const detail = document.createElement("small");
    detail.textContent = recordText.detail;
    card.append(labelElement, value, detail);
    return card;
}

function renderAllTimeRecords(container, analytics){
    const heading = document.createElement("h3");
    heading.className = "analyticsSectionHeading";
    heading.textContent = "ALL-TIME RECORDS";
    const grid = document.createElement("div");
    grid.className = "recordsGrid";
    const records = analytics.records;
    grid.append(
        createRecordCard("MOST SHOWDOWN WINS", managerLeaderText(records.showdownWins)),
        createRecordCard("MOST CAREER POINTS", managerLeaderText(records.totalPoints)),
        createRecordCard("MOST TROPHIES", managerLeaderText(records.trophies)),
        createRecordCard("MOST CHAMPIONS LEAGUES", managerLeaderText(records.championsLeagues)),
        createRecordCard("MOST LEAGUE TITLES", managerLeaderText(records.leagueTitles)),
        createRecordCard("MOST DOMESTIC CUPS", managerLeaderText(records.domesticCups)),
        createRecordCard("PERFECT 11-POINT SEASONS", managerLeaderText(records.perfectSeasons)),
        createRecordCard("HIGHEST SEASON SCORE", seasonRecordText(records.highestSeasonScore, " pts")),
        createRecordCard("HIGHEST LEAGUE POINTS", seasonRecordText(records.highestLeaguePoints, " pts")),
        createRecordCard("MOST LEAGUE GOALS", seasonRecordText(records.highestLeagueGoals, " goals"))
    );
    if(records.biggestShowdownMargin){
        grid.appendChild(createRecordCard("BIGGEST SHOWDOWN WIN", {
            value: `${records.biggestShowdownMargin.value} pts`,
            detail: `${records.biggestShowdownMargin.manager} · ${records.biggestShowdownMargin.score} · ${records.biggestShowdownMargin.showdown}`
        }));
    }
    container.append(heading, grid);
}

function createTrophyIdentityNotice(analytics){
    const unresolved = Number(analytics && analytics.identity && analytics.identity.unresolvedRoleCount) || 0;
    if(!unresolved){ return null; }
    const notice = document.createElement("div");
    notice.className = "analyticsEmpty analyticsIdentityNotice";
    notice.dataset.unresolvedRoles = String(unresolved);
    notice.textContent = `${unresolved} historical manager role${unresolved === 1 ? " remains" : "s remain"} unresolved. ${unresolved === 1 ? "It is" : "They are"} excluded from manager cabinets and longitudinal leaderboards until explicitly linked to Local Profiles. Overall trophy totals and Showdown or season records remain complete.`;
    return notice;
}

let trophyRoomModel = null;

function renderTrophyRoom(request = false){
    const content = document.getElementById("trophyRoomContent");
    if(!content){ return; }

    const seam = readCareerScreenSeam(() => renderTrophyRoom(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ trophyRoomModel = normalized.model; }
    const force = normalized.force;
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: trophyRoomModel });
    if(source !== "local"){
        content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("trophyRoom", source === "model" ? trophyRoomModel : null)));
        trophyRoomRenderKey = null;
        return;
    }

    const nextKey = getTrophyRoomRenderKey();
    if(!force && trophyRoomRenderKey === nextKey && content.childElementCount){
        return;
    }

    const analytics = buildCareerAnalytics();
    const fragment = document.createDocumentFragment();
    const summary = document.createElement("div");
    summary.className = "analyticsStatsGrid trophyRoomSummary";
    summary.append(
        createAnalyticsStat("COMPLETED SHOWDOWNS", analytics.totals.showdowns),
        createAnalyticsStat("SEASONS PLAYED", analytics.totals.seasons),
        createAnalyticsStat("TROPHIES WON", analytics.totals.trophies),
        createAnalyticsStat("SHOWDOWN POINTS", analytics.totals.points)
    );
    fragment.appendChild(summary);

    const identityNotice = createTrophyIdentityNotice(analytics);
    if(identityNotice){ fragment.appendChild(identityNotice); }

    if(analytics.managers.length){
        const standingsHeading = document.createElement("h3");
        standingsHeading.className = "analyticsSectionHeading";
        standingsHeading.textContent = "CAREER TABLE";
        fragment.append(standingsHeading, createCareerStandingsTable(analytics.managers));

        const cabinetsHeading = document.createElement("h3");
        cabinetsHeading.className = "analyticsSectionHeading";
        cabinetsHeading.textContent = "MANAGER CABINETS";
        fragment.appendChild(cabinetsHeading);
        const cabinets = document.createElement("div");
        cabinets.className = "managerCabinetList";
        const cabinetFragment = document.createDocumentFragment();
        analytics.managers.forEach((manager, index) => {
            cabinetFragment.appendChild(createManagerCabinet(manager, index + 1));
        });
        cabinets.appendChild(cabinetFragment);
        fragment.appendChild(cabinets);
    }else if(!identityNotice){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "The Trophy Room is empty. Finish a Showdown and its trophies and records appear here.";
        fragment.appendChild(empty);
    }

    if(analytics.totals.showdowns){
        const recordsHost = document.createElement("div");
        renderAllTimeRecords(recordsHost, analytics);
        while(recordsHost.firstChild){ fragment.appendChild(recordsHost.firstChild); }
    }

    content.replaceChildren(fragment);
    trophyRoomRenderKey = nextKey;
}

function openTrophyRoom(request = false){
    createTrophyRoomScreen();
    renderTrophyRoom(request);
    showScreen("trophyRoom");
    if(typeof openCareerScreensV10 === "function"){ openCareerScreensV10("trophyRoom"); }
}

window.renderTrophyRoom = renderTrophyRoom;
window.openTrophyRoom = openTrophyRoom;
```

## FILE: js/legacy.js
```js
/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.1.0
   Transaction-Safe Lightweight Legacy Archive Engine
===================================================== */

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function legacyAskConfirm(message,tone){return typeof window.askShowdownConfirm==="function"?window.askShowdownConfirm(message,{tone}):typeof window.loadRuntimeScript==="function"?window.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof window.askShowdownConfirm==="function").then(()=>window.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}

const legacyDateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
});

let lastLegacyRenderedRevision = null;
let backupExportInProgress = false;

function archiveCompletedSaveBeforeLegacy(){
    const candidate = currentShowdown || loadSavedShowdown();
    if(!candidate || candidate.status !== "Completed"){
        return;
    }

    const existing = loadLegacyShowdowns().find(item => String(item.id) === String(candidate.id));
    const alreadyCurrent = existing
        && String(existing.updatedAt || "") === String(candidate.updatedAt || "")
        && String(existing.completedAt || "") === String(candidate.completedAt || "");

    if(!alreadyCurrent){
        archiveShowdown(candidate);
    }
}

function getArchivedShowdownWinner(showdown){
    const playerOneScore = Number(showdown.score && showdown.score.playerOne) || 0;
    const playerTwoScore = Number(showdown.score && showdown.score.playerTwo) || 0;

    if(playerOneScore > playerTwoScore){ return "playerOne"; }
    if(playerTwoScore > playerOneScore){ return "playerTwo"; }
    return "draw";
}

function formatLegacyDate(value){
    if(!value){ return "Date unavailable"; }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : legacyDateFormatter.format(date);
}

function countPlayerTrophies(player){
    if(!player){ return 0; }
    return (Number(player.leaguePosition) === 1 ? 1 : 0)
        + (player.domesticCup ? 1 : 0)
        + (player.championsLeague ? 1 : 0)
        + (player.europaLeague === true && !player.championsLeague ? 1 : 0);
}

function countShowdownTrophies(showdown){
    return (showdown.rounds || []).reduce(
        (total, round) => total + countPlayerTrophies(round.playerOne) + countPlayerTrophies(round.playerTwo),
        0
    );
}

function getLegacyTotals(history){
    return history.reduce((totals, showdown) => {
        totals.showdowns += 1;
        totals.trophies += countShowdownTrophies(showdown);
        totals.points += (Number(showdown.score && showdown.score.playerOne) || 0)
            + (Number(showdown.score && showdown.score.playerTwo) || 0);
        return totals;
    }, { showdowns: 0, trophies: 0, points: 0 });
}

function createLegacyStat(label, value){
    const card = document.createElement("div");
    card.className = "legacyStat";
    const labelElement = document.createElement("span");
    const valueElement = document.createElement("strong");
    labelElement.textContent = label;
    valueElement.textContent = value;
    card.append(labelElement, valueElement);
    return card;
}

function getWinnerLabel(showdown){
    const winner = getArchivedShowdownWinner(showdown);
    if(winner === "playerOne"){ return `${showdown.managers.playerOne} wins the showdown`; }
    if(winner === "playerTwo"){ return `${showdown.managers.playerTwo} wins the showdown`; }
    return "Showdown is a draw";
}

function getLegacyScoring(player){
    if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
        return player.scoring;
    }
    return typeof calculatePlayerSeasonScore === "function"
        ? calculatePlayerSeasonScore(player || {})
        : { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
}

function getPlayerHonours(player){
    if(!player){ return "No honours"; }
    const honours = [];
    const scoring = getLegacyScoring(player);

    if(player.championsLeague){ honours.push("Champions League"); }
    else if(player.europaLeague === true){ honours.push("Europa League"); }
    if(Number(player.leaguePosition) === 1){ honours.push("League"); }
    if(player.domesticCup){ honours.push("Domestic Cup"); }
    if(scoring.performanceBonus){ honours.push("Performance Bonus"); }
    if(scoring.individualAwardsBonus || scoring.awardsBonus){ honours.push("Awards Bonus"); }

    return honours.length ? honours.join(" · ") : "No honours";
}

function buildTransferChallengeMap(showdown){
    const map = new Map();
    (showdown.transferChallenges || []).forEach(challenge => {
        if(challenge){
            map.set(Number(challenge.seasonNumber), challenge);
        }
    });
    return map;
}

function getSeasonTransferReleases(challengeMap, seasonNumber, playerKey){
    const challenge = challengeMap.get(Number(seasonNumber));
    if(!challenge || !challenge.signings){ return 0; }

    const signings = Array.isArray(challenge.signings[playerKey])
        ? challenge.signings[playerKey]
        : [];
    return signings.reduce((count, signing) => count + (signing && signing.release ? 1 : 0), 0);
}

function createSeasonManagerCell(showdown, round, playerKey, challengeMap, alignRight = false){
    const player = round[playerKey];
    const managerName = showdown.managers[playerKey];
    const cell = document.createElement("div");
    cell.className = `legacySeasonManager${alignRight ? " right" : ""}`;

    const primary = document.createElement("div");
    primary.textContent = `${managerName}: #${player.leaguePosition} · ${player.leaguePoints} league pts · ${player.leagueGoals} goals`;

    const honours = document.createElement("div");
    honours.className = "legacySeasonHonours";
    const releases = getSeasonTransferReleases(challengeMap, round.roundNumber, playerKey);
    const releaseText = releases > 0 ? ` · ${releases} transfer release${releases === 1 ? "" : "s"}` : "";
    honours.textContent = `${getPlayerHonours(player)}${releaseText}`;

    cell.append(primary, honours);
    return cell;
}

function createLegacySeasonRow(showdown, round, challengeMap){
    const row = document.createElement("div");
    row.className = "legacySeasonRow";

    const season = document.createElement("div");
    season.className = "legacySeasonNumber";
    season.textContent = `SEASON ${round.roundNumber}`;

    const playerOne = createSeasonManagerCell(showdown, round, "playerOne", challengeMap);
    const score = document.createElement("div");
    score.className = "legacySeasonScore";
    score.textContent = `${getLegacyScoring(round.playerOne).total} - ${getLegacyScoring(round.playerTwo).total}`;
    const playerTwo = createSeasonManagerCell(showdown, round, "playerTwo", challengeMap, true);

    row.append(season, playerOne, score, playerTwo);
    return row;
}

function getMatchingCompletedActiveShowdown(showdownId){
    const active = currentShowdown || loadSavedShowdown();
    if(!active || active.status !== "Completed" || String(active.id) !== String(showdownId)){
        return null;
    }
    return active;
}

/* Deleting the Showdown also removes every unsent private draft on this device (Season Results, Transfer Challenge, signing), for every rivalry, including orphans.
   The sweep lives in diagnostics.js (the only non-startup file allowed to touch browser storage directly) and loads on demand; it needs no rivalry id, so it also works offline or before the pair module loads. */
function sweepLegacyShowdownDrafts(){
    try{
        return Promise.resolve(window.ensureDiagnosticsModule()).then(() => window.clearAllShowdownDraftKeys() === true).catch(() => false);
    }catch(_error){
        return Promise.resolve(false);
    }
}

function clearMatchingCompletedActiveShowdown(showdownId){
    const active = getMatchingCompletedActiveShowdown(showdownId);
    if(!active){
        return true;
    }

    if(!clearSavedShowdown()){
        return false;
    }
    sweepLegacyShowdownDrafts();

    currentShowdown = null;
    if(typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
    return true;
}

function populateLegacySeasonHistory(showdown, seasonList){
    if(seasonList.dataset.rendered === "true"){
        return;
    }

    seasonList.dataset.rendered = "true";
    const challengeMap = buildTransferChallengeMap(showdown);
    const fragment = document.createDocumentFragment();
    (showdown.rounds || []).forEach(round => {
        fragment.appendChild(createLegacySeasonRow(showdown, round, challengeMap));
    });
    seasonList.appendChild(fragment);
}

function deleteLegacyShowdownTransaction(showdown){
    const historyBefore = loadLegacyShowdowns();
    const activeMatches = Boolean(getMatchingCompletedActiveShowdown(showdown.id));

    if(!deleteLegacyShowdown(showdown.id)){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The Legacy showdown could not be deleted.", "error", 9000);
        }
        return false;
    }

    if(activeMatches && !clearMatchingCompletedActiveShowdown(showdown.id)){
        const restored = saveLegacyShowdowns(historyBefore);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                restored
                    ? "The active completed copy could not be removed, so the Legacy deletion was rolled back."
                    : "The active completed copy could not be removed and the Legacy rollback also failed. Refresh before making more data changes.",
                "error",
                12000
            );
        }
        return false;
    }

    return true;
}

function createLegacyShowdownCard(showdown){
    const card = document.createElement("article");
    card.className = "legacyShowdownCard";

    const top = document.createElement("div");
    top.className = "legacyCardTop";
    const title = document.createElement("div");
    title.className = "legacyCardTitle";
    const heading = document.createElement("h3");
    heading.textContent = showdown.name;
    const subtitle = document.createElement("p");
    const leagueName = showdown.selectedLeague ? showdown.selectedLeague.name : "League unavailable";
    const rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];
    subtitle.textContent = `${leagueName} · ${rounds.length} season${rounds.length === 1 ? "" : "s"} · completed ${formatLegacyDate(showdown.completedAt || showdown.archivedAt)}`;
    title.append(heading, subtitle);

    const matchup = document.createElement("div");
    matchup.className = "legacyMatchup";
    const clubOne = document.createElement("strong");
    clubOne.textContent = `${showdown.managers.playerOne} · ${showdown.clubs.playerOne}`;
    const finalScore = document.createElement("span");
    finalScore.textContent = `${showdown.score.playerOne} - ${showdown.score.playerTwo}`;
    const clubTwo = document.createElement("strong");
    clubTwo.textContent = `${showdown.clubs.playerTwo} · ${showdown.managers.playerTwo}`;
    const winner = document.createElement("div");
    winner.className = "legacyWinner";
    winner.textContent = getWinnerLabel(showdown);
    matchup.append(clubOne, finalScore, clubTwo, winner);

    const meta = document.createElement("div");
    meta.className = "legacyCardMeta";
    meta.textContent = `${countShowdownTrophies(showdown)} trophies won\n${(Number(showdown.score.playerOne) || 0) + (Number(showdown.score.playerTwo) || 0)} total showdown points`;
    meta.style.whiteSpace = "pre-line";
    top.append(title, matchup, meta);

    const details = document.createElement("details");
    details.className = "legacyDetails";
    const summary = document.createElement("summary");
    summary.textContent = "VIEW SEASON HISTORY";
    const seasonList = document.createElement("div");
    seasonList.className = "legacySeasonList";
    details.append(summary, seasonList);
    details.addEventListener("toggle", () => {
        if(details.open){
            populateLegacySeasonHistory(showdown, seasonList);
        }
    });

    const actions = document.createElement("div");
    actions.className = "legacyCardActions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "compactButton dangerButton";
    deleteButton.textContent = "DELETE SHOWDOWN";
    deleteButton.addEventListener("click", async () => {
        const alsoDeletesActive = Boolean(getMatchingCompletedActiveShowdown(showdown.id));
        const warning = alsoDeletesActive
            ? `Delete "${showdown.name}" from Legacy and remove its active completed copy? This cannot be undone.`
            : `Delete "${showdown.name}" from Legacy? This cannot be undone.`;

        if(await legacyAskConfirm(warning, "danger") !== true){ return; }
        if(deleteLegacyShowdownTransaction(showdown)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(`Deleted "${showdown.name}" from Legacy history.`, "success", 4200);
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    actions.appendChild(deleteButton);
    card.append(top, details, actions);
    return card;
}

function deleteAllLegacyHistoryTransaction(history){
    const completedActive = (currentShowdown || loadSavedShowdown());
    const matchingActive = completedActive
        && completedActive.status === "Completed"
        && history.some(item => String(item.id) === String(completedActive.id));

    if(!clearLegacyHistory()){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Legacy history could not be cleared.", "error", 9000);
        }
        return false;
    }

    if(matchingActive && !clearMatchingCompletedActiveShowdown(completedActive.id)){
        const restored = saveLegacyShowdowns(history);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                restored
                    ? "The completed active copy could not be removed, so Legacy history was restored."
                    : "Legacy was cleared but the active completed copy could not be removed, and rollback failed. Refresh before continuing.",
                "error",
                12000
            );
        }
        return false;
    }

    return true;
}

function createLegacyDataControls(history){
    const controls = document.createElement("section");
    controls.className = "legacyDataControls";
    const heading = document.createElement("h3");
    heading.textContent = "DATA MANAGEMENT";
    const description = document.createElement("p");
    description.textContent = "Download a checksum-protected backup file before destructive maintenance. Export is read-only: it does not change your active Showdown, Legacy history or application preferences.";

    const backupSummary = document.createElement("div");
    backupSummary.className = "legacyBackupSummary";
    const backupTitle = document.createElement("strong");
    backupTitle.textContent = "BACKUP FILE";
    const backupText = document.createElement("span");
    backupText.textContent = "Human-readable JSON · format v1 · SHA-256 corruption check · malformed current bytes preserved in recovery data";
    backupSummary.append(backupTitle, backupText);

    const buttons = document.createElement("div");
    buttons.className = "legacyControlButtons";

    const status = document.createElement("p");
    status.className = "legacyDataStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Backup export is ready.";

    const exportBackup = document.createElement("button");
    exportBackup.type = "button";
    exportBackup.className = "compactButton primaryDataButton";
    exportBackup.textContent = "EXPORT BACKUP";
    exportBackup.addEventListener("click", async () => {
        if(backupExportInProgress){ return; }
        if(typeof window.exportCareerModeBackup !== "function"){
            status.textContent = "Backup export is unavailable right now.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 9000);
            }
            return;
        }

        backupExportInProgress = true;
        exportBackup.disabled = true;
        exportBackup.setAttribute("aria-busy", "true");
        exportBackup.textContent = "BUILDING BACKUP…";
        status.textContent = "Building a read-only backup and verifying its checksum…";

        try{
            const envelope = await window.exportCareerModeBackup();
            const warningCount = Array.isArray(envelope && envelope.warnings) ? envelope.warnings.length : 0;
            status.textContent = warningCount
                ? `Backup downloaded with ${warningCount} recovery warning${warningCount === 1 ? "" : "s"}. Your stored bytes were not changed.`
                : "Backup downloaded successfully. Your stored bytes were not changed.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "success", warningCount ? 7000 : 4200);
            }
        }catch(error){
            status.textContent = `Backup could not be created: ${error && error.message ? error.message : String(error)}`;
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 10000);
            }
        }finally{
            backupExportInProgress = false;
            exportBackup.disabled = false;
            exportBackup.removeAttribute("aria-busy");
            exportBackup.textContent = "EXPORT BACKUP";
        }
    });

    const deleteHistory = document.createElement("button");
    deleteHistory.type = "button";
    deleteHistory.className = "compactButton dangerButton";
    deleteHistory.textContent = "DELETE ALL LEGACY HISTORY";
    deleteHistory.addEventListener("click", async () => {
        const active = currentShowdown || loadSavedShowdown();
        const completedActiveWillBeRemoved = Boolean(
            active && active.status === "Completed" && history.some(item => String(item.id) === String(active.id))
        );
        const warning = completedActiveWillBeRemoved
            ? "Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone."
            : "Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone.";

        if(await legacyAskConfirm(warning, "danger") !== true){ return; }
        if(deleteAllLegacyHistoryTransaction(history)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice("Legacy history was deleted successfully.", "success", 4200);
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    const resetAll = document.createElement("button");
    resetAll.type = "button";
    resetAll.className = "compactButton dangerButton";
    resetAll.textContent = "RESET ALL SHOWDOWN DATA";
    resetAll.addEventListener("click", async () => {
        if(await legacyAskConfirm("Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.", "danger") !== true){
            return;
        }

        if(!clearAllCareerModeData()){
            currentShowdown = loadSavedShowdown();
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The full reset did not complete. The interface has reloaded the data that is still available; refresh before trying again.",
                    "error",
                    12000
                );
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
            return;
        }
        sweepLegacyShowdownDrafts();

        currentShowdown = null;
        if(typeof window.resetNavigationState === "function"){
            window.resetNavigationState();
        }
        if(typeof window.refreshMainMenuExperience === "function"){
            window.refreshMainMenuExperience();
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("All active and Legacy Showdown data was reset successfully. Application preferences were kept.", "success", 5200);
        }
        lastLegacyRenderedRevision = null;
        showScreen("mainMenu", false);
    });

    buttons.append(exportBackup, deleteHistory, resetAll);
    controls.append(heading, description, backupSummary, buttons, status);
    return controls;
}

let legacyModel = null;
// The data tools page lasts until the app leaves Legacy; the next Legacy visit is Team V's History again.
if(typeof document.addEventListener === "function"){
    document.addEventListener("career-mode-screen-shown", event => {
        if(event?.detail?.screen !== "legacy"){
            window.careerModeLegacyDataTools = false;
            if(document.documentElement?.dataset){ delete document.documentElement.dataset.v10Tools; }
        }
    });
}

function readLegacyScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

function renderLegacy(request = false){
    const dataTools = window.careerModeLegacyDataTools === true;
    // The data tools page is the app's own Legacy markup: close Team V's History first if it is drawn over it.
    if(dataTools && document.getElementById("legacy")?.dataset.rivalryLegacyV10 === "1"){
        window.CareerModeV10Screens?.hide?.("legacy");
        lastLegacyRenderedRevision = null;
    }
    const seamContainer = document.querySelector("#legacy .legacyBox");
    if(!seamContainer){ return; }
    const seam = readLegacyScreenSeam(() => renderLegacy(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ legacyModel = normalized.model; }
    const identity = window.CareerModeOnlinePlayerIdentity;
    const identityState = identity && typeof identity.getState === "function" ? identity.getState() : null;
    const source = seam.selectCareerScreenSource({ identityState, model: legacyModel, dataTools });
    // r61: html[data-v10-tools] dresses this page in Team V's kit (css/v10Shell.css); it never changes what the tools do.
    const toolsMark = document.documentElement?.dataset;
    if(toolsMark){
        if(source === "local"){ toolsMark.v10Tools = "legacy"; }
        else{ delete toolsMark.v10Tools; }
    }
    if(source !== "local"){
        if(typeof window.openRivalryLegacyV10 === "function"){
            window.openRivalryLegacyV10("legacy", () => legacyModel);
        }else if(typeof window.loadRuntimeScript === "function"){
            window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
                .then(() => window.CareerModeRivalryLegacyV10.mount("legacy", () => legacyModel))
                .catch(error => window.reportApplicationError?.("History screen could not load", error));
        }
        seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", source === "model" ? legacyModel : null)));
        lastLegacyRenderedRevision = null;
        return;
    }
    archiveCompletedSaveBeforeLegacy();

    const container = document.querySelector("#legacy .legacyBox");
    if(!container){ return; }

    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : null;

    if(revision !== null && lastLegacyRenderedRevision === revision && container.childElementCount > 0){
        return;
    }

    const history = loadLegacyShowdowns().sort((a, b) => {
        const aTime = new Date(a.completedAt || a.archivedAt || 0).getTime();
        const bTime = new Date(b.completedAt || b.archivedAt || 0).getTime();
        return bTime - aTime;
    });

    const totals = getLegacyTotals(history);
    const fragment = document.createDocumentFragment();

    const stats = document.createElement("div");
    stats.className = "legacyStatsGrid";
    stats.append(
        createLegacyStat("SHOWDOWNS PLAYED", totals.showdowns),
        createLegacyStat("TROPHIES WON", totals.trophies),
        createLegacyStat("TOTAL POINTS", totals.points)
    );
    fragment.appendChild(stats);

    const heading = document.createElement("h3");
    heading.className = "legacySectionHeading";
    heading.textContent = "COMPLETED SHOWDOWNS";
    fragment.appendChild(heading);

    if(history.length === 0){
        const empty = document.createElement("div");
        empty.className = "legacyEmpty";
        empty.textContent = "No completed Showdowns yet. Finish one and it appears here.";
        fragment.appendChild(empty);
    }else{
        const list = document.createElement("div");
        list.className = "legacyList";
        const listFragment = document.createDocumentFragment();
        history.forEach(showdown => listFragment.appendChild(createLegacyShowdownCard(showdown)));
        list.appendChild(listFragment);
        fragment.appendChild(list);
    }

    fragment.appendChild(createLegacyDataControls(history));
    container.replaceChildren(fragment);
    if(typeof window.mountCareerModeImportAnalysisPanel === "function"){
        window.mountCareerModeImportAnalysisPanel();
    }
    lastLegacyRenderedRevision = revision;
}

window.renderLegacy = renderLegacy;

```

## FILE: js/rivalryLegacyV10.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRivalryLegacyV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-28: pure, read-only frames for Team V's current rivalry and completed History.
  const node=typeof module!=="undefined"&&module.exports;
  const seam=()=>node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  // Shell-cached Team V files live under the runtime ?v= URL, so fetch them the same way (offline first launch).
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const BASE="visual-assets/v10_1/",ORDER=["daniel","nik"],STATES=["loading","empty","unavailable","partial","ready"];
  const FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
  const finite=x=>typeof x==="number"&&Number.isFinite(x);
  const pair=x=>x&&ORDER.every(k=>finite(x[k]));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function rlFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(rlFreeze);Object.freeze(x);}return x;}
  function bare(status){return {status,managerOrder:ORDER.slice()};}
  function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
  function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on 110 points (the seam owns the rule). Only a
  // Showdown that has one carries the field.
  function golden(row){const managers=seam().goldenShowdownManagers(row);return managers.length?{goldenShowdown:managers}:{};}
  // r86 Special Player chip (js/specialPlayerChip.js): a Showdown confirmed on r86 or later carries each manager's Special
  // Player; an older one carries no field (no chip).
  const chipApi=()=>node?require("./specialPlayerChip.js"):root.CareerModeSpecialPlayerChip;
  function special(sp){return sp&&sp.daniel&&sp.nik?{specialPlayers:{daniel:sp.daniel,nik:sp.nik}}:{};}
  function rowSpecial(row){try{return special(chipApi()?.forRow?.(row));}catch(_){return {};}}
  function liveSpecial(){try{return special(chipApi()?.live?.());}catch(_){return {};}}
  function historyFrame(model){
    const status=seam().careerScreenView("legacy",model).status;
    if(status==="loading"||status==="unavailable")return bare(status);
    const rows=model?.history?.showdowns;
    if(!Array.isArray(rows))return bare("unavailable");
    const completed=rows.filter(r=>r.status==="completed");
    if(!completed.every(validRow))return bare("unavailable");
    // r80: an Ended early Showdown is listed as one status-only row (date, seasons played); it never counts anywhere.
    const listed=rows.filter(r=>r.status==="completed"||(r.status==="abandoned"&&Number.isInteger(r.number)));
    const frame={...bare(status==="ready"&&!listed.length?"empty":status),showdowns:listed.map(r=>r.status==="abandoned"?{number:r.number,status:"abandoned",endedAt:r.endedAt??null,seasonsPlayed:r.seasonsPlayed??null,endedLabel:seam().endedEarlyText(r)}:{number:r.number,status:"completed",leagueId:r.leagueId,clubs:copy(r.clubs),seasonsPlayed:r.seasonsPlayed,totalSeasons:r.totalSeasons,totals:copy(r.totals),winner:r.winner,seasons:copy(r.seasons),...golden(r),...rowSpecial(r)}),ui:{page:1,pageSize:4,selectedShowdown:completed[0]?.number??null}};
    if(status==="partial")frame.coverage=copy(model.coverage);
    // Current-only projections are never offered as an archive or backfilled.
    if(model.interimLabel){frame.status="unavailable";return bare("unavailable");}
    return frame;
  }
  function rivalryFrame(model){
    let status,source,lifecycle=null,sp={};
    if(model?.history){
      status=seam().careerScreenView("rivalryStatistics",model).status;
      if(status==="loading"||status==="unavailable")return bare(status);
      const row=model.history.showdowns[0];
      if(!row||["abandoned","unavailable"].includes(row.status))return bare(status==="empty"?"empty":"unavailable");
      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers};lifecycle=row.status;sp=rowSpecial(row);
    }else{source=model;status=STATES.includes(source?.status)?source.status:"unavailable";lifecycle=source?.lifecycle??null;sp=liveSpecial();}
    if(status==="loading"||status==="unavailable")return bare(status);
    if(status==="empty"&&!source.managers)return {...bare("empty"),seasons:[],transfers:{status:"unavailable"}};
    if(!source.managers||!ORDER.every(k=>source.managers[k]&&FIELDS.every(f=>finite(source.managers[k][f])||(f==="bestSeasonScore"&&source.managers[k][f]===null))))return bare("unavailable");
    if(!Array.isArray(source.seasons)||!source.seasons.every(validSeason))return bare("unavailable");
    if(status!=="empty"&&(!pair(source.score)||!finite(source.totalSeasons)||!source.clubs||!ORDER.every(k=>typeof source.clubs[k]==="string")))return bare("unavailable");
    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries([...FIELDS,...(finite(source.managers[k].europaLeagues)?["europaLeagues"]:[])].map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle},...golden({status:lifecycle,totalSeasons:source.totalSeasons,seasonsPlayed:source.seasons.length,totals:source.score}),...sp};
    if(status==="partial"){
      if(!source.coverage||!Number.isInteger(source.coverage.readable)||!Number.isInteger(source.coverage.indexed))return bare("unavailable");
      frame.coverage=copy(source.coverage);
    }
    return frame;
  }
  function rlToV10Frame(model,screen){
    if(!["legacy","rivalryStatistics"].includes(screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
    return rlFreeze(screen==="legacy"?historyFrame(model):rivalryFrame(model));
  }
  // Lazy browser binding; model providers remain the existing read-only adapters.
  const APP={legacy:"legacy",rivalryStatistics:"statistics"};
  const DIR={legacy:"legacy",rivalryStatistics:"rivalry-statistics"};
  const BOOT={legacy:"ShowdownLegacyBoot",rivalryStatistics:"ShowdownRivalryStatisticsBoot"};
  const sources={},sourceKeys={},getters={},resources={},originalMarkup={},reloads={};
  const LOAD_TIMEOUT=15000,RELOAD_INTERVAL=2000;
  const LOADING=rlFreeze({status:"loading"}),UNAVAILABLE=rlFreeze({status:"unavailable"});
  let registration=null,installed=false,tabletLayoutCleanup=null,legacyLayoutCleanup=null;
  const screens=()=>root.CareerModeV10Screens;
  const state=name=>{try{return root[name]?.getState?.()??null;}catch(_){return null;}};
  const identity=()=>state("CareerModeOnlinePlayerIdentity");
  // The career start marker's epoch changes only when the marker changes, so a switch drops the cached career.
  const markerEpoch=()=>{try{return root.CareerModeCareerStartMarker?.epoch?.()??0;}catch(_){return 0;}};
  // CE2PG: after a Showdown closes the pair holds no rivalry id but names the closed one, so a career read after Showdown A
  // and one after Showdown B no longer share a key (Standings and Settings showed A's career after B had finished).
  const context=()=>{const pair=state("CareerModePersistentNikDanielPair");return JSON.stringify([state("CareerModeSparkConnectedAccount")?.accountId??null,identity()?.managerId??null,pair?.rivalryId??null,pair?.closedRivalryId??null,markerEpoch()]);};
  const report=error=>root.reportApplicationError?.("History and stats screens could not load",error);
  const load=(key,file,global)=>root.loadRuntimeScript(key,file,()=>Boolean(root[global]));
  async function modelDependencies(){
    for(const [key,file,global] of [
      ["career-history-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],
      ["career-final-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],
      ["career-terminal-protocol","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],
      ["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],
      ["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"],
      ["career-closed-adapter","js/sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter"],
      ["career-completed-reader","js/sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader"],
      ["career-summary-store","js/careerSummaryStore.js","CareerModeCareerSummaryStore"],
      ["career-closed-loader","js/sparkClosedShowdownCareerLoader.js","CareerModeSparkClosedShowdownCareerLoader"]
    ])await load(key,file,global);
  }
  function rlSnapshot(){return {identity:identity(),pair:state("CareerModePersistentNikDanielPair"),history:state("CareerModeProductionSharedHistoryConvergence"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
  function markup(screen){if(node)require("./rivalryLegacyV10Markup.js");return root.CareerModeRivalryLegacyMarkup?.[screen]??"";}
  function source(screen){
    const model=getters[screen]?.();
    if(model!=null)return model;
    // Signed in or not, Team V draws the screen; only Legacy's data tools page keeps the app's own markup.
    return screen==="legacy"&&root.careerModeLegacyDataTools===true?null:(sourceKeys[screen]===context()?sources[screen]??UNAVAILABLE:UNAVAILABLE);
  }
  function clean(screen){
    if(screen==="rivalryStatistics"){tabletLayoutCleanup?.();tabletLayoutCleanup=null;}
    if(screen==="legacy"){legacyLayoutCleanup?.();legacyLayoutCleanup=null;root.LEGACY_BOOT?.cleanup?.();root.LegacyFixture?.stageController?.destroy?.();}
    else{root.rvStage?.destroy?.();root.rvStage=null;}
  }
  function draw(screen,model,host){
    clean(screen);
    // Job 13 retains hidden stages. Remove those before using the shared stage-root id.
    for(const id of ["careerStatistics","trophyRoom"]){const other=root.document.getElementById(id);if(other?.dataset.careerV10==="1"){screens().hide(id);other.remove();}}
    if(host.dataset.rivalryLegacyV10!=="1")originalMarkup[screen]=host.innerHTML;
    host.dataset.rivalryLegacyV10="1";host.innerHTML=markup(screen);
    // Team V's History frame has no Back control (the shared bar covers it), but the product keeps a .backButton for smart Back.
    if(screen==="legacy"){const layer=host.querySelector?.(".sd-stage__layer--ui"),back=layer&&root.document.createElement?.("button");if(back){back.id="legacyBack";back.type="button";back.className="backButton legacyBackV10 sd-btn sd-btn--secondary";back.innerHTML="<span class=\"legacyBackFull\">BACK TO HOME</span><span class=\"legacyBackShort\" aria-hidden=\"true\">BACK</span>";back.setAttribute("aria-label","Back to main menu");layer.appendChild(back);}}
    const frame=copy(rlToV10Frame(model,screen)),data={strings:resources[screen].strings,frames:{LIVE:frame}};
    if(screen==="legacy")root.LEGACY_BOOT={fixtures:data,platemap:resources[screen].map};
    else root.RIVALRY_BOOT={fixtures:data,platemap:resources[screen].map};
    // JOB-1657: Season, Standings and Final-winner shells also carry id="stage-root". Team V's scripts take the first one in the
    // document, which is the hidden 0x0 Season stage, so the plate and both managers mounted into nothing. While they boot,
    // only this screen's stage owns the id; the other shells get it back right after (nothing is removed or moved).
    const strayStages=Array.from(root.document.querySelectorAll?.('[id="stage-root"]')||[]).filter(node=>!host.contains(node));
    for(const node of strayStages)node.removeAttribute("id");
    try{root[BOOT[screen]]();}
    finally{for(const node of strayStages)node.id="stage-root";}
    if(screen==="legacy"){
      // JOB-1704: the adopted touch compositions show one card without an inner
      // swipe scroller. Team V still owns selection, arrows, keys and paging.
      // Mark its current card for CSS, including records without season detail.
      const grid=host.querySelector("#legacyCardGrid");
      const syncCard=()=>{
        const cards=Array.from(grid?.querySelectorAll(".legacyCard")||[]);
        const selected=root.LegacyFixture?.selectedShowdown;
        const current=cards.find(card=>Number(card.dataset.showdown)===Number(selected))||cards[0];
        cards.forEach(card=>card.classList.toggle("legacyVisibleCard",card===current));
      };
      syncCard();
      const observer=grid&&root.MutationObserver?new root.MutationObserver(syncCard):null;
      observer?.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:["data-selected"]});
      const touch=root.matchMedia?.("(max-width:900px) and (orientation:portrait), (min-width:600px) and (max-width:900px) and (max-height:500px) and (orientation:landscape)");
      const syncKey=event=>{
        if(touch?.matches&&["ArrowLeft","ArrowRight"].includes(event.key)){
          syncCard();grid.querySelector(".legacyVisibleCard")?.focus?.({preventScroll:true});
        }
      };
      grid?.addEventListener("keydown",syncKey);
      legacyLayoutCleanup=()=>{observer?.disconnect();grid?.removeEventListener("keydown",syncKey);};
    }
    if(screen==="legacy"&&frame.status==="unavailable"){
      const banner=host.querySelector("#legacyStateBanner"),retry=banner&&root.document.createElement?.("button");
      if(retry){retry.type="button";retry.className="sd-btn sd-btn--secondary";retry.textContent="TRY AGAIN";retry.style.gridColumn="1 / -1";retry.style.justifySelf="center";retry.addEventListener("click",()=>{void refresh(screen).catch(report);});banner.appendChild(retry);}
    }
    const title=host.querySelector(screen==="legacy"?"#legacyHeading":"#statisticsScreenTitle");
    if(title){title.tabIndex=-1;title.setAttribute("data-route-focus-target","true");host.setAttribute("aria-labelledby",title.id);}
    if(screen==="rivalryStatistics"){
      const tabs=Array.from(host.querySelectorAll("[data-rv-tab]")),shell=host.querySelector("#rivalryStatisticsContent");
      // JOB-1601: expose both live panes only in the adopted tablet range.
      const tablet=root.matchMedia?.("(min-width:700px) and (max-width:900px) and (orientation:portrait)");
      const panelKeys=["totals","head","seasons","trophies"];
      const panels=panelKeys.map(key=>host.querySelector("#rvPanel"+({totals:"Totals",head:"Head",seasons:"Seasons",trophies:"Trophies"}[key])));
      let previousHidden=null;
      const syncTabletPanels=()=>{
        if(!tablet)return;
        const key=shell.getAttribute("data-tab")||"totals";
        if(tablet?.matches){
          if(!previousHidden)previousHidden=panels.map(p=>Boolean(p?.hidden));
          panels.forEach((p,i)=>{if(p)p.hidden=panelKeys[i]!=="totals"&&panelKeys[i]!== (key==="totals"?"head":key);});
        }else if(previousHidden){
          const usedHidden=previousHidden.some(Boolean);
          panels.forEach((p,i)=>{if(p)p.hidden=usedHidden?panelKeys[i]!==key:previousHidden[i];});
          previousHidden=null;
        }
      };
      const pick=(key,focus)=>{shell.setAttribute("data-tab",key);tabs.forEach(t=>{const on=t.dataset.rvTab===key;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});syncTabletPanels();};
      tablet?.addEventListener?.("change",syncTabletPanels);
      tabletLayoutCleanup=()=>tablet?.removeEventListener?.("change",syncTabletPanels);
      syncTabletPanels();
      tabs.forEach((t,i)=>{t.addEventListener("click",()=>pick(t.dataset.rvTab));t.addEventListener("keydown",e=>{const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(d){e.preventDefault();pick(tabs[(i+d+tabs.length)%tabs.length].dataset.rvTab,true);}});});
    }
  }
  function undraw(screen,host){if(reloads[screen]?.flight)reloads[screen].flight.left=true;clean(screen);host.innerHTML=originalMarkup[screen]??"";delete host.dataset.rivalryLegacyV10;}
  async function registerRivalryLegacy(){
    if(!registration)registration=(async()=>{
      await load("v10-screens","js/v10Screens.js","CareerModeV10Screens");
      await load("rivalry-legacy-v10-markup","js/rivalryLegacyV10Markup.js","CareerModeRivalryLegacyMarkup");
      await load("visual-identity","js/visualIdentity.js","getClubCrestSvg");
      const api=screens().install();
      for(const screen of Object.keys(APP)){
        const base=DIR[screen]+"/";
        api.register(APP[screen],{
          css:[base+DIR[screen]+".css","../../css/rivalryLegacyV10.css"],
          js:[["v10-"+DIR[screen],base+DIR[screen]+".js",()=>typeof root[BOOT[screen]]==="function"]],
          // The Special Player draw loads with the screen's own files, so its chip is in the first frame (never rejects).
          prepare:async()=>{const chip=load("special-player-chip","js/specialPlayerChip.js","CareerModeSpecialPlayerChip").then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);const responses=await Promise.all([root.fetch(assetUrl(BASE+base+"strings.json")),root.fetch(assetUrl(BASE+base+"assets/platemap.json"))]);await chip;if(responses.some(r=>!r.ok))throw new Error("RIVALRY_LEGACY_RESOURCES_UNAVAILABLE");const [strings,map]=await Promise.all(responses.map(r=>r.json()));resources[screen]={strings,map};},
          frame:()=>source(screen),mount:(model,host)=>draw(screen,model,host),unmount:host=>undraw(screen,host)
        });
      }
      if(!installed){
        installed=true;
        const events={"career-mode-online-identity-change":"CareerModeOnlinePlayerIdentity","career-mode-connected-account-state-change":"CareerModeSparkConnectedAccount","career-mode-shared-history-convergence-state-change":"CareerModeProductionSharedHistoryConvergence","career-mode-shared-terminal-close-state-change":"CareerModeProductionSharedTerminalClose","career-mode-career-start-change":"CareerModeCareerStartMarker"};
        for(const [event,provider] of Object.entries(events)){
          const signature=value=>JSON.stringify([context(),value?.phase??null,value?.status??null,value?.acceptedRevisionKey?value.throughSeason??null:null,value?.acceptedRevisionKey??null]);
          let last=signature(state(provider));
          root.addEventListener?.(event,change=>{
            const next=signature(change?.detail??state(provider));if(next===last)return;last=next;
            for(const screen of Object.keys(APP))if(screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
          });
        }
      }
      return api;
    })().catch(error=>{registration=null;throw error;});
    return registration;
  }
  // One provider-backed completed-Showdown career model for every online career screen (History here,
  // Career Statistics and Trophy Room, and the Standings Career view). Same exact gets and services as
  // before; the last result is kept in memory for the current account, manager and pair only.
  // careerLoadSequence orders overlapping loads: only the newest started load may publish the shared cache.
  let careerCache=null,careerLoadSequence=0;
  // Career start marker (js/careerStartMarker.js, lazily loaded; one exact get per account per page load once it exists).
  // r80 (Nik 2026-10-19: test runs never count anywhere, a real game is never hidden): with a marker, the Showdowns it
  // names are hidden, except a Showdown finished on r79 or later (Nik 2026-10-19 20:35 UTC: show r79 onward, #941 reverted;
  // careerHiddenRivalryIds in js/careerStartMarker.js, fail-closed); every later one is
  // real (both START paths write the marker before the Showdown enters the index). Without a marker every Showdown in the
  // index is a test run (a real one cannot exist yet), so nothing is shown; "no marker" is asked again at each load, so a
  // real career started on another browser shows here. A marker that cannot be read hides everything (fail-closed); the
  // screens reload once a read answers (career-mode-career-start-change).
  async function rlCareerScope(services,getDoc,user){
    await load("career-start-marker","js/careerStartMarker.js","CareerModeCareerStartMarker");
    const marker=root.CareerModeCareerStartMarker;
    if(typeof marker?.readMarker!=="function")throw new Error("CAREER_START_UNAVAILABLE");
    const value=await marker.readMarker({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid,recheckNone:true});
    if(value?.status==="ready")return {testOnly:false,hidden:typeof marker.careerHiddenRivalryIds==="function"?await marker.careerHiddenRivalryIds({marker:value,firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid}):marker.hiddenRivalryIds(value)};
    if(value?.status==="none")return {testOnly:true,hidden:[]};
    throw new Error("CAREER_START_UNKNOWN");
  }
  // Rivalry Statistics shows a just-finished Showdown from live state. A hidden or test one (or one whose account cannot be
  // checked) must not show; the career model below then decides.
  async function rlCurrentHidden(rivalryId){
    try{
      const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
      if(typeof rivalryId!=="string"||!account?.connected||!runtime)return false;
      const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
      if(!services?.ok||!user||user.uid!==account.accountId)return false;
      const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
      const scope=await rlCareerScope(services,sdk.getDoc,user);
      return scope.testOnly||scope.hidden.includes(rivalryId);
    }catch(_){return true;}
  }
  async function rlLoadCareerModel(canPublish=()=>true,rivalry=false,onProgress=null){
    const key=context(),sequence=++careerLoadSequence;
    await modelDependencies();
    const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
    const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
    let model,rivalryModel;
    if(!account?.connected||!runtime)model=UNAVAILABLE;
    else{
      const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
      if(!services?.ok||!user||user.uid!==account.accountId)model=UNAVAILABLE;
      else{
        // Reuse the configured SDK host and memory-only services. This only adds an exact-get
        // function to the reader argument; it changes no auth scope, provider setting or Rules.
        const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
        let scope=null;try{scope=await rlCareerScope(services,sdk.getDoc,user);}catch(_){scope=null;}
        if(!scope){model=UNAVAILABLE;rivalryModel=UNAVAILABLE;}
        else{
          const hidden=scope.hidden;
          const result=await root.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc,setDoc:sdk.setDoc},user,current:active.careerInput,...(typeof onProgress==="function"?{onProgress}:{}),...(scope.testOnly?{testRunsOnly:true}:hidden.length?{hiddenRivalryIds:hidden}:{})},()=>canPublish()&&context()===key);
          model=result.model??UNAVAILABLE;
          if(rivalry){
            // Career order is oldest first. Rebuild the latest verified completed entry,
            // never mix whole-career manager counters into one rivalry's figures.
            const input=result.careerInput,entry=input?.showdowns?.filter(item=>item.classification!=="abandoned").at(-1);
            rivalryModel=input?.indexStatus==="ready"?(entry?.classification==="completed"?root.CareerModeSharedCareerAnalytics.buildCareerModel({indexStatus:"ready",showdowns:[entry]}):entry?.classification==="unavailable"?UNAVAILABLE:{status:"empty"}):UNAVAILABLE;
          }
        }
      }
    }
    if(canPublish()&&context()===key&&sequence===careerLoadSequence){careerCache={key,model};if(typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("career-mode-online-career-model-change"));}
    return rivalry?rivalryModel??UNAVAILABLE:model;
  }
  const rlCachedCareerModel=()=>careerCache&&careerCache.key===context()?careerCache.model:null;
  const rlOwner=key=>{try{return JSON.stringify(JSON.parse(key).slice(0,2));}catch(_){return null;}};
  function refresh(screen,event=false){
    const key=context(),reload=reloads[screen]??(reloads[screen]={flight:null,timer:null,dirty:false,lastStarted:-Infinity});
    const supplied=getters[screen]?.();
    if(supplied!=null){screens().invalidate(APP[screen]);return screens().show(APP[screen]);}
    // Never retain another account's frame while its old request finishes. r82 (Nik: Legacy panels show, vanish, then
    // load again): the same account and manager keep their frame while the pair or marker settles; the reload replaces it.
    if(sourceKeys[screen]!==key){
      const sameOwner=sourceKeys[screen]!=null&&rlOwner(sourceKeys[screen])===rlOwner(key);
      sourceKeys[screen]=key;
      if(!sameOwner){
        sources[screen]=LOADING;
        if(reload.flight||event&&Date.now()-reload.lastStarted<RELOAD_INTERVAL)void screens().show(APP[screen]).catch(report);
      }
    }
    if(reload.flight){/* a flight the screen left cannot publish; reopening schedules a fresh load after it drains */if(event||reload.flight.key!==key||reload.flight.left)reload.dirty=true;return reload.flight.promise;}
    const delay=RELOAD_INTERVAL-(Date.now()-reload.lastStarted);
    if(event&&delay>0){reload.dirty=true;scheduleReload(screen,reload,delay);return Promise.resolve(false);}
    if(reload.timer!==null){root.clearTimeout(reload.timer);reload.timer=null;}
    reload.dirty=false;reload.lastStarted=Date.now();
    // r83: opening the screen again retries an earlier "unavailable" read, so it shows loading, not the old card first.
    if(!event&&sources[screen]===UNAVAILABLE)sources[screen]=LOADING;
    const flight={key,alive:true,promise:null};reload.flight=flight;
    flight.promise=(async()=>{
      let timeout,fail;
      // r86 (Sol S61-r85-04): an inactivity deadline, not a flat cut. Each Showdown read restarts the 15 s, so a long cold
      // career keeps loading while records arrive; first-entry History says how far it got (never partial totals).
      const arm=()=>{root.clearTimeout(timeout);timeout=root.setTimeout(()=>{flight.alive=false;fail(new Error("RIVALRY_LEGACY_LOAD_TIMEOUT"));},LOAD_TIMEOUT);};
      const progress=({done,total}={})=>{
        if(!flight.alive||flight.left||context()!==key)return;arm();
        if(screen==="legacy"&&sources[screen]===LOADING&&Number.isInteger(done)&&Number.isInteger(total)&&total>0)rlShowProgress(screen,done,total);
      };
      try{
        // Only first entry shows LOADING. Reloads leave the last ready/partial/error frame visible.
        await screens().show(APP[screen]);
        const deadline=new Promise((_,reject)=>{fail=reject;arm();});
        const loading=(async()=>{
          if(screen==="rivalryStatistics"){
            await modelDependencies();
            const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
            if(["none","abandoned","completed"].includes(active.classification)&&(active.rivalry.status!=="ready"||await rlCurrentHidden(active.careerInput?.showdowns?.[0]?.rivalryId)))return rlLoadCareerModel(()=>flight.alive&&!flight.left,true,progress);
            return {...active.rivalry,lifecycle:active.classification};
          }
          return rlLoadCareerModel(()=>flight.alive&&!flight.left,false,progress);
        })();
        const model=await Promise.race([loading,deadline]);
        if(context()!==key||flight.left)return false;
        // r82 (Codex JOB-B B3/B6): a reload that returns the same career keeps the frame already shown (no second boot).
        const shown=sources[screen];if(shown&&shown!==LOADING&&shown!==UNAVAILABLE&&model&&JSON.stringify(shown)===JSON.stringify(model))return true;
        sources[screen]=model;return await screens().show(APP[screen]);
      }catch(error){if(context()!==key||flight.left)return false;sources[screen]=UNAVAILABLE;await screens().show(APP[screen]);report(error);return false;}
      finally{
        flight.alive=false;root.clearTimeout(timeout);reload.flight=null;
        if(reload.dirty)scheduleReload(screen,reload,Math.max(0,RELOAD_INTERVAL-(Date.now()-reload.lastStarted)));
      }
    })();
    return flight.promise;
  }
  // Writes only the loading banner's text in place (no new frame, no remount, so nothing flashes).
  function rlShowProgress(screen,done,total){
    try{
      const copy=root.document?.getElementById?.(APP[screen])?.querySelector?.("#legacyStateBanner")?.querySelector?.(".legacyStateCopy");
      if(copy)copy.textContent=`Loading your Showdown history… ${Math.min(done,total)} of ${total}`;
    }catch(_){}
  }
  function scheduleReload(screen,reload,delay){
    if(reload.timer!==null)return;
    reload.timer=root.setTimeout(()=>{
      reload.timer=null;const dirty=reload.dirty;reload.dirty=false;
      if(dirty&&screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
    },delay);
  }
  function wrap(screen){
    const name=screen==="legacy"?"renderLegacy":"renderRivalryStatistics",original=root[name];
    if(typeof original!=="function"||original.rivalryLegacyV10)return;
    const wrapped=function(request=false){const result=original(request);const host=root.document.getElementById(APP[screen]);if(host?.dataset.rivalryLegacyV10==="1"){screens().invalidate(APP[screen]);void refresh(screen).catch(report);}return result;};
    wrapped.rivalryLegacyV10=true;root[name]=wrapped;
  }
  async function rlMount(screen,getModel){
    if(!Object.hasOwn(APP,screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
    getters[screen]=getModel;
    const api=await registerRivalryLegacy();wrap(screen);
    return refresh(screen);
  }

  const RUNTIME_FILES=["visual-assets/v10_1/legacy/legacy.css", "visual-assets/v10_1/legacy/legacy.js", "visual-assets/v10_1/legacy/strings.json", "visual-assets/v10_1/legacy/assets/platemap.json", "visual-assets/v10_1/plates-v2/ENV_LEGACY_PHONE_V2.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/TITLE_LG_V1.webp", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js", "visual-assets/v10_1/rivalry-statistics/strings.json", "visual-assets/v10_1/rivalry-statistics/assets/platemap.json", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js", "css/rivalryLegacyV10.css"];
  return rlFreeze({toV10Frame:rlToV10Frame,mount:rlMount,markup,loadCareerModel:rlLoadCareerModel,cachedCareerModel:rlCachedCareerModel,RUNTIME_FILES});
});


```

## FILE: js/careerScreensV10.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreensV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-13 (G-13 part 1): lazy binder for Team V's Career Statistics and Trophy Room screens
  // (visual-assets/v10_1, pinned f4da9a3f). It reads the real career model only, through the
  // careerScreenSeam status, and maps it to the frame shape Team V's renderers read. No writes.
  const v10Node=typeof module!=="undefined"&&module.exports;
  const v10Seam=()=>v10Node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  const BASE="visual-assets/v10_1/";
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const NAMES=Object.freeze({daniel:"Daniel",nik:"Nik"});
  const SCREEN_IDS=Object.freeze({careerStatistics:"careerStatistics",trophyRoom:"trophyRoom"});
  // Team V copy for the same states (their screen strings at f4da9a3f), without the preview chip label.
  const STRINGS=Object.freeze({
    careerStatistics:{heading:"CAREER STATISTICS",previewLabel:"",buttons:{rivalry:"CURRENT RIVALRY STATISTICS",trophyRoom:"OPEN TROPHY ROOM",back:"BACK TO HOME"},sections:{careerTable:"CAREER TABLE",managerComparison:"MANAGER COMPARISON",careerLeaders:"CAREER LEADERS"},headlineLabels:["COMPLETED SHOWDOWNS","SEASONS PLAYED","CAREER POINTS","TROPHIES WON"],comparisonRows:["LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE WINS","EUROPA LEAGUE WINS","Season Wins","Average League Points","Average League Goals"],leaderLabels:["MOST SEASON WINS","MOST TROPHIES","MOST CAREER POINTS","BEST SEASON SCORE"],careerTableHeaders:["#","Manager","Showdowns","Season W-D-L","Points","Trophies"],goldenShowdown:"GOLDEN SHOWDOWN",noCompletedRecord:"No completed record yet",coverageTemplate:"{READABLE} of {INDEXED} Showdowns readable",stateCopy:{loading:{heading:"LOADING CAREER HISTORY",body:"Loading career history…"},partial:{heading:"PARTIAL CAREER HISTORY",body:"Some Showdowns could not be read. Statistics below use readable Showdowns only."},unavailable:{heading:"CAREER HISTORY UNAVAILABLE",body:"Career history could not be loaded. No statistics are being shown."}}},
    trophyRoom:{heading:"TROPHY ROOM",back:"BACK",previewLabel:"",managerCabinetsHeading:"MANAGER CABINETS",careerTableHeading:"CAREER TABLE",recordsReadyHeading:"ALL-TIME RECORDS",categories:["ALL","SHOWDOWN","LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE","EUROPA LEAGUE"],trophyTypes:{showdown:"Showdown Champion",goldenShowdown:"Golden Showdown",leagueTitles:"League Title",domesticCups:"Domestic Cup",championsLeague:"Champions League",europaLeague:"Europa League"},notWonYet:"Not won yet",stateCopy:{loading:{text:"Loading career history…"},partial:{text:"Some Showdowns could not be read. Showing {READABLE} of {INDEXED} Showdowns."},partialRecordsHeading:{text:"AVAILABLE RECORDS"},unavailable:{text:"Career history is unavailable right now."}}}
  });
  const CS_FIELDS=["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","bestSeasonScore","averageLeaguePoints","averageLeagueGoals"];
  const SHOWDOWN_FIELDS=["completed","wins","draws","losses"];
  const CABINET_FIELDS=["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"];

  function v10Freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(v10Freeze);Object.freeze(value);}return value;}
  const v10Finite=value=>typeof value==="number"&&Number.isFinite(value);
  function v10Pick(record,fields){
    if(!record||typeof record!=="object")return null;
    const out={};
    for(const key of fields){if(!v10Finite(record[key]))return null;out[key]=record[key];}
    return out;
  }
  // Daniel first, Nik second, whoever leads. A level table ranks both first.
  function v10Ranks(standings){
    return MANAGERS.map(manager=>{
      const index=standings.findIndex(row=>row&&row.manager===manager);
      return {manager,rank:index<0?null:standings[index].level===true?1:index+1};
    });
  }
  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on 110 points, counted from the completed
  // rows this model already holds (the seam owns the rule). Only a career with one carries the field.
  function v10GoldenShowdowns(model,frame){
    const counts=v10Seam().goldenShowdownCounts(model.history&&model.history.showdowns);
    if(counts.daniel>0||counts.nik>0)frame.goldenShowdowns=counts;
  }
  // r86 Special Player chip (js/specialPlayerChip.js): the live Showdown's Special Players, else the most recently confirmed
  // Showdown's in this career. A career with no r86 Showdown carries no field (no chip).
  const v10Chip=()=>v10Node?require("./specialPlayerChip.js"):root.CareerModeSpecialPlayerChip;
  function v10SpecialPlayers(model,frame){
    let sp=null;try{sp=v10Chip()?.latest?.(model.history&&model.history.showdowns)??null;}catch(_){sp=null;}
    if(sp)frame.specialPlayers={daniel:sp.daniel,nik:sp.nik};
  }
  function v10CareerStatistics(model,status){
    const managers={},showdowns={};
    for(const manager of MANAGERS){
      // JOB-1028 (H1019-5): an abandoned-only career has no best season or averages yet; show 0 like the old Statistics screen.
      const csRecord=model.managers[manager]&&{...model.managers[manager]};
      if(csRecord)for(const key of ["bestSeasonScore","averageLeaguePoints","averageLeagueGoals"])if(csRecord[key]===null)csRecord[key]=0;
      managers[manager]=v10Pick(csRecord,CS_FIELDS);
      showdowns[manager]=v10Pick(model.managers[manager].showdowns,SHOWDOWN_FIELDS);
      if(!managers[manager]||!showdowns[manager])return null;
    }
    const ranks=v10Ranks(model.trophyRoom.standings);
    if(ranks.some(row=>row.rank===null))return null;
    const frame={status,managerOrder:MANAGERS.slice(),managers,showdowns,expectedCareerTableRows:ranks};
    if(status==="partial")frame.coverage={readable:model.coverage.readable,indexed:model.coverage.indexed};
    v10GoldenShowdowns(model,frame);v10SpecialPlayers(model,frame);
    return frame;
  }
  function v10TrophyRoom(model,status){
    const managers={},showdowns={},room=model.trophyRoom;
    for(const manager of MANAGERS){
      const cabinet=v10Pick(room.cabinet[manager],CABINET_FIELDS),career=v10Pick(model.managers[manager],["careerPoints","seasonWins"]),wins=model.managers[manager].showdowns&&model.managers[manager].showdowns.wins;
      if(!cabinet||!career||!v10Finite(wins))return null;
      managers[manager]={displayName:NAMES[manager],...cabinet,...career};
      showdowns[manager]={wins};
    }
    const ranks=v10Ranks(room.standings);
    if(ranks.some(row=>row.rank===null))return null;
    const standings=ranks.map(({manager,rank})=>({manager,careerPoints:managers[manager].careerPoints,seasonWins:managers[manager].seasonWins,rank:"#"+rank}));
    const records=room.records.filter(row=>v10Finite(row.value)).map(row=>({label:String(row.label).toUpperCase(),manager:row.manager,value:row.value}));
    const frame={status,activeCategory:"ALL",managerOrder:MANAGERS.slice(),managers,standings,records,showdowns};
    if(status==="partial")frame.coverage={readable:model.coverage.readable,indexed:model.coverage.indexed};
    v10GoldenShowdowns(model,frame);v10SpecialPlayers(model,frame);
    return frame;
  }
  // Pure: model + screen -> the frame Team V's renderer reads. loading and unavailable carry no numbers.
  function toV10Frame(model,screen){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const view=v10Seam().careerScreenView(screen,model);
    const bare=status=>{const frame={status,managerOrder:MANAGERS.slice()};if(screen==="trophyRoom")frame.activeCategory="ALL";return frame;};
    let frame=null;
    if(view.status==="ready"||view.status==="partial"){
      frame=screen==="careerStatistics"?v10CareerStatistics(model,view.status):v10TrophyRoom(model,view.status);
      if(!frame)frame=bare("unavailable");
    }else if(view.status==="empty"&&screen==="trophyRoom"){
      frame=v10TrophyRoom(model,"empty")||bare("empty");
      frame.records=[];
    }else frame=bare(view.status);
    if(view.interimLabel&&frame.status!=="unavailable")frame.previewLabel=view.interimLabel;
    return v10Freeze(frame);
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  // JOB-24: both screens are registered with the shared loader js/v10Screens.js, which loads the kit and
  // these files once, switches Team V's styles with the screen and mounts/unmounts on screen changes.
  // What the screens draw is unchanged.
  const FILES=Object.freeze({
    styles:["shared/showdown-tokens.css","shared/showdown-type.css","shared/showdown-ui.css","shared/stage.css","shared/motion.css"],
    scripts:[["career-v10-stage","shared/stage.js",()=>Boolean(root.ShowdownStage)],["career-v10-motion","shared/motion.js",()=>typeof root.sdEnter==="function"]],
    careerStatistics:{style:"career-statistics/career-statistics.css",script:["career-v10-career-statistics","career-statistics/career-statistics.js",()=>typeof root.ShowdownCareerStatisticsBoot==="function"],platemap:"career-statistics/assets/platemap.json"},
    trophyRoom:{style:"trophy-room/trophy-room.css",script:["career-v10-trophy-room","trophy-room/trophy-room.js",()=>typeof root.ShowdownTrophyRoomBoot==="function"],platemap:"trophy-room/assets/platemap.json"}
  });
  const getters={careerStatistics:null,trophyRoom:null};
  const platemaps={};
  // Online with no readable model: one fixed frame, drawn as Team V's unavailable state.
  const UNAVAILABLE=Object.freeze({careerScreenV10:"unavailable"});
  const LOADING=Object.freeze({status:"loading"});
  let registered=null,onlineLoading=false,onlineToken=0;
  const onlineLifetimes={careerStatistics:0,trophyRoom:0};
  const v10Screens=()=>root.CareerModeV10Screens;
  // The Special Player draw loads with the screen's own files (never rejects: a chip that cannot load is not drawn).
  function v10EnsureChip(){return Promise.resolve().then(()=>root.loadRuntimeScript("special-player-chip","js/specialPlayerChip.js",()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);}
  function v10Fail(error){if(typeof root.reportApplicationError==="function")root.reportApplicationError("Career screens could not load",error);}

  const TROPHY_SMALL_PHONE_CSS=String.raw`
/* JOB-1322: a single vertical 360x640 Trophy Room reading surface.
   Do not change Team V's frozen CSS or the 390x844 / desktop compositions. */
@media (max-width:374px) and (max-height:700px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:265px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:20px; height:215px}
  #trophyRoom .trophyPhoneHero--nik {top:18px; height:215px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:253px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 170px,#050607 285px);
  }
  #trophyRoom .trophyTitleBlock {top:12px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:122px; left:34%; width:32%; height:121px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 10px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:7px; padding:0 0 10px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:7px 8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,220px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:164px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:88px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.18;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none; 
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:7px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}`;

  const TROPHY_390_PHONE_CSS=String.raw`
/* JOB-1323: 390x844-class portrait phones use one document-level reading surface.
   All changes stay in the adapter; Team V's design CSS is frozen. */
@media (min-width:375px) and (max-width:414px) and (min-height:701px) and (max-height:900px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:295px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:22px; height:230px}
  #trophyRoom .trophyPhoneHero--nik {top:20px; height:230px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:280px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 185px,#050607 300px);
  }
  #trophyRoom .trophyTitleBlock {top:14px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:131px; left:34%; width:32%; height:130px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 12px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:0 0 12px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,230px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:184px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:92px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px; min-height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}
`;

  const TROPHY_430_PHONE_CSS=String.raw`
/* JOB-1324: 430x932-class portrait phones use one document-level reading surface.
   All changes stay in the adapter; Team V's design CSS is frozen. */
@media (min-width:415px) and (max-width:450px) and (min-height:901px) and (max-height:1000px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:320px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:22px; height:250px}
  #trophyRoom .trophyPhoneHero--nik {top:20px; height:250px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:300px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 200px,#050607 325px);
  }
  #trophyRoom .trophyTitleBlock {top:14px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:143px; left:34%; width:32%; height:140px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 12px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:0 0 12px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,250px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:194px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:102px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px; min-height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}
`;

  const TROPHY_844_LANDSCAPE_CSS=String.raw`
/* JOB-1325: short 844x390-class landscape phones get one vertical reading surface. */
@media (min-width:761px) and (max-width:900px) and (min-height:350px) and (max-height:430px) and (orientation:landscape) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    display:flex; flex-direction:column; align-items:stretch;
    box-sizing:border-box; height:auto!important; min-height:100dvh;
    overflow:visible!important;
    padding:64px max(16px,env(safe-area-inset-left)) calc(84px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-right));
    background:linear-gradient(180deg,rgba(2,3,4,.35),#050607 330px);
  }
  #trophyRoom .previewPill {position:relative; inset:auto; align-self:center; margin-bottom:8px}
  #trophyRoom .trophyTitleBlock {
    position:relative; inset:auto; width:min(100%,320px); height:auto;
    align-self:center; margin-bottom:12px;
  }
  #trophyRoom .trophyBrushTitle {width:100%; height:auto; flex:none}
  #trophyRoom .heroCeremony {
    position:relative; inset:auto; width:220px; height:160px;
    align-self:center; margin:0 0 16px; order:1;
  }
  #trophyRoom .heroPlinth {min-height:44px}
  #trophyRoom .careerRanks {
    position:relative; inset:auto; width:100%; height:auto; order:2;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px; margin:0 0 16px;
  }
  #trophyRoom .careerRank {
    position:relative; inset:auto; width:auto; min-width:0; height:auto;
    padding:10px; text-align:center;
  }
  #trophyRoom .careerRank small {white-space:normal; overflow-wrap:anywhere; line-height:1.3}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; width:100%; height:auto; min-height:0; order:3;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(6,minmax(0,1fr));
    gap:4px; margin-bottom:8px; overflow:visible;
  }
  #trophyRoom .trophyTab {
    min-width:0; min-height:44px; height:auto; padding:8px;
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; clip-path:none; overflow:visible; padding:12px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid; overflow:visible;
    grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,260px); justify-content:center;
  }
  #trophyRoom .trophyCard {height:auto; min-height:194px; overflow:visible; padding:8px}
  #trophyRoom .trophyCardPicture {height:102px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .recordRibbon {
    position:relative; inset:auto; height:auto; margin-top:12px;
    grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; overflow:visible;
  }
  #trophyRoom .recordRibbonHeading {grid-column:1/-1; min-height:36px; padding:8px}
  #trophyRoom .recordItem {min-width:0; min-height:60px; padding:8px}
  #trophyRoom .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
  #trophyRoom .stateNotice {
    position:relative; inset:auto; height:auto; min-height:44px;
    padding:8px; margin-bottom:12px; flex-wrap:wrap;
  }
  #trophyRoom .statePanel {position:relative; inset:auto; min-height:160px; padding:16px}
  #trophyRoom .fatalState {position:relative; inset:auto; padding:16px}
  #trophyRoom .trophyBack {
    position:fixed; left:calc(50% - 140px); right:auto;
    bottom:calc(16px + env(safe-area-inset-bottom)); width:280px;
    height:44px; min-height:44px; z-index:40;
  }
}
`;

  // JOB-1326: reuse the short-landscape layout only for 932x430-class phones.
  const TROPHY_932_LANDSCAPE_CSS=TROPHY_844_LANDSCAPE_CSS.replace(
    "(min-width:761px) and (max-width:900px) and (min-height:350px) and (max-height:430px)",
    "(min-width:901px) and (max-width:1000px) and (min-height:391px) and (max-height:470px)"
  );


  // JOB-1655: at these laptop, Chromebook and ultrawide sizes Team V's stage
  // keeps its own absolute layout, so the whole room including BACK stays in
  // one view and #trophyRoom is never a scroller (main is the only scroller).
  // Only the category tabs change: one ROW, 44px high. The first attempt
  // rebuilt the stage as a flow layout, and analytics.css's old
  // `.trophyShelf{display:grid}` then dropped the tabs into grid cells.
  const TROPHY_1280_LAPTOP_CSS=String.raw`
@media (min-width:1200px) and (max-width:1365px) and (min-height:600px) and (max-height:700px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
  #trophyRoom .careerRanks {top:48.5%}
}
`;

  const TROPHY_1366_CHROMEBOOK_CSS=String.raw`
@media (min-width:1366px) and (max-width:1440px) and (min-height:720px) and (max-height:820px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;

  // JOB-1330: full-HD desktop category targets are 35px high in Team V's
  // frozen sheet. Give the tabs a 44px hit area without covering the shelf,
  // and allow dynamic cabinet labels to wrap rather than overlap or clip.
  const TROPHY_1920_DESKTOP_CSS=String.raw`
@media (min-width:1880px) and (max-width:2000px) and (min-height:1000px) and (max-height:1160px) and (orientation:landscape) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {
    min-height:44px; padding:6px 8px; line-height:1.15;
    white-space:normal; overflow-wrap:anywhere;
  }
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.1;
  }
  #trophyRoom .managerCounts > div {min-width:0}
  #trophyRoom .managerCounts span {
    white-space:normal; overflow-wrap:anywhere; line-height:1.1;
  }
}
`;

  // JOB-1331: 2560x1080 ultrawide uses the same 44px tab row, in its own range.
  const TROPHY_2560_ULTRAWIDE_CSS=String.raw`
@media (min-width:2500px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;

  // JOB-1327: upright 768x1024 tablet keeps Team V's stage too; 44px tab row only.
  const TROPHY_768_TABLET_CSS=String.raw`
@media (min-width:761px) and (max-width:820px) and (min-height:960px) and (max-height:1100px) and (orientation:portrait) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;


  const TROPHY_SCREEN_1705_CSS=String.raw`
/* JOB-1705: approved NEXT_TROPHY_ROOM and picked-tab NEXT_TROPHY_ROOM_SINGLE.
   Study 1342 supplies portrait stacking; 1346 supplies the tablet ceremony rail.
   Study 1345 is not adopted: sideways composition stays live. Frozen artwork is read-only.
   Notes: picked desktop tab is one wide case, original 1536 trophy, name left/counts right.
   Baked marble, engraved emblems, room lighting and manager crops need Team V artwork. */
@media (min-width:0px) {
  html[data-v10-screen="trophyRoom"] #app > main {
    position:fixed; inset:0; z-index:30; padding:0; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior:contain; scrollbar-color:#ad8539 #050607;
  }
  #app #trophyRoom.careerScreenV10 {
    position:relative; inset:auto; width:100%; max-width:none; height:auto!important;
    max-height:none; min-height:100svh; margin:0; padding:0; contain:none; overflow:visible!important;
  }
  #app #trophyRoom .trophyRoomScene {
    height:100svh!important; min-height:100svh!important; overflow:visible!important;
    --sr-hero:0px;
  }
  #app #trophyRoom .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100svh!important; overflow:visible!important;
  }
  #app #trophyRoom .trophyRoomContent {overflow:visible!important}
  #app #trophyRoom :is(.trophyTab,.trophyBack) {touch-action:manipulation;clip-path:none}
  #app #trophyRoom :is(.trophyTab,.trophyBack):focus-visible,
  #app #trophyRoom .phoneMoreToggle:focus-visible ~ .trophyPhoneMoreButton {
    outline:3px solid #fff3bd; outline-offset:2px;
  }
  #app #trophyRoom :is(.trophyTab,.trophyBack):active:not(:disabled),
  #app #trophyRoom .phoneMoreToggle:active ~ .trophyPhoneMoreButton {filter:brightness(1.16)}
}
/* Touch portrait and sideways phones share these cabinet rules; the sideways block below re-seats the hero as a left rail.
   Normal entry fits the first view. Partial notices/details may expand main. */
@media (max-width:900px) and (orientation:portrait), (max-height:480px) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-hub:var(--sd-nav-bottom-space,56px);
    --tr-hero:clamp(128px,calc(36svh - 44px),240px);
    --tr-row:clamp(86px,calc((100svh - var(--tr-hero) - var(--tr-hub) - 190px)/2),170px);
  }
  #app #trophyRoom :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,
    .topbarReserve,.phoneNavReserve,.trophyPhoneNavReserve) {display:none!important}
  #app #trophyRoom .trophyPhoneArt {display:block;position:absolute;inset:0;bottom:auto;height:calc(var(--tr-hero) + 30px);overflow:hidden;pointer-events:none}
  #app #trophyRoom .trophyPhoneBackdrop {position:absolute;inset:0;display:block}
  #app #trophyRoom .trophyPhoneBackdrop img {width:100%;height:100%;object-fit:cover}
  #app #trophyRoom .trophyPhoneHero {
    display:block;position:absolute;top:44px;height:calc(var(--tr-hero) - 32px);
    width:48%;transform:none;filter:drop-shadow(0 6px 8px #000);
  }
  #app #trophyRoom .trophyPhoneHero--daniel {left:0;right:auto}
  #app #trophyRoom .trophyPhoneHero--nik {left:auto;right:0}
  #app #trophyRoom .trophyPhoneHero img {width:100%;height:100%;max-width:100%;object-fit:contain;object-position:center bottom}
  #app #trophyRoom .trophyPhoneArtShade {position:absolute;inset:0;background:linear-gradient(transparent 45%,#050607 100%)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    position:relative;display:flex;flex-direction:column;align-items:stretch;
    height:auto!important;min-height:100svh; padding:calc(var(--tr-hero) + 8px) 10px calc(var(--tr-hub) + 60px);
    background:linear-gradient(transparent 0 var(--tr-hero),#050607 calc(var(--tr-hero) + 40px));
  }
  #app #trophyRoom .trophyTitleBlock {position:absolute;inset:8px 15% auto;display:block;width:70%;height:auto;margin:0;text-align:center}
  #app #trophyRoom .trophyBrushTitle {width:100%;height:clamp(28px,5.6svh,42px);margin:2px 0;object-fit:contain}
  #app #trophyRoom .trophyEyebrow {font-size:8px;line-height:1.2;letter-spacing:.14em}
  #app #trophyRoom .trophyTagline {font-size:7px;line-height:1.2;letter-spacing:.12em}
  #app #trophyRoom .heroCeremony {position:absolute;inset:106px 33% auto;width:34%;height:calc(var(--tr-hero) - 106px);margin:0;display:block}
  #app #trophyRoom .heroTrophyPicture {left:15%;top:0;width:70%;height:calc(100% - 28px)}
  #app #trophyRoom .heroPlinth {left:0;right:0;bottom:0;height:28px;min-height:28px;clip-path:none;padding:3px 1px}
  #app #trophyRoom .heroPlinth span {font-size:9px;line-height:1.1;white-space:normal;overflow:visible;letter-spacing:.03em}
  #app #trophyRoom .heroPlinth small {font-size:6px;line-height:1.1;letter-spacing:.06em}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:4px;border:1px solid #d5ac52;background:#050607d9;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;width:100%;height:auto;min-height:94px;margin:0 0 5px;padding:2px;border:1px solid #967734;background:#080908;overflow:visible;scroll-snap-type:none}
  #app #trophyRoom .trophyTab {grid-column:span 2;width:auto;min-width:0;min-height:44px;height:auto;padding:3px 2px;border:1px solid #836a36;border-radius:0;font-size:9px;line-height:1.2;letter-spacing:.025em;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:span 2}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;display:block;min-height:0;padding:0;border:0;clip-path:none;overflow:visible;background:none}
  #app #trophyRoom .trophyGrid,
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(var(--tr-row),auto);gap:5px;padding:0;overflow:visible;scroll-snap-type:none}
  /* r80 Europa League: five cases, three across and the last two centred under them (two rows, as with four cases). */
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(6,minmax(0,1fr))}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard {grid-column:span 2}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:2 / span 2}
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:minmax(calc(2 * var(--tr-row) + 5px),auto)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:max(18px,calc(2 * var(--tr-row) - 64px))}
  #app #trophyRoom .trophyCard {display:grid;grid-template-rows:minmax(18px,1fr) auto auto auto;flex:none;width:auto;min-width:0;min-height:0;height:auto;padding:3px 4px;border:1px solid #b4903d;background:radial-gradient(ellipse at 50% 10%,#9c743b4d,transparent 60%),linear-gradient(135deg,#31281a,#080908 45%);overflow:visible}
  #app #trophyRoom .trophyCardPicture {width:100%;height:max(18px,calc(var(--tr-row) - 64px));min-height:18px;align-self:stretch}
  #app #trophyRoom .trophyCard h3 {min-height:16px;line-height:1.25;margin:1px 0 2px;padding:1px 0;font-size:10px;letter-spacing:.02em;white-space:normal;overflow-wrap:normal;border-bottom:1px solid #79612e}
  #app #trophyRoom .managerCounts {min-height:26px;gap:4px;align-items:center}
  #app #trophyRoom .managerCounts > div {min-width:0;text-align:center}
  #app #trophyRoom .managerCounts > div + div {border-left:1px solid #65532a}
  #app #trophyRoom .managerCounts span {font-size:8px;line-height:1.2;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .managerCounts strong {font-size:13px;line-height:1.1}
  #app #trophyRoom .notWonYet {position:relative;inset:auto;min-height:10px;margin:2px 0 0;font-size:7px;line-height:1.2;letter-spacing:.04em}
  #app #trophyRoom .careerRanks,
  #app #trophyRoom .recordRibbon {display:none;position:relative;inset:auto;width:auto;height:auto;visibility:visible}
  #app #trophyRoom .trophyBack {display:flex;align-items:center;justify-content:center;color:#f4d485;font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);letter-spacing:.12em;position:fixed;left:10px;right:96px;bottom:calc(var(--tr-hub) + 8px);width:auto;height:44px;min-height:44px;margin:0;border:1px solid #d6b054;background:linear-gradient(#171710,#050607)}
  #app #trophyRoom .trophyPhoneMoreButton {display:flex;position:fixed;right:10px;bottom:calc(var(--tr-hub) + 8px);width:78px;height:44px;align-items:center;justify-content:center;border:1px solid #d6b054;background:linear-gradient(#171710,#050607);color:#f4d485;font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);letter-spacing:.12em;text-transform:uppercase;pointer-events:auto;z-index:43}
  #app #trophyRoom .phoneMoreToggle {display:block;position:fixed!important;right:10px!important;bottom:calc(var(--tr-hub) + 8px)!important;width:78px!important;height:44px!important;margin:0!important;opacity:0!important;clip:auto!important;clip-path:none!important;pointer-events:auto!important;z-index:42!important}
  #app #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {display:block!important;position:absolute;inset:calc(var(--tr-hero) + 8px) 18px auto;height:52px;padding:8px;background:none;border:0;transform:none;pointer-events:none;z-index:20}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {width:auto;max-width:none;max-height:none;bottom:auto;opacity:1;visibility:visible;clip-path:none;box-shadow:none}
  #app #trophyRoom .trophyPhoneMoreClose {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton .trophyPhoneMoreOpen {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton .trophyPhoneMoreClose {display:inline}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton {background:linear-gradient(#e8c96d,#c99839);color:#111}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {visibility:visible}
  #app #trophyRoom .trophyPhoneSheetTitle {display:block;font-size:15px}
  #app #trophyRoom .trophyPhoneSheetHint {display:block;font-size:9px;color:#baae90}
  #app #trophyRoom .trophyPhoneSheetClose {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {display:grid;order:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:56px 0 8px;pointer-events:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {position:relative;inset:auto!important;width:auto;min-width:0;height:auto;min-height:90px;padding:10px 5px;text-align:center;border:1px solid #8b713c}
  #app #trophyRoom .careerRank small {font-size:8px;line-height:1.3;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent :is(.trophyTabs,.trophyGrid) {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {display:grid;position:relative;inset:auto;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:8px;overflow:visible;visibility:visible}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {grid-column:1/-1;min-height:28px;padding:4px;font-size:11px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {min-width:0;min-height:54px;padding:6px}
  #app #trophyRoom .recordItem small {white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;font-size:9px;line-height:1.2}
  #app #trophyRoom :is(.stateNotice,.statePanel,.fatalState) {position:relative;inset:auto;width:auto;height:auto;min-height:44px;margin:0 0 8px;padding:10px;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .stateNotice {flex-wrap:wrap;gap:6px;font-size:10px;text-align:center}
  #app #trophyRoom .statePanel {min-height:calc(2 * var(--tr-row) - 4px)}
}
/* Sideways phones (study 1345 not adopted, so no new composition): the live parts keep their order, with the
   managers and champion trophy as a left rail and the tabs, cabinet and BACK/MORE in a right column. */
@media (max-height:480px) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-lcol:clamp(220px,34vw,320px);
    --tr-hero:calc(100svh - var(--tr-hub) - 10px);
    --tr-row:clamp(104px,calc(100svh - var(--tr-hub) - 134px),230px);
  }
  #app #trophyRoom .trophyPhoneArt {inset:0 0 auto 0;height:calc(100svh - var(--tr-hub))}
  #app #trophyRoom .trophyPhoneHero {top:50px;height:calc(var(--tr-hero) - 56px);width:calc(var(--tr-lcol) * .52)}
  #app #trophyRoom .trophyPhoneHero--daniel {left:calc(var(--tr-lcol) * -.07);right:auto}
  #app #trophyRoom .trophyPhoneHero--nik {left:calc(var(--tr-lcol) * .55);right:auto}
  #app #trophyRoom .trophyPhoneArtShade {background:linear-gradient(90deg,transparent calc(var(--tr-lcol) * .92),#050607f2 calc(var(--tr-lcol) * 1.12)),linear-gradient(transparent 70%,#050607)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    display:block;min-height:100svh;background:none;
    padding:8px 54px calc(var(--tr-hub) + 60px) calc(var(--tr-lcol) + 10px);
  }
  #app #trophyRoom .trophyTitleBlock {inset:6px auto auto 0;width:var(--tr-lcol)}
  #app #trophyRoom .heroCeremony {inset:calc(var(--tr-hero) * .42) auto auto calc(var(--tr-lcol) * .29);width:calc(var(--tr-lcol) * .42);height:calc(var(--tr-hero) * .54)}
  #app #trophyRoom .trophyTabs {grid-template-columns:repeat(6,minmax(0,1fr));min-height:48px;margin-bottom:4px}
  #app #trophyRoom .trophyTab,
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:auto;font-size:9px;padding:2px 3px}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(5,minmax(0,1fr))}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard,
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:auto}
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:minmax(var(--tr-row),auto)}
  #app #trophyRoom .trophyCardPicture,
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:max(18px,calc(var(--tr-row) - 76px))}
  #app #trophyRoom .trophyBack {left:calc(var(--tr-lcol) + 10px);right:142px;bottom:calc(var(--tr-hub) + 6px)}
  #app #trophyRoom .trophyPhoneMoreButton {right:54px;bottom:calc(var(--tr-hub) + 6px)}
  #app #trophyRoom .phoneMoreToggle {right:54px!important;bottom:calc(var(--tr-hub) + 6px)!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {inset:8px 54px auto calc(var(--tr-lcol) + 10px);height:40px;padding:4px 0}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {margin:40px 0 6px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {min-height:64px;padding:6px 5px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:6px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {min-height:46px;padding:4px 6px}
  #app #trophyRoom .stateNotice {min-height:36px;padding:4px 8px;margin-bottom:4px;gap:0 8px;font-size:10px;line-height:1.2}
  #app #trophyRoom .statePanel {min-height:calc(var(--tr-row) - 10px)}
}
@media (min-width:761px) and (max-width:900px) and (orientation:portrait) {
  #app #trophyRoom {--tr-hero:0px;--tr-row:clamp(210px,calc((75svh - var(--tr-hub) - 234px)/2),330px)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {padding:25svh 20px calc(var(--tr-hub) + 88px) 35%;background:linear-gradient(transparent,#050607cc 50%,#050607)}
  #app #trophyRoom .trophyPhoneArt {height:calc(100svh - var(--tr-hub));overflow:hidden}
  #app #trophyRoom .trophyPhoneHero {top:14svh;height:28svh;width:22%}
  #app #trophyRoom .trophyPhoneHero--daniel {left:0}
  #app #trophyRoom .trophyPhoneHero--nik {left:14%;right:auto}
  #app #trophyRoom .trophyTitleBlock {top:3svh;left:14%;right:auto;width:72%}
  #app #trophyRoom .trophyBrushTitle {height:clamp(60px,8svh,90px)}
  #app #trophyRoom .trophyEyebrow {font-size:12px;letter-spacing:.22em}
  #app #trophyRoom .trophyTagline {font-size:10px}
  #app #trophyRoom .heroCeremony {top:43svh;left:3%;width:29%;height:clamp(220px,31svh,380px)}
  #app #trophyRoom .heroTrophyPicture {left:4%;width:92%;height:calc(100% - 52px)}
  #app #trophyRoom .heroPlinth {height:52px;min-height:52px;padding:8px 2px}
  #app #trophyRoom .heroPlinth span {font-size:12px}
  #app #trophyRoom .heroPlinth small {font-size:8px}
  #app #trophyRoom .trophyShelf {padding:8px}
  #app #trophyRoom .trophyTabs {gap:4px;padding:4px;margin-bottom:10px;min-height:100px}
  #app #trophyRoom .trophyTab {font-size:12px}
  #app #trophyRoom .trophyGrid {gap:10px}
  #app #trophyRoom .trophyCard {padding:8px}
  #app #trophyRoom .trophyCardPicture {height:calc(var(--tr-row) - 108px)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:calc(2 * var(--tr-row) - 108px)}
  #app #trophyRoom .trophyCard h3 {min-height:28px;font-size:14px}
  #app #trophyRoom .managerCounts {min-height:44px}
  #app #trophyRoom .managerCounts span {font-size:12px}
  #app #trophyRoom .managerCounts strong {font-size:21px}
  #app #trophyRoom .notWonYet {min-height:16px;font-size:10px}
  #app #trophyRoom .trophyBack {left:35%;right:116px;bottom:calc(var(--tr-hub) + 20px);height:56px;font-size:18px}
  #app #trophyRoom .trophyPhoneMoreButton {right:20px;bottom:calc(var(--tr-hub) + 20px);width:84px;height:56px;font-size:13px}
  #app #trophyRoom .phoneMoreToggle {right:20px!important;bottom:calc(var(--tr-hub) + 20px)!important;width:84px!important;height:56px!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {top:25svh;left:calc(35% + 16px);right:28px;height:60px}
  #app #trophyRoom .trophyPhoneSheetTitle {font-size:22px}
  #app #trophyRoom .trophyPhoneSheetHint {font-size:12px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {margin-top:72px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {min-height:130px;padding:18px 8px}
  #app #trophyRoom .careerRank small {font-size:10px}
}
@media (min-width:901px) and (min-height:481px) {
  #app #trophyRoom {--tr-case:clamp(90px,calc(14svh - 2px),160px)}
  #app #trophyRoom .trophyPhoneArt {display:none!important}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {display:flex;flex-direction:column;height:auto!important;min-height:100svh;padding:calc(62svh - 20px) 8% 14px;background:none}
  #app #trophyRoom .trophyTitleBlock {position:absolute;top:9svh;left:34%;width:32%;height:16svh;margin:0}
  #app #trophyRoom .heroCeremony {position:absolute;top:26svh;left:36.3%;width:27.4%;height:calc(36svh - 62px);margin:0}
  #app #trophyRoom .heroPlinth {clip-path:none;border-color:#d5ac52}
  /* r80: the rank cards stand on a line 6px above the tab row and grow upward when their line wraps; they used to hang from
     the top and slid 5-6px under the tabs on short windows (1280x650, 1024x768). */
  #app #trophyRoom .careerRanks {position:absolute;inset:auto 12% auto;top:calc(62svh - 92px);height:66px;display:block}
  #app #trophyRoom .careerRank {top:auto;bottom:0;min-width:0;width:18%;min-height:66px}
  #app #trophyRoom .careerRank small {font-size:clamp(8px,.52vw,11px);line-height:1.25;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:0;background:none;border:0;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;width:100%;height:auto;min-height:44px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;overflow:visible}
  #app #trophyRoom .trophyTab {height:auto;min-height:44px;padding:6px 8px;font-size:clamp(10px,.66vw,14px);line-height:1.2;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;padding:5px;clip-path:none;overflow:visible;border-color:#d5ac52;box-shadow:inset 0 0 0 2px #080909,0 10px 30px #0008}
  #app #trophyRoom .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:minmax(clamp(90px,14svh,160px),auto);gap:8px;overflow:visible}
  #app #trophyRoom .trophyCard {display:grid;grid-template-rows:minmax(24px,1fr) auto auto auto;min-height:0;height:auto;padding:4px 8px;border:1px solid #a9873b;overflow:visible;background:radial-gradient(ellipse at 50% 10%,#96743944,transparent 65%),linear-gradient(#28221988,#080909)}
  #app #trophyRoom .trophyCardPicture {width:100%;height:max(24px,calc(clamp(90px,14svh,160px) - 60px));min-height:24px}
  #app #trophyRoom .trophyCard h3 {margin:2px 0 4px;min-height:14px;font-size:clamp(11px,.72vw,16px);line-height:1.2;white-space:normal;overflow-wrap:normal;letter-spacing:.06em}
  #app #trophyRoom .managerCounts > div {min-width:0}
  #app #trophyRoom .managerCounts span {font-size:clamp(8px,.47vw,11px);line-height:1.15;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .managerCounts strong {font-size:clamp(15px,1.15vw,25px);line-height:1.1}
  #app #trophyRoom .notWonYet {position:relative;inset:auto;margin:2px 0 0;min-height:10px;font-size:clamp(8px,.55vw,12px);line-height:1.15;letter-spacing:.04em}
  #app #trophyRoom .recordRibbon {position:relative;inset:auto;height:auto;min-height:44px;grid-template-columns:minmax(90px,.6fr) repeat(5,minmax(0,1fr));margin-top:5px;overflow:visible}
  #app #trophyRoom .recordRibbonHeading {font-size:clamp(9px,.58vw,13px);line-height:1.2;padding:5px 7px}
  #app #trophyRoom .recordItem {padding:5px 7px;row-gap:3px}
  #app #trophyRoom .recordItem small {font-size:clamp(9px,.62vw,14px);line-height:1.2;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal}
  #app #trophyRoom :is(.stateNotice,.statePanel,.fatalState) {position:relative;inset:auto;height:auto;min-height:44px;padding:12px;margin:0 0 6px}
  #app #trophyRoom .stateNotice {flex-wrap:wrap;gap:8px;font-size:12px;text-align:center}
  #app #trophyRoom .statePanel {min-height:16svh}
  #app #trophyRoom .trophyBack {position:sticky;inset:auto;bottom:12px;align-self:center;width:21%;min-width:180px;min-height:44px;height:clamp(44px,4.8svh,56px);margin:12px 0 0;border:2px solid #d6b054;border-radius:4px;background:linear-gradient(#252218,#050607);box-shadow:inset 0 0 0 2px #080909,0 0 12px #c5952733}
  /* Picked category: same live article and counts; CSS areas preserve DOM/tap order. */
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:var(--tr-case)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCard {height:var(--tr-case);min-height:0;overflow:hidden;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"name art counts" "empty art counts";column-gap:16px;padding:6px 4%;align-items:center}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {grid-area:art;position:relative;align-self:stretch;height:100%;min-height:0;overflow:hidden;background-position:center;background-size:contain;background-repeat:no-repeat}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture img {position:absolute;inset:0;width:100%;height:100%;object-fit:contain;visibility:hidden}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="showdown"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="leagueTitles"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="domesticCups"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_DOMESTIC_CUP_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="championsLeague"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="europaLeague"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCard h3 {grid-area:name;margin:0;padding:12px 0;border-block:1px solid #a9873b;font-size:clamp(18px,1.5vw,34px);text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts {grid-area:counts;gap:12px;width:100%}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div {text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div + div {border-left:1px solid #a9873b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts span {font-size:clamp(12px,.9vw,20px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts strong {font-size:clamp(28px,3vw,64px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .notWonYet {grid-area:empty;margin:0;padding:4px 0;text-align:center}
}
/* r80 short screens: on 600px-tall desktop windows (1100x600, 1024x600) the cabinet ran 5px under the docked BACK. There
   BACK joins the flow under the cabinet, so it never sits on the shelf; main scrolls the few pixels to reach it. */
@media (min-width:901px) and (min-height:481px) and (max-height:630px) {
  #app #trophyRoom .trophyBack {position:relative;bottom:auto}
}
/* r78 HO-031 v3 phone marble: upright phones up to 400px wide draw Team V's ENV_TROPHY_ROOM_PHONE_V3 (both managers
   painted in, set wider apart and a little smaller so the faces sit between the title and the shelf) in place of the old
   phone backdrop and the two cut-outs (their picture sources only match the other phone and tablet sizes). The plate
   covers the whole screen from the top behind the unchanged layout (title, champion trophy, tabs, cabinet, BACK and
   MORE stay where they were). No dark shade or grade over the men. Wider upright screens and sideways phones keep the
   old art: there the shelf or the title would sit on the faces. */
@media (max-width:400px) and (orientation:portrait) {
  #app #trophyRoom .trophyPhoneArt {inset:0;height:100svh}
  #app #trophyRoom .trophyPhoneBackdrop {inset:0;overflow:hidden}
  #app #trophyRoom .trophyPhoneBackdrop img {position:absolute;left:50%;top:0;width:max(100vw,calc(100svh * 1179 / 2096));height:auto;max-width:none;transform:translateX(-50%);object-fit:fill}
  #app #trophyRoom :is(.trophyPhoneHero,.trophyPhoneArtShade) {display:none}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {background:none}
}
`;

  // JOB-1706: Career Statistics phone, sideways and tablet adapter rules; the phone art also loads at sideways and tablet sizes.
  const CS_PHONE_ART_MEDIA="(max-width: 760px) and (orientation: portrait), (min-width: 640px) and (max-width: 880px) and (min-height: 340px) and (max-height: 410px) and (orientation: landscape), (min-width: 700px) and (max-width: 900px) and (min-height: 960px) and (max-height: 1240px) and (orientation: portrait)";
  const CAREER_STATS_1706_CSS=String.raw`
/* JOB-1706: Career Statistics at phone, sideways and tablet (adopted studies 1402, 1403, 1404 and PHONE_STATISTICS).
   Desktop (1200x700 and up, css/v10Shell.css) is untouched. Nothing scrolls: the stage fits the first view above the hub bar.
   Words, ids, numbers and tap order are the live ones; old desktop art is hidden by class, never by src. */
@media (max-width:760px) and (orientation:portrait) {
  /* The desktop arm cutout and rim layers were 540px wide on a 393px phone (they poked out on both sides). */
  #app #careerStatistics.careerScreenV10 :is(.sd-stage__layer--cutout,.sd-stage__layer--light) .sd-stage__registered { display:none; }
}
@media (max-width:760px) and (orientation:portrait) {
  /* A totals tile is 34px tall at 360x640 and 393x660, which cut the TOGETHER caption under the number; it now sits beside it. */
  #app #careerStatistics.careerScreenV10 .headlineCopy { display:grid;grid-template-columns:auto minmax(0,1fr);align-items:end;column-gap:5px; }
  #app #careerStatistics.careerScreenV10 .headlineCopy>:not(.headlineNumber,.headlineTogether) { grid-column:1/-1; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { padding-bottom:2px;white-space:nowrap; }
}
@media (max-width:760px) and (orientation:portrait) and (min-height:601px) {
  /* The hub starts higher (the managers' faces stay clear) so the six comparison rows and four leader cards are not cut. */
  #app #careerStatistics.careerScreenV10 .phoneHub { top:41%; }
  /* The partial-history banner sat on the totals; it now ends just above them (the banner is placed on the whole screen,
     the hub on the screen less the hub bar). */
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .41 - 27px); }
}
@media (max-width:760px) and (orientation:portrait) and (max-height:600px) {
  /* Short phones: without the rivalry button the two actions share one row, in tap order, and the hub takes the freed
     50px so the comparison rows and leader cards are not cut. */
  #app #careerStatistics.careerScreenV10 .actionRow:has(>#careerStatisticsRivalryButton.hidden) {
   height:46px;grid-template-columns:1.25fr 1fr;grid-template-rows:46px;grid-template-areas:"trophy back";
  }
  #app #careerStatistics.careerScreenV10 .careerScreen:has(.actionRow>#careerStatisticsRivalryButton.hidden) .phoneHub { bottom:58px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .42 - 39px); }
}
@media (max-width:760px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  /* Partial history: the base partial rules (top 43.25%, height 18.92%) left the table and comparison panels 21-60px tall inside the hub. */
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .contentGrid>:is(.careerTablePanel,.comparisonPanel) { top:auto;height:100%; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label:active { filter:brightness(1.2); }
  #app #careerStatistics.careerScreenV10 .actionButton:focus-visible { outline:3px solid #fff1b8; outline-offset:2px; }
  #app #careerStatistics.careerScreenV10 .actionButton:active { filter:brightness(.88); }
}
/* Sideways and tablet: the phone composition (phone background, Daniel left, Nik right) on the whole stage,
   with the hub bar kept clear at the bottom. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 { --cs-nav:calc(56px + env(safe-area-inset-bottom)); }
  #app #careerStatistics.careerScreenV10 :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light .sd-stage__registered,.armCutout,.armRim,.contactShadow,.phoneHeroContact) { display:none; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt { display:block;position:absolute;z-index:2;inset:0;overflow:hidden;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .phoneBackground { position:absolute;z-index:0;inset:0;overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .phoneBackground img { display:block;width:100%;height:100%;object-fit:cover;object-position:50% 36%; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:"";position:absolute;z-index:4;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .phoneHero { position:absolute;z-index:3;width:auto;filter:drop-shadow(0 10px 12px rgba(0,0,0,.5)) drop-shadow(0 0 3px rgba(255,211,77,.32)); }
  #app #careerStatistics.careerScreenV10 .phoneHero img { display:block;width:auto;height:100%;object-fit:contain; }
  #app #careerStatistics.careerScreenV10 .careerScreen { inset:0 0 var(--cs-nav);overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { display:block;position:absolute;z-index:3;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { z-index:6;height:auto;display:grid;justify-items:center;row-gap:4px; }
  #app #careerStatistics.careerScreenV10 .titleBlock :is(.sd-eyebrow,.sd-tagline,.titleWordmark) { position:relative;inset:auto;width:auto;margin:0; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-eyebrow { display:none; }
  #app #careerStatistics.careerScreenV10 .titleWordmark { width:100%; }
  #app #careerStatistics.careerScreenV10 .previewChip { z-index:9;transform:none; }
  #app #careerStatistics.careerScreenV10 .phoneHub { position:absolute;z-index:7;display:grid;min-height:0; }
  #app #careerStatistics.careerScreenV10 .headlineTiles { position:relative;inset:auto;width:auto;height:auto;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px); }
  #app #careerStatistics.careerScreenV10 .phoneTabControl { display:block;position:absolute;width:1px;height:1px;opacity:0;clip-path:inset(50%);pointer-events:auto;font-size:16px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs {
   display:grid;grid-template-columns:repeat(3,1fr);min-height:44px;border:1px solid rgba(245,197,24,.58);background:rgba(7,8,10,.82);
   clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
  }
  #app #careerStatistics.careerScreenV10 .phoneTabs label {
   min-width:0;min-height:44px;display:grid;place-items:center;cursor:pointer;color:#b9b3a4;border-right:1px solid rgba(245,197,24,.24);
   font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",sans-serif);letter-spacing:.12em;
  }
  #app #careerStatistics.careerScreenV10 .phoneTabs label:last-child { border-right:0; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.phoneTabs label[for="careerPhoneTable"],
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.phoneTabs label[for="careerPhoneCompare"],
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.phoneTabs label[for="careerPhoneLeaders"] { color:#07080a;background:linear-gradient(135deg,#ffe07e,#f5c518 58%,#d4a017); }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:focus-visible~.phoneTabs label[for="careerPhoneTable"],
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:focus-visible~.phoneTabs label[for="careerPhoneCompare"],
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:focus-visible~.phoneTabs label[for="careerPhoneLeaders"] { outline:3px solid #fff1b8;outline-offset:-3px; }
  #app #careerStatistics.careerScreenV10 .contentGrid { position:relative;min-height:0;overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel,.statePanel) { position:relative;inset:auto;width:100%;height:100%;min-height:0;margin:0; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.statePanel:not([hidden]) { display:grid; }
  #app #careerStatistics.careerScreenV10 .careerStage:is([data-state="empty"],[data-state="unavailable"],[data-state="loading"]) .phoneTabs { visibility:hidden; }
  #app #careerStatistics.careerScreenV10 .careerStage:is([data-state="empty"],[data-state="unavailable"],[data-state="loading"]) .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:none!important; }
  #app #careerStatistics.careerScreenV10 .careerTable { width:calc(100% - 12px);margin:3px 6px 0; }
  #app #careerStatistics.careerScreenV10 .actionRow { display:grid!important;position:absolute;z-index:12;top:auto;width:auto;grid-template-columns:1fr 1.2fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow:has(>#careerStatisticsRivalryButton.hidden) { grid-template-columns:1.2fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { min-width:0;min-height:44px;height:auto;touch-action:manipulation; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionLabel { white-space:normal;line-height:1.1;overflow-wrap:normal;word-break:normal; }
  #app #careerStatistics.careerScreenV10 .statePanel { padding:10px 14px;place-content:center; }
}
/* Sideways (study 1403): title and managers on the left; totals, the three tabs, the picked panel and the actions on the right. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { inset:0 0 0 44%;background:linear-gradient(90deg,transparent,rgba(5,6,8,.55) 12%,rgba(5,6,8,.85) 100%); }
  #app #careerStatistics.careerScreenV10 .phoneHero { top:58px;height:calc(100% - 58px - var(--cs-nav) + 18px); }
  #app #careerStatistics.careerScreenV10 .phoneHeroDaniel { left:0; }
  #app #careerStatistics.careerScreenV10 .phoneHeroNik { left:auto;right:57%; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { inset:0 auto 0 0;width:44%;height:auto;background:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { left:6%;top:8px;width:88%; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-tagline { font-size:8px;letter-spacing:.24em; }
  #app #careerStatistics.careerScreenV10 .previewChip { top:6px;left:10px; }
  #app #careerStatistics.careerScreenV10 .phoneHub { left:45%;right:12px;top:8px;bottom:60px;grid-template-rows:50px 44px minmax(0,1fr);gap:5px; }
  /* The corner Settings button sits over the right end of the totals row. */
  #app #careerStatistics.careerScreenV10 .headlineTiles { gap:4px;margin-right:52px; }
  /* Four totals share a narrow column here, so the decorative icons give their room to the numbers. */
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:minmax(0,1fr);gap:0;padding:3px 6px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { display:none; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:8px;letter-spacing:.04em; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { font-size:6px;letter-spacing:.08em; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:22px; }
  #app #careerStatistics.careerScreenV10 .headlinePair { gap:2px;margin-top:1px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:17px; }
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:7px; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:none; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.contentGrid .careerTablePanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.contentGrid .comparisonPanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.contentGrid .leadersPanel { display:block; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:4px 8px 3px;font-size:11px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 2px;font-size:9px;letter-spacing:.03em; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:5px 2px;font-size:11px; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:2px 9px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:38px 1fr 38px;gap:0 6px;padding:0; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:10px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:8px; }
  #app #careerStatistics.careerScreenV10 .compareTrack { height:3px;margin-top:1px; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:4px 6px 6px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { height:auto;min-height:32px;grid-template-columns:22px minmax(0,1fr);gap:5px;padding:2px 14px 2px 5px; }
  #app #careerStatistics.careerScreenV10 .managerPortrait { width:20px;height:28px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:7px; }
  #app #careerStatistics.careerScreenV10 .leaderName { margin-top:1px;font-size:9px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { margin-top:1px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .actionRow { left:45%;right:12px;bottom:8px;height:44px;gap:6px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 8px;grid-template-columns:22px 1fr 10px;gap:5px;font-size:10px; }
  #app #careerStatistics.careerScreenV10 .actionButton img { width:21px;height:27px; }
  #app #careerStatistics.careerScreenV10 .buttonIcon { width:18px;height:18px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { left:45%;right:12px;top:auto;bottom:calc(var(--cs-nav) + 56px);width:auto;gap:7px;padding:3px 6px; }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { bottom:96px; }
  #app #careerStatistics.careerScreenV10 .statePanel h2 { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .statePanel p { margin-top:5px;font-size:11px;line-height:1.25; }
  #app #careerStatistics.careerScreenV10 .stateIcon { width:30px;height:30px;margin-bottom:5px;font-size:16px; }
}
/* 740x360 partial history: the banner wraps to its tallest, so the hub ends 10px lower to show all six comparison rows and both leader rows. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { bottom:86px; }
}
/* Upright tablet (study 1404): managers either side under the title, four totals in one row, table and comparison side by
   side above the leaders row, all three panels at once (the tabs still pick and outline one). Bigger comparison and leaders text. */
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { inset:44% 0 0;background:linear-gradient(180deg,rgba(5,6,8,0) 0%,rgba(5,6,8,.72) 22%,rgba(5,6,8,.94) 40%,rgba(5,6,8,.96) 100%); }
  #app #careerStatistics.careerScreenV10 .phoneHero { top:9%;height:34%; }
  #app #careerStatistics.careerScreenV10 .phoneHeroDaniel { left:3%; }
  #app #careerStatistics.careerScreenV10 .phoneHeroNik { left:auto;right:3%; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { inset:0 0 auto;height:42%;background:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { left:20%;top:16px;width:60%; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-tagline { font-size:11px;letter-spacing:.36em; }
  #app #careerStatistics.careerScreenV10 .previewChip { top:16px;left:20px; }
  #app #careerStatistics.careerScreenV10 .phoneHub { left:20px;right:20px;top:38%;bottom:88px;grid-template-rows:96px 44px minmax(0,1fr);gap:10px; }
  #app #careerStatistics.careerScreenV10 .headlineTiles { gap:8px; }
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:34px minmax(0,1fr);gap:7px;padding:8px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { width:32px;height:32px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon img { max-width:32px;max-height:40px; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:11px;letter-spacing:.06em;line-height:1.15; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { font-size:9px; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:36px; }
  #app #careerStatistics.careerScreenV10 .headlinePair { gap:4px;margin-top:3px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:28px; }
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:9px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:14px;letter-spacing:.16em; }
  #app #careerStatistics.careerScreenV10 .contentGrid { display:grid;grid-template-columns:1.2fr 1fr;grid-template-rows:minmax(0,1fr) auto;gap:10px;grid-template-areas:"table compare" "leaders leaders"; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.careerTablePanel { grid-area:table; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.comparisonPanel { grid-area:compare; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.leadersPanel { grid-area:leaders; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.statePanel { grid-area:1/1/3/3; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:block; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.contentGrid .careerTablePanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.contentGrid .comparisonPanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.contentGrid .leadersPanel { border-color:#ffdb69;box-shadow:inset 0 0 14px rgba(230,189,66,.11); }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:8px 11px 6px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:6px 2px;font-size:10px;letter-spacing:.02em;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:11px 3px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:6px 12px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:48px 1fr 48px;gap:0 6px;padding:3px 0; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:14px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:11px;white-space:normal; }
  #app #careerStatistics.careerScreenV10 .compareTrack { height:5px;margin-top:3px; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 10px 10px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { height:auto;min-height:84px;grid-template-columns:38px minmax(0,1fr);gap:6px;padding:6px 16px 6px 6px; }
  #app #careerStatistics.careerScreenV10 .managerPortrait { width:36px;height:52px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:10px;line-height:1.15; }
  #app #careerStatistics.careerScreenV10 .leaderName { margin-top:3px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { margin-top:3px;font-size:20px; }
  #app #careerStatistics.careerScreenV10 .actionRow { left:20px;right:20px;bottom:16px;height:56px;gap:10px; }
  /* Tablets in portrait render at 760px wide (js/onlinePlayerIdentity.js sets width=760), so Team V's phone action grid also matches here: one row, in tap order. */
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-areas:none;grid-template-columns:none;grid-template-rows:56px;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { grid-area:auto;min-height:56px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 14px;grid-template-columns:30px 1fr 14px;gap:8px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { left:20px;right:20px;top:calc((100% - var(--cs-nav)) * .38 - 36px);width:auto; }
  #app #careerStatistics.careerScreenV10 .statePanel h2 { font-size:24px; }
  #app #careerStatistics.careerScreenV10 .statePanel p { font-size:15px; }
}
/* r78 HO-031 phone marble: phones, sideways phones and upright tablets draw Team V's ENV_STATISTICS_PHONE_V2 (both
   managers painted in) over the whole stage, cover and pinned to the top, in place of the old background and the two
   cut-outs. The dark grades over the men are gone. Title, totals, tabs, panels and buttons are unchanged. */
@media ${CS_PHONE_ART_MEDIA} {
  #app #careerStatistics.careerScreenV10 .phoneBackground img { object-position:center top; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:none; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { background:none; }
}
/* HO-033 items 5 and 6 (owner rules HO-027 and HO-028). Phones, sideways phones and upright tablets: the totals tiles, the
   tab strip and the three panels get an opaque black-gold marble face (HO-029 kit tile) instead of the .73-.91 glass the
   managers showed through. */
@media ${CS_PHONE_ART_MEDIA} {
  #app #careerStatistics.careerScreenV10 :is(.glassPanel,.headlineTile,.phoneTabs) {
   background:linear-gradient(145deg,rgba(242,196,91,.05),transparent 46%),var(--r78-panel,#110f0c) url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  }
}
/* Upright phones: readable type at the HO-028 sizes (labels 12px and up, table and values 15px; they were 6-9px). The
   totals row grows to hold the bigger labels and the hub starts a little higher (still below the managers' faces), so the
   picked panel keeps its room; the table headers may wrap to two lines. */
@media (max-width:760px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:clamp(90px,14svh,104px) 44px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:minmax(0,1fr);padding:4px 7px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { display:none; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:12px;letter-spacing:.03em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  #app #careerStatistics.careerScreenV10 :is(.headlineTogether,.headlinePair small) { font-size:12px;letter-spacing:.04em; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:13px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:5px 8px 4px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 1px;font-size:12px;line-height:1.1;letter-spacing:0;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(1) { width:7%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(2) { width:22%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(3) { width:19%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(4) { width:22%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(5) { width:14%; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:6px 2px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .rankCrown { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:12px;line-height:1.1; }
  #app #careerStatistics.careerScreenV10 .leaderName { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { font-size:18px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { font-size:13px; }
}
/* Short upright phones (660px tall and less): the bigger type needs about 50px more for the six comparison rows, so the hub
   starts just under the managers' faces (the plate is drawn cover from the top: faces end at 25.31% of its height, Team V
   PHONE_FACE_ZONES), and a panel that still runs long scrolls inside itself instead of being cut. */
@media (max-width:760px) and (orientation:portrait) and (max-height:700px) {
  #app #careerStatistics.careerScreenV10 { --cs-face-bottom:calc(max(100vw * 2096 / 1179, 100svh) * .2531); }
  #app #careerStatistics.careerScreenV10 .phoneHub { top:calc(var(--cs-face-bottom) + 12px); }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { top:calc(var(--cs-face-bottom) + 52px); }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc(var(--cs-face-bottom) + 10px); }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { overflow-y:auto;overscroll-behavior:contain; }
}
/* Sideways phones (852x393): the upright plate ran the full width, so Nik's face sat behind the Career Table panel and
   Daniel's head was a big crop. The plate now fills only the left band under the title (the hub owns the right side),
   shown from the top so both managers stand side by side below the title and no panel covers a face. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt { background:#090a0c; }
  #app #careerStatistics.careerScreenV10 .phoneBackground { right:auto;width:44%;bottom:var(--cs-nav); }
  #app #careerStatistics.careerScreenV10 .phoneBackground img { object-fit:cover;object-position:50% 0; }
  #app #careerStatistics.careerScreenV10 .titleBlock { top:4px; }
  /* HO-033 follow-up: no dark wash over the right side (owner rule: no dimming); the hub's panels are opaque marble. */
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:none; }
  /* HO-028 type on sideways phones too: labels 12px or more, values and secondary text 15px. The four totals keep one row
     (labels wrap to two lines instead of shrinking); the tabs, table, comparison, leaders and actions grow in place, and
     every tab still fits its panel without scrolling at 852x393. The hub stays right of the managers (no face covered). */
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:58px 40px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { padding:1px 6px;align-content:center; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:12px;line-height:1.05;letter-spacing:.03em;white-space:normal;overflow:visible; }
  #app #careerStatistics.careerScreenV10 .headlineTogether,
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:20px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:17px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:13px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:4px 8px 3px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 3px;font-size:12px;letter-spacing:.02em;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:5px 3px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .careerTable .rankCrown { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:44px 1fr 44px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { min-height:48px;grid-template-columns:24px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderName { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { font-size:18px; }
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-columns:1.3fr 1.1fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { font-size:13px;line-height:1.05; }
  #app #careerStatistics.careerScreenV10 .statePanel p { font-size:15px; }
}
/* Shorter sideways phones (740x360): the same sizes, with tighter rows so Compare and Leaders still fit their panel. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:58px 36px minmax(0,1fr);gap:4px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:2px 8px 1px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue,.compareLabel) { line-height:1; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { gap:3px;padding:2px 6px 3px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { min-height:0;padding-block:1px; }
  #app #careerStatistics.careerScreenV10 .leaderCard :is(.leaderLabel,.leaderName,.leaderValue) { line-height:1.05;margin-top:0; }
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-columns:1.2fr 1.05fr 1.05fr;gap:5px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 5px;gap:4px;font-size:12px;letter-spacing:.02em; }
}
/* r80 Europa League: Manager Comparison has seven rows (EUROPA LEAGUE WINS). Below the 1200x700 desktop (css/v10Shell.css already
   spreads the rows over its fixed panel) Team V's panel is a fixed height with 3px-padded rows, and the seventh row hung out of
   it. Here the rows share the panel's height the same way, and on short windows the panel takes the free band above the
   leaders (it ends at 72.45%, the leaders start at 73.5%). */
@media (min-width:901px) and (min-height:481px) and (max-height:699px), (min-width:901px) and (max-width:1199px) and (min-height:481px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel:not([hidden]) { display:flex;flex-direction:column; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:3px 12px 5px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:2px;height:4px; }
}
/* Short upright phones: the seven rows fit the Compare panel (no inner scroll, nothing cut) with the HO-028 type kept; the bar
   sits right under its numbers. */
@media (max-width:760px) and (orientation:portrait) and (max-height:700px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { padding:4px 8px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
/* r80 short screens: narrow tall phones (360x740): the hub starts at 41% and left the Compare panel 136px, so AVERAGE LEAGUE
   POINTS and AVERAGE LEAGUE GOALS ran under CURRENT RIVALRY STATISTICS / BACK TO MAIN MENU. The rows take the short-phone
   spacing above and the hub starts 2.5% higher (it stays clear of both faces), so the seven rows fit the panel. */
@media (max-width:370px) and (orientation:portrait) and (min-height:701px) and (max-height:800px) {
  #app #careerStatistics.careerScreenV10 .phoneHub { top:38.5%; }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .385 - 27px); }
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { padding:4px 8px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
/* Shorter sideways phones (740x360): the Compare tab already names the panel, so its heading is kept for screen readers only
   and the seven rows take its place. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:2px 9px 1px; }
}
@media (min-width:901px) and (min-height:481px) and (max-height:699px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel { height:31%; }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .comparisonPanel { height:28.6%; }
}
`;

  // TROPHY-PLATE-V2 (ticket 1610P): desktop Trophy Room on Team V's black-marble trophy-hall plate
  // (visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_*), drawn to match NEXT_TROPHY_ROOM. Strictly the desktop picture
  // range: wide landscape windows of at least 1200x600; phones, sideways phones and tablets keep their art and rules.
  // Team V's stage still draws the old plate on .sd-stage__plate; the adapter re-points that plane at the V2 files (height-fit,
  // centred, top-anchored, with a soft darkened side fill on windows wider than 16:9), so the 2X swap and load timing are
  // unchanged and the plate loads with this screen, never with the startup bundle. The plate carries both managers, all
  // banners and the name tags, and an empty marble pedestal with a flat top: the live champion trophy is seated on it and its
  // name and counts are written on the pedestal's face. Everything is placed in plate units (--tr-k = one plate pixel), so it
  // stays registered on every window shape. Looks only: every word, id and tap order stays as it was.
  const TROPHY_PLATE_V2_CSS=String.raw`
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-k:calc(100svh / 864);
    --tr-bevel:linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%);
    --tr-gold:linear-gradient(180deg,#fff0a6 0,#f8d764 20%,#e4b032 54%,#f4cf58 80%,#c98f1c 100%);
  }
  #app #trophyRoom .sd-stage__layer--plate {overflow:hidden}
  #app #trophyRoom .sd-stage__layer--plate::before {
    content:"";position:absolute;inset:-4%;pointer-events:none;filter:blur(16px) brightness(.5) saturate(.9);
    background:#07080a image-set(url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_1X.webp') 1x,url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_2X.webp') 2x) center / cover no-repeat;
  }
  #app #trophyRoom .sd-stage__layer--plate > .sd-stage__registered {
    left:50%;top:0;width:calc(1536 * var(--tr-k));height:calc(864 * var(--tr-k));transform:translateX(-50%) translateZ(0);
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);
  }
  #app #trophyRoom .sd-stage__plate {
    background-image:image-set(url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_1X.webp') 1x,url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_2X.webp') 2x);
  }
  /* the title sits on dark marble; the brush image's black box melts into the plate */
  #app #trophyRoom .trophyBrushTitle {mix-blend-mode:screen}
  /* the plate already carries the crown over the kicker, so the live one keeps its space but is not drawn twice */
  #app #trophyRoom .trophyEyebrow::before {visibility:hidden}
  #app #trophyRoom .trophyEyebrow,
  #app #trophyRoom .trophyTagline {color:#fff6d8;text-shadow:0 1px 3px #000,0 0 10px #000c}
  /* the champion trophy stands on the plate's pedestal (flat top at plate y 450); its name and line are on the pedestal face */
  #app #trophyRoom .heroCeremony {left:calc(50vw - 195 * var(--tr-k));top:calc(225 * var(--tr-k));width:calc(390 * var(--tr-k));height:calc(310 * var(--tr-k))}
  #app #trophyRoom .heroTrophyPicture {left:calc(195 * var(--tr-k) - 90 * var(--tr-k));top:0;width:calc(180 * var(--tr-k));height:calc(243 * var(--tr-k))}
  #app #trophyRoom .heroReflection {display:none}
  #app #trophyRoom .heroPlinth {
    left:0;right:0;top:calc(250 * var(--tr-k));bottom:auto;height:calc(64 * var(--tr-k));clip-path:none;border:0;
    background:none;box-shadow:none;
  }
  #app #trophyRoom .heroPlinth::after {display:none}
  #app #trophyRoom .heroPlinth span {font-size:max(12px,calc(16 * var(--tr-k)));text-shadow:0 1px 2px #000,0 0 10px #000a}
  #app #trophyRoom .heroPlinth small {font-size:max(8px,calc(8 * var(--tr-k)));color:#d8c68f}
  /* the two rank cards, the tab row and the cases sit as in the picture */
  #app #trophyRoom .careerRank {
    border:2px solid transparent;border-radius:2px;
    /* HO-033 follow-up: opaque black-gold marble (HO-029 kit tile), not the .90-.95 see-through glass (owner rule HO-027) */
    background:linear-gradient(180deg,#f2c45b0d,transparent 42%) padding-box,url("css/r78-marble-tile.webp") 0 0/256px 256px repeat padding-box,var(--tr-bevel) border-box #110f0c;
    box-shadow:inset 0 0 0 1px #000a,0 6px 18px #000a;
  }
  /* tabs: black with a gold edge, ALL in polished gold (HO-033 follow-up: solid black, no longer 90%) */
  #app #trophyRoom .trophyTabs {background:#050506;border:1px solid #d9aa3caa;box-shadow:0 8px 22px #0009}
  #app #trophyRoom .trophyTab {background:linear-gradient(180deg,#141412,#060607);color:#f6efd8;box-shadow:inset 0 1px 0 #fff1b814}
  #app #trophyRoom .trophyTab.is-active {
    background:var(--tr-gold);color:#1a1305;text-shadow:0 1px 0 #fff2b588;
    box-shadow:inset 0 1px 0 #fffbe0,inset 0 -3px 0 #a87a1288,0 0 16px #f5c51838;
  }
  /* the cases: gold-bevel frame around black marble glass */
  #app #trophyRoom .shelfGlass {
    border:clamp(3px,.4vh,4px) solid transparent;border-radius:0;
    background:linear-gradient(180deg,#f2c45b0d,transparent 42%) padding-box,url("css/r78-marble-tile.webp") 0 0/256px 256px repeat padding-box,var(--tr-bevel) border-box #110f0c;
    box-shadow:inset 0 0 0 2px #050505,0 14px 34px #000b,0 0 22px #f0c84b26;
  }
  #app #trophyRoom .trophyCard {
    border:1px solid #d9aa3c99;border-radius:0;
    background:radial-gradient(ellipse at 50% 12%,#a07d3a52,transparent 62%),linear-gradient(180deg,#1a1812cc,#060607f2);
    box-shadow:inset 0 0 0 1px #000a,inset 0 1px 0 2px #fff1b812;
  }
  #app #trophyRoom .recordRibbon {border:1px solid #d9aa3c99;background:linear-gradient(180deg,#0e0e0fe6,#050506f2);box-shadow:inset 0 0 0 1px #000a}
  /* BACK: black with the gold-bevel edge, as in the picture */
  #app #trophyRoom .trophyBack {
    border:3px solid transparent;border-radius:4px;color:#fff1ae;
    background:linear-gradient(180deg,#171512,#070708) padding-box,var(--tr-bevel) border-box;
    box-shadow:inset 0 0 0 1px #050505,inset 0 1px 0 2px #fff1b81f,0 6px 18px #000b,0 0 18px #f0c84b30;
  }
}
/* Tall windows seat the tab row, cases and rank cards exactly where the picture has them (plate y 540 and 465). Short windows
   (1280x650, 1366x768) keep the live rows, which already fit one screen with BACK, and lift the pedestal text a little. */
@media (min-width:1200px) and (min-height:821px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {padding-top:calc(540 * var(--tr-k))}
  #app #trophyRoom .careerRanks {top:calc(465 * var(--tr-k))}
  #app #trophyRoom .careerRank {top:0;bottom:auto}
}
@media (min-width:1200px) and (min-height:600px) and (max-height:820px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom .heroPlinth {top:calc(229 * var(--tr-k))}
}
`;

  const TROPHY_SIDEWAYS_1730_CSS=String.raw`
  /* JOB-1730: adopted study 1730 (sideways phones, 844x390 and 740x360). Left stage: title, Daniel LEFT, Nik RIGHT and the
     champion trophy between them. Right cabinet: six tabs in one row, then the five trophy cases in one row (r80 Europa League). BACK (wide)
     and MORE sit in their own full-width row above a slimmer hub bar, clear of every tab and card. main is the only scroller. */
  @media (max-height:480px) and (orientation:landscape) {
    html[data-v10-screen="trophyRoom"] { --sd-nav-bottom-h:48px; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab { gap:2px; font-size:9.5px; letter-spacing:.1em; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab svg { width:18px; height:18px; }
    #app #trophyRoom {
      --tr-act:44px; --tr-gap:6px;
      --tr-lcol:max(236px,34vw);
      /* r80 short screens: 78px cut TWO MANAGERS. ONE LEGACY. under the wordmark at 844x390 (it started at 80px); the
         champion trophy keeps its size and place (it stands on the stage's floor). */
      --tr-title:88px;
      --tr-areab:calc(100svh - var(--tr-hub) - var(--tr-act) - 2 * var(--tr-gap));
      --tr-areah:calc(var(--tr-areab) - 4px);
      --tr-stage:calc(var(--tr-lcol) - 12px);
      --tr-hero-top:calc(4px + var(--tr-title) + 2px);
      --tr-row:calc(var(--tr-areah) - 44px - var(--tr-gap) - 12px);
    }
    #app #trophyRoom .trophyPhoneBackdrop img { object-position:50% 38%; }
    #app #trophyRoom .trophyPhoneArtShade { background:linear-gradient(180deg,#02030426,#02030473 55%,#050607); }
    #app #trophyRoom .trophyPhoneHero {
      top:auto; bottom:calc(var(--tr-hub) + var(--tr-act) + 2 * var(--tr-gap) - var(--tr-hub));
      height:calc(var(--tr-areab) - var(--tr-hero-top)); width:calc(var(--tr-stage) / 2);
    }
    #app #trophyRoom .trophyPhoneHero img { object-fit:contain; }
    #app #trophyRoom .trophyPhoneHero--daniel { left:8px; right:auto; }
    #app #trophyRoom .trophyPhoneHero--daniel img { object-position:left bottom; }
    #app #trophyRoom .trophyPhoneHero--nik { left:calc(8px + var(--tr-stage) / 2); right:auto; }
    #app #trophyRoom .trophyPhoneHero--nik img { object-position:right bottom; }
    #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
      display:block; min-height:100svh; background:none;
      padding:4px 8px 0 calc(var(--tr-lcol) + 4px);
    }
    #app #trophyRoom .trophyTitleBlock { inset:4px auto auto 8px; width:var(--tr-stage); height:var(--tr-title); text-align:center; }
    #app #trophyRoom .trophyEyebrow { font-size:8px; line-height:1.2; letter-spacing:.22em; }
    #app #trophyRoom .trophyBrushTitle { width:min(100%,240px); height:auto; max-height:44px; margin:2px auto 0; display:block; }
    #app #trophyRoom .trophyTagline { margin:2px 0 0; font-size:7px; line-height:1.2; letter-spacing:.14em; }
    #app #trophyRoom .heroCeremony {
      inset:var(--tr-hero-top) auto auto calc(8px + var(--tr-stage) / 4);
      width:calc(var(--tr-stage) / 2); height:calc(var(--tr-areab) - var(--tr-hero-top));
    }
    #app #trophyRoom .heroSpotlight { inset:0 -20% 20px; }
    #app #trophyRoom .heroReflection { display:none; }
    #app #trophyRoom .heroTrophyPicture { left:0; top:auto; bottom:23px; width:100%; height:min(112px,calc(100% - 23px)); }
    #app #trophyRoom .heroTrophyPicture img { width:100%; height:100%; object-fit:contain; object-position:center bottom; }
    #app #trophyRoom .heroPlinth {
      left:-11%; right:-11%; bottom:0; height:auto; min-height:0; padding:4px 2px 3px; text-align:center;
      background:linear-gradient(180deg,#31260d,#070807); border:1px solid #b99549;
      clip-path:polygon(7% 0,93% 0,100% 18%,100% 100%,0 100%,0 18%);
    }
    #app #trophyRoom .heroPlinth span { display:block; font-size:10px; line-height:1; letter-spacing:.08em; white-space:nowrap; }
    #app #trophyRoom .heroPlinth small { display:block; margin-top:2px; font-size:6.5px; line-height:1; letter-spacing:.12em; }
    #app #trophyRoom .trophyShelf {
      display:grid; grid-template-columns:minmax(0,1fr); grid-template-rows:44px minmax(0,1fr); grid-auto-flow:row; gap:var(--tr-gap);
      height:var(--tr-areah); min-height:0; padding:0; border:0; background:none;
    }
    #app #trophyRoom .trophyTabs {
      display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:3px; min-height:44px; height:44px;
      width:auto; margin:0 50px 0 0; padding:0; border:0; background:none;
    }
    #app #trophyRoom .trophyTab,
    #app #trophyRoom .trophyTab:nth-child(n+4) {
      grid-column:auto; min-width:0; min-height:44px; height:44px; padding:0 4px;
      font-size:10px; line-height:1.1; letter-spacing:.07em; white-space:normal; overflow-wrap:normal; word-break:normal;
    }
    #app #trophyRoom .shelfGlass {
      display:flex; flex-direction:column; height:100%; min-height:0; padding:5px; border:1px solid #d4a017b3; overflow:hidden;
      background:linear-gradient(180deg,#0f0e0cd6,#050607f0);
    }
    #app #trophyRoom .trophyGrid {
      flex:1 1 0; height:auto; min-height:0; grid-template-columns:repeat(5,minmax(0,1fr)); grid-template-rows:minmax(0,1fr);
      grid-auto-rows:auto; gap:5px; overflow:hidden;
    }
    #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {
      grid-template-columns:minmax(0,230px); grid-template-rows:minmax(0,1fr); grid-auto-rows:auto; justify-content:center;
    }
    #app #trophyRoom .trophyCard {
      grid-template-rows:minmax(0,1fr) auto auto 12px; height:100%; min-height:0; padding:4px 3px 3px; overflow:hidden; text-align:center;
    }
    #app #trophyRoom .trophyCardPicture,
    #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture { width:100%; height:100%; min-height:0; }
    #app #trophyRoom .trophyCardPicture img { display:block; width:100%; height:100%; min-height:0; object-fit:contain; }
    #app #trophyRoom .trophyCard h3 {
      display:grid; align-items:center; min-height:25px; margin:0; padding:3px 0 2px; font-size:10.5px; line-height:1.05; letter-spacing:.06em;
      border-top:1px solid #79612ecc; border-bottom:0; text-wrap:balance;
    }
    #app #trophyRoom .managerCounts { min-height:0; gap:0; }
    #app #trophyRoom .managerCounts span { font-size:8px; line-height:1.2; letter-spacing:.1em; }
    #app #trophyRoom .managerCounts strong { font-size:16px; line-height:1.05; }
    #app #trophyRoom .notWonYet { min-height:12px; margin:0; font-size:8px; line-height:12px; }
    #app #trophyRoom .trophyBack {
      left:8px; right:calc(8px + 96px + 8px); bottom:calc(var(--tr-hub) + var(--tr-gap)); height:44px; min-height:44px;
      font-size:14px; letter-spacing:.24em;
    }
    #app #trophyRoom .trophyPhoneMoreButton {
      right:8px; bottom:calc(var(--tr-hub) + var(--tr-gap)); width:96px; height:44px; font-size:11px; letter-spacing:.14em;
    }
    #app #trophyRoom .phoneMoreToggle { right:8px!important; bottom:calc(var(--tr-hub) + var(--tr-gap))!important; width:96px!important; height:44px!important; }
    #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet { inset:4px 54px auto calc(var(--tr-lcol) + 4px); height:36px; padding:2px 8px; background:linear-gradient(180deg,#050607f0,#050607b8); }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .heroCeremony { visibility:visible; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyShelf { display:block; height:auto; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass { display:block; height:auto; overflow:visible; padding:0; border:0; background:none; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks { margin:44px 0 6px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank { min-height:58px; padding:4px 5px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon { gap:4px; padding:5px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem { min-height:40px; padding:3px 6px; }
  }
  @media (max-height:375px) and (orientation:landscape) {
    html[data-v10-screen="trophyRoom"] { --sd-nav-bottom-h:44px; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab svg { width:16px; height:16px; }
    #app #trophyRoom { --tr-gap:5px; --tr-title:70px; }
    #app #trophyRoom .trophyBrushTitle { max-height:38px; }
    #app #trophyRoom .trophyCard h3 { font-size:10px; }
    #app #trophyRoom .managerCounts strong { font-size:14px; }
    #app #trophyRoom .trophyTab { font-size:9.5px; }
  }
  `;
  
  // r84 Golden Showdown looks: the shared gold tokens and the r78 black-and-gold marble tile. Nothing here dims, overlays or moves
  // another element. Trophy Room: the gold case is a sixth case on the ALL shelf, so rows that held five cases hold six; portrait
  // phones and tablets (three across, the last two centred) show two full rows of three. Career Statistics: one gold line under the
  // Career Table.
  const GOLDEN_SHOWDOWN_CSS=String.raw`
#app #trophyRoom .trophyShelf.has-golden:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(6,minmax(0,1fr))}
@media (max-width:900px) and (orientation:portrait) {
  #app #trophyRoom .trophyShelf.has-golden:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:span 2}
}
#app #trophyRoom .trophyCard.trophyCard--golden {
  border:1px solid var(--sd-gold-500,#f5c518);
  background:radial-gradient(ellipse at 50% 30%,rgba(255,211,77,.30),rgba(255,211,77,0) 62%),linear-gradient(180deg,rgba(73,55,8,.55),rgba(7,8,10,.35)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 2px rgba(17,15,12,.9),inset 0 0 0 3px rgba(255,211,77,.55),inset 0 0 22px rgba(242,196,91,.28);
}
#app #trophyRoom .trophyCard--golden .trophyCardPicture img {filter:drop-shadow(0 0 10px rgba(255,211,77,.65)) drop-shadow(0 5px 8px rgba(0,0,0,.72)) saturate(1.2) brightness(1.08)}
#app #trophyRoom .trophyCard--golden h3 {color:var(--sd-gold-300,#ffd34d);text-shadow:0 1px 2px #000}
#app #trophyRoom .trophyCard--golden .managerCounts strong {color:var(--sd-gold-200,#fff1b8)}
#app #careerStatistics .goldenShowdownNote {
  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 10px;margin:8px 0 0;padding:6px 10px;
  color:var(--sd-gold-200,#fff1b8);font-family:var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);font-weight:600;
  font-size:12px;line-height:1.2;letter-spacing:.06em;text-align:center;
  border:1px solid var(--sd-gold-600,#e0ae3a);border-radius:var(--sd-radius,3px);
  background:linear-gradient(180deg,rgba(73,55,8,.6),rgba(13,12,10,.75)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 2px rgba(17,15,12,.9),inset 0 0 0 3px rgba(255,211,77,.4);
}
#app #careerStatistics .goldenShowdownNote img {width:20px;height:20px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(255,211,77,.6))}
#app #careerStatistics .goldenShowdownNote strong {color:var(--sd-gold-300,#ffd34d);letter-spacing:.1em}
`;
  function v10Markup(screen){
    const cs=BASE+"career-statistics/",tr=BASE+"trophy-room/";
    if(screen==="careerStatistics")return `<div id="stage-root" class="careerStage" data-primary="trophyRoomButton"><div class="scene sd-stage" id="careerScene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate" aria-hidden="true"><div class="sd-stage__registered"><div class="sd-stage__plate"></div><span class="managerMarker managerDaniel" data-manager="daniel" role="presentation"></span><span class="managerMarker managerNik" data-manager="nik" role="presentation"></span></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere" aria-hidden="true"></div><div class="phoneSceneArt" aria-hidden="true"><picture class="phoneBackground"><source media="${CS_PHONE_ART_MEDIA}" srcset="${BASE}plates-v2/ENV_STATISTICS_PHONE_V2.webp"><img alt="" decoding="async"></picture></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="stateBackdrop" aria-hidden="true"></div><div class="careerScreen" aria-labelledby="careerStatisticsScreenTitle"><section class="phoneFaceBand" aria-label="Career Statistics presentation"><header class="titleBlock"><p class="sd-eyebrow">CAREER MODE SHOWDOWN 17</p><h2 id="careerStatisticsScreenTitle" class="titleWordmark" data-sd-enter="title" tabindex="-1" data-route-focus-target="true"><span class="sd-visually-hidden">CAREER STATISTICS</span><img src="${cs}assets/TITLE_CS_V1.webp" alt="" aria-hidden="true" width="1216" height="126" decoding="async"></h2><p class="sd-tagline">TWO MANAGERS. ONE LEGACY.</p></header></section><div id="previewChip" class="previewChip" hidden></div><section class="phoneHub" aria-label="Career Statistics data"><section id="headlineTiles" class="headlineTiles" aria-label="Career headline totals"></section><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneTable" aria-label="Career Table" aria-controls="careerTablePanel" checked><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneCompare" aria-label="Manager Comparison" aria-controls="comparisonPanel"><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneLeaders" aria-label="Career Leaders" aria-controls="leadersPanel"><div class="phoneTabs" aria-label="Career Statistics sections"><label for="careerPhoneTable">TABLE</label><label for="careerPhoneCompare">COMPARE</label><label for="careerPhoneLeaders">LEADERS</label></div><section id="careerStatisticsContent" class="contentGrid" aria-live="polite"><section id="careerTablePanel" data-sd-enter="panel" class="glassPanel careerTablePanel" aria-labelledby="careerTableHeading"></section><section id="comparisonPanel" data-sd-enter="panel" class="glassPanel comparisonPanel" aria-labelledby="comparisonHeading"></section><section id="leadersPanel" data-sd-enter="panel" class="glassPanel leadersPanel" aria-labelledby="leadersHeading"></section><section id="statePanel" class="glassPanel statePanel" hidden></section></section></section><nav class="actionRow" aria-label="Career Statistics actions" data-phone-primary="trophyRoomButton"><button id="careerStatisticsRivalryButton" class="actionButton secondary" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h3V9H4v10Zm6 0h3V5h-3v14Zm6 0h3V12h-3v7Z"/></svg></span><span class="actionLabel">CURRENT RIVALRY STATISTICS</span><span aria-hidden="true">›</span></button><button id="trophyRoomButton" data-sd-enter="button" class="actionButton primary" type="button"><img src="${BASE}shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp" alt="" aria-hidden="true"><span class="actionLabel">OPEN TROPHY ROOM</span><span aria-hidden="true">›</span></button><button class="actionButton secondary backButton" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg></span><span class="actionLabel">BACK TO HOME</span><span aria-hidden="true">›</span></button></nav></div><div class="gridOverlay" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout" aria-hidden="true"><div class="sd-stage__registered"><span class="contactShadow"></span><div class="sd-stage__cutout armCutout" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp"></div></div></div><div class="sd-stage__layer sd-stage__layer--light" aria-hidden="true"><div class="sd-stage__registered"><span class="sd-stage__rim armRim" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp"></span></div></div></div></div>`;
    return `<div class="sd-stage trophyRoomScene" data-sd-enter="scene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate"><div class="sd-stage__registered"><div class="sd-stage__plate"></div></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere"></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="trophyPhoneArt" aria-hidden="true"><picture class="trophyPhoneBackdrop"><source media="(max-width: 400px) and (orientation: portrait)" type="image/webp" srcset="${BASE}plates-v3/ENV_TROPHY_ROOM_PHONE_V3.webp"><source type="image/webp" srcset="${tr}assets/ENV_TR_PHONE_V1.webp"><img src="${tr}assets/ENV_TR_PHONE_V1.webp" alt="" width="1179" height="2096" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--daniel" data-sd-enter="character-left"><source media="(min-width: 401px) and (max-width: 900px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)" type="image/webp" srcset="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--nik" data-sd-enter="character-right"><source media="(min-width: 401px) and (max-width: 900px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)" type="image/webp" srcset="${tr}assets/OVL_TR_NIK_PHONE_V1.webp"><img alt="" decoding="async"></picture><div class="trophyPhoneArtShade"></div></div><input id="trophyPhoneMoreToggle" class="phoneMoreToggle visually-hidden" type="checkbox" aria-label="Toggle career details" aria-controls="trophyRoomContent"><div id="trophyRoomContent" class="trophyRoomContent sd-stage__ui-content" aria-live="polite"></div><aside id="trophyPhoneSheet" class="sd-sheet trophyPhoneSheet" aria-labelledby="trophyPhoneSheetTitle"><strong id="trophyPhoneSheetTitle" class="trophyPhoneSheetTitle">CAREER DETAILS</strong><span class="trophyPhoneSheetHint">Ranks and career records</span><span class="trophyPhoneSheetClose" aria-hidden="true">CLOSE</span></aside><label class="trophyPhoneMoreButton" for="trophyPhoneMoreToggle" aria-hidden="true"><span class="trophyPhoneMoreOpen">MORE</span><span class="trophyPhoneMoreClose">CLOSE</span></label><div class="nav-reserve trophyPhoneNavReserve" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout"><div class="sd-stage__registered"></div></div><div class="sd-stage__layer sd-stage__layer--light"><div class="sd-stage__registered"></div></div></div>`;
  }
  async function v10Platemap(screen){
    if(platemaps[screen])return platemaps[screen];
    const response=await root.fetch(typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(BASE+FILES[screen].platemap):BASE+FILES[screen].platemap);
    if(!response.ok)throw new Error("CAREER_SCREEN_V10_PLATEMAP");
    platemaps[screen]=await response.json();
    return platemaps[screen];
  }
  function v10Wire(screen,host){
    if(screen==="careerStatistics"){
      const rivalry=host.querySelector("#careerStatisticsRivalryButton");
      if(rivalry){const available=(typeof currentShowdown!=="undefined"&&currentShowdown)||v10Source(screen)?.history?.showdowns?.some(r=>r.status==="completed");rivalry.classList.toggle("hidden",!available);rivalry.addEventListener("click",()=>{if(available&&typeof root.openRivalryStatistics==="function")root.openRivalryStatistics();});}
      const trophy=host.querySelector("#trophyRoomButton");
      if(trophy)trophy.addEventListener("click",()=>{if(typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});
    }
  }
  function v10Identity(){
    const identity=root.CareerModeOnlinePlayerIdentity;
    return identity&&typeof identity.getState==="function"?identity.getState():null;
  }
  // The frame the loader compares: the model itself, UNAVAILABLE, or null for the local (old) screens.
  function v10Source(screen){
    const getModel=getters[screen];
    if(typeof getModel!=="function")return null;
    const identity=v10Identity();
    let model=getModel();
    // Online with no supplied model: the provider-backed completed-Showdown model (shared with History).
    if(model==null&&v10Seam().isOnlineCareerRoute(identity)){
      model=v10OnlineModel()??(onlineLoading?LOADING:null);
      // r83 (Nik: panels show, vanish, then load again): an "unavailable" career kept from an earlier read is not drawn
      // while a fresh read is running; the screen shows loading once, then the fresh career.
      if(onlineLoading&&model?.status==="unavailable")model=LOADING;
    }
    const source=v10Seam().selectCareerScreenSource({identityState:identity,model});
    if(source==="local")return null;
    return source==="model"?model:UNAVAILABLE;
  }
  function v10Render(screen,model){
    const doc=root.document,host=doc.getElementById(SCREEN_IDS[screen]);
    if(!host)return false;
    const frame=toV10Frame(model,screen);
    // Only one Team V stage exists at a time (both use #stage-root); the other screen is rebuilt on its next open.
    const other=screen==="careerStatistics"?"trophyRoom":"careerStatistics",otherHost=doc.getElementById(SCREEN_IDS[other]);
    if(otherHost&&otherHost.dataset.careerV10==="1"){v10Screens().hide(other);otherHost.remove();}
    host.dataset.careerV10="1";host.classList.add("careerScreenV10");
    host.innerHTML=v10Markup(screen);
    if(screen==="trophyRoom"){
      const smallPhoneStyle=doc.createElement("style");
      smallPhoneStyle.textContent=TROPHY_SMALL_PHONE_CSS+TROPHY_390_PHONE_CSS+TROPHY_430_PHONE_CSS+TROPHY_844_LANDSCAPE_CSS+TROPHY_932_LANDSCAPE_CSS+TROPHY_768_TABLET_CSS+TROPHY_1280_LAPTOP_CSS+TROPHY_1366_CHROMEBOOK_CSS+TROPHY_1920_DESKTOP_CSS+TROPHY_2560_ULTRAWIDE_CSS+TROPHY_SCREEN_1705_CSS+TROPHY_SIDEWAYS_1730_CSS+TROPHY_PLATE_V2_CSS+GOLDEN_SHOWDOWN_CSS;
      host.appendChild(smallPhoneStyle);
    }else{
      const careerStatsStyle=doc.createElement("style");
      careerStatsStyle.textContent=CAREER_STATS_1706_CSS+GOLDEN_SHOWDOWN_CSS;
      host.appendChild(careerStatsStyle);
    }
    v10Wire(screen,host);
    if(screen==="careerStatistics"){
      const cs=BASE+"career-statistics/";
      root.CAREER_STATISTICS_APP=true;root.CAREER_STATISTICS_BASE=cs;root.CAREER_STATISTICS_QS="frame=LIVE";
      root.CAREER_STATISTICS_FIXTURES={strings:STRINGS.careerStatistics,frames:{LIVE:frame}};
      root.CAREER_STATISTICS_PLATEMAP=platemaps.careerStatistics;
      root.CAREER_STATISTICS_ASSETS={plate1x:cs+"assets/ENV_CS_PLATE_V1_1X.webp",plate2x:cs+"assets/ENV_CS_PLATE_V1_2X.webp"};
      root.ShowdownCareerStatisticsBoot();
    }else{
      root.TROPHY_ROOM_APP=true;root.TROPHY_ROOM_BASE=BASE+"trophy-room/";root.TROPHY_ROOM_FRAME="LIVE";
      root.TROPHY_ROOM_FIXTURES={strings:STRINGS.trophyRoom,frames:{LIVE:frame}};
      root.TROPHY_ROOM_PLATEMAP=platemaps.trophyRoom;
      root.ShowdownTrophyRoomBoot();
    }
    return true;
  }
  // The old render paths keep running (they hold the model) and rewrite the host, so a V10 screen is always
  // redrawn after them, as in job 13.
  function v10WrapRender(screen){
    const name=screen==="careerStatistics"?"renderCareerStatistics":"renderTrophyRoom";
    const original=root[name];
    if(typeof original!=="function"||original.careerScreensV10)return;
    const wrapped=function(request=false){
      const result=original(request),host=root.document.getElementById(SCREEN_IDS[screen]);
      if(!host||host.dataset.careerV10!=="1")return result;
      if(v10Source(screen)===null){
        v10Screens().hide(screen);host.remove();
        const open=root[screen==="careerStatistics"?"openCareerStatistics":"openTrophyRoom"];
        if(typeof open==="function")open();
        return result;
      }
      const screens=v10Screens();screens.invalidate(screen);
      screens.show(screen).catch(v10Fail);
      return result;
    };
    wrapped.careerScreensV10=true;root[name]=wrapped;
  }
  function v10Register(){
    if(!registered)registered=root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens)).then(()=>{
      const screens=v10Screens().install();
      // Team V's screen scripts wait for the app's frame when these flags are set before they load.
      root.CAREER_STATISTICS_APP=true;root.TROPHY_ROOM_APP=true;
      for(const screen of Object.keys(SCREEN_IDS)){
        screens.register(screen,{
          css:[FILES[screen].style],
          js:[FILES[screen].script],
          prepare:()=>Promise.all([v10Platemap(screen),v10EnsureChip()]),
          frame:()=>v10Source(screen),
          mount:frame=>{v10Render(screen,frame===UNAVAILABLE?null:frame);},
          // Job 13 leaves its markup in the hidden section; the loader switches its styles off.
          unmount(){onlineLifetimes[screen]++;}
        });
      }
      // Signing in (or out) while a career screen shows reloads its online model: since r61 a signed-out device sees
      // Team V's screen too, so the sign-in chip leads straight to the real career.
      root.addEventListener?.("career-mode-online-identity-change",()=>{
        const live=Object.keys(SCREEN_IDS).filter(screen=>screens.isMounted(screen));
        if(!live.length)return;
        if(live.some(screen=>getters[screen]?.()==null)&&v10Seam().isOnlineCareerRoute(v10Identity())&&v10OnlineModel()==null)v10LoadOnline().catch(v10Fail);
        else v10Redraw();
      });
      // The career start marker changed (switched, or first read after a failed one): reload the online career.
      root.addEventListener?.("career-mode-career-start-change",()=>{
        if(!Object.keys(SCREEN_IDS).some(screen=>screens.isMounted(screen)&&getters[screen]?.()==null))return;
        if(v10Seam().isOnlineCareerRoute(v10Identity()))v10LoadOnline().catch(v10Fail);
      });
      root.addEventListener?.("career-mode-online-career-model-change",()=>{
        // r82 (Nik: panels show, vanish, then load again): this screen's own load redraws once when it ends, so a model
        // published during that load must not draw the same frame a second time.
        if(onlineLoading||!v10Seam().isOnlineCareerRoute(v10Identity())||v10OnlineModel()==null)return;
        for(const screen of Object.keys(SCREEN_IDS))if(screens.isMounted(screen)&&getters[screen]?.()==null){
          screens.invalidate(screen);screens.show(screen).catch(v10Fail);
        }
      });
      return screens;
    }).catch(error=>{registered=null;throw error;});
    return registered;
  }
  function v10ModelText(model){try{return model==null?null:JSON.stringify(model);}catch(_){return null;}}
  function v10OnlineModel(){try{return root.CareerModeRivalryLegacyV10?.cachedCareerModel?.()??null;}catch(_){return null;}}
  function v10Redraw(){
    const screens=v10Screens();
    for(const screen of Object.keys(SCREEN_IDS))if(screens.isMounted(screen)){screens.invalidate(screen);screens.show(screen).catch(v10Fail);}
  }
  // Reads the closed-Showdown career through the same lazy loader History uses (exact gets only, no writes).
  async function v10LoadOnline(screen=Object.keys(SCREEN_IDS).find(id=>v10Screens().isMounted(id))){
    // r82 (Codex JOB-B B3): a warm visit draws its cached career at once; when the fresh read returns the same career, that
    // frame stays (no second boot). Only a changed career is drawn again.
    // An "unavailable" career is drawn as loading while the read runs, so it is always drawn again when the read ends.
    const token=++onlineToken,lifetime=onlineLifetimes[screen],before=v10ModelText(v10OnlineModel());onlineLoading=true;v10Redraw();
    try{
      await root.loadRuntimeScript("rivalry-legacy-v10","js/rivalryLegacyV10.js",()=>Boolean(root.CareerModeRivalryLegacyV10));
      await root.CareerModeRivalryLegacyV10.loadCareerModel(()=>token===onlineToken&&onlineLifetimes[screen]===lifetime&&root.document?.getElementById?.(screen)?.classList?.contains("hidden")!==true);
    }finally{if(token===onlineToken){onlineLoading=false;const after=v10OnlineModel();if(before===null||after?.status==="unavailable"||before!==v10ModelText(after))v10Redraw();}}
  }
  // Called by statistics.js / trophyRoom.js after the old open path; getModel returns the screen's current model.
  async function mount(screen,getModel){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const screens=await v10Register();
    getters[screen]=getModel;
    v10WrapRender(screen);
    if(getModel()==null&&v10Seam().isOnlineCareerRoute(v10Identity()))v10LoadOnline(screen).catch(v10Fail);
    return screens.show(screen);
  }
  const openCareerStatistics=getModel=>mount("careerStatistics",getModel);
  const openTrophyRoom=getModel=>mount("trophyRoom",getModel);

  return Object.freeze({contractVersion:1,BASE,STRINGS,FILES,toV10Frame,mount,openCareerStatistics,openTrophyRoom});
});

```
