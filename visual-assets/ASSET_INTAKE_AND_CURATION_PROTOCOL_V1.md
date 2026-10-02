# SHOWDOWN VISUAL — ASSET INTAKE + CURATION PROTOCOL V1

## Why

Raw generated images are not automatically durable assets.

Every useful asset should be promoted into the curated library with a stable ID, role and status.

## Intake steps

1. CAPTURE
   Save the generated/uploaded image before the chat ends.

2. CLASSIFY
   Choose one:
   identity / character_pose / environment / visual_reference / screen_reference / decorative_object / rejected

3. NAME
   Use a stable semantic filename, not a phone UUID.

4. QA
   For people:
   - identity likeness
   - face geometry
   - hair
   - hands/anatomy
   - expression
   - wardrobe
   - lighting
   - transparent edge
   - pose-to-screen fit

   For environments:
   - perspective
   - safe zones
   - lighting direction
   - unwanted text/logos
   - crop flexibility
   - desktop/mobile usefulness

   For screen references:
   - visual-language value
   - product-truth conflicts clearly labeled

5. PROMOTE
   Copy to `/Showdown Visual Asset Library/` and add to `ASSET_REGISTRY_V1.json`.

6. REUSE RULE
   State where it is allowed and where it is not.

7. VERSION
   Never silently overwrite a materially different approved asset.
   Create `_V2`, `_V3`, etc.

## Curation tiers

A — APPROVED / OWNER-ACCEPTED
Safe to use in the stated role.

B — STRONG REFERENCE
Useful visual DNA. Not automatically an implementation asset.

C — EXPLORATORY
Useful for isolated lessons only; not passed to Luna unless Sol explicitly selects it.

R — REJECTED / SUPERSEDED
Kept only to prevent regression or accidental reuse.

## Future-session rule

Before asking Nik for references:
- search the registry;
- search the curated Library;
- search the legacy `/Showdown visual` archive;
- only then ask for genuinely missing evidence.

## Prompt preservation

For important generated assets, preserve:
- asset ticket
- final accepted image
- generation date
- model family if known
- reference asset IDs
- acceptance notes

Do not depend on remembering the original chat prompt.