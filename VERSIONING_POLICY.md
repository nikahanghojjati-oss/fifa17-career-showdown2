# Career Mode Showdown — Versioning Policy

Status: permanent owner release-numbering rule
Effective: 2026-08-17 ET

## Purpose

Every shipped application change must communicate its significance through a deliberate version number. Versioning is part of product communication and release safety, not an afterthought.

The application uses `MAJOR.MINOR.PATCH` for the visible product version and `-rN` for the exact whole-shell runtime revision belonging to that application version.

Example: `1.4.2-r1` means application version `1.4.2`, runtime generation 1 for that application release.

## Required classification before release

Every bounded change set must be classified before promotion.

### PATCH — `x.y.Z`

Use a patch bump for shipped runtime changes that preserve the current product milestone and compatibility, including:

- bug fixes;
- maintenance changes that affect production behavior;
- reliability, accessibility or performance corrections;
- small UX polish that is meaningful enough to ship independently;
- security hardening that does not introduce a new product capability;
- prerequisite runtime work whose user-visible/product behavior is intentionally small and backward-compatible.

A bug fix or runtime maintenance release must not remain hidden under an unchanged visible application version merely because the change is small.

### MINOR — `x.Y.0`

Use a minor bump for a meaningful new backward-compatible product capability or a substantial milestone layer, including:

- a new user-facing workflow;
- a major Save Library, Season, Analytics or connected-product capability;
- the first production-enabled cloud/sync, private account, paired-device or Connected Rivalry surface when its scope is large enough to be a feature milestone;
- a group of closely related product-deepening slices intentionally released as one milestone.

Minor versions must be chosen from actual shipped scope. Roadmap position alone never reserves a number.

### MAJOR — `X.0.0`

Use a major bump only for a transformative or compatibility-breaking product boundary, such as:

- intentionally incompatible storage/protocol behavior that cannot remain backward-compatible;
- a fundamental product-mode change;
- a major connected-session milestone whose production behavior changes the product enough to justify a new major generation.

Private Remote Joining is a plausible future major-release candidate because it can transform the product from local-first rivalry tracking into a secure private connected-session experience, but the exact major number is not pre-assigned. The release decision must be made from the proven final scope.

## Runtime revision — `-rN`

The runtime suffix identifies the exact installable/offline whole shell for one application version.

Rules:

1. a new application version starts at `-r1`;
2. `rN` increments only when producing another whole-shell runtime under the same application version without changing the application-level product version;
3. `rN` is never a substitute for a required PATCH/MINOR/MAJOR bump;
4. every runtime revision keeps an explicit immediate previous known-good whole-shell recovery target;
5. package version, `APP_VERSION`, `app-asset-revision`, release records, changelog and current authority must remain coherent.

## Changes that do not consume an application version

The following do not require a visible application bump by themselves because they are not shipped application behavior:

- documentation-only changes;
- test-only changes;
- CI/development-environment maintenance;
- dormant prerequisite models or abstractions that are deliberately not loaded by the production application and do not change shipped runtime bytes or behavior.

These changes must still be recorded in repository history. As soon as prerequisite code is connected to the production application or changes production behavior, the appropriate PATCH/MINOR/MAJOR rule applies.

## Stable release rule

A version becomes the current stable production release only after the required exact-head validation is green, the authorized PR is merged, deployment is verified, and current authority identifies the promoted runtime.

Do not call a release stable merely because its files exist on a branch.

## Remote Joining roadmap interaction

Release numbering does not override dependency order.

Cloud/sync readiness → private account/auth/authorization → paired-device/private-session → Connected Rivalry/two-device proof → Private Remote Joining remains the required order.

Each layer receives a version according to what actually ships. Do not inflate version numbers just to signal progress, and do not hide meaningful shipped changes behind unchanged numbers.
