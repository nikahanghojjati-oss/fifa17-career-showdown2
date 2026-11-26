# W3-8 tablet and sideways proof (claude-gameplay/r87-proof-sizes)

- PR #1129 into gameplay/r87, head (see PR). Codex: 3 tool findings fixed. New files only. @codex review requested.
- Base: gameplay/r87 73713d75. Emulator only.
- Full report and shots: audit/r87-proof-sizes/REPORT.md on the branch.

## Proven

- 820x1180 + 844x390 full 1-season CE2PG run: PASS 182/182, every screen shot.
- 768x1024 + 740x360 run: every screen shot.
- Rule Book, Music, Settings and career pages shot at all 5 sizes.

## Findings

- **F1 (High):** at 768x1024, 820x1180, 844x390 and 740x360, Season Results arrives black. #stage-root.v10SeasonStage has computed opacity 0 with no animation running. Owner: whoever owns js/seasonFinalV10.js, or Polish.
- **F2 (High):** at 1920x1080, LOCK MY GUESSES moves about 64 px when guess 1 fills. The tap lands on the empty panel, so nothing locks and CE2PG stops there 4 of 4 times. At 1280x800 the same step passes. Owner: Transfer screen (Polish).
- **F3:** at 1920x1080 the "Waiting for Nik" low strip covers SPIN WHEEL and BACK, and its status line is cut off.
- **F4:** the Waiting panel is mid-screen on tablet and 3 to 6 px wider than the screen at 820 and 740 wide (sideways scroll).
- **F5:** on tablet Home, a dark tagline box sits on Daniel's face and Nik's face is cut off at the right edge.
- **F6:** Rule Book sideways has an inner scroller, so `main` is not the only scroller.
- **F7 to F10 (low):**
  - F7: Legacy title over Daniel's hand.
  - F8: Nik's Club Assignment card is faded (dimming?).
  - F9: Nik's revealed club name is blank at 820x1180.
  - F10: Transfer at 740x360 has an empty column with near-invisible text.

## Not proven

- Real devices.
- 1920x1080 after Transfer guesses (blocked by F2).
- F11: at 844x390, LOCK MY SIGNINGS sits over REFRESH CHALLENGE on Transfer signings.
