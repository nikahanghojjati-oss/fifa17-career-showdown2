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
        // r88 (Nik 2026-11-03): every season step has its own card, in season order: Chamber Men, Roster Russian Roulette,
        // Prime Pack, then the Transfer War. Chamber Men is turn by turn (js/chamberMen.js); the Prime Pack lines match
        // js/iconGuess.js (STAGES, CHIPS) and the roulette lines js/rosterRoulette.js.
        createRuleSection("03", "CHAMBER MEN", [
            "Every season, before the Roster Roulette, Daniel and Nik take a penalty shootout: 7 shots each. It plays in Showdowns started on version 2.1.0 or later.",
            "It goes turn by turn: Daniel shoots and Nik keeps, then Nik shoots and Daniel keeps, for 7 rounds. Nobody shoots and keeps on the same kick.",
            "The shooter picks LEFT, MIDDLE or RIGHT for his shot. The keeper picks where to dive. Neither sees the other's pick until both have locked in.",
            "The shot goes in when the keeper dives the other way. Both phones show the kick, then the next one starts.",
            "Once your rival has locked in, you have 10 seconds. Out of time, a shot is a miss and a keeper stays in the middle.",
            "Each goal you score loads one live round into your rival's roulette cylinder for that season. 0 or 7 goals still spin.",
            "Chamber Men scores no Showdown points."
        ]),
        // r87 Russian Roster Roulette (Nik 2026-10-30: "in rule screen mention special player wont get hit").
        createRuleSection("04", "ROSTER RUSSIAN ROULETTE", [
            "Every season, before the Transfer War, Daniel and then Nik spin the roulette: one trigger pull each.",
            "Your cylinder has seven chambers. In a Chamber Men Showdown it holds one live round for each goal your rival scored, so your chance of a hit is his goals out of 7: 0 goals never fires, 7 always does. In older Showdowns it holds one bullet.",
            "A hit releases one player from your starting XI or 4 subs: release him in FIFA 17. A player the roulette shot never comes back and can't be signed back. Your Special Player is never on your board, so he is never hit.",
            "Your board starts as your FIFA 17 launch squad. Kept signings, at the overall you typed, replace any weaker starter or sub, even when nobody was lost.",
            "A lost player's place goes first to that window's signing in his line, however weak, then to your best sub. No keeper left: your best outfielder goes in goal until you sign one.",
            "Replaced players wait in hidden reserves, off the board, and come back when better players are lost. A signing your rival guessed never joins your board: you can never sign him again.",
            "Only if your club runs out of players does a place stay empty: the roulette still spins, and the bullet only ever hits a real player."
        ]),
        createRuleSection("05", "PRIME PACK", [
            "Every season, after the roulette and before the Transfer War, you both race to name one masked Icon.",
            "Stage 1 shows his position and one real card stat. A right name in stage 1 scores 4.",
            "Each later stage adds one more stat and is worth 1 point less: 3, then 2, then 1.",
            "You have 25 seconds to guess in stage 1 and 20 seconds in stages 2, 3 and 4.",
            "Each manager has two guesses for the whole card.",
            "Which stats show is random; the values never are.",
            "Only the first right name scores, so one manager wins 4, 3, 2 or 1 points, or nobody does. Never both.",
            "Stage 5 is the reveal, with no guessing: the last two stats, his name, flag and overall."
        ]),
        createRuleSection("06", "TRANSFER WAR", [
            "Each of you may sign up to three players a season.",
            "The transfer window lasts 15 minutes.",
            "In FIFA 17, you can sign players up to the transfer deadline.",
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses. Each guess is a league or a nationality.",
            "If a guess matches one of your signings, release that player before the season starts.",
            "A player your rival guesses is released, and you can never sign him again.",
            "Type each signing's FIFA 17 overall. Only you see it, and it is never part of a guess.",
            "Your Special Player is a free extra signing: he never counts toward the three, and guesses never release him."
        ]),
        createScoringRuleSection(),
        createRuleSection("08", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "The browser keeps a backup copy for recovery. You can't play from it.",
            "Type in results by hand from FIFA 17. No screenshots or notes needed."
        ]),
        createSpecialPlayerRuleSection(),
        // r89 Sacked (Nik 2026-11-03): a sacking ends the Showdown after that season; the points so far decide.
        createRuleSection("10", "SACKED", [
            "Sacked in FIFA 17? Tick \u201cI was sacked this season\u201d on your own Season Results card. PUBLISH asks once more, because it is final.",
            "Either manager, or both, can be sacked. Any sacking ends the Showdown after that season: no more seasons are played.",
            "Every point up to then counts. Most Showdown points wins, even for a sacked manager. Equal totals are a draw.",
            "A sacked Showdown is a completed Showdown: it counts on History, Legacy, the Trophy Room and every stats screen, marked SACKED.",
            "Sacked in the last season still counts as the full length, so a Golden Showdown is still possible."
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
    number.textContent = "07";

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
        ["League top scorer or top assist", "+1 MAX"],
        // Prime Pack (Nik 2026-11-01): once a season, before the transfer window, in Showdowns that play it. The first right
        // name scores 4 with one stat showing, 3 with two, 2 with three, 1 with four.
        ["Prime Pack: first to name the masked Icon (4, 3, 2 or 1 by stage)", "+4 MAX"]
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
    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>15</strong>";

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
    // r87 Prime Pack (G Lead and Nik 2026-11-01): 15 a season, so 150 (no other Golden total).
    goldenText.textContent = "Score 150 points in a 10-season Showdown (15 in every season) to win the gold trophy.";
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
    specialText.textContent = "Each manager draws one FIFA 17 player at the start of every Showdown. Your Special Player scores no points. Full rules in card 09.";
    const specialLive = document.createElement("span");
    specialLive.className = "ruleSpecialPlayerLive spChipPair";
    specialLive.hidden = true;
    special.append(specialLabel, specialText, specialLive);

    // r87 Prime Pack (Nik 2026-11-01): its own line in the same style. The values shown are the Icon's real card stats from the
    // list; only which of the six shows at each stage is random (each once). The flag comes only with the full reveal.
    const primePack = document.createElement("p");
    primePack.className = "ruleGoldenShowdown rulePrimePack";
    const primePackLabel = document.createElement("strong");
    primePackLabel.textContent = "PRIME PACK";
    const primePackText = document.createElement("span");
    primePackText.textContent = "Name the masked Icon first for 4, 3, 2 or 1 points. Nobody right after stage 4 scores 0. Full rules in card 05.";
    primePack.append(primePackLabel, primePackText);

    article.append(header, scoring, maximum, golden, special, primePack, notes);
    return article;
}

// r86 Special Player rules (Nik 2026-10-29 15:24 UTC): the full card, last, with the training rule by length.
// The draws card is gone (Nik 2026-10-29 21:10 UTC): the no-tiebreak rules stay in scoring.js, not on the page.
function createSpecialPlayerRuleSection(){
    const article = createRuleSection("09", "SPECIAL PLAYER", [
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