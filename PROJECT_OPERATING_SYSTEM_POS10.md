# Career Mode Showdown POS10

filingVersion: v1.0.0
Artifact role: process authority

POS10 is the sole active project operating system. The current-file index is `POS10_CURRENT_FILE_INDEX.json`. Explicit current owner instructions and verified live source/provider facts outrank recorded checkpoints. Historical artifacts are inert provenance, excluded from normal startup and execution. Do not introduce another operating-system identity.

## Startup and live authority

Read the current index, its one active successor and recovery manifest, this authority, `CURRENT_PRODUCT_GUARDS.json`, `NEXT_TASK.md`, and the SSJR/MDP ledgers. Resolve live main, open PRs, the candidate branch/head and its one recovery branch/head. Read the exact candidate's checks and reviews/comments/threads. Resolve deployment/runtime/provider authority when the current task needs it. Never infer current authority from the newest-looking filename or combine checks across heads.

If the recovery branch is ahead, resume from it. If candidate or main moved unexpectedly, compare and reconcile before mutation. Historical context is loaded only to resolve a concrete provenance question.

## Continuous recovery

The only recovery-readiness values are `RECOVERY_READY`, `RECOVERY_STALE` and `RECOVERY_BLOCKED`.

`RECOVERY_READY` means a durable current successor accurately identifies the last safe checkpoint and exact next action. Substantive work may continue only after required live authority is resolved as well.

`RECOVERY_STALE` means source or durable transaction facts changed. Refresh before widening work. `RECOVERY_BLOCKED` means required live authority or a safe successor cannot be established. Preserve the checkpoint and transition without further substantive mutation.

There is exactly one active Atomic Work Unit, at most one small unpublished mutation packet and exactly one recovery branch per candidate. Before starting a packet, record its exact next action in the durable successor. After changing durable source, refresh the manifest and successor in the same checkpoint commit. An interrupted packet may be repeated from that checkpoint without reconstructing the conversation.

Filing uses semantic versions. Generated manifest and transfer filenames include their filing version, UTC date and deterministic sequence. Generated artifacts are immutable. Write both new artifacts, atomically activate their current index, and checkpoint the complete packet in one Git commit. Older artifacts become historical with explicit supersession links. The index may never activate two successors.

Source freshness is content-based, including source paths, file kind/mode and bytes. Generated packet files and the index are excluded from this digest to avoid self-referential commit hashes; their own hashes, schema and generated text are verified separately. Recorded Git heads explicitly describe observations before generation. The current packet does not claim to know its future commit SHA. At startup independently resolve live refs, compare transaction expectations and verify the live recovery source fingerprint.

Recovery data is strictly bounded and schema-checked. Reject unrecognized fields, private identifiers, authentication/capability material, email addresses and save payloads, including nested fields and private strings hidden in free text. Recovery contains public repository refs, summaries and exact next actions only.

## Commands

`npm run work:successor -- INTENT.json` creates a new versioned packet and atomically advances the index. The input schema is enforced by `scripts/pos10-recovery.mjs`; the current recovery manifest supplies the relevant public intent fields.

`npm run work:successor:check` verifies local source and packet freshness. It cannot establish live authority or independently authorize continuation.

`npm run work:recovery -- LIVE_STATE.json` combines verified live transaction inputs with computed local package freshness. Unknown input fields fail closed. Real owner/platform warnings, owner-requested transfer and severe observable context degradation require transfer. Account or usage guesses do not belong in the state schema. No message, tool, elapsed-time or hidden-capacity predictor exists.

`npm run work:route -- --files-file CHANGED_PATHS.txt --json` selects affected product invariants, transitive consumers, deterministic tests and exact heavy proof IDs. `--force-full` requires the complete seal.

`npm run test:contracts` runs the complete deterministic product registry. `npm run test:ops` owns all process/recovery/filing/routing assertions. `npm run work:proofs -- --proofs IDS --group GROUP` executes the selected heavy proofs. `npm run work:publication -- EVIDENCE.json` checks a concrete promotion or merge request against current exact-head evidence. `npm run work:response:check -- RESPONSE.txt` validates the final response contract.

## Validation and correction

`POS10_IMPACT_GRAPH.json` gives each deterministic product contract one invariant owner, maps artifacts to invariants, expands all transitive consumers and names the exact heavy proof IDs. Product coverage, privacy, storage, provider, recovery, UI/UX, evidence validity and release behavior may not be weakened for convenience.

Unknown executable risk and changes to workflow, dependencies, product guards, test manifest, service worker, router or proof authority require `FULL_SEAL`. Pure process changes run operations proof; mixed changes retain operations proof alongside product risk. Product assertions remain independent from process identity or historical wording. Preserved inline product proof sources remain byte-hash checked.

One automatic PR orchestrator, `.github/workflows/validate-pos10.yml`, owns the selected seal. Every job checks out the same exact head. Every selected lane must pass; a skipped required lane fails the summary. Main-push validation retains the complete seal and deployed release checks. Recovery checkpoint pushes have no PR and do not launch candidate validation.

Collect the coherent selected failure set before editing. Inspect only failures belonging to the current exact candidate. Reproduce real defects before changing product gates. An unreproduced infrastructure failure is not justification for weakening a test. Apply one bounded correction packet on recovery, refresh its successor and prove it before another coherent promotion. Never mutate a candidate while its validation is pending.

## Publication and merge

Before promotion independently re-resolve candidate/recovery refs, ensure the recovery line descends from the expected unchanged candidate and confirm a clean, coherent, durable unit with green targeted validation belonging to the exact recovery head. Promote once with a non-forced ref update. Do not put a PR on the recovery branch. An unexpected head movement requires reconciliation, never a forced overwrite.

The candidate's required selected checks must all be green on that one head. Re-fetch reviews, comments and unresolved threads immediately before merge. A change request or unresolved material concern blocks merge until resolved. Use the live exact candidate SHA as the merge API's `expected_head_sha`; the API must reject a changed head.

After merge independently resolve main and verify that POS10 is the only active process authority. Verify deployed/runtime/provider boundaries for release-changing work. Refresh the successor from that merged boundary on the existing recovery branch, without creating another candidate or a process-only follow-up PR. Live recovery refs remain the durable locator. Source validation results are never transferred to a different candidate head.

## Permanent locks and product exit

`CURRENT_PRODUCT_GUARDS.json` owns the preserved product and infrastructure invariants. Billing is permanently OFF; Firebase Spark only; no Blaze, Cloud Billing linkage, Cloud Run or Cloud Functions. App Check enforcement OFF; memory-only Firestore; Google Auth popup-only `browserSessionPersistence`, with no extra scopes.

Exactly two private managers. Connected Rivalry pairing and exact ACTIVE precede league/club authority. Candidate C is the sole destructive remote-to-local gameplay Apply authority, with transaction-owned exact rollback. Canonical local storage is exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

POS10 earns zero SSJR and zero MDP credit. Completion requires one active authority, tested recovery/filing/routing/publication controls, exact-head green CI, protected merge, independently resolved main and refreshed recovery. Immediately after that boundary, stop process work and resume production two-account Shared Setup evidence and the next unfinished Shared Showdown Journey capability. Automate safe denial/adverse observations; request physical interaction only when it cannot be replaced.

## Finished response

Report recovery readiness, authoritative SSJR and MDP scores, one concrete lane, completed dependency, next unlock and exact blocker. `POS10_RETIRED_CONCEPTS.json` supplies rejection data for obsolete fields. Every finished development response ends with exactly one line `Decision: CONTINUE` or `Decision: TRANSITION`. Continuing requires ready recovery, available live authority and a safe exact next action; otherwise transition from the durable checkpoint.

Decision: CONTINUE
