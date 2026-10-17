# V10 STATE

System: Showdown Visual
Canonical visual branch: visual/cinematic-system-v10
Production anchor: main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962
SOURCE_DRIFT: NO

Owner / final taste authority: Nik
Lead Visual Producer + Visual Coordinator: Claude Opus 5.5 in Claude Project
Program Coordinator / Product-Truth Guard / Repo Steward: GPT-5.6 Sol
Default implementation worker: Claude Code Cloud Sonnet 5
First-of-kind architecture / rescue worker: Claude Code Cloud Opus 5.5
Cinematic specialist: GPT-6 Astra High
Integration architecture specialist: GPT-6 Sol High Work
Runtime QA: Claude in Chrome

## Active visual authority

Routing:
visual-assets/v10_1/coordination/STUDIO_WORKFLOW_AND_ROUTING_V2.md

Likeness imagery:
visual-assets/v10_1/coordination/LIKENESS_IMAGE_WORKFLOW_V1.md

Player imagery:
visual-assets/v10_1/coordination/PLAYER_IMAGERY_POLICY_V2.md

Claude Project instructions:
visual-assets/v10_1/claude-project/CLAUDE_PROJECT_INSTRUCTIONS_V2.md

Coordinator decisions:
visual-assets/v10_1/coordination/SOL_RECONCILIATION_VPD02_VPD03_2026-09-27.md
visual-assets/v10_1/coordination/SOL_RECONCILIATION_GATE0_R1_R2_2026-09-27.md

## Transfer direction

Owner accepted:
- two-sided Transfer War table;
- close two-shot;
- hanging Window clock;
- gold-dominant grade;
- rival Sealed Dossier;
- multiple phase-aware poses;
- own-signings-only verdict reactions;
- licensed real-player photo strategy.

Old C2 technical proof remains rejected as visual target.

## Gate 0 — final status

ROUND 2 COMPLETE. GATE 0 PASSED.

All five Transfer Gate 0 assets are approved:

Approved with CP1 intake fixes:
- `ENV_TR2_WARROOM_PLATE_V1`;
- `POSE_TR2_DANIEL_WINDOW_PITCH_V1`;
- `POSE_TR2_NIK_WINDOW_POINT_V1`.

Approved by reuse:
- `POSE_TRANSFER_DANIEL_FOCUSED_V1` for Guess Entry;
- `POSE_TRANSFER_NIK_TACTICAL_V1` for Guess Entry.

Current blockers: NONE.

CP1 intake requirements:
- environment plate: remove corner mark and perform approved upscale;
- Window poses: remap alpha 248–254 to 255;
- Window poses: erode 1–2 px and decontaminate warm edge fringe;
- Nik Window pose: judge skin crackle at CP1 display size; light skin-only denoise only if visible.

## Likeness method

`LIKENESS_IMAGE_WORKFLOW_V1.md` is STANDARD.

Golden anchors remain:
- Daniel: `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`;
- Nik: `POSE_TRANSFER_NIK_TACTICAL_V1.png`.

The approved Window poses are not golden anchors.

## CP1

CP1 is UNBLOCKED FROM GATE 0, but implementation has not started.

Do not create `claude-cloud/transfer-tr2-slice-01` until Claude issues the final CP1 `CLOUD_BUILD_BRIEF` with the intake manifest.

Next authority handoff: Nik opens a fresh Claude Project chat, Opus 5.5 High, and asks for `CP1 brief`. No image attachments are required because Gate 0 R2 already records the approved asset IDs and hashes.

## Main-project Cloud-credit reserve

Keep a meaningful Cloud-credit reserve for main-game readiness / E2E testing.

## Transfer War · Plate G (Sol decisions TW-PLATE-G R2, 2026-09-28)

Decision record: `visual-assets/v10_1/coordination/SOL_DECISIONS_TO_CLAUDE_TW_PLATE_G_R2_2026-09-28.md`.

- Accepted Claude working head: `claude-cloud/transfer-tr2-plate-g @ 03003c2` (R1 history point `f2125a5`). No merge is authorised.
- Likeness (TWG-S1): an owner-accepted edited image is the likeness authority for its locked plate. Restoring against an earlier source applies only to edits that are not owner-accepted, or when Nik asks. See LIKENESS_IMAGE_WORKFLOW_V1 Part F.
- Asset ledger (TWG-S2): every approved image used by the visual system has a repo path and SHA-256 in `visual-assets/v10_1/tr2/ASSET_LEDGER.md`. Once an asset is in the ledger and verified, it is never requested from Nik again, unless the hash is missing, the file is corrupt, or Nik supplies a replacement himself.
- Environmental sign exception (TWG-S7): read-only live content on a painted in-world sign may be rotated to match the board (Plate G: ≈7.5°). Form fields, buttons and any interactive text stay screen-aligned.
- F1 rival privacy (TWG-S10): during the Transfer Window the non-viewer panel shows the same constant sealed frost + CM17 seal as Guess Entry, with no live rival data and no state-dependent variation (text length, controls, glow, animation, loading state or geometry).
- Desktop exception (TWG-S6): 31 px controls at 1366×768 on Plate G are accepted; do not go lower. Mobile keeps 44 px targets and 16 px inputs.

## Owner decisions (Nik, 2026-09-28 09:27 ET)

1. **No player photos for now.** Signings and verdicts show no player pictures. Real-player imagery is too slow and too inconsistent to reach a good result. `PLAYER_IMAGERY_POLICY_V2` is suspended until Nik reopens it. Player names, leagues and nationalities stay live DOM text; nothing is baked into images.
2. **Model roles:**
   - Claude (Claude Project + Claude Code) owns visual direction, builds, QA of visual builds and handoffs.
   - ChatGPT is used only as:
     - (a) coordinator: GPT-5.6 Sol in chat, for product truth, branches and state;
     - (b) Codex code review when a change needs one; visual prototypes normally don't;
     - (c) QA on the main project's QA branch `project/showdown-qa-reliability`.
   - ChatGPT Work mode (Sol / GPT-6 Sol / Astra) is no longer routed visual tasks: no task cards, no gate pre-checks.

## Transfer War · current head
`claude-cloud/transfer-tr2-plate-g`: F1 Transfer Window + Guess Entry built for desktop and phone (phone fits one screen, both managers whole), QA 37/37. **Owner look PASSED 2026-09-28** at `d5e45d4`. See `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` R3–R3.2. No merge authorised. Next: Signing Entry + Verdicts (text-only), after Sol issues the string deck.
