/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1

   League Wheel System
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeLeagueWheel();
});

function initializeLeagueWheel(){
    const spinButton = document.getElementById("spinLeague");

    if(spinButton){
        spinButton.addEventListener("click", spinLeagueWheel);
    }
}

function spinLeagueWheel(){
    const wheel = document.getElementById("leagueWheel");
    const track = wheel ? wheel.querySelector(".wheelTrack") : null;
    const result = document.getElementById("selectedLeague");

    if(!wheel || !track || !result){
        return;
    }

    const selected = getRandomLeague();
    const leaguesCount = leagues.length;
    const selectedIndex = leagues.findIndex(league => league.id === selected.id);
    const itemStep = 360 / leaguesCount;

    const extraSpins = 5;
    const targetRotation = (extraSpins * 360) - (selectedIndex * itemStep);

    track.style.transform = `rotate(${targetRotation}deg)`;

    const spinButton = document.getElementById("spinLeague");
    if(spinButton){
        spinButton.disabled = true;
    }

    setTimeout(() => {
        result.innerText = selected.name;

        if(currentShowdown){
            currentShowdown.selectedLeague = selected;
            currentShowdown.status = "League Selected";
            saveCurrentShowdown();
            updateShowdownUI();
        }

        if(spinButton){
            spinButton.disabled = false;
        }
    }, 4000);
}
