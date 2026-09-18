# Career Mode Showdown v1.9.1 — Runtime r24

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r24`

Previous known-good runtime: `1.9.1-r23`

Runtime r24 is the emergency physical-acceptance recovery shell for tomorrow's Daniel vs Nik play session.

The player-facing recovery path is now explicit. If the online Showdown still exists but the browser no longer has its local career data, Home shows OLD SHOWDOWN FOUND with two clear actions: DELETE OLD SHOWDOWN & START OVER, or RESTORE BACKUP.

DELETE OLD SHOWDOWN & START OVER confirms once, closes the exact remembered provider Showdown through the authenticated registered-device/current-pair authority, immediately reclassifies the account as fresh-start eligible, and routes to explicit season selection. It preserves player identity, registered-device identity, Legacy history and application settings.

The normal unpaired connection UI is role-specific. Daniel, Player One, sees CREATE CODE FOR NIK. Nik, Player Two, sees only the field to paste Daniel's code and JOIN DANIEL'S SHOWDOWN. The normal UI no longer presents both CREATE and JOIN choices to both managers.

Recovery copy now explains the actual local/server split instead of implying that a backup necessarily exists. RESTORE BACKUP still opens the verified restore picker for users who actually have a backup.

This release keeps the provider abandonment authority shipped in r23. Production Firestore Rules have already been exact-source published and read back on Firebase Spark. Billing remains permanently OFF, App Check enforcement remains OFF, and no Cloud Functions, Cloud Run, paid tier, public discovery or community mode is introduced.

r24 changes cached client shell bytes, so the whole-shell revision advances rather than silently changing r23 cache identity. r23 remains the immediate recovery runtime.

SSJR physical acceptance credit remains unchanged until the fresh two-device physical journey passes.
