# Image Generation Orchestration Guardrail

Status: ACTIVE PROPOSAL PROCESS GUARDRAIL

Scope: visual-proposal workflow only. This file creates no production runtime, Firebase, storage, scoring, synchronization, provider, billing, or gameplay authority.

## Purpose

Prevent reference uploads, interrupted-session context, or image-generation availability from bypassing the main reasoning/orchestration layer.

The main GPT reasoning layer remains the operator. Image generation is an execution component only.

## Hard invocation gate

Do not invoke image generation merely because the owner uploads one or more images.

Before every generated character asset, the main reasoning layer must explicitly resolve all of the following:

1. exact asset ID;
2. exact manager identity;
3. exact role/presentation purpose;
4. primary identity reference;
5. secondary resemblance references, if any;
6. explicitly excluded other-manager references;
7. pose/body-language contract;
8. wardrobe contract;
9. background/crop/resolution contract;
10. forbidden logos/text/props/capabilities;
11. face-first acceptance gate;
12. anatomy/hand/prop gate after identity passes;
13. retry scope if rejected;
14. owner-finality status.

If any item is unresolved, generation waits.

## Reference isolation

For a Nik asset, do not pass Daniel reference material into the generation lane.

For a Daniel asset, do not pass Nik reference material into the generation lane.

A multi-manager poster may inform broad R8 atmosphere only when necessary. It must not be treated as primary identity authority.

Raw owner-supplied photographs are private resemblance-study inputs. Do not commit them to the public repository and do not use them as final character art.

Prefer a small reference set over a large mixed bundle. More references are not automatically better.

## Identity hierarchy

Primary identity source:

- strongest approved or owner-liked stylized AI identity for the selected manager;
- immutable A01/A02 authority remains the final comparison anchor where available.

Secondary real-photo sources:

- geometry checks only: face shape, eyes, brows, nose, jaw/chin, hairline, facial-hair pattern and apparent age;
- they must not override the established AI illustration/rendering family.

Style sources:

- R8 black/charcoal/gold lighting and football-manager presentation language;
- style reference must not silently become face authority.

## One-asset rule

Generate exactly one role for exactly one manager per asset attempt.

Never:

- generate a multi-pose final sheet;
- generate Nik and Daniel together when resolving an individual master;
- regenerate A01 or A02;
- continue to the next role merely because the current one consumed time or generation capacity;
- promote an image because the body or lighting is attractive when the face gate fails.

## Face-first QA

Judge recognizable identity before pose polish.

Immediate rejection if overall resemblance materially drifts in any combination of:

- head/face shape;
- eye spacing or eye shape;
- brow geometry;
- nose proportions;
- jaw/chin proportions;
- hairline or hair mass;
- beard/stubble pattern;
- apparent age;
- recognizable overall identity family.

A failed identity gate ends that attempt. Do not evaluate it into the manifest as a candidate.

## Post-identity QA

Only after face-first QA passes, inspect:

- hands and finger count/shape;
- arms, shoulders and limb continuity;
- clothing anatomy and folds;
- prop geometry where applicable;
- silhouette usefulness for compositing;
- transparency or maskability;
- baked text/logos/crests;
- role distinctness from already-approved poses.

## Owner explanation rule

Before each new role generation, the main reasoning layer should briefly tell the owner what exact asset is being attempted and what references/role constraints are active.

Reference upload is context, not an automatic generation trigger.

## Current A03 lock

Current exact role: `A03_NIK_CONFIDENT_PRESENTATION`.

Current method:

- Nik only;
- preferred Nik black-formal stylized AI portrait is the primary identity source;
- clear real Nik photos are secondary face-truth checks only;
- Daniel references excluded;
- wide two-manager Showdown artwork excluded from identity generation; its black/gold atmosphere is represented through written R8 style constraints instead;
- stable three-quarter confident presentation pose, not another walking Home hero;
- formal black/charcoal wardrobe;
- clean transparent or cleanly maskable full-resolution asset;
- no baked UI copy;
- no EA/FIFA/league/club logo;
- no proprietary-looking crest;
- believable anatomy and hands.

The previously generated stride image remains rejected and is not an A03 candidate.

## Finality

Internally passing generated art remains an internal candidate until explicit owner approval.

No generated character asset is final merely because generation and internal QA succeeded.
