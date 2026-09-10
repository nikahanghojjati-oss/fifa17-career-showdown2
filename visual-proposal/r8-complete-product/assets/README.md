# R8 Proposal Asset Package

This directory is for proposal assets only. Nothing here is production authority until the senior developer reviews and intentionally integrates approved files.

Recommended structure as assets are produced:

- `masters/` — immutable approved source masters such as exact A01/A02 bytes;
- `derivatives/` — non-destructive crops/masks/compositions derived from approved masters;
- `screen/` — screen-specific backgrounds, frames or generated art required by the asset matrix;
- `icons/` — original rights-safe iconography;
- `procedural/` — SVG or other rights-safe procedural visual assets;
- `previews/` — flattened previews for review only; never core UI authority.

Every non-preview asset must be recorded in the final asset manifest with stable ID, filename, dimensions, hash, provenance, rights status, intended screen/state, responsive eligibility and acceptance status.

Core UI text should remain DOM text and must not be baked into raster artwork.

Manager mapping is fixed: Manager 1 = Daniel; Manager 2 = Nik.
