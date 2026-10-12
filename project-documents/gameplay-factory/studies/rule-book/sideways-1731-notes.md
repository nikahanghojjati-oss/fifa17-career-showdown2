# JOB-1731 · Rule Book sideways phone study (re-run of 1432)
- Fix from V_ADOPTION: Barlow, no page scroll at 844x390 and 740x360, six sections as tabs, only the inside of a card may scroll. Browser-checked in Chromium at 844x390, 740x360, 393x660, 360x640, 375x553: no page scroll, nothing cut off, BACK TO MAIN MENU always visible, all six sections checked one by one.
- Layout (sideways): left rail = eyebrow, RULE BOOK wordmark, tagline, summary, and BACK TO MAIN MENU at the bottom. Right = six numbered section tabs (3 x 2), then one big section card. Hub bar (HOME, CAREER, STANDINGS, STATS, RULES) under both, RULES current.
- Tabs are CSS radio buttons (no JavaScript); the card of the chosen section shows, section 01 first. All six sections stay in the page in live order 01-06.
- At every size checked, every section fits its card without scrolling; the card body has overflow-y:auto as a safety, so if a card ever gets too tall only its inside scrolls, never the page.
- All text is copied from js/ruleBook.js (all 25 rules, the five scoring rows, MAXIMUM PER MANAGER / SEASON 11, hero text, button) and checked string by string; none taken from the picture. The picture shows an accordion; the tabs here are the fix-line answer for sideways.
- Fonts: Barlow and Barlow Condensed from the shared font files. Art: ENV_SYS_PLATE (sideways) and TITLE_RULE_BOOK_V1 wordmark; nothing copied from real clubs.
- Portrait (393x660, 360x640, 375x553): title, tabs, one card, BACK TO MAIN MENU, hub bar, no scroll.
- Rule Book has no manager art or Daniel/Nik columns; the only mention is in text ("Daniel is Player One. Nik is Player Two.") and keeps the live order.
- Proposal: hub bar is 48px (44px under 375px tall) instead of 56px. Settings gear stays top right; the tab block leaves room for it.
