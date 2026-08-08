/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.8.0
   Transfer Challenge Engine
===================================================== */

const TRANSFER_WINDOW_SECONDS = 15 * 60;
let transferTimerInterval = null;

function initializeTransferChallenge(){
    const primaryButton = document.getElementById("seasonPrimaryAction");
    const startButton = document.getElementById("startTransferTimer");
    const endButton = document.getElementById("endTransferTimer");
    const completeButton = document.getElementById("completeTransferChallenge");
    const continueButton = document.getElementById("continueFromTransfers");

    if(primaryButton){ primaryButton.addEventListener("click", handleSeasonPrimaryAction); }
    if(startButton){ startButton.addEventListener("click", startTransferWindow); }
    if(endButton){ endButton.addEventListener("click", endTransferWindowEarly); }
    if(completeButton){ completeButton.addEventListener("click", completeTransferChallenge); }
    if(continueButton){ continueButton.addEventListener("click", continueFromTransferChallenge); }

    document.querySelectorAll("[data-transfer-field]").forEach(field => {
        field.addEventListener("change", saveTransferDraft);
        if(field.tagName === "INPUT"){
            field.addEventListener("input", saveTransferDraft);
        }
    });
}

function handleSeasonPrimaryAction(){
    if(!currentShowdown){
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
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
        durationSeconds: TRANSFER_WINDOW_SECONDS,
        startedAt: null,
        deadlineAt: null,
        endedAt: null,
        signings: {
            playerOne: [],
            playerTwo: []
        },
        guesses: {
            againstPlayerOne: [],
            againstPlayerTwo: []
        }
    };
}

function getOrCreateTransferChallenge(seasonNumber){
    let challenge = getTransferChallengeForSeason(seasonNumber);

    if(!challenge){
        challenge = createTransferChallenge(seasonNumber);
        currentShowdown.transferChallenges.push(challenge);
        saveCurrentShowdown();
    }

    return challenge;
}

function openTransferChallenge(){
    if(!currentShowdown || currentShowdown.status === "Completed"){
        return;
    }

    currentShowdown = normalizeShowdown(currentShowdown);
    const challenge = getOrCreateTransferChallenge(currentShowdown.currentRound);

    restoreTransferForm(challenge);
    renderTransferChallenge(challenge);
    showScreen("transferChallenge");

    if(challenge.status === "active"){
        startTransferTimerLoop();
    }
}

function startTransferWindow(){
    if(!currentShowdown){
        return;
    }

    const challenge = getOrCreateTransferChallenge(currentShowdown.currentRound);

    if(challenge.status !== "not_started"){
        return;
    }

    const now = Date.now();
    challenge.status = "active";
    challenge.startedAt = now;
    challenge.deadlineAt = now + (TRANSFER_WINDOW_SECONDS * 1000);
    challenge.endedAt = null;

    currentShowdown.status = "Transfer Window Active";
    saveCurrentShowdown();
    renderTransferChallenge(challenge);
    startTransferTimerLoop();
}

function startTransferTimerLoop(){
    stopTransferTimerLoop();
    updateTransferTimer();
    transferTimerInterval = window.setInterval(updateTransferTimer, 1000);
}

function stopTransferTimerLoop(){
    if(transferTimerInterval){
        window.clearInterval(transferTimerInterval);
        transferTimerInterval = null;
    }
}

function updateTransferTimer(){
    if(!currentShowdown){
        stopTransferTimerLoop();
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){
        stopTransferTimerLoop();
        return;
    }

    const remainingSeconds = Math.max(
        0,
        Math.ceil((Number(challenge.deadlineAt) - Date.now()) / 1000)
    );

    renderTransferTimer(remainingSeconds);

    if(remainingSeconds <= 0){
        finishTransferWindow(challenge, false);
    }
}

function renderTransferTimer(seconds){
    const timer = document.getElementById("transferTimerDisplay");
    if(!timer){
        return;
    }

    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remaining = (seconds % 60).toString().padStart(2, "0");
    timer.textContent = `${minutes}:${remaining}`;
}

function endTransferWindowEarly(){
    if(!currentShowdown){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "active"){
        return;
    }

    finishTransferWindow(challenge, true);
}

function finishTransferWindow(challenge, endedEarly){
    stopTransferTimerLoop();
    challenge.status = "recording";
    challenge.endedAt = Date.now();
    challenge.endedEarly = Boolean(endedEarly);
    currentShowdown.status = "Transfer Challenge Recording";
    saveCurrentShowdown();
    renderTransferChallenge(challenge);
}

function getSigningRows(prefix){
    const rows = [];

    for(let index = 1; index <= 3; index += 1){
        const name = document.getElementById(`${prefix}Signing${index}Name`).value.trim();
        const league = document.getElementById(`${prefix}Signing${index}League`).value.trim();
        const nationality = document.getElementById(`${prefix}Signing${index}Nationality`).value.trim();

        if(name || league || nationality){
            rows.push({
                slot: index,
                name,
                league,
                nationality,
                release: false,
                matchedBy: []
            });
        }
    }

    return rows;
}

function getGuessRows(targetPrefix){
    const rows = [];

    for(let index = 1; index <= 3; index += 1){
        const type = document.getElementById(`${targetPrefix}Guess${index}Type`).value;
        const value = document.getElementById(`${targetPrefix}Guess${index}Value`).value.trim();

        if(type || value){
            rows.push({
                slot: index,
                type,
                value
            });
        }
    }

    return rows;
}

function captureTransferForm(challenge){
    challenge.signings.playerOne = getSigningRows("p1");
    challenge.signings.playerTwo = getSigningRows("p2");
    challenge.guesses.againstPlayerOne = getGuessRows("p1");
    challenge.guesses.againstPlayerTwo = getGuessRows("p2");
}

function saveTransferDraft(){
    if(!currentShowdown){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        return;
    }

    captureTransferForm(challenge);
    saveCurrentShowdown();
}

function validateTransferForm(challenge){
    const error = document.getElementById("transferChallengeError");
    captureTransferForm(challenge);

    const allSignings = [
        ...challenge.signings.playerOne,
        ...challenge.signings.playerTwo
    ];

    const incompleteSigning = allSignings.find(signing =>
        !signing.name || !signing.league || !signing.nationality
    );

    if(incompleteSigning){
        if(error){
            error.textContent = "Every recorded signing needs a player name, previous league and nationality.";
        }
        return false;
    }

    const allGuesses = [
        ...challenge.guesses.againstPlayerOne,
        ...challenge.guesses.againstPlayerTwo
    ];

    const incompleteGuess = allGuesses.find(guess => !guess.type || !guess.value);

    if(incompleteGuess){
        if(error){
            error.textContent = "Every recorded guess needs both a guess type and a value.";
        }
        return false;
    }

    if(error){ error.textContent = ""; }
    return true;
}

function normalizeTransferValue(value){
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function evaluateSignings(signings, guesses){
    return signings.map(signing => {
        const matchedBy = guesses.filter(guess => {
            const guessValue = normalizeTransferValue(guess.value);
            const signingValue = guess.type === "league"
                ? normalizeTransferValue(signing.league)
                : normalizeTransferValue(signing.nationality);

            return Boolean(guessValue && signingValue && guessValue === signingValue);
        });

        return {
            ...signing,
            release: matchedBy.length > 0,
            matchedBy: matchedBy.map(guess => ({ type: guess.type, value: guess.value }))
        };
    });
}

function completeTransferChallenge(){
    if(!currentShowdown){
        return;
    }

    const challenge = getTransferChallengeForSeason(currentShowdown.currentRound);
    if(!challenge || challenge.status !== "recording"){
        return;
    }

    if(!validateTransferForm(challenge)){
        return;
    }

    challenge.signings.playerOne = evaluateSignings(
        challenge.signings.playerOne,
        challenge.guesses.againstPlayerOne
    );

    challenge.signings.playerTwo = evaluateSignings(
        challenge.signings.playerTwo,
        challenge.guesses.againstPlayerTwo
    );

    challenge.status = "completed";
    challenge.completedAt = Date.now();
    currentShowdown.status = "Ready";

    saveCurrentShowdown();
    updateShowdownUI();
    renderTransferChallenge(challenge);
}

function restoreTransferForm(challenge){
    clearTransferForm();

    restoreSigningRows("p1", challenge.signings.playerOne || []);
    restoreSigningRows("p2", challenge.signings.playerTwo || []);
    restoreGuessRows("p1", challenge.guesses.againstPlayerOne || []);
    restoreGuessRows("p2", challenge.guesses.againstPlayerTwo || []);
}

function clearTransferForm(){
    document.querySelectorAll("[data-transfer-field]").forEach(field => {
        if(field.tagName === "SELECT"){
            field.value = "";
        }else{
            field.value = "";
        }
    });
}

function restoreSigningRows(prefix, signings){
    signings.forEach((signing, arrayIndex) => {
        const slot = Number(signing.slot) || (arrayIndex + 1);
        if(slot < 1 || slot > 3){ return; }

        document.getElementById(`${prefix}Signing${slot}Name`).value = signing.name || "";
        document.getElementById(`${prefix}Signing${slot}League`).value = signing.league || "";
        document.getElementById(`${prefix}Signing${slot}Nationality`).value = signing.nationality || "";
    });
}

function restoreGuessRows(targetPrefix, guesses){
    guesses.forEach((guess, arrayIndex) => {
        const slot = Number(guess.slot) || (arrayIndex + 1);
        if(slot < 1 || slot > 3){ return; }

        document.getElementById(`${targetPrefix}Guess${slot}Type`).value = guess.type || "";
        document.getElementById(`${targetPrefix}Guess${slot}Value`).value = guess.value || "";
    });
}

function setTransferFieldsDisabled(disabled){
    document.querySelectorAll("[data-transfer-field]").forEach(field => {
        field.disabled = disabled;
    });
}

function renderTransferChallenge(challenge){
    if(!currentShowdown || !challenge){
        return;
    }

    const title = document.getElementById("transferChallengeTitle");
    const managerOne = document.getElementById("transferManagerOne");
    const managerTwo = document.getElementById("transferManagerTwo");
    const clubOne = document.getElementById("transferClubOne");
    const clubTwo = document.getElementById("transferClubTwo");
    const guessOneHeading = document.getElementById("guessAgainstOneHeading");
    const guessTwoHeading = document.getElementById("guessAgainstTwoHeading");
    const phase = document.getElementById("transferPhaseStatus");
    const startButton = document.getElementById("startTransferTimer");
    const endButton = document.getElementById("endTransferTimer");
    const completeButton = document.getElementById("completeTransferChallenge");
    const continueButton = document.getElementById("continueFromTransfers");
    const results = document.getElementById("transferChallengeResults");

    if(title){ title.textContent = `SEASON ${challenge.seasonNumber} TRANSFER CHALLENGE`; }
    if(managerOne){ managerOne.textContent = currentShowdown.managers.playerOne; }
    if(managerTwo){ managerTwo.textContent = currentShowdown.managers.playerTwo; }
    if(clubOne){ clubOne.textContent = currentShowdown.clubs.playerOne; }
    if(clubTwo){ clubTwo.textContent = currentShowdown.clubs.playerTwo; }
    if(guessOneHeading){ guessOneHeading.textContent = `${currentShowdown.managers.playerTwo} guesses ${currentShowdown.managers.playerOne}'s signings`; }
    if(guessTwoHeading){ guessTwoHeading.textContent = `${currentShowdown.managers.playerOne} guesses ${currentShowdown.managers.playerTwo}'s signings`; }

    const statusLabels = {
        not_started: "READY — 15 MINUTES · MAX 3 SIGNINGS EACH",
        active: "TRANSFER WINDOW LIVE",
        recording: "WINDOW CLOSED — RECORD SIGNINGS AND GUESSES",
        completed: "TRANSFER CHALLENGE COMPLETE"
    };

    if(phase){ phase.textContent = statusLabels[challenge.status] || "TRANSFER CHALLENGE"; }

    if(startButton){ startButton.classList.toggle("hidden", challenge.status !== "not_started"); }
    if(endButton){ endButton.classList.toggle("hidden", challenge.status !== "active"); }
    if(completeButton){ completeButton.classList.toggle("hidden", challenge.status !== "recording"); }
    if(continueButton){ continueButton.classList.toggle("hidden", challenge.status !== "completed"); }

    setTransferFieldsDisabled(challenge.status !== "recording");

    if(challenge.status === "not_started"){
        renderTransferTimer(TRANSFER_WINDOW_SECONDS);
    }else if(challenge.status === "active"){
        const remainingSeconds = Math.max(0, Math.ceil((Number(challenge.deadlineAt) - Date.now()) / 1000));
        renderTransferTimer(remainingSeconds);
    }else{
        renderTransferTimer(0);
    }

    if(results){
        results.classList.toggle("hidden", challenge.status !== "completed");
    }

    if(challenge.status === "completed"){
        renderTransferResults(challenge);
    }
}

function renderTransferResults(challenge){
    renderManagerTransferResults(
        document.getElementById("transferResultsOne"),
        currentShowdown.managers.playerOne,
        challenge.signings.playerOne
    );

    renderManagerTransferResults(
        document.getElementById("transferResultsTwo"),
        currentShowdown.managers.playerTwo,
        challenge.signings.playerTwo
    );
}

function renderManagerTransferResults(container, managerName, signings){
    if(!container){
        return;
    }

    container.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    container.appendChild(heading);

    if(!signings.length){
        const empty = document.createElement("p");
        empty.className = "transferEmpty";
        empty.textContent = "No signings recorded";
        container.appendChild(empty);
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
        details.appendChild(name);
        details.appendChild(meta);

        const verdict = document.createElement("b");
        verdict.textContent = signing.release ? "RELEASE" : "SAFE";

        row.appendChild(details);
        row.appendChild(verdict);
        container.appendChild(row);
    });
}

function continueFromTransferChallenge(){
    if(!currentShowdown || !isTransferChallengeComplete(currentShowdown.currentRound)){
        return;
    }

    stopTransferTimerLoop();
    openSeasonEntry();
}

document.addEventListener("DOMContentLoaded", initializeTransferChallenge);
