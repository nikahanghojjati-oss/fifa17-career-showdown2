/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.16.0
   Transaction-Safe Lightweight Legacy Archive Engine
===================================================== */

const legacyDateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
});

let lastLegacyRenderedRevision = null;

function archiveCompletedSaveBeforeLegacy(){
    const candidate = currentShowdown || loadSavedShowdown();
    if(!candidate || candidate.status !== "Completed"){
        return;
    }

    const existing = loadLegacyShowdowns().find(item => String(item.id) === String(candidate.id));
    const alreadyCurrent = existing
        && String(existing.updatedAt || "") === String(candidate.updatedAt || "")
        && String(existing.completedAt || "") === String(candidate.completedAt || "");

    if(!alreadyCurrent){
        archiveShowdown(candidate);
    }
}

function getArchivedShowdownWinner(showdown){
    const playerOneScore = Number(showdown.score && showdown.score.playerOne) || 0;
    const playerTwoScore = Number(showdown.score && showdown.score.playerTwo) || 0;

    if(playerOneScore > playerTwoScore){ return "playerOne"; }
    if(playerTwoScore > playerOneScore){ return "playerTwo"; }
    return "draw";
}

function formatLegacyDate(value){
    if(!value){ return "Date unavailable"; }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : legacyDateFormatter.format(date);
}

function countPlayerTrophies(player){
    if(!player){ return 0; }
    return (Number(player.leaguePosition) === 1 ? 1 : 0)
        + (player.domesticCup ? 1 : 0)
        + (player.championsLeague ? 1 : 0);
}

function countShowdownTrophies(showdown){
    return (showdown.rounds || []).reduce(
        (total, round) => total + countPlayerTrophies(round.playerOne) + countPlayerTrophies(round.playerTwo),
        0
    );
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
    const valueElement = document.createElement("strong");
    labelElement.textContent = label;
    valueElement.textContent = value;
    card.append(labelElement, valueElement);
    return card;
}

function getWinnerLabel(showdown){
    const winner = getArchivedShowdownWinner(showdown);
    if(winner === "playerOne"){ return `${showdown.managers.playerOne} wins the showdown`; }
    if(winner === "playerTwo"){ return `${showdown.managers.playerTwo} wins the showdown`; }
    return "Showdown finishes level";
}

function getLegacyScoring(player){
    if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
        return player.scoring;
    }
    return typeof calculatePlayerSeasonScore === "function"
        ? calculatePlayerSeasonScore(player || {})
        : { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
}

function getPlayerHonours(player){
    if(!player){ return "No honours"; }
    const honours = [];
    const scoring = getLegacyScoring(player);

    if(player.championsLeague){ honours.push("Champions League"); }
    if(Number(player.leaguePosition) === 1){ honours.push("League"); }
    if(player.domesticCup){ honours.push("Domestic Cup"); }
    if(scoring.performanceBonus){ honours.push("Performance Bonus"); }
    if(scoring.individualAwardsBonus || scoring.awardsBonus){ honours.push("Awards Bonus"); }

    return honours.length ? honours.join(" · ") : "No honours";
}

function buildTransferChallengeMap(showdown){
    const map = new Map();
    (showdown.transferChallenges || []).forEach(challenge => {
        if(challenge){
            map.set(Number(challenge.seasonNumber), challenge);
        }
    });
    return map;
}

function getSeasonTransferReleases(challengeMap, seasonNumber, playerKey){
    const challenge = challengeMap.get(Number(seasonNumber));
    if(!challenge || !challenge.signings){ return 0; }

    const signings = Array.isArray(challenge.signings[playerKey])
        ? challenge.signings[playerKey]
        : [];
    return signings.reduce((count, signing) => count + (signing && signing.release ? 1 : 0), 0);
}

function createSeasonManagerCell(showdown, round, playerKey, challengeMap, alignRight = false){
    const player = round[playerKey];
    const managerName = showdown.managers[playerKey];
    const cell = document.createElement("div");
    cell.className = `legacySeasonManager${alignRight ? " right" : ""}`;

    const primary = document.createElement("div");
    primary.textContent = `${managerName}: #${player.leaguePosition} · ${player.leaguePoints} league pts · ${player.leagueGoals} goals`;

    const honours = document.createElement("div");
    honours.className = "legacySeasonHonours";
    const releases = getSeasonTransferReleases(challengeMap, round.roundNumber, playerKey);
    const releaseText = releases > 0 ? ` · ${releases} transfer release${releases === 1 ? "" : "s"}` : "";
    honours.textContent = `${getPlayerHonours(player)}${releaseText}`;

    cell.append(primary, honours);
    return cell;
}

function createLegacySeasonRow(showdown, round, challengeMap){
    const row = document.createElement("div");
    row.className = "legacySeasonRow";

    const season = document.createElement("div");
    season.className = "legacySeasonNumber";
    season.textContent = `SEASON ${round.roundNumber}`;

    const playerOne = createSeasonManagerCell(showdown, round, "playerOne", challengeMap);
    const score = document.createElement("div");
    score.className = "legacySeasonScore";
    score.textContent = `${getLegacyScoring(round.playerOne).total} - ${getLegacyScoring(round.playerTwo).total}`;
    const playerTwo = createSeasonManagerCell(showdown, round, "playerTwo", challengeMap, true);

    row.append(season, playerOne, score, playerTwo);
    return row;
}

function getMatchingCompletedActiveShowdown(showdownId){
    const active = currentShowdown || loadSavedShowdown();
    if(!active || active.status !== "Completed" || String(active.id) !== String(showdownId)){
        return null;
    }
    return active;
}

function clearMatchingCompletedActiveShowdown(showdownId){
    const active = getMatchingCompletedActiveShowdown(showdownId);
    if(!active){
        return true;
    }

    if(!clearSavedShowdown()){
        return false;
    }

    currentShowdown = null;
    const indicator = document.getElementById("seasonIndicator");
    if(indicator){ indicator.textContent = "No Active Showdown"; }
    return true;
}

function populateLegacySeasonHistory(showdown, seasonList){
    if(seasonList.dataset.rendered === "true"){
        return;
    }

    seasonList.dataset.rendered = "true";
    const challengeMap = buildTransferChallengeMap(showdown);
    const fragment = document.createDocumentFragment();
    (showdown.rounds || []).forEach(round => {
        fragment.appendChild(createLegacySeasonRow(showdown, round, challengeMap));
    });
    seasonList.appendChild(fragment);
}

function deleteLegacyShowdownTransaction(showdown){
    const historyBefore = loadLegacyShowdowns();
    const activeMatches = Boolean(getMatchingCompletedActiveShowdown(showdown.id));

    if(!deleteLegacyShowdown(showdown.id)){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The Legacy showdown could not be deleted from browser storage.", "error", 9000);
        }
        return false;
    }

    if(activeMatches && !clearMatchingCompletedActiveShowdown(showdown.id)){
        const restored = saveLegacyShowdowns(historyBefore);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                restored
                    ? "The active completed copy could not be removed, so the Legacy deletion was rolled back."
                    : "The active completed copy could not be removed and the Legacy rollback also failed. Refresh before making more data changes.",
                "error",
                12000
            );
        }
        return false;
    }

    return true;
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
    const rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];
    subtitle.textContent = `${leagueName} · ${rounds.length} season${rounds.length === 1 ? "" : "s"} · completed ${formatLegacyDate(showdown.completedAt || showdown.archivedAt)}`;
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
    meta.textContent = `${countShowdownTrophies(showdown)} trophies won\n${(Number(showdown.score.playerOne) || 0) + (Number(showdown.score.playerTwo) || 0)} total showdown points`;
    meta.style.whiteSpace = "pre-line";
    top.append(title, matchup, meta);

    const details = document.createElement("details");
    details.className = "legacyDetails";
    const summary = document.createElement("summary");
    summary.textContent = "VIEW SEASON HISTORY";
    const seasonList = document.createElement("div");
    seasonList.className = "legacySeasonList";
    details.append(summary, seasonList);
    details.addEventListener("toggle", () => {
        if(details.open){
            populateLegacySeasonHistory(showdown, seasonList);
        }
    });

    const actions = document.createElement("div");
    actions.className = "legacyCardActions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "compactButton dangerButton";
    deleteButton.textContent = "DELETE SHOWDOWN";
    deleteButton.addEventListener("click", () => {
        const alsoDeletesActive = Boolean(getMatchingCompletedActiveShowdown(showdown.id));
        const warning = alsoDeletesActive
            ? `Delete "${showdown.name}" from Legacy and remove its active completed copy? This cannot be undone.`
            : `Delete "${showdown.name}" from Legacy? This cannot be undone.`;

        if(!window.confirm(warning)){ return; }
        if(deleteLegacyShowdownTransaction(showdown)){
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    actions.appendChild(deleteButton);
    card.append(top, details, actions);
    return card;
}

function deleteAllLegacyHistoryTransaction(history){
    const completedActive = (currentShowdown || loadSavedShowdown());
    const matchingActive = completedActive
        && completedActive.status === "Completed"
        && history.some(item => String(item.id) === String(completedActive.id));

    if(!clearLegacyHistory()){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Legacy history could not be cleared from browser storage.", "error", 9000);
        }
        return false;
    }

    if(matchingActive && !clearMatchingCompletedActiveShowdown(completedActive.id)){
        const restored = saveLegacyShowdowns(history);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                restored
                    ? "The completed active copy could not be removed, so Legacy history was restored."
                    : "Legacy was cleared but the active completed copy could not be removed, and rollback failed. Refresh before continuing.",
                "error",
                12000
            );
        }
        return false;
    }

    return true;
}

function createLegacyDataControls(history){
    const controls = document.createElement("section");
    controls.className = "legacyDataControls";
    const heading = document.createElement("h3");
    heading.textContent = "DATA MANAGEMENT";
    const description = document.createElement("p");
    description.textContent = "Delete archived test history, or reset all local Career Mode Showdown data for a completely fresh start. Unfinished active showdowns are preserved by the Legacy-history delete control.";
    const buttons = document.createElement("div");
    buttons.className = "legacyControlButtons";

    const deleteHistory = document.createElement("button");
    deleteHistory.type = "button";
    deleteHistory.className = "compactButton dangerButton";
    deleteHistory.textContent = "DELETE ALL LEGACY HISTORY";
    deleteHistory.addEventListener("click", () => {
        const active = currentShowdown || loadSavedShowdown();
        const completedActiveWillBeRemoved = Boolean(
            active && active.status === "Completed" && history.some(item => String(item.id) === String(active.id))
        );
        const warning = completedActiveWillBeRemoved
            ? "Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone."
            : "Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone.";

        if(!window.confirm(warning)){ return; }
        if(deleteAllLegacyHistoryTransaction(history)){
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    const resetAll = document.createElement("button");
    resetAll.type = "button";
    resetAll.className = "compactButton dangerButton";
    resetAll.textContent = "RESET ALL SHOWDOWN DATA";
    resetAll.addEventListener("click", () => {
        if(!window.confirm("Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.")){
            return;
        }

        if(!clearAllCareerModeData()){
            currentShowdown = loadSavedShowdown();
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The full reset did not complete. The interface has reloaded the data that is still available; refresh before trying again.",
                    "error",
                    12000
                );
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
            return;
        }

        currentShowdown = null;
        if(typeof window.resetNavigationState === "function"){
            window.resetNavigationState();
        }
        const indicator = document.getElementById("seasonIndicator");
        if(indicator){ indicator.textContent = "No Active Showdown"; }
        lastLegacyRenderedRevision = null;
        showScreen("mainMenu", false);
    });

    buttons.append(deleteHistory, resetAll);
    controls.append(heading, description, buttons);
    return controls;
}

function renderLegacy(){
    archiveCompletedSaveBeforeLegacy();

    const container = document.querySelector("#legacy .legacyBox");
    if(!container){ return; }

    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : null;

    if(revision !== null && lastLegacyRenderedRevision === revision && container.childElementCount > 0){
        return;
    }

    const history = loadLegacyShowdowns().sort((a, b) => {
        const aTime = new Date(a.completedAt || a.archivedAt || 0).getTime();
        const bTime = new Date(b.completedAt || b.archivedAt || 0).getTime();
        return bTime - aTime;
    });

    const totals = getLegacyTotals(history);
    const fragment = document.createDocumentFragment();

    const stats = document.createElement("div");
    stats.className = "legacyStatsGrid";
    stats.append(
        createLegacyStat("SHOWDOWNS PLAYED", totals.showdowns),
        createLegacyStat("TROPHIES WON", totals.trophies),
        createLegacyStat("TOTAL POINTS", totals.points)
    );
    fragment.appendChild(stats);

    const heading = document.createElement("h3");
    heading.className = "legacySectionHeading";
    heading.textContent = "COMPLETED RIVALRIES";
    fragment.appendChild(heading);

    if(history.length === 0){
        const empty = document.createElement("div");
        empty.className = "legacyEmpty";
        empty.textContent = "No completed showdowns yet. Finish a rivalry and it will be archived here automatically.";
        fragment.appendChild(empty);
    }else{
        const list = document.createElement("div");
        list.className = "legacyList";
        const listFragment = document.createDocumentFragment();
        history.forEach(showdown => listFragment.appendChild(createLegacyShowdownCard(showdown)));
        list.appendChild(listFragment);
        fragment.appendChild(list);
    }

    fragment.appendChild(createLegacyDataControls(history));
    container.replaceChildren(fragment);
    lastLegacyRenderedRevision = revision;
}

window.renderLegacy = renderLegacy;