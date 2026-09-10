# Audius Free Quota / Billing Guard — 2026-09-10

Status: ACTIVE ZERO-DOLLAR SAFETY DECISION

Verification date: 2026-09-10.

Official Audius developer documentation currently lists:

- Free: 10 requests/second;
- Free: 500,000 requests/month;
- wording: `The Free plan is always free with no restrictions.`;
- Unlimited: separate higher-limit plan obtained by contacting Audius.

The Audius API Plans page likewise presents `Free` and `Unlimited` as separate plans and labels Free `No Restrictions. Always Free.`.

## Billing interpretation for Career Mode Showdown

The public Audius documentation reviewed does not describe per-request overage billing, an automatic paid upgrade, or a requirement to attach a payment card to the Free plan. It presents Unlimited as a separate plan that requires contacting Audius.

Therefore the project policy is:

`AUDIUS_FREE_ONLY = true`

`PAID_UPGRADE_ALLOWED = false`

`AUTO_OVERAGE_ALLOWED = false`

`PAYMENT_METHOD_ALLOWED = false`

The project will not enroll in Unlimited, attach a billing method for API overage, or accept any future automatic paid fallback. If Audius changes the Free plan so a card or paid overage is required, Audius becomes `FINANCIAL_HOLD` and the music lane is disabled until another truly zero-dollar provider is approved. Career Mode itself must continue normally.

If the Free quota is exhausted or a rate limit is reached, the player must fail closed: stop new Audius requests, show an unavailable/quota state, and retry only after a safe reset/backoff window. It must never solve quota exhaustion by upgrading or charging.

## What 500,000 requests/month means in songs

There is no reliable one-to-one conversion between `API request` and `song play`. A play can involve more than one request. The exact count depends on whether track metadata/IDs are shipped in the app, whether a canonical URL must be resolved, and how the stream endpoint/browser handles retrieval and byte ranges.

The current proposal should therefore plan conservatively rather than claim 500,000 songs.

Illustrative monthly capacity:

| Planning assumption | Approx. song starts/month | Approx. song starts/day |
| --- | ---: | ---: |
| 1 counted request / song | 500,000 | 16,667 |
| 2 counted requests / song | 250,000 | 8,333 |
| 3 counted requests / song | 166,666 | 5,556 |
| 4 counted requests / song | 125,000 | 4,167 |
| 5 counted requests / song | 100,000 | 3,333 |
| 10 counted requests / song | 50,000 | 1,667 |

For infrastructure planning, R8 uses a deliberately conservative working envelope of `3–5 counted requests per song start` until device/network proof establishes the real request pattern. That still corresponds to roughly `100,000–166,000 song starts/month`.

At 5 requests/song, even users averaging 10 song starts per day would consume the monthly quota only at roughly 333 such daily active users. The expected private/small-audience Career Mode Showdown usage is far below that scale.

This is only a capacity estimate. It is not a provider guarantee that stream byte-range requests are counted in a particular way.

## Request-minimizing implementation rule

Final implementation should:

1. ship a tiny curated manifest containing stable Audius track IDs and display metadata;
2. avoid `/resolve` on every play after track IDs are curated;
3. avoid catalogue search/trending calls during ordinary Home visits;
4. create only one browser `<audio>` authority;
5. request only the selected track after deliberate user Play;
6. reuse cached non-sensitive metadata;
7. use bounded retry/backoff;
8. surface quota/provider failure locally without affecting the game.

This architecture is intentionally designed to make the 500,000-request ceiling extremely difficult for the expected project usage to approach.

## Final safety gate

Audius remains an acceptable primary proposal provider only while all of the following remain true:

- Free plan remains genuinely $0;
- no payment method is required for this use;
- no automatic overage billing exists;
- no automatic paid upgrade exists;
- public stream/API use remains permitted for the selected tracks;
- selected tracks pass rights/provenance review;
- iPhone Safari and Chromebook playback proof passes.

If any financial condition fails, drop Audius rather than weaken the zero-dollar invariant.
