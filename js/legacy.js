/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.9.0
   Legacy Archive Engine
===================================================== */

function archiveCompletedSaveBeforeLegacy(){
    let candidate = currentShowdown;

    if(!candidate){
        candidate = loadSavedShowdown();
    }

    if(candidate && candidate.status === "Completed"){
        const normalized = normalizeShowdown(candidate);
        archiveShowdown(normalized);
    }
}

function getArchivedShowdownWinner(showdown){
    const playerOneScore = Number(showdown.score && showdown.score.playerOne) || 0;
    const playerTwoScore = Number(showdown.score && showdown.score.playerTwo) || 0;

    if(playerOneScore > playerTwoScore){
        return "playerOne";
    }

    if(playerTwoScore > playerOneScore){
        return "playerTwo";
    }

    return "draw";
}

function formatLegacyDate(value){
    if(!value){
        return "Date unavailable";
    }

    const date = new Date(value);
    if(Number.isNaN(date.getTime())){
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
}

function countShowdownTrophies(showdown){
    return (showdown.rounds || []).reduce((total, round) => {
        return total + countPlayerTrophies(round.playerOne) + countPlayerTrophies(round.playerTwo);
    }, 0);
}

function countPlayerTrophies(player){
    if(!player){
        return 0;
    }

    return (player.leaguePosition === 1 ? 1 : 0)
        + (player.domesticCup ? 1 : 0)
        + (player.championsLeague ? 1 : 0);
}

function getLegacyTotals(history){
    return history.reduce((totals, showdown) => {
        totals.showdowns += 1;
        totals.trophies += countShowdownTrophies(showdown);
        totals.points += (Number(showdown.score && showdown.score.playerOne) || 0)
            + (Number(showdown.score && showdown.score.playerTwo) || 0);
        return totals;
    }, { showdowns: 0, trophies: 0, points: 0 });
}

function createLegacyStat(label, value){
    const card = document.createElement("div");
    card.className = "legacyStat";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    card.append(labelElement, valueElement);
    return card;
}

function getWinnerLabel(showdown){
    const winner = getArchivedShowdownWinner(showdown);

    if(winner === "playerOne"){
        return `${showdown.managers.playerOne} wins the showdown`;
    }

    if(winner === "playerTwo"){
        return `${showdown.managers.playerTwo} wins the showdown`;
    }

    return "Showdown finishes level";
}

function getPlayerHonours(player){
    if(!player){
        return "No honours";
    }

    const honours = [];

    if(player.championsLeague){ honours.push("Champions League"); }
    if(player.leaguePosition === 1){ honours.push("League"); }
    if(player.domesticCup){ honours.push("Domestic Cup"); }
    if(player.scoring && player.scoring.performanceBonus){ honours.push("Performance Bonus"); }
    if(player.scoring && player.scoring.awardsBonus){ honours.push("Awards Bonus"); }

    return honours.length ? honours.join(" · ") : "No honours";
}

function getSeasonTransferReleases(showdown, seasonNumber, playerKey){
    const challenge = (showdown.transferChallenges || []).find(
        item => Number(item.seasonNumber) === Number(seasonNumber)
    );

    if(!challenge || !challenge.signings){
        return 0;
    }

    const signings = Array.isArray(challenge.signings[playerKey])
        ? challenge.signings[playerKey]
        : [];

    return signings.filter(signing => signing.release).length;
}

function createSeasonManagerCell(showdown, round, playerKey, alignRight = false){
    const player = round[playerKey];
    const managerName = showdown.managers[playerKey];
    const cell = document.createElement("div");
    cell.className = `legacySeasonManager${alignRight ? " right" : ""}`;

    const primary = document.createElement("div");
    primary.textContent = `${managerName}: #${player.leaguePosition} · ${player.leaguePoints} league pts · ${player.leagueGoals} goals`;

    const honours = document.createElement("div");
    honours.className = "legacySeasonHonours";

    const releases = getSeasonTransferReleases(showdown, round.roundNumber, playerKey);
    const releaseText = releases > 0 ? ` · ${releases} transfer release${releases === 1 ? "" : "s"}` : "";
    honours.textContent = `${getPlayerHonours(player)}${releaseText}`;

    cell.append(primary, honours);
    return cell;
}

function createLegacySeasonRow(showdown, round){
    const row = document.createElement("div");
    row.className = "legacySeasonRow";

    const season = document.createElement("div");
    season.className = "legacySeasonNumber";
    season.textContent = `SEASON ${round.roundNumber}`;

    const playerOne = createSeasonManagerCell(showdown, round, "playerOne");

    const score = document.createElement("div");
    score.className = "legacySeasonScore";
    score.textContent = `${round.playerOne.scoring.total} - ${round.playerTwo.scoring.total}`;

    const playerTwo = createSeasonManagerCell(showdown, round, "playerTwo", true);

    row.append(season, playerOne, score, playerTwo);
    return row;
}

function createLegacyShowdownCard(showdown){
    const card = document.createElement("article");
    card.className = "legacyShowdownCard";

    const top = document.createElement("div");
    top.className = "legacyCardTop";

    const title = document.createElement("div");
    title.className = "legacyCardTitle";

    const heading = document.createElement("h3");
    heading.textContent = showdown.name;

    const subtitle = document.createElement("p");
    const leagueName = showdown.selectedLeague ? showdown.selectedLeague.name : "League unavailable";
    subtitle.textContent = `${leagueName} · ${showdown.rounds.length} season${showdown.rounds.length === 1 ? "" : "s"} · completed ${formatLegacyDate(showdown.completedAt || showdown.archivedAt)}`;

    title.append(heading, subtitle);

    const matchup = document.createElement("div");
    matchup.className = "legacyMatchup";

    const clubOne = document.createElement("strong");
    clubOne.textContent = `${showdown.managers.playerOne} · ${showdown.clubs.playerOne}`;

    const finalScore = document.createElement("span");
    finalScore.textContent = `${showdown.score.playerOne} - ${showdown.score.playerTwo}`;

    const clubTwo = document.createElement("strong");
    clubTwo.textContent = `${showdown.clubs.playerTwo} · ${showdown.managers.playerTwo}`;

    const winner = document.createElement("div");
    winner.className = "legacyWinner";
    winner.textContent = getWinnerLabel(showdown);

    matchup.append(clubOne, finalScore, clubTwo, winner);

    const meta = document.createElement("div");
    meta.className = "legacyCardMeta";
    meta.textContent = `${countShowdownTrophies(showdown)} trophies won\n${showdown.score.playerOne + showdown.score.playerTwo} total showdown points`;
    meta.style.whiteSpace = "pre-line";

    top.append(title, matchup, meta);

    const details = document.createElement("details");
    details.className = "legacyDetails";

    const summary = document.createElement("summary");
    summary.textContent = "VIEW SEASON HISTORY";

    const seasonList = document.createElement("div");
    seasonList.className = "legacySeasonList";

    showdown.rounds.forEach(round => {
        seasonList.appendChild(createLegacySeasonRow(showdown, round));
    });

    details.append(summary, seasonList);

    const actions = document.createElement("div");
    actions.className = "legacyCardActions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "compactButton dangerButton";
    deleteButton.textContent = "DELETE SHOWDOWN";
    deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            `Delete "${showdown.name}" from Legacy? This cannot be undone.`
        );

        if(!confirmed){
            return;
        }

        deleteLegacyShowdown(showdown.id);
        renderLegacy();
    });

    actions.appendChild(deleteButton);
    card.append(top, details, actions);
    return card;
}

function createLegacyDataControls(){
    const controls = document.createElement("section");
    controls.className = "legacyDataControls";

    const heading = document.createElement("h3");
    heading.textContent = "DATA MANAGEMENT";

    const description = document.createElement("p");
    description.textContent = "Delete archived test history without touching the active showdown, or reset all local Career Mode Showdown data for a completely fresh start.";

    const buttons = document.createElement("div");
    buttons.className = "legacyControlButtons";

    const deleteHistory = document.createElement("button");
    deleteHistory.type = "button";
    deleteHistory.className = "compactButton dangerButton";
    deleteHistory.textContent = "DELETE ALL LEGACY HISTORY";
    deleteHistory.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Delete every archived showdown from Legacy? Your current active showdown will remain. This cannot be undone."
        );

        if(!confirmed){
            return;
        }

        clearLegacyHistory();
        renderLegacy();
    });

    const resetAll = document.createElement("button");
    resetAll.type = "button";
    resetAll.className = "compactButton dangerButton";
    resetAll.textContent = "RESET ALL SHOWDOWN DATA";
    resetAll.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone."
        );

        if(!confirmed){
            return;
        }

        clearAllCareerModeData();
        currentShowdown = null;
        screenHistory = [];

        const indicator = document.getElementById("seasonIndicator");
        if(indicator){ indicator.textContent = "No Active Showdown"; }

        showScreen("mainMenu", false);
    });

    buttons.append(deleteHistory, resetAll);
    controls.append(heading, description, buttons);
    return controls;
}

function renderLegacy(){
    archiveCompletedSaveBeforeLegacy();

    const container = document.querySelector("#legacy .legacyBox");
    if(!container){
        return;
    }

    const history = loadLegacyShowdowns()
        .map(showdown => normalizeShowdown(showdown))
        .sort((a, b) => {
            const aTime = new Date(a.completedAt || a.archivedAt || 0).getTime();
            const bTime = new Date(b.completedAt || b.archivedAt || 0).getTime();
            return bTime - aTime;
        });

    const totals = getLegacyTotals(history);
    container.replaceChildren();

    const stats = document.createElement("div");
    stats.className = "legacyStatsGrid";
    stats.append(
        createLegacyStat("SHOWDOWNS PLAYED", totals.showdowns),
        createLegacyStat("TROPHIES WON", totals.trophies),
        createLegacyStat("TOTAL POINTS", totals.points)
    );
    container.appendChild(stats);

    const heading = document.createElement("h3");
    heading.className = "legacySectionHeading";
    heading.textContent = "COMPLETED RIVALRIES";
    container.appendChild(heading);

    if(history.length === 0){
        const empty = document.createElement("div");
        empty.className = "legacyEmpty";
        empty.textContent = "No completed showdowns yet. Finish a rivalry and it will be archived here automatically.";
        container.appendChild(empty);
    }else{
        const list = document.createElement("div");
        list.className = "legacyList";
        history.forEach(showdown => list.appendChild(createLegacyShowdownCard(showdown)));
        container.appendChild(list);
    }

    container.appendChild(createLegacyDataControls());
}

window.renderLegacy = renderLegacy;
