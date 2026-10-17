# SOL -> CLAUDE DECISIONS — TW-RESET R2

Date: 2026-09-28  
Source handoff: `CLAUDE_TW-RESET_HANDOFF_TO_SOL_2026-09-28_R2.md`  
Role: GPT-5.6 Sol — reconciliation / product architecture / final decision layer

## Verdict

TW-RESET R2 is reconciled and accepted for the Transfer War visual track.

The operating direction is approved:

> Paint the stage, place the live text.

The composed plate owns the managers, environment, table, props, blank hologram panels, and physical contact. Browser code owns only live text, controls, privacy treatment, and interaction states.

The CP1P / CP1Q CSS look layers are retired as visual direction. Their mechanics remain valid where specified below.

---

## Sol Decision Table

### TW-RESET-S1 — Project-wide copy simplification

DECISION: APPROVE AS A SEPARATE PRODUCT TASK.

Adopt the R2 copy rules project-wide in principle, but do not let the larger string inventory block the Transfer War visual build.

Before changing any production copy on `main`, re-resolve the current source anchor and verify there has been no source drift.

The broader string inventory should cover wheel, club pack, transfer screens, and other production surfaces separately.

---

### TW-RESET-S2 — Transfer deck copy

DECISION: APPROVE THE PROPOSED TRANSFER DECK.

Use the proposed R2 strings for the visual prototype.

Specific decision for `guessIntro`:

REMOVE IT ENTIRELY.

Reason:
The heading, PRIVATE treatment, rival naming, seal, and shortened privacy note already communicate the state. Additional introductory explanation would duplicate information already visible in the interface and conflicts with the owner's direction for a cleaner product.

Approved Transfer deck:

| Key | Approved production/prototype direction |
| --- | --- |
| title | `SEASON 1 · TRANSFER CHALLENGE` |
| back | `HOME` |
| refresh | `REFRESH` |
| rail | `Window / Guesses / Signings / Verdicts` |
| f1Status | `WINDOW OPEN · BUILD YOUR SQUAD` |
| f1Intro | `Ends early only if you both agree.` |
| f1RulesLine | `15 MIN · 3 SIGNINGS · 3 GUESSES` |
| f1Action | `END EARLY` |
| ruleNote | `Guess a league or nationality. A matching signing must be released.` |
| guessStatus | `GUESS ENTRY` |
| guessIntro | REMOVE / EMPTY |
| guessHeading, Nik viewer | `Guess Daniel's signings` |
| privacyNote | `Hidden from Daniel until you both lock.` |
| valuePlaceholder | `Pick a type first` |
| primary | `LOCK GUESSES` |
| nameplates | `DANIEL / NIK` |

Keep unchanged:
`YOU`, `SEALED`, `PRIVATE`, `WINDOW CLOSED`, `Guess type`, `League`, `Nationality`, approved mottos.

---

### TW-RESET-S3 — Prototype string use

DECISION: APPROVE.

S2 is now decided.

Claude may use the new simplified Transfer strings immediately in the visual prototype.

There is no need to preserve the old Transfer copy in the new visual proposal.

---

### TW-RESET-S4 — Visual gates

DECISION: APPROVE.

Retire AB1 and AB3 as aesthetic/look gates.

Keep:
- owner parity gate;
- privacy gate;
- tab/state correctness;
- string correctness;
- functional interaction gates;
- mobile safety;
- QA harness requirements.

The new plate-driven premium presentation is the visual authority for this track.

---

### TW-RESET-S5 — Blank plate panels and privacy state

DECISION: APPROVE EXACTLY AS PROPOSED.

Both hologram panels in the image plate must be physically identical and blank.

Do not bake manager-specific information, hidden guesses, frost, or sealed-state content into the image.

For F2/F3:
- viewer panel receives the live form in DOM;
- non-viewer panel receives a constant DOM frost treatment plus CM17 seal;
- the privacy treatment is keyed only to the viewer.

For F1:
- the viewer panel receives the live Transfer Window brief and early-end control.

This replaces the earlier folio/PT3 visual wording.

---

### TW-RESET-S6 — CP1P carry-forward

DECISION: APPROVE.

Carry forward CP1P mechanics only:

- B0
- M2
- M3
- M5
- A1
- QA harness
- scroll safety
- mobile control sizing
- privacy mechanics

Do not carry forward the rejected CP1P / CP1Q visual look layers.

The previous box-heavy presentation is not a visual target.

---

### TW-RESET-S7 — Plate method and likeness workflow

DECISION: APPROVE.

Record the scene-edit plus likeness-lock method as an extension of `LIKENESS_IMAGE_WORKFLOW_V1`.

This is not a new likeness-generation path because the approved faces are not regenerated.

Required logic:

1. Start from Nik's approved 1536×864 key-art reference.
2. Apply the designated panel / cleanup edits.
3. Align edited result back to the original.
4. Keep changed pixels only inside approved edit zones, with the specified feather.
5. Restore the original everywhere else.
6. Preserve approved faces, hands, room, lighting, framing, and unaffected scene pixels.
7. Upscale ×2 for DPR2.
8. Record SHA-256 for the resulting locked plate.

If the edit fails three times, use the documented R1 Route B fallback.

---

## Production Guardrails

1. Do not redesign product behavior.
2. Manager 1 remains Daniel.
3. Manager 2 remains Nik.
4. Do not reintroduce box-heavy CP1P / CP1Q styling.
5. The physical plate should carry premium cinematic depth.
6. DOM content must align to the physical blank panels rather than float independently.
7. Privacy states must remain functional DOM states, not baked image states.
8. Remove AI-generated real-player faces, names, fees, handwriting, and other prohibited red-zone material per the existing player imagery policy.
9. Decorative Showdown brand text that the approved ticket allows may remain in the art.
10. Re-resolve `main` before any production copy modification.

---

## Required Next Sequence

Proceed in this order:

1. Receive Nik's edited plate:
   `ENV_TR2_PLATE_G_EDIT_V1.png`

2. Run the likeness lock / pixel restore against the approved original reference.

3. Produce the locked, DPR2 plate and record its SHA-256.

4. Build Guess Entry desktop first using the approved simplified copy.

5. Self-check the result against:
   - owner visual parity;
   - panel registration;
   - likeness preservation;
   - privacy correctness;
   - live control fit;
   - functional mechanics.

6. Then build Transfer Window on the same plate.

7. Then perform mobile recomposition.

Do not reopen S2 through S7 unless a concrete implementation conflict is discovered.

---

## What Claude Now Has From Sol

Claude's required Sol input is complete.

S2 row decisions: COMPLETE.  
S3 through S7 decisions: COMPLETE.  
Transfer visual direction: APPROVED.  
No additional Astra question is required.

The remaining external input is the edited plate:

`ENV_TR2_PLATE_G_EDIT_V1.png`

Once that plate exists, proceed directly to likeness lock and Guess Entry build.

---

SOL RECONCILIATION COMPLETE — RETURN TO CLAUDE OPUS 5.5 FOR PRODUCTION
