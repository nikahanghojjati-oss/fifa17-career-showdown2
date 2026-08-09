/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0
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

function renderTrophyRoom(force = false){
    const content = document.getElementById("trophyRoomContent");
    if(!content){ return; }

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

    if(!analytics.managers.length){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "The Trophy Room is empty. Complete a showdown and its managers, trophies, records, and career statistics will appear here automatically.";
        fragment.appendChild(empty);
        content.replaceChildren(fragment);
        trophyRoomRenderKey = nextKey;
        return;
    }

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

    const recordsHost = document.createElement("div");
    renderAllTimeRecords(recordsHost, analytics);
    while(recordsHost.firstChild){ fragment.appendChild(recordsHost.firstChild); }

    content.replaceChildren(fragment);
    trophyRoomRenderKey = nextKey;
}

function openTrophyRoom(){
    createTrophyRoomScreen();
    renderTrophyRoom();
    showScreen("trophyRoom");
}

window.renderTrophyRoom = renderTrophyRoom;
window.openTrophyRoom = openTrophyRoom;
