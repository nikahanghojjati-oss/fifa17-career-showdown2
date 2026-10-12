# JOB-1679 — showdownUI.js, second-half gameplay audit

## Finding 1 — Completed showdown still says a manager "LEADS" (SURE)

- File and lines: `js/showdownUI.js:260-277` (particularly lines 266-273).
- Player sees: After the last season is completed with a non-tied score, the dashboard's series status chip still says `MANAGER LEADS` instead of communicating that the manager has won the finished showdown. The adjacent completion hub correctly shows the winner, so the screen presents conflicting end-state language.
- Why the code does it (excerpt from lines 266-268):
  ```js
  if(one > two){
      const name = (showdown.managers && showdown.managers.playerOne) ? showdown.managers.playerOne : "MANAGER 1";
      return { label: `${String(name).toUpperCase()} LEADS`, className: "series-lead-one" };
  }
  ```
  The corresponding `two > one` branch also returns `LEADS` (lines 270-273). The only `showdown.status === "Completed"` check (line 274) is reached for tied scores, never for a non-tied completed showdown.
- Smallest change: In both winner-branch labels, select `WINS` when `showdown.status === "Completed"`, retaining `LEADS` for unfinished showdowns. Keep the current class names and scores unchanged.

Only the requested audit report was added. Gameplay files were not modified.
