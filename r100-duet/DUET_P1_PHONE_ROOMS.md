# Duet job P1: premium clubhouse phone rooms (3.0.0 Phoenix)

Model: Opus 5.5, high effort or above (SENSITIVE: room plates load at startup, so a mistake can flash, cover a face or break a screen on phones). Never Sonnet or Haiku.

Nik picked this job on 2026-11-24 (card "Phone plates and Story only"). It replaces the D1-D13 test jobs.

## Who's who
- Repo: nikahanghojjati-oss/fifa17-career-showdown2. Base branch: `gameplay/r100`.
- The r100 lead merges. You open PRs into `gameplay/r100` and never merge, never touch `main`, `leads/relay`, the version, or the service worker's version line.
- B7 (the project's clubhouse thread) keeps the DESKTOP rooms and cuts the people-free swatches Team V paints the phone bands from. You own the PHONE side: every phone band, plus the slab, loading and club rooms where they feed phones.
- Nik pastes your report into the lead thread. Keep it short (format at the end).

## Read first
- **`/mnt/project-files/gameplay/r100/threads/B7_STATUS.md`, section "how phone plates are built"** (copied to this branch as `r100-duet/B7_PHONE_PLATES_NOTES.md`). Start from paint.py on branch `claude-gameplay/r100-premium-pilot-rooms` (PR #1604), not the base.
- `tools/clubhouse-themes/` (build.py, paint.py, pin.py, finish.py, masks/): how the pilot rooms were built. paint.py lays the Wooden managers' own pixels back over a painting through a mask pulled in 3 px, so faces stay pixel-identical to Wooden.
- `visual-assets/v10_1/plates-hc/` and `visual-assets/v10_1/plates-hc/{silver,black,matte}/`: today's plates (63 per clubhouse, recoloured).
- PR #1604 (pilot rooms: Board Room + Home for all three clubhouses) and PR #1600 (per-clubhouse UI finish): the patterns to follow.
- `css/r78-marble-surfaces.css`, `js/settings.js`: how a clubhouse is chosen and applied.
- `AGENTS.md` and the house rules in `r100-sol/_HOUSE_RULES_R100.md` on this branch.

## The paintings
Already unblocked (2026-11-24 17:58 UTC): Platinum swatches for Office, Hall, Archive and Directors' box are on leads/relay 677c73e2 (HO-115..118 can be painted). Build each band when its DONE lands.
Tickets HO-104..HO-160 (Silver = Platinum 104-122, Metallic Black 123-141, Premium Matte Black 142-160). Per clubhouse: 8 desktop rooms + 1 material slab (B7), then 10 phone bands (`ENV_<ROOM>_PHONE_<LOOK>_P1`, rooms HOME, BOARD, OFFICE, HALL, ARCHIVE, BOX, COACHES, TUNNEL, CLUB, LOADING). Team V delivers to `project-documents/hc-art/ho-premium-full/<clubhouse>/` on its branch; the DONE entries on `leads/relay` name the exact branch and path. Fetch with `git fetch origin leads/relay:refs/remotes/origin/leads/relay` (explicit refspec).

## The job
**Order:** do steps 0-1 before any painting arrives.
0. Make the missing masks, then prove the whole pipeline end to end on today's recoloured phone plates as stand-ins (masks, sizes, face check, gallery shots). Don't open a PR for stand-ins. This is so each real band can go in within about an hour of its DONE.
1. Extend the build so a delivered phone band becomes every phone file the game uses for that room and clubhouse (TALL upright, SIDEWAYS, and any _1X/_590W size the Wooden phone plate has). Derive sizes in code from Team V's master where the framing matches. **TALL (1179x2620) is a different framing from the 9:16 band for BOX, COACHES and HALL, so it is not a resize there.** For those, build TALL from the Wooden TALL plus the painted band with a composition matched by hand, or tell the lead it needs its own Team V ticket. **No mask exists yet for BOX_PHONE_HC_V4, the SIDEWAYS plates or the V4 TALL: make those masks first** (same method as tools/clubhouse-themes/masks), and show them in the PR. Lay the managers' Wooden pixels back exactly as paint.py does for desktop, so faces are identical to Wooden in every clubhouse. Rooms with no men (CLUB, LOADING, slab) need no mask.
2. Wire each delivered band the way #1604 wired the pilot. build.py must skip painted plates. pin.py updates the pins.
3. Work in batches as paintings land. One PR per clubhouse is fine, or one per batch. Open each PR as ready (not draft) only when its base is current. If it stacks on another open PR, open it as a draft until that one merges.
4. Platinum: no player-visible text may say "Silver". The key `silver`, CSS hooks and `*_SILVER_*` file names stay.

## Never
- Never change a Wooden plate or any face pixel. Never dim, tint or blur the managers. Never let anything cover a face, a hand or a button.
- Never add startup bytes. The startup gzip budget is nearly full, and plates load as images.
- Never read production Firestore. Never add a scheduled or timed workflow.
- No backward compatibility work (pre-launch rule): only the 3.0 build matters.

## Proof on each PR's exact head
- Showdown Gate green, including the clubhouse flash run: `npm run test:v10-flash:clubhouses` locally (Wooden, Platinum, Metallic Black, Premium Matte Black; needs `CMS_CHROMIUM_MULTI_CONTEXT=1`, as the npm script sets).
- Face check: compare the masked face region of every phone plate with its Wooden plate. **0 changed pixels on the composite before WebP encoding.** After encoding, report the decoded mean difference inside the mask; the pilot measured under 1 level, so keep it there.
- Phone gallery: 390x844 upright and 844x390 sideways for every changed room in each clubhouse, plus one desktop 1920x866 shot to show nothing changed there. Put the shots in the PR body (or a link), so Nik can judge them.
- File sizes: each new phone plate within 10% of the Wooden plate it replaces.
- `@codex review` on the PR. If Codex is out of usage, say so, and the lead gets a Claude review.

## Report (paste back to Nik)
```
P1 report: PR #NNNN head <sha8> | rooms done: <list> | Gate: <green/red + run> | flash x4: <pass/fail> | faces: 0 px pre-encode, decoded mean <x> (<n> plates) | waiting on: <tickets not delivered yet>
```
Budget: about $80-150 in total. Stop and report if you pass $200.
