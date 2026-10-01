/* =====================================================
   Career Mode Showdown
   League Marks V2 — candidate set (NOT wired into the app)

   Owner direction: one dominant, bold, original symbol per league,
   single solid colour, no flags or stripes. Two options per league.
   Each mark is drawn on a 100x100 grid as a single-colour silhouette
   (negative-space cuts use fill-rule evenodd) so it reads as solid
   gold on black (unselected wedge) or near-black on gold (selected).

   Originality guard: these evoke the league (crown, bull, eagle,
   scudetto, numeral 1 ...) without tracing any official league logo.
   No crowned lion head, no split-L stroke, no red-box player, no
   ribbon "A", no Ligue 1 lockup.

   API mirrors js/visualIdentity.js getLeagueMark/applyLeagueMark:
     getLeagueMarkV2(leagueId, option = "a", tone = "gold")
       -> frozen { id, option, code, name, primary, tone, svg, image }
     applyLeagueMarkV2(element, leagueId, option, tone)
   Wrapped in an IIFE so loading it next to visualIdentity.js never
   collides with the live globals.
===================================================== */
(function(root){
    "use strict";

    const LEAGUE_MARK_V2_TONES = Object.freeze({
        gold: "#e2b84a",
        ink: "#121212"
    });

    function star(cx, cy, outer, inner, rotationDeg){
        const points = [];
        const start = (rotationDeg || 0) - 90;
        for(let index = 0; index < 10; index += 1){
            const radius = index % 2 === 0 ? outer : inner;
            const angle = (start + index * 36) * Math.PI / 180;
            points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`);
        }
        return `M${points.join("L")}Z`;
    }

    function circle(cx, cy, r){
        return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
    }

    function mirrorX(d){
        /* Mirrors an absolute M/L/C/Z path around x = 50. */
        return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (match, x, y) => `${(100 - Number(x)).toFixed(2).replace(/\.00$/, "")} ${y}`);
    }

    function ray(cx, cy, angleDeg, innerR, outerR, halfWidthDeg){
        const toPoint = (r, a) => {
            const rad = a * Math.PI / 180;
            return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
        };
        return `M${toPoint(innerR, angleDeg - halfWidthDeg)}L${toPoint(outerR, angleDeg)}L${toPoint(innerR, angleDeg + halfWidthDeg)}Z`;
    }

    function leaf(cx, cy, length, width, angleDeg){
        /* Pointed almond leaf centred on (cx, cy) along angleDeg. */
        const rad = angleDeg * Math.PI / 180;
        const ux = Math.cos(rad);
        const uy = Math.sin(rad);
        const px = -uy;
        const py = ux;
        const h = length / 2;
        const w = width / 2;
        const f = (n) => n.toFixed(2);
        const tipA = [cx - ux * h, cy - uy * h];
        const tipB = [cx + ux * h, cy + uy * h];
        return `M${f(tipA[0])} ${f(tipA[1])}`
            + `Q${f(cx + px * w * 2)} ${f(cy + py * w * 2)} ${f(tipB[0])} ${f(tipB[1])}`
            + `Q${f(cx - px * w * 2)} ${f(cy - py * w * 2)} ${f(tipA[0])} ${f(tipA[1])}Z`;
    }

    /* ---------- Premier League ---------- */

    /* A: the Crown. Three heavy points with orb tips over a solid band. */
    const plCrown = [
        { d: "M16 62L20 30L36 47L50 20L64 47L80 30L84 62Z" + star(50, 50, 8, 3.6, 0), rule: "evenodd" },
        { d: circle(20, 25, 7) + circle(50, 15, 7.5) + circle(80, 25, 7) },
        { d: "M16 67H84V76Q84 82 78 82H22Q16 82 16 76Z" }
    ];

    /* B: the Lion in profile. Faceted head facing left, saw-tooth mane,
       no crown, no frontal face. */
    const plLion = [
        {
            d: "M34 20L44 9L52 16L60 5L67 15L79 9L79 23L93 23L87 35L97 44L87 52L95 62L83 66L87 80L73 78L71 92L59 84L49 95L42 83"
                + "L30 81L21 73L28 66L14 63L9 55L13 46L21 40L25 30Z"
                + "M37 19C53 33 53 65 39 81L44 81C58 65 58 33 42 18Z"
                + "M24 43L37 40L30 48Z",
            rule: "evenodd"
        }
    ];

    /* ---------- LaLiga ---------- */

    /* A: the Toro. Frontal bull head, sweeping horns, cut eyes and nostrils. */
    const llBull = [
        { d: "M6 12C8 34 20 44 38 44L62 44C80 44 92 34 94 12C85 25 74 32 62 32L38 32C26 32 15 25 6 12Z" },
        { d: "M20 38L33 38L33 50Z" + mirrorX("M20 38L33 38L33 50Z") },
        {
            d: "M30 36L70 36L67 62L61 88L39 88L33 62Z"
                + "M37 50L47 54L39 58Z" + mirrorX("M37 50L47 54L39 58Z")
                + circle(44, 78, 3.4) + circle(56, 78, 3.4),
            rule: "evenodd"
        }
    ];

    /* B: the Sol. A football-centred sun: heavy rays around a ball with a
       pentagon cut (nods to the 2016-17 petal-ball era, no petals copied). */
    const llSunRays = [];
    for(let index = 0; index < 12; index += 1){
        const long = index % 2 === 0;
        llSunRays.push(ray(50, 50, index * 30 - 90, 24, long ? 47 : 39, long ? 9 : 8));
    }
    function pentagon(cx, cy, r, rotationDeg){
        const pts = [];
        for(let index = 0; index < 5; index += 1){
            const a = (rotationDeg - 90 + index * 72) * Math.PI / 180;
            pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
        }
        return `M${pts.join("L")}Z`;
    }
    const llSun = [
        { d: llSunRays.join("") },
        { d: circle(50, 50, 25) + circle(50, 50, 21) + circle(50, 50, 17.5) + pentagon(50, 50, 8, 0), rule: "evenodd" }
    ];

    /* ---------- Bundesliga ---------- */

    /* A: the Adler. Spread eagle, head turned left, stepped feather fingers. */
    const blWingLeft = "M42 27L10 18L12 30L6 33L13 42L8 47L17 54L13 59L26 63L42 55Z";
    const blEagle = [
        { d: blWingLeft + mirrorX(blWingLeft) },
        {
            d: "M41 24C41 15 46 10 52 10C57 10 60 14 60 19L59 24L60 60L56 68L44 68L40 60Z"
                + "M41 14L30 19L41 22Z",
            rule: "nonzero"
        },
        { d: "M33 18L42 13L42 23Z" },
        { d: "M42 66L58 66L66 86L57 81L50 91L43 81L34 86Z" },
        { d: "M44 15.5L49 14.5L48 18.5Z", cut: true }
    ];

    /* B: the Schale. Champions' plate seen face-on: rim of studs, inner ring,
       central medallion with a star. */
    const blStuds = [];
    for(let index = 0; index < 10; index += 1){
        const a = (index * 36 - 90) * Math.PI / 180;
        blStuds.push(circle(Number((50 + 37 * Math.cos(a)).toFixed(2)), Number((50 + 37 * Math.sin(a)).toFixed(2)), 3.6));
    }
    const blPlate = [
        { d: circle(50, 50, 45) + circle(50, 50, 30) + blStuds.join(""), rule: "evenodd" },
        { d: circle(50, 50, 25) + star(50, 50, 13, 5.6, 0), rule: "evenodd" }
    ];

    /* ---------- Serie A ---------- */

    /* A: the Scudetto. Champion's shield silhouette, notched top, inset
       outline and a star cut. No tricolore. */
    const saShieldOuter = "M14 12L40 12L50 19L60 12L86 12L86 48C86 70 70 84 50 93C30 84 14 70 14 48Z";
    const saShieldInner = "M22 19L38 19L50 27L62 19L78 19L78 48C78 65 66 76 50 84C34 76 22 65 22 48Z";
    const saScudetto = [
        { d: saShieldOuter + saShieldInner, rule: "evenodd" },
        { d: "M27 24L37 24L50 32.5L63 24L73 24L73 48C73 62 63 71 50 78C37 71 27 62 27 48Z" + star(50, 49, 15, 6.4, 0), rule: "evenodd" }
    ];

    /* B: the Corona d'alloro. Heavy laurel wreath, open at the top, tied
       at the foot. */
    function polarPoint(r, deg){
        const rad = deg * Math.PI / 180;
        return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)];
    }
    function arcBand(rIn, rOut, fromDeg, toDeg){
        const f = (n) => n.toFixed(2);
        const [ax, ay] = polarPoint(rOut, fromDeg);
        const [bx, by] = polarPoint(rOut, toDeg);
        const [cx, cy] = polarPoint(rIn, toDeg);
        const [dx, dy] = polarPoint(rIn, fromDeg);
        return `M${f(ax)} ${f(ay)}A${rOut} ${rOut} 0 0 1 ${f(bx)} ${f(by)}L${f(cx)} ${f(cy)}A${rIn} ${rIn} 0 0 0 ${f(dx)} ${f(dy)}Z`;
    }
    const saLeaves = [];
    [112, 140, 168, 196, 224].forEach((theta) => {
        const tangent = theta + 90;
        const [ox, oy] = polarPoint(41, theta + 6);
        const [ix, iy] = polarPoint(27.5, theta + 6);
        saLeaves.push(leaf(ox, oy, 19, 10, tangent - 38));
        saLeaves.push(leaf(ix, iy, 17, 8.8, tangent + 38));
    });
    const [tipX, tipY] = polarPoint(34, 252);
    saLeaves.push(leaf(tipX, tipY, 20, 10, 252 + 90 - 8));
    const saLaurelLeft = saLeaves.join("") + arcBand(31.5, 36.5, 100, 246);
    const saLaurel = [
        { d: saLaurelLeft },
        { d: mirrorLeafPath(saLaurelLeft) },
        { d: "M40 80L60 80L66 94L50 88L34 94Z" }
    ];

    function mirrorLeafPath(d){
        /* Mirrors an absolute M/L/Q/C/A path around x = 50. */
        return d.replace(/([MLQCA])([^MLQCAZ]+)/g, (match, cmd, args) => {
            const nums = args.trim().split(/[\s,]+/).map(Number);
            if(cmd === "A"){
                nums[4] = 1 - nums[4];
                nums[5] = Number((100 - nums[5]).toFixed(2));
            }else{
                for(let index = 0; index < nums.length; index += 2){ nums[index] = Number((100 - nums[index]).toFixed(2)); }
            }
            return cmd + nums.join(" ");
        });
    }

    /* ---------- Ligue 1 ---------- */

    /* A: the Un. A heavy slanted numeral 1 with a star cut in the flag. */
    const l1One = [
        {
            d: "M44 10L70 10L58 76L72 76L69 90L23 90L26 76L38 76L45 38L31 44L35 24Z"
                + star(57, 24, 6.5, 2.8, 10),
            rule: "evenodd"
        }
    ];

    /* B: the Coq. Proud Gallic rooster, full silhouette facing left,
       three-lobe comb, wattle, sickle tail, wing cut. */
    const l1Rooster = [
        {
            d: "M24 21L9 27L24 32C23 38 25 44 29 44C33 44 33 38 31 34"
                + "C30 46 18 55 23 65C28 75 40 78 52 77C63 76 72 72 80 64C88 56 95 46 95 34"
                + "L87 42C89 32 87 22 81 13L78 29C76 20 70 12 61 7L63 25C58 31 53 39 47 39"
                + "C43 39 41 32 41 25C42 21 43 16 41 12C37 7 34 11 33 13C31 7 25 7 25 13C21 10 17 15 21 19Z"
                + circle(31, 23, 2.8)
                + "M44 56C54 48 68 48 77 57L58 61Z",
            rule: "evenodd"
        },
        { d: "M40 74L48 74L46 88L52 88L52 93L34 93L38 88Z" },
        { d: "M54 73L62 72L62 88L68 88L68 93L50 93L54 88Z" }
    ];

    const LEAGUE_MARK_V2_CANDIDATES = Object.freeze({
        premier_league: Object.freeze({
            name: "Premier League", code: "ENG · I", primary: "#3d195b",
            options: Object.freeze({
                a: Object.freeze({ label: "Crown", note: "Three orb-tipped points over a solid band; star cut in the body.", layers: plCrown }),
                b: Object.freeze({ label: "Lion profile", note: "Faceted lion head in profile, saw-tooth mane, no crown.", layers: plLion })
            })
        }),
        laliga: Object.freeze({
            name: "LaLiga", code: "ESP · I", primary: "#8f0f1a",
            options: Object.freeze({
                a: Object.freeze({ label: "Toro", note: "Frontal bull head with sweeping horns.", layers: llBull }),
                b: Object.freeze({ label: "Sol ball", note: "Sun of heavy rays around a ball with a pentagon cut.", layers: llSun })
            })
        }),
        bundesliga: Object.freeze({
            name: "Bundesliga", code: "GER · I", primary: "#1b1b1f",
            options: Object.freeze({
                a: Object.freeze({ label: "Adler", note: "Spread eagle, head left, stepped feathers.", layers: blEagle }),
                b: Object.freeze({ label: "Schale", note: "Champions' plate face-on: stud rim, ring, star medallion.", layers: blPlate })
            })
        }),
        serie_a: Object.freeze({
            name: "Serie A", code: "ITA · I", primary: "#0b3a6f",
            options: Object.freeze({
                a: Object.freeze({ label: "Scudetto", note: "Notched champion's shield with inset outline and star cut.", layers: saScudetto }),
                b: Object.freeze({ label: "Alloro", note: "Heavy laurel wreath tied at the foot.", layers: saLaurel })
            })
        }),
        ligue_1: Object.freeze({
            name: "Ligue 1", code: "FRA · I", primary: "#0b1f4a",
            options: Object.freeze({
                a: Object.freeze({ label: "Un", note: "Heavy slanted numeral 1 with a star cut in the flag.", layers: l1One }),
                b: Object.freeze({ label: "Coq", note: "Proud Gallic rooster, full silhouette facing left, sickle tail.", layers: l1Rooster })
            })
        })
    });

    function buildLeagueMarkV2Svg(layers, fill, background){
        const bg = background ? `<rect width="100" height="100" fill="${background}"/>` : "";
        const body = layers.filter((layer) => !layer.cut).map((layer) => `<path d="${layer.d}"${layer.rule ? ` fill-rule="${layer.rule}"` : ""}/>`).join("");
        const cuts = layers.filter((layer) => layer.cut);
        /* Cuts that cross several layers are applied with a mask so the
           mark stays one colour with true transparency. */
        if(cuts.length){
            const maskId = `lm2m${(buildLeagueMarkV2Svg.seq = (buildLeagueMarkV2Svg.seq || 0) + 1).toString(36)}`;
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${bg}`
                + `<defs><mask id="${maskId}"><rect width="100" height="100" fill="#fff"/>${cuts.map((layer) => `<path d="${layer.d}" fill="#000"/>`).join("")}</mask></defs>`
                + `<g fill="${fill}" mask="url(#${maskId})">${body}</g></svg>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${bg}<g fill="${fill}">${body}</g></svg>`;
    }

    function toDataUri(svg){
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }

    function getLeagueMarkV2(leagueId, option, tone){
        const id = String(leagueId || "").trim();
        const league = Object.prototype.hasOwnProperty.call(LEAGUE_MARK_V2_CANDIDATES, id) ? LEAGUE_MARK_V2_CANDIDATES[id] : null;
        if(!league){ return null; }
        const optionKey = option === "b" ? "b" : "a";
        const toneKey = Object.prototype.hasOwnProperty.call(LEAGUE_MARK_V2_TONES, tone) ? tone : "gold";
        const fill = LEAGUE_MARK_V2_TONES[toneKey];
        const layers = league.options[optionKey].layers;
        const svg = buildLeagueMarkV2Svg(layers, fill);
        return Object.freeze({
            id,
            option: optionKey,
            label: league.options[optionKey].label,
            code: league.code,
            name: league.name,
            primary: league.primary,
            tone: toneKey,
            svg,
            image: toDataUri(svg)
        });
    }

    function applyLeagueMarkV2(element, leagueId, option, tone){
        if(!element){ return; }
        const mark = getLeagueMarkV2(leagueId, option, tone);
        if(!mark){
            delete element.dataset.leagueMark;
            element.style.removeProperty("--league-mark-image");
            return;
        }
        element.dataset.leagueMark = `v2-${mark.option}`;
        element.style.setProperty("--league-mark-image", mark.image);
    }

    const api = Object.freeze({
        LEAGUE_MARK_V2_CANDIDATES,
        LEAGUE_MARK_V2_TONES,
        getLeagueMarkV2,
        applyLeagueMarkV2,
        buildLeagueMarkV2Svg
    });
    if(typeof module !== "undefined" && module.exports){ module.exports = api; }
    if(root){ root.LeagueMarksV2 = api; }
})(typeof window !== "undefined" ? window : globalThis);
