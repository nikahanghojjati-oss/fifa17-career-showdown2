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
    thumbnail: "assets/marco-reus-2015-cc-by.webp?v=1.1.0-r1",
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

function createMenuMediaSelector(mediaPanel){
    const selector = document.createElement("div");
    selector.id = "menuMediaSelector";
    selector.className = "menuMediaSelector";

    Object.values(MENU_MEDIA_SOURCES).forEach(source => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "menuMediaChoice";
        button.dataset.mediaKey = source.key;
        button.setAttribute("aria-pressed", source.key === selectedMenuMediaKey ? "true" : "false");
        button.innerHTML = `<span>${source.selectorTitle}</span><small>${source.selectorMeta}</small>`;
        selector.appendChild(button);
    });

    mediaPanel.appendChild(selector);
    return selector;
}

function ensureMenuMediaSelector(){
    const mediaPanel = document.querySelector(".menuMediaPanel");
    if(!mediaPanel){ return null; }

    const existing = document.getElementById("menuMediaSelector");
    return existing || createMenuMediaSelector(mediaPanel);
}

function getSelectedMenuMedia(){
    return MENU_MEDIA_SOURCES[selectedMenuMediaKey] || MENU_MEDIA_SOURCES.music;
}

function getMenuMediaYouTubeUrl(source, autoplay = true){
    const params = new URLSearchParams({
        autoplay: autoplay ? "1" : "0",
        controls: "1",
        enablejsapi: "1",
        playsinline: "1",
        rel: "0",
        modestbranding: "1"
    });
    return `https://www.youtube-nocookie.com/embed/${source.videoId}?${params.toString()}`;
}

function clearMenuMediaLoadTimer(){
    if(menuMediaLoadTimer !== null){
        window.clearTimeout(menuMediaLoadTimer);
        menuMediaLoadTimer = null;
    }
}

function removeMenuMediaIframe(){
    clearMenuMediaLoadTimer();
    if(menuMediaIframe){
        menuMediaIframe.remove();
        menuMediaIframe = null;
    }
    loadedMenuMediaKey = null;
    menuMediaPlaying = false;
}

function updateMenuMediaUI(){
    if(!menuExperienceUI){ return; }
    const source = getSelectedMenuMedia();
    setTextIfChanged(menuExperienceUI.category, source.category);
    setTextIfChanged(menuExperienceUI.title, source.title);
    setTextIfChanged(menuExperienceUI.subtitle, source.subtitle);
    setTextIfChanged(menuExperienceUI.toggle, menuMediaPlaying ? "PAUSE" : "PLAY TRACK");
    setTextIfChanged(menuExperienceUI.mute, menuMediaMuted ? "UNMUTE" : "MUTE");

    document.querySelectorAll(".menuMediaChoice").forEach(choice => {
        const selected = choice.dataset.mediaKey === selectedMenuMediaKey;
        choice.setAttribute("aria-pressed", selected ? "true" : "false");
    });
}

function sendMenuMediaCommand(command, value){
    if(!menuMediaIframe || !menuMediaIframe.contentWindow){ return false; }
    menuMediaIframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: command, args: value === undefined ? [] : [value] }), "*");
    return true;
}

function loadSelectedMenuMedia({ autoplay = true } = {}){
    const panel = document.querySelector(".menuMediaPanel");
    if(!panel){ return; }

    const source = getSelectedMenuMedia();
    removeMenuMediaIframe();

    const iframe = document.createElement("iframe");
    iframe.className = "menuMediaIframe";
    iframe.title = source.iframeTitle;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.src = getMenuMediaYouTubeUrl(source, autoplay);
    iframe.addEventListener("load", () => {
        clearMenuMediaLoadTimer();
        loadedMenuMediaKey = source.key;
        menuMediaPlaying = autoplay;
        updateMenuMediaUI();
    }, { once: true });

    menuMediaLoadTimer = window.setTimeout(() => {
        menuMediaLoadTimer = null;
        if(iframe.isConnected && loadedMenuMediaKey !== source.key){
            iframe.remove();
            if(menuMediaIframe === iframe){ menuMediaIframe = null; }
            menuMediaPlaying = false;
            updateMenuMediaUI();
        }
    }, MENU_MEDIA_LOAD_TIMEOUT_MS);

    panel.appendChild(iframe);
    menuMediaIframe = iframe;
    loadedMenuMediaKey = null;
    menuMediaPlaying = autoplay;
    updateMenuMediaUI();
}

function toggleSelectedMenuMedia(){
    if(!menuMediaIframe || loadedMenuMediaKey !== selectedMenuMediaKey){
        loadSelectedMenuMedia({ autoplay: true });
        return;
    }

    const nextPlaying = !menuMediaPlaying;
    if(sendMenuMediaCommand(nextPlaying ? "playVideo" : "pauseVideo")){
        menuMediaPlaying = nextPlaying;
        updateMenuMediaUI();
    }
}

function toggleMenuMediaMute(){
    if(!menuMediaIframe || loadedMenuMediaKey !== selectedMenuMediaKey){
        loadSelectedMenuMedia({ autoplay: false });
    }

    menuMediaMuted = !menuMediaMuted;
    sendMenuMediaCommand(menuMediaMuted ? "mute" : "unMute");
    updateMenuMediaUI();
}

function chooseMenuMedia(key){
    if(!MENU_MEDIA_SOURCES[key] || key === selectedMenuMediaKey){ return; }
    selectedMenuMediaKey = key;
    removeMenuMediaIframe();
    updateMenuMediaUI();
}

function bindMenuMediaControls(){
    const selector = ensureMenuMediaSelector();
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");
    if(!selector || !toggle || !mute){ return; }

    if(selector.dataset.mediaBound !== "true"){
        selector.dataset.mediaBound = "true";
        selector.addEventListener("click", event => {
            const button = event.target.closest(".menuMediaChoice");
            if(!button){ return; }
            chooseMenuMedia(button.dataset.mediaKey);
        });
    }

    if(toggle.dataset.musicBound !== "true"){
        toggle.dataset.musicBound = "true";
        toggle.addEventListener("click", toggleSelectedMenuMedia);
    }

    if(mute.dataset.musicBound !== "true"){
        mute.dataset.musicBound = "true";
        mute.addEventListener("click", toggleMenuMediaMute);
    }
}

function bindMenuFeedbackInteraction(){
    if(menuFeedbackInteractionBound){ return; }
    const shell = document.getElementById("mainMenu");
    if(!shell){ return; }
    menuFeedbackInteractionBound = true;

    shell.addEventListener("pointerdown", () => {
        menuFeedbackInteractionPending = true;
        menuFeedbackInteractionAt = performance.now();
    }, { passive: true });

    shell.addEventListener("keydown", event => {
        if(event.key !== "Enter" && event.key !== " "){ return; }
        menuFeedbackInteractionPending = true;
        menuFeedbackInteractionAt = performance.now();
    });
}

function warmMenuFeedback(){
    if(menuFeedbackWarmPromise){ return menuFeedbackWarmPromise; }
    if(typeof window.warmMenuFeedback !== "function"){
        return Promise.resolve(false);
    }
    menuFeedbackWarmPromise = Promise.resolve(window.warmMenuFeedback()).catch(() => false);
    return menuFeedbackWarmPromise;
}

function decorateMainMenuTiles(){
    createTileContent(
        document.getElementById("newShowdownButton"),
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
    createTileContent(
        document.getElementById("settingsButton"),
        "OPTIONS",
        "SETTINGS",
        "Motion, app information and local data"
    );
}

function applyHomeReusImage(){
    const image = document.querySelector(".menuCoverAthlete img");
    if(!image){ return false; }
    const cover = image.closest(".menuCoverAthlete");
    const credit = cover ? cover.querySelector(".menuCoverCredit") : null;
    const markLoaded = () => {
        if(cover){
            cover.classList.add("imageLoaded");
            cover.classList.remove("imageUnavailable");
        }
    };
    const markUnavailable = () => {
        if(cover){
            cover.classList.remove("imageLoaded");
            cover.classList.add("imageUnavailable");
        }
        if(credit){ credit.textContent = "Marco Reus portrait unavailable"; }
    };

    if(image.getAttribute("src") === MARCO_REUS_IMAGE.thumbnail){
        if(image.complete && image.naturalWidth > 0){ markLoaded(); }
        return true;
    }

    image.onload = markLoaded;
    image.onerror = () => {
        if(reusImageAttempts < MAX_REUS_IMAGE_ATTEMPTS){
            reusImageAttempts += 1;
            image.src = `${MARCO_REUS_IMAGE.thumbnail}&retry=${reusImageAttempts}`;
            return;
        }
        markUnavailable();
    };
    image.referrerPolicy = "no-referrer";
    image.src = MARCO_REUS_IMAGE.thumbnail;
    return true;
}

function scheduleHomeReusImage(){
    if(reusImageLoadScheduled){ return; }
    reusImageLoadScheduled = true;

    const run = () => {
        if(!applyHomeReusImage()){
            reusImageLoadScheduled = false;
        }
    };

    if("requestIdleCallback" in window){
        window.requestIdleCallback(run, { timeout: 1600 });
    }else{
        window.setTimeout(run, 90);
    }
}

function getSavedShowdownMenuMeta(){
    const saved = typeof hasSavedShowdown === "function" && hasSavedShowdown();
    if(!saved){
        return {
            indicator: "No Active Showdown",
            meta: "Start a new rivalry to begin",
            title: "START SHOWDOWN",
            subtitle: "Two managers · one rivalry · FIFA 17"
        };
    }

    const showdown = currentShowdown || (typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null);
    if(!showdown){
        return {
            indicator: "No Active Showdown",
            meta: "Start a new rivalry to begin",
            title: "START SHOWDOWN",
            subtitle: "Two managers · one rivalry · FIFA 17"
        };
    }

    const totalRounds = Number(showdown.totalRounds) || 1;
    const currentRound = Math.min(Number(showdown.currentRound) || 1, totalRounds);
    const managers = showdown.managers || {};
    const playerOne = managers.playerOne || "Manager 1";
    const playerTwo = managers.playerTwo || "Manager 2";
    const completed = showdown.status === "Completed";

    return {
        indicator: completed ? "Showdown Complete" : `Season ${currentRound} / ${totalRounds}`,
        meta: `${playerOne} vs ${playerTwo}`,
        title: completed ? "REVIEW SHOWDOWN" : "CONTINUE CAREER",
        subtitle: completed
            ? "Final result saved to your local Legacy"
            : `${showdown.selectedLeague?.name || "League draw pending"} · Season ${currentRound} of ${totalRounds}`
    };
}

function refreshMainMenuExperience(){
    const saveMeta = getSavedShowdownMenuMeta();
    setTextIfChanged(document.getElementById("seasonIndicator"), saveMeta.indicator);
    setTextIfChanged(document.querySelector("#continueShowdownButton .menuTileLabel"), saveMeta.title);
    setTextIfChanged(document.querySelector("#continueShowdownButton .menuTileMeta"), saveMeta.subtitle);
    setTextIfChanged(document.querySelector("#continueShowdownButton .menuCoverStatus"), saveMeta.meta);
}

function getMenuExperienceIntegrity(){
    const selector = document.getElementById("menuMediaSelector");
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");
    const mediaChoices = selector ? selector.querySelectorAll(".menuMediaChoice") : [];

    return {
        mediaChoicesReady: mediaChoices.length === Object.keys(MENU_MEDIA_SOURCES).length,
        toggleBound: toggle?.dataset.musicBound === "true",
        muteBound: mute?.dataset.musicBound === "true",
        feedbackBound: menuFeedbackInteractionBound,
        selectedMediaReady: Boolean(MENU_MEDIA_SOURCES[selectedMenuMediaKey])
    };
}

function initializeMenuExperience(){
    const category = document.querySelector(".menuMediaCategory");
    const title = document.querySelector(".menuMediaTitle");
    const subtitle = document.querySelector(".menuMediaSubtitle");
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");

    menuExperienceUI = { category, title, subtitle, toggle, mute };
    decorateMainMenuTiles();
    ensureMenuMediaSelector();
    bindMenuMediaControls();
    bindMenuFeedbackInteraction();
    scheduleHomeReusImage();
    refreshMainMenuExperience();
    updateMenuMediaUI();

    const integrity = getMenuExperienceIntegrity();
    if(!integrity.mediaChoicesReady || !integrity.toggleBound || !integrity.muteBound || !integrity.feedbackBound || !integrity.selectedMediaReady){
        throw new Error("Home menu experience failed its startup integrity contract.");
    }
    return integrity;
}

window.initializeMenuExperience = initializeMenuExperience;
window.refreshMainMenuExperience = refreshMainMenuExperience;
window.getMenuExperienceIntegrity = getMenuExperienceIntegrity;
window.warmMenuFeedback = warmMenuFeedback;
