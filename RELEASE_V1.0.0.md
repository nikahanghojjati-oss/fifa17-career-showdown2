# Career Mode Showdown v1.0.0

Release date: August 9, 2026

Release channel: Stable

Runtime asset revision: `1.0.0-r1`

Accepted presentation baseline: r13 merge `1bae3e1fd0f5ab213846629d328024b9be2d244c`

Release tag: `v1.0.0`

## Release summary

Version 1 is the complete one-device local release of Career Mode Showdown. It tracks a two-manager FIFA 17 Career Mode rivalry from League selection and permanent Club Assignment through Transfer Challenges, Season scoring, Legacy history and all-time statistics.

The stable release seals the owner-accepted r13 presentation without changing gameplay, routes or stored-data schemas. It includes the responsive metallic Home redesign and the cinematic Marco Reus startup above the r12 release-stabilization fixes.

## Included experience

- exactly two managers and one active local Showdown;
- same randomly selected league and two different permanent clubs;
- 1, 3, 5 or 10 Season formats;
- five accepted FIFA 17 era League Wheel choices and 98 clubs;
- phased Transfer Challenge with three guesses and three signings per manager;
- canonical maximum-11 Season scoring with grouped bonus caps;
- 0–0-only league-position and league-points tiebreak;
- memory-only Season Review with Edit and Confirm & Save;
- active and completed Showdown recovery after refresh;
- Legacy archive, Rivalry Statistics, Career Statistics and Trophy Room;
- Rule Book, reduced-motion setting and optional original menu feedback;
- seven user-initiated YouTube soundtrack/trailer choices;
- responsive layouts for Chromebook, desktop, tablet and mobile.

## Deliberate Version 1 limits

- one browser/device and one active Showdown;
- local data only, with no account, cloud backup or cross-device synchronization;
- no export, import, portable backup or multiple save slots;
- no QR pairing, online multiplayer, public profiles or rankings;
- no direct FIFA save-file import or automatic result verification;
- manual result entry and self-managed competition integrity;
- the default Showdown Wheel remains the five accepted leagues;
- official club crests, FIFA fonts, EA interface art and copied interface audio are not bundled.

## Local storage and recovery

Version 1 uses three browser localStorage keys:

| Key | Purpose |
| --- | --- |
| `careerModeShowdown.activeShowdown` | Current or most recently completed active Showdown; Showdown schema version 2 |
| `careerModeShowdown.legacyShowdowns` | Completed Showdown archive used by Legacy and derived analytics |
| `careerModeShowdown.preferences` | Reduce Motion and Menu Click Feedback preferences; preference schema version 2 |

Critical transitions write before navigation and block or roll back when persistence fails. Draft writes are debounced and deduplicated. The application displays a visible error when the browser rejects a read or write.

Data remains tied to the same browser profile and site origin. Clearing site data, using a temporary/private session, changing browser profiles or resetting Legacy can remove data that Version 1 cannot restore. Keep using the same normal browser profile and do not clear this site's storage. Portable export/import is intentionally scheduled after the v1.0.x stability lane.

## Browser and accessibility evidence

The accepted source passed all 22 deterministic blocks across nine GitHub Actions workflows, a 98-checkpoint real-Chromium complete journey and 23 automated WCAG scans.

Dedicated layout evidence covers:

- 1920 × 912 Chromebook-class desktop;
- 1366 × 768 low-height laptop/Chromebook;
- 768 × 1024 tablet;
- 390 × 844 mobile with reduced motion;
- 2560 × 1440 and 320 × 568 edge viewports.

The release target is current Chrome/Chromium on Chromebook and modern mobile Chromium. The application uses standards-based HTML, CSS and JavaScript and should work in other current browsers with localStorage, but Version 1's formal browser evidence is Chromium-centered. Keyboard navigation, visible focus, reduced motion, contrast and horizontal containment are release requirements.

## External media behavior

- The Marco Reus portrait is bundled locally from Tim Reckmann's CC BY 2.0 Wikimedia Commons photograph. Full attribution and transformation details are in `THIRD_PARTY_NOTICES.md`.
- Google Fonts are an optional network enhancement; local condensed and system-font fallbacks keep the application usable if fonts are blocked.
- YouTube soundtrack and trailer media are optional. No iframe is created until Play is pressed, at most one iframe is active, and media availability depends on YouTube, the network and browser policy.
- A blocked or unavailable external media request does not prevent Showdown creation, scoring, saving or navigation.

## Release verification and rollback

The stable GitHub release and tag must point to the exact merge commit that passes all PR and post-merge checks. GitHub Pages must serve the same public runtime files byte for byte under revision `1.0.0-r1`.

The r12 merge `4cef293614b00e7cc541adb4897475c7bab3ff4a` remains the pre-r13 functional rollback point. Restoring older code does not downgrade or rewrite local saved data schemas because the v1.0.0 seal introduces no storage change.
