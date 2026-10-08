# Problem Z — Evidence register

**Status:** Initial corpus only (2026-10-08). **Branch-source basis:** `main` at `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` (the research branch originated at that head). **Evidence tiers:** O owner report/photo; S code/docs source; T deterministic/browser reproduction; P authorized genuine production/physical observation; H hypothesis only.

## Owner-observed corpus (O — descriptions only; screenshots are in the original conversation, not copied into the public repo)

| ID | Evidence | Supports | Does NOT establish |
|---|---|---|---|
| O-01 | Owner reports Run 1 on Daniel's tablet: Transfer War Room cards didn't fit; game couldn't safely continue; refresh lost continuity. | Usability and continuation failure during a physical two-person run. | Device resolution/browser details, server cause or code root cause. |
| O-02 | Tablet photo of Transfer War Room shows the error: "Shared Transfer Challenge league action failed. Complete signing 1 with player name, previous league and nationality." | A displayed field/validation failure during transfer stage. | That clipped UI alone caused the validation failure; which signing field/canonical value was missing. |
| O-03 | Owner reports Run 2 lost continuity after league/club draw and Continue Career, forcing repeated pairing/setup. | Resume failure during another physical run. | Whether remote state actually reset vs local navigation displaying another route. |
| O-04 | Owner reports Run 3 Home sign-in disappeared and "Season 1/1" remained. | Account UI/season indicator disagreement. | That account was really signed out, that no user badge DOM node existed, or which script failed. |
| O-05 | iOS screenshot shows overlay "CONNECTING / Opening Google sign-in…" on the hosted site. | A sign-in UI pending state was visible. | Whether Google popup was never opened, remained blocked, succeeded, or provider bootstrap failed. |
| O-06 | Owner reports attempts with other accounts, browsers/devices and Settings sign-in didn't make the game recognize the manager. | Severe repeated user-visible login/re-entry failure. | Which exact provider codes/states each attempt returned. |
| O-07 | Wide screenshot shows narrow "DEVICE / OFFLINE APP" box over stadium/background. | A Settings-derived older module became visible in an unexpected narrow layout. | Exact DOM location, applied styles, service-worker revision or its role in auth. |

## Repo-source anchors (S — at recorded code base; click through for precise lines)

| ID | Anchor | Supported statement | Boundary |
|---|---|---|---|
| S-01 | [index.html lines 41–45](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L41-L45) | Home has `#topHeader` and static `#seasonIndicator`; no hard-coded sign-in badge in that section. | Does not prove what DOM looked like in the user's browser. |
| S-02 | [onlinePlayerIdentity.js line 42](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L42) | Sign-in badge is dynamically inserted near `seasonIndicator` by identity module. | Root cause requires initialization trace. |
| S-03 | [onlinePlayerIdentity.js lines 49–50](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L49-L50) | Popup message precedes `resolveOnlineDependencies()`, `account.signIn()`, and `initializeOnlineIdentity(true)`; returned signIn state is not inspected here. | Does not by itself prove popup gesture loss. |
| S-04 | [sparkConnectedAccount.js lines 154–184](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/sparkConnectedAccount.js#L154-L184) | Initialization and session persistence precede popup call; account state includes separate bootstrap/connected failures. | Browser behavior remains untested. |
| S-05 | [settings.js createOfflinePanel](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/settings.js) | Settings still creates a DEVICE/OFFLINE APP panel. | Presence in source is not evidence it should be visible in current online UI. |
| S-06 | [onlinePlayerIdentity.js lines 24, 43–46](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L24-L46) | Online identity module inserts containment style and hides Settings Offline/internal panels. | Unexpected visibility needs CSS/JS/runtime evidence. |
| S-07 | [screens.js resumeSavedShowdown](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/screens.js) and [online identity continue handler](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L53-L57) | Local and connected Continue Career routes coexist. | No direct evidence of handler conflict in physical run. |
| S-08 | [service-worker.js lines 1–13](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/service-worker.js#L1-L13) and [index.html line 6](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L6) | Checked-in runtime is `1.9.1-r62`, service-worker tracks previous `r61`. | Deployed and device-active revisions not verified yet. |
| S-09 | [CURRENT_PRODUCT_GUARDS.json](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/CURRENT_PRODUCT_GUARDS.json) and [AGENTS.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/AGENTS.md) | Exactly two players, zero billing, session-only popup, non-destructive recovery boundaries and dual-full-screen invariant. | Do not infer all safeguards actually held in each device runtime. |

## Current hypotheses (H, **unverified**)

- H-01: popup user activation or asynchronous dependency setup leaves authentication unresolved.
- H-02: app collapses distinct Firebase/Connected Account/device failures into an unhelpful signed-out or connecting experience.
- H-03: identity UI module/containment CSS failed or old/new assets were mixed.
- H-04: Continue Career active authority and local saved/pair/session routing diverged.
- H-05: tablet layout/focus hid signing requirements or data was missing/invalid independently of clipping.

## Not yet present

- **No T:** No replayed browser/deterministic tests run by this research program.
- **No P:** No observed authenticated Firebase state, provider logs, actual production device revision or new consented physical reproduction gathered here.
- No repair or deployment proof, no Team G Lead review/approval, no product milestone credit.

**Update rule:** Every research block records new evidence IDs, rejected alternatives, gaps and SHA provenance. Do not delete contradictory observations to make a hypothesis look certain.
