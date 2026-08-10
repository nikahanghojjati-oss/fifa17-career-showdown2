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
        id: "marcus-rashford-man-utd-feyenoord-2016",
        src: "assets/football/marcus-rashford-man-utd-feyenoord-2016.webp",
        subject: "Marcus Rashford",
        context: "Manchester United · 2016",
        alt: "Marcus Rashford playing for Manchester United against Feyenoord at Old Trafford in November 2016",
        author: "Ardfern",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Manchester_United_v_Feyenoord,_November_2016_(23).JPG",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        framing: Object.freeze({
            mode: "subject-safe",
            fit: "contain",
            position: "70% 50%",
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
        id: "lionel-messi-barcelona-2016-r4",
        src: "assets/football/lionel-messi-barcelona-2016-r4.webp",
        subject: "Lionel Messi",
        context: "FC Barcelona · 2016",
        alt: "Lionel Messi playing for FC Barcelona at Al-Ahli v Barcelona in December 2016",
        author: "Save the Dream",
        license: "CC BY 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Save_the_Dream_at_the_Match_of_champions_(31067838784).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
        framing: Object.freeze({
            mode: "subject-safe",
            fit: "contain",
            position: "68% 50%",
            maxCropFraction: 0,
            rejectPortraitCover: true
        })
    }),
    lahm: Object.freeze({
        id: "philipp-lahm-world-cup-2014",
        src: "assets/football/philipp-lahm-world-cup-2014.webp",
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
