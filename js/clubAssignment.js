/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.15.1
   Race-Safe Club Assignment / FUT Style Reveal
===================================================== */

let clubAssignmentInProgress = false;
let clubAssignmentOperationId = 0;
let clubAssignmentTimer = null;
let clubAssignmentUI = null;

function cacheClubAssignmentUI(){
    clubAssignmentUI = {
        title: document.getElementById("clubAssignmentLeague"),
        status: document.getElementById("clubPackStatus"),
        playerOne: document.getElementById("clubPlayerOne"),
        playerTwo: document.getElementById("clubPlayerTwo"),
        clubOne: document.getElementById("clubNameOne"),
        clubTwo: document.getElementById("clubNameTwo"),
        revealButton: document.getElementById("openClubPack"),
        continueButton: document.getElementById("continueClubAssignment"),
        backButton: document.getElementById("clubAssignmentBack"),
        cards: Array.from(document.querySelectorAll(".clubRevealCard"))
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

function cancelClubAssignmentOperation(){
    if(clubAssignmentTimer){
        window.clearTimeout(clubAssignmentTimer);
        clubAssignmentTimer = null;
    }
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

function prepareClubAssignment(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        showScreen("leagueWheelScreen");
        return;
    }

    showScreen("clubWheelScreen");
}

function resetClubRevealCards(){
    const ui = getClubAssignmentUI();

    if(ui.clubOne){
        setClubText(ui.clubOne, "?");
        if(typeof window.applyClubIdentity === "function"){ window.applyClubIdentity(ui.clubOne, null); }
    }
    if(ui.clubTwo){
        setClubText(ui.clubTwo, "?");
        if(typeof window.applyClubIdentity === "function"){ window.applyClubIdentity(ui.clubTwo, null); }
    }

    ui.cards.forEach(card => {
        card.classList.remove("revealed");
    });
}

function renderClubAssignmentState(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        return;
    }

    const ui = getClubAssignmentUI();
    const league = currentShowdown.selectedLeague;

    setClubText(ui.title, league.name);
    setClubText(ui.playerOne, currentShowdown.managers.playerOne);
    setClubText(ui.playerTwo, currentShowdown.managers.playerTwo);

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(integrity.valid){
        renderClubResults();
        setClubText(ui.status, "CLUBS LOCKED FOR THIS SHOWDOWN");

        if(ui.revealButton){
            setClubText(ui.revealButton, "CLUBS LOCKED");
            ui.revealButton.disabled = true;
        }
        if(ui.continueButton){
            ui.continueButton.disabled = false;
            setClubText(ui.continueButton, "SHOWDOWN HOME");
        }
        if(ui.backButton){
            ui.backButton.classList.add("hidden");
            ui.backButton.disabled = true;
        }
        return;
    }

    resetClubRevealCards();
    setClubText(ui.status, clubAssignmentInProgress ? "OPENING PACK..." : "READY FOR REVEAL");

    if(ui.revealButton){
        setClubText(ui.revealButton, clubAssignmentInProgress ? "OPENING PACK..." : "OPEN CLUB PACK");
        ui.revealButton.disabled = clubAssignmentInProgress;
    }
    if(ui.continueButton){
        ui.continueButton.disabled = true;
        setClubText(ui.continueButton, "ASSIGN CLUBS TO CONTINUE");
    }
    if(ui.backButton){
        ui.backButton.classList.remove("hidden");
        ui.backButton.disabled = clubAssignmentInProgress;
        ui.backButton.setAttribute("aria-disabled", String(clubAssignmentInProgress));
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
        renderClubAssignmentState();
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
    const operationId = ++clubAssignmentOperationId;
    const showdownId = currentShowdown.id;

    clubAssignmentInProgress = true;
    renderClubAssignmentState();

    clubAssignmentTimer = window.setTimeout(() => {
        clubAssignmentTimer = null;

        if(!isClubAssignmentOperationCurrent(operationId, showdownId, leagueId)){
            return;
        }

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
            clubAssignmentInProgress = false;
            renderClubAssignmentState();

            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The club assignment could not be saved. No clubs were locked.",
                    "error",
                    9000
                );
            }
            return;
        }

        clubAssignmentInProgress = false;
        updateShowdownUI();
        renderClubAssignmentState();

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Clubs assigned and locked for the showdown.", "success", 3500);
        }
    }, 1400);
}

function renderClubResults(){
    if(!currentShowdown){
        return;
    }

    const ui = getClubAssignmentUI();
    setClubText(ui.clubOne, currentShowdown.clubs.playerOne || "?");
    setClubText(ui.clubTwo, currentShowdown.clubs.playerTwo || "?");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }

    ui.cards.forEach(card => {
        card.classList.add("revealed");
    });
}

function continueToShowdownHome(){
    if(!currentShowdown || clubAssignmentInProgress){
        return;
    }

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(!integrity.valid){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Assign two valid clubs before continuing to Showdown Home.", "error");
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
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("The showdown could not be saved before opening Showdown Home.", "error");
        }
        return;
    }

    updateShowdownUI();
    showScreen("dashboard");
}

window.initializeClubAssignment = initializeClubAssignment;
window.renderClubAssignmentState = renderClubAssignmentState;
window.prepareClubAssignment = prepareClubAssignment;
window.assignClubs = assignClubs;
window.cancelClubAssignmentOperation = cancelClubAssignmentOperation;
