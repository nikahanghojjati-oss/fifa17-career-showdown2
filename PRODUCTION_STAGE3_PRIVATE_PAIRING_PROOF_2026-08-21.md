# Production Stage 3 Registered Devices / Private Pairing Proof — 2026-08-21 ET

## Verdict

Stage 3 Registered Devices / Private Pairing is production-proven at application `v1.6.0`, runtime `1.6.0-r1`, on the Firebase Spark / zero-billing architecture.

Runtime merge boundary: PR #129 squash merge `5d254cea6e4deebd2aac79effeda30dcc3048385`.
Exact source-seal PR head before merge: `e3f462306e1d2b0822aaf54eb1f9dc9af62ed4f8`.
Exact reviewed Stage 3 Rules blob: `bf307c52262faf81a484e33cde272ac831fe60f0`.

## Provider publication proof

Owner-supplied Firebase Console screenshots show project `fifa17-career-showdown-prod`, Firestore `(default)`, Rules, with a new published version at 2026-08-21 8:11 PM ET. Across the screenshots the visible source covers the sealed Stage 3 boundary: authenticated self-device create/revoke, `device_[0-9a-f]{32}` and `installation_[0-9a-f]{32}` identity shapes, `profile_` / `save_` manager binding, `pair_[0-9a-f]{64}` capability semantics, atomic rivalry/invite creation and redeem, shared authoritative-state/session write denial, and final catch-all denial.

The screenshots are strong provider publication evidence. They are not represented as a byte-for-byte cryptographic comparison of every editor character.

## Production deployment proof

Owner-supplied live-site screenshots from the public GitHub Pages application show:

- footer `v1.6.0 · Stable`;
- Settings application version `v1.6.0`;
- Settings build `1.6.0-r1`;
- `CONNECTED ACCOUNT` reports `Private account ready`;
- `REGISTERED DEVICE & PAIRING` is rendered;
- Firebase Spark / no billing is visible;
- gameplay synchronization remains explicitly locked until Connected Rivalry.

## Production registered-device and pairing proof

The screenshots show two distinct authenticated accounts operating in separate normal/incognito browser storage contexts with different registered `device_...` identifiers. In this architecture a device identity is a private browser installation identity stored in IndexedDB, not a hardware fingerprint. Therefore this proves two independent production registered-device identities, while it does **not** claim two separate physical machines.

Observed production behavior:

1. first authenticated browser identity reaches `Private account ready` and `Registered · device_...`;
2. a stable local manager binding is selectable;
3. `CREATE PAIRING CODE` produces a real `pair_` capability and reports one-use / 15-minute behavior;
4. a second authenticated browser identity reaches its own `Private account ready` and a different registered `device_...` identity;
5. an attempted join with the wrong local manager slot is rejected with the explicit instruction to choose the required player slot, and the UI states local saves were not changed;
6. after selecting the required local manager identity, the second account successfully redeems the pairing and the UI reports `Private managers are paired`;
7. the paired-state UI explicitly keeps shared gameplay and Remote Joining locked until Connected Rivalry.

## What remains uncredited

Production screenshots do not independently prove the following negative paths, although the sealed Stage 3 emulator/contracts prove them in source: replay after redemption, third-account denial, production device revocation, expired-capability denial, and terminal-invite privacy. These remain candidates for later hardening evidence rather than being overstated here.

No Connected Rivalry shared authoritative gameplay synchronization is proven. No Remote Joining session is proven. No second-physical-machine hardening claim is made.

## Security / product locks preserved

- App Check enforcement remains OFF.
- Firestore persistence remains memory-only.
- Google authentication remains popup + `browserSessionPersistence` with zero extra OAuth scopes.
- Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.
- Stage 3 private device identity remains IndexedDB-only and is not gameplay/save authority.
- No Blaze, Cloud Run, Cloud Functions, Firebase Storage or billing account is authorized.
- No public discovery, public matchmaking, public invite directory, community system, leaderboard or ranking is authorized.
- Exactly two managers remain the product rule.

## RJR-1 effect

This proof moves the fixed-model `devices-pairing-connected-rivalry-remote-join` domain from `4/30` to `10/30`, a conservative `+6` capability delta:

- `+2` production registered-device identity capability across two distinct authenticated browser device identities;
- `+3` production private capability creation + successful cross-account redemption into the second manager slot;
- `+1` production wrong-slot rejection with local-save preservation.

No points are awarded for CI/documentation alone, physical-device hardening not shown here, replay/third-account/revocation negative paths only proven in emulator, Connected Rivalry, shared gameplay synchronization or actual Remote Joining.

RJR-1 therefore advances from `63/100` to `69/100`.
