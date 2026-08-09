/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0
   Career + Current Rivalry Statistics Presentation
===================================================== */

let rivalryStatisticsRenderKey = null;
let careerStatisticsRenderKey = null;

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
    back.textContent = "BACK TO MAIN MENU";

    actions.append(rivalryButton, trophyButton, back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function ensureStatisticsDashboardButton(){
    if(document.getElementById("rivalryStatisticsButton")){ return; }
    const actions = document.querySelector("#dashboard .dashboardActions");
    if(!actions){ return; }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "rivalryStatisticsButton";
    button.className = "menuButton";
    button.textContent = "RIVALRY STATISTICS";
    button.addEventListener("click", openRivalryStatistics);

    const deleteButton = document.getElementById("deleteActiveShowdown");
    if(deleteButton){ actions.insertBefore(button, deleteButton); }
    else { actions.appendChild(button); }
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

function renderCareerStatistics(force = false){
    const content = document.getElementById("careerStatisticsContent");
    if(!content){ return; }

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

    if(!analytics.managers.length){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "Career Statistics will build automatically after the first completed showdown. Current-showdown statistics remain available from Showdown Home.";
        fragment.appendChild(empty);
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
        empty.textContent = "No season has been completed yet. Statistics will build automatically as seasons are finished.";
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

function renderRivalryStatistics(force = false){
    const content = document.getElementById("rivalryStatisticsContent");
    if(!content){ return; }

    const nextKey = getRivalryStatisticsRenderKey();
    if(!force && rivalryStatisticsRenderKey === nextKey && content.childElementCount){
        return;
    }

    if(!currentShowdown){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "No active showdown is available.";
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

function openCareerStatistics(){
    createCareerStatisticsScreen();
    renderCareerStatistics();
    showScreen("careerStatistics");
}

function openRivalryStatistics(){
    if(!currentShowdown){ return; }
    createStatisticsScreen();
    renderRivalryStatistics();
    showScreen("statistics");
}

function initializeStatistics(){
    ensureStatisticsDashboardButton();
}

window.initializeStatistics = initializeStatistics;
window.renderCareerStatistics = renderCareerStatistics;
window.openCareerStatistics = openCareerStatistics;
window.createCareerStandingsTable = createCareerStandingsTable;
window.renderRivalryStatistics = renderRivalryStatistics;
window.openRivalryStatistics = openRivalryStatistics;
window.createAnalyticsStat = createAnalyticsStat;
