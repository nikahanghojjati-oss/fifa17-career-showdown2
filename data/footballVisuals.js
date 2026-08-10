/* =====================================================
   Career Mode Showdown v1.0.1
   Licensed football photography manifest
   Presentation-only data. No gameplay state.
===================================================== */

const FOOTBALL_VISUALS = Object.freeze({
    james: Object.freeze({
        id: "james-rodriguez-real-madrid-2016",
        src: "assets/football/james-rodriguez-real-madrid-2016.webp",
        subject: "James Rodríguez",
        context: "Real Madrid · 2016",
        alt: "James Rodríguez during his Real Madrid period in 2016",
        author: "Real Madrid",
        license: "CC BY 3.0",
        source: "https://commons.wikimedia.org/wiki/File:James_Rodr%C3%ADguez_in_September_2016_-_02.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
        position: "50% 18%"
    }),
    rashford: Object.freeze({
        id: "marcus-rashford-man-utd-2016",
        src: "assets/football/marcus-rashford-man-utd-2016.webp",
        subject: "Marcus Rashford",
        context: "Manchester United · 2016",
        alt: "Marcus Rashford warming up for Manchester United in 2016",
        author: "Egghead06",
        license: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Marcus_Rashford.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        position: "50% 18%"
    }),
    martial: Object.freeze({
        id: "anthony-martial-man-utd-2017",
        src: "assets/football/anthony-martial-man-utd-2017.webp",
        subject: "Anthony Martial",
        context: "Manchester United · 2017",
        alt: "Anthony Martial playing for Manchester United against CSKA Moscow in 2017",
        author: "Dmitry Golubovich",
        license: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Anthony_Martial_27_September_2017.jpg",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        position: "50% 28%"
    }),
    messi: Object.freeze({
        id: "lionel-messi-barcelona-2016",
        src: "assets/football/lionel-messi-barcelona-2016.webp",
        subject: "Lionel Messi",
        context: "FC Barcelona · 2016",
        alt: "Lionel Messi with FC Barcelona in December 2016",
        author: "Save the Dream",
        license: "CC BY 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Save_the_Dream_at_the_Match_of_Champions_(31791513341).jpg",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
        position: "55% 10%"
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
        position: "50% 42%"
    })
});

const FOOTBALL_VISUAL_SCREEN_PLAN = Object.freeze({
    createShowdown: Object.freeze({ kind: "single", assets: ["james"], tone: "light", label: "BUILD THE NEXT RIVALRY" }),
    transferChallenge: Object.freeze({ kind: "duo", assets: ["rashford", "martial"], tone: "dark", label: "TRANSFER WINDOW" }),
    careerStatistics: Object.freeze({ kind: "single", assets: ["messi"], tone: "blue", label: "CAREER PERFORMANCE" }),
    trophyRoom: Object.freeze({ kind: "single", assets: ["lahm"], tone: "dark", label: "CHAMPIONS ARE REMEMBERED" })
});

window.FOOTBALL_VISUALS = FOOTBALL_VISUALS;
window.FOOTBALL_VISUAL_SCREEN_PLAN = FOOTBALL_VISUAL_SCREEN_PLAN;
