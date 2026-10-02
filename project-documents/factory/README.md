# Showdown Factory

Claude (lead) writes the jobs. GPT-5.6 Sol chats do them. Codex reviews only job 101 (online history data) and job 108 (final package).

- **Nik:** paste [FACTORY_RULES.md](FACTORY_RULES.md) once into the ChatGPT "Visual" project instructions. Then open a new chat there and type a number. Run up to 5 chats at a time. [BOARD.md](BOARD.md) shows which numbers are ready.
- **Workers:** the rules in FACTORY_RULES.md, the facts in [PRODUCT_TRUTH.md](PRODUCT_TRUTH.md), the exam in [QUALITY_BAR.md](QUALITY_BAR.md), the lesson in [CRAFT_GUIDE.md](CRAFT_GUIDE.md), the job in `jobs/JOB-NNN.md`, progress in `status/JOB-NNN.md`.
- **Mockups and goals:** `mockups/` (reference only; they contain real logos and must never ship).
- **Claude:** watches pushes to `factory/v1-wtt5ye`, regenerates the board with `python3 project-documents/factory/tools/board.py`, answers BLOCKED questions in the status files, and takes a look at each screen's finish line.

Flow per screen: truth sheet → plate → build (desktop) → phone → independent review (scorecard) → one fix round → motion → Claude look. Then integration: showcase, data binding, phone pass, motion pass, final review, package for Nik's approval. Nothing goes to `main` from the factory.
