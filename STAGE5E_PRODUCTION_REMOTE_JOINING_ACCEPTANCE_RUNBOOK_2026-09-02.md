# Stage 5E Production Remote Joining Acceptance Runbook — 2026-09-02

Status: READY FOR OWNER DEVICE EVIDENCE

Working branch: `rjr/stage5e-production-acceptance-2026-09-02`

Starting production main: `5f6941d48e8174ba29a34bbbf4835cf23cfea17d`

Deployed identity independently verified from the exact GitHub Pages artifact: `v1.9.0 / 1.9.0-r1`

Fixed RJR before this evidence: `87/100`

## Purpose

Consume the smallest genuine production-live evidence event that can close the currently uncredited actual Remote Joining capability. This is not a CI or source proof. It must use the deployed GitHub Pages application, two distinct authenticated rivalry accounts, and two real registered browser/device contexts already attached to the same exact paired Connected Rivalry.

First target lifecycle:

`Host -> Join -> Read/Refresh -> Close -> peer Read/Refresh terminal state`

A normal Chrome profile and an Incognito profile on the same physical Chromebook are acceptable for this first production session-lifecycle proof because Stage 3 already established that they are distinct application device identities. They do not satisfy the later separate two-physical-device/two-network hardening gate.

## Permanent safety locks

- Billing is permanently forbidden. Firebase remains Spark.
- Do not enable Blaze, Cloud Billing, Cloud Run, Cloud Functions or any paid/billing-required service.
- Firestore remains memory-only. App Check enforcement remains OFF.
- Do not list or discover sessions. Use only the exact private capability.
- Do not edit, force, delete or destructively test the protected historical rivalry.
- Do not change gameplay data or use Candidate C during this acceptance.
- Do not publish, commit, paste into chat, or otherwise expose the full `session_...` capability. Redact the complete capability line in every screenshot before uploading evidence.

## Preconditions — prove before Host

Use two browser contexts that are already the two managers of the same exact Connected Rivalry.

Player One context must show:

1. production site is `v1.9.0 / 1.9.0-r1`;
2. Connected Account is signed in and ready;
3. current browser is registered;
4. the exact paired Connected Rivalry is attached;
5. the attached rivalry belongs to the current account/device context.

Player Two must independently show the same five facts for the other paired account/device context.

If either context reports Auth, device, rivalry or provider mismatch, stop. Do not repair by deleting the protected rivalry or by changing billing/provider policy.

## Evidence sequence

### Evidence A — Player One precondition

Capture one screenshot showing the current Player One Connected Account / registered device / attached rivalry state. Also capture the `v1.9.0` footer or release identity if it is not visible in the same frame.

### Evidence B — Player Two precondition

Capture the equivalent screenshot from the distinct Player Two authenticated browser context.

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

- deployed fixed identity is `v1.9.0 / 1.9.0-r1`;
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

The deployed protocol result itself includes `hostAccountId` and `memberAccountIds` and validates exactly-two-member active state. The UI intentionally presents the bounded lifecycle state while the exact capability remains page-memory-only.

## RJR rule after evidence

Do not preassign a delta. After the complete production evidence exists, compare it against fixed `REMOTE_JOINING_READINESS.json` domains and credit only genuinely new capabilities. The first successful provider-live Remote Joining lifecycle is expected to move RJR above 87 because actual sessions are explicitly uncredited, but the exact score must be calculated from the evidence rather than guessed.

After this first lifecycle, remaining distinct evidence lanes are still expected to include Remote Joining-specific negative authorization/revoked-device acceptance, two-device/two-network reconnect/adverse-network behavior, remaining identity/auth/trust gaps, and final stable real-device release acceptance.
