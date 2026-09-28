# SOL CP1 BUILD CHECK — 2026-09-27

Task: CLOUD-TR2-01-CP1  
Task branch: `claude-cloud/transfer-tr2-slice-01`  
Frozen task head: `646e227aa71cd5d712c791e6436ece103a2e2dfd`  
Task base: `ab36d9bcef58775c1fc1fb525997f8ec70d0cc69`  
Production anchor: `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`

## Sol verdict

PRODUCT TRUTH: PASS  
BRANCH SAFETY: PASS  
SCOPE CONTAINMENT: PASS  
EVIDENCE INVENTORY: PASS WITH REVIEW NOTES  
VISUAL VERDICT: NOT SOL AUTHORITY — route frozen candidate to Lead Visual Producer.

## Branch safety

GitHub compare from task base to frozen head is exactly two commits ahead / zero behind.

All changed files are under:

`visual-assets/v10_1/tr2/slice-01/`

No production `js/`, `css/`, root `index.html`, `data/`, root `assets/`, `main`, PR or merge was changed by CP1.

## Product-truth check

Verified against the V10 Transfer Guess product-truth card and `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`.

The candidate preserves:
- Window → Guess Entry → Signing Entry → Completed/Verdicts phase order;
- no active timer digits in Guess Entry;
- `WINDOW CLOSED` presentation in Guess frames;
- viewer-only private guess controls;
- no rival progress/count/lock-state exposure;
- `LOCK MY GUESSES` as the Guess action;
- exact anchored production copy in fixtures;
- Daniel = Manager 1 = physical left;
- Nik = Manager 2 = physical right;
- no production network/provider mutation; CP1 is a static fixture prototype.

## Cloud-reported review items carried forward

- `CP1-K1`: soft warm/gold hair rim remains after intake. Producer taste decision required.
- `CP1-K2`: 360×780 F5 top-bar chips wrap by about 10 px.
- `CP1-K3`: B3 composition constraints were inspected rather than fully asserted mechanically.

## Sol-added evidence finding

### SOL-CP1-E1 — F2/F3 panel extends below the 1366×768 viewport

The committed `render_qa_report.json` records:

- F2 panel: top 330 px, height 470.671875 px, bottom 800.671875 px.
- F3 panel: top 330 px, height 470.671875 px, bottom 800.671875 px.

The CP1 brief's ranked desktop constraint B3-2 requires every live control and all production copy to be visible without scrolling at 1366×768.

This numeric evidence appears inconsistent with that requirement. Sol does not make the visual correction. Lead Visual Producer must inspect F2/F3 and decide whether this is a real clipping/visibility failure and, if so, issue a bounded revision.

### SOL-CP1-E2 — recorded combined fingerprint is not independently reproducible as written

`CLOUD_BUILD_RESULT.md` says its combined SHA was calculated before `CLOUD_BUILD_RESULT.md` itself existed, while the brief's requested set nominally includes that file (everything under slice-01 except evidence).

Treat the Git commit SHA `646e227aa71cd5d712c791e6436ece103a2e2dfd` as the authoritative immutable candidate fingerprint for producer review. The recorded combined SHA remains useful only as a pre-result tree fingerprint.

## Cost / routing owner feedback

Owner reports this Sonnet 5 High Cloud session took about 50 minutes and consumed about $15 in Cloud credit. This is materially above the owner's acceptable cost for one bounded checkpoint.

Do not interpret CP1 completion as evidence that Sonnet 5 High should remain the automatic Cloud default.

The next producer review must include a routing-policy decision for future slices:
- choose model + effort based on expected total task cost, not just per-token list price;
- prefer an Opus 5.5 route when its stronger reasoning/autonomy is expected to reduce long agent loops;
- require explicit owner approval before another Sonnet 5 High Cloud run of comparable scope;
- keep bounded checkpoints and an explicit credit/time budget.

No routing-policy rewrite is committed here beyond recording the owner's feedback; the Lead Visual Producer should return the proposed durable change.

## Next handoff

Route this exact frozen candidate to a new Claude Project chat for Lead Visual Producer review.

Review anchor:
`claude-cloud/transfer-tr2-slice-01 @ 646e227aa71cd5d712c791e6436ece103a2e2dfd`

Producer must inspect the evidence, decide K1 and Nik skin treatment, resolve/confirm SOL-CP1-E1, and return either:

`APPROVE_FOR_OWNER_REVIEW`

or

`REVISE`

with stable issue IDs and bounded deltas.

Producer should also return a revised model-routing rule reflecting the owner's CP1 cost feedback.
