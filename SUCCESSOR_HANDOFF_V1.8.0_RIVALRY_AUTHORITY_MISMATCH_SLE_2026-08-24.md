# FIFA 17 Career Mode Showdown — SLE Successor Handoff — v1.8.0 Rivalry Authority Mismatch

Recorded: 2026-08-24 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Transition branch: `agent/v180-owner-reconciliation-proof`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
SLE = Smart Lean Efficient.

## 1. Mission and stop boundary

Repair the now-proven browser-pointer mismatch between the authoritative Gop/Nik iPhone rivalry at revision 1 and Player Two / Gop's newly reconnected empty rivalry. Do not create revision 0 or mutate either local Save or shared gameplay. Reattach only Gop's browser-local pointer to Nik's exact existing rivalry through the guarded entitlement check, then verify revision 1 read-only.

This handoff closes only the safe evidence-capture environment. It does not close the v1.8.0 owner Apply proof, increase RJR or authorize Stage 5.

## 2. Exact repository and deployment authority

- Verified live main: `87c57b3f918520b93feeefc189802dc65aa96257`, PR #137 documentation/SLE closeout merge.
- Runtime authority: PR #136 exact head `4f8393c7c1e1284ff1b0290d07b7e61deb12c784`, merge `1d9793412a712e931b516be8ca853df4e95b5b50`.
- Public runtime: `v1.8.0 / 1.8.0-r1`; Pages run `32763563751`; 89 runtime files byte-exact to the merge.
- All 14 PR #136 and PR #137 exact-head workflow families passed; reviews and inline threads were empty.
- Immediate known-good whole-shell recovery remains `v1.7.0-r2`.
- Firestore Rules remain exact blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`; do not republish unchanged Rules.
- RJR authority is `REMOTE_JOINING_READINESS.json`, fixed `RJR-1 = 77/100`.

## 3. Prior production authority that must not be erased

`PRODUCTION_STAGE4_CONNECTED_RIVALRY_PROOF_2026-08-24.md` records the second independent iPhone rivalry:

1. Player Two / Gop published revision 0.
2. Player One / Nik received a stale-base rejection, refreshed to revision 0 and then published exactly once.
3. Authoritative state advanced monotonically to revision 1.
4. Player Two / Gop refreshed and observed revision 1 without local Apply or reported local-save overwrite.

This proof is redacted and does not store a complete private capability. It remains genuine capability evidence unless a later investigation establishes a specific correction. Do not rewrite it merely because the current pointer is empty.

## 4. New owner-controlled evidence

The owner reported that an app update required Safari sign-in again and that the sessions/rivalry were reconnected. The refreshed surfaces therefore cannot be treated as untouched earlier sessions.

At 16:31 ET, Safari screenshots showed:

- Connected Rivalry attached privately to a redacted `pair_58a99c…8544e` pointer;
- selected `PLAYER TWO · GOP`;
- `LOCAL TARGET: Player Two · save_97c6e0…3ceca`;
- `LOCAL COMMIT: Not applied this session`;
- Preview disabled and a status that local saves were not changed.

At 16:38 ET the owner pressed `REFRESH SHARED STATE` exactly once. The result showed:

- `REMOTE OBSERVED: Not published`;
- `No authoritative shared state exists yet. The first publish will create revision 0.`;
- the same local target and uncommitted local state;
- Preview still disabled;
- no Publish, Verify/Reattach, Preview or Apply action.

A separate Private Pairing view showed this Safari browser registered as redacted device `device_f70…ec1b` and its currently displayed new-pairing selector as `PLAYER ONE · HIO`. Treat this as a diagnostic clue only. It does not prove HIO is the attached Connected Rivalry counterpart because that control may be a separate local candidate selector.

At 17:52 ET comparison screenshots resolved the contradiction:

- Player One / Nik is attached to `pair_a07108…756fb` and reads authoritative revision 1.
- Player Two / Gop is attached to a different rivalry beginning `pair_d1db8e…` and reads no authoritative state.
- Their messages differ because the app correctly reads two different Firestore rivalry document paths.
- The prior revision-1 data was not lost and no source/runtime defect is demonstrated.

Focused `stage4-connected-rivalry` and `stage4-remote-local-reconciliation` contracts pass. Source confirms `VERIFY / REATTACH` performs a Firestore transaction that verifies the signed-in account, active registered device, exact Player Two role, exact profile and exact Save against the destination rivalry before it replaces only the browser-local IndexedDB pointer keyed by account/save/role. It does not publish gameplay or mutate Save Library.

## 5. Exact classification

Root cause is proven: the refreshed Player Two / Gop surface points to a different/new empty rivalry than Player One / Nik. The different UI messages are correct for those different rivalry IDs. This is a reconnection/pointer selection error, not evidence of Firebase data loss, a false prior proof or Save Library corruption.

The immediate repair does not require a runtime code change. Do not publish revision 0 on the empty Gop rivalry. Copy Nik's exact existing rivalry code and use Gop's guarded `VERIFY / REATTACH` path. A future UX hardening candidate may make cross-surface fingerprints harder to confuse, but that is not allowed to delay the direct repair or expand into public rivalry discovery.

## 6. IMMEDIATE NEXT TASK AFTER FULL STUDY

Bootstrap and verify:

1. Fetch live `main`, the public transition branch and current WEC. Verify main remains `87c57b3f918520b93feeefc189802dc65aa96257`, public runtime remains `1.8.0-r1`, Rules remain unchanged and RJR remains 77.
2. Validate/archive closing WEC `we-2026-08-24-v180-owner-reconciliation-proof`, create a fresh unique WEC with reset counters and assess it. Never inherit its `HANDOFF_AT_CHECKPOINT` decision or counters.
3. Load this handoff, `PRODUCTION_STAGE4_CONNECTED_RIVALRY_PROOF_2026-08-24.md`, `js/sparkConnectedRivalry.js`, `js/sparkPrivatePairing.js`, `firestore.spark.rules` and only the focused Stage 4 contracts needed to understand pointer keys and read paths.

Execute only the non-mutating mismatch investigation:

1. On the Player One / Nik surface, tap the existing rivalry-code input, Select All and Copy. Do not press any action. The redacted fingerprint must remain `pair_a07108…756fb` with revision 1.
2. On Player Two / Gop, tap the rivalry-code input, Select All and replace the entire `pair_d1db8e…` value with Nik's copied code. Keep `PLAYER TWO · GOP` selected.
3. Press `VERIFY / REATTACH` exactly once. If the guarded entitlement check reports any error, stop and capture it; do not retry with another code or create/join pairing.
4. After the attached-success message, press `REFRESH SHARED STATE` exactly once. Require the `RIVALRY` fingerprint to match Nik's `pair_a07108…756fb`, `REMOTE OBSERVED: Revision 1`, the unchanged Player Two local target and `LOCAL COMMIT: Not applied this session`.
5. Capture that repaired baseline and stop. Do not press Publish or Preview yet.
6. Only after the repaired revision-1 baseline is accepted may the original sequence resume: non-mutating Preview, deliberate stale-preview rejection, refreshed exact backup-and-Apply, identity/unrelated-Save preservation, observed/committed convergence and no remote mutation from local Apply.

Success means Gop's pointer is safely reattached to Nik's exact revision-1 rivalry, both surfaces show the same redacted fingerprint, and no unrelated revision 0 or local Save mutation occurs.

## 7. Permanent locks

- Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.
- Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive local Apply authority.
- Exactly two private managers; no rivalry listing or public discovery.
- Firebase Spark / zero billing; no Functions or Storage initialization.
- App Check enforcement remains OFF. Firestore remains memory-only.
- Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.
- No public community, matchmaking, invitation directory, rankings or global leaderboard.
- Stage 5 session documents, host/join orchestration, presence and lobbies remain locked.
- Do not retry headless App Check, add a debug provider, change provider configuration or republish unchanged Rules.

## 8. WEC, publication and SLE

Closing environment: `we-2026-08-24-v180-owner-reconciliation-proof`.
Closing decision: `HANDOFF_AT_CHECKPOINT`; usage was unavailable and never estimated. This decision belongs only to the closing environment.

Standing owner authorization permits merge and deploy after all required tests and exact publication gates pass. Do not ask for repeated authorization. No runtime, Rules, provider or product byte change is included in this evidence handoff.

SLE = Smart Lean Efficient remains recursive. A future `Handoff proximity: 100%` or transition decision requires a new versioned starter, complete root/project handoff mirrors, refreshed capsule/context pointers, sealed WEC and a clean stop.

## 9. Mandatory owner reporting

Every substantive owner-facing development response must end with exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At 100%, complete the next Smart Lean Efficient package and stop before another substantial milestone.
