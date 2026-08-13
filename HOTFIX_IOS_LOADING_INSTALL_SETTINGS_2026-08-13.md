# iOS Loading + Settings Install Hotfix

Status: in progress on `agent/ios-loading-settings-install-fix`

Owner request implemented in this workstream:

1. Separate mobile loading art geometry from viewport-height growth so iOS standalone cannot create a giant empty top band.
2. Preserve the existing protected Marco Reus source and desktop/Home presentation.
3. Remove the global floating install/status rail and panel from every application screen.
4. Keep Service Worker, cache verification, connectivity, update and rollback logic, but expose install/update controls only inside lazy Settings.
5. Add dedicated browser-height and iOS-standalone-height loading composition regression evidence.
6. Add Settings/install regression evidence proving install UI does not escape Settings.

Release identity in progress: v1.2.0 hotfix runtime revision `1.2.0-r2`, preserving `1.2.0-r1` as the previous known-good offline shell.

Do not call this production-proven until PR gates, merge, GitHub Pages deployment, deployed Stability and release evidence are green.
