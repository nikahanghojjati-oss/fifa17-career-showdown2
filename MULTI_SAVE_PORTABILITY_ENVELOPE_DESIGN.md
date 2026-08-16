# Multi-Save Portability Envelope Design

**Status:** Sealed design decision [2026-08-16]  
**Environment:** we-2026-08-16-multi-save-portability  
**Authority:** Source + this document + multi-save-portability-contracts.cjs. Live main and owner instructions override.

## Problem

Current v1 backup envelope cannot round-trip a complete multi-Save registry:

- `js/storage.js` → `captureCareerModeRawBackupInputs()` returns only `{activeShowdown, legacyShowdowns, preferences}`
- `js/saveLibraryRuntime.js` → `runtimeCreateBackupProjection()` projects only the active Save into the activeShowdown slot
- `js/backup.js` → `CAREER_MODE_BACKUP_FORMAT_VERSION = 1` therefore emits an incomplete payload

Fresh-device import of a multi-Save library therefore collapses or loses identity, profiles, inactive Saves, activeSaveId selection, and unresolved historical roles.

## Design Decision (formatVersion 2)

### Envelope payload requirements

A formatVersion 2 backup envelope **must** serialize:

1. **Full `saveLibrary` registry** (complete canonical library object / raw, including every supported Save, every profile, stable save_* / profile_* IDs, activeSaveId, and all required metadata)
2. **`legacyShowdowns`**
3. **`preferences`**

Optional compatibility aid (never a substitute):

- A projected `activeShowdown` (or equivalent) may be present so that older v1 readers can still obtain a usable single active Save. It must not be treated as the source of truth for the library.

### Destination policy

| Destination state | Behavior |
|---|---|
| **Clean browser** (no existing Career Mode data / empty library) | Full restore of the complete saveLibrary registry + legacy + preferences. Must not collapse to one active Save. |
| **Existing data** | Explicit confirmed replace-all only, under Candidate C ownership, freshness, transaction, rollback, anti-clobber and exact-verification guarantees. No silent overwrite. No automatic merge. No identity-by-name inference. |
| **Corrupt / truncated / unsupported / invalid** | Refuse before any canonical mutation. Deterministic rejection with clear status. |

### Identity preservation invariants (must hold on successful import)

- Same-name distinct profiles remain distinct (e.g. two “Alex” under different profile_* IDs).
- Explicit cross-Save profile reuse is preserved by ID.
- Unresolved historical roles (null managerProfileId) stay unresolved.
- Stable save_* / profile_* / season identities are preserved.
- `activeSaveId` selection is restored exactly.
- Legacy data and preferences survive.

### Compatibility and safety

- Candidate A (analysis / non-mutating path) remains non-mutating.
- Candidate C remains the sole destructive Apply stage; its guarantees are inviolable.
- v1 envelopes remain readable (projected activeShowdown as compatibility aid only).
- No change to gameplay, navigation, recovery, PWA/offline, accessibility, performance or accepted presentation beyond the portability surface.

## Implementation order (smallest path)

1. Update capture / projection / build so the formatVersion 2 envelope payload contains the complete saveLibrary registry (+ legacyShowdowns + preferences).
2. Keep Candidate A non-mutating.
3. Expand `tests/contracts/multi-save-portability-contracts.cjs` into true deterministic round-trip assertions (start red → green only when path works).
4. Only after deterministic contracts green: Chromium coverage + minimal user-facing flow.

## Out of scope for this milestone

- Cloud, communities, profile merge/delete, unrelated gameplay, speculative Service Worker work.

## Acceptance criteria (unchanged)

1. Export every supported Save, stable save/profile/season identity, active-Save selection, required metadata, Legacy data and preferences.
2. Import the complete library into a clean browser without collapsing it to one active Save.
3. Define explicit safe existing-data destination behavior.
4. Reject invalid, unsupported, truncated or corrupt backups before canonical mutation.
5. Preserve same-name distinct profiles, explicit profile reuse and unresolved historical identity.
6. Preserve Candidate C destructive-Apply ownership, freshness, transaction, rollback, anti-clobber and exact-verification guarantees.
7. Add deterministic and Chromium coverage for clean-browser import, existing-data behavior, corruption, retry/idempotence and identity preservation.
8. Preserve gameplay, navigation, recovery, PWA/offline behavior, accessibility, performance and accepted presentation.
