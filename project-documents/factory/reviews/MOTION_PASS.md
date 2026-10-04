# Motion consistency pass

Job 107 · part 1 of 6 · Home, League, Club Assignment, Transfer War, Loading

Shared baseline from `visual-assets/v10_1/shared/MOTION.md`:
scene 0–400 ms; characters 150–600 ms; title from 250 ms; panels from 400 ms with 60 ms stagger capped after panel six; useful UI by 600 ms; entrance cleanup by 1200 ms; reduced motion is a 150 ms opacity fade with travel, wipes, glints, pulses, bursts and count-ups suppressed.

| Screen | Entrance total | First usable | Stagger | Easing | Reduced-motion path | Claude frame-strip target | MOTION.md outlier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 1200 ms visible finish | Before 600 ms; controls are real DOM and listeners attach during init | 60 ms for destinations/panels | `cubic-bezier(.22,1,.36,1)` | Shared 150 ms fade for OS/app preference; tilt, glints, vinyl spin and character sweep stop | [`home/evidence/motion/`](../../../visual-assets/v10_1/home/evidence/motion/) | REASONED: desktop Daniel/Nik are baked into the plate, so independent character slides/light sweep occur only on phone; phone follows shared character timing. |
| League | 1080 ms visible choreography; shared cleanup 1200 ms | 600 ms | 60 ms | `cubic-bezier(.22,1,.36,1)` | Shared fade-only entrance; product wheel uses its preserved 80 ms reduced-motion spin; ticks, blur, particles and brush travel stop | [`league/evidence/motion/`](../../../visual-assets/v10_1/league/evidence/motion/) | NONE for entrance. The 4000 ms wheel spin is product-owned interaction after entrance, not an entrance-budget deviation. |
| Club Assignment | 1200 ms | 600 ms | 60 ms | `cubic-bezier(.22,1,.36,1)` | 150 ms linear entrance fade; signature pack/reveal motion collapses to opacity-only reduced-motion treatment | [`club/evidence/motion/`](../../../visual-assets/v10_1/club/evidence/motion/) | NONE for entrance. Product stage timestamps and pack-rip reveal are separate state choreography and do not block the shared 600 ms usable point. |
| Transfer War | Shared cleanup 1200 ms; primary payoff ends by 1080 ms | 600 ms | 60 ms, capped after the sixth panel | Shared `cubic-bezier(.22,1,.36,1)` | Shared 150 ms fade when either reduced-motion source is active | [`tr2/slice-02-plate/evidence/motion/`](../../../visual-assets/v10_1/tr2/slice-02-plate/evidence/motion/) | NONE. Desktop managers are plate-baked; independent left/right roles are intentionally portrait-only, matching the screen build note. |
| Loading | NOT DOCUMENTED in BUILD_RESULT | NOT DOCUMENTED | NOT DOCUMENTED | NOT DOCUMENTED | Progress glint and shared atmosphere are suppressed; committed QA reports zero running animations under reduced motion | [`loading/evidence/motion/`](../../../visual-assets/v10_1/loading/evidence/motion/) | OUTLIER: BUILD_RESULT has no Motion section, so entrance total, 600 ms usability, stagger and easing cannot be verified from the source named by this job. |

## Evidence status

At branch head checked during Job 107, none of the five `evidence/motion/` directories contains committed frame strips. The links above are the required Claude intake targets. This review does not invent or record motion evidence.

## Findings

1. Home, League, Club Assignment and Transfer War all document the shared ≤1200 ms entrance budget and ≤600 ms usable point.
2. Their entrance panel cadence is consistently 60 ms where panels are staged, with the shared `cubic-bezier(.22,1,.36,1)` easing documented or inherited from the shared kit.
3. Their reduced-motion behavior follows the shared fade-only contract; screen-specific product interactions retain only explicitly documented reduced-motion behavior.
4. Loading is the only collection outlier in this group because its BUILD_RESULT lacks the timeline fields required for a consistency comparison. This is a documentation/verifiability outlier, not evidence of a confirmed runtime timing violation.
