# JOB-1432 · Rule Book sideways phone study
- Reference: live Rule Book wording from `js/ruleBook.js`, with typography and artwork paths from the approved v10 Rule Book styles.
- Six sections remain in the live order 01–06; all 25 rule statements and five scoring entries retain their original text and values.
- At 844×390 the section cards form two columns next to the title rail; one continuous document scroll reveals every rule.
- The primary BACK TO MAIN MENU action stays fixed above the five-tab phone hub bar at widths ≤900px.
- At 393×660, 360×640, and 375×553 portrait layouts the outside page fits the viewport, while the long rule collection scrolls internally so no text is clipped.
- One deliberate compromise: all six full-text rules cannot simultaneously fit inside a 553–660px phone viewport, so inner scrolling preserves legibility and every word instead of hiding or altering game rules.
- The approved `PHONE_RULE_BOOK.png` was verified in the Team V branch by GitHub blob SHA, but connector preview returned no usable image bytes; final pixel-level review against that mockup remains for Team V.
- Static study only: no JavaScript, app code, navigation wiring, or gameplay changes.
