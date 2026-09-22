const MENU_MEDIA_SOURCES = Object.freeze({
    audius: Object.freeze({
        key:"audius",type:"music",trackId:"XNN7jYJ",
        selectorTitle:"WHAT YOU GOT",selectorMeta:"Valentino Khan & NITTI",
        category:"AUDIUS SOUNDTRACK",title:"WHAT YOU GOT",subtitle:"Valentino Khan & NITTI"
    }),
    snowglobe: Object.freeze({
        key:"snowglobe",type:"music",trackId:"X9wlA0b",
        selectorTitle:"SNOW GLOBE",selectorMeta:"Hadji Gaviota",
        category:"AUDIUS SOUNDTRACK",title:"SNOW GLOBE",subtitle:"Hadji Gaviota"
    }),
    nasty: Object.freeze({
        key:"nasty",type:"music",trackId:"G5rXAWE",
        selectorTitle:"NASTY",selectorMeta:"grouptherapy.",
        category:"AUDIUS SOUNDTRACK",title:"NASTY",subtitle:"grouptherapy."
    }),
    alwaysright: Object.freeze({
        key:"alwaysright",type:"music",trackId:"9QRXKw",
        selectorTitle:"I'M ALWAYS RIGHT",selectorMeta:"The Holdup",
        category:"AUDIUS SOUNDTRACK",title:"I'M ALWAYS RIGHT",subtitle:"The Holdup"
    })
});

const MARCO_REUS_IMAGE = Object.freeze({
    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=1.9.1-r44",
    source: "https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg",
    license: "https://creativecommons.org/licenses/by/2.0/"
});

const MAX_REUS_IMAGE_ATTEMPTS = 2;
const MENU_FEEDBACK_INTERACTION_WINDOW_MS = 1800;

let selectedMenuMediaKey = "audius";
let menuExperienceUI = null;
let reusImageLoadScheduled = false;
let reusImageAttempts = 0;
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
    const sourceButtons = new Map();
    document.querySelectorAll("[data-menu-media-source]").forEach(button => {
        sourceButtons.set(button.dataset.menuMediaSource, button);
    });

    menuExperienceUI = {
        continueButton: document.getElementById("continueCareer"),
        mediaTile: document.querySelector(".menuMusicTile"),
        mediaCategory: document.querySelector(".menuMusicHeader span"),
        mediaTitle: document.querySelector(".menuMusicHeader strong"),
        mediaSubtitle: document.querySelector(".menuMusicArtist"),
        mediaHost: document.getElementById("menuMusicPlayer"),
        mediaStatus: document.getElementById("menuMusicStatus"),
        mediaToggle: document.getElementById("menuMusicToggle"),
        mediaMute: document.getElementById("menuMusicMute"),
        mediaSelector: document.getElementById("menuMediaSelector"),
        primaryTile: document.getElementById("continueCareer"),
        reusImage: document.querySelector(".menuCoverAthlete img"),
        sourceButtons
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

function getSavedShowdownMenuMeta(){
    const saved = (typeof currentShowdown !== "undefined" && currentShowdown)
        ? currentShowdown
        : (typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null);

    if(!saved){
        return {
            hasSave: false,
            label: "CONTINUE CAREER",
            meta: "No active showdown saved",
            indicator: "No Active Showdown"
        };
    }

    const managerOne = saved.managers && saved.managers.playerOne ? saved.managers.playerOne : "Manager 1";
    const managerTwo = saved.managers && saved.managers.playerTwo ? saved.managers.playerTwo : "Manager 2";
    const completed = saved.status === "Completed";
    const currentRound = Number(saved.currentRound) || 1;
    const totalRounds = Number(saved.totalRounds) || 1;
    const status = completed
        ? "Showdown complete"
        : `Season ${currentRound} of ${totalRounds}`;

    return {
        hasSave: true,
        label: completed ? "VIEW COMPLETED SHOWDOWN" : "CONTINUE CAREER",
        meta: `${managerOne} vs ${managerTwo} · ${status}`,
        indicator: completed ? "Showdown Complete" : `Season ${currentRound} / ${totalRounds}`
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

function getSelectedMenuMedia(){
    return MENU_MEDIA_SOURCES[selectedMenuMediaKey] || MENU_MEDIA_SOURCES.audius;
}

function renderMenuMediaPlaceholder(){
    const host=getMenuExperienceUI().mediaHost;
    if(!host||window.CareerModeAudiusPlayer?.isMounted?.())return;
    host.replaceChildren();
    const placeholder=document.createElement("p");
    placeholder.className="menuMusicPlaceholder";
    placeholder.textContent="Audius soundtrack player is loading. Audio stays stopped until you press Play.";
    host.appendChild(placeholder);
}

function destroyMenuMediaPlayer(){
    window.CareerModeAudiusPlayer?.destroy?.();
    renderMenuMediaPlaceholder();
}

function updateMenuMediaHeader(){
    const media=getSelectedMenuMedia(),ui=getMenuExperienceUI();
    setTextIfChanged(ui.mediaCategory,media.category);
    setTextIfChanged(ui.mediaTitle,media.title);
    setTextIfChanged(ui.mediaSubtitle,media.subtitle);
    setTextIfChanged(document.querySelector(".menuMusicSource"),"AUDIUS");
    if(ui.mediaTile){
        ui.mediaTile.dataset.mediaKind="music";
        ui.mediaTile.dataset.mediaProvider="audius";
    }
    ui.sourceButtons.forEach((button,key)=>{
        const selected=key===media.key;
        button.classList.toggle("selected",selected);
        button.setAttribute("aria-pressed",String(selected));
    });
}

function updateMenuMediaControls(){
    const player=window.CareerModeAudiusPlayer,ui=getMenuExperienceUI(),media=getSelectedMenuMedia();
    if(player?.isMounted?.()){player.syncControls();return;}
    setTextIfChanged(ui.mediaToggle,"PLAY TRACK");
    if(ui.mediaMute){ui.mediaMute.disabled=true;setTextIfChanged(ui.mediaMute,"MUTE");}
    setTextIfChanged(ui.mediaStatus,`${media.title} · AUDIUS · READY`);
}

function ensureMenuMediaSelector(){
    if(document.getElementById("menuMediaSelector"))return;
    const host=document.getElementById("menuMusicPlayer");
    if(!host||!host.parentNode)return;
    const selector=document.createElement("div");
    selector.id="menuMediaSelector";
    selector.className="menuMediaSelector";
    selector.setAttribute("role","group");
    selector.setAttribute("aria-label","Choose Audius soundtrack");
    Object.values(MENU_MEDIA_SOURCES).forEach(media=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="menuMediaChoice";
        button.dataset.menuMediaSource=media.key;
        button.setAttribute("aria-pressed","false");
        const title=document.createElement("strong");title.textContent=media.selectorTitle;
        const meta=document.createElement("small");meta.textContent=media.selectorMeta;
        button.append(title,meta);selector.appendChild(button);
    });
    selector.addEventListener("click",event=>{
        const button=event.target instanceof Element?event.target.closest("[data-menu-media-source]"):null;
        if(button&&selector.contains(button))selectMenuMedia(button.dataset.menuMediaSource);
    });
    host.parentNode.insertBefore(selector,host);
    menuExperienceUI=null;
    cacheMenuExperienceUI();
}

async function activateSelectedAudius(){
    const ensure=window.ensureAudiusPlayerModule;
    if(typeof ensure!=="function")return null;
    const player=await ensure();
    player.activate(getSelectedMenuMedia());
    player.syncControls();
    return player;
}

function selectMenuMedia(key){
    if(!MENU_MEDIA_SOURCES[key]||key===selectedMenuMediaKey)return;
    destroyMenuMediaPlayer();
    selectedMenuMediaKey=key;
    updateMenuMediaHeader();
    updateMenuMediaControls();
    void activateSelectedAudius().catch(error=>{
        console.warn("[Career Mode Showdown] Audius soundtrack could not initialize.",error);
        window.showAppNotice?.("The Audius soundtrack player could not initialize. Try again.","error",7000);
    });
}

async function toggleMenuMusic(){
    const player=window.CareerModeAudiusPlayer||await activateSelectedAudius();
    if(!player)return;
    player.activate(getSelectedMenuMedia());
    await player.toggle();
}

function toggleMenuMusicMute(){
    window.CareerModeAudiusPlayer?.toggleMute?.();
}

function handleMainMenuExit(){
    // Audius soundtrack intentionally continues across Career Mode screens.
}

function isMenuMediaPlaying(){
    return Boolean(window.CareerModeAudiusPlayer?.isPlaying?.());
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
    return !button.matches(".dangerButton,#menuMusicToggle,#menuMusicMute,[data-menu-media-source]");
}

function warmMenuFeedbackModule(){
    if(menuFeedbackWarmPromise || typeof window.ensureMenuFeedbackModule !== "function"){
        return menuFeedbackWarmPromise;
    }
    menuFeedbackWarmPromise = window.ensureMenuFeedbackModule().catch(() => {
        menuFeedbackWarmPromise = null;
        /* Optional audio support never blocks or surfaces over navigation. */
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

function bindMenuMediaControls(){
    const mediaToggle = document.getElementById("menuMusicToggle");
    const mediaMute = document.getElementById("menuMusicMute");

    if(mediaToggle && mediaToggle.dataset.musicBound !== "true"){
        mediaToggle.dataset.musicBound = "true";
        mediaToggle.addEventListener("click", () => void toggleMenuMusic());
    }
    if(mediaMute && mediaMute.dataset.musicBound !== "true"){
        mediaMute.dataset.musicBound = "true";
        mediaMute.addEventListener("click", toggleMenuMusicMute);
    }
}

function decorateMainMenuTiles(){
    createTileContent(
        document.getElementById("newShowdown"),
        "NEW",
        "NEW SHOWDOWN",
        "Create a new rivalry and draw your league"
    );
    createTileContent(
        document.getElementById("legacyButton"),
        "HISTORY",
        "LEGACY",
        "Completed rivalries and season history"
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
        "Competition rules, scoring and transfer challenge"
    );
}

function getMenuExperienceIntegrity(){
    const choices = Array.from(document.querySelectorAll("[data-menu-media-source]"));
    const expectedKeys = Object.keys(MENU_MEDIA_SOURCES).sort();
    const actualKeys = choices.map(button => button.dataset.menuMediaSource).sort();
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");

    return {
        selectorReady: Boolean(document.getElementById("menuMediaSelector")),
        mediaChoicesReady: actualKeys.join("|") === expectedKeys.join("|"),
        toggleBound: Boolean(toggle && toggle.dataset.musicBound === "true"),
        muteBound: Boolean(mute && mute.dataset.musicBound === "true"),
        feedbackBound: menuFeedbackInteractionBound
    };
}

function initializeMenuExperience(){
    decorateMainMenuTiles();
    ensureMenuMediaSelector();
    ensureMarcoReusTreatment();
    cacheMenuExperienceUI();
    refreshMainMenuExperience();
    renderMenuMediaPlaceholder();
    updateMenuMediaHeader();
    bindMenuMediaControls();
    bindMenuFeedbackInteraction();
    updateMenuMediaControls();
    void activateSelectedAudius().catch(error=>{
        console.warn("[Career Mode Showdown] Audius soundtrack could not initialize.",error);
        window.showAppNotice?.("The Audius soundtrack player could not initialize. Try again.","error",7000);
    });

    const integrity = getMenuExperienceIntegrity();
    if(!integrity.selectorReady || !integrity.mediaChoicesReady || !integrity.toggleBound || !integrity.muteBound || !integrity.feedbackBound){
        const missing = Object.entries(integrity)
            .filter(([, ready]) => !ready)
            .map(([name]) => name)
            .join(", ");
        throw new Error(`Main Menu experience initialization incomplete: ${missing}`);
    }

}

window.initializeMenuExperience = initializeMenuExperience;
window.refreshMainMenuExperience = refreshMainMenuExperience;
window.selectMenuMedia = selectMenuMedia;
window.handleMainMenuExit = handleMainMenuExit;
window.isMenuMediaPlaying = isMenuMediaPlaying;
window.consumeMenuFeedbackCue = consumeMenuFeedbackCue;
window.getMenuExperienceIntegrity = getMenuExperienceIntegrity;
