# STUDIO WORKFLOW AND MODEL ROUTING V2

Status: ACTIVE
Date: 2026-09-27
Owner: Nik
Lead Visual Producer: Claude Opus 5.5
Program Coordinator / Product-Truth Guard / Repo Steward: GPT-5.6 Sol

This supersedes the old visual router and old Claude effort policy where they conflict.

## Core rule

Opus decides. Sonnet executes. Sol coordinates and protects product truth.

Higher effort is not authority. Nik remains final taste authority.

## Default roles

| Work | Surface | Model | Effort |
| --- | --- | --- | --- |
| New world set / signature screen family package | Claude Chat Project | Opus 5.5 | Extra |
| Reuse-screen producer package | Claude Chat Project | Opus 5.5 | High |
| Asset gate review | Claude Chat Project | Opus 5.5 | High |
| Static key-frame build | Claude Code Cloud | Sonnet 5 | High |
| Stage Engine v1 / first-of-kind architecture | Claude Code Cloud | Opus 5.5 | High |
| Later slices / revisions | Claude Code Cloud | Sonnet 5 | High; Medium for tiny bounded revisions |
| Asset intake mechanics | Claude Code Cloud | Sonnet 5 | Medium |
| Player-photo library tooling / pilot | Claude Code Cloud | Sonnet 5 | High |
| First production integration | Claude Code Cloud | Opus 5.5 | High |
| Later production integrations | Claude Code Cloud | Sonnet 5 | High |
| Integration architecture review | ChatGPT Work | GPT-6 Sol | High |
| Cinematic spot-check | ChatGPT | GPT-6 Astra High | High |
| Runtime browser QA | Claude in Chrome | extension model | default |
| Likeness image generation | Plain ChatGPT New chat outside any Project | ChatGPT image generation | Follow `LIKENESS_IMAGE_WORKFLOW_V1.md` |
| Coordination / state / branches / product truth | ChatGPT | GPT-5.6 Sol | current |

If Sonnet 5 is unavailable in the Cloud model picker, use Opus 5.5 at Medium for Sonnet-designated rows and record the actual model in the result handoff.

## Economy rules

- Fresh Claude Project chat per task.
- Minimum context: current package + named evidence only.
- Static before motion; approved assets before builds.
- One producer review per frozen checkpoint.
- Two failed Sonnet corrections on the same issue -> escalate only that issue to Opus Cloud.
- Max is never a default.
- Keep Cloud credit reserve for main-game readiness.
- Every Cloud result records model, effort and credit burn if visible.

## Production loop

1. Nik -> Claude: reference intake.
2. Claude: producer package.
3. Sol: product-truth reconciliation and durable commits.
4. Nik: generate approved image tickets.
5. Claude: asset gate APPROVE / REGENERATE.
6. Cloud Sonnet: static checkpoint.
7. Claude: checkpoint verdict.
8. Cloud: motion/states checkpoint; first Stage Engine pass may use Opus.
9. Claude: checkpoint verdict -> owner review.
10. GPT-6 Sol Work architecture review once before first production integration.
11. Cloud integration.
12. Claude in Chrome runtime milestone QA.

## Screen tiers

Tier S:
- Transfer
- Season Summary
- Home

Tier A:
- Dashboard
- Season Results Entry
- League wheel
- Club wheel
- Create Showdown

Tier B:
- Loading
- Legacy / records

## Cross-screen reuse

Build once and reuse:
- Stage Engine
- HUD Kit
- WS-1 War Room
- WS-2 Tunnel and Pitch
- WS-3 Trophy Hall
- cross-screen pose library

The visual system is quality-first. Performance is a usability floor, not the art-direction goal.

## Likeness image generation standard

Canonical standard:
`visual-assets/v10_1/coordination/LIKENESS_IMAGE_WORKFLOW_V1.md`

For every image showing Daniel or Nik, use that document rather than reconstructing the method from this routing file.

Key routing invariant:
- plain New chat outside any ChatGPT project;
- one golden anchor only;
- edit the anchor rather than generate from a text-only identity description;
- exact producer prompt, no rewrite;
- one image per chat;
- return to the golden anchor for every new pose.

Current golden anchors:
- Daniel: `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`
- Nik: `POSE_TRANSFER_NIK_TACTICAL_V1.png`

The Gate 0 R2 Window poses are approved assets but are not golden anchors.
