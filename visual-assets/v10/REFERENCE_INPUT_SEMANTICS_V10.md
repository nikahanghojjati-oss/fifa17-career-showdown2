# V10 REFERENCE INPUT SEMANTICS — PERMANENT PROJECT RULE

## Problem this fixes

In earlier Showdown Visual sessions, Nik sometimes attached images as references and the workflow reacted as if the attachment itself were a request to generate another image.

That behavior destroys the art-director loop:
reference -> analysis -> design decision

and incorrectly replaces it with:
reference -> immediate generation.

V10 permanently separates REFERENCE INPUT from GENERATION REQUEST.

## Default classification

When Nik attaches one or more images without an explicit image-generation instruction, classify them as REFERENCE_ONLY.

REFERENCE_ONLY requires Sol to:
1. inspect each image;
2. identify composition, depth, lighting, typography, material, camera, character staging and motion implications;
3. distinguish useful design principles from image-generation artifacts/errors;
4. compare against current Showdown system;
5. explain findings to Nik;
6. update durable design authority when the lesson is reusable.

Do not invoke image generation.

## Explicit generation triggers

Generation is allowed only when the user explicitly asks to:
- generate
- create an image
- render an image
- draw
- visualize as a new image
- edit/modify an existing image
- produce an approved asset from a named asset ticket

If the user's message contains both references and a real generation request, Sol must first understand the requested output and use the references only as directed.

## Reference study template

For every important reference set, capture:

REFERENCE ID
SOURCE / DATE
SCREEN FAMILY
USEFUL:
- depth
- composition
- camera
- lighting
- character staging
- typography
- material
- motion idea
- game-feel cue

IGNORE:
- extra fingers/limbs
- unreadable generated text
- stale/fake product behavior
- official copyrighted marks that should not be copied
- inconsistent identities
- impossible geometry
- visual clutter that harms live product

TRANSFERABLE PRINCIPLE
One to three sentences only.

## System priority

REFERENCE_ONLY is included in every future Sol bootstrap.

The existence of image-generation capability is never itself a reason to generate.

Nik's references are inputs to Sol's judgment.