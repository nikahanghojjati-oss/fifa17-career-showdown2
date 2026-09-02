# Stage 5E Production Remote Joining Acceptance Runbook — 2026-09-02

Status: BLOCKED UNTIL `v1.9.0 / 1.9.0-r2` IS DEPLOYED AND INDEPENDENTLY VERIFIED

Working branch: `rjr/stage5e-production-acceptance-2026-09-02`

Starting production main: `5f6941d48e8174ba29a34bbbf4835cf23cfea17d`

Known-broken production identity that exposed the restore regression: `v1.9.0 / 1.9.0-r1`

Required acceptance identity: independently verified deployed `v1.9.0 / 1.9.0-r2`

Fixed RJR before this evidence: `87/100`

## Hard gate before any owner/device acceptance

Do not repeat production Remote Joining acceptance on `1.9.0-r1`. That runtime contains the known Player Two Connected Rivalry restore blocker and cannot produce valid acceptance evidence for this repair.

The owner/device sequence in this runbook becomes READY only after all of the following are true:

1. PR #182 exact-head mandatory tests and review gates pass on one unchanged final head;
2. PR #182 is expected-head merged under the standing nonbilling authorization;
3. GitHub Pages deployment completes successfully;
4. the deployed site is independently verified as application `v1.9.0` with runtime asset revision `1.9.0-r2`;
5. browser cache/service-worker verification proves the active page is actually using `r2`, not a retained `r1` shell.

Until all five are proven, do not ask the owner to perform pairing, Connected Rivalry, Host, Join, Refresh/Read or Close acceptance steps.

## Purpose

Consume the smallest genuine production-live evidence event that can close the currently uncredited actual Remote Joining capability, while first proving the new automatic pairing-to-Connected-Rivalry handoff behaves correctly on both manager contexts. This is not a CI or source proof. It must use the deployed `r2` GitHub Pages application, two distinct authenticated rivalry accounts, and two real registered browser/device contexts.

Target sequence:

`Pairing auto-link confirmation -> Host -> Join -> Read/Refresh -> Close -> peer Read/Refresh terminal state`

A normal Chrome profile and an Incognito profile on the same physical Chromebook are acceptable for this first production session-lifecycle proof because Stage 3 already established that they are distinct application device identities. They do not satisfy the later separate two-physical-device/two-network hardening gate.

## Permanent safety locks

- Billing is permanently forbidden. Firebase remains Spark.
- Do not enable Blaze, Cloud Billing, Cloud Run, Cloud Functions or any paid/billing-required service.
- Firestore remains memory-only. App Check enforcement remains OFF.
- Do not list or discover sessions. Use only the exact private capability.
- Do not edit, force, delete or destructively test the protected historical rivalry.
- Do not change gameplay data or use Candidate C during this acceptance.
- Do not publish, commit, paste into chat, or otherwise expose the full `session_...` capability. Redact the complete capability line in every screenshot before uploading evidence.
- The automatic pairing ID prefill is not authority until Connected Rivalry verifies the active two-manager rivalry and persists the existing dedicated IndexedDB pointer.

## Automatic pairing-to-Connected-Rivalry confirmation

The normal `r2` flow must require only one pairing-code transfer from Player One to Player Two. The same exact `pair_...` identifier becomes the Connected Rivalry ID automatically.

### Player One — create and wait

1. In the Player One browser context, sign in to the correct Connected Account and confirm the current browser is registered.
2. In Registered Device & Pairing, choose the correct Player One manager identity.
3. Press `CREATE PAIRING CODE` exactly once.
4. Confirm Connected Rivalry immediately shows the same exact `pair_...` ID as an automatic prefill / pairing-ready value.
5. Before Player Two joins, confirm it is not presented as a verified saved attachment and Remote Joining is not enabled merely by the prefill.
6. Share the pairing code directly with Player Two.
7. Do not change the pairing manager selection while that capability is live. `r2` locks the captured manager selection so a late dropdown action cannot redirect the capability.

### Player Two — join once

1. In the Player Two browser context, sign in to the other Connected Account and confirm that browser is registered.
2. Choose the correct Player Two manager identity.
3. Paste the Player One pairing code into `JOIN PRIVATE PAIRING`.
4. Press `JOIN PRIVATE PAIRING` exactly once.
5. Wait for success.
6. Confirm Player Two's Connected Rivalry automatically uses the redeemed exact `pair_...` ID and becomes attached/saved for the correct Player Two manager after provider verification.
7. Do not manually copy the code into Connected Rivalry and do not press manual Attach in the normal flow.

### Player One — confirm active auto-attachment

After Player Two successfully joins, Player One does not need to press `ATTACH CONNECTED RIVALRY` or `VERIFY / REATTACH` in the normal flow.

Player One should do exactly this:

1. return to Save Library, or open `PRIVATE REMOTE JOINING`;
2. allow the normal Connected Rivalry initialization to run;
3. confirm the same exact rivalry is now shown as attached/saved for the correct Player One manager;
4. confirm the status is no longer only `Pairing ready` / non-authoritative prefill;
5. confirm the Player One manager identity did not switch to Player Two;
6. only after those facts are visible may Player One proceed to Host.

Manual `VERIFY / REATTACH` remains recovery-only. If automatic verification does not produce the correct attached/saved Player One state, stop and capture evidence. Do not use manual reattach to hide or work around an auto-link failure during this acceptance.

## Preconditions — prove before Host

Use two browser contexts that are the two managers of the same exact automatically attached Connected Rivalry.

Player One context must show:

1. production site is `v1.9.0 / 1.9.0-r2`;
2. Connected Account is signed in and ready;
3. current browser is registered;
4. the exact paired Connected Rivalry is attached/saved automatically without manual reattach after Player Two joined;
5. the attached rivalry belongs to the correct Player One account/device/manager context.

Player Two must independently show the same five facts for the other paired account/device/manager context, including automatic attachment from the redeemed pairing ID.

If either context reports Auth, device, rivalry, manager-binding or provider mismatch, stop. Do not repair by deleting the protected rivalry, changing billing/provider policy, or manually reattaching merely to make the acceptance continue.

## Evidence sequence

### Evidence A — Player One automatic-link precondition

Capture one screenshot showing the current Player One Connected Account / registered device / automatically attached rivalry state. Also capture the `v1.9.0` footer/runtime identity if it is not visible in the same frame. The evidence should make it possible to confirm Player One remained Player One.

### Evidence B — Player Two automatic-link precondition

Capture the equivalent screenshot from the distinct Player Two authenticated browser context. It must show Player Two remained Player Two and the same exact rivalry is attached/saved.

### Evidence C — Host

On Player One:

1. open `PRIVATE REMOTE JOINING`;
2. press `HOST PRIVATE SESSION` exactly once;
3. wait for success;
4. confirm the panel reports an `OPEN` session and a numeric revision;
5. use `COPY CODE` to transfer the exact capability directly to Player Two.

Before sharing any screenshot, completely cover/redact the full `session_...` line. Do not partially reveal it.

Expected production meaning: provider accepted a new exact-path session for the current authenticated host, registered device metadata and attached exactly-two-account rivalry.

### Evidence D — Join

On Player Two:

1. paste the exact private code into `JOIN EXACT SESSION`;
2. press `JOIN PRIVATE SESSION` exactly once;
3. wait for success;
4. confirm the panel reports `ACTIVE`, a numeric revision, and role `peer`;
5. confirm the status message says the session is active with exactly the two paired rivalry accounts and local gameplay remains unchanged.

Redact the complete capability line before uploading the screenshot.

### Evidence E — Cross-context Read/Refresh

On Player One:

1. press `REFRESH / READ`;
2. confirm the session now reports `ACTIVE` at the same authoritative revision Player Two observed after Join;
3. capture a redacted screenshot.

Then, if useful, refresh once on Player Two and confirm the same active revision. Do not create another session and do not repeat writes merely for confidence.

### Evidence F — Close and terminal peer observation

On either active member, preferably Player Two:

1. press `CLOSE SESSION` exactly once;
2. confirm the panel reports terminal `CLOSED` with a new/authoritative revision;
3. capture a redacted screenshot.

On the other member, Player One:

4. press `REFRESH / READ`;
5. confirm the same exact session now reads `CLOSED` at the same terminal revision;
6. capture a redacted screenshot.

After both terminal screenshots are captured, either context may use `FORGET CODE`. Reloading also discards the capability from page memory.

## Minimum evidence acceptance criteria

The evidence set is sufficient to recalculate RJR only if it establishes all of the following without relying on unverified assumptions:

- deployed fixed identity is independently verified `v1.9.0 / 1.9.0-r2`;
- the creator's exact pairing ID is visibly prefilled in Connected Rivalry before peer join but remains non-authoritative;
- Player Two redeems that exact ID and auto-attaches it for the correct Player Two manager;
- after Player Two joins, Player One auto-verifies/attaches the same rivalry on normal initialization without manual Attach/Reattach;
- Player One and Player Two manager bindings remain isolated and do not swap;
- two distinct authenticated paired accounts are used;
- two distinct registered browser/device contexts are used;
- both contexts refer to the same exact paired Connected Rivalry;
- Player One creates a production `open` session;
- Player Two joins and provider authority becomes `active` with exactly two members;
- Player One reads the same active authoritative revision;
- one entitled member closes the session terminally;
- the other entitled member reads the same terminal `closed` authority;
- no public listing/discovery is used;
- no gameplay Apply/Candidate C action occurs;
- no billing/provider-policy change occurs;
- no full session capability is exposed in retained evidence.

The deployed protocol result itself includes `hostAccountId` and `memberAccountIds` and validates exactly-two-member active state. The UI intentionally presents the bounded lifecycle state while the exact session capability remains page-memory-only.

## RJR rule after evidence

Do not preassign a delta. After the complete production evidence exists, compare it against fixed `REMOTE_JOINING_READINESS.json` domains and credit only genuinely new capabilities. The first successful provider-live Remote Joining lifecycle is expected to move RJR above 87 because actual sessions are explicitly uncredited, but the exact score must be calculated from the evidence rather than guessed.

After this first lifecycle, remaining distinct evidence lanes are still expected to include Remote Joining-specific negative authorization/revoked-device acceptance, two-device/two-network reconnect/adverse-network behavior, remaining identity/auth/trust gaps, and final stable real-device release acceptance.