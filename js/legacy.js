/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.1.0
   Transaction-Safe Lightweight Legacy Archive Engine
===================================================== */

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function legacyAskConfirm(message,tone){return typeof window.askShowdownConfirm==="function"?window.askShowdownConfirm(message,{tone}):typeof window.loadRuntimeScript==="function"?window.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof window.askShowdownConfirm==="function").then(()=>window.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}

const legacyDateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
});

let lastLegacyRenderedRevision = null;
let backupExportInProgress = false;

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
        + (player.championsLeague ? 1 : 0)
        + (player.europaLeague === true && !player.championsLeague ? 1 : 0);
}

function countShowdownTrophies(showdown){
    return (showdown.rounds || []).reduce(
        (total, round) => total + countPlayerTrophies(round.playerOne) + countPlayerTrophies(round.playerTwo),
        0
    );
}

// r87 career fixes (B1): points belong to one manager each, so they are never added together (Daniel is player one).
function getLegacyTotals(history){
    return history.reduce((totals, showdown) => {
        totals.showdowns += 1;
        totals.trophies += countShowdownTrophies(showdown);
        totals.points.daniel += Number(showdown.score && showdown.score.playerOne) || 0;
        totals.points.nik += Number(showdown.score && showdown.score.playerTwo) || 0;
        return totals;
    }, { showdowns: 0, trophies: 0, points: { daniel: 0, nik: 0 } });
}

/* r87 career fixes (B1, Lane B P1): online the local Legacy list is never written, so History & Backup showed
   "0 Showdowns" under a Settings row that said 12. For Daniel's and Nik's phones this page now shows the same online career
   the other career screens use (the model Settings already loaded; this page makes no read of its own), one points figure
   per manager, and an OPEN HISTORY button to the real History screen. Backup, restore and reset below are unchanged. */
function getLegacyOnlineCareer(){
    try{
        const legacy = window.CareerModeRivalryLegacyV10;
        const model = legacy && typeof legacy.cachedCareerModel === "function" ? legacy.cachedCareerModel() : null;
        if(model && ["ready", "partial", "empty"].includes(model.status)){
            const rows = model.history && Array.isArray(model.history.showdowns) ? model.history.showdowns : [];
            const completed = rows.filter(row => row && row.status === "completed").length;
            const points = manager => {
                const value = model.managers && model.managers[manager] ? model.managers[manager].careerPoints : null;
                return Number.isFinite(value) ? value : 0;
            };
            return { status: model.status, completed, points: { daniel: points("daniel"), nik: points("nik") } };
        }
        const loading = Boolean(legacy && typeof legacy.careerModelLoading === "function" && legacy.careerModelLoading());
        return { status: loading ? "loading" : "unavailable", completed: null, points: null };
    }catch(_error){
        return { status: "unavailable", completed: null, points: null };
    }
}

function openLegacyHistoryFromTools(){
    window.careerModeLegacyDataTools = false;
    if(document.documentElement?.dataset){ delete document.documentElement.dataset.v10Tools; }
    renderLegacy(true);
}

function createLegacyOnlineCareerSection(){
    const career = getLegacyOnlineCareer();
    const fragment = document.createDocumentFragment();
    const text = value => career.status === "loading" ? "Loading…" : value === null ? "—" : String(value);
    const stats = document.createElement("div");
    stats.className = "legacyStatsGrid legacyOnlineCareer";
    stats.dataset.careerStatus = career.status;
    stats.append(
        createLegacyStat(career.status === "partial" ? "SHOWDOWNS COMPLETED (AT LEAST)" : "SHOWDOWNS COMPLETED", text(career.completed)),
        createLegacyStat("DANIEL · CAREER POINTS", text(career.points ? career.points.daniel : null)),
        createLegacyStat("NIK · CAREER POINTS", text(career.points ? career.points.nik : null))
    );
    fragment.appendChild(stats);

    const heading = document.createElement("h3");
    heading.className = "legacySectionHeading";
    heading.textContent = "COMPLETED SHOWDOWNS";
    fragment.appendChild(heading);

    const note = document.createElement("div");
    note.className = "legacyEmpty legacyOnlineHistoryNote";
    note.textContent = career.status === "loading"
        ? "Loading your career…"
        : career.status === "unavailable"
            ? "Your career could not be loaded right now. Nothing is lost. History shows it when you are connected."
            : career.completed === 0
                ? "No completed Showdowns yet. Finish one and it appears in History."
                : "Every Showdown, season by season, is on the History screen.";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "compactButton legacyOpenHistory";
    open.textContent = "OPEN HISTORY";
    open.addEventListener("click", openLegacyHistoryFromTools);
    note.appendChild(document.createElement("br"));
    note.appendChild(open);
    fragment.appendChild(note);
    return fragment;
}

// While the page waits on the career read Settings started, it redraws once that career is kept.
if(typeof window.addEventListener === "function"){
    // Codex #1103: the redraw waits for "load-settled" too, which comes after the read stops counting as running (and after a
    // failed read), so the page never stays on "Loading your career…".
    const redrawOnlineCareer = () => {
        if(window.careerModeLegacyDataTools === true && document.querySelector("#legacy .legacyOnlineCareer")){
            lastLegacyRenderedRevision = null;
            renderLegacy(true);
        }
    };
    window.addEventListener("career-mode-online-career-model-change", redrawOnlineCareer);
    window.addEventListener("career-mode-online-career-load-settled", redrawOnlineCareer);
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
    return "Showdown is a draw";
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
    else if(player.europaLeague === true){ honours.push("Europa League"); }
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

/* Deleting the Showdown also removes every unsent private draft on this device (Season Results, Transfer Challenge, signing), for every rivalry, including orphans.
   The sweep lives in diagnostics.js (the only non-startup file allowed to touch browser storage directly) and loads on demand; it needs no rivalry id, so it also works offline or before the pair module loads. */
function sweepLegacyShowdownDrafts(){
    try{
        return Promise.resolve(window.ensureDiagnosticsModule()).then(() => window.clearAllShowdownDraftKeys() === true).catch(() => false);
    }catch(_error){
        return Promise.resolve(false);
    }
}

function clearMatchingCompletedActiveShowdown(showdownId){
    const active = getMatchingCompletedActiveShowdown(showdownId);
    if(!active){
        return true;
    }

    if(!clearSavedShowdown()){
        return false;
    }
    sweepLegacyShowdownDrafts();

    currentShowdown = null;
    if(typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
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
            window.showAppNotice("The Legacy showdown could not be deleted.", "error", 9000);
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
    // r87 (B1): the final score above already gives each manager's points; they are never added into one figure.
    meta.textContent = `${countShowdownTrophies(showdown)} trophies won`;
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
    deleteButton.addEventListener("click", async () => {
        const alsoDeletesActive = Boolean(getMatchingCompletedActiveShowdown(showdown.id));
        const warning = alsoDeletesActive
            ? `Delete "${showdown.name}" from Legacy and remove its active completed copy? This cannot be undone.`
            : `Delete "${showdown.name}" from Legacy? This cannot be undone.`;

        if(await legacyAskConfirm(warning, "danger") !== true){ return; }
        if(deleteLegacyShowdownTransaction(showdown)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(`Deleted "${showdown.name}" from Legacy history.`, "success", 4200);
            }
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
            window.showAppNotice("Legacy history could not be cleared.", "error", 9000);
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
    description.textContent = "Download a checksum-protected backup file before destructive maintenance. Export is read-only: it does not change your active Showdown, Legacy history or application preferences.";

    const backupSummary = document.createElement("div");
    backupSummary.className = "legacyBackupSummary";
    const backupTitle = document.createElement("strong");
    backupTitle.textContent = "BACKUP FILE";
    const backupText = document.createElement("span");
    backupText.textContent = "Human-readable JSON · format v1 · SHA-256 corruption check · malformed current bytes preserved in recovery data";
    backupSummary.append(backupTitle, backupText);

    const buttons = document.createElement("div");
    buttons.className = "legacyControlButtons";

    const status = document.createElement("p");
    status.className = "legacyDataStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Backup export is ready.";

    const exportBackup = document.createElement("button");
    exportBackup.type = "button";
    exportBackup.className = "compactButton primaryDataButton";
    exportBackup.textContent = "EXPORT BACKUP";
    exportBackup.addEventListener("click", async () => {
        if(backupExportInProgress){ return; }
        if(typeof window.exportCareerModeBackup !== "function"){
            status.textContent = "Backup export is unavailable right now.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 9000);
            }
            return;
        }

        backupExportInProgress = true;
        exportBackup.disabled = true;
        exportBackup.setAttribute("aria-busy", "true");
        exportBackup.textContent = "BUILDING BACKUP…";
        status.textContent = "Building a read-only backup and verifying its checksum…";

        try{
            const envelope = await window.exportCareerModeBackup();
            const warningCount = Array.isArray(envelope && envelope.warnings) ? envelope.warnings.length : 0;
            status.textContent = warningCount
                ? `Backup downloaded with ${warningCount} recovery warning${warningCount === 1 ? "" : "s"}. Your stored bytes were not changed.`
                : "Backup downloaded successfully. Your stored bytes were not changed.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "success", warningCount ? 7000 : 4200);
            }
        }catch(error){
            status.textContent = `Backup could not be created: ${error && error.message ? error.message : String(error)}`;
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 10000);
            }
        }finally{
            backupExportInProgress = false;
            exportBackup.disabled = false;
            exportBackup.removeAttribute("aria-busy");
            exportBackup.textContent = "EXPORT BACKUP";
        }
    });

    const deleteHistory = document.createElement("button");
    deleteHistory.type = "button";
    deleteHistory.className = "compactButton dangerButton";
    deleteHistory.textContent = "DELETE ALL LEGACY HISTORY";
    deleteHistory.addEventListener("click", async () => {
        const active = currentShowdown || loadSavedShowdown();
        const completedActiveWillBeRemoved = Boolean(
            active && active.status === "Completed" && history.some(item => String(item.id) === String(active.id))
        );
        const warning = completedActiveWillBeRemoved
            ? "Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone."
            : "Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone.";

        if(await legacyAskConfirm(warning, "danger") !== true){ return; }
        if(deleteAllLegacyHistoryTransaction(history)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice("Legacy history was deleted successfully.", "success", 4200);
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    const resetAll = document.createElement("button");
    resetAll.type = "button";
    resetAll.className = "compactButton dangerButton";
    resetAll.textContent = "RESET ALL SHOWDOWN DATA";
    resetAll.addEventListener("click", async () => {
        if(await legacyAskConfirm("Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.", "danger") !== true){
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
        sweepLegacyShowdownDrafts();

        currentShowdown = null;
        if(typeof window.resetNavigationState === "function"){
            window.resetNavigationState();
        }
        if(typeof window.refreshMainMenuExperience === "function"){
            window.refreshMainMenuExperience();
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("All active and Legacy Showdown data was reset successfully. Application preferences were kept.", "success", 5200);
        }
        lastLegacyRenderedRevision = null;
        showScreen("mainMenu", false);
    });

    buttons.append(exportBackup, deleteHistory, resetAll);
    controls.append(heading, description, backupSummary, buttons, status);
    return controls;
}

let legacyModel = null;
// The data tools page lasts until the app leaves Legacy; the next Legacy visit is Team V's History again.
if(typeof document.addEventListener === "function"){
    document.addEventListener("career-mode-screen-shown", event => {
        if(event?.detail?.screen !== "legacy"){
            window.careerModeLegacyDataTools = false;
            if(document.documentElement?.dataset){ delete document.documentElement.dataset.v10Tools; }
        }
    });
}

function readLegacyScreenSeam(rerender){
    const seam = window.CareerModeCareerScreenSeam;
    if(seam){ return seam; }
    if(typeof window.loadRuntimeScript === "function"){
        window.loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam))
            .then(rerender)
            .catch(error => { if(typeof window.reportApplicationError === "function"){ window.reportApplicationError("Career screens could not load", error); } });
    }
    return null;
}

function renderLegacy(request = false){
    const dataTools = window.careerModeLegacyDataTools === true;
    // The data tools page is the app's own Legacy markup: close Team V's History first if it is drawn over it.
    if(dataTools && document.getElementById("legacy")?.dataset.rivalryLegacyV10 === "1"){
        window.CareerModeV10Screens?.hide?.("legacy");
        lastLegacyRenderedRevision = null;
    }
    const seamContainer = document.querySelector("#legacy .legacyBox");
    if(!seamContainer){ return; }
    const seam = readLegacyScreenSeam(() => renderLegacy(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ legacyModel = normalized.model; }
    const identity = window.CareerModeOnlinePlayerIdentity;
    const identityState = identity && typeof identity.getState === "function" ? identity.getState() : null;
    const source = seam.selectCareerScreenSource({ identityState, model: legacyModel, dataTools });
    // r61: html[data-v10-tools] dresses this page in Team V's kit (css/v10Shell.css); it never changes what the tools do.
    const toolsMark = document.documentElement?.dataset;
    if(toolsMark){
        if(source === "local"){ toolsMark.v10Tools = "legacy"; }
        else{ delete toolsMark.v10Tools; }
    }
    if(source !== "local"){
        if(typeof window.openRivalryLegacyV10 === "function"){
            window.openRivalryLegacyV10("legacy", () => legacyModel);
        }else if(typeof window.loadRuntimeScript === "function"){
            window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10))
                .then(() => window.CareerModeRivalryLegacyV10.mount("legacy", () => legacyModel))
                .catch(error => window.reportApplicationError?.("History screen could not load", error));
        }
        seamContainer.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("legacy", source === "model" ? legacyModel : null)));
        lastLegacyRenderedRevision = null;
        return;
    }
    archiveCompletedSaveBeforeLegacy();

    const container = document.querySelector("#legacy .legacyBox");
    if(!container){ return; }

    const revision = typeof window.getLegacyStorageRevision === "function"
        ? window.getLegacyStorageRevision()
        : null;

    // r87 (B1): the online career figures are not part of the local revision, so that page is always drawn fresh.
    const onlineCareer = typeof seam.isOnlineCareerRoute === "function" && seam.isOnlineCareerRoute(identityState);
    if(!onlineCareer && revision !== null && lastLegacyRenderedRevision === revision && container.childElementCount > 0){
        return;
    }

    const history = loadLegacyShowdowns().sort((a, b) => {
        const aTime = new Date(a.completedAt || a.archivedAt || 0).getTime();
        const bTime = new Date(b.completedAt || b.archivedAt || 0).getTime();
        return bTime - aTime;
    });

    const fragment = document.createDocumentFragment();

    if(onlineCareer){
        // The online career is listed on the History screen; the local list is never written online.
        fragment.appendChild(createLegacyOnlineCareerSection());
    }else{
        const totals = getLegacyTotals(history);
        const stats = document.createElement("div");
        stats.className = "legacyStatsGrid";
        stats.append(
            createLegacyStat("SHOWDOWNS PLAYED", totals.showdowns),
            createLegacyStat("DANIEL · POINTS", totals.points.daniel),
            createLegacyStat("NIK · POINTS", totals.points.nik)
        );
        fragment.appendChild(stats);

        const heading = document.createElement("h3");
        heading.className = "legacySectionHeading";
        heading.textContent = "COMPLETED SHOWDOWNS";
        fragment.appendChild(heading);
    }

    if(onlineCareer){
        // nothing more: OPEN HISTORY above leads to the real History screen
    }else if(history.length === 0){
        const empty = document.createElement("div");
        empty.className = "legacyEmpty";
        empty.textContent = "No completed Showdowns yet. Finish one and it appears here.";
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
    if(typeof window.mountCareerModeImportAnalysisPanel === "function"){
        window.mountCareerModeImportAnalysisPanel();
    }
    lastLegacyRenderedRevision = revision;
}

window.renderLegacy = renderLegacy;
