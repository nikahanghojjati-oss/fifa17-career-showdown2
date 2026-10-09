# Physical Journey Production Acceptance — r64

This checklist is for the irreducible two-account, two-physical-device, two-network MDP Physical Journey proof. Do not use it until runtime `1.9.1-r64` is the exact deployed production runtime.

## Acceptance URL

Open the production site on both devices with `?ssjr-acceptance=1&ssjr-physical=1` and keep each run in the same browser tab for the entire journey. Reload that tab only at the two explicit reload steps below; do not close/reopen the tab between steps because the recorder intentionally persists sanitized evidence in `sessionStorage` only.

Before starting, make sure each Physical Journey panel belongs to this run. If a panel contains evidence from an earlier attempt, press `RESET RECORDER` once. Then save these labels:

- Device A: `Chromebook host`; network `Home Wi-Fi`.
- Device B: `iPhone peer`; network `Cellular`. Keep iPhone Wi-Fi off for the run.
- Use two legitimate private manager accounts. Never paste raw account, device, rivalry, Save, profile or session IDs into evidence.

## Sign in and establish manager identity first

Both players must be signed in before starting or joining the new Showdown.

1. On the Chromebook, sign in with Daniel's intended private account, choose/confirm **Daniel**, and wait until the connected-player identity is ready.
2. On the iPhone, sign in with Nik's intended private account, choose/confirm **Nik**, and wait until the connected-player identity is ready.
3. Only Daniel starts the new Showdown and chooses the season count. Nik waits for Daniel's code and joins through the role-specific Home action; Nik does not start a second Showdown or choose a season count.
4. If `START A SHOWDOWN` reports that the connection/identity service is unavailable while the device is not signed in, stop and complete sign-in first; do not classify that state as a provider outage.

## Daniel starts; Nik joins with Daniel's code

The app handles each device's local recovery copy internally. Neither player needs to create a separate offline save or use an engineering setup screen.

1. On the Chromebook, Daniel selects `START A SHOWDOWN`, chooses **3 Seasons**, and presses `START A SHOWDOWN` on the season screen.
2. Daniel follows `CONNECT PLAYERS` and selects `CREATE CODE FOR NIK`. Send that code directly to Nik.
3. On the iPhone, Nik selects `JOIN DANIEL'S SHOWDOWN` on Home, enters Daniel's code once, and presses `JOIN DANIEL'S SHOWDOWN` in the connection panel. Nik does not select a season or create a separate Showdown. The app reads the season count from Daniel's code and automatically prepares Nik's local recovery copy during joining.
4. If Daniel still shows a waiting state after Nik has joined, select `CHECK STATUS` once. Both devices must show the same connected pair. Pairing alone does not make the private play session ACTIVE.
5. Both players open this exact paired career with `CONTINUE CAREER` if prompted. In the `GET READY` screen, select `CONTINUE` to open the private session controls. Daniel selects `HOST PRIVATE SESSION` and shares the new session code directly with Nik. This is a second code, separate from the earlier `CMS17-` pairing code. Nik enters this new code and selects `JOIN PRIVATE SESSION`.
6. When both devices show the same ACTIVE private session, return to `GET READY` and select `START CAREER` on each device. Only then may Daniel spin the league wheel. If Home offers `CONTINUE CAREER` for this exact paired Showdown after a reload, that is a valid recovery route; do not choose an unrelated older career.

`OPEN SHARED SETUP` is not a Home-menu command. It is a host-only control inside the authoritative Shared Setup experience after both devices have entered the shared journey. The peer does not need that button: it observes the host-owned setup state and follows the shared presentation.

If a completed product step is not reflected promptly in the Physical Journey panel, press `CHECK NOW`; do not replay a provider mutation merely to make the recorder notice it. Keep the same manager roles, accounts, registered devices and rivalry for the full attempt. If the panel ever shows `AUTHORITY` incomplete, discard the attempt and use `RESET RECORDER` before starting fresh.

## Season journey (every season of the plan)

1. From the ACTIVE shared entry, Daniel spins the authoritative league wheel and opens the two club packs. Nik watches the same league and club reveals on the iPhone. Confirm that the displayed season length is the same **3 Seasons** Daniel chose at the beginning; neither player chooses it again. Both managers select `CONFIRM SHARED SHOWDOWN` on their own device when available.
2. Both managers acknowledge Career Start once. Then, for **each season** (1, 2 and 3), complete that season's Transfer Challenge, publish/review each own result, finish the reconciled Shared Season Commit, and wait for canonical scoring plus Shared History convergence for that season. After seasons 1 and 2, both managers select `CONTINUE TO SEASON N` once on Showdown Home and start that season's Transfer Challenge. The Physical Journey panel row `SEASONS n/3` counts completed seasons and ticks at 3/3 once the completed plan is recorded.
   - Results regression probe: before either manager publishes, both devices must remain on their unpublished Review screen for at least 35 seconds. Ordinary polling must not kick either device back to result entry, and any visible publication/review error must remain visible long enough to read.
   - After both publish, the same Results screen must expose the Shared Season Commit flow. Daniel/coordinator commits the shared snapshot, then Daniel and Nik independently acknowledge it. Canonical scoring and Shared History must appear without manually loading another capability or returning to a dead-end r9 screen.
   - If Daniel sees `CHECK SHARED SEASON COMMIT` or `RETRY COMMIT CHECK`, press it once. This checks the existing published results without changing them. If it returns `COMMIT SHARED SEASON`, Daniel may continue. If it shows a failure code, keep both Showdowns open and save a screenshot of the code; do not restart, republish, or use the ordinary local `CONFIRM & SAVE SEASON` button.
3. Only after the **last** season's Shared History has converged, take each device genuinely offline once and then reconnect it. Keep it offline long enough for the browser to observe the offline state. Wait until the Physical Journey panel shows OFFLINE RECOVERY complete.
4. Reload the same tab on each device once after recovery and before Local Reconciliation or terminal closure. Wait for RELOAD to become complete. Continue the same rivalry; do not redraw or reset.
5. After the required post-recovery reload, stay in the post-results flow and press **`PREVIEW LOCAL RECONCILIATION`** once when it appears. Wait for `PREVIEW READY`. This is the safe read-only preview; **do not apply Candidate C** from Settings/advanced recovery. The Physical Journey recorder hashes canonical local storage immediately before and immediately after this preview to prove that the preview itself is non-destructive; normal Save Library changes from legitimate setup/gameplay before this point are expected and are not treated as corruption.
6. Reach Final Reconciliation for the last season, then complete Terminal Close. The panel must show CLOSED.
7. Reload the same tab on both devices once more after CLOSED. The panel must show CLOSED AFTER RELOAD and no replacement session or extra season may resurrect the Showdown.
8. Confirm the saved device/network labels, `AUTHORITY` complete, and all expected indicators. On each device press `DOWNLOAD JSON` (or `COPY EVIDENCE` if download is unavailable) and provide both sanitized exports together.

A successful run therefore has at least three recorder startups on each device: initial load, the required post-recovery/pre-terminal reload, and the distinct post-CLOSED reload.

## Acceptance oracle

Run `npm run validate:ssjr-physical-journey -- <player-one.json> <player-two.json>`. A valid pair requires opposite manager and host/peer roles, stable manager/account/device/rivalry authority, distinct account/device fingerprints, distinct device/network evidence, one shared rivalry and correlated private session, every season of one confirmed 1/3/5/10 plan in order (plus the completed plan for multi-season runs), the ordered last-season History → offline → online → reconnect → reload → scoped Local Reconciliation storage proof → PREVIEW_READY → Final Reconciliation → Terminal Close → post-CLOSED reload path, the independent non-writing conflict-guard proof, and no Candidate C Apply observation.

The recorder is acceptance-only, persists only sanitized evidence in sessionStorage, makes no recorder-owned network request, exports no raw private authority, and never applies Candidate C. The canonical-storage invariant is deliberately scoped to the read-only Local Reconciliation preview rather than the entire playable career.
