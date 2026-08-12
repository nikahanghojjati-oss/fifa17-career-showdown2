# Career Mode Showdown — Historical Owner Decision Index

Date: 2026-08-12
Purpose: source-index companion for the master developer handoff.

This file captures high-value owner instructions recovered directly from the official ChatGPT export. It intentionally excludes unrelated conversation and repetitive “continue/build” messages except where they establish development philosophy.

## Source hierarchy warning

This is historical context, not a replacement for current source or current authority docs.

If a historical instruction conflicts with current verified implementation or a later explicit owner decision, the newer authority wins.

## Source A — Website Creation and Guide

Conversation ID: `6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`

Active-path user messages recovered: 176.

### User turn 1 — original product boundary

Owner requested a free-hosted FIFA 17 Career Mode Showdown tracker for a competition against a mate, with multiple wheels and tables for statistics/points.

**Still authoritative in spirit:** yes.

### User turn 2 — core competition blueprint

Owner established:

- only two people;
- FIFA 17 nostalgic menu/interface direction;
- six-wheel concept at the time: top-five League wheel plus League club wheels;
- CL 5 / League 3 / Cup 1;
- paired bonus caps;
- 0-point tiebreak concept using league position then points;
- each player uses their own FIFA 17 save;
- 15-minute Transfer period;
- maximum three signings;
- three opponent guesses by League/Nationality;
- correctly guessed signing released;
- FIFA matches themselves are external/manual to the website.

**Current interpretation:** competition context remains; implementation details have since matured into reusable wheel/route architecture and current exact scoring/tiebreak contracts.

### User turn 26 — copyright-aware media principle

Owner asked whether the public FIFA 17 YouTube trailer could be embedded or used as inspiration, but explicitly said not to do it if it would break the project.

**Durable intent:** nostalgia/media is subordinate to legality, reliability and project integrity.

### User turn 33 — same-league + bonus-cap correction

Owner emphasized:

- both managers’ teams must come from the same League;
- Showdowns may be one or multiple Seasons;
- CL 5 / League 3 / Cup 1;
- 100 points/goals pair max one point total;
- Top Scorer/Assist pair max one point total.

**Current status:** locked, with lengths now specifically 1 / 3 / 5 / 10.

### User turn 38 — club reuse

Owner explicitly allowed club reuse across separate Showdowns.

**Current status:** locked.

### User turn 40 — deliberate exclusions

Owner explicitly said they did **not** want:

- screenshot uploads;
- match notes.

**Current status:** screenshot uploads remain outside the canonical product. Later roadmap allows optional Season notes/moment labels in Legacy 2.0; that later scoped roadmap supersedes the blanket “no notes” only for future local authored history, not for image-upload clutter.

### User turns 44, 50, 53 — complete-file workflow origin

Owner repeatedly requested complete updated files rather than partial index edits because partial edits were causing uncertainty/bugs.

**Current evolved status:** direct GitHub implementation is now preferred, which is the stronger solution to the same failure mode.

### User turn 59 — Chromebook tooling constraint

Owner reported the Chromebook did not have an F12 key while debugging the non-working wheel.

**Durable implication:** do not make acceptance depend on desktop-devtools-only workflows. Chromebook/browser-visible diagnostics and automated browser tests matter.

### User turn 60 — Wheel presentation

Owner wanted League names presented on/in the rotating wheel rather than as detached text below it.

**Current status:** visual intent absorbed into current wheel presentation; do not regress to a disconnected utilitarian selector.

### User turn 69 — FIFA 17 tile interface

Owner explicitly approved the FIFA 17 tile-based interface direction.

**Current status:** core visual design principle.

### User turn 72 — permanent clubs + FUT reveal + deletable test history

Owner explicitly clarified:

- FUT-pack-like club assignment/reveal desired;
- all Seasons in a Showdown use the same two clubs;
- example: Chelsea vs Liverpool for a 10-Season Showdown stays those clubs for all 10;
- specific Showdown history should be deletable so test data can be cleaned up.

**Current status:** permanent-club and reveal semantics locked; Legacy management supports specific deletion.

### User turn 74 — navigation + two-player participation

Owner requested usable Back navigation and a flow where the two participants can enter/start the rivalry together.

**Current status:** Smart Back is centralized; present mode remains one browser/device shared by two managers.

### User turn 75 — one-device now, later option deferred; Showdown Home chosen

Owner chose the current one-device option and deferred the more advanced alternative to later versions. Owner also chose the dedicated Showdown Home screen.

**Current status:** foundational roadmap decision. Future paired-device work remains deferred to v2.0+.

### User turns 91–142 — context-loss and anti-loop origin

Owner encountered a new chat that could not reconstruct the architecture, then repeatedly requested a comprehensive Project Bible/handoff capable of preserving the full development direction without falling into repetitive planning loops.

Owner later tried the onboarding material and reported that a new chat still did not understand the whole design well enough, asking the original environment to continue building instead.

**Current status:** direct historical cause of the repository-owned bootstrap + public golden handoff system. Documentation must preserve both current state and causal intent.

### User turn 145 — selected League screen stalled

Owner reported the League Wheel selected a League but then remained stuck.

**Historical impact:** this was an early flow/routing defect. Later versions introduced clearer route state, and ultimately explicit League confirmation became protected rather than relying on hidden timing/auto-advance behavior.

### User turn 150 — “Complete Season” did nothing; freeze feature growth

Owner asked for repository-wide root-cause inspection and specifically said **no advancement/new feature work** at that stage—only bug repair and repolishing.

**Durable philosophy:** reproduced broken core flow outranks roadmap feature expansion.

### User turns 152–154, 158, 160 — performance-before-features doctrine

Owner repeatedly requested:

- lower lag during data entry;
- lighter runtime;
- major bug fixes;
- no feature sacrifice;
- no new features until current flow/performance was clean.

**Current status:** represented by eager startup budgets, lazy modules/media and maintenance lanes.

### User turns 155–157 — soundtrack/trailer with lightweight constraint

Owner requested:

- Two Door Cinema Club “Are We Ready? (Wreck)” menu integration through a safe media route;
- FIFA 17 gameplay trailer option;
- additional well-known FIFA 17 soundtrack choices;
- stronger FIFA 17 menu colour/Reus feeling;
- all while keeping the site light and smooth.

**Current status:** external media remains user-initiated/lazy and copyrighted audio is not bundled directly.

### User turn 159 — legal visual resemblance + readability constraint

Owner requested closer FIFA 17 typography/colour/logo/presentation influence **without copyrighted material**, and explicitly said fonts should be changed where they make sense rather than blindly everywhere, with contrast/playability/functionality preserved.

**Durable visual rule:** fidelity is bounded by readability, function, rights safety and performance.

### User turn 161 — Smart Back and end-of-flow failure concern

Owner called out Back navigation landing nowhere and post-Showdown flows freezing on random pages, asking for the whole repository/state to be understood rather than patched locally.

**Current status:** one reason `js/screens.js` is sole route/history authority and canonical route resolution is protected.

### User turn 162 — return to blueprint after patch pressure

Owner explicitly asked the developer to re-evaluate exact project state and original planning after many patches so the project did not become sidetracked.

**Current status:** anti-loop / roadmap-first maintenance doctrine.

### User turn 163 — Chromebook regression + praise for anti-loop recovery

Owner said the site looked good on mobile but not Chromebook Chrome, with section overlap and poor music-tile placement. Owner also explicitly praised returning to the original long-term roadmap while preserving lessons from patches.

**Current status:** Chromebook/windowed browser remains first-class; temporary fixes must feed the long-term architecture, not replace it.

### User turn 164 — FUT reveal still too basic

Owner said club selection remained basic and FUT-style reveal still needed to be in the roadmap.

**Current status:** later sealed two-pack reveal fulfills this direction.

### User turn 166 — version-integrity mismatch + Chromebook reveal alignment

Owner reported:

- `Application integrity check failed. version mismatch: runtime version is 0.95.0`;
- club reveal boxes misaligned on Chromebook;
- reveal animation visually weak.

**Historical impact:** runtime/cache identity became a serious release contract rather than decorative version text.

### User turn 167 — Rule Book contrast

Owner requested stronger Rule Book font colour distinction and a repository-wide visual bug inspection.

**Current status:** accessibility/contrast belongs to visual quality, not a separate optional polish tier.

### User turn 168 — roadmap amendment cluster

Owner requested future/incremental integration of:

1. more FIFA 17-like typography/styling where readable and functional;
2. **Guess screen first, Signing screen second**;
3. League/Nationality selectors rather than typing, covering FIFA 17-era League/nationality data;
4. non-generic club visual identity rather than a two-colour/two-letter badge where feasible;
5. slow two-pack reveal for suspense;
6. these items should be placed at appropriate roadmap points rather than all forced into one build.

Owner explicitly connected Guess/Signing separation to eventual two-device privacy.

**Current status:** Guess→Signing phase separation, canonical selectors, procedural club identity and two-pack reveal are now implemented/protected; future two-device privacy builds on them.

### User turn 173 — integrity checker found missing media UI/bindings

Owner reported an application integrity failure involving:

- missing `menuMediaSelector`;
- unbound `menuMusicToggle`;
- unbound `menuMusicMute`;
- zero media choices instead of expected choices.

Owner asked not merely for a patch but for the reason and a prevention mechanism.

**Historical impact:** first-party runtime diagnostics/integrity checks are part of product reliability and later error-provenance hardening.

### User turn 174 — smooth route transitions/click feedback conditional on perfection

After passing r8, owner asked to add FIFA-like transition animation and short click feedback at the appropriate roadmap point **only if it could remain sleek/smooth and not reduce quality**.

**Durable rule:** micro-interactions are optional enhancement, not justification for choppy/laggy behavior. Reduced-motion remains protected.

### User turn 175 — unwanted automatic transition to Club Assignment

Owner reported that the screen moved immediately to club selection instead of waiting for the required button/confirmation and asked for the bug to be fixed.

**Historical impact:** explicit League selection confirmation is an owner-validated interaction checkpoint; do not reintroduce timer-based auto-advance.

### User turn 176 — maximum conversation length

Owner reported reaching the conversation maximum and asked for a solution.

**Historical impact:** repository-owned handoff/continuity became mandatory, eventually formalized in `00_HANDOFF_GOLDEN_RULE.md`.

## Source B — Career Mode Showdown Dev

Conversation ID: `6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`

Active-path user messages recovered: 19.

### User turn 1 — continuation contract

Owner instructed the developer to inspect current GitHub `main`, continue from `NEXT_TASK.md`, preserve accepted decisions and continue in the established style.

**Current status:** canonical continuation philosophy.

### User turns 2–5 — acceptance, merge, browser-first quality

Owner repeatedly requested maximum accuracy, real browser/live testing and merge/deploy only after work passed.

**Current status:** evolved into permanent workflow matrices and deployed smoke tests.

### User turn 6 — repository-wide maintenance before feature growth

Owner asked for:

- full troubleshooting;
- redundancy cleanup;
- bug/maintenance issue detection;
- broken route fixes;
- live browser verification;
- continued roadmap progression only after the base was healthy.

**Current status:** maintenance lane + source-first root-cause work.

### User turns 9–10, 13–14 — push/PR/merge/deploy/release transaction

Owner explicitly authorized repository delivery workflows and asked for PR, checks, merge, deploy and live verification.

**Current status:** direct GitHub execution is expected when tooling permits; expected-head protection and real authentication boundaries still apply.

### User turn 11 — stable-release visual priorities

Owner added two strong v1 stable priorities, especially:

- main menu layout/size/appearance on Chromebook;
- FIFA 17-inspired metallic/pale shell and colour treatment;
- Marco Reus as major Home/loading identity;
- cinematic loading presentation.

**Current status:** protected Home/loading visual identity, with later clean-anchor refinements.

### User turns 15–16 — external Grok critique culture

Owner supplied Grok analysis and explicitly asked the developer to:

- extract valuable feedback;
- push back against shallow understanding;
- deepen planning;
- continue building rather than simply agreeing with the external review.

**Current status:** external critique is input, not authority.

### User turn 19 — Reus visual regression and broader imagery direction

Owner said Reus Home/loading brightness/contrast/composition was wrong and loading crop cut part of his head; owner wanted longer loading immersion and broader appropriately licensed football imagery, plus deeper FIFA 17 menu study.

**Current status:** triggered the Reus/visual correction lineage and licensed-image architecture that later produced r3/r4/r5/v1.0.2 lessons.

## Source C — Career Mode Showdown — Master Development Continuation

Conversation ID: `6a79ea21-093c-83ea-b00d-055524fb259a`

Active-path user messages recovered: 11.

### User turns 1–4 — environment continuity concern

Owner was concerned that losing Work usage/context might materially degrade project quality and repeatedly asked whether the same project attention/detail could be maintained.

**Durable implication:** continuity quality must be demonstrated by source inspection, handoff discipline and tests—not by reassurance or model-label claims.

### User turn 5 — exact continuation request

Owner asked for full inspection of Home/loading Reus regression, no breakage, stronger FIFA 17 fidelity and continuation from the prior Work environment.

### User turn 6 — screenshot contradicts first fix

Owner supplied screenshot evidence that Reus opacity still looked wrong and requested deeper investigation.

**Historical impact:** exposed pale overlay after literal opacity had already been corrected.

### User turns 7–8 — owner rejects overly narrow opacity route

Owner said the route taken on Reus was likely wrong and reminded the developer that the broader request included multiple footballer images/visual immersion work.

**Durable lesson:** when owner evidence invalidates a failure model, reclassify the defect instead of polishing the same diagnosis.

### User turn 9 — roadmap must be recovered before more work

Owner asked for the latest roadmap from the previous Work environment to be fully studied and integrated into future planning.

**Current status:** future work remains dependency ordered.

### User turn 10 — explicit historical-chat deep-dive request

Owner said the assistant’s reasoning had improved with better context and asked it to fully study:

- `Website Creation and Guide`;
- `Career Mode Showdown Dev`.

That could not be completed at the time because those chats were max-length/locked.

**2026-08-12 status:** completed through the official account export and recorded in the master handoff package.

### User turn 11 — export recovery question

Owner asked how to obtain the full locked chats.

**Historical impact:** led directly to the official ChatGPT export now used for this index.

## Project r4 Visual Fixes — source limitation and repository reconstruction

The exact raw `Project r4 Visual Fixes` conversation is not present in the 2026-08-10 export snapshot.

Do not fabricate turn numbers for it.

Use repository records produced around the work instead, especially:

- `CAREER_MODE_SHOWDOWN_ROLLING_HANDOFF_2026-08-11_R4.txt` from the supplied history package;
- `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md`;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`;
- r4/r5/v1.0.2 release/handoff records;
- current source/asset manifest.

Those sources establish the critical r4 lineage:

- PR #9 r3 was technically green yet failed owner visual acceptance;
- r4 corrected the portrait-to-wide `cover` architecture and improved provenance/error handling;
- r4 itself remained technically green but owner visual acceptance stayed separate;
- later owner feedback rejected r4 James/Rashford/Martial source choices and required fresh sources/smart authored crops;
- r5/v1.0.2 evolved the current authored-derivative, `contain`, clean-anchor and face-safe rules.

## Final use rule for future developers

This index is most useful when a question sounds like:

- “Why is this rule so strict?”
- “Could we simplify this interaction?”
- “Did the owner actually ask for this?”
- “Is this old idea still valid?”
- “Why do we have this gate?”

For implementation behavior, always return to current source/current authority after learning the historical reason.