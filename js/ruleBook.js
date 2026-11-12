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
        <p>Daniel and Nik. One league. Fixed clubs. One Showdown.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "ruleBookGrid";

    // r91 / 2.4.0 (Nik 2026-11-11): the cards follow the order a manager meets each step, from the setup to the end of the
    // Showdown, written for a first-time reader. Only today's rules, no dates. Every number is checked against the code:
    // js/chamberMen.js + js/chamberMenStep.js (7 rounds, 10 s), js/squadSheet.js (XI, 7 subs, board = XI + subs 1-4, season 2+
    // departures and overalls), js/rosterRoulette.js (7 chambers, Daniel first), js/iconGuess.js (STAGES, CHIPS) with
    // data/icons.js (LIST_VERSION 1), js/sharedTransferChallenge.js (3 signings, 3 guesses, 15 minutes), js/scoring.js.
    // Rules FIFA 17 enforces itself stay in the engine and off the page (Nik 2026-10-29).
    grid.append(
        createRuleSection("01", "THE SHOWDOWN", [
            "Career Mode Showdown is a game for two managers: Daniel and Nik.",
            "Daniel starts every Showdown and picks its length: 1, 3, 5 or 10 seasons. Nik joins from Home.",
            "The league wheel lands on one of five leagues: Premier League, LaLiga, Bundesliga, Serie A or Ligue 1.",
            "Club Assignment then gives you each a different club from that league. It stays yours for the whole Showdown.",
            "Every season runs in the same order: Chamber Men, Squad Management, Roster Russian Roulette, Prime Pack, Transfer War, Squad Management again, then the season itself and Season Results."
        ]),
        createSpecialPlayerRuleSection(),
        createRuleSection("03", "CHAMBER MEN", [
            "Every season opens with a penalty shootout: 7 shots each.",
            "It goes turn by turn. Daniel shoots while Nik keeps, then Nik shoots while Daniel keeps, for 7 rounds.",
            "The shooter picks left, middle or right, and the keeper picks where to dive. Neither sees the other's pick until both have locked in.",
            "The keeper saves the shot only by picking the same direction. Any other pick is a goal.",
            "Once your rival has locked in, you have 10 seconds. Run out of time and your shot is a miss, or as keeper you stay in the middle.",
            "Every goal you score loads one live round into your rival's roulette cylinder for this season.",
            "Chamber Men scores no Showdown points."
        ]),
        // r91 Squad Management (Nik 2026-11-11 15:29 and 15:31 UTC): the screen mirrors each manager's own FIFA 17 save;
        // season 1 is the launch squad at launch overalls, departures and overalls change from season 2 (js/squadSheet.js).
        createRuleSection("04", "SQUAD MANAGEMENT", [
            "Squad Management mirrors your FIFA 17 career. Set the same formation and squad as in your own Career Mode save for this Showdown: the same players, the same overalls and the same departures.",
            "You visit it twice a season: after Chamber Men, and again after the Transfer War. The last season has no visit after the Transfer War.",
            "Your squad is a Starting XI in a formation, 7 substitutes and the reserves, as on FIFA 17's squad screen.",
            "Your Starting XI and your first 4 substitutes are the 15 players on your roulette board.",
            "Season 1 is your club's FIFA 17 launch squad at its launch overalls. You can change the formation and move players around, but only within those 15.",
            "From season 2, mark every player who has left: sold, swapped, contract ended, retired or loaned out. A loaned player comes back the next season.",
            "From season 2, also set each player's overall to match your save.",
            "A player who leaves is replaced by the best player in his line: goalkeepers, defenders, midfielders or attackers.",
            "From season 2 the best players always make the 15. No reserve sits out while a weaker player in his line plays, and your first 4 substitutes are the best 4 players left after the XI.",
            "A signing you keep in the Transfer War joins your squad and starts if he is better than a starter in a position he can play.",
            "Players can cover nearby positions too, such as RM and RW, or CAM and CF.",
            "If no goalkeeper is left, your best outfielder goes in goal until you sign one.",
            "The roulette starts once you have both locked your squads."
        ]),
        createRuleSection("05", "ROSTER RUSSIAN ROULETTE", [
            "Daniel and then Nik spin the roulette: one trigger pull each.",
            "Your cylinder has 7 chambers, with one live round for each goal your rival scored in Chamber Men. So your chance of a hit is his goals out of 7: 0 goals never fires and 7 always does.",
            "The roulette aims at the 15 on your board, and each of them has the same chance.",
            "A player who is hit must be released in FIFA 17. He never comes back, and you can never sign him again.",
            "After the Transfer War, his place goes to a new signing in his line if you kept one, otherwise to the best player left in his line.",
            "A place stays empty only if your club runs out of players. The bullet only ever hits a real player."
        ]),
        createPrimePackRuleSection(),
        createRuleSection("07", "TRANSFER WAR", [
            "Each of you may sign up to three players a season.",
            "The transfer window lasts 15 minutes. In FIFA 17 itself, you can sign players right up to the transfer deadline.",
            "Both managers can agree to close the window early. One manager cannot close it alone.",
            "Enter each signing with his league, his nationality and his FIFA 17 overall.",
            "Start typing a name and the game suggests players from the full FIFA 17 launch list: all 17,597 players, free agents included. Any other name can still be typed.",
            "Only you see your signings' overalls. They are never part of a guess.",
            "Then you each get three guesses at your rival's signings. Each guess is a league or a nationality.",
            "A guess that matches one of your signings releases him before the season starts, and you can never sign him again."
        ]),
        createRuleSection("08", "PLAYING THE SEASON", [
            "Now play the season in FIFA 17. Skip pre-season.",
            "Season 1: both clubs play in the Champions League. Set this up in FIFA by redrawing the Champions League groups twice.",
            "Simulate every match, apart from three finals you may play or simulate: the Champions League final, the Europa League final and the main domestic cup final.",
            "1- and 3-season Showdowns: your Special Player is the only player you can train.",
            "5- and 10-season Showdowns: all players can be trained."
        ]),
        createScoringRuleSection(),
        // r89 Sacked (Nik 2026-11-03): a sacking ends the Showdown after that season; the points so far decide.
        createRuleSection("10", "END OF THE SHOWDOWN", [
            "The Showdown ends after its last season, or earlier if a manager is sacked.",
            "Most Showdown points across all seasons wins. Equal totals are a draw.",
            "Either manager, or both, can be sacked. Any sacking ends the Showdown after that season: no more seasons are played.",
            "Every point up to then counts, so a sacked manager can still win.",
            "Sacked in the last season still counts as the full length, so a Golden Showdown is still possible.",
            "Every finished Showdown, sacked ones too, counts on Legacy, the Trophy Room and every stats screen. A sacked one is marked SACKED."
        ]),
        createRuleSection("11", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "Daniel and Nik stay paired between Showdowns. UNPAIR in Settings ends the pairing.",
            "Your Showdown is saved online. If a phone reloads or loses signal, open the game again and carry on from Home."
        ])
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
    article.append(createRuleSectionHeader(number, title), createRuleList(rules));
    return article;
}

// A numbered card header, shared by every card.
function createRuleSectionHeader(number, title){
    const header = document.createElement("div");
    header.className = "ruleSectionHeader";
    const numberElement = document.createElement("span");
    numberElement.textContent = number;
    const heading = document.createElement("h3");
    heading.textContent = title;
    header.append(numberElement, heading);
    return header;
}

// A plain list of rule lines (one idea per line).
function createRuleList(rules, className = ""){
    const list = document.createElement("ul");
    if(className){ list.className = className; }
    rules.forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        list.appendChild(item);
    });
    return list;
}

// Two-column rows (label, value) in the scoring table's look.
function createRuleTable(rows, className = "ruleScoreTable"){
    const table = document.createElement("div");
    table.className = className;
    rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        const labelElement = document.createElement("span");
        const valueElement = document.createElement("strong");
        labelElement.textContent = label;
        valueElement.textContent = value;
        row.append(labelElement, valueElement);
        table.appendChild(row);
    });
    return table;
}

// Season Results: how a season is entered and what it scores (js/scoring.js; Europa League +3 never with the
// Champions League, which FIFA 17 already rules out). The table is the gold hero card.
function createScoringRuleSection(){
    const article = document.createElement("article");
    article.className = "ruleSection scoringRuleSection";

    const steps = createRuleList([
        "When the season is over in FIFA 17, each of you types your own results into Season Results. No screenshots or notes needed.",
        "Sacked in FIFA 17? Tick \u201cI was sacked this season\u201d on your own card. PUBLISH asks once more, because it is final.",
        "The season counts once you have both published."
    ]);

    const scoring = createRuleTable([
        ["Champions League winner", "+5"],
        ["Europa League winner", "+3"],
        ["Domestic league winner", "+3"],
        ["Main domestic cup winner", "+1"],
        ["100 league points or 100 league goals", "+1 MAX"],
        ["League top scorer or top assist", "+1 MAX"],
        // Prime Pack (Nik 2026-11-01): 4, 3, 2 or 1 by the stage of the first right name (js/iconGuess.js STAGES).
        ["Prime Pack: first right name (4, 3, 2 or 1 by stage)", "+4 MAX"]
    ]);

    const maximum = document.createElement("div");
    maximum.className = "ruleScoreMaximum";
    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>15</strong>";

    // r84 Golden Showdown: its own gold line under the season maximum (Nik 2026-10-26). r87: 15 a season, so 150.
    const golden = document.createElement("p");
    golden.className = "ruleGoldenShowdown";
    const goldenLabel = document.createElement("strong");
    goldenLabel.textContent = "GOLDEN SHOWDOWN";
    const goldenText = document.createElement("span");
    goldenText.textContent = "Score 150 points in a 10-season Showdown (15 in every season) to win the gold trophy.";
    golden.append(goldenLabel, goldenText);

    article.append(createRuleSectionHeader("09", "SEASON RESULTS"), steps, scoring, maximum, golden);
    return article;
}

// r86 Special Player (Nik 2026-10-29), drawn right after Club Assignment (js/marqueePlayer.js, data/marqueePlayers.js:
// the top 300 of the FIFA 17 launch database by potential, never from the manager's own club, #1173). The training rule
// lives in card 08. This Showdown's two chips are filled in when the Rule Book opens (renderRuleBookSpecialPlayers).
function createSpecialPlayerRuleSection(){
    const article = createRuleSection("02", "SPECIAL PLAYER", [
        "Right after Club Assignment, you each draw one Special Player.",
        "He comes from the top 300 FIFA 17 players by potential, from the launch squads. He never plays for your own club, and you and your rival never draw the same player.",
        "Both draws are shown on the reveal screen, and each Special Player stays with his manager for the whole Showdown.",
        "Career Start shows his FIFA 17 club, so you can sign him in your career.",
        "He is a free extra signing. He never counts toward your three Transfer War signings, and your rival's guesses can never release him.",
        "He never appears in Squad Management or on the roulette board, so the roulette can never hit him.",
        "He scores no Showdown points. His SP chip sits next to your name on the career screens."
    ]);
    article.className = "ruleSection specialPlayerRuleSection";

    const now = document.createElement("p");
    now.className = "ruleSpecialPlayer ruleSpecialPlayerNow";
    now.hidden = true;
    const label = document.createElement("strong");
    const tag = document.createElement("span");
    tag.className = "ruleSpecialPlayerTag";
    tag.textContent = "SP";
    const labelText = document.createElement("span");
    labelText.textContent = " THIS SHOWDOWN";
    label.append(tag, labelText);
    const live = document.createElement("span");
    live.className = "ruleSpecialPlayerLive spChipPair";
    live.hidden = true;
    now.append(label, live);
    article.appendChild(now);
    return article;
}

// r87 Prime Pack (Nik 2026-11-01), every season after the roulette and before the Transfer War. The round is js/iconGuess.js
// (STAGES: 25/20/20/20 s, points 4/3/2/1; CHIPS = 2 guesses a card; the server's write time decides). The player comes from
// data/icons.js: male outfield players, one card each (Nik 2026-11-11 15:09 UTC: his highest-rated card; on a tie the
// Legend or Icon, then the newer game), drawn without repeats in a Showdown. The table counts the list by card type and
// the games the cards come from; tests/contracts/job-1048-rulebook-review-text-contracts.cjs checks it against the list.
function createPrimePackRuleSection(){
    const article = document.createElement("article");
    article.className = "ruleSection primePackRuleSection";

    const round = createRuleList([
        "After the roulette, you both race to name the same masked player.",
        "Stage 1 shows his position and one of his six card stats. A right name in stage 1 scores 4 points.",
        "Each new stage shows one more stat and is worth 1 point less: 3, then 2, then 1.",
        "You have 25 seconds to guess in stage 1, and 20 seconds in each of stages 2, 3 and 4.",
        "You have two guesses for the whole card. A name that is not on the list does not use one.",
        "Only the first right name scores, timed by the server, never by a phone. One manager wins 4, 3, 2 or 1 points, or nobody does. Never both.",
        "Stage 5 is the reveal, with no guessing: the last two stats, his name, his flag and his overall.",
        "Which stats show, and in what order, is random. The numbers are always his real card stats."
    ]);

    const pool = createRuleList([
        "The pack holds 232 male outfield players, from 84 to 98 overall. Nobody comes up twice in one Showdown.",
        "Each player has one card only: his highest-rated one, whether Legend, Icon, Hero or Hall of FUT. On a tie, the Legend or Icon card is used, then the newer game's card."
    ], "rulePackNotes");

    const cards = createRuleTable([
        ["Legend · FIFA 17", "16"],
        ["Icon Prime · FIFA 22 and FIFA 23", "103"],
        ["Icon Base · FC 27", "26"],
        ["Hero · FC 25, FC 26 and FC 27", "69"],
        ["Hall of FUT · FC 27", "18"]
    ], "ruleScoreTable rulePackTable");

    article.append(createRuleSectionHeader("06", "PRIME PACK"), round, pool, cards);
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
    const line = slot.closest ? slot.closest(".ruleSpecialPlayerNow") : null;
    if(chips.length !== 2){ slot.hidden = true; if(line){ line.hidden = true; } return false; }
    for(const [name, chip] of chips){
        const who = document.createElement("span");
        who.append(document.createTextNode(name), chip);
        slot.appendChild(who);
    }
    slot.hidden = false;
    if(line){ line.hidden = false; }
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