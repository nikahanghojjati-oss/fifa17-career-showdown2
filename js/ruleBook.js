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
            "Both managers play in the same league.",
            "Each manager keeps the same club for the whole Showdown.",
            "A Showdown lasts 1, 3, 5 or 10 seasons.",
            "The most Showdown points across all seasons wins. Equal totals are a draw."
        ]),
        createRuleSection("02", "MATCH PLAY", [
            "Career Mode matches are simulated.",
            "You may play or simulate a Champions League or Europa League final.",
            "You may play or simulate the main domestic cup final.",
            "Training (FIFA 17's player training) is allowed in 5- and 10-season Showdowns; not in 1- or 3-season Showdowns."
        ]),
        createRuleSection("03", "TRANSFER CHALLENGE", [
            "Each manager may sign up to three players per season.",
            "The Transfer Challenge window lasts 15 minutes.",
            "In FIFA 17, you can sign players up to the transfer deadline.",
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses.",
            "Each guess is a league or a nationality.",
            "A signing that matches a guess must be released before the season starts."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "DRAWS", [
            "More Showdown points in a season wins that season.",
            "Same Showdown points in a season, including 0-0, means the season is a draw.",
            "There is no tiebreak: league position, league points and goals never decide a season or a Showdown.",
            "Equal Showdown totals make the Showdown a draw."
        ]),
        createRuleSection("06", "CONNECTION & RECOVERY", [
            "Daniel and Nik connect once before their first Showdown. After that, the same account and browser carry on.",
            "A new browser may need to connect again before you play.",
            "The browser keeps a copy for recovery only. It is not a separate way to play.",
            "Enter results by hand from FIFA 17. No screenshots or match notes needed."
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
        ["100 league points and/or 100 league goals", "+1 MAX"],
        ["League Top Scorer and/or Top Assist", "+1 MAX"]
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
        "Golden Showdown: score 110 points in a 10-season Showdown (11 in every season) to earn a gold trophy.",
        "Best possible season: 11, which needs the Champions League. A Europa League season tops out at 9."
    ].forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        notes.appendChild(item);
    });

    article.append(header, scoring, maximum, notes);
    return article;
}

function openRuleBook(){
    createRuleBookScreen();
    showScreen("ruleBook");
    window.CareerModeV10Screens?.expect?.("ruleBook");
    window.loadRuntimeScript("rules-settings-v10", "js/rulesSettingsV10.js", () => Boolean(window.CareerModeRulesSettingsV10)).then(() => window.CareerModeRulesSettingsV10.install()).catch(() => { window.CareerModeV10Screens?.settle?.("ruleBook"); });
}

window.openRuleBook = openRuleBook;