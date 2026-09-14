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
        <p>Nik and Daniel. One league. Permanent clubs. Every season becomes part of the shared online rivalry.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "ruleBookGrid";

    grid.append(
        createRuleSection("01", "SHOWDOWN FORMAT", [
            "Career Mode Showdown is a two-player online rivalry for Nik and Daniel.",
            "Each manager plays a separate FIFA 17 Career Mode save while the Showdown state is shared online.",
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
        createRuleSection("06", "ONLINE PLAY & DEVICES", [
            "Every normal Showdown is shared online between Nik and Daniel; there is no separate local-only gameplay mode.",
            "Google sign-in and a registered browser or device provide the private connection. A device can be forgotten and registered again when needed.",
            "Browser storage may still be used internally for safe caching, recovery and rollback, but it is not a separate user-facing Showdown mode.",
            "Pairing, reconciliation and recovery details stay behind the normal gameplay flow unless a recovery action is genuinely required.",
            "The online service uses the Firebase Spark free tier; billing remains off.",
            "Results are entered manually from FIFA 17; screenshots and match notes are not required."
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