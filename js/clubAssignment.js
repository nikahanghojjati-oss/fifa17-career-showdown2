/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Race-Safe Two-Pack Club Reveal + Rivalry Confirmation
===================================================== */

const CLUB_REVEAL_STAGES = Object.freeze([
    "ready",
    "opening",
    "manager-one",
    "manager-two",
    "versus",
    "confirmation"
]);

/*
   The pair is already persisted before these presentation timers begin.
   Timings are intentionally finite: suspenseful enough to feel like a draw,
   short enough to remain pleasant when starting multiple showdowns.
*/
const CLUB_REVEAL_TIMINGS = Object.freeze({
    managerOne: 650,
    managerTwo: 1750,
    versus: 2850,
    confirmation: 3300
});

let clubAssignmentInProgress = false;
let clubAssignmentOperationId = 0;
let clubAssignmentTimers = new Set();
let clubAssignmentUI = null;

function cacheClubAssignmentUI(){
    clubAssignmentUI = {
        screen: document.getElementById("clubWheelScreen"),
        title: document.getElementById("clubAssignmentLeague"),
        status: document.getElementById("clubPackStatus"),
        playerOne: document.getElementById("clubPlayerOne"),
        playerTwo: document.getElementById("clubPlayerTwo"),
        clubOne: document.getElementById("clubNameOne"),
        clubTwo: document.getElementById("clubNameTwo"),
        cardOne: document.getElementById("clubCardOne"),
        cardTwo: document.getElementById("clubCardTwo"),
        cardStateOne: document.getElementById("clubCardStateOne"),
        cardStateTwo: document.getElementById("clubCardStateTwo"),
        revealButton: document.getElementById("openClubPack"),
        continueButton: document.getElementById("continueClubAssignment"),
        backButton: document.getElementById("clubAssignmentBack"),
        confirmation: document.getElementById("clubRivalryConfirmation"),
        confirmationShowdown: document.getElementById("clubConfirmationShowdown"),
        confirmationMeta: document.getElementById("clubConfirmationMeta"),
        confirmationManagerOne: document.getElementById("clubConfirmationManagerOne"),
        confirmationManagerTwo: document.getElementById("clubConfirmationManagerTwo"),
        confirmationClubOne: document.getElementById("clubConfirmationClubOne"),
        confirmationClubTwo: document.getElementById("clubConfirmationClubTwo"),
        progressSteps: Array.from(document.querySelectorAll("#clubWheelScreen [data-reveal-step]"))
    };
    return clubAssignmentUI;
}

function getClubAssignmentUI(){
    return clubAssignmentUI || cacheClubAssignmentUI();
}

function setClubText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function initializeClubAssignment(){
    const ui = cacheClubAssignmentUI();

    if(ui.revealButton && ui.revealButton.dataset.clubAssignmentBound !== "true"){
        ui.revealButton.dataset.clubAssignmentBound = "true";
        ui.revealButton.addEventListener("click", assignClubs);
    }

    if(ui.continueButton && ui.continueButton.dataset.clubAssignmentBound !== "true"){
        ui.continueButton.dataset.clubAssignmentBound = "true";
        ui.continueButton.addEventListener("click", continueToShowdownHome);
    }
}

function clearClubAssignmentTimers(){
    clubAssignmentTimers.forEach(timerId => window.clearTimeout(timerId));
    clubAssignmentTimers.clear();
}

function cancelClubAssignmentOperation(){
    clearClubAssignmentTimers();
    clubAssignmentOperationId += 1;
    clubAssignmentInProgress = false;
}

function isClubAssignmentOperationCurrent(operationId, showdownId, leagueId){
    return operationId === clubAssignmentOperationId
        && Boolean(currentShowdown)
        && String(currentShowdown.id) === String(showdownId)
        && Boolean(currentShowdown.selectedLeague)
        && String(currentShowdown.selectedLeague.id) === String(leagueId);
}

function isReducedClubMotionPreferred(){
    if(typeof window.isReducedMotionPreferred === "function"){
        return window.isReducedMotionPreferred();
    }
    return typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getClubRevealStageIndex(stage){
    return CLUB_REVEAL_STAGES.indexOf(stage);
}

function setClubRevealStage(stage){
    const ui = getClubAssignmentUI();
    const normalized = CLUB_REVEAL_STAGES.includes(stage) ? stage : "ready";
    const activeIndex = getClubRevealStageIndex(normalized);

    if(ui.screen){
        ui.screen.dataset.clubRevealStage = normalized;
    }

    ui.progressSteps.forEach(step => {
        const stepIndex = getClubRevealStageIndex(step.dataset.revealStep);
        step.classList.toggle("active", stepIndex === activeIndex);
        step.classList.toggle("done", stepIndex >= 0 && stepIndex < activeIndex);
    });
}

function clearCardIdentityVariables(card){
    if(!card){ return; }
    card.style.removeProperty("--club-primary");
    card.style.removeProperty("--club-secondary");
    card.style.removeProperty("--club-accent");
    card.style.removeProperty("--club-angle");
}

function resetClubRevealCard(card, clubElement, stateElement){
    if(clubElement){
        setClubText(clubElement, "?");
        if(typeof window.applyClubIdentity === "function"){
            window.applyClubIdentity(clubElement, null);
        }
    }

    setClubText(stateElement, "SEALED");
    if(card){
        card.classList.remove("is-revealed");
        clearCardIdentityVariables(card);
    }
}

function applyClubRevealCard(card, clubElement, stateElement, clubName){
    const name = String(clubName || "");
    setClubText(clubElement, name || "?");

    if(typeof window.applyClubIdentity === "function"){
        window.applyClubIdentity(clubElement, name);
    }

    if(card && typeof window.getClubIdentity === "function" && name){
        const identity = window.getClubIdentity(name);
        card.style.setProperty("--club-primary", identity.primary);
        card.style.setProperty("--club-secondary", identity.secondary);
        card.style.setProperty("--club-accent", identity.accent);
        card.style.setProperty("--club-angle", identity.angle);
    }

    setClubText(stateElement, "REVEALED");
    if(card){ card.classList.add("is-revealed"); }
}

function resetClubRevealCards(){
    const ui = getClubAssignmentUI();
    resetClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne);
    resetClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo);
}

function populateClubAssignmentBase(){
    if(!currentShowdown || !currentShowdown.selectedLeague){ return; }
    const ui = getClubAssignmentUI();
    setClubText(ui.title, currentShowdown.selectedLeague.name);
    setClubText(ui.playerOne, currentShowdown.managers.playerOne);
    setClubText(ui.playerTwo, currentShowdown.managers.playerTwo);
}

function populateClubConfirmation(){
    if(!currentShowdown || !currentShowdown.selectedLeague){ return; }
    const ui = getClubAssignmentUI();
    const total = Number(currentShowdown.totalRounds) || 1;

    setClubText(ui.confirmationShowdown, currentShowdown.name || "SHOWDOWN");
    setClubText(
        ui.confirmationMeta,
        `${currentShowdown.selectedLeague.name} · ${total} season${total === 1 ? "" : "s"}`
    );
    setClubText(ui.confirmationManagerOne, currentShowdown.managers.playerOne);
    setClubText(ui.confirmationManagerTwo, currentShowdown.managers.playerTwo);
    setClubText(ui.confirmationClubOne, currentShowdown.clubs.playerOne || "?");
    setClubText(ui.confirmationClubTwo, currentShowdown.clubs.playerTwo || "?");

    if(typeof window.applyClubIdentity === "function"){
        window.applyClubIdentity(ui.confirmationClubOne, currentShowdown.clubs.playerOne);
        window.applyClubIdentity(ui.confirmationClubTwo, currentShowdown.clubs.playerTwo);
    }
}

function setRevealControls({ showOpen, openDisabled, showConfirm, confirmDisabled, allowBack }){
    const ui = getClubAssignmentUI();

    if(ui.revealButton){
        ui.revealButton.classList.toggle("hidden", !showOpen);
        ui.revealButton.disabled = Boolean(openDisabled);
    }
    if(ui.continueButton){
        ui.continueButton.classList.toggle("hidden", !showConfirm);
        ui.continueButton.disabled = Boolean(confirmDisabled);
    }
    if(ui.backButton){
        ui.backButton.classList.toggle("hidden", !allowBack);
        ui.backButton.disabled = !allowBack;
        ui.backButton.setAttribute("aria-disabled", String(!allowBack));
    }
}

function renderReadyAssignmentState(){
    const ui = getClubAssignmentUI();
    setClubRevealStage("ready");
    resetClubRevealCards();
    if(ui.confirmation){ ui.confirmation.classList.add("hidden"); }
    setClubText(ui.status, "LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY");
    setClubText(ui.revealButton, "OPEN SHOWDOWN PACKS");
    setClubText(ui.continueButton, "CONFIRM RIVALRY & START SHOWDOWN");
    setRevealControls({
        showOpen: true,
        openDisabled: false,
        showConfirm: false,
        confirmDisabled: true,
        allowBack: true
    });
}

function renderClubRevealStage(stage){
    if(!currentShowdown){ return; }
    const ui = getClubAssignmentUI();
    setClubRevealStage(stage);

    if(stage === "opening"){
        resetClubRevealCards();
        if(ui.confirmation){ ui.confirmation.classList.add("hidden"); }
        setClubText(ui.status, "CLUB DRAW SAVED · PREPARING PACK 01");
        setClubText(ui.revealButton, "DRAW LOCKED...");
        setRevealControls({
            showOpen: true,
            openDisabled: true,
            showConfirm: false,
            confirmDisabled: true,
            allowBack: false
        });
        return;
    }

    if(stage === "manager-one"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        resetClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo);
        setClubText(ui.status, `${currentShowdown.managers.playerOne.toUpperCase()} · PACK 01 OPEN`);
        return;
    }

    if(stage === "manager-two"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        applyClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo, currentShowdown.clubs.playerTwo);
        setClubText(ui.status, `${currentShowdown.managers.playerTwo.toUpperCase()} · PACK 02 OPEN`);
        return;
    }

    if(stage === "versus"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        applyClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo, currentShowdown.clubs.playerTwo);
        populateClubConfirmation();
        if(ui.confirmation){ ui.confirmation.classList.remove("hidden"); }
        setClubText(ui.status, "BOTH CLUBS REVEALED · BUILDING RIVALRY");
        setRevealControls({
            showOpen: false,
            openDisabled: true,
            showConfirm: false,
            confirmDisabled: true,
            allowBack: false
        });
        return;
    }

    renderClubConfirmationState();
}

function renderClubConfirmationState(){
    if(!currentShowdown){ return; }
    const ui = getClubAssignmentUI();

    setClubRevealStage("confirmation");
    applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
    applyClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo, currentShowdown.clubs.playerTwo);
    populateClubConfirmation();

    if(ui.confirmation){ ui.confirmation.classList.remove("hidden"); }
    setClubText(ui.status, "RIVALRY READY · CONFIRM TO BEGIN");
    setClubText(ui.continueButton, "CONFIRM RIVALRY & START SHOWDOWN");
    setRevealControls({
        showOpen: false,
        openDisabled: true,
        showConfirm: true,
        confirmDisabled: false,
        allowBack: false
    });
}

function scheduleClubRevealStage(delay, stage, operationId, showdownId, leagueId){
    const timerId = window.setTimeout(() => {
        clubAssignmentTimers.delete(timerId);
        if(!isClubAssignmentOperationCurrent(operationId, showdownId, leagueId)){
            return;
        }

        renderClubRevealStage(stage);
        if(stage === "confirmation"){
            clubAssignmentInProgress = false;
        }
    }, delay);

    clubAssignmentTimers.add(timerId);
}

function startClubRevealSequence(operationId, showdownId, leagueId){
    clubAssignmentInProgress = true;
    renderClubRevealStage("opening");

    if(isReducedClubMotionPreferred()){
        renderClubConfirmationState();
        clubAssignmentInProgress = false;
        return;
    }

    scheduleClubRevealStage(CLUB_REVEAL_TIMINGS.managerOne, "manager-one", operationId, showdownId, leagueId);
    scheduleClubRevealStage(CLUB_REVEAL_TIMINGS.managerTwo, "manager-two", operationId, showdownId, leagueId);
    scheduleClubRevealStage(CLUB_REVEAL_TIMINGS.versus, "versus", operationId, showdownId, leagueId);
    scheduleClubRevealStage(CLUB_REVEAL_TIMINGS.confirmation, "confirmation", operationId, showdownId, leagueId);
}

function prepareClubAssignment(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        showScreen("leagueWheelScreen");
        return;
    }
    showScreen("clubWheelScreen");
}

function renderClubAssignmentState(){
    if(!currentShowdown || !currentShowdown.selectedLeague){ return; }
    populateClubAssignmentBase();

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(integrity.valid){
        if(!clubAssignmentInProgress){
            renderClubConfirmationState();
        }
        return;
    }

    if(!clubAssignmentInProgress){
        renderReadyAssignmentState();
    }
}

function assignClubs(){
    if(!currentShowdown || !currentShowdown.selectedLeague || clubAssignmentInProgress){
        return;
    }

    const existingIntegrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(existingIntegrity.valid){
        renderClubConfirmationState();
        return;
    }

    const leagueId = currentShowdown.selectedLeague.id;
    const pair = getRandomClubPair(leagueId);
    const ui = getClubAssignmentUI();

    if(!pair){
        setClubText(ui.status, "NO CLUB DATA AVAILABLE");
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Club assignment data is unavailable for the selected league.", "error");
        }
        return;
    }

    cancelClubAssignmentOperation();
    const operationId = clubAssignmentOperationId;
    const showdownId = currentShowdown.id;
    const previousClubs = {
        playerOne: currentShowdown.clubs.playerOne,
        playerTwo: currentShowdown.clubs.playerTwo
    };
    const previousStatus = currentShowdown.status;

    currentShowdown.clubs = pair;
    currentShowdown.status = "Clubs Assigned";

    if(!saveCurrentShowdown()){
        currentShowdown.clubs = previousClubs;
        currentShowdown.status = previousStatus;
        renderReadyAssignmentState();
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "The club assignment could not be saved. No clubs were locked.",
                "error",
                9000
            );
        }
        return;
    }

    if(typeof window.updateShowdownUI === "function"){
        window.updateShowdownUI();
    }

    startClubRevealSequence(operationId, showdownId, leagueId);
}

function continueToShowdownHome(){
    if(!currentShowdown || clubAssignmentInProgress){ return; }

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(!integrity.valid){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Assign two valid clubs before confirming the rivalry.", "error");
        }
        renderClubAssignmentState();
        return;
    }

    const previousStatus = currentShowdown.status;
    if(currentShowdown.status !== "Completed"){
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
        currentShowdown.status = previousStatus;
        renderClubConfirmationState();
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The showdown could not be saved before starting the rivalry.", "error");
        }
        return;
    }

    if(typeof window.updateShowdownUI === "function"){
        window.updateShowdownUI();
    }
    showScreen("dashboard");
}

window.initializeClubAssignment = initializeClubAssignment;
window.renderClubAssignmentState = renderClubAssignmentState;
window.prepareClubAssignment = prepareClubAssignment;
window.assignClubs = assignClubs;
window.cancelClubAssignmentOperation = cancelClubAssignmentOperation;
