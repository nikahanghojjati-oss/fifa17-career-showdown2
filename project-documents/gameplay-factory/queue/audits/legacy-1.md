# legacy.js audit, first half (lines 1-293)

no findings

Riskiest places checked:
1. Lines 22-29 (`archiveCompletedSaveBeforeLegacy`): the archive is skipped only when id, updatedAt and completedAt all match. A completed save that changed after archiving is archived again, so the Legacy copy stays current.
2. Lines 208-234 (`deleteLegacyShowdownTransaction`): if the active completed copy cannot be cleared, the Legacy deletion is rolled back with the saved history. No half-deleted state was found.
3. Lines 194-206 (`populateLegacySeasonHistory`): the rendered flag stops season rows from being built twice when the details panel is opened again.
