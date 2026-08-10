/* Career Mode Showdown v1.0.1 — canonical FIFA 17 Transfer Challenge options.
Historical cross-check: FIFA Index leagues/nations, FIFPlay leagues/teams, FIFA U Team historical list.
Showdown League Wheel remains the locked top-five pool; these options are Transfer metadata only. */

const FIFA17_TRANSFER_LEAGUES = Object.freeze([{"id":"argentina-primera-division","label":"Primera División","country":"Argentina","tier":1,"aliases":["Argentina Primera Division","Primera Division Argentina"]},{"id":"australia-a-league","label":"Hyundai A-League","country":"Australia","tier":1,"aliases":["A-League","A League","Hyundai A League"]},{"id":"austria-bundesliga","label":"Austrian Bundesliga","country":"Austria","tier":1,"aliases":["Austria Bundesliga","Österreichische Bundesliga"]},{"id":"belgium-pro-league","label":"Pro League","country":"Belgium","tier":1,"aliases":["Belgium Pro League","Jupiler Pro League"]},{"id":"brazil-serie-a","label":"Série A","country":"Brazil","tier":1,"aliases":["Serie A Brazil","Campeonato Brasileiro","Brazil Serie A"]},{"id":"chile-campeonato-nacional","label":"Campeonato Nacional Scotiabank","country":"Chile","tier":1,"aliases":["Campeonato Scotiabank","Chile Primera Division"]},{"id":"colombia-liga-dimayor","label":"Liga DiMayor","country":"Colombia","tier":1,"aliases":["Liga Dimayor","Liga Aguila","Colombia Primera A"]},{"id":"denmark-superliga","label":"Alka Superliga","country":"Denmark","tier":1,"aliases":["Superliga","Danish Superliga"]},{"id":"england-premier-league","label":"Premier League","country":"England","tier":1,"aliases":["English Premier League","EPL"]},{"id":"england-championship","label":"Football League Championship","country":"England","tier":2,"aliases":["EFL Championship","Championship"]},{"id":"england-league-one","label":"Football League 1","country":"England","tier":3,"aliases":["EFL League One","League One"]},{"id":"england-league-two","label":"Football League 2","country":"England","tier":4,"aliases":["EFL League Two","League Two"]},{"id":"france-ligue-1","label":"Ligue 1","country":"France","tier":1,"aliases":["French Ligue 1"]},{"id":"france-ligue-2","label":"Ligue 2","country":"France","tier":2,"aliases":["Domino's Ligue 2","French Ligue 2"]},{"id":"germany-bundesliga","label":"1. Bundesliga","country":"Germany","tier":1,"aliases":["Bundesliga","German Bundesliga"]},{"id":"germany-2-bundesliga","label":"2. Bundesliga","country":"Germany","tier":2,"aliases":["Bundesliga 2","2 Bundesliga","German 2. Bundesliga"]},{"id":"netherlands-eredivisie","label":"Eredivisie","country":"Netherlands","tier":1,"aliases":["Holland Eredivisie","Dutch Eredivisie"]},{"id":"italy-serie-a","label":"TIM Serie A","country":"Italy","tier":1,"aliases":["Serie A","Calcio A","Italian Serie A"]},{"id":"italy-serie-b","label":"Serie B","country":"Italy","tier":2,"aliases":["Calcio B","Italian Serie B"]},{"id":"japan-j1-league","label":"Meiji J1 League","country":"Japan","tier":1,"aliases":["Meiji Yasuda J1 League","J1 League","J-League"]},{"id":"korea-k-league-classic","label":"K-League Classic","country":"Korea Republic","tier":1,"aliases":["K League Classic","K-League","K League"]},{"id":"mexico-liga-mx","label":"Liga MX","country":"Mexico","tier":1,"aliases":["Mexican Liga MX"]},{"id":"norway-tippeligaen","label":"Tippeligaen","country":"Norway","tier":1,"aliases":["Norwegian Tippeligaen","Eliteserien"]},{"id":"poland-ekstraklasa","label":"T-Mobile Ekstraklasa","country":"Poland","tier":1,"aliases":["Ekstraklasa","Polish Ekstraklasa"]},{"id":"portugal-liga-nos","label":"Liga NOS","country":"Portugal","tier":1,"aliases":["Portuguese Liga NOS","Primeira Liga"]},{"id":"ireland-airtricity-league","label":"Airtricity League","country":"Republic of Ireland","tier":1,"aliases":["SSE Airtricity League","League of Ireland"]},{"id":"russia-premier-league","label":"Russian Premier League","country":"Russia","tier":1,"aliases":["Sogaz Russian Football Championship","Russian Football Premier League"]},{"id":"saudi-dawry-jameel","label":"Dawry Jameel League","country":"Saudi Arabia","tier":1,"aliases":["Abdul Latif Jameel League","ALJ League","Saudi Pro League"]},{"id":"scotland-premiership","label":"Scottish Premiership","country":"Scotland","tier":1,"aliases":["Scotland Premiership"]},{"id":"spain-primera-division","label":"Primera División","country":"Spain","tier":1,"aliases":["LaLiga","La Liga","Liga BBVA","Spanish Primera Division"]},{"id":"spain-segunda-a","label":"Segunda A","country":"Spain","tier":2,"aliases":["LaLiga 2","La Liga 2","Liga Adelante","Spanish Segunda Division"]},{"id":"sweden-allsvenskan","label":"Allsvenskan","country":"Sweden","tier":1,"aliases":["Swedish Allsvenskan"]},{"id":"switzerland-super-league","label":"Super League","country":"Switzerland","tier":1,"aliases":["Raiffeisen Super League","Swiss Super League"]},{"id":"turkey-super-lig","label":"Süper Lig","country":"Turkey","tier":1,"aliases":["Super Lig","Turkish Super Lig"]},{"id":"usa-major-league-soccer","label":"Major League Soccer","country":"United States","tier":1,"aliases":["MLS"]},{"id":"rest-of-world","label":"Rest of World","country":"Other","tier":null,"aliases":["ROTW","Other League","Other","Rest Of World"]}].map(option => Object.freeze(option)));

const FIFA17_NATIONALITY_LABELS = Object.freeze(["Afghanistan","Albania","Algeria","Angola","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bolivia","Bosnia & Herzegovina","Brazil","Bulgaria","Burkina Faso","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China PR","Chinese Taipei","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czech Republic","Denmark","Dominican Republic","DR Congo","Ecuador","Egypt","El Salvador","England","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Faroe Islands","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Grenada","Guam","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Iran","Iraq","Israel","Italy","Ivory Coast","Jamaica","Japan","Kazakhstan","Kenya","Korea DPR","Kosovo","Kuwait","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova","Montenegro","Montserrat","Morocco","Mozambique","Namibia","Netherlands","New Caledonia","New Zealand","Niger","Nigeria","FYR Macedonia","Northern Ireland","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Republic of Ireland","Korea Republic","Romania","Russia","San Marino","São Tomé & Príncipe","Saudi Arabia","Scotland","Senegal","Serbia","Sierra Leone","Slovakia","Slovenia","Somalia","South Africa","Spain","St Kitts and Nevis","St Lucia","St Vincent and the Grenadines","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania","Timor-Leste","Togo","Trinidad & Tobago","Tunisia","Turkey","Uganda","Ukraine","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Wales","Zambia","Zimbabwe"]);
const FIFA17_NATIONALITY_ALIASES = Object.freeze({"bosnia-herzegovina":["Bosnia and Herzegovina","Bosnia Herzegovina"],"central-african-republic":["Central African Rep.","Central African Rep"],"china-pr":["China","PR China"],"chinese-taipei":["Taiwan"],"curacao":["Curaçao","Curacao"],"czech-republic":["Czechia"],"dr-congo":["Congo DR","Democratic Republic of Congo","Congo Kinshasa"],"equatorial-guinea":["Eq. Guinea"],"fyr-macedonia":["Macedonia","North Macedonia","FYR Macedonia"],"guinea-bissau":["Guinea Bissau"],"ivory-coast":["Côte d'Ivoire","Cote d'Ivoire","Côte d’Ivoire"],"korea-dpr":["North Korea","Korea DPR"],"korea-republic":["South Korea","Republic of Korea","Korea Republic"],"republic-of-ireland":["Ireland","Rep. Ireland","Republic Ireland"],"sao-tome-principe":["São Tomé & Príncipe","Sao Tome and Principe","Sao Tome & Principe"],"st-kitts-and-nevis":["St Kitts Nevis","Saint Kitts and Nevis"],"st-lucia":["Saint Lucia"],"st-vincent-and-the-grenadines":["St Vincent Grenadine","Saint Vincent and the Grenadines"],"turkey":["Türkiye","Turkiye"],"united-states":["USA","United States of America","US"]});

function transferOptionSlug(value){
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getNationalityId(label){
    const overrides = {
        "bosnia-and-herzegovina": "bosnia-herzegovina",
        "sao-tome-and-principe": "sao-tome-principe"
    };
    const slug = transferOptionSlug(label);
    return overrides[slug] || slug;
}

const FIFA17_TRANSFER_NATIONALITIES = Object.freeze(
    FIFA17_NATIONALITY_LABELS.map(label => {
        const id = getNationalityId(label);
        return Object.freeze({
            id,
            label,
            aliases: Object.freeze([...(FIFA17_NATIONALITY_ALIASES[id] || [])])
        });
    })
);

function normalizeTransferOptionText(value){
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function buildTransferOptionIndex(options){
    const index = new Map();
    options.forEach(option => {
        [option.id, option.label, option.country, ...(option.aliases || [])]
            .filter(Boolean)
            .forEach(value => {
                const key = normalizeTransferOptionText(value);
                if(key && !index.has(key)){ index.set(key, option); }
            });
    });
    return index;
}

const FIFA17_TRANSFER_LEAGUE_INDEX = buildTransferOptionIndex(FIFA17_TRANSFER_LEAGUES);
const FIFA17_TRANSFER_NATIONALITY_INDEX = buildTransferOptionIndex(FIFA17_TRANSFER_NATIONALITIES);

function resolveFifa17TransferOption(kind, value){
    const options = kind === "league"
        ? FIFA17_TRANSFER_LEAGUES
        : kind === "nationality"
            ? FIFA17_TRANSFER_NATIONALITIES
            : [];
    const direct = options.find(option => option.id === value);
    if(direct){ return direct; }
    const index = kind === "league" ? FIFA17_TRANSFER_LEAGUE_INDEX : FIFA17_TRANSFER_NATIONALITY_INDEX;
    return index.get(normalizeTransferOptionText(value)) || null;
}

function getFifa17TransferOptions(kind){
    if(kind === "league"){ return FIFA17_TRANSFER_LEAGUES; }
    if(kind === "nationality"){ return FIFA17_TRANSFER_NATIONALITIES; }
    return [];
}

function getFifa17TransferOptionLabel(kind, value){
    const option = resolveFifa17TransferOption(kind, value);
    return option ? option.label : String(value || "");
}

window.FIFA17_TRANSFER_LEAGUES = FIFA17_TRANSFER_LEAGUES;
window.FIFA17_TRANSFER_NATIONALITIES = FIFA17_TRANSFER_NATIONALITIES;
window.getFifa17TransferOptions = getFifa17TransferOptions;
window.resolveFifa17TransferOption = resolveFifa17TransferOption;
window.getFifa17TransferOptionLabel = getFifa17TransferOptionLabel;
window.normalizeTransferOptionText = normalizeTransferOptionText;
