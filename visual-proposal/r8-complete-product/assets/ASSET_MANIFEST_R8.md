# R8 Proposal Asset Manifest

Status: ACTIVE

This manifest records proposal assets only. Nothing in this folder becomes production authority until final-main reconciliation and intentional senior-developer integration.

## Character masters

### A01_NIK_CORE_THINKING_HERO

- role: immutable Nik presentation master
- manager mapping: Manager 2
- intended proposal path: `assets/masters/a01-nik-core-thinking-hero.png`
- source: owner-approved Showdown visual Library authority
- source filename: `A01_NIK_CORE_THINKING_HERO_OWNER_APPROVED_V1.png`
- type: PNG
- dimensions: 1086 × 1448
- mode: RGBA
- size: 1,426,297 bytes
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- responsive eligibility: wide-desktop decorative use on explicitly approved screens; omitted by default at <=1179px
- safe-zone rule: never cover interactive/readable DOM; use crop/mask/omission before regeneration
- rights/provenance: project owner-approved AI character authority
- generation note: frozen existing master; DO NOT REGENERATE
- verification: exact hash, dimensions and mode verified 2026-09-10
- branch packaging: OPEN because current connector lacks a materialized-binary upload path
- acceptance: SOURCE VERIFIED / PACKAGE COPY PENDING

### A02_DANIEL_CORE_POINTING_HERO

- role: immutable Daniel presentation master
- manager mapping: Manager 1
- intended proposal path: `assets/masters/a02-daniel-core-pointing-hero.png`
- source: owner-approved Showdown visual Library authority
- source filename: `A02_DANIEL_CORE_POINTING_HERO_OWNER_APPROVED_V1.png`
- type: PNG
- dimensions: 1086 × 1448
- mode: RGBA
- size: 1,628,938 bytes
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- responsive eligibility: wide-desktop decorative use on explicitly approved screens; omitted by default at <=1179px
- safe-zone rule: never cover interactive/readable DOM; use crop/mask/omission before regeneration
- rights/provenance: project owner-approved AI character authority
- generation note: frozen existing master; DO NOT REGENERATE
- verification: exact hash, dimensions and mode verified 2026-09-10
- branch packaging: OPEN because current connector lacks a materialized-binary upload path
- acceptance: SOURCE VERIFIED / PACKAGE COPY PENDING

## Procedural assets

### R8_HOME_STADIUM_ATMOSPHERE_V1

- role: original Home black/gold stadium atmosphere layer
- path: `assets/procedural/r8-home-stadium-atmosphere-v1.svg`
- source/provenance: original procedural SVG authored for R8.26 proposal
- type: SVG
- intrinsic dimensions: 1600 × 900
- SHA-256: `fce782539606be3d25f3d748f4571b10300ec231dcdb10e6ea22dca845bb1af5`
- target: `mainMenu` / Home
- responsive eligibility: wide desktop through mobile; intensity may be reduced through CSS but asset itself carries no controls/text
- safe-zone rule: background only, pointer-inert, no readable DOM baked into asset
- rights status: original project asset; no third-party logos, crests, photography, fonts or text
- generation/model note: deterministic hand-authored SVG, not raster image generation
- acceptance: PACKAGED / INITIAL DESIGN ACCEPTED, pending composite/browser QA

## Layout-resolved roles that intentionally require no external file

### R8_HOME_INTERACTION_SAFE_ZONE_V1

- role: protect Home control/readability center from decorative character intrusion
- target: `mainMenu`
- resolution: layout specification in `screens/01_HOME_MAIN_MENU.md`
- external asset: NONE BY DESIGN
- reference: approximately x=420–1180 on a 1600×900 design canvas, adapted from real DOM at implementation time
- acceptance: RESOLVED AS LAYOUT CONTRACT

### R8_HOME_COMPACT_CHARACTER_FREE_V1

- role: Chromebook/tablet/mobile Home composition
- target: `mainMenu` at <=1179px
- resolution: existing DOM + R8 CSS/procedural atmosphere; no replacement character raster
- external asset: NONE BY DESIGN
- acceptance: RESOLVED AS CHARACTER-FREE RESPONSIVE CONTRACT

### R8_LEGACY_DARK_SHELL_SYSTEM_V1

- role: archive/data/recovery presentation including discovered contrast correction
- target: `legacy` plus its import/data-management states
- resolution: real DOM + proposal-scoped CSS in `prototypes/legacy/r8-legacy-dark-shell-reference.css`
- external raster/character asset: NONE BY DESIGN
- rights status: original CSS/layout treatment
- acceptance: REFERENCE BUILT / browser-state QA pending

## Pending manifest expansion

Every routed screen and substantial non-route surface must be added here as its asset roles are resolved. A blank or unresolved role in `ASSET_BUILD_MATRIX.md` continues to block final proposal completion.
