# Studio Z: emergency fixes from Nik and Daniel's live test (7–8 Oct 2026)

Opened by Nik on 2026-10-09 00:07 UTC. Part of the G Factory, reports to the Team G lead, and closes (archived, never deleted) once every job below is fixed and proven.
Thread: "Studio Z emergency fixes". Code branch: `studio-z/r63` (built on `gameplay/bug-list-1` + main), shipped to main as r63.

Inputs read: Nik's Problem Z handoff (GPT-6, 8 Oct), branch `investigation/problem-z-z-studio-2026-10-08`, the Bug Olympiad on `qa/bug-olympiad` (38 findings: 11 checked real, 9 not real, 18 unchecked), and `handoff/sol-retirement`. GPT's output is input, not proof: every cause below was reproduced by Claude on the emulators before fixing.

## What broke, and the job that fixes it

| Job | What Nik and Daniel saw | Cause Claude reproduced | Fix |
|---|---|---|---|
| Z1 | Home lost the sign-in badge; Continue fell into old screens | The sign-in starter runs before the script loader on a slow start and never retries (1.5 s delay reproduces it on phone and Chromebook) | Start after the page's scripts are ready, retry a few times, never latch a failure |
| Z2 | "Connection required" / RECONNECT that never clears | One slow network check (1.8 s) marks the game offline for the rest of the visit; TRY AGAIN re-reads the same stale flag | One slow check is not "offline"; re-check on its own and on TRY AGAIN |
| Z3 | A refresh anywhere (Transfer included) cannot continue | The private session lives only in page memory, so a refresh drops you on Home and CONTINUE CAREER opens the old REMOTE JOINING code screen while the other phone is still in the game | Remember this tab's session through a refresh and go straight back to the game |
| Z4 | The old "connectivity module" (session codes) every game day | Every new day Daniel must host and send Nik a long session code to paste | Daniel's phone offers the session to Nik's phone automatically through their private pair; no codes |
| Z5 | Old build pieces keep coming back (Offline App panel, old screens) | A downloaded update only applies when someone taps UPDATE in Settings, so tablets and phones keep running an old build | Apply a ready update automatically on Home |
| Z6 | Stuck on "Opening Google sign-in…" | No way out while the sign-in waits; the result of a failed popup is dropped | Show TRY AGAIN after a short wait and keep the sign-in parts warm so the popup opens on the tap |
| Z7 | Transfer cards do not fit on Daniel's tablet; "Complete signing 1" | On an upright tablet (768–1100 wide) the desktop layout puts Daniel's card off the left edge (measured at 768×1024 and 800×1280) | Upright tablets use the phone layout; Team V gets a tablet ticket |
| Z8 | A signing locks with the wrong league | Typing "Primera División" picks Argentina silently (Olympiad 2238-1, re-run) | A typed name shared by two countries waits for an explicit choice |

## Proof bar for closing
- Each job: a regression test that fails before and passes after, plus the full two-player journey (36 checks) on the emulators.
- Z3/Z4: a two-player reload test (refresh mid-transfer and mid-setup, both phones end up back in the same game with no codes typed).
- Z7: measured layout at 10 sizes (360×640 to 1920×910) with no input off screen.
- Release: all main checks green and the deployed-site smoke, then Nik and Daniel's next real game is the physical proof.

## Not in Studio Z (left in the normal backlog)
Restore "Keep current" safety bugs (Olympiad 1312-1/-2), Rule Book wording, stale season inputs (1251/1301), the unchecked Olympiad items, and old-design leftovers that need new art (Career Start card) go to Team V.
