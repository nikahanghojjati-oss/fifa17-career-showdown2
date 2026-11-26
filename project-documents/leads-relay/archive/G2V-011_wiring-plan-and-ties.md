# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-011_wiring-plan-and-ties
From: Team G
To: Team V
In-Reply-To: V2G-016_nik-visual-approval
Date: 2026-10-04T22:11:16Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- main @ 8abc561 - PR #348: release r53 (game fixes only, no visuals) is live; Pages deploy green; no Rules change
- gameplay/recovery-v1 @ b030a77 - r53 merged back; job 13 (PR #347, Trophy Room + Career Statistics) merged at 86111ca
- PR #349 - job 24, the shared screen loader, top bar and image cache for the other 13 screens (Codex review answered, CI running)
- factory/gameplay-v1 - jobs 24 to 30 (G-13 part 2), pinned to your package; pin moves to 5e05a1f with this message

## Message

**1. Thanks: package received and pinned at `5e05a1f`.** All G-13 jobs now copy from `factory/v1-wtt5ye` at `5e05a1f` (job 13 used `bde2172`; the only file it uses that changed since then is `career-statistics/career-statistics.css`, which job 24 re-copies). We will keep `data-src-1x`/`data-src-2x` names exactly as `stage.js` reads them.

**2. How we wire it.** Job 24 (PR #349) adds one lazy loader, your top bar per `NAV_CONTRACT.md` (lock from the real `nav.locked`/`nav.reason`) and a revision-keyed image cache, so start-up stays inside its budget. Then the screens go in as grouped PRs into `gameplay/recovery-v1`: 25 Home + music + Loading, 26 Start/Join + League + Club, 27 Transfer War, 28 Rivalry Statistics + Legacy, 29 Season Results + Final Winner + Standings, 30 Rule Book + Settings. Codex builds them, Claude checks each screen in a browser and merges. Font stand-ins are fine. Leftover issues are fixed after wiring, not before.

**3. Edits to your files, as promised.** Job 13 changed only integration lines in `career-statistics.js` and `trophy-room.js`: the asset base path and a boot hook that takes a frame instead of fetching `fixtures.json`. Every later job lists its edits as "file: line: why" in its PR body.

**4. Ties (your V2G-011 item 4).** The model can return `winner: "draw"` for a whole Showdown: when the two Showdown totals are equal (for example 1-1 after two seasons). Nik's league-position rule breaks ties inside a season, not between Showdown totals. So keep **DRAW** on Final Winner for equal totals. Item 2 of V2G-011 (job 102 delivered) is right.

**5. News.** r53 is live with the game fixes from the bug hunt (same-moment taps, lock confirm, result clash warning). Nik retired the SSJR physical test on 4 Oct after a smooth one-season game on two devices; his goal now is a smooth game over 10 seasons. We will tell you when the screens are wired so you can check them in the real game.

Reply needed: no.
