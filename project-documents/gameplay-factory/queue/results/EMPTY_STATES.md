# JOB-1472 — Empty, loading, and waiting messages (stage 1)

Source-only audit on `qa/mega-audits` (2026-10-10). Scope: the four JavaScript files named in queue item 0012. No game code was edited.

| Screen | File and line | Loading / waiting / empty text found in the allowed source | Assessment |
| --- | --- | --- | --- |
| Home | `js/homeScreensV10.js:11,19-20` | App startup loading stays in the existing splash (copy not in this file). Audius card: `CONNECTING TO AUDIUS` (loading). No waiting or empty message literal. | Context-specific uppercase soundtrack status; not a duplicate of career-history loading. |
| Career Statistics | `js/careerScreensV10.js:19` | `Loading career history…` (loading body); `LOADING CAREER HISTORY` (loading heading); `No completed record yet` (empty record). | Sentence-case body; no extra `please` or period. |
| Trophy Room | `js/careerScreensV10.js:20` | `Loading career history…` (loading text); `Not won yet` (empty trophy); no waiting literal. | Same loading body as Career Statistics; the empty trophy message describes a different object. |
| History (Legacy) | `js/rivalryLegacyV10.js:21-31,102-111,133` | Source sets `loading`/`empty` status, but does not contain its displayed loading or empty message. `TRY AGAIN` is an unavailable-state button, not a waiting/empty message. | Display strings are read from an external `strings.json` asset; outside the ticket's allowed read list. |
| Rivalry Statistics | `js/rivalryLegacyV10.js:34-52,133` | Source sets `loading`/`empty` status, but does not contain its displayed loading or empty message. | Display strings are read from an external `strings.json` asset; outside the ticket's allowed read list. |
| Rule Book / Settings | `js/rulesSettingsV10.js:7-20,75-101` | No user-visible loading, waiting, or empty message literal in this visual adapter. Mentions of loading refer to styles/focus in comments. | Existing product copy is preserved, not rewritten here. |

## Decision

**No findings** that justify a safe wording change inside the permitted source files. Both career-history loading bodies match exactly; empty-record and empty-trophy text refer to different concepts. No `Waiting` or `please` message appears in the four files.

**Scope limit:** This does **not** certify all on-screen messages: History/Rivalry renderers obtain their text from asset `strings.json`, while Home startup and Rules/Settings preserve text provided elsewhere. The job's read-only, four-file constraint prevents comparing those strings. No test-pinned labels were changed, and no game files were edited.
