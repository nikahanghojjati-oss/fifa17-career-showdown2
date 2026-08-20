# Project Handoff Mirrors

This folder is the persistent project-document mirror for complete successor handoffs.

From this checkpoint forward, every full successor handoff must be produced in two byte-identical locations during the same clean-checkpoint packaging operation:

1. repository root: `SUCCESSOR_HANDOFF_...md`
2. this folder: `project-documents/handoffs/SUCCESSOR_HANDOFF_...md`

The exact same filename must be used in both locations.

After creating both copies, update `SESSION_BOOTSTRAP.json` so its `currentHandoff.canonical` and `currentHandoff.projectMirror` fields point to the newest handoff.

Do not create a separate documentation-only milestone solely for this mirror. Refresh it as part of a genuine handoff/checkpoint.

For fastest successor startup, read `00_SESSION_BOOTSTRAP.md` and `SESSION_BOOTSTRAP.json` before loading large historical documents.
