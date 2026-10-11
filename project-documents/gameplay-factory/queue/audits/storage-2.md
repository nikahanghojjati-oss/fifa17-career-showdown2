# storage-2 (JOB-1556): second-half audit of js/storage.js

## Finding 1 (PROBABLE): clearing the active showdown can leave the old showdown in the singleton key and bring it back on reload
- File and line: js/storage.js line 46, `clearSavedShowdown`.
- What the player sees: when a Save Library exists, "clear" only clears the library's active entry and returns. If the old `careerModeShowdown.activeShowdown` key is still present, `loadSavedShowdown` (line 45) reads that singleton first, so the cleared showdown can reappear after a reload.
- Why: `if(snapshot.raw.saveLibrary!==null)return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.clearActiveShowdown());return removeStorageValue(STORAGE_KEY);`
  The singleton is only removed on the no-library path. Whether both keys can coexist depends on the migration; this needs a check of that path before it is treated as SURE.
- Smallest change: after a successful library clear, also `removeStorageValue(STORAGE_KEY)` when it is not null, with restore on failure as `clearAllCareerModeData` already does on line 60.

## Finding 2 (PROBABLE): a corrupt Legacy history reads as empty, and the next Legacy write replaces the broken raw value
- File and line: js/storage.js lines 51-52, `loadLegacyShowdowns` and `saveLegacyShowdowns`.
- What the player sees: if the Legacy history is damaged, the player sees an empty history and an error notice. A later archive or delete writes a fresh list, so the old records cannot be recovered by hand.
- Why: `catch(error){reportStorageError("Unable to parse Legacy history",error);legacyCache=[];return [];}` and `saveLegacyShowdowns` then calls `writeStorageValue(LEGACY_STORAGE_KEY, JSON.stringify(safeShowdowns))` with no check of the old raw value.
- Smallest change: before the first Legacy write after a parse failure, keep the damaged raw text under a backup key (or refuse the write and show a notice), so no records are dropped silently.

Riskiest places also checked: the restore transaction wrapper (lines 57-59) and `invalidateRuntimeAfterCriticalRecovery` (line 58), which clear caches and reset state on the critical-failure path.
