# SWEEP-JOB-1761 · Backup export audit

Checked against `gameplay/bug-list-1` (current code); source report `JOB-1761.md` on `factory/gameplay-v1`.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Backup download could miss the newest season score or transfer draft while application writes were pending; a failed flush could create a misleading backup. | `js/backup.js:233-236` -> `js/backup.js:233-239` | **FIXED** | `if(typeof window.flushPendingApplicationWrites === "function" && window.flushPendingApplicationWrites() === false){`<br>`    throw new Error("Pending application writes could not be flushed safely.");`<br>`}` The export now flushes pending saves, refuses an unsafe flush, and only then creates/downloads the snapshot. |

Still open: 0
