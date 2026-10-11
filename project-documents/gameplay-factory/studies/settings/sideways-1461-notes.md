# Settings sideways (JOB-1461) notes
- Decision: a two-column landscape layout at 844x390. The left column holds the header and the ACCOUNT panel with its sign-in button. The right column scrolls once and holds APPLICATION, ACCESSIBILITY and CAREER DATA. DONE stays visible at the bottom right.
- The main action (SIGN IN WITH GOOGLE) is always on screen, on the left.
- Every live element and label is kept, in the live order (account, application, motion, data, done).
- Text is the live text. Run-time values are [live value]. Panel headings use the condensed face (Team V note).
- Not measured in a browser. The right column scrolls inside the frame, so the "one page scroll" target is approximated, not verified.
- No tab bar: Settings is an overlay.
