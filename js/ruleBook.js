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
        <strong>THE LOCKED COMPETITION RULES</strong>
        <p>Two managers. One league. Permanent clubs. Every season becomes part of the rivalry.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "ruleBookGrid";

    grid.append(
        createRuleSection("01", "SHOWDOWN FORMAT", [
            "Version 1.0 is a two-player competition on one device.",
            "Each manager plays a separate FIFA 17 Career Mode save.",
            "Both managers compete in the same selected league.",
            "The assigned clubs remain fixed for the entire showdown, across every season.",
            "A showdown may contain 1, 3, 5, or 10 seasons."
        ]),
        createRuleSection("02", "MATCH PLAY", [
            "Career Mode matches are simulated.",
            "A Champions League final may be played or simulated by the manager.",
            "The main domestic cup final may be played or simulated by the manager.",
            "No other match-play exceptions are part of the current rules."
        ]),
        createRuleSection("03", "TRANSFER CHALLENGE", [
            "Each manager may sign a maximum of three players per season.",
            "The transfer window challenge lasts 15 minutes.",
            "The opponent receives three guesses.",
            "Each guess must be either a league or a nationality.",
            "If a signing matches a correct guess, that signing must be released before the season begins."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "TIEBREAK", [
            "The approved fallback applies when both managers score zero showdown points in a season.",
            "The manager with the better league finishing position wins the season.",
            "If both managers finish in the same league position, the manager with more league points wins.",
            "No goal-difference, goals-scored, or head-to-head tiebreak is used."
        ]),
        createRuleSection("06", "VERSION 1.0 SCOPE", [
            "Progress is stored locally in the browser on the current device.",
            "There is no account system, cloud save, or online multiplayer in Version 1.0.",
            "QR joining and multi-device real-time play are future ideas and are not part of the current build.",
            "Results are entered manually from FIFA 17; screenshots and match notes are not required."
        ])
    );

    const actions = document.createElement("div");
    actions.className = "ruleBookActions";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
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

    article.append(header, scoring, maximum);
    return article;
}

function openRuleBook(){
    createRuleBookScreen();
    showScreen("ruleBook");
}

window.openRuleBook = openRuleBook;
