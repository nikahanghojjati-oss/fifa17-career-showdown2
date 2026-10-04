# FINAL_REVIEW · Job 108 · Final package review

Reviewer: Claude (Opus, project thread), standing in for Codex at Nik's request (04 Oct 2026). Branch `factory/v1-wtt5ye` after job 233 (`b3572d02`).

Method: all 15 screens served from the repo and rendered in Chromium at 1366x768, 1920x1080, 1366x640, 393x660, 360x640 and 375x553; scroll size, console errors, failed requests, loaded bytes, keyboard focus, reduced motion and touch targets measured by script (`evidence-claude-check/108/qa.json`). Contact sheets: `evidence-claude-check/108/desktop_1.jpg`, `desktop_2.jpg`, `phone.jpg`. H10 mockup-diff and H6 contrast numbers are carried from each screen's committed intake (`<screen>/review/REVIEW.md`), not re-run.

## Verdict

**FIX.** The package is close: every screen fits every phone size with no scroll, no screen mirrors Daniel and Nik, no asset breaks rights, and reduced motion is respected everywhere. Two hard gates fail on single screens (H9 Club phone console errors, H11 Home wordmark weight) and six small craft or consistency items remain. After the 9 items below (jobs 109, 234, 235) every hard gate passes; the remaining gap to an average of 4.4 is polish (see Scores).

| Screen | Verdict |
| --- | --- |
| Home | FIX (items 1, 2) |
| League | PASS |
| Club Assignment | FIX (item 3) |
| Transfer War | PASS |
| Loading | PASS |
| Trophy Room | FIX (item 4) |
| Career Statistics | PASS |
| Rivalry Statistics | FIX (item 4) |
| Legacy | PASS |
| Season Results | FIX (items 5, 7) |
| Final Winner | FIX (item 6) |
| Start / Join | FIX (item 4) |
| Standings | PASS |
| Rule Book | PASS |
| Settings | FIX (item 8) |

## Hard gates

| Screen | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | H11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | PASS | PASS | PASS | PASS | PASS (all 5 sizes fit) | PASS (intake) | PASS (0 long animations) | PASS 6/6 focus rings | PASS | PASS (intake) | **FAIL** 2.6 MB loaded; LOGO_CM17_WORDMARK_V1.webp alone 1.8 MB |
| League | PASS | PASS | PASS | PASS | PASS | PASS (intake) | PASS | PASS 5/5 | PASS | PASS (intake) | PASS (intake; 879 KB total) |
| Club Assignment | PASS | PASS | PASS | PASS | PASS | PASS (intake) | PASS | PASS 5/5 | **FAIL** phone: 3 console errors `<polygon> points ... Infinity` | PASS (intake) | PASS (intake; 637 KB phone) |
| Transfer War | PASS | PASS | PASS | PASS | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Loading | PASS | PASS (Reus with OWNER-4 credit) | PASS | PASS | PASS | PASS (intake) | PASS | PASS 4/4 | PASS | PASS (photo crop + credit) | PASS (320 KB) |
| Trophy Room | PASS | PASS | PASS | PASS (top bar missing: item 4) | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Career Statistics | PASS | PASS | PASS | PASS | PASS | PASS (16 px tab inputs) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Rivalry Statistics | PASS | PASS | PASS | PASS (top bar missing: item 4) | PASS | PASS (intake) | PASS | PASS 3/3 | PASS | PASS (intake) | PASS (intake) |
| Legacy | PASS | PASS (original crests) | PASS | PASS | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Season Results | PASS | PASS | PASS | PASS | PASS | PASS (number inputs 16 px) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Final Winner | PASS | PASS | PASS | PASS | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | PASS (intake) | PASS (intake) |
| Start / Join | PASS | PASS | PASS | PASS (top bar missing: item 4) | PASS | PASS (code input 16 px) | PASS | PASS 5/5 | PASS | PASS (intake) | PASS (532 KB) |
| Standings | PASS | PASS (original crests) | PASS | PASS | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | n/a (own layout) | PASS (628 KB) |
| Rule Book | PASS | PASS | PASS | PASS (scoring table matches PRODUCT_TRUTH) | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | n/a (system plate) | PASS (604 KB) |
| Settings | PASS | PASS | PASS | PASS | PASS | PASS (intake) | PASS | PASS 6/6 | PASS | n/a (system plate) | PASS (439 KB phone) |

Notes: H5 measured `scrollHeight <= innerHeight` and `scrollWidth <= innerWidth` at 393x660, 360x640 and 375x553 on every screen: all fit. H7: with `prefers-reduced-motion: reduce`, no screen runs an animation longer than 250 ms or any infinite animation. H8: first six Tab stops at 1366x768 each show an outline or ring. Loaded bytes are everything fetched in the first 2.5 s (uncompressed bodies, including JS, fonts and fixtures), so they overstate first paint; only Home is far enough over budget to fail on that basis. Visually hidden radio and checkbox inputs (1 x 1 px, label is the target) were excluded from H6 and the touch-target count.

## Scores

Every screen meets the static pass line (average >= 4.2, nothing under 3) and the final line's floor (nothing under 4 on criteria 1, 2, 3 and 9). The final line's average of 4.4 is reached only by Loading: the rest sit at 4.0-4.3 because most criteria are a solid 4 (clearly premium, one or two small things), not because any area is weak. Items 1-8 clear every measurable defect; lifting the 4s to 5s is the queued final polish pass (CC-008), not this fix round. Criteria: 1 mockup fidelity, 2 characters, 3 hands, 4 light, 5 type, 6 panels, 7 clarity, 8 motion, 9 phone, 10 polish.

| Screen | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Avg | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | 3.8 | Plate and both cut-outs sit on the mockup's pixels and the tile row is real art, but the hero copy renders at 44 px uppercase (the `.fifaMenuHeadingMeta span` rule hits the body copy too) so it runs five lines and its HOME label collides with the lockup tagline at 1366x768; the CM17 wordmark ships a 2078 px, 1.8 MB file. |
| League | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.3 | Daniel's fingertip lands on the wheel rim with contact shadow, wordmark and wheel match the goal art; phone keeps both faces above the wheel. |
| Club Assignment | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 3 | 4.0 | Hands hold the packs convincingly and the VS lockup reads; phone throws three console errors (cover polygons built with Infinity). |
| Transfer War | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4.3 | Plate G locked as approved, fingertip in front of the glass, sealed dossier on Daniel's side; phone composition clean. |
| Loading | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4.4 | Reus photo with OWNER-4 credit, CM17 wordmark and honest progress; no managers by design (criteria 2-3 not applicable, scored on the photo crop). |
| Trophy Room | 4 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4.2 | Showdown Champion trophy is the hero, filter tabs and counts are clean; the top bar (desktop) and bottom bar (phone) are missing although it is a hub screen. |
| Career Statistics | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | KPI row, career table and comparison bars read in two seconds; top bar and phone tabs present. |
| Rivalry Statistics | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | Head-to-head grid is the hero with gold numbers; no top bar or phone bottom bar although it is a hub screen. |
| Legacy | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | Archive cards with original crests and score lines, VIEW SEASON HISTORY primary; phone fits with the bar. |
| Season Results | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 3.9 | Entry panel and scoring table are correct, but the tagline sits on top of the SEASON RESULTS brush letters (tagline 195-215 px inside wordmark 129-217 px at 1366x768); phone number inputs are 40 px tall. |
| Final Winner | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4.1 | Trophy reveal and confetti feel like a finale; the tagline, SHARED SHOWDOWN CLOSED and DANIEL WINS stack touch each other (1 px overlap at 1920x1080). |
| Start / Join | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | CONNECT PLAYERS wordmark, two clear paths and a 16 px code input; no top bar or phone bottom bar although it is a hub screen. |
| Standings | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | 4 : 9 head-to-head with NIK LEADS reads instantly; tabs and bar present. |
| Rule Book | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4.2 | Six numbered rule panels with the correct scoring table (CL 5, league 3, cup 1, max 11). |
| Settings | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4.1 | Account, motion and data panels with one DONE primary; credit links are 36 px tall. |

Motion (criterion 8) is scored from the motion pass jobs 229-233 (all Claude-checked PASS, last 4.3) and the reduced-motion measurement above. No criterion is under 4 on 1, 2, 3 or 9 for any screen.

## Rights

Every image a screen loads at 1366x768 (from the browser's resource list), with the commit that added it. H2: no real crests, league logos, trophies, players or EA/FIFA art (trophies are our originals from jobs 19-22; club crests are code-drawn per Club Identity V2.1; league marks are LEAGUE MARKS V2). The only real person besides Nik and Daniel is Marco Reus on Loading, with the OWNER-4 credit linked; his shirt shows real club and sponsor marks, which is the owner-approved exception. H3: no names, scores, fees or dates are baked into any image (decorative CM17, CLUB PACK and banner slogans only). All rows PASS.

| Asset | Used on | Added by |
| --- | --- | --- |
| `assets/marco-reus-2015-cc-by.webp` | loading | MDP: account r18 Terminal Close integration at 95.50 (#255) |
| `career-statistics/assets/ENV_CS_PLATE_V1_1X.webp` | career-statistics | job 16 |
| `career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp` | career-statistics | job 62 |
| `career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp` | career-statistics | job 62 |
| `career-statistics/assets/TITLE_CS_V1.webp` | career-statistics | factory: jobs 23-28 done (platemaps and title wordmarks from |
| `club/assets/ENV_CLUB_PHONE_V1.webp` | club | job 16 |
| `club/assets/ENV_CLUB_PLATE_V1_1X.webp` | club | visual: CLUB-V1 plate intake |
| `club/assets/OVL_CLUB_DANIEL_PHONE_V1.webp` | club | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `club/assets/OVL_CLUB_DANIEL_SIDE_HAND_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_DANIEL_TOP_HAND_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_HAND_CONTACTS_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_HAND_CORES_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_NIK_PHONE_V1.webp` | club | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `club/assets/OVL_CLUB_NIK_SIDE_HAND_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_NIK_TOP_HAND_V1_1X.webp` | club | job 43 |
| `club/assets/OVL_CLUB_SEAM_MENDS_V1_1X.webp` | club | job 43 |
| `final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_1X.webp` | final-winner | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_RIM_1X.webp` | final-winner | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_1X.webp` | final-winner | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_RIM_1X.webp` | final-winner | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `home/assets/ENV_HOME_PLATE_V1_1X.webp` | home | visual: HOME-V1 plate intake |
| `home/assets/LOGO_CM17_WORDMARK_V1.webp` | home | visual: HOME-V1 plate intake |
| `league/assets/ENV_LEAGUE_PHONE_V1.webp` | league | job 16 |
| `league/assets/ENV_LEAGUE_PLATE_V1_1X.webp` | league | visual: LEAGUE-V1 plate intake |
| `league/assets/OVL_DANIEL_FINGER_V1_1X.png` | league | visual: LEAGUE-V1 checkpoint - wheel with crest-v1 league ma |
| `league/assets/OVL_LEAGUE_DANIEL_PHONE_V1.webp` | league | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `league/assets/OVL_LEAGUE_NIK_PHONE_V1.webp` | league | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `legacy/assets/ENV_LG_PHONE_V1.webp` | legacy | factory: image 118 Legacy phone art (Nik's background + Clau |
| `legacy/assets/ENV_LG_PLATE_V1_1X.webp` | legacy | job 16 |
| `legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp` | legacy | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp` | legacy | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `legacy/assets/OVL_LG_DANIEL_PHONE_V1.webp` | legacy | factory: image 118 Legacy phone art (Nik's background + Clau |
| `legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp` | legacy | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp` | legacy | Factory intake: run cut-out recipes for jobs 72, 82, 111-113 |
| `legacy/assets/OVL_LG_NIK_PHONE_V1.webp` | legacy | factory: image 118 Legacy phone art (Nik's background + Clau |
| `legacy/assets/TITLE_LG_V1.webp` | legacy | factory: jobs 23-28 done (platemaps and title wordmarks from |
| `loading/assets/LOGO_CM17_WORDMARK_LOADING_V1.webp` | loading | job 54 |
| `rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp` | rivalry-statistics, standings | job 16 |
| `rivalry-statistics/assets/TITLE_RV_V1.webp` | rivalry-statistics | factory: jobs 23-28 done (platemaps and title wordmarks from |
| `season-results/assets/ENV_SR_PLATE_V1_1X.webp` | season-results | job 16 |
| `season-results/assets/OVL_SR_DANIEL_HAND_V1_1X.webp` | season-results | Factory intake: Claude checks for 35-48, 59, 77, 87, 92-94;  |
| `season-results/assets/OVL_SR_NIK_HAND_V1_1X.webp` | season-results | Factory intake: Claude checks for 35-48, 59, 77, 87, 92-94;  |
| `season-results/assets/TITLE_SR_V1.webp` | season-results | factory: jobs 23-28 done (platemaps and title wordmarks from |
| `shared/art/home-tiles/TILE_CONTINUE_V1.webp` | home | job 16 |
| `shared/art/home-tiles/TILE_HISTORY_V1.webp` | home | job 16 |
| `shared/art/home-tiles/TILE_RULEBOOK_V1.webp` | home | job 16 |
| `shared/art/home-tiles/TILE_SETTINGS_V1.webp` | home | job 16 |
| `shared/art/home-tiles/TILE_STATISTICS_V1.webp` | home | job 16 |
| `shared/art/home-tiles/TILE_TACTICS_V1.webp` | home | job 16 |
| `shared/art/wheel/WHEEL_RIM_V1.webp` | league | job 16 |
| `shared/plates/ENV_SYS_PHONE_V1.webp` | settings | job 121 |
| `shared/plates/ENV_SYS_PLATE_V1_1X.webp` | rule-book, settings | job 16 |
| `shared/trophies/TRO_CONTINENTAL_V1_512.webp` | trophy-room, rivalry-statistics, final-winner | job 16 |
| `shared/trophies/TRO_DOMESTIC_CUP_V1_512.webp` | trophy-room, rivalry-statistics, final-winner | job 16 |
| `shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp` | home, trophy-room, rivalry-statistics, final-winner | job 20 |
| `shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp` | trophy-room, career-statistics, rivalry-statistics, season-results, final-winner | job 19 |
| `shared/wordmarks/TITLE_FINAL_WINNER_V1.webp` | final-winner | job 16 |
| `shared/wordmarks/TITLE_RULE_BOOK_V1.webp` | rule-book | job 16 |
| `shared/wordmarks/TITLE_SETTINGS_V1.webp` | settings | job 16 |
| `shared/wordmarks/TITLE_STANDINGS_V1.webp` | standings | job 16 |
| `shared/wordmarks/TITLE_TRANSFER_V1.webp` | tr2/slice-02-plate | job 16 |
| `start-join/assets/ENV_SJ_PLATE_V1_1X.webp` | start-join | job 16 |
| `start-join/assets/OVL_SJ_DANIEL_HAND_V1_1X.webp` | start-join | Factory intake: Claude checks for 35-48, 59, 77, 87, 92-94;  |
| `tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.avif` | tr2/slice-02-plate | visual: TW-PLATE-G locked plate + Guess Entry desktop (plate |
| `tr2/slice-02-plate/assets/ENV_TRANSFER_PHONE_V1.webp` | tr2/slice-02-plate | job 16 |
| `tr2/slice-02-plate/assets/OVL_NIK_FINGERTIP_V1_1672.png` | tr2/slice-02-plate | visual: TW-PLATE-G R2 - fingertip in front of glass, glass-i |
| `tr2/slice-02-plate/assets/OVL_TRANSFER_DANIEL_PHONE_V1.webp` | tr2/slice-02-plate | Factory intake: phone cut-outs and proofs for 114 and 115; C |
| `tr2/slice-02-plate/assets/OVL_TRANSFER_NIK_PHONE_V1.webp` | tr2/slice-02-plate | Factory intake: phone cut-outs and proofs for 114 and 115; C |
| `trophy-room/assets/ENV_TR_PHONE_V1.webp` | trophy-room, final-winner | Factory: phone backgrounds for jobs 115-117, 119, 120 croppe |
| `trophy-room/assets/ENV_TR_PLATE_V1_1X.webp` | trophy-room, final-winner | job 16 |
| `trophy-room/assets/OVL_TR_DANIEL_PHONE_V1.webp` | trophy-room, final-winner | Factory intake: phone cut-outs and proofs for 114 and 115; C |
| `trophy-room/assets/OVL_TR_NIK_PHONE_V1.webp` | trophy-room, final-winner | Factory intake: phone cut-outs and proofs for 114 and 115; C |
| `trophy-room/assets/TITLE_TR_V1.webp` | trophy-room | factory: jobs 23-28 done (platemaps and title wordmarks from |

## Product truth

Every visible control per screen at 1366x768, checked against the screen's TRUTH.md and PRODUCT_TRUTH.md.

| Screen | Controls on screen | Traced |
| --- | --- | --- |
| Home | top bar; PLAY TRACK, MUTE, TRACKS; Continue Career, Start a Showdown, Legacy, Statistics, Trophy Room, Rule Book, Settings | PASS (OWNER-5 Home list) |
| League | top bar (locked during spin); SIGN IN; SPIN WHEEL; BACK | PASS |
| Club Assignment | top bar; SIGN IN; OPEN SHOWDOWN PACKS; BACK | PASS |
| Transfer War | top bar (locked); END EARLY; REFRESH; HOME | PASS |
| Loading | photo credit links only | PASS |
| Trophy Room | filter tabs ALL / SHOWDOWN / LEAGUE TITLES / DOMESTIC CUPS / CHAMPIONS LEAGUE; BACK | PASS; top bar absent (item 4) |
| Career Statistics | top bar; CURRENT RIVALRY STATISTICS; OPEN TROPHY ROOM; BACK TO MAIN MENU | PASS |
| Rivalry Statistics | BACK TO SHOWDOWN HOME | PASS; top bar absent (item 4) |
| Legacy | top bar; LEGACY ARCHIVE / TROPHY ROOM / RECORDS; archive cards; previous/next; VIEW SEASON HISTORY | PASS |
| Season Results | top bar; entry fields (position, points, goals, cup, CL, top scorer, top assist); REVIEW MY SEASON RESULT; BACK TO SHOWDOWN HOME | PASS (scoring 5/3/1, pairs max 1, season max 11) |
| Final Winner | top bar; terminal close actions from fixtures | PASS (strings are main's Terminal Close copy, TRUTH.md lines 5, 106, 237) |
| Start / Join | START A SHOWDOWN (seasons 1/3/5/10); JOIN DANIEL'S SHOWDOWN with code; BACK | PASS (Daniel creates, Nik joins, G2V-008) |
| Standings | top bar; THIS SHOWDOWN / CAREER | PASS |
| Rule Book | top bar; BACK TO MAIN MENU | PASS |
| Settings | Close; FORGET THIS DEVICE; UPDATE TO LATEST VERSION; FOLLOW DEVICE / REDUCE MOTION; menu click feedback; OPEN HISTORY & BACKUP; DONE | PASS |

Observation, not a fix: the Final Winner status line reads `TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY`. It is main's exact copy, so it stays; friendlier wording belongs to Team G (worth a relay note).

## Fix list

Most important first. Jobs 109 (items 1-3), 234 (items 4-6) and 235 (items 7-9). Each item is one exact change.

1. **Home wordmark weight (H11).** `visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V1.webp` (2078x755, 1.8 MB): re-export the same image at 1040x378 WebP quality 82 (target <= 160 KB) and set `width="1040" height="378"` on `img.lockupWordmark` in `home/index.html`. Target: Home desktop first load under 900 KB of images, wordmark looks identical at 1920x1080.
2. **Home hero copy size.** `visual-assets/v10_1/home/home.css`, rule `.fifaMenuHeadingMeta span` (line ~225): change the selector to `.fifaMenuHeadingMeta .sd-label` so only RIVALRY HEADQUARTERS gets the 44 px uppercase style and `.homeHeadingCopy` stays the 16 px body text of `.fifaMenuHeadingMeta`. Target: the copy runs at most 2 lines and `.fifaMenuHeading` top is >= 6 px below `.lockupLegacy` bottom at 1366x768 and 1366x640.
3. **Club phone console errors (H9).** `visual-assets/v10_1/club/club.js`, `drawCovers(k, phone)` (line ~267): when `phone` is true, still set `T.covers` but leave the panel `<polygon>`/`<polyline>` markup out (the desktop face boxes are absent on phone, so `coverShapes` yields Infinity). Target: 0 console errors at 393x660, 360x640 and 375x553; desktop unchanged.
4. **Top bar on three hub screens.** `visual-assets/v10_1/trophy-room/index.html`, `rivalry-statistics/index.html`, `start-join/index.html`: add `../shared/navbar/navbar.css`, `../shared/navbar/navbar.js` and an `SDNav.mount(...)` call copied from `career-statistics/index.html` (active `stats` for Trophy Room and Rivalry, `career` for Start / Join; same routes). Target: 52 px top bar on desktop and the 56 px bottom bar on phone, as PRODUCT_TRUTH requires for hub screens, with H5 still passing at all three phone sizes.
5. **Season Results tagline over the wordmark.** `visual-assets/v10_1/season-results/season-results.css`, `.season-tagline` (line ~83, `top: 26.0%`): move the tagline below the brush letters (shrink `.season-title-wordmark` or raise it if the scoring panel blocks a lower tagline). Target: tagline top >= wordmark bottom + 4 px and tagline bottom <= scoring panel top - 4 px at 1366x768, 1920x1080 and 1366x640.
6. **Final Winner heading stack.** `visual-assets/v10_1/final-winner/final-winner.css`, `.finalWinnerHeroCopySlot` (line ~974, `gap: .55vh`) and `.finalWinnerTagline`: space tagline, state heading (SHARED SHOWDOWN CLOSED) and `.finalWinnerOutcome` so none touch. Target: >= 6 px between each pair at 1366x768, 1920x1080 and 1366x640; DANIEL WINS stays above the trophy.
7. **Season Results phone inputs.** `visual-assets/v10_1/season-results/season-results.css`: the phone rule for `#p1LeaguePosition`, `#p1LeaguePoints`, `#p1LeagueGoals` (64x40 px): `min-height: 44px`. Target: 44 px tall at 393x660 with H5 still passing at 360x640 and 375x553.
8. **Settings credit links.** `visual-assets/v10_1/settings/settings.css`: `#creditAuthor, #creditLicense` (69x36 and 46x36 px on phone): `display: inline-flex; align-items: center; min-height: 44px`. Target: 44 px tall touch targets, credit still on one line, H5 still passing.
9. **Re-measure.** No code change: Claude re-runs this job's script (`evidence-claude-check/108/qa.json` method) on all 15 screens after items 1-8. Target: H9 0 errors everywhere, Home loads under 900 KB of images, every phone size still fits.


## Fix round

Jobs 109, 234 and 235, all done by Claude in the same thread on 04 Oct 2026 and Claude-checked PASS.

| Item | Job | Result |
| --- | --- | --- |
| 1 Home wordmark weight | 109 | done: 1.8 MB -> 140 KB; Home loads 953 KB in total at 1366x768 (was 2.6 MB) |
| 2 Home hero copy | 109 | done: copy back to 16 px on 2 lines; heading clears the tagline at 1366x768 and 1366x640 |
| 3 Club phone console errors | 109 | done: 0 errors at all three phone sizes |
| 4 Top bar on three hub screens | 234 | done: Trophy Room (active CAREER, per NAV_CONTRACT rather than this list's "stats"), Rivalry (STATS), Start / Join (CAREER); Rivalry's preview chip moved clear of the bar |
| 5 Season Results tagline | 234 | done: 4-6 px clear of letters and panel at 1366x768, 1920x1080, 1366x640 |
| 6 Final Winner heading stack | 234 | done: >= 6 px between tagline, closed line and outcome at all three desktop sizes |
| 7 Season Results phone inputs | 235 | done: 44 px tall; every phone size still fits |
| 8 Settings credit links | 235 | done: 44 px tall |
| 9 Re-measure | 235 | done: all 15 screens x 5 sizes: 0 scroll, 0 console errors, 0 failed requests, primary in view, reduced motion clean (`evidence-claude-check/108/qa_after_fixes.json`) |

Blocked: none. Every hard gate now passes on every screen.

### Left for pass 2

No fix-list items after number 9. Observations for the CC-008 final polish pass, not fixes:
- Season Results at 375x553: the manager card header is clipped at the top of the entry panel (already so before item 7).
- Final Winner status copy is main's Terminal Close wording (`TERMINAL · NO NEW SESSION ...`); a friendlier line is Team G's call.
- Most criteria score a solid 4; lifting them toward 4.4+ is polish, not a gate.
