# JOB-1680 · transferSelector.js second-half gameplay audit

no findings

Reviewed `js/transferSelector.js` lines 169–336 (with surrounding helper logic for context). The three riskiest places checked:

1. **Keyboard selection and list state, lines 170–234.** Checked ArrowUp/ArrowDown active-index bounds, Escape dismissal, and Enter selection against the list's filtered options. No reproducible wrong selection or dead-end was established from this file.
2. **Focus, blur and double activation, lines 236–280.** Checked pointer selection versus delayed blur dismissal, repeated enhancement, event listeners, and document-level dismissal. Selection closes the list before any repeat activation can select again; no supported double-submit finding.
3. **Kind switches and persisted-value restoration, lines 282–329.** Checked league/nationality switching, canonical ID clearing, and stored-value resolution. The setters clear stale canonical IDs on kind change or unresolved options; no supported player-facing mismatch was established.

No gameplay source or tests changed.