# offlineApp-2 (JOB-1560): second-half audit of js/offlineApp.js

Result: no findings.

Riskiest places checked:
1. `waitForUpdateInstallation` (js/offlineApp.js lines 321-363): after the 30 s timeout it resolves with a worker that may still be installing. The caller then reads `registration.installing` and shows the "still downloading" message at line 412, so the path is handled and no stuck state was found.
2. `controllerchange` handler (lines 601-608): the reload is guarded by `activationRequested && !controllerReloaded`, so a single reload happens for a requested activation and no loop is possible.
3. `activateWaitingUpdate` (lines 429-471): the boundary check runs before `CMS_ACTIVATE_UPDATE`, and `activationRequested` is reset on failure, so a refused activation keeps the old build as intended.
