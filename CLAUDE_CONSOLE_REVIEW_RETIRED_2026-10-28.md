# Decision: Claude Console review and deep audit retired (2026-10-28)

**Owner decision (Nik, 2026-10-28 21:12 UTC, Team G r86 lead thread):** "Claude console review button and process can be removed or archived as we realized it doesn't work ... save this decision in github so future leads don't retry that."

## What was removed
- `.github/workflows/claude-review.yml`: the automatic "Claude review" on PRs (r85, PR #1013), paid by Nik's Claude Console credit through the repo secret `ANTHROPIC_API_KEY`.
- `.github/workflows/claude-deep-audit.yml`: the manual "Claude Deep Audit" button in Actions (PR #1022).

## Why
- From 2026-10-27, every run of both workflows failed in under a second with API 400 `billing_error: Credit balance is too low`. This happened with three different keys, while the Console Playground worked with the same credit.
- Not a single review or audit ever completed, so the process cost time and gave no result.
- The content pack (commentary, front pages, club and scouting cards) was the useful way to spend the Console credit. It was made in the Playground and shipped as static data in r86 (PR #1029).

## Rule for future leads
- Do **not** add any GitHub workflow that calls the Anthropic API (`anthropics/claude-code-action`, `ANTHROPIC_API_KEY`, "@claude review"). `tests/operations/pos10-authority.test.mjs` fails if one comes back.
- Reviews are: **"@codex review"** on every code PR (and "@codex security review" on Rules, sign-in, pairing and sync), the Showdown Gate, the lead's own review, and the red-team Sol brief run by Nik.
- The `ANTHROPIC_API_KEY` repo secret is unused. Nik may delete it in Settings > Secrets and variables > Actions.
- Only Nik can reverse this, in words.

## Why it was still running on main (2026-10-28 22:30 UTC)
PR #1032 merged the removal into the r86 work branch (gameplay/r86) only. GitHub runs a pull-request
workflow from the branch the PR targets, so PRs into main (Team V's #1033) still ran main's copy. Fix:
both workflows disabled in Actions the same evening, and this same removal merged straight into main.
Lesson for leads: a change that must stop something now goes to main, not only to the release work branch.
