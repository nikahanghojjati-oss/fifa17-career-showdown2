# SHOWDOWN VISUAL — PRODUCER -> CLOUD IMPLEMENTATION HANDOFF SCHEMA

Recipient: Claude Opus 5.5 Lead Visual Producer
Surface: Claude Chat Project
Model: Opus 5.5
Effort: Extra
Branch: visual/cinematic-system-v10
Role: output-format contract
Input authority: approved visual producer package
Expected output: one `CLOUD_BUILD_BRIEF`
Return to: GPT-5.6 Sol coordinator
Stop condition: no code

## Purpose

Claude Chat should not dump a long free-form conversation into Claude Code.

It must produce a compact, implementation-ready build brief.

## Required CLOUD_BUILD_BRIEF format

```
TASK_ID:
VISUAL_PACKAGE_ID:
TARGET_BRANCH_BASE:
IMPLEMENTATION_SCOPE:
DO_NOT_TOUCH:
PRODUCT_TRUTH:
ASSETS_REQUIRED:
ASSET_HASHES_OR_IDS:
NEW_ASSET_TICKETS:
PRIMARY_VIEWPORTS:
PHASES_STATES_INCLUDED:
MOTION_TICKETS_INCLUDED:
UI_TICKETS_INCLUDED:
RESPONSIVE_REQUIREMENTS:
ACCESSIBILITY_REQUIREMENTS:
RUNTIME_QA_REQUIREMENTS:
EVIDENCE_REQUIRED:
FILES_EXPECTED:
FINGERPRINT_REQUIRED:
STOP_CONDITION:
RETURN_SCHEMA:
```

## Cloud return schema

Cloud Code must return:

1. Task ID
2. Branch
3. Base SHA
4. Head SHA
5. Changed files
6. Candidate path/URL
7. Candidate fingerprint
8. Product-truth QA
9. State/phase QA
10. Motion implementation status
11. Desktop screenshots
12. Mobile screenshots
13. Motion evidence (video/frame sequence) when motion is part of scope
14. Browser/runtime limitations
15. Asset limitations
16. Known issues with stable IDs
17. Promo-credit burn if visible
18. Explicit statement that main was untouched
19. Handoff target: GPT-5.6 Sol

No Cloud task may self-approve visual quality.
