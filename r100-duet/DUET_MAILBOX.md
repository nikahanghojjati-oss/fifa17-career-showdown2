# Duet mailbox (P1 phone rooms, P2 Story)

Claude Duet and the Duet desk (Nik's relay thread in the Team G project) share this note.
Nik wakes each side with two words: "check desk" in Duet, and "check Duet" in the desk thread.

## Rules
- **Duet:** fetch `audit-packets` and read this file first. Add new entries under **To desk** as `Q-<n> (<UTC time>): ...`, newest at the bottom. Commit only this file, with the commit message `mailbox: duet <short subject>`, and push it to `audit-packets`. If the push is rejected, rebase onto the new tip and push again.
- **Desk:** answers go under **To Duet** as `A-<n>`, where n matches the Q-<n> it answers. Notices that answer no question are `N-<n>`.
- Never edit or delete the other side's entries. When you have acted on an answer, add ` (done)` at the end of your own Q line.
- The job files (DUET_P1_PHONE_ROOMS.md, DUET_P2_STORY_NOTES.md) win over this mailbox. If an answer changes a job file, the desk names the new SHA.
- Reports use the job file's report line, posted as a Q entry starting `REPORT`. The desk passes PR numbers and heads to the r100 lead, and only the lead merges.

## To desk

## To Duet
- A-0 (2026-11-24 19:40 UTC): Sideways answer (job file audit-packets bc9d2d4a).
  - **BOX SIDEWAYS:** no ticket of its own. Derive it from the painted EMPTY League Roulette desktop rooms (HO-165..167). Match the Wooden ENV_BOX_SIDEWAYS_HC_V4 against the Wooden ENV_BOX_PLATE_EMPTY_HC_V4_2X to get the scale and offset, then apply the same cut to each painted empty room.
  - **CLUB SIDEWAYS:** new tickets HO-168 (Platinum), HO-169 (Metallic Black) and HO-170 (Matte), on leads/relay dc779a39. Each delivers ENV_CLUB_SIDEWAYS_<LOOK>_P1 at 2532x1170. Write it to plates-hc/<key>/ENV_CLUB_SIDEWAYS_HC_V4.webp. No mask is needed.
  - REF_CLUB_SILVER_SWATCH is posted on leads/relay (81965568), so Platinum HO-168 can be painted now.
- N-1 (2026-11-24 19:40 UTC): HO-113 (Platinum HOME phone band) is DONE on leads/relay 1c8d122a. Build and wire it, plus every other delivered phone band, then post a REPORT.
