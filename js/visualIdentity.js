/* =====================================================
   Career Mode Showdown
   v1.0.0
   Original Deterministic Club Crest / Identity System

   Club-associated colours are used only as factual visual cues.
   Crest geometry, patterns and motifs are original procedural artwork.
===================================================== */

const CLUB_IDENTITY_FALLBACK_PALETTES = Object.freeze([
    ["#1d76b8", "#82d5ef", "#f4d700"],
    ["#2c3340", "#f0d529", "#f5f7f8"],
    ["#0d8a9a", "#70dae3", "#f1dc42"],
    ["#314d8c", "#d9e4f2", "#efc900"],
    ["#8d3341", "#e8c9ce", "#f4d343"],
    ["#335e4b", "#b8d9c8", "#f0d43c"],
    ["#69458f", "#d8cae7", "#53bddb"],
    ["#a45c21", "#efd1a8", "#263846"]
]);

/*
   These palettes intentionally capture broad, commonly associated club colours
   without copying official badge artwork. Original procedural crests below use
   these colours with project-owned geometry/patterns.
*/
const CLUB_IDENTITY_PALETTES = Object.freeze({
    /* Premier League 2016-17 */
    "Arsenal": ["#d71920", "#f5f5f5", "#163a70"],
    "Bournemouth": ["#d71920", "#15191d", "#f3d23b"],
    "Burnley": ["#6b1f3a", "#81c7e7", "#f2d649"],
    "Chelsea": ["#1746a2", "#f7f8f9", "#d5b638"],
    "Crystal Palace": ["#2355a6", "#d62232", "#f4f5f6"],
    "Everton": ["#164c9e", "#f5f7fa", "#f0c733"],
    "Hull City": ["#f07d19", "#16191c", "#f7f2e8"],
    "Leicester City": ["#1d53a5", "#f6f7f8", "#d8b638"],
    "Liverpool": ["#c8102e", "#f2f2f0", "#19a48b"],
    "Manchester City": ["#72b9dc", "#f5f7f8", "#6d2c3e"],
    "Manchester United": ["#da291c", "#171b1f", "#f4c542"],
    "Middlesbrough": ["#d4202f", "#f5f5f5", "#25333e"],
    "Southampton": ["#d71920", "#f3f3f1", "#15191d"],
    "Stoke City": ["#d91e32", "#f5f5f4", "#2d6ba8"],
    "Sunderland": ["#d71920", "#f7f7f6", "#20272d"],
    "Swansea City": ["#f7f7f5", "#161a1e", "#d8b634"],
    "Tottenham Hotspur": ["#f7f8f8", "#142c5c", "#70b8d8"],
    "Watford": ["#f2d01e", "#1a1e21", "#d81e32"],
    "West Bromwich Albion": ["#f5f6f7", "#183b73", "#70b6d5"],
    "West Ham United": ["#7a263a", "#6fc0df", "#f3d13e"],

    /* LaLiga 2016-17 */
    "Alavés": ["#1765ae", "#f6f7f7", "#222d37"],
    "Athletic Club": ["#d81f32", "#f5f5f3", "#15191d"],
    "Atlético Madrid": ["#d91f32", "#f4f4f3", "#1c3975"],
    "Barcelona": ["#193b8f", "#9f173d", "#e3b724"],
    "Celta Vigo": ["#78c5e6", "#f5f7f8", "#b7283d"],
    "Deportivo La Coruña": ["#2361af", "#f4f5f6", "#d4b62d"],
    "Eibar": ["#1d50a2", "#c71f39", "#f3f4f5"],
    "Espanyol": ["#2770b8", "#f4f5f5", "#25323b"],
    "Granada": ["#d92232", "#f7f7f6", "#244d86"],
    "Las Palmas": ["#f2cf18", "#1768b1", "#f6f6f2"],
    "Leganés": ["#1e58a7", "#f4f5f6", "#58b965"],
    "Málaga": ["#65b9dc", "#f6f7f8", "#23528b"],
    "Osasuna": ["#c91e32", "#203d70", "#f0d34a"],
    "Real Betis": ["#198f50", "#f4f6f5", "#1f3443"],
    "Real Madrid": ["#f5f5f3", "#6a55a3", "#d4b12d"],
    "Real Sociedad": ["#2a67b1", "#f5f6f7", "#d4b733"],
    "Sevilla": ["#f6f6f4", "#d51f35", "#242d33"],
    "Sporting Gijón": ["#cf2034", "#f5f5f4", "#26333c"],
    "Valencia": ["#f4f4f1", "#ec7e22", "#25272b"],
    "Villarreal": ["#f1d426", "#2c69ad", "#f5f5f2"],

    /* Bundesliga 2016-17 */
    "Bayern Munich": ["#d71920", "#1765b0", "#f5f5f4"],
    "Borussia Dortmund": ["#f2d31c", "#181c1f", "#f7f6ef"],
    "Bayer Leverkusen": ["#d41e31", "#171b1f", "#f5f5f4"],
    "Borussia Mönchengladbach": ["#f5f6f5", "#161a1d", "#41a464"],
    "Schalke 04": ["#1d5ba7", "#f5f6f7", "#202c36"],
    "Mainz 05": ["#d82132", "#f5f5f4", "#26323b"],
    "Hertha BSC": ["#2468b5", "#f5f6f7", "#202b34"],
    "Wolfsburg": ["#6abf37", "#f5f6f4", "#1c2429"],
    "Hoffenheim": ["#1e65b2", "#f5f6f7", "#26333d"],
    "Eintracht Frankfurt": ["#d71f31", "#171b1e", "#f5f5f4"],
    "Werder Bremen": ["#148a55", "#f4f6f4", "#efcf2d"],
    "Hamburg": ["#1762ad", "#f5f6f7", "#15191d"],
    "FC Augsburg": ["#c91d32", "#178456", "#f5f5f3"],
    "SC Freiburg": ["#d71f32", "#151a1d", "#f5f5f3"],
    "RB Leipzig": ["#f5f6f6", "#d61e35", "#1d5dab"],
    "FC Ingolstadt": ["#d41f32", "#171b1e", "#f3f4f4"],
    "Darmstadt 98": ["#2463ad", "#f5f6f7", "#26333c"],
    "1. FC Köln": ["#d91f32", "#f6f6f4", "#222d36"],

    /* Serie A 2016-17 */
    "Atalanta": ["#1764ad", "#15191d", "#f5f6f6"],
    "Bologna": ["#243b72", "#a51e35", "#f2d14a"],
    "Cagliari": ["#233e79", "#b51e36", "#f5f5f3"],
    "Chievo": ["#f1d11f", "#2e66aa", "#f6f4e8"],
    "Crotone": ["#2358a2", "#c81e33", "#f5f5f4"],
    "Empoli": ["#2562ad", "#f4f6f7", "#26333c"],
    "Fiorentina": ["#5d3c96", "#f5f4f7", "#d9b62d"],
    "Genoa": ["#233c73", "#bd1f36", "#f5f5f3"],
    "Inter Milan": ["#1554a0", "#171a1e", "#d7b536"],
    "Juventus": ["#f5f5f3", "#15191c", "#d9b62f"],
    "Lazio": ["#77c4e5", "#f5f6f7", "#d6b735"],
    "Milan": ["#d41e31", "#171a1d", "#f5f5f3"],
    "Napoli": ["#46a7d8", "#f4f6f7", "#245b91"],
    "Palermo": ["#e99ab5", "#171a1e", "#f5f3f4"],
    "Pescara": ["#4a9cd0", "#f4f6f7", "#2a5d8e"],
    "Roma": ["#8e1d34", "#e79b28", "#f2d246"],
    "Sampdoria": ["#3478bb", "#f5f6f7", "#d51f35"],
    "Sassuolo": ["#179c5d", "#171b1e", "#f5f5f3"],
    "Torino": ["#781f37", "#f5f4f3", "#d5b334"],
    "Udinese": ["#f5f5f3", "#171b1e", "#d1ad2d"],

    /* Ligue 1 2016-17 */
    "Angers": ["#f5f5f3", "#171b1e", "#d2b336"],
    "Bastia": ["#1e5aa7", "#f4f6f7", "#202d37"],
    "Bordeaux": ["#20335f", "#f5f5f4", "#7cc0d9"],
    "Caen": ["#275da8", "#d12034", "#f5f5f4"],
    "Dijon": ["#d21f32", "#f4f5f4", "#242f37"],
    "Guingamp": ["#d41f31", "#171b1e", "#f4f5f4"],
    "Lille": ["#d82034", "#233d78", "#f5f5f4"],
    "Lorient": ["#ef7c22", "#171b1e", "#f5f5f3"],
    "Lyon": ["#f5f5f4", "#1f5ea7", "#d61e35"],
    "Marseille": ["#4bb5dc", "#f5f6f7", "#263640"],
    "Metz": ["#7d203a", "#f5f4f3", "#d4b338"],
    "Monaco": ["#d51f32", "#f6f6f4", "#d7b53a"],
    "Montpellier": ["#235aa5", "#ed7b22", "#f5f5f4"],
    "Nancy": ["#d72032", "#f5f5f4", "#26333d"],
    "Nantes": ["#f0cf21", "#1a9a55", "#26323a"],
    "Nice": ["#d31f31", "#171b1e", "#f5f5f4"],
    "Paris Saint-Germain": ["#1c376f", "#d51f35", "#f4f5f5"],
    "Rennes": ["#d51f32", "#171b1e", "#f5f5f4"],
    "Saint-Étienne": ["#168e50", "#f4f6f5", "#d6b438"],
    "Toulouse": ["#5d3f91", "#f4f4f6", "#d7b438"]
});

const clubIdentityCache = new Map();

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

function escapeClubIdentityXml(value){
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getClubIdentityShape(index){
    const shapes = [
        "M12 8H88V57C88 81 69 99 50 106C31 99 12 81 12 57Z",
        "M50 7C73 7 91 24 91 48C91 76 72 96 50 106C28 96 9 76 9 48C9 24 27 7 50 7Z",
        "M50 5L90 27L83 83L50 107L17 83L10 27Z",
        "M50 5L91 31L78 91L50 107L22 91L9 31Z",
        "M14 9H86V45C86 82 68 101 50 108C32 101 14 82 14 45Z"
    ];
    return shapes[index % shapes.length];
}

function buildClubIdentityPattern(patternIndex, secondary){
    const patterns = [
        `<g fill="${secondary}"><rect x="20" y="0" width="14" height="112"/><rect x="47" y="0" width="14" height="112"/><rect x="74" y="0" width="14" height="112"/></g>`,
        `<rect x="50" y="0" width="50" height="112" fill="${secondary}"/>`,
        `<path d="M-14 94L18 112L112 18L91 0Z" fill="${secondary}"/>`,
        `<g fill="${secondary}"><rect x="0" y="34" width="100" height="16"/><rect x="0" y="68" width="100" height="16"/></g>`,
        `<g fill="${secondary}"><rect x="50" y="0" width="50" height="56"/><rect x="0" y="56" width="50" height="56"/></g>`,
        `<path d="M0 33L50 58L100 33V55L50 80L0 55Z" fill="${secondary}"/>`
    ];
    return patterns[patternIndex % patterns.length];
}

function buildClubIdentityMotif(motifIndex, accent){
    const motifs = [
        `<path d="M50 27L55 39L68 40L58 48L61 61L50 54L39 61L42 48L32 40L45 39Z" fill="${accent}"/>`,
        `<g fill="${accent}"><rect x="37" y="34" width="26" height="24" rx="2"/><rect x="34" y="30" width="8" height="9"/><rect x="46" y="27" width="8" height="12"/><rect x="58" y="30" width="8" height="9"/></g>`,
        `<path d="M29 51C38 36 44 31 50 29C56 31 62 36 71 51C61 47 56 47 50 53C44 47 39 47 29 51Z" fill="${accent}"/>`,
        `<g fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"><path d="M29 38C39 30 61 30 71 38"/><path d="M29 50C39 42 61 42 71 50"/></g>`,
        `<g fill="${accent}"><circle cx="50" cy="43" r="14"/><path d="M50 29L56 39L52 51H48L44 39Z" fill="#ffffff" fill-opacity=".9"/></g>`,
        `<path d="M29 56L41 36L50 48L59 32L72 56Z" fill="${accent}"/>`,
        `<path d="M31 48L37 34L46 42L50 29L54 42L63 34L69 48L64 58H36Z" fill="${accent}"/>`
    ];
    return motifs[motifIndex % motifs.length];
}

function buildClubIdentityCrest(clubName, identity){
    const shape = getClubIdentityShape(identity.shapeIndex);
    const pattern = buildClubIdentityPattern(identity.patternIndex, identity.secondary);
    const motif = buildClubIdentityMotif(identity.motifIndex, identity.accent);
    const initials = escapeClubIdentityXml(identity.initials);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112" role="img" aria-label="${escapeClubIdentityXml(clubName)} custom crest">
<defs><clipPath id="c"><path d="${shape}"/></clipPath></defs>
<path d="${shape}" fill="${identity.primary}" stroke="#f4f6f6" stroke-width="3"/>
<g clip-path="url(#c)">${pattern}<path d="M0 91L100 67V112H0Z" fill="#111820" fill-opacity=".24"/></g>
${motif}
<text x="50" y="82" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="17" font-weight="800" letter-spacing="1">${initials}</text>
<path d="M26 91H74" stroke="${identity.accent}" stroke-width="3" stroke-linecap="round"/>
</svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function getClubIdentity(clubName){
    const name = String(clubName || "").trim();
    if(clubIdentityCache.has(name)){
        return clubIdentityCache.get(name);
    }

    const hash = getClubIdentityHash(name);
    const palette = CLUB_IDENTITY_PALETTES[name]
        || CLUB_IDENTITY_FALLBACK_PALETTES[hash % CLUB_IDENTITY_FALLBACK_PALETTES.length];

    const draft = {
        initials: getClubIdentityInitials(name),
        primary: palette[0],
        secondary: palette[1],
        accent: palette[2],
        angle: `${30 + (hash % 31)}deg`,
        shapeIndex: hash % 5,
        patternIndex: (hash >>> 4) % 6,
        motifIndex: (hash >>> 9) % 7
    };

    draft.crest = buildClubIdentityCrest(name, draft);
    const identity = Object.freeze(draft);
    clubIdentityCache.set(name, identity);
    return identity;
}

function clearClubIdentity(element){
    if(!element){ return; }
    if(!element.dataset.clubIdentity && !element.dataset.clubName){ return; }

    delete element.dataset.clubIdentity;
    delete element.dataset.clubInitials;
    delete element.dataset.clubName;
    delete element.dataset.clubCrest;
    element.style.removeProperty("--club-primary");
    element.style.removeProperty("--club-secondary");
    element.style.removeProperty("--club-accent");
    element.style.removeProperty("--club-angle");
    element.style.removeProperty("--club-crest-image");
}

function applyClubIdentity(element, clubName){
    if(!element){ return; }

    const name = String(clubName || "").trim();
    if(!name || name === "?" || /not assigned/i.test(name)){
        clearClubIdentity(element);
        return;
    }

    if(element.dataset.clubIdentity === "true" && element.dataset.clubName === name){
        return;
    }

    const identity = getClubIdentity(name);
    element.dataset.clubIdentity = "true";
    element.dataset.clubName = name;
    element.dataset.clubInitials = identity.initials;
    element.dataset.clubCrest = "original";
    element.style.setProperty("--club-primary", identity.primary);
    element.style.setProperty("--club-secondary", identity.secondary);
    element.style.setProperty("--club-accent", identity.accent);
    element.style.setProperty("--club-angle", identity.angle);
    element.style.setProperty("--club-crest-image", identity.crest);
}

function refreshClubVisualIdentity(showdown = null){
    const active = showdown || (typeof currentShowdown !== "undefined" ? currentShowdown : null);
    if(!active || !active.clubs){ return; }

    const mappings = [
        [document.getElementById("clubNameOne"), active.clubs.playerOne],
        [document.getElementById("clubNameTwo"), active.clubs.playerTwo],
        [document.getElementById("clubConfirmationClubOne"), active.clubs.playerOne],
        [document.getElementById("clubConfirmationClubTwo"), active.clubs.playerTwo],
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
