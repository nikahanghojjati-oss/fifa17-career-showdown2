# Career Mode Showdown — v1.1.0 Candidate A Public Development Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.0-candidate-a-maintenance`
Base `main`: `cea683e05640d92a9b70d7a3602f4afabbe59ed1`
Purpose: public, continuously updated handoff for the owner-directed v1.1.0 Candidate A build.

## Owner instruction that opened this build

The owner visually approved deployed v1.0.2 and clarified one art-direction point:

> I approval this visually but i didn’t ask you to remove the lines effect on pictures i said they were blocking the face i preferred a retune of those if possible to keep the head and face visible as well

The owner then instructed:

> Do a 5 bug fix while putting all your energy and focus to go to next build follow the road map enhance it and record everything you do and our communication in public file that next developer can easily access

The owner subsequently explicitly instructed this session to obtain/use live GitHub repository tools and execute the plan directly.

## Authority transition

The v1.0.2 visual owner gate is now closed as **approved**, with the following amendment for future presentation:

- the clean-anchor photography architecture remains approved;
- the FIFA 17-inspired diagonal line language was over-reduced in v1.0.2;
- diagonal accents should return where appropriate;
- head, face, eyes, nose and mouth remain protected from foreground obstruction;
- the owner-liked loading screen remains protected and is not part of the line-retune redesign.

This approval legally unlocks the next roadmap milestone:

`v1.1.0 Data Safety and Recovery`

This branch implements **Candidate A only**:

`Versioned Backup Envelope + Non-Mutating Export`

Candidate B (Import Analysis / Migration Preview) and Candidate C (Atomic Restore) remain blocked.

## Current architecture facts confirmed from live `main`

Persistence authority: `js/storage.js`

Current canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`

Current preferences schema: `2`

Existing Showdown IDs are preserved. v1.1 must not replace them with future profile/save-library identities.

Data Management currently lives in `js/legacy.js` and is reached from Settings through the existing lazy Legacy module. This remains the Candidate A UI surface.

## Candidate A implementation contract

The backup must be:

- local;
- downloadable;
- human-inspectable JSON;
- versioned independently from runtime cache revision;
- deterministic for checksum purposes;
- explicit about corrupt/unreadable current storage;
- non-mutating.

The export path must perform zero calls to `localStorage.setItem()` and zero calls to `localStorage.removeItem()`.

All canonical storage capture originates through `js/storage.js`. A separate backup helper may serialize, checksum and download, but it may not become a second storage authority.

Required envelope semantics:

- `formatId`;
- `formatVersion`;
- `appVersion`;
- `runtimeRevision` as diagnostic metadata only;
- `exportedAt`;
- checksum algorithm and checksum;
- record counts;
- active Showdown payload when available;
- Legacy payload when available;
- preferences payload when available;
- relationship metadata when completed active data matches Legacy by ID;
- warnings;
- clearly labelled raw recovery records when current bytes are malformed.

Checksum is corruption detection only. It is not encryption, authentication or tamper-proof signing.

## Five maintenance bugs included in this build

### Bug 1 — corrupt active-save false positive

Current `hasSavedShowdown()` can return true for any non-empty raw active-save string even when `loadSavedShowdown()` cannot parse it. This can advertise Continue Career for unusable data.

Fix: active storage shape is now validated before it can advertise a usable saved Showdown. Corrupt raw bytes remain untouched and are reported instead of converted into a false Continue Career state.

### Bug 2 — malformed Legacy shape can silently look empty

`loadLegacyShowdowns()` previously treated parsed non-array JSON as an empty archive and filtered invalid record shapes.

Fix: wrong top-level shape or invalid record entries are now treated as malformed Legacy data, reported, and preserved raw for Candidate A recovery export.

### Bug 3 — stale Settings fallback version

`js/settings.js` still fell back to `1.0.1` when `APP_VERSION` was unavailable.

Fix: the Settings fallback is advanced to the v1.1.0 release authority so degraded/runtime-isolation cases no longer display a stale build identity.

### Bug 4 — destructive Data Management success is under-signalled

Delete-one, delete-all-Legacy and full-reset paths had strong failure messaging but inconsistent positive confirmation.

Fix: committed destructive transactions now produce concise success notices only after the storage transaction succeeds.

### Bug 5 — rapid backup activation can duplicate downloads

Candidate A introduces a new download action. Rapid repeated activation could otherwise create multiple downloads.

Fix: Export Backup has a single-flight guard, disabled/`aria-busy` state, progress copy and `finally` restoration. Repeated activation while busy is ignored.

## Candidate A runtime implemented

Generated runtime commit:

`f6b58ff11d523dd96b2a2811682d2500bb904307`

Implemented source:

- `js/storage.js` now exposes a read-only `captureCareerModeBackupSnapshot()` authority and storage-key diagnostics;
- `js/backup.js` is a new lazy helper that builds format-v1 envelopes, canonicalizes checksum input, calculates SHA-256 with WebCrypto, verifies checksums, serializes readable JSON and downloads a timestamped file;
- `js/optionalModules.js` loads the backup helper only with the existing Legacy/Data Management module;
- `js/legacy.js` adds the accessible Export Backup workflow/status plus the five maintenance fixes that belong in Data Management;
- `css/legacy.css` adds a FIFA-17-style backup summary and primary data action without introducing a new top-level route;
- app/package/cache identity advanced to `v1.1.0 / 1.1.0-r1` in the implementation candidate.

No Candidate B import parser or Candidate C restore write path has been added.

## Backup data semantics now implemented

The envelope includes:

- format ID/version;
- app/runtime diagnostics;
- export timestamp;
- SHA-256 algorithm metadata and checksum;
- record counts;
- active/Legacy/preferences payloads;
- active-source and matching completed-active/Legacy relationship metadata;
- per-record storage state;
- warnings;
- raw recovery data for malformed current bytes.

Export performs no flush and no canonical write. It reads through `js/storage.js`, hashes in memory, builds a Blob and triggers a local browser download.

## Visual retune implemented

The v1.0.2 clean-anchor rule remains: broad decoration does not cover a protected face.

The v1.1.0 treatment restores **face-safe diagonal accent rails**:

- James/Rashford/Martial receive bounded diagonal cyan/yellow geometry inside the lower portion of the photo frame;
- James starts the foreground accent zone at 64% of the photo frame;
- Transfer clean-anchor panels start it at 58%;
- the generic clean-anchor floor is 60%;
- Reus receives a lower 34% accent zone on desktop and 30% on mobile;
- the loading-screen selectors/composition remain separate and unchanged except for cache identity;
- the permanent football visual audit now requires the accent rail to exist **and** rejects it if its top edge enters the protected head/face region.

This reflects the owner correction: the line language is retained, but it frames/energizes the player rather than crossing the face.

## Test hardening completed so far

Candidate A contracts now cover:

- empty storage;
- active-only;
- Legacy-only;
- preferences-only;
- full three-record state;
- completed active plus matching Legacy ID;
- unchanged existing IDs/timestamps;
- zero `setItem` / zero `removeItem` calls;
- SHA-256 verification;
- mutated-envelope checksum failure;
- human-readable newline-terminated JSON;
- malformed active/Legacy/preferences recovery;
- byte-for-byte preservation of corrupt raw data;
- corrupt active-save false-positive fix;
- 1,000-record Legacy export responsiveness.

Browser audit now covers:

- real JSON download;
- keyboard activation;
- exact pre/post storage-byte equality;
- rapid double activation -> one download;
- checksum/tamper behavior in Chromium;
- corrupt recovery behavior;
- matching completed active/Legacy relationship;
- axe scan of changed Data Management UI;
- horizontal-overflow check;
- live-region semantics;
- 940×700 windowed/Chromebook path;
- 390×844 DPR2 mobile touch path;
- reduced-motion mobile path;
- Data Management screenshots for both desktop/windowed and mobile.

The permanent Stability Lane now runs `test:backup-browser` in both consecutive Chromium cycles and again against deployed Pages after merge. It uploads the Candidate A Data Management screenshots from the pre-merge browser run.

## Tooling incident and classification

The first one-off builder run failed before changing runtime because `tools/build_v110_candidate_a.py` had a stray trailing triple quote.

Failed run:

`31509278742`

Classification:

`TOOLING FAILURE — NO APP MUTATION`

The workflow was hardened to strip/check the temporary trailer before execution. The second builder run succeeded:

`31509394495`

The generated runtime landed as `f6b58ff1...`.

After generation:

- the temporary builder workflow was removed;
- the one-off builder script was removed;
- no temporary development workflow or generator is intended to survive into the PR candidate.

## Planned implementation order / current completion

1. Record owner approval/amendment and Candidate A scope — **done**.
2. Build a read-only storage snapshot API in `js/storage.js` — **done**.
3. Build lazy `js/backup.js` for deterministic envelope/checksum/download behavior — **done**.
4. Load backup helper through the existing Legacy optional-module path — **done**.
5. Add accessible Export Backup controls/status to `js/legacy.js` + `css/legacy.css` — **done**.
6. Implement the five maintenance fixes — **implemented; validation pending**.
7. Retune footballer accent geometry while preserving clean-anchor face safety — **implemented; screenshot validation pending**.
8. Add Candidate A contract/browser coverage — **done and strengthened; CI execution pending**.
9. Advance app/runtime/package/cache identity coherently — **runtime candidate done; release/workflow authority pending**.
10. Update roadmap/state/release documentation only after the candidate proves itself — **pending**.
11. Open PR, freeze exact head, run all permanent workflows, fix real failures without weakening gates — **next**.
12. Inspect rendered browser screenshots — **pending**.
13. Merge with expected-head protection — **pending**.
14. Verify exact Pages deployment and post-merge Stability/Licensed Visual runs — **pending**.
15. Append exact merge/deployment evidence here — **pending**.

## Protected systems

Do not change:

- max-11 scoring/tiebreak rules;
- two-manager/same-league/different-club contract;
- League Wheel confirmation;
- Club Assignment lock/reveal transaction;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics/Legacy/Trophy semantics outside the new backup UI and success feedback;
- `js/screens.js` as navigation authority;
- `js/storage.js` as sole persistence authority;
- existing storage keys/schema in Candidate A;
- owner-approved v1.0.2 player crops;
- loading-screen composition/timing;
- Messi/Lahm approved presentation.

## Current status

`IMPLEMENTATION BUILT — PERMANENT VALIDATION NEXT`

No claim of merge/deployment or owner acceptance for the new accent retune has been made yet.
