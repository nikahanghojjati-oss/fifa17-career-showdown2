---
# PASTE THIS WHOLE FILE INTO CLAUDE CODE (claude.ai/code)
Repo: nikahanghojjati-oss/fifa17-career-showdown2 · Starting branch: claude/project-thread-ss6886 · Work branch to create and push: claude-cloud/crest-v1 · Model: Opus 5.5 · Effort: High · STOP_BUDGET 60 min / $15
GPT-5.6 Sol has reviewed this brief: PASS WITH TWO REQUIRED CLARIFICATIONS (see the final section, which overrides anything above it).
---

# Claude Code build brief: original club crests and league marks (CREST-V1, brief R2)

Written 2026-09-30 by Claude (Visual lead). For a Claude Code cloud session on Nik's credit.
Model: **Opus 5.5**, effort **High** (a first-of-kind crest engine with composition judgment).
**STOP_BUDGET: 60 min / $15.** Nik confirms at launch. At 80%, stop adding clubs, commit what passes and list what's left. At 100%, stop.

## 0. Setup
- Repo: `nikahanghojjati-oss/fifa17-career-showdown2`.
- Cut a new branch **`claude-cloud/crest-v1`** from **`claude/project-thread-ss6886`**. That branch is `claude-cloud/transfer-tr2-plate-g` (`6f8eb1b`) plus the reference files in `visual-assets/crests/reference/`: this brief, `CREST_CLOSENESS_RULES_V1.md`, and `CREST_PROOF_SHEET_V2.html/.png`. If plate-g has moved since, merge it in and note the SHA in your final report.
- Never touch `main`: no PR to main, no merge, no cherry-pick, no force-push. Push only `claude-cloud/crest-v1`.
- No heavy installs. Playwright and Chromium are already in the container (`/opt/pw-browsers`, global `playwright`).

## 1. Goal
Replace today's random crest generator with **hand-authored, club-specific original crests** for all 98 clubs, plus **5 original league marks**. They must look close to the real clubs without copying them. Owner direction (Nik, 2026-09-30): "it looks very good, it looks close, but we're not breaking the rules."

## 2. Closeness rules (hard gate for every crest)
May share with the real badge:
1. **Colours.** The club's real colours and kit pattern (stripes, halves, hoops).
2. **Exactly one theme,** drawn from scratch: the club's animal, object or heritage pattern (cannon, fork, bird, lion, crown, lozenges, bee, eagle, wolf, ship, castle, star and so on).

Must always differ:
- **Outline family.** Real roundel becomes our shield or hex, and a real shield becomes our roundel or another shield family.
- **Pose and direction** of the theme (e.g. flip it, fly instead of stand, head instead of full body).
- **Layout.** No copied rings, scrolls, text bands or quarters in the same places.
- **Text.** No club name, monogram, founding year or motto inside the crest. The club name stays live DOM text beside it.
- Never trace, edit or reuse the real artwork or vector paths. No `<image>`, no raster files, no `assets/logos/`.

Test for each crest: a fan should think "those are their colours", not "that's their badge". If one would pass for the real badge at a glance, pull it back one step.

League marks: a rounded tile with a gold rim and the league colour, holding the **national flag drawn as a small shield** (England St George cross, Spain red-gold-red with no coat of arms, Germany black-red-gold, Italy tricolour; France keeps its tricolour bars), a small crown or star, and a country code (`ENG · I`). National flags are public symbols. No league wordmark, no Premier League lion, no Bundesliga player silhouette, no LaLiga shape, no French rooster.

## 3. Reference design
Appendix A (also at `visual-assets/crests/reference/CREST_PROOF_SHEET_V2.html`) is the **V2 proof sheet** (8 clubs, 5 leagues), revised with Nik's notes. Carry over its frame look: gold bevel rim, gloss overlay, drop shadow, outline families, motif drawings and the per-club keep/change notes.

**Nik's owner notes (2026-09-30), already applied in V2. Keep them:**
- Liked as drawn: Arsenal, Manchester United, Liverpool, Chelsea, Juventus, and the Italy and France marks.
- "Barcelona too far": V2 adds the Catalan flag as one full top band over the stripes, on a shield.
- "Bayern could get closer": V2 fills the shield with the lozenge field inside a red frame.
- "Real Madrid, get closer": V2 puts the crown on top and adds a purple sash that runs the other way.
- Leagues: put the country flag on every mark. The V1 sun and ball marks are dropped.
- Direction for the other 90 clubs: aim as close as §2 allows. When unsure, go one step closer, not further, while still passing the at-a-glance test.

## 4. Build (files and API the screens depend on)
All in **`js/visualIdentity.js`**. Keep it lazily loaded through `js/optionalModules.js` as it is today. Do not add it to `index.html`, and do not add new JS files to the startup path.
- `CLUB_CREST_RECIPES`: a frozen object keyed by the exact club names in `data/clubs.js`. Each entry is `{shape, pattern, motif, keep, change}`. Use a data-only recipe, not hash-picked.
- Keep `CLUB_IDENTITY_PALETTES` (you may refine colours).
- Keep, with the same names and behaviour: `window.getClubIdentity(name)`, `window.applyClubIdentity(el, name)`, `window.refreshClubVisualIdentity()`, CSS vars `--club-primary/secondary/accent/angle/crest-image`, `data-club-crest="original"`.
- Add to the identity object: `crestSvg` (raw SVG markup string) and `recipe`.
- Add `window.getClubCrestSvg(name)`, which returns the SVG string.
- Add `LEAGUE_MARK_RECIPES` keyed by the league ids in `data/leagues.js`: `premier_league, laliga, bundesliga, serie_a, ligue_1`.
- Add `window.getLeagueMark(leagueId)`, which returns `{id, code, primary, svg, image}` where `image` is a `url("data:image/svg+xml,…")`.
- Add `window.applyLeagueMark(el, leagueId)`, which sets `data-league-mark="original"` and `--league-mark-image`.
- SVG ids must be unique per crest instance (gradient and clip ids), so many crests can share a page.
- Fallback for unknown names: the old hash path, but framed in the new style.
- Do **not** change `data/leagues.js`. Its `logo:"assets/logos/*.png"` fields point to files that don't exist. Flag it for Sol (§7), and don't edit it.

## 5. Review page and QA sheet
- `visual-assets/crests/CREST_REVIEW.html` loads `../../js/visualIdentity.js` and `../../data/clubs.js` and renders all 98 crests grouped by league, then the 5 marks. Each card shows the name plus Keeps/Changes from the recipe.
- `visual-assets/crests/qa/`: Playwright shots of the review page at 1280 wide (full page), each crest at 24, 42 and 96 px on one strip (small-size legibility), and 360×640 plus 375×553 phone crops.
- `visual-assets/crests/CREST_QA.md` records measured results: 98 unique crest strings, 5 marks, zero `<image>`, and every crest passing the §2 rules. Note any club you judged too close and how you pulled it back.

## 6. Checks before push (numbers measured, not estimated)
- `node tests/contracts/static-app-release-contracts.cjs` must pass. It already asserts 98 clubs, every club with a palette, 98 distinct crests, `data:image/svg+xml` crests, no `<image`, no `assets/logos/`, and startup JS size limits.
- `npm run test:contracts` must pass. Never skip or weaken a test.
- `npm run test:home-visual` should pass if it runs in the container. If it can't, say so.
- Adversarially re-read the diff: no product behaviour changes, no copied artwork.

## 7. Report back
Commit to `claude-cloud/crest-v1` and push. Write a handoff for GPT-5.6 Sol at `claude/handoffs/CC_CREST_V1_HANDOFF_TO_SOL_<date>.md` on the branch. It should cover the branch head SHA, the files changed, the QA numbers, the clubs left if the budget ran out, and these numbered items for Sol:
1. `data/leagues.js` `logo` fields reference non-existent real-logo PNGs. Propose that Sol removes them or points them to `getLeagueMark`.
2. Confirm product truth: crests are decorative, and no live or private data is baked in.
The Visual lead thread then does the owner gate with Nik.

## Appendix A: V2 proof sheet source (reference only; rewrite as recipes)
```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crest Proof Sheet V2</title>
<style>
:root{--bg:#0b0f14;--card:#141a22;--ink:#eef1f4;--mute:#9aa6b2;--gold:#d9b54a}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% 0,#1b2430,#0b0f14 70%);color:var(--ink);font:14px/1.4 system-ui,Segoe UI,Roboto,sans-serif;padding:16px}
h1{font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin:4px 0 2px}
h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:22px 0 8px}
p.lead{color:var(--mute);margin:0 0 8px;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.c{background:linear-gradient(180deg,#18202a,#10151c);border:1px solid #232d39;border-radius:12px;padding:10px;text-align:center}
.c svg{width:96px;height:112px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.n{font-weight:700;margin-top:4px}.k{font-size:11px;color:var(--mute);text-align:left;margin-top:6px}
.k b{color:#c9d3dc;font-weight:600}
.lg svg{width:84px;height:84px}
</style></head><body>
<h1>Club crest proof · V2</h1>
<p class="lead">Original artwork. Each crest may share the club's colours plus one theme (an animal, object or pattern), redrawn from scratch. Outline, pose, layout and text always differ from the real badge.</p>
<h2>Clubs</h2><div class="grid" id="clubs"></div>
<h2>Leagues</h2><div class="grid lg" id="leagues"></div>
<script>
const S={
 heater:"M10 8H110V66C110 103 86 124 60 134C34 124 10 103 10 66Z",
 roundel:"M60 10A60 60 0 1 1 59.9 10Z",
 hex:"M60 4L112 26L104 102L60 136L16 102L8 26Z",
 point:"M12 8H108L106 84L60 134L14 84Z",
 tall:"M60 4L106 18V84C106 108 84 126 60 136C36 126 14 108 14 84V18Z"
};
S.roundel="M60 12a58 58 0 1 0 0.01 0Z";
const star=(cx,cy,r,f)=>{let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.42:r;p.push((cx+rr*Math.cos(a)).toFixed(1)+","+(cy+rr*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(" ")}" fill="${f}"/>`};
const M={
 cannon:(c)=>`<g><path d="M22 62L86 54Q94 53 94 61V69Q94 77 86 76L22 72Z" fill="${c}"/><rect x="16" y="59" width="9" height="16" rx="2" fill="${c}"/><circle cx="80" cy="84" r="13" fill="none" stroke="${c}" stroke-width="5"/><g stroke="${c}" stroke-width="3"><path d="M80 71V97M67 84H93M71 75L89 93M89 75L71 93"/></g><circle cx="80" cy="84" r="3.5" fill="${c}"/></g>`,
 trident:(c)=>`<g fill="${c}"><rect x="56.5" y="52" width="7" height="68" rx="2"/><path d="M60 18L66 44H54Z"/><path d="M36 30L42 58Q60 66 78 58L84 30L76 50Q60 56 44 50Z"/><rect x="48" y="60" width="24" height="6" rx="2"/></g>`,
 bird:(c)=>`<path d="M16 58Q38 34 58 56Q60 50 62 56Q82 34 104 58Q84 50 68 64L64 70L72 90H60L58 74Q52 62 48 64Q34 52 16 58Z" fill="${c}"/><circle cx="60" cy="50" r="5" fill="${c}"/><path d="M63 49L72 51L63 53Z" fill="${c}"/>`,
 lion:(c,d)=>{let p=[];for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?26:34;p.push((60+r*Math.cos(a)).toFixed(1)+","+(66+r*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(" ")}" fill="${c}"/><path d="M60 44L78 56L76 78L60 92L44 78L42 56Z" fill="${d}"/><path d="M48 62L55 64L48 66ZM72 62L65 64L72 66Z" fill="${c}"/><path d="M55 76H65L60 82Z" fill="${c}"/>`},
 crown:(c,d)=>`<g><path d="M28 40L34 16L48 32L60 10L72 32L86 16L92 40Z" fill="${c}"/><rect x="28" y="40" width="64" height="9" rx="2" fill="${c}"/><circle cx="60" cy="44.5" r="3" fill="${d}"/><circle cx="44" cy="44.5" r="2.5" fill="${d}"/><circle cx="76" cy="44.5" r="2.5" fill="${d}"/></g>`,
 ball:(c,d,x=60,y=70,r=16)=>`<g><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><polygon points="${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*2*Math.PI/5;return (x+r*.42*Math.cos(a)).toFixed(1)+","+(y+r*.42*Math.sin(a)).toFixed(1)}).join(" ")}" fill="${d}"/></g>`
};
let uid=0;
function crest({shape,field,pattern="",motif="",top=""}){
 const id="k"+(uid++),d=S[shape];
 return `<svg viewBox="0 0 120 144"><defs>
 <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeaa0"/><stop offset=".45" stop-color="#c69a34"/><stop offset=".7" stop-color="#f3d470"/><stop offset="1" stop-color="#8e6a1f"/></linearGradient>
 <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
 <clipPath id="${id}c"><path d="${d}"/></clipPath></defs>
 <g transform="translate(0 4)"><path d="${d}" fill="url(#${id}r)" transform="translate(60 70) scale(1.07) translate(-60 -70)"/>
 <path d="${d}" fill="${field}"/><g clip-path="url(#${id}c)">${pattern}${motif}<path d="${d}" fill="url(#${id}g)"/></g>
 <path d="${d}" fill="none" stroke="#1a1206" stroke-opacity=".35" stroke-width="1.2"/></g>${top}</svg>`;
}
const clubs=[
 {n:"Arsenal",keep:"red, white, navy; cannon",chg:"roundel not shield, cannon faces left, no top text band",
  s:{shape:"roundel",field:"#d71920",pattern:`<rect x="0" y="100" width="120" height="44" fill="#163a70"/><rect x="0" y="96" width="120" height="6" fill="#f5f5f5"/>`,motif:M.cannon("#f5f5f5")+star(60,36,9,"#d9b54a")}},
 {n:"Manchester United",keep:"red, black, gold; devil's fork",chg:"trident only, no devil figure, no ship, no scroll",
  s:{shape:"hex",field:"#da291c",pattern:`<path d="M60 0H120V144H60Z" fill="#171b1f"/>`,motif:M.trident("#f4c542")}},
 {n:"Liverpool",keep:"red, white, teal; a bird",chg:"bird in flight, not the standing liver bird; no flames, gates or motto",
  s:{shape:"point",field:"#c8102e",pattern:`<path d="M0 104L60 124L120 104V144H0Z" fill="#19a48b"/>`,motif:M.bird("#f2f2f0")}},
 {n:"Chelsea",keep:"royal blue, white, gold; a lion",chg:"shield not roundel, forward lion head, no staff, roses or balls",
  s:{shape:"heater",field:"#1746a2",pattern:`<path d="M0 0H120V14H0Z" fill="#f7f8f9"/>`,motif:M.lion("#d5b638","#1746a2")}},
 {n:"Real Madrid",keep:"white, purple, gold; crown on top",chg:"shield not circle, sash runs the other way, star not monogram",
  s:{shape:"heater",field:"#f5f5f3",pattern:`<path d="M-10 118L130 34V56L-10 140Z" fill="#6a55a3"/>`,motif:star(60,74,13,"#d4b12d"),top:`<g transform="translate(27 -3) scale(.55)">${M.crown("#d4b12d","#6a55a3")}</g>`}},
 {n:"Barcelona",keep:"blue and garnet stripes, Catalan flag, gold ball",chg:"flag as one full band, no cross, no FCB band, shield not pot shape",
  s:{shape:"heater",field:"#193b8f",pattern:[0,1,2,3,4].map(i=>`<rect x="${4+i*24}" y="0" width="12" height="144" fill="#9f173d"/>`).join("")+`<rect x="0" y="0" width="120" height="46" fill="#f2c200"/>`+[0,1,2,3].map(i=>`<rect x="0" y="${6+i*10}" width="120" height="5" fill="#c8102e"/>`).join("")+`<rect x="0" y="46" width="120" height="5" fill="#e3b724"/>`,motif:M.ball("#e3b724","#193b8f",60,94,15)}},
 {n:"Bayern Munich",keep:"red, blue, white; lozenge field",chg:"shield not roundel, red frame not a text ring, no lettering",
  s:{shape:"heater",field:"#d71920",pattern:`<clipPath id="bym"><path d="M26 22H94V66C94 94 76 110 60 117C44 110 26 94 26 66Z"/></clipPath><g clip-path="url(#bym)"><rect x="0" y="0" width="120" height="144" fill="#f5f5f4"/>${Array.from({length:9},(_,r)=>Array.from({length:9},(_,q)=>`<path d="M${14+q*14+(r%2)*7} ${22+r*12}l7 -6 7 6 -7 6z" fill="#1765b0"/>`).join("")).join("")}</g><path d="M26 22H94V66C94 94 76 110 60 117C44 110 26 94 26 66Z" fill="none" stroke="#f3d470" stroke-width="2"/>`,motif:""}},
 {n:"Juventus",keep:"black and white stripes, gold",chg:"pointed shield not oval, no bull, star above",
  s:{shape:"point",field:"#f5f5f3",pattern:[0,1,2,3].map(i=>`<rect x="${18+i*24}" y="0" width="12" height="144" fill="#15191c"/>`).join(""),motif:"",top:star(60,14,11,"#d9b62f")}}
];
document.getElementById("clubs").innerHTML=clubs.map(c=>`<div class="c">${crest(c.s)}<div class="n">${c.n}</div><div class="k"><b>Keeps</b> ${c.keep}<br><b>Changes</b> ${c.chg}</div></div>`).join("");
const tile=(bg,inner,label)=>`<svg viewBox="0 0 100 100"><defs><linearGradient id="t${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs><rect x="4" y="4" width="92" height="92" rx="20" fill="#c69a34"/><rect x="8" y="8" width="84" height="84" rx="17" fill="${bg}"/>${inner}<rect x="8" y="8" width="84" height="84" rx="17" fill="url(#t${uid++})"/><text x="50" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="800" letter-spacing="2" fill="#fff">${label}</text></svg>`;
const flagShield=(inner,id)=>`<clipPath id="${id}"><path d="M32 18H68V44C68 60 58 68 50 72C42 68 32 60 32 44Z"/></clipPath><g clip-path="url(#${id})">${inner}</g><path d="M32 18H68V44C68 60 58 68 50 72C42 68 32 60 32 44Z" fill="none" stroke="#f3d470" stroke-width="1.5"/>`;
const leagues=[
 {n:"England, top flight",note:"St George cross shield, crown. No lion.",svg:tile("#3d195b",flagShield(`<rect x="32" y="18" width="36" height="60" fill="#f5f5f5"/><rect x="46" y="18" width="8" height="60" fill="#ce1124"/><rect x="32" y="36" width="36" height="8" fill="#ce1124"/>`,"en")+`<g transform="translate(35 4) scale(.25)">${M.crown("#d9b54a","#3d195b")}</g>`,"ENG · I")},
 {n:"Spain, top flight",note:"Red-gold-red shield, star. No LaLiga shape or coat of arms.",svg:tile("#8f0f1a",flagShield(`<rect x="32" y="18" width="36" height="60" fill="#c60b1e"/><rect x="32" y="33" width="36" height="22" fill="#ffc400"/>`,"es")+star(50,12,6,"#d9b54a"),"ESP · I")},
 {n:"Germany, top flight",note:"Black-red-gold shield, star. No player silhouette.",svg:tile("#1b1b1f",flagShield(`<rect x="32" y="18" width="36" height="60" fill="#dd0000"/><rect x="32" y="18" width="36" height="14" fill="#111"/><rect x="32" y="46" width="36" height="32" fill="#ffce00"/>`,"de")+star(50,12,6,"#d9b54a"),"GER · I")},
 {n:"Italy, top flight",note:"Tricolour scudetto shield, as V1.",svg:tile("#0b3a6f",flagShield(`<rect x="32" y="18" width="12" height="60" fill="#009246"/><rect x="44" y="18" width="12" height="60" fill="#f4f5f0"/><rect x="56" y="18" width="12" height="60" fill="#ce2b37"/>`,"it"),"ITA · I")},
 {n:"France, top flight",note:"Tricolour bars, star, as V1. No rooster.",svg:tile("#0b1f4a",`<rect x="28" y="26" width="14" height="36" rx="3" fill="#2d5bd6"/><rect x="43" y="26" width="14" height="36" rx="3" fill="#f4f5f0"/><rect x="58" y="26" width="14" height="36" rx="3" fill="#e1343f"/>`+star(50,20,8,"#d9b54a"),"FRA · I")}
];
document.getElementById("leagues").innerHTML=leagues.map(l=>`<div class="c">${l.svg}<div class="n">${l.n}</div><div class="k">${l.note}</div></div>`).join("");
</script></body></html>

```

## SOL REQUIRED CORRECTIONS (GPT-5.6 Sol prebuild review, 2026-09-29; these override the brief above)

Proceed with CREST-V1 R2 on the isolated `claude-cloud/crest-v1` branch, created from `claude/project-thread-ss6886`.

Sol approves the architecture, recipe model, league-mark model, proof-sheet direction, QA plan, budget stop, and branch isolation, with two mandatory implementation clarifications:

First, backward compatibility is required. Do not remove or replace `getClubIdentity(name).crest`. `identity.crest` must remain a CSS-ready `url("data:image/svg+xml,…")` value because existing callers and the static release contract rely on it. Add `crestSvg` and `recipe` alongside it, plus `getClubCrestSvg(name)`. Existing `getClubIdentity`, `applyClubIdentity`, `refreshClubVisualIdentity`, CSS variables and `data-club-crest="original"` behavior remain compatible.

Second, the "unique SVG ids per crest instance" rule applies even when the same club or league mark appears multiple times on one page. Do not copy fixed proof-sheet IDs such as `bym`, `en`, `es`, `de`, or `it` into production. Use an SVG-instance factory or equivalent namespacing so every gradient/clip/mask reference is safe. If `identity.crestSvg` is exposed directly, back it with the same factory (e.g. a getter). League marks follow the same ID discipline.

Additional QA Sol requires (additive to the brief's QA):
1. `identity.crest` remains present for all 98 clubs and stays CSS-ready.
2. `getClubCrestSvg(name)` returns raw SVG with no `<image>`.
3. Every exact club name in `data/clubs.js` has a recipe; no extra recipe key silently substitutes for a real club.
4. All five league IDs (`premier_league`, `laliga`, `bundesliga`, `serie_a`, `ligue_1`) have league-mark recipes; `getLeagueMark` returns `{id, code, primary, svg, image}`.
5. Render the same crest at least three times, and the same league mark at least three times, in one document and prove internal SVG IDs are unique.
6. No generated SVG contains club name, founding year, monogram or motto as badge text.
7. Unknown-name fallback still returns a valid identity and does not break existing callers.
8. Existing static release contracts stay untouched and pass; new CREST-V1 tests are additive only.

Design caution: "closer" never permits reconstructing an official badge by combining several badge-specific elements; the hard outline/pose/layout differences remain the gate.

Keep `js/visualIdentity.js` as the only production file for crests (it is lazy-loaded by `js/optionalModules.js`); do not add startup scripts or change `index.html`. Do not touch `main` or `data/leagues.js`. No PR, merge or cherry-pick to main; no force-push. At 80% of budget, finish the current batch, run checks, commit what passes and list remaining clubs; at 100% stop. A clean partial build beats 98 rushed crests.

Return `CC_CREST_V1_HANDOFF_TO_SOL_<date>.md` committed on the branch, with branch head, source SHA, files changed, measured QA, incomplete clubs if any, the `data/leagues.js` follow-up, and confirmation that the crest system contains decorative static identity only and no live/private data.
