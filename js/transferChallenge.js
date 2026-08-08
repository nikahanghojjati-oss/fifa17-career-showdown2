/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   High-Performance Transfer Challenge Engine
===================================================== */

const TRANSFER_WINDOW_SECONDS = 15 * 60;
const TRANSFER_DRAFT_DELAY_MS = 500;

let transferTimerInterval = null;
let transferCompletionInProgress = false;
let transferDraftTimer = null;
let transferDraftDirty = false;
let lastPersistedTransferDraftSignature = null;
let lastRenderedTimerSecond = null;
let transferFieldElements = [];
let transferFieldById = new Map();
let transferUI = null;

function bindTransferControl(element, eventName, handler, marker){
    if(!element || element.dataset[marker] === "true"){
        return;
    }

    element.dataset[marker] = "true";
    element.addEventListener(eventName, handler);
}

function cacheTransferFields(){
    transferFieldElements = Array.from(document.querySelectorAll("[data-transfer-field]"));
    transferFieldById = new Map();

    transferFieldElements.forEach(field => {
        if(field.id){
            transferFieldById.set(field.id, field);
        }
    });
}

function cacheTransferUI(){
    transferUI = {
        title: document.getElementById("transferChallengeTitle"),
        managerOne: document.getElementById("transferManagerOne"),
        managerTwo: document.getElementById("transferManagerTwo"),
        clubOne: document.getElementById("transferClubOne"),
        clubTwo: document.getElementById("transferClubTwo"),
        guessOneHeading: document.getElementById("guessAgainstOneHeading"),
        guessTwoHeading: document.getElementById("guessAgainstTwoHeading"),
        phase: document.getElementById("transferPhaseStatus"),
        timer: document.getElementById("transferTimerDisplay"),
        startButton: document.getElementById("startTransferTimer"),
        endButton: document.getElementById("endTransferTimer"),
        completeButton: document.getElementById("completeTransferChallenge"),
        continueButton: document.getElementById("continueFromTransfers"),
        results: document.getElementById("transferChallengeResults"),
        resultsOne: document.getElementById("transferResultsOne"),
        resultsTwo: document.getElementById("transferResultsTwo"),
        error: document.getElementById("transferChallengeError")
    };
    return transferUI;
}

function getTransferUI(){
    return transferUI || cacheTransferUI();
}

function setTransferText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function setTransferHidden(element, hidden){
    if(!element){ return; }
    if(element.classList.contains("hidden") !== Boolean(hidden)){
        element.classList.toggle("hidden", Boolean(hidden));
    }
}

function getTransferFields(){
    if(!transferFieldElements.length){
        cacheTransferFields();
    }
    return transferFieldElements;
}

function prepareTransferInputForFastEntry(field){
    if(!field){
        return;
    }

    field.setAttribute("autocomplete", "off");
    if(field.tagName === "INPUT"){
        field.setAttribute("spellcheck", "false");
        field.setAttribute("autocapitalize", "words");
    }
}

function initializeTransferChallenge(){
    bindTransferControl(
        document.getElementById("seasonPrimaryAction"),
        "click",
        handleSeasonPrimaryAction,
        "transferPrimaryBound"
    );

    bindTransferControl(
        document.getElementById("startTransferTimer"),
        "click",
        startTransferWindow,
        "transferStartBound"
    );

    bindTransferControl(
        document.getElementById("endTransferTimer"),
        "click",
        endTransferWindowEarly,
        "transferEndBound"
    );

    bindTransferControl(
        document.getElementById("completeTransferChallenge"),
        "click",
        completeTransferChallenge,
        "transferCompleteBound"
    );

    bindTransferControl(
        document.getElementById("continueFromTransfers"),
        "click",
        continueFromTransferChallenge,
        "transferContinueBound"
    );

    cacheTransferFields();
    cacheTransferUI();

    getTransferFields().forEach(field => {
        prepareTransferInputForFastEntry(field);
        bindTransferControl(field, "change", saveTransferFieldChange, "transferChangeBound");

        if(field.tagName === "INPUT"){
            bindTransferControl(field, "input", scheduleTransferDraftSave, "transferInputBound");
        }
    });
}

function handleSeasonPrimaryAction(){
    if(!currentShowdown){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No active showdown is available.", "error");
        }
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

    if(isTransferChallengeComplete(currentShowdown.currentRound)){
        openSeasonEntry();
        return;
    }

    openTransferChallenge();
}

function createTransferChallenge(seasonNumber){
    return {
        seasonNumber,
        status: "not_started",
        durationSeconds: TRANSFER_WINDOW_SECONDS,
        startedAt: null,
        deadlineAt: null,
        endedAt: null,
        endedEarly: false,
        completedAt: null,
        signings: {
            playerOne: [],
            playerTwo: []
        },
        guesses: {
            againstPlayerOne: [],
            againstPlayerTwo: []
        }
    };
}

function getOrCreateTransferChallenge(seasonNumber){
    let challenge = getTransferChallengeForSeason(seasonNumber);

    if(challenge){
        return challenge;
    }

    challenge = createTransferChallenge(seasonNumber);
    currentShowdown.transferChallenges.push(challenge);

    if(!saveCurrentShowdown()){
        currentShowdown.transferChallenges = currentShowdown.transferChallenges.filter(
            item => item !== challenge
        );
        throw new Error("The season transfer challenge could not be created in browser storage.");
    }

    return challenge;
}

function synchronizeTransferDeadline(challenge){
    if(!challenge || challenge.status !== "active"){
        return challenge;
    }

    const deadline = Number(challenge.deadlineAt);
    if(!Number.isFinite(deadline) || deadline <= Date.now()){
        finishTransferWindow(challenge, false);
    }

    return challenge;
}

function openTransferChallenge(){
    if(!currentShowdown || currentShowdown.status === "Completed"){
        return;
    }

    try{
        if(typeof window.ensureCurrentShowdownNormalized === "function"){
            window.ensureCurrentShowdownNormalized();
        }

        const challenge = getOrCreateTransferChallenge(currentShowdown.currentRound);
        synchronizeTransferDeadline(challenge);
        restoreTransferForm(challenge);
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
        cancelTransferDraftTimer();
        renderTransferChallenge(challenge);

        if(showScreen("transferChallenge") && challenge.status === "active"){
            startTransferTimerLoop();
        }
    }catch(error){
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Unable to open the Transfer Challenge", error);
        }else{
            console.error(error);
        }
    }
}

function startTransferWindow(){
    if(!currentShowdown){
        return;
    }

    let challenge;
    try{
        challenge = getOrCreateTransferChallenge(currentShowdown.currentRound);
    }catch(error){
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Unable to start the transfer window", error);
        }
        return;
    }

    if(challenge.status !== "not_started"){
        return;
    }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;
    const now = Date.now();

    challenge.status = "active";
    challenge.startedAt = now;
    challenge.deadlineAt = now + (TRANSFER_WINDOW_SECONDS * 1000);
    challenge.endedAt = null;
    challenge.endedEarly = false;
    challenge.completedAt = null;
    currentShowdown.status = "Transfer Window Active";

    if(!saveCurrentShowdown()){
        restoreChallengeSnapshot(challenge, previous);
        currentShowdown.status = previousShowdownStatus;
        renderTransferChallenge(challenge);
        return;
    }

    renderTransferChallenge(challenge);
    startTransferTimerLoop();
}

function startTransferTimerLoop(){
    stopTransferTimerLoop();
    lastRenderedTimerSecond = null;
    updateTransferTimer();

    if(document.visibilityState === "hidden"){
        return;
    }
    if(typeof getActiveScreenName === "function" && getActiveScreenName() !== "transferChallenge"){
        return;
    }

    transferTimerInterval = window.setInterval(updateTransferTimer, 1000);
}

function stopTransferTimerLoop(){
    if(transferTimerInterval){
        window.clearInterval(transferTimerInterval);
        transferTimerInterval = null;
    }
}

function updateTransferTimer(){
    if(!currentShowdown){
        stopTransferTimerLoop();
        return;
    }

    if(document.visibilityState === "hidden"){
        stopTransferTimerLoop();
        return;
    }

    if(typeof getActiveScreenName === "function" && getActiveScreenName() !== "transferChallenge"){
        stopTransferTimerLoop();
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){
        stopTransferTimerLoop();
        return;
    }

    const deadline = Number(challenge.deadlineAt);
    const remainingSeconds = Number.isFinite(deadline)
        ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        : 0;

    renderTransferTimer(remainingSeconds);

    if(remainingSeconds <= 0){
        finishTransferWindow(challenge, false);
    }
}

function renderTransferTimer(seconds){
    const timer = getTransferUI().timer;
    if(!timer){
        return;
    }

    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    if(lastRenderedTimerSecond === safeSeconds && timer.textContent){
        return;
    }

    lastRenderedTimerSecond = safeSeconds;
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const remaining = (safeSeconds % 60).toString().padStart(2, "0");
    timer.textContent = `${minutes}:${remaining}`;
}

function endTransferWindowEarly(){
    if(!currentShowdown){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){
        return;
    }

    finishTransferWindow(challenge, true);
}

function restoreChallengeSnapshot(challenge, snapshot){
    Object.keys(challenge).forEach(key => {
        delete challenge[key];
    });
    Object.assign(challenge, cloneForStorage(snapshot));
}

function finishTransferWindow(challenge, endedEarly){
    if(!currentShowdown || !challenge || challenge.status !== "active"){
        return false;
    }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;

    stopTransferTimerLoop();
    challenge.status = "recording";
    challenge.endedAt = Date.now();
    challenge.endedEarly = Boolean(endedEarly);
    currentShowdown.status = "Transfer Challenge Recording";

    if(!saveCurrentShowdown()){
        restoreChallengeSnapshot(challenge, previous);
        currentShowdown.status = previousShowdownStatus;
        renderTransferChallenge(challenge);

        const restoredDeadline = Number(challenge.deadlineAt);
        const stillHasTime = challenge.status === "active"
            && Number.isFinite(restoredDeadline)
            && restoredDeadline > Date.now();

        if(stillHasTime){
            startTransferTimerLoop();
        }else if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "The transfer window reached zero, but its closed state could not be saved. Refresh after browser storage is available; the timer will not repeatedly retry in the background.",
                "error",
                12000
            );
        }
        return false;
    }

    lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
    renderTransferChallenge(challenge);
    return true;
}

function getTransferElement(id){
    return transferFieldById.get(id) || document.getElementById(id);
}

function getSigningRows(prefix){
    const rows = [];

    for(let index = 1; index <= 3; index += 1){
        const nameElement = getTransferElement(`${prefix}Signing${index}Name`);
        const leagueElement = getTransferElement(`${prefix}Signing${index}League`);
        const nationalityElement = getTransferElement(`${prefix}Signing${index}Nationality`);

        const name = nameElement ? nameElement.value.trim() : "";
        const league = leagueElement ? leagueElement.value.trim() : "";
        const nationality = nationalityElement ? nationalityElement.value.trim() : "";

        if(name || league || nationality){
            rows.push({
                slot: index,
                name,
                league,
                nationality,
                release: false,
                matchedBy: []
            });
        }
    }

    return rows;
}

function getGuessRows(targetPrefix){
    const rows = [];

    for(let index = 1; index <= 3; index += 1){
        const typeElement = getTransferElement(`${targetPrefix}Guess${index}Type`);
        const valueElement = getTransferElement(`${targetPrefix}Guess${index}Value`);

        const type = typeElement ? typeElement.value : "";
        const value = valueElement ? valueElement.value.trim() : "";

        if(type || value){
            rows.push({
                slot: index,
                type,
                value
            });
        }
    }

    return rows;
}

function captureTransferForm(challenge){
    challenge.signings.playerOne = getSigningRows("p1");
    challenge.signings.playerTwo = getSigningRows("p2");
    challenge.guesses.againstPlayerOne = getGuessRows("p1");
    challenge.guesses.againstPlayerTwo = getGuessRows("p2");
}

function getTransferDraftSignature(challenge){
    if(!challenge){ return ""; }
    try{
        return JSON.stringify({
            signings: challenge.signings,
            guesses: challenge.guesses
        });
    }catch(error){
        return `${Date.now()}:${Math.random()}`;
    }
}

function cancelTransferDraftTimer(){
    if(transferDraftTimer){
        window.clearTimeout(transferDraftTimer);
        transferDraftTimer = null;
    }
}

function scheduleTransferDraftSave(){
    if(!currentShowdown){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        return;
    }

    transferDraftDirty = true;
    cancelTransferDraftTimer();

    transferDraftTimer = window.setTimeout(() => {
        transferDraftTimer = null;
        flushTransferDraftSave();
    }, TRANSFER_DRAFT_DELAY_MS);
}

function saveTransferFieldChange(){
    if(!currentShowdown){
        return true;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        return true;
    }

    transferDraftDirty = true;
    return flushTransferDraftSave();
}

function flushTransferDraftSave(){
    cancelTransferDraftTimer();

    if(!transferDraftDirty){
        return true;
    }

    if(!currentShowdown){
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = null;
        return true;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = null;
        return true;
    }

    captureTransferForm(challenge);
    const signature = getTransferDraftSignature(challenge);

    if(signature === lastPersistedTransferDraftSignature){
        transferDraftDirty = false;
        setTransferError("");
        return true;
    }

    const saved = saveCurrentShowdown();

    if(saved){
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = signature;
        setTransferError("");
    }else{
        transferDraftDirty = true;
        setTransferError("Your latest transfer entry could not be saved. Keep this page open and try another edit.");
    }

    return saved;
}

function setTransferError(message = ""){
    setTransferText(getTransferUI().error, message);
}

function getTransferValidationMessage(challenge){
    const allSignings = [
        ...challenge.signings.playerOne,
        ...challenge.signings.playerTwo
    ];

    const incompleteSigning = allSignings.find(signing =>
        !signing.name || !signing.league || !signing.nationality
    );

    if(incompleteSigning){
        return "Every recorded signing needs a player name, previous league and nationality.";
    }

    const allGuesses = [
        ...challenge.guesses.againstPlayerOne,
        ...challenge.guesses.againstPlayerTwo
    ];

    const incompleteGuess = allGuesses.find(guess => !guess.type || !guess.value);
    if(incompleteGuess){
        return "Every recorded guess needs both a guess type and a value.";
    }

    return "";
}

function validateTransferForm(challenge){
    cancelTransferDraftTimer();
    captureTransferForm(challenge);

    const signature = getTransferDraftSignature(challenge);
    transferDraftDirty = signature !== lastPersistedTransferDraftSignature;
    const validationMessage = getTransferValidationMessage(challenge);

    if(validationMessage){
        if(transferDraftDirty && !flushTransferDraftSave()){
            return false;
        }
        setTransferError(validationMessage);
        return false;
    }

    setTransferError("");
    return true;
}

function normalizeTransferValue(value){
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function evaluateSignings(signings, guesses){
    return signings.map(signing => {
        const matchedBy = guesses.filter(guess => {
            const guessValue = normalizeTransferValue(guess.value);
            const signingValue = guess.type === "league"
                ? normalizeTransferValue(signing.league)
                : normalizeTransferValue(signing.nationality);

            return Boolean(guessValue && signingValue && guessValue === signingValue);
        });

        return {
            ...signing,
            release: matchedBy.length > 0,
            matchedBy: matchedBy.map(guess => ({ type: guess.type, value: guess.value }))
        };
    });
}

function setTransferCompletionBusy(isBusy){
    const button = getTransferUI().completeButton;
    if(!button){
        return;
    }

    button.disabled = isBusy;
    button.setAttribute("aria-busy", isBusy ? "true" : "false");
    setTransferText(button, isBusy ? "LOCKING RESULTS..." : "LOCK TRANSFER CHALLENGE RESULTS");
}

function completeTransferChallenge(){
    if(!currentShowdown || transferCompletionInProgress){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        return;
    }

    if(!validateTransferForm(challenge)){
        return;
    }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;

    transferCompletionInProgress = true;
    setTransferCompletionBusy(true);

    try{
        challenge.signings.playerOne = evaluateSignings(
            challenge.signings.playerOne,
            challenge.guesses.againstPlayerOne
        );

        challenge.signings.playerTwo = evaluateSignings(
            challenge.signings.playerTwo,
            challenge.guesses.againstPlayerTwo
        );

        challenge.status = "completed";
        challenge.completedAt = Date.now();
        currentShowdown.status = "Ready";

        if(!saveCurrentShowdown()){
            throw new Error("The transfer challenge results could not be saved.");
        }

        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
        updateShowdownUI();
        renderTransferChallenge(challenge);

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Transfer Challenge locked successfully.", "success", 3500);
        }
    }catch(error){
        restoreChallengeSnapshot(challenge, previous);
        currentShowdown.status = previousShowdownStatus;
        transferDraftDirty = getTransferDraftSignature(challenge) !== lastPersistedTransferDraftSignature;
        setTransferError(error.message || "The Transfer Challenge could not be completed.");
        renderTransferChallenge(challenge);

        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Transfer Challenge completion failed", error);
        }
    }finally{
        transferCompletionInProgress = false;
        setTransferCompletionBusy(false);
    }
}

function restoreTransferForm(challenge){
    clearTransferForm();
    restoreSigningRows("p1", challenge.signings.playerOne || []);
    restoreSigningRows("p2", challenge.signings.playerTwo || []);
    restoreGuessRows("p1", challenge.guesses.againstPlayerOne || []);
    restoreGuessRows("p2", challenge.guesses.againstPlayerTwo || []);
}

function clearTransferForm(){
    getTransferFields().forEach(field => {
        if(field.value !== ""){ field.value = ""; }
    });
}

function setTransferFieldValue(id, value){
    const field = getTransferElement(id);
    if(field){
        const next = value || "";
        if(field.value !== next){ field.value = next; }
    }
}

function restoreSigningRows(prefix, signings){
    signings.forEach((signing, arrayIndex) => {
        const slot = Number(signing.slot) || (arrayIndex + 1);
        if(slot < 1 || slot > 3){ return; }

        setTransferFieldValue(`${prefix}Signing${slot}Name`, signing.name);
        setTransferFieldValue(`${prefix}Signing${slot}League`, signing.league);
        setTransferFieldValue(`${prefix}Signing${slot}Nationality`, signing.nationality);
    });
}

function restoreGuessRows(targetPrefix, guesses){
    guesses.forEach((guess, arrayIndex) => {
        const slot = Number(guess.slot) || (arrayIndex + 1);
        if(slot < 1 || slot > 3){ return; }

        setTransferFieldValue(`${targetPrefix}Guess${slot}Type`, guess.type);
        setTransferFieldValue(`${targetPrefix}Guess${slot}Value`, guess.value);
    });
}

function setTransferFieldsDisabled(disabled){
    getTransferFields().forEach(field => {
        if(field.disabled !== disabled){
            field.disabled = disabled;
        }
    });
}

function renderTransferChallenge(challenge){
    if(!currentShowdown || !challenge){
        return;
    }

    const ui = getTransferUI();
    setTransferText(ui.title, `SEASON ${challenge.seasonNumber} TRANSFER CHALLENGE`);
    setTransferText(ui.managerOne, currentShowdown.managers.playerOne);
    setTransferText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setTransferText(ui.clubOne, currentShowdown.clubs.playerOne);
    setTransferText(ui.clubTwo, currentShowdown.clubs.playerTwo);
    setTransferText(ui.guessOneHeading, `${currentShowdown.managers.playerTwo} guesses ${currentShowdown.managers.playerOne}'s signings`);
    setTransferText(ui.guessTwoHeading, `${currentShowdown.managers.playerOne} guesses ${currentShowdown.managers.playerTwo}'s signings`);

    const statusLabels = {
        not_started: "READY — 15 MINUTES · MAX 3 SIGNINGS EACH",
        active: "TRANSFER WINDOW LIVE",
        recording: "WINDOW CLOSED — RECORD SIGNINGS AND GUESSES",
        completed: "TRANSFER CHALLENGE COMPLETE"
    };

    setTransferText(ui.phase, statusLabels[challenge.status] || "TRANSFER CHALLENGE");
    setTransferHidden(ui.startButton, challenge.status !== "not_started");
    setTransferHidden(ui.endButton, challenge.status !== "active");
    setTransferHidden(ui.completeButton, challenge.status !== "recording");
    setTransferHidden(ui.continueButton, challenge.status !== "completed");

    setTransferFieldsDisabled(challenge.status !== "recording");

    if(challenge.status === "not_started"){
        lastRenderedTimerSecond = null;
        renderTransferTimer(TRANSFER_WINDOW_SECONDS);
    }else if(challenge.status === "active"){
        const deadline = Number(challenge.deadlineAt);
        const remainingSeconds = Number.isFinite(deadline)
            ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
            : 0;
        renderTransferTimer(remainingSeconds);
    }else{
        lastRenderedTimerSecond = null;
        renderTransferTimer(0);
    }

    setTransferHidden(ui.results, challenge.status !== "completed");

    if(challenge.status === "completed"){
        renderTransferResults(challenge);
    }

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderTransferResults(challenge){
    const ui = getTransferUI();
    renderManagerTransferResults(
        ui.resultsOne,
        currentShowdown.managers.playerOne,
        challenge.signings.playerOne
    );

    renderManagerTransferResults(
        ui.resultsTwo,
        currentShowdown.managers.playerTwo,
        challenge.signings.playerTwo
    );
}

function renderManagerTransferResults(container, managerName, signings){
    if(!container){
        return;
    }

    const fragment = document.createDocumentFragment();
    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    if(!signings.length){
        const empty = document.createElement("p");
        empty.className = "transferEmpty";
        empty.textContent = "No signings recorded";
        fragment.appendChild(empty);
        container.replaceChildren(fragment);
        return;
    }

    signings.forEach(signing => {
        const row = document.createElement("div");
        row.className = `transferResultRow ${signing.release ? "release" : "safe"}`;

        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = signing.name;
        const meta = document.createElement("span");
        meta.textContent = `${signing.league} · ${signing.nationality}`;
        details.append(name, meta);

        const verdict = document.createElement("b");
        verdict.textContent = signing.release ? "RELEASE" : "SAFE";

        row.append(details, verdict);
        fragment.appendChild(row);
    });

    container.replaceChildren(fragment);
}

function continueFromTransferChallenge(){
    if(!currentShowdown || !isTransferChallengeComplete(currentShowdown.currentRound)){
        return;
    }

    if(!flushTransferDraftSave()){
        return;
    }

    stopTransferTimerLoop();
    openSeasonEntry();
}

window.initializeTransferChallenge = initializeTransferChallenge;
window.openTransferChallenge = openTransferChallenge;
window.completeTransferChallenge = completeTransferChallenge;
window.handleSeasonPrimaryAction = handleSeasonPrimaryAction;
window.flushTransferDraftSave = flushTransferDraftSave;
window.startTransferTimerLoop = startTransferTimerLoop;
window.stopTransferTimerLoop = stopTransferTimerLoop;
window.synchronizeTransferDeadline = synchronizeTransferDeadline;
window.renderTransferChallenge = renderTransferChallenge;
