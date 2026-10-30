/* =====================================================
   Career Mode Showdown
   v1.1.0
   Original Club Crest / League Mark Identity System (CREST-V1)

   Club-associated colours and one redrawn theme per club are the
   only shared cues. Crest geometry, poses and layouts are original
   hand-authored artwork. No official artwork, text or raster files.
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
    "Toulouse": ["#5d3f91", "#f4f4f6", "#d7b438"],
    /* Big Jump top 300: clubs outside the five leagues */
    "Ajax": ["#d2122e", "#f5f5f3", "#e2b84a"],
    "FC Porto": ["#1c3f94", "#f5f5f3", "#e2b84a"],
    "SL Benfica": ["#e41b23", "#f5f5f3", "#e2b84a"],
    "Sporting CP": ["#00805a", "#f5f5f3", "#e2b84a"],
    "Galatasaray SK": ["#a90432", "#fdb912", "#f5f5f3"],
    "Beşiktaş JK": ["#141414", "#f5f5f3", "#e30a17"],
    "PSV": ["#e1001a", "#f5f5f3", "#e2b84a"],
    "RSC Anderlecht": ["#4f2d7f", "#f5f5f3", "#e2b84a"],
    "Shakhtar Donetsk": ["#f26522", "#141414", "#f5f5f3"],
    "Spartak Moscow": ["#c8102e", "#f5f5f3", "#e2b84a"],
    "KRC Genk": ["#1e4fa0", "#f5f5f3", "#e2b84a"],
    "Boavista FC": ["#141414", "#f5f5f3", "#e2b84a"],
    "Moreirense FC": ["#00843d", "#f5f5f3", "#e2b84a"],
    "Rosario Central": ["#003a8c", "#fdd100", "#f5f5f3"],
    "Estudiantes de La Plata": ["#d0102b", "#f5f5f3", "#e2b84a"]
});

/* =====================================================
   CREST-V1 engine: hand-authored club crest recipes
   Every crest shares only the club's colours plus one
   theme drawn from scratch. Outline, pose, layout and text
   always differ from the real badge. No text, no raster.
===================================================== */

const CREST_SHAPES = Object.freeze({
    heater: "M12 10H108V66C108 102 85 122 60 132C35 122 12 102 12 66Z",
    roundel: "M60 15A55 55 0 1 1 59.99 15Z",
    hex: "M60 6L108 27L101 100L60 132L19 100L12 27Z",
    point: "M14 10H106L104 84L60 132L16 84Z",
    tall: "M60 6L104 19V84C104 107 83 124 60 133C37 124 16 107 16 84V19Z",
    swiss: "M14 10Q60 20 106 10V70C106 104 84 122 60 132C36 122 14 104 14 70Z",
    arsenal: "M10 10H110Q106 18 106 30V70C106 102 86 122 60 134C34 122 14 102 14 70V30Q14 18 10 10Z",
    rounded: "M18 10H102Q110 10 110 18V86C110 110 88 128 60 134C32 128 10 110 10 86V18Q10 10 18 10Z",
    arch: "M14 42C14 20 34 8 60 8C86 8 106 20 106 42V86C106 110 86 126 60 134C34 126 14 110 14 86Z",
    diamond: "M60 6L112 70L60 134L8 70Z",
    flag: "M10 24Q35 12 60 24T110 24V104Q85 92 60 104T10 104Z",
    pot: "M60 134C32 118 18 96 18 66V38C12 34 10 26 12 14C22 20 30 18 36 12C42 20 52 22 60 16C68 22 78 20 84 12C90 18 98 20 108 14C110 26 108 34 102 38V66C102 96 88 118 60 134Z",
    oval: "M60 8C88 8 106 34 106 70C106 106 88 132 60 132C32 132 14 106 14 70C14 34 32 8 60 8Z",
    bell: "M18 12H102Q110 40 106 78C104 108 86 126 60 134C34 126 16 108 14 78Q10 40 18 12Z"
});

const CREST_NAMED_COLOURS = Object.freeze({
    w: "#f5f5f3",
    k: "#15191c",
    g: "#d9b54a",
    n: "#163a70"
});

let crestInstanceSequence = 0;

function nextCrestIdPrefix(){
    crestInstanceSequence += 1;
    return `cmsc${crestInstanceSequence.toString(36)}x`;
}

function resolveCrestColour(code, palette, fallback){
    if(!code){ return fallback; }
    if(code.charAt(0) === "#"){ return code; }
    if(code === "p"){ return palette.primary; }
    if(code === "s"){ return palette.secondary; }
    if(code === "a"){ return palette.accent; }
    return CREST_NAMED_COLOURS[code] || fallback;
}

function parseCrestTokens(spec, palette){
    return String(spec || "").split(/\s+/).filter(Boolean).map(token => {
        const [head, ...colours] = token.split(":");
        const [name, place] = head.split("@");
        return {
            name,
            place: place || "",
            c1: resolveCrestColour(colours[0], palette, palette.secondary),
            c2: resolveCrestColour(colours[1], palette, palette.primary)
        };
    });
}

function crestStar(cx, cy, r, fill){
    const points = [];
    for(let index = 0; index < 10; index += 1){
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const radius = index % 2 ? r * .42 : r;
        points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
    }
    return `<polygon points="${points.join(" ")}" fill="${fill}"/>`;
}

const CREST_PATTERNS = Object.freeze({
    field: c => `<rect x="0" y="0" width="120" height="144" fill="${c}"/>`,
    stripes: c => [0, 1, 2, 3].map(i => `<rect x="${18 + i * 24}" y="0" width="12" height="144" fill="${c}"/>`).join(""),
    stripes5: c => [0, 1, 2, 3, 4].map(i => `<rect x="${4 + i * 24}" y="0" width="12" height="144" fill="${c}"/>`).join(""),
    wide: c => `<rect x="24" y="0" width="24" height="144" fill="${c}"/><rect x="72" y="0" width="24" height="144" fill="${c}"/>`,
    pins: c => Array.from({ length: 9 }, (_, i) => `<rect x="${9 + i * 12}" y="0" width="5" height="144" fill="${c}"/>`).join(""),
    hoops: c => [0, 1, 2, 3].map(i => `<rect x="0" y="${30 + i * 26}" width="120" height="13" fill="${c}"/>`).join(""),
    stripesL: c => [0, 1, 2].map(i => `<rect x="${i * 20}" y="0" width="10" height="144" fill="${c}"/>`).join(""),
    stripesLp: c => [0, 1, 2].map(i => `<rect x="${10 + i * 20}" y="0" width="10" height="144" fill="${c}"/>`).join(""),
    canton: c => `<rect x="0" y="0" width="70" height="62" fill="${c}"/>`,
    checker: c => Array.from({ length: 12 }, (_, r) => Array.from({ length: 10 }, (_, q) => (r + q) % 2 ? `<rect x="${q * 12}" y="${r * 12}" width="12" height="12" fill="${c}"/>` : "").join("")).join(""),
    diamonds: c => Array.from({ length: 11 }, (_, r) => Array.from({ length: 8 }, (_, q) => `<path d="M${q * 16 + (r % 2) * 8} ${12 + r * 12}l8 -6 8 6 -8 6z" fill="${c}"/>`).join("")).join(""),
    /* CREST-V3 public heraldry and real layouts (no lettering). */
    barca: (c, c2) => `<rect x="0" y="0" width="60" height="62" fill="#f5f5f3"/><path d="M26 0H34V62H26ZM0 27H60V35H0Z" fill="#d22630"/>`
        + `<rect x="60" y="0" width="60" height="62" fill="#f2c200"/>${[0, 1, 2, 3].map(i => `<rect x="${66 + i * 12}" y="0" width="6" height="62" fill="#d22630"/>`).join("")}`
        + `<rect x="0" y="62" width="120" height="12" fill="#f5f5f3"/><rect x="0" y="74" width="120" height="70" fill="${c2}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 24}" y="74" width="12" height="70" fill="${c}"/>`).join("")}`
        + `<path d="M0 62H120M0 74H120M60 0V62" stroke="#e2b84a" stroke-width="1.6"/>`,
    milanSplit: (c, c2) => `<rect x="0" y="0" width="60" height="144" fill="${c2}"/>${[0, 1, 2].map(i => `<rect x="${i * 20}" y="0" width="10" height="144" fill="${c}"/>`).join("")}<rect x="60" y="0" width="60" height="144" fill="#f5f5f3"/><path d="M84 28V112M62 66H106" stroke="#d22630" stroke-width="11"/><path d="M60 0V144" stroke="#e2b84a" stroke-width="1.4"/>`,
    bavaria: (c, c2) => `<rect x="0" y="0" width="120" height="144" fill="${c2}"/><g transform="rotate(-32 60 70)">${Array.from({ length: 14 }, (_, r) => Array.from({ length: 12 }, (_, q) => `<path d="M${-30 + q * 16 + (r % 2) * 8} ${-10 + r * 12}l8 -6 8 6 -8 6z" fill="${c}"/>`).join("")).join("")}</g>`,
    cantonBig: c => `<rect x="0" y="0" width="66" height="66" fill="${c}"/><path d="M66 0V66H0" stroke="#e2b84a" stroke-width="1.4" fill="none"/>`,
    juveTop: (c, c2) => `<rect x="0" y="0" width="120" height="44" fill="#f5f5f3"/><path d="M14 44H106V54H96V49H86V54H76V49H66V54H54V49H44V54H34V49H24V54H14Z" fill="#e2b84a"/><path d="M0 44H120" stroke="#9a7022" stroke-width="1"/>`,
    arsenalBase: c => `<path d="M0 108Q60 100 120 108V144H0Z" fill="${c}"/><path d="M0 108Q60 100 120 108" stroke="#e2b84a" stroke-width="1.8" fill="none"/><path d="M0 30H120" stroke="#e2b84a" stroke-width="1.8"/>`,
    sashGold: c => `<path d="M-10 34L130 118V140L-10 56Z" fill="${c}"/><path d="M-10 34L130 118M-10 56L130 140" stroke="#e2b84a" stroke-width="1.4"/>`,
    quartersSun: (c, c2) => `<rect x="0" y="0" width="60" height="70" fill="${c2}"/>${[0, 1, 2].map(i => `<rect x="${4 + i * 20}" y="0" width="10" height="70" fill="${c}"/>`).join("")}<rect x="0" y="70" width="120" height="74" fill="#1d4f9e"/><path d="M0 70H120M60 0V70" stroke="#e2b84a" stroke-width="1.4"/>`,
    southampton: (c, c2) => `<rect x="0" y="66" width="120" height="78" fill="${c2}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 24}" y="66" width="12" height="78" fill="${c}"/>`).join("")}<path d="M0 66H120" stroke="#e2b84a" stroke-width="1.4"/><path d="M0 112Q15 104 30 112T60 112T90 112T120 112V144H0Z" fill="#2a5ba8"/>`,
    wbaSplit: (c, c2) => `<rect x="0" y="0" width="120" height="66" fill="#f5f6f7"/><rect x="0" y="66" width="120" height="78" fill="${c2}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 24}" y="66" width="12" height="78" fill="${c}"/>`).join("")}<path d="M0 66H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    manuShield: (c, c2) => `<rect x="0" y="0" width="120" height="144" fill="#f5f5f3"/><path d="M28 62H92V96C92 112 76 122 60 128C44 122 28 112 28 96Z" fill="${c}" stroke="#e2b84a" stroke-width="2"/>`,
    sideBand: c => `<path d="M0 0H120V144H0ZM20 18H100V70C100 100 82 116 60 124C38 116 20 100 20 70Z" fill="${c}" fill-rule="evenodd"/>`,
    stripesHalf: (c, c2) => `<rect x="0" y="0" width="60" height="144" fill="${c2}"/>${[0, 1, 2].map(i => `<rect x="${i * 20}" y="0" width="10" height="144" fill="${c}"/>`).join("")}<path d="M60 0V144" stroke="#e2b84a" stroke-width="1.4"/>`,
    athletic: (c, c2) => `<rect x="0" y="0" width="60" height="144" fill="${c2}"/>${[0, 1, 2].map(i => `<rect x="${4 + i * 20}" y="0" width="10" height="144" fill="${c}"/>`).join("")}<rect x="60" y="0" width="60" height="70" fill="#f5f5f3"/><rect x="60" y="70" width="60" height="74" fill="${c}"/><path d="M60 0V144M60 70H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    hoopsTop: (c, c2) => `<rect x="0" y="0" width="120" height="66" fill="${c2}"/>${[0, 1, 2, 3].map(i => `<rect x="0" y="${8 + i * 16}" width="120" height="8" fill="${c}"/>`).join("")}<path d="M0 66H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    senyeraHalf: c => `<rect x="0" y="0" width="60" height="144" fill="#f2c200"/>${[0, 1, 2, 3].map(i => `<rect x="${4 + i * 14}" y="0" width="7" height="144" fill="#d22630"/>`).join("")}<path d="M60 0V144" stroke="#e2b84a" stroke-width="1.4"/>`,
    sevilla: (c, c2) => `<rect x="0" y="72" width="120" height="72" fill="${c2}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${6 + i * 24}" y="72" width="12" height="72" fill="${c}"/>`).join("")}<path d="M0 72H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    blueTop: c => `<rect x="0" y="0" width="120" height="40" fill="${c}"/><path d="M0 40H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    rhombInner: (c, c2) => `<path d="M60 26L96 70L60 114L24 70Z" fill="${c}"/><path d="M60 26L96 70L60 114L24 70Z" fill="none" stroke="#e2b84a" stroke-width="1.6"/>${c2 ? `<path d="M60 46L80 70L60 94L40 70Z" fill="${c2}"/>` : ""}`,
    splitH: (c, c2) => `<rect x="0" y="0" width="120" height="66" fill="${c}"/><rect x="0" y="66" width="120" height="78" fill="${c2}"/><path d="M0 66H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    hoopsFlag: c => [0, 1, 2].map(i => `<rect x="0" y="${30 + i * 24}" width="120" height="12" fill="${c}"/>`).join(""),
    redChief: c => `<rect x="0" y="0" width="120" height="40" fill="${c}"/><path d="M0 40H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    stGeorge: c => `<path d="M53 0H67V144H53ZM0 58H120V72H0Z" fill="${c}"/>`,
    discTop: c => `<circle cx="60" cy="38" r="20" fill="${c}"/><circle cx="60" cy="38" r="20" fill="none" stroke="#e2b84a" stroke-width="2"/><circle cx="60" cy="38" r="14" fill="none" stroke="#e2b84a" stroke-width="1"/>`,
    bologna: (c, c2) => `<rect x="0" y="0" width="120" height="36" fill="#f5f5f3"/><rect x="0" y="36" width="60" height="108" fill="#f5f5f3"/><path d="M25 36H35V144H25ZM0 70H60V80H0Z" fill="#d22630"/><rect x="60" y="36" width="60" height="108" fill="${c}"/>${[0, 1, 2].map(i => `<rect x="${70 + i * 20}" y="36" width="10" height="108" fill="${c2}"/>`).join("")}<path d="M0 36H120M60 36V144" stroke="#e2b84a" stroke-width="1.4"/>`,
    innerShield: c => `<path d="M30 30H90V74C90 98 76 110 60 118C44 110 30 98 30 74Z" fill="${c}" stroke="#e2b84a" stroke-width="2"/>`,
    sampBand: c => `<rect x="0" y="52" width="120" height="36" fill="#f5f5f3"/><rect x="0" y="62" width="120" height="8" fill="#d22630"/><rect x="0" y="70" width="120" height="8" fill="#15191c"/>`,
    topHalf: c => `<rect x="0" y="0" width="120" height="74" fill="${c}"/><path d="M0 74H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    scapular: c => `<path d="M14 0L60 96L106 0H120V12L60 128L0 12V0Z" fill="${c}"/>`,
    redTop: c => `<rect x="0" y="0" width="120" height="44" fill="${c}"/><path d="M0 44H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    lyon: (c, c2) => `<rect x="0" y="86" width="120" height="58" fill="${c}"/><rect x="0" y="80" width="120" height="8" fill="${c2}"/><path d="M0 80H120" stroke="#e2b84a" stroke-width="1.4"/>`,
    halves: c => `<rect x="60" y="0" width="60" height="144" fill="${c}"/>`,
    halvesL: c => `<rect x="0" y="0" width="60" height="144" fill="${c}"/>`,
    sash: c => `<path d="M-10 118L130 34V56L-10 140Z" fill="${c}"/>`,
    sashR: c => `<path d="M-10 34L130 118V140L-10 56Z" fill="${c}"/>`,
    diag: c => `<path d="M0 144L120 0V144Z" fill="${c}"/>`,
    chevron: c => `<path d="M0 24L60 74L120 24V48L60 98L0 48Z" fill="${c}"/>`,
    band: c => `<rect x="0" y="60" width="120" height="22" fill="${c}"/>`,
    top: c => `<rect x="0" y="0" width="120" height="34" fill="${c}"/>`,
    cap: c => `<rect x="0" y="0" width="120" height="16" fill="${c}"/>`,
    base: c => `<path d="M0 104L60 124L120 104V144H0Z" fill="${c}"/>`,
    foot: c => `<rect x="0" y="100" width="120" height="44" fill="${c}"/>`,
    rule: c => `<rect x="0" y="96" width="120" height="6" fill="${c}"/>`,
    pale: c => `<rect x="44" y="0" width="32" height="144" fill="${c}"/>`,
    paleEdge: (c, c2) => `<rect x="42" y="0" width="36" height="144" fill="${c2}"/><rect x="47" y="0" width="26" height="144" fill="${c}"/>`,
    claws: c => [0, 1, 2, 3, 4].map(i => `<path d="M${-6 + i * 28} 0L${10 + i * 28} 0L${-14 + i * 28} 144L${-26 + i * 28} 144Z" fill="${c}"/>`).join(""),
    catalan: (c, c2) => `<rect x="0" y="0" width="120" height="46" fill="#f2c200"/>${[0, 1, 2, 3].map(i => `<rect x="0" y="${6 + i * 10}" width="120" height="5" fill="#c8102e"/>`).join("")}<rect x="0" y="46" width="120" height="5" fill="${c}"/>`,
    lozenge: (c, c2, idp) => {
        const frame = "M26 22H94V66C94 94 76 110 60 117C44 110 26 94 26 66Z";
        const cells = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, q) => `<path d="M${14 + q * 14 + (r % 2) * 7} ${22 + r * 12}l7 -6 7 6 -7 6z" fill="${c}"/>`).join("")).join("");
        return `<clipPath id="${idp}lz"><path d="${frame}"/></clipPath><g clip-path="url(#${idp}lz)"><rect x="0" y="0" width="120" height="144" fill="${c2}"/>${cells}</g><path d="${frame}" fill="none" stroke="#f3d470" stroke-width="2"/>`;
    }
});

function crestCanineHead(c, d, earTip, snout){
    return `<path d="M36 ${earTip}L48 46H72L84 ${earTip}L86 62L78 84L60 ${snout}L42 84L34 62Z" fill="${c}"/><path d="M47 62L55 65L47 67ZM73 62L65 65L73 67Z" fill="${d}"/><path d="M55 ${snout - 12}H65L60 ${snout - 6}Z" fill="${d}"/>`;
}

const CREST_MOTIFS = Object.freeze({
    cannon: c => `<path d="M26 62L90 54Q98 53 98 61V69Q98 77 90 76L26 72Z" fill="${c}"/><rect x="20" y="59" width="9" height="16" rx="2" fill="${c}"/><circle cx="84" cy="86" r="13" fill="none" stroke="${c}" stroke-width="5"/><path d="M84 73V99M71 86H97M75 77L93 95M93 77L75 95" stroke="${c}" stroke-width="3"/><circle cx="84" cy="86" r="3.5" fill="${c}"/>`,
    trident: c => `<g fill="${c}"><rect x="56.5" y="52" width="7" height="68" rx="2"/><path d="M60 18L66 44H54Z"/><path d="M36 30L42 58Q60 66 78 58L84 30L76 50Q60 56 44 50Z"/><rect x="48" y="60" width="24" height="6" rx="2"/></g>`,
    bird: c => `<path d="M16 58Q38 34 58 56Q60 50 62 56Q82 34 104 58Q84 50 68 64L64 70L72 90H60L58 74Q52 62 48 64Q34 52 16 58Z" fill="${c}"/><circle cx="60" cy="50" r="5" fill="${c}"/><path d="M63 49L72 51L63 53Z" fill="${c}"/>`,
    lion: (c, d) => `<path d="M64 28Q44 24 34 38L22 36L28 48L14 52L26 60L12 68L26 74L16 86L32 86L26 100L42 94L42 108L56 98Q66 106 76 98L70 60Z" fill="${c}"/><path d="M60 40Q80 34 90 50L101 60Q106 67 99 71H94Q97 79 88 83H80Q76 92 66 92Q52 88 50 70Q50 50 60 40Z" fill="${c}" stroke="${d}" stroke-width="3.5" stroke-linejoin="round"/><path d="M60 41Q64 31 72 37Q68 40 66 44Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="M73 55Q79 50 85 55Q79 58 73 55Z" fill="${d}"/><path d="M97 58L104 64L98 67Z" fill="${d}"/><path d="M94 72Q88 74 82 72" stroke="${d}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    crown: (c, d) => `<path d="M28 58L34 34L48 50L60 28L72 50L86 34L92 58Z" fill="${c}"/><rect x="28" y="58" width="64" height="9" rx="2" fill="${c}"/><circle cx="60" cy="62.5" r="3" fill="${d}"/><circle cx="44" cy="62.5" r="2.5" fill="${d}"/><circle cx="76" cy="62.5" r="2.5" fill="${d}"/>`,
    ball: (c, d) => {
        const pent = [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `${(60 + 7 * Math.cos(a)).toFixed(1)},${(94 + 7 * Math.sin(a)).toFixed(1)}`; }).join(" ");
        return `<circle cx="60" cy="94" r="15" fill="${c}"/><polygon points="${pent}" fill="${d}"/>`;
    },
    star: c => crestStar(60, 70, 20, c),
    stars3: c => crestStar(36, 70, 10, c) + crestStar(60, 64, 13, c) + crestStar(84, 70, 10, c),
    warriorHead: (c, d) => `<path d="M72 34Q52 30 44 44L40 58L32 66L40 70L38 78Q40 86 50 86L50 98H78Q76 84 82 74Q90 58 84 46Q80 38 72 34Z" fill="${c}"/><path d="M44 44Q50 26 74 28Q92 32 90 52L84 46Q78 36 64 38Q52 40 48 50Z" fill="${c}"/><path d="M58 40Q66 30 78 34M56 48Q66 38 82 44M56 56Q66 48 84 54M60 64Q70 58 84 64M62 72Q70 68 82 74" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/><circle cx="48" cy="60" r="2.2" fill="${d}"/>`,
    dragon: (c, d) => `<path d="M58 62L66 26L74 42L82 24L88 42L100 30L98 56Q88 50 80 60Q72 52 64 64Z" fill="${c}"/><path d="M30 46L42 40L48 44L56 46Q52 52 52 60Q54 72 64 78Q78 84 88 76Q96 70 92 62L100 58Q106 72 98 84Q86 98 66 94Q46 90 42 72Q40 60 44 54L36 56L38 50Z" fill="${c}"/><path d="M98 84Q106 92 100 102L108 100L104 108Q96 108 94 100Q96 92 92 88Z" fill="${c}"/><path d="M52 84L48 98L54 96L58 88ZM74 92L74 104L80 102L80 92Z" fill="${c}"/><circle cx="44" cy="45" r="1.8" fill="${d}"/><path d="M30 46L24 42L26 48Z" fill="${c}"/>`,
    crescentStar: c => `<path d="M58 46A24 24 0 1 0 58 94A19 19 0 1 1 58 46Z" fill="${c}"/>${crestStar(72, 70, 9, c)}`,
    crescentStarChief: (c, d) => `<circle cx="55" cy="22" r="9" fill="${c}"/><circle cx="58" cy="22" r="7.4" fill="${d}"/>${crestStar(64.5, 22, 4.4, c)}`,
    eagle: c => `<path d="M60 44L66 52L104 40L96 54L108 56L92 66L100 72L78 74L70 96L60 104L50 96L42 74L20 72L28 66L12 56L24 54L16 40L54 52Z" fill="${c}"/><circle cx="60" cy="46" r="7" fill="${c}"/><path d="M53 45L44 49L53 50Z" fill="${c}"/>`,
    eagleR: c => `<g transform="translate(120 0) scale(-1 1)"><path d="M60 44L66 52L104 40L96 54L108 56L92 66L100 72L78 74L70 96L60 104L50 96L42 74L20 72L28 66L12 56L24 54L16 40L54 52Z" fill="${c}"/><circle cx="60" cy="46" r="7" fill="${c}"/><path d="M53 45L44 49L53 50Z" fill="${c}"/></g>`,
    tower: (c, d) => `<path d="M46 102V48H42V36H50V42H56V36H64V42H70V36H78V48H74V102Z" fill="${c}"/><path d="M56 102V86Q60 80 64 86V102Z" fill="${d}"/><rect x="57" y="56" width="6" height="12" rx="3" fill="${d}"/>`,
    castle: (c, d) => `<path d="M28 100V60H24V48H32V54H38V48H46V60H50V44H46V34H54V40H58V34H62V40H66V34H74V44H70V60H74V48H82V54H88V48H96V60H92V100Z" fill="${c}"/><path d="M52 100V82Q60 72 68 82V100Z" fill="${d}"/>`,
    wolf: (c, d) => crestCanineHead(c, d, 28, 104),
    fox: (c, d) => `<path d="M30 34L50 52H70L90 34L86 64L60 104L34 64Z" fill="${c}"/><path d="M40 70L60 104L80 70L60 80Z" fill="#f5f5f3"/><path d="M47 62L55 65L47 67ZM73 62L65 65L73 67Z" fill="${d}"/><circle cx="60" cy="101" r="3" fill="${d}"/>`,
    dog: (c, d) => crestCanineHead(c, d, 44, 100) + `<path d="M34 44L30 66L40 60ZM86 44L90 66L80 60Z" fill="${d}" fill-opacity=".35"/>`,
    cat: (c, d) => `<path d="M36 38L50 54H70L84 38L86 74Q82 96 60 100Q38 96 34 74Z" fill="${c}"/><path d="M46 66Q52 60 56 68Q52 72 46 66ZM74 66Q68 60 64 68Q68 72 74 66Z" fill="${d}"/><path d="M56 80H64L60 85Z" fill="${d}"/><path d="M38 84H52M38 90L52 87M82 84H68M82 90L68 87" stroke="${d}" stroke-width="1.6"/>`,
    bear: (c, d) => `<circle cx="42" cy="46" r="10" fill="${c}"/><circle cx="78" cy="46" r="10" fill="${c}"/><circle cx="60" cy="70" r="28" fill="${c}"/><ellipse cx="60" cy="82" rx="12" ry="9" fill="${d}" fill-opacity=".45"/><circle cx="50" cy="64" r="3.2" fill="${d}"/><circle cx="70" cy="64" r="3.2" fill="${d}"/><ellipse cx="60" cy="78" rx="5" ry="3.5" fill="${d}"/>`,
    bee: (c, d) => `<ellipse cx="44" cy="54" rx="16" ry="9" fill="#f5f5f3" fill-opacity=".85" transform="rotate(-30 44 54)"/><ellipse cx="76" cy="54" rx="16" ry="9" fill="#f5f5f3" fill-opacity=".85" transform="rotate(30 76 54)"/><ellipse cx="60" cy="76" rx="15" ry="22" fill="${c}"/><path d="M46 70H74V76H46ZM47 84H73V90H47Z" fill="${d}"/><circle cx="60" cy="52" r="8" fill="${d}"/>`,
    cherries: (c, d) => `<path d="M46 86Q50 60 66 42M74 88Q70 64 66 42" fill="none" stroke="${d}" stroke-width="3.5" stroke-linecap="round"/><path d="M66 42Q80 34 88 44Q78 50 66 42Z" fill="${d}"/><circle cx="44" cy="92" r="13" fill="${c}"/><circle cx="76" cy="94" r="13" fill="${c}"/><circle cx="40" cy="88" r="3.5" fill="#fff" fill-opacity=".55"/><circle cx="72" cy="90" r="3.5" fill="#fff" fill-opacity=".55"/>`,
    ship: (c, d) => `<path d="M58 30V88H30ZM64 38V88H90Z" fill="${c}"/><path d="M24 92H96L86 108H34Z" fill="${d}"/><path d="M20 116Q30 110 40 116T60 116T80 116T100 116" fill="none" stroke="${c}" stroke-width="3"/>`,
    halo: (c, d) => `<ellipse cx="60" cy="44" rx="24" ry="8" fill="none" stroke="${c}" stroke-width="5"/>${crestStar(60, 82, 18, c)}`,
    knot: c => `<g fill="none" stroke="${c}" stroke-width="6"><circle cx="60" cy="58" r="15"/><circle cx="46" cy="82" r="15"/><circle cx="74" cy="82" r="15"/></g>`,
    swan: c => `<path d="M76 40Q64 36 64 50Q64 62 72 72Q76 80 68 86H36Q30 86 26 78Q40 84 52 78Q44 70 36 70Q52 62 62 74Q56 60 58 48Q60 32 76 36L86 40Z" fill="${c}"/><path d="M82 38L92 42L82 43Z" fill="#e1343f"/><path d="M24 98Q42 92 60 98T96 98" fill="none" stroke="${c}" stroke-width="3"/>`,
    cockerel: (c, d) => `<path d="M48 44Q50 32 58 38Q60 28 68 36Q74 30 76 42L78 58Q86 62 80 68L76 70L78 88Q70 104 52 104Q56 92 50 80Q42 70 48 56Z" fill="${c}"/><path d="M80 58L94 62L80 66Z" fill="#e8b92e"/><path d="M50 40Q56 30 60 38Q64 28 70 36Q76 30 76 44Q64 40 50 40Z" fill="#e1343f"/><circle cx="70" cy="54" r="3" fill="${d}"/>`,
    antlers: c => `<g fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"><path d="M54 104Q52 76 38 60Q30 50 32 32M42 66Q28 64 22 52M36 48Q44 42 44 32M66 104Q68 76 82 60Q90 50 88 32M78 66Q92 64 98 52M84 48Q76 42 76 32"/></g>`,
    hammers: c => { const h = `<rect x="-3.5" y="-2" width="7" height="46" rx="2.5" fill="${c}"/><path d="M-16 -14H12Q18 -14 18 -8V2Q18 6 14 6H-16Q-19 6 -19 2V-10Q-19 -14 -16 -14Z" fill="${c}"/>`; return `<g transform="translate(38 58) rotate(-14)">${h}</g><g transform="translate(82 58) rotate(14) scale(-1 1)">${h}</g>`; },
    tree: (c, d) => `<circle cx="60" cy="54" r="22" fill="${c}"/><circle cx="42" cy="66" r="15" fill="${c}"/><circle cx="78" cy="66" r="15" fill="${c}"/><path d="M55 76H65L67 106H53Z" fill="${d}"/>`,
    pine: (c, d) => `<path d="M60 26L80 56H70L88 82H72L94 106H26L48 82H32L50 56H40Z" fill="${c}"/><rect x="56" y="106" width="8" height="12" fill="${d}"/>`,
    eiffel: c => `<path d="M57 24H63L65 52H70L76 98H84V106H70Q60 86 50 106H36V98H44L50 52H55Z" fill="${c}"/><rect x="47" y="72" width="26" height="4" fill="${c}"/>`,
    cross: c => `<path d="M53 30H67V58H90V72H67V112H53V72H30V58H53Z" fill="${c}"/>`,
    lorraine: c => `<path d="M56 28H64V44H76V52H64V62H82V70H64V112H56V70H38V62H56V52H44V44H56Z" fill="${c}"/>`,
    occitan: c => `<path d="M54 26H66V56L94 64V76L66 84V114H54V84L26 76V64L54 56Z" fill="${c}"/>${[[60, 22], [60, 118], [22, 70], [98, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/>`).join("")}`,
    palm: (c, d) => `<path d="M58 60Q56 90 50 112H62Q66 90 64 60Z" fill="${d}"/><path d="M61 58Q40 36 20 48Q42 42 58 62ZM61 58Q80 36 100 48Q78 42 64 62ZM61 58Q52 32 36 30Q56 38 60 60ZM61 58Q70 32 86 30Q66 38 62 60ZM61 58Q40 56 28 70Q46 58 60 62ZM61 58Q82 56 94 70Q76 58 62 62Z" fill="${c}"/>`,
    bat: c => `<g transform="rotate(-14 60 70)"><path d="M60 58L56 50L58 60Q46 54 14 60Q26 68 24 78Q32 72 38 80Q44 72 50 80Q54 72 60 76Q66 72 70 80Q76 72 82 80Q88 72 96 78Q94 68 106 60Q74 54 62 60L64 50Z" fill="${c}"/></g>`,
    submarine: (c, d) => `<rect x="22" y="70" width="76" height="24" rx="12" fill="${c}"/><path d="M50 70V56H70L72 70Z" fill="${c}"/><path d="M60 56V44H66" fill="none" stroke="${c}" stroke-width="3"/>${[38, 60, 82].map(x => `<circle cx="${x}" cy="82" r="4" fill="${d}"/>`).join("")}<path d="M98 82L108 72V92Z" fill="${c}"/>`,
    pomegranate: (c, d) => `<circle cx="60" cy="78" r="26" fill="${c}"/><path d="M50 54L54 44L60 52L66 44L70 54Z" fill="${c}"/><path d="M50 78Q60 62 70 78Q60 96 50 78Z" fill="${d}"/>${[[56, 76], [64, 76], [60, 84], [60, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${c}"/>`).join("")}`,
    cucumber: (c, d) => `<rect x="24" y="60" width="72" height="22" rx="11" fill="${c}" transform="rotate(-24 60 71)"/>${[[42, 78], [56, 72], [70, 66], [50, 66], [64, 60], [78, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${d}"/>`).join("")}`,
    chain: c => `<g fill="none" stroke="${c}" stroke-width="5">${[0, 1, 2].map(i => `<ellipse cx="${34 + i * 26}" cy="${70 + (i % 2 ? 0 : 0)}" rx="15" ry="9"/>`).join("")}<ellipse cx="60" cy="46" rx="9" ry="14"/><ellipse cx="60" cy="94" rx="9" ry="14"/></g>`,
    waves: c => `<g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round">${[52, 72, 92].map(y => `<path d="M22 ${y}Q31 ${y - 10} 41 ${y}T60 ${y}T79 ${y}T98 ${y}"/>`).join("")}</g>`,
    cog: (c, d) => `<g fill="${c}">${Array.from({ length: 10 }, (_, i) => `<rect x="55" y="36" width="10" height="14" transform="rotate(${i * 36} 60 72)"/>`).join("")}<circle cx="60" cy="72" r="26"/></g><circle cx="60" cy="72" r="11" fill="${d}"/>`,
    wheel: c => `<g fill="none" stroke="${c}" stroke-width="5"><circle cx="60" cy="70" r="30"/><circle cx="60" cy="70" r="7"/>${Array.from({ length: 8 }, (_, i) => `<path d="M60 70L${(60 + 30 * Math.cos(i * Math.PI / 4)).toFixed(1)} ${(70 + 30 * Math.sin(i * Math.PI / 4)).toFixed(1)}"/>`).join("")}</g>`,
    horse: (c, d) => `<path d="M44 106L46 80Q38 70 42 58Q44 44 56 38L60 26L66 36Q84 42 90 62L92 74Q88 82 80 78L70 70Q68 90 74 106Z" fill="${c}"/><circle cx="68" cy="50" r="3" fill="${d}"/><path d="M52 40Q42 52 44 72" fill="none" stroke="${d}" stroke-width="3"/>`,
    picks: c => `<g stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"><path d="M36 104L84 40M84 104L36 40"/></g><path d="M66 32Q88 32 98 48Q86 42 76 44ZM54 32Q32 32 22 48Q34 42 44 44Z" fill="${c}"/>`,
    leaf: (c, d) => `<path d="M60 26Q96 50 60 112Q24 50 60 26Z" fill="${c}"/><path d="M60 36V104M60 58L46 48M60 58L74 48M60 76L44 64M60 76L76 64" stroke="${d}" stroke-width="2.5" fill="none"/>`,
    key: c => `<g fill="${c}"><circle cx="60" cy="42" r="15"/><rect x="55" y="54" width="10" height="56"/><rect x="65" y="90" width="16" height="8"/><rect x="65" y="100" width="12" height="8"/></g><circle cx="60" cy="42" r="6" fill="#15191c" fill-opacity=".55"/>`,
    rhombuses: (c, d) => [30, 60, 90].map((x, i) => `<path d="M${x} 52L${x + 13} 70L${x} 88L${x - 13} 70Z" fill="${i === 1 ? c : d}"/>`).join(""),
    pinecone: (c, d) => `<path d="M60 30Q84 60 74 98Q60 112 46 98Q36 60 60 30Z" fill="${c}"/>${[56, 68, 80, 92].map(y => `<path d="M${46 + (y - 56) / 6} ${y}Q60 ${y + 8} ${74 - (y - 56) / 6} ${y}" fill="none" stroke="${d}" stroke-width="2.5"/>`).join("")}<rect x="57" y="100" width="6" height="14" fill="${c}"/>`,
    lily: c => `<g fill="${c}"><path d="M60 26Q74 44 66 66H54Q46 44 60 26Z"/><path d="M52 68Q30 70 30 50Q38 60 52 60Z"/><path d="M68 68Q90 70 90 50Q82 60 68 60Z"/><rect x="40" y="68" width="40" height="7" rx="2"/><path d="M56 75H64L66 104Q60 96 54 104Z"/><path d="M52 76Q40 90 44 104Q50 92 56 82ZM68 76Q80 90 76 104Q70 92 64 82Z"/></g>`,
    goat: (c, d) => `<path d="M46 50Q30 30 44 22Q38 36 52 48ZM74 50Q90 30 76 22Q82 36 68 48Z" fill="${c}"/><path d="M44 50H76L80 64L70 94L60 104L50 94L40 64Z" fill="${c}"/><path d="M54 98L60 116L66 98Z" fill="${c}"/><path d="M48 64L55 66L48 68ZM72 64L65 66L72 68Z" fill="${d}"/><path d="M36 58L44 56L42 62ZM84 58L76 56L78 62Z" fill="${c}"/>`,
    ladder: c => `<g fill="${c}"><rect x="40" y="30" width="7" height="80"/><rect x="73" y="30" width="7" height="80"/>${[40, 56, 72, 88].map(y => `<rect x="47" y="${y}" width="26" height="6"/>`).join("")}</g>`,
    column: c => `<g fill="${c}"><rect x="38" y="32" width="44" height="8"/><path d="M42 40H78L74 46H46Z"/>${[48, 56, 64, 72].map(x => `<rect x="${x - 2}" y="46" width="4" height="54"/>`).join("")}<rect x="44" y="100" width="32" height="6"/><rect x="38" y="106" width="44" height="7"/></g>`,
    snake: (c, d) => `<path d="M72 36Q88 36 86 50Q84 62 64 64Q40 66 38 80Q36 96 62 96Q76 96 82 104Q70 112 56 110Q28 106 28 82Q28 56 60 54Q76 52 74 46Q72 42 66 44L60 40Q64 34 72 36Z" fill="${c}"/><circle cx="76" cy="42" r="2.5" fill="${d}"/><path d="M60 41L50 38M60 41L50 44" stroke="#e1343f" stroke-width="1.8"/>`,
    volcano: (c, d) => `<path d="M16 110L48 56H72L104 110Z" fill="${c}"/><path d="M48 56Q60 64 72 56L66 70L60 64L54 72Z" fill="${d}"/><path d="M52 50Q46 36 56 28Q54 38 62 36Q72 30 70 20Q82 34 70 48Z" fill="${d}" fill-opacity=".7"/>`,
    dolphin: c => `<path d="M26 92Q30 50 66 44L72 34L76 46Q96 54 98 74L88 70Q84 80 90 90Q78 82 80 70Q66 58 48 70Q38 78 40 96L34 90Z" fill="${c}"/>`,
    anchor: c => `<g fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"><circle cx="60" cy="36" r="8"/><path d="M60 44V108M42 58H78M28 82Q34 108 60 108Q86 108 92 82"/></g><path d="M22 86L28 76L36 86ZM98 86L92 76L84 86Z" fill="${c}"/>`,
    bull: (c, d) => `<path d="M42 52Q20 50 18 30Q30 42 46 42ZM78 52Q100 50 102 30Q90 42 74 42Z" fill="${c}"/><path d="M40 44H80L84 58L74 94Q60 104 46 94L36 58Z" fill="${c}"/><path d="M48 60L55 62L48 64ZM72 60L65 62L72 64Z" fill="${d}"/><ellipse cx="60" cy="88" rx="11" ry="7" fill="${d}" fill-opacity=".45"/>`,
    owl: (c, d) => `<path d="M38 36L48 46Q60 40 72 46L82 36L84 60Q90 96 60 108Q30 96 36 60Z" fill="${c}"/><circle cx="50" cy="62" r="9" fill="#f5f5f3"/><circle cx="70" cy="62" r="9" fill="#f5f5f3"/><circle cx="50" cy="62" r="4" fill="${d}"/><circle cx="70" cy="62" r="4" fill="${d}"/><path d="M56 72H64L60 80Z" fill="#e8b92e"/>`,
    ermine: c => [[40, 52], [80, 52], [60, 76], [40, 100], [80, 100]].map(([x, y]) => `<g fill="${c}"><path d="M${x - 3} ${y}H${x + 3}L${x + 6} ${y + 16}L${x} ${y + 10}L${x - 6} ${y + 16}Z"/><circle cx="${x}" cy="${y - 5}" r="2.5"/><circle cx="${x - 5}" cy="${y - 1}" r="2.5"/><circle cx="${x + 5}" cy="${y - 1}" r="2.5"/></g>`).join(""),
    fish: (c, d) => `<path d="M26 72Q48 46 82 66L100 52V92L82 78Q48 98 26 72Z" fill="${c}"/><circle cx="40" cy="68" r="3" fill="${d}"/><path d="M52 60Q58 72 52 84" fill="none" stroke="${d}" stroke-width="2"/>`,
    thistle: (c, d) => `<path d="M42 56L46 30L53 46L60 24L67 46L74 30L78 56Z" fill="${c}"/><ellipse cx="60" cy="66" rx="17" ry="13" fill="${d}"/><path d="M47 60L73 74M73 60L47 74M60 54V78" stroke="#15191c" stroke-opacity=".25" stroke-width="2"/><rect x="57.5" y="76" width="5" height="38" fill="${d}"/><path d="M60 96Q42 84 30 94Q46 94 60 104ZM60 90Q78 78 90 88Q74 88 60 98Z" fill="${d}"/>`,
    raven: (c, d) => `<g fill="${c}"><path d="M14 62Q34 40 56 58L60 52L66 58Q88 40 108 60Q92 58 80 66Q70 72 66 78L72 96L62 90L56 98L54 78Q48 70 38 66Q26 62 14 62Z"/><path d="M60 52Q58 44 64 42L72 44L64 48Z"/></g><circle cx="64" cy="46" r="1.6" fill="${d}"/>`,
    anvil: c => `<g fill="${c}"><path d="M20 52H92Q102 52 106 44Q108 60 92 64H84Q80 72 76 76H86V88H34V76H44Q40 72 36 64H26Q18 60 20 52Z"/><rect x="30" y="92" width="60" height="10" rx="2"/></g><path d="M20 52H92" stroke="#fff4c4" stroke-width="2" opacity=".6"/>`,
    olive: (c, d) => { const L = [[46, 96, -40], [54, 84, -35], [62, 72, -30], [70, 60, -25], [78, 48, -20]]; let s = `<path d="M38 112Q60 80 84 34" fill="none" stroke="#6b4a1e" stroke-width="4" stroke-linecap="round"/>`; L.forEach(([x, y, a]) => { s += `<ellipse cx="${x - 10}" cy="${y + 2}" rx="11" ry="4.6" fill="${c}" stroke="${d}" stroke-width="1.2" transform="rotate(${a + 10} ${x - 10} ${y + 2})"/><ellipse cx="${x + 9}" cy="${y + 4}" rx="11" ry="4.6" fill="${c}" stroke="${d}" stroke-width="1.2" transform="rotate(${a - 30} ${x + 9} ${y + 4})"/>`; }); return s + `<circle cx="58" cy="94" r="5" fill="${d}"/><circle cx="72" cy="70" r="4.5" fill="${d}"/>`; },
    linden: (c, d) => `<path d="M60 26Q70 40 84 46Q98 54 94 72Q90 90 72 94Q64 94 60 88Q56 94 48 94Q30 90 26 72Q22 54 36 46Q50 40 60 26Z" fill="${c}"/><path d="M60 84V40M60 70L40 58M60 70L80 58M60 56L46 48M60 56L74 48" stroke="${d}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 88V112" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
    apple: c => `<g fill="${c}" transform="translate(60 76) scale(.76) translate(-60 -76)"><path d="M60 58Q72 50 81 59Q88 70 82 86Q76 100 65 98Q62 97 60 98Q58 97 55 98Q44 100 38 86Q32 70 39 59Q48 50 60 58Z"/><path d="M59 58Q59 50 62 46L64 47Q61 51 61 58Z"/><path d="M63 50Q71 41 79 45Q71 53 63 50Z"/></g>`,
    flask: c => `<path d="M55 38H65V56Q80 62 80 76Q80 90 60 90Q40 90 40 76Q40 62 55 56Z" fill="${c}"/><rect x="52" y="34" width="16" height="5" rx="2" fill="${c}"/>`,
    tile: (c, d) => `<g transform="rotate(45 60 70)"><rect x="44" y="54" width="32" height="32" rx="2" fill="${c}"/><rect x="53" y="63" width="14" height="14" fill="${d}"/></g>`,
    sun: c => { let s = `<g fill="${c}">`; for(let i = 0; i < 8; i += 1){ s += `<rect x="57.5" y="38" width="5" height="10" rx="2" transform="rotate(${i * 45} 60 70)"/>`; } return s + `<circle cx="60" cy="70" r="14"/></g>`; },
    /* CREST-V3 hand-drawn emblems: same subjects as the real crests, drawn fresh. */
    cannonR: (c, d) => `<g transform="rotate(-5 60 66)"><path d="M26 56Q24 62 26 70L86 66Q92 66 92 64V58Q92 56 86 56Z" fill="${c}"/><path d="M86 54H98Q101 54 101 57V65Q101 68 98 68H86Z" fill="${c}"/><circle cx="20" cy="63" r="5.5" fill="${c}"/><rect x="22" y="60.5" width="6" height="5" fill="${c}"/>`
        + `<path d="M40 56.6V68.6M58 56.4V67.6M74 56.2V66.8" stroke="${d}" stroke-opacity=".45" stroke-width="2"/><path d="M28 59Q56 57 90 57.6" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" fill="none"/></g>`
        + `<path d="M30 70L66 67L70 76L60 86H38Z" fill="${c}"/><circle cx="44" cy="88" r="15" fill="none" stroke="${c}" stroke-width="4.5"/><circle cx="44" cy="88" r="4.5" fill="${c}"/>`
        + `<g stroke="${c}" stroke-width="2.6">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${(44 + 4 * Math.cos(a)).toFixed(1)} ${(88 + 4 * Math.sin(a)).toFixed(1)}L${(44 + 13 * Math.cos(a)).toFixed(1)} ${(88 + 13 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}</g><path d="M24 104H94" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    lionRampant: (c, d) => `<g fill="${c}" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">`
        + `<path d="M84 96Q98 80 92 60Q90 50 96 44" fill="none" stroke-width="4"/><path d="M96 44L104 40L100 48L106 50L97 52Z" stroke-width="1"/>`
        + `<ellipse cx="66" cy="76" rx="14" ry="25" transform="rotate(-18 66 76)" stroke="none"/>`
        + `<path d="M60 58L46 54L36 44M62 66L46 68L36 62" fill="none" stroke-width="7"/><path d="M30 40L36 44L32 48M30 58L36 62L31 66" fill="none" stroke-width="2.5"/>`
        + `<path d="M70 94L62 106L50 112M78 92L84 106L80 118" fill="none" stroke-width="8"/><path d="M44 110L50 112L45 116M76 120L80 118L84 122" fill="none" stroke-width="2.5"/>`
        + `</g><path d="${(() => { const pts = []; for(let i = 0; i < 18; i += 1){ const a = i * Math.PI / 9; const r = i % 2 ? 11 : 17; pts.push(`${(56 + r * Math.cos(a)).toFixed(1)} ${(42 + r * Math.sin(a)).toFixed(1)}`); } return `M${pts.join("L")}Z`; })()}" fill="${c}"/>`
        + `<circle cx="52" cy="40" r="9" fill="${c}"/><path d="M45 36L34 40L36 46L46 47Z" fill="${c}"/><circle cx="48" cy="37" r="1.8" fill="${d}"/><path d="M36 44H44" stroke="${d}" stroke-width="1.4"/>`
        + `<path d="M58 60Q66 66 64 80M70 64Q76 72 74 84" fill="none" stroke="${d}" stroke-opacity=".35" stroke-width="1.6"/>`,
    staff: c => `<path d="M30 30L42 120" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><path d="M27 24L33 24L32 34L28 34Z" fill="${c}"/>`,
    roses: (c, d) => [[24, 104], [96, 104]].map(([x, y]) => `<g>${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<circle cx="${(x + 4.6 * Math.cos(a)).toFixed(1)}" cy="${(y + 4.6 * Math.sin(a)).toFixed(1)}" r="4" fill="${c}"/>`; }).join("")}<circle cx="${x}" cy="${y}" r="2.6" fill="${d}"/></g>`).join(""),
    birdStanding: (c, d) => `<g fill="${c}"><path d="M60 62Q78 62 80 86Q80 104 66 110Q52 106 50 88Q48 70 60 62Z"/>`
        + `<path d="M64 66Q72 44 92 36Q96 46 90 54Q98 54 96 64Q88 66 84 74Q78 84 72 80Z"/><path d="M58 64Q50 52 54 40Q56 34 60 32" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`
        + `<circle cx="58" cy="34" r="6.5"/><path d="M53 31L36 35L53 37Z"/><path d="M60 28L66 22L64 30Z"/>`
        + `<path d="M60 108L58 120L52 122M68 108L70 120L76 122" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></g>`
        + `<path d="M37 35Q30 44 34 58Q30 50 26 54" fill="none" stroke="${c}" stroke-width="2"/><ellipse cx="33" cy="46" rx="4" ry="2" transform="rotate(60 33 46)" fill="${c}"/><ellipse cx="29" cy="53" rx="4" ry="2" transform="rotate(20 29 53)" fill="${c}"/>`
        + `<circle cx="57" cy="33" r="1.4" fill="${d}"/><path d="M72 46Q80 44 88 40M74 56Q82 54 90 50M76 66Q84 62 92 60" fill="none" stroke="${d}" stroke-opacity=".4" stroke-width="1.4"/>`,
    gates: (c, d) => `<g fill="none" stroke="${c}" stroke-width="3"><path d="M30 44V24Q60 0 90 24V44"/><path d="M38 44V22M46 44V16M54 44V12M60 44V11M66 44V12M74 44V16M82 44V22" stroke-width="2"/></g><path d="M26 44H94" stroke="${c}" stroke-width="4"/><circle cx="60" cy="8" r="3" fill="${c}"/>`,
    crownRoyal: (c, d) => `<path d="M26 58L22 30L38 44L48 24L60 40L72 24L82 44L98 30L94 58Z" fill="${c}"/><path d="M34 52Q60 30 86 52" fill="#b3122a"/>`
        + `<path d="M38 50Q40 32 60 22Q80 32 82 50" fill="none" stroke="${c}" stroke-width="3"/><path d="M60 22V50" stroke="${c}" stroke-width="3"/>`
        + `<rect x="24" y="56" width="72" height="11" rx="2" fill="${c}"/><circle cx="60" cy="16" r="5" fill="${c}"/><path d="M60 3V12M55.5 7H64.5" stroke="${c}" stroke-width="2.6"/>`
        + `<circle cx="42" cy="61.5" r="2.6" fill="#1f5fbf"/><circle cx="60" cy="61.5" r="3" fill="#b3122a"/><circle cx="78" cy="61.5" r="2.6" fill="#1f5fbf"/>`,
    trefoil: (c, d) => `<g fill="none" stroke="${c}" stroke-width="4.5"><circle cx="60" cy="58" r="15"/><circle cx="49" cy="78" r="15"/><circle cx="71" cy="78" r="15"/></g><circle cx="60" cy="71" r="4" fill="${c}"/>`,
    bearTree: (c, d) => `<rect x="80" y="62" width="7" height="52" fill="#6b4226"/><g fill="#1f7a3a"><circle cx="84" cy="46" r="17"/><circle cx="70" cy="58" r="11"/><circle cx="98" cy="58" r="11"/></g>`
        + `${[[78, 40], [90, 44], [84, 56], [72, 56], [96, 56], [86, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#d8202f"/>`).join("")}`
        + `<g fill="${c}" stroke="${c}" stroke-linecap="round"><ellipse cx="56" cy="84" rx="14" ry="23" transform="rotate(14 56 84)" stroke="none"/><circle cx="64" cy="58" r="10" stroke="none"/><circle cx="58" cy="49" r="3.6" stroke="none"/><circle cx="70" cy="50" r="3.6" stroke="none"/>`
        + `<path d="M70 72L80 64M66 66L78 56" fill="none" stroke-width="7"/><path d="M50 104L46 118M62 104L66 118" fill="none" stroke-width="8"/><path d="M71 58L78 61L71 64Z" stroke="none"/></g><circle cx="67" cy="56" r="1.6" fill="${d}"/>`,
    stars7: c => [[22, 22], [22, 32], [22, 42], [22, 52], [34, 18], [46, 18], [58, 18]].map(([x, y]) => crestStar(x, y, 4.2, c)).join(""),
    stars2: c => crestStar(46, 70, 16, c) + crestStar(74, 70, 16, c),
    biscione: (c, d) => `<path d="M64 32Q84 30 84 46Q84 60 64 64Q42 68 42 82Q42 98 62 98Q78 98 80 108Q70 118 54 116Q30 112 30 84Q30 58 58 54Q74 50 72 44Q70 40 62 42L54 40Q56 32 64 32Z" fill="${c}"/>`
        + `<path d="M54 40L46 38L44 42L52 44Z" fill="${c}"/><circle cx="66" cy="38" r="2" fill="${d}"/><path d="M44 40L36 36M44 40L36 44" stroke="#d8202f" stroke-width="1.8"/>`
        + `<path d="M50 56Q38 66 40 80M60 104Q70 108 76 106" fill="none" stroke="${d}" stroke-opacity=".35" stroke-width="1.6"/>`,
    pitWheel: (c, d) => `<g fill="${c}">${Array.from({ length: 12 }, (_, i) => `<rect x="55" y="34" width="10" height="12" rx="1.5" transform="rotate(${i * 30} 60 72)"/>`).join("")}</g>`
        + `<circle cx="60" cy="72" r="27" fill="none" stroke="${c}" stroke-width="8"/><g stroke="${c}" stroke-width="5">${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<path d="M60 72L${(60 + 24 * Math.cos(a)).toFixed(1)} ${(72 + 24 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}</g><circle cx="60" cy="72" r="8" fill="${c}"/><circle cx="60" cy="72" r="3" fill="${d}"/>`,
    ballGold: (c, d) => `<circle cx="60" cy="104" r="12" fill="${c}"/><path d="M50 98Q60 104 70 98M48 108Q60 114 72 108M60 92Q55 104 60 116" fill="none" stroke="${d}" stroke-opacity=".5" stroke-width="1.6"/>`,
    headerPlayer: (c, d) => `<path d="M30 118V104Q30 88 46 84L52 82Q42 76 42 62Q42 44 58 42Q74 42 76 58Q77 66 72 72L76 74Q74 80 70 82Q86 86 90 100V118Z" fill="${c}"/><path d="M48 46Q56 36 70 42Q62 42 56 48Z" fill="${d}" fill-opacity=".35"/><circle cx="86" cy="34" r="11" fill="#f5f5f3"/><path d="M86 29L90.8 32.5L89 38H83L81.2 32.5Z" fill="${d}"/>`,
    palace: c => `<g fill="none" stroke="${c}" stroke-width="2.6"><path d="M18 62V44Q60 6 102 44V62Z"/><path d="M60 18V62M40 30V62M80 30V62M28 42V62M92 42V62M18 52H102"/></g><path d="M14 62H106V68H14Z" fill="${c}"/>`,
    roundTower: (c, d) => `<path d="M42 110V56H78V110Z" fill="${c}"/><path d="M40 56H80V48H74V42H68V48H62V42H58V48H52V42H46V48H40Z" fill="${c}"/><path d="M46 42Q60 18 74 42Z" fill="${c}"/><circle cx="60" cy="24" r="3" fill="${c}"/>`
        + `<path d="M54 110V92Q60 84 66 92V110Z" fill="${d}"/><rect x="48" y="64" width="6" height="11" rx="3" fill="${d}"/><rect x="66" y="64" width="6" height="11" rx="3" fill="${d}"/><path d="M42 82H78" stroke="${d}" stroke-opacity=".4" stroke-width="1.4"/>`,
    laurel: c => { const leaf = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" transform="rotate(${a} ${x} ${y})" fill="${c}"/>`; let s = `<path d="M40 118Q18 96 22 56M80 118Q102 96 98 56" fill="none" stroke="${c}" stroke-width="2.2"/>`; for(let i = 0; i < 7; i += 1){ const t = i / 6; const y = 114 - t * 56; const x = 38 - Math.sin(t * Math.PI * .9) * 16; s += leaf(x - 4, y, -50 + t * 30) + leaf(x + 4, y - 3, 40 + t * 20) + leaf(120 - x + 4, y, 50 - t * 30) + leaf(120 - x - 4, y - 3, -40 - t * 20); } return s; },
    tigerFace: (c, d) => `<path d="M32 46L38 30L52 40H68L82 30L88 46Q96 64 90 82Q82 104 60 108Q38 104 30 82Q24 64 32 46Z" fill="${c}"/><path d="M38 34L42 42L48 40ZM82 34L78 42L72 40Z" fill="${d}"/>`
        + `<path d="M46 86Q60 78 74 86Q72 104 60 106Q48 104 46 86Z" fill="#f7f2e8"/><path d="M54 84H66L60 92Z" fill="${d}"/><path d="M60 92V98M60 98Q54 102 50 98M60 98Q66 102 70 98" stroke="${d}" stroke-width="1.8" fill="none"/>`
        + `<path d="M44 64L54 66L46 70ZM76 64L66 66L74 70Z" fill="#f2c94c" stroke="${d}" stroke-width="1.4"/>`
        + `<path d="M60 42V56M52 44L56 56M68 44L64 56M30 62L42 66M28 72L40 74M90 62L78 66M92 72L80 74M34 84L44 82M86 84L76 82" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`,
    cinquefoil: (c, d) => `<g fill="${c}">${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<circle cx="${(60 + 22 * Math.cos(a)).toFixed(1)}" cy="${(72 + 22 * Math.sin(a)).toFixed(1)}" r="15"/>`; }).join("")}<circle cx="60" cy="72" r="22"/></g><circle cx="60" cy="72" r="24" fill="none" stroke="${d}" stroke-opacity=".25" stroke-width="1.4"/>`,
    foxMask: (c, d) => `<path d="M34 46L46 60H74L86 46L88 70L60 102L32 70Z" fill="${c}"/><path d="M36 50L44 62L40 66ZM84 50L76 62L80 66Z" fill="${d}" fill-opacity=".45"/><path d="M42 74L60 102L78 74L60 84Z" fill="#f6f7f8"/><path d="M48 70L56 72L50 74ZM72 70L64 72L70 74Z" fill="${d}"/><circle cx="60" cy="99" r="3.6" fill="${d}"/>`,
    rose: (c, d) => `<g>${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<circle cx="${(60 + 9 * Math.cos(a)).toFixed(1)}" cy="${(72 + 9 * Math.sin(a)).toFixed(1)}" r="8" fill="${c}"/>`; }).join("")}<circle cx="60" cy="72" r="6" fill="${d}"/>${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i + .5) * 2 * Math.PI / 5; return `<path d="M${(60 + 13 * Math.cos(a)).toFixed(1)} ${(72 + 13 * Math.sin(a)).toFixed(1)}l${(5 * Math.cos(a)).toFixed(1)} ${(5 * Math.sin(a)).toFixed(1)}" stroke="#1f7a3a" stroke-width="3" stroke-linecap="round"/>`; }).join("")}</g>`,
    galleon: (c, d) => `<path d="M24 86H96L88 102H32Z" fill="${c}"/><path d="M20 84L28 76H34L32 86ZM100 84L92 74H86L88 86Z" fill="${c}"/><path d="M42 30V84M62 22V84M80 32V84" stroke="${c}" stroke-width="2.6"/>`
        + `<path d="M30 36Q42 32 54 36Q56 48 54 58Q42 54 30 58Q32 48 30 36ZM48 28Q62 22 76 28Q78 42 76 54Q62 50 48 54Q50 42 48 28ZM68 40Q80 36 92 40Q93 50 92 60Q80 56 68 60Q69 50 68 40ZM32 62Q42 60 54 62Q55 70 54 78Q42 76 32 78Q33 70 32 62ZM50 60Q62 58 76 60Q77 70 76 80Q62 78 50 80Q51 70 50 60Z" fill="${c}"/>`
        + `<path d="M62 22L74 18L62 14Z" fill="#d8202f"/><path d="M36 92H84" stroke="${d}" stroke-opacity=".35" stroke-width="1.6"/>`,
    rivers: c => `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round">${[0, 1, 2].map(i => `<path d="M24 ${100 + i * 9}Q33 ${94 + i * 9} 42 ${100 + i * 9}T60 ${100 + i * 9}T78 ${100 + i * 9}T96 ${100 + i * 9}"/>`).join("")}</g>`,
    devil: (c, d) => `<g fill="${c}"><circle cx="60" cy="42" r="8"/><path d="M53 36L50 26L57 34ZM67 36L70 26L63 34Z"/><path d="M50 52Q60 48 70 52L74 82H46Z"/><path d="M48 80L44 104L50 106L58 84ZM72 80L76 104L70 106L62 84Z"/><path d="M50 56L34 46L32 50L48 62ZM70 56L86 70L84 74L68 62Z"/>`
        + `<path d="M74 82Q90 92 84 106Q92 102 90 92" fill="none" stroke="${c}" stroke-width="2.6"/></g><path d="M30 30L36 54" stroke="${c}" stroke-width="3"/><path d="M24 26L30 32L36 22M30 32V20" stroke="${c}" stroke-width="2.6" fill="none"/>`,
    hammersX: (c, d) => { const h = `<rect x="-3.5" y="-30" width="7" height="68" rx="2.5" fill="${c}"/><path d="M-16 -42H12Q18 -42 18 -36V-26Q18 -22 14 -22H-16Q-19 -22 -19 -26V-38Q-19 -42 -16 -42Z" fill="${c}"/><path d="M-3.5 -14H3.5" stroke="${d}" stroke-opacity=".4" stroke-width="2"/>`; return `<g transform="translate(60 76) rotate(-38)">${h}</g><g transform="translate(60 76) rotate(38) scale(-1 1)">${h}</g>`; },
    cockerelBall: (c, d) => `<circle cx="58" cy="106" r="12" fill="${c}"/><path d="M50 98L58 104L66 98M58 104V116M48 108L58 104L68 108" stroke="#f7f8f8" stroke-opacity=".7" stroke-width="1.4" fill="none"/>`
        + `<path d="M52 94L50 84M62 94L64 84" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`
        + `<path d="M40 70Q38 56 48 50Q48 40 54 36Q60 32 64 38L66 46Q70 52 66 58Q80 54 86 44Q90 36 98 34Q92 44 96 52Q98 60 92 66Q96 70 92 74Q84 84 68 86L50 86Q40 82 40 70Z" fill="${c}"/>`
        + `<path d="M54 34Q56 26 60 30Q62 24 66 30Q68 34 64 38Z" fill="${c}"/><path d="M48 46L40 48L48 51Z" fill="${c}"/><path d="M50 52Q46 58 50 62" stroke="${c}" stroke-width="3" fill="none"/>`
        + `<circle cx="53" cy="44" r="1.6" fill="#f7f8f8"/><path d="M60 64Q70 70 82 66M58 72Q70 78 84 74" stroke="#f7f8f8" stroke-opacity=".45" stroke-width="1.4" fill="none"/>`,
    stagHead: (c, d) => `<path d="M48 60Q46 48 52 44H68Q74 48 72 60L70 82Q66 96 60 100Q54 96 50 82Z" fill="${c}"/><path d="M50 52L38 44L44 56ZM70 52L82 44L76 56Z" fill="${c}"/>`
        + `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"><path d="M54 44Q46 30 32 24M42 30L40 18M36 26L26 30M48 36L50 24"/><path d="M66 44Q74 30 88 24M78 30L80 18M84 26L94 30M72 36L70 24"/></g>`
        + `<circle cx="55" cy="62" r="2" fill="${d}"/><circle cx="65" cy="62" r="2" fill="${d}"/><ellipse cx="60" cy="96" rx="5" ry="3" fill="${d}" fill-opacity=".6"/>`,
    throstle: (c, d) => `<path d="M20 92Q60 84 104 96" fill="none" stroke="#6b4a1e" stroke-width="4" stroke-linecap="round"/>${[[34, 86, -30], [50, 90, 30], [86, 88, -20], [98, 98, 30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.4" transform="rotate(${a} ${x} ${y})" fill="#2e7d32"/>`).join("")}<circle cx="42" cy="94" r="2.6" fill="#c8102e"/><circle cx="92" cy="92" r="2.6" fill="#c8102e"/>`
        + `<path d="M44 74Q42 58 56 52Q60 40 70 42Q78 44 78 52L86 54L78 57Q80 66 76 74Q72 84 60 86L46 92L50 84Q44 80 44 74Z" fill="${c}"/><circle cx="71" cy="49" r="1.8" fill="#f5f6f7"/><path d="M52 66Q60 74 72 70" stroke="#f5f6f7" stroke-opacity=".5" stroke-width="1.6" fill="none"/><path d="M62 86L60 92M66 85L66 92" stroke="${c}" stroke-width="2"/>`,
    staffordKnot: c => `<path d="M30 70C30 46 54 46 60 70C66 94 90 94 90 70C90 46 66 46 60 70C54 94 30 94 30 70Z" fill="none" stroke="${c}" stroke-width="7"/><path d="M60 70L60 46" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="40" r="7" fill="none" stroke="${c}" stroke-width="5"/>`,
    bridgeArch: (c, d) => `<path d="M14 92Q60 40 106 92" fill="none" stroke="${c}" stroke-width="6"/><path d="M14 92H106" stroke="${c}" stroke-width="5"/>${[26, 38, 50, 60, 70, 82, 94].map(x => { const y = 92 - (1 - Math.pow((x - 60) / 46, 2)) * 26; return `<path d="M${x} 92V${y.toFixed(1)}" stroke="${c}" stroke-width="2"/>`; }).join("")}<path d="M10 104Q22 98 34 104T58 104T82 104T106 104" fill="none" stroke="${c}" stroke-width="2.6"/>`,
    haloRing: c => `<ellipse cx="60" cy="70" rx="30" ry="10" fill="none" stroke="${c}" stroke-width="6"/>`,
    santiago: c => `<g fill="${c}"><path d="M57 30H63V112L60 120L57 112Z"/><path d="M60 22Q52 28 56 36H64Q68 28 60 22Z"/><path d="M28 62Q32 56 38 60H82Q88 56 92 62Q88 68 82 64H38Q32 68 28 62Z"/><path d="M24 62Q28 54 34 58Q30 62 34 66Q28 70 24 62ZM96 62Q92 54 86 58Q90 62 86 66Q92 70 96 62Z"/></g>`,
    rifles: c => { const r = `<path d="M-2 -46H2V20H5L7 40Q0 44 -7 40L-5 20H-2Z" fill="${c}"/><rect x="-4" y="-6" width="8" height="5" fill="${c}"/>`; return `<g transform="translate(60 72) rotate(-30)">${r}</g><g transform="translate(60 72) rotate(30)">${r}</g>`; },
    navarre: c => `<g fill="none" stroke="${c}" stroke-width="3.6"><path d="M24 34H96V108H24Z" stroke-dasharray="6 3"/><path d="M60 34V108M24 71H96M24 34L96 108M96 34L24 108" stroke-dasharray="6 3"/></g><circle cx="60" cy="71" r="7" fill="#1f7a3a" stroke="${c}" stroke-width="2.4"/>`,
    saints: c => [36, 60, 84].map((x, i) => `<g fill="${c}"><circle cx="${x}" cy="${i === 1 ? 40 : 46}" r="6"/><path d="M${x - 9} ${i === 1 ? 92 : 96}Q${x - 8} ${i === 1 ? 54 : 58} ${x} ${i === 1 ? 50 : 54}Q${x + 8} ${i === 1 ? 54 : 58} ${x + 9} ${i === 1 ? 92 : 96}Z"/><circle cx="${x}" cy="${i === 1 ? 40 : 46}" r="9" fill="none" stroke="${c}" stroke-width="1.4"/></g>`).join(""),
    victoryCross: c => `<g fill="${c}"><path d="M54 24H66V56H94V68H66V116H54V68H26V56H54Z"/><circle cx="60" cy="22" r="6"/><circle cx="60" cy="118" r="6"/><circle cx="24" cy="62" r="6"/><circle cx="96" cy="62" r="6"/></g><g stroke="${c}" stroke-width="1.6"><path d="M34 68V86M86 68V86"/></g><path d="M30 88L34 82L38 88L34 94ZM82 88L86 82L90 88L86 94Z" fill="${c}"/>`,
    island: c => `<path d="M30 100Q28 86 38 80Q42 70 54 72Q62 64 72 70Q84 70 88 82Q96 90 90 102Q76 110 60 106Q44 110 30 100Z" fill="${c}"/>`,
    churchBridge: (c, d) => `<path d="M14 104Q30 86 46 104" fill="none" stroke="${c}" stroke-width="4"/><path d="M10 104H50" stroke="${c}" stroke-width="4"/><path d="M58 104V72L70 60L82 72V104Z" fill="${c}"/><path d="M66 60V46H74V60" fill="${c}"/><path d="M70 38V46M66 42H74" stroke="${c}" stroke-width="2"/><path d="M66 104V92Q70 86 74 92V104Z" fill="${d}"/>`,
    balloon: (c, d) => `<circle cx="60" cy="72" r="14" fill="${c}"/><path d="M60 64L67.6 69.5L64.7 78.5H55.3L52.4 69.5Z" fill="${d}"/><path d="M60 58V64M74 70L67.6 69.5M69 84L64.7 78.5M51 84L55.3 78.5M46 70L52.4 69.5" stroke="${d}" stroke-width="1.6"/>`,
    hammerPick: c => `<g transform="translate(60 72) rotate(-40)"><rect x="-3.5" y="-36" width="7" height="72" rx="2" fill="${c}"/><path d="M-14 -46H14V-32H-14Z" fill="${c}"/></g><g transform="translate(60 72) rotate(40)"><rect x="-3.5" y="-36" width="7" height="72" rx="2" fill="${c}"/><path d="M-22 -38Q0 -50 22 -38L20 -34Q0 -42 -20 -34Z" fill="${c}"/></g>`,
    eagleSpread: (c, d) => `<g fill="${c}"><path d="M60 40Q52 40 52 50L54 58H66L68 50Q68 40 60 40Z"/><path d="M52 44L44 48L52 50Z"/><path d="M50 60Q60 54 70 60L72 92Q60 100 48 92Z"/>`
        + `<path d="M50 60Q34 50 14 40L18 48L12 50L20 56L14 60L24 64L18 70L30 70L28 76L40 74L48 72Z"/><path d="M70 60Q86 50 106 40L102 48L108 50L100 56L106 60L96 64L102 70L90 70L92 76L80 74L72 72Z"/>`
        + `<path d="M52 92L44 110L50 108L52 114L58 104L60 112L62 104L68 114L70 108L76 110L68 92Z"/><path d="M50 94L40 104L44 106ZM70 94L80 104L76 106Z"/></g><path d="M44 48L40 50" stroke="#d8202f" stroke-width="2"/><circle cx="57" cy="46" r="1.6" fill="${d}"/>`
        + `<path d="M56 66V88M64 66V88M24 58L46 66M96 58L74 66" stroke="${d}" stroke-opacity=".3" stroke-width="1.4"/>`,
    bulls: (c, d) => { const b = `<path d="M8 72Q10 60 22 58L34 56Q40 50 44 54L46 48L50 52L48 58Q52 64 48 70L40 74L38 86H34L32 76L24 78L20 88H16L18 76Q8 78 8 72Z" fill="${c}"/><path d="M8 72L2 68L8 64Z" fill="${c}"/>`; return `<g transform="translate(-2 2)">${b}</g><g transform="translate(122 2) scale(-1 1)">${b}</g><circle cx="60" cy="66" r="11" fill="#f2c200"/>`; },
    cathedral: c => `<g fill="${c}"><path d="M32 112V52L38 26L44 52V112Z"/><path d="M76 112V52L82 26L88 52V112Z"/><path d="M44 112V70H76V112Z"/><path d="M52 70L60 54L68 70Z"/></g>`,
    crowns3: c => [30, 60, 90].map(x => `<g transform="translate(${x - 60} 0)"><path d="M48 28L46 16L53 22L60 12L67 22L74 16L72 28Z" fill="${c}"/><rect x="47" y="28" width="26" height="5" rx="1" fill="${c}"/></g>`).join(""),
    huntress: (c, d) => `<path d="M70 30Q86 34 88 54Q90 70 80 80L84 96Q86 106 80 112H44L50 96Q40 92 38 84L34 82L38 76L34 72L38 66L36 62Q40 50 46 42Q56 28 70 30Z" fill="${c}"/>`
        + `<path d="M48 38Q66 20 86 32Q96 46 92 64Q84 50 74 46Q60 42 48 38Z" fill="${d}"/><path d="M86 52Q98 62 94 80" fill="none" stroke="${d}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="60" r="1.8" fill="${d}"/><path d="M42 74Q44 76 46 74" stroke="${d}" stroke-width="1.4" fill="none"/>`,
    sardinia: c => `<circle cx="60" cy="72" r="30" fill="#f5f5f3"/><path d="M55 42H65V102H55ZM30 67H90V77H30Z" fill="#d22630"/>${[[42, 55], [78, 55], [42, 89], [78, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#15191c"/><path d="M${x - 6} ${y - 2}H${x + 6}" stroke="#f5f5f3" stroke-width="2"/>`).join("")}<circle cx="60" cy="72" r="30" fill="none" stroke="#e2b84a" stroke-width="2"/>`,
    wings: c => `<path d="M64 60Q78 36 102 30Q96 40 100 44Q90 46 96 52Q86 54 90 60Q80 62 70 70Z" fill="${c}"/>`,
    beakHead: (c, d) => `<circle cx="50" cy="40" r="10" fill="${c}"/><path d="M42 36L28 42L42 46Z" fill="${c}"/><path d="M50 30L54 22L58 32Z" fill="${c}"/><circle cx="47" cy="38" r="1.8" fill="${d}"/>`,
    sheWolf: (c, d) => `<path d="M20 70Q22 56 36 54L72 52Q84 50 90 42L94 34L98 42Q104 44 104 50L98 54Q96 62 88 64L86 84L80 104H74L76 84L68 72H44L40 86L42 104H36L32 86L28 76Q22 84 18 92Q14 84 20 70Z" fill="${c}"/><path d="M92 36L96 28L98 38Z" fill="${c}"/>`
        + `<circle cx="96" cy="44" r="1.6" fill="${d}"/><path d="M50 72Q56 80 64 72" stroke="${d}" stroke-opacity=".4" stroke-width="1.6" fill="none"/>`
        + `<g fill="${c}"><circle cx="48" cy="86" r="5"/><path d="M44 90Q40 100 46 108L52 104L50 92Z"/><circle cx="64" cy="88" r="5"/><path d="M60 92Q58 102 64 110L70 104L66 94Z"/></g>`,
    bullRampant: (c, d) => `<g fill="${c}" stroke="${c}" stroke-linecap="round" stroke-linejoin="round"><path d="M84 96Q98 84 94 66Q92 58 98 52" fill="none" stroke-width="4"/>`
        + `<ellipse cx="66" cy="78" rx="16" ry="25" transform="rotate(-18 66 78)" stroke="none"/><path d="M60 60L46 54L36 46M62 68L46 70L38 64" fill="none" stroke-width="7"/><path d="M70 96L62 108L52 114M78 94L84 108L80 120" fill="none" stroke-width="8"/></g>`
        + `<path d="M44 38Q50 30 60 34L64 50Q62 60 52 62L42 58Q36 50 44 38Z" fill="${c}"/><path d="M46 36Q38 30 40 20Q44 30 50 32ZM60 34Q66 26 64 18Q60 26 56 32Z" fill="${c}"/><circle cx="50" cy="44" r="1.8" fill="${d}"/><path d="M42 56Q46 58 48 56" stroke="${d}" stroke-width="1.4" fill="none"/>`,
    moorHead: (c, d) => `<path d="M66 32Q88 34 90 58Q92 76 82 86L86 104Q72 112 50 110L54 96Q44 94 42 86L36 84L40 78L34 74L40 68L38 62Q44 36 66 32Z" fill="${d}"/><path d="M40 50Q64 40 90 52L90 60Q64 48 40 58Z" fill="${c}"/><path d="M90 54L102 50L98 60Z" fill="${c}"/><circle cx="52" cy="68" r="2" fill="${c}"/>`,
    leopards: (c, d) => { const L = y => `<g transform="translate(0 ${y})"><path d="M22 0Q30 -6 44 -4H78Q88 -6 92 -12L96 -8Q100 -2 96 2L90 4L88 16H84L82 6L70 8L68 16H64L62 8H44L42 16H38L36 8L30 6L28 16H24L24 4Q18 2 22 0Z" fill="${c}"/><path d="M22 0Q12 -4 10 -14Q8 -20 14 -22" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="20" cy="-6" r="7" fill="${c}"/><circle cx="18" cy="-8" r="1.4" fill="${d}"/></g>`; return L(52) + L(92); },
    ironTower: (c, d) => `<path d="M58.5 18H61.5L63.5 40L65.5 56H70V60.5H66.5L71.5 84H78V88.5H72.5L90 114H73Q60 92 47 114H30L47.5 88.5H42V84H48.5L53.5 60.5H50V56H54.5L56.5 40Z" fill="${c}"/><path d="M56 70H64M54 78H66M50 98L56 92M70 98L64 92M58 46H62" stroke="${d}" stroke-opacity=".35" stroke-width="1.4"/>`,
    triskell: (c, d) => `<circle cx="60" cy="70" r="37" fill="none" stroke="${d}" stroke-width="3"/>` + [0, 120, 240].map(a => `<path d="M60 70C60 54 70 42 82 44C94 46 96 62 86 66C78 69 74 61 80 57" transform="rotate(${a} 60 70)" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join("") + `<circle cx="60" cy="70" r="6" fill="${c}"/>`,
});

const CREST_MOTIF_PLACES = Object.freeze({
    top: "translate(30 -12) scale(.5)",
    topStar: "translate(30 -24) scale(.5)",
    crownTop: "translate(33.6 2) scale(.44)",
    sm: "translate(22.8 26.6) scale(.62)",
    hi: "translate(18 2) scale(.7)",
    lo: "translate(30 50) scale(.5)",
    peak: "translate(42 11) scale(.3)",
    tilt: "rotate(-16 60 72)",
    left: "translate(120 0) scale(-1 1)",
    lowLeft: "translate(0 24) scale(.65)",
    inner: "translate(24 26) scale(.6)",
    discTop: "translate(36 10) scale(.4)",
    mid: "translate(18 22) scale(.7)",
    rightUp: "translate(52 4) scale(.55)",
    rightLow: "translate(48 50) scale(.55)",
    belowMid: "translate(30 46) scale(.55)",
    shipBig: "translate(18 -10) scale(.7)",
    shipTop: "translate(33 2) scale(.45)",
    upper: "translate(30 8) scale(.5)",
    lower: "translate(30 50) scale(.5)",
    shield: "translate(33 40) scale(.45)",
    ship: "translate(27 -4) scale(.55)",
    right: "translate(48 28) scale(.6)",
    corner: "translate(9 6) scale(.5)",
    canton: "translate(14 12) scale(.45)",
    above: "translate(30 -1) scale(.5)",
    stars: "translate(30 -9) scale(.5)",
    inset: "translate(15 14) scale(.75)"
});

function buildCrestMotifs(tokens){
    const inside = [];
    const above = [];
    tokens.forEach(token => {
        const draw = CREST_MOTIFS[token.name];
        if(!draw){ return; }
        const art = draw(token.c1, token.c2);
        const place = token.place === "top" && token.name === "star" ? "topStar" : token.place === "top" && token.name === "crownRoyal" ? "crownTop" : token.place;
        const wrapped = place && CREST_MOTIF_PLACES[place] ? `<g transform="${CREST_MOTIF_PLACES[place]}">${art}</g>` : art;
        (token.place === "top" || token.place === "above" ? above : inside).push(wrapped);
    });
    return { inside: inside.join(""), above: above.join("") };
}

/* CREST-V2 premium finish: bevelled gold rim, enamel sheen, gold-edged
   emblems and an optional ring band (gold marks, never lettering). */
const CREST_RING_MARKS = Object.freeze({
    dots: n => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return `<circle cx="${(60 + 48 * Math.cos(a)).toFixed(1)}" cy="${(70 + 48 * Math.sin(a)).toFixed(1)}" r="1.9"/>`; }).join(""),
    stars: n => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return crestStar(60 + 48 * Math.cos(a), 70 + 48 * Math.sin(a), 3.6, "inherit"); }).join("")
});

function buildCrestRing(ring, palette, gold){
    const band = resolveCrestColour(ring.colour, palette, palette.secondary);
    const marks = ring.marks === "none" ? "" : (CREST_RING_MARKS[ring.marks] || CREST_RING_MARKS.dots)(ring.count || 16).replace(/fill="inherit"/g, "");
    const engraving = [43.5, 45.5, 50.5, 52.5].map(rr => `<circle cx="60" cy="70" r="${rr}"/>`).join("");
    return `<path d="M60 15A55 55 0 1 1 59.99 15ZM60 29A41 41 0 1 0 60.01 29Z" fill="${band}" fill-rule="evenodd"/>`
        + `<g fill="none" stroke="#000" stroke-opacity=".16" stroke-width=".6">${engraving}</g>`
        + `<g fill="none" stroke="url(#${gold})"><circle cx="60" cy="70" r="41" stroke-width="2.2"/><circle cx="60" cy="70" r="53.6" stroke-width="1.2"/></g>`
        + `<g fill="${ring.markColour ? resolveCrestColour(ring.markColour, palette, "#f5f5f3") : `url(#${gold})`}">${marks}</g>`;
}

function buildCrestSvgMarkup(recipe, palette, idPrefix){
    const shape = CREST_SHAPES[recipe.shape] || CREST_SHAPES.heater;
    const layers = parseCrestTokens(recipe.pattern, palette);
    let field = palette.primary;
    if(layers.length && layers[0].name === "field"){
        field = layers.shift().c1;
    }
    const pattern = layers.map(layer => {
        const draw = CREST_PATTERNS[layer.name];
        return draw ? draw(layer.c1, layer.c2, idPrefix) : "";
    }).join("");
    const motifs = buildCrestMotifs(parseCrestTokens(recipe.motif, palette));
    const r = `${idPrefix}r`, b = `${idPrefix}b`, s = `${idPrefix}s`, v = `${idPrefix}v`, c = `${idPrefix}c`, e = `${idPrefix}e`, ic = `${idPrefix}i`;
    const ring = recipe.ring && recipe.shape === "roundel" ? recipe.ring : null;
    const around = (k, inner) => `<path d="${shape}" ${inner} transform="translate(60 70) scale(${k}) translate(-60 -70)"/>`;
    const emblem = motifs.inside ? `<g filter="url(#${e})">${motifs.inside}</g>` : "";
    const inside = ring
        ? `<clipPath id="${ic}"><circle cx="60" cy="70" r="41"/></clipPath><g clip-path="url(#${ic})">${pattern}<g transform="translate(60 70) scale(.72) translate(-60 -70)">${emblem}</g></g>${buildCrestRing(ring, palette, r)}`
        : `${pattern}${emblem}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 144" aria-hidden="true" focusable="false"><defs>`
        + `<linearGradient id="${r}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".28" stop-color="#e2b84a"/><stop offset=".52" stop-color="#9a7022"/><stop offset=".74" stop-color="#f6dc84"/><stop offset="1" stop-color="#7d5a17"/></linearGradient>`
        + `<linearGradient id="${b}" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fbe7a1"/><stop offset=".5" stop-color="#b8892c"/><stop offset="1" stop-color="#5e4210"/></linearGradient>`
        + `<linearGradient id="${s}" x1=".2" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".42" stop-color="#fff" stop-opacity=".06"/><stop offset=".43" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>`
        + `<radialGradient id="${v}" cx=".5" cy=".46" r=".62"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>`
        + `<filter id="${e}" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="o"/><feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="i"/>`
        + `<feOffset in="o" dy="1.8" result="d"/><feGaussianBlur in="d" stdDeviation="1.2" result="d"/><feFlood flood-color="#000" flood-opacity=".5"/><feComposite in2="d" operator="in" result="sh"/>`
        + `<feFlood flood-color="#e8c25c"/><feComposite in2="o" operator="in" result="go"/><feFlood flood-color="#1c1407"/><feComposite in2="i" operator="in" result="dk"/>`
        + `<feOffset in="SourceAlpha" dy="1.3" result="up"/><feComposite in="SourceAlpha" in2="up" operator="out" result="hiE"/><feFlood flood-color="#fff" flood-opacity=".55"/><feComposite in2="hiE" operator="in" result="hi"/>`
        + `<feOffset in="SourceAlpha" dy="-1.3" result="dn"/><feComposite in="SourceAlpha" in2="dn" operator="out" result="loE"/><feFlood flood-color="#000" flood-opacity=".4"/><feComposite in2="loE" operator="in" result="lo"/>`
        + `<feMerge><feMergeNode in="sh"/><feMergeNode in="go"/><feMergeNode in="dk"/><feMergeNode in="SourceGraphic"/><feMergeNode in="hi"/><feMergeNode in="lo"/></feMerge></filter>`
        + `<clipPath id="${c}"><path d="${shape}"/></clipPath></defs>`
        + `<g transform="translate(0 4)">`
        + `<path d="${shape}" fill="#000" fill-opacity=".4" transform="translate(60 72.5) scale(1.1) translate(-60 -70)"/>`
        + around(1.1, `fill="url(#${r})"`)
        + around(1.05, `fill="#1c1407"`)
        + around(1.035, `fill="url(#${b})"`)
        + `<path d="${shape}" fill="${field}"/><g clip-path="url(#${c})">${inside}`
        + `<path d="${shape}" fill="url(#${v})"/><path d="${shape}" fill="url(#${s})"/>`
        + `<path d="${shape}" fill="none" stroke="#1c1407" stroke-opacity=".55" stroke-width="2.4"/></g>`
        + `</g>${motifs.above ? `<g filter="url(#${e})">${motifs.above}</g>` : ""}</svg>`;
}

function toSvgDataUri(svg){
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function crestRecipe(shape, pattern, motif, keep, change, ring){
    return Object.freeze({ shape, pattern, motif, keep, change, ring: ring ? Object.freeze(ring) : null });
}

const CLUB_CREST_RECIPES = Object.freeze({
    /* Premier League 2016-17 */
    "Arsenal": crestRecipe("arsenal", "arsenalBase:a", "cannonR:g:#5e4210", "red shield, gold cannon facing right, navy base, top band", "own cannon drawing, no lettering in the top band"),
    "Bournemouth": crestRecipe("rounded", "field:s stripes:p", "headerPlayer:k:p", "rounded badge, red and black stripes, a player heading a ball", "own player drawing, no letters"),
    "Burnley": crestRecipe("heater", "chevron:s", "bee@upper:a:k bee@lower:a:k", "claret shield, sky blue chevron, golden bees", "own bee drawing, no hand, lions or motto"),
    "Chelsea": crestRecipe("roundel", "", "staff:w lionRampant:a:p roses:#c8102e:g", "blue ringed roundel, standing lion with a staff, roses", "own lion drawing, white dots in the ring not lettering, no balls", { colour: "p", marks: "dots", count: 20, markColour: "w" }),
    "Crystal Palace": crestRecipe("arch", "halves:s", "palace@above:a eagle@sm:a", "arched shield, blue and red halves, glasshouse above, eagle", "own eagle and glasshouse drawing, no ball, no text"),
    "Everton": crestRecipe("heater", "", "laurel:a roundTower:w:p", "blue shield, round tower, laurel wreaths", "own tower drawing, no motto, no year"),
    "Hull City": crestRecipe("roundel", "", "tigerFace:p:s", "amber disc, black ring, tiger face", "own tiger drawing, black ring with amber dots not lettering", { colour: "s", marks: "dots", count: 18, markColour: "p" }),
    "Leicester City": crestRecipe("roundel", "", "cinquefoil:w:p foxMask@sm:#e07a24:#15191c", "blue ringed roundel, white cinquefoil, fox mask", "own fox drawing, gold dots in the ring", { colour: "p", marks: "dots", count: 20 }),
    "Liverpool": crestRecipe("heater", "field:w", "birdStanding:p:w gates@above:a", "standing bird in red on a white shield, gates above", "own bird drawing, no motto, no flames, no letters"),
    "Manchester City": crestRecipe("roundel", "", "galleon@shipBig:g:p rivers:w rose@lower:#c8102e:a", "sky blue ringed roundel, ship, three rivers, red rose", "own ship drawing, no lettering", { colour: "#1c2c5b", marks: "dots", count: 20 }),
    "Manchester United": crestRecipe("roundel", "manuShield:p", "galleon@shipTop:g:k devil@shield:a:p", "ringed crest, ship above, red shield with a gold devil", "own ship and devil drawing, black ring with gold marks not lettering", { colour: "k", marks: "stars", count: 10 }),
    "Middlesbrough": crestRecipe("roundel", "field:w", "lionRampant:p:w", "white roundel in a red ring, red standing lion", "own lion drawing, white dots in the ring", { colour: "p", marks: "dots", count: 20, markColour: "w" }),
    "Southampton": crestRecipe("roundel", "field:w southampton:p:w", "tree@upper:#1f7a3a:#6b4226 haloRing@top:g", "halo above, tree, red and white stripes, water", "own tree drawing, no ball, no rose, no text"),
    "Stoke City": crestRecipe("heater", "field:w stripes:p", "staffordKnot@upper:a", "red and white stripes, Stafford knot", "own knot drawing, no text band"),
    "Sunderland": crestRecipe("heater", "quartersSun:p:w", "bridgeArch@lower:w cog@corner:a:p", "red and white stripes, bridge on blue, pit wheel", "own bridge and wheel drawing, no lions, no motto"),
    "Swansea City": crestRecipe("roundel", "field:k", "swan:w", "black disc with a white swan, white ring", "own swan drawing, black dots in the ring", { colour: "w", marks: "dots", count: 18, markColour: "k" }),
    "Tottenham Hotspur": crestRecipe("roundel", "field:w", "cockerelBall:s:w", "cockerel standing on a ball, navy on white", "own cockerel drawing, no letters"),
    "Watford": crestRecipe("rounded", "field:p sideBand:a", "stagHead:s:p", "yellow badge with a red border, black hart head", "own hart drawing, no letters"),
    "West Bromwich Albion": crestRecipe("heater", "wbaSplit:s:w", "throstle@upper:s", "thrush on a hawthorn branch, navy and white stripes", "own bird and branch drawing, no text"),
    "West Ham United": crestRecipe("heater", "sideBand:s", "hammersX:a:p", "claret shield with a sky blue border, crossed hammers", "own hammer drawing, no castle, no text"),

    /* LaLiga 2016-17 */
    "Alavés": crestRecipe("heater", "stripesHalf:p:w", "castle@rightUp:a:w raven@rightLow:k:w", "blue and white stripes left, castle and raven right", "own castle and raven drawing, no text"),
    "Athletic Club": crestRecipe("heater", "athletic:p:w", "tree@rightUp:#1f7a3a:#6b4226 churchBridge@rightLow:w:p", "red and white stripes, oak tree, bridge and church", "own tree, bridge and church drawing"),
    "Atlético Madrid": crestRecipe("bell", "field:w stripes:p cantonBig:a", "stars7:w bearTree@canton:#5a3a22:k", "bell outline, blue corner with seven stars and a bear by a strawberry tree, red and white stripes", "own bear and tree drawing"),
    "Barcelona": crestRecipe("pot", "barca:s:p", "ballGold:#f0a81c:#6b3a0a", "pot outline, St George cross, Catalan flag, white band, blue and garnet stripes, ball", "plain white band, no FCB letters"),
    "Celta Vigo": crestRecipe("heater", "", "santiago:a crownRoyal@top:g:s", "sky blue shield, red cross of St James, crown on top", "own cross drawing, no text"),
    "Deportivo La Coruña": crestRecipe("heater", "field:w sashGold:p", "crownRoyal@top:g:p", "white shield, blue band, crown on top", "no letters in the band"),
    "Eibar": crestRecipe("heater", "halves:s", "rifles:a crownRoyal@top:g:s", "blue and garnet halves, crossed rifles, crown on top", "own rifle drawing, no ball, no text"),
    "Espanyol": crestRecipe("roundel", "field:w stripes:p", "crownRoyal@top:g:p", "blue and white stripes in a gold-ringed roundel, crown on top", "stripes in place of the monogram", { colour: "a", marks: "dots", count: 18, markColour: "w" }),
    "Granada": crestRecipe("heater", "field:w hoopsTop:p:w", "pomegranate@belowMid:p:#1f7a3a crownRoyal@top:g:p", "red and white hoops, pomegranate, crown on top", "own fruit drawing, no text"),
    "Las Palmas": crestRecipe("heater", "blueTop:s", "island:s palm@upper:#1f7a3a:#6b4226", "yellow shield, blue top, island and palm", "own island and palm drawing, no ball, no text"),
    "Leganés": crestRecipe("heater", "field:w stripes:p blueTop:a", "", "blue and white stripes under a green band", "no lettering"),
    "Málaga": crestRecipe("heater", "field:w stripes:p", "castle:g:p crownRoyal@top:g:s", "sky blue and white stripes, castle, crown on top", "own castle drawing, no text"),
    "Osasuna": crestRecipe("heater", "", "navarre:a", "red shield with the gold chains of Navarre", "chains drawn fresh, no tree, no text"),
    "Real Betis": crestRecipe("heater", "field:w stripes:p", "crownRoyal@top:g:p", "green and white stripes, crown on top", "stripes in place of the monogram"),
    "Real Madrid": crestRecipe("roundel", "field:w sashGold:s", "trefoil@inset:a crownRoyal@top:g:s", "white roundel, purple band from top left, gold knot, royal crown on top", "gold knot not the monogram"),
    "Real Sociedad": crestRecipe("roundel", "field:w stripes:p", "balloon:w:p crownRoyal@top:g:p", "blue and white stripes, ball, crown on top", "no letters", { colour: "p", marks: "dots", count: 18 }),
    "Sevilla": crestRecipe("heater", "field:w sevilla:s:w", "saints@upper:g", "three figures above red and white stripes", "own figure drawing, no NO8DO text, no ball"),
    "Sporting Gijón": crestRecipe("heater", "field:w stripes:p", "victoryCross:g crownRoyal@top:g:p", "red and white stripes, Victory Cross, crown on top", "own cross drawing, no letters"),
    "Valencia": crestRecipe("roundel", "field:w senyeraHalf", "balloon@rightLow:a:k bat@top:k", "round shield, Valencian flag half, bat on top", "own bat drawing, no letters", { colour: "k", marks: "none" }),
    "Villarreal": crestRecipe("rounded", "sideBand:s", "balloon:w:s crownRoyal@top:g:s", "yellow badge with a blue border, crown on top", "no letters"),

    /* Bundesliga 2016-17 */
    "Bayern Munich": crestRecipe("roundel", "bavaria:s:w", "", "red ring, Bavarian blue and white lozenges", "white dots in the ring not lettering", { colour: "p", marks: "dots", count: 22, markColour: "w" }),
    "Borussia Dortmund": crestRecipe("roundel", "", "pitWheel:s:p", "yellow disc, thick black ring", "pit wheel in place of letters, no year", { colour: "s", marks: "none" }),
    "Bayer Leverkusen": crestRecipe("heater", "splitH:k:p discTop:w", "lionRampant@lower:w:k", "black over red shield, white disc above a standing lion", "plain disc in place of the company cross, own lion drawing, no text"),
    "Borussia Mönchengladbach": crestRecipe("diamond", "field:w rhombInner:a", "horse@mid:w:k", "white diamond with a green inner diamond, a foal", "foal in place of the letter, no text"),
    "Schalke 04": crestRecipe("roundel", "", "hammerPick:w", "blue disc, white ring, mining hammer and pick", "mining symbol in place of the letters", { colour: "w", marks: "dots", count: 18, markColour: "p" }),
    "Mainz 05": crestRecipe("roundel", "", "wheel:w", "red disc, white ring, the Mainz wheel", "wheel in place of the number", { colour: "w", marks: "dots", count: 18, markColour: "p" }),
    "Hertha BSC": crestRecipe("flag", "field:w hoopsFlag:p", "", "waving flag, blue and white stripes", "no lettering"),
    "Wolfsburg": crestRecipe("roundel", "", "wolf:w:p", "green disc, white ring, wolf head", "wolf in place of the letter", { colour: "w", marks: "dots", count: 18, markColour: "p" }),
    "Hoffenheim": crestRecipe("heater", "splitH:p:w", "balloon:w:p", "blue over white shield, ball", "no year or letters"),
    "Eintracht Frankfurt": crestRecipe("roundel", "field:w", "eagleSpread:k:w", "white disc, red ring, black spread eagle", "own eagle drawing, white dots in the ring", { colour: "p", marks: "dots", count: 20, markColour: "w" }),
    "Werder Bremen": crestRecipe("diamond", "rhombInner:w", "key@mid:p", "green diamond, white inner diamond, Bremen key", "key in place of the letter"),
    "Hamburg": crestRecipe("diamond", "field:k rhombInner:w:p", "", "black diamond, white diamond, blue centre", "no text"),
    "FC Augsburg": crestRecipe("heater", "halves:s", "pinecone:w:k", "red and green halves, pine cone", "own pine cone drawing, no letters"),
    "SC Freiburg": crestRecipe("heater", "field:w stGeorge:p sideBand:k", "", "black border, red cross on white", "no letters"),
    "RB Leipzig": crestRecipe("roundel", "field:w", "bulls:s", "two red bulls charging at a yellow ball", "own bull drawing, no text", { colour: "#0c2340", marks: "none" }),
    "FC Ingolstadt": crestRecipe("heater", "halvesL:s", "lionRampant:w:k", "black and red halves, standing panther", "own panther drawing, no text"),
    "Darmstadt 98": crestRecipe("heater", "sideBand:w", "lily:w", "blue shield with a white border, lily", "no year, no text"),
    "1. FC Köln": crestRecipe("heater", "field:w redChief:p", "crowns3:g goat@lower:p:w", "red chief with three crowns, goat on white", "own goat drawing, no cathedral text, no letters"),

    /* Serie A 2016-17 */
    "Atalanta": crestRecipe("roundel", "stripes:s", "huntress:w:s", "blue and black stripes, black ring, the huntress in profile", "own profile drawing, no text", { colour: "s", marks: "stars", count: 10 }),
    "Bologna": crestRecipe("heater", "bologna:s:p", "", "white top band, city cross left, red and blue stripes right", "plain top band, no letters or year"),
    "Cagliari": crestRecipe("heater", "halves:s", "sardinia", "red and blue halves, Sardinian four Moors disc", "own drawing of the regional flag, no text"),
    "Chievo": crestRecipe("heater", "sideBand:s", "ladder:s", "yellow shield with a blue border, Scala ladder", "heraldic ladder in place of the knight, no text"),
    "Crotone": crestRecipe("heater", "halves:s innerShield:w", "column@inner:a", "red and blue halves, white shield with a Greek column", "own column drawing, no text"),
    "Empoli": crestRecipe("heater", "band:w", "", "blue shield with a white band", "no letters"),
    "Fiorentina": crestRecipe("point", "innerShield:w", "lily@inner:#d22630", "purple shield, white inner shield with a red Florentine lily", "own lily drawing, no letters"),
    "Genoa": crestRecipe("heater", "halvesL:s", "wings:g lionRampant:g:s beakHead:g:s", "red and blue halves, golden griffin", "own griffin drawing, no text"),
    "Inter Milan": crestRecipe("roundel", "field:k", "biscione:a:k", "blue ring around black, gold Milanese serpent", "serpent in place of the monogram, no letters", { colour: "p", marks: "none" }),
    "Juventus": crestRecipe("oval", "field:w stripes:s juveTop", "stars2@stars:a", "oval, white top, gold crown band, black and white stripes, stars above", "no letters, no bull"),
    "Lazio": crestRecipe("heater", "sideBand:w", "eagleSpread:g:k", "sky blue shield with a white border, golden eagle", "own eagle drawing, no text"),
    "Milan": crestRecipe("roundel", "milanSplit:p:s", "", "ringed roundel, red and black stripes left, St George cross right", "gold stars in the ring, no letters or year", { colour: "k", marks: "stars", count: 12 }),
    "Napoli": crestRecipe("roundel", "", "horse:w:p", "sky blue disc, white ring, horse head", "horse in place of the letter", { colour: "w", marks: "dots", count: 18, markColour: "p" }),
    "Palermo": crestRecipe("heater", "halves:s", "eagleSpread@hi:g:k", "pink and black halves, golden eagle", "own eagle drawing, no text"),
    "Pescara": crestRecipe("heater", "field:w stripes:p", "dolphin:g", "sky blue and white stripes, dolphin", "own dolphin drawing, no text"),
    "Roma": crestRecipe("heater", "topHalf:s", "sheWolf@mid:#8e1d34:k", "crimson shield, orange top with the she-wolf and twins", "own drawing of the ancient statue theme, no letters or year"),
    "Sampdoria": crestRecipe("heater", "sampBand", "anchor@sm:a", "blue shield, white red black band, anchor", "anchor in place of the sailor, no text"),
    "Sassuolo": crestRecipe("heater", "stripes:s", "", "green and black stripes", "no text"),
    "Torino": crestRecipe("heater", "", "bullRampant:g:p", "maroon shield, golden standing bull", "own bull drawing, no text"),
    "Udinese": crestRecipe("heater", "field:w stripes:s", "", "black and white stripes", "no text"),

    /* Ligue 1 2016-17 */
    "Angers": crestRecipe("heater", "wide:s", "castle:g:s", "black and white stripes, castle", "own castle drawing, no text"),
    "Bastia": crestRecipe("roundel", "", "moorHead:w:k", "blue disc, white ring, Corsican Moor head", "own drawing of the regional symbol, no text", { colour: "w", marks: "dots", count: 18, markColour: "p" }),
    "Bordeaux": crestRecipe("heater", "scapular:w", "", "navy shield, white scapular", "no letters"),
    "Caen": crestRecipe("heater", "halves:s", "leopards@mid:g:p", "blue and red halves, two gold Normandy leopards", "own leopard drawing, no text"),
    "Dijon": crestRecipe("heater", "redTop:w", "owl:w:k", "red shield, owl", "own owl drawing, no letters"),
    "Guingamp": crestRecipe("heater", "field:w redTop:p rule:s", "ermine@lower:s", "red top, black rule, ermine on white", "no text"),
    "Lille": crestRecipe("roundel", "", "dog:w:p", "red disc, navy ring, mastiff head", "own dog drawing, white marks not lettering", { colour: "s", marks: "dots", count: 18, markColour: "w" }),
    "Lorient": crestRecipe("heater", "", "fish:k:p", "orange shield, black fish", "own fish drawing, no text"),
    "Lyon": crestRecipe("arch", "lyon:s:a", "lionRampant@hi:a:w", "white arched shield, standing red lion, blue base", "own lion drawing, no monogram"),
    "Marseille": crestRecipe("heater", "field:w foot:p", "waves:p star@top:g", "white shield, sky blue base, star above", "waves in place of the letters, no motto"),
    "Metz": crestRecipe("heater", "", "lorraine:w", "maroon shield, cross of Lorraine", "no dragon, no text"),
    "Monaco": crestRecipe("diamond", "diag:s", "crownRoyal@top:g:p", "red and white diagonal diamond, crown on top", "no letters"),
    "Montpellier": crestRecipe("heater", "halves:s", "sun:w", "blue and orange halves, sun", "no figure, no text"),
    "Nancy": crestRecipe("heater", "field:w halves:p", "thistle@lowLeft:#8e5bb5:#2e7d32 lorraine@right:w", "red and white halves, thistle and cross of Lorraine", "own thistle drawing, no text"),
    "Nantes": crestRecipe("roundel", "", "bird:p", "yellow disc, green ring, canary", "own bird drawing, gold marks not lettering", { colour: "s", marks: "dots", count: 18 }),
    "Nice": crestRecipe("heater", "stripes:s", "eagleSpread:g:k", "red and black stripes, golden eagle", "own eagle drawing, no text"),
    "Paris Saint-Germain": crestRecipe("roundel", "", "ironTower:s:p", "navy disc, white ring, red iron tower", "own tower drawing, navy dots not lettering", { colour: "w", marks: "dots", count: 22, markColour: "p" }),
    "Rennes": crestRecipe("heater", "field:s redTop:p", "ermine@lower:w", "red top, white ermine on black", "no text"),
    "Saint-Étienne": crestRecipe("heater", "sideBand:w", "picks:w", "green shield with a white border, miners picks", "no letters"),
    "Toulouse": crestRecipe("heater", "sideBand:w", "occitan:g", "purple shield with a white border, gold Occitan cross", "no letters"),
    /* Big Jump top 300: clubs outside the five leagues (own drawings, no letters) */
    "Ajax": crestRecipe("roundel", "field:w", "warriorHead:p:w", "white disc, red ring, warrior head in profile", "own head drawing in red lines, gold dots in the ring", { colour: "p", marks: "dots", count: 22 }),
    "FC Porto": crestRecipe("heater", "field:p canton:w", "dragon:a:p", "blue shield with a white quarter, gold winged dragon", "own dragon drawing, no crown, no letters"),
    "SL Benfica": crestRecipe("heater", "field:p topHalf:w", "wheel:a eagleSpread@upper:a", "red and white shield, wheel, eagle with spread wings", "own eagle drawing, no motto, no letters"),
    "Sporting CP": crestRecipe("heater", "field:p hoops:w", "lionRampant@sm:a:p", "green and white hoops, standing lion", "own lion drawing, no letters"),
    "Galatasaray SK": crestRecipe("roundel", "field:s halves:p", "lion@sm:w:k", "yellow and red halves, lion head", "own lion drawing, no letters", { colour: "p", marks: "stars", count: 10 }),
    "Beşiktaş JK": crestRecipe("heater", "field:k halves:w redChief:a", "crescentStarChief:w:a", "black and white halves, red band with crescent and star", "own crescent drawing, no letters, no year"),
    "PSV": crestRecipe("heater", "field:w stripes:p", "ball@lower:w:k", "red and white stripes, ball", "own ball drawing, no letters"),
    "RSC Anderlecht": crestRecipe("oval", "field:p", "laurel:a crown@upper:a:p", "purple oval, laurel, crown", "own crown drawing, no letters"),
    "Shakhtar Donetsk": crestRecipe("heater", "field:p band:k", "hammerPick:s ball@lower:w:k", "orange and black shield, crossed miner tools, ball", "own tools drawing, no letters"),
    "Spartak Moscow": crestRecipe("diamond", "field:p sash:w", "", "red rhombus with a white diagonal band", "own band shape, no letter S"),
    "KRC Genk": crestRecipe("roundel", "field:p", "pitWheel:w", "blue disc with a white mine wheel", "own wheel drawing, white dots in the ring", { colour: "p", marks: "dots", count: 20, markColour: "w" }),
    "Boavista FC": crestRecipe("heater", "field:w checker:k", "cat@sm:k:w", "black and white checks, panther head", "own panther drawing, no letters"),
    "Moreirense FC": crestRecipe("heater", "field:p stripes:w", "castle@sm:a:p", "green and white stripes, castle", "own castle drawing, no letters"),
    "Rosario Central": crestRecipe("heater", "field:p halvesL:s", "stars3@upper:w", "blue and yellow halves, three stars", "own layout, no flag, no letters"),
    "Estudiantes de La Plata": crestRecipe("heater", "field:w stripes:p", "laurel:a", "red and white stripes, laurel", "own laurel, no letter E")
});

const LEAGUE_MARK_V2_TONES = Object.freeze({
    gold: "#e2b84a",
    ink: "#121212"
});

function leagueMarkStar(cx, cy, outer, inner, rotationDeg){
    const points = [];
    const start = (rotationDeg || 0) - 90;
    for(let index = 0; index < 10; index += 1){
        const radius = index % 2 === 0 ? outer : inner;
        const angle = (start + index * 36) * Math.PI / 180;
        points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`);
    }
    return `M${points.join("L")}Z`;
}

function leagueMarkCircle(cx, cy, r){
    return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

const LEAGUE_MARK_V2_STUDS = [];
for(let index = 0; index < 10; index += 1){
    const angle = (index * 36 - 90) * Math.PI / 180;
    LEAGUE_MARK_V2_STUDS.push(leagueMarkCircle(
        Number((50 + 37 * Math.cos(angle)).toFixed(2)),
        Number((50 + 37 * Math.sin(angle)).toFixed(2)),
        3.6
    ));
}

const LEAGUE_MARK_RECIPES = Object.freeze({
    premier_league: Object.freeze({
        code: "ENG · I", primary: "#3d195b",
        layers: Object.freeze([
            Object.freeze({ d: "M16 62L20 30L36 47L50 20L64 47L80 30L84 62Z" + leagueMarkStar(50, 50, 8, 3.6, 0), rule: "evenodd" }),
            Object.freeze({ d: leagueMarkCircle(20, 25, 7) + leagueMarkCircle(50, 15, 7.5) + leagueMarkCircle(80, 25, 7) }),
            Object.freeze({ d: "M16 67H84V76Q84 82 78 82H22Q16 82 16 76Z" })
        ])
    }),
    laliga: Object.freeze({
        code: "ESP · I", primary: "#8f0f1a",
        layers: Object.freeze([
            Object.freeze({ d: "M6 12C8 34 20 44 38 44L62 44C80 44 92 34 94 12C85 25 74 32 62 32L38 32C26 32 15 25 6 12Z" }),
            Object.freeze({ d: "M20 38L33 38L33 50ZM80 38L67 38L67 50Z" }),
            Object.freeze({
                d: "M30 36L70 36L67 62L61 88L39 88L33 62Z"
                    + "M37 50L47 54L39 58ZM63 50L53 54L61 58Z"
                    + leagueMarkCircle(44, 78, 3.4) + leagueMarkCircle(56, 78, 3.4),
                rule: "evenodd"
            })
        ])
    }),
    bundesliga: Object.freeze({
        code: "GER · I", primary: "#1b1b1f",
        layers: Object.freeze([
            Object.freeze({ d: leagueMarkCircle(50, 50, 45) + leagueMarkCircle(50, 50, 30) + LEAGUE_MARK_V2_STUDS.join(""), rule: "evenodd" }),
            Object.freeze({ d: leagueMarkCircle(50, 50, 25) + leagueMarkStar(50, 50, 13, 5.6, 0), rule: "evenodd" })
        ])
    }),
    serie_a: Object.freeze({
        code: "ITA · I", primary: "#0b3a6f",
        layers: Object.freeze([
            Object.freeze({ d: "M14 12L40 12L50 19L60 12L86 12L86 48C86 70 70 84 50 93C30 84 14 70 14 48ZM22 19L38 19L50 27L62 19L78 19L78 48C78 65 66 76 50 84C34 76 22 65 22 48Z", rule: "evenodd" }),
            Object.freeze({ d: "M27 24L37 24L50 32.5L63 24L73 24L73 48C73 62 63 71 50 78C37 71 27 62 27 48Z" + leagueMarkStar(50, 49, 15, 6.4, 0), rule: "evenodd" })
        ])
    }),
    ligue_1: Object.freeze({
        code: "FRA · I", primary: "#0b1f4a",
        layers: Object.freeze([
            Object.freeze({ d: "M44 10L70 10L58 76L72 76L69 90L23 90L26 76L38 76L45 38L31 44L35 24Z" + leagueMarkStar(57, 24, 6.5, 2.8, 10), rule: "evenodd" })
        ])
    })
});

function buildLeagueMarkSvg(recipe, tone = "gold"){
    const fill = LEAGUE_MARK_V2_TONES[tone] || LEAGUE_MARK_V2_TONES.gold;
    const body = recipe.layers.map((layer) =>
        `<path d="${layer.d}"${layer.rule ? ` fill-rule="${layer.rule}"` : ""}/>`
    ).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="${fill}">${body}</g></svg>`;
}

function getLeagueMark(leagueId){
    const id = String(leagueId || "").trim();
    const recipe = Object.prototype.hasOwnProperty.call(LEAGUE_MARK_RECIPES, id) ? LEAGUE_MARK_RECIPES[id] : null;
    if(!recipe){ return null; }
    const svg = buildLeagueMarkSvg(recipe, "gold");
    return Object.freeze({
        id,
        code: recipe.code,
        primary: recipe.primary,
        svg,
        image: toSvgDataUri(svg)
    });
}

const leagueMarkObservers = new WeakMap();

function applyLeagueMark(element, leagueId){
    if(!element){ return; }
    const id = String(leagueId || "").trim();
    const recipe = Object.prototype.hasOwnProperty.call(LEAGUE_MARK_RECIPES, id) ? LEAGUE_MARK_RECIPES[id] : null;
    if(!recipe){
        delete element.dataset.leagueMark;
        element.style.removeProperty("--league-mark-image");
        const oldObserver = leagueMarkObservers.get(element);
        if(oldObserver){ oldObserver.disconnect(); leagueMarkObservers.delete(element); }
        return;
    }

    const paint = () => {
        const tone = element.classList && element.classList.contains("is-top") ? "ink" : "gold";
        element.style.setProperty("--league-mark-image", toSvgDataUri(buildLeagueMarkSvg(recipe, tone)));
    };

    element.dataset.leagueMark = "original";
    paint();

    if(typeof MutationObserver !== "undefined" && !leagueMarkObservers.has(element)){
        const observer = new MutationObserver((mutations) => {
            if(mutations.some((mutation) => mutation.attributeName === "class")){ paint(); }
        });
        observer.observe(element, { attributes: true, attributeFilter: ["class"] });
        leagueMarkObservers.set(element, observer);
    }
}

/* Marquee Player list (FIFA 17 launch dataset) names for clubs the catalog already draws under its own name. */
const CLUB_IDENTITY_ALIASES = Object.freeze({
    "FC Barcelona": "Barcelona",
    "FC Bayern München": "Bayern Munich",
    "Bayer 04 Leverkusen": "Bayer Leverkusen",
    "Olympique Lyonnais": "Lyon",
    "Hamburger SV": "Hamburg",
    "Athletic Club de Bilbao": "Athletic Club",
    "Inter": "Inter Milan",
    "AS Monaco": "Monaco",
    "UD Las Palmas": "Las Palmas",
    "FC Schalke 04": "Schalke 04",
    "VfL Wolfsburg": "Wolfsburg",
    "Villarreal CF": "Villarreal",
    "TSG 1899 Hoffenheim": "Hoffenheim",
    "Valencia CF": "Valencia",
    "OGC Nice": "Nice",
    "Sevilla FC": "Sevilla",
    "Málaga CF": "Málaga",
    "SD Eibar": "Eibar",
    "RC Celta": "Celta Vigo",
    "Toulouse Football Club": "Toulouse",
    "Granada CF": "Granada",
    "AS Saint-Étienne": "Saint-Étienne",
    "Stade Rennais FC": "Rennes"
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

/* Unknown names keep the old hash path, drawn in the new frame. */
function buildFallbackCrestRecipe(hash){
    const shapes = ["heater", "roundel", "hex", "point", "tall"];
    const patterns = ["stripes:s", "halves:s", "sash:s", "hoops:s", "chevron:s", "foot:s rule:a"];
    const motifs = ["star:a", "castle:a:p", "bird:a", "waves:a", "crown:a:p", "leaf:a:p", "wheel:a"];
    return crestRecipe(shapes[hash % shapes.length], patterns[(hash >>> 4) % patterns.length], motifs[(hash >>> 9) % motifs.length], "generated colours", "generated fallback crest");
}

function getClubCrestSvg(clubName){
    const identity = getClubIdentity(clubName);
    return buildCrestSvgMarkup(identity.recipe, identity, nextCrestIdPrefix());
}

function getClubIdentity(clubName){
    const rawName = String(clubName || "").trim();
    const name = Object.prototype.hasOwnProperty.call(CLUB_IDENTITY_ALIASES, rawName) ? CLUB_IDENTITY_ALIASES[rawName] : rawName;
    if(clubIdentityCache.has(name)){
        return clubIdentityCache.get(name);
    }

    const hash = getClubIdentityHash(name);
    const palette = (Object.prototype.hasOwnProperty.call(CLUB_IDENTITY_PALETTES, name) && CLUB_IDENTITY_PALETTES[name])
        || CLUB_IDENTITY_FALLBACK_PALETTES[hash % CLUB_IDENTITY_FALLBACK_PALETTES.length];
    const recipe = Object.prototype.hasOwnProperty.call(CLUB_CREST_RECIPES, name)
        ? CLUB_CREST_RECIPES[name]
        : buildFallbackCrestRecipe(hash);

    const draft = {
        initials: getClubIdentityInitials(name),
        primary: palette[0],
        secondary: palette[1],
        accent: palette[2],
        angle: `${30 + (hash % 31)}deg`,
        recipe
    };

    draft.crest = toSvgDataUri(buildCrestSvgMarkup(recipe, draft, "k"));
    Object.defineProperty(draft, "crestSvg", {
        enumerable: true,
        get(){ return buildCrestSvgMarkup(recipe, draft, nextCrestIdPrefix()); }
    });
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
window.getClubCrestSvg = getClubCrestSvg;
window.getLeagueMark = getLeagueMark;
window.applyLeagueMark = applyLeagueMark;
