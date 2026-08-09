/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.95.0
   Race-Safe Staged Club Reveal and Rivalry Confirmation
===================================================== */

const CLUB_REVEAL_STAGES = Object.freeze([
    "ready",
    "opening",
    "manager-one",
    "manager-two",
    "versus",
    "confirmation"
]);

const CLUB_REVEAL_TIMINGS = Object.freeze({
    managerOne: 360,
    managerTwo: 860,
    versus: 1360,
    confirmation: 1680
});

const CLUB_REVEAL_STYLE_ID = "clubRevealRuntimeStyles";

let clubAssignmentInProgress = false;
let clubAssignmentOperationId = 0;
let clubAssignmentTimers = new Set();
let clubAssignmentUI = null;

function ensureClubRevealRuntimeStyles(){
    if(document.getElementById(CLUB_REVEAL_STYLE_ID)){
        return;
    }

    const style = document.createElement("style");
    style.id = CLUB_REVEAL_STYLE_ID;
    style.textContent = `
#clubWheelScreen .clubAssignmentShell{
    width:min(940px,94vw);
    padding:14px 16px 15px;
    overflow:visible;
}
#clubWheelScreen .clubRevealProgress{
    width:min(660px,100%);
    margin:11px auto 12px;
    grid-template-columns:repeat(5,minmax(0,1fr));
    gap:4px;
}
#clubWheelScreen .clubRevealProgress span{
    min-width:0;
    padding:6px 4px;
    white-space:nowrap;
}
#clubWheelScreen .clubRevealArena{
    overflow:visible;
    padding:3px 0 1px;
}
#clubWheelScreen .clubRevealArena::after{
    display:none!important;
    animation:none!important;
}
#clubWheelScreen .clubRevealArea{
    width:min(860px,100%);
    margin:0 auto 11px;
    display:grid;
    grid-template-columns:minmax(0,1fr) 72px minmax(0,1fr);
    align-items:stretch;
    gap:10px;
}
#clubWheelScreen .clubRevealCard{
    --club-primary:#315f80;
    --club-secondary:#86c9df;
    --club-angle:42deg;
    box-sizing:border-box;
    width:100%;
    min-width:0;
    height:258px;
    min-height:258px;
    padding:8px;
    display:grid;
    grid-template-rows:24px minmax(0,1fr);
    align-self:stretch;
    background:#161e24;
    border:1px solid rgba(255,255,255,.11);
    border-top:4px solid #5e6b74;
    clip-path:none;
    transform:none;
    box-shadow:0 9px 20px rgba(10,17,22,.22);
    transition:border-color 160ms ease,box-shadow 160ms ease;
}
#clubWheelScreen .clubRevealCard.is-revealed{
    border-top-color:var(--club-secondary);
    transform:none;
    box-shadow:0 11px 25px rgba(10,17,22,.28);
}
#clubWheelScreen .clubRevealIndex{
    left:12px;
    top:12px;
}
#clubWheelScreen .clubManager{
    box-sizing:border-box;
    width:100%;
    min-width:0;
    min-height:24px;
    margin:0;
    padding:2px 30px 0;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    line-height:18px;
}
#clubWheelScreen .clubCardFace{
    box-sizing:border-box;
    width:100%;
    min-width:0;
    min-height:0;
    height:100%;
    padding:14px 10px 10px;
    display:grid;
    grid-template-rows:auto auto minmax(92px,1fr) auto;
    align-items:center;
    justify-items:center;
    overflow:hidden;
}
#clubWheelScreen .clubCardEyebrow{
    margin:0 0 4px;
}
#clubWheelScreen .clubCardLabel{
    margin:0 0 4px;
}
#clubWheelScreen .clubCardFace strong{
    box-sizing:border-box;
    width:100%;
    max-width:100%;
    min-height:92px;
    margin:0;
    padding:67px 8px 0;
    display:flex;
    align-items:flex-start;
    justify-content:center;
    text-align:center;
    overflow-wrap:anywhere;
    word-break:normal;
    font-size:clamp(18px,2.4vw,27px);
    line-height:1.02;
}
#clubWheelScreen .clubCardFace [data-club-identity="true"]::before{
    top:1px;
    width:54px;
    height:60px;
    font-size:12px;
}
#clubWheelScreen .clubCardState{
    margin:5px 0 0;
}
#clubWheelScreen .clubRevealCard::after{
    inset:32px 8px 8px;
    display:grid;
    place-items:center;
    transform:scaleY(1);
    transform-origin:center;
    opacity:1;
    transition:transform 280ms cubic-bezier(.65,0,.35,1),opacity 180ms ease;
}
#clubWheelScreen .clubRevealCard.is-revealed::after{
    transform:scaleY(0);
    opacity:0;
}
#clubWheelScreen .clubVs{
    min-width:0;
    justify-content:center;
}
#clubWheelScreen .clubVs strong{
    transform:none;
}
#clubWheelScreen[data-club-reveal-stage="manager-one"] #clubCardOne.is-revealed,
#clubWheelScreen[data-club-reveal-stage="manager-two"] #clubCardTwo.is-revealed{
    animation:clubCardSettle 340ms cubic-bezier(.2,.8,.2,1) both;
}
#clubWheelScreen[data-club-reveal-stage="versus"] .clubVs strong{
    color:var(--f17-yellow);
    animation:clubVsHit 300ms cubic-bezier(.2,.8,.2,1) both;
}
#clubWheelScreen .clubRivalryConfirmation{
    width:min(840px,100%);
    margin:7px auto 11px;
}
#clubWheelScreen[data-club-reveal-stage="versus"] .clubRivalryConfirmation{
    animation:clubConfirmationIn 300ms ease-out both;
}
#clubWheelScreen .clubRivalryMatchup{
    grid-template-columns:minmax(0,1fr) 52px minmax(0,1fr);
    align-items:stretch;
}
#clubWheelScreen .clubConfirmationSide{
    min-width:0;
    min-height:69px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
}
#clubWheelScreen .clubConfirmationSide strong{
    width:100%;
    overflow-wrap:anywhere;
}
@keyframes clubCardSettle{
    0%{opacity:.4;transform:translateY(9px) scale(.985)}
    72%{opacity:1;transform:translateY(-2px) scale(1.006)}
    100%{opacity:1;transform:none}
}
@keyframes clubVsHit{
    0%{opacity:.45;transform:scale(.78)}
    70%{opacity:1;transform:scale(1.12)}
    100%{opacity:1;transform:scale(1.04)}
}
@keyframes clubConfirmationIn{
    from{opacity:0;transform:translateY(7px)}
    to{opacity:1;transform:none}
}
@media(min-width:901px) and (max-height:800px){
    #clubWheelScreen{padding-bottom:18px}
    #clubWheelScreen>h2{margin-bottom:9px}
    #clubWheelScreen .clubAssignmentShell{
        width:min(900px,93vw);
        padding:9px 12px 11px;
    }
    #clubWheelScreen .clubAssignmentEyebrow{font-size:8px}
    #clubWheelScreen #clubAssignmentLeague{margin-top:3px;font-size:30px}
    #clubWheelScreen #clubPackStatus{margin-top:4px;font-size:9px}
    #clubWheelScreen .clubRevealProgress{
        width:min(590px,100%);
        margin:7px auto 8px;
    }
    #clubWheelScreen .clubRevealProgress span{
        padding:5px 3px;
        font-size:7px;
    }
    #clubWheelScreen .clubRevealArea{
        width:min(820px,100%);
        grid-template-columns:minmax(0,1fr) 62px minmax(0,1fr);
        gap:8px;
        margin-bottom:7px;
    }
    #clubWheelScreen .clubRevealCard{
        height:215px;
        min-height:215px;
        padding:7px;
        grid-template-rows:21px minmax(0,1fr);
    }
    #clubWheelScreen .clubRevealCard::after{inset:28px 7px 7px}
    #clubWheelScreen .clubManager{
        min-height:21px;
        padding-top:0;
        font-size:10px;
        line-height:17px;
    }
    #clubWheelScreen .clubCardFace{
        padding:8px 8px 7px;
        grid-template-rows:auto auto minmax(76px,1fr) auto;
    }
    #clubWheelScreen .clubCardEyebrow{font-size:7px;margin-bottom:2px}
    #clubWheelScreen .clubCardLabel{font-size:8px;margin-bottom:2px}
    #clubWheelScreen .clubCardFace strong{
        min-height:76px;
        padding:53px 6px 0;
        font-size:clamp(17px,2vw,23px);
    }
    #clubWheelScreen .clubCardFace [data-club-identity="true"]::before{
        width:43px;
        height:47px;
        font-size:10px;
    }
    #clubWheelScreen .clubCardState{margin-top:3px;padding:4px 7px;font-size:7px}
    #clubWheelScreen .clubVs span{font-size:7px}
    #clubWheelScreen .clubVs strong{font-size:36px}
    #clubWheelScreen .clubRivalryConfirmation{
        width:min(800px,100%);
        margin:5px auto 7px;
        padding:8px 11px 9px;
    }
    #clubWheelScreen .clubRivalryHeadline>strong{font-size:22px}
    #clubWheelScreen .clubRivalryHeadline>small{margin-top:3px}
    #clubWheelScreen .clubRivalryMatchup{margin-top:7px}
    #clubWheelScreen .clubConfirmationSide{min-height:55px;padding:7px}
    #clubWheelScreen .clubRivalryLockNote{margin-top:6px;font-size:8px}
    #clubWheelScreen .clubAssignmentShell>.menuButton,
    #clubWheelScreen .clubAssignmentShell>.backButton{
        min-height:38px;
        margin-top:5px;
    }
}
@media(max-width:760px){
    #clubWheelScreen .clubAssignmentShell{width:min(560px,95vw);padding:12px}
    #clubWheelScreen .clubRevealProgress{gap:2px}
    #clubWheelScreen .clubRevealProgress span{font-size:6.5px;letter-spacing:.3px}
    #clubWheelScreen .clubRevealArea{
        width:min(500px,100%);
        grid-template-columns:1fr;
        gap:7px;
    }
    #clubWheelScreen .clubRevealCard{
        height:205px;
        min-height:205px;
    }
    #clubWheelScreen .clubVs{
        min-height:34px;
        flex-direction:row;
        gap:8px;
    }
    #clubWheelScreen .clubVs strong{font-size:28px}
    #clubWheelScreen .clubRivalryMatchup{
        grid-template-columns:1fr;
        gap:5px;
    }
    #clubWheelScreen .clubConfirmationVs{padding:1px 0}
}
@media(prefers-reduced-motion:reduce){
    #clubWheelScreen .clubRevealCard,
    #clubWheelScreen .clubRevealCard::after,
    #clubWheelScreen .clubVs strong,
    #clubWheelScreen .clubRivalryConfirmation{
        animation:none!important;
        transition:none!important;
    }
}
`;

    document.head.appendChild(style);
}

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
    ensureClubRevealRuntimeStyles();
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
        card.style.setProperty("--club-angle", identity.angle);
    }

    setClubText(stateElement, "LOCKED");
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
    setClubText(ui.status, "LEAGUE CONFIRMED · READY FOR CLUB DRAW");
    setClubText(ui.revealButton, "OPEN SHOWDOWN PACK");
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
        setClubText(ui.status, "CLUB DRAW LOCKED · OPENING SHOWDOWN PACK");
        setClubText(ui.revealButton, "OPENING...");
        setRevealControls({ showOpen: true, openDisabled: true, showConfirm: false, confirmDisabled: true, allowBack: false });
        return;
    }

    if(stage === "manager-one"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        resetClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo);
        setClubText(ui.status, `${currentShowdown.managers.playerOne.toUpperCase()} · CLUB REVEALED`);
        return;
    }

    if(stage === "manager-two"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        applyClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo, currentShowdown.clubs.playerTwo);
        setClubText(ui.status, `${currentShowdown.managers.playerTwo.toUpperCase()} · CLUB REVEALED`);
        return;
    }

    if(stage === "versus"){
        applyClubRevealCard(ui.cardOne, ui.clubOne, ui.cardStateOne, currentShowdown.clubs.playerOne);
        applyClubRevealCard(ui.cardTwo, ui.clubTwo, ui.cardStateTwo, currentShowdown.clubs.playerTwo);
        populateClubConfirmation();
        if(ui.confirmation){ ui.confirmation.classList.remove("hidden"); }
        setClubText(ui.status, "RIVALRY LOCKED · FINAL MATCHUP");
        setRevealControls({ showOpen: false, openDisabled: true, showConfirm: false, confirmDisabled: true, allowBack: false });
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
    setRevealControls({ showOpen: false, openDisabled: true, showConfirm: true, confirmDisabled: false, allowBack: false });
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
