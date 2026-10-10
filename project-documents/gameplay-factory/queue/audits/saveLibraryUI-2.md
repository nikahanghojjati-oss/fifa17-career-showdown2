# JOB-1502 · saveLibraryUI.js second half audit

Read: `js/saveLibraryUI.js` lines 370 to 727 (the second half of 727 lines).

## Finding 1 · PROBABLE · APPLY LINK on a Save role with no linked profile sends an empty profile ID

- **File and line:** `js/saveLibraryUI.js` line 471 (`select.value=config.currentProfileId||"";`), line 405 (`const profileId=...`), line 410 (`profileLabel`), and lines 424-425 (the save call).
- **What the player sees:** a Save role that has no linked Local Profile shows "Current: UNRESOLVED". Its select has no UNRESOLVED option (the option is added only for historical rows, line 457), so the select is left blank. If the player taps APPLY LINK without choosing a profile, the confirmation reads "Link … to UNRESOLVED?". After OK the runtime rejects the change, and the notice says "A stable Local Profile identity is required." The player is asked to confirm a link and then gets an error for a choice they never made.
- **Why the code does it:**
  ```
  select.value=config.currentProfileId||"";                       // line 471: no matching option, so the select stays blank
  const profileId=config.kind==="legacy"&&!select.value?null:select.value;   // line 405: "" for a Save row
  ```
  For a Save row (`kind:"save"`), an empty value is not mapped to `null`, so `""` reaches `assignSaveManagerProfile`, which requires a profile ID (`runtimeGetProfileEntry` in `js/saveLibraryRuntime.js`).
- **Smallest change:** for `kind:"save"`, disable APPLY LINK while `select.value===""`, or add a disabled placeholder option ("CHOOSE A LOCAL PROFILE") and keep the button off until a profile is picked.
- **Confidence limit:** PROBABLE, not SURE. Save roles normally receive profile IDs when they are created, so this needs a Save role whose profile link is missing (for example after an identity change). The code path itself is confirmed.

## Riskiest places checked (no other real bug found)

1. Lines 677-717 (`saveLibraryUIRender` and the remount observer): the old panel is removed before the new one is prepended, and the observer returns early when the panel exists (line 713), so the re-render does not loop.
2. Lines 402-438 (`saveLibraryUIApplyIdentityLink` busy guard): the busy flag and the disabled buttons are set after the confirmation (lines 419-422), and they are restored only if the element is still connected (lines 436-437), so a double tap cannot submit two link changes.
3. Lines 524-529 (historical filter): a Legacy record is hidden from the historical list when its stable Save ID or its Showdown ID already belongs to a live Save. A record is therefore shown in one place only.

No game file was edited. This job adds one audit file only.
