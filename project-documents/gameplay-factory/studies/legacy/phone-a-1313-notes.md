# JOB-1313 · Legacy phone study A (faithful) · notes

- Kept the approved PHONE_LEGACY layout: hero characters, three-tab bar, one archive card, pager, gold VIEW SEASON HISTORY, bottom tab bar.
- Daniel left, Nik right, not mirrored; both use the phone overlays from visual-assets/v10_1/legacy/assets.
- Text is from the live strings (visual-assets/v10_1/legacy/strings.json and the live legacy markup): BACK, Settings, LEGACY ARCHIVE / TROPHY ROOM / RECORDS, Showdown #1, score with en dash, "Daniel wins" with crown, "3 / 3 Seasons", VIEW SEASON HISTORY, HOME / CAREER / STANDINGS / STATS / RULES.
- Club names are placeholders (Club A, Club B); crests are neutral circles, no real crests.
- Active tab is CAREER (live nav state), not STANDINGS as drawn in the picture.
- Layout uses 100dvh with a flexible hero, so the title shrinks first and the button and tab bar stay on screen at 360x640, 393x660 and 375x553.
- No JavaScript, no sessionStorage, no edits outside the three named files.
