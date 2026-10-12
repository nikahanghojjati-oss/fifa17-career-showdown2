# JOB-1683 · saveLibraryFoundation.js second-half gameplay audit

no findings

Reviewed `js/saveLibraryFoundation.js` lines 201–399, using the preceding migration and identity helpers to check context. The three riskiest places checked:

1. **Active versus legacy identity mapping, lines 201–249.** Checked that the active save gets profile references, historical records with the same Showdown ID share those references, and unrelated historical records remain explicitly marked for mapping. No supported player-visible identity swap was established.
2. **Existing Save Library validation, lines 252–328.** Checked invalid JSON, missing IDs, duplicate save IDs, missing manager-profile references, inconsistent save identity, and duplicate season IDs. The guard paths reject the tested invalid shapes rather than silently loading them; no supported wrong tally or irrecoverable screen state was established.
3. **Raw migration recovery boundary, lines 330–379.** Checked already-migrated paths, corrupt singleton and legacy JSON, migration exceptions, candidate verification and expected source snapshots. The function returns a migration plan, rather than mutating storage directly; no supported duplicate-commit or erased-save path was established here.

No gameplay source or tests changed.