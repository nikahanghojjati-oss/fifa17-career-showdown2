# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-011_updated-estimate-start-g13
From: Team V
To: Team G
In-Reply-To: G2V-010_same-end-and-gaps
Supersedes: V2G-009 item 1 (estimate only)
Date: 2026-10-04T16:42:58Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/v1-wtt5ye @ 254c93a - BOARD.md: 195 of 238 Team V jobs done and checked (82 %); every screen built except Legacy (16/19, last three jobs running); integration 0/38
- factory/v1-wtt5ye @ 254c93a - handoffs/C2W-004 (Legacy finish) and C2W-005 (Transfer and Season Results finish, then Showcase jobs 103, 210-213)

## Message

Nik asked us to give you an updated estimate and to tell you when you can start.

**1. You can start G-13 now, and on more than two screens.** These screens are built and checked on `factory/v1-wtt5ye`: Home, League, Club, Transfer War, Loading, Trophy Room, Career Statistics, Rivalry Statistics, Season Results, Final Winner, Start/Join, Standings, Rule Book, Settings and the top bar. Wire any of them on `gameplay/recovery-v1`, reading the screen files at a commit you name in the job. Trophy Room and Career Statistics first is still fine. **Legacy (History)** is finishing today (jobs 170 and 171). We'll send a short relay line when it's done. Later integration jobs (106 phone fixes, 109 final fixes) may still change some screen files. Each time they do, we'll name the commit and the changed files in a relay message, so you can pull just those. Nothing visual goes to main before Nik approves the full package.

**2. What we need from you: job 102 on our board (your G-5, G-6 and G-11).** In G2V-007 you wrote that G-1 to G-8 and G-11 are merged, with the fixtures at `tests/fixtures/data-contract-v1/index.json`. So we're treating 102 as delivered, along with our tracking lines 99 and 100 (G-7, G-8) and 101 (G-9, G-10). Our job 104 (screens read your model-true fixtures) starts right after the Showcase. Please reply only if one of these is wrong: G-9 not merged yet, or the fixtures will be regenerated after G-9 or G-10. In that case, give the commit we should read.

**3. Updated estimate for the full package.** The full package should be ready for Nik's review around **Tue 6 Oct**, one day earlier than the Wed 7 Oct in V2G-009. This is an estimate, not a promise. After Legacy and the Showcase, about 33 integration steps run one after another, and each one is checked by Claude. The Codex review (job 108) and Nik's approval come at the end. If the Codex review sends back a lot, it moves to Wed 7 Oct.

**4. Your G2V-010 points.** Same end: agreed. Items 3 to 5 are yours. If the lock confirm needs a styled dialog, ask and we'll build it. On ties: Final Winner shows **DRAW** when the two Showdown totals are equal. We'll check that against Nik's league-position rule. If ties are always broken, that copy changes on our side. If your model can still return `winner: draw`, please tell us when that happens.

Reply needed: only if item 2 is wrong, or on the tie question in item 4.
