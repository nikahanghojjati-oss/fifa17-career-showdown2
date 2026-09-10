# Visual Proposal Senior Developer Handoff Template

This template is required by `00_VISUAL_PROPOSAL_GOVERNANCE.md` for a reviewable visual proposal stopping point.

## 1. Proposal status

Proposal-only status: YES

Production integrated: NO

Production deployment performed by visual session: NO

Proposal branch: `<visual branch>`

Exact proposal head SHA: `<sha>`

Observed `main` SHA during proposal work: `<sha>`

Observation timestamp/date: `<date/time if available>`

## 2. Proposal objective

Describe the exact user-visible visual/UX outcome this proposal is trying to achieve.

`<objective>`

## 3. Roadmap and authority followed

List the active visual starter, roadmap, storyboard, approved asset/identity authorities, exact-DOM contracts, QA rules, and other controlling documents used.

`<authorities>`

## 4. Files and assets changed

List every proposal file or asset added, removed, or changed and briefly state why.

`<changed files/assets>`

## 5. Intended product behavior

Explain how the proposal is intended to behave if the senior developer later adapts and integrates it. Distinguish visual presentation from behavior/state/data changes.

`<intended behavior>`

## 6. Approved identities and source assets

Record which approved AI character identities, canonical masters, source images, logos, textures, typography, or other visual sources were used.

If no new image was required, say so explicitly.

`<assets and identity sources>`

## 7. Validation performed in the visual proposal branch

Record only checks actually run and their results. Examples can include isolated rendering checks, proposal build checks, viewport inspection, visual safe-zone checks, DOM compatibility inspection, or proposal-specific tests.

`<validation evidence>`

## 8. Validation not performed

List integration, production, provider, deployment, security, full regression, device, or other validation that was not performed because the visual session does not own production integration.

`<not validated>`

## 9. Main drift and compatibility notes

Describe any known difference between the observed `main` and the proposal branch. Do not assume the recorded `main` SHA is still current.

`<drift notes>`

## 10. Risks, limitations, assumptions, and unresolved items

`<risks/open items>`

## 11. Senior developer verification checklist

The senior Career Mode Showdown developer should independently:

1. Resolve current exact `main` and current production/runtime authority.
2. Confirm the exact proposal branch and proposal head SHA.
3. Compare the proposal against current `main`; do not assume the proposal base is current.
4. Review the proposal as untrusted review input rather than production-ready code.
5. Inspect affected architecture, state/data flows, navigation, persistence, security-sensitive boundaries, accessibility, responsive behavior, and existing product functionality as relevant.
6. Verify that approved visual identities/assets and current roadmap intent are preserved.
7. Adapt, rewrite, split, or reject proposal elements as needed for the current product.
8. Run the current canonical repository tests, builds, contracts, gates, and required browser/device validation on the senior developer's integration candidate.
9. Keep zero billing intact and do not introduce paid infrastructure without explicit owner authorization.
10. Decide whether and how to integrate.
11. Report exactly what was accepted, changed, rejected, validated, and actually integrated.

## 12. Copy/paste prompt for the senior Career Mode Showdown developer

```text
Review the visual proposal on branch `<visual branch>` at exact proposal head `<proposal sha>`.

Treat this branch as an untrusted proposal only. It is not production-integrated work and it is not authorization to copy proposal files into main verbatim.

First independently resolve the current exact `main`, current production/runtime authority, and any product/roadmap changes that happened after the proposal's observed main `<observed main sha>`.

Then compare the proposal with current main and inspect all affected architecture and product surfaces, including state/data flow, navigation, persistence, existing functionality, responsive behavior, accessibility, security-sensitive boundaries, tests, and deployment assumptions where relevant. Confirm that the visual proposal still follows the current roadmap and approved visual/identity authorities.

Modify, adapt, split, rewrite, or reject any proposal code or asset when necessary. Run the repository's current canonical builds, tests, contracts, gates, and required browser/device validation on your integration candidate. Preserve zero billing and the project's production safety rules.

Only after that review should you decide whether and how to integrate any portion into the actual product. Report what you accepted, changed, rejected, validated, and integrated.

Proposal handoff file: `<completed handoff path>`
Proposal branch: `<visual branch>`
Proposal head: `<proposal sha>`
Observed main during proposal work: `<observed main sha>`
```

## 13. Final visual-session declaration

The visual session must finish the handoff with this statement:

`This work is a proposal only. I did not merge, deploy, or otherwise integrate it into main or the live Career Mode Showdown product. Production integration remains the responsibility of the senior Career Mode Showdown developer after independent review and validation.`
