# Career Mode Showdown v1.1.3 — PR Diagnostic Addendum 3

This file records the next diagnostic correction after the successful eager-budget recovery in `CAREER_MODE_SHOWDOWN_V1.1.3_PR_DIAGNOSTIC_ADDENDUM_2.md`.

## Clean diagnostic head `fd8b55dd4d41cf3f21fb4e305e1344876b272caa`

All 13 permanent PR families were triggered on this clean head. Early results included:

- `Validate League Confirmation` — SUCCESS. This includes the permanent settled-wheel transition/stale-operation regression protection for the owner-reported League Wheel reroll bug.
- `Validate Statistics Workstream` — SUCCESS.
- `Validate Home Bootstrap` run `31557720658` — FAILURE.
- `Validate V1 Visual Immersion` run `31557720709` — FAILURE.

The two failures agreed on the same release-coherence issue and therefore represent one real root cause rather than unrelated regressions.

### Exact root cause

`index.html` correctly referenced the protected Marco Reus startup portrait with `?v=1.1.3-r1`, but `js/menuExperience.js` still used `?v=1.1.2-r1` for the Home thumbnail entry. The binary portrait/source/composition itself was unchanged; only its cache identity was stale.

- Home Bootstrap failure: `Home and startup must reuse one cached portrait.`
- V1 Visual Immersion failure: `Home must reuse the same portrait cache entry.`

This matters because the protected design intentionally reuses one exact local Reus WebP for startup and Home instead of creating two competing downloads/caches.

## Guarded correction

A temporary fail-closed one-file alignment workflow was used because the connector write API replaces complete text files and this large runtime file required a one-token exact substitution without broad manual reconstruction.

- Temporary workflow run: `31557797329` — SUCCESS.
- Job: `93993623523` — SUCCESS.
- The guarded operation required exactly one stale string and changed only `js/menuExperience.js`.
- It replaced `assets/marco-reus-2015-cc-by.webp?v=1.1.2-r1` with `assets/marco-reus-2015-cc-by.webp?v=1.1.3-r1`.
- The workflow explicitly verified the file byte size remained unchanged, so the already-recovered startup budget did not grow.
- Bot-published runtime correction head observed immediately afterward: `09e535eaf8c55a463ad52b770f431c96e09dc727`.
- Repository verification now shows the Home thumbnail at `1.1.3-r1`.

The temporary workflow `.github/workflows/temporary-align-reus-v113.yml` was removed by commit `5f3d0c4f69315e7293ca1649cfb8414caa94d755`.

As with the earlier guarded compaction, bot-recursive/action-required results are not release evidence. This normal user-authorized handoff commit is intended to trigger the next clean integrated diagnostic matrix.

## Protected visual contract remains unchanged

- Marco Reus image binary/source is unchanged.
- Loading-screen composition/timing is unchanged.
- Home Reus presentation is unchanged.
- Only the stale cache identity was aligned to the already-established v1.1.3 shell revision.
- The eager startup ceilings remain 165,000 raw / 37,500 gzip; the last guarded measurement was 164,965 raw / 37,006 gzip.

## Next gate

Require a complete 13/13 green diagnostic matrix on a clean head after this correction. If any family fails, preserve the failure and correct the root cause without weakening thresholds. Only after 13/13 diagnostic green may the exact candidate SHA be frozen for the two independent official pre-merge passes.