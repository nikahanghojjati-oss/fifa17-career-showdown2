# R88 Icon Unmasked test fixtures: made-up players

Every player, number, nation pairing and link in these CSVs is invented for tests. None is a real footballer or a
real card, and the links point at example.com. The real list comes from GPT's R88-ICON-01 job, checked by
`scripts/r88-icons-from-csv.mjs` (run it with `--last-prime-game "FIFA 23"` for these files).

The rows cover what the checker and `js/iconNames.js` must handle: accents and special letters (Ř, Ø, Ć, ß), an
apostrophe and hyphens, a nickname, two names that start the same (Pelinho, Pelão), a home nation (GB-SCT), a
nation that no longer exists (SU), a tie on overall that the newer game wins, and each card version.
