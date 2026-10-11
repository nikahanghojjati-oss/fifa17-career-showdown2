# JOB-1492 · importAnalysis.js second half audit

Read: `js/importAnalysis.js` lines 476 to 952 (the second half of 952 lines).

## Finding 1 · PROBABLE · CLEAR PREVIEW during an analysis brings the old result back

- **File and line:** `js/importAnalysis.js` lines 896-907 (the ANALYZE handler) and lines 926-934 (the CLEAR handler). `selectFile` at line 862 leaves CLEAR enabled while a file is selected, so it is enabled during an analysis.
- **What the player sees:** the player chooses a backup, taps ANALYZE BACKUP, then taps CLEAR PREVIEW before the analysis finishes. CLEAR shows "Preview cleared" and the file label reads "No file selected". A moment later the verdict for the cleared file appears, and the status changes to "Preview complete". If the player picks a different file during the analysis, the old verdict also lands under the new file name. On a 5 MB backup this window is long enough to hit.
- **Why the code does it:**
  ```
  const analysis = await analyzeCareerModeBackupFile(selectedImportFile);
  renderImportAnalysisResult(result, analysis);
  ```
  The render uses the analysis of the file the player has already cleared or replaced, and nothing checks that the file is still the selected one.
- **Smallest change:** in the ANALYZE handler, keep `const file=selectedImportFile;` before the `await`, and after the `await` return early when `selectedImportFile!==file` (skip the render and the status text, and still run the `finally` reset). Clear the selection through the same check so a stale result never renders.

## Riskiest places checked (no other real bug found)

1. Lines 507-527 (format and checksum gating): an unsupported or newer format version is rejected before checksum work. The checksum is verified on a clone, and the payload is read only after it passes.
2. Lines 575-600 (Legacy duplicate groups): identical duplicates within one backup are warned and marked `exact`, and conflicting duplicates are blocked and marked `conflict`. Both paths use the same ID grouping, so the counts match.
3. Lines 599-611 (active preview): a corrupt active slot is shown as "replace uncertain" and never as "add". The preview-only labels never change browser storage.

No game file was edited. This job adds one audit file only.
