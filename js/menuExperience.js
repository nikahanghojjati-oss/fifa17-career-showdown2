const MARCO_REUS_IMAGE = Object.freeze({
    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=2.1.0-r88",
    source: "https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg",
    license: "https://creativecommons.org/licenses/by/2.0/"
});

const MENU_FEEDBACK_INTERACTION_WINDOW_MS = 1800;

let menuExperienceUI = null;
let menuFeedbackInteractionBound = false;
let menuFeedbackInteractionPending = false;
let menuFeedbackInteractionAt = -Infinity;
let menuFeedbackWarmPromise = null;

function setTextIfChanged(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function createTileContent(button, code, label, meta){
    if(!button){ return; }
    button.replaceChildren();

    const codeElement = document.createElement("span");
    codeElement.className = "menuTileCode";
    codeElement.textContent = code;

    const labelElement = document.createElement("span");
    labelElement.className = "menuTileLabel";
    labelElement.textContent = label;

    const metaElement = document.createElement("span");
    metaElement.className = "menuTileMeta";
    metaElement.textContent = meta;

    button.append(codeElement, labelElement, metaElement);
}

function cacheMenuExperienceUI(){
    menuExperienceUI = {
        continueButton: document.getElementById("continueCareer"),
        primaryTile: document.getElementById("continueCareer"),
        reusImage: document.querySelector(".menuCoverAthlete img")
    };
    return menuExperienceUI;
}

function getMenuExperienceUI(){
    return menuExperienceUI || cacheMenuExperienceUI();
}

function updateExistingTileText(button, label, meta){
    if(!button){ return; }
    setTextIfChanged(button.querySelector(".menuTileLabel"), label);
    setTextIfChanged(button.querySelector(".menuTileMeta"), meta);
}

// r79: a save the pair holds as closed (deleted) is no live career; its own id first (cold reload: no Save Library runtime).
function isPairClosedSave(s){
    try{
        const p = window.CareerModePersistentNikDanielPair?.getState?.();
        const id = s?.identity?.saveId || window.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.()?.activeSaveId;
        return Boolean(s && s.status !== "Completed" && p && !p.rivalryId && p.closedRivalryId && id === p.closedProviderSaveId);
    }catch(_error){ return false; }
}

function noLiveShowdownMeta(){
    let id = "";
    try{ id = window.CareerModeOnlinePlayerIdentity?.getState?.()?.managerId || ""; }catch(_error){}
    return "No Showdown live" + (id === "daniel" ? " · tap to start" : id === "nik" ? " · tap to join Daniel's" : "");
}

function getSavedShowdownMenuMeta(){
    let saved = (typeof currentShowdown !== "undefined" && currentShowdown)
        ? currentShowdown
        : (typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null);
    if(isPairClosedSave(saved)){ saved = null; }

    if(!saved){
        return {
            hasSave: false,
            label: "CONTINUE CAREER",
            meta: noLiveShowdownMeta(),
            indicator: "No Active Showdown"
        };
    }

    const managerOne = saved.managers && saved.managers.playerOne ? saved.managers.playerOne : "Manager 1";
    const managerTwo = saved.managers && saved.managers.playerTwo ? saved.managers.playerTwo : "Manager 2";
    const completed = saved.status === "Completed";
    const unknown = window.CareerModeProductionSharedMultiSeasonProgression?.seasonUnknown?.();
    const currentRound = Number(window.getShowdownSeason ? window.getShowdownSeason(saved) : saved.currentRound) || 1;
    const totalRounds = Number(saved.totalRounds) || 1, live = unknown && `${totalRounds}-Season Showdown`;
    const status = completed
        ? "Showdown complete"
        : live || `Season ${currentRound} of ${totalRounds}`;

    return {
        hasSave: true,
        label: completed ? "VIEW COMPLETED SHOWDOWN" : "CONTINUE CAREER",
        meta: `${managerOne} vs ${managerTwo} · ${status}`,
        indicator: completed ? "Showdown Complete" : live || `Season ${currentRound} / ${totalRounds}`
    };
}

function ensureMarcoReusTreatment(){
    const primaryTile = document.getElementById("continueCareer");
    const grid = document.querySelector(".fifaMenuGrid");
    if(!primaryTile || !grid){ return; }

    if(!primaryTile.querySelector(".menuCoverAthlete")){
        const athlete = document.createElement("span");
        athlete.className = "menuCoverAthlete";
        athlete.setAttribute("aria-hidden", "true");

        const image = document.createElement("img");
        image.alt = "";
        image.decoding = "async";
        image.loading = "eager";
        image.fetchPriority = "high";
        image.src = MARCO_REUS_IMAGE.thumbnail;
        image.addEventListener("load", () => {
            image.dataset.loaded = "true";
            athlete.classList.remove("imageFailed");
            athlete.classList.add("imageLoaded");
        });
        image.addEventListener("error", () => {
            delete image.dataset.loaded;
            image.removeAttribute("src");
            athlete.classList.remove("imageLoaded");
            athlete.classList.add("imageFailed");
        });

        const number = document.createElement("span");
        number.className = "menuCoverNumber";
        number.textContent = "11";

        const tag = document.createElement("span");
        tag.className = "menuCoverTag";
        tag.innerHTML = "MARCO REUS<small>FIFA 17 GLOBAL COVER ATHLETE</small>";

        athlete.append(image, number, tag);
        primaryTile.appendChild(athlete);
    }

    if(!document.getElementById("menuAthleteCredit")){
        const credit = document.createElement("p");
        credit.id = "menuAthleteCredit";
        credit.className = "menuAthleteCredit";
        credit.append("Marco Reus photo: Tim Reckmann · ");

        const sourceLink = document.createElement("a");
        sourceLink.href = MARCO_REUS_IMAGE.source;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = "Wikimedia Commons";

        const licenseLink = document.createElement("a");
        licenseLink.href = MARCO_REUS_IMAGE.license;
        licenseLink.target = "_blank";
        licenseLink.rel = "noopener noreferrer";
        licenseLink.textContent = "CC BY 2.0";

        credit.append(sourceLink, " · ", licenseLink, " · Display crop");
        grid.insertAdjacentElement("afterend", credit);
    }

    menuExperienceUI = null;
    cacheMenuExperienceUI();
}
function refreshMainMenuExperience(){
    const ui = getMenuExperienceUI();
    if(!ui.continueButton){ return; }

    const saveMeta = getSavedShowdownMenuMeta();
    updateExistingTileText(ui.continueButton, saveMeta.label, saveMeta.meta);
    setTextIfChanged(document.getElementById("seasonIndicator"), saveMeta.indicator);
    if(ui.continueButton.disabled === saveMeta.hasSave){
        ui.continueButton.disabled = !saveMeta.hasSave;
    }
    ui.continueButton.setAttribute("aria-disabled", String(!saveMeta.hasSave));
}

// r87 (Nik 2026-11-01): Home has no music strip. The only music is the soundtrack (visual-assets/v10_1/home/soundtrack.js),
// played from the phone MUSIC tab and the desktop top-bar dock; while it plays, the menu feedback cue stays quiet.
function isMenuMediaPlaying(){
    try{ return Boolean(window.HomeSoundtrack?.state?.().wantPlaying); }
    catch(error){ return false; }
}

function getMenuFeedbackInteractionClock(){
    return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
}
function isMenuFeedbackInteractionTarget(target){
    const button = target instanceof Element ? target.closest("button") : null;
    if(
        !button
        || button.disabled
        || button.getAttribute("aria-disabled") === "true"
        || !button.matches(".menuTile,.menuButton,.backButton,.compactButton")
    ){
        return false;
    }
    return !button.matches(".dangerButton");
}

function warmMenuFeedbackModule(){
    if(menuFeedbackWarmPromise || typeof window.ensureMenuFeedbackModule !== "function"){
        return menuFeedbackWarmPromise;
    }
    menuFeedbackWarmPromise = window.ensureMenuFeedbackModule().catch(() => {
        menuFeedbackWarmPromise = null;
    });
    return menuFeedbackWarmPromise;
}

function warmMenuFeedbackFromIntent(event){
    if(
        !isMenuFeedbackInteractionTarget(event.target)
        || isMenuMediaPlaying()
        || (typeof window.isMenuFeedbackEnabled === "function" && !window.isMenuFeedbackEnabled())
    ){
        return;
    }
    warmMenuFeedbackModule();
}

function recordMenuFeedbackInteraction(event){
    if(
        !isMenuFeedbackInteractionTarget(event.target)
        || isMenuMediaPlaying()
        || (typeof window.isMenuFeedbackEnabled === "function" && !window.isMenuFeedbackEnabled())
    ){
        return;
    }
    menuFeedbackInteractionPending = true;
    menuFeedbackInteractionAt = getMenuFeedbackInteractionClock();
    warmMenuFeedbackModule();
}

function consumeMenuFeedbackCue(){
    if(!menuFeedbackInteractionPending){
        return false;
    }
    menuFeedbackInteractionPending = false;
    if(
        getMenuFeedbackInteractionClock() - menuFeedbackInteractionAt > MENU_FEEDBACK_INTERACTION_WINDOW_MS
        || isMenuMediaPlaying()
        || (typeof window.isMenuFeedbackEnabled === "function" && !window.isMenuFeedbackEnabled())
    ){
        return false;
    }
    if(typeof window.playMenuFeedbackCue === "function"){
        return window.playMenuFeedbackCue();
    }
    warmMenuFeedbackModule();
    return false;
}

function bindMenuFeedbackInteraction(){
    if(menuFeedbackInteractionBound){
        return;
    }
    menuFeedbackInteractionBound = true;
    window.addEventListener("pointerover", warmMenuFeedbackFromIntent, true);
    window.addEventListener("pointerdown", warmMenuFeedbackFromIntent, true);
    window.addEventListener("focusin", warmMenuFeedbackFromIntent, true);
    window.addEventListener("click", recordMenuFeedbackInteraction, true);
}

function decorateMainMenuTiles(){
    createTileContent(
        document.getElementById("newShowdown"),
        "NEW",
        "NEW SHOWDOWN",
        "Pick seasons and draw your league"
    );
    createTileContent(
        document.getElementById("legacyButton"),
        "HISTORY",
        "LEGACY",
        "Past Showdowns and season history"
    );
    createTileContent(
        document.getElementById("careerStatisticsButton"),
        "DATA",
        "STATISTICS",
        "Career totals, manager comparison and honours"
    );
    createTileContent(
        document.getElementById("ruleBookButton"),
        "RULES",
        "RULE BOOK",
        "Rules, scoring and transfers"
    );
}

function getMenuExperienceIntegrity(){
    return {
        feedbackBound: menuFeedbackInteractionBound
    };
}

function initializeMenuExperience(){
    decorateMainMenuTiles();
    ensureMarcoReusTreatment();
    cacheMenuExperienceUI();
    refreshMainMenuExperience();
    bindMenuFeedbackInteraction();

    const integrity = getMenuExperienceIntegrity();
    if(!integrity.feedbackBound){
        const missing = Object.entries(integrity)
            .filter(([, ready]) => !ready)
            .map(([name]) => name)
            .join(", ");
        throw new Error(`Main Menu experience initialization incomplete: ${missing}`);
    }

}

window.initializeMenuExperience = initializeMenuExperience;
window.refreshMainMenuExperience = refreshMainMenuExperience;
window.isMenuMediaPlaying = isMenuMediaPlaying;
window.consumeMenuFeedbackCue = consumeMenuFeedbackCue;
window.getMenuExperienceIntegrity = getMenuExperienceIntegrity;
