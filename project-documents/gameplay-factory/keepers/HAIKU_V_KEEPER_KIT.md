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
- `RELAY.md`: written by `relay_page.py` from the relay branch. Shared; Team G's relay session may change the relay text, but not the V embed line.

## Render split (done 2026-10-10 14:13 UTC, Nik's yes)
- `custom_view.py` with no flag writes only `CUSTOM_VIEW.html` (Team G).
- `custom_view.py --v` writes only `CUSTOM_VIEW_V.html` and `CUSTOM_VIEW_V.svg` (Team V). The poller runs both (gameplay-factory-progress.yml).
- Team G must not write, overwrite or hand-edit any V file. Team G's board sessions run the plain command only.
- Shared facts (job moves, relay state) travel through leads/relay and the factory SHA, never through each other's files.

## Relay link to Team G
- Relay branch: `leads/relay` (tracker PR #312). Team G's relay session is listed in `project-documents/leads-relay/INBOX.json` under "G".
- Post hand-offs with `handoff.py`, as the relay CONTRACT says.

## Routine
- The free poller (`gameplay-factory-progress.yml`, bot commits) re-renders all V files every few minutes. Do not hand-write numbers.
- Watch for real moves: V job moves or relay state changes, not clock-only commits.
- On a real move, the new keeper tells the Team V project's coordinator the factory SHA (never Team G's session) so it can publish the Team V tab. The Team V project's own tab updates only when Nik types "update the job board" in that project chat or taps Refresh there. Nothing can refresh it automatically.

## First step for the new thread
1. Read this kit, then `CUSTOM_VIEW_V.html` and RELAY.md on factory/gameplay-v1.
2. Confirm the V files list above, then say so in the thread.
3. Archive the old Haiku V thread after the first commit lands.

## One line for Nik to paste into the Team V project chat
"Start a Haiku board keeper for Team V from project-documents/gameplay-factory/keepers/HAIKU_V_KEEPER_KIT.md on factory/gameplay-v1, and keep it linked to Team G through leads/relay."
