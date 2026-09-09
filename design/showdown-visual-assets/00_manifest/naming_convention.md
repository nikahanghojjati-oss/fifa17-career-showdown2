# CSUX naming convention

Canonical form:

`CSUX-{seq4}-{surface}-{state}-{kind}-R{rev2}`

Rules:

1. `seq4` is chronological and immutable.
2. `surface` is the audited product surface, upper-kebab-case.
3. `state` identifies the represented product state.
4. `kind` is `SCREEN`, `OVERLAY`, `PANEL`, `COMPONENT`, `CHARACTER`, or `BACKGROUND`.
5. `Rxx` is the asset revision. Revisions never reuse or reorder sequence numbers.
6. Every asset record stores the exact source commit and source file/function.
7. Character renders use their own sequence IDs and are composed into screen assets non-destructively.

Examples:

`CSUX-0002-HOME-DEFAULT-SCREEN-R01`

`CSUX-0006-SHOWDOWN-HOME-ACTIVE-SCREEN-R01`

`CSUX-0016-PRIVATE-REMOTE-JOINING-EMPTY-OVERLAY-R01`

Reserved likeness sequence:

`CSUX-0023-NIK-MASTER-CHARACTER-R01`

`CSUX-0024-DANIEL-MASTER-CHARACTER-R01`
