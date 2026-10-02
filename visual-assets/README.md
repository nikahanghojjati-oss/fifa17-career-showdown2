# SHOWDOWN VISUAL ASSET LIBRARY — START HERE

Status: ACTIVE
Canonical binary store: `/Showdown Visual Asset Library/`
Repository mirror: branch `visual/asset-library-v1`, directory `visual-assets/`
Owner: Nik
Art director / curator: Sol
Front-end builder: Luna

## Purpose

This system prevents visual references, identity anchors, screen-specific character poses, stadiums, and approved screen examples from disappearing between chats.

Future Showdown Visual sessions should NOT ask Nik to re-upload known references before checking this library.

## Authority order

1. Nik's current explicit visual direction
2. `ASSET_REGISTRY_V1.json`
3. `VISUAL_DNA_REFERENCE_BOARD_V1.md`
4. approved identity masters / face-truth references
5. approved screen-specific pose assets
6. approved screen references
7. strong visual references
8. legacy/exploratory assets

A reference image can define visual language without defining product truth.

## First action for every future visual session

1. Open `/Showdown Visual Asset Library/00_SYSTEM/ASSET_REGISTRY_V1.json`.
2. Find the target screen family.
3. Load only the exact assets marked `REQUIRED` or `IDENTITY_ANCHOR`.
4. Read `/Showdown Visual Asset Library/00_SYSTEM/SCREEN_ASSET_MATRIX_V1.md`.
5. If a required asset is missing, declare `ASSET BLOCKER`; do not substitute a Home hero or random old reference.
6. Only ask Nik for a new reference when neither the curated library nor legacy source archive contains adequate evidence.

## Storage rule

Binary assets live in the ChatGPT Library because this is the durable cross-session asset store.

The GitHub `visual/asset-library-v1` branch mirrors the system documents and manifest, not large binary artwork. This avoids bloating the product repository while still giving every future coding/review session a stable, versioned map of what exists and where to retrieve it.

## Naming

`IDM_` = identity master / identity reference
`POSE_` = compositable character pose
`ENV_` = environment/stadium asset
`REF_` = visual-language reference
`SCREEN_` = approved/reference screen render
`SYS_` = system document

Every promoted asset should have:
- stable asset ID
- screen family
- authority/status
- canonical Library path
- intended role
- reuse restrictions
- known issues
- source/provenance note

## Promotion lifecycle

`RAW -> CURATED_REFERENCE -> CANDIDATE -> OWNER_ACCEPTED -> APPROVED_FOR_ROLE`

Identity masters never become universal pose masters.

A role-approved pose is approved for its named screen family unless Sol explicitly broadens reuse.

## Do not lose assets again

Do not rename or delete canonical files casually.
New versions receive a new version suffix.
Rejected assets stay archived with a rejected status; they are never silently reused.
The manifest is updated whenever an asset is promoted, deprecated, or superseded.