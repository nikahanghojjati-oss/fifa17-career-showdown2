# R8.5 Approved Character Identity Lock

Status: PROPOSAL ONLY / NON OPERATIONAL / NOT FOR LIVE ACTIVATION

This folder belongs to the independent visual production lane. It must not be merged or activated by an autonomous visual agent. The main/master development lane must explicitly review and approve any integration.

## Source boundary

Repository truth was independently re-resolved immediately before this branch was created.

- source main SHA: `7f6432213871fb4cb5fb414999e08ac44e0fb318`
- runtime: `v1.9.1`
- asset revision: `1.9.1-r8`
- proposal branch: `visual/r8-5-approved-character-identity-lock`
- production files changed by this proposal: NONE
- Firebase/billing changes: NONE
- zero-dollar rule: REQUIRED

This branch is intentionally isolated from the active SSJR/product-development lane.

## Why this lock exists

A later image-generation attempt drifted away from the previously approved AI likenesses and invented new faces. That output is rejected.

R8.5 already stated that Nik and Daniel were `approved-ai-reference-locked`. The error was interpreting the future master asset IDs as permission to recreate the identities from a text description. They are not. The approved earlier composites are the identity source.

From this point forward:

1. Never regenerate Nik or Daniel from prose alone.
2. Never use literal user/friend photographs as website character assets.
3. Use the approved generated character references listed in `APPROVED_CHARACTER_IDENTITY_LOCK.json` as the visual source.
4. New poses must be reference-preserving edits/derivations, not fresh identities.
5. A face that materially changes jaw shape, eyes, nose, hairline, hair mass, beard pattern, apparent age, or overall facial proportions fails identity QA.
6. Full-screen image generations are mood references only. Shipping UI remains exact live DOM.
7. If reference access is unavailable, STOP character generation rather than inventing a replacement face.

## Canonical role mapping

The accepted composites consistently establish:

- Daniel: longer/wavier dark hair, lighter facial hair, dark suit with open white shirt and no tie as default formal presentation.
- Nik: shorter dark hair, trimmed/full beard, darker formal suit styling with tie or dark shirt depending on pose.

These descriptions are secondary annotations only. The pixels in the approved reference files are authoritative.

## R8.5 production architecture remains unchanged

- runtime authority: existing production DOM and JavaScript
- presentation: R8.5 black/gold CSS
- character art: replaceable isolated visual layer
- controls: real live DOM controls above art
- art layer: `pointer-events:none`
- no visual code owns save, Firebase, pairing, session, transfer, scoring, or mutation authority
- manager-side variants must support both Nik-left/Daniel-right and Daniel-left/Nik-right where R8.5 requires them
- league SPIN control remains below the wheel and unobstructed
- safe zones and responsive fade/omission rules remain mandatory

## Rejected output

The newly generated 1536x1024 `CHARACTER MASTERS R8.5 VISUAL SYSTEM` sheet from the drifted session is explicitly rejected as an identity source.

Rejected local SHA256 captured at creation:

`ff8ebde5c2b81a902c5fd330147284761f5c36d53944452551f28223c30e69e6`

Do not promote, trace, interpolate from, or use that face pair as a future reference.

## Next safe visual action

Build isolated pose assets from the approved identity reference set one character at a time. The first acceptable deliverable is an identity-preserving Nik neutral/confident master and an identity-preserving Daniel neutral/confident master. Do not generate another whole webpage screenshot before those pass visual identity review.
