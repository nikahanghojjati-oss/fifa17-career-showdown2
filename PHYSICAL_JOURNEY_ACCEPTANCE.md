# Physical Journey Production Acceptance — r44

This checklist is for the irreducible two-account, two-physical-device, two-network MDP Physical Journey proof. Do not use it until runtime `1.9.1-r44` is the exact deployed production runtime.

## Acceptance URL

Open the production site on both devices with `?ssjr-acceptance=1&ssjr-physical=1` and keep each run in the same browser tab for the entire journey. Reload that tab only at the two explicit reload steps below; do not close/reopen the tab between steps because the recorder intentionally persists sanitized evidence in `sessionStorage` only.

Before starting, make sure each Physical Journey panel belongs to this run. If a panel contains evidence from an earlier attempt, press `RESET RECORDER` once. Then save these labels:

- Device A: `Chromebook host`; network `Home Wi-Fi`.
- Device B: `iPhone peer`; network `Cellular`. Keep iPhone Wi-Fi off for the run.
- Use two legitimate private manager accounts. Never paste raw account, device, rivalry, Save, profile or session IDs into evidence.

## Prepare both local shared shells before pairing

This ordering remains mandatory in r44 and preserves the repaired peer-entry path for the physical two-device run.

1. On the Chromebook, open New Showdown/Create Showdown, enter the intended two manager names, and press `PREPARE SHARED SHOWDOWN`.
2. On the iPhone, independently open New Showdown/Create Showdown, enter the same intended two manager names, and also press `PREPARE SHARED SHOWDOWN`.
3. Each device now owns its own new pre-draw Shared Showdown shell. Any older local career remains separately saved; **do not use `CONTINUE CAREER` to enter this shared journey**.
4. Pair the two exact managers from these prepared shells so one binding is `playerOne` and the other is `playerTwo`.
5. On the Chromebook side, host one exact private session and share the code directly with the iPhone peer.
6. On the iPhone side, enter that code once and press `JOIN PRIVATE SESSION`. When the provider confirms the session is ACTIVE, the shared journey returns the peer automatically to Shared Showdown entry. Do not enter the code a second time.
7. If the host Remote Joining panel still shows OPEN after the peer joins, use `REFRESH / READ` once. Return to Shared Showdown entry and use `REFRESH STATUS` if needed. Both devices must show the exact private session as ACTIVE before continuing.

`OPEN SHARED SETUP` is not a Home-menu command. It is a host-only control inside the authoritative Shared Setup experience after both devices have entered the shared journey. The peer does not need that button: it observes the host-owned setup state and follows the shared presentation.

If a completed product step is not reflected promptly in the Physical Journey panel, press `CHECK NOW`; do not replay a provider mutation merely to make the recorder notice it. Keep the same manager roles, accounts, registered devices and rivalry for the full attempt. If the panel ever shows `AUTHORITY` incomplete, discard the attempt and use `RESET RECORDER` before starting fresh.

## One-season journey

1. From the ACTIVE shared entry, continue to the authoritative shared league wheel. Complete the league draw, permanent distinct club assignment, choose exactly one season, and finish both-manager setup confirmation.
2. Both managers acknowledge Career Start, complete the Transfer Challenge for season 1, publish/review their own season-1 results, finish the reconciled season-1 commit, and wait for canonical scoring plus Shared History convergence through season 1.
3. Only after Shared History has converged, take each device genuinely offline once and then reconnect it. Keep it offline long enough for the browser to observe the offline state. Wait until the Physical Journey panel shows OFFLINE RECOVERY complete.
4. Reload the same tab on each device once after recovery and before Local Reconciliation or terminal closure. Wait for RELOAD to become complete. Continue the same rivalry; do not redraw or reset.
5. Reach Local Reconciliation in safe read-only preview. **Do not apply Candidate C.** the Physical Journey recorder hashes canonical local storage immediately before and immediately after this preview to prove that the preview itself is non-destructive; normal Save Library changes from legitimate setup/gameplay before this point are expected and are not treated as corruption.
6. Reach Final Reconciliation for season 1, then complete Terminal Close. The panel must show CLOSED.
7. Reload the same tab on both devices once more after CLOSED. The panel must show CLOSED AFTER RELOAD and no replacement session or extra season may resurrect the Showdown.
8. Confirm the saved device/network labels, `AUTHORITY` complete, and all expected indicators. On each device press `DOWNLOAD JSON` (or `COPY EVIDENCE` if download is unavailable) and provide both sanitized exports together.

A successful run therefore has at least three recorder startups on each device: initial load, the required post-recovery/pre-terminal reload, and the distinct post-CLOSED reload.

## Acceptance oracle

Run `npm run validate:ssjr-physical-journey -- <player-one.json> <player-two.json>`. A valid pair requires opposite manager and host/peer roles, stable manager/account/device/rivalry authority, distinct account/device fingerprints, distinct device/network evidence, one shared rivalry and correlated private session, exactly one season, the ordered History → offline → online → reconnect → reload → scoped Local Reconciliation storage proof → PREVIEW_READY → Final Reconciliation → Terminal Close → post-CLOSED reload path, the independent non-writing conflict-guard proof, and no Candidate C Apply observation.

The recorder is acceptance-only, persists only sanitized evidence in sessionStorage, makes no recorder-owned network request, exports no raw private authority, and never applies Candidate C. The canonical-storage invariant is deliberately scoped to the read-only Local Reconciliation preview rather than the entire playable career.