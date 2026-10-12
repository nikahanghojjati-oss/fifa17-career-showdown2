# JOB-1670 — `js/backup.js` first-half gameplay audit

**Result: no findings.**

Reviewed lines 1–123 of `js/backup.js` (the first half of the 245-line file). No sufficiently supported player-visible gameplay bug was found in this range.

## Three riskiest places checked

1. **Raw backup authority and failed reads (`js/backup.js:44–68`):** Checked whether a failed Save Library projection or canonical-storage snapshot could silently produce a successful-looking export. Both paths explicitly throw on unsuccessful projection/snapshot, rather than quietly replacing unreadable source data.
2. **Corrupt or absent records (`js/backup.js:70–90`):** Checked JSON parsing, shape checks, warning capture, and recovery preservation for Save Library, active Showdown, legacy Showdowns, and preferences. Corrupt records are reported and their original raw bytes are retained in recovery metadata.
3. **Active-versus-legacy snapshot and counts (`js/backup.js:92–123`):** Checked active-state selection, legacy ID matching, and the reported active/legacy/profile/save counts for obvious off-by-one or duplicate-count errors. No reproducible user-facing discrepancy can be established from the audited first-half code alone.

No game files were changed.
