# SOL RECONCILIATION — CP1 BRIEF R4

Date: 2026-09-27  
Coordinator: GPT-5.6 Sol  
Production anchor: main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962  
Visual intake head: 8b320e3cc911d96247aa5696660fb90a5ae6591c  
SOURCE_DRIFT: NO

## Verdict

CP1 is product-truth signed for a bounded static prototype build.

The brief remains presentation-only and fixture-driven. It does not modify production authority, provider state, privacy rules, timers, scoring, transfer logic, or production files.

## Decision table

| ID | Sol decision | Coordinator note |
| --- | --- | --- |
| CP1-M1 | ACCEPT | Sign brief, commit it, create the dedicated Cloud branch, and route CP1. TARGET_BRANCH_BASE is resolved with the staged base procedure below because a Git commit cannot contain its own SHA. |
| CP1-M2 | ACCEPT | Alpha remap and despeckle may apply to derived copies of all four poses. Golden source binaries remain untouched. |
| CP1-PT1 | ACCEPT | Status line and phase intro may move into the phase-panel header in the prototype. Copy stays verbatim; authority/visibility does not change. |
| CP1-PT2 | ACCEPT | Guess frames contain no timer digits and use `WINDOW CLOSED`. This matches the V10 product-truth boundary: no active 15-minute timer is exposed in Guess Entry. |
| CP1-PT3 | ACCEPT | F3 eyeline composition is a privacy-preserving presentation constraint only. |
| CP1-R1 | ACCEPT | Hanging-sign lift remains deferred to CP2. |
| CP1-R2 | ACCEPT | Signature-name lockups remain deferred to CP2. |
| CP1-R3 | ACCEPT | Build with the non-denoised Nik Window intake; prepare a non-shipping denoise candidate for producer review only. |
| CP1-R4 | ACCEPT | Use Juventus / Borussia Dortmund as explicit fixture data for CP1. No claim that they are live showdown clubs. |
| CP1-R5 | DEFER | Missing VPP/V1.1 history documents are non-blocking hygiene. Do not expand CP1 scope to fix them. |
| CP1-R6 | RECORD | Window poses will become public if Cloud commits the uploaded originals to this public repository. Surface this to Nik before the Cloud run. RP-01 remains unchanged. |
| CP1-N1 | RECORD | Nik keeps Daniel's challenging Window expression. |
| CP1-M3 | ACCEPT | Routing V2.1 work split is committed to the studio routing document. |
| CP1-A1 | RECORD | Expected asset zip fingerprint: `1e38367cfc4a170b47ae133bd7aa838b4b1b3b061703d70ec7fe8b5a059b2454`. Cloud must re-verify the five individual source hashes and fail closed on mismatch. |

## Production-truth verification

Checked against `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962` and the V10 Transfer Guess product-truth card.

Confirmed for the CP1 states:

- phase order remains Window → Guess Entry → Signing Entry → Completed/Verdicts;
- Window live copy and `REQUEST EARLY END` match production;
- Guess Entry keeps only the viewer's private editable guess surface in the prototype;
- Guess action is `LOCK MY GUESSES`;
- exact Guess intro/status/heading/privacy/helper strings in Appendix D match the anchored production strings;
- no active timer is presented in Guess Entry;
- Daniel remains Manager 1 / left and Nik Manager 2 / right;
- no rival progress, rival lock count, or opponent payload is introduced;
- CP1 makes no network calls and does not import or mutate production code.

## TARGET_BRANCH_BASE resolution

The producer brief asks its own committed file to contain the SHA of the commit that contains that same file. Git commit IDs hash the tree that contains the file, so a literal self-referential commit SHA cannot be authored in one commit.

Safe deterministic resolution:

1. Commit the signed brief with `TARGET_BRANCH_BASE` marked pending.
2. That commit becomes the immutable branch-creation base and already contains the complete signed brief.
3. Create `claude-cloud/transfer-tr2-slice-01` from that commit.
4. Replace the pending marker in the brief, on both visual and task branches, with the exact branch-creation SHA.
5. Cloud begins only from the task branch after that pointer update.

This changes no visual direction or product truth; it only makes the requested provenance pointer technically representable.

## Scope guard

CP1 stops after the static Checkpoint 1 evidence.

Forbidden in this slice:
- motion;
- transitions;
- Stage Engine;
- production integration;
- PR;
- merge;
- changes to main or production `js/`, `css/`, `index.html`, `data/`, or `assets/`.

## Return path

Cloud result returns to GPT-5.6 Sol first for product-truth and branch-safety checks. If those pass, Nik routes the frozen branch/head to a fresh Claude Project review at Opus 5.5 Extra.
