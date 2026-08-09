# NEXT TASK

## Current gate: v0.95.0-r9 Workstream 5 — Season pre-commit review

Owner/browser accepted:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility;
- Workstream 4 / `0.95.0-r8` — Career Statistics/Trophy Room/Rivalry Statistics after Home-bootstrap stabilization.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r9`  
**Current workstream:** Workstream 5 — Season pre-commit review  
**Source status:** implemented and machine validation in progress/required on exact final head  
**Owner acceptance:** pending

Do not begin Workstream 6 until r9 has passed the real-browser Season Review acceptance below.

---

# What r9 changes

The old Season Results action immediately persisted a completed season after validation. That made an accidental checkbox/value entry irreversible before the user could see the calculated result as a whole.

r9 changes the sequence to:

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

The Review step is an in-place state of the existing `seasonEntry` screen, not a new navigation route.

## Review is non-persistent

Pressing **REVIEW SEASON**:

- validates both managers' required values;
- reads the current form values;
- calculates the existing locked scoring model;
- calculates the existing locked Season winner rule;
- creates an isolated memory-only snapshot;
- displays raw results, achievement states, all score components, Season score, projected winner and projected overall Showdown score;
- does **not** call `saveCurrentShowdown()`;
- does **not** append a round;
- does **not** advance `currentRound`;
- does **not** change Showdown status;
- does **not** create a new storage key.

## Edit Results is lossless

**EDIT RESULTS** returns to the same Season Results form without resetting the entered values. The previous review snapshot is discarded so a changed form must be reviewed again before confirmation.

## Final confirmation is the only persistence boundary

**CONFIRM & SAVE SEASON**:

1. verifies the same Showdown and Season are still active;
2. verifies the Transfer Challenge is still complete;
3. rejects a Season that has already been saved;
4. rebuilds canonical scoring/winner data from the reviewed raw values;
5. compares it with the deterministic review fingerprint;
6. blocks confirmation if the reviewed snapshot changed;
7. creates the completion timestamp only at confirmation;
8. enters the existing critical `persistCompletedSeason()` transaction;
9. retains the existing save-failure rollback for rounds/currentRound/status/completedAt/score;
10. opens the read-only Season Summary only after the critical save succeeds.

Double-submit protection remains active during confirmation.

If browser storage rejects the critical write, the save transaction rolls back and the review remains available to retry or edit.

---

# Presentation / loading contract

- `css/season.css` is lazy-loaded with the gameplay package; Home startup remains one local stylesheet + seven local scripts.
- Season Review stays within `seasonEntry`; `js/screens.js` remains sole route/history authority.
- Review UI has explicit Chromebook low-height, mobile and small-phone guards.
- Review does not introduce external imagery or a framework.
- Existing reduced-motion behavior remains authoritative.

---

# Reliability / diagnostics contract

`getSeasonReviewIntegrity()` verifies the dynamically-created Review UI and the Review/Confirm/Edit binding markers.

Runtime diagnostics check the Season Review APIs and controls whenever gameplay is loaded.

Dedicated workflow:

`.github/workflows/validate-season-review.yml`

It protects:

- canonical max-11 preview scoring;
- canonical Season winner;
- null preview completion timestamp;
- deterministic review fingerprint;
- final-confirmation timestamp creation;
- tamper/change blocking between review and confirmation;
- Review path forbidden from persistence;
- Confirm path as the only Season persistence boundary;
- existing rollback snapshot/restore contract;
- no new Season Review storage key;
- lazy Season Review CSS;
- diagnostic binding checks;
- Chromebook/mobile presentation guards;
- revision-independent behavioral validation.

The r8 Home-bootstrap gate is also revision-independent now; it continues protecting the seven media choices and Home startup contract across r9 and later cache revisions.

---

# r9 owner/browser acceptance checklist

Hard-refresh once so the browser receives `0.95.0-r9`.

Use a disposable Showdown if possible and test:

1. Complete the Transfer Challenge and reach **Season Results**.
2. Enter valid results for both managers.
3. Confirm the primary button says **REVIEW SEASON**.
4. Press it and verify a Review view appears instead of immediately completing the Season.
5. Verify every entered value is represented correctly: position, points, goals and all four achievement checkboxes for each manager.
6. Verify calculated scoring matches the locked rules and never exceeds 11.
7. Verify the projected Season winner and projected overall Showdown score are correct.
8. Press **EDIT RESULTS** and verify every form value is still present.
9. Change at least one value/achievement, press **REVIEW SEASON** again and verify the Review updates.
10. Press **CONFIRM & SAVE SEASON** once. Only now should the Season Summary appear and the Showdown score/round advance.
11. Refresh after confirmation and verify the saved Season/score survives correctly.
12. In a multi-season Showdown, verify the next Transfer Challenge begins for the next Season.
13. On the final Season, verify completion/archive/Completed Showdown Home still behaves correctly.
14. Try incomplete/invalid numeric input and confirm Review is blocked with the existing validation message.
15. Quickly double-click/tap final confirmation and verify only one Season is created.
16. Check Chromebook normal zoom and mobile for no overlap/clipping.
17. Smoke-check Home media, Career Statistics, Trophy Room, Legacy, Settings and Smart Back.

If any real r9 defect appears, remain in Workstream 5, identify the root cause, add deterministic coverage where possible, bump the runtime revision if deployed bytes change, and validate/deploy the same exact head.

---

# After r9 acceptance — Workstream 6

Workstream 6 is the final v0.95 polish/regression pass.

It now includes the owner-requested **quality-gated FIFA-era navigation feedback experiment** recorded in `ROADMAP_AMENDMENTS.md`:

- super-smooth football-game-style screen transition integrated with central routing;
- compositor-friendly animation only if it improves perceived quality;
- reduced-motion-safe behavior with no artificial delay;
- original/safely-created very short navigation click cue, never copied EA/FIFA audio;
- no autoplay, no stacked click sounds and no audio dependency that can block navigation;
- Chromebook/mobile performance acceptance;
- reject/simplify the feature if it causes lag, choppiness, route races or lower visual quality.

Workstream 6 also covers final accessibility/focus, responsive consistency, typography/contrast, performance, persistence/navigation/gameplay regression and final documentation synchronization.

After Workstream 6 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.