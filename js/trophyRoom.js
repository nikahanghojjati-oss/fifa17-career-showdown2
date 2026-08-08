/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.11.0
   Trophy Room and All-Time Records
===================================================== */

function createTrophyRoomScreen(){
    if(document.getElementById("trophyRoom")){
        return;
    }

    const main = document.querySelector("main");
    if(!main){
        return;
    }

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
    back.textContent = "BACK TO MAIN MENU";
    back.addEventListener("click", () => showScreen("mainMenu"));

    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function findTrophyRoomMenuButton(){
    return document.getElementById("trophyRoomButton") || Array.from(
        document.querySelectorAll("#mainMenu .menuButton")
    ).find(button => button.textContent.trim().toUpperCase() === "TROPHY ROOM") || null;
}

function wireTrophyRoomButton(){
    const button = findTrophyRoomMenuButton();
    if(!button || button.dataset.trophyRoomReady === "true"){
        return;
    }

    button.dataset.trophyRoomReady = "true";
    button.addEventListener("click", openTrophyRoom);
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

function createCareerStandingsTable(managers){
    const wrapper = document.createElement("div");
    wrapper.className = "careerStandings";

    const header = document.createElement("div");
    header.className = "careerStandingsRow header";
    ["#", "Manager", "Showdowns", "Season W-D-L", "Points", "Trophies"].forEach(text => {
        const cell = document.createElement("span");
        cell.textContent = text;
        header.appendChild(cell);
    });
    wrapper.appendChild(header);

    managers.forEach((manager, index) => {
        const row = document.createElement("div");
        row.className = "careerStandingsRow";

        const values = [
            index + 1,
            manager.name,
            `${manager.showdownWins}-${manager.showdownDraws}-${manager.showdownLosses}`,
            `${manager.seasonWins}-${manager.seasonDraws}-${manager.seasonLosses}`,
            manager.totalPoints,
            manager.totalTrophies
        ];

        values.forEach((value, cellIndex) => {
            const cell = document.createElement(cellIndex === 1 ? "strong" : "span");
            cell.textContent = value;
            row.appendChild(cell);
        });

        wrapper.appendChild(row);
    });

    return wrapper;
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

function renderTrophyRoom(){
    const content = document.getElementById("trophyRoomContent");
    if(!content){
        return;
    }

    content.replaceChildren();
    const analytics = buildCareerAnalytics();

    const summary = document.createElement("div");
    summary.className = "analyticsStatsGrid trophyRoomSummary";
    summary.append(
        createAnalyticsStat("COMPLETED SHOWDOWNS", analytics.totals.showdowns),
        createAnalyticsStat("SEASONS PLAYED", analytics.totals.seasons),
        createAnalyticsStat("TROPHIES WON", analytics.totals.trophies),
        createAnalyticsStat("SHOWDOWN POINTS", analytics.totals.points)
    );
    content.appendChild(summary);

    if(!analytics.managers.length){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "The Trophy Room is empty. Complete a showdown and its managers, trophies, records, and career statistics will appear here automatically.";
        content.appendChild(empty);
        return;
    }

    const standingsHeading = document.createElement("h3");
    standingsHeading.className = "analyticsSectionHeading";
    standingsHeading.textContent = "CAREER TABLE";
    content.append(standingsHeading, createCareerStandingsTable(analytics.managers));

    const cabinetsHeading = document.createElement("h3");
    cabinetsHeading.className = "analyticsSectionHeading";
    cabinetsHeading.textContent = "MANAGER CABINETS";
    content.appendChild(cabinetsHeading);

    const cabinets = document.createElement("div");
    cabinets.className = "managerCabinetList";
    analytics.managers.forEach((manager, index) => {
        cabinets.appendChild(createManagerCabinet(manager, index + 1));
    });
    content.appendChild(cabinets);

    renderAllTimeRecords(content, analytics);
}

function openTrophyRoom(){
    renderTrophyRoom();
    showScreen("trophyRoom");
}

function initializeTrophyRoom(){
    createTrophyRoomScreen();
    wireTrophyRoomButton();
}

window.initializeTrophyRoom = initializeTrophyRoom;
window.renderTrophyRoom = renderTrophyRoom;
window.openTrophyRoom = openTrophyRoom;
