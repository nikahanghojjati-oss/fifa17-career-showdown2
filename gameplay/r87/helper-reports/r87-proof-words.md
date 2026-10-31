# W3-7 Proofread every word (r87 / 2.0.0)

Base: gameplay/r87 @ 73713d7. Report only; no js/css/package.json edits.

## How it was read
- **Real screens:** two CE2PG emulator runs (single 3 seasons, run 1: PASS 281/281; single 1 season draw, run 2: PASS) with a new read-only hook, `tools/proof-words/text-capture.cjs`. It samples every visible text node, aria-label, title and placeholder on both players (Daniel 1440x900, Nik 393x660) about every 0.7 s. That gave about 1,200 distinct visible lines.
- **Copy:** `tools/proof-words/check-words.cjs --copy` checked 8,800 Gazette, front-page and commentary lines (data/gazetteCopy.js stories + small, data/frontPages.js, data/commentaryLines.js, data/deadlineDayLines.js) for these: SP naming, tiebreak wording, plurals, doubled words, leftover slots, spacing and internal names.
- **Static:** codespell plus a dictionary pass over every string literal in index.html, js/ and visual-assets/v10_1. **No real spelling mistakes**, apart from the items below.
- Clean results: no "Marquee"/"MP" anywhere on a real screen. No tiebreak wording on screens. No `{slot}`, `undefined` or `NaN` left on screen. No spacing errors.

Severity: **P1** = wrong or broken on a screen people see in normal play. **P2** = inconsistent names or jargon. **P3** = polish.

---

## 1. Polish thread ("Polish every screen for 2.0.0"). These files have no open PR.

| # | Sev | Screen | Now | Suggested | Where |
|---|-----|--------|-----|-----------|-------|
| 1 | P1 | Season result → SHOWDOWN SO FAR (both, every season) | "Daniel **1 trophies** (1 league, 0 cup, 0 Champions League)" | "1 trophy" (pluralise) | js/productionSharedHistoryConvergence.js:79 |
| 2 | P1 | Last season, 1-season Showdown | "**ALL 1 SEASONS PLAYED** · FINAL RESULT NEXT" | "SEASON PLAYED · FINAL RESULT NEXT" when total is 1 | js/productionSharedMultiSeasonProgression.js:136 |
| 3 | P1 | Final result, 1-season Showdown | "**1 OF 1 SEASONS PLAYED**" | "1 OF 1 SEASON PLAYED" | js/productionSharedFinalReconciliation.js:57,65 |
| 4 | P1 | Showdown Home (dashboard), 1-season, after the end | "All 1 seasons complete" | pluralise | js/productionSharedMultiSeasonProgression.js:88 |
| 5 | P2 | Season commit flow (one step, six verbs) | "CHECK SEASON" → "BOTH RESULTS ARE IN · LOCK THE SEASON" / "LOCK & CONFIRM SEASON" → "SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT" / "CONFIRM SEASON" → "SEASON COMMITTED · SCORE BELOW" / "SEASON CONFIRMED ✓" → "SEASON 1 SAVED" | Pick one verb (suggest **CONFIRM**): "BOTH RESULTS ARE IN · CONFIRM THE SEASON", "SEASON CONFIRMED · SCORE BELOW". Drop "COMMITTED" (developer word). | js/productionSharedSeasonCommit.js:104-116, productionSharedMultiSeasonProgression.js:139-142 |
| 6 | P2 | Same flow (Nik) | "WAITING FOR **Daniel** TO LOCK THE SEASON" (mixed case in a capitals line) | `.toUpperCase()` the name, as the button already does | js/productionSharedSeasonCommit.js:116 |
| 7 | P2 | Final result (both) | "Daniel 14 · Nik 11 · **Daniel WINS**" | "DANIEL WINS", or "Daniel wins" | js/productionSharedFinalReconciliation.js:58,66 |
| 8 | P2 | Season result (after season 1 of 3, Daniel) | "Save check is getting ready." / "DOUBLE-CHECK · Optional: compare the shared result with the Showdown copy in this app. Nothing is changed." / "PREVIEW READY ✓ · YOUR SAVE IS UNCHANGED" | Plain words, e.g. "Your season is saved." Or hide this panel; it is a developer check. | js/productionSharedLocalReconciliation.js:30-36 |
| 9 | P2 | Same panel, mid-Showdown | "Waiting for your rival to finish **the last season**" can show before the last season | "Waiting for your rival." | js/productionSharedLocalReconciliation.js:30 |
| 10 | P2 | League wheel (Daniel, retry) | "**Retrying the exact same host capability. No replacement session will be generated…**" | "Connecting again…" | js/sparkRemoteJoining.js:171 |
| 11 | P2 | Connection panel: same file, about 30 more messages in this register ("exact private session capability", "provider acknowledgement", "page memory", "authority context") | e.g. "Joining the exact capability. Its full value remains hidden while provider acknowledgement is unresolved…" | One plain line each: "Connecting…", "Couldn't connect. Try again.", "That code doesn't work." (Nik's r84 jargon sweep) | js/sparkRemoteJoining.js (messages listed in `grep -o 'message:' js/sparkRemoteJoining.js`) |
| 12 | P2 | Showdown Home | "Transfer challenge: ready" (phone) vs "Transfer Challenge: ready" | "Transfer Challenge" | js/showdownUI.js:212-216 |
| 13 | P2 | Home header (phone) and tile, at the same time | "No Active Showdown" + "No Showdown live · tap to start"; Settings shows "No Showdown in progress." | Use one form everywhere: "No Showdown live" | js/menuExperience.js:187, index.html:40 |
| 14 | P2 | Home | "Showdown complete" vs "Showdown Complete" vs "SHOWDOWN COMPLETE" | Sentence case or capitals, not Title Case | js/menuExperience.js:197,204, showdownUI.js:359, productionSharedMultiSeasonProgression.js:89 |
| 15 | P2 | Settings → Showdown data | "0 completed showdowns" / "1 completed showdown" (lowercase) | "Showdown(s)" | js/screens.js:681 |
| 16 | P2 | Club Assignment | "Premier League · 3 seasons · **SHARED**" | Drop "SHARED" | js/productionSharedShowdownPresentation.js:175 |
| 17 | P2 | Home JOIN (Nik), Rematch label | "PASTE A CODE"; aria-label "Rematch: Daniel starts it. Go to Showdown Home to **join his code**" | Pairing is permanent and JOIN is on Home: "Daniel starts it. Tap JOIN on Home." | js/onlinePlayerIdentity.js:50, js/seasonFinalV10.js:344 |
| 18 | P2 | Waiting screen | "It continues by itself as soon as Daniel opens Career Mode Showdown and taps **CONTINUE CAREER**." Home shows CONTINUE CAREER **and** a LIVE tile "CONTINUE SHOWDOWN". | Name the button Home actually shows. The two-button question is already open with Nik. | js/sparkRemoteJoining.js / productionSharedJourneyEntry.js (owned by #1104 → see 5) |
| 19 | P3 | Scores | "Daniel 5 - 6 Nik" (hyphen) next to "Champions League 0–5" (en dash) and Legacy "{daniel} – {nik}" | En dash everywhere | productionSharedHistoryConvergence.js, showdownUI.js |
| 20 | P3 | Showdown Home | "Last league finish: 1" | "Last league finish: 1st" | js/showdownUI.js:372, productionSharedMultiSeasonProgression.js:101 |
| 21 | P3 | Settings | "Daniel and Nik's FIFA 17 Career Mode companion for two managers." (says two managers twice) | "Daniel and Nik's FIFA 17 Career Mode companion." | js/settings.js |
| 22 | P3 | Settings → Motion | "STANDARD / DEVICE PREFERENCE / Standard motion / EFFECTIVE APP MOTION" | "Motion: Standard" | js/settings.js |
| 23 | P3 | Menu / transfer | Placeholder "Choose League or Nationality first" vs "Pick a type first" | "Pick League or Nationality first" | index.html / transferScreenV10.js:33 |

## 2. Naming: one name per thing (needs one call; Nik's pick where it is product)

| Thing | Names on screen today | Suggest |
|-------|----------------------|---------|
| Transfer step | **TRANSFER CHALLENGE** (Home button, step title, Rule Book card 03), **TRANSFER WAR** (screen wordmark, visual-assets/v10_1/tr2/slice-02-plate/plate.js:109; rosterRouletteStep.js:95-96 errors), **TRANSFER WINDOW** (roulette "GO TO THE TRANSFER WINDOW", rosterRouletteStep.js:205) | Nik's call. "Transfer War" is the art; the text could follow it, or keep "Transfer Challenge" and let the wordmark stand alone. |
| Roulette | "Russian Roster Roulette" (screen) vs "Roster Roulette" (Rule Book card 03, ruleBook.js:61) | "Russian Roster Roulette" in the Rule Book |
| Equal totals | DRAW / Level (house rule) vs **"Shared"** (Trophy Room records, careerScreenSeam.js:22, trophy-room.js:121), "Together" (career compare), Gazette "THE UNBREAKABLE TIE", "A TIE WORTH FRAMING" | "Level" on screens; Gazette uses "draw/level", not "tie" |
| Final screen title | "SHOWDOWN CHAMPION" (Final Winner a11y title, trophy), "SHOWDOWN WINNER" (Gazette), "Final Winner" (Home hint) | Fine as a trophy name; just check a drawn Showdown never reads "SHOWDOWN CHAMPION" aloud |
| Tagline | "TWO MANAGERS · ONE LEGACY" (Home, Final), "TWO MANAGERS • ONE LEGACY" (Standings, Season Results), "TWO MANAGERS. ONE LEGACY." (Settings, Career Stats, Trophy Room), "TWO MANAGERS ONE LEGACY" (Legacy banner), "TWO MANAGERS · ONE SHOWDOWN" (loading screen) | One separator (·) |
| Pairing code | "code", "session code" ("USE A SESSION CODE", sparkRemoteJoining.js:588), "connection code" (aria), placeholder "session_…" | "code" |
| Rival | Rule Book: "Your opponent gets three guesses" (ruleBook.js:56) and "your rival" (ruleBook.js:207,210) | "your rival" |
| Bench | Rule Book: "4 best subs", "the bench", "4 subs" (ruleBook.js:61,63) | "4 subs" |

## 3. Career fixes helper (#1103 owns these files)

| # | Sev | Now | Fix | Where |
|---|-----|-----|-----|-------|
| C1 | P2 | Trophy Room records: "Shared" for a level record | "Level" | js/careerScreenSeam.js:22 |
| C2 | P3 | Legacy (old screen, if still reachable): "{n} trophies won", "total showdown points" (lowercase) | pluralise; "Showdown" | js/legacy.js:284 |

## 4. Commentary v3 / Gazette copy (data/, no open PR)

| # | Sev | Now | Fix | Where |
|---|-----|-----|-----|-------|
| G1 | **P1** | Final Gazette, 1-season Showdown: "Daniel and Nik used **1 seasons** to prove only that they are evenly matched" (**seen on screen** in the draw run) | Lines with "{seasonsTotal} seasons" sit in situations a 1-season Showdown can reach: showdown-drawn, dominant-win, won-on-the-final-day, golden (up to 34 story lines and 17 front pages). Either pluralise the slot in touchlineGazette.js (owned by #1103) or keep those lines off T=1. | data/gazetteCopy.js, data/frontPages.js |
| G2 | P1 | Same story: "West Bromwich Albion and Arsenal **traded the lead**" in a 1-season draw. Nothing was traded, so the line doesn't match what happened (commentary rule). | Keep "traded the lead" lines off 1-season | data/gazetteCopy.js (showdown-drawn) |
| G3 | P1 | **"Marquee"** in 4 front-page lines (Nik: never Marquee): season[144] "SPLIT THE MARQUEE", [423] "HONOURS BEYOND THE MARQUEE", [460] "…puts {winner} on the season's marquee…", [466] "MARQUEE MAGIC MAKES HISTORY" | Rewrite (e.g. "TOP OF THE BILL") | data/frontPages.js |
| G4 | P2 | Typo: "so much **that that** {loser} may want to sit down" | "so much so that" | data/commentaryLines.js results[200] (n1 season-win-by-7-plus) |
| G5 | P2 | "tie/tied" in 11 lines (e.g. comm results[422] "a perfect tie", [446] "tied on {points} apiece", front final[171] "THE UNBREAKABLE TIE") | "level/draw" (house rule) | data/commentaryLines.js, data/frontPages.js |
| G6 | P3 | Front-page subheads talk about the newspaper's own "imagined display", "metaphor", "cabinet" (33 lines, e.g. season[283], [292], [300], [301] "Even the football metaphors agree…", [309] "The display is only metaphorical…") | Rewrite or drop; they read like notes to the illustrator | data/frontPages.js (level-overall, winning-streak, lead-extended) |
| G7 | P3 | Mixed spelling: "honor/honors" 31x, "favorite" 2x, "center" 2x, "color" 1x in British copy ("honours" 125x, "centre" 89x) | British throughout | data/frontPages.js, data/gazetteCopy.js |
| G8 | info | gazetteCopy duets (e.g. d-0063 "pulls clear in the standings by {margin} points", which can read "1 points") are not read by any js today. If v3 wires them in, fix the plural first. | — | data/gazetteCopy.js duets |

## 5. Files with open PRs: send to their owners through the lead

| # | Sev | Now | Fix | File (PR) |
|---|-----|-----|-----|-----------|
| O1 | P2 | Waiting screen names "CONTINUE CAREER" while Home also shows "CONTINUE SHOWDOWN" (see 1.18) | match Home | productionSharedJourneyEntry.js (#1104 arch fixes) |
| O2 | P2 | Roulette errors: "Last season's **Transfer War** could not be read…", "Roulette page did not start." | Follow the naming call; "The roulette couldn't start. Try again." | js/rosterRouletteStep.js:95-96,173,184 (#1105 Fable step fixes) |
| O3 | P3 | Rule Book: "Your board builds itself: your FIFA 17 **launch squad**" while squads now follow FIFA 17 v1.11 "Reset All Squads" | Check the wording against the data audit (#1108) | js/ruleBook.js:63 (no PR; Polish thread) |

## 6. Team V (visual-assets/v10_1): lead sends a relay ticket

| # | Sev | Now | Fix | Where |
|---|-----|-----|-----|-------|
| V1 | **P1** | Career Statistics leaders: "{n} wins", "{n} trophies", "{n} pts" with no singular, so a 1 reads "**1 wins**" or "**1 trophies**" | pluralise | visual-assets/v10_1/career-statistics/career-statistics.js:135-145 |
| V2 | **P1** | Trophy Room manager card: "CAREER POINTS · **1 SEASON WINS**" (seen on screen) | "1 SEASON WIN" | visual-assets/v10_1/trophy-room/trophy-room.js:81 |
| V3 | P1 | Final Winner: "${n} seasons played" with no singular ("1 seasons played") | pluralise | visual-assets/v10_1/final-winner/final-winner.js:154 |
| V4 | P2 | Final Winner strings: "{Daniel} wins the **showdown**", "The **showdown** finishes level" (lowercase), "Daniel WINS" mixed case, "RETRY SAME TERMINAL CLOSE" (jargon), trophy label "**Continental**" for Champions League | "Showdown"; "RETRY"; "Champions League" | visual-assets/v10_1/final-winner/app-strings.json:41-80 |
| V5 | P3 | Roulette seat label: "**Waits**" (Nik, before his turn) | "Waiting" | visual-assets/v10_1/roulette/index.html:1000 |
| V6 | P3 | Roulette mid-spin: "Red: live round · Gold: fires" (unclear) | "Red ring: the bullet · Gold mark: fires here" | visual-assets/v10_1/roulette/index.html:822 |
| V7 | P3 | Loading text: "Loading standings." (full stop) vs "Loading rivalry statistics…" (ellipsis) | ellipsis | visual-assets/v10_1/standings/app-strings.json:33 |
| V8 | P3 | Tagline separators (see section 2) | · | standings/season-results app-shell, trophy-room.js:72, legacy strings |

## 7. Lead / release PR
- Settings and Home show **v1.9.10 / 1.9.10-r86**. The 2.0.0 bump in the release PR covers this. Please confirm the Settings BUILD row changes too.
- Reads meter (settings.js:318, reads-meter helper): "+80 here since" stops mid-phrase. Suggest "+80 on this phone since season 1". Also "About 110 seasons · 450 per season, both phones" → "About 110 more seasons today".

## New files (branch claude-gameplay/r87-proof-words)
- `tools/proof-words/text-capture.cjs`: a read-only screen-text hook for any Playwright run: `NODE_OPTIONS="--require ./tools/proof-words/text-capture.cjs" npm run test:ce2pg`.
- `tools/proof-words/check-words.cjs`: the wording rules check: `node tools/proof-words/check-words.cjs --copy`. It exits 1 today on G3 (marquee), 1 (plural) and G4 (doubled word). It could become a Gate lane once those are fixed.
