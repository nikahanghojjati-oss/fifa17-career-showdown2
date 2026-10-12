no findings

Three riskiest places checked:
1. `js/saveLibraryFoundation.js:67-80` — reuse or derivation of a Showdown's stable save ID; no definite identity collision or unintended reassignment from valid singleton records.
2. `js/saveLibraryFoundation.js:82-105` — migration of season records, checking positive round numbers, duplicate rounds, and stable season IDs; no confirmed off-by-one or lost valid season.
3. `js/saveLibraryFoundation.js:154-182` — canonical comparison, removal of exact duplicate Legacy entries, and rejection of conflicting IDs; no confirmed loss of a distinct valid Legacy record.
