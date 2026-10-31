# JOB-16 Browser Journey Report

## Proof source

- Code head: `e93c6f9a4a4928d2c66d313cb7640d4c1f5c82f2`
- Validate Gameplay Fast: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37156146934
- Browser artifact: `browser-journey-screens` · artifact `11285427691`
- Browser last line: `PASS two-manager browser journey: 32 numbered checks (J0-J12) on the Auth + Firestore emulators, composed production Rules, 3-season Showdown.`
- Gameplay contracts: `PASS POS10 selected deterministic census (110/110 current blocking contracts: frozen POS10 floor + POS20 supplements).`
- Emulator-switch contract: `PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip 37493/37500, services parity.`
- Operations audit: pass 73 / fail 0.
- Compare against `gameplay/recovery-v1`: ahead 36 / behind 0; exactly the seven permitted code/test/workflow files differ.

## Check matrix

| Check | Status | Evidence |
| --- | --- | --- |
| J0.1 | PASS | Composed production Rules were uploaded to the emulator; open read changed 404 → 403. |
| J0.2 | PASS | Both browser contexts used the localhost-only cmsEmulator=1 switch; no production runtime path was used. |
| J1.1 | PASS | Daniel and Nik signed in through the real SIGN IN WITH GOOGLE flow and chose their fixed players. |
| J1.2 | PASS | Both emulator accounts bootstrapped and registered their devices through composed Rules. |
| J2.1 | PASS | Daniel created the real pair code from the Start flow. |
| J2.2 | PASS | Nik joined; Daniel=playerOne, Nik=playerTwo; both career indexes contained R1. |
| J3.1 | PASS | Daniel hosted and Nik joined the private session; both reached leagueWheelScreen. |
| J4.1 | PASS | Nik's authoritative draw controls were locked while Daniel remained host. |
| J4.2 | PASS | Daniel drew the authoritative league and Nik's page received the same league without drawing. |
| J4.3 | BUG | Both pages converged on the same two clubs with Daniel in the LEFT slot, but Nik's presentation required a navigation-only CONTINUE TO CLUB PACKS tap after authority had already followed. |
| J4.4 | PASS | Both managers confirmed the identical shared setup and advanced to Career Start. |
| J5.1 | PASS | Each manager saw only the start acknowledgement for their assigned club. |
| J5.2 | PASS | Both private Career Start acknowledgements converged to ready. |
| J5.3 | PASS | Both managers reached the real Shared Transfer Challenge through the UI. |
| J6.1 | BUG | The shared 15-minute window was authoritative on both pages, but the early-end control can still show legacy END WINDOW EARLY copy instead of REQUEST EARLY END. |
| J6.2 | PASS | Both managers requested early end and the shared window advanced without waiting 15 minutes. |
| J6.3 | PASS | Both managers entered and locked their private guesses through the real controls. |
| J6.4 | PASS | Before COMPLETED, rival unfinished signings were absent from rendered text and every input value. |
| J6.5 | PASS | After COMPLETED, both pages revealed the signings identically and enabled Shared Season Results. |
| J7.1 | PASS | Daniel published first and his 1 / 87 / 93 season row stayed private from Nik. |
| J7.2 | PASS | RESULTS_READY revealed identical raw season facts on both pages while canonical scoring remained locked until commit. |
| J7.3 | PASS | After Season 1 commit, both pages showed canonical Daniel 9 / Nik 3 and Daniel as winner. |
| J8.1 | PASS | Both dashboards showed 9-3 and Season 2 of 3 after the Season 1 commit. |
| J8.2 | PASS | Season 2 repeated the shared transfer flow with rendered privacy before completion. |
| J8.3 | PASS | Simultaneous Season 2 publish converged to RESULTS_READY with no stale/error banner. |
| J8.4 | PASS | Season 2 canonical score was Daniel 0 / Nik 11; Nik won. |
| J8.5 | PASS | Season 3 canonical score was 1-1 and Daniel won on league-position tiebreak. |
| J10.1 | PASS | Both pages reconciled the three-season final as Daniel 10 / Nik 15; Nik wins by 5. |
| J10.2 | PASS | Terminal Close completed through the UI; read-only admin proof found the closed R1 root with terminalClose witness. |
| J11.1 | PASS | Third account could not redeem closed R1 and received no pair link, no R1 career-index entry, and no R1/QWX/ZPV rendered leak. |
| J12.1 | PASS | After terminal R1, Daniel and Nik created distinct R2; both career indexes were [R1,R2] and both reached R2 league wheel. |
| JZ.1 | PASS | No production Firebase host, production runtime/config load, or page error occurred in Daniel, Nik, or stranger contexts. |

J9 is a **KNOWN GAP**, not a numbered PASS: `J9 SKIPPED: resume after reload is a separate product job (lead decision 2026-10-03)`.

## Bugs found

1. **Peer league authority updates before peer presentation advances.** After Daniel completes the authoritative league selection, Nik receives the selected league correctly but remains on `#leagueWheelScreen` until the navigation-only `#spinLeague` continuation is tapped; no second authoritative draw occurs. The journey preserves today's behavior with a `// BUG` marker and still proves both pages converge on the same clubs with Daniel in the LEFT slot. Likely product location: `js/leagueWheel.js` around lines 184-214, where `prepareClubAssignment()` is reached through the explicit `confirmLeagueSelectionAndContinue()` action rather than a peer-state-driven presentation transition.

2. **Legacy early-end button copy can survive into the shared window.** Shared transfer authority is correct, but `#endTransferTimer` can render `END WINDOW EARLY` instead of the intended `REQUEST EARLY END`. The static legacy label is in `index.html` line 285, while `js/productionSharedTransferChallenge.js` around lines 203-211 rewrites the shared-state label. The journey accepts either visible copy but still requires the real shared early-end mutation and convergence.

The J5 Career Start guard is a harness timing guard, not a product acceptance weakening: if the Career Start overlay has already opened, the journey does not click the now-covered navigation control. The J12 post-terminal reload guard closes the visible `GET READY` career-entry overlay before starting R2, as explicitly assigned by the lead; the reload/resume behavior remains owned by the separate reload job.

## Not covered by G-2b

Abandon through the UI, network drop and reconnect (`context.setOffline`), 5- and 10-season lengths, Career Statistics / History / Trophy Room screens (wait for G-13), closed-Showdown reads (G-8).
