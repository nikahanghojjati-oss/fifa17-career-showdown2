/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Season Entry, Pre-Commit Review and Progression Engine
===================================================== */

let seasonCompletionInProgress = false;
let seasonEntryRenderedRound = null;
let seasonEntryRenderedShowdownId = null;
let seasonReviewDraft = null;
let seasonReviewActive = false;
let seasonUI = null;

function ensureSeasonReviewUI(){
    if(document.getElementById("seasonReviewPanel")){
        return;
    }

    const seasonEntry = document.getElementById("seasonEntry");
    const completeButton = document.getElementById("completeSeason");
    const entryActions = completeButton ? completeButton.closest(".seasonEntryActions") : null;
    if(!seasonEntry || !entryActions){
        throw new Error("Season Review could not initialize because the Season Results shell is incomplete.");
    }

    const panel = document.createElement("section");
    panel.id = "seasonReviewPanel";
    panel.className = "seasonReviewPanel hidden";
    panel.setAttribute("aria-labelledby", "seasonReviewHeading");

    const status = document.createElement("div");
    status.className = "seasonReviewStatus";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "FINAL CHECK";
    const statusMeta = document.createElement("strong");
    statusMeta.id = "seasonReviewStatusMeta";
    statusMeta.textContent = "NO DATA SAVED YET";
    status.append(statusLabel, statusMeta);

    const heading = document.createElement("h3");
    heading.id = "seasonReviewHeading";
    heading.tabIndex = -1;
    heading.textContent = "REVIEW SEASON BEFORE SAVING";

    const intro = document.createElement("p");
    intro.className = "seasonReviewIntro";
    intro.textContent = "Verify both managers' results and the calculated scores. Nothing becomes permanent until Confirm & Save Season is pressed.";

    const result = document.createElement("p");
    result.id = "seasonReviewResult";
    result.className = "summaryResult seasonReviewResult";
    result.setAttribute("aria-live", "polite");

    const grid = document.createElement("div");
    grid.className = "seasonSummaryGrid seasonReviewGrid";

    const playerOne = document.createElement("div");
    playerOne.id = "seasonReviewOne";
    playerOne.className = "seasonSummaryCard seasonReviewCard";

    const playerTwo = document.createElement("div");
    playerTwo.id = "seasonReviewTwo";
    playerTwo.className = "seasonSummaryCard seasonReviewCard";
    grid.append(playerOne, playerTwo);

    const overall = document.createElement("div");
    overall.className = "overallScoreBox seasonReviewOverall";
    const overallLabel = document.createElement("span");
    overallLabel.textContent = "PROJECTED OVERALL SHOWDOWN SCORE";
    const overallValue = document.createElement("strong");
    overallValue.id = "seasonReviewOverallScore";
    overallValue.textContent = "0 • 0";
    overall.append(overallLabel, overallValue);

    const warning = document.createElement("p");
    warning.className = "seasonReviewWarning";
    warning.textContent = "CONFIRMATION IS FINAL · THIS COMPLETED SEASON BECOMES READ-ONLY";

    const error = document.createElement("p");
    error.id = "seasonReviewError";
    error.className = "formError seasonReviewError";
    error.setAttribute("aria-live", "assertive");

    const actions = document.createElement("div");
    actions.className = "seasonEntryActions seasonReviewActions";

    const confirm = document.createElement("button");
    confirm.id = "confirmSeasonCompletion";
    confirm.className = "menuButton";
    confirm.type = "button";
    confirm.textContent = "CONFIRM & SAVE SEASON";

    const edit = document.createElement("button");
    edit.id = "editSeasonResults";
    edit.className = "compactButton";
    edit.type = "button";
    edit.textContent = "EDIT RESULTS";

    actions.append(confirm, edit);
    panel.append(status, heading, intro, result, grid, overall, warning, error, actions);
    entryActions.parentNode.insertBefore(panel, entryActions);

    seasonUI = null;
}

function cacheSeasonUI(){
    seasonUI = {
        entryScreen: document.getElementById("seasonEntry"),
        entryHint: document.querySelector("#seasonEntry .seasonEntryHint"),
        entryGrid: document.querySelector("#seasonEntry .seasonEntryGrid"),
        entryActions: document.getElementById("completeSeason")?.closest(".seasonEntryActions") || null,
        completeButton: document.getElementById("completeSeason"),
        nextButton: document.getElementById("nextSeasonAction"),
        entryError: document.getElementById("seasonEntryError"),
        entryTitle: document.getElementById("seasonEntryTitle"),
        managerOne: document.getElementById("seasonManagerOne"),
        managerTwo: document.getElementById("seasonManagerTwo"),
        clubOne: document.getElementById("seasonClubOne"),
        clubTwo: document.getElementById("seasonClubTwo"),
        reviewPanel: document.getElementById("seasonReviewPanel"),
        reviewHeading: document.getElementById("seasonReviewHeading"),
        reviewStatusMeta: document.getElementById("seasonReviewStatusMeta"),
        reviewResult: document.getElementById("seasonReviewResult"),
        reviewOne: document.getElementById("seasonReviewOne"),
        reviewTwo: document.getElementById("seasonReviewTwo"),
        reviewOverall: document.getElementById("seasonReviewOverallScore"),
        reviewError: document.getElementById("seasonReviewError"),
        reviewConfirm: document.getElementById("confirmSeasonCompletion"),
        reviewEdit: document.getElementById("editSeasonResults"),
        summaryTitle: document.getElementById("seasonSummaryTitle"),
        summaryResult: document.getElementById("seasonSummaryResult"),
        overall: document.getElementById("seasonOverallScore"),
        summaryOne: document.getElementById("seasonSummaryOne"),
        summaryTwo: document.getElementById("seasonSummaryTwo")
    };
    return seasonUI;
}

function getSeasonUI(){
    return seasonUI || cacheSeasonUI();
}

function setSeasonText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function cloneSeasonValue(value){
    if(typeof cloneForStorage === "function"){
        return cloneForStorage(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function getSeasonReviewIntegrity(){
    const ui = getSeasonUI();
    const required = {
        panel: ui.reviewPanel,
        heading: ui.reviewHeading,
        playerOne: ui.reviewOne,
        playerTwo: ui.reviewTwo,
        overall: ui.reviewOverall,
        confirm: ui.reviewConfirm,
        edit: ui.reviewEdit
    };
    const missing = Object.entries(required)
        .filter(([, element]) => !element)
        .map(([name]) => name);
    const bindingProblems = [];

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        bindingProblems.push("review entry is not bound");
    }
    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        bindingProblems.push("season confirmation is not bound");
    }
    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        bindingProblems.push("season edit return is not bound");
    }

    return {
        healthy: missing.length === 0 && bindingProblems.length === 0,
        missing,
        bindingProblems,
        active: seasonReviewActive,
        hasDraft: Boolean(seasonReviewDraft)
    };
}

function initializeSeasonEngine(){
    ensureSeasonReviewUI();
    const ui = cacheSeasonUI();

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        ui.completeButton.dataset.seasonEngineBound = "true";
        ui.completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        ui.reviewConfirm.dataset.seasonConfirmBound = "true";
        ui.reviewConfirm.addEventListener("click", confirmCurrentSeason);
    }

    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        ui.reviewEdit.dataset.seasonEditBound = "true";
        ui.reviewEdit.addEventListener("click", editSeasonResults);
    }

    if(ui.nextButton && ui.nextButton.dataset.seasonEngineBound !== "true"){
        ui.nextButton.dataset.seasonEngineBound = "true";
        ui.nextButton.addEventListener("click", handleSeasonSummaryAction);
    }

    setSeasonText(ui.completeButton, "REVIEW SEASON");
    setSeasonEntryMode(false);

    const integrity = getSeasonReviewIntegrity();
    if(!integrity.healthy){
        throw new Error(`Season Review initialization failed: ${integrity.missing.concat(integrity.bindingProblems).join(", ")}`);
    }
}

function setSeasonEntryError(message = ""){
    setSeasonText(getSeasonUI().entryError, message);
}

function setSeasonReviewError(message = ""){
    setSeasonText(getSeasonUI().reviewError, message);
}

function setSeasonConfirmationBusy(isBusy){
    const ui = getSeasonUI();

    if(ui.reviewConfirm){
        ui.reviewConfirm.disabled = isBusy;
        ui.reviewConfirm.classList.toggle("isBusy", isBusy);
        ui.reviewConfirm.setAttribute("aria-busy", isBusy ? "true" : "false");
        setSeasonText(ui.reviewConfirm, isBusy ? "SAVING SEASON..." : "CONFIRM & SAVE SEASON");
    }
    if(ui.reviewEdit){
        ui.reviewEdit.disabled = isBusy;
    }
}

function reportSeasonError(message, error){
    console.error(`[Career Mode Showdown] ${message}:`, error);
    const detail = `${message}. ${error && error.message ? error.message : "Please try again."}`;
    if(seasonReviewActive){ setSeasonReviewError(detail); }
    else { setSeasonEntryError(detail); }

    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error);
    }
}

function setSeasonEntryMode(reviewing){
    const ui = getSeasonUI();
    seasonReviewActive = Boolean(reviewing);

    if(ui.entryScreen){
        ui.entryScreen.dataset.seasonEntryMode = reviewing ? "review" : "entry";
    }
    [ui.entryHint, ui.entryGrid, ui.entryActions, ui.entryError].forEach(element => {
        if(element){ element.classList.toggle("hidden", reviewing); }
    });
    if(ui.reviewPanel){
        ui.reviewPanel.classList.toggle("hidden", !reviewing);
    }
}

function clearSeasonReviewDraft(){
    seasonReviewDraft = null;
    setSeasonReviewError("");
}

function restoreSeasonEntryFromReview({ focus = false, clearDraft = true } = {}){
    if(clearDraft){ clearSeasonReviewDraft(); }
    setSeasonEntryMode(false);

    if(currentShowdown){
        setSeasonText(getSeasonUI().entryTitle, `SEASON ${Number(currentShowdown.currentRound)} RESULTS`);
    }

    if(focus){
        const firstInput = getSeasonInput("p1", "LeaguePosition");
        if(firstInput){ firstInput.focus({ preventScroll: true }); }
    }
}

function openSeasonEntry(){
    if(!currentShowdown){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No active showdown is available.", "error");
        }
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    restoreSeasonEntryFromReview({ focus: false, clearDraft: true });

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        openTransferChallenge();
        return;
    }

    const ui = getSeasonUI();
    const currentRound = Number(currentShowdown.currentRound);
    const currentShowdownId = String(currentShowdown.id);

    setSeasonText(ui.entryTitle, `SEASON ${currentRound} RESULTS`);
    setSeasonText(ui.managerOne, currentShowdown.managers.playerOne);
    setSeasonText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setSeasonText(ui.clubOne, currentShowdown.clubs.playerOne);
    setSeasonText(ui.clubTwo, currentShowdown.clubs.playerTwo);
    setSeasonText(ui.completeButton, "REVIEW SEASON");

    if(
        seasonEntryRenderedRound !== currentRound
        || String(seasonEntryRenderedShowdownId) !== currentShowdownId
    ){
        resetSeasonEntryFields();
        seasonEntryRenderedRound = currentRound;
        seasonEntryRenderedShowdownId = currentShowdownId;
    }

    setSeasonEntryError("");
    showScreen("seasonEntry");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function resetSeasonEntryFields(){
    ["p1", "p2"].forEach(prefix => {
        ["LeaguePosition", "LeaguePoints", "LeagueGoals"].forEach(field => {
            const input = document.getElementById(`${prefix}${field}`);
            if(input && input.value !== ""){ input.value = ""; }
        });

        ["DomesticCup", "ChampionsLeague", "TopScorer", "TopAssist"].forEach(field => {
            const checkbox = document.getElementById(`${prefix}${field}`);
            if(checkbox && checkbox.checked){ checkbox.checked = false; }
        });
    });
}

function getSeasonInput(prefix, field){
    return document.getElementById(`${prefix}${field}`);
}

function readSeasonResult(prefix){
    const position = getSeasonInput(prefix, "LeaguePosition");
    const points = getSeasonInput(prefix, "LeaguePoints");
    const goals = getSeasonInput(prefix, "LeagueGoals");
    const domesticCup = getSeasonInput(prefix, "DomesticCup");
    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const topScorer = getSeasonInput(prefix, "TopScorer");
    const topAssist = getSeasonInput(prefix, "TopAssist");

    if(!position || !points || !goals || !domesticCup || !championsLeague || !topScorer || !topAssist){
        throw new Error(`Season form controls are missing for ${prefix}.`);
    }

    return {
        leaguePosition: Number(position.value),
        leaguePoints: Number(points.value),
        leagueGoals: Number(goals.value),
        domesticCup: domesticCup.checked,
        championsLeague: championsLeague.checked,
        topScorer: topScorer.checked,
        topAssist: topAssist.checked
    };
}

function getCurrentLeagueTeamCount(){
    if(!currentShowdown || !currentShowdown.selectedLeague || typeof getClubsForLeague !== "function"){
        return null;
    }

    const clubs = getClubsForLeague(currentShowdown.selectedLeague.id);
    return Array.isArray(clubs) && clubs.length ? clubs.length : null;
}

function getSeasonEntryValidationMessage(prefix, managerLabel){
    const positionInput = getSeasonInput(prefix, "LeaguePosition");
    const pointsInput = getSeasonInput(prefix, "LeaguePoints");
    const goalsInput = getSeasonInput(prefix, "LeagueGoals");

    if(!positionInput || !pointsInput || !goalsInput){
        return `${managerLabel}'s season form is incomplete.`;
    }

    if(positionInput.value === "" || pointsInput.value === "" || goalsInput.value === ""){
        return `Enter league position, league points and league goals for ${managerLabel}.`;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);
    const teamCount = getCurrentLeagueTeamCount();

    if(!Number.isInteger(position) || position < 1){
        return `${managerLabel}'s league position must be a whole number of 1 or higher.`;
    }

    if(teamCount && position > teamCount){
        return `${managerLabel}'s league position cannot be lower than ${teamCount}th in this league.`;
    }

    if(!Number.isInteger(points) || points < 0){
        return `${managerLabel}'s league points must be a non-negative whole number.`;
    }

    if(!Number.isInteger(goals) || goals < 0){
        return `${managerLabel}'s league goals must be a non-negative whole number.`;
    }

    return "";
}

function validateSeasonEntry(prefix){
    const label = prefix === "p1"
        ? (currentShowdown ? currentShowdown.managers.playerOne : "Manager 1")
        : (currentShowdown ? currentShowdown.managers.playerTwo : "Manager 2");

    return getSeasonEntryValidationMessage(prefix, label) === "";
}

function buildSeasonRecord(seasonNumber, playerOne, playerTwo, completedAt = new Date().toISOString()){
    playerOne.scoring = calculatePlayerSeasonScore(playerOne);
    playerTwo.scoring = calculatePlayerSeasonScore(playerTwo);

    return {
        roundNumber: seasonNumber,
        completedAt,
        transferChallengeSeason: seasonNumber,
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    };
}

function getSeasonReviewFingerprint(roundRecord){
    if(!roundRecord || !roundRecord.playerOne || !roundRecord.playerTwo){
        return "";
    }

    const normalizePlayer = player => ({
        leaguePosition: Number(player.leaguePosition),
        leaguePoints: Number(player.leaguePoints),
        leagueGoals: Number(player.leagueGoals),
        domesticCup: Boolean(player.domesticCup),
        championsLeague: Boolean(player.championsLeague),
        topScorer: Boolean(player.topScorer),
        topAssist: Boolean(player.topAssist),
        scoring: calculatePlayerSeasonScore(player)
    });

    const playerOne = normalizePlayer(roundRecord.playerOne);
    const playerTwo = normalizePlayer(roundRecord.playerTwo);

    return JSON.stringify({
        roundNumber: Number(roundRecord.roundNumber),
        transferChallengeSeason: Number(roundRecord.transferChallengeSeason),
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    });
}

function buildTrustedSeasonRecordFromReview(draft){
    if(!draft || !draft.roundRecord){
        throw new Error("No reviewed season is available to save.");
    }

    const source = draft.roundRecord;
    const playerOne = cloneSeasonValue(source.playerOne);
    const playerTwo = cloneSeasonValue(source.playerTwo);
    delete playerOne.scoring;
    delete playerTwo.scoring;

    const trusted = buildSeasonRecord(draft.seasonNumber, playerOne, playerTwo, null);
    const fingerprint = getSeasonReviewFingerprint(trusted);
    if(!draft.fingerprint || fingerprint !== draft.fingerprint){
        throw new Error("The reviewed season changed before confirmation. Return to Edit Results and review it again.");
    }

    trusted.completedAt = new Date().toISOString();
    return trusted;
}

function persistCompletedSeason(roundRecord, seasonNumber){
    const previousState = {
        roundsLength: currentShowdown.rounds.length,
        currentRound: currentShowdown.currentRound,
        status: currentShowdown.status,
        completedAt: currentShowdown.completedAt,
        score: cloneForStorage(currentShowdown.score)
    };

    currentShowdown.rounds.push(roundRecord);
    recalculateShowdownScores(currentShowdown);

    if(seasonNumber >= currentShowdown.totalRounds){
        currentShowdown.status = "Completed";
        currentShowdown.completedAt = currentShowdown.completedAt || new Date().toISOString();
    }else{
        currentShowdown.currentRound = seasonNumber + 1;
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
        currentShowdown.rounds.length = previousState.roundsLength;
        currentShowdown.currentRound = previousState.currentRound;
        currentShowdown.status = previousState.status;
        currentShowdown.completedAt = previousState.completedAt;
        currentShowdown.score = previousState.score;
        throw new Error("The season could not be saved to browser storage.");
    }

    if(currentShowdown.status === "Completed"){
        const archived = archiveShowdown(currentShowdown);
        if(!archived && typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved, but the completed showdown could not be copied to Legacy. The active save is safe and can be archived again later.",
                "error",
                10000
            );
        }
    }
}

function getSeasonCompletionContextMessage(){
    if(!currentShowdown){
        return "No active showdown is available.";
    }

    if(currentShowdown.status === "Completed"){
        return "This showdown is already completed.";
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        return "Complete the current season's Transfer Challenge before submitting results.";
    }

    const playerOneValidation = getSeasonEntryValidationMessage("p1", currentShowdown.managers.playerOne);
    if(playerOneValidation){ return playerOneValidation; }

    const playerTwoValidation = getSeasonEntryValidationMessage("p2", currentShowdown.managers.playerTwo);
    if(playerTwoValidation){ return playerTwoValidation; }

    const seasonNumber = Number(currentShowdown.currentRound);
    const alreadyCompleted = currentShowdown.rounds.some(
        round => Number(round.roundNumber) === seasonNumber
    );
    return alreadyCompleted
        ? "This season has already been completed. Return to Showdown Home to continue."
        : "";
}

function createSeasonReviewDraft(){
    const seasonNumber = Number(currentShowdown.currentRound);
    const playerOne = readSeasonResult("p1");
    const playerTwo = readSeasonResult("p2");
    const roundRecord = buildSeasonRecord(seasonNumber, playerOne, playerTwo, null);

    return {
        showdownId: String(currentShowdown.id),
        seasonNumber,
        roundRecord: cloneSeasonValue(roundRecord),
        fingerprint: getSeasonReviewFingerprint(roundRecord)
    };
}

function appendSeasonReviewLine(container, label, value, className = ""){
    const row = document.createElement("div");
    row.className = `summaryLine seasonReviewLine${className ? ` ${className}` : ""}`;

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    container.appendChild(row);
}

function renderSeasonReviewAchievements(container, playerRecord){
    const group = document.createElement("div");
    group.className = "seasonReviewAchievements";

    [
        ["Domestic Cup", playerRecord.domesticCup],
        ["Champions League", playerRecord.championsLeague],
        ["Top Scorer", playerRecord.topScorer],
        ["Top Assist", playerRecord.topAssist]
    ].forEach(([label, active]) => {
        const item = document.createElement("span");
        item.className = active ? "isEarned" : "isNotEarned";
        item.textContent = `${active ? "✓" : "—"} ${label}`;
        group.appendChild(item);
    });

    container.appendChild(group);
}

function renderManagerSeasonReview(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){ return; }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSeasonReviewLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSeasonReviewLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSeasonReviewLine(fragment, "League Goals", playerRecord.leagueGoals);
    renderSeasonReviewAchievements(fragment, playerRecord);

    const scoreHeading = document.createElement("p");
    scoreHeading.className = "seasonReviewScoreHeading";
    scoreHeading.textContent = "CALCULATED SCORE";
    fragment.appendChild(scoreHeading);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        appendSeasonReviewLine(fragment, label, `+${points}`, points === 0 ? "isZero" : "isScoring");
    });

    const total = document.createElement("div");
    total.className = "summaryTotal seasonReviewTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function renderSeasonReview(draft){
    const ui = getSeasonUI();
    const roundRecord = draft.roundRecord;
    const seasonNumber = Number(draft.seasonNumber);

    setSeasonText(ui.entryTitle, `SEASON ${seasonNumber} REVIEW`);
    setSeasonText(ui.reviewHeading, `REVIEW SEASON ${seasonNumber} BEFORE SAVING`);
    setSeasonText(ui.reviewStatusMeta, `SEASON ${seasonNumber} · NO DATA SAVED YET`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerOne} is projected to win Season ${seasonNumber}`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerTwo} is projected to win Season ${seasonNumber}`);
    }else{
        setSeasonText(ui.reviewResult, `Season ${seasonNumber} is projected to finish level`);
    }

    renderManagerSeasonReview(
        ui.reviewOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );
    renderManagerSeasonReview(
        ui.reviewTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    const priorOne = Number(currentShowdown.score && currentShowdown.score.playerOne) || 0;
    const priorTwo = Number(currentShowdown.score && currentShowdown.score.playerTwo) || 0;
    setSeasonText(
        ui.reviewOverall,
        `${currentShowdown.managers.playerOne} ${priorOne + roundRecord.playerOne.scoring.total}  •  ${priorTwo + roundRecord.playerTwo.scoring.total} ${currentShowdown.managers.playerTwo}`
    );

    setSeasonReviewError("");
    setSeasonEntryMode(true);

    if(ui.reviewHeading){
        window.requestAnimationFrame(() => ui.reviewHeading.focus({ preventScroll: true }));
    }
}

function completeCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(!currentShowdown){
        setSeasonEntryError("No active showdown is available.");
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    const validationMessage = getSeasonCompletionContextMessage();
    if(validationMessage){
        setSeasonEntryError(validationMessage);
        return;
    }

    try{
        seasonReviewDraft = createSeasonReviewDraft();
        if(!seasonReviewDraft.fingerprint){
            throw new Error("The Season Review snapshot could not be verified.");
        }
        setSeasonEntryError("");
        renderSeasonReview(seasonReviewDraft);
    }catch(error){
        clearSeasonReviewDraft();
        reportSeasonError("Season review failed", error);
    }
}

function getSeasonReviewConfirmationMessage(draft){
    if(!draft || !currentShowdown){
        return "The reviewed season is no longer available. Return to Edit Results and review it again.";
    }
    if(String(currentShowdown.id) !== String(draft.showdownId)){
        return "The active showdown changed after this review. Return to Edit Results and review the current season again.";
    }
    if(Number(currentShowdown.currentRound) !== Number(draft.seasonNumber)){
        return "The active season changed after this review. Return to Showdown Home before continuing.";
    }
    if(currentShowdown.status === "Completed"){
        return "This showdown has already been completed.";
    }
    if(!isTransferChallengeComplete(draft.seasonNumber)){
        return "The Transfer Challenge is no longer complete for this reviewed season.";
    }
    if(currentShowdown.rounds.some(round => Number(round.roundNumber) === Number(draft.seasonNumber))){
        return "This season has already been saved. Return to Showdown Home to continue.";
    }
    return "";
}

function confirmCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    const contextMessage = getSeasonReviewConfirmationMessage(seasonReviewDraft);
    if(contextMessage){
        setSeasonReviewError(contextMessage);
        return;
    }

    let roundRecord;
    try{
        roundRecord = buildTrustedSeasonRecordFromReview(seasonReviewDraft);
    }catch(error){
        reportSeasonError("Season confirmation blocked", error);
        return;
    }

    const seasonNumber = Number(seasonReviewDraft.seasonNumber);
    seasonCompletionInProgress = true;
    setSeasonConfirmationBusy(true);
    setSeasonReviewError("");

    try{
        persistCompletedSeason(roundRecord, seasonNumber);
        seasonEntryRenderedRound = null;
        seasonEntryRenderedShowdownId = null;
        seasonReviewDraft = null;
    }catch(error){
        reportSeasonError("Season completion failed", error);
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
        return;
    }

    try{
        seasonReviewActive = false;
        updateShowdownUI();
        renderSeasonSummary(roundRecord);

        if(!showScreen("seasonSummary")){
            throw new Error("The Season Summary screen could not be opened.");
        }

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(`Season ${seasonNumber} saved successfully.`, "success", 3500);
        }
    }catch(error){
        console.error("Season was saved but the summary screen failed to render:", error);
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Season saved, but the summary screen failed", error);
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved successfully, but the summary could not be displayed. Showdown Home remains safe to continue from.",
                "error",
                9000
            );
        }
        showScreen("dashboard");
    }finally{
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
    }
}

function editSeasonResults(){
    if(seasonCompletionInProgress){ return; }
    restoreSeasonEntryFromReview({ focus: true, clearDraft: true });
}

function renderSeasonSummary(roundRecord){
    if(!currentShowdown || !roundRecord){
        return;
    }

    const ui = getSeasonUI();
    setSeasonText(ui.summaryTitle, `SEASON ${roundRecord.roundNumber} SUMMARY`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerOne} wins the season`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerTwo} wins the season`);
    }else{
        setSeasonText(ui.summaryResult, "Season finishes level");
    }

    renderManagerSeasonSummary(
        ui.summaryOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );

    renderManagerSeasonSummary(
        ui.summaryTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    setSeasonText(
        ui.overall,
        `${currentShowdown.managers.playerOne} ${currentShowdown.score.playerOne}  •  ${currentShowdown.score.playerTwo} ${currentShowdown.managers.playerTwo}`
    );

    if(ui.nextButton){
        setSeasonText(
            ui.nextButton,
            currentShowdown.status === "Completed"
                ? "VIEW COMPLETED SHOWDOWN"
                : `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`
        );
    }

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderManagerSeasonSummary(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){
        return;
    }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSummaryLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSummaryLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSummaryLine(fragment, "League Goals", playerRecord.leagueGoals);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        if(points > 0){
            appendSummaryLine(fragment, label, `+${points}`);
        }
    });

    const total = document.createElement("div");
    total.className = "summaryTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function appendSummaryLine(container, label, value){
    const row = document.createElement("div");
    row.className = "summaryLine";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    container.appendChild(row);
}

function handleSeasonSummaryAction(){
    if(!currentShowdown){
        return;
    }

    if(currentShowdown.status === "Completed"){
        updateShowdownUI();
        showScreen("dashboard");
        return;
    }

    openTransferChallenge();
}

window.initializeSeasonEngine = initializeSeasonEngine;
window.openSeasonEntry = openSeasonEntry;
window.completeCurrentSeason = completeCurrentSeason;
window.confirmCurrentSeason = confirmCurrentSeason;
window.editSeasonResults = editSeasonResults;
window.getSeasonReviewIntegrity = getSeasonReviewIntegrity;
window.renderSeasonSummary = renderSeasonSummary;
