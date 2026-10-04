# Legacy (History) review

## Verdict

## Scorecard

## Hard gates

## Evidence

Sources checked for Claude-carried measurements:

- `project-documents/factory/status/JOB-072.md`: Claude intake records `PASS 4.2` and the build-fix intake note, but it does not record numeric H5, H6, H7, H8, H9, H10, or H11 measurements.
- `project-documents/factory/status/JOB-073.md`: Claude intake records `PASS` and the phone-art clipping fix, but it does not record numeric H5, H6, H7, H8, H9, H10, or H11 measurements.
- `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md`: not present on `factory/v1-wtt5ye`.
- `visual-assets/v10_1/legacy/evidence/scores.json`: not present on `factory/v1-wtt5ye`.

| Gate | Claude-carried result | Source |
| --- | --- | --- |
| H5 · phone scroll / primary visibility at each required size | NOT MEASURED (Claude measures) | No Claude measurement in `project-documents/factory/status/JOB-072.md` or `project-documents/factory/status/JOB-073.md`; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H6 · input font size / body-text contrast | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H7 · reduced motion | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H8 · keyboard reachability / focus | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H9 · console errors / failed requests | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H10 · mockup-diff scores | NOT MEASURED (Claude measures) | `visual-assets/v10_1/legacy/evidence/scores.json` absent; no numeric H10 scores in either intake status file |
| H11 · first-paint page weight | NOT MEASURED (Claude measures) | No Claude network-weight measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |

Worker arithmetic and estimates already present in JOB-072/JOB-073 were not promoted to Claude measurements.

## Fix list
