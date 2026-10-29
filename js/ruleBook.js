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
            "Player training is allowed only in 5- and 10-season Showdowns."
        ]),
        createRuleSection("03", "TRANSFER CHALLENGE", [
            "Each of you may sign up to three players a season.",
            "The transfer window lasts 15 minutes.",
            "In FIFA 17, you can sign players up to the transfer deadline.",
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses. Each guess is a league or a nationality.",
            "If a guess matches one of your signings, release that player before the season starts."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "DRAWS", [
            "More Showdown points in a season wins that season.",
            "Same Showdown points in a season, even 0-0, means the season is a draw.",
            "There is no tiebreak. League position, points and goals never decide a winner.",
            "Equal Showdown totals mean the Showdown is a draw."
        ]),
        createRuleSection("06", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "The browser keeps a backup copy for recovery. You can't play from it.",
            "Type in results by hand from FIFA 17. No screenshots or notes needed."
        ])
    );

    const actions = document.createElement("div");
    actions.className = "ruleBookActions";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.setAttribute("data-smart-back", "");
    back.textContent = "BACK TO MAIN MENU";

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

    // r80 Europa League (owner rules, 2026-10-19).
    const notes = document.createElement("ul");
    notes.className = "ruleScoreNotes";
    [
        "You can't win the Champions League and the Europa League in the same season. Winning each in different seasons counts both.",
        "Season 1: both clubs play in the Champions League. Set this up in FIFA by redrawing the Champions League groups twice.",
        "A club that finishes 3rd in its Champions League group drops into the Europa League and can still win it.",
        "A club can also qualify for the Europa League by its league position.",
        "Only winning scores. Qualifying or taking part scores nothing.",
        "Best possible season: 11, which needs the Champions League. A Europa League season tops out at 9."
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
    specialText.textContent = "At the start of every Showdown each manager draws one FIFA 17 player, shown on the reveal screen. Flavour only: it scores no points.";
    const specialLive = document.createElement("span");
    specialLive.className = "ruleSpecialPlayerLive spChipPair";
    specialLive.hidden = true;
    special.append(specialLabel, specialText, specialLive);

    article.append(header, scoring, maximum, golden, special, notes);
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