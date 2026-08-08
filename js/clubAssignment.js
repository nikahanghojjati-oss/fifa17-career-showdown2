/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.7.0
   Club Assignment / FUT Style Reveal
===================================================== */

function initializeClubAssignment(){
    const revealButton = document.getElementById("openClubPack");
    if(revealButton){ revealButton.addEventListener("click", assignClubs); }
}

function prepareClubAssignment(){
    if(!currentShowdown || !currentShowdown.selectedLeague){
        showScreen("leagueWheelScreen");
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    const league = currentShowdown.selectedLeague;
    const title = document.getElementById("clubAssignmentLeague");
    const status = document.getElementById("clubPackStatus");
    const playerOne = document.getElementById("clubPlayerOne");
    const playerTwo = document.getElementById("clubPlayerTwo");

    if(title){ title.textContent = league.name; }
    if(status){ status.textContent = currentShowdown.clubs.playerOne ? "CLUBS ASSIGNED" : "READY FOR REVEAL"; }
    if(playerOne){ playerOne.textContent = currentShowdown.managers.playerOne; }
    if(playerTwo){ playerTwo.textContent = currentShowdown.managers.playerTwo; }

    showScreen("clubWheelScreen");

    if(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo){
        renderClubResults();
    }
}

function assignClubs(){
    if(!currentShowdown || !currentShowdown.selectedLeague){ return; }

    currentShowdown = normalizeShowdown(currentShowdown);

    if(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo){
        renderClubResults();
        return;
    }

    const pair = getRandomClubPair(currentShowdown.selectedLeague.id);
    const status = document.getElementById("clubPackStatus");
    const revealButton = document.getElementById("openClubPack");

    if(!pair){
        if(status){ status.textContent = "NO CLUB DATA AVAILABLE"; }
        return;
    }

    if(revealButton){ revealButton.disabled = true; }
    if(status){ status.textContent = "OPENING PACK..."; }

    setTimeout(() => {
        currentShowdown.clubs = pair;
        currentShowdown.status = "Clubs Assigned";
        saveCurrentShowdown();
        renderClubResults();
        if(status){ status.textContent = "CLUBS ASSIGNED"; }
        if(revealButton){ revealButton.disabled = false; }
    }, 1400);
}

function renderClubResults(){
    if(!currentShowdown){ return; }

    const clubOne = document.getElementById("clubNameOne");
    const clubTwo = document.getElementById("clubNameTwo");
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo; }

    document.querySelectorAll(".clubRevealCard").forEach(card => card.classList.add("revealed"));
}

function continueToShowdownHome(){
    if(!currentShowdown || !currentShowdown.clubs.playerOne || !currentShowdown.clubs.playerTwo){ return; }

    if(currentShowdown.status !== "Completed"){
        currentShowdown.status = "Ready";
    }

    saveCurrentShowdown();
    updateShowdownUI();
    showScreen("dashboard");
}

document.addEventListener("DOMContentLoaded", initializeClubAssignment);
