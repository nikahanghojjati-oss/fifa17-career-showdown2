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
- Q-1 (2026-11-24 19:47 UTC): REPORT P1 report: PR #1609 head 14ab2f2c | rooms done: Platinum HOME phone (V3 + 590W), Platinum phone slab (ENV_SLAB_PHONE_HC_V1 + 590W) | Gate: running on 14ab2f2c | flash x4: not run here (this session has no browser; needs the Gate's run) | faces: 0 px pre-encode, decoded mean 1.47 / 2.26 (2 plates) | waiting on: phone bands HO-114..122, HO-132..141, HO-151..160; slabs HO-131, HO-150; League Roulette HO-162..167; Club sideways HO-168..170 (done)
  - #1609 is a draft because it stacks on #1604 (still open). It goes ready once #1604 merges and the base is current.
  - BOX SIDEWAYS cut measured on the Wooden pair: (0, 60, 3072, 1596) of the empty 2X room, scaled to 2400x1200 (1.24 levels, i.e. WebP noise). It builds when HO-165..167 land. CLUB SIDEWAYS and the League Roulette phone room (with its TALL) are wired to build the same way.
  - For B7: the desktop slab files (ENV_SLAB_HC_V1_*, TILE_SLAB, UI panel tile) come from the same HO-112 painting and are not in #1609.
- Q-2 (2026-11-24 19:52 UTC): Re A-1 and N-2. The 4x face crops against Wooden (both Home plates) and the 390x844 plate comparison are committed in #1609 under project-documents/factory/reviews/DUET_P1/platinum-home/. GitHub shows them as images in the Files changed tab, and the PR body now names each file. This session can't put images or links in a PR body (they arrive as plain code text), so every P1 PR will name its crops the same way. Codex reviewed 14ab2f2c and found no issues. #1609 stays a draft until #1604 merges; when I mark it ready I'll add "@codex review", and the Gate and flash run then.

## To Duet
- A-0 (2026-11-24 19:40 UTC): Sideways answer (job file audit-packets bc9d2d4a).
  - **BOX SIDEWAYS:** no ticket of its own. Derive it from the painted EMPTY League Roulette desktop rooms (HO-165..167). Match the Wooden ENV_BOX_SIDEWAYS_HC_V4 against the Wooden ENV_BOX_PLATE_EMPTY_HC_V4_2X to get the scale and offset, then apply the same cut to each painted empty room.
  - **CLUB SIDEWAYS:** new tickets HO-168 (Platinum), HO-169 (Metallic Black) and HO-170 (Matte), on leads/relay dc779a39. Each delivers ENV_CLUB_SIDEWAYS_<LOOK>_P1 at 2532x1170. Write it to plates-hc/<key>/ENV_CLUB_SIDEWAYS_HC_V4.webp. No mask is needed.
  - REF_CLUB_SILVER_SWATCH is posted on leads/relay (81965568), so Platinum HO-168 can be painted now.
- N-1 (2026-11-24 19:40 UTC): HO-113 (Platinum HOME phone band) is DONE on leads/relay 1c8d122a. Build and wire it, plus every other delivered phone band, then post a REPORT.
- A-1 (2026-11-24 19:45 UTC): Got the REPORT for #1609 (14ab2f2c). I passed it to the r100 lead, and the desktop-slab note went to B7. Keeping it a draft until #1604 merges is right. When it goes ready, add "@codex review" (or say if Codex is out). The flash x4 proof comes from the Gate run. Keep building each band as it lands.
- N-2 (2026-11-24 19:46 UTC, from the lead): The Gate skips drafts, so #1609 has no Gate or flash proof until it is marked ready; the clubhouse flash run happens then. The faces (1.47 / 2.26) are within the rule, but #1609's PR body must show the 4x face crops against Wooden so Nik can judge them. Add them now, and do the same in every P1 PR.
