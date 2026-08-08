/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.11.0
   Club Assignment / FUT Style Reveal
===================================================== */

let clubAssignmentInProgress = false;

function initializeClubAssignment(){
    const revealButton = document.getElementById("openClubPack");
    const continueButton = document.getElementById("continueClubAssignment");

    if(revealButton && revealButton.dataset.clubAssignmentBound !== "true"){
        revealButton.dataset.clubAssignmentBound = "true";
        revealButton.addEventListener("click", assignClubs);
    }

    if(continueButton && continueButton.dataset.clubAssignmentBound !== "true"){
        continueButton.dataset.clubAssignmentBound = "true";
        continueButton.addEventListener("click", continueToShowdownHome);
    }
}

function prepareClubAssignment(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        showScreen("leagueWheelScreen");
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);
    showScreen("clubWheelScreen");
}

function resetClubRevealCards(){
    const clubOne = document.getElementById("clubNameOne");
    const clubTwo = document.getElementById("clubNameTwo");

    if(clubOne){ clubOne.textContent = "?"; }
    if(clubTwo){ clubTwo.textContent = "?"; }

    document.querySelectorAll(".clubRevealCard").forEach(card => {
        card.classList.remove("revealed");
    });
}

function renderClubAssignmentState(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        return;
    }

    const league = currentShowdown.selectedLeague;
    const title = document.getElementById("clubAssignmentLeague");
    const status = document.getElementById("clubPackStatus");
    const playerOne = document.getElementById("clubPlayerOne");
    const playerTwo = document.getElementById("clubPlayerTwo");
    const revealButton = document.getElementById("openClubPack");
    const continueButton = document.getElementById("continueClubAssignment");
    const backButton = document.getElementById("clubAssignmentBack");

    if(title){ title.textContent = league.name; }
    if(playerOne){ playerOne.textContent = currentShowdown.managers.playerOne; }
    if(playerTwo){ playerTwo.textContent = currentShowdown.managers.playerTwo; }

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(integrity.valid){
        renderClubResults();
        if(status){ status.textContent = "CLUBS LOCKED FOR THIS SHOWDOWN"; }
        if(revealButton){
            revealButton.textContent = "CLUBS LOCKED";
            revealButton.disabled = true;
        }
        if(continueButton){
            continueButton.disabled = false;
            continueButton.textContent = "SHOWDOWN HOME";
        }
        if(backButton){
            backButton.classList.add("hidden");
            backButton.disabled = true;
        }
        return;
    }

    resetClubRevealCards();
    if(status){ status.textContent = clubAssignmentInProgress ? "OPENING PACK..." : "READY FOR REVEAL"; }
    if(revealButton){
        revealButton.textContent = clubAssignmentInProgress ? "OPENING PACK..." : "OPEN CLUB PACK";
        revealButton.disabled = clubAssignmentInProgress;
    }
    if(continueButton){
        continueButton.disabled = true;
        continueButton.textContent = "ASSIGN CLUBS TO CONTINUE";
    }
    if(backButton){
        backButton.classList.remove("hidden");
        backButton.disabled = false;
    }
}

function assignClubs(){
    if(!currentShowdown || !currentShowdown.selectedLeague || clubAssignmentInProgress){
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    const existingIntegrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    if(existingIntegrity.valid){
        renderClubAssignmentState();
        return;
    }

    const pair = getRandomClubPair(currentShowdown.selectedLeague.id);
    const status = document.getElementById("clubPackStatus");

    if(!pair){
        if(status){ status.textContent = "NO CLUB DATA AVAILABLE"; }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Club assignment data is unavailable for the selected league.", "error");
        }
        return;
    }

    clubAssignmentInProgress = true;
    renderClubAssignmentState();

    window.setTimeout(() => {
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

    const clubOne = document.getElementById("clubNameOne");
    const clubTwo = document.getElementById("clubNameTwo");

    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne || "?"; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo || "?"; }

    document.querySelectorAll(".clubRevealCard").forEach(card => {
        card.classList.add("revealed");
    });
}

function continueToShowdownHome(){
    if(!currentShowdown){
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

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

    if(currentShowdown.status !== "Completed"){
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
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
