# Production Connected Account real-device proof — 2026-08-21

Status: VERIFIED CAPABILITY EVIDENCE / EXACT RUNTIME REVISION STILL REQUIRES DIRECT BUILD-LINE CONFIRMATION

## Observed production evidence

Owner-supplied iPhone installed-app screenshots at approximately 17:07–17:09 ET show the public Career Mode Showdown Settings surface on the production application with:

- the `CONNECTED ACCOUNT` panel rendered inside Save Library & Settings;
- `Firebase Spark · no billing` infrastructure text;
- a production Google `Sign in with Google` consent page for the Firebase production auth domain;
- successful return to the application after Google sign-in;
- `STATUS` = `Private account ready`;
- an authenticated account label and shortened Firebase account ID;
- `REMOTE JOINING` still explicitly `Locked · prerequisites still in progress`;
- the local-first product message preserved.

No email address, full Firebase UID or other owner identity value is reproduced in this repository evidence record.

## Source-grounded interpretation

`js/sparkConnectedAccount.js` reaches the `Private account ready` state only after:

1. Firebase Authentication returns a real signed-in user with a non-empty Firebase `uid`;
2. the Spark self-account bootstrap runs against Firestore;
3. the bootstrap returns `ok: true`;
4. the returned account status is `active`.

Therefore this evidence materially proves two previously uncredited production capabilities:

- the real Google popup authentication path completes on the installed production application; and
- the bounded production Firebase UID self-account bootstrap succeeds through the lazy Auth + memory-only Firestore path and the strict revision-0 account-create boundary.

It does not prove registered-device lifecycle, pairing, Connected Rivalry, Remote Joining, App Check enforcement, trusted-runtime IAM activation, or any downstream shared mutation authority.

## Runtime-revision caution

The submitted screenshots do not visibly expose the complete `BUILD` row. The repository `main` source after PR #126 is `v1.5.0 / 1.5.0-r2`, and the Connected Account mount-race regression is fixed there, but this evidence record deliberately does not claim direct visual proof of the exact installed runtime revision until the application Build line is observed.

## RJR-1 effect

Remote Joining readiness moves conservatively from `61/100` to `63/100`:

- `+1` Identity / authentication / trust: real production Google sign-in proven.
- `+1` Production cloud / security activation: real production strict self-account bootstrap proven.

No process-only, PR-count, CI-count, documentation, pairing, Connected Rivalry or Remote Joining points are awarded.
