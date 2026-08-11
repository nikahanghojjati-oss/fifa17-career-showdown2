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

Initial generated runtime commit:

`f6b58ff11d523dd96b2a2811682d2500bb904307`

The implementation evolved during permanent CI hardening. Current architecture is:

- `js/storage.js` remains the only canonical browser-storage reader and exposes a compact, read-only raw backup-input snapshot rather than performing backup-only parsing on the startup path;
- `js/backup.js` is a lazy helper that parses/validates those raw inputs, builds format-v1 envelopes, canonicalizes checksum input, calculates SHA-256 with WebCrypto, verifies checksums, serializes readable JSON and downloads a timestamped file;
- `js/optionalModules.js` loads the backup helper only with the existing Legacy/Data Management module and now propagates the real `showScreen("legacy")` result instead of claiming success after a failed Legacy render/navigation;
- `js/legacy.js` adds the accessible Export Backup workflow/status plus the five maintenance fixes that belong in Data Management;
- `css/legacy.css` adds a FIFA-17-style backup summary and primary data action without introducing a new top-level route, with a cascade-safe 46px minimum Data Management action height to clear the 44px touch-target floor;
- app/package/cache identity is `v1.1.0 / 1.1.0-r1` in the release candidate.

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

Export performs no flush and no canonical write. It reads raw canonical bytes through `js/storage.js`, parses/hashes in the lazy backup module, builds a Blob and triggers a local browser download.

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

## Test hardening completed

Candidate A contracts cover:

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

Browser audit covers:

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
- minimum 44px mobile action target;
- Data Management screenshots for both desktop/windowed and mobile.

The backup browser audit launches a fresh Chromium process for each scenario because the project’s locked Chromium runtime uses `--single-process`; this prevents one closed context from terminating later scenarios while preserving the same browser/runtime authority.

The permanent Stability Lane runs `test:backup-browser` in both consecutive Chromium cycles and again against deployed Pages after merge. It uploads Candidate A Data Management screenshots from the pre-merge browser run.

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
- later temporary release-migration, startup-budget, lazy-backup and Legacy-route repair workflows/helpers were also removed after their permanent outputs were validated;
- no temporary development workflow or generator remains intentionally in the release candidate.

## Permanent CI repair checkpoint

The first v1.1.0 PR cycles separated stale release assertions from real Candidate A integration issues rather than weakening gates.

### Release/workflow authority

Older permanent workflows still asserted `v1.0.2 / 1.0.2-r1`. Those active release assertions were migrated to `v1.1.0 / 1.1.0-r1` while `RELEASE_V1.0.2.md` and other historical rollback evidence remained unchanged.

### Startup budget regression

Candidate A initially increased eager startup raw bytes to `168,408`, above the locked `165,000` ceiling.

The ceiling was **not raised**. Backup-only parsing, corruption classification, relationship calculation and cloning were moved out of eager `js/storage.js` into lazy `js/backup.js`. `js/storage.js` remains storage authority and supplies only raw read-only backup inputs.

Validation run:

`31513071238`

Result:

- backup/storage contracts: PASS;
- syntax: PASS;
- locked startup raw bytes: **164,994**;
- original 165 KB ceiling preserved.

### Browser fixture / Legacy route diagnosis

A Stability browser failure originally left `#legacy` hidden. The cause was a test fixture that labelled a skeletal object as a completed Showdown but omitted manager/club/score fields required by the real Legacy card renderer. The browser fixture was corrected to a minimal valid schema-2 completed rivalry; production Legacy rendering was not bypassed.

That investigation also exposed a real optional-module contract bug: `openOptionalModule("legacy")` returned success even when `showScreen("legacy")` failed. The Legacy branch now returns the actual `showScreen` result.

### Chromium runtime hardening

The project runtime uses Chromium `--single-process`. Reusing one browser for three sequential backup scenarios caused a closed first context to terminate the process. The audit now launches one fresh Chromium process per desktop, keyboard-download and mobile/reduced-motion scenario, matching the established Home visual audit hardening.

### Mobile touch target defect

The strengthened mobile audit measured Export Backup at `324.390625 × 42` CSS pixels, below the 44px target floor. The assertion was kept unchanged.

A first `.compactButton` height change was correctly rejected by the browser because optional styles are inserted before eager `#appStyles`; the later global `.backButton,.compactButton{min-height:42px}` won at equal specificity.

The final fix uses the scoped higher-specificity Data Management rule:

`.legacyControlButtons .compactButton { min-height: 46px; }`

Guarded validation run:

`31514853800`

Result:

`PASS  v1.1.0 Candidate A browser backup audit`

The workflow then committed the permanent route-result, browser-runtime and touch-target repairs as:

`a47e80ea8f296b880776718ffb1731a5a6e01733`

Temporary Legacy-route repair workflow/helper were removed immediately afterward.

## Planned implementation order / current completion

1. Record owner approval/amendment and Candidate A scope — **done**.
2. Build a read-only storage snapshot API in `js/storage.js` — **done and startup-budget hardened**.
3. Build lazy `js/backup.js` for deterministic envelope/checksum/download behavior — **done**.
4. Load backup helper through the existing Legacy optional-module path — **done; real route result propagated**.
5. Add accessible Export Backup controls/status to `js/legacy.js` + `css/legacy.css` — **done; mobile touch floor validated**.
6. Implement the five maintenance fixes — **done; contract/browser coverage green in focused validation**.
7. Retune footballer accent geometry while preserving clean-anchor face safety — **implemented; final screenshot inspection still required**.
8. Add Candidate A contract/browser coverage — **done and strengthened**.
9. Advance app/runtime/package/cache identity coherently — **done**.
10. Update roadmap/state/release documentation — **done for v1.1.0 Candidate A authority; this public handoff is current**.
11. Open PR, freeze exact permanent-source head, run all permanent workflows — **in progress; final clean-head matrix next**.
12. Inspect rendered browser screenshots — **next after final green matrix**.
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

`CANDIDATE A FOCUSED BROWSER VALIDATION GREEN — FINAL CLEAN PERMANENT CI + SCREENSHOT REVIEW NEXT`

No claim of merge/deployment or owner acceptance for the v1.1.0 accent retune has been made yet.


## Final deployment hardening — 2026-08-11

Owner requested deployment plus at least two additional fixes and five independent final-gate comparisons. Before merge, two concrete defects were selected rather than changing scope:

1. **Global touch-target defect:** the shared `.backButton,.compactButton` contract still allowed 42 px controls even though the release accessibility floor is 44 px. The global minimum is now 44 px so this protection applies consistently beyond Data Management.
2. **Football-photo paint-settlement defect:** visual panels could mark `imageLoaded` from the `load` event before decoded pixels had settled across paint frames. This could produce a technically green but visually blank evidence frame on mobile. `js/footballVisuals.js` now waits for `HTMLImageElement.decode()` when available and commits the loaded state only after two paint frames, with a non-decode fallback. The browser audit also waits through two paint frames before screenshot capture.

The earlier Stability run on `5ea916f7f26418b9964396c030cfeca2d44f8cda` was **cancelled by concurrency** and is explicitly not counted as release proof. A new frozen final SHA will be validated from scratch.


## Five-pass burn-in attempt 1 — rejected proof

- Candidate SHA: `22ed7a4cbd752a44fcddf2fc399d7cc5185278a8`.
- Burn-in workflow run: `31518433196`. Five independent jobs were launched, but the attempt is **not counted** toward release proof.
- Pass 1 log showed static/contracts, runtime provenance, Home/Reus visual, licensed football visual, and Candidate A backup/export all passing before the complete-journey audit stopped after `Corrupt Legacy fallback accessibility scan`.
- The jobs then hit the 32-minute workflow timeout; this was deterministic across the five runners.
- Root cause: `hasSavedShowdown()` correctly changed to reject corrupt JSON for Continue Career, but `createShowdown()` also used that valid-save predicate as its destructive replacement predicate. Corrupt raw active-save bytes therefore no longer triggered the existing replacement confirmation. The browser fixture waited for that confirmation indefinitely.
- Product correction: valid parsed data continues to control **Continue Career**, while a separate raw-slot occupancy check now controls whether **New Showdown** must confirm before overwriting the active storage slot. This preserves recoverable corrupt bytes until the user explicitly approves replacement.
- Gate correction: corrupt-save dialog expectations now use a 5-second Playwright dialog timeout so a future regression fails fast instead of burning an entire runner timeout.
- Release policy: the five-pass count resets to **0/5** after this fix. Only a new SHA with five successful independent passes may be merged.


## Startup headroom recovery after corrupt-slot fix

- Clean candidate `f4546cb764db7055b6c602a85349fb048a57eb4f` correctly failed Static App and Final Polish because the new corrupt-slot replacement protection raised raw startup to `165,287` bytes against the locked `165,000` ceiling.
- This candidate is **not counted** in the five-pass release proof.
- The performance budget was not raised and recovery protection was not removed. Headroom was recovered by compacting the new eager expressions and removing non-executable compatibility comments from eager storage/showdown source.
- The five-pass release count resets to **0/5** on the next clean SHA.
