# settings.js audit, second half (lines 456-910)

no findings

Riskiest places checked:
1. Lines 523-525 (`releaseSettingsCurrentShowdownConnection`): when there is no local rivalry and no live pair, the connection step is skipped and the local delete goes ahead. A real pair with no local rivalry is handled by the `hasCurrentPair` check.
2. Lines 603-608 (`deleteSettingsCurrentShowdown`): the active showdown must still match the one the player confirmed (save id, or local id when there is no save id). If it changed, nothing is deleted and the player is told to confirm again.
3. Lines 883-892 (`career-mode-preferences-change` listener): the Settings panel re-renders only while it is open, and focus returns to the control that was used. This keeps the menu feedback toggle in step with the stored value.
