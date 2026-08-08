/* =====================================================
   Career Mode Showdown
   v0.13.1
   Lightweight Main Menu Media Experience
===================================================== */

const MENU_MEDIA_SOURCES = Object.freeze({
    music: Object.freeze({
        key: "music",
        videoId: "RrJZJtY6u7o",
        category: "MENU MUSIC",
        title: "ARE WE READY? (WRECK)",
        subtitle: "Two Door Cinema Club",
        playLabel: "PLAY MUSIC",
        pauseLabel: "PAUSE MUSIC",
        iframeTitle: "Two Door Cinema Club - Are We Ready? (Wreck) — YouTube player"
    }),
    trailer: Object.freeze({
        key: "trailer",
        videoId: "-3fjoe5Njpc",
        category: "FIFA 17 VIDEO",
        title: "FIFA 17 GAMEPLAY TRAILER",
        subtitle: "EA SPORTS FIFA 17",
        playLabel: "PLAY TRAILER",
        pauseLabel: "PAUSE TRAILER",
        iframeTitle: "FIFA 17 gameplay trailer — YouTube player"
    })
});

let selectedMenuMediaKey = "music";
let menuMediaIframe = null;
let loadedMenuMediaKey = null;
let menuMediaPlaying = false;
let menuMediaMuted = false;
let menuExperienceInitialized = false;

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

function updateExistingTileText(button, label, meta){
    if(!button){ return; }

    const labelElement = button.querySelector(".menuTileLabel");
    const metaElement = button.querySelector(".menuTileMeta");

    if(labelElement && labelElement.textContent !== label){ labelElement.textContent = label; }
    if(metaElement && metaElement.textContent !== meta){ metaElement.textContent = meta; }
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

function refreshMainMenuExperience(){
    const continueButton = document.getElementById("continueCareer");
    if(!continueButton){ return; }

    const saveMeta = getSavedShowdownMenuMeta();
    updateExistingTileText(continueButton, saveMeta.label, saveMeta.meta);
    continueButton.disabled = !saveMeta.hasSave;
    continueButton.setAttribute("aria-disabled", String(!saveMeta.hasSave));
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
    const host = document.getElementById("menuMusicPlayer");
    if(!host || menuMediaIframe){ return; }

    host.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.className = "menuMusicPlaceholder";
    placeholder.textContent = "Selected YouTube media stays unloaded until Play, keeping startup fast.";
    host.appendChild(placeholder);
}

function destroyMenuMediaIframe(){
    if(menuMediaIframe){
        try{ sendMenuMediaCommand("pauseVideo"); }catch(error){ /* iframe may already be detached */ }
        menuMediaIframe.remove();
    }

    menuMediaIframe = null;
    loadedMenuMediaKey = null;
    renderMenuMediaPlaceholder();
}

function updateMenuMediaHeader(){
    const media = getSelectedMenuMedia();
    const tile = document.querySelector(".menuMusicTile");
    const category = document.querySelector(".menuMusicHeader span");
    const title = document.querySelector(".menuMusicHeader strong");
    const subtitle = document.querySelector(".menuMusicArtist");

    if(category){ category.textContent = media.category; }
    if(title){ title.textContent = media.title; }
    if(subtitle){ subtitle.textContent = media.subtitle; }
    if(tile){ tile.dataset.mediaKind = media.key; }

    document.querySelectorAll("[data-menu-media-source]").forEach(button => {
        const selected = button.dataset.menuMediaSource === media.key;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

function updateMenuMediaControls(){
    const media = getSelectedMenuMedia();
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");
    const status = document.getElementById("menuMusicStatus");

    if(toggle){ toggle.textContent = menuMediaPlaying ? media.pauseLabel : media.playLabel; }

    if(mute){
        mute.disabled = !menuMediaIframe;
        mute.textContent = menuMediaMuted ? "UNMUTE" : "MUTE";
    }

    if(status){
        if(!menuMediaIframe){
            status.textContent = `${media.title} · LOADS ONLY WHEN YOU PRESS PLAY`;
        }else if(menuMediaPlaying){
            status.textContent = menuMediaMuted ? "PLAYING · MUTED" : "PLAYING";
        }else{
            status.textContent = "PAUSED";
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
    selector.setAttribute("aria-label", "Choose menu media");

    [
        ["music", "TWO DOOR CINEMA CLUB"],
        ["trailer", "FIFA 17 TRAILER"]
    ].forEach(([key, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "menuMediaChoice";
        button.dataset.menuMediaSource = key;
        button.textContent = label;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => selectMenuMedia(key));
        selector.appendChild(button);
    });

    host.parentNode.insertBefore(selector, host);
}

function createMenuMediaIframe(){
    if(menuMediaIframe && loadedMenuMediaKey === selectedMenuMediaKey){
        return menuMediaIframe;
    }

    if(menuMediaIframe){ destroyMenuMediaIframe(); }

    const host = document.getElementById("menuMusicPlayer");
    if(!host){ return null; }

    const media = getSelectedMenuMedia();
    host.replaceChildren();

    const iframe = document.createElement("iframe");
    const origin = encodeURIComponent(window.location.origin);
    iframe.title = media.iframeTitle;
    iframe.src = `https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${origin}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;

    loadedMenuMediaKey = selectedMenuMediaKey;
    menuMediaIframe = iframe;

    iframe.addEventListener("load", () => {
        if(menuMediaIframe !== iframe || loadedMenuMediaKey !== selectedMenuMediaKey){ return; }
        if(menuMediaPlaying){ sendMenuMediaCommand("playVideo"); }
        if(menuMediaMuted){ sendMenuMediaCommand("mute"); }
    }, { once: true });

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
        if(!createMenuMediaIframe()){
            menuMediaPlaying = false;
        }
    }

    updateMenuMediaControls();
}

function toggleMenuMusic(){
    if(!menuMediaIframe){
        menuMediaPlaying = true;
        if(!createMenuMediaIframe()){
            menuMediaPlaying = false;
        }
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

    createTileContent(newShowdown, "02", "NEW SHOWDOWN", "Create a new rivalry and draw your league");
    createTileContent(legacy, "03", "LEGACY", "Completed rivalries and season history");
    createTileContent(trophyRoom, "04", "TROPHY ROOM", "Career trophies, records and manager standings");
    createTileContent(ruleBook, "05", "RULE BOOK", "Competition rules, scoring and transfer challenge");
    refreshMainMenuExperience();

    ensureMenuMediaSelector();
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
