# SWEEP-JOB-1772 · Save Library foundation, second-half audit

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Restored Save Library could assign one Local Profile to both manager roles in a shared Showdown, mixing manager identity and linked career records. | `js/saveLibraryFoundation.js:304-314` -> `js/saveLibraryFoundation.js:307-318` | FIXED | Today's validator checks both references and rejects equality: `if(refs.playerOne != null && refs.playerOne === refs.playerTwo){` (line 316); `errors.push(\`Save ${index + 1} assigns the same Local Profile to both manager roles.\`);` (line 317). |

Still open: 0
