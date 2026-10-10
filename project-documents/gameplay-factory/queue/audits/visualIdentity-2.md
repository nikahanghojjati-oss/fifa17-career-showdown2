# JOB-1498 · visualIdentity.js second half audit

Read: `js/visualIdentity.js` lines 376 to 753 (the second half of 753 lines).

## Finding 1 · PROBABLE · a league mark on a reused element can repaint with the previous league

- **File and line:** `js/visualIdentity.js` lines 583-596 (`applyLeagueMark`). The observer is created only once per element (line 591), but its callback keeps the `paint` closure from the first call.
- **What the player sees:** an element that shows a league mark is reused for a second valid league (for example after the league changes). The mark is painted correctly at first. Later, when the element's class changes (for example `is-top`, which switches the tone from gold to ink), the mark repaints with the first league's artwork, not the current league's. The wrong league mark appears only after that class change.
- **Why the code does it:**
  ```
  const paint = () => { ... buildLeagueMarkSvg(recipe, tone) ... };
  if(typeof MutationObserver !== "undefined" && !leagueMarkObservers.has(element)){
      const observer = new MutationObserver((mutations) => { ... paint(); });
  ```
  The second call to `applyLeagueMark` builds a new `paint` with the new `recipe` and runs it once, but the existing observer still calls the old `paint`, and the `!leagueMarkObservers.has(element)` check stops a new observer from being created.
- **Smallest change:** when a valid recipe is applied to an element that already has an observer, disconnect the old observer and create a new one, or store the current recipe in a `WeakMap` keyed by the element and have the observer read it. Either change removes the stale closure.
- **Confidence limit:** PROBABLE, not SURE. The bug needs an element that is reused for a second valid league and then has its class changed. This job did not confirm that the game reuses those elements that way (the caller is outside this file).

## Riskiest places checked (no other real bug found)

1. Lines 652-682 (`getClubIdentity`): the cache is keyed by the trimmed name, and the crest SVG is built per access through the getter, so each drawn crest gets a new ID prefix and no two crests share IDs.
2. Lines 699-716 (`applyClubIdentity`): the early return on an unchanged name and the clear path for "not assigned" or `?` both leave the element in a consistent state.
3. Lines 612-628 (`getClubIdentityInitials`): empty or punctuation-only names return "--", and single words are cut to three letters, so no name produces an empty label.

No game file was edited. This job adds one audit file only.
