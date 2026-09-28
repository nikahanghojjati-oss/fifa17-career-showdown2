# V10 NEXT

## Immediate action — run CP1 in Claude Code Cloud

Recipient: Claude Code Cloud implementation worker  
Surface: claude.ai/code, new hosted Cloud session  
Repository: nikahanghojjati-oss/fifa17-career-showdown2  
Branch: claude-cloud/transfer-tr2-slice-01  
Current prepared branch head: ab36d9bcef58775c1fc1fb525997f8ec70d0cc69  
Model: Sonnet 5  
Effort: High  
Fallback: Opus 5.5 at Medium if Sonnet 5 is unavailable; record which model actually ran.

Upload:
TR2_CP1_ASSETS.zip

Expected zip SHA-256:
1e38367cfc4a170b47ae133bd7aa838b4b1b3b061703d70ec7fe8b5a059b2454

First message:

`Run the brief at visual-assets/v10_1/tr2/CP1_CLOUD_BUILD_BRIEF_TR2_SLICE01.md. Assets are in the uploaded zip.`

## Cloud authority

The committed brief is self-contained and product-truth signed.

Cloud must:
1. verify all source hashes and fail closed on mismatch;
2. run the bounded asset-intake pipeline;
3. build F1–F5 and S1–S2 only;
4. render the required evidence;
5. run the brief's self-QA;
6. commit and push CLOUD_BUILD_RESULT.md;
7. stop.

Cloud has no taste authority and may not self-approve visual quality.

## Hard stop

Do not:
- add motion or transitions;
- build the Stage Engine;
- integrate with production;
- modify main;
- modify production js/, css/, index.html, data/ or assets/;
- open a PR;
- merge.

## Public-repository awareness

The brief commits the five approved source images under the task branch. Because the repository is public, the two approved Window poses will become publicly visible when Cloud commits them. Proceeding with the Cloud run means accepting that repository exposure.

## After Cloud returns

Return the exact Cloud result to GPT-5.6 Sol first.

Sol checks:
- task branch and head;
- product truth;
- branch safety;
- unauthorized behavior changes;
- source hashes / provenance;
- required result and evidence inventory.

If the Sol check passes, Nik opens a fresh Claude Project chat:

Model: Opus 5.5  
Effort: Extra  
Instruction:

`CP1 review: claude-cloud/transfer-tr2-slice-01 @ <Cloud head SHA>`

Paste Sol's product-truth / branch-safety check.

No image attachments are required for that producer review; Claude reads the frozen evidence from the repository.

Claude then returns APPROVE_FOR_OWNER_REVIEW or REVISE, plus the Nik skin-texture decision.
