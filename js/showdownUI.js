/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1
   Showdown Interface Controller
===================================================== */

document.addEventListener("DOMContentLoaded", initializeShowdownUI);

function initializeShowdownUI(){
    const startButton = document.getElementById("startShowdown");
    if(startButton){ startButton.addEventListener("click", createShowdown); }
}

function updateShowdownUI(){
    if(!currentShowdown){ return; }

    const indicator = document.getElementById("seasonIndicator");
    if(indicator){ indicator.textContent = `Season ${currentShowdown.currentRound || 1}`; }

    const selectedLeague = document.getElementById("selectedLeague");
    if(selectedLeague && currentShowdown.selectedLeague){ selectedLeague.textContent = currentShowdown.selectedLeague.name; }

    const managerOne = document.getElementById("dashboardManagerOne");
    const managerTwo = document.getElementById("dashboardManagerTwo");
    const clubOne = document.getElementById("dashboardClubOne");
    const clubTwo = document.getElementById("dashboardClubTwo");

    if(managerOne){ managerOne.textContent = currentShowdown.managers.playerOne; }
    if(managerTwo){ managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne || "Club not assigned"; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo || "Club not assigned"; }
}
