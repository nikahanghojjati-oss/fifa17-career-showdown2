# transferScreenV10-1 (JOB-1569): first-half audit of js/transferScreenV10.js

Result: no findings.

Riskiest places checked:
1. `toTransferFrame` viewer and lock fields (js/transferScreenV10.js lines 61-96): `windowLive`, `guessesLocked` and `signingsLocked` depend on the phase, the replay flag and the provider's own lock lists, so a replay is never shown as live and a locked role is never shown as editable.
2. The verdict and guess mapping (lines 83-92): `guessesAgainst.playerOne` is the rival's guesses against playerOne, and `guessesAgainst.playerTwo` the reverse. Both branches were traced for viewer playerOne and playerTwo and match the comment at line 91.
3. `adoptionPlan` field prefixes (lines 128-136): `p1` is playerOne (Daniel) and `p2` playerTwo (Nik) for own signings, and guess inputs are named after the manager they target. This matches the production prefixes stated in the comment at line 127.
