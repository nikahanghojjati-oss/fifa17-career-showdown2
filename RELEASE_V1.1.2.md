# Career Mode Showdown v1.1.2 — Candidate B Import Analysis + Migration Preview

Status: candidate until exact PR/main/Pages evidence is complete.

## Purpose

Add the read-only half of import safety before any restore write is allowed.

Candidate B analyzes one local Career Mode Showdown backup in memory and tells the user what a later restore would encounter. It does not apply, merge, replace or remove browser data.

## Runtime boundary

Release tag: `v1.1.2`

Application: `v1.1.2`
Runtime asset revision: `1.1.2-r1`

Included:

- 5 MiB pre-parse File size ceiling;
- JSON/format/checksum/schema validation;
- hostile object-key and excessive nesting rejection;
- schema-1 → schema-2 Showdown migration preview;
- preference schema-1 → schema-2 migration preview;
- deterministic ordered migration registry;
- duplicate/conflict classification using Showdown IDs as strings;
- active/Legacy/preferences dry-run impact;
- accessible file picker and drag/drop Data Management UI;
- explicit Preview Only / No Restore Writes messaging;
- golden historical fixtures;
- zero-write, large-input, tamper, future-schema and browser tests.

Excluded:

- restore/apply writes;
- automatic Legacy merge;
- automatic active replacement;
- profile/save-registry identity changes;
- PWA/service worker;
- cloud/network upload.

## Data-safety invariants

Candidate B never calls canonical localStorage write/remove APIs. It uses `js/storage.js` read-only raw snapshot authority only for conflict comparison.

Checksum verification remains corruption detection, not authentication. Import UI must not describe SHA-256 as a signature or proof of trusted origin.

Future backup/data schemas fail closed.

Same-ID/different-content conflicts are previewed, never silently resolved.

Candidate C remains the first legal restore-write stage.

## Gate additions

A new permanent Import Analysis workflow protects:

- contracts and migration fixtures;
- two browser executions per workflow run;
- desktop/windowed and DPR2 touch/mobile Data Management evidence;
- axe/overflow/touch-target checks;
- checksum/future-format/malformed/oversized paths;
- exact storage-byte non-mutation.

Stability and five-way Release Burn-In also include Candidate B browser analysis.

No existing startup/performance/accessibility threshold is raised to accommodate this build.
