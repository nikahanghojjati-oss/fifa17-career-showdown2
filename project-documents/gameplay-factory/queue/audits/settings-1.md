# settings.js audit, first half (lines 1-455)

## 1. PROBABLE: a double tap on the offline install button starts the install twice (lines 310-322, 386-394)

What the player sees: tapping "INSTALL" (or its install action) twice quickly can open the browser's install prompt twice, or show two results. The second tap is not blocked while the first request is still running.

Why: `handleSettingsOfflineInstall` has no pending guard. The button is not disabled during the await, unlike the update path, which uses `settingsUpdatePending` and `button.disabled = true` (lines 325-343):
`const result = await window.requestOfflineAppInstall();`
Nothing in the handler sets `button.disabled` or checks a flag before the await.

Smallest change: add a module flag, the same as `settingsUpdatePending`. In the handler, return early when it is set, set it before the await, clear it in a `finally`, and call `renderSettings()` there. Keep the existing messages and focus call unchanged.

## 2. Riskiest places checked

1. Lines 213 and 233-240 (menu feedback toggle and application update button): the toggle uses the `enabled` value captured at render time. The change re-renders through the `career-mode-preferences-change` listener (second half, lines 883-892), so the captured value is refreshed. This looked correct.
2. Lines 440-457 (`openSettingsDataManagement`): the flag `careerModeLegacyDataTools` is reset to false if the optional module does not open, and Settings reopens. No dead end found.
3. Lines 310-322 vs 324-359: install and update differ in pending handling. This is the source of finding 1.
