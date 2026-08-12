const SUBJECT_SAFE_CLEAN_ANCHOR = Object.freeze({
    mode: "subject-safe",
    treatment: "clean-anchor",
    fit: "contain",
    position: "50% 50%",
    maxCropFraction: 0,
    rejectPortraitCover: true
});

const FOOTBALL_VISUALS = Object.freeze({
    james: Object.freeze({
        id: "james-rodriguez-world-cup-2014-v113",
        src: "assets/football/james-rodriguez-world-cup-2014-v113.webp",
        subject: "James Rodríguez",
        context: "World Cup · Colombia · 2014",
        alt: "James Rodríguez representing Colombia at the 2014 FIFA World Cup",
        author: "Copa2014.gov.br",
        license: "CC BY 3.0 BR",
        source: "https://commons.wikimedia.org/wiki/File:James_Rodríguez_(cropped).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/br/deed.en",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    rashford: Object.freeze({
        id: "marcus-rashford-chelsea-2017-v113",
        src: "assets/football/marcus-rashford-chelsea-2017-v113.webp",
        subject: "Marcus Rashford",
        context: "Manchester United · Chelsea 2–0 · 2017",
        alt: "Marcus Rashford playing for Manchester United against Chelsea at Old Trafford in April 2017",
        author: "Ardfern",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Manchester_United_v_Chelsea,_16_April_2017_(11).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    martial: Object.freeze({
        id: "anthony-martial-cska-2017-v113",
        src: "assets/football/anthony-martial-cska-2017-v113.webp",
        subject: "Anthony Martial",
        context: "Manchester United · Champions League · 2017",
        alt: "Anthony Martial playing for Manchester United against CSKA Moscow in September 2017",
        author: "Дмитрий Голубович",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Anthony_Martial_27_September_2017_cropped.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    messi: Object.freeze({
        id: "lionel-messi-barcelona-2016-subject-r4",
        src: "assets/football/lionel-messi-barcelona-2016-subject-r4.webp",
        subject: "Lionel Messi",
        context: "FC Barcelona · 2016",
        alt: "Lionel Messi with FC Barcelona before Al-Ahli v Barcelona in December 2016",
        author: "Save the Dream / derivative by SdHb",
        license: "CC BY 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Leo_Messi_2016.PNG",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
        framing: Object.freeze({
            mode: "subject-safe",
            treatment: "classic-overlay",
            fit: "contain",
            position: "50% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    }),
    lahm: Object.freeze({
        id: "philipp-lahm-world-cup-2014-focus-r4",
        src: "assets/football/philipp-lahm-world-cup-2014-focus-r4.webp",
        subject: "Philipp Lahm",
        context: "World Champion · 2014",
        alt: "Philipp Lahm lifting the 2014 FIFA World Cup trophy",
        author: "Agência Brasil",
        license: "CC BY 3.0 BR",
        source: "https://commons.wikimedia.org/wiki/File:Philipp_Lahm_lifts_the_2014_FIFA_World_Cup.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/br/deed.en",
        framing: Object.freeze({
            mode: "subject-safe",
            treatment: "classic-overlay",
            fit: "contain",
            position: "50% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    }),
    ronaldo: Object.freeze({
        id: "cristiano-ronaldo-euro-2016-v113",
        src: "assets/football/cristiano-ronaldo-euro-2016-v113.webp",
        subject: "Cristiano Ronaldo",
        context: "Portugal · Euro 2016",
        alt: "Cristiano Ronaldo playing for Portugal at UEFA Euro 2016",
        author: "Chensiyuan",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Euro_2016_Cristiano_Ronaldo.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    pogba: Object.freeze({
        id: "paul-pogba-man-utd-2016-v113",
        src: "assets/football/paul-pogba-man-utd-2016-v113.webp",
        subject: "Paul Pogba",
        context: "Manchester United · 2016",
        alt: "Paul Pogba playing for Manchester United at Old Trafford in September 2016",
        author: "Ardfern / derivative by Danyele",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(07)_-_Paul_Pogba_(edited).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    zlatan: Object.freeze({
        id: "zlatan-ibrahimovic-man-utd-2016-v113",
        src: "assets/football/zlatan-ibrahimovic-man-utd-2016-v113.webp",
        subject: "Zlatan Ibrahimović",
        context: "Manchester United · 2016",
        alt: "Zlatan Ibrahimović playing for Manchester United at Old Trafford in September 2016",
        author: "Ardfern / derivative by Danyele",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(08)_-_Zlatan_Ibrahimović_(edited).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    griezmann: Object.freeze({
        id: "antoine-griezmann-atletico-2016-v113",
        src: "assets/football/antoine-griezmann-atletico-2016-v113.webp",
        subject: "Antoine Griezmann",
        context: "Atlético Madrid · Champions League · 2016",
        alt: "Antoine Griezmann playing for Atlético Madrid in the UEFA Champions League in October 2016",
        author: "Светлана Бекетова",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Antoine_Griezmann_2016.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    neymar: Object.freeze({
        id: "neymar-brazil-olympic-gold-2016-v113",
        src: "assets/football/neymar-brazil-olympic-gold-2016-v113.webp",
        subject: "Neymar",
        context: "Brazil · Olympic Gold Final · 2016",
        alt: "Neymar during Brazil's Olympic football gold-medal final against Germany in Rio in August 2016",
        author: "Fernando Frazão/Agência Brasil",
        license: "CC BY 3.0 BR",
        source: "https://commons.wikimedia.org/wiki/File:Brasil_conquista_primeiro_ouro_olímpico_no_futebol_1039247-20082016-_mg_3424.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/br/deed.en",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    balotelli: Object.freeze({
        id: "mario-balotelli-euro-2012-celebration-v113",
        src: "assets/football/mario-balotelli-euro-2012-celebration-v113.webp",
        subject: "Mario Balotelli",
        context: "Italy · Euro Semi-Final · 2012",
        alt: "Italy celebrating Mario Balotelli's second goal against Germany in the UEFA Euro 2012 semi-final",
        author: "Joern Fehrmann",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Balotelli_2nd_goal_celebration_-_Euro_2012.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    }),
    falcao: Object.freeze({
        id: "radamel-falcao-europa-league-2012-v113",
        src: "assets/football/radamel-falcao-europa-league-2012-v113.webp",
        subject: "Radamel Falcao",
        context: "Atlético Madrid · Europa League Champion · 2012",
        alt: "Radamel Falcao celebrating Atlético Madrid's 2012 Europa League title in Madrid",
        author: "Juanca Parce",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Falcao_Celebración_Europa_League_2012.JPG",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        framing: SUBJECT_SAFE_CLEAN_ANCHOR
    })
});

const FOOTBALL_VISUAL_SCREEN_PLAN = Object.freeze({
    createShowdown: Object.freeze({ kind: "single", assets: ["james"], tone: "light", label: "BUILD THE NEXT RIVALRY", layout: "portrait-feature" }),
    leagueWheelScreen: Object.freeze({ kind: "single", assets: ["ronaldo"], tone: "dark", label: "FIND YOUR STAGE", layout: "cinematic-band" }),
    clubWheelScreen: Object.freeze({ kind: "single", assets: ["pogba"], tone: "blue", label: "CLUB IDENTITY", layout: "cinematic-band" }),
    dashboard: Object.freeze({ kind: "single", assets: ["zlatan"], tone: "dark", label: "RIVALRY HEADQUARTERS", layout: "cinematic-band" }),
    transferChallenge: Object.freeze({ kind: "duo", assets: ["rashford", "martial"], tone: "dark", label: "TRANSFER WINDOW", layout: "duo-subject-safe" }),
    seasonEntry: Object.freeze({ kind: "single", assets: ["griezmann"], tone: "blue", label: "SEASON PRESSURE", layout: "cinematic-band" }),
    seasonSummary: Object.freeze({ kind: "single", assets: ["neymar"], tone: "dark", label: "SEASON VERDICT", layout: "cinematic-band" }),
    careerStatistics: Object.freeze({ kind: "single", assets: ["messi"], tone: "blue", label: "CAREER PERFORMANCE", layout: "analytics-subject-safe" }),
    trophyRoom: Object.freeze({ kind: "single", assets: ["lahm"], tone: "dark", label: "CHAMPIONS ARE REMEMBERED", layout: "trophy-subject-safe" }),
    legacy: Object.freeze({ kind: "single", assets: ["falcao"], tone: "dark", label: "LEGACY", layout: "cinematic-band" }),
    ruleBook: Object.freeze({ kind: "single", assets: ["balotelli"], tone: "light", label: "RULES OF THE GAME", layout: "cinematic-band" })
});

window.FOOTBALL_VISUALS = FOOTBALL_VISUALS;
window.FOOTBALL_VISUAL_SCREEN_PLAN = FOOTBALL_VISUAL_SCREEN_PLAN;