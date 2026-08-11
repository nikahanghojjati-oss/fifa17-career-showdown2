const FOOTBALL_VISUALS = Object.freeze({
    james: Object.freeze({
        id: "james-rodriguez-real-madrid-2016-r4",
        src: "assets/football/james-rodriguez-real-madrid-2016-r4.webp",
        subject: "James Rodríguez",
        context: "Real Madrid · 2016",
        alt: "James Rodríguez after Real Madrid played Borussia Dortmund in September 2016",
        author: "Real Madrid",
        license: "CC BY 3.0",
        source: "https://commons.wikimedia.org/wiki/File:James_Rodr%C3%ADguez_in_September_2016_-_01.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
        framing: Object.freeze({
            mode: "subject-safe",
            fit: "contain",
            position: "76% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    }),
    rashford: Object.freeze({
        id: "marcus-rashford-man-utd-2016-r4",
        src: "assets/football/marcus-rashford-man-utd-2016-r4.webp",
        subject: "Marcus Rashford",
        context: "Manchester United · 2016",
        alt: "Marcus Rashford playing for Manchester United against Zorya Luhansk at Old Trafford in September 2016",
        author: "Ardfern",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Marcus_Rashford_September_2016_(cropped).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: Object.freeze({
            mode: "subject-safe",
            fit: "contain",
            position: "50% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    }),
    martial: Object.freeze({
        id: "anthony-martial-man-utd-2015-r4",
        src: "assets/football/anthony-martial-man-utd-2015-r4.webp",
        subject: "Anthony Martial",
        context: "Manchester United · 2015",
        alt: "Anthony Martial playing for Manchester United against CSKA Moscow in October 2015",
        author: "Dmitry Golubovich",
        license: "CC BY-SA 2.5",
        source: "https://commons.wikimedia.org/wiki/File:Anthony_Martial_2015.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5/",
        framing: Object.freeze({
            mode: "subject-safe",
            fit: "contain",
            position: "70% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
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
            fit: "contain",
            position: "50% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    })
});

const FOOTBALL_VISUAL_SCREEN_PLAN = Object.freeze({
    createShowdown: Object.freeze({ kind: "single", assets: ["james"], tone: "light", label: "BUILD THE NEXT RIVALRY", layout: "portrait-feature" }),
    transferChallenge: Object.freeze({ kind: "duo", assets: ["rashford", "martial"], tone: "dark", label: "TRANSFER WINDOW", layout: "duo-subject-safe" }),
    careerStatistics: Object.freeze({ kind: "single", assets: ["messi"], tone: "blue", label: "CAREER PERFORMANCE", layout: "analytics-subject-safe" }),
    trophyRoom: Object.freeze({ kind: "single", assets: ["lahm"], tone: "dark", label: "CHAMPIONS ARE REMEMBERED", layout: "trophy-subject-safe" })
});

window.FOOTBALL_VISUALS = FOOTBALL_VISUALS;
window.FOOTBALL_VISUAL_SCREEN_PLAN = FOOTBALL_VISUAL_SCREEN_PLAN;
