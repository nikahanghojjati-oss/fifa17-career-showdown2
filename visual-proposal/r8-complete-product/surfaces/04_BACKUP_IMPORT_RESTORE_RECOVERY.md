# Surface Group 04 — Backup, Import Analysis, Atomic Restore and Recovery

Status: ACTIVE SURFACE CONTRACT

These are the highest-safety data surfaces in the product. Presentation must distinguish read-only verification, planning, destructive risk and actual apply/commit state with no ambiguity.

## Backup export

Backup export is a safe utility action within Legacy/data management, not a cloud-sync promise.

Treatment:

- show backup format/checksum state as technical metadata when current product exposes it;
- Export Backup may be primary inside its small utility section but not primary over the whole Legacy screen;
- success clearly confirms a file was prepared/exported without implying remote/cloud backup;
- no animation or iconography implying automatic synchronization.

## Import Analysis

Import Analysis is read-only verification/preview.

Required presentation distinctions:

- file selected / no file;
- analyzing/verifying;
- verified metadata;
- migration summary;
- warnings;
- conflicts;
- blockers;
- ready-for-review result;
- invalid/unsupported file.

A successful analysis must never visually read as “restored” or “applied.” It means only that inspection completed according to product authority.

Use clear DOM text, compact technical metadata and accessible warning/blocker panels. Do not put filenames or result text into artwork.

## Atomic Restore & Recovery

Required states include:

- no file selected;
- verifying;
- backup blocked;
- exact storage snapshot unavailable;
- backup snapshot cards for Active, Legacy, Preferences and Save Library where present;
- explicit choice selectors;
- Legacy conflict choices;
- Restore Plan Incomplete;
- Restore Plan Ready;
- Recovery Checkpoint warning;
- Apply Restore confirmation;
- Revalidating & Applying;
- stale-state rejection;
- snapshot-unavailable rejection;
- conflict/choice refresh;
- successful commit;
- critical recovery if rollback itself needs intervention.

## Visual hierarchy

### Review phase

Neutral/amber technical surfaces. Read-only snapshot cards and choices are clearly inspectable. No “success” styling merely because a backup parsed correctly.

### Plan-ready phase

Use a strong but calm readiness panel. Apply Restore remains distinct from review controls and only becomes visually actionable when product authority says the plan is valid.

### Apply phase

No decorative movement. Freeze unrelated controls when the runtime does. Show explicit applying/revalidating state.

### Critical recovery

Reserve the strongest danger treatment for actual risk or intervention. Use red plus explicit text; never red alone. No character art, confetti, glow sweeps or background animation.

## No second authority

The proposal does not decide snapshot validity, staleness, conflict resolution or commit success. It only styles states emitted by existing restore/recovery authority.

Do not add “force restore,” “ignore conflict,” or similar bypass controls unless final product explicitly owns them.

## Asset resolution

No raster generation.

Use DOM/CSS plus original local safety/checksum/lock icons only if they materially improve scanability. Technical metadata stays text.

## Responsive contract

Desktop may use snapshot grids and side-by-side review/plan summaries.

Chromebook/tablet collapses grids before shrinking copy.

Mobile stacks snapshot cards and choices, keeps long filenames/IDs wrap-safe, and places Apply Restore after the full plan summary so action context is not lost.

## Accessibility and QA

- review vs apply state is text-explicit;
- warnings/errors are not color-only;
- file input activation remains accessible;
- choice controls retain labels and current values;
- long metadata is selectable and wrap-safe;
- focus remains visible on all review/apply/cancel controls;
- Apply Restore disabled state explains why when product authority provides a reason;
- reduced motion removes decoration and never changes safety sequencing;
- successful commit state cannot appear before product authority confirms it;
- critical recovery disables/freezes exactly the controls the runtime requires, no more and no less.

## Legacy dark-shell dependency

Every backup/import/restore state shown inside the dark R8 Legacy shell is included in the surface-aware contrast sweep defined in `screens/12_LEGACY.md`. Light nested cards may keep dark text; text directly on the black shell must use explicit high-contrast R8 tokens.