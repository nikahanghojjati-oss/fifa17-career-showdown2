# C2W-006 · Sol chat: package notes (text only, one turn)

Repository `nikahanghojjati-oss/fifa17-career-showdown2`, branch `factory/v1-wtt5ye` only (never main). Text files only. Save each file once; if GitHub refuses a save, re-read that file and try once more, then stop and say which file was not saved.

A Claude Code session (CC-008) is fixing screen CSS/JS at the same time. **Do not touch any `.css`, `.js` or `.html` file.** You only write the five Markdown files below.

## Read (only these)

1. `project-documents/factory/PRODUCT_TRUTH.md`
2. `visual-assets/v10_1/legacy/TRUTH.md` (the shape to copy)
3. `visual-assets/v10_1/loading/loading.css` and `visual-assets/v10_1/shared/MOTION.md` (only the timing numbers)
4. `project-documents/factory/PACKAGE.md` (section "Known gaps")

## Write

1. `visual-assets/v10_1/home/TRUTH.md`, `visual-assets/v10_1/league/TRUTH.md` and `visual-assets/v10_1/club/TRUTH.md`. Use the same headings as the Legacy file. Write what the screen must show, using PRODUCT_TRUTH only. Home: the 7 destinations (Continue dominant), the Audius music card that plays the 4-song playlist and has no YouTube, and the top nav. League: the five league marks (PL Crown, LaLiga Bull, Bundesliga Schale, Serie A Shield, Ligue 1 numeral "1") inside the wheel, then Spin and Back. Club: the two sealed club packs, Daniel left and Nik right. Each file is at most 40 lines.
2. `visual-assets/v10_1/loading/BUILD_RESULT.md`: add a section `## Motion` at the end. Take the entrance total, first usable point, stagger, easing and reduced-motion path from the timing values in `loading.css`. Compare each one with MOTION.md and mark it `matches` or `differs (why)`. Never invent a number you did not read.
3. `project-documents/factory/PACKAGE.md`: replace the "Known gaps" list with lines that are true now:
   - jobs 108-110 are done (FINAL_REVIEW.md: every hard gate passes);
   - the League, Club and VS brush wordmark pictures were never made, so those screens use a font stand-in;
   - the CC-008 polish session is fixing the phone heroes, Home phone spacing and the Rivalry desktop lighting;
   - fixture data is Team G's candidate data, with no History backfill.

   Also add a section `## Music`: the Home soundtrack is `home/soundtrack.js`, with 4 Audius tracks whose ids are in `home/fixtures.json` under `strings.media`. At integration it must keep playing across screens. Main's 6 YouTube songs and the FIFA 17 trailer are not carried over (owner's decision, 04 Oct 2026).
4. `project-documents/factory/HANDOFF_TO_SOL.md`: add the same `## Music` paragraph at the end.

End with one line: `C2W-006 done: <files saved>.`
