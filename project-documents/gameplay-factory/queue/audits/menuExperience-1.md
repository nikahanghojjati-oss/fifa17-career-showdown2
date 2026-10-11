# menuExperience.js audit, first half (lines 1-340)

no findings

Riskiest places checked:
1. Lines 267-269 (`refreshMainMenuExperience`): the Continue button's disabled state is set so that it is enabled only when a saved showdown exists. The four combinations of disabled and hasSave were checked by hand, and each ends in the right state.
2. Lines 323-331 (`handleMenuMediaLoadError`): an error from an old iframe is ignored when a newer iframe is current, so a late error cannot stop a newer track.
3. Lines 211-221 (cover image load and error): a failed image removes its src and marks the athlete as failed, so the cover does not show a broken image.
