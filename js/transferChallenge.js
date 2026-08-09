/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0 Workstream 2
   Phased Transfer Challenge Engine
===================================================== */

const TRANSFER_WINDOW_SECONDS = 15 * 60;
const TRANSFER_DRAFT_DELAY_MS = 500;
const TRANSFER_PHASES = Object.freeze({
    WINDOW: "window",
    GUESS: "guess_entry",
    SIGNING: "signing_entry",
    COMPLETED: "completed"
});
const TRANSFER_PHASE_ORDER = Object.freeze([
    TRANSFER_PHASES.WINDOW,
    TRANSFER_PHASES.GUESS,
    TRANSFER_PHASES.SIGNING,
    TRANSFER_PHASES.COMPLETED
]);

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
    if(!element || element.dataset[marker] === "true"){ return; }
    element.dataset[marker] = "true";
    element.addEventListener(eventName, handler);
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

function ensureTransferPhaseLayout(){
    const screen = document.getElementById("transferChallenge");
    if(!screen){ return; }

    const title = document.getElementById("transferChallengeTitle") || screen.querySelector("h2");
    if(!document.getElementById("transferPhaseNavigator")){
        const navigator = document.createElement("div");
        navigator.id = "transferPhaseNavigator";
        navigator.className = "transferPhaseNavigator";
        navigator.setAttribute("aria-label", "Transfer Challenge progress");
        [
            ["01", "Transfer Window", TRANSFER_PHASES.WINDOW],
            ["02", "Guess Entry", TRANSFER_PHASES.GUESS],
            ["03", "Signing Entry", TRANSFER_PHASES.SIGNING],
            ["04", "Verdicts", TRANSFER_PHASES.COMPLETED]
        ].forEach(([number, label, phase]) => {
            const step = document.createElement("div");
            step.className = "transferPhaseStep";
            step.dataset.transferPhaseStep = phase;
            const badge = document.createElement("b");
            badge.textContent = number;
            const text = document.createElement("span");
            text.textContent = label;
            step.append(badge, text);
            navigator.appendChild(step);
        });
        title.insertAdjacentElement("afterend", navigator);
    }

    if(!document.getElementById("transferPhaseIntro")){
        const intro = document.createElement("div");
        intro.id = "transferPhaseIntro";
        intro.className = "transferPhaseIntro";
        document.getElementById("transferPhaseNavigator").insertAdjacentElement("afterend", intro);
    }

    const guessGrid = screen.querySelector(".transferGuessesGrid");
    if(guessGrid && !document.getElementById("transferGuessPrivacyNote")){
        const note = document.createElement("div");
        note.id = "transferGuessPrivacyNote";
        note.className = "transferGuessPrivacyNote";
        const heading = document.createElement("strong");
        heading.textContent = "Guess phase: ";
        note.append(heading, document.createTextNode("lock the opponent guesses before entering either manager's completed signings. This ordering is permanent for the season once saved."));
        guessGrid.insertAdjacentElement("beforebegin", note);
    }

    const signingGrid = screen.querySelector(".transferManagersGrid");
    if(signingGrid && !document.getElementById("transferPhaseLockSummary")){
        const summary = document.createElement("div");
        summary.id = "transferPhaseLockSummary";
        summary.className = "transferPhaseLockSummary";
        signingGrid.insertAdjacentElement("beforebegin", summary);
    }

    const completeButton = document.getElementById("completeTransferChallenge");
    if(completeButton && !document.getElementById("transferPhaseActionBar")){
        const bar = document.createElement("div");
        bar.id = "transferPhaseActionBar";
        bar.className = "transferPhaseActionBar";
        completeButton.parentNode.insertBefore(bar, completeButton);
        bar.appendChild(completeButton);
    }
}

function cacheTransferFields(){
    transferFieldElements = Array.from(document.querySelectorAll("[data-transfer-field]"));
    transferFieldById = new Map();
    transferFieldElements.forEach(field => {
        if(field.id){ transferFieldById.set(field.id, field); }
    });
}

function cacheTransferUI(){
    transferUI = {
        screen: document.getElementById("transferChallenge"),
        title: document.getElementById("transferChallengeTitle"),
        managerOne: document.getElementById("transferManagerOne"),
        managerTwo: document.getElementById("transferManagerTwo"),
        clubOne: document.getElementById("transferClubOne"),
        clubTwo: document.getElementById("transferClubTwo"),
        guessOneHeading: document.getElementById("guessAgainstOneHeading"),
        guessTwoHeading: document.getElementById("guessAgainstTwoHeading"),
        phase: document.getElementById("transferPhaseStatus"),
        timer: document.getElementById("transferTimerDisplay"),
        hero: document.querySelector("#transferChallenge .transferHero"),
        timerActions: document.querySelector("#transferChallenge .transferTimerActions"),
        signingGrid: document.querySelector("#transferChallenge .transferManagersGrid"),
        guessGrid: document.querySelector("#transferChallenge .transferGuessesGrid"),
        privacyNote: document.getElementById("transferGuessPrivacyNote"),
        lockSummary: document.getElementById("transferPhaseLockSummary"),
        intro: document.getElementById("transferPhaseIntro"),
        navigator: document.getElementById("transferPhaseNavigator"),
        actionBar: document.getElementById("transferPhaseActionBar"),
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

function getTransferUI(){ return transferUI || cacheTransferUI(); }

function getTransferFields(){
    if(!transferFieldElements.length){ cacheTransferFields(); }
    return transferFieldElements;
}

function getTransferElement(id){
    return transferFieldById.get(id) || document.getElementById(id);
}

function prepareTransferInputForFastEntry(field){
    if(!field){ return; }
    field.setAttribute("autocomplete", "off");
    if(field.tagName === "INPUT"){
        field.setAttribute("spellcheck", "false");
        field.setAttribute("autocapitalize", "words");
    }
}

function normalizeTransferChallengePhase(challenge){
    if(!challenge){ return TRANSFER_PHASES.WINDOW; }
    if(challenge.status === "completed"){ return TRANSFER_PHASES.COMPLETED; }
    if(challenge.status === "not_started" || challenge.status === "active"){
        return TRANSFER_PHASES.WINDOW;
    }
    if(challenge.status === "recording"){
        if(challenge.phase === TRANSFER_PHASES.SIGNING){ return TRANSFER_PHASES.SIGNING; }
        return TRANSFER_PHASES.GUESS;
    }
    return TRANSFER_PHASES.WINDOW;
}

function getCanonicalTransferId(kind, idValue, labelValue){
    if(typeof window.resolveFifa17TransferOption !== "function"){
        return String(idValue || "");
    }
    const option = window.resolveFifa17TransferOption(kind, idValue || labelValue);
    return option ? option.id : "";
}

function getCanonicalTransferLabel(kind, idValue, labelValue){
    if(typeof window.resolveFifa17TransferOption !== "function"){
        return String(labelValue || idValue || "");
    }
    const option = window.resolveFifa17TransferOption(kind, idValue || labelValue);
    return option ? option.label : String(labelValue || "");
}

function migrateTransferChallengeRecord(challenge){
    if(!challenge){ return false; }
    let changed = false;
    const phase = normalizeTransferChallengePhase(challenge);
    if(challenge.phase !== phase){ challenge.phase = phase; changed = true; }
    if(!Object.prototype.hasOwnProperty.call(challenge, "guessesLockedAt")){
        challenge.guessesLockedAt = null;
        changed = true;
    }
    if(!Object.prototype.hasOwnProperty.call(challenge, "signingsLockedAt")){
        challenge.signingsLockedAt = null;
        changed = true;
    }

    const migrateSigning = signing => {
        if(!signing){ return; }
        const leagueId = getCanonicalTransferId("league", signing.leagueId, signing.league);
        const nationalityId = getCanonicalTransferId("nationality", signing.nationalityId, signing.nationality);
        const league = getCanonicalTransferLabel("league", leagueId, signing.league);
        const nationality = getCanonicalTransferLabel("nationality", nationalityId, signing.nationality);
        if(signing.leagueId !== leagueId){ signing.leagueId = leagueId; changed = true; }
        if(signing.nationalityId !== nationalityId){ signing.nationalityId = nationalityId; changed = true; }
        if(league && signing.league !== league){ signing.league = league; changed = true; }
        if(nationality && signing.nationality !== nationality){ signing.nationality = nationality; changed = true; }
    };

    const migrateGuess = guess => {
        if(!guess){ return; }
        const kind = guess.type === "league" ? "league" : guess.type === "nationality" ? "nationality" : "";
        if(!kind){ return; }
        const valueId = getCanonicalTransferId(kind, guess.valueId, guess.value);
        const value = getCanonicalTransferLabel(kind, valueId, guess.value);
        if(guess.valueId !== valueId){ guess.valueId = valueId; changed = true; }
        if(value && guess.value !== value){ guess.value = value; changed = true; }
    };

    const signings = challenge.signings || {};
    [...(signings.playerOne || []), ...(signings.playerTwo || [])].forEach(migrateSigning);
    const guesses = challenge.guesses || {};
    [...(guesses.againstPlayerOne || []), ...(guesses.againstPlayerTwo || [])].forEach(migrateGuess);

    if(challenge.status === "recording" && currentShowdown){
        const desired = phase === TRANSFER_PHASES.SIGNING ? "Transfer Signing Entry" : "Transfer Guess Entry";
        if(currentShowdown.status === "Transfer Challenge Recording"){
            currentShowdown.status = desired;
            changed = true;
        }
    }

    return changed;
}

function enhanceTransferChallengeSelectors(){
    if(typeof window.enhanceTransferSelector !== "function"){ return; }

    for(let index = 1; index <= 3; index += 1){
        ["p1", "p2"].forEach(prefix => {
            window.enhanceTransferSelector(getTransferElement(`${prefix}Signing${index}League`), "league");
            window.enhanceTransferSelector(getTransferElement(`${prefix}Signing${index}Nationality`), "nationality");

            const type = getTransferElement(`${prefix}Guess${index}Type`);
            const value = getTransferElement(`${prefix}Guess${index}Value`);
            window.enhanceTransferSelector(value, type && type.value === "league" ? "league" : "nationality");
            bindTransferControl(type, "change", () => handleGuessTypeChange(prefix, index), "transferGuessTypePhaseBound");
        });
    }
}

function handleGuessTypeChange(prefix, index){
    const type = getTransferElement(`${prefix}Guess${index}Type`);
    const value = getTransferElement(`${prefix}Guess${index}Value`);
    if(!type || !value){ return; }

    if(type.value === "league" || type.value === "nationality"){
        if(typeof window.updateTransferSelectorKind === "function"){
            window.updateTransferSelectorKind(value, type.value);
        }else{
            value.value = "";
        }
        value.disabled = false;
    }else{
        value.value = "";
        delete value.dataset.canonicalId;
        value.disabled = true;
    }
    saveTransferFieldChange();
}

function initializeTransferChallenge(){
    ensureTransferPhaseLayout();
    cacheTransferFields();
    cacheTransferUI();
    enhanceTransferChallengeSelectors();

    bindTransferControl(document.getElementById("seasonPrimaryAction"), "click", handleSeasonPrimaryAction, "transferPrimaryBound");
    bindTransferControl(document.getElementById("startTransferTimer"), "click", startTransferWindow, "transferStartBound");
    bindTransferControl(document.getElementById("endTransferTimer"), "click", endTransferWindowEarly, "transferEndBound");
    bindTransferControl(document.getElementById("completeTransferChallenge"), "click", completeTransferChallenge, "transferCompleteBound");
    bindTransferControl(document.getElementById("continueFromTransfers"), "click", continueFromTransferChallenge, "transferContinueBound");

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
        if(latestRound){ renderSeasonSummary(latestRound); showScreen("seasonSummary"); }
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
        phase: TRANSFER_PHASES.WINDOW,
        durationSeconds: TRANSFER_WINDOW_SECONDS,
        startedAt: null,
        deadlineAt: null,
        endedAt: null,
        endedEarly: false,
        guessesLockedAt: null,
        signingsLockedAt: null,
        completedAt: null,
        signings: { playerOne: [], playerTwo: [] },
        guesses: { againstPlayerOne: [], againstPlayerTwo: [] }
    };
}

function getOrCreateTransferChallenge(seasonNumber){
    let challenge = getTransferChallengeForSeason(seasonNumber);
    if(challenge){ return challenge; }

    challenge = createTransferChallenge(seasonNumber);
    currentShowdown.transferChallenges.push(challenge);
    if(!saveCurrentShowdown()){
        currentShowdown.transferChallenges = currentShowdown.transferChallenges.filter(item => item !== challenge);
        throw new Error("The season transfer challenge could not be created in browser storage.");
    }
    return challenge;
}

function synchronizeTransferDeadline(challenge){
    if(!challenge || challenge.status !== "active"){ return challenge; }
    const deadline = Number(challenge.deadlineAt);
    if(!Number.isFinite(deadline) || deadline <= Date.now()){
        finishTransferWindow(challenge, false);
    }
    return challenge;
}

function openTransferChallenge(){
    if(!currentShowdown || currentShowdown.status === "Completed"){ return; }
    try{
        if(typeof window.ensureCurrentShowdownNormalized === "function"){
            window.ensureCurrentShowdownNormalized();
        }
        const challenge = getOrCreateTransferChallenge(currentShowdown.currentRound);
        synchronizeTransferDeadline(challenge);
        const migrated = migrateTransferChallengeRecord(challenge);
        if(migrated && !saveCurrentShowdown() && typeof window.showAppNotice === "function"){
            window.showAppNotice("Transfer data was upgraded in memory but could not yet be written to browser storage. Your existing values remain available.", "error", 9000);
        }
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
        }else{ console.error(error); }
    }
}

function startTransferWindow(){
    if(!currentShowdown){ return; }
    let challenge;
    try{ challenge = getOrCreateTransferChallenge(currentShowdown.currentRound); }
    catch(error){
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("Unable to start the transfer window", error);
        }
        return;
    }
    if(challenge.status !== "not_started"){ return; }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;
    const now = Date.now();
    challenge.status = "active";
    challenge.phase = TRANSFER_PHASES.WINDOW;
    challenge.startedAt = now;
    challenge.deadlineAt = now + (TRANSFER_WINDOW_SECONDS * 1000);
    challenge.endedAt = null;
    challenge.endedEarly = false;
    challenge.guessesLockedAt = null;
    challenge.signingsLockedAt = null;
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
    if(document.visibilityState === "hidden"){ return; }
    if(typeof getActiveScreenName === "function" && getActiveScreenName() !== "transferChallenge"){ return; }
    transferTimerInterval = window.setInterval(updateTransferTimer, 1000);
}

function stopTransferTimerLoop(){
    if(transferTimerInterval){
        window.clearInterval(transferTimerInterval);
        transferTimerInterval = null;
    }
}

function updateTransferTimer(){
    if(!currentShowdown || document.visibilityState === "hidden"){
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
    if(remainingSeconds <= 0){ finishTransferWindow(challenge, false); }
}

function renderTransferTimer(seconds){
    const timer = getTransferUI().timer;
    if(!timer){ return; }
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    if(lastRenderedTimerSecond === safeSeconds && timer.textContent){ return; }
    lastRenderedTimerSecond = safeSeconds;
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const remaining = (safeSeconds % 60).toString().padStart(2, "0");
    timer.textContent = `${minutes}:${remaining}`;
}

function endTransferWindowEarly(){
    if(!currentShowdown){ return; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(challenge && challenge.status === "active"){ finishTransferWindow(challenge, true); }
}

function restoreChallengeSnapshot(challenge, snapshot){
    Object.keys(challenge).forEach(key => delete challenge[key]);
    Object.assign(challenge, cloneForStorage(snapshot));
}

function finishTransferWindow(challenge, endedEarly){
    if(!currentShowdown || !challenge || challenge.status !== "active"){ return false; }
    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;
    stopTransferTimerLoop();
    challenge.status = "recording";
    challenge.phase = TRANSFER_PHASES.GUESS;
    challenge.endedAt = Date.now();
    challenge.endedEarly = Boolean(endedEarly);
    challenge.guessesLockedAt = null;
    challenge.signingsLockedAt = null;
    currentShowdown.status = "Transfer Guess Entry";

    if(!saveCurrentShowdown()){
        restoreChallengeSnapshot(challenge, previous);
        currentShowdown.status = previousShowdownStatus;
        renderTransferChallenge(challenge);
        const restoredDeadline = Number(challenge.deadlineAt);
        const stillHasTime = challenge.status === "active" && Number.isFinite(restoredDeadline) && restoredDeadline > Date.now();
        if(stillHasTime){ startTransferTimerLoop(); }
        else if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The transfer window closed, but that state could not be saved. Refresh after browser storage is available; the timer will not retry in the background.", "error", 12000);
        }
        return false;
    }

    lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
    restoreTransferForm(challenge);
    renderTransferChallenge(challenge);
    return true;
}

function getSigningRows(prefix){
    const rows = [];
    for(let index = 1; index <= 3; index += 1){
        const nameElement = getTransferElement(`${prefix}Signing${index}Name`);
        const leagueElement = getTransferElement(`${prefix}Signing${index}League`);
        const nationalityElement = getTransferElement(`${prefix}Signing${index}Nationality`);
        const name = nameElement ? nameElement.value.trim() : "";
        const leagueId = typeof window.getTransferSelectorCanonicalValue === "function" ? window.getTransferSelectorCanonicalValue(leagueElement) : "";
        const nationalityId = typeof window.getTransferSelectorCanonicalValue === "function" ? window.getTransferSelectorCanonicalValue(nationalityElement) : "";
        const league = leagueElement ? leagueElement.value.trim() : "";
        const nationality = nationalityElement ? nationalityElement.value.trim() : "";
        if(name || league || nationality){
            rows.push({ slot:index, name, leagueId, league, nationalityId, nationality, release:false, matchedBy:[] });
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
        const valueId = typeof window.getTransferSelectorCanonicalValue === "function" ? window.getTransferSelectorCanonicalValue(valueElement) : "";
        const value = valueElement ? valueElement.value.trim() : "";
        if(type || value){ rows.push({ slot:index, type, valueId, value }); }
    }
    return rows;
}

function captureTransferPhaseForm(challenge){
    const phase = normalizeTransferChallengePhase(challenge);
    if(phase === TRANSFER_PHASES.GUESS){
        challenge.guesses.againstPlayerOne = getGuessRows("p1");
        challenge.guesses.againstPlayerTwo = getGuessRows("p2");
    }else if(phase === TRANSFER_PHASES.SIGNING){
        challenge.signings.playerOne = getSigningRows("p1");
        challenge.signings.playerTwo = getSigningRows("p2");
    }
}

function getTransferDraftSignature(challenge){
    if(!challenge){ return ""; }
    try{
        return JSON.stringify({ phase:normalizeTransferChallengePhase(challenge), signings:challenge.signings, guesses:challenge.guesses });
    }catch(error){ return `${Date.now()}:${Math.random()}`; }
}

function cancelTransferDraftTimer(){
    if(transferDraftTimer){ window.clearTimeout(transferDraftTimer); transferDraftTimer = null; }
}

function scheduleTransferDraftSave(){
    if(!currentShowdown){ return; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){ return; }
    transferDraftDirty = true;
    cancelTransferDraftTimer();
    transferDraftTimer = window.setTimeout(() => {
        transferDraftTimer = null;
        flushTransferDraftSave();
    }, TRANSFER_DRAFT_DELAY_MS);
}

function saveTransferFieldChange(){
    if(!currentShowdown){ return true; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){ return true; }
    transferDraftDirty = true;
    return flushTransferDraftSave();
}

function flushTransferDraftSave(){
    cancelTransferDraftTimer();
    if(!transferDraftDirty){ return true; }
    if(!currentShowdown){ transferDraftDirty = false; lastPersistedTransferDraftSignature = null; return true; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = null;
        return true;
    }
    captureTransferPhaseForm(challenge);
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

function setTransferError(message = ""){ setTransferText(getTransferUI().error, message); }

function getGuessValidationMessage(challenge){
    const guesses = [...challenge.guesses.againstPlayerOne, ...challenge.guesses.againstPlayerTwo];
    const incomplete = guesses.find(guess => !guess.type || !guess.value || !guess.valueId);
    return incomplete ? "Every recorded guess must use a valid League or Nationality selection from the FIFA 17 list." : "";
}

function getSigningValidationMessage(challenge){
    const signings = [...challenge.signings.playerOne, ...challenge.signings.playerTwo];
    const incomplete = signings.find(signing => !signing.name || !signing.leagueId || !signing.nationalityId);
    return incomplete ? "Every recorded signing needs a player name plus valid FIFA 17 previous-league and nationality selections." : "";
}

function persistCurrentTransferPhaseDraft(challenge, validationMessage){
    const signature = getTransferDraftSignature(challenge);
    transferDraftDirty = signature !== lastPersistedTransferDraftSignature;
    if(transferDraftDirty && !flushTransferDraftSave()){ return false; }
    if(validationMessage){ setTransferError(validationMessage); return false; }
    setTransferError("");
    return true;
}

function lockTransferGuesses(){
    if(!currentShowdown || transferCompletionInProgress){ return; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording" || normalizeTransferChallengePhase(challenge) !== TRANSFER_PHASES.GUESS){ return; }

    cancelTransferDraftTimer();
    captureTransferPhaseForm(challenge);
    if(!persistCurrentTransferPhaseDraft(challenge, getGuessValidationMessage(challenge))){ return; }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;
    transferCompletionInProgress = true;
    setTransferCompletionBusy(true, "LOCKING GUESSES...");
    try{
        challenge.phase = TRANSFER_PHASES.SIGNING;
        challenge.guessesLockedAt = Date.now();
        currentShowdown.status = "Transfer Signing Entry";
        if(!saveCurrentShowdown()){ throw new Error("The locked guesses could not be saved."); }
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
        restoreTransferForm(challenge);
        renderTransferChallenge(challenge);
        if(typeof window.updateShowdownUI === "function"){ window.updateShowdownUI(); }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Guesses locked. Signing Entry is now open.", "success", 3500);
        }
    }catch(error){
        restoreChallengeSnapshot(challenge, previous);
        currentShowdown.status = previousShowdownStatus;
        setTransferError(error.message || "Guesses could not be locked.");
        renderTransferChallenge(challenge);
    }finally{
        transferCompletionInProgress = false;
        setTransferCompletionBusy(false);
    }
}

function evaluateSignings(signings, guesses){
    return signings.map(signing => {
        const matchedBy = guesses.filter(guess => {
            if(guess.type === "league"){
                return Boolean(guess.valueId && signing.leagueId && guess.valueId === signing.leagueId);
            }
            if(guess.type === "nationality"){
                return Boolean(guess.valueId && signing.nationalityId && guess.valueId === signing.nationalityId);
            }
            return false;
        });
        return {
            ...signing,
            release: matchedBy.length > 0,
            matchedBy: matchedBy.map(guess => ({ type:guess.type, valueId:guess.valueId, value:guess.value }))
        };
    });
}

function lockTransferSignings(){
    if(!currentShowdown || transferCompletionInProgress){ return; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording" || normalizeTransferChallengePhase(challenge) !== TRANSFER_PHASES.SIGNING){ return; }

    cancelTransferDraftTimer();
    captureTransferPhaseForm(challenge);
    if(!persistCurrentTransferPhaseDraft(challenge, getSigningValidationMessage(challenge))){ return; }

    const previous = cloneForStorage(challenge);
    const previousShowdownStatus = currentShowdown.status;
    transferCompletionInProgress = true;
    setTransferCompletionBusy(true, "EVALUATING TRANSFERS...");
    try{
        challenge.signings.playerOne = evaluateSignings(challenge.signings.playerOne, challenge.guesses.againstPlayerOne);
        challenge.signings.playerTwo = evaluateSignings(challenge.signings.playerTwo, challenge.guesses.againstPlayerTwo);
        challenge.phase = TRANSFER_PHASES.COMPLETED;
        challenge.status = "completed";
        challenge.signingsLockedAt = Date.now();
        challenge.completedAt = challenge.signingsLockedAt;
        currentShowdown.status = "Ready";
        if(!saveCurrentShowdown()){ throw new Error("The transfer challenge verdicts could not be saved."); }
        transferDraftDirty = false;
        lastPersistedTransferDraftSignature = getTransferDraftSignature(challenge);
        if(typeof window.updateShowdownUI === "function"){ window.updateShowdownUI(); }
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

function setTransferCompletionBusy(isBusy, busyLabel = ""){
    const button = getTransferUI().completeButton;
    if(!button){ return; }
    button.disabled = isBusy;
    button.setAttribute("aria-busy", isBusy ? "true" : "false");
    if(isBusy && busyLabel){ setTransferText(button, busyLabel); }
}

function completeTransferChallenge(){
    if(!currentShowdown || transferCompletionInProgress){ return; }
    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){ return; }
    const phase = normalizeTransferChallengePhase(challenge);
    if(phase === TRANSFER_PHASES.GUESS){ lockTransferGuesses(); }
    else if(phase === TRANSFER_PHASES.SIGNING){ lockTransferSignings(); }
}

function clearTransferForm(){
    getTransferFields().forEach(field => {
        if(field.value !== ""){ field.value = ""; }
        if(field.dataset){ delete field.dataset.canonicalId; delete field.dataset.canonicalLabel; }
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
        const leagueField = getTransferElement(`${prefix}Signing${slot}League`);
        const nationalityField = getTransferElement(`${prefix}Signing${slot}Nationality`);
        if(typeof window.setTransferSelectorValue === "function"){
            window.setTransferSelectorValue(leagueField, "league", signing.leagueId || signing.league);
            window.setTransferSelectorValue(nationalityField, "nationality", signing.nationalityId || signing.nationality);
        }else{
            setTransferFieldValue(`${prefix}Signing${slot}League`, signing.league);
            setTransferFieldValue(`${prefix}Signing${slot}Nationality`, signing.nationality);
        }
    });
}

function restoreGuessRows(targetPrefix, guesses){
    guesses.forEach((guess, arrayIndex) => {
        const slot = Number(guess.slot) || (arrayIndex + 1);
        if(slot < 1 || slot > 3){ return; }
        const typeField = getTransferElement(`${targetPrefix}Guess${slot}Type`);
        const valueField = getTransferElement(`${targetPrefix}Guess${slot}Value`);
        setTransferFieldValue(`${targetPrefix}Guess${slot}Type`, guess.type);
        if(typeof window.updateTransferSelectorKind === "function" && (guess.type === "league" || guess.type === "nationality")){
            window.updateTransferSelectorKind(valueField, guess.type);
            window.setTransferSelectorValue(valueField, guess.type, guess.valueId || guess.value);
        }else{
            setTransferFieldValue(`${targetPrefix}Guess${slot}Value`, guess.value);
        }
        if(typeField){ typeField.value = guess.type || ""; }
    });
}

function restoreTransferForm(challenge){
    clearTransferForm();
    restoreSigningRows("p1", challenge.signings.playerOne || []);
    restoreSigningRows("p2", challenge.signings.playerTwo || []);
    restoreGuessRows("p1", challenge.guesses.againstPlayerOne || []);
    restoreGuessRows("p2", challenge.guesses.againstPlayerTwo || []);
    updateGuessValueAvailability(challenge);
}

function updateGuessValueAvailability(challenge){
    const editable = challenge && challenge.status === "recording" && normalizeTransferChallengePhase(challenge) === TRANSFER_PHASES.GUESS;
    for(let index = 1; index <= 3; index += 1){
        ["p1", "p2"].forEach(prefix => {
            const type = getTransferElement(`${prefix}Guess${index}Type`);
            const value = getTransferElement(`${prefix}Guess${index}Value`);
            if(type){ type.disabled = !editable; }
            if(value){ value.disabled = !editable || !(type && (type.value === "league" || type.value === "nationality")); }
        });
    }
}

function setTransferPhaseFieldState(challenge){
    const phase = normalizeTransferChallengePhase(challenge);
    const signingEditable = challenge.status === "recording" && phase === TRANSFER_PHASES.SIGNING;
    for(let index = 1; index <= 3; index += 1){
        ["p1", "p2"].forEach(prefix => {
            ["Name", "League", "Nationality"].forEach(suffix => {
                const field = getTransferElement(`${prefix}Signing${index}${suffix}`);
                if(field){ field.disabled = !signingEditable; }
            });
        });
    }
    updateGuessValueAvailability(challenge);
}

function renderTransferPhaseNavigator(phase){
    const currentIndex = TRANSFER_PHASE_ORDER.indexOf(phase);
    document.querySelectorAll("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step => {
        const index = TRANSFER_PHASE_ORDER.indexOf(step.dataset.transferPhaseStep);
        step.classList.toggle("active", index === currentIndex);
        step.classList.toggle("done", index >= 0 && index < currentIndex);
    });
}

function getTransferPhaseIntro(challenge){
    const phase = normalizeTransferChallengePhase(challenge);
    if(phase === TRANSFER_PHASES.WINDOW){
        return "<strong>Transfer Window</strong><span>15 minutes · maximum three signings each.</span> Make your moves in FIFA 17. No transfer details need to be entered here until the deadline closes.";
    }
    if(phase === TRANSFER_PHASES.GUESS){
        return "<strong>Guess Entry</strong><span>Guesses come first.</span> Each manager may record up to three League or Nationality guesses against the opponent. Locking this phase is a permanent saved transition.";
    }
    if(phase === TRANSFER_PHASES.SIGNING){
        return "<strong>Signing Entry</strong><span>Opponent guesses are already locked.</span> Record up to three completed signings for each manager using the canonical FIFA 17 former-league and nationality lists.";
    }
    return "<strong>Transfer Verdicts</strong><span>The challenge is locked.</span> Any signing matching at least one opponent League or Nationality guess must be released before the season begins.";
}

function renderGuessLockSummary(element, challenge){
    if(!element || !currentShowdown){ return; }
    const againstOne = challenge.guesses.againstPlayerOne.length;
    const againstTwo = challenge.guesses.againstPlayerTwo.length;
    const heading = document.createElement("strong");
    heading.textContent = "Guesses locked: ";
    const message = document.createTextNode(
        `${currentShowdown.managers.playerTwo} made ${againstOne} against ${currentShowdown.managers.playerOne}; `
        + `${currentShowdown.managers.playerOne} made ${againstTwo} against ${currentShowdown.managers.playerTwo}.`
    );
    element.replaceChildren(heading, message);
}

function renderTransferChallenge(challenge){
    if(!currentShowdown || !challenge){ return; }
    const ui = getTransferUI();
    const phase = normalizeTransferChallengePhase(challenge);
    challenge.phase = phase;
    if(ui.screen){ ui.screen.dataset.transferPhase = phase; }

    setTransferText(ui.title, `SEASON ${challenge.seasonNumber} TRANSFER CHALLENGE`);
    setTransferText(ui.managerOne, currentShowdown.managers.playerOne);
    setTransferText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setTransferText(ui.clubOne, currentShowdown.clubs.playerOne);
    setTransferText(ui.clubTwo, currentShowdown.clubs.playerTwo);
    setTransferText(ui.guessOneHeading, `${currentShowdown.managers.playerTwo} guesses ${currentShowdown.managers.playerOne}'s signings`);
    setTransferText(ui.guessTwoHeading, `${currentShowdown.managers.playerOne} guesses ${currentShowdown.managers.playerTwo}'s signings`);
    if(ui.intro){ ui.intro.innerHTML = getTransferPhaseIntro(challenge); }
    renderGuessLockSummary(ui.lockSummary, challenge);
    renderTransferPhaseNavigator(phase);

    const statusLabels = {
        not_started: "READY — 15 MINUTES · MAX 3 SIGNINGS EACH",
        active: "TRANSFER WINDOW LIVE",
        recording_guess: "WINDOW CLOSED — GUESS ENTRY",
        recording_signing: "GUESSES LOCKED — SIGNING ENTRY",
        completed: "TRANSFER CHALLENGE COMPLETE"
    };
    let statusKey = challenge.status;
    if(challenge.status === "recording"){
        statusKey = phase === TRANSFER_PHASES.SIGNING ? "recording_signing" : "recording_guess";
    }
    setTransferText(ui.phase, statusLabels[statusKey] || "TRANSFER CHALLENGE");

    setTransferHidden(ui.startButton, challenge.status !== "not_started");
    setTransferHidden(ui.endButton, challenge.status !== "active");
    setTransferHidden(ui.signingGrid, phase !== TRANSFER_PHASES.SIGNING);
    setTransferHidden(ui.guessGrid, phase !== TRANSFER_PHASES.GUESS);
    setTransferHidden(ui.privacyNote, phase !== TRANSFER_PHASES.GUESS);
    setTransferHidden(ui.lockSummary, phase !== TRANSFER_PHASES.SIGNING);
    setTransferHidden(ui.actionBar, challenge.status !== "recording");
    setTransferHidden(ui.completeButton, challenge.status !== "recording");
    setTransferHidden(ui.continueButton, challenge.status !== "completed");
    setTransferHidden(ui.results, challenge.status !== "completed");

    if(challenge.status === "recording"){
        setTransferText(ui.completeButton, phase === TRANSFER_PHASES.GUESS
            ? "LOCK GUESSES & CONTINUE TO SIGNINGS"
            : "LOCK SIGNINGS & REVEAL VERDICTS");
        ui.completeButton.disabled = false;
        ui.completeButton.setAttribute("aria-busy", "false");
    }

    setTransferPhaseFieldState(challenge);

    if(challenge.status === "not_started"){
        lastRenderedTimerSecond = null;
        renderTransferTimer(TRANSFER_WINDOW_SECONDS);
    }else if(challenge.status === "active"){
        const deadline = Number(challenge.deadlineAt);
        renderTransferTimer(Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0);
    }else{
        lastRenderedTimerSecond = null;
        renderTransferTimer(0);
    }

    if(challenge.status === "completed"){ renderTransferResults(challenge); }
    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderTransferResults(challenge){
    const ui = getTransferUI();
    renderManagerTransferResults(ui.resultsOne, currentShowdown.managers.playerOne, challenge.signings.playerOne);
    renderManagerTransferResults(ui.resultsTwo, currentShowdown.managers.playerTwo, challenge.signings.playerTwo);
}

function renderManagerTransferResults(container, managerName, signings){
    if(!container){ return; }
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
        if(signing.release && Array.isArray(signing.matchedBy) && signing.matchedBy.length){
            const match = document.createElement("span");
            match.textContent = `Matched: ${signing.matchedBy.map(item => item.value).join(" / ")}`;
            details.appendChild(match);
        }
        const verdict = document.createElement("b");
        verdict.textContent = signing.release ? "RELEASE" : "SAFE";
        row.append(details, verdict);
        fragment.appendChild(row);
    });
    container.replaceChildren(fragment);
}

function continueFromTransferChallenge(){
    if(!currentShowdown || !isTransferChallengeComplete(currentShowdown.currentRound)){ return; }
    if(!flushTransferDraftSave()){ return; }
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
window.normalizeTransferChallengePhase = normalizeTransferChallengePhase;
window.migrateTransferChallengeRecord = migrateTransferChallengeRecord;
window.lockTransferGuesses = lockTransferGuesses;
window.lockTransferSignings = lockTransferSignings;
