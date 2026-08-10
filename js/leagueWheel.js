/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.0
   Race-Safe League Wheel System
===================================================== */

const LEAGUE_WHEEL_SPIN_MS = 4000;
const LEAGUE_WHEEL_REDUCED_SPIN_MS = 80;

let leagueWheelSpinInProgress = false;
let leagueWheelOperationId = 0;
let leagueWheelSpinTimer = null;

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

function isReducedLeagueWheelMotionPreferred(){
    if(typeof window.isReducedMotionPreferred === "function"){
        return window.isReducedMotionPreferred();
    }
    return typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getLeagueWheelTiming(){
    return {
        spin: isReducedLeagueWheelMotionPreferred()
            ? LEAGUE_WHEEL_REDUCED_SPIN_MS
            : LEAGUE_WHEEL_SPIN_MS
    };
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

function isLeagueSelectionConfirmed(){
    return Boolean(
        currentShowdown
        && currentShowdown.selectedLeague
        && currentShowdown.status === "League Confirmed"
    );
}

function getLeagueBackButton(){
    return document.querySelector("#leagueWheelScreen .backButton");
}

function setLeagueWheelBusy(busy){
    leagueWheelSpinInProgress = Boolean(busy);
    const backButton = getLeagueBackButton();
    if(backButton){
        backButton.disabled = leagueWheelSpinInProgress;
        backButton.setAttribute("aria-disabled", String(leagueWheelSpinInProgress));
    }
}

function clearLeagueWheelTimers(){
    if(leagueWheelSpinTimer){
        window.clearTimeout(leagueWheelSpinTimer);
        leagueWheelSpinTimer = null;
    }
}

function cancelLeagueWheelOperation(){
    clearLeagueWheelTimers();
    leagueWheelOperationId += 1;
    setLeagueWheelBusy(false);
}

function isLeagueWheelOperationCurrent(operationId, showdownId){
    return operationId === leagueWheelOperationId
        && Boolean(currentShowdown)
        && String(currentShowdown.id) === String(showdownId);
}

function setWheelRotationWithoutAnimation(track, rotation){
    if(!track){
        return;
    }

    const nextTransform = `rotate(${rotation}deg)`;
    if(track.style.transform === nextTransform){
        return;
    }

    const previousTransition = track.style.transition;
    track.style.transition = "none";
    track.style.transform = nextTransform;

    window.requestAnimationFrame(() => {
        if(track.style.transition === "none"){
            track.style.transition = previousTransition;
        }
    });
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
        if(!leagueWheelSpinInProgress){
            setWheelRotationWithoutAnimation(track, 0);
            if(result.textContent !== "Spin to select league"){ result.textContent = "Spin to select league"; }
            if(spinButton.textContent !== "SPIN WHEEL"){ spinButton.textContent = "SPIN WHEEL"; }
        }
        spinButton.disabled = leagueWheelSpinInProgress;

        if(note){
            if(note.textContent){ note.textContent = ""; }
            note.classList.add("hidden");
            note.classList.remove("locked");
        }
        return;
    }

    const selected = currentShowdown.selectedLeague;
    if(result.textContent !== selected.name){ result.textContent = selected.name; }
    setWheelRotationWithoutAnimation(track, getLeagueRotation(selected.id));

    if(hasLockedClubAssignment()){
        if(spinButton.textContent !== "LEAGUE LOCKED"){ spinButton.textContent = "LEAGUE LOCKED"; }
        spinButton.disabled = true;
        if(note){
            const message = "League and clubs are permanent for this showdown.";
            if(note.textContent !== message){ note.textContent = message; }
            note.classList.remove("hidden");
            note.classList.add("locked");
        }
    }else{
        if(spinButton.textContent !== "CONTINUE TO CLUB ASSIGNMENT"){
            spinButton.textContent = "CONTINUE TO CLUB ASSIGNMENT";
        }
        spinButton.disabled = false;
        if(note){
            const message = isLeagueSelectionConfirmed()
                ? `${selected.name} is confirmed. Continue when you are ready to open Club Assignment.`
                : `${selected.name} has been selected and locked. Press Continue to confirm the league and open Club Assignment.`;
            if(note.textContent !== message){ note.textContent = message; }
            note.classList.remove("hidden", "locked");
        }
    }
}

function confirmLeagueSelectionAndContinue(){
    if(!currentShowdown || !currentShowdown.selectedLeague || hasLockedClubAssignment()){
        return false;
    }

    if(currentShowdown.status !== "League Confirmed"){
        const previousStatus = currentShowdown.status;
        currentShowdown.status = "League Confirmed";

        if(!saveCurrentShowdown()){
            currentShowdown.status = previousStatus;
            renderLeagueWheelState();

            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The league confirmation could not be saved, so Club Assignment was not opened.",
                    "error",
                    9000
                );
            }
            return false;
        }

        if(typeof window.updateShowdownUI === "function"){
            window.updateShowdownUI();
        }
    }

    prepareClubAssignment();
    return true;
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

        confirmLeagueSelectionAndContinue();
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

    clearLeagueWheelTimers();
    const operationId = ++leagueWheelOperationId;
    const showdownId = currentShowdown.id;
    const timing = getLeagueWheelTiming();

    setLeagueWheelBusy(true);
    spinButton.disabled = true;
    spinButton.textContent = "SPINNING...";
    result.textContent = "SPINNING...";
    if(note){ note.classList.add("hidden"); }
    track.style.transform = `rotate(${getLeagueRotation(selected.id, 5)}deg)`;

    leagueWheelSpinTimer = window.setTimeout(() => {
        leagueWheelSpinTimer = null;

        if(!isLeagueWheelOperationCurrent(operationId, showdownId)){
            return;
        }

        const previousLeague = currentShowdown.selectedLeague;
        const previousStatus = currentShowdown.status;

        currentShowdown.selectedLeague = selected;
        currentShowdown.status = "League Selected";

        if(!saveCurrentShowdown()){
            currentShowdown.selectedLeague = previousLeague;
            currentShowdown.status = previousStatus;
            setLeagueWheelBusy(false);
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

        setLeagueWheelBusy(false);
        updateShowdownUI();
        renderLeagueWheelState();
    }, timing.spin);
}

window.initializeLeagueWheel = initializeLeagueWheel;
window.renderLeagueWheelState = renderLeagueWheelState;
window.spinLeagueWheel = spinLeagueWheel;
window.cancelLeagueWheelOperation = cancelLeagueWheelOperation;
