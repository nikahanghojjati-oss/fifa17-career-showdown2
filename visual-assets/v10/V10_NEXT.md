# V10 NEXT

## Next worker transition — Claude Code Cloud Session

COV-01 has been reconciled and the owner decisions are resolved.

The provisional C2 build is now authorized on an isolated branch.

### Exact branch to use

In Claude Code, change the branch selector from:

`main`

to:

`claude-cloud/sv01-v10-1-c2-provisional-build`

Do not run this visual build from production main.

The dedicated branch is based on:
`visual/cinematic-system-v10`

### Cloud Session task

Build one provisional SV01 C2 Decision Desk candidate using:

- `visual-assets/v10_1/SV01_C2_DECISION_DESK_SPEC.md`
- `visual-assets/v10_1/SV01_C2_BLOCKING_ADDENDUM.md`
- `visual-assets/v10/SV01_TRANSFER_GUESS_PRODUCT_TRUTH_CARD_V10.md`
- current V10 state
- approved Daniel/Nik/stadium assets

Constraints:
- no image generation;
- CSS/SVG room authorized;
- no product-behavior changes;
- no main-branch writes;
- no visual-system redesign;
- output remains `PROVISIONAL_ASTRA_REVIEW_PENDING`.

### Required outputs

- browser-openable candidate
- 1366×768 rendered evidence
- 390×844 rendered evidence
- source/state QA
- exact candidate SHA-256
- implementation notes
- changed-file list
- no merge to main

### Budget discipline

Visual Cloud Session soft envelope:
approximately $55 total across visual implementation work.

After this first substantive session, stop and check the cloud-credit balance before starting another large cloud session.

Reserve approximately $45 for future main-product readiness / E2E / bug-audit work.

### After build

Return the exact branch result/evidence to GPT-5.6 Sol.

Then:
1. Sol checks product truth;
2. Claude Chat Project performs RT-01 visual/technical red team;
3. Astra later spot-checks the compact delta;
4. Nik approves or rejects the visual result.
