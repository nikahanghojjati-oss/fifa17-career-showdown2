/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   League Wheel System
===================================================== */

let leagueWheelSpinInProgress = false;

function initializeLeagueWheel(){
    const spinButton = document.getElementById("spinLeague");
    if(!spinButton || spinButton.dataset.leagueWheelBound === "true"){
        return;
    }

    spinButton.dataset.leagueWheelBound = "true";
    spinButton.addEventListener("click", handleLeagueWheelAction);
}

function getLeagueRotation(leagueId, revolutions = 0){
    const selectedIndex = leagues.findIndex(league => league.id === leagueId);
    if(selectedIndex < 0){
        return 0;
    }

    const itemStep = 360 / leagues.length;
    return (revolutions * 360) - (selectedIndex * itemStep);
}

function hasLockedClubAssignment(){
    if(!currentShowdown){
        return false;
    }

    const integrity = typeof getClubPairIntegrity === "function"
        ? getClubPairIntegrity(currentShowdown)
        : { valid: Boolean(currentShowdown.clubs.playerOne && currentShowdown.clubs.playerTwo) };

    return Boolean(integrity.valid);
}

function setWheelRotationWithoutAnimation(track, rotation){
    if(!track){
        return;
    }

    const previousTransition = track.style.transition;
    track.style.transition = "none";
    track.style.transform = `rotate(${rotation}deg)`;
    void track.offsetWidth;
    track.style.transition = previousTransition;
}

function renderLeagueWheelState(){
    const wheel = document.getElementById("leagueWheel");
    const track = wheel ? wheel.querySelector(".wheelTrack") : null;
    const result = document.getElementById("selectedLeague");
    const spinButton = document.getElementById("spinLeague");
    const note = document.getElementById("leagueStateNote");

    if(!result || !spinButton){
        return;
    }

    if(!currentShowdown || !currentShowdown.selectedLeague){
        setWheelRotationWithoutAnimation(track, 0);
        result.textContent = "Spin to select league";
        spinButton.textContent = "SPIN WHEEL";
        spinButton.disabled = leagueWheelSpinInProgress;
        if(note){
            note.textContent = "";
            note.classList.add("hidden");
            note.classList.remove("locked");
        }
        return;
    }

    const selected = currentShowdown.selectedLeague;
    result.textContent = selected.name;
    setWheelRotationWithoutAnimation(track, getLeagueRotation(selected.id));

    if(hasLockedClubAssignment()){
        spinButton.textContent = "LEAGUE LOCKED";
        spinButton.disabled = true;
        if(note){
            note.textContent = "League and clubs are permanent for this showdown.";
            note.classList.remove("hidden");
            note.classList.add("locked");
        }
    }else{
        spinButton.textContent = "CONTINUE TO CLUB ASSIGNMENT";
        spinButton.disabled = false;
        if(note){
            note.textContent = `${selected.name} has been selected. The league cannot be re-spun; continue to assign the two permanent clubs.`;
            note.classList.remove("hidden", "locked");
        }
    }
}

function handleLeagueWheelAction(){
    if(!currentShowdown || leagueWheelSpinInProgress){
        return;
    }

    if(currentShowdown.selectedLeague){
        if(hasLockedClubAssignment()){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The league is locked because clubs have already been assigned for this showdown.",
                    "error",
                    6000
                );
            }
            renderLeagueWheelState();
            return;
        }

        prepareClubAssignment();
        return;
    }

    spinLeagueWheel();
}

function spinLeagueWheel(){
    const wheel = document.getElementById("leagueWheel");
    const track = wheel ? wheel.querySelector(".wheelTrack") : null;
    const result = document.getElementById("selectedLeague");
    const spinButton = document.getElementById("spinLeague");
    const note = document.getElementById("leagueStateNote");

    if(!wheel || !track || !result || !spinButton || !currentShowdown || leagueWheelSpinInProgress){
        return;
    }

    if(currentShowdown.selectedLeague){
        handleLeagueWheelAction();
        return;
    }

    const selected = getRandomLeague();
    if(!selected){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No league could be selected. Refresh the page and try again.", "error");
        }
        return;
    }

    leagueWheelSpinInProgress = true;
    spinButton.disabled = true;
    spinButton.textContent = "SPINNING...";
    result.textContent = "SPINNING...";
    if(note){ note.classList.add("hidden"); }
    track.style.transform = `rotate(${getLeagueRotation(selected.id, 5)}deg)`;

    window.setTimeout(() => {
        const previousLeague = currentShowdown.selectedLeague;
        const previousStatus = currentShowdown.status;

        currentShowdown.selectedLeague = selected;
        currentShowdown.status = "League Selected";

        if(!saveCurrentShowdown()){
            currentShowdown.selectedLeague = previousLeague;
            currentShowdown.status = previousStatus;
            leagueWheelSpinInProgress = false;
            renderLeagueWheelState();

            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The selected league could not be saved. The selection was not locked.",
                    "error",
                    9000
                );
            }
            return;
        }

        leagueWheelSpinInProgress = false;
        updateShowdownUI();
        result.textContent = selected.name;
        spinButton.textContent = "CONTINUE TO CLUB ASSIGNMENT";
        spinButton.disabled = false;

        if(note){
            note.textContent = `${selected.name} has been selected. The league cannot be re-spun; continue to assign the two permanent clubs.`;
            note.classList.remove("hidden", "locked");
        }

        window.setTimeout(() => {
            if(currentShowdown && currentShowdown.selectedLeague && currentShowdown.selectedLeague.id === selected.id){
                prepareClubAssignment();
            }
        }, 700);
    }, 4000);
}

window.initializeLeagueWheel = initializeLeagueWheel;
window.renderLeagueWheelState = renderLeagueWheelState;
window.spinLeagueWheel = spinLeagueWheel;
