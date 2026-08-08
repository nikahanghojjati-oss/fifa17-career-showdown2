/* =====================================================
   Career Mode Showdown
   v0.15.0
   FIFA 17 Era Menu Atmosphere + Lightweight Media Controller
===================================================== */

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
    thumbnail: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Marco_Reus_2014.jpg?width=520",
    source: "https://commons.wikimedia.org/wiki/File:Marco_Reus_2014.jpg",
    license: "https://creativecommons.org/licenses/by-sa/3.0/"
});

let selectedMenuMediaKey = "music";
let menuMediaIframe = null;
let loadedMenuMediaKey = null;
let menuMediaPlaying = false;
let menuMediaMuted = false;
let menuExperienceInitialized = false;
let menuExperienceUI = null;
let reusImageLoadScheduled = false;

function setTextIfChanged(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function createTileContent(button, code, label, meta){
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
        return { hasSave: false, label: "CONTINUE CAREER", meta: "No active showdown saved" };
    }

    const managerOne = saved.managers && saved.managers.playerOne ? saved.managers.playerOne : "Manager 1";
    const managerTwo = saved.managers && saved.managers.playerTwo ? saved.managers.playerTwo : "Manager 2";
    const status = saved.status === "Completed"
        ? "Showdown complete"
        : `Season ${Number(saved.currentRound) || 1} of ${Number(saved.totalRounds) || 1}`;

    return {
        hasSave: true,
        label: saved.status === "Completed" ? "VIEW COMPLETED SHOWDOWN" : "CONTINUE CAREER",
        meta: `${managerOne} vs ${managerTwo} · ${status}`
    };
}

function scheduleMarcoReusImageLoad(){
    const ui = getMenuExperienceUI();
    const image = ui.reusImage;
    if(!image || image.dataset.loaded === "true" || image.dataset.loaded === "loading" || reusImageLoadScheduled){ return; }

    reusImageLoadScheduled = true;
    const load = () => {
        reusImageLoadScheduled = false;
        if(typeof getActiveScreenName === "function" && getActiveScreenName() !== "mainMenu"){
            return;
        }
        if(image.dataset.loaded === "true" || image.dataset.loaded === "loading"){ return; }
        image.dataset.loaded = "loading";
        image.src = image.dataset.src;
    };

    if(typeof window.requestIdleCallback === "function"){
        window.requestIdleCallback(load, { timeout: 1800 });
    }else{
        window.setTimeout(load, 500);
    }
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
        image.loading = "lazy";
        image.fetchPriority = "low";
        image.dataset.src = MARCO_REUS_IMAGE.thumbnail;
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
        licenseLink.textContent = "CC BY-SA 3.0";

        credit.append(sourceLink, " · ", licenseLink);
        grid.insertAdjacentElement("afterend", credit);
    }

    menuExperienceUI = null;
    cacheMenuExperienceUI();
    scheduleMarcoReusImageLoad();
}

function refreshMainMenuExperience(){
    const ui = getMenuExperienceUI();
    if(!ui.continueButton){ return; }

    const saveMeta = getSavedShowdownMenuMeta();
    updateExistingTileText(ui.continueButton, saveMeta.label, saveMeta.meta);
    if(ui.continueButton.disabled === saveMeta.hasSave){
        ui.continueButton.disabled = !saveMeta.hasSave;
    }
    ui.continueButton.setAttribute("aria-disabled", String(!saveMeta.hasSave));
    scheduleMarcoReusImageLoad();
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
    }), "https://www.youtube-nocookie.com");
}

function renderMenuMediaPlaceholder(){
    const host = getMenuExperienceUI().mediaHost;
    if(!host || menuMediaIframe){ return; }

    host.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.className = "menuMusicPlaceholder";
    placeholder.textContent = "Selected FIFA 17 media stays unloaded until Play, keeping startup fast.";
    host.appendChild(placeholder);
}

function destroyMenuMediaIframe(){
    const ui = getMenuExperienceUI();
    if(menuMediaIframe){
        try{ sendMenuMediaCommand("pauseVideo"); }catch(error){ /* iframe may already be detached */ }
        menuMediaIframe.remove();
    }
    menuMediaIframe = null;
    loadedMenuMediaKey = null;
    if(ui.mediaTile){ delete ui.mediaTile.dataset.mediaLoaded; }
    renderMenuMediaPlaceholder();
}

function handleMenuMediaLoadError(iframe){
    if(menuMediaIframe !== iframe){ return; }
    menuMediaPlaying = false;
    destroyMenuMediaIframe();
    updateMenuMediaControls();
    if(typeof window.showAppNotice === "function"){
        window.showAppNotice("The selected YouTube media could not be loaded. Choose another track or try again.", "error", 7000);
    }
}

function updateMenuMediaHeader(){
    const media = getSelectedMenuMedia();
    const ui = getMenuExperienceUI();

    setTextIfChanged(ui.mediaCategory, media.category);
    setTextIfChanged(ui.mediaTitle, media.title);
    setTextIfChanged(ui.mediaSubtitle, media.subtitle);
    if(ui.mediaTile){ ui.mediaTile.dataset.mediaKind = media.type; }

    ui.sourceButtons.forEach((button, key) => {
        const selected = key === media.key;
        if(button.classList.contains("selected") !== selected){
            button.classList.toggle("selected", selected);
        }
        button.setAttribute("aria-pressed", String(selected));
    });
}

function updateMenuMediaControls(){
    const media = getSelectedMenuMedia();
    const ui = getMenuExperienceUI();
    const playLabel = media.type === "video" ? "PLAY TRAILER" : "PLAY TRACK";
    const pauseLabel = media.type === "video" ? "PAUSE TRAILER" : "PAUSE TRACK";

    setTextIfChanged(ui.mediaToggle, menuMediaPlaying ? pauseLabel : playLabel);

    if(ui.mediaMute){
        const shouldDisable = !menuMediaIframe;
        if(ui.mediaMute.disabled !== shouldDisable){ ui.mediaMute.disabled = shouldDisable; }
        setTextIfChanged(ui.mediaMute, menuMediaMuted ? "UNMUTE" : "MUTE");
    }

    if(ui.mediaStatus){
        if(!menuMediaIframe){
            setTextIfChanged(ui.mediaStatus, `${media.title} · LOADS ONLY WHEN YOU PRESS PLAY`);
        }else if(menuMediaPlaying){
            setTextIfChanged(ui.mediaStatus, menuMediaMuted ? "PLAYING · MUTED" : "PLAYING");
        }else{
            setTextIfChanged(ui.mediaStatus, "PAUSED");
        }
    }
}

function ensureMenuMediaSelector(){
    if(document.getElementById("menuMediaSelector")){ return; }

    const host = document.getElementById("menuMusicPlayer");
    if(!host){ return; }

    const selector = document.createElement("div");
    selector.id = "menuMediaSelector";
    selector.className = "menuMediaSelector";
    selector.setAttribute("role", "group");
    selector.setAttribute("aria-label", "Choose FIFA 17 soundtrack or trailer");

    Object.values(MENU_MEDIA_SOURCES).forEach(media => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "menuMediaChoice";
        button.dataset.menuMediaSource = media.key;
        button.setAttribute("aria-pressed", "false");

        const title = document.createElement("strong");
        title.textContent = media.selectorTitle;
        const meta = document.createElement("small");
        meta.textContent = media.selectorMeta;
        button.append(title, meta);
        selector.appendChild(button);
    });

    selector.addEventListener("click", event => {
        const button = event.target.closest("[data-menu-media-source]");
        if(button && selector.contains(button)){
            selectMenuMedia(button.dataset.menuMediaSource);
        }
    });

    host.parentNode.insertBefore(selector, host);
    menuExperienceUI = null;
    cacheMenuExperienceUI();
}

function createMenuMediaIframe(){
    if(menuMediaIframe && loadedMenuMediaKey === selectedMenuMediaKey){
        return menuMediaIframe;
    }
    if(menuMediaIframe){ destroyMenuMediaIframe(); }

    const ui = getMenuExperienceUI();
    const host = ui.mediaHost;
    if(!host){ return null; }

    const media = getSelectedMenuMedia();
    host.replaceChildren();

    const iframe = document.createElement("iframe");
    const origin = encodeURIComponent(window.location.origin);
    iframe.title = media.iframeTitle;
    iframe.src = `https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${origin}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = media.type === "video";

    loadedMenuMediaKey = selectedMenuMediaKey;
    menuMediaIframe = iframe;
    if(ui.mediaTile){ ui.mediaTile.dataset.mediaLoaded = "true"; }

    iframe.addEventListener("load", () => {
        if(menuMediaIframe !== iframe || loadedMenuMediaKey !== selectedMenuMediaKey){ return; }
        if(menuMediaPlaying){ sendMenuMediaCommand("playVideo"); }
        if(menuMediaMuted){ sendMenuMediaCommand("mute"); }
    }, { once: true });
    iframe.addEventListener("error", () => handleMenuMediaLoadError(iframe), { once: true });

    host.appendChild(iframe);
    return iframe;
}

function selectMenuMedia(key){
    if(!MENU_MEDIA_SOURCES[key] || key === selectedMenuMediaKey){ return; }

    const resumePlayback = menuMediaPlaying;
    destroyMenuMediaIframe();
    selectedMenuMediaKey = key;
    menuMediaPlaying = false;
    updateMenuMediaHeader();

    if(resumePlayback){
        menuMediaPlaying = true;
        if(!createMenuMediaIframe()){ menuMediaPlaying = false; }
    }
    updateMenuMediaControls();
}

function toggleMenuMusic(){
    if(!menuMediaIframe){
        menuMediaPlaying = true;
        if(!createMenuMediaIframe()){ menuMediaPlaying = false; }
        updateMenuMediaControls();
        return;
    }

    menuMediaPlaying = !menuMediaPlaying;
    sendMenuMediaCommand(menuMediaPlaying ? "playVideo" : "pauseVideo");
    updateMenuMediaControls();
}

function toggleMenuMusicMute(){
    if(!menuMediaIframe){ return; }
    menuMediaMuted = !menuMediaMuted;
    sendMenuMediaCommand(menuMediaMuted ? "mute" : "unMute");
    updateMenuMediaControls();
}

function handleMainMenuExit(){
    const media = getSelectedMenuMedia();
    if(media.type !== "video" || !menuMediaIframe){ return; }

    menuMediaPlaying = false;
    destroyMenuMediaIframe();
    updateMenuMediaControls();
}

function initializeMenuExperience(){
    if(menuExperienceInitialized){
        refreshMainMenuExperience();
        updateMenuMediaHeader();
        updateMenuMediaControls();
        return;
    }

    const newShowdown = document.getElementById("newShowdown");
    const continueCareer = document.getElementById("continueCareer");
    const legacy = document.getElementById("legacyButton");
    const trophyRoom = document.getElementById("trophyRoomButton");
    const ruleBook = document.getElementById("ruleBookButton");
    const mediaToggle = document.getElementById("menuMusicToggle");
    const mediaMute = document.getElementById("menuMusicMute");

    if(!newShowdown || !continueCareer || !legacy || !trophyRoom || !ruleBook){ return; }

    createTileContent(newShowdown, "NEW", "NEW SHOWDOWN", "Create a new rivalry and draw your league");
    createTileContent(legacy, "HISTORY", "LEGACY", "Completed rivalries and season history");
    createTileContent(trophyRoom, "HONOURS", "TROPHY ROOM", "Career trophies, records and manager standings");
    createTileContent(ruleBook, "RULES", "RULE BOOK", "Competition rules, scoring and transfer challenge");

    ensureMenuMediaSelector();
    ensureMarcoReusTreatment();
    cacheMenuExperienceUI();
    refreshMainMenuExperience();
    renderMenuMediaPlaceholder();
    updateMenuMediaHeader();

    if(mediaToggle && mediaToggle.dataset.musicBound !== "true"){
        mediaToggle.dataset.musicBound = "true";
        mediaToggle.addEventListener("click", toggleMenuMusic);
    }
    if(mediaMute && mediaMute.dataset.musicBound !== "true"){
        mediaMute.dataset.musicBound = "true";
        mediaMute.addEventListener("click", toggleMenuMusicMute);
    }

    updateMenuMediaControls();
    menuExperienceInitialized = true;
}

window.initializeMenuExperience = initializeMenuExperience;
window.refreshMainMenuExperience = refreshMainMenuExperience;
window.selectMenuMedia = selectMenuMedia;
window.handleMainMenuExit = handleMainMenuExit;
