# Haiku V board keeper kit

Written 2026-10-10 by the Team G thread "Haiku V board keeper" so a new Team V project thread can take over. Nik's choice: keep the keeper and its relay link to Team G, run from the Team V project.

## Files this keeper owns (Team V side)
- `project-documents/gameplay-factory/tools/wow_svg.py`: the visual board SVG (KPI tiles, goal bars, hand-off stack, V job bars with live CI and last move).
- `project-documents/gameplay-factory/CUSTOM_VIEW_V.svg`: the committed SVG that RELAY.md embeds.
- `project-documents/gameplay-factory/CUSTOM_VIEW_V.html`: the Team V view (banner, SVG, link to BOARD.md). Written by the poller from `custom_view.py` (`v_page()`).
- The Team V banner and V page code in `tools/custom_view.py` (`v_page`, `v_svg`, `v_live`).

## Shared with Team G (do not rewrite; coordinate)
- `tools/custom_view.py`: one renderer for both views. Change only the V functions.
- `tools/relay_page.py`: writes RELAY.md (embeds the SVG).
- `CUSTOM_VIEW.html`, `BOARD.md`: Team G's files. Not ours.

## Overlap to fix (open)
- "Claude" (Team G board session) commits "Board: re-render" that also rewrites `CUSTOM_VIEW_V.html`. Ask Team G to stop writing that file; it is ours.

## Relay link to Team G
- Relay branch: `leads/relay` (tracker PR #312). Team G's relay session is listed in `project-documents/leads-relay/INBOX.json` under "G".
- Post hand-offs with `handoff.py`, as the relay CONTRACT says.

## Routine
- The free poller (`gameplay-factory-progress.yml`, bot commits) re-renders all V files every few minutes. Do not hand-write numbers.
- Watch for real moves: V job moves or relay state changes, not clock-only commits.
- On a real move, the Team V project's own tab updates only when Nik types "update the job board" in that project chat or taps Refresh there. Nothing can refresh it automatically.

## First step for the new thread
1. Read this kit, then `CUSTOM_VIEW_V.html` and RELAY.md on factory/gameplay-v1.
2. Confirm the V files list above, then say so in the thread.
3. Archive the old Haiku V thread after the first commit lands.

## One line for Nik to paste into the Team V project chat
"Start a Haiku board keeper for Team V from project-documents/gameplay-factory/keepers/HAIKU_V_KEEPER_KIT.md on factory/gameplay-v1, and keep it linked to Team G through leads/relay."
