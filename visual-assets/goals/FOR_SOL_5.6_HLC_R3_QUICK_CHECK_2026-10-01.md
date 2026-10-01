# FOR SOL 5.6 · HLC R3 quick check
Date: 2026-10-01 · From: Claude (Cloud session) · To: GPT-5.6 Sol
Branch: `claude-cloud/hlc-goals` · R3 files commit (head before this file): `ab14d780b3f3115c30526bfd6f6dd3c9b1d0fee2`
Input: SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01.md (D1 to D8). Documents only; no intake or build run; main untouched; R2 files untouched. `ACCEPTED_CREST_SHA` still blank.

## 1. Change log
| Delta | Applied in | New text (quoted) |
| --- | --- | --- |
| D1 | C2 in Home, League, Club R3 | "`git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings." (verbatim) |
| D2 | Intake R3, Branches section. Consequential: C1b and the Branch header line of the three screen briefs | "Resolve `claude-cloud/transfer-tr2-plate-g`. Expected base is `8fbda036c1d1f7910631964e982705d0f25290c0`. If the live head differs, STOP and report `PLATE_G_SOURCE_DRIFT` with the expected SHA, live SHA, and changed-path list. Do not cut HLC branches from an unreviewed newer Plate G head." Consequential: removed "or the base/head it records" so screen briefs expect the pinned base only. |
| D3 | Intake R3, SCOPE | "write only `visual-assets/v10_1/{home,league,club}/{assets,tools,evidence}/` plus that screen's `BUILD_RESULT` / intake report file if the chosen folder structure places it at screen root. Never main, no PR, no merge, no production files." |
| D4 | Common C5.4 (+ exemption clause), C5.5, G9 in all three; Home H2 method | C5.4: "Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club." (verbatim). C5.5: tile icons are inline SVG redraws, no new raster-icon exception, no PNG crops. G9: allows "the four inline/data SVG Home tile icons, Home only". H2: crop-to-PNG option removed; "draw each icon as an inline SVG redraw ... Do not crop the icons into new PNGs." |
| D5 | Home S (fixture authority paragraph), H0; common G1 wording | "Home fixtures = current-main Home product strings + the explicit Sol/owner-approved Audius exception in section S. The four Audius track titles/artists, source label `AUDIUS`, and Audius status/control strings are authoritative for this static Home visual prototype even though main still carries the old YouTube catalog. Default selected track in HM1/HM2/HM3: `WHAT YOU GOT — Valentino Khan & NITTI`." G1 now compares against "section S: current-main strings; for Home also the explicit Audius exception". |
| D6 | League S frame table L2; W4 | "static mid-spin, track at `+(2 × 360 − 3 × 72 + 31)°` for the illustrative Serie A mid-spin sample, or another positive whole-turn-plus-offset angle; the exact L2 angle is presentation-only, its rotation direction must match production" (= +535°). L3/L4 normalization unchanged (Bundesliga -144°). |
| D7 | Common G8 and C5.7 (all three); Club K3 | G8: "face and hand protected boxes always require ≥ 8 px clearance ... Club-only pack-box exception (D7): the two pack boxes are an explicit exception for K3's `aria-hidden` pack-open treatment in CL3-CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell." QA reports separately (a) face/hand clearance, (b) pack overlay containment per pack box, (c) zero live-text/control intersection with pack boxes. Intake wording kept: all face/hand/pack boxes hard-restored. |
| D8 | Common C6 in all three | "Desktop shows the badge plus the product brand. On phone the brand text may be visually hidden (still in the DOM) and only the `CM 17` badge retained." "(Open item for Sol, see D.)" deleted. |

Also: R3 revision/changelog lines and sign-off line ("PENDING · GPT-5.6 Sol R3 quick check") updated; intake TASK_ID is CLOUD-HLC-INTAKE-V1-R3. Cross-brief references: none of the briefs names another brief file, so no filename rewrites were needed; the R3 files carry only R3 labels.

## 2. Preserved R2 decisions (checked)
Four visible online Home tiles with six IDs in the DOM; Audius-only Home; pinned `ACCEPTED_CREST_SHA` (still the blank placeholder in League and Club); cover-fit `plateToScreen`; intake hard-restores keep rects and protected boxes; Cloud-only intake; 12 px text floor; owner Home icon language; League OWNER-2 (monochrome wheel marks, off-white on dark wedges, near-black on gold selected wedge) intact.

## 3. Self-check results
| Check | Result |
| --- | --- |
| "Open item for Sol" in any R3 file | 0 hits (gone) |
| C2 identical in Home/League/Club R3 | md5 33937f38 (1 unique value = identical); contains D1 text: CLOUD_BRIEF_HOME_V1_R3.md:1 CLOUD_BRIEF_LEAGUE_V1_R3.md:1 CLOUD_BRIEF_CLUB_V1_R3.md:1  |
| Intake SCOPE includes evidence | 1 match |
| Home icon PNG crop option | removed ('crops each icon' = 0 hits; H2 says do not crop into PNGs) |
| Default track | "WHAT YOU GOT — Valentino Khan & NITTI" present 1x as default-selection rule |
| L2 angle positive | +(2 × 360 − 3 × 72 + 31)° present; old "−(2 × 360" = 0 hits |
| Common block Home = LEAGUE | identical |
| Common block Home = CLUB | identical |
| ACCEPTED_CREST_SHA | placeholder kept in League (1) and Club (1) |
| R2 files untouched | `git diff --stat HEAD -- *_R2.md` = 0 lines |

## 4. Full R3 briefs

---

### FILE: visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md

~~~~markdown
Recipient: Claude Code Cloud session · Surface: claude.ai/code, repo `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **Medium**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Input branch: `claude-cloud/hlc-goals` · Output branches: `claude-cloud/home-v1`, `claude-cloud/league-v1`, `claude-cloud/club-v1`
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-HLC-INTAKE-V1-R3
STOP_BUDGET: 30 min wall-clock / $6 credit (asset intake mechanics)
PRIORITY_ORDER: Home plate > League plate > Club plate > wordmark > report
SCOPE: create the 3 screen branches; write only `visual-assets/v10_1/{home,league,club}/{assets,tools,evidence}/` plus that screen's `BUILD_RESULT` / intake report file if the chosen folder structure places it at screen root. Never main, no PR, no merge, no production files.
```

# CLOUD BRIEF · HLC plate intake (Home, League, Club) · R3

Revision: R3 (2026-10-01): D2 and D3 of SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 applied; R2 file kept untouched. R2: applies GPT-5.6 Sol verdict SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (SOL-HLC-5, -6, -8). This Cloud session is the only place intake happens (SOL-HLC-6); the project thread only reviews your evidence.

Run only after Claude has committed Nik's plates to `visual-assets/goals/plates-in/` and Sol has OK'd R3.

## Inputs (`git fetch origin claude-cloud/hlc-goals`)
- Nik's ChatGPT edits, already committed by Claude to `visual-assets/goals/plates-in/` under the ticket file names: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, optional `LOGO_CM17_WORDMARK_V1.png`. Process the ones present; list the missing ones.
- Originals: `visual-assets/goals/GOAL_HOME.png` (1672×941), `GOAL_LEAGUE_LOGOS_BLURRED.jpg` (1536×864; the wheel interior is blurred, which is inside a remove zone), `GOAL_CLUB.jpg` (1536×864).
- Zones: `visual-assets/goals/handoffs/HLC_PLATE_ZONES_V1.json`: per screen `remove_rects`, `remove_circles_cx_cy_r`, `keep_rects`, `protected_boxes`, in goal px.
- Method reference: `visual-assets/v10_1/tr2/slice-02-plate/tools/lock_and_clean.py` and that folder's BUILD_RESULT.md.

## Per plate (script `tools/intake_hlc.py`, committed in each screen folder)
1. Resize the edit to the goal's exact size (Lanczos). If framing is off (aligned-crop error > 4 px), try ECC or phase-correlation alignment; if still off, mark the plate FAILED and continue with the next.
2. **Likeness lock (SOL-HLC-5):** `output = original everywhere`; edited pixels may enter **only** the remove zones (6 px feather inside the zone edge); then `keep_rects` **and every `protected_boxes` rect** are hard-restored from the original, overriding the edit and the feather.
3. Gate by assertions, written to `assets/intake_report.md` and `evidence/intake_<screen>.json`:
   - changed pixels outside the authorized remove zones = **0**;
   - changed pixels inside every protected box = **0** (one count per box: faces, hands, packs);
   - changed pixels inside every keep rect = **0**;
   - guide-colour pixels left (R>200, G<80, B>200, or G>200, R<80, B<80) within ±6 px of every zone border = **0**;
   - mean luminance inside each zone ≤ 1.15 × the 12 px ring just outside it.
   Also save `evidence/intake_<screen>.jpg` (original | locked, side by side, 1X). You do not judge likeness: faces are original pixels by construction.
4. Export `ENV_<SCREEN>_PLATE_V1_1X.{png,webp q92}` and `_2X` (Lanczos ×2 + light unsharp), with the SHA-256 of each.
5. `platemap.json`: that screen's zones and protected boxes, unchanged, in 1X plate px, plus plate sizes and SHA-256.
6. Copy the original as `REF_GOAL_<SCREEN>.jpg` (League: the blurred one).
7. Wordmark (Home only, if present): alpha present (≥ 30 % fully transparent pixels), trimmed to content + 8 px, PNG + WebP, SHA-256. Note "spelling to be checked by Nik".

## Branches (SOL-HLC-8)
Resolve `claude-cloud/transfer-tr2-plate-g`. Expected base is `8fbda036c1d1f7910631964e982705d0f25290c0`. If the live head differs, STOP and report `PLATE_G_SOURCE_DRIFT` with the expected SHA, live SHA, and changed-path list. Do not cut HLC branches from an unreviewed newer Plate G head. For each PASS screen, create `claude-cloud/<screen>-v1` from that base, add `visual-assets/v10_1/<screen>/assets/` (plates, `platemap.json`, `REF_GOAL_*`, `intake_report.md` with base SHA, sizes, SHA-256 values and the gate counts) and `visual-assets/v10_1/<screen>/evidence/intake_*`. Commit `visual: <SCREEN>-V1 plate intake`, then `git push -u origin claude-cloud/<screen>-v1`. A FAILED plate gets no branch.

## Reply at the end
Per screen: PASS or FAILED with the gate counts, base SHA, branch head SHA, and the side-by-side JPG path so Nik can glance at it.

~~~~

---

### FILE: visual-assets/goals/CLOUD_BRIEF_HOME_V1_R3.md

~~~~markdown
Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/home-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/home-v1 && git checkout claude-cloud/home-v1`. If the branch or `visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_1X.webp` is missing, STOP and reply "Home plate not committed yet".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-HOME-V1
STOP_BUDGET: 45 min wall-clock / $10 credit (routing V3 §3, static checkpoint build)
PRIORITY_ORDER: H0 source check > H1 desktop stage + lockup > H2 four action tiles > H3 Audius soundtrack card > checkpoint commit+push > H4 phone > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/home/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · HOME V1 R3 · Rivalry Headquarters on the Home plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R3 (2026-10-01), applies GPT-5.6 Sol verdicts SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (R2) and SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 (D1-D8). R2 file kept untouched.
Changelog: R2.1 2026-10-01: tile icons follow goal mockup (owner direction). R3 2026-10-01: D1, D4, D5, D8 (see FOR_SOL change log).
Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3 and the intake has committed the Home plate)

## 0. Intent
Nik's Home goal: a night stadium, Daniel (left, pointing at the viewer) and Nik (right, hand on chin) behind a gold brush wordmark, a row of dark-glass action tiles along the bottom with the first one solid gold, and a soundtrack card on the right. The plate already carries the stadium, both managers, the banners and the handwritten notes. You place the product's live Home UI on it, in that look. Main today is a light-blue grid with a real player photo; none of that look survives.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_HOME_PLATE_V1_1X.{webp,png}` (1672×941) and `_2X` (3344×1882). Use `image-set()` with 1X/2X.
- `assets/platemap.json`: protected boxes (both faces, Daniel's pointing hand, Nik's hand on chin) and the goal's UI rects, in 1X plate px.
- `assets/REF_GOAL_HOME.jpg`: Nik's goal image, for composition only. Never ship it or copy text from it.
- `assets/LOGO_CM17_WORDMARK_V1.png` (transparent). **May be absent.** If absent, build the wordmark as `aria-hidden` DOM text (`CAREER MODE` / `SHOWDOWN 17`, Barlow Condensed 700 italic, C6 title treatment) and note it.

## S. Product truth for Home (from `origin/main`, plus the explicit Audius exception below)
Read: `index.html` `#mainMenu` and `#topHeader`; `js/menuExperience.js` (`getSavedShowdownMenuMeta`, the media list, how the media choice buttons and the status line are built, but the media content follows the Audius direction below, not main's YouTube list, the Continue tile's enabled/disabled logic); `js/onlinePlayerIdentity.js` (`configureOnlineProductSurface`: the tile text for Nik; `ensureOnlineIdentityBadge`: badge labels). Reproduce the resulting DOM for each frame: same ids, classes that JS reads, roles, aria, order.
- Heading: `.fifaMenuEyebrow` `CAREER MODE // SHOWDOWN 17`, `<h2>HOME</h2>`, `.fifaMenuHeadingMeta` = `RIVALRY HEADQUARTERS` + `Build the rivalry, play every season, and carry each trophy into your Legacy.`
- Six tile buttons exist in the DOM, in this order: `#continueCareer`, `#newShowdown`, `#legacyButton`, `#careerStatisticsButton`, `#ruleBookButton`, `#settingsButton`. **Visible product surface = four (SOL-HLC-1):** the online runtime (`js/onlinePlayerIdentity.js`, its injected style) hides `#legacyButton` and `#careerStatisticsButton`. Keep both in the DOM exactly once, hidden the same way; lay out only Continue, New/Join, Rule Book and Settings, with no empty holes.
- Soundtrack (SOL-HLC-2, **Audius only**): one card, with the existing `#menuMusicPlayer`, `#menuMusicStatus` (role=status, live region), `#menuMusicToggle` `PLAY TRACK`, `#menuMusicMute` `MUTE` (disabled while nothing plays). Source label `AUDIUS`. Four choices, in this order: `WHAT YOU GOT` / `Valentino Khan & NITTI`; `SNOW GLOBE` / `Hadji Gaviota`; `NASTY` / `grouptherapy.`; `I'M ALWAYS RIGHT` / `The Holdup`. No YouTube, no gameplay trailer, no iframe or player artwork, no autoplay, no "playing" state in any frame. The open Audius work is a direction reference only; never merge its branch.
- `.menuBottomStrip`: `01 TWO MANAGER CAREER COMPETITION`, `02 FIFA 17 ERA RULESET`, `READY`.
- Primary control for G4: HM1 (no save): `#continueCareer` is disabled, so `#newShowdown` is the primary. HM2/HM3: `#continueCareer`.
- Allowed decorative text (aria-hidden, G1): `THE RIVALRY STARTS HERE`, `TWO MANAGERS · ONE LEGACY` (both are the product's own startup lockup lines), the wordmark, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, and the text painted in the plate.

**Fixture authority (D5).** Home fixtures = current-main Home product strings + the explicit Sol/owner-approved Audius exception in this section S. The four Audius track titles/artists, source label `AUDIUS`, and Audius status/control strings are authoritative for this static Home visual prototype even though main still carries the old YouTube catalog. Default selected track in HM1/HM2/HM3: `WHAT YOU GOT — Valentino Khan & NITTI`.

**Frames (fixtures per the fixture authority above):**
| Frame | State | Header | Tile text that differs |
| --- | --- | --- | --- |
| HM1 (Tier S) | signed out, no save | badge `SIGN IN`, indicator `No Active Showdown` | Continue disabled, meta `No active showdown saved`; `NEW` / `START A SHOWDOWN` / `Choose seasons and create the code` |
| HM2 | Nik signed in, active save | badge `NIK`, indicator = main's active-save indicator text | Continue meta `Daniel vs Nik · Season 2 of 3`; `JOIN` / `JOIN DANIEL'S SHOWDOWN` / `Paste Daniel's code` (longest strings: fit gate) |
| HM3 | Daniel signed in, completed | badge `DANIEL`, indicator per main | `VIEW COMPLETED SHOWDOWN`, `Daniel vs Nik · Showdown complete` |

## H. Build items
**H0 · Source check** (C2). Build `fixtures.json` from the combined fixture authority in section S (current-main strings + the Audius exception, default track `WHAT YOU GOT — Valentino Khan & NITTI`). G1's expected visible strings exclude the two product-hidden tiles.

**H1 · Desktop stage and lockup.** Header and footer per C6. Left column (goal: x 2.4–36 % of the plate, y 12–42 %): kicker `THE RIVALRY STARTS HERE` (15 px, letter-spacing .5em, `#E9DFC8`), the wordmark (width ≈ 32 % of the viewport at 1366, never overlapping Daniel's protected boxes), `TWO MANAGERS · ONE LEGACY` under it. Then the heading block (goal: y 57–71 %): `<h2>HOME</h2>` styled as the small gold label (Barlow Condensed 700 18 px, letter-spacing .12em, `#F2C45B`, 28 px gold underline), `RIVALRY HEADQUARTERS` as the big line (Barlow Condensed 700 44 px, `#FFFFFF`), the sentence under it (Barlow 16 px, `#E9DFC8`). `.fifaMenuEyebrow` is visually hidden (it repeats the wordmark; stays in the DOM). Put a soft left-side scrim behind this column (`linear-gradient(90deg, rgba(6,7,9,.78) 0, rgba(6,7,9,.35) 38 %, transparent 52 %)`) until G7 passes. Do not include the goal's loading bar or its "Local save system · your career remains on this device" line (they belong to the startup screen, and the claim is no longer true with connected accounts).

**H2 · Four action tiles.** One row of four equal tiles across the bottom (goal's action dock: x 2.4–97.6 %, y 73–91 %), 10 px gaps, anchored to the viewport bottom above the footer so they stay whole at 1366×640. Order: `#continueCareer`, `#newShowdown`, `#ruleBookButton`, `#settingsButton`. Each tile: dark glass `rgba(10,12,15,.78)` + `backdrop-filter: blur(10px)`, 1 px `rgba(201,155,69,.45)` border, a 2 px gold top seam, a `›` chevron bottom-right. Text stack: code (Barlow Condensed 600 12 px, letter-spacing .2em, `#C99B45`), label (Barlow Condensed 700 26 px, uppercase, white, max 2 lines), meta (Barlow 14 px, `#CFC6B4`, max 2 lines). Tile icons must match the icons in the goal mockup (`visual-assets/goals/GOAL_HOME.png`, action dock) as closely as possible, `aria-hidden`, about 72 px on the right of the tile. Mapping by meaning: `#continueCareer` gets the mockup's player seen from behind with `17` on the shirt (owner direction 2026-10-01; covered by the Home-only icon exception in C5.4); `#newShowdown` gets the mockup's tactics clipboard (New Showdown); `#ruleBookButton` gets the mockup's spiral tactics notebook (Rules / Rule Book); `#settingsButton` gets the mockup's dark disc case (Local Save Library), the nearest mockup icon to Settings, which has no tile of its own in the mockup. The mockup's cup (History Legacy) and rising bars (Data Statistics) belong to Legacy and Statistics, which stay hidden per SOL-HLC-1, so they are not shown unless Nik later unhides those tiles. Method (D4): draw each icon as an inline SVG redraw (`aria-hidden`, decorative UI art derived from Nik's supplied Home goal) matching the goal's silhouette, shape, style and colours. Do not crop the icons into new PNGs. No photographic player art; the Continue icon may depict only the goal's anonymous back-facing `17` shirt figure. `#continueCareer` is the gold tile: `linear-gradient(135deg,#F7D46A,#E0AE3A)` with ink text. Disabled Continue (HM1): keep the gold identity at 45 % opacity, no hover lift, and make `#newShowdown` read as the active primary (gold top seam doubled, `#F2C45B` border). Hover/focus on enabled tiles: border `#F2C45B`, 1 px lift.

**H3 · Audius soundtrack card.** Goal position: right side, x 64–97.6 %, y 52.5–70 %, clear of Nik's hand box by ≥ 8 px and of the tile row by ≥ 12 px. Dark glass panel as the tiles. Left: a code-drawn vinyl disc (concentric CSS circles, gold label), static, plus five static gold equalizer bars; no photo, no cover art. Right: a 12 px eyebrow per main/Audius direction, the selected track title (Barlow Condensed 700 26 px, white), artist (14 px), source `AUDIUS` (12 px, right). The four choices as compact chips in one row or a 2 × 2 grid (min 32 px tall desktop; selected chip gold). `PLAY TRACK` compact gold, `MUTE` secondary (disabled), both 40 px. `#menuMusicStatus` as one 12 px line. If it does not fit at 1366×768, shrink the vinyl first. Report what you did.

**H4 · Phone (C7).** Top: header (48). Then a plate band showing both managers' heads (faces whole, never cut through a face), with the wordmark over the band's lower-left only if it clears both protected face boxes; otherwise omit the wordmark and kicker on phone and say so. Then `HOME` label + `RIVALRY HEADQUARTERS` (28 px) + the sentence (14 px, max 2 lines). The four visible tiles in a 2 × 2 grid (Continue first), each ≥ 72 px tall: code + label visible; meta visible on `#continueCareer` (and on `#newShowdown` in HM1), visually hidden (still in DOM) on the others. Soundtrack: one compact strip (title + artist on one line, `PLAY TRACK` and `MUTE` at 44 px, the four chips as a 44 px row); `#menuMusicStatus` may be visually hidden on the tightest layout but stays a live region. `.menuBottomStrip` visually hidden on phone, visible on desktop. Every "visually hidden on phone" choice goes into the handoff as a numbered item for Sol.
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C1b · Plate G base.** Screen branches are cut by the intake session from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (the expected base; the intake session STOPs with `PLATE_G_SOURCE_DRIFT` rather than cut from a different head). Record the base SHA in BUILD_RESULT.md.

**C2 · Source check.** `git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs, or any merge into main (the only merge allowed is the pinned crest SHA in League and Club). Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. Nothing animates (static checkpoint; motion comes later).

**C4b · One plate-mapping helper (SOL-HLC-4).** The plate is a `cover`-fit background. Write one function, `plateToScreen(x, y)`, and use it for every plate-registered thing: overlays, the `&grid=1` evidence, wheel and pack positions, and the G8 protected-box checks. With stage size `W×H` and plate 1X size `PW×PH`:
`k = max(W/PW, H/PH)`; `offsetX = (W − PW·k)/2`; `offsetY = (H − PH·k)/2`; `screenX = offsetX + x·k`; `screenY = offsetY + y·k`.
If you change `background-position`, the offsets must follow that exact position (e.g. a vertical bias). Any plate cut-out (the League fingertip) uses the same transform. The phone band may use its own transform, but write it explicitly in the code and in BUILD_RESULT.md, and measure against it.

**C5 · Fixed product and identity rules.**
1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate (sole exception: the Home-only anonymous decorative icon below), no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from the pinned `ACCEPTED_CREST_SHA` (League, Club) (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
   Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`. The Home-only tile icons are not rasters: they are inline SVG redraws (see the Home-only icon exception under rule 4); no new raster-icon exception, no PNG crops of the goal.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere, footer and all helper/source labels included (SOL-HLC-7); body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise (the only such case is the Club-only pack-box exception in G8).

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). Desktop shows the badge plus the product brand. On phone the brand text may be visually hidden (still in the DOM) and only the `CM 17` badge retained.
  - Right: the product's `#onlinePlayerIdentityBadge` button (fixture `SIGN IN`) and `#seasonIndicator` (fixture per frame). Dark glass `rgba(10,12,15,.72)`, 1 px `rgba(201,155,69,.55)` border, Barlow Condensed 600 14 px, letter-spacing .12em, min height 40 desktop / 44 phone.
  - Desktop only, `aria-hidden`: the script line `More Than A Game` (Kaushan Script 18 px, `#F2C45B`, rotate −8°) at the far right. Hide below 900 px width.
  - No navigation tabs (HOME / CAREER / STANDINGS / STATS / RULES / ABOUT) and no search, settings or profile icons. They are in the goal images but not in the product.
- Footer: the product `<footer>` text `Career Mode Showdown` + `v1.9.1` at the left (12 px, `#9A8F7A`), and `aria-hidden` decorative `FOOTBALL BRINGS US TOGETHER` + a small gold crown glyph at the right (desktop only). 28 px desktop; on phone the footer may be omitted from the fold if space is needed, never covering controls.
- Grade: gold-dominant. Gold `#F2C45B` / deep gold `#C99B45` / ink `#0B0D10`. Primary button: solid gold gradient `linear-gradient(180deg,#F7D46A,#E0AE3A)` with ink text, Barlow Condensed 700 20 px, letter-spacing .06em, height 56 desktop / 52 phone. Secondary button (BACK): transparent dark glass, 1 px `rgba(233,223,200,.55)` border, light text, same height.
- Screen titles (`<h2>`): DOM text in Barlow Condensed 700 italic, uppercase, gold gradient fill (`#FFF1B8 → #F2C45B → #B98A2F`, top to bottom) with a warm glow (`drop-shadow(0 0 18px rgba(242,196,91,.35))`) and a subtle brush-edge SVG `feTurbulence`+`feDisplacementMap` filter (scale ≤ 3). Kicker above (`CAREER MODE SHOWDOWN 17`, 13 px, letter-spacing .5em) is decorative, `aria-hidden`.
- Focus ring on every control: 2 px `#FFF1B8` outline, 3 px offset.

**C7 · Phone layout.** Any portrait viewport up to 760 px wide uses the phone layout: the plate is cropped to a band showing both managers' heads (read `platemap.json` protected boxes), and the UI stacks below or over the band's lower edge, like slice-02-plate's phone recomposition. You solve the composition; the gates in section G decide.

**C8 · Cost and stop rules.** Run `date` at start and record it. Commit and push at the checkpoint named in PRIORITY_ORDER and at the end. At 80 % of STOP_BUDGET stop adding scope: finish the current item, capture evidence for what is done, mark the rest `NOT DONE`, commit, push. At 100 % stop. Installs: `npm ci` in your tools folder only if you need Playwright; otherwise use `NODE_PATH=$(npm root -g)` like slice-02-plate. An item that fails its gate twice is `BLOCKED` with measured values; no third attempt.

**C9 · Deliverables committed in your folder (all required).**
1. `BUILD_RESULT.md`: model, effort, start/end time, head SHA, SOURCE_DRIFT line, how to run, frame list, item status (DONE / NOT DONE / BLOCKED) in PRIORITY_ORDER, known limits.
2. `evidence/qa_report.json` + every screenshot named `<FRAME>_<W>x<H>.jpg` (phone at DPR 2, desktop at DPR 1, plus one desktop at DPR 2).
3. `tools/build_preview.py` output `preview.html`: a single-file preview (inline CSS/JS/JSON, plate as a data URI at 1X) so the review page renders in claude.ai.
4. `CLAUDE_<SCREEN>-BUILD_HANDOFF_TO_SOL_<yyyy-mm-dd>.md`, addressed to GPT-5.6 Sol: what was built, gate results table, every place the goal image and the product disagreed and what you did (numbered items), open questions, and what Nik should look at.
Commit messages start with `visual: <SCREEN>-V1`. Push with `git push -u origin <branch>`. Reply at the end with the head SHA and the four file paths.
## G. Render-QA gates (measured by assertions in `tools/render-qa.cjs`; results in `evidence/qa_report.json`)

Viewports: desktop 1366×768 (Tier S), 1440×900, 1920×1080, 1366×640, plus 1366×768 at DPR 2; phone 360×640, 375×553, 390×844, 430×932 at DPR 2. Every frame at every viewport unless a gate says otherwise.

| Gate | Assertion (hard fail unless stated) |
| --- | --- |
| G1 Strings | Visible text nodes of each frame = that frame's expected list in `fixtures.json` (built from section S: current-main strings; for Home also the explicit Audius exception in Home section S) + the allowed decorative list in section S. Report any missing or extra string. 0 extra, 0 missing. |
| G2 IDs | Every product id in section S exists exactly once; roles and aria attributes match main. |
| G3 No scroll | `scrollHeight ≤ innerHeight + 1` and `scrollWidth ≤ innerWidth + 1` on `html` and `body`. |
| G4 Primary action | The frame's primary control (section S) is fully inside the viewport, and `elementFromPoint` at its centre returns it. Must hold at 375×553 and 1366×640. |
| G5 No clipping | Every text element: `scrollWidth ≤ clientWidth + 1`, `scrollHeight ≤ clientHeight + 1`; no `text-overflow: ellipsis`. Includes the longest fixture strings. |
| G6 Sizes | Phone: every control ≥ 44 px tall and ≥ 44 px wide; no text under 12 px; body copy ≥ 14 px. Desktop: controls ≥ 40 px. |
| G7 Contrast | Brightest-background-pixel method (same as slice-02-plate): normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1, control borders ≥ 3:1. Fix a failure with a local scrim first. |
| G8 Faces and hands | Using `plateToScreen` (C4b): face and hand protected boxes always require ≥ 8 px clearance: no UI box (text, control, panel) intersects any face or hand `protected_boxes` rect grown by 8 px, except where section S allows it. **Club-only pack-box exception (D7):** the two pack boxes (`pack_daniel`, `pack_nik`) are an explicit exception for K3's `aria-hidden` pack-open treatment in CL3–CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell. Intake hard-restores face, hand and pack protected boxes alike; this gate is runtime occlusion only. Report separately: (a) face/hand clearance (smallest per frame); (b) pack-overlay containment inside each pack box; (c) zero live-text/control intersection with pack boxes. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG (including the four inline/data SVG Home tile icons, Home only). `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

~~~~

---

### FILE: visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md

~~~~markdown
Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/league-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/league-v1 && git checkout claude-cloud/league-v1`. If the branch or `visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_1X.webp` is missing, STOP and reply "League plate not committed yet".
Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
`ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>`
After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getLeagueMark`, STOP and reply "Accepted crest SHA not available".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-LEAGUE-V1
STOP_BUDGET: 45 min wall-clock / $10 credit (routing V3 §3, static checkpoint build)
PRIORITY_ORDER: W0 source check + crest merge > W1 wheel with the crest-v1 league marks > W2 fingertip overlay > W3 desktop layout (frame L1) > checkpoint commit+push > W4 frames L2–L4 > W5 phone > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/league/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · LEAGUE V1 R3 · Select League wheel on the League plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R3 (2026-10-01), applies GPT-5.6 Sol verdicts SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (R2) and SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 (D1-D8). R2 file kept untouched.
Changelog:
- R2.1 2026-10-01: wheel marks monochrome, off-white on dark / near-black on gold when selected (owner direction; OWNER-2).
- R3 2026-10-01: D1, D2 (via intake), D6, D8 (see FOR_SOL change log).
Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)

## 0. Intent
Nik's goal: a night stadium, Daniel (left) pointing his finger at a big gold-rimmed wheel in the centre, Nik (right) watching with his hand on his chin, a gold brush title above, a gold SPIN WHEEL and a dark BACK below. The goal's wheel shows the real league logos; that is not allowed. You build the product's wheel as live DOM/SVG using the project's **original** league marks from the crest build, sitting in the empty glow the plate leaves for it, with Daniel's fingertip in front of its rim.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_LEAGUE_PLATE_V1_1X.{webp,png}` (1536×864) and `_2X` (3072×1728).
- `assets/platemap.json`: protected boxes (both faces, Daniel's pointing hand, Nik's hand on chin), `remove_circles_cx_cy_r` = the wheel slot `[762, 496, 250]`, and `keep_rects` = Daniel's fingertip `[440,425,560,480]`, all in 1X plate px.
- `assets/REF_GOAL_LEAGUE.jpg`: Nik's goal with the league logos blurred, for composition only.

## S. Product truth for Select League (from `origin/main`)
Read: `index.html` `#leagueWheelScreen`; `js/leagueWheel.js` (all label and note strings, `getLeagueRotation`, busy state, when BACK is disabled); `data/leagues.js` (the league list and order); `css/app.css` wheel rules (`.leagueWheel`, `.wheelTrack`, `.wheelItem`, `.wheelPointer`) to see how items are placed.
- DOM to keep: `<h2>SELECT LEAGUE</h2>`, `.wheelContainer` > `.wheelPointer`, `#leagueWheel.leagueWheel` > `.wheelTrack` > 5 × `.wheelItem` (`Premier League`, `LaLiga`, `Bundesliga`, `Serie A`, `Ligue 1`, in main's order), `#selectedLeague` (role=status, aria-live=polite, aria-atomic=true), `#leagueStateNote` (role=status), `#spinLeague`, `.backButton[data-smart-back]`.
- **The rotation contract stays:** production rotates `.wheelTrack` by `getLeagueRotation(id)` = −(index × 72°) + whole turns, so item *i* must sit at +*i* × 72° clockwise from the pointer at 12 o'clock. Your prototype sets the same transform per frame. The goal's segment order (PL top, Bundesliga right, Ligue 1 lower right, Serie A lower left, LaLiga left) is **not** used; main's order wins.
- Primary control for G4: `#spinLeague` in every frame.
- Allowed decorative text (aria-hidden, G1): the kicker `CAREER MODE SHOWDOWN 17`, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, the two slogan boxes `DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION` and `WHERE RIVALS / CREATE LEGENDS` (desktop only), the country codes inside the crest-build league marks, and the text painted in the plate.

**Frames (strings exactly as `leagueWheel.js` sets them):**
| Frame | State | `#selectedLeague` | `#spinLeague` | `#leagueStateNote` | BACK |
| --- | --- | --- | --- | --- | --- |
| L1 (Tier S) | ready | `Spin to select league` | `SPIN WHEEL` | hidden | enabled |
| L2 | spinning (static mid-spin, track at `+(2 × 360 − 3 × 72 + 31)°` for the illustrative Serie A mid-spin sample, or another positive whole-turn-plus-offset angle; the exact L2 angle is presentation-only, its rotation direction must match production) | `SPINNING...` | `SPINNING...`, disabled | hidden | disabled |
| L3 | selected, not confirmed (Bundesliga) | `Bundesliga` | `CONTINUE TO CLUB ASSIGNMENT` | main's "has been selected and locked…" note for Bundesliga | enabled per main |
| L4 | clubs already locked (Bundesliga) | `Bundesliga` | `LEAGUE LOCKED`, disabled | `League and clubs are permanent for this showdown.` | enabled per main |

## W. Build items
**W0 · Source check** (C2). Build `fixtures.json` from main's strings; confirm the button/BACK disabled states per frame from the code (the table above is my reading; main wins).

**W1 · Wheel and original league marks.** Centre the wheel on the plate slot `(762, 496)`; outer rim radius 240 plate px (× k). Build it as `aria-hidden` SVG layers plus the live `.wheelItem` text:
- Rim: 18 px (plate px) gold ring `linear-gradient` `#FFF1B8 → #C99B45 → #7A5A22`, 20 small studs evenly spaced, a thin inner dark ring. A fixed pointer at 12 o'clock: a gold downward chevron with a small crown, on top of the rim (`.wheelPointer` keeps its text node visually hidden and draws the chevron in CSS/SVG).
- Five equal 72° segments, dark glass `#0E1013 → #181B20` radial, separated by 2 px gold spokes. A **fixed gold wedge** under the pointer (does not rotate): `linear-gradient(#F7D46A,#C99B45)` at 85 % opacity, lighting whichever segment sits at the top. The selected segment (under the wedge) shows its mark and name in near-black; every other segment shows them in off-white/pale gold (see the colour requirement below).
- Hub: a 22 % radius dark roundel with a 4 px gold ring and a gold crown (`aria-hidden`). It replaces main's `CMS 17` pseudo-content.
- Each segment: the league's original mark (about 64 plate px) above the `.wheelItem` name (Barlow Condensed 700 22 plate px, uppercase via CSS only if main's text stays unchanged in the DOM). Text is always upright relative to its segment's radius, never mirrored, and must stay readable at the top segment.
- **Wheel colour language (owner direction, Nik 2026-10-01; REQUIRED).** All league marks on the wheel use one monochrome colour language, whatever their own brand colours, matching the League goal mockup (`visual-assets/goals/`, Premier League selected). Unselected wedges: dark charcoal/black wedge, with the league mark and name in clean off-white / faded pale gold (about `#EFE6CF`), monochrome. The selected wedge: bright gold wedge, with the mark and name in near-black (about `#0B0D10`, "black gold"), monochrome. Clean and crisp: no multicolour marks anywhere on the wheel. Implementation: render `getLeagueMark(id).svg` monochrome via CSS `mask-image` with `background: currentColor` (or strip its fills to `currentColor`), and set `color` per state (pale on dark, near-black on the selected gold wedge). The marks' own colours (`primary`) may still be used elsewhere, never on the wheel.
- **League marks come only from the crest build.** Load `../../../js/visualIdentity.js` (merged from `ACCEPTED_CREST_SHA`) and use `applyLeagueMark(el, leagueId)` (sets `--league-mark-image` and `data-league-mark="original"`) or `getLeagueMark(leagueId).image`, with the ids from `data/leagues.js`. Do not draw, edit or restyle league marks yourself, and do not touch `data/leagues.js` (its `logo` fields point at real-logo files that don't exist; that is flagged for Sol separately). If a mark is missing for a league, show only the name and list it in the handoff.

**W2 · Fingertip overlay.** Cut Daniel's hand and fingertip from the 1X and 2X plates inside `keep_rects[0]` with a hand-drawn polygon mask (1.5 px feather), script `tools/make_finger_overlay.py`, output `assets/OVL_DANIEL_FINGER_V1_{1X,2X}.png`. Layer it above the wheel so the finger reads as in front of the rim, exactly registered to the plate through `plateToScreen` (C4b), 0 px offset at 1X, measured. G8 exception: the wheel may sit under this hand; no live text may be under it.

**W3 · Desktop layout (L1).** Header/footer per C6. Title block centred over the wheel (goal: y 10–28 %): kicker, then `<h2>SELECT LEAGUE</h2>` (C6 title, 72 px at 1366), then `#selectedLeague` as the spaced subtitle line between two thin gold rules (15 px, letter-spacing .4em; when it shows a league name use 22 px, `#F2C45B`). `#leagueStateNote` (when shown) is a 14 px line on a small dark-glass strip just above the buttons. Buttons side by side under the wheel (goal: y 86–93 %): `#spinLeague` primary gold 300 px wide, BACK secondary 200 px, 16 px gap; the spin button keeps its circular-arrows icon only as `aria-hidden` SVG. Slogan boxes left and right at goal positions (desktop ≥ 1200 px only), thin gold corner rules, 14 px spaced type. The wheel scales so title, wheel, note and buttons fit at 1366×640 (the wheel may shrink to 80 %).

**W4 · Frames L2–L4** from the table in S. In L3/L4 the selected league sits under the wedge (rotation −(2 × 72)° for Bundesliga with main's order). L2 shows a static mid-spin angle (positive, per the L2 row in S; direction matches production `getLeagueRotation(selected.id, 5)`; L3/L4 normalization unchanged, Bundesliga at −144° after spin) with a subtle `aria-hidden` motion-blur ring on the segments (CSS only, no animation).

**W5 · Phone (C7).** Header 48. Plate band cropped so both faces stay whole (or fully out of frame, never cut); the wheel (diameter 220–250 px at 360 wide) overlaps the band's lower centre, so Daniel's finger still points at it if the crop allows; if the finger overlay cannot be aligned on phone, hide the overlay and keep the wheel clear of the hand. Title 40 px, `#selectedLeague` under it, note (max 3 lines, 14 px), then `#spinLeague` full width and BACK full width (48 px each), all within 360×640 with `#spinLeague` fully visible at 375×553. Slogan boxes hidden on phone.
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C1b · Plate G base.** Screen branches are cut by the intake session from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (the expected base; the intake session STOPs with `PLATE_G_SOURCE_DRIFT` rather than cut from a different head). Record the base SHA in BUILD_RESULT.md.

**C2 · Source check.** `git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs, or any merge into main (the only merge allowed is the pinned crest SHA in League and Club). Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. Nothing animates (static checkpoint; motion comes later).

**C4b · One plate-mapping helper (SOL-HLC-4).** The plate is a `cover`-fit background. Write one function, `plateToScreen(x, y)`, and use it for every plate-registered thing: overlays, the `&grid=1` evidence, wheel and pack positions, and the G8 protected-box checks. With stage size `W×H` and plate 1X size `PW×PH`:
`k = max(W/PW, H/PH)`; `offsetX = (W − PW·k)/2`; `offsetY = (H − PH·k)/2`; `screenX = offsetX + x·k`; `screenY = offsetY + y·k`.
If you change `background-position`, the offsets must follow that exact position (e.g. a vertical bias). Any plate cut-out (the League fingertip) uses the same transform. The phone band may use its own transform, but write it explicitly in the code and in BUILD_RESULT.md, and measure against it.

**C5 · Fixed product and identity rules.**
1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate (sole exception: the Home-only anonymous decorative icon below), no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from the pinned `ACCEPTED_CREST_SHA` (League, Club) (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
   Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`. The Home-only tile icons are not rasters: they are inline SVG redraws (see the Home-only icon exception under rule 4); no new raster-icon exception, no PNG crops of the goal.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere, footer and all helper/source labels included (SOL-HLC-7); body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise (the only such case is the Club-only pack-box exception in G8).

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). Desktop shows the badge plus the product brand. On phone the brand text may be visually hidden (still in the DOM) and only the `CM 17` badge retained.
  - Right: the product's `#onlinePlayerIdentityBadge` button (fixture `SIGN IN`) and `#seasonIndicator` (fixture per frame). Dark glass `rgba(10,12,15,.72)`, 1 px `rgba(201,155,69,.55)` border, Barlow Condensed 600 14 px, letter-spacing .12em, min height 40 desktop / 44 phone.
  - Desktop only, `aria-hidden`: the script line `More Than A Game` (Kaushan Script 18 px, `#F2C45B`, rotate −8°) at the far right. Hide below 900 px width.
  - No navigation tabs (HOME / CAREER / STANDINGS / STATS / RULES / ABOUT) and no search, settings or profile icons. They are in the goal images but not in the product.
- Footer: the product `<footer>` text `Career Mode Showdown` + `v1.9.1` at the left (12 px, `#9A8F7A`), and `aria-hidden` decorative `FOOTBALL BRINGS US TOGETHER` + a small gold crown glyph at the right (desktop only). 28 px desktop; on phone the footer may be omitted from the fold if space is needed, never covering controls.
- Grade: gold-dominant. Gold `#F2C45B` / deep gold `#C99B45` / ink `#0B0D10`. Primary button: solid gold gradient `linear-gradient(180deg,#F7D46A,#E0AE3A)` with ink text, Barlow Condensed 700 20 px, letter-spacing .06em, height 56 desktop / 52 phone. Secondary button (BACK): transparent dark glass, 1 px `rgba(233,223,200,.55)` border, light text, same height.
- Screen titles (`<h2>`): DOM text in Barlow Condensed 700 italic, uppercase, gold gradient fill (`#FFF1B8 → #F2C45B → #B98A2F`, top to bottom) with a warm glow (`drop-shadow(0 0 18px rgba(242,196,91,.35))`) and a subtle brush-edge SVG `feTurbulence`+`feDisplacementMap` filter (scale ≤ 3). Kicker above (`CAREER MODE SHOWDOWN 17`, 13 px, letter-spacing .5em) is decorative, `aria-hidden`.
- Focus ring on every control: 2 px `#FFF1B8` outline, 3 px offset.

**C7 · Phone layout.** Any portrait viewport up to 760 px wide uses the phone layout: the plate is cropped to a band showing both managers' heads (read `platemap.json` protected boxes), and the UI stacks below or over the band's lower edge, like slice-02-plate's phone recomposition. You solve the composition; the gates in section G decide.

**C8 · Cost and stop rules.** Run `date` at start and record it. Commit and push at the checkpoint named in PRIORITY_ORDER and at the end. At 80 % of STOP_BUDGET stop adding scope: finish the current item, capture evidence for what is done, mark the rest `NOT DONE`, commit, push. At 100 % stop. Installs: `npm ci` in your tools folder only if you need Playwright; otherwise use `NODE_PATH=$(npm root -g)` like slice-02-plate. An item that fails its gate twice is `BLOCKED` with measured values; no third attempt.

**C9 · Deliverables committed in your folder (all required).**
1. `BUILD_RESULT.md`: model, effort, start/end time, head SHA, SOURCE_DRIFT line, how to run, frame list, item status (DONE / NOT DONE / BLOCKED) in PRIORITY_ORDER, known limits.
2. `evidence/qa_report.json` + every screenshot named `<FRAME>_<W>x<H>.jpg` (phone at DPR 2, desktop at DPR 1, plus one desktop at DPR 2).
3. `tools/build_preview.py` output `preview.html`: a single-file preview (inline CSS/JS/JSON, plate as a data URI at 1X) so the review page renders in claude.ai.
4. `CLAUDE_<SCREEN>-BUILD_HANDOFF_TO_SOL_<yyyy-mm-dd>.md`, addressed to GPT-5.6 Sol: what was built, gate results table, every place the goal image and the product disagreed and what you did (numbered items), open questions, and what Nik should look at.
Commit messages start with `visual: <SCREEN>-V1`. Push with `git push -u origin <branch>`. Reply at the end with the head SHA and the four file paths.
## G. Render-QA gates (measured by assertions in `tools/render-qa.cjs`; results in `evidence/qa_report.json`)

Viewports: desktop 1366×768 (Tier S), 1440×900, 1920×1080, 1366×640, plus 1366×768 at DPR 2; phone 360×640, 375×553, 390×844, 430×932 at DPR 2. Every frame at every viewport unless a gate says otherwise.

| Gate | Assertion (hard fail unless stated) |
| --- | --- |
| G1 Strings | Visible text nodes of each frame = that frame's expected list in `fixtures.json` (built from section S: current-main strings; for Home also the explicit Audius exception in Home section S) + the allowed decorative list in section S. Report any missing or extra string. 0 extra, 0 missing. |
| G2 IDs | Every product id in section S exists exactly once; roles and aria attributes match main. |
| G3 No scroll | `scrollHeight ≤ innerHeight + 1` and `scrollWidth ≤ innerWidth + 1` on `html` and `body`. |
| G4 Primary action | The frame's primary control (section S) is fully inside the viewport, and `elementFromPoint` at its centre returns it. Must hold at 375×553 and 1366×640. |
| G5 No clipping | Every text element: `scrollWidth ≤ clientWidth + 1`, `scrollHeight ≤ clientHeight + 1`; no `text-overflow: ellipsis`. Includes the longest fixture strings. |
| G6 Sizes | Phone: every control ≥ 44 px tall and ≥ 44 px wide; no text under 12 px; body copy ≥ 14 px. Desktop: controls ≥ 40 px. |
| G7 Contrast | Brightest-background-pixel method (same as slice-02-plate): normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1, control borders ≥ 3:1. Fix a failure with a local scrim first. |
| G8 Faces and hands | Using `plateToScreen` (C4b): face and hand protected boxes always require ≥ 8 px clearance: no UI box (text, control, panel) intersects any face or hand `protected_boxes` rect grown by 8 px, except where section S allows it. **Club-only pack-box exception (D7):** the two pack boxes (`pack_daniel`, `pack_nik`) are an explicit exception for K3's `aria-hidden` pack-open treatment in CL3–CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell. Intake hard-restores face, hand and pack protected boxes alike; this gate is runtime occlusion only. Report separately: (a) face/hand clearance (smallest per frame); (b) pack-overlay containment inside each pack box; (c) zero live-text/control intersection with pack boxes. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG (including the four inline/data SVG Home tile icons, Home only). `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

~~~~

---

### FILE: visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md

~~~~markdown
Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/club-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/club-v1 && git checkout claude-cloud/club-v1`. If the branch or `visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_1X.webp` is missing, STOP and reply "Club plate not committed yet".
Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
`ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>`
After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getClubCrestSvg`, STOP and reply "Accepted crest SHA not available".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-CLUB-V1
STOP_BUDGET: 60 min wall-clock / $15 credit (routing V3 §3, first-of-kind: first pack-reveal composition; Nik confirms by launching it)
PRIORITY_ORDER: K0 source check + crest merge > K1 desktop CL1 ready > K2 desktop CL6 confirmation > K3 pack-open treatment (CL3) > checkpoint commit+push > K4 phone CL1 + CL6 > K5 frames CL2, CL4, CL5 (desktop, then phone) > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/club/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · CLUB V1 R3 · Club Assignment on the Club plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R3 (2026-10-01), applies GPT-5.6 Sol verdicts SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (R2) and SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 (D1-D8). R2 file kept untouched.
Changelog: R3 2026-10-01: D1, D2 (via intake), D7, D8 (see FOR_SOL change log).
Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)

## 0. Intent
This is the screen furthest from Nik's goal. Main today is a light-blue page with two flat grey pack cards. The goal: a night stadium, Daniel (left) and Nik (right) each holding a sealed black "CLUB PACK CM17" at chest height, a gold brush `CLUB ASSIGNMENT` title with the league status under it, a five-step draw rail, a big `VS` between the packs, a dark panel along the bottom with both managers' club slots, and a gold `OPEN SHOWDOWN PACKS` button. The packs in the plate are the product's sealed pack doors. You place the product's live reveal UI on the plate and give each pack a code-drawn "opened" state that reveals the club's original crest.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_CLUB_PLATE_V1_1X.{webp,png}` (1536×864) and `_2X` (3072×1728).
- `assets/platemap.json`: protected boxes (both faces) and `pack_daniel` / `pack_nik` (the held packs), in 1X plate px.
- `assets/REF_GOAL_CLUB.jpg`: Nik's goal image, for composition only.
- Crests: `../../../js/visualIdentity.js` after the `ACCEPTED_CREST_SHA` merge: `getClubIdentity(name).crest`, `getClubCrestSvg(name)`, CSS var `--club-crest-image` (set by `applyClubIdentity(el, name)`). Hand-authored original crests. No other crest source; never draw or restyle a crest yourself.

## S. Product truth for Club Assignment (from `origin/main`)
Read: `index.html` `#clubWheelScreen`; `js/clubAssignment.js` (`CLUB_REVEAL_STAGES`, every `setClubText` string per stage, `setRevealControls` per stage, `populateClubConfirmation`, `applyClubRevealCard` and how it applies the crest/identity); the `#clubWheelScreen` / `.club*` rules in `css/app.css` to see which states are shown or hidden per `data-club-reveal-stage`.
- DOM to keep (ids, order, aria): `<h2>CLUB ASSIGNMENT</h2>`; `.clubAssignmentHeader` (`LEAGUE CONFIRMED` eyebrow, `#clubAssignmentLeague`, `#clubPackStatus` aria-live=polite); `.clubRevealProgress` (aria-hidden, 5 spans `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK` with `active`/`done` classes); two `.clubRevealCard` (`#clubCardOne` Daniel left, `#clubCardTwo` Nik right), each with `.clubRevealIndex`, `.clubManager`, `.clubPackStage` > `.clubPackDoor` (aria-hidden) + `.clubCardFace` (`CAREER DRAW`, `ASSIGNED CLUB`, club name `#clubNameOne/Two`, state `#clubCardStateOne/Two`); `.clubVs` (`RIVALRY` / `VS`); `#clubRivalryConfirmation` (aria-live=polite: `CLUBS LOCKED`, showdown name, meta, matchup, lock note); `#openClubPack`, `#continueClubAssignment`, `#clubAssignmentBack`.
- Fixtures: league `Premier League`; Daniel `Arsenal`, Nik `Chelsea`; showdown name `Daniel vs Nik`; 3 seasons → meta `Premier League · 3 seasons`.
- Allowed decorative text (aria-hidden, G1): kicker `CAREER MODE SHOWDOWN 17`, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, the `.clubPackDoor` text (visually hidden, see K1), the crest initials inside visualIdentity SVGs, and the text painted in the plate (`CLUB PACK`, `CM 17`, banners, notes).

**Frames (strings and controls exactly as `clubAssignment.js` sets them; the table is my reading, main wins):**
| Frame | Stage | `#clubPackStatus` | Cards | Confirmation | Controls (primary for G4) |
| --- | --- | --- | --- | --- | --- |
| CL1 (Tier S) | ready | `LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY` | both `?` / `SEALED` | hidden | `OPEN SHOWDOWN PACKS` (primary) + BACK |
| CL2 | opening | `CLUB DRAW SAVED · PREPARING PACK 01` | both sealed | hidden | `DRAW LOCKED...` disabled; BACK hidden. G4 exempt |
| CL3 | manager-one | `DANIEL · PACK 01 OPEN` | Daniel revealed, Nik sealed | hidden | as CL2. G4 exempt |
| CL4 | manager-two | `NIK · PACK 02 OPEN` | both revealed | hidden | as CL2. G4 exempt |
| CL5 | versus | `BOTH CLUBS REVEALED · BUILDING RIVALRY` | both revealed | shown | no controls. G4 exempt |
| CL6 | confirmation | `RIVALRY READY · CONFIRM TO BEGIN` | both revealed | shown | `CONFIRM RIVALRY & START SHOWDOWN` (primary) only |

## K. Build items
**K0 · Source check** (C2). Build `fixtures.json` per frame from main.

**K1 · Desktop CL1 (ready).** Header/footer per C6.
- Title block centred between the two faces (goal: x 30–70 %, y 11–34 %): kicker; `<h2>CLUB ASSIGNMENT</h2>` (C6 title, 64 px at 1366, must clear both face boxes by ≥ 8 px; shrink before touching a face); `LEAGUE CONFIRMED` eyebrow with a small `aria-hidden` gold check; `#clubAssignmentLeague` in 26 px gold (the goal omits the league name; the product shows it, so it stays); `#clubPackStatus` 15 px, letter-spacing .2em, with a small `aria-hidden` pack glyph.
- Draw rail (goal: y 37–44 %): five steps on a thin gold line, each a 36 px `aria-hidden` ring above its span text; `active` = solid gold ring + gold label, `done` = gold check in the ring, others dim. The span text stays one text node (`01 DRAW` etc.).
- Packs: the painted packs **are** the `.clubPackDoor` visuals. Position each `.clubPackStage` exactly over `pack_daniel` / `pack_nik`, make the door's own fill and text transparent (door text visually hidden; it is aria-hidden already), so the plate's pack shows through. Nothing covers the managers' hands.
- VS: `.clubVs` centred between the packs (goal: x 45–55 %, y 47–64 %): `RIVALRY` (14 px, letter-spacing .5em) over a big `VS` (Barlow Condensed 700 italic 96 px, C6 gold gradient + brush filter).
- Bottom panel (goal: x 9–91 %, y 69–86 %): a wide dark-glass trapezoid panel (`clip-path`, 1 px gold top edge, soft gold under-glow) holding the two `.clubCardFace` blocks, Daniel's left and Nik's right, with a thin `aria-hidden` divider and small `VS` between them. Each face: a 56 px shield slot (sealed: dark shield with a `?` drawn in SVG, `aria-hidden`), manager name from `.clubManager` (Barlow Condensed 700 22 px), `CAREER DRAW` / `ASSIGNED CLUB` (12 px spaced), club name (Barlow Condensed 700 26 px), state (12 px, `SEALED` dim, `REVEALED` gold). `.clubRevealIndex` shows as a small `01` / `02` tag. The goal's panel title `CLUBS LOCKED · SHOWDOWN` and its line "Once revealed, these clubs are permanent…" are **not** shown in CL1: in the product that copy belongs to the confirmation (CL5/CL6).
- Buttons (goal: y 87–93 %): `#openClubPack` primary gold 400 px with an `aria-hidden` pack glyph and chevron; `#clubAssignmentBack` secondary 200 px.

**K2 · Desktop CL6 (confirmation).** Cards revealed (K3). `#clubRivalryConfirmation` becomes the panel's header band and body: the tab on the panel's top edge reads `CLUBS LOCKED` + the showdown name (`Daniel vs Nik`) with the meta under it; the matchup (`Daniel` · `Arsenal` VS `Nik` · `Chelsea`) sits in the band; the lock note (14 px, max 2 lines) sits at the band's bottom. The card faces stay in the panel; if both the faces and the matchup cannot fit legibly, keep the faces' crest + club name and visually hide the duplicate matchup row, and list it for Sol. `#continueClubAssignment` is the only control, primary gold, 520 px. The big centre `VS` may shrink to 64 px here.

**K3 · Pack-open treatment (CL3, CL4, CL5, CL6).** For a revealed side, over that pack's box, all `aria-hidden`, CSS + inline SVG only: darken the painted pack face 35 % with a mask shaped to the box; a gold light burst from the pack's top edge (12–16 thin SVG rays, `mix-blend-mode: screen`, max 70 % opacity); the club's original crest (`getClubCrestSvg(name)` inline, or `--club-crest-image`) centred on the pack's crown shield at about 55 % of the pack width, with a 1 px gold rim and a soft glow; a torn top-edge strip (SVG zig-zag, 10 plate px) along the pack's top. Nothing from this treatment may enter a face or hand box (G8). It may enter the two pack boxes (Club-only exception, G8): only this bounded reveal treatment, never live text, controls or panels. The same crest also fills that side's 56 px shield slot in the panel.

**K4 · Phone CL1 + CL6 (C7).** Header 48. Title 34 px, league + status (≤ 2 lines), rail compact: 24 px rings with labels at ≥ 12 px; if the inactive labels cannot fit at 12 px, visually hide them and show only the active label (≥ 12 px); spans stay in the DOM (SOL-HLC-7). Plate band showing both managers with their packs; faces whole or fully out of frame, never cut. The band may shrink in CL5/CL6 (packs only, faces out) to make room for the confirmation. Card faces as two columns under the band; confirmation band under them in CL5/CL6. Primary button full width 52 px, BACK full width 44 px. All within 360×640; primary fully visible at 375×553.

**K5 · Frames CL2, CL4, CL5** per the table (desktop first, then phone). CL2 shows the `01 DRAW` rail step active and both packs with a faint `aria-hidden` gold edge pulse drawn statically (no animation).
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C1b · Plate G base.** Screen branches are cut by the intake session from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (the expected base; the intake session STOPs with `PLATE_G_SOURCE_DRIFT` rather than cut from a different head). Record the base SHA in BUILD_RESULT.md.

**C2 · Source check.** `git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs, or any merge into main (the only merge allowed is the pinned crest SHA in League and Club). Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. Nothing animates (static checkpoint; motion comes later).

**C4b · One plate-mapping helper (SOL-HLC-4).** The plate is a `cover`-fit background. Write one function, `plateToScreen(x, y)`, and use it for every plate-registered thing: overlays, the `&grid=1` evidence, wheel and pack positions, and the G8 protected-box checks. With stage size `W×H` and plate 1X size `PW×PH`:
`k = max(W/PW, H/PH)`; `offsetX = (W − PW·k)/2`; `offsetY = (H − PH·k)/2`; `screenX = offsetX + x·k`; `screenY = offsetY + y·k`.
If you change `background-position`, the offsets must follow that exact position (e.g. a vertical bias). Any plate cut-out (the League fingertip) uses the same transform. The phone band may use its own transform, but write it explicitly in the code and in BUILD_RESULT.md, and measure against it.

**C5 · Fixed product and identity rules.**
1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate (sole exception: the Home-only anonymous decorative icon below), no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from the pinned `ACCEPTED_CREST_SHA` (League, Club) (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
   Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`. The Home-only tile icons are not rasters: they are inline SVG redraws (see the Home-only icon exception under rule 4); no new raster-icon exception, no PNG crops of the goal.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere, footer and all helper/source labels included (SOL-HLC-7); body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise (the only such case is the Club-only pack-box exception in G8).

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). Desktop shows the badge plus the product brand. On phone the brand text may be visually hidden (still in the DOM) and only the `CM 17` badge retained.
  - Right: the product's `#onlinePlayerIdentityBadge` button (fixture `SIGN IN`) and `#seasonIndicator` (fixture per frame). Dark glass `rgba(10,12,15,.72)`, 1 px `rgba(201,155,69,.55)` border, Barlow Condensed 600 14 px, letter-spacing .12em, min height 40 desktop / 44 phone.
  - Desktop only, `aria-hidden`: the script line `More Than A Game` (Kaushan Script 18 px, `#F2C45B`, rotate −8°) at the far right. Hide below 900 px width.
  - No navigation tabs (HOME / CAREER / STANDINGS / STATS / RULES / ABOUT) and no search, settings or profile icons. They are in the goal images but not in the product.
- Footer: the product `<footer>` text `Career Mode Showdown` + `v1.9.1` at the left (12 px, `#9A8F7A`), and `aria-hidden` decorative `FOOTBALL BRINGS US TOGETHER` + a small gold crown glyph at the right (desktop only). 28 px desktop; on phone the footer may be omitted from the fold if space is needed, never covering controls.
- Grade: gold-dominant. Gold `#F2C45B` / deep gold `#C99B45` / ink `#0B0D10`. Primary button: solid gold gradient `linear-gradient(180deg,#F7D46A,#E0AE3A)` with ink text, Barlow Condensed 700 20 px, letter-spacing .06em, height 56 desktop / 52 phone. Secondary button (BACK): transparent dark glass, 1 px `rgba(233,223,200,.55)` border, light text, same height.
- Screen titles (`<h2>`): DOM text in Barlow Condensed 700 italic, uppercase, gold gradient fill (`#FFF1B8 → #F2C45B → #B98A2F`, top to bottom) with a warm glow (`drop-shadow(0 0 18px rgba(242,196,91,.35))`) and a subtle brush-edge SVG `feTurbulence`+`feDisplacementMap` filter (scale ≤ 3). Kicker above (`CAREER MODE SHOWDOWN 17`, 13 px, letter-spacing .5em) is decorative, `aria-hidden`.
- Focus ring on every control: 2 px `#FFF1B8` outline, 3 px offset.

**C7 · Phone layout.** Any portrait viewport up to 760 px wide uses the phone layout: the plate is cropped to a band showing both managers' heads (read `platemap.json` protected boxes), and the UI stacks below or over the band's lower edge, like slice-02-plate's phone recomposition. You solve the composition; the gates in section G decide.

**C8 · Cost and stop rules.** Run `date` at start and record it. Commit and push at the checkpoint named in PRIORITY_ORDER and at the end. At 80 % of STOP_BUDGET stop adding scope: finish the current item, capture evidence for what is done, mark the rest `NOT DONE`, commit, push. At 100 % stop. Installs: `npm ci` in your tools folder only if you need Playwright; otherwise use `NODE_PATH=$(npm root -g)` like slice-02-plate. An item that fails its gate twice is `BLOCKED` with measured values; no third attempt.

**C9 · Deliverables committed in your folder (all required).**
1. `BUILD_RESULT.md`: model, effort, start/end time, head SHA, SOURCE_DRIFT line, how to run, frame list, item status (DONE / NOT DONE / BLOCKED) in PRIORITY_ORDER, known limits.
2. `evidence/qa_report.json` + every screenshot named `<FRAME>_<W>x<H>.jpg` (phone at DPR 2, desktop at DPR 1, plus one desktop at DPR 2).
3. `tools/build_preview.py` output `preview.html`: a single-file preview (inline CSS/JS/JSON, plate as a data URI at 1X) so the review page renders in claude.ai.
4. `CLAUDE_<SCREEN>-BUILD_HANDOFF_TO_SOL_<yyyy-mm-dd>.md`, addressed to GPT-5.6 Sol: what was built, gate results table, every place the goal image and the product disagreed and what you did (numbered items), open questions, and what Nik should look at.
Commit messages start with `visual: <SCREEN>-V1`. Push with `git push -u origin <branch>`. Reply at the end with the head SHA and the four file paths.
## G. Render-QA gates (measured by assertions in `tools/render-qa.cjs`; results in `evidence/qa_report.json`)

Viewports: desktop 1366×768 (Tier S), 1440×900, 1920×1080, 1366×640, plus 1366×768 at DPR 2; phone 360×640, 375×553, 390×844, 430×932 at DPR 2. Every frame at every viewport unless a gate says otherwise.

| Gate | Assertion (hard fail unless stated) |
| --- | --- |
| G1 Strings | Visible text nodes of each frame = that frame's expected list in `fixtures.json` (built from section S: current-main strings; for Home also the explicit Audius exception in Home section S) + the allowed decorative list in section S. Report any missing or extra string. 0 extra, 0 missing. |
| G2 IDs | Every product id in section S exists exactly once; roles and aria attributes match main. |
| G3 No scroll | `scrollHeight ≤ innerHeight + 1` and `scrollWidth ≤ innerWidth + 1` on `html` and `body`. |
| G4 Primary action | The frame's primary control (section S) is fully inside the viewport, and `elementFromPoint` at its centre returns it. Must hold at 375×553 and 1366×640. |
| G5 No clipping | Every text element: `scrollWidth ≤ clientWidth + 1`, `scrollHeight ≤ clientHeight + 1`; no `text-overflow: ellipsis`. Includes the longest fixture strings. |
| G6 Sizes | Phone: every control ≥ 44 px tall and ≥ 44 px wide; no text under 12 px; body copy ≥ 14 px. Desktop: controls ≥ 40 px. |
| G7 Contrast | Brightest-background-pixel method (same as slice-02-plate): normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1, control borders ≥ 3:1. Fix a failure with a local scrim first. |
| G8 Faces and hands | Using `plateToScreen` (C4b): face and hand protected boxes always require ≥ 8 px clearance: no UI box (text, control, panel) intersects any face or hand `protected_boxes` rect grown by 8 px, except where section S allows it. **Club-only pack-box exception (D7):** the two pack boxes (`pack_daniel`, `pack_nik`) are an explicit exception for K3's `aria-hidden` pack-open treatment in CL3–CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell. Intake hard-restores face, hand and pack protected boxes alike; this gate is runtime occlusion only. Report separately: (a) face/hand clearance (smallest per frame); (b) pack-overlay containment inside each pack box; (c) zero live-text/control intersection with pack boxes. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG (including the four inline/data SVG Home tile icons, Home only). `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

~~~~
