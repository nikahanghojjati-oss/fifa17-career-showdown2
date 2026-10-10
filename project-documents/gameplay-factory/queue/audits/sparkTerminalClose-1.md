# sparkTerminalClose.js audit, first half (lines 1-29)

no findings

Riskiest places checked:
1. Line 25-27 (`stcNormalizeOptions`): the intent is verified and its rivalryId and sessionId are compared with the options. Mismatches fail closed with a code. No silent path found.
2. Line 28: `nowEpochMs` uses `Number(...)` and rejects non-finite or non-positive values. A timestamp of 0 or null cannot slip through.
3. Line 15-20 (`stcHashEnvelopeValue` / `stcVerifyEnvelope`): the hash is computed over canonical JSON with sorted keys, and the shape check runs before the hash check. This looks consistent with the envelope builder in the second half.
