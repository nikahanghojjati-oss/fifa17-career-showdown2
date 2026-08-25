# SUCCESSOR HANDOFF — post-PR #144 r2 rivalry recovery owner proof — 2026-08-25

SLE = Smart Lean Efficient. This is the deep fallback handoff for the next work environment. The compact starter is `START_NEXT_SESSION_V1.4.17_R2_RIVALRY_RECOVERY_OWNER_PROOF.md`.

## 1. Authority and live-first rule

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat this handoff as orientation only. Before product work, independently fetch live `main`, PR #144, current production deployment, `SESSION_BOOTSTRAP.json`, `WORK_ENVIRONMENT_STATUS.json`, `REMOTE_JOINING_READINESS.json`, and the relevant source. Current source/live GitHub wins over this document on any contradiction. Do not inherit the predecessor WEC decision.

## 2. Exact completed publication boundary

PR #144 `Runtime r2: make Connected Rivalry IDs recoverable on mobile` final human-authored head `bc93407decbc5b8300013f1e23b558d686174566` passed all 14 permanent exact-head workflow families: V1 Visual Immersion, League Confirmation, Statistics, Home Bootstrap, Season Review, Final Polish, Transfer, Settings, Candidate B, Licensed Football Visuals, Static App, Stage 3 Private Pairing, Candidate C Atomic Restore, and Stability. PR mergeability was clean.

The two real review findings were both corrected and resolved before publication:

- Copy fallback: the editable reattach field is not a copy authority. Primary copy writes `crState.rivalryId`; fallback creates a temporary textarea with `fallbackCopy.value=rivalryId` and selects exactly `0..rivalryId.length`; if programmatic copy is unavailable, the complete visible `rivalryIdText` node is selected. Visual wrapping never inserts or removes ID characters.
- Skipped-r1 rollback: r2 prefers verified `1.8.1-r1` when installed; if a client skipped r1, it retains the highest verified installed older shell. Activation preserves that recovery cache, rollback writes its exact revision, and retained versioned assets are served only from their matching cache rather than mixed current-network bytes.

Standing authorization was then used for expected-head squash merge. Live runtime main is `f3d26f5f9b8cee8996ecff296d6ca9bcc2c3fb18` with tree `e0ddc2e360a345705957bb535fd57fbfec3843a3`. GitHub Pages run `32863192183` completed successfully. Its uploaded Pages artifact `9569006078` / `sha256:5f00a4e07cd803d2e16b1d59d3cd46063923e96e53bd388469b1e8c0996409f0` was independently opened in this environment. Targeted artifact inspection proved:

- `index.html` app asset revision `1.8.1-r2`;
- footer `Career Mode Showdown v1.8.1 · Connected Rivalry`;
- Service Worker `RUNTIME_REVISION = 1.8.1-r2`, `PREVIOUS_RUNTIME_REVISION = 1.8.1-r1`;
- `findRecoveryRuntime`, recovery-cache preservation and `writeForcedRevision(recovery.revision)` are present;
- `navigator.clipboard.writeText(rivalryId)`, `fallbackCopy.value=rivalryId`, `fallbackCopy.setSelectionRange(0,rivalryId.length)`, and `range.selectNodeContents(rivalryIdText)` are present;
- the superseded `code.setSelectionRange(0,code.value.length)` copy path is absent.

A direct web fetch from this tool environment returned a cache-miss routing error, so do not misstate that as product failure or as a second live-host byte comparison. The successful exact-main Pages deployment plus its generated deployment artifact are the production proof available to this predecessor. Successor should independently reverify live production.

## 3. Durable rivalry ID decision — CLOSED

The idea of shortening the durable rivalry ID is fully abandoned for this project lane. Do not revive it as a migration, alias authority, alternate attachment key or protocol change. The exact durable value remains `pair_` plus 64 lowercase hexadecimal characters (256 random bits). It is already coupled to pairing capability format, Firestore rivalry/invite identity, local Connected Rivalry pointer identity, authorization-contract keys, shared-state paths and prior production evidence.

Short fingerprints may remain display-only for recognition. Recovery and attachment always use the full exact durable value. The r2 UX exists specifically so the long value is painless: fully visible/wrapped, selectable and explicitly copyable.

## 4. Product state entering successor

Player One / Nik previously retained the original existing Connected Rivalry pointer. Player Two / Gop was signed in but showed `Not attached`; prior iPhone evidence exposed the placeholder-only ID display defect. Do not synthesize a new rivalry to recover from that UI defect. The correct recovery is to copy Nik's surviving exact full existing rivalry ID and attach Gop to that same existing rivalry once.

The previously planned unavailable-code acceptance check was never consumed in this environment. Exact fixture remains:

`pair_0000000000000000000000000000000000000000000000000000000000000000`

Do not enter it until the existing Gop pointer is recovered and a fresh valid before-state is captured. When eventually used, it is one-shot: select `PLAYER TWO · GOP`, submit once, require privacy-safe unavailable/expired/used guidance, preserve Player Two and prove zero local/remote mutation. No retry.

## 5. IMMEDIATE NEXT TASK AFTER FULL STUDY

Perform the owner-device existing-rivalry recovery proof, not another infrastructure lane.

- Verify live main `f3d26f5f9b8cee8996ecff296d6ca9bcc2c3fb18`, production r2, RJR 78 and unchanged security/provider locks.
- Start a fresh WEC with reset counters and current usage only if explicitly observable; otherwise usage remains null/unavailable.
- Nik side before-state: signed-in existing context, complete saved rivalry ID visibly wrapping and selectable, copy button present, local target Player One/Nik and existing rivalry revision/state visible enough to compare.
- Press `COPY RIVALRY ID`; the source implementation guarantees the full immutable value is copied, not the wrapped text layout or editable field. The owner should not manually retype the ID.
- Gop side before-state: signed in, `PLAYER TWO · GOP` selected, currently not attached or current pointer documented.
- Paste the exact copied value and invoke only the existing-rivalry Attach action once.
- PASS: Gop attaches to the same existing rivalry and reads its expected revision/authority while manager identity and local Save remain intact.
- FAIL: raw permission leakage, Player One reset, new rivalry creation, unexpected revision reset, local Save overwrite, different rivalry identity, or any unrelated state mutation. Preserve evidence and investigate; do not improvise a new pairing.
- Do not Publish, Preview or Apply during recovery.
- After recovery closes, separately resume the one-shot unavailable-code check; after that, reassess WEC before Candidate C owner reconciliation.

## 6. RJR authority

`REMOTE_JOINING_READINESS.json` is authoritative. Official Remote Joining readiness is `78/100` under RJR-1. Source work, PRs, CI, release packaging, WEC/SLE work and this copy/display UX earn zero readiness points. Only genuine fixed-model capability evidence may move the score. The prior score-provenance audit remains closed.

## 7. Security/data locks

Firebase remains Spark / zero billing. App Check enforcement remains OFF. Firestore client persistence remains memory-only. Google auth remains popup-only `browserSessionPersistence` with no extra scopes. Firestore Rules were not changed by PR #144 and must not be republished without a reviewed Rules change or concrete regression requiring it.

Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is not canonical. Candidate A is non-mutating export, Candidate B read-only import analysis, Candidate C sole destructive import/remote-to-local Apply authority. Exactly two private managers. No public discovery/community/matchmaking/rankings/global leaderboards. Stage 5 remains locked.

## 8. Standing merge/deploy authorization

The owner's standing authorization remains effective through completion of the full project. Once a future PR passes its required tests/gates, reviews/threads and mergeability checks, merge and deploy without asking the owner to repeat approval. A later explicit owner instruction may revoke or narrow that authority.

## 9. WEC boundary

Predecessor environment: `we-2026-08-25-player-two-owner-device-proof-live`. Its deterministic reassessment reached `HANDOFF_AT_CHECKPOINT` before PR #144 publication. This package is prepared only after completing that publication/deployment checkpoint. The final branch mutation is the 100% WEC seal; successor must archive predecessor facts, create a unique fresh WEC and make its own transition decision.

## 10. Mandatory owner-facing progress footer

Every substantive project response must end with exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
