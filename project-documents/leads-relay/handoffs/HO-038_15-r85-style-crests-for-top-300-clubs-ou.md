# HO-038 · Team V → Team G · 15 r85-style crests for top-300 clubs outside the five leagues

```ticket
{
 "id": "HO-038",
 "from": "V",
 "to": "G",
 "title": "15 r85-style crests for top-300 clubs outside the five leagues",
 "kind": "build",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1031"],
 "log": [{"at": "2026-10-28T19:53:44Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-28T20:05:03Z", "by": "G", "status": "RECEIVED", "note": "Team G lead got it; adding the 15 crests to js/visualIdentity.js on gameplay/r86 now (PR + Gate + Codex), re-pinning the crest sha in v10-setup-contracts."}, {"at": "2026-10-28T21:58:56Z", "by": "G", "status": "DONE", "note": "Merged into gameplay/r86 as d9eacff1 (PR #1031, Codex clean, Gate green): your 15 crests as given, plus CLUB_IDENTITY_ALIASES so the 23 launch-dataset names (FC Barcelona, Inter, AS Monaco ...) draw the catalog crest. Contract L6: all 76 Marquee clubs draw a real crest."}]
}
```

# 15 new club crests for the top-300 Special Players (r85 style, code only)

**Nik (28 Oct 2026, 3:45 p.m. Eastern):** "For 15 clubs create premium badge that get as close as possible to real club badge similar to all approved r85 badges". These clubs are in the launch top 300 but outside the five leagues, so `js/visualIdentity.js` had no recipe and drew a generated badge.

Team V drew them in the same r85 crest language (crestRecipe, gold rim, enamel, own drawings, no letters, no traced logos) and they are live in the Big Jump preview v18 (https://claude.ai/artifact/BenU2ZNEt7mzQz557F4ed5).

Proof sheet: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/bigjump/crests_top300.jpg

## Paste into js/visualIdentity.js
Keys are the exact club names in `data/marqueePlayers.js`.

### 1. CLUB_IDENTITY_PALETTES (new entries)
```js
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
    "Estudiantes de La Plata": ["#d0102b", "#f5f5f3", "#e2b84a"],
```

### 2. CREST_PATTERNS (one new pattern, before `diamonds`)
```js
    checker: c => Array.from({ length: 12 }, (_, r) => Array.from({ length: 10 }, (_, q) => (r + q) % 2 ? `<rect x="${q * 12}" y="${r * 12}" width="12" height="12" fill="${c}"/>` : "").join("")).join(""),
```

### 3. CREST_MOTIFS (four new motifs, before `eagle`)
```js
    warriorHead: (c, d) => `<path d="M72 34Q52 30 44 44L40 58L32 66L40 70L38 78Q40 86 50 86L50 98H78Q76 84 82 74Q90 58 84 46Q80 38 72 34Z" fill="${c}"/><path d="M44 44Q50 26 74 28Q92 32 90 52L84 46Q78 36 64 38Q52 40 48 50Z" fill="${c}"/><path d="M58 40Q66 30 78 34M56 48Q66 38 82 44M56 56Q66 48 84 54M60 64Q70 58 84 64M62 72Q70 68 82 74" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/><circle cx="48" cy="60" r="2.2" fill="${d}"/>`,
    dragon: (c, d) => `<path d="M58 62L66 26L74 42L82 24L88 42L100 30L98 56Q88 50 80 60Q72 52 64 64Z" fill="${c}"/><path d="M30 46L42 40L48 44L56 46Q52 52 52 60Q54 72 64 78Q78 84 88 76Q96 70 92 62L100 58Q106 72 98 84Q86 98 66 94Q46 90 42 72Q40 60 44 54L36 56L38 50Z" fill="${c}"/><path d="M98 84Q106 92 100 102L108 100L104 108Q96 108 94 100Q96 92 92 88Z" fill="${c}"/><path d="M52 84L48 98L54 96L58 88ZM74 92L74 104L80 102L80 92Z" fill="${c}"/><circle cx="44" cy="45" r="1.8" fill="${d}"/><path d="M30 46L24 42L26 48Z" fill="${c}"/>`,
    crescentStar: c => `<path d="M58 46A24 24 0 1 0 58 94A19 19 0 1 1 58 46Z" fill="${c}"/>${crestStar(72, 70, 9, c)}`,
    crescentStarChief: (c, d) => `<circle cx="55" cy="22" r="9" fill="${c}"/><circle cx="58" cy="22" r="7.4" fill="${d}"/>${crestStar(64.5, 22, 4.4, c)}`,
```

### 4. CLUB_CREST_RECIPES (new entries)
```js
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
    "Estudiantes de La Plata": crestRecipe("heater", "field:w stripes:p", "laurel:a", "red and white stripes, laurel", "own laurel, no letter E"),
```

## Also: club-name aliases the preview uses
The launch list uses dataset names; the r85 keys differ for these 8 (map them, or add aliases in getClubIdentity):
Hamburger SV→Hamburg, VfL Wolfsburg→Wolfsburg, Málaga CF→Málaga, SD Eibar→Eibar, RC Celta→Celta Vigo, Granada CF→Granada, AS Saint-Étienne→Saint-Étienne, Stade Rennais FC→Rennes. (Plus the older ones: FC Barcelona→Barcelona, FC Bayern München→Bayern Munich, Inter→Inter Milan, etc.; full map = CLUB_ALIAS in the preview source.)

## Check
Run your crest contracts; every new recipe uses existing shapes and only the new motifs/pattern above.
