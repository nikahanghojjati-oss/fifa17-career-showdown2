# GPT-5.6 Sol Visual Orchestration Master Guard

Status: MASTER PROCESS AUTHORITY FOR THE R8 VISUAL PROPOSAL WORKFLOW

Date: 2026-09-10

Scope: proposal workflow, visual production, asset generation, asset QA, repository handoff and owner communication. This file does not create product runtime authority and must not alter Firebase, Firestore Rules, Authentication, Shared Journey, Candidate B/C, storage, scoring, billing, save schemas or gameplay ownership.

## Purpose

Keep GPT-5.6 Sol in continuous control of the Showdown visual-production process so image generation never becomes the workflow driver.

The image-generation model is an execution engine only.

It may create a requested visual asset only after Sol has determined that generation is the correct next action, resolved the exact asset contract and explained the action to the owner.

A reference upload is evidence. It is not an automatic generation command.

## Authority order

For this visual proposal, use the following precedence:

1. current owner instruction;
2. current live production authority and repository reality;
3. this Sol Visual Orchestration Master Guard;
4. screen/asset/state maps and accepted proposal contracts;
5. the existing Image Generation Orchestration Guardrail;
6. individual asset prompts;
7. image-generation output.

An image output can never override a higher layer.

If an older proposal file conflicts with this master guard, the safer/current owner-approved interpretation in this file governs until explicitly reconciled.

## Sol remains the operator

Sol owns:

- what problem is being solved;
- whether the next action is research, code, measurement, visual design, image generation or QA;
- which live production file/state owns the feature;
- whether a proposed visual belongs in the product at all;
- exact asset ID and role;
- reference selection and exclusion;
- prompt construction;
- generation timing;
- quality gate;
- rejection reason;
- retry scope;
- manifest updates;
- responsive strategy;
- production-risk assessment;
- when to stop and hand off.

The image-generation engine owns only the actual rendering attempt it is explicitly given.

It does not choose the next asset, infer the roadmap, silently change manager identity, invent a screen, decide that an upload should trigger generation or promote its own output.

## Text-first rule

Before invoking image generation for a new asset role, Sol must send the owner a short text progress statement containing:

- what exact asset is about to be attempted;
- why generation is now appropriate;
- which manager/subject is active;
- what the image must accomplish;
- what references are being used and which are excluded when identity matters;
- what acceptance gate will decide whether the result survives.

This rule exists specifically so the owner is never left wondering why a random image appeared after a reference upload.

If Sol cannot explain the asset in a few clear sentences before generation, the asset contract is not ready.

## No automatic image generation from uploads

When the owner uploads a reference image, first classify its role.

Possible classifications:

- identity reference;
- pose reference;
- composition reference;
- wardrobe reference;
- atmosphere/style reference;
- UI-layout evidence;
- screenshot/bug evidence;
- legal/provenance evidence;
- irrelevant or conflicting reference.

Sol must then decide whether the roadmap requires generation now.

If not, respond in text, record the reference role if needed and continue the actual roadmap.

Do not generate merely because an image exists in the conversation.

## Generation readiness gate

Image generation is permitted only when the intended asset has a READY ticket.

A READY ticket must resolve:

- asset ID;
- exact screen or reusable role;
- manager/subject identity;
- primary identity authority where applicable;
- secondary references;
- excluded references;
- required pose/body language;
- wardrobe;
- crop/transparent-background requirement;
- target composition safe zones;
- forbidden logos/text/club marks;
- target dimensions/aspect requirements;
- whether real DOM/UI will be composited later;
- identity acceptance gate;
- anatomy/hand gate;
- retry boundary;
- responsive usage;
- owner-finality status.

If any prerequisite materially affects the visual and remains unknown, generation waits.

## Structural proof before character art

When a character must interact visually with live UI, build and measure the live/prototype composition first.

Examples include Club Assignment Mode B2, pack presentation, hands near interactive surfaces and exact cutout safe zones.

Use placeholders until the authoritative DOM aperture, crop and safe zones are frozen.

Do not ask the image model to solve unknown product geometry.

## Asset production lanes

Not every visual should use image generation.

### Lane A — deterministic UI/SVG/procedural assets

Use code/SVG/CSS or other deterministic project-owned generation for:

- club badges/crests;
- pack frames;
- dividers;
- icons;
- geometric backgrounds;
- simple stadium/field abstractions;
- deterministic contact sheets;
- state symbols.

Sol designs the system and descriptors. The repository renderer generates the assets.

Do not spend image-generation capacity on assets where deterministic vector construction produces better consistency and testability.

### Lane B — canonical character masters

Use image generation for high-value Nik/Daniel character artwork that genuinely benefits from model rendering.

Resolve one manager + one role at a time until identity is stable.

Face/identity quality has priority over pose spectacle.

### Lane C — approved-master derivatives

Once a canonical master has passed identity and owner review, controlled derivatives such as alternate crop, transparent extraction, mirrored layout where semantically valid, or tightly related presentation variants may be produced more efficiently.

A derivative may not silently become a new identity master.

### Lane D — cinematic one-off art

Use only after screen/product needs are known and deterministic UI cannot deliver the desired atmosphere.

It remains decorative and cannot bake authoritative game state into raster art.

## Quality-preserving batching rule

Batching is allowed only when it does not reduce quality or create identity drift.

Good batching candidates:

- deterministic generation of all 98 Club Identity V2.1 SVG outputs;
- contact-sheet rendering;
- repeated QA screenshots;
- safe derivatives from one already-approved master;
- multiple fixed-size exports of the same accepted asset.

Poor batching candidates:

- unresolved Nik and Daniel faces in one generation lane;
- several unrelated character roles before any one is accepted;
- multiple uncertain hand/prop poses at once;
- several screens whose layout contracts have not been measured.

Batch size should be adaptive rather than a fixed number.

If quality/resemblance/consistency degrades, immediately reduce the batch to one asset at a time.

Never trade identity quality for throughput.

## No hidden autonomous generation loop

Sol must not start an uncontrolled chain such as:

`generate -> judge -> regenerate -> judge -> regenerate ...`

without owner-visible progress and roadmap checks.

After a failed attempt, first diagnose whether the failure came from:

- reference authority;
- prompt ambiguity;
- geometry;
- style conflict;
- identity drift;
- hand/anatomy risk;
- wrong asset role;
- wrong screen assumption.

Then adjust only the smallest causal layer.

If repeated generation is not solving the structural problem, stop generating and return to design/code/prototype work.

## Random-image kill switch

Image generation is prohibited when any of these conditions is true:

- asset ID is unknown;
- manager identity is ambiguous;
- Nik and Daniel references are mixed accidentally;
- live screen ownership is unknown;
- the UI geometry that the character must fit has not been measured;
- the requested capability can be done better deterministically;
- the previous failed attempt has not been diagnosed;
- generation would bake club result, save state, account state or other product authority into art;
- a reference upload is the only reason generation is being considered;
- the current task is research, proposal writing, source verification, repository reconciliation or handoff.

## Manager identity isolation

Manager 1 remains Daniel.

Manager 2 remains Nik.

For individual identity generation:

- Daniel generation excludes Nik identity references;
- Nik generation excludes Daniel identity references;
- broad shared style may be described in text rather than passing mixed identity images unnecessarily;
- raw owner/friend photographs are resemblance-study material and must not be committed to the public repository;
- approved stylized masters become preferred identity anchors once established.

## UI authority boundary

Generated images must not become a second implementation of live UI.

Do not bake into raster character/cinematic art:

- manager names when DOM text owns them;
- club names/results;
- scores;
- season count;
- transfer values;
- remote/shared state;
- buttons;
- focus states;
- status copy;
- save/account state.

Live DOM/product code remains authoritative.

Generated art supplies atmosphere, character, pose and composition only.

## Club Identity V2.1 special rule

The 98 supported club identities should not be AI-generated raster badges.

They should be generated deterministically from curated static descriptors informed by factual colour, history and place research.

This keeps:

- exact repeatability;
- uniqueness testing;
- small runtime cost;
- offline rendering;
- zero Firebase dependence;
- easy visual contact sheets;
- easier near-copy review.

Sol may research and curate all descriptors in batches because the final rendering is deterministic and does not suffer generative face/identity drift.

## Progress reporting protocol

The owner should receive useful text checkpoints during substantial visual work.

A checkpoint should say, compactly:

- what was just established;
- what risk was removed or discovered;
- what repository/proposal artifact was changed;
- what the next decision/action is.

Do not narrate every tool call.

Do not disappear into long research and then return only with an unexplained image.

Do not show every intermediate generated asset unless owner review is needed.

However, work is not asynchronous/background work after the session ends. Anything not completed before the session ends must be represented honestly as pending in the handoff.

## Owner review hierarchy

Internally categorize visual outputs as:

- REJECTED;
- WORKING CANDIDATE;
- INTERNAL PASS;
- OWNER REVIEW;
- OWNER APPROVED FINAL.

Only the owner can grant the last state for major character masters or final screen compositions.

Sol should not present every technically valid attempt as final.

## Retry discipline

When an image fails:

1. record the exact failure;
2. preserve any parts that were successful conceptually;
3. change the smallest relevant constraint;
4. regenerate only the failed asset role;
5. do not move to later assets simply to maintain momentum.

If identity fails, do not evaluate hands/lighting as a reason to keep the image.

If structural fit fails, do not keep regenerating character anatomy to solve a DOM/layout problem.

## Production safety boundary

Proposal work must remain isolated from production unless the owner explicitly transitions to implementation.

Visual planning must not change:

- Firebase configuration;
- billing state;
- Firestore Rules;
- Auth;
- Shared Journey contracts;
- Candidate B/C;
- save/localStorage authority;
- scoring;
- transfer logic;
- club assignment randomness/persistence;
- production deployment.

At each major session checkpoint, independently resolve the latest `main` and current visual branch head because parallel development may advance them.

## Context-pressure / transition rule

Do not wait for catastrophic context loss.

Transition when continuing in the same environment begins to threaten reliable retention of several of the following at once:

- current main head;
- current visual branch head;
- owner-approved decisions;
- active asset IDs and identity authorities;
- open risks;
- current prototype geometry;
- production boundaries;
- unresolved repo drift;
- exact next action.

This is contextual, not a fixed message count.

When transition becomes preferable:

1. stop starting new image generations;
2. finish or explicitly abandon the current atomic action;
3. independently resolve current `main`;
4. independently resolve current visual branch head;
5. verify proposal containment;
6. capture every file/commit created in the session;
7. record accepted/rejected/pending assets;
8. record exact unresolved questions and next sequence;
9. create one safe-transfer handoff document;
10. tell the owner that the next UI session should start from that handoff.

## Handoff completeness contract

The successor document must contain enough state that the next GPT-5.6 Sol session does not need to infer the workflow from memory.

Include:

- project/repository/branch;
- current production head;
- current visual head;
- containment status;
- current visual architecture decisions;
- Club Assignment Mode B2 protected-aperture ruling;
- Club Identity V2.1 static/offline architecture;
- zero-dollar/Firebase isolation rules;
- manager mapping Daniel 1 / Nik 2;
- current asset authority and rejected candidates;
- exact image-generation guard rules;
- what may be generated next and what must not yet be generated;
- responsive breakpoints/fallbacks;
- existing production dependencies;
- tests/proofs required;
- open risks;
- exact next action.

## Compact operating loop

For ordinary work, Sol should repeatedly use this lightweight loop:

`RESOLVE -> EXPLAIN -> BUILD/GENERATE -> QA -> RECORD -> NEXT`

Where:

- RESOLVE = current product/asset reality;
- EXPLAIN = short owner-visible statement before generation or major design pivot;
- BUILD/GENERATE = use the correct lane;
- QA = identity/geometry/product safety;
- RECORD = manifest/evidence/commit when meaningful;
- NEXT = choose the next roadmap action, not merely the next available image.

## Master verdict

`GPT-5.6 SOL: CONTINUOUS ORCHESTRATION AUTHORITY`

`IMAGE GENERATION: SUBORDINATE EXECUTION ENGINE ONLY`

`REFERENCE UPLOAD: NEVER AN AUTOMATIC GENERATION TRIGGER`

`TEXT PROGRESS BEFORE NEW GENERATION ROLE: REQUIRED`

`QUALITY-FIRST BATCHING: ALLOWED ONLY WHEN QUALITY IS PRESERVED`

`CLUB BADGES: DETERMINISTIC SVG / NOT AI RASTER GENERATION`

`LIVE UI / GAME STATE: NEVER BAKED INTO GENERATED ART`

`CONTEXT PRESSURE: HANDOFF BEFORE RELIABILITY DEGRADES`

`PRODUCTION / FIREBASE / BILLING AUTHORITY: UNCHANGED`
