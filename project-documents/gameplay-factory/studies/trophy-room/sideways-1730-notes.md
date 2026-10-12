# JOB-1730 · Trophy Room sideways phone study (re-run of 1345)
- Fix from V_ADOPTION: no page scroll at 844x390 and 740x360, and BACK / MORE off the tabs and trophy cards. Browser-checked in Chromium at 844x390, 740x360, 393x660, 360x640, 375x553: no page scroll, nothing cut off, BACK always visible.
- Layout (sideways): left stage = title, Daniel LEFT, Nik RIGHT, hero trophy and plinth between them. Right cabinet = five tabs in one row, then all four trophy cards in one row (big trophy on top, name, Daniel left / Nik right counts).
- BACK (wide) and MORE sit in their own full-width row under both columns, above the 48px hub bar (HOME, CAREER, STANDINGS, STATS, RULES). They never touch a tab or a card.
- Same order of taps as the live screen: tabs, cards, BACK, MORE, hub bar. MORE swaps to CLOSE and opens CAREER DETAILS (ranks) with a CSS checkbox; tabs filter the cards with CSS radio buttons. No JavaScript.
- Barlow / Barlow Condensed from the shared font files. Text taken from js/careerScreensV10.js (strings, CAREER DETAILS sheet) and visual-assets/v10_1/trophy-room/trophy-room.js; nothing copied from the picture. Counts are plain numbers and "Not won yet" has a reserved row so the empty-career state fits too (checked).
- Portrait (393x660, 360x640, 375x553): stage on top, 3 + 2 tabs, 2 x 2 cards, BACK and MORE, hub bar - all without scroll.
- Sample numbers (1/-, 2/1, 2/-, 1/1 and ranks 20 / 10) are placeholders for layout only. The ALL-TIME RECORDS ribbon is not drawn: it only exists when the career has records.
- Proposal for Team V: hub bar is 48px (44px under 375px tall) instead of 56px so the cards keep their height at 390 and 360 tall.
