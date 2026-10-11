# homeScreensV10-2 (JOB-1576): second-half audit of js/homeScreensV10.js

Result: no findings.

Riskiest places checked:
1. `hmOnline` (js/homeScreensV10.js lines 128-131): the Audius player is re-initialised only when the offline state is not "Offline", so it does not start while the connection is down, and the offline line restored by offlineApp.js is redrawn by `HomeSoundtrack.init`.
2. The Audius card replacement (lines 118-123): the card's children are replaced in one call, the status and controls keep the product ids, and the card is marked `data-v10-media="audius"` so a second mount does not rebuild it.
3. `install` failure path (lines 157-165): a missing loader rejects, and a failed Home load is logged and resolves to false, so the app's own Home stays in place.
