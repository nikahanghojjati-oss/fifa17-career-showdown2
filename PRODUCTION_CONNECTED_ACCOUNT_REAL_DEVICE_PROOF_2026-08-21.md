# Production Connected Account real-device proof — 2026-08-21

Status: VERIFIED PRODUCTION CAPABILITY EVIDENCE / EXACT INSTALLED RUNTIME CONFIRMED

## Observed production evidence

Owner-supplied iPhone production screenshots at approximately 17:07–17:25 ET show the public Career Mode Showdown Settings surface with:

- the `CONNECTED ACCOUNT` panel rendered inside Save Library & Settings;
- `Firebase Spark · no billing` infrastructure text;
- a production Google `Sign in with Google` consent page for the Firebase production auth domain;
- successful return to the application after Google sign-in;
- `STATUS` = `Private account ready`;
- an authenticated account label and shortened Firebase account ID;
- `REMOTE JOINING` still explicitly `Locked · prerequisites still in progress`;
- the local-first product message preserved;
- `APPLICATION VERSION` = `v1.5.0`; and
- `BUILD` = `1.5.0-r2` in the same live Settings surface while the private account remains ready.

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

The later 17:25 ET screenshot additionally proves that those capabilities are running on the exact installed production shell `v1.5.0 / 1.5.0-r2`, closing the prior runtime-revision uncertainty without awarding an additional RJR point merely for build identity.

It does not prove registered-device lifecycle, pairing, Connected Rivalry, Remote Joining, App Check enforcement, trusted-runtime IAM activation, or any downstream shared mutation authority.

## Exact runtime proof

Direct visual production evidence now confirms:

- application version: `v1.5.0`;
- installed build: `1.5.0-r2`;
- Connected Account state on that build: `Private account ready`.

This closes the production Connected Account activation/hotfix proof boundary. No further Firebase Rules replacement, provider reconfiguration, reinstall, repeated sign-in, or owner console action is required for this milestone.

## RJR-1 effect

Remote Joining readiness moves conservatively from `61/100` to `63/100`:

- `+1` Identity / authentication / trust: real production Google sign-in proven.
- `+1` Production cloud / security activation: real production strict self-account bootstrap proven.

The exact `1.5.0-r2` build confirmation seals the evidence for those capabilities but does not add a third point by itself.

No process-only, PR-count, CI-count, documentation, pairing, Connected Rivalry or Remote Joining points are awarded.
