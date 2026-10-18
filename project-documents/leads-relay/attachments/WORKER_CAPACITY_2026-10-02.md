# Worker capacity: how many GPT-5.6 Sol chats, against Nik's ChatGPT limits

Date: 2026-10-02. Author: Claude (Team V). Scope: research only. Nothing on the factory board was changed.

## 1. The answer in one table

| | Team V (visual) | Team G (gameplay) | Both together |
|---|---|---|---|
| Jobs | 126 on the board (765 steps, 18 Claude looks) | estimate 30–45 (16 listed G-0..G-15 plus 10–25 bug jobs and fix rounds) | ~160–190 worker sessions incl. ~15% redo |
| Chats at once | **3–4** | **1–2** | **5, never more than 6** |
| Sessions per day (10 h of Nik) | 30–40 | 8–12 | 40–50 |
| Realistic finish | **Wed 7 Oct** (range Tue 6 – Fri 9) | **Fri 9 Oct** (range Wed 7 – Mon 12) | |
| Saturday 3 Oct? | No: ~60–80 V jobs done, roughly half | G-0..G-6 plausible | |

The key fact: **both teams' workers run on Nik's one ChatGPT account, so they share one allowance.** Opening more chats does not add capacity; it only spends the same allowance faster and adds review backlog. Five at once is the right total.

## 2. Published limits (what applies to us)

| Limit | What is published | Source, date |
|---|---|---|
| Work mode + Codex | **One shared pool.** Plus: GPT-5.6 Sol ≈ **10–100 messages per 5 h**; Pro 5x 50–500; Pro 20x 200–2,000. A weekly cap applies on top. Not a fixed count: big inputs, high reasoning, screenshots and multi-step tasks drain it faster. Purchased resets exist for Plus/Pro. | OpenAI Help, "Managing usage with GPT-6 Astra in Work and Codex" (read 2026-10-02) |
| 5-hour window on Plus | Removed in July, **restored for Plus on 25 Aug 2026** (Work and Codex). Pro tiers kept no 5 h window "for the upcoming months", weekly cap only. | 9to5Mac, 24 Aug 2026; BleepingComputer, 12 Jul 2026 |
| Plain chat with Sol | **Not published by OpenAI.** Chat is a separate pool from Work/Codex. Third-party figures conflict (one blog even claims Sol is Pro-only, which Nik's own use disproves). | digitalapplied (GPT-5.6 week one); tokenkarma (Jul 2026) |
| Image generation | **Not published.** Observed on Plus ≈ 40–50 images per rolling 3 h; Pro "unlimited, faster, subject to abuse guardrails". | theaicareerlab, Sept 2026; chatgpt.com/pricing |
| Pro $200 (20x) | New sign-ups/upgrades reportedly **paused since Sept 2026**; Pro $100 (5x) is the realistic upgrade. Unverified on the pricing page. | simplemetrics (2026) |
| Active tasks | 10 at a time on Plus. Not a constraint for 5 chats. | customgpt.ai (May 2026) |
| Push to GitHub / screenshots from plain chat | **Not published for our setup.** Work mode and Codex have a terminal and can run Playwright and git. Whether a plain Sol chat can push and take screenshots is exactly what factory **job 0** tests. | — |

Safe working assumptions where nothing is published: plain-chat Sol ≈ 150–300 long messages per day per account across all chats; images ≈ 40 per 3 h; Work/Codex on Plus ≈ 3–5 real jobs per 5 h window before it stops.

## 3. Where the limits bite first

1. **Work mode on Plus, if job 0 says plain chat can't screenshot.** The board then sends 82 jobs to Work mode, plus all of Team G's test jobs and Codex reviews, all in one pool of 10–100 Sol messages per 5 h. A screenshot job of ~6 steps costs 15–30 messages, so Plus gives ~3–5 jobs per window: about **15–25 per day for both teams combined**, against ~150 needed. That is the hard wall (~1.5 weeks extra).
2. **Image generation** (25 image jobs, maybe 100–250 images with retries). At ~40 per 3 h it is a pacing limit, not a wall: run at most 1–2 image chats at once and spread them.
3. **Claude, not ChatGPT.** Each finished job needs a Claude review or look (18 looks, ~120 status checks). This spends Nik's Claude weekly limit (resets 9 Oct) and Nik's attention. Past ~5 parallel chats the review queue grows faster than it drains.
4. **Team G's chain is serial**: G-1 → G-2 → G-7 (hardest, Codex review, may need a cloud rescue) → G-8 → G-9 → G-13 (waits on the approved visual package) → G-15 (one real two-device run with Nik). Extra chats cannot shorten it.

## 4. Quality versus parallelism

- **Sweet spot is 5 total.** Quality drops above that for three reasons: (a) shared-file collisions (every worker pushes status to one tracker branch; fast-forward rejections and overwritten BOARD/status edits start at ~5–6 concurrent pushers); (b) review backlog, since jobs waiting on a Claude look go stale and get built on unchecked foundations; (c) two chats touching the same screen's CSS/JS conflict.
- **Never run two jobs on the same screen at once** (build and phone of one screen are sequential). Prefer one chat per screen family.
- **Job size:** one job = one screen step = 20–40 minutes, at most ~6 steps, one file area. Anything over 45 min splits. Smaller jobs cost more review overhead than they save.
- **Mix the slots:** of Team V's 3–4, keep at most 1–2 image chats and at most 1 Work-mode chat (on Plus) at any time.

## 5. Which job goes where

| Surface | Job types |
|---|---|
| Plain Sol chat | Truth sheets, job-file docs, static builds and fixes **if** job 0 proves it can push. Image jobs (plates, trophies) in a chat with image generation. |
| Work mode (shares the Codex pool) | Anything needing a terminal: screenshots, phone checks at 393×660 / 360×640, Playwright, emulator tests. All Team G test jobs (G-1, G-2, G-12, G-14). |
| Codex | Review only: V job 101 (online history) and 108 (final check); G-7, G-8, G-10, G-12 and the gated PR into main. One review per PR. |
| Claude Code cloud | Only G-7 if two worker attempts fail. |

## 6. Is upgrading worth it?

- **If job 0 shows plain chat can push and screenshot:** stay on Plus. Limits are pacing only (images, Claude review). Finish ≈ Wed 7 Oct (V) / Fri 9 Oct (G).
- **If job 0 shows screenshots need Work mode:** **Pro $100 (5x) for one month is worth it.** It lifts the shared Work/Codex pool 5x and drops the 5 h window, turning a ~2-week Work-mode crawl into the ~5-day plan above, and makes images effectively unlimited. Pro $200 is likely unavailable to new sign-ups and isn't needed. A cheaper middle step is buying resets on Plus for the peak days.

## Sources

- [OpenAI Help: Managing usage with GPT-6 Astra in Work and Codex](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex)
- [9to5Mac: OpenAI restores 5-hour Codex and Work limits for Plus (24 Aug 2026)](https://9to5mac.com/2026/08/24/openai-restores-5-hour-codex-and-work-limits-for-chatgpt-plus-users/)
- [BleepingComputer: OpenAI temporarily relaxes GPT-5.6 Sol usage limits (12 Jul 2026)](https://www.bleepingcomputer.com/news/artificial-intelligence/openai-temporarily-relaxes-gpt-56-sol-usage-limits/)
- [digitalapplied: GPT-5.6 week one, usage pools](https://www.digitalapplied.com/blog/gpt-5-6-week-one-usage-pools-access-rollout-2026)
- [theaicareerlab: AI usage limits compared (Sept 2026)](https://theaicareerlab.com/blog/ai-usage-limits-compared-2026)
- [simplemetrics: ChatGPT Codex limits 2026](https://simplemetrics.xyz/chatgpt-codex-limits-2026/)
- [tokenkarma: OpenAI rate limits July 2026](https://tokenkarma.app/blog/openai-rate-limits-july-2026/)
- [customgpt.ai: ChatGPT Plus limits 2026](https://customgpt.ai/chatgpt-plus-limits-2026/)
- [ChatGPT pricing](https://chatgpt.com/pricing/)
- Board figures: `project-documents/factory/BOARD.json` on `factory/v1-wtt5ye` @ f968f76. Team G scope: `GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md` §5.
