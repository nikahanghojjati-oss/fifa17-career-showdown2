/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1
   League Wheel System
===================================================== */

document.addEventListener("DOMContentLoaded", initializeLeagueWheel);

function initializeLeagueWheel(){
    const spinButton = document.getElementById("spinLeague");
    if(spinButton){ spinButton.addEventListener("click", spinLeagueWheel); }
}

function spinLeagueWheel(){
    const wheel = document.getElementById("leagueWheel");
    const track = wheel ? wheel.querySelector(".wheelTrack") : null;
    const result = document.getElementById("selectedLeague");
    const spinButton = document.getElementById("spinLeague");

    if(!wheel || !track || !result || !currentShowdown){ return; }

    const selected = getRandomLeague();
    const selectedIndex = leagues.findIndex(league => league.id === selected.id);
    const itemStep = 360 / leagues.length;
    const targetRotation = (5 * 360) - (selectedIndex * itemStep);

    track.style.transform = `rotate(${targetRotation}deg)`;
    if(spinButton){ spinButton.disabled = true; }
    result.textContent = "SPINNING...";

    setTimeout(() => {
        currentShowdown.selectedLeague = selected;
        currentShowdown.status = "League Selected";
        saveCurrentShowdown();
        updateShowdownUI();
        result.textContent = selected.name;
        if(spinButton){ spinButton.disabled = false; }

        setTimeout(() => {
            prepareClubAssignment();
        }, 900);
    }, 4000);
}
