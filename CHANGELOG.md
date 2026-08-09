# CHANGELOG — Career Mode Showdown

This file preserves continuity so later development does not reconstruct the project from old chats or mistake implementation revisions for a replacement roadmap.

The original release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project is currently inside the original **v0.95** convergence milestone.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **implemented and machine-validated; owner browser acceptance pending**

Workstream 1B implements the owner-approved presentation amendments without changing competition rules, scoring, storage schema, Transfer Challenge gameplay, season progression or central navigation architecture.

## Typography

- Added Barlow Condensed as the preferred display face for selected headings, Home tiles, navigation, scores and Club Reveal presentation.
- Uses an external Google Fonts stylesheet request with `display=swap`.
- Existing local/system condensed fonts remain fallback-first so text stays visible if the external request fails.
- Body copy/forms remain on the existing readable UI stack where condensed typography would reduce usability.
- Main Menu weight, tracking, casing and line-height were retuned rather than applying one font mechanically everywhere.
- License/source details are recorded in `THIRD_PARTY_NOTICES.md`.

## Original club crest identity

Replaced the old generic two-color/initial identity block with an original deterministic procedural crest system.

- All 98 current Showdown clubs have explicit club-associated palette data.
- Five original base crest geometries.
- Six original pattern families.
- Seven original abstract motif families.
- Monograms remain a supporting detail rather than the whole identity.
- Crests are generated as inline SVG data and cached deterministically by club name.
- The same identity is reused across reveal, confirmation, dashboard, Transfer, Season and Summary surfaces where club identity appears.
- Official club badge images/vector paths are not used by the identity engine.

CI verifies all 98 clubs are covered and generate 98 distinct deterministic crest data strings.

## Two-pack Club Reveal

Club Assignment presentation now uses two closed Showdown packs rather than the previous generic sealed cards.

Sequence:

**pair saved → Pack 01 opens → Manager 1 club → Pack 02 opens → Manager 2 club → VS → rivalry confirmation**

Current finite timing:

- M1 ~650 ms
- M2 ~1750 ms
- VS ~2850 ms
- confirmation ~3300 ms

The correct transaction remains unchanged:

- pair generated once;
- pair persisted before theatrical reveal;
- save failure rolls back;
- reveal phases perform no storage writes;
- no reroll path;
- `Clubs Assigned` remains confirmation-pending checkpoint;
- refresh/Continue restores the same pair;
- explicit confirmation is still required before status becomes `Ready`.

## Architecture cleanup

- Removed the large Club Reveal CSS injection from `clubAssignment.js`.
- Club Assignment JS now owns state/persistence/timing.
- `css/app.css` is again the authoritative core presentation layer for the reveal.
- Preserved low-height Chromebook and stacked mobile geometry.
- Preserved reduced-motion fast path.

## Validation

Expanded exact-head GitHub Actions checks for:

- 98-club identity coverage;
- distinct deterministic procedural crests;
- no external badge-image embedding;
- finite sequential reveal timing;
- persistence-before-reveal contract;
- no runtime reveal stylesheet injection;
- Barlow `display=swap` / fallback stack;
- all pre-existing scoring/navigation/startup/layout invariants.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency / Contrast Polish

Status: **implemented; retained by r4**

Normalized Rule Book, Statistics/Trophy Room and Legacy after older dark-theme child colors conflicted with newer light application panels.

- Rule Book: dark hero, readable light rule cards, stronger scoring hierarchy.
- Statistics/Trophy: readable light data cards, intentional dark rivalry hero, safer tables and long-name wrapping.
- Legacy: readable light summaries/data-management panel, intentional dark history cards.
- Optional styles remain lazy-loaded.
- CI validates balanced structure across all current visual stylesheets.

---

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Status: **implemented; retained by r4**

Owner testing of r1 found:

1. false startup integrity warning because diagnostics still expected runtime `0.16.0`;
2. misaligned/skewed Club Reveal geometry on Chromebook;
3. unsatisfactory sweeping reveal effect.

Corrections retained:

- expected runtime derived from shell revision;
- equal Club Reveal geometry;
- no active angled card clip-path;
- dedicated low-height Chromebook rules;
- no rejected white sweep;
- finite reveal motion.

---

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established the original v0.7 acceptance requirement as a real persisted state flow:

**Selected League → first club → second club → VS → explicit confirmation → Showdown Home**

`Clubs Assigned` became the persisted checkpoint for a permanent pair waiting for confirmation. The pair is saved before animation and refresh/Continue restores the same pair.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Status: **owner accepted**

- replaced fixed Home row behavior with content-sized tracks;
- moved soundtrack/trailer rail below Career tiles;
- desktop media choices became a four-column selector;
- added low-height Chromebook density handling;
- preserved successful mobile layout;
- added CI guards against the original overlap pattern.

---

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

- fixed contextual Back from Completed Showdown Home;
- consolidated cache revision ownership into the shell;
- re-established original `v0.95 → v1.0` roadmap authority;
- restored project-state/changelog continuity.

---

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

- one unified initial `css/app.css`;
- seven-script initial runtime;
- lazy gameplay package;
- lazy optional/history/analytics modules;
- centralized state-aware Back authority;
- Completed Showdown recovery hub;
- exact-head GitHub Actions validation;
- startup local-byte budget;
- obsolete prototype removal.

---

# v0.15.x — Stability / Performance Consolidation

Established the reliability foundation retained today:

- transaction-safe persistence/Legacy operations;
- race-safe League Wheel / Club Assignment async operations;
- persisted Transfer deadline;
- debounced/deduplicated Transfer drafts;
- hidden/off-screen timer shutdown;
- stabilized Season progression;
- lazy secondary modules;
- lightweight menu media;
- runtime diagnostics.

---

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe season persistence/rollback, visible runtime errors, route validation before screen exit and hardened localStorage failure behavior after a Complete Season failure report.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, career records, Trophy Room and Statistics UI. Analytics remains derived/read-only.

# v0.9 — Legacy / Data Management

Added completed-showdown archive, season history, final rivalry outcomes, individual history deletion, delete-all and data-management protections.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established current Transfer Challenge and final scoring amendments: 15 minutes, max three signings, three league/nationality guesses, correct guess releases signing, grouped bonuses, max 11, nonzero ties draw, only 0-0 uses league-position/points fallback.

# v0.7 — Working Showdown / Season Progression

Established Showdown creation/Home, Season Results, scoring integration, Season Summary, multi-season progression and active-save continuity. The original reveal/confirmation experience was completed later during v0.95 and is now represented by r4.

# v0.6.1 and earlier — Foundation

- v0.6.1: application framework/navigation/storage foundation.
- v0.6: League Wheel.
- v0.5: league/club/data foundation.
- v0.4: functional HTML/CSS/JS prototype.
- v0.3: FIFA-17-era UI direction and FUT-inspired reveal philosophy.
- v0.2: rivalry experience design.
- v0.1: project foundation.

---

# Remaining v0.95 roadmap

## Current gate

Owner browser acceptance of **`0.95.0-r4` Workstream 1B**.

## Workstream 2 — Transfer Challenge phase/data redesign

- Guess Entry first;
- Signing Entry second;
- explicit persisted Transfer sub-phases;
- backward compatibility for existing saves;
- complete historical FIFA 17 former-league metadata;
- complete FIFA 17 player-nationality metadata;
- responsive searchable canonical selectors;
- canonical guess evaluation;
- route/persistence/data regression coverage.

## Workstream 3 — Settings

Original small Settings surface using current architecture.

## Workstream 4 — Main Menu Statistics alignment

Reuse current analytics/Trophy/Rivalry engines.

## Workstream 5 — Season pre-commit review

Add/confirm review before irreversible completion.

## Workstream 6 — final v0.95 regression/polish

Accessibility, responsive consistency, typography/contrast, feedback, performance and complete gameplay/persistence/navigation regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.