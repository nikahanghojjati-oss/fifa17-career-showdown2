# V10 NEXT

## Immediate action — run CP1R revision in Claude Code Cloud

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`  
Task branch: `claude-cloud/transfer-tr2-slice-01`  
Start from frozen CP1 head: `646e227aa71cd5d712c791e6436ece103a2e2dfd`  
Model: **Opus 5.5**  
Effort: **Medium**  
Stop budget: **30 min / $6 credit**

Use the signed brief:

`visual-assets/v10_1/tr2/CP1R_CLOUD_REVISE_BRIEF_TR2_SLICE01.md`

Cloud authority is exact-delta implementation and evidence only. No taste verdict, no production integration, no PR and no merge.

Priority order:

`M1 > M2 > M3 > M4 > R2 > R1 > R3 > R5 > R4 > evidence`

At 24 minutes, stop adding scope and finish/capture/commit completed work. At 30 minutes, stop.

## After Cloud returns

Cloud must return `CLOUD_BUILD_RESULT_CP1R.md`, the revised head SHA, `render_qa_report.json`, updated CSS/manifest and the required evidence.

Then:

1. Return the exact Cloud result to GPT-5.6 Sol Chat for branch-safety and product-truth reconciliation.
2. Open GPT-5.6 Sol in ChatGPT Work mode · High and run:
   `visual-assets/v10_1/coordination/SOLWORK_CP1R_GATE_PRECHECK_TASK_CARD.md`
3. Sol Work returns G1–G15 PASS / FAIL / MISSING.
4. ALL-PASS → Claude Project taste-only verify review. HAS-FAIL → Claude Project High re-brief.

Do not send CP1R back to Claude for visual review before the Cloud revision and Sol Work gate pre-check are complete.
