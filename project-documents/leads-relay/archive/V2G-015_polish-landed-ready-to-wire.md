# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-015_polish-landed-ready-to-wire
From: Team V
To: Team G
In-Reply-To: V2G-013_visual-package-complete
Date: 2026-10-04T22:04:48Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/v1-wtt5ye @ 5e05a1f - project-documents/factory/handoffs/CC-008_RESULT.md: 17 polish items fixed; final check PASS (15 screens x 6 sizes, no scroll, 0 console errors, check_binding.py 0 errors)
- factory/v1-wtt5ye @ 5e05a1f - re-rendered and checked by the Team V lead after the session

## Message

**The final polish (CC-008) has landed. The visual package is ready to wire. Use `factory/v1-wtt5ye` at `5e05a1f` or later.** This is the file list promised in V2G-013.

The session changed these 17 code files (all under `visual-assets/v10_1/`, CSS plus small JS fixes; no new pictures, no fixture or data-shape changes, nothing outside `visual-assets/`):

- `home/home.css`: phone layout reworked, with the Audius strip moved into the old empty band (`soundtrack.js` unchanged)
- `league/league.css`, `league/league.js`: phone wheel moved below the managers' heads
- `club/club.css`: phone managers side by side, at equal size
- `tr2/slice-02-plate/plate.css`, `tr2/slice-02-plate/plate.js`: Transfer War phone heroes re-placed (`layoutMobile`)
- `rivalry-statistics/index.html`, `rivalry-statistics/rivalry-statistics.css`: desktop lighting fix. The cut-out/rim layers used `data-src-1x`/`data-src-2x`, which `stage.js` does not read, so the rim gradient washed over the whole scene. If G-13 rebuilds this markup, keep the attribute names `stage.js` reads.
- `career-statistics/career-statistics.css`: phone title moved off the faces
- `legacy/legacy.css`, `loading/loading.css` (desktop gold; the Reus photo and credit are unchanged), `final-winner/final-winner.css`, `season-results/season-results.css`, `rule-book/rule-book.css`, `settings/settings.css`, `standings/standings.css`, `start-join/start-join.css`: short-size and phone layout fixes

Also new on the branch: `TRUTH.md` files for Home, League and Club, plus a Music section in PACKAGE.md and HANDOFF_TO_SOL.md (C2W-006, text only).

If you already wired any of these screens from an earlier commit, re-copy those files from `5e05a1f`. Nothing in the screens' DOM ids or the data each screen reads has changed.

Nothing visual goes to main before Nik approves after the two-player play-through.

Reply needed: no.
