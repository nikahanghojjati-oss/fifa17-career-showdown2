# Owner Standing Merge and Deploy Authorization — 2026-08-20

Owner instruction recorded on 2026-08-20:

Once a pull request has passed every required repository test and publication gate for that PR, current and future developers are authorized through the end of the full Career Mode Showdown project to merge that PR and deploy the resulting change without requesting separate owner approval again.

This standing authorization applies recursively to later Work environments and successor developers unless the owner explicitly revokes or narrows it later.

It does not waive repository safety gates. Before merge/deploy, the developer must still satisfy the current required exact-head validation, clean submitted-review state, clean inline-review-thread state, mergeability, expected-head protection, deployment verification when applicable, protected security/recovery semantics, versioning policy, WEC rules and any other current mandatory publication requirement.

The authorization removes only the need for a new owner confirmation after those gates are satisfied. It does not authorize bypassing tests, merging a stale head, weakening tests, skipping rollback/recovery requirements, changing production provider state outside the current authorized implementation lane, or expanding product scope beyond current implementation authority.

For PR #114 specifically, the earlier draft-PR-only limitation is superseded by this later owner instruction. After the final immutable sealed head passes all required PR #114 validation and publication gates, the developer is authorized to mark the PR ready if needed, squash-merge it using expected-head protection, verify resulting live main, and complete deployment verification without asking the owner again.

This file is permanent owner-instruction provenance. Later explicit owner instructions override it.
