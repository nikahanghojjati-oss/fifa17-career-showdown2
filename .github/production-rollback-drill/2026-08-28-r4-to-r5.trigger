Production Pages rollback proof trigger

Purpose: execute exactly one bounded, reversible production rollback drill after this file first reaches main.

Rollback target: 2964527c4f7fc80b16d6d5ce73bd4f5823487d2c (v1.8.1 / 1.8.1-r4)
Restore target: the exact main SHA created by publication of this trigger, whose deployed runtime identity must remain v1.8.1 / 1.8.1-r5.

Permanent boundaries:
- GitHub Pages runtime artifacts only.
- No Firebase Rules publication or mutation.
- No provider IAM or billing mutation.
- No App Check enforcement change.
- No canonical production data mutation.
- No historical rivalry mutation.
- The restore job must run after a successful artifact build even if rollback deployment or verification fails.
- The production proof is valid only when r4 is independently observed live and r5 restoration is independently observed live in the same serialized workflow run.

Do not edit or delete this trigger merely to clean up the repository. Leaving it unchanged keeps the one-shot push path inert and prevents an accidental second drill.
