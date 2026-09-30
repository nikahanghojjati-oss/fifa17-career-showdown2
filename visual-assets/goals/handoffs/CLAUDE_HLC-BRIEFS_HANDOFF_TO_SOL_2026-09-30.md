# CLAUDE -> SOL HANDOFF - HLC-BRIEFS
Home, Select League and Club Assignment: owner visual goals turned into 4 image tickets + 3 Claude Code Cloud build briefs (provisional; product-truth check requested before anything runs)

## Header
| Field | Value |
| --- | --- |
| Task ID | HLC-BRIEFS |
| Claude model | Opus 5.5 (Claude Project thread) |
| Role | Lead Visual Producer: direction, asset tickets, build briefs |
| Date | 2026-09-30 |
| Source anchor | `main@2de237391e17c7de2c6deb606b102b68ee640212` re-resolved live. SOURCE_DRIFT vs V10_STATE anchor `f077b9c`: YES, but for these three screens the diff is version-string bumps only (`?v=1.9.1-r46` → `r51` in `index.html` and `js/menuExperience.js`). No string, id or behaviour change on Home, League Wheel or Club Assignment. |
| Visual branch | `claude-cloud/transfer-tr2-plate-g@6f8eb1b` (moved from `e4c8458`; the one new commit touches `tr2/slice-02-plate` QA tools only). |
| Write operations | None to the repo yet. Files written to project knowledge only. Images: 4 guide images derived from Nik's goals. No implementation. |
| Verdict status | PROVISIONAL, awaiting Sol product-truth check |

Files reviewed: Nik's goals `HOME.png` 1672×941, `league.jpeg` 1536×864, `club.jpeg` 1536×864; inventory screenshots of main (Home, League Wheel, Club Assignment, desktop + phone); `index.html` (`#topHeader`, `#mainMenu`, `#leagueWheelScreen`, `#clubWheelScreen`, `<footer>`), `js/menuExperience.js`, `js/onlinePlayerIdentity.js`, `js/leagueWheel.js`, `data/leagues.js`, `js/clubAssignment.js`, `js/visualIdentity.js`, `css/app.css` (wheel and club rules); plate-g `slice-02-plate/BUILD_RESULT.md` and asset list; `research/LEAGUE_LOGO_AND_CLUB_BADGE_RIGHTS_2026-09-30.md`.

## Work performed (documents only)
| File (project knowledge `claude/handoffs/`) | What |
| --- | --- |
| `CLOUD_BRIEF_HOME_V1.md` | Cloud build brief, Opus 5.5 High, 45 min / $10, branch `claude-cloud/home-v1` |
| `CLOUD_BRIEF_LEAGUE_V1.md` | Cloud build brief, Opus 5.5 High, 45 min / $10, branch `claude-cloud/league-v1` |
| `CLOUD_BRIEF_CLUB_V1.md` | Cloud build brief, Opus 5.5 High, 60 min / $15 (first-of-kind pack reveal), branch `claude-cloud/club-v1` |
| `IMAGE_TICKET_1_OF_4_ENV_HOME_PLATE_V1.md` + `GUIDE_HOME_PLATE_EDIT.png` | Clean-plate edit of Nik's Home goal |
| `IMAGE_TICKET_2_OF_4_ENV_LEAGUE_PLATE_V1.md` + `GUIDE_LEAGUE_PLATE_EDIT.png` | Clean-plate edit of the League goal (removes the wheel and the real league logos) |
| `IMAGE_TICKET_3_OF_4_ENV_CLUB_PLATE_V1.md` + `GUIDE_CLUB_PLATE_EDIT.png` | Clean-plate edit of the Club goal (keeps the held packs) |
| `IMAGE_TICKET_4_OF_4_LOGO_CM17_WORDMARK_V1.md` + `GUIDE_WORDMARK_CROP.png` | Brush wordmark on transparent background (optional; DOM fallback) |
| `HLC_PLATE_ZONES_V1.json` | Removal zones, keep zone (Daniel's fingertip) and protected boxes (faces, hands, packs) in goal-image px |

Method: the proven Plate G route ("paint the stage, place the live text"). Nik's goals are full mockups with baked UI, so each becomes a clean plate by a ChatGPT scene edit inside magenta zones; Claude then runs the likeness lock (edited pixels kept only inside the zones, originals restored elsewhere), upscales ×2, records SHA-256, and commits plate + `platemap.json` + intake report to each screen branch, cut from plate-g's head. No existing plate or pose fits these compositions (the four Transfer poses hold papers/tablets), so new plates are needed.

Parallel runs: safe for Home. League and Club depend on the crest build landing first (HLC-M5), then may run in parallel. Each session writes only `visual-assets/v10_1/<home|league|club>/`, never `V10_STATE.md`, `tr2/**` or `tr2/ASSET_LEDGER.md`; reuse (fonts, `render-qa.cjs`, `js/visualIdentity.js`) is read-only. The shared header/footer is specified identically in all three briefs (section C6) and each build writes a computed-style snapshot (gate G13) for a later cross-check. Club was not split: one session with a PRIORITY_ORDER (ready + confirmation first) and a 60-minute budget.

## 1. Verdict
`BRIEFS READY FOR PRODUCT-TRUTH CHECK`. Every string, id and state in the briefs was read from main at `2de2373`; wherever Nik's goal adds, drops or changes product content, the brief keeps the product and the item is listed below for your decision. Nothing runs until you clear the items marked HIGH/MEDIUM and Nik has the plates.

## 2. Sol decision table
| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
| --- | --- | --- | --- | --- | --- | --- |
| HLC-M1 | Goal nav tabs + search/settings/profile icons are not product; dropped | MEDIUM | HIGH if added | Sol | High | |
| HLC-M2 | Home goal tile `LOCAL SAVE LIBRARY` replaces product `SETTINGS`; brief keeps SETTINGS | MEDIUM | HIGH if followed | Sol | High | |
| HLC-M3 | Home goal loading bar + "Local save system · your career remains on this device" dropped | MEDIUM | MEDIUM | Sol | High | |
| HLC-M4 | League goal segment order differs from `data/leagues.js`; brief keeps main's order and rotation contract | MEDIUM | HIGH if followed | Sol | High | |
| HLC-M5 | League goal shows real league logos; League/Club briefs consume the crest-v1 marks and crests (dependency) | HIGH | Rights | Sol | High | |
| HLC-M6 | Club goal shows `CLUBS LOCKED · SHOWDOWN` and the permanence line in the sealed state; brief shows them only in versus/confirmation as main does | MEDIUM | HIGH if followed | Sol | High | |
| HLC-M7 | Club goal omits the league name; brief keeps `#clubAssignmentLeague` visible | LOW | MEDIUM | Sol | High | |
| HLC-R1 | Things visually hidden but kept in DOM (list in §4) | MEDIUM | MEDIUM | Sol | Medium | |
| HLC-R2 | New decorative copy (slogans) | LOW | LOW | Sol | High | |
| HLC-R3 | Header brand shown as `CM 17` badge + small brand text; brand text hidden on phone | LOW | LOW | Sol | Medium | |
| HLC-R4 | Plate intake done by Claude in the project thread, not in a Cloud session | LOW | NONE | Sol | High | |
| HLC-R5 | Home goal's Continue Career footballer replaced by a code-drawn `17` mark | LOW | NONE | Sol | High | |
| HLC-R6 | Soundtrack card shows real track titles and artists | LOW | LOW | Sol | High | |

## 3. MUST FIX (decide before running)
**HLC-M1 · Nav tabs and icons.** Observation: all three goals show `HOME / CAREER / STANDINGS / STATS / RULES / ABOUT` and search, settings and profile icons in the header. Evidence: main's `#topHeader` holds only `.brand` (`CAREER MODE` / `SHOWDOWN // 17`), `#seasonIndicator` and the injected `#onlinePlayerIdentityBadge` (`js/onlinePlayerIdentity.js`, labels `SIGN IN`, `CONNECTING`, `RECONNECT`, `CHOOSE PLAYER`, manager label). Proposed delta (in briefs, C6): "No navigation tabs … and no search, settings or profile icons. They are in the goal images but not in the product." Product-truth impact: NONE as written. Resolver: Sol. Confidence: High.

**HLC-M2 · Home tile set.** Goal tiles: CONTINUE CAREER, NEW SHOWDOWN, HISTORY LEGACY, DATA STATISTICS, RULES RULE BOOK, LOCAL SAVE LIBRARY. Main (`index.html` `.fifaMenuGrid`): `#continueCareer`, `#newShowdown`, `#legacyButton`, `#careerStatisticsButton`, `#ruleBookButton`, `#settingsButton`, each with code / label / meta, and for Nik `JOIN` / `JOIN DANIEL'S SHOWDOWN` / `Paste Daniel's code` (`configureOnlineProductSurface`). Brief keeps main's six with all three text lines; frame HM2 uses the Nik strings as the fit stress case. Impact: NONE as written.

**HLC-M3 · Home loading content.** The goal merges the startup screen (`PREPARING CAREER MODE SHOWDOWN`, progress bar) into Home, plus "Local save system · your career remains on this device". Brief drops both from Home and uses only the product's own startup lockup lines `THE RIVALRY STARTS HERE` and `TWO MANAGERS · ONE LEGACY` as aria-hidden decoration around the wordmark. Please confirm the local-save claim is no longer true (connected accounts) and that reusing the two lockup lines on Home is fine.

**HLC-M4 · Wheel order.** Goal: PL top, Bundesliga right, Ligue 1 lower right, Serie A lower left, LaLiga left. Main: `data/leagues.js` order with `getLeagueRotation` = −(index × 72°) + turns (`js/leagueWheel.js`), i.e. item *i* at +*i* × 72° clockwise. Brief keeps main's order and requires `.wheelTrack` to stay the rotated element so production JS can drive the new wheel unchanged.

**HLC-M5 · League marks and club crests.** Goal wheel shows the real Premier League, LaLiga, Bundesliga, Serie A and Ligue 1 logos. Owner decision (Nik, 2026-09-30, "League logo and badge rights" thread): marks and badges should look very good and read close, using real names as text, club colours and from-scratch symbols, without copying any real crest's layout. That work is one shared dependency, the crest build (`CC_CREST_BUILD_BRIEF_V2.md`, branch `claude-cloud/crest-v1`): hand-authored crests for all clubs, and league marks = gold-rimmed tile with the national flag as a small shield + country code. The League and Club briefs now **consume** its API from `js/visualIdentity.js` (`getLeagueMark(leagueId)`, `applyLeagueMark(el, leagueId)`, `--league-mark-image`; `getClubIdentity(name).crest`, `getClubCrestSvg(name)`, `--club-crest-image`), merge `origin/claude-cloud/crest-v1` first, and STOP if it has not landed. Screens never draw their own marks. The league plate ticket removes the real logos before anything is committed. `data/leagues.js` `logo` fields (real-logo files that don't exist) stay untouched here; the crest thread flags them to you.

**HLC-M6 · Club sealed state copy.** Goal, sealed state: panel titled `CLUBS LOCKED · SHOWDOWN` and "Once revealed, these clubs are permanent for the full showdown." Main: `#clubRivalryConfirmation` (containing `CLUBS LOCKED`, the showdown name, the meta, the matchup and "These clubs are permanent for the full showdown. Confirmation starts the rivalry and never rerolls either club.") is hidden until the `versus` stage (`renderReadyAssignmentState`, `renderClubRevealStage`). Brief K1/K2 follows main.

**HLC-M7 · League name on Club.** Goal omits it; main renders `#clubAssignmentLeague`. Brief keeps it at 26 px gold under `LEAGUE CONFIRMED`.

## 4. SHOULD REFINE
**HLC-R1 · Visually hidden, still in the DOM** (screen readers unaffected; please accept or reject each):
1. Home `.fifaMenuEyebrow` `CAREER MODE // SHOWDOWN 17` (repeats the wordmark).
2. Home phone: tile meta on the five non-primary tiles; `#menuMusicPlayer` placeholder; `#menuMusicStatus` (stays a live region); `.menuBottomStrip`.
3. `.wheelPointer`'s `▼` text node (drawn as a chevron instead); main's `CMS 17` hub pseudo-content replaced by a crown hub.
4. Club `.clubPackDoor` text (`CAREER MODE`, `SHOWDOWN CLUB DRAW`, `17`, `PACK 0n · SEALED`): already aria-hidden in main; the painted packs replace it.
5. Club confirmation: only if faces + matchup cannot both fit, the duplicate matchup row (K2). The builder must list it if used.
6. Header brand text on phone (HLC-R3).

**HLC-R2 · Decorative copy not in the product:** `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, `DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION`, `WHERE RIVALS / CREATE LEGENDS`, kicker `CAREER MODE SHOWDOWN 17`. All aria-hidden, desktop only where noted; banners painted in the plates also stay. Allowed under "decorative brand text" in my reading.

**HLC-R3 · Header brand.** Desktop: aria-hidden `CM 17` badge + the product brand text small. Phone: badge only, brand text visually hidden.

**HLC-R4 · Intake location.** Routing puts asset-intake mechanics in Cloud. I will do the likeness lock, ×2 upscale, SHA-256 and platemap in the project thread when Nik uploads the images, because it is a short script, it is also the gate review, and it lets each Cloud session do one kind of work (build only). Branches get created at that point, cut from plate-g's head.

**HLC-R5 · Continue Career art.** The goal tile shows a footballer with a `17` shirt (AI figure). Brief: code-drawn outlined `17` numeral with a small crown, no person, shirt or silhouette. Home's Marco Reus photo and credit are not referenced anywhere (gate G9 greps for it).

**HLC-R6 · Soundtrack card.** Real song and artist names (e.g. `ARE WE READY? (WRECK)`, `Two Door Cinema Club`) stay DOM text from `js/menuExperience.js`; YouTube still loads only on Play. The goal's crowd/vinyl picture is replaced by a code-drawn vinyl + equalizer: no photo, no real cover art. All 7 media choices kept as a compact chip rail (the goal shows only the now-playing card).

## 5. Already strong (keep)
- The three goals share one grade and world (night stadium, gold-dominant, Daniel left and Nik right, banners and handwritten notes), which matches the Transfer War grade.
- Likeness: Daniel and Nik read correctly in all three goals, and the sides are correct. The likeness lock keeps them pixel-identical.
- Club: the held sealed packs are a strong physical stand-in for main's pack doors.

## 6. Asset fit and blockers
| Asset ID | Role | Status | Forbidden baked content removed |
| --- | --- | --- | --- |
| `ENV_HOME_PLATE_V1` | Home plate | Ticket 1, not generated | nav, headline, loading bar, heading, soundtrack card, six tiles (incl. AI footballer, trophy, record), footer |
| `ENV_LEAGUE_PLATE_V1` | League plate | Ticket 2, not generated | nav, title, wheel + **real league logos**, slogan boxes, buttons, footer; Daniel's fingertip kept |
| `ENV_CLUB_PLATE_V1` | Club plate | Ticket 3, not generated | nav, title, status, rail, VS, bottom panel, buttons, footer; packs kept |
| `LOGO_CM17_WORDMARK_V1` | Home brand wordmark | Ticket 4, optional | none (brand text only); DOM fallback specified |
Blocker: builds cannot start until the plates are committed; each brief stops with "plate not committed yet" otherwise.

## 7. Conflicts found
- Goals vs product: HLC-M1 to M7 above. All resolved in favour of main; none silently.
- Goals vs rights rule: real league logos (HLC-M5).
- Noted, out of scope: main's inventory screenshots show a toast "Offline application support could not be prepared. Cannot read properties of undefined (reading 'addEventListener')" on every screen. It may come from the headless capture environment. Not investigated; flagging only.

## 8. Questions for Astra
NONE

## 9. Questions for Nik
- HLC-N1: The wordmark: gold brush image (ticket 4) or live gold text? Default: image if ticket 4 comes out clean.
- HLC-N2: Opened pack look (Club K3): the pack face darkens, gold rays burst from its top, and the club's original crest appears on the pack's shield. Nik judges at the owner look.

## 10. Evidence appendix
- `git ls-remote origin`: `main` = `2de237391e17c7de2c6deb606b102b68ee640212`; `claude-cloud/transfer-tr2-plate-g` = `6f8eb1b6abfc336f74cc063b9bd2f5735de6bfcb`.
- `git diff f077b9c origin/main -- index.html js/menuExperience.js`: only `1.9.1-r46` → `1.9.1-r51` cache-busting strings.
- Main strings quoted in the briefs come from: `index.html` lines 41–226 (header, menu, wheel, club); `js/menuExperience.js` `getSavedShowdownMenuMeta` (`No active showdown saved`, `Season N of M`, `Showdown complete`, `VIEW COMPLETED SHOWDOWN`); `js/leagueWheel.js` (`Spin to select league`, `SPINNING...`, `CONTINUE TO CLUB ASSIGNMENT`, `LEAGUE LOCKED`, `League and clubs are permanent for this showdown.`); `js/clubAssignment.js` (`LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY`, `CLUB DRAW SAVED · PREPARING PACK 01`, `DRAW LOCKED...`, `<M1> · PACK 01 OPEN`, `<M2> · PACK 02 OPEN`, `BOTH CLUBS REVEALED · BUILDING RIVALRY`, `RIVALRY READY · CONFIRM TO BEGIN`, `CONFIRM RIVALRY & START SHOWDOWN`, confirmation meta `<League> · <n> season(s)`).
- `setRevealControls`: BACK only in `ready`; no controls in `versus`; only CONFIRM in `confirmation`.
- Protected boxes and zones: `HLC_PLATE_ZONES_V1.json` (estimated by eye on the goals, then checked on overlays; exact values get re-measured on the locked plates at intake).

## 11. Recommended Sol next actions
1. Decide HLC-M1 to M7 and each HLC-R1 sub-item; reply with any exact string or layout changes.
2. Confirm the run order: Home can run as soon as its plate is committed; League and Club run after `claude-cloud/crest-v1` lands (they merge it first), and may run in parallel with each other.
3. Update V10_STATE.md on plate-g with the three new screen branches when they exist (the build sessions will not touch it).

## 12. What to send back to Claude
Your decision table (IDs above) and any brief edits. Claude folds them into `CLOUD_BRIEF_*_V1` as `_R2` if anything changes, then tells Nik to launch.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION
