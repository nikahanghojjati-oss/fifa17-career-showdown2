# menuExperience.js audit, second half (lines 341-681)

no findings

Riskiest places checked:
1. Lines 480-491 (`toggleMenuMusic`): a second tap while the iframe is still loading flips the state back, and the load handler (lines 453-458) plays only when the state says playing. The end state matches the last tap, so this is toggle behavior, not a stuck state.
2. Lines 446-458 (load timeout and load handler): the timer is cleared on a current load, and a stale load for another track is ignored. Selecting another track destroys the iframe and its timer first (lines 469 and 308-321).
3. Lines 653-672 (`initializeMenuExperience`): missing selector, choices or bindings throw an error with the list of missing parts, so a half-built menu is not used silently.
