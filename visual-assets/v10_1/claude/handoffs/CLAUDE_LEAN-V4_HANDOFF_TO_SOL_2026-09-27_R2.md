# CLAUDE -> SOL HANDOFF - LEAN-V4
Owner budget reset: lean studio routing V4; Claude chat becomes the default builder (final, R2 supersedes R1)

| Field | Value |
| --- | --- |
| Task ID | LEAN-V4 |
| Claude model | Opus 5.5 (Claude Project chat) |
| Date | 2026-09-27 |
| Source anchor | `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`, SOURCE_DRIFT no (checked this session) |
| Supersedes | Routing V3 §2–§5a wherever they conflict. `CP1P_CLOUD_REVISE_BRIEF` Part A/B split, budgets, evidence list and review routing. SW1 CP1P card (replaced by Sol's normal check). |
| Write operations | none |

## 1. Owner decision (Nik, 2026-09-27)
- About $78 credit is left. Keep **$43–50 for the main project**. **All remaining visual Cloud work across all 10 screens: target $30, hard stop $35.**
- The current process (brief → sign → Cloud → gate card → review → re-brief, with split sessions and large evidence sets) costs too much per screen. It is replaced by the rules below.

## 2. Where work runs (free lanes first)

| Lane | Credit cost | Does |
| --- | --- | --- |
| **Sol (ChatGPT, GPT-5.6)** | none | Product truth; gate checks on Cloud results; all docs, state and commits; **exact CSS, string or number edits of ≤ ~40 lines** (no rendering needed); writing Cloud launch prompts from Claude's cards; the budget ledger |
| **Nik (ChatGPT images)** | none | Image assets |
| **Claude Project chat** | **none: weekly plan limit, confirmed by Nik 2026-09-27** | **Default builder.** Direction, the build itself (code changes rendered and QA'd with Playwright in the chat workspace), and review. **Commits and pushes to `visual/cinematic-system-v10` itself** (never `main`); Sol reviews. |
| **Cloud (claude.ai/code)** | credit | **Contingency only:** a job the chat can't finish (weekly limit reached, or a very long multi-file production integration). Nik approves each use. |

## 3. Cloud contingency budget (Sol keeps the ledger in `V10_STATE.md`)
With Claude chat building, the expected Cloud spend is **$0–10**. The caps below apply only if a screen falls back to Cloud.

| Work | Model · effort | Cap |
| --- | --- | --- |
| Transfer: CP1P look pass (prototype) | Claude chat | **$0** |
| Transfer: production integration, 4 phases, static + CSS fades | Opus 5.5 · High (first-of-kind) | **$8** |
| Home + Create Showdown + Loading (WS-2 batch) | Opus 5.5 · Medium | **$6** |
| Dashboard + Results Entry (WS-1 reuse) | Opus 5.5 · Medium | **$4** |
| League wheel + Club wheel (HUD reskin only; existing visuals stay) | Opus 5.5 · Medium | **$3** |
| Season Summary + Legacy (WS-3) | Opus 5.5 · Medium | **$5** |
| **Total if every screen fell back** | | **$26**; hard stop $35 |

When a session hits its cap, it stops, commits and reports. The result is accepted or deferred; there is never a second full run.

## 4. Per-screen process (at most 3 steps)
1. **Claude card:** one direction-and-build card per screen or batch, ≤ 60 lines, with exact values and reuse of the Transfer kit (glass pane, wells, plaques, sealed object). Sol product-truth checks it in the same ChatGPT pass and writes the Cloud launch prompt.
2. **One build in a Claude chat** (Opus 5.5 · High): clone, change, render and QA in the chat workspace. Deliver the changed files plus **4 screenshots max** (DPR 1: key desktop frame, alternate state, mobile, blur) and a QA JSON. Sol commits. A Cloud build happens only as the §2 contingency.
3. **Owner look:** Nik views the screenshots. ACCEPT, or **one** fix round in the same or the next Claude chat. Anything left after that is logged as "later polish". Sol product-truth checks the diff before merging.

## 5. Cuts (standing)
- **No prototype-then-integrate for later screens.** Build directly on a visual branch of the production page. Sol reviews the PR diff for behaviour. Transfer is the only screen that keeps its prototype, because it already exists.
- **No separate Stage Engine.** CSS transitions and cue classes only, with reduced motion respected. Revisit only if money remains at the end.
- **QA script asserts only:**
  - zero console errors;
  - controls reachable at 1366×640 and 390×844;
  - control and font sizes;
  - AB1 (no four-sided-border boxes);
  - privacy (no rival data);
  - strings and IDs unchanged.
- **Handoff files are 1 page** (this one is the length ceiling). Long analyses only when Nik asks.
- **Opus 5.5 · Medium is the Cloud default.** High only for Transfer's production integration. Extra high never in Cloud.
- **Optional polish is dropped** unless the owner asks: CP1R R1 hair rim, P6 contact shadows, DPR 2 evidence.

## 6. CP1P: Option A confirmed (Claude chat, $0 Cloud)
- A new Claude Project chat (Opus 5.5 · High) turns the validated mock into real changes to `styles.css`, `frames.js` and `tools/render-and-qa.cjs`, following `CP1P_CLOUD_REVISE_BRIEF_TR2_SLICE01.md` with these amendments:
  - **Do:** B0, M2, M3 + M5, M4, P1, P2, P3, P4, P5, R3, and A1 (R2 denoise export).
  - **Drop:** A2 (R1 hair), P6.
- It renders F1, F2, F3 (1366×768), F2 1366×640, F5 390×844 and the F2 blur, runs the QA assertions (B0, M2/M3/M5, M4, AB1, PV1, PV2), and delivers the changed files plus screenshots.
- **Sol commits** to `claude-cloud/transfer-tr2-slice-01` and checks product truth. The SW1 card is superseded.
- **PT1–PT4 still need Sol's decision before that chat starts.** PT1 (no padlock on the rival's side) is the important one.
- **Push access (Nik decision, 2026-09-27):** Claude chats may commit and push to `visual/cinematic-system-v10`. **Never to `main`.** Sol reviews each push and keeps state current.
- **Question for Sol:** the Transfer prototype lives on `claude-cloud/transfer-tr2-slice-01`, not the visual branch. Either merge that slice into `visual/cinematic-system-v10` so the next Claude chat builds there, or ask Nik to extend push rights to that task branch.

## 7. Recommended Sol next actions
1. Record §1–§5 as `STUDIO_WORKFLOW_AND_ROUTING_V4_LEAN.md` and add the ledger to `V10_STATE.md`: $78 now, $43–50 reserved, Cloud used only as contingency. Update the Project instructions: the Claude chat builds, and Cloud is contingency.
2. Decide PT1–PT4 on the CP1P brief, apply the §6 amendments to its header, and mark the SW1 CP1P card superseded.
3. Answer the slice-location question in §6, then hand the signed brief to a new Claude chat.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION
