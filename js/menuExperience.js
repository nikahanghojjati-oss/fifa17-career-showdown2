/* =====================================================
   Career Mode Showdown
   v0.13.0
   Main Menu Experience + Official YouTube Music Embed
===================================================== */

const MENU_MUSIC_VIDEO_ID = "RrJZJtY6u7o";
let menuMusicIframe = null;
let menuMusicPlaying = false;
let menuMusicMuted = false;
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

function getSavedShowdownMenuMeta(){
    const saved = typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null;

    if(!saved){
        return {
            hasSave: false,
            label: "CONTINUE CAREER",
            meta: "No active showdown saved"
        };
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
    if(!continueButton){
        return;
    }

    const saveMeta = getSavedShowdownMenuMeta();
    createTileContent(continueButton, "01", saveMeta.label, saveMeta.meta);
    continueButton.disabled = !saveMeta.hasSave;
    continueButton.setAttribute("aria-disabled", String(!saveMeta.hasSave));
}

function sendMenuMusicCommand(command){
    if(!menuMusicIframe || !menuMusicIframe.contentWindow){
        return;
    }

    menuMusicIframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: command,
        args: []
    }), "https://www.youtube-nocookie.com");
}

function updateMusicControls(){
    const toggle = document.getElementById("menuMusicToggle");
    const mute = document.getElementById("menuMusicMute");
    const status = document.getElementById("menuMusicStatus");

    if(toggle){
        toggle.textContent = menuMusicPlaying ? "PAUSE MUSIC" : (menuMusicIframe ? "PLAY MUSIC" : "PLAY MUSIC");
    }

    if(mute){
        mute.disabled = !menuMusicIframe;
        mute.textContent = menuMusicMuted ? "UNMUTE" : "MUTE";
    }

    if(status){
        if(!menuMusicIframe){
            status.textContent = "OFFICIAL YOUTUBE PLAYER · LOADS ONLY WHEN YOU PRESS PLAY";
        }else if(menuMusicPlaying){
            status.textContent = menuMusicMuted ? "PLAYING · MUTED" : "PLAYING";
        }else{
            status.textContent = "PAUSED";
        }
    }
}

function createMenuMusicIframe(){
    if(menuMusicIframe){
        return menuMusicIframe;
    }

    const host = document.getElementById("menuMusicPlayer");
    if(!host){
        return null;
    }

    host.replaceChildren();

    const iframe = document.createElement("iframe");
    const origin = encodeURIComponent(window.location.origin);
    iframe.title = "Two Door Cinema Club - Are We Ready? (Wreck) — official YouTube player";
    iframe.src = `https://www.youtube-nocookie.com/embed/${MENU_MUSIC_VIDEO_ID}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${origin}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;

    iframe.addEventListener("load", () => {
        if(menuMusicPlaying){
            sendMenuMusicCommand("playVideo");
        }
        if(menuMusicMuted){
            sendMenuMusicCommand("mute");
        }
    }, { once: true });

    host.appendChild(iframe);
    menuMusicIframe = iframe;
    return iframe;
}

function toggleMenuMusic(){
    if(!menuMusicIframe){
        menuMusicPlaying = true;
        createMenuMusicIframe();
        updateMusicControls();
        return;
    }

    menuMusicPlaying = !menuMusicPlaying;
    sendMenuMusicCommand(menuMusicPlaying ? "playVideo" : "pauseVideo");
    updateMusicControls();
}

function toggleMenuMusicMute(){
    if(!menuMusicIframe){
        return;
    }

    menuMusicMuted = !menuMusicMuted;
    sendMenuMusicCommand(menuMusicMuted ? "mute" : "unMute");
    updateMusicControls();
}

function initializeMenuExperience(){
    if(menuExperienceInitialized){
        refreshMainMenuExperience();
        return;
    }

    const newShowdown = document.getElementById("newShowdown");
    const continueCareer = document.getElementById("continueCareer");
    const legacy = document.getElementById("legacyButton");
    const trophyRoom = document.getElementById("trophyRoomButton");
    const ruleBook = document.getElementById("ruleBookButton");
    const musicToggle = document.getElementById("menuMusicToggle");
    const musicMute = document.getElementById("menuMusicMute");

    if(!newShowdown || !continueCareer || !legacy || !trophyRoom || !ruleBook){
        return;
    }

    createTileContent(newShowdown, "02", "NEW SHOWDOWN", "Create a new rivalry and draw your league");
    createTileContent(legacy, "03", "LEGACY", "Completed rivalries and season history");
    createTileContent(trophyRoom, "04", "TROPHY ROOM", "Career trophies, records and manager standings");
    createTileContent(ruleBook, "05", "RULE BOOK", "Competition rules, scoring and transfer challenge");
    refreshMainMenuExperience();

    if(musicToggle && musicToggle.dataset.musicBound !== "true"){
        musicToggle.dataset.musicBound = "true";
        musicToggle.addEventListener("click", toggleMenuMusic);
    }

    if(musicMute && musicMute.dataset.musicBound !== "true"){
        musicMute.dataset.musicBound = "true";
        musicMute.addEventListener("click", toggleMenuMusicMute);
    }

    updateMusicControls();
    menuExperienceInitialized = true;
}

window.initializeMenuExperience = initializeMenuExperience;
window.refreshMainMenuExperience = refreshMainMenuExperience;
