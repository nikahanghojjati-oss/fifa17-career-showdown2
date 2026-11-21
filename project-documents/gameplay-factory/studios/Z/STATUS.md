# Studio Z status

Branch `studio-z/r63`, PR #427 to main (release r63). All jobs built and proven on the emulators; waiting for the
main merge by the Team G lead, then the Pages, Rules and deployed-site checks.

| Job | State |
|---|---|
| Z1 sign-in starter race | done, in PR #427 |
| Z2 one-strike offline lock | done, in PR #427 |
| Z3 refresh resume | done, in PR #427 |
| Z4 automatic session handoff | done, in PR #427 (new Rules pointer, Nik approved 2026-10-09 01:29 UTC) |
| Z5 auto-apply updates | done, in PR #427 |
| Z6 stuck Google sign-in | done, in PR #427 |
| Z7 upright tablet layout | done, in PR #427 (Team V ticket: real tablet and sideways-phone art) |
| Z8 typed league ambiguity | done, in PR #427 |

Proof (local, 2026-10-09): contracts 144/144, ops 73/73, two-player emulator journey 38/38 (J9.1 refresh rejoin,
J9.4 reopened tab, J12.2 pointer permissions), refresh probes mid-setup and mid-transfer, layout probes on emulated
touch devices 360x640 to 1024x1366 and 915x412. No physical acceptance claimed.

## Archived 2026-10-09

r63 is live: PR #427 merged as main 2b8b043f; Deploy GitHub Pages and Deploy Firebase Firestore Rules both succeeded
for that commit. Z1-Z8 are done. Studio Z is archived (never deleted). Follow-ups go through the Team G factory:
the garbled Z7 line in RELEASE_V1.9.1_R63.md, and the Team V ticket for tablet art and the sideways-phone Signing Entry
note overlapping LOCK. Physical acceptance is still Nik and Daniel's next test; no SSJR credit is claimed.
