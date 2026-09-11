# Physical Journey Production Acceptance — r19

This checklist is for the irreducible two-account, two-physical-device, two-network MDP Physical Journey proof. Do not use it until runtime `1.9.1-r19` is the exact deployed production runtime.

## Acceptance URL

Open the production site on both devices with `?ssjr-acceptance=1&ssjr-physical=1`.

- Device A: label `Chromebook host`; network label `Home Wi-Fi`.
- Device B: label `iPhone peer`; network label `Cellular`. Keep the iPhone off Wi-Fi for the run.
- Use two legitimate private manager accounts. Never paste raw account, device, rivalry, Save, profile or session IDs into evidence.

## One-season journey

1. Pair the two managers and establish one exact ACTIVE private session. Complete the shared league draw, permanent distinct club assignment, one-season length and both-manager setup confirmation.
2. Both managers acknowledge Career Start, complete the Transfer Challenge, publish/review their own season results, finish the reconciled season commit, and wait for canonical scoring plus Shared History convergence.
3. During the live journey, take each device genuinely offline once and then reconnect it. Wait until the Physical Journey panel shows OFFLINE RECOVERY complete. The recorder performs the replaceable conflict-guard proof automatically; do not manufacture a conflict manually.
4. Reload each device once before terminal closure and wait for RELOAD to become complete. Continue the same rivalry; do not redraw or reset.
5. Reach Local Reconciliation in safe read-only preview. **Do not apply Candidate C** during this standard Physical Journey run. Candidate C remains the sole explicit destructive local Apply path and is tested separately with backup/rollback safeguards.
6. Reach Final Reconciliation, then complete Terminal Close. The panel must show CLOSED.
7. Reload both devices once more after CLOSED. The panel must show CLOSED AFTER RELOAD; no replacement session or extra season may resurrect the Showdown.
8. On each device, press DOWNLOAD JSON (or COPY EVIDENCE if download is unavailable) and provide the two sanitized exports together.

## Acceptance oracle

Run `npm run validate:ssjr-physical-journey -- <player-one.json> <player-two.json>`. A valid pair requires opposite manager and host/peer roles, distinct account/device fingerprints, distinct device/network evidence, one shared rivalry and correlated private session, ordered full-journey milestones, real offline recovery, reload recovery, safe Local Reconciliation, Final Reconciliation, terminal CLOSED after reload, and unchanged canonical local storage.

The recorder is acceptance-only, persists only sanitized evidence in sessionStorage, makes no recorder-owned network request, exports no raw private authority, and never applies Candidate C.
