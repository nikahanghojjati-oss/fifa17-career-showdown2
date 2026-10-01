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
    "Toulouse": ["#5d3f91", "#f4f4f6", "#d7b438"]
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
    swiss: "M14 10Q60 20 106 10V70C106 104 84 122 60 132C36 122 14 104 14 70Z"
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
    hammers: c => { const h = `<rect x="-3.5" y="-2" width="7" height="46" rx="2.5" fill="${c}"/><path d="M-16 -14H12Q18 -14 18 -8V2Q18 6 14 6H-16Q-19 6 -19 2V-10Q-19 -14 -16 -14Z" fill="${c}"/>`; return `<g transform="translate(42 58) rotate(-14)">${h}</g><g transform="translate(78 58) rotate(14) scale(-1 1)">${h}</g>`; },
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
    apple: c => `<g fill="${c}"><path d="M60 58Q72 50 81 59Q88 70 82 86Q76 100 65 98Q62 97 60 98Q58 97 55 98Q44 100 38 86Q32 70 39 59Q48 50 60 58Z"/><path d="M59 58Q59 50 62 46L64 47Q61 51 61 58Z"/><path d="M63 50Q71 41 79 45Q71 53 63 50Z"/></g>`,
    flask: c => `<path d="M55 38H65V56Q80 62 80 76Q80 90 60 90Q40 90 40 76Q40 62 55 56Z" fill="${c}"/><rect x="52" y="34" width="16" height="5" rx="2" fill="${c}"/>`,
    tile: (c, d) => `<g transform="rotate(45 60 70)"><rect x="44" y="54" width="32" height="32" rx="2" fill="${c}"/><rect x="53" y="63" width="14" height="14" fill="${d}"/></g>`,
    sun: c => { let s = `<g fill="${c}">`; for(let i = 0; i < 8; i += 1){ s += `<rect x="57.5" y="38" width="5" height="10" rx="2" transform="rotate(${i * 45} 60 70)"/>`; } return s + `<circle cx="60" cy="70" r="14"/></g>`; },
    triskell: (c, d) => `<circle cx="60" cy="70" r="37" fill="none" stroke="${d}" stroke-width="3"/>` + [0, 120, 240].map(a => `<path d="M60 70C60 54 70 42 82 44C94 46 96 62 86 66C78 69 74 61 80 57" transform="rotate(${a} 60 70)" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join("") + `<circle cx="60" cy="70" r="6" fill="${c}"/>`,
});

const CREST_MOTIF_PLACES = Object.freeze({
    top: "translate(30 -12) scale(.5)",
    topStar: "translate(30 -24) scale(.5)",
    sm: "translate(22.8 26.6) scale(.62)",
    hi: "translate(18 2) scale(.7)",
    lo: "translate(30 50) scale(.5)",
    peak: "translate(42 11) scale(.3)",
    tilt: "rotate(-16 60 72)",
    left: "translate(120 0) scale(-1 1)"
});

function buildCrestMotifs(tokens){
    const inside = [];
    const above = [];
    tokens.forEach(token => {
        const draw = CREST_MOTIFS[token.name];
        if(!draw){ return; }
        const art = draw(token.c1, token.c2);
        const place = token.place === "top" && token.name === "star" ? "topStar" : token.place;
        const wrapped = place && CREST_MOTIF_PLACES[place] ? `<g transform="${CREST_MOTIF_PLACES[place]}">${art}</g>` : art;
        (token.place === "top" ? above : inside).push(wrapped);
    });
    return { inside: inside.join(""), above: above.join("") };
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
    const r = `${idPrefix}r`, g = `${idPrefix}g`, c = `${idPrefix}c`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 144" aria-hidden="true" focusable="false"><defs>`
        + `<linearGradient id="${r}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeaa0"/><stop offset=".45" stop-color="#c69a34"/><stop offset=".7" stop-color="#f3d470"/><stop offset="1" stop-color="#8e6a1f"/></linearGradient>`
        + `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`
        + `<clipPath id="${c}"><path d="${shape}"/></clipPath></defs>`
        + `<g transform="translate(0 4)"><path d="${shape}" fill="url(#${r})" transform="translate(60 70) scale(1.07) translate(-60 -70)"/>`
        + `<path d="${shape}" fill="${field}"/><g clip-path="url(#${c})">${pattern}${motifs.inside}<path d="${shape}" fill="url(#${g})"/></g>`
        + `<path d="${shape}" fill="none" stroke="#1a1206" stroke-opacity=".35" stroke-width="1.2"/></g>${motifs.above}</svg>`;
}

function toSvgDataUri(svg){
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function crestRecipe(shape, pattern, motif, keep, change){
    return Object.freeze({ shape, pattern, motif, keep, change });
}

const CLUB_CREST_RECIPES = Object.freeze({
    /* Premier League 2016-17 */
    "Arsenal": crestRecipe("roundel", "foot:a rule:s", "cannon:s star@peak:g", "red, white, navy; cannon", "roundel not shield, cannon faces left, no top text band"),
    "Bournemouth": crestRecipe("hex", "field:s stripes:p", "cherries:a:w", "red and black stripes; cherries (club nickname)", "hex not badge block, no player-head silhouette, no lettering"),
    "Burnley": crestRecipe("roundel", "foot:s rule:a", "bee:a:k", "claret, sky blue, gold; a bee", "roundel not shield, single bee, no lion, no hand, no motto"),
    "Chelsea": crestRecipe("heater", "cap:s", "lion:a:p", "royal blue, white, gold; a lion", "shield not roundel, lion head in profile, no staff, roses or balls"),
    "Crystal Palace": crestRecipe("hex", "halves:s", "eagleR:w", "blue and red halves; an eagle", "hex not arched shield, spread eagle faces right, no ball, no palace, no text"),
    "Everton": crestRecipe("roundel", "base:s", "tower:s:p", "royal blue, white; a round tower", "roundel not shield, plain tower, no wreaths, no motto scroll"),
    "Hull City": crestRecipe("hex", "claws:s", "", "amber and black; tiger stripes", "stripes only, no tiger head, hex not shield, no text"),
    "Leicester City": crestRecipe("heater", "base:a", "fox@tilt:#e07a24:k", "royal blue, white, gold; a fox", "shield not roundel, tilted fox mask, no petal ring, no text"),
    "Liverpool": crestRecipe("point", "base:a", "bird:s", "red, white, teal; a bird", "bird in flight, not the standing liver bird; no flames, gates or motto"),
    "Manchester City": crestRecipe("tall", "cap:a", "ship:w:a", "sky blue, white, maroon; a ship", "tall shield not roundel, sailing ship alone, no rose, no rivers, no text ring"),
    "Manchester United": crestRecipe("hex", "halves:s", "trident:a", "red, black, gold; devil's fork", "trident only, no devil figure, no ship, no scroll"),
    "Middlesbrough": crestRecipe("roundel", "foot:s", "lion:s:p", "red, white; a lion", "roundel not shield, lion head in profile not full lion, no text"),
    "Southampton": crestRecipe("hex", "wide:s", "halo:g", "red and white stripes; a halo (the Saints)", "hex not shield, halo over a star, no tree, ball, water or text"),
    "Stoke City": crestRecipe("heater", "wide:s", "knot:a", "red and white stripes, blue; a three-loop knot", "shield not rounded badge, open loops, no text band"),
    "Sunderland": crestRecipe("roundel", "stripes:s", "cat:a:w", "red and white stripes; a black cat", "roundel not shield, cat head only, no bridge, pit wheel or lions"),
    "Swansea City": crestRecipe("point", "base:s", "swan:s", "white, black; a swan", "pointed shield not roundel, swan swims left, no text ring"),
    "Tottenham Hotspur": crestRecipe("hex", "field:s rule:a", "cockerel:w:s", "white, navy; a cockerel", "framed hex not free-standing bird, head and breast only, no ball"),
    "Watford": crestRecipe("roundel", "foot:s rule:a", "antlers:s", "yellow, black, red; antlers (the hart)", "roundel not shield, antlers only, no hart head"),
    "West Bromwich Albion": crestRecipe("roundel", "foot:s", "bird:s", "navy and white; a bird", "roundel not shield, bird in flight, no hawthorn branch, no stripes panel"),
    "West Ham United": crestRecipe("roundel", "foot:s rule:a", "hammers:a", "claret, sky blue, gold; hammers", "roundel not shield, two hammers splayed apart, never crossed, no castle"),

    /* LaLiga 2016-17 */
    "Alavés": crestRecipe("tall", "stripes:s foot:k", "raven:#0e1a2b:g", "blue and white stripes; a raven (Vitoria arms)", "tall shield, one raven in flight, no castle, tower, tree or text"),
    "Athletic Club": crestRecipe("roundel", "stripes:s", "tree:#1f7a3a:k", "red and white stripes; an oak tree", "roundel not shield, single tree, no bridge, cross or church"),
    "Atlético Madrid": crestRecipe("roundel", "field:w stripes:p foot:a", "bear@hi:#6b4226:k", "red and white stripes, blue; a bear", "roundel not bell shield, bear head only, blue at the foot not the top, no tree, no stars"),
    "Barcelona": crestRecipe("heater", "stripes5:s catalan:a", "ball:a:p", "blue and garnet stripes, Catalan flag, gold ball", "flag as one full band, no cross, no FCB band, shield not pot shape"),
    "Celta Vigo": crestRecipe("roundel", "foot:s", "cross:a", "sky blue, white, red; a cross", "roundel not shield, plain cross, no text"),
    "Deportivo La Coruña": crestRecipe("heater", "stripes:s", "crown:a:p", "blue and white stripes, gold; a crown", "shield not roundel, vertical stripes not a sash, crown inside not on top"),
    "Eibar": crestRecipe("roundel", "halves:s", "anvil:g", "blue and garnet halves; an anvil (the Armeros)", "roundel not shield, anvil not rifles, no text"),
    "Espanyol": crestRecipe("roundel", "field:w wide:p", "bird:#2fa84f", "blue and white stripes; a parakeet", "roundel not shield, parakeet in flight, no crown, no lettering"),
    "Granada": crestRecipe("hex", "field:s foot:p rule:a", "pomegranate:#b3122a:#f7d27a", "red, white, navy; a pomegranate", "hex not shield, fruit alone, no crown, no hoops panel"),
    "Las Palmas": crestRecipe("heater", "foot:s", "palm:#1f7a3a:#6b4226", "yellow and blue; a palm tree", "shield not roundel, palm tree, no ball, no text"),
    "Leganés": crestRecipe("roundel", "field:s wide:p", "cucumber:a:#1b5e20", "blue and white stripes, green; a cucumber (club nickname)", "roundel not shield, nickname emblem, no lettering"),
    "Málaga": crestRecipe("roundel", "field:s wide:p", "tower:a:s", "sky blue and white stripes, navy; a tower", "roundel not shield, single tower not castle, no crown"),
    "Osasuna": crestRecipe("roundel", "foot:s", "chain:a", "red, navy, gold; chain links", "roundel not shield, loose links, no tree, no text"),
    "Real Betis": crestRecipe("roundel", "stripes:s", "olive:#1f5c33:#f3d470", "green and white stripes; an olive branch", "roundel not shield, no crown, no monogram"),
    "Real Madrid": crestRecipe("heater", "field:w sash:s", "star:a crown@top:a:s", "white, purple, gold; crown on top", "shield not circle, sash runs the other way, star not monogram"),
    "Real Sociedad": crestRecipe("heater", "wide:s", "crown:a:p", "blue and white stripes, gold; a crown", "shield not roundel, crown inside not on top, no ball, no text"),
    "Sevilla": crestRecipe("roundel", "field:w foot:s", "tower:s:w", "white, red; a bell tower", "roundel not shield, city tower not saints, no NO8DO text, no ball"),
    "Sporting Gijón": crestRecipe("roundel", "foot:s", "waves:s", "red and white; sea waves", "roundel not shield, waves not cross, no text"),
    "Valencia": crestRecipe("roundel", "field:w foot:s", "bat:a", "white, orange, black; a bat", "roundel not shield, bat inside and tilted, not spread on top"),
    "Villarreal": crestRecipe("roundel", "foot:s", "submarine:s:w", "yellow and blue; a submarine (club nickname)", "roundel not shield, nickname emblem, no text"),

    /* Bundesliga 2016-17 */
    "Bayern Munich": crestRecipe("heater", "lozenge:s:w", "", "red, blue, white; lozenge field", "shield not roundel, red frame not a text ring, no lettering"),
    "Borussia Dortmund": crestRecipe("heater", "top:s", "cog:s:p", "yellow and black; a pit wheel", "shield not roundel, no letters or year"),
    "Bayer Leverkusen": crestRecipe("hex", "halvesL:s", "lion:w:s", "red and black; a lion", "hex not roundel, lion head in profile not full lion, no cross, no text"),
    "Borussia Mönchengladbach": crestRecipe("roundel", "foot:s rule:a", "horse:s:w", "white, black, green; a foal (club nickname)", "roundel not diamond, horse head, no monogram"),
    "Schalke 04": crestRecipe("heater", "cap:s", "picks:s", "royal blue, white; miners' picks", "shield not roundel, no letters or number"),
    "Mainz 05": crestRecipe("hex", "foot:s", "wheel:s", "red and white; a wheel", "hex not roundel, eight spokes, no number"),
    "Hertha BSC": crestRecipe("roundel", "foot:s", "bear:s:p", "blue and white; a bear", "roundel not flag shape, bear head, no stripes flag, no text"),
    "Wolfsburg": crestRecipe("heater", "cap:s", "wolf:s:a", "green and white; a wolf", "shield not roundel, wolf head, no W"),
    "Hoffenheim": crestRecipe("roundel", "foot:s", "leaf:s:p", "blue and white; a leaf", "roundel not shield, no year or text"),
    "Eintracht Frankfurt": crestRecipe("heater", "field:a foot:p", "eagleR:s", "red, black, white; an eagle", "shield not roundel, eagle faces right, no text"),
    "Werder Bremen": crestRecipe("roundel", "foot:s", "key:a", "green, white, gold; a key", "roundel not diamond, city key, no W"),
    "Hamburg": crestRecipe("heater", "field:s cap:p foot:p", "rhombuses:a:p", "blue, white, black; rhombus", "shield not diamond, three small rhombuses in a row"),
    "FC Augsburg": crestRecipe("hex", "halves:s", "pinecone:a:s", "red, green, white; a pine cone", "hex not shield, no letters"),
    "SC Freiburg": crestRecipe("roundel", "foot:s rule:a", "pine:a:s", "red, black, white; a fir tree", "roundel not shield, forest tree, no letters"),
    "RB Leipzig": crestRecipe("hex", "field:w base:a", "linden:s:w", "white, red, blue; a linden leaf (the city name)", "no bulls, no ball, no sponsor mark"),
    "FC Ingolstadt": crestRecipe("roundel", "halvesL:s", "cat:a:s", "red and black; a panther", "roundel not shield, panther head, no text"),
    "Darmstadt 98": crestRecipe("roundel", "foot:s", "lily:s", "blue and white; a lily", "roundel not shield, no year or text"),
    "1. FC Köln": crestRecipe("roundel", "field:s foot:p", "goat:a:w", "red and white; a goat", "roundel not shield, goat head, no cathedral, no text"),

    /* Serie A 2016-17 */
    "Atalanta": crestRecipe("heater", "wide:s", "apple:g", "blue and black stripes; a golden apple (the myth)", "shield not roundel, no figure or head, no text"),
    "Bologna": crestRecipe("roundel", "wide:s", "tower:a:p", "red and blue stripes, gold; a city tower", "roundel not shield, tower not cross, no text"),
    "Cagliari": crestRecipe("heater", "halves:s", "waves:a", "red and blue halves; sea waves", "shield not roundel, waves not figures, no text"),
    "Chievo": crestRecipe("roundel", "foot:s", "ladder:s", "yellow and blue; a ladder (Verona heritage)", "roundel not shield, no knight, no text"),
    "Crotone": crestRecipe("heater", "halves:s", "column:a", "red and blue halves; a Greek column", "shield not roundel, no text"),
    "Empoli": crestRecipe("roundel", "foot:s", "flask:s", "blue and white; a glass flask (glass-making)", "roundel not shield, no lettering, no chevron"),
    "Fiorentina": crestRecipe("roundel", "foot:s rule:a", "lily:s", "purple, white, gold; a lily", "roundel not shield, white lily on purple, no text"),
    "Genoa": crestRecipe("roundel", "halvesL:s", "cross:a", "red and blue halves; a cross", "roundel not shield, cross not griffin, no text"),
    "Inter Milan": crestRecipe("heater", "stripes:s", "snake:a:k", "blue and black stripes, gold; a snake", "shield not roundel, snake not monogram"),
    "Juventus": crestRecipe("point", "field:w stripes:s", "star@top:a", "black and white stripes, gold", "pointed shield not oval, no bull, star above"),
    "Lazio": crestRecipe("roundel", "foot:s", "eagleR:a", "sky blue, white, gold; an eagle", "roundel not shield, eagle inside facing right, no text"),
    "Milan": crestRecipe("heater", "stripes:s top:a", "cross@peak:p", "red and black stripes; a cross", "shield not roundel, small cross in a top band, no letters"),
    "Napoli": crestRecipe("heater", "foot:s", "volcano:a:s", "sky blue, white, navy; a volcano", "shield not roundel, no N"),
    "Palermo": crestRecipe("roundel", "halves:s", "eagleR:a", "pink and black; an eagle", "roundel not shield, eagle faces right, no text"),
    "Pescara": crestRecipe("heater", "wide:s", "dolphin:a", "sky blue and white stripes; a dolphin", "shield not roundel, dolphin leaps left, no text"),
    "Roma": crestRecipe("roundel", "foot:s rule:a", "wolf:a:p", "crimson, orange, gold; a wolf", "roundel not shield, wolf head, no twins, no letters"),
    "Sampdoria": crestRecipe("roundel", "band:s", "anchor@sm:a", "blue, white band, red; an anchor", "roundel not shield, anchor not sailor, no text"),
    "Sassuolo": crestRecipe("heater", "stripes:s", "tile:w:p", "green and black stripes; a ceramic tile", "shield not roundel, no text"),
    "Torino": crestRecipe("roundel", "foot:s", "bull:a:p", "maroon, white, gold; a bull", "roundel not shield, bull head not rampant bull, no text"),
    "Udinese": crestRecipe("hex", "field:w claws:s", "", "black and white; zebra stripes", "hex not shield, diagonal stripes, no text"),

    /* Ligue 1 2016-17 */
    "Angers": crestRecipe("roundel", "wide:s", "castle:a:s", "black and white stripes, gold; a castle", "roundel not shield, no text"),
    "Bastia": crestRecipe("heater", "foot:s", "ship:s:a", "blue and white; a sailing ship", "shield not roundel, ship not head, no text"),
    "Bordeaux": crestRecipe("roundel", "chevron:s", "star@peak:a", "navy, white; the chevron (scapular V)", "roundel not shield, no letters"),
    "Caen": crestRecipe("roundel", "halves:s", "castle:a:p", "blue and red halves; a castle", "roundel not shield, no text"),
    "Dijon": crestRecipe("heater", "foot:s", "owl:a:#15191c", "red, white; an owl (city symbol)", "shield, owl not lettering"),
    "Guingamp": crestRecipe("roundel", "field:w cap:p rule:s", "ermine:s", "red, black, white; ermine spots", "roundel not shield, no text"),
    "Lille": crestRecipe("heater", "foot:s", "dog:a:s", "red, navy, white; a mastiff (club nickname)", "shield not roundel, dog head, no letters"),
    "Lorient": crestRecipe("hex", "foot:s", "fish:a:s", "orange and black; a fish", "hex not shield, fish swims left, no text"),
    "Lyon": crestRecipe("heater", "field:w cap:s foot:s", "lion:a:w", "white, blue, red; a lion", "shield not roundel, lion head in profile, no monogram"),
    "Marseille": crestRecipe("roundel", "field:w foot:p rule:g", "waves:p", "sky blue and white; sea waves", "roundel not shield, no letters, no star"),
    "Metz": crestRecipe("roundel", "foot:s", "lorraine:a", "maroon, white, gold; cross of Lorraine", "roundel not shield, no dragon, no text"),
    "Monaco": crestRecipe("roundel", "diag:s", "crown@hi:a:p", "red and white diagonal; a crown", "roundel not diamond, crown inside not on top, no letters"),
    "Montpellier": crestRecipe("heater", "halves:s", "sun:w", "blue and orange halves; a sun", "shield not roundel, no figure, no text"),
    "Nancy": crestRecipe("hex", "field:s foot:p", "thistle:#8e5bb5:#2e7d32", "red, white; a thistle", "hex not shield, no text"),
    "Nantes": crestRecipe("heater", "foot:s", "bird:s", "yellow and green; a canary (club nickname)", "shield not roundel, bird in flight, no text"),
    "Nice": crestRecipe("roundel", "stripes:s", "eagleR:a", "red and black stripes; an eagle", "roundel not shield, eagle faces right, no text"),
    "Paris Saint-Germain": crestRecipe("heater", "paleEdge:s:a", "eiffel:a", "navy, red, white; an iron tower", "shield not roundel, tower on the red stripe, no lily, no cradle, no text"),
    "Rennes": crestRecipe("hex", "halvesL:s", "triskell:w:g", "red and black halves; a Breton triskell", "hex not shield, spiral not ermine, no text"),
    "Saint-Étienne": crestRecipe("heater", "cap:s", "picks:s", "green, white; miners' picks", "shield not roundel, no letters"),
    "Toulouse": crestRecipe("heater", "foot:s", "occitan:a", "purple, white, gold; the Occitan cross", "shield, cross not letters")
});

const LEAGUE_FLAG_SHIELD = "M32 18H68V44C68 60 58 68 50 72C42 68 32 60 32 44Z";

const LEAGUE_MARK_RECIPES = Object.freeze({
    premier_league: Object.freeze({ code: "ENG · I", primary: "#3d195b", flag: "england", emblem: "crown" }),
    laliga: Object.freeze({ code: "ESP · I", primary: "#8f0f1a", flag: "spain", emblem: "star" }),
    bundesliga: Object.freeze({ code: "GER · I", primary: "#1b1b1f", flag: "germany", emblem: "star" }),
    serie_a: Object.freeze({ code: "ITA · I", primary: "#0b3a6f", flag: "italy", emblem: "" }),
    ligue_1: Object.freeze({ code: "FRA · I", primary: "#0b1f4a", flag: "france", emblem: "star" })
});

const LEAGUE_FLAGS = Object.freeze({
    england: `<rect x="32" y="18" width="36" height="60" fill="#f5f5f5"/><rect x="46" y="18" width="8" height="60" fill="#ce1124"/><rect x="32" y="36" width="36" height="8" fill="#ce1124"/>`,
    spain: `<rect x="32" y="18" width="36" height="60" fill="#c60b1e"/><rect x="32" y="33" width="36" height="22" fill="#ffc400"/>`,
    germany: `<rect x="32" y="18" width="36" height="60" fill="#dd0000"/><rect x="32" y="18" width="36" height="14" fill="#111"/><rect x="32" y="46" width="36" height="32" fill="#ffce00"/>`,
    italy: `<rect x="32" y="18" width="12" height="60" fill="#009246"/><rect x="44" y="18" width="12" height="60" fill="#f4f5f0"/><rect x="56" y="18" width="12" height="60" fill="#ce2b37"/>`
});

function buildLeagueMarkSvg(recipe, idPrefix){
    let inner;
    if(recipe.flag === "france"){
        inner = `<rect x="28" y="26" width="14" height="36" rx="3" fill="#2d5bd6"/><rect x="43" y="26" width="14" height="36" rx="3" fill="#f4f5f0"/><rect x="58" y="26" width="14" height="36" rx="3" fill="#e1343f"/>${crestStar(50, 17, 7, "#d9b54a")}`;
    }else{
        inner = `<clipPath id="${idPrefix}f"><path d="${LEAGUE_FLAG_SHIELD}"/></clipPath><g clip-path="url(#${idPrefix}f)">${LEAGUE_FLAGS[recipe.flag] || ""}</g><path d="${LEAGUE_FLAG_SHIELD}" fill="none" stroke="#f3d470" stroke-width="1.5"/>`;
        if(recipe.emblem === "crown"){
            inner += `<g transform="translate(35 -3) scale(.25)">${CREST_MOTIFS.crown("#d9b54a", recipe.primary)}</g>`;
        }else if(recipe.emblem === "star"){
            inner += crestStar(50, 11, 6, "#d9b54a");
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><linearGradient id="${idPrefix}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>`
        + `<rect x="4" y="4" width="92" height="92" rx="20" fill="#c69a34"/><rect x="8" y="8" width="84" height="84" rx="17" fill="${recipe.primary}"/>${inner}`
        + `<rect x="8" y="8" width="84" height="84" rx="17" fill="url(#${idPrefix}t)"/>`
        + `<text x="50" y="87" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="800" letter-spacing="2" fill="#fff">${escapeClubIdentityXml(recipe.code)}</text></svg>`;
}

function getLeagueMark(leagueId){
    const id = String(leagueId || "").trim();
    const recipe = Object.prototype.hasOwnProperty.call(LEAGUE_MARK_RECIPES, id) ? LEAGUE_MARK_RECIPES[id] : null;
    if(!recipe){ return null; }
    const svg = buildLeagueMarkSvg(recipe, nextCrestIdPrefix());
    return Object.freeze({
        id,
        code: recipe.code,
        primary: recipe.primary,
        svg,
        image: toSvgDataUri(buildLeagueMarkSvg(recipe, "lm"))
    });
}

function applyLeagueMark(element, leagueId){
    if(!element){ return; }
    const mark = getLeagueMark(leagueId);
    if(!mark){
        delete element.dataset.leagueMark;
        element.style.removeProperty("--league-mark-image");
        return;
    }
    element.dataset.leagueMark = "original";
    element.style.setProperty("--league-mark-image", mark.image);
}

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
    const name = String(clubName || "").trim();
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
