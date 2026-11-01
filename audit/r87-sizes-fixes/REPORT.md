# r87 sizes re-check — 1 November 2026

Source: [PR #1129 report](../r87-proof-sizes/REPORT.md). Base: `gameplay/r87` at `f4efa199` (including the newly merged #1137). Browser emulation only, local app plus Auth/Firestore emulators; no production writes. The first discovery sweep used `be1c5779`; final screenshots use `f4efa199` plus this change.

The source defines **F1–F11, not F12**. Neither that file on `claude-gameplay/r87-proof-sizes` nor #1129's discussion defines F12. It cannot truthfully be assigned FIXED/STILL THERE or given a screenshot without a description; clarification was requested during the work.

“On base” distinguishes prior merged fixes from this PR. All five requested sizes are represented in the screenshot matrix below. Buttons retain their original rows, positions and handlers. Runtime changes are CSS only.

| Finding | On base | Final | Re-check |
| --- | --- | --- | --- |
| F1 — black Season Results arrival | FIXED | FIXED | #1137 now holds the previous screen/Reus until the destination is ready. Results forms paint at all five sizes; see the Results screenshots. |
| F2 — desktop guess lock moves under the tap | FIXED | FIXED | Merged `fef47363` defers search-list closure until the click completes. Desktop gameplay is re-run through guesses and signings. |
| F3 — desktop waiting strip covers SPIN/BACK, clips status | FIXED | FIXED | Merged `f00f0e4e` reserves the strip band and fits its title/status. |
| F4 — waiting panel scrolls sideways | STILL THERE | FIXED | Reproduced 823 > 820 live. The contract also reproduces 773 > 768, 846 > 844 and 746 > 740. Cap the existing shell inside its gutters, including its border; keep the centred tablet/phone panel and desktop strip layouts. |
| F5 — tablet Home dark box and cropped face | STILL THERE (partial prior fix) | FIXED | The dark box was already removed, but Nik's face was still outside the right edge. Fit the wide photo to the existing hero area; no tiles/controls move. |
| F6 — Rule Book card is another scroller | FIXED | FIXED | All six tabs at both sideways sizes pass: the card grows and `main` scrolls; no sideways overflow. |
| F7 — Legacy title on hand, duplicate history toggles | STILL THERE (partial prior fix) | FIXED | The duplicate toggle was already fixed. Lower the tablet wordmark within its existing hero band to clear the hand; preserve the history action's position. Populated Legacy plus open history checked at all five sizes. |
| F8 — other Club Assignment card faded | FIXED | FIXED | Both cards remain fully visible while the other opens; sealed and revealed states captured. A frame sample during opening reports anticipation shade peak opacity 0. |
| F9 — revealed crest with no club name | FIXED | FIXED | Both revealed cards show their name and crest at all five sizes, including 820×1180. |
| F10 — sideways pre-window empty column/faint rules line | FIXED | FIXED | Existing phase-specific layout and brighter HUD text retained. See the pre-window screenshots. |
| F11 — signing lock covers REFRESH | FIXED | FIXED | Merged `969545c8` puts the sideways rail in the same page flow after the cards. See signings screenshots. |

## Remaining-fix evidence

- F4: [before at 820×1180](shots/F4-before-820x1180.jpg); regression failures in [contracts-F4-before.txt](contracts-F4-before.txt).
- F5: [before 768×1024](shots/F5-before-768x1024.jpg), [before 820×1180](shots/F5-before-820x1180.jpg); [after 768×1024](shots/768x1024-home.jpg), [after 820×1180](shots/820x1180-home.jpg).
- F7: [before 768×1024](shots/F7-before-768x1024.jpg), [before 820×1180](shots/F7-before-820x1180.jpg); [after 768×1024](shots/LEGACY-768x1024.jpg), [after 820×1180](shots/LEGACY-820x1180.jpg).
- F5/F7 failures before the CSS changes: [contracts-before.txt](contracts-before.txt). Each fix has a geometry check in the new `tests/contracts/r87-sizes-fixes-contracts.cjs`.

## Five-size screenshot matrix

Each link is an uncropped viewport screenshot (PNG capture encoded as JPEG for repository size). Transfer captures are synchronized immediately before the real button tap, after its fields are filled. Desktop captures additionally wait for finite entrance animations and verify that the button and every ancestor are painted. Club and populated career pages use read-only renderer fixtures; gameplay phases use the real two-manager emulator journey.

| Screen / findings | 768x1024 | 820x1180 | 844x390 | 740x360 | 1920x1080 |
| --- | --- | --- | --- | --- | --- |
| Home · F5 | [shot](shots/768x1024-home.jpg) | [shot](shots/820x1180-home.jpg) | [shot](shots/844x390-home.jpg) | [shot](shots/740x360-home.jpg) | [shot](shots/1920x1080-home.jpg) |
| Rule Book · F6 | [shot](shots/768x1024-rulebook.jpg) | [shot](shots/820x1180-rulebook.jpg) | [shot](shots/844x390-rulebook.jpg) | [shot](shots/740x360-rulebook.jpg) | [shot](shots/1920x1080-rulebook.jpg) |
| Legacy · F7 | [shot](shots/LEGACY-768x1024.jpg) | [shot](shots/LEGACY-820x1180.jpg) | [shot](shots/LEGACY-844x390.jpg) | [shot](shots/LEGACY-740x360.jpg) | [shot](shots/LEGACY-1920x1080.jpg) |
| History open · F7 | [shot](shots/HISTORY-768x1024.jpg) | [shot](shots/HISTORY-820x1180.jpg) | [shot](shots/HISTORY-844x390.jpg) | [shot](shots/HISTORY-740x360.jpg) | [shot](shots/HISTORY-1920x1080.jpg) |
| Results entry · F1 | [shot](shots/SEASON_ENTRY-768x1024.jpg) | [shot](shots/SEASON_ENTRY-820x1180.jpg) | [shot](shots/SEASON_ENTRY-844x390.jpg) | [shot](shots/SEASON_ENTRY-740x360.jpg) | [shot](shots/SEASON_ENTRY-1920x1080.jpg) |
| First club opens · F8 | [shot](shots/club-768x1024-manager-one.jpg) | [shot](shots/club-820x1180-manager-one.jpg) | [shot](shots/club-844x390-manager-one.jpg) | [shot](shots/club-740x360-manager-one.jpg) | [shot](shots/club-1920x1080-manager-one.jpg) |
| Both club names · F9 | [shot](shots/club-768x1024-manager-two.jpg) | [shot](shots/club-820x1180-manager-two.jpg) | [shot](shots/club-844x390-manager-two.jpg) | [shot](shots/club-740x360-manager-two.jpg) | [shot](shots/club-1920x1080-manager-two.jpg) |
| Waiting · F3/F4 | [shot](shots/waiting-768x1024.jpg) | [shot](shots/waiting-820x1180.jpg) | [shot](shots/waiting-844x390.jpg) | [shot](shots/waiting-740x360.jpg) | [shot](shots/waiting-1920x1080.jpg) |
| Before window · F10 | [shot](shots/before-window-768x1024.jpg) | [shot](shots/before-window-820x1180.jpg) | [shot](shots/before-window-844x390.jpg) | [shot](shots/before-window-740x360.jpg) | [shot](shots/before-window-1920x1080.jpg) |
| Guesses · F2 | [shot](shots/guesses-768x1024.jpg) | [shot](shots/guesses-820x1180.jpg) | [shot](shots/guesses-844x390.jpg) | [shot](shots/guesses-740x360.jpg) | [shot](shots/guesses-1920x1080.jpg) |
| Signings · F11 | [shot](shots/signings-768x1024.jpg) | [shot](shots/signings-820x1180.jpg) | [shot](shots/signings-844x390.jpg) | [shot](shots/signings-740x360.jpg) | [shot](shots/signings-1920x1080.jpg) |

The original probe exclusions apply: intentional brush-art title bounds and the account badge behind a full-screen page. The synchronized Transfer probes have **zero remaining covered-control, scroller, sideways, dim or blank findings** after those exclusions; raw observations are in [tap-layouts.json](tap-layouts.json).

## Validation

- New size contract: PASS. F4 checks all five widths, F5/F7 check both upright tablets, and F6 checks all six Rule Book tabs at both sideways sizes. Before-fix failures and after-fix output are retained above.
- Registered contracts: **288/288 PASS**, plus the explicitly run new contract (the protected registry and package.json are unchanged).
- Populated Legacy, open History and Season Results layout audit: **0 findings at all five sizes**.
- Real two-manager emulator UI journeys: **37/37 PASS in each of three runs**; [summary](gameplay-summary.json). The UI-only runner skips the career-number tour and partner-wait sampling; its zero-duration budget samples provide **no billing/capacity evidence**. Career layout is independently checked with populated fixtures.
- F1 pixel/RAF audit: **20/20 transitions PASS** (first and repeat opens and returns at all five sizes), 4× CPU, unchanged 600 ms threshold; longest dark interval 521 ms. [Raw timing observations](transitions.json). The wrapper changes viewport input only; the protected original audit is unchanged.
- 21 synchronized Transfer tap captures: no remaining relevant layout findings; actual guess/signing taps complete the game, including at 1920×1080.
- Syntax and whitespace checks pass. Protected-file intersection is empty; [frozen path list](protected-files.json) includes all five PRs, including subsequently merged PRs.

Initial parallel emulator attempts exhausted the workspace's 8 GiB memory limit; those interrupted attempts are not acceptance evidence. Final gameplay runs execute sequentially with a 512 MiB Java heap (768 MiB for the final settled desktop repeat), and the final timing run executes separately. One intermediate desktop capture repeat completed all gameplay checks but failed its console check on the emulator SDK’s initial 10-second connection warning; the final settled repeat passes 37/37. Earlier contended timing attempts are also excluded. All evidence is browser emulation, not physical-device or production proof.

## Commands

Run from the repository root; start the static server in a separate terminal for the browser audits. No package manifest or lockfile edit is required.

```sh
npm install --no-save --package-lock=false firebase@12.17.0
node tests/support/static-server.cjs
node tests/contracts/r87-sizes-fixes-contracts.cjs
npm run test:contracts
CMS_SHORT_SIZES=768x1024,820x1180,844x390,740x360,1920x1080 CMS_SHORT_SHOTS=test-results/r87-sizes/final-career CMS_SHORT_REPORT=test-results/r87-sizes/final-career.json node tests/browser/r80-short-screens-audit.cjs LEGACY HISTORY SEASON_ENTRY
PROOF_OUT=test-results/r87-sizes/final-tour node tests/browser/r87-proof-sizes-tour.cjs
PROOF_OUT=test-results/r87-sizes/final-clubs node tests/browser/r87-sizes-clubs-recheck.cjs
bash audit/r87-sizes-fixes/run-gameplay.sh
JAVA_TOOL_OPTIONS="-Xmx768m -XX:ActiveProcessorCount=4" CE2PG_PLAN=single CE2PG_SEASONS=1 CE2PG_BUDGET=1 CE2PG_BUDGET_SAMPLE_MIN=0 CE2PG_BUDGET_SHORT_SAMPLE_MIN=0 CE2PG_RUN=3 CE2PG_PORT_BASE=12030 CE2PG_APP_PORT=4664 PROOF_SIZES=daniel=1920x1080,nik=844x390 PROOF_OUT=test-results/r87-sizes/settled-final-3 NODE_OPTIONS="--require $PWD/tools/r87-sizes-click-proof.cjs" node tests/browser/ce2pg-journey.cjs
CMS_TRANSITION_REPORT=test-results/r87-sizes/transitions-five.json node tools/r87-sizes-transition-proof.cjs seasonResults
node tools/proof-sizes-report.cjs test-results/r87-sizes/verified-1 test-results/r87-sizes/verified-2 test-results/r87-sizes/verified-3
node --check tests/contracts/r87-sizes-fixes-contracts.cjs
node --check tests/browser/r87-sizes-clubs-recheck.cjs
node --check tools/r87-sizes-click-proof.cjs
node --check tools/r87-sizes-transition-proof.cjs
git diff --check
```
