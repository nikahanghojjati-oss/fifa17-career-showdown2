/* =====================================================
   Career Mode Showdown
   v0.15.0
   Original Club Identity / Crest Presentation
===================================================== */

const CLUB_IDENTITY_PALETTES = Object.freeze([
    ["#1d76b8", "#82d5ef"],
    ["#2c3340", "#f0d529"],
    ["#0d8a9a", "#70dae3"],
    ["#314d8c", "#d9e4f2"],
    ["#8d3341", "#e8c9ce"],
    ["#335e4b", "#b8d9c8"],
    ["#69458f", "#d8cae7"],
    ["#a45c21", "#efd1a8"]
]);

function getClubIdentityHash(value){
    let hash = 2166136261;
    const text = String(value || "").normalize("NFKD");
    for(let index = 0; index < text.length; index += 1){
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getClubIdentityInitials(clubName){
    const clean = String(clubName || "")
        .replace(/\b(fc|cf|afc|sc|ac|ss|calcio|club|football)\b/gi, " ")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .trim();

    if(!clean || clean === "?"){
        return "--";
    }

    const words = clean.split(/[\s-]+/).filter(Boolean);
    if(words.length === 1){
        return words[0].slice(0, 3).toUpperCase();
    }

    return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function getClubIdentity(clubName){
    const name = String(clubName || "").trim();
    const hash = getClubIdentityHash(name);
    const palette = CLUB_IDENTITY_PALETTES[hash % CLUB_IDENTITY_PALETTES.length];

    return {
        initials: getClubIdentityInitials(name),
        primary: palette[0],
        secondary: palette[1],
        angle: `${32 + (hash % 26)}deg`
    };
}

function clearClubIdentity(element){
    if(!element){ return; }
    delete element.dataset.clubIdentity;
    delete element.dataset.clubInitials;
    element.style.removeProperty("--club-primary");
    element.style.removeProperty("--club-secondary");
    element.style.removeProperty("--club-angle");
}

function applyClubIdentity(element, clubName){
    if(!element){ return; }

    const name = String(clubName || "").trim();
    if(!name || name === "?" || /not assigned/i.test(name)){
        clearClubIdentity(element);
        return;
    }

    const identity = getClubIdentity(name);
    element.dataset.clubIdentity = "true";
    element.dataset.clubInitials = identity.initials;
    element.style.setProperty("--club-primary", identity.primary);
    element.style.setProperty("--club-secondary", identity.secondary);
    element.style.setProperty("--club-angle", identity.angle);
}

function refreshClubVisualIdentity(showdown = null){
    const active = showdown || (typeof currentShowdown !== "undefined" ? currentShowdown : null);
    if(!active || !active.clubs){ return; }

    const mappings = [
        [document.getElementById("clubNameOne"), active.clubs.playerOne],
        [document.getElementById("clubNameTwo"), active.clubs.playerTwo],
        [document.getElementById("dashboardClubOne"), active.clubs.playerOne],
        [document.getElementById("dashboardClubTwo"), active.clubs.playerTwo],
        [document.getElementById("transferClubOne"), active.clubs.playerOne],
        [document.getElementById("transferClubTwo"), active.clubs.playerTwo],
        [document.getElementById("seasonClubOne"), active.clubs.playerOne],
        [document.getElementById("seasonClubTwo"), active.clubs.playerTwo],
        [document.querySelector("#seasonSummaryOne .summaryClub"), active.clubs.playerOne],
        [document.querySelector("#seasonSummaryTwo .summaryClub"), active.clubs.playerTwo]
    ];

    mappings.forEach(([element, clubName]) => {
        applyClubIdentity(element, clubName);
    });
}

window.getClubIdentity = getClubIdentity;
window.applyClubIdentity = applyClubIdentity;
window.refreshClubVisualIdentity = refreshClubVisualIdentity;
