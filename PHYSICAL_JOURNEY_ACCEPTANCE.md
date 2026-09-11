# Physical Journey Production Acceptance — r19

This checklist is for the irreducible two-account, two-physical-device, two-network MDP Physical Journey proof. Do not use it until runtime `1.9.1-r19` is the exact deployed production runtime.

## Acceptance URL

Open the production site on both devices with `?ssjr-acceptance=1&ssjr-physical=1` and keep each run in the same browser tab for the entire journey. Reload that tab only at the two explicit reload steps below; do not close/reopen the tab between steps because the recorder intentionally persists sanitized evidence in `sessionStorage` only.

Before pairing, make sure each Physical Journey panel belongs to this run. If a panel contains evidence from an earlier attempt, press `RESET RECORDER` once before starting. Then enter the labels below and press `SAVE LABELS` on each device:

- Device A: device label `Chromebook host`; network label `Home Wi-Fi`.
- Device B: device label `iPhone peer`; network label `Cellular`. Keep the iPhone off Wi-Fi for the run.
- Use two legitimate private manager accounts. Never paste raw account, device, rivalry, Save, profile or session IDs into evidence.

If a completed product step is not reflected promptly in the panel, press `CHECK NOW`; do not repeat a provider mutation merely to make the recorder notice it.

## One-season journey

1. Pair the two managers and establish one exact ACTIVE private session. Complete the shared league draw, permanent distinct club assignment, exactly one-season length and both-manager setup confirmation.
2. Both managers acknowledge Career Start, complete the Transfer Challenge for season 1, publish/review their own season-1 results, finish the reconciled season-1 commit, and wait for canonical scoring plus Shared History convergence through season 1.
3. Only after Shared History has converged, take each device genuinely offline once and then reconnect it. Wait until the Physical Journey panel shows OFFLINE RECOVERY complete. The recorder performs the replaceable conflict-guard proof automatically; do not manufacture a conflict manually.
4. After OFFLINE RECOVERY is complete, reload the same tab on each device once before Local Reconciliation or terminal closure and wait for RELOAD to become complete. Continue the same rivalry; do not redraw or reset.
5. Reach Local Reconciliation in safe read-only preview. **Do not apply Candidate C** during this standard Physical Journey run. Candidate C remains the sole explicit destructive local Apply path and is tested separately with backup/rollback safeguards.
6. Reach Final Reconciliation for season 1, then complete Terminal Close. The panel must show CLOSED.
7. Reload the same tab on both devices once more after CLOSED. The panel must show CLOSED AFTER RELOAD; no replacement session or extra season may resurrect the Showdown.
8. Confirm the panel still shows the saved device/network labels and the expected completed journey indicators. On each device, press `DOWNLOAD JSON` (or `COPY EVIDENCE` if download is unavailable) and provide the two sanitized exports together.

A standard successful run therefore has at least three recorder startups on each device: initial load, the required pre-terminal reload, and the distinct post-CLOSED reload.

## Acceptance oracle

Run `npm run validate:ssjr-physical-journey -- <player-one.json> <player-two.json>`. A valid pair requires opposite manager and host/peer roles, distinct account/device fingerprints, distinct device/network evidence, one shared rivalry and correlated private session, an exactly one-season plan with coherent season-1 milestones, the ordered History → offline → online → reconnect → pre-terminal reload → read-only Local Reconciliation → Final Reconciliation → Terminal Close → post-CLOSED reload path, the independent non-writing conflict-guard proof, unchanged canonical local storage, and no Candidate C Apply observation at any point.

The recorder is acceptance-only, persists only sanitized evidence in sessionStorage, makes no recorder-owned network request, exports no raw private authority, and never applies Candidate C.