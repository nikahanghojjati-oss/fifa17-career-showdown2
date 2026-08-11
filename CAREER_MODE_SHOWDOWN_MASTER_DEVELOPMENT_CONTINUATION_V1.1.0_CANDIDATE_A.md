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

Fix target: validate active storage shape before reporting a usable saved Showdown while preserving corrupt raw bytes.

### Bug 2 — malformed Legacy shape can silently look empty

`loadLegacyShowdowns()` currently treats parsed non-array JSON as an empty archive without raising the same corruption signal used for parse errors.

Fix target: treat wrong top-level Legacy shape as malformed, report it, keep the raw bytes untouched, and let Candidate A expose them in recovery data.

### Bug 3 — stale Settings fallback version

`js/settings.js` still falls back to `1.0.1` when `APP_VERSION` is unavailable even though production is already v1.0.2.

Fix target: advance Settings version fallback with the v1.1 release authority and prevent stale build identity in degraded/runtime-isolation cases.

### Bug 4 — destructive Data Management success is under-signalled

Delete-one, delete-all-Legacy and full-reset paths have strong failure messaging but do not consistently provide an explicit success notice after a committed destructive transaction.

Fix target: add concise success feedback only after the transaction has actually committed.

### Bug 5 — rapid backup activation can duplicate downloads

Candidate A introduces a new download action. Without a single-flight UI guard, rapid double activation can create multiple downloads and ambiguous feedback.

Fix target: disable/mark the export control busy during envelope/checksum/download generation and restore it in `finally`; repeated activation while busy is ignored.

## Visual retune included with this build

The v1.0.2 clean-anchor rule remains: decorative geometry must never be painted over a protected face.

The next treatment adds **face-safe accent rails**:

- diagonal FIFA-era energy returns;
- accents remain behind the image or within explicit non-face edge zones;
- Transfer accents may visually graze outer torso/background edges but cannot enter the protected face/head region;
- James keeps restored facial contrast and the final top-identity/full-width-photo geometry;
- Reus keeps the approved rectangular Home anchor and loading-screen separation;
- Messi/Lahm remain unchanged unless a regression requires a correction.

Permanent browser tests must protect the layering rather than simply test that lines do not exist.

## Planned implementation order

1. Record owner approval/amendment and Candidate A scope — this file.
2. Build a read-only storage snapshot API in `js/storage.js`.
3. Build lazy `js/backup.js` for deterministic envelope/checksum/download behavior.
4. Load backup helper through the existing Legacy optional-module path.
5. Add accessible Export Backup controls/status to `js/legacy.js` + `css/legacy.css`.
6. Implement the five maintenance fixes above.
7. Retune footballer accent geometry while preserving clean-anchor face safety.
8. Add Candidate A contract tests and browser coverage.
9. Advance app/runtime/package/cache identity coherently.
10. Update roadmap/state/release documentation only after the candidate proves itself.
11. Open PR, freeze exact head, run all permanent workflows, fix real failures without weakening gates.
12. Inspect rendered browser screenshots.
13. Merge with expected-head protection.
14. Verify exact Pages deployment and post-merge Stability/Licensed Visual runs.
15. Append exact merge/deployment evidence here and leave the next developer a single clear continuation state.

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

`IMPLEMENTATION STARTED`

No claim of completion, merge, deployment or owner acceptance for the new accent retune has been made yet.
