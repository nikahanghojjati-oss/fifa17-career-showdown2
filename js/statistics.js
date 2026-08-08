/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.11.0
   Current Rivalry Statistics
===================================================== */

function createStatisticsScreen(){
    if(document.getElementById("statistics")){
        return;
    }

    const main = document.querySelector("main");
    if(!main){
        return;
    }

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
    back.addEventListener("click", () => showScreen("dashboard"));

    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

function ensureStatisticsDashboardButton(){
    if(document.getElementById("rivalryStatisticsButton")){
        return;
    }

    const actions = document.querySelector("#dashboard .dashboardActions");
    if(!actions){
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "rivalryStatisticsButton";
    button.className = "menuButton";
    button.textContent = "RIVALRY STATISTICS";
    button.addEventListener("click", openRivalryStatistics);

    const deleteButton = document.getElementById("deleteActiveShowdown");
    if(deleteButton){
        actions.insertBefore(button, deleteButton);
    }else{
        actions.appendChild(button);
    }
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

    const oneNumber = Number(playerOneValue);
    const twoNumber = Number(playerTwoValue);

    if(Number.isFinite(oneNumber) && Number.isFinite(twoNumber) && oneNumber !== twoNumber){
        const oneLeads = higherIsBetter ? oneNumber > twoNumber : oneNumber < twoNumber;
        (oneLeads ? one : two).classList.add("comparisonLeader");
    }

    row.append(one, title, two);
    return row;
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

    rows.forEach(([label, valueOne, valueTwo, higherIsBetter]) => {
        table.appendChild(createComparisonRow(
            label,
            valueOne,
            valueTwo,
            higherIsBetter === undefined ? true : higherIsBetter
        ));
    });

    container.append(heading, table);
}

function getSeasonWinnerText(analytics, row){
    if(row.winner === "playerOne"){
        return `${analytics.playerOne.name} won`;
    }
    if(row.winner === "playerTwo"){
        return `${analytics.playerTwo.name} won`;
    }
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

        const one = createSeasonBar(analytics.playerOne.name, row.playerOneScore);
        const two = createSeasonBar(analytics.playerTwo.name, row.playerTwoScore, true);

        season.append(label, one, two);
        list.appendChild(season);
    });

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

function renderRivalryStatistics(){
    const content = document.getElementById("rivalryStatisticsContent");
    if(!content){
        return;
    }

    content.replaceChildren();

    if(!currentShowdown){
        const empty = document.createElement("div");
        empty.className = "analyticsEmpty";
        empty.textContent = "No active showdown is available.";
        content.appendChild(empty);
        return;
    }

    const analytics = buildRivalryAnalytics(currentShowdown);
    if(!analytics){
        return;
    }

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
    content.appendChild(hero);

    renderRivalryHighlights(content, analytics);
    renderRivalryComparison(content, analytics);
    renderSeasonProgression(content, analytics);
}

function openRivalryStatistics(){
    if(!currentShowdown){
        return;
    }

    renderRivalryStatistics();
    showScreen("statistics");
}

function initializeStatistics(){
    createStatisticsScreen();
    ensureStatisticsDashboardButton();
}

window.initializeStatistics = initializeStatistics;
window.renderRivalryStatistics = renderRivalryStatistics;
window.openRivalryStatistics = openRivalryStatistics;
