"use strict";

// r91 cut step 4. This file used to run the unpublished candidate Shared Setup Rules (firestore.shared-setup-candidate.rules,
// now deleted) with its own fixtures, including an expired-session denial that the production Rules deliberately no longer
// make (r84 trim). The frozen SSJR-2 model still names this path as setup-confirmation evidence, so the path stays and
// runs the production proof instead: paired ACTIVE-session authority, exact-two-manager gating, CAS/idempotency, direct
// modified-client denial, same-rivalry fresh-session continuity and identical confirmation, on the generated production Rules.
require("./shared-showdown-setup-production-provider-emulator.cjs");
