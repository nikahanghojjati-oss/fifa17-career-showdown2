const MENU_MEDIA_SOURCES = Object.freeze({
    music: Object.freeze({
        key: "music",
        type: "music",
        selectorTitle: "ARE WE READY?",
        selectorMeta: "Two Door Cinema Club",
        videoId: "RrJZJtY6u7o",
        category: "FIFA 17 SOUNDTRACK",
        title: "ARE WE READY? (WRECK)",
        subtitle: "Two Door Cinema Club",
        iframeTitle: "Two Door Cinema Club - Are We Ready? (Wreck) — YouTube player"
    }),
    bastille: Object.freeze({
        key: "bastille",
        type: "music",
        selectorTitle: "SEND THEM OFF!",
        selectorMeta: "Bastille",
        videoId: "4yhuSy7_frw",
        category: "FIFA 17 SOUNDTRACK",
        title: "SEND THEM OFF!",
        subtitle: "Bastille",
        iframeTitle: "Bastille - Send Them Off! — YouTube player"
    }),
    youth: Object.freeze({
        key: "youth",
        type: "music",
        selectorTitle: "YOUTH",
        selectorMeta: "Glass Animals",
        videoId: "_ZdsmLgCVdU",
        category: "FIFA 17 SOUNDTRACK",
        title: "YOUTH",
        subtitle: "Glass Animals",
        iframeTitle: "Glass Animals - Youth — YouTube player"
    }),
    shelter: Object.freeze({
        key: "shelter",
        type: "music",
        selectorTitle: "SHELTER",
        selectorMeta: "Porter Robinson & Madeon",
        videoId: "HQnC1UHBvWA",
        category: "FIFA 17 SOUNDTRACK",
        title: "SHELTER",
        subtitle: "Porter Robinson & Madeon",
        iframeTitle: "Porter Robinson & Madeon - Shelter — YouTube player"
    }),
    move: Object.freeze({
        key: "move",
        type: "music",
        selectorTitle: "MOVE",
        selectorMeta: "Saint Motel",
        videoId: "U9DZkj8Rq6g",
        category: "FIFA 17 SOUNDTRACK",
        title: "MOVE",
        subtitle: "Saint Motel",
        iframeTitle: "Saint Motel - Move — YouTube player"
    }),
    highlow: Object.freeze({
        key: "highlow",
        type: "music",
        selectorTitle: "HIGH AND LOW",
        selectorMeta: "Empire Of The Sun",
        videoId: "ntlpTad3PLM",
        category: "FIFA 17 SOUNDTRACK",
        title: "HIGH AND LOW",
        subtitle: "Empire Of The Sun",
        iframeTitle: "Empire Of The Sun - High And Low — YouTube player"
    }),
    trailer: Object.freeze({
        key: "trailer",
        type: "video",
        selectorTitle: "GAMEPLAY TRAILER",
        selectorMeta: "FIFA 17",
        videoId: "-3fjoe5Njpc",
        category: "FIFA 17 VIDEO",
        title: "FIFA 17 GAMEPLAY TRAILER",
        subtitle: "EA SPORTS FIFA 17",
        iframeTitle: "FIFA 17 gameplay trailer — YouTube player"
    })
});

const MARCO_REUS_IMAGE = Object.freeze({
    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=1.9.1-r18",
    source: "https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg",
    license: "https://creativecommons.org/licenses/by/2.0/"
});

const MAX_REUS_IMAGE_ATTEMPTS = 2;
const MENU_MEDIA_LOAD_TIMEOUT_MS = 12000;
const MENU_FEEDBACK_INTERACTION_WINDOW_MS = 1800;

let selectedMenuMediaKey = "music";
let menuMediaIframe = null;
let loadedMenuMediaKey = null;
let menuMediaPlaying = false;
let menuMediaMuted = false;
let menuMediaLoadTimer = null;
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
    return MENU_MEDIA_SOURCES[selectedMenuMediaKey] || MENU_MEDIA_SOURCES.music;
}

function sendMenuMediaCommand(command){
    if(!menuMediaIframe || !menuMediaIframe.contentWindow){ return; }
    menuMediaIframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: command,
        args: []
    }), "*");
}

function updateMediaSelectionButtons(){
    const ui = getMenuExperienceUI();
    ui.sourceButtons.forEach((button, key) => {
        const selected = key === selectedMenuMediaKey;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

function updateMenuMediaCopy(){
    const ui = getMenuExperienceUI();
    const media = getSelectedMenuMedia();
    setTextIfChanged(ui.mediaCategory, media.category);
    setTextIfChanged(ui.mediaTitle, media.title);
    setTextIfChanged(ui.mediaSubtitle, media.subtitle);
    ui.mediaTile.dataset.mediaType = media.type;
}

function refreshMenuMediaControls(){
    const ui = getMenuExperienceUI();
    const media = getSelectedMenuMedia();
    updateMediaSelectionButtons();
    updateMenuMediaCopy();

    const isSelectedMediaLoaded = loadedMenuMediaKey === selectedMenuMediaKey && Boolean(menuMediaIframe);
    if(ui.mediaToggle){
        ui.mediaToggle.disabled = false;
        setTextIfChanged(ui.mediaToggle, isSelectedMediaLoaded && menuMediaPlaying ? "PAUSE" : (isSelectedMediaLoaded ? "PLAY" : (media.type === "video" ? "LOAD VIDEO" : "PLAY TRACK")));
    }
    if(ui.mediaMute){
        ui.mediaMute.disabled = !isSelectedMediaLoaded;
        setTextIfChanged(ui.mediaMute, menuMediaMuted ? "UNMUTE" : "MUTE");
    }

    if(!isSelectedMediaLoaded && ui.mediaStatus){
        setTextIfChanged(ui.mediaStatus, `${media.title} · LOADS ONLY WHEN YOU PRESS PLAY`);
    }
}

function clearMenuMediaTimer(){
    if(menuMediaLoadTimer){
        clearTimeout(menuMediaLoadTimer);
        menuMediaLoadTimer = null;
    }
}

function unloadMenuMedia(){
    clearMenuMediaTimer();
    if(menuMediaIframe){
        menuMediaIframe.remove();
        menuMediaIframe = null;
    }
    loadedMenuMediaKey = null;
    menuMediaPlaying = false;
    menuMediaMuted = false;
    const ui = getMenuExperienceUI();
    if(ui.mediaHost){
        ui.mediaHost.replaceChildren();
        const placeholder = document.createElement("p");
        placeholder.className = "menuMusicPlaceholder";
        placeholder.textContent = "Selected FIFA 17 media stays unloaded until you press Play, keeping startup light.";
        ui.mediaHost.appendChild(placeholder);
    }
    refreshMenuMediaControls();
}

function loadSelectedMenuMedia(){
    const ui = getMenuExperienceUI();
    const media = getSelectedMenuMedia();
    if(!ui.mediaHost){ return false; }

    if(menuMediaIframe && loadedMenuMediaKey === selectedMenuMediaKey){
        return true;
    }

    unloadMenuMedia();
    ui.mediaHost.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "menuMusicPlaceholder";
    loading.textContent = `Loading ${media.title} from YouTube...`;
    ui.mediaHost.appendChild(loading);

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${media.videoId}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&autoplay=1`;
    iframe.title = media.iframeTitle;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;

    iframe.addEventListener("load", () => {
        if(iframe !== menuMediaIframe){ return; }
        clearMenuMediaTimer();
        menuMediaPlaying = true;
        setTextIfChanged(ui.mediaStatus, `${media.title} · PLAYING FROM YOUTUBE`);
        refreshMenuMediaControls();
    });
    iframe.addEventListener("error", () => {
        if(iframe !== menuMediaIframe){ return; }
        clearMenuMediaTimer();
        unloadMenuMedia();
        setTextIfChanged(ui.mediaStatus, `${media.title} · YOUTUBE IS CURRENTLY UNAVAILABLE`);
    });

    menuMediaIframe = iframe;
    loadedMenuMediaKey = selectedMenuMediaKey;
    ui.mediaHost.replaceChildren(iframe);
    menuMediaLoadTimer = setTimeout(() => {
        if(iframe === menuMediaIframe && !menuMediaPlaying){
            setTextIfChanged(ui.mediaStatus, `${media.title} · STILL CONNECTING TO YOUTUBE`);
        }
    }, MENU_MEDIA_LOAD_TIMEOUT_MS);
    refreshMenuMediaControls();
    return true;
}

function toggleMenuMedia(){
    if(!menuMediaIframe || loadedMenuMediaKey !== selectedMenuMediaKey){
        loadSelectedMenuMedia();
        return;
    }
    if(menuMediaPlaying){
        sendMenuMediaCommand("pauseVideo");
        menuMediaPlaying = false;
        setTextIfChanged(getMenuExperienceUI().mediaStatus, `${getSelectedMenuMedia().title} · PAUSED`);
    }else{
        sendMenuMediaCommand("playVideo");
        menuMediaPlaying = true;
        setTextIfChanged(getMenuExperienceUI().mediaStatus, `${getSelectedMenuMedia().title} · PLAYING FROM YOUTUBE`);
    }
    refreshMenuMediaControls();
}

function toggleMenuMediaMute(){
    if(!menuMediaIframe || loadedMenuMediaKey !== selectedMenuMediaKey){ return; }
    sendMenuMediaCommand(menuMediaMuted ? "unMute" : "mute");
    menuMediaMuted = !menuMediaMuted;
    refreshMenuMediaControls();
}

function selectMenuMedia(key){
    if(!MENU_MEDIA_SOURCES[key] || key === selectedMenuMediaKey){ return; }
    selectedMenuMediaKey = key;
    unloadMenuMedia();
    refreshMenuMediaControls();
}

function canUseFeedbackSound(){
    if(document.hidden){ return false; }
    if(window.CareerModePreferences && typeof window.CareerModePreferences.isSoundEnabled === "function"){
        return window.CareerModePreferences.isSoundEnabled();
    }
    return true;
}

function markMenuFeedbackInteraction(){
    menuFeedbackInteractionPending = true;
    menuFeedbackInteractionAt = performance.now();
}

function consumeMenuFeedbackInteraction(){
    const fresh = menuFeedbackInteractionPending
        && performance.now() - menuFeedbackInteractionAt <= MENU_FEEDBACK_INTERACTION_WINDOW_MS;
    menuFeedbackInteractionPending = false;
    return fresh;
}

async function warmMenuFeedback(){
    if(!canUseFeedbackSound()){ return false; }
    if(menuFeedbackWarmPromise){ return menuFeedbackWarmPromise; }
    menuFeedbackWarmPromise = (async () => {
        if(typeof window.loadRuntimeScript !== "function"){ return false; }
        const module = await window.loadRuntimeScript("menu-feedback", "js/menuFeedback.js", () => window.CareerModeMenuFeedback);
        if(module && typeof module.warm === "function"){
            return module.warm();
        }
        return false;
    })().catch(() => false).finally(() => {
        menuFeedbackWarmPromise = null;
    });
    return menuFeedbackWarmPromise;
}

function playMenuFeedback(kind){
    if(!canUseFeedbackSound() || !consumeMenuFeedbackInteraction()){ return; }
    warmMenuFeedback().then(moduleReady => {
        if(!moduleReady || !window.CareerModeMenuFeedback || typeof window.CareerModeMenuFeedback.play !== "function"){ return; }
        window.CareerModeMenuFeedback.play(kind);
    }).catch(() => {});
}

function getMenuFeedbackKind(target){
    if(!target){ return "select"; }
    if(target.id === "newShowdown"){ return "launch"; }
    if(target.id === "continueCareer"){ return "continue"; }
    if(target.matches("[data-menu-media-source]")){ return "switch"; }
    if(target.id === "menuMusicToggle" || target.id === "menuMusicMute"){ return "media"; }
    return "select";
}

function scheduleMarcoReusLoad(){
    if(reusImageLoadScheduled){ return; }
    reusImageLoadScheduled = true;
    const schedule = window.requestIdleCallback || (callback => setTimeout(callback, 900));
    schedule(() => {
        const ui = getMenuExperienceUI();
        if(!ui.reusImage || ui.reusImage.dataset.loaded === "true" || reusImageAttempts >= MAX_REUS_IMAGE_ATTEMPTS){ return; }
        reusImageAttempts += 1;
        ui.reusImage.src = MARCO_REUS_IMAGE.thumbnail;
    });
}

function bindMenuMediaControls(){
    const ui = getMenuExperienceUI();
    if(ui.mediaToggle){
        ui.mediaToggle.addEventListener("click", toggleMenuMedia);
    }
    if(ui.mediaMute){
        ui.mediaMute.addEventListener("click", toggleMenuMediaMute);
    }
    ui.sourceButtons.forEach(button => {
        button.addEventListener("click", () => selectMenuMedia(button.dataset.menuMediaSource));
    });
    refreshMenuMediaControls();
}

function bindMenuFeedback(){
    if(menuFeedbackInteractionBound){ return; }
    menuFeedbackInteractionBound = true;
    document.addEventListener("pointerdown", event => {
        const target = event.target && event.target.closest ? event.target.closest("button") : null;
        if(!target){ return; }
        markMenuFeedbackInteraction();
        warmMenuFeedback();
    }, { capture: true, passive: true });
    document.addEventListener("keydown", event => {
        if(event.key !== "Enter" && event.key !== " "){ return; }
        const target = event.target && event.target.closest ? event.target.closest("button") : null;
        if(!target){ return; }
        markMenuFeedbackInteraction();
        warmMenuFeedback();
    }, true);
    document.addEventListener("click", event => {
        const target = event.target && event.target.closest ? event.target.closest("button") : null;
        if(!target){ return; }
        playMenuFeedback(getMenuFeedbackKind(target));
    }, true);
}

function initializeMenuExperience(){
    ensureMarcoReusTreatment();
    refreshMainMenuExperience();
    bindMenuMediaControls();
    bindMenuFeedback();
    scheduleMarcoReusLoad();
}

window.refreshMainMenuExperience = refreshMainMenuExperience;

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initializeMenuExperience, { once: true });
}else{
    initializeMenuExperience();
}
