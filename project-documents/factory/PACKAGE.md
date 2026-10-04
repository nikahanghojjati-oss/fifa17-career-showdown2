# Visual package list (Team V) · job 238

Branch `factory/v1-wtt5ye`. Nothing here is on main. Hashes are not recomputed here: each asset folder points to its own intake report. Scores live in each screen's `review/REVIEW.md`. Last changed by job 238 (04 Oct 2026).

Base path for everything below: `visual-assets/v10_1/`.

## Screens

| Screen | Folder | Entry | Plate and phone intake | Review |
| --- | --- | --- | --- | --- |
| Home | `home/` | `home/index.html` | see `home/assets/intake_report.md`, `home/assets/phone_intake.md` | `home/review/REVIEW.md` |
| League | `league/` | `league/index.html` | see `league/assets/intake_report.md`, `league/assets/phone_intake.md` | `league/review/REVIEW.md` |
| Club | `club/` | `club/index.html` | see `club/assets/intake_report.md`, `club/assets/phone_intake.md` | `club/review/REVIEW.md` |
| Transfer (Transfer War) | `tr2/slice-01/`, `tr2/slice-02-plate/` | `tr2/slice-02-plate/index.html` | see `tr2/slice-02-plate/assets/phone_intake.md`, `tr2/ASSET_LEDGER.md` | `tr2/slice-02-plate/review/` |
| Loading | `loading/` | `loading/index.html` | see `loading/assets/` (wordmark only; Reus photo and credit per OWNER-4) | `loading/review/REVIEW.md` |
| Trophy Room | `trophy-room/` | `trophy-room/index.html` | see `trophy-room/assets/intake_report.md`, `trophy-room/assets/phone_intake.md` | `trophy-room/review/REVIEW.md` |
| Career Statistics | `career-statistics/` | `career-statistics/index.html` | see `career-statistics/assets/intake_report.md`, `career-statistics/assets/phone_intake.md` | `career-statistics/review/REVIEW.md` |
| Rivalry Statistics | `rivalry-statistics/` | `rivalry-statistics/index.html` | see `rivalry-statistics/assets/intake_report.md`, `rivalry-statistics/assets/phone_intake.md` | `rivalry-statistics/review/REVIEW.md` |
| Legacy (History) | `legacy/` | `legacy/index.html` | see `legacy/assets/intake_report.md`, `legacy/assets/phone_intake.md` | `legacy/review/REVIEW.md` |
| Season Results | `season-results/` | `season-results/index.html` | see `season-results/assets/intake_report.md`, `season-results/assets/phone_intake.md` | `season-results/review/REVIEW.md` |
| Final Winner | `final-winner/` | `final-winner/index.html` | see `final-winner/assets/` (arm and rim overlays) | `final-winner/review/REVIEW.md` |
| Start / Join | `start-join/` | `start-join/index.html` | see `start-join/assets/intake_report.md`, `start-join/assets/phone_intake.md` | `start-join/review/REVIEW.md` |
| Standings | `standings/` | `standings/index.html` | no pictures (system plate from `shared/plates/`) | `standings/review/REVIEW.md` |
| Rule Book | `rule-book/` | `rule-book/index.html` | no pictures (system plate) | `rule-book/review/REVIEW.md` |
| Settings | `settings/` | `settings/index.html` | no pictures (system plate) | `settings/review/REVIEW.md` |

Each screen folder also holds `BUILD_RESULT.md`, `TRUTH.md` (Home, League, Club and Transfer have none; see `tr2/ASSET_LEDGER.md` and the BUILD_RESULT files), `fixtures.json` and its own `*.css` / `*.js`.

## Shared kit (`shared/`)

- Tokens, type and UI: `showdown-tokens.css`, `showdown-type.css`, `showdown-ui.css`, `specimen.html`, `kit.html`, `TOKENS_NOTES.md`
- Stage and motion: `STAGE.md`, `MOTION.md`, `motion.css`, `motion.js`, `motion-demo.html`
- Cutouts and QA rules: `CUTOUT_STANDARD.md`, `QA.md`
- Fonts: `fonts/` (Barlow, Barlow Condensed, Kaushan Script)
- Top navigation: `navbar/` (`NAV_CONTRACT.md`, `README.md`, `proof.html`)
- System plate (Standings, Rule Book, Settings): see `shared/plates/intake_report_SYS.md`
- Home tiles and wheel art: `shared/art/home-tiles/` (see `README.md` there), `shared/art/wheel/`
- Foundation review: `shared/review/REVIEW_FOUNDATION.md`
- Evidence: `shared/evidence/` (kit and cutout shots)

## Assets outside the screen folders

- Club crests: `visual-assets/crests/` (see `CREST_QA.md`; crests final CREST-V1). League marks V2: `visual-assets/league-marks-v2/LEAGUE_MARKS_V2_PROOF.html`
- Transfer plate and phone art: `tr2/slice-02-plate/assets/` (see `tr2/ASSET_LEDGER.md`)
- Loading portrait: `assets/marco-reus-2015-cc-by.webp` with the CC BY 2.0 credit line (OWNER-4); the only player photo allowed. The file is not on this branch (it lives on main), so it must come across at integration.

## Data candidate files

- `shared/fixtures/data-contract-v1/` (17 files; start with `README.md` and `index.json`): Team G's model-true fixtures, `project-documents/factory/DATA_CONTRACT_V1.md` is the contract.
- Each screen's own `fixtures.json` is what that screen renders in the showcase today.
- Nothing is wired to live data. Wiring is the integration step through POS20 (see `HANDOFF_TO_SOL.md`, job 239).

## Showcase and approval

- `showcase/index.html` (router and routes: `router.js`, `routes.json`, `showcase.css`) opens every screen in one place.
- `showcase/APPROVAL.html` is built by jobs 236 and 237 (job 110 starts it): one row per screen with mockup, shots and scores. Until those jobs are DONE it may be missing or partial.

## Evidence and tools

- Per-screen evidence: `<screen>/evidence/` (Home, League, Club, Trophy Room, Career Statistics, Rivalry Statistics, Loading).
- Claude check shots: `project-documents/factory/evidence-claude-check/`
- Check tools: `project-documents/factory/tools/` (`check.py`, `claude_qc.cjs`, `phone_art.py`)
- Board: `project-documents/factory/BOARD.md`

## Known gaps

- League, Club and Versus brush wordmark pictures were never made (TITLE_LEAGUE, TITLE_CLUB, TITLE_VS); screens use a font stand-in.
- Start / Join title picture TICKET-124_6 may still be pending; the font stand-in reads CONNECT PLAYERS.
- Full-width 1366x640 leftovers on some screens; Club phone stray "S"; Legacy phone art may still need its ticket (job 118).
- Final package review (job 108, Codex) and final fixes (job 109) were not finished when this list was written.
- Fixture data is Team G's candidate; real History data is owned by Team G and has no backfill.
