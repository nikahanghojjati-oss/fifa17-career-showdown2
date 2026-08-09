# NEXT TASK

## v0.16.0 owner regression validation

Do **not** begin a new feature milestone yet.

The next task is to validate the current v0.16.0 stabilization build in the browser and fix any regression found while preserving the existing architecture and locked rules.

Required regression path:

1. Hard refresh the GitHub Pages site.
2. Confirm Home loads and remains responsive before gameplay is entered.
3. Create a new showdown.
4. Use Back from Create and reopen Create.
5. Start showdown and spin League Wheel.
6. During a league spin, verify Back is unavailable and no stale callback changes another save.
7. Continue to Club Assignment.
8. Use Back before club reveal; confirm safe return to League without changing the selected league.
9. Reveal clubs; confirm two different clubs from the selected league and permanent lock.
10. Confirm Club Assignment Back becomes unavailable once clubs are locked.
11. Continue to Showdown Home.
12. Start Transfer Challenge; start timer; navigate Home and resume; timer must use real deadline and not duplicate intervals.
13. Enter partial transfer data, Back to Home, reopen; draft data must persist.
14. Complete transfers; obsolete transfer route must not be resurrected by Back.
15. Enter partial Season Results, Back to Home, reopen; same-showdown/same-season form must remain.
16. Complete season; verify Season Summary and cumulative score.
17. On a multi-season showdown, start next season and repeat transition once.
18. Complete the final season.
19. Confirm final Summary → completed Showdown Home.
20. On completed Showdown Home confirm:
    - View Final Season Summary
    - Legacy
    - Trophy Room
    - Rivalry Statistics
    - New Showdown
    - Main Menu
    all have a valid route and no dead/frozen page.
21. Refresh browser with the completed showdown active; Continue Career must land on completed Showdown Home.
22. Exercise Back on Statistics, Trophy Room, Legacy and Rule Book; each must return to its safe parent.
23. Test soundtrack selection, Play/Pause/Mute and trailer; no media iframe before Play.
24. Test specific Legacy delete, Delete All Legacy, and full reset using disposable test data.
25. Confirm existing scoring remains max 11 and grouped bonus rules remain unchanged.

If a regression is found:

- inspect current `main` first;
- fix the root cause, not a symptom;
- preserve all current features and locked rules;
- run/inspect the GitHub Actions validation on the exact resulting head;
- do not return to planning loops.

If the owner confirms this regression passes, then inspect the current Project Bible/state and advance to the next unfinished product milestone.
