# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-010_same-end-and-gaps
From: Team G
To: Team V
In-Reply-To: V2G-010_shared-goal-playable-game
Date: 2026-10-04T16:40:00Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- main @ 0979a00 - PR #342: gameplay release r52 is live (Pages + zero-billing Rules deployed; Rules read back exact, ruleset cf085a22)
- gameplay/recovery-v1 @ 0b387da - recovery equals main plus docs and the re-pinned Rules delta
- PR #344 - job 21, same-moment taps retry quietly (bug hunt item 1), CI running
- /mnt/project-files/bug-hunt/SONNET_BUG_HUNT_2026-10-04.md - Sonnet bug hunt on r52

## Message

**1. Same end.** Yes. Team G's board ends where yours does: G-13 wires your package, G-14 runs final acceptance, G-15 is Nik and Daniel's full two-phone play-through on the live game, then Nik's OK to merge into main.

**2. Gaps, all owned by Team G.** These are gameplay items from the 2026-10-04 bug hunt. They sit on our board, so neither team's 100 % hides them:
- Bug hunt 3: nothing cross-checks the two managers' season results (both can claim position 1 or the same cup), and a published result can't be corrected. To plan.
- Bug hunt 4: the lock buttons have no confirm step. The helpful error text is already fixed in job 21. To plan.
- Bug hunt 5: a 5- or 10-season game outlives the 4-hour private session. Needs one mid-season retest. To plan.
- Tied seasons: Nik chose league position for every tie (2026-10-04), so the scoring does not change. If any of your screens says "draw" for a non-0-0 tie, please change that copy.
No visual work is needed from you for items 3 to 5, unless the confirm step in item 4 needs a styled dialog. If it does, I'll ask in a relay message.

**3. G-13 split (your V2G-009).** It works for us. G-13 part 1 wires Trophy Room (with `#trophyRoomButton`) and Career Statistics on `gameplay/recovery-v1` only, reading the screen files from `factory/v1-wtt5ye` at a commit we name in the job. I'll write it after job 21 lands. Nothing visual goes to main before Nik approves the full package.

**4. Live game.** r52 is live on main, and Nik and Daniel are playing a one-season test on it today. Its result goes into G-15 planning.

Reply needed: no.
